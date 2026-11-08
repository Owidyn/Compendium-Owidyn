// Run with: node --experimental-vm-modules tests/boutiques/boutiques.test.mjs
// Document-level checks of the shop tables and stocks with simulated Foundry documents; they don't replace a test in
// Foundry.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MODULE_ID = 'compendium-owidyn';
const clone = value => JSON.parse(JSON.stringify(value));

class Collection extends Map {
  [Symbol.iterator]() { return this.values(); }
  get contents() { return [...this.values()]; }
  find(fn) { return this.contents.find(fn); }
  filter(fn) { return this.contents.filter(fn); }
  map(fn) { return this.contents.map(fn); }
  getName(name) { return this.find(doc => doc.name === name); }
}

const item = (name, type, subtype, { rarity = '', magic = false, price = 1, denomination = 'gp' } = {}) => ({
  _id: name.replace(/\W/g, '').padEnd(16, '0').slice(0, 16), name, img: 'icons/svg/item-bag.svg', type,
  system: { rarity, properties: magic ? ['mgc'] : [], type: { value: subtype }, price: { value: price, denomination }, source: { rules: '2024' } }
});
const spell = (name, level) => ({ _id: name.replace(/\W/g, '').padEnd(16, '0').slice(0, 16), name, img: 'icons/svg/book.svg', type: 'spell',
  system: { level, source: { rules: '2024' } } });

// Index fields of every compendium (Foundry's, plus dnd5e's for items)
const DEFAULT_INDEX = { Item: ['name', 'type', 'img', 'sort', 'folder', 'system.container', 'system.identifier', 'system.source'], Actor: ['name', 'type', 'img', 'sort', 'folder'] };
/** As Foundry 14's server: the index fields make a projection, where a field under another one is refused. */
function projection(documentName, fields = []) {
  const projected = {};
  for (const field of new Set([...DEFAULT_INDEX[documentName], ...fields])) {
    const parts = field.split('.');
    const key = parts.pop();
    let target = projected;
    for (const part of parts) {
      if (target[part] === undefined) target[part] = {};
      target = target[part];
    }
    if (typeof target !== 'object') throw new TypeError(`Cannot use 'in' operator to search for '${key}' in ${target}`);
    target[key] = 1;
  }
}

