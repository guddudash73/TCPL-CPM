import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

const JWT_SECRET = process.env.JWT_SECRET || "";

const ACCESS_TTL: StringValue | number = (process.env.JWT_EXPIRES_IN ??
  "15m") as StringValue;

const REFRESH_TTL: StringValue | number = (process.env.REFRESH_TOKEN_TTL ??
  "30d") as StringValue;

// if (JWT_SECRET.length < 32) {
//   console.warn("[auth] JWT_SECRET should be at least 32 chars.");
// }

export type AccessClaims = {
  sub: string;
  roleId: string;
  emailLower: string;
  typ: "access";
};

export type RefreshClaims = {
  sub: string;
  sid: string;
  typ: "refresh";
};

export function signAccess(claims: AccessClaims): string {
  const opts: SignOptions = { expiresIn: ACCESS_TTL };
  return jwt.sign(claims, JWT_SECRET, opts);
}

export function verifyAccess(token: string): AccessClaims {
  return jwt.verify(token, JWT_SECRET) as AccessClaims;
}

export function signRefresh(claims: RefreshClaims): string {
  const opts: SignOptions = { expiresIn: REFRESH_TTL };
  return jwt.sign(claims, JWT_SECRET, opts);
}

export function verifyRefresh(token: string): RefreshClaims {
  return jwt.verify(token, JWT_SECRET) as RefreshClaims;
}

export function parseTtlToMs(s: string): number {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(s.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  const u = (m[2] || "s").toLowerCase();
  const mult =
    u === "ms"
      ? 1
      : u === "s"
      ? 1000
      : u === "m"
      ? 60000
      : u === "h"
      ? 3600000
      : 86400000;
  return n * mult;
}
