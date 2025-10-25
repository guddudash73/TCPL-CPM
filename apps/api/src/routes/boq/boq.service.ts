import { Prisma, Unit } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { BatchUpsertItem } from "./boq.schema";

export async function list(args: {
  projectId: string;
  cursor?: string;
  take: number;
  q?: string;
}) {
  const where: Prisma.BOQItemsWhereInput = {
    projectId: args.projectId,
    ...(args.q
      ? {
          OR: [
            { code: { contains: args.q, mode: "insensitive" } },
            { description: { contains: args.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.bOQItems.findMany({
    where,
    take: args.take,
    ...(args.cursor ? { skip: 1, cursor: { id: args.cursor } } : {}),
    orderBy: [{ code: "asc" }, { updatedAt: "desc" }],
  });

  const nextCursor =
    items.length === args.take ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

type CreatePayload = {
  code: string;
  description: string;
  unit: Unit;
  qtyPlanned: string | number;
  ratePlanned: string | number;
  materialId?: string | null;
  stageId?: string | null;
};

export async function create(args: {
  projectId: string;
  payload: CreatePayload;
}) {
  const { projectId, payload } = args;
  return prisma.bOQItems.create({
    data: {
      projectId,
      code: payload.code,
      description: payload.description,
      unit: payload.unit,
      qtyPlanned: new Prisma.Decimal(payload.qtyPlanned),
      ratePlanned: new Prisma.Decimal(payload.ratePlanned),
      materialId: payload.materialId ?? null,
      stageId: payload.stageId ?? null,
    },
  });
}

export async function update(args: {
  projectId: string;
  id: string;
  payload: Partial<CreatePayload>;
}) {
  const { projectId, id, payload } = args;

  const updated = await prisma.bOQItems.updateMany({
    where: { id, projectId },
    data: {
      code: payload.code,
      description: payload.description,
      unit: payload.unit,
      qtyPlanned:
        payload.qtyPlanned != null
          ? new Prisma.Decimal(payload.qtyPlanned)
          : undefined,
      ratePlanned:
        payload.ratePlanned != null
          ? new Prisma.Decimal(payload.ratePlanned)
          : undefined,
      stageId: payload.stageId ?? undefined,
    },
  });
  if (updated.count === 0)
    throw Object.assign(new Error("NotFound"), { code: "P2025" });
  return prisma.bOQItems.findUniqueOrThrow({ where: { id } });
}

export async function remove(args: { projectId: string; id: string }) {
  const deleted = await prisma.bOQItems.deleteMany({
    where: { id: args.id, projectId: args.projectId },
  });
  if (deleted.count === 0)
    throw Object.assign(new Error("NotFound"), { code: "P2025" });
}

// type BatchUpsertItem = {
//   code: string;
//   description?: string;
//   unit?: Unit;
//   qtyplanned?: number | string;
//   rateplanned?: number | string;
//   materialId?: string | null;
//   stageId: string | null;
// };

export async function batchUpsert(args: {
  projectId: string;
  items: BatchUpsertItem[];
  verbose?: boolean;
}) {
  const { projectId, items, verbose } = args;

  const results = await prisma.$transaction(async (tx) => {
    const perItem: Array<{
      code: string;
      action: "created" | "updated";
      id: string;
    }> = [];

    for (const it of items) {
      const existing = await tx.bOQItems.findUnique({
        where: { projectId_code: { projectId, code: it.code } },
        select: { id: true },
      });

      if (!existing && !it.unit) {
        const err: any = new Error("unit required for create");
        err.status = 400;
        err.code = "BAD_REQUEST";
        throw err;
      }

      if (!existing) {
        const created = await tx.bOQItems.create({
          data: {
            projectId,
            code: it.code,
            description: it.description ?? "",
            unit: (it.unit as Unit | undefined) ?? Unit.NOS,
            qtyPlanned:
              it.qtyPlanned != null
                ? new Prisma.Decimal(it.qtyPlanned)
                : new Prisma.Decimal(0),
            ratePlanned:
              it.ratePlanned != null
                ? new Prisma.Decimal(it.ratePlanned)
                : new Prisma.Decimal(0),
            materialId: it.materialId ?? null,
            stageId: it.stageId ?? null,
          },
        });

        perItem.push({ code: it.code, action: "created", id: created.id });
      } else {
        await tx.bOQItems.update({
          where: { id: existing.id },
          data: it,
        }),
          perItem.push({ code: it.code, action: "updated", id: existing.id });
      }
    }

    return perItem;
  });

  return {
    upserted: results.length,
    ...(verbose ? { results: results } : {}),
  };
}

export async function batchDelete(args: {
  projectId: string;
  codes: string[];
}) {
  const { projectId, codes } = args;
  const { count } = await prisma.bOQItems.deleteMany({
    where: { projectId, code: { in: codes } },
  });

  return { deleted: count };
}
