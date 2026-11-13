"""Generate the case study pages for the portfolio from structured content.

Usage: python3 gen_cases.py <portfolio_root>
Content in [brackets] is a placeholder for Eilat to fill in.
"""
import html, sys

ROOT = sys.argv[1]
WA = 'https://wa.me/972524263616?text=Hi%20Eilat%2C%20I%20saw%20your%20portfolio%20and%20would%20love%20to%20talk.'
LI = 'https://www.linkedin.com/in/eilat-brayer-48146722/'
MAIL = 'eilatbrayer@gmail.com'
e = html.escape

# Product tour layers: (file, x, y, w, h, anim, at_ms[, out_ms]) in 1440x1024 screen space.
# Camera stops: (ms, x, y, w, h, caption).
CARE_TOUR = [
 dict(name='Patients', file='s1-base', alt='Doctor view: my patients', duration=9800, layers=[
   ('s1-title', 20, 80, 1136, 67, 'up', 250),
   ('s1-banner', 20, 167, 1136, 52, 'drop', 700),
   ('s1-table', 20, 239, 1136, 765, 'wipe', 1100)],
  cam=[(0, 0, 0, 1440, 1024, 'My patients: the whole practice in one table'),
       (2900, 760, 150, 420, 560, 'Status comes first: who is waiting for an answer, who is urgent'),
       (5600, 220, 230, 560, 470, 'The plan shows how much each patient can ask'),
       (8200, 0, 0, 1440, 1024, '')]),
 dict(name='Payments', file='s2-base', alt='Doctor view: payments dashboard', duration=12000, layers=[
   ('s2-box1', 39, 190, 359, 102, 'up', 200), ('s2-box2', 418, 190, 359, 102, 'up', 380), ('s2-box3', 797, 190, 359, 102, 'up', 560),
   ('s2-field', 956, 312, 200, 40, 'up', 760),
   ('s2-donutcard', 39, 372, 372, 214, 'pop', 950), ('s2-donut', 199.5, 434.5, 148, 148, 'sweep', 1300),
   ('s2-revcard', 431, 372, 725, 214, 'pop', 1050), ('s2-bars', 431, 413, 675, 137, 'grow', 1500),
   ('s2-table', 39, 606, 1117, 423, 'wipe', 1900)],
  cam=[(0, 0, 0, 1440, 1024, 'Payments: earnings at a glance'),
       (2900, 431, 360, 725, 240, 'Revenue per plan, period by period'),
       (5400, 30, 360, 390, 240, 'Which plans patients choose'),
       (7900, 780, 600, 400, 424, 'Every payout traced to the patients behind it'),
       (10500, 0, 0, 1440, 1024, '')]),
 dict(name='Messages', file='s3-base', alt='Doctor view: a patient conversation', duration=9500, layers=[
   ('s3-date', 44, 249, 729, 21, 'up', 300), ('s3-msg1', 44, 282, 729, 114, 'up', 550),
   ('typing', 660, 441, 96, 40, 'pop', 1500, 2700),
   ('s3-date', 44, 408, 729, 21, 'up', 2700), ('s3-msg2', 44, 441, 729, 245, 'up', 2850),
   ('s3-date', 44, 693, 729, 21, 'up', 4600), ('s3-msg3', 44, 726, 729, 152.5, 'up', 4800)],
  cam=[(0, 20, 180, 780, 700, 'Patient messages: a real conversation, not a ticket'),
       (3300, 40, 430, 740, 260, 'Answers broken into steps a patient can follow'),
       (6200, 0, 0, 1440, 1024, ''),]),
]

def pct(v, total): return f'{v / total * 100:.4f}%'

