/**
 * Top Items view — most-read authors vs top Last.fm artists, plus top books.
 */

import { getTopAuthors } from '../utils/compare.js'

function listItem(rank, title, sub, count) {
  return `<div class="list-item">
    <span class="list-rank">${rank}</span>
    <div class="list-info">
      <div class="list-title">${title}</div>
      ${sub ? `<div class="list-sub">${sub}</div>` : ''}
    </div>
    ${count !== undefined ? `<span class="list-count">${count}</span>` : ''}
  </div>`
}

function topList(title, color, items) {
  if (!items.length) {
    return `<div class="card">
      <h3 style="margin-bottom:12px;color:${color}">${title}</h3>
      <p style="font-size:.875rem">No data available</p>
    </div>`
  }
  return `<div class="card">
    <h3 style="margin-bottom:12px;color:${color}">${title}</h3>
    ${items.map((item, i) => listItem(i + 1, item.title, item.sub, item.count)).join('')}
  </div>`
}

export function renderTopItems(books, topArtists, topAlbums) {
  // Top authors by book count
  const authors = getTopAuthors(books, 5).map(a => ({
    title: a.name,
    sub: `${a.count} book${a.count !== 1 ? 's' : ''}`,
    count: undefined,
  }))

  // Top artists from Last.fm
  const artists = (topArtists || []).slice(0, 5).map(a => ({
    title: a.name,
    sub: `${parseInt(a.playcount || '0').toLocaleString()} plays`,
    count: undefined,
  }))

  // Top albums from Last.fm
  const albums = (topAlbums || []).slice(0, 5).map(a => ({
    title: a.name,
    sub: a.artist?.name || '',
    count: parseInt(a.playcount || '0').toLocaleString() + ' plays',
  }))

  // Top books (highest read count, or just all if readCount=1)
  const topBooks = [...books]
    .filter(b => b.datesRead.length > 0 || b.readCount > 1)
    .sort((a, b) => b.readCount - a.readCount || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map(b => ({
      title: b.title,
      sub: b.authors,
      count: b.readCount > 1 ? `×${b.readCount}` : undefined,
    }))

  return `<div class="container stack">
    <h2>Top items</h2>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${topList('Top authors', 'var(--clr-accent-1)', authors)}
      ${topList('Top artists', 'var(--clr-accent-2)', artists)}
    </div>

    ${topList('Top albums', 'var(--clr-accent-2)', albums)}
    ${topBooks.length ? topList('Most read books', 'var(--clr-accent-1)', topBooks) : ''}
  </div>`
}
