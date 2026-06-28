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


## v5.3 original-design fix

This build goes back to the original v5 design instead of the v6 redesign.

Changes:
- Kept the v5 layout/style.
- Added the new Kings Music logo and app icons.
- Removed video files.
- Removed video UI.
- Cleared video metadata.
- Patched null `.onclick` errors with safe event binding.
- Updated cache-busting to `v=5.3`.
- Replaced service worker cache so older broken versions should clear.
