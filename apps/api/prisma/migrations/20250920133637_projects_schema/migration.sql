/*
  Warnings:

  - You are about to drop the column `budgetMinor` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "budgetMinor",
ADD COLUMN     "budgetRupees" BIGINT NOT NULL DEFAULT 0;
