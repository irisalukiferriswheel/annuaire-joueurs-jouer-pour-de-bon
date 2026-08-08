# Wix embedded player profile editor

The player profile editor lives in the existing GitHub Pages application at the isolated hash route:

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/#/edit-profile
```

The public directory and public player-profile routes remain unchanged.

## Recommended Wix architecture

```text
Wix member login
  -> members-only Wix page
  -> one Wix HTML Component
  -> GitHub Pages #/edit-profile
  -> message bridge
  -> Wix page code
  -> members-only backend web method
  -> Jouer pour de bon API
  -> Supabase
```

This keeps Wix authentication and all server credentials outside the GitHub Pages iframe.

## Security boundaries

- The iframe never receives a Wix member ID.
- The iframe never receives `JPDB_WIX_INTEGRATION_KEY` or any API secret.
- The iframe sends messages only to the exact production Wix origin:

```text
https://www.jouerpourdebon.ca
```

- Incoming browser messages are accepted only when both `event.origin` matches that Wix origin and `event.source === window.parent`.
- Save payloads are length-bounded and shape-normalized in the iframe before they are sent to Wix.
- The Wix web method sanitizes them again and derives the authenticated Wix member ID itself.
- New profiles default to `isPublic: false`; public-directory publication is explicit opt-in.
- JPDB directory visibility does not call Wix Members `makeProfilePublic()` and is independent from Wix community-profile privacy.

## Message protocol

### Editor -> Wix

When the iframe loads:

```js
{ type: 'JPDB_PROFILE_EDITOR_READY' }
```

If initial data has not arrived after a short delay, the editor can retry:

```js
{ type: 'JPDB_PROFILE_EDITOR_REQUEST_DATA' }
```

On save:

```js
{
  type: 'JPDB_PROFILE_EDITOR_SAVE',
  payload: {
    alias: 'Public alias',
    city: 'Sherbrooke',
    games: ['basketball', 'chess'],
    newGame: '',
    wantsToOrganize: false,
    isPublic: false
  }
}
```

### Wix -> Editor

Initial data:

```js
{
  type: 'JPDB_PROFILE_EDITOR_DATA',
  payload: {
    member: {
      firstName: 'Example',
      nickname: 'Example'
    },
    profile: null,
    games: [
      {
        slug: 'basketball',
        nameFr: 'Basketball',
        nameEn: 'Basketball',
        category: 'sport'
      }
    ]
  }
}
```

The embed bridge should deliberately omit member last name, login email, Wix member ID, and any API credential.

Successful save:

```js
{ type: 'JPDB_PROFILE_EDITOR_SAVED' }
```

Failure:

```js
{
  type: 'JPDB_PROFILE_EDITOR_ERROR',
  message: 'Impossible d’enregistrer le profil.'
}
```

## Wix page

Recommended members-only page:

```text
Mon profil joueur
/profil-joueur
```

Only one Editor element is needed:

```text
HTML Component: #playerProfileEmbed
```

Set its source to the GitHub Pages editor route and give it enough height for the responsive form. The copy-ready Wix page bridge belongs in the website integration repo under `wix-code/pages/`.

## Backend

Use the already-merged members-only backend module in the website integration repo:

```text
wix-code/backend/playerProfile.web.js
```

It derives the current Wix member from the session, loads/saves through the protected shared API routes, and never exposes the integration key to page or iframe code.

## Standalone preview

Opening `#/edit-profile` directly outside Wix intentionally uses local sample data for design review. Saving in standalone preview only simulates success in memory; it never writes to the production API.

## Rollback

The editor is an additive hash route. Removing the Wix embed or reverting the editor commit leaves the public player directory unaffected.
