/**
 * Boutiques — catalogue.
 * Pure rules of the shops: the kinds of goods and their rarities, the templates that pre-fill the generator, which kind
 * an entry of a compendium index is, which copy of a duplicated item wins, the stable's and the inn's goods, the draw
 * of a stock, the prices and the payment with change. No Foundry API here, so that the regression checks can run
 * outside Foundry.
 */

export const RARITIES = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];
/** Rarities a shop can allow: the mundane goods, then the magic ones. */
export const SHOP_RARITIES = ['mundane', ...RARITIES];

// Price of a magic item without price, by rarity (Dungeon Master's Guide 2024); a consumable costs half
const MAGIC_PRICE = { common: 100, uncommon: 400, rare: 4000, veryRare: 40000, legendary: 200000 };
const GP = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };

/** Rarity of a spell scroll by spell level, from cantrip to 9 (Dungeon Master's Guide 2024). */
export const SCROLL_RARITY = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'veryRare', 'veryRare', 'veryRare', 'legendary'];

/**
 * The kinds of goods, by group, as the generator lists them: a group's box checks all its kinds. A kind is
 * [key, label, weight, weight of its magic goods]: its share of a draw, multiplied by the weight of the rarity. The
 * stable's goods are drawn too; the services of the checked kinds are all listed, besides the goods drawn.
 */
export const GOODS = [
  { key: 'weapons', label: 'Armes', kinds: [
    ['simpleM', 'Armes courantes de corps à corps', 14, 3], ['simpleR', 'Armes courantes à distance', 6, 2],
    ['martialM', 'Armes de guerre de corps à corps', 22, 5], ['martialR', 'Armes de guerre à distance', 8, 2], ['ammo', 'Munitions', 12, 4]
  ] },
  { key: 'armor', label: 'Armures', kinds: [
    ['light', 'Armures légères', 10, 3], ['medium', 'Armures intermédiaires', 10, 3], ['heavy', 'Armures lourdes', 8, 3], ['shield', 'Boucliers', 6, 3]
  ] },
  { key: 'adventuring', label: "Équipement d'aventurier", kinds: [
    ['gear', 'Matériel', 45], ['containers', 'Contenants', 8], ['clothing', 'Vêtements', 10], ['food', 'Vivres', 12]
  ] },
  { key: 'tools', label: 'Outils', kinds: [
    ['art', "Outils d'artisan", 10], ['game', 'Jeux', 4], ['music', 'Instruments de musique', 5], ['otherTools', 'Autres outils', 6]
  ] },
  { key: 'apothecary', label: 'Apothicaire', kinds: [
    ['potions', 'Potions et fioles', 30, 25], ['herbs', 'Herbes et ingrédients', 15], ['poisons', 'Poisons', 12, 5], ['kits', 'Kits et fournitures', 10]
  ] },
  { key: 'magic', label: 'Objets magiques', kinds: [
    ['wondrous', 'Objets merveilleux', 40], ['rings', 'Anneaux', 8], ['rods', 'Sceptres', 4], ['wands', 'Baguettes', 8],
    ['scrolls', 'Parchemins de sort', 20], ['reagents', 'Ingrédients enchantés', 4]
  ] },
  { key: 'stable', label: 'Écurie', kinds: [['mounts', 'Montures', 50], ['tack', 'Sellerie et fourrage', 35], ['vehicles', 'Véhicules', 15]] },
  { key: 'services', label: 'Services', kinds: [
    ['lodging', 'Chambres', 0], ['meals', 'Repas', 0], ['drinks', 'Boissons', 0], ['hirelings', 'Employés et messagers', 0],
    ['spellcasting', 'Sorts lancés sur demande', 0]
  ] }
];
const KINDS = new Map(GOODS.flatMap(group => group.kinds.map(([key, label, weight, magicWeight = weight]) => [key, { key, label, weight, magicWeight, group: group.key }])));
const kindsOf = (...groups) => GOODS.filter(group => groups.includes(group.key)).flatMap(group => group.kinds.map(([key]) => key));
/** Kinds whose goods come from the item compendiums, which the rarities filter (not the stable's goods nor the services). */
export const ITEM_KINDS = new Set(GOODS.filter(group => !['stable', 'services'].includes(group.key)).flatMap(group => group.kinds.map(([key]) => key)));
export const SERVICE_KINDS = new Set(kindsOf('services'));
/** Order of the kinds, for the lines of a shop. */
export const KIND_ORDER = [...KINDS.keys()];
export const kindLabel = kind => KINDS.get(kind)?.label ?? kind;
// Weight of each rarity in a draw: a magic good is much rarer than a mundane one
const RARITY_WEIGHTS = { mundane: 60, common: 12, uncommon: 9, rare: 5, veryRare: 2.5, legendary: 1 };

