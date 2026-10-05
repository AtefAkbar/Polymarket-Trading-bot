// ---------- scenes (part B): pond, hollow oak, bramble tunnel, berry hill, Luma's hollow, hilltop ----------

function cloudCover(c, st, moonX, moonY) { // drifting cloud that hides the moon; fx.cloud 0..1
  const k = st.fx.cloud || 0; if (k <= 0) return;
  c.save(); c.globalAlpha = k;
  const x = moonX + (1 - k) * -520;
  [[-160, 10, 1.7], [0, -20, 2.1], [170, 14, 1.8], [320, 30, 1.4]].forEach(([dx, dy, s]) => drawCloud(c, x + dx, moonY + dy, s, '#232652', 1));
  c.restore();
}

function stoneRow(c, xs, y, col) {
  xs.forEach((x, i) => {
    fillEll(c, x, y, 70, 22, shade(col, -.25)); fillEll(c, x, y - 8, 66, 20, col); fillEll(c, x - 14, y - 15, 36, 7, shade(col, .22));
    fillEll(c, x + 26, y - 12, 18, 5, '#4f9a5a');
  });
}

// ---- pond ----
SCENES.pond = () => {
  const WW = 3600, WATER_L = 780, WATER_R = 2900, WY = 905;
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, [[0, '#0a0c30'], [.5, '#1a2060'], [1, '#2f4a8a']]); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, 1, 23, 150, 560); drawMoon(c, 1450, 190, 82); } };
  const far = { p: .12, draw(c) { c.fillStyle = '#1a2c64'; hillPath(c, 680, 50, 2.1); c.fill(); } };
  const mid = { p: .3, draw(c) { c.fillStyle = '#16305a'; hillPath(c, 740, 36, 5.2); c.fill(); for (let x = -200; x < WW; x += 120) pine(c, x + Math.sin(x) * 25, hillY(740, 36, 5.2, x) + 6, 90 + (x * 7 % 60), '#10244a'); } };
  const near = { p: .6, draw(c) { c.fillStyle = '#1b4156'; hillPath(c, 800, 24, 1.2); c.fill(); for (let x = 0; x < WW * .8; x += 260) roundTree(c, x, hillY(800, 24, 1.2, x) + 10, 230 + (x * 3 % 80), '#2a2a48', '#1f5a52'); } };
  const water = {
    p: 1, draw(c, st) {
      const t = st.t;
      // banks
      c.fillStyle = vgrad(c, 800, 1080, [[0, '#2b6a5a'], [1, '#1c4a46']]); hillPath(c, 835, 14, .8, .003, .008, -400, WW + 400); c.fill();
      // water body
      c.save(); c.beginPath(); c.moveTo(WATER_L, 842); c.quadraticCurveTo((WATER_L + WATER_R) / 2, 818, WATER_R, 842); c.lineTo(WATER_R + 130, 1100); c.lineTo(WATER_L - 130, 1100); c.closePath(); c.clip();
      c.fillStyle = vgrad(c, 820, 1080, [[0, '#2b5aa0'], [.5, '#17407e'], [1, '#0e2a5a']]); c.fillRect(WATER_L - 200, 800, WATER_R - WATER_L + 400, 300);
      // moon reflection streak + star glints
      for (let i = 0; i < 16; i++) { const y = 850 + i * 14, w = 160 - i * 5 + Math.sin(t * 1.4 + i) * 22; fillEll(c, 1450 + Math.sin(t * .9 + i * .7) * 14, y, Math.max(8, w * .5), 3.2, rgba('#fff4c8', .42 - i * .02)); }
      const r = rng(41); for (let i = 0; i < 40; i++) { const x = WATER_L + r() * (WATER_R - WATER_L), y = 850 + r() * 200, tw = Math.max(0, Math.sin(t * (1 + r() * 2) + r() * 6)); c.globalAlpha = tw * .6; fillEll(c, x, y, 8, 2, '#fff'); } c.globalAlpha = 1;
      // ripples
      for (let i = 0; i < 6; i++) { const u = ((t * .18) + i / 6) % 1, x = WATER_L + 200 + (i * 397) % (WATER_R - WATER_L - 400), y = 905 + (i * 53) % 120; c.globalAlpha = (1 - u) * .4; strokeEll(c, x, y, 20 + u * 90, 5 + u * 20, '#cfe6ff', 3); } c.globalAlpha = 1;
      c.restore();
      // lily pads with flowers + frogs
      [[1060, 975], [1330, 1010], [1790, 990], [2120, 1030], [2440, 985], [1580, 1045], [2700, 1010]].forEach(([x, y], i) => {
        const bob = Math.sin(t * 1.2 + i) * 3;
        fillEll(c, x, y + bob, 66, 17, '#2f8a56'); fillEll(c, x - 6, y + bob - 3, 54, 12, '#42a86a');
        c.fillStyle = '#17407e'; c.beginPath(); c.moveTo(x, y + bob); c.lineTo(x + 66, y + bob - 6); c.lineTo(x + 66, y + bob + 6); c.fill();
        if (i % 2 === 0) { for (let k = 0; k < 5; k++) fillEll(c, x - 14 + (k - 2) * 8, y + bob - 12, 8, 14, '#ffb3d9', (k - 2) * .35); fillEll(c, x - 14, y + bob - 8, 6, 6, '#ffe27a'); }
      });
      // frog on a pad (throat puffs)
      const fx = 1790, fy = 984, puff = Math.max(0, Math.sin(t * 2.4)), fb = Math.sin(t * 1.2 + 2) * 3;
      fillEll(c, fx, fy + fb - 18, 34, 22, '#4fbf6a'); fillEll(c, fx + 18, fy + fb - 36, 24, 18, '#5fd07a'); fillEll(c, fx + 28, fy + fb - 28 + puff * 6, 14 + puff * 6, 10 + puff * 8, '#a8f0a8');
      fillEll(c, fx + 14, fy + fb - 48, 8, 8, '#fff'); fillEll(c, fx + 32, fy + fb - 48, 8, 8, '#fff'); fillEll(c, fx + 16, fy + fb - 48, 4, 4, '#222'); fillEll(c, fx + 34, fy + fb - 48, 4, 4, '#222');
      // stepping stones across (too far apart for a little bunny!)
      stoneRow(c, [905, 1210, 1515, 1820, 2125, 2430, 2735], 912, '#7d8aa0');
      // reeds + cattails on both banks
      [[WATER_L - 60, 1], [WATER_L + 30, 1], [WATER_R + 40, 1], [WATER_R + 140, 1], [1500, 1], [2300, 1]].forEach(([x], i) => {
        if (x > 1000 && x < 2800 && i < 4 === false) return;
        for (let k = 0; k < 5; k++) { const sx = x + k * 26, h = 170 + (k * 37 % 60), sw = Math.sin(t * 1.2 + sx * .02) * 8; c.strokeStyle = '#2f7a56'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, 880); c.quadraticCurveTo(sx + sw, 880 - h * .6, sx + sw * 1.5, 880 - h); c.stroke(); if (k % 2 === 0) { c.fillStyle = '#6a4228'; rrect(c, sx + sw * 1.4 - 8, 880 - h - 38, 16, 48, 8); c.fill(); } }
      });
      grassTufts(c, t, -300, WATER_L - 40, 880, 40, 40, '#1b5a50', 4, .8); grassTufts(c, t, WATER_R + 60, WW + 300, 880, 40, 40, '#1b5a50', 6, .8);
      fireflies(c, t, 26, 15, 0, WW, 560, 900, '#d8ff9a', 1, 1);
      mist(c, t, WATER_L - 100, WATER_R + 100, 870, 40, '#a8c8ff', .1, 4);
    }
  };
  const waterFront = {
    p: 1, draw(c, st) {
      // water covering the feet of anything standing in the pond
      c.save(); c.beginPath(); c.moveTo(WATER_L + 40, WY); c.lineTo(WATER_R - 40, WY); c.lineTo(WATER_R + 130, 1100); c.lineTo(WATER_L - 130, 1100); c.closePath(); c.clip();
      const g = vgrad(c, WY, 1080, [[0, 'rgba(60,110,190,.72)'], [1, 'rgba(14,42,90,.9)']]); c.fillStyle = g; c.fillRect(WATER_L - 200, WY, WATER_R - WATER_L + 400, 300);
      c.strokeStyle = 'rgba(200,230,255,.55)'; c.lineWidth = 3; c.beginPath(); for (let x = WATER_L; x <= WATER_R; x += 20) c.lineTo(x, WY + Math.sin(x * .03 + st.t * 2) * 3); c.stroke();
      c.restore();
      // wake ripples behind actors that sit in the water
      (st.fx.wake || []).forEach(w => { for (let i = 0; i < 3; i++) { const u = ((st.t * .7) + i / 3) % 1; c.globalAlpha = (1 - u) * .5; strokeEll(c, w.x, WY + 4, 120 + u * 110, 7 + u * 12, '#dff0ff', 3); } c.globalAlpha = 1; });
    }
  };
  const fg = { p: 1.35, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.4 + 400, 1090, 40, 110, '#10403c', 31, 1.4); } };
  return { W: WW, groundY: () => 880, back: [sky, far, mid, near, water], front: [waterFront, fg], tint: 'rgba(15,30,100,.12)' };
};

