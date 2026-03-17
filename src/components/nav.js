/**
 * Bottom navigation bar.
 * Emits 'navigate' custom event with { detail: view } on tab press.
 */

const VIEWS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 7"/>
      <line x1="3" y1="21" x2="21" y2="21"/></svg>`,
  },
  {
    id: 'top',
    label: 'Top Items',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  },
]

export function renderNav(activeView) {
  return `<nav class="bottom-nav" role="navigation" aria-label="Main navigation">
    ${VIEWS.map(v => `
      <button class="nav-btn${v.id === activeView ? ' active' : ''}"
        data-view="${v.id}"
        aria-label="${v.label}"
        aria-current="${v.id === activeView ? 'page' : 'false'}">
        ${v.icon}
        <span>${v.label}</span>
      </button>
    `).join('')}
  </nav>`
}

/** Attach click handlers to nav buttons in the DOM. */
export function bindNav(container, onNavigate) {
  container.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.view))
  })
}
