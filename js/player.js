const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause');
const seek = document.getElementById('seek');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');
const lyricsScroll = document.getElementById('lyrics-scroll');
const lyricsWrap = document.getElementById('lyrics-wrap');
const playIcon = playPauseBtn.querySelector('.icon');
const playIconPath = document.getElementById('play-icon-path');
const PLAY_PATH = 'M8 5v14l11-7z';
const PAUSE_PATH = 'M6 5h4v14H6zM14 5h4v14h-4z';
const progressRing = document.getElementById('progress-ring-fill');
const RING_CIRCUMFERENCE = 182.2;
const motesContainer = document.getElementById('motes');
const coverArt = document.getElementById('cover-art');

let lyrics = []; // [{ time: seconds, text: string }]
let focusIndex = -1;
let focusIsActive = false;

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Parses standard LRC format: [mm:ss.xx] lyric text
function parseLRC(text) {
  const lines = text.split('\n');
  const out = [];
  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeTag)];
    if (matches.length === 0) continue;
    const content = line.replace(timeTag, '').trim();
    for (const m of matches) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
      const time = min * 60 + sec + ms / 1000;
      out.push({ time, text: content });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

function renderLyrics() {
  lyricsScroll.innerHTML = '';
  lyrics.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'lyric-line';
    const words = (line.text || ' ').split(' ');
    words.forEach((word, wi) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.setProperty('--i', wi);
      span.textContent = word;
      div.appendChild(span);
      if (wi < words.length - 1) div.appendChild(document.createTextNode(' '));
    });
    div.dataset.index = i;
    div.addEventListener('click', () => {
      audio.currentTime = line.time;
      updateActiveLine();
    });
    lyricsScroll.appendChild(div);
  });
}

function updateActiveLine() {
  if (lyrics.length === 0) return;
  const t = audio.currentTime;

  // Which line to focus on: the most recent line whose timestamp has
  // passed, or line 0 (shown as upcoming, not yet active) before the song
  // has reached its first lyric.
  let newIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= t) newIndex = i;
    else break;
  }
  // Small epsilon: after a manual seek, audio.currentTime can read back a
  // hair below the target due to float rounding, which would otherwise
  // leave the clicked line stuck one frame short of "active".
  const isActive = t >= lyrics[newIndex].time - 0.05;

  if (newIndex === focusIndex && isActive === focusIsActive) return;
  focusIndex = newIndex;
  focusIsActive = isActive;

  const els = lyricsScroll.children;
  for (let i = 0; i < els.length; i++) {
    els[i].classList.remove('active', 'past');
    if (i === focusIndex && isActive) {
      els[i].classList.add('active');
    } else if (i < focusIndex || (i === focusIndex && !isActive && i > 0)) {
      els[i].classList.add('past');
    }
  }

  const focusEl = els[focusIndex];
  if (focusEl) {
    const offset = focusEl.offsetTop - (lyricsWrap.clientHeight / 2) + (focusEl.clientHeight / 2);
    lyricsScroll.style.transform = `translateY(${-offset}px)`;
  }
}

async function loadLyrics() {
  try {
    const res = await fetch('lyrics/war.lrc');
    if (!res.ok) throw new Error('not found');
    const text = await res.text();
    lyrics = parseLRC(text);
  } catch (e) {
    lyrics = [{ time: 0, text: 'Add timed lyrics to lyrics/war.lrc' }];
    console.warn('Could not load lyrics/war.lrc — if you opened this file directly (file://), run a local server instead. See README.', e);
  }
  renderLyrics();
  focusIndex = -1;
  focusIsActive = false;
  updateActiveLine();
}

function setIcon(isPlaying) {
  playIcon.classList.remove('bounce');
  void playIcon.offsetWidth; // restart the animation even if it's already mid-play
  playIconPath.setAttribute('d', isPlaying ? PAUSE_PATH : PLAY_PATH);
  playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  playIcon.classList.add('bounce');
}

playPauseBtn.addEventListener('click', () => {
  playPauseBtn.classList.remove('ripple');
  void playPauseBtn.offsetWidth;
  playPauseBtn.classList.add('ripple');

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', () => {
  setIcon(true);
  document.body.classList.remove('is-paused');
});

