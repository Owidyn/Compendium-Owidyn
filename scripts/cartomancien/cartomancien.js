import {
  CARTOMANCIEN_SPELLS,
  ensureContent,
  getAvailableCartomancienSpellSources,
  importSpellToActor,
  syncActorContent,
  isCartomancienSpell
} from "./content.js";
import { influxLevel, isConsecutiveDraw, cantripCount } from "./rules.js";
import { registerFeatureAutomation } from "./features.js";

const MODULE_ID = "compendium-owidyn";
const CARD_FACE_IMG = `modules/${MODULE_ID}/assets/cartomancien/tarot-card.svg`;
const CARD_BACK_IMG = `modules/${MODULE_ID}/assets/cartomancien/tarot-back.svg`;
const deckOperations = new Set();
const managers = new Set();

function withActorLock(operation) {
  return async (actor, ...args) => {
    const key = actor.uuid ?? actor.id;
    if (deckOperations.has(key)) return null;
    deckOperations.add(key);
    try { return await operation(actor, ...args); }
    finally { deckOperations.delete(key); refreshManagers(actor.id); }
  };
}

function refreshManagers(actorId) {
  for (const app of managers) {
    if (app.rendered && app.actor.id === actorId) app.render({ force: false });
  }
}

const ARCANA = [
  { index: 0,  roman: "0",    name: "Le Fou",              unlock: 1,  spellLevel: 1 },
  { index: 1,  roman: "I",    name: "Le Magicien",         unlock: 1,  spellLevel: 1 },
  { index: 2,  roman: "II",   name: "La Papesse",          unlock: 2,  spellLevel: 1 },
  { index: 3,  roman: "III",  name: "L'Impératrice",       unlock: 3,  spellLevel: 1 },
  { index: 4,  roman: "IV",   name: "L'Empereur",          unlock: 3,  spellLevel: 2 },
  { index: 5,  roman: "V",    name: "Le Hiérophante",      unlock: 3,  spellLevel: 2 },
  { index: 6,  roman: "VI",   name: "L'Amoureux",          unlock: 4,  spellLevel: 2 },
  { index: 7,  roman: "VII",  name: "Le Chariot",          unlock: 5,  spellLevel: 3 },
  { index: 8,  roman: "VIII", name: "La Force",            unlock: 5,  spellLevel: 3 },
  { index: 9,  roman: "IX",   name: "L'Hermite",           unlock: 6,  spellLevel: 3 },
  { index: 10, roman: "X",    name: "La Roue de Fortune",  unlock: 7,  spellLevel: 4 },
  { index: 11, roman: "XI",   name: "La Justice",          unlock: 8,  spellLevel: 4 },
  { index: 12, roman: "XII",  name: "Le Pendu",            unlock: 9,  spellLevel: 4 },
  { index: 13, roman: "XIII", name: "La Mort",             unlock: 9,  spellLevel: 5 },
  { index: 14, roman: "XIV",  name: "Tempérance",          unlock: 10, spellLevel: 5 },
  { index: 15, roman: "XV",   name: "Le Diable",           unlock: 18, spellLevel: 5 },
  { index: 16, roman: "XVI",  name: "La Tour",             unlock: 11, spellLevel: 6 },
  { index: 17, roman: "XVII", name: "L'Étoile",            unlock: 19, spellLevel: 6 },
  { index: 18, roman: "XVIII",name: "La Lune",             unlock: 13, spellLevel: 7 },
  { index: 19, roman: "XIX",  name: "Le Soleil",           unlock: 20, spellLevel: 7 },
  { index: 20, roman: "XX",   name: "Le Jugement",         unlock: 15, spellLevel: 8 },
  { index: 21, roman: "XXI",  name: "Le Monde",            unlock: 17, spellLevel: 9 }
];

const normalize = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

function getCartomancerClass(actor) {
  return actor.items.find(item => {
    if (item.type !== "class") return false;
    const id = normalize(item.system?.identifier ?? "");
    const name = normalize(item.name);
    return id === "cartomancien" || id === "cartomancer" || name === "cartomancien" || name === "le cartomancien" || name === "cartomancer" || name === "the cartomancer";
  });
}

function getCartomancerLevel(actor) {
  const cls = getCartomancerClass(actor);
  return Number(cls?.system?.levels ?? 0);
}

function getPB(actor) {
  return Number(actor.system?.attributes?.prof ?? 2);
}

function getHandCount(actor, hand) {
  return (hand?.cards?.size ?? 0) + (actor.getFlag(MODULE_ID, "cartomancien.jackpotMystery") ? 1 : 0);
}

function getCardDef(index) {
  return ARCANA.find(c => c.index === Number(index));
}

function getActorSpells(actor, level) {
  return actor.items
    .filter(item => item.type === "spell"
      && Number(item.system?.level ?? 0) === Number(level)
      && isCartomancienSpell(item.name, level))
    .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
}

function cardLabel(def) {
  return `${def.roman} — ${def.name}`;
}

function getArcanaIndex(card) {
  return Number(card?.getFlag?.(MODULE_ID, "cartomancien.arcanaIndex") ?? card?.flags?.[MODULE_ID]?.cartomancien?.arcanaIndex ?? -1);
}

