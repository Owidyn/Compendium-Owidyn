// Run with: node tests/boutiques/catalogue.test.mjs
// Regression checks of the shop rules; the tables, the journal and the window need a Foundry test.
import assert from 'node:assert/strict';
import {
  SHOPS, STABLE, INN, INN_RULES, CATEGORY_LABELS, RARITIES, placesOf, priceOf, scrollOf, scrollRarityOf, sellsScrolls, sourceRank,
  allowsCategory, pickWeighted, adjustPrice
} from '../../scripts/boutiques/catalogue.mjs';

const item = (type, subtype, { rarity = '', magic = false, price = 1, denomination = 'gp', name = 'Item', baseItem = '' } = {}) => ({
  name, type, system: { rarity, properties: magic ? ['mgc'] : [], type: { value: subtype, baseItem }, price: { value: price, denomination } }
});

const cases = [];
const test = (name, run) => cases.push({ name, run });

test('magic items go to La Hutte Enchantée, weapons, armor and ammunition also to the Forge', () => {
  assert.deepEqual(placesOf(item('equipment', 'wondrous', { rarity: 'uncommon', magic: true, price: 400 })), [['hutte', 'uncommon']]);
  assert.deepEqual(placesOf(item('weapon', 'martialM', { rarity: 'rare', magic: true, price: 4000 })), [['hutte', 'rare'], ['forge', 'rare']]);
  assert.deepEqual(placesOf(item('equipment', 'heavy', { rarity: 'veryRare', magic: true })), [['hutte', 'veryRare'], ['forge', 'veryRare']]);
  assert.deepEqual(placesOf(item('consumable', 'ammo', { rarity: 'uncommon', magic: true })), [['hutte', 'uncommon'], ['forge', 'uncommon']]);
});

test('magic potions and poisons also go to the Apothecary', () => {
  assert.deepEqual(placesOf(item('consumable', 'potion', { rarity: 'common', magic: true, price: 50 })), [['hutte', 'common'], ['apothicaire', 'common']]);
  assert.deepEqual(placesOf(item('consumable', 'poison', { rarity: 'uncommon', magic: true })), [['hutte', 'uncommon'], ['apothicaire', 'uncommon']]);
});

test('a rarity without the magic property is mundane, and loot, food and artifacts never are magic goods', () => {
  assert.deepEqual(placesOf(item('consumable', 'food', { rarity: 'common', price: 2, denomination: 'cp' })), [['equipement', 'food']]);
  assert.deepEqual(placesOf(item('loot', 'gem', { rarity: 'common', price: 50 })), []);
  assert.deepEqual(placesOf(item('loot', '', { rarity: 'veryRare', magic: true, price: 40000 })), []);
  assert.deepEqual(placesOf(item('consumable', 'food', { rarity: 'common', magic: true, price: 10 })), []);
  assert.deepEqual(placesOf(item('equipment', 'wondrous', { rarity: 'artifact', magic: true, price: 0 })), []);
});

test('mundane goods go to their shop and category', () => {
  assert.deepEqual(placesOf(item('weapon', 'martialM', { price: 15 })), [['forge', 'weapons']]);
  assert.deepEqual(placesOf(item('weapon', 'natural', { price: 0 })), []);
  assert.deepEqual(placesOf(item('equipment', 'shield', { price: 10 })), [['forge', 'armor']]);
  assert.deepEqual(placesOf(item('consumable', 'ammo', { price: 1 })), [['forge', 'ammo']]);
  assert.deepEqual(placesOf(item('consumable', 'potion', { price: 25, name: 'Acid' })), [['apothicaire', 'potions']]);
  assert.deepEqual(placesOf(item('consumable', 'poison', { price: 100 })), [['apothicaire', 'poisons']]);
  assert.deepEqual(placesOf(item('consumable', 'trinket', { price: 5, name: "Healer's Kit" })), [['apothicaire', 'kits'], ['equipement', 'gear']]);
  assert.deepEqual(placesOf(item('loot', 'gear', { price: 5, name: 'Perfume' })), [['apothicaire', 'kits'], ['equipement', 'gear']]);
  assert.deepEqual(placesOf(item('tool', '', { price: 5, baseItem: 'herb' })), [['equipement', 'tools'], ['apothicaire', 'kits']]);
  assert.deepEqual(placesOf(item('consumable', 'trinket', { price: 1, name: 'Rope' })), [['equipement', 'gear']]);
  assert.deepEqual(placesOf(item('container', '', { price: 2 })), [['equipement', 'gear']]);
  assert.deepEqual(placesOf(item('equipment', 'clothing', { price: 15 })), [['equipement', 'clothing']]);
  assert.deepEqual(placesOf(item('loot', 'trade', { price: 2 })), []);
  assert.deepEqual(placesOf(item('container', '', { price: 0 })), [], 'an item without price is not for sale');
  assert.deepEqual(placesOf({ name: 'Fireball', type: 'spell', system: { level: 3 } }), []);
});

test('the compendium folder sorts the loot and consumables that their type does not describe', () => {
  const loot = item('loot', '', { price: 1, denomination: 'sp' });
  assert.deepEqual(placesOf(loot, { folder: 'Herbalist Supplies' }), [['apothicaire', 'herbs']]);
  assert.deepEqual(placesOf(loot, { folder: 'Food & Produce' }), [['equipement', 'food']]);
  assert.deepEqual(placesOf(loot, { folder: 'Ore & Metals' }), [], 'raw materials are not for sale');
  assert.deepEqual(placesOf(loot, { folder: 'Gemstones' }), []);
  assert.deepEqual(placesOf(loot, { folder: 'General Store / Tools' }), [['equipement', 'gear']], 'a store is not an ore');
  assert.deepEqual(placesOf(loot), [['equipement', 'gear']]);
  assert.deepEqual(placesOf(item('consumable', 'consumable', { price: 25 }), { folder: 'Potions & Tinctures' }), [['apothicaire', 'potions']]);
  assert.deepEqual(placesOf(item('consumable', 'consumable', { price: 25 })), [], 'an unknown consumable without folder is left out');
});

