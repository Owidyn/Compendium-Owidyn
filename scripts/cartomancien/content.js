export const MODULE_ID = "compendium-owidyn";
export const CONTENT_VERSION = "0.3.0";

export const CARTOMANCIEN_SPELLS = {
  0: [
    "Acid Splash", "Chill Touch", "Dancing Lights", "Friends", "Guidance", "Gust", "Light", "Mage Hand",
    "Mending", "Message", "Minor Illusion", "Poison Spray", "Prestidigitation", "Shocking Grasp", "Magic Stone",
    "Lightning Lure"
  ],
  1: [
    "Alarm", "Bane", "Burning Hands", "Charm Person", "Chromatic Orb", "Color Spray", "Command", "Compelled Duel",
    "Comprehend Languages", "Cure Wounds", "Disguise Self", "Faerie Fire", "Fog Cloud", "Hex", "Inflict Wounds",
    "Magic Missile", "Ray of Sickness", "Silent Image", "Sleep", "Thunderwave", "Unseen Servant", "Witch Bolt",
    "Cause Fear"
  ],
  2: [
    "Aganazzar's Scorcher", "Aid", "Alter Self", "Augury", "Blindness/Deafness", "Cloud of Daggers", "Darkness",
    "Darkvision", "Detect Thoughts", "Enhance Ability", "Enthrall", "Gust of Wind", "Hold Person", "Invisibility",
    "Lesser Restoration", "Locate Object", "Mirror Image", "Misty Step", "Moonbeam", "Nystul's Magic Aura",
    "Ray of Enfeeblement", "Scorching Ray", "See Invisibility", "Shadow Blade", "Shatter", "Silence",
    "Snilloc's Snowball Swarm", "Suggestion", "Zone of Truth", "Pyrotechnics", "Warding Wind"
  ],
  3: [
    "Animate Dead", "Bestow Curse", "Clairvoyance", "Counterspell", "Daylight", "Dispel Magic", "Fear", "Fireball",
    "Fly", "Haste", "Hypnotic Pattern", "Life Transference", "Lightning Bolt", "Major Image", "Nondetection",
    "Remove Curse", "Sending", "Sleet Storm", "Slow", "Speak with Dead", "Tongues", "Vampiric Touch"
  ],
  4: [
    "Dominate Beast", "Arcane Eye", "Banishment", "Blight", "Charm Monster", "Confusion", "Death Ward",
    "Dimension Door", "Black Tentacles", "Freedom of Movement", "Greater Invisibility", "Hallucinatory Terrain",
    "Ice Storm", "Locate Creature", "Polymorph", "Shadow of Moil", "Sickening Radiance", "Wall of Fire",
    "Watery Sphere", "Vitriolic Sphere"
  ],
  5: [
    "Animate Objects", "Cone of Cold", "Contact Other Plane", "Contagion", "Danse Macabre", "Dream", "Enervation",
    "Greater Restoration", "Hold Monster", "Legend Lore", "Mass Cure Wounds", "Mislead", "Modify Memory",
    "Negative Energy Flood", "Scrying", "Teleportation Circle", "Immolation"
  ],
  6: [
    "Arcane Gate", "Chain Lightning", "Circle of Death", "Create Undead", "Disintegrate", "Eyebite", "Flesh to Stone",
    "Globe of Invulnerability", "Guards and Wards", "Mass Suggestion", "Otto's Irresistible Dance", "Sunbeam",
    "True Seeing", "Mental Prison", "Scatter", "Soul Cage"
  ],
  7: [
    "Finger of Death", "Fire Storm", "Mirage Arcane", "Plane Shift", "Prismatic Spray", "Project Image",
    "Reverse Gravity", "Teleport", "Crown of Stars"
  ],
  8: ["Antimagic Field", "Earthquake", "Feeblemind", "Maze", "Sunburst", "Abi-Dalzim's Horrid Wilting"],
  9: ["Power Word Kill", "Prismatic Wall", "Time Stop", "Wish"]
};

// Compendiums of the Owidyn module: the class goes into the shared Item compendium (Class › Cartomancien).
const CONTENT_PACK_ID = `${MODULE_ID}.compendium-owidyn`;
const SPELL_LIST_PACK_ID = `${MODULE_ID}.journaux`;
const CLASS_FOLDER = /^class(e|es)?$/i;
const documentId = id => String(id).padEnd(16, "0");

const IDS = Object.fromEntries(Object.entries({
  class: "CrtmClass0000001",
  subclassParieur: "CrtmPari00000001",
  spellcasting: "CrtmFeatSpell001",
  mainMagique: "CrtmFeatMain0001",
  lancerCartes: "CrtmFeatLancer01",
  styleDeck: "CrtmFeatStyle001",
  influx: "CrtmFeatInflux01",
  coupEclat: "CrtmFeatEclat001",
  carteDivine: "CrtmFeatDivine01",
  parieurMain: "PariFeatMain0001",
  parieurSuite: "PariFeatSuite001",
  parieurMiser: "PariFeatMiser001",
  parieurContre: "PariFeatContre01",
  parieurDouble: "PariFeatDouble01",
  parieurJackpot: "PariFeatJackpot1",
  parieurDestin: "PariFeatDestin01",
  spellJournal: "CrtmJournal00001",
  spellPage: "CrtmSpellList001",
  folderClass: "CrtmFolderClass1",
  folderFeatures: "CrtmFolderFeat01",
  folderParieur: "CrtmFolderPari01",
  folderJournal: "CrtmFolderJrnl01"
}).map(([key, value]) => [key, documentId(value)]));

