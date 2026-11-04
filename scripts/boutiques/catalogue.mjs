/**
 * Boutiques — catalogue.
 * Pure rules of the shop generators: the shops and their categories, which category an entry of a compendium index
 * belongs to, which copy of a duplicated item wins, the stable's goods and the prices. No Foundry API here, so that the
 * regression checks can run outside Foundry.
 */

export const RARITIES = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];

// Price of a magic item without price, by rarity (Dungeon Master's Guide 2024); a consumable costs half
const MAGIC_PRICE = { common: 100, uncommon: 400, rare: 4000, veryRare: 40000, legendary: 200000 };
const GP = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };

/**
 * The shops. Each category is a roll table; its weight is the chance of the shop's master table to give it. A
 * category named after a rarity holds the magic items of that rarity, kept out of a stock above its maximum rarity.
 */
export const SHOPS = {
  hutte: {
    label: 'La Hutte Enchantée', icon: 'fa-solid fa-hat-wizard',
    categories: { common: 40, uncommon: 30, rare: 18, veryRare: 9, legendary: 3 }
  },
  equipement: {
    label: 'Équipement', icon: 'fa-solid fa-toolbox',
    categories: { gear: 60, tools: 20, clothing: 10, food: 10 }
  },
  forge: {
    label: 'Forge', icon: 'fa-solid fa-hammer',
    categories: { weapons: 55, armor: 35, ammo: 15, common: 6, uncommon: 5, rare: 3, veryRare: 2, legendary: 1 }
  },
  apothicaire: {
    label: 'Apothicaire', icon: 'fa-solid fa-flask',
    categories: { potions: 45, herbs: 20, poisons: 15, kits: 10, common: 10, uncommon: 7, rare: 4, veryRare: 2, legendary: 1 }
  },
  ecurie: {
    label: 'Écurie', icon: 'fa-solid fa-horse',
    categories: { mounts: 50, tack: 35, vehicles: 15 }
  }
};

/** Labels of the categories that aren't a rarity (the rarities use the dnd5e labels). */
export const CATEGORY_LABELS = {
  gear: 'Matériel', tools: 'Outils', clothing: 'Vêtements', food: 'Vivres',
  weapons: 'Armes', armor: 'Armures', ammo: 'Munitions',
  potions: 'Potions et fioles', herbs: 'Herbes et ingrédients', poisons: 'Poisons', kits: 'Kits et fournitures',
  mounts: 'Montures', tack: 'Sellerie et fourrage', vehicles: 'Véhicules'
};

/**
 * Goods of the stable (Player's Handbook 2024, plus the pack saddle and saddlebags of 2014), linked to a creature or an
 * item of the compendiums named like them (or like their 2014 name); the others are text results.
 */
export const STABLE = [
  ['mounts', 'Camel', 50, 'gp', 'Actor'], ['mounts', 'Draft Horse', 50, 'gp', 'Actor'],
  ['mounts', 'Elephant', 200, 'gp', 'Actor'], ['mounts', 'Mastiff', 25, 'gp', 'Actor'],
  ['mounts', 'Mule', 8, 'gp', 'Actor'], ['mounts', 'Pony', 30, 'gp', 'Actor'],
  ['mounts', 'Riding Horse', 75, 'gp', 'Actor'], ['mounts', 'Warhorse', 400, 'gp', 'Actor'],
  ['tack', 'Bit and Bridle', 2, 'gp', 'Item'], ['tack', 'Feed', 5, 'cp', 'Item'],
  ['tack', 'Saddle (Exotic)', 60, 'gp', 'Item', ['Exotic Saddle', 'Saddle, Exotic']],
  ['tack', 'Saddle (Military)', 20, 'gp', 'Item', ['Military Saddle', 'Saddle, Military']],
  ['tack', 'Saddle (Pack)', 5, 'gp', 'Item', ['Pack Saddle', 'Saddle, Pack']],
  ['tack', 'Saddle (Riding)', 10, 'gp', 'Item', ['Riding Saddle', 'Saddle, Riding']],
  ['tack', 'Saddlebags', 4, 'gp', 'Item'], ['tack', 'Stabling (1 day)', 5, 'sp', 'Item'],
  ['vehicles', 'Carriage', 100, 'gp', 'Item'], ['vehicles', 'Cart', 15, 'gp', 'Item'],
  ['vehicles', 'Chariot', 250, 'gp', 'Item'], ['vehicles', 'Sled', 20, 'gp', 'Item'],
  ['vehicles', 'Wagon', 35, 'gp', 'Item']
].map(([category, name, value, denomination, documentName, aliases = []]) => ({
  category, name, names: [name, ...aliases], price: { value, denomination }, documentName
}));

