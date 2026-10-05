// ---------- scenes (part A): Clover Hill (dusk / night / dawn), bedroom, Whispering Woods ----------
// A scene = { W: world width, groundY(x), back: [{p, draw(c, st)}], front: [{p, draw(c, st)}], ambient: css colour multiply, ... }
// st = { t (global secs), lt (beat-local secs), fx (beat fx object), cam }

const SCENES = {};

const PAL = {
  dusk: {
    sky: [[0, '#2b2468'], [.38, '#5a3b8e'], [.66, '#c9608f'], [.86, '#ff9f7a'], [1, '#ffd58c']],
    far: '#8d5a9c', mid: '#6a4e92', near: '#3f6d6e', g1: '#58915c', g2: '#3f7549', tree: '#2f4a6a', trunk: '#5a3b3b', leaf: '#3b7a55',
    stars: .35, glowY: 700, glowCol: '#ffb27a', cloud: '#ff9fa0', house: 1, tint: 'rgba(255,150,100,.06)', fgGrass: '#2f6a45',
  },
  night: {
    sky: [[0, '#0b0a2a'], [.45, '#1b1a52'], [.8, '#33317c'], [1, '#4d4d9c']],
    far: '#2c3170', mid: '#25396c', near: '#1f4a60', g1: '#2d6a5c', g2: '#1f4e4c', tree: '#14264a', trunk: '#2d2a45', leaf: '#245f55',
    stars: 1, glowY: 0, cloud: '#3b3a7c', house: 1, tint: 'rgba(30,30,110,.18)', fgGrass: '#16423e',
  },
  dawn: {
    sky: [[0, '#4a4a98'], [.4, '#9a7ac0'], [.7, '#ffb0a0'], [.9, '#ffd9a0'], [1, '#fff0c0']],
    far: '#9a80b8', mid: '#7e8ab0', near: '#5a9a88', g1: '#7ab070', g2: '#559a5e', tree: '#4a6a8a', trunk: '#6a4a40', leaf: '#4a9a68',
    stars: .12, glowY: 700, glowCol: '#ffd9a0', cloud: '#ffd0c0', house: 0, tint: 'rgba(255,200,150,.05)', fgGrass: '#3f8a58',
  },
};

