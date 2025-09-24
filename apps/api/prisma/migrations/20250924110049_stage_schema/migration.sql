/*
  Warnings:

  - You are about to drop the column `actuaStart` on the `Stage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Stage" DROP COLUMN "actuaStart",
ADD COLUMN     "actualStart" TIMESTAMP(3),
ADD COLUMN     "description" TEXT;
