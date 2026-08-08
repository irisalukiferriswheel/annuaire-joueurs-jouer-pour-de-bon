import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import EditProfile from './EditProfile.jsx'
import { filterOptions, players } from './data/players.js'
import { buildFilterOptions, loadPlayers } from './services/playersApi.js'
import { getInitialLanguage, localeForLanguage } from './i18n.js'
import './styles.css'
import './profileEditor.css'

function updateDataSourceBanner(source, reason, language) {
  const banner = document.getElementById('data-source-banner')
  if (!banner) return

  if (source === 'api') {
    banner.hidden = true
    banner.textContent = ''
    return
  }

  const messages = language === 'fr'
    ? {
        unavailable: 'Mode prototype — l’API publique est temporairement indisponible; des données de démonstration sont affichées.',
        incomplete: 'Mode prototype — l’API publique répond, mais les profils ne contiennent pas encore toutes les données requises; les données de démonstration restent affichées.',
        demo: 'Mode prototype — données de démonstration, pas de vrais dossiers de joueurs.',
      }
    : {
        unavailable: 'Prototype mode — the public API is temporarily unavailable; demo data is shown.',
        incomplete: 'Prototype mode — the public API is responding, but player profiles do not yet contain all required public fields; demo data remains visible.',
        demo: 'Prototype mode — demo data, not real player records.',
      }

  banner.textContent = reason === 'api-unavailable'
    ? messages.unavailable
    : reason === 'api-profile-contract-incomplete'
      ? messages.incomplete
      : messages.demo
  banner.hidden = false
}

function isEditProfileRoute() {
  return window.location.hash === '#/edit-profile'
}

function renderRoot(element) {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>{element}</React.StrictMode>,
  )
}

async function bootstrap() {
  const language = getInitialLanguage()
  document.documentElement.lang = language

  if (isEditProfileRoute()) {
    const banner = document.getElementById('data-source-banner')
    if (banner) banner.hidden = true
    renderRoot(<EditProfile />)
    return
  }

  const result = await loadPlayers({ locale: localeForLanguage(language) })

  if (result.players !== players) {
    players.splice(0, players.length, ...result.players)
  }

  Object.assign(filterOptions, buildFilterOptions(players))
  window.__JPDB_DATA_SOURCE__ = result.source
  window.__JPDB_DATA_REASON__ = result.reason
  window.__JPDB_LANGUAGE__ = language
  updateDataSourceBanner(result.source, result.reason, language)

  renderRoot(<App language={language} />)
}

bootstrap().catch((error) => {
  console.error('Player directory bootstrap failed:', error)
  const language = getInitialLanguage()
  document.documentElement.lang = language

  if (isEditProfileRoute()) {
    renderRoot(<EditProfile />)
    return
  }

  window.__JPDB_DATA_SOURCE__ = 'demo'
  window.__JPDB_DATA_REASON__ = 'bootstrap-error'
  window.__JPDB_LANGUAGE__ = language
  updateDataSourceBanner('demo', 'bootstrap-error', language)

  renderRoot(<App language={language} />)
})
