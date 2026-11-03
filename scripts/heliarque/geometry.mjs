/** Scene geometry in feet, independent of the viewed canvas where possible. */
const EPSILON = 1e-6;
export const docOf = token => token?.document ?? token;

const gridOf = scene => ({ size: scene.grid.size, distance: scene.grid.distance, diagonals: scene.grid.diagonals });

/** Scene units per foot (5 ft = 1.5 m on metric scenes). */
export function feetToUnits(feet, scene) {
  const units = scene?.grid?.units?.toLowerCase?.() ?? 'ft';
  const convert = dnd5e?.utils?.convertLength;
  if (convert) return convert(feet, 'ft', units, { strict: false });
  return ['m', 'mètres', 'meters'].includes(units) ? feet * 0.3 : feet;
}

/** Bounding box of a token in pixels, optionally at another position. */
export function boundsOf(token, position = {}) {
  token = docOf(token);
  const size = token.parent.grid.size;
  return {
    x: position.x ?? token.x, y: position.y ?? token.y,
    w: token.width * size, h: token.height * size,
    elevation: position.elevation ?? token.elevation ?? 0
  };
}
export function centerOf(token, position = {}) {
  const b = boundsOf(token, position);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2, elevation: b.elevation };
}

/** Grid distance (scene units) for pixel offsets, honouring the scene's diagonal rule. */
function measure(dxPx, dyPx, dz, scene) {
  const { size, distance, diagonals } = gridOf(scene);
  const dx = Math.abs(dxPx) / size, dy = Math.abs(dyPx) / size;
  const modes = CONST.GRID_DIAGONALS;
  let planar;
  if (scene.grid.type === CONST.GRID_TYPES.GRIDLESS) planar = Math.hypot(dx, dy) * distance;
  else if (diagonals === modes.EQUIDISTANT) planar = Math.max(dx, dy) * distance;
  else if (diagonals === modes.RECTILINEAR) planar = (dx + dy) * distance;
  else if (diagonals === modes.ALTERNATING_1) planar = (Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2)) * distance;
  else planar = Math.hypot(dx, dy) * distance;
  return Math.max(planar, Math.abs(dz));
}

/**
 * D&D distance between two tokens' spaces, in scene units: 0 when they overlap,
 * one square (5 ft) when adjacent, and so on.
 */
export function gapBetween(a, b, positionA = {}) {
  const A = boundsOf(a, positionA), B = boundsOf(b);
  const scene = docOf(a).parent;
  const size = scene.grid.size;
  // Signed number of squares separating the spaces on each axis (negative = overlap).
  const sepX = (Math.abs((A.x + A.w / 2) - (B.x + B.w / 2)) - (A.w + B.w) / 2) / size;
  const sepY = (Math.abs((A.y + A.h / 2) - (B.y + B.h / 2)) - (A.h + B.h) / 2) / size;
  const dz = Math.abs(A.elevation - B.elevation);
  if (scene.grid.type === CONST.GRID_TYPES.GRIDLESS) {
    return Math.max(Math.hypot(Math.max(0, sepX), Math.max(0, sepY)) * scene.grid.distance, dz);
  }
  const steps = sep => (sep < -EPSILON ? 0 : Math.round(sep) + 1);
  const sx = steps(sepX), sy = steps(sepY);
  if (!sx && !sy) return dz;
  return measure(sx * size, sy * size, dz, scene);
}

/** Is `b` within `feet` of `a` (D&D "within X ft": edge to edge)? */
export function within(a, b, feet, positionA = {}) {
  const scene = docOf(a).parent;
  return gapBetween(a, b, positionA) <= feetToUnits(feet, scene) + EPSILON;
}

/** Distance between two points in scene units. */
export function pointDistance(p, q, scene) {
  return measure(p.x - q.x, p.y - q.y, (p.elevation ?? 0) - (q.elevation ?? 0), scene);
}

/** Shortest pixel distance from point p to segment ab. */
export function segmentDistance(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

/** Tokens whose space touches a polyline of the given width (feet). */
export function tokensOnPath(scene, points, widthFeet = 5, exclude = new Set()) {
  const pxPerUnit = scene.grid.size / scene.grid.distance;
  const half = feetToUnits(widthFeet, scene) * pxPerUnit / 2;
  const hits = [];
  for (const token of scene.tokens) {
    if (exclude.has(token.id) || token.hidden) continue;
    const c = centerOf(token);
    const radius = Math.min(token.width, token.height) * scene.grid.size / 2;
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentDistance(c, points[i], points[i + 1]) <= half + radius - EPSILON) { hits.push(token); break; }
    }
  }
  return hits;
}

/** Does a wall block movement (or sight) between two points? Only reliable on the viewed scene. */
export function blocked(scene, a, b, type = 'move') {
  if (canvas.scene?.id !== scene.id) return false;
  const backend = CONFIG.Canvas.polygonBackends[type];
  return backend?.testCollision(a, b, { type, mode: 'any' }) ?? false;
}

