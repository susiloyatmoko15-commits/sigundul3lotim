// Web Audio API Synthesizer & Custom Audio/Video BGM Engine
// Features the Cinematic Flute, Harp, Celesta & Epic Orchestra Adventure Theme (G Minor / Bb Major, 108 BPM)
// Plus persistent custom MP3/MP4 audio file support via IndexedDB

const IDB_NAME = 'sigundul_audio_db';
const IDB_STORE = 'custom_bgm';
const IDB_KEY = 'user_adventure_bgm';

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveCustomAudioBlob(blob: Blob, fileName: string): Promise<void> {
  try {
    const db = await openAudioDb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ blob, fileName }, IDB_KEY);
  } catch {
    // ignore storage errors
  }
}

async function loadCustomAudioBlob(): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openAudioDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearCustomAudioBlob(): Promise<void> {
  try {
    const db = await openAudioDb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
  } catch {
    // ignore
  }
}

// Note frequencies in G Minor / Bb Major (G, A, Bb, C, D, Eb, F)
const NOTE_FREQ: Record<string, number> = {
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  C3: 130.81,
  D3: 146.83,
  Eb3: 155.56,
  F3: 174.61,
  'F#3': 185.0,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  Eb4: 311.13,
  F4: 349.23,
  'F#4': 369.99,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  F5: 698.46,
  'F#5': 739.99,
  G5: 783.99,
  A5: 880.0,
  Bb5: 932.33,
  C6: 1046.5,
  D6: 1174.66,
};

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Background Music (BGM) state
  public isBgmPlaying: boolean = false;
  public bgmVolume: number = 0.45;
  public customTrackName: string | null = null;

  private bgmTimer: number | null = null;
  private bgmGainNode: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;

  // Custom HTMLAudioElement for uploaded MP4/MP3
  private customAudioEl: HTMLAudioElement | null = null;
  private customObjectUrl: string | null = null;

  // Listeners for UI state updates
  private bgmListeners: Array<(isPlaying: boolean, volume: number, customName: string | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.restoreCustomTrack();
    }
  }

  private async restoreCustomTrack() {
    const saved = await loadCustomAudioBlob();
    if (saved && saved.blob) {
      this.setupCustomAudioElement(saved.blob, saved.fileName, false);
    }
  }

  private setupCustomAudioElement(blob: Blob, fileName: string, autoPlay: boolean) {
    if (this.customObjectUrl) {
      URL.revokeObjectURL(this.customObjectUrl);
    }
    if (this.customAudioEl) {
      this.customAudioEl.pause();
    }

    const url = URL.createObjectURL(blob);
    this.customObjectUrl = url;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.bgmVolume;
    this.customAudioEl = audio;
    this.customTrackName = fileName;

    if (autoPlay || this.isBgmPlaying) {
      this.stopSynthLoop();
      this.isBgmPlaying = true;
      audio.play().catch(() => {
        // Autoplay blocked until next click
      });
    }
    this.notifyBgmChange();
  }

  public async setCustomBgmFile(file: File): Promise<void> {
    await saveCustomAudioBlob(file, file.name);
    this.setupCustomAudioElement(file, file.name, true);
  }

  public async clearCustomBgmFile(): Promise<void> {
    await clearCustomAudioBlob();
    if (this.customAudioEl) {
      this.customAudioEl.pause();
      this.customAudioEl = null;
    }
    if (this.customObjectUrl) {
      URL.revokeObjectURL(this.customObjectUrl);
      this.customObjectUrl = null;
    }
    this.customTrackName = null;
    if (this.isBgmPlaying) {
      this.isBgmPlaying = false;
      this.startBgm();
    } else {
      this.notifyBgmChange();
    }
  }

  public subscribeBgm(callback: (isPlaying: boolean, volume: number, customName: string | null) => void) {
    this.bgmListeners.push(callback);
    return () => {
      this.bgmListeners = this.bgmListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyBgmChange() {
    this.bgmListeners.forEach((cb) => cb(this.isBgmPlaying, this.bgmVolume, this.customTrackName));
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

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
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
      const notes = [523.25, 659.25, 783.99, 1046.5];
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
      const notes = [392.0, 466.16, 587.33, 783.99, 932.33, 1174.66]; // G minor / Bb major fanfare
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

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
        { f: 392.0, d: 0.15 },
        { f: 392.0, d: 0.15 },
        { f: 392.0, d: 0.15 },
        { f: 587.33, d: 0.4 },
        { f: 466.16, d: 0.3 },
        { f: 783.99, d: 0.8 },
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

  // --- CINEMATIC ORCHESTRAL FLUTE, HARP & CELESTA ADVENTURE BGM ENGINE ---

  private stopSynthLoop() {
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.ctx && this.bgmGainNode) {
      this.bgmGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public startBgm() {
    if (this.isBgmPlaying) return;

    // If user uploaded a custom MP4/MP3 file, play that directly
    if (this.customAudioEl) {
      this.isBgmPlaying = true;
      this.customAudioEl.volume = this.bgmVolume;
      this.customAudioEl.play().catch(() => {});
      this.notifyBgmChange();
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.06;

    // Master BGM gain & warm canyon echo (delay) for the flute & celesta
    if (!this.bgmGainNode) {
      this.bgmGainNode = ctx.createGain();
      this.delayNode = ctx.createDelay(1.0);
      this.delayFeedback = ctx.createGain();

      this.delayNode.delayTime.setValueAtTime(0.28, ctx.currentTime);
      this.delayFeedback.gain.setValueAtTime(0.26, ctx.currentTime);

      this.bgmGainNode.connect(ctx.destination);
      this.bgmGainNode.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayFeedback.connect(ctx.destination);
    }
    this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, ctx.currentTime);

    this.notifyBgmChange();
    this.scheduleBgmLoop();
  }

  public stopBgm() {
    if (!this.isBgmPlaying) return;
    this.isBgmPlaying = false;
    if (this.customAudioEl) {
      this.customAudioEl.pause();
    }
    this.stopSynthLoop();
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
    if (this.customAudioEl) {
      this.customAudioEl.volume = this.bgmVolume;
    }
    if (this.ctx && this.bgmGainNode && this.isBgmPlaying && !this.customAudioEl) {
      this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
    this.notifyBgmChange();
  }

  private scheduleBgmLoop = () => {
    if (!this.isBgmPlaying || this.customAudioEl) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const tempo = 108; // Matches the 108 BPM cinematic adventure pace of the uploaded track
    const secondsPer16th = 60 / tempo / 4; // ~0.1388s per 16th note

    while (this.nextNoteTime < ctx.currentTime + 0.28) {
      this.playOrchestralStep(this.currentStep, this.nextNoteTime, secondsPer16th);
      this.nextNoteTime += secondsPer16th;
      // 256 sixteenth notes = 16 bars covering the 4 full sections of the uploaded soundtrack:
      // Bars 0-3 (Steps 0-63): Section 1 — Mystical Celesta & Shimmering Pad Intro + Gentle Harp
      // Bars 4-7 (Steps 64-127): Section 2 — Expressive Woodland Flute Lead & Acoustic Harp Arpeggios
      // Bars 8-11 (Steps 128-191): Section 3 — Epic Orchestral Strings, Brass & Cinematic Drums Chorus
      // Bars 12-15 (Steps 192-255): Section 4 — Playful Pizzicato & Harp Interlude -> Resolving to Intro
      this.currentStep = (this.currentStep + 1) % 256;
    }

    this.bgmTimer = window.setTimeout(this.scheduleBgmLoop, 65);
  };

  private playOrchestralStep(step: number, time: number, stepDur: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    const bar = Math.floor(step / 16); // 0 to 15
    const stepInBar = step % 16; // 0 to 15

    // Harmonic progression per 4-bar phrase:
    // Bar % 4 === 0: G Minor (G3, Bb3, D4)
    // Bar % 4 === 1: Eb Major (Eb3, G3, Bb3)
    // Bar % 4 === 2: Bb Major (Bb2, F3, D4)
    // Bar % 4 === 3: F Major -> D7 turnaround (F3, A3, C4 / D3, F#3, A3)
    const chordProgression = [
      { root: 'G2', triad: ['G3', 'Bb3', 'D4', 'G4'], arp: ['G4', 'Bb4', 'D5', 'G5', 'D5', 'Bb4', 'A4', 'G4'] },
      { root: 'Eb3', triad: ['Eb3', 'G3', 'Bb3', 'Eb4'], arp: ['Eb4', 'G4', 'Bb4', 'Eb5', 'D5', 'Bb4', 'G4', 'Eb4'] },
      { root: 'Bb2', triad: ['Bb2', 'F3', 'Bb3', 'D4'], arp: ['F4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'C5', 'D5'] },
      { root: 'F3', triad: ['F3', 'A3', 'C4', 'F4'], arp: ['F4', 'A4', 'C5', 'F5', 'Eb5', 'C5', 'A4', 'F#4'] },
    ];
    const currentHarmony = chordProgression[bar % 4];

    // =========================================================================
    // SECTION 1 (Bars 0–3): MYSTICAL CELESTA, HARP & SHIMMERING PAD (0:00–0:12)
    // =========================================================================
    if (bar < 4) {
      // Warm sustained pad at the start of each bar
      if (stepInBar === 0) {
        currentHarmony.triad.forEach((n) => {
          if (NOTE_FREQ[n]) {
            this.triggerStringsPad(NOTE_FREQ[n], time, stepDur * 15.5, 0.06);
          }
        });
      }

      // Delicate Celesta / Music Box bell arpeggio on eighth notes
      if (stepInBar % 2 === 0) {
        const arpNote = currentHarmony.arp[(stepInBar / 2) % 8];
        if (arpNote && NOTE_FREQ[arpNote]) {
          this.triggerCelesta(NOTE_FREQ[arpNote], time, stepDur * 3.2, 0.14);
        }
      }

      // Gentle flute breath motif entering at Bar 2 & 3
      if (bar === 2 && stepInBar === 0) {
        this.triggerFlute(NOTE_FREQ['D5'], time, stepDur * 8, 0.18);
      } else if (bar === 2 && stepInBar === 8) {
        this.triggerFlute(NOTE_FREQ['G5'], time, stepDur * 7, 0.20);
      } else if (bar === 3 && stepInBar === 0) {
        this.triggerFlute(NOTE_FREQ['F5'], time, stepDur * 6, 0.18);
      } else if (bar === 3 && stepInBar === 6) {
        this.triggerFlute(NOTE_FREQ['Eb5'], time, stepDur * 4, 0.17);
      } else if (bar === 3 && stepInBar === 10) {
        this.triggerFlute(NOTE_FREQ['D5'], time, stepDur * 5.5, 0.19);
      }
      return;
    }

    // =========================================================================
    // SECTION 2 (Bars 4–7): WOODLAND FLUTE LEAD, HARP & LIGHT PERCUSSION (0:12–0:35)
    // =========================================================================
    if (bar >= 4 && bar < 8) {
      // Warm bass pluck on beats 1 and 3
      if (stepInBar === 0 || stepInBar === 8) {
        const rootFreq = NOTE_FREQ[currentHarmony.root];
        if (rootFreq) {
          this.triggerHarpPluck(rootFreq, time, stepDur * 6, 0.22);
        }
      }

      // Flowing Harp 16th/8th arpeggios
      if (stepInBar % 2 === 0) {
        const arpNote = currentHarmony.arp[(stepInBar / 2) % 8];
        if (arpNote && NOTE_FREQ[arpNote]) {
          this.triggerHarpPluck(NOTE_FREQ[arpNote] * 0.5, time, stepDur * 2.5, 0.12);
        }
      }

      // Soft strings backing pad
      if (stepInBar === 0) {
        currentHarmony.triad.slice(0, 3).forEach((n) => {
          if (NOTE_FREQ[n]) {
            this.triggerStringsPad(NOTE_FREQ[n], time, stepDur * 15, 0.05);
          }
        });
      }

      // Expressive Flute Melody (4-bar lyrical theme in G minor / Bb major)
      const fluteBar = bar - 4;
      const fluteMelody: Record<number, Array<{ step: number; note: string; len: number }>> = {
        0: [
          { step: 0, note: 'G5', len: 4 },
          { step: 4, note: 'F5', len: 2 },
          { step: 6, note: 'Eb5', len: 2 },
          { step: 8, note: 'D5', len: 4 },
          { step: 12, note: 'Bb4', len: 4 },
        ],
        1: [
          { step: 0, note: 'Eb5', len: 4 },
          { step: 4, note: 'F5', len: 2 },
          { step: 6, note: 'G5', len: 4 },
          { step: 10, note: 'Bb5', len: 3 },
          { step: 13, note: 'A5', len: 3 },
        ],
        2: [
          { step: 0, note: 'F5', len: 6 },
          { step: 6, note: 'D5', len: 2 },
          { step: 8, note: 'Eb5', len: 4 },
          { step: 12, note: 'C5', len: 4 },
        ],
        3: [
          { step: 0, note: 'D5', len: 4 },
          { step: 4, note: 'Eb5', len: 2 },
          { step: 6, note: 'F5', len: 2 },
          { step: 8, note: 'G5', len: 6 },
          { step: 14, note: 'A5', len: 2 },
        ],
      };

      const notesThisBar = fluteMelody[fluteBar] || [];
      for (const item of notesThisBar) {
        if (item.step === stepInBar && NOTE_FREQ[item.note]) {
          this.triggerFlute(NOTE_FREQ[item.note], time, stepDur * item.len, 0.25);
        }
      }

      // Gentle hand drum & shaker groove
      if (stepInBar === 0 || stepInBar === 10) {
        this.triggerOrchestralDrum(time, 110, 0.09, 0.14);
      } else if (stepInBar === 4 || stepInBar === 12) {
        this.triggerShaker(time, 0.04, 0.05);
      }
      return;
    }

    // =========================================================================
    // SECTION 3 (Bars 8–11): EPIC ORCHESTRAL ADVENTURE CHORUS (0:36–0:59 & 1:47–2:10)
    // =========================================================================
    if (bar >= 8 && bar < 12) {
      // Grand Orchestral Strings & French Horn Chords on each bar + half bar
      if (stepInBar === 0 || stepInBar === 8) {
        const rootFreq = NOTE_FREQ[currentHarmony.root];
        if (rootFreq) {
          this.triggerStringsPad(rootFreq, time, stepDur * 7.8, 0.18);
        }
        currentHarmony.triad.forEach((n) => {
          if (NOTE_FREQ[n]) {
            this.triggerStringsPad(NOTE_FREQ[n], time, stepDur * 7.8, 0.09);
          }
        });
      }

      // Driving Staccato Strings / Ostinato on 16th notes
      const ostinatoNote = currentHarmony.arp[stepInBar % 8];
      if (ostinatoNote && NOTE_FREQ[ostinatoNote]) {
        this.triggerHarpPluck(NOTE_FREQ[ostinatoNote] * 0.5, time, stepDur * 1.2, 0.09);
      }

      // Soaring Heroic Orchestra + Flute Lead Melody (Octave doubled)
      const chorusBar = bar - 8;
      const heroicMelody: Record<number, Array<{ step: number; note: string; len: number }>> = {
        0: [
          { step: 0, note: 'Bb5', len: 6 },
          { step: 6, note: 'A5', len: 2 },
          { step: 8, note: 'G5', len: 4 },
          { step: 12, note: 'D5', len: 4 },
        ],
        1: [
          { step: 0, note: 'Eb5', len: 4 },
          { step: 4, note: 'G5', len: 4 },
          { step: 8, note: 'Bb5', len: 4 },
          { step: 12, note: 'C6', len: 4 },
        ],
        2: [
          { step: 0, note: 'D6', len: 6 },
          { step: 6, note: 'C6', len: 2 },
          { step: 8, note: 'Bb5', len: 4 },
          { step: 12, note: 'F5', len: 4 },
        ],
        3: [
          { step: 0, note: 'A5', len: 4 },
          { step: 4, note: 'Bb5', len: 2 },
          { step: 6, note: 'C6', len: 2 },
          { step: 8, note: 'G5', len: 8 },
        ],
      };

      const chorusNotes = heroicMelody[chorusBar] || [];
      for (const item of chorusNotes) {
        if (item.step === stepInBar && NOTE_FREQ[item.note]) {
          const f = NOTE_FREQ[item.note];
          this.triggerFlute(f, time, stepDur * item.len, 0.24);
          this.triggerStringsPad(f * 0.5, time, stepDur * item.len, 0.14);
        }
      }

      // Epic Cinematic Taiko / Timpani Drums
      if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 14) {
        this.triggerOrchestralDrum(time, 85, 0.14, 0.26);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.triggerOrchestralDrum(time, 220, 0.08, 0.16);
        this.triggerShaker(time, 0.07, 0.08);
      }
      return;
    }

    // =========================================================================
    // SECTION 4 (Bars 12–15): PLAYFUL PIZZICATO & HARP INTERLUDE (1:00–1:22)
    // =========================================================================
    if (bar >= 12) {
      // Walking Pizzicato Bass on quarter notes (steps 0, 4, 8, 12)
      if (stepInBar % 4 === 0) {
        const pizzNotes = currentHarmony.triad;
        const n = pizzNotes[(stepInBar / 4) % pizzNotes.length];
        if (n && NOTE_FREQ[n]) {
          this.triggerHarpPluck(NOTE_FREQ[n] * 0.5, time, stepDur * 1.8, 0.20);
        }
      }

      // Playful Plucked Harp & Celesta Interlude Counterpoint
      const pizzPattern: Array<number> = [0, 3, 6, 8, 11, 14];
      if (pizzPattern.includes(stepInBar)) {
        const noteName = currentHarmony.arp[stepInBar % 8];
        if (noteName && NOTE_FREQ[noteName]) {
          this.triggerHarpPluck(NOTE_FREQ[noteName], time, stepDur * 2.2, 0.16);
          if (stepInBar === 0 || stepInBar === 8) {
            this.triggerCelesta(NOTE_FREQ[noteName], time, stepDur * 2.5, 0.11);
          }
        }
      }
    }
  }

  // --- ORCHESTRAL INSTRUMENT SYNTHESIS VOICES ---

  // 1. Expressive Woodwind Flute with gentle Vibrato & Warm Breath Envelope
  private triggerFlute(freq: number, startTime: number, duration: number, volume: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      harmonic.type = 'triangle';

      osc.frequency.setValueAtTime(freq, startTime);
      harmonic.frequency.setValueAtTime(freq * 2, startTime);

      // 5.5 Hz flute vibrato
      vibrato.frequency.setValueAtTime(5.5, startTime);
      vibratoGain.gain.setValueAtTime(freq * 0.008, startTime);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, startTime);

      // Smooth woodwind breath attack & release
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.08, duration * 0.25));
      gain.gain.setValueAtTime(volume * 0.9, startTime + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.18, startTime);

      osc.connect(filter);
      harmonic.connect(harmGain);
      harmGain.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      harmonic.start(startTime);
      vibrato.start(startTime);

      const stopAt = startTime + duration + 0.03;
      osc.stop(stopAt);
      harmonic.stop(stopAt);
      vibrato.stop(stopAt);
    } catch {
      // ignore
    }
  }

  // 2. Celesta / Glockenspiel Shimmering Bell
  private triggerCelesta(freq: number, startTime: number, duration: number, volume: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 3, startTime); // bell chime overtone

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.08, startTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.3);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(this.bgmGainNode);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.02);
      osc2.stop(startTime + duration + 0.02);
    } catch {
      // ignore
    }
  }

  // 3. Acoustic Harp / Pizzicato String Pluck
  private triggerHarpPluck(freq: number, startTime: number, duration: number, volume: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, startTime);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + duration);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // ignore
    }
  }

  // 4. Warm Orchestral Strings Ensemble Pad
  private triggerStringsPad(freq: number, startTime: number, duration: number, volume: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq * 0.997, startTime);
      osc2.frequency.setValueAtTime(freq * 1.003, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.25, duration * 0.3));
      gain.gain.setValueAtTime(volume * 0.85, startTime + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.04);
      osc2.stop(startTime + duration + 0.04);
    } catch {
      // ignore
    }
  }

  // 5. Orchestral Timpani / Taiko Drum
  private triggerOrchestralDrum(
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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.35, startTime + duration);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // ignore
    }
  }

  // 6. Soft Orchestral Shaker / Cymbal Brush
  private triggerShaker(startTime: number, duration: number, volume: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, startTime);
      osc.frequency.linearRampToValueAtTime(3200, startTime + duration);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundController();
