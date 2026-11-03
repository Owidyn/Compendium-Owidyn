/**
 * Add or replace hand-written Owidyn documents in one of the module's compendiums.
 *   node tools/owidyn/add.mjs [--pack <compendium>] <fichier.json|dossier>...          → writes the given documents
 *   node tools/owidyn/add.mjs --check [--pack <compendium>] <fichier.json|dossier>...  → validation only
 * --pack defaults to compendium-owidyn. Sources live in packs/_source/owidyn/<items|bestiaire>/: one JSON file per
 * folder, item or actor, with its embedded documents inline (an item's effects; an actor's items and effects).
 * Only the documents passed are written: the rest of the pack, including edits made in Foundry, is left untouched.
 * Foundry must not have a world open that uses this module while the LevelDB pack is written.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { embeddedPrefixes, openPack, packConfig, parseArgs, path } from './pack.mjs';

const { check: checkOnly, pack: PACK, inputs } = parseArgs(process.argv.slice(2));
const { type: packType, collection } = packConfig(PACK);

const files = inputs.flatMap(a => statSync(a).isDirectory()
  ? readdirSync(a).filter(f => f.endsWith('.json')).map(f => `${a.replace(/[\\/]$/, '')}/${f}`)
  : [a]);
if (!files.length) {
  console.error('Usage : node tools/owidyn/add.mjs [--check] [--pack <compendium>] <fichier.json|dossier>...');
  process.exit(1);
}
const docs = files.map(f => JSON.parse(readFileSync(f, 'utf8')));
const isFolder = doc => 'sorting' in doc;
const itemsOf = doc => (collection === 'actors' ? doc.items ?? [] : [doc]);

const db = await openPack(PACK);
const existing = new Map();
for await (const [key, value] of db.iterator()) existing.set(key, value);

function validate() {
  const errors = [];
  const folders = new Set([...existing.keys()].filter(k => k.startsWith('!folders!')).map(k => k.slice(9)));
  for (const doc of docs) if (isFolder(doc)) folders.add(doc._id);
  const ids = new Set();
  for (const doc of docs) {
    const where = doc.name ?? doc._id;
    if (!/^[A-Za-z0-9]{16}$/.test(doc._id)) errors.push(`${where} : identifiant invalide ${doc._id}`);
    if (ids.has(doc._id)) errors.push(`${where} : identifiant dupliqué ${doc._id}`);
    ids.add(doc._id);
    if (doc.folder && !folders.has(doc.folder)) errors.push(`${where} : dossier ${doc.folder} introuvable`);
    if (isFolder(doc)) {
      if (doc.type !== packType) errors.push(`${where} : dossier de type ${doc.type} dans un compendium ${packType}`);
      continue;
    }
    if ((collection === 'actors') !== Array.isArray(doc.items)) errors.push(`${where} : document incompatible avec un compendium ${packType}`);

    // Images of the module or of the system must exist (core icons are not on disk here).
    const images = [doc.img, doc.prototypeToken?.texture?.src, ...(doc.effects ?? []).map(e => e.img),
      ...(collection === 'actors' ? itemsOf(doc).flatMap(i => [i.img, ...(i.effects ?? []).map(e => e.img)]) : [])];
    for (const img of images) {
      if (/^(modules|systems)\//.test(img ?? '') && !existsSync(path(`../../${decodeURIComponent(img)}`))) {
        errors.push(`${where} : image manquante ${img}`);
      }
    }
    for (const item of itemsOf(doc)) {
      const effectIds = new Set((item.effects ?? []).map(e => e._id));
      for (const a of Object.values(item.system?.activities ?? {})) {
        for (const ref of a.effects ?? []) if (!effectIds.has(ref._id)) errors.push(`${where} → ${item.name} → ${a.name} : effet ${ref._id} absent`);
      }
    }
  }
  return errors;
}

const errors = validate();
if (errors.length) {
  await db.close();
  console.error(`${errors.length} erreur(s) :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
if (checkOnly) {
  await db.close();
  console.log(`${docs.length} document(s) valide(s).`);
  process.exit(0);
}

/** Flatten a document into Foundry's LevelDB layout: embedded documents are stored under their own keys. */
function entries(doc) {
  if (isFolder(doc)) return [[`!folders!${doc._id}`, doc]];
  const effectIds = d => (d.effects ?? []).map(e => e._id);
  if (collection === 'items') {
    return [...(doc.effects ?? []).map(e => [`!items.effects!${doc._id}.${e._id}`, e]), [`!items!${doc._id}`, { ...doc, effects: effectIds(doc) }]];
  }
  const out = [];
  for (const item of doc.items) {
    const key = `${doc._id}.${item._id}`;
    for (const e of item.effects ?? []) out.push([`!actors.items.effects!${key}.${e._id}`, e]);
    out.push([`!actors.items!${key}`, { ...item, effects: effectIds(item) }]);
  }
  for (const e of doc.effects ?? []) out.push([`!actors.effects!${doc._id}.${e._id}`, e]);
  out.push([`!actors!${doc._id}`, { ...doc, items: doc.items.map(i => i._id), effects: effectIds(doc) }]);
  return out;
}

/* The embedded documents a document no longer has are removed with it. */
const ops = [];
for (const doc of docs) {
  const written = entries(doc);
  const keep = new Set(written.map(([key]) => key));
  const prefixes = isFolder(doc) ? [] : embeddedPrefixes(collection, doc._id);
  for (const key of existing.keys()) {
    if (prefixes.some(p => key.startsWith(p)) && !keep.has(key)) ops.push({ type: 'del', key });
  }
  for (const [key, value] of written) ops.push({ type: 'put', key, value });
}
await db.batch(ops);
await db.compactRange('\x00', '\xff');
await db.close();
for (const doc of docs) {
  const status = existing.has(`!${isFolder(doc) ? 'folders' : collection}!${doc._id}`) ? 'remplacé' : 'ajouté';
  console.log(`${status} : ${isFolder(doc) ? 'dossier' : doc.type} « ${doc.name} »`);
}
