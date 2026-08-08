const requiredRichScalarFields = [
  'gamesPlayed',
  'gamesWon',
  'averagePaid',
  'totalToCauses',
  'goalsReached',
  'rating',
  'reviewCount',
  'bio',
]

const requiredRichArrayFields = [
  'causes',
  'tags',
  'socials',
  'reviews',
]

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasBasicPublicProfileData(player) {
  if (!player || typeof player !== 'object') return false

  // Routing/display identity must always be explicit. A malformed API row
  // should never be normalized into a convincing placeholder player.
  if (!isNonEmptyString(player.id)) return false
  if (!isNonEmptyString(player.alias)) return false
  if (!Array.isArray(player.games)) return false

  // City is allowed to be absent/null in the compact public contract. When it
  // is present it must be a string; the UI will say that location is not listed
  // rather than inventing geography.
  if (player.city !== undefined && player.city !== null && typeof player.city !== 'string') {
    return false
  }

  return true
}

export function hasBasicDirectoryContract(players) {
  return Array.isArray(players) && players.every(hasBasicPublicProfileData)
}

export function hasRichPublicProfileData(player) {
  if (!hasBasicPublicProfileData(player)) return false

  // The rich UI explicitly renders province and availability. Requiring those
  // fields prevents a client-side regional/status default from making missing
  // production data look real.
  if (!isNonEmptyString(player.province)) return false
  if (!['now', 'week', 'off'].includes(player.availability)) return false

  for (const field of requiredRichScalarFields) {
    if (!hasOwn(player, field)) return false
  }

  for (const field of requiredRichArrayFields) {
    if (!Array.isArray(player[field])) return false
  }

  return true
}

export function hasRichDirectoryContract(players) {
  return Array.isArray(players) && players.every(hasRichPublicProfileData)
}
