# Components

All UI components live in `src/components/`. Each is a plain JavaScript class or module that owns its own DOM subtree.

---

## SetupController (`setup.js`)

Manages the 3-step first-run wizard.

### Steps

| Step | Purpose | Key Actions |
|------|---------|-------------|
| 1 | Last.fm credentials | Enter username + API key, click Verify to confirm they work |
| 2 | Storygraph CSV | Upload export file; parser runs immediately and shows book count |
| 3 | Date range | Choose preset or let "Match my books" derive the range from book data |

### Emitted Events

| Event | Payload | When |
|-------|---------|------|
| `setup:complete` | `{ config, books }` | User completes Step 3 and clicks "Start comparing" |

### Validation

- Step 1 calls `lastfm.getInfo()` and blocks progress on API error.
- Step 2 calls `parseStorygraph()` and blocks progress if zero books are found.
- Step 3 pre-fills the date range when "Match my books" is selected and shows a tooltip with the computed range.

---

## DashboardController (`dashboard.js`)

Orchestrates post-setup data fetching and view rendering.

### Lifecycle

1. On mount, reads config + books from localStorage.
2. Calls `lastfm.getRecentTracks()` with a progress callback.
3. Displays a loading screen with a progress bar while fetching.
4. On success, calls `compare.buildComparisonData()` and renders the nav + first view.
5. Listens for nav tab changes and swaps the active view.
6. The "Settings" button transitions back to the Setup state.

### Child Components

- `NavComponent` — bottom tab bar
- `OverviewComponent` — Overview tab content
- `TimelineComponent` — Timeline tab content
- `TopItemsComponent` — Top Items tab content

---

## NavComponent (`nav.js`)

A bottom navigation bar with three tabs.

| Tab | Icon | View |
|-----|------|------|
| Overview | 📊 | Summary stats |
| Timeline | 📅 | Monthly activity chart |
| Top Items | 🏆 | Top authors/artists/albums/books |

Emits a `nav:change` custom event with the selected tab name whenever the user taps a tab.

---

## OverviewComponent (`overview.js`)

Renders the **Overview** tab.

### Sections

| Section | Description |
|---------|-------------|
| Stat cards | Side-by-side reading vs listening numbers (totals, monthly averages, most active month) |
| Format breakdown | Horizontal bar chart of Physical / Digital / Audio books |
| Mood tags | Tag cloud of all mood tags from Storygraph, sized by frequency |

### Props (from `compare.buildComparisonData()`)

```js
{
  totalBooks: 47,
  totalScrobbles: 38201,
  booksPerMonth: 3.9,
  scrobblesPerMonth: 3183,
  mostActiveReadingMonth: "2023-03",
  mostActiveListeningMonth: "2023-01",
  formatBreakdown: { Physical: 22, Digital: 19, Audio: 6 },
  moods: { adventurous: 12, dark: 9, mysterious: 7, ... }
}
```

---

## TimelineComponent (`timeline.js`)

Renders the **Timeline** tab — a dual bar chart comparing monthly books and scrobbles.

### Modes

| Mode | Description |
|------|-------------|
| Absolute | Each bar's height represents the actual count |
| Normalised | Bars are scaled so the maximum of each series equals 100% — useful for spotting patterns when counts differ by orders of magnitude |

A toggle button switches between modes. The current mode is preserved in component state.

### Chart Behaviour

- X-axis: months (YYYY-MM labels; every other label shown for wide datasets to avoid crowding)
- Y-axis: implicit from bar height
- Bars: reading bars use `--clr-accent-1` (green), listening bars use `--clr-accent-2` (blue)
- Built by `svg.js` — returns an inline `<svg>` string injected into the DOM

---

## TopItemsComponent (`topItems.js`)

Renders the **Top Items** tab — ranked lists for four categories.

| List | Source | Ranked By |
|------|--------|-----------|
| Top Authors | Storygraph books | Number of books read |
| Top Artists | Last.fm `user.getTopArtists` | Play count |
| Top Albums | Last.fm `user.getTopAlbums` | Play count |
| Most Read Books | Storygraph books | Read count (for re-reads) |

Each list shows the top 5 entries with a horizontal bar indicating relative magnitude.

---

## SVG Charts (`charts/svg.js`)

Low-level chart helpers used by `timeline.js` and `overview.js`. All functions return SVG markup as a string.

| Function | Output |
|----------|--------|
| `barChart(months, readingSeries, listeningeSeries, options)` | Grouped bar chart |
| `horizontalBar(value, max, color)` | Single horizontal progress bar |

Charts use CSS custom properties (`var(--clr-accent-1)`, etc.) so they automatically respect the dark/light theme.
