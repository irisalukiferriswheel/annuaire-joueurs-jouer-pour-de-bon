import test from 'node:test'
import assert from 'node:assert/strict'

import {
  hasBasicDirectoryContract,
  hasBasicPublicProfileData,
  hasRichDirectoryContract,
  hasRichPublicProfileData,
} from './playerCoverage.js'

const basicPlayer = {
  id: 'p1',
  alias: 'Player',
  city: 'Sherbrooke',
  games: [],
}

const completePlayer = {
  ...basicPlayer,
  province: 'QC',
  availability: 'off',
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
}

test('accepts the compact production player contract as basic public data', () => {
  assert.equal(hasBasicPublicProfileData(basicPlayer), true)
  assert.equal(hasBasicDirectoryContract([basicPlayer]), true)
  assert.equal(hasRichPublicProfileData(basicPlayer), false)
})

test('allows a basic player to omit city without inventing a location', () => {
  assert.equal(hasBasicPublicProfileData({ id: 'p2', alias: 'Player 2', city: null, games: [] }), true)
  assert.equal(hasBasicPublicProfileData({ id: 'p2', alias: 'Player 2', games: [] }), true)
})

test('basic public data still requires explicit routing identity and games collection', () => {
  assert.equal(hasBasicPublicProfileData({ ...basicPlayer, id: '' }), false)
  assert.equal(hasBasicPublicProfileData({ ...basicPlayer, id: undefined }), false)
  assert.equal(hasBasicPublicProfileData({ ...basicPlayer, alias: '   ' }), false)
  assert.equal(hasBasicPublicProfileData({ ...basicPlayer, games: undefined }), false)
  assert.equal(hasBasicPublicProfileData({ ...basicPlayer, city: 123 }), false)
})

test('accepts a rich public profile even when legitimate values are zero or empty', () => {
  assert.equal(hasRichPublicProfileData(completePlayer), true)
  assert.equal(hasRichDirectoryContract([completePlayer]), true)
})

test('rich profiles require explicit geography and availability', () => {
  assert.equal(hasRichPublicProfileData({ ...completePlayer, province: '' }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, province: undefined }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, availability: undefined }), false)
})

test('rich profiles require the richer public collections', () => {
  assert.equal(hasRichPublicProfileData({ ...completePlayer, reviews: undefined }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, causes: undefined }), false)
})

test('a directory can be valid for basic live mode without every player being rich', () => {
  const mixed = [
    completePlayer,
    { id: 'p2', alias: 'Basic', city: 'Granby', games: [] },
  ]

  assert.equal(hasBasicDirectoryContract(mixed), true)
  assert.equal(hasRichDirectoryContract(mixed), false)
})
