import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { z, ZodError } from "zod";

export const ProjectIdParam = z.object({
  projectId: z.string().cuid("projectId must be a valid CUID"),
});

type AuthUser = {
  id: string;
  roleId?: string;
  emailLower?: string;
};

const ELEVATED_ROLES = new Set(["OWNER", "ADMIN", "VIEWER"]);

export async function requireAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = (req as any).auth as AuthUser | undefined;
    if (!auth) {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const userRole = await prisma.role.findUnique({
      where: {
        id: req.auth?.roleId,
      },
      select: {
        name: true,
      },
    });

    if (userRole?.name && ELEVATED_ROLES.has(userRole.name)) {
      return next();
    }

    const { projectId } = ProjectIdParam.parse(req.params);

    const hasAccess =
      (await prisma.project.count({
        where: {
          id: projectId,
          members: {
            some: {
              userId: auth.id,
            },
          },
        },
      })) > 0;

    if (!hasAccess) {
      return res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "You do not have access to this project",
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

    return res.status(500).json({
      ok: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  }
}
