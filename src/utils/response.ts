import { Response } from "express";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  errorDetails?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: ApiResponse<T>["meta"]
): Response => {
  const response: ApiResponse<T> = { success: true, message };
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errorDetails?: unknown
): Response => {
  const response: ErrorResponse = { success: false, message };
  if (errorDetails !== undefined) response.errorDetails = errorDetails;
  return res.status(statusCode).json(response);
};
