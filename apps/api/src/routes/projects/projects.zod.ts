import { z } from "zod";
import {
  ProjectStatus as PrismaProjectStatus,
  Currency as PrismaCurrency,
} from "@prisma/client";

export const ProjectStatus = z.nativeEnum(PrismaProjectStatus);
export const Currency = z.nativeEnum(PrismaCurrency);

const stringBigInt = z
  .string()
  .regex(/^\d+$/, "Must be a non-negative integer string")
  .transform((s) => BigInt(s));

export const ProjectCreateSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(256),
  description: z.string().max(10000).optional().nullable(),
  status: ProjectStatus.default("PLANNING"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currency: Currency.default("INR"),
  budgetRupees: z.union([stringBigInt, z.bigint()]).optional(),
  addressLine1: z.string().max(256).optional().nullable(),
  addressLine2: z.string().max(256).optional().nullable(),
  city: z.string().max(128).optional().nullable(),
  state: z.string().max(128).optional().nullable(),
  pincode: z.string().max(32).optional().nullable(),
  country: z.string().max(64).optional().nullable(),
  projectManagerUserId: z.string().min(1).optional(),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export const ListQuerySchema = z.object({
  q: z.string().max(64).optional(),
  status: ProjectStatus.optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(128).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListQuery = z.infer<typeof ListQuerySchema>;
