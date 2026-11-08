/** Discipline stellaire : Soothing Star. */
import { CHA, DF, PB, activity, baseItem, effect, feature, grant, icon, id, itemUuid } from './helpers.mjs';

// The subclass has its own folder in the class folder (Héliarque › Soothing Star), its features in its Subclass Features
const FOLDER = id('folder:subclass-features');
const SUBCLASS_FOLDER = id('folder:soothing-star');

const subFeature = (key, name, level, o = {}) => feature(key, name, {
  level, requirements: `Héliarque ${level} (Soothing Star)`, folder: FOLDER, sort: level * 1000, ...o
});

const sillage = subFeature('sillage-apaisant', 'Sillage apaisant', 3, {
  img: icon('sillage-apaisant'),
  activities: [
    activity('sillage-apaisant:reconfort', 'heal', 'Réconfort', {
      activation: 'special', condition: 'Une fois par tour, après une Commande ou une Technique ayant un Satellite comme Origine',
      range: { value: 15, special: 'De la Forme ou du Satellite' }, affects: { count: 1, type: 'ally' },
      healing: { formula: `@scale.heliarque.fusion + ${CHA()}`, types: ['temphp'] }, heliarque: { role: 'sillage' }
    }),
    activity('sillage-apaisant:elan', 'utility', 'Élan', {
      activation: 'special', condition: 'Une fois par tour, après une Commande ou une Technique ayant un Satellite comme Origine',
      range: { value: 15, special: 'De la Forme ou du Satellite' }, affects: { count: 1, type: 'ally' },
      heliarque: { role: 'sillage', move: { mode: 'free', distance: '10', subject: 'targets' } }
    })
  ],
  description: `
Toutes les étoiles ne brûlent pas pour détruire. Certaines éclairent, guident et maintiennent les autres en vie au milieu de l'obscurité.

Une fois pendant chacun de vos tours, lorsque vous :
- utilisez la Commande d'une Forme ;
- ou utilisez une Technique ayant un Satellite comme Origine ;

choisissez une créature alliée située à 15 ft ou moins de cette Forme ou de ce Satellite. Choisissez un effet.

**Réconfort.** La créature gagne des Temporary Hit Points égaux à **1 Dé de Fusion + votre modificateur de Charisma**.

**Élan.** La créature peut immédiatement se déplacer jusqu'à **10 ft** sans provoquer d'Opportunity Attacks.

*Le module propose le Sillage apaisant dans la discussion après chaque Commande ou Technique éligible.*`
});

/** Level marker: the four presences live on the Form sheets and are added there automatically. */
const presences = subFeature('presences-apaisantes', 'Présences apaisantes', 6, {
  img: icon('presences-apaisantes'),
  description: `
Les Présences de vos Formes procurent désormais des bénéfices supplémentaires.
- **Satellite — Étoile guide.** Les créatures alliées situées à 10 ft ou moins du Satellite ont Advantage aux Wisdom (Perception) checks et ne peuvent pas être Surprised tant qu'elles peuvent percevoir le Satellite.
- **Halo — Chaleur réconfortante.** Au début de chacun de ses tours, le porteur du Halo gagne des Temporary Hit Points égaux à votre Proficiency Bonus.
- **Bastion — Refuge.** Les créatures alliées situées à 5 ft ou moins du Bastion gagnent +1 AC.
- **Ancre — Stabilité.** Les créatures alliées situées dans le Champ gravitationnel ont Advantage aux Saving Throws contre Charmed, Frightened et les effets qui devraient les déplacer contre leur volonté.

*Ces Présences sont ajoutées sur les fiches de vos Formes et appliquées automatiquement selon la position des pions.*`
});

