import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, LockKeyhole, Search, ShieldCheck, Users } from 'lucide-react'
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

export default function AdminPlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handle = (event) => {
      const message = event?.data
      if (!message || typeof message !== 'object') return
      if (message.type === TYPES.data) {
        setPlayers(Array.isArray(message.payload) ? message.payload : [])
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
      window.setTimeout(() => window.parent.postMessage({ type: TYPES.request }, WIX_PARENT_ORIGIN), 1200)
    } else {
      setLoading(false)
      setError('Cette page privée doit être ouverte depuis la page administrateur Wix autorisée.')
    }
    return () => window.removeEventListener('message', handle)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter((p) => [p.firstName,p.lastName,p.alias,p.email,p.phone,p.city,p.regionName,p.countryCode,p.emergencyContactName,p.legalGuardianName].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [players, query])

  if (loading) return <main className="admin-registry admin-state"><LoaderCircle className="editor-spinner" size={34}/><strong>Chargement du registre privé…</strong></main>
  if (error) return <main className="admin-registry admin-state"><LockKeyhole size={34}/><h1>Registre privé des joueurs</h1><p>{error}</p></main>

  return <main className="admin-registry">
    <header className="admin-header"><div><span><ShieldCheck size={16}/> Administrateur seulement</span><h1>Registre privé des joueurs</h1><p>Informations confidentielles. Ne pas partager ni afficher publiquement.</p></div><div className="admin-count"><Users size={18}/>{players.length} joueurs</div></header>
    <label className="admin-search"><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher nom, alias, courriel, téléphone, ville…" /></label>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Joueur</th><th>Âge</th><th>Contact</th><th>Adresse</th><th>Urgence / tuteur</th><th>Paiement</th><th>Intérêts</th></tr></thead><tbody>{filtered.map((p)=><tr key={p.id}>
      <td><strong>{p.firstName || '—'} {p.lastName || ''}</strong><small>Alias: {p.alias || '—'}</small><small>Public: {yesNo(p.isPublic)}</small></td>
      <td><strong>{ageLabel(p.ageCategory)}</strong><small>Naissance: {p.birthDate || '—'}</small></td>
      <td><span>{p.email || '—'}</span><small>{p.phone || '—'}</small></td>
      <td><span>{p.streetAddress || '—'}</span><small>{[p.city,p.regionName || p.regionCode,p.postalCode,p.countryCode].filter(Boolean).join(', ') || '—'}</small></td>
      <td><span>Urgence: {p.emergencyContactName || '—'}</span><small>{p.emergencyContactPhone || '—'}</small>{p.ageCategory !== 'adult' && <><small>Tuteur: {p.legalGuardianName || '—'}</small><small>{p.legalGuardianPhone || '—'}</small></>}</td>
      <td><span>{p.payoutContactPreference === 'phone' ? 'Téléphone' : p.payoutContactPreference === 'email' ? 'Courriel' : '—'}</span></td>
      <td><span>Organiser: {yesNo(p.wantsToOrganize)}</span><small>Bénévolat: {yesNo(p.interestedInVolunteering)}</small></td>
    </tr>)}</tbody></table>{filtered.length === 0 && <p className="admin-empty">Aucun joueur correspondant.</p>}</div>
  </main>
}
