import { Request, Response } from "express";
import { CompositeQueriesService } from "./queries.service";
import { ProjectIdParam, PortfolioQuery, SearchQuery } from "./queries.zod";

export class CompositeQueriesController {
  static async getProjectWithStage(req: Request, res: Response) {
    const { projectId } = ProjectIdParam.parse(req.params);

    const result = await CompositeQueriesService.getProjectWithStages(
      projectId
    );
    if (!result)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Project not found" });
    return res.json({ data: result });
  }

  static async getPortfolio(req: Request, res: Response) {
    const q = PortfolioQuery.parse(req.query);
    const result = await CompositeQueriesService.getPortfolio(q);
    return res.json({
      data: result.data,
      meta: { total: result.total, limit: result.limit, offset: result.offset },
    });
  }

  static async search(req: Request, res: Response) {
    const q = SearchQuery.parse(req.query);
    const result = await CompositeQueriesService.searchProjects(q);
    return res.json({
      data: result.data,
      meta: { total: result.total, limit: result.limit, offset: result.offset },
    });
  }
}
