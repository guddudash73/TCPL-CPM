// apps/api/src/scripts/seed.ts
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { env } from "@tcpl-cpm/config";

async function main() {
  // Roles
  const roles = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "VIEWER"];
  await Promise.all(
    roles.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Admin user
  const adminEmail = "admin@example.com";
  const adminEmailLower = adminEmail.toLowerCase();
  const adminPasswordHash = await bcrypt.hash("Admin@123", env.BCRYPT_COST);
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) throw new Error("ADMIN role missing");

  await prisma.user.upsert({
    // ❗ use emailLower (unique), not email
    where: { emailLower: adminEmailLower },
    update: {},
    create: {
      email: adminEmail,
      emailLower: adminEmailLower,
      // ❗ use passwordHash (Prisma field), not password
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      name: "System Admin",
      status: "ACTIVE",
    },
  });

  console.log("[seed] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
