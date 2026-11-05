// Original background loop and sound effects, synthesised so no audio files are needed. Projector only.
const MMAudio = (() => {
  let ctx = null, master = null, musicBus = null, timer = null, step = 0, nextAt = 0, wantMusic = true, sfxOn = true, ducked = false;
  try { wantMusic = localStorage.getItem('mm_music') !== '0'; } catch {}
  const BPM = 132, S = 60 / BPM / 2;
  const n = m => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const LEAD = [76, 0, 79, 76, 72, 0, 74, 76, 74, 0, 71, 74, 79, 0, 74, 71, 72, 0, 76, 72, 69, 0, 72, 76, 72, 0, 69, 72, 77, 76, 74, 72];
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = .32; musicBus.connect(master);
    return true;
  }
  function tone(f, t, d, type, g, out) {
    const o = ctx.createOscillator(), a = ctx.createGain(); o.type = type; o.frequency.value = f;
    a.gain.setValueAtTime(.0001, t); a.gain.linearRampToValueAtTime(g, t + .012); a.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(a).connect(out || master); o.start(t); o.stop(t + d + .02);
  }
  function noise(t, d, g, f, type, out, sweepTo) {
    const len = Math.ceil(ctx.sampleRate * d), buf = ctx.createBuffer(1, len, ctx.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), a = ctx.createGain(); s.buffer = buf; fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + d);
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl).connect(a).connect(out || master); s.start(t);
  }
  function schedule() {
    if (!ctx) return;
    while (nextAt < ctx.currentTime + .25) {
      const bar = Math.floor(step / 8) % 4, pos = step % 8, ch = CHORDS[bar], t = nextAt;
      if (pos % 2 === 0) tone(n(ch[0] - 24), t, S * 1.7, 'triangle', .55, musicBus);
      tone(n(ch[[0, 1, 2, 1][pos % 4]] + 12), t, S * 1.2, 'square', .09, musicBus);
      const lead = LEAD[step % 32]; if (lead) tone(n(lead), t, S * 1.5, 'triangle', .2, musicBus);
      if (pos % 4 === 0) { const o = ctx.createOscillator(), a = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); a.gain.setValueAtTime(.7, t); a.gain.exponentialRampToValueAtTime(.0001, t + .14); o.connect(a).connect(musicBus); o.start(t); o.stop(t + .15); }
      if (pos % 4 === 2) noise(t, .1, .22, 1800, 'highpass', musicBus);
      noise(t, .03, .08, 7000, 'highpass', musicBus);
      step++; nextAt += S;
    }
  }
  function play() { if (!ensure() || timer) return; nextAt = ctx.currentTime + .08; timer = setInterval(schedule, 60); schedule(); }
  function stop() { clearInterval(timer); timer = null; }
  const sync = () => { if (wantMusic && !ducked) play(); else stop(); };
  return {
    unlock() { if (ensure()) sync(); },
    music(on) { wantMusic = on; try { localStorage.setItem('mm_music', on ? '1' : '0'); } catch {} if (on) ensure(); sync(); },
    get musicOn() { return wantMusic; },
    sfx(on) { sfxOn = on; }, get sfxOn() { return sfxOn; },
    duck(on) { ducked = on; if (ctx) sync(); },
    transition() { if (!sfxOn || !ensure()) return; const t = ctx.currentTime; noise(t, .28, .3, 500, 'bandpass', master, 4500); [72, 79, 84].forEach((m, i) => tone(n(m), t + .12 + i * .06, .22, 'triangle', .22)); },
    tick() { if (sfxOn && ensure()) tone(660, ctx.currentTime, .09, 'square', .12); },
    open() { if (sfxOn && ensure()) { const t = ctx.currentTime; tone(n(69), t, .12, 'triangle', .28); tone(n(76), t + .09, .2, 'triangle', .28); } },
    fanfare() { if (sfxOn && ensure()) [60, 64, 67, 72, 76].forEach((m, i) => tone(n(m), ctx.currentTime + i * .1, .3, 'triangle', .28)); },
  };
})();