test('the stable goods are only sold at the stable', () => {
  assert.deepEqual(placesOf(item('equipment', 'clothing', { price: 10, name: 'Riding Saddle' })), []);
  assert.deepEqual(placesOf(item('consumable', 'food', { price: 5, denomination: 'cp', name: 'Feed' })), []);
  assert.deepEqual(placesOf(item('container', '', { price: 4, name: 'Saddlebags' })), []);
});

test('a magic item without price costs its rarity price, half for a consumable', () => {
  assert.deepEqual(priceOf(item('equipment', 'wondrous', { rarity: 'rare', magic: true, price: 0 })), { value: 4000, denomination: 'gp' });
  assert.deepEqual(priceOf(item('consumable', 'scroll', { rarity: 'uncommon', magic: true, price: 0 })), { value: 200, denomination: 'gp' });
  assert.deepEqual(priceOf(item('weapon', 'simpleM', { price: 5, denomination: 'sp' })), { value: 5, denomination: 'sp' });
  assert.equal(priceOf(item('loot', 'gear', { price: 0 })), null);
});

test('Owidyn, then dnd5e 2024, then dnd5e 2014, then the other modules win; a hidden compendium comes last', () => {
  const ranks = [
    { packageName: 'compendium-owidyn', rules: '2024' }, { packageName: 'dnd5e', rules: '2024' }, { packageName: 'dnd5e', rules: '2014' },
    { packageName: 'kctg-5e', rules: '2024' }, { packageName: 'dnd-tashas-cauldron', rules: '2014' }, { packageName: 'compendium-owidyn', hidden: true }
  ].map(sourceRank);
  assert.deepEqual([...ranks].sort((a, b) => a - b), ranks);
});

test('the maximum rarity keeps the mundane categories and the magic ones up to it', () => {
  assert.equal(allowsCategory('weapons', ''), true);
  assert.equal(allowsCategory('common', ''), false);
  assert.equal(allowsCategory('uncommon', 'uncommon'), true);
  assert.equal(allowsCategory('rare', 'uncommon'), false);
  assert.equal(allowsCategory('legendary', 'legendary'), true);
  assert.equal(allowsCategory('scrolls-rare', 'uncommon'), false, 'a scroll rarer than the maximum');
  assert.equal(allowsCategory('scrolls-uncommon', 'uncommon'), true);
  assert.equal(allowsCategory('scrolls-common', ''), false, 'no scroll without magic items');
  assert.equal(allowsCategory('lodging', ''), true);
});

test('a spell is sold as a scroll of the rarity of its level, at half the price of a magic item of that rarity', () => {
  const spell = level => ({ name: 'Spell', type: 'spell', system: { level } });
  assert.deepEqual(scrollOf(spell(0)), { shop: 'hutte', category: 'scrolls-common', price: { value: 50, denomination: 'gp' } });
  assert.deepEqual(scrollOf(spell(1)).category, 'scrolls-common');
  assert.deepEqual(scrollOf(spell(3)), { shop: 'hutte', category: 'scrolls-uncommon', price: { value: 200, denomination: 'gp' } });
  assert.deepEqual(scrollOf(spell(5)).category, 'scrolls-rare');
  assert.deepEqual(scrollOf(spell(8)), { shop: 'hutte', category: 'scrolls-veryRare', price: { value: 20000, denomination: 'gp' } });
  assert.deepEqual(scrollOf(spell(9)).category, 'scrolls-legendary');
  assert.equal(scrollRarityOf('scrolls-veryRare'), 'veryRare');
  assert.equal(scrollRarityOf('rare'), null);
});

test('scrolls come from dnd5e, the official D&D modules and Owidyn', () => {
  assert.ok(['dnd5e', 'compendium-owidyn', 'dnd-tashas-cauldron', 'dnd-players-handbook'].every(sellsScrolls));
  assert.ok(!['chris-premades', 'kctg-5e'].some(sellsScrolls));
});

test("the inn lists the services of the System Reference Document, with their rules", () => {
  assert.equal(INN.length, 27);
  assert.deepEqual([...new Set(INN.map(good => good.category))], Object.keys(SHOPS.auberge.categories));
  assert.deepEqual(INN.find(good => good.name === 'Inn Stay, Modest (per day)').price, { value: 5, denomination: 'sp' });
  assert.deepEqual(INN.find(good => good.name === 'Spellcasting: Level 9 (city)').price, { value: 100000, denomination: 'gp' });
  assert.ok(Object.keys(SHOPS.auberge.categories).every(category => INN_RULES[category]));
  assert.equal(SHOPS.auberge.all, true);
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

test('every shop category has a label and the stable lists the Player\'s Handbook goods', () => {
  for (const { categories } of Object.values(SHOPS)) {
    for (const category of Object.keys(categories)) assert.ok(RARITIES.includes(category) || scrollRarityOf(category) || CATEGORY_LABELS[category], category);
  }
  assert.equal(STABLE.length, 21);
  assert.deepEqual([...new Set(STABLE.map(good => good.category))], ['mounts', 'tack', 'vehicles']);
  assert.ok(STABLE.every(good => good.documentName === (good.category === 'mounts' ? 'Actor' : 'Item')));
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} shop checks passed.`);
if (failures) process.exitCode = 1;
