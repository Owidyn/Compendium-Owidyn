/** The four Form actors summoned by "Formes orbitales → Manifestation". */
import { CHA, DF, MODULE_ID, PB, S, activity, damagePart, effect, feature, html, icon, id, meta, scaledDF } from './helpers.mjs';

const ATTACK = { ability: '', bonus: `${CHA(S)} + ${PB(S)}`, flat: true };
const DC = `8 + ${CHA(S)} + ${PB(S)}`;
const SOOTHING = { subclass: 'soothing-star', level: 6 };

/** Item embedded in a Form actor. */
function formItem(form, key, name, { kind, requires, ...o } = {}) {
  const label = { presence: 'Présence', command: 'Commande', rupture: 'Rupture', upgrade: 'Amélioration' }[kind];
  const item = feature(`${form}-${key}`, name, {
    featType: 'monster', img: o.img ?? icon(form === 'ancre' ? 'anchor' : form), ...o,
    requirements: label ?? ''
  });
  Object.assign(meta(item), { form, kind: kind ?? 'trait', ...(requires ? { requires } : {}) });
  return item;
}

/** Rappel, Changer de forme and Intégrité: shared by every Form. */
const common = form => [
  formItem(form, 'rappel', 'Rappel', {
    kind: 'recall', img: icon('recall'),
    activities: [activity(`${form}:rappel`, 'utility', 'Rappel', {
      activation: 'bonus', img: icon('recall'), heliarque: { role: 'recall' },
      chatFlavor: 'La Forme disparaît ; son Orbital retourne dans la Réserve.'
    })],
    description: '*Bonus Action de l\'Héliarque.* La Forme disparaît et son Orbital retourne dans la Réserve. L\'Orbital conserve ses Hit Points actuels : il reviendra avec eux à sa prochaine Manifestation. Rappeler une Forme ne restaure aucun Hit Point.'
  }),
  formItem(form, 'changer-de-forme', 'Changer de forme', {
    kind: 'reconfigure', img: icon('transform-slot'),
    activities: [activity(`${form}:reconfiguration`, 'utility', 'Changer de forme', {
      activation: 'bonus', img: icon('transform-slot'), heliarque: { role: 'reconfigure' },
      chatFlavor: 'La Forme devient une autre Forme connue et conserve ses Hit Points.'
    })],
    description: '*Bonus Action de l\'Héliarque — Reconfiguration.* Transformez cette Forme en une autre Forme que l\'Héliarque connaît. Elle conserve ses Hit Points actuels, jusqu\'au Hit Point Maximum de sa nouvelle Forme, et reste au même endroit.'
  }),
  formItem(form, 'integrite', 'Intégrité', {
    kind: 'trait', img: icon(form === 'ancre' ? 'anchor' : form),
    description: `
Cette Forme est un objet magique, immunisée aux Poison et Psychic damage. Elle agit pendant le tour de son Héliarque et utilise ses actions ; elle n'a pas d'initiative propre.

**Commande.** Une même Forme ne peut utiliser sa Commande qu'une seule fois par tour, sauf aptitude contraire.

**Orbital.** Cette Forme est portée par l'un des Orbitals de l'Héliarque, qui conserve ses Hit Points lorsqu'il est rappelé ou change de forme.

**Destruction.** À 0 Hit Points, la Forme est détruite sans pouvoir utiliser sa Rupture. *Règle de table :* son Orbital reste indisponible jusqu'au prochain Long Rest de l'Héliarque.

**Repos.** Lorsque l'Héliarque termine un Short ou Long Rest, l'Orbital récupère tous ses Hit Points, sauf s'il a été détruit : il attend alors le Long Rest.`
  })
];

/* -------------------------------------------- */
/*  Satellite                                   */
/* -------------------------------------------- */

