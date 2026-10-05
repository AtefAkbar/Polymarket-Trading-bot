// Finds moments where a character that is part of the shot is off-screen (or nearly) for a while.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.resolve('engine/index.html'));
  await page.evaluate(async tl => { await window.ready; window.TL = tl; }, TL);
  const step = 12; // every 0.5s
  const res = await page.evaluate((step) => {
    const out = [];
    for (let f = 0; f < TL.frames; f += step) { renderFrame(f); out.push({ t: f / TL.fps, v: window.__vis }); }
    return out;
  }, step);
  // per beat, per actor: runs of time (>=1.2s) where the actor's centre is outside the safe frame
  for (const b of TL.beats) {
    const names = Object.keys(b.actors).filter(n => n !== 'blanket');
    const issues = [];
    for (const n of names) {
      let start = null;
      const flush = (t) => { if (start !== null && t - start >= 1.2) issues.push(`${n} off-screen ${start.toFixed(1)}-${t.toFixed(1)}s`); start = null; };
      for (const r of res) {
        if (r.t < b.t0 || r.t >= b.t1) continue;
        const a = r.v.find(q => q.name === n);
        const hidden = !a || a.sx < -40 || a.sx > 1960 || a.sy < -100 || a.sy > 1300;
        if (hidden && start === null) start = r.t; if (!hidden) flush(r.t);
      }
      flush(b.t1);
    }
    if (issues.length) console.log(b.id, b.scene, ':', issues.join(' | '));
  }
  console.log('scan done');
  await browser.close();
})();
