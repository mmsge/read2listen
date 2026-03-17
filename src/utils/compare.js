/**
 * Data transformation and comparison logic.
 * Converts raw Storygraph books and Last.fm tracks into comparable shapes.
 */

/** Format a Date as 'YYYY-MM' */
function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Count books finished per calendar month.
 * Returns { 'YYYY-MM': count }
 */
export function getBooksPerMonth(books) {
  const map = {}
  for (const book of books) {
    for (const date of book.datesRead) {
      const key = monthKey(date)
      map[key] = (map[key] || 0) + 1
    }
  }
  return map
}

/**
 * Count scrobbles per calendar month from Last.fm recent tracks.
 * Returns { 'YYYY-MM': count }
 */
export function getScrobblesPerMonth(tracks) {
  const map = {}
  for (const track of tracks) {
    const ts = track.date?.uts
    if (!ts) continue
    const date = new Date(parseInt(ts, 10) * 1000)
    const key = monthKey(date)
    map[key] = (map[key] || 0) + 1
  }
  return map
}

/**
 * Build aligned monthly data for charting.
 * Returns array of { month, books, scrobbles } sorted chronologically.
 * Only includes months present in either source within the given range.
 */
export function getMonthlyActivity(booksMap, scrobblesMap, fromDate, toDate) {
  const allKeys = new Set([...Object.keys(booksMap), ...Object.keys(scrobblesMap)])

  // Generate all month keys in range
  const from = monthKey(fromDate)
  const to   = monthKey(toDate)

  const result = []
  for (const key of [...allKeys].sort()) {
    if (key < from || key > to) continue
    result.push({
      month:     key,
      books:     booksMap[key] || 0,
      scrobbles: scrobblesMap[key] || 0,
    })
  }
  return result
}

/**
 * Compute summary stats.
 */
export function getSummaryStats(books, tracks, topArtists) {
  const totalBooks      = books.length
  const totalScrobbles  = tracks.length
  const uniqueArtists   = new Set(tracks.map(t => t.artist?.['#text'] || '')).size
  const audioBooks      = books.filter(b => b.format.toLowerCase().includes('audio')).length
  const booksWithDates  = books.filter(b => b.datesRead.length > 0).length

  // Average per month (based on date range of available data)
  const allDates = books.flatMap(b => b.datesRead).map(d => d.getTime())
  const trackDates = tracks.map(t => parseInt(t.date?.uts || '0', 10) * 1000).filter(Boolean)
  const allTimestamps = [...allDates, ...trackDates]

  let avgBooksPerMonth = 0
  let avgScrobblesPerMonth = 0

  if (allTimestamps.length > 0) {
    const minTs = Math.min(...allTimestamps)
    const maxTs = Math.max(...allTimestamps)
    const months = Math.max(1, (maxTs - minTs) / (1000 * 60 * 60 * 24 * 30))
    avgBooksPerMonth     = booksWithDates ? (booksWithDates / months) : 0
    avgScrobblesPerMonth = totalScrobbles ? (totalScrobbles / months) : 0
  }

  return {
    totalBooks,
    totalScrobbles,
    uniqueArtists,
    audioBooks,
    avgBooksPerMonth: Math.round(avgBooksPerMonth * 10) / 10,
    avgScrobblesPerMonth: Math.round(avgScrobblesPerMonth),
  }
}

/**
 * Reading format breakdown.
 * Returns [{ label, count, pct }]
 */
export function getFormatBreakdown(books) {
  const counts = {}
  for (const book of books) {
    const fmt = book.format || 'Unknown'
    counts[fmt] = (counts[fmt] || 0) + 1
  }
  const total = books.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
}

/**
 * Top moods from Storygraph data.
 * Returns [{ mood, count }] sorted by count desc.
 */
export function getMoodSummary(books) {
  const counts = {}
  for (const book of books) {
    for (const mood of book.moods) {
      counts[mood] = (counts[mood] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([mood, count]) => ({ mood, count }))
}

/**
 * Most-read authors.
 * Returns [{ name, count }] sorted by count desc.
 */
export function getTopAuthors(books, limit = 5) {
  const counts = {}
  for (const book of books) {
    const name = (book.authors || '').trim()
    if (name) counts[name] = (counts[name] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

/**
 * Find the month with most books / most scrobbles.
 */
export function getMostActiveMonth(map) {
  let best = null
  let bestCount = 0
  for (const [month, count] of Object.entries(map)) {
    if (count > bestCount) { bestCount = count; best = month }
  }
  if (!best) return null
  const [y, m] = best.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1)
  return {
    label: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
    count: bestCount,
  }
}
