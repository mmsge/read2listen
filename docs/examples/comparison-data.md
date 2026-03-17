# Comparison Data Walkthrough

This document shows the complete data transformation pipeline using the sample CSV (`storygraph-sample.csv`) as input.

---

## Step 1 — Raw Input

**Storygraph CSV** (10 books, 2021–2023)

| Title | Finish Date | Format | Moods |
|-------|------------|--------|-------|
| Piranesi | 2021-11-14 | Physical | mysterious, reflective, dark |
| The Name of the Wind | 2022-09-28 | Physical | adventurous, mysterious |
| The Midnight Library | 2023-01-20 | Digital | emotional, hopeful, reflective |
| Project Hail Mary | 2023-02-22 | Physical | adventurous, funny, tense |
| Pachinko | 2023-04-05 | Digital | emotional, dark, reflective |
| Mexican Gothic | 2023-04-28 | Physical | dark, mysterious, tense |
| The Hitchhiker's Guide | 2023-05-10 | Digital | funny, adventurous |
| Crying in H Mart | 2023-06-18 | Audiobook | emotional, reflective, sad |
| The Seven Husbands… | 2023-07-20 | Digital | emotional, funny, romantic |
| Tomorrow and Tomorrow | 2023-09-01 | Physical | emotional, hopeful, reflective |

**Last.fm date range**: 2021-11-01 → 2023-09-01 (matched to books)

---

## Step 2 — Parsed Books Array

```js
const books = [
  {
    title: "Piranesi",
    authors: ["Susanna Clarke"],
    format: "Physical",
    datesRead: [{ from: "2021-11-01", to: "2021-11-14" }],
    moods: ["mysterious", "reflective", "dark"],
    readCount: 1,
    pace: "fast"
  },
  {
    title: "The Name of the Wind",
    authors: ["Patrick Rothfuss"],
    format: "Physical",
    datesRead: [{ from: "2022-09-01", to: "2022-09-28" }],
    moods: ["adventurous", "mysterious"],
    readCount: 1,
    pace: "fast"
  },
  // ... remaining 8 books
];
```

---

## Step 3 — Monthly Aggregates

`compare.js` groups books by finish month and merges with Last.fm scrobbles:

```js
const monthly = [
  { month: "2021-11", books: 1, scrobbles: 843  },
  { month: "2021-12", books: 0, scrobbles: 1204 },
  { month: "2022-01", books: 0, scrobbles: 987  },
  // months with no books are included if scrobbles exist
  { month: "2022-09", books: 1, scrobbles: 1021 },
  { month: "2023-01", books: 1, scrobbles: 1389 },
  { month: "2023-02", books: 1, scrobbles: 987  },
  { month: "2023-04", books: 2, scrobbles: 923  },
  { month: "2023-05", books: 1, scrobbles: 1203 },
  { month: "2023-06", books: 1, scrobbles: 876  },
  { month: "2023-07", books: 1, scrobbles: 1441 },
  { month: "2023-09", books: 1, scrobbles: 988  }
];
```

---

## Step 4 — Summary Statistics

```js
const stats = {
  // Reading
  totalBooks: 10,
  booksPerMonth: 0.9,          // 10 books / ~11 months with activity
  mostActiveReadingMonth: "2023-04",  // 2 books finished

  // Listening
  totalScrobbles: 38201,
  scrobblesPerMonth: 3183,
  mostActiveListeningMonth: "2023-07", // 1441 scrobbles

  // Format breakdown
  formatBreakdown: {
    Physical: 4,
    Digital: 4,
    Audiobook: 1
  },

  // Mood frequency map (sorted by count)
  moods: {
    emotional:   6,
    reflective:  5,
    dark:        3,
    mysterious:  3,
    adventurous: 2,
    funny:       2,
    hopeful:     2,
    tense:       2,
    sad:         1,
    romantic:    1
  }
};
```

---

## Step 5 — Top Items

### Top Authors (by books read)

| # | Author | Books |
|---|--------|-------|
| 1 | Susanna Clarke | 1 |
| 1 | Patrick Rothfuss | 1 |
| 1 | Matt Haig | 1 |
| 1 | Andy Weir | 1 |
| 1 | Min Jin Lee | 1 |

> With only one book per author, all tie at rank 1. The app shows the first 5 alphabetically or in parse order.

### Most-Read Books (by readCount)

| # | Title | Times Read |
|---|-------|-----------|
| 1 | The Hitchhiker's Guide to the Galaxy | 2 |
| 2 | Piranesi | 1 |
| 2 | The Name of the Wind | 1 |
| … | … | … |

### Top Artists & Albums

These come from Last.fm's `user.getTopArtists` and `user.getTopAlbums` API calls and are entirely dependent on your personal Last.fm history — they are not derived from the sample CSV.

---

## Normalised vs. Absolute Timeline

### Absolute

```
Month     Books  Scrobbles
2023-04:  ██     ░░░░░░░░░░░░░░░  (2 / 923)
2023-07:  █      ████████████████  (1 / 1441)
2023-01:  █      ██████████████    (1 / 1389)
```

Reading and listening are on different scales — it's hard to compare visually.

### Normalised

Each series is independently scaled so its maximum = 100%.

```
Month     Books (max=2)  Scrobbles (max=1441)
2023-04:  ████████████   ████████
2023-07:  ██████         ████████████████
2023-01:  ██████         ██████████████
```

Now patterns are directly comparable: April was the peak reading month; July was the peak listening month.
