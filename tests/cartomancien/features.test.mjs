// Run: node --experimental-vm-modules tests/features.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const ID = "compendium-owidyn";
const hooks = new Map();
const answers = [];
const events = [];
const notices = [];
let nativeResult = { message: {} };
let finished;
class Collection extends Map {
  [Symbol.iterator]() { return this.values(); }
  find(fn) { return [...this].find(fn); }
  filter(fn) { return [...this].filter(fn); }
  map(fn) { return [...this].map(fn); }
}
const actor = {
  id: "actor", uuid: "Actor.actor", isOwner: true, flags: {}, items: new Collection(), effects: new Collection(),
  getFlag(scope, key) { return this.flags[key.split(".").at(-1)]; },
  async setFlag(scope, key, value) { this.flags[key.split(".").at(-1)] = value; },
  async unsetFlag(scope, key) { delete this.flags[key.split(".").at(-1)]; },
  async update(data) { for (const [key, value] of Object.entries(data)) this.flags[key.split(".").at(-1)] = value; },
  async createEmbeddedDocuments(type, data) { events.push({ effect: data[0] }); return data; }
};
const card = { id: "card", name: "Le Fou", sort: 0, async pass() { events.push("pass"); }, async update() {} };
const stack = () => ({ isOwner: true, cards: new Collection([[card.id, card]]), availableCards: [card] });
const stacks = { deck: stack(), hand: stack(), discard: stack() };
const context = vm.createContext({
  console, setTimeout, clearTimeout,
  Hooks: { on(name, fn) { const list = hooks.get(name) ?? []; list.push(fn); hooks.set(name, list); } },
  game: { combat: null, time: { worldTime: 100 }, user: { id: "owner" }, actors: [], users: [] },
  ui: { notifications: { warn: text => notices.push(text), error: text => { throw new Error(text); } } },
  foundry: { utils: { escapeHTML: String }, applications: { api: { DialogV2: {
    input: async () => { events.push("dialog"); return answers.shift() ?? null; },
    wait: async () => { events.push("dialog"); return answers.shift() ?? null; }
  } } } },
  ActiveEffect: { implementation: { getEffectStart: () => ({ time: 100 }) } },
  CONST: { SORT_INTEGER_DENSITY: 100000 },
  Roll: class { async evaluate() { this.total = 7; return this; } async toMessage() {} },
  ChatMessage: { create: async () => {}, getSpeaker: () => ({}) }
});
const content = new vm.SyntheticModule(["getAvailableCartomancienSpellSources", "importSpellToActor"], function () {
  this.setExport("getAvailableCartomancienSpellSources", async () => ({ available: [] }));
  this.setExport("importSpellToActor", async () => null);
}, { context });
const rules = new vm.SourceTextModule(await fs.readFile(new URL("../../scripts/cartomancien/rules.js", import.meta.url), "utf8"), { context });
await rules.link(() => {});
const features = new vm.SourceTextModule(await fs.readFile(new URL("../../scripts/cartomancien/features.js", import.meta.url), "utf8"), { context });
await features.link(name => name === "./content.js" ? content : rules);
await features.evaluate();
features.namespace.registerFeatureAutomation({
  getStacks: async () => stacks, getCardDef: () => ({ roman: "0", name: "Le Fou" }), getArcanaIndex: () => 0,
  refreshManagers: () => finished?.()
});

async function use(id) {
  events.length = 0;
  const item = { id: "feature", name: "Feature", actor, isOwner: true, effects: new Collection(),
    getFlag: () => "managed", system: { uses: { spent: 3 }, activities: new Collection() },
    async update(data) { this.system.uses.spent = data["system.uses.spent"]; events.push("recover"); } };
  const activity = { id: id.padEnd(16, "0"), name: "Feature activity", item, actor,
    async use(usage) {
      events.push("native");
      for (const hook of hooks.get("dnd5e.preUseActivity")) assert.notEqual(hook(this, usage, {}, {}), false, "guard prevents recursive interception");
      return nativeResult;
    } };
  item.system.activities.set(activity.id, activity);
  actor.items.set(item.id, item);
  const done = new Promise(resolve => { finished = resolve; });
  const result = hooks.get("dnd5e.preUseActivity")[0](activity, {}, {}, {});
  assert.equal(result, false, "preUse must cancel synchronously");
  await done;
  return item;
}

await use("PariActFold00001");
assert.deepEqual(events, ["dialog"], "cancelled choice must not consume or discard");
answers.push(["card"]);
nativeResult = undefined;
await use("PariActFold00001");
assert.deepEqual(events, ["dialog", "native"], "native cancellation must keep card and tokens");
nativeResult = { message: {} };
answers.push(["card"]);
const fold = await use("PariActFold00001");
assert.equal(fold.system.uses.spent, 1);
assert.deepEqual(events, ["dialog", "native", "pass", "recover"]);
answers.push({ position: "top" });
await use("PariActMiserTop1");
assert.deepEqual(events, ["native", "dialog"], "top card is revealed only after native token spending");
await use("PariActMiserRng2");
const effect = events.find(event => event.effect)?.effect;
assert.equal(effect.flags[ID].cartomancien.range60, true);
assert.equal(effect.flags[ID].cartomancien.expiresAt, 106);
assert.equal(effect.start.time, 100);
await use("PariActJackpot01");
assert.equal(events.length, 0, "Jackpot requires a mystery card received after rest");
actor.flags.jackpotMystery = true;
actor.flags.jackpotStreak = 2;
answers.push({});
await use("PariActJackpot01");
assert.equal(actor.flags.jackpotMystery, false);
assert.equal(actor.flags.jackpotStreak, 0);
assert.equal(actor.flags.jackpotPending.length, 20, "missing spell keeps all twenty Jackpot results for resumption");
console.log("PASS native hook interception, cancellation, Fold recovery, paid peek, range effect and resumable Jackpot");
