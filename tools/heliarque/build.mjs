/**
 * Build the Héliarque compendium content of the Owidyn module.
 *   node tools/heliarque/build.mjs          → packs/_source/heliarque/** (JSON, one file per document) + LevelDB packs
 *   node tools/heliarque/build.mjs --check  → validation only
 * The Item compendium is shared with the rest of the Owidyn content: only the Héliarque documents (folder
 * Class › Héliarque) are replaced, everything else is left untouched. The Actor compendium holds the Forms alone.
 * Foundry must not have a world open that uses this module while the LevelDB packs are written.
 */
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
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

const fileName = doc => `${doc.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_')}_${doc._id}.json`;

async function writeSource(dirName, docs) {
  const dir = path(`packs/_source/heliarque/${dirName}/`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const doc of docs) await writeFile(`${dir}${fileName(doc)}`, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
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

/** Rewrite a pack owned by Héliarque alone. */
async function compile(db, entries) {
  await db.clear();
  await db.batch(entries.map(([key, value]) => ({ type: 'put', key, value })));
  await db.compactRange('\x00', '\xff');
  await db.close();
}

const isHeliarque = doc => !!doc?.flags?.[MODULE_ID]?.heliarque;
const CLASS_FOLDER = /^class(e|es)?$/i;

/**
 * Replace the Héliarque documents of the shared Item pack: the previous build's items (with their effects) and
 * folders are removed, the other documents are kept. The Héliarque folder keeps the parent it was moved to;
 * on the first build it goes into the root "Class" folder when there is one.
 */
async function compileShared(db, docs) {
  const existing = new Map();
  for await (const [key, value] of db.iterator()) existing.set(key, value);
  const stale = new Set(), parents = new Set();
  for (const [key, value] of existing) {
    const [, collection, id] = key.split('!');
    if (!['items', 'folders'].includes(collection) || !isHeliarque(value)) continue;
    stale.add(key);
    if (collection === 'items') parents.add(id);
  }
  for (const key of existing.keys()) {
    const [, collection, id] = key.split('!');
    if (collection === 'items.effects' && parents.has(id.split('.')[0])) stale.add(key);
  }

  const top = docs.folders.find(f => !f.folder);
  const previous = existing.get(`!folders!${top._id}`);
  const classFolder = [...existing].find(([key, v]) => key.startsWith('!folders!') && !v.folder && CLASS_FOLDER.test(v.name))?.[1];
  top.folder = previous ? previous.folder ?? null : classFolder?._id ?? null;

  const entries = [...levelEntries('folders', docs.folders), ...levelEntries('items', docs.items)];
  const kept = new Set(entries.map(([key]) => key));
  await db.batch([
    ...[...stale].filter(key => !kept.has(key)).map(key => ({ type: 'del', key })),
    ...entries.map(([key, value]) => ({ type: 'put', key, value }))
  ]);
  await db.compactRange('\x00', '\xff');
  await db.close();
  return { removed: [...stale].filter(key => !kept.has(key)).length, parent: top.folder ? (existing.get(`!folders!${top.folder}`)?.name ?? top.folder) : null };
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
const shared = await compileShared(dbs[ITEM_PACK], { folders: itemFolders, items });
await compile(dbs[ACTOR_PACK], levelEntries('actors', actors));
await writeSource('items', [...itemFolders, ...items]);
await writeSource(ACTOR_PACK, actors);
console.log(`Compendiums écrits dans ${path('packs/')} (dossier Héliarque ${shared.parent ? `dans « ${shared.parent} »` : 'à la racine'}, ${shared.removed} ancien(s) document(s) retiré(s)).`);