const SATELLITE_ITEMS = [
  ...common('satellite'),
  formItem('satellite', 'relais', 'Présence — Relais orbital', {
    kind: 'presence', img: icon('satellite'),
    activities: [activity('satellite:deplacer', 'utility', 'Déplacer le Satellite', {
      activation: 'bonus', heliarque: { move: { mode: 'free', distance: `@${S}scale.heliarque.vol`, subject: 'this', action: 'fly' } }
    })],
    description: `
Le Satellite possède Hover et la Fly Speed indiquée dans sa table d'évolution. Il peut rester jusqu'à 120 ft de son Héliarque (300 ft avec Matrice supérieure). L'Héliarque voit et entend depuis son espace comme s'il s'y trouvait. Le Satellite peut servir d'Origine aux Techniques.

Par une Bonus Action, l'Héliarque peut déplacer un de ses Satellites jusqu'à sa Fly Speed.`
  }),
  formItem('satellite', 'canon', 'Canon stellaire', {
    kind: 'command', img: icon('impact-vectoriel'),
    activities: [activity('satellite:canon', 'attack', 'Canon stellaire', {
      activation: 'action', range: { value: `@${S}scale.heliarque.portee` }, attack: ATTACK, affects: { count: 1, type: 'creature' },
      damage: [damagePart(`${scaledDF('canon', S)} + ${CHA(S)}`, ['fire', 'force'])],
      heliarque: { role: 'command' }
    })],
    description: `
*Magic Action — Commande.* Vous pouvez déplacer le Satellite jusqu'à sa Fly Speed avant ou après cette attaque. Effectuez un Ranged Fusion Attack depuis son espace contre une créature située à portée. En cas de réussite, la cible subit des Fire ou Force damage, à votre choix.`
  }),
  formItem('satellite', 'projectile', 'Projectile terminal', {
    kind: 'rupture', img: icon('vecteur-de-collision'),
    activities: [activity('satellite:projectile', 'attack', 'Projectile terminal', {
      activation: 'action', range: { value: 60 }, attack: ATTACK, affects: { count: 1, type: 'creature' },
      template: { type: 'line', size: 60, width: 5, stationary: true },
      damage: [damagePart(`${scaledDF('projectile', S)} + ${CHA(S)}`, ['force'])],
      heliarque: { role: 'rupture', move: { mode: 'away', distance: `@${S}scale.heliarque.recul`, from: 'this', subject: 'targets', attack: true } }
    })],
    description: `
*Magic Action — Rupture.* Projetez le Satellite jusqu'à 60 ft en ligne droite. Effectuez un Ranged Fusion Attack contre une créature située sur cette trajectoire. En cas de réussite, elle subit des Force damage et est repoussée dans la direction suivie par le Satellite. Le Satellite devient Dépensé après l'attaque, qu'elle touche ou non.`
  }),
  formItem('satellite', 'verrouillage', 'Verrouillage spectral', {
    kind: 'upgrade', requires: { level: 7 }, img: icon('evolution-orbitale'),
    effects: [effect('satellite:verrouille', 'Verrouillage spectral', {
      img: icon('evolution-orbitale'), rounds: 1,
      description: 'Verrouillée : ne peut pas être Hidden vis-à-vis de l\'Héliarque ; Invisible et Half/Three-Quarters Cover sans effet contre ses Fusion Attacks, tant qu\'un Satellite la perçoit.'
    })],
    activities: [activity('satellite:verrouiller', 'utility', 'Verrouiller la cible', {
      activation: 'special', condition: 'Lorsqu\'un Canon stellaire touche une créature', affects: { count: 1, type: 'creature' },
      effects: ['satellite:verrouille'], heliarque: { role: 'lock' }
    })],
    description: `
*Évolution orbitale (niveau 7).* Lorsqu'un Canon stellaire touche une créature, celle-ci est **verrouillée** jusqu'au début du prochain tour de l'Héliarque. Tant qu'au moins un Satellite peut la percevoir, elle ne peut pas être Hidden vis-à-vis de l'Héliarque, son Invisible ne lui accorde aucun bénéfice contre ses Fusion Attacks et elle ne bénéficie pas de Half Cover ou Three-Quarters Cover contre ses Fusion Attacks. Cette aptitude ne permet pas de percevoir une créature derrière Total Cover.`
  }),
  formItem('satellite', 'tir-vectoriel', 'Tir vectoriel', {
    kind: 'upgrade', requires: { level: 13 }, img: icon('transcendance-des-formes'),
    activities: [activity('satellite:tir-vectoriel', 'utility', 'Tir vectoriel', {
      activation: 'special', condition: 'Lorsqu\'un Canon stellaire touche une créature', affects: { count: 1, type: 'creature' },
      heliarque: { move: { mode: 'free', distance: '10', subject: 'targets' } }
    })],
    description: '*Transcendance des Formes (niveau 13).* Lorsqu\'un Canon stellaire touche une créature, vous pouvez déplacer celle-ci jusqu\'à **10 ft dans une direction de votre choix**.'
  }),
  formItem('satellite', 'etoile-guide', 'Présence apaisante — Étoile guide', {
    kind: 'presence', requires: SOOTHING, img: icon('presences-apaisantes'),
    description: '*Soothing Star (niveau 6).* Les créatures alliées situées à 10 ft ou moins du Satellite ont Advantage aux Wisdom (Perception) checks et ne peuvent pas être Surprised tant qu\'elles peuvent percevoir le Satellite.'
  })
];

