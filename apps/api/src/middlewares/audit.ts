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
