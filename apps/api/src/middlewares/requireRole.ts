import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export function requireRole(...roles: string[]) {
  const allowed = new Set(roles);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const role = await prisma.role.findUnique({
        where: { id: req.auth.roleId },
        select: {
          name: true,
        },
      });

      if (!req.auth)
        return res.status(401).json({ message: "Not authenticated" });
      if (!roles.includes(role?.name || ""))
        return res.status(403).json({ message: "Forbidden" });
      return next();
    } catch (e) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
