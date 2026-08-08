export const WIX_PARENT_ORIGIN = 'https://www.jouerpourdebon.ca'

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
    games,
    newGame: cleanText(form.newGame, 150),
    wantsToOrganize: Boolean(form.wantsToOrganize),
    isPublic: Boolean(form.isPublic),
  }
}

export function isTrustedWixParentMessage(event, parentWindow) {
  return Boolean(
    event &&
    event.origin === WIX_PARENT_ORIGIN &&
    event.source === parentWindow &&
    event.data &&
    typeof event.data === 'object',
  )
}
