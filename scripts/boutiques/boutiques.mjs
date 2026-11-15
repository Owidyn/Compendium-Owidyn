/**
 * Boutiques — the shops of the world.
 * The GM generates a shop: its goods are drawn from the chosen compendiums, among the kinds of goods and the rarities
 * allowed (a template — La Hutte Enchantée, Équipement, Forge, Apothicaire, Écurie, L'Auberge — only pre-fills them),
 * at 50, 100 or 150 % of their price. A shop is a list of lines (an item, a spell scroll, a mount or a service, with its
 * price and the number on sale) kept in a world setting and listed in the Boutiques tab of the sidebar (shop-ui.mjs).
 * The GM edits the lines; a player buys one for a character they own: the active GM's client checks the purse, pays
 * (making change), gives the item, the scroll or the mount, lowers the stock and tells the chat.
 * Console: game.modules.get('compendium-owidyn').api.boutiques.
 */
import {
  RARITIES, SHOPS, STABLE, INN, INN_RULES, ITEM_KINDS, SERVICE_KINDS, KIND_ORDER, SHOP_RARITIES, normalize, classify, kindLabel,
  poolWeight, priceOf, scrollOf, sellsScrolls, sourceRank, adjustPrice, isMagic, coinValues, priceInCp, pay, stockQuantity, drawGoods
} from './catalogue.mjs';
import { registerGM, asGM } from '../heliarque/socket.mjs';

export const MODULE_ID = 'compendium-owidyn';
const SETTING = 'boutiques';
/**
 * Fields read from the item compendiums. dnd5e already indexes the whole `system.source`: asking for one of its fields
 * as well makes the server refuse the index ("Cannot use 'in' operator to search for 'rules' in 1").
 */
const INDEX_FIELDS = ['img', 'type', 'folder', 'system.rarity', 'system.type', 'system.price', 'system.properties', 'system.level', 'system.source', 'flags.compendium-owidyn.cuisine.ingredient'];
// Copies of the creatures' features and attacks: not goods
export const NOT_SOLD = new Set([`${MODULE_ID}.creature-features`, `${MODULE_ID}.legacy-creature-features`, `${MODULE_ID}.summons`, 'dnd5e.monsterfeatures', 'dnd5e.monsterfeatures24']);
const SCROLL_IMG = 'icons/sundries/scrolls/scroll-runed-brown-purple.webp';
const SERVICE_IMG = 'icons/svg/item-bag.svg';

const escape = value => foundry.utils.escapeHTML(String(value ?? ''));

/** Label of a rarity, in French as the rest of the shops (dnd5e's labels are English without a translation module). */
const RARITY_LABELS = { mundane: 'Non magique', common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', veryRare: 'Très rare', legendary: 'Légendaire' };
export const rarityLabel = rarity => RARITY_LABELS[rarity] ?? CONFIG.DND5E.itemRarity[rarity] ?? rarity;

/** Label of a line's kind of good, with its rarity when it is magic ("Anneaux · Rare"). */
export function categoryLabel(kind, rarity = null) {
  const label = kindLabel(kind);
  return RARITIES.includes(rarity) ? `${label} · ${rarityLabel(rarity)}` : label;
}

export function formatPrice({ value, denomination }) {
  const coin = CONFIG.DND5E.currencies?.[denomination]?.abbreviation ?? denomination;
  return `${Number(value).toLocaleString(game.i18n.lang)} ${game.i18n.localize?.(coin) ?? coin}`;
}

function formatPurse(purse) {
  const coins = Object.keys(CONFIG.DND5E.currencies).filter(coin => Number(purse?.[coin]) > 0);
  return coins.map(coin => formatPrice({ value: purse[coin], denomination: coin })).join(', ') || 'vide';
}

/* -------------------------------------------- */
/*  Storage                                     */
/* -------------------------------------------- */

/** Every shop of the world, by id. */
export const shopsById = () => foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING) ?? {});

/** The shops, by name; a player sees only those shown to the players. */
export function listShops() {
  return Object.values(shopsById()).filter(shop => game.user.isGM || shop.visible)
    .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
}

