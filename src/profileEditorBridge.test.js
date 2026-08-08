import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WIX_PARENT_ORIGIN,
  isTrustedWixParentMessage,
  isTrustedWixParentOrigin,
  resolveTrustedWixParentOrigin,
  sanitizeProfileEditorSavePayload,
} from './profileEditorBridge.js'

test('accepts production and Wix editor preview origins only', () => {
  assert.equal(isTrustedWixParentOrigin(WIX_PARENT_ORIGIN), true)
  assert.equal(isTrustedWixParentOrigin('https://jouerpourdebon.ca'), true)
  assert.equal(isTrustedWixParentOrigin('https://editor.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.editor.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.studio.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.harmony.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('http://editor.wix.com'), false)
  assert.equal(isTrustedWixParentOrigin('https://evil.example'), false)
  assert.equal(isTrustedWixParentOrigin('https://editor.wix.com.evil.example'), false)
})

test('resolves a trusted parent origin from the embedding referrer', () => {
  assert.equal(
    resolveTrustedWixParentOrigin('https://editor.wix.com/html/editor/web/renderer/edit/abc'),
    'https://editor.wix.com',
  )
  assert.equal(
    resolveTrustedWixParentOrigin('https://simon-jpdb.editor.wix.com/preview'),
    'https://simon-jpdb.editor.wix.com',
  )
  assert.equal(
    resolveTrustedWixParentOrigin('https://evil.example/embed'),
    WIX_PARENT_ORIGIN,
  )
})

test('accepts messages only from the expected trusted parent window and origin', () => {
  const parentWindow = {}
  const event = {
    origin: WIX_PARENT_ORIGIN,
    source: parentWindow,
    data: { type: 'JPDB_PROFILE_EDITOR_DATA' },
  }

  assert.equal(isTrustedWixParentMessage(event, parentWindow), true)
  assert.equal(
    isTrustedWixParentMessage(
      { ...event, origin: 'https://editor.wix.com' },
      parentWindow,
      'https://editor.wix.com',
    ),
    true,
  )
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
