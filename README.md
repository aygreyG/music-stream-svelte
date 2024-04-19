# Music Stream Svelte

## Table of Contents

- [What is this?](#what-is-this)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prequisites](#prequisites)
- [Installation](#installation)
  - [Docker](#docker)
  - [Manual](#manual)

---

## What is this?

This is a self-hosted music streaming service that allows you to stream the music stored on your computer/home server to any device.

![music-streamer2](https://github.com/aygreyG/music-stream-svelte/assets/78927537/24a847ef-46d4-455d-b187-985d7624892d)


---

## Tech Stack

- [SvelteKit (TypeScript)](https://kit.svelte.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma (PostgreSQL)](https://www.prisma.io/)

## Features

- Responsive design
- User authentication
- Streaming music
- Playlists
- Search
- Album covers through [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)

---

## Prequisites

- Proper metadata for your music files (artist, album, title)
- Album covers are fetched from MusicBrainz API, so it's recommended to have the correct album and artist names
- Music files must be stored in a directory that is accessible and modifiable by the server
- Music files must be of the following formats: `mp3`, `flac`, `wav`
- No folder that contains music files should start with a `.` or `-`

---

## Installation

### Docker

- Install PostgreSQL and create a database
- Install Docker
- With `docker run`

> make sure to replace `/path/to/music` with the path to your music directory and `postgresql://user:password@host:port/dbname` with your database URL

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/music:/music \
  -e DATABASE_URL=postgresql://user:password@host:port/dbname \
  aygreyg/svelte-music-stream
```

- if you want the server to be accessible from localhost add `-e ORIGIN=http://localhost:3000`

### Manual

- Install Node.js
- Install PostgreSQL and create a database
- Clone the repository
- Install dependencies and generate prisma client:

```bash
npm install && npx prisma generate
```

- Build the project:

```bash
npm run build
```

- If you want to remove unused dependencies run:

```bash
npm prune --production
```

- Make `start.sh` executable:

```bash
chmod +x start.sh
```

- If you only want to expose an explicit folder use `MUSIC_PATH=/path/to/music`
- If you want the server to be accessible from localhost add `ORIGIN=http://localhost:3000`
- Start the server with

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname ./start.sh
```
