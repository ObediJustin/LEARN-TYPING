export const LANGUAGES = {
  fr: { nativeName: 'Français', locale: 'fr-FR' },
  en: { nativeName: 'English', locale: 'en-GB' },
  sw: { nativeName: 'Kiswahili', locale: 'sw-TZ' },
  es: { nativeName: 'Español', locale: 'es-ES' },
  pt: { nativeName: 'Português (Portugal)', locale: 'pt-PT' },
  it: { nativeName: 'Italiano', locale: 'it-IT' },
  de: { nativeName: 'Deutsch', locale: 'de-DE' },
  tr: { nativeName: 'Türkçe', locale: 'tr-TR' },
  id: { nativeName: 'Bahasa Indonesia', locale: 'id-ID' },
  nl: { nativeName: 'Nederlands', locale: 'nl-NL' },
  pl: { nativeName: 'Polski', locale: 'pl-PL' },
  ro: { nativeName: 'Română', locale: 'ro-RO' }
};

export const TEXT = {
  fr: {
    trainingSystem:'Système d’entraînement actif', tagline:'Tape vite. Vise juste. Progresse.', heroNote:'Défends le réseau, une lettre à la fois.', missionSetup:'Configuration de mission', setupHint:'Choisis ton rythme et lance la séquence.', language:'Langue', interfaceLanguage:'Langue de l’interface', typingLanguage:'Langue de frappe', catalogStatus:'12 langues · 24 000 mots', difficulty:'Difficulté', rookie:'Recrue', normal:'Normal', expert:'Expert', gameMode:'Mode de jeu', classic:'Classique', classicDesc:'Vagues progressives', survival:'Survie', survivalDesc:'Tiens le plus longtemps', timeAttack:'Chrono', timeDesc:'60 secondes intenses', practice:'Entraînement', practiceDesc:'Sans pression', launch:'Lancer la mission', loadingWords:'Chargement du vocabulaire…', howToPlay:'Comment jouer', highScores:'Meilleurs scores', vocabularyProgress:'Progression vocabulaire', settings:'Réglages', keyboardReady:'Clavier détecté · système prêt', score:'Score', wave:'Vague', combo:'Combo', accuracy:'Précision', time:'Temps', getReady:'Prépare-toi', systemPaused:'Système en pause', paused:'Mission suspendue', pauseHint:'Respire. Le chronomètre et les ennemis sont figés.', resume:'Reprendre', restart:'Recommencer', mainMenu:'Menu principal', runComplete:'Session terminée', gameOver:'Mission terminée', newRecord:'Nouveau record', finalScore:'Score final', playAgain:'Rejouer', close:'Fermer', avgWpm:'WPM moyen', maxCombo:'Combo max', words:'Mots', destroyed:'Détruits', survivalTime:'Durée', waveReached:'Vague', noScores:'Aucun score enregistré. À toi d’ouvrir le classement.', rank:'Rang', mode:'Mode', missionScore:'Score', correct:'Correct', mistake:'Erreur', targetReleased:'Cible libérée', shieldSaved:'Bouclier consommé', achievement:'Succès débloqué', waveClear:'Vague sécurisée', bossIncoming:'ALERTE : MINI-BOSS', freeze:'Gel', shield:'Bouclier', double:'Score ×2', emp:'EMP', audio:'Son', ambience:'Ambiance', reducedMotion:'Mouvements réduits', accentPolicy:'Tolérance des accents', accentHelp:'Activée : les accents d’une même lettre sont considérés équivalents. Désactive-la pour un entraînement strict.', howTitle:'Protocole de frappe', scoresTitle:'Archives de mission', vocabularyTitle:'Progression vocabulaire', settingsTitle:'Paramètres système', howHtml:'<h3>Verrouillage</h3><p>Tape la première lettre d’un mot ennemi : la cible la plus proche est verrouillée. Termine le mot pour détruire le vaisseau.</p><h3>Contrôles</h3><ul><li><b>Lettres</b> — tirer et progresser dans le mot</li><li><b>Retour arrière</b> — libérer la cible</li><li><b>Échap</b> — libérer la cible, puis mettre en pause</li><li><b>Espace</b> — mettre en pause ou reprendre</li></ul><h3>Conseil</h3><p>La précision entretient le multiplicateur. Une erreur remet le combo à zéro.</p>', recordLabel:'Record', practiceHint:'Le mode entraînement ne se termine pas en cas de collision.', volume:'Volume', resetData:'Effacer les scores', confirmReset:'Effacer toutes les statistiques locales ?', yesReset:'Effacer', cancel:'Annuler', defeated:'Boss vaincu', firstBlood:'Premier sang', sharpshooter:'Tireur d’élite', speedDemon:'Démon de vitesse', comboMaster:'Maître du combo', survivorAch:'Survivant', bossHunter:'Chasseur de boss', encountered:'Mots rencontrés', mastered:'Mots maîtrisés', frequentMistakes:'Erreurs fréquentes', languageAccuracy:'Précision par langue', attempts:'Tentatives', emptyVocabulary:'Aucun mot enregistré. Termine quelques mots pour voir ta progression.', dictionaryError:'Impossible de charger ce vocabulaire.'
  },
  en: {
    trainingSystem:'Training system online', tagline:'Type fast. Aim true. Improve.', heroNote:'Defend the network, one letter at a time.', missionSetup:'Mission setup', setupHint:'Choose your pace and launch the sequence.', language:'Language', interfaceLanguage:'Interface language', typingLanguage:'Typing language', catalogStatus:'12 languages · 24,000 words', difficulty:'Difficulty', rookie:'Rookie', normal:'Normal', expert:'Expert', gameMode:'Game mode', classic:'Classic', classicDesc:'Progressive waves', survival:'Survival', survivalDesc:'Hold out as long as possible', timeAttack:'Time attack', timeDesc:'60 intense seconds', practice:'Practice', practiceDesc:'Pressure-free training', launch:'Launch mission', loadingWords:'Loading vocabulary…', howToPlay:'How to play', highScores:'High scores', vocabularyProgress:'Vocabulary progress', settings:'Settings', keyboardReady:'Keyboard detected · system ready', score:'Score', wave:'Wave', combo:'Combo', accuracy:'Accuracy', time:'Time', getReady:'Get ready', systemPaused:'System paused', paused:'Mission suspended', pauseHint:'Take a breath. The timer and enemies are frozen.', resume:'Resume', restart:'Restart', mainMenu:'Main menu', runComplete:'Run complete', gameOver:'Mission complete', newRecord:'New record', finalScore:'Final score', playAgain:'Play again', close:'Close', avgWpm:'Average WPM', maxCombo:'Max combo', words:'Words', destroyed:'Destroyed', survivalTime:'Time', waveReached:'Wave', noScores:'No score recorded. Be the first on the board.', rank:'Rank', mode:'Mode', missionScore:'Score', correct:'Correct', mistake:'Mistake', targetReleased:'Target released', shieldSaved:'Shield consumed', achievement:'Achievement unlocked', waveClear:'Wave secured', bossIncoming:'WARNING: MINI-BOSS', freeze:'Freeze', shield:'Shield', double:'Double score', emp:'EMP', audio:'Sound', ambience:'Ambience', reducedMotion:'Reduced motion', accentPolicy:'Accent tolerance', accentHelp:'Enabled: accents of the same letter are treated as equivalent. Disable it for strict practice.', howTitle:'Typing protocol', scoresTitle:'Mission archives', vocabularyTitle:'Vocabulary progress', settingsTitle:'System settings', howHtml:'<h3>Target lock</h3><p>Type the first letter of an enemy word: the closest matching target locks on. Finish the word to destroy the ship.</p><h3>Controls</h3><ul><li><b>Letters</b> — fire and progress through the word</li><li><b>Backspace</b> — release your target</li><li><b>Escape</b> — release your target, then pause</li><li><b>Space</b> — pause or resume</li></ul><h3>Tip</h3><p>Accuracy fuels the multiplier. One mistake resets your combo.</p>', recordLabel:'Record', practiceHint:'Practice mode does not end on collision.', volume:'Volume', resetData:'Clear scores', confirmReset:'Clear all local statistics?', yesReset:'Clear', cancel:'Cancel', defeated:'Boss defeated', firstBlood:'First Blood', sharpshooter:'Sharpshooter', speedDemon:'Speed Demon', comboMaster:'Combo Master', survivorAch:'Survivor', bossHunter:'Boss Hunter', encountered:'Words encountered', mastered:'Words mastered', frequentMistakes:'Frequently mistyped', languageAccuracy:'Accuracy by language', attempts:'Attempts', emptyVocabulary:'No vocabulary recorded yet. Complete a few words to see your progress.', dictionaryError:'Unable to load this vocabulary.'
  }
};

