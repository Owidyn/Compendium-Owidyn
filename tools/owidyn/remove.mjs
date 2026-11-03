/**
 * Remove Owidyn documents from one of the module's compendiums.
 *   node tools/owidyn/remove.mjs [--check] [--pack <compendium>] <id>...
 * --pack defaults to compendium-owidyn. Each document goes with its embedded documents and its source file in
 * packs/_source/owidyn/. A folder is only removed when nothing else is left in it.
 * Foundry must not have a world open that uses this module while the LevelDB pack is written.
 */
import { readdirSync, rmSync } from 'node:fs';
import { embeddedPrefixes, openPack, packConfig, parseArgs, path } from './pack.mjs';

const { check, pack, inputs: ids } = parseArgs(process.argv.slice(2));
const { collection } = packConfig(pack);
if (!ids.length) {
  console.error('Usage : node tools/owidyn/remove.mjs [--check] [--pack <compendium>] <id>...');
  process.exit(1);
}

const db = await openPack(pack);
const existing = new Map();
for await (const [key, value] of db.iterator()) existing.set(key, value);

const errors = [];
const removed = [];
for (const id of ids) {
  const key = [`!${collection}!${id}`, `!folders!${id}`].find(k => existing.has(k));
  if (!key) {
    errors.push(`${id} : introuvable dans ${pack}`);
    continue;
  }
  const isFolder = key.startsWith('!folders!');
  if (isFolder) {
    const inside = [...existing].filter(([k, v]) => v?.folder === id && !k.includes('.') && !ids.includes(v._id));
    if (inside.length) errors.push(`dossier « ${existing.get(key).name} » : contient encore ${inside.map(([, v]) => v.name).join(', ')}`);
  }
  removed.push({ id, key, doc: existing.get(key), isFolder });
}
if (errors.length) {
  await db.close();
  console.error(`${errors.length} erreur(s), rien n'a été supprimé :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

/** Source files of these documents (name ending with _<id>.json), anywhere under packs/_source/owidyn/. */
function sources(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) sources(file, found);
    else if (removed.some(r => entry.name.endsWith(`_${r.id}.json`))) found.push(file);
  }
  return found;
}
const files = sources(path('packs/_source/owidyn'));

const ops = [];
for (const { id, key, isFolder } of removed) {
  ops.push({ type: 'del', key });
  if (isFolder) continue;
  for (const k of existing.keys()) if (embeddedPrefixes(collection, id).some(p => k.startsWith(p))) ops.push({ type: 'del', key: k });
}
const label = ({ doc, isFolder }) => `${isFolder ? 'dossier' : doc.type} « ${doc.name} »`;
if (check) {
  await db.close();
  console.log(`À supprimer de ${pack} (${ops.length} entrée(s), ${files.length} source(s)) :\n- ${removed.map(label).join('\n- ')}`);
  process.exit(0);
}
await db.batch(ops);
await db.compactRange('\x00', '\xff');
await db.close();
for (const file of files) rmSync(file);
for (const r of removed) console.log(`supprimé : ${label(r)}`);
console.log(`${ops.length} entrée(s) retirée(s) du compendium, ${files.length} fichier(s) source supprimé(s).`);
