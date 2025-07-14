import type { Prisma } from '../../generated/prisma-client/client';

type Album = Prisma.AlbumGetPayload<{
  select: {
    albumArtId: true;
    id: true;
    title: true;
    albumArtDarkMuted: true;
    albumArtVibrant: true;
    albumArtMuted: true;
    albumArtLightVibrant: true;
    albumArtLightMuted: true;
    albumArtDarkVibrant: true;
  };
}> | null;

function getTheme() {
  let background = $state<string | null>(null);
  let currentAlbum = $state<Album>(null);
  const shownBackground = $derived(currentAlbum?.albumArtMuted || background || '#000000');

  return {
    get background() {
      return background;
    },
    set background(value: string | null) {
      background = value;
    },
    get currentAlbum() {
      return currentAlbum;
    },
    set currentAlbum(value: Album) {
      currentAlbum = value;
    },
    get shownBackground() {
      return shownBackground;
    }
  };
}

export const theme = getTheme();
