/**
 * Migrate a world made with an older version of Compendium Owidyn, or with the former Heliarque and cartomancien-deck
 * modules.
 *   node tools/migrate-world.mjs <world>     Foundry closed, after a backup of the world.
 *
 * - UUIDs of the four compendiums of 2.3 and before (Compendium Owidyn, Formes orbitales, Journaux, Bestiaire), and of
 *   the documents since moved to the Legacy compendiums → the compendium that now holds each document, in every document
 *   of the world (the module also does it at the first load by the GM, scripts/owidyn/migration.mjs, but not in chat
 *   messages nor settings)
 * - the sidebar folder "Owidyn's Source Compendium" becomes "Owidyn's Source Compendium 5.5"
 * - flags.Heliarque → flags.compendium-owidyn.heliarque, flags.cartomancien-deck → flags.compendium-owidyn.cartomancien
 * - compendium UUIDs and image paths of the old modules → this module, in every document of the world
 * - the Cartomancien world compendiums are moved into this module's compendiums (Classes › Cartomancien and
 *   Journals › Spell Lists › Cartomancien), then removed from the world
 * - settings, module activation and compendium configuration of the old modules and compendiums are converted or removed
 * Running it again changes nothing.
 */
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FOLDERS, PACKS, remapUuids } from '../scripts/owidyn/compendiums.mjs';

const MODULE_ID = 'compendium-owidyn';
const ITEM_PACK = PACKS.classes;
const ACTOR_PACK = PACKS.creatures;
const JOURNAL_PACK = PACKS.journals;
const LEGACY = { heliarque: 'Heliarque', cartomancien: 'cartomancien-deck' };
const LEGACY_PACKS = { content: 'cartomancien-content', spells: 'cartomancien-spell-lists' };
/** Compendiums of 2.3 and the ones that received their content (which take over their ownership and lock). */
const SPLIT = {
  'compendium-owidyn': [PACKS.classes, PACKS.items, PACKS.species, PACKS.backgroundsFeats, PACKS.spells,
    PACKS.legacyBackgroundsFeats, PACKS.legacySpells],
  bestiaire: [PACKS.creatures, PACKS.creatureFeatures, PACKS.legacyCreatures, PACKS.legacyCreatureFeatures],
  journaux: [PACKS.journals],
  'formes-orbitales': []
};
/** Same IDs as IDS in scripts/cartomancien/content.js. */
const CARTO = {
  class: 'CrtmClass0000001', subclass: 'CrtmPari00000001', folderClass: 'CrtmFolderClass1', folderFeatures: 'CrtmFolderFeat01',
  folderParieur: 'CrtmFolderPari01', folderSubclassFeatures: 'CrtmFolderSubF01', folderJournal: 'CrtmFolderJrnl01'
};
const SPELL_LISTS_FOLDER = /^(spell lists|listes de sorts)$/i;

const world = process.argv[2];
if (!world) {
  console.error('Usage : node tools/migrate-world.mjs <identifiant du monde>');
  process.exit(1);
}
const moduleDir = new URL('../', import.meta.url);
const worldDir = new URL(`../../../worlds/${world}/`, import.meta.url);
const path = (relative, base = moduleDir) => fileURLToPath(new URL(relative, base));
if (!existsSync(path('world.json', worldDir))) {
  console.error(`Monde introuvable : ${path('', worldDir)}`);
  process.exit(1);
}

/* -------------------------------------------- */
/*  Document data                               */
/* -------------------------------------------- */

const STRINGS = [
  [`Compendium.${LEGACY.heliarque}.heliarque-formes.`, `Compendium.${MODULE_ID}.${ACTOR_PACK}.`],
  [`Compendium.${LEGACY.heliarque}.heliarque.`, `Compendium.${MODULE_ID}.${ITEM_PACK}.`],
  [`Compendium.world.${LEGACY_PACKS.content}.`, `Compendium.${MODULE_ID}.${ITEM_PACK}.`],
  [`Compendium.world.${LEGACY_PACKS.spells}.`, `Compendium.${MODULE_ID}.${JOURNAL_PACK}.`],
  [`modules/${LEGACY.heliarque}/assets/icons/`, `modules/${MODULE_ID}/assets/heliarque/`],
  [`modules/${LEGACY.cartomancien}/assets/icons/`, `modules/${MODULE_ID}/assets/cartomancien/`],
  [`flags.${LEGACY.heliarque}.`, `flags.${MODULE_ID}.heliarque.`],
  [`flags.${LEGACY.cartomancien}.`, `flags.${MODULE_ID}.cartomancien.`]
];