/** Is a token-sized space at position free of other tokens? */
export function occupied(token, position, ignore = new Set()) {
  token = docOf(token);
  const A = boundsOf(token, position);
  for (const other of token.parent.tokens) {
    if (other.id === token.id || ignore.has(other.id) || other.hidden) continue;
    const B = boundsOf(other);
    if (A.x < B.x + B.w - EPSILON && A.x + A.w > B.x + EPSILON && A.y < B.y + B.h - EPSILON && A.y + A.h > B.y + EPSILON) return true;
  }
  return false;
}

/** Snap a top-left position to the scene grid. */
export function snap(scene, position) {
  if (scene.grid.type === CONST.GRID_TYPES.GRIDLESS || canvas.scene?.id !== scene.id) return position;
  const p = canvas.grid.getSnappedPoint(position, { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER });
  return { ...position, x: p.x, y: p.y };
}

/**
 * Destination of a straight push or pull: move `token` up to `feet` along the line from `from` (point)
 * through the token's centre, stopping before walls and occupied spaces.
 * @param {'away'|'toward'} direction
 * @returns {{x:number, y:number}|null}  New top-left, or null when the token cannot move.
 */
export function straightDestination(token, from, feet, direction = 'away', { ignore = new Set() } = {}) {
  token = docOf(token);
  const scene = token.parent;
  const start = centerOf(token);
  let vx = start.x - from.x, vy = start.y - from.y;
  const length = Math.hypot(vx, vy);
  if (length < EPSILON) return null;
  vx /= length; vy /= length;
  if (direction === 'toward') { vx = -vx; vy = -vy; }
  const pxPerFoot = scene.grid.size / scene.grid.distance * feetToUnits(1, scene);
  const step = scene.grid.size / 2;
  let maxPx = feet * pxPerFoot;
  // A pull stops when the token reaches the origin's space.
  if (direction === 'toward') maxPx = Math.min(maxPx, Math.max(0, length - scene.grid.size * (token.width / 2 + 0.5)));
  let best = null;
  for (let travelled = step; travelled <= maxPx + EPSILON; travelled += step) {
    const center = { x: start.x + vx * travelled, y: start.y + vy * travelled };
    const position = snap(scene, { x: center.x - token.width * scene.grid.size / 2, y: center.y - token.height * scene.grid.size / 2 });
    if (position.x === token.x && position.y === token.y) continue;
    if (blocked(scene, start, centerOf(token, position))) break;
    if (occupied(token, position, ignore)) continue;
    if (pointDistance(centerOf(token, position), start, scene) > feetToUnits(feet, scene) + EPSILON) break;
    best = position;
  }
  return best;
}

let picking = false;
/**
 * Let the user choose a destination for a token with Foundry's token placement preview.
 * Left-click confirms; right-click or Escape cancels.
 * @param {TokenDocument} token
 * @param {object} options
 * @param {number} options.maxFeet       Maximum straight-line distance from the token's current position.
 * @param {boolean} [options.teleport]   Ignore walls between start and destination.
 * @param {(position) => string|null} [options.validate]  Extra rule; return an error message to refuse.
 */
export async function pickDestination(token, { maxFeet = Infinity, teleport = false, validate, title = 'Choisir la destination' } = {}) {
  token = docOf(token);
  const scene = token.parent;
  if (canvas.scene?.id !== scene.id) throw new Error('Affichez la scène du pion pour choisir sa destination.');
  if (picking) throw new Error('Terminez ou annulez le placement en cours.');
  const start = centerOf(token);
  const data = token.toObject();
  delete data._id;
  const check = document => {
    const position = { x: document.x, y: document.y, elevation: document.elevation ?? token.elevation };
    const end = centerOf(token, position);
    if (pointDistance(start, end, scene) > feetToUnits(maxFeet, scene) + EPSILON) return `Destination au-delà de ${maxFeet} ft.`;
    if (!teleport && blocked(scene, start, end)) return 'Un mur bloque ce déplacement.';
    if (occupied(token, position)) return 'Cet emplacement est occupé.';
    return validate?.(position) ?? null;
  };
  picking = true;
  try {
    ui.notifications.info(`${title} (${Number.isFinite(maxFeet) ? `${maxFeet} ft max ; ` : ''}clic gauche pour valider, Échap pour annuler).`);
    const placed = await canvas.tokens.placeTokens([data], {
      create: false, allowRotation: false,
      onChange: ({ document, preview }) => { if (preview?.mesh) preview.mesh.tint = check(document) ? 0xff7777 : 0x99ffbb; },
      preConfirm: ({ document }) => {
        const error = check(document);
        if (error) ui.notifications.warn(error);
        return !error;
      }
    });
    if (!placed?.length) return null;
    return { x: placed[0].x, y: placed[0].y, elevation: placed[0].elevation ?? token.elevation };
  } finally {
    picking = false;
  }
}
