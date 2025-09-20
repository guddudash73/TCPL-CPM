import { prisma } from "../../lib/prisma";

export const ProjectsService = {
  async list() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        city: true,
        state: true,
        currency: true,
        budgetRupees: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async get(id: string) {
    return prisma.project.findUnique({
      where: { id },
      select: {
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
      },
    });
  },
};
