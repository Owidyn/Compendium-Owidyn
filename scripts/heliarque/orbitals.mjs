/**
 * Orbitals bookkeeping on top of the native uses counter of the "Orbitals" feature.
 *
 *   spent = Manifested + Dépensés (+ détruits, règle de table)
 *
 * The counter can never show fewer spent Orbitals than the Forms still Manifested plus the Forms destroyed
 * since the last Long Rest: those Orbitals are not in the Réserve, whatever recovery happens.
 */
import { MODULE_ID, card, featureItem, formTokens, isActiveGM, itemKey, levelOf, ownersOf,
  scaleOf, subclassOf, turnKey } from './util.mjs';
import { healForms, removeConsumed, restoreOrbitals } from './forms.mjs';
import { warmBearer } from './presences.mjs';

export const orbitalsItem = actor => featureItem(actor, 'orbitals');
export const destroyedCount = actor => actor?.getFlag(MODULE_ID, 'heliarque.destroyed') ?? 0;

/** Minimum number of spent Orbitals. */
export function floorOf(actor) {
  const max = orbitalsItem(actor)?.system.uses.max ?? 0;
  return Math.min(max, formTokens(actor).length + destroyedCount(actor));
}

/** Return up to `count` Orbitals to the Réserve. Resolves to the number actually recovered. */
export async function restore(actor, count) {
  const item = orbitalsItem(actor);
  if (!item || count <= 0) return 0;
  const { spent } = item.system.uses;
  const target = Math.max(floorOf(actor), spent - count);
  if (target !== spent) await item.update({ 'system.uses.spent': target });
  return spent - target;
}

/** Spend Orbitals outside the native consumption (Combustion, discounts). */
export async function spend(actor, count) {
  const item = orbitalsItem(actor);
  if (!item || count <= 0) return;
  const { spent, max } = item.system.uses;
  await item.update({ 'system.uses.spent': Math.min(max, spent + count) });
}

