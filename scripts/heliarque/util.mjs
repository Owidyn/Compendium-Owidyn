/** Shared helpers. Nothing here reads Foundry globals at import time. */
import { PACKS } from '../owidyn/compendiums.mjs';

export const MODULE_ID = 'compendium-owidyn';
/** Version of the Héliarque content: characters' features and Orbitals are refreshed when it changes. */
export const HELIARQUE_VERSION = '2.5.0';
/** Compendium holding the class, its features and techniques (folder Héliarque); the Forms are in Creatures › Construct. */
export const ITEM_PACK = `${MODULE_ID}.${PACKS.classes}`;
/** Every Héliarque flag lives under flags.compendium-owidyn.heliarque. */
export const flagsOf = doc => doc?.flags?.[MODULE_ID]?.heliarque ?? {};
export const FORMS = Object.freeze({
  satellite: 'Satellite', bastion: 'Bastion', halo: 'Halo', ancre: 'Ancre gravitationnelle'
});
/** Forms known at level 1; the others at level 2. */
export const FORM_LEVEL = Object.freeze({ satellite: 1, bastion: 1, halo: 2, ancre: 2 });
/** Spellcasting method of the Techniques stellaires and of Manifestation orbitale. */
export const TECHNIQUE_METHOD = 'technique';
/** Highest Technique spell level at an Héliarque level (1, 5, 9, 13, 17 → 1–5). */
export const techniqueTier = level => Math.min(5, Math.ceil(level / 4));

export const meta = activity => flagsOf(activity);
export const itemKey = item => item?.flags?.[MODULE_ID]?.heliarque?.key;
export const formKey = actor => actor?.flags?.[MODULE_ID]?.heliarque?.form ?? null;

export const heliarqueClass = actor => actor?.classes?.heliarque ?? null;
export const levelOf = actor => heliarqueClass(actor)?.system.levels ?? 0;
export const subclassOf = actor => heliarqueClass(actor)?.subclass?.identifier ?? null;
/** Value of a ScaleValue advancement: number/distance → value, dice → the object itself. */
export function scaleOf(actor, key) {
  const scale = actor?.system?.scale?.heliarque?.[key];
  if (!scale) return null;
  return scale.faces !== undefined ? scale : scale.value;
}
export const knownForms = actor => Object.keys(FORMS).filter(f => levelOf(actor) >= FORM_LEVEL[f]);

export function featureItem(actor, key) {
  return actor?.items.find(i => itemKey(i) === key || i.system?.identifier === key) ?? null;
}

/** Orbital actor data: { summoner: UUID of its Héliarque, index: 1…6 }. */
export const orbitalData = actor => actor?.flags?.[MODULE_ID]?.heliarque?.orbital ?? null;

/** The Héliarque who manifested this Form actor. */
export function summonerOf(actor) {
  if (!formKey(actor)) return null;
  const orbital = orbitalData(actor);
  if (orbital) return fromUuidSync(orbital.summoner, { strict: false });
  const origin = actor.flags?.dnd5e?.summon?.origin;
  if (!origin) return null;
  return fromUuidSync(origin, { strict: false })?.actor ?? null;
}

/** All Form tokens manifested by an Héliarque, on every scene. */
export function formTokens(summoner, { includeConsumed = false, form = null } = {}) {
  if (!summoner) return [];
  const tokens = [];
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      const actor = token.actor;
      if (!formKey(actor) || (form && formKey(actor) !== form)) continue;
      if (!includeConsumed && token.getFlag(MODULE_ID, 'heliarque.consumed')) continue;
      if (summonerOf(actor)?.uuid === summoner.uuid) tokens.push(token);
    }
  }
  return tokens;
}

/** The token of a Form actor: its synthetic token, or the token of an Orbital (linked) on any scene. */
export function formTokenOf(actor) {
  if (!actor) return null;
  if (actor.token) return actor.token;
  if (!orbitalData(actor)) return null;
  for (const scene of [canvas?.scene, ...game.scenes].filter(Boolean)) {
    const token = scene.tokens.find(t => t.actorLink && t.actorId === actor.id);
    if (token) return token;
  }
  return null;
}

