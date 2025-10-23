/*
  Warnings:

  - You are about to drop the `Meterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Meterial";

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "public"."Unit" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BOQItems" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" "public"."Unit" NOT NULL,
    "qtyPlanned" DECIMAL(16,3) NOT NULL,
    "ratePlanned" DECIMAL(65,30) NOT NULL,
    "materialId" TEXT,
    "stageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOQItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_sku_key" ON "public"."Material"("sku");

-- CreateIndex
CREATE INDEX "Material_name_idx" ON "public"."Material"("name");

-- CreateIndex
CREATE INDEX "Material_active_idx" ON "public"."Material"("active");

-- CreateIndex
CREATE INDEX "idx_boq_project_updated" ON "public"."BOQItems"("projectId", "updatedAt");

-- CreateIndex
CREATE INDEX "idx_boq_material" ON "public"."BOQItems"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_boq_project_code" ON "public"."BOQItems"("projectId", "code");

-- AddForeignKey
ALTER TABLE "public"."BOQItems" ADD CONSTRAINT "BOQItems_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQItems" ADD CONSTRAINT "BOQItems_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQItems" ADD CONSTRAINT "BOQItems_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
