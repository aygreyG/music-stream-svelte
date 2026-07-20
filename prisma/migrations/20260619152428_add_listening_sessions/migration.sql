-- CreateTable
CREATE TABLE "ListeningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListeningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListeningEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "listenedDuration" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ListeningEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ListeningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListeningEvent_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate legacy Listened rows: each aggregate becomes a point-in-time session at updatedAt.
-- ponytail: 1:1 mapping, no synthetic grouping; real session boundaries weren't tracked pre-migration.
INSERT INTO "ListeningSession" ("id", "userId", "startedAt", "endedAt")
SELECT "id", "userId", "updatedAt", "updatedAt"
FROM "Listened";

INSERT INTO "ListeningEvent" ("id", "sessionId", "trackId", "startedAt", "listenedDuration")
SELECT
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
    "id",
    "trackId",
    "updatedAt",
    "listeningTime"
FROM "Listened";

-- DropTable
DROP TABLE "Listened";

-- CreateIndex
CREATE INDEX "ListeningSession_userId_endedAt_idx" ON "ListeningSession"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "ListeningEvent_sessionId_idx" ON "ListeningEvent"("sessionId");
