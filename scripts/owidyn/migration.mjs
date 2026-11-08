/**
 * Worlds made with 2.3 or before point at the former compendiums of the module (Compendium Owidyn, Owidyn — Bestiaire…),
 * and documents of the 2014 rules have since left for the Legacy compendiums. On the first load by the GM, every UUID
 * of the module in the world's documents is pointed at the compendium that now holds the document: characters keep
 * their advancements and their Forms, links in journals keep working. The sidebar folders follow (tidyFolders). The
 * other scripts wait for it (`migrated`) before their own updates.
 */
import { FOLDERS, MODULE_ID, hasModuleUuid, remapUuids } from './compendiums.mjs';

/** Layout of the compendiums the world was last migrated to. */
const LAYOUT = '5.5+legacy';
/** World collections updated; chat messages keep their history. */
const COLLECTIONS = ['actors', 'items', 'journal', 'scenes', 'tables', 'macros', 'cards'];

let finish;
/** Settled once the world no longer points at the former compendiums (at once on the players' side). */
export const migrated = new Promise(resolve => { finish = resolve; });

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'packLayout', { scope: 'world', config: false, type: String, default: '' });
});

Hooks.once('ready', async () => {
  try {
    if (game.users.activeGM?.isSelf && game.settings.get(MODULE_ID, 'packLayout') !== LAYOUT) await migrateWorld();
  } catch (err) {
    console.error(`${MODULE_ID} | mise à jour des liens vers les compendiums`, err);
    ui.notifications.error('Owidyn : la mise à jour des liens vers les compendiums a échoué. Voir la console F12.');
  } finally {
    finish();
  }
});

async function migrateWorld() {
  const packs = new Map();
  for (const pack of game.packs.filter(p => p.metadata.packageName === MODULE_ID)) {
    for (const id of (await pack.getIndex()).keys()) packs.set(`${pack.documentName}.${id}`, pack.metadata.name);
  }
  const packOf = (type, id) => packs.get(`${type}.${id}`);
  let updated = 0;
  for (const name of COLLECTIONS) {
    for (const doc of game[name] ?? []) {
      const source = doc.toObject();
      const text = JSON.stringify(source);
      if (!hasModuleUuid(text)) continue;
      const remapped = remapUuids(text, packOf);
      if (remapped === text) continue;
      const changes = changesOf(doc.constructor, source, JSON.parse(remapped));
      if (foundry.utils.isEmpty(changes)) continue;
      await doc.update(changes, { render: false });
      updated++;
    }
  }
  await tidyFolders();
  await game.settings.set(MODULE_ID, 'packLayout', LAYOUT);
  if (updated) ui.notifications.info(`Owidyn : ${updated} document(s) du monde pointent maintenant vers les nouveaux compendiums.`);
}

/**
 * Foundry keeps a compendium in the sidebar folder it was put in: the folder "Owidyn's Source Compendium" becomes the
 * 5.5 one, and the folders of 2.3 left empty by its former compendiums are deleted.
 */
async function tidyFolders() {
  const roots = game.folders.filter(f => (f.type === 'Compendium') && !f.folder);
  const named = name => roots.find(f => f.name === name);
  const renamed = named(FOLDERS.renamed);
  if (renamed && !named(FOLDERS.modern)) await renamed.update({ name: FOLDERS.modern });
  for (const name of FOLDERS.former) {
    const folder = named(name);
    const empty = folder && !game.packs.some(p => p.folder === folder) && !game.folders.some(f => f.folder === folder);
    if (empty) await folder.delete();
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObject = value => !!value && (typeof value === 'object') && !Array.isArray(value);

/**
 * The changed fields only: objects are compared field by field, other arrays are replaced whole, and an embedded
 * collection lists its changed documents alone (by _id).
 */
function changesOf(cls, source, next) {
  const changes = {};
  for (const [key, value] of Object.entries(next)) {
    const before = source?.[key];
    if (same(before, value)) continue;
    const field = cls?.hierarchy?.[key];
    if (field instanceof foundry.data.fields.EmbeddedCollectionField) {
      const previous = new Map((before ?? []).map(doc => [doc._id, doc]));
      changes[key] = value.filter(doc => !same(doc, previous.get(doc._id)))
        .map(doc => ({ _id: doc._id, ...changesOf(field.model, previous.get(doc._id), doc) }));
    } else if (isObject(value) && isObject(before)) changes[key] = changesOf(null, before, value);
    else changes[key] = value;
  }
  return changes;
}
