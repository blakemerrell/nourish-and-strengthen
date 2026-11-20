/* A lift's own actions, reached the way a thumb reaches them since redesign
 * 2b (2026-11-20): Warm-ups, Plates, Swap, Note and Remove left the row under
 * the sets and live in the lift's ⋯ alone (#trPop, src/train.js). These open
 * the ⋯ when it is not already open on that lift, then tap the action there.
 *
 *   await liftAct(p, 'swap', 0)          // the first lift's Swap
 *   await liftAct(p, 'note', 'bb-bench') // by exercise id, for the data-e ones
 *   await liftHas(p, 'plates', 1)        // is it offered, without tapping it
 */
async function indexOf(p, x) {
  if (typeof x === 'number') return x;
  return p.evaluate((e) => window.Train._.state().LIVE.x.findIndex((z) => z.e === e), x);
}

async function openMenu(p, i) {
  const open = await p.evaluate((n) => {
    const pop = document.querySelector('#trPop .tr-pop-card');
    if (!pop) return false;
    const it = pop.querySelector('[data-x]');
    return !!it && String(it.dataset.x) === String(n);
  }, i);
  if (!open) {
    await p.click(`.tr-ex [data-t="expop"][data-x="${i}"]`);
    await p.waitForTimeout(150);
  }
}

async function liftAct(p, t, x) {
  const i = await indexOf(p, x);
  await openMenu(p, i);
  const sel = t === 'note' || t === 'barpick'
    ? `#trPop [data-t="${t}"]`
    : `#trPop [data-t="${t}"][data-x="${i}"]`;
  await p.click(sel);
  await p.waitForTimeout(150);
}

async function liftHas(p, t, x) {
  const i = await indexOf(p, x);
  await openMenu(p, i);
  const has = await p.evaluate((q) => !!document.querySelector(q), `#trPop [data-t="${t}"]`);
  const close = await p.$('#trPop [data-t="popclose"].tr-pop-x');
  if (close) { await close.click(); await p.waitForTimeout(100); }
  return has;
}

module.exports = { liftAct, liftHas };