function getSourceCard(deck, cardOrIndex) {
  const index = typeof cardOrIndex === "number" ? cardOrIndex : getArcanaIndex(cardOrIndex);
  return deck?.cards?.find(c => getArcanaIndex(c) === index) ?? null;
}

function spellNameFromUuid(uuid) {
  if (!uuid) return "— aucun sort lié —";
  const doc = fromUuidSync(uuid);
  return doc?.name ?? "— sort introuvable —";
}

async function ensureStacks(actor) {
  let ids = actor.getFlag(MODULE_ID, "cartomancien.stacks") ?? {};
  let deck = ids.deckId ? game.cards.get(ids.deckId) : null;
  let hand = ids.handId ? game.cards.get(ids.handId) : null;
  let discard = ids.discardId ? game.cards.get(ids.discardId) : null;

  const ownership = foundry.utils.deepClone(actor.ownership ?? {});
  ownership.default ??= CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;

  if (!deck) {
    deck = await Cards.implementation.create({
      name: `${actor.name} — Deck du Cartomancien`,
      type: "deck",
      displayCount: true,
      ownership,
      flags: { [MODULE_ID]: { cartomancien: { actorId: actor.id, role: "deck" } } }
    });
  }
  if (!hand) {
    hand = await Cards.implementation.create({
      name: `${actor.name} — Main du Cartomancien`,
      type: "hand",
      displayCount: true,
      ownership,
      flags: { [MODULE_ID]: { cartomancien: { actorId: actor.id, role: "hand" } } }
    });
  }
  if (!discard) {
    discard = await Cards.implementation.create({
      name: `${actor.name} — Défausse du Cartomancien`,
      type: "pile",
      displayCount: true,
      ownership,
      flags: { [MODULE_ID]: { cartomancien: { actorId: actor.id, role: "discard" } } }
    });
  }

  const nextIds = { deckId: deck.id, handId: hand.id, discardId: discard.id };
  if (JSON.stringify(ids) !== JSON.stringify(nextIds)) await actor.setFlag(MODULE_ID, "cartomancien.stacks", nextIds);
  return { deck, hand, discard };
}

async function getStacks(actor) {
  const ids = actor.getFlag(MODULE_ID, "cartomancien.stacks") ?? {};
  return {
    deck: ids.deckId ? game.cards.get(ids.deckId) : null,
    hand: ids.handId ? game.cards.get(ids.handId) : null,
    discard: ids.discardId ? game.cards.get(ids.discardId) : null
  };
}

async function syncCardImages(stacks) {
  for (const stack of [stacks.deck, stacks.hand, stacks.discard].filter(Boolean)) {
    for (const card of [...stack.cards]) {
      const source = card.toObject();
      const faces = foundry.utils.deepClone(source.faces ?? []);
      if (faces[0]) faces[0].img = CARD_FACE_IMG;
      const back = { ...(foundry.utils.deepClone(source.back ?? {})), img: CARD_BACK_IMG };
      await card.update({ faces, back }, { render: false });
    }
  }
}

function makeCardData(def, actor) {
  const label = cardLabel(def);
  return {
    name: label,
    type: "base",
    suit: "Arcane majeur",
    value: def.index,
    face: 0,
    drawn: false,
    faces: [{ name: label, img: CARD_FACE_IMG, text: `Sort de niveau ${def.spellLevel}` }],
    back: { name: "Dos du tarot", img: CARD_BACK_IMG },
    description: `<p><strong>${label}</strong></p><p>Cette carte lance le sort qui lui est lié comme un sort de niveau ${def.spellLevel}.</p>`,
    flags: {
      [MODULE_ID]: {
        cartomancien: {
          actorId: actor.id,
          arcanaIndex: def.index,
          spellLevel: def.spellLevel,
          unlockLevel: def.unlock,
          spellUuid: ""
        }
      }
    }
  };
}

