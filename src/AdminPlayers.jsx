import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, LockKeyhole, Search, ShieldCheck, Users } from 'lucide-react'
import { WIX_PARENT_ORIGIN } from './profileEditorBridge.js'
import './adminPlayers.css'

const TYPES = Object.freeze({
  ready: 'JPDB_ADMIN_PLAYERS_READY',
  request: 'JPDB_ADMIN_PLAYERS_REQUEST',
  data: 'JPDB_ADMIN_PLAYERS_DATA',
  error: 'JPDB_ADMIN_PLAYERS_ERROR',
})

function ageLabel(value) {
  if (value === 'under_16') return 'Moins de 16 ans'
  if (value === 'under_18') return '16–17 ans'
  if (value === 'adult') return 'Adulte (18+)'
  return 'Âge inconnu'
}

function yesNo(value) { return value ? 'Oui' : 'Non' }

function postRequest(payload) {
  if (window.parent === window) return
  window.parent.postMessage({ type: TYPES.request, payload }, WIX_PARENT_ORIGIN)
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, hasNext: false, hasPrevious: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [ageCategory, setAgeCategory] = useState('')
  const firstLoad = useRef(true)

  useEffect(() => {
    const handle = (event) => {
      const message = event?.data
      if (!message || typeof message !== 'object') return
      if (message.type === TYPES.data) {
        const payload = message.payload && typeof message.payload === 'object' ? message.payload : {}
        setPlayers(Array.isArray(payload.players) ? payload.players : [])
        setPagination(payload.pagination && typeof payload.pagination === 'object'
          ? payload.pagination
          : { page: 1, limit: 50, hasNext: false, hasPrevious: false })
        setLoading(false)
        setError('')
      }
      if (message.type === TYPES.error) {
        setLoading(false)
        setError(message.message || 'Accès refusé ou données indisponibles.')
      }
    }

    window.addEventListener('message', handle)
    if (window.parent !== window) {
      window.parent.postMessage({ type: TYPES.ready }, WIX_PARENT_ORIGIN)
    } else {
      setLoading(false)
      setError('Cette page privée doit être ouverte depuis la page administrateur Wix autorisée.')
    }
    return () => window.removeEventListener('message', handle)
  }, [])

  useEffect(() => {
    if (window.parent === window) return
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      postRequest({ q: query, ageCategory, page: 1, limit: 50 })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, ageCategory])

  const goToPage = (page) => {
    if (page < 1) return
    setLoading(true)
    postRequest({ q: query, ageCategory, page, limit: pagination.limit || 50 })
  }

  if (error) {
    return <main className="admin-registry admin-state"><LockKeyhole size={34}/><h1>Registre privé des joueurs</h1><p>{error}</p></main>
  }

  return <main className="admin-registry">
    <header className="admin-header">
      <div>
        <span><ShieldCheck size={16}/> Administrateur seulement</span>
        <h1>Registre privé des joueurs</h1>
        <p>Informations confidentielles. Ne pas partager ni afficher publiquement.</p>
      </div>
      <div className="admin-count"><Users size={18}/>{players.length} sur cette page</div>
    </header>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) minmax(180px,260px)', gap: 12, marginBottom: 16 }}>
      <label className="admin-search" style={{ marginBottom: 0 }}>
        <Search size={17}/>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher nom, alias, courriel, téléphone, ville…" />
      </label>
      <label className="editor-field" style={{ margin: 0 }}>
        <select value={ageCategory} onChange={(event) => setAgeCategory(event.target.value)} aria-label="Catégorie d’âge">
          <option value="">Tous les âges</option>
          <option value="under_16">Moins de 16 ans</option>
          <option value="under_18">16–17 ans</option>
          <option value="adult">Adultes (18+)</option>
          <option value="unknown">Âge inconnu</option>
        </select>
      </label>
    </div>

    {loading ? (
      <div className="admin-state" style={{ minHeight: 220 }}><LoaderCircle className="editor-spinner" size={30}/><strong>Chargement…</strong></div>
    ) : (
      <>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Joueur</th><th>Âge</th><th>Contact</th><th>Adresse</th><th>Urgence / tuteur</th><th>Paiement</th><th>Intérêts</th></tr></thead>
            <tbody>{players.map((p)=><tr key={p.id}>
              <td><strong>{p.firstName || '—'} {p.lastName || ''}</strong><small>Alias: {p.alias || '—'}</small><small>Public: {yesNo(p.isPublic)}</small></td>
              <td><strong>{ageLabel(p.ageCategory)}</strong><small>Naissance: {p.birthDate || '—'}</small></td>
              <td><span>{p.email || '—'}</span><small>{p.phone || '—'}</small></td>
              <td><span>{p.streetAddress || '—'}</span><small>{[p.city,p.regionName || p.regionCode,p.postalCode,p.countryCode].filter(Boolean).join(', ') || '—'}</small></td>
              <td><span>Urgence: {p.emergencyContactName || '—'}</span><small>{p.emergencyContactPhone || '—'}</small>{p.ageCategory !== 'adult' && <><small>Tuteur: {p.legalGuardianName || '—'}</small><small>{p.legalGuardianPhone || '—'}</small></>}</td>
              <td><span>{p.payoutContactPreference === 'phone' ? 'Téléphone' : p.payoutContactPreference === 'email' ? 'Courriel' : '—'}</span></td>
              <td><span>Organiser: {yesNo(p.wantsToOrganize)}</span><small>Bénévolat: {yesNo(p.interestedInVolunteering)}</small></td>
            </tr>)}</tbody>
          </table>
          {players.length === 0 && <p className="admin-empty">Aucun joueur correspondant.</p>}
        </div>

        <nav aria-label="Pagination du registre" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="button button--secondary" type="button" disabled={!pagination.hasPrevious} onClick={() => goToPage((pagination.page || 1) - 1)}>
            <ChevronLeft size={17}/> Précédent
          </button>
          <span>Page {pagination.page || 1}</span>
          <button className="button button--secondary" type="button" disabled={!pagination.hasNext} onClick={() => goToPage((pagination.page || 1) + 1)}>
            Suivant <ChevronRight size={17}/>
          </button>
        </nav>
      </>
    )}
  </main>
}
