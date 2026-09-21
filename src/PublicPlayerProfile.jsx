import { useEffect, useState } from 'react'

const origins = new Set(['https://www.jouerpourdebon.ca', 'https://jouerpourdebon.ca', 'https://editor.wix.com', 'https://yellowpagescanada-website-10110.editor.wix.com'])

export default function PublicPlayerProfile({ playerId, onBack, language }) {
  const fr = language === 'fr'
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setData(null)
    setError(false)
    const requestId = crypto.randomUUID()
    const timer = setTimeout(() => setError(true), 15000)
    const receive = event => {
      if (event.source !== window.parent || !origins.has(event.origin) || event.data?.requestId !== requestId) return
      if (!['JPDB_PUBLIC_PLAYER_DATA', 'JPDB_PUBLIC_PLAYER_ERROR'].includes(event.data.type)) return
      clearTimeout(timer)
      if (event.data.type === 'JPDB_PUBLIC_PLAYER_DATA' && event.data.payload?.dashboard) {
        setData(event.data.payload)
        setError(false)
      } else setError(true)
    }
    window.addEventListener('message', receive)
    // The initial handshake contains a public profile ID, never credentials or private data.
    window.parent.postMessage({ type: 'JPDB_PUBLIC_PLAYER_REQUEST', requestId, playerId }, '*')
    return () => { clearTimeout(timer); window.removeEventListener('message', receive) }
  }, [playerId, attempt])
  const money = (amount, currency) => {
    try { return new Intl.NumberFormat(fr ? 'fr-CA' : 'en-CA', { style: 'currency', currency }).format(amount) }
    catch { return '—' }
  }
  const amounts = values => Object.entries(values || {}).map(([currency, amount]) => money(amount, currency)).join(' · ') || money(0, 'CAD')
  const impact = data?.dashboard
  return <main className="app-shell">
    <button className="button" onClick={onBack}>{fr ? '← Retour aux joueurs' : '← Back to players'}</button>
    <section className="panel" style={{ marginTop: 24 }}>
      <span className="section-kicker">{fr ? 'Profil public · Membres du site' : 'Public profile · Site members'}</span>
      <h1>{data?.profile?.alias || (fr ? 'Profil joueur' : 'Player profile')}</h1>
      {error ? <div role="alert"><p>{fr ? 'Connectez-vous sur Jouer pour de bon pour consulter ce profil. Si vous êtes déjà connecté, le profil est masqué ou temporairement indisponible.' : 'Sign in on Jouer pour de bon to view this profile. If already signed in, the profile is hidden or temporarily unavailable.'}</p><button className="button" onClick={() => setAttempt(value => value + 1)}>{fr ? 'Réessayer' : 'Try again'}</button></div>
        : !impact ? <p role="status">{fr ? 'Chargement du profil…' : 'Loading profile…'}</p>
          : <><div className="aside-grid">
            <div className="big-stat"><strong>{impact.gamesWon}</strong><span>{fr ? 'Parties gagnées' : 'Games won'}</span></div>
            <div className="big-stat"><strong>{amounts(impact.totalWinnings)}</strong><span>{fr ? 'Montants gagnés' : 'Total winnings'}</span></div>
            <div className="big-stat"><strong>{amounts(impact.totalContributions)}</strong><span>{fr ? 'Contributions à toutes les causes' : 'Contributions to all causes'}</span></div>
          </div><h2>{fr ? 'Contributions aux causes' : 'Contributions by cause'}</h2>
          {(impact.causes || []).length ? <ul>{impact.causes.map(cause => <li key={`${cause.id}:${cause.currency}`}><strong>{cause.name}</strong> — {money(cause.contributed, cause.currency)}</li>)}</ul> : <p>{fr ? 'Aucune contribution confirmée pour le moment.' : 'No confirmed contributions yet.'}</p>}
          <p className="muted">{fr ? 'Résultats et contributions confirmés. Les devises sont présentées séparément.' : 'Confirmed results and contributions. Currencies are shown separately.'}</p></>}
    </section>
  </main>
}