/* -------------------------------------------- */
/*  Halo                                        */
/* -------------------------------------------- */

const HALO_ITEMS = [
  ...common('halo'),
  formItem('halo', 'couronne', 'Présence — Couronne incendiaire', {
    kind: 'presence', img: icon('halo'),
    description: `
Le Halo partage l'espace de son porteur et se déplace automatiquement avec lui. Il peut néanmoins être ciblé séparément.

Une fois par tour, la première fois que le porteur inflige des dégâts à une créature, cette créature subit également **1 Dé de Fusion de Fire damage**. *(Ajouté automatiquement au premier jet de dégâts du porteur à chaque tour.)*`
  }),
  formItem('halo', 'impulsion', 'Impulsion coronaire', {
    kind: 'command', img: icon('propulsion-stellaire'),
    activities: [activity('halo:impulsion', 'utility', 'Impulsion coronaire', {
      activation: 'action',
      heliarque: { role: 'command', move: { mode: 'free', distance: `@${S}scale.heliarque.impulsion`, subject: 'bearer', action: 'fly', comet: true } }
    })],
    description: `
*Magic Action — Commande.* Vous déplacez vous-même le porteur du Halo jusqu'à la distance indiquée dans sa table d'évolution. Vous choisissez sa trajectoire et son espace d'arrivée. Le porteur doit être consentant. Ce déplacement ne provoque pas d'Opportunity Attacks et peut être effectué horizontalement ou verticalement. Si le porteur termine ce déplacement dans les airs sans moyen d'y rester, il tombe normalement.`
  }),
  formItem('halo', 'sillage-comete', 'Sillage de comète', {
    kind: 'upgrade', requires: { level: 7 }, img: icon('evolution-orbitale'),
    activities: [activity('halo:sillage-comete', 'save', 'Sillage de comète', {
      activation: 'special', condition: 'Pendant une Impulsion coronaire', save: { ability: ['dex'], dc: DC }, onSave: 'half',
      affects: { type: 'enemy' }, damage: [damagePart(DF(2, S), ['fire'])], heliarque: { role: 'comet' }
    })],
    description: '*Évolution orbitale (niveau 7).* Lorsqu\'une créature est déplacée par Impulsion coronaire, la première fois pendant cette Impulsion que le porteur passe à 5 ft ou moins d\'une créature hostile, celle-ci effectue un Dexterity Saving Throw contre le DD de Fusion. En cas d\'échec, elle subit **2 Dés de Fusion de Fire damage** ; en cas de réussite, la moitié. Une même créature ne peut subir ces dégâts qu\'une fois par Impulsion. *(Les créatures longées sont ciblées automatiquement après l\'Impulsion.)*'
  }),
  formItem('halo', 'eruption', 'Éruption coronaire', {
    kind: 'rupture', img: icon('flash-photospherique'),
    activities: [activity('halo:eruption', 'damage', 'Éruption coronaire', {
      activation: 'reaction', condition: 'Lorsque le porteur inflige des dégâts à une créature', affects: { count: 1, type: 'creature' },
      damage: [damagePart(scaledDF('eruption', S), ['fire'])],
      heliarque: { role: 'rupture', move: { mode: 'free', distance: `@${S}scale.heliarque.impulsion / 2`, subject: 'bearer', optional: true } }
    })],
    description: `
*Reaction — Rupture.* Lorsque le porteur inflige des dégâts à une créature, vous pouvez détruire le Halo. Cette créature subit des Fire damage supplémentaires. Vous pouvez ensuite déplacer le porteur jusqu'à la moitié de la distance actuelle d'Impulsion coronaire sans provoquer d'Opportunity Attacks.`
  }),
  formItem('halo', 'ascension', 'Ascension coronaire', {
    kind: 'upgrade', requires: { level: 13 }, img: icon('transcendance-des-formes'),
    description: '*Transcendance des Formes (niveau 13).* Le porteur du Halo gagne une **Fly Speed égale à la moitié de sa Speed** et Hover. *(Appliqué automatiquement au porteur.)*'
  }),
  formItem('halo', 'chaleur', 'Présence apaisante — Chaleur réconfortante', {
    kind: 'presence', requires: SOOTHING, img: icon('presences-apaisantes'),
    description: '*Soothing Star (niveau 6).* Au début de chacun de ses tours, le porteur du Halo gagne des Temporary Hit Points égaux au Proficiency Bonus de l\'Héliarque. *(Automatique en combat.)*'
  })
];

