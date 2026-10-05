// ---------- environment toolkit: sky, stars, constellation, hills, trees, plants, light ----------

// 30-star bunny constellation (local units, y up is negative). #30 is the missing ear-tip star.
const BUNNY_STARS = [
  [0, 0], [-70, 40], [70, 40], [-95, 110], [95, 110], [-50, 140], [50, 140], [0, -60], [-55, -110], [55, -110],
  [-70, -160], [70, -160], [0, -190], [-30, -195], [30, -195], [-45, -245], [-58, -290], [45, -250], [58, -295], [68, -335],
  [-100, -60], [100, -60], [-130, -20], [130, -15], [120, 60], [150, 95], [-20, -130], [20, -130], [0, -100], [-70, -338],
];
const BUNNY_LINES = [[13, 15], [15, 16], [16, 29], [14, 17], [17, 18], [18, 19], [10, 13], [13, 12], [12, 14], [10, 8], [8, 7], [7, 9], [9, 11],
  [7, 0], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [20, 8], [21, 9], [22, 20], [23, 21], [2, 24], [24, 25]];

// opts: {count (0..30, float), gap (bool), lines (0..1), glow (0..1), dim}
function drawConstellation(c, t, ox, oy, sc, o) {
  const count = o.count === undefined ? 30 : o.count;
  const lines = o.lines || 0;
  if (lines > .01) {
    c.save(); c.strokeStyle = `rgba(255,236,170,${.28 * lines})`; c.lineWidth = 2.2; c.setLineDash([2, 8]); c.lineCap = 'round';
    BUNNY_LINES.forEach(([a, b]) => {
      if (a >= count || b >= count) return;
      if (o.gap && (a === 29 || b === 29)) return;
      c.beginPath(); c.moveTo(ox + BUNNY_STARS[a][0] * sc, oy + BUNNY_STARS[a][1] * sc); c.lineTo(ox + BUNNY_STARS[b][0] * sc, oy + BUNNY_STARS[b][1] * sc); c.stroke();
    });
    c.restore();
  }
  for (let i = 0; i < 30; i++) {
    const age = count - i; // >0 once lit
    const x = ox + BUNNY_STARS[i][0] * sc, y = oy + BUNNY_STARS[i][1] * sc;
    if (i === 29 && o.gap) { // the empty spot: faint dotted ring (pulses when the story points at it)
      const pu = o.pulse || 0, wob = .5 + .5 * Math.sin(t * 4);
      c.save(); c.strokeStyle = `rgba(255,240,190,${.18 + .1 * Math.sin(t * 2) + pu * (.45 + .2 * wob)})`; c.lineWidth = 2 + pu * 2; c.setLineDash([3, 7]);
      c.beginPath(); c.arc(x, y, (16 * sc + 4) * (1 + pu * .35 * wob), 0, TAU); c.stroke(); c.restore();
      if (pu > 0) glow(c, x, y, 90 * sc, '#fff0b8', .22 * pu * wob);
      continue;
    }
    if (age <= 0) continue;
    const pop = Math.min(1, age * 2.2), over = pop < 1 ? 1 + (1 - pop) * 1.2 : 1;
    const tw = 1 + .16 * Math.sin(t * 2.3 + i * 1.7);
    const R = (7 + (i === 29 ? 5 : 0)) * sc * tw * pop * over * (o.big || 1);
    glow(c, x, y, R * 5, '#fff0b8', .55 * pop * (o.glow || 1));
    c.fillStyle = '#fffbe6'; starPath(c, x, y, R, R * .42, 4, Math.PI / 4 + t * .05 * (i % 2 ? 1 : -1)); c.fill();
    c.beginPath(); c.arc(x, y, R * .38, 0, TAU); c.fill();
  }
}

