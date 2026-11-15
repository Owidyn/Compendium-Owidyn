/**
 * Kitsune (species Kitsune, Air).
 * - Keotal, the language of the Kitsune, among the exotic languages (a world may already define it).
 * - Sorts kitsune: Command and Misty Step given by the species, and the Éclat cantrips of the tails. They carry the flag
 *   kitsuneSpell; an Éclat takes the Spellcasting Ability chosen for the species' spells.
 * - Forms: the Forme humaine and Forme véritable activities of Forme spirituelle switch the Forme humaine effect (and
 *   end the fox form); the fox form is dnd5e's transformation. The Odorat du renard effect of the Sens du renard
 *   (kitsuneFoxSmell) is off in human form only. The Griffes élémentaires can't attack in human form, and the fox form
 *   keeps them. A kitsune spell cast in human or fox form rolls the Surcharge spirituelle.
 * - Griffes élémentaires (kitsuneClaws): their damage roll offers only the damage types of the character's tails
 *   (items flagged kitsuneTail = damage type).
 * - Surcharge spirituelle (kitsuneSurge): its roll (1d20 + Constitution) checks or unchecks boxes (the item's spent
 *   uses): natural 1 → 2 checked, under 10 → 1, 10 or more → 1 unchecked, natural 20 → 2. When every box is checked,
 *   the Débordement spirituel: true form back, 1 level of Exhaustion and the effect of the feature (5 rounds), during
 *   which the kitsune spells can't be cast.
 */
const MODULE_ID = 'compendium-owidyn';
// Advancements of the species that grant the kitsune spells (Sorts kitsune; Contrôle and Un avec l'air before 2.5.0)
const KITSUNE_GRANTS = new Set(['L2xDSClJtLpSCfEj', 'pzDHZPpzxSHTSxh6', 'bkbWc8kHU7v3ph7W']);

const flag = (document, key) => document?.getFlag?.(MODULE_ID, key);
const isKitsuneSpell = item => (item?.type === 'spell') && !!flag(item, 'kitsuneSpell');
const surgeOf = actor => actor?.items.find(item => flag(item, 'kitsuneSurge'));
const humanFormOf = actor => actor?.items.find(item => item.effects.some(effect => flag(effect, 'kitsuneHumanForm')))
  ?.effects.find(effect => flag(effect, 'kitsuneHumanForm'));
const inHumanForm = actor => { const effect = humanFormOf(actor); return !!effect && !effect.disabled; };
const inOtherForm = actor => !!actor && (actor.isPolymorphed || inHumanForm(actor));
const overflowing = actor => actor.effects.some(effect => flag(effect, 'kitsuneOverflow') && !effect.disabled && !effect.isSuppressed);
// Message mode of the surge: the sending user and the GMs only
const SECRET = 'gm';
/** The users who see a character's surge: its owners and the GMs. */
const surgeReaders = actor => game.users.filter(user => user.isGM || actor.testUserPermission(user, 'OWNER')).map(user => user.id);

Hooks.once('init', () => {
  const exotic = CONFIG.DND5E.languages?.exotic;
  if (exotic?.children && !('keotal' in exotic.children)) exotic.children.keotal = 'Keotal';
});

/* -------------------------------------------- */
/*  Kitsune spells                              */
/* -------------------------------------------- */

Hooks.on('preCreateItem', (item, data, options, userId) => {
  if ((item.type !== 'spell') || !item.actor || (userId !== game.user.id)) return;
  const [, advancementId] = String(item.getFlag('dnd5e', 'advancementOrigin') ?? '').split('.');
  if (KITSUNE_GRANTS.has(advancementId)) item.updateSource({ [`flags.${MODULE_ID}.kitsuneSpell`]: true });
  // An Éclat cast from its tail takes the ability chosen for Command and Misty Step
  else if (flag(item, 'kitsuneSpell') && !item.system.ability) {
    const granted = item.actor.items.find(other => isKitsuneSpell(other) && other.system.ability && !other.getFlag('dnd5e', 'cachedFor'));
    if (granted) item.updateSource({ 'system.ability': granted.system.ability });
  }
});

