import { Request, Response, NextFunction } from "express";
import * as surveyService from "../services/surveyService";
import * as recommendationService from "../services/recommendationService";
import { AppError, errorCodes } from "../utils/errors";
import { SurveyAnswers } from "../types";

export const submitSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(
        "Unauthorized",
        errorCodes.INVALID_TOKEN.code,
        errorCodes.INVALID_TOKEN.statusCode
      );
    }

    const { focusDomain, proficiency, learningHours } = req.body;

    // Validate input
    if (!focusDomain || !proficiency || learningHours === undefined) {
      throw new AppError(
        "Missing required fields: focusDomain, proficiency, learningHours",
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    // Validate domain
    const validDomains = ["Frontend", "Backend", "Mobile", "AI"];
    if (!validDomains.includes(focusDomain)) {
      throw new AppError(
        `Invalid focusDomain. Must be one of: ${validDomains.join(", ")}`,
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    // Validate proficiency
    const validProficiency = ["Beginner", "Intermediate", "Advanced"];
    if (!validProficiency.includes(proficiency)) {
      throw new AppError(
        `Invalid proficiency. Must be one of: ${validProficiency.join(", ")}`,
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    // Validate learning hours
    if (typeof learningHours !== "number" || learningHours < 1 || learningHours > 40) {
      throw new AppError(
        "learningHours must be a number between 1 and 40",
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    const answers: SurveyAnswers = {
      focusDomain,
      proficiency,
      learningHours,
    };

    // Create survey
    const surveyResult = await surveyService.createSurvey(req.user.userId, answers);

    // Generate recommendations
    const recommendations = await recommendationService.generateRecommendations(
      req.user.userId,
      answers
    );

    res.status(201).json({
      success: true,
      data: {
        ...surveyResult,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const skipSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(
        "Unauthorized",
        errorCodes.INVALID_TOKEN.code,
        errorCodes.INVALID_TOKEN.statusCode
      );
    }

    const nextSurveyDate = await surveyService.skipSurvey(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        message: "Survey skipped",
        nextSurveyAt: nextSurveyDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSurveyStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(
        "Unauthorized",
        errorCodes.INVALID_TOKEN.code,
        errorCodes.INVALID_TOKEN.statusCode
      );
    }

    const shouldShow = await surveyService.shouldShowSurveyPrompt(req.user.userId);
    const latestSurvey = await surveyService.getLatestSurvey(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        shouldShowPrompt: shouldShow,
        latestSurvey: latestSurvey
          ? {
              id: latestSurvey.id,
              focusDomain: latestSurvey.focusDomain,
              proficiency: latestSurvey.proficiency,
              learningHours: latestSurvey.learningHours,
              nextSurveyAt: latestSurvey.nextSurveyAt.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
