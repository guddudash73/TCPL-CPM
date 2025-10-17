import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { z, ZodError } from "zod";

export const Params = z.object({
  projectId: z.string().cuid("projectId must be a valid CUID").optional(),
  id: z.string().cuid("id must be a valid CUID").optional(),
});

type UserRole =
  | "OWNER"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "VIEWER";

type AuthUser = {
  id: string;
  roleId?: string;
  emailLower?: string;
  userRole?: string;
};
type RequireAccessOptions = {
  roles?: Array<UserRole>;
  allowViewer?: boolean;
};

function isElevated(
  role: UserRole | undefined
): role is Extract<UserRole, "OWNER" | "ADMIN"> {
  return role === "OWNER" || role === "ADMIN";
}

export function requireAccess(opts: RequireAccessOptions = {}) {
  const explicitRoles = opts.roles ? new Set<UserRole>(opts.roles) : null;

  return async function (req: Request, res: Response, next: NextFunction) {
    console.log("enter");
    try {
      const auth = req.auth as AuthUser | undefined;
      console.log(auth);
      if (!auth) {
        return res.status(401).json({
          ok: false,
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }
      console.log("before");
      const role = await prisma.role.findUnique({
        where: {
          id: req.auth?.roleId,
        },
        select: {
          name: true,
        },
      });
      console.log("bafter");

      const userRole = role?.name as UserRole | undefined;

      if (isElevated(userRole)) {
        return next();
      }

      const parsed = Params.parse(req.params);
      const projectId = parsed.projectId ?? parsed.id;
      if (projectId) {
        const isMember =
          (await prisma.project.count({
            where: { id: projectId, members: { some: { userId: auth.id } } },
          })) > 0;
        console.log("fromt the projectId");

        if (isMember) return next();
      }

      if (!projectId) {
        if (!req.auth) {
          return res.status(401).json({
            ok: false,
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }
        req.auth.userRole = userRole;

        if (explicitRoles) {
          if (userRole && explicitRoles.has(userRole)) return next();
          return res.status(403).json({
            ok: false,
            code: "FORBIDDEN",
            message: "Insufficient role for this action",
          });
        }
        console.log(req.auth.userRole);
        return next();
      }

      // if (allowViewer) {
      // }

      return res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "You do not have access to this project",
      });
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          code: "BAD_REQUEST",
          message: "Invalid route parameters.",
          details: e.flatten(),
        });
      }

      return res.status(500).json({
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  };
}
