/**
 * Compendium Owidyn.
 * The classes with automation each keep theirs in their own folder; owidyn/ holds the helpers shared by the rest of
 * the compendium content (and the update of worlds made with the former compendiums), boutiques/ the shop generators.
 * They register their hooks on import and publish their API under game.modules.get('compendium-owidyn').api.
 */
import './owidyn/migration.mjs';
import './owidyn/effets-activables.mjs';
import './owidyn/effets-formules.mjs';
import './owidyn/familiar-friend.mjs';
import './owidyn/sceau-de-confinement.mjs';
import './boutiques/boutiques.mjs';
import './heliarque/heliarque.mjs';
import './cartomancien/cartomancien.js';
