/* Scroll-driven screen tour. The screen stays pinned and whole while short
   steps scroll past beside it. Entering a step moves a cursor to the control a
   user would press, clicks, and the next screen appears, so the tour reads as
   one path through the product. Scrolling is never taken over.
   Markup: [data-flow data-w data-h] > .flow-stage (rail + .flow-view with
   .flow-shot images and .flow-cursor) + .flow-steps > .flow-step[data-seq],
   where data-seq is [[clickX, clickY, shotIndex], ...] in screen pixels. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-flow]').forEach((flow) => {
    const W = +flow.dataset.w, H = +flow.dataset.h;
    const stage = flow.querySelector('.flow-stage');
    const shots = [...flow.querySelectorAll('.flow-shot')];
    const steps = [...flow.querySelectorAll('.flow-step')];
    const dots = [...flow.querySelectorAll('.flow-dot')];
    const cursor = flow.querySelector('.flow-cursor');
    const seqs = steps.map((s) => JSON.parse(s.dataset.seq));
    let current = 0, timers = [];

    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    const show = (n) => shots.forEach((img, i) => img.classList.toggle('is-on', i === n));
    const lastShot = (i) => seqs[i][seqs[i].length - 1][2];

    function play(seq, k) {
      const [x, y, shot] = seq[k];
      const next = () => (k + 1 < seq.length ? later(1500, () => play(seq, k + 1)) : later(900, () => cursor.classList.remove('is-on')));
      if (x == null) { show(shot); return next(); }
      cursor.classList.add('is-on');
      cursor.style.left = (x / W) * 100 + '%';
      cursor.style.top = (y / H) * 100 + '%';
      later(850, () => { cursor.classList.remove('is-click'); void cursor.offsetWidth; cursor.classList.add('is-click'); });
      later(1050, () => { show(shot); next(); });
    }

    function go(i) {
      if (i === current) return;
      timers.forEach(clearTimeout); timers = [];
      const forward = i > current;
      current = i;
      steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
      dots.forEach((d, n) => {
        d.toggleAttribute('aria-current', n === i);
        if (n === i) d.setAttribute('aria-current', 'step');
        d.classList.toggle('is-done', n < i);
      });
      if (!forward || reduce) { cursor.classList.remove('is-on'); return show(lastShot(i)); }
      show(lastShot(i - 1)); // the click lands on the screen before this step
      play(seqs[i], 0);
    }

    // The active step is the last one whose top has passed a line in the viewport.
    const stacked = matchMedia('(max-width: 900px)');
    let ticking = false;
    function measure() {
      ticking = false;
      // Stacked: a step takes over when its top clears the pinned screen's shadow.
      // Side by side: when the middle of its text nears the middle of the screen.
      const line = innerHeight * (stacked.matches ? 0.8 : 0.7);
      let i = 0;
      steps.forEach((s, n) => {
        const r = s.getBoundingClientRect();
        if ((stacked.matches ? r.top : r.top + r.height / 2) <= line) i = n;
      });
      go(i);
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } };

    // Keep the pinned screen vertically centred (below the floating nav).
    function place() {
      const top = stacked.matches ? 0 : Math.max(84, (innerHeight - stage.offsetHeight) / 2);
      flow.style.setProperty('--flow-top', top + 'px');
      measure();
    }

    dots.forEach((d, n) => d.addEventListener('click', () => {
      const r = steps[n].getBoundingClientRect();
      const y = scrollY + r.top - innerHeight * (stacked.matches ? 0.74 : 0.5) + (stacked.matches ? 0 : r.height / 2);
      scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }));

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', place);
    addEventListener('load', place);
    place();
  });
})();
