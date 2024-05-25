-- CreateIndex
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");

-- CreateIndex
CREATE INDEX "Track_trackNumber_idx" ON "Track"("trackNumber");

-- CreateIndex
CREATE INDEX "Track_title_idx" ON "Track"("title");

-- CreateIndex
CREATE INDEX "Track_albumId_trackNumber_idx" ON "Track"("albumId", "trackNumber");
