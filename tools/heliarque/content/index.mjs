import { CLASS_FEATURES, FOLDERS, heliarqueClass, manifestation } from './heliarque.mjs';
import { FORM_ACTORS } from './forms.mjs';
import { MODULE_ID } from './helpers.mjs';
import { SUBCLASS_FEATURES, soothingStar } from './soothing-star.mjs';
import { TECHNIQUES } from './techniques.mjs';

/** Folder of the shared Item compendium. The class folder's parent (Class) is chosen by the build. */
const folder = (_id, name, sort, parent = null) => ({
  _id, name, type: 'Item', folder: parent, sorting: 'm', sort, color: null, description: '',
  flags: { [MODULE_ID]: { heliarque: { folder: true } } },
  _stats: { compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '14.367', systemId: 'dnd5e', systemVersion: '6.0.6', createdTime: null, modifiedTime: null, lastModifiedBy: null }
});

export function allContent() {
  return {
    items: [heliarqueClass, ...CLASS_FEATURES, manifestation, ...TECHNIQUES, soothingStar, ...SUBCLASS_FEATURES],
    actors: FORM_ACTORS,
    folders: [
      folder(FOLDERS.class, 'Héliarque', 200000),
      folder(FOLDERS.features, 'Aptitudes de classe', 100, FOLDERS.class),
      folder(FOLDERS.techniques, 'Techniques stellaires (sorts)', 200, FOLDERS.class),
      folder(FOLDERS.subclass, 'Discipline — Soothing Star', 300, FOLDERS.class)
    ]
  };
}
