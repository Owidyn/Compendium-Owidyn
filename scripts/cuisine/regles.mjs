/**
 * Pure rules of the cooking system, without Foundry API: shared by the "Cuisiner" window and the tests.
 * An ingredient unit is { item, identifier, name, family, tag, rarity, danger }, one per piece put in the pot (a stack
 * of 3 put whole gives 3 units). A recipe is { identifier, name, type ('stricte' | 'libre'), tier, dc, tag,
 * slots: [{ family?, tag?, identifier?, name?, count }], base? } where `base` names the tag whose improvised dish it
 * gives, and `tag` the tag whose ingredients make its potency.
 */

export const FAMILIES = {
  viande: 'Viande', poisson: 'Poisson', legume: 'Légume', cereale: 'Céréale', fruit: 'Fruit', champignon: 'Champignon',
  herbe: 'Herbe', laitage: 'Laitage', boisson: 'Boisson'
};
export const TAGS = {
  robuste: 'Robuste', fort: 'Fort', puissant: 'Puissant', ardent: 'Ardent', givre: 'Givré', veloce: 'Véloce',
  apaisant: 'Apaisant', vif: 'Vif', furtif: 'Furtif', eclatant: 'Éclatant', revigorant: 'Revigorant', arcanique: 'Arcanique'
};
/** Tags that spoil each other: a pot holding both makes a dubious dish. */
export const OPPOSITES = { ardent: 'givre', givre: 'ardent', furtif: 'eclatant', eclatant: 'furtif', puissant: 'apaisant', apaisant: 'puissant' };
/** Potency of an ingredient by its dnd5e rarity. */
export const POTENCY = { common: 1, uncommon: 2, rare: 3, veryRare: 4 };
export const RARITY_LABELS = { common: 'Commune', uncommon: 'Peu commune', rare: 'Rare', veryRare: 'Très rare' };
export const TIERS = { commune: 'Commune', 'peu-commune': 'Peu commune', rare: 'Rare' };
export const MAX_POTENCY = 5;
export const MAX_UNITS = 5;
/** DCs of a lone meat or fish, of a combination no recipe knows, and the bonus of a dangerous ingredient to the latter. */
export const DC = { survival: 5, unknown: 12, danger: 2 };

const potencyOf = unit => POTENCY[unit.rarity] ?? 1;
const specificity = slot => (slot.identifier ? 4 : 0) + (slot.tag ? 2 : 0) + (slot.family ? 1 : 0);
const TIER_RANK = { commune: 0, 'peu-commune': 1, rare: 2 };

/** Whether an ingredient unit fills a recipe slot. */
export const fills = (slot, unit) => (!slot.identifier || unit.identifier === slot.identifier)
  && (!slot.family || unit.family === slot.family) && (!slot.tag || unit.tag === slot.tag);

/** The recipe's slots, one per unit needed, most specific first. */
export const slotsOf = recipe => recipe.slots.flatMap(s => Array.from({ length: s.count ?? 1 }, () => s))
  .sort((a, b) => specificity(b) - specificity(a));

/** Indices of distinct units filling each slot of the recipe, or null (backtracking: a pot holds at most 5 units). */
export function assign(recipe, units) {
  const slots = slotsOf(recipe);
  const used = [];
  const walk = i => {
    if (i === slots.length) return true;
    for (let u = 0; u < units.length; u++) {
      if (used.includes(u) || !fills(slots[i], units[u])) continue;
      used.push(u);
      if (walk(i + 1)) return true;
      used.pop();
    }
    return false;
  };
  return walk(0) ? [...used] : null;
}

/** Two opposite tags among the units, or null. */
export function conflict(units) {
  const tags = new Set(units.map(u => u.tag).filter(Boolean));
  for (const tag of tags) if (tags.has(OPPOSITES[tag])) return [tag, OPPOSITES[tag]];
  return null;
}

