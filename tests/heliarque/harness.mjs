/** Minimal test runner (this machine runs Node 16.15, which predates node:test). */
const tests = [];
let setup = null;
export const test = (name, fn) => tests.push({ name, fn });
export const beforeEach = fn => { setup = fn; };

let scheduled = false;
export function run() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(async () => {
    let failed = 0;
    for (const { name, fn } of tests) {
      try {
        await setup?.();
        await fn();
        console.log(`ok - ${name}`);
      } catch (err) {
        failed++;
        console.log(`not ok - ${name}\n  ${err.stack.split('\n').slice(0, 4).join('\n  ')}`);
      }
    }
    console.log(`${tests.length - failed} réussi(s), ${failed} échec(s)`);
    if (failed) process.exitCode = 1;
  });
}
