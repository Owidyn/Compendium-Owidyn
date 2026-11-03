/**
 * Effets activables.
 * An item whose flags.compendium-owidyn.toggleEffect names one of its own effects switches that effect on or off
 * when one of its activities is used, without dialog, chat message or consumption (e.g. Lumière de plasma).
 */
const MODULE_ID = 'compendium-owidyn';

Hooks.on('dnd5e.preUseActivity', activity => {
  const item = activity.item;
  const effect = item?.effects.get(item.getFlag(MODULE_ID, 'toggleEffect') ?? '');
  // A suppressed item (unequipped, sealed Forme…) is left to the other hooks, which explain why it can't be used.
  if (!effect || item.areEffectsSuppressed) return;
  const disabled = !effect.disabled;
  effect.update({ disabled }).then(() => {
    ui.notifications.info(`${effect.name} : ${disabled ? 'désactivée' : 'activée'}.`);
  });
  return false;
});