/** Weight in a draw of the goods of a kind and a rarity. */
export function poolWeight(kind, rarity) {
  const def = KINDS.get(kind);
  if (!def) return 0;
  return (rarity === 'mundane' ? def.weight : def.magicWeight) * (RARITY_WEIGHTS[rarity] ?? 0);
}

/**
 * The shop templates: the kinds and rarities they check in the generator, which the GM can change before generating.
 * Nothing very rare nor legendary at first.
 */
const UP_TO_RARE = ['common', 'uncommon', 'rare'];
export const SHOPS = {
  hutte: {
    label: 'La Hutte Enchantée', icon: 'fa-solid fa-hat-wizard',
    kinds: [...kindsOf('weapons', 'armor', 'magic'), 'potions', 'poisons'], rarities: UP_TO_RARE
  },
  equipement: { label: 'Équipement', icon: 'fa-solid fa-toolbox', kinds: kindsOf('adventuring', 'tools'), rarities: ['mundane'] },
  forge: { label: 'Forge', icon: 'fa-solid fa-hammer', kinds: kindsOf('weapons', 'armor'), rarities: ['mundane', ...UP_TO_RARE] },
  apothicaire: { label: 'Apothicaire', icon: 'fa-solid fa-flask', kinds: kindsOf('apothecary'), rarities: ['mundane', ...UP_TO_RARE] },
  ecurie: { label: 'Écurie', icon: 'fa-solid fa-horse', kinds: kindsOf('stable'), rarities: ['mundane'] },
  auberge: { label: "L'Auberge", icon: 'fa-solid fa-beer-mug-empty', kinds: kindsOf('services'), rarities: ['mundane'] }
};

/** Kind, rarity and price of a spell sold as a scroll: half the price of a magic item of its rarity. */
export function scrollOf(spell) {
  const rarity = SCROLL_RARITY[Number(spell.system?.level ?? -1)];
  if (!rarity) return null;
  return { kind: 'scrolls', rarity, price: { value: MAGIC_PRICE[rarity] / 2, denomination: 'gp' } };
}

/**
 * Whether the spells of a package are sold as scrolls: those of dnd5e, of the official D&D modules (dnd-…) and of
 * Owidyn, not the automation copies other modules keep of them.
 */
export const sellsScrolls = packageName => ['dnd5e', 'compendium-owidyn'].includes(packageName) || String(packageName).startsWith('dnd-');

/**
 * Services of the inn, from the System Reference Document 5.2 (Food, Drink, and Lodging; Hirelings; Spellcasting
 * Services). `INN_RULES` holds the dnd5e rules page of each kind.
 */
