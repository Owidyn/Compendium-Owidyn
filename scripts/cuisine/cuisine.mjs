/**
 * Cuisine d'Aldraine.
 * The feats Cuisinier and Master Chef open the "Cuisiner" window (their activity, or the sheet's header button): it
 * reads the ingredients of the inventory, tells whether the pot holds a known recipe and its effect, picks the
 * ingredients of a known recipe, rolls the Cook's Utensils check and creates the dish from its recipe (Items
 * compendium, Cuisine folder). Eating a dish applies its meal effect (until the next Long Rest, replacing the previous
 * meal) and rolls its bonuses: Temporary Hit Points, Élans, Hit Points at the end of the next Short Rest. The first
 * point of potency makes the effect of a dish, each other one a die (up to the cook's Proficiency Bonus) or a portion
 * more, as the cook chooses. A missed dish hides taste flaws behind a Constitution save. The check gains +1 for a recipe made
 * successfully five times, and the bonus of the cook's best Cook's Utensils (the master ones give +1). Recipe books
 * teach their recipes to a cook who studies them. The rules themselves are in regles.mjs.
 */
import { MODULE_ID, PACKS } from '../owidyn/compendiums.mjs';
import { FAMILIES, TAGS, TIERS, RARITY_LABELS, MAX_UNITS, FLAWS, MASTERY, classify, outcome, saveResult, afterSave, servings, mostDice, share, autoSelect, missingLabels, slotsOf, formulaAt, textAt, elansAt, masteryBonus } from './regles.mjs';

const FLAG = 'cuisine';
const COOK = 'cuisinier';
const MASTER = 'master-chef';
const STARTER_COUNT = 3;
const VERDICTS = { delicieux: 'Délicieux !', reussite: 'Réussi', echec: 'Raté de peu', rate: 'Raté' };
const SPECIALS = { survie: 'grillade-de-survie', douteux: 'plat-douteux', simple: 'repas-simple' };
/** The item holding the taste flaws, one numbered effect each. */
const FLAW_TABLE = 'defauts-de-gout';

/** Client setting of the window: the ingredients on two columns, grouped by family. */
const LAYOUT = 'cuisineAffichage';
const layout = () => ({ colonnes: false, familles: false, ...(game.settings.get(MODULE_ID, LAYOUT) ?? {}) });

const flagOf = doc => doc?.getFlag?.(MODULE_ID, FLAG) ?? doc?.flags?.[MODULE_ID]?.[FLAG] ?? {};
const featOf = (actor, identifier) => actor?.items.find(i => (i.type === 'feat') && (i.system.identifier === identifier));
const isCook = actor => Boolean(featOf(actor, COOK) || featOf(actor, MASTER));
const knownOf = actor => new Set(actor.getFlag(MODULE_ID, `${FLAG}.recettes`) ?? []);
/** Successes of the actor with each recipe, by identifier. */
const masteryOf = actor => actor.getFlag(MODULE_ID, `${FLAG}.maitrise`) ?? {};
/** Bonus of the actor's best Cook's Utensils. */
const utensilsOf = actor => Math.max(0, ...actor.itemTypes.tool.filter(t => t.system.type?.baseItem === 'cook')
  .map(t => dnd5e.utils.simplifyBonus(t.system.bonus, actor.getRollData())));
/** Bonuses to the cooking check of a pot: its recipe once mastered (`count`: successes with it), and the utensils. */
function checkBonuses(actor, pot) {
  const count = pot.kind === 'recette' ? (masteryOf(actor)[pot.recipe.identifier] ?? 0) : null;
  return { count, mastery: masteryBonus(count), utensils: utensilsOf(actor) };
}
const masteryLabel = count => count >= MASTERY.successes ? `recette maîtrisée +${MASTERY.bonus}` : `maîtrise ${count}/${MASTERY.successes}`;
const escape = value => foundry.utils.escapeHTML(String(value ?? ''));

/* -------------------------------------------- */
/*  Catalogue                                   */
/* -------------------------------------------- */

let catalogue = null;

/** Recipes, special dishes and books of the Items compendium, read once from its index. */
async function loadCatalogue() {
  if (catalogue) return catalogue;
  const pack = game.packs.get(`${MODULE_ID}.${PACKS.items}`);
  const index = await pack.getIndex({ fields: [`flags.${MODULE_ID}.${FLAG}`, 'system.identifier'] });
  const recipes = [];
  const specials = {};
  const books = {};
  for (const entry of index) {
    const data = entry.flags?.[MODULE_ID]?.[FLAG] ?? {};
    if (data.recette) recipes.push({ ...data.recette, name: entry.name, img: entry.img, uuid: entry.uuid });
    else if (data.special) specials[data.special] = entry.uuid;
    else if (data.livre) books[data.livre.identifier] = { ...data.livre, name: entry.name, uuid: entry.uuid };
  }
  catalogue = { recipes, specials, books };
  return catalogue;
}

