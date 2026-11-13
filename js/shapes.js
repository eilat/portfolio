// Soft dots and rounded strokes that form words and frames, and re-arrange as
// you scroll. Any element with data-shapes="word|ring|edge|worlds" defines a
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
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

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
      line: Math.random() < LINE_SHARE, home: rgb(pickColor()), col: null, tcol: null, pick: Math.random(),
      ang: Math.random() * Math.PI, tang: 0,
      ph: Math.random() * 6.28, fx: Math.random(), fy: Math.random(),
    });
  }

  parts.forEach((p) => { p.col = p.home.slice(); p.tcol = p.home; });

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
  function wordPoints(text, w, h, align) {
    const off = document.createElement('canvas');
    const ow = Math.max(1, Math.round(w)), oh = Math.max(1, Math.round(h));
    off.width = ow; off.height = oh;
    const o = off.getContext('2d', { willReadFrequently: true });
    const font = (fs) => `400 ${fs}px "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif`;
    let fs = h * .9;
    if (align === 'fill') {
      // Ink runs exactly from the left edge to the right edge, centred vertically
      o.font = font(100);
      const m = o.measureText(text), k = (w * .985) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      fs = 100 * k;
      o.font = font(fs);
      o.textAlign = 'left'; o.textBaseline = 'alphabetic';
      const inkH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * k;
      o.fillText(text, m.actualBoundingBoxLeft * k + w * .0075, (h - inkH) / 2 + m.actualBoundingBoxAscent * k);
    } else {
      o.font = font(fs);
      const tw = o.measureText(text).width;
      if (tw > w * .96) fs *= (w * .96) / tw;
      o.font = font(fs);
      o.textBaseline = 'middle';
      o.textAlign = 'center';
      o.fillText(text, w / 2, h / 2);
    }
    const data = o.getImageData(0, 0, ow, oh).data;
    let gap = Math.max(W < 600 ? 3 : 4, Math.round(fs / 34)), pts;
    do {
      pts = [];
      for (let y = 0; y < oh; y += gap) {
        const shift = (Math.floor(y / gap) % 2) * gap / 2; // staggered rows read denser
        for (let x = shift; x < ow; x += gap) {
          const xi = Math.round(x);
          if (data[(y * ow + xi) * 4 + 3] > 140) pts.push({ x: xi + (Math.random() - .5) * gap * .5, y: y + (Math.random() - .5) * gap * .5, sx: xi, sy: y });
        }
      }
      gap++;
    } while (pts.length > MAX * .95);
    gap--;
    const r = Math.max(6, Math.round(fs * .11)); // wider than the stroke, so its direction shows
    pts.forEach((p) => { p.ang = strokeAngle(data, ow, oh, p.sx, p.sy, r); });
    return { pts, size: gap * .6, uniform: true };
  }

  // The worlds Eilat designs for, as simple filled silhouettes in a unit box
  const ICONS = {
    barn(o) {
      o.beginPath();
      o.moveTo(.10, .48); o.lineTo(.50, .14); o.lineTo(.90, .48); o.lineTo(.84, .48); o.lineTo(.84, .90);
      o.lineTo(.16, .90); o.lineTo(.16, .48); o.closePath();
      o.rect(.38, .58, .24, .32);                       // door
      o.moveTo(.57, .40); o.arc(.50, .40, .07, 0, Math.PI * 2);   // loft window
      o.fill('evenodd');
      o.fillRect(.04, .90, .92, .05);                   // ground
    },
    clinic(o) {
      o.beginPath();
      o.moveTo(.50, .88);
      o.bezierCurveTo(.12, .62, .02, .40, .14, .24);
      o.bezierCurveTo(.26, .08, .46, .12, .50, .28);
      o.bezierCurveTo(.54, .12, .74, .08, .86, .24);
      o.bezierCurveTo(.98, .40, .88, .62, .50, .88);
      o.closePath();
      o.rect(.44, .32, .12, .32); o.rect(.34, .42, .32, .12);   // medical cross
      o.fill('evenodd');
    },
    screen(o) {
      o.beginPath();
      o.rect(.06, .14, .88, .56); o.rect(.12, .20, .76, .44);   // frame
      o.fill('evenodd');
      o.fillRect(.20, .46, .10, .14); o.fillRect(.36, .36, .10, .24); o.fillRect(.52, .28, .10, .32); o.fillRect(.68, .40, .10, .20);
      o.beginPath(); o.moveTo(.42, .70); o.lineTo(.58, .70); o.lineTo(.62, .82); o.lineTo(.38, .82); o.closePath(); o.fill();
      o.fillRect(.28, .82, .44, .05);
    },
    // Healthcare: listen, talk, treat
    stethoscope(o) {
      o.lineCap = 'round'; o.lineJoin = 'round'; o.lineWidth = .065;
      o.beginPath(); o.moveTo(.26, .10); o.lineTo(.26, .38); o.bezierCurveTo(.26, .60, .58, .60, .58, .38); o.lineTo(.58, .10); o.stroke();
      o.beginPath(); o.moveTo(.42, .56); o.lineTo(.42, .70); o.bezierCurveTo(.42, .92, .78, .92, .78, .70); o.lineTo(.78, .60); o.stroke();
      o.lineWidth = .045; o.beginPath(); o.moveTo(.19, .10); o.lineTo(.30, .10); o.moveTo(.54, .10); o.lineTo(.65, .10); o.stroke();
      o.beginPath(); o.arc(.78, .50, .11, 0, Math.PI * 2); o.arc(.78, .50, .045, 0, Math.PI * 2, true); o.fill();
    },
    chat(o) {
      o.beginPath(); o.roundRect(.08, .14, .84, .54, .14);
      o.moveTo(.26, .66); o.lineTo(.20, .88); o.lineTo(.46, .66); o.closePath(); o.fill();
      o.globalCompositeOperation = 'destination-out';
      [.32, .50, .68].forEach((x) => { o.beginPath(); o.arc(x, .41, .065, 0, Math.PI * 2); o.fill(); });
      o.globalCompositeOperation = 'source-over';
    },
    capsule(o) {
      o.save(); o.translate(.5, .5); o.rotate(-Math.PI / 4);
      o.beginPath(); o.roundRect(-.42, -.17, .84, .34, .17); o.fill();
      o.globalCompositeOperation = 'destination-out'; o.fillRect(-.02, -.2, .04, .4);
      o.beginPath(); o.roundRect(-.32, -.08, .2, .06, .03); o.fill();
      o.restore(); o.globalCompositeOperation = 'source-over';
    },
    // Dairy cooling: the herd, the milk, the cold
    cow(o) {
      o.beginPath(); o.roundRect(.30, .24, .40, .50, .16); o.fill();
      o.beginPath(); o.ellipse(.50, .74, .21, .14, 0, 0, Math.PI * 2); o.fill();
      o.beginPath(); o.ellipse(.19, .36, .13, .06, -.35, 0, Math.PI * 2); o.ellipse(.81, .36, .13, .06, .35, 0, Math.PI * 2); o.fill();
      o.lineCap = 'round'; o.lineWidth = .05;
      o.beginPath(); o.moveTo(.36, .26); o.quadraticCurveTo(.30, .12, .38, .08); o.moveTo(.64, .26); o.quadraticCurveTo(.70, .12, .62, .08); o.stroke();
      o.globalCompositeOperation = 'destination-out';
      [[.41, .44, .04], [.59, .44, .04], [.43, .76, .035], [.57, .76, .035]].forEach(([x, y, r]) => { o.beginPath(); o.arc(x, y, r, 0, Math.PI * 2); o.fill(); });
      o.globalCompositeOperation = 'source-over';
    },
    drop(o) {
      o.beginPath(); o.moveTo(.50, .06);
      o.bezierCurveTo(.62, .26, .80, .42, .80, .62); o.bezierCurveTo(.80, .80, .66, .92, .50, .92);
      o.bezierCurveTo(.34, .92, .20, .80, .20, .62); o.bezierCurveTo(.20, .42, .38, .26, .50, .06); o.fill();
      o.globalCompositeOperation = 'destination-out'; o.lineCap = 'round'; o.lineWidth = .05;
      o.beginPath(); o.arc(.50, .62, .19, Math.PI * .55, Math.PI * .95); o.stroke();
      o.globalCompositeOperation = 'source-over';
    },
    snowflake(o) {
      o.lineCap = 'round'; o.lineWidth = .06; o.save(); o.translate(.5, .5);
      for (let i = 0; i < 6; i++) {
        o.beginPath(); o.moveTo(0, 0); o.lineTo(0, -.42);
        o.moveTo(0, -.26); o.lineTo(-.10, -.36); o.moveTo(0, -.26); o.lineTo(.10, -.36);
        o.moveTo(0, -.12); o.lineTo(-.08, -.20); o.moveTo(0, -.12); o.lineTo(.08, -.20);
        o.stroke(); o.rotate(Math.PI / 3);
      }
      o.restore();
    },
  };
  function iconPoints(name, w, h) {
    const ow = Math.max(1, Math.round(w)), oh = Math.max(1, Math.round(h));
    const off = document.createElement('canvas'); off.width = ow; off.height = oh;
    const o = off.getContext('2d', { willReadFrequently: true });
    const side = Math.min(ow, oh) * .92;
    o.translate((ow - side) / 2, (oh - side) / 2); o.scale(side, side);
    (ICONS[name] || ICONS.screen)(o);
    const data = o.getImageData(0, 0, ow, oh).data;
    let gap = Math.max(W < 600 ? 4 : 5, Math.round(side / 36)), pts;
    do {
      pts = [];
      for (let y = 0; y < oh; y += gap) {
        const shift = (Math.floor(y / gap) % 2) * gap / 2;
        for (let x = shift; x < ow; x += gap) {
          const xi = Math.round(x);
          if (data[(y * ow + xi) * 4 + 3] > 140) pts.push({ x: xi + (Math.random() - .5) * gap * .5, y: y + (Math.random() - .5) * gap * .5, sx: xi, sy: y });
        }
      }
      gap++;
    } while (pts.length > MAX * .9);
    gap--;
    const r = Math.max(6, Math.round(side * .06));
    pts.forEach((p) => { p.ang = strokeAngle(data, ow, oh, p.sx, p.sy, r); });
    return { pts, size: gap * .6, uniform: true };
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
    return { pts, size: 5, uniform: true };
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
    return { pts, size: 5, uniform: true };
  }

  function build(el) {
    const r = el.getBoundingClientRect(), type = el.dataset.shapes;
    let res;
    if (type === 'word') res = wordPoints(el.dataset.word || 'hello', r.width, r.height, el.dataset.align);
    else if (type === 'worlds') {
      const icons = (el.dataset.icons || 'barn,clinic,screen').split(',');
      const name = icons[(el._world || 0) % icons.length];
      if (el.dataset.morph !== 'soft') res = iconPoints(name, r.width, r.height);
      const cap = el.parentElement.querySelector('[data-world-caption]');
      if (cap) cap.textContent = (el.dataset.captions || '').split('|')[(el._world || 0) % icons.length] || '';
    }
    else if (type === 'ring') res = ringPoints(r.width, r.height);
    else res = edgePoints(r);
    const soft = type === 'worlds' && el.dataset.morph === 'soft';
    const map = new Array(MAX).fill(null);
    if (soft) {
      // Soft morph: the same particles stay in the stage and each keeps its
      // place around the centre, so one shape melts into the next in place.
      const icons = (el.dataset.icons || '').split(','), sizeKey = Math.round(r.width) + 'x' + Math.round(r.height);
      if (el._sizeKey !== sizeKey) {
        el._sizeKey = sizeKey;
        el._sets = icons.map((n) => iconPoints(n, r.width, r.height));
        el._n = Math.max(...el._sets.map((st) => st.pts.length));
        el._size = el._sets.reduce((a, st) => a + st.size, 0) / el._sets.length;
      }
      const set = el._sets[(el._world || 0) % el._sets.length], cx = r.width / 2, cy = r.height / 2;
      const ang = (o) => Math.atan2(o.y - cy, o.x - cx);
      const pts = set.pts.slice().sort((a, b) => ang(a) - ang(b)), N = el._n, jit = el._size * .9;
      for (let k = 0; k < N; k++) {
        const q = pts[Math.floor((k * pts.length) / N)], dup = k >= pts.length;
        map[k] = dup ? { x: q.x + (parts[k].fx - .5) * jit, y: q.y + (parts[k].fy - .5) * jit, ang: q.ang } : q;
      }
      res = { pts: [], size: el._size, uniform: true };
    } else {
      // Pair points and shapes in the same left-to-right order so morphs flow
      const key = (o) => o.x + o.y * .3;
      const order = parts.map((p, i) => i).sort((a, b) => key(parts[a]) - key(parts[b]));
      const pts = res.pts.slice().sort((a, b) => key(a) - key(b));
      order.forEach((pi, k) => { map[pi] = k < pts.length ? pts[k] : null; });
    }
    // A formation may bring its own colours (a project's palette)
    const pal = el.dataset.palette ? el.dataset.palette.split(',').map((c) => rgb(c.trim())) : null;
    parts.forEach((p, i) => { p.tcol = pal && map[i] ? pal[Math.floor(p.pick * pal.length)] : p.home; });
    return { el, type, map, size: res.size, uniform: !!res.uniform, born: t, soft };
  }

  function apply(el) {
    const leaving = plan && !el;
    active = el;
    plan = el ? build(el) : null;
    if (!plan) parts.forEach((p) => { p.tcol = p.home; });
    if (leaving && !reduce) {
      for (const p of parts) {
        const a = Math.random() * Math.PI * 2, f = 6 + Math.random() * 16;
        p.vx += Math.cos(a) * f; p.vy += Math.sin(a) * f;
      }
    }
    parts.forEach((p, i) => {
      const pt = plan && plan.map[i];
      p.ta = pt ? (plan.type === 'edge' ? .9 : 1) : 0;
      p.ts = !pt ? 1.5 : plan.uniform ? plan.size * (.94 + p.fx * .12) : plan.size * (.4 + Math.pow(p.fx, 1.5) * 1.1);
      if (pt) p.tang = pt.ang + (p.fy - .5) * .12;
    });
  }

  function pickActive() {
    let best = null;
    for (const el of forms) {
      const zone = el.closest('section, header, footer') || el;
      const rr = zone.getBoundingClientRect();
      if (rr.top <= H * .5 && rr.bottom >= H * .5) { best = el; break; }
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
      const len = s * .55, c = Math.cos(p.ang) * len, sn = Math.sin(p.ang) * len;
      ctx.strokeStyle = `rgb(${p.col[0] | 0},${p.col[1] | 0},${p.col[2] | 0})`; ctx.lineWidth = s * 1.1;
      ctx.beginPath(); ctx.moveTo(p.x - c, p.y - sn); ctx.lineTo(p.x + c, p.y + sn); ctx.stroke();
    } else {
      ctx.fillStyle = `rgb(${p.col[0] | 0},${p.col[1] | 0},${p.col[2] | 0})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, s * .85, 0, 6.283); ctx.fill();
    }
  }

  function frame() {
    t += 1;
    // The worlds formation moves on to the next world every few seconds
    if (plan && plan.type === 'worlds' && !reduce && t - plan.born > (plan.soft ? 600 : 250)) {
      plan.el._world = (plan.el._world || 0) + 1;
      apply(plan.el);
    }
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
        p.x = p.tx; p.y = p.ty; p.a = p.ta; p.s = p.ts; p.ang = p.tang; p.col = p.tcol.slice();
      } else {
        const fx = Math.sin(t * .012 + p.ph) * 1.6, fy = Math.cos(t * .010 + p.ph) * 1.6; // breathing
        const pull = plan && plan.soft ? .0045 : .014;
        p.vx += (p.tx + fx - p.x) * pull;
        p.vy += (p.ty + fy - p.y) * pull;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const d = Math.sqrt(d2) || 1, f = (95 - d) / 95 * .9; p.vx += dx / d * f; p.vy += dy / d * f; }
        const damp = plan && plan.soft ? .86 : .9;
        p.vx *= damp; p.vy *= damp;
        p.x += p.vx; p.y += p.vy;
        p.a += (p.ta - p.a) * .04;
        for (let k = 0; k < 3; k++) p.col[k] += (p.tcol[k] - p.col[k]) * .035;
        p.s += (p.ts - p.s) * .05;
        // strokes are symmetric, so turn the short way round (mod π)
        let da = p.tang - p.ang; da -= Math.round(da / Math.PI) * Math.PI;
        p.ang += da * (plan && plan.soft ? .025 : .06);
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
