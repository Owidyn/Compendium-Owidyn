/** The Héliarque class item and its class features. */
import {
  CHA, DF, TECHNIQUE_SPELL_CONFIG, activity, actorUuid, asi, baseItem, change, damagePart, effect, feature, grant, icon, id,
  itemUuid, scale, scaledDF, spell, trait
} from './helpers.mjs';
import { TECHNIQUE_KEYS } from './techniques.mjs';

export const FOLDERS = {
  class: id('folder:class'), features: id('folder:features'), techniques: id('folder:techniques'), subclass: id('folder:soothing-star')
};

const classFeature = (key, name, level, o = {}) => feature(key, name, {
  level, requirements: `Héliarque ${level}`, folder: FOLDERS.features, sort: level * 1000 + (o.order ?? 0), ...o
});

/* -------------------------------------------- */
/*  Level 1                                     */
/* -------------------------------------------- */

const orbitals = classFeature('orbitals', 'Orbitals', 1, {
  img: icon('orbitals'),
  uses: {
    max: 'max(4, @classes.heliarque.levels + @prof + @abilities.cha.mod)',
    recovery: [
      { period: 'lr', type: 'recoverAll' },
      { period: 'sr', type: 'formula', formula: '@scale.heliarque.fusion + @prof' }
    ]
  },
  description: `
Votre noyau produit des unités condensées de matière stellaire appelées **Orbitals**. Ce compteur affiche les Orbitals de votre **Réserve**.

Votre nombre maximum d'Orbitals est égal à **votre niveau de Héliarque + votre Proficiency Bonus + votre modificateur de Charisma**, avec un minimum de 4.

#### États d'un Orbital
- **Réserve.** L'Orbital demeure contenu dans votre noyau. Il peut alimenter une Technique stellaire ou être Manifesté sous une Forme orbitale.
- **Manifesté.** L'Orbital possède une Forme physique et n'est plus disponible pour payer le coût d'une Technique.
- **Dépensé.** L'Orbital a été consumé. Il ne peut plus être utilisé jusqu'à ce que vous le récupériez.

#### Récupération
Lorsque vous terminez un Short Rest, lancez votre Dé de Fusion et ajoutez votre Proficiency Bonus au résultat. Vous récupérez jusqu'à ce nombre d'Orbitals Dépensés. Lorsque vous terminez un Long Rest, vous récupérez tous vos Orbitals Dépensés.

**Règle de table.** L'Orbital d'une Forme **détruite** (0 Hit Points, Rupture, Combustion de secours ou sacrifice) ne peut être récupéré qu'à la fin d'un Long Rest. Les Orbitals encore Manifestés ne sont jamais récupérés par un repos.

#### Dé de Fusion
Votre Dé de Fusion représente l'intensité des réactions produites par votre noyau. Sa taille est indiquée dans la table du Héliarque.

**DD de Fusion** = 8 + votre modificateur de Charisma + votre Proficiency Bonus.
**Modificateur d'attaque de Fusion** = votre modificateur de Charisma + votre Proficiency Bonus.`
});

const FORM_PROFILES = [
  { key: 'satellite', name: 'Satellite', min: 1 },
  { key: 'bastion', name: 'Bastion', min: 1 },
  { key: 'halo', name: 'Halo', min: 2 },
  { key: 'ancre', name: 'Ancre gravitationnelle', min: 2 }
];

/**
 * Manifestation orbitale: the summoning spell of the four Forms. Level 0 so profiles follow the Héliarque level.
 * Each point of Formes simultanées is a persistent Orbital actor created by the module; the spell places a free one under
 * the chosen Form. Its uses show the Orbitals still free. Hit Points and Armor Class are set on the Orbital by the module.
 */
