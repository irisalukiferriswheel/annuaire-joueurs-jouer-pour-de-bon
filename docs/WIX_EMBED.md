# Wix embed setup

Live player directory:

```text
https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/
```

The GitHub Pages application intentionally has no site header or footer. Wix should provide the surrounding site navigation and footer so the embedded directory reads as part of the main Jouer pour de bon site.

## Recommended Wix page

Create a normal Wix page named:

```text
Trouver des joueurs
```

Suggested URL slug:

```text
/joueurs
```

On that page, add an HTML / website embed element and use the live GitHub Pages URL above as the external site URL.

## Layout

Recommended initial sizing:

- Width: 100% of the content area
- Desktop height: approximately 1400–1800 px
- Mobile height: approximately 2200 px
- Keep the Wix page background neutral so the directory's own light background blends cleanly
- Do not add a second heading above the embed; the directory already contains its own hero/title

The application is responsive, but a standard Wix iframe does not automatically resize its height to match cross-origin content. If the directory grows beyond the fixed iframe height, either increase the Wix element height or later add a controlled `postMessage` resizing bridge.

## Navigation

Recommended site-menu label:

```text
Trouver des joueurs
```

English equivalent:

```text
Find Players
```

## Safety

Do not paste any API key, `WIX_INTEGRATION_KEY`, Supabase service-role key, or other private credential into the iframe URL or frontend code. The directory is designed to call only a public, read-only player endpoint.

## API activation

The frontend currently falls back to demo player data unless `VITE_API_BASE_URL` is set at build time. Once the shared API has a public HTTPS deployment, configure the GitHub Pages build with the public API base URL and ensure the API allows this browser origin:

```text
https://irisalukiferriswheel.github.io
```

The repository path is not part of the browser `Origin` header.

## Future auto-height option

If we want the Wix iframe to grow automatically with the player list, add a small message bridge:

1. The GitHub Pages app measures its document height.
2. It sends the height to its parent using `window.parent.postMessage()`.
3. Wix page code listens for the known origin and adjusts the embed element height.
4. The listener must verify `event.origin === "https://irisalukiferriswheel.github.io"` before accepting messages.

This should be implemented only after the embed element has a stable Wix element ID.
