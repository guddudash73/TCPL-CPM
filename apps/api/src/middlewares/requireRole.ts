import { Request, Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth)
      return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.auth.roleId))
      return res.status(403).json({ message: "Forbidden" });
    return next();
  };   
}
