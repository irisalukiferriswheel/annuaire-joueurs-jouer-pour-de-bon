import { players as demoPlayers } from '../data/players.js'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : ''
const NO_CAUSE_NAME = 'No cause selected yet'

function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'P'
}

function normalizeGame(game, locale = 'en') {
  if (typeof game === 'string') return game
  if (!game || typeof game !== 'object') return null

  if (locale.startsWith('fr')) {
    return game.nameFr || game.name_fr || game.nameEn || game.name_en || game.name || game.slug || null
  }

  return game.nameEn || game.name_en || game.nameFr || game.name_fr || game.name || game.slug || null
}

function normalizeCause(cause) {
  if (typeof cause === 'string') {
    return { name: cause, contributed: 0, goalReached: false, progress: 0 }
  }

  if (!cause || typeof cause !== 'object') return null

  return {
    name: cause.name || cause.nameEn || cause.nameFr || 'Cause',
    contributed: Number(cause.contributed ?? cause.amountContributed ?? 0),
    goalReached: Boolean(cause.goalReached),
    progress: Math.max(0, Math.min(100, Number(cause.progress ?? 0))),
  }
}

export function normalizePlayer(player, locale = 'en') {
  const name = player.alias || player.name || player.displayName || player.firstName || 'Player'
  const games = (player.games || []).map((game) => normalizeGame(game, locale)).filter(Boolean)
  const normalizedCauses = (player.causes || []).map(normalizeCause).filter(Boolean)
  const causes = normalizedCauses.length
    ? normalizedCauses
    : [{ name: NO_CAUSE_NAME, contributed: 0, goalReached: false, progress: 0 }]
  const availability = ['now', 'week', 'off'].includes(player.availability) ? player.availability : 'off'

  return {
    id: String(player.id),
    name,
    initials: player.initials || initialsFor(name),
    city: player.city || 'City not listed',
    province: player.province || 'QC',
    availability,
    availabilityLabel: player.availabilityLabel || (
      availability === 'now' ? 'Available now' : availability === 'week' ? 'Available this week' : 'Not currently available'
    ),
    games,
    causes,
    gamesPlayed: Number(player.gamesPlayed ?? 0),
    gamesWon: Number(player.gamesWon ?? 0),
    averagePaid: Number(player.averagePaid ?? 0),
    totalToCauses: Number(player.totalToCauses ?? 0),
    goalsReached: Number(player.goalsReached ?? 0),
    rating: Number(player.rating ?? 0),
    reviewCount: Number(player.reviewCount ?? 0),
    tags: Array.isArray(player.tags) ? player.tags : [],
    bio: player.bio || '',
    socials: Array.isArray(player.socials) ? player.socials.filter((social) => social?.label && social?.url) : [],
    reviews: Array.isArray(player.reviews) ? player.reviews : [],
  }
}

export function buildFilterOptions(players) {
  return {
    cities: [...new Set(players.map((player) => player.city).filter(Boolean))].sort(),
    games: [...new Set(players.flatMap((player) => player.games || []).filter(Boolean))].sort(),
    causes: [...new Set(
      players
        .flatMap((player) => (player.causes || []).map((cause) => cause.name))
        .filter((name) => name && name !== NO_CAUSE_NAME),
    )].sort(),
  }
}

export async function loadPlayers({ locale = 'en-CA', signal } = {}) {
  if (!API_BASE_URL) {
    return { players: demoPlayers, source: 'demo', reason: 'api-not-configured' }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/public/players?locale=${encodeURIComponent(locale)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })

    if (!response.ok) {
      throw new Error(`Player API returned ${response.status}`)
    }

    const payload = await response.json()
    const rawPlayers = Array.isArray(payload) ? payload : payload?.data

    if (!Array.isArray(rawPlayers)) {
      throw new Error('Player API returned an invalid payload')
    }

    return {
      players: rawPlayers.map((player) => normalizePlayer(player, locale)),
      source: 'api',
      reason: null,
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    console.warn('Falling back to demo player data:', error)
    return { players: demoPlayers, source: 'demo', reason: 'api-unavailable' }
  }
}
