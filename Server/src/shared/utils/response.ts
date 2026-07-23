import { Request, Response, NextFunction } from "express";

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = "Success",
  meta?: any,
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  details?: any,
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
