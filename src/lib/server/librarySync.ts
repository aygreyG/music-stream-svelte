import prisma from './prisma';
import { parseFile } from 'music-metadata';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { getServerSettings, updateCacheKey } from './serverSettings';
import { getAlbumArt, getPalette } from './images';
import { errorToNull, isFileNameValid, serverLog } from './utils';
import { ALLOWED_MUSIC_FILE_EXTENSIONS } from '$lib/shared/consts';

let inProgress = false;
let tracksCreated = 0;

/**
 * Retrieves the current status of the library synchronization process.
 */
export function getLibrarySyncInProgress() {
  return inProgress;
}

/**
 * Runs a full library synchronization process.
 * Deletes all existing tracks, albums, and artists from the database
 * and then initiates a new library synchronization.
 */
export async function runFullLibrarySync() {
  const settings = await getServerSettings();
  if (inProgress || !settings?.setupComplete) {
    return;
  }

  inProgress = true;

  await prisma.$transaction(
    async (tx) => {
      await tx.track.deleteMany();
      await tx.album.deleteMany();
      await tx.artist.deleteMany();
    },
    { maxWait: 5000, timeout: 10000 }
  );

  inProgress = false;

  runLibrarySync();
}

/**
 * Runs the library synchronization process.
 * This function synchronizes the music library by walking through the music folder,
 * deleting outdated tracks and albums, and creating new tracks.
 */
export async function runLibrarySync() {
  const settings = await getServerSettings();
  if (inProgress || !settings?.setupComplete) {
    return;
  }

  tracksCreated = 0;
  inProgress = true;

  const startTime = Date.now();
  serverLog('Starting library sync');
  await walk(settings.musicFolder);
  const endTime = Date.now();
  const elapsedSec = Math.round((endTime - startTime) / 100) / 10;
  serverLog(`Finished library sync in ${elapsedSec}s`);

  const { count } = await prisma.track.deleteMany({
    where: {
      updatedAt: {
        lt: new Date(startTime)
      }
    }
  });

  if (count > 0) {
    serverLog('Deleted ' + count + ' track(s)');
    const { count: albumCount } = await prisma.album.deleteMany({
      where: {
        tracks: {
          none: {}
        }
      }
    });

    if (albumCount > 0) {
      serverLog('Deleted ' + albumCount + ' album(s)');
    }
  }

  if (tracksCreated > 0) {
    await prisma.folderScan.create({
      data: {
        scanLength: elapsedSec,
        serverSettings: { connect: { id: settings.id } },
        newTracks: tracksCreated
      }
    });

    serverLog('Created ' + tracksCreated + ' track(s)');
  }

  if (count > 0 || tracksCreated > 0) {
    await updateCacheKey();
  }

  inProgress = false;
}

/**
 * Breaks up artist names that have multiple artists in them
 */
function breakFeatures(artistName: string): string[] {
  const regex = /(featuring|\+|feat\.|feat|Feat|Feat.|FEAT|FEAT.|Featuring|FEATURING|;) /g;
  const regexWithoutSpace =
    /(featuring|\+|feat\.|feat|Feat|Feat.|FEAT|FEAT.|Featuring|FEATURING|;)/g;
  const artistNameSplit = artistName
    .split(regex)
    .filter((artist) => artist !== '' && !artist.match(regexWithoutSpace));

  return artistNameSplit.map((artist) => artist.trim());
}

function sanitizeArtistName(artist: string) {
  return artist
    .replaceAll(',', '')
    .replaceAll("'", '')
    .replaceAll('&', 'and')
    .replaceAll('+', 'and')
    .trim()
    .toLowerCase();
}

