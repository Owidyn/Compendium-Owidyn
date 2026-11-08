// Run with: node --experimental-vm-modules tests/deck.test.mjs
// These are document-level regression checks; they do not replace a Foundry UI smoke test.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODULE_ID = "compendium-owidyn";
const clone = value => JSON.parse(JSON.stringify(value));

class Collection extends Map {
  [Symbol.iterator]() { return this.values(); }
  get contents() { return [...this.values()]; }
  find(fn) { return this.contents.find(fn); }
  filter(fn) { return this.contents.filter(fn); }
  map(fn) { return this.contents.map(fn); }
}

function getPath(target, key) {
  return key.split(".").reduce((cursor, part) => cursor?.[part], target);
}

function setPath(target, key, value) {
  const parts = key.split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
  const final = parts.at(-1);
  if (final.startsWith("-=")) delete cursor[final.slice(2)];
  else cursor[final] = clone(value);
}

async function harness() {
  const hooks = new Map();
  const documents = new Map();
  const stacks = new Collection();
  let nextId = 0;
  const notices = [];
  const calls = [];
  const castClones = [];
  const dialogAnswers = [];
  const dialogs = [];
  // Spell List spells found in the compendiums and their import onto the sheet, replaced by the tests that need them
  const spellSources = { available: async () => ({ available: [], missing: [] }), import: async () => null };
  const moduleState = {};
  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout,
    Hooks: {
      on(name, handler) { const list = hooks.get(name) ?? []; list.push(handler); hooks.set(name, list); },
      once(name, handler) { const list = hooks.get(name) ?? []; list.push(handler); hooks.set(name, list); }
    },
    game: {
      modules: new Map([[MODULE_ID, moduleState]]),
      cards: stacks,
      user: { id: "owner", isGM: false },
      users: { activeGM: null, get: id => ({ id, isGM: false }) },
      i18n: { lang: "fr" },
      combat: null,
      time: { worldTime: 1000 },
      packs: new Collection(),
      items: new Collection()
    },
    foundry: {
      utils: {
        deepClone: clone,
        escapeHTML: String,
        mergeObject: (left, right) => Object.assign(left, right),
        getProperty: (value, key) => key.split(".").reduce((v, k) => v?.[k], value),
        hasProperty: (value, key) => key.split(".").reduce((v, k) => v?.[k], value) !== undefined,
        randomID: () => `id${++nextId}`
      },
      applications: { api: {
        ApplicationV2: class {},
        HandlebarsApplicationMixin: base => base,
        DialogV2: {
          input: async options => { dialogs.push(options); return dialogAnswers.shift() ?? null; },
          wait: async () => dialogAnswers.shift() ?? null,
          confirm: async () => dialogAnswers.shift() ?? false
        }
      }}
    },
    ui: { notifications: Object.fromEntries(["warn", "error", "info"].map(type => [type, message => notices.push({ type, message })])) },
    CONST: { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0, OWNER: 3 } },
    fromUuid: async uuid => documents.get(uuid),
    fromUuidSync: uuid => documents.get(uuid),
    ChatMessage: { getSpeaker: () => ({}), create: async data => data },
    ActiveEffect: { implementation: { getEffectStart: () => ({ time: 1000 }) } },
    activityCalls: calls,
    activityResult: { message: "cast" }
  });

  class Card {
    constructor(data, parent) {
      Object.assign(this, clone(data));
      this.id = this._id ?? `card${++nextId}`;
      this._id = this.id;
      this.parent = parent;
      this.flags ??= {};
    }
    getFlag(scope, key) { return getPath(this.flags?.[scope], key); }
    async setFlag(scope, key, value) { setPath(this.flags[scope] ??= {}, key, value); }
    async unsetFlag(scope, key) { setPath(this.flags[scope] ??= {}, key.replace(/[^.]+$/, "-=$&"), null); }
    toObject() { const { parent, ...data } = this; return clone(data); }
    async update(data) { for (const [key, value] of Object.entries(data)) setPath(this, key, value); return this; }
    async pass(target, options = {}) {
      const source = this.parent.type === "deck" ? this : stacks.get(this.origin)?.cards.get(this.sourceId);
      if (source) source.drawn = true;
      const data = { ...this.toObject(), origin: source?.parent.id ?? this.origin, sourceId: source?.id ?? this.sourceId, ...options.updateData };
      if (this.parent.type !== "deck") this.parent.cards.delete(this.id);
      const copy = new Card(data, target);
      target.cards.set(copy.id, copy);
      return copy;
    }
    async recall() {
      const source = this.parent.type === "deck" ? this : stacks.get(this.origin)?.cards.get(this.sourceId);
      if (!source) return;
      source.drawn = false;
      for (const stack of stacks) {
        if (stack === source.parent) continue;
        for (const copy of [...stack.cards]) if (copy.sourceId === source.id) stack.cards.delete(copy.id);
      }
    }
  }

  class Stack {
    constructor(data) { Object.assign(this, data); this.id = `stack${++nextId}`; this.cards = new Collection(); stacks.set(this.id, this); }
    get availableCards() { return this.cards.filter(card => !card.drawn); }
    async createEmbeddedDocuments(type, data) { return data.map(entry => { const card = new Card(entry, this); this.cards.set(card.id, card); return card; }); }
    async updateEmbeddedDocuments(type, updates) { return Promise.all(updates.map(data => this.cards.get(data._id)?.update(data))); }
    async deleteEmbeddedDocuments(type, ids) { for (const id of ids) this.cards.delete(id); }
    async shuffle() { this.shuffleCount = (this.shuffleCount ?? 0) + 1; }
    async deal(destinations, count) { for (const card of this.availableCards.slice(0, count)) await card.pass(destinations[0]); }
    async pass(target, ids) { for (const id of ids) await this.cards.get(id)?.pass(target); }
    async recall() { for (const card of [...this.cards]) await card.recall(); }
    async update(data) { Object.assign(this, clone(data)); }
    async delete() { stacks.delete(this.id); this.deleted = true; }
    testUserPermission() { return true; }
  }
  context.Cards = { implementation: { create: async data => new Stack(data) } };

  const content = new vm.SyntheticModule([
    "CARTOMANCIEN_SPELLS", "ensureContent", "getAvailableCartomancienSpellSources", "importSpellToActor", "syncActorContent", "isCartomancienSpell"
  ], function () {
    this.setExport("CARTOMANCIEN_SPELLS", {});
    this.setExport("ensureContent", async () => null);
    this.setExport("getAvailableCartomancienSpellSources", (...args) => spellSources.available(...args));
    this.setExport("importSpellToActor", (...args) => spellSources.import(...args));
    this.setExport("syncActorContent", async () => null);
    this.setExport("isCartomancienSpell", () => true);
  }, { context });
  const features = new vm.SyntheticModule(["registerFeatureAutomation"], function () {
    this.setExport("registerFeatureAutomation", () => {});
  }, { context });
  const migration = new vm.SyntheticModule(["migrated"], function () {
    this.setExport("migrated", Promise.resolve());
  }, { context });
  const modules = new Map();
  async function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const code = await fs.readFile(path.join(ROOT, "scripts", "cartomancien", filename), "utf8");
    const module = new vm.SourceTextModule(code, { context, identifier: filename });
    modules.set(filename, module);
    await module.link(async specifier => {
      if (specifier === "./content.js") return content;
      if (specifier === "./features.js") return features;
      if (specifier === "../owidyn/migration.mjs") return migration;
      return load(path.basename(specifier));
    });
    return module;
  }
  const main = await load("cartomancien.js");
  await main.evaluate();
  for (const callback of hooks.get("ready") ?? []) await callback();

  function makeActor(level = 3) {
    const actor = {
      id: `actor${++nextId}`, name: "Test Cartomancien", documentName: "Actor", isOwner: true,
      ownership: { owner: 3 }, flags: { [MODULE_ID]: { cartomancien: {} } }, effects: new Collection(),
      system: { attributes: { prof: 2, hp: { value: 5, max: 20 } } }, items: new Collection(),
      getFlag(scope, key) { return getPath(this.flags?.[scope], key); },
      async setFlag(scope, key, value) { setPath(this.flags[scope] ??= {}, key, value); },
      async unsetFlag(scope, key) { setPath(this.flags[scope] ??= {}, key.replace(/[^.]+$/, "-=$&"), null); },
      async update(data) { for (const [key, value] of Object.entries(data)) setPath(this, key, value); },
      async createEmbeddedDocuments(type, data) {
        if (type === "ActiveEffect") for (const effect of data) {
          const id = effect._id ?? `effect${++nextId}`;
          this.effects.set(id, { ...effect, id, getFlag(scope, key) { return getPath(this.flags?.[scope], key); } });
        }
        return data;
      },
      async deleteEmbeddedDocuments(type, ids) { for (const id of ids) (type === "ActiveEffect" ? this.effects : this.items).delete(id); }
    };
    actor.items.set("class", { id: "class", type: "class", name: "Le Cartomancien", parent: actor, system: { identifier: "cartomancien", levels: level } });
    return actor;
  }

  async function setup(level = 3) {
    const actor = makeActor(level);
    const result = await moduleState.api.cartomancien.syncActor(actor, { promptAssignments: false });
    return { actor, ...result };
  }

  /** A spell on the actor's sheet, unbound unless addSpell binds it. */
  function addSheetSpell(actor, { name = "Sheet spell", level = 1, flags = {}, sourceItem = "" } = {}) {
    const spell = { id: `spell${++nextId}`, uuid: `Actor.${actor.id}.Item.spell${nextId}`, name, type: "spell", parent: actor, flags: clone(flags),
      system: { level, sourceItem, method: "spell", ability: "int", range: { units: "touch" }, activities: new Collection() },
      getFlag(scope, key) { return getPath(this.flags?.[scope], key); } };
    actor.items.set(spell.id, spell);
    documents.set(spell.uuid, spell);
    return spell;
  }

  function addSpell(actor, card, level = 1, options = {}) {
    const activity = { id: "cast", name: "Cast", type: "utility", system: {}, activation: { type: "action" }, range: { units: "touch" }, consumption: { spellSlot: true } };
    activity.use = vm.runInContext("(async (...args) => { activityCalls.push(args); return activityResult; })", context);
    const spell = addSheetSpell(actor, { name: "Test spell", level, ...options });
    spell.system.activities.set(activity.id, activity);
    spell.clone = updates => {
      const cast = { ...spell, flags: clone(spell.flags ?? {}), system: { ...spell.system, activities: new Collection() } };
      for (const [key, value] of Object.entries(updates)) setPath(cast, key, value);
      for (const current of spell.system.activities) cast.system.activities.set(current.id, { ...current, item: cast });
      castClones.push(cast);
      return cast;
    };
    activity.item = spell;
    setPath(card.flags, `${MODULE_ID}.cartomancien.spellUuid`, spell.uuid);
    return { spell, activity };
  }

  return { context, api: moduleState.api.cartomancien, notices, calls, castClones, dialogAnswers, dialogs, spellSources, setup, makeActor, addSpell, addSheetSpell, documents, stacks, hooks, modules };
}