export const getShop = id => shopsById()[id] ?? null;

/** Save a shop (GM only): the setting reaches every client, which re-renders its Boutiques tab and shop windows. */
export async function saveShop(shop) {
  const shops = shopsById();
  shops[shop.id] = shop;
  await game.settings.set(MODULE_ID, SETTING, shops);
  return shop;
}

export async function deleteShop(id) {
  const shops = shopsById();
  delete shops[id];
  await game.settings.set(MODULE_ID, SETTING, shops);
}

/** Change a shop with a function of its copy, then save it. */
export async function updateShop(id, change) {
  const shop = getShop(id);
  if (!shop) return null;
  change(shop);
  return saveShop(shop);
}

/* -------------------------------------------- */
/*  Goods                                       */
/* -------------------------------------------- */

/** The item compendiums a shop can draw from: all of them but the creatures' features. */
export function itemPacks() {
  return game.packs.filter(pack => (pack.documentName === 'Item') && !NOT_SOLD.has(pack.collection)).map(pack => ({
    collection: pack.collection, label: pack.metadata.label ?? pack.title ?? pack.collection,
    packageTitle: game.modules?.get(pack.metadata.packageName)?.title ?? (pack.metadata.packageName === 'dnd5e' ? 'D&D5e' : pack.metadata.packageName)
  }));
}

/**
 * Every compendium of a document type with its index, whether the players can't open it, and the name of each of its
 * folders followed by its parents' names.
 */
async function indexedPacks(documentName, fields, collections = null) {
  const packs = [];
  for (const pack of game.packs.filter(p => (p.documentName === documentName) && !NOT_SOLD.has(p.collection)
    && (!collections || collections.includes(p.collection)))) {
    try {
      const index = await pack.getIndex({ fields });
      const folders = new Map([...(pack.folders ?? [])].map(folder => [folder.id, [folder, ...(folder.ancestors ?? [])].map(f => f.name).join(' / ')]));
      packs.push({ pack, index, folders, hidden: pack.ownership?.PLAYER === 'NONE' });
    } catch (error) {
      console.warn(`${MODULE_ID} | boutiques : impossible d'indexer ${pack.collection}`, error);
    }
  }
  return packs;
}

const uuidOf = (pack, entry) => entry.uuid ?? `Compendium.${pack.collection}.${pack.documentName}.${entry._id}`;
const rankOf = ({ pack, hidden }, entry) => sourceRank({ packageName: pack.metadata.packageName, hidden, rules: entry.system?.source?.rules });

/**
 * The goods a shop can sell among the kinds and rarities allowed, one copy per name: { pools, services }. The goods of
 * the pools (Map "category:rarity" → goods) are drawn; the services are all listed. A good is
 * { kind: 'item' | 'scroll' | 'actor' | 'service', category, rarity, name, img, uuid, price, magic }, where `category`
 * is its kind of good in the catalogue (simpleM, potions, wondrous, mounts, lodging…) and `rarity` "mundane" or a
 * magic rarity. The rarities filter the goods of the item compendiums, not the stable's goods nor the services.
 * @param {object} [options]
 * @param {Iterable<string>} [options.kinds]      Kinds of goods allowed (all of them by default)
 * @param {Iterable<string>} [options.rarities]   Rarities allowed (all of them by default)
 * @param {string[]} [options.packs]              Item compendiums to read (all of them by default)
 */
