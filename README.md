# Compendium Owidyn 2.2.0

Contenu homebrew d'Owidyn pour **Foundry VTT 14** et **D&D5e 6.0.6**, en un seul module. Il regroupe depuis la 2.0.0 les anciens modules **Héliarque — Soothing Star** (`Heliarque`) et **Cartomancien — Deck de Tarot** (`cartomancien-deck`), avec toutes leurs automatisations.

## Compendiums

Les quatre compendiums sont rangés dans le dossier **Owidyn** de l'onglet Compendiums. Tout leur contenu a pour source **Owidyn's Source Compendium (OSC)**, déclarée dans `module.json` : c'est ce qu'affichent les fiches et le filtre *Source* du Compendium Browser.

| Compendium | Type | Contenu |
| --- | --- | --- |
| **Compendium Owidyn** | Objets | Tout le contenu Owidyn, classé par dossiers (voir ci-dessous) |
| **Héliarque — Formes orbitales** | Acteurs | Satellite, Bastion, Halo, Ancre gravitationnelle |
| **Owidyn — Journaux** | Journaux | *Cartomancien* › Liste de sorts du Cartomancien (enregistrée comme Spell List D&D5e) ; *Listes de sorts* › Owidyn — Listes de sorts : les sorts Owidyn ajoutés aux listes officielles, que dnd5e fusionne avec elles (Druid : Thorn Whip) |
| **Owidyn — Bestiaire** | Acteurs | Créatures absentes de dnd5e ou corrigées, classées par type (*Aberration* › Flumph, Grimlock, Kuo-toa, Piercer, Slaad Tadpole, *Beast* › Ape, Boar, Elk, Giant Badger, Giant Crab, Giant Frog, Giant Rat, Giant Venomous Snake, Giant Wolf Spider, Panther, Pteranodon, Warhorse, *Celestial* › Giant Owl, *Construct* › Animated Broom, *Dragon* › Pseudodragon, Winged Kobold, *Elemental* › Aarakocra Skirmisher, Dust Mephit, Ice Mephit, Magma Mephit, Merfolk Skirmisher, Mud Mephit, Smoke Mephit, Steam Mephit, *Fey* › Blink Dog, Goblin Minion, Goblin Warrior, Pixie, Satyr, *Fiend* › Dretch, Gnoll Warrior, Jackalwere, Manes, Sahuagin Warrior, *Giant* › Troll Limb, *Humanoid* › Performer, Priest Acolyte, *Monstrosity* › Axe Beak, Cockatrice, Flying Snake, Kenku, Stirge, Troglodyte, *Ooze* › Gray Ooze, *Plant* › Gas Spore Fungus, Myconid Adult, Needle Blight, Twig Blight, Vine Blight, Violet Fungus, *Undead* › Shadow, Skeleton, Warhorse Skeleton) ; masqué aux joueurs |

```
Compendium Owidyn
├─ Background
├─ Equipment › Armor, Potion, Ring, Rod, Staff, Wand, Weapon, Wondrous Item
├─ Class
│  ├─ Cartomancien          classe Le Cartomancien
│  │  ├─ Aptitudes de classe
│  │  └─ Deck du Parieur    sous-classe et ses aptitudes
│  ├─ Héliarque             classe Héliarque
│  │  ├─ Aptitudes de classe
│  │  ├─ Techniques stellaires (sorts)
│  │  └─ Discipline — Soothing Star
│  └─ Monk
│     └─ La Voie de l'Aiguille
├─ Feat › General, Origin
├─ Species
│  ├─ Elemental             Primordian (une species par lignée)
│  ├─ Monstrosity           Thri-kreen
│  └─ Racial feat           aptitudes des species, un sous-dossier par species (Primordian, Thri-kreen)
└─ Spell › Cantrip          sorts absents de dnd5e (Thorn Whip)
```

