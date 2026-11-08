/**
 * Orbitals and their Forms.
 *
 * Each point of Formes simultanées is an Orbital: a persistent world actor with a linked token, so its Hit Points
 * survive a Rappel and a Reconfiguration. Manifestation orbitale (native Summon activity) places a free Orbital
 * under the chosen Form; Changer de forme gives the same Orbital another Form in place. A destroyed Orbital stays
 * unavailable, and every Orbital recovers its Hit Points, only at the end of a Long Rest.
 */
import { asGM, registerGM } from './socket.mjs';
import { addDestroyed, restore } from './orbitals.mjs';
import { FORMS, HELIARQUE_VERSION, MODULE_ID, choose, escape, featureItem, formKey, formTokenOf, formTokens, isActiveGM, knownForms,
  levelOf, meta, notify, orbitalData, scaleOf, subclassOf, summonerOf, turnKey } from './util.mjs';
import { centerOf, docOf, within } from './geometry.mjs';


const manifestActivity = summoner => featureItem(summoner, 'manifestation-orbitale')?.system.activities.find(a => a.type === 'summon') ?? null;
const profileFor = (activity, form) => activity?.profiles.find(p => p.name === FORMS[form]) ?? null;
const formOfProfile = profile => Object.keys(FORMS).find(f => FORMS[f] === profile?.name) ?? null;

function assertControl(actor, userId) {
  const user = game.users.get(userId);
  if (!actor || !(user?.isGM || actor.testUserPermission(user, 'OWNER'))) throw new Error('Permission refusée.');
}

/** Does the summoner meet an upgrade's requirement ({ level, subclass })? */
export function meets(summoner, requires) {
  if (!requires) return true;
  if (requires.level && levelOf(summoner) < requires.level) return false;
  if (requires.subclass && subclassOf(summoner) !== requires.subclass) return false;
  return true;
}

/* -------------------------------------------- */
/*  Orbitals                                    */
/* -------------------------------------------- */

/** The Orbitals of an Héliarque, one per Forme simultanée, in order. */
export function orbitalActors(summoner) {
  if (!summoner) return [];
  return game.actors.filter(a => orbitalData(a)?.summoner === summoner.uuid)
    .sort((a, b) => orbitalData(a).index - orbitalData(b).index)
    .slice(0, scaleOf(summoner, 'formes') ?? 0);
}

export const isDestroyed = actor => !!actor?.getFlag(MODULE_ID, 'heliarque.destroyed');

/** Orbitals neither Manifested nor destroyed. */
const freeOrbitals = summoner => orbitalActors(summoner).filter(a => !isDestroyed(a) && !formTokenOf(a));

/** Places taken among the Formes simultanées: Manifested Orbitals and Orbitals destroyed since the last Long Rest. */
export const formsInUse = summoner => orbitalActors(summoner).filter(a => isDestroyed(a) || formTokenOf(a)).length;

/**
 * Give an Orbital the shape of a Form: abilities unlocked at its Héliarque's level, scaled speed and size,
 * Armor Class and Hit Point Maximum. Current Hit Points are kept, up to the new maximum; a new Orbital starts full.
 */