// ---- Clover Hill ----
function makeHill(palName, o = {}) {
  const P = PAL[palName];
  const WW = o.W || 3000;
  const gy = () => 880;
  const sky = {
    p: 0, draw(c, st) {
      c.fillStyle = vgrad(c, 0, 1080, P.sky); c.fillRect(-300, -300, 2520, 1700);
      if (P.glowY) glow(c, 960, P.glowY, 1300, P.glowCol, .55);
      const starsOn = (o.starsFn ? o.starsFn(st) : P.stars);
      drawStars(c, st.t, starsOn, 11, 160, 600);
      if (palName === 'night' || o.moon) { drawMoon(c, o.moonX || 1560, o.moonY || 210, 78, { face: o.moonFace ? o.moonFace(st) : { open: 0, eyes: 0 } }); }
      // soft drifting clouds
      [[200, 190, 1.2, .55], [900, 120, 1.5, .45], [1500, 330, 1, .4], [450, 380, .9, .35]].forEach(([x, y, s, a], i) => drawCloud(c, ((x + st.t * (5 + i * 2)) % 2600) - 300, y, s, P.cloud, a * (palName === 'night' ? .45 : .6)));
      if (o.constel) drawConstellation(c, st.t, o.constel.x, o.constel.y, o.constel.s, o.constel.fn ? o.constel.fn(st) : { count: 30, gap: true, lines: .6 });
      (st.fx.meteors || []).forEach(m => drawMeteor(c, st.t, m));
    }
  };
  const far = {
    p: .08, draw(c) {
      c.fillStyle = P.far; hillPath(c, 650, 55, 1.3); c.fill();
      c.fillStyle = P.far; hillPath(c, 620, 40, 4.1); c.globalAlpha = .6; c.fill(); c.globalAlpha = 1;
    }
  };
  const mid = {
    p: .22, draw(c, st) {
      c.fillStyle = P.mid; hillPath(c, 715, 42, 2.2); c.fill();
      for (let x = -200; x < WW + 300; x += 130) { const y = hillY(715, 42, 2.2, x); pine(c, x + Math.sin(x) * 30, y + 6, 70 + (x * 7 % 50), P.tree); }
      // tiny cottages on the far hill with warm windows
      [[420, 40], [1250, 36], [2180, 44]].forEach(([x, k]) => {
        const y = hillY(715, 42, 2.2, x) + 10;
        c.fillStyle = P.tree; rrect(c, x - k, y - k * .8, k * 2, k * .8, 4); c.fill();
        c.beginPath(); c.moveTo(x - k * 1.2, y - k * .78); c.lineTo(x, y - k * 1.5); c.lineTo(x + k * 1.2, y - k * .78); c.fill();
        if (P.house) { fillEll(c, x, y - k * .38, k * .22, k * .28, '#ffd27a'); glow(c, x, y - k * .38, 70, '#ffc866', .5); }
      });
    }
  };
  const near = {
    p: .5, draw(c, st) {
      c.fillStyle = P.near; hillPath(c, 790, 30, 5.3); c.fill();
      for (let x = -100; x < WW * .75 + 300; x += 210) {
        const y = hillY(790, 30, 5.3, x) + 8;
        roundTree(c, x + Math.sin(x * 3) * 40, y, 200 + (x * 13 % 90), P.trunk, P.leaf);
      }
    }
  };
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t;
      // grass field
      const g = vgrad(c, 770, 1080, [[0, P.g1], [1, P.g2]]);
      c.fillStyle = g; hillPath(c, 800, 14, .6, .003, .008, -400, WW + 400); c.fill();
      // dirt path that winds along the field
      c.fillStyle = palName === 'dusk' ? '#c9a46e' : (palName === 'night' ? '#6f7a8c' : '#d2b27a');
      c.beginPath(); c.moveTo(-400, 930);
      for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, 905 + 22 * Math.sin(x * .0042 + .7) - 0);
      for (let x = WW + 400; x >= -400; x -= 30) c.lineTo(x, 975 + 26 * Math.sin(x * .0042 + .7));
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.07)'; for (let x = -300; x < WW + 300; x += 90) fillEll(c, x, 940 + 22 * Math.sin(x * .0042 + .7), 30, 6, 'rgba(255,255,255,.07)');
      // flowers + clover
      const r = rng(21);
      for (let i = 0; i < 46; i++) {
        const x = r() * WW, y = 830 + r() * 40, k = r();
        if (k < .5) clover(c, x, y + 20, 10 + r() * 7, shade(P.g1, -.25));
        else flower(c, t, x, y + 28, 9 + r() * 6, ['#ffffff', '#ffd1e6', '#ffe58a', '#d6c4ff'][i % 4], '#f4a62a', shade(P.g2, -.1), 38 + r() * 24);
      }
      grassTufts(c, t, -300, WW + 300, 835, 44, 34, shade(P.g1, -.2), 5, .7);
      // Bibi's burrow home (left)
      if (o.house !== false) {
        const hx = o.houseX || 430;
        // mound
        const mg = c.createLinearGradient(0, 520, 0, 860); mg.addColorStop(0, shade(P.g1, .12)); mg.addColorStop(1, P.g2);
        c.fillStyle = mg; c.beginPath(); c.ellipse(hx, 840, 360, 270, 0, Math.PI, TAU); c.fill();
        grassTufts(c, t, hx - 300, hx + 300, 640, 40, 26, shade(P.g1, .08), 9, .5);
        // chimney with a puff of smoke
        c.fillStyle = '#7a5a4a'; rrect(c, hx + 150, 560, 46, 80, 6); c.fill();
        for (let i = 0; i < 4; i++) { const u = ((t * .25) + i * .25) % 1; c.globalAlpha = (1 - u) * .45; fillEll(c, hx + 172 + Math.sin(u * 6 + i) * 14, 548 - u * 150, 18 + u * 26, 15 + u * 22, '#fff'); } c.globalAlpha = 1;
        // round door
        c.fillStyle = '#7a4a2e'; c.beginPath(); c.ellipse(hx, 840, 82, 120, 0, Math.PI, TAU); c.fill(); c.fillRect(hx - 82, 838, 164, 6);
        c.fillStyle = '#a0643a'; c.beginPath(); c.ellipse(hx, 840, 64, 100, 0, Math.PI, TAU); c.fill();
        c.strokeStyle = '#7a4a2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx, 740); c.lineTo(hx, 840); c.stroke();
        fillEll(c, hx + 30, 800, 8, 8, '#ffd45a');
        // doorstep
        fillEll(c, hx, 850, 120, 20, '#c9b79a'); fillEll(c, hx, 846, 100, 14, '#e2d3b8');
        // round windows w/ warm light
        [[hx - 200, 710], [hx + 215, 735]].forEach(([wx, wy], i) => {
          const wglow = P.house ? 1 : 0.2;
          fillEll(c, wx, wy, 52, 52, '#7a4a2e'); fillEll(c, wx, wy, 42, 42, mix('#ffdf8a', '#ffb347', .25 + .2 * Math.sin(t * 3 + i)));
          glow(c, wx, wy, 150, '#ffcf70', .55 * wglow);
          c.strokeStyle = '#7a4a2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(wx - 42, wy); c.lineTo(wx + 42, wy); c.moveTo(wx, wy - 42); c.lineTo(wx, wy + 42); c.stroke();
          fillEll(c, wx - 50, wy + 58, 30, 14, shade(P.g1, .1)); [-1, 0, 1].forEach(k => flower(c, t, wx + k * 24 - 4, wy + 66, 7, ['#ffb3d1', '#fff', '#ffd45a'][k + 1], '#f4a62a', '#3c8a55', 20));
        });
        // porch lantern by the door
        c.strokeStyle = '#5a3d25'; c.lineWidth = 4; c.beginPath(); c.moveTo(hx + 108, 660); c.lineTo(hx + 108, 700); c.stroke();
        const lg = c.createLinearGradient(0, 700, 0, 760); lg.addColorStop(0, '#fff2b0'); lg.addColorStop(1, '#ffbf45');
        c.fillStyle = lg; rrect(c, hx + 90, 700, 36, 54, 12); c.fill(); c.fillStyle = '#5a3d25'; rrect(c, hx + 86, 694, 44, 9, 4); c.fill(); rrect(c, hx + 86, 750, 44, 9, 4); c.fill();
        glow(c, hx + 108, 728, 260, '#ffd27a', P.house ? .75 : .3);
        // picket fence
        c.fillStyle = '#f2e6d0';
        for (let x = hx + 260; x < hx + 640; x += 36) { rrect(c, x, 790, 20, 70, 6); c.fill(); }
        c.fillRect(hx + 250, 806, 400, 8); c.fillRect(hx + 250, 836, 400, 8);
        // mailbox
        c.fillStyle = '#7a4a2e'; c.fillRect(hx - 360, 800, 10, 70); c.fillStyle = '#e05a4a'; rrect(c, hx - 392, 770, 74, 40, 16); c.fill();
      }
      // right-side signpost to Whispering Woods
      if (o.sign !== false) {
        const sx = WW - 380;
        c.fillStyle = '#6a4a30'; c.fillRect(sx, 790, 14, 100);
        c.fillStyle = '#9a6a40'; rrect(c, sx - 88, 770, 190, 50, 8); c.fill();
        c.fillStyle = '#f2e6d0'; c.font = '600 22px Fredoka'; c.textAlign = 'center'; c.fillText('Whispering Woods', sx + 7, 803); c.textAlign = 'left';
        c.fillStyle = '#9a6a40'; c.beginPath(); c.moveTo(sx + 102, 770); c.lineTo(sx + 142, 795); c.lineTo(sx + 102, 820); c.fill();
      }
      fireflies(c, t, 22, 5, 0, WW, 640, 900, '#f6ff9a', 1, palName === 'night' ? 1 : (palName === 'dusk' ? .6 : .1));
    }
  };
  const fg = {
    p: 1.35, draw(c, st) {
      grassTufts(c, st.t, -400, WW * 1.4 + 400, 1090, 38, 120, P.fgGrass, 31, 1.4);
      const r = rng(88);
      for (let i = 0; i < 9; i++) flower(c, st.t, r() * WW * 1.35, 1100, 14 + r() * 6, ['#ffd1e6', '#ffffff', '#ffe58a'][i % 3], '#f4a62a', P.fgGrass, 90 + r() * 70);
    }
  };
  return { W: WW, groundY: gy, back: [sky, far, mid, near, ground], front: [fg], tint: P.tint, dark: o.dark || 0 };
}
SCENES.hill_dusk = () => makeHill('dusk', { constel: { x: 1330, y: 500, s: .86, fn: st => ({ count: st.fx.starCount === undefined ? 0 : st.fx.starCount, gap: true, lines: st.fx.lines === undefined ? 0 : st.fx.lines, pulse: st.fx.gapPulse || 0 }) }, starsFn: st => st.fx.starAlpha === undefined ? .3 : st.fx.starAlpha, W: 2200, sign: false });
SCENES.hill_night = () => makeHill('night', { W: 3400, moon: true, constel: { x: 1400, y: 430, s: .8, fn: st => ({ count: st.fx.complete ? 30 : 29.999, gap: !st.fx.complete, lines: .5, glow: 1 }) } });
SCENES.hill_home = () => makeHill('night', { W: 2400, houseX: 1830, sign: false, moon: true, constel: { x: 700, y: 420, s: .8, fn: st => ({ count: 30, gap: false, lines: .5 }) } });

