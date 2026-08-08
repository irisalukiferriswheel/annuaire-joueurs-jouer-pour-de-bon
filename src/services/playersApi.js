import { players as demoPlayers } from '../data/players.js'
import {
  hasBasicDirectoryContract,
  hasRichDirectoryContract,
  hasRichPublicProfileData,
} from '../playerCoverage.js'
import { normalizePublicHttpsUrl } from '../publicUrl.js'

const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim()
const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : ''
const NO_CAUSE_NAMES = new Set(['No cause selected yet', 'Aucune cause sélectionnée'])

function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'P'
}

function normalizedOptionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

function normalizeSocial(social) {
  if (!social || typeof social !== 'object') return null

  const label = typeof social.label === 'string' ? social.label.trim() : ''
  const url = normalizePublicHttpsUrl(social.url)

  if (!label || !url) return null

  return { label, url }
}

export function normalizePlayer(player, locale = 'en') {
  const isRich = hasRichPublicProfileData(player)
  const name = player.alias || player.name || player.displayName || player.firstName || 'Player'
  const games = (player.games || []).map((game) => normalizeGame(game, locale)).filter(Boolean)

  // For compact live profiles, missing rich fields remain genuinely missing.
  // Do not create a fake cause, availability status, province, or zero-valued
  // record just to satisfy components that were originally built for demos.
  if (!isRich) {
    return {
      id: String(player.id),
      name,
      initials: player.initials || initialsFor(name),
      city: normalizedOptionalText(player.city),
      province: null,
      availability: null,
      availabilityLabel: null,
      games,
      causes: [],
      gamesPlayed: null,
      gamesWon: null,
      averagePaid: null,
      totalToCauses: null,
      goalsReached: null,
      rating: null,
      reviewCount: null,
      tags: [],
      bio: '',
      bioFr: '',
      socials: [],
      reviews: [],
      profileLevel: 'basic',
    }
  }

  const availability = player.availability

  return {
    id: String(player.id),
    name,
    initials: player.initials || initialsFor(name),
    city: normalizedOptionalText(player.city),
    province: normalizedOptionalText(player.province),
    availability,
    availabilityLabel: player.availabilityLabel || (
      availability === 'now' ? 'Available now' : availability === 'week' ? 'Available this week' : 'Not currently available'
    ),
    games,
    causes: (player.causes || []).map(normalizeCause).filter(Boolean),
    gamesPlayed: Number(player.gamesPlayed),
    gamesWon: Number(player.gamesWon),
    averagePaid: Number(player.averagePaid),
    totalToCauses: Number(player.totalToCauses),
    goalsReached: Number(player.goalsReached),
    rating: Number(player.rating),
    reviewCount: Number(player.reviewCount),
    tags: Array.isArray(player.tags) ? player.tags : [],
    bio: player.bio || '',
    bioFr: player.bioFr || '',
    socials: Array.isArray(player.socials) ? player.socials.map(normalizeSocial).filter(Boolean) : [],
    reviews: Array.isArray(player.reviews) ? player.reviews : [],
    profileLevel: 'rich',
  }
}

export function buildFilterOptions(players) {
  return {
    cities: [...new Set(players.map((player) => player.city).filter(Boolean))].sort(),
    games: [...new Set(players.flatMap((player) => player.games || []).filter(Boolean))].sort(),
    causes: [...new Set(
      players
        .flatMap((player) => (player.causes || []).map((cause) => cause.name))
        .filter((name) => name && !NO_CAUSE_NAMES.has(name)),
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

    if (!hasBasicDirectoryContract(rawPlayers)) {
      throw new Error('Player API returned an invalid public-player payload')
    }

    const richContract = hasRichDirectoryContract(rawPlayers)

    return {
      players: rawPlayers.map((player) => normalizePlayer(player, locale)),
      source: 'api',
      reason: richContract ? null : 'api-basic-profile-contract',
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    console.warn('Falling back to demo player data:', error)
    return { players: demoPlayers, source: 'demo', reason: 'api-unavailable' }
  }
}
