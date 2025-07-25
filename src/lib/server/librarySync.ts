import prisma from './prisma';
import { parseFile, type IAudioMetadata } from 'music-metadata';
import { readdir, stat, writeFile, access, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSettings } from './serverSettings';
import { getPalette, type Palette } from './images';
import { errorToNull, serverLog } from './utils';
import type { Artist } from '../../generated/prisma-client/client';

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

/**
 * Searches for an album file in a directory based on the given file names and album art file name.
 */
async function searchForAlbumFile(fileNames: string[], dir: string, albumArtFileName?: string) {
  const albumArtNames = [
    'front',
    'art',
    'albumart',
    'cover',
    'folder',
    albumArtFileName?.toLowerCase()
  ];
  for (const fileName of fileNames) {
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    if (
      fileExt === 'jpg' ||
      fileExt === 'jpeg' ||
      fileExt === 'png' ||
      fileExt === 'webp' ||
      fileExt === 'avif'
    ) {
      const fileBaseName = fileName.split('.').slice(0, -1).join('.').toLowerCase();
      if (albumArtNames.includes(fileBaseName)) {
        return join(dir, fileName);
      }
    }
  }
}

async function getAlbumArt(
  dir: string,
  fileData: IAudioMetadata,
  albumArtist: Artist
): Promise<{ albumLocation: string; palette: Palette } | null> {
  const regex = / |\.|\[|\]|\\|\//g;
  const albumArtFileName = `${albumArtist.name.replaceAll(
    regex,
    '_'
  )}_${fileData.common.album?.replaceAll(regex, '_')?.replaceAll('?', '')}`;

  const coversDir = join(dir, 'Covers');

  if (
    await access(coversDir)
      .then(() => true)
      .catch(() => false)
  ) {
    const coverFiles = await readdir(coversDir);
    const coverFile = await searchForAlbumFile(coverFiles, coversDir, albumArtFileName);

    if (coverFile) {
      return {
        albumLocation: coverFile,
        palette: await getPalette(coverFile)
      };
    }
  }

  // get album art from metadata
  const albumArt = fileData.common.picture?.[0].data;
  const albumArtType = fileData.common.picture?.[0].format.split('/')[1];
  const albumArtPath = join(dir, 'Covers', `${albumArtFileName}.${albumArtType}`);

  if (albumArt) {
    try {
      const coversDir = join(dir, 'Covers');
      await access(coversDir).catch(() => mkdir(coversDir));
      await writeFile(albumArtPath, albumArt);
      return {
        albumLocation: albumArtPath,
        palette: await getPalette(albumArtPath)
      };
    } catch (err) {
      serverLog(`Could not create album art file ${err}`, 'warn');
    }
  }

  // get album art from directory
  const files = await readdir(dir);
  const fileName = await searchForAlbumFile(files, dir);

  if (fileName) {
    try {
      const coversDir = join(dir, 'Covers');
      await access(coversDir).catch(() => mkdir(coversDir));
      const buffer = await readFile(fileName);
      const extension = fileName.split('.').pop();
      const pathToWrite = join(coversDir, albumArtFileName) + '.' + extension;
      await writeFile(pathToWrite, buffer);
      return {
        albumLocation: pathToWrite,
        palette: await getPalette(pathToWrite)
      };
    } catch (err) {
      serverLog(`Could not create album art file ${err}`, 'warn');
    }
  }

  return null;
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

function checkFileName(fileName: string) {
  const cantStartWith = ['.', '_'];

  for (const item of cantStartWith) {
    if (fileName.startsWith(item)) {
      return false;
    }
  }

  return true;
}

async function walk(dir: string) {
  const allowedExtensions = ['flac', 'wav', 'mp3'];
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (!checkFileName(file)) {
      continue;
    }
    const fileNameSplit = file.split('.');
    const extension = fileNameSplit[fileNameSplit.length - 1];

    if (fileStat.isDirectory()) {
      await walk(filePath);
    } else if (fileStat.isFile() && allowedExtensions.includes(extension)) {
      if (await checkDB(filePath, dir)) {
        tracksCreated++;
      }
    }
  }
}
