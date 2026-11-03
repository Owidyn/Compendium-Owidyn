/**
 * Familiar Friend — Fortified Familiar.
 * When a character with the feat casts Find Familiar (from any source), the familiar's Hit Point maximum and current
 * Hit Points increase by twice the character level. Applied like the summon activity's own HP bonus.
 */
const FEAT = 'familiar-friend';
const SPELL = 'find-familiar';

Hooks.on('dnd5e.preSummonToken', (activity, profile, config) => {
  const caster = activity.actor;
  if (activity.item?.system.identifier !== SPELL || !caster?.items.some(i => i.system.identifier === FEAT)) return;
  const bonus = 2 * (caster.system.details?.level ?? 0);
  if (!bonus) return;

  const { actor, actorUpdates } = config;
  const effect = field => new CONFIG.ActiveEffect.documentClass({
    _id: dnd5e.utils.staticID('owidynFamiliarHP'),
    name: 'Fortified Familiar',
    img: 'icons/magic/life/heart-glowing-red.webp',
    disabled: false,
    changes: [{ key: `system.attributes.hp.${field}`, type: 'add', value: bonus }]
  }).toObject();
  if (!foundry.utils.isEmpty(actor.classes) && !actor._source.system.attributes.hp.max) {
    actorUpdates.effects.push(effect('bonuses.overall'));
  } else if (actor.prototypeToken.actorLink) {
    actorUpdates.effects.push(effect('max'));
  } else {
    // Unlinked familiars are fresh copies: raise maximum and current HP, on top of any summon bonus already set.
    const hp = actor.system.attributes.hp;
    actorUpdates['system.attributes.hp.max'] = (actorUpdates['system.attributes.hp.max'] ?? hp.max) + bonus;
    actorUpdates['system.attributes.hp.value'] = (actorUpdates['system.attributes.hp.value'] ?? hp.value) + bonus;
  }
});
