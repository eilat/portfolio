document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Years of experience, counted from the year in data-since
document.querySelectorAll('[data-since]').forEach((el) => {
  el.textContent = `${new Date().getFullYear() - parseInt(el.dataset.since, 10)}+`;
});

// Split headings into words so they can rise in one by one (inline tags like <em> stay whole)
document.querySelectorAll('.split').forEach((el) => {
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  const words = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach((w) => words.push(w));
    else if (n.nodeName === 'BR') words.push(null);
    else words.push(n.outerHTML);
  });
  let i = 0;
  el.innerHTML = words.map((w) => (w === null ? '<br>' : `<span class="w" aria-hidden="true"><span style="--i:${i++}">${w}</span></span>`)).join(' ');
});

// Reveal on scroll
const revealables = document.querySelectorAll('.reveal, .unveil, .split');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealables.forEach((el) => {
    // Anything already on screen at load shows straight away
    if (el.getBoundingClientRect().top < innerHeight) requestAnimationFrame(() => el.classList.add('in'));
    else io.observe(el);
  });
} else {
  revealables.forEach((el) => el.classList.add('in'));
}

// Section tags land like stickers once their title reaches the top third of the
// screen, and lift off again when you scroll back up. Worked out from scroll
// position rather than IntersectionObserver margins, which browsers ignore
// inside embedded frames.
const stickers = [...document.querySelectorAll('.head-tag')];
function updateStickers() {
  stickers.forEach((tagEl) => {
    const title = tagEl.parentElement.querySelector('h2') || tagEl.parentElement;
    const top = title.getBoundingClientRect().top;
    if (reduce || top < innerHeight / 3) tagEl.classList.add('in');
    else if (top > innerHeight * .55) tagEl.classList.remove('in');
  });
}
addEventListener('scroll', () => requestAnimationFrame(updateStickers), { passive: true });
addEventListener('resize', updateStickers);
updateStickers();

// ---------- Hover: tilt + cursor tag ----------
// Tilting a button moves its edges, which can slide it out from under a still
// mouse and make hover flicker. So we remember each target's box from before
// it tilted and keep it "hot" until the mouse really leaves that box.
const HOVER = '.pill, .tabs a, .btn, .talk, .back, [data-cursor]';
const tag = document.createElement('div');
tag.className = 'cursor-tag';
tag.setAttribute('aria-hidden', 'true');
document.body.appendChild(tag);
let hot = null, hotBox = null, mx = -100, my = -100, mouseSeen = false;

function inBox(b, x, y) { return b && x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2; }
function label(el) { return el && (el.dataset.cursorNow || el.dataset.cursor); }
function showTag() {
  const text = label(hot);
  if (text) tag.textContent = text;
  tag.classList.toggle('on', !!text);
}
function setHot(el) {
  if (el === hot) return;
  if (hot) hot.classList.remove('is-hover');
  hot = el;
  hotBox = el ? el.getBoundingClientRect() : null;
  if (el) el.classList.add('is-hover');
  showTag();
}
function track(x, y, target) {
  if (hot && inBox(hotBox, x, y)) return; // still on the same thing
  const el = target && target.closest ? target.closest(HOVER) : null;
  setHot(el);
}
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  mouseSeen = true; mx = e.clientX; my = e.clientY;
  // `translate` (not `transform`) so the pop-in scale doesn't scale the position too
  tag.style.translate = `${mx + 16}px ${my + 18}px`;
  track(mx, my, e.target);
}, { passive: true });
document.addEventListener('pointerleave', () => setHot(null));
// What's under the mouse changes on scroll and when overlays open, not only on move
function recheck() {
  if (!mouseSeen) return;
  if (hot) { hot.classList.remove('is-hover'); hotBox = hot.getBoundingClientRect(); hot.classList.add('is-hover'); }
  track(mx, my, document.elementFromPoint(mx, my));
}
addEventListener('scroll', recheck, { passive: true });
addEventListener('click', () => setTimeout(recheck, 60));

