import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  Languages,
  Link2,
  LoaderCircle,
  MessageSquareWarning,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  CAUSE_ADMIN_TYPES,
  LANGUAGE_TYPES,
  normalizeCauseReview,
  normalizeLanguage,
  validateCauseDecision,
} from './causeAdminBridge.js'
import './adminCauses.css'

const copy = {
  fr: {
    eyebrow: 'Administration sécurisée', title: 'Approbation des causes',
    intro: 'Vérifiez les causes soumises par les organisateurs avant leur publication.',
    pending: 'En attente', refresh: 'Actualiser', loading: 'Chargement des causes…',
    empty: 'Aucune cause en attente.', unavailableTitle: 'Outil de modération indisponible',
    unavailable: 'Les points de terminaison d’administration des causes ne sont pas encore disponibles. Aucune action ne peut être envoyée.',
    denied: 'Accès administrateur requis ou service indisponible.', goal: 'Objectif global', organizer: 'Organisateur',
    submitted: 'Soumise', audit: 'Historique de vérification', noAudit: 'Aucune action enregistrée.',
    approve: 'Approuver', changes: 'Demander des modifications', reject: 'Rejeter', duplicate: 'Lier comme doublon',
    reason: 'Motif / note pour l’organisateur', reasonPlaceholder: 'Expliquez clairement la décision…',
    canonical: 'Cause officielle', selectCanonical: 'Choisir une cause approuvée…',
    confirmTitle: 'Confirmer la décision', confirm: 'Confirmer', cancel: 'Annuler', saving: 'Enregistrement…',
    success: 'Décision enregistrée et ajoutée à l’historique.', noteRequired: 'Une note est obligatoire pour cette décision.',
    canonicalRequired: 'Choisissez une cause officielle différente.', retry: 'Réessayer',
    language: 'Langue', unknown: 'Non indiqué',
  },
  en: {
    eyebrow: 'Secure administration', title: 'Cause approvals',
    intro: 'Review organizer-submitted causes before they are published.',
    pending: 'Pending', refresh: 'Refresh', loading: 'Loading causes…',
    empty: 'No pending causes.', unavailableTitle: 'Moderation tool unavailable',
    unavailable: 'The cause-administration endpoints are not available yet. No action can be submitted.',
    denied: 'Administrator access required or service unavailable.', goal: 'Overall goal', organizer: 'Organizer',
    submitted: 'Submitted', audit: 'Review history', noAudit: 'No recorded actions.',
    approve: 'Approve', changes: 'Request changes', reject: 'Reject', duplicate: 'Link as duplicate',
    reason: 'Reason / organizer note', reasonPlaceholder: 'Explain the decision clearly…',
    canonical: 'Canonical cause', selectCanonical: 'Choose an approved cause…',
    confirmTitle: 'Confirm decision', confirm: 'Confirm', cancel: 'Cancel', saving: 'Saving…',
    success: 'Decision saved and added to the audit history.', noteRequired: 'A note is required for this decision.',
    canonicalRequired: 'Choose a different canonical cause.', retry: 'Try again',
    language: 'Language', unknown: 'Not provided',
  },
}

function postToWix(message) {
  if (window.parent !== window) window.parent.postMessage(message, '*')
}

function formatMoney(amount, currency, language) {
  try {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency', currency: currency || 'CAD', maximumFractionDigits: 2,
    }).format(amount || 0)
  } catch { return `${amount || 0} ${currency || 'CAD'}` }
}

function formatDate(value, language, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return fallback
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(date)
}

function LanguageToggle({ language, onChange }) {
  return <div className="cause-admin-language" aria-label={copy[language].language}>
    <Languages size={17} aria-hidden="true" />
    {['fr', 'en'].map((item) => <button
      type="button" key={item} onClick={() => onChange(item)}
      className={language === item ? 'is-active' : ''} aria-pressed={language === item}
    >{item.toUpperCase()}</button>)}
  </div>
}

