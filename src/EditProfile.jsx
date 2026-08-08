import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Check,
  Gamepad2,
  HeartHandshake,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import {
  PROFILE_EDITOR_MESSAGE_TYPES as MESSAGE_TYPES,
  WIX_PARENT_ORIGIN,
  isTrustedWixParentMessage,
  sanitizeProfileEditorSavePayload,
} from './profileEditorBridge.js'

const previewData = {
  member: { firstName: 'Camille', nickname: 'Camille' },
  profile: null,
  games: [
    { slug: 'basketball', nameFr: 'Basketball', nameEn: 'Basketball' },
    { slug: 'chess', nameFr: 'Échecs', nameEn: 'Chess' },
    { slug: 'pickleball', nameFr: 'Pickleball', nameEn: 'Pickleball' },
    { slug: 'running', nameFr: 'Course', nameEn: 'Running' },
    { slug: 'table-tennis', nameFr: 'Tennis de table', nameEn: 'Table tennis' },
  ],
}

function isEmbedded() {
  return window.parent !== window
}

function postToWix(message) {
  if (!isEmbedded()) return false
  window.parent.postMessage(message, WIX_PARENT_ORIGIN)
  return true
}

function Toggle({ checked, onChange, title, description }) {
  return (
    <label className="editor-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="editor-toggle__control" aria-hidden="true"><Check size={14} /></span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </label>
  )
}

function GamePicker({ games, selected, onChange }) {
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const toggle = (slug) => {
    onChange(selectedSet.has(slug)
      ? selected.filter((value) => value !== slug)
      : [...selected, slug])
  }

  return (
    <div className="editor-game-grid">
      {games.map((game) => {
        const active = selectedSet.has(game.slug)
        return (
          <button
            type="button"
            className={`editor-game ${active ? 'editor-game--selected' : ''}`}
            aria-pressed={active}
            key={game.slug}
            onClick={() => toggle(game.slug)}
          >
            <Gamepad2 size={17} />
            <span>{game.nameFr || game.nameEn || game.slug}</span>
            {active && <Check size={16} />}
          </button>
        )
      })}
    </div>
  )
}

