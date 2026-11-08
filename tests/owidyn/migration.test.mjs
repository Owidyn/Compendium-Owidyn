// Run: node --experimental-vm-modules tests/owidyn/migration.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { hasModuleUuid, remapUuids } from '../../scripts/owidyn/compendiums.mjs';

const MODULE_ID = 'compendium-owidyn';
const former = (pack, type, id) => `Compendium.${MODULE_ID}.${pack}.${type}.${id}`;
const INDEX = { 'Item.HeliarqueClass01': 'classes', 'Item.FeatureOrbital01': 'classes', 'Actor.FormSatellite001': 'creatures',
  'Item.StrikeGiants0001': 'legacy-backgrounds-feats' };
const packOf = (type, id) => INDEX[`${type}.${id}`];
const checks = [];
const check = (name, run) => checks.push({ name, run });

check('the UUIDs of the former compendiums point at the new ones, embedded documents included', () => {
  const text = `@UUID[${former('compendium-owidyn', 'Item', 'HeliarqueClass01')}.ActiveEffect.effect0000000001]{Classe}`
    + ` ${former('formes-orbitales', 'Actor', 'FormSatellite001')} ${former('compendium-owidyn', 'Item', 'Missing000000001')}`;
  assert.ok(hasModuleUuid(text));
  assert.equal(remapUuids(text, packOf), `@UUID[${former('classes', 'Item', 'HeliarqueClass01')}.ActiveEffect.effect0000000001]{Classe}`
    + ` ${former('creatures', 'Actor', 'FormSatellite001')} ${former('compendium-owidyn', 'Item', 'Missing000000001')}`,
    'a document found in no compendium keeps its UUID');
  assert.ok(!hasModuleUuid('Compendium.dnd5e.spells24.Item.abcdefghijklmnop'));
});

check('a document that left for a Legacy compendium is followed, a UUID already right is kept', () => {
  const current = `${former('classes', 'Item', 'HeliarqueClass01')} ${former('backgrounds-feats', 'Item', 'StrikeGiants0001')}`;
  assert.equal(remapUuids(current, packOf), `${former('classes', 'Item', 'HeliarqueClass01')} ${former('legacy-backgrounds-feats', 'Item', 'StrikeGiants0001')}`);
});

/** A world with one Héliarque, run through the ready hook of scripts/owidyn/migration.mjs. */
async function world({ layout = '' } = {}) {
  const hooks = new Map();
  const settings = new Map([[`${MODULE_ID}.packLayout`, layout]]);
  const notices = [];
  class EmbeddedCollectionField { constructor(model) { this.model = model; } }
  const Effect = { hierarchy: {} };
  const Item = { hierarchy: { effects: new EmbeddedCollectionField(Effect) } };
  const Actor = { hierarchy: { items: new EmbeddedCollectionField(Item), effects: new EmbeddedCollectionField(Effect) } };
  const doc = (constructor, data) => ({
    constructor, data, updates: [],
    toObject() { return JSON.parse(JSON.stringify(this.data)); },
    async update(changes, options) { this.updates.push({ changes, options }); }
  });
  const stats = compendiumSource => ({ compendiumSource, duplicateSource: null, createdTime: 1000, modifiedTime: 2000 });
  const heliarque = doc(Actor, {
    _id: 'actor0000000001', name: 'Héliarque', flags: {}, _stats: stats(null), effects: [],
    items: [
      { _id: 'classItem000001', name: 'Héliarque', effects: [], _stats: stats(former('compendium-owidyn', 'Item', 'HeliarqueClass01')),
        system: { advancement: [{ _id: 'grant', configuration: { items: [{ uuid: former('compendium-owidyn', 'Item', 'FeatureOrbital01') }] } },
          { _id: 'hp', configuration: {} }] } },
      { _id: 'manifestation01', name: 'Manifestation orbitale', effects: [], _stats: stats(null),
        system: { activities: { summon: { profiles: [{ uuid: former('formes-orbitales', 'Actor', 'FormSatellite001'), count: '1' }] } } } },
      { _id: 'dagger000000001', name: 'Dagger', effects: [], _stats: stats('Compendium.dnd5e.equipment24.Item.abcdefghijklmnop'), system: {} },
      { _id: 'strikeFeat00001', name: 'Strike of the Giants', effects: [], _stats: stats(former('backgrounds-feats', 'Item', 'StrikeGiants0001')), system: {} },
      { _id: 'deleted00000001', name: 'Gone', effects: [], _stats: stats(null),
        system: { description: { value: `@UUID[${former('compendium-owidyn', 'Item', 'Missing000000001')}]` } } }
    ]
  });
  const bystander = doc(Actor, { _id: 'actor0000000002', name: 'Goblin', flags: {}, _stats: stats(null), effects: [], items: [] });
  const folder = name => ({ type: 'Compendium', folder: null, name, updates: [], deleted: false,
    async update(changes) { this.updates.push(changes); Object.assign(this, changes); }, async delete() { this.deleted = true; } });
  const folders = { renamed: folder("Owidyn's Source Compendium"), owidyn: folder('Owidyn'), heliarque: folder('Héliarque') };
  const pack = (name, documentName, ids, packFolder = folders.renamed) => ({
    metadata: { packageName: MODULE_ID, name }, documentName, folder: packFolder, getIndex: async () => new Map(ids.map(id => [id, { _id: id }]))
  });
  const game = {
    users: { activeGM: { isSelf: true } },
    settings: { register() {}, get: (scope, key) => settings.get(`${scope}.${key}`), set: async (scope, key, value) => settings.set(`${scope}.${key}`, value) },
    packs: [pack('classes', 'Item', ['HeliarqueClass01', 'FeatureOrbital01']), pack('creatures', 'Actor', ['FormSatellite001']),
      pack('legacy-backgrounds-feats', 'Item', ['StrikeGiants0001'], null),
      { metadata: { packageName: 'dnd5e', name: 'equipment24' }, documentName: 'Item', folder: folders.heliarque, getIndex: async () => new Map() }],
    folders: Object.values(folders),
    actors: [heliarque, bystander], items: [], journal: [], scenes: [], tables: [], macros: [], cards: []
  };
  const context = vm.createContext({
    Hooks: { once: (name, fn) => hooks.set(name, fn) }, game, console,
    foundry: { utils: { isEmpty: value => !Object.keys(value ?? {}).length }, data: { fields: { EmbeddedCollectionField } } },
    ui: { notifications: { info: message => notices.push(message), error: message => notices.push(`ERROR ${message}`) } }
  });
  const load = async file => new vm.SourceTextModule(await fs.readFile(new URL(`../../scripts/owidyn/${file}`, import.meta.url), 'utf8'),
    { context, identifier: file });
  const compendiums = await load('compendiums.mjs');
  await compendiums.link(() => {});
  const migration = await load('migration.mjs');
  await migration.link(() => compendiums);
  await migration.evaluate();
  hooks.get('init')();
  await hooks.get('ready')();
  await migration.namespace.migrated;
  return { heliarque, bystander, settings, notices, folders };
}

