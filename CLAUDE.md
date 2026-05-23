# CLAUDE.md — GoldMonkVisuals Portfolio

Project context, contracts, and maintenance instructions. **Read before editing anything in this repo — the site is in production.**

---

## 1. What this is

A static photography site for GoldMonkVisuals (Rumit Khade). No framework, no build step. Pure HTML + vanilla JS + a single `css/styles.css`. Hosted on Netlify-style static hosting; the inquiry form posts via Netlify Forms.

Pages:

| Page | Purpose | Theme |
|------|---------|-------|
| `index.html` | Home: slider, about, tournaments, inquiry form | Dark editorial — `body class="theme-dark"` |
| `portfolio.html` | Dynamic sports portfolio (sport groups → tournament sections → masonry grid) | Dark editorial — `body class="theme-dark"` |
| `about.html`, `contact.html` | Redirects to `index.html` anchors. Don't edit. |

The whole site uses the same dark editorial theme. The base light-theme rules (the first ~1360 lines of `css/styles.css`) are still present and would render correctly if `class="theme-dark"` were removed from the body, but in production every page ships with it.

---

## 2. Directory map

```
photography-portfolio/
├── index.html                  # Home page (light theme, do not touch theme)
├── portfolio.html              # Portfolio page (dark theme via body.portfolio-v2)
├── about.html, contact.html    # Stubs
├── css/styles.css              # All styles. Dark portfolio rules are scoped under
│                               #   `body.portfolio-v2` at the bottom of the file.
├── js/
│   ├── site.js                 # All page behavior (nav, slider, lightbox, portfolio render, contact form)
│   └── portfolio-media.js      # GENERATED — Cloudinary URL manifest for portfolio.html
├── scripts/
│   ├── generate-portfolio-manifest.py  # Reads Cloudinary → writes js/portfolio-media.js
│   └── generate-image-manifests.sh     # Builds home-slider + footer-gallery manifests
├── sections/                   # Legacy partials, not currently loaded
├── images/
│   ├── home-slider/manifest.js     # Home slider image list (generated)
│   ├── footer-gallery/manifest.js  # Home footer gallery list (generated)
│   └── logo/                       # Brand + tournament logos
└── sitemap.xml
```

---

## 3. Cloudinary as the source of truth

All portfolio imagery lives in Cloudinary under a single root folder (default: `Portfolio Images`, overridable with `CLOUDINARY_PORTFOLIO_ROOT`).

**The folder structure is two-level — sport, then tournament:**

```
Portfolio Images/
  Cricket/
    DY Patil T20 League/
    Times Shield Div A - Mumbai 2026/
    Irrigation Premier League/
    Corporate Cricket/
    Leagues And Tournaments/
    Kids Cricket/
  Football/
    <tournament folders>
  Kushti/
    <tournament folders>
```

`scripts/generate-portfolio-manifest.py` walks these folders, then writes `js/portfolio-media.js` in this shape:

```js
window.PORTFOLIO_MEDIA = {
  hero: { src, alt },
  sports: [
    {
      name: "Cricket",
      slug: "cricket",
      sections: [
        { title: "DY Patil T20 League", slug: "cricket-dy-patil-t20-league", images: [{src, alt}, ...] },
        ...
      ]
    },
    { name: "Football", slug: "football", sections: [...] },
    { name: "Kushti",   slug: "kushti",   sections: [...] }
  ],
  // Flattened view kept for backwards compatibility / search:
  sections: [ { title, slug, images, sport }, ... ]
};
```

### Regenerate the manifest

```bash
cd /Users/avtrix/Projects/photography-portfolio
export CLOUDINARY_CLOUD_NAME="dtjbyme7m"
export CLOUDINARY_API_KEY="..."
export CLOUDINARY_API_SECRET="..."
python3 scripts/generate-portfolio-manifest.py
```

The script defaults already in the file work for the current account. Add new tournaments by creating the folder in Cloudinary, uploading images, and re-running the script. The site picks them up automatically — no HTML/JS edits needed.

