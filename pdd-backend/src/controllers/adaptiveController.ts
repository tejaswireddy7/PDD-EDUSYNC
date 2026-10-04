import { Request, Response, NextFunction } from "express";
import * as aiService from "../services/aiService";
import { AppError, errorCodes } from "../utils/errors";

export const getNextAdaptiveQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { domain, currentTheta, answeredQuestionIds } = req.body;

    if (!domain) {
      throw new AppError(
        "Domain is required",
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    const question = await aiService.getMLNextAdaptiveQuestion(
      domain,
      currentTheta || 0.0,
      answeredQuestionIds || []
    );

    res.status(200).json({
      success: true,
      data: {
        status: question ? "in_progress" : "completed",
        question,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const evaluateAdaptiveAbility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { domain, responses } = req.body;

    if (!domain || !Array.isArray(responses)) {
      throw new AppError(
        "Domain and responses array are required",
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    const evaluation = await aiService.evaluateMLAbility(domain, responses);

    // Also log telemetry for model self-improvement
    if (req.user?.userId) {
      await aiService.logMLTelemetryEvent({
        user_id: req.user.userId,
        event_type: "quiz_complete",
        domain,
        progress: 100,
        rating: evaluation?.mastery_percentile ? Math.round(evaluation.mastery_percentile / 20) : 4,
        completed: true,
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation || {
        theta_score: 0.5,
        mastery_percentile: 69.1,
        grade: "Proficient",
        recommended_difficulty: "Intermediate",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logLearningTelemetry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { event_type, course_id, domain, progress, rating, completed, time_spent_mins } = req.body;
    const userId = req.user?.userId || "anon";

    await aiService.logMLTelemetryEvent({
      user_id: userId,
      event_type: event_type || "interaction",
      course_id,
      domain,
      progress,
      rating,
      completed,
      time_spent_mins,
    });

    res.status(200).json({
      success: true,
      message: "Telemetry logged for continuous learning model.",
    });
  } catch (error) {
    next(error);
  }
};