export const manifestation = spell('manifestation-orbitale', 'Manifestation orbitale', {
  img: icon('invocation-orbitale'), level: 0, school: 'con', folder: FOLDERS.techniques, sort: 0,
  uses: { max: '@scale.heliarque.formes' },
  activities: [activity('formes-orbitales:manifestation', 'summon', 'Manifestation', {
    activation: 'bonus', cost: 1, range: { value: 30 },
    duration: { units: 'spec', special: 'Jusqu\'au Rappel ou à la destruction de la Forme' },
    affects: { count: 1, type: 'space' },
    profiles: FORM_PROFILES.map(p => ({
      _id: id(`profile:${p.key}`), name: p.name, uuid: actorUuid(p.key), count: '1', cr: '', types: [],
      level: { min: p.min, max: null }
    })),
    heliarque: { role: 'manifest' }
  })],
  description: `
**Coût :** 1 Orbital
**Origine :** oui
**Formes simultanées :** [[lookup @scale.heliarque.formes]]

Les Formes orbitales sont les manifestations physiques de vos Orbitals. Par une Bonus Action, choisissez un Orbital de votre Réserve et manifestez-le sous une Forme que vous connaissez, dans un espace valide situé à 30 ft ou moins de vous.

Vous connaissez le **Satellite** et le **Bastion** au niveau 1, puis le **Halo** et l'**Ancre gravitationnelle** au niveau 2.

#### Formes simultanées
Chaque point de la colonne **Formes** de la table du Héliarque (2 au niveau 1, 3 au niveau 5, 4 au niveau 9, 5 au niveau 13 et 6 au niveau 17) est un **Orbital** : une entité persistante, avec ses propres Hit Points, qui peut prendre n'importe laquelle des Formes que vous connaissez. Le module crée ces Orbitals dans le dossier d'acteurs **Héliarque — Orbitals**.
- **Manifestation.** Un Orbital libre apparaît sous la Forme choisie. S'ils n'ont pas tous les mêmes Hit Points, vous choisissez lequel.
- **Rappel.** L'Orbital disparaît et redevient libre ; il **conserve ses Hit Points**.
- **Changer de forme.** Le même Orbital prend une autre Forme sur place et conserve ses Hit Points.
- **Short ou Long Rest.** Chaque Orbital qui n'est pas détruit récupère tous ses Hit Points.

Les utilisations de ce sort affichent les Orbitals encore libres. Lorsqu'aucun n'est libre, Manifestation orbitale est refusée.

**Règle de table.** Un Orbital détruit (0 Hit Points, Rupture, Combustion de secours ou sacrifice) reste indisponible jusqu'à la fin de votre prochain Long Rest, qui lui rend aussi ses Hit Points.

Chaque Forme possède une **Présence** (effet passif tant qu'elle demeure Manifestée), une **Commande** (fonction active) et une **Rupture** (utilisation exceptionnelle qui détruit volontairement la Forme). Ces aptitudes, ainsi que **Rappel** et **Changer de forme**, se trouvent sur la fiche de la Forme et évoluent avec votre niveau.

#### Intégrité
Une Forme est un objet magique. Sauf indication contraire, elle possède :
- **Armor Class.** 13 + votre modificateur de Charisma + votre Proficiency Bonus / 2 (arrondi à l'inférieur). Le Bastion a une base de 16.
- **Hit Point Maximum.** 5 + quatre fois votre niveau de Héliarque + votre modificateur de Charisma.

Une Forme est immunisée aux Poison et Psychic damage. Lorsqu'une Forme tombe à 0 Hit Points, elle est détruite et son Orbital devient Dépensé ; une Forme détruite de cette manière ne peut pas utiliser sa Rupture.

**Règle de table.** Une Forme détruite (0 Hit Points, Rupture, Combustion de secours ou sacrifice) ne rend son Orbital qu'à la fin de votre prochain Long Rest.

Lorsque vous terminez un Short ou Long Rest, chaque Orbital qui n'est pas détruit récupère tous ses Hit Points.

#### Commandes
Une Commande nécessite normalement votre **Magic Action**. Sauf indication contraire, une même Forme ne peut utiliser sa Commande qu'**une seule fois par tour**. Toutes les Formes agissent pendant votre tour et utilisent vos actions : elles n'ont pas d'initiative propre.`
});

/** Permanent passive: a transferred effect without changes, listed among the character's passive effects. */
const origineOrbitale = classFeature('origine-orbitale', 'Origine orbitale', 1, {
  img: icon('satellite'), order: 2,
  effects: [effect('origine-orbitale:passif', 'Origine orbitale', {
    transfer: true, img: icon('satellite'),
    description: 'Les Techniques et aptitudes portant la mention **Origine : oui** peuvent partir de votre espace ou de celui de l\'un de vos Satellites Manifestés.'
  })],
  description: `
*Passif permanent.*

Certaines Techniques portent la mention **Origine : oui**. Lorsqu'une Technique possède cette mention, vous pouvez choisir comme Origine :
- votre propre espace ;
- l'espace de l'un de vos Satellites Manifestés.

Toutes les portées, lignes, cônes et zones de la Technique sont alors calculés depuis cette Origine. Une autre Forme ne devient pas une Origine à moins qu'une aptitude ne l'indique explicitement.

*Au lancement d'une Technique avec Origine, le module vous demande de choisir l'Origine lorsque vous avez au moins un Satellite Manifesté.*`
});

const techniquesStellaires = classFeature('techniques-stellaires', 'Techniques stellaires', 1, {
  img: icon('techniques-stellaires'), order: 5,
  description: `
Les Techniques stellaires sont des applications directes de votre noyau. La plupart exploitent la position de vos Formes, déplacent des créatures entre elles ou utilisent votre constellation comme géométrie d'effet.

Vous connaissez le nombre de Techniques indiqué dans la colonne **Techniques** de la table du Héliarque. Lorsqu'une Technique possède un coût en Orbitals, les Orbitals utilisés quittent votre Réserve et deviennent Dépensés. Les Techniques n'utilisent jamais d'emplacements de sort.

Lorsque vous gagnez un niveau de Héliarque, vous pouvez remplacer une Technique connue par une autre Technique pour laquelle vous remplissez les prérequis.

#### Sur la fiche
Les Techniques, ainsi que **Manifestation orbitale**, sont rangées dans l'onglet des sorts, section **Techniques stellaires**. Leur niveau de sort indique leur palier de prérequis :

| Niveau de sort | Prérequis |
|:---:|:---:|
| 1 | Héliarque 1 |
| 2 | Héliarque 5 |
| 3 | Héliarque 9 |
| 4 | Héliarque 13 |
| 5 | Héliarque 17 |

**DD de Fusion** = 8 + votre modificateur de Charisma + votre Proficiency Bonus. **Modificateur d'attaque de Fusion** = votre modificateur de Charisma + votre Proficiency Bonus.`
});

