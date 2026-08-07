const requiredScalarFields = [
  'province',
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
  'causes',
  'tags',
  'socials',
  'reviews',
]

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export function hasRichPublicProfileData(player) {
  if (!player || typeof player !== 'object') return false

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
