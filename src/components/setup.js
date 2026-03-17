/**
 * Setup screen — 3 steps:
 * 1. Last.fm credentials
 * 2. Storygraph CSV upload
 * 3. Date range for history (with "Match my books" option)
 */

import { setRaw, get as cacheGet } from '../utils/cache.js'
import { LastFmClient } from '../utils/lastfm.js'
import { parseStorygraph } from '../utils/storygraph.js'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  }
}

/**
 * Compute the date range covered by a parsed books array.
 * Returns { from, to } as 'YYYY-MM-DD' strings, or null if no dated books.
 */
function getBookDateRange(books) {
  const allDates = books.flatMap(b => b.datesRead)
  if (!allDates.length) return null
  const timestamps = allDates.map(d => d.getTime())
  const min = new Date(Math.min(...timestamps))
  const max = new Date(Math.max(...timestamps))
  return {
    from: min.toISOString().slice(0, 10),
    to:   max.toISOString().slice(0, 10),
  }
}

export class SetupController {
  constructor(container, onComplete) {
    this.container  = container
    this.onComplete = onComplete
    this.step       = 1
    this.state      = {
      username:  cacheGet('cfg_username') || '',
      apiKey:    cacheGet('cfg_apikey')   || '',
      dateRange: cacheGet('cfg_dates')    || defaultDateRange(),
      books:     null,
    }
    this.render()
  }

  render() {
    this.container.innerHTML = `
      <div class="setup-header">
        <div class="logo">read<span>2</span>listen</div>
        <p style="margin-top:8px;font-size:.9rem">Compare your reading &amp; listening habits</p>
      </div>

      <div class="setup-steps" aria-hidden="true">
        <div class="step-indicator ${this.step >= 1 ? 'done' : ''}"></div>
        <div class="step-indicator ${this.step >= 2 ? 'done' : this.step === 2 ? 'current' : ''}"></div>
        <div class="step-indicator ${this.step >= 3 ? 'done' : this.step === 3 ? 'current' : ''}"></div>
      </div>

      <div class="container stack" id="setup-body">
        ${this.renderStep()}
      </div>
    `
    this.bindStep()
  }

  renderStep() {
    switch (this.step) {
      case 1: return this.renderStep1()
      case 2: return this.renderStep2()
      case 3: return this.renderStep3()
    }
  }

  renderStep1() {
    return `
      <div>
        <h2>Connect Last.fm</h2>
        <p style="margin-top:4px;font-size:.875rem">Your credentials are stored locally and never sent anywhere except Last.fm.</p>
      </div>

      <div class="form-group">
        <label for="lfm-user">Last.fm username</label>
        <input id="lfm-user" type="text" autocomplete="username"
          placeholder="e.g. musiclover42" value="${this.state.username}" />
      </div>

      <div class="form-group">
        <label for="lfm-key">Last.fm API key</label>
        <input id="lfm-key" type="password" autocomplete="off"
          placeholder="32-character API key" value="${this.state.apiKey}" />
        <p style="font-size:.8rem;color:var(--clr-muted)">
          Get a free API key at <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener">last.fm/api</a>
        </p>
      </div>

      <div id="step1-msg"></div>

      <button class="btn btn-primary" id="btn-verify">
        Test connection &amp; continue
      </button>
    `
  }

  renderStep2() {
    const existing = cacheGet('storygraph_books')
    return `
      <div>
        <h2>Upload Storygraph export</h2>
        <p style="margin-top:4px;font-size:.875rem">
          Export your library from Storygraph: <em>Manage Account → Manage Your Data → Export StoryGraph Library</em>
        </p>
      </div>

      ${existing ? `<div class="alert alert-success">
        <span>✓</span>
        <span>A saved export was found (${existing.length} books). You can re-upload to refresh it.</span>
      </div>` : ''}

      <div class="dropzone" id="dropzone" role="button" tabindex="0"
        aria-label="Upload Storygraph CSV file">
        <div class="icon">📚</div>
        <p><strong>Tap to choose file</strong> or drag &amp; drop</p>
        <p style="font-size:.75rem;opacity:.7">CSV file from Storygraph</p>
        <input type="file" id="file-input" accept=".csv" style="display:none" />
      </div>

      <div id="step2-msg"></div>

      ${existing ? `<button class="btn btn-primary" id="btn-use-existing">
        Use saved data (${existing.length} books)
      </button>` : ''}

      <button class="btn btn-ghost" id="btn-back-1">← Back</button>
    `
  }

  renderStep3() {
    const { from, to } = this.state.dateRange

    // Compute book date range for the "match" preset
    const books = this.state.books || cacheGet('storygraph_books')
    const bookRange = books ? getBookDateRange(books) : null

    return `
      <div>
        <h2>Choose date range</h2>
        <p style="margin-top:4px;font-size:.875rem">
          Select how far back to fetch your Last.fm listening history.
          Longer ranges take more time to load.
        </p>
      </div>

      <div class="form-group">
        <label for="date-from">From</label>
        <input id="date-from" type="date" value="${from}" max="${to}" />
      </div>

      <div class="form-group">
        <label for="date-to">To</label>
        <input id="date-to" type="date" value="${to}" min="${from}" />
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" data-preset="1y">Last year</button>
        <button class="btn btn-secondary btn-sm" data-preset="3y">3 years</button>
        <button class="btn btn-secondary btn-sm" data-preset="all">All time</button>
        ${bookRange ? `<button class="btn btn-secondary btn-sm" data-preset="books"
          title="Match the date range of your Storygraph data (${bookRange.from} → ${bookRange.to})">
          Match my books
        </button>` : ''}
      </div>

      ${bookRange ? `<p style="font-size:.8rem;color:var(--clr-muted)">
        Your Storygraph data spans <strong>${bookRange.from}</strong> → <strong>${bookRange.to}</strong>
      </p>` : ''}

      <button class="btn btn-primary" id="btn-date-next">Continue</button>
      <button class="btn btn-ghost" id="btn-back-2">← Back</button>
    `
  }

