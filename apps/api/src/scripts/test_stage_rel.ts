// apps/api/src/scripts/test_stage_rel.ts
import { PrismaClient, StageStatus } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  if (!project) throw new Error("Seed a Project first");

  const root = await prisma.stage.create({
    data: {
      projectId: project.id,
      code: "STG-ROOT",
      name: "Root Stage",
      status: StageStatus.NOT_STARTED,
      sortOrder: 1,
    },
  });

  const child = await prisma.stage.create({
    data: {
      projectId: project.id,
      parentId: root.id,
      code: "STG-CH-1",
      name: "Child 1",
      sortOrder: 1,
    },
  });

  const tree = await prisma.stage.findUnique({
    where: { id: root.id },
    include: {
      children: true,
      parent: true,
      project: { select: { id: true, code: true } },
    },
  });

  console.log({ root: root.code, children: tree?.children.map((c) => c.code) });
}
main().finally(() => prisma.$disconnect());