/* -------------------------------------------- */
/*  Level 2+                                    */
/* -------------------------------------------- */

const combustion = classFeature('combustion-de-secours', 'Combustion de secours', 2, {
  img: icon('combustion-de-secours'), order: 2,
  description: `
Lorsque vous utilisez une Technique et que votre Réserve ne contient pas suffisamment d'Orbitals pour en payer le coût, vous pouvez sacrifier une Forme Manifestée. Cette Forme disparaît et son Orbital devient Dépensé.

Pour cette Technique uniquement, la Forme sacrifiée compte comme **2 Orbitals** (**3 Orbitals** à partir du niveau 11, Combustion supérieure). Vous devez payer tout coût restant normalement. Tout excédent est perdu.

Une Forme sacrifiée grâce à Combustion de secours ne déclenche pas sa Rupture. Vous ne pouvez sacrifier qu'une seule Forme de cette manière pour une même Technique.

*Le module vous propose automatiquement la Combustion lorsqu'une Technique coûte plus que votre Réserve.*`
});

const synchronisation = classFeature('synchronisation-orbitale', 'Synchronisation orbitale', 5, {
  img: icon('synchronisation-orbitale'),
  description: `
Commander une Forme devient une extension naturelle de vos propres mouvements. Une fois pendant chacun de vos tours, vous pouvez utiliser la Commande d'une Forme Manifestée **sans utiliser votre Action**. Cette utilisation reste soumise à la règle normale limitant une Forme à une Commande par tour.`
});

/** Level markers: the upgrades themselves live on the Form sheets and are added there automatically. */
const evolution = classFeature('evolution-orbitale', 'Évolution orbitale', 7, {
  img: icon('evolution-orbitale'),
  description: `
Vos Formes commencent à développer des propriétés impossibles à reproduire par les autres manifestations. Ces améliorations ne nécessitent aucune Action supplémentaire.
- **Satellite — Verrouillage spectral.** Une créature touchée par un Canon stellaire est verrouillée jusqu'au début de votre prochain tour : elle ne peut pas être Hidden vis-à-vis de vous, et son Invisible ainsi que Half et Three-Quarters Cover ne l'aident pas contre vos Fusion Attacks.
- **Halo — Sillage de comète.** Pendant une Impulsion coronaire, la première créature hostile longée par le porteur effectue un Dexterity Saving Throw : 2 Dés de Fusion de Fire damage, la moitié en cas de réussite.
- **Bastion — Réfraction vectorielle.** Une fois par tour, vos Techniques traversent le Bastion ; avant ou après Onde de pression, vous pouvez déplacer et réorienter le Bastion jusqu'à 15 ft.
- **Ancre — Fronde gravitationnelle.** Traction peut suivre une trajectoire courbe autour de l'Ancre, dans le Champ gravitationnel.

*Ces aptitudes sont ajoutées automatiquement sur les fiches de vos Formes.*`
});

const transcendance = classFeature('transcendance-des-formes', 'Transcendance des Formes', 13, {
  img: icon('transcendance-des-formes'),
  description: `
Vos manifestations acquièrent des propriétés qui dépassent leurs contraintes physiques initiales.
- **Satellite — Tir vectoriel.** Une créature touchée par un Canon stellaire peut être déplacée jusqu'à 10 ft dans une direction de votre choix.
- **Halo — Ascension coronaire.** Le porteur du Halo gagne une Fly Speed égale à la moitié de sa Speed, et Hover.
- **Bastion — Architecture flottante.** Le Bastion flotte librement, sous n'importe quelle inclinaison, et peut supporter créatures et objets.
- **Ancre — Gravité vectorielle.** Traction déplace sa cible dans n'importe quelle direction, y compris verticalement.

*Ces aptitudes sont ajoutées automatiquement sur les fiches de vos Formes.*`
});