export async function goodsOf({ kinds = KIND_ORDER, rarities = SHOP_RARITIES, packs = null } = {}) {
  const allowedKinds = new Set(kinds);
  const allowedRarities = new Set(rarities);
  const chosen = new Map();
  const offer = (key, candidate) => {
    const current = chosen.get(key);
    if (!current || (candidate.rank < current.rank)) chosen.set(key, candidate);
  };

  const stable = STABLE.filter(good => allowedKinds.has(good.kind));
  const needsItems = [...allowedKinds].some(kind => ITEM_KINDS.has(kind)) || stable.some(good => good.documentName === 'Item');
  const itemSources = needsItems ? await indexedPacks('Item', INDEX_FIELDS, packs) : [];
  for (const source of itemSources) {
    for (const entry of source.index) {
      const rank = rankOf(source, entry);
      const place = classify(entry, { folder: source.folders.get(entry.folder) ?? '' });
      const category = place && allowedRarities.has(place.rarity) && place.kinds.find(kind => allowedKinds.has(kind));
      if (category) {
        offer(normalize(entry.name), {
          rank,
          good: { kind: 'item', category, rarity: place.rarity, name: entry.name, img: entry.img, uuid: uuidOf(source.pack, entry), price: priceOf(entry), magic: isMagic(entry) }
        });
      }
      // A spell is sold as a scroll, made from it when it is bought
      const scroll = allowedKinds.has('scrolls') && (entry.type === 'spell') && sellsScrolls(source.pack.metadata.packageName) && scrollOf(entry);
      if (scroll && allowedRarities.has(scroll.rarity)) {
        offer(`scroll:${normalize(entry.name)}`, {
          rank,
          good: { kind: 'scroll', category: 'scrolls', rarity: scroll.rarity, name: `Spell Scroll: ${entry.name}`, img: SCROLL_IMG, uuid: uuidOf(source.pack, entry), price: scroll.price, magic: true }
        });
      }
    }
  }

  // The stable's goods keep their Player's Handbook price, linked to a compendium document of the same name if any
  if (stable.length) {
    const sources = { Actor: stable.some(good => good.documentName === 'Actor') ? await indexedPacks('Actor', ['img', 'system.source']) : [], Item: itemSources };
    for (const good of stable) {
      const names = new Set(good.names.map(normalize));
      let found = null;
      for (const source of sources[good.documentName]) {
        for (const entry of source.index) {
          if (!names.has(normalize(entry.name))) continue;
          const rank = rankOf(source, entry);
          if (!found || (rank < found.rank)) found = { rank, entry, source };
        }
      }
      const base = { category: good.kind, rarity: 'mundane', price: good.price };
      offer(normalize(good.name), {
        rank: 0,
        good: found
          ? { ...base, kind: good.documentName === 'Actor' ? 'actor' : 'item', name: found.entry.name, img: found.entry.img, uuid: uuidOf(found.source.pack, found.entry) }
          : { ...base, kind: 'service', name: good.name, img: SERVICE_IMG }
      });
    }
  }

  // The inn's services
  for (const good of INN.filter(service => allowedKinds.has(service.kind))) {
    offer(normalize(good.name), {
      rank: 0, good: { kind: 'service', category: good.kind, rarity: 'mundane', name: good.name, img: SERVICE_IMG, price: good.price, rules: INN_RULES[good.kind] }
    });
  }

  const pools = new Map();
  const services = [];
  for (const { good } of chosen.values()) {
    if (SERVICE_KINDS.has(good.category)) {
      services.push(good);
      continue;
    }
    const pool = `${good.category}:${good.rarity}`;
    if (!pools.has(pool)) pools.set(pool, []);
    pools.get(pool).push(good);
  }
  return { pools, services };
}

/** A line of a shop for a good: its price at the shop's percentage, and the number on sale. */
function lineOf(good, percent) {
  return {
    id: foundry.utils.randomID(), kind: good.kind, name: good.name, img: good.img ?? SERVICE_IMG, uuid: good.uuid ?? null,
    category: good.category ?? '', rarity: RARITIES.includes(good.rarity) ? good.rarity : null,
    price: adjustPrice(good.price ?? { value: 0, denomination: 'gp' }, percent), quantity: stockQuantity(good, Math.random),
    rules: good.rules ?? null
  };
}

const orderOf = (list, value) => (list.includes(value) ? list.indexOf(value) : list.length);

