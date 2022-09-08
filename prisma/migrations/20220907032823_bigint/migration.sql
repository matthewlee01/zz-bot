/*
  Warnings:

  - The primary key for the `Member` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Member" DROP CONSTRAINT "Member_pkey",
ALTER COLUMN "guildId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Member_pkey" PRIMARY KEY ("tag", "guildId");
