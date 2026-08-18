import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Require valid JWT authentication for any logged-in user.
 * Rejects blocked users automatically.
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Authentication required. Bearer token missing." });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: "Invalid or expired session token." });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: "Malformed session token." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "User account not found." });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
        error: "ACCOUNT_BLOCKED",
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Authentication middleware error." });
  }
};

/**
 * Require ADMIN role for administrative APIs.
 * Verifies JWT token, database user record, admin role, and block status.
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`[AdminAuth] Rejected ${req.method} ${req.originalUrl}: Bearer token missing.`);
      return res.status(401).json({ success: false, error: "Admin authentication required. Bearer token missing." });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: "Invalid or expired admin session token." });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: "Malformed session token." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Admin user account not found." });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
        error: "ADMIN_BLOCKED",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Admin privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Admin authorization middleware error." });
  }
};
