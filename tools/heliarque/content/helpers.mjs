/** Builders producing D&D5e 6.x source data, shaped like the system's own compendium documents. */
import { createHash } from 'node:crypto';

export const MODULE_ID = 'compendium-owidyn';
/** Shared Item compendium of the Owidyn module (folder Class › Héliarque) and the Forms' Actor compendium. */
export const ITEM_PACK = 'compendium-owidyn';
export const ACTOR_PACK = 'formes-orbitales';
export const CLASS_ID = 'heliarque';
export const SUBCLASS_ID = 'soothing-star';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
/** Deterministic 16-character Foundry ID: rebuilding never changes UUIDs. */
export function id(key) {
  const bytes = createHash('sha1').update(`heliarque:${key}`).digest();
  return Array.from(bytes.subarray(0, 16), b => ALPHABET[b % ALPHABET.length]).join('');
}
export const itemUuid = key => `Compendium.${MODULE_ID}.${ITEM_PACK}.Item.${id(`item:${key}`)}`;
export const actorUuid = key => `Compendium.${MODULE_ID}.${ACTOR_PACK}.Actor.${id(`actor:${key}`)}`;

/** Module metadata of a generated document (flags.compendium-owidyn.heliarque), created when missing. */
export const meta = doc => ((doc.flags ??= {})[MODULE_ID] ??= {}).heliarque ??= {};

export const icon = name => `modules/${MODULE_ID}/assets/heliarque/${name}.svg`;

/* -------------------------------------------- */
/*  Formulas                                    */
/* -------------------------------------------- */

/** n Dés de Fusion of the Héliarque, e.g. DF(2) → "2d8". */
export const DF = (n = 1, prefix = '') => `${n}@${prefix}scale.heliarque.fusion.die`;
/** Scaled dice count × Dé de Fusion: "(@scale.heliarque.canon)d8". */
export const scaledDF = (scale, prefix = '') => `(@${prefix}scale.heliarque.${scale})@${prefix}scale.heliarque.fusion.die`;
export const CHA = (prefix = '') => `@${prefix}abilities.cha.mod`;
export const PB = (prefix = '') => `@${prefix}attributes.prof`;
/** Prefix used by Form actors: their roll data exposes the summoner as @summoner. */
export const S = 'summoner.';

/* -------------------------------------------- */
/*  HTML                                        */
/* -------------------------------------------- */

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const inline = text => escape(text)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>');