Le contenu Owidyn « manuel » (Monk, Species, Feat, Background, Bestiaire) se modifie directement dans Foundry. Les ajouts faits hors de Foundry ont leur source dans `packs/_source/owidyn/items/` (objets), `packs/_source/owidyn/bestiaire/` (créatures) et `packs/_source/owidyn/journaux/` (listes de sorts) et s'écrivent avec `tools/owidyn/add.mjs`, qui ne touche qu'aux documents qu'on lui donne ; une modification faite ensuite dans Foundry n'est pas reportée dans la source. Un contenu déjà présent à l'identique dans dnd5e n'est pas recopié : on utilise celui de dnd5e. Le contenu **Cartomancien** et **Héliarque** est généré : il est réécrit à chaque mise à jour de sa version, donc toute modification faite à la main dans leurs dossiers serait perdue. Vous pouvez déplacer les dossiers *Cartomancien* et *Héliarque* : ils restent où vous les mettez.

## Générateurs de boutiques

Dans l'onglet **Tables**, le bouton **Boutiques** (MJ seulement) ouvre le générateur de cinq boutiques :

| Boutique | Catégories |
| --- | --- |
| **La Hutte Enchantée** | Objets magiques, par rareté |
| **Équipement** | Matériel d'aventurier, outils, vêtements, vivres |
| **Forge** | Armes, armures, munitions, et leurs versions magiques |
| **Apothicaire** | Potions et fioles, herbes et ingrédients, poisons, kits, et potions magiques |
| **Écurie** | Montures, sellerie et fourrage, véhicules |

- **Mettre à jour les tables** lit tous les compendiums d'objets et de créatures, puis crée dans le dossier de tables *Boutiques* une table par catégorie de chaque boutique, plus une table principale qui tire la catégorie. Un objet présent dans plusieurs compendiums n'y figure qu'une fois : la version Owidyn, sinon dnd5e 2024, sinon dnd5e 2014, sinon celle d'un autre module ; un compendium masqué aux joueurs passe en dernier. Les objets que leur type ne décrit pas (le butin et les consommables propres à un module) sont classés d'après leur dossier de compendium : herbes, potions ou vivres ; les matières premières, gemmes et trésors ne sont pas vendus. La mise à jour garde les poids modifiés dans les tables principales mais remplace le contenu des autres tables ; elle est à refaire après l'installation d'un module d'objets.
- **Générer** tire le nombre d'articles demandé, sans doublon, avec des objets magiques limités à la rareté maximale choisie (La Hutte Enchantée en exige une). Le stock remplace la page du même nom du journal *Boutiques* : le nom de la boutique par défaut, ou celui indiqué (« Forge de Brandur ») pour garder une page par boutique de la campagne. Les prix sont ceux des objets, multipliés par le pourcentage choisi ; un objet magique sans prix prend celui de sa rareté (Dungeon Master's Guide 2024, moitié prix pour un consommable). Les montures sont liées aux créatures de dnd5e ; la sellerie et les véhicules absents des compendiums sont des lignes de texte, au prix du Player's Handbook.
- Pour présenter le stock, utilisez **Montrer aux joueurs** sur la page : ils glissent les objets achetés sur leur fiche.

Console MJ : `game.modules.get('compendium-owidyn').api.boutiques` — `openGenerator()`, `buildTables()`, `generateStock({ shop, name, count, maxRarity, percent })`.

## Installation

Dans Foundry : **Add-on Modules → Install Module**, collez cette adresse dans **Manifest URL**, puis **Install** :

```
https://github.com/Owidyn/Compendium-Owidyn/releases/latest/download/module.json
```

Foundry propose ensuite chaque nouvelle version (bouton **Update** de la liste des modules). Prérequis : Foundry VTT 14 et D&D5e 6.0.6. Le module n'utilise que ses propres images et celles de Foundry et de D&D5e.

