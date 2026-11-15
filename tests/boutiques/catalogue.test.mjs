// Run with: node tests/boutiques/catalogue.test.mjs
// Regression checks of the shop rules; the sidebar tab and the shop window need a Foundry test.
import assert from 'node:assert/strict';
import {
  SHOPS, GOODS, STABLE, INN, INN_RULES, SHOP_RARITIES, ITEM_KINDS, SERVICE_KINDS, KIND_ORDER, classify, kindLabel, poolWeight, isMagic,
  priceOf, scrollOf, sellsScrolls, sourceRank, pickWeighted, adjustPrice, PERCENTS, coinValues, priceInCp, walletInCp, pay, stockQuantity,
  drawGoods
} from '../../scripts/boutiques/catalogue.mjs';

const item = (type, subtype, { rarity = '', magic = false, price = 1, denomination = 'gp', name = 'Item', baseItem = '' } = {}) => ({
  name, type, system: { rarity, properties: magic ? ['mgc'] : [], type: { value: subtype, baseItem }, price: { value: price, denomination } }
});

const cases = [];
const test = (name, run) => cases.push({ name, run });
const as = (kinds, rarity = 'mundane') => ({ kinds, rarity });

test('a magic item is sold as its kind, in its rarity: a weapon or an armor with its type, a ring, a potion, a wondrous item', () => {
  assert.deepEqual(classify(item('equipment', 'wondrous', { rarity: 'uncommon', magic: true, price: 400 })), as(['wondrous'], 'uncommon'));
  assert.deepEqual(classify(item('weapon', 'martialM', { rarity: 'rare', magic: true, price: 4000 })), as(['martialM'], 'rare'));
  assert.deepEqual(classify(item('equipment', 'heavy', { rarity: 'veryRare', magic: true })), as(['heavy'], 'veryRare'));
  assert.deepEqual(classify(item('consumable', 'ammo', { rarity: 'uncommon', magic: true })), as(['ammo'], 'uncommon'));
  assert.deepEqual(classify(item('equipment', 'ring', { rarity: 'rare', magic: true })), as(['rings'], 'rare'));
  assert.deepEqual(classify(item('consumable', 'wand', { rarity: 'uncommon', magic: true })), as(['wands'], 'uncommon'));
  assert.deepEqual(classify(item('consumable', 'potion', { rarity: 'common', magic: true, price: 50 })), as(['potions'], 'common'));
  assert.deepEqual(classify(item('consumable', 'poison', { rarity: 'uncommon', magic: true })), as(['poisons'], 'uncommon'));
  assert.deepEqual(classify(item('container', '', { rarity: 'uncommon', magic: true })), as(['wondrous', 'containers'], 'uncommon'));
  assert.deepEqual(classify(item('tool', 'music', { rarity: 'rare', magic: true })), as(['wondrous', 'music'], 'rare'));
  assert.deepEqual(classify(item('consumable', 'scroll', { rarity: 'common', magic: true })), as(['scrolls'], 'common'));
});

test("a document's properties are a Set: a magic item dropped in a shop is still magic", () => {
  const sword = item('weapon', 'martialM', { rarity: 'rare', magic: true, price: 0 });
  sword.system.properties = new Set(['mgc']);
  assert.ok(isMagic(sword));
  assert.deepEqual(priceOf(sword), { value: 4000, denomination: 'gp' });
});

test('a rarity without the magic property is mundane, and loot, food and artifacts never are magic goods', () => {
  assert.deepEqual(classify(item('consumable', 'food', { rarity: 'common', price: 2, denomination: 'cp' })), as(['food']));
  assert.equal(classify(item('loot', 'gem', { rarity: 'common', price: 50 })), null);
  assert.equal(classify(item('loot', '', { rarity: 'veryRare', magic: true, price: 40000 })), null);
  assert.equal(classify(item('consumable', 'food', { rarity: 'common', magic: true, price: 10 })), null);
  assert.equal(classify(item('equipment', 'wondrous', { rarity: 'artifact', magic: true, price: 0 })), null);
});