/* -------------------------------------------- */
/*  Bastion                                     */
/* -------------------------------------------- */

const BASTION_ITEMS = [
  ...common('bastion'),
  formItem('bastion', 'inertie', 'Présence — Champ d\'inertie', {
    kind: 'presence', img: icon('inertia'),
    description: `
*Règle de table.* Tant que le Bastion est Bloodied (Hit Points actuels positifs et inférieurs ou égaux à la moitié de son maximum), chaque application de dégâts qu'il reçoit est réduite du **Proficiency Bonus + modificateur de Charisma** de l'Héliarque, après ses résistances et vulnérabilités, sans descendre sous 0. Le coup qui le fait passer Bloodied n'est pas réduit. *(Automatique.)*

Le Bastion fournit un Cover normal selon sa position.`
  }),
  formItem('bastion', 'onde', 'Onde de pression', {
    kind: 'command', img: icon('onde-de-resonance'),
    activities: [activity('bastion:onde', 'save', 'Onde de pression', {
      activation: 'action', save: { ability: ['str'], dc: DC }, onSave: 'none', affects: { type: 'enemy' },
      template: { type: 'cone', size: 15, stationary: true },
      damage: [damagePart(scaledDF('onde', S), ['force'])],
      heliarque: { role: 'command', move: { mode: 'away', distance: `@${S}scale.heliarque.poussee`, from: 'this', subject: 'targets', save: true } }
    })],
    description: `
*Magic Action — Commande.* Choisissez un côté du Bastion. Chaque créature hostile dans un cône de 15 ft provenant de ce côté effectue un Strength Saving Throw contre le DD de Fusion. En cas d'échec, elle subit des Force damage et est repoussée. En cas de réussite, elle ne subit aucun dégât et n'est pas déplacée.`
  }),
  formItem('bastion', 'refraction', 'Réfraction vectorielle', {
    kind: 'upgrade', requires: { level: 7 }, img: icon('evolution-orbitale'),
    activities: [activity('bastion:refraction', 'utility', 'Déplacer et réorienter le Bastion', {
      activation: 'special', condition: 'Avant ou après Onde de pression',
      heliarque: { move: { mode: 'free', distance: '15', subject: 'this', action: 'fly' } }
    })],
    description: '*Évolution orbitale (niveau 7).* Une fois par tour, lorsque l\'Héliarque utilise une Technique, il peut tirer à travers le Bastion comme s\'il n\'était pas là. Avant ou après avoir utilisé Onde de pression, il peut également déplacer et réorienter le Bastion jusqu\'à **15 ft**.'
  }),
  formItem('bastion', 'implosion', 'Implosion protectrice', {
    kind: 'rupture', img: icon('egide-vectorielle'),
    activities: [activity('bastion:implosion', 'utility', 'Implosion protectrice', {
      activation: 'reaction', condition: 'Une créature à 10 ft ou moins du Bastion subit des dégâts', affects: { count: 1, type: 'creature' },
      roll: { formula: `${scaledDF('implosion', S)} + ${CHA(S)}`, name: 'Réduction des dégâts' },
      heliarque: { role: 'rupture', reduction: true }
    })],
    description: '*Reaction — Rupture.* Lorsqu\'une créature située à 10 ft ou moins du Bastion subit des dégâts, détruisez le Bastion. Réduisez ces dégâts de la valeur indiquée dans sa table d\'évolution.'
  }),
  formItem('bastion', 'architecture', 'Architecture flottante', {
    kind: 'upgrade', requires: { level: 13 }, img: icon('transcendance-des-formes'),
    description: '*Transcendance des Formes (niveau 13).* Le Bastion peut flotter librement et être placé horizontalement, verticalement ou selon n\'importe quelle inclinaison. Un Bastion horizontal peut supporter normalement des créatures et des objets. Lorsque Constellation mobile déplace un Bastion, les créatures consentantes et les objets qu\'il supporte se déplacent avec lui.'
  }),
  formItem('bastion', 'refuge', 'Présence apaisante — Refuge', {
    kind: 'presence', requires: SOOTHING, img: icon('presences-apaisantes'),
    description: '*Soothing Star (niveau 6).* Les créatures alliées situées à 5 ft ou moins du Bastion gagnent **+1 AC**. *(Appliqué automatiquement selon la position des pions.)*'
  })
];

