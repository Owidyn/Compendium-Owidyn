/**
 * Héliarque — Soothing Star.
 * Class content lives in the module compendiums; this script adds what native activities cannot express.
 */
import { registerSocket } from './socket.mjs';
import { registerOrbitals, orbitalSummary } from './orbitals.mjs';
import { ensureOrbitals, reconfigureFlow, registerForms } from './forms.mjs';
import { refreshCharacterItems } from './migration.mjs';
import { migrated } from '../owidyn/migration.mjs';
import { registerPresences, scheduleRefresh } from './presences.mjs';
import { addMoveButton, executeMove } from './movement.mjs';
import { addUseButtons, registerActions } from './actions.mjs';
import { MODULE_ID, TECHNIQUE_METHOD, formKey, summonerOf, techniqueTier } from './util.mjs';

Hooks.once('init', () => {
  registerTechniqueSpellcasting();
  registerOrbitals();
  registerForms();
  registerPresences();
  registerActions();
});

/**
 * Techniques stellaires are spells of their own spellcasting method: one spellbook section, no slots, Orbitals as cost.
 * Registered before dnd5e builds its spellcasting models (i18nInit).
 */
function registerTechniqueSpellcasting() {
  CONFIG.DND5E.spellcasting[TECHNIQUE_METHOD] = {
    label: 'Techniques stellaires',
    order: -40,
    img: `modules/${MODULE_ID}/assets/heliarque/techniques-stellaires.svg`
  };

  // The class has no spell slots, so "available" spell levels follow the Technique tiers: Héliarque 1, 5, 9, 13, 17 → 1–5.
  const Flow = dnd5e.applications.advancement.ItemChoiceFlow;
  const maxSpellSlotLevel = Flow.prototype._maxSpellSlotLevel;
  Flow.prototype._maxSpellSlotLevel = function() {
    if (this.advancement.configuration.spell?.method !== TECHNIQUE_METHOD) return maxSpellSlotLevel.call(this);
    return techniqueTier(this.level);
  };
}

Hooks.once('setup', () => {
  // Form actors read their Héliarque's values as @summoner (scale values, Charisma, proficiency).
  const Actor5e = CONFIG.Actor.documentClass;
  const getRollData = Actor5e.prototype.getRollData;
  Actor5e.prototype.getRollData = function(options = {}) {
    const data = getRollData.call(this, options);
    if (formKey(this)) {
      const summoner = summonerOf(this);
      if (summoner && summoner !== this) data.summoner = summoner.getRollData(options);
    }
    return data;
  };
});

Hooks.once('ready', async () => {
  registerSocket();
  const module = game.modules.get(MODULE_ID);
  module.api = { ...module.api, heliarque: { executeMove, reconfigureFlow, orbitalSummary, ensureOrbitals } };
  // The world's links to the module compendiums first, then the items: the Orbitals read their Forms from the
  // character's Manifestation orbitale.
  await migrated;
  await refreshCharacterItems();
  await ensureOrbitals();
  for (const scene of game.scenes.filter(s => s.active || s.isView)) scheduleRefresh(scene);
});

Hooks.on('renderChatMessageHTML', (message, html) => {
  addMoveButton(message, html);
  addUseButtons(message, html);
});
