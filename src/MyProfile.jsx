import { useEffect, useState } from 'react'
import { Gamepad2, HeartHandshake, LoaderCircle, MapPin, Pencil, ShieldCheck, Trophy, UserRound } from 'lucide-react'
import EditProfile from './EditProfile.jsx'
import { getInitialLanguage, setLanguage } from './i18n.js'
import { PROFILE_EDITOR_MESSAGE_TYPES as TYPES } from './profileEditorBridge.js'
import './myProfile.css'

export default function MyProfile() {
  const language = getInitialLanguage()
  const fr = language === 'fr'
  const t = (french, english) => fr ? french : english
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = fr ? 'Mon profil joueur | Jouer pour de bon' : 'My player profile | Playing for Good'
    setLoading(true)
    setError('')
    if (window.parent === window) {
      setLoading(false)
      setError(t('Ouvrez cette page depuis votre compte Jouer pour de bon pour consulter et enregistrer votre profil.', 'Open this page from your Playing for Good account to view and save your profile.'))
      return
    }
    const timers = []
    const clearTimers = () => timers.forEach(window.clearTimeout)
    const receive = (event) => {
      // Wix relays component messages through its parent wrapper. Only that
      // window may supply account data; sibling frames cannot impersonate it.
      if (event.source !== window.parent || !event.data || typeof event.data !== 'object') return
      if (event.data.type === TYPES.data) {
        const payload = event.data.payload
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.games)) return
        clearTimers()
        setData(payload)
        setLoading(false)
        setError('')
      } else if (event.data.type === TYPES.error) {
        clearTimers()
        setLoading(false)
        setError(t('Impossible de charger votre profil. Vérifiez votre connexion et réessayez.', 'Your profile could not be loaded. Check your connection and try again.'))
      }
    }
    const request = () => window.parent.postMessage({ type: TYPES.request }, '*')
    window.addEventListener('message', receive)
    request()
    ;[1500, 4000, 8000].forEach(delay => timers.push(window.setTimeout(request, delay)))
    timers.push(window.setTimeout(() => {
      setLoading(false)
      setError(t('La connexion à votre compte ne répond pas. Réessayez.', 'Your account connection is not responding. Please try again.'))
    }, 12000))
    return () => { clearTimers(); window.removeEventListener('message', receive) }
  }, [revision, language])

  const refresh = () => { setEditing(false); setRevision(value => value + 1) }
  if (editing) return <EditProfile initialData={data} onCancel={() => setEditing(false)} onSaved={() => { setSaved(true); refresh() }} />
  if (loading) return <main className="editor-shell editor-shell--loading" aria-busy="true"><LoaderCircle className="editor-spinner" size={32}/><p>{t('Chargement de votre profil…', 'Loading your profile…')}</p></main>
  if (error) return <main className="editor-shell editor-shell--loading"><ShieldCheck size={32}/><h1>{t('Mon profil joueur', 'My player profile')}</h1><p role="alert">{error}</p><button className="button button--primary" onClick={refresh}>{t('Réessayer', 'Try again')}</button></main>

  const profile = data?.profile
  const name = profile?.alias || data?.member?.nickname || data?.member?.firstName || t('Votre profil', 'Your profile')
  const selectedGames = Array.isArray(profile?.games) ? profile.games : []
  const dashboard = data?.dashboard && typeof data.dashboard === 'object' ? data.dashboard : null
  const totals = dashboard?.totalContributions && typeof dashboard.totalContributions === 'object' ? dashboard.totalContributions : {}
  const money = (amount, currency) => new Intl.NumberFormat(fr ? 'fr-CA' : 'en-CA', { style: 'currency', currency }).format(amount || 0)
  const gameName = game => {
    const slug = typeof game === 'string' ? game : game.slug
    const details = data.games.find(item => item.slug === slug) || (typeof game === 'object' ? game : {})
    return (fr ? details.nameFr || details.nameEn : details.nameEn || details.nameFr) || slug
  }
  return <main className="editor-shell my-profile">
    <div className="my-profile-toolbar"><span className="section-kicker">{t('Espace joueur', 'Player area')}</span><div aria-label={t('Langue', 'Language')}>{['fr', 'en'].map(lang => <button key={lang} className="text-button" aria-pressed={language === lang} onClick={() => language !== lang && setLanguage(lang)}>{lang.toUpperCase()}</button>)}</div></div>
    <header className="editor-heading"><div className="editor-heading__icon"><UserRound size={25}/></div><div><h1>{t('Mon profil joueur', 'My player profile')}</h1><p>{t('Votre espace pour jouer, participer et faire une différence.', 'Your space to play, participate and make a difference.')}</p></div></header>
    {saved && <p className="editor-success" role="status">{t('Vos modifications ont été enregistrées.', 'Your changes have been saved.')}</p>}
    <section className="editor-card my-profile-identity">
      <div className="editor-avatar" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</div>
      <div className="my-profile-name"><h2>{name}</h2><p><MapPin size={16}/>{profile?.city || t('Ville non renseignée', 'City not provided')}</p><span className="my-profile-visibility">{profile?.isPublic ? t('Profil visible dans l’annuaire', 'Profile visible in the directory') : t('Profil privé', 'Private profile')}</span></div>
      <button className="button button--primary" onClick={() => setEditing(true)}><Pencil size={17}/>{profile ? t('Modifier mon profil', 'Edit my profile') : t('Créer mon profil', 'Create my profile')}</button>
    </section>
    {!profile && <p className="my-profile-welcome">{t('Bienvenue ! Complétez votre profil pour préparer vos prochaines participations.', 'Welcome! Complete your profile to get ready for your next activities.')}</p>}
    <section className="my-profile-stats" aria-label={t('Mon impact', 'My impact')}>
      <div><Trophy size={22}/><strong>{dashboard?.gamesPlayed ?? '—'}</strong><span>{t('Parties jouées', 'Games played')}</span></div>
      <div><Trophy size={22}/><strong>{dashboard?.gamesWon ?? '—'}</strong><span>{t('Parties gagnées', 'Games won')}</span></div>
      <div><HeartHandshake size={22}/><strong>{Object.entries(totals).length ? Object.entries(totals).map(([currency, amount]) => money(amount, currency)).join(' · ') : '—'}</strong><span>{t('Contributions aux causes', 'Contributions to causes')}</span></div>
    </section>
    <div className="my-profile-grid">
      <section className="editor-card"><h2><Gamepad2 size={21}/>{t('Mes jeux', 'My games')}</h2>{selectedGames.length ? <div className="chips">{selectedGames.map((game, index) => <span className="chip" key={index}>{gameName(game)}</span>)}</div> : <p>{t('Choisissez vos jeux dans votre profil.', 'Choose your games in your profile.')}</p>}</section>
      <section className="editor-card"><h2><HeartHandshake size={21}/>{t('Ma participation', 'My participation')}</h2><dl><div><dt>{t('Organiser des parties', 'Organize games')}</dt><dd>{profile?.wantsToOrganize ? t('Intéressé·e', 'Interested') : t('Non sélectionné', 'Not selected')}</dd></div><div><dt>{t('Faire du bénévolat', 'Volunteer')}</dt><dd>{profile?.interestedInVolunteering ? t('Intéressé·e', 'Interested') : t('Non sélectionné', 'Not selected')}</dd></div></dl></section>
      <section className="editor-card"><h2><HeartHandshake size={21}/>{t('Mes causes actuelles', 'My current causes')}</h2>{Array.isArray(dashboard?.causes) && dashboard.causes.length ? <ul className="my-profile-causes">{dashboard.causes.map((cause, index) => <li key={`${cause.id || cause.name}-${index}`}><span>{cause.name}</span><strong>{money(cause.contributed, cause.currency || 'CAD')}</strong></li>)}</ul> : <p>{dashboard ? t('Aucune contribution confirmée pour le moment.', 'No confirmed contribution yet.') : t('Chargement de votre impact…', 'Loading your impact…')}</p>}</section>
      <section className="editor-card"><h2><Trophy size={21}/>{t('Mon activité', 'My activity')}</h2><p>{t('Les parties et victoires sont calculées à partir des résultats approuvés. Les contributions viennent de paiements confirmés et ne peuvent pas être modifiées ici.', 'Games and wins come from approved results. Contributions come from confirmed payments and cannot be edited here.')}</p></section>
      <section className="editor-card"><h2><ShieldCheck size={21}/>{t('Mes informations privées', 'My private information')}</h2><p>{t('Consultez et modifiez vos coordonnées dans « Modifier mon profil ». Votre nom réel, votre adresse et vos contacts d’urgence ne sont pas affichés dans l’annuaire.', 'View and update your contact details in “Edit my profile”. Your real name, address and emergency contacts are not displayed in the directory.')}</p></section>
    </div>
  </main>
}

