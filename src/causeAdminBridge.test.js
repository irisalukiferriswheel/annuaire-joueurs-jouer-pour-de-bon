import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCauseReview, normalizeLanguage, validateCauseDecision } from './causeAdminBridge.js'

test('normalizes cause reviews without trusting missing fields', () => {
  assert.deepEqual(normalizeCauseReview({ id: 42, goalAmount: '12500', currency: 'cad' }), {
    id: '42', name: '', description: '', goalAmount: 12500, currency: 'CAD', status: 'pending',
    submittedAt: null, organizer: { id: '', name: '', email: '' }, audit: [],
  })
})

test('requires a reason for rejection and change requests', () => {
  assert.equal(validateCauseDecision({ causeId: 'c1', action: 'reject' }).code, 'NOTE_REQUIRED')
  assert.equal(validateCauseDecision({ causeId: 'c1', action: 'request_changes' }).code, 'NOTE_REQUIRED')
})

test('requires a different canonical cause for duplicate linking', () => {
  assert.equal(validateCauseDecision({ causeId: 'c1', action: 'link_duplicate' }).code, 'CANONICAL_CAUSE_REQUIRED')
  assert.equal(validateCauseDecision({ causeId: 'c1', action: 'link_duplicate', canonicalCauseId: 'c1' }).code, 'CANONICAL_CAUSE_MUST_DIFFER')
  assert.equal(validateCauseDecision({ causeId: 'c1', action: 'link_duplicate', canonicalCauseId: 'c2' }).valid, true)
})

test('normalizes the shared French and English language contract', () => {
  assert.equal(normalizeLanguage('fr'), 'fr')
  assert.equal(normalizeLanguage('en'), 'en')
  assert.equal(normalizeLanguage('es', 'fr'), 'fr')
})
