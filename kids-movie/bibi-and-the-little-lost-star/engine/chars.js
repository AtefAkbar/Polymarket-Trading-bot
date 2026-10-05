// ---------- characters: expression system + Bibi / Mama (bunnies), Tuck, Odo, Luma ----------

const EMO = {
  neutral:   { eye: 1,    pup: 1,   br: 0,    by: 0,   smile: .35, open: 0,   cheek: .45, tear: 0, happy: 0 },
  happy:     { eye: 1,    pup: 1.1, br: -.05, by: 0,   smile: .85, open: .1,  cheek: .8,  tear: 0, happy: 0 },
  joy:       { eye: 1,    pup: 1.1, br: 0,    by: -4,  smile: 1,   open: .55, cheek: 1,   tear: 0, happy: 1 },
  giggle:    { eye: .75,  pup: 1,   br: 0,    by: -2,  smile: 1,   open: .4,  cheek: .9,  tear: 0, happy: .9 },
  sad:       { eye: .95,  pup: 1.1, br: .55,  by: -2,  smile: -.75,open: 0,   cheek: .25, tear: 0, happy: 0 },
  cry:       { eye: .9,   pup: 1.15,br: .65,  by: -2,  smile: -.8, open: .35, cheek: .3,  tear: 1, happy: 0 },
  scared:    { eye: 1.25, pup: .55, br: .5,   by: -10, smile: -.35,open: .22, cheek: .1,  tear: 0, happy: 0 },
  surprised: { eye: 1.3,  pup: .75, br: 0,    by: -14, smile: 0,   open: .6,  cheek: .4,  tear: 0, happy: 0 },
  determined:{ eye: .88,  pup: 1,   br: -.4,  by: 2,   smile: .55, open: 0,   cheek: .5,  tear: 0, happy: 0 },
  sleepy:    { eye: .28,  pup: 1,   br: .15,  by: 3,   smile: .25, open: 0,   cheek: .5,  tear: 0, happy: 0 },
  worried:   { eye: 1.05, pup: .9,  br: .4,   by: -3,  smile: -.2, open: 0,   cheek: .3,  tear: 0, happy: 0 },
  proud:     { eye: .85,  pup: 1,   br: -.1,  by: -2,  smile: .85, open: .1,  cheek: .75, tear: 0, happy: 0 },
  grumpy:    { eye: .72,  pup: 1,   br: -.45, by: 3,   smile: -.45,open: 0,   cheek: .2,  tear: 0, happy: 0 },
  shy:       { eye: .8,   pup: 1,   br: .3,   by: 0,   smile: .15, open: 0,   cheek: 1,   tear: 0, happy: 0 },
  sing:      { eye: .9,   pup: 1.1, br: -.05, by: -2,  smile: .9,  open: .35, cheek: .9,  tear: 0, happy: .8 },
};
const EMO_KEYS = Object.keys(EMO.neutral);
function blendEmo(a, b, k) {
  const A = EMO[a] || EMO.neutral, B = EMO[b] || EMO.neutral, o = {};
  for (const key of EMO_KEYS) o[key] = lerp(A[key], B[key], k);
  return o;
}

