/**
 * Boutiques — shop generators.
 * The GM builds a world roll table per category of each shop from the compendiums (Tables tab › Boutiques), then
 * generates a shop's stock into a page of the Boutiques journal: the goods with their price, the sheet of each one
 * embedded under it, and a button that draws a new stock with the same settings. The master table of a shop picks the
 * categories, kept under the chosen maximum rarity, and their tables the goods. La Hutte Enchantée also sells spell
 * scrolls, made as world items when drawn; L'Auberge lists all its services. Console:
 * game.modules.get('compendium-owidyn').api.boutiques.
 */
import {
  RARITIES, SHOPS, CATEGORY_LABELS, STABLE, INN, INN_RULES, normalize, placesOf, priceOf, scrollOf, scrollRarityOf, sellsScrolls,
  sourceRank, allowsCategory, pickWeighted, adjustPrice
} from './catalogue.mjs';

const MODULE_ID = 'compendium-owidyn';
const FLAG = 'boutique';
/**
 * Fields read from the item compendiums. dnd5e already indexes the whole `system.source`: asking for one of its fields
 * as well makes the server refuse the index ("Cannot use 'in' operator to search for 'rules' in 1").
 */
const INDEX_FIELDS = ['img', 'type', 'folder', 'system.rarity', 'system.type', 'system.price', 'system.properties', 'system.level', 'system.source'];
// Copies of the creatures' features and attacks: not goods
const NOT_SOLD = new Set([`${MODULE_ID}.creature-features`, `${MODULE_ID}.legacy-creature-features`, `${MODULE_ID}.summons`, 'dnd5e.monsterfeatures', 'dnd5e.monsterfeatures24']);

const flagOf = doc => doc?.getFlag?.(MODULE_ID, FLAG) ?? doc?.flags?.[MODULE_ID]?.[FLAG] ?? {};
const escape = value => foundry.utils.escapeHTML(String(value ?? ''));

function categoryLabel(category) {
  const scroll = scrollRarityOf(category);
  if (scroll) return `Parchemins de sorts (${CONFIG.DND5E.itemRarity[scroll] ?? scroll})`;
  return (RARITIES.includes(category) ? CONFIG.DND5E.itemRarity[category] : CATEGORY_LABELS[category]) ?? category;
}

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
  for (const pack of game.packs.filter(p => (p.documentName === documentName) && !NOT_SOLD.has(p.collection))) {
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
      // A spell is sold as a scroll, made from it when it is drawn
      const scroll = (entry.type === 'spell') && sellsScrolls(source.pack.metadata.packageName) && scrollOf(entry);
      if (scroll) {
        offer(scroll.shop, `scroll:${normalize(entry.name)}`, {
          rank: rankOf(source, entry), category: scroll.category, price: scroll.price, scroll: true,
          result: { type: 'document', name: entry.name, img: 'icons/sundries/scrolls/scroll-runed-brown-purple.webp', documentUuid: uuidOf(source.pack, entry) }
        });
      }
    }
  }

  // The stable's goods keep their Player's Handbook price, linked to a compendium document of the same name if any
  const stableSources = { Actor: await indexedPacks('Actor', ['img', 'system.source']), Item: itemSources };
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

  // The inn's services are text results
  for (const good of INN) {
    offer('auberge', normalize(good.name), {
      rank: 0, category: good.category, price: good.price, result: { type: 'text', name: good.name, img: 'icons/svg/item-bag.svg', description: '' }
    });
  }

  const goods = new Map();
  for (const [shop, entries] of chosen) {
    const categories = new Map();
    for (const { category, price, scroll, result } of entries.values()) {
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push({ ...result, weight: 1, flags: { [MODULE_ID]: { [FLAG]: { price, ...(scroll ? { scroll } : {}) } } } });
    }
    goods.set(shop, categories);
  }
  return goods;
}

