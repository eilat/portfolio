document.documentElement.classList.add('js');

// Split headings into words so they can rise in one by one
document.querySelectorAll('.split').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
});

// Reveal on scroll
const revealables = document.querySelectorAll('.reveal, .unveil, .split');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('in'));
}

// Header: soft background once scrolled, tucks away when scrolling down
const header = document.querySelector('.site-header');
let lastY = scrollY;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const parallax = [...document.querySelectorAll('[data-speed]')];

function onScroll() {
  const y = scrollY;
  if (header) {
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > 400);
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

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
