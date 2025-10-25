import { z } from "zod";
import { Unit } from "@prisma/client";

const Id = z.union([z.string().cuid(), z.string().uuid()]);

export const BoqUnitEnum = z.nativeEnum(Unit).optional();

export const BoqItemCreateSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  unit: BoqUnitEnum,
  qtyPlanned: z.coerce.number().nonnegative().optional(),
  ratePlanned: z.coerce.number().nonnegative().optional(),
  materialId: Id.optional().nullable(),
  stageId: Id.optional().nullable(),
});

export const BoqItemUpdateSchema = BoqItemCreateSchema.partial().extend({
  code: z.string().min(1).optional(),
});

export const BoqBatchUpsertSchema = z.object({
  items: z
    .array(
      BoqItemCreateSchema.extend({
        code: z.string().min(1),
      })
    )
    .min(1)
    .max(1000),
});

export const BoqBatchDeleteSchema = z.object({
  codes: z.array(z.string().min(1)).min(1),
});

export const BoqBatchQuerySchema = z.object({
  op: z.enum(["upsert", "delete"]),
  verbose: z.coerce.number().int().optional(),
});

export type BatchUpsertItem = z.infer<
  typeof BoqBatchUpsertSchema
>["items"][number];
export type BatchDeletePayload = z.infer<typeof BoqBatchDeleteSchema>;