/** The ingredients of an actor's inventory, one entry per stack. */
const stockOf = actor => actor.items.filter(i => flagOf(i).ingredient).map(i => ({
  item: i.id, identifier: i.system.identifier, name: i.name, img: i.img, rarity: i.system.rarity || 'common',
  quantity: i.system.quantity ?? 1, ...flagOf(i).ingredient
}));

/** Adds recipes to the actor's notebook and returns the new ones. */
async function learn(actor, identifiers) {
  const known = knownOf(actor);
  const added = identifiers.filter(identifier => !known.has(identifier));
  if (added.length) await actor.setFlag(MODULE_ID, `${FLAG}.recettes`, [...known, ...added]);
  return added;
}

/** Counts a success with a recipe and returns whether it has just been mastered. */
async function addSuccess(actor, identifier) {
  const count = (masteryOf(actor)[identifier] ?? 0) + 1;
  await actor.setFlag(MODULE_ID, `${FLAG}.maitrise.${identifier}`, count);
  return count === MASTERY.successes;
}

/* -------------------------------------------- */
/*  Fenêtre                                     */
/* -------------------------------------------- */

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

class CuisineApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super({ id: `owidyn-cuisine-${actor.id}`, ...options });
    this.actor = actor;
    /** Item ids of the pieces in the pot, one per piece. */
    this.pot = [];
    this.missing = [];
    this.selected = null;
    this.encas = false;
    this.starter = new Set();
  }

  static DEFAULT_OPTIONS = {
    classes: ['owidyn-cuisine'],
    tag: 'div',
    window: { title: 'Cuisiner', icon: 'fa-solid fa-utensils', resizable: true },
    position: { width: 1040, height: 'auto' },
    actions: {
      addIngredient: CuisineApp.#onAdd,
      removeUnit: CuisineApp.#onRemove,
      clearPot: CuisineApp.#onClear,
      pickRecipe: CuisineApp.#onPick,
      cook: CuisineApp.#onCook,
      toggleStarter: CuisineApp.#onToggleStarter,
      confirmStarter: CuisineApp.#onConfirmStarter,
      toggleColumns: CuisineApp.#onToggleLayout,
      toggleFamilies: CuisineApp.#onToggleLayout
    }
  };

  static PARTS = { main: { template: `modules/${MODULE_ID}/templates/cuisine/cuisiner.hbs` } };

  get title() {
    return `Cuisiner — ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const { recipes } = await loadCatalogue();
    const known = knownOf(this.actor);
    const stock = stockOf(this.actor);
    this.pot = this.pot.filter(id => stock.some(s => s.item === id));
    const units = this.pot.map(id => stock.find(s => s.item === id));
    const used = id => this.pot.filter(p => p === id).length;
    const pot = classify(units, recipes, known);
    const bonuses = checkBonuses(this.actor, pot);
    const feat = featOf(this.actor, COOK);
    const usesLeft = feat?.system.uses?.max ? feat.system.uses.value : null;
    const starters = recipes.filter(r => r.depart).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const describe = r => ({
      identifier: r.identifier, name: r.name, img: r.img, effet: r.effet, dc: r.dc, tier: TIERS[r.tier], region: r.region,
      type: r.type === 'stricte' ? 'Stricte' : 'Libre', ingredients: missingLabels(slotsOf(r)).join(', ')
    });
    return {
      ...context,
      starterMode: Boolean(feat) && !known.size,
      starter: [['libre', 'Recettes libres'], ['stricte', 'Recettes strictes']].map(([type, label]) => ({
        label, recipes: starters.filter(r => r.type === type).map(r => ({ ...describe(r), chosen: this.starter.has(r.identifier) }))
      })).filter(group => group.recipes.length),
      starterCount: this.starter.size,
      starterReady: this.starter.size === STARTER_COUNT,
      recipes: recipes.filter(r => known.has(r.identifier)).sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(r => {
        const missing = missingLabels(autoSelect(r, stock).missing);
        return { ...describe(r), missing: missing.join(', '), ready: !missing.length, selected: this.selected === r.identifier };
      }),
      stockCount: stock.length,
      stockGroups: groups(stock.sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(s => ({
        ...s, familyKey: s.family, left: s.quantity - used(s.item), family: FAMILIES[s.family], tag: s.tag ? TAGS[s.tag] : '', rarityLabel: RARITY_LABELS[s.rarity] ?? s.rarity,
        dangerous: Boolean(s.danger), disabled: (s.quantity - used(s.item) <= 0) || (this.pot.length >= MAX_UNITS)
      }))),
      layout: layout(),
      pot: units.map((u, index) => ({ index, name: u.name, img: u.img })),
      slots: MAX_UNITS,
      missing: this.missing.join(', '),
      preview: { ...preview(pot, this.actor.system.attributes?.prof ?? 2), mastery: pot.known ? masteryLabel(bonuses.count) : '' },
      utensils: bonuses.utensils,
      dangerous: Boolean(pot.danger),
      usesLeft,
      canCook: units.length > 0 && (usesLeft === null || usesLeft > 0),
      masterChef: Boolean(featOf(this.actor, MASTER)),
      encas: this.encas
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelector('input[name="encas"]')?.addEventListener('change', event => { this.encas = event.currentTarget.checked; });
  }

  static #onAdd(event, target) {
    if (this.pot.length >= MAX_UNITS) return;
    this.pot.push(target.dataset.item);
    this.selected = null;
    this.missing = [];
    this.render();
  }

  static #onRemove(event, target) {
    this.pot.splice(Number(target.dataset.index), 1);
    this.selected = null;
    this.missing = [];
    this.render();
  }

  static #onClear() {
    this.pot = [];
    this.selected = null;
    this.missing = [];
    this.render();
  }

  static async #onPick(event, target) {
    const { recipes } = await loadCatalogue();
    const recipe = recipes.find(r => r.identifier === target.dataset.recipe);
    if (!recipe) return;
    const { units, missing } = autoSelect(recipe, stockOf(this.actor));
    this.pot = units.slice(0, MAX_UNITS);
    this.missing = missingLabels(missing);
    this.selected = recipe.identifier;
    this.render();
  }

  static async #onCook() {
    const pot = [...this.pot];
    this.pot = [];
    this.selected = null;
    this.missing = [];
    await cook(this.actor, pot, { encas: this.encas });
    this.render();
  }

  static async #onToggleLayout(event, target) {
    const key = target.dataset.action === 'toggleColumns' ? 'colonnes' : 'familles';
    const current = layout();
    await game.settings.set(MODULE_ID, LAYOUT, { ...current, [key]: !current[key] });
    this.render();
  }

  static #onToggleStarter(event, target) {
    const identifier = target.dataset.recipe;
    if (this.starter.has(identifier)) this.starter.delete(identifier);
    else if (this.starter.size < STARTER_COUNT) this.starter.add(identifier);
    this.render();
  }

  static async #onConfirmStarter() {
    if (this.starter.size !== STARTER_COUNT) return;
    await learn(this.actor, [...this.starter]);
    this.render();
  }
}

/** The ingredients as groups: one per family in their order when the window groups them, else a single one. */
function groups(stock) {
  if (!layout().familles) return [{ label: '', items: stock }];
  return Object.entries(FAMILIES).map(([key, label]) => ({ label, items: stock.filter(s => s.familyKey === key) })).filter(g => g.items.length);
}

/** How a dish spends its potency: "2 dés, +2 portions", "3 dés", "+1 portion". */
const spentLabel = (dice, portions) => [dice ? `${dice} dé${dice > 1 ? 's' : ''}` : '', portions ? `+${portions} portion${portions > 1 ? 's' : ''}` : '']
  .filter(Boolean).join(', ');
/** "puissance 4 : 2 dés, +2 portions" ("puissance 1" for a dish without dice that has no other point). */
const potencyLabel = (potency, { dice, portions }) => [`puissance ${potency}`, spentLabel(dice, portions)].filter(Boolean).join(' : ');

/** What the window shows of the pot: a known recipe and its effect (with the most dice the cook can give it), the survival grill, or "Inconnue". */
function preview(pot, proficiency) {
  if (pot.kind === 'vide') return { empty: true, label: 'La marmite est vide.' };
  if ((pot.kind === 'recette') && pot.known) {
    const { dice, portions } = share(pot.potency, proficiency, { rolls: Boolean(pot.recipe.des) });
    return { label: pot.recipe.name, effet: textAt(pot.recipe.effet, dice), dc: pot.dc, potency: pot.potency, spent: spentLabel(dice, portions), known: true };
  }
  if (pot.kind === 'survie') return { label: 'Grillade de survie', effet: 'Elle nourrit comme une ration.', dc: pot.dc, known: true };
  return { label: 'Inconnue', effet: 'Personne ne sait ce que donnera ce mélange.', unknown: true };
}

/** Opens the cooking window of an actor whose user owns it. */
function open(actor) {
  if (!actor?.isOwner) return;
  if (!isCook(actor)) return ui.notifications.warn(`${actor.name} n'a pas le don Cuisinier ou Master Chef.`);
  const existing = foundry.applications.instances.get(`owidyn-cuisine-${actor.id}`);
  return (existing ?? new CuisineApp(actor)).render({ force: true });
}

