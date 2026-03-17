# read2listen

A lightweight web app that compares your **reading habits** (via Storygraph) and **listening habits** (via Last.fm) side by side — no backend required.

![Overview of reading vs listening stats](docs/assets/overview-screenshot.png)

## Features

- **Overview** — side-by-side summary stats: total books, scrobbles, monthly averages, most active months, reading formats, and mood tags
- **Timeline** — dual bar chart of books read vs. scrobbles per month, with absolute and normalised views
- **Top Items** — top 5 authors, artists, albums, and most-reread books
- **Zero server** — all data lives in your browser (localStorage); credentials never leave your device except to call Last.fm's own API
- **Privacy-first** — Storygraph data is parsed locally from a CSV you export yourself
- **Eco-friendly dark theme** — dark-first design with auto light mode via `prefers-color-scheme`

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |

A **Last.fm account** and a free **Last.fm API key** are required. A **Storygraph account** with at least one book marked as "Read" is required for book data.

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/read2listen.git
cd read2listen

# 2. Install dependencies (dev only — Vite)
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running in Production

```bash
# Build optimised static files
npm run build

# Preview the production build locally
npm run preview
```

The `dist/` folder contains a fully static site — deploy it to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## First-Time Setup (In-App)

The app walks you through a 3-step setup wizard on first launch:

### Step 1 — Connect Last.fm
1. Go to [last.fm/api/account/create](https://www.last.fm/api/account/create) and create a free API application to get an API key.
2. Enter your **Last.fm username** and **API key** in the setup form.
3. Click **Verify** — the app will confirm your credentials are valid.

### Step 2 — Upload Storygraph Data
1. Log in to [app.thestorygraph.com](https://app.thestorygraph.com).
2. Go to **Profile → Export your data** and download the CSV file.
3. Upload the CSV in the setup form. Only books with status **"Read"** are imported.

### Step 3 — Choose a Date Range
Select how much of your Last.fm history to load:
- **Last year** / **Last 3 years** / **All time** — fixed presets
- **Match my books** — automatically uses the date range of your Storygraph data

Click **Start comparing** and the app fetches your scrobbles (this may take a moment for large histories).

---

## Project Structure

```
read2listen/
├── src/
│   ├── main.js               # App entry point & state machine
│   ├── components/
│   │   ├── setup.js          # 3-step setup wizard
│   │   ├── dashboard.js      # Main app controller & data orchestration
│   │   ├── nav.js            # Bottom navigation bar
│   │   ├── overview.js       # Summary stats view
│   │   ├── timeline.js       # Monthly activity chart view
│   │   └── topItems.js       # Top authors, artists, albums, books
│   ├── utils/
│   │   ├── compare.js        # Data transformation & analysis
│   │   ├── lastfm.js         # Last.fm API client
│   │   ├── storygraph.js     # Storygraph CSV parser
│   │   └── cache.js          # localStorage wrapper with TTL
│   ├── charts/
│   │   └── svg.js            # Inline SVG chart generators
│   └── styles/
│       └── main.css          # All styles (dark + light themes)
├── index.html                # App shell
├── vite.config.js            # Vite build config
├── package.json
└── docs/                     # Extended documentation
```

---

## Documentation

Extended documentation lives in [`/docs`](docs/):

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | App state machine, module responsibilities, data flow |
| [Data Sources](docs/data-sources.md) | Last.fm API integration and Storygraph CSV format |
| [Components](docs/components.md) | UI component reference |
| [Configuration](docs/configuration.md) | localStorage keys, caching, and theming |
| [Examples](docs/examples/) | Sample data and usage walkthroughs |

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| UI framework | Vanilla JS (ES modules) | No build overhead, tiny bundle |
| Build tool | Vite 5 | Fast HMR in dev, optimised prod builds |
| Charts | Custom inline SVG | No chart library dependency |
| Styling | Plain CSS + custom properties | Theme switching without JS |
| Storage | Browser localStorage | No backend needed |
| Fonts | System font stack | No external requests |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Serve the `dist/` build locally |

---

## License

MIT
