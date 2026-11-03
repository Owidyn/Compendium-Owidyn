/**
 * Présences: automatic auras computed by the active GM from token positions, regions attached to Form tokens
 * (visual extent, Difficult Terrain of the Ancre), the Halo following its bearer, and damage hooks
 * (Couronne incendiaire, Champ d'inertie, Noyau supercritique).
 */
import { meets } from './forms.mjs';
import { feetToUnits, centerOf, within } from './geometry.mjs';
import { MODULE_ID, formKey, isActiveGM, itemKey, levelOf, scaleOf, summonerOf, turnKey } from './util.mjs';

const SOOTHING = { subclass: 'soothing-star', level: 6 };
const ICON = name => `modules/${MODULE_ID}/assets/heliarque/${name}.svg`;
const change = (key, value, type = 'add') => ({ key, value: String(value), type, phase: 'initial', priority: null });

/** Auras granted to allied creatures near a Form. */
const AURAS = {
  'etoile-guide': {
    form: 'satellite', requires: SOOTHING, radius: () => 10, label: 'Étoile guide', img: ICON('presences-apaisantes'),
    changes: () => [change('system.skills.prc.roll.mode', 1)],
    description: 'Advantage aux Wisdom (Perception) checks ; ne peut pas être Surprised tant que le Satellite est perçu.'
  },
  refuge: {
    form: 'bastion', requires: SOOTHING, radius: () => 5, label: 'Refuge', img: ICON('bastion'),
    changes: () => [change('system.attributes.ac.bonus', '+1')],
    description: '+1 AC à 5 ft ou moins du Bastion.'
  },
  stabilite: {
    form: 'ancre', requires: SOOTHING, radius: s => scaleOf(s, 'champ') ?? 10, label: 'Stabilité', img: ICON('anchor'),
    changes: () => [],
    description: 'Advantage aux Saving Throws contre Charmed, Frightened et les déplacements forcés.'
  }
};

/** Visual and terrain regions attached to each Form token. */
const REGIONS = {
  satellite: s => (meets(s, SOOTHING) ? [{ key: 'etoile-guide', label: 'Étoile guide', radius: 10, color: '#8fd3ff' }] : []),
  bastion: s => (meets(s, SOOTHING) ? [{ key: 'refuge', label: 'Refuge', radius: 5, color: '#ffd27a' }] : []),
  ancre: s => [{ key: 'champ', label: 'Champ gravitationnel', radius: scaleOf(s, 'champ') ?? 10, color: '#9a7bff', difficult: true }],
  halo: () => []
};

/* -------------------------------------------- */
/*  Aura effects                                */
/* -------------------------------------------- */

function auraEffect(key, { label, img, changes, description }, source) {
  return {
    name: label, img, type: 'base', system: { changes }, transfer: false, disabled: false, statuses: [],
    description: `<p>${description}</p>`, origin: source.actor?.uuid ?? null,
    flags: { [MODULE_ID]: { heliarque: { aura: key } } }
  };
}

function bearerEffects(halo, summoner) {
  const faces = scaleOf(summoner, 'fusion')?.faces ?? 4;
  const effects = [['couronne', {
    name: 'Halo — Couronne incendiaire', img: ICON('halo'), type: 'base', system: { changes: [] }, transfer: false,
    description: `<p>Une fois par tour, le premier jet de dégâts ajoute 1d${faces} Fire damage.</p>`,
    flags: { [MODULE_ID]: { heliarque: { aura: 'couronne', faces, halo: halo.id } } }
  }]];
  if (levelOf(summoner) >= 13) {
    const walk = halo.parent.tokens.get(halo.getFlag(MODULE_ID, 'heliarque.bearer'))?.actor?.system.attributes.movement.walk ?? 30;
    effects.push(['ascension', {
      name: 'Halo — Ascension coronaire', img: ICON('transcendance-des-formes'), type: 'base', transfer: false,
      system: { changes: [change('system.attributes.movement.fly', Math.floor(walk / 10) * 5, 'upgrade'), change('system.attributes.movement.hover', 'true', 'override')] },
      description: '<p>Fly Speed égale à la moitié de la Speed, et Hover.</p>',
      flags: { [MODULE_ID]: { heliarque: { aura: 'ascension' } } }
    }]);
  }
  return effects;
}