/* -------------------------------------------- */
/*  Cuisson                                     */
/* -------------------------------------------- */

/** Cooks the pieces of the pot: the check, then the ingredients spent, the dish created and the chat message. */
async function cook(actor, pot, { encas = false } = {}) {
  const { recipes, specials } = await loadCatalogue();
  const stock = stockOf(actor);
  const units = pot.map(id => stock.find(s => s.item === id)).filter(Boolean);
  if (!units.length) return;
  const feat = featOf(actor, COOK);
  if (feat?.system.uses?.max && !(feat.system.uses.value > 0)) {
    return ui.notifications.warn('Tu as déjà cuisiné depuis ton dernier repos (Cuisine de camp).');
  }
  const master = Boolean(featOf(actor, MASTER));
  const known = knownOf(actor);
  const pot$ = classify(units, recipes, known);
  const { mastery, utensils } = checkBonuses(actor, pot$);
  const bonus = mastery + utensils;
  const extras = [mastery ? `recette maîtrisée +${mastery}` : '', utensils ? `ustensiles +${utensils}` : ''].filter(Boolean);
  const rolls = await actor.rollToolCheck({ tool: 'cook', target: pot$.dc, advantage: master, ...(bonus ? { bonus } : {}) }, {},
    { data: { flavor: extras.length ? `Cuisine (${extras.join(', ')})` : 'Cuisine' } });
  const roll = rolls?.[0];
  if (!roll) return;
  const verdict = outcome(roll.total, roll.isCritical ? 20 : roll.d20?.total, pot$.dc);
  const success = ['delicieux', 'reussite'].includes(verdict);

  // A missed dish is still the dish of the pot, with one or two taste flaws; only a success discovers its recipe
  let template;
  let name = null;
  let discovered = null;
  if ((pot$.kind === 'recette') || (pot$.kind === 'improvise')) {
    template = pot$.recipe.uuid;
    if (pot$.kind === 'improvise') name = `Plat improvisé (${TAGS[pot$.tag]})`;
    else if (success && !pot$.known) discovered = pot$.recipe;
  } else template = specials[SPECIALS[pot$.kind]];
  const flaws = FLAWS[verdict] ? await drawFlaws(FLAWS[verdict], master) : [];

  // The potency makes the effect of the dish, then gives dice or portions (the cook's choice); a delicious dish has one
  // point more (a special dish, one portion more), and a ruined one, which loses its effect, gives no portion more
  const proficiency = actor.system.attributes?.prof ?? 2;
  const base = servings(proficiency, { masterChef: master });
  let potency = pot$.potency ?? null;
  let spent = { dice: 0, portions: (verdict === 'delicieux') ? 1 : 0 };
  if (potency !== null) {
    if (verdict === 'delicieux') potency += 1;
    const hasDice = Boolean(pot$.recipe.des);
    const most = hasDice ? mostDice(potency, proficiency) : 0;
    const dice = ((most > 1) && (verdict !== 'rate')) ? await askDice(name ?? pot$.recipe.name, potency, most, base) : most;
    spent = share(potency, proficiency, { rolls: hasDice, dice });
    if (verdict === 'rate') spent.portions = 0;
  }

  await spendIngredients(actor, units);
  if (feat?.system.uses?.max) await feat.update({ 'system.uses.spent': feat.system.uses.spent + 1 });
  const source = await fromUuid(template);
  if (!source) return ui.notifications.error('Cuisine : recette introuvable dans le compendium Items.');
  const count = base + spent.portions;
  const data = dishData(source, { name, potency, spent, count, encas, master, cook: actor, danger: success ? null : pot$.danger, flaws, dc: pot$.dc });
  await actor.createEmbeddedDocuments('Item', [data]);
  if (discovered) await learn(actor, [discovered.identifier]);
  const mastered = success && (pot$.kind === 'recette') && await addSuccess(actor, pot$.recipe.identifier);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${escape(VERDICTS[verdict])}</strong> ${escape(actor.name)} cuisine <strong>${escape(data.name)}</strong> × ${count}`
      + `${((potency !== null) && (verdict !== 'rate')) ? ` (${potencyLabel(potency, spent)})` : ''}.</p>`
      + (discovered ? `<p><em>Nouvelle recette : ${escape(discovered.name)} !</em></p>` : '')
      + (mastered ? `<p><em>Recette maîtrisée : +${MASTERY.bonus} à ses tests de cuisine.</em></p>` : '')
  });
}

/** Asks the cook how many dice the dish rolls, its other points of potency becoming portions (the most dice by default). */
async function askDice(name, potency, most, base) {
  const options = Array.from({ length: most }, (_, i) => most - i)
    .map(dice => `<option value="${dice}">${dice} dé${dice > 1 ? 's' : ''} et ${base + potency - dice} portions</option>`).join('');
  const dice = await DialogV2.wait({
    window: { title: `${name} — puissance ${potency}` },
    content: '<p>Le premier point de puissance fait l’effet du plat. Chaque autre point lui donne un dé ou une portion de plus.</p>'
      + `<div class="form-group"><label>Répartition</label><div class="form-fields"><select name="des">${options}</select></div></div>`,
    rejectClose: false,
    buttons: [{ action: 'ok', label: 'Valider', icon: 'fa-solid fa-check', default: true, callback: (event, button) => Number(button.form.elements.des.value) }]
  });
  return Number(dice) || most;
}

/** Removes one piece per unit of the pot from the inventory. */
async function spendIngredients(actor, units) {
  const counts = new Map();
  for (const unit of units) counts.set(unit.item, (counts.get(unit.item) ?? 0) + 1);
  const updates = [];
  const deletions = [];
  for (const [id, used] of counts) {
    const item = actor.items.get(id);
    const left = (item?.system.quantity ?? 0) - used;
    if (left > 0) updates.push({ _id: id, 'system.quantity': left });
    else if (item) deletions.push(id);
  }
  if (updates.length) await actor.updateEmbeddedDocuments('Item', updates);
  if (deletions.length) await actor.deleteEmbeddedDocuments('Item', deletions);
}

/**
 * Data of a cooked dish, from its recipe or special dish: portions, potency and how it was spent (`spent`: its dice and
 * portions), snack form, taste flaws, and who cooked it.
 */
function dishData(source, { name, potency, spent, count, encas, master, cook: actor, danger, flaws = [], dc = null }) {
  const data = source.toObject();
  delete data._id;
  delete data.folder;
  data.sort = 0;
  data._stats = { compendiumSource: source.uuid };
  const flags = data.flags[MODULE_ID][FLAG];
  const recipe = flags.recette ?? {};
  delete flags.recette;
  flags.plat = {
    recette: recipe.identifier ?? null, special: flags.special ?? null, puissance: potency, des: spent.dice || null, temphp: recipe.temphp ?? null,
    elans: recipe.elans ?? null, soin: recipe.soin ?? null, risque: recipe.risque ?? null, danger, masterChef: master, encas,
    cuisinier: actor.name, defauts: flaws.map(f => f.n), dd: dc
  };
  delete flags.special;
  // The flaws show as tastes in the name ("Poulet rôti à l’ail (trop salé)"); their penalties stay hidden until eaten
  const tastes = flaws.map(f => f.label.charAt(0).toLowerCase() + f.label.slice(1)).join(', ');
  let dish = name ?? data.name;
  if (tastes) dish = dish.endsWith(')') ? `${dish.slice(0, -1)}, ${tastes})` : `${dish} (${tastes})`;
  data.name = encas ? `En-cas : ${dish}` : dish;
  data.system.quantity = count;
  // The dice of the dish show in full ("puissance × d6" is "2d6" for a dish of two dice)
  for (const effect of data.effects) {
    for (const change of effect.system?.changes ?? []) change.value = formulaAt(change.value, spent.dice);
    effect.description = textAt(effect.description, spent.dice);
    if (encas && effect.flags?.[MODULE_ID]?.[FLAG]?.repas) {
      effect.duration = { value: 3600, units: 'seconds', expiry: 'turnStart', expired: false };
      effect.flags[MODULE_ID][FLAG].repas.slot = 'encas';
    }
  }
  if (encas) for (const activity of Object.values(data.system.activities ?? {})) activity.activation = { type: 'bonus', value: null, override: false, condition: '' };
  const label = recipe.identifier ? potencyLabel(potency, spent) : '';
  const head = [label.charAt(0).toUpperCase() + label.slice(1), `Cuisiné par ${escape(actor.name)}`, encas ? 'En-cas : se mange en Bonus Action, effet de 1 heure' : '']
    .filter(Boolean).join(' · ');
  data.system.description.value = `<p><em>${head}</em></p>${flawNote(tastes, flaws.length, dc)}${textAt(data.system.description.value, spent.dice)}`;
  return data;
}

/** What a missed dish says of its flaws and of the save of whoever eats it. */
function flawNote(tastes, count, dc) {
  if (!count) return '';
  const save = `Qui en mange fait un jet de sauvegarde de Constitution DD ${dc}`;
  return count === 1
    ? `<p><strong>Défaut</strong> : ${escape(tastes)}. ${save} : réussi, il profite quand même du plat ; réussi de 5 ou plus, il ne sent même pas le défaut ; raté, il n’en garde que le défaut.</p>`
    : `<p><strong>Défauts</strong> : ${escape(tastes)}. Le plat a perdu son effet. ${save} : réussi, il ne subit qu’un des défauts ; réussi de 5 ou plus, aucun.</p>`;
}

/** The taste flaws by number, from their item in the Items compendium. */
async function flawTable() {
  const { specials } = await loadCatalogue();
  const table = specials[FLAW_TABLE] ? await fromUuid(specials[FLAW_TABLE]) : null;
  return new Map((table?.effects ?? []).map(e => [flagOf(e).defaut, e]).filter(([n]) => n));
}

/**
 * The flaws of a missed dish, all different: a die as big as the table each, two for a Master Chef, who keeps one (the
 * penalties stay hidden).
 */
async function drawFlaws(count, master) {
  const table = await flawTable();
  const numbers = [...table.keys()].sort((a, b) => a - b);
  if (!numbers.length) {
    ui.notifications.error('Cuisine : table des défauts de goût introuvable dans le compendium Items.');
    return [];
  }
  const label = n => table.get(n)?.name ?? `Défaut ${n}`;
  const chosen = [];
  while (chosen.length < Math.min(count, numbers.length)) {
    const draws = [];
    const wanted = Math.min(master ? 2 : 1, numbers.length - chosen.length);
    while (draws.length < wanted) {
      const { total } = await new Roll(`1d${numbers.length}`).evaluate();
      const n = numbers[total - 1];
      if (!chosen.includes(n) && !draws.includes(n)) draws.push(n);
    }
    let pick = draws[0];
    if (draws.length > 1) {
      const choice = await DialogV2.wait({
        window: { title: 'Risque maîtrisé' }, content: '<p>Le plat est raté : choisis son défaut.</p>', rejectClose: false,
        buttons: draws.map((n, i) => ({ action: String(n), label: label(n), default: i === 0 }))
      });
      pick = draws.includes(Number(choice)) ? Number(choice) : draws[0];
    }
    chosen.push(pick);
  }
  return chosen.map(n => ({ n, label: label(n) }));
}

/* -------------------------------------------- */
/*  Repas                                       */
/* -------------------------------------------- */

/** Eats a dish: its risks, the save against its taste flaws, then its meal effect and the rolls of its Temporary Hit Points and Élans. */
async function eat(actor, meal) {
  const { plat } = meal;
  // The dice of the dish (a dish cooked before had as many dice as its potency)
  const dice = plat.des ?? plat.puissance;
  const palais = Boolean(featOf(actor, COOK));
  if (plat.risque && !isKind(actor, plat.risque.except)) await poisonSave(actor, meal, { dc: plat.risque.dc, status: 'poisoned', seconds: 3600 }, palais);
  if (plat.danger) await poisonSave(actor, meal, plat.danger, palais);
  if (plat.defauts?.length && !(await tasteFlaws(actor, meal, palais))) return;
  const effects = meal.effects.filter(e => e.flags?.[MODULE_ID]?.[FLAG]?.repas);
  if (!effects.length && !plat.temphp && !plat.elans) return;
  const slot = plat.encas ? 'encas' : 'repas';
  const id = foundry.utils.randomID();
  await clearMeal(actor, slot);
  if (effects.length) {
    await actor.createEmbeddedDocuments('ActiveEffect', effects.map((effect, index) => {
      const data = foundry.utils.deepClone(effect);
      delete data._id;
      data.origin = meal.uuid;
      // The first effect keeps the dice of the Hit Points given back at the end of the next Short Rest
      const soin = (index === 0) && plat.soin ? formulaAt(plat.soin, dice) : null;
      foundry.utils.setProperty(data, `flags.${MODULE_ID}.${FLAG}.repas`, { slot, id, soin });
      return data;
    }));
  }
  if (plat.temphp) {
    const roll = await new Roll(formulaAt(plat.temphp, dice)).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${meal.name} — PV temporaires` });
    if (roll.total > (actor.system.attributes.hp.temp ?? 0)) await actor.update({ 'system.attributes.hp.temp': roll.total });
  }
  if (plat.elans) await giveElans(actor, elansAt(plat.elans, dice), meal.name);
}

