import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/response";
import prisma from "../config/prisma";

export interface AuthRequest extends Request {
  user?: JwtPayload & { status?: string };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, 401, "Access denied. No token provided.");
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      sendError(res, 401, "User no longer exists.");
      return;
    }

    if (user.status === "SUSPENDED") {
      sendError(
        res,
        403,
        "Your account has been suspended. Please contact support."
      );
      return;
    }

    req.user = { ...decoded, status: user.status };
    next();
  } catch (error) {
    sendError(res, 401, "Invalid or expired token.", {
      hint: "Please login again.",
    });
  }
};
