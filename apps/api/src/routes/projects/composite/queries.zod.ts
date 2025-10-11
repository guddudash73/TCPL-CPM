import { z } from "zod";

export const ProjectIdParam = z.object({
  projectId: z.string().cuid("projectId must be a valid CUID"),
});

export const PortfolioQuery = z.object({
  pmId: z.string().uuid("pmId must be a valid UUID").optional(),
  status: z
    .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"])
    .optional(),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SearchQuery = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "HOLD", "DONE"]).optional(),
  plannedStartFrom: z.coerce.date().optional(),
  plannedStartTo: z.coerce.date().optional(),
  actualStartFrom: z.coerce.date().optional(),
  actualStartTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type TProjectIdParam = z.infer<typeof ProjectIdParam>;
export type TPortfolioQuery = z.infer<typeof PortfolioQuery>;
export type TSearchQuery = z.infer<typeof SearchQuery>;
