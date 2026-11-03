import { getAvailableCartomancienSpellSources, importSpellToActor } from "./content.js";
import { influxLevel } from "./rules.js";

const MODULE_ID = "compendium-owidyn";
const ICON = `modules/${MODULE_ID}/assets/cartomancien/parieur.svg`;
const HANDLERS = {
  CrtmActDraw00001: "draw", CrtmActEclat0001: "eclat",
  PariActMage00001: "mage", PariActDismiss01: "dismiss",
  PariActMiserTop1: "peek", PariActMiserRng2: "range",
  PariActMiserDrw3: "redraw", PariActFold00001: "fold",
  PariActContre001: "against", PariActDouble001: "double",
  PariActJackpot01: "jackpot", PariActJackNext1: "resume",
  PariActDestin001: "destiny"
};

export const JACKPOT_SPELLS = [
  ["Cure Wounds", 1], ["Chromatic Orb", 1], ["Magic Missile", 1], ["Ray of Sickness", 1],
  ["Moonbeam", 2], ["Shatter", 2], ["Fireball", 3], ["Lightning Bolt", 3],
  ["Vampiric Touch", 3], ["Ice Storm", 4], ["Sickening Radiance", 4], ["Wall of Fire", 4],
  ["Cone of Cold", 5], ["Immolation", 5], ["Chain Lightning", 6], ["Sunbeam", 6],
  ["Fire Storm", 7], ["Crown of Stars", 7], ["Sunburst", 8], ["Time Stop", 9]
];

const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const flag = (document, key) => document?.getFlag?.(MODULE_ID, `cartomancien.${key}`) ?? document?.flags?.[MODULE_ID]?.cartomancien?.[key];
const activityList = item => [...(item?.system?.activities?.values?.() ?? [])];
const turnKey = () => game.combat?.started ? `${game.combat.id}:${game.combat.round}:${game.combat.turn}` : null;
const topCards = deck => [...(deck?.availableCards ?? [])].sort((a, b) => a.sort - b.sort);

export function nextJackpot(streak, result) {
  const count = result === 7 ? Number(streak || 0) + 1 : 0;
  return { streak: count >= 3 ? 0 : count, results: count >= 3 ? JACKPOT_SPELLS.map((_, i) => i + 1) : [result] };
}

async function input(title, content, label = "Continuer") {
  return foundry.applications.api.DialogV2.input({
    window: { title }, content, ok: { label }, rejectClose: false, modal: true
  });
}

async function chooseCards(title, cards, { count = 1, hint = "", label = card => card.name } = {}) {
  if (cards.length < count) return null;
  const choices = cards.map(card => `<label style="display:block;margin:5px 0"><input type="${count === 1 ? "radio" : "checkbox"}" name="cards" value="${escape(card.id)}"> ${escape(label(card))}</label>`).join("");
  while (true) {
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title }, content: `${hint}<p>Choisissez exactement ${count} carte(s).</p>${choices}`,
      buttons: [
        { action: "choose", label: "Choisir", default: true, callback: (event, button) => [...button.form.querySelectorAll('input[name="cards"]:checked')].map(element => element.value) },
        { action: "cancel", label: "Annuler", callback: () => null }
      ], rejectClose: false, modal: true
    });
    if (!Array.isArray(result)) return null;
    if (result.length === count) return result;
    ui.notifications.warn(`Choisissez exactement ${count} carte(s).`);
  }
}

async function notifyChat(actor, content) {
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
}

async function findSpell(actor, name, level) {
  const { available } = await getAvailableCartomancienSpellSources(level, { actor });
  const source = available.find(entry => normalize(entry.name) === normalize(name));
  if (!source) return null;
  return importSpellToActor(actor, source.uuid);
}

async function chooseSpellActivity(spell) {
  const activities = activityList(spell).filter(activity => typeof activity.use === "function" && !activity.isRider);
  if (activities.length === 1) return activities[0];
  if (!activities.length) return null;
  const choice = await input(spell.name, `<select name="activity">${activities.map(activity => `<option value="${activity.id}">${escape(activity.name)}</option>`).join("")}</select>`, "Lancer");
  return activities.find(activity => activity.id === choice?.activity) ?? null;
}

