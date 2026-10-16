// AREA 47 mascot (working name: "CLASSIFIED"). Waist-up alien in a durag, iced chain with a UFO pendant,
// hoodie with the 47 patch, microfiber towel on the shoulder, arms crossed. Built from layered SVGs in
// brand/assets/area47/mascot/ so the head can nod and the face can swap expressions on any beat.
//
//   import { mascot } from '../../kits/area47-mascot.mjs';
//   mascot({ x: 0.19, y: 0.54, w: 0.62, W: 1080, H: 1350, base: '../../brand/assets/area47/mascot',
//            faces: [[0, 'cool', 'smirk'], [2.2, 'closed', 'smirk'], [2.32, 'cool', 'smirk'], [3.6, 'wink', 'grin']],
//            nods: [1.5, 2.1, 2.7], in: { fx: 'drop-soft', at: 0.3, dur: 0.9 } })
// x, y = top-left of the BODY in frame fractions; w = body width as a fraction of the short side (U).
// faces: [time, eyes, mouth] keyframes (eyes: cool|wink|side|hype|closed, mouth: smirk|grin|ayy). Times are scene-local.
const r4 = v => Math.round(v * 10000) / 10000;

export function mascot({ x, y, w = 0.62, base, logo = null, faces = [[0, 'cool', 'smirk']], nods = [], nodDeg = 6, nodDur = 0.28, sparkle = true, end = 99, ...rest }) {
  const k = w / 600;                      // U per SVG px (body is 600 px wide)
  const hw = r4(400 * k);                 // head layer width (U)
  const neck = [r4((100 + 200) * k), r4((-410 + 468) * k)];   // neck pivot relative to body top-left
  const headOff = [r4(-200 * k), r4(-468 * k)];               // head layer top-left relative to the pivot
  const layer = (src, extra = {}) => Object.assign({ type: 'image', src, w: hw, wUnit: 'U', anchor: 'top-left', x: headOff[0], y: headOff[1] }, extra);

  // expression layers: each face keyframe shows its eyes/mouth until the next keyframe
  const keys = faces.slice().sort((a, b) => a[0] - b[0]);
  const faceLayers = [];
  keys.forEach(([t, eyes, mouth], i) => {
    const t1 = i + 1 < keys.length ? keys[i + 1][0] : end;
    const vis = { from: t, out: { fx: 'cut', at: t1, dur: 0.001 } };
    faceLayers.push(layer(`${base}/eyes-${eyes}.svg`, vis), layer(`${base}/mouth-${mouth}.svg`, { ...vis }));
  });
  const nodMoves = [];
  nods.forEach(t => { nodMoves.push({ at: t, dur: nodDur * 0.45, rot: nodDeg, ease: 'outQuad' }, { at: t + nodDur * 0.45, dur: nodDur * 0.55, rot: 0, ease: 'inOutQuad' }); });

  const kids = [
    { type: 'image', src: `${base}/body.svg`, w, wUnit: 'U', anchor: 'top-left', x: 0, y: 0 },
    { type: 'group', x: neck[0], y: neck[1], moves: nodMoves, children: [layer(`${base}/head.svg`), ...faceLayers] },
  ];
  if (logo) kids.push({ type: 'image', src: logo, w: r4(84 * k), wUnit: 'U', x: r4(440 * k), y: r4(212 * k) });
  if (sparkle) [[268, 228], [332, 232], [300, 310]].forEach(([sx, sy], i) => kids.push(
    { type: 'sparkle', r: r4(18 * k), fill: 'white', x: r4(sx * k), y: r4(sy * k), opacity: 0.95, loop: { fx: 'pulse', period: 1.1, amp: 1.6, phase: i * 0.37 } }));
  return Object.assign({ type: 'group', x, y, children: kids }, rest);
}
