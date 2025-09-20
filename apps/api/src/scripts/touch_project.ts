import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!p) throw new Error("No project found");
  console.log("before:", p.updatedAt);
  const updated = await prisma.project.update({
    where: { id: p.id },
    data: { description: (p.description || "") + " ." }, // tweak field
  });
  console.log("after :", updated.updatedAt);
}
main().finally(() => prisma.$disconnect());