async function chooseSpellForCard(actor, deck, arcanaIndex, { consumeCredit = false } = {}) {
  if (!actor.isOwner) return false;
  const def = getCardDef(arcanaIndex);
  const sourceCard = getSourceCard(deck, arcanaIndex);
  if (!def || !sourceCard) return false;

  const currentUuid = sourceCard.getFlag(MODULE_ID, "cartomancien.spellUuid") ?? "";
  if (consumeCredit && currentUuid && Number(actor.getFlag(MODULE_ID, "cartomancien.replacementCredits") ?? 0) <= 0) {
    ui.notifications.warn("Aucun changement de sort disponible pour ce niveau de Cartomancien.");
    return false;
  }
  const currentSpell = currentUuid ? await fromUuid(currentUuid) : null;
  const { available, missing } = await getAvailableCartomancienSpellSources(def.spellLevel, { actor });
  // Each card records one preparation slot, not an exclusive spell restriction.
  const preparedElsewhere = new Set(deck.cards.filter(c => c.id !== sourceCard.id)
    .map(c => c.getFlag(MODULE_ID, "cartomancien.spellUuid")).filter(Boolean));
  for (let i = available.length - 1; i >= 0; i--) {
    const candidate = await fromUuid(available[i].uuid);
    if (candidate && [...preparedElsewhere].some(uuid => {
      const prepared = fromUuidSync(uuid);
      return prepared && normalize(prepared.name) === normalize(candidate.name);
    })) available.splice(i, 1);
  }

  if (!available.length) {
    ui.notifications.warn(`Aucun sort utilisable de niveau ${def.spellLevel} de la liste du Cartomancien n'est disponible dans tes compendiums.`);
    return false;
  }

  const currentKey = currentSpell ? normalize(currentSpell.name) : "";
  const options = available.map(s => {
    const selected = currentKey && normalize(s.name) === currentKey ? "selected" : "";
    const suffix = s.owned ? " — sur la fiche" : " — compendium";
    return `<option value="${s.uuid}" ${selected}>${foundry.utils.escapeHTML(s.name + suffix)}</option>`;
  }).join("");
  const missingNote = missing.length
    ? `<p class="hint"><strong>${missing.length}</strong> sort(s) de la liste ne sont pas disponibles comme Spell Item dans les compendiums actuellement activés.</p>`
    : "";

  const result = await foundry.applications.api.DialogV2.input({
    window: { title: `${cardLabel(def)} — choisir le sort` },
    content: `
      <div class="form-group">
        <label>Sort de Cartomancien niveau ${def.spellLevel}</label>
        <select name="spellUuid">${options}</select>
      </div>
      <p>La carte ne peut recevoir qu'un sort de la <strong>Spell List du Cartomancien</strong> et exactement de son niveau.</p>
      <p>Si le sort vient d'un compendium, il sera automatiquement ajouté à la fiche du personnage.</p>
      ${missingNote}`,
    ok: { label: "Lier ce sort" },
    rejectClose: false,
    modal: true
  });

  const selectedUuid = result?.spellUuid;
  if (!selectedUuid) return false;
  let spell = await fromUuid(selectedUuid);
  if (!spell || spell.type !== "spell" || Number(spell.system?.level ?? 0) !== def.spellLevel
      || !isCartomancienSpell(spell.name, def.spellLevel)) {
    ui.notifications.error("Le sort choisi n'est pas valide pour cette carte.");
    return false;
  }

  if (spell.parent?.id !== actor.id) {
    spell = await importSpellToActor(actor, selectedUuid);
    if (!spell) {
      ui.notifications.error("Impossible d'ajouter ce sort à la fiche du personnage.");
      return false;
    }
  }

  if (consumeCredit && currentUuid && currentUuid !== spell.uuid) {
    const credits = Number(actor.getFlag(MODULE_ID, "cartomancien.replacementCredits") ?? 0);
    if (credits <= 0) {
      ui.notifications.warn("Aucun changement de sort disponible pour ce niveau de Cartomancien.");
      return false;
    }
    await actor.setFlag(MODULE_ID, "cartomancien.replacementCredits", credits - 1);
  }

  await sourceCard.setFlag(MODULE_ID, "cartomancien.spellUuid", spell.uuid);
  ui.notifications.info(`${cardLabel(def)} est maintenant liée à ${spell.name}.`);
  return true;
}

const syncActor = withActorLock(async function (actor, { promptAssignments = true } = {}) {
  if (!actor.isOwner) return ui.notifications.warn("Tu dois contrôler ce personnage pour synchroniser son deck.");
  const level = getCartomancerLevel(actor);
  if (!level) {
    ui.notifications.warn("Classe Cartomancien introuvable sur cette fiche.");
    return null;
  }

  const firstSetup = !actor.getFlag(MODULE_ID, "cartomancien.initialized");
  const previousLevel = Number(actor.getFlag(MODULE_ID, "cartomancien.lastSyncedLevel") ?? level);
  const stacks = await ensureStacks(actor);
  await syncActorContent(actor);
  await syncCardImages(stacks);
  const eligible = ARCANA.filter(c => c.unlock <= level);
  // Keep a reversible copy of premature cards from 0.2.1 or level reductions.
  const archived = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "cartomancien.archivedCards") ?? {});
  const retired = [...stacks.deck.cards].filter(card => getCardDef(getArcanaIndex(card))?.unlock > level);
  for (const source of retired) archived[getArcanaIndex(source)] = source.toObject();
  if (retired.length) {
    await actor.setFlag(MODULE_ID, "cartomancien.archivedCards", archived);
    for (const source of retired) {
      const copy = [...stacks.hand.cards, ...stacks.discard.cards].find(c => getArcanaIndex(c) === getArcanaIndex(source));
      if (copy) await copy.recall();
    }
    await stacks.deck.deleteEmbeddedDocuments("Card", retired.map(card => card.id));
  }
  const existing = new Set(stacks.deck.cards.map(getArcanaIndex));
  const missing = eligible.filter(c => !existing.has(c.index));

  let created = [];
  if (missing.length) {
    created = await stacks.deck.createEmbeddedDocuments("Card", missing.map(def => {
      const data = makeCardData(def, actor);
      const saved = archived[def.index]?.flags?.[MODULE_ID]?.cartomancien?.spellUuid;
      if (saved) data.flags[MODULE_ID].cartomancien.spellUuid = saved;
      return data;
    }));
  }

  let credits = Number(actor.getFlag(MODULE_ID, "cartomancien.replacementCredits") ?? 0);
  if (!firstSetup && level > previousLevel) credits += level - previousLevel;

  await actor.update({
    [`flags.${MODULE_ID}.cartomancien.initialized`]: true,
    [`flags.${MODULE_ID}.cartomancien.lastSyncedLevel`]: level,
    [`flags.${MODULE_ID}.cartomancien.replacementCredits`]: credits
  });

  if (promptAssignments) {
    for (const card of [...stacks.deck.cards].filter(c => !c.getFlag(MODULE_ID, "cartomancien.spellUuid"))) {
      const index = getArcanaIndex(card);
      await chooseSpellForCard(actor, stacks.deck, index, { consumeCredit: false });
    }
  }

  if (firstSetup && stacks.hand.cards.size === 0) {
    await stacks.deck.shuffle();
    const n = Math.min(getPB(actor), stacks.deck.availableCards.length);
    if (n > 0) await stacks.deck.deal([stacks.hand], n, { chatNotification: false });
  }

  if (missing.length) ui.notifications.info(`${missing.length} nouvelle(s) carte(s) ajoutée(s) au deck.`);
  else ui.notifications.info("Deck déjà synchronisé avec le niveau du Cartomancien.");
  return stacks;
});

