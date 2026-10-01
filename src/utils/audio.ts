// Web Audio API Synthesizer for cheerful educational game sound effects & adventure background music

interface NoteEvent {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Background Music (BGM) state
  public isBgmPlaying: boolean = false;
  public bgmVolume: number = 0.3; // Gentle default volume (0 to 1)
  public bgmTrack: 'adventure' | 'cheerful' = 'adventure';
  private bgmTimer: number | null = null;
  private bgmGainNode: GainNode | null = null;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;

  // Listeners for UI state updates
  private bgmListeners: Array<(isPlaying: boolean, volume: number) => void> = [];

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public subscribeBgm(callback: (isPlaying: boolean, volume: number) => void) {
    this.bgmListeners.push(callback);
    return () => {
      this.bgmListeners = this.bgmListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyBgmChange() {
    this.bgmListeners.forEach((cb) => cb(this.isBgmPlaying, this.bgmVolume));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- SOUND EFFECTS (SFX) ---

  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // ignore
    }
  }

  playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  playPosComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 880, 1046.5]; // C5, E5, G5, A5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // ignore
    }
  }

  playTreasureChest() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const fanfare = [
        { f: 523.25, d: 0.15 },
        { f: 523.25, d: 0.15 },
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.4 },
        { f: 783.99, d: 0.3 },
        { f: 1046.5, d: 0.8 },
      ];
      let t = ctx.currentTime;
      fanfare.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + item.d + 0.05);
        t += item.d * 0.9;
      });
    } catch {
      // ignore
    }
  }

  // --- ADVENTURE BACKGROUND MUSIC (BGM) ENGINE ---

  public startBgm() {
    if (this.isBgmPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    // Master BGM gain node
    if (!this.bgmGainNode) {
      this.bgmGainNode = ctx.createGain();
      this.bgmGainNode.connect(ctx.destination);
    }
    this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, ctx.currentTime);

    this.notifyBgmChange();

    // Start playback loop scheduler
    this.scheduleBgmLoop();
  }

  public stopBgm() {
    if (!this.isBgmPlaying) return;
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.ctx && this.bgmGainNode) {
      this.bgmGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.notifyBgmChange();
  }

  public toggleBgm() {
    if (this.isBgmPlaying) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.bgmGainNode) {
      this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
    this.notifyBgmChange();
  }

  private scheduleBgmLoop = () => {
    if (!this.isBgmPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const tempo = 124; // BPM
    const secondsPer16th = 60 / tempo / 4; // ~0.121s

    // Schedule events in a lookahead window of 0.25 seconds
    while (this.nextNoteTime < ctx.currentTime + 0.25) {
      this.playBgmStep(this.currentStep, this.nextNoteTime, secondsPer16th);
      this.nextNoteTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 64; // 64 sixteenth-notes = 4 measures of 4/4
    }

    this.bgmTimer = window.setTimeout(this.scheduleBgmLoop, 60);
  };

  private playBgmStep(step: number, time: number, stepDuration: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    // Pitch Frequencies
    const notes: Record<string, number> = {
      C3: 130.81,
      E3: 164.81,
      F3: 174.61,
      G3: 196.0,
      A3: 220.0,
      B3: 246.94,
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.0,
      A4: 440.0,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      G5: 783.99,
      A5: 880.0,
    };

    // 1. Bassline (Walking energetic exploration bass on eighth notes: step % 2 === 0)
    // Measure 1: C Major (steps 0-15)
    // Measure 2: G Major (steps 16-31)
    // Measure 3: A Minor (steps 32-47)
    // Measure 4: F Major / G Major (steps 48-63)
    const bassPatterns: Array<string | null> = [
      // Measure 1: C
      'C3', null, 'G3', null, 'C3', null, 'E3', null, 'G3', null, 'C3', null, 'G3', null, 'E3', null,
      // Measure 2: G
      'G3', null, 'D4', null, 'G3', null, 'B3', null, 'D4', null, 'G3', null, 'D4', null, 'B3', null,
      // Measure 3: Am
      'A3', null, 'E3', null, 'A3', null, 'C4', null, 'E4', null, 'A3', null, 'E3', null, 'C4', null,
      // Measure 4: F -> G
      'F3', null, 'C4', null, 'F3', null, 'A3', null, 'G3', null, 'D4', null, 'G3', null, 'B3', null,
    ];

    const bassNote = bassPatterns[step];
    if (bassNote && notes[bassNote]) {
      this.triggerTone(notes[bassNote], time, stepDuration * 1.5, 'triangle', 0.22);
    }

    // 2. Playful Marimba / Flute Adventure Melody
    // Uplifting adventure motif (Super Mario RPG / Zelda Overworld inspired)
    const melodyPatterns: Array<{ note: string; len: number } | null> = [
      // Bar 1 (C Major)
      { note: 'G4', len: 1.5 }, null, { note: 'C5', len: 1.5 }, null,
      { note: 'E5', len: 2.0 }, null, null, null,
      { note: 'D5', len: 1.0 }, null, { note: 'C5', len: 1.5 }, null,
      { note: 'G4', len: 2.5 }, null, null, null,

      // Bar 2 (G Major)
      { note: 'B4', len: 1.5 }, null, { note: 'D5', len: 1.5 }, null,
      { note: 'G5', len: 2.5 }, null, null, null,
      { note: 'E5', len: 1.0 }, null, { note: 'D5', len: 1.0 }, null,
      { note: 'B4', len: 2.0 }, null, null, null,

      // Bar 3 (A Minor)
      { note: 'A4', len: 1.5 }, null, { note: 'C5', len: 1.5 }, null,
      { note: 'E5', len: 2.0 }, null, null, null,
      { note: 'A5', len: 2.5 }, null, null, null,
      { note: 'G5', len: 1.5 }, null, { note: 'E5', len: 1.5 }, null,

      // Bar 4 (F Major to G turnaround)
      { note: 'F5', len: 1.5 }, null, { note: 'E5', len: 1.0 }, null,
      { note: 'D5', len: 1.5 }, null, { note: 'C5', len: 1.0 }, null,
      { note: 'D5', len: 3.0 }, null, null, null,
      { note: 'G4', len: 2.0 }, null, null, null,
    ];

    const mel = melodyPatterns[step];
    if (mel && notes[mel.note]) {
      this.triggerTone(notes[mel.note], time, stepDuration * mel.len, 'sine', 0.24);
      // Secondary harmonic shimmer (octave overtone)
      this.triggerTone(notes[mel.note] * 2, time, stepDuration * 0.4, 'sine', 0.05);
    }

    // 3. Gentle Percussion / Woodblock Taps
    // Downbeats (steps 0, 8, 16, 24, 32, 40, 48, 56) and offbeat woodblocks
    if (step % 8 === 0) {
      this.triggerPercussion(time, 180, 0.04, 0.12);
    } else if (step % 4 === 2) {
      this.triggerPercussion(time, 560, 0.025, 0.08); // high woodblock tick
    }
  }

  private triggerTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Warm marimba/bell envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private triggerPercussion(
    startTime: number,
    freq: number,
    duration: number,
    volume: number
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + duration);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundController();
