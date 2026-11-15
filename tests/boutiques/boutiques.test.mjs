// Run with: node --experimental-vm-modules tests/boutiques/boutiques.test.mjs
// Document-level checks of the shops (generation and purchases) with simulated Foundry documents; they don't replace a
// test in Foundry.
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
  some(fn) { return this.contents.some(fn); }
}

const item = (name, type, subtype, { rarity = '', magic = false, price = 1, denomination = 'gp', quantity = 1 } = {}) => ({
  _id: name.replace(/\W/g, '').padEnd(16, '0').slice(0, 16), name, img: 'icons/svg/item-bag.svg', type,
  system: { rarity, quantity, properties: magic ? ['mgc'] : [], type: { value: subtype }, price: { value: price, denomination }, source: { rules: '2024' } }
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
  const id = () => `doc${String(++nextId).padStart(13, '0')}`;
  const notices = [];
  const chat = [];
  const uuids = new Map();
  const settings = new Map();
  const registered = new Map();
  const handlers = new Map();
  const hooks = new Map();
  const called = [];

  const users = new Collection([['gm', { id: 'gm', isGM: true }], ['alice', { id: 'alice', isGM: false }], ['bob', { id: 'bob', isGM: false }]]);
  const game = {
    user: users.get('gm'), users, i18n: { lang: 'fr', localize: key => key }, modules: new Map([[MODULE_ID, {}]]),
    folders: new Collection(), packs: [], actors: new Collection(),
    items: { fromCompendium: document => ({ ...clone(document.toObject()), _stats: { compendiumSource: document.uuid } }) },
    settings: {
      register: (scope, key, config) => registered.set(key, config),
      get: (scope, key) => clone(settings.get(key) ?? registered.get(key).default),
      set: async (scope, key, value) => { settings.set(key, clone(value)); registered.get(key).onChange?.(value); return value; }
    }
  };
  game.actors.fromCompendium = document => ({ ...clone(document.toObject()), _stats: { compendiumSource: document.uuid } });

  // A compendium document as fromUuid returns it
  const compendiumDoc = (collection, documentName, data) => {
    const uuid = `Compendium.${collection}.${documentName}.${data._id}`;
    const document = { ...clone(data), uuid, documentName, toObject: () => clone(data) };
    uuids.set(uuid, document);
    return document;
  };

  function character(name, owner, currency) {
    const actorId = id();
    const actor = {
      id: actorId, uuid: `Actor.${actorId}`, name, type: 'character', hasPlayerOwner: true, isOwner: true,
      system: { currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0, ...currency } }, items: new Collection(),
      testUserPermission: user => user.isGM || (user.id === owner),
      async update(changes) { if (changes['system.currency']) this.system.currency = clone(changes['system.currency']); return this; },
      async createEmbeddedDocuments(type, datas) {
        return datas.map(data => {
          const created = { ...clone(data), id: id() };
          created.update = async changes => { if ('system.quantity' in changes) created.system.quantity = changes['system.quantity']; return created; };
          this.items.set(created.id, created);
          return created;
        });
      }
    };
    game.actors.set(actor.id, actor);
    uuids.set(actor.uuid, actor);
    return actor;
  }

  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    game, document: { createElement: tag => ({ tag, dataset: {} }) },
    Hooks: {
      on(name, handler) { hooks.set(name, [...(hooks.get(name) ?? []), handler]); },
      once(name, handler) { if (['init', 'ready'].includes(name)) handler(); },
      callAll(name, ...args) { called.push(name); for (const handler of hooks.get(name) ?? []) handler(...args); }
    },
    CONFIG: { DND5E: {
      itemRarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', veryRare: 'Très rare', legendary: 'Légendaire' },
      currencies: { pp: { abbreviation: 'pp', conversion: 0.1 }, gp: { abbreviation: 'po', conversion: 1 }, ep: { abbreviation: 'pe', conversion: 2 },
        sp: { abbreviation: 'pa', conversion: 10 }, cp: { abbreviation: 'pc', conversion: 100 } }
    }, TextEditor: { enrichers: [] } },
    CONST: { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0, OBSERVER: 2, OWNER: 3 } },
    foundry: { utils: { escapeHTML: String, deepClone: clone, randomID: () => id().slice(3) } },
    ui: { notifications: Object.fromEntries(['info', 'warn', 'error'].map(type => [type, message => notices.push({ type, message })])) },
    fromUuid: async uuid => uuids.get(uuid) ?? null,
    Item: { implementation: {
      createScrollFromSpell: async (source, options, config) => (config.dialog === false
        ? { toObject: () => ({ name: `Spell Scroll: ${source.name}`, type: 'consumable', system: { quantity: 1, price: { value: 0, denomination: 'gp' } }, _stats: {} }) } : null)
    } },
    Actor: { implementation: { create: async data => { const created = { ...clone(data), id: id() }; game.actors.set(created.id, created); return created; } } },
    Folder: { implementation: { create: async data => { const folder = { ...clone(data), id: id(), getFlag(scope, key) { return this.flags?.[scope]?.[key]; } }; game.folders.set(folder.id, folder); return folder; } } },
    ChatMessage: { implementation: { create: async data => chat.push(data), getSpeaker: ({ actor }) => ({ alias: actor.name }) } }
  });

  const pack = (collection, documentName, entries, { packageName = collection.split('.')[0], hidden = false } = {}) => {
    for (const entry of entries) compendiumDoc(collection, documentName, entry);
    return {
      collection, documentName, metadata: { packageName, label: collection }, ownership: { PLAYER: hidden ? 'NONE' : 'OBSERVER' }, folders: [],
      getIndex: async ({ fields } = {}) => { projection(documentName, fields); return entries; }
    };
  };
  game.packs.push(
    pack('dnd5e.equipment24', 'Item', [
      item('Longsword', 'weapon', 'martialM', { price: 15 }), item('Chain Mail', 'equipment', 'heavy', { price: 75 }),
      item('Arrows', 'consumable', 'ammo', { price: 1, quantity: 20 }), item('Rope', 'consumable', 'trinket', { price: 1 }),
      item('Flame Tongue', 'weapon', 'martialM', { rarity: 'rare', magic: true, price: 4000 }),
      item('Bag of Holding', 'container', '', { rarity: 'uncommon', magic: true, price: 400 }),
      item('Potion of Healing', 'consumable', 'potion', { rarity: 'common', magic: true, price: 50 }),
      item('Acid', 'consumable', 'potion', { price: 25 })
    ]),
    // Hidden from the players like every Owidyn compendium: its copy still wins
    pack('compendium-owidyn.items', 'Item', [item('Bag of Holding', 'container', '', { rarity: 'uncommon', magic: true, price: 500 })], { hidden: true }),
    pack('compendium-owidyn.creature-features', 'Item', [item('Bone Bow', 'weapon', 'martialR', { price: 50 })], { hidden: true }),
    pack('dnd5e.items', 'Item', [item('Riding Saddle', 'equipment', 'clothing', { price: 10 })]),
    pack('dnd5e.actors24', 'Actor', [{ _id: 'mmRidingHorse000', name: 'Riding Horse', img: 'horse.webp', type: 'npc' }]),
    pack('dnd5e.spells24', 'Item', spells),
    pack('chris-premades.spells', 'Item', [spell('Automated Copy', 1)])
  );

  // The GM relay of the module: the handlers run here, as the requesting user
  const socket = new vm.SyntheticModule(['registerGM', 'asGM'], function () {
    this.setExport('registerGM', (name, handler) => handlers.set(name, handler));
    this.setExport('asGM', async (name, data) => handlers.get(name)(data, game.user.id));
  }, { context });
  const modules = new Map();
  async function load(specifier) {
    if (specifier.includes('heliarque/socket.mjs')) return socket;
    const filename = path.basename(specifier);
    if (modules.has(filename)) return modules.get(filename);
    const code = await fs.readFile(path.join(ROOT, 'scripts', 'boutiques', filename), 'utf8');
    const module = new vm.SourceTextModule(code, { context, identifier: filename });
    modules.set(filename, module);
    await module.link(load);
    return module;
  }
  const main = await load('boutiques.mjs');
  await main.evaluate();
  const api = { ...game.modules.get(MODULE_ID).api.boutiques, ...main.namespace };
  const as = userId => { game.user = users.get(userId); };
  return { api, game, notices, chat, character, as, changed: () => called.filter(name => name === `${MODULE_ID}.boutiquesChanged`).length };
}

