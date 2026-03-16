# Photography Portfolio

A premium-feeling static photography website for GoldMonkVisuals, built with HTML, CSS, and vanilla JavaScript.

## Features

- Single-page homepage with section-based navigation
- Separate sports portfolio page with lightbox viewing
- Modular homepage sections loaded from separate files in `sections/`
- Homepage slider and footer gallery driven by image manifests
- Mobile menu, smooth scrolling, and scroll-in reveal effects
- Netlify-ready inquiry form for static hosting

## Project Structure

```text
photography-portfolio/
  images/
    home-slider/
    footer-gallery/
    Portfolio/
  data/
  css/
    styles.css
  js/
    site.js
  admin/
    index.html
    config.yml
  admin.html
  index.html
  portfolio.html
  scripts/
    generate-image-manifests.sh
    generate-portfolio-manifest.py
  README.md
```

## Running Locally

Because this is a static site, you can open `index.html` directly in a browser, or serve the folder with any static file server.

Example:

```bash
cd photography-portfolio
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Homepage Content Admin

The homepage is now data-driven and reads from:

- [`data/site-content.json`](/Users/avtrix/Projects/photography-portfolio/data/site-content.json)
- [`data/home-media.json`](/Users/avtrix/Projects/photography-portfolio/data/home-media.json)

The Git-based admin route is:

- [`admin/`](/Users/avtrix/Projects/photography-portfolio/admin)

Decap CMS is configured in:

- [`admin/config.yml`](/Users/avtrix/Projects/photography-portfolio/admin/config.yml)

This admin flow is now intended for Netlify + Git-based editing rather than local file writes.

### Netlify Setup

To make the CMS work on Netlify:

1. Deploy the site to Netlify
2. Enable `Identity`
3. Enable `Git Gateway`
4. Invite your admin user through Netlify Identity
5. Open `/admin/` on the deployed site and log in

After login, edits are committed back to the Git repo and Netlify redeploys the site automatically.

### Local Preview

You can still preview the public site locally:

```bash
cd /Users/avtrix/Projects/photography-portfolio
python3 -m http.server 8000
```

Then open:

- [http://localhost:8000](http://localhost:8000)

The CMS can update:

- brand text
- navigation labels
- About Me text
- inquiry text
- footer text and links
- homepage carousel images
- footer gallery images

## Updating Homepage Images

Put homepage slider images in [`images/home-slider`](/Users/avtrix/Projects/photography-portfolio/images/home-slider) and footer strip images in [`images/footer-gallery`](/Users/avtrix/Projects/photography-portfolio/images/footer-gallery).

Then regenerate the manifests:

```bash
cd photography-portfolio
sh scripts/generate-image-manifests.sh
```

The homepage now reads image lists from:

- [`data/home-media.json`](/Users/avtrix/Projects/photography-portfolio/data/home-media.json)

## Updating Portfolio Images

The portfolio page reads from the generated manifest in [`js/portfolio-media.js`](/Users/avtrix/Projects/photography-portfolio/js/portfolio-media.js).

Generate that file automatically from Cloudinary with:

```bash
cd /Users/avtrix/Projects/photography-portfolio
export CLOUDINARY_CLOUD_NAME="dtjbyme7m"
export CLOUDINARY_API_KEY="your_api_key"
export CLOUDINARY_API_SECRET="your_api_secret"
python3 scripts/generate-portfolio-manifest.py
```

By default, the script reads child folders under:

```text
Portfolio Images
```

Each child folder becomes a portfolio heading such as `DY Patil` or `Kids Cricket`, and the images in that folder are rendered underneath it.

If you want a different root folder, set:

```bash
export CLOUDINARY_PORTFOLIO_ROOT="Portfolio Images"
```

The website stays fully static: the script pulls from Cloudinary locally, writes a static manifest file, and the frontend reads only that generated file.

## Updating the Inquiry Form

The inquiry form in [`contact.html`](/Users/avtrix/Projects/photography-portfolio/contact.html) is set up for Netlify Forms:

```html
<form class="contact-form" name="inquiry" method="POST" data-netlify="true">
```

If you deploy on Netlify, submissions can be collected without adding a backend. If you plan to host somewhere else, swap the form configuration for your preferred provider such as Formspree.

## Deployment

This site is ready to host on:

- GitHub Pages
- Netlify
- Vercel

## Future Expansion

The current structure keeps content separated from styling and behavior, making it easy to later add:

- Online booking
- Client galleries
- Paid downloads
- Print store or e-commerce pages