// ---- Great Hollow Oak ----
SCENES.oak = () => {
  const WW = 3000, tx = 1500;
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, [[0, '#080a28'], [.5, '#14205a'], [1, '#274078']]); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, 1 - (st.fx.cloud || 0) * .8, 29, 140, 560); drawMoon(c, 520, 200, 80, { halo: .4 * (1 - (st.fx.cloud || 0) * .9) }); cloudCover(c, st, 520, 200); } };
  const far = { p: .12, draw(c) { c.fillStyle = '#17285e'; hillPath(c, 700, 50, 3.1); c.fill(); } };
  const mid = { p: .3, draw(c) { c.fillStyle = '#122a52'; hillPath(c, 760, 36, 6.2); c.fill(); for (let x = -200; x < WW; x += 130) pine(c, x + Math.sin(x) * 22, hillY(760, 36, 6.2, x) + 8, 100 + (x * 5 % 60), '#0e2046'); } };
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t;
      c.fillStyle = vgrad(c, 790, 1080, [[0, '#2b6458'], [1, '#18423e']]); hillPath(c, 825, 14, .7, .003, .008, -400, WW + 400); c.fill();
      c.fillStyle = '#5a6e84'; c.beginPath(); c.moveTo(-400, 930); for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, 910 + 20 * Math.sin(x * .004 + 1)); for (let x = WW + 400; x >= -400; x -= 30) c.lineTo(x, 990 + 24 * Math.sin(x * .004 + 1)); c.closePath(); c.fill();
      // giant oak trunk
      const g = c.createLinearGradient(tx - 200, 0, tx + 200, 0); g.addColorStop(0, '#2e2244'); g.addColorStop(.5, '#4a3458'); g.addColorStop(1, '#2a1e3e');
      c.fillStyle = g; c.beginPath(); c.moveTo(tx - 330, 910); c.quadraticCurveTo(tx - 190, 840, tx - 175, 600); c.lineTo(tx - 160, -200); c.lineTo(tx + 160, -200); c.lineTo(tx + 185, 600); c.quadraticCurveTo(tx + 200, 840, tx + 340, 910); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(15,8,30,.4)'; c.lineWidth = 6; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(tx - 120 + i * 30, 880); c.bezierCurveTo(tx - 130 + i * 30, 600, tx - 100 + i * 30, 300, tx - 110 + i * 28, -100); c.stroke(); }
      // hollow (cozy round doorway) with warm light
      c.fillStyle = '#1b1226'; c.beginPath(); c.ellipse(tx - 20, 770, 78, 108, 0, 0, TAU); c.fill();
      c.fillStyle = vgrad(c, 680, 880, [[0, '#ffd88a'], [1, '#ff9f4a']]); c.beginPath(); c.ellipse(tx - 20, 782, 62, 92, 0, 0, TAU); c.fill();
      glow(c, tx - 20, 780, 280, '#ffc870', .5 + .06 * Math.sin(t * 5));
      c.fillStyle = '#6a4228'; c.fillRect(tx - 100, 868, 160, 14);
      // big branch to the right where Odo perches
      c.fillStyle = '#3e2c52'; c.beginPath(); c.moveTo(tx + 150, 560); c.quadraticCurveTo(tx + 420, 520, tx + 800, 470); c.lineTo(tx + 800, 520); c.quadraticCurveTo(tx + 420, 600, tx + 150, 660); c.closePath(); c.fill();
      c.fillStyle = '#2a1e3e'; c.beginPath(); c.moveTo(tx + 150, 640); c.quadraticCurveTo(tx + 420, 580, tx + 800, 512); c.lineTo(tx + 800, 520); c.quadraticCurveTo(tx + 420, 600, tx + 150, 662); c.closePath(); c.fill();
      // canopy
      const r = rng(77); for (let i = 0; i < 24; i++) { const x = tx - 700 + r() * 1400, y = -40 + r() * 260, k = 120 + r() * 140; fillEll(c, x, y, k, k * .72, i % 3 ? '#1b4a4a' : '#236058'); }
      for (let i = 0; i < 14; i++) { const x = tx - 700 + r() * 1400, y = -10 + r() * 240, k = 40 + r() * 50; fillEll(c, x - 30, y - 20, k, k * .5, '#2f7a68'); }
      // hanging glow-berries
      for (let i = 0; i < 9; i++) { const x = tx - 520 + i * 130, y = 200 + (i * 53 % 90), sw = Math.sin(t * 1.4 + i) * 6; c.strokeStyle = '#2a5a4a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 150); c.lineTo(x + sw, y); c.stroke(); glow(c, x + sw, y + 10, 40, '#bfff9a', .6); fillEll(c, x + sw, y + 10, 8, 10, '#e8ffa8'); }
      // mushrooms + roots
      [[tx - 420, 38, '#7ad0ff'], [tx + 420, 30, '#c59aff'], [260, 36, '#ff9ad0'], [2650, 40, '#7ad0ff']].forEach(([x, r, col], i) => mushroom(c, t, x, 905, r, shade(col, -.25), shade(col, .5), col, i * 2));
      grassTufts(c, t, -300, WW + 300, 850, 42, 36, '#14504a', 4, .8);
      fireflies(c, t, 20, 7, 0, WW, 500, 900, '#c8ff9a', 1, 1);
      mist(c, t, -200, WW + 200, 905, 80, '#a8c8ff', .1, 3);
    }
  };
  const fg = { p: 1.35, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.4 + 400, 1090, 40, 120, '#0d3836', 31, 1.4); } };
  return { W: WW, groundY: () => 890, back: [sky, far, mid, ground], front: [fg], tint: 'rgba(10,20,90,.14)', perch: { x: tx + 520, y: 505 } };
};

