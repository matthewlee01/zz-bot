-- CreateTable
CREATE TABLE "Member" (
    "tag" TEXT NOT NULL,
    "guildId" INTEGER NOT NULL,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Member_pkey" PRIMARY KEY ("tag","guildId")
);
