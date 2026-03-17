/**
 * Lightweight inline SVG chart helpers.
 * No dependencies. Returns SVG string to be set as innerHTML.
 *
 * Design: dark/eco-friendly by default, uses CSS custom properties
 * so charts respect the user's color scheme.
 */

const READING_COLOR   = 'var(--clr-accent-1)'
const LISTENING_COLOR = 'var(--clr-accent-2)'
const TEXT_COLOR      = 'var(--clr-muted)'
const GRID_COLOR      = 'var(--clr-border)'

/** Escape SVG text content */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Dual-bar chart: reading vs listening per month.
 *
 * @param {Array<{month: string, books: number, scrobbles: number}>} data
 * @param {'absolute'|'normalised'} mode
 */
export function dualBarChart(data, mode = 'absolute') {
  if (!data.length) return '<p class="empty">No data available</p>'

  const PAD_L = 38, PAD_R = 8, PAD_T = 12, PAD_B = 52
  const BAR_GAP = 3
  const GROUP_GAP = 6

  // Normalise if requested
  let chartData = data
  if (mode === 'normalised') {
    const maxBooks     = Math.max(...data.map(d => d.books), 1)
    const maxScrobbles = Math.max(...data.map(d => d.scrobbles), 1)
    chartData = data.map(d => ({
      ...d,
      books:     d.books / maxBooks,
      scrobbles: d.scrobbles / maxScrobbles,
    }))
  }

  const maxVal = mode === 'normalised'
    ? 1
    : Math.max(...data.map(d => Math.max(d.books, d.scrobbles)), 1)

  // Chart will be rendered at 480 logical units wide, height 220
  const W = 480
  const H = 220
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const n = data.length
  const groupW = innerW / n
  const barW   = Math.max(2, (groupW - GROUP_GAP * 2 - BAR_GAP) / 2)

  // Y-axis grid lines
  const TICKS = 4
  let gridLines = ''
  let yLabels = ''
  for (let i = 0; i <= TICKS; i++) {
    const y = PAD_T + innerH - (i / TICKS) * innerH
    gridLines += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}"
      stroke="${GRID_COLOR}" stroke-width="0.5" stroke-dasharray="3 3"/>`
    if (mode === 'absolute') {
      const val = Math.round((i / TICKS) * maxVal)
      yLabels += `<text x="${PAD_L - 4}" y="${y + 4}" text-anchor="end"
        fill="${TEXT_COLOR}" font-size="9">${val}</text>`
    } else if (i === TICKS) {
      yLabels += `<text x="${PAD_L - 4}" y="${y + 4}" text-anchor="end"
        fill="${TEXT_COLOR}" font-size="9">max</text>`
    }
  }

  // Bars and x-axis labels
  let bars = ''
  let xLabels = ''

  for (let i = 0; i < n; i++) {
    const d = chartData[i]
    const raw = data[i]
    const x = PAD_L + i * groupW + GROUP_GAP

    const booksH  = (d.books     / maxVal) * innerH
    const scrobH  = (d.scrobbles / maxVal) * innerH

    const booksY  = PAD_T + innerH - booksH
    const scrobY  = PAD_T + innerH - scrobH

    bars += `<rect x="${x}" y="${booksY}" width="${barW}" height="${booksH}"
      fill="${READING_COLOR}" opacity="0.85" rx="1">
      <title>${raw.month}: ${raw.books} book${raw.books !== 1 ? 's' : ''}</title>
    </rect>`

    bars += `<rect x="${x + barW + BAR_GAP}" y="${scrobY}" width="${barW}" height="${scrobH}"
      fill="${LISTENING_COLOR}" opacity="0.85" rx="1">
      <title>${raw.month}: ${raw.scrobbles.toLocaleString()} scrobbles</title>
    </rect>`

    // X label — show month short name, every 2nd if many
    if (n <= 14 || i % 2 === 0) {
      const [yr, mo] = raw.month.split('-')
      const lbl = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleDateString('en', { month: 'short' })
      const lblYear = mo === '01' ? `\n${yr}` : ''
      xLabels += `<text x="${x + barW}" y="${PAD_T + innerH + 14}"
        text-anchor="middle" fill="${TEXT_COLOR}" font-size="9">${esc(lbl)}</text>`
      if (mo === '01' || i === 0) {
        xLabels += `<text x="${x + barW}" y="${PAD_T + innerH + 25}"
          text-anchor="middle" fill="${TEXT_COLOR}" font-size="8" opacity="0.7">${yr}</text>`
      }
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Monthly activity comparison chart">
    ${gridLines}
    ${yLabels}
    ${bars}
    ${xLabels}
  </svg>`
}

/**
 * Horizontal bar chart for format breakdown.
 * @param {Array<{label: string, count: number, pct: number}>} data
 * @param {string} color  CSS color value
 */
export function horizontalBarChart(data, color = READING_COLOR) {
  if (!data.length) return '<p class="empty">No data</p>'

  const ROW_H = 28
  const PAD_L = 72, PAD_R = 50, PAD_T = 8
  const W = 340
  const H = PAD_T + data.length * ROW_H

  const maxPct = Math.max(...data.map(d => d.pct), 1)
  const innerW = W - PAD_L - PAD_R

  let rows = ''
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    const y = PAD_T + i * ROW_H
    const barW = (d.pct / maxPct) * innerW

    rows += `<text x="${PAD_L - 6}" y="${y + 17}" text-anchor="end"
      fill="${TEXT_COLOR}" font-size="11">${esc(d.label)}</text>`

    rows += `<rect x="${PAD_L}" y="${y + 6}" width="${barW}" height="14"
      fill="${color}" opacity="0.8" rx="3">
      <title>${d.label}: ${d.count} (${d.pct}%)</title>
    </rect>`

    rows += `<text x="${PAD_L + barW + 6}" y="${y + 17}"
      fill="${TEXT_COLOR}" font-size="10">${d.pct}%</text>`
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Format breakdown chart">
    ${rows}
  </svg>`
}

/**
 * Mini sparkline for a series of numbers.
 * Returns an inline SVG string suitable for embedding in a stat card.
 */
export function sparkline(values, color = READING_COLOR, width = 80, height = 24) {
  if (values.length < 2) return ''
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${color}"
      stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`
}