function AuditTrail({ entries, language }) {
  const c = copy[language]
  return <details className="cause-audit">
    <summary><Clock3 size={16} /> {c.audit} ({entries.length})</summary>
    {entries.length === 0 ? <p>{c.noAudit}</p> : <ol>
      {entries.map((entry, index) => <li key={`${entry.at || 'audit'}-${index}`}>
        <strong>{entry.action || c.unknown}</strong>
        <span>{entry.actor || c.unknown} · {formatDate(entry.at, language, c.unknown)}</span>
        {entry.note && <p>{entry.note}</p>}
      </li>)}
    </ol>}
  </details>
}

export default function AdminCauses({ initialLanguage = 'en' }) {
  const [language, setLanguageState] = useState(normalizeLanguage(initialLanguage))
  const [causes, setCauses] = useState([])
  const [canonicalCauses, setCanonicalCauses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [saving, setSaving] = useState(false)
  const c = copy[language]

  const requestCauses = () => {
    setLoading(true); setError(null); setNotice('')
    postToWix({ type: CAUSE_ADMIN_TYPES.request, payload: { status: 'pending', language } })
  }

  const changeLanguage = (next) => {
    const normalized = normalizeLanguage(next, language)
    setLanguageState(normalized)
    window.localStorage.setItem('jpdb-language', normalized)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', normalized)
    window.history.replaceState(null, '', url)
    postToWix({ type: LANGUAGE_TYPES.changed, language: normalized })
  }

  useEffect(() => {
    const handle = (event) => {
      if (event.source !== window.parent) return
      const message = event?.data
      if (!message || typeof message !== 'object') return

      if (message.type === LANGUAGE_TYPES.set) {
        setLanguageState(normalizeLanguage(message.language, language))
        return
      }
      if (message.type === CAUSE_ADMIN_TYPES.data) {
        const payload = message.payload && typeof message.payload === 'object' ? message.payload : {}
        setCauses(Array.isArray(payload.causes) ? payload.causes.map(normalizeCauseReview).filter((cause) => cause.id) : [])
        setCanonicalCauses(Array.isArray(payload.canonicalCauses)
          ? payload.canonicalCauses.map(normalizeCauseReview).filter((cause) => cause.id)
          : [])
        setLoading(false); setError(null)
        return
      }
      if (message.type === CAUSE_ADMIN_TYPES.result) {
        setSaving(false); setConfirmation(null); setNotice(c.success)
        requestCauses()
        return
      }
      if (message.type === CAUSE_ADMIN_TYPES.error) {
        setLoading(false); setSaving(false)
        setError({ code: message.code || 'ADMIN_CAUSES_FAILED', message: message.message || '' })
      }
    }

    window.addEventListener('message', handle)
    if (window.parent === window) {
      setLoading(false)
      setError({ code: 'WIX_ADMIN_EMBED_REQUIRED', message: c.denied })
    } else {
      postToWix({ type: CAUSE_ADMIN_TYPES.ready, payload: { status: 'pending', language } })
    }
    return () => window.removeEventListener('message', handle)
  }, [])

  useEffect(() => { document.documentElement.lang = language }, [language])

  const byId = useMemo(() => Object.fromEntries(causes.map((cause) => [cause.id, cause])), [causes])

  const startDecision = (causeId, action) => {
    const draft = drafts[causeId] || {}
    const checked = validateCauseDecision({ causeId, action, note: draft.note, canonicalCauseId: draft.canonicalCauseId })
    if (!checked.valid) {
      setError({ code: checked.code, message: checked.code === 'NOTE_REQUIRED' ? c.noteRequired : c.canonicalRequired })
      return
    }
    setError(null)
    setConfirmation(checked.payload)
  }

  const submitDecision = () => {
    if (!confirmation || saving) return
    setSaving(true); setError(null); setNotice('')
    postToWix({ type: CAUSE_ADMIN_TYPES.decide, payload: confirmation })
  }

  const unavailable = error?.code === 'CAUSE_MODERATION_API_UNAVAILABLE'

  return <main className="cause-admin">
    <header className="cause-admin-header">
      <div>
        <span className="cause-admin-eyebrow"><ShieldCheck size={17} /> {c.eyebrow}</span>
        <h1>{c.title}</h1><p>{c.intro}</p>
      </div>
      <LanguageToggle language={language} onChange={changeLanguage} />
    </header>

    <div className="cause-admin-toolbar">
      <span>{c.pending}: <strong>{causes.length}</strong></span>
      <button type="button" onClick={requestCauses} disabled={loading || saving}><RefreshCw size={16} /> {c.refresh}</button>
    </div>

    {notice && <div className="cause-admin-alert is-success" role="status"><BadgeCheck size={19} /> {notice}</div>}
    {error && <div className="cause-admin-alert is-error" role="alert">
      <CircleAlert size={20} /><div><strong>{unavailable ? c.unavailableTitle : c.denied}</strong><p>{unavailable ? c.unavailable : (error.message || c.denied)}</p></div>
      {!unavailable && <button type="button" onClick={requestCauses}>{c.retry}</button>}
    </div>}

    {loading ? <section className="cause-admin-state"><LoaderCircle className="cause-admin-spinner" size={32}/><strong>{c.loading}</strong></section>
      : !error && causes.length === 0 ? <section className="cause-admin-state"><BadgeCheck size={32}/><strong>{c.empty}</strong></section>
      : <section className="cause-admin-list" aria-live="polite">{causes.map((cause) => {
        const draft = drafts[cause.id] || {}
        const updateDraft = (patch) => setDrafts((current) => ({ ...current, [cause.id]: { ...draft, ...patch } }))
        return <article className="cause-review-card" key={cause.id}>
          <div className="cause-review-main">
            <div className="cause-review-title"><span>{cause.status}</span><h2>{cause.name || c.unknown}</h2></div>
            <p className="cause-description">{cause.description || c.unknown}</p>
            <dl>
              <div><dt>{c.goal}</dt><dd>{formatMoney(cause.goalAmount, cause.currency, language)}</dd></div>
              <div><dt>{c.organizer}</dt><dd>{cause.organizer.name || c.unknown}<small>{cause.organizer.email || ''}</small></dd></div>
              <div><dt>{c.submitted}</dt><dd>{formatDate(cause.submittedAt, language, c.unknown)}</dd></div>
            </dl>
            <AuditTrail entries={cause.audit} language={language} />
          </div>
          <aside className="cause-review-actions">
            <label>{c.reason}<textarea value={draft.note || ''} onChange={(event) => updateDraft({ note: event.target.value })} placeholder={c.reasonPlaceholder} maxLength={2000}/></label>
            <label>{c.canonical}<select value={draft.canonicalCauseId || ''} onChange={(event) => updateDraft({ canonicalCauseId: event.target.value })}>
              <option value="">{c.selectCanonical}</option>
              {canonicalCauses.filter((candidate) => candidate.id !== cause.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select></label>
            <div className="cause-action-grid">
              <button className="is-approve" type="button" onClick={() => startDecision(cause.id, 'approve')}><BadgeCheck size={17}/>{c.approve}</button>
              <button type="button" onClick={() => startDecision(cause.id, 'request_changes')}><MessageSquareWarning size={17}/>{c.changes}</button>
              <button className="is-reject" type="button" onClick={() => startDecision(cause.id, 'reject')}><XCircle size={17}/>{c.reject}</button>
              <button type="button" onClick={() => startDecision(cause.id, 'link_duplicate')}><Link2 size={17}/>{c.duplicate}</button>
            </div>
          </aside>
        </article>
      })}</section>}

    {confirmation && <div className="cause-confirm-backdrop" role="presentation" onMouseDown={() => !saving && setConfirmation(null)}>
      <section className="cause-confirm" role="dialog" aria-modal="true" aria-labelledby="cause-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="cause-confirm-title">{c.confirmTitle}</h2>
        <p><strong>{byId[confirmation.causeId]?.name}</strong></p>
        {confirmation.note && <blockquote>{confirmation.note}</blockquote>}
        <div><button type="button" onClick={() => setConfirmation(null)} disabled={saving}>{c.cancel}</button><button className="is-primary" type="button" onClick={submitDecision} disabled={saving}>{saving ? <><LoaderCircle className="cause-admin-spinner" size={17}/>{c.saving}</> : c.confirm}</button></div>
      </section>
    </div>}
  </main>
}
