import { z } from "zod";
import { StageStatus } from "@prisma/client";

const toDate = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}, z.date().optional());

export const StageCreateSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  status: z.nativeEnum(StageStatus).default("NOT_STARTED"),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().positive().optional(),
  plannedStart: toDate,
  plannedEnd: toDate,
  actualStart: toDate,
  actualEnd: toDate,
});

export const stageUpdateSchema = StageCreateSchema.partial();

export const StageListSchema = z.object({
  q: z.string().trim().optional(),
  status: z.nativeEnum(StageStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
