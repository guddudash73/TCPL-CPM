import { Request, Response, NextFunction } from "express";
import { LoginBody, RefreshBody } from "./auth.schema";
import { login, rotateRefresh } from "./auth.service";
import { ZodError } from "zod";

function zodIssues(ze: ZodError) {
  return ze.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid Request body",
      issues: zodIssues(parsed.error),
    });
  }
  try {
    const ua = req.get("user-agent") || undefined;
    const ip =
      (Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : (req.headers["x-forwarded-for"] as string)) || req.ip;

    const result = await login(parsed.data, ua, ip);
    if (!result) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parsed = RefreshBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "invalid request body",
      issues: zodIssues(parsed.error),
    });
  }

  try {
    const ua = req.get("user-agent") || undefined;
    const ip =
      (Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : (req.headers["x-forwarded-for"] as string)) || req.ip;

    const result = await rotateRefresh(parsed.data.refreshToken, ua, ip);
    if (!result) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid or expired refresh token" });
    }
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