export async function applyForm(actor, form, summoner) {
  const profile = profileFor(manifestActivity(summoner), form);
  const template = profile && await fromUuid(profile.uuid);
  if (!template) throw new Error(`Forme ${FORMS[form] ?? form} introuvable.`);
  const source = template.toObject();
  const { system } = source;
  const cha = summoner.system.abilities.cha.mod;
  const prof = summoner.system.attributes.prof;
  const max = 5 + 4 * levelOf(summoner) + cha;
  const value = actor.getFlag(MODULE_ID, 'heliarque.form') ? actor.system.attributes.hp.value : max;
  Object.assign(system.attributes.hp, { max, value: Math.max(0, Math.min(value, max)) });
  system.attributes.ac.flat += cha + Math.floor(prof / 2);
  if (form === 'satellite') system.attributes.movement.fly = scaleOf(summoner, 'vol') ?? 30;
  const size = form === 'bastion' ? Math.max(1, Math.round((scaleOf(summoner, 'taille') ?? 5) / 5)) : source.prototypeToken.width;
  const token = { name: source.name, texture: source.prototypeToken.texture, width: size, height: size };

  await actor.update({
    img: source.img, [`flags.${MODULE_ID}.heliarque.form`]: form,
    prototypeToken: { ...source.prototypeToken, ...token, actorLink: true }
  });
  // Non-recursive: the whole system data becomes the Form's, with the Orbital's Hit Points.
  await actor.update({ system }, { recursive: false });
  await actor.deleteEmbeddedDocuments('Item', actor.items.map(i => i.id));
  const items = source.items.filter(i => meets(summoner, i.flags?.[MODULE_ID]?.heliarque?.requires));
  await actor.createEmbeddedDocuments('Item', items, { keepId: true });
  await actor.deleteEmbeddedDocuments('ActiveEffect', actor.effects.filter(e => e.getFlag(MODULE_ID, 'heliarque.key')).map(e => e.id));
  if (source.effects.length) await actor.createEmbeddedDocuments('ActiveEffect', source.effects, { keepId: true });
  await actor.setFlag(MODULE_ID, 'heliarque.version', HELIARQUE_VERSION);

  const placed = formTokenOf(actor);
  if (placed) await placed.update({ ...token, [`flags.${MODULE_ID}.heliarque.form`]: form });
}

/**
 * Short or Long Rest: every Orbital that is not destroyed recovers all its Hit Points.
 * Long Rest: the destroyed ones are restored too and become available again.
 */
export async function restoreOrbitals(summoner, { longRest = false } = {}) {
  for (const actor of orbitalActors(summoner)) {
    if (isDestroyed(actor) && !longRest) continue;
    await actor.update({ 'system.attributes.hp.value': actor.system.attributes.hp.max, [`flags.${MODULE_ID}.heliarque.destroyed`]: false });
  }
}

/* -------------------------------------------- */
/*  Manifestation                               */
/* -------------------------------------------- */

/** Block a Manifestation when no Orbital is free; Supernova makes it free. */
function onPreUse(activity, usage) {
  const role = meta(activity).role;
  const actor = activity.actor;

  if (role === 'manifest') {
    if (!activity.canSummon) {
      notify('Manifestation impossible : il faut la permission Foundry « Créer des pions » (Paramètres → Permissions).', 'warn');
      return false;
    }
    const orbitals = orbitalActors(actor);
    if (!orbitals.length) {
      notify('Vos Orbitals n\'existent pas encore : le MJ doit être connecté pour les créer.', 'warn');
      return false;
    }
    if (!freeOrbitals(actor).length) {
      const destroyed = orbitals.filter(isDestroyed).length;
      notify(`Formes simultanées : ${orbitals.length} sur ${orbitals.length} occupées${destroyed ? `, dont ${destroyed} détruite${destroyed > 1 ? 's' : ''} (disponible${destroyed > 1 ? 's' : ''} au Long Rest)` : ''}. Rappelez une Forme d'abord.`, 'warn');
      return false;
    }
    if (actor.getFlag(MODULE_ID, 'heliarque.freeManifest') > 0) {
      usage.consume = { ...(usage.consume ?? {}), resources: [] };
      usage.heliarqueFree = true;
    }
    return;
  }

  // Activities on a Form token.
  const token = formTokenOf(activity.actor);
  if (!formKey(activity.actor) || !token) return;
  if (token.getFlag(MODULE_ID, 'heliarque.consumed')) {
    notify('Cette Forme a été consumée.', 'warn');
    return false;
  }
  if (role === 'command' && !usage.heliarqueRepeat) {
    const key = turnKey();
    if (key && token.getFlag(MODULE_ID, 'heliarque.commandTurn') === key) {
      notify(`${token.name} a déjà utilisé sa Commande pendant ce tour.`, 'warn');
      return false;
    }
  }
}