// ---------- Copy email ----------
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch { const r = document.createRange(); r.selectNodeContents(btn); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    btn.dataset.cursorNow = 'copied ✓';
    if (hot === btn) showTag();
    const note = btn.querySelector('.copied');
    if (note) note.textContent = 'Copied ✓';
    setTimeout(() => {
      delete btn.dataset.cursorNow;
      if (hot === btn) showTag();
      if (note) note.textContent = '';
    }, 1800);
  });
});

// ---------- Let's talk panel (one panel, opened from either bar) ----------
const panel = document.getElementById('talk-panel');
let openedBy = null;
function placePanel() {
  if (!openedBy || !panel) return;
  const r = openedBy.getBoundingClientRect();
  panel.style.top = `${r.bottom + 12}px`;
  panel.style.right = `${Math.max(12, innerWidth - r.right)}px`;
}
function setPanel(open, trigger) {
  if (!panel) return;
  if (open) { openedBy = trigger; placePanel(); }
  document.querySelectorAll('.talk').forEach((t) => t.setAttribute('aria-expanded', String(open && t === openedBy)));
  panel.classList.toggle('open', open);
  if (open) panel.querySelector('a, button').focus({ preventScroll: true });
}
document.querySelectorAll('.talk').forEach((t) => t.addEventListener('click', (e) => {
  e.stopPropagation();
  setPanel(!(panel.classList.contains('open') && openedBy === t), t);
}));
document.addEventListener('click', (e) => { if (panel && !panel.contains(e.target)) setPanel(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel && panel.classList.contains('open')) { setPanel(false); if (openedBy) openedBy.focus(); }
});
addEventListener('resize', placePanel);

// ---------- Floating nav: appears once the top bar has scrolled away ----------
const floatNav = document.querySelector('.float-nav');
const topBar = document.querySelector('.site-header');
function updateFloat() {
  if (!floatNav || !topBar) return;
  const show = topBar.getBoundingClientRect().bottom < 0;
  if (show === floatNav.classList.contains('show')) return;
  floatNav.classList.toggle('show', show);
  floatNav.inert = !show;
  // the panel follows whichever bar is visible
  if (panel && panel.classList.contains('open')) setPanel(false);
}

// Active section marker in the tabs
const tabSets = [...document.querySelectorAll('.tabs')];
const sections = ['work', 'about', 'cv', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
function markActive() {
  let current = null;
  sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * .45) current = s.id; });
  tabSets.forEach((set) => {
    const ind = set.querySelector('.tab-ind');
    let target = null;
    set.querySelectorAll('a').forEach((a) => {
      const on = !!current && a.getAttribute('href').endsWith('#' + current);
      a.classList.toggle('active', on);
      if (on) target = a;
    });
    if (!ind) return;
    if (target) {
      ind.style.width = `${target.offsetWidth}px`;
      ind.style.transform = `translateX(${target.offsetLeft}px)`;
      ind.classList.add('on');
    } else ind.classList.remove('on');
  });
}

