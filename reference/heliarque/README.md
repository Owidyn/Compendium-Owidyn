# Héliarque — Soothing Star (contenu 2.5.0)

Partie du module **Compendium Owidyn** : scripts dans `scripts/heliarque/`, icônes dans `assets/heliarque/`, contenu généré par `tools/heliarque/`.

Classe **Héliarque** et discipline **Soothing Star** pour **Foundry VTT 14** et **D&D5e 6.0.6**, construites comme les classes officielles du système. Règles : [`heliarque-updated.md`](heliarque-updated.md) ; écarts de table : [`house-rules.md`](house-rules.md) ; aperçu des icônes : [`icones.html`](icones.html).

## Installation

1. Activez **Compendium Owidyn** dans le monde, puis rechargez.
2. Au chargement (MJ connecté), le module crée pour chaque Héliarque un acteur **Orbital** par point de Formes simultanées, dans le dossier **Héliarque — Orbitals**, et en donne la propriété aux joueurs de l'Héliarque. Les copies des Formes importées par les versions 2.0–2.2 sont supprimées si aucun pion ne les utilise. Le réglage dnd5e **Allow Summoning** est activé s'il ne l'était pas. Les joueurs doivent aussi avoir la permission Foundry **Créer des pions**.
3. Glissez **Héliarque** depuis le compendium **Compendium Owidyn** (dossier *Class › Héliarque*) sur la fiche du personnage. Les Formes sont dans le compendium **Héliarque — Formes orbitales**.

Les flags de l'Héliarque sont rangés sous `flags.compendium-owidyn.heliarque`. L'archive de la version 1.4.0 de l'ancien module n'est plus dans le module : elle reste dans la sauvegarde `FoundryVTT/Backups/fusion-owidyn-2026-11-02/modules/Heliarque/archive/`.

## Ce qui est natif

| Élément | Implémentation |
| --- | --- |
| Progression 1–20 | Avancements de classe : PV d8, maîtrises, 2 compétences, aptitudes par niveau, Discipline au niveau 3, Feats 4/8/12/16, Epic Boon 19 |
| Dé de Fusion, Formes simultanées, Techniques connues, tables des Formes | Valeurs d'échelle (`@scale.heliarque.fusion`, `.formes`, `.canon`, `.champ`…) |
| Orbitals | Compteur d'utilisations : max = niv + PB + CHA (min 4) ; repos court DF + PB ; repos long : tout |
| Techniques stellaires | **Sorts** de la méthode d'incantation « Techniques stellaires » (section propre dans l'onglet Sorts, aucun emplacement). Niveau de sort = palier de prérequis (Héliarque 1/5/9/13/17 → 1 à 5). Choisies à la montée de niveau ; coût en Orbitals consommé automatiquement |
| Formes | Sort **Manifestation orbitale** (niveau 0, Summon) : Bonus Action, 1 Orbital, Halo et Ancre à partir du niveau 2. Le module pose un **Orbital** libre (acteur persistant, pion lié) sous la Forme choisie. Ses utilisations affichent les Orbitals libres (max = `@scale.heliarque.formes`) |
| Orbitals (Formes simultanées) | Un acteur par point, avec ses propres PV (5 + 4 × niv + CHA) et sa CA. Il garde ses PV au Rappel et au changement de forme ; repos court ou long : PV au maximum (les Orbitals détruits attendent le repos long) |
| Origine orbitale | Passif permanent : effet transféré sans modification, visible parmi les effets passifs du personnage |
| Aptitudes des Formes | Sur la fiche de chaque Forme : **Rappel**, **Changer de forme**, Intégrité, Présence, Commande, Rupture, améliorations des niveaux 7 et 13 et Présence apaisante (Soothing Star 6), ajoutées selon le niveau. Elles lisent les valeurs de l'Héliarque via `@summoner` |

## Ce que le module automatise

- **Formes.** Manifestation refusée sans Orbital libre ; choix de l'Orbital quand leurs PV diffèrent. **Rappel** rend l'Orbital à la Réserve, PV conservés. **Changer de forme** (Reconfiguration) transforme le même Orbital sur place. Une Commande par Forme et par tour. Améliorations des niveaux 7 et 13 et de Soothing Star selon le niveau. Vitesse du Satellite et taille du Bastion selon les tables.
- **Destruction.** À 0 PV ou après une Rupture, la Forme disparaît ; son Orbital et sa place parmi les Formes simultanées restent bloqués jusqu'au repos long.
- **Présences.** Étoile guide, Refuge et Stabilité s'appliquent selon la position des pions. Le Champ gravitationnel est un terrain difficile pour les hostiles, attaché à l'Ancre. Le Halo suit son porteur et ajoute la Couronne incendiaire au premier jet de dégâts du tour. Ascension coronaire et Chaleur réconfortante sont aussi automatiques. Le Bastion Bloodied réduit les dégâts.
- **Déplacements.** Bouton **Repousser / Attirer / Déplacer** sur la carte de chat. Seules les cibles ayant raté leur JS sont pré-cochées. Les poussées suivent une ligne droite et s'arrêtent aux murs. Les déplacements libres et les téléportations se placent à la souris.
- **Techniques.** Choix de l'Origine (vous ou un Satellite). Ciblage automatique autour d'une Forme, le long des lignes et trajectoires, ou dans les sphères. **Combustion de secours** proposée si la Réserve manque. Réduction de coût de **Supernova**.
- **Aptitudes.** Translation et Passage orbital, Dérivation structurelle, Constellation mobile et Reconfiguration fluide, Commandement parallèle, Réacteur autonome, Supernova, Incarnations du Corps orbital, NOT YET.
- **Propositions dans le chat** : Sillage apaisant après une Commande ou une Technique depuis un Satellite, Réaction supercritique, Surplus critique.
- **Noyau supercritique.** Les dégâts Fire et Force des aptitudes de l'Héliarque ignorent la résistance.

## Développement

```sh
npm install                # classic-level, pour écrire les compendiums
npm run build:heliarque    # tools/heliarque/content/*.mjs → packs/_source/heliarque (JSON) + packs/ (LevelDB)
npm run test:heliarque
```

Fermez le monde dans Foundry avant `npm run build:heliarque` : les compendiums sont verrouillés pendant qu'il est ouvert. La compilation le détecte et s'arrête sans rien modifier.

Le compendium d'objets est partagé avec le reste du contenu Owidyn : la compilation ne remplace que les documents Héliarque (ceux qui portent `flags.compendium-owidyn.heliarque`) et laisse tout le reste intact. Le dossier *Héliarque* garde l'emplacement où il a été déplacé. Ne rangez donc pas d'objet personnel dans ses dossiers, et modifiez le contenu Héliarque dans `tools/heliarque/content/`, pas dans Foundry : une recompilation écraserait ces changements.