test('mundane goods are sold as their kind', () => {
  assert.deepEqual(classify(item('weapon', 'martialM', { price: 15 })), as(['martialM']));
  assert.deepEqual(classify(item('weapon', 'simpleR', { price: 25 })), as(['simpleR']));
  assert.equal(classify(item('weapon', 'natural', { price: 0 })), null);
  assert.deepEqual(classify(item('equipment', 'shield', { price: 10 })), as(['shield']));
  assert.deepEqual(classify(item('consumable', 'ammo', { price: 1 })), as(['ammo']));
  assert.deepEqual(classify(item('consumable', 'potion', { price: 25, name: 'Acid' })), as(['potions']));
  assert.deepEqual(classify(item('consumable', 'poison', { price: 100 })), as(['poisons']));
  assert.deepEqual(classify(item('consumable', 'trinket', { price: 5, name: "Healer's Kit" })), as(['kits', 'gear']));
  assert.deepEqual(classify(item('loot', 'gear', { price: 5, name: 'Perfume' })), as(['kits', 'gear']));
  assert.deepEqual(classify(item('tool', '', { price: 5, baseItem: 'herb' })), as(['kits', 'otherTools']), 'a kit at the Apothicaire, else a tool');
  assert.deepEqual(classify(item('tool', 'art', { price: 50, baseItem: 'alchemist' })), as(['kits', 'art']));
  assert.deepEqual(classify(item('tool', 'game', { price: 1 })), as(['game']));
  assert.deepEqual(classify(item('tool', 'music', { price: 30 })), as(['music']));
  assert.deepEqual(classify(item('tool', '', { price: 25, baseItem: 'thief' })), as(['otherTools']));
  assert.deepEqual(classify(item('consumable', 'trinket', { price: 1, name: 'Rope' })), as(['gear']));
  assert.deepEqual(classify(item('container', '', { price: 2 })), as(['containers']));
  assert.deepEqual(classify(item('equipment', 'clothing', { price: 15 })), as(['clothing']));
  assert.equal(classify(item('loot', 'trade', { price: 2 })), null);
  assert.equal(classify(item('container', '', { price: 0 })), null, 'an item without price is not for sale');
  assert.equal(classify({ name: 'Fireball', type: 'spell', system: { level: 3 } }), null);
});

test('the compendium folder sorts the loot and consumables that their type does not describe', () => {
  const loot = item('loot', '', { price: 1, denomination: 'sp' });
  assert.deepEqual(classify(loot, { folder: 'Herbalist Supplies' }), as(['herbs']));
  assert.deepEqual(classify(loot, { folder: 'Food & Produce' }), as(['food']));
  assert.equal(classify(loot, { folder: 'Ore & Metals' }), null, 'raw materials are not for sale');
  assert.equal(classify(loot, { folder: 'Gemstones' }), null);
  assert.deepEqual(classify(loot, { folder: 'General Store / Tools' }), as(['gear']), 'a store is not an ore');
  assert.deepEqual(classify(loot), as(['gear']));
  assert.deepEqual(classify(item('consumable', 'consumable', { price: 25 }), { folder: 'Potions & Tinctures' }), as(['potions']));
  assert.equal(classify(item('consumable', 'consumable', { price: 25 })), null, 'an unknown consumable without folder is left out');
});

test('the stable goods are only sold at the stable', () => {
  assert.equal(classify(item('equipment', 'clothing', { price: 10, name: 'Riding Saddle' })), null);
  assert.equal(classify(item('consumable', 'food', { price: 5, denomination: 'cp', name: 'Feed' })), null);
  assert.equal(classify(item('container', '', { price: 4, name: 'Saddlebags' })), null);
});

test('a magic item without price costs its rarity price, half for a consumable', () => {
  assert.deepEqual(priceOf(item('equipment', 'wondrous', { rarity: 'rare', magic: true, price: 0 })), { value: 4000, denomination: 'gp' });
  assert.deepEqual(priceOf(item('consumable', 'scroll', { rarity: 'uncommon', magic: true, price: 0 })), { value: 200, denomination: 'gp' });
  assert.deepEqual(priceOf(item('weapon', 'simpleM', { price: 5, denomination: 'sp' })), { value: 5, denomination: 'sp' });
  assert.equal(priceOf(item('loot', 'gear', { price: 0 })), null);
});

