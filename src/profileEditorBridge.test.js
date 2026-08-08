import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_WIX_PARENT_ORIGIN,
  WIX_PARENT_ORIGIN,
  isTrustedWixParentMessage,
  isTrustedWixParentOrigin,
  resolveTrustedWixParentOrigin,
  sanitizeProfileEditorSavePayload,
} from './profileEditorBridge.js'

test('accepts production and Wix editor preview origins only', () => {
  assert.equal(isTrustedWixParentOrigin(DEFAULT_WIX_PARENT_ORIGIN), true)
  assert.equal(isTrustedWixParentOrigin('https://jouerpourdebon.ca'), true)
  assert.equal(isTrustedWixParentOrigin('https://editor.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.editor.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.studio.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('https://simon-jpdb.harmony.wix.com'), true)
  assert.equal(isTrustedWixParentOrigin('http://editor.wix.com'), false)
  assert.equal(isTrustedWixParentOrigin('https://evil.example'), false)
  assert.equal(isTrustedWixParentOrigin('https://editor.wix.com.evil.example'), false)
})

test('uses wildcard only as outbound browser target for Wix wrapper compatibility', () => {
  assert.equal(WIX_PARENT_ORIGIN, '*')
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
    DEFAULT_WIX_PARENT_ORIGIN,
  )
})

test('accepts only structured JPDB bridge message types during diagnostics', () => {
  const event = {
    origin: 'https://unexpected-wix-sandbox.example',
    source: {},
    data: { type: 'JPDB_PROFILE_EDITOR_DATA' },
  }

  assert.equal(isTrustedWixParentMessage(event), true)
  assert.equal(isTrustedWixParentMessage({ ...event, data: { type: 'UNRELATED_MESSAGE' } }), false)
  assert.equal(isTrustedWixParentMessage({ ...event, data: null }), false)
})

test('sanitizes and bounds editor save payloads before Wix receives them', () => {
  const payload = sanitizeProfileEditorSavePayload({
    alias: `  ${'A'.repeat(120)}  `,
    city: `  ${'C'.repeat(180)}  `,
    birthDate: ' 1976-06-23 ',
    games: ['chess', ' chess ', '', 'basketball', ...Array.from({ length: 60 }, (_, index) => `game-${index}`)],
    newGame: `  ${'N'.repeat(170)}  `,
    wantsToOrganize: 1,
    isPublic: 0,
  })

  assert.equal(payload.alias.length, 100)
  assert.equal(payload.city.length, 150)
  assert.equal(payload.birthDate, '1976-06-23')
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
    birthDate: '',
    games: [],
    newGame: '',
    wantsToOrganize: false,
    isPublic: false,
  })
})
