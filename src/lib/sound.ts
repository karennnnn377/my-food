/** Tiny WebAudio synth — no asset files needed. */

type SfxName = "click" | "correct" | "wrong" | "combo" | "level" | "over" | "achieve" | "tick" | "start" | "flip" | "heart";

class SoundKit {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  enabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch { return null; }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    switch (name) {
      case "click": this.tone(660, 0.06, "triangle", 0.08); break;
      case "flip": this.tone(440, 0.08, "triangle", 0.07, 0, 620); break;
      case "tick": this.tone(880, 0.04, "square", 0.04); break;
      case "correct": this.tone(523, 0.1, "triangle", 0.12); this.tone(784, 0.14, "triangle", 0.12, 0.09); break;
      case "wrong": this.tone(196, 0.22, "sawtooth", 0.1); this.tone(147, 0.26, "sawtooth", 0.09, 0.08); break;
      case "heart": this.tone(220, 0.3, "sine", 0.12, 0, 90); break;
      case "combo": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.09, "triangle", 0.1, i * 0.06)); break;
      case "level": [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, "triangle", 0.11, i * 0.08)); break;
      case "achieve": [659, 784, 988, 1318].forEach((f, i) => this.tone(f, 0.16, "sine", 0.1, i * 0.1)); break;
      case "start": [392, 494, 587].forEach((f, i) => this.tone(f, 0.12, "triangle", 0.1, i * 0.07)); break;
      case "over": [494, 392, 311, 233].forEach((f, i) => this.tone(f, 0.2, "sawtooth", 0.08, i * 0.13)); break;
    }
  }

  setMusic(on: boolean) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (on && this.musicNodes.length === 0) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.musicGain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 2);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.13;
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain).connect(this.musicGain.gain);
      lfo.start();
      [110, 164.8, 220, 277.2].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? "triangle" : "sine";
        o.frequency.value = f;
        o.detune.value = i * 4 - 6;
        o.connect(this.musicGain!);
        o.start();
        this.musicNodes.push(o);
      });
      this.musicNodes.push(lfo);
      this.musicGain.connect(ctx.destination);
    } else if (!on && this.musicNodes.length > 0) {
      if (this.musicGain) this.musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      const nodes = this.musicNodes;
      this.musicNodes = [];
      setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }), 800);
    }
  }
}

export const sfx = new SoundKit();