const cases = [];
const test = (name, run) => cases.push({ name, run });

test("deck unlocks reproduce all 20 class-table rows", async () => {
  const { api } = await harness();
  const expectedSizes = [2, 3, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
  const expectedLateUnlocks = { 15: 18, 16: 11, 17: 19, 18: 13, 19: 20, 20: 15, 21: 17 };
  for (let level = 1; level <= 20; level++) assert.equal(api.ARCANA.filter(card => card.unlock <= level).length, expectedSizes[level - 1], `level ${level}`);
  for (const [index, unlock] of Object.entries(expectedLateUnlocks)) assert.equal(api.ARCANA.find(card => card.index === Number(index)).unlock, unlock, `arcana ${index}`);
  assert.deepEqual(Array.from(api.ARCANA.filter(card => card.unlock <= 11), card => card.spellLevel).sort(), [1,1,1,1,2,2,2,3,3,3,4,4,4,5,5,6].sort());
});

for (const cancelled of [false, null, undefined]) {
  test(`cancelled cast (${String(cancelled)}) keeps its card`, async () => {
    const h = await harness();
    const { actor, deck, hand, discard } = await h.setup(3);
    const card = [...hand.cards][0];
    const source = deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === card.getFlag(MODULE_ID, "cartomancien.arcanaIndex"));
    h.addSpell(actor, source);
    h.context.activityResult = cancelled;
    await h.api.castFromCard(actor, card.id, { spellLevel: 1 });
    assert.equal(hand.cards.has(card.id), true);
    assert.equal(discard.cards.size, 0);
  });
}