async function harness({ spells = [] } = {}) {
  let nextId = 0;
  const notices = [];
  const rendered = [];
  const uuids = new Map();
  const doc = (data, extra = {}) => {
    const id = data._id ?? `doc${String(++nextId).padStart(13, '0')}`;
    return Object.assign(clone(data), { id, _id: id, getFlag(scope, key) { return this.flags?.[scope]?.[key]; } }, extra);
  };
  const game = {
    user: { isGM: true }, i18n: { lang: 'fr' }, modules: new Map([[MODULE_ID, {}]]),
    folders: new Collection(), tables: new Collection(), journal: new Collection(), items: new Collection(), packs: []
  };
  const enrichers = [];

  class Table {
    constructor(data) {
      Object.assign(this, doc(data));
      this.uuid = `RollTable.${this.id}`;
      this.results = new Collection();
      uuids.set(this.uuid, this);
    }
    async update(data) { Object.assign(this, clone(data)); return this; }
    async createEmbeddedDocuments(type, results) {
      return results.map(data => { const result = doc(data); this.results.set(result.id, result); return result; });
    }
    async deleteEmbeddedDocuments(type, ids) { for (const id of ids) this.results.delete(id); }
    async roll() {
      const total = Number(this.formula.slice(2));
      const roll = 1 + Math.floor(Math.random() * total);
      return { results: this.results.filter(result => result.range[0] <= roll && roll <= result.range[1]) };
    }
  }

  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    game, document: { createElement: tag => ({ tag, dataset: {} }) },
    Hooks: { on() {}, once(name, handler) { if (['init', 'ready'].includes(name)) handler(); } },
    CONFIG: { DND5E: {
      itemRarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', veryRare: 'Très rare', legendary: 'Légendaire' },
      currencies: { gp: { abbreviation: 'po' }, sp: { abbreviation: 'pa' }, cp: { abbreviation: 'pc' } }
    }, TextEditor: { enrichers } },
    CONST: { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 }, DOCUMENT_OWNERSHIP_LEVELS: { OBSERVER: 2 } },
    foundry: { utils: { escapeHTML: String, objectsEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
      applications: { api: { DialogV2: { wait: async () => null } } } },
    ui: { notifications: Object.fromEntries(['info', 'warn', 'error'].map(type => [type, message => notices.push({ type, message })])) },
    fromUuidSync: uuid => uuids.get(uuid),
    fromUuid: async uuid => uuids.get(uuid),
    Item: { implementation: {
      createScrollFromSpell: async (source, options, config) => (config.dialog === false
        ? { toObject: () => ({ name: `Spell Scroll: ${source.name}`, type: 'consumable', system: { price: { value: 0, denomination: 'gp' } }, flags: {} }) } : null),
      createDocuments: async datas => datas.map(data => {
        const created = doc(data);
        created.uuid = `Item.${created.id}`;
        game.items.set(created.id, created);
        uuids.set(created.uuid, created);
        return created;
      }),
      deleteDocuments: async ids => { for (const id of ids) game.items.delete(id); }
    } },
    Folder: { implementation: { create: async data => { const folder = doc(data); game.folders.set(folder.id, folder); return folder; } } },
    RollTable: { implementation: { create: async data => { const table = new Table(data); game.tables.set(table.id, table); return table; } } },
    JournalEntry: { implementation: { create: async data => {
      const journal = doc(data, { pages: new Collection(), sheet: { render: options => rendered.push(options) } });
      journal.createEmbeddedDocuments = async (type, pages) => pages.map(data => {
        const page = doc(data, { async update(changes) { for (const [key, value] of Object.entries(changes)) {
          const parts = key.split('.'); let cursor = this;
          for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
          cursor[parts.at(-1)] = clone(value);
        } } });
        page.uuid = `JournalEntry.${journal.id}.JournalEntryPage.${page.id}`;
        uuids.set(page.uuid, page);
        journal.pages.set(page.id, page);
        return page;
      });
      game.journal.set(journal.id, journal);
      return journal;
    } } }
  });

  const pack = (collection, documentName, entries, { packageName = collection.split('.')[0], hidden = false } = {}) => ({
    collection, documentName, metadata: { packageName }, ownership: { PLAYER: hidden ? 'NONE' : 'OBSERVER' }, folders: [],
    getIndex: async ({ fields } = {}) => { projection(documentName, fields); return entries; }
  });
  for (const entry of spells) uuids.set(`Compendium.dnd5e.spells24.Item.${entry._id}`, entry);
  game.packs.push(
    pack('dnd5e.equipment24', 'Item', [
      item('Longsword', 'weapon', 'martialM', { price: 15 }), item('Chain Mail', 'equipment', 'heavy', { price: 75 }),
      item('Arrows', 'consumable', 'ammo', { price: 1 }), item('Rope', 'consumable', 'trinket', { price: 1 }),
      item('Flame Tongue', 'weapon', 'martialM', { rarity: 'rare', magic: true, price: 4000 }),
      item('Bag of Holding', 'container', '', { rarity: 'uncommon', magic: true, price: 400 }),
      item('Potion of Healing', 'consumable', 'potion', { rarity: 'common', magic: true, price: 50 }),
      item('Acid', 'consumable', 'potion', { price: 25 })
    ]),
    pack('compendium-owidyn.items', 'Item', [item('Bag of Holding', 'container', '', { rarity: 'uncommon', magic: true, price: 500 })]),
    pack('compendium-owidyn.creature-features', 'Item', [item('Bone Bow', 'weapon', 'martialR', { price: 50 })], { hidden: true }),
    pack('dnd5e.items', 'Item', [item('Riding Saddle', 'equipment', 'clothing', { price: 10 })]),
    pack('dnd5e.actors24', 'Actor', [{ _id: 'mmRidingHorse000', name: 'Riding Horse', img: 'horse.webp' }]),
    pack('dnd5e.spells24', 'Item', spells),
    pack('chris-premades.spells', 'Item', [spell('Automated Copy', 1)])
  );

  const modules = new Map();
  async function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const code = await fs.readFile(path.join(ROOT, 'scripts', 'boutiques', filename), 'utf8');
    const module = new vm.SourceTextModule(code, { context, identifier: filename });
    modules.set(filename, module);
    await module.link(specifier => load(path.basename(specifier)));
    return module;
  }
  const main = await load('boutiques.mjs');
  await main.evaluate();
  return { api: game.modules.get(MODULE_ID).api.boutiques, game, notices, rendered, enrichers };
}