### Backwards-compat note

If `portfolio-media.js` has only the legacy flat `sections` array (no `sports` key), `site.js` wraps everything under a single "Cricket" sport. This means a production deploy without running the new script still renders correctly. **Do not rely on this long-term — re-run the script after the Cloudinary restructure.**

---

## 4. JavaScript contracts — DO NOT BREAK

`js/site.js` is wired up to specific DOM hooks. Removing or renaming any of these silently breaks the site in production. If you touch HTML, preserve these:

### Portfolio dynamic rendering (`renderPortfolioMedia`)

| Hook | Where | Purpose |
|------|-------|---------|
| `[data-portfolio-hero-image]` | `portfolio.html` hero `<img>` | Swapped to the Cloudinary hero URL on load |
| `[data-portfolio-sections]` | `portfolio.html` gallery container | Innerhtml-replaced with sport groups + tournament sections |
| `[data-portfolio-sport-nav]` | `portfolio.html` sticky sub-nav | Innerhtml-replaced with `.sport-nav-chip` anchors |
| `.gallery-item` (on each tile) | Generated card | **Lightbox click delegation depends on this class.** |
| `.portfolio-grid-item` | Generated card | Hover/decoration target for `decoratePortfolioCards` |
| `data-src` / `data-alt` on each tile | Generated card | Lightbox reads these to populate the modal |
| `[data-section-index]` / `[data-pagination]` / `[data-load-more]` | Generated section | Per-section batching of 12 images at a time |

### Home page hooks (`renderHomeMedia`, `setupSlider`)

| Hook | Purpose |
|------|---------|
| `[data-slider-track]` | Slider container — replaced with `.slide-card` items |
| `[data-footer-gallery]` | Footer gallery grid — replaced with `<img>` tiles |
| `.slide-card` + `.slider-lightbox-item` | Slider tiles, also lightbox-triggerable |
| `window.HOME_SLIDER_IMAGES` / `window.FOOTER_GALLERY_IMAGES` | Set by `images/*/manifest.js` |

### Lightbox (`setupLightbox`)

Triggers on `click` events bubbling from `.gallery-item, .slider-lightbox-item`. Required DOM:
- `#lightbox`, `#lightbox-image`, `#lightbox-caption`
- `.lightbox-close`, `.lightbox-prev`, `.lightbox-next`
- `.is-open` class toggles visibility

### Nav (`setupNav`)

Required: `.nav-toggle` (button), `.site-nav` (container). Mobile menu position is computed off the toggle's `getBoundingClientRect`. Both header variants (light home, dark portfolio) reuse these class names — keep it that way.

### Reveal animation (`setupReveal`)

Looks for `.section, .detail-card, .copy-card, .image-card, .slide-card, .footer-panel` and also force-reveals `.portfolio-hero-section, .portfolio-grid-section`. The dark portfolio page keeps the legacy classes on the hero/gallery wrappers so reveal still fires.

### Inquire modal + contact form (`setupInquireModal`, `setupContactForm`)

The inquiry form is no longer an inline page section. It lives inside a modal (`#inquire-modal` → `.inquire-modal__card`) that is **duplicated on both `index.html` and `portfolio.html`**, so any CTA on either page can open it without a page navigation.

- **Trigger contract**: any element with `data-open-inquire` opens the modal. Click handlers `preventDefault()`, so anchors with `href="#inquire-modal"` are SEO-friendly progressive-enhancement targets. Current triggers:
  - Header nav "Inquire" link
  - "Inquire Now →" CTA button at the bottom of each page
- **Close**: `.inquire-modal__close` button, `Esc` keypress, or clicking the backdrop.
- **Focus management**: the first non-hidden form field is focused on open; focus returns to the trigger on close.
- **Body lock**: opening the modal adds `body.modal-open { overflow: hidden }`.

The form itself is the exact same Netlify form as before — `name="inquiry"`, `data-netlify="true"`, hidden honeypot, hidden `form-name` field. `setupContactForm()` still binds to `.contact-form` and posts via `fetch` to the current path (Netlify intercepts by `form-name`). **Do not change the form's `name`, the hidden `form-name` input, or the submit handler — Netlify form aggregation depends on all three.**

