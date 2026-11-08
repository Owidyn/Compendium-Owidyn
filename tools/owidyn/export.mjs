/**
 * Write the sources of the module's compendiums from their LevelDB packs, laid out like the dnd5e sources.
 *   node tools/owidyn/export.mjs [--pack <compendium>]          → packs/_source/<compendium>/ (one JSON per document)
 *   node tools/owidyn/export.mjs --check [--pack <compendium>]  → lists what would change, writes nothing
 * Without --pack, every compendium of the module is exported. Use it after editing documents in Foundry, so that the
 * sources follow the compendiums. The generated content keeps its own sources: Héliarque is written by
 * npm run build:heliarque, the Creature Features by tools/owidyn/creature-features.mjs, and the Cartomancien is made
 * in Foundry by its scripts (no source files).
 * Foundry must not have a world open that uses this module while the LevelDB packs are read.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isGenerated, openPack, packConfig, packNames, parseArgs, pruneDirectories, readSources, sourceDir, sourceLayout } from './pack.mjs';

const { check, pack } = parseArgs(process.argv.slice(2));

async function exportPack(PACK) {
  const { collection } = packConfig(PACK);
  const db = await openPack(PACK);
  const entries = new Map();
  for await (const [key, value] of db.iterator()) entries.set(key, value);
  await db.close();

  /** A document with its embedded documents inline, as add.mjs reads it. */
  function inflate(doc) {
    const get = key => entries.get(key);
    if (collection === 'items') return { ...doc, effects: (doc.effects ?? []).map(id => get(`!items.effects!${doc._id}.${id}`)) };
    if (collection === 'journal') {
      return {
        ...doc,
        pages: (doc.pages ?? []).map(id => get(`!journal.pages!${doc._id}.${id}`)),
        categories: (doc.categories ?? []).map(id => get(`!journal.categories!${doc._id}.${id}`))
      };
    }
    return {
      ...doc,
      items: (doc.items ?? []).map(id => {
        const item = get(`!actors.items!${doc._id}.${id}`);
        return { ...item, effects: (item.effects ?? []).map(e => get(`!actors.items.effects!${doc._id}.${id}.${e}`)) };
      }),
      effects: (doc.effects ?? []).map(id => get(`!actors.effects!${doc._id}.${id}`))
    };
  }

  const folders = [...entries].filter(([key]) => key.startsWith('!folders!')).map(([, folder]) => folder);
  const docs = [...entries]
    .filter(([key]) => key.startsWith(`!${collection}!`) && !key.slice(collection.length + 2).includes('.'))
    .map(([, doc]) => inflate(doc));
  const exported = [...folders, ...docs].filter(doc => !isGenerated(doc));
  const layout = sourceLayout(exported, folders);

  const root = sourceDir(PACK);
  const wanted = new Map(exported.map(doc => [`${root}/${layout.get(doc._id)}`, `${JSON.stringify(doc, null, 2)}\n`]));
  // Files of the generated content are left to their own build
  const previous = readSources(root).filter(({ doc }) => !isGenerated(doc)).map(({ file }) => file);
  const stale = previous.filter(file => !wanted.has(file));
  const changed = [...wanted].filter(([file, text]) => !existsSync(file) || readFileSync(file, 'utf8') !== text);

  if (check) {
    console.log(`${PACK} : ${changed.length} fichier(s) à écrire, ${stale.length} à retirer.`);
    for (const [file] of changed) console.log(`  écrire  ${file.slice(root.length + 1)}`);
    for (const file of stale) console.log(`  retirer ${file.slice(root.length + 1)}`);
    return;
  }
  for (const file of stale) rmSync(file);
  for (const [file, text] of changed) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, 'utf8');
  }
  pruneDirectories(root);
  console.log(`${PACK} : ${exported.length} document(s) dans ${root} (${changed.length} écrit(s), ${stale.length} retiré(s)).`);
}

for (const name of pack ? [pack] : packNames()) await exportPack(name);