// ---- bramble tunnel ----
SCENES.brambles = () => {
  const WW = 3400;
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, [[0, '#070820'], [.6, '#1a1844'], [1, '#2a2a5c']]); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, .35, 31, 70, 300); } };
  const thicket = (p, col, seed, y0) => ({
    p, draw(c, st) {
      const r = rng(seed);
      for (let x = -200; x < WW * (p < 1 ? .85 : 1) + 400; x += 90) { const k = 120 + r() * 160; fillEll(c, x + r() * 60, y0 - r() * 220, k, k * .8, col); }
      c.fillRect(-300, y0, WW * 2, 600);
    }
  });
  const far = thicket(.25, '#14183a', 3, 700);
  const mid = thicket(.55, '#1a1c48', 9, 760);
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t;
      c.fillStyle = vgrad(c, 780, 1080, [[0, '#26335c'], [1, '#161c3c']]); hillPath(c, 830, 12, .2, .003, .008, -400, WW + 400); c.fill();
      c.fillStyle = '#4a5578'; c.beginPath(); c.moveTo(-400, 940); for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, 915 + 14 * Math.sin(x * .004)); for (let x = WW + 400; x >= -400; x -= 30) c.lineTo(x, 990 + 18 * Math.sin(x * .004)); c.closePath(); c.fill();
      // the great wall of tangles with three tunnel mouths
      const wallCol = '#1d1642', wallHi = '#2c2160';
      c.lineCap = 'round';
      const vine = (x0, y0, x1, y1, bend, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2 - Math.abs(bend), x1, y1); c.stroke();
        c.fillStyle = col; for (let i = 1; i < 8; i++) { const u = i / 8, px = lerp(x0, x1, u) + bend * 2 * u * (1 - u), py = lerp(y0, y1, u) - Math.abs(bend) * 2 * u * (1 - u); c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + (i % 2 ? 12 : -12), py - 14); c.lineTo(px + 5, py); c.fill(); } };
      c.fillStyle = wallCol; c.beginPath(); c.moveTo(500, 900); c.lineTo(500, 160); c.quadraticCurveTo(1700, 60, 2900, 160); c.lineTo(2900, 900); c.closePath(); c.fill();
      const r = rng(5); for (let i = 0; i < 90; i++) { const x = 480 + r() * 2440, y = 130 + r() * 740, k = 40 + r() * 70; fillEll(c, x, y, k, k * .7, i % 4 ? wallCol : wallHi); }
      // a thicket of thorny stems (cute-spooky, not scary) across the whole wall
      const rv = rng(33);
      for (let i = 0; i < 70; i++) { const x = 480 + rv() * 2440, y = 150 + rv() * 740, L = 120 + rv() * 240, a = (rv() - .5) * 2.2; vine(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L * .55, (rv() - .5) * 140, 6 + rv() * 7, i % 3 ? '#33266a' : '#43338a'); }
      [[1180, 'L'], [1700, 'C'], [2220, 'R']].forEach(([x, id]) => {
        c.fillStyle = '#05040f'; c.beginPath(); c.moveTo(x - 120, 900); c.lineTo(x - 120, 560); c.quadraticCurveTo(x, 360, x + 120, 560); c.lineTo(x + 120, 900); c.fill();
        if (id === 'R') { // the way out: a soft blue-white glow at the end of the tunnel
          c.save(); c.beginPath(); c.moveTo(x - 118, 900); c.lineTo(x - 118, 562); c.quadraticCurveTo(x, 366, x + 118, 562); c.lineTo(x + 118, 900); c.clip();
          const gg = c.createRadialGradient(x, 700, 6, x, 700, 190); gg.addColorStop(0, 'rgba(210,240,255,.95)'); gg.addColorStop(.35, 'rgba(150,210,255,.45)'); gg.addColorStop(1, 'rgba(120,180,255,0)');
          c.fillStyle = gg; c.fillRect(x - 130, 540, 260, 380); c.restore();
          glow(c, x, 700, 300, '#a8e0ff', .3 + .08 * Math.sin(t * 2));
        }
      });
      // thorny vines framing every tunnel
      [1180, 1700, 2220].forEach((x, i) => { vine(x - 150, 900, x - 40, 470, -60, 16, '#4a3a8c'); vine(x + 150, 900, x + 40, 470, 60, 16, '#4a3a8c'); vine(x - 150, 640, x + 150, 640, 0, 12, '#54449c'); });
      // glowing berries
      const rb = rng(12); for (let i = 0; i < 34; i++) { const x = 520 + rb() * 2380, y = 200 + rb() * 650, col = ['#9a7aff', '#ff7ab8', '#7ad8ff'][i % 3], tw = .5 + .5 * Math.sin(t * 2 + i); glow(c, x, y, 36, col, .5 * tw + .2); fillEll(c, x, y, 7, 7, col); }
      // entry/exit path guides
      fireflies(c, t, 14, 3, 0, WW, 520, 900, '#b8a8ff', 1, 1);
      mist(c, t, -200, WW + 200, 910, 70, '#8888ff', .1, 5);
    }
  };
  const fg = {
    p: 1.3, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.3 + 400, 1090, 42, 120, '#0e0d2a', 31, 1.2);
      const r = rng(61); for (let i = 0; i < 8; i++) { const x = r() * WW * 1.25; c.strokeStyle = '#161033'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, -40); c.quadraticCurveTo(x + 60 * (r() - .5), 100 + r() * 100, x + 20, 180 + r() * 120); c.stroke(); } }
  };
  return { W: WW, groundY: () => 900, back: [sky, far, mid, ground], front: [fg], tint: 'rgba(30,10,90,.2)' };
};

