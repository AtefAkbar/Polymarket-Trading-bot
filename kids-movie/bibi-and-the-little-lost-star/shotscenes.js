// usage: node shotscenes.js out_prefix idx[,idx...]   -> renders frame at the middle of each test beat
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [prefix, idxs, tlfile] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.addScriptTag({ path: path.resolve('engine/testtl.js') }).catch(() => {});
  await page.goto('file://' + path.resolve('engine/index.html'));
  await page.addScriptTag({ path: path.resolve('engine/testtl.js') });
  await page.evaluate(async () => { await window.ready; window.TL = window.TEST_TL; });
  for (const i of idxs.split(',').map(Number)) {
    const t0 = Date.now();
    const b64 = await page.evaluate(i => frameJPEG(i * 96 + 48, .95), i);
    fs.writeFileSync(`${prefix}_${i}.jpg`, Buffer.from(b64, 'base64'));
    console.log('scene', i, 'ms', Date.now() - t0);
  }
  await browser.close();
})();
