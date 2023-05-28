/*
  Warnings:

  - You are about to drop the column `counryCode` on the `Restaurant` table. All the data in the column will be lost.
  - Added the required column `countryCode` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "counryCode",
ADD COLUMN     "countryCode" TEXT NOT NULL;