const drawOne = withActorLock(async function (actor) {
  if (!actor.isOwner) return false;
  if (actor.getFlag(MODULE_ID, "cartomancien.redrawPending")) return ui.notifications.warn("Remets d'abord les trois cartes de Recomposer la main.");
  const { deck, hand } = await getStacks(actor);
  if (!deck || !hand) return ui.notifications.warn("Initialise d'abord le deck du Cartomancien.");
  const pb = getPB(actor);
  if (getHandCount(actor, hand) >= pb) return ui.notifications.warn(`Ta main contient déjà ${getHandCount(actor, hand)} carte(s), soit au moins ton bonus de maîtrise (${pb}).`);
  if (!deck.availableCards.length) return ui.notifications.warn("Aucune carte disponible dans le deck.");

  if (game.combat?.started) {
    if (game.combat.combatant?.actor?.id !== actor.id) {
      ui.notifications.warn("La pioche gratuite n'est possible que pendant ton tour.");
      return false;
    }
    const turnKey = `${game.combat.id}:${game.combat.round}:${game.combat.turn}`;
    const last = actor.getFlag(MODULE_ID, "cartomancien.lastCombatDraw");
    if (last === turnKey) return ui.notifications.warn("Tu as déjà utilisé ta pioche gratuite pendant ce tour.");
  }

  await deck.deal([hand], 1, { chatNotification: false });
  if (game.combat?.started) await actor.setFlag(MODULE_ID, "cartomancien.lastCombatDraw", `${game.combat.id}:${game.combat.round}:${game.combat.turn}`);
  ui.notifications.info("1 carte piochée.");
  return true;
});