/**
 * Generate a shop, or a new stock for an existing one (same id, name, description and visibility).
 * @param {object} options
 * @param {string} options.template          Key of the shop template (hutte, equipement, forge, apothicaire, ecurie,
 *                                           auberge): its icon, its name by default, its kinds and rarities by default
 * @param {string} [options.id]              The shop to restock
 * @param {string} [options.name]            Its name (the template's label by default)
 * @param {string} [options.description]
 * @param {string[]} [options.packs]         Item compendiums to draw from (all of them by default)
 * @param {string[]} [options.kinds]         Kinds of goods allowed (those of the template by default)
 * @param {string[]} [options.rarities]      Rarities allowed, "mundane" for the non-magic goods (those of the template by default)
 * @param {number} [options.count=10]        Number of goods drawn; the services allowed are listed besides
 * @param {number} [options.percent=100]     Prices in percent of the listed ones
 */
export async function generateShop({ template, id = null, name = '', description = '', packs = null, kinds = null, rarities = null, count = 10, percent = 100, visible = false } = {}) {
  if (!game.user.isGM) return ui.notifications.warn('Seul le MJ peut générer une boutique.');
  const def = SHOPS[template];
  if (!def) return ui.notifications.error(`Modèle de boutique inconnu : ${template}.`);
  const previous = id ? getShop(id) : null;
  const shopName = name?.trim() || previous?.name || def.label;
  const settings = { packs: packs ?? null, kinds: [...(kinds ?? def.kinds)], rarities: [...(rarities ?? def.rarities)], count };
  const { pools, services } = await goodsOf(settings);
  const weights = Object.fromEntries([...pools.keys()].map(pool => [pool, poolWeight(...pool.split(':'))]));
  const drawn = drawGoods(pools, weights, count, Math.random);
  const chosen = [...drawn, ...services];
  if (!chosen.length) return ui.notifications.warn(`${shopName} : aucun article de ces sortes et de ces raretés dans ces compendiums.`);
  const lines = chosen.map(good => lineOf(good, percent)).sort((a, b) => (orderOf(KIND_ORDER, a.category) - orderOf(KIND_ORDER, b.category))
    || (orderOf(SHOP_RARITIES, a.rarity ?? 'mundane') - orderOf(SHOP_RARITIES, b.rarity ?? 'mundane')) || a.name.localeCompare(b.name, game.i18n.lang));
  const shop = {
    id: previous?.id ?? foundry.utils.randomID(), template, name: shopName,
    description: description ?? previous?.description ?? '',
    visible: previous?.visible ?? visible, percent, settings, lines
  };
  await saveShop(shop);
  const drawable = settings.kinds.some(kind => !SERVICE_KINDS.has(kind));
  if (drawable && (drawn.length < count)) ui.notifications.warn(`${shop.name} : seulement ${drawn.length} article(s) disponible(s) sur ${count}.`);
  return shop;
}

/** Draw a new stock with the settings of the shop's last generation. */
export async function restock(id) {
  const shop = getShop(id);
  if (!shop) return null;
  const { packs = null, kinds = null, rarities = null, count = 10 } = shop.settings ?? {};
  return generateShop({ packs, kinds, rarities, count, id: shop.id, template: shop.template, name: shop.name, description: shop.description, percent: shop.percent });
}

/** A line made from a dropped document (GM): its price at the shop's percentage, one on sale. */
export async function addDocument(id, uuid) {
  const document = await fromUuid(uuid);
  if (!document) return null;
  const actor = document.documentName === 'Actor';
  if (!actor && (document.documentName !== 'Item')) return ui.notifications.warn('Seuls les objets et les créatures se vendent.');
  const spell = document.type === 'spell';
  const scroll = spell && scrollOf(document);
  const place = !actor && !spell && classify(document);
  const price = actor ? { value: 0, denomination: 'gp' } : scroll ? scroll.price : (priceOf(document) ?? { value: 0, denomination: 'gp' });
  return updateShop(id, shop => shop.lines.push({
    id: foundry.utils.randomID(), kind: actor ? 'actor' : spell ? 'scroll' : 'item',
    name: spell ? `Spell Scroll: ${document.name}` : document.name, img: spell ? SCROLL_IMG : document.img, uuid: document.uuid,
    category: scroll ? 'scrolls' : place?.kinds[0] ?? '', rarity: scroll?.rarity ?? (RARITIES.includes(place?.rarity) ? place.rarity : null),
    price: adjustPrice(price, shop.percent ?? 100), quantity: 1, rules: null
  }));
}

