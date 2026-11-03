/**
 * The 23 Techniques stellaires, as spells of the "technique" spellcasting method.
 * Their spell level is the tier of their prerequisite: Héliarque 1 → 1, 5 → 2, 9 → 3, 13 → 4, 17 → 5.
 */
import { CHA, DF, MODULE_ID, activity, damagePart, effect, icon, id, meta, spell, techniqueTier } from './helpers.mjs';

const FOLDER = id('folder:techniques');

const SCHOOLS = {
  'propulsion-stellaire': 'trs', 'egide-vectorielle': 'abj', 'impact-vectoriel': 'evo', 'impulsion-forcee': 'evo',
  'translation-orbitale': 'con', 'convergence-stellaire': 'evo', 'compression-gravitationnelle': 'trs',
  'reconstitution-structurelle': 'trs', 'forge-stellaire': 'con', 'cartographie-gravitationnelle': 'div', 'balise-orbitale': 'div',
  'onde-de-resonance': 'evo', 'vecteur-de-collision': 'evo', 'acceleration-d-urgence': 'trs',
  'singularite-relayee': 'evo', 'flash-photospherique': 'evo', 'passage-orbital': 'con',
  'rail-orbital': 'evo', 'horizon-evenementiel': 'trs', 'derivation-structurelle': 'abj',
  'effondrement-de-constellation': 'evo', 'reecriture-vectorielle': 'trs', 'reconfiguration-instantanee': 'trs'
};

const STOPPED = (key, name = 'Vitesse nulle, aucune réaction') => effect(key, name, {
  img: icon('compression-gravitationnelle'), rounds: 1,
  changes: ['walk', 'fly', 'swim', 'climb', 'burrow'].map(m => ({
    key: `system.attributes.movement.${m}`, value: '0', type: 'override', phase: 'final', priority: 50
  })),
  description: 'Sa Speed devient 0 et elle ne peut pas effectuer de Reactions jusqu\'au début du prochain tour de l\'Héliarque.'
});

/**
 * @param {string} key
 * @param {string} name
 * @param {object} o
 * @param {number} o.level      Minimum Héliarque level.
 * @param {number} o.cost       Orbitals.
 * @param {boolean} [o.origin]  "Origine : oui".
 */
function technique(key, name, { level = 1, cost, activation, origin = false, description, activities, effects = [], img }) {
  const header = [`**Coût :** ${cost} Orbital${cost > 1 ? 's' : ''}`, `**Activation :** ${activation}`];
  if (origin) header.push('**Origine :** oui');
  if (level > 1) header.push(`**Prérequis :** Héliarque niveau ${level}`);
  const item = spell(key, name, {
    img: img ?? icon(key), level: techniqueTier(level), school: SCHOOLS[key],
    folder: FOLDER, sort: level * 1000, effects,
    activities: activities.map(a => {
      a.flags[MODULE_ID] = { heliarque: { technique: true, cost, origin, ...meta(a) } };
      return a;
    }),
    description: `${header.join('\n')}\n\n${description}`
  });
  meta(item).prerequisite = level;
  return item;
}

/* -------------------------------------------- */
/*  Sans prérequis                              */
/* -------------------------------------------- */

const propulsion = technique('propulsion-stellaire', 'Propulsion stellaire', {
  cost: 1, activation: 'Bonus Action',
  activities: [activity('propulsion-stellaire:use', 'utility', 'Propulsion stellaire', {
    activation: 'bonus', cost: 1, range: { units: 'self' }, affects: { type: 'self' },
    heliarque: { move: { mode: 'free', distance: '20', subject: 'self', action: 'fly' } }
  })],
  description: `
Déplacez-vous jusqu'à 20 ft vers un espace que vous voyez. Ce déplacement ignore Difficult Terrain, ne provoque pas d'Opportunity Attacks et peut être vertical. Si vous terminez ce déplacement dans les airs sans moyen d'y rester, vous tombez normalement.`
});

