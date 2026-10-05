// ---------- the renderer: timeline -> frame ----------
// window.TL = { fps, frames, beats:[...], lines:[...], lyrics:[...], cards:[...], numbers:[...] }
var LIGHTS = [];
const CV = document.getElementById('cv');
const C = CV.getContext('2d');
const SCENE_CACHE = {};
function getScene(name) {
  if (!SCENE_CACHE[name]) {
    const keys = Object.keys(SCENE_CACHE); if (keys.length > 2) delete SCENE_CACHE[keys[0]];
    if (!SCENES[name]) throw new Error('unknown scene ' + name);
    SCENE_CACHE[name] = SCENES[name]();
  }
  return SCENE_CACHE[name];
}

// ---- keyframe tracks: numeric channels interpolate, everything else holds ----
function buildTracks(kfs) {
  const tracks = {};
  (kfs || []).forEach(k => Object.keys(k).forEach(ch => {
    if (ch === 't' || ch === 'e') return;
    (tracks[ch] = tracks[ch] || []).push({ t: k.t, v: k[ch], e: k.e || 'io' });
  }));
  Object.values(tracks).forEach(a => a.sort((p, q) => p.t - q.t));
  return tracks;
}
function chanAt(track, t, dflt) {
  if (!track || !track.length) return dflt;
  if (t <= track[0].t) return track[0].v;
  for (let i = 0; i < track.length; i++) {
    const k = track[i];
    if (t < k.t) {
      const p = track[i - 1];
      if (typeof p.v === 'number' && typeof k.v === 'number') {
        const u = clamp((t - p.t) / Math.max(1e-6, k.t - p.t));
        return lerp(p.v, k.v, (EASE[k.e] || EASE.io)(u));
      }
      return p.v;
    }
  }
  return track[track.length - 1].v;
}
// discrete channel with timestamp of the last change (for emotion blending)
function discreteAt(track, t, dflt) {
  if (!track || !track.length) return { v: dflt, prev: dflt, since: 99 };
  let idx = -1;
  for (let i = 0; i < track.length; i++) if (track[i].t <= t) idx = i;
  if (idx < 0) return { v: track[0].v, prev: track[0].v, since: 99 };
  return { v: track[idx].v, prev: idx > 0 ? track[idx - 1].v : track[idx].v, since: t - track[idx].t };
}

const ACTORS_STRIDE = { bibi: 96, mama: 96, tuck: 62, odo: 90, luma: 90 };

function prepBeat(b) {
  if (b._prep) return b._prep;
  const fps = TL.fps, n = Math.max(1, Math.ceil((b.t1 - b.t0) * fps) + 2);
  const prep = { actors: {}, camTracks: buildTracks(b.cam), fx: {}, n };
  Object.keys(b.actors || {}).forEach(name => {
    const tr = buildTracks(b.actors[name]);
    const A = { tr, dist: new Float32Array(n), spd: new Float32Array(n) };
    // pre-integrate walked distance so the walk cycle never slides
    let prevX = chanAt(tr.x, b.t0, 0), d = 0;
    for (let i = 0; i < n; i++) {
      const t = b.t0 + i / fps, x = chanAt(tr.x, t, 0), y = chanAt(tr.y, t, 0);
      d += Math.abs(x - prevX); A.spd[i] = (x - prevX) * fps; A.dist[i] = d; prevX = x;
    }
    prep.actors[name] = A;
  });
  Object.keys(b.fx || {}).forEach(k => { const v = b.fx[k]; prep.fx[k] = Array.isArray(v) && v.length && typeof v[0] === 'object' && 't' in v[0] && !('t0' in v[0]) ? buildTracks(v) : null; });
  b._prep = prep; return prep;
}
function fxAt(b, prep, t) {
  const out = {};
  Object.keys(b.fx || {}).forEach(k => {
    const v = b.fx[k];
    if (prep.fx[k]) {
      const tr = prep.fx[k], keys = Object.keys(tr);
      if (keys.length === 1 && keys[0] === 'v') out[k] = chanAt(tr.v, t, 0);
      else { const o = {}; keys.forEach(ch => o[ch] = chanAt(tr[ch], t, 0)); out[k] = o; }
    } else out[k] = v;
  });
  return out;
}

