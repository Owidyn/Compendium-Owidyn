# Cartomancien — Deck de Tarot 0.3.0

Partie du module **Compendium Owidyn** : scripts dans `scripts/cartomancien/`, icônes dans `assets/cartomancien/`, gabarit dans `templates/cartomancien/`. Les flags sont rangés sous `flags.compendium-owidyn.cartomancien`.

Adaptation du [Cartomancien et du Deck du Parieur](https://homebrewery.naturalcrit.com/share/3VQuARMxdKVB), pour Foundry VTT 14 et D&D5e 6.0.6. Les autres styles de deck ne sont pas inclus.

## Mise à jour

1. Redémarrer Foundry ou recharger le monde.
2. Ouvrir le monde avec un compte MJ : la classe (compendium **Compendium Owidyn**, dossier *Class › Cartomancien*) et la Spell List (compendium **Owidyn — Journaux**, dossier *Cartomancien*) sont reconstruites automatiquement quand leur version change. Les compendiums sont déverrouillés le temps de l'écriture, puis reverrouillés.
3. Sur chaque ancienne fiche, ouvrir **Cartomancien** dans l'en-tête, puis **Initialiser / Synchroniser**. Cela ajoute les capacités manquantes du niveau et met à jour leurs activités et effets. Les usages dépensés et les choix d'avancement existants sont conservés.
4. Utiliser **Choisir les sorts mineurs** pour compléter une ancienne fiche. Pour les nouvelles fiches, ce choix existe dans l'avancement de classe.

Les nouveaux avancements de points de vie, caractéristiques et dons ne recalculent pas rétroactivement les choix d'une ancienne fiche. Les vérifier dans l'onglet d'avancement de la classe. Les descriptions générées de l'ancienne version sont corrigées ; noms, images et activités personnelles sont conservés.

## Corrections et ajouts

- Identifiants des documents, activités, effets et avancements corrigés au format Foundry de **16 caractères**.
- Progression corrigée : La Tour au niveau 11, La Lune au 13, Le Jugement au 15, Le Monde au 17, Le Diable au 18, L'Étoile au 19 et Le Soleil au 20.
- Points de vie (d6), améliorations de caractéristique aux niveaux 4/8/12/16, don de niveau 19, sous-classe et sorts mineurs.
- Chaque liaison représente une préparation. Une carte jouée peut lancer tout sort préparé de son niveau.
- Pouvoir d'influx proposé au lancement ; Intelligence et niveau d'incantation appliqués, sans consommer d'emplacement natif.
- Portée des sorts Touch portée à 30 ft dès le niveau 2. L'effet de Miser sa vie la porte à 60 ft pour un sort pendant le tour.
- Coup d'éclat pioche et marque une carte pour son prochain lancement au niveau 9, avec le temps d'incantation normal du sort.
- Carte divine permet de remplacer une carte du tirage de repos par Le Monde. Au niveau 20, Le Monde peut lancer tout sort préparé au niveau 9.
- Annuler un lancement conserve la carte. Les opérations de main sont protégées contre les doubles clics sur ce client.

## Activités et effets du Parieur

| Capacité | Fonctionnement |
| --- | --- |
| Main du Parieur | Mage Hand en action bonus ; effet persistant et activité de renvoi. |
| Là où tombent les cartes | Suite favorable pendant 24 h : +1d4 aux tests, sauvegardes et attaques ; avantage aux jets avec cartes et dés. |
| Miser sa vie | Jetons natifs ; regarder/déplacer la carte supérieure ; effet Touch 60 ft ; piocher puis remettre trois cartes ; se coucher pour récupérer deux jetons. |
| Contre toute attente | Remet la main dans le deck, mélange et repioche autant. Un usage par repos long. |
| Doubler la mise | Défausse d'une carte compatible ; nouvelle attaque ou carte de chat pour les sauvegardes à refaire. |
| HIT THE JACKPOT | Carte Mystère après repos ; action et d20 ; série de 7 persistante ; au troisième 7, résolution des vingt sorts dans l'ordre avec choix des cibles. |
| Parieur du destin | Choisit et pioche une carte disponible. Un usage par repos long. |

Les avantages dépendant du contexte — Performance spectaculaire, sauvegarde contre Charmed/Frightened et autres jeux de hasard — restent à sélectionner dans la fenêtre de jet. Le joueur et le MJ vérifient les déclencheurs : dégâts subis, attaque ratée, sauvegarde réussie ou pioche autorisée. Utiliser Contre toute attente et Parieur du destin **à la place** de la pioche concernée.

Doubler la mise utilise le dernier sort d'attaque ou de sauvegarde lancé sur ce client pendant la session. Le joueur indique les cibles ayant réussi leur sauvegarde. D&D5e résout ensuite normalement dés, dégâts et concentrations.

Les jetons ne récupèrent pas au repos : la règle source ne le prévoit pas. La Carte Mystère apparaît dans le gestionnaire et compte dans la main sans faire partie des 22 Arcanes. La suite est évaluée sur les Arcanes après le tirage, avant l'apparition de la Carte Mystère, qui n'a pas de valeur numérique.

## Repos et reprises

**Long Rest** ouvre le repos natif D&D5e, puis renouvelle la main : défausse au choix, récupération de la défausse, mélange, pioche de PB cartes supplémentaires, Carte divine et Carte Mystère. Suite favorable est appliquée si la main forme une suite. Garder des cartes peut faire dépasser PB ; PB limite la pioche gratuite du tour, pas le tirage après repos.

Après fermeture d'une fenêtre, le gestionnaire permet de reprendre le renouvellement de la main, la remise des trois cartes ou le Jackpot. Une recomposition inachevée bloque les autres opérations de main.

Les sorts proviennent des Spell Items disponibles dans la partie et ses compendiums. Un sort de Jackpot absent conserve son résultat en attente : ajouter son Spell Item à la fiche ou activer son compendium, puis reprendre. Aucun profil de sort incomplet n'est inventé.

Les cartes débloquées trop tôt par 0.2.1 sont archivées dans le drapeau `archivedCards` du personnage avant retrait des piles. Leur préparation est restaurée lorsqu'elles deviennent disponibles.

## Console MJ

```js
await game.modules.get("compendium-owidyn").api.cartomancien.rebuildCompendiums();
```

`api.cartomancien.syncActor(actor)` synchronise une fiche. `api.cartomancien.longRest(actor)` renouvelle seulement les cartes d'un repos déjà terminé ; le bouton de l'interface utilise le repos natif complet.

## Vérifications

```powershell
npm run test:cartomancien
```

Ces tests simulent documents et hooks Foundry : progression, ressources, annulations, repos, effets et Jackpot. Les signatures et schémas ont été vérifiés dans les sources locales Foundry 14 / D&D5e 6.0.6. Un essai dans l'interface d'une partie reste nécessaire.
