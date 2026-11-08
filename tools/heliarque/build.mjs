/**
 * Build the Héliarque compendium content of the Owidyn module.
 *   node tools/heliarque/build.mjs          → LevelDB packs + their sources (JSON, one file per document)
 *   node tools/heliarque/build.mjs --check  → validation only
 * Both compendiums are shared with the rest of the Owidyn content: only the Héliarque documents are replaced,
 * everything else is left untouched. The class goes into Classes (folder Héliarque, sources in
 * packs/_source/classes/heliarque/), the Forms into Creatures (folder Construct, packs/_source/creatures/construct/).
 * Foundry must not have a world open that uses this module while the LevelDB packs are written.
 */
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruneDirectories, readSources, sourceDir, sourceLayout } from '../owidyn/pack.mjs';
import { ACTOR_PACK, ITEM_PACK, MODULE_ID } from './content/helpers.mjs';
import { allContent } from './content/index.mjs';

const root = new URL('../../', import.meta.url);
const path = relative => fileURLToPath(new URL(relative, root));
const checkOnly = process.argv.includes('--check');

const { items, actors, folders } = allContent();

/* -------------------------------------------- */
/*  Validation                                  */
/* -------------------------------------------- */

function validate() {
  const errors = [];
  const uuids = new Set([
    ...items.map(i => `Compendium.${MODULE_ID}.${ITEM_PACK}.Item.${i._id}`),
    ...actors.map(a => `Compendium.${MODULE_ID}.${ACTOR_PACK}.Actor.${a._id}`)
  ]);
  const ids = new Set();
  const visit = (doc, where) => {
    if (!/^[A-Za-z0-9]{16}$/.test(doc._id)) errors.push(`${where}: identifiant invalide ${doc._id}`);
    const img = doc.img ?? doc.texture?.src;
    if (img?.startsWith(`modules/${MODULE_ID}/`) && !existsSync(path(img.slice(`modules/${MODULE_ID}/`.length)))) {
      errors.push(`${where}: image manquante ${img}`);
    }
  };
  const checkItem = (item, where) => {
    visit(item, where);
    const effectIds = new Set((item.effects ?? []).map(e => e._id));
    for (const e of item.effects ?? []) visit(e, `${where} → effet ${e.name}`);
    for (const a of Object.values(item.system.activities ?? {})) {
      for (const ref of a.effects ?? []) if (!effectIds.has(ref._id)) errors.push(`${where} → ${a.name}: effet ${ref._id} absent`);
    }
    for (const adv of item.system.advancement ?? []) {
      const refs = [...(adv.configuration.items ?? []), ...(adv.configuration.pool ?? [])].map(r => r.uuid);
      for (const uuid of refs) if (!uuids.has(uuid)) errors.push(`${where} → ${adv.title}: référence ${uuid} absente`);
    }
    for (const a of Object.values(item.system.activities ?? {})) {
      for (const p of a.profiles ?? []) if (!uuids.has(p.uuid)) errors.push(`${where} → ${a.name}: Forme ${p.uuid} absente`);
    }
  };
  for (const doc of [...items, ...actors, ...folders]) {
    if (ids.has(doc._id)) errors.push(`Identifiant dupliqué ${doc._id} (${doc.name})`);
    ids.add(doc._id);
  }
  for (const item of items) checkItem(item, item.name);
  for (const actor of actors) {
    visit(actor, actor.name);
    for (const item of actor.items) checkItem(item, `${actor.name} → ${item.name}`);
  }
  return errors;
}

/* -------------------------------------------- */
/*  Output                                      */
/* -------------------------------------------- */

/**
 * Write the sources of the Héliarque documents in those of their compendium, laid out like the rest of the module
 * (tools/owidyn/pack.mjs): the files of the previous build are replaced (`owned`), the others are left untouched.
 * `folders` are the compendium's other folders, which place the Héliarque folder.
 */
async function writeSource(pack, docs, { folders = [], owned = isHeliarque } = {}) {
  const root = sourceDir(pack);
  for (const { file, doc } of readSources(root)) if (owned(doc)) await rm(file);
  const layout = sourceLayout(docs, folders);
  for (const doc of docs) {
    const file = `${root}/${layout.get(doc._id)}`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  }
  pruneDirectories(root);
}

/** Flatten documents into Foundry's LevelDB layout: embedded documents are stored under their own keys. */
function levelEntries(collection, docs) {
  const entries = [];
  const flattenItem = (item, prefix, parentKey) => {
    const effects = item.effects ?? [];
    for (const e of effects) entries.push([`!${prefix}.effects!${parentKey}.${e._id}`, e]);
    return { ...item, effects: effects.map(e => e._id) };
  };
  for (const doc of docs) {
    if (doc.type && collection === 'folders') { entries.push([`!folders!${doc._id}`, doc]); continue; }
    if (collection === 'items') entries.push([`!items!${doc._id}`, flattenItem(doc, 'items', doc._id)]);
    else if (collection === 'actors') {
      for (const item of doc.items) {
        entries.push([`!actors.items!${doc._id}.${item._id}`, flattenItem(item, 'actors.items', `${doc._id}.${item._id}`)]);
      }
      for (const e of doc.effects) entries.push([`!actors.effects!${doc._id}.${e._id}`, e]);
      entries.push([`!actors!${doc._id}`, { ...doc, items: doc.items.map(i => i._id), effects: doc.effects.map(e => e._id) }]);
    }
  }
  return entries;
}

