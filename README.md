# war — lyrics player

A single-song lyrics visualizer for "War" by keshi: blurred animated album-art
background + synced, scrolling lyrics.

## Where to put your files

- **Audio**: drop your file at `assets/audio/war.mp3`
  (if it's a different format like `.m4a`/`.wav`, either rename it to `war.mp3`
  or update the `src` on the `<audio>` tag in `index.html`)
- **Cover art**: drop an image at `assets/art/cover.jpg`
  (any image works — it's used both as the album art and blurred into the
  moving background; a square image looks best)
- **Lyrics**: replace the placeholder content in `lyrics/war.lrc` with real
  timestamped lyrics, in LRC format:

  ```
  [00:12.50] First line of the song
  [00:16.80] Next line
  ```

  `mm:ss.xx` = minutes:seconds.hundredths. If you can only find plain lyrics
  without timestamps, let me know and I'll build a quick "tap along" tool so
  you can generate the timestamps yourself while listening.

## Running it

Because the page fetches `lyrics/war.lrc` with JavaScript, opening
`index.html` directly by double-clicking it may not work in some browsers
(file:// pages block that kind of fetch). Easiest fix — serve the folder
locally:

```bash
# from this folder
npx serve -l 8000
```

Then open http://localhost:8000 in your browser.

(VS Code's "Live Server" extension also works if you have it installed.)

## Structure

```
index.html          the page
css/style.css        styling + background animation
js/player.js          audio playback, LRC parsing, lyric sync/scroll
assets/audio/war.mp3  your audio file (add this)
assets/art/cover.jpg  your cover image (add this)
lyrics/war.lrc         timestamped lyrics (add this)
```