async function upsertFolder(name, parent, flag, type = 'RollTable') {
  const existing = game.folders.find(folder => folder.type === type && foundry.utils.objectsEqual(flagOf(folder), flag));
  if (existing) return existing;
  return Folder.implementation.create({ name, type, folder: parent?.id ?? null, flags: { [MODULE_ID]: { [FLAG]: flag } } });
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
  if (notify) ui.notifications.info(`Boutiques : tables construites (${summary.join(', ')} articles).`);
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

/** Every good of a shop that lists all of them (the inn's services), in the order of its tables. */
const allGoods = categories => categories.flatMap(({ category, table }) => table.results.contents.map(result => ({ category, result })));

/**
 * The scrolls of a stock become world items (folder Boutiques — Parchemins, that the players can open and drag), made
 * from their spell by dnd5e; those of the page's previous stock are deleted.
 */
async function makeScrolls(page, stock, percent) {
  const previous = game.items.filter(item => flagOf(item).page === page.uuid);
  if (previous.length) await Item.implementation.deleteDocuments(previous.map(item => item.id));
  const scrolls = stock.filter(entry => flagOf(entry.result).scroll);
  if (!scrolls.length) return;
  const folder = await upsertFolder('Boutiques — Parchemins', null, { scrolls: true }, 'Item');
  const made = [];
  for (const entry of scrolls) {
    const spell = await fromUuid(entry.result.documentUuid);
    const scroll = spell && await Item.implementation.createScrollFromSpell(spell, {}, { dialog: false });
    if (!scroll) continue;
    const source = scroll.toObject();
    Object.assign(source, { folder: folder.id, ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } });
    source.system.price = adjustPrice(flagOf(entry.result).price, percent);
    source.flags = { ...source.flags, [MODULE_ID]: { ...source.flags?.[MODULE_ID], [FLAG]: { page: page.uuid } } };
    made.push({ entry, source });
  }
  const created = await Item.implementation.createDocuments(made.map(({ source }) => source));
  created.forEach((item, i) => Object.assign(made[i].entry, { uuid: item.uuid, name: item.name }));
}

function stockPage(name, shop, stock, { maxRarity, percent }) {
  const order = Object.keys(SHOPS[shop].categories);
  const entries = stock.sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category))
    || (a.name ?? a.result.name).localeCompare(b.name ?? b.result.name, game.i18n.lang));
  const uuid = entry => entry.uuid ?? entry.result.documentUuid;
  const label = entry => escape(entry.name ?? entry.result.name);
  const link = entry => (uuid(entry) ? `@UUID[${uuid(entry)}]{${label(entry)}}` : label(entry));
  const price = entry => {
    const listed = flagOf(entry.result).price;
    return listed ? formatPrice(adjustPrice(listed, percent)) : '—';
  };
  const rows = entries.map(e => `<tr><td>${link(e)}</td><td>${escape(categoryLabel(e.category))}</td><td>${price(e)}</td></tr>`).join('');
  const sheets = entries.filter(uuid).map(e => `<h3>${link(e)} · ${price(e)}</h3><p>@Embed[${uuid(e)} caption=false]</p>`).join('');
  const rules = [...new Set(entries.map(e => INN_RULES[e.category]).filter(Boolean))].map(page => `@UUID[${page}]`).join(' · ');
  const settings = SHOPS[shop].all ? [`${stock.length} service(s)`]
    : [`${stock.length} article(s)`, `rareté maximale : ${RARITIES.includes(maxRarity) ? CONFIG.DND5E.itemRarity[maxRarity] : 'aucun objet magique'}`];
  if (percent !== 100) settings.push(`prix à ${percent} %`);
  return `<h2>${escape(name)}</h2>`
    + `<p><em>${escape(settings.join(' · '))}</em></p>`
    + '<p>@OwidynBoutique[regenerate]</p>'
    + `<table><thead><tr><th>Article</th><th>Catégorie</th><th>Prix</th></tr></thead><tbody>${rows}</tbody></table>`
    + (rules ? `<p>Règles : ${rules}</p>` : '')
    + (sheets ? `<h2>Fiches</h2>${sheets}` : '')
    + '<p>Pour acheter un objet, glissez-le sur la fiche du personnage puis retirez son prix de sa bourse ; une monture se place sur la scène depuis son lien.</p>';
}

