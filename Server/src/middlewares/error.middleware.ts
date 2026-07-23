import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/utils/errors";

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      ...((err as any).errorCode ? { errorCode: (err as any).errorCode } : {}),
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }

  // Unknown errors
  console.error("💥 Unexpected Error:", err);

  return res.status(500).json({
    success: false,
    error: {
      message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        details: err.message,
        stack: err.stack,
      }),
    },
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