// ---- Berry Hill (the path climbs to the right) ----
SCENES.berry_hill = () => {
  const WW = 3600, GY = x => 920 - x * .105;
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, [[0, '#0b0a2c'], [.5, '#22206a'], [1, '#4a4a9a']]); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, 1, 11, 170, 620); drawMoon(c, 1500, 190, 76); cloudCover(c, st, 1500, 190);
    drawConstellation(c, st.t, 1180, 430, .85, { count: 29.999, gap: true, lines: .35 }); } };
  const far = { p: .1, draw(c) { c.fillStyle = '#2c2f78'; hillPath(c, 700, 50, 1.2); c.fill(); } };
  const mid = { p: .28, draw(c) { c.fillStyle = '#25396c'; hillPath(c, 740, 40, 3.2); c.fill(); for (let x = -200; x < WW; x += 150) pine(c, x + Math.sin(x) * 25, hillY(740, 40, 3.2, x) + 6, 80 + (x * 7 % 50), '#18284e'); } };
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t;
      c.fillStyle = vgrad(c, 300, 1080, [[0, '#3f8a68'], [1, '#1f5a50']]);
      c.beginPath(); c.moveTo(-400, 1400); for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, GY(x) - 50 + 8 * Math.sin(x * .01)); c.lineTo(WW + 400, 1400); c.closePath(); c.fill();
      // path
      c.fillStyle = '#8a8aa8'; c.beginPath(); c.moveTo(-400, GY(-400) + 20); for (let x = -400; x <= WW + 400; x += 30) c.lineTo(x, GY(x) - 22); for (let x = WW + 400; x >= -400; x -= 30) c.lineTo(x, GY(x) + 62); c.closePath(); c.fill();
      // berry bushes, flowers, rocks
      const r = rng(8);
      for (let i = 0; i < 24; i++) { const x = 100 + i * 150 + r() * 60, y = GY(x) - 70 - r() * 30; bush(c, x, y, 78 + r() * 24, '#2f7a58', '#4aa078');
        for (let k = 0; k < 9; k++) { const col = ['#e8505b', '#7a8aff', '#ff9ad0'][(i + k) % 3]; fillEll(c, x + (r() - .5) * 120, y - 20 - r() * 56, 9, 9, col); } }
      for (let i = 0; i < 30; i++) { const x = r() * WW, y = GY(x) + 20 + r() * 30; flower(c, t, x, y + 24, 9 + r() * 5, ['#fff', '#ffd1e6', '#ffe58a'][i % 3], '#f4a62a', '#2a6a4a', 36 + r() * 20); }
      [[620, 54], [1500, 60], [2400, 50]].forEach(([x, w]) => rock(c, x, GY(x) + 40, w, 54, '#6a7298'));
      fireflies(c, t, 20, 4, 0, WW, 380, 880, '#f6ff9a', 1, 1);
    }
  };
  const fg = { p: 1.3, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.3 + 400, 1095, 44, 120, '#134a44', 31, 1.3); } };
  return { W: WW, groundY: x => GY(x) + 20, back: [sky, far, mid, ground], front: [fg], tint: 'rgba(30,30,110,.12)' };
};

