/**
 * read2listen — entry point.
 *
 * App states:
 *  - setup:     First visit or incomplete config
 *  - dashboard: Config + books loaded, showing comparison views
 */

import { SetupController } from './components/setup.js'
import { Dashboard }        from './components/dashboard.js'
import { get as cacheGet, clearAll } from './utils/cache.js'

const app = document.getElementById('app')

function boot() {
  // Check for existing config and data
  const username = cacheGet('cfg_username')
  const apiKey   = cacheGet('cfg_apikey')
  const books    = cacheGet('storygraph_books')
  const dates    = cacheGet('cfg_dates')

  if (username && apiKey && books && dates) {
    showDashboard(books, { username, apiKey, dateRange: dates })
  } else {
    showSetup()
  }
}

function showSetup() {
  app.innerHTML = ''
  // eslint-disable-next-line no-new
  new SetupController(app, (books, config) => {
    showDashboard(books, config)
  })
}

function showDashboard(books, config) {
  app.innerHTML = ''
  // eslint-disable-next-line no-new
  new Dashboard(app, books, config)
}

// Allow resetting back to setup from dashboard
window.addEventListener('r2l:reset', () => {
  showSetup()
})

// Add a "reset / re-configure" option accessible from the header
// (rendered inside views via a small settings link)
window.addEventListener('r2l:clear', () => {
  clearAll()
  showSetup()
})

boot()
