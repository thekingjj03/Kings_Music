# Kings Music v1

A static PWA-style music player for Kings Cuts Productions / KingJJ releases.

## What is included

- Mobile-first Kings Music homepage
- Your Kings Cuts Productions logo
- Overthinking cover art
- Overthinking audio file
- Song cards
- Bottom music player
- Search/filter
- PWA manifest and app icons
- Basic service worker
- Placeholder slots for future releases

## How to test on Mac

Because `songs.json` loads with JavaScript, some browsers may block it if you simply double-click `index.html`.

The best local test is:

```bash
cd path/to/kings-music-v1
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How to add a new song

1. Put the audio file in `assets/audio/`
2. Put the cover art in `assets/covers/`
3. Add a new object to `songs.json`

Example:

```json
{
  "id": "new-song-id",
  "title": "New Song",
  "artist": "KingJJ",
  "type": "Single",
  "releaseDate": "2026",
  "cover": "assets/covers/new-song.jpg",
  "audio": "assets/audio/new-song.m4a",
  "lyrics": "lyrics/new-song.html",
  "video": "",
  "credits": "Written and performed by KingJJ.",
  "featured": false
}
```

## Cloudflare Pages settings

For a simple static site:

- Framework preset: None
- Build command: leave blank
- Build output directory: `/`

## Important

Do not upload huge WAV files or music videos to the project. Use compressed audio for the web.
