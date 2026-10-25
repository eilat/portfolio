// Soft dots and rounded strokes that form words and frames, and re-arrange as
// you scroll. Any element with data-shapes="word|ring|edge" defines a
// formation; the one in the section nearest the middle of the screen is active.
(() => {
  const canvas = document.querySelector('.shape-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = ['#ead6c8', '#d3ae98', '#e9cbb9', '#c4e8d7', '#9fd5bd', '#e2c4b2', '#b3e0cb'];
  const WEIGHTS = [5, 4, 3, 5, 3, 3, 3];
  const LINE_SHARE = 0.24; // the rest are dots
  const MAX = 1100;
  const forms = [...document.querySelectorAll('[data-shapes]')];

  let W = 0, H = 0, active = null, plan = null, t = 0;
  const parts = [];
  const mouse = { x: -1e4, y: -1e4 };

  const pickColor = () => {
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0);
    for (let i = 0; i < COLORS.length; i++) { if ((r -= WEIGHTS[i]) <= 0) return COLORS[i]; }
    return COLORS[0];
  };

  for (let i = 0; i < MAX; i++) {
    parts.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: 0, vy: 0,
      tx: 0, ty: 0, a: 0, ta: 0, s: 0, ts: 3,
      line: Math.random() < LINE_SHARE, color: pickColor(),
      ang: Math.random() * Math.PI, tang: 0,
      ph: Math.random() * 6.28, fx: Math.random(), fy: Math.random(),
    });
  }

  // Direction of the letter stroke around (x, y): principal axis of nearby ink
  function strokeAngle(data, w, h, x, y, r) {
    let sxx = 0, syy = 0, sxy = 0, n = 0;
    for (let dy = -r; dy <= r; dy += 2) {
      const yy = y + dy; if (yy < 0 || yy >= h) continue;
      for (let dx = -r; dx <= r; dx += 2) {
        const xx = x + dx; if (xx < 0 || xx >= w) continue;
        if (data[(yy * w + xx) * 4 + 3] > 140) { sxx += dx * dx; syy += dy * dy; sxy += dx * dy; n++; }
      }
    }
    return n ? 0.5 * Math.atan2(2 * sxy, sxx - syy) : 0;
  }

  // ---- formation builders: points relative to the anchor's top-left ----
  function wordPoints(text, w, h) {
    const off = document.createElement('canvas');
    const ow = Math.max(1, Math.round(w)), oh = Math.max(1, Math.round(h));
    off.width = ow; off.height = oh;
    const o = off.getContext('2d', { willReadFrequently: true });
    const font = (fs) => `400 ${fs}px "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif`;
    let fs = h * .9;
    o.font = font(fs);
    const tw = o.measureText(text).width;
    if (tw > w * .96) fs *= (w * .96) / tw;
    o.font = font(fs);
    o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(text, w / 2, h / 2);
    const data = o.getImageData(0, 0, ow, oh).data;
    let gap = Math.max(W < 600 ? 3 : 4, Math.round(fs / 34)), pts;
    do {
      pts = [];
      for (let y = 0; y < oh; y += gap) {
        const shift = (Math.floor(y / gap) % 2) * gap / 2; // staggered rows read denser
        for (let x = shift; x < ow; x += gap) {
          const xi = Math.round(x);
          if (data[(y * ow + xi) * 4 + 3] > 140) pts.push({ x: xi, y });
        }
      }
      gap++;
    } while (pts.length > MAX * .95);
    gap--;
    const r = Math.max(6, Math.round(fs * .11)); // wider than the stroke, so its direction shows
    pts.forEach((p) => { p.ang = strokeAngle(data, ow, oh, p.x, p.y, r); });
    return { pts, size: gap * .5 };
  }

  function ringPoints(w, h) {
    const pts = [], cx = w / 2, cy = h / 2;
    const n = Math.round(Math.min(420, (w + h) / 1.8));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .03, band = 14 + Math.pow(Math.random(), 1.6) * 52;
      // tangent of the ellipse, so strokes follow the frame
      const ang = Math.atan2((h / 2 + band) * Math.cos(a), -(w / 2 + band) * Math.sin(a));
      pts.push({ x: cx + Math.cos(a) * (w / 2 + band), y: cy + Math.sin(a) * (h / 2 + band), ang });
    }
    return { pts, size: 3.6 };
  }

  function edgePoints(rect) {
    // Drift loosely in the side margins so text stays clean
    const margin = Math.max(0, rect.left - 12);
    if (margin < 36) return { pts: [], size: 2.5 };
    const pts = [];
    for (let i = 0; i < 220; i++) {
      const p = parts[i], left = i % 2 === 0;
      const x = left ? 8 + p.fx * (margin - 16) : W - 8 - p.fx * (margin - 16);
      pts.push({ x, y: 40 + p.fy * (H - 80), fixed: true, ang: p.ph });
    }
    return { pts, size: 2.6 };
  }

  function build(el) {
    const r = el.getBoundingClientRect(), type = el.dataset.shapes;
    let res;
    if (type === 'word') res = wordPoints(el.dataset.word || 'hello', r.width, r.height);
    else if (type === 'ring') res = ringPoints(r.width, r.height);
    else res = edgePoints(r);
    // Pair points and shapes in the same left-to-right order so morphs flow
    const key = (o) => o.x + o.y * .3;
    const order = parts.map((p, i) => i).sort((a, b) => key(parts[a]) - key(parts[b]));
    const pts = res.pts.slice().sort((a, b) => key(a) - key(b));
    const map = new Array(MAX);
    order.forEach((pi, k) => { map[pi] = k < pts.length ? pts[k] : null; });
    return { el, type, map, size: res.size };
  }

  function apply(el) {
    active = el;
    plan = el ? build(el) : null;
    parts.forEach((p, i) => {
      const pt = plan && plan.map[i];
      p.ta = pt ? (plan.type === 'edge' ? .6 : 1) : 0;
      p.ts = pt ? plan.size * (.6 + p.fx * .75) : 1.5;
      if (pt) p.tang = pt.ang + (p.fy - .5) * .12;
    });
  }

  function pickActive() {
    let best = null, bestD = Infinity;
    for (const el of forms) {
      const zone = el.closest('section, header, footer') || el;
      const rr = zone.getBoundingClientRect();
      const d = rr.top > H * .5 ? rr.top - H * .5 : rr.bottom < H * .5 ? H * .5 - rr.bottom : 0;
      if (d < bestD) { bestD = d; best = el; }
    }
    if (best !== active) apply(best);
  }

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    const nw = innerWidth, nh = innerHeight;
    // Ignore small height changes from mobile URL bars
    if (nw === W && Math.abs(nh - H) < 120 && W) return;
    W = nw; H = nh;
    canvas.width = W * d; canvas.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (active) apply(active); else pickActive();
  }

  function draw(p) {
    const s = p.s;
    if (s < .3 || p.a < .01) return;
    ctx.globalAlpha = p.a;
    if (p.line) {
      const len = s * 1.25, c = Math.cos(p.ang) * len, sn = Math.sin(p.ang) * len;
      ctx.strokeStyle = p.color; ctx.lineWidth = s * .75;
      ctx.beginPath(); ctx.moveTo(p.x - c, p.y - sn); ctx.lineTo(p.x + c, p.y + sn); ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, s * .85, 0, 6.283); ctx.fill();
    }
  }

  function frame() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    const ar = plan && plan.type !== 'edge' ? plan.el.getBoundingClientRect() : null;
    for (let i = 0; i < MAX; i++) {
      const p = parts[i], pt = plan && plan.map[i];
      if (pt) {
        p.tx = (pt.fixed ? 0 : ar.left) + pt.x;
        p.ty = (pt.fixed ? 0 : ar.top) + pt.y;
      } else {
        // Unused shapes rest softly around the screen, invisible
        p.tx = p.fx * W; p.ty = p.fy * H;
      }
      if (reduce) {
        p.x = p.tx; p.y = p.ty; p.a = p.ta; p.s = p.ts; p.ang = p.tang;
      } else {
        const fx = Math.sin(t * .012 + p.ph) * 1.6, fy = Math.cos(t * .010 + p.ph) * 1.6; // breathing
        p.vx += (p.tx + fx - p.x) * .014;
        p.vy += (p.ty + fy - p.y) * .014;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const d = Math.sqrt(d2) || 1, f = (95 - d) / 95 * .9; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= .9; p.vy *= .9;
        p.x += p.vx; p.y += p.vy;
        p.a += (p.ta - p.a) * .04;
        p.s += (p.ts - p.s) * .05;
        // strokes are symmetric, so turn the short way round (mod π)
        let da = p.tang - p.ang; da -= Math.round(da / Math.PI) * Math.PI;
        p.ang += da * .06;
      }
      draw(p);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; } }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  addEventListener('scroll', pickActive, { passive: true });
  addEventListener('resize', resize);

  const start = () => { resize(); pickActive(); requestAnimationFrame(frame); };
  // Wait for the display font so words are sampled with the right letterforms
  (document.fonts && document.fonts.load ? document.fonts.load('400 100px "Bricolage Grotesque"').then(() => document.fonts.ready) : Promise.resolve())
    .then(start, start);
})();
