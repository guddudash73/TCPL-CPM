import { Unit } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ListArgs = { q?: string; cursor?: string; take: number };

export async function list({ q, cursor, take }: ListArgs) {
  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : undefined;

  const items = await prisma.material.findMany({
    where,
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true, unit: true, updatedAt: true },
  });

  const nextCursor =
    items.length === take ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function create(sku: string, name: string, unit: Unit) {
  const res = await prisma.material.create({
    data: { sku, name, unit },
  });

  return res;
}
