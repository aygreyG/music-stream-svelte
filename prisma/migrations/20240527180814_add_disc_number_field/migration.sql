-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "discNumber" TEXT;

-- CreateIndex
CREATE INDEX "Track_discNumber_trackNumber_idx" ON "Track"("discNumber", "trackNumber");

-- CreateIndex
CREATE INDEX "Track_albumId_discNumber_trackNumber_idx" ON "Track"("albumId", "discNumber", "trackNumber");
