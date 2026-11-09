import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/crypto";

export interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  req.user = { id: decoded.userId };
  next();
}