export const ENEMY_CONFIG = {
  scout: { radius: 17, speed: 1.18, score: 70, color: '#00f5ff' },
  fighter: { radius: 23, speed: .9, score: 110, color: '#367bff' },
  tank: { radius: 31, speed: .58, score: 180, color: '#ff9f43' },
  phantom: { radius: 21, speed: 1.35, score: 240, color: '#ff2bd6' },
  boss: { radius: 62, speed: .34, score: 1200, color: '#ff4560' }
};

export const DIFFICULTY = {
  rookie: { speed: .72, spawn: 1.2, max: 6, score: .8 },
  normal: { speed: 1, spawn: 1, max: 8, score: 1 },
  expert: { speed: 1.25, spawn: .82, max: 10, score: 1.35 }
};

export const ACHIEVEMENTS = [
  { id:'firstBlood', test:s=>s.destroyed >= 1 },
  { id:'sharpshooter', test:s=>s.ended && s.correct + s.incorrect >= 20 && s.accuracy >= 95 },
  { id:'speedDemon', test:s=>s.wpm >= 80 },
  { id:'comboMaster', test:s=>s.maxCombo >= 20 },
  { id:'survivorAch', test:s=>s.elapsed >= 600 },
  { id:'bossHunter', test:s=>s.bosses >= 1 }
];

export function t(language, key) { return TEXT[language]?.[key] ?? TEXT.en[key] ?? key; }
