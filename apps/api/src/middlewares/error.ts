import { NextFunction, Request, Response } from "express";
import { mapPrismaError } from "../utils/prismaError";
import { randomUUID } from "crypto";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const traceId = (req.headers["x-request-id"] as string) || randomUUID;

  const mapped = mapPrismaError(err);
  if (mapped) {
    return res.status(mapped.status).json({
      ok: false,
      code: mapped.code,
      message: mapped.message,
      details: mapped.details,
      traceId,
    });
  }

  const status = (err as any)?.status ?? 500;
  const code = (err as any)?.code ?? "INTERNAL_ERROR";
  const message = (err as any)?.message ?? "Something went wrong";
  res.status(status).json({ ok: false, code, message, traceId });
}
