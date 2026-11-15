"""Shared builder for the scroll-scrubbed screen tours (js/flow.js).
The whole block (steps, screen, text) pins to the viewport, and scrolling moves a
cursor across the screen; when it clicks, the screen changes as it does in the product.

A tour is a dict:
  page      path of the HTML file, relative to the repo root; the block between
            <!-- tour:start --> and <!-- tour:end --> is replaced
  w, h      screen size in px (all coordinates are in this space)
  folder    assets folder of the screens, e.g. 'work/cooling/tour'
  ext       extension of the layered sources ('webp' or 'png')
  label     aria-label of the tour
  shots     [(file, alt, [(source, x, y), ...])]  flat screens, in order; --images
            flattens the sources into <file>.webp at 2x
  steps     [(name, text)]  the text beside the screen, one visible at a time
  start     (x, y) where the cursor rests before the first move
  unit      vh of scroll per timeline unit
  timeline  ('hold', len) | ('move', x, y, len) | ('click', shot) | ('show', shot) | ('step', i)
            lengths are in screens of scroll (x unit); 'show' is for hover states
"""
import html, json, re, sys
e = html.escape

def build(root, t):
    W, H, folder = t['w'], t['h'], t['folder']
    if '--images' in sys.argv:
        from PIL import Image
        d = f'{root}/assets/{folder}/'
        for name, _, layers in t['shots']:
            out = Image.new('RGB', (W * 2, H * 2), 'white')
            for f, x, y in layers:
                im = Image.open(f'{d}{f}.{t["ext"]}').convert('RGBA')
                if im.size == (W, H): im = im.resize((W * 2, H * 2), Image.LANCZOS)  # 1x source
                out.paste(im, (round(x * 2), round(y * 2)), im)
            out.save(d + name + '.webp', quality=84, method=6)
    length = sum(i[-1] for i in t['timeline'] if i[0] in ('hold', 'move'))
    shots = '\n'.join(
        f'              <img class="flow-shot{" is-on" if i == 0 else ""}" src="../assets/{folder}/{f}.webp" alt="{e(alt)}" width="{W * 2}" height="{H * 2}">'
        for i, (f, alt, _) in enumerate(t['shots']))
    rail = '\n'.join(
        f'              <li><button type="button" class="flow-dot"{" aria-current=\"step\"" if i == 0 else ""}><b>{i + 1}</b><span>{e(n)}</span></button></li>'
        for i, (n, _) in enumerate(t['steps']))
    steps = '\n'.join(
        f'            <li class="flow-step{" is-active" if i == 0 else ""}">\n              <h3>{e(n)}</h3>\n              <p>{e(txt)}</p>\n            </li>'
        for i, (n, txt) in enumerate(t['steps']))
    cx, cy = t['start']
    block = f'''    <!-- tour:start (generated, see tools/README.md) -->
    <div class="flow" data-flow data-w="{W}" data-h="{H}" data-timeline='{json.dumps(t["timeline"])}' style="--flow-len:{length * t["unit"]:.0f};--flow-ratio:{W / H:.4f}" role="region" aria-label="{e(t["label"])}">
      <div class="flow-pin">
        <div class="flow-inner">
          <div class="flow-stage">
            <div class="flow-bar">
              <ol class="flow-rail" aria-label="Tour steps">
{rail}
              </ol>
              <a class="flow-skip" href="#details">Skip<i> the tour</i> <span aria-hidden="true">↓</span></a>
            </div>
            <div class="flow-frame">
              <div class="flow-view" style="aspect-ratio:{W} / {H}">
{shots}
                <span class="flow-cursor" aria-hidden="true" style="left:{cx / W * 100:.2f}%;top:{cy / H * 100:.2f}%"><svg viewBox="0 0 24 24"><path d="M5 2.5v17l4.6-4.3 2.9 6.6 2.7-1.2-2.9-6.5h6.2z" fill="#ffd23f" stroke="#141414" stroke-width="1.5" stroke-linejoin="round"/></svg></span>
              </div>
            </div>
          </div>
          <ol class="flow-steps">
{steps}
          </ol>
        </div>
      </div>
    </div>
    <!-- tour:end -->
'''
    p = f'{root}/{t["page"]}'; s = open(p).read()
    s, n = re.subn(r' *<!-- tour:start.*?<!-- tour:end -->\n', lambda m: block, s, flags=re.S)
    assert n == 1, f'tour markers not found in {t["page"]}'
    open(p, 'w').write(s)
    print('ok', t['page'])
