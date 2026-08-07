# Annuaire des joueurs — Jouer pour de bon

Searchable player directory for Jouer pour de bon / Playing for Good.

## Live site

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/
```

This standalone React + Vite frontend is deployed with GitHub Pages and designed to be embedded inside the main Wix site.

## Features

- Search players by name, city, game, or cause
- Filter by city, game, cause, and availability
- Player availability indicator
- Player statistics and cause-impact summaries
- Individual player profiles and social links
- Verified co-player review presentation
- Separate private safety-report concept
- Responsive layout designed for Wix iframe embedding
- Safe public-API adapter with demo-data fallback

## Data source

The frontend never expects a private credential. If `VITE_API_BASE_URL` is configured at build time, it calls:

```text
GET <VITE_API_BASE_URL>/v1/public/players
```

If no API URL is configured, or if the public API is temporarily unavailable, the app falls back to the checked-in demo players so the directory remains usable for design and embed testing.

Never expose `WIX_INTEGRATION_KEY`, a Supabase service-role key, or any server secret in this repository's built frontend.

## Wix integration

See [`docs/WIX_EMBED.md`](docs/WIX_EMBED.md) for the recommended page name, iframe setup, sizing, security rules, and a future auto-height bridge.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

GitHub Actions validates production builds and deploys `main` to GitHub Pages.