async function refreshScene(scene) {
  const sources = [];
  for (const token of scene.tokens) {
    const form = formKey(token.actor);
    if (!form || token.getFlag(MODULE_ID, 'heliarque.consumed')) continue;
    const summoner = summonerOf(token.actor);
    if (summoner) sources.push({ token, summoner, form, actor: token.actor });
  }
  for (const target of scene.tokens) {
    const actor = target.actor;
    if (!actor || formKey(actor)) continue;
    const desired = new Map();
    if (!target.hidden) {
      for (const source of sources) {
        for (const [key, aura] of Object.entries(AURAS)) {
          if (aura.form !== source.form || desired.has(key) || !meets(source.summoner, aura.requires)) continue;
          if (target.disposition !== source.token.disposition) continue;
          if (within(source.token, target, aura.radius(source.summoner))) {
            desired.set(key, auraEffect(key, { ...aura, changes: aura.changes(source.summoner) }, source));
          }
        }
        if (source.form === 'halo' && source.token.getFlag(MODULE_ID, 'heliarque.bearer') === target.id) {
          for (const [key, data] of bearerEffects(source.token, source.summoner)) if (!desired.has(key)) desired.set(key, data);
        }
      }
    }
    await syncAuras(actor, desired);
  }
}

async function syncAuras(actor, desired) {
  const existing = actor.effects.filter(e => e.getFlag(MODULE_ID, 'heliarque.aura'));
  const present = new Set(existing.map(e => e.getFlag(MODULE_ID, 'heliarque.aura')));
  const toDelete = existing.filter(e => !desired.has(e.getFlag(MODULE_ID, 'heliarque.aura'))).map(e => e.id);
  const toCreate = [...desired].filter(([key]) => !present.has(key)).map(([, data]) => data);
  if (toDelete.length) await actor.deleteEmbeddedDocuments('ActiveEffect', toDelete);
  if (toCreate.length) await actor.createEmbeddedDocuments('ActiveEffect', toCreate);
}

const timers = new Map();
/** Debounced aura refresh for a scene (active GM only). */
export function scheduleRefresh(scene) {
  if (!scene || !isActiveGM()) return;
  clearTimeout(timers.get(scene.id));
  timers.set(scene.id, setTimeout(() => {
    timers.delete(scene.id);
    refreshScene(scene).catch(err => console.error(`${MODULE_ID} | Présences`, err));
  }, 150));
}

/* -------------------------------------------- */
/*  Regions                                     */
/* -------------------------------------------- */

function regionData(token, { key, label, radius, color, difficult }) {
  const scene = token.parent;
  const px = feetToUnits(radius, scene) * scene.grid.size / scene.grid.distance;
  const behaviors = difficult ? [{
    name: 'Terrain difficile (hostiles)', type: 'dnd5e.difficultTerrain',
    system: { magical: true, types: [], ignoredDispositions: [token.disposition] }
  }] : [];
  return {
    name: `${token.name} — ${label}`, color,
    shapes: [{
      type: 'emanation', radius: px,
      base: { type: 'token', x: token.x, y: token.y, width: token.width, height: token.height, shape: token.shape, rotation: 0 }
    }],
    attachment: { token: token.id },
    ...(token.level ? { levels: [token.level] } : {}),
    visibility: CONST.REGION_VISIBILITY.ALWAYS,
    highlightMode: 'coverage',
    behaviors,
    flags: { [MODULE_ID]: { heliarque: { region: key, form: token.id } } }
  };
}

async function syncRegions(token) {
  const scene = token.parent;
  const summoner = summonerOf(token.actor);
  const wanted = summoner && !token.getFlag(MODULE_ID, 'heliarque.consumed') ? (REGIONS[formKey(token.actor)]?.(summoner) ?? []) : [];
  const existing = scene.regions.filter(r => r.getFlag(MODULE_ID, 'heliarque.form') === token.id);
  const stale = existing.filter(r => !wanted.some(w => w.key === r.getFlag(MODULE_ID, 'heliarque.region')
    && Math.abs((r.shapes[0]?.radius ?? 0) - feetToUnits(w.radius, scene) * scene.grid.size / scene.grid.distance) < 1));
  if (stale.length) await scene.deleteEmbeddedDocuments('Region', stale.map(r => r.id));
  const kept = new Set(existing.filter(r => !stale.includes(r)).map(r => r.getFlag(MODULE_ID, 'heliarque.region')));
  const create = wanted.filter(w => !kept.has(w.key)).map(w => regionData(token, w));
  if (create.length) {
    try { await scene.createEmbeddedDocuments('Region', create); }
    catch (err) { console.warn(`${MODULE_ID} | Zone non créée pour ${token.name}`, err); }
  }
}

