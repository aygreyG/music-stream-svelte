export interface LrcLine {
  time: number; // seconds
  text: string;
}

// Matches a single timestamp [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
const TIMESTAMP_RE = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

// Matches metadata tags like [ar:Artist], [ti:Title] — skip these
const METADATA_RE = /^\[[a-zA-Z]+:/;

function parseTimestamp(minutes: string, seconds: string, hundredths?: string): number {
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);
  const h = hundredths ? parseInt(hundredths.padEnd(3, '0'), 10) / 1000 : 0;
  return m * 60 + s + h;
}

/**
 * Parse an LRC string into timed lyric lines, sorted ascending by time.
 * Empty-text lines are included (instrumental gaps). Metadata tags are ignored.
 * Handles multi-timestamp lines like [00:10.00][00:20.00]Hello.
 */
export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];

  for (const raw of lrc.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (METADATA_RE.test(line)) continue;

    const timestamps: number[] = [];
    let match: RegExpExecArray | null;
    let textStart = 0;

    TIMESTAMP_RE.lastIndex = 0;
    while ((match = TIMESTAMP_RE.exec(line)) !== null) {
      timestamps.push(parseTimestamp(match[1], match[2], match[3]));
      textStart = TIMESTAMP_RE.lastIndex;
    }

    if (timestamps.length === 0) continue;

    const text = line.slice(textStart).trim();

    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Returns the index of the currently active line for the given playback time,
 * or -1 if before the first line. Assumes `lines` is sorted ascending by time.
 */
export function getActiveLrcIndex(lines: LrcLine[], currentTime: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}
