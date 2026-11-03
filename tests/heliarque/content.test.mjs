import { test, run } from './harness.mjs';
import assert from 'node:assert/strict';
import { allContent } from '../../tools/heliarque/content/index.mjs';
import { MODULE_ID, itemUuid, techniqueTier } from '../../tools/heliarque/content/helpers.mjs';

const { items, actors } = allContent();
const meta = doc => doc.flags[MODULE_ID]?.heliarque;
const byKey = key => items.find(i => meta(i).key === key);
const cls = byKey('heliarque');
const advancements = type => cls.system.advancement.filter(a => a.type === type);
const scale = id => advancements('ScaleValue').find(a => a.configuration.identifier === id).configuration.scale;
const valueAt = (scaleData, level) => {
  const keys = Object.keys(scaleData).map(Number).filter(l => l <= level).sort((a, b) => b - a);
  return keys.length ? scaleData[keys[0]] : null;
};
const activitiesOf = item => Object.values(item.system.activities ?? {});

test('the class table matches the Héliarque document', () => {
  // Level → [Dé de Fusion, Techniques, Formes]
  const table = {
    1: [4, 2, 2], 2: [6, 4, 2], 3: [6, 4, 2], 4: [6, 4, 2], 5: [8, 5, 3], 6: [8, 5, 3], 7: [8, 6, 3], 8: [8, 6, 3],
    9: [8, 7, 4], 10: [8, 7, 4], 11: [10, 8, 4], 12: [10, 8, 4], 13: [10, 9, 5], 14: [10, 9, 5], 15: [10, 10, 5],
    16: [10, 10, 5], 17: [12, 11, 6], 18: [12, 11, 6], 19: [12, 11, 6], 20: [12, 12, 6]
  };
  const choice = advancements('ItemChoice')[0].configuration.choices;
  let known = 0;
  for (const [level, [die, techniques, forms]] of Object.entries(table)) {
    known += choice[level].count ?? 0;
    assert.equal(valueAt(scale('fusion'), level).faces, die, `Dé de Fusion niveau ${level}`);
    assert.equal(valueAt(scale('techniques'), level).value, techniques, `Techniques niveau ${level}`);
    assert.equal(known, techniques, `Techniques choisies niveau ${level}`);
    assert.equal(valueAt(scale('formes'), level).value, forms, `Formes niveau ${level}`);
  }
});

test('every class feature is granted at its level; Form abilities stay on the Forms', () => {
  const grants = {};
  for (const a of advancements('ItemGrant')) (grants[a.level] ??= []).push(...a.configuration.items.map(i => i.uuid));
  const expected = {
    1: ['orbitals', 'techniques-stellaires', 'origine-orbitale', 'manifestation-orbitale'],
    2: ['combustion-de-secours'], 5: ['synchronisation-orbitale'], 7: ['evolution-orbitale'], 9: ['matrice-orbitale'],
    11: ['commandement-parallele'], 13: ['transcendance-des-formes'], 15: ['noyau-supercritique'], 17: ['reacteur-autonome'],
    18: ['corps-orbital'], 20: ['etat-de-supernova']
  };
  assert.deepEqual(Object.keys(grants).map(Number).sort((a, b) => a - b), Object.keys(expected).map(Number));
  for (const [level, keys] of Object.entries(expected)) assert.deepEqual(grants[level].sort(), keys.map(itemUuid).sort());
  for (const key of ['formes-orbitales', 'satellite', 'bastion', 'halo', 'ancre-gravitationnelle']) assert.equal(byKey(key), undefined, key);
  // Level markers are passive: what the player uses stays on the Forms.
  for (const key of ['evolution-orbitale', 'transcendance-des-formes', 'presences-apaisantes']) {
    assert.deepEqual(Object.keys(byKey(key).system.activities), [], key);
  }
  const manifestationGrant = advancements('ItemGrant').find(a => a.configuration.items.some(i => i.uuid === itemUuid('manifestation-orbitale')));
  assert.equal(manifestationGrant.configuration.spell.method, 'technique');
  assert.deepEqual(advancements('Subclass').map(a => a.level), [3]);
  assert.deepEqual(advancements('AbilityScoreImprovement').map(a => a.level), [4, 8, 12, 16, 19]);
});

test('proficiencies follow the document', () => {
  const traits = Object.fromEntries(advancements('Trait').map(a => [a._id, a.configuration]));
  const all = Object.values(traits);
  assert.ok(all.some(t => t.grants.includes('saves:con') && t.grants.includes('saves:cha')));
  assert.ok(all.some(t => t.grants.includes('armor:lgt')));
  assert.ok(all.some(t => t.grants.includes('weapon:sim') && t.grants.includes('weapon:mar:rapier')));
  const skills = all.find(t => t.choices.length).choices[0];
  assert.equal(skills.count, 2);
  assert.deepEqual(skills.pool.sort(), ['skills:acr', 'skills:arc', 'skills:ath', 'skills:ins', 'skills:itm', 'skills:per', 'skills:prc', 'skills:sur']);
  assert.equal(cls.system.hd.denomination, 'd8');
});

