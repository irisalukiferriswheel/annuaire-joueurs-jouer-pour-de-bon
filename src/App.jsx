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

const money = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
})

function Availability({ status, label, compact = false }) {
  return (
    <span className={`availability availability--${status} ${compact ? 'availability--compact' : ''}`}>
      <span className="availability__dot" aria-hidden="true" />
      {label}
    </span>
  )
}

function Stars({ value, count }) {
  return (
    <span className="rating" aria-label={`${value} out of 5 stars`}>
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

function PlayerCard({ player, onOpen }) {
  const primaryCause = player.causes[0]

  return (
    <article className="player-card">
      <div className="player-card__top">
        <div className="avatar" aria-hidden="true">{player.initials}</div>
        <div className="player-card__identity">
          <div className="player-card__name-row">
            <h2>{player.name}</h2>
            <Availability status={player.availability} label={player.availabilityLabel} compact />
          </div>
          <p><MapPin size={15} /> {player.city}, {player.province}</p>
          <Stars value={player.rating} count={player.reviewCount} />
        </div>
      </div>

      <div className="chips" aria-label="Games played">
        {player.games.map((game) => <span className="chip" key={game}>{game}</span>)}
      </div>

      <div className="cause-line">
        <HeartHandshake size={17} />
        <span>Plays for <strong>{primaryCause.name}</strong>{player.causes.length > 1 ? ` +${player.causes.length - 1}` : ''}</span>
      </div>

      <div className="card-stats">
        <Stat icon={Gamepad2} value={player.gamesPlayed} label="games" />
        <Stat icon={Trophy} value={player.gamesWon} label="wins" />
        <Stat icon={CircleDollarSign} value={money.format(player.averagePaid)} label="avg/game" />
        <Stat icon={HeartHandshake} value={money.format(player.totalToCauses)} label="to causes" />
      </div>

      <div className="impact-line">
        <Target size={16} />
        <strong>{player.goalsReached}</strong> crowdfunding {player.goalsReached === 1 ? 'goal' : 'goals'} reached
      </div>

      <button className="button button--primary button--card" onClick={() => onOpen(player.id)}>
        View profile <ChevronRight size={17} />
      </button>
    </article>
  )
}

function EmptyState({ reset }) {
  return (
    <div className="empty-state">
      <Search size={34} />
      <h2>No players match those filters yet.</h2>
      <p>Try another city, game or cause, or show players who are not currently available.</p>
      <button className="button button--secondary" onClick={reset}><RotateCcw size={17} /> Reset filters</button>
    </div>
  )
}

function Directory({ onOpen }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [game, setGame] = useState('')
  const [cause, setCause] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return players.filter((player) => {
      const matchesSearch = !term || [player.name, player.city, ...player.games, ...player.causes.map((item) => item.name)]
        .some((value) => value.toLowerCase().includes(term))
      const matchesCity = !city || player.city === city
      const matchesGame = !game || player.games.includes(game)
      const matchesCause = !cause || player.causes.some((item) => item.name === cause)
      const matchesAvailability = !availableOnly || player.availability === 'now' || player.availability === 'week'
      return matchesSearch && matchesCity && matchesGame && matchesCause && matchesAvailability
    })
  }, [query, city, game, cause, availableOnly])

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
        <div className="eyebrow"><Users size={16} /> Playing for Good community</div>
        <h1>Find people to play with.</h1>
        <p>Search players by city, game or cause. See who is available, what they play, their community reputation and the impact they have helped create.</p>
      </section>

      <section className="search-panel" aria-label="Player filters">
        <label className="search-box">
          <Search size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player, game, city or cause…"
            aria-label="Search players"
          />
        </label>

        <div className="filters">
          <label>
            <span>City</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All cities</option>
              {filterOptions.cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Game</span>
            <select value={game} onChange={(event) => setGame(event.target.value)}>
              <option value="">All games</option>
              {filterOptions.games.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Cause</span>
            <select value={cause} onChange={(event) => setCause(event.target.value)}>
              <option value="">All causes</option>
              {filterOptions.causes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="available-toggle">
            <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />
            <span className="available-toggle__fake" aria-hidden="true" />
            <span><strong>Available</strong><small>Ready to play</small></span>
          </label>
        </div>
      </section>

      <div className="results-heading">
        <div>
          <strong>{filtered.length}</strong> {filtered.length === 1 ? 'player' : 'players'} found
        </div>
        {(query || city || game || cause || availableOnly) && (
          <button className="text-button" onClick={reset}><RotateCcw size={15} /> Reset</button>
        )}
      </div>

      {filtered.length > 0 ? (
        <section className="player-grid" aria-live="polite">
          {filtered.map((player) => <PlayerCard player={player} key={player.id} onOpen={onOpen} />)}
        </section>
      ) : <EmptyState reset={reset} />}

      <p className="demo-note">Prototype data for interface testing. Player statistics and verified reviews will come from the Playing for Good API.</p>
    </main>
  )
}

function Profile({ player, onBack }) {
  const winRate = player.gamesPlayed ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0

  return (
    <main className="app-shell profile-shell">
      <button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Back to players</button>

      <section className="profile-hero">
        <div className="avatar avatar--large">{player.initials}</div>
        <div className="profile-hero__main">
          <div className="profile-title-row">
            <h1>{player.name}</h1>
            <BadgeCheck size={22} className="verified-icon" aria-label="Verified player" />
          </div>
          <p className="location"><MapPin size={16} /> {player.city}, {player.province}</p>
          <Availability status={player.availability} label={player.availabilityLabel} />
          <div className="profile-rating"><Stars value={player.rating} count={player.reviewCount} /><span>community rating</span></div>
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
            <h2>About {player.name}</h2>
            <p className="body-copy">{player.bio}</p>
            <div className="chips chips--large">
              {player.games.map((game) => <span className="chip" key={game}>{game}</span>)}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <div>
                <span className="section-kicker">Cause impact</span>
                <h2>Where their games made a difference</h2>
              </div>
              <HeartHandshake size={24} />
            </div>
            <div className="cause-list">
              {player.causes.map((cause) => (
                <article className="cause-card" key={cause.name}>
                  <div className="cause-card__heading">
                    <div>
                      <h3>{cause.name}</h3>
                      <p>{money.format(cause.contributed)} attributed to this player's games</p>
                    </div>
                    {cause.goalReached && <span className="goal-badge"><Target size={15} /> Goal reached</span>}
                  </div>
                  <div className="progress" aria-label={`${cause.progress}% of crowdfunding goal`}>
                    <span style={{ width: `${cause.progress}%` }} />
                  </div>
                  <small>{cause.progress}% of crowdfunding target</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <div>
                <span className="section-kicker">Community feedback</span>
                <h2>Reviews from verified co-players</h2>
              </div>
              <ShieldCheck size={24} />
            </div>

            <div className="reputation-tags">
              {player.tags.map((tag) => <span key={tag}><BadgeCheck size={15} /> {tag}</span>)}
            </div>

            <div className="reviews">
              {player.reviews.length ? player.reviews.map((review, index) => (
                <article className="review" key={`${review.author}-${index}`}>
                  <div className="review__top">
                    <strong>{review.author}</strong>
                    <Stars value={review.rating} />
                  </div>
                  <p>{review.text}</p>
                  <small>Played together · {review.game}</small>
                </article>
              )) : <p className="muted">No written reviews yet.</p>}
            </div>

            <div className="review-actions">
              <button className="button button--primary" title="Enabled when authentication and the review API are connected">
                <Star size={17} /> Leave a verified review
              </button>
              <button className="button button--danger" title="Safety reports will be private and sent to moderators">
                <Flag size={17} /> Report a safety concern
              </button>
            </div>
            <p className="safety-note"><ShieldCheck size={16} /> Reviews are intended for players who participated in the same completed game. Serious safety reports are private, not public accusations.</p>
          </section>
        </div>

        <aside className="profile-aside">
          <section className="panel panel--sticky">
            <span className="section-kicker">Player record</span>
            <div className="big-stat"><strong>{player.gamesPlayed}</strong><span>Games played</span></div>
            <div className="aside-grid">
              <Stat icon={Trophy} value={player.gamesWon} label="wins" />
              <Stat icon={Target} value={`${winRate}%`} label="win rate" />
              <Stat icon={CircleDollarSign} value={money.format(player.averagePaid)} label="avg/game" />
              <Stat icon={HeartHandshake} value={money.format(player.totalToCauses)} label="to causes" />
            </div>
            <div className="goal-summary">
              <Target size={19} />
              <div><strong>{player.goalsReached}</strong><span>crowdfunding goals reached</span></div>
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

export default function App() {
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
    ? <Profile player={selectedPlayer} onBack={backToDirectory} />
    : <Directory onOpen={openPlayer} />
}