Netlify form detection: Netlify scans HTML at build time for `data-netlify="true"`. Having the same form on both pages with the same `name` is safe — Netlify de-dupes by `form-name`.

---

## 5. Dark theme scoping rule

The sitewide dark editorial theme lives at the **bottom of `css/styles.css`** under a single `body.theme-dark` scope, split into two sections:

- **Section A** — Tokens (`--pv2-bg`, `--pv2-gold`, etc.) + portfolio-page element classes (`.portfolio-v2-*`, `.sport-nav-chip`, etc.)
- **Section B** — Home-page overrides (re-skins the original light-theme components: header, slider, profile card, tournament strip, contact form, footer panel)

Both pages carry `<body class="theme-dark">`. Every override is per-rule prefixed:

```css
body.theme-dark .portfolio-v2-hero { ... }
body.theme-dark .copy-card         { ... }
body.theme-dark .contact-form input { ... }
```

The portfolio header uses an extra `.portfolio-v2-header` class so its rules can shadow the home-header rules where they differ. Where a home rule should NOT apply to the portfolio header, use the `:not(.portfolio-v2-header)` qualifier.

**Rules of engagement:**

- Do not move dark-theme rules above the original styles in the file — cascade order is what makes the overrides win.
- Do not remove `class="theme-dark"` from either page body without removing the dark overrides first; the original light theme is still present underneath.
- New dark styles → add under Section A or B with the `body.theme-dark` prefix.
- The original light-theme rules at the top of the file are kept intentionally — they are the foundation the dark theme overrides on top of. **Do not delete them.**

---

## 6. When updating images

| Change | Steps |
|--------|-------|
| New portfolio image / tournament | Upload to the correct Cloudinary `Sport/Tournament/` folder → run `python3 scripts/generate-portfolio-manifest.py` → commit the regenerated `js/portfolio-media.js`. |
| New sport (e.g. Hockey) | Create `Portfolio Images/Hockey/<Tournament>/` in Cloudinary → run the script. The sport-nav chip and gallery group appear automatically. |
| New home-slider image | Drop in `images/home-slider/`, run `sh scripts/generate-image-manifests.sh`. |

Never hand-edit `js/portfolio-media.js` or `images/*/manifest.js`. They are generated.

---

## 7. Deployment notes

- Static hosting (Netlify-friendly). The inquiry form on `index.html` has `data-netlify="true"`.
- No build step. Push to `main` → Netlify (or whatever's wired up) deploys.
- The dark portfolio theme uses CSS columns for masonry — no JS layout library required.
- Cloudinary URLs include `f_auto,q_auto,w_1600` for automatic format/quality + width transforms. Don't strip these.

---

## 8. Tested invariants (don't regress these)

1. `portfolio.html` renders sport groups for whichever sports have Cloudinary data, plus a sticky chip nav that **always shows 🏏 Cricket / ⚽ Football / 🤼 Kushti**. Sports with no data render as disabled "Coming Soon" chips (see `CANONICAL_SPORTS` in `js/site.js`). Add a new canonical sport by editing that array.
2. Clicking a portfolio tile opens the lightbox (works because `.gallery-item` + `data-src` are preserved on every generated tile).
3. Pagination ("Load more from <tournament>") appears only when a tournament has more than 12 images.
4. `index.html` renders in dark theme — slider chrome, profile card, tournament-logo cards, CTA block, and slim footer are all dark. The inline `#inquire` section was removed; the form now lives in a modal opened by any `[data-open-inquire]` trigger on either page. Netlify form submission (`name="inquiry"`, `form-name` hidden input, fetch-then-fallback) is unchanged.
5. Mobile menu toggle works on both pages from the same `setupNav` code.
6. Re-running `generate-portfolio-manifest.py` from a fresh Cloudinary state is idempotent.

If any of these break after a change, revert and re-evaluate before deploying.
