import { toast } from 'svelte-sonner';

export type PlaybackErrorMode = 'normal' | 'debug' | 'off';

interface ErrorTrackInfo {
  id: string;
  title: string;
  artists: { name: string }[];
}

const TOAST_ID = 'playback-error';

const MEDIA_ERROR_LABELS: Record<number, string> = {
  1: 'Aborted',
  2: 'Network error',
  3: 'Decode error',
  4: 'Source not supported'
};

export function getPlaybackErrorMode(): PlaybackErrorMode {
  const mode = localStorage.getItem('playback-error-mode');
  if (mode === 'debug' || mode === 'off') return mode;
  return 'normal';
}

export function mediaErrorDetail(el: HTMLAudioElement): string {
  const err = el.error;
  if (!err) return 'Unknown error';

  const label = MEDIA_ERROR_LABELS[err.code] ?? 'Error';
  const suffix = err.message ? `: ${err.message}` : '';
  return `${label} (${err.code})${suffix}`;
}

export function isIgnorablePlayError(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'AbortError' || e.name === 'NotAllowedError');
}

export function resetPlaybackErrorToast() {
  toast.dismiss(TOAST_ID);
}

function trackLabel(track: ErrorTrackInfo): string {
  const artists = track.artists.map((a) => a.name).join(', ');
  return `${artists} - ${track.title}`;
}

function buildDescription(mode: PlaybackErrorMode, track: ErrorTrackInfo | null, detail: string) {
  if (mode === 'debug') return track ? `${detail} · ${trackLabel(track)} (${track.id})` : detail;
  return track ? `There was an error playing: ${trackLabel(track)}` : 'Could not play this track';
}

export function showPlaybackErrorToast(track: ErrorTrackInfo | null, detail: string) {
  const mode = getPlaybackErrorMode();
  if (mode === 'off') return;

  toast.error('Playback error', {
    id: TOAST_ID,
    description: buildDescription(mode, track, detail)
  });
}
