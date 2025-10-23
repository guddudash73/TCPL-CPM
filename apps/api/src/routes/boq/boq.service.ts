import { Prisma, Unit } from "@prisma/client";
import { prisma } from "../../lib/prisma";

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
