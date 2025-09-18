import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const roleNameById = new Map<string, { name: string; exp: number }>();
const ROLE_TTL_MS = 60_000;

async function getRoleName(roleId: string): Promise<string | null> {
  const now = Date.now();
  const hit = roleNameById.get(roleId);
  if (hit && hit.exp > now) return hit.name;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true },
  });

  if (!role) return null;
  roleNameById.set(roleId, { name: role.name, exp: now + ROLE_TTL_MS });
  return role.name;
}

export function requireRole(...roles: string[]) {
  const allowed = new Set(roles);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const actual = await getRoleName(req.auth.roleId);

      if (!actual) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!allowed.has(actual)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return next();
    } catch (e) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