/** Token of an actor on the viewed scene (the controlled one when several). */
export function tokenOf(actor) {
  if (!actor) return null;
  if (actor.token) return actor.token;
  if (orbitalData(actor)) return formTokenOf(actor);
  const controlled = canvas.tokens?.controlled.find(t => t.actor === actor);
  if (controlled) return controlled.document;
  return actor.getActiveTokens(false, true)[0] ?? null;
}

/** Combat turn identifier, or null outside combat. */
export function turnKey() {
  const c = game.combat;
  return c?.started ? `${c.id}.${c.round}.${c.turn}` : null;
}

export const isActiveGM = () => game.users.activeGM?.isSelf ?? false;
export const escape = value => foundry.utils.escapeHTML(String(value ?? ''));
export const notify = (message, type = 'info') => ui.notifications[type](message);

/** Evaluate a deterministic formula against roll data, e.g. "@summoner.scale.heliarque.vol". */
export function evaluate(formula, rollData) {
  if (formula === undefined || formula === null || formula === '') return 0;
  if (typeof formula === 'number') return formula;
  try {
    const roll = new Roll(String(formula), rollData);
    return roll.evaluateSync({ strict: false }).total ?? 0;
  } catch {
    return Number(formula) || 0;
  }
}

/* -------------------------------------------- */
/*  Dialogs                                     */
/* -------------------------------------------- */

const DialogV2 = () => foundry.applications.api.DialogV2;

/**
 * Ask the user to pick one option. Resolves to the chosen value or null.
 * @param {string} title
 * @param {{value: string, label: string, img?: string, hint?: string, checked?: boolean}[]} options
 */
export async function choose(title, options, { prompt = '', multiple = false, max = Infinity } = {}) {
  if (!options.length) return multiple ? [] : null;
  const type = multiple ? 'checkbox' : 'radio';
  const rows = options.map((o, i) => `
    <label class="heliarque-choice">
      <input type="${type}" name="choice" value="${escape(o.value)}" ${(multiple ? o.checked : i === 0) ? 'checked' : ''}>
      ${o.img ? `<img src="${escape(o.img)}" alt="">` : ''}
      <span><strong>${escape(o.label)}</strong>${o.hint ? `<small>${escape(o.hint)}</small>` : ''}</span>
    </label>`).join('');
  const content = `<div class="heliarque-dialog">${prompt ? `<p>${prompt}</p>` : ''}${rows}</div>`;
  const result = await DialogV2().wait({
    window: { title, icon: 'fa-solid fa-sun' },
    position: { width: 420 },
    content,
    rejectClose: false,
    buttons: [
      {
        action: 'ok', label: 'Valider', default: true, icon: 'fa-solid fa-check',
        callback: (event, button) => {
          const checked = [...button.form.querySelectorAll('input[name="choice"]:checked')].map(i => i.value);
          return multiple ? checked.slice(0, max) : (checked[0] ?? null);
        }
      },
      { action: 'cancel', label: 'Annuler', icon: 'fa-solid fa-xmark', callback: () => (multiple ? [] : null) }
    ]
  });
  return result ?? (multiple ? [] : null);
}

export async function confirm(title, content) {
  return DialogV2().confirm({ window: { title, icon: 'fa-solid fa-sun' }, content: `<p>${content}</p>`, rejectClose: false });
}

/** Short whispered/public chat card from the module. */
export async function card(actor, html, { whisper = null, flags = {} } = {}) {
  return ChatMessage.implementation.create({
    speaker: ChatMessage.implementation.getSpeaker({ actor }),
    content: `<div class="heliarque-card">${html}</div>`,
    whisper: whisper ?? undefined,
    flags: { [MODULE_ID]: { heliarque: flags } }
  });
}

export const ownersOf = actor => game.users.filter(u => !u.isGM && actor.testUserPermission(u, 'OWNER')).map(u => u.id);
