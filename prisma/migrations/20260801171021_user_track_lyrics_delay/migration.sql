-- CreateTable
CREATE TABLE "UserTrackLyricsDelay" (
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "delay" REAL NOT NULL,

    PRIMARY KEY ("userId", "trackId"),
    CONSTRAINT "UserTrackLyricsDelay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTrackLyricsDelay_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