const names = shop => clone(shop.lines.map(line => line.name));
const cases = [];
const test = (name, run) => cases.push({ name, run });

const SHOPS = {
  hutte: { kinds: ['simpleM', 'simpleR', 'martialM', 'martialR', 'ammo', 'light', 'medium', 'heavy', 'shield', 'wondrous', 'rings', 'rods', 'wands', 'scrolls', 'reagents', 'potions', 'poisons'], rarities: ['common', 'uncommon', 'rare'] },
  forge: { kinds: ['simpleM', 'simpleR', 'martialM', 'martialR', 'ammo', 'light', 'medium', 'heavy', 'shield'], rarities: ['mundane', 'common', 'uncommon', 'rare'] },
  ecurie: { kinds: ['mounts', 'tack', 'vehicles'] }
};
const poolNames = (goods, pool) => clone((goods.pools.get(pool) ?? []).map(good => good.name));

test('the goods are found by kind and rarity, one copy per name, and the stable links its goods', async () => {
  const { api } = await harness();
  const hutte = await api.goodsOf(SHOPS.hutte);
  assert.equal(hutte.pools.get('wondrous:uncommon').length, 1, 'the item compendiums are indexed: no index field the server refuses');
  assert.equal(hutte.pools.get('wondrous:uncommon')[0].uuid, 'Compendium.compendium-owidyn.items.Item.BagofHolding0000', 'the Owidyn copy wins');
  assert.deepEqual(clone(hutte.pools.get('wondrous:uncommon')[0].price), { value: 500, denomination: 'gp' });
  assert.deepEqual(poolNames(hutte, 'martialM:rare'), ['Flame Tongue'], 'a magic weapon at La Hutte');
  assert.ok(![...hutte.pools.keys()].some(pool => pool.endsWith(':mundane')), 'nothing mundane at La Hutte');
  const forge = await api.goodsOf(SHOPS.forge);
  assert.deepEqual(poolNames(forge, 'martialM:mundane'), ['Longsword']);
  assert.ok(!forge.pools.has('martialR:mundane'), 'creature attacks are not goods');
  assert.deepEqual(poolNames(forge, 'martialM:rare'), ['Flame Tongue']);
  assert.ok(!forge.pools.has('potions:common'), 'the potions are not checked');
  const stable = await api.goodsOf(SHOPS.ecurie);
  const horse = stable.pools.get('mounts:mundane').find(good => good.name === 'Riding Horse');
  assert.equal(horse.kind, 'actor');
  assert.equal(horse.uuid, 'Compendium.dnd5e.actors24.Actor.mmRidingHorse000');
  assert.equal(stable.pools.get('mounts:mundane').find(good => good.name === 'Camel').kind, 'service', 'a good missing from the compendiums is a service');
  assert.equal(stable.pools.get('tack:mundane').find(good => good.name === 'Riding Saddle').kind, 'item');
  const only = await api.goodsOf({ ...SHOPS.forge, packs: ['dnd5e.items'] });
  assert.equal(only.pools.size, 0, 'only the compendiums chosen are read');
});

