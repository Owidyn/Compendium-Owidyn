/**
 * Automated movement for activities carrying `flags.compendium-owidyn.heliarque.move`:
 *   mode      away | toward | line (toward or away, chosen) | traction | free
 *   distance  formula in feet, or "speed" / "halfSpeed"
 *   from      this (the Form using it) | self (the Héliarque) | form / chosenForm (a Form) | anchorField
 *   subject   targets | self | this | bearer
 *   save      only creatures that failed their save; attack: only on hit (chosen by the user)
 * A "Déplacer" button is added to the activity's chat card.
 */
import { asGM, registerGM } from './socket.mjs';
import { centerOf, docOf, feetToUnits, pickDestination, segmentDistance, straightDestination, within } from './geometry.mjs';
import { MODULE_ID, choose, escape, evaluate, formKey, formTokens, levelOf, meta, notify, scaleOf, summonerOf, tokenOf } from './util.mjs';

const SIZES = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'];

/* -------------------------------------------- */
/*  Moving tokens                               */
/* -------------------------------------------- */

registerGM('moveToken', async ({ tokenUuid, x, y, elevation, action }) => moveNow(fromUuidSync(tokenUuid), { x, y, elevation, action }));

async function moveNow(token, { x, y, elevation, action = 'displace' }) {
  const waypoint = { x, y, ...(elevation !== undefined ? { elevation } : {}), action };
  try {
    await token.move(waypoint, { [MODULE_ID]: true });
  } catch (err) {
    console.warn(`${MODULE_ID} | move() a échoué, mise à jour directe`, err);
    await token.update({ x, y, ...(elevation !== undefined ? { elevation } : {}) });
  }
}

/** Move a token: directly when this user may, otherwise through the GM. */
export async function moveToken(token, position, action = 'displace') {
  token = docOf(token);
  if (token.canUserModify(game.user, 'update')) return moveNow(token, { ...position, action });
  return asGM('moveToken', { tokenUuid: token.uuid, ...position, action });
}

/* -------------------------------------------- */
/*  Resolving the parts of a movement           */
/* -------------------------------------------- */

const tokenFromActorUuid = uuid => {
  const actor = fromUuidSync(uuid, { strict: false });
  if (!actor) return null;
  return tokenOf(actor);
};

/** Targets recorded on a usage message, falling back to the user's current targets. */
export function messageTargets(message) {
  const recorded = message?.getFlag('dnd5e', 'targets') ?? message?.system?.targets ?? [];
  const tokens = recorded.map(t => tokenFromActorUuid(t.uuid)).filter(Boolean);
  if (tokens.length) return tokens;
  return [...game.user.targets].map(t => t.document);
}

/** Saving throw outcome of an actor for a usage message: true (success), false (failure) or null (not rolled). */
function saveOutcome(message, actor) {
  const rolls = game.messages.contents.filter(m => m.getFlag('dnd5e', 'originatingMessage') === message.id
    && m.getFlag('dnd5e', 'roll')?.type === 'save' && m.speakerActor === actor);
  const roll = rolls.at(-1)?.rolls?.[0];
  if (!roll) return null;
  if (roll.isSuccess !== undefined && roll.options?.target !== undefined) return roll.isSuccess;
  const dc = message.getAssociatedActivity?.()?.save?.dc?.value;
  return dc ? roll.total >= dc : null;
}

function subjects(spec, activity, message) {
  const actor = activity.actor;
  switch (spec.subject) {
    case 'self': return [tokenOf(formKey(actor) ? summonerOf(actor) : actor)].filter(Boolean);
    case 'this': return [tokenOf(actor)].filter(Boolean);
    case 'bearer': {
      const own = tokenOf(actor);
      const bearer = own?.parent.tokens.get(own.getFlag(MODULE_ID, 'heliarque.bearer'));
      return [bearer].filter(Boolean);
    }
    default: return messageTargets(message);
  }
}