const notYet = subFeature('not-yet', 'NOT YET', 10, {
  img: icon('not-yet'),
  uses: { max: '1', recovery: [{ period: 'sr', type: 'recoverAll' }] },
  activities: [
    activity('not-yet:chute', 'heal', 'Refuser la chute', {
      activation: 'reaction', uses: true, condition: 'Un allié à 30 ft ou moins d\'une Forme devrait tomber à 0 Hit Points',
      affects: { count: 1, type: 'ally' }, healing: { formula: `${DF(2)} + ${CHA()}` },
      heliarque: { role: 'notyet', sacrifice: true, teleportToForm: true }
    }),
    activity('not-yet:echec', 'utility', 'Refuser l\'échec', {
      activation: 'reaction', uses: true, condition: 'Un allié à 30 ft ou moins d\'une Forme échoue à un Saving Throw',
      affects: { count: 1, type: 'ally' }, roll: { formula: DF(1), name: 'Bonus au nouveau jet' },
      heliarque: { role: 'notyet', sacrifice: true }
    })
  ],
  description: `
Lorsque l'un de vos alliés situé à 30 ft ou moins d'une Forme devrait tomber à 0 Hit Points ou échoue à un Saving Throw, vous pouvez utiliser votre Reaction. Choisissez une Forme située à 30 ft ou moins de cette créature et détruisez-la. Son Orbital devient Dépensé et sa Rupture n'est pas déclenchée. Choisissez l'effet approprié.

**Refuser la chute.** Si la créature devait tomber à 0 Hit Points, elle tombe à **1 Hit Point** à la place. Elle gagne ensuite **2 Dés de Fusion + votre modificateur de Charisma Hit Points** et peut se téléporter dans l'espace qu'occupait la Forme ou dans un espace inoccupé situé à 5 ft ou moins.

**Refuser l'échec.** Si la créature a échoué à un Saving Throw, elle relance immédiatement le Saving Throw et ajoute **1 Dé de Fusion** au nouveau résultat. Elle doit utiliser ce nouveau résultat.

Une fois NOT YET utilisé, vous devez terminer un Short ou Long Rest avant de pouvoir l'utiliser de nouveau.`
});

const secondDawn = subFeature('second-dawn', 'SECOND DAWN', 14, {
  img: icon('second-dawn'),
  uses: { max: '1', recovery: [{ period: 'lr', type: 'recoverAll' }] },
  effects: [effect('second-dawn:sillage', 'SECOND DAWN — Sillage redoublé', {
    img: icon('second-dawn'), rounds: 10, expiry: 'turnEnd',
    description: 'Vous pouvez utiliser Sillage apaisant deux fois pendant chacun de vos tours ; une même créature ne peut en bénéficier qu\'une fois par tour.'
  })],
  activities: [activity('second-dawn:use', 'heal', 'SECOND DAWN', {
    activation: 'bonus', uses: true, affects: { type: 'ally', choice: true, special: 'À 30 ft ou moins d\'au moins une de vos Formes' },
    healing: { formula: `${DF(4)} + ${CHA()}` }, effects: ['second-dawn:sillage'],
    heliarque: { role: 'second-dawn', move: { mode: 'free', distance: 'halfSpeed', subject: 'targets', optional: true } }
  })],
  description: `
Par une Bonus Action, chacune de vos Formes libère simultanément une vague d'énergie apaisante. Choisissez n'importe quel nombre de créatures alliées situées à 30 ft ou moins d'au moins une de vos Formes. Chaque cible :
- récupère **4 Dés de Fusion + votre modificateur de Charisma Hit Points** ;
- peut mettre fin à l'une des conditions Charmed, Frightened, Poisoned ou Prone qui l'affectent ;
- peut immédiatement se déplacer jusqu'à la moitié de sa Speed sans provoquer d'Opportunity Attacks.

Pendant 1 minute après l'activation de SECOND DAWN, vous pouvez utiliser **Sillage apaisant deux fois pendant chacun de vos tours**, mais une même créature ne peut en bénéficier qu'une seule fois par tour.

Une fois cette aptitude utilisée, vous devez terminer un Long Rest avant de pouvoir l'utiliser de nouveau.`
});

export const SUBCLASS_FEATURES = [sillage, presences, notYet, secondDawn];

export const soothingStar = baseItem('soothing-star', 'subclass', 'Soothing Star', {
  img: icon('soothing-star'), folder: SUBCLASS_FOLDER, sort: 0,
  description: `
Toutes les étoiles ne brûlent pas pour détruire. Certaines éclairent, guident et maintiennent les autres en vie au milieu de l'obscurité.

Les Héliarques de la **Soothing Star** font de leur constellation un refuge : leurs Formes protègent, déplacent et relèvent leurs alliés.

| Niveau | Aptitude |
|:---:|:---|
| 3 | Sillage apaisant |
| 6 | Présences apaisantes |
| 10 | NOT YET |
| 14 | SECOND DAWN |`,
  system: {
    classIdentifier: 'heliarque',
    spellcasting: { progression: 'none', ability: '', preparation: { formula: '' } },
    advancement: [
      grant('soothing:3', 3, [itemUuid('sillage-apaisant')], 'Aptitudes de Discipline'),
      grant('soothing:6', 6, [itemUuid('presences-apaisantes')], 'Aptitudes de Discipline'),
      grant('soothing:10', 10, [itemUuid('not-yet')], 'Aptitudes de Discipline'),
      grant('soothing:14', 14, [itemUuid('second-dawn')], 'Aptitudes de Discipline')
    ]
  }
});