function seededStars(n, seed, w = 2400, h = 700) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) out.push({ x: r() * w - 240, y: Math.pow(r(), 1.3) * h, s: .6 + r() * 1.8, ph: r() * 6.28, sp: 1 + r() * 2.5 });
  return out;
}
const STARFIELDS = {};
function drawStars(c, t, amount, seed = 7, n = 150, h = 640) {
  if (amount <= .01) return;
  const key = seed + ':' + n; const arr = STARFIELDS[key] || (STARFIELDS[key] = seededStars(n, seed, 2400, h));
  c.save();
  for (const s of arr) {
    const a = amount * (.45 + .55 * (.5 + .5 * Math.sin(t * s.sp + s.ph))) * clamp(1 - s.y / (h * 1.15) + .25);
    c.globalAlpha = clamp(a);
    c.fillStyle = '#fff6dc';
    if (s.s > 1.9) { starPath(c, s.x, s.y, s.s * 2.3, s.s * .8, 4, 0); c.fill(); }
    else { c.beginPath(); c.arc(s.x, s.y, s.s, 0, TAU); c.fill(); }
  }
  c.restore();
}

function drawMoon(c, x, y, r, o = {}) {
  glow(c, x, y, r * 4.2, '#cfd8ff', o.halo === undefined ? .45 : o.halo);
  const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
  g.addColorStop(0, '#fffdf0'); g.addColorStop(1, '#e8e3c8');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(190,180,150,.35)';
  [[-.35, -.25, .16], [.3, .1, .2], [-.1, .4, .12], [.4, -.4, .1]].forEach(([a, b, k]) => { c.beginPath(); c.arc(x + a * r, y + b * r, k * r, 0, TAU); c.fill(); });
  if (o.face) { // sleepy, kind face
    const F = o.face; // {open: 0..1 speech, eyes: 0..1 openness}
    c.strokeStyle = '#6b6a86'; c.lineWidth = r * .045; c.lineCap = 'round';
    const eo = F.eyes === undefined ? 0 : F.eyes;
    for (const sd of [-1, 1]) {
      const ex = x + sd * r * .32, ey = y - r * .05;
      if (eo < .15) { c.beginPath(); c.arc(ex, ey, r * .11, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
      else { fillEll(c, ex, ey, r * .075, r * .1 * eo, '#4b4a6a'); fillEll(c, ex - r * .02, ey - r * .03, r * .025, r * .025, '#fff'); }
    }
    fillEll(c, x - r * .52, y + r * .18, r * .13, r * .08, 'rgba(255,150,170,.4)'); fillEll(c, x + r * .52, y + r * .18, r * .13, r * .08, 'rgba(255,150,170,.4)');
    const mo = F.open || 0;
    c.beginPath();
    if (mo > .08) { c.ellipse(x, y + r * .3, r * .1, r * (.04 + .12 * mo), 0, 0, TAU); c.fillStyle = '#7a4a5a'; c.fill(); }
    else { c.arc(x, y + r * .22, r * .14, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
  }
}

function drawCloud(c, x, y, s, col, a = 1) {
  // one compound path, one fill: overlapping puffs merge instead of showing ring seams
  c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath();
  [[0, 0, 60], [55, -14, 50], [-55, -6, 44], [100, 8, 38], [-98, 12, 34], [20, 14, 56]].forEach(([dx, dy, r]) => { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); });
  c.fill();
  c.restore();
}

function drawMeteor(c, t, m) { // m: {t0, dur, x0,y0,x1,y1}
  const u = (t - m.t0) / m.dur; if (u < 0 || u > 1.15) return;
  const e = EASE.sine(clamp(u));
  const x = lerp(m.x0, m.x1, e), y = lerp(m.y0, m.y1, e);
  const fade = u > 1 ? 1 - (u - 1) / .15 : 1;
  const dx = m.x1 - m.x0, dy = m.y1 - m.y0, L = Math.hypot(dx, dy), nx = dx / L, ny = dy / L;
  c.save(); c.globalAlpha = fade;
  const tail = 360;
  const g = c.createLinearGradient(x, y, x - nx * tail, y - ny * tail);
  g.addColorStop(0, 'rgba(255,240,170,.95)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  c.strokeStyle = g; c.lineCap = 'round'; c.lineWidth = 16;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - nx * tail, y - ny * tail); c.stroke();
  c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - nx * tail * .45, y - ny * tail * .45); c.stroke();
  glow(c, x, y, 130, '#ffe9a0', .9);
  c.fillStyle = '#fff'; starPath(c, x, y, 26, 9, 5, t * 6); c.fill();
  for (let i = 0; i < 14; i++) { // sparkle trail
    const k = (i / 14), sx = x - nx * tail * k * .9 + Math.sin(i * 12.9) * 26, sy = y - ny * tail * k * .9 + Math.cos(i * 7.3) * 26;
    c.globalAlpha = fade * (1 - k) * (.5 + .5 * Math.sin(t * 14 + i));
    c.fillStyle = '#fff3c0'; starPath(c, sx, sy, 7 * (1 - k * .5), 2, 4, 0); c.fill();
  }
  c.restore();
}

function hillPath(c, base, amp, seed, f1 = .0016, f2 = .0043, x0 = -400, x1 = 3600, step = 24) {
  c.beginPath(); c.moveTo(x0, 1400);
  for (let x = x0; x <= x1; x += step) {
    const y = base + amp * Math.sin(x * f1 + seed) + amp * .45 * Math.sin(x * f2 + seed * 2.3) + amp * .2 * Math.sin(x * f2 * 2.7 + seed * 5);
    c.lineTo(x, y);
  }
  c.lineTo(x1, 1400); c.closePath();
}
function hillY(base, amp, seed, x, f1 = .0016, f2 = .0043) {
  return base + amp * Math.sin(x * f1 + seed) + amp * .45 * Math.sin(x * f2 + seed * 2.3) + amp * .2 * Math.sin(x * f2 * 2.7 + seed * 5);
}

function pine(c, x, y, h, col, col2) {
  const w = h * .36;
  c.fillStyle = col2 || col; c.fillRect(x - h * .035, y - h * .12, h * .07, h * .14);
  for (let i = 0; i < 4; i++) {
    const ty = y - h * .1 - i * h * .21, ww = w * (1 - i * .2), hh = h * .34;
    c.fillStyle = col; c.beginPath(); c.moveTo(x - ww, ty); c.quadraticCurveTo(x, ty - hh * 1.25, x + ww, ty); c.quadraticCurveTo(x, ty + hh * .12, x - ww, ty); c.fill();
  }
}
function roundTree(c, x, y, h, trunk, leaf, leaf2) {
  const r = h * .3;
  c.fillStyle = trunk; rrect(c, x - h * .05, y - h * .45, h * .1, h * .47, h * .04); c.fill();
  [[0, -.62, 1], [-.22, -.5, .78], [.22, -.5, .78], [-.1, -.8, .7], [.14, -.76, .72]].forEach(([dx, dy, k]) => fillEll(c, x + dx * h * .5, y + dy * h * .5 + (-h * .15), r * k, r * k * .92, leaf));
  fillEll(c, x - r * .35, y - h * .85, r * .55, r * .4, leaf2 || shade(leaf, .18));
}
function bush(c, x, y, r, col, hi) {
  fillEll(c, x, y - r * .5, r, r * .62, col); fillEll(c, x - r * .6, y - r * .35, r * .62, r * .42, col); fillEll(c, x + r * .62, y - r * .35, r * .6, r * .4, col);
  if (hi) fillEll(c, x - r * .25, y - r * .75, r * .5, r * .22, hi);
}
function mushroom(c, t, x, y, r, cap, spot, glowCol, ph = 0) {
  const sway = 1 + .02 * Math.sin(t * 1.5 + ph);
  if (glowCol) glow(c, x, y - r * 1.2, r * 3.8, glowCol, .5 + .12 * Math.sin(t * 2 + ph));
  fillEll(c, x, y - r * .65, r * .26, r * .7, '#f6ecd8');
  c.save(); c.translate(x, y - r * 1.15); c.scale(1, sway);
  c.fillStyle = cap; c.beginPath(); c.ellipse(0, 0, r * 1.05, r * .78, 0, Math.PI, TAU); c.quadraticCurveTo(r * .6, r * .18, 0, r * .22); c.quadraticCurveTo(-r * .6, r * .18, -r * 1.05, 0); c.fill();
  c.fillStyle = spot; [[-.5, -.35, .13], [.1, -.55, .16], [.52, -.25, .11], [-.1, -.2, .08]].forEach(([a, b, k]) => { c.beginPath(); c.arc(a * r, b * r, k * r, 0, TAU); c.fill(); });
  c.restore();
}
function grassTufts(c, t, x0, x1, y, step, h, col, seed = 3, sway = 1) {
  if (!(step > 0)) return; // guard: a zero step would loop forever
  const r = rng(seed); c.fillStyle = col;
  for (let x = x0; x < x1; x += step) {
    const hh = h * (.6 + r() * .8), w = 7 + r() * 6, s = Math.sin(t * 1.3 + x * .012) * 6 * sway, jx = x + (r() - .5) * step;
    c.beginPath(); c.moveTo(jx - w, y); c.quadraticCurveTo(jx - w * .2 + s * .4, y - hh * .6, jx + s, y - hh); c.quadraticCurveTo(jx + w * .3 + s * .4, y - hh * .5, jx + w, y); c.closePath(); c.fill();
  }
}
function flower(c, t, x, y, r, petal, center, stem = '#3c8a55', stemH = 50) {
  c.strokeStyle = stem; c.lineWidth = 4; c.lineCap = 'round'; const s = Math.sin(t * 1.4 + x * .02) * 3;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s, y - stemH * .5, x + s * 1.6, y - stemH); c.stroke();
  const fx = x + s * 1.6, fy = y - stemH;
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; fillEll(c, fx + Math.cos(a) * r * .8, fy + Math.sin(a) * r * .8, r * .62, r * .62, petal); }
  fillEll(c, fx, fy, r * .5, r * .5, center);
}
function clover(c, x, y, r, col) { for (let i = 0; i < 3; i++) { const a = i * TAU / 3 - Math.PI / 2; fillEll(c, x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .55, r * .55, col); } }
function rock(c, x, y, w, h, col) { fillEll(c, x, y - h * .5, w, h * .6, col); fillEll(c, x - w * .25, y - h * .7, w * .45, h * .25, shade(col, .2)); }

function fireflies(c, t, n, seed, x0, x1, y0, y1, col = '#f6ff9a', size = 1, amount = 1) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const bx = x0 + r() * (x1 - x0), by = y0 + r() * (y1 - y0), ph = r() * 6.28, sp = .3 + r() * .5, rad = 30 + r() * 60;
    const x = bx + Math.cos(t * sp + ph) * rad + Math.sin(t * sp * .6 + ph * 2) * rad * .4, y = by + Math.sin(t * sp * 1.3 + ph) * rad * .6;
    const bl = Math.pow(.5 + .5 * Math.sin(t * (1.1 + r()) + ph * 3), 2) * amount;
    glow(c, x, y, 34 * size, col, .75 * bl); c.globalAlpha = .6 + .4 * bl; c.fillStyle = '#fffde0'; c.beginPath(); c.arc(x, y, 2.6 * size, 0, TAU); c.fill(); c.globalAlpha = 1;
  }
}
function mist(c, t, x0, x1, y, h, col, a, seed = 1) {
  c.save();
  for (let i = 0; i < 9; i++) {
    const r = rng(seed * 100 + i), x = x0 + (x1 - x0) * ((r() + t * .004 * (1 + r())) % 1), w = 260 + r() * 340;
    const g = c.createRadialGradient(x, y, 0, x, y, w); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.save(); c.translate(x, y); c.scale(1, h / w); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - w, y - w, w * 2, w * 2); c.restore();
  }
  c.restore();
}
function sparkleDust(c, t, x, y, w, h, n, seed, col = '#fff1b0') {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, ph = r() * 6.28, tw = Math.max(0, Math.sin(t * (1 + r() * 2) + ph));
    c.globalAlpha = tw * .8; c.fillStyle = col; starPath(c, px, py + Math.sin(t + ph) * 8, 5 + 5 * tw, 1.6, 4, 0); c.fill();
  }
  c.globalAlpha = 1;
}