/** The Hit Points a revigorating meal gives back at the end of the next Short Rest, rolled once. */
async function recover(actor) {
  for (const effect of actor.effects.filter(e => e.getFlag(MODULE_ID, `${FLAG}.repas`)?.soin)) {
    const roll = await new Roll(effect.getFlag(MODULE_ID, `${FLAG}.repas`).soin).evaluate();
    await effect.setFlag(MODULE_ID, `${FLAG}.repas.soin`, null);
    const hp = actor.system.attributes.hp;
    await actor.update({ 'system.attributes.hp.value': Math.min(hp.value + roll.total, hp.effectiveMax ?? hp.max) });
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${effect.name} — PV récupérés à la fin du Short Rest` });
  }
}

/** Whether the actor belongs to a kind ("goblin": its species, creature type or subtype names it). */
function isKind(actor, kind) {
  if (!kind) return false;
  const words = [actor.system.details?.type?.value, actor.system.details?.type?.subtype, ...actor.items.filter(i => i.type === 'race').map(i => `${i.name} ${i.system.identifier}`)];
  const pattern = kind === 'goblin' ? /gob/i : new RegExp(kind, 'i');
  return words.some(word => pattern.test(word ?? ''));
}

/** Constitution save against a dish's poison; a failure gives its condition for its duration. */
async function poisonSave(actor, meal, { dc, status, seconds }, advantage) {
  const rolls = await actor.rollSavingThrow({ ability: 'con', target: dc, advantage }, {}, { data: { flavor: `${meal.name} — poison` } });
  const roll = rolls?.[0];
  if (!roll || (roll.total >= dc)) return true;
  await applyStatus(actor, status, seconds, meal);
  return false;
}

/** Applies a condition for `seconds`, or until the next Long Rest when `seconds` is null. */
async function applyStatus(actor, status, seconds, meal) {
  const effect = await ActiveEffect.implementation.fromStatusEffect(status);
  const data = effect.toObject();
  data.origin = meal.uuid;
  data.duration = seconds ? { value: seconds, units: 'seconds', expiry: 'turnStart', expired: false } : { value: null, units: 'seconds', expiry: 'longRest', expired: false };
  await actor.createEmbeddedDocuments('ActiveEffect', [data]);
}

/** What the chat says of the save against a dish's flaws, by number of flaws and result. */
const SAVE_TEXTS = {
  1: { rate: 'n’en garde que le défaut', reussi: 'profite du plat malgré son défaut', parfait: 'ne sent même pas le défaut' },
  2: { rate: 'subit les deux défauts', reussi: 'ne subit qu’un des défauts', parfait: 'ne sent aucun des défauts' }
};

/**
 * The Constitution save against the taste flaws of a missed dish, at its DC: the flaws left reveal their penalty
 * (until the next Short Rest). Returns whether the dish still gives its effect.
 */
async function tasteFlaws(actor, meal, palais) {
  const { defauts, dd } = meal.plat;
  const rolls = await actor.rollSavingThrow({ ability: 'con', target: dd }, {}, { data: { flavor: `${meal.name} — défaut` } });
  const roll = rolls?.[0];
  const result = roll ? saveResult(roll.total, roll.isCritical ? 20 : roll.d20?.total, dd) : 'rate';
  const { bonus, flaws } = afterSave(defauts.length, result);
  const table = await flawTable();
  const kept = defauts.slice(0, flaws).map(n => table.get(n)).filter(Boolean);
  for (const flaw of kept) {
    const poison = flagOf(flaw).poison;
    if (poison) {
      await intoxicate(actor, meal, poison, palais);
      continue;
    }
    const data = flaw.toObject();
    delete data._id;
    data.origin = meal.uuid;
    await actor.createEmbeddedDocuments('ActiveEffect', [data]);
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p>${escape(actor.name)} ${SAVE_TEXTS[defauts.length]?.[result] ?? 'mange le plat'}.</p>`
      + kept.map(flaw => `<p><strong>${escape(flaw.name)}</strong></p>${flaw.description ?? ''}`).join('')
  });
  return bonus;
}

