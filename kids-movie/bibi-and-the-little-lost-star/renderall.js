// usage: node renderall.js [workers=4] [chunk=960]  -> build/video_silent.mp4
const { spawn } = require('child_process');
const fs = require('fs');
const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
const workers = +(process.argv[2] || 4), chunk = +(process.argv[3] || 960);
fs.mkdirSync('build/seg', { recursive: true });
const jobs = []; for (let f = 0, i = 0; f < TL.frames; f += chunk, i++) jobs.push({ i, from: f, to: Math.min(TL.frames, f + chunk), out: `build/seg/seg_${String(i).padStart(3, '0')}.mp4` });
const only = process.argv[4] ? new Set(process.argv[4] === 'all' ? jobs.map(j => j.i) : process.argv[4].split(',').map(Number)) : null; // 'all' = force a full re-render // e.g. `node renderall.js 4 960 0,8,9` re-renders just those
if (only) jobs.forEach(j => { if (!only.has(j.i)) j.skip = true; });
let next = 0, running = 0, failed = [], finished = 0; const T0 = Date.now();
function launch() {
  while (running < workers && next < jobs.length) {
    const j = jobs[next++]; running++;
    if (j.skip || (!only && fs.existsSync(j.out + '.ok'))) { running--; finished++; continue; }
    const p = spawn('node', ['render.js', j.from, j.to, j.out], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', code => {
      running--; finished++;
      if (code === 0) fs.writeFileSync(j.out + '.ok', ''); else failed.push(j);
      console.log(`[${((Date.now() - T0) / 1000).toFixed(0)}s] segment ${j.i} ${code === 0 ? 'ok' : 'FAILED'} (${finished}/${jobs.length})`);
      launch(); if (running === 0 && next >= jobs.length) finish();
    });
  }
  if (running === 0 && next >= jobs.length) finish();
}
let ended = false;
function finish() {
  if (ended) return; ended = true;
  if (failed.length) { console.error('FAILED segments:', failed.map(j => j.i)); process.exit(1); }
  fs.writeFileSync('build/seg/list.txt', jobs.map(j => `file '${require('path').resolve(j.out)}'`).join('\n') + '\n');
  const c = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'build/seg/list.txt', '-c', 'copy', 'build/video_silent.mp4'], { stdio: 'inherit' });
  c.on('close', code => { console.log('concat exit', code, 'total', ((Date.now() - T0) / 1000).toFixed(0) + 's'); process.exit(code); });
}
launch();
