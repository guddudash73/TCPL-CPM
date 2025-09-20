// apps/api/src/scripts/test_membership.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const [project, user, role] = await Promise.all([
    prisma.project.findFirst(),
    prisma.user.findFirst(),
    prisma.role.findFirst(),
  ]);
  if (!project || !user || !role) throw new Error('Seed project/user/role first');

  const m = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    create: { projectId: project.id, userId: user.id, roleId: role.id },
    update: {},
    include: { project: true, user: true, role: true },
  });

  console.log({ project: m.project.code, user: m.user.emailLower, role: m.role.name });
}
main().finally(() => prisma.$disconnect());