const normalize = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[’‘`]/g, "'")
  .toLowerCase()
  .trim();

const slug = (value = "") => normalize(value)
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

function contentUuid(id) {
  return `Compendium.${CONTENT_PACK_ID}.Item.${id}`;
}

const ASSET_ROOT = `modules/${MODULE_ID}/assets/cartomancien`;
const ASSETS = {
  class: `${ASSET_ROOT}/cartomancien.svg`,
  subclass: `${ASSET_ROOT}/parieur.svg`,
  feature: `${ASSET_ROOT}/feature-card.svg`,
  jackpot: `${ASSET_ROOT}/jackpot.svg`,
  card: `${ASSET_ROOT}/tarot-card.svg`,
  back: `${ASSET_ROOT}/tarot-back.svg`
};

function itemUses(max = "", recovery = []) {
  return { max: String(max ?? ""), spent: 0, recovery };
}

function itemUseTarget(value = 1) {
  return { type: "itemUses", value: String(value), target: "", scaling: {} };
}

function utilityActivity(id, name, {
  activation = "special",
  activationCondition = "",
  consumeItemUses = 0,
  effects = [],
  roll = "",
  rollName = "",
  chatFlavor = "",
  duration = null,
  targetSelf = false
} = {}) {
  const data = {
    _id: documentId(id),
    type: "utility",
    name,
    activation: { type: activation, value: null, override: false, condition: activationCondition },
    consumption: {
      targets: consumeItemUses ? [itemUseTarget(consumeItemUses)] : [],
      scaling: { allowed: false, max: "" },
      spellSlot: false
    },
    description: { chatFlavor },
    duration: duration ?? { units: "inst", override: false },
    effects: effects.map(_id => ({ _id: documentId(_id) })),
    range: { override: false },
    target: {
      prompt: false,
      template: { contiguous: false, units: "ft" },
      affects: { choice: false, ...(targetSelf ? { type: "self" } : {}) },
      override: false
    },
    roll: { formula: roll, name: rollName, prompt: false, visible: Boolean(roll) },
    uses: { spent: 0, recovery: [], max: "" },
    sort: 0,
    flags: { [MODULE_ID]: { cartomancien: { generated: true, contentKey: id } } }
  };
  return data;
}

function effectChange(_id, key, value, type = "add") {
  return { _id: documentId(_id), key, value, priority: null, type, phase: "initial" };
}

function activeEffect(id, name, {
  img = ASSETS.feature,
  description = "",
  duration = {},
  changes = [],
  flags = {}
} = {}) {
  return {
    _id: documentId(id),
    name,
    img,
    type: "base",
    disabled: false,
    transfer: false,
    duration: { ...duration, expired: false },
    tint: "#ffffff",
    description,
    statuses: [],
    system: { changes, magical: true },
    sort: 0,
    start: null,
    showIcon: 1,
    flags: { [MODULE_ID]: { cartomancien: { generated: true, contentVersion: CONTENT_VERSION, ...flags } } }
  };
}

function featureData(id, name, description, {
  requirements = "",
  img = ASSETS.feature,
  identifier = "",
  uses = null,
  activities = [],
  effects = []
} = {}) {
  return {
    _id: id,
    name,
    type: "feat",
    img,
    system: {
      description: { value: description },
      requirements,
      identifier: identifier || slug(name),
      type: { value: "class", subtype: "" },
      uses: uses ?? itemUses(),
      activities: activities.reduce((obj, activity) => (obj[activity._id] = activity, obj), {})
    },
    effects,
    flags: { [MODULE_ID]: { cartomancien: { contentKey: id, contentVersion: CONTENT_VERSION } } }
  };
}

const CLASS_DESCRIPTION = `
<h2>Le Cartomancien</h2>
<p>Le Cartomancien lance ses sorts à travers un deck de tarot. Ses cartes remplacent ses Spell Slots : chaque Arcane possède un niveau de sort fixe et permet de lancer un sort préparé de ce niveau.</p>
<p><strong>Hit Die :</strong> d6<br>
<strong>Saving Throws :</strong> Intelligence, Wisdom<br>
<strong>Armor Training :</strong> Light Armor<br>
<strong>Weapons :</strong> Simple Weapons<br>
<strong>Tools :</strong> Playing Cards Set, Dice Set<br>
<strong>Skills :</strong> choisissez 1 parmi Arcana, Deception, History, Insight, Investigation, Perception, Performance, Persuasion et Sleight of Hand.<br>
<strong>Spellcasting Ability :</strong> Intelligence</p>
<p><strong>Points de vie :</strong> 6 + Constitution au niveau 1 ; puis 1d6 (ou 4) + Constitution par niveau.<br><strong>Équipement de départ :</strong> deck de tarot (Spellcasting Focus), Playing Cards Set et Dice Set.</p>
<p><strong>Amélioration de caractéristique :</strong> niveaux 4, 8, 12 et 16. <strong>Epic Boon :</strong> niveau 19.</p>
<h3>Progression du deck</h3>
<table>
<thead><tr><th>Niv.</th><th>PB</th><th>Cantrips</th><th>Deck</th><th>Cartes par niveau de sort (1–9)</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>3</td><td>2</td><td>2 / — / — / — / — / — / — / — / —</td></tr>
<tr><td>2</td><td>+2</td><td>3</td><td>3</td><td>3 / — / — / — / — / — / — / — / —</td></tr>
<tr><td>3</td><td>+2</td><td>3</td><td>6</td><td>4 / 2 / — / — / — / — / — / — / —</td></tr>
<tr><td>4</td><td>+2</td><td>4</td><td>7</td><td>4 / 3 / — / — / — / — / — / — / —</td></tr>
<tr><td>5</td><td>+3</td><td>4</td><td>9</td><td>4 / 3 / 2 / — / — / — / — / — / —</td></tr>
<tr><td>6</td><td>+3</td><td>4</td><td>10</td><td>4 / 3 / 3 / — / — / — / — / — / —</td></tr>
<tr><td>7</td><td>+3</td><td>4</td><td>11</td><td>4 / 3 / 3 / 1 / — / — / — / — / —</td></tr>
<tr><td>8</td><td>+3</td><td>4</td><td>12</td><td>4 / 3 / 3 / 2 / — / — / — / — / —</td></tr>
<tr><td>9</td><td>+4</td><td>4</td><td>14</td><td>4 / 3 / 3 / 3 / 1 / — / — / — / —</td></tr>
<tr><td>10</td><td>+4</td><td>5</td><td>15</td><td>4 / 3 / 3 / 3 / 2 / — / — / — / —</td></tr>
<tr><td>11</td><td>+4</td><td>5</td><td>16</td><td>4 / 3 / 3 / 3 / 2 / 1 / — / — / —</td></tr>
<tr><td>12</td><td>+4</td><td>5</td><td>16</td><td>4 / 3 / 3 / 3 / 2 / 1 / — / — / —</td></tr>
<tr><td>13</td><td>+5</td><td>5</td><td>17</td><td>4 / 3 / 3 / 3 / 2 / 1 / 1 / — / —</td></tr>
<tr><td>14</td><td>+5</td><td>5</td><td>17</td><td>4 / 3 / 3 / 3 / 2 / 1 / 1 / — / —</td></tr>
<tr><td>15</td><td>+5</td><td>5</td><td>18</td><td>4 / 3 / 3 / 3 / 2 / 1 / 1 / 1 / —</td></tr>
<tr><td>16</td><td>+5</td><td>5</td><td>18</td><td>4 / 3 / 3 / 3 / 2 / 1 / 1 / 1 / —</td></tr>
<tr><td>17</td><td>+6</td><td>5</td><td>19</td><td>4 / 3 / 3 / 3 / 2 / 1 / 1 / 1 / 1</td></tr>
<tr><td>18</td><td>+6</td><td>5</td><td>20</td><td>4 / 3 / 3 / 3 / 3 / 1 / 1 / 1 / 1</td></tr>
<tr><td>19</td><td>+6</td><td>5</td><td>21</td><td>4 / 3 / 3 / 3 / 3 / 2 / 1 / 1 / 1</td></tr>
<tr><td>20</td><td>+6</td><td>5</td><td>22</td><td>4 / 3 / 3 / 3 / 3 / 2 / 2 / 1 / 1</td></tr>
</tbody>
</table>
<h3>Cartes ajoutées</h3>
<p><strong>Niveau 1 :</strong> 0 — Le Fou, I — Le Magicien.<br>
<strong>2 :</strong> II — La Papesse.<br>
<strong>3 :</strong> III — L'Impératrice, IV — L'Empereur, V — Le Hiérophante.<br>
<strong>4 :</strong> VI — L'Amoureux.<br>
<strong>5 :</strong> VII — Le Chariot, VIII — La Force.<br>
<strong>6 :</strong> IX — L'Hermite. <strong>7 :</strong> X — La Roue de Fortune. <strong>8 :</strong> XI — La Justice.<br>
<strong>9 :</strong> XII — Le Pendu, XIII — La Mort. <strong>10 :</strong> XIV — Tempérance. <strong>11 :</strong> XVI — La Tour.<br>
<strong>13 :</strong> XVIII — La Lune. <strong>15 :</strong> XX — Le Jugement. <strong>17 :</strong> XXI — Le Monde.<br>
<strong>18 :</strong> XV — Le Diable. <strong>19 :</strong> XVII — L'Étoile. <strong>20 :</strong> XIX — Le Soleil.</p>
<h3>Numéro de carte et niveau de sort</h3>
<p>1 : 0, I, II, III · 2 : IV, V, VI · 3 : VII, VIII, IX · 4 : X, XI, XII · 5 : XIII, XIV, XV · 6 : XVI, XVII · 7 : XVIII, XIX · 8 : XX · 9 : XXI.</p>`;

const SUITE_EFFECT_ID = "PariEffSuite0001";
const SUITE_EFFECT = activeEffect(SUITE_EFFECT_ID, "Suite favorable", {
  img: ASSETS.subclass,
  description: `<p>Votre tirage après un Long Rest forme une suite. Pendant 24 heures, vous ajoutez <strong>1d4</strong> à vos Ability Checks, Saving Throws et Attack Rolls. Les jets avec Playing Cards et Dice ont Advantage.</p><p>Sélectionnez également Advantage contre Frightened/Charmed et pour les autres jeux de hasard lorsque la situation l'exige.</p>`,
  duration: { value: 86400, units: "seconds" },
  changes: [
    effectChange("SutChgCheck00001", "system.rolls.ability.check.bonus", "1d4"),
    effectChange("SutChgSave000001", "system.rolls.ability.save.bonus", "1d4"),
    effectChange("SutChgAttack0001", "system.rolls.attack.bonus", "1d4"),
    effectChange("SutChgCards00001", "system.tools.card.roll.mode", "1"),
    effectChange("SutChgDice000001", "system.tools.dice.roll.mode", "1")
  ]
});