function speechAt(t) {
  const sp = {};
  for (const L of TL.lines) {
    if (t < L.t0 || t > L.t1 + .05) continue;
    const i = Math.min(L.env.length - 1, Math.floor((t - L.t0) * TL.fps));
    sp[L.who] = Math.max(sp[L.who] || 0, L.env[Math.max(0, i)] || 0);
  }
  return sp;
}
const BLINKS = {};
function blinkAt(name, t) {
  const seed = name.charCodeAt(0) * 7 + name.length * 13;
  const per = 3.3, k = Math.floor(t / per), r = rng(seed + k * 31)();
  const start = k * per + .5 + r * 2.4, d = .16, u = (t - start) / d;
  return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI);
}

function applyLayer(c, sc, p, cam) {
  const z = cam.z, cx = cam.x * p + (W / 2) * (1 - p), cy = cam.y * p + (H / 2) * (1 - p);
  c.setTransform(z, 0, 0, z, W / 2 - z * cx, H / 2 - z * cy);
}

function renderFrame(f) {
  const t = f / TL.fps;
  const beat = TL.beats.find(b => t >= b.t0 && t < b.t1) || TL.beats[TL.beats.length - 1];
  const prep = prepBeat(beat), sc = getScene(beat.scene);
  const bi = clamp(Math.floor((t - beat.t0) * TL.fps), 0, prep.n - 1);
  const speech = speechAt(t);
  const fx = fxAt(beat, prep, t);
  const st = { t, lt: t - beat.t0, fx, speech, beat };

  // camera
  const ct = prep.camTracks;
  const cam = { x: chanAt(ct.x, t, W / 2), y: chanAt(ct.y, t, H / 2), z: chanAt(ct.z, t, 1) };
  const fol = discreteAt(ct.follow, t, null).v;
  let followedPose = null;
  const actorPose = (name) => {
    const A = prep.actors[name]; if (!A) return null;
    const tr = A.tr;
    return {
      x: chanAt(tr.x, t, 0) + chanAt(tr.bob_x, t, 0), y: chanAt(tr.y, t, sc.groundY(chanAt(tr.x, t, 0))),
    };
  };
  if (fol) { const ap = actorPose(fol); if (ap) { cam.x = ap.x + chanAt(ct.dx, t, 0); if (ct.y === undefined) cam.y = H / 2 + chanAt(ct.dy, t, 0); } }
  cam.x = clamp(cam.x, W / 2 / cam.z, Math.max(W / 2 / cam.z, sc.W - W / 2 / cam.z));
  cam.y = clamp(cam.y, H / 2 / cam.z, H - H / 2 / cam.z);
  // gentle handheld drift so the shot never feels frozen
  cam.x += Math.sin(t * .31) * 3; cam.y += Math.cos(t * .27) * 2;

  const c = C;
  LIGHTS.length = 0;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);

  sc.back.forEach(L => { c.save(); applyLayer(c, sc, L.p, cam); L.draw(c, st); c.restore(); });

  // actors
  const names = Object.keys(prep.actors), draws = [];
  names.forEach(name => {
    const A = prep.actors[name], tr = A.tr;
    if (tr.vis && t >= tr.vis[0].t && discreteAt(tr.vis, t, 1).v === 0) return;
    const fd = discreteAt(tr.face, t, 'neutral');
    const face = blendEmo(fd.prev, fd.v, EASE.out(clamp(fd.since / .3)));
    let anim = discreteAt(tr.anim, t, 'idle').v;
    if (anim === 'walk' && Math.abs(A.spd[bi]) < 6) anim = 'idle'; // standing still => no hop-in-place
    const x = chanAt(tr.x, t, 0);
    const stride = (ACTORS_STRIDE[name] || 90) * chanAt(tr.stride, t, 1), s = chanAt(tr.s, t, 1);
    const P = {
      x, y: chanAt(tr.y, t, sc.groundY(x)), s, flip: discreteAt(tr.flip, t, 1).v, face, anim, t,
      phase: A.dist[bi] / (stride * s), speed: A.spd[bi], blink: blinkAt(name, t), look: chanAt(tr.look, t, .3), lookY: chanAt(tr.lookY, t, 0),
      speech: speech[name] || 0, lift: chanAt(tr.lift, t, 0), bright: chanAt(tr.bright, t, .6), bpm: beat.bpm || 100,
      lantern: !!discreteAt(tr.lantern, t, false).v, lanternBright: chanAt(tr.lanternBright, t, 1), jumpU: chanAt(tr.jumpU, t, 0), rot: chanAt(tr.rot, t, 0),
      cutY: tr.cutY ? chanAt(tr.cutY, t, undefined) : undefined, seed: name.length,
    };
    draws.push({ name, P, z: chanAt(tr.z, t, 0), y: P.y });
  });
  // riders (Bibi on Tuck's shell) inherit the carrier's position and bob
  draws.forEach(d => {
    const tr = prep.actors[d.name].tr, rd = discreteAt(tr.ride, t, null).v;
    const base = rd && draws.find(q => q.name === rd);
    if (!base) return;
    const bp = base.P, bob = rd === 'tuck' ? (bp.anim === 'swim' ? Math.sin(t * 1.6) * 6 : (bp.anim === 'walk' ? Math.abs(Math.sin(bp.phase * Math.PI * .9)) * 5 : 0)) : 0;
    d.P.x = bp.x + chanAt(tr.rdx, t, 0) * bp.s; d.P.y = bp.y - chanAt(tr.rdy, t, 170) * bp.s - bob; d.y = d.P.y;
  });
  draws.sort((a, b) => a.z - b.z || a.y - b.y);
  window.__vis = draws.map(d => ({ name: d.name, sx: W / 2 + cam.z * (d.P.x - cam.x), sy: H / 2 + cam.z * (d.P.y - cam.y) }));
  c.save(); applyLayer(c, sc, 1, cam);
  draws.forEach(d => { c.save(); DRAW[d.name](c, d.P); c.restore(); });
  c.restore();

  sc.front.forEach(L => { c.save(); applyLayer(c, sc, L.p, cam); L.draw(c, st); c.restore(); });

  // lighting pass (screen space)
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (sc.tint) { c.fillStyle = sc.tint; c.fillRect(0, 0, W, H); }
  LIGHTS.forEach(L => {
    const g = c.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, L.r);
    g.addColorStop(0, rgba(L.col, L.a * .55)); g.addColorStop(.35, rgba(L.col, L.a * .2)); g.addColorStop(1, rgba(L.col, 0));
    c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(L.cx - L.r, L.cy - L.r, L.r * 2, L.r * 2);
  });
  c.globalCompositeOperation = 'source-over';
  // vignette
  const vg = c.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(0,0,20,0)'); vg.addColorStop(1, 'rgba(0,0,20,.42)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);

  drawOverlays(c, t, beat, cam);

  // fades (dip to colour)
  const fcol = (beat.fade && beat.fade.col) || '#0a0824';
  let fa = 0;
  const fin = (beat.fade && beat.fade.in) || 0, fout = (beat.fade && beat.fade.out) || 0;
  if (fin > 0) fa = Math.max(fa, 1 - clamp((t - beat.t0) / fin));
  if (fout > 0) fa = Math.max(fa, 1 - clamp((beat.t1 - t) / fout));
  if (fa > 0) { c.globalAlpha = EASE.sine(fa); c.fillStyle = fcol; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}