const matrice = classFeature('matrice-orbitale', 'Matrice orbitale', 9, {
  img: icon('matrice-orbitale'),
  activities: [activity('matrice-orbitale:constellation', 'utility', 'Constellation mobile', {
    activation: 'special', condition: 'Immédiatement après une Commande, une Technique, une Manifestation ou une Rupture',
    heliarque: { role: 'constellation' }
  })],
  description: `
Vous apprenez à déplacer vos manifestations comme les éléments d'une seule constellation.

**Constellation mobile.** Une fois pendant chacun de vos tours, immédiatement après avoir utilisé une Commande, utilisé une Technique, Manifesté une Forme ou déclenché une Rupture, choisissez jusqu'à **deux Formes Manifestées**. Déplacez chacune d'elles jusqu'à **15 ft** sans utiliser d'Action. Ce déplacement ne déclenche pas leurs Commandes. Un Halo déplace son porteur avec lui si celui-ci est consentant. Un Bastion ou une Ancre peut flotter pendant ce déplacement, mais doit normalement terminer son déplacement sur une surface capable de le soutenir.

**Reconfiguration fluide.** L'une des Formes déplacées par Constellation mobile peut être Reconfigurée à la fin de son déplacement sans utiliser de Bonus Action.

**Matrice supérieure.** À partir du niveau 13, la distance de Constellation mobile devient **30 ft** et vos Formes peuvent rester jusqu'à **300 ft** de vous.`
});

const commandement = classFeature('commandement-parallele', 'Commandement parallèle', 11, {
  img: icon('commandement-parallele'),
  activities: [activity('commandement-parallele:use', 'utility', 'Commandement parallèle', {
    activation: 'special', condition: 'Après une Technique stellaire ou la Commande d\'une Forme', cost: 2,
    heliarque: { role: 'parallel' }
  })],
  description: `
Votre esprit peut commander plusieurs manifestations simultanément. Une fois pendant chacun de vos tours, après avoir utilisé une Technique stellaire ou la Commande d'une Forme, vous pouvez dépenser **2 Orbitals**. Choisissez une autre Forme Manifestée qui n'a pas encore utilisé sa Commande pendant ce tour. Elle utilise immédiatement sa Commande sans utiliser d'Action supplémentaire.

**Combustion supérieure.** Une Forme sacrifiée grâce à Combustion de secours compte désormais comme **3 Orbitals** pour payer le coût de la Technique. Tout excédent est perdu.

**Fusion supérieure.** Votre Dé de Fusion devient un **d10**.`
});

const noyau = classFeature('noyau-supercritique', 'Noyau supercritique', 15, {
  img: icon('noyau-supercritique'),
  effects: [effect('noyau-supercritique:resistance', 'Noyau supercritique', {
    transfer: true, img: icon('noyau-supercritique'),
    changes: [change('system.traits.dr.value', 'fire'), change('system.traits.dr.value', 'force')]
  })],
  activities: [
    activity('noyau-supercritique:surchauffe', 'damage', 'Surchauffe', {
      activation: 'special', condition: 'Une fois par tour, en dépensant au moins 2 Orbitals pour une Technique',
      damage: [damagePart(DF(1), ['fire'])], affects: { count: 1, type: 'creature' }, heliarque: { role: 'supercritical' }
    }),
    activity('noyau-supercritique:surpression', 'utility', 'Surpression', {
      activation: 'special', condition: 'Une fois par tour, en dépensant au moins 2 Orbitals pour une Technique',
      affects: { count: 1, type: 'creature' },
      heliarque: { role: 'supercritical', move: { mode: 'free', distance: '10', subject: 'targets' } }
    }),
    activity('noyau-supercritique:recyclage', 'utility', 'Recyclage', {
      activation: 'special', condition: 'Une fois par tour, après une Technique d\'au moins 2 Orbitals qui n\'inflige aucun dégât',
      restore: 1, heliarque: { role: 'supercritical' }
    })
  ],
  description: `
Votre noyau produit des réactions qui dépassent les limites physiques ordinaires. Vous gagnez Resistance aux Fire et Force damage. Les Fire et Force damage infligés par vos aptitudes de Héliarque ignorent Resistance. Une Immunity reste une Immunity.

**Réaction supercritique.** Une fois pendant chacun de vos tours, lorsque vous dépensez au moins 2 Orbitals pour une Technique, choisissez un effet :
- **Surchauffe.** Une cible affectée par la Technique subit **1 Dé de Fusion de Fire damage supplémentaire**.
- **Surpression.** Déplacez une cible affectée par la Technique jusqu'à **10 ft** dans une direction de votre choix.
- **Recyclage.** Si la Technique n'inflige aucun dégât, récupérez **1 Orbital Dépensé** après sa résolution.`
});

const reacteur = classFeature('reacteur-autonome', 'Réacteur autonome', 17, {
  img: icon('reacteur-autonome'),
  activities: [
    activity('reacteur-autonome:reparation', 'heal', 'Surplus critique — Réparation', {
      activation: 'special', condition: 'Orbital non récupéré par Réacteur autonome', range: { units: 'spec' },
      healing: { formula: `${DF(1)} + ${CHA()}` }, affects: { count: 1, type: 'creature', special: 'Une de vos Formes' }
    }),
    activity('reacteur-autonome:intensification', 'damage', 'Surplus critique — Intensification', {
      activation: 'special', condition: 'Orbital non récupéré par Réacteur autonome ; avant la fin de ce tour',
      damage: [damagePart(DF(1), ['fire', 'force'])]
    })
  ],
  description: `
Votre noyau génère de la matière stellaire pendant le combat. Après avoir lancé Initiative, au début de chacun de vos tours, vous récupérez **2 Orbitals Dépensés** dans votre Réserve. Cette récupération ne fonctionne pas en dehors d'un combat et ne peut jamais vous faire dépasser votre maximum d'Orbitals.

**Surplus critique.** Si Réacteur autonome ne peut pas récupérer ses 2 Orbitals parce que moins de 2 de vos Orbitals sont Dépensés, choisissez un bénéfice pour chaque Orbital qui n'a pas pu être récupéré :
- une Forme récupère **1 Dé de Fusion + votre modificateur de Charisma Hit Points** ;
- ou la prochaine fois avant la fin de ce tour qu'une de vos aptitudes de Héliarque inflige des dégâts, elle inflige **1 Dé de Fusion supplémentaire**.

*La récupération est automatique au début de votre tour ; le module propose le Surplus critique dans la discussion.*`
});

