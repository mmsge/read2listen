/**
 * Last.fm API client.
 * All requests are GET with JSON format — no OAuth required for public data.
 * Rate limit: 5 req/s. We queue requests with 200ms spacing to be safe.
 */

import { get as cacheGet, set as cacheSet, TTL_24H } from './cache.js'

const BASE = 'https://ws.audioscrobbler.com/2.0/'
const DELAY_MS = 200

let lastRequestTime = 0

async function throttledFetch(url) {
  const now = Date.now()
  const wait = DELAY_MS - (now - lastRequestTime)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequestTime = Date.now()

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json.error) throw new Error(`Last.fm error ${json.error}: ${json.message}`)
  return json
}

function buildUrl(method, params) {
  const url = new URL(BASE)
  url.searchParams.set('method', method)
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  return url.toString()
}

export class LastFmClient {
  constructor(apiKey, username) {
    this.apiKey = apiKey
    this.username = username
  }

  async call(method, extra = {}) {
    const params = { api_key: this.apiKey, user: this.username, ...extra }
    const url = buildUrl(method, params)
    const cacheKey = `lfm_${method}_${JSON.stringify(extra)}_${this.username}`
    const cached = cacheGet(cacheKey)
    if (cached) return cached
    const data = await throttledFetch(url)
    cacheSet(cacheKey, data, TTL_24H)
    return data
  }

  /** Verify credentials — returns user info object or throws */
  async getInfo() {
    const data = await this.call('user.getInfo')
    return data.user
  }

  /**
   * Fetch all recent tracks within a date range.
   * Calls onProgress(fetched, total) during pagination.
   * Returns flat array of track objects.
   */
  async getRecentTracks(fromDate, toDate, onProgress) {
    const from = Math.floor(fromDate.getTime() / 1000)
    const to   = Math.floor(toDate.getTime() / 1000)
    const limit = 200
    const allTracks = []
    let page = 1
    let totalPages = 1

    do {
      const cacheKey = `lfm_recenttracks_${this.username}_${from}_${to}_p${page}`
      let pageData = cacheGet(cacheKey)

      if (!pageData) {
        const raw = await throttledFetch(
          buildUrl('user.getRecentTracks', {
            api_key: this.apiKey,
            user: this.username,
            from,
            to,
            limit,
            page,
            extended: 0,
          })
        )
        pageData = raw.recenttracks
        cacheSet(cacheKey, pageData, TTL_24H)
      }

      const attrs = pageData['@attr'] || {}
      totalPages = parseInt(attrs.totalPages || '1', 10)
      const tracks = Array.isArray(pageData.track)
        ? pageData.track
        : pageData.track ? [pageData.track] : []

      // Skip "nowplaying" track
      const completed = tracks.filter(t => !t['@attr']?.nowplaying)
      allTracks.push(...completed)

      if (onProgress) onProgress(page, totalPages)
      page++
    } while (page <= totalPages)

    return allTracks
  }

  /** Top artists for a period ('7day','1month','3month','6month','12month','overall') */
  async getTopArtists(period = '12month', limit = 20) {
    const data = await this.call('user.getTopArtists', { period, limit })
    return data.topartists?.artist || []
  }

  /** Top albums */
  async getTopAlbums(period = '12month', limit = 10) {
    const data = await this.call('user.getTopAlbums', { period, limit })
    return data.topalbums?.album || []
  }
}