/** Minimal Markdown → HTML: paragraphs, bullet lists, #### headings, tables, bold/italic. */
export function html(markdown) {
  const out = [];
  let list = null, table = null;
  const flush = () => {
    if (list) out.push(`<ul>${list.map(l => `<li>${inline(l)}</li>`).join('')}</ul>`);
    if (table) {
      const [head, , ...rows] = table;
      const cells = (row, tag) => row.split('|').slice(1, -1).map(c => `<${tag}>${inline(c.trim())}</${tag}>`).join('');
      out.push(`<table><thead><tr>${cells(head, 'th')}</tr></thead><tbody>${rows.map(r => `<tr>${cells(r, 'td')}</tr>`).join('')}</tbody></table>`);
    }
    list = table = null;
  };
  for (const raw of markdown.trim().split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('|')) { if (list) flush(); (table ??= []).push(line); continue; }
    if (/^[-•] /.test(line)) { if (table) flush(); (list ??= []).push(line.slice(2)); continue; }
    flush();
    const heading = line.match(/^(#{3,5}) (.+)$/);
    if (heading) out.push(`<h${heading[1].length + 1}>${inline(heading[2])}</h${heading[1].length + 1}>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join('');
}

/* -------------------------------------------- */
/*  Effects                                     */
/* -------------------------------------------- */

export function change(key, value, type = 'add') {
  return { key, value: String(value), type, phase: 'initial', priority: null };
}

/**
 * ActiveEffect source data (Foundry 14 / D&D5e 6 layout).
 * @param {string} key  Stable key, unique within the parent item.
 */
export function effect(key, name, { changes = [], img = 'icons/svg/aura.svg', transfer = false, statuses = [],
  rounds = null, expiry = null, description = '', disabled = false, flags = {} } = {}) {
  return {
    _id: id(`effect:${key}`), name, img, type: 'base',
    system: { changes },
    disabled,
    duration: rounds ? { value: rounds, units: 'rounds', expiry: expiry ?? 'sourceStart', expired: false }
      : { value: null, units: 'seconds', expiry, expired: false },
    description: description ? html(description) : '',
    origin: null, tint: '#ffffff', transfer, statuses, sort: 0,
    flags: { [MODULE_ID]: { heliarque: { key, ...flags } } }, start: null, showIcon: 1
  };
}

/* -------------------------------------------- */
/*  Activities                                  */
/* -------------------------------------------- */

export function damagePart(formula, types = ['force']) {
  return {
    number: null, denomination: null, bonus: '', types,
    custom: { enabled: true, formula }, scaling: { mode: '', number: 1, formula: '' }
  };
}

const ACTIVATIONS = { action: 'action', bonus: 'bonus', reaction: 'reaction', minute: 'minute', special: 'special', none: '' };

/**
 * Activity source data.
 * @param {string} key   Stable key, unique within the parent item.
 * @param {string} type  attack | save | heal | damage | utility | summon | teleport
 * @param {object} o
 * @param {number} [o.cost]        Orbitals consumed from the "orbitals" feature.
 * @param {boolean} [o.uses]       Consume one use of the parent item.
 * @param {object} [o.heliarque]   Module metadata read by the runtime scripts (flags.compendium-owidyn.heliarque).
 */
export function activity(key, type, name, o = {}) {
  const targets = [];
  if (o.cost) targets.push({ type: 'itemUses', value: String(o.cost), target: 'feat:orbitals', scaling: {} });
  if (o.restore) targets.push({ type: 'itemUses', value: String(-o.restore), target: 'feat:orbitals', scaling: {} });
  if (o.uses) targets.push({ type: 'itemUses', value: '1', target: '', scaling: {} });
  const data = {
    _id: id(`activity:${key}`), type, name, img: o.img ?? '', sort: o.sort ?? 0,
    activation: { type: ACTIVATIONS[o.activation ?? 'none'] ?? o.activation, value: o.activationValue ?? null,
      condition: o.condition ?? '', override: false },
    consumption: { targets, scaling: { allowed: false, max: '' }, spellSlot: false },
    description: { chatFlavor: o.chatFlavor ?? '' },
    duration: { value: o.duration?.value ?? '', units: o.duration?.units ?? 'inst', special: o.duration?.special ?? '',
      concentration: false, override: false },
    effects: (o.effects ?? []).map(e => (typeof e === 'string' ? { _id: id(`effect:${e}`), onSave: false } : { _id: id(`effect:${e.key}`), onSave: e.onSave ?? false })),
    range: { value: o.range?.value != null ? String(o.range.value) : '', units: o.range?.units ?? (o.range?.value != null ? 'ft' : 'self'),
      special: o.range?.special ?? '', override: false },
    target: {
      template: { count: '', contiguous: false, stationary: o.template?.stationary ?? true, type: o.template?.type ?? '',
        size: o.template?.size != null ? String(o.template.size) : '', width: o.template?.width != null ? String(o.template.width) : '',
        height: '', units: 'ft' },
      affects: { count: o.affects?.count != null ? String(o.affects.count) : '', type: o.affects?.type ?? '',
        choice: o.affects?.choice ?? false, special: o.affects?.special ?? '' },
      prompt: o.template?.type ? true : false, override: false
    },
    uses: { spent: 0, recovery: [], max: '' },
    visibility: { identifier: 'heliarque', level: { min: o.level ?? null, max: o.maxLevel ?? null },
      requireAttunement: false, requireIdentification: false, requireMagic: false },
    behaviors: [],
    flags: o.heliarque ? { [MODULE_ID]: { heliarque: o.heliarque } } : {}
  };
  switch (type) {
    case 'attack':
      data.attack = { ability: o.attack?.ability ?? '', bonus: o.attack?.bonus ?? '', critical: { threshold: null },
        flat: o.attack?.flat ?? false, type: { value: o.attack?.type ?? 'ranged', classification: 'spell' } };
      data.damage = { critical: { bonus: '' }, includeBase: false, parts: o.damage ?? [] };
      break;
    case 'save':
      data.save = { ability: o.save.ability, dc: { calculation: o.save.dc ? '' : 'cha', formula: o.save.dc ?? '' } };
      data.damage = { onSave: o.onSave ?? 'half', parts: o.damage ?? [] };
      break;
    case 'heal':
      data.healing = { ...damagePart(o.healing.formula, o.healing.types ?? ['healing']) };
      break;
    case 'damage':
      data.damage = { critical: { allow: false, bonus: '' }, parts: o.damage ?? [] };
      break;
    case 'utility':
      data.roll = { formula: o.roll?.formula ?? '', name: o.roll?.name ?? '', prompt: false, visible: !!o.roll };
      break;
    case 'summon':
      data.bonuses = { ac: o.bonuses?.ac ?? '', hd: '', hp: o.bonuses?.hp ?? '', attackDamage: '', saveDamage: '', healing: '' };
      data.creatureSizes = []; data.creatureTypes = [];
      data.match = { ability: 'cha', proficiency: false, attacks: false, saves: false, disposition: true };
      data.profiles = o.profiles;
      // No summon.identifier: dnd5e migrates it into visibility.identifier, which sets the level read by profiles.
      data.summon = { mode: '', prompt: true };
      data.tempHP = '';
      break;
    case 'teleport':
      data.teleport = { override: true, value: String(o.teleport), units: 'ft' };
      break;
  }
  return data;
}

/* -------------------------------------------- */
/*  Items                                       */
/* -------------------------------------------- */

const STATS = {
  compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '14.367',
  systemId: 'dnd5e', systemVersion: '6.0.6', createdTime: null, modifiedTime: null, lastModifiedBy: null
};

/** Common item envelope. */
export function baseItem(key, type, name, { img, description = '', system = {}, effects = [], flags = {}, folder = null, sort = 0 }) {
  return {
    _id: id(`item:${key}`), name, type, img, folder, sort,
    system: {
      description: { value: html(description), chat: '' },
      source: { custom: '', rules: '2024', revision: 1, license: '', book: 'Héliarque' },
      identifier: key,
      ...system
    },
    effects, flags: { [MODULE_ID]: { heliarque: { key, ...flags } } }, ownership: { default: 0 }, _stats: { ...STATS }
  };
}

/**
 * Feature item (type "feat").
 * @param {object} o
 * @param {string} [o.subtype]         Feature subtype.
 * @param {number} [o.level]           Level prerequisite shown and enforced by ItemChoice.
 * @param {string} [o.requirements]    Display string, e.g. "Héliarque 5".
 * @param {object} [o.uses]            Limited uses: { max, recovery: [{period, type, formula}] }.
 * @param {object[]} [o.activities]
 */
export function feature(key, name, o = {}) {
  const activities = Object.fromEntries((o.activities ?? []).map((a, i) => [a._id, { ...a, sort: a.sort || (i + 1) * 100000 }]));
  return baseItem(key, 'feat', name, {
    img: o.img ?? icon(key), description: o.description ?? '', effects: o.effects ?? [], flags: o.flags ?? {}, folder: o.folder ?? null,
    sort: o.sort ?? 0,
    system: {
      type: { value: o.featType ?? 'class', subtype: o.subtype ?? '' },
      requirements: o.requirements ?? '',
      prerequisites: { level: o.level ?? null, repeatable: false, items: [] },
      properties: o.properties ?? [],
      uses: { max: o.uses?.max ?? '', spent: 0, recovery: o.uses?.recovery ?? [] },
      activities,
      enchant: {},
      crewed: false
    }
  });
}

// Spellcasting method registered by the module script, and the spell level of a Technique from its prerequisite.
import { TECHNIQUE_METHOD, techniqueTier } from '../../../scripts/heliarque/util.mjs';
export { TECHNIQUE_METHOD, techniqueTier };

const OVERRIDABLE = ['activation', 'duration', 'range', 'target'];
/** The part of an activity field a spell defines at item level. */
const spellField = (field, data) => {
  if (field === 'target') return { template: data.template, affects: data.affects };
  const { override, concentration, ...rest } = data;
  return rest;
};

/**
 * Spell item cast through the Techniques stellaires method.
 * Casting time, duration, range and targets come from the first activity, as in the system's own spells;
 * other activities override them only where they differ.
 * @param {object} o
 * @param {number} o.level    Spell level (0 for Manifestation orbitale).
 * @param {string} o.school   Spell school key.
 */
export function spell(key, name, o = {}) {
  const list = (o.activities ?? []).map((a, i) => ({ ...a, sort: a.sort || (i + 1) * 100000 }));
  const main = list[0];
  for (const a of list) {
    for (const field of OVERRIDABLE) {
      const differs = JSON.stringify(spellField(field, a[field])) !== JSON.stringify(spellField(field, main[field]));
      a[field] = { ...a[field], override: differs };
    }
  }
  return baseItem(key, 'spell', name, {
    img: o.img ?? icon(key), description: o.description ?? '', effects: o.effects ?? [], flags: o.flags ?? {}, folder: o.folder ?? null,
    sort: o.sort ?? 0,
    system: {
      ability: 'cha',
      ...Object.fromEntries(OVERRIDABLE.map(field => [field, spellField(field, main[field])])),
      level: o.level,
      materials: { value: '', consumed: false, cost: 0, supply: 0 },
      method: TECHNIQUE_METHOD,
      prepared: 0,
      properties: [],
      school: o.school,
      sourceItem: 'class:heliarque',
      uses: { max: o.uses?.max ?? '', spent: 0, recovery: o.uses?.recovery ?? [] },
      activities: Object.fromEntries(list.map(a => [a._id, a]))
    }
  });
}

/* -------------------------------------------- */
/*  Advancement                                 */
/* -------------------------------------------- */

/** Spell configuration applied by advancements granting Techniques. */
export const TECHNIQUE_SPELL_CONFIG = {
  ability: ['cha'], method: TECHNIQUE_METHOD, prepared: 0, uses: { max: '', per: '', requireSlot: false }
};

export function grant(key, level, uuids, title = 'Aptitudes de classe', { spell = null } = {}) {
  return {
    _id: id(`advancement:${key}`), type: 'ItemGrant', level, title,
    configuration: { items: uuids.map(uuid => ({ uuid, optional: false })), optional: false, spell },
    value: {}
  };
}

export function scale(key, title, type, values, { units = '' } = {}) {
  const entry = value => {
    if (type === 'dice') { const [number, faces] = value.split('d'); return { number: number ? Number(number) : null, faces: Number(faces), modifiers: [] }; }
    return { value };
  };
  return {
    _id: id(`advancement:scale:${key}`), type: 'ScaleValue', title, hint: '',
    configuration: { identifier: key, type, distance: { units }, scale: Object.fromEntries(Object.entries(values).map(([l, v]) => [l, entry(v)])) },
    value: {}
  };
}

export function trait(key, title, { grants = [], choices = [], primary = false }) {
  return {
    _id: id(`advancement:${key}`), type: 'Trait', level: 1, title, hint: '',
    configuration: { mode: 'default', allowReplacements: false, grants, choices },
    value: { chosen: [] },
    ...(primary ? { classRestriction: 'primary' } : {})
  };
}

export function asi(level, { title = '', recommendation = null } = {}) {
  return {
    _id: id(`advancement:asi:${level}`), type: 'AbilityScoreImprovement', level, title, hint: '',
    configuration: { points: 2, fixed: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, cap: 2, locked: [], recommendation, max: null },
    value: {}
  };
}