/* -------------------------------------------- */
/*  Ancre gravitationnelle                      */
/* -------------------------------------------- */

const ANCRE_ITEMS = [
  ...common('ancre'),
  formItem('ancre', 'champ', 'Présence — Champ gravitationnel', {
    kind: 'presence', img: icon('anchor'),
    description: 'La zone autour de l\'Ancre (rayon du Champ gravitationnel) est Difficult Terrain pour les créatures hostiles. Les alliés ne sont pas affectés. Plusieurs Champs gravitationnels ne cumulent pas leurs effets. *(Zone créée automatiquement autour du pion.)*'
  }),
  formItem('ancre', 'traction', 'Traction', {
    kind: 'command', img: icon('singularite-relayee'),
    activities: [activity('ancre:traction', 'save', 'Traction', {
      activation: 'action', save: { ability: ['str'], dc: DC }, onSave: 'none',
      range: { value: `@${S}scale.heliarque.champ`, special: 'Dans le Champ gravitationnel' }, affects: { count: 1, type: 'creature' },
      damage: [damagePart(DF(1, S), ['force'])],
      heliarque: { role: 'command', move: { mode: 'traction', distance: `@${S}scale.heliarque.traction`, from: 'this', subject: 'targets', save: true } }
    })],
    description: `
*Magic Action — Commande.* Choisissez une créature située dans le Champ gravitationnel. Une créature consentante peut choisir d'échouer automatiquement. Une créature non consentante effectue un Strength Saving Throw contre le DD de Fusion. En cas d'échec, elle subit **1 Dé de Fusion de Force damage** et vous la déplacez jusqu'à la distance de Traction, directement vers l'Ancre ou directement à l'opposé de celle-ci.`
  }),
  formItem('ancre', 'fronde', 'Fronde gravitationnelle', {
    kind: 'upgrade', requires: { level: 7 }, img: icon('evolution-orbitale'),
    description: '*Évolution orbitale (niveau 7).* Traction n\'est plus limitée à un mouvement directement vers ou directement à l\'opposé de l\'Ancre. Vous pouvez déplacer la cible le long d\'une trajectoire courbe autour de l\'Ancre, jusqu\'à la distance normale de Traction. La cible doit rester dans le Champ gravitationnel pendant ce déplacement. Une créature consentante déplacée ainsi ne provoque pas d\'Opportunity Attacks.'
  }),
  formItem('ancre', 'gravite', 'Gravité vectorielle', {
    kind: 'upgrade', requires: { level: 13 }, img: icon('transcendance-des-formes'),
    description: '*Transcendance des Formes (niveau 13).* Traction peut désormais déplacer sa cible dans **n\'importe quelle direction**, y compris verticalement. Une créature déplacée verticalement peut rester suspendue jusqu\'au début du prochain tour de l\'Héliarque avant de tomber normalement.'
  }),
  formItem('ancre', 'singularite', 'Singularité', {
    kind: 'rupture', img: icon('horizon-evenementiel'),
    activities: [activity('ancre:singularite', 'save', 'Singularité', {
      activation: 'action', save: { ability: ['str'], dc: DC }, onSave: 'half',
      affects: { type: 'creature', choice: true, special: 'Dans le Champ gravitationnel' },
      damage: [damagePart(scaledDF('singularite', S), ['force'])],
      heliarque: {
        role: 'rupture', targeting: { kind: 'self', radius: 'field', disposition: 'any' },
        move: { mode: 'toward', distance: `@${S}scale.heliarque.traction`, from: 'this', subject: 'targets', save: true }
      }
    })],
    description: '*Magic Action — Rupture.* Détruisez l\'Ancre. Chaque créature de votre choix située dans son Champ gravitationnel effectue un Strength Saving Throw. En cas d\'échec, elle subit des Force damage et est attirée jusqu\'à la distance actuelle de Traction vers l\'ancienne position de l\'Ancre. En cas de réussite, elle subit la moitié de ces dégâts et n\'est pas déplacée.'
  }),
  formItem('ancre', 'stabilite', 'Présence apaisante — Stabilité', {
    kind: 'presence', requires: SOOTHING, img: icon('presences-apaisantes'),
    description: '*Soothing Star (niveau 6).* Les créatures alliées situées dans le Champ gravitationnel ont Advantage aux Saving Throws contre Charmed, Frightened et les effets qui devraient les déplacer contre leur volonté. *(Effet indicatif appliqué automatiquement.)*'
  })
];