test('Owidyn, then dnd5e 2024, then Owidyn Legacy, then dnd5e 2014, then the other modules win; another module\'s hidden compendium comes last', () => {
  const ranks = [
    { packageName: 'compendium-owidyn', rules: '2024' }, { packageName: 'dnd5e', rules: '2024' }, { packageName: 'compendium-owidyn', rules: '2014' },
    { packageName: 'dnd5e', rules: '2014' }, { packageName: 'kctg-5e', rules: '2024' }, { packageName: 'dnd-tashas-cauldron', rules: '2014' },
    { packageName: 'kctg-5e', rules: '2024', hidden: true }
  ].map(sourceRank);
  assert.deepEqual([...ranks].sort((a, b) => a - b), ranks);
  assert.ok(ranks[2] > ranks[1], 'the 2014 Ensnaring Strike of Spells (Legacy) gives way to the 2024 one of dnd5e');
  assert.equal(sourceRank({ packageName: 'compendium-owidyn', rules: '2024', hidden: true }), ranks[0], 'the Owidyn compendiums are hidden from the players, their copies still win');
});

test('cooking ingredients are food, herbs also, and the Baies de Sunilda enchanted ingredients of their rarity', () => {
  const ingredient = (family, extra = {}, rarity = 'common') => ({
    ...item('loot', 'material', { rarity, price: 1, denomination: 'sp' }), flags: { 'compendium-owidyn': { cuisine: { ingredient: { family, tag: null, danger: null, ...extra } } } }
  });
  assert.deepEqual(classify(ingredient('viande')), as(['food']));
  assert.deepEqual(classify(ingredient('herbe')), as(['herbs', 'food']));
  assert.deepEqual(classify(ingredient('fruit', { boutique: 'hutte' }, 'rare')), as(['reagents'], 'rare'));
  assert.deepEqual(classify(ingredient('fruit', { boutique: 'hutte' }, '')), as(['reagents'], 'common'));
  assert.equal(classify({ ...ingredient('boisson'), system: { ...ingredient('boisson').system, price: { value: 0, denomination: 'cp' } } }), null, 'free water is not sold');
  assert.ok(SHOPS.hutte.kinds.includes('reagents') && !SHOPS.apothicaire.kinds.includes('reagents'), 'the berries only at La Hutte, by its template');
});

test('a template only pre-fills kinds of the catalogue, and nothing very rare nor legendary', () => {
  const kinds = new Set(GOODS.flatMap(group => group.kinds.map(([key]) => key)));
  for (const [key, shop] of Object.entries(SHOPS)) {
    assert.ok(shop.label && shop.icon, key);
    assert.ok(shop.kinds.length && shop.kinds.every(kind => kinds.has(kind)), key);
    assert.ok(shop.rarities.every(rarity => SHOP_RARITIES.includes(rarity) && !['veryRare', 'legendary'].includes(rarity)), key);
  }
  assert.deepEqual(SHOPS.forge.kinds, ['simpleM', 'simpleR', 'martialM', 'martialR', 'ammo', 'light', 'medium', 'heavy', 'shield']);
  assert.deepEqual(SHOPS.forge.rarities, ['mundane', 'common', 'uncommon', 'rare']);
  assert.ok(!SHOPS.hutte.rarities.includes('mundane'), 'La Hutte sells magic goods only');
  assert.deepEqual(SHOPS.auberge.kinds, ['lodging', 'meals', 'drinks', 'hirelings', 'spellcasting']);
  assert.equal(kinds.size, KIND_ORDER.length, 'each kind in one group only');
  assert.ok([...SERVICE_KINDS].every(kind => !ITEM_KINDS.has(kind)) && !ITEM_KINDS.has('mounts'));
  assert.equal(kindLabel('rings'), 'Anneaux');
  assert.deepEqual(PERCENTS, [50, 100, 150]);
});

