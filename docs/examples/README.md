# Examples

This folder contains sample data and walkthroughs to help you understand what read2listen expects and produces.

---

## Files

| File | Description |
|------|-------------|
| [`storygraph-sample.csv`](storygraph-sample.csv) | A sample Storygraph CSV export with 10 books |
| [`comparison-data.md`](comparison-data.md) | Walkthrough of the data output after processing the sample CSV |

---

## Using the Sample CSV

You can upload `storygraph-sample.csv` directly in the Setup wizard (Step 2) to test the app without needing a real Storygraph export. You will still need a real Last.fm username and API key for Step 1.

The sample contains books read between **November 2021** and **September 2023**, which means:

- Choosing **"Match my books"** in Step 3 will set the date range to `2021-11-01 → 2023-09-01`.
- Choosing **"Last year"** will only overlap partially with the book data.

---

## Example Walkthrough

### 1. What the CSV Parser Produces

After uploading `storygraph-sample.csv`, the app stores a books array like this:

```js
[
  {
    title: "The Name of the Wind",
    authors: ["Patrick Rothfuss"],
    format: "Physical",
    datesRead: [{ from: "2022-09-01", to: "2022-09-28" }],
    moods: ["adventurous", "mysterious"],
    readCount: 1,
    pace: "fast"
  },
  {
    title: "Piranesi",
    authors: ["Susanna Clarke"],
    format: "Physical",
    datesRead: [{ from: "2021-11-01", to: "2021-11-14" }],
    moods: ["mysterious", "reflective", "dark"],
    readCount: 1,
    pace: "fast"
  },
  // ... 8 more books
]
```

### 2. What the Monthly Aggregator Produces

`compare.js` converts the books array into monthly buckets (finish-date is used):

```js
[
  { month: "2021-11", books: 1, scrobbles: 843 },
  { month: "2022-09", books: 1, scrobbles: 1021 },
  { month: "2023-01", books: 1, scrobbles: 1389 },
  { month: "2023-02", books: 1, scrobbles: 987 },
  { month: "2023-03", books: 0, scrobbles: 1102 },
  { month: "2023-04", books: 2, scrobbles: 923 },
  { month: "2023-05", books: 1, scrobbles: 1203 },
  { month: "2023-06", books: 1, scrobbles: 876 },
  { month: "2023-07", books: 1, scrobbles: 1441 },
  { month: "2023-08", books: 0, scrobbles: 1312 },
  { month: "2023-09", books: 1, scrobbles: 988 }
]
```

> Note: `scrobbles` values above are illustrative — actual values come from your Last.fm history.

### 3. Overview Stats Example

With the sample data, the Overview tab would show something like:

```
Reading                    Listening
───────────────────────    ───────────────────────
10 books                   38,201 scrobbles
0.9 / month                3,183 / month
Most active: Apr 2023      Most active: Jul 2023

Format Breakdown
████████████████░░░░░   Physical  5 (50%)
░░░░░████████████░░░░   Digital   4 (40%)
░░░░░░░░░░░████████░   Audiobook 1 (10%)

Moods
emotional × 6   mysterious × 3   reflective × 5
adventurous × 2   dark × 3   funny × 2   ...
```

### 4. Timeline (Normalised View)

In normalised mode, the chart scales each series independently so you can compare *patterns* rather than raw counts:

```
Apr 2023: ████████ 2 books / ░░░░░ 923 scrobbles
Jul 2023: ████ 1 book    / ████████ 1441 scrobbles  (listening peak)
Jan 2023: ████ 1 book    / ███████ 1389 scrobbles
```

This makes it easy to see whether your reading and listening activity tend to rise and fall together or inversely.
