# Dima Livak — Portfolio

Personal portfolio for **Dima Livak**, a Computer Science & AI student (University of Kent), hosted on GitHub Pages.

A clean, dark single-page site: an animated AI-receptionist call feed in the hero, a scroll-driven **skills film** (five scenes that play forward and backward with the scrollbar), project cards with looping screen recordings, and — most importantly — **five live, interactive demos** that run entirely in the browser (no backend).

## Featured project

**[AI Receptionist Studio](https://github.com/plompee/ai-receptionist)** — a configurable AI phone receptionist (Node.js + Claude API). It runs on a server with an API key, so the portfolio shows a labelled demo recording (`assets/video/receptionist.mp4`) and links to the repository.

## Live demos

| Demo | Path | What it does |
|------|------|--------------|
| **AI call triage** | `projects/call-triage.html` | A recreation of the call-routing system built at Apex27. Play a preset caller (or type your own) and watch it get "transcribed", scored against intent patterns, and routed in real time. |
| **Neural net playground** | `projects/neural-net.html` | A real `2→4→1` backprop network trained live in the browser. Place data points on a canvas and watch the decision boundary, weights, and loss update per frame. No ML frameworks. |
| **Murmuration** | `projects/murmuration.html` | Thousands of boids flocking with separation, alignment and cohesion, using a spatial hash for fast neighbour lookups. Your cursor is a falcon the flock flees from; sliders change the rules live. |
| **Pathfinding race** | `projects/pathfinding.html` | BFS, Dijkstra, A* and greedy best-first race on the same editable map (walls, weighted mud, draggable start/goal), one cell per tick. Shows that the fastest search is not always the cheapest route. Binary-heap priority queue; each algorithm is a step-by-step generator. |
| **Estate agency website** | `projects/estate-agency/` | A complete estate agency site (search, filters, sort, pagination, property pages, valuation & contact forms) running 100% client-side on a real data snapshot of the Apex27 Portal API. |

## Structure

```
.
├── index.html                 # portfolio home (hero, skills film, projects, experience, education, contact)
├── style.css                  # design tokens, layout, responsive nav, hero feed, film scenes
├── script.js                  # nav, scroll reveals, card videos, skills film engine, hero call feed
├── favicon.svg
├── Dima_Livak_CV.pdf          # downloadable CV
├── assets/video/              # looping demo recordings + posters for the project cards
└── projects/
    ├── call-triage.html
    ├── neural-net.html
    ├── murmuration.html
    ├── pathfinding.html
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