const INCARNATIONS = [
  { key: 'satellite', name: 'Incarnation du Relais', effect: { changes: [], description: 'Votre propre espace comme Origine : +30 ft de portée. Vous ignorez Half Cover et Three-Quarters Cover avec vos Fusion Attacks.' } },
  { key: 'halo', name: 'Incarnation coronaire', effect: { changes: [change('system.attributes.movement.walk', 10)], description: 'Speed +10 ft. La première fois pendant votre tour que vous infligez des dégâts, vous infligez également 1 Dé de Fusion de Fire damage.' } },
  { key: 'bastion', name: 'Incarnation d\'inertie', effect: { changes: [change('system.attributes.ac.bonus', '+1')], description: '+1 AC. Advantage aux Saving Throws pour résister à un déplacement forcé ou à la condition Prone.' } },
  { key: 'ancre', name: 'Incarnation gravitationnelle', effect: { changes: [], description: 'La zone située à 10 ft autour de vous est Difficult Terrain pour les créatures hostiles.' } }
];

const corps = classFeature('corps-orbital', 'Corps orbital', 18, {
  img: icon('corps-orbital'),
  effects: [
    effect('corps-orbital:vol', 'Corps orbital — Vol', {
      transfer: true, img: icon('corps-orbital'),
      changes: [change('system.attributes.movement.fly', 60, 'upgrade'), change('system.attributes.movement.hover', 'true', 'override')]
    }),
    ...INCARNATIONS.map(i => effect(`corps-orbital:${i.key}`, i.name, {
      img: icon(i.key === 'ancre' ? 'anchor' : i.key), rounds: 1, changes: i.effect.changes, description: i.effect.description,
      flags: { incarnation: i.key }
    }))
  ],
  activities: [
    ...INCARNATIONS.map(i => activity(`corps-orbital:incarnation:${i.key}`, 'utility', i.name, {
      activation: 'special', condition: 'Au début de chacun de vos tours', effects: [`corps-orbital:${i.key}`],
      affects: { type: 'self' }, heliarque: { role: 'incarnation', incarnation: i.key }
    })),
    activity('corps-orbital:commande:satellite', 'attack', 'Commande incarnée — Canon stellaire', {
      activation: 'action', cost: 1, range: { value: '@scale.heliarque.portee' }, attack: { ability: 'cha' },
      damage: [damagePart(`${scaledDF('canon')} + ${CHA()}`, ['fire', 'force'])], affects: { count: 1, type: 'creature' },
      heliarque: { role: 'incarnate', incarnation: 'satellite' }
    }),
    activity('corps-orbital:commande:halo', 'utility', 'Commande incarnée — Impulsion coronaire', {
      activation: 'action', cost: 1, heliarque: { role: 'incarnate', incarnation: 'halo', move: { mode: 'free', distance: '@scale.heliarque.impulsion', subject: 'self' } }
    }),
    activity('corps-orbital:commande:bastion', 'save', 'Commande incarnée — Onde de pression', {
      activation: 'action', cost: 1, save: { ability: ['str'] }, onSave: 'none', template: { type: 'cone', size: 15 },
      damage: [damagePart(scaledDF('onde'), ['force'])], affects: { type: 'enemy' },
      heliarque: { role: 'incarnate', incarnation: 'bastion', move: { mode: 'away', distance: '@scale.heliarque.poussee', from: 'self', subject: 'targets', save: true } }
    }),
    activity('corps-orbital:commande:ancre', 'save', 'Commande incarnée — Traction', {
      activation: 'action', cost: 1, save: { ability: ['str'] }, onSave: 'none', range: { value: 10 },
      damage: [damagePart(DF(1), ['force'])], affects: { count: 1, type: 'creature' },
      heliarque: { role: 'incarnate', incarnation: 'ancre', move: { mode: 'line', distance: '@scale.heliarque.traction', from: 'self', subject: 'targets', save: true } }
    })
  ],
  description: `
Votre corps adopte les propriétés de vos propres manifestations. Vous gagnez une **Fly Speed de 60 ft** et Hover.

Au début de chacun de vos tours, choisissez une Forme. Vous bénéficiez de son **Incarnation** jusqu'au début de votre prochain tour.
- **Satellite — Incarnation du Relais.** Lorsque vous utilisez votre propre espace comme Origine d'une Technique, augmentez sa portée de 30 ft. Vous ignorez également Half Cover et Three-Quarters Cover avec vos Fusion Attacks.
- **Halo — Incarnation coronaire.** Votre Speed augmente de 10 ft. La première fois pendant votre tour que vous infligez des dégâts, vous infligez également **1 Dé de Fusion de Fire damage**.
- **Bastion — Incarnation d'inertie.** Vous gagnez +1 AC et avez Advantage aux Saving Throws effectués pour résister à un déplacement forcé ou à la condition Prone.
- **Ancre — Incarnation gravitationnelle.** La zone située à 10 ft autour de vous est Difficult Terrain pour les créatures hostiles.

**Commande incarnée.** Une fois pendant chacun de vos tours, vous pouvez dépenser **1 Orbital** pour utiliser depuis votre espace la Commande correspondant à votre Incarnation actuelle. Vous ne pouvez pas reproduire une Rupture de cette manière.`
});