const RANGE_EFFECT = activeEffect("PariRangeEffect1", "Miser sa vie — portée 60 ft", {
  img: ASSETS.subclass,
  description: "Le prochain sort de portée Touch lancé pendant ce tour peut avoir une portée de 60 ft.",
  duration: { value: 1, units: "turns" },
  flags: { range60: true }
});

const MAGE_HAND_EFFECT = activeEffect("PariEffMage00001", "Main du Parieur — invoquée", {
  img: ASSETS.subclass,
  description: "Mage Hand persiste jusqu'à son renvoi par une Bonus Action. Advantage aux jets de Performance lorsque la main produit les effets spectaculaires décrits par l'aptitude.",
  flags: { mageHand: true }
});

const FEATURES = [
  featureData(IDS.spellcasting, "Spellcasting — Cartomancien", `
    <p>Vous lancez vos sorts de Cartomancien à travers vos cartes de tarot.</p>
    <h3>Cantrips</h3><p>Au niveau 1, vous connaissez trois cantrips de la liste du Cartomancien. Vous en connaissez 4 au niveau 4 et 5 au niveau 10.</p>
    <h3>Cartes et sorts préparés</h3><p>Au niveau 1, préparez deux sorts de niveau 1. Chaque nouvelle carte ajoutée à votre deck vous permet de préparer un sort supplémentaire du niveau correspondant à cette carte. Votre nombre de sorts préparés est égal à la taille du deck.</p>
    <p>Jouez une carte pour lancer l'un de vos sorts préparés de son niveau. La liaison d'un sort à une carte dans l'interface est un raccourci de préparation ; elle ne limite pas le choix des sorts préparés de même niveau.</p>
    <p>Quand vous gagnez un niveau de Cartomancien, vous pouvez remplacer l'un de vos sorts préparés par un autre sort de même niveau de la liste du Cartomancien.</p>
    <p><strong>Spellcasting Ability :</strong> Intelligence.<br><strong>Spell Save DC :</strong> 8 + PB + INT modifier.<br><strong>Spell Attack Modifier :</strong> PB + INT modifier.</p>
    <p>Votre deck de tarot est votre Spellcasting Focus.</p>`, { identifier: "spellcasting-cartomancien" }),

  featureData(IDS.mainMagique, "Main magique", `
    <p>Votre deck commence au niveau 1 avec <strong>0 — Le Fou</strong> et <strong>I — Le Magicien</strong>, puis grandit avec vos niveaux de Cartomancien.</p>
    <p>Après un Long Rest, vous pouvez défausser autant de cartes de votre main que vous le souhaitez, mélanger votre deck avec votre défausse, puis piocher un nombre de cartes égal à votre Proficiency Bonus.</p>
    <p>Une fois à chacun de vos tours, si votre main contient moins de cartes que votre Proficiency Bonus, vous pouvez piocher une carte. <strong>Aucune Action n'est requise.</strong></p>
    <p>Après avoir joué une carte, elle est défaussée et ne peut plus être utilisée avant votre prochain Long Rest. Vous ne pouvez pas consulter votre défausse.</p>
    <p>Vos cartes remplacent vos Spell Slots. Pour toute règle qui fait référence à un Spell Slot, la carte jouée est considérée comme un Spell Slot du niveau associé à cette carte.</p>`, {
      identifier: "main-magique",
      activities: [utilityActivity("CrtmActDraw00001", "Piocher une carte", {
        activation: "special",
        chatFlavor: "Pioche gratuite : 1 fois par tour si votre main contient moins de cartes que votre Proficiency Bonus."
      })]
    }),

  featureData(IDS.lancerCartes, "Lancer de cartes", `
    <p>À partir du niveau 2, lorsque vous lancez un sort ayant une portée de <strong>Touch</strong>, vous pouvez lancer la carte vers sa cible et porter la portée du sort à <strong>30 ft</strong>. La carte revient ensuite à vous.</p>`, {
      identifier: "lancer-de-cartes",
      activities: [utilityActivity("CrtmActTouch0001", "Lancer de cartes — portée 30 ft", {
        activationCondition: "Lors du lancement d'un sort de portée Touch.",
        chatFlavor: "Les sorts Touch joués depuis le deck ont une portée de 30 ft. Les autres règles du sort s'appliquent."
      })]
    }),

  featureData(IDS.styleDeck, "Style de deck", `
    <p>Au niveau 3, vous adoptez un Style de deck qui renforce votre magie. Votre Style de deck vous accorde des features aux niveaux <strong>3, 6, 10 et 14</strong>.</p>
    <p>Ce compendium inclut actuellement le <strong>Deck du Parieur</strong>.</p>`, { identifier: "style-de-deck" }),

  featureData(IDS.influx, "Pouvoir d'influx", `
    <p>À partir du niveau 3, quand vous lancez avec une carte un sort de niveau 1, vous pouvez le lancer au niveau 2.</p>
    <p>Au niveau 7, vos sorts de niveaux 1 et 2 peuvent être lancés au niveau 3.</p>
    <p>Au niveau 11, vos sorts de niveaux 1, 2 et 3 peuvent être lancés au niveau 4.</p>
    <p>Au niveau 15, vos sorts de niveaux 1, 2, 3 et 4 peuvent être lancés au niveau 5.</p>`, {
      identifier: "pouvoir-d-influx",
      activities: [utilityActivity("CrtmActInflux001", "Pouvoir d'influx", {
        activationCondition: "Lors du lancement d'un sort avec une carte.",
        chatFlavor: "Choisissez le niveau d'incantation proposé lors du jeu d'une carte. Paliers : 2 au niveau 3, 3 au niveau 7, 4 au niveau 11, 5 au niveau 15."
      })]
    }),

  featureData(IDS.coupEclat, "Coup d'éclat", `
    <p>Au niveau 18, lorsque vous subissez des dégâts alors que vous êtes sous la moitié de votre maximum de HP, vous pouvez immédiatement piocher une carte. Si votre deck est vide, piochez-en une au hasard dans votre défausse.</p>
    <p>La carte est marquée jusqu'à ce qu'elle soit jouée ou jusqu'au prochain Long Rest. Lorsque vous la jouez, vous pouvez lancer un sort qu'elle permet normalement de lancer comme s'il était lancé au <strong>niveau 9</strong>, en conservant son temps d'incantation, ses composantes et toutes ses autres règles.</p>
    <p>Une fois cette aptitude utilisée, vous devez terminer un Long Rest avant de pouvoir l'utiliser de nouveau.</p>`, {
      identifier: "coup-d-eclat",
      uses: itemUses("1", [{ period: "lr", type: "recoverAll" }]),
      activities: [utilityActivity("CrtmActEclat0001", "Coup d'éclat", {
        activation: "special",
        activationCondition: "Quand vous subissez des dégâts alors que vous êtes sous la moitié de votre maximum de HP.",
        consumeItemUses: 1,
        chatFlavor: "Piochez immédiatement et marquez une carte. Son prochain sort peut être lancé au niveau 9 avec son temps d'incantation normal."
      })]
    }),

  featureData(IDS.carteDivine, "Carte divine", `
    <p>Au niveau 20, lorsque vous constituez votre main après un Long Rest, vous pouvez choisir de piocher <strong>XXI — Le Monde</strong> à la place d'une carte que vous deviez normalement piocher. Vous pouvez faire ce choix après avoir pioché et vu une carte.</p>
    <p>Lorsque vous jouez Le Monde, vous pouvez lancer n'importe lequel de vos sorts de Cartomancien préparés au <strong>niveau 9</strong>.</p>`, {
      identifier: "carte-divine",
      activities: [utilityActivity("CrtmActDivine001", "Carte divine — Le Monde", {
        activationCondition: "À la constitution de votre main après un Long Rest.",
        chatFlavor: "Choisissez Le Monde à la place d'une carte piochée. Jouer Le Monde permet de choisir tout sort préparé et de le lancer au niveau 9."
      })]
    }),

  featureData(IDS.parieurMain, "Main du Parieur", `
    <p>Au niveau 3, vous apprenez <strong>Mage Hand</strong>. Vous pouvez le lancer par une Bonus Action et la main persiste jusqu'à ce que vous la renvoyiez par une Bonus Action.</p>
    <p>Lorsque vous utilisez Mage Hand pour mélanger des cartes, lancer des dés ou produire un autre effet spectaculaire, vous avez Advantage aux Charisma (Performance) Checks correspondants.</p>`, {
      requirements: "Deck du Parieur 3",
      identifier: "main-du-parieur",
      img: ASSETS.subclass,
      activities: [utilityActivity("PariActMage00001", "Mage Hand du Parieur", {
        activation: "bonus",
        chatFlavor: "Lancez Mage Hand par une Bonus Action. L'Advantage aux Performance Checks pour les effets spectaculaires reste situationnel."
      }), utilityActivity("PariActDismiss01", "Renvoyer la Main du Parieur", {
        activation: "bonus", chatFlavor: "Renvoyez votre Mage Hand."
      })],
      effects: [MAGE_HAND_EFFECT]
    }),

  featureData(IDS.parieurSuite, "Là où tombent les cartes", `
    <p>Au niveau 3, si après un Long Rest votre tirage forme une <strong>suite</strong>, vous gagnez les bénéfices suivants pendant <strong>24 heures</strong> :</p>
    <ul><li>ajoutez <strong>1d4</strong> à vos Ability Checks, Saving Throws et Attack Rolls ;</li><li>Advantage aux Saving Throws contre Frightened et Charmed ;</li><li>Advantage à tout jet de dé lors d'un jeu de hasard.</li></ul>`, {
      requirements: "Deck du Parieur 3",
      identifier: "la-ou-tombent-les-cartes",
      img: ASSETS.subclass,
      activities: [utilityActivity("PariActSuite0001", "Activer la suite", {
        activation: "special",
        activationCondition: "Après un Long Rest, si le tirage forme une suite.",
        effects: [SUITE_EFFECT_ID],
        duration: { value: "24", units: "hour", override: false },
        targetSelf: true,
        chatFlavor: "Appliquez Suite favorable pendant 24 heures."
      })],
      effects: [SUITE_EFFECT]
    }),

  featureData(IDS.parieurMiser, "Miser sa vie", `
    <p>Au niveau 3, vous gagnez une réserve de jetons égale à la moitié de votre niveau de Cartomancien, arrondie à l'inférieur.</p>
    <p>Pendant votre tour, par une Bonus Action, vous pouvez :</p>
    <ul><li>dépenser <strong>1 jeton</strong> pour regarder la carte du dessus de votre deck puis la laisser dessus ou la placer dessous ;</li><li>dépenser <strong>2 jetons</strong> pour faire passer à <strong>60 ft</strong> la portée d'un sort de portée Touch lancé ce tour ;</li><li>dépenser <strong>3 jetons</strong> pour piocher jusqu'à 3 cartes, puis remettre 3 cartes dans le deck et le mélanger.</li></ul>
    <p>Vous pouvez aussi vous <strong>coucher</strong> par une Bonus Action : défaussez une carte de votre main et récupérez <strong>2 jetons</strong>, sans dépasser votre réserve maximale. Cette aptitude ne prévoit pas de récupération automatique des jetons lors d'un repos.</p>`, {
      requirements: "Deck du Parieur 3",
      identifier: "miser-sa-vie",
      img: ASSETS.subclass,
      uses: itemUses("floor(@classes.cartomancien.levels / 2)", []),
      activities: [
        utilityActivity("PariActMiserTop1", "1 jeton — Regarder le dessus", {
          activation: "bonus", consumeItemUses: 1,
          chatFlavor: "Regardez la carte du dessus de votre deck, puis laissez-la dessus ou placez-la dessous."
        }),
        utilityActivity("PariActMiserRng2", "2 jetons — Portée 60 ft", {
          activation: "bonus", consumeItemUses: 2,
          chatFlavor: "La portée d'un sort de portée Touch lancé ce tour devient 60 ft."
        }),
        utilityActivity("PariActMiserDrw3", "3 jetons — Recomposer la main", {
          activation: "bonus", consumeItemUses: 3,
          chatFlavor: "Piochez jusqu'à 3 cartes, remettez ensuite 3 cartes dans le deck, puis mélangez."
        }),
        utilityActivity("PariActFold00001", "Se coucher — récupérer 2 jetons", {
          activation: "bonus",
          chatFlavor: "Défaussez une carte de votre main et récupérez 2 jetons."
        })
      ],
      effects: [RANGE_EFFECT]
    }),

  featureData(IDS.parieurContre, "Contre toute attente", `
    <p>Au niveau 6, lorsqu'un effet vous permet de piocher, vous pouvez à la place remettre toute votre main dans votre deck, mélanger, puis piocher le même nombre de cartes.</p>
    <p>Une fois cette aptitude utilisée, vous devez terminer un Long Rest avant de pouvoir l'utiliser à nouveau.</p>`, {
      requirements: "Deck du Parieur 6",
      identifier: "contre-toute-attente",
      img: ASSETS.subclass,
      uses: itemUses("1", [{ period: "lr", type: "recoverAll" }]),
      activities: [utilityActivity("PariActContre001", "Contre toute attente", {
        activation: "special",
        activationCondition: "Lorsqu'un effet vous permet de piocher.",
        consumeItemUses: 1,
        chatFlavor: "Remettez toute votre main dans le deck, mélangez, puis piochez le même nombre de cartes."
      })]
    }),

  featureData(IDS.parieurDouble, "Doubler la mise", `
    <p>Au niveau 6, quand vous ratez un Spell Attack Roll ou qu'une créature réussit un Saving Throw contre l'un de vos sorts, vous pouvez défausser une carte associée à un sort pouvant être lancé au même niveau que le sort précédent.</p>
    <p>Vous refaites immédiatement l'attaque, ou chaque créature concernée ayant réussi son Saving Throw doit le refaire.</p>`, {
      requirements: "Deck du Parieur 6",
      identifier: "doubler-la-mise",
      img: ASSETS.subclass,
      activities: [utilityActivity("PariActDouble001", "Doubler la mise", {
        activation: "special",
        activationCondition: "Après un Spell Attack Roll raté, ou lorsqu'une créature réussit un Saving Throw contre l'un de vos sorts.",
        chatFlavor: "Défaussez une carte du même niveau, puis refaites l'attaque ou les Saving Throws réussis."
      })]
    }),

  featureData(IDS.parieurJackpot, "HIT THE JACKPOT", `
    <p>Au niveau 10, après chaque Long Rest, vous pouvez créer une <strong>carte Mystère</strong>, distincte du deck et ne comptant pas dans sa taille. Elle disparaît au prochain Long Rest si vous ne l'avez pas jouée.</p>
    <p><strong>Une fois par Long Rest</strong>, jouez cette carte par une <strong>Magic Action</strong> et lancez <strong>1d20</strong>. Le résultat détermine le sort, lancé avec Intelligence à son niveau normal, sans dépenser de Spell Slot ni d'autre carte :</p>
    <table><thead><tr><th>d20</th><th>Sort</th></tr></thead><tbody>
    <tr><td>1</td><td>Cure Wounds</td></tr><tr><td>2</td><td>Chromatic Orb</td></tr><tr><td>3</td><td>Magic Missile</td></tr><tr><td>4</td><td>Ray of Sickness</td></tr>
    <tr><td>5</td><td>Moonbeam</td></tr><tr><td>6</td><td>Shatter</td></tr><tr><td>7</td><td>Fireball</td></tr><tr><td>8</td><td>Lightning Bolt</td></tr>
    <tr><td>9</td><td>Vampiric Touch</td></tr><tr><td>10</td><td>Ice Storm</td></tr><tr><td>11</td><td>Sickening Radiance</td></tr><tr><td>12</td><td>Wall of Fire</td></tr>
    <tr><td>13</td><td>Cone of Cold</td></tr><tr><td>14</td><td>Immolation</td></tr><tr><td>15</td><td>Chain Lightning</td></tr><tr><td>16</td><td>Sunbeam</td></tr>
    <tr><td>17</td><td>Fire Storm</td></tr><tr><td>18</td><td>Crown of Stars</td></tr><tr><td>19</td><td>Sunburst</td></tr><tr><td>20</td><td>Time Stop</td></tr>
    </tbody></table>
    <h3>777 — Jackpot</h3>
    <p>Si trois utilisations consécutives de HIT THE JACKPOT donnent un <strong>7 naturel</strong> (7 → 7 → 7), la troisième déclenche <strong>les 20 résultats</strong>. La série est remise à zéro dès qu'un résultat autre que 7 est obtenu, et après le Jackpot.</p>
    <p>Lors du Jackpot, lancez les vingt sorts successivement, dans l'ordre de la table, en choisissant leurs cibles séparément. Les autres règles de chaque sort s'appliquent.</p>`, {
      requirements: "Deck du Parieur 10",
      identifier: "hit-the-jackpot",
      img: ASSETS.jackpot,
      uses: itemUses("1", [{ period: "lr", type: "recoverAll" }]),
      activities: [utilityActivity("PariActJackpot01", "HIT THE JACKPOT", {
        activation: "action",
        consumeItemUses: 1,
        chatFlavor: "Jouez la carte Mystère par une Magic Action : le module lance 1d20 et propose le sort obtenu."
      }), utilityActivity("PariActJackNext1", "Lancer le prochain sort du Jackpot", {
        activationCondition: "Un sort obtenu par HIT THE JACKPOT attend d'être lancé.",
        chatFlavor: "Reprenez le résultat en attente ; aucun nouveau jet ni usage n'est dépensé."
      })]
    }),

  featureData(IDS.parieurDestin, "Parieur du destin", `
    <p>Au niveau 14, chaque fois que vous devriez piocher une carte, vous pouvez à la place choisir n'importe quelle carte de votre deck et la piocher.</p>
    <p>Une fois cette aptitude utilisée, vous devez terminer un Long Rest avant de pouvoir l'utiliser à nouveau.</p>`, {
      requirements: "Deck du Parieur 14",
      identifier: "parieur-du-destin",
      img: ASSETS.subclass,
      uses: itemUses("1", [{ period: "lr", type: "recoverAll" }]),
      activities: [utilityActivity("PariActDestin001", "Parieur du destin", {
        activation: "special",
        activationCondition: "Chaque fois que vous devriez piocher une carte.",
        consumeItemUses: 1,
        chatFlavor: "Choisissez n'importe quelle carte de votre deck et piochez-la à la place."
      })]
    })
];

