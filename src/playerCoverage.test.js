import test from 'node:test'
import assert from 'node:assert/strict'

import { hasRichDirectoryContract, hasRichPublicProfileData } from './playerCoverage.js'

const completePlayer = {
  id: 'p1',
  alias: 'Player',
  city: 'Sherbrooke',
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
}

test('accepts a rich public profile even when legitimate values are zero or empty', () => {
  assert.equal(hasRichPublicProfileData(completePlayer), true)
  assert.equal(hasRichDirectoryContract([completePlayer]), true)
})

test('rejects the current basic public directory contract as incomplete for rich UI', () => {
  assert.equal(hasRichPublicProfileData({
    id: 'p1',
    alias: 'Player',
    city: 'Sherbrooke',
    games: [],
  }), false)
})

test('requires explicit public routing identity and geography', () => {
  assert.equal(hasRichPublicProfileData({ ...completePlayer, id: '' }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, id: undefined }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, alias: '   ' }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, province: '' }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, province: undefined }), false)
})

test('requires explicit availability and array-shaped public collections', () => {
  assert.equal(hasRichPublicProfileData({ ...completePlayer, availability: undefined }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, games: undefined }), false)
  assert.equal(hasRichPublicProfileData({ ...completePlayer, reviews: undefined }), false)
})

test('all API players must satisfy the rich profile contract before cutover', () => {
  assert.equal(hasRichDirectoryContract([
    completePlayer,
    { id: 'p2', alias: 'Basic', city: 'Granby', games: [] },
  ]), false)
})
