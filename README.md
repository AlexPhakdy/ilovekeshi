# war — a one-song lyrics visualizer

A little "Now Playing" screen I built for one song: "War" by keshi (off
*Requiem*). Blurred lava-lamp background pulled from the album art, lyrics
that light up in sync with the vocals, mobile player UI inspired by
Spotify/Apple Music — built for fun, for one song, because I couldn't stop
listening to it.

**[Live demo →](https://ilovekeshi.vercel.app)**

## Why this exists

keshi is one of my favorite artists, and "War" is one of those songs I just
keep replaying — so I figured, why not build something around it instead of
just adding it to another playlist. I wanted the Spotify/Apple Music lyrics
experience (moving background, lyrics lighting up in sync with the vocals)
but as its own little thing, built just for this one song, not a generic
tool for any track. No login, no library, no settings. Open it, and it
plays "War."

Design-wise I was going for a real *mobile* now-playing screen — big album
art up top, lyrics that auto-scroll but you can also swipe through by hand,
a play button with a progress ring, and little ambient touches (drifting
particles, the cover tilting slightly as you move your phone, the
background breathing with the album's actual colors) so it feels less like
a webpage and more like an app I'd actually want to open.

## How this was built

This was built collaboratively with **Claude Code** (Anthropic's CLI-based
coding agent), used less like a code generator and more like a pair
programmer I could iterate with in plain language. Roughly how it went:

1. **Started from a one-line idea** — "a Spicetify-style lyrics view, but
   for one song, with a moving blurred background" — and Claude scaffolded
   the project structure (`index.html` / `css` / `js` split, an `.lrc`
   parser, asset folders) before any real content existed.
2. **Iterated visually, round by round.** Most changes came from me
   describing what I saw ("the color blobs should use the album cover's
   colors," "I can't see the line I click, it scrolls past it," "the album
   art needs to be bigger — like a real media player") rather than
   specifying code. Several rounds included screenshots from my phone,
   which Claude used to diagnose actual rendered layout problems, not just
   guess from the source.
3. **Debugged real bugs together**, not just added features — e.g. a
   lyric-centering bug that turned out to be `offsetTop` resolving against
   `<body>` instead of the scroll container (no `position: relative` on the
   parent), a `flex: align-items: center` double-centering the lyrics list
   on top of a manual transform, and a stray non-breaking-space character
   silently breaking string-based file edits.
4. **Went back and forth on scope.** Some ideas (an audio-reactive bar
   visualizer using the Web Audio API) were built, tested, and then
   deliberately removed in favor of simplicity once they didn't earn their
   place visually. Not everything Claude built stayed in the final version.
5. **Handled real device quirks**, like iOS Safari's floating bottom
   toolbar overlapping on-screen controls (not covered by the standard
   `safe-area-inset` API), autoplay policies blocking sound until a user
   gesture, and `createMediaElementSource` only being attachable once per
   `<audio>` element.
6. **Shipped it** — Claude also handled the deployment mechanics: fixing a
   case-sensitivity bug in the audio filename that only would have broken
   on Vercel's Linux servers (not on Windows, where the bug was invisible
   locally), committing, and pushing to GitHub for Vercel's Git integration
   to auto-deploy.

Every actual decision — what the intro says, how big the art should be,
what "feels right" for the motion — was mine. Claude's job was turning that
into working CSS/JS, catching bugs I never would've spotted just by
looking at the page, and speaking up when something I asked for wasn't
quite possible (e.g. telling me "Gotham Pro" is a paid font with no free
CDN version, and pointing me to Montserrat instead).

## Features

- Blurred, animated "lava lamp" background with colors sampled directly
  from the album art (via `<canvas>` pixel sampling, not hardcoded)
- Synced lyrics with word-by-word highlight-in as each line becomes active
- Tap any lyric line to jump playback to that timestamp
- Manually swipeable lyrics list that auto-resumes following playback after
  you stop scrolling
- Play/pause with a progress ring, animated icon swap, and press feedback
- Parallax tilt on the cover art (mouse on desktop, gyroscope or touch-drag
  on mobile)
- Cinematic fade-in/out intro line before playback begins
- Fully responsive, mobile-first layout with iOS safe-area handling

## Tech stack

Plain HTML, CSS, and JavaScript — no framework, no build step, no
dependencies. Deployed on [Vercel](https://vercel.com), connected to this
GitHub repo for automatic redeploys on push.

## Project structure

```
index.html             the page
css/style.css           styling + background/lyrics/UI animation
js/player.js             audio playback, LRC parsing, lyric sync, palette extraction
assets/audio/war.mp3     the track
assets/art/cover.jpg     album art
lyrics/war.lrc            timestamped lyrics
```

## Running it locally

Because the page fetches `lyrics/war.lrc` with JavaScript, opening
`index.html` directly (`file://`) won't work in most browsers. Serve it
locally instead:

```bash
npx serve -l 8000
```

Then open `http://localhost:8000`.

## Note on the audio/lyrics

"War" is written and performed by keshi — all credit to him. This is a
personal fan project, not an official or commercial release; the song and
lyrics are his.
