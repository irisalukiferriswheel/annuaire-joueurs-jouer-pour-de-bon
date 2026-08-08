# Wix embedded player profile editor

The experimental player profile editor lives in the existing GitHub Pages React app at:

```text
#/edit-profile
```

The current directory and public player profile routes are unchanged.

## Security boundary

Wix remains responsible for authentication. The embedded GitHub Pages app never receives or chooses a Wix member ID and never receives the API integration key.

```text
Wix member session
  -> Wix members-only page
  -> Wix page code + backend web module
  -> iframe message bridge
  -> React profile editor
```

On save:

```text
React form values
  -> Wix page message handler
  -> Wix backend derives currentMember._id
  -> Jouer pour de bon API
  -> Supabase
```

## Message protocol

### Editor -> Wix

When loaded:

```js
{ type: 'JPDB_PROFILE_EDITOR_READY' }
{ type: 'JPDB_PROFILE_EDITOR_REQUEST_DATA' }
```

When the player saves:

```js
{
  type: 'JPDB_PROFILE_EDITOR_SAVE',
  payload: {
    alias: 'Simon',
    city: 'Sherbrooke',
    games: ['basketball', 'chess'],
    newGame: '',
    wantsToOrganize: false,
    isPublic: true
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
      firstName: 'Simon',
      lastName: '',
      nickname: 'Simon'
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

## Wix page code

The Wix page should contain one HTML iframe element, for example with ID:

```text
#playerProfileEmbed
```

Point it to the GitHub Pages app with the hash route:

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/#/edit-profile
```

The page itself must be restricted to site members.

Example page code:

```js
import {
  getMyPlayerProfileForm,
  saveMyPlayerProfile
} from 'backend/playerProfile.web';

const TYPES = {
  ready: 'JPDB_PROFILE_EDITOR_READY',
  request: 'JPDB_PROFILE_EDITOR_REQUEST_DATA',
  data: 'JPDB_PROFILE_EDITOR_DATA',
  save: 'JPDB_PROFILE_EDITOR_SAVE',
  saved: 'JPDB_PROFILE_EDITOR_SAVED',
  error: 'JPDB_PROFILE_EDITOR_ERROR'
};

$w.onReady(function () {
  $w('#playerProfileEmbed').onMessage(async (event) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === TYPES.ready || message.type === TYPES.request) {
      try {
        const payload = await getMyPlayerProfileForm();
        $w('#playerProfileEmbed').postMessage({
          type: TYPES.data,
          payload
        });
      } catch (error) {
        console.error(error);
        $w('#playerProfileEmbed').postMessage({
          type: TYPES.error,
          message: 'Impossible de charger votre profil.'
        });
      }
    }

    if (message.type === TYPES.save) {
      try {
        await saveMyPlayerProfile(message.payload);
        $w('#playerProfileEmbed').postMessage({ type: TYPES.saved });
      } catch (error) {
        console.error(error);
        $w('#playerProfileEmbed').postMessage({
          type: TYPES.error,
          message: 'Impossible d’enregistrer le profil.'
        });
      }
    }
  });
});
```

## Wix backend

Use the backend web module documented in the API repository's `docs/WIX_PLAYER_PROFILE_SETUP.md`.

The backend must:

- use `Permissions.SiteMember`
- get the current Wix member with `currentMember.getMember()`
- retrieve `JPDB_API_BASE_URL` and `JPDB_WIX_INTEGRATION_KEY` only on the backend
- derive the Wix member ID itself
- ignore any member ID that could be supplied by frontend/iframe data

## Standalone design preview

When `#/edit-profile` is opened outside an iframe, the React editor uses local preview data and simulates a save. This is intentional for visual review only. No data is sent to the production API in standalone mode.

## Rollback

This work is isolated on `agent/embedded-profile-editor`. `main` and the current live GitHub Pages deployment remain unchanged until an explicit merge.
