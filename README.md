# Portfolio

Personal UX/UI design portfolio. Plain HTML + CSS, no build step.

## Structure

```
index.html              Home: hero, selected work, about, contact
projects/project-one.html  Case study template — copy it for each project
styles.css              All styles (colors/fonts are variables at the top)
script.js               Footer year + fade-in on scroll
assets/img/             Project images (replace the placeholders)
assets/favicon.svg      Tab icon
404.html                Not-found page
```

## Editing

- **Text**: edit `index.html` directly. Placeholders are in `[brackets]`.
- **New project**: copy `projects/project-one.html`, rename it, then add a card in the `#work` grid in `index.html` pointing to it.
- **Images**: put them in `assets/img/` (export at ~2000px wide, WebP or JPG) and update the `src`.
- **Colors / fonts**: change the variables in `:root` at the top of `styles.css`.

Preview locally: `python3 -m http.server` then open http://localhost:8000

## Publishing with your own domain (GitHub Pages)

1. Repo → **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
   (Free GitHub Pages needs a public repo. With a private repo, use Netlify or Vercel instead — both are free and connect to the repo in a few clicks.)
2. Same page → **Custom domain** → enter `yourdomain.com` and save. GitHub adds a `CNAME` file to the repo.
3. At your domain registrar, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<your-github-username>.github.io`
4. Wait for DNS (minutes to a few hours), then tick **Enforce HTTPS**.
