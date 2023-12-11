import type { Artist, ServerSettings } from '@prisma/client';
import prisma from './prisma';
import * as mm from 'music-metadata';
import { readdir, stat, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSettings } from './serverSettings';

let inProgress = false;
let tracksCreated = 0;

export function getLibrarySyncInProgress() {
  return inProgress;
}

export async function runLibrarySync() {
  const settings = await getServerSettings();
  if (inProgress || !settings?.setupComplete) {
    return;
  }

  tracksCreated = 0;
  inProgress = true;

  const startTime = Date.now();
  console.log('Starting library sync at ' + new Date(startTime).toISOString());
  await walk(settings.musicFolder);
  const endTime = Date.now();
  const elapsedSec = Math.round((endTime - startTime) / 100) / 10;
  console.log('Finished library sync at ' + new Date(endTime).toISOString());
  console.log('Elapsed time: ' + elapsedSec + 's');

  const { count } = await prisma.track.deleteMany({
    where: {
      updatedAt: {
        lt: new Date(startTime)
      }
    }
  });

  console.log('Deleted ' + count + ' track(s)');

  if (count > 0) {
    const { count: albumCount } = await prisma.album.deleteMany({
      where: {
        tracks: {
          none: {}
        }
      }
    });

    console.log('Deleted ' + albumCount + ' album(s)');
  }

  if (tracksCreated > 0) {
    await prisma.folderScan.create({
      data: {
        scanLength: elapsedSec,
        serverSettings: { connect: { id: settings.id } },
        newTracks: tracksCreated
      }
    });

    console.log('Created ' + tracksCreated + ' track(s)');
  }

  inProgress = false;
}

function breakFeatures(artistName: string): string[] {
  const regex = /(featuring|\+|feat\.|feat|Feat|Feat.|FEAT|FEAT.|Featuring|FEATURING|;)+/g;
  const artistNameSplit = artistName
    .split(regex)
    .filter((artist) => artist !== '' && !artist.match(regex));

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

async function searchForAlbumFile(fileNames: string[], dir: string, albumArtFileName?: string) {
  const albumArtNames = ['front', 'art', 'albumart', 'cover', 'folder', albumArtFileName];
  for (const fileName of fileNames) {
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    if (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png') {
      const fileBaseName = fileName.split('.').slice(0, -1).join('.').toLowerCase();
      if (albumArtNames.includes(fileBaseName)) {
        return join(dir, fileName);
      }
    }
  }
}

async function getAlbumArt(dir: string, fileData: mm.IAudioMetadata, albumArtist: Artist) {
  const regex = / |\.|\[|\]|\\|\//g;
  const albumArtFileName = `${albumArtist.name.replaceAll(
    regex,
    '_'
  )}_${fileData.common.album?.replaceAll(regex, '_')}`;

  const coversDir = join(dir, 'Covers');

  if (
    await access(coversDir)
      .then(() => true)
      .catch(() => false)
  ) {
    const coverFiles = await readdir(coversDir);
    const coverFile = await searchForAlbumFile(coverFiles, coversDir, albumArtFileName);

    if (coverFile) {
      return coverFile;
    }
  }

  const albumArt = fileData.common.picture?.[0].data;
  const albumArtType = fileData.common.picture?.[0].format.split('/')[1];
  const albumArtPath = join(dir, 'Covers', `${albumArtFileName}.${albumArtType}`);

  if (albumArt) {
    try {
      const coversDir = join(dir, 'Covers');
      await access(coversDir).catch(() => mkdir(coversDir));
      await writeFile(albumArtPath, albumArt);
      return albumArtPath;
    } catch (err) {
      console.error('Could not create album art file', err);
    }
  }

  const files = await readdir(dir);
  const fileName = await searchForAlbumFile(files, dir);

  if (fileName) {
    return fileName;
  }

  return null;
}

async function checkDB(filePath: string, dir: string): Promise<boolean> {
  let track = await prisma.track.findUnique({ where: { filePath } });

  if (!track) {
    const data = await mm.parseFile(filePath);
    if (!data.common.title || !data.common.artists || !data.common.album) {
      console.error(
        `Couldn't get artist and/or title and/or album metadata from file: ${filePath}
        Please provide the needed tags! (artists, title, album)`
      );
      return false;
    }

    const allArtists = data.common.artists;
    const artistSet = new Set<string>();
    const albumArtistName = data.common.albumartist || breakFeatures(allArtists[0])[0];
    const allGenres = data.common.genre || [];
    const genres: string[] = [];

    allGenres.forEach((genre) => {
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

          allArtists.forEach((artist) => {
            breakFeatures(artist).forEach((a) => artistSet.add(a));
          });

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
            album = await tx.album.create({
              data: {
                title: data.common.album as string,
                releaseDate: data.common.date || data.common.year?.toString(),
                albumArtist: {
                  connect: { id: albumArtist.id }
                },
                albumArt: await getAlbumArt(dir, data, albumArtist)
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
      console.error(err);
      return false;
    }

    return true;
  } else {
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
    } else if (fileStat.isFile() && ['flac', 'wav', 'mp3'].includes(extension)) {
      if (await checkDB(filePath, dir)) {
        tracksCreated++;
      }
    }
  }
}
