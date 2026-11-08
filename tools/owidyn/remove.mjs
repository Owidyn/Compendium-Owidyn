/**
 * Remove Owidyn documents from the module's compendiums.
 *   node tools/owidyn/remove.mjs [--check] [--pack <compendium>] <id>...
 * Each id is looked for in every compendium of the module (--pack: in that one only). Each document goes with its
 * embedded documents and its source file in packs/_source/<compendium>/ (a folder with its _folder.json). A folder is
 * only removed when nothing else is left in it.
 * Foundry must not have a world open that uses this module while the LevelDB packs are written.
 */
import { rmSync } from 'node:fs';
import { embeddedPrefixes, openPack, packConfig, packNames, parseArgs, pruneDirectories, readSources, sourceDir } from './pack.mjs';

const { check, pack: only, inputs: ids } = parseArgs(process.argv.slice(2));
if (!ids.length) {
  console.error('Usage : node tools/owidyn/remove.mjs [--check] [--pack <compendium>] <id>...');
  process.exit(1);
}

// Open every pack first: if Foundry holds one, stop before anything is modified.
const packs = [];
for (const pack of only ? [only] : packNames()) {
  const config = packConfig(pack);
  const db = await openPack(pack);
  const existing = new Map();
  for await (const [key, value] of db.iterator()) existing.set(key, value);
  packs.push({ pack, config, db, existing, removed: [] });
}
const closeAll = () => Promise.all(packs.map(p => p.db.close()));

const errors = [];
for (const id of ids) {
  const matches = packs.flatMap(p => [`!${p.config.collection}!${id}`, `!folders!${id}`].filter(k => p.existing.has(k)).map(key => ({ p, key })));
  if (matches.length !== 1) {
    errors.push(matches.length ? `${id} : présent dans plusieurs compendiums (${matches.map(m => m.p.pack).join(', ')}), précisez --pack`
      : `${id} : introuvable dans ${only ?? 'les compendiums du module'}`);
    continue;
  }
  const [{ p, key }] = matches;
  const isFolder = key.startsWith('!folders!');
  if (isFolder) {
    const inside = [...p.existing].filter(([k, v]) => v?.folder === id && !k.includes('.') && !ids.includes(v._id));
    if (inside.length) errors.push(`dossier « ${p.existing.get(key).name} » : contient encore ${inside.map(([, v]) => v.name).join(', ')}`);
  }
  p.removed.push({ id, key, doc: p.existing.get(key), isFolder });
}
if (errors.length) {
  await closeAll();
  console.error(`${errors.length} erreur(s), rien n'a été supprimé :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

for (const p of packs.filter(p => p.removed.length)) {
  const { pack, config, db, existing, removed } = p;
  // Source files of these documents in the sources of the compendium
  const files = readSources(sourceDir(pack)).filter(({ doc }) => removed.some(r => r.id === doc._id)).map(({ file }) => file);
  const ops = [];
  for (const { id, key, isFolder } of removed) {
    ops.push({ type: 'del', key });
    if (isFolder) continue;
    for (const k of existing.keys()) if (embeddedPrefixes(config, id).some(prefix => k.startsWith(prefix))) ops.push({ type: 'del', key: k });
  }
  const label = ({ doc, isFolder }) => `${isFolder ? 'dossier' : doc.type ?? config.type} « ${doc.name} »`;
  if (check) {
    console.log(`À supprimer de ${pack} (${ops.length} entrée(s), ${files.length} source(s)) :\n- ${removed.map(label).join('\n- ')}`);
    continue;
  }
  await db.batch(ops);
  await db.compactRange('\x00', '\xff');
  for (const file of files) rmSync(file);
  pruneDirectories(sourceDir(pack));
  for (const r of removed) console.log(`supprimé de ${pack} : ${label(r)}`);
  console.log(`${pack} : ${ops.length} entrée(s) retirée(s) du compendium, ${files.length} fichier(s) source supprimé(s).`);
}
await closeAll();
