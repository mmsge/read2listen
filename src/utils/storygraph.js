/**
 * Storygraph CSV export parser.
 *
 * Expected columns (order may vary):
 *   Title, Authors, Contributors, ISBN/UID, Format, Read Status,
 *   Date Added, Last Date Read, Dates Read, Read Count,
 *   Moods, Pace, Character- or Plot-Driven?, Strong Character Development?,
 *   Loveable Characters?, Diverse Characters?
 */

/**
 * Minimal CSV parser that handles:
 * - Quoted fields (including commas inside quotes)
 * - Escaped quotes ("")
 * - Windows/Unix line endings
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const rows = []

  for (const line of lines) {
    if (!line.trim()) continue
    const fields = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { field += '"'; i++ }
          else inQuotes = false
        } else {
          field += ch
        }
      } else {
        if (ch === '"') { inQuotes = true }
        else if (ch === ',') { fields.push(field); field = '' }
        else { field += ch }
      }
    }
    fields.push(field)
    rows.push(fields)
  }

  return rows
}

/**
 * Parse a date string from Storygraph export.
 * Handles "YYYY-MM-DD" and partial dates.
 */
function parseDate(str) {
  if (!str || !str.trim()) return null
  const s = str.trim()
  // Try ISO format first
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  return null
}

/**
 * Parse the "Dates Read" field which can contain multiple date ranges
 * separated by "|". Each range can be "YYYY-MM-DD to YYYY-MM-DD" or a single date.
 * Returns array of Date objects (the "end" date of each reading).
 */
function parseDatesRead(str) {
  if (!str || !str.trim()) return []
  const dates = []
  const parts = str.split('|').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const rangeParts = part.split(/\s+to\s+/)
    // Use the end date of the range (when they finished)
    const dateStr = rangeParts[rangeParts.length - 1]
    const d = parseDate(dateStr)
    if (d) dates.push(d)
  }
  return dates
}

/**
 * Parse moods field — comma-separated list of mood strings.
 */
function parseMoods(str) {
  if (!str || !str.trim()) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Normalise a CSV row (given header→index map) to a book object.
 */
function normaliseRow(row, headers) {
  const col = (name) => {
    const idx = headers[name.toLowerCase()]
    return idx !== undefined ? (row[idx] || '').trim() : ''
  }

  const status = col('read status')
  if (status.toLowerCase() !== 'read') return null

  const datesRead = parseDatesRead(col('dates read'))
  // If no dates read, try last date read
  if (datesRead.length === 0) {
    const fallback = parseDate(col('last date read'))
    if (fallback) datesRead.push(fallback)
  }

  return {
    title:     col('title'),
    authors:   col('authors'),
    format:    col('format') || 'Unknown',       // Physical, Digital, Audio
    status,
    readCount: parseInt(col('read count') || '1', 10),
    datesRead,                                    // array of finish dates
    moods:     parseMoods(col('moods')),
    pace:      col('pace'),
  }
}

/**
 * Parse a Storygraph CSV string.
 * Returns array of normalised book objects (read books only).
 */
export function parseStorygraph(csvText) {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return []

  // Build header→index map (case-insensitive)
  const headers = {}
  rows[0].forEach((h, i) => { headers[h.toLowerCase().trim()] = i })

  const books = []
  for (let i = 1; i < rows.length; i++) {
    const book = normaliseRow(rows[i], headers)
    if (book && book.title) books.push(book)
  }
  return books
}
