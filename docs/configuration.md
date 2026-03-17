# Configuration

read2listen stores all configuration in the browser's **localStorage**. There is no server-side config, no `.env` file, and no build-time secrets.

---

## localStorage Keys

All keys are prefixed with `r2l_` to avoid collisions.

| Key | Type | Description | TTL |
|-----|------|-------------|-----|
| `r2l_cfg_username` | `string` | Last.fm username | None (persists) |
| `r2l_cfg_apikey` | `string` | Last.fm API key | None (persists) |
| `r2l_cfg_dates` | `JSON` | Date range `{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }` | None (persists) |
| `r2l_storygraph_books` | `JSON` | Parsed books array | None (until re-upload) |
| `r2l_lfm_recenttracks_*` | `JSON` | Paginated scrobble results | 24 hours |
| `r2l_lfm_topartists_*` | `JSON` | Top artists response | 24 hours |
| `r2l_lfm_topalbums_*` | `JSON` | Top albums response | 24 hours |

### Cache Object Shape

Cached values are stored as a JSON envelope:

```json
{
  "data": { ... },
  "expires": 1710000000000
}
```

`cache.js` reads `expires` (Unix ms timestamp) on every get and returns `null` if expired, triggering a fresh API call.

---

## Resetting the App

To start over completely, open the browser console and run:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('r2l_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

This clears all stored credentials, book data, and API caches.

To clear only the API cache (force re-fetch from Last.fm while keeping credentials):

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('r2l_lfm_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## Theming

Colours are defined as CSS custom properties in `src/styles/main.css`.

### Dark Theme (default)

```css
:root {
  --clr-bg:        #0f1a0f;   /* deep forest green-black */
  --clr-surface:   #1a2e1a;   /* card/panel background */
  --clr-text:      #e8f5e8;   /* primary text */
  --clr-muted:     #6b8f6b;   /* secondary text */
  --clr-accent-1:  #4caf50;   /* reading (green) */
  --clr-accent-2:  #2196f3;   /* listening (blue) */
}
```

### Light Theme (auto)

Applied automatically when `prefers-color-scheme: light` is detected:

```css
@media (prefers-color-scheme: light) {
  :root {
    --clr-bg:       #f5f9f5;
    --clr-surface:  #ffffff;
    --clr-text:     #1a2e1a;
    --clr-muted:    #4a6f4a;
    /* accent colours unchanged */
  }
}
```

To force a specific theme, override the custom properties in the browser DevTools or add a stylesheet.

---

## Build-Time Configuration

`vite.config.js` exposes no user-configurable options beyond the Vite defaults. The relevant settings are:

```js
// vite.config.js
export default {
  build: {
    target: 'es2020',
    minify: 'esbuild'
  }
}
```

If you need to deploy to a sub-path (e.g. `https://example.com/read2listen/`), set the `base` option:

```js
export default {
  base: '/read2listen/',
  build: {
    target: 'es2020',
    minify: 'esbuild'
  }
}
```
