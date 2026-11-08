/**
 * Build the Creature Features compendiums: a base of creature features to drag onto a stat block, in the manner of
 * dnd5e's Monster Features. Each feature appears once, with a text that names the creature it is dropped on, filed by
 * type (Traits, Actions, Legendary Actions, Attacks). They are the features and attacks of the creatures of Creatures
 * that dnd5e's Monster Features doesn't already have (same name), without the weapons of the equipment (Dagger,
 * Shortbow…); Creature Features (Legacy) does the same from Creatures (Legacy), against dnd5e's Monster Features (SRD).
 *   node tools/owidyn/creature-features.mjs          → LevelDB packs + their sources (packs/_source/<compendium>/)
 *   node tools/owidyn/creature-features.mjs --check  → counts only, writes nothing
 * The compendiums are rebuilt from the creatures each time: edit a creature, then run it again. A feature keeps the id
 * derived from the first creature that has it, so its UUID doesn't change. The Héliarque Forms are left out: their
 * aptitudes only work through the Héliarque scripts.
 * Foundry must not have a world open that uses this module while the LevelDB packs are written.
 */
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { MODULE_ID, derivedId, openPack, parseArgs, path, pruneDirectories, readSources, sourceDir, sourceLayout } from './pack.mjs';

const SETS = [
  { source: 'creatures', pack: 'creature-features', rules: '2024', official: 'monsterfeatures24' },
  { source: 'legacy-creatures', pack: 'legacy-creature-features', rules: '2014', official: 'monsterfeatures' }
];
/** Folders of the compendiums, as in dnd5e's Monster Features. */
const KINDS = [['traits', 'Traits'], ['actions', 'Actions'], ['legendary', 'Legendary Actions'], ['attacks', 'Attacks']];
// The color of dnd5e's creature type folders, as in Creatures
const FOLDER_COLOR = '#242c7f';
const { check } = parseArgs(process.argv.slice(2));

const STATS = { coreVersion: '14.369', systemId: 'dnd5e', systemVersion: '6.0.6', createdTime: null, modifiedTime: null,
  lastModifiedBy: null, compendiumSource: null, duplicateSource: null, exportSource: null };

/** Names of dnd5e's monster features, read from a copy of the system's pack (its files stay untouched). */
async function officialNames(pack) {
  const { ClassicLevel } = await import('classic-level');
  const copy = mkdtempSync(join(tmpdir(), 'owidyn-'));
  cpSync(path(`../../systems/dnd5e/packs/${pack}`), copy, { recursive: true, filter: src => !/[\\/]LOCK$/.test(src) });
  const db = new ClassicLevel(copy, { valueEncoding: 'json' });
  const names = new Set();
  for await (const [key, value] of db.iterator()) if (key.startsWith('!items!')) names.add(value.name.toLowerCase());
  await db.close();
  rmSync(copy, { recursive: true, force: true });
  return names;
}

/** Traits are passive; Actions take an action, a Bonus Action or a Reaction; weapons are Attacks. */
function kindOf(item) {
  if (item.type === 'weapon') return 'attacks';
  const activations = Object.values(item.system?.activities ?? {}).map(a => a.activation?.type);
  if (activations.includes('legendary')) return 'legendary';
  if (activations.some(type => ['action', 'bonus', 'reaction'].includes(type))) return 'actions';
  return 'traits';
}

/** The text names the creature it is on, like dnd5e's: "the myconid" or {flumph} become the lookup of the name. */
function generic(html, creature) {
  const lookup = '[[lookup @name lowercase]]{monster}';
  const words = creature.toLowerCase().split(/[\s-]+/).filter(w => w.length > 3);
  const names = [creature.toLowerCase(), ...words].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return html
    .replace(/\[\[lookup @name lowercase\]\]\{[^}]*\}/g, lookup)
    .replace(new RegExp(`\\b(the|The) (${names.join('|')})(?![\\w-])`, 'g'), (all, the) => `${the} ${lookup}`);
}

for (const { source, pack, rules, official } of SETS) {
  const db = await openPack(source);
  const entries = new Map();
  for await (const [key, value] of db.iterator()) entries.set(key, value);
  await db.close();
  const known = await officialNames(official);

  const actors = [...entries].filter(([key]) => /^!actors![^.]+$/.test(key)).map(([, a]) => a)
    .filter(a => !a.flags?.[MODULE_ID]?.heliarque).sort((a, b) => a.name.localeCompare(b.name));
  const folders = new Map();
  const items = new Map();
  for (const actor of actors) {
    for (const id of actor.items ?? []) {
      const item = entries.get(`!actors.items!${actor._id}.${id}`);
      if (!item || !['feat', 'weapon'].includes(item.type)) continue;
      if (item.type === 'weapon' && item.system?.type?.baseItem) continue;
      const name = item.name.toLowerCase();
      if (known.has(name) || items.has(name)) continue;
      const kind = kindOf(item);
      const folder = derivedId(`${pack}:folder:${kind}`);
      const label = KINDS.find(([k]) => k === kind)[1];
      folders.set(folder, { type: 'Item', folder: null, name: label, color: FOLDER_COLOR, sorting: 'a', _id: folder, description: '',
        sort: KINDS.findIndex(([k]) => k === kind) * 100000, flags: { [MODULE_ID]: { creatureFeature: { kind } } }, _stats: { ...STATS } });
      const effects = (item.effects ?? []).map(e => entries.get(`!actors.items.effects!${actor._id}.${item._id}.${e}`)).filter(Boolean);
      const description = item.system?.description ?? {};
      items.set(name, {
        ...item,
        _id: derivedId(`creature-features:item:${actor._id}.${item._id}`),
        folder,
        system: { ...item.system, description: { ...description, value: generic(description.value ?? '', actor.name) },
          source: { ...item.system?.source, book: 'OSC', rules } },
        effects,
        flags: { ...item.flags, [MODULE_ID]: { ...item.flags?.[MODULE_ID], creatureFeature: { actor: actor._id, item: item._id } } },
        _stats: { ...STATS, ...item._stats, duplicateSource: `Compendium.${MODULE_ID}.${source}.Actor.${actor._id}.Item.${item._id}` }
      });
    }
  }
  const counts = KINDS.map(([kind, label]) => `${label} ${[...items.values()].filter(i => kindOf(i) === kind).length}`).join(', ');
  console.log(`${pack} : ${items.size} aptitude(s) de ${actors.length} créature(s) absentes de dnd5e.${official} (${counts}).`);
  if (check) continue;

  // The compendium belongs to this tool alone: it is rewritten as a whole.
  const out = await openPack(pack);
  await out.clear();
  await out.batch([
    ...[...folders.values()].map(f => ({ type: 'put', key: `!folders!${f._id}`, value: f })),
    ...[...items.values()].flatMap(item => [
      ...item.effects.map(e => ({ type: 'put', key: `!items.effects!${item._id}.${e._id}`, value: e })),
      { type: 'put', key: `!items!${item._id}`, value: { ...item, effects: item.effects.map(e => e._id) } }
    ])
  ]);
  await out.compactRange('\x00', '\xff');
  await out.close();

  const root = sourceDir(pack);
  for (const { file } of readSources(root)) await rm(file);
  const docs = [...folders.values(), ...items.values()];
  const layout = sourceLayout(docs);
  for (const doc of docs) {
    const file = `${root}/${layout.get(doc._id)}`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  }
  pruneDirectories(root);
}
if (!check) console.log('Compendiums Creature Features et leurs sources écrits.');
