import { NextFunction, Request, Response } from "express";
import { mapPrismaError } from "../utils/prismaError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const mapped = mapPrismaError(err);
  if (mapped) {
    return res
      .status(mapped.status)
      .json({
        ok: false,
        code: mapped.code,
        message: mapped.message,
        details: mapped.details,
      });
  }

  const status = (err as any)?.status ?? 500;
  const code = (err as any)?.code ?? "INTERNAL_ERROR";
  const message = (err as any)?.message ?? "Something went wrong";
  res.status(status).json({ ok: false, code, message });
}