test('a magic good weighs less than a mundane one, the more so the rarer', () => {
  assert.ok(poolWeight('martialM', 'mundane') > poolWeight('martialM', 'common'));
  assert.ok(poolWeight('wondrous', 'common') > poolWeight('wondrous', 'rare'));
  assert.ok(poolWeight('wondrous', 'rare') > poolWeight('wondrous', 'legendary'));
  assert.ok(poolWeight('potions', 'common') > poolWeight('martialM', 'common'), 'a magic shop is not an armory');
  assert.equal(poolWeight('lodging', 'mundane'), 0, 'services are listed, not drawn');
  assert.equal(poolWeight('unknown', 'mundane'), 0);
});

test('a spell is sold as a scroll of the rarity of its level, at half the price of a magic item of that rarity', () => {
  const spell = level => ({ name: 'Spell', type: 'spell', system: { level } });
  assert.deepEqual(scrollOf(spell(0)), { kind: 'scrolls', rarity: 'common', price: { value: 50, denomination: 'gp' } });
  assert.equal(scrollOf(spell(1)).rarity, 'common');
  assert.deepEqual(scrollOf(spell(3)), { kind: 'scrolls', rarity: 'uncommon', price: { value: 200, denomination: 'gp' } });
  assert.equal(scrollOf(spell(5)).rarity, 'rare');
  assert.deepEqual(scrollOf(spell(8)), { kind: 'scrolls', rarity: 'veryRare', price: { value: 20000, denomination: 'gp' } });
  assert.equal(scrollOf(spell(9)).rarity, 'legendary');
  assert.equal(scrollOf(spell(10)), null);
});

test('scrolls come from dnd5e, the official D&D modules and Owidyn', () => {
  assert.ok(['dnd5e', 'compendium-owidyn', 'dnd-tashas-cauldron', 'dnd-players-handbook'].every(sellsScrolls));
  assert.ok(!['chris-premades', 'kctg-5e'].some(sellsScrolls));
});

test("the inn lists the services of the System Reference Document, with their rules", () => {
  assert.equal(INN.length, 27);
  assert.deepEqual([...new Set(INN.map(good => good.kind))], [...SERVICE_KINDS]);
  assert.deepEqual(INN.find(good => good.name === 'Inn Stay, Modest (per day)').price, { value: 5, denomination: 'sp' });
  assert.deepEqual(INN.find(good => good.name === 'Spellcasting: Level 9 (city)').price, { value: 100000, denomination: 'gp' });
  assert.ok([...SERVICE_KINDS].every(kind => INN_RULES[kind]));
});

test('weighted draws follow the weights', () => {
  assert.equal(pickWeighted([1, 1], 0), 0);
  assert.equal(pickWeighted([1, 1], 0.99), 1);
  assert.equal(pickWeighted([3, 1], 0.74), 0);
  assert.equal(pickWeighted([3, 1], 0.76), 1);
});

test('prices are adjusted in their denomination', () => {
  assert.deepEqual(adjustPrice({ value: 400, denomination: 'gp' }, 110), { value: 440, denomination: 'gp' });
  assert.deepEqual(adjustPrice({ value: 5, denomination: 'sp' }, 110), { value: 5.5, denomination: 'sp' });
  assert.deepEqual(adjustPrice({ value: 15, denomination: 'gp' }, 100), { value: 15, denomination: 'gp' });
});

test('every kind has a label and the stable lists the Player\'s Handbook goods', () => {
  for (const group of GOODS) for (const [key, label] of group.kinds) assert.ok(label && (kindLabel(key) === label), key);
  assert.equal(STABLE.length, 21);
  assert.deepEqual([...new Set(STABLE.map(good => good.kind))], ['mounts', 'tack', 'vehicles']);
  assert.ok(STABLE.every(good => good.documentName === (good.kind === 'mounts' ? 'Actor' : 'Item')));
});

const CURRENCIES = { pp: { conversion: 0.1 }, gp: { conversion: 1 }, ep: { conversion: 2 }, sp: { conversion: 10 }, cp: { conversion: 100 } };
const VALUES = coinValues(CURRENCIES);
const purse = (coins = {}) => ({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0, ...coins });

