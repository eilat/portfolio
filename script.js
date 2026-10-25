// Current year in footer
document.querySelectorAll('#year').forEach(el => { el.textContent = new Date().getFullYear(); });

// Fade sections in as they scroll into view
const targets = document.querySelectorAll('.card, .about, .contact, .case-body > *');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
