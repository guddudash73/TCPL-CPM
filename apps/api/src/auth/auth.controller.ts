import { Request, Response } from "express";
import { LoginBody, RefreshBody } from "./auth.schema";
import { login, rotateRefresh } from "./auth.service";
import { ZodError } from "zod";
import path from "path";

// function zodIssues(ze: ZodError) {
//   return ze.issues.map((i) => ({
//     path: i.path.join("."),
//     message: i.message,
//     code: i.code,
//   }));
// }

export async function loginController(req: Request, res: Response) {
  const body = LoginBody.parse(req.body);
  const ua = req.get("user-agent") || undefined;
  const ip =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : (req.headers["x-forwarded-for"] as string)) || req.ip;

  const result = await login(body, ua, ip);
  if (!result)
    return res.status(401).json({ message: "Invalid email or password" });
  return res.status(200).json(result);
}

export async function refreshController(req: Request, res: Response) {
  const { refreshToken } = RefreshBody.parse(req.body);
  const ua = req.get("user-agent") || undefined;
  const ip =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : (req.headers["x-forwarded-for"] as string)) || req.ip;

  const result = await rotateRefresh(refreshToken, ua, ip);
  if (!result)
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  return res.status(200).json(result);
}