audio.addEventListener('pause', () => {
  setIcon(false);
  document.body.classList.add('is-paused');
});

audio.addEventListener('loadedmetadata', () => {
  seek.max = audio.duration;
  timeDuration.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  if (!seek.matches(':active')) {
    seek.value = audio.currentTime;
  }
  timeCurrent.textContent = formatTime(audio.currentTime);
  updateActiveLine();

  if (audio.duration) {
    const progress = audio.currentTime / audio.duration;
    progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  }
});

seek.addEventListener('input', () => {
  audio.currentTime = seek.value;
  if (audio.duration) {
    progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - seek.value / audio.duration);
  }
});

loadLyrics();

// Try to start playback as soon as the page opens. Browsers block unmuted
// autoplay without a prior user gesture, so if it's rejected, fall back to
// starting on the very first tap/click/keypress anywhere on the page.
function attemptAutoplay() {
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      const startOnGesture = () => {
        audio.play();
        document.removeEventListener('pointerdown', startOnGesture);
        document.removeEventListener('keydown', startOnGesture);
      };
      document.addEventListener('pointerdown', startOnGesture, { once: true });
      document.addEventListener('keydown', startOnGesture, { once: true });
    });
  }
}
attemptAutoplay();

// --- Cover art parallax tilt (mouse on desktop, gyroscope on mobile) ---

const MAX_TILT = 8;

function setTilt(x, y) {
  coverArt.style.setProperty('--tiltY', `${x}deg`);
  coverArt.style.setProperty('--tiltX', `${y}deg`);
}

window.addEventListener('mousemove', (e) => {
  const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  setTilt(dx * MAX_TILT, -dy * MAX_TILT);
});

function handleOrientation(e) {
  if (e.gamma === null || e.beta === null) return;
  const gamma = Math.max(-30, Math.min(30, e.gamma));
  const beta = Math.max(-30, Math.min(30, e.beta - 40)); // phones are typically held tilted back
  setTilt((gamma / 30) * MAX_TILT, -(beta / 30) * MAX_TILT);
}

function requestOrientationAccess() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      })
      .catch(() => {});
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}
document.addEventListener('pointerdown', requestOrientationAccess, { once: true });

// --- Drifting dust motes ---

function createMotes(count) {
  for (let i = 0; i < count; i++) {
    const mote = document.createElement('div');
    mote.className = 'mote';
    const size = 2 + Math.random() * 3;
    const duration = 18 + Math.random() * 18;
    const delay = -Math.random() * duration; // negative delay: already mid-flight on load
    mote.style.left = `${Math.random() * 100}%`;
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    mote.style.animationDuration = `${duration}s`;
    mote.style.animationDelay = `${delay}s`;
    mote.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
    motesContainer.appendChild(mote);
  }
}
createMotes(20);

// --- Lava blob colors, sampled from the cover art itself ---

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Boosts saturation and pulls lightness into a mid-range so muted/dark
// source colors still read as a glowing lava blob.
function vividize(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const s2 = Math.min(1, s * 1.7 + 0.2);
  const l2 = Math.min(0.6, Math.max(0.4, l * 1.3));
  const [nr, ng, nb] = hslToRgb(h, s2, l2);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function extractPalette(img) {
  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  try {
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const half = size / 2;
    const quadrants = {
      'blob-1': [0, 0],       // top-left
      'blob-3': [half, 0],    // top-right
      'blob-4': [0, half],    // bottom-left
      'blob-2': [half, half], // bottom-right
    };
    for (const [blobClass, [qx, qy]] of Object.entries(quadrants)) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let y = qy; y < qy + half; y++) {
        for (let x = qx; x < qx + half; x++) {
          const idx = (y * size + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      const color = vividize(r / count, g / count, b / count);
      const el = document.querySelector(`.${blobClass}`);
      if (el) el.style.setProperty('--blob-color', color);
    }
  } catch (e) {
    console.warn('Could not sample colors from cover art (likely a CORS/file:// issue) — using default palette.', e);
  }
}

const coverImg = document.getElementById('cover-art');
if (coverImg.complete && coverImg.naturalWidth > 0) {
  extractPalette(coverImg);
} else {
  coverImg.addEventListener('load', () => extractPalette(coverImg));
}