const egide = technique('egide-vectorielle', 'Égide vectorielle', {
  cost: 1, activation: 'Reaction',
  activities: [activity('egide-vectorielle:use', 'utility', 'Égide vectorielle', {
    activation: 'reaction', cost: 1, condition: 'Une créature à 15 ft ou moins de vous ou d\'une Forme subit des dégâts',
    affects: { count: 1, type: 'creature' },
    roll: { formula: `${DF(2)} + ${CHA()}`, name: 'Réduction des dégâts' },
    heliarque: { reduction: true }
  })],
  description: `
Lorsqu'une créature située à 15 ft ou moins de vous ou de l'une de vos Formes subit des dégâts, choisissez une de vos Formes située à 30 ft ou moins de cette créature, ou choisissez-vous vous-même. Réduisez les dégâts de **2 Dés de Fusion + votre modificateur de Charisma**.`
});

const impact = technique('impact-vectoriel', 'Impact vectoriel', {
  cost: 1, activation: 'aucune Action',
  activities: [activity('impact-vectoriel:use', 'save', 'Impact vectoriel', {
    activation: 'special', cost: 1, condition: 'Une fois par tour, lorsque vous touchez une créature avec une attaque avec une arme',
    save: { ability: ['str'] }, onSave: 'full', affects: { count: 1, type: 'creature' },
    damage: [damagePart(DF(1), ['fire', 'force'])],
    heliarque: { once: 'turn', move: { mode: 'line', distance: '10', from: 'form', subject: 'targets', save: true, maxSize: 'lg', formRange: 60 } }
  })],
  description: `
Une fois par tour, lorsque vous touchez une créature avec une attaque avec une arme, choisissez une Forme Manifestée que vous percevez à 60 ft ou moins de la cible.

L'attaque inflige **1 Dé de Fusion de Fire ou Force damage supplémentaire**, puis vous pouvez déplacer la cible jusqu'à **10 ft directement vers cette Forme ou directement à l'opposé d'elle** si elle est Large ou plus petite. Une créature non consentante peut effectuer un Strength Saving Throw contre votre DD de Fusion pour empêcher ce déplacement.

*Les dégâts s'appliquent quel que soit le résultat du jet ; le jet ne sert qu'à résister au déplacement.*`
});

const impulsion = technique('impulsion-forcee', 'Impulsion forcée', {
  cost: 1, activation: 'Magic Action', origin: true,
  activities: [activity('impulsion-forcee:use', 'save', 'Impulsion forcée', {
    activation: 'action', cost: 1, range: { value: 30 }, save: { ability: ['str'] }, onSave: 'none',
    affects: { count: 1, type: 'creature' }, damage: [damagePart(DF(1), ['force'])],
    heliarque: { move: { mode: 'free', distance: '15', subject: 'targets', save: true } }
  })],
  description: `
Choisissez une créature située à 30 ft ou moins de l'Origine. Une créature non consentante effectue un Strength Saving Throw contre votre DD de Fusion. En cas d'échec, elle subit **1 Dé de Fusion de Force damage** et vous la déplacez jusqu'à **15 ft dans une direction de votre choix**.

Une créature consentante est déplacée sans Saving Throw et sans subir de dégâts.`
});

const translation = technique('translation-orbitale', 'Translation orbitale', {
  cost: 1, activation: 'Bonus Action',
  activities: [activity('translation-orbitale:use', 'utility', 'Translation orbitale', {
    activation: 'bonus', cost: 1, range: { value: 60 }, affects: { type: 'self' },
    heliarque: { action: 'translation' }
  })],
  description: `
Choisissez un Satellite situé à 60 ft ou moins. Téléportez-vous dans un espace inoccupé situé à 5 ft ou moins de lui. Vous pouvez ensuite déplacer immédiatement le Satellite dans l'espace que vous occupiez.`
});

const convergence = technique('convergence-stellaire', 'Convergence stellaire', {
  cost: 2, activation: 'Magic Action',
  activities: [activity('convergence-stellaire:use', 'save', 'Convergence stellaire', {
    activation: 'action', cost: 2, save: { ability: ['dex'] }, onSave: 'half',
    affects: { type: 'creature', choice: true }, damage: [damagePart(DF(3), ['fire', 'force'])],
    heliarque: { targeting: { kind: 'path', points: [2, 2], segment: 60, width: 5, includeSelf: true, excludeForms: true } }
  })],
  description: `
Choisissez deux points parmi votre espace et les espaces de vos Formes Manifestées. Les deux points doivent être situés à 60 ft ou moins l'un de l'autre. Une ligne de 5 ft de largeur relie immédiatement ces deux points.

Chaque créature de votre choix dans cette ligne effectue un Dexterity Saving Throw contre votre DD de Fusion. Échec : **3 Dés de Fusion de Fire ou Force damage**, à votre choix. Réussite : moitié des dégâts. Une Forme située dans la ligne n'est jamais affectée par cette Technique.`
});