const castFromCard = withActorLock(async function (actor, handCardId, { spellLevel: forcedLevel } = {}) {
  if (!actor.isOwner) return null;
  if (actor.getFlag(MODULE_ID, "cartomancien.redrawPending")) return ui.notifications.warn("Remets d'abord les trois cartes de Recomposer la main.");
  const { deck, hand, discard } = await getStacks(actor);
  if (!deck || !hand || !discard) return ui.notifications.warn("Deck du Cartomancien incomplet.");
  const handCard = hand.cards.get(handCardId);
  if (!handCard) return ui.notifications.warn("Carte introuvable dans la main.");
  const index = getArcanaIndex(handCard);
  const def = getCardDef(index);
  const sourceCard = getSourceCard(deck, index);
  if (!def) return null;
  const divine = def.index === 21 && getCartomancerLevel(actor) >= 20;
  const prepared = await getPreparedSpells(actor, deck);
  const choices = prepared.filter(spell => divine || Number(spell.system.level) === def.spellLevel);
  if (!choices.length) return ui.notifications.warn("Prépare d'abord un sort de ce niveau dans le gestionnaire.");
  let spell = choices.find(s => s.uuid === sourceCard?.getFlag(MODULE_ID, "cartomancien.spellUuid")) ?? choices[0];
  if (choices.length > 1) {
    const result = await foundry.applications.api.DialogV2.input({
      window: { title: `${cardLabel(def)} — sort préparé` },
      content: `<div class="form-group"><label>Sort</label><select name="spellUuid">${choices.map(s => `<option value="${s.uuid}" ${s.uuid === spell.uuid ? "selected" : ""}>${foundry.utils.escapeHTML(s.name)}</option>`).join("")}</select></div>`,
      ok: { label: "Choisir" }, rejectClose: false, modal: true
    });
    spell = choices.find(s => s.uuid === result?.spellUuid);
    if (!spell) return null;
  }
  const baseLevel = Number(spell.system.level);
  let castLevel = forcedLevel ?? ((divine || handCard.getFlag(MODULE_ID, "cartomancien.coupEclat")) ? 9 : baseLevel);
  if (!forcedLevel && castLevel !== 9 && influxLevel(getCartomancerLevel(actor), baseLevel) > baseLevel) {
    const choice = await foundry.applications.api.DialogV2.wait({
      window: { title: "Pouvoir d'influx" },
      content: `<p>Lancer ${foundry.utils.escapeHTML(spell.name)} au niveau ${influxLevel(getCartomancerLevel(actor), baseLevel)} ?</p>`,
      buttons: [
        { action: "influx", label: "Avec influx", default: true, callback: () => influxLevel(getCartomancerLevel(actor), baseLevel) },
        { action: "normal", label: "Niveau normal", callback: () => baseLevel },
        { action: "cancel", label: "Annuler", callback: () => null }
      ], rejectClose: false, modal: true
    });
    if (!Number.isInteger(choice)) return null;
    castLevel = choice;
  }
  // Fixed scaling avoids a multiclass slot overriding the card's level.
  const castItem = spell.clone({ "flags.dnd5e.spellLevel": { value: castLevel, base: baseLevel }, "system.ability": "int" }, { keepId: true });
  const activities = [...castItem.system.activities.values()].filter(a => typeof a.use === "function" && !a.isRider);
  let activity = activities[0];
  if (activities.length > 1) {
    const choice = await foundry.applications.api.DialogV2.input({
      window: { title: "Choisir l'activité du sort" },
      content: `<select name="activityId">${activities.map(a => `<option value="${a.id}">${foundry.utils.escapeHTML(a.name)}</option>`).join("")}</select>`,
      ok: { label: "Lancer" }, rejectClose: false, modal: true
    });
    activity = activities.find(a => a.id === choice?.activityId);
  }
  if (!activity) return null;

  let result;
  try {
    result = await activity.use({ consume: { spellSlot: false }, spell: { slot: castLevel }, scaling: castLevel - baseLevel }, {}, {});
  } catch (err) {
    console.error(`${MODULE_ID} | erreur de lancement`, err);
    ui.notifications.error(`Impossible de lancer ${spell.name}. Voir la console F12.`);
    return;
  }

  if (!result) return null;
  if (handCard.getFlag(MODULE_ID, "cartomancien.coupEclat")) await handCard.unsetFlag(MODULE_ID, "cartomancien.coupEclat");
  await handCard.pass(discard, { updateData: { face: 0 } });
  ui.notifications.info(`${cardLabel(def)} a été défaussée après avoir lancé ${spell.name}.`);
  return result;
});

async function getPreparedSpells(actor, deck) {
  const uuids = new Set([...deck.cards].map(c => c.getFlag(MODULE_ID, "cartomancien.spellUuid")).filter(Boolean));
  const spells = [];
  for (const uuid of uuids) {
    const spell = await fromUuid(uuid);
    if (spell?.type === "spell" && spell.parent?.id === actor.id) spells.push(spell);
  }
  return spells;
}

async function learnCantrips(actor) {
  if (!actor.isOwner) return;
  const limit = cantripCount(getCartomancerLevel(actor));
  const known = actor.items.filter(item => item.type === "spell" && Number(item.system.level) === 0
    && (item.getFlag(MODULE_ID, "cartomancien.cantrip") || item.system.classIdentifier === "cartomancien"));
  const remaining = Math.max(0, limit - known.length);
  if (!remaining) return ui.notifications.info(`Les ${limit} sorts mineurs de la classe sont déjà choisis.`);
  const { available } = await getAvailableCartomancienSpellSources(0, { actor });
  const choices = available.filter(entry => !known.some(item => normalize(item.name) === normalize(entry.name)));
  if (!choices.length) return ui.notifications.warn("Aucun sort mineur de la liste n'est disponible. Active son compendium ou ajoute son Spell Item.");
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: "Sorts mineurs du Cartomancien" },
    content: `<p>Choisis jusqu'à ${remaining} sort(s) mineur(s). Mage Hand offert par le Parieur est appris séparément.</p>${choices.map(entry => `<label style="display:block"><input type="checkbox" name="cantrip" value="${entry.uuid}"> ${foundry.utils.escapeHTML(entry.name)}</label>`).join("")}`,
    buttons: [{ action: "learn", label: "Apprendre", default: true,
      callback: (event, button) => [...button.form.querySelectorAll('input[name="cantrip"]:checked')].map(el => el.value) }],
    rejectClose: false, modal: true
  });
  if (!Array.isArray(result) || !result.length) return;
  if (result.length > remaining) return ui.notifications.warn(`Tu peux encore apprendre ${remaining} sort(s) mineur(s).`);
  for (const uuid of new Set(result)) {
    if (!choices.some(entry => entry.uuid === uuid)) continue;
    const spell = await importSpellToActor(actor, uuid);
    if (spell) await spell.update({ [`flags.${MODULE_ID}.cartomancien.cantrip`]: true, "system.ability": "int", "system.prepared": 2 });
  }
  ui.notifications.info("Sorts mineurs ajoutés à la fiche.");
}

