import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const directUrl = process.env.DATABASE_URL;
if (!directUrl) {
  throw new Error("DATABASE_URL is not set, put it in apps/api/.env");
}

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
  log:
    process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "error", "warn"],
});

async function main() {
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

  const adminEmail = "admin@tecnoglance.com";
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: passwordHash,
      role: { connect: { name: "ADMIN" } },
    },
  });

  await prisma.project.upsert({
    where: {name: "Sample Project"},
    update: {},
    create: {
        name: "Sample Project",
        description: "test-1 project for TCPL-CPM"
    }
  })
}

main().then(()=>console.log("✅ seed complete")).catch((e)=>{
    console.error("❌ seed failed:", e);
    process.exit(1);
}).finally(async()=>{
    await prisma.$disconnect();
})
