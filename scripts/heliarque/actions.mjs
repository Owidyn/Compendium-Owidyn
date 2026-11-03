/**
 * Techniques stellaires and class features that need more than a native activity:
 * Origine, automatic targeting around Forms, Combustion de secours, Supernova discount,
 * and the follow-up flows (Translation, Passage, Dérivation, Constellation mobile, NOT YET…).
 */
import { asGM, registerGM } from './socket.mjs';
import { hasEffect, orbitalsItem, restore, spend } from './orbitals.mjs';
import { formsInUse, reconfigureFlow } from './forms.mjs';
import { messageTargets, moveToken } from './movement.mjs';
import { centerOf, feetToUnits, pickDestination, pointDistance, tokensOnPath, within } from './geometry.mjs';
import { FORMS, MODULE_ID, card, choose, confirm, escape, featureItem, formKey, formTokens, levelOf, meta, notify,
  ownersOf, scaleOf, summonerOf, tokenOf, turnKey } from './util.mjs';

/* -------------------------------------------- */
/*  Per-turn usage                              */
/* -------------------------------------------- */

/** Has `actor` used `key` this turn (count < limit)? Outside combat nothing is limited. */
function usedThisTurn(actor, key, limit = 1) {
  const turn = turnKey();
  if (!turn) return false;
  const record = actor.getFlag(MODULE_ID, `heliarque.turn.${key}`);
  return record?.turn === turn && record.count >= limit;
}
async function markTurn(actor, key) {
  const turn = turnKey();
  if (!turn) return;
  const record = actor.getFlag(MODULE_ID, `heliarque.turn.${key}`);
  const count = record?.turn === turn ? record.count + 1 : 1;
  await actor.setFlag(MODULE_ID, `heliarque.turn.${key}`, { turn, count });
}

/* -------------------------------------------- */
/*  Pre-use: Techniques                         */
/* -------------------------------------------- */

const FORM_IMG = token => token.texture.src;
const formOption = token => ({ value: token.id, label: `${token.name}`, img: FORM_IMG(token), hint: FORMS[formKey(token.actor)] });

function sceneForms(summoner, filter = []) {
  return formTokens(summoner).filter(t => t.parent === canvas.scene && (!filter.length || filter.includes(formKey(t.actor))));
}

/** Radius of a targeting spec, in feet. */
function radiusOf(spec, summoner) {
  const field = scaleOf(summoner, 'champ') ?? 10;
  if (spec.radius === 'field') return field;
  if (spec.radius === 'field+10') return field + 10;
  return Number(spec.radius);
}

function creaturesAround(source, feet, summoner, { disposition, excludeBearer } = {}) {
  const self = tokenOf(summoner);
  return source.parent.tokens.filter(t => {
    if (t.id === source.id || !t.actor || formKey(t.actor) || t.hidden) return false;
    if (excludeBearer && source.getFlag(MODULE_ID, 'heliarque.bearer') === t.id) return false;
    if (disposition === 'hostile' && t.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE) return false;
    if (disposition === 'hostile' && self && t.disposition === self.disposition) return false;
    return within(source, t, feet);
  });
}

async function pickTargets(title, tokens, { preselect = () => true } = {}) {
  if (!tokens.length) return [];
  return choose(title, tokens.map(t => ({ value: t.id, label: t.name, img: t.texture.src, checked: preselect(t) })),
    { multiple: true, prompt: 'Créatures affectées :' });
}

/**
 * Interactive preparation. Returns extra data for the usage, or null when cancelled.
 * Sets the user's targets as a side effect.
 */