async function removeRegions(scene, tokenId) {
  const ids = scene.regions.filter(r => r.getFlag(MODULE_ID, 'heliarque.form') === tokenId).map(r => r.id);
  if (ids.length) await scene.deleteEmbeddedDocuments('Region', ids);
}

/** Corps orbital — Incarnation gravitationnelle: Difficult Terrain around the Héliarque. */
async function syncIncarnationRegion(actor) {
  for (const token of actor.getActiveTokens(false, true)) {
    const active = actor.effects.some(e => e.active && e.getFlag(MODULE_ID, 'heliarque.key') === 'corps-orbital:ancre');
    const existing = token.parent.regions.filter(r => r.getFlag(MODULE_ID, 'heliarque.form') === token.id && r.getFlag(MODULE_ID, 'heliarque.region') === 'incarnation');
    if (!active && existing.length) await token.parent.deleteEmbeddedDocuments('Region', existing.map(r => r.id));
    if (active && !existing.length) {
      await token.parent.createEmbeddedDocuments('Region', [regionData(token, { key: 'incarnation', label: 'Incarnation gravitationnelle', radius: 10, color: '#9a7bff', difficult: true })]);
    }
  }
}

/* -------------------------------------------- */
/*  Halo                                        */
/* -------------------------------------------- */

async function followBearer(bearer) {
  const halos = bearer.parent.tokens.filter(t => formKey(t.actor) === 'halo' && t.getFlag(MODULE_ID, 'heliarque.bearer') === bearer.id);
  if (!halos.length) return;
  const size = bearer.parent.grid.size;
  const c = centerOf(bearer);
  await bearer.parent.updateEmbeddedDocuments('Token', halos.map(h => ({
    _id: h.id, x: c.x - h.width * size / 2, y: c.y - h.height * size / 2, elevation: bearer.elevation
  })));
}

/** Chaleur réconfortante: at the start of its turn, the bearer of a Soothing Star Halo gains temporary HP. */
export async function warmBearer(bearer) {
  if (!bearer) return;
  for (const halo of bearer.parent.tokens) {
    if (formKey(halo.actor) !== 'halo' || halo.getFlag(MODULE_ID, 'heliarque.bearer') !== bearer.id) continue;
    const summoner = summonerOf(halo.actor);
    if (!meets(summoner, SOOTHING)) continue;
    const pb = summoner.system.attributes.prof;
    const hp = bearer.actor.system.attributes.hp;
    if ((hp.temp ?? 0) < pb) await bearer.actor.update({ 'system.attributes.hp.temp': pb });
  }
}

/* -------------------------------------------- */
/*  Damage                                      */
/* -------------------------------------------- */

const crownUsed = new Map();
/** Couronne incendiaire (and Incarnation coronaire): +1 DF Fire on the bearer's first damage roll each turn. */
function onPreRollDamage(config) {
  const activity = config.subject;
  const actor = activity?.actor;
  if (!actor || activity.type === 'heal') return;
  const crown = actor.effects.find(e => e.active && (e.getFlag(MODULE_ID, 'heliarque.aura') === 'couronne' || e.getFlag(MODULE_ID, 'heliarque.key') === 'corps-orbital:halo'));
  if (!crown) return;
  const key = turnKey();
  if (key && crownUsed.get(actor.uuid) === key) return;
  if (key) crownUsed.set(actor.uuid, key);
  const faces = crown.getFlag(MODULE_ID, 'heliarque.faces') ?? scaleOf(actor, 'fusion')?.faces ?? 4;
  config.rolls ??= [];
  config.rolls.push({
    parts: [`1d${faces}`], data: config.rolls[0]?.data ?? {},
    options: { type: 'fire', types: ['fire'], flavor: crown.name }
  });
}