export const INN = [
  ['lodging', 'Inn Stay, Squalid (per day)', 7, 'cp'], ['lodging', 'Inn Stay, Poor (per day)', 1, 'sp'],
  ['lodging', 'Inn Stay, Modest (per day)', 5, 'sp'], ['lodging', 'Inn Stay, Comfortable (per day)', 8, 'sp'],
  ['lodging', 'Inn Stay, Wealthy (per day)', 2, 'gp'], ['lodging', 'Inn Stay, Aristocratic (per day)', 4, 'gp'],
  ['meals', 'Meal, Squalid', 1, 'cp'], ['meals', 'Meal, Poor', 2, 'cp'], ['meals', 'Meal, Modest', 1, 'sp'],
  ['meals', 'Meal, Comfortable', 2, 'sp'], ['meals', 'Meal, Wealthy', 3, 'sp'], ['meals', 'Meal, Aristocratic', 6, 'sp'],
  ['meals', 'Bread (loaf)', 2, 'cp'], ['meals', 'Cheese (wedge)', 1, 'sp'],
  ['drinks', 'Ale (mug)', 4, 'cp'], ['drinks', 'Wine (bottle), Common', 2, 'sp'], ['drinks', 'Wine (bottle), Fine', 10, 'gp'],
  ['hirelings', 'Skilled Hireling (per day)', 2, 'gp'], ['hirelings', 'Untrained Hireling (per day)', 2, 'sp'],
  ['hirelings', 'Messenger (per mile)', 2, 'cp'],
  ['spellcasting', 'Spellcasting: Cantrip', 30, 'gp'], ['spellcasting', 'Spellcasting: Level 1', 50, 'gp'],
  ['spellcasting', 'Spellcasting: Level 2', 200, 'gp'], ['spellcasting', 'Spellcasting: Level 3 (town or city)', 300, 'gp'],
  ['spellcasting', 'Spellcasting: Level 4–5 (town or city)', 2000, 'gp'], ['spellcasting', 'Spellcasting: Level 6–8 (city)', 20000, 'gp'],
  ['spellcasting', 'Spellcasting: Level 9 (city)', 100000, 'gp']
].map(([kind, name, value, denomination]) => ({ kind, name, price: { value, denomination } }));
const SERVICES = 'Compendium.dnd5e.content24.JournalEntry.phbServices00000.JournalEntryPage.';
export const INN_RULES = {
  lodging: `${SERVICES}f67yi5VSl1jEeHpN`, meals: `${SERVICES}f67yi5VSl1jEeHpN`, drinks: `${SERVICES}f67yi5VSl1jEeHpN`,
  hirelings: `${SERVICES}6JpV8RWOi2AG8BdK`, spellcasting: `${SERVICES}mhsrVbdk7Nxzll72`
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
].map(([kind, name, value, denomination, documentName, aliases = []]) => ({
  kind, name, names: [name, ...aliases], price: { value, denomination }, documentName
}));

// Item types that are never goods, and the healing and alchemical goods of the apothecary that dnd5e doesn't type so
const NOT_GOODS = new Set(['spell', 'feat', 'class', 'subclass', 'background', 'race', 'facility']);
const APOTHECARY_GOODS = new Set(["healer's kit", 'perfume']);
const APOTHECARY_TOOLS = new Set(['herb', 'pois', 'alchemist']);
const WEAPONS = new Set(['simpleM', 'simpleR', 'martialM', 'martialR']);
const ARMOR = new Set(['light', 'medium', 'heavy', 'shield']);
const TOOLS = { art: 'art', game: 'game', music: 'music' };
// Loot subtypes of the general store: none, or adventuring gear (not trade goods, gems, art, materials…)
const GEAR_LOOT = new Set(['', 'gear']);
// Consumable subtypes that say what the item is; the others (a module's own) are read from the compendium folder
const KNOWN_CONSUMABLES = new Set(['ammo', 'potion', 'poison', 'food', 'scroll', 'trinket', 'rod', 'wand', 'wondrous']);
// Kind of a magic item by its subtype, when it isn't a weapon nor an armor (wondrous item otherwise)
const MAGIC_KINDS = { ring: 'rings', rod: 'rods', wand: 'wands', potion: 'potions', poison: 'poisons', ammo: 'ammo', scroll: 'scrolls' };

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

