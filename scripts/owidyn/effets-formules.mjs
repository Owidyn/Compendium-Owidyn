/**
 * Effets à formule.
 * Two Active Effect change types whose value is a formula, evaluated with the actor's data as it was when the effect
 * phase began (e.g. "2 * max(1, floor((@abilities.dex.value - 10) / 2))"), then added to or overriding the target:
 *   owidyn-formula-add       → like "add"
 *   owidyn-formula-override  → like "override"
 * Core change types only substitute @ references, they do not evaluate the result (Armure de Confinement Runique).
 */
const TYPES = {
  'owidyn-formula-add': { mode: 'add', label: 'Ajouter (formule)', defaultPriority: 20 },
  'owidyn-formula-override': { mode: 'override', label: 'Remplacer (formule)', defaultPriority: 50 }
};

Hooks.once('init', () => {
  for (const [type, { mode, label, defaultPriority }] of Object.entries(TYPES)) {
    CONFIG.ActiveEffect.changeTypes[type] = {
      label,
      defaultPriority,
      handler(targetDoc, change, { field, replacementData = {}, modifyTarget = true } = {}) {
        let value;
        try {
          value = Roll.safeEval(Roll.replaceFormulaData(String(change.value), replacementData));
        } catch (err) {
          console.warn(`compendium-owidyn | formule d'effet invalide « ${change.value} » (${change.key}) : ${err.message}`);
          return;
        }
        const ActiveEffect = CONFIG.ActiveEffect.documentClass;
        const update = ActiveEffect.applyChangeField(targetDoc, { ...change, type: mode, value },
          { field, replacementData, modifyTarget });
        // A custom handler's result is not collected by the core: record it so sheets show the field as overridden.
        if (modifyTarget && (update !== undefined) && targetDoc.overrides) {
          foundry.utils.setProperty(targetDoc.overrides, change.key, update);
        }
      }
    };
  }
});