test('Orbitals: maximum and recovery', () => {
  const orbitals = byKey('orbitals');
  assert.equal(orbitals.system.uses.max, 'max(4, @classes.heliarque.levels + @prof + @abilities.cha.mod)');
  assert.deepEqual(orbitals.system.uses.recovery.map(r => r.period).sort(), ['lr', 'sr']);
  assert.equal(orbitals.system.uses.recovery.find(r => r.period === 'sr').formula, '@scale.heliarque.fusion + @prof');
});

test('Techniques are spells: cost, tier and pool', () => {
  const expected = {
    'propulsion-stellaire': [1, 1], 'egide-vectorielle': [1, 1], 'impact-vectoriel': [1, 1], 'impulsion-forcee': [1, 1],
    'translation-orbitale': [1, 1], 'convergence-stellaire': [2, 1], 'compression-gravitationnelle': [2, 1],
    'reconstitution-structurelle': [1, 1], 'forge-stellaire': [1, 1], 'cartographie-gravitationnelle': [1, 1], 'balise-orbitale': [1, 1],
    'onde-de-resonance': [2, 5], 'vecteur-de-collision': [2, 5], 'acceleration-d-urgence': [2, 5],
    'singularite-relayee': [3, 9], 'flash-photospherique': [3, 9], 'passage-orbital': [2, 9],
    'rail-orbital': [4, 13], 'horizon-evenementiel': [4, 13], 'derivation-structurelle': [3, 13],
    'effondrement-de-constellation': [5, 17], 'reecriture-vectorielle': [5, 17], 'reconfiguration-instantanee': [3, 17]
  };
  const choice = advancements('ItemChoice')[0].configuration;
  assert.equal(choice.type, 'spell');
  assert.equal(choice.restriction.level, 'availableNoCantrips');
  assert.equal(choice.spell.method, 'technique');
  assert.deepEqual(choice.spell.ability, ['cha']);
  const pool = choice.pool.map(p => p.uuid);
  assert.equal(pool.length, 23);
  for (const [key, [cost, level]] of Object.entries(expected)) {
    const item = byKey(key);
    assert.ok(pool.includes(itemUuid(key)), key);
    assert.equal(item.type, 'spell', key);
    assert.equal(item.system.method, 'technique', key);
    assert.equal(item.system.ability, 'cha', key);
    assert.equal(item.system.level, techniqueTier(level), `${key} niveau de sort`);
    assert.equal(meta(item).prerequisite, level, `${key} prérequis`);
    assert.ok(['abj', 'con', 'div', 'evo', 'trs'].includes(item.system.school), key);
    const main = activitiesOf(item)[0];
    const consumption = main.consumption.targets.find(t => t.target === 'feat:orbitals');
    assert.equal(Number(consumption.value), cost, `${key} coût`);
    assert.equal(meta(main).cost, cost, `${key} coût (métadonnées)`);
    assert.equal(main.consumption.spellSlot, false, key);
  }
});

test('spell activities inherit casting time, range, duration and targets unless they differ', () => {
  const pick = (field, data) => {
    if (field === 'target') return JSON.stringify({ template: data.template, affects: data.affects });
    const { override, concentration, ...rest } = data;
    return JSON.stringify(rest);
  };
  for (const item of items.filter(i => i.type === 'spell')) {
    for (const a of activitiesOf(item)) {
      for (const field of ['activation', 'duration', 'range', 'target']) {
        const same = pick(field, a[field]) === pick(field, { ...item.system[field], override: false });
        assert.equal(a[field].override, !same, `${item.name} → ${a.name} → ${field}`);
      }
    }
  }
});

test('Origine orbitale is a permanent passive', () => {
  const origine = byKey('origine-orbitale');
  assert.deepEqual(Object.keys(origine.system.activities), []);
  assert.equal(origine.effects.length, 1);
  assert.equal(origine.effects[0].transfer, true);
  assert.equal(origine.effects[0].duration.units, 'seconds');
  assert.equal(origine.effects[0].duration.value, null);
});

