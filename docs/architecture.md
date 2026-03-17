# Architecture

## Overview

read2listen is a single-page application (SPA) built with vanilla JavaScript and Vite. It has no runtime server — all logic runs in the browser, data is stored in localStorage, and the only external network calls go to the Last.fm public API.

---

## App State Machine

The app operates as a simple two-state machine defined in `src/main.js`:

```
┌──────────┐   config + books present   ┌───────────┐
│  SETUP   │ ─────────────────────────► │ DASHBOARD │
│          │ ◄───────────────────────── │           │
└──────────┘   user clicks "Settings"   └───────────┘
```

| State | Condition | Controller |
|-------|-----------|------------|
| `setup` | First visit, missing API key, or missing books | `SetupController` |
| `dashboard` | Config and books are present in localStorage | `DashboardController` |

The root `main.js` reads localStorage on page load, decides which state applies, and mounts the appropriate controller.

---

## Module Responsibilities

### Entry Point

| File | Role |
|------|------|
| `src/main.js` | Reads saved config, decides initial state, mounts the active controller |

### Components (`src/components/`)

| File | Role |
|------|------|
| `setup.js` | Renders and drives the 3-step setup wizard; validates credentials; persists config |
| `dashboard.js` | Fetches Last.fm data, manages the loading state, renders the nav + active view |
| `nav.js` | Bottom navigation bar; emits tab-change events consumed by `dashboard.js` |
| `overview.js` | Renders the Overview tab (stat cards, format bar chart, mood tags) |
| `timeline.js` | Renders the Timeline tab (dual SVG bar chart, absolute/normalised toggle) |
| `topItems.js` | Renders the Top Items tab (top authors, artists, albums, books) |

### Utilities (`src/utils/`)

| File | Role |
|------|------|
| `lastfm.js` | Last.fm API client — credential verification, paginated scrobble fetching, top-artist/album queries |
| `storygraph.js` | CSV parser — reads Storygraph export and returns a normalised array of book objects |
| `compare.js` | Data transformation — converts raw books + scrobbles into monthly aggregates and summary statistics |
| `cache.js` | localStorage wrapper with per-entry TTL (default 24 h); used by the Last.fm client |

### Charts (`src/charts/`)

| File | Role |
|------|------|
| `svg.js` | Functions that return `<svg>` strings for bar charts and horizontal progress bars |

---

## Data Flow

```
User uploads CSV          User enters Last.fm creds
      │                           │
      ▼                           ▼
storygraph.js               lastfm.js
(parse CSV → books[])     (fetch scrobbles → tracks[])
      │                           │
      └──────────┬────────────────┘
                 ▼
           compare.js
  (monthly aggregates, summary stats)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
overview.js  timeline.js  topItems.js
(render)     (render)     (render)
```

### Book Object (after parsing)

```js
{
  title: "The Name of the Wind",
  authors: ["Patrick Rothfuss"],
  format: "Physical",          // "Physical" | "Digital" | "Audio"
  datesRead: [
    { from: "2023-01-15", to: "2023-02-03" }
  ],
  moods: ["adventurous", "mysterious"],
  readCount: 1,
  pace: "medium"
}
```

### Monthly Aggregate (from `compare.js`)

```js
{
  month: "2023-01",            // YYYY-MM
  books: 2,                    // books finished in this month
  scrobbles: 1843              // Last.fm scrobbles in this month
}
```

---

## Caching Strategy

All Last.fm API responses are cached in localStorage via `cache.js`:

- **TTL**: 24 hours per entry
- **Key prefix**: `r2l_lfm_*`
- **Invalidation**: Automatic on read if the entry is expired; manual via clearing localStorage

The Storygraph CSV is parsed once and stored under `r2l_storygraph_books` with no TTL (persists until the user re-uploads).

---

## Build Configuration

`vite.config.js` sets:

- **Target**: ES2020 (modern browsers only)
- **Minifier**: esbuild (fast, no Babel)
- **Output**: `dist/` — a fully self-contained static site
- No plugins or special transforms are required
