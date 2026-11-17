// Run: node --experimental-vm-modules tests/content.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const context = vm.createContext({ Hooks: { once() {} }, console });
const compendiums = new vm.SourceTextModule(await fs.readFile(new URL("../../scripts/owidyn/compendiums.mjs", import.meta.url), "utf8"), { context });
await compendiums.link(() => {});
const content = new vm.SourceTextModule(
  await fs.readFile(new URL("../../scripts/cartomancien/content.js", import.meta.url), "utf8")
    + "\nexport { FEATURES, CLASS_ADVANCEMENTS, PARIEUR_ADVANCEMENTS, cantripAdvancement };",
  { context }
);
await content.link(specifier => {
  if (specifier === "../owidyn/compendiums.mjs") return compendiums;
  throw new Error(`Unexpected import ${specifier}`);
});
await content.evaluate();
const rules = new vm.SourceTextModule(await fs.readFile(new URL("../../scripts/cartomancien/rules.js", import.meta.url), "utf8"), { context });
await rules.link(() => {});
await rules.evaluate();
const features = new vm.SourceTextModule(await fs.readFile(new URL("../../scripts/cartomancien/features.js", import.meta.url), "utf8"), { context });
await features.link(name => name === "./content.js" ? content : rules);
await features.evaluate();
const { FEATURES, CLASS_ADVANCEMENTS, PARIEUR_ADVANCEMENTS, cantripAdvancement } = content.namespace;
const byName = name => FEATURES.find(item => item.system.identifier === name);
const changes = byName("la-ou-tombent-les-cartes").effects[0].system.changes;

assert.equal(CLASS_ADVANCEMENTS.filter(a => a.type === "HitPoints").length, 1);
assert.deepEqual(Array.from(CLASS_ADVANCEMENTS.filter(a => a.type === "AbilityScoreImprovement"), a => a.level), [4, 8, 12, 16]);
assert.ok(CLASS_ADVANCEMENTS.some(a => a.type === "ItemChoice" && a.level === 19));
assert.deepEqual(Array.from(PARIEUR_ADVANCEMENTS, a => a.level), [3, 6, 10, 14]);
// The Tarots feature opens the deck manager (its activity is caught before use) and is granted at level 1
const tarots = byName("tarots");
assert.ok(tarots, "Tarots");
assert.deepEqual(Object.keys(tarots.system.activities), ["CrtmActTarots001"]);
assert.ok(CLASS_ADVANCEMENTS.find(a => a.type === "ItemGrant" && a.level === 1).configuration.items.some(item => item.uuid.endsWith(tarots._id)));
assert.equal(cantripAdvancement(new Map()).configuration.choices[1].count, 3);
assert.equal(cantripAdvancement(new Map()).configuration.choices[4].count, 1);
assert.equal(cantripAdvancement(new Map()).configuration.choices[10].count, 1);

for (const name of ["system.rolls.ability.check.bonus", "system.rolls.ability.save.bonus", "system.rolls.attack.bonus"]) {
  assert.ok(changes.some(change => change.key === name && change.value === "1d4"), name);
}
assert.equal(byName("la-ou-tombent-les-cartes").effects[0].duration.value, 86400);
assert.equal(byName("miser-sa-vie").system.uses.max, "floor(@classes.cartomancien.levels / 2)");
assert.equal(byName("miser-sa-vie").system.uses.recovery.length, 0, "Tokens must not gain invented rest recovery");
for (const name of ["coup-d-eclat", "contre-toute-attente", "parieur-du-destin", "hit-the-jackpot"]) {
  const item = byName(name);
  assert.equal(item.system.uses.max, "1", name);
  assert.equal(item.system.uses.recovery[0].period, "lr", name);
}
assert.equal(byName("coup-d-eclat").system.activities["CrtmActEclat0001".padEnd(16, "0")].activation.type, "special");
assert.equal(byName("hit-the-jackpot").system.activities["PariActJackpot01".padEnd(16, "0")].activation.type, "action");
for (const advancement of [...CLASS_ADVANCEMENTS, ...PARIEUR_ADVANCEMENTS, cantripAdvancement(new Map())]) {
  assert.match(advancement._id, /^[a-zA-Z0-9]{16}$/);
  for (const grant of advancement.configuration.items ?? []) assert.match(grant.uuid.split(".").at(-1), /^[a-zA-Z0-9]{16}$/);
}
for (const item of FEATURES) {
  assert.match(item._id, /^[a-zA-Z0-9]{16}$/);
  assert.ok(item.img?.startsWith("modules/compendium-owidyn/assets/cartomancien/"));
  for (const activity of Object.values(item.system.activities)) {
    assert.match(activity._id, /^[a-zA-Z0-9]{16}$/);
    assert.equal(activity.consumption.spellSlot, false);
    for (const effect of activity.effects) assert.ok(item.effects.some(e => e._id === effect._id), `${item.name}: missing effect`);
  }
  for (const effect of item.effects) assert.match(effect._id, /^[a-zA-Z0-9]{16}$/);
}

const { influxLevel, isConsecutiveDraw } = rules.namespace;
assert.equal(influxLevel(20, 0), 0);
for (const [level, base, result] of [[2,1,1],[3,1,2],[7,2,3],[11,3,4],[15,4,5],[20,6,6]]) assert.equal(influxLevel(level, base), result);
assert.equal(isConsecutiveDraw([2, 0, 1]), true);
assert.equal(isConsecutiveDraw([0, 1, 3]), false);
assert.equal(isConsecutiveDraw([21, 0]), false);
const { nextJackpot } = features.namespace;
assert.equal(nextJackpot(0, 7).streak, 1);
assert.equal(nextJackpot(1, 7).streak, 2);
assert.equal(nextJackpot(2, 4).streak, 0);
assert.equal(nextJackpot(2, 7).streak, 0);
assert.deepEqual(Array.from(nextJackpot(2, 7).results), Array.from({ length: 20 }, (_, index) => index + 1));

// Content before 0.4.1 left ASIs with old 15-character ids next to the current ones: one ASI per level remains,
// the one holding a player's choice if any (re-keyed when its id is invalid), else the current one.
const { dedupeAdvancements } = content.namespace;
const clone = value => JSON.parse(JSON.stringify(value));
const asi = (id, level, value = {}) => ({ _id: id, type: "AbilityScoreImprovement", level, value });
const current = Object.fromEntries(CLASS_ADVANCEMENTS.map(a => [a._id, clone(a)]));
const legacy = { ...clone(current), CrtmAdvASI00004: asi("CrtmAdvASI00004", 4), BNq9BNw1fvcofbXQ: asi("BNq9BNw1fvcofbXQ", 8),
  CrtmAdvASI00012: asi("CrtmAdvASI00012", 12, { type: "asi", assignments: { int: 2 } }) };
assert.equal(dedupeAdvancements(legacy, new Set(Object.keys(current))), true);
const asis = Object.values(legacy).filter(a => a.type === "AbilityScoreImprovement");
assert.deepEqual(asis.map(a => a.level).sort((a, b) => a - b), [4, 8, 12, 16]);
assert.ok(Object.keys(legacy).every(id => /^[a-zA-Z0-9]{16}$/.test(id)));
assert.deepEqual(asis.find(a => a.level === 12).value.assignments, { int: 2 }, "a player's choice is kept");
assert.equal(dedupeAdvancements(clone(current), new Set(Object.keys(current))), false, "current content is left alone");
console.log("PASS content, effect links, progression, resources, influx, suites, Jackpot rules and duplicate ASI repair");