async function onPostUse(activity, usage) {
  const role = meta(activity).role;
  const actor = activity.actor;
  if (role === 'manifest' && usage.heliarqueFree) {
    const left = (actor.getFlag(MODULE_ID, 'heliarque.freeManifest') ?? 1) - 1;
    await actor.setFlag(MODULE_ID, 'heliarque.freeManifest', Math.max(0, left));
    return;
  }
  const token = formTokenOf(actor);
  if (!formKey(actor) || !token) return;
  try {
    if (role === 'command') {
      const key = turnKey();
      if (key) await token.setFlag(MODULE_ID, 'heliarque.commandTurn', key);
    } else if (role === 'recall') {
      await asGM('recall', { tokenUuid: token.uuid });
    } else if (role === 'reconfigure') {
      await reconfigureFlow(token);
    } else if (role === 'rupture') {
      await asGM('consume', { tokenUuid: token.uuid, activityUuid: activity.uuid });
    }
  } catch (err) {
    notify(err.message, 'error');
  }
}

/** dnd5e summons the profile's actor: Manifestation places one of the Héliarque's Orbitals instead. */
function onPreSummon(activity, profile, options) {
  if (meta(activity).role !== 'manifest') return;
  manifest(activity, profile, options).catch(err => notify(err.message, 'error'));
  return false;
}

async function manifest(activity, profile, options) {
  const summoner = activity.actor;
  const form = formOfProfile(profile);
  const free = freeOrbitals(summoner);
  if (!form || !free.length) throw new Error('Aucun Orbital disponible.');

  // Orbitals keep their Hit Points: let the player pick when they differ.
  let actor = free[0];
  if (new Set(free.map(a => a.system.attributes.hp.value)).size > 1) {
    const id = await choose('Manifestation — Orbital', free.map(a => ({
      value: a.id, label: a.name, img: a.img, hint: `${a.system.attributes.hp.value} / ${a.system.attributes.hp.max} Hit Points`
    })), { prompt: `Quel Orbital prend la Forme ${FORMS[form]} ?` });
    if (!id) return refund(summoner);
    actor = game.actors.get(id);
  }

  await applyForm(actor, form, summoner);
  const [placement] = await activity.getPlacement(actor.prototypeToken, profile, options);
  if (!placement) return refund(summoner);
  const changes = await activity.getChanges(actor, profile, options);
  const tokenData = await activity.getTokenData({ actor, placement, ...changes });
  foundry.utils.setProperty(tokenData, `flags.${MODULE_ID}.heliarque`, { form, summoner: summoner.uuid });
  const created = await canvas.scene.createEmbeddedDocuments('Token', [tokenData]);
  Hooks.callAll('dnd5e.postSummon', activity, profile, created, options);
}

/** A cancelled placement gives back the Orbital paid for the Manifestation. */
async function refund(summoner) {
  await restore(summoner, 1);
  notify('Manifestation annulée : l\'Orbital retourne dans la Réserve.');
}

/* -------------------------------------------- */
/*  Formes simultanées                          */
/* -------------------------------------------- */

/** The uses of Manifestation orbitale show the Orbitals still free. */
export async function syncFormCount(summoner) {
  const item = featureItem(summoner, 'manifestation-orbitale');
  if (!item) return;
  const spent = Math.min(item.system.uses.max || Infinity, formsInUse(summoner));
  if (item.system.uses.spent !== spent) await item.update({ 'system.uses.spent': spent });
}

/** The active GM (or the user who made the change, without GM) recounts the Orbitals of a summoner. */
function recount(summoner, userId) {
  if (!summoner || !(game.users.activeGM ?? game.users.get(userId))?.isSelf) return;
  syncFormCount(summoner).catch(err => console.error(err));
}