for (const [classLevel, spellLevel] of [[3, 2], [18, 9]]) {
  test(`cast at level ${spellLevel} consumes the card but no spell slot`, async () => {
    const h = await harness();
    const { actor, deck, hand, discard } = await h.setup(classLevel);
    const card = [...hand.cards][0];
    const source = deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === card.getFlag(MODULE_ID, "cartomancien.arcanaIndex"));
    h.addSpell(actor, source);
    if (spellLevel === 9) await card.setFlag(MODULE_ID, "cartomancien.coupEclat", true);
    await h.api.castFromCard(actor, card.id, spellLevel === 9 ? {} : { spellLevel });
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0][0].consume.spellSlot, false);
    assert.equal(h.calls[0][0].spell.slot, spellLevel);
    assert.equal(h.calls[0][0].scaling, spellLevel - 1);
    assert.equal(h.castClones[0].flags.dnd5e.spellLevel.value, spellLevel);
    assert.equal(h.castClones[0].system.ability, "int");
    assert.equal(hand.cards.has(card.id), false);
    assert.equal(discard.cards.size, 1);
  });
}

test("free draw is restricted to the actor's turn and once per turn", async () => {
  const h = await harness();
  const { actor, hand } = await h.setup(3);
  for (const card of [...hand.cards]) await card.recall();
  h.context.game.combat = { id: "combat", started: true, round: 1, turn: 0, combatant: { actorId: "other", actor: { id: "other" } } };
  await h.api.drawOne(actor);
  assert.equal(hand.cards.size, 0, "must not draw on another combatant's turn");
  h.context.game.combat.combatant = { actorId: actor.id, actor };
  await h.api.drawOne(actor);
  assert.equal(hand.cards.size, 1);
  await h.api.drawOne(actor);
  assert.equal(hand.cards.size, 1, "second draw on the same turn must not add a card");
  h.context.game.combat.round = 2;
  await h.api.drawOne(actor);
  assert.equal(hand.cards.size, 2);
});

