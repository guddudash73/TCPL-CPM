import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { z, ZodError } from "zod";

export const Params = z.object({
  projectId: z
    .string()
    .regex(
      /^(c[a-z0-9]{24}|[0-9a-fA-F-]{36})$/,
      "projectId must be cuid or uuid"
    )
    .optional(),
  id: z
    .string()
    .regex(/^(c[a-z0-9]{24}|[0-9a-fA-F-]{36})$/, "id must be cuid or uuid")
    .optional(),
});

export type UserRole =
  | "OWNER"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "VIEWER";

type AuthUser = {
  id: string;
  roleId?: string;
  emailLower?: string;
  userRole?: UserRole;
};
type RequireAccessOptions = {
  roles?: Array<UserRole>;
  allowViewer?: boolean;
};

const roleCache = new Map<string, { name: UserRole; exp: number }>();
const ROLE_TTL_MS = 60_000;

async function getUserRole(roleId?: string): Promise<UserRole | undefined> {
  if (!roleId) return undefined;
  const now = Date.now();
  const hit = roleCache.get(roleId);
  if (hit && hit.exp > now) return hit.name;
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true },
  });
  if (!role) return undefined;
  const name = role.name as UserRole;
  roleCache.set(roleId, { name, exp: now + ROLE_TTL_MS });
  return name;
}

function isElevated(roles?: UserRole): boolean {
  return roles === "OWNER" || roles === "ADMIN";
}

export function requireAccess(opts: RequireAccessOptions = {}) {
  const explicitRoles = opts.roles ? new Set<UserRole>(opts.roles) : undefined;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.auth as AuthUser | undefined;

      if (!auth) {
        return res.status(401).json({
          ok: false,
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // const role = await prisma.role.findUnique({
      //   where: {
      //     id: req.auth?.roleId,
      //   },
      //   select: {
      //     name: true,
      //   },
      // });

      const userRole = await getUserRole(auth.roleId);

      if (isElevated(userRole)) {
        return next();
      }

      const parsed = Params.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          ok: false,
          code: "BAD_REQUEST",
          message: "Invalid route parameters",
          details: parsed.error.flatten(),
        });
      }
      const { projectId, id } = parsed.data;
      const projectScope = projectId ?? id;

      if (projectScope) {
        const isMember =
          (await prisma.project.count({
            where: { id: projectScope, members: { some: { userId: auth.id } } },
          })) > 0;

        if (!isMember) {
          return res
            .status(403)
            .json({
              ok: false,
              code: "FORBIDDEN",
              message: "You do not have access to this project",
            });
        }

        if (userRole === "VIEWER" && !opts.allowViewer) {
          return res.status(403).json({
            ok: false,
            code: "FORBIDDEN",
            message: "Viewer is not allowed to do this action",
          });
        }

        if (explicitRoles && (!userRole || !explicitRoles.has(userRole))) {
          return res
            .status(403)
            .json({
              ok: false,
              code: "FORBIDDEN",
              message: "Insufficient role for this action",
            });
        }

        return next();
      }

      if (explicitRoles) {
        if (userRole && explicitRoles.has(userRole)) return next();
        return res
          .status(403)
          .json({
            ok: false,
            code: "FORBIDDEN",
            message: "Insufficient role for this action",
          });
      }
      return next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          code: "BAD_REQUEST",
          message: "Invalid route parameters.",
          details: e.flatten(),
        });
      }
      return res
        .status(500)
        .json({
          ok: false,
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
    }
  };
}
