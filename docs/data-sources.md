# Data Sources

read2listen pulls data from two sources: **Last.fm** (via API) and **Storygraph** (via CSV export). Both are handled entirely client-side.

---

## Last.fm

### Getting an API Key

1. Log in to [last.fm](https://www.last.fm).
2. Go to [last.fm/api/account/create](https://www.last.fm/api/account/create).
3. Fill in the application name (e.g. "read2listen") and submit.
4. Copy the **API key** shown on the next screen.

> The API key is free and rate-limited to approximately 5 requests per second. read2listen adds a 200 ms delay between requests to stay well within limits.

### What Gets Fetched

| Data | API Method | Used For |
|------|-----------|----------|
| User info | `user.getInfo` | Credential verification |
| Recent tracks | `user.getRecentTracks` | Monthly scrobble counts (Timeline, Overview) |
| Top artists | `user.getTopArtists` | Top Artists list |
| Top albums | `user.getTopAlbums` | Top Albums list |

### Date Range Options

When selecting a date range in Setup Step 3, the app fetches only the scrobbles within that window:

| Option | Behaviour |
|--------|-----------|
| Last year | `from = today − 1 year` |
| Last 3 years | `from = today − 3 years` |
| All time | No `from` filter — fetches entire history |
| Match my books | `from/to` derived from earliest/latest book finish date |

### Pagination

`user.getRecentTracks` returns up to 200 tracks per page. For large histories the client fetches all pages sequentially, reporting progress via a callback used to update the loading bar.

### Caching

Responses are cached in localStorage with a 24-hour TTL. Cache keys follow the pattern:

```
r2l_lfm_recenttracks_{username}_{from}_{to}_{page}
r2l_lfm_topartists_{username}_{period}
r2l_lfm_topalbums_{username}_{period}
```

To force a fresh fetch, clear localStorage or wait for the TTL to expire.

---

## Storygraph CSV

### Exporting Your Data

1. Log in to [app.thestorygraph.com](https://app.thestorygraph.com).
2. Click your avatar → **Profile**.
3. Scroll to **Export your data** and click the export button.
4. Download the `.csv` file that is emailed or offered as a direct download.

### CSV Format

The parser (`src/utils/storygraph.js`) expects a CSV with at least the following columns (case-insensitive):

| Column | Required | Description |
|--------|----------|-------------|
| `Title` | Yes | Book title |
| `Authors` | Yes | Pipe- or comma-separated author names |
| `Read Status` | Yes | Only rows with value `Read` are imported |
| `Date Read` or `Last Date Read` | Yes | ISO date string(s); `Dates Read` supports multiple ranges separated by `\|` with `to` keyword |
| `Formats` | No | `Physical`, `Digital`, or `Audiobook` |
| `Moods` | No | Comma-separated mood tags |
| `Read Count` | No | Integer, defaults to 1 |
| `Pace` | No | `slow`, `medium`, or `fast` |

### Parsing Rules

- **Encoding**: UTF-8; Windows (`\r\n`) and Unix (`\n`) line endings are both supported.
- **Quoting**: Standard CSV quoting — fields may be wrapped in `"` and contain escaped `""` pairs.
- **Status filter**: Only rows where `Read Status === "Read"` are kept; DNF, Want To Read, etc. are ignored.
- **Date fallback**: If `Dates Read` is empty the parser uses `Last Date Read` as the finish date.
- **Multiple reads**: If `Dates Read` contains multiple ranges the book generates one entry per read.

### Parsed Book Object

```js
{
  title: "Piranesi",
  authors: ["Susanna Clarke"],
  format: "Physical",
  datesRead: [
    { from: "2021-11-01", to: "2021-11-14" }
  ],
  moods: ["mysterious", "reflective", "dark"],
  readCount: 1,
  pace: "fast"
}
```

### Privacy

The CSV is parsed entirely in the browser. The file contents are never uploaded to any server. Parsed book data is stored in your browser's localStorage under the key `r2l_storygraph_books`.
