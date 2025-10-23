import { PrismaClient, Unit } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const materials = [
    {
      sku: "MAT-CEM-OPC43",
      name: "Cement OPC 43 Grade",
      unit: Unit.NOS,
      description: "Bag, ~50kg",
    },
    { sku: "MAT-AGG-20MM", name: "Aggregate 20mm", unit: Unit.CUM },
    { sku: "MAT-REBAR-12", name: "Rebar TMT 12mm", unit: Unit.KG },
    { sku: "TMT-20MM_TATA", name: "Tata Tiscon 20mm", unit: Unit.KG },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { sku: m.sku },
      update: {
        name: m.name,
        unit: m.unit,
        description: m.description ?? undefined,
        active: true,
      },
      create: m,
    });
  }
}

main().finally(() => prisma.$disconnect());
