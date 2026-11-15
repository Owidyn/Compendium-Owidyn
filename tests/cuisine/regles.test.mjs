// Run with: node tests/cuisine/regles.test.mjs
// Regression checks of the cooking rules; the window, the dishes and their effects need a Foundry test.
import assert from 'node:assert/strict';
import { classify, outcome, servings, autoSelect, missingLabels, potency, candidates, saveResult, afterSave, formulaAt, textAt, elansAt, masteryBonus, mostDice, share, DC, FLAWS } from '../../scripts/cuisine/regles.mjs';

const unit = (identifier, family, tag = null, rarity = 'common', danger = null) => ({ item: identifier, identifier, name: identifier, family, tag, rarity, danger });
const BOEUF = unit('boeuf', 'viande', 'robuste');
const CROYDON = unit('vin-de-croydon', 'boisson', 'fort', 'uncommon');
const NAVET = unit('legumes', 'legume');
const BRAISE = unit('braise-blanche', 'herbe', 'ardent', 'uncommon');
const GIVRE = unit('menthe-de-givre', 'herbe', 'givre');

const RECIPES = [
  { identifier: 'ragout-du-voyageur', name: 'Ragoût du voyageur', type: 'libre', tier: 'commune', dc: 10, tag: 'robuste', base: 'robuste',
    slots: [{ family: 'viande' }, { family: 'legume' }, { tag: 'robuste' }] },
  { identifier: 'boeuf-croydon', name: 'Bœuf Croydon', type: 'stricte', tier: 'peu-commune', dc: 14, tag: 'robuste',
    slots: [{ identifier: 'boeuf', name: 'Bœuf' }, { identifier: 'vin-de-croydon', name: 'Vin de Croydon' }, { family: 'legume' }] },
  { identifier: 'soupe-de-braise', name: 'Soupe de braise', type: 'libre', tier: 'commune', dc: 10, tag: 'ardent', base: 'ardent',
    slots: [{ family: 'legume' }, { tag: 'ardent' }] }
];

const cases = [];
const test = (name, run) => cases.push({ name, run });

test('a strict recipe wins over a free one the same ingredients also make', () => {
  const units = [BOEUF, CROYDON, NAVET];
  assert.deepEqual(candidates(RECIPES, units).map(r => r.identifier), ['boeuf-croydon']);
  const pot = classify(units, RECIPES, new Set(['boeuf-croydon']));
  assert.equal(pot.kind, 'recette');
  assert.equal(pot.recipe.identifier, 'boeuf-croydon');
  assert.equal(pot.known, true);
  assert.equal(pot.dc, 14);
  // Without the wine, the beef fills the Robuste slot of the free stew: the Ragoût du voyageur, unknown here
  const stew = classify([BOEUF, unit('poulet', 'viande'), NAVET], RECIPES);
  assert.equal(stew.kind, 'recette');
  assert.equal(stew.recipe.identifier, 'ragout-du-voyageur');
  assert.equal(stew.known, false);
  // A piece fills one slot only: a beef and a vegetable lack the stew's third ingredient
  assert.equal(classify([BOEUF, NAVET], RECIPES).kind, 'improvise');
});

test('opposite tags make a dubious dish, a lone meat a survival grill, a lone tag an improvised dish', () => {
  assert.equal(classify([BRAISE, GIVRE, NAVET], RECIPES).kind, 'douteux');
  assert.deepEqual(classify([BOEUF], RECIPES), { kind: 'survie', dc: DC.survival, danger: null });
  const improvised = classify([BRAISE], RECIPES);
  assert.equal(improvised.kind, 'improvise');
  assert.equal(improvised.recipe.identifier, 'soupe-de-braise');
  assert.equal(improvised.potency, 1);
  assert.equal(classify([NAVET], RECIPES).kind, 'simple');
  assert.equal(classify([], RECIPES).kind, 'vide');
});

test('potency adds the rarity of the tagged ingredients, up to 5; a dangerous one raises the unknown DC', () => {
  assert.equal(potency([BOEUF, CROYDON, NAVET], 'robuste'), 1);
  assert.equal(potency([BRAISE, BRAISE, unit('x', 'herbe', 'ardent', 'rare')], 'ardent'), 5, 'capped at 5');
  const toxic = unit('herbe-toxique', 'herbe', 'ardent', 'rare', { dc: 15, status: 'unconscious', seconds: 3600 });
  const pot = classify([toxic], RECIPES);
  assert.equal(pot.kind, 'improvise');
  assert.equal(pot.dc, DC.unknown + DC.danger);
  assert.deepEqual(pot.danger, toxic.danger);
});

