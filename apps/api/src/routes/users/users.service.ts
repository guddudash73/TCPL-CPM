import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { env } from "@tcpl-cpm/config";
import type { CreateUserInput } from "./users.schema";

export async function createUserByAdmin(input: CreateUserInput) {
  const emailLower = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      emailLower,
      passwordHash,
      roleId: input.roleId,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      roleId: true,
      name: true,
      createdAt: true,
    },
  });

  return user;
}
