/**
 * Overview view — summary stat cards and format breakdown.
 */

import {
  getSummaryStats,
  getFormatBreakdown,
  getMoodSummary,
  getBooksPerMonth,
  getScrobblesPerMonth,
  getMostActiveMonth,
} from '../utils/compare.js'
import { horizontalBarChart } from '../charts/svg.js'

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function statPair(reading, listening) {
  return `<div class="stat-pair">
    <div class="stat-card reading">
      <div class="stat-label">${reading.label}</div>
      <div class="stat-value">${reading.value}</div>
      ${reading.sub ? `<div class="stat-label" style="margin-top:2px">${reading.sub}</div>` : ''}
    </div>
    <div class="stat-card listening">
      <div class="stat-label">${listening.label}</div>
      <div class="stat-value">${listening.value}</div>
      ${listening.sub ? `<div class="stat-label" style="margin-top:2px">${listening.sub}</div>` : ''}
    </div>
  </div>`
}

export function renderOverview(books, tracks, topArtists) {
  const stats      = getSummaryStats(books, tracks, topArtists)
  const formats    = getFormatBreakdown(books)
  const moods      = getMoodSummary(books)
  const booksMap   = getBooksPerMonth(books)
  const scrobsMap  = getScrobblesPerMonth(tracks)
  const bestBook   = getMostActiveMonth(booksMap)
  const bestScrob  = getMostActiveMonth(scrobsMap)

  const formatChart = formats.length
    ? `<div class="chart-wrap">${horizontalBarChart(formats)}</div>`
    : '<p style="color:var(--clr-muted);font-size:.875rem">No format data available</p>'

  const moodTags = moods.length
    ? `<div class="tags">${moods.map(m =>
        `<span class="tag">${m.mood} <span style="opacity:.6;margin-left:4px">${m.count}</span></span>`
      ).join('')}</div>`
    : '<p style="color:var(--clr-muted);font-size:.875rem">No mood data in CSV</p>'

  return `<div class="container stack">
    <h2>Your habits at a glance</h2>

    ${statPair(
      { label: 'Books read', value: fmtNum(stats.totalBooks) },
      { label: 'Scrobbles', value: fmtNum(stats.totalScrobbles) }
    )}

    ${statPair(
      { label: 'Books / month', value: stats.avgBooksPerMonth.toFixed(1) },
      { label: 'Scrobbles / mo', value: fmtNum(stats.avgScrobblesPerMonth) }
    )}

    ${statPair(
      {
        label: 'Most active month',
        value: bestBook ? bestBook.count : '—',
        sub: bestBook ? bestBook.label : 'no date data',
      },
      {
        label: 'Most active month',
        value: bestScrob ? fmtNum(bestScrob.count) : '—',
        sub: bestScrob ? bestScrob.label : 'no data',
      }
    )}

    ${stats.totalBooks > 0 ? statPair(
      { label: 'Unique artists', value: '—' },
      { label: 'Unique artists', value: fmtNum(stats.uniqueArtists) }
    ) : ''}

    <div class="card">
      <div class="section-header">
        <h3>Reading format</h3>
      </div>
      ${formatChart}
    </div>

    ${moods.length > 0 ? `<div class="card">
      <div class="section-header"><h3>Reading moods</h3></div>
      ${moodTags}
    </div>` : ''}

    <div class="legend">
      <span class="legend-item"><span class="legend-dot reading"></span>Reading</span>
      <span class="legend-item"><span class="legend-dot listening"></span>Listening</span>
    </div>
  </div>`
}
