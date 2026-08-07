const requiredScalarFields = [
  'gamesPlayed',
  'gamesWon',
  'averagePaid',
  'totalToCauses',
  'goalsReached',
  'rating',
  'reviewCount',
  'bio',
]

const requiredArrayFields = [
  'games',
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

export function hasRichPublicProfileData(player) {
  if (!player || typeof player !== 'object') return false

  // Public routing and display identity must be explicit. Do not normalize a
  // malformed API row into a convincing placeholder profile.
  if (!isNonEmptyString(player.id)) return false
  if (!isNonEmptyString(player.alias)) return false

  // The current UI explicitly renders province beside city. Requiring an
  // explicit value prevents a client-side regional default from inventing
  // geography for a real public profile.
  if (!isNonEmptyString(player.province)) return false

  if (!['now', 'week', 'off'].includes(player.availability)) return false

  for (const field of requiredScalarFields) {
    if (!hasOwn(player, field)) return false
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(player[field])) return false
  }

  return true
}

export function hasRichDirectoryContract(players) {
  return Array.isArray(players) && players.every(hasRichPublicProfileData)
}