/** A Form token appeared, disappeared or was consumed. */
function onFormTokenChange(token, userId) {
  const summonerUuid = token.getFlag(MODULE_ID, 'heliarque.summoner');
  if (summonerUuid) recount(fromUuidSync(summonerUuid, { strict: false }), userId);
}

/* -------------------------------------------- */
/*  Halo bearer                                 */
/* -------------------------------------------- */

/** Ask which creature (self or willing within 30 ft) wears the Halo. */
export async function chooseBearer(summoner, near) {
  const origin = summoner.getActiveTokens(false, true).find(t => t.parent === near.parent) ?? null;
  const candidates = near.parent.tokens.filter(t => t.actor && !formKey(t.actor) && !t.hidden
    && (t.actor === summoner || (origin && within(origin, t, 30))));
  const choice = await choose('Halo — Porteur', candidates.map(t => ({ value: t.id, label: t.name, img: t.texture.src })), {
    prompt: 'Choisissez vous-même ou une créature consentante située à 30 ft ou moins.'
  });
  return choice ? near.parent.tokens.get(choice) : null;
}

async function onPostSummon(activity, profile, tokens) {
  if (meta(activity).role !== 'manifest') return;
  for (const token of tokens) {
    if (formKey(token.actor) !== 'halo') continue;
    const bearer = await chooseBearer(activity.actor, token);
    if (bearer) await asGM('attachHalo', { haloUuid: token.uuid, bearerUuid: bearer.uuid }).catch(err => notify(err.message, 'warn'));
  }
}

/* -------------------------------------------- */
/*  Reconfiguration                             */
/* -------------------------------------------- */

export async function reconfigureFlow(token, { free = false } = {}) {
  token = docOf(token);
  const summoner = summonerOf(token.actor);
  if (!summoner) throw new Error('Héliarque introuvable pour cette Forme.');
  const current = formKey(token.actor);
  const options = knownForms(summoner).filter(f => f !== current).map(f => ({ value: f, label: FORMS[f] }));
  const form = await choose(`Reconfiguration — ${token.name}`, options, { prompt: 'Nouvelle Forme (les Hit Points actuels sont conservés) :' });
  if (!form) return null;
  let bearerUuid = null;
  if (form === 'halo') bearerUuid = (await chooseBearer(summoner, token))?.uuid ?? null;
  return asGM('reconfigure', { tokenUuid: token.uuid, form, bearerUuid, free });
}

/* -------------------------------------------- */
/*  GM operations                               */
/* -------------------------------------------- */

registerGM('recall', async ({ tokenUuid }, userId) => {
  const token = fromUuidSync(tokenUuid);
  const summoner = summonerOf(token?.actor);
  assertControl(summoner, userId);
  if (token.getFlag(MODULE_ID, 'heliarque.consumed')) throw new Error('Une Forme consumée ne peut pas être rappelée.');
  await token.delete();
  const recovered = await restore(summoner, 1);
  return { recovered };
});

/** Rupture or sacrifice: the Orbital is destroyed until the Long Rest; the token stays until its effect resolves. */
registerGM('consume', async ({ tokenUuid, pending = true }, userId) => {
  const token = fromUuidSync(tokenUuid);
  const summoner = summonerOf(token?.actor);
  assertControl(summoner, userId);
  if (token.getFlag(MODULE_ID, 'heliarque.consumed')) return;
  await addDestroyed(summoner, 1);
  if (orbitalData(token.actor)) await token.actor.setFlag(MODULE_ID, 'heliarque.destroyed', true);
  if (!pending) return token.delete();
  await token.update({ alpha: 0.4, [`flags.${MODULE_ID}.heliarque.consumed`]: true });
  // A missed Rupture never rolls damage: clear the token after a minute at the latest.
  setTimeout(() => { if (fromUuidSync(tokenUuid)) removeConsumed(summoner); }, 60000);
});