const compression = technique('compression-gravitationnelle', 'Compression gravitationnelle', {
  cost: 2, activation: 'Magic Action', origin: true,
  effects: [STOPPED('compression-gravitationnelle:stopped', 'Compression gravitationnelle')],
  activities: [activity('compression-gravitationnelle:use', 'save', 'Compression gravitationnelle', {
    activation: 'action', cost: 2, range: { value: 30 }, save: { ability: ['str'] }, onSave: 'none',
    affects: { count: 1, type: 'creature' }, effects: ['compression-gravitationnelle:stopped'],
    heliarque: { move: { mode: 'toward', distance: '5', from: 'anchorField', subject: 'targets', save: true, optional: true } }
  })],
  description: `
Choisissez une créature située à 30 ft ou moins de l'Origine. Elle effectue un Strength Saving Throw contre votre DD de Fusion. En cas d'échec, jusqu'au début de votre prochain tour :
- sa Speed devient 0 ;
- elle ne peut pas effectuer de Reactions.

Si la cible se trouve dans le Champ gravitationnel d'une de vos Ancres lorsqu'elle échoue, vous pouvez également la déplacer jusqu'à **5 ft vers cette Ancre** avant que sa Speed ne devienne 0.`
});

const reconstitution = technique('reconstitution-structurelle', 'Reconstitution structurelle', {
  cost: 1, activation: 'Bonus Action', origin: true,
  activities: [activity('reconstitution-structurelle:use', 'heal', 'Reconstitution structurelle', {
    activation: 'bonus', cost: 1, range: { value: 60 }, affects: { count: 1, type: 'creature', special: 'Une de vos Formes' },
    healing: { formula: `${DF(2)} + ${CHA()}` }, heliarque: { targetForms: true }
  })],
  description: `
Une Forme située à 60 ft ou moins de l'Origine récupère **2 Dés de Fusion + votre modificateur de Charisma Hit Points**.`
});

const forge = technique('forge-stellaire', 'Forge stellaire', {
  cost: 1, activation: '1 minute',
  activities: [activity('forge-stellaire:use', 'utility', 'Forge stellaire', {
    activation: 'minute', activationValue: 1, cost: 1, duration: { units: 'spec', special: 'Jusqu\'à la fin de votre prochain Long Rest' }
  })],
  description: `
Vous condensez de la matière stellaire pour créer un objet non magique que vous avez déjà vu.

Au niveau 1, l'objet doit être de taille Small ou inférieure et sa valeur normale ne peut pas dépasser 25 GP. Au niveau 9, il peut être Medium et sa valeur maximale devient 100 GP. Au niveau 17, il peut être Large et sa valeur maximale devient 500 GP.

L'objet persiste jusqu'à la fin de votre prochain Long Rest et présente toujours des signes visibles de sa nature temporaire et stellaire. Il ne peut pas servir de monnaie, de nourriture, de boisson, de substance consommable, de composant matériel possédant un coût indiqué ou d'objet destiné à être vendu ou échangé comme s'il était permanent.`
});

const cartographie = technique('cartographie-gravitationnelle', 'Cartographie gravitationnelle', {
  cost: 1, activation: '1 minute',
  activities: [activity('cartographie-gravitationnelle:use', 'utility', 'Cartographie gravitationnelle', {
    activation: 'minute', activationValue: 1, cost: 1, duration: { value: '10', units: 'minute' },
    heliarque: { requiresForm: 'satellite' }
  })],
  description: `
**Prérequis :** Satellite Manifesté.

Pendant 10 minutes, choisissez un Satellite. Vous percevez les variations importantes de masse dans un rayon de 60 ft autour de lui.

Vous pouvez déterminer la direction approximative et la taille générale de grandes cavités, masses ou structures cachées derrière une surface, mais cette Technique ne fournit pas une carte exacte, ne révèle pas les passages secrets par leur fonction et ne permet pas d'identifier précisément une créature ou un objet.`
});