1. Activez **Compendium Owidyn** dans le monde, puis rechargez. Les anciens modules `Heliarque` et `cartomancien-deck` ne doivent plus être installés.
2. Ouvrez le monde avec un compte MJ : les Orbitals de l'Héliarque sont créés et le contenu du Cartomancien est mis à jour si nécessaire.
3. Glissez la classe voulue depuis *Class* sur la fiche du personnage.

Détails par classe : [Héliarque](reference/heliarque/README.md) · [Cartomancien](reference/cartomancien/README.md).

## Organisation des fichiers

```
compendium-owidyn/
├─ module.json
├─ scripts/
│  ├─ owidyn.mjs            point d'entrée : charge les deux classes et les aides communes
│  ├─ owidyn/               aides du contenu Owidyn : effets activables, effets à formule, Familiar Friend, Sceau de Confinement
│  ├─ boutiques/            générateurs de boutiques : classement des objets (catalogue.mjs), tables et stocks
│  ├─ heliarque/            automatisations de l'Héliarque
│  └─ cartomancien/         deck, gestionnaire et automatisations du Cartomancien
├─ styles/                  heliarque.css, cartomancien.css
├─ templates/cartomancien/  fenêtre du gestionnaire de deck
├─ assets/
│  ├─ heliarque/            icônes SVG
│  └─ cartomancien/         icônes SVG
├─ image/                   images du contenu Owidyn manuel
├─ packs/                   compendiums LevelDB ; _source/ = sources JSON lisibles (heliarque/, owidyn/)
├─ reference/               règles d'origine et documentation par classe
├─ tools/
│  ├─ heliarque/            génération du contenu Héliarque
│  ├─ owidyn/               add.mjs / remove.mjs : ajout et suppression de documents Owidyn hors de Foundry
│  └─ migrate-world.mjs     migration d'un monde qui utilisait les anciens modules
└─ tests/                   tests hors Foundry, par classe et pour les boutiques
```

Les données des personnages sont rangées sous `flags.compendium-owidyn.heliarque` et `flags.compendium-owidyn.cartomancien`. Console MJ : `game.modules.get('compendium-owidyn').api.heliarque` et `.api.cartomancien`.

## Développement

```sh
npm install                 # classic-level, pour lire et écrire les compendiums
npm test                    # tests Héliarque, Cartomancien et boutiques
npm run build:heliarque     # régénère le contenu Héliarque (Foundry fermé)
node tools/owidyn/add.mjs packs/_source/owidyn/items/<fichier>.json   # ajoute ou remplace ce document (Foundry fermé)
node tools/owidyn/add.mjs --pack bestiaire packs/_source/owidyn/bestiaire/<fichier>.json   # idem, dans le Bestiaire (--pack journaux : les Journaux)
node tools/owidyn/remove.mjs [--check] [--pack bestiaire] <id>...   # supprime ces documents et leurs sources (Foundry fermé)
```

### Publier une version

1. Fermez Foundry (les compendiums ne doivent pas être ouverts) et montez `version` dans `module.json`, par exemple `2.2.0` → `2.3.0`.
2. Envoyez les changements : `git add -A`, `git commit -m "…"`, `git push`.
3. Sur GitHub, **Releases → Draft a new release**, tag = la version (`2.3.0`), puis **Publish release**.

La GitHub Action [release.yml](.github/workflows/release.yml) écrit la version et l'adresse du zip dans `module.json`, construit `compendium-owidyn.zip` (sans les sources, outils et tests) et joint les deux fichiers à la Release : les installations existantes voient alors la mise à jour.

## Migrer un monde depuis les anciens modules

Fermez Foundry et sauvegardez le monde, puis :

```sh
npm run migrate-world -- <identifiant-du-monde>
```

L'outil convertit les flags, les liens de compendium et les chemins d'images des anciens modules dans tous les documents du monde. Il déplace les compendiums de monde du Cartomancien dans ce module, puis met à jour l'activation des modules et la configuration des compendiums. Le relancer ne change rien. Le monde **test** a déjà été migré.
