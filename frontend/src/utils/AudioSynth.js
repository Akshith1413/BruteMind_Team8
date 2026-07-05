/**
 * AudioSynth.js — Cortex OS Procedural Sound Engine
 * Web Audio API synthesizer for sci-fi UI sounds + persistent ambient hum.
 * Hum auto-starts after login; master mute toggle silences everything.
 */
class AudioSynthManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientNodes = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ctx = new AC();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this._fadeAmbient(0, 0.3);
    } else {
      this._fadeAmbient(1, 0.5);
      this.playClick();
    }
    return this.muted;
  }

  isMuted() { return this.muted; }

  /* ── internal gain helper ─────────────────────────────── */
  _osc(decay, vol = 0.1) {
    this.init();
    if (!this.ctx || this.muted) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.ctx.destination);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + decay);
    return { osc: o, gain: g };
  }

  /* ── Ambient Hum (auto-starts post-login) ─────────────── */
  startAmbientHum() {
    this.init();
    if (!this.ctx || this.ambientNodes) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0, this.ctx.currentTime);
    master.gain.linearRampToValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime + 0.5);
    master.connect(this.ctx.destination);

    const makeLayer = (freq, type, vol, detune = 0) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      f.type = 'lowpass';
      f.frequency.value = 180;
      f.Q.value = 0.7;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 3);
      o.connect(f);
      f.connect(g);
      g.connect(master);
      o.start();
      return { osc: o, gain: g, filter: f };
    };

    // Three-layer drone: fundamental + fifth + sub-octave
    const layers = [
      makeLayer(55, 'sine', 0.025),          // A1 fundamental
      makeLayer(82.41, 'sine', 0.012, 3),     // E2 perfect fifth, slight detune
      makeLayer(27.5, 'triangle', 0.018),     // A0 sub-octave warmth
    ];

    // Slow LFO modulating the filter cutoff for breathing feel
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // very slow breath cycle
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    layers.forEach((l) => lfoGain.connect(l.filter.frequency));
    lfo.start();

    this.ambientNodes = { master, layers, lfo, lfoGain };
  }

  stopAmbientHum() {
    if (!this.ambientNodes || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.ambientNodes.master.gain.linearRampToValueAtTime(0, t + 1.5);
    setTimeout(() => {
      try {
        this.ambientNodes.layers.forEach((l) => l.osc.stop());
        this.ambientNodes.lfo.stop();
      } catch (_) { /* already stopped */ }
      this.ambientNodes = null;
    }, 2000);
  }

  _fadeAmbient(target, dur) {
    if (!this.ambientNodes || !this.ctx) return;
    const g = this.ambientNodes.master.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(target, this.ctx.currentTime + dur);
  }

  /* ── UI micro-sounds ──────────────────────────────────── */
  playHover() {
    const s = this._osc(0.08, 0.04);
    if (!s) return;
    s.osc.type = 'sine';
    s.osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1000;
    s.osc.disconnect(); s.osc.connect(f); f.connect(s.gain);
    s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.09);
  }

  playClick() {
    const s = this._osc(0.12, 0.12);
    if (!s) return;
    s.osc.type = 'triangle';
    s.osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    s.osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
    s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.13);
  }

  playTransition() {
    const s = this._osc(0.35, 0.07);
    if (!s) return;
    s.osc.type = 'sine';
    s.osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    s.osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.3);
    s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.36);
  }

  playThemeSwitch() {
    const s = this._osc(0.6, 0.1);
    if (!s) return;
    s.osc.type = 'sine';
    s.osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    s.osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.5);
    const f = this.ctx.createBiquadFilter();
    f.type = 'peaking'; f.Q.value = 10;
    f.frequency.setValueAtTime(500, this.ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.5);
    s.osc.disconnect(); s.osc.connect(f); f.connect(s.gain);
    s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.6);
  }

  playAlert() {
    const s1 = this._osc(0.2, 0.1);
    if (!s1) return;
    s1.osc.type = 'sawtooth';
    s1.osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    s1.osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 0.18);
    s1.osc.start(); s1.osc.stop(this.ctx.currentTime + 0.2);
    setTimeout(() => {
      const s2 = this._osc(0.2, 0.1);
      if (!s2) return;
      s2.osc.type = 'sawtooth';
      s2.osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      s2.osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.18);
      s2.osc.start(); s2.osc.stop(this.ctx.currentTime + 0.2);
    }, 120);
  }

  playSuccess() {
    const note = (freq, t, dur, vol = 0.06) => {
      const s = this._osc(dur, vol);
      if (!s) return;
      s.osc.type = 'sine';
      s.osc.frequency.setValueAtTime(freq, this.ctx.currentTime + t);
      const d = this.ctx.createDelay(); d.delayTime.value = 0.15;
      const fb = this.ctx.createGain(); fb.gain.value = 0.35;
      s.gain.connect(d); d.connect(fb); fb.connect(this.ctx.destination);
      s.osc.start(this.ctx.currentTime + t);
      s.osc.stop(this.ctx.currentTime + t + dur);
    };
    note(523.25, 0, 0.5);
    note(659.25, 0.1, 0.5);
    note(783.99, 0.2, 0.6);
    note(1046.50, 0.32, 0.8, 0.04);
  }

  playNavigate() {
    const s = this._osc(0.15, 0.06);
    if (!s) return;
    s.osc.type = 'sine';
    s.osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    s.osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.07);
    s.osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.14);
    s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.16);
  }

  playCrisis() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const s = this._osc(0.3, 0.08);
        if (!s) return;
        s.osc.type = 'square';
        s.osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        s.osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.25);
        s.osc.start(); s.osc.stop(this.ctx.currentTime + 0.3);
      }, i * 200);
    }
  }
}

export const AudioSynth = new AudioSynthManager();
