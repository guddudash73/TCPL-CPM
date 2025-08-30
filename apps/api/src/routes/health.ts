import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

router.get("/livez", (_req, res) => {
  res.json({ ok: true });
});

router.get("/readyz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

router.get("/version", (_req, res) => {
  res.json({
    name: "tcpl-cpm-api",
    version: process.env.npm_package_version || "0.0.0",
    env: process.env.NODE_ENV || "development",
  });
});

export default router;