function subclassAdvancement(id, level, name = "Style de deck") {
  return {
    _id: documentId(id),
    type: "Subclass",
    level,
    name,
    configuration: {},
    value: {},
    flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  };
}

function itemGrant(id, level, itemIds, name = "Features") {
  return {
    _id: documentId(id),
    type: "ItemGrant",
    level,
    name,
    configuration: {
      items: itemIds.map((itemId, sort) => ({ uuid: contentUuid(itemId), optional: false, sort: sort * 10000 })),
      optional: false,
      sorting: "m",
      spell: null
    },
    value: {},
    flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  };
}

function trait(id, level, configuration, { name, classRestriction = "primary" } = {}) {
  return {
    _id: documentId(id),
    type: "Trait",
    level,
    name,
    classRestriction,
    configuration: {
      allowReplacements: false,
      choices: [],
      grants: [],
      mode: "default",
      ...configuration
    },
    value: {},
    flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  };
}

const CLASS_ADVANCEMENTS = [
  {
    _id: "CrtmAdvHitPoint1", type: "HitPoints", configuration: {}, value: {},
    flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  },
  ...[4, 8, 12, 16].map(level => ({
    _id: `CrtmAdvASI000${String(level).padStart(2, "0")}`,
    type: "AbilityScoreImprovement", level,
    configuration: { points: 2, cap: 2, max: 20, fixed: {}, locked: [] }, value: {},
    flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  })),
  {
    _id: "CrtmAdvBoon00019", type: "ItemChoice", level: 19, name: "Epic Boon",
    configuration: {
      allowDrops: true, choices: { 19: { count: 1, replacement: false } }, pool: [],
      restriction: { type: "feat", subtype: "", level: "", list: [], school: [] },
      type: "feat", spell: null
    }, value: {}, flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  },
  trait("CrtmAdvSaves0010", 1, { grants: ["saves:int", "saves:wis"] }, { name: "Saving Throw Proficiencies" }),
  trait("CrtmAdvArmor0010", 1, { grants: ["armor:lgt"] }, { name: "Armor Training" }),
  trait("CrtmAdvWeapon010", 1, { grants: ["weapon:sim"] }, { name: "Weapon Proficiencies" }),
  trait("CrtmAdvTools0010", 1, { grants: ["tool:card", "tool:dice"] }, { name: "Tool Proficiencies" }),
  trait("CrtmAdvSkills001", 1, {
    choices: [{ count: 1, pool: ["skills:arc", "skills:dec", "skills:his", "skills:ins", "skills:inv", "skills:prc", "skills:prf", "skills:per", "skills:slt"] }]
  }, { name: "Skill Proficiencies" }),
  itemGrant("CrtmAdvFeatLvl01", 1, [IDS.spellcasting, IDS.mainMagique]),
  itemGrant("CrtmAdvFeatLvl02", 2, [IDS.lancerCartes]),
  itemGrant("CrtmAdvFeatLvl03", 3, [IDS.styleDeck, IDS.influx]),
  subclassAdvancement("CrtmAdvSubcl0003", 3, "Style de deck"),
  itemGrant("CrtmAdvFeatLvl18", 18, [IDS.coupEclat]),
  itemGrant("CrtmAdvFeatLvl20", 20, [IDS.carteDivine])
].map(advancement => ({ ...advancement, _id: documentId(advancement._id) }));