const tableOf = (game, shop, category) => game.tables.find(table => JSON.stringify(table.flags[MODULE_ID].boutique) === JSON.stringify(category ? { shop, category } : { shop }));

const cases = [];
const test = (name, run) => cases.push({ name, run });

test('the tables give each shop its categories, one copy per name, and link the stable goods', async () => {
  const { api, game } = await harness();
  await api.buildTables({ notify: false });
  assert.equal(game.folders.size, 7, 'the Boutiques folder and one folder per shop');
  assert.ok(tableOf(game, 'hutte', 'uncommon'), 'the item compendiums are indexed: no index field the server refuses');
  const bag = tableOf(game, 'hutte', 'uncommon').results.contents;
  assert.equal(bag.length, 1);
  assert.equal(bag[0].documentUuid, 'Compendium.compendium-owidyn.items.Item.BagofHolding0000', 'the Owidyn copy wins');
  assert.deepEqual(bag[0].flags[MODULE_ID].boutique.price, { value: 500, denomination: 'gp' });
  assert.deepEqual(tableOf(game, 'forge', 'rare').results.map(result => result.name), ['Flame Tongue']);
  assert.deepEqual(tableOf(game, 'forge', 'weapons').results.map(result => result.name), ['Longsword'], 'creature attacks are not goods');
  assert.deepEqual(tableOf(game, 'apothicaire', 'potions').results.map(result => result.name), ['Acid']);
  const mounts = tableOf(game, 'ecurie', 'mounts').results.contents;
  assert.equal(mounts.length, 8);
  assert.equal(mounts.find(result => result.name === 'Riding Horse').documentUuid, 'Compendium.dnd5e.actors24.Actor.mmRidingHorse000');
  assert.equal(mounts.find(result => result.name === 'Camel').type, 'text', 'a good missing from the compendiums is a text result');
  assert.equal(tableOf(game, 'ecurie', 'tack').results.find(result => result.name === 'Riding Saddle')?.type, 'document');
  const master = tableOf(game, 'forge');
  assert.deepEqual(master.results.map(result => result.flags[MODULE_ID].boutique.category), ['weapons', 'armor', 'ammo', 'rare']);
  assert.equal(master.formula, `1d${55 + 35 + 15 + 3}`);
  assert.equal(master.results.find(result => result.flags[MODULE_ID].boutique.category === 'armor').documentUuid, tableOf(game, 'forge', 'armor').uuid);
});

test('a rebuild keeps the master tables and the weights the GM set', async () => {
  const { api, game } = await harness();
  await api.buildTables({ notify: false });
  const master = tableOf(game, 'forge');
  master.results.find(result => result.flags[MODULE_ID].boutique.category === 'rare').weight = 50;
  await api.buildTables({ notify: false });
  assert.equal(tableOf(game, 'forge'), master);
  assert.equal(master.results.find(result => result.flags[MODULE_ID].boutique.category === 'rare').weight, 50);
  assert.equal(game.tables.size, new Set(game.tables.map(table => table.name)).size, 'no table is duplicated');
});

test('a stock respects the maximum rarity, replaces its page and opens it', async () => {
  const { api, game, rendered } = await harness();
  await api.generateStock({ shop: 'forge', count: 4, maxRarity: '' });
  const journal = game.journal.contents[0];
  assert.equal(journal.name, 'Boutiques');
  const page = journal.pages.getName('Forge');
  assert.ok(page.text.content.includes('@UUID[Compendium.dnd5e.equipment24.Item.Longsword0000000]{Longsword}'));
  assert.ok(!page.text.content.includes('Flame Tongue'), 'no magic item without a maximum rarity');
  assert.equal((page.text.content.match(/<tr><td>/g) ?? []).length, 3, 'the three mundane goods, the tables having no more');
  assert.equal(rendered.at(-1).pageId, page.id);
  await api.generateStock({ shop: 'forge', count: 1, maxRarity: 'rare', percent: 150 });
  assert.equal(journal.pages.size, 1, 'the page of the same name is replaced');
  assert.equal((journal.pages.getName('Forge').text.content.match(/<tr><td>/g) ?? []).length, 1);
});

