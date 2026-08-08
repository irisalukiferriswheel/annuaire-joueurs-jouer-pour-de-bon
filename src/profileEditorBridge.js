export const DEFAULT_WIX_PARENT_ORIGIN = 'https://www.jouerpourdebon.ca'

const TRUSTED_WIX_HOSTS = new Set(['editor.wix.com','manage.wix.com'])
const TRUSTED_WIX_HOST_SUFFIXES = ['.editor.wix.com','.studio.wix.com','.harmony.wix.com']

export const PROFILE_EDITOR_MESSAGE_TYPES = Object.freeze({
  ready: 'JPDB_PROFILE_EDITOR_READY', request: 'JPDB_PROFILE_EDITOR_REQUEST_DATA',
  data: 'JPDB_PROFILE_EDITOR_DATA', save: 'JPDB_PROFILE_EDITOR_SAVE',
  saved: 'JPDB_PROFILE_EDITOR_SAVED', error: 'JPDB_PROFILE_EDITOR_ERROR',
})

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function isTrustedWixParentOrigin(origin) {
  if (origin === DEFAULT_WIX_PARENT_ORIGIN || origin === 'https://jouerpourdebon.ca') return true
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:') return false
    if (TRUSTED_WIX_HOSTS.has(url.hostname)) return true
    return TRUSTED_WIX_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
  } catch { return false }
}

export function resolveTrustedWixParentOrigin(referrer) {
  try {
    const origin = new URL(referrer).origin
    return isTrustedWixParentOrigin(origin) ? origin : DEFAULT_WIX_PARENT_ORIGIN
  } catch { return DEFAULT_WIX_PARENT_ORIGIN }
}

export const WIX_PARENT_ORIGIN = '*'

export function sanitizeProfileEditorSavePayload(value) {
  const form = value && typeof value === 'object' ? value : {}
  const games = Array.isArray(form.games)
    ? Array.from(new Set(form.games.map((game) => cleanText(game, 100)).filter(Boolean))).slice(0, 50)
    : []

  return {
    firstName: cleanText(form.firstName, 100), lastName: cleanText(form.lastName, 100),
    alias: cleanText(form.alias, 100), email: cleanText(form.email, 320), phone: cleanText(form.phone, 50),
    birthDate: cleanText(form.birthDate, 10), streetAddress: cleanText(form.streetAddress, 250),
    city: cleanText(form.city, 150), regionCode: cleanText(form.regionCode, 20), regionName: cleanText(form.regionName, 150),
    postalCode: cleanText(form.postalCode, 30), countryCode: cleanText(form.countryCode, 2).toUpperCase(),
    payoutContactPreference: form.payoutContactPreference === 'phone' ? 'phone' : form.payoutContactPreference === 'email' ? 'email' : '',
    emergencyContactName: cleanText(form.emergencyContactName, 150), emergencyContactPhone: cleanText(form.emergencyContactPhone, 50),
    legalGuardianName: cleanText(form.legalGuardianName, 150), legalGuardianPhone: cleanText(form.legalGuardianPhone, 50),
    games, newGame: cleanText(form.newGame, 150), wantsToOrganize: Boolean(form.wantsToOrganize),
    interestedInVolunteering: Boolean(form.interestedInVolunteering), isPublic: Boolean(form.isPublic),
  }
}

export function isTrustedWixParentMessage(event) {
  return Boolean(event && event.data && typeof event.data === 'object' && Object.values(PROFILE_EDITOR_MESSAGE_TYPES).includes(event.data.type))
}