const PARIEUR_ADVANCEMENTS = [
  itemGrant("PariAdvFeatLvl03", 3, [IDS.parieurMain, IDS.parieurSuite, IDS.parieurMiser]),
  itemGrant("PariAdvFeatLvl06", 6, [IDS.parieurContre, IDS.parieurDouble]),
  itemGrant("PariAdvFeatLvl10", 10, [IDS.parieurJackpot]),
  itemGrant("PariAdvFeatLvl14", 14, [IDS.parieurDestin])
];

function cantripAdvancement(sources) {
  return {
    _id: documentId("CrtmAdvCantrip01"), type: "ItemChoice", name: "Sorts mineurs du Cartomancien",
    configuration: {
      allowDrops: true,
      choices: { 1: { count: 3 }, 4: { count: 1 }, 10: { count: 1 } },
      pool: [...sources.values()].filter(spell => spell.level === 0)
        .map((spell, sort) => ({ uuid: spell.uuid, sort: sort * 10000 })),
      restriction: { level: "0", list: [], school: [], type: "", subtype: "" },
      type: "spell",
      spell: { ability: ["int"], method: "spell", prepared: 2, uses: { max: "", per: "", requireSlot: false } }
    }, value: {}, flags: { [MODULE_ID]: { cartomancien: { generated: true } } }
  };
}

