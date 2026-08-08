export const DEFAULT_WIX_PARENT_ORIGIN = 'https://www.jouerpourdebon.ca'

const TRUSTED_WIX_HOSTS = new Set([
  'editor.wix.com',
  'manage.wix.com',
])

const TRUSTED_WIX_HOST_SUFFIXES = [
  '.editor.wix.com',
  '.studio.wix.com',
  '.harmony.wix.com',
]

export const PROFILE_EDITOR_MESSAGE_TYPES = Object.freeze({
  ready: 'JPDB_PROFILE_EDITOR_READY',
  request: 'JPDB_PROFILE_EDITOR_REQUEST_DATA',
  data: 'JPDB_PROFILE_EDITOR_DATA',
  save: 'JPDB_PROFILE_EDITOR_SAVE',
  saved: 'JPDB_PROFILE_EDITOR_SAVED',
  error: 'JPDB_PROFILE_EDITOR_ERROR',
})

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function isTrustedWixParentOrigin(origin) {
  if (origin === DEFAULT_WIX_PARENT_ORIGIN || origin === 'https://jouerpourdebon.ca') {
    return true
  }

  try {
    const url = new URL(origin)

    if (url.protocol !== 'https:') return false
    if (TRUSTED_WIX_HOSTS.has(url.hostname)) return true

    return TRUSTED_WIX_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
  } catch {
    return false
  }
}

export function resolveTrustedWixParentOrigin(referrer) {
  try {
    const origin = new URL(referrer).origin
    return isTrustedWixParentOrigin(origin) ? origin : DEFAULT_WIX_PARENT_ORIGIN
  } catch {
    return DEFAULT_WIX_PARENT_ORIGIN
  }
}

// Wix may relay HTML-component messages through an internal sandbox frame.
// During this diagnostic phase, target the immediate parent with "*" so the
// relay can receive the handshake. No password, email, Wix member ID, or API
// secret is ever sent through this browser bridge.
export const WIX_PARENT_ORIGIN = '*'

export function sanitizeProfileEditorSavePayload(value) {
  const form = value && typeof value === 'object' ? value : {}
  const games = Array.isArray(form.games)
    ? Array.from(new Set(
        form.games
          .map((game) => cleanText(game, 100))
          .filter(Boolean),
      )).slice(0, 50)
    : []

  return {
    alias: cleanText(form.alias, 100),
    city: cleanText(form.city, 150),
    birthDate: cleanText(form.birthDate, 10),
    games,
    newGame: cleanText(form.newGame, 150),
    wantsToOrganize: Boolean(form.wantsToOrganize),
    isPublic: Boolean(form.isPublic),
  }
}

export function isTrustedWixParentMessage(event) {
  return Boolean(
    event &&
    event.data &&
    typeof event.data === 'object' &&
    Object.values(PROFILE_EDITOR_MESSAGE_TYPES).includes(event.data.type),
  )
}