/** Open every pack first: if Foundry holds one, stop before anything is modified. */
async function openPacks(packs) {
  const { ClassicLevel } = await import('classic-level');
  const dbs = {};
  try {
    for (const pack of packs) {
      dbs[pack] = new ClassicLevel(path(`packs/${pack}`), { keyEncoding: 'utf8', valueEncoding: 'json' });
      await dbs[pack].open();
    }
  } catch (err) {
    await Promise.all(Object.values(dbs).map(db => db.close().catch(() => {})));
    const locked = err.code === 'LEVEL_DATABASE_NOT_OPEN' || err.cause?.code === 'LEVEL_LOCKED';
    console.error(locked ? 'Compendiums verrouillés : fermez le monde dans Foundry, puis relancez la compilation. Rien n\'a été modifié.' : err);
    process.exit(1);
  }
  return dbs;
}

const isHeliarque = doc => !!doc?.flags?.[MODULE_ID]?.heliarque;
const CONSTRUCT_FOLDER = /^constructs?$/i;

/**
 * Replace the Héliarque documents of a compendium shared with the other Owidyn content: the previous build's documents
 * (with their embedded documents) and folders are removed, the others are kept. What was there keeps the folder it was
 * moved to; on the first build, the Héliarque folder goes to the root of Classes, and the Forms into the root
 * "Construct" folder of Creatures when there is one.
 */
async function compileShared(db, collection, { folders, docs }) {
  const existing = new Map();
  for await (const [key, value] of db.iterator()) existing.set(key, value);
  const stale = new Set(), parents = new Set();
  for (const [key, value] of existing) {
    const [, kind, id] = key.split('!');
    if (![collection, 'folders'].includes(kind) || !isHeliarque(value)) continue;
    stale.add(key);
    if (kind === collection) parents.add(id);
  }
  for (const key of existing.keys()) {
    const [, kind, id] = key.split('!');
    if (kind.startsWith(`${collection}.`) && parents.has(id.split('.')[0])) stale.add(key);
  }

  const others = [...existing].filter(([key, v]) => key.startsWith('!folders!') && !isHeliarque(v)).map(([, v]) => v);
  const placeOf = (key, fallback = null) => (existing.has(key) ? existing.get(key).folder ?? null : fallback);
  const top = folders.find(f => !f.folder);
  if (top) top.folder = placeOf(`!folders!${top._id}`);
  const construct = others.find(f => !f.folder && CONSTRUCT_FOLDER.test(f.name))?._id ?? null;
  if (collection === 'actors') for (const doc of docs) doc.folder = placeOf(`!actors!${doc._id}`, construct);

  const entries = [...levelEntries('folders', folders), ...levelEntries(collection, docs)];
  const kept = new Set(entries.map(([key]) => key));
  await db.batch([
    ...[...stale].filter(key => !kept.has(key)).map(key => ({ type: 'del', key })),
    ...entries.map(([key, value]) => ({ type: 'put', key, value }))
  ]);
  await db.compactRange('\x00', '\xff');
  await db.close();
  const nameOf = id => (id ? existing.get(`!folders!${id}`)?.name ?? id : null);
  return {
    removed: [...stale].filter(key => !kept.has(key)).length, folders: others,
    parent: nameOf(top?.folder ?? (collection === 'actors' ? docs[0]?.folder : null))
  };
}

const errors = validate();
if (errors.length) {
  console.error(`${errors.length} erreur(s) :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const activities = [...items, ...actors.flatMap(a => a.items)].reduce((n, i) => n + Object.keys(i.system.activities ?? {}).length, 0);
console.log(`Contenu valide : ${items.length} objets, ${actors.length} Formes, ${folders.length} dossiers, ${activities} activités.`);
if (checkOnly) process.exit(0);

const dbs = await openPacks([ITEM_PACK, ACTOR_PACK]);
const itemFolders = folders.filter(f => f.type === 'Item');
const classes = await compileShared(dbs[ITEM_PACK], 'items', { folders: itemFolders, docs: items });
const creatures = await compileShared(dbs[ACTOR_PACK], 'actors', { folders: [], docs: actors });
await writeSource(ITEM_PACK, [...itemFolders, ...items], { folders: classes.folders });
await writeSource(ACTOR_PACK, actors, { folders: creatures.folders });
const where = parent => (parent ? `dans « ${parent} »` : 'à la racine');
console.log(`Compendiums écrits dans ${path('packs/')} : dossier Héliarque ${where(classes.parent)} de ${ITEM_PACK}, Formes ${where(creatures.parent)}`
  + ` de ${ACTOR_PACK} (${classes.removed + creatures.removed} ancien(s) document(s) retiré(s)).`);
