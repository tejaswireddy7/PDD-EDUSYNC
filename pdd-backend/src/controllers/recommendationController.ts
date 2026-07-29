import { Request, Response, NextFunction } from "express";
import * as recommendationService from "../services/recommendationService";
import * as apiAggregator from "../services/apiAggregator";
import { AppError, errorCodes } from "../utils/errors";

export const getRecommendations = async (
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

    const recommendations = await recommendationService.getLatestRecommendations(
      req.user.userId
    );

    if (!recommendations) {
      return res.status(200).json({
        success: true,
        data: {
          message: "No recommendations available. Please complete the survey first.",
          recommendations: null,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

export const getExternalCourses = async (
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

    const focusDomain = (req.query.focusDomain as string) || "Frontend";
    const proficiency = (req.query.proficiency as string) || "Beginner";

    // Validate input
    const validDomains = ["Frontend", "Backend", "Mobile", "AI"];
    const validProficiency = ["Beginner", "Intermediate", "Advanced"];

    if (!validDomains.includes(focusDomain) || !validProficiency.includes(proficiency)) {
      throw new AppError(
        "Invalid query params. focusDomain must be one of Frontend, Backend, Mobile, AI and proficiency must be one of Beginner, Intermediate, Advanced",
        errorCodes.INVALID_INPUT.code,
        errorCodes.INVALID_INPUT.statusCode
      );
    }

    // Aggregate external resources from provider APIs
    const externalResources = await apiAggregator.aggregateRecommendations(
      focusDomain,
      proficiency
    );

    // Map to a course-like shape for the client
    const courses = externalResources.map((r) => ({
      title: r.title,
      subject: r.source,
      url: r.url || null,
      description: r.description || null,
      duration: r.duration || "Variable",
      difficulty: r.difficulty || proficiency,
    }));

    res.status(200).json({
      success: true,
      data: {
        focusDomain,
        proficiency,
        courses,
      },
    });
  } catch (error) {
    next(error);
  }
};
