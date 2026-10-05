// ---------- small drawing + math helpers shared by every module ----------
const W = 1920, H = 1080, TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const EASE = {
  lin: t => t,
  io: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  hold: t => (t >= 1 ? 1 : 0),
};

function rng(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- colour ----
function hex2rgb(h) {
  if (Array.isArray(h)) return h;
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgb2css(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function rgba(h, a = 1) { return rgb2css(hex2rgb(h), a); }
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2css([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]);
}
function mixRGB(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
}
function shade(h, k) { // k<0 darker, k>0 lighter
  const A = hex2rgb(h);
  return k < 0 ? rgb2css(A.map(v => v * (1 + k))) : rgb2css(A.map(v => v + (255 - v) * k));
}

// ---- shapes ----
function ell(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, TAU);
}
function fillEll(c, x, y, rx, ry, col, rot = 0) { ell(c, x, y, rx, ry, rot); c.fillStyle = col; c.fill(); }
function strokeEll(c, x, y, rx, ry, col, w, rot = 0) { ell(c, x, y, rx, ry, rot); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
function starPath(c, cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R, a = rot + i * Math.PI / n;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}
// Fatty "tube" along a quadratic curve built from circles: great for ears, tails, vines.
function tube(c, p0, p1, p2, r0, r1, col, steps = 18) {
  c.fillStyle = col;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, v = 1 - u;
    const x = v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0];
    const y = v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1];
    const r = lerp(r0, r1, u) * (1 + 0.12 * Math.sin(u * Math.PI)); // slight belly
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
}
function glow(c, x, y, r, col, a = 1, comp = 'screen') {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(.4, rgba(col, a * .35));
  g.addColorStop(1, rgba(col, 0));
  const old = c.globalCompositeOperation;
  c.globalCompositeOperation = comp;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = old;
}
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
function withT(c, x, y, sx, sy, rot, fn) {
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(sx, sy === undefined ? sx : sy); fn(); c.restore();
}
function noise1(x, seed = 0) { // cheap smooth value noise in [-1,1]
  const i = Math.floor(x), f = x - i;
  const r = k => { const s = Math.sin((k + seed * 131.7) * 127.1) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const t = f * f * (3 - 2 * f);
  return lerp(r(i), r(i + 1), t);
}
