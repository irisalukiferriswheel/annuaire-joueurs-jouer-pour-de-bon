import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Check, Gamepad2, HeartHandshake, LoaderCircle, MapPin, Save, ShieldCheck, Sparkles, UserRound, Users } from 'lucide-react'
import {
  PROFILE_EDITOR_MESSAGE_TYPES as MESSAGE_TYPES,
  WIX_PARENT_ORIGIN,
  isTrustedWixParentMessage,
  sanitizeProfileEditorSavePayload,
} from './profileEditorBridge.js'

const COUNTRY_CODES = ['CA','US','AF','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','UM','UY','UZ','VU','VE','VN','VG','VI','WF','EH','YE','ZM','ZW']

const countryNames = new Intl.DisplayNames(['fr-CA'], { type: 'region' })
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryNames.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr-CA'))

function isEmbedded() { return window.parent !== window }
function postToWix(message) {
  if (!isEmbedded()) return false
  window.parent.postMessage(message, WIX_PARENT_ORIGIN)
  return true
}

function ageFromBirthDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const birth = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const month = now.getUTCMonth() - birth.getUTCMonth()
  if (month < 0 || (month === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1
  return age >= 0 ? age : null
}

function Toggle({ checked, onChange, title, description }) {
  return <label className="editor-toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="editor-toggle__control" aria-hidden="true"><Check size={14} /></span>
    <span><strong>{title}</strong><small>{description}</small></span>
  </label>
}

function GamePicker({ games, selected, onChange }) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  return <div className="editor-game-grid">
    {games.map((game) => {
      const active = selectedSet.has(game.slug)
      return <button type="button" className={`editor-game ${active ? 'editor-game--selected' : ''}`} aria-pressed={active} key={game.slug}
        onClick={() => onChange(active ? selected.filter((v) => v !== game.slug) : [...selected, game.slug])}>
        <Gamepad2 size={17} /><span>{game.nameFr || game.nameEn || game.slug}</span>{active && <Check size={16} />}
      </button>
    })}
  </div>
}

function normalizeIncomingGames(value) {
  if (!Array.isArray(value)) return []
  return value.filter((g) => g && typeof g === 'object' && typeof g.slug === 'string' && g.slug.trim()).slice(0, 250).map((g) => ({
    slug: g.slug.trim().slice(0, 100), nameFr: typeof g.nameFr === 'string' ? g.nameFr.trim().slice(0, 200) : '',
    nameEn: typeof g.nameEn === 'string' ? g.nameEn.trim().slice(0, 200) : '', category: typeof g.category === 'string' ? g.category.trim().slice(0, 100) : '',
  }))
}

