// apps/api/prisma/seed.ts
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
dotenvConfig({ path: resolve(__dirname, "../.env") }); // ensure DATABASE_URL is loaded from apps/api/.env

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const directUrl = process.env.DATABASE_URL;
if (!directUrl) {
  throw new Error("DATABASE_URL is not set. Put it in apps/api/.env");
}

const BCRYPT_COST = Number.parseInt(process.env.BCRYPT_COST ?? "12", 10);

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
  log:
    process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "error", "warn"],
});

async function upsertRoles() {
  const roles = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "VIEWER"];
  await prisma.$transaction(
    roles.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  return roles;
}

async function upsertUser(
  email: string,
  password: string,
  roleName: string,
  name: string
) {
  const emailLower = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  return prisma.user.upsert({
    where: { emailLower },
    update: {},
    create: {
      email,
      emailLower,
      name,
      passwordHash,
      role: { connect: { name: roleName } }, // Role.name is unique
    },
  });
}

// async function upsertProjects() {
//   await prisma.project.upsert({
//     where: { name: "Sample Project" },
//     update: {},
//     create: {
//       name: "Sample Project",
//       description: "test-1 project for TCPL-CPM",
//     },
//   });

  // await prisma.project.upsert({
  //   where: { name: "Phase-2 Expansion" },
  //   update: {},
  //   create: {
  //     name: "Phase-2 Expansion",
  //     description: "additional sample project for demos",
  //   },
  // });
// }

async function main() {
  await upsertRoles();

  // Admin
  await upsertUser("admin@tecnoglance.com", "admin123", "ADMIN", "admin");

  // Extra users for quick testing
  await upsertUser(
    "pm@tecnoglance.com",
    "pm123",
    "PROJECT_MANAGER",
    "project manager"
  );
  await upsertUser(
    "engineer@tecnoglance.com",
    "eng123",
    "SITE_ENGINEER",
    "engineer"
  );
  await upsertUser("viewer@tecnoglance.com", "view123", "VIEWER", "viewer");
  await upsertUser("viewer2@tecnoglance.com", "view123", "VIEWER", "viewer2");

  // await upsertProjects();
}

main()
  .then(() => console.log("✅ seed complete"))
  .catch((e) => {
    console.error("❌ seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