// Item types that are never goods, and the healing and alchemical goods of the apothecary that dnd5e doesn't type so
const NOT_GOODS = new Set(['spell', 'feat', 'class', 'subclass', 'background', 'race', 'facility']);
const APOTHECARY_GOODS = new Set(["healer's kit", 'perfume']);
const APOTHECARY_TOOLS = new Set(['herb', 'pois', 'alchemist']);
const WEAPONS = new Set(['simpleM', 'simpleR', 'martialM', 'martialR']);
const ARMOR = new Set(['light', 'medium', 'heavy', 'shield']);
// Loot subtypes of the general store: none, or adventuring gear (not trade goods, gems, art, materials…)
const GEAR_LOOT = new Set(['', 'gear']);
// Consumable subtypes that say what the item is; the others (a module's own) are read from the compendium folder
const KNOWN_CONSUMABLES = new Set(['ammo', 'potion', 'poison', 'food', 'scroll', 'trinket', 'rod', 'wand', 'wondrous']);

// Compendium folders that tell what an untyped item is: herbs, potions, food, or raw materials and treasures (not sold)
const FOLDER_HINTS = [
  ['herbs', /\b(herb|herbs|herbalist|herbalism|alchemy|alchemical|reagents?|ingredients?|botanicals?)\b/],
  ['potions', /\b(potions?|tinctures?|elixirs?|draughts?|remedies)\b/],
  ['food', /\b(food|produce|tavern|meals?|drinks?|fish)\b/],
  [null, /\b(ores?|metals?|timber|lumber|wood|stone|masonry|bones?|hides?|leather|fibres?|fibers?|textiles?|coins?|coinage|currency|gems?|gemstones|jewel(le)?ry|treasures?|livestock|animals?|harvest|documents?|scrolls?|trade|materials?)\b/]
];

