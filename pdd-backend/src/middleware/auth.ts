import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AppError, errorCodes } from "../utils/errors";
import { TokenPayload } from "../types";

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Missing or invalid authorization token",
        errorCodes.MISSING_TOKEN.code,
        errorCodes.MISSING_TOKEN.statusCode
      );
    }

    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError(
        "Invalid or expired token",
        errorCodes.INVALID_TOKEN.code,
        errorCodes.INVALID_TOKEN.statusCode
      );
    }

    req.user = {
      userId: data.user.id,
      email: data.user.email || "",
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: errorCodes.INVALID_TOKEN.code,
        },
      });
    }
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data.user) {
        req.user = {
          userId: data.user.id,
          email: data.user.email || "",
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};

