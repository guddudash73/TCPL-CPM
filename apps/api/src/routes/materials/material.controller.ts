import { Request, Response } from "express";
import * as svc from "./material.service";
import { mapPrismaError } from "../../utils/prismaError";
import { Unit } from "@prisma/client";

export async function list(req: Request, res: Response) {
  try {
    const { q, cursor, take } = req.query as {
      q?: string;
      cursor?: string;
      take?: string;
    };
    const result = await svc.list({ q, cursor, take: Number(take) || 20 });
    res.json(result);
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
    const { sku, name, unit } = req.body as {
      sku: string;
      name: string;
      unit: Unit;
    };

    const result = await svc.create(sku, name, unit);
    res.json(result);
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
