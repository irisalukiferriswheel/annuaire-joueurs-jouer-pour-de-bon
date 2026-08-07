# Annuaire des joueurs — Jouer pour de bon

Standalone searchable player-directory module for Jouer pour de bon / Playing for Good.

## Live module

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/
```

French-first embed URL:

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/?lang=fr
```

English-first URL:

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/?lang=en
```

The module is deployed with GitHub Pages and designed to sit inside the main Wix site without duplicating Wix navigation/header/footer.

## Current features

- FR / EN interface with remembered language choice
- Search players by name, city, game, or cause
- Filter by city, game, cause, and availability
- Individual player profile views
- Demo statistics, cause-impact summaries, reviews, reputation tags, and public social links
- Responsive layout for Wix iframe embedding
- HTTPS-only public social-link normalization in the browser
- Public API adapter with explicit demo fallback
- Visible prototype banner whenever the app is not using production API data
- Rich-profile cutover guard so missing API fields cannot masquerade as real zero statistics

## Public data source

The browser must never contain a Wix integration key, Supabase service-role key, or other server credential.

When `VITE_API_BASE_URL` is configured at build time, the module calls the shared API's public directory route:

```text
GET <VITE_API_BASE_URL>/v1/public/players
```

The backend also exposes an individual public profile route for the next profile-loading step:

```text
GET <VITE_API_BASE_URL>/v1/public/players/:playerId
```

The current backend public list intentionally starts with a small public field set. The current frontend already renders richer availability, cause-impact, statistics, reputation, biography, reviews, and public contact information.

For that reason, the frontend does **not** automatically switch to API mode merely because the endpoint responds. Every returned player must first satisfy the explicit rich-public-profile contract. Otherwise the module remains visibly in demo mode instead of inventing missing values.

## Prototype indexing policy

While demo profiles/statistics are the normal public content, the page uses:

```text
noindex, nofollow
```

This prevents search engines from presenting fictional prototype player records as real profiles.

Removing that directive is an explicit production-launch task after:

1. the public API satisfies the rich-profile contract,
2. real player data is active,
3. the canonical Wix/public URL strategy is confirmed.

## Wix integration

See [docs/WIX_EMBED.md](docs/WIX_EMBED.md) for:

- the recommended `Trouver des joueurs` Wix page
- the French-first iframe URL
- initial desktop/mobile sizing
- credential/security rules
- the future secure `postMessage` auto-height bridge

The connected Wix management API currently does not expose a safe normal Editor-page iframe-placement operation, so the actual iframe element remains a Wix Editor step.

## Local development

Install the exact committed dependency graph:

```bash
npm ci
```

Start Vite:

```bash
npm run dev
```

Run focused safety/contract tests:

```bash
npm test
```

Build the production bundle:

```bash
npm run build
```

## CI and dependency maintenance

GitHub Actions:

- installs with `npm ci`
- runs frontend tests
- builds the production Vite bundle
- deploys `main` to GitHub Pages

The dependency graph is committed in `package-lock.json`, so the same source revision resolves the same packages in local CI and Pages builds.

Dependabot monitors npm dependencies and GitHub Actions through reviewable pull requests.

## Production API cutover

The Pages workflow already reads the repository variable:

```text
VITE_API_BASE_URL
```

Do not set it as a launch signal until the production API:

- is deployed behind valid HTTPS,
- allows `https://irisalukiferriswheel.github.io` through CORS,
- returns only intentionally public profile data,
- supplies the rich fields required by the current UI.

When production cutover is complete, verify:

```text
window.__JPDB_DATA_SOURCE__ === "api"
```

and remove the prototype search-engine no-index directive as a separate reviewed launch change.

## Current external blockers

Repository-side frontend work is ready for integration. Remaining environment-specific steps require:

- production API/VPS hostname and deployment
- access to the real Supabase project/schema
- Wix Editor placement of the iframe
- later Wix iframe element ID/page-code support for auto-height