test('the check is delicious on a natural 20 or 10 over the DC, one flaw when missed by less than 5, two beyond', () => {
  assert.equal(outcome(22, 12, 12), 'delicieux');
  assert.equal(outcome(9, 20, 12), 'delicieux');
  assert.equal(outcome(12, 5, 12), 'reussite');
  assert.equal(outcome(8, 5, 12), 'echec');
  assert.equal(outcome(7, 5, 12), 'rate');
  assert.equal(FLAWS[outcome(8, 5, 12)], 1);
  assert.equal(FLAWS[outcome(7, 5, 12)], 2);
  assert.equal(FLAWS[outcome(12, 5, 12)], undefined);
  assert.equal(servings(3), 3);
  assert.equal(servings(3, { masterChef: true, extra: 1 }), 6);
});

test('the save against one flaw keeps the effect, a perfect one avoids the flaw; against two it avoids one or both', () => {
  assert.equal(saveResult(17, 10, 12), 'parfait');
  assert.equal(saveResult(5, 20, 12), 'parfait');
  assert.equal(saveResult(12, 8, 12), 'reussi');
  assert.equal(saveResult(11, 8, 12), 'rate');
  assert.deepEqual(afterSave(1, 'rate'), { bonus: false, flaws: 1 });
  assert.deepEqual(afterSave(1, 'reussi'), { bonus: true, flaws: 1 });
  assert.deepEqual(afterSave(1, 'parfait'), { bonus: true, flaws: 0 });
  assert.deepEqual(afterSave(2, 'rate'), { bonus: false, flaws: 2 });
  assert.deepEqual(afterSave(2, 'reussi'), { bonus: false, flaws: 1 });
  assert.deepEqual(afterSave(2, 'parfait'), { bonus: false, flaws: 0 });
  assert.deepEqual(afterSave(0, 'rate'), { bonus: true, flaws: 0 }, 'a dish without flaw needs no save');
});

test('the bonuses of a dish roll one die per point of potency', () => {
  assert.equal(formulaAt('@puissanced6', 3), '3d6');
  assert.equal(formulaAt('2 * @puissance', 3), '2 * 3', 'the flat formulas of dishes cooked before still work');
  assert.equal(textAt('Tu gagnes puissance × d8 PV temporaires et une réserve d’Élans de puissance × d6.', 2),
    'Tu gagnes 2d8 PV temporaires et une réserve d’Élans de 2d6.');
  assert.deepEqual(elansAt('@puissanced8', 3), { count: 3, faces: 8 });
  assert.deepEqual(elansAt('2d8', 5), { count: 2, faces: 8 }, 'a fixed reserve ignores the potency');
  assert.deepEqual(elansAt('@puissance', 4), { count: 4, faces: 6 }, 'the Élans of dishes cooked before stay 1d6');
});

test('picking a recipe takes the commonest stacks first and names what is missing', () => {
  const stock = [
    { ...BOEUF, item: 'b1', quantity: 2 }, { ...unit('navet', 'legume'), item: 'n1', quantity: 1 },
    { ...unit('carotte-rare', 'legume', null, 'rare'), item: 'n2', quantity: 4 }
  ];
  const { units, missing } = autoSelect(RECIPES[1], stock);
  assert.deepEqual(units.sort(), ['b1', 'n1']);
  assert.deepEqual(missingLabels(missing), ['Vin de Croydon']);
  const many = autoSelect({ slots: [{ family: 'viande', count: 3 }, { tag: 'ardent' }] }, stock);
  assert.deepEqual(missingLabels(many.missing), ['1 ingrédient Ardent', '1 Viande'], 'the two beefs fill two of the three meats');
});

test('a recipe made successfully five times gives +1 to its cooking checks', () => {
  assert.equal(masteryBonus(undefined), 0, 'a recipe never cooked');
  assert.equal(masteryBonus(4), 0);
  assert.equal(masteryBonus(5), 1, 'the fifth success masters it');
  assert.equal(masteryBonus(12), 1, 'the bonus stays +1');
});

test('a dish spends its potency on dice up to the cook\'s Proficiency Bonus, then on portions', () => {
  assert.deepEqual(share(4, 2), { dice: 2, portions: 2 }, 'level 1: two dice at most, the rest in portions');
  assert.deepEqual(share(4, 2, { dice: 1 }), { dice: 1, portions: 3 }, 'the cook may trade a die for a portion');
  assert.deepEqual(share(4, 3), { dice: 3, portions: 1 });
  assert.deepEqual(share(4, 5), { dice: 4, portions: 0 }, 'no more dice than points');
  assert.deepEqual(share(4, 2, { dice: 0 }), { dice: 1, portions: 3 }, 'the first point is always the effect');
  assert.deepEqual(share(6, 6), { dice: 6, portions: 0 }, 'a delicious dish of potency 5 at level 17');
  assert.deepEqual(share(1, 2), { dice: 1, portions: 0 });
  assert.deepEqual(share(3, 2, { rolls: false }), { dice: 0, portions: 2 }, 'a dish without dice turns its other points into portions');
  assert.deepEqual(share(1, 2, { rolls: false }), { dice: 0, portions: 0 });
  assert.equal(mostDice(5, 2), 2);
  assert.equal(servings(2, { extra: share(4, 2).portions }), 4);
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} cooking checks passed.`);
if (failures) process.exitCode = 1;
