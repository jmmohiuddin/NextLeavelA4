import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { sendError } from "../utils/response";

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Unauthorized. Please login.");
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        403,
        `Access denied. This route requires one of: ${roles.join(", ")}.`,
        { yourRole: req.user.role, requiredRoles: roles }
      );
      return;
    }

    next();
  };
};

export const requireCustomer = requireRole("CUSTOMER");
export const requireProvider = requireRole("PROVIDER");
export const requireAdmin = requireRole("ADMIN");
export const requireProviderOrAdmin = requireRole("PROVIDER", "ADMIN");