def tour(data, folder, label):
    scenes, chips = [], []
    for i, sc in enumerate(data):
        lazy = '' if i == 0 else ' loading="lazy"'
        rows = [f'            <img class="base" src="../assets/{folder}/{sc["file"]}.png" alt="{e(sc["alt"])}"{lazy}>']
        for L in sc['layers']:
            f, x, y, w, h, anim, at = L[:7]
            out = f' data-out="{L[7]}"' if len(L) > 7 else ''
            pos = f'left:{pct(x,1440)};top:{pct(y,1024)};width:{pct(w,1440)};height:{pct(h,1024)}'
            if f == 'typing':
                rows.append(f'            <span class="typing a-{anim}" style="{pos}" data-at="{at}"{out} aria-hidden="true"><i></i><i></i><i></i></span>')
            else:
                rows.append(f'            <img class="a-{anim}" src="../assets/{folder}/{f}.png" alt="" style="{pos}" data-at="{at}"{out}>')
        cam = '[' + ','.join(f'[{t},{x},{y},{w},{h},"{c}"]' for t, x, y, w, h, c in sc['cam']) + ']'
        scenes.append(f'          <div class="tour-scene" data-duration="{sc["duration"]}" data-cam=\'{e(cam, quote=False)}\'>\n' + '\n'.join(rows) + '\n          </div>')
        chips.append(f'        <button class="tour-chip" type="button" aria-pressed="{"true" if i == 0 else "false"}">{e(sc["name"])}</button>')
    return f'''      <div class="tour reveal" data-tour role="region" aria-label="{e(label)}">
        <div class="tour-frame">
          <div class="tour-view"><div class="tour-cam">
{chr(10).join(scenes)}
          </div></div>
        </div>
        <div class="tour-bar">
          <div class="tour-chips">
{chr(10).join(chips)}
          </div>
          <p class="tour-caption" aria-live="polite"></p>
          <button class="tour-toggle" type="button" aria-pressed="false">Pause</button>
        </div>
      </div>'''

CASES = [
 dict(slug='care-platform', word='care', icons='stethoscope,chat,capsule', captions='The check-up|The conversation|The treatment', palette='#3f2bc0,#2f6fe0,#6aa8f5,#93dcc0,#ffd9a0', chip='#dfe6ff', tint='#f3e3d8', tour=(CARE_TOUR, 'work/care/tour', 'Tour of the doctor screens'), cover='work/care/01.jpg', fig='work/care/02.jpg', fig_alt='The patient side: my doctors',
  title='One platform, three kinds of people', kind='Healthcare',
  intro='Designing a doctor-service platform end to end for patients, doctors and admins, with one visual language and one design system.',
  meta=[('Role', 'Lead product designer, end to end'), ('Scope', 'Specification, UX/UI, design system'), ('Users', 'Patients, doctors, admins'), ('Domain', 'Healthcare')],
  chapters=[
   dict(label='Context', h='Three users, three different needs',
        p=['[What the platform does and who it serves.]']),
   dict(label='What I did', h='From specification to a shared design system',
        p=['I owned the platform end to end: product specification, UX and UI for three user types, a new visual language, and a unified design system.'],
        img=('work/care/01.jpg', 'Overview of the platform screens'),
        cards=[('Patients', '[Their main flow and need.]'), ('Doctors', '[Their main flow and need.]'), ('Admins', '[Their main flow and need.]')]),
   dict(label='Design system', h='One language for three products', p=['[How the design system kept three experiences consistent.]'], figure=True),
   dict(label='Result', h='[What changed]', p=['[Outcome, launch, feedback.]']),
  ]),
]

HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} — Eilat Brayer</title>
  <meta name="description" content="{intro}">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Manrope:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body class="case-page">
  <canvas class="shape-canvas" aria-hidden="true"></canvas>
'''

TABS = '''      <a href="../#work">Work</a>
      <a href="../#about">About</a>
      <a href="../#cv">CV</a>
      <a href="../#contact">Contact</a>'''

BARS = f'''  <header class="site-header">
    <a class="back" href="../#work"><span aria-hidden="true">←</span> Back home</a>
    <nav class="tabs" aria-label="Main">
{TABS}
    </nav>
    <div class="talk-wrap">
      <button class="talk" type="button" aria-expanded="false" aria-controls="talk-panel" data-cursor="say hi">Let’s talk</button>
    </div>
  </header>

  <nav class="float-nav" aria-label="Quick navigation" inert>
    <a class="back" href="../#work"><span aria-hidden="true">←</span> Home</a>
    <div class="tabs">
{TABS}
    </div>
    <button class="talk" type="button" aria-expanded="false" aria-controls="talk-panel" data-cursor="say hi">Let’s talk</button>
  </nav>

  <div class="talk-panel" id="talk-panel">
    <p>Pick whatever feels easiest.</p>
    <a class="pill" href="{WA}" target="_blank" rel="noopener" data-cursor="fastest reply"><span><span class="ico"></span> WhatsApp</span><span>↗</span></a>
    <a class="pill nude" href="{LI}" target="_blank" rel="noopener" data-cursor="let’s connect"><span><span class="ico"></span> LinkedIn</span><span>↗</span></a>
    <button class="pill" type="button" data-copy="{MAIL}" data-cursor="click to copy"><span><span class="ico"></span> Email</span><span>{MAIL}</span></button>
  </div>
