/** Keep the Héliarque features and spells already on characters in step with the module compendium. */
import { HELIARQUE_VERSION, ITEM_PACK, MODULE_ID, flagsOf, isActiveGM } from './util.mjs';

/** Spell fields set on the character by advancements (spell configuration), kept as they are. */
const CHARACTER_FIELDS = ['ability', 'method', 'prepared', 'sourceItem'];

/**
 * Replace the rules data of every Héliarque feature and spell copied from the module compendium when HELIARQUE_VERSION changes.
 * The Classes compendium also holds the other classes: only items carrying an Héliarque key are refreshed.
 * What belongs to the character (spent uses, spellcasting configuration, advancement origin) is kept.
 */
export async function refreshCharacterItems() {
  if (!isActiveGM()) return;
  for (const actor of game.actors.filter(a => a.classes?.heliarque)) {
    for (const item of actor.items) {
      const uuid = item._stats?.compendiumSource;
      if (!['feat', 'spell'].includes(item.type) || !uuid?.startsWith(`Compendium.${ITEM_PACK}.`) || !flagsOf(item).key) continue;
      if (item.getFlag(MODULE_ID, 'heliarque.version') === HELIARQUE_VERSION) continue;
      const source = (await fromUuid(uuid))?.toObject();
      if (!source) continue;
      const system = source.system;
      system.uses.spent = item._source.system.uses?.spent ?? 0;
      if (item.type === 'spell') for (const key of CHARACTER_FIELDS) system[key] = item._source.system[key];
      // Non-recursive: "system" is replaced as a whole, so activities removed or migrated by dnd5e do not linger.
      await item.update({ name: source.name, img: source.img, system }, { recursive: false });
      await item.deleteEmbeddedDocuments('ActiveEffect', item.effects.map(e => e.id));
      if (source.effects.length) await item.createEmbeddedDocuments('ActiveEffect', source.effects, { keepId: true });
      await item.setFlag(MODULE_ID, 'heliarque.version', HELIARQUE_VERSION);
    }
  }
}
