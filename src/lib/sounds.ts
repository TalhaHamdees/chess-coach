/** Simple move sound effects using Web Audio API */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  volume: number = 0.15,
  type: OscillatorType = "sine"
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/** Play a standard move sound */
export function playMoveSound(): void {
  playTone(600, 0.08, 0.12, "sine");
}

/** Play a capture sound (slightly lower, more percussive) */
export function playCaptureSound(): void {
  playTone(300, 0.12, 0.18, "triangle");
  setTimeout(() => playTone(200, 0.06, 0.1, "square"), 20);
}

/** Play a check sound (higher pitch alert) */
export function playCheckSound(): void {
  playTone(880, 0.1, 0.15, "sine");
  setTimeout(() => playTone(1100, 0.08, 0.12, "sine"), 80);
}

/** Play a wrong move sound (low buzz) */
export function playWrongMoveSound(): void {
  playTone(150, 0.2, 0.12, "sawtooth");
}

/** Play a success/completion sound */
export function playSuccessSound(): void {
  playTone(523, 0.12, 0.12, "sine"); // C5
  setTimeout(() => playTone(659, 0.12, 0.12, "sine"), 100); // E5
  setTimeout(() => playTone(784, 0.15, 0.12, "sine"), 200); // G5
}