// ---- Bibi's bedroom ----
SCENES.bedroom = () => {
  const W0 = 1920;
  const room = {
    p: 1, draw(c, st) {
      const t = st.t;
      // wall
      c.fillStyle = vgrad(c, 0, 800, [[0, '#6a4f9a'], [1, '#8a68b4']]); c.fillRect(-200, -200, 2320, 1100);
      // star wallpaper
      c.fillStyle = 'rgba(255,230,160,.12)';
      for (let y = 40; y < 800; y += 120) for (let x = (y / 120 % 2 ? 60 : 0); x < 1920; x += 120) { starPath(c, x + 30, y + 40, 15, 6, 5); c.fill(); }
      // wainscot + floor
      c.fillStyle = '#a07aca'; c.fillRect(-200, 640, 2320, 180);
      c.fillStyle = '#c8a46a'; c.fillRect(-200, 820, 2320, 400);
      c.strokeStyle = 'rgba(90,60,30,.25)'; c.lineWidth = 3; for (let x = -200; x < 2200; x += 160) { c.beginPath(); c.moveTo(x, 820); c.lineTo(x - 90, 1100); c.stroke(); }
      c.fillStyle = '#7a5a8e'; c.fillRect(-200, 812, 2320, 12);
      // rug
      fillEll(c, 900, 960, 520, 90, '#e8708a'); fillEll(c, 900, 960, 440, 70, '#ffa0b4'); fillEll(c, 900, 960, 340, 52, '#e8708a');
      // round window with live night sky
      const wx = 520, wy = 380, wr = 230;
      c.save(); c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.clip();
      c.fillStyle = vgrad(c, wy - wr, wy + wr, [[0, '#0d0c34'], [.6, '#232266'], [1, '#43439a']]); c.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
      c.save(); c.translate(wx - wr, wy - wr); c.scale(.5, .5);
      drawStars(c, t, 1, 4, 90, 900);
      drawConstellation(c, t, 560, 470, .95, { count: st.fx.complete ? 30 : 29.999, gap: !st.fx.complete, lines: .55, big: 1.2 });
      (st.fx.meteors || []).forEach(m => drawMeteor(c, t, m));
      c.restore();
      // hills in the window
      c.fillStyle = '#1c2b66'; hillPath(c, wy + 150, 18, 3, .01, .02, wx - wr, wx + wr); c.fill();
      c.restore();
      // window frame
      c.strokeStyle = '#f2e6d0'; c.lineWidth = 22; c.beginPath(); c.arc(wx, wy, wr + 6, 0, TAU); c.stroke();
      c.lineWidth = 12; c.beginPath(); c.moveTo(wx - wr, wy); c.lineTo(wx + wr, wy); c.moveTo(wx, wy - wr); c.lineTo(wx, wy + wr); c.stroke();
      fillEll(c, wx, wy + wr + 26, 270, 22, '#f2e6d0');
      // curtains
      c.fillStyle = '#e8708a'; c.beginPath(); c.moveTo(wx - 340, 80); c.quadraticCurveTo(wx - 200, 300, wx - 300, 700); c.lineTo(wx - 360, 700); c.lineTo(wx - 360, 80); c.fill();
      c.beginPath(); c.moveTo(wx + 340, 80); c.quadraticCurveTo(wx + 200, 300, wx + 300, 700); c.lineTo(wx + 360, 700); c.lineTo(wx + 360, 80); c.fill();
      c.fillStyle = '#c85478'; c.fillRect(wx - 380, 70, 760, 14);
      // bookshelf
      c.fillStyle = '#8a5a3a'; rrect(c, 1280, 250, 260, 470, 10); c.fill(); c.fillStyle = '#6a4228'; [370, 490, 610].forEach(y => c.fillRect(1290, y, 240, 14));
      const bc = ['#e05a6a', '#ffcf5a', '#4cb0a8', '#8a6ad0', '#ff9a5a', '#5a8ad0'];
      [[260, 372], [380, 492], [500, 612]].forEach(([y0, y1], row) => { let x = 1300; for (let i = 0; i < 6; i++) { const w = 22 + (i * 7 + row * 5) % 12, h = 90 + (i * 13 + row * 17) % 22; c.fillStyle = bc[(i + row * 2) % 6]; rrect(c, x, y1 - h, w, h, 3); c.fill(); x += w + 6; } });
      // teddy on shelf (a friendly stuffed star)
      starPath(c, 1480, 330, 38, 18); c.fillStyle = '#ffd45a'; c.fill();
      // door (right) with warm hall light
      c.fillStyle = '#7a4a2e'; rrect(c, 1640, 330, 220, 490, 16); c.fill(); c.fillStyle = '#a0643a'; rrect(c, 1658, 348, 184, 460, 12); c.fill();
      fillEll(c, 1820, 590, 10, 10, '#ffd45a');
      // bed (right of window, centered ~ 1000)
      c.fillStyle = '#8a5a3a'; rrect(c, 760, 560, 560, 90, 16); c.fill(); rrect(c, 740, 430, 60, 260, 14); c.fill(); rrect(c, 1280, 470, 60, 220, 14); c.fill();
      c.fillStyle = '#f4ecff'; rrect(c, 790, 520, 480, 100, 30); c.fill(); // mattress
      // pillow
      fillEll(c, 880, 530, 90, 34, '#fff'); fillEll(c, 880, 535, 78, 22, '#f0e6ff');
      // bedside lamp
      c.fillStyle = '#8a5a3a'; rrect(c, 1360, 640, 150, 130, 10); c.fill(); fillEll(c, 1435, 640, 75, 12, '#a0703c');
      c.fillStyle = '#6a4228'; c.fillRect(1428, 560, 14, 82); const lamp = st.fx.lamp === undefined ? 1 : st.fx.lamp;
      c.fillStyle = mix('#c9a98a', '#ffe9a0', lamp); c.beginPath(); c.moveTo(1390, 565); c.lineTo(1480, 565); c.lineTo(1500, 500); c.lineTo(1370, 500); c.closePath(); c.fill();
      glow(c, 1435, 540, 480, '#ffcf80', .55 * lamp);
    }
  };
  return { W: W0, groundY: () => 840, back: [room], front: [], tint: 'rgba(90,40,120,.05)' };
};
// The quilt is a pseudo-actor so it can sit in front of Bibi (z 1) yet behind Mama (z 2)
DRAW.blanket = (c, P) => {
  const br = Math.sin(P.t * 1.3) * 3;
  c.fillStyle = '#4cb0a8'; c.beginPath(); c.moveTo(770, 640 + br); c.quadraticCurveTo(900, 520 + br, 1020, 560 + br); c.quadraticCurveTo(1200, 540 + br, 1320, 620); c.lineTo(1320, 700); c.lineTo(770, 700); c.closePath(); c.fill();
  c.fillStyle = '#ffd45a'; for (let x = 820; x < 1300; x += 90) { starPath(c, x, 650 + (x % 3) * 8, 14, 6); c.fill(); }
  c.fillStyle = '#6ac8c0'; c.beginPath(); c.moveTo(770, 640 + br); c.quadraticCurveTo(900, 520 + br, 1020, 560 + br); c.quadraticCurveTo(1100, 556 + br, 1180, 570); c.lineTo(1180, 585); c.quadraticCurveTo(1050, 580 + br, 1010, 580 + br); c.quadraticCurveTo(900, 545 + br, 770, 660); c.fill();
};

