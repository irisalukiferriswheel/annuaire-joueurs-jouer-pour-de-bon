import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizePlayer } from './playersApi.js'

test('normalizes the compact public API without inventing rich profile data', () => {
  const player = normalizePlayer({
    id: 'player-1',
    alias: 'Live Player',
    city: 'Sherbrooke',
    games: [
      { nameFr: 'Échecs', nameEn: 'Chess', slug: 'chess' },
    ],
  }, 'fr-CA')

  assert.equal(player.profileLevel, 'basic')
  assert.equal(player.id, 'player-1')
  assert.equal(player.name, 'Live Player')
  assert.equal(player.city, 'Sherbrooke')
  assert.equal(player.province, null)
  assert.equal(player.availability, null)
  assert.deepEqual(player.games, ['Échecs'])
  assert.deepEqual(player.causes, [])
  assert.equal(player.gamesPlayed, null)
  assert.equal(player.gamesWon, null)
  assert.equal(player.averagePaid, null)
  assert.equal(player.totalToCauses, null)
  assert.equal(player.goalsReached, null)
  assert.equal(player.rating, null)
  assert.equal(player.reviewCount, null)
  assert.deepEqual(player.tags, [])
  assert.deepEqual(player.socials, [])
  assert.deepEqual(player.reviews, [])
})

test('does not invent a city or province for compact live profiles', () => {
  const player = normalizePlayer({
    id: 'player-2',
    alias: 'Somewhere Player',
    city: null,
    games: [],
  }, 'en-CA')

  assert.equal(player.city, null)
  assert.equal(player.province, null)
})

test('preserves legitimate zeroes for a fully rich public profile', () => {
  const player = normalizePlayer({
    id: 'player-3',
    alias: 'Rich Player',
    city: 'Granby',
    province: 'QC',
    availability: 'off',
    games: [],
    causes: [],
    gamesPlayed: 0,
    gamesWon: 0,
    averagePaid: 0,
    totalToCauses: 0,
    goalsReached: 0,
    rating: 0,
    reviewCount: 0,
    tags: [],
    bio: '',
    socials: [],
    reviews: [],
  }, 'en-CA')

  assert.equal(player.profileLevel, 'rich')
  assert.equal(player.province, 'QC')
  assert.equal(player.availability, 'off')
  assert.equal(player.gamesPlayed, 0)
  assert.equal(player.rating, 0)
})