async function checkDB(filePath: string, dir: string): Promise<boolean> {
  const track = await prisma.track.findUnique({ where: { filePath } });

  if (!track) {
    const data = await errorToNull(parseFile(filePath), `Error parsing file ${filePath}`, true);
    if (!data) {
      return false;
    }

    if (!data.common.title || !data.common.artists || !data.common.album) {
      const missingData = [];
      if (!data.common.title) {
        missingData.push('title');
      }

      if (!data.common.artists) {
        missingData.push('artists');
      }

      if (!data.common.album) {
        missingData.push('album');
      }

      serverLog(
        `Couldn't get ${missingData.join(', ')} metadata from file: ${filePath}. Please provide the needed tags! (${missingData.join(', ')})`,
        'warn'
      );
      return false;
    }

    const allArtists = data.common.artists;
    const artistSet = new Set<string>();
    const albumArtistName = data.common.albumartist || breakFeatures(allArtists[0])[0];
    const allGenres = data.common.genre || [];
    const genres: string[] = [];

    allGenres.forEach((genre: string) => {
      genre.split(/,|;|\//).forEach((g) => genres.push(g.trim().toLowerCase()));
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          const albumArtist = await tx.artist.upsert({
            where: { sanitized: sanitizeArtistName(albumArtistName) },
            create: { name: albumArtistName, sanitized: sanitizeArtistName(albumArtistName) },
            update: { updatedAt: new Date() }
          });

          allArtists.forEach((artist: string) => {
            breakFeatures(artist).forEach((a) => artistSet.add(a));
          });

          if (artistSet.size === 0) {
            artistSet.add(albumArtistName);
          }

          let album = await tx.album.findUnique({
            where: {
              title_albumArtistId: {
                title: data.common.album as string,
                albumArtistId: albumArtist.id
              }
            },
            include: {
              tracks: true
            }
          });

          if (!album) {
            const albumArt = await getAlbumArt(dir, data, albumArtist);
            album = await tx.album.create({
              data: {
                title: data.common.album as string,
                releaseDate: data.common.date?.split('-')[0] || data.common.year?.toString(),
                albumArtist: {
                  connect: { id: albumArtist.id }
                },
                albumArt: albumArt ? albumArt.albumLocation : null,
                albumArtId: albumArt ? crypto.randomUUID() : null,
                albumArtVibrant: albumArt ? albumArt.palette.vibrant : null,
                albumArtMuted: albumArt ? albumArt.palette.muted : null,
                albumArtDarkVibrant: albumArt ? albumArt.palette.darkVibrant : null,
                albumArtDarkMuted: albumArt ? albumArt.palette.darkMuted : null,
                albumArtLightVibrant: albumArt ? albumArt.palette.lightVibrant : null,
                albumArtLightMuted: albumArt ? albumArt.palette.lightMuted : null
              },
              include: {
                tracks: true
              }
            });
          }

          await tx.track.create({
            data: {
              title: data.common.title as string,
              filePath,
              length: data.format.duration || 0,
              album: {
                connect: { id: album.id }
              },
              trackNumber: data.common.track.no || album.tracks.length + 1,
              discNumber: data.common.disk.no?.toString() || '1',
              artists: {
                connectOrCreate: Array.from(artistSet).map((artistName) => ({
                  where: { sanitized: sanitizeArtistName(artistName) },
                  create: { name: artistName, sanitized: sanitizeArtistName(artistName) }
                }))
              },
              tags: {
                connectOrCreate: genres.map((genre) => ({
                  where: { name: genre },
                  create: { name: genre }
                }))
              }
            }
          });
        },
        { maxWait: 5000, timeout: 10000 }
      );
    } catch (err) {
      serverLog(`Error creating/updating track: ${err}`, 'error');
      return false;
    }

    return true;
  } else {
    // Checking whether the album art has all the colors
    const album = await prisma.album.findUnique({
      where: { id: track.albumId }
    });

    if (album && album.albumArt && (!album.albumArtAccent || !album.albumArtVibrant)) {
      const palette = await getPalette(album.albumArt);
      await prisma.album.update({
        where: { id: album.id },
        data: {
          albumArtAccent: palette.vibrant,
          albumArtVibrant: palette.vibrant,
          albumArtMuted: palette.muted,
          albumArtDarkVibrant: palette.darkVibrant,
          albumArtDarkMuted: palette.darkMuted,
          albumArtLightVibrant: palette.lightVibrant,
          albumArtLightMuted: palette.lightMuted
        }
      });

      await updateCacheKey();

      serverLog(`Updated album art colors for album: ${album.title}`, 'info');
    }

    await prisma.track.update({
      where: { id: track.id },
      data: {
        updatedAt: new Date()
      }
    });
  }

  return false;
}

async function walk(dir: string) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (!isFileNameValid(file)) {
      continue;
    }
    const fileNameSplit = file.split('.');
    const extension = fileNameSplit[fileNameSplit.length - 1];

    if (fileStat.isDirectory()) {
      await walk(filePath);
    } else if (fileStat.isFile() && ALLOWED_MUSIC_FILE_EXTENSIONS.includes(extension)) {
      if (await checkDB(filePath, dir)) {
        tracksCreated++;
      }
    }
  }
}