// ---- Whispering Woods ----
function woodsBase(o = {}) {
  const WW = o.W || 3200;
  const bgc = o.bg || [[0, '#0a1230'], [.55, '#123a48'], [1, '#1c5a58']];
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, bgc); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, o.stars === undefined ? .5 : o.stars, 19, 90, 400); if (o.moon) drawMoon(c, o.moon.x, o.moon.y, 70, { halo: o.moon.halo === undefined ? .35 : o.moon.halo }); } };
  const tr = (p, col, seed, spacing, hMin, hMax, w) => ({
    p, draw(c, st) {
      const r = rng(seed);
      for (let x = -300; x < WW * (p < 1 ? .7 : 1) + 500; x += spacing * (.8 + r() * .5)) {
        const h = hMin + r() * (hMax - hMin), tw = w * (.8 + r() * .5);
        c.fillStyle = col; c.beginPath(); c.moveTo(x - tw, 1200); c.quadraticCurveTo(x - tw * .9, 800, x - tw * .55, 100 - h); c.lineTo(x + tw * .55, 100 - h); c.quadraticCurveTo(x + tw * .9, 800, x + tw, 1200); c.fill();
        // canopy blobs on top
        for (let k = 0; k < 4; k++) fillEll(c, x + (k - 1.5) * tw * 1.3, 160 - h * .7 + (k % 2) * 30, tw * 1.6, tw * 1.1, col);
      }
    }
  });
  return { WW, sky, tr };
}
SCENES.woods = () => {
  const { WW, sky, tr } = woodsBase({ W: 3000, moon: { x: 1450, y: 190 }, stars: .7 });
  const far = tr(.15, '#0c2236', 3, 260, 500, 700, 70);
  const mid = tr(.4, '#0f2e40', 8, 320, 520, 760, 95);
  const gnd = {
    p: 1, draw(c, st) {
      const t = st.t;
      c.fillStyle = vgrad(c, 760, 1080, [[0, '#1d5a52'], [1, '#143c3c']]); hillPath(c, 800, 16, .4, .003, .009, -400, WW + 400); c.fill();
      c.fillStyle = '#5a6e82'; c.beginPath(); c.moveTo(-400, 925); for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, 905 + 20 * Math.sin(x * .004)); for (let x = WW + 400; x >= -400; x -= 30) c.lineTo(x, 985 + 24 * Math.sin(x * .004)); c.closePath(); c.fill();
      // big trunks standing close to the path
      const trunks = [[300, 130], [1150, 150], [2050, 140], [2750, 120]];
      trunks.forEach(([x, w]) => { c.fillStyle = '#2a2740'; rrect(c, x - w / 2, -400, w, 1280, 30); c.fill(); c.fillStyle = 'rgba(255,255,255,.05)'; rrect(c, x - w / 2 + 10, -400, 22, 1280, 10); c.fill();
        for (let k = 0; k < 5; k++) fillEll(c, x + (k - 2) * 60, -40 + (k % 2) * 40, 130, 90, '#143a3e'); });
      // glowing mushrooms
      [[560, 40, '#7ad0ff'], [900, 34, '#c59aff'], [1620, 46, '#7ad0ff'], [2400, 38, '#ff9ad0'], [2900, 42, '#7ad0ff']].forEach(([x, r, col], i) => mushroom(c, t, x, 900, r, shade(col, -.25), shade(col, .5), col, i * 1.7));
      grassTufts(c, t, -300, WW + 300, 840, 42, 36, '#14504a', 4, .8);
      // wooden sign
      c.fillStyle = '#6a4a30'; c.fillRect(150, 770, 16, 120); c.fillStyle = '#8a5a3a'; rrect(c, 40, 740, 230, 70, 10); c.fill();
      c.fillStyle = '#e8dcc0'; c.font = '600 26px Fredoka'; c.textAlign = 'center'; c.fillText('Whispering', 155, 770); c.fillText('Woods', 155, 800); c.textAlign = 'left';
      // the "scary shadow" (it is Bibi's own shadow)
      if (st.fx.shadow) {
        const s = st.fx.shadow; // {x, y, k (size), a}
        c.save(); c.globalAlpha = s.a; c.translate(s.x, s.y); c.scale(s.k, s.k); c.fillStyle = '#05070f';
        c.beginPath(); c.ellipse(0, -230, 106, 90, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -90, 84, 100, 0, 0, TAU); c.fill();
        tube(c, [-44, -304], [-60, -400], [-70, -470], 33, 26, '#05070f'); tube(c, [44, -304], [70, -400], [90, -470], 33, 26, '#05070f');
        c.restore();
      }
      fireflies(c, t, 18, 9, 0, WW, 600, 900, '#c8ff9a', 1, 1);
      mist(c, t, -200, WW + 200, 900, 90, '#a8c8ff', .12, 2);
    }
  };
  const fg = {
    p: 1.35, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.4 + 400, 1090, 40, 130, '#0d3836', 31, 1.4); const r = rng(5); for (let i = 0; i < 6; i++) { const x = r() * WW * 1.3; c.strokeStyle = '#0d3836'; c.lineWidth = 10; c.beginPath(); c.moveTo(x, 1100); c.quadraticCurveTo(x + 30, 960, x + 90, 940); c.stroke(); } }
  };
  return { W: WW, groundY: () => 880, back: [sky, far, mid, gnd], front: [fg], tint: 'rgba(10,30,90,.16)' };
};
