import { prisma } from "../../../lib/prisma";
import type { Prisma, StageStatus } from "@prisma/client";

const baseSelect = {
  id: true,
  projectId: true,
  parentId: true,
  code: true,
  name: true,
  status: true,
  description: true,
  sortOrder: true,
  plannedStart: true,
  plannedEnd: true,
  actualStart: true,
  actualEnd: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const stagesService = {
  async list(
    projectId: string,
    opts: {
      q?: string;
      status?: Prisma.StageWhereInput["status"];
      page: number;
      limit: number;
    }
  ) {
    const { q, status, page, limit } = opts;
    const where: Prisma.StageWhereInput = {
      projectId,
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    };

    const [data, total] = await prisma.$transaction([
      prisma.stage.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stage.count({ where }),
    ]);
    return { data, total };
  },

  get(projectId: string, stageId: string) {
    return prisma.stage.findFirst({
      where: { id: stageId, projectId },
      select: baseSelect,
    });
  },

  async create(
    projectId: string,
    input: {
      code: string;
      name: string;
      status?: StageStatus;
      description?: string;
      parentId?: string;
      shortOrder?: number;
      plannedStart?: Date;
      plannedEnd?: Date;
      actualStart?: Date;
      actualEnd?: Date;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const currentMax = await tx.stage.aggregate({
        where: { projectId },
        _max: { sortOrder: true },
      });
      const appendOrder = (currentMax._max.sortOrder ?? 0) + 1;

      let desired = input.shortOrder;
      if (!desired || desired > appendOrder) desired = appendOrder;

      if (desired <= appendOrder - 1) {
        await tx.stage.updateMany({
          where: { projectId, sortOrder: { gte: desired } },
          data: { sortOrder: { increment: 1 } },
        });
      }

      const created = await tx.stage.create({
        data: {
          projectId,
          parentId: input.parentId ?? null,
          code: input.code,
          name: input.name,
          status: input.status ?? "NOT_STARTED",
          description: input.description,
          sortOrder: desired,
          plannedStart: input.plannedStart ?? null,
          plannedEnd: input.plannedEnd ?? null,
          actualStart: input.actualStart ?? null,
          actualEnd: input.actualEnd ?? null,
        },
        select: baseSelect,
      });
      return created;
    });
  },

  async update(
    projectId: string,
    stageId: string,
    patch: {
      code?: string;
      name?: string;
      status?: any;
      description?: string;
      parentId?: string | null;
      sortOrder?: number;
      plannedStart: Date | null;
      plannedEnd?: Date | null;
      actualStart?: Date | null;
      actualEnd?: Date | null;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.stage.findFirst({
        where: { id: stageId, projectId },
      });
      if (!existing) return null;

      let targetOrder = patch.sortOrder;
      if (
        typeof targetOrder === "number" &&
        targetOrder !== existing.sortOrder
      ) {
        const maxOrder =
          (
            await tx.stage.aggregate({
              where: { projectId },
              _max: { sortOrder: true },
            })
          )._max.sortOrder ?? existing.sortOrder;
        if (targetOrder < 1) targetOrder = 1;
        if (targetOrder > maxOrder) targetOrder = maxOrder;

        if (targetOrder < existing.sortOrder) {
          await tx.stage.updateMany({
            where: {
              projectId,
              sortOrder: { gt: existing.sortOrder, lte: targetOrder },
            },
            data: { sortOrder: { decrement: 1 } },
          });
        }
      }
      const updated = await tx.stage.update({
        where: { id: stageId },
        data: {
          code: patch.code ?? undefined,
          name: patch.name ?? undefined,
          status: patch.status ?? undefined,
          description: patch.description ?? undefined,
          parentId: patch.parentId === undefined ? undefined : patch.parentId,
          sortOrder: targetOrder ?? undefined,
          plannedStart:
            patch.plannedStart === undefined ? undefined : patch.plannedStart,
          plannedEnd:
            patch.actualEnd === undefined ? undefined : patch.plannedEnd,
          actualStart:
            patch.actualStart === undefined ? undefined : patch.actualStart,
          actualEnd:
            patch.actualEnd === undefined ? undefined : patch.actualEnd,
        },
        select: baseSelect,
      });
      return updated;
    });
  },

  async remove(projectId: string, stageId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.stage.findFirst({
        where: { id: stageId, projectId },
      });
      if (!existing) return null;

      await tx.stage.delete({ where: { id: stageId } });

      await tx.stage.updateMany({
        where: { projectId, sortOrder: { gt: existing.sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
      return existing;
    });
  },
};
