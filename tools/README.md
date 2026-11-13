# Page generators

Run from the repo root.

- `python3 tools/gen_cases.py .` rebuilds `projects/care-platform.html` (healthcare case,
  including its screen tour data `CARE_TOUR`). Edit the content in the script, not the HTML.
- `python3 tools/gen_bullseye.py .` rewrites only the screen tour block inside
  `projects/cooling.html` (between `<!-- tour:start -->` and `<!-- tour:end -->`).
  The rest of `cooling.html` is hand-written. Add `--images` to rebuild the flat
  screens (`assets/work/cooling/tour/f-*.webp`) from the layered exports (needs Pillow).

Two tour styles:

- Healthcare (`js/tour.js`): autoplay, layers build in, a camera zooms to regions.
  Layer format: `(file, x, y, w, h, anim, at_ms)` in screen pixels; camera stops:
  `(ms, x, y, w, h, caption)`. Animations: up, drop, pop, wipe, grow, sweep, fade.
- BullsEye (`js/flow.js`): scroll scrubbed, no zoom. The whole block pins to the
  viewport; scrolling moves a cursor over the screen and its clicks change the screen.
  Edit `STEPS` (texts) and `TIMELINE` in `gen_bullseye.py`: `('hold', len)`,
  `('move', x, y, len)`, `('click', shot)`, `('show', shot)` for hover states,
  `('step', i)`. Lengths are in screens of scroll; x,y are screen pixels (1280x832).
