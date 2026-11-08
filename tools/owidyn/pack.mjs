/**
 * Helpers shared by the Owidyn compendium tools (add.mjs, remove.mjs, export.mjs, creature-features.mjs) and the
 * Héliarque build. Sources are laid out like the dnd5e ones: packs/_source/<compendium>/ holds one directory per folder
 * of the compendium (its name in kebab-case, described by its _folder.json) and one JSON file per document, named after it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
export const path = relative => fileURLToPath(new URL(relative, root));

export const MODULE_ID = 'compendium-owidyn';
export const sourceDir = pack => path(`packs/_source/${pack}`);
export const isFolder = doc => 'sorting' in doc;

/**
 * Content written by code, without hand-made sources: Héliarque (its build), Creature Features (creature-features.mjs)
 * and Cartomancien (made in Foundry).
 */
export const isGenerated = doc => Boolean(doc?.flags?.[MODULE_ID]?.heliarque) || Boolean(doc?.flags?.[MODULE_ID]?.creatureFeature)
  || Boolean(doc?.flags?.[MODULE_ID]?.cartomancien?.contentKey) || /^(Crtm|Pari)[A-Za-z0-9]{12}$/.test(doc?._id ?? '');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
/** Deterministic 16-character Foundry ID of a document made by a tool: rebuilding never changes its UUID. */
export function derivedId(key) {
  const bytes = createHash('sha1').update(`owidyn:${key}`).digest();
  return Array.from(bytes.subarray(0, 16), b => ALPHABET[b % ALPHABET.length]).join('');
}

/** Name of a document's file or folder's directory, as in the dnd5e sources: kebab-case, no accents or apostrophes. */
export const slug = name => String(name ?? '').replace(/[œŒ]/g, 'oe').replace(/[æÆ]/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’‘`]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sans-nom';

/** Every JSON source file under a directory, with its document. */
export function readSources(dir) {
  const found = [];
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...readSources(file));
    else if (entry.name.endsWith('.json')) found.push({ file, doc: JSON.parse(readFileSync(file, 'utf8')) });
  }
  return found;
}

/** Remove the empty directories under a directory (not the directory itself). */
export function pruneDirectories(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sub = `${dir}/${entry.name}`;
    pruneDirectories(sub);
    if (!readdirSync(sub).length) rmdirSync(sub);
  }
}

/**
 * Path of each document in the sources of its compendium, relative to packs/_source/<compendium>/: the directories of
 * its folders, then its name (a folder is the _folder.json of its directory). `folders` are all the compendium's
 * folders, to place documents whose folders aren't written. A name shared in a directory gets -2, -3… in the order
 * of sort then id.
 */
export function sourceLayout(docs, folders = []) {
  const known = new Map([...folders, ...docs].filter(isFolder).map(folder => [folder._id, folder]));
  const order = (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a._id).localeCompare(String(b._id));
  const depth = folder => (known.has(folder.folder) ? 1 + depth(known.get(folder.folder)) : 0);
  const used = new Map();
  const claim = (dir, name) => {
    const names = used.get(dir) ?? new Set();
    used.set(dir, names);
    let unique = name;
    for (let n = 2; names.has(unique); n++) unique = `${name}-${n}`;
    names.add(unique);
    return unique;
  };
  const dirs = new Map();
  for (const folder of [...known.values()].sort((a, b) => depth(a) - depth(b) || order(a, b))) {
    const parent = dirs.get(folder.folder) ?? '';
    const name = claim(`${parent}/`, slug(folder.name));
    dirs.set(folder._id, parent ? `${parent}/${name}` : name);
  }
  const paths = new Map();
  for (const doc of [...docs].sort(order)) {
    if (isFolder(doc)) paths.set(doc._id, `${dirs.get(doc._id)}/_folder.json`);
    else {
      const dir = dirs.get(doc.folder) ?? '';
      const name = `${claim(dir, slug(doc.name))}.json`;
      paths.set(doc._id, dir ? `${dir}/${name}` : name);
    }
  }
  return paths;
}

/** Split the command line: --check, --pack <compendium> (null when absent) and the other arguments. */
export function parseArgs(argv) {
  const packArg = argv.indexOf('--pack');
  return {
    check: argv.includes('--check'),
    pack: packArg >= 0 ? argv[packArg + 1] : null,
    inputs: argv.filter((a, i) => (a !== '--check') && (a !== '--pack') && ((packArg < 0) || (i !== packArg + 1)))
  };
}

/** LevelDB collection of each document type, and the embedded collections stored under their own keys. */
const COLLECTIONS = {
  Item: { collection: 'items', embedded: ['effects'] },
  Actor: { collection: 'actors', embedded: ['items', 'effects', 'items.effects'] },
  JournalEntry: { collection: 'journal', embedded: ['pages', 'categories'] }
};

/** Names of the module's compendiums, in the order of module.json. */
export const packNames = () => JSON.parse(readFileSync(path('module.json'), 'utf8')).packs.map(p => p.name);

/** The compendium of module.json with that name, with the LevelDB collection of its documents. */
export function packConfig(name) {
  const config = JSON.parse(readFileSync(path('module.json'), 'utf8')).packs.find(p => p.name === name);
  if (!config || !COLLECTIONS[config.type]) {
    console.error(config ? `Type de compendium non géré : ${config.type}.` : `Compendium inconnu : ${name} (voir module.json).`);
    process.exit(1);
  }
  return { ...config, ...COLLECTIONS[config.type] };
}

/** Compendium whose sources hold a file or directory (packs/_source/<compendium>/…), or null. */
export function packOfSource(file) {
  const [pack, ...rest] = relative(sourceDir(''), resolve(file)).split(sep);
  return pack && pack !== '..' && rest.length && packNames().includes(pack) ? pack : null;
}

/** Open the pack first: if Foundry holds it, stop before anything is modified. */
export async function openPack(name) {
  const { ClassicLevel } = await import('classic-level');
  const db = new ClassicLevel(path(`packs/${name}`), { keyEncoding: 'utf8', valueEncoding: 'json' });
  try {
    await db.open();
  } catch (err) {
    const locked = err.code === 'LEVEL_DATABASE_NOT_OPEN' || err.cause?.code === 'LEVEL_LOCKED';
    console.error(locked ? 'Compendium verrouillé : fermez le monde dans Foundry, puis relancez. Rien n\'a été modifié.' : err);
    process.exit(1);
  }
  return db;
}

/** Key prefixes of the documents embedded in the document `id` of that compendium. */
export const embeddedPrefixes = ({ collection, embedded }, id) => embedded.map(e => `!${collection}.${e}!${id}.`);