function distanceFor(spec, activity, token) {
  if (spec.distance === 'speed' || spec.distance === 'halfSpeed') {
    const speed = token.actor?.system.attributes.movement.walk ?? 30;
    const summoner = formKey(activity.actor) ? summonerOf(activity.actor) : activity.actor;
    const wearsHalo = spec.haloBonus && formTokens(summoner, { form: 'halo' }).some(h => h.getFlag(MODULE_ID, 'heliarque.bearer') === token.id);
    return spec.distance === 'speed' && wearsHalo ? speed : Math.floor(speed / 10) * 5;
  }
  return evaluate(spec.distance, activity.getRollData());
}

async function originFor(spec, activity, message, target) {
  const actor = activity.actor;
  const summoner = formKey(actor) ? summonerOf(actor) : actor;
  switch (spec.from) {
    case 'this': { const t = tokenOf(actor); return t ? centerOf(t) : null; }
    case 'self': { const t = tokenOf(summoner); return t ? centerOf(t) : null; }
    case 'chosenForm': {
      const id = message.getFlag(MODULE_ID, 'heliarque.chosenForm');
      const token = id && canvas.scene.tokens.get(id);
      if (token) return centerOf(token);
    }
    // falls through: choose a Form
    case 'form': {
      const forms = formTokens(summoner).filter(f => f.parent === target.parent
        && (!spec.formRange || within(f, target, spec.formRange)));
      if (!forms.length) { notify(`Aucune Forme Manifestée à portée de ${target.name}.`, 'warn'); return null; }
      const id = forms.length === 1 ? forms[0].id : await choose(`Forme de référence — ${target.name}`,
        forms.map(f => ({ value: f.id, label: f.name, img: f.texture.src })));
      const token = id && target.parent.tokens.get(id);
      return token ? centerOf(token) : null;
    }
    case 'anchorField': {
      const anchor = formTokens(summoner, { form: 'ancre' }).find(a => a.parent === target.parent
        && within(a, target, scaleOf(summoner, 'champ') ?? 10));
      return anchor ? centerOf(anchor) : null;
    }
    default: return null;
  }
}

/* -------------------------------------------- */
/*  Executing                                   */
/* -------------------------------------------- */

/** Run the movement described by an activity, for the chat card `message`. */
export async function executeMove(activity, message, spec = meta(activity).move) {
  if (!spec) return;
  let tokens = subjects(spec, activity, message).filter(t => t.parent === canvas.scene);
  if (!tokens.length) return notify('Aucun pion à déplacer sur la scène affichée (ciblez les créatures concernées).', 'warn');

  if (spec.maxSize) {
    const limit = SIZES.indexOf(spec.maxSize);
    tokens = tokens.filter(t => SIZES.indexOf(t.actor?.system.traits.size ?? 'med') <= limit);
  }

  // Choose who moves: failed saves pre-selected, successes unchecked.
  if (spec.subject === 'targets' && (spec.save || spec.attack || tokens.length > 1 || spec.optional)) {
    const options = tokens.map(t => {
      const outcome = spec.save ? saveOutcome(message, t.actor) : null;
      const hint = outcome === null ? (spec.save ? 'Pas de jet de sauvegarde trouvé' : '') : outcome ? 'JS réussi — pas de déplacement' : 'JS raté';
      return { value: t.id, label: t.name, img: t.texture.src, hint, checked: outcome !== true };
    });
    const ids = await choose(`${activity.name} — déplacement`, options, { multiple: true, prompt: 'Créatures déplacées :' });
    tokens = tokens.filter(t => ids.includes(t.id));
  }

  let lineDirection = null;
  const summoner = formKey(activity.actor) ? summonerOf(activity.actor) : activity.actor;
  let mode = spec.mode;
  if (mode === 'traction') mode = levelOf(summoner) >= 7 ? 'free' : 'line';
  if (mode === 'line') {
    lineDirection = await choose(activity.name, [
      { value: 'toward', label: 'Vers la Forme' }, { value: 'away', label: 'À l\'opposé de la Forme' }
    ]);
    if (!lineDirection) return;
  }

  const moved = [];
  for (const token of tokens) {
    const feet = distanceFor(spec, activity, token);
    if (feet <= 0) continue;
    if (mode === 'free') {
      const field = spec.mode === 'traction' ? fieldValidator(activity, token) : null;
      const position = await pickDestination(token, {
        maxFeet: feet, teleport: !!spec.teleport, title: `${activity.name} — ${token.name}`,
        validate: field ?? (spec.nearForm ? nearFormValidator(token, summoner, spec.nearForm) : undefined)
      });
      if (!position) continue;
      await moveToken(token, position, spec.teleport ? 'blink' : (spec.action ?? 'displace'));
      moved.push({ token, from: centerOf(token), to: centerOf(token, position) });
      continue;
    }
    const origin = await originFor(spec, activity, message, token);
    if (!origin) continue;
    const position = straightDestination(token, origin, feet, mode === 'line' ? lineDirection : mode);
    if (!position) { notify(`${token.name} ne peut pas être déplacé.`, 'warn'); continue; }
    await moveToken(token, position, 'displace');
    moved.push({ token, from: centerOf(token), to: centerOf(token, position) });
  }

  if (spec.comet && moved.length) await cometTrail(activity, moved[0]);
  return moved;
}