const longRest = withActorLock(async function (actor) {
  if (!actor.isOwner) return null;
  const { deck, hand, discard } = await getStacks(actor);
  if (!deck || !hand || !discard) return ui.notifications.warn("Initialise d'abord le deck du Cartomancien.");
  await actor.update({ [`flags.${MODULE_ID}.cartomancien.jackpotMystery`]: false, [`flags.${MODULE_ID}.cartomancien.restPending`]: true });
  await actor.unsetFlag(MODULE_ID, "cartomancien.redrawPending");
  for (const stack of [deck, hand, discard]) {
    for (const card of stack.cards) {
      if (card.getFlag(MODULE_ID, "cartomancien.coupEclat")) await card.unsetFlag(MODULE_ID, "cartomancien.coupEclat");
    }
  }

  const handCards = [...hand.cards];
  let discardIds = [];
  if (handCards.length) {
    const content = `<p>Choisis les cartes de ta main à défausser avant le mélange.</p>` + handCards.map(c => {
      const def = getCardDef(getArcanaIndex(c));
      return `<label style="display:block;margin:4px 0"><input type="checkbox" name="discard" value="${c.id}"> ${foundry.utils.escapeHTML(cardLabel(def))}</label>`;
    }).join("");
    const choice = await foundry.applications.api.DialogV2.wait({
      window: { title: "Long Rest — Main magique" },
      content,
      buttons: [
        {
          action: "continue",
          label: "Continuer",
          default: true,
          callback: (event, button) => [...button.form.querySelectorAll('input[name="discard"]:checked')].map(el => el.value)
        },
        { action: "cancel", label: "Annuler", callback: () => null }
      ],
      rejectClose: false,
      modal: true
    });
    if (!Array.isArray(choice)) return null;
    discardIds = Array.isArray(choice) ? choice : [];
  }

  for (const id of discardIds) {
    const card = hand.cards.get(id);
    if (card) await card.pass(discard, { updateData: { face: 0 } });
  }

  for (const card of [...discard.cards]) await card.recall();
  await deck.shuffle();

  const n = Math.min(getPB(actor), deck.availableCards.length);
  const previousHand = new Set(hand.cards.map(c => c.id));
  if (n > 0) await deck.deal([hand], n, { chatNotification: false });
  const drawn = [...hand.cards].filter(c => !previousHand.has(c.id));
  const world = getSourceCard(deck, 21);
  if (getCartomancerLevel(actor) >= 20 && world && !world.drawn && drawn.length) {
    const choice = await foundry.applications.api.DialogV2.input({
      window: { title: "Carte divine" },
      content: `<p>Remplacer une carte que tu viens de piocher par XXI — Le Monde ?</p><select name="cardId"><option value="">Garder le tirage</option>${drawn.map(c => `<option value="${c.id}">${foundry.utils.escapeHTML(c.name)}</option>`).join("")}</select>`,
      ok: { label: "Valider" }, rejectClose: false, modal: true
    });
    const replaced = drawn.find(c => c.id === choice?.cardId);
    if (replaced) {
      await replaced.recall();
      await world.pass(hand, { updateData: { face: 0 } });
    }
  }
  await updateSuite(actor, hand);
  const jackpot = actor.items.find(i => i.system?.identifier === "hit-the-jackpot");
  if (jackpot) {
    const mystery = await foundry.applications.api.DialogV2.confirm({
      window: { title: "HIT THE JACKPOT — Carte Mystère" },
      content: "<p>Faire apparaître la Carte Mystère de ce repos long dans ta main ? Elle disparaît au prochain repos long.</p>",
      rejectClose: false, modal: true
    });
    await actor.setFlag(MODULE_ID, "cartomancien.jackpotMystery", mystery === true);
  }
  await actor.unsetFlag(MODULE_ID, "cartomancien.lastCombatDraw");
  await actor.unsetFlag(MODULE_ID, "cartomancien.restPending");
  ui.notifications.info(`Long Rest : défausse récupérée, deck mélangé, ${n} carte(s) piochée(s).`);
  return true;
});

async function updateSuite(actor, hand) {
  const feature = actor.items.find(i => i.system?.identifier === "la-ou-tombent-les-cartes");
  if (!feature) return;
  const previous = [...actor.effects].filter(e => e.getFlag(MODULE_ID, "cartomancien.suiteFavorable") ||
    (e.origin === feature.uuid && e.name === "Suite favorable"));
  if (previous.length) await actor.deleteEmbeddedDocuments("ActiveEffect", previous.map(e => e.id));
  if (!isConsecutiveDraw([...hand.cards].map(getArcanaIndex))) return;
  const source = [...feature.effects].find(e => e.name === "Suite favorable");
  if (!source) return;
  const effect = source.toObject();
  delete effect._id;
  effect.origin = feature.uuid;
  effect.transfer = false;
  effect.start = ActiveEffect.implementation.getEffectStart();
  effect.flags ??= {};
  effect.flags[MODULE_ID] = { ...effect.flags[MODULE_ID], cartomancien: { ...effect.flags[MODULE_ID]?.cartomancien, suiteFavorable: true } };
  await actor.createEmbeddedDocuments("ActiveEffect", [effect]);
  ui.notifications.info("Suite favorable : bonus de 1d4 et avantages conditionnels actifs pendant 24 heures.");
}

