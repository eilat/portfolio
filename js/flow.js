/* Scroll-scrubbed screen tour. The whole block (step rail, screen, text) pins
   to the viewport while the page scrolls through a tall track. Scroll position
   is the playhead: it moves a cursor across the screen, and when the cursor
   clicks, the next screen shows. Nothing plays on its own and scrolling is
   never taken over, so scrolling back rewinds.
   Markup: [data-flow data-w data-h data-timeline] > .flow-pin > rail, .flow-view
   (.flow-shot images + .flow-cursor) and .flow-step texts. Timeline items:
   ["hold", len] ["move", x, y, len] ["click", shot] ["show", shot] ["step", i]. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    // A small spinning badge tells readers the tour moves as they scroll, until the last step.
    const hint = document.createElement('div');
    const hid = 'flow-hint-' + Math.random().toString(36).slice(2, 7);
    hint.className = 'flow-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = `<svg class="flow-hint-ring" viewBox="0 0 100 100"><defs><path id="${hid}" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs><text><textPath href="#${hid}" textLength="236" lengthAdjust="spacing">Scroll to continue · Scroll to continue ·</textPath></text></svg><span class="flow-hint-core"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>`;
    flow.querySelector('.flow-pin').appendChild(hint);

    function render() {
      // On very short viewports the tour is not pinned (see CSS) and there is no track.
      const track = flow.offsetHeight - innerHeight;
      const pos = track > 0 ? Math.min(1, Math.max(0, -flow.getBoundingClientRect().top / track)) * total : 0;

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
      if (s !== shot) {
        shot = s;
        shots.forEach((img, i) => { img.classList.toggle('is-on', i === s); img.toggleAttribute('aria-hidden', i !== s); if (i !== s) img.setAttribute('aria-hidden', 'true'); });
      }
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
      const rect = flow.getBoundingClientRect();
      hint.classList.toggle('on', track > 0 && rect.top <= 2 && rect.bottom > innerHeight && pos < total * .94);
    }

    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } };

    dots.forEach((d, i) => d.addEventListener('click', () => {
      const track = flow.offsetHeight - innerHeight;
      const top = flow.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + (track * stepAt[i]) / total + (i ? 4 : 0), behavior: reduce ? 'auto' : 'smooth' });
    }));

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', render);
    render();
  });
})();