'''

def chapter(c, case, i):
    out = [f'        <section class="chapter">',
           f'          <span class="label reveal">{e(c["label"])}</span>',
           f'          <h2 class="split">{e(c["h"])}</h2>']
    for para in c.get('p', []):
        out.append(f'          <p class="reveal">{e(para)}</p>')
    if c.get('cards'):
        out.append('          <ul class="case-cards reveal">')
        for t, d in c['cards']:
            out.append(f'            <li><strong>{e(t)}</strong>{e(d)}</li>')
        out.append('          </ul>')
    if c.get('img'):
        src, alt = c['img']
        out.append(f'''          <figure>
            <div class="case-cover unveil" style="--tint:{case["tint"]}" data-zoom data-cursor="zoom"><img src="../assets/{src}" alt="{e(alt)}" loading="lazy"></div>
          </figure>''')
    if c.get('before_after'):
        out.append(f'''          <div class="before-after">
            <figure>
              <span class="ba-tag">Before</span>
              <div class="case-cover unveil" style="--tint:#eeeae6" data-zoom data-cursor="zoom"><img src="../assets/img/{case["slug"]}-before.svg" alt="Placeholder for the original interface" loading="lazy"></div>
              <figcaption class="reveal">[Replace with the original, developer-built screen.]</figcaption>
            </figure>
            <figure>
              <span class="ba-tag after">After</span>
              <div class="case-cover unveil" style="--tint:{case["tint"]}" data-zoom data-cursor="zoom"><img src="../assets/img/{case["slug"]}-after.svg" alt="Placeholder for the redesigned interface" loading="lazy"></div>
              <figcaption class="reveal">[Replace with the redesigned screen.]</figcaption>
            </figure>
          </div>''')
    if c.get('figure'):
        out.append(f'''          <figure>
            <div class="case-cover unveil" style="--tint:{case["tint"]}" data-zoom data-cursor="zoom"><img src="../assets/{case.get("fig", case["cover"])}" alt="{e(case.get("fig_alt", "Placeholder image"))}" loading="lazy"></div>
            <figcaption class="reveal">{e(case.get("fig_alt", "[Replace with real screens.]"))}</figcaption>
          </figure>''')
    out.append('        </section>')
    return '\n'.join(out)

for i, c in enumerate(CASES):
    # the agritech case (cooling.html) is hand-written; the chain ends there
    nxt = CASES[i + 1] if i + 1 < len(CASES) else dict(slug='cooling', title='Smart cooling for dairy farms')
    meta = '\n'.join(f'        <div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in c['meta'])
    chapters = '\n\n'.join(chapter(ch, c, j) for j, ch in enumerate(c['chapters']))
    media = tour(*c['tour']) if c.get('tour') else f'      <div class="case-cover unveil" style="--tint:{c["tint"]}" data-zoom data-cursor="zoom"><img src="../assets/{c["cover"]}" alt="{e(c["title"])}, overview"></div>'
    tour_js = '\n  <script src="../js/tour.js" defer></script>' if c.get('tour') else ''
    page = HEAD.format(title=e(c['title']), intro=e(c['intro'])) + BARS + f'''
  <main>
    <section class="case-hero inner" id="top" style="--chip:{c["chip"]}">
      <div class="case-head">
        <div class="case-text">
          <span class="label case-tag reveal">Case study · {e(c["kind"])}</span>
          <h1 class="split">{e(c["title"])}</h1>
          <p class="intro reveal">{e(c["intro"])}</p>
        </div>
        <div class="case-worlds" data-shapes="worlds" data-morph="soft" data-icons="{c["icons"]}" data-palette="{c["palette"]}" data-cursor="play with me" aria-hidden="true"></div>
      </div>
{media}
      <dl class="case-meta reveal">
{meta}
      </dl>
    </section>

    <div class="inner">
      <article class="case-body">
{chapters}
      </article>
    </div>

    <a class="next inner" href="{nxt["slug"]}.html" data-cursor="up next">
      <span class="label">Next project</span>
      <strong>{e(nxt["title"])} →</strong>
    </a>
  </main>

  <footer class="site-footer">
    <span>© <span data-year>2026</span> Eilat Brayer</span>
    <a href="#top" data-cursor="up we go">Back to top ↑</a>
  </footer>

  <script src="../js/main.js" defer></script>
  <script src="../js/shapes.js" defer></script>{tour_js}
</body>
</html>
'''
    open(f'{ROOT}/projects/{c["slug"]}.html', 'w').write(page)
print('pages', [c['slug'] for c in CASES])
