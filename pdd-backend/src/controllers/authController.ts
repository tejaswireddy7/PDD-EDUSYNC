import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AppError, errorCodes } from "../utils/errors";

export const getProfile = async (
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

    const { data, error } = await supabase.auth.admin.getUserById(req.user.userId);

    if (error || !data.user) {
      throw new AppError(
        "User not found",
        errorCodes.USER_NOT_FOUND.code,
        errorCodes.USER_NOT_FOUND.statusCode
      );
    }

    const profile = {
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || "User",
      email: data.user.email || "",
      registeredAt: new Date(data.user.created_at).getTime(),
    };

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