test("synchronization removes a formerly premature unlock from the deck and hand", async () => {
  const h = await harness();
  const { actor, deck, hand, discard } = await h.setup(11);
  const wrong = { name: "XV — Le Diable", drawn: false, faces: [{}], back: {}, flags: { [MODULE_ID]: { cartomancien: { arcanaIndex: 15, unlockLevel: 11, spellLevel: 5 } } } };
  const [source] = await deck.createEmbeddedDocuments("Card", [wrong]);
  await source.pass(hand);
  await h.api.syncActor(actor, { promptAssignments: false });
  for (const stack of [deck, hand, discard]) assert.equal(stack.cards.some?.(card => card.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === 15) ?? Boolean(stack.cards.find(card => card.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === 15)), false);
  assert.equal(deck.cards.size, 16);
  assert.ok(deck.cards.find(card => card.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === 16));
});

test("long rest preserves kept cards and draws PB additional cards", async () => {
  const h = await harness();
  const { actor, hand } = await h.setup(3);
  h.dialogAnswers.push([]);
  await h.api.longRest(actor);
  assert.equal(hand.cards.size, 4);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.restPending"), undefined);
});

test("long rest removes Coup d'eclat and offers a fresh mystery without resetting sevens", async () => {
  const h = await harness();
  const { actor, hand } = await h.setup(10);
  await [...hand.cards][0].setFlag(MODULE_ID, "cartomancien.coupEclat", true);
  await actor.setFlag(MODULE_ID, "cartomancien.jackpotStreak", 2);
  await actor.setFlag(MODULE_ID, "cartomancien.jackpotMystery", true);
  actor.items.set("jackpot", { system: { identifier: "hit-the-jackpot" } });
  h.dialogAnswers.push([], true);
  await h.api.longRest(actor);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.jackpotMystery"), true);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.jackpotStreak"), 2);
  assert.equal(hand.cards.find(card => card.getFlag(MODULE_ID, "cartomancien.coupEclat")), undefined);
});