/** Champ d'inertie (règle de table): while Bloodied, the Bastion reduces each damage application by PB + CHA. */
function onCalculateDamage(actor, damages, options) {
  if (formKey(actor) !== 'bastion' || options.ignore === true) return;
  const hp = actor.system.attributes.hp;
  if (hp.value <= 0 || hp.value > hp.max / 2 || !(damages.amount > 0)) return;
  const summoner = summonerOf(actor);
  if (!summoner) return;
  let remaining = Math.min(damages.amount, Math.max(0, summoner.system.attributes.prof + summoner.system.abilities.cha.mod));
  let reduced = 0;
  for (const damage of damages) {
    if (damage.value <= 0 || damage.type in CONFIG.DND5E.healingTypes) continue;
    const r = Math.min(remaining, damage.value);
    damage.value -= r; remaining -= r; reduced += r;
    if (!remaining) break;
  }
  damages.amount = Math.max(0, damages.amount - reduced);
}

/** Noyau supercritique: Fire and Force damage from the Héliarque's features ignore Resistance. */
function onPreCalculateDamage(actor, damages, options) {
  const message = options.originatingMessage ?? options.origin;
  const activity = message?.getAssociatedActivity?.();
  const source = activity?.actor;
  if (!source || !itemKey(activity.item) || options.ignore === true) return;
  const heliarque = formKey(source) ? summonerOf(source) : source;
  if (levelOf(heliarque) < 15) return;
  options.ignore ??= {};
  const set = options.ignore.resistance instanceof Set ? options.ignore.resistance : new Set();
  set.add('fire'); set.add('force');
  options.ignore.resistance = set;
}

/* -------------------------------------------- */
/*  Registration                                */
/* -------------------------------------------- */

const MOVED = ['x', 'y', 'elevation', 'width', 'height', 'disposition', 'hidden'];

export function registerPresences() {
  Hooks.on('createToken', token => {
    if (!isActiveGM()) return;
    if (formKey(token.actor)) syncRegions(token);
    scheduleRefresh(token.parent);
  });
  Hooks.on('updateToken', (token, changes) => {
    if (!isActiveGM()) return;
    if (MOVED.some(k => k in changes)) {
      if ('x' in changes || 'y' in changes || 'elevation' in changes) followBearer(token);
      scheduleRefresh(token.parent);
    }
    // Consumed by a Rupture, or another Form after a Reconfiguration.
    if (formKey(token.actor) && (changes.flags?.[MODULE_ID]?.heliarque?.consumed || changes.flags?.[MODULE_ID]?.heliarque?.form)) {
      syncRegions(token);
      scheduleRefresh(token.parent);
    }
  });
  Hooks.on('deleteToken', async token => {
    if (!isActiveGM()) return;
    if (formKey(token.actor)) await removeRegions(token.parent, token.id);
    const actor = token.actor;
    if (actor && !actor.isToken) await syncAuras(actor, new Map());
    scheduleRefresh(token.parent);
  });
  // Level-ups change radii and unlocked Presences.
  Hooks.on('updateItem', item => {
    if (!isActiveGM() || item.type !== 'class' || item.system.identifier !== 'heliarque') return;
    for (const scene of game.scenes) {
      for (const token of scene.tokens) if (formKey(token.actor) && summonerOf(token.actor) === item.actor) syncRegions(token);
      scheduleRefresh(scene);
    }
  });
  const incarnation = effect => {
    if (isActiveGM() && effect.parent instanceof Actor && effect.getFlag(MODULE_ID, 'heliarque.key') === 'corps-orbital:ancre') syncIncarnationRegion(effect.parent);
  };
  Hooks.on('createActiveEffect', incarnation);
  Hooks.on('deleteActiveEffect', incarnation);
  Hooks.on('canvasReady', canvas => scheduleRefresh(canvas.scene));
  Hooks.on('dnd5e.preRollDamageV2', onPreRollDamage);
  Hooks.on('dnd5e.calculateDamage', onCalculateDamage);
  Hooks.on('dnd5e.preCalculateDamage', onPreCalculateDamage);
}
