/**
 * Sceau de Confinement.
 * A character with the feat is sealed while its Armure de Confinement Runique is equipped: its Forme Primordiale
 * (items flagged formePrimordiale) is suppressed, i.e. their effects stop applying and their activities can't be used.
 * Rupture du Sceau unequips the armor and starts the "Sceau rompu" timer; Retour dans l'armure equips it again.
 * Several armors may share the identifier (test versions): the one worn counts, and the timer remembers which was left.
 */
const MODULE_ID = 'compendium-owidyn';
const FEAT = 'sceau-de-confinement';
const ARMOR = 'armure-de-confinement-runique';
const TIMER = 'sceauRompu';

const armorsOf = actor => actor?.items.filter(i => i.system.identifier === ARMOR) ?? [];
const wornArmorOf = actor => armorsOf(actor).find(i => i.system.equipped);
const isForme = item => !!item?.getFlag(MODULE_ID, 'formePrimordiale');
const stepOf = activity => activity.flags?.[MODULE_ID]?.sceau;

function isSealed(actor) {
  if (!actor?.items.some(i => i.system.identifier === FEAT)) return false;
  return !!wornArmorOf(actor);
}

Hooks.once('setup', () => {
  // dnd5e suppresses the effects of unequipped items through this getter; a sealed Forme is suppressed the same way.
  const Item5e = CONFIG.Item.documentClass;
  let proto = Item5e.prototype;
  let descriptor;
  while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, 'areEffectsSuppressed'))) proto = Object.getPrototypeOf(proto);
  if (!descriptor?.get) return console.warn(`${MODULE_ID} | Item5e#areEffectsSuppressed introuvable : Sceau de Confinement ne supprime pas la Forme.`);
  Object.defineProperty(Item5e.prototype, 'areEffectsSuppressed', {
    configurable: true,
    get() {
      return descriptor.get.call(this) || (isForme(this) && isSealed(this.actor));
    }
  });
});

Hooks.on('dnd5e.preUseActivity', activity => {
  const { item, actor } = activity;
  if (isForme(item) && isSealed(actor)) {
    ui.notifications.warn(`${item.name} est supprimée tant que vous êtes dans votre Armure de Confinement Runique.`);
    return false;
  }
  const step = stepOf(activity);
  if (!step) return;
  if (!armorsOf(actor).length) {
    ui.notifications.warn('Aucune Armure de Confinement Runique dans votre inventaire.');
    return false;
  }
  const worn = wornArmorOf(actor);
  if ((step === 'rupture') && !worn) {
    ui.notifications.warn('Vous êtes déjà hors de votre Armure de Confinement Runique.');
    return false;
  }
  if ((step === 'retour') && worn) {
    ui.notifications.warn('Vous êtes déjà dans votre Armure de Confinement Runique.');
    return false;
  }
});

Hooks.on('dnd5e.postUseActivity', async activity => {
  const step = stepOf(activity);
  const actor = activity.actor;
  const armors = armorsOf(actor);
  if (!step || !armors.length) return;
  if (step === 'retour') {
    const left = actor.effects.find(e => e.getFlag(MODULE_ID, TIMER))?.getFlag(MODULE_ID, TIMER);
    await (armors.find(i => i.id === left) ?? armors[0]).update({ 'system.equipped': true });
    return;
  }
  const armor = wornArmorOf(actor);
  if (!armor) return;
  await armor.update({ 'system.equipped': false });
  const minutes = Math.max(1, actor.system.abilities.con.mod + actor.system.attributes.prof);
  await actor.createEmbeddedDocuments('ActiveEffect', [{
    name: 'Sceau rompu',
    img: activity.item.img,
    origin: activity.item.uuid,
    duration: { value: minutes, units: 'minutes' },
    description: `<p>Vous êtes libéré de votre Armure de Confinement Runique pour ${minutes} minute${minutes > 1 ? 's' : ''}. `
      + 'Au-delà, vous gagnez 1 niveau d\'Exhaustion à la fin de chaque minute supplémentaire passée hors de votre armure.</p>',
    flags: { [MODULE_ID]: { [TIMER]: armor.id } }
  }]);
});

// Back in the armor (Retour dans l'armure or equipped by hand): the timer ends.
Hooks.on('updateItem', (item, changes, options, userId) => {
  if ((userId !== game.user.id) || (item.system.identifier !== ARMOR) || (changes.system?.equipped !== true)) return;
  const timers = item.actor?.effects.filter(e => e.getFlag(MODULE_ID, TIMER)).map(e => e.id) ?? [];
  if (timers.length) item.actor.deleteEmbeddedDocuments('ActiveEffect', timers);
});
