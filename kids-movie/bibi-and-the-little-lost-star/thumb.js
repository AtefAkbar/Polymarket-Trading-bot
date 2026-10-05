// node thumb.js out.jpg  -> 1280x720 YouTube thumbnail rendered with the film's own engine
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || 'build/thumbnail.jpg';
  const k = (t, o) => Object.assign({ t }, o);
  const TL = { fps: 24, frames: 72, lines: [], lyrics: [], numbers: [], cards: [{ t0: -5, t1: 99, kind: 'thumb' }],
    beats: [{ id: 'thumb', scene: 'summit', t0: 0, t1: 3, fade: { in: 0, out: 0, col: '#000' }, bpm: 100, cam: [k(0, { x: 960, y: 580, z: 1.0 })],
      fx: { complete: true, twinkle: .6 },
      actors: {
        luma: [k(0, { x: 960, y: 470, s: 1.45, flip: 1, face: 'joy', bright: 1, anim: 'dance' })],
        bibi: [k(0, { x: 560, y: 940, s: 1.35, flip: 1, face: 'joy', anim: 'cheer', lantern: true, look: .6 })],
        tuck: [k(0, { x: 1330, y: 960, s: 1.15, flip: -1, face: 'happy', anim: 'idle' })],
        odo: [k(0, { x: 1640, y: 960, s: 1.1, flip: -1, face: 'joy', anim: 'idle' })] } }] };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.resolve('engine/index.html'));
  await page.evaluate(async tl => { await window.ready; window.TL = tl; }, TL);
  const b64 = await page.evaluate(() => frameJPEG(30, .95));
  fs.writeFileSync('build/thumb_full.jpg', Buffer.from(b64, 'base64'));
  await browser.close();
  require('child_process').execSync(`ffmpeg -y -loglevel error -i build/thumb_full.jpg -vf scale=1280:720 -q:v 2 ${out}`);
  console.log('wrote', out);
})();
