/* Product screen tour: a screen builds itself layer by layer, then a camera
   glides to the parts worth talking about, with a caption for each stop.
   Markup: [data-tour] > .tour-frame > .tour-cam > .tour-scene (one per screen)
   > layers with data-at (ms) and a data-anim class. Camera stops live in each
   scene's data-cam as JSON: [[ms, x, y, w, h, caption], ...] in 1440x1024
   screen coordinates. Plays only while visible; honours reduced motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-tour]').forEach((tour) => {
    // Screen size the layers were placed in (defaults to 1440x1024)
    const W = +tour.dataset.w || 1440, H = +tour.dataset.h || 1024;
    const cam = tour.querySelector('.tour-cam');
    const scenes = [...tour.querySelectorAll('.tour-scene')];
    const chips = [...tour.querySelectorAll('.tour-chip')];
    const caption = tour.querySelector('.tour-caption');
    const toggle = tour.querySelector('.tour-toggle');
    let current = 0, timers = [], playing = !reduce, visible = false;

    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));

    function frame(x, y, w, h) {
      // Zoom so the rect fills ~90% of the view, never past 2.4x, never below 1.
      const s = Math.max(1, Math.min(2.4, Math.min(W / w, H / h) * 0.9));
      const cx = x + w / 2, cy = y + h / 2;
      let tx = W / 2 - cx * s, ty = H / 2 - cy * s;
      tx = Math.min(0, Math.max(W - W * s, tx));
      ty = Math.min(0, Math.max(H - H * s, ty));
      cam.style.transform = `translate(${(tx / W) * 100}%, ${(ty / H) * 100}%) scale(${s})`;
    }

    function say(text) {
      if (!caption || caption.textContent === text) return;
      caption.classList.remove('is-in');
      void caption.offsetWidth;
      caption.textContent = text;
      caption.classList.add('is-in');
    }

    function show(i, animate) {
      clear();
      current = i;
      scenes.forEach((s, j) => s.classList.toggle('is-active', j === i));
      chips.forEach((c, j) => {
        c.setAttribute('aria-pressed', String(j === i));
        c.classList.remove('is-running');
      });
      const scene = scenes[i];
      const layers = [...scene.querySelectorAll('[data-at]')];
      const stops = JSON.parse(scene.dataset.cam || '[]');
      const total = +scene.dataset.duration || 9000;

      if (!animate) {
        layers.forEach((l) => l.classList.toggle('on', !l.classList.contains('typing')));
        frame(0, 0, W, H);
        say(stops[0] ? stops[0][5] : '');
        return;
      }
      scene.classList.add('no-ease');
      cam.classList.add('no-ease');
      layers.forEach((l) => l.classList.remove('on'));
      frame(0, 0, W, H);
      void cam.offsetWidth;
      cam.classList.remove('no-ease');
      scene.classList.remove('no-ease');

      layers.forEach((l) => {
        later(+l.dataset.at, () => l.classList.add('on'));
        if (l.dataset.out) later(+l.dataset.out, () => l.classList.remove('on'));
      });
      stops.forEach(([t, x, y, w, h, text]) => later(t, () => { frame(x, y, w, h); if (text) say(text); }));

      const chip = chips[i];
      if (chip) {
        chip.style.setProperty('--dur', total + 'ms');
        void chip.offsetWidth;
        chip.classList.add('is-running');
      }
      later(total, () => show((i + 1) % scenes.length, true));
    }

    function run() { show(current, playing && visible); }

    chips.forEach((c, j) => c.addEventListener('click', () => { current = j; run(); }));

    if (toggle) {
      if (reduce) toggle.hidden = true;
      toggle.addEventListener('click', () => {
        playing = !playing;
        toggle.setAttribute('aria-pressed', String(!playing));
        toggle.textContent = playing ? 'Pause' : 'Play';
        run();
      });
    }

    // Start when the frame is mostly on screen; rest when it leaves.
    const io = new IntersectionObserver(([e]) => {
      const now = e.intersectionRatio > 0.35;
      if (now === visible) return;
      visible = now;
      if (visible) run(); else clear();
    }, { threshold: [0, 0.35, 0.6] });
    io.observe(tour.querySelector('.tour-frame'));

    if (reduce) show(0, false);
    else { scenes[0].classList.add('is-active'); const s0 = JSON.parse(scenes[0].dataset.cam || '[]'); say(s0[0] ? s0[0][5] : ''); }
  });
})();
