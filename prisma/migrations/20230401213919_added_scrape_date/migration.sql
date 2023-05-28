/*
  Warnings:

  - Added the required column `scrapedAt` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "scrapedAt" TIMESTAMP(3) NOT NULL;