/** A poisonous flaw: a Constitution save, with the Palais' Advantage; a failure poisons until the next Long Rest and exhausts, a success poisons for a while. */
async function intoxicate(actor, meal, { dc, exhaustion = 0, seconds = null }, palais) {
  const resisted = await poisonSave(actor, meal, { dc, status: 'poisoned', seconds: null }, palais);
  if (resisted) {
    if (seconds) await applyStatus(actor, 'poisoned', seconds, meal);
    return;
  }
  if (exhaustion) await actor.update({ 'system.attributes.exhaustion': Math.min((actor.system.attributes.exhaustion ?? 0) + exhaustion, 6) });
}

/** Removes the active meal (or snack) and, with the meal, its Élans. */
async function clearMeal(actor, slot) {
  const ids = actor.effects.filter(e => e.getFlag(MODULE_ID, `${FLAG}.repas`)?.slot === slot).map(e => e.id);
  if (ids.length) await actor.deleteEmbeddedDocuments('ActiveEffect', ids);
  if (slot === 'repas') await clearElans(actor);
}

async function clearElans(actor) {
  const ids = actor.items.filter(i => flagOf(i).elans).map(i => i.id);
  if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids);
}

/** The Élans of a meal: a feature whose uses each add their die (1d6, 1d8…) to an attack that hits, once per turn. */
async function giveElans(actor, { count, faces }, dishName) {
  await clearElans(actor);
  if (count < 1) return;
  const activity = foundry.utils.randomID();
  await actor.createEmbeddedDocuments('Item', [{
    name: 'Élans', type: 'feat', img: 'icons/skills/melee/strike-sword-steel-yellow.webp',
    system: {
      description: { value: `<p>Donnés par ${escape(dishName)}, jusqu’au prochain Long Rest. Quand tu touches avec une attaque, tu peux dépenser un Élan pour infliger 1d${faces} dégâts de plus, une fois par tour.</p>` },
      uses: { max: String(count), spent: 0, recovery: [] },
      activities: {
        [activity]: {
          _id: activity, type: 'damage', name: 'Élan',
          activation: { type: 'special', value: null, override: false, condition: 'Quand tu touches avec une attaque, une fois par tour' },
          consumption: { targets: [{ type: 'itemUses', value: '1', target: '' }], scaling: { allowed: false }, spellSlot: false },
          range: { units: 'self' }, target: { affects: { type: 'self' } },
          damage: { critical: { allow: true }, parts: [{ number: 1, denomination: faces, types: [] }] }
        }
      }
    },
    flags: { [MODULE_ID]: { [FLAG]: { elans: true } } }
  }]);
}