// ---------- Parallax + scroll-driven bits ----------
const parallax = [...document.querySelectorAll('[data-speed]')];
function onScroll() {
  updateFloat();
  markActive();
  if (panel && panel.classList.contains('open')) placePanel();
  if (!reduce) {
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
addEventListener('resize', markActive);

// Hero badge turns slowly, and faster while you scroll
const badge = document.querySelector('.badge-ring');
if (badge && !reduce) {
  let spin = 0, lastY = scrollY, speed = 0;
  (function spinLoop() {
    const y = scrollY;
    speed = speed * .9 + Math.abs(y - lastY) * .1;
    lastY = y;
    spin = (spin + .12 + speed * .25) % 360;
    badge.style.transform = `rotate(${spin.toFixed(2)}deg)`;
    requestAnimationFrame(spinLoop);
  })();
}

// ---------- Lightbox: case study images open large ----------
const zoomables = document.querySelectorAll('[data-zoom]');
if (zoomables.length) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image preview');
  box.innerHTML = '<img alt=""><button class="lightbox-close" data-cursor="back to the story">Close</button>';
  document.body.appendChild(box);
  const img = box.querySelector('img'), close = box.querySelector('button');
  let opener = null;
  const hide = () => { box.classList.remove('open'); document.documentElement.classList.remove('no-scroll'); if (opener) opener.focus({ preventScroll: true }); };
  zoomables.forEach((el) => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    const show = () => {
      const src = el.querySelector('img');
      img.src = src.currentSrc || src.src; img.alt = src.alt;
      opener = el;
      box.classList.add('open'); document.documentElement.classList.add('no-scroll');
      close.focus({ preventScroll: true });
    };
    el.addEventListener('click', show);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });
  box.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) hide(); });
}

// ---------- More work: drag the rail, open a project sheet ----------
const rail = document.querySelector('.rail');
if (rail) {
  // Drag with a mouse; touch and trackpads scroll natively
  let drag = null;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: false };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; rail.classList.add('dragging'); }
    if (drag.moved) rail.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    // let the release finish before cards take clicks again
    if (drag.moved) setTimeout(() => rail.classList.remove('dragging'), 0);
    drag = null;
  });
  document.querySelectorAll('.rail-btn').forEach((b) => b.addEventListener('click', () => {
    const card = rail.querySelector('.rail-card');
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 16) : 300;
    rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
  }));

  const projects = JSON.parse(document.getElementById('more-work-data').textContent);
  const sheet = document.createElement('dialog');
  sheet.className = 'sheet';
  sheet.setAttribute('aria-labelledby', 'sheet-title');
  sheet.innerHTML = `<div class="sheet-panel">
      <button class="sheet-close" type="button" data-cursor="back to the work">Close</button>
      <span class="sheet-tag"></span>
      <h2 id="sheet-title"></h2>
      <p class="sheet-text"></p>
      <div class="sheet-meta"><span class="scope"></span><a class="pill live" target="_blank" rel="noopener" data-cursor="see it live">Visit the live site <span aria-hidden="true">↗</span></a></div>
      <div class="sheet-gallery"></div>
    </div>`;
  document.body.appendChild(sheet);
  const q = (sel) => sheet.querySelector(sel);
  let opener = null;

  function openSheet(id, from) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    opener = from;
    q('.sheet-tag').textContent = p.domain;
    q('h2').textContent = p.title;
    q('.sheet-text').textContent = p.text;
    q('.scope').textContent = p.scope;
    const live = q('.live');
    live.hidden = !p.live;
    if (p.live) live.href = p.live;
    const gallery = q('.sheet-gallery');
    gallery.classList.toggle('phones', p.phone);
    gallery.innerHTML = '';
    p.images.forEach((f, i) => {
      const img = document.createElement('img');
      img.src = `assets/work/${p.id}/${f}`;
      img.alt = `${p.title}, screen ${i + 1} of ${p.images.length}`;
      img.loading = i < 2 ? 'eager' : 'lazy';
      gallery.appendChild(img);
    });
    q('.sheet-panel').scrollTop = 0;
    sheet.showModal();
    document.documentElement.classList.add('sheet-open');
    requestAnimationFrame(() => sheet.classList.add('open'));
  }
  function closeSheet() {
    sheet.classList.remove('open');
    document.documentElement.classList.remove('sheet-open');
    setTimeout(() => { sheet.close(); if (opener) opener.focus({ preventScroll: true }); }, reduce ? 0 : 450);
  }
  rail.addEventListener('click', (e) => {
    const card = e.target.closest('.rail-card');
    if (card) openSheet(card.dataset.project, card);
  });
  q('.sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });
}

onScroll();
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
