/**
 * localStorage cache with TTL support.
 * All keys are namespaced with 'r2l_' prefix.
 */

const NS = 'r2l_'
const TTL_24H = 24 * 60 * 60 * 1000

/**
 * Store data with an optional TTL (milliseconds).
 * If ttlMs is 0 or omitted, data never expires.
 */
export function set(key, data, ttlMs = 0) {
  const entry = {
    data,
    ts: Date.now(),
    ttl: ttlMs,
  }
  try {
    localStorage.setItem(NS + key, JSON.stringify(entry))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

/**
 * Retrieve data. Returns null if missing or expired.
 */
export function get(key) {
  const raw = localStorage.getItem(NS + key)
  if (!raw) return null
  try {
    const entry = JSON.parse(raw)
    if (entry.ttl && Date.now() - entry.ts > entry.ttl) {
      localStorage.removeItem(NS + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

/**
 * Store data without expiry (for config, CSV, etc.)
 */
export function setRaw(key, data) {
  set(key, data, 0)
}

/**
 * Remove a single key.
 */
export function remove(key) {
  localStorage.removeItem(NS + key)
}

/**
 * Clear all r2l_ keys from localStorage.
 */
export function clearAll() {
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(NS)) toRemove.push(k)
  }
  toRemove.forEach(k => localStorage.removeItem(k))
}

export { TTL_24H }
