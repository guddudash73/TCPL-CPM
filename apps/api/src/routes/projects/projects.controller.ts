import type { Request, Response, NextFunction } from "express";
import { ProjectsService } from "./projects.service";
import {
  ListQuerySchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
} from "./projects.zod";

export const ProjectsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid query params",
        details: parsed.error.flatten(),
      });
    }
    try {
      const { rows, total } = await ProjectsService.list(parsed.data);
      return res.json({
        data: rows,
        meta: { page: parsed.data.page, limit: parsed.data.limit, total },
      });
    } catch (e) {
      return next(e);
    }
  },

  async getByIdOrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ProjectsService.getByIdOrCode(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ ok: false, code: "NOT_FOUND", message: "Project not found" });
      }
      return res.json({ data });
    } catch (e) {
      return next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    const parsed = ProjectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }
    try {
      const { projectManagerUserId, ...projectData } = parsed.data as any;
      const created = await ProjectsService.create(projectData, {
        projectManagerUserId,
      });
      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    const parsed = ProjectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }
    try {
      const updated = await ProjectsService.update(req.params.id, parsed.data);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await ProjectsService.remove(req.params.id);
      return res.json({ data: deleted });
    } catch (e) {
      return next(e);
    }
  },
};