/** Recipes the units make, best first: strict before free, more ingredients first, then the higher tier. */
export const candidates = (recipes, units) => recipes.filter(r => assign(r, units))
  .sort((a, b) => (b.type === 'stricte') - (a.type === 'stricte') || slotsOf(b).length - slotsOf(a).length
    || (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0));

/** Potency of a dish, 1 to 5: the rarity of the units carrying `tag` (all of them without a tag). */
export function potency(units, tag) {
  const counted = tag ? units.filter(u => u.tag === tag) : units;
  return Math.max(1, Math.min(MAX_POTENCY, counted.reduce((sum, u) => sum + potencyOf(u), 0)));
}

/** A dish formula at its potency, one die per point: "@puissanced6" gives "3d6" at potency 3. */
export const formulaAt = (formula, level) => String(formula).replaceAll('@puissance', String(level));

/** A dish text at its potency: "puissance × d6" gives "3d6" at potency 3. */
export const textAt = (text, level) => String(text ?? '').replace(/puissance × d(\d+)/g, `${level}d$1`);

/** The Élans of a dish at its potency: their number and die ("3d8": three Élans of 1d8; a bare number, Élans of 1d6). */
export function elansAt(formula, level) {
  const [, count, faces] = formulaAt(formula, level).replace(/\s+/g, '').match(/^(\d+)(?:d(\d+))?$/) ?? [];
  return { count: Number(count) || 0, faces: Number(faces) || 6 };
}

/** Highest danger among the units ({ dc, status, seconds }), or null. */
export const dangerOf = units => units.map(u => u.danger).filter(Boolean).sort((a, b) => b.dc - a.dc)[0] ?? null;

/**
 * What the pot makes: { kind, recipe, known, dc, potency, tag, conflict, danger }, `kind` being 'vide' (empty pot),
 * 'douteux' (opposite tags), 'recette' (a recipe, known or not), 'survie' (one meat or fish alone), 'improvise' (no
 * recipe but a tag: the base recipe of the strongest tag, at potency 1) or 'simple' (nothing but plain food).
 */
export function classify(units, recipes, known = new Set()) {
  if (!units.length) return { kind: 'vide' };
  const danger = dangerOf(units);
  const unknownDC = DC.unknown + (danger ? DC.danger : 0);
  const clash = conflict(units);
  if (clash) return { kind: 'douteux', conflict: clash, dc: unknownDC, danger };
  const [recipe] = candidates(recipes, units);
  if (recipe) return { kind: 'recette', recipe, known: known.has(recipe.identifier), dc: recipe.dc, potency: potency(units, recipe.tag), tag: recipe.tag, danger };
  if ((units.length === 1) && ['viande', 'poisson'].includes(units[0].family)) return { kind: 'survie', dc: DC.survival, danger };
  const strength = {};
  for (const u of units) if (u.tag) strength[u.tag] = (strength[u.tag] ?? 0) + potencyOf(u);
  const tag = Object.entries(strength).sort((a, b) => b[1] - a[1])[0]?.[0];
  const base = tag && recipes.find(r => r.base === tag);
  if (base) return { kind: 'improvise', recipe: base, tag, potency: 1, dc: unknownDC, danger };
  return { kind: 'simple', dc: unknownDC, danger };
}

/**
 * Result of the cooking check: 'delicieux' (natural 20 or DC beaten by 10), 'reussite', 'echec' (missed by less than
 * 5: the dish has a taste flaw) or 'rate' (missed by 5 or more: two flaws).
 */
export function outcome(total, natural, dc) {
  if ((natural === 20) || (total >= dc + 10)) return 'delicieux';
  if (total >= dc) return 'reussite';
  if (total > dc - 5) return 'echec';
  return 'rate';
}

/** Taste flaws of a missed dish, by result of the cooking check. */
export const FLAWS = { echec: 1, rate: 2 };

/** Successes with a recipe that master it, and the bonus a mastered recipe gives to its cooking checks. */
export const MASTERY = { successes: 5, bonus: 1 };

/** Cooking check bonus of a recipe the cook has made successfully `count` times. */
export const masteryBonus = count => ((count ?? 0) >= MASTERY.successes ? MASTERY.bonus : 0);