/** A new service line (GM), to rename and price in the shop window. */
export const addService = id => updateShop(id, shop => shop.lines.push({
  id: foundry.utils.randomID(), kind: 'service', name: 'Nouveau service', img: SERVICE_IMG, uuid: null, category: '', rarity: null,
  price: { value: 1, denomination: 'gp' }, quantity: null, rules: null
}));

/* -------------------------------------------- */
/*  Purchases                                   */
/* -------------------------------------------- */

/** The characters a user can buy for: those they own (any player character for the GM). */
export function buyersOf(user = game.user) {
  return game.actors.filter(actor => (actor.type === 'character')
    && (user.isGM ? actor.hasPlayerOwner || actor.isOwner : actor.testUserPermission(user, 'OWNER')));
}

async function upsertFolder(name, type) {
  return game.folders.find(folder => (folder.type === type) && folder.getFlag?.(MODULE_ID, 'boutique')?.purchases)
    ?? Folder.implementation.create({ name, type, flags: { [MODULE_ID]: { boutique: { purchases: true } } } });
}

/** Give the good of a line to the buyer: the item (added to a stack of the same one), its scroll, or the mount. */
async function deliver(line, actor, user) {
  if (line.kind === 'service') return null;
  const source = line.uuid && await fromUuid(line.uuid);
  if (!source) throw new Error(`${line.name} est introuvable : retirez-le de la boutique.`);
  if (line.kind === 'actor') {
    const data = game.actors.fromCompendium ? game.actors.fromCompendium(source) : source.toObject();
    data.ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    data.folder = (await upsertFolder('Boutiques — Montures', 'Actor')).id;
    return Actor.implementation.create(data);
  }
  let data;
  if (line.kind === 'scroll') {
    const scroll = await Item.implementation.createScrollFromSpell(source, {}, { dialog: false });
    if (!scroll) throw new Error(`Le parchemin de ${source.name} n'a pas pu être créé.`);
    data = scroll.toObject();
  } else data = game.items.fromCompendium ? game.items.fromCompendium(source) : source.toObject();
  delete data._id;
  data.system = { ...data.system, price: { ...line.price } };
  // A consumable or a loot already carried gets the quantity bought
  const stack = ['consumable', 'loot'].includes(data.type) && actor.items.find(item => (item.type === data.type)
    && (item.name === data.name) && ((item._stats?.compendiumSource ?? null) === (data._stats?.compendiumSource ?? null)));
  if (stack) return stack.update({ 'system.quantity': (stack.system.quantity ?? 1) + (data.system.quantity ?? 1) });
  const [created] = await actor.createEmbeddedDocuments('Item', [data]);
  return created;
}

/**
 * A purchase, run by the active GM's client: the line is still on sale, the buyer belongs to the user, the purse is
 * enough. The good is given first, then the purse paid and the stock lowered, and the chat told.
 * @returns {{ok: boolean, message: string}}
 */
async function processPurchase({ shopId, lineId, actorUuid }, userId) {
  const user = game.users.get(userId);
  const shop = getShop(shopId);
  const line = shop?.lines.find(entry => entry.id === lineId);
  if (!shop || (!user?.isGM && !shop.visible) || !line) return { ok: false, message: 'Cet article n\'est plus en vente.' };
  if (line.quantity === 0) return { ok: false, message: `${line.name} : épuisé.` };
  const actor = await fromUuid(actorUuid);
  if (!actor || !(user.isGM || actor.testUserPermission(user, 'OWNER'))) return { ok: false, message: 'Ce personnage ne vous appartient pas.' };
  const values = coinValues(CONFIG.DND5E.currencies);
  const purse = actor.system.currency ?? {};
  const paid = pay(purse, priceInCp(line.price, values), values);
  if (!paid) {
    return { ok: false, message: `${actor.name} n'a pas assez d'argent pour ${line.name} : ${formatPrice(line.price)} (bourse : ${formatPurse(purse)}).` };
  }
  await deliver(line, actor, user);
  await actor.update({ 'system.currency': paid });
  if (line.quantity !== null) await updateShop(shopId, current => {
    const entry = current.lines.find(candidate => candidate.id === lineId);
    if (entry && (entry.quantity !== null)) entry.quantity = Math.max(0, entry.quantity - 1);
  });
  const verb = line.kind === 'service' ? 'paie' : 'achète';
  const name = line.uuid && (line.kind !== 'scroll') ? `@UUID[${line.uuid}]{${escape(line.name)}}` : escape(line.name);
  await ChatMessage.implementation.create({
    speaker: ChatMessage.implementation.getSpeaker({ actor }),
    content: `<p><strong>${escape(actor.name)}</strong> ${verb} <strong>${name}</strong> pour <strong>${escape(formatPrice(line.price))}</strong> (${escape(shop.name)}).</p>`
  });
  return { ok: true, message: `${actor.name} ${verb} ${line.name} pour ${formatPrice(line.price)}.` };
}

