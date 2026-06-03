-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lyrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackId" TEXT NOT NULL,
    "plainLyrics" TEXT,
    "syncedLyrics" TEXT,
    "instrumental" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lyrics_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lyrics" ("fetchedAt", "id", "plainLyrics", "source", "syncedLyrics", "trackId") SELECT "fetchedAt", "id", "plainLyrics", "source", "syncedLyrics", "trackId" FROM "Lyrics";
DROP TABLE "Lyrics";
ALTER TABLE "new_Lyrics" RENAME TO "Lyrics";
CREATE UNIQUE INDEX "Lyrics_trackId_key" ON "Lyrics"("trackId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
