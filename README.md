# LEARN_TYPING

LEARN_TYPING est un jeu d’arcade de frappe multilingue construit en HTML5 Canvas, CSS et JavaScript natif.

## Fonctionnalités

- Ciblage automatique à la première lettre et verrouillage de cible
- Quatre modes : Classique, Survie, Chrono 60 secondes et Entraînement
- Trois difficultés, vagues progressives et mini-boss
- 12 langues de frappe indépendantes de la langue d’interface
- 24 000 mots locaux chargés à la demande, répartis par difficulté
- Sélection par sacs mélangés, progression par vague et prévention des répétitions
- Gestion Unicode NFC et mode de tolérance des accents configurable
- Score, multiplicateur, précision, WPM, particules, secousses et effets néon
- Mouvements ennemis prévisibles : descente, zigzag, dérive et accélération
- Power-ups : Gel, Bouclier, Score ×2 et EMP
- Audio synthétisé avec Web Audio API, sans fichier externe
- Scores, réglages, statistiques et succès sauvegardés dans `localStorage`
- Progression vocabulaire locale : mots rencontrés, maîtrisés et erreurs fréquentes
- Interface responsive et option de réduction des mouvements

## Langues

Français, English, Kiswahili, Español, Português (Portugal), Italiano, Deutsch, Türkçe, Bahasa Indonesia, Nederlands, Polski et Română.

L’interface reste disponible en français et en anglais. La langue de frappe est choisie séparément et possède ses propres classements par mode et difficulté.

Le portugais utilise explicitement la variante européenne `pt-PT`.

## Vocabulaire et licences

Chaque langue contient exactement 2 000 entrées : 500 débutantes, 800 intermédiaires, 550 avancées et 150 expertes.

- Onze langues proviennent des listes de fréquence FrequencyWords / OpenSubtitles 2018.
- Le kiswahili provient de la liste filtrée Wordtide, issue de Wiktionary via Kaikki/wiktextract.
- Les sélections adaptées sont redistribuées sous CC BY-SA 4.0.

Les attributions détaillées et les limites de validation figurent dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Ces listes sont destinées à l’entraînement de frappe et ne fournissent ni traductions ni définitions.

## Lancer localement

Servez le dossier `dist` avec un serveur HTTP local :

```bash
npx serve dist
```

Puis ouvrez l’adresse affichée par le serveur. Aucun build ni dépendance applicative n’est requis.

## Validation

```bash
npm run check
```

Cette commande vérifie la syntaxe des modules, les traductions, les 12 dictionnaires, les licences, la normalisation Unicode, les groupes de longueur, l’absence de doublons, la sélection déterministe et la migration des sauvegardes existantes.

## Contrôles

- Lettres : verrouiller et frapper une cible
- Retour arrière : libérer la cible
- Échap : libérer la cible ou mettre en pause
- P : mettre en pause

## Déploiement

Le dossier `dist` est statique et peut être déployé sur GitHub Pages, Netlify, Vercel ou ChatGPT Sites.