test('the template only pre-fills: a Forge can sell potions, and an element unchecked is left out', async () => {
  const { api } = await harness();
  const shop = await api.generateShop({ template: 'forge', count: 10, kinds: ['martialM', 'potions'], rarities: ['mundane', 'common'] });
  assert.deepEqual(names(shop), ['Longsword', 'Acid', 'Potion of Healing'], 'by kind, then mundane before magic');
  assert.deepEqual(clone(shop.lines.map(line => [line.category, line.rarity])), [['martialM', null], ['potions', null], ['potions', 'common']]);
  const noChain = await api.generateShop({ template: 'forge', count: 10, kinds: SHOPS.forge.kinds.filter(kind => kind !== 'heavy'), rarities: ['mundane'] });
  assert.deepEqual(names(noChain), ['Longsword', 'Arrows'], 'the heavy armor unchecked');
});

test('a shop is drawn from its allowed kinds at its price setting, saved, and restocked with the same settings', async () => {
  const { api, game, changed } = await harness();
  const shop = await api.generateShop({ template: 'forge', count: 10, kinds: ['martialM', 'heavy', 'ammo'], rarities: ['mundane'], percent: 150, description: 'Chez Brandur' });
  assert.deepEqual(names(shop), ['Longsword', 'Arrows', 'Chain Mail'], 'the mundane goods, in the order of the kinds');
  assert.deepEqual(clone(shop.lines[0].price), { value: 23, denomination: 'gp' }, 'the Longsword at 150 %');
  assert.ok(shop.lines.every(line => (line.quantity >= 1) && (line.quantity <= 5)), 'one to five of a mundane good');
  assert.equal(api.getShop(shop.id).description, 'Chez Brandur', 'saved in the world setting');
  assert.equal(shop.visible, false, 'hidden from the players until the GM shows it');
  assert.ok(changed(), 'the interface is told of the change');
  await api.updateShop(shop.id, current => { current.visible = true; current.name = 'Forge de Brandur'; });
  const again = await api.restock(shop.id);
  assert.equal(again.id, shop.id);
  assert.equal(again.name, 'Forge de Brandur');
  assert.equal(again.visible, true);
  assert.deepEqual(clone(again.settings), { packs: null, kinds: ['martialM', 'heavy', 'ammo'], rarities: ['mundane'], count: 10 });
  assert.equal(Object.keys(game.settings.get(MODULE_ID, 'boutiques')).length, 1);
  await api.updateShop(shop.id, current => { current.settings = { packs: null, categories: ['weapons'], count: 10 }; });
  const old = await api.restock(shop.id);
  assert.deepEqual(clone(old.settings.kinds), SHOPS.forge.kinds, 'settings of an earlier build: those of its template');
});