const balise = technique('balise-orbitale', 'Balise orbitale', {
  cost: 1, activation: 'Magic Action',
  activities: [activity('balise-orbitale:use', 'utility', 'Balise orbitale', {
    activation: 'action', cost: 1, range: { units: 'touch' }, duration: { value: '8', units: 'hour' }
  })],
  description: `
Touchez un objet ou une surface. Pendant 8 heures, vous connaissez constamment la direction et la distance jusqu'à cette Balise tant qu'elle se trouve à moins de 1 mile et sur le même Plane of Existence. Vous ne pouvez maintenir qu'une Balise orbitale à la fois.`
});

/* -------------------------------------------- */
/*  Niveau 5                                    */
/* -------------------------------------------- */

const onde = technique('onde-de-resonance', 'Onde de résonance', {
  level: 5, cost: 2, activation: 'Magic Action',
  activities: [activity('onde-de-resonance:use', 'save', 'Onde de résonance', {
    activation: 'action', cost: 2, save: { ability: ['str'] }, onSave: 'half', affects: { type: 'enemy' },
    damage: [damagePart(DF(2), ['force'])],
    heliarque: {
      targeting: { kind: 'formRadius', radius: 10, disposition: 'hostile' },
      move: { mode: 'away', distance: '15', from: 'chosenForm', subject: 'targets', save: true }
    }
  })],
  description: `
Choisissez une de vos Formes Manifestées. Chaque créature hostile située à **10 ft ou moins de cette Forme** effectue un Strength Saving Throw contre votre DD de Fusion.

En cas d'échec, elle subit **2 Dés de Fusion de Force damage** et est repoussée jusqu'à **15 ft directement à l'opposé de la Forme**. En cas de réussite, elle subit la moitié des dégâts et n'est pas déplacée.`
});

const vecteur = technique('vecteur-de-collision', 'Vecteur de collision', {
  level: 5, cost: 2, activation: 'Magic Action', origin: true,
  activities: [activity('vecteur-de-collision:use', 'attack', 'Vecteur de collision', {
    activation: 'action', cost: 2, range: { value: 90 }, attack: { ability: 'cha' }, affects: { count: 1, type: 'creature' },
    damage: [damagePart(DF(3), ['force'])],
    heliarque: { move: { mode: 'line', distance: '15', from: 'form', subject: 'targets', attack: true, maxSize: 'huge', formRange: 60 } }
  })],
  description: `
Effectuez un Ranged Fusion Attack contre une créature située à 90 ft ou moins de l'Origine. En cas de réussite, elle subit **3 Dés de Fusion de Force damage**.

Choisissez ensuite une Forme Manifestée située à 60 ft ou moins de la cible. Vous pouvez déplacer la cible jusqu'à **15 ft directement vers cette Forme ou directement à l'opposé d'elle** si elle est Huge ou plus petite.`
});

const acceleration = technique('acceleration-d-urgence', 'Accélération d\'urgence', {
  level: 5, cost: 2, activation: 'Reaction',
  activities: [activity('acceleration-d-urgence:use', 'utility', 'Accélération d\'urgence', {
    activation: 'reaction', cost: 2, condition: 'Lorsqu\'une créature que vous voyez commence son tour',
    affects: { count: 1, type: 'ally' },
    heliarque: { move: { mode: 'free', distance: 'speed', subject: 'targets', haloBonus: true } }
  })],
  description: `
Lorsqu'une créature que vous voyez commence son tour, choisissez vous-même ou une créature consentante située à 15 ft ou moins de vous ou de l'une de vos Formes.

La cible peut immédiatement se déplacer jusqu'à la moitié de sa Speed sans provoquer d'Opportunity Attacks. Si la cible porte l'un de vos Halos, elle peut à la place se déplacer jusqu'à sa **Speed entière**.`
});

/* -------------------------------------------- */
/*  Niveau 9                                    */
/* -------------------------------------------- */

