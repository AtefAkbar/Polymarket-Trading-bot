// usage: node render.js <fromFrame> <toFrame(excl)> <out.mp4> [quality]
// Renders frames [from,to) of build/timeline.json in headless Chromium and pipes JPEGs straight into ffmpeg.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
(async () => {
  const [from, to, out, q = '.93'] = process.argv.slice(2);
  const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(2); });
  await page.goto('file://' + path.resolve('engine/index.html'));
  await page.evaluate(async tl => { await window.ready; window.TL = tl; }, TL);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '2', '-pix_fmt', 'yuv420p', '-g', '48', '-r', String(TL.fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  const t0 = Date.now();
  for (let f = +from; f < +to; f++) {
    const b64 = await page.evaluate(([f, q]) => frameJPEG(f, +q), [f, q]);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - from) % 200 === 199) console.log(`${out}: ${f - from + 1}/${to - from} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); const code = await done; await browser.close();
  console.log(`${out}: done ${to - from} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s (ffmpeg exit ${code})`);
  process.exit(code);
})();