Hooks.on('dnd5e.preUseActivity', activity => {
  const item = activity.item;
  const actor = item?.actor;
  if (!actor) return;
  const form = activity.flags?.[MODULE_ID]?.kitsuneForm;
  if (form) {
    takeForm(actor, form);
    return false;
  }
  if (isKitsuneSpell(item) && overflowing(actor)) {
    ui.notifications.warn(`${actor.name} ne peut pas lancer de sort kitsune pendant le Débordement spirituel.`);
    return false;
  }
  if (flag(item, 'kitsuneClaws') && inHumanForm(actor)) {
    ui.notifications.warn(`${actor.name} n'a pas de griffes sous forme humaine.`);
    return false;
  }
});

// The surge is hidden from the other players: its card and its roll are for the user and the GMs
Hooks.on('dnd5e.preCreateUsageMessage', (activity, message) => {
  if (flag(activity.item, 'kitsuneSurge')) message.rollMode = SECRET;
});

Hooks.on('dnd5e.postUseActivity', activity => {
  const item = activity.item;
  const actor = item?.actor;
  if (!actor?.isOwner) return;
  // The surge is rolled as soon as it is used: no button to click in the chat card
  if (flag(item, 'kitsuneSurge') && (activity.type === 'utility') && activity.roll?.formula) {
    activity.rollFormula({}, { configure: false }, { rollMode: SECRET });
    return;
  }
  // A kitsune spell cast in human or fox form strains the spirit (the roll, without a card)
  if (isKitsuneSpell(item) && inOtherForm(actor)) surgeOf(actor)?.system.activities.find(a => a.type === 'utility')?.use({}, { configure: false }, { create: false });
});

/* -------------------------------------------- */
/*  Forms                                       */
/* -------------------------------------------- */

/** End the fox form; the original character, or null when it can't be found. */
async function revert(actor) {
  if (!actor.isPolymorphed) return actor;
  const originalId = actor.getFlag('dnd5e', 'originalActor');
  const reverted = await actor.revertOriginalForm({ renderSheet: false });
  // An unlinked token comes back as a new token, a linked one as its actor
  return (reverted?.documentName === 'Token' ? reverted.actor : reverted) ?? game.actors.get(originalId) ?? null;
}

/** Take or leave the human form: its effect on, the Odorat du renard off, or the reverse. */
async function setHumanForm(actor, human) {
  const effect = humanFormOf(actor);
  if (effect && (effect.disabled === human)) await effect.update({ disabled: !human });
  for (const item of actor.items) {
    for (const smell of item.effects.filter(entry => flag(entry, 'kitsuneFoxSmell'))) {
      if (smell.disabled !== human) await smell.update({ disabled: human });
    }
  }
}

/** Take the human or the true form, leaving the fox form first. */
async function takeForm(actor, form) {
  const wasOther = inOtherForm(actor);
  const original = await revert(actor);
  if (!original) return;
  await setHumanForm(original, form === 'human');
  if ((form === 'true') && !wasOther) return ui.notifications.info(`${original.name} est déjà sous sa forme véritable.`);
  await ChatMessage.implementation.create({
    speaker: ChatMessage.implementation.getSpeaker({ actor: original }),
    content: `<p><strong>${foundry.utils.escapeHTML(original.name)}</strong> ${form === 'human' ? 'prend sa forme humaine' : 'reprend sa forme véritable'}.</p>`
  });
}

