export const copy = {
  fr: {
    languageName: 'Français',
    community: 'Communauté Jouer pour de bon',
    heroTitle: 'Trouvez des gens avec qui jouer.',
    heroText: 'Cherchez des joueurs par ville, jeu ou cause. Voyez qui est disponible, à quoi ils jouent, leur réputation dans la communauté et l’impact qu’ils ont contribué à créer.',
    searchPlaceholder: 'Chercher un joueur, un jeu, une ville ou une cause…',
    searchPlayers: 'Chercher des joueurs',
    filtersLabel: 'Filtres des joueurs',
    city: 'Ville',
    allCities: 'Toutes les villes',
    game: 'Jeu',
    allGames: 'Tous les jeux',
    cause: 'Cause',
    allCauses: 'Toutes les causes',
    available: 'Disponible',
    readyToPlay: 'Prêt à jouer',
    reset: 'Réinitialiser',
    noMatches: 'Aucun joueur ne correspond à ces filtres.',
    noMatchesHelp: 'Essayez une autre ville, un autre jeu ou une autre cause, ou affichez aussi les joueurs qui ne sont pas disponibles présentement.',
    resetFilters: 'Réinitialiser les filtres',
    playerFound: 'joueur trouvé',
    playersFound: 'joueurs trouvés',
    playsFor: 'Joue pour',
    games: 'parties',
    wins: 'victoires',
    avgGame: 'moy./partie',
    toCauses: 'aux causes',
    crowdfundingGoal: 'objectif de financement atteint',
    crowdfundingGoals: 'objectifs de financement atteints',
    viewProfile: 'Voir le profil',
    prototypeNote: 'Données de prototype pour tester l’interface. Les statistiques et les avis vérifiés proviendront de l’API Jouer pour de bon.',
    backToPlayers: 'Retour aux joueurs',
    verifiedPlayer: 'Joueur vérifié',
    communityRating: 'évaluation communautaire',
    about: 'À propos de',
    causeImpact: 'Impact sur les causes',
    causeImpactTitle: 'L’impact créé grâce à ses parties',
    attributedContribution: 'attribués aux parties de ce joueur',
    goalReached: 'Objectif atteint',
    crowdfundingTarget: 'de l’objectif de financement',
    communityFeedback: 'Avis de la communauté',
    reviewsTitle: 'Avis de coéquipiers et adversaires vérifiés',
    playedTogether: 'Ont joué ensemble',
    noReviews: 'Aucun avis écrit pour le moment.',
    leaveReview: 'Laisser un avis vérifié',
    reportConcern: 'Signaler un problème de sécurité',
    reviewButtonTitle: 'Disponible lorsque l’authentification et l’API des avis seront connectées',
    reportButtonTitle: 'Les signalements de sécurité seront privés et transmis aux modérateurs',
    safetyNote: 'Les avis sont destinés aux joueurs ayant participé à la même partie terminée. Les signalements sérieux demeurent privés et ne deviennent pas des accusations publiques.',
    playerRecord: 'Bilan du joueur',
    gamesPlayed: 'Parties jouées',
    winRate: 'taux de victoire',
    goalsReached: 'objectifs de financement atteints',
    availableNow: 'Disponible maintenant',
    availableWeek: 'Disponible cette semaine',
    unavailable: 'Pas disponible présentement',
    starAria: (value) => `${value} étoiles sur 5`,
    tagLabels: {
      Respectful: 'Respectueux',
      'Fair play': 'Esprit sportif',
      Reliable: 'Fiable',
      Friendly: 'Amical',
      Welcoming: 'Accueillant',
    },
    gameLabels: {
      Chess: 'Échecs',
      Soccer: 'Soccer',
      Scrabble: 'Scrabble',
      Tetris: 'Tetris',
      'Basketball Knockout': 'Basketball Knockout',
    },
  },
  en: {
    languageName: 'English',
    community: 'Playing for Good community',
    heroTitle: 'Find people to play with.',
    heroText: 'Search players by city, game or cause. See who is available, what they play, their community reputation and the impact they have helped create.',
    searchPlaceholder: 'Search player, game, city or cause…',
    searchPlayers: 'Search players',
    filtersLabel: 'Player filters',
    city: 'City',
    allCities: 'All cities',
    game: 'Game',
    allGames: 'All games',
    cause: 'Cause',
    allCauses: 'All causes',
    available: 'Available',
    readyToPlay: 'Ready to play',
    reset: 'Reset',
    noMatches: 'No players match those filters yet.',
    noMatchesHelp: 'Try another city, game or cause, or show players who are not currently available.',
    resetFilters: 'Reset filters',
    playerFound: 'player found',
    playersFound: 'players found',
    playsFor: 'Plays for',
    games: 'games',
    wins: 'wins',
    avgGame: 'avg/game',
    toCauses: 'to causes',
    crowdfundingGoal: 'crowdfunding goal reached',
    crowdfundingGoals: 'crowdfunding goals reached',
    viewProfile: 'View profile',
    prototypeNote: 'Prototype data for interface testing. Player statistics and verified reviews will come from the Playing for Good API.',
    backToPlayers: 'Back to players',
    verifiedPlayer: 'Verified player',
    communityRating: 'community rating',
    about: 'About',
    causeImpact: 'Cause impact',
    causeImpactTitle: 'Where their games made a difference',
    attributedContribution: "attributed to this player's games",
    goalReached: 'Goal reached',
    crowdfundingTarget: 'of crowdfunding target',
    communityFeedback: 'Community feedback',
    reviewsTitle: 'Reviews from verified co-players',
    playedTogether: 'Played together',
    noReviews: 'No written reviews yet.',
    leaveReview: 'Leave a verified review',
    reportConcern: 'Report a safety concern',
    reviewButtonTitle: 'Enabled when authentication and the review API are connected',
    reportButtonTitle: 'Safety reports will be private and sent to moderators',
    safetyNote: 'Reviews are intended for players who participated in the same completed game. Serious safety reports are private, not public accusations.',
    playerRecord: 'Player record',
    gamesPlayed: 'Games played',
    winRate: 'win rate',
    goalsReached: 'crowdfunding goals reached',
    availableNow: 'Available now',
    availableWeek: 'Available this week',
    unavailable: 'Not currently available',
    starAria: (value) => `${value} out of 5 stars`,
    tagLabels: {},
    gameLabels: {},
  },
}

export function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('lang')
  if (requested === 'fr' || requested === 'en') return requested

  const saved = window.localStorage.getItem('jpdb-player-directory-language')
  if (saved === 'fr' || saved === 'en') return saved

  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function setLanguage(language) {
  window.localStorage.setItem('jpdb-player-directory-language', language)
  const url = new URL(window.location.href)
  url.searchParams.set('lang', language)
  window.location.assign(url.toString())
}

export function localeForLanguage(language) {
  return language === 'fr' ? 'fr-CA' : 'en-CA'
}

export function availabilityLabel(status, language) {
  const c = copy[language]
  if (status === 'now') return c.availableNow
  if (status === 'week') return c.availableWeek
  return c.unavailable
}

export function translateTag(tag, language) {
  return copy[language].tagLabels[tag] || tag
}

export function translateGame(game, language) {
  return copy[language].gameLabels[game] || game
}
