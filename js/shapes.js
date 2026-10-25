// Soft shapes that form words and frames, and re-arrange as you scroll.
// Any element with data-shapes="word|ring|edge" defines a formation; the one
// nearest the middle of the screen is the active one.
(() => {
  const canvas = document.querySelector('.shape-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = ['#ead6c8', '#d3ae98', '#f1e2d8', '#c4e8d7', '#9fd5bd', '#e2c4b2', '#c4e8d7', '#141414'];
  const WEIGHTS = [5, 4, 4, 5, 3, 3, 2, 0.7];
  const MAX = 460;
  const forms = [...document.querySelectorAll('[data-shapes]')];

  let W = 0, H = 0, parts = [], active = null, plan = null, t = 0;
  const mouse = { x: -1e4, y: -1e4 };

  const pickColor = () => {
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0);
    for (let i = 0; i < COLORS.length; i++) { if ((r -= WEIGHTS[i]) <= 0) return COLORS[i]; }
    return COLORS[0];
  };

  for (let i = 0; i < MAX; i++) {
    parts.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: 0, vy: 0,
      tx: 0, ty: 0, a: 0, ta: 0, s: 0, ts: 4,
      kind: Math.floor(Math.random() * 5), color: pickColor(),
      rot: Math.random() * 6.28, spin: (Math.random() - .5) * .004,
      ph: Math.random() * 6.28, fx: Math.random(), fy: Math.random(),
    });
  }

  // ---- formation builders: return points relative to the anchor's top-left ----
  function wordPoints(text, w, h) {
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w)); off.height = Math.max(1, Math.round(h));
    const o = off.getContext('2d');
    const font = (fs) => `300 ${fs}px "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif`;
    let fs = h * .9;
    o.font = font(fs);
    const tw = o.measureText(text).width;
    if (tw > w * .94) fs *= (w * .94) / tw;
    o.font = font(fs);
    o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(text, w / 2, h / 2);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    let gap = Math.max(W < 600 ? 3 : 5, Math.round(fs / 20)), pts;
    do {
      pts = [];
      for (let y = 0; y < off.height; y += gap) for (let x = 0; x < off.width; x += gap)
        if (data[(y * off.width + x) * 4 + 3] > 140) pts.push({ x, y });
      gap++;
    } while (pts.length > MAX * .92);
    return { pts, size: (gap - 1) * .42 };
  }

  function ringPoints(w, h) {
    const pts = [], cx = w / 2, cy = h / 2;
    const n = Math.round(Math.min(220, (w + h) / 3.2));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, band = 18 + Math.random() * 46;
      pts.push({ x: cx + Math.cos(a) * (w / 2 + band), y: cy + Math.sin(a) * (h / 2 + band) });
    }
    return { pts, size: 5 };
  }

  function edgePoints(rect) {
    // Drift loosely in the side margins so text stays clean
    const margin = Math.max(0, rect.left - 12);
    if (margin < 36) return { pts: [], size: 3 };
    const pts = [];
    for (let i = 0; i < 140; i++) {
      const p = parts[i], left = i % 2 === 0;
      const x = left ? 8 + p.fx * (margin - 16) : W - 8 - p.fx * (margin - 16);
      pts.push({ x, y: 40 + p.fy * (H - 80), fixed: true });
    }
    return { pts, size: 3.4 };
  }

  function build(el) {
    const r = el.getBoundingClientRect(), type = el.dataset.shapes;
    let res;
    if (type === 'word') res = wordPoints(el.dataset.word || 'hello', r.width, r.height);
    else if (type === 'ring') res = ringPoints(r.width, r.height);
    else res = edgePoints(r);
    // Assign points to particles in a stable left-to-right order so morphs flow
    const order = parts.map((p, i) => i).sort((a, b) => (parts[a].x + parts[a].y * .3) - (parts[b].x + parts[b].y * .3));
    const pts = res.pts.slice().sort((a, b) => (a.x + a.y * .3) - (b.x + b.y * .3));
    const map = new Array(MAX);
    order.forEach((pi, k) => { map[pi] = k < pts.length ? pts[k] : null; });
    return { el, type, map, size: res.size };
  }

  function apply(el) {
    active = el;
    plan = el ? build(el) : null;
    parts.forEach((p, i) => {
      const pt = plan && plan.map[i];
      p.ta = pt ? (plan.type === 'edge' ? .55 : .95) : 0;
      p.ts = pt ? plan.size * (.65 + p.fx * .7) : 2;
    });
  }

  function pickActive() {
    let best = null, bestD = Infinity;
    for (const el of forms) {
      const r = el.closest('section, header, footer, div[data-shapes-zone]') || el;
      const rr = r.getBoundingClientRect();
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
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.beginPath();
    if (p.kind === 0) { ctx.arc(0, 0, s, 0, 6.283); ctx.fillStyle = p.color; ctx.fill(); }
    else if (p.kind === 1) { ctx.arc(0, 0, s * 1.1, 0, Math.PI); ctx.closePath(); ctx.fillStyle = p.color; ctx.fill(); }
    else if (p.kind === 2) { const r = s * .8; ctx.roundRect ? ctx.roundRect(-s * 1.3, -r, s * 2.6, r * 2, r) : ctx.rect(-s * 1.3, -r, s * 2.6, r * 2); ctx.fillStyle = p.color; ctx.fill(); }
    else if (p.kind === 3) { ctx.moveTo(0, 0); ctx.arc(0, 0, s * 1.4, 0, Math.PI / 2); ctx.closePath(); ctx.fillStyle = p.color; ctx.fill(); }
    else { ctx.arc(0, 0, s * .9, 0, 6.283); ctx.lineWidth = Math.max(1, s * .35); ctx.strokeStyle = p.color; ctx.stroke(); }
    ctx.restore();
  }

  function frame() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
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
        p.x = p.tx; p.y = p.ty; p.a = p.ta; p.s = p.ts;
      } else {
        const fx = Math.sin(t * .012 + p.ph) * 2.2, fy = Math.cos(t * .010 + p.ph) * 2.2; // breathing
        p.vx += (p.tx + fx - p.x) * .014;
        p.vy += (p.ty + fy - p.y) * .014;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const d = Math.sqrt(d2) || 1, f = (95 - d) / 95 * .9; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= .9; p.vy *= .9;
        p.x += p.vx; p.y += p.vy;
        p.a += (p.ta - p.a) * .04;
        p.s += (p.ts - p.s) * .05;
        p.rot += p.spin;
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
  (document.fonts && document.fonts.ready ? document.fonts.load('300 100px "Bricolage Grotesque"').then(() => document.fonts.ready) : Promise.resolve())
    .then(start, start);
})();