/** Fronde gravitationnelle / Gravité vectorielle: the destination must stay in the Champ gravitationnel. */
function fieldValidator(activity, token) {
  const anchor = tokenOf(activity.actor);
  if (!anchor) return null;
  const field = evaluate('@summoner.scale.heliarque.champ', activity.getRollData()) || 10;
  return position => (within(token, anchor, field, position) ? null : 'La cible doit rester dans le Champ gravitationnel.');
}

/** Réécriture vectorielle: arrive within N ft of one of the Forms. */
function nearFormValidator(token, summoner, feet) {
  const forms = formTokens(summoner).filter(f => f.parent === token.parent);
  return position => (forms.some(f => within(token, f, feet, position)) ? null : `Destination à plus de ${feet} ft de vos Formes.`);
}

/** Halo — Sillage de comète: target hostile creatures passed within 5 ft and offer the save. */
async function cometTrail(activity, { token, from, to }) {
  const comet = activity.actor.items.find(i => i.getFlag(MODULE_ID, 'heliarque.key') === 'halo-sillage-comete');
  if (!comet) return;
  const scene = token.parent;
  const reach = (feetToUnits(5, scene) + scene.grid.distance / 2) * scene.grid.size / scene.grid.distance;
  const hostile = scene.tokens.filter(t => t.id !== token.id && t.actor && !formKey(t.actor)
    && t.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE && segmentDistance(centerOf(t), from, to) <= reach);
  if (!hostile.length) return;
  game.user.updateTokenTargets(hostile.map(t => t.id));
  await comet.system.activities.contents[0]?.use();
}

/* -------------------------------------------- */
/*  Chat card button                            */
/* -------------------------------------------- */

function label(spec) {
  if (spec.teleport) return 'Téléporter';
  if (spec.mode === 'away') return 'Repousser';
  if (spec.mode === 'toward') return 'Attirer';
  return 'Déplacer';
}

export function addMoveButton(message, html) {
  if (message.type !== 'usage') return;
  const activity = message.getAssociatedActivity?.();
  const spec = meta(activity).move;
  if (!spec || !activity?.actor?.isOwner) return;
  const container = html.querySelector('.card-buttons') ?? html.querySelector('.message-content');
  if (!container || container.querySelector('[data-heliarque-move]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.heliarqueMove = '';
  button.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i> <span>${escape(label(spec))}</span>`;
  button.addEventListener('click', async event => {
    event.preventDefault();
    button.disabled = true;
    try { await executeMove(activity, message, spec); }
    catch (err) { notify(err.message, 'error'); }
    finally { button.disabled = false; }
  });
  container.append(button);
}