/** Buy a line for a character: the active GM's client makes the purchase, this one shows its outcome. */
export async function buy(shopId, lineId, actor) {
  if (!actor) return ui.notifications.warn('Choisissez le personnage qui achète.');
  try {
    const result = await asGM('boutiques.buy', { shopId, lineId, actorUuid: actor.uuid });
    if (result?.ok) ui.notifications.info(result.message);
    else ui.notifications.warn(result?.message ?? 'Achat impossible.');
    return result;
  } catch (error) {
    ui.notifications.error(error.message);
    return { ok: false, message: error.message };
  }
}

/** The data of a line's good, for a player who can't open the hidden compendium it comes from. */
async function describe({ shopId, lineId }, userId) {
  const user = game.users.get(userId);
  const shop = getShop(shopId);
  const line = shop?.lines.find(entry => entry.id === lineId);
  if (!line?.uuid || (!user?.isGM && !shop.visible)) return null;
  const source = await fromUuid(line.uuid);
  if (!source) return null;
  if (line.kind === 'scroll') return (await Item.implementation.createScrollFromSpell(source, {}, { dialog: false }))?.toObject() ?? null;
  return { documentName: source.documentName, ...source.toObject() };
}

/** Show the sheet of a line's good, read-only for the players. */
export async function showGood(shopId, lineId) {
  const shop = getShop(shopId);
  const line = shop?.lines.find(entry => entry.id === lineId);
  if (!line?.uuid) return null;
  const own = line.kind !== 'scroll' && await fromUuid(line.uuid).catch(() => null);
  if (own?.testUserPermission?.(game.user, 'OBSERVER')) return own.sheet.render({ force: true });
  const data = await asGM('boutiques.describe', { shopId, lineId }).catch(() => null);
  if (!data) return ui.notifications.warn(`${line.name} ne peut pas être affiché.`);
  const cls = (data.documentName === 'Actor') ? Actor.implementation : Item.implementation;
  delete data.documentName;
  data.ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER };
  return new cls(data).sheet.render({ force: true });
}

/* -------------------------------------------- */
/*  Setup                                       */
/* -------------------------------------------- */

// One purchase at a time, so that two players can't both buy the last one on sale
let purchases = Promise.resolve();
registerGM('boutiques.buy', (data, userId) => {
  const run = purchases.then(() => processPurchase(data, userId));
  purchases = run.catch(() => null);
  return run;
});
registerGM('boutiques.describe', describe);

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, SETTING, {
    scope: 'world', config: false, type: Object, default: {},
    onChange: () => Hooks.callAll(`${MODULE_ID}.boutiquesChanged`)
  });
  // The stock pages of the former generator (2.4) kept this button: it's gone, the text with it
  CONFIG.TextEditor.enrichers.push({ id: 'owidyn-boutique', pattern: /@OwidynBoutique\[(\w+)\]/g, enricher: () => document.createElement('span') });
});

Hooks.once('ready', () => {
  const module = game.modules.get(MODULE_ID);
  module.api = {
    ...module.api,
    boutiques: { SHOPS, listShops, getShop, generateShop, restock, deleteShop, addService, addDocument, buy, goodsOf, ...(module.api?.boutiques ?? {}) }
  };
});
