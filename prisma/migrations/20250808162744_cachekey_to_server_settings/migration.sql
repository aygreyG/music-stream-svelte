-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServerSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "musicFolder" TEXT NOT NULL,
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "jwtSecret" TEXT NOT NULL
);
INSERT INTO "new_ServerSettings" ("createdAt", "id", "jwtSecret", "musicFolder", "setupComplete", "updatedAt") SELECT "createdAt", "id", "jwtSecret", "musicFolder", "setupComplete", "updatedAt" FROM "ServerSettings";
DROP TABLE "ServerSettings";
ALTER TABLE "new_ServerSettings" RENAME TO "ServerSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