test('magic goods come one at a time and only from their rarities; the count is kept', async () => {
  const { api, notices } = await harness({ spells: [spell('Fire Bolt', 0), spell('Fireball', 3)] });
  const shop = await api.generateShop({ template: 'hutte', count: 2, kinds: ['potions', 'scrolls'], rarities: ['common'] });
  assert.equal(shop.lines.length, 2);
  assert.deepEqual(names(shop).sort(), ['Potion of Healing', 'Spell Scroll: Fire Bolt'], 'no uncommon good, no automation copy of another module');
  assert.ok(shop.lines.every(line => line.quantity === 1));
  assert.equal(shop.lines.find(line => line.kind === 'scroll').uuid, 'Compendium.dnd5e.spells24.Item.FireBolt00000000');
  await api.generateShop({ template: 'hutte', count: 5, rarities: ['legendary'] });
  assert.equal(notices.at(-1).type, 'warn', 'nothing to sell');
});

test("L'Auberge lists all its services, unlimited, besides the goods drawn", async () => {
  const { api, notices } = await harness();
  const shop = await api.generateShop({ template: 'auberge', count: 3, percent: 200 });
  assert.equal(shop.lines.length, 27, 'every service, whatever the number asked');
  assert.equal(notices.length, 0, 'no warning when only services are asked');
  assert.ok(shop.lines.every(line => (line.kind === 'service') && (line.quantity === null)));
  assert.deepEqual(clone(shop.lines.find(line => line.name === 'Ale (mug)').price), { value: 8, denomination: 'cp' });
  assert.equal(shop.lines.find(line => line.name === 'Ale (mug)').rules, 'Compendium.dnd5e.content24.JournalEntry.phbServices00000.JournalEntryPage.f67yi5VSl1jEeHpN', 'the link to its rules');
  const tavern = await api.generateShop({ template: 'auberge', count: 1, kinds: ['gear', 'drinks'], rarities: ['mundane'] });
  assert.deepEqual(names(tavern), ['Rope', 'Ale (mug)', 'Wine (bottle), Common', 'Wine (bottle), Fine'], 'one good drawn, and the drinks');
});