check('the first load by the GM updates only the changed items of a character, then records the layout', async () => {
  const { heliarque, bystander, settings, notices } = await world();
  assert.equal(heliarque.updates.length, 1);
  assert.equal(bystander.updates.length, 0, 'a document without former UUID is not updated');
  // Plain data: the objects made in the vm context have its own prototypes
  const { changes, options } = JSON.parse(JSON.stringify(heliarque.updates[0]));
  assert.deepEqual(Object.keys(changes), ['items']);
  assert.deepEqual(changes.items.map(item => item._id), ['classItem000001', 'manifestation01', 'strikeFeat00001'],
    'the other items, including one pointing at a document found nowhere, are left out');
  const [cls, manifestation, strike] = changes.items;
  assert.deepEqual(cls._stats, { compendiumSource: former('classes', 'Item', 'HeliarqueClass01') }, 'only the source changes, not the dates');
  assert.equal(cls.system.advancement.length, 2, 'an array of the system data is written whole');
  assert.equal(cls.system.advancement[0].configuration.items[0].uuid, former('classes', 'Item', 'FeatureOrbital01'));
  assert.deepEqual(manifestation.system, { activities: { summon: { profiles: [{ uuid: former('creatures', 'Actor', 'FormSatellite001'), count: '1' }] } } });
  assert.deepEqual(strike._stats, { compendiumSource: former('legacy-backgrounds-feats', 'Item', 'StrikeGiants0001') }, 'a feat moved to Legacy is followed');
  assert.equal(options.render, false);
  assert.equal(settings.get(`${MODULE_ID}.packLayout`), '5.5+legacy');
  assert.deepEqual(notices, ['Owidyn : 1 document(s) du monde pointent maintenant vers les nouveaux compendiums.']);
});

check('the 5.5 folder takes over the former one, and the emptied folders of 2.3 are deleted', async () => {
  const { folders } = await world();
  assert.deepEqual(JSON.parse(JSON.stringify(folders.renamed.updates)), [{ name: "Owidyn's Source Compendium 5.5" }]);
  assert.equal(folders.owidyn.deleted, true, 'an emptied folder of 2.3 is deleted');
  assert.equal(folders.heliarque.deleted, false, 'a folder that still holds a compendium stays');
});

check('a world already migrated is left untouched', async () => {
  const { heliarque, notices, folders } = await world({ layout: '5.5+legacy' });
  assert.equal(heliarque.updates.length, 0);
  assert.equal(folders.renamed.updates.length, 0);
  assert.deepEqual(notices, []);
});

let failed = 0;
for (const { name, run } of checks) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n  ${err.stack.split('\n').slice(0, 4).join('\n  ')}`);
  }
}
console.log(`${checks.length - failed}/${checks.length} compendium migration checks passed.`);
if (failed) process.exitCode = 1;