/** A recipe book studied by a cook teaches its recipes. */
async function study(actor, book) {
  if (!isCook(actor)) return ui.notifications.warn(`${actor.name} doit avoir le don Cuisinier ou Master Chef pour apprendre ces recettes.`);
  const { recipes } = await loadCatalogue();
  const added = await learn(actor, book.recettes ?? []);
  const names = recipes.filter(r => added.includes(r.identifier)).map(r => r.name);
  ui.notifications.info(names.length ? `${actor.name} apprend : ${names.join(', ')}.` : `${actor.name} connaît déjà toutes les recettes de ce livre.`);
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

/** Dishes being eaten, read before their last portion is used up. */
const eating = new Map();

Hooks.on('dnd5e.preUseActivity', activity => {
  const item = activity.item;
  const actor = activity.actor;
  if (!item || !actor) return;
  if ((item.type === 'feat') && [COOK, MASTER].includes(item.system.identifier) && (activity.name === 'Cuisiner')) {
    open(actor);
    return false;
  }
  const data = flagOf(item);
  if (data.livre) {
    study(actor, data.livre);
    return false;
  }
  if (data.plat) eating.set(item.uuid, { name: item.name, uuid: item.uuid, effects: item.effects.map(e => e.toObject()), plat: data.plat });
});

Hooks.on('dnd5e.postUseActivity', activity => {
  const meal = eating.get(activity.item?.uuid);
  if (!meal) return;
  eating.delete(activity.item.uuid);
  eat(activity.actor, meal).catch(error => console.error(`${MODULE_ID} | cuisine :`, error));
});

// The meals expire on their own (until the next Long Rest); their Élans go with them. A Short Rest heals revigorating meals.
Hooks.on('dnd5e.restCompleted', (actor, result, config) => {
  if (!actor.isOwner) return;
  if (config?.type === 'long') clearElans(actor);
  else if (config?.type === 'short') recover(actor).catch(error => console.error(`${MODULE_ID} | cuisine :`, error));
});

Hooks.on('getHeaderControlsApplicationV2', (app, controls) => {
  const actor = app.actor ?? (app.document?.documentName === 'Actor' ? app.document : null);
  if (!actor?.isOwner || !isCook(actor)) return;
  controls.unshift({ icon: 'fa-solid fa-utensils', label: 'Cuisiner', action: 'owidyn-cuisine-open', onClick: () => open(actor) });
});

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, LAYOUT, { scope: 'client', config: false, type: Object, default: { colonnes: false, familles: false } });
});

Hooks.once('ready', () => {
  const module = game.modules.get(MODULE_ID);
  module.api = { ...module.api, cuisine: { open, learn, cook } };
});