export async function addDestroyed(actor, count = 1) {
  await actor.setFlag(MODULE_ID, 'heliarque.destroyed', destroyedCount(actor) + count);
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

const isOrbitals = item => item?.type === 'feat' && (itemKey(item) === 'orbitals' || item.system?.identifier === 'orbitals');

/** Clamp every manual or automatic recovery so it cannot free Manifested or destroyed Orbitals. */
export function clampRecovery(item, changes, options) {
  if (options.isRest || !isOrbitals(item) || !item.actor) return;
  const spent = foundry.utils.getProperty(changes, 'system.uses.spent');
  if (spent === undefined) return;
  const floor = floorOf(item.actor);
  if (spent < floor) foundry.utils.setProperty(changes, 'system.uses.spent', floor);
}

/** Short Rest: native DF + PB recovery, limited to the Dépensés. Long Rest: everything but Manifested Forms. */
export function onPreRest(actor, result) {
  const item = orbitalsItem(actor);
  if (!item) return;
  const live = formTokens(actor).length;
  const index = result.updateItems.findIndex(u => u._id === item.id);
  const entry = index >= 0 ? foundry.utils.expandObject(result.updateItems[index]) : { _id: item.id };
  let spent = foundry.utils.getProperty(entry, 'system.uses.spent') ?? item.system.uses.spent;
  if (result.longRest) {
    actor.updateSource({ [`flags.${MODULE_ID}.heliarque.destroyed`]: 0 });
    result.updateData[`flags.${MODULE_ID}.heliarque.destroyed`] = 0;
    spent = live;
  } else {
    spent = Math.max(spent, live + destroyedCount(actor));
  }
  foundry.utils.setProperty(entry, 'system.uses.spent', Math.min(item.system.uses.max, spent));
  const flat = foundry.utils.flattenObject(entry);
  if (index >= 0) result.updateItems[index] = flat; else result.updateItems.push(flat);
}

/** Every Orbital that is not destroyed recovers all its Hit Points; a Long Rest also restores the destroyed ones. */
async function onRest(actor, result) {
  if (!orbitalsItem(actor)) return;
  await restoreOrbitals(actor, { longRest: !!result?.longRest }).catch(err => ui.notifications.warn(err.message));
}

/* -------------------------------------------- */
/*  Turn start                                  */
/* -------------------------------------------- */

const handledTurns = new Set();

/** Effects active on an actor by Héliarque key. */
export const hasEffect = (actor, key) => actor?.effects.some(e => e.active && e.getFlag(MODULE_ID, 'heliarque.key') === key);

async function onTurnStart(combat) {
  if (!isActiveGM() || !combat?.started) return;
  const key = turnKey();
  if (!key || handledTurns.has(key)) return;
  handledTurns.add(key);
  const actor = combat.combatant?.actor;
  if (!actor) return;

  // Soothing Star — Chaleur réconfortante: the bearer of a Halo starts its turn.
  await warmBearer(combat.combatant.token);

  if (!orbitalsItem(actor)) return;
  await removeConsumed(actor);
  const level = levelOf(actor);
  const lines = [];

  // Réacteur autonome.
  if (level >= 17) {
    const recovered = await restore(actor, 2);
    lines.push(`<p><strong>Réacteur autonome :</strong> ${recovered} Orbital${recovered > 1 ? 's' : ''} récupéré${recovered > 1 ? 's' : ''}.</p>`);
    const missing = 2 - recovered;
    if (missing > 0) {
      const item = featureItem(actor, 'reacteur-autonome');
      const buttons = item ? item.system.activities.contents.map(a =>
        `<button type="button" data-heliarque-use="${a.uuid}">${a.name}</button>`).join('') : '';
      lines.push(`<p><strong>Surplus critique :</strong> choisissez ${missing} bénéfice${missing > 1 ? 's' : ''}.</p><div class="heliarque-buttons">${buttons}</div>`);
    }
  }

  // État de Supernova.
  if (hasEffect(actor, 'etat-de-supernova:etat')) {
    const recovered = await restore(actor, 2);
    lines.push(`<p><strong>Surproduction :</strong> ${recovered} Orbital${recovered > 1 ? 's' : ''} supplémentaire${recovered > 1 ? 's' : ''}.</p>`);
    const healed = await healForms({ summonerUuid: actor.uuid, formula: `@scale.heliarque.fusion + @abilities.cha.mod` });
    if (healed) lines.push(`<p><strong>Stabilisation absolue :</strong> ${healed}</p>`);
  }

  // Corps orbital: choose this turn's Incarnation.
  if (level >= 18) {
    const item = featureItem(actor, 'corps-orbital');
    const buttons = item?.system.activities.filter(a => a.flags?.[MODULE_ID]?.heliarque?.role === 'incarnation')
      .map(a => `<button type="button" data-heliarque-use="${a.uuid}">${a.name}</button>`).join('') ?? '';
    lines.push(`<p><strong>Corps orbital :</strong> choisissez votre Incarnation.</p><div class="heliarque-buttons">${buttons}</div>`);
  }

  if (lines.length) await card(actor, `<h3>Début du tour — ${actor.name}</h3>${lines.join('')}`, { whisper: [...ownersOf(actor), game.user.id] });
}

export function registerOrbitals() {
  Hooks.on('preUpdateItem', clampRecovery);
  Hooks.on('dnd5e.preRestCompleted', onPreRest);
  Hooks.on('dnd5e.restCompleted', (actor, result) => onRest(actor, result));
  Hooks.on('combatTurnChange', combat => onTurnStart(combat));
  Hooks.on('combatStart', combat => onTurnStart(combat));
}

/** Orbitals summary used by the sheet badge and chat cards. */
export function orbitalSummary(actor) {
  const item = orbitalsItem(actor);
  if (!item) return null;
  const { value, max } = item.system.uses;
  return {
    reserve: value, max,
    manifested: formTokens(actor).length,
    destroyed: destroyedCount(actor),
    maxForms: scaleOf(actor, 'formes') ?? 0,
    subclass: subclassOf(actor)
  };
}
