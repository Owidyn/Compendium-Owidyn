import { CLASS_FEATURES, FOLDERS, heliarqueClass, manifestation } from './heliarque.mjs';
import { FORM_ACTORS } from './forms.mjs';
import { MODULE_ID } from './helpers.mjs';
import { SUBCLASS_FEATURES, soothingStar } from './soothing-star.mjs';
import { TECHNIQUES } from './techniques.mjs';

/**
 * Folders of the Classes compendium, as for the other classes: Héliarque holds the class, Class Features, the techniques
 * and the folder of the subclass (Soothing Star: the subclass and its Subclass Features). Solar gold, like the class.
 */
const folder = (_id, name, sort, parent = null) => ({
  _id, name, type: 'Item', folder: parent, sorting: 'm', sort, color: '#b8860b', description: '',
  flags: { [MODULE_ID]: { heliarque: { folder: true } } },
  _stats: { compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '14.367', systemId: 'dnd5e', systemVersion: '6.0.6', createdTime: null, modifiedTime: null, lastModifiedBy: null }
});

export function allContent() {
  return {
    items: [heliarqueClass, ...CLASS_FEATURES, manifestation, ...TECHNIQUES, soothingStar, ...SUBCLASS_FEATURES],
    actors: FORM_ACTORS,
    folders: [
      folder(FOLDERS.class, 'Héliarque', 200000),
      folder(FOLDERS.features, 'Class Features', 100, FOLDERS.class),
      folder(FOLDERS.techniques, 'Techniques stellaires (sorts)', 200, FOLDERS.class),
      folder(FOLDERS.subclass, 'Soothing Star', 300, FOLDERS.class),
      folder(FOLDERS.subclassFeatures, 'Subclass Features', 100, FOLDERS.subclass)
    ]
  };
}