function normalizeIncomingGames(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter((game) => game && typeof game === 'object' && typeof game.slug === 'string' && game.slug.trim())
    .slice(0, 250)
    .map((game) => ({
      slug: game.slug.trim().slice(0, 100),
      nameFr: typeof game.nameFr === 'string' ? game.nameFr.trim().slice(0, 200) : '',
      nameEn: typeof game.nameEn === 'string' ? game.nameEn.trim().slice(0, 200) : '',
      category: typeof game.category === 'string' ? game.category.trim().slice(0, 100) : '',
    }))
}

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [member, setMember] = useState(null)
  const [games, setGames] = useState([])
  const [profileExists, setProfileExists] = useState(false)
  const [form, setForm] = useState({
    alias: '',
    city: '',
    games: [],
    newGame: '',
    wantsToOrganize: false,
    isPublic: false,
  })

  const applyData = (payload) => {
    const incomingMember = payload?.member && typeof payload.member === 'object' ? payload.member : {}
    const profile = payload?.profile && typeof payload.profile === 'object' ? payload.profile : null
    const incomingGames = normalizeIncomingGames(payload?.games)
    const allowedGameSlugs = new Set(incomingGames.map((game) => game.slug))
    const savedGameSlugs = Array.isArray(profile?.games)
      ? profile.games
          .map((game) => typeof game?.slug === 'string' ? game.slug.trim() : '')
          .filter((slug) => slug && allowedGameSlugs.has(slug))
      : []

    setMember({
      firstName: typeof incomingMember.firstName === 'string' ? incomingMember.firstName.trim().slice(0, 100) : '',
      nickname: typeof incomingMember.nickname === 'string' ? incomingMember.nickname.trim().slice(0, 100) : '',
    })
    setGames(incomingGames)
    setProfileExists(Boolean(profile))
    setForm({
      alias: typeof profile?.alias === 'string'
        ? profile.alias.trim().slice(0, 100)
        : (incomingMember.nickname || incomingMember.firstName || '').trim().slice(0, 100),
      city: typeof profile?.city === 'string' ? profile.city.trim().slice(0, 150) : '',
      games: Array.from(new Set(savedGameSlugs)).slice(0, 50),
      newGame: '',
      wantsToOrganize: Boolean(profile?.wantsToOrganize),
      isPublic: profile ? Boolean(profile.isPublic) : false,
    })
    setLoading(false)
  }

  useEffect(() => {
    const retryTimers = []
    let timeoutTimer

    const clearHandshakeTimers = () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer))
      if (timeoutTimer) window.clearTimeout(timeoutTimer)
    }

    const handleMessage = (event) => {
      if (!isTrustedWixParentMessage(event, window.parent)) return

      const message = event.data

      if (message.type === MESSAGE_TYPES.data) {
        clearHandshakeTimers()
        applyData(message.payload)
        setError('')
      }

      if (message.type === MESSAGE_TYPES.saved) {
        setSaving(false)
        setSaved(true)
        setProfileExists(true)
        setForm((current) => ({ ...current, newGame: '' }))
      }

      if (message.type === MESSAGE_TYPES.error) {
        clearHandshakeTimers()
        setSaving(false)
        setLoading(false)
        setError(typeof message.message === 'string' ? message.message.slice(0, 300) : 'Une erreur est survenue.')
      }
    }

    window.addEventListener('message', handleMessage)

    if (isEmbedded()) {
      postToWix({ type: MESSAGE_TYPES.ready })

      ;[1500, 4000, 8000].forEach((delay) => {
        retryTimers.push(window.setTimeout(() => {
          postToWix({ type: MESSAGE_TYPES.request })
        }, delay))
      })

      timeoutTimer = window.setTimeout(() => {
        setLoading(false)
        setError('La connexion avec Wix ne répond pas. Rechargez cette page ou essayez la page publiée en étant connecté à votre compte.')
      }, 12000)
    } else {
      applyData(previewData)
    }

    return () => {
      window.removeEventListener('message', handleMessage)
      clearHandshakeTimers()
    }
  }, [])

  const update = (key, value) => {
    setSaved(false)
    setError('')
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = (event) => {
    event.preventDefault()
    const payload = sanitizeProfileEditorSavePayload(form)

    if (!payload.alias) {
      setError('Entrez un nom public / alias.')
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')

    if (isEmbedded()) {
      postToWix({ type: MESSAGE_TYPES.save, payload })
      return
    }

    // Standalone route is a visual preview only. It deliberately never calls
    // the production profile API because Wix authentication belongs to Wix.
    window.setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setProfileExists(true)
      setForm((current) => ({ ...current, newGame: '' }))
    }, 450)
  }

  if (loading) {
    return (
      <main className="editor-shell editor-shell--loading">
        <LoaderCircle className="editor-spinner" size={34} />
        <strong>Chargement de votre profil joueur…</strong>
      </main>
    )
  }

  if (!member && error) {
    return (
      <main className="editor-shell editor-shell--loading">
        <ShieldCheck size={34} />
        <strong>Impossible de charger votre profil joueur.</strong>
        <p className="editor-error">{error}</p>
      </main>
    )
  }

  return (
    <main className="editor-shell">
      <section className="editor-heading">
        <div className="editor-heading__icon"><UserRound size={25} /></div>
        <div>
          <span className="section-kicker"><Sparkles size={15} /> Espace joueur</span>
          <h1>{profileExists ? 'Modifier mon profil joueur' : 'Créer mon profil joueur'}</h1>
          <p>
            {member?.firstName ? `Bonjour ${member.firstName}. ` : ''}
            Présentez-vous aux autres joueurs et dites-leur à quoi vous aimeriez jouer.
          </p>
        </div>
      </section>

      <form className="editor-layout" onSubmit={submit}>
        <div className="editor-main">
          <section className="editor-card">
            <div className="editor-section-title">
              <div className="editor-step">1</div>
              <div><h2>Votre identité de joueur</h2><p>Choisissez les informations que vous souhaitez utiliser comme joueur.</p></div>
            </div>

            <div className="editor-field-grid">
              <label className="editor-field">
                <span>Nom public / alias <em>requis</em></span>
                <input value={form.alias} maxLength={100} onChange={(event) => update('alias', event.target.value)} placeholder="Ex. Camille" />
              </label>
              <label className="editor-field">
                <span><MapPin size={14} /> Ville</span>
                <input value={form.city} maxLength={150} onChange={(event) => update('city', event.target.value)} placeholder="Ex. Sherbrooke" />
              </label>
            </div>
          </section>

          <section className="editor-card">
            <div className="editor-section-title">
              <div className="editor-step">2</div>
              <div><h2>À quoi aimez-vous jouer?</h2><p>Choisissez autant de jeux que vous voulez.</p></div>
            </div>

            <GamePicker games={games} selected={form.games} onChange={(value) => update('games', value)} />

            <label className="editor-field editor-field--wide">
              <span>Votre jeu n’est pas dans la liste?</span>
              <input value={form.newGame} maxLength={150} onChange={(event) => update('newGame', event.target.value)} placeholder="Proposer un autre jeu" />
              <small>Votre suggestion sera envoyée pour ajout éventuel.</small>
            </label>
          </section>

          <section className="editor-card">
            <div className="editor-section-title">
              <div className="editor-step">3</div>
              <div><h2>Comment voulez-vous participer?</h2><p>Vous pourrez modifier ces choix plus tard.</p></div>
            </div>

            <div className="editor-toggle-list">
              <Toggle
                checked={form.wantsToOrganize}
                onChange={(value) => update('wantsToOrganize', value)}
                title="Je veux aussi organiser des parties"
                description="Permet aux futurs outils d’organisation de vous proposer des fonctions adaptées."
              />
              <Toggle
                checked={form.isPublic}
                onChange={(value) => update('isPublic', value)}
                title="Afficher mon profil dans l’annuaire public"
                description="Cette option est désactivée par défaut. Cochez-la seulement si vous voulez rendre ce profil visible dans l’annuaire Jouer pour de bon."
              />
            </div>
          </section>
        </div>

        <aside className="editor-aside">
          <section className="editor-preview">
            <span className="section-kicker">Aperçu</span>
            <div className="editor-avatar">{(form.alias || '?').slice(0, 2).toUpperCase()}</div>
            <h2>{form.alias || 'Votre alias'}</h2>
            <p className="editor-preview__location"><MapPin size={15} /> {form.city || 'Votre ville'}</p>
            <div className="editor-preview__games">
              {form.games.length > 0
                ? form.games.slice(0, 4).map((slug) => {
                    const game = games.find((item) => item.slug === slug)
                    return <span key={slug}>{game?.nameFr || game?.nameEn || slug}</span>
                  })
                : <span>Vos jeux apparaîtront ici</span>}
            </div>
            <div className="editor-trust"><BadgeCheck size={17} /><span>Les statistiques, dons et avis seront ajoutés uniquement à partir d’activités vérifiées.</span></div>
          </section>

          <section className="editor-privacy-note">
            <ShieldCheck size={20} />
            <div><strong>Votre compte Wix reste votre identité sécurisée.</strong><p>L’éditeur intégré ne reçoit ni votre mot de passe, ni votre courriel de connexion, ni la clé privée de l’API.</p></div>
          </section>
        </aside>

        <div className="editor-submit-bar">
          <div className="editor-submit-status" role="status" aria-live="polite">
            {error && <span className="editor-error">{error}</span>}
            {saved && <span className="editor-success"><Check size={16} /> Profil enregistré.</span>}
            {!error && !saved && <span><HeartHandshake size={16} /> Votre profil vous permet de participer à la communauté sans être publié automatiquement.</span>}
          </div>
          <button className="button button--primary editor-save" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="editor-spinner" size={18} /> : <Save size={18} />}
            {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
          </button>
        </div>
      </form>

      <p className="editor-footer-note"><Users size={15} /> Jouer pour de bon · Playing for Good</p>
    </main>
  )
}