async function prepareTargeting(activity, spec, summoner) {
  const self = tokenOf(summoner);
  const hostileFirst = t => t.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;

  if (spec.kind === 'self') {
    const source = tokenOf(activity.actor);
    const tokens = creaturesAround(source, radiusOf(spec, summoner), summoner, spec);
    const ids = await pickTargets(activity.name, tokens, { preselect: hostileFirst });
    game.user.updateTokenTargets(ids);
    return { chosenForm: source.id };
  }

  if (spec.kind === 'formRadius') {
    const forms = sceneForms(summoner, spec.forms ?? []);
    if (!forms.length) { notify('Aucune Forme Manifestée adaptée sur cette scène.', 'warn'); return null; }
    const id = forms.length === 1 ? forms[0].id : await choose(activity.name, forms.map(formOption), { prompt: 'Forme choisie :' });
    const source = id && canvas.scene.tokens.get(id);
    if (!source) return null;
    const tokens = creaturesAround(source, radiusOf(spec, summoner), summoner, spec);
    const ids = spec.disposition === 'hostile' ? tokens.map(t => t.id) : await pickTargets(activity.name, tokens, { preselect: hostileFirst });
    game.user.updateTokenTargets(ids);
    return { chosenForm: source.id, chosenFormType: formKey(source.actor) };
  }

  if (spec.kind === 'spheres') {
    const forms = sceneForms(summoner);
    const max = summoner.system.attributes.prof;
    const ids = await choose(activity.name, forms.map(f => ({ ...formOption(f), checked: true })),
      { multiple: true, max, prompt: `Jusqu'à ${max} Formes :` });
    if (!ids.length) return null;
    const counts = new Map();
    for (const id of ids) {
      for (const t of creaturesAround(canvas.scene.tokens.get(id), spec.radius, summoner, spec)) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
    }
    game.user.updateTokenTargets([...counts.keys()]);
    return { spheres: Object.fromEntries(counts) };
  }

  if (spec.kind === 'path') {
    const points = [];
    const candidates = [...(spec.includeSelf && self ? [self] : []), ...sceneForms(summoner)];
    const [min, max] = spec.points;
    while (points.length < max) {
      const options = candidates.filter(c => !points.includes(c)).map(c => ({ value: c.id, label: c.name, img: c.texture.src }));
      if (points.length >= min) options.unshift({ value: '__done', label: 'Terminer la trajectoire' });
      const id = await choose(`${activity.name} — point ${points.length + 1}`, options);
      if (!id) return null;
      if (id === '__done') break;
      const token = canvas.scene.tokens.get(id);
      const previous = points.at(-1);
      if (previous && pointDistance(centerOf(previous), centerOf(token), canvas.scene) > feetToUnits(spec.segment, canvas.scene) + 0.01) {
        notify(`Chaque segment doit mesurer ${spec.segment} ft ou moins.`, 'warn');
        continue;
      }
      points.push(token);
    }
    const total = points.slice(1).reduce((sum, t, i) => sum + pointDistance(centerOf(points[i]), centerOf(t), canvas.scene), 0);
    if (spec.total && total > feetToUnits(spec.total, canvas.scene) + 0.01) {
      notify(`La trajectoire dépasse ${spec.total} ft.`, 'warn');
      return null;
    }
    const exclude = new Set([...(self ? [self.id] : []), ...(spec.excludeForms ? sceneForms(summoner).map(f => f.id) : [])]);
    const hits = tokensOnPath(canvas.scene, points.map(p => centerOf(p)), spec.width, exclude).filter(t => t.actor);
    const ids = await pickTargets(activity.name, hits, { preselect: hostileFirst });
    game.user.updateTokenTargets(ids);
    return { path: points.map(p => p.id) };
  }
  return {};
}

/**
 * Hook "dnd5e.preUseActivity" for Techniques and class features with interactive preparation.
 * When preparation is needed, the use is cancelled and replayed once the user has answered.
 */
function onPreUse(activity, usage, dialog, message) {
  const data = meta(activity);
  if (prepared.has(activity.uuid)) return;
  const actor = activity.actor;
  const summoner = formKey(actor) ? summonerOf(actor) : actor;
  const needsPrep = data.technique || data.targeting || data.targetForms || data.requiresForm;
  if (!needsPrep || !summoner || !orbitalsItem(summoner)) return;

  if (data.requiresForm && !formTokens(summoner, { form: data.requiresForm }).length) {
    notify(`Nécessite un ${FORMS[data.requiresForm]} Manifesté.`, 'warn');
    return false;
  }
  prepare(activity, summoner, data, usage, dialog, message).catch(err => notify(err.message, 'error'));
  return false;
}

