/* The food log a year to an account record.
 *
 * Blake, 2026-10-18: "I lose everything after 4 months. I would assume that
 * I'm keeping everything." Since then nothing is let go of, and the account
 * keeps the days one record per calendar year under yours
 * (users/{uid}/days/2026), as Strengthen keeps its workouts, so the log never
 * meets the megabyte a single record holds. src/signin.js, "the day log, a
 * year to a record".
 *
 * A stand-in for the account, as tests/train.test.js has for the workouts:
 * the one record, the records under it, their listeners, and Firestore's
 * delete marker. `deny` is the database before the rule for the yearly
 * records is published. */
const fakeAcct = () => {
  const A = window.__acct = { main: {}, yrs: {}, writes: [], deny: false, subs: [] };
  const DEL = { __del: 1 };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const put = (to, from) => { Object.keys(from).forEach((k) => {
    const v = from[k];
    if (v === DEL) delete to[k];
    // Real Firestore set(merge:true) treats an empty map {} as a leaf value and overwrites to[k] with {}
    else if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0 && to[k] && typeof to[k] === 'object') put(to[k], v);
    else to[k] = JSON.parse(JSON.stringify(v, (kk, vv) => (vv === DEL ? undefined : vv)));
  }); };
  const cut = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === DEL ? '(deleted)' : v)));
  const tell = () => setTimeout(() => A.subs.slice().forEach((f) => f()), 5);
  const listen = (f) => { A.subs.push(f); setTimeout(f, 10); return () => { A.subs = A.subs.filter((x) => x !== f); }; };
  A.doc = {
    set: (d) => { A.writes.push(['main', cut(d)]); put(A.main, d); tell(); return Promise.resolve(); },
    onSnapshot: (o, next) => listen(() => next({ exists: true, data: () => clone(A.main), metadata: { fromCache: false, hasPendingWrites: false } })),
    collection: (name) => (name !== 'days'
      // Strengthen's years, which this test leaves alone
      ? { doc: () => ({ set: () => Promise.resolve() }), onSnapshot: () => () => {} }
      : {
        doc: (y) => ({ set: (d) => {
          if (A.deny) return Promise.reject({ code: 'permission-denied' });
          A.writes.push([y, cut(d)]); A.yrs[y] = A.yrs[y] || {}; put(A.yrs[y], d); tell(); return Promise.resolve();
        } }),
        onSnapshot: (o, next, err) => {
          if (A.deny) { setTimeout(() => err({ code: 'permission-denied' }), 10); return () => {}; }
          return listen(() => next({ metadata: { fromCache: false }, forEach: (fn) => Object.keys(A.yrs).forEach((y) => fn({ id: y, data: () => clone(A.yrs[y]) })) }));
        },
      }),
  };
  A.fv = { delete: () => DEL, serverTimestamp: () => ({ __ts: 1 }) };
  window.firebase = window.firebase || {};
  window.firebase.firestore = window.firebase.firestore || {};
  window.firebase.firestore.FieldValue = A.fv;
};

const plate = (k, x) => ({ id: 'f:' + k, x: x, eaten: 0 });
/* Your one record as an older version of the app left it: everything in it,
   two years of days and weigh-ins beside the profile and plan. */
const MAIN = {
  myday: {
    pr: { v: { sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }, at: 1000 },
    t: { v: { p: 190, f: 70, c: 230 }, at: 1000 },
    sl: { v: { list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }],
      names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }, at: 1000 },
    d: { '2024_05_01': { v: { b: [plate('egg', 2)] }, at: 1000 },
      '2025_03_02': { v: { l: [plate('chicken_breast', 1)] }, at: 1000 },
      '2026_10_01': { v: { d: [plate('green_beans', 1)] }, at: 1000 } },
    w: { '2025_03_02': { v: 196, at: 1000 }, '2026_10_01': { v: 192, at: 1000 } },
  },
};
const wait = (p, ms) => p.waitForTimeout(ms);
const daysIn = (o, part) => Object.keys(((o || {}).myday || {})[part] || {}).sort().join();

