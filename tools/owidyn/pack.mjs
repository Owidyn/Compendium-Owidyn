/**
 * Helpers shared by the Owidyn compendium tools (add.mjs, remove.mjs).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
export const path = relative => fileURLToPath(new URL(relative, root));

/** Split the command line: --check, --pack <compendium> (default compendium-owidyn) and the other arguments. */
export function parseArgs(argv) {
  const packArg = argv.indexOf('--pack');
  return {
    check: argv.includes('--check'),
    pack: packArg >= 0 ? argv[packArg + 1] : 'compendium-owidyn',
    inputs: argv.filter((a, i) => (a !== '--check') && (a !== '--pack') && ((packArg < 0) || (i !== packArg + 1)))
  };
}

/** LevelDB collection of each document type, and the embedded collections stored under their own keys. */
const COLLECTIONS = {
  Item: { collection: 'items', embedded: ['effects'] },
  Actor: { collection: 'actors', embedded: ['items', 'effects', 'items.effects'] },
  JournalEntry: { collection: 'journal', embedded: ['pages', 'categories'] }
};

/** The compendium of module.json with that name, with the LevelDB collection of its documents. */
export function packConfig(name) {
  const config = JSON.parse(readFileSync(path('module.json'), 'utf8')).packs.find(p => p.name === name);
  if (!config || !COLLECTIONS[config.type]) {
    console.error(config ? `Type de compendium non géré : ${config.type}.` : `Compendium inconnu : ${name} (voir module.json).`);
    process.exit(1);
  }
  return { ...config, ...COLLECTIONS[config.type] };
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