// ---- Luma's mossy hollow ----
SCENES.hollow = () => {
  const WW = 2400;
  const sky = { p: 0, draw(c, st) { c.fillStyle = vgrad(c, 0, 1080, [[0, '#070a24'], [.6, '#10305a'], [1, '#1c4a66']]); c.fillRect(-300, -300, 2520, 1700); drawStars(c, st.t, .5, 5, 100, 400); } };
  const trees = (p, col, seed, sp) => ({ p, draw(c, st) { const r = rng(seed); for (let x = -300; x < WW * (p < 1 ? .8 : 1) + 400; x += sp * (.8 + r() * .5)) { const h = 700 + r() * 400, w = 70 + r() * 40; c.fillStyle = col; rrect(c, x - w, -200, w * 2, 1200, 30); c.fill(); fillEll(c, x, -80 + r() * 60, w * 3, 150, col); } } });
  const far = trees(.15, '#0a2238', 4, 280), mid = trees(.4, '#0d2c44', 8, 360);
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t, lb = st.fx.lumaBright === undefined ? .2 : st.fx.lumaBright;
      c.fillStyle = vgrad(c, 780, 1080, [[0, '#2b6a5a'], [1, '#17463f']]); hillPath(c, 830, 16, .5, .003, .009, -400, WW + 400); c.fill();
      // mossy mound where Luma sits
      const mx = 1250; fillEll(c, mx, 900, 300, 80, '#3d8a58'); fillEll(c, mx, 880, 250, 62, '#4fa468'); fillEll(c, mx - 60, 866, 120, 20, '#66be7e');
      // giant mushrooms ring
      [[240, 78, '#7ad0ff'], [520, 54, '#c59aff'], [1090, 40, '#ff9ad0'], [1480, 62, '#7ad0ff'], [1760, 66, '#c59aff'], [2050, 84, '#7ad0ff'], [2290, 50, '#ff9ad0']].forEach(([x, r, col], i) => mushroom(c, t, x, 915, r, shade(col, -.3), shade(col, .55), col, i * 1.3));
      // fallen log
      c.fillStyle = '#4a3a58'; rrect(c, 1560, 790, 330, 120, 55); c.fill(); fillEll(c, 1560, 850, 40, 60, '#2a1f38'); fillEll(c, 1560, 850, 28, 46, '#7a5a78');
      grassTufts(c, t, -300, WW + 300, 860, 42, 38, '#14504a', 4, .8);
      fireflies(c, t, 22, 6, 0, WW, 500, 900, '#c8ff9a', 1, 1);
      sparkleDust(c, t, mx - 300, 640, 600, 260, 12, 3);
      mist(c, t, -200, WW + 200, 910, 70, '#a8c8ff', .1, 7);
    }
  };
  const fg = { p: 1.35, draw(c, st) { grassTufts(c, st.t, -400, WW * 1.4 + 400, 1092, 40, 120, '#0b302f', 31, 1.4); } };
  return { W: WW, groundY: () => 890, back: [sky, far, mid, ground], front: [fg], tint: 'rgba(10,30,100,.16)' };
};

