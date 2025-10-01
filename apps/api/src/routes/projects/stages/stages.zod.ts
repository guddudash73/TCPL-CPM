import { z } from "zod";
import { StageStatus } from "@prisma/client";

const DateCoerced = z.preprocess(
  (v) => (v == null || v === "" ? undefined : v),
  z.coerce.date()
);

export const StageCreateSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  status: z.nativeEnum(StageStatus).default("NOT_STARTED"),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().positive().optional(),
  plannedStart: DateCoerced.optional(),
  plannedEnd: DateCoerced.optional(),
  actualStart: DateCoerced.optional(),
  actualEnd: DateCoerced.optional(),
});

export const stageUpdateSchema = StageCreateSchema.partial();

export const StageListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.nativeEnum(StageStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
