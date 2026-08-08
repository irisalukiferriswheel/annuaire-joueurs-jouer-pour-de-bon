# Embedded Player Profile Editor

This branch prototypes the player create/edit experience as a React surface inside the existing player-directory app.

## Safe preview

The live GitHub Pages deployment is intentionally left untouched. GitHub Pages for this repository uses a single `github-pages` deployment environment, so deploying this branch there would risk replacing the current directory.

Open the experimental branch in StackBlitz instead:

https://stackblitz.com/github/irisalukiferriswheel/annuaire-joueurs-jouer-pour-de-bon/tree/agent/embedded-profile-editor

Once the project starts, open the app preview and navigate to:

```text
#/edit-profile
```

The editor has a standalone preview mode when it is not embedded in Wix. Saving in standalone preview mode never writes to the production API.

## Production route

```text
#/edit-profile
```

The current directory and public profile routes keep using the existing `App.jsx` code path.

## Message contract

The embedded editor communicates only with its Wix parent page.

### iframe -> Wix

```js
{ type: 'JPDB_PROFILE_EDITOR_READY', version: 1 }
```

```js
{
  type: 'JPDB_PROFILE_SAVE_REQUEST',
  version: 1,
  requestId: '...',
  payload: {
    alias: '...',
    city: '...',
    games: ['chess'],
    newGame: '',
    wantsToOrganize: false,
    isPublic: true
  }
}
```

No Wix member ID or API credential is sent by the iframe.

### Wix -> iframe

```js
{
  type: 'JPDB_PROFILE_FORM_DATA',
  version: 1,
  payload: {
    member: { firstName, lastName, nickname },
    profile: null,
    games: [{ slug, nameFr, nameEn, category }]
  }
}
```

After save:

```js
{
  type: 'JPDB_PROFILE_SAVE_RESULT',
  version: 1,
  requestId: '...',
  ok: true
}
```

or:

```js
{
  type: 'JPDB_PROFILE_SAVE_RESULT',
  version: 1,
  requestId: '...',
  ok: false,
  error: 'Safe message for the player'
}
```

## Wix responsibility

The Wix page receives messages from the iframe and calls the Wix backend web methods. The backend derives the current member identity from Wix Members and keeps `JPDB_WIX_INTEGRATION_KEY` in Secrets Manager.

Never trust a member ID supplied by an iframe, query string, input, or browser storage.

## Rollback

Do not merge this branch if the embedded editor is rejected. `main` remains the current version until an explicit merge is approved.