// The properties are an array in a compendium index, a Set in a document
export const isMagic = entry => RARITIES.includes(entry.system?.rarity) && [...(entry.system?.properties ?? [])].includes('mgc');

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
 * What an item index entry is as a good: { kinds, rarity }, or null when it isn't for sale. `kinds` are the kinds it
 * can be sold as, first the one it shows (a shop sells it as the first of them it allows): an herbalism kit is a kit
 * of the Apothicaire, else another tool. `rarity` is "mundane" or a magic rarity. An item without price (feature,
 * placeholder, artifact) isn't for sale, nor the stable's goods but at the stable. `folder` is the name of the item's
 * compendium folder (and its parents), read for the loot and consumables that their type doesn't describe.
 */
export function classify(entry, { folder = '' } = {}) {
  const type = entry.type;
  const subtype = entry.system?.type?.value ?? '';
  if (NOT_GOODS.has(type) || !priceOf(entry)) return null;
  const name = normalize(entry.name);
  if (STABLE_NAMES.has(name)) return null;
  const good = (kinds, rarity = 'mundane') => (kinds.length ? { kinds, rarity } : null);
  // An ingredient of the cooking system: food, an herb also, or an enchanted ingredient when its lore sells it only at
  // La Hutte Enchantée (the Baies de Sunilda)
  const ingredient = entry.flags?.['compendium-owidyn']?.cuisine?.ingredient;
  if (ingredient) {
    if (ingredient.boutique === 'hutte') return good(['reagents'], RARITIES.includes(entry.system?.rarity) ? entry.system.rarity : 'common');
    return good(ingredient.family === 'herbe' ? ['herbs', 'food'] : ['food']);
  }
  const hinted = fallback => {
    const hint = folderHint(folder);
    if (hint === null) return null;
    return good(hint ? [hint] : fallback);
  };

  if (isMagic(entry)) {
    if (type === 'loot' || (type === 'consumable' && subtype === 'food')) return null;
    const rarity = entry.system.rarity;
    if ((type === 'weapon' && WEAPONS.has(subtype)) || (type === 'equipment' && ARMOR.has(subtype))) return good([subtype], rarity);
    if (type === 'tool') return good(['wondrous', TOOLS[subtype] ?? 'otherTools'], rarity);
    if (type === 'container') return good(['wondrous', 'containers'], rarity);
    if (subtype === 'clothing') return good(['wondrous', 'clothing'], rarity);
    return good([MAGIC_KINDS[subtype] ?? 'wondrous'], rarity);
  }

  if (type === 'weapon') return WEAPONS.has(subtype) ? good([subtype]) : null;
  if (type === 'equipment') {
    if (ARMOR.has(subtype)) return good([subtype]);
    if (subtype === 'clothing') return good(['clothing']);
    return ['trinket', 'rod', 'wand', 'ring'].includes(subtype) ? good(['gear']) : null;
  }
  if (type === 'consumable') {
    if (subtype === 'ammo') return good(['ammo']);
    if (subtype === 'potion') return good(['potions']);
    if (subtype === 'poison') return good(['poisons']);
    if (APOTHECARY_GOODS.has(name)) return good(['kits', 'gear']);
    if (subtype === 'food') return good(['food']);
    if (!KNOWN_CONSUMABLES.has(subtype)) return hinted([]);
    return ['trinket', 'rod', 'wand'].includes(subtype) ? good(['gear']) : null;
  }
  if (type === 'tool') {
    const tool = TOOLS[subtype] ?? 'otherTools';
    return good(APOTHECARY_TOOLS.has(entry.system?.type?.baseItem) ? ['kits', tool] : [tool]);
  }
  if (type === 'container') return good(['containers']);
  if (type === 'loot') {
    if (APOTHECARY_GOODS.has(name)) return good(['kits', 'gear']);
    return GEAR_LOOT.has(subtype) ? hinted(['gear']) : null;
  }
  return null;
}

/**
 * Rank of a copy among the items sharing a name (lower wins): the Owidyn content, the dnd5e 2024 content, the Owidyn
 * 2014 content (its Legacy compendiums: the 2014 Ensnaring Strike gives way to the 2024 one of dnd5e), the rest of
 * dnd5e, and the other modules (2024 rules first); a compendium of another package hidden from the players comes last.
 * The Owidyn compendiums are all hidden from the players, who still buy their goods: the active GM's client gives them,
 * and shows them their sheets.
 */