/* -------------------------------------------- */
/*  Actors                                      */
/* -------------------------------------------- */

const ALL_BUT_FORCE = ['acid', 'bludgeoning', 'cold', 'fire', 'lightning', 'necrotic', 'piercing', 'radiant', 'slashing', 'thunder'];
const ability = value => ({ value, proficient: 0 });
const SIZE_TOKEN = { tiny: 0.5, sm: 1, med: 1 };

function formActor(key, name, { size, ac, items, img, sight = false, dr = [], dv = [], description, sort }) {
  const embedded = items.map((item, i) => ({ ...item, _id: id(`actor:${key}:${item._id}`), sort: (i + 1) * 100000 }));
  return {
    _id: id(`actor:${key}`), name, type: 'npc', img, folder: null, sort,
    system: {
      abilities: { str: ability(10), dex: ability(10), con: ability(10), int: ability(10), wis: ability(10), cha: ability(10) },
      attributes: {
        ac: { calc: 'flat', flat: ac },
        hp: { value: 5, max: 5, temp: null, tempmax: null, formula: '' },
        movement: { walk: 0, fly: 0, swim: 0, climb: 0, burrow: 0, hover: true, units: 'ft' }
      },
      details: {
        type: { value: 'custom', subtype: '', swarm: '', custom: 'Forme orbitale' }, cr: 0, alignment: '',
        biography: { value: html(description), public: '' }
      },
      traits: {
        size,
        di: { value: ['poison', 'psychic'], bypasses: [], custom: '' },
        dr: { value: dr, bypasses: [], custom: '' },
        dv: { value: dv, bypasses: [], custom: '' },
        ci: { value: [], custom: '' },
        languages: { value: [], custom: 'Comprend les ordres de son Héliarque' }
      }
    },
    prototypeToken: {
      name, actorLink: false, appendNumber: false, prependAdjective: false,
      width: SIZE_TOKEN[size], height: SIZE_TOKEN[size], lockRotation: true, rotation: 0, alpha: 1,
      disposition: 1, displayName: 20, displayBars: 20, bar1: { attribute: 'attributes.hp' }, bar2: { attribute: null },
      texture: { src: img, scaleX: 1, scaleY: 1, fit: 'contain', tint: '#ffffff' },
      sight: { enabled: sight, range: 0, visionMode: 'basic' },
      flags: { [MODULE_ID]: { heliarque: { form: key } } }
    },
    items: embedded, effects: [],
    flags: { [MODULE_ID]: { heliarque: { form: key } } },
    ownership: { default: 0 },
    _stats: { compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '14.367', systemId: 'dnd5e', systemVersion: '6.0.6', createdTime: null, modifiedTime: null, lastModifiedBy: null }
  };
}