/** Result of the eater's Constitution save against a dish's flaws: 'parfait' (natural 20 or DC beaten by 5), 'reussi' or 'rate'. */
export function saveResult(total, natural, dc) {
  if ((natural === 20) || (total >= dc + 5)) return 'parfait';
  return total >= dc ? 'reussi' : 'rate';
}

/**
 * What the eater gets from a dish with `count` flaws after the save: whether the dish keeps its effect, and how many
 * flaws apply. One flaw: a success keeps the effect despite the flaw, a perfect save avoids the flaw. Two flaws: the
 * effect is lost, a success avoids one flaw and a perfect save both.
 */
export function afterSave(count, result) {
  if (!count) return { bonus: true, flaws: 0 };
  const saved = { rate: 0, reussi: 1, parfait: 2 }[result] ?? 0;
  if (count === 1) return { bonus: saved > 0, flaws: saved > 1 ? 0 : 1 };
  return { bonus: false, flaws: Math.max(count - saved, 0) };
}

/** Servings of a dish: the cook's Proficiency Bonus, 2 more for a Master Chef, plus `extra` (points of potency, or a delicious special dish). */
export const servings = (proficiency, { masterChef = false, extra = 0 } = {}) => proficiency + (masterChef ? 2 : 0) + extra;

/** The most dice a dish rolls: its potency, up to the cook's Proficiency Bonus. */
export const mostDice = (potency, proficiency) => Math.max(1, Math.min(potency, proficiency));

/**
 * How a dish spends its potency: the first point makes its effect, each other one gives a die or a portion more, up to
 * as many dice as the cook's Proficiency Bonus. `dice` is the cook's choice (the most by default); a dish without dice
 * (`rolls` false) turns all its other points into portions. Returns { dice, portions }, the portions on top of servings().
 */
export function share(potency, proficiency, { rolls = true, dice = Infinity } = {}) {
  if (!rolls) return { dice: 0, portions: Math.max(potency - 1, 0) };
  const kept = Math.max(1, Math.min(dice, mostDice(potency, proficiency)));
  return { dice: kept, portions: potency - kept };
}

/**
 * Pieces to take from the stock for a recipe: stock is [{ item, identifier, name, family, tag, rarity, quantity }];
 * the most specific slots are filled first, from the commonest and then the most plentiful stack. Returns the item ids
 * of the units (one per piece) and the slots left unfilled.
 */
export function autoSelect(recipe, stock) {
  const left = stock.map(s => ({ ...s, left: s.quantity ?? 1 }));
  const units = [];
  const missing = [];
  for (const slot of slotsOf(recipe)) {
    const pick = left.filter(s => (s.left > 0) && fills(slot, s))
      .sort((a, b) => (potencyOf(a) - potencyOf(b)) || (b.left - a.left))[0];
    if (pick) {
      pick.left--;
      units.push(pick.item);
    } else missing.push(slot);
  }
  return { units, missing };
}

/** Label of a slot ("2 × Viande", "1 Viande Robuste", "1 ingrédient Ardent", "Bœuf"). */
export function slotLabel(slot, count = slot.count ?? 1) {
  const what = slot.identifier ? (slot.name ?? slot.identifier)
    : [slot.family ? FAMILIES[slot.family] : 'ingrédient', slot.tag ? TAGS[slot.tag] : ''].filter(Boolean).join(' ');
  if (count > 1) return `${count} × ${what}`;
  return slot.identifier ? what : `1 ${what}`;
}

/** Missing slots grouped by kind, as labels ("Manque : 2 × Viande, Vin de Croydon"). */
export function missingLabels(missing) {
  const groups = new Map();
  for (const slot of missing) {
    const key = JSON.stringify([slot.identifier ?? '', slot.family ?? '', slot.tag ?? '']);
    groups.set(key, { slot, count: (groups.get(key)?.count ?? 0) + 1 });
  }
  return [...groups.values()].map(({ slot, count }) => slotLabel(slot, count));
}
