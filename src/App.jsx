import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Flag,
  Gamepad2,
  HeartHandshake,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { filterOptions, players } from './data/players.js'
import {
  availabilityLabel,
  copy,
  setLanguage,
  translateGame,
  translateTag,
} from './i18n.js'

function moneyFormatter(language) {
  return new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })
}

function LanguageSwitcher({ language }) {
  return (
    <div
      aria-label={language === 'fr' ? 'Choix de langue' : 'Language selection'}
      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
    >
      <button
        type="button"
        className={`button ${language === 'fr' ? 'button--primary' : 'button--secondary'}`}
        style={{ minHeight: 34, padding: '6px 10px', fontSize: '.75rem' }}
        onClick={() => language !== 'fr' && setLanguage('fr')}
        aria-pressed={language === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        className={`button ${language === 'en' ? 'button--primary' : 'button--secondary'}`}
        style={{ minHeight: 34, padding: '6px 10px', fontSize: '.75rem' }}
        onClick={() => language !== 'en' && setLanguage('en')}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  )
}

function Availability({ status, language, compact = false }) {
  return (
    <span className={`availability availability--${status} ${compact ? 'availability--compact' : ''}`}>
      <span className="availability__dot" aria-hidden="true" />
      {availabilityLabel(status, language)}
    </span>
  )
}

function Stars({ value, count, language }) {
  const c = copy[language]
  return (
    <span className="rating" aria-label={c.starAria(value)}>
      <Star size={16} fill="currentColor" />
      <strong>{value.toFixed(1)}</strong>
      {typeof count === 'number' && <span>({count})</span>}
    </span>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="stat">
      <Icon size={18} aria-hidden="true" />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function PlayerCard({ player, onOpen, language }) {
  const c = copy[language]
  const money = moneyFormatter(language)
  const primaryCause = player.causes[0]

  return (
    <article className="player-card">
      <div className="player-card__top">
        <div className="avatar" aria-hidden="true">{player.initials}</div>
        <div className="player-card__identity">
          <div className="player-card__name-row">
            <h2>{player.name}</h2>
            <Availability status={player.availability} language={language} compact />
          </div>
          <p><MapPin size={15} /> {player.city}, {player.province}</p>
          <Stars value={player.rating} count={player.reviewCount} language={language} />
        </div>
      </div>

      <div className="chips" aria-label={c.games}>
        {player.games.map((game) => (
          <span className="chip" key={game}>{translateGame(game, language)}</span>
        ))}
      </div>

      <div className="cause-line">
        <HeartHandshake size={17} />
        <span>{c.playsFor} <strong>{primaryCause.name}</strong>{player.causes.length > 1 ? ` +${player.causes.length - 1}` : ''}</span>
      </div>

      <div className="card-stats">
        <Stat icon={Gamepad2} value={player.gamesPlayed} label={c.games} />
        <Stat icon={Trophy} value={player.gamesWon} label={c.wins} />
        <Stat icon={CircleDollarSign} value={money.format(player.averagePaid)} label={c.avgGame} />
        <Stat icon={HeartHandshake} value={money.format(player.totalToCauses)} label={c.toCauses} />
      </div>

      <div className="impact-line">
        <Target size={16} />
        <strong>{player.goalsReached}</strong>{' '}
        {player.goalsReached === 1 ? c.crowdfundingGoal : c.crowdfundingGoals}
      </div>

      <button className="button button--primary button--card" onClick={() => onOpen(player.id)}>
        {c.viewProfile} <ChevronRight size={17} />
      </button>
    </article>
  )
}

function EmptyState({ reset, language }) {
  const c = copy[language]
  return (
    <div className="empty-state">
      <Search size={34} />
      <h2>{c.noMatches}</h2>
      <p>{c.noMatchesHelp}</p>
      <button className="button button--secondary" onClick={reset}>
        <RotateCcw size={17} /> {c.resetFilters}
      </button>
    </div>
  )
}

function Directory({ onOpen, language }) {
  const c = copy[language]
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [game, setGame] = useState('')
  const [cause, setCause] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return players.filter((player) => {
      const localizedGames = player.games.map((item) => translateGame(item, language))
      const matchesSearch = !term || [
        player.name,
        player.city,
        ...player.games,
        ...localizedGames,
        ...player.causes.map((item) => item.name),
      ].some((value) => value.toLowerCase().includes(term))
      const matchesCity = !city || player.city === city
      const matchesGame = !game || player.games.includes(game)
      const matchesCause = !cause || player.causes.some((item) => item.name === cause)
      const matchesAvailability = !availableOnly || player.availability === 'now' || player.availability === 'week'
      return matchesSearch && matchesCity && matchesGame && matchesCause && matchesAvailability
    })
  }, [query, city, game, cause, availableOnly, language])

  const reset = () => {
    setQuery('')
    setCity('')
    setGame('')
    setCause('')
    setAvailableOnly(false)
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div className="eyebrow"><Users size={16} /> {c.community}</div>
          <LanguageSwitcher language={language} />
        </div>
        <h1>{c.heroTitle}</h1>
        <p>{c.heroText}</p>
      </section>

      <section className="search-panel" aria-label={c.filtersLabel}>
        <label className="search-box">
          <Search size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={c.searchPlaceholder}
            aria-label={c.searchPlayers}
          />
        </label>

        <div className="filters">
          <label>
            <span>{c.city}</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">{c.allCities}</option>
              {filterOptions.cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>{c.game}</span>
            <select value={game} onChange={(event) => setGame(event.target.value)}>
              <option value="">{c.allGames}</option>
              {filterOptions.games.map((item) => (
                <option key={item} value={item}>{translateGame(item, language)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{c.cause}</span>
            <select value={cause} onChange={(event) => setCause(event.target.value)}>
              <option value="">{c.allCauses}</option>
              {filterOptions.causes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="available-toggle">
            <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />
            <span className="available-toggle__fake" aria-hidden="true" />
            <span><strong>{c.available}</strong><small>{c.readyToPlay}</small></span>
          </label>
        </div>
      </section>

      <div className="results-heading">
        <div>
          <strong>{filtered.length}</strong>{' '}
          {filtered.length === 1 ? c.playerFound : c.playersFound}
        </div>
        {(query || city || game || cause || availableOnly) && (
          <button className="text-button" onClick={reset}><RotateCcw size={15} /> {c.reset}</button>
        )}
      </div>

      {filtered.length > 0 ? (
        <section className="player-grid" aria-live="polite">
          {filtered.map((player) => (
            <PlayerCard player={player} key={player.id} onOpen={onOpen} language={language} />
          ))}
        </section>
      ) : <EmptyState reset={reset} language={language} />}

      <p className="demo-note">{c.prototypeNote}</p>
    </main>
  )
}

function Profile({ player, onBack, language }) {
  const c = copy[language]
  const money = moneyFormatter(language)
  const winRate = player.gamesPlayed ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0
  const bio = language === 'fr' && player.bioFr ? player.bioFr : player.bio

  return (
    <main className="app-shell profile-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <button className="back-button" onClick={onBack}><ArrowLeft size={18} /> {c.backToPlayers}</button>
        <LanguageSwitcher language={language} />
      </div>

      <section className="profile-hero">
        <div className="avatar avatar--large">{player.initials}</div>
        <div className="profile-hero__main">
          <div className="profile-title-row">
            <h1>{player.name}</h1>
            <BadgeCheck size={22} className="verified-icon" aria-label={c.verifiedPlayer} />
          </div>
          <p className="location"><MapPin size={16} /> {player.city}, {player.province}</p>
          <Availability status={player.availability} language={language} />
          <div className="profile-rating">
            <Stars value={player.rating} count={player.reviewCount} language={language} />
            <span>{c.communityRating}</span>
          </div>
        </div>
        <div className="profile-socials">
          {player.socials.map((social) => (
            <a className="button button--secondary" href={social.url} target="_blank" rel="noreferrer" key={social.label}>
              <MessageCircle size={17} /> {social.label} <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>

      <section className="profile-layout">
        <div className="profile-main">
          <section className="panel">
            <h2>{c.about} {player.name}</h2>
            <p className="body-copy">{bio}</p>
            <div className="chips chips--large">
              {player.games.map((game) => (
                <span className="chip" key={game}>{translateGame(game, language)}</span>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <div>
                <span className="section-kicker">{c.causeImpact}</span>
                <h2>{c.causeImpactTitle}</h2>
              </div>
              <HeartHandshake size={24} />
            </div>
            <div className="cause-list">
              {player.causes.map((cause) => (
                <article className="cause-card" key={cause.name}>
                  <div className="cause-card__heading">
                    <div>
                      <h3>{cause.name}</h3>
                      <p>{money.format(cause.contributed)} {c.attributedContribution}</p>
                    </div>
                    {cause.goalReached && <span className="goal-badge"><Target size={15} /> {c.goalReached}</span>}
                  </div>
                  <div className="progress" aria-label={`${cause.progress}% ${c.crowdfundingTarget}`}>
                    <span style={{ width: `${cause.progress}%` }} />
                  </div>
                  <small>{cause.progress}% {c.crowdfundingTarget}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <div>
                <span className="section-kicker">{c.communityFeedback}</span>
                <h2>{c.reviewsTitle}</h2>
              </div>
              <ShieldCheck size={24} />
            </div>

            <div className="reputation-tags">
              {player.tags.map((tag) => (
                <span key={tag}><BadgeCheck size={15} /> {translateTag(tag, language)}</span>
              ))}
            </div>

            <div className="reviews">
              {player.reviews.length ? player.reviews.map((review, index) => {
                const reviewText = language === 'fr' && review.textFr ? review.textFr : review.text
                return (
                  <article className="review" key={`${review.author}-${index}`}>
                    <div className="review__top">
                      <strong>{review.author}</strong>
                      <Stars value={review.rating} language={language} />
                    </div>
                    <p>{reviewText}</p>
                    <small>{c.playedTogether} · {translateGame(review.game, language)}</small>
                  </article>
                )
              }) : <p className="muted">{c.noReviews}</p>}
            </div>

            <div className="review-actions">
              <button className="button button--primary" title={c.reviewButtonTitle}>
                <Star size={17} /> {c.leaveReview}
              </button>
              <button className="button button--danger" title={c.reportButtonTitle}>
                <Flag size={17} /> {c.reportConcern}
              </button>
            </div>
            <p className="safety-note"><ShieldCheck size={16} /> {c.safetyNote}</p>
          </section>
        </div>

        <aside className="profile-aside">
          <section className="panel panel--sticky">
            <span className="section-kicker">{c.playerRecord}</span>
            <div className="big-stat"><strong>{player.gamesPlayed}</strong><span>{c.gamesPlayed}</span></div>
            <div className="aside-grid">
              <Stat icon={Trophy} value={player.gamesWon} label={c.wins} />
              <Stat icon={Target} value={`${winRate}%`} label={c.winRate} />
              <Stat icon={CircleDollarSign} value={money.format(player.averagePaid)} label={c.avgGame} />
              <Stat icon={HeartHandshake} value={money.format(player.totalToCauses)} label={c.toCauses} />
            </div>
            <div className="goal-summary">
              <Target size={19} />
              <div><strong>{player.goalsReached}</strong><span>{c.goalsReached}</span></div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

function currentPlayerId() {
  const match = window.location.hash.match(/^#\/player\/([^/]+)$/)
  return match?.[1] || null
}

export default function App({ language = 'en' }) {
  const [playerId, setPlayerId] = useState(currentPlayerId)

  useEffect(() => {
    const handleHashChange = () => setPlayerId(currentPlayerId())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const selectedPlayer = players.find((player) => player.id === playerId)

  const openPlayer = (id) => {
    window.location.hash = `/player/${id}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToDirectory = () => {
    window.location.hash = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return selectedPlayer
    ? <Profile player={selectedPlayer} onBack={backToDirectory} language={language} />
    : <Directory onOpen={openPlayer} language={language} />
}
