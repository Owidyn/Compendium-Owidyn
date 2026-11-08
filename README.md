# Compendium Owidyn 2.2.0

Contenu homebrew d'Owidyn pour **Foundry VTT 14** et **D&D5e 6.0.6**, en un seul module. Il regroupe depuis la 2.0.0 les anciens modules **Héliarque — Soothing Star** (`Heliarque`) et **Cartomancien — Deck de Tarot** (`cartomancien-deck`), avec toutes leurs automatisations.

## Compendiums

Les compendiums sont rangés comme le contenu de dnd5e, dans deux dossiers de l'onglet Compendiums : **Owidyn's Source Compendium 5.5** pour les règles **2024** (D&D 5.5e, *Modern Rules*) et tout le contenu propre à Owidyn, et **Owidyn's Source Compendium Legacy** pour les règles **2014** (D&D 5e, *Legacy Rules*). Chacun a un compendium par type de contenu ; Legacy n'a que ceux qui ont du contenu. Tout a pour source **Owidyn's Source Compendium (OSC)**, déclarée dans `module.json`, et ses règles (2024 ou 2014) : c'est ce qu'affichent les fiches et les filtres du Compendium Browser.

| Compendium | Type | Contenu |
| --- | --- | --- |
| **Classes** | Objets | Cartomancien, Héliarque, Monk › La Voie de l'Aiguille |
| **Items** | Objets | Objets magiques par catégorie, puis par rareté |
| **Species** | Objets | Primordian, Salamander ; Thri-kreen ; leurs aptitudes |
| **Creatures** | Acteurs | Créatures absentes de dnd5e ou corrigées, par type (*Aberration* › Flumph, Githyanki Warrior, Githzerai Monk, Grell, Grick, Grimlock, Intellect Devourer, Kuo-toa, Kuo-toa Monitor, Kuo-toa Whip, Piercer, Slaad Tadpole, Spectator, *Beast* › Ape, Baboon, Boar, Elk, Frog, Giant Badger, Giant Crab, Giant Fire Beetle, Giant Frog, Giant Octopus, Giant Rat, Giant Venomous Snake, Giant Wolf Spider, Goat, Lizard, Panther, Plesiosaurus, Pteranodon, Rat, Spider, Swarm of Insects, Swarm of Piranhas, Swarm of Rats, Swarm of Ravens, Swarm of Venomous Snakes, Vulture, Warhorse, Wolf, *Celestial* › Empyrean Iota, Giant Owl, *Construct* › Animated Armor, Animated Broom, Animated Rug of Smothering, Scarecrow et les Formes orbitales de l'Héliarque (Satellite, Bastion, Halo, Ancre gravitationnelle), *Dragon* › Blue Dragon Wyrmling, Brass Dragon Wyrmling, Bronze Dragon Wyrmling, Faerie Dragon Adult, Faerie Dragon Youth, Gold Dragon Wyrmling, Green Dragon Wyrmling, Pseudodragon, White Dragon Wyrmling, Winged Kobold, *Elemental* › Aarakocra Skirmisher, Azer Sentinel, Dust Mephit, Gargoyle, Ice Mephit, Lizardfolk Geomancer, Magma Mephit, Merfolk Skirmisher, Mud Mephit, Salamander Fire Snake, Smoke Mephit, Steam Mephit, Water Weird, *Fey* › Blink Dog, Bugbear Stalker, Centaur Trooper, Goblin Hexer, Goblin Minion, Goblin Warrior, Green Hag, Pixie, Satyr, Sea Hag, *Fiend* › Dretch, Gnoll Pack Lord, Gnoll Warrior, Jackalwere, Larva, Lemure, Manes, Manes Vaporspawn, Sahuagin Priest, Sahuagin Warrior, Spined Devil, Swarm of Larvae, Swarm of Lemures, *Giant* › Ogrillon Ogre, Troll Limb, *Humanoid* › Bandit Captain, Berserker, Cultist, Cultist Fanatic, Druid, Knight, Mage Apprentice, Performer, Pirate, Priest, Priest Acolyte, Scout Captain, Spy, Vampire Familiar, Warrior Veteran, *Monstrosity* › Ankheg, Axe Beak, Cockatrice, Displacer Beast, Flying Snake, Hook Horror, Kenku, Mimic, Peryton, Phase Spider, Quaggoth, Quaggoth Thonot, Stirge, Swarm of Stirges, Thri-kreen Marauder, Troglodyte, Yeti, Yuan-ti Infiltrator, Yuan-ti Malison (Type 1), Yuan-ti Malison (Type 2), Yuan-ti Malison (Type 3), *Ooze* › Gray Ooze, Psychic Gray Ooze, *Plant* › Awakened Shrub, Awakened Tree, Gas Spore Fungus, Myconid Adult, Myconid Sovereign, Myconid Spore Servant, Myconid Sprout, Needle Blight, Shrieker Fungus, Twig Blight, Vine Blight, Violet Fungus, *Undead* › Crawling Claw, Flaming Skeleton, Ghast, Ghoul, Lacedon Ghoul, Minotaur Skeleton, Mummy, Ogre Zombie, Poltergeist, Skeleton, Swarm of Crawling Claws, Warhorse Skeleton) ; masqué aux joueurs |
| **Creature Features** | Objets | Base d'aptitudes de créatures à glisser sur un profil, comme les Monster Features de dnd5e : chacune une seule fois, avec un texte qui nomme la créature qui la reçoit, rangée par type (*Traits*, *Actions*, *Legendary Actions*, *Attacks*). Seulement celles que les Monster Features de dnd5e n'ont pas ; masqué aux joueurs |
| **Backgrounds & Feats** | Objets | Historiques et dons |
| **Spells** | Objets | Sorts absents de dnd5e, par niveau |
| **Summons** | Acteurs | Créatures des sorts d'invocation (Bestial Spirit, Fey Spirit, Undead Spirit…), un dossier par sort ; visible des joueurs, pour qu'ils puissent les invoquer |
| **Journals** | Journaux | Listes de sorts, une classe par dossier : les sorts Owidyn de chaque classe (et des sous-classes et espèces qui en ont), que dnd5e fusionne avec ses listes, et la liste du Cartomancien |
| **Creatures (Legacy)** | Acteurs | *Undead* › Shadow ; masqué aux joueurs |
| **Creature Features (Legacy)** | Objets | Strength Drain, comme Creature Features face aux Monster Features (SRD) de dnd5e ; masqué aux joueurs |
| **Backgrounds & Feats (Legacy)** | Objets | Strike of the Giants et ses options |
| **Spells (Legacy)** | Objets | Thorn Whip (version 2014) |

Dans chaque compendium, le contenu est rangé par dossiers : une classe contient ses *Class Features* et le dossier de sa sous-classe (la sous-classe et ses *Subclass Features*), les objets une catégorie puis une rareté, les species leur type de créature.

```
Owidyn's Source Compendium 5.5
├─ Classes
│  ├─ Cartomancien               classe Le Cartomancien
│  │  ├─ Class Features
│  │  └─ Deck du Parieur         sous-classe
│  │     └─ Subclass Features
│  ├─ Héliarque                  classe Héliarque
│  │  ├─ Class Features
│  │  ├─ Techniques stellaires (sorts)
│  │  └─ Soothing Star           sous-classe
│  │     └─ Subclass Features
│  └─ Monk
│     └─ La Voie de l'Aiguille   sous-classe
│        └─ Subclass Features
├─ Items › Armor, Potions, Rings, Rods, Staffs, Wands, Weapons, Wondrous Items
│          └─ une rareté par dossier : Common … Artifact, Varies (rareté variable), Mundane (non magique)
├─ Species
│  ├─ Elemental › Primordian     Primordian, Salamander
│  ├─ Monstrosity › Thri-kreen   Thri-kreen
│  └─ Species Features › Primordian, Thri-kreen
├─ Creatures › Aberration … Undead (les Formes orbitales dans Construct)
├─ Creature Features › Traits, Actions, Attacks
├─ Backgrounds & Feats
│  ├─ Backgrounds
│  └─ Feats › General Feats, Origin Feats
├─ Spells › Cantrips, 1st Level … 9th Level
├─ Summons › un dossier par sort (Summon Beast, Summon Fey…)
└─ Journals
   └─ Spell Lists › Artificer, Bard, Cartomancien, Cleric, Druid, Paladin, Ranger, Sorcerer, Species, Warlock, Wizard

Owidyn's Source Compendium Legacy
├─ Creatures (Legacy) › Undead            Shadow
├─ Creature Features (Legacy) › Attacks   Strength Drain
├─ Backgrounds & Feats (Legacy) › Feats   Strike of the Giants et ses options
└─ Spells (Legacy) › Cantrips             Thorn Whip
```

Les dossiers sont colorés comme ceux de dnd5e : les niveaux de sorts en dégradé violet (de Cantrips à 9th Level, les dossiers de Summons de la couleur du niveau de leur sort), les types de créatures en bleu nuit, les raretés d'objets du gris (Common) au rouge (Artifact) en passant par le vert, le bleu, le violet et l'orange, et les listes de sorts de la couleur de leur classe.

Le contenu Owidyn « manuel » se modifie directement dans Foundry, ou dans ses sources. Les sources sont rangées comme celles de dnd5e : `packs/_source/<compendium>/` reprend les dossiers du compendium (un répertoire par dossier, décrit par son `_folder.json`) avec un fichier JSON par document, nommé d'après lui — par exemple `packs/_source/classes/monk/la-voie-de-laiguille/la-voie-de-laiguille.json` pour la sous-classe et `…/la-voie-de-laiguille/subclass-features/` pour ses aptitudes. `tools/owidyn/add.mjs` écrit des sources dans leur compendium, sans toucher aux autres documents ; après des modifications faites dans Foundry, `tools/owidyn/export.mjs` remet les sources à jour depuis les compendiums. Un contenu déjà présent à l'identique dans dnd5e n'est pas recopié : on utilise celui de dnd5e. Un contenu des règles 2014 va dans les compendiums Legacy (créés quand il en faut un), le reste dans ceux de 5.5.

Trois contenus sont générés, et une modification faite à la main y serait perdue : l'**Héliarque** (classe et Formes, écrites avec leurs sources par `npm run build:heliarque`), le **Cartomancien** (créé dans Foundry par ses scripts, sans fichiers sources) et **Creature Features** (reconstruit avec Creature Features (Legacy) depuis Creatures et Creatures (Legacy) par `tools/owidyn/creature-features.mjs` : une aptitude par nom, sans celles des Monster Features de dnd5e ni les armes de l'équipement ; relancez-le après avoir modifié une créature ; les Formes orbitales n'y figurent pas, leurs aptitudes ne marchent qu'avec les scripts de l'Héliarque). Vous pouvez déplacer les dossiers *Cartomancien* et *Héliarque* et les Formes : ils restent où vous les mettez.

## Générateurs de boutiques

Dans l'onglet **Tables**, le bouton **Boutiques** (MJ seulement) ouvre le générateur de six boutiques :

| Boutique | Catégories |
| --- | --- |
| **La Hutte Enchantée** | Objets magiques et parchemins de sorts, par rareté |
| **Équipement** | Matériel d'aventurier, outils, vêtements, vivres |
| **Forge** | Armes, armures, munitions, et leurs versions magiques |
| **Apothicaire** | Potions et fioles, herbes et ingrédients, poisons, kits, et potions magiques |
| **Écurie** | Montures, sellerie et fourrage, véhicules |
| **L'Auberge** | Chambres, repas, boissons, employés et messagers, sorts lancés sur demande |

- **Mettre à jour les tables** lit tous les compendiums d'objets et de créatures (sauf Creature Features et les Monster Features de dnd5e : des aptitudes, pas des marchandises), puis crée dans le dossier de tables *Boutiques* une table par catégorie de chaque boutique, plus une table principale qui tire la catégorie. Un objet présent dans plusieurs compendiums n'y figure qu'une fois : la version Owidyn, sinon dnd5e 2024, sinon dnd5e 2014, sinon celle d'un autre module ; un compendium masqué aux joueurs passe en dernier. Les objets que leur type ne décrit pas (le butin et les consommables propres à un module) sont classés d'après leur dossier de compendium : herbes, potions ou vivres ; les matières premières, gemmes et trésors ne sont pas vendus. Les sorts de dnd5e, des modules D&D officiels et d'Owidyn deviennent des parchemins de La Hutte Enchantée, de la rareté de leur niveau (Dungeon Master's Guide 2024). La mise à jour garde les poids modifiés dans les tables principales mais remplace le contenu des autres tables ; elle est à refaire après l'installation d'un module d'objets ou de sorts.
- **Générer** tire le nombre d'articles demandé, sans doublon, avec des objets magiques et des parchemins limités à la rareté maximale choisie (La Hutte Enchantée en exige une) ; L'Auberge propose toujours tous ses services. Le stock remplace la page du même nom du journal *Boutiques* : le nom de la boutique par défaut, ou celui indiqué (« Forge de Brandur ») pour garder une page par boutique de la campagne. La page liste les articles avec leur prix, puis la fiche de chacun, et un bouton **Régénérer le stock** (MJ seulement) tire un nouveau stock avec les mêmes réglages.
- Les prix sont ceux des objets, multipliés par le pourcentage choisi ; un objet magique sans prix prend celui de sa rareté (Dungeon Master's Guide 2024, moitié prix pour un consommable comme un parchemin). Les services de L'Auberge et leurs prix viennent du System Reference Document 5.2, avec un lien vers leurs règles. Les montures sont liées aux créatures de dnd5e ; la sellerie et les véhicules absents des compendiums sont des lignes de texte, au prix du Player's Handbook.
- Un parchemin tiré est créé par dnd5e à partir de son sort, comme objet du monde dans le dossier *Boutiques — Parchemins*, que les joueurs peuvent ouvrir ; ceux du stock précédent de la page sont supprimés quand il est régénéré.
- Pour présenter le stock, utilisez **Montrer aux joueurs** sur la page : ils glissent les objets achetés sur leur fiche.

Console MJ : `game.modules.get('compendium-owidyn').api.boutiques` — `openGenerator()`, `buildTables()`, `generateStock({ shop, name, count, maxRarity, percent })`, `regenerate(pageUuid)`.

## Installation

Dans Foundry : **Add-on Modules → Install Module**, collez cette adresse dans **Manifest URL**, puis **Install** :

```
https://github.com/Owidyn/Compendium-Owidyn/releases/latest/download/module.json
```

Foundry propose ensuite chaque nouvelle version (bouton **Update** de la liste des modules). Prérequis : Foundry VTT 14 et D&D5e 6.0.6. Le module n'utilise que ses propres images et celles de Foundry et de D&D5e.

1. Activez **Compendium Owidyn** dans le monde, puis rechargez. Les anciens modules `Heliarque` et `cartomancien-deck` ne doivent plus être installés.
2. Ouvrez le monde avec un compte MJ : les Orbitals de l'Héliarque sont créés et le contenu du Cartomancien est mis à jour si nécessaire.
3. Glissez la classe voulue depuis le compendium *Classes* sur la fiche du personnage.

Détails par classe : [Héliarque](reference/heliarque/README.md) · [Cartomancien](reference/cartomancien/README.md).

## Organisation des fichiers

```
compendium-owidyn/
├─ module.json
├─ scripts/
│  ├─ owidyn.mjs            point d'entrée : charge les deux classes et les aides communes
│  ├─ owidyn/               aides du contenu Owidyn : effets activables, effets à formule, Familiar Friend, Sceau de Confinement ;
│  │                        compendiums du module et mise à jour des mondes faits avec les anciens (compendiums.mjs, migration.mjs)
│  ├─ boutiques/            générateurs de boutiques : classement des objets (catalogue.mjs), tables et stocks
│  ├─ heliarque/            automatisations de l'Héliarque
│  └─ cartomancien/         deck, gestionnaire et automatisations du Cartomancien
├─ styles/                  heliarque.css, cartomancien.css
├─ templates/cartomancien/  fenêtre du gestionnaire de deck
├─ assets/
│  ├─ heliarque/            icônes SVG
│  └─ cartomancien/         icônes SVG
├─ image/                   images du contenu Owidyn manuel
├─ packs/                   compendiums LevelDB ; _source/<compendium>/ = leurs sources JSON, rangées comme celles de dnd5e
├─ reference/               règles d'origine et documentation par classe
├─ tools/
│  ├─ heliarque/            génération du contenu Héliarque
│  ├─ owidyn/               add.mjs / remove.mjs / export.mjs : ajout, suppression et export des documents Owidyn hors de Foundry ;
│  │                        creature-features.mjs : construction de Creature Features (et Legacy)
│  └─ migrate-world.mjs     migration d'un monde fait avec une ancienne version ou les anciens modules
└─ tests/                   tests hors Foundry, par classe, pour les boutiques et la migration des compendiums
```

Les données des personnages sont rangées sous `flags.compendium-owidyn.heliarque` et `flags.compendium-owidyn.cartomancien`. Console MJ : `game.modules.get('compendium-owidyn').api.heliarque` et `.api.cartomancien`.

## Développement

```sh
npm install                 # classic-level, pour lire et écrire les compendiums
npm test                    # tests Héliarque, Cartomancien, boutiques et migration des compendiums
npm run build:heliarque     # régénère le contenu Héliarque (Foundry fermé)
node tools/owidyn/add.mjs packs/_source/<compendium>/<chemin>.json   # ajoute ou remplace ce document, ou tout un répertoire, dans son compendium (Foundry fermé)
node tools/owidyn/remove.mjs [--check] <id>...                       # supprime ces documents et leurs sources, quel que soit leur compendium (Foundry fermé)
node tools/owidyn/export.mjs [--check] [--pack <compendium>]         # réécrit les sources depuis les compendiums, après des modifications dans Foundry (Foundry fermé)
node tools/owidyn/creature-features.mjs [--check]                    # reconstruit Creature Features (et Legacy) depuis les créatures (Foundry fermé)
```

### Publier une version

1. Fermez Foundry (les compendiums ne doivent pas être ouverts) et montez `version` dans `module.json`, par exemple `2.3.0` → `2.4.0`.
2. Envoyez les changements : `git add -A`, `git commit -m "…"`, `git push`.
3. Sur GitHub, **Releases → Draft a new release**, tag = la version (`2.4.0`), puis **Publish release**.

La GitHub Action [release.yml](.github/workflows/release.yml) écrit la version et l'adresse du zip dans `module.json`, construit `compendium-owidyn.zip` (sans les sources, outils et tests) et joint les deux fichiers à la Release : les installations existantes voient alors la mise à jour.

## Mettre à jour un monde

Jusqu'à la 2.3, le contenu était dans quatre compendiums (Compendium Owidyn, Héliarque — Formes orbitales, Owidyn — Journaux, Owidyn — Bestiaire). Au premier chargement d'un monde par le MJ, le module fait pointer les liens vers ces anciens compendiums sur les nouveaux, et ceux des documents passés depuis dans les compendiums Legacy, dans les acteurs, objets, journaux, scènes, tables, macros et cartes du monde : les personnages gardent leurs avancements et leurs Formes. Le dossier de compendiums « Owidyn's Source Compendium » devient « Owidyn's Source Compendium 5.5 » (Foundry laisse un compendium dans le dossier où il a été rangé), et le dossier « Owidyn » de la 2.3, vide, est supprimé.

Pour un monde qui utilisait les anciens modules `Heliarque` et `cartomancien-deck`, ou pour mettre aussi à jour les messages du chat et la configuration des compendiums, fermez Foundry et sauvegardez le monde, puis :

```sh
npm run migrate-world -- <identifiant-du-monde>
```

L'outil fait pointer les liens des anciens compendiums sur les nouveaux, range les dossiers de compendiums comme ci-dessus, et convertit les flags, les liens de compendium et les chemins d'images des anciens modules, dans tous les documents du monde. Il déplace les compendiums de monde du Cartomancien dans ce module, puis met à jour l'activation des modules et la configuration des compendiums (les nouveaux reprennent les droits et le verrouillage des anciens). Le relancer ne change rien. Le monde **test** a déjà été migré.
