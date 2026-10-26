# Portfolio

Personal UX/UI design portfolio. Plain HTML + CSS, no build step.

## Structure

```
index.html             Home: hero, selected work, about, CV, contact (one long scroll)
projects/stay.html     Case study pages, each with "Back home"
projects/kit.html
projects/pulse.html
css/style.css          All styles; colors and fonts are variables at the top
js/shapes.js           The shape animation: forms words/frames and re-forms per section
js/main.js             Scroll reveals, header behaviour, parallax
assets/img/            Project images (replace the placeholders)
assets/cv.pdf          Add your CV here (the Download CV buttons point to it)
404.html               Not-found page
```

## How the shapes work

Any element with `data-shapes` tells the shapes what to form while its section is in view:

- `data-shapes="word" data-word="hello"` writes a word inside that element
- `data-shapes="ring"` frames the element (used around the portrait)
- `data-shapes="edge"` lets the shapes drift quietly in the side margins

Add `data-cursor="your text"` to any link or button to show a small tag next to the mouse.
Add `data-zoom` to an image wrapper on a case study page to open it large on click.

Colors live at the top of `js/shapes.js` (`COLORS` and `WEIGHTS`).

## Editing

- **Text**: edit the HTML directly. Placeholders are in `[brackets]`.
- **New project**: copy a page in `projects/`, change its text, images and `data-word`, and add a card in the `#work` grid in `index.html`.
- **Images**: put them in `assets/img/` (about 2000px wide, WebP or JPG) and update the `src`.
- **Contact details**: search for `972500000000` (WhatsApp number, international format without +), `your-profile` (LinkedIn) and `eilatbrayer@gmail.com`, and replace them in `index.html` and the project pages.
- **Portrait**: replace the "Your photo here" span in `index.html` with an `<img>`.

Preview locally: `python3 -m http.server` then open http://localhost:8000

## Publishing with your own domain (GitHub Pages)

1. Repo → **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
   (Free GitHub Pages needs a public repo. With a private repo, use Netlify or Vercel instead — both are free and connect to the repo in a few clicks.)
2. Same page → **Custom domain** → enter `yourdomain.com` and save. GitHub adds a `CNAME` file to the repo.
3. At your domain registrar, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<your-github-username>.github.io`
4. Wait for DNS (minutes to a few hours), then tick **Enforce HTTPS**.
