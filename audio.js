// Original background loop and sound effects, synthesised so no audio files are needed. Projector only.
const MMAudio = (() => {
  let ctx = null, master = null, musicBus = null, timer = null, step = 0, nextAt = 0, wantMusic = true, sfxOn = true, ducked = false, scene = 'none';
  let forestBus = null, windSrc = null, forestT = [], echo = null;
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
    forestBus = ctx.createGain(); forestBus.gain.value = 0; forestBus.connect(master);
    const d = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(); d.delayTime.value = .27; fb.gain.value = .34; wet.gain.value = .3;
    d.connect(fb).connect(d); d.connect(wet).connect(forestBus); echo = d;
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
  // ---------- forest ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  function voice(t, d, pts, type, g, pan) {
    const o = ctx.createOscillator(), a = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = type; o.frequency.setValueAtTime(pts[0][1], t);
    pts.slice(1).forEach(([k, f]) => o.frequency.exponentialRampToValueAtTime(f, t + k * d));
    a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + Math.min(.03, d / 4)); a.gain.setValueAtTime(g, t + d * .6); a.gain.exponentialRampToValueAtTime(.0001, t + d);
    let out = a; if (p) { p.pan.value = pan; a.connect(p); out = p; }
    o.connect(a); out.connect(forestBus); out.connect(echo); o.start(t); o.stop(t + d + .03);
  }
  const CALLS = {
    bird(t, p) { const b = rnd(2600, 3600), n = 3 + Math.floor(rnd(0, 4)); for (let i = 0; i < n; i++) voice(t + i * .13, .1, [[0, b * 1.25], [.5, b * .85], [1, b * 1.15]], 'sine', .1, p); },
    trill(t, p) { const b = rnd(3400, 4200); for (let i = 0; i < 12; i++) voice(t + i * .055, .045, [[0, b], [1, b * 1.12]], 'sine', .055, p); },
    owl(t, p) { voice(t, .34, [[0, 390], [.5, 430], [1, 360]], 'sine', .17, p); voice(t + .5, .28, [[0, 380], [1, 340]], 'sine', .13, p); voice(t + .86, .62, [[0, 410], [.5, 430], [1, 310]], 'sine', .17, p); },
    monkey(t, p) { for (let i = 0; i < 5; i++) { const b = 480 + i * 130; voice(t + i * .24, .2, [[0, b], [.5, b * 1.7], [1, b * 1.05]], 'sawtooth', .035, p); voice(t + i * .24, .2, [[0, b * 2], [.5, b * 3.1], [1, b * 2]], 'sine', .05, p); } },
    frog(t, p) { for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) voice(t + k * .55 + i * .032, .028, [[0, 280], [1, 190]], 'square', .045, p); },
    eagle(t, p) { voice(t, .95, [[0, 2300], [.2, 3200], [.8, 2500], [1, 1700]], 'sawtooth', .024, p); voice(t, .95, [[0, 4600], [.2, 6100], [1, 3500]], 'sine', .03, p); },
    elephant(t, p) { voice(t, 1.15, [[0, 420], [.25, 880], [.8, 760], [1, 460]], 'sawtooth', .035, p); voice(t, 1.15, [[0, 840], [.25, 1720], [1, 900]], 'square', .012, p); },
  };
  const NAMES = ['bird', 'bird', 'bird', 'trill', 'trill', 'owl', 'frog', 'monkey', 'eagle', 'elephant'];
  function call() { if (scene !== 'forest' || !ctx) return; CALLS[NAMES[Math.floor(Math.random() * NAMES.length)]](ctx.currentTime + .02, rnd(-.8, .8)); forestT[0] = setTimeout(call, rnd(1400, 4200)); }
  function crickets() {
    if (scene !== 'forest' || !ctx) return;
    const t = ctx.currentTime + .02, f = rnd(4300, 5200), p = rnd(-.6, .6);
    for (let i = 0; i < 8; i++) voice(t + i * .075, .05, [[0, f], [1, f * 1.01]], 'sine', .018, p);
    forestT[1] = setTimeout(crickets, rnd(900, 2100));
  }
  function startForest() {
    if (windSrc) return;
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const x = buf.getChannelData(c); let v = 0; for (let i = 0; i < len; i++) { v = v * .985 + (Math.random() * 2 - 1) * .015; x[i] = v * 6; } }
    windSrc = ctx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
    const fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    fl.type = 'lowpass'; fl.frequency.value = 900; g.gain.value = .22; lfo.frequency.value = .09; lg.gain.value = .1;
    lfo.connect(lg).connect(g.gain); windSrc.connect(fl).connect(g).connect(forestBus); windSrc.start(); lfo.start(); windSrc._lfo = lfo;
    forestBus.gain.setTargetAtTime(.9, ctx.currentTime, .6);
    setTimeout(call, 400); setTimeout(crickets, 900);
  }
  function stopForest() {
    forestT.forEach(clearTimeout); forestT = [];
    if (windSrc) { const w = windSrc; windSrc = null; forestBus.gain.setTargetAtTime(0, ctx.currentTime, .3); setTimeout(() => { try { w.stop(); w._lfo.stop(); } catch {} }, 1200); }
  }
  const sync = () => {
    if (!ctx) return;
    const on = wantMusic && !ducked;
    if (on && scene === 'music') play(); else stop();
    if (on && scene === 'forest') startForest(); else stopForest();
  };
  return {
    unlock() { if (ensure()) sync(); },
    scene(s) { if (s === scene) return; scene = s; sync(); },
    animal(a) {
      if (!ensure()) return;
      const t = ctx.currentTime + .02, g = ctx.createGain(); g.gain.value = 1; g.connect(master);
      const v = (d, pts, type, gain, st = 0) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(pts[0][1], t + st); pts.slice(1).forEach(([k, f]) => o.frequency.exponentialRampToValueAtTime(f, t + st + k * d)); e.gain.setValueAtTime(.0001, t + st); e.gain.exponentialRampToValueAtTime(gain, t + st + .04); e.gain.setValueAtTime(gain, t + st + d * .7); e.gain.exponentialRampToValueAtTime(.0001, t + st + d); o.connect(e).connect(g); o.start(t + st); o.stop(t + st + d + .03); };
      if (a === 'bull') { v(1.1, [[0, 150], [.2, 210], [.8, 190], [1, 120]], 'sawtooth', .2); v(1.1, [[0, 300], [.2, 420], [1, 240]], 'triangle', .14); }
      if (a === 'eagle') { v(.9, [[0, 2200], [.15, 3300], [.8, 2500], [1, 1600]], 'sawtooth', .07); v(.9, [[0, 4400], [.15, 6300], [1, 3200]], 'sine', .07); }
      if (a === 'rat') for (let i = 0; i < 3; i++) v(.13, [[0, 3000], [.5, 4300], [1, 3400]], 'sine', .16, i * .19);
      if (a === 'bear') { v(1.2, [[0, 95], [.3, 140], [1, 70]], 'sawtooth', .28); v(1.2, [[0, 190], [.3, 270], [1, 130]], 'square', .06); }
    },
    music(on) { wantMusic = on; try { localStorage.setItem('mm_music', on ? '1' : '0'); } catch {} if (on) ensure(); sync(); },
    get musicOn() { return wantMusic; },
    sfx(on) { sfxOn = on; }, get sfxOn() { return sfxOn; },
    duck(on) { ducked = on; if (ctx) sync(); },
    transition() { if (!sfxOn || !ensure()) return; const t = ctx.currentTime; noise(t, .28, .3, 500, 'bandpass', master, 4500); [72, 79, 84].forEach((m, i) => tone(n(m), t + .12 + i * .06, .22, 'triangle', .22)); },
    tick() { if (sfxOn && ensure()) tone(660, ctx.currentTime, .09, 'square', .12); },
    open() { if (sfxOn && ensure()) { const t = ctx.currentTime; tone(n(69), t, .12, 'triangle', .28); tone(n(76), t + .09, .2, 'triangle', .28); } },
    good() { if (sfxOn && ensure()) [76, 84].forEach((m, i) => tone(n(m), ctx.currentTime + i * .1, .24, 'triangle', .26)); },
    bad() { if (sfxOn && ensure()) { const t = ctx.currentTime; tone(165, t, .2, 'square', .14); tone(123, t + .2, .42, 'square', .14); } },
    fanfare() { if (sfxOn && ensure()) [60, 64, 67, 72, 76].forEach((m, i) => tone(n(m), ctx.currentTime + i * .1, .3, 'triangle', .28)); },
  };
})();
