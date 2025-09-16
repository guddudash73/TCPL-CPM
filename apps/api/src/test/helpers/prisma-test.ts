import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export const getPrisma = () => {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
};

export const ensureUserWithRole = async (
  email: string,
  passwordHash: string,
  roleName: string,
  name = "Test User"
) => {
  const p = getPrisma();

  const role = await p.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName },
  });

  const emailLower = email.toLowerCase();

  const user = await p.user.upsert({
    where: { emailLower },
    update: {},
    create: {
      name,
      email,
      emailLower,
      passwordHash,
      roleId: role.id,
    },
  });

  return { role, user };
};