const EMPTY_FORM = {
  firstName:'', lastName:'', alias:'', email:'', phone:'', birthDate:'', streetAddress:'', city:'', regionCode:'', regionName:'', postalCode:'', countryCode:'CA',
  payoutContactPreference:'', emergencyContactName:'', emergencyContactPhone:'', legalGuardianName:'', legalGuardianPhone:'', games:[], newGame:'',
  wantsToOrganize:false, interestedInVolunteering:false, isPublic:false,
}

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [member, setMember] = useState(null)
  const [games, setGames] = useState([])
  const [profileExists, setProfileExists] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const age = ageFromBirthDate(form.birthDate)
  const isMinor = age !== null && age < 18

  const applyData = (payload) => {
    const incomingMember = payload?.member && typeof payload.member === 'object' ? payload.member : {}
    const profile = payload?.profile && typeof payload.profile === 'object' ? payload.profile : null
    const incomingGames = normalizeIncomingGames(payload?.games)
    const allowed = new Set(incomingGames.map((g) => g.slug))
    const savedGames = Array.isArray(profile?.games)
      ? profile.games.map((g) => typeof g === 'string' ? g : g?.slug).filter((slug) => typeof slug === 'string' && allowed.has(slug)) : []

    setMember({
      firstName: typeof incomingMember.firstName === 'string' ? incomingMember.firstName.trim().slice(0,100) : '',
      lastName: typeof incomingMember.lastName === 'string' ? incomingMember.lastName.trim().slice(0,100) : '',
      nickname: typeof incomingMember.nickname === 'string' ? incomingMember.nickname.trim().slice(0,100) : '',
      email: typeof incomingMember.email === 'string' ? incomingMember.email.trim().slice(0,320) : '',
    })
    setGames(incomingGames)
    setProfileExists(Boolean(profile))
    setForm({
      firstName: profile?.firstName || incomingMember.firstName || '', lastName: profile?.lastName || incomingMember.lastName || '',
      alias: profile?.alias || incomingMember.nickname || '', email: profile?.email || incomingMember.email || '', phone: profile?.phone || '',
      birthDate: profile?.birthDate || '', streetAddress: profile?.streetAddress || '', city: profile?.city || '', regionCode: profile?.regionCode || '',
      regionName: profile?.regionName || '', postalCode: profile?.postalCode || '', countryCode: profile?.countryCode || 'CA',
      payoutContactPreference: profile?.payoutContactPreference || '', emergencyContactName: profile?.emergencyContactName || '',
      emergencyContactPhone: profile?.emergencyContactPhone || '', legalGuardianName: profile?.legalGuardianName || '', legalGuardianPhone: profile?.legalGuardianPhone || '',
      games: Array.from(new Set(savedGames)).slice(0,50), newGame:'', wantsToOrganize:Boolean(profile?.wantsToOrganize),
      interestedInVolunteering:Boolean(profile?.interestedInVolunteering), isPublic: profile ? Boolean(profile.isPublic) : false,
    })
    setLoading(false)
  }

  useEffect(() => {
    const timers = []
    let timeout
    const clearTimers = () => { timers.forEach(window.clearTimeout); if (timeout) window.clearTimeout(timeout) }
    const handleMessage = (event) => {
      if (!isTrustedWixParentMessage(event, window.parent)) return
      const message = event.data
      if (message.type === MESSAGE_TYPES.data) { clearTimers(); applyData(message.payload); setError('') }
      if (message.type === MESSAGE_TYPES.saved) { setSaving(false); setSaved(true); setProfileExists(true); setForm((f) => ({...f,newGame:''})) }
      if (message.type === MESSAGE_TYPES.error) { clearTimers(); setSaving(false); setLoading(false); setError(typeof message.message === 'string' ? message.message.slice(0,300) : 'Une erreur est survenue.') }
    }
    window.addEventListener('message', handleMessage)
    if (isEmbedded()) {
      postToWix({type:MESSAGE_TYPES.ready})
      ;[1500,4000,8000].forEach((delay) => timers.push(window.setTimeout(() => postToWix({type:MESSAGE_TYPES.request}), delay)))
      timeout = window.setTimeout(() => { setLoading(false); setError('La connexion avec Wix ne répond pas.') }, 12000)
    } else {
      setMember({firstName:'Camille',lastName:'Martin',nickname:'Camille',email:'camille@example.com'})
      setGames([{slug:'basketball',nameFr:'Basketball'},{slug:'chess',nameFr:'Échecs'}]); setLoading(false)
    }
    return () => { window.removeEventListener('message', handleMessage); clearTimers() }
  }, [])

  const update = (key, value) => { setSaved(false); setError(''); setForm((f) => ({...f,[key]:value})) }

  const submit = (event) => {
    event.preventDefault()
    const payload = sanitizeProfileEditorSavePayload(form)
    const required = [
      ['firstName','Entrez votre prénom.'],['lastName','Entrez votre nom de famille.'],['alias','Entrez un nom public / alias.'],['email','Entrez votre courriel.'],
      ['phone','Entrez votre numéro de téléphone.'],['birthDate','Entrez votre date de naissance.'],['streetAddress','Entrez votre adresse.'],['city','Entrez votre ville.'],
      ['postalCode','Entrez votre code postal ou ZIP.'],['countryCode','Choisissez votre pays.'],['payoutContactPreference','Choisissez comment nous devons vous contacter pour un paiement.'],
      ['emergencyContactName','Entrez un contact d’urgence.'],['emergencyContactPhone','Entrez le téléphone du contact d’urgence.'],
    ]
    for (const [key,msg] of required) if (!payload[key]) return setError(msg)
    if (!payload.regionCode && !payload.regionName) return setError('Entrez votre province, état ou région.')
    if (isMinor && (!payload.legalGuardianName || !payload.legalGuardianPhone)) return setError('Les coordonnées du parent ou tuteur légal sont requises pour un joueur mineur.')
    if (payload.games.length === 0) return setError('Choisissez au moins un jeu.')
    setSaving(true); setSaved(false); setError('')
    if (isEmbedded()) return void postToWix({type:MESSAGE_TYPES.save,payload})
    window.setTimeout(() => { setSaving(false); setSaved(true); setProfileExists(true) }, 450)
  }

  if (loading) return <main className="editor-shell editor-shell--loading"><LoaderCircle className="editor-spinner" size={34}/><strong>Chargement de votre profil joueur…</strong></main>
  if (!member && error) return <main className="editor-shell editor-shell--loading"><ShieldCheck size={34}/><strong>Impossible de charger votre profil joueur.</strong><p className="editor-error">{error}</p></main>

  return <main className="editor-shell">
    <section className="editor-heading"><div className="editor-heading__icon"><UserRound size={25}/></div><div>
      <span className="section-kicker"><Sparkles size={15}/> Espace joueur</span>
      <h1>{profileExists ? 'Modifier mon profil joueur' : 'Compléter mon profil joueur'}</h1>
      <p>{member?.firstName ? `Bonjour ${member.firstName}. ` : ''}Ces renseignements permettent les inscriptions, la sécurité et le paiement des gagnants. Les données marquées privées ne sont jamais publiées.</p>
    </div></section>

    <form className="editor-layout" onSubmit={submit}>
      <div className="editor-main">
        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">1</div><div><h2>Identité</h2><p>Votre vrai nom reste privé. Votre alias est votre identité publique.</p></div></div>
          <div className="editor-field-grid">
            <label className="editor-field"><span>Prénom <em>requis · privé</em></span><input value={form.firstName} required onChange={(e)=>update('firstName',e.target.value)}/></label>
            <label className="editor-field"><span>Nom de famille <em>requis · privé</em></span><input value={form.lastName} required onChange={(e)=>update('lastName',e.target.value)}/></label>
          </div>
          <label className="editor-field editor-field--wide"><span>Nom public / alias <em>requis · public</em></span><input value={form.alias} required onChange={(e)=>update('alias',e.target.value)}/><small>C’est le nom que les autres joueurs verront.</small></label>
          <div className="editor-field-grid editor-field--wide">
            <label className="editor-field"><span>Date de naissance <em>requise · privée</em></span><input type="date" value={form.birthDate} required max={new Date().toISOString().slice(0,10)} onChange={(e)=>update('birthDate',e.target.value)}/><small>{age === null ? 'Utilisée pour les règles d’âge et de consentement.' : age < 16 ? 'Catégorie privée : moins de 16 ans.' : age < 18 ? 'Catégorie privée : 16–17 ans.' : 'Catégorie privée : adulte.'}</small></label>
            <label className="editor-field"><span>Ville <em>requise · publique si profil visible</em></span><input value={form.city} required onChange={(e)=>update('city',e.target.value)} placeholder="Ex. Sherbrooke"/></label>
          </div>
        </section>

        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">2</div><div><h2>Coordonnées privées</h2><p>Pour vous joindre et organiser le paiement si vous gagnez.</p></div></div>
          <div className="editor-field-grid">
            <label className="editor-field"><span>Courriel <em>requis · privé</em></span><input type="email" value={form.email} required onChange={(e)=>update('email',e.target.value)}/></label>
            <label className="editor-field"><span>Téléphone <em>requis · privé</em></span><input type="tel" value={form.phone} required onChange={(e)=>update('phone',e.target.value)}/></label>
          </div>
          <label className="editor-field editor-field--wide"><span>Contact préféré pour un paiement <em>requis · privé</em></span><select value={form.payoutContactPreference} required onChange={(e)=>update('payoutContactPreference',e.target.value)}><option value="">Choisir…</option><option value="email">Courriel</option><option value="phone">Téléphone</option></select><small>Il s’agit du canal pour vous contacter afin d’organiser le paiement, pas de coordonnées bancaires.</small></label>
        </section>

        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">3</div><div><h2>Adresse privée</h2><p>Conçue pour fonctionner au Canada et à l’international.</p></div></div>
          <label className="editor-field"><span>Adresse civique <em>requise · privée</em></span><input value={form.streetAddress} required onChange={(e)=>update('streetAddress',e.target.value)}/></label>
          <div className="editor-field-grid editor-field--wide">
            <label className="editor-field"><span>Pays <em>requis · privé</em></span><select value={form.countryCode} required onChange={(e)=>update('countryCode',e.target.value)}>{COUNTRIES.map((c)=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
            <label className="editor-field"><span>Province / état / région <em>requis · privé</em></span><input value={form.regionName} required onChange={(e)=>update('regionName',e.target.value)} placeholder="Ex. Québec"/></label>
          </div>
          <div className="editor-field-grid editor-field--wide">
            <label className="editor-field"><span>Code de région <em>privé</em></span><input value={form.regionCode} onChange={(e)=>update('regionCode',e.target.value)} placeholder="Ex. QC"/></label>
            <label className="editor-field"><span>Code postal / ZIP <em>requis · privé</em></span><input value={form.postalCode} required onChange={(e)=>update('postalCode',e.target.value)}/></label>
          </div>
        </section>

        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">4</div><div><h2>Sécurité et urgence</h2><p>Un contact d’urgence est requis pour tous les joueurs.</p></div></div>
          <div className="editor-field-grid">
            <label className="editor-field"><span>Nom du contact d’urgence <em>requis · privé</em></span><input value={form.emergencyContactName} required onChange={(e)=>update('emergencyContactName',e.target.value)}/></label>
            <label className="editor-field"><span>Téléphone du contact <em>requis · privé</em></span><input type="tel" value={form.emergencyContactPhone} required onChange={(e)=>update('emergencyContactPhone',e.target.value)}/></label>
          </div>
          {isMinor && <div className="editor-guardian editor-field--wide">
            <strong>Joueur mineur — parent ou tuteur légal requis</strong>
            <div className="editor-field-grid">
              <label className="editor-field"><span>Nom du parent / tuteur <em>requis · privé</em></span><input value={form.legalGuardianName} required onChange={(e)=>update('legalGuardianName',e.target.value)}/></label>
              <label className="editor-field"><span>Téléphone du parent / tuteur <em>requis · privé</em></span><input type="tel" value={form.legalGuardianPhone} required onChange={(e)=>update('legalGuardianPhone',e.target.value)}/></label>
            </div>
          </div>}
        </section>

        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">5</div><div><h2>Jeux</h2><p>Choisissez au moins un jeu.</p></div></div>
          <GamePicker games={games} selected={form.games} onChange={(v)=>update('games',v)}/>
          <label className="editor-field editor-field--wide"><span>Votre jeu n’est pas dans la liste?</span><input value={form.newGame} onChange={(e)=>update('newGame',e.target.value)} placeholder="Proposer un autre jeu"/></label>
        </section>

        <section className="editor-card">
          <div className="editor-section-title"><div className="editor-step">6</div><div><h2>Participation</h2><p>Ces choix peuvent être modifiés plus tard.</p></div></div>
          <div className="editor-toggle-list">
            <Toggle checked={form.wantsToOrganize} onChange={(v)=>update('wantsToOrganize',v)} title="Je veux aussi organiser des parties" description="Indique votre intérêt pour les outils d’organisation."/>
            <Toggle checked={form.interestedInVolunteering} onChange={(v)=>update('interestedInVolunteering',v)} title="Je suis intéressé·e à faire du bénévolat" description="Information privée pour l’administration. Les crédits de jeu liés au bénévolat seront gérés séparément."/>
            <Toggle checked={form.isPublic} onChange={(v)=>update('isPublic',v)} title="Afficher mon profil dans l’annuaire public" description="Important si vous voulez être trouvé·e par d’autres joueurs. Seuls l’alias, la ville, les jeux et les futurs champs explicitement publics peuvent apparaître."/>
          </div>
        </section>
      </div>

      <aside className="editor-aside">
        <section className="editor-preview"><span className="section-kicker">Aperçu public</span><div className="editor-avatar">{(form.alias||'?').slice(0,2).toUpperCase()}</div><h2>{form.alias||'Votre alias'}</h2><p className="editor-preview__location"><MapPin size={15}/> {form.city||'Votre ville'}</p><div className="editor-preview__games">{form.games.length ? form.games.slice(0,4).map((slug)=><span key={slug}>{games.find((g)=>g.slug===slug)?.nameFr||slug}</span>) : <span>Vos jeux apparaîtront ici</span>}</div><div className="editor-trust"><BadgeCheck size={17}/><span>Nom réel, coordonnées, date de naissance, adresse, contacts d’urgence et paiement ne sont jamais affichés ici.</span></div></section>
        <section className="editor-privacy-note"><ShieldCheck size={20}/><div><strong>Données privées protégées</strong><p>Les informations privées servent uniquement aux besoins administratifs, de sécurité, d’admissibilité, de consentement et de paiement.</p></div></section>
      </aside>

      <div className="editor-submit-bar"><div className="editor-submit-status" role="status" aria-live="polite">{error && <span className="editor-error">{error}</span>}{saved && <span className="editor-success"><Check size={16}/> Profil enregistré.</span>}{!error&&!saved&&<span><HeartHandshake size={16}/> Votre alias protège votre identité publique.</span>}</div><button className="button button--primary editor-save" type="submit" disabled={saving}>{saving?<LoaderCircle className="editor-spinner" size={18}/>:<Save size={18}/>} {saving?'Enregistrement…':'Enregistrer mon profil'}</button></div>
    </form>
    <p className="editor-footer-note"><Users size={15}/> Jouer pour de bon · Playing for Good</p>
  </main>
}
