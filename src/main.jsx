import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { filterOptions, players } from './data/players.js'
import { buildFilterOptions, loadPlayers } from './services/playersApi.js'
import { getInitialLanguage, localeForLanguage } from './i18n.js'
import './styles.css'

function updateDataSourceBanner(source, reason, language) {
  const banner = document.getElementById('data-source-banner')
  if (!banner) return

  const messages = language === 'fr'
    ? {
        liveBasic: 'Profils en direct — les joueurs proviennent de l’API Jouer pour de bon. Les statistiques, causes, disponibilités et avis apparaîtront lorsqu’ils seront disponibles.',
        unavailable: 'Mode prototype — l’API publique est temporairement indisponible; des données de démonstration sont affichées.',
        demo: 'Mode prototype — données de démonstration, pas de vrais dossiers de joueurs.',
      }
    : {
        liveBasic: 'Live profiles — players are coming from the Playing for Good API. Statistics, causes, availability and reviews will appear as those fields become available.',
        unavailable: 'Prototype mode — the public API is temporarily unavailable; demo data is shown.',
        demo: 'Prototype mode — demo data, not real player records.',
      }

  if (source === 'api' && reason === 'api-basic-profile-contract') {
    banner.textContent = messages.liveBasic
    banner.hidden = false
    return
  }

  if (source === 'api') {
    banner.hidden = true
    banner.textContent = ''
    return
  }

  banner.textContent = reason === 'api-unavailable' ? messages.unavailable : messages.demo
  banner.hidden = false
}

function renderApp({ language, source, reason }) {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App language={language} dataSource={source} dataReason={reason} />
    </React.StrictMode>,
  )
}

async function bootstrap() {
  const language = getInitialLanguage()
  document.documentElement.lang = language

  const result = await loadPlayers({ locale: localeForLanguage(language) })

  if (result.players !== players) {
    players.splice(0, players.length, ...result.players)
  }

  Object.assign(filterOptions, buildFilterOptions(players))
  window.__JPDB_DATA_SOURCE__ = result.source
  window.__JPDB_DATA_REASON__ = result.reason
  window.__JPDB_LANGUAGE__ = language
  updateDataSourceBanner(result.source, result.reason, language)
  renderApp({ language, source: result.source, reason: result.reason })
}

bootstrap().catch((error) => {
  console.error('Player directory bootstrap failed:', error)
  const language = getInitialLanguage()
  document.documentElement.lang = language
  window.__JPDB_DATA_SOURCE__ = 'demo'
  window.__JPDB_DATA_REASON__ = 'bootstrap-error'
  window.__JPDB_LANGUAGE__ = language
  updateDataSourceBanner('demo', 'bootstrap-error', language)
  renderApp({ language, source: 'demo', reason: 'bootstrap-error' })
})