// The fox form is never the human one too: it has the Odorat du renard and the Griffes élémentaires (a weapon, which
// dnd5e only keeps with all the gear)
Hooks.on('dnd5e.transformActor', (actor, source, data) => {
  data.items ??= [];
  const claws = actor.items.find(item => flag(item, 'kitsuneClaws'));
  if (claws && !data.items.some(item => item.flags?.[MODULE_ID]?.kitsuneClaws)) data.items.push(claws.toObject());
  for (const item of data.items) {
    for (const effect of item.effects ?? []) {
      if (effect.flags?.[MODULE_ID]?.kitsuneHumanForm) effect.disabled = true;
      if (effect.flags?.[MODULE_ID]?.kitsuneFoxSmell) effect.disabled = false;
    }
  }
  if (actor.isOwner) setHumanForm(actor, false);
});

/* -------------------------------------------- */
/*  Claws                                       */
/* -------------------------------------------- */

Hooks.on('dnd5e.preRollDamageV2', config => {
  const item = config.subject?.item;
  if (!flag(item, 'kitsuneClaws') || !item.actor) return;
  const tails = new Set(item.actor.items.map(entry => flag(entry, 'kitsuneTail')).filter(Boolean));
  if (!tails.size) return;
  for (const roll of config.rolls ?? []) {
    const kept = (roll.options?.types ?? []).filter(type => tails.has(type));
    if (!kept.length) continue;
    roll.options.types = kept;
    if (!kept.includes(roll.options.type)) roll.options.type = kept[0];
  }
});

/* -------------------------------------------- */
/*  Surge and overflow                          */
/* -------------------------------------------- */

Hooks.on('dnd5e.rollFormulaV2', async (rolls, { subject } = {}) => {
  const item = subject?.item;
  const actor = item?.actor;
  if (!flag(item, 'kitsuneSurge') || !actor?.isOwner) return;
  const roll = rolls[0];
  const natural = roll?.dice[0]?.total;
  if (!roll || (natural === undefined)) return;
  const change = natural === 1 ? 2 : natural === 20 ? -2 : roll.total < 10 ? 1 : -1;
  const max = item.system.uses.max ?? 0;
  const spent = Math.clamp((item.system.uses.spent ?? 0) + change, 0, max);
  // In fox form the character is a copy: its original keeps the boxes for the return to the true form
  const original = actor.isPolymorphed ? game.actors.get(actor.getFlag('dnd5e', 'originalActor')) : null;
  const twin = surgeOf(original);
  await item.update({ 'system.uses.spent': spent });
  if (twin?.isOwner) await twin.update({ 'system.uses.spent': spent });
  const count = Math.abs(change);
  const boxes = `${count} case${count > 1 ? 's' : ''} ${change > 0 ? 'cochée' : 'décochée'}${count > 1 ? 's' : ''}`;
  const label = natural === 1 ? 'Échec critique' : natural === 20 ? 'Réussite critique' : change > 0 ? 'Échec' : 'Réussite';
  const overflow = max && (spent >= max);
  await ChatMessage.implementation.create({
    speaker: ChatMessage.implementation.getSpeaker({ actor }),
    content: `<p><strong>${item.name}</strong> : ${label}, ${boxes} (${spent}/${max}).</p>${overflow ? '<p><strong>Débordement spirituel !</strong></p>' : ''}`,
    whisper: surgeReaders(original ?? actor)
  });
  if (overflow) await overflowOf(actor);
});

/** The Débordement spirituel: true form back, 1 level of Exhaustion, and the 5 rounds effect of the feature. */
async function overflowOf(actor) {
  const original = await revert(actor);
  if (!original) return;
  await setHumanForm(original, false);
  const exhaustion = Math.min((original.system.attributes.exhaustion ?? 0) + 1, CONFIG.DND5E.conditionTypes.exhaustion?.levels ?? 6);
  await original.update({ 'system.attributes.exhaustion': exhaustion });
  const feature = original.items.find(item => item.system.identifier === 'debordement-spirituel');
  const effect = feature?.effects.contents[0];
  if (effect) {
    const data = effect.toObject();
    delete data._id;
    await original.createEmbeddedDocuments('ActiveEffect', [{ ...data, origin: feature.uuid, transfer: false, disabled: false }]);
  }
}
