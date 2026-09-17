# Dima Livak — Portfolio

Personal portfolio for **Dima Livak**, a Computer Science & AI student (University of Kent), hosted on GitHub Pages.

A dark, terminal-styled single-page site with a self-typing hero, an animated neural-network background, and — most importantly — **three live, interactive demos** that run entirely in the browser (no backend).

## Live demos

| Demo | Path | What it does |
|------|------|--------------|
| **AI call triage** | `projects/call-triage.html` | A recreation of the call-routing system built at Apex27. Play a preset caller (or type your own) and watch it get "transcribed", scored against intent patterns, and routed in real time. |
| **Neural net playground** | `projects/neural-net.html` | A real `2→4→1` backprop network trained live in the browser. Place data points on a canvas and watch the decision boundary, weights, and loss update per frame. No ML frameworks. |
| **Estate agency website** | `projects/estate-agency/` | A complete estate agency site (search, filters, sort, pagination, property pages, valuation & contact forms) running 100% client-side on a real data snapshot of the Apex27 Portal API. |

## Structure

```
.
├── index.html                 # portfolio home (hero, about, experience, demos, skills, education, contact)
├── favicon.svg
├── Dima_Livak_CV.pdf          # downloadable CV
└── projects/
    ├── call-triage.html
    ├── neural-net.html
    └── estate-agency/
        ├── index.html         # home: hero search, featured, stats
        ├── listings.html      # search + filters + sort + pagination
        ├── property.html      # detail page (reads ?id=)
        ├── valuation.html     # valuation request form
        ├── contact.html       # contact form
        ├── data.js            # real data snapshot (see note below)
        ├── favicon.svg
        ├── css/styles.css
        └── js/agency.js       # client-side rendering / filter / sort / routing
```

## About the estate-agency data

`projects/estate-agency/data.js` is a one-time **snapshot** of the Apex27 Portal API (78 listings + full property details, captured live). The site is fully static — GitHub Pages can't run a backend and the API isn't CORS-open to arbitrary origins — so all search/filter/sort/pagination/rendering happens in `js/agency.js` against this snapshot. Forms are illustrative (they show a "demo mode" notice instead of submitting).

**To refresh the data**, re-run a fetch against the Apex27 Portal API (endpoints `get-search-options`, `get-listings`, `get-listing`, `get-statistics`) and regenerate `data.js` in the same shape:

```js
window.AGENCY_DATA = {
  options:   { transactionTypes, propertyTypes, cities, ... },
  stats:     { sale: {...}, rent: {...} },
  searchIndex: [ { ..., __tt: "sale", propertyTypeValue: "detached_house", thumbnailUrl: "..." } ],
  listings:  { "<id>": { ...full detail... } }
}
```

## Publishing (GitHub Pages)

This repo is a **user site** — when pushed to a repo named `plompee.github.io`, the site is served from the repository root at `https://<username>.github.io`.

1. Create a new public repo named `plompee.github.io` on GitHub (do not add a README).
2. `git remote add origin https://github.com/<username>/plompee.github.io.git`
3. `git push -u origin main`
4. If Pages isn't live within a minute: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.

## Local preview

```
python3 -m http.server 8090
# open http://127.0.0.1:8090
```

Built with plain HTML, CSS and JavaScript.