export const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[’‘`]/g, "'")
  .toLowerCase()
  .trim();

const STABLE_NAMES = new Set(STABLE.flatMap(good => good.names.map(normalize)));

/** What the compendium folder of an untyped item says it is: a category, null when not for sale, undefined if nothing. */
function folderHint(folder) {
  const text = normalize(folder);
  if (!text) return undefined;
  const hint = FOLDER_HINTS.find(([, pattern]) => pattern.test(text));
  return hint ? hint[0] : undefined;
}

export const isMagic = entry => RARITIES.includes(entry.system?.rarity) && (entry.system?.properties ?? []).includes('mgc');

/** Price of an entry in gold pieces (0 when it has none). */
export function priceInGp(price) {
  return Number(price?.value ?? 0) * (GP[price?.denomination] ?? 1);
}

/** Price shown for an entry: its own, or for a magic item without price the one of its rarity. */
export function priceOf(entry) {
  const price = entry.system?.price;
  if (priceInGp(price) > 0) return { value: Number(price.value), denomination: price.denomination ?? 'gp' };
  if (!isMagic(entry)) return null;
  const value = MAGIC_PRICE[entry.system.rarity] / (entry.type === 'consumable' ? 2 : 1);
  return { value, denomination: 'gp' };
}

/**
 * Shops and categories of an item index entry, as [shop, category] pairs. A magic item goes to La Hutte Enchantée and,
 * when it's a weapon, an armor or a potion, also to the Forge or the Apothecary in its rarity; an item without price
 * (feature, placeholder, artifact) goes nowhere, and the stable's goods only to the stable. `folder` is the name of the
 * item's compendium folder (and its parents), read for the loot and consumables that their type doesn't describe.
 */
export function placesOf(entry, { folder = '' } = {}) {
  const type = entry.type;
  const subtype = entry.system?.type?.value ?? '';
  if (NOT_GOODS.has(type) || !priceOf(entry)) return [];
  const name = normalize(entry.name);
  if (STABLE_NAMES.has(name)) return [];
  const hinted = fallback => {
    const hint = folderHint(folder);
    if (hint === null) return [];
    if (hint === 'herbs') return [['apothicaire', 'herbs']];
    if (hint === 'potions') return [['apothicaire', 'potions']];
    if (hint === 'food') return [['equipement', 'food']];
    return fallback;
  };

  if (isMagic(entry)) {
    if (type === 'loot' || (type === 'consumable' && subtype === 'food')) return [];
    const rarity = entry.system.rarity;
    const places = [['hutte', rarity]];
    if ((type === 'weapon' && WEAPONS.has(subtype)) || (type === 'equipment' && ARMOR.has(subtype))
      || (type === 'consumable' && subtype === 'ammo')) places.push(['forge', rarity]);
    if (type === 'consumable' && ['potion', 'poison'].includes(subtype)) places.push(['apothicaire', rarity]);
    return places;
  }

  if (type === 'weapon') return WEAPONS.has(subtype) ? [['forge', 'weapons']] : [];
  if (type === 'equipment') {
    if (ARMOR.has(subtype)) return [['forge', 'armor']];
    if (subtype === 'clothing') return [['equipement', 'clothing']];
    return ['trinket', 'rod', 'wand', 'ring'].includes(subtype) ? [['equipement', 'gear']] : [];
  }
  if (type === 'consumable') {
    if (subtype === 'ammo') return [['forge', 'ammo']];
    if (subtype === 'potion') return [['apothicaire', 'potions']];
    if (subtype === 'poison') return [['apothicaire', 'poisons']];
    if (APOTHECARY_GOODS.has(name)) return [['apothicaire', 'kits'], ['equipement', 'gear']];
    if (subtype === 'food') return [['equipement', 'food']];
    if (!KNOWN_CONSUMABLES.has(subtype)) return hinted([]);
    return ['trinket', 'rod', 'wand'].includes(subtype) ? [['equipement', 'gear']] : [];
  }
  if (type === 'tool') {
    const places = [['equipement', 'tools']];
    if (APOTHECARY_TOOLS.has(entry.system?.type?.baseItem)) places.push(['apothicaire', 'kits']);
    return places;
  }
  if (type === 'container') return [['equipement', 'gear']];
  if (type === 'loot') {
    if (APOTHECARY_GOODS.has(name)) return [['apothicaire', 'kits'], ['equipement', 'gear']];
    return GEAR_LOOT.has(subtype) ? hinted([['equipement', 'gear']]) : [];
  }
  return [];
}

/**
 * Rank of a copy among the items sharing a name (lower wins): a compendium hidden from the players comes last, then
 * the Owidyn content, the dnd5e 2024 content, the rest of dnd5e, and the other modules (2024 rules first).
 */
export function sourceRank({ packageName, hidden = false, rules = '' }) {
  const own = packageName === 'compendium-owidyn' ? 0 : packageName === 'dnd5e' ? (rules === '2024' ? 1 : 2) : (rules === '2024' ? 3 : 4);
  return (hidden ? 10 : 0) + own;
}

/** Whether a category is allowed in a stock whose maximum rarity is `maxRarity` ('' for no magic item). */
export function allowsCategory(category, maxRarity) {
  if (!RARITIES.includes(category)) return true;
  return RARITIES.includes(maxRarity) && RARITIES.indexOf(category) <= RARITIES.indexOf(maxRarity);
}

/** Index in `weights` drawn with a random number in [0, 1). */
export function pickWeighted(weights, random) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

/** A price multiplied by a percentage: kept in its denomination, rounded to a whole coin from 10 coins up. */
export function adjustPrice(price, percent = 100) {
  const value = price.value * percent / 100;
  return { value: value >= 10 ? Math.round(value) : Math.round(value * 10) / 10, denomination: price.denomination };
}
