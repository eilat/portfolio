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
- BullsEye (`js/flow.js`): scroll driven, no zoom. The screen is pinned, steps scroll
  beside it. `STEPS` in `gen_bullseye.py`: `(name, text, [(click_x, click_y, shot_index), ...])`;
  the cursor clicks at x,y (screen pixels) and that shot appears.