const singularite = technique('singularite-relayee', 'Singularité relayée', {
  level: 9, cost: 3, activation: 'Magic Action',
  effects: [STOPPED('singularite-relayee:stopped', 'Singularité relayée — Ancre')],
  activities: [activity('singularite-relayee:use', 'save', 'Singularité relayée', {
    activation: 'action', cost: 3, save: { ability: ['str'] }, onSave: 'half', affects: { type: 'creature', choice: true },
    damage: [damagePart(DF(3), ['force'])], effects: ['singularite-relayee:stopped'],
    heliarque: {
      targeting: { kind: 'formRadius', radius: 15, disposition: 'any' },
      move: { mode: 'toward', distance: '15', from: 'chosenForm', subject: 'targets', save: true },
      anchorEffect: 'singularite-relayee:stopped'
    }
  })],
  description: `
Choisissez une de vos Formes Manifestées. Chaque créature de votre choix située à 15 ft ou moins de cette Forme effectue un Strength Saving Throw contre votre DD de Fusion.

En cas d'échec, elle subit **3 Dés de Fusion de Force damage** et est attirée jusqu'à **15 ft vers la Forme**. En cas de réussite, elle subit la moitié des dégâts et n'est pas déplacée.

Si la Forme choisie est une Ancre, une créature qui échoue voit également sa Speed devenir 0 jusqu'au début de votre prochain tour.`
});

const flash = technique('flash-photospherique', 'Flash photosphérique', {
  level: 9, cost: 3, activation: 'Magic Action',
  effects: [effect('flash-photospherique:blinded', 'Flash photosphérique', {
    img: icon('flash-photospherique'), rounds: 1, statuses: ['blinded'],
    description: 'Blinded jusqu\'au début du prochain tour de l\'Héliarque.'
  })],
  activities: [activity('flash-photospherique:use', 'save', 'Flash photosphérique', {
    activation: 'action', cost: 3, save: { ability: ['dex'] }, onSave: 'half', affects: { type: 'enemy' },
    damage: [damagePart(DF(4), ['fire'])], effects: ['flash-photospherique:blinded'],
    heliarque: { targeting: { kind: 'formRadius', radius: 15, disposition: 'hostile', forms: ['satellite', 'halo'], excludeBearer: true } }
  })],
  description: `
Choisissez un Satellite ou un Halo Manifesté. Une explosion de lumière jaillit dans une sphère de 15 ft de rayon centrée sur cette Forme. Son porteur, s'il s'agit d'un Halo, n'est pas affecté.

Chaque créature hostile dans la zone effectue un Dexterity Saving Throw contre votre DD de Fusion. En cas d'échec, elle subit **4 Dés de Fusion de Fire damage** et subit la condition Blinded jusqu'au début de votre prochain tour. En cas de réussite, elle subit la moitié des dégâts et n'est pas Blinded.`
});

const passage = technique('passage-orbital', 'Passage orbital', {
  level: 9, cost: 2, activation: 'Bonus Action',
  activities: [activity('passage-orbital:use', 'utility', 'Passage orbital', {
    activation: 'bonus', cost: 2, affects: { count: 1, type: 'ally', special: 'Vous-même ou une créature consentante à 5 ft ou moins de la première Forme' },
    heliarque: { action: 'passage' }
  })],
  description: `
Choisissez deux Formes Manifestées. Vous-même ou une créature consentante située à 5 ft ou moins de la première Forme se téléporte dans un espace inoccupé situé à 5 ft ou moins de la seconde.`
});

/* -------------------------------------------- */
/*  Niveau 13                                   */
/* -------------------------------------------- */

const rail = technique('rail-orbital', 'Rail orbital', {
  level: 13, cost: 4, activation: 'Magic Action',
  activities: [activity('rail-orbital:use', 'save', 'Rail orbital', {
    activation: 'action', cost: 4, save: { ability: ['dex'] }, onSave: 'half', affects: { type: 'creature' },
    damage: [damagePart(DF(6), ['fire', 'force'])],
    heliarque: { targeting: { kind: 'path', points: [2, 4], segment: 60, total: 120, width: 5, includeSelf: true, excludeForms: false } }
  })],
  description: `
Choisissez une succession de deux à quatre points parmi votre espace et les espaces de vos Formes Manifestées. Tracez une ligne de 5 ft de largeur reliant ces points dans l'ordre choisi. Chaque segment doit mesurer 60 ft ou moins et la longueur totale de la trajectoire ne peut pas dépasser **120 ft**.

Chaque créature dans cette trajectoire effectue un Dexterity Saving Throw contre votre DD de Fusion. En cas d'échec, elle subit **6 Dés de Fusion de Fire ou Force damage**, à votre choix. En cas de réussite, elle subit la moitié. Une même créature ne peut être affectée qu'une seule fois par Rail orbital.`
});

