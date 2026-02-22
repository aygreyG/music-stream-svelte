/*
  Warnings:

  - You are about to drop the column `albumArtAccent` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtDarkMuted` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtDarkVibrant` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtLightMuted` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtLightVibrant` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtMuted` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `albumArtVibrant` on the `Album` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "releaseDate" TEXT,
    "albumArt" TEXT,
    "albumArtId" TEXT,
    "albumArtistId" TEXT NOT NULL,
    CONSTRAINT "Album_albumArtistId_fkey" FOREIGN KEY ("albumArtistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("albumArt", "albumArtId", "albumArtistId", "createdAt", "id", "releaseDate", "title", "updatedAt") SELECT "albumArt", "albumArtId", "albumArtistId", "createdAt", "id", "releaseDate", "title", "updatedAt" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE INDEX "Album_title_idx" ON "Album"("title");
CREATE INDEX "Album_releaseDate_idx" ON "Album"("releaseDate");
CREATE INDEX "Album_releaseDate_title_idx" ON "Album"("releaseDate", "title");
CREATE INDEX "Album_id_albumArtId_idx" ON "Album"("id", "albumArtId");
CREATE UNIQUE INDEX "Album_title_albumArtistId_key" ON "Album"("title", "albumArtistId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
