# Sakthi Tailor & Garments — website

The website for **Sakthi Tailor & Garments** (சக்தி டைலர் & கார்மெண்ட்ஸ்): ladies & gents tailoring, school and office uniforms, a tailoring training school, and new & used sewing machines. Two branches in Tamil Nadu.

It is a plain static site (HTML, CSS, JavaScript; no build step) hosted free on GitHub Pages.

## Features

- **7 languages** — English, தமிழ், తెలుగు, മലയാളം, ಕನ್ನಡ, हिन्दी, اردو (right-to-left). Picks the visitor's phone language on the first visit and remembers their choice. Fonts for each script load only when needed.
- **Order on WhatsApp** — the booking form builds a ready-to-send WhatsApp message (name, phone, service, branch, date, details) in the visitor's language. Nothing is stored on a server.
- **Two branches with Google Maps** — branch cards with directions, call and WhatsApp buttons, and a map that loads only after the visitor allows it (privacy-friendly, DPDP Act 2023-aware).
- **Social** — Instagram, Facebook and WhatsApp links, plus a Share button (uses the phone's share sheet).
- **Brand design** built from the shop logo: sindoor crimson, zari gold and ivory, temple-arch photo frames, kolam patterns, and a distinct entrance animation for every section (all off for reduced-motion users).
- **"From fabric to finished blouse"** photo story, student-work albums on the Training page, and 60+ real photos of finished blouses and aari work.
- **Services slider, photo gallery with full-screen viewer, FAQ, process steps**, a separate **Training School** page, and privacy/terms pages.
- **Works offline** (service worker), installable on phones (web app manifest), SEO structured data (business, FAQ, course).
- **Security** — strict Content-Security-Policy with no inline scripts, all user text escaped, sandboxed map frame.

## Updating shop details — edit `config.js`

Everything changeable lives in [`config.js`](config.js):

```js
social: {
  instagram: "https://www.instagram.com/your-page",
  facebook:  "https://www.facebook.com/your-page"
},
branches: [
  { address: "12, Main Road, Town – 600001", hours: "Mon–Sat 9:30 AM – 8:30 PM", mapQuery: "Sakthi Tailor, Main Road, Town" },
  { address: "...", hours: "...", mapQuery: "..." }
]
```

Leave a value as `""` and the site shows a polite "to be added" message instead. Once `address` (or `mapQuery`) is filled in, the map and the Directions button start working automatically.

## Adding photos

1. Copy the photo into `images/` with a short lowercase name, e.g. `images/design-bridal-01.jpg`. Resize it to about 1200 px on the long side first (keeps the site fast).
2. **Gallery**: in `index.html`, find `id="gGrid"` and copy one `<button class="g-item" …>` line. Set:
   - `data-cat` — `designs`, `aari`, `shop`, `work` or `tools` (or a new category; add a matching filter chip above the grid)
   - Strip location data first: phone photos often contain GPS. Re-saving through an image editor or the export script removes it.
   - `data-caption` — the caption text
   - `src`, `width`, `height` and `alt` on the `<img>`
   - optional `data-featured="1"` to prefer it in the 5-photo preview
3. **Service cards**: in the `svcTrack` slider, change the `<img src>` inside a card.
4. Add new pages or big images to `CORE_ASSETS` in `sw.js` only if they must work offline, and bump `CACHE_NAME` (e.g. `v5` → `v6`) whenever you change files, so returning visitors get the update.

## Editing text and translations

English text lives in the HTML. Each translatable element has a `data-i18n="key"` attribute; translations are in `lang/<code>.js` (one file per language, same keys). `lang/en.json` is the English source list used for translating.

When you change English text, update the same key in each `lang/*.js` file. Missing keys fall back to English automatically. Translations were machine-assisted, so have a native speaker review them, especially garment terms.

## Run locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Deploying

The site is published by GitHub Pages from the `main` branch root. Push to `main` and it updates in about a minute.

**Custom domain** (e.g. `www.sakthitailor.in`): add a `CNAME` file containing the domain, set it in the repository's Settings → Pages, then replace `https://rashvanth2007-byte.github.io/sakthi-tailor/` in the HTML `<head>` tags, `sitemap.xml` and `robots.txt`, and `/sakthi-tailor/` in `404.html`.

## Still to fill in

- Branch addresses, hours and map locations (`config.js`)
- Instagram and Facebook page links (`config.js`)
- Training course duration, timings and fees (`training.html`)
- Items marked "to be confirmed" in `terms.html`