const horizon = technique('horizon-evenementiel', 'Horizon événementiel', {
  level: 13, cost: 4, activation: 'Magic Action', origin: true,
  effects: [STOPPED('horizon-evenementiel:stopped', 'Horizon événementiel')],
  activities: [
    activity('horizon-evenementiel:use', 'save', 'Horizon événementiel', {
      activation: 'action', cost: 4, range: { value: 90 }, save: { ability: ['str'] }, onSave: 'none',
      template: { type: 'radius', size: 20 }, affects: { type: 'enemy' }, duration: { value: '1', units: 'round' },
      effects: ['horizon-evenementiel:stopped'],
      heliarque: { zone: { difficult: true } }
    }),
    activity('horizon-evenementiel:ancre', 'save', 'Horizon événementiel — sur une Ancre', {
      activation: 'action', cost: 4, range: { value: 90 }, save: { ability: ['str'] }, onSave: 'none',
      affects: { type: 'enemy' }, duration: { value: '1', units: 'round' },
      damage: [damagePart(DF(2), ['force'])], effects: ['horizon-evenementiel:stopped'],
      heliarque: { zone: { difficult: true, onAnchor: true }, targeting: { kind: 'formRadius', radius: 'field+10', disposition: 'hostile', forms: ['ancre'] } }
    })
  ],
  description: `
Choisissez un point situé à 90 ft ou moins de l'Origine. Une zone de gravité extrême de 20 ft de rayon apparaît jusqu'au début de votre prochain tour. La zone est Difficult Terrain pour les créatures hostiles.

Lorsqu'une créature hostile entre dans la zone pour la première fois pendant un tour ou y commence son tour, elle effectue un Strength Saving Throw contre votre DD de Fusion. En cas d'échec, sa Speed devient 0 et elle ne peut pas effectuer de Reactions jusqu'au début de son prochain tour.

Si vous centrez Horizon événementiel sur une de vos Ancres, son rayon devient **le rayon actuel du Champ gravitationnel de l'Ancre + 10 ft** et une créature qui échoue subit également **2 Dés de Fusion de Force damage**.`
});

const derivation = technique('derivation-structurelle', 'Dérivation structurelle', {
  level: 13, cost: 3, activation: 'Reaction',
  activities: [activity('derivation-structurelle:use', 'utility', 'Dérivation structurelle', {
    activation: 'reaction', cost: 3, condition: 'Une créature à 15 ft ou moins d\'une de vos Formes subit des dégâts',
    affects: { count: 1, type: 'creature' },
    roll: { formula: `${DF(4)} + ${CHA()}`, name: 'Dégâts prévenus' },
    heliarque: { action: 'derivation' }
  })],
  description: `
Lorsqu'une créature située à 15 ft ou moins d'une de vos Formes subit des dégâts, choisissez une de vos Formes située à 15 ft ou moins de cette créature. Lancez **4 Dés de Fusion + votre modificateur de Charisma**.

Réduisez les dégâts subis par la créature d'un montant pouvant aller jusqu'au résultat obtenu. La Forme choisie subit le même montant de dégâts que celui effectivement prévenu. Ces dégâts infligés à la Forme ne peuvent pas être réduits ou redirigés. Si la Forme tombe à 0 Hit Points de cette manière, elle est détruite normalement et ne peut pas déclencher sa Rupture.`
});

/* -------------------------------------------- */
/*  Niveau 17                                   */
/* -------------------------------------------- */