const supernova = classFeature('etat-de-supernova', 'État de Supernova', 20, {
  img: icon('etat-de-supernova'),
  uses: { max: '1', recovery: [{ period: 'lr', type: 'recoverAll' }] },
  effects: [effect('etat-de-supernova:etat', 'État de Supernova', {
    img: icon('etat-de-supernova'), rounds: 10, expiry: 'turnEnd',
    description: 'Réaction autosuffisante, Orchestration totale, Stabilisation absolue et Surproduction.'
  })],
  activities: [activity('etat-de-supernova:use', 'utility', 'État de Supernova', {
    activation: 'bonus', uses: true, duration: { value: '1', units: 'minute' }, affects: { type: 'self' },
    effects: ['etat-de-supernova:etat'], heliarque: { role: 'supernova' }
  })],
  description: `
Par une Bonus Action, vous ouvrez totalement votre noyau et entrez dans votre **État de Supernova** pendant 1 minute. Une fois cette aptitude utilisée, vous devez terminer un Long Rest avant de pouvoir l'utiliser de nouveau.

Lorsque vous entrez dans cet état :
- récupérez tous vos Orbitals Dépensés ;
- toutes vos Formes récupèrent tous leurs Hit Points ;
- vous pouvez immédiatement Manifester ou Reconfigurer gratuitement des Formes jusqu'à votre maximum.

Pendant cet état, vous gagnez les bénéfices suivants.

**Réaction autosuffisante.** La première Technique utilisée pendant chacun de vos tours coûte **1 Orbital de moins**, jusqu'à un minimum de 0.

**Orchestration totale.** Une fois pendant chacun de vos tours, après avoir utilisé une Technique ou une Commande, chacune de vos autres Formes Manifestées qui n'a pas encore utilisé sa Commande pendant ce tour peut immédiatement l'utiliser sans Action supplémentaire. Orchestration totale remplace la limitation de Synchronisation orbitale, mais ne permet toujours pas à une même Forme d'utiliser plusieurs fois sa Commande pendant ce tour.

**Stabilisation absolue.** Au début de chacun de vos tours, chaque Forme Manifestée récupère **1 Dé de Fusion + votre modificateur de Charisma Hit Points**.

**Surproduction.** Au début de chacun de vos tours, après Réacteur autonome, récupérez **2 Orbitals Dépensés supplémentaires**.

**Règle de table.** Les Orbitals des Formes détruites restent indisponibles jusqu'au Long Rest.`
});

/**
 * Features of the Héliarque himself. What belongs to a Form (Présence, Commande, Rupture, the upgrades of Évolution
 * orbitale and Transcendance des Formes, Rappel, Changer de forme) lives on the Form actors; the character only keeps
 * passive level markers for the two upgrade levels.
 */
export const CLASS_FEATURES = [
  orbitals, origineOrbitale, techniquesStellaires, combustion, synchronisation, evolution, matrice, commandement,
  transcendance, noyau, reacteur, corps, supernova
];

/* -------------------------------------------- */
/*  Class                                       */
/* -------------------------------------------- */

const byLevel = {
  1: ['orbitals', 'techniques-stellaires', 'origine-orbitale'],
  2: ['combustion-de-secours'],
  5: ['synchronisation-orbitale'],
  7: ['evolution-orbitale'],
  9: ['matrice-orbitale'],
  11: ['commandement-parallele'],
  13: ['transcendance-des-formes'],
  15: ['noyau-supercritique'],
  17: ['reacteur-autonome'],
  18: ['corps-orbital'],
  20: ['etat-de-supernova']
};

/** New Techniques learned at each level; every level allows one replacement. */
const TECHNIQUES_GAINED = { 1: 2, 2: 2, 5: 1, 7: 1, 9: 1, 11: 1, 13: 1, 15: 1, 17: 1, 20: 1 };

