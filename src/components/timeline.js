/**
 * Timeline view — dual bar chart of books vs scrobbles per month.
 */

import { getBooksPerMonth, getScrobblesPerMonth, getMonthlyActivity } from '../utils/compare.js'
import { dualBarChart } from '../charts/svg.js'

export function renderTimeline(books, tracks, fromDate, toDate) {
  const booksMap  = getBooksPerMonth(books)
  const scrobsMap = getScrobblesPerMonth(tracks)
  const monthly   = getMonthlyActivity(booksMap, scrobsMap, fromDate, toDate)

  let mode = 'absolute'

  function chartSection() {
    const chart = monthly.length
      ? dualBarChart(monthly, mode)
      : '<div class="empty"><div class="icon">📊</div><p>No overlapping activity data found</p></div>'

    return `<div class="chart-wrap">${chart}</div>`
  }

  const container = document.createElement('div')
  container.className = 'container stack'
  container.innerHTML = `
    <div>
      <h2>Activity over time</h2>
      <p style="font-size:.875rem;margin-top:4px">
        Books finished vs scrobbles per month
      </p>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="legend-dot reading"></span>Books finished</span>
      <span class="legend-item"><span class="legend-dot listening"></span>Scrobbles</span>
    </div>

    <div class="toggle-group">
      <button class="toggle-btn active" data-mode="absolute">Absolute</button>
      <button class="toggle-btn" data-mode="normalised">Normalised</button>
    </div>

    <div class="card" id="timeline-chart-wrap">
      ${chartSection()}
    </div>

    <div class="alert alert-info" style="font-size:.8125rem">
      <span>ℹ️</span>
      <span><strong>Normalised view</strong> scales both series to their own max, making activity patterns comparable regardless of volume differences.</span>
    </div>
  `

  // Bind toggle
  container.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode
      container.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b === btn))
      container.querySelector('#timeline-chart-wrap').innerHTML = chartSection()
    })
  })

  return container
}
