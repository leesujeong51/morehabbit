// Web Audio API ambient sound generator and completion chime synthesizer
export type AmbientSoundType = 'rain' | 'cafe' | 'lofi' | 'mute';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'mute';
  private gainNode: GainNode | null = null;
  private activeSourceNode: AudioNode | null = null;
  private lofiInterval: number | null = null;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a gentle, soothing crystal chime when focus session finishes
  playChime() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Gentle major chord arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
      const frequencies = [523.25, 659.25, 783.99, 1046.5];

      frequencies.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.18);

        // Gentle envelope
        gain.gain.setValueAtTime(0, now + index * 0.18);
        gain.gain.linearRampToValueAtTime(0.22, now + index * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + index * 0.18);
        osc.stop(now + index * 0.18 + 1.7);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Trigger system vibration if supported
  triggerVibration() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (e) {
        console.warn('Vibration failed', e);
      }
    }
  }

  // Stop current ambient background sound
  stopAmbient() {
    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }

    if (this.activeSourceNode) {
      try {
        if ('stop' in this.activeSourceNode) {
          (this.activeSourceNode as any).stop();
        }
        this.activeSourceNode.disconnect();
      } catch {}
      this.activeSourceNode = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }

    this.currentType = 'mute';
  }

  // Play continuous ambient sound (Rain, Cafe, Lo-Fi)
  playAmbient(type: AmbientSoundType) {
    this.stopAmbient();
    if (type === 'mute') return;

    this.initCtx();
    if (!this.ctx) return;

    this.currentType = type;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === 'rain') {
      this.playRainNoise();
    } else if (type === 'cafe') {
      this.playCafeNoise();
    } else if (type === 'lofi') {
      this.playLofiChords();
    }
  }

  private playRainNoise() {
    if (!this.ctx || !this.gainNode) return;

    // Generate 5 seconds of pink/filtered noise and loop it
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Soft lowpass filter to mimic rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.gainNode);
    noiseSource.start();
    this.activeSourceNode = noiseSource;
  }

  private playCafeNoise() {
    if (!this.ctx || !this.gainNode) return;

    // Ambient warm cafe chatter noise
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Bandpass filter to isolate human voice / cafe room acoustics
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.gainNode);
    noiseSource.start();
    this.activeSourceNode = noiseSource;
  }

  private playLofiChords() {
    if (!this.ctx) return;

    // Lo-Fi chill progression chords (Fmaj7, Em7, Dm7, Cmaj7)
    const chords = [
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || this.currentType !== 'lofi') return;
      const now = this.ctx.currentTime;
      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Warm triangle wave for lofi feel
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.3);
      });
    };

    playChord();
    this.lofiInterval = window.setInterval(playChord, 3500);
  }
}

export const soundEngine = new SoundEngine();