test('a purchase pays with change, gives the item, stacks consumables, lowers the stock and tells the chat', async () => {
  const { api, character, chat, as } = await harness();
  const shop = await api.generateShop({ template: 'forge', count: 10, kinds: ['martialM', 'ammo'], rarities: ['mundane'] });
  await api.updateShop(shop.id, current => { current.visible = true; for (const line of current.lines) line.quantity = 2; });
  const hero = character('Lyra', 'alice', { pp: 2, sp: 3 });
  as('alice');
  const sword = shop.lines.find(line => line.name === 'Longsword');
  const result = await api.buy(shop.id, sword.id, hero);
  assert.ok(result.ok, result.message);
  assert.deepEqual({ ...hero.system.currency }, { pp: 0, gp: 5, ep: 0, sp: 3, cp: 0 }, '15 gp out of 2 pp and 3 sp: 5 gp and 3 sp left');
  assert.equal(hero.items.contents[0].name, 'Longsword');
  assert.equal(hero.items.contents[0]._stats.compendiumSource, 'Compendium.dnd5e.equipment24.Item.Longsword0000000');
  assert.equal(api.getShop(shop.id).lines.find(line => line.id === sword.id).quantity, 1);
  assert.ok(chat.at(-1).content.includes('achète') && chat.at(-1).content.includes('Longsword'));
  const arrows = shop.lines.find(line => line.name === 'Arrows');
  await api.buy(shop.id, arrows.id, hero);
  await api.buy(shop.id, arrows.id, hero);
  assert.equal(hero.items.filter(entry => entry.name === 'Arrows').length, 1, 'one stack');
  assert.equal(hero.items.find(entry => entry.name === 'Arrows').system.quantity, 40);
  const soldOut = await api.buy(shop.id, arrows.id, hero);
  assert.equal(soldOut.ok, false, 'sold out');
});

test('a purchase is refused without enough money, for someone else\'s character, or in a hidden shop', async () => {
  const { api, character, as, notices, chat } = await harness();
  const shop = await api.generateShop({ template: 'forge', count: 10, kinds: ['martialM'], rarities: ['mundane'] });
  const line = shop.lines[0];
  const poor = character('Pip', 'alice', { gp: 3 });
  as('alice');
  assert.equal((await api.buy(shop.id, line.id, poor)).ok, false, 'hidden from the players');
  as('gm');
  await api.updateShop(shop.id, current => { current.visible = true; });
  as('alice');
  const broke = await api.buy(shop.id, line.id, poor);
  assert.equal(broke.ok, false);
  assert.ok(broke.message.includes('pas assez d\'argent'));
  assert.equal(notices.at(-1).type, 'warn', 'the player is told');
  assert.deepEqual({ ...poor.system.currency }, { pp: 0, gp: 3, ep: 0, sp: 0, cp: 0 }, 'nothing paid');
  assert.equal(poor.items.size, 0);
  const rich = character('Bors', 'bob', { gp: 100 });
  assert.equal((await api.buy(shop.id, line.id, rich)).ok, false, 'not her character');
  assert.equal(rich.system.currency.gp, 100);
  assert.equal(chat.length, 0);
});

