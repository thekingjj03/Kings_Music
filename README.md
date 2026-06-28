# Kings Music v4

Redesigned with Home, All Songs, Artists, Playlists, Now Playing screen, link/code playlist sharing, queue, lyrics, and Overthinking video.

Songs included:
- Back of my Mind — KingJJ
- Be Gone — KingJJ
- Boundless — KingJJ
- Childish — KingJJ
- Comeback — KingJJ
- Friendly Fire — KingJJ
- Gherkin — KingJJ
- Lies — KingJJ
- Life's a Gamble (prod. by Ralphy) — KingJJ
- Motivation — KingJJ
- No Remorse — KingJJ
- One Take — KingJJ
- Overthinking — KingJJ
- Prowess — KingJJ
- Return of the King-Child — KingJJ
- Takin' the Throne — KingJJ
- The Cookie Diss — KingJJ
- UNSTABLE — KingJJ
- Wake Up — KingJJ
- Was It All Just Pretend? — KingJJ

Files over 25 MiB:
None


## v5 update

- Release dates now show month and year when available.
- Song metadata now supports primary artists and featured artists.
- Artist pages use primary artist vs any appearance filtering.
- Overthinking video and audio now swap as one continuous track using the current timestamp.
- Playlist sharing uses link/code sharing only; no playlist download file is required.
- Playlist code data now uses a clean structured JSON payload encoded into a shareable code/link.
- Lyrics were regenerated from the uploaded info files with cleaner Genius-style spacing and section labels where inferable.
- Visual polish was added to song rows, playlist tools, Now Playing, lyrics, and video panels.

## Metadata notes to confirm later
- One Take was listed as Ralphy in its metadata/filename, so I kept Ralphy as the primary artist. You had said Ralphy is primary on two songs, so this may be one to confirm later.


## v5.4b OG design video/player fix

Built from the uploaded OG v5 package.

Changes:
- Keeps the original v5 design/layout.
- Adds the new Kings Music logo and app icons.
- Keeps all 20 audio files.
- Keeps the Overthinking video file and video button.
- Fixes the null `.onclick` startup crash.
- Uses safer event binding so missing elements do not crash the site.
- Uses v3-style audio/video switching:
  - audio pauses
  - video opens at the same timestamp
  - switching back resumes audio at the video timestamp
- Updates cache-busting to `v=5.4b`.
- Service worker clears older broken caches.


## v5.5 OG design no-video safe build

Built from the v5.4b OG design package.

Changes:
- Kept the original v5 design/layout.
- Kept the new Kings Music logo and app icons.
- Kept all 20 songs/audio files.
- Removed all video files.
- Cleared all video metadata from songs.json.
- Hid video UI completely.
- Kept hidden DOM placeholders so old v5 JavaScript does not crash with null `.onclick` errors.
- Added no-video overrides for video functions.
- Updated cache-busting to `v=5.5`.
- Service worker clears older broken caches.


## v5.6 update

- Added: Pain and Purpose (KingJJ Remaster) featuring Tae Sosa and Jaylin Bradley.
- Kept the current working v5 design.
- Removed/hid leftover Overthinking video/audio toggle controls.
- Kept all video files removed.
- Kept null `.onclick` safety behavior.
- Updated cache-busting to `v=5.6`.
