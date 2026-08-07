import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { filterOptions, players } from './data/players.js'
import { buildFilterOptions, loadPlayers } from './services/playersApi.js'
import './styles.css'

function updateDataSourceBanner(source, reason) {
  const banner = document.getElementById('data-source-banner')
  if (!banner) return

  if (source === 'api') {
    banner.hidden = true
    banner.textContent = ''
    return
  }

  banner.textContent = reason === 'api-unavailable'
    ? 'Mode prototype — l’API publique est temporairement indisponible; des données de démonstration sont affichées. / Prototype mode — public API unavailable; demo data is shown.'
    : 'Mode prototype — données de démonstration, pas de vrais dossiers de joueurs. / Prototype mode — demo data, not real player records.'
  banner.hidden = false
}

async function bootstrap() {
  const result = await loadPlayers({ locale: navigator.language || 'en-CA' })

  if (result.players !== players) {
    players.splice(0, players.length, ...result.players)
  }

  Object.assign(filterOptions, buildFilterOptions(players))
  window.__JPDB_DATA_SOURCE__ = result.source
  window.__JPDB_DATA_REASON__ = result.reason
  updateDataSourceBanner(result.source, result.reason)

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap().catch((error) => {
  console.error('Player directory bootstrap failed:', error)
  window.__JPDB_DATA_SOURCE__ = 'demo'
  window.__JPDB_DATA_REASON__ = 'bootstrap-error'
  updateDataSourceBanner('demo', 'bootstrap-error')

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
