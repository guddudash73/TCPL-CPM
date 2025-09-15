import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../auth/jwt";

export type AuthUser = { id: string; roleId: string; emailLower: string };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authz = req.header("authorization") || req.header("Authorization");
  if (!authz || !authz.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ message: "missing bearer token" });
  }
  const token = authz.slice(7).trim();
  try {
    const claims = verifyAccess(token);
    req.auth = {
      id: claims.sub,
      roleId: claims.roleId,
      emailLower: claims.emailLower,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "invalid or expired token" });
  }
}
