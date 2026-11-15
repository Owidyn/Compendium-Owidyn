# Compendium Owidyn 2.5.0

Contenu homebrew d'Owidyn pour **Foundry VTT 14** et **D&D5e 6.0.6** : les classes **Cartomancien** et **Héliarque** avec leurs automatisations, des sous-classes, espèces, historiques, dons, sorts, objets et créatures, la **cuisine d'Aldraine** et des **boutiques** où les joueurs achètent eux-mêmes.

Depuis la 2.0.0, ce module remplace les anciens modules **Héliarque — Soothing Star** (`Heliarque`) et **Cartomancien — Deck de Tarot** (`cartomancien-deck`), avec toutes leurs automatisations.

[Installation](#installation) · [Compendiums](#compendiums) · [Bestiaire](#bestiaire) · [Cuisine d'Aldraine](#cuisine-daldraine) · [Boutiques](#boutiques) · [Mettre à jour un monde](#mettre-à-jour-un-monde) · [Développement](#développement)

## Installation

Dans Foundry : **Add-on Modules › Install Module**, collez cette adresse dans **Manifest URL**, puis **Install** :

```
https://github.com/Owidyn/Compendium-Owidyn/releases/latest/download/module.json
```

1. Activez **Compendium Owidyn** dans le monde, puis rechargez. Les anciens modules `Heliarque` et `cartomancien-deck` ne doivent plus être installés.
2. Ouvrez le monde avec un compte MJ : les Orbitals de l'Héliarque sont créés, le contenu du Cartomancien est mis à jour si nécessaire et chaque Cartomancien reçoit l'aptitude **Tarots**, qui ouvre son deck.
3. Glissez la classe voulue du compendium **Classes** sur la fiche du personnage.

Foundry propose ensuite chaque nouvelle version (bouton **Update** de la liste des modules). Le module n'utilise que ses propres images et celles de Foundry et de D&D5e.

Détails par classe : [Héliarque](reference/heliarque/README.md) · [Cartomancien](reference/cartomancien/README.md).

## Compendiums

Les compendiums sont rangés comme ceux de dnd5e, un par type de contenu, dans deux dossiers de l'onglet Compendiums :

- **Owidyn's Source Compendium 5.5** : les règles **2024** (D&D 5.5e, *Modern Rules*) et tout le contenu propre à Owidyn ;
- **Owidyn's Source Compendium Legacy** : les règles **2014** (D&D 5e, *Legacy Rules*), avec seulement les compendiums qui ont du contenu.

Tout le contenu a pour source **Owidyn's Source Compendium (OSC)**, déclarée dans `module.json`, avec ses règles (2024 ou 2014) : c'est ce qu'affichent les fiches et les filtres du Compendium Browser.

Un contenu que dnd5e a déjà à l'identique n'est pas recopié : on utilise celui de dnd5e. Un contenu qui en diffère, même par sa description, est une copie corrigée (par exemple la Chain, l'Herbalism Kit et les Bagpipes, dont le poids est faux dans dnd5e).

### Owidyn's Source Compendium 5.5

| Compendium | Type | Contenu |
| --- | --- | --- |
| **Classes** | Objets | Cartomancien › Deck du Parieur ; Héliarque › Soothing Star ; Monk › La Voie de l'Aiguille |
| **Items** | Objets | Objets magiques et équipement absents de dnd5e ou corrigés, par catégorie puis par rareté ; ingrédients, recettes et livres de cuisine dans *Cuisine* |
| **Species** | Objets | *Kitsune, Air*, *Primordian, Salamander* et *Thri-kreen*, avec leurs aptitudes |
| **Creatures** | Acteurs | Créatures absentes de dnd5e ou corrigées, par type (voir le [Bestiaire](#bestiaire)), dont les Formes orbitales de l'Héliarque et des véhicules |
| **Creature Features** | Objets | Aptitudes de créatures à glisser sur un profil, comme les Monster Features de dnd5e, mais seulement celles qu'elles n'ont pas : chacune une seule fois, avec un texte qui nomme la créature qui la reçoit |
| **Backgrounds & Feats** | Objets | Historiques (Guide, Scribe, Sujet de Confinement Runique), dons d'origine et dons généraux, dont Cuisinier et Master Chef |
| **Spells** | Objets | Sorts absents de dnd5e, par niveau |
| **Summons** | Acteurs | Créatures des sorts d'invocation (Bestial Spirit, Fey Spirit, Undead Spirit…), un dossier par sort |
| **Journals** | Journaux | Listes de sorts, une classe par dossier : les sorts Owidyn de chaque classe (et des sous-classes et espèces qui en ont), que dnd5e fusionne avec ses listes, et la liste du Cartomancien |

### Owidyn's Source Compendium Legacy

| Compendium | Type | Contenu |
| --- | --- | --- |
| **Classes (Legacy)** | Objets | Paladin › Oath of the Ancients ; Rogue › Revived (Unearthed Arcana) |
| **Creatures (Legacy)** | Acteurs | *Beast* › Fox (la forme de renard des Kitsune) ; *Undead* › Shadow |
| **Creature Features (Legacy)** | Objets | Keen Hearing et Strength Drain, absents des Monster Features (SRD) de dnd5e |
| **Backgrounds & Feats (Legacy)** | Objets | Strike of the Giants et ses options |
| **Spells (Legacy)** | Objets | Thorn Whip, Ensnaring Strike (versions 2014) |

### Visibilité pour les joueurs

Tous les compendiums sont masqués aux joueurs : ils ne les voient ni dans l'onglet Compendiums ni dans le Compendium Browser, et n'ouvrent pas leurs fiches depuis un lien.

Ce que le jeu leur donne fonctionne quand même : avancements de classe et de sous-classe, invocations, sorts lancés par une aptitude ou un objet, Cartomancien, Formes de l'Héliarque et boutiques (la fenêtre de la boutique montre la fiche de chaque article, et l'achat le pose sur la fiche du personnage).

Le MJ peut rendre un compendium visible dans un monde : clic droit sur le compendium › *Configurer les droits*. Ce réglage prime sur celui du module.

### Rangement

Dans chaque compendium, le contenu est rangé en dossiers, comme dans dnd5e : une classe contient ses *Class Features* et le dossier de sa sous-classe (la sous-classe et ses *Subclass Features*), les objets une catégorie puis une rareté, les species leur type de créature.

```
Owidyn's Source Compendium 5.5
├─ Classes
│  ├─ Cartomancien                 classe Le Cartomancien
│  │  ├─ Class Features
│  │  └─ Deck du Parieur           sous-classe
│  │     └─ Subclass Features
│  ├─ Héliarque                    classe Héliarque
│  │  ├─ Class Features
│  │  ├─ Techniques stellaires (sorts)
│  │  └─ Soothing Star             sous-classe
│  │     └─ Subclass Features
│  └─ Monk
│     └─ La Voie de l'Aiguille     sous-classe
│        └─ Subclass Features
├─ Items
│  ├─ Armor, Potions, Rings, Rods, Staffs, Wands, Weapons, Wondrous Items,
│  │  Adventuring Gear, Explosives, Tools, Mounts and Vehicles
│  │  └─ une rareté par dossier : Common … Artifact, Varies (rareté variable), Mundane (non magique)
│  └─ Cuisine › Ingrédients (par famille), Recettes (par origine), Plats spéciaux, Livres de recettes
├─ Species
│  ├─ Elemental › Primordian       Primordian, Salamander
│  ├─ Humanoid › Kitsune           Kitsune, Air
│  ├─ Monstrosity › Thri-kreen     Thri-kreen
│  └─ Species Features › Kitsune (aptitudes, queues, cantrips Éclat), Primordian, Thri-kreen
├─ Creatures › Aberration … Undead, Vehicles   (les Formes orbitales dans Construct)
├─ Creature Features › Traits, Actions, Attacks
├─ Backgrounds & Feats
│  ├─ Backgrounds
│  └─ Feats › General Feats, Origin Feats
├─ Spells › Cantrips, 1st Level … 9th Level
├─ Summons › un dossier par sort (Summon Beast, Summon Fey…)
└─ Journals
   └─ Spell Lists › Artificer, Bard, Cartomancien, Cleric, Druid, Paladin, Ranger, Sorcerer, Species, Warlock, Wizard

Owidyn's Source Compendium Legacy
├─ Classes (Legacy)
│  ├─ Paladin
│  │  └─ Oath of the Ancients              sous-classe
│  │     └─ Subclass Features
│  └─ Rogue
│     └─ Revived                           sous-classe (Unearthed Arcana)
│        └─ Subclass Features
├─ Creatures (Legacy) › Beast, Undead       Fox, Shadow
├─ Creature Features (Legacy) › Traits, Attacks   Keen Hearing, Strength Drain
├─ Backgrounds & Feats (Legacy) › Feats     Strike of the Giants et ses options
└─ Spells (Legacy) › Cantrips, 1st Level    Thorn Whip, Ensnaring Strike
```

Les dossiers sont colorés comme ceux de dnd5e :

- les niveaux de sorts en dégradé violet, de Cantrips à 9th Level, et les dossiers de Summons de la couleur du niveau de leur sort ;
- les types de créatures en bleu nuit ;
- les raretés d'objets du gris (Common) au rouge (Artifact), en passant par le vert, le bleu, le violet et l'orange ;
- les listes de sorts de la couleur de leur classe.

## Bestiaire

Le compendium **Creatures** contient les créatures absentes de dnd5e ou corrigées, rangées par type :

| Type | Créatures |
| --- | --- |
| *Aberration* | Aboleth, Blue Slaad, Chuul, Cloaker, Death Slaad, Flumph, Githyanki Dracomancer, Githyanki Knight, Githyanki Warrior, Githzerai Monk, Githzerai Psion, Githzerai Zerth, Gray Slaad, Green Slaad, Grell, Grick, Grick Ancient, Grimlock, Intellect Devourer, Kuo-toa, Kuo-toa Archpriest, Kuo-toa Monitor, Kuo-toa Whip, Mind Flayer, Mind Flayer Arcanist, Otyugh, Piercer, Red Slaad, Slaad Tadpole, Spectator |
| *Beast* | Ape, Archelon, Baboon, Boar, Elk, Frog, Giant Ape, Giant Badger, Giant Crab, Giant Crocodile, Giant Fire Beetle, Giant Frog, Giant Octopus, Giant Rat, Giant Shark, Giant Squid, Giant Venomous Snake, Giant Wolf Spider, Goat, Lizard, Mammoth, Panther, Plesiosaurus, Pteranodon, Rat, Spider, Swarm of Insects, Swarm of Piranhas, Swarm of Rats, Swarm of Ravens, Swarm of Venomous Snakes, Triceratops, Tyrannosaurus Rex, Vulture, Warhorse, Wolf |
| *Celestial* | Couatl, Deva, Empyrean, Empyrean Iota, Giant Owl, Guardian Naga, Planetar, Solar, Sphinx of Secrets, Unicorn |
| *Construct* | Animated Armor, Animated Broom, Animated Rug of Smothering, Brazen Gorgon, Clay Golem, Colossus, Flesh Golem, Gorgon, Helmed Horror, Iron Golem, Scarecrow, Shield Guardian, Stone Golem ; les Formes orbitales de l'Héliarque (Satellite, Bastion, Halo, Ancre gravitationnelle) |
| *Dragon* | Adult Black Dragon, Adult Blue Dragon, Adult Brass Dragon, Adult Bronze Dragon, Adult Copper Dragon, Adult Gold Dragon, Adult Green Dragon, Adult Red Dragon, Adult Silver Dragon, Adult White Dragon, Ancient Black Dragon, Ancient Blue Dragon, Ancient Brass Dragon, Ancient Bronze Dragon, Ancient Copper Dragon, Ancient Gold Dragon, Ancient Green Dragon, Ancient White Dragon, Blue Dragon Wyrmling, Brass Dragon Wyrmling, Bronze Dragon Wyrmling, Dragon Turtle, Faerie Dragon Adult, Faerie Dragon Youth, Gold Dragon Wyrmling, Green Dragon Wyrmling, Half-Dragon, Juvenile Shadow Dragon, Pseudodragon, Shadow Dragon, White Dragon Wyrmling, Winged Kobold, Young Blue Dragon, Young Brass Dragon, Young Bronze Dragon, Young Red Dragon, Young Silver Dragon |
| *Elemental* | Aarakocra Aeromancer, Aarakocra Skirmisher, Air Elemental, Azer Pyromancer, Azer Sentinel, Dao, Djinni, Dust Mephit, Fire Elemental, Galeb Duhr, Gargoyle, Ice Mephit, Lizardfolk Geomancer, Lizardfolk Sovereign, Magma Mephit, Marid, Merfolk Skirmisher, Merfolk Wavebender, Mud Mephit, Salamander, Salamander Fire Snake, Salamander Inferno Master, Smoke Mephit, Steam Mephit, Water Weird |
| *Fey* | Arch-hag, Blink Dog, Bugbear Stalker, Centaur Trooper, Centaur Warden, Dire Worg, Goblin Hexer, Goblin Minion, Goblin Warrior, Green Hag, Hobgoblin Warlord, Pixie, Pixie Wonderbringer, Satyr, Satyr Revelmaster, Sea Hag |
| *Fiend* | Arcanaloth, Balor, Barbed Devil, Barlgura, Bearded Devil, Bone Devil, Cambion, Chain Devil, Chasme, Dretch, Gnoll Demoniac, Gnoll Fang of Yeenoghu, Gnoll Pack Lord, Gnoll Warrior, Goristro, Horned Devil, Imp, Jackalwere, Larva, Lemure, Manes, Manes Vaporspawn, Mezzoloth, Nycaloth, Pit Fiend, Rakshasa, Sahuagin Baron, Sahuagin Priest, Sahuagin Warrior, Shadow Demon, Spined Devil, Spirit Naga, Succubus, Swarm of Dretches, Swarm of Larvae, Swarm of Lemures, Ultroloth, Yochlol |
| *Giant* | Cyclops Oracle, Cyclops Sentry, Ettin, Fomorian, Frost Giant, Ogrillon Ogre, Troll Limb |
| *Humanoid* | Aberrant Cultist, Archmage, Archpriest, Assassin, Bandit Captain, Bandit Crime Lord, Bandit Deceiver, Berserker, Berserker Commander, Cultist, Cultist Fanatic, Cultist Hierophant, Death Cultist, Druid, Elemental Cultist, Fiend Cultist, Knight, Mage Apprentice, Noble Prodigy, Performer, Performer Legend, Performer Maestro, Pirate, Pirate Admiral, Pirate Captain, Priest, Priest Acolyte, Questing Knight, Scout Captain, Spy, Spy Master, Tough Boss, Vampire Familiar, Warrior Commander, Warrior Veteran |
| *Monstrosity* | Abominable Yeti, Ankheg, Axe Beak, Behir, Bulette, Cockatrice, Cockatrice Regent, Displacer Beast, Flying Snake, Giant Axe Beak, Hook Horror, Kenku, Kraken, Mimic, Peryton, Phase Spider, Purple Worm, Quaggoth, Quaggoth Thonot, Remorhaz, Stirge, Swarm of Stirges, Tarrasque, Thri-kreen Marauder, Thri-kreen Psion, Troglodyte, Umber Hulk, Werebear, Wereboar, Weretiger, Yeti, Young Remorhaz, Yuan-ti Abomination, Yuan-ti Infiltrator, Yuan-ti Malison (Type 1), Yuan-ti Malison (Type 2), Yuan-ti Malison (Type 3) |
| *Ooze* | Black Pudding, Gray Ooze, Psychic Gray Ooze |
| *Plant* | Awakened Shrub, Awakened Tree, Gas Spore Fungus, Gulthias Blight, Myconid Adult, Myconid Sovereign, Myconid Spore Servant, Myconid Sprout, Needle Blight, Shambling Mound, Shrieker Fungus, Tree Blight, Twig Blight, Vine Blight, Violet Fungus, Violet Fungus Necrohulk |
| *Undead* | Banshee, Beholder Zombie, Bone Naga, Crawling Claw, Death Knight, Death Knight Aspirant, Death Tyrant, Demilich, Dracolich, Flameskull, Flaming Skeleton, Ghast, Ghast Gravecaller, Ghost, Ghoul, Graveyard Revenant, Haunting Revenant, Lacedon Ghoul, Lich, Minotaur Skeleton, Mummy, Mummy Lord, Ogre Zombie, Poltergeist, Revenant, Skeleton, Swarm of Crawling Claws, Vampire Nightbringer, Vampire Umbral Lord, Warhorse Skeleton |
| *Vehicles* | Lyrandar Air Cruiser, Lyrandar Skyskiff, Strider Airship (Eberron) ; Flying Machine, Goblin Trike, Mechano-Hog, Mekgineer's Chopper (World of Warcraft) |

La Shadow des règles 2014 est dans **Creatures (Legacy)**.

## Cuisine d'Aldraine

Les dons **Cuisinier** (Origin Feat) et **Master Chef** (General Feat, niveau 4+) donnent accès à la cuisine. Leur activité **Cuisiner**, ou le bouton *Cuisiner* de l'en-tête de la fiche, ouvre la fenêtre de cuisine.

### La fenêtre « Cuisiner »

- **Recettes connues** : le carnet du personnage. À la première ouverture, le Cuisinier y choisit trois recettes de base (libres ou strictes). Cliquer une recette remplit la marmite avec les ingrédients de l'inventaire, ou indique ce qui manque.
- **Ingrédients** : ceux de l'inventaire, sur une ou deux colonnes, groupés ou non par famille. Chacun a :
  - une famille : Viande, Poisson, Légume, Céréale, Fruit, Champignon, Herbe, Laitage, Boisson ;
  - un tag : Robuste, Fort, Puissant, Ardent, Givré, Véloce, Apaisant, Vif, Furtif, Éclatant, Revigorant, Arcanique ;
  - une rareté, qui fait la puissance du plat.

  Un clic en met un dans la marmite.
- **Marmite** (1 à 5 ingrédients) : la fenêtre affiche la recette et son effet si elle est connue, sinon « Inconnue ». Une viande ou un poisson seul donne une *Grillade de survie*, une combinaison inconnue un plat improvisé, et deux tags opposés un plat douteux.

### Le test de cuisine

**Cuisiner** lance un test de Cook's Utensils (Wisdom) contre le DD de la recette, avec :

- +1 pour une recette maîtrisée, c'est-à-dire réussie cinq fois (la fenêtre affiche « maîtrise 3/5 ») ;
- le bonus des meilleurs ustensiles du cuisinier (+1 pour les *Ustensiles de cuisinier de maître*) ;
- l'Advantage pour un Master Chef.

| Résultat | Plat |
| --- | --- |
| **Délicieux !** — 20 naturel ou DD dépassé de 10 | Comme une réussite, avec +1 en puissance (+1 portion pour une grillade de survie, un repas simple ou un plat douteux) |
| **Réussi** | Le plat de la recette ; une recette inconnue s'inscrit au carnet |
| **Raté de peu** — échec de 1 à 4 | Le plat garde un défaut de goût (trop ou pas assez salé, sucré, épicé, amer, acide ou cuit), qui cache un malus |
| **Raté** — échec de 5 ou plus | Deux défauts, et le plat perd son effet |

### Puissance et portions

Le plat a autant de portions que le bonus de maîtrise du cuisinier, plus 2 pour un Master Chef.

Le premier point de puissance fait l'effet du plat. Chaque autre point lui donne, au choix du cuisinier, un dé de plus ou une portion de plus, sans dépasser autant de dés que le bonus de maîtrise du cuisinier. La fenêtre demande la répartition après le test, et le plat cuisiné affiche ses dés.

> Au niveau 1, un plat à « puissance × d6 PV temporaires » de puissance 4 donne 2d6 PV temporaires et 2 portions de plus, ou 1d6 et 3 portions de plus.

Un plat sans dés (Advantage, nage…) change ses autres points en portions, et un plat raté de 5 ou plus n'en gagne pas. Selon le plat, les dés sont :

- des PV temporaires, lancés au repas ;
- un bonus d'Initiative ;
- une réserve d'Élans : un dé ajouté aux dégâts d'une attaque qui touche, une fois par tour ;
- pour un plat revigorant, des PV récupérés à la fin du prochain Short Rest.

### Manger un plat

**Manger** une portion applique son effet jusqu'au prochain Long Rest, en remplaçant le repas précédent. Le Master Chef peut aussi préparer un plat en **en-cas** : il se mange en Bonus Action et dure 1 heure, en plus du repas.

Le nom d'un plat raté montre ses défauts, « Poulet rôti à l'ail (trop salé) », mais pas leur malus. Qui le mange fait un jet de sauvegarde de Constitution contre le DD du plat :

| Jet de Constitution | Plat à un défaut | Plat à deux défauts |
| --- | --- | --- |
| Raté | Le malus, sans l'effet du plat | Les deux malus |
| Réussi | L'effet du plat, et le malus | Un seul malus |
| Réussi de 5 ou plus, ou 20 naturel | L'effet du plat, sans malus | Aucun malus |

Les malus se révèlent au repas et durent jusqu'au prochain Short Rest ; leur table d12 est dans l'objet *Défauts de goût*, pour le MJ. Le Master Chef tire deux fois chaque défaut de ses plats ratés et choisit.

Un plat raté avec un ingrédient dangereux impose aussi un jet de Constitution contre le poison, avec l'Advantage du *Palais* du Cuisinier.

### Le contenu

Tout est dans *Items › Cuisine* :

- les **Ingrédients**, par famille : ceux du marché (ail, oignon, noix, épices, riz, œufs, baies sauvages, champignon brun…) et les spécialités des pays d'Aldraine ;
- les **Recettes**, libres (familles et tags) ou strictes (ingrédients nommés), rangées par origine : *Recettes de base*, *Cuisine du quotidien* (poêlée terre-mer, soupe à l'oignon, pain perdu…), *Grande cuisine*, *Asharia*, *Euriven*, *Peuples d'Aldraine*, *Terres lointaines* et *Bestiaire* ;
- les **Plats spéciaux** (grillade de survie, repas simple, plat douteux) et la table des *Défauts de goût* ;
- les **Livres de recettes** : vingt petits livres de deux à quatre recettes (*Carnet du voyageur*, *La Cuisine de grand-mère*, *La Table du Roi*, *Cuisine des Brisants*…). Étudier un livre apprend ses recettes à un cuisinier ; quelques recettes ne se trouvent qu'en expérimentant ;
- les **Ustensiles de cuisinier de maître** (50 gp).

Chaque recette est le plat qu'on copie à la cuisson : son effet et sa description se modifient dans Foundry.

Les boutiques vendent les ingrédients : les vivres à l'Équipement, les herbes aussi à l'Apothicaire, et les Baies de Sunilda seulement à La Hutte Enchantée.

## Boutiques

L'onglet **Boutiques** de la barre latérale (icône de boutique, juste après le Journal) liste les boutiques de la campagne. Le MJ les voit toutes ; les joueurs, seulement celles qui leur sont montrées.

### Créer une boutique

Le bouton **Créer une boutique** (MJ seulement), en haut de l'onglet, ouvre le formulaire :

- **Modèle** : l'une des six boutiques ci-dessous. Il donne l'icône et le nom par défaut, et pré-coche les articles autorisés ; changer de modèle garde le reste du formulaire.
- **Nom** (« Forge de Brandur » ; celui du modèle s'il est vide) et **Description**, que les joueurs lisent en ouvrant la boutique.
- **Nombre d'articles** : tirés au hasard, sans doublon. Les services cochés sont tous proposés, en plus.
- **Valeur** : les prix à 50 %, 100 % ou 150 %.
- **Articles autorisés** : la liste complète, comme le choix des maîtrises de dnd5e. Cocher un groupe coche tous ses articles, qu'on peut ensuite décocher un par un ; un groupe en partie coché affiche un tiret.
- **Compendiums** : ceux où chercher les articles, tous cochés par défaut (boutons **Tous** et **Aucun**).

| Groupe | Articles |
| --- | --- |
| **Armes** | Armes courantes de corps à corps, armes courantes à distance, armes de guerre de corps à corps, armes de guerre à distance, munitions |
| **Armures** | Légères, intermédiaires, lourdes, boucliers |
| **Équipement d'aventurier** | Matériel, contenants, vêtements, vivres |
| **Outils** | Outils d'artisan, jeux, instruments de musique, autres outils |
| **Apothicaire** | Potions et fioles, herbes et ingrédients, poisons, kits et fournitures |
| **Objets magiques** | Objets merveilleux, anneaux, sceptres, baguettes, parchemins de sort, ingrédients enchantés |
| **Écurie** | Montures, sellerie et fourrage, véhicules |
| **Services** | Chambres, repas, boissons, employés et messagers, sorts lancés sur demande |
| **Rareté des objets** | Non magique, Commun, Peu commun, Rare, Très rare, Légendaire |

Un objet magique est rangé dans sa sorte : une épée +1 avec les armes de guerre de corps à corps, une potion de soins avec les potions. La rareté trie les objets et les parchemins tirés des compendiums (« Non magique » garde les objets ordinaires) ; elle ne touche pas l'Écurie ni les services.

| Modèle | Articles pré-cochés | Raretés pré-cochées |
| --- | --- | --- |
| **La Hutte Enchantée** | Armes, armures, objets magiques, potions, poisons | Commun à Rare |
| **Équipement** | Équipement d'aventurier, outils | Non magique |
| **Forge** | Armes, armures | Non magique à Rare |
| **Apothicaire** | Apothicaire | Non magique à Rare |
| **Écurie** | Écurie | — |
| **L'Auberge** | Services | — |

Le tirage favorise les objets ordinaires, puis les plus courants des objets magiques. Un objet magique, un parchemin ou une monture est en vente à un exemplaire, un autre objet à 1 à 5 exemplaires, un service sans limite.

### La fenêtre de la boutique

Cliquer sur une boutique de l'onglet ouvre sa fenêtre : une ligne par article ou service, avec le nombre disponible, le prix et un bouton **Acheter**. Le nom d'un article ouvre sa fiche, en lecture seule pour les joueurs.

Le MJ y modifie la boutique :

- il change le nombre disponible (vide : illimité), le prix et sa monnaie, et le nom d'un service ;
- il retire une ligne (corbeille) ou en ajoute : **Ajouter un service**, ou un objet, un sort (vendu en parchemin) ou une créature glissé dans la fenêtre ;
- **Nouveau stock** tire un autre stock avec les mêmes réglages, **Modifier** change le nom et la description ;
- **Montrer aux joueurs** / **Cacher** rend la boutique visible ou non, comme l'œil de l'onglet. La corbeille de l'onglet la supprime.

### Acheter

Le joueur choisit son personnage dans **Acheteur**, puis clique sur **Acheter** :

- le prix est payé avec la bourse du personnage, convertie si besoin : une pièce plus grosse est cassée et la monnaie rendue en pièces plus petites (jamais en électrum) ;
- un objet arrive sur la fiche, ajouté à la pile qu'il y a déjà pour un consommable ou un butin ; un parchemin est créé par dnd5e à partir de son sort ; une monture rejoint les acteurs du monde, dans le dossier *Boutiques — Montures*, et appartient au joueur ;
- l'achat est annoncé dans le chat (« Lyra achète Longsword pour 15 po »), un service aussi (« … paie … ») ;
- le nombre disponible baisse ; un article épuisé reste grisé jusqu'au prochain stock.

Sans assez d'argent, un message le dit au joueur, avec ce que contient sa bourse, et rien n'est payé. Les achats sont faits par le MJ connecté, un par un : deux joueurs ne peuvent pas acheter le même dernier exemplaire.

### Où les boutiques trouvent leurs articles

Les compendiums sont lus à chaque création ou nouveau stock : un module d'objets ou de sorts installé entre-temps est pris en compte.

- Ils sont tous lus, sauf Creature Features et les Monster Features de dnd5e : ce sont des aptitudes, pas des marchandises.
- Un objet présent dans plusieurs compendiums n'est proposé qu'une fois, dans cet ordre de préférence : Owidyn, dnd5e 2024, Owidyn Legacy, dnd5e 2014, un autre module, et en dernier le compendium d'un autre module masqué aux joueurs. Les compendiums d'Owidyn sont tous masqués, mais gardent leur rang : la boutique montre quand même la fiche de leurs articles.
- Les objets que leur type ne décrit pas (le butin et les consommables propres à un module) sont classés d'après leur dossier de compendium : herbes, potions ou vivres. Les matières premières, gemmes et trésors ne sont pas vendus.
- Les sorts de dnd5e, des modules D&D officiels et d'Owidyn deviennent des parchemins de sort, de la rareté de leur niveau (Dungeon Master's Guide 2024).
- Les ingrédients enchantés (les Baies de Sunilda) ne sont pré-cochés qu'à La Hutte Enchantée, la seule boutique qui les vend dans le lore.

### Prix

- Les prix sont ceux des objets, multipliés par la valeur choisie. Un objet magique sans prix prend celui de sa rareté (Dungeon Master's Guide 2024), moitié prix pour un consommable comme un parchemin.
- Les services de L'Auberge et leurs prix viennent du System Reference Document 5.2, avec un lien vers leurs règles.
- Les montures sont liées aux créatures de dnd5e ; la sellerie et les véhicules absents des compendiums sont vendus comme des services, au prix du Player's Handbook.

## Mettre à jour un monde

### Depuis une version 2.3 ou plus ancienne

Jusqu'à la 2.3, le contenu était dans quatre compendiums (Compendium Owidyn, Héliarque — Formes orbitales, Owidyn — Journaux, Owidyn — Bestiaire). Au premier chargement d'un monde par le MJ, le module :

- fait pointer les liens vers ces anciens compendiums sur les nouveaux, et ceux des documents passés depuis dans les compendiums Legacy, dans les acteurs, objets, journaux, scènes, tables, macros et cartes du monde : les personnages gardent leurs avancements et leurs Formes ;
- renomme le dossier de compendiums « Owidyn's Source Compendium » en « Owidyn's Source Compendium 5.5 » (Foundry laisse un compendium dans le dossier où il a été rangé) ;
- supprime le dossier « Owidyn » de la 2.3, devenu vide.

### Depuis les anciens modules

Pour un monde qui utilisait les anciens modules `Heliarque` et `cartomancien-deck`, ou pour mettre aussi à jour les messages du chat et la configuration des compendiums, fermez Foundry et sauvegardez le monde, puis :

```sh
npm run migrate-world -- <identifiant-du-monde>
```

L'outil, dans tous les documents du monde :

- fait pointer les liens des anciens compendiums sur les nouveaux et range les dossiers de compendiums comme ci-dessus ;
- convertit les flags, les liens de compendium et les chemins d'images des anciens modules ;
- déplace les compendiums de monde du Cartomancien dans ce module ;
- met à jour l'activation des modules et la configuration des compendiums (les nouveaux reprennent les droits et le verrouillage des anciens).

Le relancer ne change rien. Le monde **test** a déjà été migré.

## Développement

### Organisation des fichiers

```
compendium-owidyn/
├─ module.json
├─ scripts/
│  ├─ owidyn.mjs            point d'entrée : charge les deux classes, la cuisine, les boutiques et les aides communes
│  ├─ owidyn/               aides du contenu Owidyn : effets activables, effets à formule, Familiar Friend, Sceau de Confinement,
│  │                        Kitsune (sorts kitsune, formes, griffes, Surcharge et Débordement spirituels, langue Keotal) ;
│  │                        compendiums du module et mise à jour des mondes faits avec les anciens (compendiums.mjs, migration.mjs)
│  ├─ boutiques/            boutiques : règles et paiement (catalogue.mjs), stocks et achats (boutiques.mjs),
│  │                        onglet, formulaire et fenêtre (shop-ui.mjs)
│  ├─ cuisine/              cuisine d'Aldraine : règles (regles.mjs), fenêtre « Cuisiner », repas et livres
│  ├─ heliarque/            automatisations de l'Héliarque
│  └─ cartomancien/         deck, gestionnaire et automatisations du Cartomancien
├─ styles/                  heliarque.css, cartomancien.css, cuisine.css, boutiques.css
├─ templates/
│  ├─ boutiques/            onglet Boutiques, formulaire de création et fenêtre d'une boutique
│  ├─ cartomancien/         fenêtre du gestionnaire de deck
│  └─ cuisine/              fenêtre « Cuisiner »
├─ assets/
│  ├─ heliarque/            icônes SVG
│  └─ cartomancien/         icônes SVG
├─ image/                   images du contenu Owidyn manuel
├─ packs/                   compendiums LevelDB ; _source/<compendium>/ = leurs sources JSON, rangées comme celles de dnd5e
├─ reference/               règles d'origine et documentation par classe
├─ tools/
│  ├─ heliarque/            génération du contenu Héliarque
│  ├─ owidyn/               add.mjs / remove.mjs / export.mjs : ajout, suppression et export des documents Owidyn hors de Foundry ;
│  │                        creature-features.mjs : construction de Creature Features (et Legacy) ; pack.mjs : aides communes
│  └─ migrate-world.mjs     migration d'un monde fait avec une ancienne version ou les anciens modules
└─ tests/                   tests hors Foundry : Héliarque, Cartomancien, boutiques, cuisine et migration des compendiums
```

### Sources des compendiums

Le contenu Owidyn « manuel » se modifie directement dans Foundry, ou dans ses sources. Les sources sont rangées comme celles de dnd5e : `packs/_source/<compendium>/` reprend les dossiers du compendium (un répertoire par dossier, décrit par son `_folder.json`), avec un fichier JSON par document, nommé d'après lui. Par exemple :

- `packs/_source/classes/monk/la-voie-de-laiguille/la-voie-de-laiguille.json` pour la sous-classe ;
- `packs/_source/classes/monk/la-voie-de-laiguille/subclass-features/` pour ses aptitudes.

`tools/owidyn/add.mjs` écrit des sources dans leur compendium, sans toucher aux autres documents. Après des modifications faites dans Foundry, `tools/owidyn/export.mjs` remet les sources à jour depuis les compendiums.

Un contenu des règles 2014 va dans les compendiums Legacy (créés quand il en faut un), le reste dans ceux de 5.5. Tout document a pour source OSC.

### Contenus générés

Trois contenus sont générés : une modification faite à la main y serait perdue.

- **Héliarque** : la classe et les Formes, écrites avec leurs sources par `npm run build:heliarque`.
- **Cartomancien** : créé dans Foundry par ses scripts, sans fichiers sources.
- **Creature Features** : reconstruit avec Creature Features (Legacy) depuis Creatures et Creatures (Legacy) par `tools/owidyn/creature-features.mjs`. Il garde une aptitude par nom, sans celles des Monster Features de dnd5e ni les armes de l'équipement. Relancez-le après avoir modifié une créature. Les Formes orbitales n'y figurent pas : leurs aptitudes ne marchent qu'avec les scripts de l'Héliarque.

Vous pouvez déplacer les dossiers *Cartomancien* et *Héliarque* et les Formes : ils restent où vous les mettez.

### Commandes

Fermez Foundry avant toute commande qui écrit dans les compendiums.

```sh
npm install                 # classic-level, pour lire et écrire les compendiums
npm test                    # tests Héliarque, Cartomancien, boutiques, cuisine et migration des compendiums
npm run build:heliarque     # régénère le contenu Héliarque
node tools/owidyn/add.mjs packs/_source/<compendium>/<chemin>.json   # ajoute ou remplace ce document, ou tout un répertoire, dans son compendium
node tools/owidyn/remove.mjs [--check] <id>...                       # supprime ces documents et leurs sources, quel que soit leur compendium
node tools/owidyn/export.mjs [--check] [--pack <compendium>]         # réécrit les sources depuis les compendiums, après des modifications dans Foundry
node tools/owidyn/creature-features.mjs [--check]                    # reconstruit Creature Features (et Legacy) depuis les créatures
```

### API et données

Dans la console, pour le MJ, `game.modules.get('compendium-owidyn').api` donne :

| Clé | Fonctions |
| --- | --- |
| `heliarque` | `executeMove`, `reconfigureFlow`, `orbitalSummary`, `ensureOrbitals` |
| `cartomancien` | `openManager`, `syncActor`, `resetDeck`, `drawOne`, `longRest`, `castFromCard`, `chooseSpellForCard`, `syncActorContent`, `learnCantrips`, et les automatisations des aptitudes |
| `cuisine` | `open(actor)`, `learn(actor, identifiants)`, `cook(actor, marmite, { encas })` |
| `boutiques` | `openGenerator()`, `openShop(id)`, `generateShop({ template, name, description, packs, kinds, rarities, count, percent })`, `restock(id)`, `listShops()`, `getShop(id)`, `deleteShop(id)`, `addDocument(id, uuid)`, `addService(id)`, `buy(id, ligne, acteur)`, `goodsOf({ kinds, rarities, packs })` |

Les données des personnages sont rangées sous `flags.compendium-owidyn.heliarque`, `flags.compendium-owidyn.cartomancien` et `flags.compendium-owidyn.cuisine` (recettes connues et maîtrise). Les boutiques sont rangées dans le réglage de monde `compendium-owidyn.boutiques`.

### Publier une version

1. Fermez Foundry (les compendiums ne doivent pas être ouverts), montez `version` dans `module.json` (par exemple `2.4.0` → `2.5.0`) et ajoutez la version au [CHANGELOG](CHANGELOG.md).
2. Envoyez les changements : `git add -A`, `git commit -m "…"`, `git push`.
3. Sur GitHub, **Releases › Draft a new release**, tag = la version (`2.5.0`), puis **Publish release**.

La GitHub Action [release.yml](.github/workflows/release.yml) écrit la version et l'adresse du zip dans `module.json`, construit `compendium-owidyn.zip` (sans les sources, outils et tests) et joint les deux fichiers à la Release : les installations existantes voient alors la mise à jour.