/**
 * Generate the stock of a shop into the page of the same name of the Boutiques journal, then open it.
 * @param {object} options
 * @param {string} options.shop           Key of the shop (hutte, equipement, forge, apothicaire, ecurie, auberge)
 * @param {string} [options.name]         Name of the shop and its page (the shop's label by default)
 * @param {number} [options.count=10]     Number of goods (L'Auberge lists all its services)
 * @param {string} [options.maxRarity]    Maximum rarity of the magic goods ('' for none)
 * @param {number} [options.percent=100]  Prices in percent of the listed ones
 */
async function generateStock({ shop, name, count = 10, maxRarity = '', percent = 100 } = {}) {
  if (!game.user.isGM) return ui.notifications.warn('Seul le MJ peut générer le stock d\'une boutique.');
  if (!SHOPS[shop]) return ui.notifications.error(`Boutique inconnue : ${shop}.`);
  // Tables never built, or built empty (before the index fix of 2.4.0), are built again
  if (!game.tables.find(table => foundry.utils.objectsEqual(flagOf(table), { shop }))?.results.size) await buildTables();
  const categories = stockCategories(shop, maxRarity) ?? [];
  if (!categories.length) {
    return ui.notifications.warn(shop === 'hutte'
      ? 'La Hutte Enchantée ne vend que des objets magiques : choisissez une rareté maximale.'
      : `Aucun article disponible pour ${SHOPS[shop].label} : mettez à jour les tables.`);
  }
  const all = SHOPS[shop].all;
  const stock = all ? allGoods(categories) : await drawStock(categories, count);
  name = name?.trim() || SHOPS[shop].label;

  let journal = game.journal.find(entry => flagOf(entry).journal === true);
  journal ??= await JournalEntry.implementation.create({ name: 'Boutiques', flags: { [MODULE_ID]: { [FLAG]: { journal: true } } } });
  let page = journal.pages.getName(name);
  [page] = page ? [page] : await journal.createEmbeddedDocuments('JournalEntryPage', [{
    name, type: 'text', text: { content: '', format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML }
  }]);
  await makeScrolls(page, stock, percent);
  await page.update({
    'text.content': stockPage(name, shop, stock, { maxRarity, percent }),
    [`flags.${MODULE_ID}.${FLAG}`]: { shop, name, count, maxRarity, percent }
  });
  if (!all && (stock.length < count)) ui.notifications.warn(`${name} : seulement ${stock.length} article(s) disponible(s) sur ${count}.`);
  journal.sheet.render({ force: true, pageId: page.id });
  return page;
}

/** Draw a new stock for a page of the Boutiques journal, with the settings of its last generation. */
async function regenerate(pageUuid) {
  const page = await fromUuid(pageUuid);
  const settings = flagOf(page);
  if (!page || !settings.shop) return ui.notifications.warn('Cette page n\'est pas le stock d\'une boutique.');
  return generateStock(settings);
}

/* -------------------------------------------- */
/*  Generator window and regenerate button      */
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
      + '<p class="hint">La rareté maximale vaut pour les objets magiques et les parchemins de La Hutte Enchantée, et pour les objets magiques de la Forge et de l\'Apothicaire. L\'Auberge propose tous ses services. Le stock remplace la page du même nom dans le journal Boutiques, qui a un bouton pour le régénérer.</p>',
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

/** @OwidynBoutique[regenerate] in a stock page: a button for the GM that draws a new stock with the same settings. */
function regenerateButton(match, { relativeTo } = {}) {
  if (!game.user.isGM || !relativeTo?.uuid) return document.createElement('span');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'owidyn-boutique-regenerate';
  button.dataset.page = relativeTo.uuid;
  button.innerHTML = '<i class="fa-solid fa-dice" inert></i> Régénérer le stock';
  return button;
}

function onRenderRegenerate(element) {
  const button = element.querySelector('button.owidyn-boutique-regenerate');
  button?.addEventListener('click', async event => {
    event.preventDefault();
    button.disabled = true;
    try { await regenerate(button.dataset.page); } finally { button.disabled = false; }
  });
}

Hooks.once('init', () => {
  CONFIG.TextEditor.enrichers.push({ id: 'owidyn-boutique', pattern: /@OwidynBoutique\[(\w+)\]/g, enricher: regenerateButton, onRender: onRenderRegenerate });
});

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
  module.api = { ...module.api, boutiques: { SHOPS, openGenerator, buildTables, generateStock, regenerate } };
});
