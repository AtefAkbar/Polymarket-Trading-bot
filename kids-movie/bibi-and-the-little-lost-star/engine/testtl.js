// hand-made timeline: one 4s beat per scene so we can eyeball every set
(function () {
  const B = (i, scene, extra) => Object.assign({ id: 't' + i, scene, t0: i * 4, t1: (i + 1) * 4, cam: [{ t: i * 4, x: 960, y: 540, z: 1 }], actors: {}, fx: {} }, extra);
  const at = (i, v) => Object.assign({ t: i * 4 }, v);
  const beats = [
    B(0, 'hill_dusk', { cam: [{ t: 0, x: 900, z: 1 }], constel: { x: 1330, y: 440, s: .86 }, fx: { starCount: 12, lines: .6, starAlpha: .6 }, actors: {
      bibi: [at(0, { x: 660, s: 1.05, flip: 1, face: 'happy', anim: 'idle', lantern: false })] } }),
    B(1, 'hill_night', { cam: [{ t: 4, x: 1500, z: 1 }], actors: {
      bibi: [at(1, { x: 1400, s: 1.05, face: 'determined', anim: 'walk', lantern: true }), { t: 8, x: 1700 }] } }),
    B(2, 'bedroom', { fx: { blanket: true, lamp: 1, meteors: [{ t0: 8.4, dur: 1.6, x0: 1150, y0: 120, x1: 520, y1: 820 }] }, actors: {
      bibi: [at(2, { x: 900, y: 735, s: 1.0, face: 'happy', cutY: -118, anim: 'idle' })], mama: [at(2, { x: 1160, y: 850, s: .88, face: 'happy', flip: -1 })] } }),
    B(3, 'woods', { cam: [{ t: 12, x: 1000, z: 1.1 }], fx: { shadow: { t: 12, x: 1500, y: 880, k: 2.4, a: .85 } }, actors: {
      bibi: [at(3, { x: 900, s: 1.0, face: 'scared', anim: 'tremble', lantern: true })] } }),
    B(4, 'pond', { cam: [{ t: 16, x: 1500, z: 1 }], fx: { wake: [{ x: 1500 }] }, actors: {
      tuck: [at(4, { x: 1500, y: 905, s: 1.0, face: 'happy', anim: 'swim' })],
      bibi: [at(4, { x: 1470, y: 722, s: .9, face: 'giggle', anim: 'idle', lantern: true, z: 2 })] } }),
    B(5, 'oak', { cam: [{ t: 20, x: 1500, z: 1 }], fx: { cloud: .0 }, actors: {
      odo: [at(5, { x: 2020, y: 505, s: .95, face: 'grumpy', anim: 'idle', flip: -1 })],
      bibi: [at(5, { x: 900, s: 1, face: 'surprised', lantern: true })], tuck: [at(5, { x: 620, s: .95, face: 'happy' })] } }),
    B(6, 'brambles', { cam: [{ t: 24, x: 1600, z: 1 }], actors: {
      bibi: [at(6, { x: 1300, s: 1, face: 'worried', lantern: true })], tuck: [at(6, { x: 960, s: .95, face: 'worried' })],
      odo: [at(6, { x: 1700, y: 640, s: .8, face: 'determined', anim: 'fly' })] } }),
    B(7, 'berry_hill', { cam: [{ t: 28, x: 1500, z: 1 }], actors: {
      bibi: [at(7, { x: 1700, y: 700, s: .92, face: 'determined', anim: 'walk', lantern: true })], tuck: [at(7, { x: 1400, y: 760, s: .88, face: 'proud', anim: 'walk' })] } }),
    B(8, 'hollow', { cam: [{ t: 32, x: 1200, z: 1.15 }], fx: { lumaBright: .15 }, actors: {
      luma: [at(8, { x: 1250, y: 770, s: 1, face: 'cry', bright: .15 })], bibi: [at(8, { x: 820, s: 1, face: 'worried', lantern: true })],
      tuck: [at(8, { x: 560, s: .95 })], odo: [at(8, { x: 1700, s: .85, face: 'worried' })] } }),
    B(9, 'summit', { fx: { complete: false, twinkle: .5 }, actors: {
      luma: [at(9, { x: 980, y: 640, s: 1.1, face: 'giggle', bright: .9 })], bibi: [at(9, { x: 600, s: 1.05, face: 'joy', anim: 'cheer', lantern: true })],
      tuck: [at(9, { x: 1400, s: 1, face: 'proud' })], odo: [at(9, { x: 1650, y: 520, s: .9, face: 'joy', anim: 'fly' })] } }),
  ];
  window.TEST_TL = { fps: 24, frames: beats.length * 4 * 24, beats, lines: [], lyrics: [], cards: [], numbers: [] };
})();
