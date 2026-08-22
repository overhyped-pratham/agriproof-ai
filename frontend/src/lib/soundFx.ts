/**
 * Web Audio API Cinematic Sci-Fi Space & Satellite Telemetry Sound Synthesizer
 * Generates rich, zero-dependency cosmic audio sweeps, sub-bass whooshes,
 * and satellite telemetry chirps natively in the browser.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a cinematic deep-space zoom-in whoosh with atmospheric sub-bass rumble
 * and high-frequency orbital shimmer.
 */
export function playCinematicZoomSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Deep Sub-Bass Drone Sweep (40Hz -> 90Hz -> 50Hz)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(45, now);
  subOsc.frequency.exponentialRampToValueAtTime(110, now + 1.2);
  subOsc.frequency.exponentialRampToValueAtTime(55, now + 2.5);

  subGain.gain.setValueAtTime(0.001, now);
  subGain.gain.linearRampToValueAtTime(0.35, now + 0.8);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 3.0);

  // 2. Filtered Cosmic Atmospheric Wind / Whoosh (White Noise + Resonant Bandpass)
  const bufferSize = ctx.sampleRate * 2.5;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(180, now);
  filter.frequency.exponentialRampToValueAtTime(1400, now + 1.0);
  filter.frequency.exponentialRampToValueAtTime(320, now + 2.4);
  filter.Q.setValueAtTime(4.0, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.9);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  whiteNoise.start(now);
  whiteNoise.stop(now + 2.5);

  // 3. Ethereal Celestial Chord (Major 9th Space Harmonic Shimmer)
  const frequencies = [220, 277.18, 329.63, 440, 554.37, 659.25];
  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 1.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04 / (idx + 1), now + 1.0 + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 3.2);
  });

  // 4. Satellite Telemetry Digital Chirp
  setTimeout(() => {
    playSatelliteBeep();
  }, 1400);
}

/**
 * High-tech satellite telemetry lock-on beep
 */
export function playSatelliteBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1760, now); // A6
  osc.frequency.setValueAtTime(2637, now + 0.08); // E7
  osc.frequency.setValueAtTime(3520, now + 0.16); // A7

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * Namespace object — maps AI Studio usage pattern `soundFx.play*()` to
 * the underlying named functions defined above.
 */
export const soundFx = {
  playSpectralSelect: playSatelliteBeep,
  playPassTransition: playCinematicZoomSound,
  playSatelliteBeep,
  playCinematicZoomSound,
};
