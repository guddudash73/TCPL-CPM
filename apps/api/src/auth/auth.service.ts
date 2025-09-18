import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { LoginBody } from "./auth.schema";
import { signAccess, signRefresh, verifyRefresh, parseTtlToMs } from "./jwt";
import { createHash } from "crypto";

type SessionLite = { id: string };

const prisma = new PrismaClient();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getBcryptCost() {
  const v = Number(process.env.BCRYPT_COST || 12);
  if (Number.isNaN(v) || v < 4) return 10;
  return v;
}

function pepper() {
  return process.env.TOKEN_HASH_PEPPER || "";
}

function sha256b64(s: string) {
  return createHash("sha256").update(s).digest("base64");
}

async function hashToken(raw: string) {
  const cost = getBcryptCost();
  return bcrypt.hash(sha256b64(raw) + pepper(), cost);
}

async function compareToken(raw: string, hash: string) {
  return bcrypt.compare(sha256b64(raw) + pepper(), hash);
}

// async function enforceSessionCap(userId: string, now: Date) {
//   const cap = Number(process.env.SESSION_MAX_CONCURRENT ?? 0);
//   if (!cap || cap < 1) return;

//   const active: SessionLite[] = await prisma.session.findMany({
//     where: { userId, revokedAt: null, expiresAt: { gt: now } },
//     orderBy: { createdAt: "asc" },
//     select: { id: true },
//   });

//   const excess = active.length - cap;
//   if (excess >= 0) return;

//   return;
// }

async function enforceSessionCap(userId: string, now: Date) {
  const cap = Number(process.env.SESSION_MAX_CONCURRENT || 0);
  if (!cap || cap < 1) return;

  const active: SessionLite[] = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const over = active.length - cap;
  if (over <= 0) return;

  const toRevoke: string[] = active
    .slice(0, over)
    .map((s: SessionLite) => s.id);

  await prisma.session.updateMany({
    where: { id: { in: toRevoke } },
    data: { revokedAt: now, revokedByIp: "session-cap" },
  });
}

export async function login(input: LoginBody, userAgent?: string, ip?: string) {
  const emailLower = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { emailLower },
    select: {
      id: true,
      name: true,
      email: true,
      emailLower: true,
      roleId: true,
      passwordHash: true,
      status: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted || user.status !== "ACTIVE") return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return null;

  const now = new Date();
  await enforceSessionCap(user.id, now);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: userAgent?.slice(0, 256) ?? null,
      ipAddress: ip ?? null,
      refreshTokenHash: "",
      expiresAt: new Date(
        now.getTime() + parseTtlToMs(process.env.REFRESH_TOKEN_TTL || "30d")
      ),
    },
    select: { id: true },
  });

  const accessToken = signAccess({
    sub: user.id,
    roleId: user.roleId,
    emailLower: user.emailLower,
    typ: "access",
  });

  const refreshToken = signRefresh({
    sub: user.id,
    sid: session.id,
    typ: "refresh",
  });

  const hash = await hashToken(refreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hash },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function rotateRefresh(
  presentRefreshToken: string,
  userAgent?: string,
  ip?: string
) {
  let claims: { sub: string; sid: string; typ: "refresh" };
  try {
    claims = verifyRefresh(presentRefreshToken);
  } catch {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: claims.sid },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      refreshTokenHash: true,
    },
  });

  if (!session || session.userId !== claims.sub || session.revokedAt)
    return null;

  const valid = await compareToken(
    presentRefreshToken,
    session.refreshTokenHash
  );

  if (!valid) {
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokedByIp: ip ?? null },
    });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailLower: true,
      roleId: true,
      status: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted || user.status !== "ACTIVE") return null;

  const now = new Date();

  const accessToken = signAccess({
    sub: user.id,
    roleId: user.roleId,
    emailLower: user.emailLower,
    typ: "access",
  });

  const newRefreshToken = signRefresh({
    sub: user.id,
    sid: session.id,
    typ: "refresh",
  });

  const newHash = await hashToken(newRefreshToken);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newHash,
      userAgent: userAgent?.slice(0, 256) ?? null,
      ipAddress: ip ?? null,
      expiresAt: new Date(
        now.getTime() + parseTtlToMs(process.env.REFRESH_TOKEN_TTL || "30d")
      ),
      updatedAt: now,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
    },
    tokens: { accessToken, refreshToken: newRefreshToken },
  };
}

export async function revokeSession(sessionId: string, byIp?: string) {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedByIp: byIp ?? null },
    });
    return true;
  } catch (e: unknown) {
    if ((e as PrismaClientKnownRequestError).code === "P2025") return false;
    throw e;
  }
}
