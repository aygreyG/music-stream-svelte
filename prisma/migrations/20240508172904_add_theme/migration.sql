-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "primary" TEXT NOT NULL DEFAULT '#c026d3',
    "accessability" TEXT NOT NULL DEFAULT '#FFFFFF',
    "rounding" INTEGER NOT NULL DEFAULT 15,
    "gradientStart" TEXT NOT NULL DEFAULT '#c026d3',
    "gradientMiddle" TEXT NOT NULL DEFAULT '#4f46e5',
    "gradientEnd" TEXT NOT NULL DEFAULT '#22d3ee',
    "gradientMiddlePoint" INTEGER NOT NULL DEFAULT 50,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
