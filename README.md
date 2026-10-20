# Clair

Observateur visuel local pour suivre les agents et sous-agents de Claude Code.

**État actuel : prototype interactif avec données simulées.** Le collecteur local Claude Code n’est pas encore implémenté. Aucun agent réel n’est lancé ou piloté par cette application.

## Stack

- JavaScript natif, modules ES.
- HTML et CSS, sans framework ni compilation.
- Tests avec le moteur intégré de Node.js.
- Aucune dépendance npm à installer pour cette version.

## Lancer en local

Prérequis : Python 3 pour le serveur statique. Node.js 20 ou ultérieur pour les vérifications.

```bash
git clone https://github.com/PadreFR/Clair.git
cd Clair
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Ouvrir **http://127.0.0.1:4173**. Tout autre serveur HTTP statique servant `dist/` convient également. Les modules JavaScript nécessitent HTTP : ne pas ouvrir directement `index.html` en `file://`.

## Fonctionnalités du prototype

- Six tâches indépendantes sur différentes branches.
- Arbre de délégation montrant qui lance chaque agent et sous-agent.
- Apparition progressive des agents, états et durées simulés.
- Travail parallèle, dépendances, erreurs, reprises et arrêts documentés.
- Consultation des agents, changements illustratifs, preuves, décisions et traces.
- Recherche et filtres, repli des branches, zoom, thèmes clair et sombre.
- Interface adaptée au mobile, navigation au clavier et respect de la préférence de réduction des animations.
- Aucun montant monétaire affiché.

La simulation démarre à l’ouverture de la page. Les scénarios se rejouent toutes les 156 secondes simulées. Les commandes de pause, de vitesse et de réinitialisation concernent uniquement la simulation.

## Vérifier le code

```bash
npm run check
npm test
```

Les tests vérifient la progression des tâches, les compteurs, les dépendances, la filiation et l’identité des commits lors des reprises.

## Organisation

```text
dist/
  index.html     Structure de l’interface
  app.js         Interactions et rendu
  model.js       Simulation des tâches et événements
  tree.js        Modèle de l’arbre de délégation
  styles.css     Styles de base
  tree.css       Vue en arbre et thèmes
tests/
  model.test.js  Vérification des scénarios
  tree.test.js   Vérification de la hiérarchie
```

Le dossier `dist/` contient directement les sources servies au navigateur ; il ne provient pas d’une compilation. Google Fonts est optionnel : des polices de repli sont prévues.

## Direction du produit : observation uniquement

Le futur collecteur local recevra les événements de Claude Code et les transmettra à l’interface. Clair n’aura aucun rôle de lancement, d’arbitrage ou de contrôle des agents. L’orchestrateur représenté sera celui observé dans Claude Code.

À développer et valider avec une installation réelle de Claude Code :

- collecte locale et persistance des sessions, agents, appels d’outils et liens parent-enfant ;
- actualisation de l’interface depuis les événements observés ;
- tokens propres et cumulés par branche, sans doublons ;
- jauge du quota Claude de cinq heures lorsqu’elle est fournie par Claude Code.

La part des tokens observés devra rester distincte du pourcentage du quota global de l’abonnement. Une donnée indisponible sera indiquée comme telle.

La collecte, les tokens et le quota ne sont pas connectés dans ce prototype.
