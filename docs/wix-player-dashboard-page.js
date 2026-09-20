// Page code for the members-only "Mon profil joueur" Wix page.
// Uses the existing backend module in irisalukiferriswheel/jpdbwebsite-wix.
import { getMyPlayerOnboardingForm, savePlayerOnboarding } from 'backend/playerOnboarding.web';

$w.onReady(() => {
  const embed = $w('#playerDashboardEmbed');
  let saving = false;
  let loading;
  const send = message => embed.postMessage(message);
  const load = async () => {
    if (!loading) loading = getMyPlayerOnboardingForm();
    try {
      send({ type: 'JPDB_PROFILE_EDITOR_DATA', payload: await loading });
    } catch {
      send({ type: 'JPDB_PROFILE_EDITOR_ERROR', message: 'Impossible de charger votre profil.' });
    } finally { loading = undefined; }
  };
  embed.onMessage(async event => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;
    if (['JPDB_PROFILE_EDITOR_READY', 'JPDB_PROFILE_EDITOR_REQUEST_DATA'].includes(message.type)) {
      if (!saving) await load();
    } else if (message.type === 'JPDB_PROFILE_EDITOR_SAVE' && !saving) {
      saving = true;
      try {
        // The backend validates the fields and derives identity from the Wix
        // session. Never add a browser-supplied member ID or integration key.
        const result = await savePlayerOnboarding(message.payload);
        if (!result?.success) throw new Error('Save failed');
        loading = undefined;
        send({ type: 'JPDB_PROFILE_EDITOR_SAVED' });
      } catch {
        send({ type: 'JPDB_PROFILE_EDITOR_ERROR', message: 'Impossible d’enregistrer le profil. Réessayez.' });
      } finally { saving = false; }
    }
  });
  embed.src = 'https://irisalukiferriswheel.github.io/annuaire-joueurs-jouer-pour-de-bon/?lang=fr#/my-profile';
});