async function prepare(activity, summoner, data, usage, dialog, message) {
  const extra = { prepared: true };

  // Origine : oui.
  if (data.origin) {
    const satellites = sceneForms(summoner, ['satellite']);
    if (satellites.length) {
      const self = tokenOf(summoner);
      const id = await choose(`${activity.name} — Origine`, [
        { value: self?.id ?? '__self', label: `${summoner.name} (votre espace)`, img: summoner.img },
        ...satellites.map(formOption)
      ]);
      if (!id) return;
      extra.origin = id;
      extra.originIsSatellite = satellites.some(s => s.id === id);
    }
  }

  // Automatic targeting.
  if (data.targeting) {
    const result = await prepareTargeting(activity, data.targeting, summoner);
    if (result === null) return;
    Object.assign(extra, result);
  }
  if (data.targetForms) {
    const forms = sceneForms(summoner);
    const multiple = data.action === 'reconfiguration-instantanee';
    const ids = multiple
      ? await choose(activity.name, forms.map(f => ({ ...formOption(f), checked: true })), { multiple: true })
      : [await choose(activity.name, forms.map(formOption), { prompt: 'Forme soignée :' })].filter(Boolean);
    if (!ids.length) return;
    game.user.updateTokenTargets(ids);
    extra.forms = ids;
  }

  // Cost: Supernova discount and Combustion de secours.
  const cost = Number(data.cost ?? 0);
  if (data.technique && cost) {
    let remaining = cost;
    if (hasEffect(summoner, 'etat-de-supernova:etat') && !usedThisTurn(summoner, 'supernova-discount')) {
      remaining = Math.max(0, remaining - 1);
      extra.discount = true;
    }
    const reserve = orbitalsItem(summoner).system.uses.value;
    if (reserve < remaining) {
      const combustion = levelOf(summoner) >= 2 ? (scaleOf(summoner, 'combustion') ?? 2) : 0;
      const forms = combustion ? sceneForms(summoner) : [];
      if (!forms.length || reserve < remaining - combustion) {
        notify(`Réserve insuffisante : ${reserve} Orbital${reserve > 1 ? 's' : ''} pour un coût de ${remaining}.`, 'warn');
        return;
      }
      const id = await choose('Combustion de secours', forms.map(formOption), {
        prompt: `Réserve : ${reserve} / coût : ${remaining}. Sacrifier une Forme (compte comme ${combustion} Orbitals, excédent perdu) :`
      });
      if (!id) return;
      extra.combustion = canvas.scene.tokens.get(id).uuid;
      remaining = Math.max(0, remaining - combustion);
    }
    if (remaining !== cost || extra.combustion) {
      extra.customCost = remaining;
      usage.consume = { ...(usage.consume ?? {}), resources: [] };
    }
  }

  prepared.set(activity.uuid, extra);
  try {
    await activity.use(usage, dialog, message);
  } finally {
    prepared.delete(activity.uuid);
  }
}

/** Preparation results waiting for the replayed use, by activity UUID. */
const prepared = new Map();

/* -------------------------------------------- */
/*  Post-use                                    */
/* -------------------------------------------- */

