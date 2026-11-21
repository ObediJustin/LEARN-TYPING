# LEARN_TYPING

LEARN_TYPING est un jeu d’arcade de frappe bilingue (français/anglais) construit en HTML5 Canvas, CSS et JavaScript natif.

## Fonctionnalités

- Ciblage automatique à la première lettre et verrouillage de cible
- Quatre modes : Classique, Survie, Chrono 60 secondes et Entraînement
- Trois difficultés, vagues progressives et mini-boss
- Dictionnaires français et anglais, accents Unicode et mode de tolérance configurable
- Score, multiplicateur, précision, WPM, particules, secousses et effets néon
- Power-ups : Gel, Bouclier, Score ×2 et EMP
- Audio synthétisé avec Web Audio API, sans fichier externe
- Scores, réglages, statistiques et succès sauvegardés dans `localStorage`
- Interface responsive et option de réduction des mouvements

## Lancer localement

Servez le dossier `dist` avec un serveur HTTP local :

```bash
npx serve dist
```

Puis ouvrez l’adresse affichée par le serveur. Aucun build ni dépendance applicative n’est requis.

## Contrôles

- Lettres : verrouiller et frapper une cible
- Retour arrière : libérer la cible
- Échap : libérer la cible ou mettre en pause
- P : mettre en pause

## Déploiement

Le dossier `dist` est statique et peut être déployé sur GitHub Pages, Netlify, Vercel ou ChatGPT Sites.