function buildCardVM(deck, card) {
  const index = getArcanaIndex(card);
  const def = getCardDef(index);
  const source = getSourceCard(deck, index) ?? card;
  const spellUuid = source?.getFlag(MODULE_ID, "cartomancien.spellUuid") ?? "";
  return {
    id: card.id,
    index,
    name: def ? cardLabel(def) : card.name,
    spellLevel: def?.spellLevel ?? "?",
    spellName: spellNameFromUuid(spellUuid),
    hasSpell: Boolean(spellUuid) || [...deck.cards].some(c => getCardDef(getArcanaIndex(c))?.spellLevel === def?.spellLevel && c.getFlag(MODULE_ID, "cartomancien.spellUuid")),
    coupEclat: card.getFlag(MODULE_ID, "cartomancien.coupEclat") === true,
    drawn: Boolean(source?.drawn)
  };
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class CartomancienManager extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    managers.add(this);
  }

  async close(options) {
    managers.delete(this);
    return super.close(options);
  }

  static DEFAULT_OPTIONS = {
    id: "cartomancien-manager",
    classes: ["cartomancien-manager"],
    tag: "div",
    window: {
      frame: true,
      positioned: true,
      title: "Cartomancien — Deck de Tarot",
      icon: "fa-solid fa-clone"
    },
    position: { width: 980, height: "auto" },
    actions: {
      sync: CartomancienManager.onSync,
      draw: CartomancienManager.onDraw,
      longRest: CartomancienManager.onLongRest,
      assign: CartomancienManager.onAssign,
      cast: CartomancienManager.onCast,
      cantrips: CartomancienManager.onCantrips,
      jackpot: CartomancienManager.onJackpot,
      resumeJackpot: CartomancienManager.onResumeJackpot,
      resumeRedraw: CartomancienManager.onResumeRedraw,
      resumeRest: CartomancienManager.onResumeRest
    }
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/cartomancien/manager.hbs` }
  };

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const level = getCartomancerLevel(this.actor);
    const pb = getPB(this.actor);
    const initialized = Boolean(this.actor.getFlag(MODULE_ID, "cartomancien.initialized"));
    const { deck, hand, discard } = await getStacks(this.actor);
    const deckCards = deck ? [...deck.cards].sort((a,b) => getArcanaIndex(a) - getArcanaIndex(b)).map(c => buildCardVM(deck, c)) : [];
    const handCards = hand ? [...hand.cards].map(c => buildCardVM(deck, c)) : [];
    const discardCards = discard ? [...discard.cards].map(c => buildCardVM(deck, c)) : [];
    return foundry.utils.mergeObject(context, {
      actorName: this.actor.name,
      level,
      pb,
      initialized,
      replacementCredits: Number(this.actor.getFlag(MODULE_ID, "cartomancien.replacementCredits") ?? 0),
      deckCards,
      handCards,
      discardCards,
      deckTotal: deckCards.length,
      deckAvailable: deck?.availableCards?.length ?? 0,
      handCount: getHandCount(this.actor, hand),
      mysteryCard: this.actor.getFlag(MODULE_ID, "cartomancien.jackpotMystery") === true,
      jackpotStreak: Number(this.actor.getFlag(MODULE_ID, "cartomancien.jackpotStreak") ?? 0),
      jackpotPending: this.actor.getFlag(MODULE_ID, "cartomancien.jackpotPending")?.length ?? 0,
      redrawPending: Boolean(this.actor.getFlag(MODULE_ID, "cartomancien.redrawPending")),
      restPending: Boolean(this.actor.getFlag(MODULE_ID, "cartomancien.restPending")),
      discardCount: discardCards.length,
      canDraw: initialized && getHandCount(this.actor, hand) < pb && (deck?.availableCards?.length ?? 0) > 0
    });
  }

  static async onSync(event, target) {
    await syncActor(this.actor, { promptAssignments: true });
    await this.render({ force: true });
  }

  static async onDraw(event, target) {
    await drawOne(this.actor);
    await this.render({ force: true });
  }

  static async onLongRest(event, target) {
    await this.actor.longRest();
    await this.render({ force: true });
  }

  static async onAssign(event, target) {
    const index = Number(target.dataset.arcana);
    const { deck } = await getStacks(this.actor);
    if (!deck) return;
    const source = getSourceCard(deck, index);
    const hasSpell = Boolean(source?.getFlag(MODULE_ID, "cartomancien.spellUuid"));
    await chooseSpellForCard(this.actor, deck, index, { consumeCredit: hasSpell });
    await this.render({ force: true });
  }

  static async onCast(event, target) {
    await castFromCard(this.actor, target.dataset.cardId);
    await this.render({ force: true });
  }

  static async onCantrips() { await learnCantrips(this.actor); }
  static async onResumeJackpot() { await featureAutomation.resolveJackpot(this.actor); await this.render({ force: true }); }
  static async onResumeRedraw() { await featureAutomation.finishRedraw(this.actor); await this.render({ force: true }); }
  static async onResumeRest() { await longRest(this.actor); }
  static async onJackpot() {
    const item = this.actor.items.find(i => i.system?.identifier === "hit-the-jackpot");
    await item?.system.activities.find(a => a.id.startsWith("PariActJackpot01"))?.use();
  }
}

function openManager(actor) {
  if (!actor) return ui.notifications.warn("Aucun personnage sélectionné.");
  if (!getCartomancerLevel(actor)) return ui.notifications.warn("Ce personnage n'a pas la classe Cartomancien.");
  new CartomancienManager(actor).render({ force: true });
}

const featureAutomation = registerFeatureAutomation({
  getStacks, getCardDef, getArcanaIndex, getSourceCard, getPB, getHandCount,
  getCartomancerLevel, drawOne, castFromCard, longRest,
  importSpellToActor, getAvailableCartomancienSpellSources, refreshManagers
});

Hooks.on("dnd5e.preUseActivity", activity => {
  if (!activity.item?.getFlag(MODULE_ID, "cartomancien.contentKey")) return;
  if (["CrtmActTouch0001", "CrtmActInflux001", "CrtmActDivine001"].some(id => activity.id === id || activity.id === id.padEnd(16, "0"))) {
    openManager(activity.actor ?? activity.item.parent);
    return false;
  }
});

// The rest hook runs on the client performing the native D&D5e rest.
Hooks.on("dnd5e.restCompleted", (actor, result, config) => {
  if (config?.type !== "long" || !actor.isOwner || !getCartomancerLevel(actor)
      || !actor.getFlag(MODULE_ID, "cartomancien.initialized")) return;
  longRest(actor).catch(error => {
    console.error(`${MODULE_ID} | repos long`, error);
    ui.notifications.error("Le repos est terminé, mais la main n'a pas pu être renouvelée. Ouvre le gestionnaire.");
  });
});

Hooks.on("dnd5e.preUseActivity", (activity, usage) => {
  const actor = activity.actor ?? activity.item?.parent;
  if (activity.item?.type !== "spell" || !actor?.isOwner || !getCartomancerLevel(actor)
      || activity.range?.units !== "touch") return;
  const rangeEffect = [...actor.effects].find(effect => {
    if (effect.disabled || !effect.getFlag(MODULE_ID, "cartomancien.range60")) return false;
    const turn = effect.getFlag(MODULE_ID, "cartomancien.turnKey");
    if (turn) return game.combat?.started && turn === `${game.combat.id}:${game.combat.round}:${game.combat.turn}`;
    return Number(effect.getFlag(MODULE_ID, "cartomancien.expiresAt") ?? 0) > game.time.worldTime;
  });
  const range = rangeEffect ? 60 : getCartomancerLevel(actor) >= 2 ? 30 : 0;
  if (!range) return;
  activity.updateSource({ range: { value: String(range), units: "ft", override: true } });
  if (rangeEffect) usage.cartomancienRangeEffect = rangeEffect.id;
});

Hooks.on("dnd5e.postUseActivity", (activity, usage) => {
  const actor = activity.actor ?? activity.item?.parent;
  if (usage?.cartomancienRangeEffect && actor?.isOwner && actor.effects.has(usage.cartomancienRangeEffect)) {
    actor.deleteEmbeddedDocuments("ActiveEffect", [usage.cartomancienRangeEffect]).catch(console.error);
  }
});

Hooks.once("ready", async () => {
  const module = game.modules.get(MODULE_ID);
  module.api = { ...module.api, cartomancien: {
    ARCANA,
    CARTOMANCIEN_SPELLS,
    openManager,
    syncActor,
    drawOne,
    longRest,
    castFromCard,
    chooseSpellForCard,
    syncActorContent,
    learnCantrips,
    ...featureAutomation,
    rebuildCompendiums: () => ensureContent({ force: true, notify: true })
  } };

  if (game.user.isGM && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
    try {
      await ensureContent({ notify: true });
    } catch (err) {
      console.error(`${MODULE_ID} | erreur d'installation des compendiums`, err);
      ui.notifications.error("Cartomancien : impossible de créer les compendiums. Voir la console F12.");
    }
  }
  console.log(`${MODULE_ID} | prêt`);
});

Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  const actor = app.actor ?? (app.document?.documentName === "Actor" ? app.document : null);
  if (!actor || !getCartomancerLevel(actor)) return;
  controls.unshift({
    icon: "fa-solid fa-clone",
    label: "Cartomancien",
    action: "cartomancien-deck-open",
    onClick: () => openManager(actor)
  });
});

Hooks.on("getApplicationV1HeaderButtons", (app, buttons) => {
  const actor = app.actor ?? app.object;
  if (!actor || actor.documentName !== "Actor" || !getCartomancerLevel(actor)) return;
  buttons.unshift({
    label: "Cartomancien",
    class: "cartomancien-deck-open",
    icon: "fas fa-cards",
    onclick: () => openManager(actor)
  });
});

Hooks.on("updateItem", async (item, changes, options, userId) => {
  if (item.type !== "class" || !item.parent || !getCartomancerClass(item.parent)) return;
  if (userId !== game.user.id) return;
  if (!foundry.utils.hasProperty(changes, "system.levels")) return;
  const actor = item.parent;
  if (!actor.getFlag(MODULE_ID, "cartomancien.initialized")) return;
  ui.notifications.info("Niveau de Cartomancien modifié : ouvre le gestionnaire et clique sur Synchroniser pour ajouter les nouvelles cartes et obtenir ton changement de sort.");
});
