import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = (err as any)?.status ?? 500;
  const code = (err as any)?.code ?? "INTERNAL_ERROR";
  const message = (err as any)?.message ?? "Something went wrong";
  res.status(status).json({ ok: false, code, message });
}