export const FORM_ACTORS = [
  formActor('satellite', 'Satellite', {
    size: 'tiny', ac: 13, items: SATELLITE_ITEMS, img: icon('satellite'), sight: true, sort: 100,
    description: `
Manifestation Tiny capable de flotter indépendamment autour du champ de bataille. Connue dès le niveau 1. CA, Hit Points, Fly Speed et dégâts dépendent du niveau de l'Héliarque qui l'a manifestée.

| Niveau | Fly Speed | Canon stellaire | Portée | Projectile terminal | Repousse |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1–6 | 30 ft | 2 DF + CHA | 60 ft | 4 DF + CHA | 15 ft |
| 7–12 | 50 ft | 3 DF + CHA | 90 ft | 5 DF + CHA | 20 ft |
| 13–16 | 60 ft | 4 DF + CHA | 120 ft | 6 DF + CHA | 25 ft |
| 17–20 | 80 ft | 5 DF + CHA | 150 ft | 7 DF + CHA | 30 ft |

**Niveau 7 :** Verrouillage spectral. **Niveau 13 :** Tir vectoriel. **Soothing Star 6 :** Étoile guide.`
  }),
  formActor('bastion', 'Bastion', {
    size: 'med', ac: 16, items: BASTION_ITEMS, img: icon('bastion'), dr: ALL_BUT_FORCE, dv: ['force'], sort: 200,
    description: `
Plaque de matière stellaire condensée. Connue dès le niveau 1. Armor Class de base 16, Resistance à tous les dégâts sauf Force, auxquels elle est Vulnerable. Elle fournit un Cover normal selon sa position.

| Niveau | Taille max. | Onde de pression | Repousse | Implosion protectrice |
|:---:|:---:|:---:|:---:|:---:|
| 1–6 | 5×5 ft | 1 DF | 10 ft | 3 DF + CHA |
| 7–12 | 10×10 ft | 2 DF | 15 ft | 4 DF + CHA |
| 13–16 | 15×15 ft | 3 DF | 20 ft | 5 DF + CHA |
| 17–20 | 20×20 ft | 4 DF | 25 ft | 6 DF + CHA |

**Niveau 7 :** Réfraction vectorielle. **Niveau 13 :** Architecture flottante. **Soothing Star 6 :** Refuge.`
  }),
  formActor('halo', 'Halo', {
    size: 'tiny', ac: 13, items: HALO_ITEMS, img: icon('halo'), sort: 300,
    description: `
Fragments incandescents de matière stellaire entourant une créature consentante, son porteur. Connu à partir du niveau 2. Lors de la Manifestation, l'Héliarque choisit lui-même ou une créature consentante située à 30 ft ou moins. Le Halo partage l'espace de son porteur et se déplace avec lui ; il peut néanmoins être ciblé séparément.

| Niveau | Impulsion coronaire | Éruption coronaire |
|:---:|:---:|:---:|
| 2–6 | 15 ft | 3 DF |
| 7–12 | 20 ft | 4 DF |
| 13–16 | 30 ft | 5 DF |
| 17–20 | 40 ft | 6 DF |

**Niveau 7 :** Sillage de comète. **Niveau 13 :** Ascension coronaire. **Soothing Star 6 :** Chaleur réconfortante.`
  }),
  formActor('ancre', 'Ancre gravitationnelle', {
    size: 'tiny', ac: 13, items: ANCRE_ITEMS, img: icon('anchor'), sort: 400,
    description: `
Noyau de matière extrêmement dense dont le Champ gravitationnel ralentit les créatures hostiles. Connue à partir du niveau 2.

| Niveau | Champ gravitationnel | Traction | Singularité |
|:---:|:---:|:---:|:---:|
| 2–6 | 10 ft | 10 ft | 2 DF |
| 7–12 | 15 ft | 15 ft | 3 DF |
| 13–16 | 20 ft | 20 ft | 4 DF |
| 17–20 | 25 ft | 25 ft | 5 DF |

**Niveau 7 :** Fronde gravitationnelle. **Niveau 13 :** Gravité vectorielle. **Soothing Star 6 :** Stabilité.`
  })
];