registerGM('removeConsumed', async ({ summonerUuid }, userId) => {
  const summoner = fromUuidSync(summonerUuid);
  assertControl(summoner, userId);
  await removeConsumed(summoner);
});

registerGM('attachHalo', async ({ haloUuid, bearerUuid }, userId) => {
  const halo = fromUuidSync(haloUuid), bearer = fromUuidSync(bearerUuid);
  assertControl(summonerOf(halo?.actor), userId);
  if (!bearer || bearer.parent !== halo.parent) throw new Error('Porteur invalide.');
  const size = halo.parent.grid.size;
  const c = centerOf(bearer);
  await halo.update({
    x: c.x - halo.width * size / 2, y: c.y - halo.height * size / 2, elevation: bearer.elevation,
    [`flags.${MODULE_ID}.heliarque.bearer`]: bearer.id
  }, { animate: false });
});

/** The same Orbital takes another Form where it stands; its Hit Points are kept. */
registerGM('reconfigure', async ({ tokenUuid, form, bearerUuid }, userId) => {
  const token = fromUuidSync(tokenUuid);
  const summoner = summonerOf(token?.actor);
  assertControl(summoner, userId);
  if (!knownForms(summoner).includes(form)) throw new Error('Forme inconnue.');
  if (!orbitalData(token.actor)) throw new Error('Cette Forme date d\'une version précédente du module : rappelez-la, puis manifestez-la de nouveau.');
  await applyForm(token.actor, form, summoner);
  await token.update({ [`flags.${MODULE_ID}.heliarque.bearer`]: null });
  const bearer = form === 'halo' && bearerUuid ? fromUuidSync(bearerUuid) : null;
  if (bearer) {
    const c = centerOf(bearer), size = token.parent.grid.size;
    await token.update({ x: c.x - token.width * size / 2, y: c.y - token.height * size / 2,
      [`flags.${MODULE_ID}.heliarque.bearer`]: bearer.id }, { animate: false });
  }
  return token.uuid;
});

registerGM('healForms', ({ summonerUuid, full, formula }, userId) => {
  const summoner = fromUuidSync(summonerUuid);
  assertControl(summoner, userId);
  return healForms({ summonerUuid, full, formula });
});

/**
 * Heal by a formula evaluated on the summoner every Manifested Form, or fully every Orbital that is not destroyed
 * (Supernova). Returns a short summary.
 */
export async function healForms({ summonerUuid, full = false, formula = null }) {
  const summoner = fromUuidSync(summonerUuid);
  const actors = full ? orbitalActors(summoner).filter(a => !isDestroyed(a)) : formTokens(summoner).map(t => t.actor);
  const parts = [];
  for (const actor of actors) {
    const hp = actor.system.attributes.hp;
    let amount = hp.max - hp.value;
    if (!full) {
      const roll = await new Roll(formula, summoner.getRollData()).evaluate();
      amount = Math.min(amount, roll.total);
    }
    if (amount <= 0) continue;
    await actor.update({ 'system.attributes.hp.value': hp.value + amount });
    parts.push(`${escape(formTokenOf(actor)?.name ?? actor.name)} +${amount}`);
  }
  return parts.join(', ');
}

/** Delete the tokens of Forms consumed by a Rupture (their Orbital was already marked destroyed). */
export async function removeConsumed(summoner) {
  const ids = new Map();
  for (const token of formTokens(summoner, { includeConsumed: true })) {
    if (!token.getFlag(MODULE_ID, 'heliarque.consumed')) continue;
    if (!ids.has(token.parent)) ids.set(token.parent, []);
    ids.get(token.parent).push(token.id);
  }
  for (const [scene, list] of ids) await scene.deleteEmbeddedDocuments('Token', list);
}

/* -------------------------------------------- */
/*  Destruction at 0 HP                         */
/* -------------------------------------------- */

