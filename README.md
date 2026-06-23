# Kings Music v2

A static PWA-style music player for Kings Cuts Productions / KingJJ releases.

## Songs currently included

- Overthinking
- No Remorse
- Lies
- Friendly Fire
- The Cookie Diss

## New in v2

- Added multiple releases from uploaded ZIP batches
- Cleaned lyric pages into a Genius-style format
- Removed empty folders / Mac metadata files
- Added video toggle support in the player
- Added in-app fullscreen-style video mode
- Added `.nojekyll` for GitHub Pages testing

## Important video note

The app now supports a video button/toggle, but the uploaded ZIPs did not include an actual Overthinking video file or video link.

To add a video later, edit `songs.json` and put a YouTube link or local MP4 path in the `video` field.

Example YouTube:

```json
"video": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

Example local file:

```json
"video": "assets/videos/overthinking.mp4"
```

For GitHub Pages testing, do not upload huge music videos. Use YouTube links or Cloudflare R2 later.

## How to test on Mac

Because `songs.json` loads with JavaScript, some browsers may block it if you simply double-click `index.html`.

The best local test is:

```bash
cd path/to/kings-music-v2
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages testing

Upload the contents of this folder to a GitHub repo.

Your repo should show:

```text
index.html
style.css
script.js
songs.json
manifest.json
service-worker.js
.nojekyll
assets/
lyrics/
```

Then enable Pages:

```text
Settings → Pages → Deploy from a branch → main → /root
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
  "credits": "Artist(s): KingJJ. Presented by Kings Cuts Productions.",
  "featured": false
}
```

## Cloudflare later

Long-term clean setup:

- GitHub = code
- Cloudflare Pages = app/site hosting
- Cloudflare R2 = audio/video storage
- YouTube = easiest music video option for now
