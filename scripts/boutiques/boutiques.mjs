/**
 * Boutiques — shop generators.
 * The GM builds a world roll table per category of each shop from every Item compendium (Tables tab › Boutiques), then
 * generates a shop's stock: the master table of the shop picks the categories, kept under the chosen maximum rarity,
 * and their tables the items. The stock is a page of the Boutiques journal, replaced at each generation, with links
 * that can be dragged onto a character sheet. Console: game.modules.get('compendium-owidyn').api.boutiques.
 */
import {
  RARITIES, SHOPS, CATEGORY_LABELS, STABLE, normalize, placesOf, priceOf, sourceRank, allowsCategory, pickWeighted, adjustPrice
} from './catalogue.mjs';

const MODULE_ID = 'compendium-owidyn';
const FLAG = 'boutique';
const INDEX_FIELDS = ['img', 'type', 'folder', 'system.rarity', 'system.type', 'system.price', 'system.properties', 'system.source.rules'];

const flagOf = doc => doc?.getFlag?.(MODULE_ID, FLAG) ?? {};
const categoryLabel = category => (RARITIES.includes(category) ? CONFIG.DND5E.itemRarity[category] : CATEGORY_LABELS[category]) ?? category;
const escape = value => foundry.utils.escapeHTML(String(value ?? ''));

function formatPrice({ value, denomination }) {
  const coin = CONFIG.DND5E.currencies?.[denomination]?.abbreviation ?? denomination;
  return `${Number(value).toLocaleString(game.i18n.lang)} ${coin}`;
}

/* -------------------------------------------- */
/*  Tables                                      */
/* -------------------------------------------- */

/**
 * Every compendium of a document type with its index, whether the players can't open it, and the name of each of its
 * folders followed by its parents' names.
 */
