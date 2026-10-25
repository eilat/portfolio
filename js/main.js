document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Split headings into words so they can rise in one by one (inline tags like <em> stay whole)
document.querySelectorAll('.split').forEach((el) => {
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  const words = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach((w) => words.push(w));
    else words.push(n.outerHTML);
  });
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
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

// Header: soft background once scrolled, tucks away when scrolling down
const header = document.querySelector('.site-header');
const parallax = [...document.querySelectorAll('[data-speed]')];
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  if (header) {
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > 400 && !header.classList.contains('talk-open'));
  }
  lastY = y;
  if (!reduce) {
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
onScroll();

// Cursor label: a small tag that follows the mouse and says what a click will do
const tag = document.createElement('div');
tag.className = 'cursor-tag';
tag.setAttribute('aria-hidden', 'true');
document.body.appendChild(tag);
let tx = -100, ty = -100, cx = -100, cy = -100, hovered = null;
let mouseSeen = false;
function setHovered(target) {
  const el = target && target.closest ? target.closest('[data-cursor]') : null;
  if (el !== hovered) {
    hovered = el;
    if (el) tag.textContent = el.dataset.cursorNow || el.dataset.cursor;
    tag.classList.toggle('on', !!el);
  }
}
// What's under the mouse changes on scroll and when overlays open, not only on move
const recheck = () => { if (mouseSeen) setHovered(document.elementFromPoint(tx, ty)); };
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  mouseSeen = true; tx = e.clientX; ty = e.clientY;
  setHovered(e.target);
}, { passive: true });
addEventListener('scroll', recheck, { passive: true });
addEventListener('click', () => setTimeout(recheck, 50));
document.addEventListener('pointerleave', () => { hovered = null; tag.classList.remove('on'); });
(function follow() {
  cx += (tx - cx) * (reduce ? 1 : .2);
  cy += (ty - cy) * (reduce ? 1 : .2);
  tag.style.transform = `translate3d(${cx + 16}px, ${cy + 18}px, 0)`;
  requestAnimationFrame(follow);
})();

// Copy email buttons
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch { const r = document.createRange(); r.selectNodeContents(btn); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    btn.dataset.cursorNow = 'copied ✓';
    if (hovered === btn) tag.textContent = 'copied ✓';
    const note = btn.querySelector('.copied');
    if (note) note.textContent = 'Copied ✓';
    setTimeout(() => {
      delete btn.dataset.cursorNow;
      if (hovered === btn) tag.textContent = btn.dataset.cursor;
      if (note) note.textContent = '';
    }, 1800);
  });
});

// Let's talk panel
const talk = document.querySelector('.talk');
const panel = document.getElementById('talk-panel');
if (talk && panel) {
  const setOpen = (open) => {
    talk.setAttribute('aria-expanded', open);
    panel.classList.toggle('open', open);
    header.classList.toggle('talk-open', open);
    if (open) panel.querySelector('a, button').focus({ preventScroll: true });
  };
  talk.addEventListener('click', (e) => { e.stopPropagation(); setOpen(talk.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('click', (e) => { if (!panel.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) { setOpen(false); talk.focus(); } });
}

// Lightbox: case study images open large
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

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
