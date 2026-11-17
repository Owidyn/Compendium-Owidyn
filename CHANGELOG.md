# Changelog

Évolutions de **Compendium Owidyn** pour Foundry VTT 14 et D&D5e 6.0.6.

## 2.6.0

### Nouvelles species

**Species** reçoit les species 2024 de la liste du wiki que dnd5e n'a pas : 38 species rangées par type de créature (nouveaux dossiers *Aberration*, *Celestial*, *Construct*, *Dragon*, *Fey* et *Undead*), leurs 100 aptitudes dans *Species Features*.

- **Player's Handbook** : Aasimar.
- **Eberron** : Changeling, Kalashtar, Khoravar, Shifter (Beasthide, Longtooth, Swiftstride ou Wildhunt au choix), Warforged.
- **Lorwyn** : Boggart, Faerie (Lorwyn ou Shadowmoor, celle-ci avec Darkvision 120 ft), Flamekin, Changeling, Lorwyn, Rimekin.
- **Ravenloft et Astarion's Book of Hungers** : Dhampir, Hexblood, Lupin, Reborn.
- **D&D Beyond Drops** : Bariaur, Duskling.
- **World of Warcraft** : Dracthyr, Draenei (Draenei, Krokul, Lightforged, Man'ari), Earthen, Azeroth Elf (Blood, High, Night, Nightborne, Void), Forsaken, Mechagnome, Goblin, Haranir, Pandaren, Tauren (lignée Mulgore, Highmountain ou Taunka), Troll (Amani, Darkspear ou Zandalari), Vulpera, Worgen. Le Dwarf, le Gnome, le Human et l'Orc de World of Warcraft sont ceux du Player's Handbook, déjà dans dnd5e ; la Renown de départ est dans la description.

Comme les species de dnd5e, chaque lignée à sorts est une species à part, et les aptitudes identiques à celles de dnd5e (Fey Ancestry, Keen Senses, Trance, Dwarven Resilience) sont les siennes. Résistances, maîtrises et sorts s'ajoutent par avancement ; utilisations, transformations (Shifting, Darkflight, Celestial Revelation), jets de sauvegarde, soins, attaques à mains nues et bonus (CA, vitesse, vol, télépathie, avantages) sont automatisés, avec une note Foundry pour le reste.

### Nouveaux backgrounds

**Backgrounds & Feats** reçoit les 69 backgrounds de la liste du wiki que dnd5e et le module n'ont pas (dnd5e a Acolyte, Criminal, Sage et Soldier, le module Guide et Scribe), rangés par source dans *Backgrounds* :

- **Player's Handbook** : Artisan, Charlatan, Entertainer, Farmer, Guard, Hermit, Merchant, Noble, Sailor, Wayfarer.
- **Eberron** : Aberrant Heir, Archaeologist, House Agent, Inquisitive et les douze héritiers des maisons (House Cannith Heir… House Vadalis Heir), chacun avec la marque de sa maison.
- **Forgotten Realms** : Chondathan Freebooter, Dead Magic Dweller, Dragon Cultist, Emerald Enclave Caretaker, Flaming Fist Mercenary, Genie Touched, Harper, Ice Fisher, Knight of the Gauntlet, Lords' Alliance Vassal, Moonwell Pilgrim, Mulhorandi Tomb Raider, Mythalkeeper, Purple Dragon Squire, Rashemi Wanderer, Shadowmasters Exile, Spellfire Initiate, Zhentarim Mercenary.
- **Ravenloft** : Haunted One, Investigator, Mist Wanderer, Spirit Medium (un Dark Gift au choix, ou Survivor / Sharp Eye).
- **Arcana Unleashed** : Agent of the Ninth Quill, Bejeweled Conclave Spy, Cosmic Dawn Experiment, Covenant of the Grave Recruit, Crucible Storm Chaser, Familiar Trainer, Horizon Weaver Initiate, Phantasmic Circus Trouper, Seer Apprentice, Ward of the Sheltering Hands.
- **Other Settings** : Carouser, Vampire Devotee, Vampire Survivor (Astarion's Book of Hungers), Lorwyn Expert, Shadowmoor Expert (Lorwyn: First Light), Pact Seeker (un Planar Pact au choix).
- **Project Lamordia** : Discredited Neural Tuner, Fabricated Mind, Mutated Commuter, Reconstructed Runaway (leur Dark Gift ou un autre au choix).

Chacun est construit comme ceux de dnd5e : augmentation de caractéristiques, maîtrises (outil au choix quand il le faut), don (ou choix de don), Common et deux langues standard, équipement de départ (A) relié aux objets de dnd5e, ou 50 GP (B).

### Nouveaux dons

**Backgrounds & Feats** reçoit les 26 dons d'origine que demandent ces backgrounds, rangés dans *Feats › Origin Feats* en trois sous-dossiers :

- **Dragonmarks** (Eberron: Forge of the Artificer) : Aberrant Dragonmark et les douze marques des maisons (Detection, Finding, Handling, Healing, Hospitality, Making, Passage, Scribing, Sentinel, Shadow, Storm, Warding). Le 1d4 de leur Intuition s'ajoute aux tests de compétence (pas aux outils, à ajouter à la main) ; leurs sorts se lancent une fois par Long Rest sans emplacement, ceux du niveau 3 s'ajoutent à ce niveau ; la table *Spells of the Mark* renvoie aux sorts sans les ajouter à la liste de classe.
- **Planar Pacts** (D&D Beyond Drops) : Fey Pact, Infernal Pact, Shadow Pact (Darkvision 60 ft, ou +30 ft si vous l'avez déjà), Upper Planes Pact.
- **Dark Gifts** (Ravenloft: The Horrors Within) : Aberrant Anatomy, Echoing Soul, Gathered Whispers, Living Shadow, Mist Walker, Second Skin, Symbiotic Being, Touch of Death, Watchers. Leur contrepartie (sur un 1 au d20) est un jet de sauvegarde DD 13 + bonus de maîtrise qui applique son état ; leurs tables (Shadow's Will, Change Catalyst) se tirent depuis le don.

Puis les 143 autres dons de la liste du wiki que dnd5e n'a pas :

- **General Feats** (87) : ceux du Player's Handbook (Actor, Athlete… Weapon Master), les *Adept* d'école et les familiers d'Arcana Unleashed, ceux de World of Warcraft (Clearcasting, Elusive Brawler, Enveloping Mist, Fingers of Frost, Fists of Fury, Hot Streak, Stagger and Sway…), de Heroes of Faerûn (Cold Caster… Zhentarim Tactics) et d'Astarion's Book of Hungers (Bloodlust… Vampire Touched).
- **General Feats › Greater Dragonmarks** (14) et **Greater Planar Pacts** (8), pour les personnages qui ont la marque ou le pacte.
- **Fighting Style Feats** (9) : Arcane Warrior, Blind Fighting, Dueling, Interception, Pack Fighting, Prone Fighting, Protection, Thrown Weapon Fighting, Unarmed Fighting (Archery, Defense, Great Weapon Fighting et Two-Weapon Fighting sont dans dnd5e).
- **Epic Boon Feats** (25) : les huit du Player's Handbook absents du SRD, ceux d'Arcana Unleashed, d'Eberron (Boon of Siberys), de Heroes of Faerûn et d'Astarion's Book of Hungers.

### Nouvelle classe : Artificer

**Classes** reçoit l'**Artificer** (Eberron: Forge of the Artificer), rangé comme les classes de dnd5e (*Artificer › Class Features*, une sous-classe par dossier) : dé de vie d8, jets de sauvegarde de Constitution et d'Intelligence, Thieves' Tools, Tinker's Tools et un outil d'artisan, équipement de départ (A) relié aux objets de dnd5e ou 150 GP (B), demi-lanceur de sorts en Intelligence dès le niveau 1. Ses tables (sorts préparés, cantrips, plans connus, objets magiques) sont des valeurs d'échelle, ses dons de caractéristiques tombent aux niveaux 4, 8, 12, 16 et 19, et ses aptitudes vont de *Tinker's Magic* et *Replicate Magic Item* (avec les tables de plans) à *Soul of Artifice*. Sa liste de sorts (*Journals › Spell Lists › Artificer*) est complète.

### Nouvelles sous-classes

**Classes** reçoit les 74 sous-classes 2024 de la liste du wiki que dnd5e n'a pas, chacune dans le dossier de sa classe avec ses *Subclass Features* :

- **Artificer** (6) : Alchemist, Armorer, Artillerist, Battle Smith, Cartographer (Forge of the Artificer), Reanimator (Ravenloft).
- **Barbarian** (5) : Path of the Wild Heart, of the World Tree, of the Zealot (Player's Handbook), of the Elements, of the Spiritual Guardian (World of Warcraft).
- **Bard** (5) : College of Dance, of Glamour, of Valor (Player's Handbook), of Spirits (Ravenloft), of the Moon (Heroes of Faerûn).
- **Cleric** (8) : Light, Trickery, War Domain (Player's Handbook), Arcana (Arcana Unleashed), Discipline, Shadow (World of Warcraft), Grave (Ravenloft), Knowledge (Heroes of Faerûn).
- **Druid** (3) : Circle of the Moon, of the Sea, of the Stars.
- **Fighter** (6) : Battle Master (24 manœuvres), Eldritch Knight, Psi Warrior (Player's Handbook), Arcane Archer (8 Arcane Shots, Arcana Unleashed), Banneret (Heroes of Faerûn), Sorrow Knight (D&D Beyond Drops).
- **Monk** (5) : Warrior of Mercy, of Shadow, of the Elements (Player's Handbook), of Mystic Brews (World of Warcraft), of the Mystic Arts (Arcana Unleashed).
- **Paladin** (6) : Oath of Glory, of the Ancients, of Vengeance (Player's Handbook), of the Ebon Blade (Death Coil, runes), of the Holy (World of Warcraft), of the Noble Genies (Heroes of Faerûn).
- **Ranger** (6) : Beast Master (avec les Hunter Pets et la Pet Specialization de World of Warcraft), Fey Wanderer, Gloom Stalker (Player's Handbook), Demon Hunter (World of Warcraft), Hollow Warden (Ravenloft), Winter Walker (Heroes of Faerûn).
- **Rogue** (6) : Arcane Trickster, Assassin, Soulknife (Player's Handbook), Phantom (Ravenloft), Scion of the Three (Heroes of Faerûn), Swashbuckler (World of Warcraft).
- **Sorcerer** (5) : Aberrant, Clockwork, Wild Magic Sorcery (Player's Handbook), Shadow (Ravenloft), Spellfire (Heroes of Faerûn).
- **Warlock** (5 + 1) : Archfey, Celestial, Great Old One Patron (Player's Handbook), Undead (Ravenloft), Vestige (Arcana Unleashed), et le **Genie Patron** ci-dessous.
- **Wizard** (8) : Abjurer, Diviner, Illusionist (Player's Handbook), Bladesinger (Heroes of Faerûn), Conjurer, Enchanter, Necromancer, Transmuter (Arcana Unleashed).

Les sorts de sous-classe s'ajoutent toujours préparés à leur niveau (sorts de pacte pour le Warlock), et ceux qu'on choisit dans une colonne (runes de l'Ebon Blade, Demon Hunter, domaine du Vestige Patron) par un choix à chaque palier. Les *Savant* du Wizard proposent les sorts de leur école à chaque nouveau niveau d'emplacement. Les aptitudes qui dépensent une ressource de la classe (Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Focus Points, Sorcery Points, Favored Enemy, Second Wind…) la consomment sur la fiche ; dés et bonus qui montent avec le niveau sont des valeurs d'échelle ; effets, jets de sauvegarde, soins, attaques et invocations sont automatisés, avec une note Foundry pour le reste. Les 12 sous-classes du SRD (Berserker, Lore, Life, Land, Champion, Open Hand, Devotion, Hunter, Thief, Draconic, Fiend, Evoker) sont celles de dnd5e.

### Genie Patron (2024)

Le patron Génie de Tasha's Cauldron of Everything, celui du Djinni de l'Occultiste d'Aldraine, adapté aux règles 2024 (*Warlock › Genie Patron*) :

- **Niveau 3** : choix du genre du génie (**Dao**, **Djinni**, **Efreeti** ou **Marid**), *Genie Spells* toujours préparés aux niveaux 3, 5, 7 et 9 (ceux du génie et ceux de son genre ; Wish peut devenir l'arcane mystique de niveau 9), *Genie's Vessel* (Bottled Respite une fois par Long Rest, Genie's Wrath du type de dégâts du genre).
- **Niveau 6** : *Elemental Gift* (résistance du genre, vol de 30 ft en Bonus Action autant de fois que le bonus de maîtrise).
- **Niveau 10** : *Sanctuary Vessel* (jusqu'à cinq créatures dans le vase, Short Rest en 10 minutes).
- **Niveau 14** : *Limited Wish* (un sort de niveau 6 ou moins, puis 1d4 Long Rests).

### Nouvelles invocations

**Summons** reçoit les compagnons des sous-classes : Steel Defender, Eldritch Cannon, Reanimated Companion (Artificer), Beast of the Land, of the Sea et of the Sky (Beast Master) et le Vestige Companion céleste, fiélon ou mort-vivant (Vestige Patron). L'aptitude qui les invoque ajoute ce qui monte avec le niveau (CA, points de vie, dégâts) et reprend le bonus de maîtrise, les attaques et les DD de l'invocateur ; leur lien (*Steel Bond*, *Primal Bond*, *Pact Bond*) ajoute le bonus de maîtrise à leurs tests et sauvegardes.

### Sous-classes de Tasha's Cauldron of Everything

Les 15 sous-classes de Tasha's absentes de la liste du wiki rejoignent **Classes**, adaptées aux règles 2024 comme le Genie Patron : sous-classe au niveau 3, niveaux d'aptitudes de la classe 2024, sorts toujours préparés (sorts de pacte pour le Warlock), Focus Points au lieu du Ki, Magic actions. Le Divine Strike des domaines de Cleric laisse la place au Blessed Strikes de la classe 2024.

- **Barbarian** : Path of the Beast (armes naturelles, Bestial Soul, Infectious Fury, Call the Hunt), Path of Wild Magic (table Wild Surge et ses effets).
- **Bard** : College of Creation (Mote of Potential, Dancing Item), College of Eloquence (Silver Tongue, Unsettling Words).
- **Cleric** : Order Domain, Peace Domain (Emboldening Bond), Twilight Domain (Twilight Sanctuary, Steps of Night).
- **Druid** : Circle of Spores (Halo of Spores, Symbiotic Entity), Circle of Wildfire (Wildfire Spirit).
- **Fighter** : Rune Knight, avec ses six runes (Cloud, Fire, Frost, Stone, Hill, Storm) à choisir et Giant's Might.
- **Monk** : Warrior of the Astral Self. **Paladin** : Oath of the Watchers. **Ranger** : Swarmkeeper. **Warlock** : Fathomless Patron. **Wizard** : Scribe.

**Summons** reçoit leurs créatures : Dancing Item (College of Creation) et Wildfire Spirit (Circle of Wildfire).

### Nouveau background : Automate cuisinier

Un construct fabriqué pour servir en cuisine (*Backgrounds*, à côté du Sujet de Confinement Runique) : Constitution, Wisdom ou Dexterity, Perception et Survival, Tinker's Tools, don **Cuisinier**, Common et deux langues standard, Tinker's Tools, Cook's Utensils, Iron Pot et Traveler's Clothes, ou 50 GP. Son trait **Corps d'automate** donne la Resistance au poison (effet passif) et l'Advantage contre les maladies et l'état Poisoned ; il n'a besoin ni de manger, ni de boire, ni de respirer, ni de dormir, et passe 4 heures inactif, à demi conscient, pendant un Long Rest.

### Objets et invocations manquants

- **Items** reçoit les 22 objets magiques du wiki que dnd5e et le module n'avaient pas (37 fiches) : les cinq **Ashen Bands** (Courage, Destruction, Might, Vengeance, Wisdom) en leurs quatre paliers de rareté, Bauble of True Blood, Bloodvenom Blade, Fragment of Frozen Bone, Invincible's Reins, Light's Vengeance, Repulsion Shield, Ring of Maddening Whispers, Scroll of Protection, Scroll of Titan Summoning, Shadowfang, Shadowmourne, Shadow's Edge, Sundial of Eternal Dusk, Thrice Fanged Signet, Tiny Abomination in a Jar, Twin Blades of Azzinoth et Vithrak, Gaze of the Deadman. Nouveaux dossiers *Rings › Rare*, *Rings › Very Rare* et *Scrolls*.
- **Classes** reçoit, dans *Warlock › Eldritch Invocations*, les 7 invocations de World of Warcraft : Pact of the Legion, Call of the Void, Curse of Corruption, Expendable Minions, Health Funnel, Legion Summoning, Master Demonologist.

### Bastions

**Items** reçoit les installations de Bastion (*Bastion Facilities*, objets « facility » de dnd5e, à glisser sur l'onglet Bastion de la fiche) : les 6 installations de base et les 29 installations spéciales du Dungeon Master's Guide, et les 35 de Heroes of Faerûn, Forge of the Artificer, Ravenloft et Arcana Unleashed, rangées par niveau (5, 9, 13, 17), avec leur prérequis, leur espace, leurs employés et leur ordre. Le module ajoute à dnd5e les sous-types de ces nouvelles installations.

### Règles optionnelles

**Journals** reçoit *Règles optionnelles*, en français : Bastions (tours, ordres, événements, hantises), Renown (et la liste des factions), magie de cercle, professions et compagnons de World of Warcraft, objets magiques évolutifs, traits d'artefact et fabrication d'objets magiques.

### Journal du module

**Journals** reçoit *Compendium Owidyn*, un guide du module à la manière d'un livre de règles : présentation, classes et sous-classes, origines, sorts et objets, créatures, systèmes (Boutiques, Cuisine, Cartomancien, Héliarque), règles optionnelles, et une page *Changelog* qui reprend ces notes de version.

### Corrections

- **Héliarque** : les dégâts du Canon stellaire, du Projectile terminal, de l'Onde de pression, de l'Éruption coronaire et de la Singularité des Formes orbitales, ceux des Commandes incarnées du Corps orbital et la réduction de l'Implosion n'avaient plus de formule (dnd5e 6 rejetait `(@scale…)@scale…die` et l'effaçait) : ils lancent de nouveau leurs dés, par exemple `(3)d8 + 3`.
- **Cartomancien** : la classe avait deux Ability Score Improvements aux niveaux 4, 8, 12 et 16 (d'anciens identifiants de 15 caractères à côté des nouveaux). Le contenu passe en 0.4.1 : le compendium est corrigé, et au chargement par le MJ, chaque Cartomancien du monde perd ses ASI en double (un choix déjà fait est toujours gardé).

### Mise à jour

Aucune migration n'est nécessaire : les nouvelles species apparaissent dans **Species**, les backgrounds et dons dans **Backgrounds & Feats**, l'Artificer et les sous-classes dans **Classes** (prenez la sous-classe depuis le niveau 3 de la classe), les compagnons dans **Summons**, les installations de Bastion dans **Items**. Au premier chargement par le MJ, le contenu du Cartomancien est mis à jour et ses ASI en double retirés.

## 2.5.0

### Nouvel équipement

**Items** reçoit l'équipement 2024 de la liste du wiki que dnd5e n'a pas, avec quatre nouvelles catégories (*Adventuring Gear*, *Explosives*, *Tools*, *Mounts and Vehicles*) et *Weapons › Mundane* :

- **Armes** (D&D Beyond Drops, novembre 2026) : Pitchfork, Weighted Chain, Bola.
- **Armes à feu** (Dungeon Master's Guide) : Automatic Rifle, Hunting Rifle, Revolver, Semiautomatic Pistol et Shotgun (*Rare*), Antimatter Rifle, Laser Pistol et Laser Rifle (*Very Rare*), avec l'Energy Cell de ces dernières. Chaque attaque dépense un des tirs de l'arme et une munition ; **Reload** rend tous les tirs en Bonus Action, et l'Automatic Rifle a son **Burst Fire** (DD 15 en Dextérité, cube de 10 ft, 10 tirs).
- **Explosifs** (Dungeon Master's Guide, *Explosives › Rare*) : Bomb, Dynamite Stick, Grenade (Fragmentation et Smoke), Grenade Launcher, Gunpowder (Keg et Powder Horn), avec leur jet de sauvegarde, leurs dégâts et leur zone.
- **Équipement d'aventurier** : Bright Fungal Cloak (sa lumière s'allume sur le jeton), Desert Clothing, Devil Mask, Garb of Light and Shadow, Genie Robe, Locking Spellbook, Monster Camouflage, Warm Fungal Clothing, Winter Camouflage (Advantage en Stealth, effet à activer dans la neige).
- **Montures et véhicules** : les selles (Exotic, Military, Riding), Carriage, Cart, Chariot, Covered Wagon, Sled, Wagon et Feed, que dnd5e n'a qu'en règles 2014, et le Fuel des véhicules motorisés.
- **Véhicules** (*Creatures › Vehicles*) : les aéronefs d'Eberron (Lyrandar Air Cruiser, Lyrandar Skyskiff, Strider Airship) et les véhicules motorisés de World of Warcraft (Flying Machine, Goblin Trike, Mechano-Hog, Mekgineer’s Chopper).
- **Copies corrigées** : Chain, Herbalism Kit et Bagpipes, dont le poids est faux dans dnd5e (0, 8 et 1 lb au lieu de 10, 3 et 6 lb).
- Manquent le Giant Turtle, le Mechanostrider et le Sled Dog, dont le wiki ne donne pas le profil. Les poisons Carrion Crawler Mucus et Lolth's Sting sont dans dnd5e sous leur nom SRD (Crawler Mucus, Spider's Sting).

### Nouveaux dons

**Backgrounds & Feats** reçoit les dons 2024 de la liste du wiki que dnd5e n'a pas, en commençant par les 33 dons d'origine (*Feats › Origin Feats*) :

- **Player's Handbook** : Crafter, Healer, Lucky, Musician, Tavern Brawler, Tough.
- **Heroes of Faerûn** : Cult of the Dragon Initiate, Emerald Enclave Fledgling, Harper Agent, Lords' Alliance Agent, Purple Dragon Rook, Spellfire Spark, Tyro of the Gauntlet, Zhentarim Ruffian.
- **Ravenloft: The Horrors Within** : Sharp Eye, Survivor.
- **Lorwyn: First Light** : Child of the Sun, Shadowmoor Hexer.
- **Astarion's Book of Hungers** : Tireless Reveler, Vampire Hunter, Vampire's Plaything.
- **World of Warcraft** (espèce humaine) : Arathi Heritage, Child of the Sea, Will to Survive.
- **Arcana Unleashed** : Arcane Artist, Arcane Eloquence, Arcane Infiltrator, Arcane Omens, Arcane Overload, Arcane Safeguard, Arcane Undertaker, Portal Jumper, Transmuted Anatomy.

Les maîtrises, langues, résistances et sorts s'ajoutent par avancement ; les utilisations, jets de sauvegarde, soins, attaques et bonus (vitesse, points de vie, d4 de compétence) sont automatisés, et une note Foundry dit ce qui reste à faire à la main.

### Cuisine d'Aldraine

- **Dons** : *Cuisinier* (Origin Feat : Cook's Utensils, trois recettes de base au choix, un plat par Short ou Long Rest, Palais contre le poison des aliments) et *Master Chef* (General Feat, niveau 4+ : +1 en Constitution ou en Sagesse, 2 portions de plus, Advantage aux tests de cuisine, en-cas, risque maîtrisé).
- **Fenêtre « Cuisiner »** : elle lit les ingrédients de l'inventaire (sur une ou deux colonnes, groupés ou non par famille), montre l'effet d'une recette connue ou indique « Inconnue », remplit la marmite d'après une recette ou indique ce qui manque, lance le test de Cook's Utensils et crée le plat. Les recettes découvertes s'inscrivent au carnet du personnage. Une recette réussie cinq fois est maîtrisée : +1 à ses tests de cuisine. Les *Ustensiles de cuisinier de maître* (50 gp) donnent aussi +1.
- **Contenu** (*Items › Cuisine*) : 72 ingrédients, ceux du marché (ail, oignon, noix, épices, poivre, riz, poulet, porc, œufs, beurre, pommes de terre, carottes, crevettes, baies sauvages, champignon brun…) et les spécialités d'Asharia (Porces, Eupe, Tonther, Illibria, Vondris, Cynstefistone, la forteresse de Scolyancotis, Dereardrey, la Kinds et la forêt de Brumeveille), d'Enloden, de Colvan, de Baerdar, de Doshein, de Zerzatar, de l'Outreterre, de la Forêt de Sunilda, des Refuges des Lanternes, des nains, des elfes et des gobelins, et deux parties de monstres (ours-hibou, salamandre) ; 63 recettes libres ou strictes, rangées par origine, dont les plats du quotidien (poêlée terre-mer, soupe à l'oignon gratinée, poulet rôti à l'ail, pain perdu…) et les spécialités (Cassole du Roi, Bœuf Croydon, La Coulée d'or, Omelette aux truffes de Scolyancotis…) ; les plats spéciaux (grillade de survie, repas simple, plat douteux) et la table des défauts de goût ; vingt petits livres de deux à quatre recettes, du *Carnet du voyageur* à *La Table du Roi*, le livre de la cour de Vondris.
- **Défauts de goût** : un plat raté de peu garde un défaut (trop ou pas assez salé, sucré, épicé, amer, acide ou cuit), un plat raté de 5 ou plus en garde deux et perd son effet. Chaque défaut cache un malus, révélé au repas. Qui mange fait un jet de sauvegarde de Constitution : avec un défaut, une réussite garde l'effet du plat malgré le malus et une réussite de 5 ou plus évite le malus ; avec deux, une réussite n'en laisse qu'un et une réussite de 5 ou plus aucun.
- **Repas** : manger applique l'effet jusqu'au prochain Long Rest, en remplaçant le précédent. Le premier point de puissance fait l'effet du plat ; chaque autre point lui donne, au choix du cuisinier, un dé de plus (« puissance × d6 », du d4 des plats du quotidien au d12 des Œufs brouillés du griffon royal, au plus autant de dés que son bonus de maîtrise) ou une portion de plus. Les dés sont des PV temporaires, un bonus d'Initiative, une réserve d'Élans ou des PV rendus à la fin du prochain Short Rest par les plats revigorants ; un plat sans dés change ses autres points en portions.
- **Boutiques** : les ingrédients sont des vivres ou des herbes, pré-cochés à l'Équipement et à l'Apothicaire. Les Baies de Sunilda sont des ingrédients enchantés, pré-cochés seulement à La Hutte Enchantée.

### Nouvelle species : Kitsune, Air

Les Kitsune du monde Aldraine, remis au propre, en français et aux règles 2024 (*Species › Humanoid › Kitsune*, aptitudes dans *Species Features › Kitsune*), avec leur illustration :

- **Kitsune, Air** : Humanoid Medium, Speed 35 ft, Darkvision 60 ft, maîtrise d'Athletics, langue Keotal. **Sens du renard** : maîtrise de Perception et de Nature, et odorat affûté (Advantage aux Perception checks qui reposent sur l'odorat) sous forme véritable ou de renard seulement ; l'effet *Odorat du renard* se désactive sous forme humaine. Comme toute species 2024, elle ne donne plus d'augmentation de caractéristique ni le Common et une langue au choix, qui viennent de l'origine du personnage.
- **Sorts kitsune** : Command (**Contrôle**), Misty Step (**Aspect de l'Air**) et les cantrips *Éclat*. Intelligence, Wisdom ou Charisma, au choix quand on prend la species, sert à tous ; Command et Misty Step se lancent sans spell slot autant de fois qu'on a de queues par Long Rest, ou avec ses spell slots.
- **Queues de renard** : 1 queue au niveau 1, puis une de plus tous les deux niveaux jusqu'à 10. Chaque queue (Acid, Cold, Fire, Force, Lightning, Necrotic, Poison, Psychic, Radiant ou Thunder) donne son cantrip *Éclat* (1d8, 60 ft, avec son effet propre) et son type de dégâts aux **Griffes élémentaires** (1d6, Finesse) ; le jet de dégâts des griffes ne propose que les types de vos queues. **Esprit affûté** : Advantage contre Charmed.
- **Forme spirituelle** : activités *Forme humaine*, *Forme de renard* et *Forme véritable*. La forme véritable a la **Peur spirituelle** (Wisdom Saving Throw, DD 10 + queues, Frightened 1 minute) ; sous forme humaine, les griffes ne peuvent pas attaquer et l'odorat du renard est perdu. La forme de renard (le **Fox**, nouveau dans *Creatures (Legacy) › Beast*, avec son illustration et son jeton) se fait comme le Wild Shape 2024 : le personnage garde ses Hit Points, ses caractéristiques mentales, sa classe, ses aptitudes, ses Griffes élémentaires, ses spells, ses langues et ses maîtrises, et gagne 5 Temporary Hit Points par queue (de 5 au niveau 1 à 50 au niveau 19).
- **Surcharge spirituelle** : lancer un sort kitsune sous forme humaine ou de renard lance tout seul le jet (1d20 + Constitution), qui coche ou décoche les cases (queues + 1, vidées au Long Rest). Le jet et son résultat sont cachés aux autres joueurs : seuls le joueur du personnage et le MJ les voient. Toutes cochées, le **Débordement spirituel** rend la forme véritable, ajoute 1 niveau d'Exhaustion et bloque les sorts kitsune pendant 5 rounds. La macro et les modules Effect Macro et Midi-QOL ne sont plus nécessaires.
- La langue **Keotal** est ajoutée aux langues exotiques si le monde ne l'a pas déjà.

### Nouvelles sous-classes (2014)

Nouveau compendium **Classes (Legacy)**, dans le dossier *Owidyn's Source Compendium Legacy* : deux sous-classes des règles 2014, rangées comme celles de Classes (*Paladin › Oath of the Ancients*, *Rogue › Revived*, chacune avec ses *Subclass Features*).

- **Oath of the Ancients** (*Paladin*, Player's Handbook 2014) : ses sorts de serment s'ajoutent toujours préparés aux niveaux 3, 5, 9, 13 et 17. Nature's Wrath et Turn the Faithless dépensent le Channel Divinity du Paladin 2014 et posent leur effet (Restrained, Turned) sur un échec. Aura of Warding pose un rappel de résistance aux sorts sur les alliés de l'aura (10 ft, 30 ft au niveau 18) ; Undying Sentinel ramène à 1 point de vie une fois par long rest ; Elder Champion transforme pour 1 minute et rend 10 points de vie au début de chaque tour.
- **Revived** (*Rogue*, Unearthed Arcana 64) : Revived Nature donne la résistance au poison ; Bolts from the Grave est une attaque de sort à distance qui inflige les dés de Sneak Attack plus le modificateur de Dextérité en dégâts nécrotiques ; Connect with the Dead lance Speak with Dead (Intelligence, sans emplacement ni composante matérielle, une fois par short rest) puis tire au d3 sa capacité ; Audience with Death donne l'Advantage aux jets contre la mort ; Ethereal Jaunt téléporte à 30 ft avec la Cunning Action.
- **Ensnaring Strike** (version 2014), sort de serment des Anciens absent de dnd5e, rejoint **Spells (Legacy)** › *1st Level* : on le lance en Bonus Action avant de frapper, et la cible fait son jet de Strength depuis la carte du sort quand l'attaque touche. Les boutiques gardent le parchemin de la version 2024 : à nom égal, le contenu Legacy d'Owidyn passe après celui de dnd5e 2024.

### Créatures de FP 4 et 5

**Creatures** reçoit les monstres 2024 de FP 4 et 5 (Monster Manual 2024, d'après AideDD), comparés un à un à ceux de dnd5e :

- **Nouvelles créatures** : les 21 monstres absents de dnd5e : Aarakocra Aeromancer, Banshee, Barlgura, Beholder Zombie, Bone Naga, Cambion, Flameskull, Giant Axe Beak, Gnoll Fang of Yeenoghu, Helmed Horror, Juvenile Shadow Dragon, Lizardfolk Sovereign, Mezzoloth, Pixie Wonderbringer, Red Slaad, Revenant, Sahuagin Baron, Shadow Demon, Swarm of Dretches, Umber Hulk et Young Remorhaz. Les attaques, jets de sauvegarde, recharges, utilisations par jour, états, tests pour s'échapper d'une prise, régénérations et sorts innés sont automatisés, et les aptitudes courantes (Magic Resistance, Incorporeal Movement, Shadow Stealth, Undead Fortitude…) sont celles de dnd5e. Les rayons du Beholder Zombie et la table du Confusing Gaze de l'Umber Hulk tiennent chacun en une aptitude, comme les Eye Rays du Spectator.
- **Créatures corrigées** : 25 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dégâts : Barbed Devil (Claws perforant, Tail tranchant), Otyugh (Tentacle Slam contondant ; dnd5e n'a pas de type de dégâts).
  - Règles : Couatl (Divine Aid 2/jour : Bless, Lesser Restoration, Sanctuary), Fire Elemental (Fiery Aura touche toutes les créatures de l'émanation), Ghost (Possession en Recharge 6), Giant Shark (Initiative +3), Shambling Mound (Stealth +3), Succubus (Charm sans recharge), Werebear et Wereboar (DD de la morsure et du Gore sur la Constitution : 14 et 12).
  - Fiche : immunités aux états (Ettin, Gorgon), télépathie 120 ft (Couatl, Otyugh, Unicorn), langues (Chuul et Flesh Golem comprennent sans parler, Otyugh), sous-type Dinosaur (Archelon, Triceratops), alignement « Any Alignment » (Tough Boss), vitesses des formes animales (Werebear, Wereboar, Weretiger), Darkvision que les Ténèbres magiques ne gênent pas (Barbed Devil), résistance du Half-Dragon au type de son Draconic Origin, habitats (Air Elemental, Giant Crocodile), nom du Gore du Wereboar.
  - Description absente de dnd5e, reformulée : Black Pudding, Bulette, Gorgon, Salamander.
- **Identiques à dnd5e**, donc pas copiés : Bullywug Bog Sage, Earth Elemental, Elephant, Gladiator, Guard Captain, Hill Giant, Hippopotamus, Incubus, Lamia, Night Hag, Red Dragon Wyrmling, Roper, Troll, Vampire Spawn, Water Elemental, Wraith, Xorn.
- **Creature Features** reçoit les aptitudes des nouvelles créatures. Une aptitude garde la créature dont elle vient : les Eye Rays restent ceux du Spectator, même si le Beholder Zombie passe avant lui dans l'ordre alphabétique.

### Créatures de FP 6 à 8

- **Nouvelles créatures** : les 34 monstres absents de dnd5e : Aberrant Cultist, Azer Pyromancer, Bandit Deceiver, Berserker Commander, Blue Slaad, Centaur Warden, Chasme, Cockatrice Regent, Cyclops Sentry, Death Cultist, Elemental Cultist, Fiend Cultist, Fomorian, Galeb Duhr, Ghast Gravecaller, Giant Squid, Githyanki Knight, Githzerai Zerth, Gnoll Demoniac, Graveyard Revenant, Green Slaad, Grick Ancient, Hobgoblin Warlord, Kuo-toa Archpriest, Merfolk Wavebender, Mind Flayer, Performer Maestro, Satyr Revelmaster, Sphinx of Secrets, Thri-kreen Psion, Tree Blight, Vampire Nightbringer, Violet Fungus Necrohulk et Yuan-ti Abomination. Leur équipement (armures, boucliers, armes, baguette) vient des monstres de dnd5e, et leurs armes sont celles de leurs attaques. Destructive Wave (Kuo-toa Archpriest) et Synaptic Static (Thri-kreen Psion), absents de dnd5e, se lancent depuis **Spells**. Les deux chants du Fey Melody du Satyr Revelmaster sont deux jets de sauvegarde d'une même aptitude. Le Primeval Owlbear manque : AideDD ne donne que le nom de ses aptitudes.
- **Créatures corrigées** : 11 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dégâts : Frost Giant (Frost Axe tranchant ; dnd5e n'a pas de type de dégâts), Spirit Naga (Necrotic Ray sur l'Intelligence : +6 au lieu de +7).
  - Règles : Initiative avec le bonus de maîtrise (Giant Ape, Mammoth, Tyrannosaurus Rex), allonge du Bite du Spirit Naga (10 ft) et du Tail du Tyrannosaurus Rex (15 ft).
  - Fiche : immunité à Frightened (Cloaker), alignement « Any Alignment » (Pirate Captain), langues (Shield Guardian : comprend les ordres sans parler), habitats du Spirit Naga (Planar (Lower Planes) et Underdark, mêlés en un seul dans dnd5e), sous-type Dinosaur (Tyrannosaurus Rex).
  - Description absente de dnd5e, reformulée : Assassin, Young Brass Dragon, Young Bronze Dragon.
- **Diables** : leur Darkvision n'est pas gênée par les Ténèbres magiques, ce que dnd5e n'indique sur aucun d'eux. Imp, Bearded Devil et Chain Devil sont copiés avec cette mention, et la copie du Lemure la reçoit.
- **Identiques à dnd5e**, donc pas copiés : Chimera, Drider, Hezrou, Hydra, Invisible Stalker, Mage, Medusa, Oni, Stone Giant, Vrock, Wyvern, Young Black Dragon, Young Copper Dragon, Young Green Dragon, Young White Dragon.

### Créatures de FP 9 à 12

- **Nouvelles créatures** : les 24 monstres absents de dnd5e : Abominable Yeti, Arcanaloth, Archpriest, Bandit Crime Lord, Brazen Gorgon, Cultist Hierophant, Cyclops Oracle, Dao, Death Knight Aspirant, Death Slaad, Dire Worg, Githzerai Psion, Gray Slaad, Haunting Revenant, Marid, Mind Flayer Arcanist, Noble Prodigy, Nycaloth, Performer Legend, Pirate Admiral, Questing Knight, Spy Master, Warrior Commander et Yochlol. Jallarzi's Storm of Radiance (Cultist Hierophant) et Destructive Wave (Death Knight Aspirant) se lancent depuis **Spells**. Les effets au choix d'une attaque (Awestruck et Poison du Scimitar du Pirate Admiral, Sap et Maneuver du Greatsword du Warrior Commander) sont décrits dans l'arme.
- **Créatures corrigées** : 14 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dégâts : Behir (Lightning Breath de 12d10, et non 12d6), Horned Devil (Infernal Tail sur la Force : 1d8 + 6), Young Silver Dragon (Rend tranchant), Stone Golem (Force Bolt sur la Constitution : +9 au lieu de +10).
  - Règles : Aboleth (Tentacle à 15 ft d'allonge), Archmage (Initiative avec le bonus de maîtrise, et non l'Intelligence), Clay Golem (vitesse de 20 ft), Guardian Naga (Bite à 10 ft d'allonge), Young Red Dragon (Fire Breath en Recharge 5–6 ; dnd5e ne donne pas de valeur).
  - Fiche : Deva (sous-type Angel, immunité à Charmed, Exhaustion et Frightened, télépathie 120 ft), Djinni (Chaotic Good), Horned Devil (pas de résistance au froid), Archmage (Charmed avec Mind Blank), Aboleth (télépathie rangée comme telle), Stone Golem (comprend sans parler), Bone Devil et Horned Devil (Darkvision que les Ténèbres magiques ne gênent pas).
  - Description absente de dnd5e, reformulée : Remorhaz, Young Blue Dragon.
- **Identiques à dnd5e**, donc pas copiés : Cloud Giant, Efreeti, Erinyes, Fire Giant, Glabrezu, Roc, Sphinx of Lore, Treant, Young Gold Dragon.
- Le Tree Blight (FP 6 à 8) n'inflige plus les dégâts de Grasping Root dès le jet raté : ils tombent au début de chaque tour de la cible agrippée.

### Créatures de FP 13 à 16

- **Nouvelles créatures** : les 7 monstres absents de dnd5e : Death Tyrant, Githyanki Dracomancer, Gulthias Blight, Salamander Inferno Master, Shadow Dragon, Ultroloth et Vampire Umbral Lord. Les actions légendaires dépensent les utilisations du monstre (3, ou 4 dans son repaire) et la Legendary Resistance est celle de dnd5e, comme chez les dragons adultes. Les dix rayons du Death Tyrant tiennent en une aptitude, et Hunger of Hadar (Vampire Umbral Lord) se lance depuis **Spells**, au niveau 5. Le Beholder manque : AideDD ne donne aucune de ses aptitudes.
- **Créatures corrigées** : 13 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dragons adultes : sous-type Chromatic (Black, Blue, Green, White) ou Metallic (Brass, Bronze, Copper, Silver), comme leurs jeunes dans dnd5e ; souffle en Recharge 5–6 (Blue, Copper ; dnd5e ne donne pas de valeur) ; Rend à 10 ft d'allonge (Brass, Green, Silver) ; descriptions absentes de dnd5e (Blue, Brass, Bronze, Green, White).
  - Dégâts : Mummy Lord (Dreadful Glare de 6d6 + 4, et non 6d8 ; description reformulée), Purple Worm (Tail Stinger perforant ; dnd5e n'a pas de type de dégâts), Iron Golem (Fiery Bolt sur la Constitution : +10 au lieu de +12 ; comprend sans parler).
  - Fiche : Planetar (sous-type Angel, immunité à Charmed, Exhaustion et Frightened, télépathie 120 ft), Rakshasa (immunité à Charmed et Frightened).
- **Identiques à dnd5e**, donc pas copiés : Ice Devil, Marilith, Nalfeshnee, Storm Giant, Vampire.

### Créatures de FP 17 et plus

- **Nouvelles créatures** : les 7 monstres absents de dnd5e : Arch-hag, Colossus, Death Knight, Demilich, Dracolich, Empyrean et Goristro, avec leurs actions légendaires et leur Legendary Resistance. L'Empyrean, « Celestial or Fiend » dans le Monster Manual, est rangé dans *Celestial* ; son Divine Ray inflige au choix des dégâts nécrotiques ou radiants. Manquent l'Animal Lord, le Blob of Annihilation et l'Elemental Cataclysm : AideDD ne donne aucune de leurs aptitudes.
- **Créatures corrigées** : 17 monstres de dnd5e dont la fiche diffère sont copiés avec la correction.
  - Dragons : sous-type Chromatic ou Metallic (Adult Gold, Adult Red, Ancient Black, Blue, Brass, Bronze, Copper) ; Weakening Breath de l'Adult Gold Dragon au DD 21 (13 dans dnd5e) ; Ancient Gold Dragon avec ses jets de sauvegarde de Dextérité et de Sagesse, son Initiative (+16) et 4 Legendary Resistances ; souffle en Recharge 5–6 (Ancient Copper, Gold et Green ; dnd5e ne donne pas de valeur) ; Rend à 15 ft d'allonge (Ancient Black, Green) ; Freezing Burst de l'Ancient White Dragon au DD 20 ; descriptions absentes de dnd5e (Adult Gold, Ancient Blue, Brass, Bronze, Gold, White).
  - Règles : Balor (demi-dégâts au Death Throes réussi), Pit Fiend (Bite à 10 ft d'allonge, jet de Constitution ; dnd5e ne donne pas de caractéristique), Kraken (Tentacle à 30 ft d'allonge), Dragon Turtle (Bite à 15 ft d'allonge), Tarrasque (Thunderous Bellow en Recharge 5–6, et non 6).
  - Fiche : Solar (sous-type Angel, télépathie 120 ft), Lich (toutes les langues, comme le Couatl de dnd5e ; description reformulée).
- **Identiques à dnd5e**, donc pas copiés : Ancient Red Dragon, Ancient Silver Dragon, Sphinx of Valor.
- **Creature Features** passe à 252 aptitudes, dont 16 actions légendaires.

### Boutiques

Les boutiques changent de forme : elles ne sont plus des tables et des pages de journal, mais des fenêtres où les joueurs achètent eux-mêmes.

- **Onglet Boutiques** dans la barre latérale, juste après le Journal : la liste des boutiques, avec pour le MJ le bouton **Créer une boutique**, l'œil qui les montre ou les cache aux joueurs et la corbeille. Les joueurs ne voient que les boutiques montrées.
- **Formulaire de création** : modèle (La Hutte Enchantée, Équipement, Forge, Apothicaire, Écurie, L'Auberge), nom, description, nombre d'articles, valeur (50 %, 100 % ou 150 %), articles autorisés et compendiums où les chercher. Le formulaire défile, son bouton reste en bas. Les compendiums sont lus à chaque création : il n'y a plus de tables à mettre à jour.
- **Articles autorisés** : la liste complète, comme le choix des maîtrises de dnd5e. Les groupes (Armes, Armures, Équipement d'aventurier, Outils, Apothicaire, Objets magiques, Écurie, Services, Rareté des objets) cochent tous leurs articles, qu'on peut ensuite décocher un par un. Le modèle ne fait que pré-cocher la liste, sans les objets très rares et légendaires : une Forge peut aussi vendre des potions. Un objet magique est rangé dans sa sorte (une épée +1 avec les armes) et filtré par sa rareté ; les services cochés sont tous proposés, en plus des articles tirés.
- **Fenêtre de la boutique** : une ligne par article ou service, avec le nombre disponible, le prix et un bouton **Acheter** ; le nom d'un article ouvre sa fiche, celui d'un service de L'Auberge a un lien vers ses règles. Le MJ y change les nombres (vide : illimité), les prix et leur monnaie, retire des lignes, ajoute un service ou glisse un objet, un sort (vendu en parchemin) ou une créature, tire un **Nouveau stock** avec les mêmes réglages, et renomme la boutique.
- **Acheter** paie avec la bourse du personnage choisi, convertie si besoin (une pièce plus grosse est cassée et la monnaie rendue), puis pose l'objet sur sa fiche (ajouté à sa pile pour un consommable ou un butin), crée le parchemin à partir de son sort ou la monture, qui appartient au joueur, dans le dossier d'acteurs *Boutiques — Montures*. L'achat d'un objet ou d'un service est annoncé dans le chat. Sans assez d'argent, un message le dit au joueur, avec le contenu de sa bourse. Les achats sont faits par le MJ connecté, un par un, pour que le dernier exemplaire ne soit vendu qu'une fois.
- Un objet magique, un parchemin ou une monture est en vente à un exemplaire, un autre objet à 1 à 5 exemplaires, un service sans limite.
- Le bouton **Boutiques** de l'onglet Tables, les tables de catégories et les pages de stock disparaissent. Le bouton **Régénérer le stock** des anciennes pages n'est plus affiché.

### Cartomancien

- **Tarots**, nouvelle aptitude de niveau 1 : comme **Cuisiner** pour la cuisine, elle ouvre le gestionnaire du deck, de la main et de la défausse, sans passer par le menu de l'en-tête de la fiche (qui garde son entrée **Cartomancien**). Sa description rappelle les cartes encore dans le deck, celles de la main et le nombre de cartes défaussées ; elle se met à jour après chaque pioche, carte jouée ou repos.
- **Onglet Cartes** : le deck, la main et la défausse de chaque Cartomancien sont rangés dans le dossier *Cartomancien › <personnage>*, dès leur création ; ceux des personnages existants y sont rangés à l'ouverture du monde par le MJ. Le dossier prend le nouveau nom du personnage et disparaît avec sa dernière pile ; une pile ou un dossier déplacé par le MJ reste où il est.

### Compendiums masqués aux joueurs

- Tous les compendiums sont masqués aux joueurs, comme l'étaient déjà Creatures et Creature Features : ils ne les voient plus dans l'onglet Compendiums ni dans le Compendium Browser, et n'ouvrent plus leurs fiches depuis un lien.
- Ce que le jeu leur donne fonctionne toujours : avancements de classe et de sous-classe, invocations de Summons, sorts lancés par une aptitude ou un objet, Cartomancien, Formes de l'Héliarque, et boutiques, dont la fenêtre montre la fiche de chaque article.
- **Boutiques** : la version Owidyn d'un objet reste celle qu'elles vendent, même masquée ; seul le compendium masqué d'un autre module passe en dernier.

### Corrections

- **Concentration** : les activités qui suivent le lancement d'un sort à Concentration (dégâts au début d'un tour, nouveau jet de sauvegarde…) relançaient la Concentration, ce qui mettait fin à celle du sort et retirait ses effets. Elles n'y touchent plus : 53 activités de 45 sorts de Spells (Witch Bolt, Crown of Madness, Hunger of Hadar, Dirge…).
- **Téléportation** : Rescue, Steel Wind Strike et Lay Waste téléportent à leur distance ; Lay Waste ne déplaçait pas du tout (0 ft).
- **Icônes** : des attaques de 19 créatures et 17 Creature Features (Claw, Bone Flail, Branch…) avaient une icône qui n'existe pas dans Foundry ; elles ont maintenant celle des coups tranchants (*strike-slashes-red*). Toutes les images des compendiums existent désormais.

### Mise à jour

Aucune migration n'est nécessaire : Classes (Legacy) apparaît dans le dossier *Owidyn's Source Compendium Legacy*. Un compendium dont la visibilité a déjà été réglée dans un monde (clic droit › *Configurer les droits*) garde ce réglage. Au premier lancement par le MJ, chaque Cartomancien du monde reçoit l'aptitude **Tarots**. Les boutiques sont à recréer dans le nouvel onglet ; les anciennes peuvent être supprimées : le dossier de tables *Boutiques*, le journal *Boutiques* et le dossier d'objets *Boutiques — Parchemins*.

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
