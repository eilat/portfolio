/* Scroll-scrubbed screen tour. The whole block (step rail, screen, text) pins
   to the viewport while the page scrolls through a tall track. Scroll position
   is the playhead: it moves a cursor across the screen, and when the cursor
   clicks, the next screen shows. Nothing plays on its own and scrolling is
   never taken over, so scrolling back rewinds.
   Markup: [data-flow data-w data-h data-timeline] > .flow-pin > rail, .flow-view
   (.flow-shot images + .flow-cursor) and .flow-step texts. Timeline items:
   ["hold", len] ["move", x, y, len] ["click", shot] ["show", shot] ["step", i]. */
(() => {
  const ease = (k) => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  document.querySelectorAll('[data-flow]').forEach((flow) => {
    const W = +flow.dataset.w, H = +flow.dataset.h;
    const shots = [...flow.querySelectorAll('.flow-shot')];
    const steps = [...flow.querySelectorAll('.flow-step')];
    const dots = [...flow.querySelectorAll('.flow-dot')];
    const cursor = flow.querySelector('.flow-cursor');
    const start = [parseFloat(cursor.style.left) / 100 * W, parseFloat(cursor.style.top) / 100 * H];

    // Lay the timeline out on one axis: moves and instant events, each at a position.
    const moves = [], events = [], stepAt = [0];
    let at = 0, from = start;
    JSON.parse(flow.dataset.timeline).forEach((it) => {
      if (it[0] === 'hold') at += it[1];
      else if (it[0] === 'move') { moves.push({ a: at, b: at + it[3], from, to: [it[1], it[2]] }); from = [it[1], it[2]]; at += it[3]; }
      else { events.push({ at, type: it[0], n: it[1] }); if (it[0] === 'step') stepAt[it[1]] = at; }
    });
    const total = at;
    let shot = -1, step = -1, clicks = -1;

    function render() {
      const track = flow.offsetHeight - innerHeight;
      const pos = Math.min(1, Math.max(0, -flow.getBoundingClientRect().top / track)) * total;

      let x = start[0], y = start[1];
      for (const m of moves) {
        if (pos >= m.b) { x = m.to[0]; y = m.to[1]; continue; }
        if (pos > m.a) { const k = ease((pos - m.a) / (m.b - m.a)); x = m.from[0] + (m.to[0] - m.from[0]) * k; y = m.from[1] + (m.to[1] - m.from[1]) * k; }
        break;
      }
      cursor.style.left = (x / W) * 100 + '%';
      cursor.style.top = (y / H) * 100 + '%';

      let s = 0, st = 0, c = 0;
      for (const ev of events) {
        if (ev.at > pos) break;
        if (ev.type === 'step') st = ev.n; else s = ev.n;
        if (ev.type === 'click') c++;
      }
      if (s !== shot) { shot = s; shots.forEach((img, i) => img.classList.toggle('is-on', i === s)); }
      if (st !== step) {
        step = st;
        steps.forEach((el, i) => el.classList.toggle('is-active', i === st));
        dots.forEach((d, i) => {
          if (i === st) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
          d.classList.toggle('is-done', i < st);
        });
      }
      if (c > clicks && clicks >= 0) { cursor.classList.remove('is-click'); void cursor.offsetWidth; cursor.classList.add('is-click'); }
      clicks = c;
    }

    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } };

    dots.forEach((d, i) => d.addEventListener('click', () => {
      const track = flow.offsetHeight - innerHeight;
      const top = flow.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + (track * stepAt[i]) / total + (i ? 4 : 0), behavior: 'smooth' });
    }));

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', render);
    render();
  });
})();
