import { PrismaClient } from "@prisma/client";

function pickRuntimeDbUrl() {
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  if (appEnv === "production") {
    return (
      process.env.PRISMA_DATABASE_URL_PROD || process.env.PRISMA_DATABASE_URL
    );
  }
  return process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
}

const runtimeUrl = pickRuntimeDbUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],

    datasources: runtimeUrl ? { db: { url: runtimeUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