export function sourceRank({ packageName, hidden = false, rules = '' }) {
  const owidyn = packageName === 'compendium-owidyn';
  const own = owidyn ? (rules === '2014' ? 2 : 0)
    : packageName === 'dnd5e' ? (rules === '2024' ? 1 : 3) : (rules === '2024' ? 4 : 5);
  return (hidden && !owidyn ? 10 : 0) + own;
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

/* -------------------------------------------- */
/*  Generator and purchases                     */
/* -------------------------------------------- */

/** Price settings of the generator, in percent of the listed prices. */
export const PERCENTS = [50, 100, 150];

/** Value of each coin in copper pieces, from dnd5e's rates (coins per gold piece): pp 1000, gp 100, ep 50, sp 10, cp 1. */
export function coinValues(currencies) {
  return Object.fromEntries(Object.entries(currencies).map(([coin, { conversion }]) => [coin, Math.round(100 / conversion)]));
}

/** A price in copper pieces. */
export const priceInCp = (price, values) => Math.round(Number(price?.value ?? 0) * (values[price?.denomination] ?? values.gp ?? 100));

/** What a purse holds, in copper pieces. */
export const walletInCp = (wallet, values) => Object.keys(values).reduce((sum, coin) => sum + (Number(wallet?.[coin]) || 0) * values[coin], 0);

/**
 * The purse left after paying `cost` copper pieces, or null when it isn't enough. The coins that fit in the price are
 * spent first, largest first; what is still owed is paid with the smallest coin that covers it, and the change comes
 * back in smaller coins (no electrum). A purse of 1 pp and 5 sp pays 8 sp with its 5 sp and the pp, and gets 9 gp and
 * 7 sp back.
 */
export function pay(wallet, cost, values) {
  if (cost <= 0) return { ...wallet };
  if (walletInCp(wallet, values) < cost) return null;
  const coins = Object.keys(values).sort((a, b) => values[b] - values[a]);
  const left = Object.fromEntries(coins.map(coin => [coin, Number(wallet?.[coin]) || 0]));
  let owed = cost;
  for (const coin of coins) {
    const used = Math.min(left[coin], Math.floor(owed / values[coin]));
    left[coin] -= used;
    owed -= used * values[coin];
  }
  if (!owed) return left;
  // Every coin left is worth more than what is owed: the smallest one pays it
  const broken = [...coins].reverse().find(coin => left[coin] > 0);
  left[broken] -= 1;
  let change = values[broken] - owed;
  for (const coin of coins) {
    if ((values[coin] >= values[broken]) || (coin === 'ep')) continue;
    const given = Math.floor(change / values[coin]);
    left[coin] += given;
    change -= given * values[coin];
  }
  return left;
}

/** Number of a good put on sale: one magic item, scroll or mount, 1 to 5 of the other goods, unlimited services. */
export function stockQuantity(good, random) {
  if (good.kind === 'service') return null;
  if (good.magic || (good.kind === 'scroll') || (good.kind === 'actor')) return 1;
  return 1 + Math.floor(random() * 5);
}

/**
 * Up to `count` different goods drawn from their pools (Map pool → goods), each pool picked by its weight; a pool
 * whose goods are all on sale is left aside.
 */
export function drawGoods(pools, weights, count, random) {
  const left = [...pools].filter(([pool, goods]) => goods.length && (weights[pool] > 0))
    .map(([pool, goods]) => ({ pool, goods: [...goods] }));
  const drawn = [];
  while ((drawn.length < count) && left.length) {
    const entry = left[pickWeighted(left.map(candidate => weights[candidate.pool]), random())];
    drawn.push(...entry.goods.splice(Math.floor(random() * entry.goods.length), 1));
    if (!entry.goods.length) left.splice(left.indexOf(entry), 1);
  }
  return drawn;
}