const dying = new Set();
async function checkDestroyed(token) {
  if (!isActiveGM() || !token?.actor || !formKey(token.actor) || dying.has(token.uuid)) return;
  if (token.getFlag(MODULE_ID, 'heliarque.consumed')) return;
  if ((token.actor.system.attributes.hp.value ?? 1) > 0) return;
  const summoner = summonerOf(token.actor);
  if (!summoner) return;
  dying.add(token.uuid);
  try {
    await addDestroyed(summoner, 1);
    if (orbitalData(token.actor)) await token.actor.setFlag(MODULE_ID, 'heliarque.destroyed', true);
    await ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor: summoner }),
      content: `<div class="heliarque-card"><p><strong>${escape(token.name)}</strong> est détruit. Son Orbital ne reviendra qu'au prochain Long Rest.</p></div>`
    });
    await token.delete();
  } finally {
    dying.delete(token.uuid);
  }
}

/** A Rupture's token disappears once its roll is made. */
function onRuptureRoll(rolls, { subject } = {}) {
  if (!isActiveGM() && !subject?.actor?.isOwner) return;
  const token = formTokenOf(subject?.actor);
  if (!token || !token.getFlag(MODULE_ID, 'heliarque.consumed') || meta(subject).role !== 'rupture') return;
  // Give dependent buttons (movement) a moment to read the token's position.
  setTimeout(() => asGM('removeConsumed', { summonerUuid: summonerOf(subject.actor)?.uuid }).catch(() => {}), 1500);
}

/* -------------------------------------------- */
/*  Creating the Orbitals                       */
/* -------------------------------------------- */

/**
 * The GM creates one Orbital per Forme simultanée for every Héliarque, owned by the Héliarque's players,
 * and refreshes their Form when the module or the Héliarque's level changes.
 */
let ensuring = Promise.resolve();
export function ensureOrbitals() {
  // Queued: a level-up fires several updates at once and must not create the same Orbital twice.
  ensuring = ensuring.then(createOrbitals).catch(err => console.error(`${MODULE_ID} | Orbitals`, err));
  return ensuring;
}

async function createOrbitals() {
  if (!isActiveGM()) return;
  const heliarques = game.actors.filter(a => a.type === 'character' && a.classes?.heliarque && featureItem(a, 'manifestation-orbitale'));
  await removeUnusedActors();
  if (!heliarques.length) return;
  let folder = game.folders.find(f => f.type === 'Actor' && f.getFlag(MODULE_ID, 'heliarque.orbitals'));
  folder ??= await Folder.implementation.create({ name: 'Héliarque — Orbitals', type: 'Actor', color: '#3b2a07', flags: { [MODULE_ID]: { heliarque: { orbitals: true } } } });
  const OWNER = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

  for (const summoner of heliarques) {
    const owners = game.users.filter(u => !u.isGM && summoner.testUserPermission(u, 'OWNER')).map(u => u.id);
    const existing = game.actors.filter(a => orbitalData(a)?.summoner === summoner.uuid);
    for (let index = 1; index <= (scaleOf(summoner, 'formes') ?? 0); index++) {
      let actor = existing.find(a => orbitalData(a).index === index);
      actor ??= await Actor.implementation.create({
        name: `Orbital ${index} — ${summoner.name}`, type: 'npc', folder: folder.id,
        img: `modules/${MODULE_ID}/assets/heliarque/orbitals.svg`,
        ownership: { default: 0, ...Object.fromEntries(owners.map(id => [id, OWNER])) },
        prototypeToken: { actorLink: true },
        flags: { [MODULE_ID]: { heliarque: { orbital: { summoner: summoner.uuid, index } } } }
      });
      if (actor.getFlag(MODULE_ID, 'heliarque.version') !== HELIARQUE_VERSION) await applyForm(actor, formKey(actor) ?? 'satellite', summoner);
      const name = `Orbital ${index} — ${summoner.name}`;
      if (actor.name !== name) await actor.update({ name });
      const missing = owners.filter(id => actor.ownership[id] !== OWNER);
      if (missing.length) await actor.update({ ownership: { ...actor.ownership, ...Object.fromEntries(missing.map(id => [id, OWNER])) } });
    }
    await syncFormCount(summoner);
  }
  if (!game.settings.get('dnd5e', 'allowSummoning')) {
    await game.settings.set('dnd5e', 'allowSummoning', true);
    notify('Héliarque : l\'invocation par les joueurs (« Allow Summoning ») a été activée pour les Formes orbitales.');
  }
}

