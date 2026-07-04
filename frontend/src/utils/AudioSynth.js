// Web Audio API Synthesizer for HealOS (Procedural Sci-Fi Sounds)
class AudioSynthManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.playClick();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  createGains(decay, startVolume = 0.1) {
    this.init();
    if (!this.ctx || this.muted) return null;
    
    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(startVolume, this.ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + decay);

    return { osc, gain };
  }

  playHover() {
    const sound = this.createGains(0.08, 0.05);
    if (!sound) return;
    const { osc } = sound;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    
    // Very quick decay filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    
    osc.disconnect();
    osc.connect(filter);
    filter.connect(sound.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playClick() {
    const sound = this.createGains(0.12, 0.15);
    if (!sound) return;
    const { osc } = sound;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playTransition() {
    const sound = this.createGains(0.35, 0.08);
    if (!sound) return;
    const { osc } = sound;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playThemeSwitch() {
    const sound = this.createGains(0.6, 0.12);
    if (!sound) return;
    const { osc } = sound;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.5);

    // Apply lowpass resonant filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.Q.setValueAtTime(10, this.ctx.currentTime);
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.5);

    osc.disconnect();
    osc.connect(filter);
    filter.connect(sound.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playAlert() {
    const sound1 = this.createGains(0.2, 0.12);
    if (!sound1) return;
    sound1.osc.type = 'sawtooth';
    sound1.osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    sound1.osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 0.18);
    sound1.osc.start();
    sound1.osc.stop(this.ctx.currentTime + 0.2);

    setTimeout(() => {
      const sound2 = this.createGains(0.2, 0.12);
      if (!sound2) return;
      sound2.osc.type = 'sawtooth';
      sound2.osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      sound2.osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.18);
      sound2.osc.start();
      sound2.osc.stop(this.ctx.currentTime + 0.2);
    }, 120);
  }

  playSuccess() {
    const playNote = (freq, timeOffset, duration, vol = 0.08) => {
      const sound = this.createGains(duration, vol);
      if (!sound) return;
      
      sound.osc.type = 'sine';
      sound.osc.frequency.setValueAtTime(freq, this.ctx.currentTime + timeOffset);
      
      // Delay effect integration
      const delay = this.ctx.createDelay();
      delay.delayTime.setValueAtTime(0.15, this.ctx.currentTime);
      
      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.4, this.ctx.currentTime);

      sound.gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(this.ctx.destination);

      sound.osc.start(this.ctx.currentTime + timeOffset);
      sound.osc.stop(this.ctx.currentTime + timeOffset + duration);
    };

    // Major Triad Arpeggio (C5 - E5 - G5 - C6)
    playNote(523.25, 0.00, 0.5);      // C5
    playNote(659.25, 0.10, 0.5);      // E5
    playNote(783.99, 0.20, 0.6);      // G5
    playNote(1046.50, 0.32, 0.8, 0.06); // C6
  }
}

export const AudioSynth = new AudioSynthManager();
