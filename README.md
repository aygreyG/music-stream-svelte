# Music Stream Svelte


## Table of Contents

- [What is this?](#what-is-this)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prequisites](#prequisites)
- [Installation](#installation)
  - [Docker](#docker)
  - [Manual](#manual)
  - [Development](#development)

---

## What is this?

A self-hosted music streaming service built with SvelteKit that allows you to stream the music stored on your computer/home server to any device with a browser. 🎶

<img width="179" height="409" alt="Screenshot 2026-02-23 at 19-51-38 Albums Svelte Music Streamer" src="https://github.com/user-attachments/assets/3a984ccc-52d4-42e3-8fec-ac3e923e73cd" />

<img width="633" height="409" alt="Screenshot 2026-02-23 at 19-46-38 I°_°I - Caravan Palace Svelte Music Streamer" src="https://github.com/user-attachments/assets/d09febf0-6f98-4a29-9239-51dc15194014" />

<br />

<img width="633" height="409" alt="Screenshot 2026-02-23 at 19-52-30 Albums Svelte Music Streamer" src="https://github.com/user-attachments/assets/c50f8e10-88ce-47ed-88d6-166dff5c2f33" />

<img width="179" height="409" alt="Screenshot 2026-02-23 at 19-50-49 Born To Die - Lana Del Rey Svelte Music Streamer" src="https://github.com/user-attachments/assets/254f61e1-af1f-4be2-a6b3-3325bbf80496" />

<br />

<img width="179" height="409" alt="Screenshot 2026-02-23 at 19-50-03 Kid A - Radiohead Svelte Music Streamer" src="https://github.com/user-attachments/assets/6eeb3aae-0d3e-4291-ae48-0b13723c3687" />

<img width="633" height="409" alt="Screenshot 2026-02-23 at 20-02-43 Playlists Svelte Music Streamer" src="https://github.com/user-attachments/assets/e1edb1bc-7984-417f-8a62-061eff7de526" />

---

## Tech Stack

- [SvelteKit (TypeScript)](https://kit.svelte.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma (with SQLite)](https://www.prisma.io/)

## Features

- Responsive design with color palette from album arts using material color utilities
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

### After installation

- The server will be running on port `3000`
- If it is a new installation, you will be redirected to the setup page
- Create an owner account and make sure to give a real email address (it is used for MusicBrainz API request headers)

### Docker

- Install Docker
- With `docker run`

> make sure to replace `/path/to/music` with the path to your music directory

> if you want to persist db in a known location or a named volume replace `/path/to/db/data` with the path to the folder or the name of the volume otherwise you can remove the volume flag

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/music:/music \
  <-v /path/to/db/data:/app/db> \
  aygreyg/svelte-music-stream
```

- if you want the server to be accessible from localhost add `-e ORIGIN=http://localhost:3000`

### Manual

- Install Node.js
- Clone the repository
- Install dependencies and generate prisma client:

```bash
pnpm install && pnpx prisma generate
```

- Build the project:

```bash
pnpm build
```

- If you want to remove unused dependencies run:

```bash
pnpm prune --production --ignore-scripts
```

- Make `start.sh` executable:

```bash
chmod +x start.sh
```

- If you only want to expose an explicit folder use `MUSIC_PATH=/path/to/music`
- If you want the server to be accessible from localhost add `ORIGIN=http://localhost:3000`
- Start the server with

```bash
 ./start.sh
```

### Development

- Install Node.js
- Install pnpm
- Clone the repository
- Install dependencies and generate prisma client:

```bash
pnpm install && pnpx prisma generate
```

- Start the server with

> add `--host` if you want to access the server from another device

```bash
pnpm dev
```

- If you are using a node manager (like `nvm`) and want to commit using a gui you might need [this](https://typicode.github.io/husky/how-to.html#node-version-managers-and-guis) to make husky work
