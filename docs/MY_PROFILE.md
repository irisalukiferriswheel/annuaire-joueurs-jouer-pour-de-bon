# My player profile dashboard

This is an additional screen in the existing React/Vite embed repository. It uses the same colours, cards and responsive styling as the other player screens, without a second site header/footer. No new repository or database is required.

## Wix installation (after deploying this change)

1. Open the regular Wix page **Mon profil joueur** and restrict it to site members.
2. Add a website HTML Component and set its element ID to **playerDashboardEmbed**.
3. Use `https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/?lang=fr#/my-profile` as the source.
4. Paste `docs/wix-player-dashboard-page.js` into that page's Velo code. It uses the existing `backend/playerOnboarding.web` module from the active `jpdbwebsite-wix` repository.
5. Keep this distinct from `playerOnboardingEmbed`: the existing masterPage code forces that ID to the complete-profile form. Do not attach a second message handler to this dashboard component.
6. Give the embed sufficient height for both dashboard and edit form; check desktop/mobile scrolling and keyboard access in Preview.

The public Find Players embed stays at the repository root. Do not replace its URL with the dashboard URL.

## Persistence

The dashboard requests the signed-in member's stored onboarding profile through Wix. The Edit button opens the existing complete-profile form. Saves call the existing authenticated `savePlayerOnboarding` backend method. Only its success reply closes the editor; the dashboard then requests the profile again. Refreshing or returning to the page loads the stored profile. Cancelling discards unsaved edits.

No private profile is cached in localStorage and no browser-supplied member ID is used. Opening the dashboard outside Wix shows account-connection instructions, not a fake saved profile. Database writes and live cross-session persistence must be verified from the published Wix members page.

The dashboard is French/English and uses the existing remembered language setting. The reused detailed edit form is currently French. Activity has an explicit unavailable state because the onboarding response does not include verified games played, wins or contributions; no invented totals are shown.

## Verify before publishing

- Signed-out visitors must sign in; two different members must receive their own profiles.
- A member with no profile sees Create my profile.
- Edit an alias, city or games, save, then refresh: the saved values remain.
- Cancel an edit: the dashboard retains the last saved values.
- A save failure keeps the editor open and does not claim success.
- A load failure shows Retry rather than sample player data.
- The Find Players page still shows the directory.

## Repository setup

Use the Node `.gitignore`. Commit `package.json`, `package-lock.json`, source and workflows. Ignore `node_modules/`, `dist/`, logs and `.env` files; keep the safe `.env.example`. GitHub Pages hosts the built interface; the existing authenticated API stores profile data.

