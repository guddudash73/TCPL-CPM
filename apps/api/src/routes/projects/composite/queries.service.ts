import { prisma } from "../../../lib/prisma";
import { StageStatus, ProjectStatus } from "@prisma/client";

export class CompositeQueriesService {
  static async getProjectWithStages(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        stage: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!project) return null;

    const counts: Record<StageStatus, number> = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      HOLD: 0,
      DONE: 0,
    };

    for (const s of project.stage) counts[s.status]++;

    return {
      ...project,
      stageCounts: counts,
      stageTotal: project.stage.length,
    };
  }

  static async getPortfolio(
    params: {
      status?: ProjectStatus;
      q?: string;
      limit: number;
      offset: number;
    },
    user: { roleId: string; id: string }
  ) {
    const { status, q, limit, offset } = params;
    const userRole = await prisma.role.findUnique({
      where: {
        id: user.roleId,
      },
      select: {
        name: true,
      },
    });

    const where: any = {};
    if (status) where.status = status;
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (userRole?.name === "PROJECT_MANAGER") {
      where.members = {
        some: { userId: user.id, role: { name: "PROJECT_MANAGER" } },
      };
    }

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          stage: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, status: true, sortOrder: true },
          },
        },
        skip: offset,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    const data = rows.map((p) => {
      const totalStages = p.stage.length;
      const done = p.stage.filter((s) => s.status === "DONE").length;
      const progress = totalStages ? Math.round((done / totalStages) * 100) : 0;
      const currentStage =
        p.stage.find((s) => s.status !== "DONE") ?? p.stage.at(-1) ?? null;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        progress,
        currentStage,
        totals: { totalStages, done },
        updatedAt: p.updatedAt,
      };
    });
    return { data, total, limit, offset };
  }

  static async searchProjects(params: {
    q?: string;
    status?: StageStatus;
    plannedStartFrom?: Date;
    plannedStartTo?: Date;
    actualStartFrom?: Date;
    actualStartTo?: Date;
    limit: number;
    offset: number;
  }) {
    const {
      q,
      status,
      plannedStartFrom,
      plannedStartTo,
      actualStartFrom,
      actualStartTo,
      limit,
      offset,
    } = params;

    const whereProject: any = {};
    if (q) whereProject.name = { contains: q, mode: "insensitive" };

    const whereStages: any = {};
    if (status) whereStages.status = status;
    if (plannedStartFrom || plannedStartTo) {
      whereStages.plannedStart = {};
      if (plannedStartFrom) whereStages.plannedStart.gte = plannedStartFrom;
      if (plannedStartTo) whereStages.plannedStart.lte = plannedStartTo;
    }
    if (actualStartFrom || actualStartTo) {
      whereStages.actualStart = {};
      if (actualStartFrom) whereStages.actualStart.gte = actualStartFrom;
      if (actualStartTo) whereStages.actualStart.lte = actualStartTo;
    }

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          ...whereProject,
          stage: Object.keys(whereStages).length
            ? { some: whereStages }
            : undefined,
        },
        include: {
          stage: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.project.count({
        where: {
          ...whereProject,
          stage: Object.keys(whereStages).length
            ? { some: whereStages }
            : undefined,
        },
      }),
    ]);
    return { data: rows, total, limit, offset };
  }
}