test('Technique tiers follow the prerequisite levels', () => {
  const tiers = Object.fromEntries([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(l => [l, techniqueTier(l)]));
  assert.deepEqual(tiers, { 1: 1, 4: 1, 5: 2, 8: 2, 9: 3, 12: 3, 13: 4, 16: 4, 17: 5, 20: 5 });
});

test('Manifestation orbitale is a summoning spell for the four Forms', () => {
  const manifestation = byKey('manifestation-orbitale');
  assert.equal(manifestation.type, 'spell');
  assert.equal(manifestation.system.level, 0, 'niveau 0 : les profils suivent le niveau de classe');
  assert.equal(manifestation.system.method, 'technique');
  assert.equal(manifestation.system.activation.type, 'bonus');
  const summon = activitiesOf(manifestation).find(a => a.type === 'summon');
  assert.equal(summon.activation.type, 'bonus');
  assert.equal(summon.consumption.targets[0].value, '1');
  // The module sets HP and AC on the persistent Orbital: a native bonus would be added again at every Manifestation.
  assert.equal(summon.bonuses.hp, '');
  assert.equal(summon.bonuses.ac, '');
  // dnd5e moves summon.identifier into visibility.identifier, the class whose level gates the profiles.
  assert.equal(summon.summon.identifier, undefined);
  assert.equal(summon.visibility.identifier, 'heliarque');
  assert.equal(manifestation.system.uses.max, '@scale.heliarque.formes', 'Formes simultanées');
  assert.deepEqual(manifestation.system.uses.recovery, []);
  assert.equal(manifestation.system.target.affects.type, 'space');
  const min = Object.fromEntries(summon.profiles.map(p => [p.name, p.level.min]));
  assert.deepEqual(min, { Satellite: 1, Bastion: 1, Halo: 2, 'Ancre gravitationnelle': 2 });
  for (const actor of actors) {
    assert.equal(actor.system.attributes.hp.max, 5, actor.name);
    assert.deepEqual(actor.system.traits.di.value, ['poison', 'psychic'], actor.name);
    assert.equal(actor.prototypeToken.actorLink, false);
  }
  const bastion = actors.find(a => a.name === 'Bastion');
  assert.equal(bastion.system.attributes.ac.flat, 16);
  assert.deepEqual(bastion.system.traits.dv.value, ['force']);
  assert.ok(!bastion.system.traits.dr.value.includes('force'));
});

test('each Form has Rappel, Changer de forme, a Presence, a Command and a Rupture', () => {
  for (const actor of actors) {
    const names = actor.items.map(i => i.name);
    for (const name of ['Rappel', 'Changer de forme', 'Intégrité']) assert.ok(names.includes(name), `${actor.name} ${name}`);
    const sorts = actor.items.map(i => i.sort);
    assert.deepEqual(sorts, [...sorts].sort((a, b) => a - b), `${actor.name}: ordre`);
    const kinds = actor.items.map(i => meta(i).kind);
    for (const kind of ['presence', 'command', 'rupture']) assert.ok(kinds.includes(kind), `${actor.name} ${kind}`);
    const roles = actor.items.flatMap(activitiesOf).map(a => meta(a)?.role);
    for (const role of ['recall', 'reconfigure', 'command', 'rupture']) assert.ok(roles.includes(role), `${actor.name} ${role}`);
  }
});

test('Form upgrades are gated by level or by Soothing Star', () => {
  for (const actor of actors) {
    for (const item of actor.items.filter(i => meta(i).kind === 'upgrade')) {
      assert.ok([7, 13].includes(meta(item).requires?.level), `${actor.name} → ${item.name}`);
    }
    const soothing = actor.items.filter(i => meta(i).requires?.subclass === 'soothing-star');
    assert.equal(soothing.length, 1, `${actor.name}: une Présence apaisante`);
    assert.equal(meta(soothing[0]).requires.level, 6);
  }
});

test('Soothing Star grants its features at 3, 6, 10 and 14; no Cruel Sun', () => {
  const sub = byKey('soothing-star');
  assert.equal(sub.system.classIdentifier, 'heliarque');
  assert.deepEqual(sub.system.advancement.map(a => a.level), [3, 6, 10, 14]);
  assert.ok(!items.some(i => /cruel/i.test(i.name)));
  assert.deepEqual(byKey('not-yet').system.uses.recovery.map(r => r.period), ['sr']);
  assert.deepEqual(byKey('second-dawn').system.uses.recovery.map(r => r.period), ['lr']);
});

test('movement metadata uses known modes and subjects', () => {
  const all = [...items, ...actors.flatMap(a => a.items)].flatMap(activitiesOf);
  for (const a of all) {
    const move = meta(a)?.move;
    if (!move) continue;
    assert.ok(['away', 'toward', 'line', 'traction', 'free'].includes(move.mode), `${a.name}: ${move.mode}`);
    assert.ok(['targets', 'self', 'this', 'bearer'].includes(move.subject), `${a.name}: ${move.subject}`);
    if (['away', 'toward', 'line', 'traction'].includes(move.mode)) {
      assert.ok(['this', 'self', 'form', 'chosenForm', 'anchorField'].includes(move.from), `${a.name}: origine`);
    }
  }
});
run();
