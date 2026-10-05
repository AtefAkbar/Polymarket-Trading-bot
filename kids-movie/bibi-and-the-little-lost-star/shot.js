// usage: node shot.js <page.html> <jsExpr> <out.png> [w h]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const [page_, expr, out, w = 1920, h = 1080] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(page_));
  await page.waitForTimeout(300);
  const t0 = Date.now();
  await page.evaluate(expr);
  console.log('eval ms', Date.now() - t0);
  await page.locator('canvas').screenshot({ path: out });
  await browser.close();
})();