/** Rewrite old UUIDs and paths in every string, and move old flag scopes under this module, at any depth. */
function migrate(value, key = null) {
  if (typeof value === 'string') return remapUuids(STRINGS.reduce((text, [from, to]) => text.replaceAll(from, to), value), packOf);
  if (Array.isArray(value)) return value.map(v => migrate(v));
  if (!value || typeof value !== 'object') return value;
  const out = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, migrate(v, k)]));
  if (key === 'flags') {
    for (const [ns, scope] of Object.entries(LEGACY)) {
      if (!(scope in out)) continue;
      out[MODULE_ID] = { ...out[MODULE_ID], [ns]: { ...out[MODULE_ID]?.[ns], ...out[scope] } };
      delete out[scope];
    }
  }
  return out;
}

/* -------------------------------------------- */
/*  LevelDB                                     */
/* -------------------------------------------- */

const { ClassicLevel } = await import('classic-level').catch(() => {
  console.error('classic-level manquant : lancez « npm install » dans le dossier du module.');
  process.exit(1);
});

async function open(dir) {
  const db = new ClassicLevel(dir, { keyEncoding: 'utf8', valueEncoding: 'json' });
  try {
    await db.open();
  } catch (err) {
    console.error(`Base verrouillée ou illisible : ${dir}\nFermez Foundry, puis relancez. ${err.cause?.message ?? err.message}`);
    process.exit(1);
  }
  return db;
}

async function entries(db) {
  const all = new Map();
  for await (const [key, value] of db.iterator()) all.set(key, value);
  return all;
}

async function commit(db, operations) {
  if (operations.length) {
    await db.batch(operations);
    await db.compactRange('\x00', '\xff');
  }
  await db.close();
  return operations.length;
}

/** Compendium of each document of the module now (`Item.<id>` → classes…), read from its packs. */
async function moduleIndex() {
  const { packs } = JSON.parse(await readFile(path('module.json'), 'utf8'));
  const collections = { Item: 'items', Actor: 'actors', JournalEntry: 'journal' };
  const index = new Map();
  for (const { name, type } of packs) {
    const db = await open(path(`packs/${name}`));
    for (const key of (await entries(db)).keys()) {
      const [, collection, id] = key.split('!');
      if (collection === collections[type] && !id.includes('.')) index.set(`${type}.${id}`, name);
    }
    await db.close();
  }
  return index;
}
const INDEX = await moduleIndex();
const packOf = (type, id) => INDEX.get(`${type}.${id}`);

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

/** Old settings are dropped; module activation and compendium configuration are moved to this module. */
function migrateSetting(setting) {
  const [scope] = setting.key.split('.');
  if (Object.values(LEGACY).includes(scope)) return null;
  if (setting.key === 'core.moduleConfiguration') {
    const modules = JSON.parse(setting.value);
    for (const id of Object.values(LEGACY)) delete modules[id];
    modules[MODULE_ID] = true;
    return { ...setting, value: JSON.stringify(modules) };
  }
  if (setting.key === 'core.compendiumConfiguration') {
    const packs = JSON.parse(setting.value);
    for (const id of [`${LEGACY.heliarque}.heliarque`, `${LEGACY.heliarque}.heliarque-formes`, `world.${LEGACY_PACKS.content}`,
      `world.${LEGACY_PACKS.spells}`]) delete packs[id];
    // The new compendiums go to the module's sidebar folder (module.json), with the ownership and lock set for the old ones.
    for (const [former, names] of Object.entries(SPLIT)) {
      const config = packs[`${MODULE_ID}.${former}`];
      if (!config) continue;
      delete packs[`${MODULE_ID}.${former}`];
      const kept = Object.fromEntries(Object.entries(config).filter(([key]) => ['ownership', 'locked'].includes(key)));
      if (!Object.keys(kept).length) continue;
      for (const name of names) packs[`${MODULE_ID}.${name}`] = { ...kept, ...packs[`${MODULE_ID}.${name}`] };
    }
    return { ...setting, value: JSON.stringify(packs) };
  }
  return migrate(setting);
}

