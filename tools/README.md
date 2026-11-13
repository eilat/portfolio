# Page generators

Run from the repo root.

- `python3 tools/gen_cases.py .` rebuilds `projects/care-platform.html` (healthcare case,
  including its screen tour data `CARE_TOUR`). Edit the content in the script, not the HTML.
- `python3 tools/gen_bullseye.py .` rewrites only the screen tour block inside
  `projects/cooling.html` (between `<!-- tour:start -->` and `<!-- tour:end -->`).
  The rest of `cooling.html` is hand-written.

Tour layer format: `(file, x, y, w, h, anim, at_ms)` in screen pixels; camera stops:
`(ms, x, y, w, h, caption)`. Animations: up, drop, pop, wipe, grow, sweep, fade.