// ---- overlays: title card, end card, lyrics, counting numerals ----
function roundedStrokeText(c, txt, x, y, fill, stroke, lw) {
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y);
}
function drawOverlays(c, t, beat, cam) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  // counting numerals popping above their stars (sky coordinates -> screen)
  (TL.numbers || []).forEach(n => {
    const u = (t - n.t0) / .9; if (u < 0 || u > 1) return;
    const pos = BUNNY_STARS[n.n - 1]; if (!pos || !beat.constel) return;
    const k = beat.constel, sx = W / 2 + cam.z * (k.x + pos[0] * k.s - W / 2), sy = H / 2 + cam.z * (k.y + pos[1] * k.s - H / 2);
    const pop = EASE.back(clamp(u * 3.5)), a = 1 - clamp((u - .6) / .4);
    c.save(); c.globalAlpha = a; c.translate(sx, sy - 54 - u * 26); c.scale(pop, pop);
    c.font = '700 54px Fredoka'; c.textAlign = 'center'; c.textBaseline = 'middle';
    roundedStrokeText(c, String(n.n), 0, 0, '#fff4b8', 'rgba(60,30,110,.8)', 10); c.restore();
  });
  // title / end cards
  (TL.cards || []).forEach(cd => {
    if (t < cd.t0 || t > cd.t1) return;
    const u = (t - cd.t0), a = Math.min(clamp(u / .9), clamp((cd.t1 - t) / .9));
    c.save(); c.globalAlpha = EASE.sine(a);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const bounce = 1 + .02 * Math.sin(t * 2.2);
    if (cd.kind === 'title') {
      const y0 = 330 + (1 - EASE.out(clamp(u / 1.4))) * -30;
      glow(c, W / 2, y0 + 50, 760, '#ffe9a0', .22);
      c.save(); c.translate(W / 2, y0); c.scale(bounce, bounce);
      c.font = '700 150px Fredoka'; roundedStrokeText(c, 'Bibi', 0, -86, '#fff6d0', 'rgba(70,35,130,.95)', 26);
      c.font = '600 72px Fredoka'; roundedStrokeText(c, 'and the', 0, 6, '#ffd1e6', 'rgba(70,35,130,.95)', 16);
      c.font = '700 124px Fredoka'; roundedStrokeText(c, 'Little Lost Star', 0, 112, '#ffe27a', 'rgba(70,35,130,.95)', 24);
      c.restore();
      for (let i = 0; i < 16; i++) { const r = rng(300 + i), px = W / 2 + (r() - .5) * 1300, py = 120 + r() * 520, tw = Math.max(0, Math.sin(t * (1 + r() * 1.5) + r() * 6)); c.globalAlpha = EASE.sine(a) * tw; c.fillStyle = '#fff3b8'; starPath(c, px, py, 10 + 12 * tw, 3, 4, t * .3); c.fill(); }
    } else if (cd.kind === 'thumb') {
      c.save(); c.translate(W / 2, 190); c.rotate(-.02);
      c.font = '700 230px Fredoka'; roundedStrokeText(c, 'Bibi', 0, -10, '#fff6d0', 'rgba(60,25,120,.97)', 44);
      c.font = '700 120px Fredoka'; roundedStrokeText(c, 'and the Little Lost Star', 0, 150, '#ffe27a', 'rgba(60,25,120,.97)', 30);
      c.restore();
    } else if (cd.kind === 'end') {
      glow(c, W / 2, 470, 700, '#ffe9a0', .2);
      c.save(); c.translate(W / 2, 430); c.scale(bounce, bounce);
      c.font = '700 150px Fredoka'; roundedStrokeText(c, 'The End', 0, 0, '#ffe27a', 'rgba(70,35,130,.95)', 26);
      c.font = '600 56px Fredoka'; roundedStrokeText(c, cd.text || 'Sweet dreams, little ones', 0, 120, '#fff6d0', 'rgba(70,35,130,.95)', 14);
      c.restore();
    }
    c.restore();
  });
  // karaoke lyrics
  const ly = (TL.lyrics || []).find(l => t >= l.t0 - .3 && t <= l.t1 + .4);
  if (ly) {
    const a = Math.min(clamp((t - (ly.t0 - .3)) / .3), clamp((ly.t1 + .4 - t) / .3));
    c.save(); c.globalAlpha = a; c.font = '700 64px Fredoka'; c.textAlign = 'left'; c.textBaseline = 'middle';
    const words = ly.text.split(' '), widths = words.map(w => c.measureText(w + ' ').width), tot = widths.reduce((p, q) => p + q, 0);
    const x0 = W / 2 - tot / 2, y = 960;
    rrect(c, x0 - 40, y - 62, tot + 80, 124, 40); c.fillStyle = 'rgba(25,12,70,.55)'; c.fill();
    const prog = clamp((t - ly.t0) / Math.max(.1, (ly.t1 - ly.t0) * .92)) * words.length;
    let x = x0;
    words.forEach((w, i) => {
      const on = clamp(prog - i), bounce = on > 0 && on < 1 ? -10 * Math.sin(on * Math.PI) : 0;
      roundedStrokeText(c, w, x, y + bounce, on > .5 ? '#ffe27a' : '#ffffff', 'rgba(40,20,100,.9)', 9);
      x += widths[i];
    });
    c.restore();
  }
}

window.renderFrame = renderFrame;
window.frameJPEG = function (f, q) { renderFrame(f); return CV.toDataURL('image/jpeg', q || .92).slice(23); };