test('La Hutte Enchantée needs a maximum rarity, and a stock can take its own name', async () => {
  const { api, game, notices } = await harness();
  await api.generateStock({ shop: 'hutte', count: 3, maxRarity: '' });
  assert.equal(notices.at(-1).type, 'warn');
  assert.equal(game.journal.size, 0);
  await api.generateStock({ shop: 'hutte', name: 'Hutte de Mère Grise', count: 2, maxRarity: 'uncommon', percent: 110 });
  const content = game.journal.contents[0].pages.getName('Hutte de Mère Grise').text.content;
  assert.ok(content.includes('550 po'), 'the Bag of Holding at 110 %');
  assert.ok(content.includes('55 po'), 'the Potion of Healing at 110 %');
});

test('La Hutte Enchantée sells scrolls of the spells, made as world items when drawn and replaced with the stock', async () => {
  const { api, game } = await harness({ spells: [spell('Fire Bolt', 0), spell('Fireball', 3)] });
  await api.buildTables({ notify: false });
  const common = tableOf(game, 'hutte', 'scrolls-common').results.contents;
  assert.deepEqual(common.map(result => result.name), ['Fire Bolt'], 'the automation copies of other modules are not sold');
  assert.deepEqual(clone(common[0].flags[MODULE_ID].boutique), { price: { value: 50, denomination: 'gp' }, scroll: true });
  assert.deepEqual(tableOf(game, 'hutte', 'scrolls-uncommon').results.map(result => result.name), ['Fireball']);
  const page = await api.generateStock({ shop: 'hutte', count: 20, maxRarity: 'common' });
  const scrolls = game.items.contents;
  assert.deepEqual(scrolls.map(scroll => scroll.name), ['Spell Scroll: Fire Bolt'], 'Fireball is uncommon, above the maximum rarity');
  assert.equal(scrolls[0].ownership.default, 2, 'the players can open and drag it');
  assert.equal(scrolls[0].flags[MODULE_ID].boutique.page, page.uuid);
  assert.ok(page.text.content.includes(`@UUID[${scrolls[0].uuid}]{Spell Scroll: Fire Bolt}`));
  assert.ok(page.text.content.includes(`@Embed[${scrolls[0].uuid} caption=false]`), 'its sheet is embedded');
  assert.ok(page.text.content.includes('@Embed[Compendium.dnd5e.equipment24.Item.PotionofHealing0 caption=false]'));
  await api.generateStock({ shop: 'hutte', count: 20, maxRarity: 'common' });
  assert.equal(game.items.size, 1, 'the scrolls of the previous stock are deleted');
  assert.notEqual(game.items.contents[0].id, scrolls[0].id);
});

test("L'Auberge lists all its services with their rules, and a page can draw its stock again", async () => {
  const { api, game, enrichers } = await harness();
  const page = await api.generateStock({ shop: 'auberge', count: 3, percent: 200 });
  const content = page.text.content;
  assert.equal((content.match(/<tr><td>/g) ?? []).length, 27, 'every service, whatever the number asked');
  assert.ok(content.includes('<tr><td>Ale (mug)</td><td>Boissons</td><td>8 pc</td></tr>'), 'the price at 200 %');
  assert.ok(content.includes('@UUID[Compendium.dnd5e.content24.JournalEntry.phbServices00000.JournalEntryPage.f67yi5VSl1jEeHpN]'));
  assert.ok(content.includes('@OwidynBoutique[regenerate]'));
  assert.deepEqual(clone(page.flags[MODULE_ID].boutique), { shop: 'auberge', name: "L'Auberge", count: 3, maxRarity: '', percent: 200 });
  const forge = await api.generateStock({ shop: 'forge', name: 'Forge de Brandur', count: 2 });
  forge.text.content = '';
  await api.regenerate(forge.uuid);
  assert.equal((forge.text.content.match(/<tr><td>/g) ?? []).length, 2, 'the same settings draw a new stock');
  const enricher = enrichers.find(config => config.id === 'owidyn-boutique');
  assert.ok(enricher.pattern.test('@OwidynBoutique[regenerate]'));
  const button = enricher.enricher(['@OwidynBoutique[regenerate]', 'regenerate'], { relativeTo: forge });
  assert.equal(button.dataset.page, forge.uuid, 'the button draws the stock of its page');
  game.user.isGM = false;
  assert.equal(enricher.enricher(['@OwidynBoutique[regenerate]', 'regenerate'], { relativeTo: forge }).tag, 'span', 'no button for the players');
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} shop document checks passed.`);
if (failures) process.exitCode = 1;
