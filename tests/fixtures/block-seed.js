/* A running block for tests/lightup.test.js, built with Strengthen's own
 * build and plan: o.weeks is, for each block week, the days logged as
 * [day, share of the planned sets], each week's sets climbing as the plan
 * does. Run in the page (p.evaluate), after the app has loaded. */
module.exports = function (o) {
  const _ = window.Train._, now = Date.now(), day = 864e5;
  const ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 5, pri: [] });
  ms.id = 'hm'; ms.n = 'Upper & Lower'; ms.at = now - 26 * day; ms.st = new Date(now - 26 * day).toISOString().slice(0, 10);
  const wo = {};
  let n = 0;
  const log = (w, d, st, frac) => {
    const pl = _.plan(ms, w, d), id = 'h' + (n++);
    wo[id] = { id, st, en: st + 50 * 60e3, u: 'lb', ms: ms.id, w, d, n: pl.n,
      x: pl.x.map((x, k) => ({ e: x.e, s: Array.from({ length: Math.max(1, Math.ceil(x.sets * frac * (1 + 0.27 * w))) }, (_, j) => ({ w: 90 + 10 * k + 5 * w, r: 10, t: st + 60e3 * (k * 5 + j + 1) })) })), sr: {}, fb: {} };
  };
  const weeks = o.weeks;   // per week: list of [day, fraction of sets]
  weeks.forEach((ds, w) => ds.forEach((dd) => log(w, dd[0], now - (27 - w * 7 - dd[0] * 2) * day, dd[1])));
  localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'hm', ms: { hm: ms }, cx: {}, ax: {}, wo }));
  localStorage.removeItem('bsc.trainStamps'); _.reload();
};
