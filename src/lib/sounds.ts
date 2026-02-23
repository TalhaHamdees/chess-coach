/**
 * Chess sound effects using preloaded Audio elements.
 * Sound files are from Lichess (MIT license) — the standard chess sound set
 * matching the iconic Chess.com move/capture/check sounds.
 */

const SOUND_FILES = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  check: "/sounds/check.mp3",
  error: "/sounds/error.mp3",
  success: "/sounds/success.mp3",
  lowtime: "/sounds/lowtime.mp3",
} as const;

type SoundName = keyof typeof SOUND_FILES;

/** Preloaded Audio element cache */
const audioCache = new Map<SoundName, HTMLAudioElement>();

/** Whether we're in a browser environment */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

/** Preload a sound into cache */
function preload(name: SoundName): HTMLAudioElement | null {
  if (!isBrowser()) return null;

  const cached = audioCache.get(name);
  if (cached) return cached;

  try {
    const audio = new Audio(SOUND_FILES[name]);
    audio.preload = "auto";
    audio.volume = 0.7;
    audioCache.set(name, audio);
    return audio;
  } catch {
    return null;
  }
}

/** Play a named sound effect. Clones the audio element so overlapping plays work. */
function play(name: SoundName): void {
  if (!isBrowser()) return;

  const audio = preload(name);
  if (!audio) return;

  try {
    // Clone so rapid successive plays don't cut each other off
    const clone = audio.cloneNode(true) as HTMLAudioElement;
    clone.volume = audio.volume;
    const result = clone.play();
    // play() may return a promise in modern browsers
    if (result && typeof result.catch === "function") {
      result.catch(() => {
        // Browser blocked autoplay — silently ignore
      });
    }
  } catch {
    // Audio playback not supported in this environment — silently ignore
  }
}

/** Preload all sounds (call on first user interaction for best results) */
export function preloadAllSounds(): void {
  if (!isBrowser()) return;
  for (const name of Object.keys(SOUND_FILES) as SoundName[]) {
    preload(name);
  }
}

/** Play the standard piece move sound */
export function playMoveSound(): void {
  play("move");
}

/** Play the capture sound */
export function playCaptureSound(): void {
  play("capture");
}

/** Play the check / checkmate sound */
export function playCheckSound(): void {
  play("check");
}

/** Play the wrong move / illegal move sound */
export function playWrongMoveSound(): void {
  play("error");
}

/** Play the success / puzzle solved sound */
export function playSuccessSound(): void {
  play("success");
}

/** Play the low time warning sound */
export function playLowTimeSound(): void {
  play("lowtime");
}