function getPack(id) {
  const pack = game.packs.get(id);
  if (!pack) throw new Error(`Compendium ${id} introuvable : vérifier le module.json de ${MODULE_ID}.`);
  return pack;
}

/** Module compendiums are locked: unlock them for the writes, then restore their previous state. */
async function withUnlockedPacks(packs, callback) {
  const locked = packs.filter(pack => pack.locked);
  for (const pack of locked) await pack.configure({ locked: false });
  try {
    return await callback();
  } finally {
    for (const pack of locked) await pack.configure({ locked: true });
  }
}

/**
 * Folders of the Cartomancien content. Existing folders are left where the GM moved them;
 * a missing class folder is created inside the root "Class" folder of the compendium when there is one.
 */
async function ensureFolder(pack, { _id, name, sort = 0, parent = null }) {
  const existing = pack.folders.get(_id);
  if (existing) return existing;
  return Folder.implementation.create({ _id, name, type: pack.documentName, folder: parent, sorting: "m", sort },
    { pack: pack.collection, keepId: true });
}

async function ensureItemFolders(pack) {
  const classRoot = pack.folders.find(folder => !folder.folder && CLASS_FOLDER.test(folder.name));
  await ensureFolder(pack, { _id: IDS.folderClass, name: "Cartomancien", sort: 100000, parent: classRoot?.id ?? null });
  await ensureFolder(pack, { _id: IDS.folderFeatures, name: "Aptitudes de classe", sort: 100, parent: IDS.folderClass });
  await ensureFolder(pack, { _id: IDS.folderParieur, name: "Deck du Parieur", sort: 200, parent: IDS.folderClass });
}

/** Folder of a generated item: Parieur features beside their subclass, the other features under Aptitudes. */
function featureFolder(id) {
  const parieur = PARIEUR_ADVANCEMENTS.filter(advancement => advancement.type === "ItemGrant")
    .some(advancement => advancement.configuration.items.some(item => item.uuid.endsWith(`.${id}`)));
  return parieur ? IDS.folderParieur : IDS.folderFeatures;
}

async function syncManagedEffects(doc, effectData = []) {
  if (doc.documentName !== "Item") return;
  const existing = [...(doc.effects ?? [])].filter(effect => effect.getFlag(MODULE_ID, "cartomancien.generated"));
  if (existing.length) await doc.deleteEmbeddedDocuments("ActiveEffect", existing.map(effect => effect.id), { render: false });
  if (effectData.length) {
    await doc.createEmbeddedDocuments("ActiveEffect", foundry.utils.deepClone(effectData), { keepId: true, render: false });
  }
}

async function upsertPackDocument(pack, documentClass, data) {
  const payload = foundry.utils.deepClone(data);
  const effects = payload.effects ?? [];
  delete payload.effects;

  let doc = await pack.getDocument(payload._id);
  if (doc) {
    const update = foundry.utils.deepClone(payload);
    delete update._id;
    await doc.update(update, { diff: false, recursive: false });
  } else {
    doc = await documentClass.implementation.create(payload, { pack: pack.metadata.id, keepId: true });
  }

  await syncManagedEffects(doc, effects);
  return doc;
}

function mergeGeneratedAdvancements(item, additions) {
  const current = foundry.utils.deepClone(item.system?._source?.advancement ?? item.system?.advancement?.toObject?.() ?? {});
  for (const [id, advancement] of Object.entries(current)) {
    const replacedDefault = ["HitPoints", "AbilityScoreImprovement"].includes(advancement?.type)
      && !Object.keys(advancement.value ?? {}).length;
    if (advancement?.flags?.[MODULE_ID]?.cartomancien?.generated || replacedDefault) delete current[id];
  }
  for (const advancement of additions) current[advancement._id] = advancement;
  return current;
}

async function findSpellSources() {
  const wanted = new Map();
  for (const [level, names] of Object.entries(CARTOMANCIEN_SPELLS)) {
    for (const name of names) wanted.set(`${Number(level)}:${normalize(name)}`, { level: Number(level), name });
  }

  const found = new Map();
  const packs = [...game.packs]
    .filter(pack => pack.documentName === "Item")
    .sort((a, b) => {
      const ap = a.metadata?.packageName === "dnd5e" || a.metadata?.package === "dnd5e" ? 0 : 1;
      const bp = b.metadata?.packageName === "dnd5e" || b.metadata?.package === "dnd5e" ? 0 : 1;
      return ap - bp;
    });

  for (const pack of packs) {
    let index;
    try {
      index = await pack.getIndex({ fields: ["name", "type", "system.level", "system.school", "system.identifier"] });
    } catch (err) {
      console.warn(`${MODULE_ID} | impossible d'indexer ${pack.collection}`, err);
      continue;
    }
    for (const entry of index) {
      if (entry.type !== "spell") continue;
      const level = Number(entry.system?.level ?? -1);
      const key = `${level}:${normalize(entry.name)}`;
      if (!wanted.has(key) || found.has(key)) continue;
      found.set(key, {
        uuid: `Compendium.${pack.collection}.Item.${entry._id}`,
        name: entry.name,
        level,
        school: entry.system?.school ?? "",
        identifier: entry.system?.identifier ?? slug(entry.name)
      });
    }
  }

  for (const item of game.items ?? []) {
    if (item.type !== "spell") continue;
    const level = Number(item.system?.level ?? -1);
    const key = `${level}:${normalize(item.name)}`;
    if (wanted.has(key) && !found.has(key)) {
      found.set(key, {
        uuid: item.uuid,
        name: item.name,
        level,
        school: item.system?.school ?? "",
        identifier: item.system?.identifier ?? slug(item.name)
      });
    }
  }
  return found;
}

