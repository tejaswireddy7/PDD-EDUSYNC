import { ApiError } from "../types";

export class AppError extends Error implements ApiError {
  message: string;
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.message = message;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const createError = (
  message: string,
  code: string = "INTERNAL_ERROR",
  statusCode: number = 500
): AppError => {
  return new AppError(message, code, statusCode);
};

export const errorCodes = {
  INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", statusCode: 401 },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", statusCode: 404 },
  USER_EXISTS: { code: "USER_EXISTS", statusCode: 409 },
  INVALID_TOKEN: { code: "INVALID_TOKEN", statusCode: 401 },
  MISSING_TOKEN: { code: "MISSING_TOKEN", statusCode: 401 },
  SURVEY_NOT_FOUND: { code: "SURVEY_NOT_FOUND", statusCode: 404 },
  DATABASE_ERROR: { code: "DATABASE_ERROR", statusCode: 500 },
  INVALID_INPUT: { code: "INVALID_INPUT", statusCode: 400 },
  API_ERROR: { code: "API_ERROR", statusCode: 502 },
};