const techniqueChoice = {
  _id: id('advancement:techniques'), type: 'ItemChoice', title: 'Techniques stellaires', hint: '',
  configuration: {
    choices: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i + 1),
      { count: TECHNIQUES_GAINED[i + 1] ?? null, replacement: i > 0 }])),
    // The module caps the available spell level at the Technique tier of the class level (1 → 1 … 17 → 5).
    allowDrops: false, type: 'spell', restriction: { level: 'availableNoCantrips', list: [], school: [], subtype: '', type: '' },
    pool: TECHNIQUE_KEYS.map(key => ({ uuid: itemUuid(key) })),
    sorting: 'm',
    spell: TECHNIQUE_SPELL_CONFIG
  },
  value: {}
};

const CLASS_DESCRIPTION = `
Un Héliarque abrite un phénomène impossible : un noyau capable de produire et de condenser de la matière stellaire.

Cette matière se manifeste sous la forme d'**Orbitals**. L'Héliarque peut les consumer pour alimenter ses Techniques stellaires ou les extérioriser sous des formes physiques : satellites autonomes, halos coronaires, remparts de matière condensée et ancres gravitationnelles.

À mesure que son noyau gagne en puissance, ses Formes deviennent des extensions de ses sens et de sa volonté. Elles protègent, attaquent, contrôlent l'espace et permettent à l'Héliarque d'exercer son influence depuis plusieurs endroits à la fois.

Lorsque sa Réserve s'épuise, il lui reste encore un choix : consumer ses propres manifestations pour maintenir la réaction quelques instants de plus.

| Niveau | PB | Aptitudes | Dé de Fusion | Techniques | Formes |
|:---:|:---:|:---|:---:|:---:|:---:|
| 1 | +2 | Orbitals, Formes orbitales, Satellite, Bastion, Techniques stellaires | d4 | 2 | 2 |
| 2 | +2 | Halo, Ancre gravitationnelle, Combustion de secours | d6 | 4 | 2 |
| 3 | +2 | Discipline stellaire | d6 | 4 | 2 |
| 4 | +2 | Feat | d6 | 4 | 2 |
| 5 | +3 | Synchronisation orbitale | d8 | 5 | 3 |
| 6 | +3 | Aptitude de Discipline stellaire | d8 | 5 | 3 |
| 7 | +3 | Évolution orbitale | d8 | 6 | 3 |
| 8 | +3 | Feat | d8 | 6 | 3 |
| 9 | +4 | Matrice orbitale | d8 | 7 | 4 |
| 10 | +4 | Aptitude de Discipline stellaire | d8 | 7 | 4 |
| 11 | +4 | Commandement parallèle, Combustion supérieure | d10 | 8 | 4 |
| 12 | +4 | Feat | d10 | 8 | 4 |
| 13 | +5 | Transcendance des Formes | d10 | 9 | 5 |
| 14 | +5 | Aptitude de Discipline stellaire | d10 | 9 | 5 |
| 15 | +5 | Noyau supercritique | d10 | 10 | 5 |
| 16 | +5 | Feat | d10 | 10 | 5 |
| 17 | +6 | Réacteur autonome | d12 | 11 | 6 |
| 18 | +6 | Corps orbital | d12 | 11 | 6 |
| 19 | +6 | Epic Boon | d12 | 11 | 6 |
| 20 | +6 | État de Supernova | d12 | 12 | 6 |

Les aptitudes propres aux Formes (Satellite, Bastion, Halo, Ancre gravitationnelle) se trouvent sur les fiches des Formes. Les améliorations d'Évolution orbitale et de Transcendance des Formes s'y ajoutent automatiquement au niveau requis ; le personnage reçoit une aptitude passive qui les résume. Les Formes s'invoquent avec le sort **Manifestation orbitale** ; les Techniques stellaires sont des sorts.

#### Caractéristique principale
Votre **Charisma** représente votre capacité à maintenir et commander la réaction stellaire contenue dans votre corps.

#### Équipement de départ
Choisissez : **A)** Leather Armor, Rapier, Shortbow, 20 Arrows, Explorer's Pack et 10 GP ; ou **B)** 100 GP.`;

const EQ = key => `Compendium.dnd5e.equipment24.Item.${key}`;
const equipmentEntry = (key, data, sort) => ({ _id: id(`equipment:${key}`), requiresProficiency: false, group: id('equipment:and'), sort, ...data });

