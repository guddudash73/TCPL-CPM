import { Request, Response } from "express";
import * as svc from "./boq.service";
import { mapPrismaError } from "../../utils/prismaError";
import { BoqBatchDeleteSchema, BoqBatchUpsertSchema } from "./boq.schema";

export async function list(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { cursor, take, q } = req.query as any;
    const data = await svc.list({
      projectId,
      cursor,
      take: Number(take) || 50,
      q,
    });
    res.json(data);
  } catch (err) {
    const mapped = mapPrismaError(err);
    res.status(mapped?.status ?? 500).json({
      error: mapped ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error",
      },
    });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const data = await svc.create({ projectId, payload: req.body });
    res.status(201).json(data);
  } catch (err) {
    const mapped = mapPrismaError(err);
    res.status(mapped?.status ?? 500).json({
      error: mapped ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error",
      },
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { projectId, id } = req.params;
    const data = await svc.update({ projectId, id, payload: req.body });
    res.json(data);
  } catch (err) {
    const mapped = mapPrismaError(err);
    res.status(mapped?.status ?? 500).json({
      error: mapped ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error",
      },
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { projectId, id } = req.params;
    await svc.remove({ projectId, id });
    res.status(204).end();
  } catch (err) {
    const mapped = mapPrismaError(err);
    res.status(mapped?.status ?? 500).json({
      error: mapped ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error",
      },
    });
  }
}

export async function batch(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { op, verbose } = req.query as {
      op: "upsert" | "delete";
      verbose?: any;
    };

    if (op === "upsert") {
      const parsed = BoqBatchUpsertSchema.parse(req.body);
      const result = await svc.batchUpsert({
        projectId,
        items: parsed.items,
        verbose: !!Number(verbose),
      });
      return res.json(result);
    }

    if (op === "delete") {
      const parsed = BoqBatchDeleteSchema.parse(req.body);
      const result = await svc.batchDelete({ projectId, codes: parsed.codes });
      return res.json(result);
    }

    return res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "Invalid op" });
  } catch (err) {
    const mapped = mapPrismaError(err);
    res.status(mapped?.status ?? 500).json({
      error: mapped ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: err,
      },
    });
  }
}
