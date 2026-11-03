/**
 * GM relay. Players cannot delete Form tokens, move hostile tokens or edit allies' effects;
 * those operations run on the active GM's client.
 */
import { MODULE_ID, isActiveGM } from './util.mjs';

const CHANNEL = `module.${MODULE_ID}`;
const handlers = new Map();
const pending = new Map();
const TIMEOUT = 20000;

/** Register an operation the GM can execute. Handlers receive plain data (UUIDs, numbers). */
export function registerGM(name, handler) {
  handlers.set(name, handler);
}

/** Run an operation as the active GM: locally when this client is the GM, otherwise over the socket. */
export async function asGM(name, data = {}) {
  if (isActiveGM()) return handlers.get(name)(data, game.user.id);
  if (!game.users.activeGM) throw new Error('Un MJ doit être connecté pour cette action.');
  const requestId = foundry.utils.randomID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('Le MJ n\'a pas répondu.')); }, TIMEOUT);
    pending.set(requestId, { resolve, reject, timer });
    game.socket.emit(CHANNEL, { type: 'request', requestId, name, data, userId: game.user.id });
  });
}

export function registerSocket() {
  game.socket.on(CHANNEL, async message => {
    if (message.type === 'response') {
      const entry = pending.get(message.requestId);
      if (!entry || message.userId !== game.user.id) return;
      clearTimeout(entry.timer); pending.delete(message.requestId);
      if (message.error) entry.reject(new Error(message.error)); else entry.resolve(message.result);
      return;
    }
    if (message.type !== 'request' || !isActiveGM()) return;
    let result = null, error = null;
    try {
      const handler = handlers.get(message.name);
      if (!handler) throw new Error(`Opération inconnue : ${message.name}`);
      result = await handler(message.data, message.userId);
    } catch (err) {
      console.error(`${MODULE_ID} | ${message.name}`, err);
      error = err.message;
    }
    game.socket.emit(CHANNEL, { type: 'response', requestId: message.requestId, userId: message.userId, result, error });
  });
}
