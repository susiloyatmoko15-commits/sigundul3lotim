// Built-in Adventure BGM & Sound Effects Controller
import defaultBgmUrl from '../assets/audio/bgm_petualangan.mp3';

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Background Music (BGM) state — Active by default!
  public isBgmPlaying: boolean = true;
  public bgmVolume: number = 0.5;
  private bgmAudio: HTMLAudioElement | null = null;

  // Listeners for UI state updates
  private bgmListeners: Array<(isPlaying: boolean, volume: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBuiltInAudio();
    }
  }

  private initBuiltInAudio() {
    const audio = new Audio(defaultBgmUrl);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = this.bgmVolume;
    this.bgmAudio = audio;

    // Try immediate autoplay; if browser blocks until first tap, unlock on first pointer/touch/keydown anywhere
    audio.play().catch(() => {
      const unlockAudio = () => {
        if (this.isBgmPlaying && this.bgmAudio && this.bgmAudio.paused) {
          this.bgmAudio.play().catch(() => {});
          this.notifyBgmChange();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    });
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
      const notes = [392.0, 466.16, 587.33, 783.99, 932.33, 1174.66];
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

  // --- BUILT-IN MP3 ADVENTURE BGM CONTROLS ---

  public startBgm() {
    this.isBgmPlaying = true;
    if (!this.bgmAudio && typeof window !== 'undefined') {
      this.initBuiltInAudio();
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
      this.bgmAudio.play().catch(() => {});
    }
    this.notifyBgmChange();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
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
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
    this.notifyBgmChange();
  }
}

export const sounds = new SoundController();
