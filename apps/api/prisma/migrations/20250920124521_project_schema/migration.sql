/*
  Warnings:

  - Made the column `code` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;