test("long rest applies Suite favorable to a consecutive hand", async () => {
  const h = await harness();
  const { actor } = await h.setup(3);
  actor.items.set("suite", { uuid: "Actor.test.Item.suite", system: { identifier: "la-ou-tombent-les-cartes" },
    effects: new Collection([["suite", { name: "Suite favorable", toObject: () => ({ _id: "suite", name: "Suite favorable", duration: { value: 86400, units: "seconds" }, flags: {} }) }]]) });
  h.dialogAnswers.push([]);
  await h.api.longRest(actor);
  assert.equal(actor.effects.size, 1);
  assert.equal([...actor.effects][0].getFlag(MODULE_ID, "cartomancien.suiteFavorable"), true);
});

test("pending redraw blocks card casting and free draws", async () => {
  const h = await harness();
  const { actor, hand } = await h.setup(3);
  await actor.setFlag(MODULE_ID, "cartomancien.redrawPending", true);
  await h.api.castFromCard(actor, [...hand.cards][0].id);
  await h.api.drawOne(actor);
  assert.equal(h.calls.length, 0);
  assert.equal(hand.cards.size, 2);
});

test("a card is bound to a spell of its level from the sheet or from the Spell List", async () => {
  const h = await harness();
  const { actor, deck } = await h.setup(1);
  const card = index => deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === index);
  const listed = { name: "Listed spell", level: 1, uuid: "Compendium.dnd5e.spells24.Item.listedSpell00000", owned: false };
  h.spellSources.available = async level => ({ available: level === 1 ? [listed] : [], missing: [] });
  h.spellSources.import = async (target, uuid) => uuid === listed.uuid ? h.addSheetSpell(target, { name: listed.name }) : null;
  const offList = h.addSheetSpell(actor, { name: "Off-list spell" });
  const higher = h.addSheetSpell(actor, { name: "Higher spell", level: 2 });
  h.addSheetSpell(actor, { name: "Wand spell", flags: { dnd5e: { cachedFor: ".Item.wand.Activity.cast" } } });

  h.dialogAnswers.push({ spellUuid: higher.uuid });
  assert.equal(await h.api.chooseSpellForCard(actor, deck, 0), false, "a spell of another level is refused");
  const offered = h.dialogs.at(-1).content;
  assert.match(offered, /Off-list spell — sur la fiche/, "any spell of the sheet of the card's level is offered");
  assert.match(offered, /Listed spell — Spell List/, "the Spell List spells of the compendiums are offered");
  assert.doesNotMatch(offered, /Higher spell|Wand spell/, "no spell of another level, nor cast through an item");
  assert.equal(card(0).getFlag(MODULE_ID, "cartomancien.spellUuid"), "");

  h.dialogAnswers.push({ spellUuid: offList.uuid });
  assert.equal(await h.api.chooseSpellForCard(actor, deck, 0), true);
  assert.equal(card(0).getFlag(MODULE_ID, "cartomancien.spellUuid"), offList.uuid);

  h.dialogAnswers.push({ spellUuid: listed.uuid });
  assert.equal(await h.api.chooseSpellForCard(actor, deck, 1), true);
  const imported = actor.items.find(item => item.name === listed.name);
  assert.ok(imported, "a Spell List spell is added to the sheet");
  assert.equal(card(1).getFlag(MODULE_ID, "cartomancien.spellUuid"), imported.uuid);

  h.spellSources.available = async () => ({ available: [], missing: [] });
  await card(0).setFlag(MODULE_ID, "cartomancien.spellUuid", "");
  actor.items.delete(offList.id);
  assert.equal(await h.api.chooseSpellForCard(actor, deck, 0), "none", "the only level 1 spell left is prepared on another card");
  assert.equal(h.notices.at(-1).type, "warn");
});

