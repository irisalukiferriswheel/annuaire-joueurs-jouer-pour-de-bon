import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WIX_PARENT_ORIGIN,
  isTrustedWixParentMessage,
  sanitizeProfileEditorSavePayload,
} from './profileEditorBridge.js'

test('accepts messages only from the exact Wix parent window and origin', () => {
  const parentWindow = {}
  const event = {
    origin: WIX_PARENT_ORIGIN,
    source: parentWindow,
    data: { type: 'JPDB_PROFILE_EDITOR_DATA' },
  }

  assert.equal(isTrustedWixParentMessage(event, parentWindow), true)
  assert.equal(isTrustedWixParentMessage({ ...event, origin: 'https://evil.example' }, parentWindow), false)
  assert.equal(isTrustedWixParentMessage({ ...event, source: {} }, parentWindow), false)
  assert.equal(isTrustedWixParentMessage({ ...event, data: null }, parentWindow), false)
})

test('sanitizes and bounds editor save payloads before Wix receives them', () => {
  const payload = sanitizeProfileEditorSavePayload({
    alias: `  ${'A'.repeat(120)}  `,
    city: `  ${'C'.repeat(180)}  `,
    games: ['chess', ' chess ', '', 'basketball', ...Array.from({ length: 60 }, (_, index) => `game-${index}`)],
    newGame: `  ${'N'.repeat(170)}  `,
    wantsToOrganize: 1,
    isPublic: 0,
  })

  assert.equal(payload.alias.length, 100)
  assert.equal(payload.city.length, 150)
  assert.equal(payload.newGame.length, 150)
  assert.equal(payload.games[0], 'chess')
  assert.equal(payload.games[1], 'basketball')
  assert.equal(payload.games.length, 50)
  assert.equal(payload.wantsToOrganize, true)
  assert.equal(payload.isPublic, false)
})

test('defaults malformed editor payload values safely', () => {
  assert.deepEqual(sanitizeProfileEditorSavePayload(null), {
    alias: '',
    city: '',
    games: [],
    newGame: '',
    wantsToOrganize: false,
    isPublic: false,
  })
})
