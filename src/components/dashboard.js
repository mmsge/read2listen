/**
 * Dashboard — orchestrates data fetching and view rendering.
 * Shows a loading screen while fetching Last.fm data, then renders the chosen view.
 */

import { renderNav, bindNav } from './nav.js'
import { renderOverview }     from './overview.js'
import { renderTimeline }     from './timeline.js'
import { renderTopItems }     from './topItems.js'
import { LastFmClient }       from '../utils/lastfm.js'
import { get as cacheGet, set as cacheSet, TTL_24H } from '../utils/cache.js'

export class Dashboard {
  constructor(container, books, config) {
    this.container  = container
    this.books      = books
    this.config     = config
    this.activeView = 'overview'
    this.tracks     = null
    this.topArtists = null
    this.topAlbums  = null
    this.fromDate   = new Date(config.dateRange.from)
    this.toDate     = new Date(config.dateRange.to)

    this.loadAndRender()
  }

  renderLoading(page, totalPages) {
    const pct = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0
    this.container.innerHTML = `
      <div class="loading-screen">
        <div class="loading-title">Fetching your Last.fm history…</div>
        <div class="loading-sub" id="load-sub">
          ${totalPages > 0
            ? `Page ${page} of ${totalPages}`
            : 'Starting…'}
        </div>
        <div class="progress-wrap" style="width:200px;margin-top:8px">
          <div class="progress-bar" id="load-bar" style="width:${pct}%"></div>
        </div>
        <p style="font-size:.8rem;color:var(--clr-muted);margin-top:16px">
          Large histories may take a moment.<br>Results are cached for 24 hours.
        </p>
      </div>
    `
  }

  updateLoadingProgress(page, totalPages) {
    const sub = this.container.querySelector('#load-sub')
    const bar = this.container.querySelector('#load-bar')
    if (sub) sub.textContent = `Page ${page} of ${totalPages}`
    if (bar) bar.style.width = `${Math.round((page / totalPages) * 100)}%`
  }

  async loadAndRender() {
    this.renderLoading(0, 0)

    const client = new LastFmClient(this.config.apiKey, this.config.username)

    try {
      // Fetch recent tracks (paginated)
      const tracksKey = `lfm_tracks_${this.config.username}_${this.config.dateRange.from}_${this.config.dateRange.to}`
      let tracks = cacheGet(tracksKey)

      if (!tracks) {
        this.renderLoading(0, 1)
        tracks = await client.getRecentTracks(
          this.fromDate,
          this.toDate,
          (page, total) => this.updateLoadingProgress(page, total)
        )
        cacheSet(tracksKey, tracks, TTL_24H)
      }

      this.tracks = tracks

      // Fetch top artists and albums in parallel (these are small requests)
      const [topArtists, topAlbums] = await Promise.all([
        client.getTopArtists('12month', 20),
        client.getTopAlbums('12month', 10),
      ])

      this.topArtists = topArtists
      this.topAlbums  = topAlbums

    } catch (err) {
      this.container.innerHTML = `
        <div class="container stack" style="padding-top:48px">
          <div class="alert alert-error">
            <span>⚠️</span>
            <span>Failed to load Last.fm data: ${err.message}</span>
          </div>
          <button class="btn btn-secondary" id="btn-retry">Retry</button>
          <button class="btn btn-ghost" id="btn-reset">← Back to setup</button>
        </div>
      `
      this.container.querySelector('#btn-retry')?.addEventListener('click', () => this.loadAndRender())
      this.container.querySelector('#btn-reset')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('r2l:reset'))
      })
      return
    }

    this.render()
  }

  render() {
    this.container.innerHTML = ''

    // Persistent header
    const header = document.createElement('div')
    header.className = 'app-header'
    header.innerHTML = `
      <span class="app-logo">read<span>2</span>listen</span>
      <button class="btn btn-ghost btn-sm" id="btn-settings" title="Settings / Reset">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Settings
      </button>
    `
    header.querySelector('#btn-settings').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('r2l:reset'))
    })

    const main = document.createElement('div')
    main.className = 'grow'
    main.style.paddingBottom = '0'

    const navEl = document.createElement('div')
    navEl.innerHTML = renderNav(this.activeView)
    const nav = navEl.firstElementChild

    this.container.appendChild(header)
    this.container.appendChild(main)
    this.container.appendChild(nav)

    bindNav(nav, (view) => {
      this.activeView = view
      this.renderView(main)
      // Update nav active state
      nav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view)
        btn.setAttribute('aria-current', btn.dataset.view === view ? 'page' : 'false')
      })
    })

    this.renderView(main)
  }

  renderView(main) {
    switch (this.activeView) {
      case 'overview':
        main.innerHTML = renderOverview(this.books, this.tracks, this.topArtists)
        break

      case 'timeline': {
        const el = renderTimeline(this.books, this.tracks, this.fromDate, this.toDate)
        main.innerHTML = ''
        main.appendChild(el)
        break
      }

      case 'top':
        main.innerHTML = renderTopItems(this.books, this.topArtists, this.topAlbums)
        break
    }

    // Reset scroll to top on view change
    main.scrollTop = 0
    window.scrollTo(0, 0)
  }
}