/* -------------------------------------------- */
/*  World documents                             */
/* -------------------------------------------- */

async function migrateWorldData() {
  const report = {};
  const { readdir } = await import('node:fs/promises');
  for (const name of await readdir(path('data/', worldDir))) {
    const db = await open(path(`data/${name}`, worldDir));
    const operations = [];
    for (const [key, value] of await entries(db)) {
      const next = name === 'settings' ? migrateSetting(value) : migrate(value);
      if (next === null) operations.push({ type: 'del', key });
      else if (JSON.stringify(next) !== JSON.stringify(value)) operations.push({ type: 'put', key, value: next });
    }
    const changed = await commit(db, operations);
    if (changed) report[name] = changed;
  }
  return report;
}

/**
 * Compendium folders of the sidebar: "Owidyn's Source Compendium" becomes the 5.5 folder (Foundry keeps a compendium in
 * the folder it was put in), and the empty ones left by the old modules and compendiums ("Héliarque", "Owidyn") go.
 */
async function tidyCompendiumFolders() {
  const settings = await open(path('data/settings', worldDir));
  const config = [...(await entries(settings)).values()].find(s => s.key === 'core.compendiumConfiguration');
  await settings.close();
  const used = new Set(Object.values(JSON.parse(config?.value ?? '{}')).map(c => c.folder).filter(Boolean));
  const folders = await open(path('data/folders', worldDir));
  const all = await entries(folders);
  const parents = new Set([...all.values()].map(f => f.folder).filter(Boolean));
  const roots = [...all].filter(([, f]) => (f.type === 'Compendium') && !f.folder);
  const removed = roots.filter(([, f]) => FOLDERS.former.includes(f.name) && !used.has(f._id) && !parents.has(f._id));
  const former = roots.find(([, f]) => f.name === FOLDERS.renamed);
  const rename = former && !roots.some(([, f]) => f.name === FOLDERS.modern);
  await commit(folders, [
    ...removed.map(([key]) => ({ type: 'del', key })),
    ...(rename ? [{ type: 'put', key: former[0], value: { ...former[1], name: FOLDERS.modern } }] : [])
  ]);
  return { removed: removed.map(([, f]) => f.name), renamed: Boolean(rename) };
}

/* -------------------------------------------- */
/*  Cartomancien world compendiums              */
/* -------------------------------------------- */

const STATS = { compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '14.369', systemId: 'dnd5e',
  systemVersion: '6.0.6', createdTime: null, modifiedTime: null, lastModifiedBy: null };
const folder = (_id, name, type, parent, sort) => ({ _id, name, type, folder: parent, sorting: 'm', sort, color: null,
  description: '', flags: {}, _stats: { ...STATS } });

