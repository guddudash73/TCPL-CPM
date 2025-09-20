import type { Request, Response } from "express";
import { ProjectsService } from "./projects.service";

export const ProjectsController = {
  async list(_req: Request, res: Response) {
    const data = await ProjectsService.list();
    res.json({ data });
  },
  async get(req: Request, res: Response) {
    const { id } = req.params;
    const data = await ProjectsService.get(id);
    if (!data)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Projects not found" });
    res.json({ data });
  },
};