async function indexedPacks(documentName, fields) {
  const packs = [];
  for (const pack of game.packs.filter(p => p.documentName === documentName)) {
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

/** The goods of each shop by category: Map(shop → Map(category → results)), one copy per name in a shop. */
async function collectGoods() {
  const chosen = new Map(Object.keys(SHOPS).map(shop => [shop, new Map()]));
  const offer = (shop, key, candidate) => {
    const current = chosen.get(shop).get(key);
    if (!current || candidate.rank < current.rank) chosen.get(shop).set(key, candidate);
  };

  const itemSources = await indexedPacks('Item', INDEX_FIELDS);
  for (const source of itemSources) {
    for (const entry of source.index) {
      for (const [shop, category] of placesOf(entry, { folder: source.folders.get(entry.folder) ?? '' })) {
        offer(shop, normalize(entry.name), {
          rank: rankOf(source, entry), category, price: priceOf(entry),
          result: { type: 'document', name: entry.name, img: entry.img, documentUuid: uuidOf(source.pack, entry) }
        });
      }
    }
  }

  // The stable's goods keep their Player's Handbook price, linked to a compendium document of the same name if any
  const stableSources = { Actor: await indexedPacks('Actor', ['img', 'system.source.rules']), Item: itemSources };
  for (const good of STABLE) {
    const names = new Set(good.names.map(normalize));
    let found = null;
    for (const source of stableSources[good.documentName]) {
      for (const entry of source.index) {
        if (!names.has(normalize(entry.name))) continue;
        const rank = rankOf(source, entry);
        if (!found || rank < found.rank) found = { rank, result: { type: 'document', name: entry.name, img: entry.img, documentUuid: uuidOf(source.pack, entry) } };
      }
    }
    offer('ecurie', normalize(good.name), {
      rank: 0, category: good.category, price: good.price,
      result: found?.result ?? { type: 'text', name: good.name, img: 'icons/svg/item-bag.svg', description: '' }
    });
  }

  const goods = new Map();
  for (const [shop, entries] of chosen) {
    const categories = new Map();
    for (const { category, price, result } of entries.values()) {
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push({ ...result, weight: 1, flags: { [MODULE_ID]: { [FLAG]: { price } } } });
    }
    goods.set(shop, categories);
  }
  return goods;
}

async function upsertFolder(name, parent, flag) {
  const existing = game.folders.find(folder => folder.type === 'RollTable' && foundry.utils.objectsEqual(flagOf(folder), flag));
  if (existing) return existing;
  return Folder.implementation.create({ name, type: 'RollTable', folder: parent?.id ?? null, flags: { [MODULE_ID]: { [FLAG]: flag } } });
}

/** A world roll table found by its flag, created when missing; its results are replaced, with ranges by weight. */
async function upsertTable(flag, data, results) {
  let table = game.tables.find(candidate => foundry.utils.objectsEqual(flagOf(candidate), flag));
  if (!table) table = await RollTable.implementation.create({ ...data, flags: { [MODULE_ID]: { [FLAG]: flag } } });
  else await table.update(data);
  if (table.results.size) await table.deleteEmbeddedDocuments('TableResult', table.results.map(result => result.id));
  let low = 1;
  const ranged = results.map(result => {
    const range = [low, low + result.weight - 1];
    low += result.weight;
    return { ...result, range };
  });
  await table.createEmbeddedDocuments('TableResult', ranged);
  await table.update({ formula: `1d${Math.max(1, low - 1)}` });
  return table;
}

/** Build (or rebuild) the shop tables from every Item compendium; the weights set on the master tables are kept. */
async function buildTables({ notify = true } = {}) {
  if (!game.user.isGM) return ui.notifications.warn('Seul le MJ peut construire les tables des boutiques.');
  ui.notifications.info('Boutiques : lecture des compendiums…');
  const goods = await collectGoods();
  const root = await upsertFolder('Boutiques', null, { root: true });
  const summary = [];
  for (const [shop, { label, categories: weights }] of Object.entries(SHOPS)) {
    const folder = await upsertFolder(label, root, { shop });
    const master = game.tables.find(table => foundry.utils.objectsEqual(flagOf(table), { shop }));
    const kept = new Map(master?.results.map(result => [flagOf(result).category, result.weight]) ?? []);
    const masterResults = [];
    let count = 0;
    for (const category of Object.keys(weights)) {
      const results = (goods.get(shop).get(category) ?? []).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
      if (!results.length) {
        // A category emptied since the last build (a module uninstalled) loses its table
        await game.tables.find(table => foundry.utils.objectsEqual(flagOf(table), { shop, category }))?.delete();
        continue;
      }
      count += results.length;
      const table = await upsertTable({ shop, category }, {
        name: `${label} — ${categoryLabel(category)}`, img: 'icons/svg/d20-grey.svg', folder: folder.id, replacement: true, displayRoll: true,
        description: `<p>Articles « ${escape(categoryLabel(category))} » de ${escape(label)}, tirés des compendiums.</p>`
      }, results);
      masterResults.push({
        type: 'document', name: table.name, img: table.img, documentUuid: table.uuid,
        weight: kept.get(category) ?? weights[category], flags: { [MODULE_ID]: { [FLAG]: { category } } }
      });
    }
    await upsertTable({ shop }, {
      name: label, img: 'icons/svg/d20-black.svg', folder: folder.id, replacement: true, displayRoll: true,
      description: `<p>Choisit la catégorie de l'objet suivant de ${escape(label)} : changez les poids pour changer la composition des stocks.</p>`
    }, masterResults);
    summary.push(`${label} ${count}`);
  }
  if (notify) ui.notifications.info(`Boutiques : tables construites (${summary.join(', ')} objets).`);
  return goods;
}

/* -------------------------------------------- */
/*  Stock                                       */
/* -------------------------------------------- */

/** The categories of a shop that a stock can contain, with their table and the master table's weight. */
function stockCategories(shop, maxRarity) {
  const master = game.tables.find(table => foundry.utils.objectsEqual(flagOf(table), { shop }));
  if (!master) return null;
  return master.results.contents
    .map(result => ({ category: flagOf(result).category, weight: result.weight, table: fromUuidSync(result.documentUuid) }))
    .filter(entry => entry.table && allowsCategory(entry.category, maxRarity));
}

/** Draw `count` different goods from the shop's categories; fewer when its tables run out. */
async function drawStock(categories, count) {
  const stock = [];
  const seen = new Set();
  const open = [...categories];
  while (stock.length < count && open.length) {
    const pick = open[pickWeighted(open.map(entry => entry.weight), Math.random())];
    let result = null;
    for (let attempt = 0; attempt < 20 && !result; attempt++) {
      const [drawn] = (await pick.table.roll({ recursive: false })).results;
      const key = drawn?.documentUuid ?? drawn?.name;
      if (drawn && !seen.has(key)) {
        seen.add(key);
        result = drawn;
      }
    }
    // A category whose goods are all in the stock (or can't be drawn) is left aside
    if (!result) open.splice(open.indexOf(pick), 1);
    else stock.push({ category: pick.category, result });
  }
  return stock;
}

function stockPage(name, shop, stock, { maxRarity, percent }) {
  const order = Object.keys(SHOPS[shop].categories);
  const rows = stock
    .sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || a.result.name.localeCompare(b.result.name, game.i18n.lang))
    .map(({ category, result }) => {
      const link = result.documentUuid ? `@UUID[${result.documentUuid}]{${escape(result.name)}}` : escape(result.name);
      const price = flagOf(result).price;
      return `<tr><td>${link}</td><td>${escape(categoryLabel(category))}</td><td>${price ? formatPrice(adjustPrice(price, percent)) : '—'}</td></tr>`;
    }).join('');
  const rarity = RARITIES.includes(maxRarity) ? CONFIG.DND5E.itemRarity[maxRarity] : 'aucun objet magique';
  return `<h2>${escape(name)}</h2>`
    + `<p><em>${stock.length} article(s) · rareté maximale : ${escape(rarity)}${percent !== 100 ? ` · prix à ${percent} %` : ''}</em></p>`
    + `<table><thead><tr><th>Article</th><th>Catégorie</th><th>Prix</th></tr></thead><tbody>${rows}</tbody></table>`
    + '<p>Pour acheter un objet, glissez-le sur la fiche du personnage puis retirez son prix de sa bourse ; une monture se place sur la scène depuis son lien.</p>';
}

/**
 * Generate the stock of a shop into the page of the same name of the Boutiques journal, then open it.
 * @param {object} options
 * @param {string} options.shop           Key of the shop (hutte, equipement, forge, apothicaire, ecurie)
 * @param {string} [options.name]         Name of the shop and its page (the shop's label by default)
 * @param {number} [options.count=10]     Number of goods
 * @param {string} [options.maxRarity]    Maximum rarity of the magic goods ('' for none)
 * @param {number} [options.percent=100]  Prices in percent of the listed ones
 */
async function generateStock({ shop, name, count = 10, maxRarity = '', percent = 100 } = {}) {
  if (!game.user.isGM) return ui.notifications.warn('Seul le MJ peut générer le stock d\'une boutique.');
  if (!SHOPS[shop]) return ui.notifications.error(`Boutique inconnue : ${shop}.`);
  if (!stockCategories(shop, maxRarity)) await buildTables();
  const categories = stockCategories(shop, maxRarity) ?? [];
  if (!categories.length) {
    return ui.notifications.warn(shop === 'hutte'
      ? 'La Hutte Enchantée ne vend que des objets magiques : choisissez une rareté maximale.'
      : `Aucun article disponible pour ${SHOPS[shop].label} : mettez à jour les tables.`);
  }
  const stock = await drawStock(categories, count);
  name = name?.trim() || SHOPS[shop].label;

  let journal = game.journal.find(entry => flagOf(entry).journal === true);
  journal ??= await JournalEntry.implementation.create({ name: 'Boutiques', flags: { [MODULE_ID]: { [FLAG]: { journal: true } } } });
  const content = stockPage(name, shop, stock, { maxRarity, percent });
  let page = journal.pages.getName(name);
  if (page) await page.update({ 'text.content': content, [`flags.${MODULE_ID}.${FLAG}.shop`]: shop });
  else [page] = await journal.createEmbeddedDocuments('JournalEntryPage', [{
    name, type: 'text', text: { content, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML }, flags: { [MODULE_ID]: { [FLAG]: { shop } } }
  }]);
  if (stock.length < count) ui.notifications.warn(`${name} : seulement ${stock.length} article(s) disponible(s) sur ${count}.`);
  journal.sheet.render({ force: true, pageId: page.id });
  return page;
}

/* -------------------------------------------- */
/*  Generator window                            */
/* -------------------------------------------- */

async function openGenerator() {
  if (!game.user.isGM) return ui.notifications.warn('Le générateur de boutiques est réservé au MJ.');
  const shops = Object.entries(SHOPS).map(([key, { label }]) => `<option value="${key}">${escape(label)}</option>`).join('');
  const rarities = RARITIES.map(rarity => `<option value="${rarity}" ${rarity === 'uncommon' ? 'selected' : ''}>${escape(CONFIG.DND5E.itemRarity[rarity])}</option>`).join('');
  const field = (label, input) => `<div class="form-group"><label>${label}</label><div class="form-fields">${input}</div></div>`;
  const read = button => {
    const form = button.form.elements;
    return {
      shop: form.shop.value, name: form.shopName.value, count: Math.max(1, Number(form.count.value) || 10),
      maxRarity: form.rarity.value, percent: Math.max(1, Number(form.percent.value) || 100)
    };
  };
  const choice = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Générateur de boutiques', icon: 'fa-solid fa-store' },
    content: field('Boutique', `<select name="shop">${shops}</select>`)
      + field('Nom', '<input type="text" name="shopName" placeholder="Le type de la boutique">')
      + field('Nombre d\'articles', '<input type="number" name="count" value="10" min="1" max="100">')
      + field('Rareté maximale', `<select name="rarity"><option value="">Aucun objet magique</option>${rarities}</select>`)
      + field('Prix (%)', '<input type="number" name="percent" value="100" min="1">')
      + '<p class="hint">La rareté maximale vaut pour les objets magiques de La Hutte Enchantée, de la Forge et de l\'Apothicaire. Le stock remplace la page du même nom dans le journal Boutiques.</p>',
    buttons: [
      { action: 'generate', label: 'Générer', icon: 'fa-solid fa-dice', default: true, callback: (event, button) => ({ action: 'generate', ...read(button) }) },
      { action: 'rebuild', label: 'Mettre à jour les tables', icon: 'fa-solid fa-arrows-rotate', callback: () => ({ action: 'rebuild' }) }
    ],
    rejectClose: false
  });
  if (choice?.action === 'generate') return generateStock(choice);
  if (choice?.action === 'rebuild') {
    await buildTables();
    return openGenerator();
  }
  return null;
}

Hooks.on('renderRollTableDirectory', (app, element) => {
  if (!game.user.isGM) return;
  const actions = element.querySelector('.header-actions');
  if (!actions || actions.querySelector('.owidyn-boutiques')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'owidyn-boutiques';
  button.innerHTML = '<i class="fa-solid fa-store" inert></i> <span>Boutiques</span>';
  button.addEventListener('click', () => openGenerator());
  actions.append(button);
});

Hooks.once('ready', () => {
  const module = game.modules.get(MODULE_ID);
  module.api = { ...module.api, boutiques: { SHOPS, openGenerator, buildTables, generateStock } };
});