/** Copy the generated Cartomancien content into the module packs, then remove the world compendiums. */
async function importCartomancienPacks() {
  const legacy = name => path(`packs/${name}`, worldDir);
  if (!existsSync(legacy(LEGACY_PACKS.content)) && !existsSync(legacy(LEGACY_PACKS.spells))) return null;

  const source = {};
  for (const name of Object.values(LEGACY_PACKS)) {
    if (!existsSync(legacy(name))) continue;
    const db = await open(legacy(name));
    source[name] = new Map([...(await entries(db))].map(([key, value]) => [key, migrate(value)]));
    await db.close();
  }

  // Items, as the other classes of Classes: Cartomancien › the class, Class Features, Deck du Parieur › the subclass
  // and its Subclass Features.
  const items = await open(path(`packs/${ITEM_PACK}`));
  const existing = await entries(items);
  const content = source[LEGACY_PACKS.content] ?? new Map();
  const subclass = content.get(`!items!${CARTO.subclass}`);
  const parieur = new Set(Object.values(subclass?.system?.advancement ?? {}).filter(a => a.type === 'ItemGrant')
    .flatMap(a => a.configuration.items.map(i => i.uuid.split('.').at(-1))));
  const placement = id => {
    if (id === CARTO.class) return CARTO.folderClass;
    if (id === CARTO.subclass) return CARTO.folderParieur;
    return parieur.has(id) ? CARTO.folderSubclassFeatures : CARTO.folderFeatures;
  };
  const operations = [];
  if (!existing.has(`!folders!${CARTO.folderClass}`)) {
    for (const f of [folder(CARTO.folderClass, 'Cartomancien', 'Item', null, 100000),
      folder(CARTO.folderFeatures, 'Class Features', 'Item', CARTO.folderClass, 100),
      folder(CARTO.folderParieur, 'Deck du Parieur', 'Item', CARTO.folderClass, 200),
      folder(CARTO.folderSubclassFeatures, 'Subclass Features', 'Item', CARTO.folderParieur, 100)]) {
      operations.push({ type: 'put', key: `!folders!${f._id}`, value: f });
    }
  }
  for (const [key, value] of content) {
    const [, collection, id] = key.split('!');
    operations.push({ type: 'put', key, value: collection === 'items' ? { ...value, folder: placement(id) } : value });
  }
  // The empty "Carto" placeholder folder is replaced by Cartomancien.
  const placeholder = [...existing].find(([key, f]) => key.startsWith('!folders!') && /^carto$/i.test(f.name)
    && ![...existing.values()].some(d => d.folder === f._id));
  if (placeholder) operations.push({ type: 'del', key: placeholder[0] });
  const itemCount = await commit(items, operations);

  // Spell list journal in Journals › Spell Lists › Cartomancien.
  const journals = await open(path(`packs/${JOURNAL_PACK}`));
  const journalOps = [];
  const spells = source[LEGACY_PACKS.spells] ?? new Map();
  if (spells.size) {
    const lists = [...(await entries(journals)).values()].find(f => 'sorting' in f && !f.folder && SPELL_LISTS_FOLDER.test(f.name));
    const f = folder(CARTO.folderJournal, 'Cartomancien', 'JournalEntry', lists?._id ?? null, 100000);
    journalOps.push({ type: 'put', key: `!folders!${f._id}`, value: f });
    for (const [key, value] of spells) {
      journalOps.push({ type: 'put', key, value: key.startsWith('!journal!') ? { ...value, folder: CARTO.folderJournal } : value });
    }
  }
  const journalCount = await commit(journals, journalOps);

  // Remove the world compendiums from world.json and from disk.
  const manifestPath = path('world.json', worldDir);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.packs = (manifest.packs ?? []).filter(p => !Object.values(LEGACY_PACKS).includes(p.name));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  for (const name of Object.values(LEGACY_PACKS)) await rm(legacy(name), { recursive: true, force: true });

  return { items: itemCount, journals: journalCount, placeholder: placeholder?.[1].name ?? null };
}

/* -------------------------------------------- */

const imported = await importCartomancienPacks();
const report = await migrateWorldData();
const folders = await tidyCompendiumFolders();
console.log(`Monde « ${world} » migré vers ${MODULE_ID}.`);
console.log(`- Documents modifiés : ${Object.entries(report).map(([k, n]) => `${k} ${n}`).join(', ') || 'aucun'}`);
if (imported) {
  console.log(`- Compendiums Cartomancien déplacés : ${imported.items} entrées d'objets, ${imported.journals} entrées de journal`
    + `${imported.placeholder ? ` ; dossier vide « ${imported.placeholder} » remplacé par Cartomancien` : ''}`);
}
if (folders.renamed) console.log(`- Dossier de compendiums « ${FOLDERS.renamed} » renommé « ${FOLDERS.modern} »`);
if (folders.removed.length) console.log(`- Dossiers de compendiums vides retirés : ${folders.removed.join(', ')}`);
