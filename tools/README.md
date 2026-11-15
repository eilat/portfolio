# Screen tour generators

Run from the repo root. Both case pages (`projects/cooling.html`, `projects/care-platform.html`)
are hand-written; the generators rewrite only the screen tour block between
`<!-- tour:start -->` and `<!-- tour:end -->`.

- `python3 tools/gen_bullseye.py .` BullsEye tour in `projects/cooling.html`
- `python3 tools/gen_care.py .` doctor-patient platform tour in `projects/care-platform.html`
- add `--images` to rebuild the flat screens (`assets/work/*/tour/f-*.webp`) from the
  layered exports (needs Pillow)

The tour (`js/flow.js`) is scroll scrubbed, no zoom: the whole block pins to the viewport,
scrolling moves a cursor over the screen and its clicks change the screen. The format
(`SHOTS`, `STEPS`, `TIMELINE`) is documented at the top of `tools/flow_tour.py`.

Page colors come from CSS variables on `body` (`--accent`, `--accent-soft`, `--band`,
`--rule`); `.theme-care` in `css/style.css` holds the healthcare set.
