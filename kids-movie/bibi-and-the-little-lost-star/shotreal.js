// usage: node shotreal.js outdir t1,t2,t3...   -> renders the real timeline at the given seconds
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [outdir, times] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve('engine/index.html'));
  await page.evaluate(async tl => { await window.ready; window.TL = tl; }, TL);
  for (const t of times.split(',').map(Number)) {
    const f = Math.round(t * TL.fps);
    const b64 = await page.evaluate(f => frameJPEG(f, .92), f);
    const name = `${outdir}/t${String(Math.round(t * 10)).padStart(5, '0')}.jpg`;
    fs.writeFileSync(name, Buffer.from(b64, 'base64'));
  }
  await browser.close();
})();
