import { prisma } from "../../lib/prisma";
import type { ListQuery } from "./projects.zod";
import { type ProjectStatus, type Currency } from "@prisma/client";

const baseSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  currency: true,
  budgetRupees: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  pincode: true,
  country: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toDate = (d?: string | Date) => (typeof d === "string" ? new Date(d) : d);

type CreateData = {
  code: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  currency?: Currency;
  budgetRupees?: bigint;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  projectManagerUserId?: string | null;
};

export const ProjectsService = {
  async list(q: ListQuery, userId?: string, userRole?: string) {
    const { page, limit, status, city, state } = q;

    const where: any = { AND: [] as any[] };
    if (q.q) {
      where.AND.push({
        OR: [
          { name: { contains: q.q, mode: "insensitive" } },
          { code: { contains: q.q, mode: "insensitive" } },
        ],
      });
    }

    if (status) where.AND.push({ status });
    if (city) where.AND.push({ city: { equals: city, mode: "insensitive" } });
    if (state)
      where.AND.push({ state: { equals: state, mode: "insensitive" } });
    if (userRole === "PROJECT_MANAGER") {
      where.members = {
        some: { userId: userId, role: { name: "PROJECT_MANAGER" } },
      };
    }
    if (!where.AND.length) delete where.AND;

    const [rows, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        select: baseSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { rows, total };
  },

  async getByIdOrCode(idOrCode: string) {
    return prisma.project.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      select: baseSelect,
    });
  },

  async create(data: CreateData, opts?: { projectManagerUserId?: string }) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...data,
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
        },
        select: baseSelect,
      });

      if (opts?.projectManagerUserId) {
        const pmRole = await tx.role.findUnique({
          where: { name: "PROJECT_MANAGER" },
          select: { id: true },
        });
        if (!pmRole) {
          const err: any = new Error("DB validatiion");
          err.code = "P2000";
          err.meta = {
            userMessage: 'Required role "PROJECT_MANAGER" not found',
          };
          throw err;
        }

        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: opts.projectManagerUserId,
            },
          },
          update: {
            projectId: project.id,
          },
          create: {
            projectId: project.id,
            userId: opts.projectManagerUserId,
            roleId: pmRole.id,
          },
        });
      }
      return project;
    });
  },

  async update(id: string, data: Partial<CreateData>) {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
      },
      select: baseSelect,
    });
  },

  async remove(id: string) {
    return prisma.project.delete({ where: { id }, select: baseSelect });
  },
};
