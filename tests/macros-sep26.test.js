/* What the round of 26 September fixed: the phone's clock set back, storage
 * full, lifting days and the week's carbs, two copies of the app on one
 * phone, and a signed-in phone opened with no signal.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, pickerList, pickRecipe, closeSheet, storedDay, weighIn, todayOn } = require('./fixtures/nourish.js');

/* A dish onto the nth meal of the day, the way a thumb adds one since the
   trays (Blake, 2026-10-04): the meal's tray opens its sheet, the first
   recipe in the list goes on the meal at a tap, and × goes home to the day. */
async function addInto(pg, n) {
  await pg.evaluate((i) => {
    const a = document.querySelectorAll('#macroSlots .mtray-b[data-mopen], #macroSlots .mtray-skb[data-mopen]')[i];
    a.scrollIntoView({ block: 'center' });
    a.click();
  }, n);
  await pg.waitForTimeout(250);
  await pickerList(pg);
  await pickRecipe(pg);
  await closeSheet(pg);
}

module.exports = nourish({
  name: 'Macros — the 26 September round',
  async suite(t) {
    /* ---- the phone's clock set back, 2026-09-26 -------------------------
     * The day log used to be pruned at both ends, a fortnight behind and a
     * week ahead. The only way to have a day more than a week ahead is for
     * the clock to have gone back, and then those days are the real ones:
     * the offline tracer set the date back ten days, logged one plate, and
     * everything eaten since was gone. */
    {
      const cb = await t.fresh({ viewport: { width: 390, height: 844 } });
      await cb.clock.install({ time: new Date(2026, 9, 10, 9, 0, 0) });
      await cb.reload();
      await cb.click('.tab[data-view="macros"]');
      await cb.waitForTimeout(250);
      await addInto(cb, 0);
      const real = await storedDay(cb, '2026-10-10');
      await cb.clock.setSystemTime(new Date(2026, 8, 30, 9, 0, 0));
      await cb.reload();
      await cb.click('.tab[data-view="macros"]');
      await cb.waitForTimeout(250);
      await addInto(cb, 1);
      const all = await cb.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'));
      t.ok('with the phone’s date set ten days back, the next plate logged keeps the real days',
        !!real && JSON.stringify(all['2026-10-10']) === JSON.stringify(real) && !!all['2026-09-30'],
        JSON.stringify(Object.keys(all)));
      await cb.close();
    }

    /* ---- storage full: said, not swallowed, 2026-09-26 ------------------
     * Every writer on this side caught its own failure and said nothing, so
     * on a full phone the weigh-in and the breakfast looked logged and were
     * gone after reopening. Strengthen says so when it happens; so does this
     * now, at once and on the day card. */
    {
      const sf = await t.fresh({ viewport: { width: 390, height: 844 } });
      await sf.click('.tab[data-view="macros"]');
      await sf.waitForTimeout(250);
      const quiet = await sf.evaluate(() => /storage for the app is full/.test(document.body.innerText));
      await sf.evaluate(() => {
        let lo = 0, hi = 12e6;
        while (hi - lo > 16) {
          const mid = (lo + hi) >> 1;
          try { localStorage.setItem('junk', 'x'.repeat(mid)); lo = mid; } catch (e) { hi = mid; }
        }
        localStorage.setItem('junk', 'x'.repeat(Math.max(0, lo - 8)));
      });
      await weighIn(sf, '183.0');
      const full = await sf.evaluate(() => ({ toast: (document.getElementById('mToast') || {}).textContent || '',
        card: document.getElementById('macroWeigh').innerText, stored: localStorage.getItem('bsc.macroWeights') }));
      t.ok('a weigh-in the phone cannot keep says so at once', !quiet && /storage for the app is full/.test(full.toast) &&
        !full.stored, JSON.stringify(full).slice(0, 300));
      t.ok('and the day card goes on saying it', /Not saved on this phone/.test(full.card) &&
        /storage for the app is full/.test(full.card), full.card.slice(0, 300));
      await addInto(sf, 0);
      t.ok('a breakfast logged after it still hears it',
        await sf.evaluate(() => /storage for the app is full/.test(document.getElementById('macroWeigh').innerText)));
      await sf.evaluate(() => localStorage.removeItem('junk'));
      await sf.close();
    }

    /* ---- lifting days, workouts and the week's carbs, 2026-09-26 --------
     * What the new-user and real-week tracers found. Days picked in
     * Strengthen after the plan never moved the plan; a block with no days
     * picked ignored its workouts; an extra session was paid for out of the
     * days after it, down to half a Sunday; and a workout saved with
     * Strengthen on screen left its day on the morning's rest-day number.
     * Each on a pinned day, because how many days are left in the week is
     * what the carbs are divided by. */
    {
      const lp = await t.fresh({ viewport: { width: 390, height: 844 } });
      const K = (d) => { const p2 = (n) => (n < 10 ? '0' : '') + n;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
      /* A three-session block, days picked or not, and a profile with
         nothing yet to say about training. */
      const seed = async (o) => {
        await lp.evaluate((o) => {
          localStorage.clear();
          localStorage.setItem('bsc.train', JSON.stringify({ act: o.noBlock ? '' : 'b1', pr: { ld: o.ld || [], qz: 1 }, wo: o.wo || {},
            ms: { b1: { n: 'Full body', acc: 4, days: [
              { n: 'Full Body A', s: [{ e: 'db-bench', n: 3 }] }, { n: 'Full Body B', s: [{ e: 'goblet', n: 3 }] },
              { n: 'Full Body C', s: [{ e: 'db-row', n: 3 }] }] } } }));
          if (o.pr) localStorage.setItem('bsc.macroProfile', JSON.stringify(o.pr));
          if (o.t) localStorage.setItem('bsc.macroTargets', JSON.stringify(o.t));
        }, o);
        await lp.reload();
        await lp.waitForTimeout(250);
      };
      const toTab = async (v) => { await lp.click('.tab[data-view="' + v + '"]'); await lp.waitForTimeout(250); };
      // the week on screen, Monday first: each day's carbs
      const week = () => lp.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (x) => x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate());
        const d = new Date(), wk = (d.getDay() + 6) % 7, out = [];
        for (let i = 0; i < 7; i++) {
          const x = new Date(d); x.setDate(x.getDate() - wk + i);
          out.push(window.__macroLab.dayTargets(key(x)).c);
        }
        return out;
      });
      const wo = (id, d, h) => { const st = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 17).getTime();
        return { id, n: 'Full Body A', st, en: st + 2400000, dk: K(d), x: [{ e: 'db-bench', s: [{ w: 60, r: 8, t: st + 60000 }] }] }; };
      const newUser = { sex: 'm', age: 44, ft: 5, inch: 10, lb: 210, act: 1.2, goal: 'keep', goalLb: 0, goalBy: '', workouts: 0, steps: 0 };
      const pickInStrengthen = async (days) => {
        await toTab('train');
        await lp.click('[data-t="ldopen"]');
        for (const v of days) await lp.click('[data-t="ldpick"][data-v="' + v + '"]');
        await lp.click('[data-t="ldsave"]');
        await lp.waitForTimeout(150);
      };
      // the wizard, the way the tracer's newcomer walked it
      const craft = async (goal) => {
        await toTab('macros');
        await lp.click('#macroFill');
        await lp.waitForTimeout(250);
        await lp.click('[data-mtsex="m"]');
        await lp.fill('#mtAge', '44'); await lp.fill('#mtFt', '5'); await lp.fill('#mtIn', '10'); await lp.fill('#mtLb', '210');
        await lp.click('[data-mtw="next"]');
        await lp.click('[data-mtact="1.2"]');
        await lp.click('[data-mtw="next"]');
        await lp.click('[data-mtgoal="' + goal + '"]');
        await lp.click('[data-mtw="next"]');
        await lp.waitForTimeout(150);
        await lp.click('[data-mtarg="save"]');
        await lp.waitForTimeout(300);
      };
      const stored = () => lp.evaluate(() => {
        const v = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        return { p: v.p, f: v.f, c: v.c, auto: v.auto };
      });

      await lp.clock.install({ time: new Date(2026, 8, 23, 9, 0, 0) });   // a Wednesday
      await lp.reload();
      for (const goal of ['keep', 'cut1']) {
        await seed({});
        await pickInStrengthen([0, 2, 4]);
        await craft(goal);
        const first = await stored();
        const firstWeek = await week();
        await seed({});
        await craft(goal);
        const flat = await stored();
        await pickInStrengthen([0, 2, 4]);
        await toTab('macros');
        const later = await stored();
        const laterWeek = await week();
        const pr = await lp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroProfile')));
        t.ok(goal + ': days picked in Strengthen after the plan move it to what picking them first gives',
          later.p === first.p && later.f === first.f && later.c === first.c && later.c !== flat.c,
          JSON.stringify({ first, flat, later }));
        t.ok(goal + ': and the carbs cycle the same way', JSON.stringify(laterWeek) === JSON.stringify(firstWeek),
          JSON.stringify({ first: firstWeek, later: laterWeek }));
        t.ok(goal + ': with the three sessions in the profile', pr.workouts === 3 && JSON.stringify(pr.train) === '[0,2,4]',
          JSON.stringify(pr));
        /* 210 P since protein became a gram a pound of the reference weight
           at the default level (it was 0.85 on Maintain, and 179 P 267 C
           here, 334 and 217 either side). Same calories; the 31 g moved from
           carbohydrate to protein, and the week still cycles around it. */
        if (goal === 'keep') {
          t.ok('Maintain, days picked second: 210 P 66 F 236 C, 295 on a lifting day and 192 on a rest day, not the flat day every day',
            later.p === 210 && later.f === 66 && later.c === 236 && laterWeek[0] === 295 && laterWeek[1] === 192,
            JSON.stringify({ later, laterWeek }));
        }
      }
      await seed({ pr: newUser, t: { p: 200, f: 70, c: 250, auto: 0, set: '2026-09-20' } });
      await pickInStrengthen([0, 2, 4]);
      await toTab('macros');
      const own = await lp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroTargets')));
      t.ok('days picked later leave grams somebody typed alone',
        own.p === 200 && own.f === 70 && own.c === 250 && own.auto === 0, JSON.stringify(own));
      // Strengthen's list is the answer, and none is an answer
      await seed({ pr: Object.assign({}, newUser, { workouts: 3, train: [0, 2, 4] }), ld: [0, 2, 4] });
      await lp.evaluate(() => { window.Train._.state().T.pr.ld = []; window.Hive.daysMoved(); });
      const cleared = await lp.evaluate(() => ({ days: window.Hive.trainDays(),
        pr: JSON.parse(localStorage.getItem('bsc.macroProfile')) }));
      t.ok('days cleared in Strengthen stay cleared in Nourish', cleared.days.length === 0 && cleared.pr.workouts === 0,
        JSON.stringify(cleared));

      /* A block running, no days picked, and a workout saved today. */
      const plan = await lp.evaluate((pr) => window.__macroLab.plan(pr), newUser);
      const t0 = { p: plan.p, f: plan.f, c: plan.c, auto: 1, set: '2026-09-20' };
      await seed({ pr: newUser, t: t0 });
      await toTab('macros');
      const none = await lp.evaluate(() => ({ on: window.__macroLab.trained('2026-09-23').on, c: window.__macroLab.targets().c }));
      await seed({ pr: newUser, t: t0, wo: { w1: wo('w1', new Date(2026, 8, 23), 7) } });
      await toTab('macros');
      const did = await lp.evaluate(() => ({ on: window.__macroLab.trained('2026-09-23').on, c: window.__macroLab.targets().c,
        row: (document.querySelector('.mw-train') || {}).textContent || '' }));
      const didWeek = await week();
      t.ok('no days picked: a workout saved today makes it a training day', did.on && !none.on, JSON.stringify({ none, did }));
      t.ok('with a training day’s carbs, and says so', did.c === Math.round(plan.c * 1.25) && none.c === plan.c && /done/.test(did.row),
        JSON.stringify({ plan, did }));
      t.ok('and the rest of the week is not charged for it', didWeek.every((c, i) => i === 2 || c === plan.c), JSON.stringify(didWeek));

      /* A newcomer on a Saturday: Mon/Wed/Fri, a Maintain plan, and the
         first workout ever logged, that Saturday. The days before it were
         counted as trained, so the Saturday was a fourth session in a week of
         three and Sunday paid for it: 100 g instead of a rest day's 217 (192
         now: the protein rule moved 31 g of this plan from carbohydrate to
         protein, and the rest day moved with it). */
      const pr3 = Object.assign({}, newUser, { workouts: 3, train: [0, 2, 4] });
      const plan3 = await lp.evaluate((pr) => window.__macroLab.plan(pr), pr3);
      const t3 = { p: plan3.p, f: plan3.f, c: plan3.c, auto: 1, set: '2026-09-26' };
      await lp.clock.setSystemTime(new Date(2026, 8, 26, 9, 0, 0));        // a Saturday
      await seed({ pr: pr3, t: t3, ld: [0, 2, 4] });
      await toTab('macros');
      const sat0 = await week();
      await seed({ pr: pr3, t: t3, ld: [0, 2, 4], wo: { w1: wo('w1', new Date(2026, 8, 26), 8) } });
      await toTab('macros');
      const sat1 = await week();
      t.ok('the first workout, on an unplanned Saturday, leaves Sunday a rest day’s 192 g',
        sat0[6] === 192 && sat1[6] === 192 && sat1[5] > sat0[5], JSON.stringify({ before: sat0, after: sat1 }));
      await seed({ pr: pr3, t: t3, ld: [0, 2, 4], wo: { w1: wo('w1', new Date(2026, 8, 24)), w2: wo('w2', new Date(2026, 8, 25)) } });
      await toTab('macros');
      const thfr = await week();
      t.ok('workouts first logged on Thursday and Friday leave the weekend its 192, not less',
        thfr[5] === 192 && thfr[6] === 192, JSON.stringify(thfr));

      /* A workout saved with Strengthen on screen, on a day off. */
      await lp.clock.setSystemTime(new Date(2026, 8, 30, 7, 0, 0));        // a Wednesday
      const pr4 = Object.assign({}, newUser, { workouts: 3, train: [0, 1, 3] });
      const plan4 = await lp.evaluate((pr) => window.__macroLab.plan(pr), pr4);
      const t4 = { p: plan4.p, f: plan4.f, c: plan4.c, auto: 1, set: '2026-09-26' };
      await seed({ pr: pr4, t: t4, ld: [0, 1, 3], wo: { w0: wo('w0', new Date(2026, 8, 28)), w1: wo('w1', new Date(2026, 8, 29)) } });
      await toTab('macros');                                              // the morning's look: a rest day
      const morning = await week();
      await toTab('train');
      await lp.evaluate(() => {
        const st = Date.now();
        const T = JSON.parse(localStorage.getItem('bsc.train'));
        T.wo.w2 = { id: 'w2', n: 'Workout', st, en: st + 2400000, dk: '2026-09-30', x: [{ e: 'db-bench', s: [{ w: 60, r: 8, t: st }] }] };
        localStorage.setItem('bsc.train', JSON.stringify(T));
        window.Train._.reload();
        window.Hive.trained('2026-09-30');                                 // what saving one does
      });
      await lp.clock.setSystemTime(new Date(2026, 9, 1, 7, 0, 0));
      await lp.reload();
      await lp.waitForTimeout(250);
      await toTab('macros');
      const next = await week();
      t.ok('a workout saved with Strengthen on screen still makes its day a training day',
        next[2] > morning[2], JSON.stringify({ morning, next }));
      t.ok('and the rest of that week is not cut for it', next.slice(3).every((c, i) => c >= morning[3 + i]),
        JSON.stringify({ morning, next }));

      /* Strengthen's log is the record, not a copy kept here: no block, days
         Mon and Fri, a workout saved this Thursday. */
      const pr5 = Object.assign({}, newUser, { workouts: 2, train: [0, 4] });
      const saveToday = () => lp.evaluate(() => {
        const st = Date.now();
        const T = JSON.parse(localStorage.getItem('bsc.train'));
        T.wo.w9 = { id: 'w9', n: 'Workout', st, en: st + 2400000, dk: '2026-10-01', x: [{ e: 'db-bench', s: [{ w: 60, r: 8, t: st }] }] };
        localStorage.setItem('bsc.train', JSON.stringify(T));
        window.Train._.reload();
        window.Hive.trained('2026-10-01');
        return window.__macroLab.trained('2026-10-01').on;
      });
      await seed({ pr: pr5, t: t4, noBlock: true });
      await toTab('macros');
      const saved5 = await saveToday();
      const dropped5 = await lp.evaluate(() => {
        const T = JSON.parse(localStorage.getItem('bsc.train'));
        delete T.wo.w9;
        localStorage.setItem('bsc.train', JSON.stringify(T));
        window.Train._.reload();
        return window.__macroLab.trained('2026-10-01').on;
      });
      t.ok('a workout saved makes its day a training day, and deleting it takes that back',
        saved5 && !dropped5, JSON.stringify({ saved5, dropped5 }));
      await seed({ pr: Object.assign({}, pr5, { syncTrain: false }), t: t4, noBlock: true });
      await toTab('macros');
      const off5 = await saveToday();
      t.ok('with sync with Strengthen off, a saved workout leaves the day to the tick', !off5,
        JSON.stringify({ off5, tn: await lp.evaluate(() => localStorage.getItem('bsc.macroTrained')) }));
      await lp.close();
    }

    /* ---- two copies of the app on one phone, 2026-09-26 -----------------
     * Two tabs, or the home-screen app and a tab: each wrote the whole of
     * what it held, so breakfast logged in one and lunch in the other left
     * the day with lunch. Blake chose merging over a "reload" prompt: each
     * copy takes in the other's saves as they happen, by the same newest-wins
     * rule the account uses. */
    {
      const ta = await t.fresh({ viewport: { width: 390, height: 844 } });
      const tb = await ta.context().newPage();
      await tb.goto(t.base + 'index.html');
      await tb.waitForTimeout(300);
      await ta.click('.tab[data-view="macros"]'); await ta.waitForTimeout(250);
      await tb.click('.tab[data-view="macros"]'); await tb.waitForTimeout(250);
      const today = await todayOn(ta);
      await addInto(ta, 0);                                   // breakfast, in one
      await tb.waitForTimeout(300);
      await addInto(tb, 1);                                   // lunch, in the other, opened before it
      await ta.waitForTimeout(300);
      const day = await storedDay(ta, today);
      const meals = day ? Object.keys(day).filter((k) => (day[k] || []).length) : [];
      t.ok('breakfast logged in one copy and lunch in the other: the day keeps both', meals.length === 2, JSON.stringify(day));
      // what the first copy would send its account, read from its memory
      const held = await ta.evaluate((k) => { const e = window.__macroLab.payload().d[k.replace(/-/g, '_')];
        return e && e.v ? Object.keys(e.v).filter((sk) => (e.v[sk] || []).length).length : 0; }, today);
      t.ok('and the first copy holds the lunch without being reloaded', held === 2, held);
      await weighIn(ta, '183.0');
      await tb.waitForTimeout(300);
      await tb.click('#macroPrev'); await tb.waitForTimeout(250);
      await weighIn(tb, '184.0');
      await ta.waitForTimeout(300);
      const ws = await ta.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}'));
      t.ok('a weigh-in in each keeps both mornings', Object.keys(ws).length === 2 && ws[today] === 183, JSON.stringify(ws));
      await ta.reload(); await ta.waitForTimeout(250);
      const again = await storedDay(ta, today);
      t.ok('and a reload finds both meals', !!again && Object.keys(again).filter((k) => (again[k] || []).length).length === 2,
        JSON.stringify(again));
      await tb.close();
      await ta.close();
    }

    /* ---- a signed-in phone opened with no signal, 2026-09-26 -----------
     * It asked the account once, failed, and never asked again until the
     * app was killed: nothing logged in the basement went up, Strengthen
     * never attached, and meanwhile the menu said "Not signed in" over a big
     * Sign in with Google.
     *
     * The account here is a stand-in. The Firebase SDK is answered from this
     * process for www.gstatic.com while "online" and refused while not, and
     * its "server" is a plain object — nothing reaches the real project. Its
     * own context, because an offline start is meant to fail requests, and
     * t.fresh fails a test for any thrown error. */
    {
      const SDK = `(function(){
        if (window.firebase) return;
        var user = { uid: 'u1', isAnonymous: false, email: 'me@test.example', displayName: 'Me' };
        var authObj = { currentUser: user,
          getRedirectResult: function(){ return Promise.resolve(null); },
          onAuthStateChanged: function(cb){ setTimeout(function(){ cb(authObj.currentUser); }, 0); return function(){}; },
          signInAnonymously: function(){ return Promise.resolve({ user: user }); } };
        var subs = [];
        function snapOf(path, d){ return { id: path.split('/').pop(), exists: d !== null && d !== undefined,
          data: function(){ return d ? JSON.parse(JSON.stringify(d)) : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } }; }
        function deliver(){ subs.slice().forEach(function(s){ s(); }); }
        function docRef(path){ return { id: path.split('/').pop(), path: path,
          collection: function(n){ return colRef(path + '/' + n); },
          set: function(d, o){ return window.__srvSet(path, JSON.parse(JSON.stringify(d)), !!(o && o.merge)).then(deliver); },
          update: function(d){ return window.__srvSet(path, JSON.parse(JSON.stringify(d)), true).then(deliver); },
          get: function(){ return window.__srvGet(path).then(function(d){ return snapOf(path, d); }); },
          onSnapshot: function(o, next){ if (typeof o === 'function') next = o;
            var on = true; var fire = function(){ if (!on) return; window.__srvGet(path).then(function(d){ if (on) next(snapOf(path, d)); }); };
            subs.push(fire); setTimeout(fire, 20); return function(){ on = false; }; } }; }
        function colRef(path){ return { doc: function(id){ return docRef(path + '/' + id); },
          onSnapshot: function(o, next){ if (typeof o === 'function') next = o;
            var on = true; var fire = function(){ if (!on) return; window.__srvList(path).then(function(list){ if (!on) return;
              next({ metadata: { fromCache: false }, forEach: function(fn){ list.forEach(function(r){ fn(snapOf(r.path, r.data)); }); } }); }); };
            subs.push(fire); setTimeout(fire, 20); return function(){ on = false; }; } }; }
        var db = { collection: function(n){ return colRef(n); }, enablePersistence: function(){ return Promise.resolve(); } };
        var fs = function(){ return db; };
        fs.FieldValue = { delete: function(){ return null; }, arrayUnion: function(){ return [].slice.call(arguments); } };
        var auth = function(){ return authObj; };
        auth.GoogleAuthProvider = function(){};
        window.firebase = { apps: [], initializeApp: function(){ window.firebase.apps.push({}); }, firestore: fs, auth: auth };
      })();`;
      const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
      const deep = (to, from) => { Object.keys(from).forEach((k) => { const v = from[k];
        if (isObj(v) && isObj(to[k])) deep(to[k], v); else to[k] = isObj(v) ? deep({}, v) : v; }); return to; };
      const SRV = { online: false, db: {}, waiters: [] };
      const whenOnline = () => (SRV.online ? Promise.resolve() : new Promise((r) => SRV.waiters.push(r)));
      const oc = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
      await oc.exposeBinding('__srvSet', async (src, path, data, merge) => {
        await whenOnline();
        SRV.db[path] = merge ? deep(SRV.db[path] || {}, data) : deep({}, data);
        return true;
      });
      await oc.exposeBinding('__srvGet', async (src, path) => { await whenOnline(); return SRV.db[path] === undefined ? null : SRV.db[path]; });
      await oc.exposeBinding('__srvList', async (src, path) => {
        await whenOnline();
        return Object.keys(SRV.db).filter((k) => k.indexOf(path + '/') === 0 && k.slice(path.length + 1).indexOf('/') < 0)
          .map((k) => ({ path: k, data: SRV.db[k] }));
      });
      await oc.route(/www\.gstatic\.com\/firebasejs/, (r) => (SRV.online
        ? r.fulfill({ status: 200, contentType: 'text/javascript', body: /firebase-app-compat/.test(r.request().url()) ? SDK : '' })
        : r.abort()));
      await oc.route(/accounts\.google\.com|api\.nal\.usda\.gov/, (r) => r.abort());
      const op = await oc.newPage();
      const errs = [];
      op.on('pageerror', (e) => { if (!/gis is not defined/.test(e.message)) errs.push(e.message); });
      await op.goto(t.base + 'index.html');
      await op.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('bsc.myAccount', '1');
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 50, c: 200 }));
      });
      await op.reload();
      await op.click('.tab[data-view="macros"]');
      await op.waitForTimeout(1500);
      const off = await op.evaluate(() => ({ who: document.getElementById('macroWho').textContent,
        state: window.Hive.syncState ? window.Hive.syncState() : 'none' }));
      t.ok('signed in with no signal, the menu says so rather than "Not signed in"',
        /Signed in/.test(off.who) && /reach the server/.test(off.who), JSON.stringify(off));
      t.ok('and Strengthen can ask: offline, not signed out', off.state === 'offline', off.state);
      await op.click('#syncBtn');
      await op.waitForTimeout(300);
      const sheet = await op.evaluate(() => ({ text: document.getElementById('modalRoot').innerText,
        google: !!document.querySelector('#myGoogleFallback') }));
      t.ok('the sheet says signed in and out of reach, and offers no sign-in',
        /can.t reach the server/.test(sheet.text) && !sheet.google, sheet.text.replace(/\s+/g, ' ').slice(0, 400));
      await op.keyboard.press('Escape');
      await op.waitForTimeout(200);
      await weighIn(op, '183.4');
      const today = await todayOn(op);
      const wk = today.replace(/-/g, '_');
      /* The other phone, meanwhile, logged a workout this morning. */
      const st = await op.evaluate(() => { const d = new Date(); d.setHours(7, 0, 0, 0); return d.getTime(); });
      SRV.db['users/u1'] = { train: { wo: { other1: { at: Date.now(), v: { id: 'other1', n: 'Upper A', st: st, en: st + 2400000,
        dk: today, x: [{ e: 'db-bench', s: [{ w: 60, r: 8, t: st + 60000 }] }] } } } } };
      const before = await op.evaluate(() => !!document.querySelector('.mw-train'));
      // signal back, with the app left open
      SRV.online = true;
      SRV.waiters.splice(0).forEach((f) => f());
      await op.evaluate(() => window.dispatchEvent(new Event('online')));
      const up = () => { const u = SRV.db['users/u1'] || {};
        return !!(u.myday && u.myday.w && u.myday.w[wk]) && !!(u.train && u.train.pr); };
      for (let i = 0; i < 40 && !up(); i++) await op.waitForTimeout(200);
      await op.waitForTimeout(500);
      const on = await op.evaluate(() => ({ who: document.getElementById('macroWho').textContent,
        state: window.Hive.syncState ? window.Hive.syncState() : 'none',
        row: (document.querySelector('.mw-train') || {}).textContent || '', wos: Object.keys(window.Train._.state().T.wo).length }));
      const u = SRV.db['users/u1'] || {};
      t.ok('signal back with the app open: the weigh-in made offline reaches the account, no reload',
        !!(u.myday && u.myday.w && u.myday.w[wk] && u.myday.w[wk].v === 183.4), JSON.stringify(u.myday && u.myday.w));
      t.ok('and Strengthen syncs too', !!(u.train && u.train.pr), JSON.stringify(Object.keys(u.train || {})));
      t.ok('the menu names the account again', on.who === 'me@test.example' && on.state === 'on', JSON.stringify(on));
      t.ok('the other phone’s workout arrives once, and Nourish redraws today as a training day',
        !before && on.wos === 1 && /Trained today|done/.test(on.row), JSON.stringify(on));
      t.ok('with nothing thrown on the way', errs.length === 0, errs.join(' | '));
      await oc.close();

      /* A new phone signing in to an account that already has a day: it
         used to send everything it had before reading the account, and what
         it had was nothing, stamped zero, written straight over the
         account's targets and profile. Then it refused the real copy, which
         was no newer than zero. */
      const S2 = { db: {}, sets: [] };
      const nc = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
      await nc.exposeBinding('__srvSet', async (src, path, data, merge) => {
        S2.sets.push({ path, keys: Object.keys((data && data.myday) || {}) });
        S2.db[path] = merge ? deep(S2.db[path] || {}, data) : deep({}, data);
        return true;
      });
      await nc.exposeBinding('__srvGet', async (src, path) => (S2.db[path] === undefined ? null : S2.db[path]));
      await nc.exposeBinding('__srvList', async (src, path) => Object.keys(S2.db)
        .filter((k) => k.indexOf(path + '/') === 0 && k.slice(path.length + 1).indexOf('/') < 0).map((k) => ({ path: k, data: S2.db[k] })));
      await nc.route(/www\.gstatic\.com\/firebasejs/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript',
        body: /firebase-app-compat/.test(r.request().url()) ? SDK : '' }));
      await nc.route(/accounts\.google\.com|api\.nal\.usda\.gov/, (r) => r.abort());
      const np = await nc.newPage();
      const nerrs = [];
      np.on('pageerror', (e) => { if (!/gis is not defined/.test(e.message)) nerrs.push(e.message); });
      await np.goto(t.base + 'index.html');
      await np.evaluate(() => { localStorage.clear(); localStorage.setItem('bsc.myAccount', '1'); });
      const T0 = { p: 150, f: 60, c: 200, auto: 1 };
      S2.db['users/u1'] = { myday: { t: { v: T0, at: 1000 }, pr: { v: { sex: 'm', age: 40, lb: 200 }, at: 1000 },
        w: { '2026_09_01': { v: 190, at: 1000 } } } };
      await np.reload();
      for (let i = 0; i < 30; i++) {
        await np.waitForTimeout(200);
        if (await np.evaluate(() => !!localStorage.getItem('bsc.macroTargets'))) break;
      }
      await np.waitForTimeout(600);
      const md = S2.db['users/u1'].myday;
      const got = await np.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroTargets') || 'null'));
      t.ok('a new phone signing in leaves the account’s targets, profile and weigh-ins as they were',
        md.t && md.t.v && md.t.v.p === 150 && md.pr && md.pr.v && md.pr.v.lb === 200 && md.w && md.w['2026_09_01'] && md.w['2026_09_01'].v === 190,
        JSON.stringify({ t: md.t, pr: md.pr, w: md.w }));
      t.ok('and takes them itself', !!got && got.p === 150, JSON.stringify(got));
      t.ok('and never sends a part it has no stamp for', !S2.sets.some((x) => /users\/u1$/.test(x.path) && x.keys.indexOf('t') >= 0 && !(md.t && md.t.at > 0)),
        JSON.stringify(S2.sets.slice(0, 4)));
      t.ok('with nothing thrown', nerrs.length === 0, nerrs.join(' | '));
      await nc.close();
    }
  },
});