function groundShadow(c, rx, ry, a = .28) {
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(10,8,30,${a})`); g.addColorStop(1, 'rgba(10,8,30,0)');
  c.save(); c.scale(1, ry / rx); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}

// ---------- shared face renderer ----------
// o: {eyes:[{x,y,rx,ry}], ink, sclera, mouth:{x,y,w}, brow:{col,len}, cheeks:[{x,y,rx,ry}], cheekCol}
function drawFace(c, o, F, P) {
  const blink = P.blink || 0;
  o.eyes.forEach((e, idx) => {
    const sd = e.x < 0 ? -1 : 1;
    const hk = smooth(.4, .62, F.happy); // ^ ^ eyes vs round eyes: switch within a narrow band so nothing ghosts
    const openK = Math.max(.05, F.eye * (1 - blink * .95) * (1 - Math.min(F.happy, .4) * .5));
    if (hk > .03) {
      c.save(); c.globalAlpha = hk; c.strokeStyle = o.ink; c.lineWidth = e.rx * .36; c.lineCap = 'round';
      c.beginPath(); c.arc(e.x, e.y + e.ry * .45, e.rx * .75, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore();
    }
    const a = 1 - hk;
    if (a > .03) {
      c.save(); c.globalAlpha = a;
      const rx = e.rx, ry = e.ry * openK;
      fillEll(c, e.x, e.y, rx, ry, o.sclera);
      c.save(); ell(c, e.x, e.y, rx, ry); c.clip();
      const prx = e.rx * .72 * F.pup, pry = e.ry * .78 * F.pup;
      const px = e.x + (P.look || 0) * rx * .34, py = e.y + (P.lookY || 0) * e.ry * .3;
      if (o.iris) { fillEll(c, px, py, prx * 1.12, pry * 1.1, o.iris); fillEll(c, px, py, prx * .62, pry * .66, o.ink); }
      else fillEll(c, px, py, prx, pry, o.ink);
      fillEll(c, px - prx * .32, py - pry * .36, rx * .27, rx * .27, '#fff');
      fillEll(c, px + prx * .38, py + pry * .34, rx * .12, rx * .12, 'rgba(255,255,255,.85)');
      c.restore();
      // lash line
      c.strokeStyle = o.ink; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.ellipse(e.x, e.y, rx, ry, 0, Math.PI * 1.04, Math.PI * 1.96); c.stroke();
      c.restore();
    }
    // brows
    if (o.brow) {
      c.save(); c.translate(e.x, e.y - e.ry - o.brow.gap + F.by);
      c.rotate(sd * F.br * .62 * (o.eyes.length > 1 ? 1 : 1));
      c.strokeStyle = o.brow.col; c.lineWidth = o.brow.w || 8; c.lineCap = 'round';
      const L = e.rx * o.brow.len;
      c.beginPath(); c.moveTo(-L, 3); c.quadraticCurveTo(0, -7, L, 3); c.stroke();
      c.restore();
    }
    // tears
    if (F.tear > .05) {
      const sc = e.rx / 23; // scale tears with eye size
      // wet shine under the eye + two falling drops
      c.save(); c.globalAlpha = F.tear * .5;
      fillEll(c, e.x, e.y + e.ry * .95, e.rx * .95, e.ry * .22, '#bfe9ff'); c.restore();
      for (let k = 0; k < 2; k++) {
        const ph = ((P.t * .9) + idx * .31 + k * .5) % 1;
        c.save(); c.globalAlpha = F.tear * Math.min(1, (1 - ph) * 2.2) * Math.min(1, ph * 6);
        const ty = e.y + e.ry * .9 + ph * 95 * sc, tx = e.x + sd * (e.rx * .3 + ph * 6 * sc);
        c.fillStyle = '#a8e0ff'; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
        const r = 12 * sc;
        c.beginPath(); c.moveTo(tx, ty - r * 1.5); c.quadraticCurveTo(tx + r, ty + r * .2, tx, ty + r * 1.1); c.quadraticCurveTo(tx - r, ty + r * .2, tx, ty - r * 1.5); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(tx - r * .3, ty, r * .22, 0, TAU); c.fill();
        c.restore();
      }
    }
  });
  // cheeks
  (o.cheeks || []).forEach(ch => fillEll(c, ch.x, ch.y, ch.rx, ch.ry, rgba(o.cheekCol || '#ff8fa8', .55 * F.cheek)));
  // mouth
  if (o.noMouth) return;
  const m = o.mouth;
  const sp = P.speech || 0;
  const open = clamp(F.open + sp * .75);
  const w = m.w * (1 + .1 * F.smile - sp * .08);
  const k = F.smile * m.w * .42; // curvature: + smile (corners up)
  c.save(); c.translate(m.x, m.y);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (open < .1) {
    c.strokeStyle = o.mouthInk || '#5a2f3f'; c.lineWidth = m.lw || 5;
    c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, k * 1.6, w, 0); c.stroke();
  } else {
    const h = m.w * (.1 + open * .85);
    c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, k * 1.3, w, 0);
    c.quadraticCurveTo(w * .3, k + h * 1.5, 0, k + h * 1.5);
    c.quadraticCurveTo(-w * .3, k + h * 1.5, -w, 0); c.closePath();
    c.fillStyle = o.mouthIn || '#6b2233'; c.fill();
    c.save(); c.clip();
    fillEll(c, 0, k + h * 1.4, w * .6, h * .55, o.tongue || '#ff8fa0');
    c.restore();
    c.strokeStyle = o.mouthInk || '#5a2f3f'; c.lineWidth = (m.lw || 5) * .75;
    c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, k * 1.3, w, 0); c.stroke();
  }
  c.restore();
}

// ---------- rabbit ----------
const BUNNY_STYLES = {
  bibi: { fur: '#fff1e4', shade: '#f0d6c6', inner: '#ffb3c4', scarf: '#27b3a8', scarfD: '#1b8e86', cheek: '#ff93a8', ink: '#2b2140', brow: '#c9a48f', nose: '#ff8aa0', scale: 1 },
  mama: { fur: '#dccbf5', shade: '#c3add9', inner: '#f7bcdc', scarf: '#ffcf5a', scarfD: '#e2a92d', cheek: '#ff93b8', ink: '#2b2140', brow: '#a58cc4', nose: '#f28ab0', scale: 1.22, bow: '#ff7aa8' },
};

function bunnyEar(c, bx, by, ang, bend, len, r, S) {
  const dx = Math.sin(ang), dy = -Math.cos(ang), px = Math.cos(ang), py = Math.sin(ang);
  const p0 = [bx, by];
  const p1 = [bx + dx * len * .55 + px * bend * .25, by + dy * len * .55 + py * bend * .25];
  const p2 = [bx + dx * len + px * bend, by + dy * len + py * bend];
  tube(c, p0, p1, p2, r, r * .78, S.fur);
  const q0 = [bx + dx * len * .12, by + dy * len * .12];
  const q1 = [p1[0] + dx * len * .02, p1[1] + dy * len * .02];
  const q2 = [bx + dx * len * .86 + px * bend * .86, by + dy * len * .86 + py * bend * .86];
  tube(c, q0, q1, q2, r * .55, r * .4, S.inner);
}

function drawBunny(c, P, S) {
  const t = P.t, ph = P.phase * Math.PI;
  let bounce = 0, sq = 1, lean = 0, trail = 0, armL = .22, armR = .22, jx = 0, earFlap = 0, tilt = 0;
  const breathe = 1 + .014 * Math.sin(t * TAU / 3.2);
  const sp = P.speed || 0;
  switch (P.anim) {
    case 'walk': {
      const a = Math.abs(Math.sin(ph));
      bounce = a * 24; sq = 1 - .075 * Math.pow(1 - a, 3) + .035 * a; lean = Math.sin(ph) * .04;
      trail = clamp(Math.abs(sp) / 260) * .2; earFlap = Math.cos(ph) * .1;
      armL = .35 + Math.sin(ph) * .45; armR = .35 - Math.sin(ph) * .45; break;
    }
    case 'tremble': jx = Math.sin(t * 58) * 2.2; armL = armR = .9; earFlap = Math.sin(t * 40) * .03; break;
    case 'cheer': {
      const a = Math.abs(Math.sin(t * TAU * .85)); bounce = a * 52; sq = 1 + .05 * a - .08 * (1 - a) * (1 - a);
      armL = armR = 2.7 + Math.sin(t * 9) * .2; earFlap = Math.sin(t * TAU * .85 - 1) * .18; break;
    }
    case 'wave': armR = 2.5 + Math.sin(t * 9) * .45; armL = .2; break;
    case 'dance': {
      const b = t * (P.bpm || 100) / 60 * Math.PI; const a = Math.abs(Math.sin(b));
      bounce = a * 30; sq = 1 - .06 * Math.pow(1 - a, 3) + .03 * a; tilt = Math.sin(b * .5) * .09;
      armL = 1.2 + Math.sin(b * .5) * .9; armR = 1.2 - Math.sin(b * .5) * .9; earFlap = Math.sin(b - 1) * .16; break;
    }
    case 'hug': armL = armR = 1.3; break;
    case 'jump': { // P.jumpU 0..1
      const u = clamp(P.jumpU || 0); bounce = Math.sin(u * Math.PI) * 190; sq = 1 + .12 * Math.sin(u * Math.PI);
      armL = armR = 2.3; earFlap = -.25 * Math.sin(u * Math.PI); break;
    }
    default: earFlap = Math.sin(t * 1.3) * .02;
  }
  const F = P.face;
  const droop = clamp(F.br * 1.35, 0, 1);

  c.save();
  c.translate(P.x + jx, P.y - (P.lift || 0));
  c.scale(P.flip * P.s * S.scale, P.s * S.scale);
  groundShadow(c, 98 * (1 - Math.min(.35, ((P.lift || 0) + bounce) / 300)), 17);
  c.translate(0, -bounce);
  c.rotate(lean + tilt);
  c.scale(1 + (1 - sq) * .55, sq * breathe);
  if (P.cutY !== undefined) { c.beginPath(); c.rect(-400, -700, 800, 700 + P.cutY); c.clip(); }

  // tail
  fillEll(c, -66, -66, 27, 25, S.fur); fillEll(c, -70, -70, 14, 12, '#fff');
  // ears (behind head)
  for (const side of [-1, 1]) {
    const sway = Math.sin(t * 1.7 + side * 1.3) * .035;
    const ang = side * (.11 + droop * 1.85) + sway + earFlap * side - trail * (1 - droop);
    const bend = side * (7 + droop * 72) + (side > 0 ? 8 : -2) * (1 - droop);
    bunnyEar(c, side * 44, -304, ang, bend, 185 - droop * 38, 33, S);
  }
  // feet
  for (const side of [-1, 1]) {
    fillEll(c, side * 40, -14, 38, 18, S.fur); fillEll(c, side * 40, -8, 26, 9, S.shade);
    fillEll(c, side * 40 + side * 6, -17, 14, 7, S.inner);
  }
  // body
  fillEll(c, 0, -72, 84, 66, S.fur);
  fillEll(c, 0, -104, 70, 84, S.fur);
  fillEll(c, 0, -92, 50, 62, '#fffaf4');
  fillEll(c, 0, -52, 70, 24, rgba(S.shade, .45));
  // arms (behind scarf)
  const arm = (side, th, hold) => {
    const sx = side * 62, sy = -138, L = 66;
    const hx = sx + side * Math.sin(th) * L, hy = sy + Math.cos(th) * L;
    c.strokeStyle = S.fur; c.lineWidth = 30; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    fillEll(c, hx, hy, 19, 18, S.fur);
    fillEll(c, hx + side * 4, hy + 5, 8, 6, S.shade);
    return [hx, hy];
  };
  const hasLantern = !!P.lantern;
  arm(-1, armL);
  const hR = arm(1, hasLantern ? .55 + (P.anim === 'walk' ? Math.sin(ph) * .12 : 0) : armR);
  // scarf / shawl
  if (S.scarf) {
    c.fillStyle = S.scarf; rrect(c, -62, -176, 124, 36, 18); c.fill();
    c.fillStyle = S.scarfD; for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(i * 24, -158, 4, 13, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(40, -150); c.rotate(.25 + Math.sin(t * 2.2 + P.phase) * .06);
    c.fillStyle = S.scarf; rrect(c, -4, 0, 30, 62, 12); c.fill();
    c.fillStyle = S.scarfD; rrect(c, 4, 40, 14, 6, 3); c.fill(); c.restore();
  }
  if (S.bow) { // little bow on mama
    fillEll(c, -22, -300, 22, 15, S.bow, .4); fillEll(c, 22, -300, 22, 15, S.bow, -.4); fillEll(c, 0, -300, 10, 10, shade(S.bow, -.2));
  }
  // lantern
  if (hasLantern) {
    const sw = Math.sin(t * 2.4 + P.phase * 1.7) * .12 + (P.anim === 'walk' ? Math.sin(ph) * .16 : 0);
    c.save(); c.translate(hR[0] + 6, hR[1] - 2); c.rotate(sw);
    c.strokeStyle = '#6b4a2b'; c.lineWidth = 5; c.beginPath(); c.arc(0, 6, 12, Math.PI, TAU); c.stroke();
    c.fillStyle = '#5a3d25'; rrect(c, -20, 14, 40, 9, 4); c.fill();
    const lg = c.createLinearGradient(0, 22, 0, 70); lg.addColorStop(0, '#fff3b0'); lg.addColorStop(1, '#ffc24a');
    c.fillStyle = lg; rrect(c, -17, 22, 34, 46, 12); c.fill();
    c.fillStyle = '#5a3d25'; rrect(c, -20, 66, 40, 9, 4); c.fill();
    c.strokeStyle = 'rgba(90,61,37,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(0, 68); c.stroke();
    const m = c.getTransform(); const bright = P.lanternBright === undefined ? 1 : P.lanternBright;
    LIGHTS.push({ cx: m.c * 46 + m.e, cy: m.d * 46 + m.f, r: 470 * Math.hypot(m.a, m.b), col: '#ffc86a', a: .5 * bright });
    glow(c, 0, 46, 90, '#fff0b0', .9 * bright, 'screen');
    c.restore();
  }
  // head
  fillEll(c, 0, -230, 106, 90, S.fur);
  fillEll(c, 0, -196, 92, 52, rgba(S.shade, .5));
  fillEll(c, 0, -262, 60, 22, 'rgba(255,255,255,.35)');
  // face
  const faceO = {
    eyes: [{ x: -42, y: -236, rx: 23, ry: 29 }, { x: 42, y: -236, rx: 23, ry: 29 }], ink: S.ink, sclera: '#ffffff',
    brow: { col: S.brow, gap: 14, len: .85, w: 8 },
    mouth: { x: 0, y: -193, w: 17, lw: 5 }, mouthInk: '#5a2f3f',
    cheeks: [{ x: -70, y: -208, rx: 17, ry: 11 }, { x: 70, y: -208, rx: 17, ry: 11 }], cheekCol: S.cheek,
  };
  drawFace(c, faceO, F, P);
  // nose + whiskers (after face so nose sits above mouth)
  fillEll(c, 0, -213, 10, 7, S.nose); fillEll(c, -3, -215, 3, 2, 'rgba(255,255,255,.7)');
  c.strokeStyle = rgba(S.shade, .9); c.lineWidth = 2.5; c.lineCap = 'round';
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(side * 74, -200 + i * 9); c.quadraticCurveTo(side * 98, -204 + i * 14, side * 112, -196 + i * 20); c.stroke(); }
  c.restore();
}

// ---------- Odo the owl ----------
function drawOwl(c, P) {
  const t = P.t, F = P.face, fly = P.anim === 'fly';
  const breathe = 1 + .016 * Math.sin(t * TAU / 3.0);
  const flapPh = fly ? t * TAU * 1.9 : 0;
  const flap = fly ? Math.sin(flapPh) : 0;
  const bob = fly ? Math.sin(flapPh - .8) * 14 : 0;
  const BR = '#a9744a', BRd = '#7e5233', CR = '#f6dfb4';
  c.save();
  c.translate(P.x + (P.jx || 0), P.y - (P.lift || 0) - bob);
  c.scale(P.flip * P.s, P.s);
  if (!fly) groundShadow(c, 80, 12, .2); else { c.save(); c.translate(0, bob + (P.lift || 0)); groundShadow(c, 70 - (P.lift || 0) * .05, 12, .16); c.restore(); }
  c.rotate(fly ? .12 : (P.anim === 'shake' ? Math.sin(t * 30) * .05 : 0));
  c.scale(1, breathe);

  // wing: feathers fan out along local +y; rotating by -side*theta swings it from hanging (0) to outstretched (pi/2) to raised (pi)
  const wing = (side, mode) => {
    c.save(); c.translate(side * 80, -196);
    let th;
    if (mode === 'fly') th = -side * (Math.PI / 2 + flap * 1.0);
    else if (mode === 'cheer') th = -side * (Math.PI * .8 + Math.sin(t * 8) * .3);
    else th = -side * .1;
    c.rotate(th);
    const L0 = mode === 'fold' ? 118 : 150;
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate((i - 2.5) * .16 * side);
      const L = L0 - Math.abs(i - 2.5) * 9;
      c.fillStyle = i % 2 ? BRd : shade(BRd, .1);
      c.beginPath(); c.ellipse(0, L * .5, 24, L * .5, 0, 0, TAU); c.fill();
      c.restore();
    }
    c.restore();
  };
  const wmode = fly ? 'fly' : (P.anim === 'cheer' ? 'cheer' : 'fold');
  wing(-1, wmode); wing(1, wmode);
  // feet
  if (!fly) for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) fillEll(c, side * 34 + i * 14, -6, 8, 14, '#ff9f43', i * .35);
  // tail feathers
  fillEll(c, 0, -30, 34, 24, BRd);
  // body
  fillEll(c, 0, -140, 96, 118, BR);
  fillEll(c, 0, -128, 68, 96, CR);
  c.strokeStyle = shade(CR, -.12); c.lineWidth = 4; c.lineCap = 'round';
  for (let r = 0; r < 4; r++) for (let i = -2; i <= 2; i++) { const x = i * 22 + (r % 2) * 11, y = -150 + r * 28; c.beginPath(); c.arc(x, y, 11, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
  // head
  fillEll(c, 0, -244, 106, 84, BR);
  // ear tufts
  for (const side of [-1, 1]) {
    c.fillStyle = BRd; c.beginPath(); c.moveTo(side * 54, -300); c.quadraticCurveTo(side * 88, -352, side * 96, -318 + (F.br > .2 ? 14 : 0)); c.quadraticCurveTo(side * 86, -290, side * 74, -276); c.closePath(); c.fill();
  }
  // face discs
  for (const side of [-1, 1]) { fillEll(c, side * 50, -246, 56, 54, shade(CR, .35)); }
  // bowtie
  fillEll(c, -26, -172, 26, 16, '#e8505b', -.3); fillEll(c, 26, -172, 26, 16, '#e8505b', .3); fillEll(c, 0, -172, 10, 10, '#b73842');
  // face
  const faceO = {
    eyes: [{ x: -50, y: -250, rx: 30, ry: 32 }, { x: 50, y: -250, rx: 30, ry: 32 }], ink: '#231a14', iris: '#ffb627', sclera: '#fffdf2',
    brow: { col: BRd, gap: 8, len: 1.15, w: 11 }, noMouth: true,
    cheeks: [], cheekCol: '#ff9a7a',
  };
  drawFace(c, faceO, F, P);
  // beak (opens with speech)
  const open = clamp((F.open || 0) + (P.speech || 0) * .9);
  c.fillStyle = '#ff9a2e';
  c.beginPath(); c.moveTo(-16, -232); c.quadraticCurveTo(0, -246, 16, -232); c.quadraticCurveTo(10, -214 + 0, 0, -207); c.quadraticCurveTo(-10, -214, -16, -232); c.fill();
  if (open > .08) {
    c.fillStyle = '#7a2d1c'; c.beginPath(); c.moveTo(-12, -218); c.lineTo(12, -218); c.lineTo(0, -205 + open * 12); c.closePath(); c.fill();
    c.fillStyle = '#ff8a1e'; c.beginPath(); c.moveTo(-12, -216 + open * 4); c.quadraticCurveTo(0, -196 + open * 16, 12, -216 + open * 4); c.quadraticCurveTo(0, -204 + open * 8, -12, -216 + open * 4); c.fill();
  }
  fillEll(c, -92, -226, 12, 8, rgba('#ff8f7a', .5 * F.cheek)); fillEll(c, 92, -226, 12, 8, rgba('#ff8f7a', .5 * F.cheek));
  c.restore();
}

// ---------- Tuck the turtle (profile, facing +x) ----------
function drawTurtle(c, P) {
  const t = P.t, F = P.face, ph = P.phase * Math.PI * .9;
  const walking = P.anim === 'walk', swim = P.anim === 'swim';
  const SK = '#9ad18a', SKd = '#7fb872', SH1 = '#6e9e5e', SH2 = '#4d7a49', RIM = '#e8d79e';
  const bob = swim ? Math.sin(t * 1.6) * 6 : (walking ? Math.abs(Math.sin(ph)) * 5 : 0);
  const breathe = 1 + .012 * Math.sin(t * TAU / 3.4);
  c.save();
  c.translate(P.x + (P.jx || 0), P.y - (P.lift || 0));
  c.scale(P.flip * P.s, P.s);
  groundShadow(c, 170, 20, .3);
  c.translate(0, -bob);
  c.scale(1, breathe);
  const legSwing = walking ? Math.sin(ph) : (swim ? Math.sin(t * 2.6) * .6 : 0);
  const leg = (x, y, k, col) => { // k: phase sign
    const sw = legSwing * k * 16, lf = walking ? Math.max(0, Math.sin(ph + (k > 0 ? 0 : Math.PI))) * 9 : 0;
    fillEll(c, x + sw, y - lf, 31, 27, col);
    fillEll(c, x + sw + 6, y - lf + 14, 24, 10, shade(col, -.12));
  };
  // far legs (darker)
  leg(-34, -24, -1, SKd); leg(112, -24, 1, SKd);
  // tail
  c.fillStyle = SKd; c.beginPath(); c.moveTo(-142, -52); c.quadraticCurveTo(-182, -48, -176, -34); c.quadraticCurveTo(-160, -36, -138, -38); c.fill();
  // belly + shell
  fillEll(c, 0, -60, 146, 44, '#cfe8a5');
  c.save();
  c.beginPath(); c.moveTo(-152, -62);
  c.bezierCurveTo(-152, -190, 152, -190, 152, -62);
  c.quadraticCurveTo(0, -44, -152, -62); c.closePath();
  const sg = c.createLinearGradient(0, -178, 0, -60); sg.addColorStop(0, '#86b673'); sg.addColorStop(1, SH2);
  c.fillStyle = sg; c.fill(); c.clip();
  // scutes
  c.strokeStyle = 'rgba(46,82,50,.8)'; c.lineWidth = 5; c.lineJoin = 'round';
  const hexC = [0, -118];
  c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 6; const x = hexC[0] + Math.cos(a) * 46, y = hexC[1] + Math.sin(a) * 40; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke();
  [[-92, -108], [92, -108], [-150, -88], [150, -88], [-46, -62], [46, -62], [-130, -62], [130, -62]].forEach(([x, y]) => {
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 6; const px = x + Math.cos(a) * 38, py = y + Math.sin(a) * 34; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.stroke();
  });
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 12; c.beginPath(); c.arc(-30, -112, 96, Math.PI * 1.12, Math.PI * 1.42); c.stroke();
  c.restore();
  // shell rim
  c.strokeStyle = RIM; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); c.moveTo(-148, -60); c.quadraticCurveTo(0, -42, 148, -60); c.stroke();
  // moss tuft
  c.fillStyle = '#4aa35a'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(-30 + i * 9, -172 - Math.abs(i) * -3, 6, 16 - Math.abs(i) * 2, i * .25, 0, TAU); c.fill(); }
  // near legs
  leg(-78, -24, 1, SK); leg(78, -24, -1, SK);
  // neck + head (head sways)
  const hx = walking ? Math.sin(ph) * 4 : 0, hy = swim ? Math.sin(t * 1.6 + .5) * 3 : 0;
  tube(c, [110, -76], [140, -92], [168 + hx, -108 + hy], 38, 46, SK);
  fillEll(c, 176 + hx, -108 + hy, 62, 54, SK);
  fillEll(c, 196 + hx, -92 + hy, 36, 26, '#b9e2a8');
  fillEll(c, 150 + hx, -88 + hy, 14, 8, rgba('#ff8fa8', .5 * F.cheek));
  const faceO = {
    eyes: [{ x: 186 + hx, y: -122 + hy, rx: 15, ry: 19 }], ink: '#26301f', sclera: '#ffffff',
    brow: { col: '#4c6d3d', gap: 10, len: 1.1, w: 6 },
    mouth: { x: 206 + hx, y: -84 + hy, w: 15, lw: 4.5 }, mouthInk: '#3a4a2a', mouthIn: '#6b2a2a',
    cheeks: [{ x: 160 + hx, y: -92 + hy, rx: 14, ry: 9 }], cheekCol: '#ff8fa8',
  };
  // sleepy by default: lower lids
  const F2 = Object.assign({}, F); F2.eye = Math.min(F.eye, 1) * .78 + (F.eye > 1 ? (F.eye - 1) * .8 : 0);
  drawFace(c, faceO, F2, P);
  fillEll(c, 228 + hx, -104 + hy, 3.4, 2.6, '#4b6b3c');
  c.restore();
}

// ---------- Luma the little star ----------
function drawLuma(c, P) {
  const t = P.t, F = P.face;
  const b = clamp(P.bright === undefined ? .6 : P.bright);
  const flick = b < .5 ? .85 + .15 * Math.sin(t * 17 + Math.sin(t * 5) * 3) : 1;
  const bob = Math.sin(t * 2.1 + (P.seed || 0)) * (6 + b * 6);
  const main = mixRGB('#bdb08a', '#ffd84a', b), coreLight = mixRGB('#e4dabd', '#fff6c4', b);
  const mainCss = rgb2css(main), mainClear = rgb2css(main, 0), coreCss = rgb2css(coreLight);
  const R = 84, r = 46;
  c.save();
  c.translate(P.x, P.y - (P.lift || 0) - bob);
  c.scale(P.flip * P.s * 1.25, P.s * 1.25);
  c.rotate((P.rot || 0) + Math.sin(t * 1.3) * .05 + (P.anim === 'dance' ? Math.sin(t * 5) * .15 : 0));
  const m0 = c.getTransform();
  // halo
  glow(c, 0, 0, 160 + b * 240, '#ffe9a0', (.18 + .5 * b) * flick, 'screen');
  c.globalAlpha = flick;
  // body: rounded star = star path stroked with round joins
  starPath(c, 0, 0, R - 12, r - 6);
  c.lineJoin = 'round'; c.lineWidth = 26; c.strokeStyle = mainCss; c.stroke(); c.fillStyle = mainCss; c.fill();
  const g = c.createRadialGradient(-10, -14, 4, 0, 0, 80); g.addColorStop(0, coreCss); g.addColorStop(1, mainClear);
  c.fillStyle = g; starPath(c, 0, 0, R - 12, r - 6); c.fill();
  // tiny feet nubs
  fillEll(c, -26, R - 16, 15, 10, shade(main, -.14)); fillEll(c, 26, R - 16, 15, 10, shade(main, -.14));
  const faceO = {
    eyes: [{ x: -21, y: -4, rx: 12, ry: 15 }, { x: 21, y: -4, rx: 12, ry: 15 }], ink: '#3b2a4a', sclera: '#fff',
    brow: { col: '#a58a5a', gap: 8, len: .8, w: 4.5 }, mouth: { x: 0, y: 24, w: 10, lw: 4 },
    cheeks: [{ x: -36, y: 14, rx: 10, ry: 7 }, { x: 36, y: 14, rx: 10, ry: 7 }], cheekCol: '#ff8fa8',
  };
  drawFace(c, faceO, F, P);
  c.globalAlpha = 1;
  // orbiting sparkles
  const n = Math.round(3 + b * 7);
  for (let i = 0; i < n; i++) {
    const a = t * (.6 + (i % 3) * .2) + i * 2.39996, d = 110 + 40 * Math.sin(t * .9 + i * 1.7) + b * 40;
    const sx = Math.cos(a) * d, sy = Math.sin(a * 1.15) * d * .8, tw = .5 + .5 * Math.sin(t * 6 + i * 2.1);
    c.save(); c.translate(sx, sy); c.rotate(a); c.globalAlpha = (.25 + .75 * b) * tw;
    c.fillStyle = '#fff6c8'; starPath(c, 0, 0, 9 + 5 * tw, 2.6, 4, 0); c.fill(); c.restore();
  }
  c.restore();
  LIGHTS.push({ cx: m0.e, cy: m0.f, r: (300 + b * 560) * Math.hypot(m0.a, m0.b), col: '#ffe9a0', a: .1 + .6 * b });
}

const DRAW = {
  bibi: (c, P) => drawBunny(c, P, BUNNY_STYLES.bibi),
  mama: (c, P) => drawBunny(c, P, BUNNY_STYLES.mama),
  odo: drawOwl, tuck: drawTurtle, luma: drawLuma,
};