export const heliarqueClass = baseItem('heliarque', 'class', 'Héliarque', {
  img: icon('heliarque'), description: CLASS_DESCRIPTION, folder: FOLDERS.class, sort: 0,
  system: {
    levels: 1,
    hd: { denomination: 'd8', spent: 0, additional: '' },
    primaryAbility: { value: ['cha'], all: true },
    spellcasting: { progression: 'none', ability: '', preparation: { formula: '' } },
    wealth: '100',
    startingEquipment: [
      { _id: id('equipment:and'), type: 'AND', requiresProficiency: false, group: '', sort: 100000 },
      equipmentEntry('leather', { type: 'linked', count: null, key: EQ('phbarmLeatherArm') }, 200000),
      equipmentEntry('rapier', { type: 'linked', count: null, key: EQ('phbwepRapier0000') }, 300000),
      equipmentEntry('shortbow', { type: 'linked', count: null, key: EQ('phbwepShortbow00') }, 400000),
      equipmentEntry('arrows', { type: 'linked', count: 20, key: EQ('phbamoArrows0000') }, 500000),
      equipmentEntry('pack', { type: 'linked', count: null, key: EQ('phbagExplorersPa') }, 600000),
      equipmentEntry('gold', { type: 'currency', count: 10, key: 'gp' }, 700000)
    ],
    advancement: [
      { _id: id('advancement:hp'), type: 'HitPoints', configuration: {}, value: {}, title: '', hint: '' },
      trait('saves', 'Maîtrises des jets de sauvegarde', { grants: ['saves:con', 'saves:cha'], primary: true }),
      trait('skills', 'Maîtrises de compétences', {
        primary: true,
        choices: [{ count: 2, pool: ['skills:acr', 'skills:arc', 'skills:ath', 'skills:ins', 'skills:itm', 'skills:prc', 'skills:per', 'skills:sur'] }]
      }),
      // Light Armor is also gained when multiclassing, as for the 2024 Bard, Rogue and Warlock.
      trait('armor', 'Formation aux armures', { grants: ['armor:lgt'] }),
      trait('weapons', 'Maîtrises d\'armes', {
        grants: ['weapon:sim', 'weapon:mar:rapier', 'weapon:mar:scimitar', 'weapon:mar:shortsword', 'weapon:mar:whip']
      }),
      ...Object.entries(byLevel).map(([level, keys]) => grant(`grant:${level}`, Number(level), keys.map(itemUuid))),
      grant('grant:manifestation', 1, [itemUuid('manifestation-orbitale')], 'Formes orbitales', { spell: TECHNIQUE_SPELL_CONFIG }),
      { _id: id('advancement:subclass'), type: 'Subclass', level: 3, title: 'Discipline stellaire', hint: '', configuration: {}, value: { document: null, uuid: null } },
      asi(4), asi(8), asi(12), asi(16),
      asi(19, { title: 'Epic Boon', recommendation: 'Compendium.dnd5e.feats24.Item.phbBoonofIrresis' }),
      techniqueChoice,
      scale('fusion', 'Dé de Fusion', 'dice', { 1: 'd4', 2: 'd6', 5: 'd8', 11: 'd10', 17: 'd12' }),
      scale('formes', 'Formes simultanées', 'number', { 1: 2, 5: 3, 9: 4, 13: 5, 17: 6 }),
      scale('techniques', 'Techniques connues', 'number', { 1: 2, 2: 4, 5: 5, 7: 6, 9: 7, 11: 8, 13: 9, 15: 10, 17: 11, 20: 12 }),
      scale('combustion', 'Combustion de secours (Orbitals)', 'number', { 2: 2, 11: 3 }),
      scale('vol', 'Satellite — Fly Speed', 'distance', { 1: 30, 7: 50, 13: 60, 17: 80 }, { units: 'ft' }),
      scale('canon', 'Satellite — Canon stellaire (DF)', 'number', { 1: 2, 7: 3, 13: 4, 17: 5 }),
      scale('portee', 'Satellite — Portée du Canon', 'distance', { 1: 60, 7: 90, 13: 120, 17: 150 }, { units: 'ft' }),
      scale('projectile', 'Satellite — Projectile terminal (DF)', 'number', { 1: 4, 7: 5, 13: 6, 17: 7 }),
      scale('recul', 'Satellite — Repousse', 'distance', { 1: 15, 7: 20, 13: 25, 17: 30 }, { units: 'ft' }),
      scale('impulsion', 'Halo — Impulsion coronaire', 'distance', { 2: 15, 7: 20, 13: 30, 17: 40 }, { units: 'ft' }),
      scale('eruption', 'Halo — Éruption coronaire (DF)', 'number', { 2: 3, 7: 4, 13: 5, 17: 6 }),
      scale('taille', 'Bastion — Taille max.', 'distance', { 1: 5, 7: 10, 13: 15, 17: 20 }, { units: 'ft' }),
      scale('onde', 'Bastion — Onde de pression (DF)', 'number', { 1: 1, 7: 2, 13: 3, 17: 4 }),
      scale('poussee', 'Bastion — Repousse', 'distance', { 1: 10, 7: 15, 13: 20, 17: 25 }, { units: 'ft' }),
      scale('implosion', 'Bastion — Implosion protectrice (DF)', 'number', { 1: 3, 7: 4, 13: 5, 17: 6 }),
      scale('champ', 'Ancre — Champ gravitationnel', 'distance', { 2: 10, 7: 15, 13: 20, 17: 25 }, { units: 'ft' }),
      scale('traction', 'Ancre — Traction', 'distance', { 2: 10, 7: 15, 13: 20, 17: 25 }, { units: 'ft' }),
      scale('singularite', 'Ancre — Singularité (DF)', 'number', { 2: 2, 7: 3, 13: 4, 17: 5 }),
      scale('constellation', 'Constellation mobile', 'distance', { 9: 15, 13: 30 }, { units: 'ft' })
    ]
  }
});
