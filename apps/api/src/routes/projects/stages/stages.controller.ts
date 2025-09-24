import type { Request, Response, NextFunction } from "express";
import {
  StageCreateSchema,
  StageListQuerySchema,
  stageUpdateSchema,
} from "./stages.zod";
import { stagesService } from "./stages.service";

export const StagesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    const parsed = StageListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        details: parsed.error.flatten(),
      });
    }
    try {
      const { data, total } = await stagesService.list(
        req.params.projectId,
        parsed.data
      );
      return res.json({
        data,
        meta: { page: parsed.data.page, limit: parsed.data.limit, total },
      });
    } catch (e) {
      return next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const found = await stagesService.get(
        req.params.projectId,
        req.params.stageId
      );
      if (!found) return res.status(404).json({ ok: false, code: "NOT_FOUND" });
      return res.json({ data: found });
    } catch (e) {
      return next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    const parsed = StageCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        details: parsed.error.flatten(),
      });
    }
    try {
      const created = await stagesService.create(
        req.params.projectId,
        parsed.data as any
      );
      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    const parsed = stageUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        details: parsed.error.flatten(),
      });
    }
    try {
      const updated = await stagesService.update(
        req.params.projectId,
        req.params.stageId,
        parsed.data as any
      );
      if (!updated)
        return res.status(404).json({ ok: false, code: "NOT_FOUND" });
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await stagesService.remove(
        req.params.projectId,
        req.params.stageId
      );
      if (!deleted)
        return res.status(404).json({ ok: false, code: "NOT_FOUND" });
      return res.json({ data: deleted });
    } catch (e) {
      return next(e);
    }
  },
};
