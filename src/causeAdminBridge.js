export const CAUSE_ADMIN_TYPES = Object.freeze({
  ready: 'JPDB_ADMIN_CAUSES_READY',
  request: 'JPDB_ADMIN_CAUSES_REQUEST',
  data: 'JPDB_ADMIN_CAUSES_DATA',
  decide: 'JPDB_ADMIN_CAUSES_DECIDE',
  result: 'JPDB_ADMIN_CAUSES_RESULT',
  error: 'JPDB_ADMIN_CAUSES_ERROR',
})

export const LANGUAGE_TYPES = Object.freeze({
  set: 'JPDB_LANGUAGE',
  changed: 'JPDB_LANGUAGE_CHANGED',
})

export const ALLOWED_CAUSE_ACTIONS = Object.freeze([
  'approve',
  'request_changes',
  'reject',
  'link_duplicate',
])

export function normalizeLanguage(value, fallback = 'en') {
  if (value === 'fr' || value === 'en') return value
  return fallback === 'fr' ? 'fr' : 'en'
}

export function normalizeCauseReview(value) {
  const cause = value && typeof value === 'object' ? value : {}
  return {
    id: String(cause.id || ''),
    name: String(cause.name || ''),
    description: String(cause.description || ''),
    goalAmount: Number.isFinite(Number(cause.goalAmount)) ? Number(cause.goalAmount) : 0,
    currency: String(cause.currency || 'CAD').toUpperCase().slice(0, 3),
    status: String(cause.status || 'pending'),
    submittedAt: cause.submittedAt || null,
    organizer: {
      id: String(cause.organizer?.id || ''),
      name: String(cause.organizer?.name || ''),
      email: String(cause.organizer?.email || ''),
    },
    audit: Array.isArray(cause.audit)
      ? cause.audit.map((entry) => ({
          action: String(entry?.action || ''),
          at: entry?.at || null,
          actor: String(entry?.actor || ''),
          note: String(entry?.note || ''),
        }))
      : [],
  }
}

export function validateCauseDecision(value) {
  const input = value && typeof value === 'object' ? value : {}
  const causeId = String(input.causeId || '').trim()
  const action = String(input.action || '').trim()
  const note = String(input.note || '').trim()
  const canonicalCauseId = String(input.canonicalCauseId || '').trim()

  if (!causeId) return { valid: false, code: 'CAUSE_ID_REQUIRED' }
  if (!ALLOWED_CAUSE_ACTIONS.includes(action)) return { valid: false, code: 'INVALID_ACTION' }
  if ((action === 'request_changes' || action === 'reject') && !note) {
    return { valid: false, code: 'NOTE_REQUIRED' }
  }
  if (action === 'link_duplicate' && !canonicalCauseId) {
    return { valid: false, code: 'CANONICAL_CAUSE_REQUIRED' }
  }
  if (action === 'link_duplicate' && canonicalCauseId === causeId) {
    return { valid: false, code: 'CANONICAL_CAUSE_MUST_DIFFER' }
  }

  return {
    valid: true,
    payload: { causeId, action, note, canonicalCauseId },
  }
}
