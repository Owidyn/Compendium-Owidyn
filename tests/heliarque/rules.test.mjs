/** Runtime rules with minimal Foundry stand-ins. */
import { test, beforeEach, run } from './harness.mjs';
import assert from 'node:assert/strict';

globalThis.CONST = {
  GRID_TYPES: { GRIDLESS: 0, SQUARE: 1 },
  GRID_DIAGONALS: { EQUIDISTANT: 0, EXACT: 1, APPROXIMATE: 2, RECTILINEAR: 3, ALTERNATING_1: 4 },
  TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1 }
};
globalThis.canvas = { scene: null };
globalThis.dnd5e = { utils: {} };
globalThis.Hooks = { on() {}, once() {} };
globalThis.game = { scenes: [], users: { activeGM: null } };
const getProperty = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
const setProperty = (obj, path, value) => {
  const keys = path.split('.'); let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys.at(-1)] = value;
};
globalThis.foundry = {
  utils: {
    getProperty, setProperty,
    expandObject: flat => { const out = {}; for (const [k, v] of Object.entries(flat)) setProperty(out, k, v); return out; },
    flattenObject: (obj, prefix = '') => Object.entries(obj).reduce((acc, [k, v]) => (v && typeof v === 'object' && !Array.isArray(v)
      ? { ...acc, ...globalThis.foundry.utils.flattenObject(v, `${prefix}${k}.`) } : { ...acc, [`${prefix}${k}`]: v }), {})
  }
};

const { gapBetween, straightDestination, tokensOnPath } = await import('../../scripts/heliarque/geometry.mjs');
const { clampRecovery, onPreRest } = await import('../../scripts/heliarque/orbitals.mjs');

/* -------------------------------------------- */
/*  Geometry                                    */
/* -------------------------------------------- */

const scene = { id: 's', grid: { size: 100, distance: 5, units: 'ft', type: 1, diagonals: 0 }, tokens: [] };
const token = (id, gx, gy, size = 1, extra = {}) => {
  const t = { id, x: gx * 100, y: gy * 100, width: size, height: size, elevation: 0, parent: scene, ...extra };
  scene.tokens.push(t);
  return t;
};
beforeEach(() => { scene.tokens.length = 0; });

test('distances are measured edge to edge: adjacent = 5 ft', () => {
  const a = token('a', 0, 0), b = token('b', 1, 0), c = token('c', 3, 2), big = token('big', 5, 0, 2);
  assert.equal(gapBetween(a, b), 5);
  assert.equal(gapBetween(a, c), 15);
  assert.equal(gapBetween(b, big), 20);
  assert.equal(gapBetween(a, a), 0);
});

test('a push moves straight away and stops before occupied spaces', () => {
  const origin = { x: 50, y: 50 };
  const target = token('t', 1, 0);
  assert.deepEqual(straightDestination(target, origin, 15, 'away'), { x: 400, y: 0 });
  token('wall', 3, 0);
  assert.deepEqual(straightDestination(target, origin, 15, 'away'), { x: 400, y: 0 }, 'an occupied square on the way does not stop the push');
  token('end', 4, 0);
  assert.deepEqual(straightDestination(target, origin, 15, 'away'), { x: 200, y: 0 });
});

test('a pull stops adjacent to its origin', () => {
  const anchor = token('anchor', 0, 0);
  const target = token('t', 4, 0);
  const destination = straightDestination(target, { x: 50, y: 50 }, 30, 'toward', { ignore: new Set([anchor.id]) });
  assert.deepEqual(destination, { x: 100, y: 0 });
});

test('a 5 ft line between two points touches the creatures on it', () => {
  token('on', 2, 0); token('off', 2, 2);
  const hits = tokensOnPath(scene, [{ x: 50, y: 50 }, { x: 550, y: 50 }], 5).map(t => t.id);
  assert.deepEqual(hits, ['on']);
});

/* -------------------------------------------- */
/*  Orbitals                                    */
/* -------------------------------------------- */

function heliarque({ spent = 0, max = 8, destroyed = 0, live = 0 }) {
  const item = { id: 'orb', type: 'feat', flags: { 'compendium-owidyn': { heliarque: { key: 'orbitals' } } }, system: { identifier: 'orbitals', uses: { spent, max, value: max - spent } } };
  const actor = {
    uuid: 'Actor.h', items: [item], flags: { 'compendium-owidyn': { heliarque: { destroyed } } },
    getFlag: (scope, key) => getProperty(actor.flags[scope], key),
    updateSource: changes => { for (const [k, v] of Object.entries(changes)) setProperty(actor, k, v); }
  };
  item.actor = actor;
  // Live Form tokens on a scene, summoned by this actor.
  const origin = 'Actor.h.Item.formes';
  globalThis.fromUuidSync = uuid => (uuid === origin ? { actor } : null);
  game.scenes = [{ tokens: Array.from({ length: live }, (_, i) => ({
    actor: { flags: { 'compendium-owidyn': { heliarque: { form: 'satellite' } }, dnd5e: { summon: { origin } } } },
    getFlag: () => false
  })) }];
  return { actor, item };
}

test('recovery never frees Manifested or destroyed Orbitals', () => {
  const { item } = heliarque({ spent: 6, destroyed: 1, live: 2 });
  const changes = { system: { uses: { spent: 0 } } };
  clampRecovery(item, changes, {});
  assert.equal(changes.system.uses.spent, 3);
  const spending = { system: { uses: { spent: 7 } } };
  clampRecovery(item, spending, {});
  assert.equal(spending.system.uses.spent, 7);
});

test('a Long Rest recovers destroyed Orbitals but keeps Manifested ones', () => {
  const { actor, item } = heliarque({ spent: 7, destroyed: 2, live: 2 });
  const result = { longRest: true, updateData: {}, updateItems: [{ _id: 'orb', 'system.uses.spent': 0 }] };
  onPreRest(actor, result);
  assert.equal(result.updateItems[0]['system.uses.spent'], 2);
  assert.equal(result.updateData['flags.compendium-owidyn.heliarque.destroyed'], 0);
  assert.equal(item.actor.getFlag('compendium-owidyn', 'heliarque.destroyed'), 0);
});

test('a Short Rest recovers only Dépensés: destroyed Orbitals wait for the Long Rest', () => {
  const { actor } = heliarque({ spent: 7, destroyed: 2, live: 1 });
  const result = { longRest: false, updateData: {}, updateItems: [{ _id: 'orb', 'system.uses.spent': 1 }] };
  onPreRest(actor, result);
  assert.equal(result.updateItems[0]['system.uses.spent'], 3);
});
run();