async function ensureSpellListPack() {
  const pack = getPack(SPELL_LIST_PACK_ID);
  await ensureFolder(pack, { _id: IDS.folderJournal, name: "Cartomancien" });
  const found = await findSpellSources();
  const spells = [];
  const unlinkedSpells = [];

  for (const [levelText, names] of Object.entries(CARTOMANCIEN_SPELLS)) {
    const level = Number(levelText);
    for (const name of names) {
      const match = found.get(`${level}:${normalize(name)}`);
      if (match) spells.push(match.uuid);
      else unlinkedSpells.push({
        identifier: slug(name),
        name,
        system: { level, school: "" },
        source: { uuid: "" }
      });
    }
  }

  let journal = await pack.getDocument(IDS.spellJournal);
  if (!journal) {
    journal = await JournalEntry.implementation.create({
      _id: IDS.spellJournal,
      name: "Cartomancien — Liste de sorts",
      folder: IDS.folderJournal,
      flags: { [MODULE_ID]: { cartomancien: { contentKey: "spell-list", contentVersion: CONTENT_VERSION } } }
    }, { pack: pack.metadata.id, keepId: true });
  } else {
    await journal.update({
      name: "Cartomancien — Liste de sorts",
      [`flags.${MODULE_ID}.cartomancien.contentVersion`]: CONTENT_VERSION
    });
  }

  const pageData = {
    _id: IDS.spellPage,
    name: "Liste de sorts du Cartomancien",
    type: "spells",
    system: {
      type: "class",
      identifier: "cartomancien",
      grouping: "level",
      description: {
        value: `<p>Liste de sorts utilisée par les cartes du Cartomancien. Chaque carte doit être liée à un sort de son niveau exact.</p>`
      },
      spells,
      unlinkedSpells
    },
    flags: { [MODULE_ID]: { cartomancien: { contentKey: "spell-list-page", contentVersion: CONTENT_VERSION } } }
  };

  let page = journal.pages.get(IDS.spellPage);
  if (page) {
    const update = foundry.utils.deepClone(pageData);
    delete update._id;
    await page.update(update, { diff: false, recursive: false });
  } else {
    [page] = await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
  }

  try {
    const registry = globalThis.dnd5e?.registry?.spellLists;
    const existing = registry?.forType?.("class", "cartomancien");
    if (!existing && registry?.register) await registry.register(page.uuid);
  } catch (err) {
    console.warn(`${MODULE_ID} | la Spell List existe mais son enregistrement dynamique a échoué`, err);
  }

  return { pack, journal, page, sources: found, linked: spells.length, unlinked: unlinkedSpells.length };
}

async function ensureContentPack(spellListPage, spellSources) {
  const pack = getPack(CONTENT_PACK_ID);
  await ensureItemFolders(pack);
  const classAdvancements = [...CLASS_ADVANCEMENTS, cantripAdvancement(spellSources)];

  for (const data of FEATURES) await upsertPackDocument(pack, Item, { ...data, folder: featureFolder(data._id) });

  const subclassData = {
    _id: IDS.subclassParieur,
    name: "Deck du Parieur",
    type: "subclass",
    img: ASSETS.subclass,
    folder: IDS.folderParieur,
    system: {
      description: { value: `<h2>Deck du Parieur</h2><p>Pour certains, le risque nourrit l'ambition. Le Deck du Parieur laisse les dés décider du destin — du moins en apparence.</p>` },
      identifier: "deck-du-parieur",
      classIdentifier: "cartomancien",
      spellcasting: { progression: "none", ability: "int" },
      advancement: PARIEUR_ADVANCEMENTS.reduce((obj, a) => (obj[a._id] = a, obj), {})
    },
    flags: { [MODULE_ID]: { cartomancien: { contentKey: "subclass-parieur", contentVersion: CONTENT_VERSION } } }
  };
  const subclass = await upsertPackDocument(pack, Item, subclassData);

  let cls = await pack.getDocument(IDS.class);
  if (!cls) {
    cls = await Item.implementation.create({
      _id: IDS.class,
      name: "Le Cartomancien",
      type: "class",
      img: ASSETS.class,
      folder: IDS.folderClass,
      system: {
        description: { value: CLASS_DESCRIPTION },
        identifier: "cartomancien",
        levels: 1,
        hd: { denomination: "d6", spent: 0, additional: "" },
        primaryAbility: { value: ["int"], all: false },
        spellcasting: { progression: "none", ability: "int" },
        advancement: Object.fromEntries(classAdvancements.map(advancement => [advancement._id, advancement]))
      },
      flags: { [MODULE_ID]: { cartomancien: { contentKey: "class-cartomancien", contentVersion: CONTENT_VERSION } } }
    }, { pack: pack.metadata.id, keepId: true });
  } else {
    await cls.update({
      name: "Le Cartomancien",
      img: ASSETS.class,
      folder: IDS.folderClass,
      "system.description.value": CLASS_DESCRIPTION,
      "system.identifier": "cartomancien",
      "system.hd.denomination": "d6",
      "system.primaryAbility": { value: ["int"], all: false },
      "system.spellcasting": { progression: "none", ability: "int" },
      [`flags.${MODULE_ID}.cartomancien.contentVersion`]: CONTENT_VERSION
    });
  }

  const merged = mergeGeneratedAdvancements(cls, classAdvancements);
  await cls.update({ "system.advancement": merged });

  // Ajoute un lien cliquable vers la vraie page D&D5e de Spell List sans rendre la classe dépendante de cette page.
  if (spellListPage) {
    const spellcasting = await pack.getDocument(IDS.spellcasting);
    const base = FEATURES.find(f => f._id === IDS.spellcasting)?.system?.description?.value ?? "";
    await spellcasting?.update({
      "system.description.value": `${base}<p><strong>Foundry :</strong> @UUID[${spellListPage.uuid}]{Ouvrir la Spell List du Cartomancien}</p>`
    });
  }

  return { pack, cls, subclass };
}

export function isCartomancienSpell(name, level) {
  const list = CARTOMANCIEN_SPELLS[Number(level)] ?? [];
  const wanted = normalize(name);
  return list.some(n => normalize(n) === wanted);
}

export async function getAvailableCartomancienSpellSources(level, { actor = null } = {}) {
  level = Number(level);
  const allowed = CARTOMANCIEN_SPELLS[level] ?? [];
  const allowedByName = new Map(allowed.map(name => [normalize(name), name]));
  const results = new Map();

  if (actor) {
    for (const item of actor.items) {
      if (item.type !== "spell" || Number(item.system?.level ?? -1) !== level) continue;
      const key = normalize(item.name);
      if (!allowedByName.has(key)) continue;
      results.set(key, { name: item.name, level, uuid: item.uuid, owned: true });
    }
  }

  const packs = [...game.packs].filter(pack => pack.documentName === "Item");
  for (const pack of packs) {
    let index;
    try {
      index = await pack.getIndex({ fields: ["name", "type", "system.level"] });
    } catch (_) {
      continue;
    }
    for (const entry of index) {
      if (entry.type !== "spell" || Number(entry.system?.level ?? -1) !== level) continue;
      const key = normalize(entry.name);
      if (!allowedByName.has(key) || results.has(key)) continue;
      results.set(key, {
        name: entry.name,
        level,
        uuid: `Compendium.${pack.collection}.Item.${entry._id}`,
        owned: false
      });
    }
  }

  return {
    available: [...results.values()].sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang)),
    missing: allowed.filter(name => !results.has(normalize(name)))
  };
}

