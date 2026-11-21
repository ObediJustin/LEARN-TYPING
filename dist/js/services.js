const STORAGE_KEY = 'learn_typing_save_v1';

const DEFAULTS = {
  version: 1,
  settings: { language: 'fr', difficulty: 'normal', mode: 'classic', sound: true, ambience: true, volume: .55, reducedMotion: false, accentTolerance: true },
  scores: {},
  lifetime: { runs: 0, words: 0, destroyed: 0, correct: 0, incorrect: 0, seconds: 0 },
  achievements: []
};

export class StorageService {
  constructor() { this.available = true; this.data = this.load(); }
  cloneDefaults() { return JSON.parse(JSON.stringify(DEFAULTS)); }
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.cloneDefaults();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || typeof parsed.settings !== 'object') return this.cloneDefaults();
      return {
        ...this.cloneDefaults(), ...parsed,
        settings: { ...DEFAULTS.settings, ...parsed.settings },
        lifetime: { ...DEFAULTS.lifetime, ...parsed.lifetime },
        scores: parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {},
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter(x => typeof x === 'string') : []
      };
    } catch { this.available = false; return this.cloneDefaults(); }
  }
  save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); return true; } catch { this.available = false; return false; } }
  setSettings(patch) { this.data.settings = { ...this.data.settings, ...patch }; this.save(); }
  addScore(mode, difficulty, result) {
    const key = `${mode}:${difficulty}`;
    const list = Array.isArray(this.data.scores[key]) ? this.data.scores[key] : [];
    const entry = { score: result.score, wave: result.wave, wpm: result.wpm, accuracy: result.accuracy, date: new Date().toISOString() };
    list.push(entry);
    list.sort((a,b) => b.score - a.score);
    this.data.scores[key] = list.slice(0,5);
    const rank = this.data.scores[key].indexOf(entry);
    this.save();
    return rank === 0;
  }
  addLifetime(stats) {
    const l = this.data.lifetime;
    l.runs++; l.words += stats.words; l.destroyed += stats.destroyed; l.correct += stats.correct; l.incorrect += stats.incorrect; l.seconds += Math.floor(stats.elapsed);
    this.save();
  }
  unlock(id) { if (this.data.achievements.includes(id)) return false; this.data.achievements.push(id); this.save(); return true; }
  reset() { this.data = this.cloneDefaults(); this.save(); }
}

export class AudioService {
  constructor(settings) { this.ctx = null; this.master = null; this.ambience = null; this.settings = settings; }
  async init() {
    if (!this.settings.sound) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = this.settings.volume; this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (this.settings.ambience) this.startAmbience();
    } catch { /* Audio is optional. */ }
  }
  update(settings) { this.settings = settings; if (this.master) this.master.gain.value = settings.sound ? settings.volume : 0; if (!settings.ambience) this.stopAmbience(); }
  tone(freq=440, duration=.06, type='sine', gain=.1, slide=0) {
    if (!this.ctx || !this.settings.sound || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), amp = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide), now+duration);
    amp.gain.setValueAtTime(.0001, now); amp.gain.exponentialRampToValueAtTime(gain, now+.008); amp.gain.exponentialRampToValueAtTime(.0001, now+duration);
    osc.connect(amp); amp.connect(this.master); osc.start(now); osc.stop(now+duration+.02);
  }
  play(name) {
    const map = {
      type:()=>{ this.tone(640,.045,'square',.035,240); },
      error:()=>{ this.tone(125,.12,'sawtooth',.07,-35); },
      explode:()=>{ this.tone(110,.24,'sawtooth',.09,-65); this.tone(65,.3,'square',.04,-20); },
      wave:()=>{ [330,440,660].forEach((f,i)=>setTimeout(()=>this.tone(f,.16,'triangle',.07,80),i*90)); },
      boss:()=>{ [95,82,70].forEach((f,i)=>setTimeout(()=>this.tone(f,.3,'sawtooth',.09,-15),i*170)); },
      power:()=>{ [440,660,880].forEach((f,i)=>setTimeout(()=>this.tone(f,.12,'sine',.055,120),i*55)); },
      over:()=>{ [260,190,120].forEach((f,i)=>setTimeout(()=>this.tone(f,.3,'triangle',.07,-60),i*160)); }
    }; map[name]?.();
  }
  startAmbience() {
    if (!this.ctx || this.ambience || !this.settings.sound || !this.settings.ambience) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), filter = this.ctx.createBiquadFilter();
    osc.type = 'sine'; osc.frequency.value = 48; filter.type='lowpass'; filter.frequency.value=180; gain.gain.value=.018;
    osc.connect(filter); filter.connect(gain); gain.connect(this.master); osc.start(); this.ambience = {osc,gain};
  }
  stopAmbience() { if (!this.ambience) return; try { this.ambience.osc.stop(); } catch {} this.ambience = null; }
}