const effondrement = technique('effondrement-de-constellation', 'Effondrement de constellation', {
  level: 17, cost: 5, activation: 'Magic Action',
  activities: [
    activity('effondrement-de-constellation:use', 'save', 'Effondrement de constellation', {
      activation: 'action', cost: 5, save: { ability: ['dex'] }, onSave: 'half', affects: { type: 'enemy' },
      damage: [damagePart(DF(4), ['fire', 'force'])],
      heliarque: { targeting: { kind: 'spheres', radius: 10, disposition: 'hostile', max: 'prof' } }
    }),
    activity('effondrement-de-constellation:extra', 'damage', 'Sphère supplémentaire (+2 DF)', {
      activation: 'special', condition: 'Par sphère supplémentaire contenant la créature (8 DF maximum)',
      damage: [damagePart(DF(2), ['fire', 'force'])]
    })
  ],
  description: `
Choisissez jusqu'à un nombre de vos Formes Manifestées égal à votre Proficiency Bonus. Une sphère de 10 ft de rayon se forme autour de chacune de ces Formes.

Chaque créature hostile située dans au moins une de ces sphères effectue un Dexterity Saving Throw contre votre DD de Fusion. En cas d'échec, elle subit **4 Dés de Fusion de Fire ou Force damage**, à votre choix. Pour chaque sphère supplémentaire au-delà de la première contenant cette créature, augmentez les dégâts de **2 Dés de Fusion**, jusqu'à un maximum total de **8 Dés de Fusion**. En cas de réussite, elle subit la moitié des dégâts.

*Le module indique dans la discussion le nombre de sphères touchant chaque cible ; lancez l'activité « Sphère supplémentaire » pour les dégâts additionnels.*`
});

const reecriture = technique('reecriture-vectorielle', 'Réécriture vectorielle', {
  level: 17, cost: 5, activation: 'Magic Action',
  activities: [activity('reecriture-vectorielle:use', 'save', 'Réécriture vectorielle', {
    activation: 'action', cost: 5, save: { ability: ['str'] }, onSave: 'half',
    affects: { count: '@abilities.cha.mod', type: 'creature', special: 'À 30 ft ou moins d\'au moins une de vos Formes' },
    damage: [damagePart(DF(4), ['force'])],
    heliarque: { move: { mode: 'free', distance: '30', subject: 'targets', save: true, nearForm: 30 } }
  })],
  description: `
Choisissez jusqu'à un nombre de créatures égal à votre modificateur de Charisma. Chaque cible doit se trouver à 30 ft ou moins d'au moins une de vos Formes.

Une créature non consentante effectue un Strength Saving Throw contre votre DD de Fusion. En cas d'échec, elle subit **4 Dés de Fusion de Force damage**, puis vous la déplacez jusqu'à **30 ft** vers un espace inoccupé situé à 30 ft ou moins d'une autre de vos Formes. En cas de réussite, elle subit la moitié des dégâts et n'est pas déplacée.

Une créature consentante peut être déplacée sans effectuer de Saving Throw et sans subir de dégâts.`
});

const reconfiguration = technique('reconfiguration-instantanee', 'Reconfiguration instantanée', {
  level: 17, cost: 3, activation: 'Bonus Action',
  activities: [activity('reconfiguration-instantanee:use', 'heal', 'Reconfiguration instantanée', {
    activation: 'bonus', cost: 3, affects: { type: 'creature', special: 'N\'importe quel nombre de vos Formes' },
    healing: { formula: `${DF(2)} + ${CHA()}` },
    heliarque: { targetForms: true, action: 'reconfiguration-instantanee' }
  })],
  description: `
Choisissez n'importe quel nombre de vos Formes Manifestées. Pour chacune :
- déplacez-la jusqu'à 60 ft ;
- vous pouvez immédiatement la Reconfigurer ;
- elle récupère **2 Dés de Fusion + votre modificateur de Charisma Hit Points**.`
});

export const TECHNIQUES = [
  propulsion, egide, impact, impulsion, translation, convergence, compression, reconstitution, forge, cartographie, balise,
  onde, vecteur, acceleration,
  singularite, flash, passage,
  rail, horizon, derivation,
  effondrement, reecriture, reconfiguration
];
export const TECHNIQUE_KEYS = [
  'propulsion-stellaire', 'egide-vectorielle', 'impact-vectoriel', 'impulsion-forcee', 'translation-orbitale',
  'convergence-stellaire', 'compression-gravitationnelle', 'reconstitution-structurelle', 'forge-stellaire',
  'cartographie-gravitationnelle', 'balise-orbitale', 'onde-de-resonance', 'vecteur-de-collision', 'acceleration-d-urgence',
  'singularite-relayee', 'flash-photospherique', 'passage-orbital', 'rail-orbital', 'horizon-evenementiel',
  'derivation-structurelle', 'effondrement-de-constellation', 'reecriture-vectorielle', 'reconfiguration-instantanee'
];