export async function importSpellToActor(actor, uuid) {
  const source = await fromUuid(uuid);
  if (!source || source.type !== "spell") return null;
  if (source.parent?.id === actor.id) return source;

  const same = actor.items.find(i => i.type === "spell"
    && Number(i.system?.level ?? -1) === Number(source.system?.level ?? -1)
    && normalize(i.name) === normalize(source.name));
  if (same) return same;

  let data;
  try {
    data = game.items.fromCompendium(source);
  } catch (_) {
    data = source.toObject();
    delete data._id;
  }
  data.flags ??= {};
  data.flags[MODULE_ID] = { ...data.flags[MODULE_ID], cartomancien: { ...data.flags[MODULE_ID]?.cartomancien, importedForCartomancien: true } };
  const [created] = await actor.createEmbeddedDocuments("Item", [data]);
  return created ?? null;
}

/**
 * Refresh the module-owned structure while retaining actor choices, counters and custom entries.
 * Item names, descriptions and art stay editable. New class choices are made through advancement.
 */
export async function syncActorContent(actor) {
  if (!actor?.isOwner) return { updated: 0, created: 0 };
  const cls = actor.items.find(item => item.type === "class" && item.system.identifier === "cartomancien");
  if (!cls) return { updated: 0, created: 0 };
  const subclass = actor.items.find(item => item.type === "subclass"
    && item.system.classIdentifier === "cartomancien" && item.system.identifier === "deck-du-parieur");
  const level = Number(cls.system.levels ?? 0);
  const pack = game.packs.get(CONTENT_PACK_ID);
  if (!pack) return { updated: 0, created: 0, missingCompendium: true };
  const templates = [[cls, await pack.getDocument(IDS.class)]];
  if (subclass) templates.push([subclass, await pack.getDocument(IDS.subclassParieur)]);
  const grants = [...CLASS_ADVANCEMENTS, ...(subclass ? PARIEUR_ADVANCEMENTS : [])]
    .filter(advancement => advancement.type === "ItemGrant" && advancement.level <= level)
    .flatMap(advancement => advancement.configuration.items.map(item => item.uuid.split(".").at(-1)));
  let created = 0;
  let updated = 0;

  for (const id of grants) {
    const definition = FEATURES.find(feature => feature._id === id);
    if (!definition) continue;
    const existing = actor.items.find(item => item.type === "feat" && (
      item.getFlag(MODULE_ID, "cartomancien.contentKey") === id
      || item.system.identifier === definition.system.identifier
      || normalize(item.name) === normalize(definition.name)
    ));
    const template = await pack.getDocument(id);
    if (!template) continue;
    if (existing) templates.push([existing, template]);
    else {
      const data = template.toObject();
      delete data._id;
      data.flags ??= {};
      data.flags.dnd5e = { ...(data.flags.dnd5e ?? {}), sourceId: template.uuid };
      await actor.createEmbeddedDocuments("Item", [data]);
      created++;
    }
  }

  for (const [item, template] of templates) {
    if (!template || item.getFlag(MODULE_ID, "cartomancien.contentVersion") === CONTENT_VERSION) continue;
    const source = item.toObject();
    const incoming = template.toObject();
    const previous = source.flags?.[MODULE_ID]?.cartomancien?.managedSnapshot;
    const update = {
      [`flags.${MODULE_ID}.cartomancien.contentKey`]: incoming.flags?.[MODULE_ID]?.cartomancien?.contentKey,
      [`flags.${MODULE_ID}.cartomancien.contentVersion`]: CONTENT_VERSION
    };
    const snapshot = {};
    for (const key of ["name", "img", "system.description.value"]) {
      const next = foundry.utils.getProperty(incoming, key);
      const current = foundry.utils.getProperty(source, key);
      if (current === undefined || (previous && current === previous[key])
          || (!previous && key === "system.description.value" && item.getFlag(MODULE_ID, "cartomancien.contentKey"))) update[key] = next;
      snapshot[key] = next;
    }
    update[`flags.${MODULE_ID}.cartomancien.managedSnapshot`] = snapshot;

    if (item.type === "feat") {
      const activities = foundry.utils.deepClone(source.system.activities ?? {});
      for (const id of Object.keys(activities)) {
        if (id.length !== 16 && incoming.system.activities?.[documentId(id)]) delete activities[id];
      }
      for (const [id, definition] of Object.entries(incoming.system.activities ?? {})) {
        const current = activities[id];
        activities[id] = foundry.utils.mergeObject(current ?? {}, definition, { inplace: false });
        if (current?.uses) activities[id].uses.spent = current.uses.spent ?? 0;
      }
      update["system.activities"] = activities;
      update["system.uses"] = {
        ...(incoming.system.uses ?? {}),
        spent: source.system.uses?.spent ?? 0
      };
      const existingEffects = item.effects ?? [];
      for (const effect of incoming.effects ?? []) {
        const existing = existingEffects.find(candidate => candidate.id === effect._id);
        if (existing) {
          const effectUpdate = { ...effect, disabled: existing.disabled };
          await existing.update(effectUpdate);
        } else await item.createEmbeddedDocuments("ActiveEffect", [effect], { keepId: true });
      }
    } else {
      const advancements = foundry.utils.deepClone(source.system.advancement ?? {});
      for (const [id, definition] of Object.entries(incoming.system.advancement ?? {})) {
        const existing = advancements[id] ?? Object.values(advancements).find(candidate =>
          candidate.type === definition.type && candidate.level === definition.level
          && ["HitPoints", "AbilityScoreImprovement", "Subclass"].includes(definition.type));
        const targetId = existing?._id ?? id;
        advancements[targetId] = {
          ...foundry.utils.deepClone(definition), _id: targetId,
          value: foundry.utils.deepClone(existing?.value ?? {})
        };
      }
      // The old system-created level-19 ASI is replaced only before the player has made a choice.
      for (const [id, advancement] of Object.entries(advancements)) {
        if (advancement.type === "AbilityScoreImprovement" && advancement.level === 19
          && !Object.keys(advancement.value ?? {}).length) delete advancements[id];
      }
      update["system.advancement"] = advancements;
    }
    await item.update(update);
    updated++;
  }
  return { updated, created };
}

export async function ensureContent({ force = false, notify = false } = {}) {
  if (!game.user?.isGM) return null;
  const installed = game.settings.get(MODULE_ID, "cartomancienContentVersion");

  let spellListPage = null;
  if (!force && installed === CONTENT_VERSION && game.packs.has(CONTENT_PACK_ID) && game.packs.has(SPELL_LIST_PACK_ID)) {
    try {
      const spellPack = game.packs.get(SPELL_LIST_PACK_ID);
      const journal = await spellPack?.getDocument(IDS.spellJournal);
      spellListPage = journal?.pages?.get(IDS.spellPage) ?? null;
      const registry = globalThis.dnd5e?.registry?.spellLists;
      if (spellListPage && !registry?.forType?.("class", "cartomancien") && registry?.register) {
        await registry.register(spellListPage.uuid);
      }
    } catch (err) {
      console.warn(`${MODULE_ID} | impossible de réenregistrer la Spell List`, err);
    }
    return { alreadyInstalled: true, spellListPage };
  }

  const { spellList, content } = await withUnlockedPacks([getPack(SPELL_LIST_PACK_ID), getPack(CONTENT_PACK_ID)], async () => {
    const spellList = await ensureSpellListPack();
    return { spellList, content: await ensureContentPack(spellList.page, spellList.sources) };
  });
  await game.settings.set(MODULE_ID, "cartomancienContentVersion", CONTENT_VERSION);

  if (notify) {
    ui.notifications.info(`Cartomancien ${CONTENT_VERSION} : compendiums créés/mis à jour (${spellList.linked} sorts liés, ${spellList.unlinked} profils non liés).`);
  }
  return { alreadyInstalled: false, spellList, content };
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "cartomancienContentVersion", {
    name: "Cartomancien content version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
});
