import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/response";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error("❌ Error:", err);

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    sendError(res, 400, "Validation failed.", formattedErrors);
    return;
  }

  // Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] || "field";
      sendError(res, 409, `A record with this ${field} already exists.`, {
        code: "DUPLICATE_ENTRY",
        field,
      });
      return;
    }
    if (prismaError.code === "P2025") {
      sendError(res, 404, "Record not found.", { code: "NOT_FOUND" });
      return;
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    sendError(res, 401, "Invalid token.", { code: "INVALID_TOKEN" });
    return;
  }
  if (err.name === "TokenExpiredError") {
    sendError(res, 401, "Token has expired. Please login again.", {
      code: "TOKEN_EXPIRED",
    });
    return;
  }

  // Default server error
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message || "Internal server error.";

  sendError(res, statusCode, message, {
    code: "INTERNAL_SERVER_ERROR",
  });
};