  bindStep() {
    const body = this.container.querySelector('#setup-body')

    if (this.step === 1) {
      const btn = body.querySelector('#btn-verify')
      btn.addEventListener('click', () => this.verifyLastFm())

      body.querySelector('#lfm-user').addEventListener('keydown', e => {
        if (e.key === 'Enter') body.querySelector('#lfm-key').focus()
      })
      body.querySelector('#lfm-key').addEventListener('keydown', e => {
        if (e.key === 'Enter') this.verifyLastFm()
      })
    }

    if (this.step === 2) {
      const dropzone  = body.querySelector('#dropzone')
      const fileInput = body.querySelector('#file-input')

      dropzone.addEventListener('click', () => fileInput.click())
      dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click() })

      dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over') })
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'))
      dropzone.addEventListener('drop', e => {
        e.preventDefault()
        dropzone.classList.remove('drag-over')
        const file = e.dataTransfer?.files[0]
        if (file) this.handleFile(file)
      })

      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) this.handleFile(fileInput.files[0])
      })

      body.querySelector('#btn-use-existing')?.addEventListener('click', () => {
        const existing = cacheGet('storygraph_books')
        if (existing) {
          this.state.books = existing
          this.step = 3
          this.render()
        }
      })

      body.querySelector('#btn-back-1').addEventListener('click', () => {
        this.step = 1
        this.render()
      })
    }

    if (this.step === 3) {
      const fromInput = body.querySelector('#date-from')
      const toInput   = body.querySelector('#date-to')

      const books = this.state.books || cacheGet('storygraph_books')
      const bookRange = books ? getBookDateRange(books) : null

      body.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset
          if (preset === 'books' && bookRange) {
            fromInput.value = bookRange.from
            toInput.value   = bookRange.to
          } else {
            const to = new Date()
            const from = new Date()
            if (preset === '1y')  from.setFullYear(to.getFullYear() - 1)
            if (preset === '3y')  from.setFullYear(to.getFullYear() - 3)
            if (preset === 'all') from.setFullYear(2002)
            fromInput.value = from.toISOString().slice(0, 10)
            toInput.value   = to.toISOString().slice(0, 10)
          }
        })
      })

      body.querySelector('#btn-date-next').addEventListener('click', () => {
        this.state.dateRange = { from: fromInput.value, to: toInput.value }
        setRaw('cfg_dates', this.state.dateRange)
        const books = this.state.books || cacheGet('storygraph_books')
        this.onComplete(books, this.state)
      })

      body.querySelector('#btn-back-2').addEventListener('click', () => {
        this.step = 2
        this.render()
      })
    }
  }

  async verifyLastFm() {
    const body    = this.container.querySelector('#setup-body')
    const msg     = body.querySelector('#step1-msg')
    const btnEl   = body.querySelector('#btn-verify')
    const user    = body.querySelector('#lfm-user').value.trim()
    const key     = body.querySelector('#lfm-key').value.trim()

    if (!user || !key) {
      msg.innerHTML = `<div class="alert alert-error">Please enter both username and API key.</div>`
      return
    }

    btnEl.disabled = true
    btnEl.textContent = 'Connecting…'
    msg.innerHTML = ''

    try {
      const client = new LastFmClient(key, user)
      const info = await client.getInfo()

      setRaw('cfg_username', user)
      setRaw('cfg_apikey', key)
      this.state.username = user
      this.state.apiKey   = key

      msg.innerHTML = `<div class="alert alert-success">
        ✓ Connected as <strong>${info.name}</strong>
        — ${parseInt(info.playcount).toLocaleString()} total scrobbles
      </div>`

      setTimeout(() => { this.step = 2; this.render() }, 900)
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-error">⚠️ ${err.message}</div>`
      btnEl.disabled = false
      btnEl.textContent = 'Test connection & continue'
    }
  }

  handleFile(file) {
    const body = this.container.querySelector('#setup-body')
    const msg  = body.querySelector('#step2-msg')

    if (!file.name.endsWith('.csv')) {
      msg.innerHTML = `<div class="alert alert-error">Please upload a .csv file.</div>`
      return
    }

    msg.innerHTML = `<div class="alert alert-info">Reading file…</div>`

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const books = parseStorygraph(e.target.result)
        if (!books.length) {
          msg.innerHTML = `<div class="alert alert-error">
            No "Read" books found in this CSV. Make sure you exported your full library from Storygraph.
          </div>`
          return
        }
        setRaw('storygraph_books', books)
        this.state.books = books
        msg.innerHTML = `<div class="alert alert-success">✓ Loaded ${books.length} books</div>`
        setTimeout(() => { this.step = 3; this.render() }, 600)
      } catch (err) {
        msg.innerHTML = `<div class="alert alert-error">Failed to parse CSV: ${err.message}</div>`
      }
    }
    reader.onerror = () => {
      msg.innerHTML = `<div class="alert alert-error">Could not read file.</div>`
    }
    reader.readAsText(file)
  }
}