/**
 * Remove actors the module no longer uses, unless a token still shows them: copies of the Form templates imported
 * by versions 2.0–2.2 (dnd5e's summoning copies, carrying the Form flag but no Orbital), and Orbitals whose Héliarque
 * was deleted or lost the class. The creatures of the Creatures compendium, which holds the Forms, are never touched.
 */
async function removeUnusedActors() {
  const placed = a => game.scenes.some(s => s.tokens.some(t => t.actorId === a.id));
  const orphan = a => {
    const summoner = orbitalData(a) && fromUuidSync(orbitalData(a).summoner, { strict: false });
    return orbitalData(a) && !summoner?.classes?.heliarque;
  };
  const formCopy = a => a.getFlag('dnd5e', 'isAutoImported') && formKey(a) && !orbitalData(a)
    && a._stats?.compendiumSource?.startsWith(`Compendium.${MODULE_ID}.`);
  const copies = game.actors.filter(a => !placed(a) && (orphan(a) || formCopy(a)));
  if (copies.length) await Actor.implementation.deleteDocuments(copies.map(a => a.id));
  const folder = game.folders.find(f => f.type === 'Actor' && f.getFlag(MODULE_ID, 'heliarque.forms'));
  if (folder && !folder.contents.length && !folder.children.length) await folder.delete();
}

/** A level gained or lost: create the new Orbitals and reshape the existing ones (Hit Point Maximum, upgrades). */
async function onClassUpdate(item, changes) {
  if (!isActiveGM() || item.type !== 'class' || item.system.identifier !== 'heliarque') return;
  if (!foundry.utils.hasProperty(changes, 'system.levels')) return;
  const summoner = item.actor;
  if (!summoner) return;
  await ensureOrbitals();
  for (const actor of orbitalActors(summoner)) await applyForm(actor, formKey(actor) ?? 'satellite', summoner);
  await syncFormCount(summoner);
}

export function registerForms() {
  Hooks.on('dnd5e.preUseActivity', onPreUse);
  Hooks.on('dnd5e.postUseActivity', onPostUse);
  Hooks.on('dnd5e.preSummon', onPreSummon);
  Hooks.on('dnd5e.postSummon', onPostSummon);
  Hooks.on('dnd5e.rollDamageV2', onRuptureRoll);
  Hooks.on('dnd5e.rollFormulaV2', onRuptureRoll);
  Hooks.on('updateActor', (actor, changes, options, userId) => {
    if (formKey(actor)) checkDestroyed(formTokenOf(actor));
    if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.heliarque.destroyed`)) recount(formKey(actor) ? summonerOf(actor) : actor, userId);
  });
  Hooks.on('updateToken', (token, changes, options, userId) => {
    checkDestroyed(token);
    if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.heliarque.consumed`)) onFormTokenChange(token, userId);
  });
  Hooks.on('createToken', (token, options, userId) => onFormTokenChange(token, userId));
  Hooks.on('deleteToken', (token, options, userId) => onFormTokenChange(token, userId));
  Hooks.on('createItem', item => { if (item.actor && item.system.identifier === 'manifestation-orbitale') ensureOrbitals(); });
  Hooks.on('updateItem', onClassUpdate);
}
