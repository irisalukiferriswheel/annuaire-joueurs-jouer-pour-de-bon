import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizePublicHttpsUrl } from './publicUrl.js'

test('accepts and normalizes public HTTPS URLs', () => {
  assert.equal(
    normalizePublicHttpsUrl('  https://example.com/profile  '),
    'https://example.com/profile',
  )
})

test('rejects non-HTTPS schemes', () => {
  assert.equal(normalizePublicHttpsUrl('http://example.com/profile'), null)
  assert.equal(normalizePublicHttpsUrl('javascript:alert(1)'), null)
  assert.equal(normalizePublicHttpsUrl('data:text/html,hello'), null)
  assert.equal(normalizePublicHttpsUrl('mailto:person@example.com'), null)
})

test('rejects malformed or empty URL values', () => {
  assert.equal(normalizePublicHttpsUrl('not a url'), null)
  assert.equal(normalizePublicHttpsUrl(''), null)
  assert.equal(normalizePublicHttpsUrl(null), null)
})