async function onPostUse(activity, usage, results) {
  const data = meta(activity);
  const extra = prepared.get(activity.uuid) ?? {};
  prepared.delete(activity.uuid);
  const actor = activity.actor;
  const summoner = formKey(actor) ? summonerOf(actor) : actor;
  if (!summoner || !orbitalsItem(summoner)) return;
  const message = results?.message;
  try {
    if (message && (extra.chosenForm || extra.origin || extra.spheres)) {
      await message.setFlag(MODULE_ID, 'heliarque.chosenForm', extra.chosenForm ?? extra.origin ?? null);
    }
    if (extra.spheres) await spheresNote(summoner, extra.spheres);

    // Costs paid outside the native consumption.
    if (extra.combustion) await asGM('consume', { tokenUuid: extra.combustion, pending: false });
    if (extra.customCost) await spend(summoner, extra.customCost);
    if (extra.discount) await markTurn(summoner, 'supernova-discount');

    // Ancre bonus of Singularité relayée.
    if (data.anchorEffect && extra.chosenFormType === 'ancre') {
      notify('Forme choisie : Ancre — les créatures qui échouent ont aussi une Speed de 0 (appliquez l\'effet depuis la carte).');
    }

    switch (data.action) {
      case 'translation': await translation(summoner); break;
      case 'passage': await passage(summoner); break;
      case 'derivation': await derivation(summoner, message); break;
      case 'reconfiguration-instantanee': await reconfigurationInstantanee(summoner, extra.forms ?? []); break;
    }
    switch (data.role) {
      case 'constellation': await constellation(summoner); break;
      case 'parallel': await parallelCommand(summoner); break;
      case 'supernova': await supernova(summoner); break;
      case 'notyet': await notYet(summoner, activity, message); break;
      case 'incarnation': await incarnation(summoner, activity); break;
      case 'sillage': await markTurn(summoner, 'sillage'); break;
      case 'supercritical': await markTurn(summoner, 'supercritical'); break;
    }

    // Prompts that follow a Command or a Technique.
    const isCommand = data.role === 'command';
    if (isCommand || data.technique) await followUps(summoner, { isCommand, technique: data.technique, cost: Number(data.cost ?? 0), extra, activity });
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function spheresNote(summoner, spheres) {
  const lines = Object.entries(spheres).filter(([, n]) => n > 1).map(([id, n]) => {
    const extraDice = Math.min(4, (n - 1) * 2);
    return `<li>${escape(canvas.scene.tokens.get(id)?.name)} : ${n} sphères → +${extraDice} DF</li>`;
  });
  if (lines.length) await card(summoner, `<p><strong>Effondrement de constellation</strong> — sphères supplémentaires :</p><ul>${lines.join('')}</ul>`);
}

/** Sillage apaisant and Réaction supercritique offers. */
async function followUps(summoner, { isCommand, technique, cost, extra }) {
  const buttons = [];
  const sillage = featureItem(summoner, 'sillage-apaisant');
  const limit = hasEffect(summoner, 'second-dawn:sillage') ? 2 : 1;
  if (sillage && (isCommand || (technique && extra.originIsSatellite)) && !usedThisTurn(summoner, 'sillage', limit)) {
    buttons.push(...sillage.system.activities.contents.map(a => `<button type="button" data-heliarque-use="${a.uuid}">Sillage — ${a.name}</button>`));
  }
  const noyau = featureItem(summoner, 'noyau-supercritique');
  if (noyau && technique && cost >= 2 && !usedThisTurn(summoner, 'supercritical')) {
    buttons.push(...noyau.system.activities.contents.map(a => `<button type="button" data-heliarque-use="${a.uuid}">${a.name}</button>`));
  }
  if (!buttons.length) return;
  await card(summoner, `<p>Réactions disponibles :</p><div class="heliarque-buttons">${buttons.join('')}</div>`,
    { whisper: [...ownersOf(summoner), ...game.users.filter(u => u.isGM).map(u => u.id)] });
}

/* -------------------------------------------- */
/*  Flows                                       */
/* -------------------------------------------- */

async function translation(summoner) {
  const self = tokenOf(summoner);
  const satellites = sceneForms(summoner, ['satellite']).filter(s => !self || within(self, s, 60));
  if (!self || !satellites.length) return notify('Aucun Satellite à 60 ft ou moins.', 'warn');
  const id = satellites.length === 1 ? satellites[0].id : await choose('Translation orbitale', satellites.map(formOption));
  const satellite = id && canvas.scene.tokens.get(id);
  if (!satellite) return;
  const before = { x: self.x, y: self.y, elevation: self.elevation };
  const position = await pickDestination(self, {
    teleport: true, title: 'Translation orbitale',
    validate: p => (within(self, satellite, 5, p) ? null : 'Choisissez un espace à 5 ft ou moins du Satellite.')
  });
  if (!position) return;
  await moveToken(self, position, 'blink');
  if (await confirm('Translation orbitale', `Déplacer ${escape(satellite.name)} dans l'espace que vous occupiez ?`)) {
    const size = canvas.scene.grid.size;
    const c = { x: before.x + self.width * size / 2, y: before.y + self.height * size / 2 };
    await moveToken(satellite, { x: c.x - satellite.width * size / 2, y: c.y - satellite.height * size / 2, elevation: before.elevation }, 'blink');
  }
}

async function passage(summoner) {
  const forms = sceneForms(summoner);
  if (forms.length < 2) return notify('Passage orbital nécessite deux Formes Manifestées.', 'warn');
  const firstId = await choose('Passage orbital — première Forme', forms.map(formOption));
  const first = firstId && canvas.scene.tokens.get(firstId);
  if (!first) return;
  const secondId = await choose('Passage orbital — seconde Forme', forms.filter(f => f !== first).map(formOption));
  const second = secondId && canvas.scene.tokens.get(secondId);
  if (!second) return;
  const candidates = canvas.scene.tokens.filter(t => t.actor && !formKey(t.actor) && within(first, t, 5));
  const travellerId = await choose('Passage orbital — créature', candidates.map(t => ({ value: t.id, label: t.name, img: t.texture.src })),
    { prompt: 'Vous-même ou une créature consentante à 5 ft ou moins de la première Forme :' });
  const traveller = travellerId && canvas.scene.tokens.get(travellerId);
  if (!traveller) return;
  const position = await pickDestination(traveller, {
    teleport: true, title: 'Passage orbital',
    validate: p => (within(traveller, second, 5, p) ? null : 'Choisissez un espace à 5 ft ou moins de la seconde Forme.')
  });
  if (position) await moveToken(traveller, position, 'blink');
}

registerGM('damageForm', async ({ tokenUuid, amount }) => {
  const token = fromUuidSync(tokenUuid);
  const hp = token.actor.system.attributes.hp;
  await token.actor.update({ 'system.attributes.hp.value': Math.max(0, hp.value - amount) });
});

async function derivation(summoner, message) {
  const target = messageTargets(message)[0];
  const forms = sceneForms(summoner).filter(f => !target || within(f, target, 15));
  if (!forms.length) return notify('Aucune Forme à 15 ft ou moins de la créature.', 'warn');
  const id = forms.length === 1 ? forms[0].id : await choose('Dérivation structurelle — Forme', forms.map(formOption));
  const form = id && canvas.scene.tokens.get(id);
  if (!form) return;
  const content = '<p>Dégâts effectivement prévenus (la Forme les subit, sans réduction) :</p><input type="number" name="amount" min="0" value="0" autofocus>';
  const amount = await foundry.applications.api.DialogV2.prompt({
    window: { title: 'Dérivation structurelle' }, content, rejectClose: false,
    ok: { label: 'Appliquer', callback: (event, button) => Number(button.form.elements.amount.value) || 0 }
  });
  if (amount > 0) await asGM('damageForm', { tokenUuid: form.uuid, amount });
}

async function reconfigurationInstantanee(summoner, ids) {
  for (const id of ids) {
    const token = canvas.scene.tokens.get(id);
    if (!token) continue;
    const position = await pickDestination(token, { maxFeet: 60, title: `Reconfiguration instantanée — ${token.name}` });
    if (position) await moveToken(token, position, 'fly');
    if (await confirm('Reconfiguration instantanée', `Reconfigurer ${escape(token.name)} ?`)) await reconfigureFlow(token, { free: true });
  }
}

async function constellation(summoner) {
  const forms = sceneForms(summoner);
  const ids = await choose('Constellation mobile', forms.map(f => ({ ...formOption(f), checked: false })), { multiple: true, max: 2, prompt: 'Jusqu\'à deux Formes :' });
  const feet = scaleOf(summoner, 'constellation') ?? 15;
  const moved = [];
  for (const id of ids.slice(0, 2)) {
    const token = canvas.scene.tokens.get(id);
    const position = token && await pickDestination(token, { maxFeet: feet, title: `Constellation mobile — ${token.name}` });
    if (!position) continue;
    await moveToken(token, position, 'fly');
    moved.push(token);
  }
  if (!moved.length) return;
  const id = await choose('Reconfiguration fluide', [{ value: '__none', label: 'Aucune' }, ...moved.map(formOption)], { prompt: 'Reconfigurer gratuitement une Forme déplacée ?' });
  const token = id && id !== '__none' && canvas.scene.tokens.get(id);
  if (token) await reconfigureFlow(token, { free: true });
}

async function parallelCommand(summoner) {
  const turn = turnKey();
  const forms = sceneForms(summoner).filter(f => !turn || f.getFlag(MODULE_ID, 'heliarque.commandTurn') !== turn);
  if (!forms.length) return notify('Aucune autre Forme n\'a de Commande disponible ce tour.', 'warn');
  const id = await choose('Commandement parallèle', forms.map(formOption));
  const token = id && canvas.scene.tokens.get(id);
  const command = token?.actor.items.contents.flatMap(i => i.system.activities?.contents ?? []).find(a => meta(a).role === 'command');
  if (command) await command.use({ consume: { action: false } });
}

async function supernova(summoner) {
  await restore(summoner, 999);
  await asGM('healForms', { summonerUuid: summoner.uuid, full: true });
  const free = Math.max(0, (scaleOf(summoner, 'formes') ?? 0) - formsInUse(summoner));
  await summoner.setFlag(MODULE_ID, 'heliarque.freeManifest', free);
  await card(summoner, `<p><strong>État de Supernova.</strong> Orbitals Dépensés récupérés, Formes réparées. ${free} Manifestation${free > 1 ? 's' : ''} gratuite${free > 1 ? 's' : ''} disponible${free > 1 ? 's' : ''}.</p>`);
}

registerGM('setHP', async ({ actorUuid, value }) => {
  const actor = fromUuidSync(actorUuid);
  await actor.update({ 'system.attributes.hp.value': value });
});

async function notYet(summoner, activity, message) {
  const target = messageTargets(message)[0];
  const forms = sceneForms(summoner).filter(f => !target || within(f, target, 30));
  if (!forms.length) return notify('Aucune Forme à 30 ft ou moins de la créature.', 'warn');
  const id = forms.length === 1 ? forms[0].id : await choose('NOT YET — Forme détruite', forms.map(formOption));
  const form = id && canvas.scene.tokens.get(id);
  if (!form) return;
  const space = { x: form.x, y: form.y, width: form.width, height: form.height };
  await asGM('consume', { tokenUuid: form.uuid, pending: false });
  if (!meta(activity).teleportToForm || !target) return;
  if ((target.actor.system.attributes.hp.value ?? 0) <= 0) await asGM('setHP', { actorUuid: target.actor.uuid, value: 1 });
  if (!(await confirm('NOT YET — Refuser la chute', `Téléporter ${escape(target.name)} dans l'espace de la Forme ?`))) return;
  const size = canvas.scene.grid.size;
  const formCenter = { x: space.x + space.width * size / 2, y: space.y + space.height * size / 2 };
  const position = await pickDestination(target, {
    teleport: true, title: 'NOT YET',
    validate: p => (pointDistance(centerOf(target, p), formCenter, canvas.scene) <= feetToUnits(5, canvas.scene) + canvas.scene.grid.distance / 2
      ? null : 'Choisissez l\'espace de la Forme ou un espace à 5 ft ou moins.')
  });
  if (position) await moveToken(target, position, 'blink');
}

/** Corps orbital: one Incarnation at a time, applied to the Héliarque. */
async function incarnation(summoner, activity) {
  const key = meta(activity).incarnation;
  const item = activity.item;
  const source = item.effects.find(e => e.getFlag(MODULE_ID, 'heliarque.key') === `corps-orbital:${key}`);
  const previous = summoner.effects.filter(e => e.getFlag(MODULE_ID, 'heliarque.key')?.startsWith('corps-orbital:') && e.getFlag(MODULE_ID, 'heliarque.key') !== 'corps-orbital:vol');
  if (previous.length) await summoner.deleteEmbeddedDocuments('ActiveEffect', previous.map(e => e.id));
  if (!source) return;
  const data = source.toObject();
  delete data._id;
  data.transfer = false;
  data.origin = item.uuid;
  await summoner.createEmbeddedDocuments('ActiveEffect', [data]);
}

/* -------------------------------------------- */
/*  Chat buttons                                */
/* -------------------------------------------- */

export function addUseButtons(message, html) {
  for (const button of html.querySelectorAll('[data-heliarque-use]')) {
    button.addEventListener('click', async event => {
      event.preventDefault();
      const activity = await fromUuid(button.dataset.heliarqueUse);
      if (!activity?.actor?.isOwner) return notify('Vous ne contrôlez pas cette aptitude.', 'warn');
      await activity.use();
    });
  }
}

export function registerActions() {
  Hooks.on('dnd5e.preUseActivity', onPreUse);
  Hooks.on('dnd5e.postUseActivity', onPostUse);
}