module.exports = {
  name: 'The food log, a year to an account record',
  async run(t) {
    const errs = [];
    const open = async (deny, local) => {
      const p = await t.fresh({ viewport: { width: 390, height: 844 } });
      p.on('pageerror', (e) => errs.push(e.message));
      await p.clock.setFixedTime(new Date(2026, 9, 8, 10, 0, 0));
      await p.reload();
      await wait(p, 400);
      if (local) { await p.evaluate(local); await p.reload(); await wait(p, 500); }
      await p.evaluate(({ fake, main, deny }) => {
        eval('(' + fake + ')')();
        window.__acct.deny = deny;
        window.__acct.main = main;
      }, { fake: fakeAcct.toString(), main: MAIN, deny });
      return p;
    };
    const attach = async (p, extra) => {
      await p.evaluate((x) => {
        if (x) Object.keys(x).forEach((y) => { window.__acct.yrs[y] = x[y]; });
        window.__macroLab.acct(window.__acct.doc, window.__acct.fv);
      }, extra || null);
      await wait(p, 1500);
    };
    const local = (p) => p.evaluate(() => ({ d: Object.keys(JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')).sort().join(),
      w: Object.keys(JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')).sort().join() }));

    /* ---- before the rule is published: all in the one record, as it always was */
    let p = await open(true);
    await attach(p);
    let r = await p.evaluate(() => { const A = window.__acct;
      return { yrs: Object.keys(A.yrs).length, main: Object.keys(A.main.myday.d).sort().join(),
        resent: A.writes.filter((w) => w[0] === 'main' && w[1].myday && Object.keys(w[1].myday.d || {}).length).length }; });
    let here = await local(p);
    t.ok('with the yearly rule not yet published, every day comes down to the phone and stays in the one record',
      !r.yrs && r.main === '2024_05_01,2025_03_02,2026_10_01' && here.d === '2024-05-01,2025-03-02,2026-10-01', JSON.stringify({ r, here }));
    t.ok('and the first push sends back none of the days the record already holds', r.resent === 0, JSON.stringify(r));
    await p.context().close();

    /* ---- published: every day to its year, and only then out of the one record */
    p = await open(false, () => {
      // a day this phone logged before the account's copy of it came in, older than that copy
      localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-09': { b: [{ id: 'f:egg', x: 1, eaten: 0 }] } }));
      localStorage.setItem('bsc.myStamps', JSON.stringify({ d: { '2026-10-09': 3000 } }));
    });
    // and the account's copy of that day, already in its year, with lunch on it and nothing at breakfast
    await attach(p, { 2026: { myday: { d: { '2026_10_09': { v: { l: [plate('chicken_breast', 1)] }, at: 5000 } } } } });
    r = await p.evaluate(() => { const A = window.__acct, order = A.writes.map((w) => w[0]);
      const del = order.findIndex((w, i) => w === 'main' && JSON.stringify(A.writes[i][1]).indexOf('(deleted)') >= 0);
      return { yrs: Object.keys(A.yrs).sort().join(), y24: A.yrs['2024'], y25: A.yrs['2025'], y26: A.yrs['2026'], main: A.main.myday,
        firstYear: Math.min(...['2024', '2025'].map((y) => order.indexOf(y))), del, order: order.join() }; });
    t.ok('published: each day and weigh-in is copied into its year’s record',
      r.yrs === '2024,2025,2026' && daysIn(r.y24, 'd') === '2024_05_01' && daysIn(r.y25, 'd') === '2025_03_02' && daysIn(r.y25, 'w') === '2025_03_02' &&
      /2026_10_01/.test(daysIn(r.y26, 'd')) && daysIn(r.y26, 'w') === '2026_10_01' && r.y24.myday.d['2024_05_01'].at === 1000, JSON.stringify(r));
    t.ok('and only after that is it taken out of the one record, which keeps your profile, plan and meals and no days',
      r.firstYear >= 0 && r.del > r.firstYear && !Object.keys(r.main.d || {}).length && !Object.keys(r.main.w || {}).length &&
      r.main.t && r.main.t.v.p === 190 && r.main.sl && r.main.pr, JSON.stringify(r));
    here = await local(p);
    t.ok('the phone still has every day', here.d === '2024-05-01,2025-03-02,2026-10-01,2026-10-09' && here.w === '2025-03-02,2026-10-01', JSON.stringify(here));
    const mixed = r.y26.myday.d['2026_10_09'];
    t.ok('a day made of both copies (the account’s lunch, this phone’s breakfast) goes up whole, though its stamp is the account’s',
      mixed && mixed.at === 5000 && mixed.v.b && mixed.v.b.length === 1 && mixed.v.l && mixed.v.l.length === 1, JSON.stringify(mixed));

    // a new session: nothing the years already hold is sent again
    r = await p.evaluate(async () => { const A = window.__acct; A.writes = [];
      window.__macroLab.acct(A.doc, A.fv);
      await new Promise((res) => setTimeout(res, 1500));
      return A.writes.map((w) => w[0] + ':' + JSON.stringify(w[1])); });
    t.ok('the next time the app opens, nothing the years already hold goes up again, and nothing is written for nothing',
      !r.some((w) => /"(d|w|dn|tn|sp|sn)":\{"20/.test(w)) && !r.some((w) => w === 'main:{"myday":{}}'), JSON.stringify(r));

    // a day changed on this phone goes to its own year and not to the one record
    r = await p.evaluate(async () => { const A = window.__acct; A.writes = [];
      window.__macroLab.balance();
      await new Promise((res) => setTimeout(res, 1500));
      return { to: A.writes.map((w) => w[0]).join(), y: (A.yrs['2026'].myday.d['2026_10_08'] || {}).at, main: Object.keys(A.main.myday.d || {}).join() }; });
    t.ok('a day filled in on this phone goes to its year’s record, and the one record is not written at all', r.to === '2026' && r.y > 5000 && r.main === '', JSON.stringify(r));

    // a phone on the old version puts a day back in the one record: taken in, moved again, never lost
    r = await p.evaluate(async () => { const A = window.__acct;
      A.main.myday.d = { '2025_03_02': { v: { l: [{ id: 'f:chicken_breast', x: 2, eaten: 0 }], d: [{ id: 66, x: 1, eaten: 0 }] }, at: Date.now() - 60e3 } };
      A.subs.slice().forEach((f) => f());
      await new Promise((res) => setTimeout(res, 1800));
      const mine = JSON.parse(localStorage.getItem('bsc.macroDays'))['2025-03-02'];
      return { here: mine.d && mine.d.length, y: A.yrs['2025'].myday.d['2025_03_02'], main: Object.keys(A.main.myday.d || {}).join() }; });
    t.ok('a day an older version wrote to the one record wins here, moves to its year, and leaves the one record',
      r.here === 1 && r.y && r.y.v.d && r.y.v.l[0].x === 2 && r.main === '', JSON.stringify(r));

    // a day stamped in the future by a phone with a wrong clock: taken in capped, and not sent round and round
    r = await p.evaluate(async () => { const A = window.__acct; A.writes = [];
      A.main.myday.d = { '2024_05_01': { v: { b: [{ id: 'f:egg', x: 3, eaten: 0 }] }, at: Date.now() + 864e5 * 30 } };
      A.subs.slice().forEach((f) => f());
      await new Promise((res) => setTimeout(res, 3500));
      return { n: A.writes.length, y: A.yrs['2024'].myday.d['2024_05_01'].v.b[0].x }; });
    t.ok('a day stamped a month ahead is taken in and goes to its year once, rather than on every echo', r.y === 3 && r.n <= 2, JSON.stringify(r));

    // a day this version cannot read (a later one's shape, or damage) is left where it is, never deleted unread
    r = await p.evaluate(async () => { const A = window.__acct; A.writes = [];
      A.main.myday.d = { '2023_01_05': { v: 'a shape from somewhere else', at: Date.now() - 60e3 } };
      A.subs.slice().forEach((f) => f());
      window.__macroLab.balance();
      await new Promise((res) => setTimeout(res, 2000));
      return { main: A.main.myday.d['2023_01_05'], y: A.yrs['2023'], writes: A.writes.length }; });
    t.ok('a day the phone cannot read stays in the one record: only what a year holds is ever taken out',
      r.main && r.main.v === 'a shape from somewhere else' && !r.y && r.writes >= 1, JSON.stringify(r));
    await p.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
  },
};