test('coins and prices are counted in copper pieces from the dnd5e rates', () => {
  assert.deepEqual(VALUES, { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 });
  assert.equal(priceInCp({ value: 15, denomination: 'gp' }, VALUES), 1500);
  assert.equal(priceInCp({ value: 2.5, denomination: 'sp' }, VALUES), 25);
  assert.equal(priceInCp({ value: 4 }, VALUES), 400, 'gold pieces without denomination');
  assert.equal(walletInCp(purse({ pp: 1, ep: 1, cp: 3 }), VALUES), 1053);
});

test('a purchase spends the coins that fit, breaks a larger coin when it must and gives the change back', () => {
  assert.deepEqual(pay(purse({ gp: 20 }), 1500, VALUES), purse({ gp: 5 }));
  assert.deepEqual(pay(purse({ pp: 1, sp: 5 }), 80, VALUES), purse({ gp: 9, sp: 7 }), 'the 5 sp, then the pp broken');
  assert.deepEqual(pay(purse({ pp: 1 }), 1, VALUES), purse({ gp: 9, sp: 9, cp: 9 }), 'no electrum in the change');
  assert.deepEqual(pay(purse({ gp: 1, cp: 50 }), 30, VALUES), purse({ gp: 1, cp: 20 }), 'the small coins first when they fit');
  assert.deepEqual(pay(purse({ ep: 3 }), 120, VALUES), purse({ sp: 3 }), 'electrum is spent');
  assert.deepEqual(pay(purse({ gp: 3 }), 0, VALUES), purse({ gp: 3 }), 'a free good');
  assert.equal(pay(purse({ gp: 14, sp: 9, cp: 9 }), 1500, VALUES), null, 'not enough money');
  for (const [coins, cost] of [[{ pp: 3, gp: 1, sp: 7 }, 2345], [{ ep: 9, cp: 4 }, 333], [{ pp: 1, gp: 2, ep: 1, sp: 3, cp: 4 }, 1277]]) {
    const left = pay(purse(coins), cost, VALUES);
    assert.equal(walletInCp(left, VALUES), walletInCp(purse(coins), VALUES) - cost, `${JSON.stringify(coins)} - ${cost}`);
    assert.ok(Object.values(left).every(count => Number.isInteger(count) && (count >= 0)));
  }
});

test('a stock holds one magic good, scroll or mount, 1 to 5 of the others and unlimited services', () => {
  assert.equal(stockQuantity({ kind: 'service' }, () => 0.5), null);
  assert.equal(stockQuantity({ kind: 'item', magic: true }, () => 0.99), 1);
  assert.equal(stockQuantity({ kind: 'scroll' }, () => 0.99), 1);
  assert.equal(stockQuantity({ kind: 'actor' }, () => 0.99), 1);
  assert.equal(stockQuantity({ kind: 'item' }, () => 0), 1);
  assert.equal(stockQuantity({ kind: 'item' }, () => 0.99), 5);
});

test('a draw gives different goods by the weights of their pools, and stops when everything is drawn', () => {
  const longsword = { name: 'Longsword', category: 'martialM' };
  const goods = new Map([['martialM:mundane', [longsword, { name: 'Dagger' }]], ['shield:mundane', [{ name: 'Shield' }]], ['rings:rare', []]]);
  const drawn = drawGoods(goods, { 'martialM:mundane': 3, 'shield:mundane': 1, 'rings:rare': 5 }, 10, () => 0);
  assert.deepEqual(drawn.map(good => good.name), ['Longsword', 'Dagger', 'Shield'], 'an empty pool is never picked');
  assert.equal(drawn[0], longsword, 'the goods as they are');
  const rolls = [0.9, 0];
  assert.deepEqual(drawGoods(goods, { 'martialM:mundane': 3, 'shield:mundane': 1 }, 1, () => rolls.shift()).map(good => good.name), ['Shield'], 'the last quarter of the roll');
  assert.deepEqual(drawGoods(goods, { 'martialM:mundane': 0, 'shield:mundane': 1 }, 5, () => 0).map(good => good.name), ['Shield'], 'a pool without weight is left aside');
  assert.equal(goods.get('martialM:mundane').length, 2, 'the goods given are not changed');
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} shop checks passed.`);
if (failures) process.exitCode = 1;