// ---- the hilltop (no horizontal pan: world == screen) ----
SCENES.summit = () => {
  const WW = 1920;
  const CS = { x: 1010, y: 500, s: .9 }; // constellation placement; star #30 (missing ear) lands at GAP
  const GAP = { x: CS.x + BUNNY_STARS[29][0] * CS.s, y: CS.y + BUNNY_STARS[29][1] * CS.s };
  const sky = {
    p: 0, draw(c, st) {
      c.fillStyle = vgrad(c, 0, 1080, [[0, '#050522'], [.45, '#16165a'], [.8, '#38368a'], [1, '#5a58a8']]); c.fillRect(-300, -300, 2520, 1700);
      // milky way
      c.save(); c.translate(960, 300); c.rotate(-.35); const mg = c.createLinearGradient(0, -170, 0, 170); mg.addColorStop(0, 'rgba(200,190,255,0)'); mg.addColorStop(.5, 'rgba(200,190,255,.16)'); mg.addColorStop(1, 'rgba(200,190,255,0)'); c.fillStyle = mg; c.fillRect(-1500, -170, 3000, 340); c.restore();
      const tw = st.fx.twinkle || 0;
      drawStars(c, st.t, 1, 17, 220, 640); if (tw > 0) drawStars(c, st.t * 3, tw, 18, 160, 640);
      drawMoon(c, 330, 210, 84, { face: { open: st.speech.moon || 0, eyes: st.fx.moonEyes === undefined ? 0 : st.fx.moonEyes } });
      drawConstellation(c, st.t, CS.x, CS.y, CS.s, { count: 30, gap: !st.fx.complete, lines: st.fx.complete ? 1 : .5, glow: st.fx.complete ? 1.8 : 1 });
      if (st.fx.burst) { const b = st.fx.burst, u = (st.t - b.t0) / 2.2; if (u > 0 && u < 1) { c.save(); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, d = EASE.out(u) * (260 + (i % 4) * 70); c.globalAlpha = 1 - u; c.fillStyle = '#fff1a8'; starPath(c, GAP.x + Math.cos(a) * d, GAP.y + Math.sin(a) * d, 12 * (1 - u * .6) + 3, 3, 4, a); c.fill(); } glow(c, GAP.x, GAP.y, 420 * (1 - u * .3), '#ffe9a0', .7 * (1 - u)); c.restore(); } }
    }
  };
  const far = { p: .1, draw(c) { c.fillStyle = '#2b3170'; hillPath(c, 800, 40, 2.5, .0016, .0043, -400, 2400); c.fill(); } };
  const ground = {
    p: 1, draw(c, st) {
      const t = st.t;
      c.fillStyle = vgrad(c, 760, 1080, [[0, '#3a8a6a'], [1, '#1f5a50']]); c.beginPath(); c.moveTo(-200, 1200); c.lineTo(-200, 930); c.quadraticCurveTo(960, 740, 2120, 930); c.lineTo(2120, 1200); c.fill();
      c.fillStyle = '#4aa07a'; c.beginPath(); c.ellipse(960, 930, 900, 55, 0, Math.PI, TAU); c.fill();
      [[100, 220], [190, 160], [1760, 190], [1840, 140]].forEach(([x, h]) => pine(c, x, 940 - (Math.abs(x - 960) > 800 ? 0 : 0), h, '#14264a'));
      for (let i = 0; i < 16; i++) { const x = 140 + i * 110 + (i % 3) * 20, y = 905 + (i % 4) * 14; flower(c, t, x, y, 8, ['#fff', '#ffd1e6', '#ffe58a'][i % 3], '#f4a62a', '#2a6a4a', 30); }
      grassTufts(c, t, -100, 2000, 910, 44, 36, '#1f6a54', 4, .8);
      fireflies(c, t, 16, 4, 0, 1920, 500, 900, '#f6ff9a', 1, 1);
    }
  };
  const fg = { p: 1.2, draw(c, st) { grassTufts(c, st.t, -200, 2200, 1096, 40, 110, '#134a44', 31, 1.2); } };
  const sc = { W: WW, groundY: () => 900, back: [sky, far, ground], front: [fg], tint: 'rgba(30,30,110,.1)', gap: GAP };
  return sc;
};