test('a scroll is made from its spell, a mount joins the world for its buyer, a service is only paid', async () => {
  const { api, game, character, chat, as } = await harness({ spells: [spell('Fire Bolt', 0)] });
  const hutte = await api.generateShop({ template: 'hutte', count: 5, kinds: ['scrolls'], rarities: ['common'] });
  const stable = await api.generateShop({ template: 'ecurie', count: 30, kinds: ['mounts'] });
  const inn = await api.generateShop({ template: 'auberge' });
  for (const shop of [hutte, stable, inn]) await api.updateShop(shop.id, current => { current.visible = true; });
  const hero = character('Lyra', 'alice', { gp: 200 });
  as('alice');
  assert.ok((await api.buy(hutte.id, hutte.lines[0].id, hero)).ok);
  assert.equal(hero.items.contents[0].name, 'Spell Scroll: Fire Bolt');
  assert.deepEqual(clone(hero.items.contents[0].system.price), { value: 50, denomination: 'gp' });
  const horse = stable.lines.find(line => line.name === 'Riding Horse');
  assert.ok((await api.buy(stable.id, horse.id, hero)).ok);
  const mount = game.actors.find(actor => actor.name === 'Riding Horse');
  assert.equal(mount.ownership.alice, 3, 'the buyer owns the mount');
  assert.equal(mount.folder, game.folders.contents[0].id);
  const ale = inn.lines.find(line => line.name === 'Ale (mug)');
  const before = { ...hero.system.currency };
  assert.ok((await api.buy(inn.id, ale.id, hero)).ok);
  assert.equal(hero.items.size, 1, 'a service gives nothing');
  assert.equal(api.getShop(inn.id).lines.find(line => line.id === ale.id).quantity, null, 'still unlimited');
  assert.ok(chat.at(-1).content.includes('paie'));
  assert.notDeepEqual({ ...hero.system.currency }, before);
});

test('the GM drops items into a shop and adds services', async () => {
  const { api } = await harness({ spells: [spell('Fireball', 3)] });
  const shop = await api.generateShop({ template: 'forge', count: 1, kinds: ['martialM'], rarities: ['mundane'], percent: 50 });
  await api.addDocument(shop.id, 'Compendium.dnd5e.equipment24.Item.FlameTongue00000');
  await api.addDocument(shop.id, 'Compendium.dnd5e.spells24.Item.Fireball00000000');
  await api.addService(shop.id);
  const lines = api.getShop(shop.id).lines;
  assert.deepEqual(clone(lines.map(line => line.kind)), ['item', 'item', 'scroll', 'service']);
  assert.deepEqual(clone(lines[1].price), { value: 2000, denomination: 'gp' }, 'the shop\'s price setting');
  assert.deepEqual(clone(lines[2].price), { value: 100, denomination: 'gp' }, 'a scroll at half the price of its rarity');
  assert.deepEqual(clone(lines.map(line => [line.category, line.rarity])), [['martialM', null], ['martialM', 'rare'], ['scrolls', 'uncommon'], ['', null]], 'the kind of a dropped good');
  assert.equal(lines[3].quantity, null);
});

test('two players buying the last one at the same time: only the first gets it', async () => {
  const { api, character, as } = await harness();
  const shop = await api.generateShop({ template: 'forge', count: 1, kinds: ['martialM'], rarities: ['mundane'] });
  await api.updateShop(shop.id, current => { current.visible = true; current.lines[0].quantity = 1; });
  const lyra = character('Lyra', 'alice', { gp: 100 });
  const bors = character('Bors', 'bob', { gp: 100 });
  as('alice');
  const first = api.buy(shop.id, shop.lines[0].id, lyra);
  as('bob');
  const second = api.buy(shop.id, shop.lines[0].id, bors);
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map(result => result.ok), [true, false]);
  assert.equal(lyra.items.size + bors.items.size, 1);
  assert.equal(bors.system.currency.gp, 100, 'the second one pays nothing');
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} shop document checks passed.`);
if (failures) process.exitCode = 1;