test("reset returns every card to the deck and deals a new hand, keeping bindings and credits", async () => {
  const h = await harness();
  const { actor, deck, hand, discard } = await h.setup(3);
  const bound = deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === 0);
  const { spell } = h.addSpell(actor, bound);
  await [...hand.cards][0].pass(discard);
  await [...hand.cards][0].setFlag(MODULE_ID, "cartomancien.coupEclat", true);
  await actor.update({ [`flags.${MODULE_ID}.cartomancien.redrawPending`]: true, [`flags.${MODULE_ID}.cartomancien.restPending`]: true,
    [`flags.${MODULE_ID}.cartomancien.replacementCredits`]: 2 });
  h.dialogAnswers.push({ unbind: true });
  assert.equal(await h.api.resetDeck(actor), true);
  assert.equal(deck.cards.size, 6);
  assert.equal(discard.cards.size, 0);
  assert.equal(hand.cards.size, 2);
  assert.equal(deck.availableCards.length, 4);
  assert.equal(hand.cards.find(card => card.getFlag(MODULE_ID, "cartomancien.coupEclat")), undefined);
  assert.equal(bound.getFlag(MODULE_ID, "cartomancien.spellUuid"), spell.uuid, "only a GM can unbind the cards");
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.redrawPending"), undefined);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.restPending"), undefined);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.replacementCredits"), 2);
});

test("a GM reset can unbind every card for a free new choice of spell", async () => {
  const h = await harness();
  const { actor, deck } = await h.setup(3);
  h.context.game.user.isGM = true;
  const card = index => deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === index);
  const { spell } = h.addSpell(actor, card(0));
  const other = h.addSheetSpell(actor, { name: "Other spell" });
  await actor.update({ [`flags.${MODULE_ID}.cartomancien.replacementCredits`]: 2,
    [`flags.${MODULE_ID}.cartomancien.archivedCards`]: { 15: { flags: { [MODULE_ID]: { cartomancien: { spellUuid: spell.uuid } } } } } });
  // The reset with its GM option, then the new spell of the first card; the next prompts are left unanswered
  h.dialogAnswers.push({ unbind: true }, { spellUuid: other.uuid });
  assert.equal(await h.api.resetDeck(actor), true);
  assert.equal(card(0).getFlag(MODULE_ID, "cartomancien.spellUuid"), other.uuid, "the first card took a new spell");
  assert.equal(card(1).getFlag(MODULE_ID, "cartomancien.spellUuid"), "", "a card left unanswered stays unbound");
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.archivedCards"), undefined);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien.replacementCredits"), 2, "the new choices spend no change of spell");
});

test("removing the class deletes its deck, flags and effects, then its spells only", async () => {
  const h = await harness();
  const { actor, deck, hand, discard } = await h.setup(3);
  const card = index => deck.cards.find(entry => entry.getFlag(MODULE_ID, "cartomancien.arcanaIndex") === index);
  const { spell: bound } = h.addSpell(actor, card(0));
  const imported = h.addSheetSpell(actor, { name: "Imported", flags: { [MODULE_ID]: { cartomancien: { importedForCartomancien: true } } } });
  actor.items.set("wizard", { id: "wizard", type: "class", name: "Wizard", parent: actor, system: { identifier: "wizard", levels: 1 } });
  const { spell: wizard } = h.addSpell(actor, card(1), 1, { sourceItem: "class:wizard" });
  const plain = h.addSheetSpell(actor, { name: "Unrelated" });
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Suite favorable", flags: { [MODULE_ID]: { cartomancien: { suiteFavorable: true } } } }]);
  const cls = actor.items.get("class");
  actor.items.delete("class");
  h.dialogAnswers.push(true);
  for (const callback of h.hooks.get("deleteItem")) callback(cls, {}, "owner");
  await new Promise(resolve => setTimeout(resolve, 20));
  for (const stack of [deck, hand, discard]) assert.equal(h.stacks.has(stack.id), false);
  assert.equal(actor.getFlag(MODULE_ID, "cartomancien"), undefined);
  assert.equal(actor.effects.size, 0);
  assert.equal(actor.items.has(bound.id), false);
  assert.equal(actor.items.has(imported.id), false);
  assert.equal(actor.items.has(wizard.id), true, "a spell of another class stays");
  assert.equal(actor.items.has(plain.id), true, "a spell unrelated to the deck stays");
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${cases.length - failures}/${cases.length} deck regression checks passed.`);
if (failures) process.exitCode = 1;
