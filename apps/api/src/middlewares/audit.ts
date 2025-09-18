import type { Request, Response, NextFunction } from "express";

export function audit(event: (req: Request) => string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const line = `[AUDIT] ${new Date().toISOString()} ${event(req)} ip=${
        req.ip
      } ua="${req.get("user-agent") ?? ""}`;
      console.info(line);
    } catch {
      /* noop */
    }
    next();
  };
}

type AuditMeta = { action: string; entity?: string; entityId: string };

export function withAudit(
  meta: AuditMeta,
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown> | unknown
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startedAt = new Date();
    try {
      const result = await handler(req, res, next);
      console.info(
        `[AUDIT] ${startedAt.toISOString()} action=${
          meta.action
        } outcome=success user=${(req as any).auth?.userId ?? "anon"} ip=${
          req.ip
        } ua="${req.get("user-agent") ?? ""}" entity=${
          meta.entity ?? ""
        } entityId=${meta.entityId ?? ""}`
      );
      return result;
    } catch (err: any) {
      console.warn(
        `[AUDIT] ${startedAt.toISOString()} action=${
          meta.action
        } outcome=fail reason="${(err?.message ?? "error").slice(
          0,
          200
        )}" user=${(req as any).auth?.userId ?? "anon"} ip=${req.ip} ua="${
          req.get("user-agent") ?? ""
        }" entity=${meta.entity ?? ""} entityId=${meta.entityId ?? ""}`
      );
      throw err;
    }
  };
}
