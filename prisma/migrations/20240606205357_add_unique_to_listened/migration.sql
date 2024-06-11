/*
  Warnings:

  - A unique constraint covering the columns `[userId,trackId]` on the table `Listened` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Listened_userId_trackId_key" ON "Listened"("userId", "trackId");
