import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Database validation errors
  if (err.message.includes("Unique constraint failed")) {
    return res.status(409).json({
      success: false,
      error: {
        message: "Resource already exists",
        code: "DUPLICATE_ENTRY",
      },
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
};
