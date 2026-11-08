# Changelog

Évolutions de **Compendium Owidyn** pour Foundry VTT 14 et D&D5e 6.0.6.

## 2.4.0

### Nouveaux compendiums

Les quatre compendiums (Compendium Owidyn, Héliarque — Formes orbitales, Owidyn — Journaux, Owidyn — Bestiaire) sont remplacés par un compendium par type de contenu, comme dans dnd5e, rangés dans deux dossiers de l'onglet Compendiums : **Owidyn's Source Compendium 5.5** pour les règles 2024 (D&D 5.5e, *Modern Rules*) et tout le contenu propre à Owidyn, **Owidyn's Source Compendium Legacy** pour les règles 2014 (D&D 5e, *Legacy Rules*).

| Compendium | Contenu | Rangement |
| --- | --- | --- |
| **Classes** | Cartomancien, Héliarque, Monk › La Voie de l'Aiguille | Classe › *Class Features* et dossier de la sous-classe (la sous-classe et ses *Subclass Features*) |
| **Items** | Les objets magiques | Catégorie (*Armor*, *Potions*, *Rings*, *Rods*, *Staffs*, *Wands*, *Weapons*, *Wondrous Items*) › rareté, avec *Varies* pour une rareté variable et *Mundane* pour le non magique |
| **Species** | Primordian, Salamander ; Thri-kreen | Type de créature › species (*Elemental › Primordian*, *Monstrosity › Thri-kreen*), et *Species Features* › une species par dossier |
| **Creatures** | Le bestiaire et les Formes orbitales de l'Héliarque | Type de créature ; les Formes dans *Construct*. Masqué aux joueurs |
| **Creature Features** | Nouveau : une base d'aptitudes de créatures à glisser sur un profil, comme les Monster Features de dnd5e, qui la complète | Type d'aptitude (*Traits*, *Actions*, *Attacks*). Masqué aux joueurs |
| **Backgrounds & Feats** | Historiques et dons | *Backgrounds* ; *Feats* › *General Feats*, *Origin Feats* |
| **Spells** | Sorts absents de dnd5e | Niveau (*Cantrips*, *1st Level*…) |
| **Summons** | Nouveau : les créatures des sorts d'invocation, visibles des joueurs pour qu'ils puissent les invoquer | Un dossier par sort |
| **Journals** | Listes de sorts | *Spell Lists* › une classe par dossier |
| **Creatures (Legacy)** | Shadow (Monster Manual 2014) | *Undead*. Masqué aux joueurs |
| **Creature Features (Legacy)** | Strength Drain | *Attacks*. Masqué aux joueurs |
| **Backgrounds & Feats (Legacy)** | Strike of the Giants et ses options | *Feats* |
| **Spells (Legacy)** | Thorn Whip (Player's Handbook 2014) | *Cantrips* |

- **Règles** : tous les documents ont pour source Owidyn's Source Compendium et sont marqués selon leurs règles, 2024 dans 5.5 et 2014 dans Legacy. Les Formes orbitales reçoivent leur source.
- **Creature Features** : chaque aptitude n'y figure qu'une fois, avec un texte qui nomme la créature qui la reçoit. Celles que les Monster Features de dnd5e ont déjà (Amphibious, Bite, Pack Tactics…) et les armes de l'équipement (Dagger, Shortbow…) n'y sont pas : on prend celles de dnd5e.
- La **Moonblade** fait apparaître son entité avec le Shadow 2024 de dnd5e, et non plus avec celui de 2014 du bestiaire.
- **Couleurs** : les dossiers sont colorés comme dans dnd5e, les niveaux de sorts en dégradé violet, les types de créatures en bleu nuit, les raretés d'objets du gris au rouge, les listes de sorts de la couleur de leur classe, l'Héliarque en or.

### Boutiques

- **Correction** : **Mettre à jour les tables** ne lisait aucun compendium d'objets (le serveur de Foundry refusait leur index), si bien que seule l'Écurie avait des articles et que **Générer** ne donnait rien pour les autres boutiques. Les tables vides sont reconstruites à la prochaine génération.
- **La page du stock** liste les articles avec leur prix, puis la fiche de chacun, et un bouton **Régénérer le stock** (MJ seulement) en tire un nouveau avec les mêmes réglages.
- **Parchemins de sorts** à La Hutte Enchantée : les sorts de dnd5e, des modules D&D officiels et d'Owidyn, de la rareté de leur niveau et à la moitié du prix d'un objet magique de cette rareté, limités par la rareté maximale. Un parchemin tiré est créé par dnd5e à partir de son sort, dans le dossier d'objets *Boutiques — Parchemins*.
- **L'Auberge**, nouvelle boutique : chambres, repas, boissons, employés et messagers, sorts lancés sur demande, aux prix du System Reference Document 5.2. Elle propose toujours tous ses services.
- Les générateurs ignorent Creature Features et les Monster Features de dnd5e : ce sont des aptitudes, pas des marchandises.

### Créatures

- **Nouvelles créatures** : les 45 monstres 2024 de FP 0 à 3 absents de dnd5e (Monster Manual 2024, d'après AideDD) : Crawling Claw, Displacer Beast, Empyrean Iota, Faerie Dragon Youth et Adult, Flaming Skeleton, Githyanki Warrior, Githzerai Monk, Gnoll Pack Lord, Goblin Hexer, Grell, Hook Horror, Intellect Devourer, Kuo-toa Monitor et Whip, Lacedon Ghoul, Larva, Lizardfolk Geomancer, Mage Apprentice, Manes Vaporspawn, Myconid Sovereign, Spore Servant et Sprout, Ogrillon Ogre, Peryton, Poltergeist, Psychic Gray Ooze, Quaggoth et Quaggoth Thonot, Sahuagin Priest, Salamander Fire Snake, Scarecrow, Scout Captain, Spectator, Spined Devil, Swarm of Larvae, Swarm of Lemures, Swarm of Stirges, Thri-kreen Marauder, Water Weird, Yeti, Yuan-ti Infiltrator et Yuan-ti Malison (types 1, 2 et 3). Les attaques, jets de sauvegarde, recharges, états, tests pour s'échapper d'une prise et sorts innés sont automatisés, et les aptitudes courantes (Magic Resistance, Amphibious, Flyby…) sont celles de dnd5e. Le Bulette Pup manque : AideDD ne donne que le nom de ses attaques.
- **Créatures corrigées** : 55 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dégâts : Ankheg (Bite tranchant), Cultist (Ritual Sickle tranchant), Frog et Lizard (Bite de 1 perforant), Giant Fire Beetle (Bite de feu), Giant Octopus (Tentacles contondant), Mimic (1d8 d'acide à Bite et Pseudopod), Spider (1 perforant en plus du poison), Swarm of Insects (Bites de poison), Swarm of Venomous Snakes (3d6 de poison en plus), Vampire Familiar (Umbral Dagger perforant).
  - Règles : Bugbear Stalker (DD 13 pour Quick Grapple), Gold Dragon Wyrmling (souffle en cône de 15 ft), Ogre Zombie (sans maîtrise des jets d'Intelligence), Phase Spider (voit aussi du plan Éthéré vers le plan Matériel), Swarm of Insects (escalade ou vol, au choix du MJ), Swarm of Piranhas (ne retient pas sa respiration hors de l'eau), Goat (Ram ne fait plus tomber à terre, un effet de la Giant Goat).
  - Fiche : alignement « Any Alignment » (Berserker, Cultist, Cultist Fanatic, Knight, Pirate), Druid sans sous-type, habitats complétés (Baboon, Goat, Plesiosaurus, Rat, Swarm of Insects, Swarm of Rats, Swarm of Ravens, Vulture, Wolf).
  - Description absente de dnd5e, reformulée : Animated Armor, Animated Rug of Smothering, Awakened Shrub, Awakened Tree, Azer Sentinel, Bandit Captain, les dragonnets bleu, d'airain, de bronze, d'or, vert et blanc, Centaur Trooper, Druid, Gargoyle, Ghast, Ghoul, Green Hag, Grick, Lemure, Minotaur Skeleton, Mummy, Priest, Sea Hag, Shrieker Fungus, Spy, Swarm of Crawling Claws, Warrior Veteran.
  - Les copies ont les images de jetons de dnd5e, et non celles du Monster Manual payant que dnd5e leur donne.
- **Creature Features** passe à 82 aptitudes avec celles des nouvelles créatures.

### Nouveaux sorts

- **Spells** reçoit les sorts 2024 absents de dnd5e : ceux du Player's Handbook hors SRD (Armor of Agathys, Toll the Dead, Witch Bolt, Thunderous Smite, Wrathful Smite…), de World of Warcraft, d'Arcana Unleashed, de Heroes of Faerûn, des D&D Beyond Drops et de Forge of the Artificer, et la version 2024 de ceux que dnd5e n'a qu'en 2014, dans Tasha's (Mind Sliver). Ils couvrent tous les niveaux, des cantrips au niveau 9 : 185 sorts.
- Les attaques, jets de sauvegarde, dégâts et leur montée en niveau, et les effets (états, vitesse, désavantages, lumière) sont automatisés ; une note Foundry, visible du MJ, dit ce qui reste à gérer à la main.
- **Listes de sorts** : *Journals › Spell Lists* a un dossier par classe (et *Species*) ; dnd5e réunit ces listes avec les siennes, si bien que les nouveaux sorts apparaissent dans la liste de chaque classe. Freedom of Movement rejoint la liste du Barde, et l'Artificier a toute sa liste 2024.
- **Sorts d'invocation** : Summon Beast, Summon Fey, Summon Undead, Summon Aberration, Summon Construct, Summon Elemental, Summon Celestial, Summon Fiend (Player's Handbook), Summon Plant, Summon Dinosaur et Battle Familiar (Arcana Unleashed), Homunculus Servant (Forge of the Artificer). Leurs créatures sont dans **Summons**, une par variante ; l'invocation ajoute ce qui monte avec le niveau du sort (CA, points de vie, dégâts) et reprend le bonus de maîtrise, les attaques et les DD de l'invocateur. Sticks to Snakes invoque le Venomous Snake de dnd5e.
- **Elemental Weapon** enchante l'arme touchée : +1 à l'attaque et 1d4 du type choisi, +2 et 2d4 avec un emplacement de niveau 5–6, +3 et 3d4 au niveau 7+.
- **Objets magiques** : leurs activités qui attendaient un sort absent de dnd5e le lancent désormais, avec un lien dans leur description : Cube of Summoning, Demonomicon of Iggwilv, Eye of Vecna, Grave Reaper (Spirit Lantern), Helm of Domination (Telepathy), Niko's Mace (Summon Celestial), Spirit-Binding Censer (Circle of Power), Thayan Sword (Thunderous et Wrathful Smite), Wand of Slumber (Catnap).
- **Thorn Whip** passe à sa fiche 2024 ; sa version 2014 est dans Spells (Legacy).

### Nouveaux objets

- **Book of Talgaroth** (*Wondrous Items › Artifact*, harmonisation) : un livre aux pages blanches, sauf la dernière où est écrit *Talgaroth*, dont la couverture change de couleur selon les émotions de la créature harmonisée. Il permet d'envoyer des messages télépathiques à sens unique à toutes les créatures vues à 120 ft ou situées à 60 ft (une créature qui les refuse fait un Wisdom Saving Throw contre un DD de 13 + bonus de maîtrise), et de faire apparaître ses pensées sur ses pages à toute distance sur le même plan.
- **Bone Goggles** (*Wondrous Items › Uncommon*) : des lunettes d'os fendues qui annulent le Disadvantage de Sunlight Sensitivity.
- **Ring of the Storm Whisper** (*Rings › Legendary*, nouveau dossier) : un anneau d'or serti de l'émeraude d'un djinn emprisonné sur un plan prison, qui sert de focaliseur d'incantation.
- **Whip Rapier** (*Weapons › Uncommon*) : une rapière +1 dont la lame se segmente en Bonus Action pour devenir un fouet (1d4 Slashing, Reach, maîtrise Slow), et inversement.

### Cartomancien

- **Liaison des sorts** : une carte se lie à un sort exactement de son niveau, au choix parmi les sorts déjà sur la fiche, même hors de la Spell List du Cartomancien (sort d'une autre classe, d'un don…), et les sorts de la Spell List trouvés dans les compendiums, ajoutés à la fiche en les liant. Les sorts qu'un objet fait lancer ne sont pas proposés. **Initialiser / Synchroniser** signale en un seul message les niveaux pour lesquels aucun sort n'est disponible.

### Mise à jour

Les documents gardent leur identifiant, mais leur compendium change : au premier chargement d'un monde par le MJ, le module fait pointer sur les nouveaux compendiums les liens du monde qui visaient les anciens (avancements des personnages, Formes de l'Héliarque, liens des journaux…). Le dossier de compendiums *Owidyn* de la 2.3, vide, est supprimé. Les liens des anciens messages du chat et les réglages de visibilité des anciens compendiums ne sont pas repris. Les tables des boutiques sont construites à la première génération, ou avec **Mettre à jour les tables** ; reconstruisez-les après cette mise à jour, et après l'installation d'un nouveau module d'objets.

## 2.3.0

### 256 nouveaux objets magiques

Le compendium **Compendium Owidyn** reçoit 256 objets magiques absents de dnd5e ou corrigés par rapport à lui. Ils sont rangés dans *Equipment* : sept nouveaux dossiers et douze armures de plus dans *Armor*. Ils viennent du Dungeon Master's Guide 2024, d'Arcana Unleashed, de Netheril's Fall, de Forgotten Realms (Heroes of Faerûn, Adventures in Faerûn), d'Eberron : Forge of the Artificer, des D&D Beyond Drops, de World of Warcraft et de quelques aventures (Welcome to the Hellfire Club, Ravenloft : The Horrors Within, Lorwyn : First Light).

| Dossier | Objets | Exemples |
| --- | --- | --- |
| Armor | 12 | Mariner’s Armor, Armor of Gleaming, Defias Leather, Spiked Shield |
| Potion | 18 | Potion of Mana, Troll’s Blood Elixir, Flask of the Titans |
| Ring | 8 | Adventurer's Ring, Sync Ring, Spell-Refueling Ring |
| Rod | 6 | Rod of the Pact Keeper, Tentacle Rod, Blossom Rod |
| Staff | 14 | Staff of the Adder, Staff of Skulls, Life Staff of the Web Lair |
| Wand | 9 | Wand of Teeth, Wand of Slumber, Wand of Orcus |
| Weapon | 42 | Moonblade, Blackrazor, Sword of Kas, Frostmourne, Ashbringer |
| Wondrous Item | 147 | Driftglobe, Deck of Many Things, Instrument of the Bards, Eye of Vecna |

- **Objets « pour toute arme » ou « pour toute armure »** (Mariner’s Armor, Silvered Weapon, Returning Weapon…) : ce sont des modèles d'enchantement à glisser sur l'arme ou l'armure voulue. Celle-ci garde son nom, sa rareté, son prix et son image, et reçoit les propriétés de l'objet. La **Wand of the War Mage** de dnd5e est aussi proposée sous cette forme.
- **Automatisations** : charges récupérées à l'aube, sorts lancés depuis l'objet avec leur DD, jets de sauvegarde, dégâts, invocations et effets (lumières à allumer ou éteindre, résistances, vitesses de vol, bonus aux tests…). Chaque fiche porte une note Foundry, visible du MJ, qui indique ce qui reste à gérer à la main.
- **Une fiche par version** pour les objets qui en ont plusieurs : Blossom Rod, Staff of Skulls, Keyholes Dagger, Mechanical Wonder, Harper Pin, Wraps of Unarmed Power, Idol of Good Fortunes, Instrument of the Bards, Necklace of the Beastly Familiar ; l'Œil et la Main de Vecna sont deux objets.
- **Sorts et créatures absents de dnd5e** : l'activité qui les utilise est laissée vide, prête à recevoir le sort ou la créature si vous l'avez (Catnap, Summon Aberration, Summon Beast, Summon Construct, Summon Elemental, Summon Fey, Summon Fiend, Crown of Madness, Telepathy, Circle of Power ; Domestic Wonder, Flying Wonder, Swarm of Corrupted Rats, Eldritch Eddy, Terran Magen).

<details>
<summary>Liste complète des objets ajoutés</summary>

**Armor** — Armor of Gleaming, Cast-Off Armor, Defias Leather, Enspelled Armor, Judgment Armor, Mariner’s Armor, Salubrious Armor, Shield of Expression, Smoldering Armor, Spell-Fuelling Armor, Spiked Shield, Tramontane Armor.

**Potion** — Flask of the Titans, Noggenfogger Elixir, Potion of Comprehension, Potion of Dragon’s Breath, Potion of Fire Breath, Potion of Greater Invisibility, Potion of Mana (normale, Greater, Superior), Potion of Pugilism, Potion of Rejuvenation (normale, Greater, Superior), Potion of Tirelessness, Troll’s Blood Elixir (normal, Greater, Superior, Supreme).

**Ring** — Adventurer's Ring, Boon Companion's Bands, Mind Sharpener, Ring of Candor, Ring of Dedicated Focus, Spell Component Ring, Spell-Refueling Ring, Sync Ring.

**Rod** — Blossom Rod (Budding, Flowering, Somniferous), Rod of the Pact Keeper, Rod of the Sleepwalker, Tentacle Rod.

**Staff** — Diamond Staff, Dissuader, Enspelled Staff, Life Staff of the Web Lair, Staff of Adornment, Staff of Birdcalls, Staff of Flowers, Staff of Light and Shadow, Staff of Skulls (Chattering, Ominous, Pulverizing), Staff of the Adder, Staff of the Lost, Staff of the Spirit Aegis.

**Wand** — Wand of Conducting, Wand of Enthralling, Wand of Freshness, Wand of Misdirection, Wand of Orcus, Wand of Pyrotechnics, Wand of Slumber, Wand of Teeth, Wand of the War Mage (+1, +2 ou +3).

**Weapon** — Adamantine Weapon, Ashbringer, Axe of the Dwarvish Lords, Blackrazor, Climber's Ammunition, Dazzling Weapon, Dispelling Ammunition, Doomhammer, Ebonbane, Enspelled Weapon, Executioner's Axe, Frostmourne, Goading Ammunition, Grave Reaper, Keyholes Dagger (Three, Ten, Many), Life-Sapping Blade, Lute of Thunderous Thumping, Mage Breaker, Martialist's Quarterstaff, Moon-Touched Sword, Moonblade, Namer's Needle, Niko's Mace, Poison Soaked Kukri, Repeating Shot, Returning Weapon, Shalamayne, Silvered Weapon, Sniper's Bracelet, Sulfuras, Hand of Ragnaros, Sword of Answering, Sword of Kas, Sword of Vengeance, Sylvan Talon, Thayan Sword, Trick Weapon, Walloping Ammunition, Wave, Wave-Swept Weapon, Whelm.

**Wondrous Item** — Alarm Pylon, Alchemy Jug, Amulet of Retributive Healing, Arcane Battery, Arcane Chatelaine, Arcanist's Bestiary, Aviana's Feather, Baba Yaga's Dancing Broom, Bead of Refreshment, Bellows of Strangulation, Blood Amulet, Book of Exalted Deeds, Book of Vile Darkness, Boots of False Tracks, Boots of the Winding Path, Brooch of the Elements, Calimemnon Crystal, Candle of the Deep, Cap of Vanishing, Cap of Water Breathing, Cauldron of Rebirth, Charlatan's Die, Cloak of Billowing, Cloak of Many Fashions, Clockwork Amulet, Clothes of Mending, Conjurer's Canopy, Crown of Horns, Crown of the Ogre King, Crystal Ball of Ominous Portent, Cube of Summoning, Dark Shard Amulet, Deck of Many Things, Demonomicon of Iggwilv, Dictation Quill, Dread Helm, Dream Weaver, Driftglobe, Ear Horn of Hearing, Elocutionist's Lexicon, Enduring Spellbook, Ensorcelled Missive, Ersatz Eye, Eternal Chalk, Evergreen Fertilizer, Experimental Goblin Jetpack, Eye of Vecna, Eyes of Deceit, Fork of Eddy Summoning, Goblin Jumper Cables, Goggles of Foe-Finding, Hag Eye, Hand of Vecna, Harkon's Bite, Harper Pin (Silver, Golden), Hat of Vermin, Hat of Vortexes, Hat of Wizardry, Hearthstone, Helm of Awareness, Helm of Domination, Heward's Handy Spice Pouch, Homeward Compass, Horn of Silent Alarm, Idol of Good Fortunes (Blemished, Tarnished, Golden), Instrument of Illusions, Instrument of Scribing, Instrument of the Bards (Anstruth Harp, Canaith Mandolin, Cli Lyre, Doss Lute, Fochlucan Bandore, Mac-Fuirmidh Cittern, Ollamh Harp), Keoghtom's Ointment, Lock of Trickery, Lucky Foot, Mage's Manacle, Magen Handbell, Magewright's Gloves, Manifold Tool, Mask of Changed Appearance, Masquerader's Brooch, Mechanical Wonder (Domestic, Flying, Gyrocopter, Mobility), Mystery Key, Mythallar Bracelet, Mythallar Cloak, Nature's Mantle, Necklace of the Beastly Familiar (Azurite, Chrysoprase, Zircon, Topaz, Fire Opal), Orb of Damara, Orb of Direction, Orb of Divination Detection, Orb of Dragonkind, Orb of Sorcery, Orb of Time, Perfume of Bewitching, Philosopher's Stone, Pipes of Pestilence, Pole of Angling, Pole of Collapsing, Pot of Awakening, Prismatic Rune, Prosthetic Limb, Queen Ehlissa's Marvelous Nightingale, Reliquary of Dawn, Reliquary of Twilight, Rival Coin, Robe of Thayan Arcana, Rope of Mending, Ruby of the War Mage, Saddle of the Cavalier, Scarlet Spellbook, Scholar's Anchoring Bangle, Secret Keeper's Circlet, Silencing Satchel, Spell Duelist's Trophy, Spell-Slinger's Puppet, Spirit Board, Spirit-Binding Censer, Stormwalker's Cloak, Sweeping Broom, Talking Doll, Tankard of Sobriety, Thayan Spell Tattoo, Thespian's Playbill, Thief's Thimble, Tome of the Dragon, Tome of the Stilled Tongue, Traveler's Pearl, Universal Pantograph, Unraveling Cloak, Veteran's Cane, Windskiff, Workshop Wrecker, Wraps of Unarmed Power (+1, +2, +3).

</details>

### Générateurs de boutiques

Nouveau bouton **Boutiques** dans l'onglet **Tables**, réservé au MJ, pour générer le stock de cinq boutiques : **La Hutte Enchantée** (objets magiques), **Équipement**, **Forge**, **Apothicaire** et **Écurie**.

- **Mettre à jour les tables** construit, dans le dossier de tables *Boutiques*, une table par catégorie de chaque boutique à partir de tous les compendiums d'objets installés, plus une table principale par boutique. Les poids de ces tables principales règlent la composition des stocks et sont conservés d'une mise à jour à l'autre.
- **Générer** tire le nombre d'articles demandé, sans doublon, avec une rareté maximale pour les objets magiques et un pourcentage de prix. Le stock est écrit dans une page du journal *Boutiques*, à montrer aux joueurs : ils glissent les objets achetés sur leur fiche.
- Les montures sont liées aux créatures de dnd5e ; la sellerie et les véhicules absents des compendiums sont des lignes de texte au prix du Player's Handbook.

Le fonctionnement complet est décrit dans la section « Générateurs de boutiques » du README.

### Cartomancien

- **Réinitialiser le deck**, nouveau bouton du gestionnaire : les cartes de la main et de la défausse reviennent dans le deck, qui est mélangé, puis une nouvelle main est piochée ; les opérations de main en attente sont annulées. Les sorts liés et les changements de sort disponibles sont conservés. Le MJ peut aussi délier toutes les cartes pour que leurs sorts soient choisis à nouveau gratuitement.
- **Retirer la classe** supprime désormais le deck, la main et la défausse du personnage, les effets laissés par ses capacités et ses données. Une fenêtre propose ensuite de supprimer les sorts du Cartomancien, en conservant ceux d'une autre classe du personnage.
- **Liaison des sorts** : une carte ne peut plus être liée qu'à un sort de la Spell List du Cartomancien déjà présent sur la fiche, du niveau de la carte. Les sorts ne sont plus ajoutés automatiquement depuis les compendiums. **Initialiser / Synchroniser** signale en un seul message les niveaux de sort qui manquent sur la fiche.
- Lier de nouveau une carte dont le sort a été retiré de la fiche ne coûte plus de changement de sort.

### Mise à jour

Aucune migration n'est nécessaire. Les tables des boutiques sont construites à la première génération, ou avec **Mettre à jour les tables**. Pensez à les reconstruire après l'installation d'un nouveau module d'objets.
