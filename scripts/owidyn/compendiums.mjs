/**
 * Compendiums of the module, in two sidebar folders like dnd5e's content: "Owidyn's Source Compendium 5.5" (the 2024
 * rules and the module's own content) and "Owidyn's Source Compendium Legacy" (the 2014 rules). Until 2.3 the content
 * was in four compendiums (Compendium Owidyn, Héliarque — Formes orbitales, Owidyn — Journaux, Owidyn — Bestiaire);
 * 2.4 splits it by kind and by rules, each document keeping its id. Shared by the scripts and the tools (no Foundry API).
 */
export const MODULE_ID = 'compendium-owidyn';

export const PACKS = Object.freeze({
  classes: 'classes', items: 'items', species: 'species', creatures: 'creatures', creatureFeatures: 'creature-features',
  backgroundsFeats: 'backgrounds-feats', spells: 'spells', summons: 'summons', journals: 'journals',
  legacyCreatures: 'legacy-creatures', legacyCreatureFeatures: 'legacy-creature-features',
  legacyBackgroundsFeats: 'legacy-backgrounds-feats', legacySpells: 'legacy-spells'
});

/**
 * Sidebar folders of the compendiums (module.json packFolders). Before the Legacy folder, the 5.5 one was named
 * "Owidyn's Source Compendium"; until 2.3 the compendiums were in "Owidyn" (and "Héliarque" before 2.0).
 */
export const FOLDERS = Object.freeze({
  modern: "Owidyn's Source Compendium 5.5", legacy: "Owidyn's Source Compendium Legacy",
  renamed: "Owidyn's Source Compendium", former: Object.freeze(['Owidyn', 'Héliarque'])
});

const MODULE_UUID = `Compendium\\.${MODULE_ID}\\.([\\w-]+)\\.(Item|Actor|JournalEntry)\\.([A-Za-z0-9]{16})`;

/** Whether a text holds a UUID of the module's compendiums. */
export const hasModuleUuid = text => new RegExp(MODULE_UUID).test(text);

/**
 * Point each UUID of the module at the compendium that now holds its document (embedded documents follow their
 * parent): a former compendium of 2.3, or a compendium the document left (for Legacy). `packOf(documentName, id)` names
 * that compendium; a document found in none keeps its UUID.
 */
export function remapUuids(text, packOf) {
  return text.replace(new RegExp(MODULE_UUID, 'g'), (uuid, pack, type, id) => {
    const to = packOf(type, id);
    return to && (to !== pack) ? `Compendium.${MODULE_ID}.${to}.${type}.${id}` : uuid;
  });
}
