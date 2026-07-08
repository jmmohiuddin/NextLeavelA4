import { Request, Response } from "express";
import { sendError } from "../utils/response";

/**
 * 404 Not Found middleware
 * Catches all unmatched routes and returns a structured error response
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
    hint: "Please check the API documentation for valid routes.",
    availableRoutes: [
      "GET /",
      "GET /health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/gear",
      "GET /api/gear/:id",
      "GET /api/categories",
      "POST /api/rentals",
      "GET /api/rentals",
      "GET /api/rentals/:id",
      "POST /api/payments/create",
      "GET /api/payments",
      "GET /api/payments/:id",
      "POST /api/provider/gear",
      "PUT /api/provider/gear/:id",
      "DELETE /api/provider/gear/:id",
      "GET /api/provider/orders",
      "PATCH /api/provider/orders/:id",
      "POST /api/reviews",
      "GET /api/admin/users",
      "PATCH /api/admin/users/:id",
      "GET /api/admin/gear",
      "GET /api/admin/rentals",
    ],
  });
};