/** Create a visible, system-native effect; no third-party automation module is needed. */
async function createMarker(actor, item, marker, { name, duration = {}, extra = {} } = {}) {
  const old = actor.effects.filter(effect => flag(effect, marker));
  if (old.length) await actor.deleteEmbeddedDocuments("ActiveEffect", old.map(effect => effect.id));
  const source = item.effects?.find(effect => flag(effect, marker));
  const data = source ? source.toObject() : {
    name, img: ICON, type: "base", transfer: false, disabled: false,
    system: { changes: [], magical: true }
  };
  delete data._id;
  data.origin = item.uuid;
  data.duration = { ...data.duration, ...duration };
  data.start = ActiveEffect.implementation.getEffectStart();
  data.flags = { ...data.flags, [MODULE_ID]: { cartomancien: { ...data.flags?.[MODULE_ID]?.cartomancien, [marker]: true, ...extra } } };
  return actor.createEmbeddedDocuments("ActiveEffect", [data]);
}

export function registerFeatureAutomation(api) {
  const busy = new Set();
  const resolvingJackpot = new Set();
  const lastSpells = new Map();
  const actorKey = actor => actor.uuid ?? actor.id;
  const cardLabel = card => {
    const def = api.getCardDef(api.getArcanaIndex(card));
    return def ? `${def.roman} — ${def.name}` : card.name;
  };

  function warn(text) { ui.notifications.warn(text); return null; }

  async function prepare(kind, actor, item) {
    if (kind === "draw") return { execute: () => api.drawOne(actor) };
    if (kind === "resume") {
      if (!flag(actor, "jackpotPending")?.length) return warn("Aucun sort de Jackpot en attente.");
      return { execute: () => resolveJackpot(actor) };
    }
    if (kind === "dismiss") {
      const effects = actor.effects.filter(effect => flag(effect, "mageHand"));
      if (!effects.length) return warn("La Main du Parieur n'est pas invoquée.");
      return { execute: () => actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(effect => effect.id)) };
    }
    if (kind === "mage") {
      const spell = await findSpell(actor, "Mage Hand", 0);
      if (!spell) return warn("Mage Hand est introuvable dans les sorts disponibles. Ajoutez ce sort à la fiche ou activez son compendium.");
      const clone = spell.clone({ "system.duration.units": "perm", "system.duration.value": "", "system.ability": "int" }, { keepId: true });
      const activity = await chooseSpellActivity(clone);
      if (!activity) return null;
      activity.updateSource({ "activation.type": "bonus", "activation.override": true, "duration.units": "perm", "duration.value": "", "duration.override": true });
      // The feature supplies the Bonus Action; the spell must not spend it a second time.
      return { before: async () => Boolean(await activity.use({ consume: { spellSlot: false, action: false } }, {}, {})),
        execute: () => createMarker(actor, item, "mageHand", { name: "Main du Parieur — invoquée" }) };
    }
    if (kind === "range") {
      if (game.combat?.started && game.combat.combatant?.actor?.uuid !== actor.uuid) return warn("Miser sa vie s'utilise pendant votre tour.");
      return { execute: () => createMarker(actor, item, "range60", {
        name: "Miser sa vie — Touch 60 ft", duration: { value: 6, units: "seconds" },
        extra: { turnKey: turnKey(), expiresAt: game.time.worldTime + 6 }
      }) };
    }
    if (kind === "jackpot") {
      if (flag(actor, "jackpotPending")?.length) return warn("Terminez d'abord les sorts du Jackpot précédent avec « Reprendre le Jackpot ».");
      if (flag(actor, "jackpotMystery") !== true) return warn("Aucune Carte Mystère disponible : elle se reçoit après un Long Rest.");
      const choice = await input("Jouer la Carte Mystère", "<p>La Carte Mystère sera jouée et son résultat révélé. Les sorts interrompus pourront être repris sans relancer le d20.</p>", "Jouer");
      if (!choice) return null;
      return { execute: async () => {
        const roll = await new Roll("1d20").evaluate();
        const state = nextJackpot(flag(actor, "jackpotStreak"), roll.total);
        await actor.update({ [`flags.${MODULE_ID}.cartomancien.jackpotStreak`]: state.streak,
          [`flags.${MODULE_ID}.cartomancien.jackpotMystery`]: false, [`flags.${MODULE_ID}.cartomancien.jackpotPending`]: state.results });
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: state.results.length > 1 ? "777 — JACKPOT !" : `Carte Mystère — ${escape(JACKPOT_SPELLS[roll.total - 1][0])}` });
        await resolveJackpot(actor);
      } };
    }

    const { deck, hand, discard } = await api.getStacks(actor);
    if (!deck || !hand || !discard) return warn("Initialisez d'abord le deck du Cartomancien.");
    if (![deck, hand, discard].every(stack => stack.isOwner)) return warn("Vous devez être propriétaire du deck, de la main et de la défausse.");

    if (kind === "peek") {
      const card = topCards(deck)[0];
      if (!card) return warn("Votre deck est vide.");
      // Reveal only after native consumption succeeds: cancelling cannot provide a free peek.
      return { execute: async () => {
        const choice = await input("Miser sa vie — Carte du dessus", `<p><strong>${escape(cardLabel(card))}</strong></p><select name="position"><option value="top">Laisser dessus</option><option value="bottom">Placer dessous</option></select>`, "Placer");
        if (choice?.position === "bottom") {
          const bottom = Math.max(...deck.cards.map(entry => Number(entry.sort ?? 0)));
          await card.update({ sort: bottom + (CONST.SORT_INTEGER_DENSITY ?? 100000) });
        }
      } };
    }
    if (kind === "fold") {
      if (Number(item.system.uses.spent ?? 0) <= 0) return warn("Vos jetons sont déjà au maximum.");
      if (!hand.cards.size) return warn("Votre main est vide.");
      const ids = await chooseCards("Se coucher", [...hand.cards], { label: cardLabel });
      if (!ids) return null;
      return { execute: async () => {
        await hand.cards.get(ids[0]).pass(discard, { chatNotification: false, updateData: { face: 0 } });
        await item.update({ "system.uses.spent": Math.max(0, Number(item.system.uses.spent ?? 0) - 2) });
      } };
    }
    if (kind === "against") {
      const count = hand.cards.size;
      if (!count) return warn("Votre main est vide.");
      const choice = await input("Contre toute attente", `<p>À la place d'une pioche autorisée, remettez vos ${count} cartes dans le deck, mélangez, puis repiochez ${count} cartes.</p>`, "Remplacer cette pioche");
      if (!choice) return null;
      return { execute: async () => {
        for (const card of [...hand.cards]) await card.recall({ chatNotification: false });
        await deck.shuffle({ chatNotification: false });
        await deck.deal([hand], count, { chatNotification: false });
      } };
    }
    if (kind === "destiny") {
      const available = topCards(deck);
      if (!available.length) return warn("Votre deck est vide.");
      const ids = await chooseCards("Parieur du destin", available, { label: cardLabel, hint: "<p>Cette carte remplace une pioche autorisée.</p>" });
      if (!ids) return null;
      return { execute: () => deck.cards.get(ids[0]).pass(hand, { chatNotification: false, updateData: { face: 0 } }) };
    }
    if (kind === "eclat") {
      const hp = actor.system.attributes.hp;
      if (Number(hp.value) >= Number(hp.max) / 2) return warn("Coup d'éclat nécessite moins de la moitié de vos points de vie maximum, après avoir subi des dégâts.");
      const available = topCards(deck);
      if (!available.length && !discard.cards.size) return warn("Le deck et la défausse sont vides.");
      const choice = await input("Coup d'éclat", "<p>Après avoir subi des dégâts, piochez une carte. Elle lancera son prochain sort au niveau 9 et conservera ce pouvoir jusqu'au prochain Long Rest.</p>", "Piocher");
      if (!choice) return null;
      return { execute: async () => {
        let card = available[0];
        if (!card) {
          const cards = [...discard.cards];
          const roll = await new Roll(`1d${cards.length}`).evaluate();
          card = cards[roll.total - 1];
        }
        const index = api.getArcanaIndex(card);
        await card.pass(hand, { chatNotification: false, updateData: { face: 0, [`flags.${MODULE_ID}.cartomancien.coupEclat`]: true } });
        const drawn = hand.cards.find(entry => api.getArcanaIndex(entry) === index);
        if (drawn) await drawn.setFlag(MODULE_ID, "cartomancien.coupEclat", true);
        await notifyChat(actor, "<p>Coup d'éclat : une carte a été piochée. Son prochain sort sera lancé au niveau 9.</p>");
      } };
    }
    if (kind === "redraw") return prepareRedraw(actor, item, { deck, hand });
    if (kind === "double") return prepareDouble(actor, { deck, hand, discard });
    return null;
  }

  async function prepareRedraw(actor, item, { deck, hand }) {
    const max = Math.min(3, topCards(deck).length);
    const min = Math.max(0, 3 - hand.cards.size);
    if (min > max) return warn("Vous ne pourrez pas remettre trois cartes dans le deck.");
    const choice = await input("Recomposer la main", `<p>Piochez jusqu'à trois cartes, puis remettez exactement trois cartes dans le deck.</p><label>Cartes à piocher <select name="count">${Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => `<option value="${n}" ${n === max ? "selected" : ""}>${n}</option>`).join("")}</select></label>`, "Piocher");
    if (!choice) return null;
    const count = Number(choice.count);
    if (!Number.isInteger(count) || count < min || count > max) return null;
    // Draws must stay hidden until the action and its tokens are spent.
    return { execute: async () => {
      if (count) await deck.deal([hand], count, { chatNotification: false });
      await actor.setFlag(MODULE_ID, "cartomancien.redrawPending", true);
      await finishRedraw(actor, { deck, hand });
    } };
  }

  async function finishRedraw(actor, stacks) {
    const { deck, hand } = stacks ?? await api.getStacks(actor);
    if (!flag(actor, "redrawPending")) return;
    const ids = await chooseCards("Recomposer la main — Remettre trois cartes", [...hand.cards], { count: 3, label: cardLabel,
      hint: "<p>Les cartes sont piochées et les jetons dépensés. Si vous fermez cette fenêtre, utilisez à nouveau cette activité pour terminer sans dépenser de jetons supplémentaires.</p>" });
    if (!ids) return;
    for (const id of ids) await hand.cards.get(id).recall({ chatNotification: false });
    await deck.shuffle({ chatNotification: false });
    await actor.unsetFlag(MODULE_ID, "cartomancien.redrawPending");
  }

  async function prepareDouble(actor, { deck, hand, discard }) {
    const previous = lastSpells.get(actorKey(actor));
    if (!previous || !["attack", "save"].includes(previous.activity.type)) return warn("Lancez d'abord le sort concerné (activité d'attaque ou de sauvegarde) pendant cette session.");
    const level = previous.level;
    const cards = [...hand.cards].filter(card => {
      const cardLevel = api.getCardDef(api.getArcanaIndex(card))?.spellLevel;
      // Influx permits the stated ceiling, not every intermediate level.
      const boosted = flag(card, "coupEclat") ? 9 : influxLevel(api.getCartomancerLevel(actor), cardLevel);
      return cardLevel === level || boosted === level;
    });
    if (!cards.length) return warn(`Aucune carte en main ne peut lancer un sort au niveau ${level}.`);
    const ids = await chooseCards("Doubler la mise", cards, { label: cardLabel,
      hint: `<p>Après un échec à l'attaque ou une sauvegarde réussie contre <strong>${escape(previous.activity.item.name)}</strong> (niveau ${level}), défaussez une carte compatible pour refaire le jet.</p>` });
    if (!ids) return null;
    const activity = previous.activity;
    let targets;
    if (activity.type === "save") {
      targets = previous.message?.system?.targets ?? [];
      if (!targets.length) return warn("Aucune cible enregistrée pour ce sort. Ciblez les créatures lors du lancement initial.");
      const selection = await input("Sauvegardes à refaire", `<p>Cochez seulement les créatures ayant réussi leur sauvegarde.</p>${targets.map((target, i) => `<label style="display:block"><input type="checkbox" name="target${i}" value="yes"> ${escape(target.name ?? target.actor?.name ?? `Cible ${i + 1}`)}</label>`).join("")}`, "Demander les sauvegardes");
      if (!selection) return null;
      targets = targets.filter((_, i) => selection[`target${i}`]);
      if (!targets.length) return null;
    }
    return {
      before: activity.type === "attack" ? async () => Boolean((await activity.rollAttack({}, {}, { data: { flavor: "Doubler la mise — nouvelle attaque", system: { origin: previous.message?.id } } }))?.length) : null,
      execute: async () => {
        await hand.cards.get(ids[0]).pass(discard, { chatNotification: false, updateData: { face: 0 } });
        if (activity.type === "save") {
          const data = previous.message.toObject();
          delete data._id;
          data.flavor = "Doubler la mise — seules les sauvegardes réussies sont à refaire";
          data.system.targets = targets;
          data.system.buttons = data.system.buttons?.filter(button => button.action === "rollSave") ?? [];
          delete data.system.deltas;
          data.flags ??= {};
          data.flags[MODULE_ID] = { cartomancien: { doubleSave: true } };
          await ChatMessage.create(data);
        }
      }
    };
  }

  async function resolveJackpot(actor) {
    if (!actor.isOwner || resolvingJackpot.has(actorKey(actor))) return;
    resolvingJackpot.add(actorKey(actor));
    try { while (flag(actor, "jackpotPending")?.length) {
      const pending = [...flag(actor, "jackpotPending")];
      const [name, level] = JACKPOT_SPELLS[pending[0] - 1];
      const spell = await findSpell(actor, name, level);
      if (!spell) {
        ui.notifications.warn(`${name} est introuvable. Ajoutez son Spell Item puis utilisez « Reprendre le Jackpot ». Le résultat est conservé.`);
        return;
      }
      const confirmed = await input("HIT THE JACKPOT", `<p>Prochain sort : <strong>${escape(name)}</strong>, niveau ${level}. Choisissez vos cibles avant de continuer. ${pending.length} sort(s) restant(s).</p>`, "Lancer le sort");
      if (!confirmed) return;
      const clone = spell.clone({ "system.ability": "int", "flags.dnd5e.spellLevel": { value: level, base: level } }, { keepId: true });
      const activity = await chooseSpellActivity(clone);
      if (!activity) return;
      const result = await activity.use({ consume: { spellSlot: false, action: false }, spell: { slot: String(level) } }, {}, {});
      if (!result) return;
      await actor.setFlag(MODULE_ID, "cartomancien.jackpotPending", pending.slice(1));
    } } finally { resolvingJackpot.delete(actorKey(actor)); api.refreshManagers?.(actor.id); }
  }

  async function run(activity, usage, dialog, message, kind) {
    const actor = activity.actor ?? activity.item.actor;
    const item = actor.items.get(activity.item.id);
    const key = actorKey(actor);
    if (busy.has(key)) return;
    busy.add(key);
    try {
      if (flag(actor, "redrawPending") && kind !== "redraw") return warn("Terminez d'abord « Recomposer la main » en remettant trois cartes.");
      if (["peek", "range", "redraw"].includes(kind) && game.combat?.started
          && game.combat.combatant?.actor?.id !== actor.id) return warn("Miser sa vie s'utilise pendant votre tour.");
      if (kind === "redraw" && flag(actor, "redrawPending")) {
        await finishRedraw(actor);
        return;
      }
      const prepared = await prepare(kind, actor, item);
      if (!prepared) return;
      // Roll/cast dialogs must succeed before discarding a card or marking the feature used.
      if (prepared.before && !await prepared.before()) return;
      const source = item.system.activities.get(activity.id);
      const result = await source.use({ ...usage, cartomancienPrepared: true, subsequentActions: false },
        prepared.before ? { ...dialog, configure: false } : dialog, message);
      if (!result) return;
      await prepared.execute();
    } catch (error) {
      console.error(`${MODULE_ID} | ${activity.name}`, error);
      ui.notifications.error("Cartomancien : l'activité n'a pas pu être terminée. Consultez la console.");
    } finally {
      busy.delete(key);
      api.refreshManagers?.(actor.id);
    }
  }

  // Foundry's Hooks.call is synchronous. Cancel synchronously, prepare asynchronously,
  // then invoke the native use workflow once with a recursion guard.
  Hooks.on("dnd5e.preUseActivity", (activity, usage, dialog, message) => {
    if (usage.cartomancienPrepared) return;
    const actor = activity?.actor ?? activity?.item?.actor;
    if (!actor?.isOwner || !activity.item?.isOwner) return;
    const key = Object.keys(HANDLERS).find(id => activity.id === id || activity.id === id.padEnd(16, "0"));
    if (!key || !flag(activity.item, "contentKey")) return;
    void run(activity, usage, dialog, message, HANDLERS[key]);
    return false;
  });

  Hooks.on("dnd5e.postUseActivity", (activity, usage, results) => {
    const actor = activity?.actor ?? activity?.item?.actor;
    if (!actor?.isOwner || activity.item?.type !== "spell" || !["attack", "save"].includes(activity.type)) return;
    lastSpells.set(actorKey(actor), { activity, message: results.message,
      level: Number(activity.item.system.level) + Number(usage.scaling ?? 0) });
  });

  async function expireMarkers() {
    for (const actor of game.actors ?? []) {
      // Exactly one authority deletes effects on clients receiving world/combat updates.
      const authority = game.users.activeGM ?? game.users.find(user => user.active && actor.testUserPermission(user, "OWNER"));
      if (authority?.id !== game.user.id) continue;
      const expired = actor.effects.filter(effect => flag(effect, "range60") && (
        flag(effect, "turnKey") ? flag(effect, "turnKey") !== turnKey() : game.time.worldTime >= Number(flag(effect, "expiresAt"))
      ));
      if (expired.length) await actor.deleteEmbeddedDocuments("ActiveEffect", expired.map(effect => effect.id));
    }
  }
  Hooks.on("updateCombat", () => { void expireMarkers(); });
  Hooks.on("deleteCombat", () => { void expireMarkers(); });
  Hooks.on("updateWorldTime", () => { void expireMarkers(); });

  return { resolveJackpot, finishRedraw };
}
