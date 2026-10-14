/* Train: the block, the logger, the records, the review, and the sync.
 *
 * Most of what matters here is arithmetic — how many sets next week, what
 * weight, whether a set is a record, what the review says — so most of these
 * checks feed the real functions logged workouts and read the answer back,
 * through window.Train._. The rest drive the screen the way a thumb would. */

const DAY = 864e5;

/* A workout as the logger saves one, dated days ago. */
function wo(id, ms, w, d, daysAgo, x, extra) {
  const st = Date.now() - daysAgo * DAY;
  return Object.assign({ id, st, en: st + 3600e3, dk: '2026-01-01', n: 'W', u: 'lb',
    ms: ms || '', w, d, dl: 0, x, sr: {}, fb: {} }, extra || {});
}
/* Settings sit in Strengthen's header, which steps aside while a workout
   is full screen: the chevron makes it small first. */
async function openSettings(p) {
  if (await p.$('#trTop:not(.hide) [data-t="minim"]')) await p.click('#trTop [data-t="minim"]');
  await p.click('[data-t="settings"]');
}
function sets(w, reps, t0) {
  return reps.map((r, i) => ({ w, r, t: (t0 || 1e12) + i * 150e3 }));
}

/* Answer the quiz the way a thumb would. `a` names the answers; anything
   left out is skipped past with Next, or left unpressed. */
async function answer(p, a) {
  await p.click(`[data-t="qz"][data-f="goal"][data-v="${a.goal || 'muscle'}"]`);
  await p.click(`[data-t="qz"][data-f="lvl"][data-v="${a.lvl === undefined ? 1 : a.lvl}"]`);
  if (a.dpw) await p.click(`[data-t="qz"][data-f="dpw"][data-v="${a.dpw}"]`);
  if (a.min !== undefined) await p.click(`[data-t="qz"][data-f="min"][data-v="${a.min}"]`);
  await p.click('[data-t="qzn"]');
  await p.click(`[data-t="qz"][data-f="kit"][data-v="${a.kit || 'gym'}"]`);
  if (a.bk) await p.click('[data-t="qzback"]');
  for (const b of (a.bk || '')) await p.click(`[data-t="qzm"][data-f="bk"][data-v="${b}"]`);
  for (const j of (a.jt || '')) await p.click(`[data-t="qzm"][data-f="jt"][data-v="${j}"]`);
  await p.click('[data-t="qzn"]');
  if (a.day) await p.click(`[data-t="qz"][data-f="day"][data-v="${a.day}"]`);
  for (const h of (a.hab || [])) await p.click(`[data-t="qzm"][data-f="hab"][data-v="${h}"]`);
  await p.click('[data-t="qzn"]');
  await p.click(`[data-t="qz"][data-f="age"][data-v="${a.age || ''}"]`);
  await p.waitForTimeout(100);
}

/* History, by workout. It opens by block once there is one, so the tests
   that read the list of workouts ask for that view. */
async function openWorkouts(p) {
  await p.click('[data-t="sub"][data-v="history"]');
  await p.evaluate(() => { const b = document.querySelector('[data-t="hview"][data-v="wo"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
}

/* Put a training log in storage and have Train read it. */
async function seed(p, T) {
  await p.evaluate((T) => {
    localStorage.setItem('bsc.train', JSON.stringify(T));
    localStorage.removeItem('bsc.trainStamps');
    window.Train._.reload();
  }, T);
}

module.exports = {
  name: 'Train',
  async run(t) {
    // ---- the tab --------------------------------------------------------
    let p = await t.fresh();
    let r0;
    const tabs = await p.evaluate(() =>
      [...document.querySelectorAll('.tab')].map((b) => b.dataset.view));
    t.ok('there is a Train tab, beside My Day', tabs.indexOf('train') === tabs.indexOf('macros') + 1, tabs.join());
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(100);
    t.ok('it opens on the quiz, with nothing answered for you',
      await p.isVisible('[data-t="qz"][data-f="goal"]') &&
      await p.evaluate(() => !document.querySelector('[data-t="qz"][aria-pressed="true"]')));
    await p.reload();
    await p.waitForTimeout(200);
    t.ok('and is the tab you come back to', await p.isVisible('#view-train [data-t="qz"][data-f="goal"]'));

    // ---- the quiz, the picks, and building a block ----------------------
    await answer(p, { goal: 'muscle', lvl: 1, dpw: 4, min: 0 });
    r0 = await p.evaluate(() => ({
      pr: window.Train._.state().T.pr,
      picks: [...document.querySelectorAll('.tr-prog [data-t="prog"]')].map((b) => b.dataset.v),
      why: [...document.querySelectorAll('.tr-prog')][0].querySelectorAll('.tr-fits li').length,
    }));
    t.ok('the answers are kept as yours', r0.pr.goal === 'muscle' && r0.pr.lvl === 1 && r0.pr.dpw === 4 && r0.pr.qz > 0, JSON.stringify(r0.pr));
    t.ok('three picks, the RP-style block first for somebody building muscle a few years in',
      r0.picks.length === 3 && r0.picks[0] === 'grow', r0.picks.join());
    t.ok('and each pick says why it fits', r0.why >= 1, r0.why);
    await p.click('[data-t="lib"]');
    r0 = await p.evaluate(() => document.querySelectorAll('.tr-prog').length);
    t.ok('the library shows every program', r0 === 9, r0);
    await p.click('[data-t="unlib"]');
    await p.click('[data-t="prog"][data-v="grow"]');
    await p.click('[data-t="o-pri"][data-v="side"]');
    await p.click('[data-t="build"]');
    await p.waitForTimeout(100);
    let d = await p.evaluate(() => {
      const ms = window.Train._.state().S.draft;
      const lib = window.Train._.lib;
      return {
        days: ms.days.map((x) => x.n),
        min: Math.min(...ms.days.flatMap((x) => x.s.map((s) => s.n))),
        side: ms.days.flatMap((x) => x.s).filter((s) => lib(s.e).m === 'side').reduce((n, s) => n + s.n, 0),
        dupes: ms.days.some((x) => new Set(x.s.map((s) => s.e)).size !== x.s.length),
      };
    });
    t.ok('four days a week builds upper / lower', d.days.join() === 'Upper A,Lower A,Upper B,Lower B', d.days.join());
    t.ok('no exercise gets fewer than two sets in week one', d.min >= 2, d.min);
    t.ok('a muscle you want to bring up starts two sets over RP’s MEV', d.side === 10, d.side);
    t.ok('and no day repeats an exercise', !d.dupes);

    await p.click('[data-t="dset"][data-d="0"][data-i="0"][data-v="1"]');
    await p.click('[data-t="dswap"][data-d="0"][data-i="0"]');
    await p.waitForTimeout(100);
    const swapTo = await p.evaluate(() => {
      const first = document.querySelector('#trainRoot [data-t="pickex"]');
      return { e: first.dataset.e, filtered: document.querySelector('#trainRoot [data-t="pickm"][aria-pressed="true"]').dataset.v };
    });
    t.ok('swapping offers the same muscle first', swapTo.filtered === 'chest', swapTo.filtered);
    await p.click('#trainRoot [data-t="pickex"][data-e="db-bench"]');
    await p.waitForTimeout(100);
    d = await p.evaluate(() => window.Train._.state().S.draft.days[0].s[0]);
    t.ok('a draft slot can be swapped and given another set', d.e === 'db-bench' && d.n === 4, JSON.stringify(d));

    await p.click('[data-t="begin"]');
    await p.waitForTimeout(100);
    // the block's calendar comes first, open; the next session is the card under it
    d = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('#trBody .tr-card')];
      return {
        first: (cards[0] || {}).className || '', second: (cards[1] || {}).className || '',
        start: !!document.querySelector('.tr-next [data-t="start"]'),
        sub: (document.querySelector('.tr-blk .tr-sub') || {}).textContent || '',
        prog: (document.querySelector('.tr-cstat') || {}).textContent || '',
        bar: (document.querySelector('.tr-cbar') || { getAttribute: () => '' }).getAttribute('aria-valuenow'),
        sel: [...document.querySelectorAll('.tr-gc.sel')].map((c) => c.dataset.w + ':' + c.dataset.d).join(),
      };
    });
    t.ok('the screen opens on the block, weeks open, with the next session under it and Start',
      /tr-blk/.test(d.first) && /tr-next/.test(d.second) && d.start && /^Week 1 of 5/.test(d.sub), JSON.stringify(d));
    t.ok('with how far through: none of twenty, none this week, 0%', /0 of 20 sessions/.test(d.prog) && /0 of 4 this week/.test(d.prog) && d.bar === '0', JSON.stringify(d));
    t.ok('and the next box chosen', d.sel === '0:0', d.sel);
    d = await p.evaluate(() => ({
      act: !!window.Train._.state().T.act,
      cells: document.querySelectorAll('.tr-gc').length,
      next: document.querySelector('.tr-gc.next') && document.querySelector('.tr-gc.next').dataset.w + ':' + document.querySelector('.tr-gc.next').dataset.d,
      stored: !!JSON.parse(localStorage.getItem('bsc.train')).act,
    }));
    t.ok('starting it keeps it', d.act && d.stored);
    t.ok('five weeks of four days on the grid, four hard and a deload', d.cells === 20, d.cells);
    t.ok('with the first session marked next', d.next === '0:0', d.next);

    // ---- every split, every kit -----------------------------------------
    const splits = await p.evaluate(() => {
      const out = {};
      [2, 3, 4, 5, 6].forEach((dpw) => ['gym', 'bar', 'db'].forEach((kit) => {
        const ms = window.Train._.build({ dpw, kit, lvl: 1, acc: 4, pri: [] });
        const lib = window.Train._.lib;
        const eq = { gym: ['bb', 'db', 'mc', 'cb', 'sm', 'bw'], bar: ['bb', 'db', 'bw'], db: ['db', 'bw'] }[kit];
        const all = ms.days.flatMap((x) => x.s);
        const per = {};
        ms.days.forEach((x, di) => x.s.forEach((s) => { const m = lib(s.e).m; (per[m] = per[m] || new Set()).add(di); }));
        out[dpw + kit] = {
          days: ms.days.length,
          kitOk: all.every((s) => eq.indexOf(lib(s.e).q) >= 0),
          big: ['chest', 'back', 'quads'].every((m) => per[m] && per[m].size >= (dpw >= 2 ? 1 : 0)),
          twice: ['chest', 'back', 'quads'].every((m) => per[m] && per[m].size >= 2),
        };
      }));
      return out;
    });
    t.ok('every split has as many days as asked for',
      Object.keys(splits).every((k) => splits[k].days === Number(k[0])), JSON.stringify(splits));
    t.ok('and draws only on the kit you have', Object.keys(splits).every((k) => splits[k].kitOk));
    t.ok('chest, back and quads are trained twice a week on every split',
      Object.keys(splits).every((k) => splits[k].twice),
      Object.keys(splits).filter((k) => !splits[k].twice).join());

    // ---- reps in reserve ------------------------------------------------
    const rir = await p.evaluate(() => {
      const ms = window.Train._.build({ dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      return [0, 1, 2, 3, 4].map((w) => window.Train._.rirFor(ms, w));
    });
    t.ok('reps in reserve step 3, 2, 1, 0, then a deload', rir.join() === '3,2,1,0,', JSON.stringify(rir));

    // ---- the logger -----------------------------------------------------
    await p.click('[data-t="start"]');
    await p.waitForTimeout(100);
    t.ok('starting a session opens the logger', await p.isVisible('.tr-ex'));
    await p.fill('#trw-0-0', '135');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.waitForTimeout(100);
    d = await p.evaluate(() => ({
      rest: document.querySelector('#trRest:not(.hide) .tr-rest-t') && document.querySelector('#trRest .tr-rest-t').textContent,
      ghost: document.getElementById('trw-0-1').placeholder,
    }));
    t.ok('ticking a set starts the rest timer', /Rest [0-9]:[0-9]{2}/.test(d.rest || ''), d.rest);
    t.ok('and the next set carries the weight just lifted', d.ghost === '135', d.ghost);
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    d = await p.evaluate(() => window.Train._.state().LIVE.x[0].s[1]);
    t.ok('an empty set ticked takes what its boxes were showing', d.w === 135 && d.r === 8 && d.t > 0, JSON.stringify(d));
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    d = await p.evaluate(() => window.Train._.state().LIVE.x[0].s[1].t);
    t.ok('and ticking it again undoes it', d === 0);

    await p.click('[data-t="rest"][data-v="15"]');
    d = await p.evaluate(() => { const r = window.Train._.state().LIVE.rs; return Math.round((r.end - Date.now()) / 1000); });
    t.ok('the rest can be stretched', d > 180 && d <= 196, d);
    await p.click('[data-t="rest"][data-v="skip"]');
    d = await p.evaluate(() => ({ rest: !!document.querySelector('#trRest .tr-rest-t'), foot: !document.getElementById('trRest').classList.contains('hide'),
      finish: !!document.querySelector('#trTop:not(.hide) [data-t="finish"]') }));
    t.ok('or skipped: full screen, the foot goes with the rest, and Finish stays in the bar up top', !d.rest && !d.foot && d.finish, JSON.stringify(d));

    // a set with nothing to take: a first-ever exercise, no target, no history
    await p.click('[data-t="addex"]');
    await p.click('#trainRoot [data-t="pickex"][data-e="hammer"]');
    await p.waitForTimeout(100);
    const hi = await p.evaluate(() => window.Train._.state().LIVE.x.length - 1);
    await p.click(`[data-t="tick"][data-x="${hi}"][data-s="0"]`);
    await p.waitForTimeout(100);
    d = await p.evaluate((hi) => ({
      t: window.Train._.state().LIVE.x[hi].s[0].t,
      focus: document.activeElement && document.activeElement.id,
    }), hi);
    t.ok('a set with nothing to go on is not ticked', d.t === 0);
    t.ok('and the box it needs gets the cursor', d.focus === 'trw-' + hi + '-0', d.focus);
    await p.fill(`#trw-${hi}-0`, '30');
    await p.fill(`#trr-${hi}-0`, '12');
    await p.press(`#trr-${hi}-0`, 'Enter');
    d = await p.evaluate((hi) => window.Train._.state().LIVE.x[hi].s[0], hi);
    t.ok('Enter in the reps box ticks the set', d.t > 0 && d.w === 30 && d.r === 12, JSON.stringify(d));

    // a phone that dies mid-session
    await p.reload();
    await p.waitForTimeout(200);
    d = await p.evaluate(() => ({ n: document.querySelectorAll('.tr-set.done').length, dot: document.querySelector('.tab[data-view="train"]').classList.contains('tr-tab-live') }));
    t.ok('a reload comes back to the same workout, sets and all', d.n === 2, d.n);
    t.ok('and the tab carries a dot while one is open', d.dot);

    // the back gesture
    await p.click('[data-t="exsheet"]');
    await p.waitForTimeout(100);
    t.ok('an exercise opens its own sheet', await p.isVisible('#trainRoot .sheet'));
    await p.goBack();
    await p.waitForTimeout(300);
    d = await p.evaluate(() => ({ sheet: !!document.querySelector('#trainRoot .sheet'), path: location.pathname }));
    t.ok('back closes it and stays in the app', !d.sheet && /index\.html$/.test(d.path), JSON.stringify(d));

    // finishing
    await p.click('[data-t="finish"]');
    await p.waitForTimeout(100);
    d = await p.evaluate(() => document.querySelector('#trainRoot .sheet').textContent);
    t.ok('finishing says which sets will not be saved', /never ticked/.test(d));
    t.ok('and asks for the feedback next week depends on', /next week/.test(d));
    await p.click('#trainRoot [data-t="save"]');
    await p.waitForTimeout(150);
    d = await p.evaluate(() => {
      const st = window.Train._.state();
      const w = Object.values(st.T.wo)[0];
      const k = new Date(); const p2 = (n) => (n < 10 ? '0' : '') + n;
      const today = k.getFullYear() + '-' + p2(k.getMonth() + 1) + '-' + p2(k.getDate());
      return {
        n: Object.keys(st.T.wo).length, live: !!st.LIVE,
        sets: w.x.reduce((n, x) => n + x.s.length, 0), slot: w.w + ':' + w.d,
        trained: window.__macroLab.trained(today).on,
        saved: !!document.querySelector('.tr-saved'),
        // today's card is the next session now
        next: document.querySelector('.tr-next [data-t="start"]') && document.querySelector('.tr-next [data-t="start"]').dataset.d,
      };
    });
    t.ok('saving keeps only the ticked sets', d.n === 1 && !d.live && d.sets === 2, JSON.stringify(d));
    t.ok('filed under its week and day', d.slot === '0:0');
    t.ok('My Day counts today as a training day, off the workout itself', d.trained === true, d.trained);
    t.ok('the block moves on to the next session', d.next === '1', JSON.stringify(d));
    t.ok('and says it saved', d.saved);
    await p.click('.tr-done [data-t="close"]');
    await openWorkouts(p);
    t.ok('the workout is in History', await p.isVisible('.tr-hrow'));
    await p.close();

    // ---- the progression, with the arithmetic checked ---------------------
    p = await t.fresh();
    const prog = await p.evaluate(() => {
      const _ = window.Train._;
      const ms = _.build({ dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'blk';
      const lib = _.lib;
      const sum = (pl, m) => pl.x.filter((x) => lib(x.e).m === m).reduce((n, x) => n + x.sets, 0);
      const base = _.plan(ms, 0, 0);
      return { ms, chest0: sum(base, 'chest'), back0: sum(base, 'back'),
        ex: base.x.map((x) => x.e) };
    });
    const ms = prog.ms;
    const A = ms.days[0].s.map((s) => s.e);
    const bench = A[0], row = A[3];
    const T0 = { pr: { u: 'lb' }, act: 'blk', ms: { blk: ms }, cx: {}, wo: {
      a0: wo('a0', 'blk', 0, 0, 20, [{ e: bench, s: sets(185, [10, 10, 9]) }, { e: row, s: sets(135, [8, 8, 8]) }],
        { fb: { chest: { p: 0, k: 0 }, back: { p: 2, k: 2 } } }),
      b0: wo('b0', 'blk', 0, 1, 19, [{ e: 'bb-squat', s: sets(225, [8]) }]),
      c0: wo('c0', 'blk', 0, 2, 18, [{ e: 'bb-incline', s: sets(155, [8]) }], { sr: { chest: 0, back: 2 } }),
      d0: wo('d0', 'blk', 0, 3, 17, [{ e: 'leg-press', s: sets(300, [12]) }]),
    } };
    await seed(p, T0);
    let r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state(), ms = st.T.ms.blk, lib = _.lib;
      const pl = _.plan(ms, 1, 0);
      const sum = (m) => pl.x.filter((x) => lib(x.e).m === m).reduce((n, x) => n + x.sets, 0);
      const benchT = pl.x[0], rowT = pl.x[3];
      return { chest: sum('chest'), back: sum('back'), bench: [benchT.tw, benchT.tr], row: [rowT.tw, rowT.tr],
        why: pl.x.map((x) => x.why), next: _.nextSlot(ms), rir: pl.rir };
    });
    t.ok('recovered early, low pump, easy: two more sets next week',
      r.chest === prog.chest0 + 2, prog.chest0 + ' -> ' + r.chest);
    t.ok('still sore, great pump, pushed hard: one fewer',
      r.back === prog.back0 - 1, prog.back0 + ' -> ' + r.back);
    t.ok('and the plan says why, in words', r.why.some((w) => /\+2 sets — recovered early, low pump, felt easy/.test(w)), r.why.join(' | '));
    t.ok('top of the range reached: five pounds more, two reps fewer',
      r.bench.join() === '190,8', r.bench.join());
    t.ok('short of it: same weight, one rep more', r.row.join() === '135,9', r.row.join());
    t.ok('week two asks for two in reserve', r.rir === 2, r.rir);
    t.ok('the next session is week two, day one', r.next && r.next.w === 1 && r.next.d === 0, JSON.stringify(r.next));

    // still sore: the sets hold, however good the pump and the workload were
    const Ts = JSON.parse(JSON.stringify(T0));
    Ts.wo.a0.fb = { chest: { p: 0, k: 0 } };
    Ts.wo.c0.sr = { chest: 2 };
    await seed(p, Ts);
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.state().T.ms.blk, lib = _.lib;
      const pl = _.plan(ms, 1, 0);
      return { chest: pl.x.filter((x) => lib(x.e).m === 'chest').reduce((n, x) => n + x.sets, 0), why: pl.x[0].why };
    });
    t.ok('low pump and easy, but still sore going in: held, not added',
      r.chest === prog.chest0 && /^Held/.test(r.why), prog.chest0 + ' -> ' + r.chest + ' ' + r.why);

    // weaker than last week: the sets hold, however good it felt
    const T1 = JSON.parse(JSON.stringify(T0));
    T1.wo.a1 = wo('a1', 'blk', 1, 0, 13, [{ e: bench, s: sets(190, [6, 6, 5]) }], { fb: { chest: { p: 0, k: 0 } } });
    T1.wo.c1 = wo('c1', 'blk', 1, 2, 11, [{ e: 'bb-incline', s: sets(155, [8]) }], { sr: { chest: 0 } });
    await seed(p, T1);
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.state().T.ms.blk, lib = _.lib;
      const sum = (pl) => pl.x.filter((x) => lib(x.e).m === 'chest').reduce((n, x) => n + x.sets, 0);
      const p1 = _.plan(ms, 1, 0), p2 = _.plan(ms, 2, 0);
      return { w1: sum(p1), w2: sum(p2), why: p2.x[0].why };
    });
    t.ok('measurably weaker than the week before: the sets hold', r.w2 === r.w1, r.w1 + ' -> ' + r.w2);
    t.ok('and it says that is why', /weaker than the week before/.test(r.why), r.why);

    // the ceiling
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const st = _.state();
      const ms = { id: 'cap', acc: 4, days: [
        { n: 'A', s: [{ e: 'bb-bench', n: 5 }, { e: 'cb-fly', n: 5 }] },
        { n: 'B', s: [{ e: 'db-incline', n: 5 }, { e: 'pec-deck', n: 6 }] }] };
      const now = Date.now();
      st.T.ms.cap = ms;
      st.T.wo.x0 = { id: 'x0', st: now - 10 * 864e5, u: 'lb', ms: 'cap', w: 0, d: 0, x: [{ e: 'bb-bench', s: [{ w: 100, r: 8 }] }], fb: { chest: { p: 0, k: 0 } }, sr: {} };
      st.T.wo.x1 = { id: 'x1', st: now - 9 * 864e5, u: 'lb', ms: 'cap', w: 0, d: 1, x: [{ e: 'db-incline', s: [{ w: 50, r: 8 }] }], fb: {}, sr: { chest: 0 } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const sf = _.setsFor(_.state().T.ms.cap, 1);
      return { a: sf.sets[0], why: sf.why[0][0] };
    });
    t.ok('never past RP’s MRV: 21 sets of chest plus two becomes 22', r.a[0] + r.a[1] === 11, JSON.stringify(r.a));
    t.ok('and it says it was capped', /Capped at 22/.test(r.why), r.why);

    // the deload
    await seed(p, T0);
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.state().T.ms.blk;
      const d = _.plan(ms, 4, 0), w0 = _.plan(ms, 0, 0);
      return { dl: d.deload, rir: d.rir, half: d.x.every((x, i) => x.sets === Math.max(1, Math.ceil(ms.days[0].s[i].n / 2))),
        bench: d.x[0].tw, w0: w0.x.map((x) => x.sets) };
    });
    t.ok('the deload is half of week one’s sets, with no reps-in-reserve target', r.dl && r.rir === null && r.half, JSON.stringify(r));
    t.ok('at week one’s weights', r.bench === 185, r.bench);

    // ---- eating less: the weekly climb follows Nourish's calories ----------
    /* Nourish's own reading is stood in for here, so each tier is exact; the
       reading itself is checked against Nourish's logs further down. Week one
       was logged before any reading was kept, so it is left as it was. */
    const phaseSays = (p, v) => p.evaluate((v) => { window.Hive.phase = () => v; window.Train._.phaseReset(); }, v);
    await seed(p, T0);
    const phaseRead = () => p.evaluate(() => {
      const _ = window.Train._, ms = _.state().T.ms.blk, lib = _.lib, pl = _.plan(ms, 1, 0);
      return { chest: pl.x.filter((x) => lib(x.e).m === 'chest').reduce((n, x) => n + x.sets, 0), why: pl.x[0].why,
        cap: _.capAt(ms, 1), rir3: _.rirFor(ms, 3), w0: _.phaseAt(ms, 0) };
    });
    await phaseSays(p, { kcal: 600, rate: 0.008, src: 'ate', days: 12 });
    r = await phaseRead();
    t.ok('cutting about 0.8% a week: the ceiling is 70% of MRV and sets climb one at a time, not two',
      r.cap === 0.7 && r.chest === prog.chest0 + 1 && /One set at a time while you are eating less/.test(r.why), JSON.stringify(r));
    t.ok('and the last hard week stops a rep short of failure', r.rir3 === 1, String(r.rir3));
    t.ok('a week logged before any reading was kept is left as it was', r.w0 === null, JSON.stringify(r.w0));
    await phaseSays(p, { kcal: 250, rate: 0.003, src: 'plan', days: 0 });
    r = await phaseRead();
    t.ok('a light deficit, 0.3% a week: 85% of the ceiling, and the +2 the feedback earned stands',
      r.cap === 0.85 && r.chest === prog.chest0 + 2 && r.rir3 === 0, JSON.stringify(r));
    await phaseSays(p, { kcal: 80, rate: 0.001, src: 'ate', days: 14 });
    r = await phaseRead();
    t.ok('near maintenance or gaining: the usual ceiling', r.cap === 0 && r.chest === prog.chest0 + 2 && r.rir3 === 0, JSON.stringify(r));
    await phaseSays(p, { kcal: 600, rate: 0.008, src: 'ate', days: 12 });
    r = await p.evaluate(() => { const _ = window.Train._, st = _.state(); st.T.pr.nph = 0; const c = _.capAt(st.T.ms.blk, 1); st.T.pr.nph = 1; return c; });
    t.ok('Ignore, in Settings: the usual ceiling whatever Nourish says', r === 0, String(r));
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const sf = { id: 'capx', acc: 4, days: [
        { n: 'A', s: [{ e: 'bb-bench', n: 5 }, { e: 'cb-fly', n: 5 }] },
        { n: 'B', s: [{ e: 'db-incline', n: 5 }, { e: 'pec-deck', n: 6 }] }] };
      st.T.ms.capx = sf;
      const now = Date.now();
      st.T.wo.y0 = { id: 'y0', st: now - 10 * 864e5, u: 'lb', ms: 'capx', w: 0, d: 0, x: [{ e: 'bb-bench', s: [{ w: 100, r: 8 }] }], fb: { chest: { p: 0, k: 0 } }, sr: {} };
      st.T.wo.y1 = { id: 'y1', st: now - 9 * 864e5, u: 'lb', ms: 'capx', w: 0, d: 1, x: [{ e: 'db-incline', s: [{ w: 50, r: 8 }] }], fb: {}, sr: { chest: 0 } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      window.Hive.phase = () => ({ kcal: 600, rate: 0.008, src: 'ate', days: 12 });
      const out = _.setsFor(_.state().T.ms.capx, 1);
      return { a: out.sets[0].concat(out.sets[1]), why: out.why[0][0] };
    });
    t.ok('at the ceiling on a cut, the reason names the calories: 21 chest sets stay 21, 70% of 22 being 15',
      r.a.reduce((n, x) => n + x, 0) === 21 && /Capped at 15 sets a week — below RP’s MRV while you eat about 600 kcal a day under maintenance/.test(r.why), JSON.stringify(r));

    // said on the block card, undone for the week and followed again
    await seed(p, T0);
    await phaseSays(p, { kcal: 600, rate: 0.008, src: 'ate', days: 12 });
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => (document.querySelector('.tr-blk .tr-ph') || {}).textContent || '');
    t.ok('the block card says what it read and what it does',
      /You’ve eaten about 600 kcal a day under maintenance these two weeks \(0\.8% of your weight a week\), so sets climb one at a time, to 70% of the usual ceiling/.test(r) && /Undo for this week/.test(r), r);
    await p.click('.tr-blk [data-t="phoff"]');
    r = await p.evaluate(() => { const _ = window.Train._, st = _.state(), ms = st.T.ms.blk;
      return { off: ms.ph && ms.ph[1] && ms.ph[1].off, cap: _.capAt(ms, 1), stamped: st.TS.ms.blk > 0, say: (document.querySelector('.tr-blk .tr-ph') || {}).textContent || '' }; });
    t.ok('undone: this week goes back to the usual ceiling, kept and synced', r.off === 1 && r.cap === 0 && r.stamped, JSON.stringify(r));
    t.ok('and it says so, with a way back', /Not following Nourish’s calories this week/.test(r.say) && /Follow them again/.test(r.say), r.say);
    await p.click('.tr-blk [data-t="phon"]');
    r = await p.evaluate(() => { const _ = window.Train._, ms = _.state().T.ms.blk; return { off: ms.ph[1].off, cap: _.capAt(ms, 1) }; });
    t.ok('followed again: 70% once more', r.off === undefined && r.cap === 0.7, JSON.stringify(r));

    // a week keeps the reading it began with
    await seed(p, T0);
    await phaseSays(p, { kcal: 600, rate: 0.008, src: 'ate', days: 12 });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="start"]');
    await phaseSays(p, { kcal: 50, rate: 0.0006, src: 'ate', days: 14 });
    r = await p.evaluate(() => { const _ = window.Train._, ms = _.state().T.ms.blk;
      return { kept: ms.ph && ms.ph[1], cap1: _.capAt(ms, 1), cap2: _.capAt(ms, 2), live: _.state().LIVE && _.state().LIVE.w }; });
    t.ok('starting the week’s first session keeps what Nourish said then',
      r.live === 1 && r.kept && r.kept.c === 0.7 && r.kept.k === 600 && r.kept.s === 'ate', JSON.stringify(r));
    t.ok('so a change in what you eat moves next week, not the week under way', r.cap1 === 0.7 && r.cap2 === 0, JSON.stringify(r));
    // back to no workout open, and no reading, for what follows
    await p.evaluate(() => { localStorage.removeItem('sh.trainLive'); window.Hive.phase = () => null; window.Train._.reload(); window.Train._.draw(); });
    await seed(p, T0);

    // Nourish's reading: what you ate against a burn measured from the same logs, or the plan's target
    const q = await t.fresh();
    await q.evaluate(() => {
      const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const intake = {}, weights = {};
      for (let n = 1; n <= 28; n++) { intake[key(n)] = 2000; weights[key(n)] = Math.round((200 + (n - 1) / 7) * 10) / 10; }
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 40, ft: 5, inch: 10, lb: 200, act: 1.55, goal: 'cut1', goalLb: 0, goalBy: '', workouts: 0, steps: 0 }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 170 }));
      localStorage.setItem('bsc.macroIntake', JSON.stringify(intake));
      localStorage.setItem('bsc.macroWeights', JSON.stringify(weights));
    });
    const hiveAfterReload = async () => { await q.reload(); await q.waitForFunction(() => window.Hive && window.Hive.phase); return q.evaluate(() => window.Hive.phase()); };
    r = await hiveAfterReload();
    t.ok('four weeks at 2,000 kcal while losing a pound a week: about 500 under a burn of about 2,500, from what was eaten',
      r && r.src === 'ate' && r.kcal >= 470 && r.kcal <= 530 && r.rate >= 0.0045 && r.rate <= 0.0055 && r.days >= 7, JSON.stringify(r));
    await q.evaluate(() => localStorage.setItem('bsc.macroIntake', '{}'));
    r = await hiveAfterReload();
    t.ok('with no eating logged, the target you eat to against the burn Nourish plans by',
      r && r.src === 'plan' && r.kcal > 300 && Math.abs(r.rate - r.kcal * 7 / 3500 / 200) < 0.0005, JSON.stringify(r));
    await q.evaluate(() => { ['bsc.macroProfile', 'bsc.macroTargets', 'bsc.macroWeights'].forEach((k) => localStorage.removeItem(k)); });
    r = await hiveAfterReload();
    t.ok('and nothing at all with no plan and no logs, so a block climbs as it always has', r === null, JSON.stringify(r));
    await q.close();

    // ---- the week, both tabs -------------------------------------------------
    /* One check-in, opened from Nourish's morning card and from the Review.
       Nourish's half is stood in for first, so each read is exact. */
    const c = await t.fresh();
    await seed(c, { pr: { u: 'lb', qz: 1, lvl: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    const NW = { from: '', to: '', lb: 195, w: { now: 196, n: 7, was: 197, m: 7 }, days: 7, kcal: 2450, target: 2400,
      p: 185, tp: 190, hit: 6, pDays: 7, maint: 2500, measured: true, plan: 0.0075 };
    const CUT = { kcal: 600, rate: 0.008, src: 'ate', days: 12 };
    const reads = (nw, ph, lifts) => c.evaluate(([nw, ph, lifts]) => {
      const _ = window.Train._, now = Date.now(), wo = {};
      (lifts || [[2, 'bb-bench', 200, 8]]).forEach(([ago, e, w, r], i) => {
        wo['k' + i] = { id: 'k' + i, st: now - ago * 864e5, en: now - ago * 864e5 + 3600e3, u: 'lb', ms: '', w: -1, d: -1, n: 'W',
          x: [{ e, s: [{ w, r, t: 1 }, { w, r, t: 1 }] }], sr: {}, fb: {} };
      });
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
      window.Hive.week = () => nw; window.Hive.phase = () => ph; _.phaseReset();
      return _.checkin().reads;
    }, [nw, ph, lifts]);
    const W = (o) => Object.assign({}, NW, o);
    const say = (x) => x.h + (x.d ? ' | ' + x.d : '');
    r = await reads(W({ w: { now: 195, n: 7, was: 200, m: 7 } }), CUT);
    t.ok('losing 2.5% in a week on a 0.75% plan: a few words, and the calories that would slow it',
      r[0].st === 'look' && say(r[0]) === 'Losing fast: ▼2.5% this week | About 1,700 kcal a day more if it holds', JSON.stringify(r));
    r = await reads(W({ w: { now: 202, n: 7, was: 200, m: 7 }, plan: -0.0025 }), null);
    t.ok('gaining 1% in a week on a lean gain', say(r[0]) === 'Gaining fast: ▲1% this week | Past a lean gain; likely fat if it holds', JSON.stringify(r));
    r = await reads(W({ w: { now: 196, n: 2, was: 200, m: 7 } }), null);
    t.ok('two weigh-ins in a week are not enough to call a rate', r.length === 1 && r[0].st === 'good', JSON.stringify(r));
    r = await reads(W({ hit: 3, pDays: 6 }), null);
    t.ok('protein short on 3 of 6 days', say(r[0]) === 'Protein short 3 of 6 days | Aim for 90% or more', JSON.stringify(r));
    r = await reads(W({ hit: 3, pDays: 6, kcal: 1900 }), CUT);
    t.ok('and on a cut it says why it matters', say(r[0]) === 'Protein short 3 of 6 days | It keeps the muscle on a cut', JSON.stringify(r));
    r = await reads(W({ days: 3 }), null);
    t.ok('three days logged: the calories are only part of the picture', say(r[0]) === 'Only 3 of 7 days logged | Calories are a partial picture', JSON.stringify(r));
    r = await reads(W({}), null, []);
    t.ok('no workouts in the seven days says so', say(r[0]) === 'No workouts this week', JSON.stringify(r));
    r = await reads(W({ w: { now: 195, n: 7, was: 200, m: 7 }, hit: 2, pDays: 6 }), CUT, []);
    t.ok('two reads at most, the most pressing first', r.length === 2 && /^Losing fast/.test(r[0].h) && /^Protein short/.test(r[1].h), JSON.stringify(r));
    const falling = [[20, 'bb-bench', 225, 8], [13, 'bb-bench', 220, 7], [6, 'bb-bench', 215, 7], [3, 'bb-row', 185, 8], [10, 'bb-row', 185, 8]];
    r = await reads(W({ kcal: 1900 }), null, falling);
    t.ok('the bench slipping while eating 600 under the week’s maintenance: slow the cut',
      say(r[0]) === 'Barbell Bench Press slipping on a cut | Slow the cut toward 0.5% a week', JSON.stringify(r));
    r = await reads(W({}), null, falling);
    t.ok('and at maintenance, the usual suspects', say(r[0]) === 'Barbell Bench Press slipping | Check sleep, stress and sets', JSON.stringify(r));
    const held = [[20, 'bb-bench', 215, 8], [6, 'bb-bench', 215, 8], [13, 'bb-row', 185, 8], [3, 'bb-row', 190, 8]];
    r = await reads(W({ kcal: 1900 }), null, held);
    t.ok('strength held on every lift on a cut is said as the win it is',
      r.length === 1 && r[0].st === 'good' && say(r[0]) === 'Strength held on a cut | The cut is costing fat, not muscle', JSON.stringify(r));
    r = await reads(W({ days: 3, kcal: 1500 }), CUT, falling);
    t.ok('with three days logged, whether it is a cut is Nourish’s two-week reading instead',
      /slipping on a cut$/.test(r[0].h) && /^Only 3 of 7 days logged/.test(r[1].h), JSON.stringify(r));
    r = await reads(W({}), CUT, held);
    t.ok('and a week with nothing to do says so, when the week itself was at maintenance', r.length === 1 && say(r[0]) === 'On track | Nothing to change', JSON.stringify(r));

    // at the top of the Review, a row each with a picture; Nourish's This week lands there
    await reads(W({ kcal: 1900, pd: [1, 1, 0, 1, 1, 1, 1], hit: 6, pDays: 7, w: { now: 199, n: 7, was: 200, m: 7 } }), null, held);
    await c.click('.tab[data-view="train"]');
    await c.click('[data-t="sub"][data-v="review"]');
    r = await c.evaluate(() => {
      const card = document.querySelector('#view-train .tr-card.tr-week');
      const first = document.querySelector('#view-train .tr-card');
      return { top: card === first, rows: [...(card ? card.querySelectorAll('.tr-wkl') : [])].map((e) => e.textContent).join(),
        dots: card ? [...card.querySelectorAll('.tr-wkdots i')].map((i) => (i.classList.contains('on') ? 1 : 0)).join('') : '',
        bar: card ? (card.querySelector('.tr-wkbar i') || {}).style.width : '', arrow: card ? (card.querySelector('.tr-wka') || {}).textContent : '',
        lifts: card ? card.querySelector('.tr-wkr-s .tr-wkv').textContent : '', reads: card ? card.querySelectorAll('.tr-chk-r li').length : 0,
        words: card ? card.textContent.length : 0 };
    });
    t.ok('the week opens the Review: weight, food, protein, training and lifts, then a note',
      r.top && r.rows === 'Weight,Food,Protein,Training,Lifts' && r.reads === 1, JSON.stringify(r));
    t.ok('drawn, not written: a dot a protein day, food as a bar against the target, an arrow on the scale, lifts up, level and down',
      r.dots === '1101111' && r.bar === '79%' && r.arrow === '▼1' && /^▲1 ●1 ▼0$/.test(r.lifts), JSON.stringify(r));
    t.ok('and in few words', r.words < 260, String(r.words));
    /* This week is on the morning card, which is Today's weigh-in now: the
       sheet holds Nourish's own card, unfolded the way a thumb unfolds it. */
    await c.click('.tab[data-view="today"]');
    await c.evaluate(() => window.Hive.weighOpen());
    await c.waitForTimeout(250);
    await c.evaluate(() => { const b = document.querySelector('#weighSheet [data-mfold="weigh"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
    await c.click('#macroWeekBtn');
    r = await c.evaluate(() => ({ shown: !document.getElementById('view-train').classList.contains('hide'), sub: window.Train._.state().S.sub,
      card: !!document.querySelector('#view-train .tr-week'), sheet: !!document.querySelector('#trainRoot .sheet') }));
    t.ok('Nourish’s This week goes to the same place: the week at the top of Strengthen’s Review', r.shown && r.sub === 'review' && r.card && !r.sheet, JSON.stringify(r));
    await c.close();

    // Nourish's half, read from its own logs
    const nq = await t.fresh();
    const dayAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    await nq.evaluate(([k1]) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 170 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k1]: { d: [{ id: 'f:cooked_beef', x: 40, eaten: 1 }] } }));
    }, [dayAgo(1)]);
    await nq.reload();
    await nq.waitForFunction(() => window.Hive && window.Hive.week);
    // a day under 400 kcal is not counted as logged, so the portion is measured from a big one
    const kcalPerX = await nq.evaluate(() => window.Hive.week().kcal / 40);
    await nq.evaluate(([K, keys]) => {
      const weights = {};
      keys.forEach((k, i) => { weights[k] = i < 7 ? 199 : 201; });
      localStorage.setItem('bsc.macroWeights', JSON.stringify(weights));
      // 2,500 kcal of beef is about 260 g of protein; 1,000 kcal of it about 104 g, under 90% of 190
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [keys[0]]: { d: [{ id: 'f:cooked_beef', x: 2500 / K, eaten: 1 }] },
        [keys[1]]: { d: [{ id: 'f:cooked_beef', x: 1000 / K, eaten: 1 }] } }));
      localStorage.removeItem('bsc.macroIntake');
    }, [kcalPerX, Array.from({ length: 14 }, (x, i) => dayAgo(i + 1))]);
    await nq.reload();
    await nq.waitForFunction(() => window.Hive && window.Hive.week);
    r = await nq.evaluate(() => window.Hive.week());
    t.ok('Nourish’s week: this week’s average weight against last week’s',
      r && r.w.now === 199 && r.w.was === 201 && r.w.n === 7 && r.w.m === 7, JSON.stringify(r && r.w));
    t.ok('two days eaten, 1,750 a day, against the target', r.days === 2 && Math.abs(r.kcal - 1750) <= 2 && r.target === 1980, JSON.stringify(r));
    t.ok('protein at target on one of the two, a day each, oldest first', r.pDays === 2 && r.hit === 1 && r.tp === 190 && r.pd.join() === '0,1', JSON.stringify(r));
    await nq.close();

    // ---- records ---------------------------------------------------------
    r = await p.evaluate(() => {
      const _ = window.Train._, T = _.state().T;
      const list = Object.values(T.wo).sort((a, b) => a.st - b.st);
      return list.map((w) => _.prsIn(w).map((x) => x.e + ':' + x.what).join());
    });
    t.ok('the first time you do a lift is not a record', r.every((x) => x === ''), JSON.stringify(r));
    await seed(p, Object.assign({}, T0, { wo: Object.assign({}, T0.wo, {
      z9: wo('z9', '', -1, -1, 1, [{ e: bench, s: sets(195, [8]) }]),
    }) }));
    r = await p.evaluate(() => window.Train._.prsIn(window.Train._.state().T.wo.z9));
    t.ok('a heavier set is, and says which record', r.length === 1 && /heaviest/.test(r[0].what) && /best est\. max/.test(r[0].what), JSON.stringify(r));
    r = await p.evaluate(() => window.Train._.prsIn({ id: 'open', st: Date.now(), u: 'lb',
      x: [{ e: 'pullup', s: [{ w: 0, r: 12 }] }, { e: 'hammer', s: [{ w: 30, r: 12 }] }] }));
    t.ok('nor is it in a workout still open — bodyweight lifts included', r.length === 0, JSON.stringify(r));
    r = await p.evaluate(() => [window.Train._.e1rm(100, 10), window.Train._.e1rm(100, 1)]);
    t.ok('e1RM is Epley’s: 100 × 10 is 133', Math.round(r[0]) === 133 && r[1] === 100, JSON.stringify(r));

    // ---- plates ----------------------------------------------------------
    r = await p.evaluate(() => [
      window.Train._.plateMath(225, 45, 'lb').plates.join('+'),
      window.Train._.plateMath(135, 45, 'lb').plates.join('+'),
      window.Train._.plateMath(100, 20, 'kg').plates.join('+'),
      window.Train._.plateMath(137, 45, 'lb').left,
    ]);
    t.ok('plates: 225 is two 45s a side, 135 is one', r[0] === '45+45' && r[1] === '45', JSON.stringify(r));
    t.ok('in kilograms too, and a remainder is said rather than hidden', r[2] === '25+15' && r[3] === 1, JSON.stringify(r));

    // ---- the review --------------------------------------------------------
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const st = _.state();
      const now = Date.now();
      const W = (id, ago, x) => ({ id, st: now - ago * 864e5, u: 'lb', ms: '', w: -1, d: -1, x, fb: {}, sr: {} });
      const t0 = now - 2 * 864e5;
      // a week and more of log: two chest days, one back day with 40-second
      // rests, and a set of three
      st.T.wo = {
        old: W('old', 12, [{ e: 'bb-bench', s: [{ w: 100, r: 8, t: now - 12 * 864e5 }] }]),
        r1: W('r1', 5, [{ e: 'bb-bench', s: [8, 8, 8, 8, 8, 8].map((r, i) => ({ w: 185, r, t: t0 - 5 * 864e5 + i * 200e3 })) }]),
        r2: W('r2', 2, [
          { e: 'bb-bench', s: [8, 8, 8, 8, 8, 8].map((r, i) => ({ w: 185, r, t: t0 + i * 200e3 })) },
          { e: 'bb-row', s: [3, 10, 10, 10, 10, 10, 10].map((r, i) => ({ w: 135, r, t: t0 + 3e6 + i * 80e3 })) }]),
      };
      st.T.act = '';
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const rv = _.review(now);
      const by = {};
      rv.checks.forEach((c) => { by[c.t] = c; });
      return { rows: rv.rows.map((x) => x.k + ':' + x.sets + ':' + x.days),
        vol: by['Weekly sets per muscle'], freq: by['How often each muscle is trained'],
        reps: by['Reps per set'], rest: by['Rest between sets'], fail: by['How close to failure'] };
    });
    t.ok('the review counts sets and days per muscle over the last week', r.rows.join() === 'chest:12:2,back:7:1', r.rows.join());
    t.ok('volume: chest is in the 10–20 band', r.vol.st === 'look' || r.vol.st === 'good');
    t.ok('frequency: back got all its sets on one day, and it says so', r.freq.st === 'look' && /Back/.test(r.freq.b), r.freq.b);
    t.ok('reps: one set of three in nineteen is not a problem', r.reps.st === 'good', r.reps.b);
    t.ok('rest: forty seconds on the rows is flagged, and named, even beside long rests on the bench',
      r.rest.st === 'look' && /Under a minute between sets on Barbell Row/.test(r.rest.b) && !/Bench/.test(r.rest.b), r.rest.b);
    t.ok('effort is not graded, and it says why', r.fail.st === 'info' && /cannot see/.test(r.fail.b));
    t.ok('every graded line cites a source', [r.vol, r.freq, r.reps, r.rest].every((c) => c.refs.length));

    r = await p.evaluate(() => {
      const _ = window.Train._;
      const st = _.state();
      st.T.wo = { a: { id: 'a', st: Date.now() - 864e5, u: 'lb', ms: '', w: -1, d: -1, x: [{ e: 'bb-bench', s: [{ w: 100, r: 8, t: 1 }] }], fb: {}, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      return _.review().checks[0];
    });
    t.ok('a log younger than a week is not graded as a week', r.st === 'info' && /not a whole week/.test(r.b), r.b);

    /* In a block, the block's week — whole, whatever day it is read on — and
       not a rolling seven days that cuts it in two. */
    await seed(p, T0);
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const rv = _.review();
      return { label: rv.label, n: rv.n, st: rv.checks[0].st };
    });
    t.ok('in a block, the review reads the block’s last whole week, even when it is weeks old',
      r.label === 'Week 1 of your block' && r.n === 4 && r.st !== 'info', JSON.stringify(r));
    await seed(p, Object.assign({}, T0, { wo: Object.assign({}, T0.wo, {
      a1: wo('a1', 'blk', 1, 0, 1, [{ e: bench, s: sets(190, [8, 8, 8]) }]),
      x1: wo('x1', '', -1, -1, 18.5, [{ e: 'db-curl', s: sets(30, [12, 12]) }]),
    }) }));
    r = await p.evaluate(() => {
      const rv = window.Train._.review();
      return { label: rv.label, n: rv.n, biceps: (rv.rows.find((x) => x.k === 'biceps') || {}).sets };
    });
    t.ok('a week in progress does not replace the last whole one', r.label === 'Week 1 of your block', r.label);
    t.ok('and a workout outside the block, done that week, is counted in it', r.n === 5 && r.biceps === 2, JSON.stringify(r));
    r = await p.evaluate(() => (window.Train._.review().checks.find((c) => /going up/.test(c.t)) || {}).b || '');
    t.ok('and it says a rise inside a block is partly effort, not all new strength', /reps to spare coming down/.test(r), r);
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="review"]');
    await p.waitForTimeout(100);
    // the checks are headlines; their sources are inside, a tap away
    await p.click('.tr-check:has([data-t="ckopen"]) [data-t="ckopen"] >> nth=0');
    if (!(await p.$('.tr-ref'))) await p.evaluate(() => { const st = window.Train._.state(); st.S.ck = {}; window.Train._.review().checks.forEach((c) => { st.S.ck[c.t] = true; }); window.Train._.draw(); });
    await p.click('.tr-ref >> nth=0');
    await p.waitForTimeout(100);
    d = await p.evaluate(() => ({ open: document.getElementById('trRefs').open, hash: location.hash }));
    t.ok('a citation opens the source list without leaving the page', d.open && !d.hash, JSON.stringify(d));
    await p.close();

    /* Settings meet setting by setting. A tablet where somebody tapped "I'm
       new" before signing in has only ever had the defaults: they must not
       go over the back protection and lifting days the account holds. */
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qznew"]');
    r = await p.evaluate(() => {
      const _ = window.Train._, T = () => _.state().T, phone = JSON.parse(JSON.stringify(T().pr));
      Object.assign(phone, { bk: 'fc', ld: [0, 2, 4], lvl: 2, rc: 150 });
      const out = {};
      // the account, as a build from before wrote it: one stamp, older than the tap
      out.took = _.merge({ pr: { v: phone, at: Date.now() - 864e5 } });
      out.pr = [T().pr.bk, T().pr.ld.join(''), T().pr.lvl, T().pr.rc].join();
      const k = _.payload(true).pr.k;
      out.k = !!(k && k.bk && k.lvl && k.lvl > k.bk);
      // a newer change to one setting from the other phone takes that setting alone
      out.one = _.merge({ pr: { v: Object.assign({}, phone, { rc: 240, bk: '' }), at: Date.now() + 1000, k: { rc: Date.now() + 1000, bk: 1 } } });
      out.pr2 = [T().pr.bk, T().pr.rc].join();
      return out; });
    t.ok('a device with only the defaults takes the account\u2019s back, days and rest, and keeps what it chose itself', r.took && r.pr === 'fc,024,0,150', JSON.stringify(r));
    t.ok('each setting goes out with its own stamp', r.k, JSON.stringify(r));
    t.ok('a newer change to one setting moves that one; an older stamp on another does not', r.one && r.pr2 === 'fc,240', JSON.stringify(r));
    await p.close();

    // ---- sync ----------------------------------------------------------------
    p = await t.fresh();
    r = await p.evaluate(async () => {
      const _ = window.Train._;
      const good = { id: 'k1', st: 1000, u: 'lb', x: [{ e: 'bb-bench', s: [{ w: 100, r: 5 }] }] };
      const better = Object.assign({}, good, { n: 'newer' });
      const out = {};
      out.first = _.merge({ wo: { k1: { v: good, at: 100 } } });
      out.older = _.merge({ wo: { k1: { v: better, at: 50 } } });
      out.keptOld = _.state().T.wo.k1.n === undefined;
      out.newer = _.merge({ wo: { k1: { v: better, at: 200 } } }) && _.state().T.wo.k1.n === 'newer';
      out.bad = _.merge({ wo: { k2: { v: { st: 'soon' }, at: 300 } } });
      out.gone = _.merge({ wo: { k1: { v: null, at: 400 } } }) && !_.state().T.wo.k1;
      out.tomb = JSON.stringify(_.payload(true).wo.k1);
      // a device that has not heard the server yet does not push
      const calls = [];
      const doc = { set: (b) => { calls.push(JSON.parse(JSON.stringify(b))); return Promise.resolve(); } };
      window.Train.attach(doc);
      window.Train.remote({ pr: { v: { u: 'kg' }, at: 1 } }, false);
      await new Promise((r) => setTimeout(r, 50));
      out.quietFromCache = calls.length === 0;
      window.Train.remote(null, true);
      await new Promise((r) => setTimeout(r, 50));
      out.wholeOnceHeard = calls.length === 1 && !!calls[0].train.pr && !!calls[0].train.wo.k1;
      out.unit = _.state().T.pr.u;
      return out;
    });
    t.ok('a remote workout is taken when there is none', r.first);
    t.ok('an older copy is ignored', !r.older && r.keptOld);
    t.ok('a newer copy wins', r.newer);
    t.ok('a wrong-shaped one is refused', !r.bad);
    t.ok('a deletion arrives as a stamped null, and travels as one', r.gone && r.tomb === '{"v":null,"at":400}', r.tomb);
    t.ok('nothing is pushed on a cached answer', r.quietFromCache);
    t.ok('the first push waits for the server, then says everything', r.wholeOnceHeard);
    t.ok('settings travel too', r.unit === 'kg', r.unit);
    /* Deleted on one phone, renamed on the other a moment later: the rename
       is the newer word on the block, so it comes back — and it was coming
       back ended, with the deletion's clearing of `act` the newer word there. */
    r = await p.evaluate(() => {
      const _ = window.Train._, now = Date.now();
      const ms = { id: 'mb', n: 'Fall', at: now - 864e5, days: [{ n: 'A', s: [] }], w: 4, acc: 4 };
      _.merge({ act: { v: 'mb', at: now - 1000 }, ms: { mb: { v: ms, at: now - 1000 } } });
      const before = _.state().T.act;
      // this phone renamed it just now; the other phone deleted it 30 ms earlier
      _.state().TS.ms.mb = now;
      _.state().T.ms.mb = Object.assign({}, ms, { n: 'Fall, week' });
      const moved = _.merge({ act: { v: '', at: now - 30 }, ms: { mb: { v: null, at: now - 30 } } });
      const s = _.state();
      return { before, moved, act: s.T.act, name: s.T.ms.mb && s.T.ms.mb.n };
    });
    t.ok('deleted on one phone and renamed on the other a moment later, the block is back, renamed, and still the one running',
      r.before === 'mb' && r.act === 'mb' && r.name === 'Fall, week', JSON.stringify(r));

    /* A block travels field by field. As one piece with one stamp, a skip
       tapped on one phone was undone by a note typed on the other a moment
       later (the note's copy was the newer block); a rename went the same
       way, and of two notes one was lost. Two phones, the real taps, the
       payload of each merged into the other. */
    {
      const A = await t.fresh(), B = await t.fresh();
      const seedLog = await A.evaluate(() => {
        const _ = window.Train._, now = Date.now(), wo = {};
        const ms = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] }); ms.id = 'x'; ms.n = 'Autumn push'; ms.at = now - 10 * 864e5;
        const pl = _.plan(ms, 0, 0), st = now - 9 * 864e5;
        wo.w1 = { id: 'w1', st, en: st + 3600e3, u: 'lb', ms: 'x', w: 0, d: 0, n: pl.n, x: pl.x.map((x) => ({ e: x.e, s: [{ w: 80, r: 8, t: st + 60e3 }] })), sr: {}, fb: {} };
        return JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [] }, act: 'x', ms: { x: ms }, cx: {}, ax: {}, wo });
      });
      // both phones with the same block, stamped long ago by a build from before
      const both = async () => {
        for (const q of [A, B]) {
          await q.evaluate((log) => {
            localStorage.setItem('bsc.train', log);
            localStorage.setItem('bsc.trainStamps', JSON.stringify({ pr: 1000, act: 1000, ms: { x: 1000 }, wo: { w1: 1000 }, cx: {}, ax: {}, nt: {}, rt: {} }));
            window.Train._.reload();
          }, seedLog);
          if (await q.$('#view-train.hide')) await q.click('.tab[data-view="train"]');
          await q.click('[data-t="sub"][data-v="block"]');
        }
      };
      const relay = async () => {
        const ab = await A.evaluate(() => window.Train._.payload(true));
        const ba = await B.evaluate(() => window.Train._.payload(true));
        await B.evaluate((b) => window.Train._.merge(b), ab);
        await A.evaluate((b) => window.Train._.merge(b), ba);
      };
      const blk = (q) => q.evaluate(() => { const x = window.Train._.state().T.ms.x; return { n: x.n, note: x.note || '', sk: (x.sk || []).join() }; });
      const openBlock = async (q) => {
        await q.click('[data-t="sub"][data-v="history"]');
        await q.evaluate(() => {
          const c = document.querySelector('[data-t="hbclose"]'); if (c) c.click();
          const b = document.querySelector('[data-t="hview"][data-v="blk"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
        });
        await q.click('[data-t="hbopen"][data-id="x"]');
      };
      const note = async (q, words) => { await openBlock(q); await q.fill('#trBlkNote', words); await q.waitForTimeout(800); };

      // a skip on A, a note on B a moment later
      await both();
      await A.click('[data-t="skip"]');
      const skipped = await A.evaluate(() => { const s = window.Train._.state(), k = JSON.parse(localStorage.getItem('bsc.trainStamps')).msk;
        return { sk: (s.T.ms.x.sk || []).join(), kept: !!(k && k.x && k.x.sk > 1000 && k.x.n === 1000), sent: !!s.TS.msk && (window.Train._.payload(true).ms.x.k || {}).sk === s.TS.msk.x.sk }; });
      await note(B, 'B: knees fine.');
      await relay();
      let ra = await blk(A), rb = await blk(B);
      t.ok('the skip goes out with a stamp of its own, kept with the others; the name keeps the old one', skipped.sk.length > 0 && skipped.kept && skipped.sent, JSON.stringify(skipped));
      t.ok('a session skipped on one phone and a note typed on the other: both phones have the skip and the note',
        ra.sk === skipped.sk && rb.sk === skipped.sk && ra.note === 'B: knees fine.' && rb.note === 'B: knees fine.', JSON.stringify({ ra, rb }));

      // a rename on A, a note on B
      await both();
      await openBlock(A);
      await A.click('[data-t="hbren"][data-id="x"]');
      await A.fill('#trBlkName', 'Renamed on A');
      await A.keyboard.press('Enter');
      await note(B, 'B: add calves.');
      await relay();
      ra = await blk(A); rb = await blk(B);
      t.ok('renamed on one phone, a note on the other: the new name and the note, on both',
        ra.n === 'Renamed on A' && rb.n === 'Renamed on A' && ra.note === 'B: add calves.' && rb.note === 'B: add calves.', JSON.stringify({ ra, rb }));

      // a note on each: the newer one, on both
      await both();
      await note(A, 'A: shoulder cranky.');
      await note(B, 'B: knees fine.');
      await relay();
      ra = await blk(A); rb = await blk(B);
      t.ok('a note typed on each phone: the newer one on both', ra.note === 'B: knees fine.' && rb.note === 'B: knees fine.', JSON.stringify({ ra, rb }));

      // from a build without the fields' stamps: the whole block, newest wins, as before
      r = await A.evaluate(() => {
        const _ = window.Train._, now = Date.now(), old = JSON.parse(JSON.stringify(_.state().T.ms.x));
        old.n = 'From the old build'; delete old.note;
        const stale = _.merge({ ms: { x: { v: Object.assign({}, old, { n: 'Stale' }), at: 2000 } } });
        const took = _.merge({ ms: { x: { v: old, at: now + 1000 } } });
        const x = _.state().T.ms.x, k = _.payload(true).ms.x.k || {};
        // and a newer field that would leave the block wrong-shaped is refused
        const bad = _.merge({ ms: { x: { v: Object.assign({}, x, { days: [] }), at: now + 2000, k: { days: now + 2000 } } } });
        return { stale, took, n: x.n, note: x.note || '', k: k.n === now + 1000 && k.days === now + 1000, bad, days: _.state().T.ms.x.days.length };
      });
      t.ok('a block from a build without them goes whole, newest wins: an older one is ignored, a newer one replaces it, note and all',
        !r.stale && r.took && r.n === 'From the old build' && !r.note && r.k, JSON.stringify(r));
      t.ok('a newer field that would leave the block wrong-shaped is refused', !r.bad && r.days > 0, JSON.stringify(r));
      await A.close(); await B.close();
    }

    /* The same, with a real change made on the screen while the server has
       not answered yet: it waits, and then goes out inside the whole push. */
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    await p.evaluate(() => {
      window.__calls = [];
      window.Train.attach({ set: (b) => { window.__calls.push(JSON.parse(JSON.stringify(b))); return Promise.resolve(); } });
    });
    await p.click('#trainRoot [data-t="s-rc"][data-v="120"]');
    await p.waitForTimeout(1100);
    r = await p.evaluate(() => window.__calls.length);
    t.ok('a change made before the server has answered is held back', r === 0, r);
    await p.evaluate(() => window.Train.remote(null, true));
    await p.waitForTimeout(50);
    r = await p.evaluate(() => window.__calls.map((c) => c.train.pr && c.train.pr.v.rc));
    t.ok('and goes out with everything once it has', r.length === 1 && r[0] === 120, JSON.stringify(r));
    await p.click('#trainRoot [data-t="s-ri"][data-v="60"]');
    await p.waitForTimeout(1100);
    r = await p.evaluate(() => window.__calls.map((c) => Object.keys(c.train).join('+')));
    t.ok('after that, a change sends only itself', r.length === 2 && r[1] === 'pr', JSON.stringify(r));

    await p.evaluate(() => window.Train.forget());
    r = await p.evaluate(() => ({ t: localStorage.getItem('bsc.train'), n: Object.keys(window.Train._.state().T.wo).length }));
    t.ok('forgetting clears it from the device', r.t === null && r.n === 0, JSON.stringify(r));
    await p.close();

    // ---- a narrow phone ------------------------------------------------------
    p = await t.fresh({ viewport: { width: 360, height: 740 } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qzskip"]');
    await p.click('.tr-prog [data-t="prog"] >> nth=0');
    await p.click('[data-t="build"]');
    await p.click('[data-t="begin"]');
    await p.click('[data-t="start"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rows: [...document.querySelectorAll('.tr-set')].every((e) => e.scrollWidth <= e.clientWidth + 1),
    }));
    t.ok('the logger fits a 360px phone without sideways scroll', r.overflow <= 0 && r.rows, JSON.stringify(r));
    await p.close();

    // ---- your back, your minutes, your goal ------------------------------------
    /* Somebody whose disc has been through squats and deadlifts, who bends
       forward badly, has forty minutes and wants to keep what they have. */
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const kits = ['gym', 'bar', 'db'];
      const bad = [];
      kits.forEach((kit) => {
        [2, 3].forEach((dpw) => {
          const ms = _.build({ goal: 'keep', dpw, kit, min: 40, bk: 'f', acc: 8 });
          ms.days.forEach((d) => d.s.forEach((s) => { if (/F/.test(_.lib(s.e).bk)) bad.push('keep ' + kit + dpw + ' ' + s.e); }));
        });
        [2, 3, 4, 5, 6].forEach((dpw) => {
          const ms = _.build({ goal: 'grow', dpw, kit, min: 0, bk: 'f', acc: 4, lvl: 1, pri: [] });
          ms.days.forEach((d) => d.s.forEach((s) => { if (/F/.test(_.lib(s.e).bk)) bad.push('grow ' + kit + dpw + ' ' + s.e); }));
        });
      });
      const plain = _.build({ goal: 'grow', dpw: 4, kit: 'gym', min: 0, bk: '', acc: 4, lvl: 1, pri: [] });
      return { bad, plainHasSquat: plain.days.some((d) => d.s.some((s) => s.e === 'bb-squat')) };
    });
    t.ok('protecting a back from bending leaves loaded bending out of every split, every kit, either goal',
      r.bad.length === 0, r.bad.join(', '));
    t.ok('and it is the protection doing it: without it the back squat is still there', r.plainHasSquat);

    r = await p.evaluate(() => {
      const _ = window.Train._;
      const ms = _.build({ goal: 'keep', dpw: 2, kit: 'gym', min: 40, bk: 'f', acc: 8, avoid: ['hack'] });
      const A = ms.days[0];
      return {
        pairs: A.s.map((s) => s.p || 0).join(''),
        sets: ms.days.every((d) => d.s.every((s) => s.n === 3)),
        mins: ms.days.map((d) => _.estDay(d)),
        weeks: _.weeksOf(ms), rir: [0, 3, 7].map((w) => _.rirFor(ms, w)),
        hack: ms.days.some((d) => d.s.some((s) => s.e === 'hack')),
        core: ms.days.map((d) => d.s.filter((s) => _.lib(s.e).m === 'abs').map((s) => s.e)).flat(),
      };
    });
    t.ok('keeping strength: three pairs a session', r.pairs === '112233', r.pairs);
    t.ok('three sets of everything', r.sets);
    t.ok('and each session fits in forty minutes', r.mins.every((m) => m <= 40), r.mins.join());
    t.ok('eight working weeks, no deload, about two in reserve throughout',
      r.weeks === 8 && r.rir.join() === '2,2,2', r.weeks + ' ' + r.rir.join());
    t.ok('an exercise on the never list is never chosen', !r.hack);
    t.ok('the core work resists movement rather than bending', r.core.every((e) => ['pallof', 'dead-bug', 'bird-dog'].indexOf(e) >= 0), r.core.join());

    // the keeping progression: steady, a set off for too much, one back for a slide
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const st = _.state();
      const ms = _.build({ goal: 'keep', dpw: 2, kit: 'gym', min: 40, bk: 'f', acc: 8 });
      ms.id = 'kp';
      const now = Date.now(), D = 864e5;
      const A = ms.days[0].s.map((s) => s.e);
      const W = (id, w, ago, sq, fb) => ({ id, st: now - ago * D, u: 'lb', ms: 'kp', w, d: 0,
        x: [{ e: A[0], s: [{ w: sq[0], r: sq[1] }] }], fb: fb || {}, sr: {} });
      st.T.ms = { kp: ms }; st.T.act = 'kp';
      st.T.wo = {
        a0: W('a0', 0, 30, [300, 10]),
        a1: W('a1', 1, 23, [300, 10], { chest: { k: 3 } }),
        a2: W('a2', 2, 16, [300, 8]),
        a3: W('a3', 3, 9, [300, 6]),
      };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.kp;
      const sets = (w, mus) => _.plan(m, w, 0).x.filter((x) => _.lib(x.e).m === mus).reduce((n, x) => n + x.sets, 0);
      const pl1 = _.plan(m, 1, 0), pl2 = _.plan(m, 2, 0), pl4 = _.plan(m, 4, 0);
      return {
        chest: [sets(1, 'chest'), sets(2, 'chest'), sets(3, 'chest')],
        quads: [sets(1, 'quads'), sets(3, 'quads'), sets(4, 'quads')],
        why1: pl1.x.map((x) => x.why).filter(Boolean),
        why2: pl2.x.find((x) => _.lib(x.e).m === 'chest').why,
        why4: pl4.x.find((x) => _.lib(x.e).m === 'quads').why,
      };
    });
    t.ok('keeping holds the sets steady with nothing to explain', r.chest[0] === 3 && r.why1.length === 0, JSON.stringify(r));
    t.ok('a week that was too much takes a set off the next', r.chest[1] === 2 && /too much/.test(r.why2), r.chest.join() + ' ' + r.why2);
    t.ok('strength sliding two weeks running puts one back', r.quads[2] === r.quads[1] + 1 && /slipped two weeks running/.test(r.why4),
      r.quads.join() + ' ' + r.why4);

    // growing inside forty minutes: fitted at the start, and held there
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const out = {};
      [2, 3, 4, 5, 6].forEach((dpw) => {
        const ms = _.build({ goal: 'grow', dpw, kit: 'gym', min: 40, bk: '', acc: 4, lvl: 1, pri: [] });
        out[dpw] = ms.days.map((d) => _.estDay(d));
      });
      const st = _.state();
      const ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', min: 40, bk: '', acc: 4, lvl: 1, pri: [] });
      ms.id = 'gt';
      const fb = {}; ms.days[0].s.forEach((s) => { fb[_.lib(s.e).m] = { p: 0, k: 0 }; });
      st.T.ms = { gt: ms }; st.T.act = 'gt';
      st.T.wo = { g0: { id: 'g0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'gt', w: 0, d: 0,
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 100, r: 8 }] }], fb, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.gt;
      const p1 = _.plan(m, 1, 0);
      out.after = _.estDay(m.days[0], p1.x.map((x) => x.sets));
      out.why = p1.x.map((x) => x.why).join(' | ');
      return out;
    });
    t.ok('growing inside forty minutes: every day of every split is built to fit',
      [2, 3, 4, 5, 6].every((k) => r[k].every((m) => m <= 40)), JSON.stringify(r));
    t.ok('and the weekly climb stops at the minutes, and says so',
      r.after <= 40 && /Held to fit your 40-minute session/.test(r.why), r.after + ' ' + r.why);

    // ---- the builder, a session, and a round of golf, on the screen -----------
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => { localStorage.removeItem('bsc.train'); window.Train._.reload(); window.Train._.state().S.qz = null; });
    await openWorkouts(p);
    await p.click('[data-t="sub"][data-v="block"]');
    await answer(p, { goal: 'keep', lvl: 2, dpw: 2, min: 40, bk: 'f', hab: ['golfw'] });
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-prog [data-t="prog"]')].map((b) => b.dataset.v));
    t.ok('keeping strength, two days, forty minutes: the maintenance block comes first', r[0] === 'keep', r.join());
    await p.click('[data-t="prog"][data-v="keep"]');
    await p.click('[data-t="build"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => ({
      pr: window.Train._.state().T.pr,
      mins: [...document.querySelectorAll('.tr-mins')].map((e) => e.textContent),
      labels: [...document.querySelectorAll('.tr-dday')][0].querySelectorAll('.tr-pair').length,
    }));
    t.ok('what you tell the builder is kept as yours', r.pr.goal === 'keep' && r.pr.min === 40 && r.pr.bk === 'f' &&
      r.pr.hab.join() === 'golfw', JSON.stringify(r.pr));
    t.ok('and the draft says how long each day takes, and which lifts are paired',
      r.mins.length === 2 && r.mins.every((m) => /about \d+ min/.test(m)) && r.labels === 6, JSON.stringify(r));

    // swap with never-again: gone from the whole draft, and on the list
    await p.click('[data-t="dswap"][data-d="1"][data-i="0"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => [...document.querySelectorAll('#trainRoot .tr-pick')]
      .filter((b) => /Romanian Deadlift/.test(b.textContent)).map((b) => b.querySelector('.tr-pk-w') && b.querySelector('.tr-pk-w').textContent));
    await p.click('#trainRoot [data-t="pickm"][data-v="hams"]');
    r = await p.evaluate(() => [...document.querySelectorAll('#trainRoot .tr-pick[data-e="bb-rdl"], #trainRoot .tr-pick[data-e="db-rdl"]')]
      .map((b) => (b.querySelector('.tr-pk-w') || {}).textContent));
    t.ok('the picker still offers what your back rules out, and says why', r[0] === 'loads your back', JSON.stringify(r));
    await p.click('#trainRoot [data-t="pickm"][data-v=""]');
    const was = await p.evaluate(() => window.Train._.state().S.draft.days[1].s[0].e);
    await p.click('#trainRoot [data-t="never"]');
    await p.click('#trainRoot [data-t="pickex"][data-e="mc-thrust"]');
    await p.waitForTimeout(100);
    r = await p.evaluate((was) => ({
      avoid: window.Train._.state().T.pr.avoid,
      left: window.Train._.state().S.draft.days.some((d) => d.s.some((s) => s.e === was)),
    }), was);
    t.ok('never again takes it out of the whole block and onto your never list',
      r.avoid.indexOf(was) >= 0 && !r.left, JSON.stringify(r) + ' ' + was);

    await p.click('[data-t="begin"]');
    await p.click('[data-t="start"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => ({
      pairs: [...document.querySelectorAll('.tr-ex .tr-pair')].map((e) => e.textContent).join(','),
      bk: !!document.querySelector('[data-t="bk"]'),
      pump: !!document.querySelector('[data-t="fb"][data-f="p"]'),
    }));
    t.ok('the session shows its pairs as A1, A2, B1…', r.pairs === 'A1,A2,B1,B2,C1,C2', r.pairs);
    t.ok('and asks how your back is before you start', r.bk);
    await p.click('[data-t="bk"][data-v="2"]');
    t.ok('a sore back gets told to skip the leg work, and what nerve symptoms mean',
      /Skip the lower-body lifts today/.test(await p.evaluate(() => document.querySelector('.tr-warn').textContent)));
    await p.fill('#trw-0-0', '200');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => Math.round((window.Train._.state().LIVE.rs.end - Date.now()) / 1000));
    t.ok('a paired set rests a minute, not three: the other half goes next', r > 55 && r <= 60, r);
    for (let j = 1; j < 3; j++) await p.click(`[data-t="tick"][data-x="0"][data-s="${j}"]`);
    r = await p.evaluate(() => ({ pump: !!document.querySelector('[data-t="fb"][data-f="p"]'),
      work: !!document.querySelector('[data-t="fb"][data-f="k"]'),
      label: [...document.querySelectorAll('.tr-fbm')].map((e) => e.textContent).join('|') }));
    t.ok('keeping asks about workload and back, not pump', !r.pump && r.work && /Back &/.test(r.label), JSON.stringify(r));
    await p.click('[data-t="finish"]');
    await p.click('#trainRoot [data-t="save"]');
    await p.waitForTimeout(150);
    await p.click('.tr-done [data-t="close"]');
    r = await p.evaluate(() => Object.values(window.Train._.state().T.wo)[0].bk);
    t.ok('the back check is saved with the workout', r === 2, r);

    await p.click('[data-t="axnew"][data-v="golfw"]');
    await p.click('#trainRoot [data-t="axmin"][data-v="240"]');
    await p.click('#trainRoot [data-t="axsave"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => ({ ax: Object.values(window.Train._.state().T.ax),
      strip: document.querySelector('.tr-actv-n').textContent }));
    t.ok('a round of golf is one tap and a length', r.ax.length === 1 && r.ax[0].k === 'golfw' && r.ax[0].min === 240, JSON.stringify(r.ax));
    t.ok('and the block shows the week’s minutes outside the gym', /4 h/.test(r.strip), r.strip);
    await openWorkouts(p);
    t.ok('it is in History beside the workouts', await p.isVisible('.tr-hax'));
    await p.click('[data-t="sub"][data-v="review"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => {
      const rv = window.Train._.review();
      const by = {}; rv.checks.forEach((c) => { by[c.t] = c; });
      return { cardio: by['Active minutes outside the gym'], back: by['Your back'], keep: rv.keep,
        eyebrowBand: document.querySelector('.tr-vkey').textContent };
    });
    t.ok('the review counts golf toward the week’s cardio', r.cardio && /4 h/.test(r.cardio.b) && /150/.test(r.cardio.b), r.cardio && r.cardio.b);
    t.ok('and reads the back check-ins', r.back && r.back.st === 'look' && /Sore going into 1 session/.test(r.back.b), r.back && r.back.b);
    t.ok('and grades keeping by the keeping research', r.keep && /enough to keep strength/.test(r.eyebrowBand), r.eyebrowBand);

    // activity syncs like everything else
    r = await p.evaluate(() => {
      const _ = window.Train._;
      return {
        ok: _.merge({ ax: { z1: { v: { id: 'z1', st: Date.now(), k: 'walk', min: 30 }, at: Date.now() } } }),
        bad: _.merge({ ax: { z2: { v: { id: 'z2', st: Date.now(), k: 'skydiving', min: 30 }, at: Date.now() } } }),
        huge: _.merge({ ax: { z3: { v: { id: 'z3', st: Date.now(), k: 'walk', min: 99999 }, at: Date.now() } } }),
      };
    });
    t.ok('a walk from the other phone is taken; nonsense is not', r.ok && !r.bad && !r.huge, JSON.stringify(r));

    // the profile survives a reload, and bad values are cleaned
    r = await p.evaluate(() => {
      const T = JSON.parse(localStorage.getItem('bsc.train'));
      T.pr = Object.assign(T.pr, { min: 17, bk: 'fz<', hab: ['golfw', 'hang-gliding'], goal: 'x' });
      localStorage.setItem('bsc.train', JSON.stringify(T));
      window.Train._.reload();
      return window.Train._.state().T.pr;
    });
    t.ok('a mangled profile is cleaned rather than trusted',
      r.min === 0 && r.bk === 'f' && r.hab.join() === 'golfw' && r.goal === 'muscle', JSON.stringify(r));
    await p.close();

    // ---- everybody: the picks ----------------------------------------------------
    /* Round three: not one lifter but anybody — new or years in, a gym or a
       floor, building or keeping or losing, with a bad knee or a sore
       shoulder, a desk or a building site, soccer on Sundays. */
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const top = (o) => _.recommend(_.defaultsPr(Object.assign({ qz: 1 }, o)))[0].id;
      const all = _.recommend(_.defaultsPr({ goal: 'muscle', lvl: 0, kit: 'bw', dpw: 2, min: 30 }));
      return {
        novice: top({ goal: 'muscle', lvl: 0, kit: 'gym', dpw: 3 }),
        keep: top({ goal: 'keep', lvl: 2, kit: 'gym', dpw: 2, min: 40 }),
        lean: top({ goal: 'lean', lvl: 1, kit: 'gym', dpw: 4 }),
        home: top({ goal: 'muscle', lvl: 1, kit: 'bw', dpw: 3 }),
        health: top({ goal: 'health', lvl: 0, kit: 'db', dpw: 2 }),
        grow: top({ goal: 'muscle', lvl: 2, kit: 'gym', dpw: 5 }),
        reasons: all.every((x) => x.why.length >= 1),
        against: all.some((x) => x.why.some((w) => w.bad)),
      };
    });
    t.ok('somebody new to lifting is pointed at the beginner program first', r.novice === 'start', r.novice);
    t.ok('keeping strength on two days points at the maintenance block', r.keep === 'keep', r.keep);
    t.ok('losing fat points at the fat-loss block', r.lean === 'lean', r.lean);
    t.ok('no weights points at home and bodyweight', r.home === 'home', r.home);
    t.ok('feeling better, new, with dumbbells: the beginner program', r.health === 'start', r.health);
    t.ok('years in, five days, building muscle: the RP-style block', r.grow === 'grow', r.grow);
    t.ok('every program gives its reasons, including the ones against it', r.reasons && r.against);

    // ---- every program, every kit ---------------------------------------------------
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const bad = [];
      Object.keys(_.PROGS).forEach((id) => {
        const P = _.PROGS[id];
        (P.kits || Object.keys(_.KITS)).forEach((kit) => {
          P.dpw.forEach((dpw) => [0, 1, 2].forEach((lvl) => {
            const ms = _.build({ prog: id, fx: 'arms', dpw, kit, lvl, acc: P.dAcc, min: 0 });
            const eq = _.KITS[kit].eq;
            const tag = id + ' ' + kit + ' ' + dpw + 'd L' + lvl;
            if (ms.days.length !== dpw) bad.push(tag + ': ' + ms.days.length + ' days');
            ms.days.forEach((d) => {
              // a bodyweight gym split and an emphasis block's held days run thin, on purpose; never empty
              if (d.s.length < (kit === 'bw' || id === 'focus' ? 2 : 3)) bad.push(tag + ' ' + d.n + ': ' + d.s.length + ' exercises');
              if (new Set(d.s.map((s) => s.e)).size !== d.s.length) bad.push(tag + ' ' + d.n + ': repeats');
              d.s.forEach((s) => {
                if (eq.indexOf(_.lib(s.e).q) < 0) bad.push(tag + ' ' + s.e + ': not in the kit');
                if (!(s.n >= 1 && s.n <= 6)) bad.push(tag + ' ' + s.e + ': ' + s.n + ' sets');
              });
            });
          }));
        });
      });
      return bad;
    });
    t.ok('every program builds on every kit, day count and level it offers: the right days, only the kit you have, sensible sets',
      r.length === 0, r.slice(0, 8).join('; '));

    r = await p.evaluate(() => {
      const _ = window.Train._;
      const homey = ['pushup-flat', 'inc-pushup', 'pushup', 'archer', 'pullup-neg', 'inv-row', 'bw-squat', 'split-squat', 'bw-bss',
        'sl-rdl', 'glute-bridge', 'sl-bridge', 'pike-pushup', 'diamond', 'calf-bw'];
      const bad = [], hurt = [];
      ['grow', 'focus', 'lean', 'keep', 'start'].forEach((id) => ['gym', 'bar'].forEach((kit) => _.PROGS[id].dpw.forEach((dpw) => {
        _.build({ prog: id, fx: 'chest', dpw, kit, lvl: 1 }).days.forEach((d) => d.s.forEach((s) => {
          if (homey.indexOf(s.e) >= 0) bad.push(id + ' ' + kit + dpw + ' ' + s.e);
        }));
      })));
      Object.keys(_.PROGS).forEach((id) => (_.PROGS[id].kits || Object.keys(_.KITS)).forEach((kit) => _.PROGS[id].dpw.forEach((dpw) => {
        _.build({ prog: id, fx: 'shoulders', dpw, kit, lvl: 1, jt: 'SKW', bk: 'fcx' }).days.forEach((d) => d.s.forEach((s) => {
          const ex = _.lib(s.e);
          if (/[SKW]/.test(ex.jt) || /[FCX]/.test(ex.bk)) hurt.push(id + ' ' + kit + dpw + ' ' + s.e);
        }));
      })));
      return { bad, hurt };
    });
    t.ok('with weights to load, nobody is handed the bodyweight version of a lift', r.bad.length === 0, r.bad.slice(0, 6).join(', '));
    t.ok('a protected shoulder, knee, wrist and back keep what loads them hard out of every program on every kit',
      r.hurt.length === 0, r.hurt.slice(0, 6).join(', '));

    // starting out: steady, three in reserve easing to two, no deload
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'start', dpw: 3, kit: 'gym', lvl: 0, acc: 6 });
      ms.id = 'sb';
      const fb = {}; ms.days[0].s.forEach((s) => { fb[_.lib(s.e).m] = { p: 0, k: 0 }; });
      st.T.ms = { sb: ms }; st.T.act = 'sb';
      st.T.wo = { s0: { id: 's0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'sb', w: 0, d: 0,
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 100, r: 8 }] }], fb, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.sb;
      return {
        goal: m.goal, weeks: _.weeksOf(m), rir: [0, 1, 2, 3, 4, 5].map((w) => _.rirFor(m, w)).join(),
        two: m.days.every((d) => d.s.every((s) => s.n === 2)),
        held: _.plan(m, 1, 0).x.every((x, i) => x.sets === m.days[0].s[i].n),
        rv: _.review().checks.map((c) => c.t),
      };
    });
    t.ok('starting out: six working weeks, no deload, three in reserve easing to two',
      r.goal === 'base' && r.weeks === 6 && r.rir === '3,3,3,2,2,2', JSON.stringify(r));
    t.ok('two sets of everything on three days, and an easy week does not pile more on', r.two && r.held, JSON.stringify(r));
    t.ok('and the review grades it by what a beginner needs', r.rv.indexOf('Enough to grow on?') >= 0, r.rv.join(' | '));

    // bringing up one part
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'focus', fx: 'chest', dpw: 4, kit: 'gym', lvl: 1, acc: 4 });
      ms.id = 'fc';
      const sum = (m) => ms.days.reduce((n, d) => n + d.s.filter((s) => _.lib(s.e).m === m).reduce((a, s) => a + s.n, 0), 0);
      const first = ms.days.filter((d) => d.s.some((s) => _.lib(s.e).m === 'chest')).every((d) => _.lib(d.s[0].e).m === 'chest');
      const out = { first, chest: sum('chest'), quads: sum('quads'), fx: ms.fx.join(), name: ms.n };
      const fb = {}; ms.days[0].s.forEach((s) => { fb[_.lib(s.e).m] = { p: 0, k: 0 }; });
      st.T.ms = { fc: ms }; st.T.act = 'fc';
      st.T.wo = { f0: { id: 'f0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'fc', w: 0, d: 0,
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 100, r: 8 }] }], fb, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.fc;
      const day = (w, mus) => _.plan(m, w, 0).x.filter((x) => _.lib(x.e).m === mus).reduce((n, x) => n + x.sets, 0);
      out.chestUp = day(1, 'chest') - day(0, 'chest');
      out.backUp = day(1, 'back') - day(0, 'back');
      return out;
    });
    t.ok('a chest focus puts chest first on every day that trains it', r.first, JSON.stringify(r));
    t.ok('starts it at least four over MEV, and holds the rest near maintenance', r.chest >= 12 && r.quads <= 5, JSON.stringify(r));
    t.ok('and a good week climbs the focus while the rest holds', r.chestUp === 2 && r.backUp === 0, JSON.stringify(r));

    // losing fat
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'lean', dpw: 4, kit: 'gym', lvl: 1, acc: 4 });
      ms.id = 'ln';
      const fb = {}; ms.days[0].s.forEach((s) => { fb[_.lib(s.e).m] = { p: 0, k: 0 }; });
      st.T.ms = { ln: ms }; st.T.act = 'ln';
      st.T.wo = { l0: { id: 'l0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'ln', w: 0, d: 0,
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 100, r: 8 }] }], fb, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.ln;
      const day = (w) => _.plan(m, w, 0).x.filter((x) => _.lib(x.e).m === 'chest');
      return { up: day(1).reduce((n, x) => n + x.sets, 0) - day(0).reduce((n, x) => n + x.sets, 0),
        why: day(1)[0].why, rir: [0, 1, 2, 3].map((w) => _.rirFor(m, w)).join() };
    });
    t.ok('eating less: a plainly good week still adds only one set, and says why', r.up === 1 && /One set at a time/.test(r.why), JSON.stringify(r));
    t.ok('and sets stop a rep short of failure', r.rir === '3,2,1,1', r.rir);

    // bodyweight: the ladder
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'home', dpw: 3, kit: 'bw', lvl: 0, acc: 4 });
      ms.id = 'hm';
      const d0 = ms.days[0].s.map((s) => s.e);
      st.T.ms = { hm: ms }; st.T.act = 'hm';
      st.T.wo = { h0: { id: 'h0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'hm', w: 0, d: 0,
        x: [{ e: 'inc-pushup', s: [{ w: 0, r: 20 }, { w: 0, r: 20 }, { w: 0, r: 20 }] }], fb: {}, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.hm;
      const x1 = _.plan(m, 1, 0).x.find((x) => x.up === 'inc-pushup');
      const xd = _.plan(m, 4, 0).x.map((x) => x.e);
      return { d0, x1: x1 && x1.e, deload: xd.indexOf('inc-pushup') >= 0, notes: m.nt.join(' ') };
    });
    t.ok('new to it, at home: push-ups start on the incline and pull-ups on the negative',
      r.d0.indexOf('inc-pushup') >= 0 && r.d0.indexOf('pullup-neg') >= 0 && /easier version/.test(r.notes), JSON.stringify(r));
    t.ok('top the rep range on every set and the next session moves up a rung', r.x1 === 'pushup-flat', JSON.stringify(r));
    t.ok('but not in a deload week', r.deload, JSON.stringify(r));

    // your life shapes it
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const sum = (ms, list) => ms.days.reduce((n, d) => n + d.s.filter((s) => list.indexOf(_.lib(s.e).m) >= 0).reduce((a, s) => a + s.n, 0), 0);
      const base = _.build({ prog: 'grow', dpw: 4, kit: 'gym', lvl: 1 });
      const soccer = _.build({ prog: 'grow', dpw: 4, kit: 'gym', lvl: 1, hab: ['soccer'] });
      const job = _.build({ prog: 'grow', dpw: 4, kit: 'gym', lvl: 1, day: 'labor' });
      const old = _.build({ prog: 'keep', dpw: 3, kit: 'gym', age: '60' });
      const young = _.build({ prog: 'keep', dpw: 3, kit: 'gym', age: 'u40' });
      return {
        legs: [sum(base, ['quads', 'hams', 'calves']), sum(soccer, ['quads', 'hams', 'calves'])],
        back: [sum(base, ['back']), sum(job, ['back'])],
        said: /soccer already works your legs/.test(soccer.nt.join()) && /physical job/.test(job.nt.join()),
        old: old.days.every((d) => d.s.every((s) => s.n === 3)), young: young.days.every((d) => d.s.every((s) => s.n === 2)),
      };
    });
    t.ok('soccer on the side starts leg volume lower', r.legs[1] < r.legs[0], JSON.stringify(r.legs));
    t.ok('a physical job starts back volume lower too', r.back[1] < r.back[0], JSON.stringify(r.back));
    t.ok('and the draft says so, in words', r.said);
    t.ok('past sixty, keeping uses three sets where under forty uses two', r.old && r.young);

    // anything outside the gym
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const now = Date.now(), D = 864e5;
      st.T.ax = {
        a: { id: 'a', st: now - D, k: 'soccer', min: 60 },
        b: { id: 'b', st: now - D, k: 'yoga', min: 60 },
        c: { id: 'c', st: now - D, k: 'other', min: 30, lv: 'm', nm: 'Surfing' },
        d: { id: 'd', st: now - D, k: 'walk', min: 30, lv: 'v' },
      };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const wk = _.axWeek(now);
      return {
        wk,
        long: _.merge({ ax: { z4: { v: { id: 'z4', st: now, k: 'other', min: 30, nm: 'x'.repeat(41) }, at: now } } }),
        lv: _.merge({ ax: { z5: { v: { id: 'z5', st: now, k: 'walk', min: 30, lv: 'extreme' }, at: now } } }),
      };
    });
    t.ok('a vigorous minute counts twice, a light one not at all, and your own mark beats the default',
      r.wk.min === 180 && r.wk.mv === 210 && r.wk.light === 60, JSON.stringify(r.wk));
    t.ok('something else can be called what it is', r.wk.by.surfing === 30, JSON.stringify(r.wk.by));
    t.ok('an over-long name or a made-up effort from another device is refused', !r.long && !r.lv);
    await p.close();

    // ---- the quiz again, from Settings --------------------------------------------
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await answer(p, { goal: 'lean', lvl: 1, dpw: 3, min: 45, kit: 'db', jt: 'K', day: 'desk', hab: ['walk', 'hike'], age: '40' });
    r = await p.evaluate(() => ({ pr: window.Train._.state().T.pr,
      first: document.querySelector('.tr-prog [data-t="prog"]').dataset.v,
      line: document.querySelector('.tr-card .tr-sub').textContent }));
    t.ok('a knee, a desk and some hiking are all kept', r.pr.jt === 'K' && r.pr.day === 'desk' && r.pr.hab.join() === 'walk,hike' &&
      r.pr.kit === 'db' && r.pr.age === '40', JSON.stringify(r.pr));
    t.ok('and read back in a line above the picks', /looking after knee/.test(r.line) && /hiking/.test(r.line), r.line);
    await openSettings(p);
    r = await p.evaluate(() => document.querySelector('#trainRoot').textContent);
    t.ok('Settings shows your answers and a way to change them', /About you/.test(r) && /Change my answers/.test(r));
    await p.click('#trainRoot [data-t="requiz"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => (document.querySelector('[data-t="qz"][aria-pressed="true"]') || {}).dataset);
    t.ok('changing them starts from what you said before', r && r.v === 'lean', JSON.stringify(r));
    for (const step of ['one', 'one', 'next', 'one', 'next', 'next']) {
      await p.click(step === 'next' ? '[data-t="qzn"]' : '[data-t="qz"][aria-pressed="true"]');
    }
    r = await p.evaluate(() => document.querySelector('.tr-quiz').textContent);
    t.ok('the last question explains why it never asks whether you are a man or a woman', /does not ask whether you are a man or a woman/.test(r), r.slice(0, 120));
    await p.click('[data-t="qzx"]');
    r = await p.evaluate(() => !!document.querySelector('.tr-prog'));
    t.ok('and Cancel goes back to the picks without changing anything', r);
    await p.click('[data-t="prog"][data-v="home"]');
    r = await p.evaluate(() => [...document.querySelectorAll('[data-t="o-kit"]')].map((b) => b.dataset.v).join());
    t.ok('home and bodyweight only offers home kit', r === 'bw,db', r);
    await p.click('[data-t="build"]');
    r = await p.evaluate(() => document.querySelector('.tr-card').textContent);
    t.ok('and a home block says what an exercise needs', /Needs a pull-up bar/.test(r) || /Needs /.test(r), r.slice(0, 200));
    await p.click('[data-t="begin"]');
    await p.click('[data-t="browse"]');
    r = await p.evaluate(() => ({ picks: !!document.querySelector('.tr-prog'), back: !!document.querySelector('[data-t="unbrowse"]') }));
    t.ok('with a block running, the other programs are a tap away, and so is the way back', r.picks && r.back, JSON.stringify(r));
    await p.click('[data-t="unbrowse"]');
    t.ok('back to the block', await p.isVisible('[data-t="start"]'));
    await p.close();

    // ---- strength: waves and powerbuilding ------------------------------------------
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const top = (o) => _.recommend(_.defaultsPr(Object.assign({ qz: 1 }, o)))[0].id;
      const plain = _.build({ prog: 'waves', dpw: 4, kit: 'gym', lvl: 1 });
      const back = _.build({ prog: 'waves', dpw: 4, kit: 'gym', lvl: 1, bk: 'f' });
      return {
        strength: top({ goal: 'strength', lvl: 1, kit: 'gym', dpw: 4 }),
        both: top({ goal: 'both', lvl: 2, kit: 'gym', dpw: 4 }),
        noBar: top({ goal: 'strength', lvl: 1, kit: 'bw', dpw: 4 }),
        mains: plain.days.map((d) => d.s[0].m + ':' + d.s[0].e).join(),
        backMains: back.days.map((d) => d.s[0].e).join(),
        name: plain.n, weeks: _.weeksOf(plain),
      };
    });
    t.ok('getting stronger with a barbell points at strength waves; both at powerbuilding', r.strength === 'waves' && r.both === 'power', r.strength + ' ' + r.both);
    t.ok('and never at a barbell program without a barbell', r.noBar !== 'waves' && r.noBar !== 'power', r.noBar);
    t.ok('four days: a squat, bench, deadlift and press day, each led by its lift',
      r.mains === 'squat:bb-squat,bench:bb-bench,dead:bb-dl,press:bb-ohp' && r.weeks === 4, r.mains + ' ' + r.weeks);
    t.ok('a back that hates bending gets a squat and a hip-hinge that spare it', !/bb-squat|bb-dl|bb-rdl/.test(r.backMains) && /hip-thrust/.test(r.backMains), r.backMains);

    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'waves', dpw: 4, kit: 'gym', lvl: 1, wave: 10, tm: { 'bb-squat': 300, 'bb-bench': 200 } });
      ms.id = 'wv';
      st.T.ms = { wv: ms }; st.T.act = 'wv'; st.T.wo = {};
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.wv;
      const sq = (w) => _.plan(m, w, 0).x[0].st;
      const out = { w1: sq(0), w2: sq(1), w3: sq(2), dl: sq(3), acc: _.plan(m, 0, 0).x[1] };
      // a realization week logged: squat 13 against 10, bench 8 against 10
      const now = Date.now(), D = 864e5;
      st.T.wo = {
        r0: { id: 'r0', st: now - 3 * D, u: 'lb', ms: 'wv', w: 2, d: 0, x: [{ e: 'bb-squat', s: [
          { w: 185, r: 5, wu: 1 }, { w: 215, r: 3, wu: 1 }, { w: 225, r: 13, am: 1, tr: 10 }] }], fb: {}, sr: {} },
        r1: { id: 'r1', st: now - 2 * D, u: 'lb', ms: 'wv', w: 2, d: 1, x: [{ e: 'bb-bench', s: [{ w: 150, r: 8, am: 1, tr: 10 }] }], fb: {}, sr: {} },
      };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      out.next = _.nextTm(_.state().T.ms.wv);
      out.rv = (_.review().checks.find((c) => c.t === 'Your all-out sets') || {}).b || '';
      out.hard = (_.review().rows.find((x) => x.k === 'quads') || {}).sets;
      return out;
    });
    t.ok('tens, week one: five sets of ten at sixty per cent of the training max',
      r.w1.length === 5 && r.w1.every((s) => s.tr === 10 && s.tw === 180 && !s.am), JSON.stringify(r.w1));
    t.ok('week two: three heavier sets', r.w2.length === 3 && r.w2.every((s) => s.tw === 205 && s.tr === 10), JSON.stringify(r.w2));
    t.ok('week three: two ramp sets, then one set for as many reps as you can',
      r.w3.length === 3 && r.w3[0].wu && r.w3[1].wu && r.w3[2].am && r.w3[2].tw === 225 && r.w3[2].tr === 10, JSON.stringify(r.w3));
    t.ok('then a deload of three light sets', r.dl.length === 3 && r.dl[2].tw === 180, JSON.stringify(r.dl));
    t.ok('the accessories stay steady at three sets', r.acc.sets === 3, JSON.stringify(r.acc));
    t.ok('three reps past the target move the squat max up three steps; two short take the bench down two',
      r.next['bb-squat'] === 315 && r.next['bb-bench'] === 195, JSON.stringify(r.next));
    t.ok('the review reads the all-out sets back against their targets', /Back Squat: 13 against 10 \(\+3\)/.test(r.rv) && /Barbell Bench Press: 8 against 10/.test(r.rv), r.rv);
    t.ok('and ramp sets are not counted as hard sets', r.hard === 1, r.hard);

    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'power', dpw: 4, kit: 'gym', lvl: 1 });
      ms.id = 'pw';
      const fb = {}; ms.days[0].s.forEach((s) => { fb[_.lib(s.e).m] = { p: 0, k: 0 }; });
      st.T.ms = { pw: ms }; st.T.act = 'pw';
      st.T.wo = { p0: { id: 'p0', st: Date.now() - 5 * 864e5, u: 'lb', ms: 'pw', w: 0, d: 0,
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 275, r: 6 }, { w: 235, r: 8 }, { w: 235, r: 8 }, { w: 235, r: 8 }] }], fb, sr: {} } };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const m = _.state().T.ms.pw;
      const p1 = _.plan(m, 1, 0);
      const acc = (w) => _.plan(m, w, 0).x.slice(1).reduce((n, x) => n + x.sets, 0);
      return { main: m.days.every((d) => !!d.s[0].m), st: p1.x[0].st, accUp: acc(1) - acc(0), mainSets: p1.x[0].sets };
    });
    t.ok('powerbuilding opens every day with a main lift', r.main);
    t.ok('six reps on the top set: next week it goes up a step, back to four, with three back-offs at 85%',
      r.st[0].tw === 280 && r.st[0].tr === 4 && r.st.slice(1).every((s) => s.tw === 240 && s.tr === 8) && r.mainSets === 4, JSON.stringify(r.st));
    t.ok('and a good week climbs the accessories, not the main lift', r.accUp > 0, r.accUp);

    // on the screen: a realization session, saved with its ramp and all-out sets
    await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'waves', dpw: 4, kit: 'gym', lvl: 1, wave: 10, tm: { 'bb-squat': 300 } });
      ms.id = 'wv2'; ms.sk = ['0:0', '0:1', '0:2', '0:3', '1:0', '1:1', '1:2', '1:3'];
      st.T.ms = { wv2: ms }; st.T.act = 'wv2'; st.T.wo = {}; st.T.pr.qz = Date.now();
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => document.querySelector('.tr-blk .tr-sub').textContent);
    t.ok('the block says which wave and which week it is', /10s wave, realization/.test(r), r);
    await p.click('[data-t="start"]');
    r = await p.evaluate(() => [...[...document.querySelectorAll('.tr-ex')][0].querySelectorAll('.tr-set:not(.tr-set-h) .tr-sn')].map((e) => e.textContent).join(','));
    t.ok('ramp sets are lettered W, as warm-ups, and the all-out set is marked', r === 'W,W,1+', r);
    for (let j = 0; j < 3; j++) {
      if (j === 2) await p.fill('#trr-0-2', '12');
      await p.click(`[data-t="tick"][data-x="0"][data-s="${j}"]`);
    }
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s.map((s) => s.w || '').join());
    await p.click('[data-t="finish"]');
    await p.click('#trainRoot [data-t="save"]');
    await p.waitForTimeout(150);
    r = await p.evaluate(() => Object.values(window.Train._.state().T.wo)[0].x[0].s);
    t.ok('each set took its own weight, and the save keeps which were ramps and which was all-out',
      r.map((s) => s.w).join() === '165,195,225' && r[0].wu && r[1].wu && r[2].am && r[2].tr === 10 && r[2].r === 12, JSON.stringify(r));
    await p.close();

    // ---- conditioning: circuits ------------------------------------------------------
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const top = (o) => _.recommend(_.defaultsPr(Object.assign({ qz: 1 }, o)))[0].id;
      const bad = [], hurt = [], kinds = [], long = [];
      Object.keys(_.KITS).forEach((kit) => [2, 3, 4, 5].forEach((dpw) => {
        const eq = _.KITS[kit].eq;
        const ms = _.build({ prog: 'cond', dpw, kit, lvl: 1, min: 40 });
        ms.days.forEach((d, i) => {
          if (!d.mc || d.mc.mv.length < 2) bad.push(kit + dpw + ' ' + d.n + ': no circuit');
          else d.mc.mv.forEach((m) => { if (eq.indexOf(_.MOVES[m.id].q) < 0) bad.push(kit + ' ' + m.id); });
          if (dpw === 3) kinds.push(d.mc.k);
          if (_.estDay(d) > 40) long.push(kit + dpw + ' ' + d.n + ' ' + _.estDay(d));
        });
        _.build({ prog: 'cond', dpw, kit, lvl: 1, jt: 'KAW', bk: 'f' }).days.forEach((d) => d.mc.mv.forEach((m) => {
          const mv = _.MOVES[m.id];
          if (/[KAW]/.test(mv.jt || '') || /F/.test(mv.bk || '')) hurt.push(kit + ' ' + m.id);
        }));
      }));
      return {
        bad, hurt, long, kinds: kinds.slice(0, 3).join(),
        sitter: top({ goal: 'health', lvl: 1, kit: 'gym', dpw: 3, day: 'desk' }),
        runner: top({ goal: 'health', lvl: 1, kit: 'gym', dpw: 3, hab: ['run', 'soccer'] }),
      };
    });
    t.ok('every day of a conditioning block ends in a circuit, from movements the kit allows', r.bad.length === 0, r.bad.slice(0, 5).join('; '));
    t.ok('the format turns over through the week: AMRAP, EMOM, rounds for time', r.kinds === 'amrap,emom,rft', r.kinds);
    t.ok('a session with its circuit still fits forty minutes', r.long.length === 0, r.long.join('; '));
    t.ok('protected knees, feet, wrists and back lose the movements that load them hard', r.hurt.length === 0, r.hurt.slice(0, 5).join(', '));
    t.ok('feeling better from a desk, with no hard cardio: the conditioning block comes first', r.sitter === 'cond', r.sitter);
    t.ok('but not for somebody who already runs and plays soccer', r.runner !== 'cond', r.runner);

    // the score to beat, and the minutes that count
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'cond', dpw: 3, kit: 'gym', lvl: 1, min: 40 });
      ms.id = 'cd';
      const now = Date.now(), D = 864e5;
      const c = ms.days[0].mc;
      const W = (id, ago, r, x) => ({ id, st: now - ago * D, u: 'lb', ms: 'cd', w: ago > 7 ? 0 : 1, d: 0, n: 'Day A',
        x: [{ e: ms.days[0].s[0].e, s: [{ w: 100, r: 8 }] }], fb: {}, sr: {}, mc: Object.assign({}, c, { r, x }) });
      st.T.ms = { cd: ms }; st.T.act = 'cd'; st.T.ax = {};
      st.T.wo = { c0: W('c0', 9, 6, 10), c1: W('c1', 2, 7, 3) };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const rv = _.review();
      const by = {}; rv.checks.forEach((k) => { by[k.t] = k.b; });
      return { k: c.k, circuits: by['Your circuits'], active: by['Active minutes, circuits included'],
        last: _.plan(_.state().T.ms.cd, 2, 0).mc.last };
    });
    t.ok('this week’s circuit is read against last week’s', r.k === 'amrap' && /7 rounds \+ 3, up from 6 rounds \+ 10/.test(r.circuits || ''), r.circuits);
    t.ok('and next week’s plan carries the score to beat', r.last && r.last.r === 7, JSON.stringify(r.last));
    t.ok('circuit minutes count as vigorous activity', /circuits in your workouts 10 min/.test(r.active || '') && /worth 20 moderate minutes/.test(r.active || ''), r.active);

    // on the screen: the clock, the score, the save
    await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'cond', dpw: 3, kit: 'gym', lvl: 1, min: 40 });
      ms.id = 'cd2';
      st.T.ms = { cd2: ms }; st.T.act = 'cd2'; st.T.wo = {}; st.T.pr.qz = Date.now();
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => (document.querySelector('.tr-next .tr-mcp') || {}).textContent || '');
    t.ok('the next session shows its circuit', /AMRAP 10 min/.test(r), r);
    await p.click('[data-t="start"]');
    await p.click('[data-t="mcgo"]');
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.mc.st -= 11 * 60000; });
    await p.waitForTimeout(1300);
    r = await p.evaluate(() => ({ en: !!window.Train._.state().LIVE.mc.en, clock: document.getElementById('trMcClock').textContent }));
    t.ok('an AMRAP stops itself at the time', r.en && r.clock === '0:00', JSON.stringify(r));
    await p.fill('[data-mc="r"]', '5');
    await p.fill('[data-mc="x"]', '7');
    await p.click('[data-t="finish"]');
    r = await p.evaluate(() => document.querySelector('#trainRoot').textContent);
    t.ok('finishing says the circuit’s score', /Circuit: 5 rounds \+ 7/.test(r), r.slice(0, 160));
    await p.click('#trainRoot [data-t="save"]');
    await p.waitForTimeout(150);
    r = await p.evaluate(() => Object.values(window.Train._.state().T.wo)[0]);
    t.ok('a workout that was only a circuit is still saved, with its score', r && r.mc && r.mc.r === 5 && r.mc.x === 7 && r.x.length === 0, JSON.stringify(r && r.mc));
    await p.close();

    // ---- the tab row: the household's, a rule, and yours --------------------------
    p = await t.fresh({ viewport: { width: 360, height: 740 } });
    r = await p.evaluate(() => {
      const t = document.querySelector('.tabs'), box = t.getBoundingClientRect();
      const tabs = [...t.querySelectorAll('.tab')].filter((b) => b.offsetParent);
      const sep = t.querySelector('.tab-sep');
      return {
        labels: tabs.map((b) => b.innerText.trim()).join('|'),
        off: tabs.filter((b) => b.getBoundingClientRect().right > box.right + 1).length,
        sepBefore: !!sep && sep.nextElementSibling === t.querySelector('.tab[data-view="macros"]'),
        noBookTab: !t.querySelector('.tab[data-view="book"]'),
      };
    });
    t.ok('the tabs are Today, Recipes and Plan (with List and Pantry as its steps), then Nourish and Strengthen', r.labels === 'Today|Recipes|Plan|Nourish|Strengthen', r.labels);
    t.ok('with a rule before yours, and every one on a 360px screen', r.sepBefore && r.off === 0, JSON.stringify(r));
    t.ok('and the book is no longer a tab', r.noBookTab);
    await p.click('.tab[data-view="browse"]');   // the book's button is on Recipes; the app opens on Today
    await p.click('#bookBtn');
    await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ book: !document.getElementById('view-book').classList.contains('hide'),
      lit: document.querySelector('.tab[aria-selected="true"]').dataset.view }));
    t.ok('it opens from Recipes, and Recipes stays lit while it is up', r.book && r.lit === 'browse', JSON.stringify(r));
    await p.close();

    // ---- feedback: tidy, and out of the way once answered or passed ---------------
    p = await t.fresh();
    await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ prog: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4 });
      ms.id = 'fbk';
      st.T.ms = { fbk: ms }; st.T.act = 'fbk'; st.T.wo = {}; st.T.pr.qz = Date.now();
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="start"]');
    const tickAll = async (xi) => {
      const n = await p.evaluate((xi) => window.Train._.state().LIVE.x[xi].s.length, xi);
      for (let j = 0; j < n; j++) {
        await p.fill(`#trw-${xi}-${j}`, '100'); await p.fill(`#trr-${xi}-${j}`, '10');
        await p.click(`[data-t="tick"][data-x="${xi}"][data-s="${j}"]`);
      }
    };
    // the first exercise whose muscle appears only once today
    const solo = await p.evaluate(() => {
      const L = window.Train._.state().LIVE, lib = window.Train._.lib;
      return L.x.findIndex((x) => L.x.filter((y) => lib(y.e).m === lib(x.e).m).length === 1);
    });
    const m = await p.evaluate((i) => window.Train._.lib(window.Train._.state().LIVE.x[i].e).m, solo);
    await tickAll(solo);
    r = await p.evaluate((m) => ({
      open: !!document.querySelector(`.tr-fbc [data-t="fb"][data-m="${m}"]`),
      even: [...document.querySelectorAll(`.tr-fbc .tr-sqb[data-m="${m}"][data-f="k"]`)].map((b) => Math.round(b.getBoundingClientRect().width)),
    }), m);
    t.ok('the feedback card asks with rows of equal buttons', r.open && r.even.length === 4 && new Set(r.even).size === 1, JSON.stringify(r));
    await p.click(`[data-t="fb"][data-m="${m}"][data-f="p"][data-v="1"]`);
    await p.click(`[data-t="fb"][data-m="${m}"][data-f="k"][data-v="1"]`);
    await p.click(`[data-t="fb"][data-m="${m}"][data-f="j"][data-v="0"]`);
    r = await p.evaluate((m) => ({ card: !!document.querySelector(`.tr-fbc [data-m="${m}"]`),
      line: (document.querySelector(`.tr-fbt[data-m="${m}"]`) || {}).textContent || '' }), m);
    t.ok('answered, it tucks into a line saying what you said', !r.card && /moderate pump/.test(r.line) && /workload about right/.test(r.line), r.line);
    await p.click(`.tr-fbt[data-m="${m}"]`);
    r = await p.evaluate((m) => !!document.querySelector(`.tr-fbc [data-m="${m}"]`), m);
    t.ok('and a tap opens it again', r);
    await p.click(`[data-t="fb"][data-m="${m}"][data-f="k"][data-v="2"]`);
    r = await p.evaluate((m) => ({ tucked: !!document.querySelector(`.tr-fbt[data-m="${m}"]`), k: window.Train._.state().LIVE.fb[m].k }), m);
    t.ok('changing an answer puts it away again', r.tucked && r.k === 2, JSON.stringify(r));
    // an unanswered card tucks once you move on
    const other = await p.evaluate((m) => {
      const L = window.Train._.state().LIVE, lib = window.Train._.lib;
      const a = L.x.findIndex((x) => lib(x.e).m !== m && L.x.filter((y) => lib(y.e).m === lib(x.e).m).length === 1);
      return a;
    }, m);
    const m2 = await p.evaluate((i) => window.Train._.lib(window.Train._.state().LIVE.x[i].e).m, other);
    await tickAll(other);
    r = await p.evaluate((m2) => !!document.querySelector(`.tr-fbc [data-m="${m2}"]`), m2);
    t.ok('an unanswered card is up while you rest', r);
    const third = await p.evaluate((ms) => {
      const L = window.Train._.state().LIVE, lib = window.Train._.lib;
      return L.x.findIndex((x) => ms.indexOf(lib(x.e).m) < 0);
    }, [m, m2]);
    await p.fill(`#trw-${third}-0`, '50'); await p.fill(`#trr-${third}-0`, '10');
    await p.click(`[data-t="tick"][data-x="${third}"][data-s="0"]`);
    r = await p.evaluate((m2) => ((document.querySelector(`.tr-fbt[data-m="${m2}"]`) || {}).textContent || ''), m2);
    t.ok('and tucks itself away once you tick a set of something else', /not rated yet/.test(r), r);
    await p.close();

    // ---- pairs are explained; the back is one choice among the rest --------------
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qz"][data-f="goal"][data-v="keep"]');
    await p.click('[data-t="qz"][data-f="lvl"][data-v="2"]');
    await p.click('[data-t="qz"][data-f="dpw"][data-v="2"]');
    await p.click('[data-t="qz"][data-f="min"][data-v="40"]');
    await p.click('[data-t="qzn"]');
    await p.click('[data-t="qz"][data-f="kit"][data-v="gym"]');
    r = await p.evaluate(() => ({ back: !!document.querySelector('[data-t="qzback"]'), triggers: !!document.querySelector('[data-f="bk"]') }));
    t.ok('the back is a choice beside the joints, with no back question until it is picked', r.back && !r.triggers, JSON.stringify(r));
    await p.click('[data-t="qzback"]');
    r = await p.evaluate(() => ({ triggers: document.querySelectorAll('[data-f="bk"]').length, unsure: !!document.querySelector('[data-t="qzbku"]') }));
    t.ok('picking it asks what sets it off, with a not-sure', r.triggers === 3 && r.unsure, JSON.stringify(r));
    await p.click('[data-t="qzn"]');
    r = await p.evaluate(() => window.Train._.state().S.qz.a.bk);
    t.ok('left unanswered, it plays safe and guards all three', r === 'fcx', r);
    await p.click('[data-t="qzn"]');
    await p.click('[data-t="qz"][data-f="age"][data-v=""]');
    await p.click('[data-t="prog"][data-v="keep"]');
    await p.click('[data-t="build"]');
    r = await p.evaluate(() => (document.querySelector('.tr-pairwhy') || {}).textContent || '');
    t.ok('and a block with pairs says what A1 and A2 mean, and why', /A1 and A2 are a pair/.test(r) && /on purpose/.test(r), r);
    await p.click('[data-t="begin"]');
    await p.click('[data-t="start"]');
    r = await p.evaluate(() => !!document.querySelector('.tr-pairwhy'));
    t.ok('and so does the block’s first workout', r);
    for (const xi of [0, 1]) {
      const n = await p.evaluate((xi) => window.Train._.state().LIVE.x[xi].s.length, xi);
      for (let j = 0; j < n; j++) {
        await p.fill(`#trw-${xi}-${j}`, '100'); await p.fill(`#trr-${xi}-${j}`, '8');
        await p.click(`[data-t="tick"][data-x="${xi}"][data-s="${j}"]`);
      }
    }
    r = await p.evaluate(() => {
      const L = window.Train._.state().LIVE, m = window.Train._.lib(L.x[0].e).m;
      return { pair: L.x[0].p && L.x[0].p === L.x[1].p, open: !!document.querySelector(`.tr-fbc [data-m="${m}"]`) };
    });
    t.ok('the other half of a pair does not put the first half’s card away', r.pair && r.open, JSON.stringify(r));
    await p.evaluate(() => {
      const _ = window.Train._, T = JSON.parse(localStorage.getItem('bsc.train')), L = _.state().LIVE, st = L.st - 2 * 864e5;
      T.wo.prev = { id: 'prev', st, en: st + 36e5, dk: '2026-01-01', n: 'W', u: 'lb', ms: L.ms, w: 0, d: 0, dl: 0, sr: {}, fb: {},
        x: [{ e: L.x[0].e, s: [{ w: 100, r: 8, t: st + 60e3 }] }] };
      localStorage.setItem('bsc.train', JSON.stringify(T));
      _.reload();
    });
    // full screen hides the app's tabs: the workout is made small to leave it
    await p.click('[data-t="minim"]');
    await p.click('.tab[data-view="macros"]');
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => ({ why: !!document.querySelector('.tr-pairwhy'), live: !!document.querySelector('.tr-live-h') }));
    t.ok('after the first workout the pairs go unexplained: known by then', r.live && !r.why, JSON.stringify(r));
    await p.close();
    // ---- for somebody who lifts every day and logs everything ------------
    /* A keeping block, two days of pairs, started: the quickest way to a
       live workout with a block behind it. */
    async function keepLive(p) {
      await p.click('.tab[data-view="train"]');
      await p.click('[data-t="qz"][data-f="goal"][data-v="keep"]');
      await p.click('[data-t="qz"][data-f="lvl"][data-v="2"]');
      await p.click('[data-t="qz"][data-f="dpw"][data-v="2"]');
      await p.click('[data-t="qz"][data-f="min"][data-v="0"]');
      await p.click('[data-t="qzn"]');
      await p.click('[data-t="qz"][data-f="kit"][data-v="gym"]');
      await p.click('[data-t="qzn"]');
      await p.click('[data-t="qzn"]');
      await p.click('[data-t="qz"][data-f="age"][data-v=""]');
      await p.click('[data-t="prog"][data-v="keep"]');
      await p.click('[data-t="build"]');
      await p.click('[data-t="begin"]');
      await p.click('[data-t="start"]');
      await p.waitForTimeout(100);
    }
    const otherOf = (p, xi) => p.evaluate((xi) => {
      const cur = window.Train._.state().LIVE.x[xi].e;
      return [...document.querySelectorAll('.tr-pick[data-e]')].map((b) => b.dataset.e).filter((e) => e !== cur)[0];
    }, xi);

    // a swap is for today unless you say the rest of the block
    p = await t.fresh();
    await keepLive(p);
    await p.click('[data-t="swap"][data-x="0"]');
    r = await p.evaluate(() => ({
      chips: [...document.querySelectorAll('[data-t="swsc"]')].map((b) => b.dataset.v + ':' + b.getAttribute('aria-pressed')).join(),
    }));
    t.ok('a swap in a block asks how long it is for, and starts at just today', r.chips === 'day:true,block:false', r.chips);
    r = await p.evaluate(() => { const cur = window.Train._.state().LIVE.x[0].e;
      return { self: !!document.querySelector(`.tr-pick[data-e="${cur}"]`), n: document.querySelectorAll('.tr-pick[data-e]').length }; });
    t.ok('the list to swap to leaves out the lift being swapped', !r.self && r.n > 0, JSON.stringify(r));
    await p.click('[data-t="pickm"][data-v=""]');
    await p.fill('#trPickQ', 'hip abductor');
    await p.waitForTimeout(50);
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-pick[data-e]')].map((b) => b.dataset.e).join());
    t.ok('a search goes word by word: "hip abductor" finds the Hip Abduction Machine', r.split(',').indexOf('abduct') >= 0, r);
    await p.fill('#trPickQ', '');
    await p.evaluate(() => { const c = window.Train._.state().LIVE.x[0].e; document.querySelector(`[data-t="pickm"][data-v="${window.Train._.lib(c).m}"]`).click(); });
    await p.waitForTimeout(50);
    let to = await otherOf(p, 0);
    const before = await p.evaluate(() => { const s = window.Train._.state(); return s.T.ms[s.LIVE.ms].days[s.LIVE.d].s.map((x) => x.e).join(); });
    await p.click(`.tr-pick[data-e="${to}"]`);
    r = await p.evaluate(() => { const s = window.Train._.state(); return { now: s.LIVE.x[0].e, plan: s.T.ms[s.LIVE.ms].days[s.LIVE.d].s.map((x) => x.e).join() }; });
    t.ok('just today changes today and leaves the block as it was', r.now === to && r.plan === before, JSON.stringify(r));
    await p.click('[data-t="swap"][data-x="1"]');
    await p.click('[data-t="swsc"][data-v="block"]');
    r = await p.evaluate(() => (document.querySelector('.tr-swsc .tr-hint') || {}).textContent || '');
    t.ok('the rest of the block says what it will do', /every week from now on/.test(r), r);
    to = await otherOf(p, 1);
    const was1 = await p.evaluate(() => window.Train._.state().LIVE.x[1].e);
    await p.click(`.tr-pick[data-e="${to}"]`);
    r = await p.evaluate((was) => { const s = window.Train._.state(); const d = s.T.ms[s.LIVE.ms].days[s.LIVE.d].s.map((x) => x.e); return { has: d.indexOf(s.LIVE.x[1].e) >= 0, gone: d.indexOf(was) < 0 }; }, was1);
    t.ok('the rest of the block puts the new one in the plan', r.has && r.gone, JSON.stringify(r));
    // swapped for today, then that one swapped for good: the plan's own exercise is what goes
    const orig0 = before.split(',')[0];
    await p.click('[data-t="swap"][data-x="0"]');
    await p.click('[data-t="swsc"][data-v="block"]');
    to = await p.evaluate((skip) => {
      const cur = window.Train._.state().LIVE.x[0].e;
      return [...document.querySelectorAll('.tr-pick[data-e]')].map((b) => b.dataset.e).filter((e) => e !== cur && e !== skip)[0];
    }, orig0);
    await p.click(`.tr-pick[data-e="${to}"]`);
    r = await p.evaluate(() => { const s = window.Train._.state(); return s.T.ms[s.LIVE.ms].days[s.LIVE.d].s.map((x) => x.e); });
    t.ok('a second swap, for the rest of the block, replaces what the plan had, not today’s stand-in', r[0] === to && r.indexOf(orig0) < 0, JSON.stringify({ r, orig0, to }));

    // under a lift, every option in one row, with its word; a handle in its corner
    r = await p.evaluate(() => {
      const c = document.querySelectorAll('.tr-ex')[0], bs = [...c.querySelectorAll('.tr-ex-a button')];
      return { ts: bs.map((b) => b.dataset.t), rows: new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top))).size,
        words: bs.every((b) => { const w = b.querySelector('span'); return !!w && !!w.textContent.trim() && getComputedStyle(w).display !== 'none'; }),
        first: bs[0] && bs[0].dataset.t, grip: !!c.querySelector('.tr-grip'), old: !!c.querySelector('.tr-mv, .tr-ex > .tr-addset') };
    });
    t.ok('under a lift: Set, Swap, a note and Remove, in view', ['addset', 'swap', 'note', 'rmex'].every((k) => r.ts.indexOf(k) >= 0), r.ts.join());
    t.ok('all of them on one row, each with its word, adding a set first', r.rows === 1 && r.words && r.first === 'addset', JSON.stringify(r));
    t.ok('a handle to move it, and no arrows or a second add-set row left behind', r.grip && !r.old, JSON.stringify(r));
    await p.setViewportSize({ width: 320, height: 700 });
    r = await p.evaluate(() => {
      const bs = [...document.querySelectorAll('.tr-ex')[0].querySelectorAll('.tr-ex-a button')];
      return { rows: new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top))).size, w: Math.min(...bs.map((b) => b.getBoundingClientRect().width)),
        words: bs.some((b) => { const w = b.querySelector('span'); return w && getComputedStyle(w).display !== 'none'; }) };
    });
    t.ok('on the narrowest phone the row holds, as icons alone', r.rows === 1 && !r.words && r.w >= 30, JSON.stringify(r));
    await p.setViewportSize({ width: 1100, height: 900 });

    // moving an exercise, pairs together: the arrow keys on the handle
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE; return { es: L.x.map((x) => x.e), ps: L.x.map((x) => x.p || 0) }; });
    const order0 = r;
    await p.focus('.tr-ex[data-xi="0"] .tr-grip');
    await p.keyboard.press('ArrowUp');
    r = await p.evaluate(() => window.Train._.state().LIVE.x.map((x) => x.e));
    t.ok('the first exercise cannot move up', r.join() === order0.es.join(), r.join());
    await p.keyboard.press('ArrowDown');
    r = await p.evaluate(() => ({ es: window.Train._.state().LIVE.x.map((x) => x.e),
      focus: document.activeElement && document.activeElement.classList.contains('tr-grip') ? +document.activeElement.dataset.x : -1 }));
    const paired = order0.ps[0] && order0.ps[0] === order0.ps[1];
    t.ok('moving down swaps it past the next exercise, and a pair moves as one',
      paired ? r.es[0] === order0.es[2] && r.es.indexOf(order0.es[0]) + 1 === r.es.indexOf(order0.es[1]) : r.es[1] === order0.es[0], JSON.stringify({ was: order0.es, now: r.es }));
    t.ok('and the handle stays in hand, on the card it moved', r.focus >= 0 && r.es[r.focus] === order0.es[0], JSON.stringify(r));
    /* and where it went is said: the handle is drawn again under the focus,
       so a screen reader heard only the button's own label, the same at
       every place */
    await p.waitForFunction(() => /moved to/.test((document.getElementById('trSay') || {}).textContent || ''), null, { timeout: 2000 }).catch(() => {});
    r = await p.evaluate((e) => { const el = document.getElementById('trSay');
      return { say: el ? el.textContent : '', status: !!el && el.getAttribute('role') === 'status' && el.classList.contains('sr-only') && !el.closest('#trBody'), name: window.Train._.lib(e).n }; }, order0.es[0]);
    {
      let groups = 0;
      for (let j = 0; j < order0.es.length; j++) { groups++; if (order0.ps[j] && order0.ps[j + 1] === order0.ps[j]) j++; }
      const want = r.name + (paired ? ' and its pair' : '') + ' moved to 2 of ' + groups;
      t.ok('and the move is said out loud, from a status line that is always there: "' + want + '"', r.status && r.say === want, JSON.stringify(r));
    }
    r = await p.evaluate(() => JSON.parse(localStorage.getItem('sh.trainLive')).x.map((x) => x.e));
    t.ok('and the new order is kept if the page goes away', r[0] !== order0.es[0], r.join());

    // hold the handle: every card folds to its name, and it is dragged where it goes
    const drag = await p.evaluate(() => {
      const L = window.Train._.state().LIVE, es = L.x.map((x) => x.e);
      const last = document.querySelectorAll('.tr-ex[data-xi]'), g = document.querySelector('.tr-ex[data-xi="' + (L.x.length - 1) + '"] .tr-grip');
      g.scrollIntoView({ block: 'center' });
      const a = g.getBoundingClientRect();
      return { es, n: last.length, x: a.left + a.width / 2, y: a.top + a.height / 2 };
    });
    await p.mouse.move(drag.x, drag.y);
    await p.mouse.down();
    // a hold with no movement at all: FAST=1 cuts short waits, so wait for the fold itself
    await p.waitForFunction(() => document.getElementById('view-train').classList.contains('tr-reo'), null, { timeout: 2000 }).catch(() => {});
    r = await p.evaluate(() => {
      const v = document.getElementById('view-train'), cs = [...document.querySelectorAll('.tr-ex')];
      return { on: v.classList.contains('tr-reo'), held: document.querySelectorAll('.tr-ex.tr-held').length,
        tall: Math.max(...cs.map((c) => c.getBoundingClientRect().height)), sets: cs.some((c) => c.querySelector('.tr-set') && c.querySelector('.tr-set').offsetParent) };
    });
    t.ok('held, the cards fold to one row each with the held one lifted', r.on && r.held >= 1 && r.tall < 90 && !r.sets, JSON.stringify(r));
    const top = await p.evaluate(() => { const c = document.querySelector('.tr-ex[data-xi="0"]').getBoundingClientRect(); return c.top + 4; });
    await p.mouse.move(drag.x, Math.max(80, top), { steps: 12 });
    await p.waitForTimeout(120);
    await p.mouse.up();
    r = await p.evaluate(() => ({ es: window.Train._.state().LIVE.x.map((x) => x.e), on: document.getElementById('view-train').classList.contains('tr-reo'),
      kept: JSON.parse(localStorage.getItem('sh.trainLive')).x.map((x) => x.e) }));
    const lastE = drag.es[drag.es.length - 1];
    t.ok('let go at the top, the last exercise is first, and the cards open again', r.es[0] === lastE || r.es[1] === lastE, JSON.stringify({ was: drag.es, now: r.es }));
    t.ok('the list unfolds and the new order is kept', !r.on && r.kept.join() === r.es.join(), JSON.stringify(r));
    t.ok('nothing is lost or doubled by a drag', r.es.slice().sort().join() === drag.es.slice().sort().join(), r.es.join());
    // a drag that never hears its pointerup (the app sent to the background) ends where it began
    {
      const before = await p.evaluate(() => window.Train._.state().LIVE.x.map((x) => x.e).join());
      const g = await p.evaluate(() => { const b = document.querySelector('.tr-ex[data-xi="1"] .tr-grip'); b.scrollIntoView({ block: 'center' }); const a = b.getBoundingClientRect(); return { x: a.left + a.width / 2, y: a.top + a.height / 2 }; });
      await p.mouse.move(g.x, g.y);
      await p.mouse.down();
      await p.waitForFunction(() => document.getElementById('view-train').classList.contains('tr-reo'), null, { timeout: 2000 }).catch(() => {});
      await p.mouse.move(g.x, g.y + 140, { steps: 6 });
      await p.evaluate(() => window.dispatchEvent(new Event('blur')));
      r = await p.evaluate(() => ({ on: document.getElementById('view-train').classList.contains('tr-reo'), es: window.Train._.state().LIVE.x.map((x) => x.e).join(),
        held: document.querySelectorAll('.tr-held').length }));
      await p.mouse.up();
      t.ok('a drag cut short by leaving the app unfolds, moves nothing, and draws again', !r.on && r.held === 0 && r.es === before, JSON.stringify({ r, before }));
    }
    /* On a phone: the handle sits on the left, away from the right thumb that
       scrolls, and a swipe that starts on it scrolls the page. Blake: "when I
       scroll I accidentally grab that and start moving exercises around".
       Only a hold picks a lift up. Real touches, through the browser's own
       input, so the page's scrolling is the browser's and not a stand-in. */
    {
      const q = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await keepLive(q);
      r = await q.evaluate(() => {
        const c = document.querySelector('.tr-ex[data-xi="1"]'), cr = c.getBoundingClientRect();
        const gr = c.querySelector('.tr-grip').getBoundingClientRect(), nr = c.querySelector('.tr-ex-n').getBoundingClientRect();
        return { fromLeft: Math.round(gr.left - cr.left), fromRight: Math.round(cr.right - gr.right), gripEnd: Math.round(gr.right), name: Math.round(nr.left), w: Math.round(gr.width) };
      });
      t.ok('the handle sits at the left of the card, clear of the name, still a 44px target',
        r.fromLeft <= 8 && r.fromRight > 200 && r.gripEnd <= r.name + 1 && r.w >= 44, JSON.stringify(r));
      const cdp = await q.context().newCDPSession(q);
      const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      // a swipe leaves the page coasting: wait for it to stop before the next touch, or the finger lands on another card
      const still = () => q.waitForFunction(() => new Promise((ok) => { const y = window.scrollY; setTimeout(() => ok(window.scrollY === y), 120); }), null, { timeout: 4000 }).catch(() => {});
      const at = async (xi) => {
        await still();
        await q.evaluate((xi) => document.querySelector('.tr-ex[data-xi="' + xi + '"] .tr-grip').scrollIntoView({ block: 'center' }), xi);
        await still();
        return q.evaluate((xi) => {
          const a = document.querySelector('.tr-ex[data-xi="' + xi + '"] .tr-grip').getBoundingClientRect();
          return { x: a.left + a.width / 2, y: a.top + a.height / 2, sy: window.scrollY, es: window.Train._.state().LIVE.x.map((x) => x.e) };
        }, xi);
      };
      const g1 = await at(1);
      await touch('touchStart', g1.x, g1.y);
      for (let k = 1; k <= 8; k++) await touch('touchMove', g1.x, g1.y - k * 20);
      const mid = await q.evaluate(() => document.getElementById('view-train').classList.contains('tr-reo'));
      await touch('touchEnd');
      await still();
      r = await q.evaluate(() => ({ on: document.getElementById('view-train').classList.contains('tr-reo'), sy: Math.round(window.scrollY),
        es: window.Train._.state().LIVE.x.map((x) => x.e).join() }));
      t.ok('a swipe that starts on the handle scrolls the page and moves nothing',
        !mid && !r.on && r.es === g1.es.join() && r.sy > g1.sy + 40, JSON.stringify({ mid, r, was: { sy: Math.round(g1.sy), es: g1.es.join() } }));
      const n = g1.es.length, g2 = await at(n - 1);
      await touch('touchStart', g2.x, g2.y);
      await q.waitForFunction(() => document.getElementById('view-train').classList.contains('tr-reo'), null, { timeout: 2000 }).catch(() => {});
      const held = await q.evaluate(() => document.getElementById('view-train').classList.contains('tr-reo'));
      const top = await q.evaluate(() => document.querySelector('.tr-ex[data-xi="0"]').getBoundingClientRect().top + 4);
      const goTo = Math.max(90, top);
      for (let k = 1; k <= 12; k++) await touch('touchMove', g2.x, g2.y + (goTo - g2.y) * k / 12);
      await q.waitForTimeout(150);
      await touch('touchEnd');
      await q.waitForTimeout(100);
      r = await q.evaluate(() => ({ on: document.getElementById('view-train').classList.contains('tr-reo'), es: window.Train._.state().LIVE.x.map((x) => x.e) }));
      const lastE = g2.es[n - 1];
      t.ok('held still, the handle picks the lift up, and the finger drags it to the top',
        held && !r.on && (r.es[0] === lastE || r.es[1] === lastE) && r.es.slice().sort().join() === g2.es.slice().sort().join(), JSON.stringify({ held, was: g2.es, now: r.es }));
      /* A hold let go without moving is a tap to the browser, and its click
         came after the redraw, landing on whatever was under the thumb by
         then: a set's type sheet, once Discard. */
      const g3 = await at(1);
      await touch('touchStart', g3.x, g3.y);
      await q.waitForFunction(() => document.getElementById('view-train').classList.contains('tr-reo'), null, { timeout: 2000 }).catch(() => {});
      const held3 = await q.evaluate(() => document.getElementById('view-train').classList.contains('tr-reo'));
      await touch('touchEnd');
      await q.waitForTimeout(400);
      r = await q.evaluate(() => ({ on: document.getElementById('view-train').classList.contains('tr-reo'), sheet: !!window.Train._.state().S.sheet,
        dialog: !!document.querySelector('[role="dialog"]'), es: window.Train._.state().LIVE.x.map((x) => x.e).join() }));
      t.ok('a hold let go without moving lifts and drops the card, and nothing else: no sheet, no dialog, nothing moved',
        held3 && !r.on && !r.sheet && !r.dialog && r.es === g3.es.join(), JSON.stringify({ held3, r }));
      await q.close();
    }

    // a note that follows the exercise
    const e0 = await p.evaluate(() => window.Train._.state().LIVE.x[0].e);
    await p.click(`.tr-ex-a [data-t="note"][data-e="${e0}"]`);
    await p.fill('#trNoteT', '  Seat 4.   Handles at the second notch. ');
    await p.click('[data-t="notesave"]');
    r = await p.evaluate((e) => {
      const s = window.Train._.state(), k = window.Train._.ntKey(e);
      return { v: s.T.nt[k], stamped: s.TS.nt[k] > 0, card: (document.querySelector('.tr-ex .tr-exnt') || {}).textContent || '',
        sync: JSON.stringify(window.Train._.payload(true).nt || {}) };
    }, e0);
    t.ok('a note on an exercise is kept, tidied, and stamped to sync',
      r.v && r.v.e === e0 && r.v.t === 'Seat 4. Handles at the second notch.' && r.stamped && /second notch/.test(r.sync), JSON.stringify(r));
    t.ok('and shows on its card', /Seat 4/.test(r.card), r.card);
    r = await p.evaluate(() => {
      const ids = window.Train._.LIB_LIST.map((x) => window.Train._.ntKey(x.id));
      return ids.length === new Set(ids).size;
    });
    t.ok('no two library exercises share a note key', r);

    // effort, set by set, when asked for: settings are behind the chevron while a workout is full screen
    await openSettings(p);
    await p.click('[data-t="s-rq"][data-v="1"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => document.querySelectorAll('.tr-ex .tr-rqs').length);
    t.ok('turned on, every set has a reps-in-reserve box', r > 0, r);
    await p.selectOption('[data-in="q"][data-x="0"][data-s="0"]', '2');
    const n0 = await p.evaluate(() => window.Train._.state().LIVE.x[0].s.length);
    for (let j = 0; j < n0; j++) {
      await p.fill(`#trw-0-${j}`, '100'); await p.fill(`#trr-0-${j}`, '10');
      await p.click(`[data-t="tick"][data-x="0"][data-s="${j}"]`);
    }
    await p.click('[data-t="finish"]');
    await p.fill('#trWoNt', 'Slept badly. Knee fine.');
    await p.click('[data-t="save"]');
    await p.click('.tr-done [data-t="close"]');
    r = await p.evaluate((e) => {
      const s = window.Train._.state(), w = Object.values(s.T.wo)[0];
      return { q: w.x[0].s[0].q, q1: w.x[0].s[1] && w.x[0].s[1].q, pq: w.x[0].pq, nt: w.nt, plan: (document.querySelector('.tr-next') || {}).textContent || '' };
    }, e0);
    t.ok('a set said to have two in reserve is saved so; one not said stays blank', r.q === 2 && r.q1 === undefined, JSON.stringify(r));
    t.ok('with what the plan asked beside it', typeof r.pq === 'number', r.pq);
    t.ok('and the note on the workout is saved with it', r.nt === 'Slept badly. Knee fine.', r.nt);
    await openWorkouts(p);
    r = await p.evaluate(() => (document.querySelector('.tr-h-nt') || {}).textContent || '');
    t.ok('History shows the note', /Slept badly/.test(r), r);
    await p.close();

    // the review grades effort once it is said
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state(), now = Date.now();
      const W = (id, ago, x) => ({ id, st: now - ago * 864e5, u: 'lb', ms: '', w: -1, d: -1, x });
      const q = (qs, pq) => ({ e: 'bb-bench', pq, s: qs.map((v, i) => ({ w: 185, r: 8, q: v, t: now - 2 * 864e5 + i * 200e3 })) });
      const grade = (x) => {
        st.T.wo = { a: W('a', 2, x) }; st.T.act = '';
        localStorage.setItem('bsc.train', JSON.stringify(st.T)); _.reload();
        return _.review(now).checks.filter((c) => c.t === 'How close to failure')[0];
      };
      return { far: grade([q([4, 4, 5, 4, 4, 5])]), near: grade([q([2, 2, 1, 2, 2, 2], 2)]), over: grade([q([0, 0, 0, 0, 0, 0], 2)]),
        few: grade([q([2, 2], 2)]) };
    });
    t.ok('four and five in reserve, with no plan, is further from failure than the growth was', r.far.st === 'look' && /4\.5 reps to spare/.test(r.far.b), r.far.b);
    t.ok('about the two asked for is on target', r.near.st === 'good' && /On target/.test(r.near.b), r.near.b);
    t.ok('none left where two were asked is flagged as closer than planned', r.over.st === 'look' && /Closer to failure than planned/.test(r.over.b), r.over.b);
    t.ok('two sets is not enough to grade', r.few.st === 'info', r.few.b);
    await p.close();

    // correcting a saved workout
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {},
      wo: { old: wo('old', '', -1, -1, 9, [{ e: 'bb-bench', s: sets(180, [8, 8]) }]),
        fix: wo('fix', '', -1, -1, 2, [{ e: 'bb-bench', s: sets(185, [8, 8]) }, { e: 'db-curl', s: sets(30, [12]) }]) } });
    await openWorkouts(p);
    await p.click('[data-t="wosheet"][data-id="fix"]');
    await p.click('[data-t="edopen"]');
    r = await p.evaluate(() => document.querySelectorAll('[data-ed="w"]').length);
    t.ok('Edit opens the workout as boxes, set by set', r === 3, r);
    await p.fill('[data-ed="w"][data-x="0"][data-s="0"]', '195');
    await p.click('[data-t="edrm"][data-x="0"][data-s="1"]');
    await p.click('[data-t="edadd"][data-x="0"]');
    await p.fill('#trEdNt', 'Typo fixed');
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => {
      const s = window.Train._.state(), w = s.T.wo.fix;
      return { s: w.x[0].s.map((z) => z.w + 'x' + z.r + (z.t ? 't' : '')).join(), ed: w.ed > 0, stamp: s.TS.wo.fix > 0, nt: w.nt,
        prs: window.Train._.prsIn(w).length, sub: (document.querySelector('.tr-sheet .tr-sub') || {}).textContent || '' };
    });
    t.ok('the weight is corrected, the set taken out is gone, the set added copies the last',
      r.s === '195x8t,195x8', r.s);
    t.ok('and it is stamped, so the other phone takes the correction', r.ed && r.stamp, JSON.stringify(r));
    t.ok('the records follow: 195 is now a record over the 180 before', r.prs >= 1, r.prs);
    t.ok('and it says it was edited', /edited/.test(r.sub) && r.nt === 'Typo fixed', r.sub);
    await p.click('[data-t="edopen"]');
    await p.click('[data-t="edrmx"][data-x="1"]');
    await p.click('[data-t="edrmx"][data-x="0"]');
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => ({ err: (document.querySelector('.tr-sheet .tr-warn') || {}).textContent || '', left: window.Train._.state().T.wo.fix.x.length }));
    t.ok('emptying a workout is refused, and says to delete it instead', /delete it/.test(r.err) && r.left === 2, JSON.stringify(r));
    await p.click('[data-t="edcancel"]');
    await p.click('[data-t="edopen"]');
    await p.fill('[data-ed="r"][data-x="1"][data-s="0"]', '');
    await p.click('[data-t="edaddx"]');
    await p.click('.tr-pick[data-e="hammer"]');
    await p.fill('[data-ed="w"][data-x="2"][data-s="0"]', '25');
    await p.fill('[data-ed="r"][data-x="2"][data-s="0"]', '10');
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => window.Train._.state().T.wo.fix.x.map((x) => x.e + ':' + x.s.length).join());
    t.ok('a forgotten exercise can be added, and one left with no reps drops out', r === 'bb-bench:2,hammer:1', r);
    await p.close();

    // every day: six lifting days and an easy one
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await answer(p, { goal: 'muscle', lvl: 1, dpw: 7, min: 0 });
    r = await p.evaluate(() => window.Train._.state().T.pr.dpw);
    t.ok('seven days a week is an answer', r === 7, r);
    await p.click('[data-t="prog"][data-v="grow"]');
    r = await p.evaluate(() => ({ o: window.Train._.state().S.opt, on: (document.querySelector('[data-t="o-ez"][aria-pressed="true"]') || {}).dataset }));
    t.ok('and the program starts at six lifting days with an easy day', r.o.dpw === 6 && r.o.ez === 1 && r.on && r.on.v === '1', JSON.stringify(r.o));
    await p.click('[data-t="build"]');
    r = await p.evaluate(() => { const d = window.Train._.state().S.draft; return { n: d.days.length, last: d.days[6], name: d.n, shown: /No lifting/.test(document.querySelector('.tr-dday.tr-ez').textContent) }; });
    t.ok('the block has the easy day last, asking for no sets', r.n === 7 && r.last.ez === 1 && r.last.s.length === 0 && /\+ easy/.test(r.name) && r.shown, JSON.stringify(r));
    await p.close();

    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const ms = _.build({ prog: 'keep', dpw: 2, ez: 1, kit: 'gym', lvl: 1 });
      ms.at = Date.now(); ms.st = '2026-01-01';
      return ms;
    });
    const msE = r;
    await seed(p, { pr: { qz: 1, hab: ['golfw'] }, act: msE.id, ms: { [msE.id]: msE }, cx: {}, ax: {},
      wo: { a: wo('a', msE.id, 0, 0, 2, [{ e: msE.days[0].s[0].e, s: sets(100, [10]) }]),
        b: wo('b', msE.id, 0, 1, 1, [{ e: msE.days[1].s[0].e, s: sets(100, [10]) }]) } });
    // opened after the log is in, so it opens on the block rather than the quiz
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => ({ card: (document.querySelector('.tr-next.tr-ez') || {}).textContent || '', start: !!document.querySelector('.tr-next [data-t="start"]') }));
    t.ok('after the lifting days, next is the easy day, with no workout to start', /Easy day/.test(r.card) && /golf/i.test(r.card) && !r.start, r.card);
    await p.click('.tr-next [data-t="eznew"]');
    r = await p.evaluate(() => window.Train._.state().S.sheet);
    t.ok('logging it starts from your own activity', r.k === 'axnew' && r.h === 'golfw' && r.ez && r.ez.d === 2, JSON.stringify(r));
    await p.click('[data-t="axk"][data-v="walk"]');
    await p.click('[data-t="axsave"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="gridopen"][aria-expanded="false"]'); if (b) b.click(); });
    r = await p.evaluate((id) => {
      const _ = window.Train._, s = _.state(), a = Object.values(s.T.ax)[0], ms = s.T.ms[id];
      return { a, nx: _.nextSlot(ms), cell: (document.querySelector('.tr-gc[data-w="0"][data-d="2"]') || {}).textContent || '' };
    }, msE.id);
    t.ok('the walk is counted as week one’s easy day', r.a.ms === msE.id && r.a.w === 0 && r.a.d === 2 && /✓/.test(r.cell), JSON.stringify(r.a));
    t.ok('and the next session is week two’s first', r.nx && r.nx.w === 1 && r.nx.d === 0, JSON.stringify(r.nx));
    r = await p.evaluate(() => window.Train._.review().label);
    t.ok('the review reads week one as whole without waiting on the easy day', /Week 1/.test(r), r);
    // an activity already logged today can be the easy day
    await seed(p, { pr: { qz: 1 }, act: msE.id, ms: { [msE.id]: msE }, cx: {},
      ax: { z: { id: 'z', st: Date.now(), k: 'swim', min: 30, lv: 'm' } },
      wo: { a: wo('a', msE.id, 0, 0, 2, [{ e: msE.days[0].s[0].e, s: sets(100, [10]) }]),
        b: wo('b', msE.id, 0, 1, 1, [{ e: msE.days[1].s[0].e, s: sets(100, [10]) }]) } });
    await openWorkouts(p);
    await p.click('[data-t="sub"][data-v="block"]');
    await p.click('.tr-next [data-t="ezlink"]');
    r = await p.evaluate(() => window.Train._.state().T.ax.z);
    t.ok('today’s swim, logged before, can be counted as it', r.ms === msE.id && r.d === 2, JSON.stringify(r));
    await p.close();

    // from Strong
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    const ts = (ago, h) => { const d = new Date(Date.now() - ago * DAY); d.setHours(h, 0, 0, 0);
      const z = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(h)}:00:00`; };
    const dA = ts(20, 7), dB = ts(18, 18);
    const csv = [
      'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
      `"${dA}","Push Day","1h 5m","Bench Press (Barbell)","W","95","10","0","0","","Felt good, slept 8h",""`,
      `"${dA}","Push Day","1h 5m","Bench Press (Barbell)","1","185","8","0","0","","Felt good, slept 8h","8"`,
      `"${dA}","Push Day","1h 5m","Bench Press (Barbell)","2","185","7","0","0","","Felt good, slept 8h","9"`,
      `"${dA}","Push Day","1h 5m","Bench Press (Barbell)","Rest Timer","0","0","0","120","","",""`,
      `"${dA}","Push Day","1h 5m","Triceps Pushdown (Cable - Straight Bar)","1","50","12","0","0","rope, not bar","Felt good, slept 8h",""`,
      `"${dA}","Push Day","1h 5m","Zottman Curl (Dumbbell)","1","25","10","0","0","","",""`,
      `"${dA}","Push Day","1h 5m","Plank","1","0","0","0","60","","",""`,
      `"${dB}","Legs","50m","Squat (Barbell)","1","225","5","0","0","","",""`,
      `"${dB}","Legs","50m","Squat (Barbell)","2","225","5","0","0","","",""`,
      `"${dB}","Legs","50m","Running","1","0","0","3.1","1800","","",""`,
      `"${dB}","Legs","50m","Lying Leg Curl (Machine)","1","90","12","0","0","","",""`,
    ].join('\r\n');
    r = await p.evaluate((csv) => {
      const G = window.Train._.sgParse(csv);
      const push = G.wos[0];
      return { n: G.wos.length, skipped: G.skipped, names: G.names.map((n) => n.nm + '=' + (n.e || 'own:' + n.m)).join('|'),
        bench: push.x[0].s.map((s) => s.w + 'x' + s.r + (s.wu ? 'W' : '') + (s.q !== undefined ? '@' + s.q : '')).join(),
        dur: push.dur, nt: push.nt.join(' / ') };
    }, csv);
    t.ok('a Strong export reads as its workouts, leaving out timed, distance and rest-timer rows', r.n === 2 && r.skipped === 3, JSON.stringify(r));
    t.ok('warm-ups stay warm-ups, and RPE becomes reps in reserve', r.bench === '95x10W,185x8@2,185x7@1', r.bench);
    t.ok('Strong’s lifts match the library, and a lift it has not got comes in as yours, its muscle guessed',
      /Bench Press \(Barbell\)=bb-bench/.test(r.names) && /Triceps Pushdown \(Cable - Straight Bar\)=pushdown/.test(r.names) &&
      /Squat \(Barbell\)=bb-squat/.test(r.names) && /Lying Leg Curl \(Machine\)=lying-curl/.test(r.names) &&
      /Zottman Curl \(Dumbbell\)=own:biceps/.test(r.names), r.names);
    t.ok('the length and the notes come too, the note with its comma intact', r.dur === 65 * 60e3 && /Felt good, slept 8h/.test(r.nt) && /rope, not bar/.test(r.nt), JSON.stringify(r));
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const old = _.sgParse('Date;Workout Name;Exercise Name;Set Order;Weight;Weight Unit;Reps;RPE;Distance;Distance Unit;Seconds;Notes;Workout Notes;Workout Duration\n' +
        '2019-03-02 09:00:00;Upper;Overhead Press (Barbell);1;40;kg;5;;;;;;;45m\n');
      return { unit: old.unit, fixed: old.fixedUnit, e: old.names[0].e, bad: _.sgParse('a,b\n1,2').need,
        m: ['Leg Curl (Machine)', 'Cable Fly Crossover', 'Chest Press (Hammer Strength)', 'Face Pull (Cable)'].map((n) => _.sgMatch(n) || _.sgGuess(n).m).join() };
    });
    t.ok('the older, semicolon export with its own unit column reads too', r.unit === 'kg' && r.fixed && r.e === 'bb-ohp', JSON.stringify(r));
    t.ok('a file from no app it knows asks you to match its columns', r.bad === 'map', r.bad);
    t.ok('guesses go most particular first: a leg curl is hamstrings, not biceps', r.m === 'hams,chest,chest,face-pull', r.m);
    await openSettings(p);
    await p.setInputFiles('#trStrong', { name: 'strong.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ title: (document.querySelector('.tr-sheet .sheet-name') || {}).textContent, go: (document.querySelector('[data-t="sggo"]') || {}).textContent || '',
      unit: !!document.querySelector('[data-t="sgu"]') }));
    t.ok('choosing the file shows what came in before anything is kept', r.title === 'From Strong' && /Bring in 2 workouts/.test(r.go) && r.unit, JSON.stringify(r));
    await p.click('[data-t="sgu"][data-v="kg"]');
    await p.click('[data-t="sgu"][data-v="lb"]');
    await p.click('[data-t="sggo"]');
    r = await p.evaluate(() => {
      const _ = window.Train._, s = _.state();
      const wos = Object.values(s.T.wo), own = Object.values(s.T.cx);
      return { n: wos.length, im: wos.every((w) => w.im === 's'), own: own.map((c) => c.n + ':' + c.m).join(), sub: s.S.sub,
        banner: (document.querySelector('.tr-sgdone') || {}).textContent || '',
        stamped: wos.every((w) => s.TS.wo[w.id] > 0),
        prev: _.target(_.lib('bb-bench'), null, 0, 0, false).prev.map((z) => z.w + 'x' + z.r).join() };
    });
    t.ok('bringing it in keeps both workouts, marked as from Strong, and stamped to sync', r.n === 2 && r.im && r.stamped, JSON.stringify(r));
    t.ok('the lift the library lacked is yours now', r.own === 'Zottman Curl (Dumbbell):biceps', r.own);
    t.ok('History says what came in', r.sub === 'history' && /Brought in 2 workouts from Strong/.test(r.banner), r.banner);
    t.ok('and a new block’s first bench session starts from Strong’s numbers', /185x8/.test(r.prev), r.prev);
    await openSettings(p);
    await p.setInputFiles('#trStrong', { name: 'strong.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ go: document.querySelector('[data-t="sggo"]'), sub: (document.querySelector('.tr-sheet .tr-sub') || {}).textContent || '' }));
    t.ok('the same file twice brings in nothing twice', r.go && /Nothing new/.test(await p.textContent('[data-t="sggo"]')) && /here already/.test(r.sub), r.sub);
    await p.close();
    // ---- the foot of the workout, the back as a question, times, plates ----
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qzskip"]');
    await seed(p, { pr: { qz: 1, bk: 'f', rq: 0 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await openWorkouts(p);
    await p.click('[data-t="sub"][data-v="block"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="ez-curl"]');
    r = await p.evaluate(() => ({
      head: !!document.querySelector('.tr-live-h [data-t="finish"]'),
      top: !!document.querySelector('#trTop:not(.hide) [data-t="finish"]'),
      foot: !document.getElementById('trRest').classList.contains('hide'),
      started: (document.querySelector('#trTop .tr-top-t') || { getAttribute: () => '' }).getAttribute('aria-label') || '',
      list: !!document.querySelector('#trBody [data-t="finish"]'),
      chrome: ['.topbar', '#view-train .view-head', '.tr-seg'].map((q) => { const e = document.querySelector(q); return !!e && e.getBoundingClientRect().height > 0; }),
    }));
    t.ok('full screen: the app header, Strengthen\u2019s title and its tabs step aside', r.chrome.every((v) => !v), JSON.stringify(r));
    t.ok('Finish lives in the bar up top, one reach from every card, and nowhere else; no foot while not resting', !r.head && !r.list && r.top && !r.foot, JSON.stringify(r));
    t.ok('beside the clock, which says when you started', /started \d{1,2}:\d{2} [AP]M/.test(r.started), r.started);
    await p.click('#trTop [data-t="minim"]');
    r = await p.evaluate(() => ({
      header: document.querySelector('.topbar').getBoundingClientRect().height > 0,
      foot: !!document.querySelector('#trRest:not(.hide) .tr-wbar [data-t="finish"]'),
      started: (document.querySelector('.tr-wbar-l') || {}).textContent || '',
      top: !document.getElementById('trTop').classList.contains('hide'),
    }));
    t.ok('made small, the app comes back, with the workout\u2019s bar and Finish at the foot', r.header && r.foot && !r.top && /^Started \d{1,2}:\d{2} [AP]M$/.test(r.started), JSON.stringify(r));
    await p.click('[data-t="focus"]');
    r = await p.evaluate(() => !!document.querySelector('#trTop:not(.hide) [data-t="finish"]'));
    t.ok('and Full screen takes it back', r);
    r = await p.evaluate(() => [window.Train._.elapsed(8551), window.Train._.elapsed(59), window.Train._.elapsed(3600)].join('|'));
    t.ok('past an hour the clock says hours: 2:22:31, not 142:31', r === '2:22:31|0:59|1:00:00', r);

    // the back, asked, then folded
    r = await p.evaluate(() => (document.querySelector('.tr-ask .tr-sq-l') || {}).textContent || '');
    t.ok('the back check is a question', r === 'How’s your back today?', r);
    await p.click('[data-t="bk"][data-v="0"]');
    r = await p.evaluate(() => ({ line: (document.querySelector('.tr-bkt') || {}).textContent || '', q: !!document.querySelector('[data-t="bk"]') }));
    t.ok('answered, it folds to one line with a way back', /Back/.test(r.line) && /good/.test(r.line) && /Change/.test(r.line) && !r.q, JSON.stringify(r));
    await p.click('[data-t="stopen"]');
    await p.click('[data-t="bk"][data-v="2"]');
    r = await p.evaluate(() => ({ line: (document.querySelector('.tr-bkt .tr-fbt-s') || {}).textContent || '', warn: (document.querySelector('.tr-bkt .tr-warn') || {}).textContent || '' }));
    t.ok('sore folds too, but keeps its warning in view', r.line === 'Back sore' && /Skip the lower-body lifts today/.test(r.warn), JSON.stringify(r));

    // plates, in every set
    r = await p.evaluate(() => {
      const _ = window.Train._, a = (w, b) => { const d = document.createElement('div'); d.innerHTML = _.stackHTML(w, b); const s = d.querySelector('.tr-stk'); return s ? s.getAttribute('aria-label') || s.textContent : ''; };
      return { std: a(195, 45), odd: a(137.5, 45), under: a(30, 45), bar: a(45, 45), heavy: (() => { const d = document.createElement('div'); d.innerHTML = _.stackHTML(585, 45); return d.textContent; })(),
        bars: ['bb-bench', 'ez-curl', 'sm-incline'].map((e) => _.barFor(e)).join(),
        kg: (() => { const T = _.state().T, was = T.pr.u; T.pr.u = 'kg'; const d = document.createElement('div'); d.innerHTML = _.stackHTML(22.5, 20); T.pr.u = was; return d.querySelector('.tr-stk').getAttribute('aria-label'); })() };
    });
    t.ok('the plates a side: 195 on a 45 bar is 45, 25 and 5', r.std === '45, 25, 5 a side', r.std);
    t.ok('a weight the plates cannot make says what is left, rather than rounding it away', /1\.25 lb a side that the plates cannot make/.test(r.odd), r.odd);
    t.ok('less than the bar says so; the bar alone says so', /under the bar/.test(r.under) && /just the bar/.test(r.bar), r.under + ' / ' + r.bar);
    t.ok('six 45s fold to one plate with a count', /45×6/.test(r.heavy), r.heavy);
    t.ok('an EZ bar (15 lb, as Strong has it) and a Smith machine start on their own bars', r.bars === '45,15,20', r.bars);
    t.ok('a plate of 1.25 reads 1.25, not 1.3', r.kg === '1.25 a side', r.kg);
    // plate-loaded machines: the plates drawn, the sled not counted
    r = await p.evaluate(() => {
      const _ = window.Train._, sl = ['hack', 'leg-press', 'belt-squat'], d = document.createElement('div');
      d.innerHTML = _.stackHTML(180, _.barFor('hack'));
      return { on: sl.every((e) => _.onBar(_.lib(e))), bar: sl.map((e) => _.barFor(e)).join(), say: sl.map((e) => _.barLabel(e)).join('|'),
        stk: (d.querySelector('.tr-stk') || { getAttribute: () => '' }).getAttribute('aria-label'),
        pin: _.onBar(_.lib('leg-ext')), smith: _.barFor('sm-squat') };
    });
    t.ok('a hack squat, leg press and belt squat take plates', r.on && !r.pin, JSON.stringify(r));
    t.ok('the sled counts as nothing, and says so: plates only', r.bar === '0,0,0' && r.say === 'plates only|plates only|plates only', JSON.stringify(r));
    t.ok('so 180 on a hack squat is two 45s a side', r.stk === '45, 45 a side', r.stk);
    t.ok('a Smith machine squat still starts on its own bar', r.smith === 20, r.smith);
    r = await p.evaluate(() => {
      const _ = window.Train._, T = _.state().T, k = _.ntKey('leg-press'), was = T.pr.bars[k];
      T.pr.bars = Object.assign({}, T.pr.bars); T.pr.bars[k] = { e: 'leg-press', w: 45, u: T.pr.u };
      const say = _.barLabel('leg-press');
      if (was) T.pr.bars[k] = was; else delete T.pr.bars[k];
      return say;
    });
    t.ok('a sled given a weight of its own is a sled, not an Olympic bar', r === 'Sled 45 lb', r);
    // assisted lifts: less help is stronger, when your weight is known; nothing to compare when it is not
    r = await p.evaluate(() => {
      const _ = window.Train._, at = (help, bw) => _.liftE1({ e: 'as-pullup', s: [{ w: help, r: 8 }] }, Object.assign({ u: 'lb' }, bw ? { bw } : {}));
      return { less: at(50, 180) > at(60, 180), none: at(50, 0), bench: _.liftE1({ e: 'bb-bench', s: [{ w: 200, r: 5 }] }, { u: 'lb' }) };
    });
    t.ok('an assisted pull-up with less help reads as stronger, not weaker', r.less && r.none === 0 && r.bench > 200, JSON.stringify(r));
    // the unit is not changed under a workout that is open
    await openSettings(p);
    r = await p.evaluate(() => ({ off: [...document.querySelectorAll('[data-t="s-u"]')].every((b) => b.disabled), say: (document.querySelector('[data-t="s-u"]').closest('.tr-q') || {}).textContent || '' }));
    t.ok('with a workout open, pounds and kilograms wait until it is done, and it says why', r.off && /after the workout you have open/.test(r.say), JSON.stringify(r));
    await p.evaluate(() => { const b = document.querySelector('[data-t="s-u"][data-v="kg"]'); b.disabled = false; b.click(); });
    r = await p.evaluate(() => window.Train._.state().T.pr.u);
    t.ok('and a tap that gets through changes nothing', r === 'lb', r);
    await p.click('.sheet-x');
    {
      // and on the card itself, where they had gone missing
      const q = await t.fresh();
      await q.click('.tab[data-view="train"]');
      await q.click('[data-t="qzskip"]');
      await seed(q, { pr: { qz: 1, bk: 'f', rq: 0 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
      await openWorkouts(q);
      await q.click('[data-t="sub"][data-v="block"]');
      await q.click('[data-t="empty"]');
      await q.click('[data-t="addex"]');
      await q.click('.tr-pick[data-e="hack"]');
      await q.fill('#trw-0-0', '180');
      r = await q.evaluate(() => ({ stk: (document.querySelector('#trpl-0-0 .tr-stk') || { getAttribute: () => '' }).getAttribute('aria-label'),
        btn: !!document.querySelector('.tr-ex [data-t="plates"][data-x="0"]'), bar: (document.querySelector('.tr-ex [data-t="barpick"][data-e="hack"]') || {}).textContent || '' }));
      t.ok('a hack squat card draws its plates, has the plate calculator, and says plates only', r.stk === '45, 45 a side' && r.btn && r.bar === 'plates only', JSON.stringify(r));
      await q.close();
    }
    await p.fill('#trw-0-0', '195');
    r = await p.evaluate(() => ({
      now: document.querySelector('#trpl-0-0 .tr-stk').getAttribute('aria-label'),
      same: !!document.querySelector('#trpl-0-1 .tr-stk'),
      head: document.querySelectorAll('.tr-ex')[0].querySelector('.tr-set-h').textContent,
      curl: !!document.querySelector('#trpl-1-0'),
    }));
    t.ok('typing a weight draws its plates in the set, at once', r.now === '45, 25, 5 a side', r.now);
    t.ok('a set after it at the same weight does not draw the same plates again', !r.same, JSON.stringify(r));
    t.ok('where Previous was, under the same heading, with no “Per side” taking room', /Previous/.test(r.head) && !/Per side/i.test(r.head), r.head);
    await p.fill('#trw-0-2', '205');
    r = await p.evaluate(() => ({ chg: (document.querySelector('#trpl-0-2 .tr-stk') || { getAttribute: () => '' }).getAttribute('aria-label'),
      same: !!document.querySelector('#trpl-0-1 .tr-stk') }));
    t.ok('where the loading changes, the plates are drawn again', r.chg === '45, 35 a side' && !r.same, JSON.stringify(r));
    await p.fill('#trw-0-2', '');
    // the bar: said on the card only when it is not the usual one
    r = await p.evaluate(() => ({ bench: !!document.querySelector('.tr-ex [data-t="barpick"][data-e="bb-bench"]'),
      curl: (document.querySelector('.tr-ex [data-t="barpick"][data-e="ez-curl"]') || {}).textContent || '' }));
    t.ok('the usual bar is not spelled out on every barbell lift; a different one is', !r.bench && r.curl === 'EZ bar 15 lb', JSON.stringify(r));
    await p.click('[data-t="plates"][data-x="0"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-barr')].map((b) => b.textContent).join('|'));
    t.ok('the bars are named, the way Strong lists them', r === 'Olympic bar45 lb|Short bar33 lb|EZ bar15 lb|Hex bar75 lb|Smith machine20 lb|No bar0 lb', r);
    await p.click('[data-t="barset"][data-v="75"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => ({ stk: document.querySelector('#trpl-0-0 .tr-stk').getAttribute('aria-label'), kept: window.Train._.state().T.pr.bars,
      label: (document.querySelector('[data-t="barpick"][data-e="bb-bench"]') || {}).textContent }));
    t.ok('a lift can be put on another bar, and its plates follow', r.stk === '45, 10, 5 a side' && r.label === 'Hex bar 75 lb', JSON.stringify(r));
    t.ok('and the bar is remembered for that lift, and synced with your settings', r.kept.nbbbench && r.kept.nbbbench.e === 'bb-bench' && r.kept.nbbbench.w === 75, JSON.stringify(r.kept));
    await p.click('[data-t="barpick"][data-e="bb-bench"]');
    await p.fill('#trBarW', '33');
    await p.click('[data-t="barother"]');
    r = await p.evaluate(() => window.Train._.barFor('bb-bench'));
    t.ok('any bar weight can be typed', r === 33, r);
    await p.click('[data-t="plates"][data-x="0"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-own-r .tr-sub') || {}).textContent || '');
    t.ok('the plate calculator uses the lift’s own bar', /on a 33 lb bar/.test(r), r);
    await p.click('.sheet-x');

    // plates while typing
    await openSettings(p);
    await p.click('[data-t="s-pl"][data-v="type"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => ({ strip: document.querySelectorAll('.tr-plrow').length,
      on: [...document.querySelectorAll('.tr-prev-pl.on')].map((e) => e.id).join(),
      stk: [...document.querySelectorAll('.tr-prev-pl')].filter((e) => e.querySelector('.tr-stk')).map((e) => e.id).join(),
      rest: document.getElementById('trpl-0-2').textContent, curl: document.getElementById('trpl-1-0').textContent }));
    t.ok('while typing: the plates sit in the row of the next set to do, where Previous was, not in a strip under it',
      r.strip === 0 && r.on === 'trpl-0-0,trpl-1-0' && r.stk === 'trpl-0-0', JSON.stringify(r));
    t.ok('a next set with no weight yet and no last time is left blank, not dashed', r.curl === '', JSON.stringify(r));
    t.ok('the other sets show last time', r.rest === '—', JSON.stringify(r));
    await p.focus('#trw-0-2');
    await p.fill('#trw-0-2', '173');
    r = await p.evaluate(() => ({ on: document.getElementById('trpl-0-2').classList.contains('on'), stk: document.querySelector('#trpl-0-2 .tr-stk').getAttribute('aria-label'),
      txt: document.getElementById('trpl-0-2').textContent }));
    t.ok('and in the row of the set whose weight is being typed', r.on && r.stk === '45, 25 a side', JSON.stringify(r));
    t.ok('with no dash beside them when there is no last time', !/—/.test(r.txt), r.txt);
    await p.focus('#trr-0-2');
    // it goes back a moment later, once the tap that moved the cursor has landed
    r = await p.waitForFunction(() => !document.getElementById('trpl-0-2').classList.contains('on') && !document.querySelector('#trpl-0-2 .tr-stk'), null, { timeout: 3000 })
      .then(() => false, () => true);
    t.ok('which goes back to last time when the cursor leaves it', !r);
    await openSettings(p);
    await p.click('[data-t="s-pl"][data-v="off"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => document.querySelectorAll('.tr-stk').length);
    t.ok('and off is off', r === 0, r);

    // the start time, changed
    await p.click('[data-t="times"]');
    const early = await p.evaluate(() => window.Train._.dtVal(Date.now() - 45 * 60e3));
    await p.fill('#trT0-live', early);
    await p.click('[data-t="livetimeset"]');
    r = await p.evaluate((v) => ({ st: window.Train._.dtVal(window.Train._.state().LIVE.st), clock: (document.getElementById('trElapsed') || {}).textContent }), early);
    t.ok('the start can be moved back to when you really began', r.st === early && /^4[4-6]:/.test(r.clock), JSON.stringify(r));
    await p.click('[data-t="times"]');
    await p.fill('#trT0-live', await p.evaluate(() => window.Train._.dtVal(Date.now() + 3 * 3600e3)));
    await p.click('[data-t="livetimeset"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-warn') || {}).textContent || '');
    t.ok('but not into the future', /in the future/.test(r), r);
    await p.click('.sheet-x');

    // the end, set at Finish
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="fintimes"]');
    /* 35 minutes after the start typed above, counted from it rather than
       from now: a minute turning over between the two used to make it 36. */
    const end = await p.evaluate((e) => window.Train._.dtVal(window.Train._.dtParse(e) + 35 * 60e3), early);
    await p.fill('#trT1-fin', end);
    await p.click('[data-t="fintimeset"]');
    r = await p.evaluate(() => (document.querySelector('.tr-when') || {}).textContent || '');
    t.ok('Finish shows when it was, and the end can be set to when you stopped', /\d{1,2}:\d{2}/.test(r) && /–/.test(r), r);
    await p.click('[data-t="save"]');
    r = await p.evaluate((end) => { const w = Object.values(window.Train._.state().T.wo)[0]; return { en: window.Train._.dtVal(w.en), mins: Math.round((w.en - w.st) / 60e3) }; }, end);
    t.ok('and the workout is saved with those times', r.en === end && r.mins === 35, JSON.stringify(r));

    // copy it, and it goes into Nourish's day too
    r = await p.evaluate(() => {
      let got = null;
      navigator.clipboard.writeText = (x) => { got = x; return Promise.resolve(); };
      document.querySelector('.tr-saved [data-t="wocopy"]').click();
      return got;
    });
    t.ok('a saved workout copies as text: the date, the times, every set',
      /^Strengthen — \w{3}, \w{3} \d+ \d{4}/.test(r || '') && /Workout · \d{1,2}:\d{2}.*\(35 min\)/.test(r || '') && /Barbell Bench Press: 195 lb × 8/.test(r || '') && /1 set ·/.test(r || ''), r);
    // the workout's own day: moved 45 minutes back just after midnight, that is yesterday
    r = await p.evaluate(() => {
      const w = Object.values(window.Train._.state().T.wo)[0], d = new Date(w.st);
      const k = w.dk || d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return window.Train.dayText(k).join('\n');
    });
    t.ok('and Nourish’s copy of the day names it with its times', /^Workout: Workout, \d{1,2}:\d{2}.*\(35 min\), 1 set$/.test(r), r);

    // times on a saved workout
    await p.click('.tr-done [data-t="close"]');
    await openWorkouts(p);
    await p.click('[data-t="wosheet"]');
    await p.click('[data-t="edopen"]');
    const t0 = await p.evaluate(() => window.Train._.dtVal(Date.now() - 26 * 3600e3));
    const t1 = await p.evaluate(() => window.Train._.dtVal(Date.now() - 25 * 3600e3));
    await p.fill('#trEdT0', t1);
    await p.fill('#trEdT1', t0);
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-warn') || {}).textContent || '');
    t.ok('a saved workout’s times can be edited, and an end before the start is refused', /after the start/.test(r), r);
    await p.fill('#trEdT0', t0);
    await p.fill('#trEdT1', t1);
    await p.click('[data-t="edsave"]');
    r = await p.evaluate((t0) => { const w = Object.values(window.Train._.state().T.wo)[0]; const y = new Date(Date.now() - 26 * 3600e3);
      return { st: window.Train._.dtVal(w.st) === t0, mins: Math.round((w.en - w.st) / 60e3), dk: w.dk, want: y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0') }; }, t0);
    t.ok('moved to yesterday, it is filed under yesterday', r.st && r.mins === 60 && r.dk === r.want, JSON.stringify(r));
    await p.close();
    // ---- from Strong: set types, named bars in colour, rest per lift, a lift's own page ----
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {},
      wo: { a: wo('a', '', -1, -1, 3, [{ e: 'bb-bench', s: [{ w: 45, r: 14, wu: 1 }, { w: 185, r: 10 }, { w: 185, r: 8 }] }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.click('[data-t="addset"][data-x="0"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s.map((s) => s.pw + 'x' + s.pr).join());
    t.ok('last time’s warm-up does not push every Previous down a row', r === '185x10,185x8,185x8,185x8', r);
    await p.click('[data-t="sty"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => [...document.querySelectorAll('[data-t="styset"]')].map((b) => b.textContent).join('|'));
    t.ok('tapping a set’s number asks what kind of set it is', r === 'Working set|Warm-up|Drop set|To failure|Missed', r);
    await p.click('[data-t="styset"][data-v="w"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s.map((s) => (s.pw === null ? '-' : s.pw + 'x' + s.pr)).join());
    t.ok('marked a warm-up, a set is paired with last time’s warm-up, and the working sets with last time’s working sets', r === '45x14,185x10,185x8,185x8', r);
    await p.click('[data-t="sty"][data-x="0"][data-s="3"]');
    await p.click('[data-t="styset"][data-v="d"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-ex .tr-set:not(.tr-set-h) .tr-sn')].map((e) => e.textContent).join(','));
    t.ok('a warm-up is lettered W, a drop set D, and the working sets numbered past them', r === 'W,1,2,D', r);
    await p.fill('#trw-0-0', '95'); await p.fill('#trr-0-0', '10');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => ({ ghost: document.getElementById('trw-0-1').placeholder, rest: window.Train._.state().LIVE.rs.dur }));
    t.ok('a warm-up’s weight is not carried into the working sets', r.ghost !== '95', r.ghost);
    t.ok('and it is followed by a minute’s rest, not the full three', r.rest === 60, r.rest);
    await p.fill('#trw-0-1', '185'); await p.fill('#trr-0-1', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    await p.fill('#trw-0-2', '185'); await p.fill('#trr-0-2', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="2"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.rs);
    t.ok('and no rest before a drop set', r === null, JSON.stringify(r));
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-rdiv-b')].map((b) => b.textContent).join(','));
    t.ok('the rest between sets is drawn where it is not the lift’s own: a minute after a warm-up, none before a drop set', r === '1:00,no rest', r);
    await p.click('.tr-ex-m [data-t="restpick"]');
    await p.click('[data-t="restset"][data-v="120"]');
    r = await p.evaluate(() => ({ live: window.Train._.state().LIVE.x[0].rest, kept: window.Train._.state().T.pr.rests.nbbbench,
      div: [...document.querySelectorAll('.tr-rdiv-b')].map((b) => b.textContent).join(','), meta: document.querySelector('.tr-ex-m').textContent }));
    t.ok('a lift’s rest can be its own, and it is remembered', r.live === 120 && r.kept && r.kept.s === 120 && r.div === '1:00,no rest' && /rest 2:00/.test(r.meta), JSON.stringify(r));
    r = await p.evaluate(() => [...document.querySelectorAll('#trpl-0-1 .tr-stk-p')].map((b) => b.className).join('|'));
    t.ok('plates are coloured the way competition plates are: a 45 blue, a 25 green', /pl-lb-45/.test(r) && /pl-lb-25/.test(r), r);
    await p.fill('#trw-0-3', '135'); await p.fill('#trr-0-3', '6');
    await p.click('[data-t="tick"][data-x="0"][data-s="3"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.click('.tr-done [data-t="close"]');
    r = await p.evaluate(() => { const w = Object.values(window.Train._.state().T.wo).sort((a, b) => b.st - a.st)[0];
      return { kinds: w.x[0].s.map((s) => (s.wu ? 'W' : s.ty || 'n')).join(), prs: window.Train._.prsIn(w).map((x) => x.what).join() }; });
    t.ok('the kinds are saved with the sets', r.kinds === 'W,n,n,d', r.kinds);
    // the editor cycles the kind
    await openWorkouts(p);
    await p.click('.tr-hrow[data-t="wosheet"]');
    await p.click('[data-t="edopen"]');
    await p.click('[data-t="edsty"][data-x="0"][data-s="3"]');
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => { const w = Object.values(window.Train._.state().T.wo).sort((a, b) => b.st - a.st)[0]; return w.x[0].s[3].ty; });
    t.ok('and can be changed after, in the editor', r === 'f', r);
    r = await p.evaluate(() => (document.querySelector('.tr-hrow .tr-h-d') || {}).textContent || '');
    t.ok('History gives each workout its time of day', /\d{1,2}:\d{2} [AP]M/.test(r), r);
    await p.close();

    // a warm-up is never a record; a failure set had nothing in reserve
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state(), now = Date.now();
      st.T.wo = {
        a: { id: 'a', st: now - 9 * 864e5, u: 'lb', x: [{ e: 'bb-bench', s: [{ w: 185, r: 10 }] }] },
        b: { id: 'b', st: now - 2 * 864e5, u: 'lb', x: [{ e: 'bb-bench', s: [{ w: 45, r: 20, wu: 1 }, { w: 185, r: 9 }] }] },
        c: { id: 'c', st: now - 1 * 864e5, u: 'lb', x: [{ e: 'bb-bench', pq: 2, s: [0, 1, 2, 3, 4, 5].map(() => ({ w: 150, r: 12, ty: 'f' })) }] },
      };
      st.T.act = '';
      localStorage.setItem('bsc.train', JSON.stringify(st.T)); _.reload();
      const fail = _.review(now).checks.filter((c) => c.t === 'How close to failure')[0];
      return { prs: _.prsIn(_.state().T.wo.b).length, fail: fail.st + ':' + fail.b.slice(0, 60) };
    });
    t.ok('a warm-up of 45 × 20 is not a most-reps record', r.prs === 0, r.prs);
    t.ok('failure sets count as nothing in reserve, and six of them where two were asked is flagged', /^look:You logged about 0 reps to spare/.test(r.fail), r.fail);
    await p.close();

    // a lift's own page
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 400, [{ e: 'bb-bench', s: [{ w: 205, r: 7 }] }]),
      b: wo('b', '', -1, -1, 300, [{ e: 'bb-bench', s: [{ w: 195, r: 9 }] }]),
      c: wo('c', '', -1, -1, 200, [{ e: 'bb-bench', s: [{ w: 255, r: 1 }] }]),
      d: wo('d', '', -1, -1, 3, [{ e: 'bb-bench', s: [{ w: 45, r: 14, wu: 1 }, { w: 185, r: 12 }, { w: 185, r: 10 }] }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="lifts"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="exsheet"][data-e="bb-bench"]'); if (b) b.click(); });
    r = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('[data-t="extab"]')].map((b) => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(','),
      rows: document.querySelectorAll('.tr-hs').length, head: (document.querySelector('.tr-hs-d') || {}).textContent || '',
      e1: [...document.querySelectorAll('.tr-hs')][0].querySelectorAll('.tr-hs-e')[1].textContent }));
    t.ok('a lift opens on its own page, About, History, Charts, Records, on History once it has some', r.tabs === 'About,History*,Charts,Records', r.tabs);
    t.ok('History lists every session with its time of day and an estimated max for each working set',
      r.rows === 4 && /\d{1,2}:\d{2} [AP]M/.test(r.head) && r.e1 === '259', JSON.stringify(r));
    await p.click('[data-t="extab"][data-v="records"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-rmx tbody tr')].map((tr) => tr.children[0].textContent + ':' + tr.children[1].childNodes[0].textContent.trim()).join(' '));
    t.ok('Records: the heaviest for at least each number of reps, as Strong lays it out',
      r === '1:255 lb 2:205 lb 3:205 lb 4:205 lb 5:205 lb 6:205 lb 7:205 lb 8:195 lb 9:195 lb 10:185 lb 11:185 lb 12:185 lb', r);
    r = await p.evaluate(() => document.querySelectorAll('.tr-sess li').length);
    t.ok('and the records as they fell', r >= 2, r);
    await p.click('[data-t="extab"][data-v="charts"]');
    r = await p.evaluate(() => document.querySelectorAll('.tr-sheet svg.tr-chart').length);
    t.ok('Charts: estimated max, heaviest set and volume', r === 3, r);
    await p.click('[data-t="extab"][data-v="about"]');
    r = await p.evaluate(() => ({ steps: document.querySelectorAll('.tr-howto li').length, dl: (document.querySelector('.tr-dl') || {}).textContent || '' }));
    t.ok('About: how to do it in three steps, what it trains, the bar and the rest', r.steps === 3 && /Chest/.test(r.dl) && /Olympic bar 45 lb/.test(r.dl) && /3:00/.test(r.dl), JSON.stringify(r));
    r = await p.evaluate(() => window.Train._.LIB_LIST.filter((x) => !(window.Train._.HOWTO[x.id] || []).length).map((x) => x.id).join());
    t.ok('every lift in the library has its steps written', r === '', r);
    r = await p.evaluate(() => {
      const _ = window.Train._, ids = ['seated-lp', 'mc-kick', 'sm-thrust'];
      const all = [1, 2, 3, 4, 5, 6].map((dpw) => _.build({ dpw, kit: 'gym', lvl: 1 })).map((ms) => ms.days.map((d) => d.s.map((z) => z.e)).flat()).flat();
      return { names: ids.map((e) => _.lib(e).n + '/' + _.lib(e).m).join(), bar: _.barFor('sm-thrust'),
        im: ['Seated Leg Press (Machine)', 'Glute Kickback (Machine)', 'Hip Thrust (Smith Machine)'].map((n) => _.sgMatch(n)).join(),
        picked: ids.filter((e) => all.indexOf(e) >= 0) };
    });
    t.ok('a seated leg press, a glute kickback machine and a Smith machine hip thrust are in the library',
      r.names === 'Seated Leg Press/quads,Glute Kickback Machine/glutes,Smith Machine Hip Thrust/glutes' && r.bar === 20, JSON.stringify(r));
    t.ok('they come in from Strong by name, and are added by you rather than picked for a program',
      r.im === 'seated-lp,mc-kick,sm-thrust' && r.picked.length === 0, JSON.stringify(r));
    await p.click('.tr-sheet [data-t="note"]');
    await p.fill('#trNoteU', 'javascript:alert(1)');
    await p.click('[data-t="notesave"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-warn') || {}).textContent || '');
    t.ok('a how-to link that is not a web address is refused', /could not be read/.test(r), r);
    await p.fill('#trNoteU', 'youtube.com/watch?v=abc');
    await p.click('[data-t="notesave"]');
    r = await p.evaluate(() => ({ nt: window.Train._.state().T.nt.nbbbench, sync: JSON.stringify(window.Train._.payload(true).nt || {}) }));
    t.ok('a link without a note is kept, made https, and synced', r.nt && r.nt.u === 'https://youtube.com/watch?v=abc' && !r.nt.t && /youtube/.test(r.sync), JSON.stringify(r));
    await p.evaluate(() => { const b = document.querySelector('[data-t="exsheet"][data-e="bb-bench"]'); if (b) b.click(); });
    await p.click('[data-t="extab"][data-v="about"]');
    r = await p.evaluate(() => { const a = document.querySelector('.tr-howlink'); return a ? a.getAttribute('href') + '|' + a.getAttribute('rel') + '|' + a.getAttribute('target') : ''; });
    t.ok('and shows on the lift’s page, opening safely in a new tab', r === 'https://youtube.com/watch?v=abc|noopener noreferrer|_blank', r);
    await p.close();

    // Strong's drop and failure sets come in as such
    p = await t.fresh();
    r = await p.evaluate(() => {
      const G = window.Train._.sgParse('Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n' +
        '"2026-08-01 07:30:00","Push","45m","Bench Press (Barbell)","1","185","8","0","0","","",""\n' +
        '"2026-08-01 07:30:00","Push","45m","Bench Press (Barbell)","D","135","10","0","0","","",""\n' +
        '"2026-08-01 07:30:00","Push","45m","Bench Press (Barbell)","F","135","6","0","0","","",""\n');
      return G.wos[0].x[0].s.map((s) => s.ty || 'n').join();
    });
    t.ok('Strong’s drop and failure sets come in as drop and failure sets', r === 'n,d,f', r);
    await p.close();
    // ---- finishing: the summary, and a celebration ------------------------------
    p = await t.fresh();
    r = await p.evaluate(() => [1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111, 112].map(window.Train._.nth).join());
    t.ok('ordinals read right, 11th to 13th included', r === '1st,2nd,3rd,4th,11th,12th,13th,21st,22nd,101st,111th,112th', r);
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 9, [{ e: 'bb-bench', s: [{ w: 225, r: 3 }] }]),
      b: wo('b', '', -1, -1, 6, [{ e: 'bb-bench', s: [{ w: 185, r: 8 }] }]),
      c: wo('c', '', -1, -1, 1, [{ e: 'bb-bench', s: [{ w: 45, r: 10, wu: 1 }, { w: 188, r: 8 }, { w: 190, r: 8 }] }]),
      d: wo('d', '', -1, -1, 0.5, [{ e: 'bb-bench', s: [{ w: 235, r: 3 }, { w: 240, r: 3 }, { w: 240, r: 2 }] }]) } });
    r = await p.evaluate(() => { const _ = window.Train._, w = _.wins(_.state().T.wo.c); return { sets: w.sets, lines: w.lines, big: w.big, ms: w.ms }; });
    t.ok('a set heavier than any before at that many reps is a best for that many reps, and ribboned',
      r.sets['0:2'] === 'best for 8 reps' && !r.sets['0:0'] && r.lines.length === 1, JSON.stringify(r));
    t.ok('only the day’s best set takes it: a second set past the old best is not a second record', !r.sets['0:1'], JSON.stringify(r.sets));
    t.ok('but it is a small win, not a record: no big celebration for it', r.big === false && r.ms.length === 0, JSON.stringify(r));
    r = await p.evaluate(() => window.Train._.wins(window.Train._.state().T.wo.d).sets);
    t.ok('two sets at the same new heaviest: the one with more reps takes the ribbon, and the other is no best for its reps either',
      r['0:1'] === 'heaviest, best est. max' && !r['0:0'] && !r['0:2'], JSON.stringify(r));
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'blk'; ms.n = 'Test block';
      const wo = {}; let k = 0, last = null;
      const weeks = _.weeksOf(ms), now = Date.now();
      for (let w = 0; w < weeks; w++) for (let d = 0; d < ms.days.length; d++) {
        if (ms.days[d].ez) continue;
        const id = 'b' + (k++), st = now - (200 - k) * 36e5;
        wo[id] = { id, st, en: st + 36e5, dk: '2026-01-01', n: 'W', u: 'lb', ms: 'blk', w, d, dl: 0, x: [], sr: {}, fb: {} };
        last = id;
      }
      const load = () => {
        localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1 }, act: 'blk', ms: { blk: ms }, cx: {}, ax: {}, wo }));
        localStorage.removeItem('bsc.trainStamps');
        _.reload();
        return _.state().T;
      };
      let T = load();
      const out = { fin: _.wins(T.wo[last]).ms.join('|'), mid: _.wins(T.wo.b3).ms.join('|'), done: !_.nextSlot(T.ms.blk) };
      wo.again = Object.assign({}, wo[last], { id: 'again', st: now - 1000, en: now });
      T = load();
      out.again = _.wins(T.wo.again).ms.join('|');
      return out;
    });
    t.ok('the workout that finishes a block says so', /Block complete: Test block/.test(r.fin) && !/Block/.test(r.mid), JSON.stringify(r));
    t.ok('but doing its last day again does not say it twice', !/Block/.test(r.again), JSON.stringify(r));
    await p.close();

    p = await t.fresh();
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    const nine = {};
    for (let i = 0; i < 9; i++) nine['h' + i] = wo('h' + i, '', -1, -1, 20 - i, [{ e: 'bb-bench', s: [{ w: 185, r: 8 }] }]);
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: nine });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.fill('#trw-0-0', '195'); await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.fill('#trw-0-1', '185'); await p.fill('#trr-0-1', '5');
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => ({ h: document.querySelector('.tr-done-h').textContent,
      recs: (document.querySelector('.tr-done-r') || {}).textContent || '',
      rib: [...document.querySelectorAll('.tr-done li.tr-won .tr-ribbon')].map((e) => e.textContent).join('|'),
      plain: document.querySelectorAll('.tr-done li:not(.tr-won)').length,
      stats: [...document.querySelectorAll('.tr-done .tr-rec')].map((e) => e.textContent).join('|'),
      saved: Object.keys(window.Train._.state().T.wo).length, live: !!window.Train._.state().LIVE }));
    t.ok('Save opens a summary: saved first, the sheet after', r.saved === 10 && !r.live, JSON.stringify(r));
    t.ok('headed by the milestone when there is one', r.h === 'Your 10th workout!', r.h);
    t.ok('with the time, the sets, the volume and how many records', /Sets\s*2/.test(r.stats) && /Records\s*1/.test(r.stats) && /Total lifted/.test(r.stats), r.stats);
    t.ok('the record named with a medal, and its set tagged with a ribbon; the other set left plain',
      /🥇/.test(r.recs) && /Barbell Bench Press/.test(r.recs) && /heaviest/.test(r.recs) && /🥇 heaviest/.test(r.rib) && r.plain === 1, JSON.stringify(r));
    r = await p.evaluate(() => { const c = window.Train._.state().S.cele, cv = document.getElementById('trConfetti');
      return { c, cv: !!cv, pe: cv ? getComputedStyle(cv).pointerEvents : '', pos: cv ? getComputedStyle(cv).position : '' }; });
    t.ok('a record gets the big celebration: confetti and a chime', r.c.big && r.c.confetti === true && r.c.chime === true, JSON.stringify(r.c));
    t.ok('the confetti covers the screen and takes no taps', r.cv && r.pe === 'none' && r.pos === 'fixed', JSON.stringify(r));
    await p.click('.tr-done [data-t="close"]');
    r = await p.evaluate(() => ({ sheet: !!document.querySelector('#trainRoot .sheet'), saved: !!document.querySelector('.tr-saved') }));
    t.ok('Done closes it, back to the page with the saved workout on it', !r.sheet && r.saved, JSON.stringify(r));
    await p.waitForFunction(() => !document.getElementById('trConfetti'), null, { timeout: 5000 });
    t.ok('and the confetti clears itself away', true);
    await p.close();

    // every workout gets a little one; asking the phone for less motion means none
    p = await t.fresh();
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 3, [{ e: 'bb-bench', s: [{ w: 225, r: 8 }] }]), b: wo('b', '', -1, -1, 2, [{ e: 'bb-bench', s: [{ w: 225, r: 8 }] }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.fill('#trw-0-0', '135'); await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => ({ h: document.querySelector('.tr-done-h').textContent, c: window.Train._.state().S.cele,
      cv: !!document.getElementById('trConfetti'), ribs: document.querySelectorAll('.tr-done .tr-ribbon').length }));
    t.ok('a workout with no record is still marked: its number, and no ribbons', r.h === 'Workout 3 done' && r.ribs === 0, JSON.stringify(r));
    t.ok('a small celebration, and with less motion asked for, the chime but no confetti', r.c.big === false && r.c.confetti === false && !r.cv && r.c.chime === true, JSON.stringify(r));
    await p.click('.tr-done [data-t="close"]');
    // turned off in Options: just the summary
    await p.evaluate(() => { window.Train._.state().T.pr.yay = 0; });
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.fill('#trw-0-0', '315'); await p.fill('#trr-0-0', '3');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => ({ h: document.querySelector('.tr-done-h').textContent, c: window.Train._.state().S.cele }));
    t.ok('with the celebration turned off there is the summary and nothing else', /record/.test(r.h) && r.c.confetti === false && r.c.chime === false, JSON.stringify(r));
    await p.close();
    // ---- the badge beside each lift: how today compares ------------------------------
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 3, [{ e: 'bb-bench', s: [{ w: 45, r: 14, wu: 1 }, { w: 185, r: 8 }, { w: 185, r: 8 }, { w: 185, r: 8 }] },
        { e: 'pullup', s: [{ w: 0, r: 8 }, { w: 0, r: 8 }] }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    const fmAt = () => p.evaluate(() => { const c = document.getElementById('trfm-0'), b = c && c.firstElementChild;
      return { txt: c ? c.textContent : null, cls: b ? b.className : '', tag: b ? b.tagName : '' }; });
    r = await fmAt();
    t.ok('before a working set is done there is no badge: no -100% at the start', r.txt === '', JSON.stringify(r));
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s.map((s) => (s.wu ? 'W' : 'n') + (s.pw === null ? '' : s.pw + 'x' + s.pr)).join());
    const wi = r.split(',').findIndex((z) => z[0] === 'n');
    await p.fill(`#trw-0-${wi}`, '195'); await p.fill(`#trr-0-${wi}`, '8');
    await p.click(`[data-t="tick"][data-x="0"][data-s="${wi}"]`);
    r = await fmAt();
    t.ok('after the first working set: volume against the same set last time, 195 × 8 on 185 × 8 is 5% up',
      r.txt === '▲5% vs last' && /up/.test(r.cls) && r.tag === 'BUTTON', JSON.stringify(r));
    await p.click('#trfm-0 [data-t="fmcyc"]');
    r = await p.evaluate(() => ({ txt: document.getElementById('trfm-0').textContent, kept: window.Train._.state().T.pr.fm.nbbbench,
      sync: JSON.stringify(window.Train._.payload(true).pr || {}) }));
    t.ok('tap it for the volume itself', r.txt === '1,560 lb ▲80 vs last', r.txt);
    t.ok('and the lift remembers the choice, synced with your settings', r.kept && r.kept.e === 'bb-bench' && r.kept.m === 'vol' && /"fm"/.test(r.sync), JSON.stringify(r.kept));
    await p.click('#trfm-0 [data-t="fmcyc"]');
    r = await fmAt();
    t.ok('then the reps, level with last time', r.txt === '8 reps = vs last' && /eq/.test(r.cls), JSON.stringify(r));
    await p.click('#trfm-0 [data-t="fmcyc"]');
    r = await fmAt();
    t.ok('then the best set, as an estimated max', r.txt === 'Est. max 247 ▲13 vs last', JSON.stringify(r));
    await p.click('#trfm-0 [data-t="fmcyc"]');
    r = await p.evaluate(() => ({ txt: document.getElementById('trfm-0').textContent, kept: window.Train._.state().T.pr.fm.nbbbench }));
    t.ok('and round to the change in volume, which is the default and not stored', r.txt === '▲5% vs last' && !r.kept, JSON.stringify(r));
    await p.fill(`#trw-0-${wi + 1}`, '175'); await p.fill(`#trr-0-${wi + 1}`, '8');
    await p.click(`[data-t="tick"][data-x="0"][data-s="${wi + 1}"]`);
    r = await fmAt();
    t.ok('set for set: 195 then 175 against 185 twice is level', r.txt === 'level vs last' && /eq/.test(r.cls), JSON.stringify(r));
    await p.fill(`#trw-0-${wi + 1}`, '165');
    r = await fmAt();
    t.ok('correcting a done set moves the badge at once', r.txt === '▼3% vs last' && /dn/.test(r.cls), JSON.stringify(r));
    // the plan, where it asks for less on purpose
    r = await p.evaluate((wi) => {
      const _ = window.Train._, L = _.state().LIVE, a = L.x[0].s[wi], b = L.x[0].s[wi + 1];
      a.tw = 135; a.tr = 8; b.tw = 135; b.tr = 8; L.dl = 1;
      const dl = _.focusOf(0);
      L.dl = 0;
      const cut = _.focusOf(0);
      a.tw = 205; b.tw = 205;
      const up = _.focusOf(0);
      return { dl: dl.plan && dl.was.vol === 2160, cut: cut.plan && cut.was.vol === 2160, up: !up.plan && up.was.vol === 2960 };
    }, wi);
    t.ok('in a deload the plan is what today is held against, not last time', r.dl, JSON.stringify(r));
    t.ok('and so wherever the plan asked for less than last time', r.cut, JSON.stringify(r));
    t.ok('but a plan asking for more is still held against last time', r.up, JSON.stringify(r));
    // bodyweight: the reps, and nothing to tap through
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    await p.fill('#trr-1-0', '10');
    await p.click('[data-t="tick"][data-x="1"][data-s="0"]');
    r = await p.evaluate(() => { const c = document.getElementById('trfm-1'), b = c && c.firstElementChild; return { txt: c ? c.textContent : '', tag: b ? b.tagName : '' }; });
    t.ok('a bodyweight lift shows its reps, with nothing to tap through', r.txt === '10 reps ▲2 vs last' && r.tag === 'SPAN', JSON.stringify(r));
    r = await p.evaluate(() => { const c = [...document.querySelectorAll('.tr-ex')][1].querySelectorAll('.tr-set:not(.tr-set-h) .tr-prev')[1]; return c ? c.textContent : ''; });
    t.ok('and last time’s bodyweight set reads BW, not 0', /^BW × \d+$/.test(r), r);
    // off
    await openSettings(p);
    await p.click('[data-t="s-fmo"][data-v="0"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => document.querySelectorAll('.tr-fm').length);
    t.ok('and Settings can turn the badge off', r === 0, r);
    r = await p.evaluate(() => JSON.stringify(window.Train._.defaultsPr({ fm: { a: { e: 'x', m: 'nope' }, b: { e: 'y', m: 'best' }, c: 'junk' } }).fm));
    t.ok('a stored choice that is not one of the four is dropped', r === '{"b":{"e":"y","m":"best"}}', r);
    await p.close();
    // ---- ready workouts: one session in a tap, outside any block ----------------------
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => { const q = document.querySelector('.tr-qz-skip'); return q ? q.textContent : ''; });
    t.ok('on the quiz, a ready workout is there beside just logging one', /Pick a ready workout/.test(r) && /Just log a workout/.test(r), r);
    await p.close();
    p = await t.fresh();
    await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'blk'; ms.n = 'My block';
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1, kit: 'gym' }, act: 'blk', ms: { blk: ms }, cx: {}, ax: {}, wo: {
        a: { id: 'a', st: Date.now() - 3 * 864e5, en: Date.now() - 3 * 864e5 + 36e5, dk: '2026-01-01', n: 'W', u: 'lb', ms: '', w: -1, d: -1, dl: 0,
          x: [{ e: 'bb-squat', s: [{ w: 225, r: 8 }, { w: 225, r: 8 }] }, { e: 'bb-bench', s: [{ w: 185, r: 8 }] }], sr: {}, fb: {} } } }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => { const f = document.querySelector('.tr-more'); return f ? f.textContent : ''; });
    t.ok('with a block running, it sits beside logging a workout outside the block', /Pick a ready workout/.test(r) && /outside the block/.test(r), r);
    r = await p.evaluate(() => {
      const _ = window.Train._, T = _.state().T;
      const d = _.readyDay('fba', false, 1), e = _.readyDay('fba', false, 0), h = _.readyDay('fba', false, 2), x = _.readyDay('fba', true, 1);
      const kit = T.pr.kit; T.pr.kit = 'bw'; const bw = _.readyDay('fba', false, 1); T.pr.kit = kit;
      return { n: d.n, sets: [e, d, h].map((z) => z.s.map((s) => s.n).join('')).join('|'), rir: [e.rir, d.rir, h.rir].join(),
        squat: d.s[0].e, xp: x.n, xp2: x.s.every((s) => s.n === 2), xpt: _.estDay({ s: x.s }), xpBig: _.lib(x.s[0].e).k,
        bw: bw.s.length > 0 && bw.s.every((s) => _.lib(s.e).q === 'bw') };
    });
    t.ok('a ready day is the blocks’ own, three sets a lift at two in reserve', r.n === 'Full Body A' && /^3+$/.test(r.sets.split('|')[1]) && r.rir === '3,2,1', JSON.stringify(r));
    t.ok('easy is a set fewer, hard a set more', /^2+$/.test(r.sets.split('|')[0]) && /^4+$/.test(r.sets.split('|')[2]), r.sets);
    t.ok('it picks the lift you already do for a slot, so the weights are yours', r.squat === 'bb-squat', r.squat);
    t.ok('the half-hour version: big lifts first, two sets each, and it fits', r.xp === 'Full Body A · 30 min' && r.xp2 && r.xpt <= 30 && r.xpBig === 'c', JSON.stringify(r));
    t.ok('and it keeps to your kit: bodyweight only means bodyweight lifts', r.bw, JSON.stringify(r));
    await p.click('.tr-more [data-t="ready"]');
    r = await p.evaluate(() => ({ g: [...document.querySelectorAll('.tr-rdg')].map((e) => e.textContent).join('|'),
      rows: [...document.querySelectorAll('.tr-rdb .tr-rdn')].map((e) => e.textContent).join('|'),
      mins: [...document.querySelectorAll('.tr-rdb .tr-rdt')].every((e) => /^~\d+ min$/.test(e.textContent)) }));
    t.ok('the list: full body, upper and lower, push, pull and legs, each with how long it takes',
      r.g === 'Full body|Upper / lower|Push / pull / legs|Machines only' && r.rows === 'Full Body A|Full Body B|Full Body C|Upper A|Lower A|Upper B|Lower B|Push|Pull|Legs|Machine circuit' && r.mins, JSON.stringify(r));
    await p.click('.tr-rdb[data-v="fba"]');
    r = await p.evaluate(() => ({ q: (document.querySelector('.tr-rdq') || {}).textContent || '', go: [...document.querySelectorAll('.tr-rdgo b')].map((e) => e.textContent).join('|'),
      list: document.querySelectorAll('.tr-rdr.on .tr-rdl li').length }));
    t.ok('opened, it lists every lift and asks how hard today', r.q === 'How hard today?' && r.go === 'Easy|Normal|Hard' && r.list >= 5, JSON.stringify(r));
    await p.click('[data-t="rdgo"][data-v="fba"][data-e="1"]');
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE;
      return { n: L.n, ms: L.ms, sets: L.x.map((x) => x.s.length).join(''), rir: L.x.every((x) => x.rir === 2), sq: L.x[0].e, tw: L.x[0].s[0].tw, sheet: !!document.querySelector('#trainRoot .sheet') }; });
    t.ok('Normal starts it at once: three sets a lift, two in reserve, outside the block', r.n === 'Full Body A' && r.ms === '' && /^3+$/.test(r.sets) && r.rir && !r.sheet, JSON.stringify(r));
    t.ok('with the weight worked out from what you last lifted', r.sq === 'bb-squat' && r.tw === 225, JSON.stringify(r));
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    await p.fill('#trw-1-0', '135'); await p.fill('#trr-1-0', '10');
    await p.click('[data-t="tick"][data-x="1"][data-s="0"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, w = Object.values(T.wo).sort((a, b) => b.st - a.st)[0];
      return { n: w.n, ms: w.ms, act: T.act, next: JSON.stringify(_.nextSlot(T.ms.blk)) }; });
    t.ok('it is saved as a workout of its own, and the block is where it was', r.n === 'Full Body A' && r.ms === '' && r.act === 'blk' && r.next === '{"w":0,"d":0}', JSON.stringify(r));
    // kept as a routine
    await p.click('.tr-done [data-t="rtsave"]');
    r = await p.evaluate(() => document.getElementById('trRtN').value);
    t.ok('any finished workout can be kept as a routine, named as it was', r === 'Full Body A', r);
    await p.fill('#trRtN', 'Tuesday quickie');
    await p.click('[data-t="rtdo"]');
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, k = Object.keys(T.rt)[0], rt = T.rt[k];
      return { n: rt && rt.n, x: rt && rt.x.map((x) => x.n).join(), ok: rt && _.SHAPE.rt(rt), sync: JSON.stringify(_.payload(true).rt || {}), said: document.querySelector('#trainRoot .sheet').textContent }; });
    t.ok('the routine keeps its lifts in order with the sets you did, and is synced', r.n === 'Tuesday quickie' && r.x === '2,1' && r.ok && /Tuesday quickie/.test(r.sync), JSON.stringify(r));
    t.ok('and says where to find it', /Your routines/.test(r.said), r.said);
    await p.click('#trainRoot .sheet [data-t="close"]');
    await p.click('.tr-more [data-t="ready"]');
    r = await p.evaluate(() => { const g = [...document.querySelectorAll('.tr-rdg')].map((e) => e.textContent); const nx = document.querySelector('.tr-rdb[data-v^="nx:"] .tr-rdn');
      return { g: g.join('|'), nx: nx ? nx.textContent : '', mine: (document.querySelector('.tr-rdb[data-v^="r"] .tr-rdn') || {}).textContent || '' }; });
    t.ok('next time: Full Body B is next up, after the A you did', /^Next up\|Your routines\|Full body/.test(r.g) && r.nx === 'Full Body B', JSON.stringify(r));
    t.ok('and your routine is listed', r.mine === 'Tuesday quickie', JSON.stringify(r));
    await p.click('.tr-rdb[data-v^="r"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-rdr.on .tr-rdgo small')].map((e) => e.textContent.split(' · ')[0]).join('|'));
    t.ok('a routine’s effort is a set fewer, the sets as saved, or a set more', r === 'a set fewer|sets as saved|a set more', r);
    // a second routine, deleted with two taps
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, w = Object.values(T.wo).sort((a, b) => b.st - a.st)[0]; return _.saveRoutine(w.id, 'Spare'); });
    const spare = r;
    await p.click('.sheet-x');
    await p.click('.tr-more [data-t="ready"]');
    await p.click(`.tr-rdb[data-v="${spare}"]`);
    await p.click(`[data-t="rtdel"][data-v="${spare}"]`);
    r = await p.evaluate((k) => !!window.Train._.state().T.rt[k], spare);
    t.ok('deleting a routine asks for a second tap', r === true);
    await p.click(`[data-t="rtdel"][data-v="${spare}"]`);
    r = await p.evaluate((k) => ({ gone: !window.Train._.state().T.rt[k], stamped: window.Train._.state().TS.rt[k] > 0 }), spare);
    t.ok('and then it is gone, everywhere', r.gone && r.stamped, JSON.stringify(r));
    await p.click('.tr-rdb[data-v^="r"]');
    await p.click('.tr-rdr.on [data-t="rdgo"][data-e="2"]');
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE; return { n: L.n, sets: L.x.map((x) => x.s.length).join(), rir: L.x[0].rir }; });
    t.ok('Hard on the routine: a set more of each, one in reserve', r.n === 'Tuesday quickie' && r.sets === '3,2' && r.rir === 1, JSON.stringify(r));
    r = await p.evaluate(() => { const S = window.Train._.SHAPE.rt;
      return [S({ n: 'x', x: [{ e: 'bb-bench', n: 3 }] }), S({ n: '', x: [{ e: 'a', n: 3 }] }), S({ n: 'x', x: [] }), S({ n: 'x', x: [{ e: 'a', n: 40 }] })].join(); });
    t.ok('a routine from another device is let in only if it is shaped right', r === 'true,false,false,false', r);
    await p.close();
    // ---- pull-ups, chin-ups and dips count you ---------------------------------------------
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, D = 864e5, k = (ago) => { const d = new Date(Date.now() - ago * D); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      localStorage.setItem('bsc.macroWeights', JSON.stringify({ [k(4)]: 190, [k(20)]: 200 }));
      return { today: _.bwOn(k(0), 'lb'), kg: _.bwOn(k(0), 'kg'), old: _.bwOn(k(18), 'lb'), stale: _.bwOn(k(40), 'lb'), gap: _.bwOn(k(30), 'lb'),
        pu: _.e1Of('pullup', 25, 6, 190), none: _.e1Of('pullup', 0, 10, null), bench: _.e1Of('bb-bench', 185, 8, 190) === _.e1rm(185, 8) };
    });
    t.ok('your weight is the latest weigh-in on or before the day, in the unit you lift in', r.today === 190 && r.kg === 86.2 && r.old === 200, JSON.stringify(r));
    t.ok('and none from more than a fortnight before, rather than a stale guess', r.stale === null && r.gap === null, JSON.stringify(r));
    t.ok('a pull-up counts you plus the belt: 190 + 25 for 6 is an estimated 258', Math.round(r.pu) === 258 && r.none === 0 && r.bench, JSON.stringify(r));
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 10, [{ e: 'pullup', s: [{ w: 0, r: 8 }, { w: 0, r: 7 }] }], { bw: 200 }),
      b: wo('b', '', -1, -1, 3, [{ e: 'pullup', s: [{ w: 0, r: 8 }, { w: 0, r: 8 }] }]) } });
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T; return { a: _.prsIn(T.wo.a).length, b: _.prsIn(T.wo.b).map((x) => x.what).join(), rec: Math.round(_.records('pullup').e1) }; });
    t.ok('ten pounds lighter for the same reps is no record, and nothing is taken away', r.b === '' && r.rec === Math.round(200 * (1 + 8 / 30)), JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    await p.fill('#trw-0-0', '15'); await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => (document.getElementById('trfm-0') || {}).textContent || '');
    t.ok('the badge keeps to reps on these lifts, belt or no belt', r === '8 reps = vs last', r);
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => { const w = Object.values(window.Train._.state().T.wo).sort((a, b) => b.st - a.st)[0];
      return { bw: w.bw, recs: (document.querySelector('.tr-done-r') || {}).textContent || '' }; });
    t.ok('the day’s weight is kept with the workout', r.bw === 190, JSON.stringify(r));
    t.ok('and 190 + 15 for 8 beats 200 for 8: a best estimated max, with its medal', /Pull-Up/.test(r.recs) && /best est\. max/.test(r.recs), r.recs);
    await p.click('.tr-done [data-t="close"]');
    await p.click('[data-t="sub"][data-v="lifts"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="exsheet"][data-e="pullup"]'); if (b) b.click(); });
    r = await p.evaluate(() => ({ head: [...document.querySelectorAll('.tr-hs-d')].map((e) => e.textContent).join('|'),
      sets: [...document.querySelectorAll('.tr-hs-t td:nth-child(2)')].map((e) => e.textContent).join('|') }));
    t.ok('the lift’s history says what you weighed, and the belt as added', /you 190 lb/.test(r.head) && /you 200 lb/.test(r.head) && /\+15 lb × 8/.test(r.sets), JSON.stringify(r));
    await p.click('[data-t="extab"][data-v="charts"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-chart-h')].map((e) => e.textContent).join('|'));
    t.ok('charts: reps, the estimated max with you in it, and strength × bodyweight', r === 'Best set, in reps|Estimated one-rep max, you + added|Strength × bodyweight', r);
    await p.click('[data-t="extab"][data-v="records"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-rec')].map((e) => e.textContent).join('|'));
    t.ok('records: estimated max, × bodyweight, most added and most reps', /Est\. max260 lb/.test(r) && /× bodyweight1\.37/.test(r) && /Most added\+15 lb/.test(r) && /Most reps8/.test(r), r);
    await p.close();

    // no weigh-ins: reps, as before
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 10, [{ e: 'dip', s: [{ w: 0, r: 10 }] }]), b: wo('b', '', -1, -1, 3, [{ e: 'dip', s: [{ w: 0, r: 12 }] }]) } });
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T; return { rec: _.records('dip').e1, b: _.prsIn(T.wo.b).map((x) => x.what).join() }; });
    t.ok('without a weigh-in a dip is counted in reps, and more reps is still a record', r.rec === 0 && r.b === 'most reps', JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="lifts"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="exsheet"][data-e="dip"]'); if (b) b.click(); });
    await p.click('[data-t="extab"][data-v="records"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-hint') || {}).textContent || '');
    t.ok('and the lift says how to get a strength number', /Log your weight on Nourish/.test(r), r);
    await p.close();
    // ---- your weight on a pull-up day: asked only when there's no good answer --------------
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, D = 864e5, k = (ago) => { const d = new Date(Date.now() - ago * D); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const at = (w) => { localStorage.setItem('bsc.macroWeights', JSON.stringify(w)); return _.bwInfo(k(0), 'lb'); };
      return { avg: at({ [k(1)]: 190, [k(3)]: 191, [k(5)]: 192 }), day: at({ [k(0)]: 188, [k(3)]: 191 }), old: at({ [k(9)]: 190 }), none: at({ [k(20)]: 190 }) };
    });
    t.ok('three weigh-ins in the week: their average is your weight, steadier than any one', r.avg.src === 'avg' && r.avg.v === 191, JSON.stringify(r.avg));
    t.ok('fewer, but one today: today’s', r.day.src === 'day' && r.day.v === 188, JSON.stringify(r.day));
    t.ok('only an older one: it counts, but is marked as not to be trusted today', r.old.src === 'old' && r.old.v === 190 && r.none === null, JSON.stringify(r));
    await p.close();

    const bwPage = async (weights) => {
      const q = await t.fresh();
      await q.evaluate((w) => {
        const D = 864e5, k = (ago) => { const d = new Date(Date.now() - ago * D); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
        const o = {}; Object.keys(w).forEach((a) => { o[k(Number(a))] = w[a]; });
        localStorage.setItem('bsc.macroWeights', JSON.stringify(o));
      }, weights);
      await q.reload();
      await q.waitForTimeout(200);
      await seed(q, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
      await q.click('.tab[data-view="train"]');
      await q.click('[data-t="empty"]');
      await q.click('[data-t="addex"]');
      await q.click('.tr-pick[data-e="bb-bench"]');
      return q;
    };
    const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    // a week of weigh-ins: never asked
    p = await bwPage({ 1: 190, 3: 191, 5: 192 });
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    r = await p.evaluate(() => !!document.querySelector('.tr-bwq'));
    t.ok('with a week of weigh-ins it doesn’t ask', r === false);
    await p.close();
    // an older one only: asked, and not before a pull-up is in the workout
    p = await bwPage({ 9: 190, 10: 191, 11: 189 });
    r = await p.evaluate(() => !!document.querySelector('.tr-bwq'));
    t.ok('no question on a day with no pull-ups or dips', r === false);
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    r = await p.evaluate(() => { const c = document.querySelector('.tr-bwq'); return c ? { q: c.querySelector('.tr-sq-l').textContent, sub: !!c.querySelector('.tr-sub'),
      old: (c.querySelector('[data-t="bwqold"]') || {}).textContent || '' } : null; });
    t.ok('add pull-ups with only an older weigh-in, and it asks what you weigh today', r && r.q === 'What do you weigh today?' && !r.sub && /^Use 190 from /.test(r.old), JSON.stringify(r));
    await p.click('[data-t="bwqwhy"]');
    r = await p.evaluate(() => ({ sub: (document.querySelector('.tr-bwq .tr-sub') || {}).textContent || '', never: !!document.querySelector('.tr-bwq [data-t="bwqnever"]') }));
    t.ok('and Why? says why, with the way to stop it asking', /last weigh-in was 190 lb/.test(r.sub) && r.never, JSON.stringify(r));
    await p.fill('#trBwq', '150');
    await p.click('[data-t="bwqsave"]');
    r = await p.evaluate((k) => ({ warn: (document.querySelector('.tr-bwq .tr-warn') || {}).textContent || '', nourish: (JSON.parse(localStorage.getItem('bsc.macroWeights')) || {})[k] }), today());
    t.ok('a weight far from your average is asked about, with Nourish’s own guard, before anything is written', /That’s 150 lb, against 190 lb lately/.test(r.warn) && r.nourish === undefined, JSON.stringify(r));
    await p.fill('#trBwq', '188.4');
    await p.press('#trBwq', 'Enter');
    r = await p.evaluate((k) => ({ live: window.Train._.state().LIVE.bw, nourish: (JSON.parse(localStorage.getItem('bsc.macroWeights')) || {})[k],
      tuck: (document.querySelector('.tr-start [data-t="stopen"]') || {}).textContent || '', card: !!document.querySelector('.tr-bwq') }), today());
    t.ok('saved, it is today’s weigh-in on Nourish, and this workout’s weight', r.live === 188.4 && r.nourish === 188.4, JSON.stringify(r));
    t.ok('and the question folds to one line you can change', !r.card && /You 188\.4 lbChange$/.test(r.tuck), JSON.stringify(r));
    r = await p.evaluate((k) => { const H = window.Hive; return { again: H.weigh(k, 187), fix: H.weigh(k, 187.2, { was: 188.4 }) }; }, today());
    t.ok('Nourish never lets it write over a day already weighed, except to correct its own number', r.again.had === 188.4 && r.fix.ok === true, JSON.stringify(r));
    await p.fill('#trr-1-0', '8');
    await p.click('[data-t="tick"][data-x="1"][data-s="0"]');
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => Object.values(window.Train._.state().T.wo)[0].bw);
    t.ok('the workout keeps the weight you gave', r === 188.4, r);
    await p.close();
    // Use the older one, or Not now: nothing written to Nourish
    p = await bwPage({ 9: 190 });
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="dip"]');
    await p.click('[data-t="bwqold"]');
    r = await p.evaluate((k) => ({ live: window.Train._.state().LIVE.bw, nourish: (JSON.parse(localStorage.getItem('bsc.macroWeights')) || {})[k] }), today());
    t.ok('using the last weigh-in keeps it for the workout but writes nothing new to Nourish', r.live === 190 && r.nourish === undefined, JSON.stringify(r));
    await p.click('[data-t="stopen"]');
    r = await p.evaluate(() => (document.querySelector('.tr-bwq-done') || {}).textContent || '');
    t.ok('opened again, it says the weight it is using, with a way to change it', /^Your weight today: 190 lb Change$/.test(r), r);
    await p.click('[data-t="bwopen"]');
    await p.click('[data-t="bwqskip"]');
    r = await p.evaluate(() => ({ q: window.Train._.state().LIVE.bwq, card: !!document.querySelector('.tr-bwq') }));
    t.ok('and Not now puts the question away for this workout', r.q === 'skip' && !r.card, JSON.stringify(r));
    await p.close();
    // ---- fixes from the two reviews ------------------------------------------------------
    p = await t.fresh();
    // the RP climb says what it actually added
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'blk';
      ms.days[0].s.forEach((s) => { if (_.lib(s.e).m === 'chest') s.n = 6; });
      const W = (id, d, extra) => Object.assign({ id, st: Date.now() - (20 - d) * 864e5, en: Date.now() - (20 - d) * 864e5 + 36e5, dk: '2026-01-01', n: 'W', u: 'lb', ms: 'blk', w: 0, d, dl: 0, x: [], sr: {}, fb: {} }, extra || {});
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1 }, act: 'blk', ms: { blk: ms }, cx: {}, ax: {},
        wo: { a0: W('a0', 0, { fb: { chest: { p: 0, k: 0 } } }), b0: W('b0', 1), c0: W('c0', 2, { sr: { chest: 0 } }), d0: W('d0', 3) } }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
      const m = _.state().T.ms.blk, p1 = _.plan(m, 1, 0), p0 = _.plan(m, 0, 0);
      const chest = (pl) => pl.x.filter((x) => _.lib(x.e).m === 'chest');
      return { before: chest(p0).map((x) => x.sets).join(), after: chest(p1).map((x) => x.sets).join(), why: chest(p1)[0].why };
    });
    t.ok('at six sets an exercise the climb stops, and the reason says so instead of claiming +2', r.before === '6,6' && r.after === '6,6' && /^Held — .*Held at six sets an exercise/.test(r.why), JSON.stringify(r));
    // program cards
    r = await p.evaluate(() => { const _ = window.Train._; return [_.weeksSay(_.PROGS.waves), _.kitSay(_.PROGS.waves), _.kitSay(_.PROGS.power), _.kitSay(_.PROGS.home), _.weeksSay(_.PROGS.grow)].join('|'); });
    t.ok('the strength waves card says four weeks and a barbell, not “3–3 weeks · home kit”', r === '4 weeks|needs a barbell|needs a barbell|home kit|4–7 weeks', r);
    // Strong: each row its own unit
    r = await p.evaluate(() => {
      const _ = window.Train._; _.state().T.pr.u = 'lb';
      const G = _.sgParse('Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Weight Unit,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n' +
        '"2020-01-01 07:30:00","A","45m","Squat (Barbell)","1","132.5","kg","5","0","0","","",""\n' +
        '"2024-01-01 07:30:00","B","45m","Squat (Barbell)","1","315","lbs","5","0","0","","",""\n');
      return { u: G.unit, fixed: G.fixedUnit, w: G.wos.map((w) => w.x[0].s[0].w).join(), su: G.wos[0].x[0].s[0].su };
    });
    t.ok('a Strong history that changed unit comes in right: 132.5 kg is 292 lb, not 132.5', r.u === 'lb' && r.fixed && r.w === '292,315' && r.su === undefined, JSON.stringify(r));
    // editing after a change of unit keeps the bodyweight right
    await seed(p, { pr: { qz: 1, u: 'lb' }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 2, [{ e: 'pullup', s: [{ w: 0, r: 8 }] }], { bw: 200 }) } });
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => { window.Train._.state().T.pr.u = 'kg'; });
    await openWorkouts(p);
    await p.click('.tr-hrow[data-t="wosheet"]');
    await p.click('[data-t="edopen"]');
    await p.click('[data-t="edsave"]');
    r = await p.evaluate(() => { const _ = window.Train._, w = _.state().T.wo.a; return { u: w.u, bw: w.bw, e1: Math.round(_.records('pullup').e1) }; });
    t.ok('a pull-up workout edited after switching to kg keeps you at 90.5 kg, not 200', r.u === 'kg' && r.bw === 90.5 && r.e1 === Math.round(90.5 * (1 + 8 / 30)), JSON.stringify(r));
    await p.close();

    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      h: wo('h', '', -1, -1, 5, [{ e: 'bb-bench', s: [{ w: 400, r: 2 }, { w: 315, r: 8 }] }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    // reps follow today's sets
    await p.fill('#trw-0-0', '320'); await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => document.getElementById('trr-0-1').placeholder);
    t.ok('after 320 × 8, the next set expects 8, not the target it just beat', r === '8', r);
    // remove asks twice once a set is done
    await p.click('[data-t="rmex"][data-x="0"]');
    r = await p.evaluate(() => ({ n: window.Train._.state().LIVE.x.length, say: document.querySelector('[data-t="rmex"][data-x="0"]').textContent }));
    t.ok('Remove on a lift with done sets asks again, saying what goes', r.n === 1 && /Tap again: remove it and its 1 done set/.test(r.say), JSON.stringify(r));
    r = await p.evaluate(() => { const b = document.querySelector('.tr-set:not(.tr-set-h) .tr-tick').getBoundingClientRect(); return Math.round(b.height); });
    t.ok('the tick is thumb-sized: 44 px tall', r >= 44, r);
    // warm-ups: to the heaviest working set, and into the log
    await p.fill('#trw-0-1', '315'); await p.fill('#trr-0-1', '3');
    await p.click('[data-t="warm"][data-x="0"]');
    r = await p.evaluate(() => ({ sub: document.querySelector('.tr-sheet .tr-sub').textContent, rows: [...document.querySelectorAll('.tr-warm li b')].map((e) => e.textContent).join('|') }));
    t.ok('the ramp is worked up to the heaviest working set (done or planned), with more steps before heavy work', /heaviest working set, 400 lb/.test(r.sub) && r.rows.split('|').length >= 5 && !/400 lb ×/.test(r.rows), JSON.stringify(r));
    await p.click('[data-t="warmadd"]');
    r = await p.evaluate(() => { const x = window.Train._.state().LIVE.x[0]; return { kinds: x.s.map((s) => (s.wu ? 'W' : s.t ? 'done' : 'n')).join(), ph: document.getElementById('trw-0-1').placeholder, tw: x.s[1].tw }; });
    t.ok('and “Add these as warm-up sets” puts them in the log ahead of the working sets, each showing its own weight',
      /^W,W,W,W/.test(r.kinds) && /done/.test(r.kinds) && r.ph === String(r.tw), JSON.stringify(r));
    // records agree, and warm-ups aren't volume
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.x[0].s = L.x[0].s.filter((s) => s.t || s.wu); L.x[0].s.forEach((s) => { if (s.wu) { s.w = String(s.tw); s.r = String(s.tr); s.t = Date.now(); } }); });
    await p.evaluate(() => window.Train._.reload && 0);
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, w = Object.values(T.wo).sort((a, b) => b.st - a.st)[0];
      return { h: document.querySelector('.tr-done-h').textContent, recs: [...document.querySelectorAll('.tr-done .tr-rec')].map((e) => e.textContent).join('|'),
        prs: _.prsIn(w).length, vol: _.volOf(w) }; });
    t.ok('a best for its reps is said as that, and not counted as a record the history won’t star',
      r.h === 'A best for its reps!' && /Records0 \+1 rep best/.test(r.recs) && r.prs === 0, JSON.stringify(r));
    t.ok('and the volume is the working sets only', r.vol === 320 * 8 && /Total lifted2,560 lb/.test(r.recs), JSON.stringify(r));
    await p.close();

    /* ---- the reps a weight of your own is worth --------------------------
     * Blake (2026-09-28): "When doing a workout and I enter a weight, will
     * the suggested reps update to the estimated reps for me to do?" They
     * did not: 185 x 8 planned, 205 typed, the box still said 8. Now an
     * estimated max (Epley) from the plan's own set, read at its reps to
     * spare, gives the reps that keep the same reps to spare at your weight,
     * rounded down. Asserted against the arithmetic, not a copied number. */
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    // a plan's lift: 185 x 8 with 2 to spare, three sets
    await p.evaluate(() => {
      const _ = window.Train._, x = _.state().LIVE.x[0];
      x.rir = 2;
      x.s = [0, 1, 2].map(() => ({ w: '', r: '', t: 0, tw: 185, tr: 8, pw: 185, pr: 8 }));
      _.draw();
    });
    const est = (w, k, rw, rr) => Math.floor(30 * (rw * (1 + (rr + k) / 30) / w - 1) - k + 1e-9);
    const rph = () => p.evaluate(() => [0, 1, 2].map((j) => document.getElementById('trr-0-' + j).placeholder).join());
    const lo = () => p.evaluate(() => [0, 1, 2].map((j) => document.getElementById('trlo-0-' + j).textContent).join('|'));
    r = await rph();
    t.ok('at the plan’s weight, the reps are the plan’s', r === '8,8,8', r);
    await p.fill('#trw-0-0', '205');
    r = { ph: await rph(), lo: await lo(), want: est(205, 2, 185, 8) };
    t.ok('typing a heavier weight turns the reps into what that weight is worth at the same reps to spare, on this set and the ones after',
      r.want === 4 && r.ph === '4,4,4', JSON.stringify(r));
    t.ok('and a weight that leaves a set under five reps says so once, under the first such set, with the lighter way out',
      /^About 4 reps at this weight: under 5, below the 5–30 range/.test(r.lo.split('|')[0]) && /lighter/.test(r.lo) &&
        r.lo.split('|').filter(Boolean).length === 1, JSON.stringify(r));
    await p.fill('#trw-0-0', '165');
    r = { ph: await rph(), lo: await lo(), want: est(165, 2, 185, 8) };
    t.ok('a lighter one is worth more reps, and says nothing', r.ph === r.want + ',' + r.want + ',' + r.want && r.want > 8 && r.lo === '||', JSON.stringify(r));
    await p.fill('#trw-0-0', '2');
    r = await rph();
    t.ok('a half-typed weight on its way to 205 leaves the plan’s reps alone', r === '8,8,8', r);
    await p.fill('#trw-0-0', '185');
    r = await rph();
    t.ok('and back at the plan’s weight, the plan’s reps again', r === '8,8,8', r);
    // ticked with the reps box empty, the set takes the estimate it showed
    await p.fill('#trw-0-0', '205');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => { const s = window.Train._.state().LIVE.x[0].s[0]; return { w: s.w, r: s.r, t: !!s.t }; });
    t.ok('an empty reps box ticked at 205 logs the 4 it showed', r.w === 205 && r.r === 4 && r.t, JSON.stringify(r));
    /* Once a set is done today, the next estimate reads that set: 205 x 4
       with 2 to spare, not the plan's 185 x 8. Today knows how today is going. */
    await p.fill('#trw-0-1', '185');
    r = { ph: await rph(), want: est(185, 2, 205, 4) };
    t.ok('and the next set’s estimate reads the set just done, not the plan', r.ph.split(',')[1] === String(r.want) && r.want !== 8, JSON.stringify(r));
    // reps to spare you logged count for more than the plan's guess of them
    await p.evaluate(() => { const _ = window.Train._, x = _.state().LIVE.x[0]; x.s[0].q = '0'; _.draw(); });
    r = { ph: await rph(), want: est(185, 2, 205, 4 - 2) };
    t.ok('a set logged with 0 to spare reads as the harder set it was', r.ph.split(',')[1] === String(r.want), JSON.stringify(r));
    // where the plan asks for no reps to spare, the reps are the prescription
    await p.evaluate(() => {
      const _ = window.Train._, x = _.state().LIVE.x[0];
      x.rir = null;
      x.s = [0, 1].map(() => ({ w: '', r: '', t: 0, tw: 185, tr: 5, pw: 185, pr: 5 }));
      _.draw();
    });
    await p.fill('#trw-0-0', '205');
    r = await p.evaluate(() => ({ ph: document.getElementById('trr-0-0').placeholder, lo: document.getElementById('trlo-0-0').textContent }));
    t.ok('a strength block’s main lift keeps its prescribed reps at any weight, and no under-five note', r.ph === '5' && r.lo === '', JSON.stringify(r));
    await p.close();

    // a wave's end shows the new training maxes; a main lift swapped keeps its day
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ prog: 'waves', dpw: 4, kit: 'gym', lvl: 2, wave: 10 });
      ms.id = 'wv'; ms.n = 'Waves'; ms.tm = {}; ms.tu = 'lb';
      ms.days.forEach((d) => d.s.forEach((s) => { if (s.m) ms.tm[s.e] = 300; }));
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1 }, act: 'wv', ms: { wv: ms }, cx: {}, ax: {}, wo: {} }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
      const m = _.state().T.ms.wv, main = m.days[0].s.find((s) => s.m);
      return { html: _.doneNext(m), main: main.e };
    });
    t.ok('the end of a wave shows each lift’s training max for the next one, not RP’s text', /Training max for the next wave/.test(r.html) && !/RP/.test(r.html), r.html.slice(0, 200));
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="start"]') || document.querySelector('[data-t="startnext"]'); if (b) b.click(); });
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE; return L ? { fix: !!L.x[0].fix, am: L.x[0].s.some((s) => s.am), tr: L.x[0].s.map((s) => s.tr).join(), e: L.x[0].e } : null; });
    const mainBefore = r;
    if (r && r.fix) {
      const alt = await p.evaluate(() => { const _ = window.Train._, L = _.state().LIVE, ex = _.lib(L.x[0].e);
        return _.LIB_LIST.filter((x) => x.m === ex.m && x.k === 'c' && x.id !== ex.id && x.q === 'bb')[0].id; });
      await p.click('[data-t="swap"][data-x="0"]');
      await p.evaluate((e) => { const b = document.querySelector('.tr-pick[data-e="' + e + '"]'); if (b) b.click(); }, alt);
      r = await p.evaluate(() => { const x = window.Train._.state().LIVE.x[0]; return { e: x.e, fix: !!x.fix, am: x.s.some((s) => s.am), tr: x.s.map((s) => s.tr).join(), swn: x.swn || '' }; });
      t.ok('swapping the main lift keeps its sets and targets (and any all-out set), and says the old lift’s max stays put',
        r.fix && r.am === mainBefore.am && r.tr === mainBefore.tr && /training max stays as it is/.test(r.swn), JSON.stringify({ mainBefore, after: r }));
    } else t.ok('a planned wave session starts with its main lift first', false, JSON.stringify(r));
    await p.close();

    // saving to the account: a failure is shown, not swallowed
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => { window.Train._.state().T; return (document.querySelector('[data-t="settings"]') ? 1 : 0); });
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('.tr-sheet') || {}).textContent || '');
    t.ok('signed out, Settings says the training is only on this phone', /Only on this phone/.test(r), r.slice(0, 80));
    await p.click('.sheet-x');
    r = await p.evaluate(() => { const was = window.Hive.syncState; window.Hive.syncState = () => 'offline';
      document.querySelector('[data-t="settings"]').click();
      const say = (document.querySelector('.tr-sheet') || {}).textContent || '';
      window.Hive.syncState = was; return say; });
    t.ok('signed in with no signal, it says so instead of asking to sign in', /Signed in, can’t reach the server/.test(r) && !/Only on this phone/.test(r), r.slice(0, 120));
    await p.click('.sheet-x');
    await p.evaluate(async () => {
      window.Train.attach({ set: () => Promise.reject(new Error('offline')) });
      window.Train.remote({}, true);
      await new Promise((res) => setTimeout(res, 50));
    });
    r = await p.evaluate(() => (document.querySelector('.tr-syncerr') || {}).textContent || '');
    t.ok('a save to the account that fails says so, and that the phone still has it', /Not saved to your account yet/.test(r) && /safe on this phone/.test(r), r);
    await p.evaluate(() => window.Train.attach(null));
    await p.close();

    // ---- someone new to lifting: easier lifts, plain words, and help at the first set ----
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, ids = (ms) => ms.days.map((d) => d.s.map((s) => s.e)).flat();
      return { nb: ids(_.build({ prog: 'start', dpw: 3, kit: 'gym', lvl: 0 })), mid: ids(_.build({ prog: 'start', dpw: 3, kit: 'gym', lvl: 1 })),
        home: ids(_.build({ prog: 'start', dpw: 3, kit: 'db', lvl: 0 })) };
    });
    const hard = ['pullup', 'chinup', 'bb-row', 'db-bss', 'belt-squat', 'hip-thrust', 'pallof', 'bb-incline', 'bb-ohp', 'hang-raise'];
    t.ok('new to lifting in a gym: machines, dumbbells and a pulldown, none of the hard-to-learn lifts',
      r.nb.indexOf('lat-pd') >= 0 && r.nb.indexOf('db-rdl') >= 0 && r.nb.indexOf('mc-press') >= 0 && !r.nb.some((e) => hard.indexOf(e) >= 0), r.nb.join());
    t.ok('a year or more in: the barbell lifts, as before', r.mid.indexOf('bb-squat') >= 0 && r.mid.indexOf('bb-bench') >= 0, r.mid.join());
    t.ok('at home with dumbbells, still the two-footed versions first', r.home.indexOf('db-bss') < 0 && r.home.indexOf('goblet') >= 0, r.home.join());
    await p.close();

    // the quiz: "I'm new — choose for me" goes straight to the one program to start with
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qznew"]');
    r = await p.evaluate(() => ({ lvl: window.Train._.state().T.pr.lvl, cards: document.querySelectorAll('.tr-prog').length,
      first: (document.querySelector('.tr-prog .tr-title, .tr-prog h3, .tr-prog') || {}).textContent || '',
      lib: (document.querySelector('[data-t="lib"]') || {}).textContent || '' }));
    t.ok('“I’m new — choose for me” sets you as new and shows only Start here, the others a tap away',
      r.lvl === 0 && r.cards === 1 && /Start here/.test(r.first) && r.lib === 'See other programs', JSON.stringify(r).slice(0, 300));
    await p.close();

    // the first workout, new to lifting
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, lvl: 0 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    r = await p.evaluate(() => { const c = document.querySelector('.tr-ex'); return {
      how1: (document.querySelector('.tr-how1') || {}).textContent || '', first: (c.querySelector('.tr-first:not(.tr-safe)') || {}).textContent || '',
      safe: (c.querySelector('.tr-safe') || {}).textContent || '', howto: !!c.querySelector('[data-t="exhow"]'),
      head: [...c.querySelectorAll('.tr-set-h span')].map((e) => e.textContent).join('|'), meta: c.querySelector('.tr-ex-m').textContent }; });
    t.ok('a card says how a workout goes, once', /How a workout goes/.test(r.how1) && /Tap ✓/.test(r.how1), r.how1.slice(0, 80));
    t.ok('the bench, never done, has one note before the first set: the safety bars', !r.first && /Safety first\..*safety bars/.test(r.safe), JSON.stringify(r));
    const rNb = r;
    r = await p.evaluate(() => { const _ = window.Train._, f = (e) => { const d = document.createElement('div'); d.innerHTML = _.firstTime({ e, s: [{ w: '', r: '', t: 0 }] }); return d.textContent; };
      return { mc: f('lat-pd'), bar: f('ez-curl') }; });
    t.ok('any other lift never done says, in a line, how to find a weight', /^First time\? Start on the 2nd or 3rd plate of the stack/.test(r.mc) && r.bar === 'First time? Start with just the bar.', JSON.stringify(r));
    r = rNb;
    t.ok('and has a How to do it link in view', r.howto);
    t.ok('the columns and the line under the name are in plain words', /Last time/.test(r.head) && /\d+ sets? of 6–10 reps/.test(r.meta) && /Chest/.test(r.meta), JSON.stringify(r));
    await p.click('[data-t="exhow"]');
    r = await p.evaluate(() => { const sh = document.querySelector('.tr-sheet') || document.body, a = [...sh.querySelectorAll('a.tr-howlink')].pop();
      return { tab: (sh.querySelector('.tr-extab [aria-pressed="true"]') || {}).textContent || '', safe: !!sh.querySelector('.tr-safe'),
        href: a ? a.getAttribute('href') : '', rel: a ? a.getAttribute('rel') : '' }; });
    t.ok('How to do it opens the lift on About, with the safety note and a video search', r.tab === 'About' && r.safe &&
      /^https:\/\/www\.youtube\.com\/results\?search_query=Barbell%20Bench%20Press/.test(r.href) && /noopener/.test(r.rel), JSON.stringify(r));
    await p.click('.sheet-x');
    // ticked with nothing to go on: said in words, under the set
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => (document.querySelector('.tr-need') || {}).textContent || '');
    t.ok('a tick with no weight to use says what to type', r === 'Type the weight you used (0 if none), then tick.', r);
    await p.fill('#trw-0-0', '45');
    r = await p.evaluate(() => !!document.querySelector('.tr-need'));
    t.ok('and goes as soon as you type', r === false);
    await p.fill('#trr-0-0', '10');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => { const c = document.querySelector('.tr-ex'); return { first: !!c.querySelector('.tr-first'), how: !!c.querySelector('[data-t="exhow"]') }; });
    t.ok('once a set is done the before-you-start notes go; How to do it stays for someone new', !r.first && r.how, JSON.stringify(r));
    await p.click('[data-t="hwok"]');
    r = await p.evaluate(() => ({ card: !!document.querySelector('.tr-how1'), hw: window.Train._.state().T.pr.hw }));
    t.ok('Got it puts the how-it-goes card away for good', !r.card && r.hw === 1, JSON.stringify(r));
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.x[0].s = L.x[0].s.filter((s) => s.t); });
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => (document.querySelector('.tr-done') || {}).textContent || '');
    t.ok('the first workout’s summary says personal bests start today, and calls volume Total lifted',
      /Personal bests start today/.test(r) && /Total lifted/.test(r) && !/Volume/.test(r), r.slice(0, 200));
    await p.close();

    // the weight asked for comes with its reason, for someone new; not for anyone else
    for (const lvl of [0, 1]) {
      p = await t.fresh();
      await seed(p, { pr: { qz: 1, lvl }, act: '', ms: {}, cx: {}, ax: {}, wo: { h1: wo('h1', '', 0, 0, 3, [{ e: 'bb-bench', s: sets(135, [10, 10, 10]) }]) } });
      await p.click('.tab[data-view="train"]');
      await p.click('[data-t="empty"]');
      await p.click('[data-t="addex"]');
      await p.click('.tr-pick[data-e="bb-bench"]');
      r = await p.evaluate(() => { const c = document.querySelector('.tr-ex'); return { txt: c.querySelector('.tr-ex-h').textContent, first: !!c.querySelector('.tr-first'),
        how: !!c.querySelector('[data-t="exhow"]'), head: c.querySelector('.tr-set-h').textContent }; });
      if (lvl === 0) t.ok('new to lifting: “Up 5 lb — you hit the top of the range last time.”', /Up 5 lb — you hit the top of the range last time\./.test(r.txt), r.txt);
      else t.ok('otherwise no reason line, no first-time notes on a lift you have done, and Previous', !/Up 5 lb/.test(r.txt) && !r.first && !r.how && /Previous/.test(r.head), JSON.stringify(r));
      await p.close();
    }

    // trained today already, the next session works the same muscles: said, not enforced
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ prog: 'start', dpw: 3, kit: 'gym', lvl: 1 });
      ms.id = 'st'; ms.n = 'Start here';
      const pl = _.plan(ms, 0, 0);
      /* An hour ago, but never before today's midnight: run just after
         midnight, an hour ago was yesterday, and "trained today" was false. */
      const now = Date.now(), sod = new Date().setHours(0, 0, 0, 0), st0 = Math.max(now - 3600e3, sod + 1000);
      const done = { id: 'td', st: st0, en: Math.max(st0 + 1000, now - 60e3), dk: '', n: 'Lunch', u: 'lb', ms: '', w: 0, d: 0, dl: 0, sr: {}, fb: {},
        x: pl.x.slice(0, 3).map((x) => ({ e: x.e, s: [{ w: 100, r: 8, t: Math.max(st0 + 500, now - 1800e3) }] })) };
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1 }, act: 'st', ms: { st: ms }, cx: {}, ax: {}, wo: { td: done } }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
      return _.restNote(pl);
    });
    t.ok('trained today already: the Next card says the same muscles are better tomorrow', /better tomorrow/.test(r), r);
    await p.click('.tab[data-view="train"]');
    r = await p.evaluate(() => (document.querySelector('.tr-next') || {}).textContent || '');
    t.ok('shown on the block’s Next card, with Start still there', /better tomorrow/.test(r) && /Start workout/.test(r), r.slice(0, 120));
    await p.close();

    // ---- before you start: the back alone; each muscle's healing at its own first exercise ----
    p = await t.fresh();
    {
      const b = await p.evaluate(() => { const ms = window.Train._.build({ dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] }); ms.id = 'blk'; return ms; });
      const all = [...new Set(b.days.map((d) => d.s.map((z) => z.e)).flat())];
      await seed(p, { pr: { qz: 1, u: 'lb', bk: 'fcx' }, act: 'blk', ms: { blk: b }, cx: {}, ax: {}, wo: {
        a0: wo('a0', 'blk', 0, 3, 3, all.map((e) => ({ e, s: sets(100, [10, 10]) }))) } });
    }
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="start"]');
    r = await p.evaluate(() => { const c = document.querySelector('.tr-start'); return c ? { qs: [...c.querySelectorAll('.tr-sq-l')].map((e) => e.textContent), sore: c.querySelectorAll('[data-t="sore"]').length,
      heal: [...document.querySelectorAll('.tr-ex .tr-heal-q')].length, btn: Math.round(document.querySelector('.tr-heal-q .tr-sqb').getBoundingClientRect().height),
      muscles: window.Train._.soreAsk().length } : null; });
    t.ok('before you start: only the back is asked up front, not a wall of every muscle', r && r.qs.length === 1 && r.qs[0] === 'How’s your back today?' && r.sore === 0, JSON.stringify(r));
    t.ok('how each muscle healed is asked at its own first exercise, a thumb tall', r && r.muscles >= 2 && r.heal === r.muscles && r.btn >= 44, JSON.stringify(r));
    await p.click('[data-t="bk"][data-v="0"]');
    r = await p.evaluate(() => (document.querySelector('.tr-start .tr-fbt-s') || {}).textContent || '');
    t.ok('the back answered, the card folds to a line', r === 'Back good', r);
    const sm = await p.evaluate(() => [...new Set([...document.querySelectorAll('.tr-heal-q [data-t="sore"]')].map((b) => b.dataset.m))]);
    await p.click(`[data-t="sore"][data-m="${sm[0]}"][data-v="1"]`);
    r = await p.evaluate((m) => ({ line: (document.querySelector(`.tr-heal[data-m="${m}"]`) || {}).textContent || '', sr: window.Train._.state().LIVE.sr[m] }), sm[0]);
    t.ok('answered, a muscle’s question folds to a line of what you said', /healed just in time/.test(r.line) && !/as last time/.test(r.line) && r.sr === 1, JSON.stringify(r));
    await p.click(`.tr-heal[data-m="${sm[0]}"]`);
    await p.click(`[data-t="sore"][data-m="${sm[0]}"][data-v="2"]`);
    r = await p.evaluate((m) => (document.querySelector(`.tr-heal[data-m="${m}"]`) || {}).textContent || '', sm[0]);
    t.ok('the line opens to change it', /still sore/.test(r), r);
    for (const m of sm.slice(1)) await p.click(`[data-t="sore"][data-m="${m}"][data-v="0"]`);
    // the first lift done, as asked, and its feedback given: the whole session, saved
    await p.evaluate(() => {
      const _ = window.Train._, L = _.state().LIVE;
      L.x.forEach((x) => x.s.forEach((s) => { s.w = String(s.tw || 100); s.r = String(s.tr || 10); s.t = Date.now(); }));
      _.uniq(L.x.map((x) => _.lib(x.e).m)).forEach((m) => { L.fb[m] = { p: 1, k: 1, j: 0 }; });
    });
    await p.click('[data-t="finish"]');
    await p.click('#trainRoot [data-t="save"]');
    await p.waitForTimeout(150);
    r = await p.evaluate((m) => { const w = Object.values(window.Train._.state().T.wo).sort((a, b) => b.st - a.st)[0]; return { sr: w.sr[m], n: Object.keys(w.sr).length }; }, sm[0]);
    t.ok('what you said is kept with the workout', r.sr === 2 && r.n === sm.length, JSON.stringify(r));

    // the next session: last time's answers stand, said as that, and nothing is asked
    /* The next session trains other muscles, so last time's answers for
       them are put in the log as a session of theirs would have left them:
       all healed early, one still sore. */
    const nm = await p.evaluate(() => {
      const _ = window.Train._, T = JSON.parse(localStorage.getItem('bsc.train')), ms = T.ms.blk;
      const nx = _.nextSlot(ms), mus = _.uniq(_.plan(ms, nx.w, nx.d).x.map((x) => _.lib(x.e).m));
      const w = Object.values(T.wo).sort((a, b) => b.st - a.st)[0];
      Object.values(T.wo).forEach((o) => { o.st -= 2 * 864e5; o.en -= 2 * 864e5; });
      mus.forEach((m, i) => { w.sr[m] = i === 0 ? 2 : 0; w.fb[m] = { p: 1, k: 1, j: 0 }; });
      w.x = w.x.concat(mus.map((m) => ({ e: _.plan(ms, nx.w, nx.d).x.find((x) => _.lib(x.e).m === m).e, s: [{ w: 100, r: 10, t: w.st + 60e3 }] })));
      localStorage.setItem('bsc.train', JSON.stringify(T));
      _.reload();
      return mus;
    });
    sm.length = 0; nm.forEach((m) => sm.push(m));
    await p.click('.tr-done [data-t="close"]').catch(() => {});
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="start"]');
    r = await p.evaluate((m0) => ({ q: [...document.querySelectorAll('.tr-heal-q [data-t="sore"]')].map((b) => b.dataset.m).filter((m, i, a) => a.indexOf(m) === i),
      lines: [...document.querySelectorAll('.tr-heal')].map((e) => e.textContent), m0 }), sm[0]);
    t.ok('next time, each muscle’s healing starts as last time said, in a line, and is not asked',
      r.lines.length === sm.length - 1 && r.lines.every((l) => /recovered early · as last time/.test(l)), JSON.stringify(r));
    t.ok('but one that was still sore is never assumed to be still: that one is asked again', r.q.length === 1 && r.q[0] === sm[0], JSON.stringify(r));
    // one that healed early last time, so nothing about it is asked
    const fm = sm[1];
    // every set of that muscle done as planned: its card is a line of last time's answers, nothing asked
    await p.evaluate((m) => {
      const _ = window.Train._, L = _.state().LIVE;
      L.x.forEach((x) => { if (_.lib(x.e).m === m) x.s.forEach((s) => { s.w = String(s.tw || s.pw || 100); s.r = String(s.tr || s.pr || 10); s.t = Date.now(); }); });
      _.draw();
    }, fm);
    r = await p.evaluate((m) => ({ card: !!document.querySelector(`.tr-fbc [data-m="${m}"]`), line: (document.querySelector(`.tr-fbt[data-m="${m}"]`) || {}).textContent || '' }), fm);
    t.ok('pump, workload and joints start as last time too, in one line', !r.card && /moderate pump/.test(r.line) && /as last time/.test(r.line), JSON.stringify(r));
    // the same sets, but three reps short of what the weight should give: last time is no guide
    await p.evaluate((m) => {
      const _ = window.Train._, L = _.state().LIVE;
      L.x.forEach((x) => { if (_.lib(x.e).m === m) x.s.forEach((s) => { const ref = Number(s.r); s.r = String(Math.max(1, ref - 3)); }); });
      _.draw();
    }, fm);
    r = await p.evaluate((m) => ({ moved: window.Train._.repsMoved(m), card: !!document.querySelector(`.tr-fbc [data-m="${m}"][data-f="k"]`), pressed: document.querySelectorAll(`.tr-fbc [data-m="${m}"][aria-pressed="true"]`).length }), fm);
    t.ok('reps clearly off: the answers are asked afresh, none pre-set', r.moved && r.card && r.pressed === 0, JSON.stringify(r));
    await p.close();

    // the badge against last time: off for someone new unless they turn it on; a workout called Workout isn't said twice
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, lvl: 0, hw: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: { h1: wo('h1', '', 0, 0, 3, [{ e: 'bb-bench', s: sets(135, [10, 10, 10]) }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    r = await p.evaluate(() => ({ eb: !!document.querySelector('.tr-live-h .tr-eyebrow'), title: document.querySelector('.tr-live-h .tr-title').textContent }));
    t.ok('an empty workout is titled Workout once, with no eyebrow saying Workout above it', !r.eb && r.title === 'Workout', JSON.stringify(r));
    await p.fill('#trw-0-0', '140'); await p.fill('#trr-0-0', '10');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => (document.getElementById('trfm-0') || {}).textContent || '');
    t.ok('new to lifting, no percentage against last time beside the name', r === '', r);
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('[data-t="s-fmo"][aria-pressed="true"]') || {}).textContent || '');
    t.ok('and Settings shows it off', r === 'Nothing', r);
    await p.click('[data-t="s-fmo"][data-v="1"]');
    await p.click('.sheet-x');
    r = await p.evaluate(() => ({ fm: (document.getElementById('trfm-0') || {}).textContent || '', fmo: window.Train._.state().T.pr.fmo }));
    t.ok('switched on, it shows, and stays on', r.fm !== '' && r.fmo === 2, JSON.stringify(r));
    await p.close();

    // your weight: Don't ask again, and the switch for it in Settings
    p = await bwPage({ 9: 190 });
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    await p.click('[data-t="bwqwhy"]');
    await p.click('[data-t="bwqnever"]');
    r = await p.evaluate(() => ({ card: !!document.querySelector('.tr-bwq'), nobw: window.Train._.state().T.pr.nobw }));
    t.ok('Don’t ask again puts the weigh-in question away for good', !r.card && r.nobw === 1, JSON.stringify(r));
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('[data-t="s-nobw"][aria-pressed="true"]') || {}).textContent || '');
    t.ok('and Settings shows it, to switch back', r === 'Don’t ask', r);
    await p.close();

    // ---- a lifetime of workouts: a record a year in the account -------------------------
    /* A stand-in for the account: the one record, the records under it, and
       Firestore's delete marker. `deny` is the database before the rule for
       the yearly records is published. */
    const fakeAcct = () => {
      window.__acct = { main: {}, yrs: {}, writes: [], deny: false };
      const A = window.__acct, DEL = { __del: 1 };
      const put = (to, from) => { Object.keys(from).forEach((k) => {
        const v = from[k];
        if (v === DEL) delete to[k];
        else if (v && typeof v === 'object' && !Array.isArray(v) && to[k] && typeof to[k] === 'object') put(to[k], v);
        else to[k] = JSON.parse(JSON.stringify(v, (kk, vv) => (vv === DEL ? undefined : vv)));
      }); };
      const cut = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === DEL ? '(deleted)' : v)));
      const snap = () => ({ metadata: { fromCache: false }, forEach: (fn) => Object.keys(A.yrs).forEach((y) => fn({ id: y, data: () => JSON.parse(JSON.stringify(A.yrs[y])) })) });
      A.doc = {
        set: (d) => { A.writes.push(['main', cut(d)]); put(A.main, d); return Promise.resolve(); },
        collection: () => ({
          doc: (y) => ({ set: (d) => { if (A.deny) return Promise.reject({ code: 'permission-denied' }); A.writes.push([y, cut(d)]); A.yrs[y] = A.yrs[y] || {}; put(A.yrs[y], d); return Promise.resolve(); } }),
          onSnapshot: (o, next, err) => { setTimeout(() => (A.deny ? err({ code: 'permission-denied' }) : next(snap())), 10); return () => {}; },
        }),
      };
      A.fv = { delete: () => DEL };
    };
    const acctSeed = async (q, deny) => {
      await q.evaluate(({ fake, deny }) => {
        eval('(' + fake + ')')();
        window.__acct.deny = deny;
        const now = Date.now(), at = (y, m) => new Date(y, m, 10, 18).getTime();
        const mk = (id, st) => ({ id, st, en: st + 3600e3, dk: '', n: 'W', u: 'lb', ms: '', w: 0, d: 0, dl: 0, sr: {}, fb: {}, x: [{ e: 'bb-bench', s: [{ w: 135, r: 8, t: st + 60e3 }] }] });
        const wo = { a24: mk('a24', at(2024, 3)), b25: mk('b25', at(2025, 5)), c26: mk('c26', now - 864e5) };
        const ts = { a24: 1000, b25: 2000, c26: 3000 };
        localStorage.setItem('bsc.train', JSON.stringify({ pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, nt: {}, rt: {}, wo }));
        localStorage.setItem('bsc.trainStamps', JSON.stringify({ pr: 1, act: 1, ms: {}, wo: ts, cx: {}, ax: {}, nt: {}, rt: {} }));
        window.Train._.reload();
        // the one record, as an older version of the app left it
        const tr = { wo: {} };
        Object.keys(wo).forEach((k) => { tr.wo[k] = { v: wo[k], at: ts[k] }; });
        window.__acct.main = { train: JSON.parse(JSON.stringify(tr)) };
        window.Train.attach(window.__acct.doc, window.__acct.fv);
        window.Train.remote(tr, true);
      }, { fake: fakeAcct.toString(), deny });
      await q.waitForTimeout(1300);
    };
    // before the rule is published: all in the one record, as it always was
    p = await t.fresh();
    await acctSeed(p, true);
    r = await p.evaluate(() => { const A = window.__acct, Y = window.Train._.yr();
      return { on: Y.on, yrs: Object.keys(A.yrs), main: Object.keys(A.main.train.wo).sort().join(), err: window.Train._.state().S && 0 }; });
    t.ok('with the yearly rule not yet published, the workouts stay in the one record and nothing fails', r.on === false && !r.yrs.length && r.main === 'a24,b25,c26', JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('.tr-sheet') || {}).textContent || '');
    t.ok('and Settings says what one database rule would change', /of the 1 MB record your account keeps them in/.test(r) && /SETUP\.md, step 4/.test(r) && !/Not saved/.test(r), r.slice(r.indexOf('Your training data'), r.indexOf('Your training data') + 300));
    await p.close();

    // published: every workout goes to its year, and only then leaves the one record
    p = await t.fresh();
    await acctSeed(p, false);
    r = await p.evaluate(() => { const A = window.__acct, Y = window.Train._.yr(), order = A.writes.map((w) => w[0]);
      return { on: Y.on, yrs: Object.keys(A.yrs).sort().join(), y24: Object.keys((A.yrs['2024'] || {}).wo || {}).join(), y26: Object.keys((A.yrs[String(new Date(Date.now() - 864e5).getFullYear())] || {}).wo || {}).join(),
        main: Object.keys((A.main.train || {}).wo || {}).join(), order: order.join(), lastMain: order.lastIndexOf('main'), firstYear: Math.min(...['2024', '2025'].map((y) => order.indexOf(y))) }; });
    t.ok('published: each workout is copied into its year’s record', r.on === true && /2024/.test(r.yrs) && /2025/.test(r.yrs) && r.y24 === 'a24' && /c26/.test(r.y26), JSON.stringify(r));
    t.ok('and only after that is it taken out of the one record, which ends up holding none', r.main === '' && r.firstYear >= 0 && r.lastMain > r.firstYear, JSON.stringify(r));
    // a new session: nothing that the years already hold is sent again
    r = await p.evaluate(async () => { const A = window.__acct; A.writes = [];
      window.Train.attach(A.doc, A.fv); window.Train.remote(A.main.train, true);
      await new Promise((res) => setTimeout(res, 1300));
      return A.writes.filter((w) => w[0] !== 'main' && Object.keys(w[1].wo || {}).length).length; });
    t.ok('the next time the app opens, workouts the years already hold are not sent again', r === 0, r);
    // deleting a workout deletes it from its year's record
    r = await p.evaluate(async () => { const A = window.__acct; window.Train._.dropWo('a24');
      await new Promise((res) => setTimeout(res, 1300));
      return { y: A.yrs['2024'].wo.a24, main: ((A.main.train || {}).wo || {}).a24 }; });
    t.ok('a deleted workout is deleted in its own year’s record', r.y && r.y.v === null && !r.main, JSON.stringify(r));
    // a phone on the old version puts workouts back in the one record: moved again, never lost
    r = await p.evaluate(async () => { const A = window.__acct, T = window.Train._.state().T;
      const b = JSON.parse(JSON.stringify(T.wo.b25)); b.n = 'Edited on the old phone';
      const tr = { wo: { b25: { v: b, at: 9999999999999 } } };
      A.main.train.wo = tr.wo; window.Train.remote(JSON.parse(JSON.stringify(tr)), true);
      await new Promise((res) => setTimeout(res, 1300));
      return { here: T.wo.b25.n, y: A.yrs['2025'].wo.b25.v.n, main: Object.keys(A.main.train.wo).join() }; });
    t.ok('an edit an older version put in the one record wins, moves to its year, and leaves the one record', r.here === 'Edited on the old phone' && r.y === r.here && r.main === '', JSON.stringify(r));
    r = await p.evaluate(async () => { const A = window.__acct, T = window.Train._.state().T;
      const tr = { wo: { c26: { v: null, at: 9999999999999 } } };
      A.main.train.wo = JSON.parse(JSON.stringify(tr.wo)); window.Train.remote(tr, true);
      await new Promise((res) => setTimeout(res, 1300));
      const y = String(new Date(Date.now() - 864e5).getFullYear());
      return { here: !!T.wo.c26, y: A.yrs[y].wo.c26 }; });
    t.ok('and a workout an older version deleted is deleted in its year’s record too', !r.here && r.y && r.y.v === null, JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('.tr-sheet') || {}).textContent || '');
    t.ok('Settings says they are kept a year to a record, with no limit', /kept a year to a record in your account \(2024, 2025/.test(r) && /no limit on how far back/.test(r), r.slice(r.indexOf('Your training data'), r.indexOf('Your training data') + 300));
    // sizes: a year's record holds about three years of normal training
    r = await p.evaluate(() => { const _ = window.Train._, mk = (i, y) => ({ id: 'z' + y + 'n' + i, st: new Date(y, 0, 1).getTime() + i * 36e5, u: 'lb', x: Array.from({ length: 6 }, () => ({ e: 'bb-bench', s: Array.from({ length: 4 }, () => ({ w: 185.5, r: 8, t: 1e12, q: 2 })) })) });
      const year = (y, n) => Array.from({ length: n }, (_, i) => mk(i, y));
      return { ok: _.fitSay(year(2019, 250).concat(year(2020, 250))), big: _.fitSay(year(2018, 800)) }; });
    t.ok('by year: a year of 250 workouts fits, and more than a record can hold in one year is refused, naming it', r.ok === '' && /More workouts in 2018/.test(r.big), JSON.stringify(r));
    await p.close();

    // in the one record: a big import is refused before anything is written
    p = await t.fresh();
    await acctSeed(p, true);
    r = await p.evaluate(() => { const _ = window.Train._, mk = (i) => ({ id: 'z' + i, st: Date.now() - i * 864e5, u: 'lb', x: Array.from({ length: 6 }, () => ({ e: 'bb-bench', s: Array.from({ length: 4 }, () => ({ w: 185.5, r: 8, t: 1e12, q: 2 })) })) });
      return _.fitSay(Array.from({ length: 600 }, (x, i) => mk(i))); });
    t.ok('in the one record, an import that would pass its limit is refused and says what would lift it', /one record of 1 MB/.test(r) && /SETUP\.md, step 4/.test(r), r);
    await p.close();

    // this phone's storage full: said, not swallowed
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => { const real = Storage.prototype.setItem; window.__realSet = real;
      Storage.prototype.setItem = function (k, v) { if (k === 'bsc.train') { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return real.call(this, k, v); }; });
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.fill('#trw-0-0', '95');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.x[0].s = L.x[0].s.filter((s) => s.t); });
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => ({ warn: (document.querySelector('.tr-done .tr-lsfull') || {}).textContent || '', live: !!localStorage.getItem('sh.trainLive') }));
    t.ok('a save that could not be written says so on the summary, and the workout’s live copy stays on the phone', /isn’t saved on it/.test(r.warn) && r.live, JSON.stringify(r));
    r = await p.evaluate(() => ({ ts: JSON.parse(localStorage.getItem('bsc.trainStamps') || '{}'), mem: window.Train._.state().TS }));
    t.ok('and its stamps are not saved over a log that was not: a reload would have sent it as deleted',
      !Object.keys((r.ts || {}).wo || {}).length && Object.keys((r.mem || {}).wo || {}).length === 1, JSON.stringify(r));
    await p.click('.tr-done [data-t="close"]');
    r = await p.evaluate(() => ({ full: window.Train._.lsFull(), say: (document.querySelector('.tr-lsfull') || {}).textContent || '', live: !!window.Train._.state().LIVE }));
    t.ok('when the phone’s storage is full it says so, and what to do', r.full === true && /storage for the app is full/.test(r.say) && /Export a copy/.test(r.say) && !r.live, JSON.stringify(r));
    r = await p.evaluate(() => { Storage.prototype.setItem = window.__realSet;
      window.Train._.merge({ act: { v: '', at: Date.now() } });
      return { full: window.Train._.lsFull(), live: localStorage.getItem('sh.trainLive'), n: Object.keys(JSON.parse(localStorage.getItem('bsc.train')).wo).length }; });
    t.ok('once the log can be written again, the workout is in it and the spare live copy is gone', r.full === false && r.live === null && r.n === 1, JSON.stringify(r));
    await p.close();

    // the rest bar keeps its buttons while the clock runs, so a tap on the turn of a second lands
    p = await t.fresh();
    await keepLive(p);
    await p.fill('#trw-0-0', '95');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.evaluate(() => { window.__b = document.querySelector('.tr-rest-btn[data-v="15"]'); window.__f = document.querySelector('[data-t="finish"]'); window.__t = document.querySelector('.tr-rest-t').textContent; });
    await p.waitForTimeout(2200);
    r = await p.evaluate(() => ({ same: !!window.__b && window.__b === document.querySelector('.tr-rest-btn[data-v="15"]') && window.__f === document.querySelector('[data-t="finish"]'),
      moved: document.querySelector('.tr-rest-t').textContent !== window.__t }));
    t.ok('the rest bar’s buttons stay the same buttons while its clock counts down', r.same && r.moved, JSON.stringify(r));
    await p.close();

    // sets typed and never ticked are offered at Finish, not dropped with the empty ones
    p = await t.fresh();
    await keepLive(p);
    await p.fill('#trw-0-0', '95');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.fill('#trw-0-1', '95');
    await p.fill('#trr-0-1', '7');
    await p.click('[data-t="finish"]');
    r = await p.evaluate(() => ({ say: (document.querySelector('.tr-typed') || {}).textContent || '', btn: (document.querySelector('[data-t="ticktyped"]') || {}).textContent || '',
      empty: [...document.querySelectorAll('.tr-sheet .tr-note')].map((n) => n.textContent).join('|') }));
    t.ok('Finish says which sets have numbers but no tick, apart from the empty ones', /1 set has numbers typed in but wasn’t ticked/.test(r.say) && r.btn === 'Tick it and save' && /empty sets? w/.test(r.empty), JSON.stringify(r));
    await p.click('[data-t="ticktyped"]');
    r = await p.evaluate(() => { const ws = Object.values(window.Train._.state().T.wo); return ws.length + ':' + ws[0].x[0].s.map((z) => z.w + 'x' + z.r).join('/'); });
    t.ok('and Tick it and save keeps it, as it was typed', r === '1:95x8/95x7', r);
    await p.close();

    // a weight ten times last time's is asked about on the tick
    p = await t.fresh();
    await keepLive(p);
    await p.fill('#trw-0-0', '95');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.fill('#trw-0-1', '100');
    await p.fill('#trr-0-1', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    r = await p.evaluate(() => ({ dlg: !!document.querySelector('#dialogRoot .dlg'), t: !!window.Train._.state().LIVE.x[0].s[1].t }));
    t.ok('an ordinary step up is not questioned', !r.dlg && r.t, JSON.stringify(r));
    await p.fill('#trw-0-2', '1000');
    await p.fill('#trr-0-2', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="2"]');
    r = await p.evaluate(() => ({ dlg: (document.querySelector('#dialogRoot .dlg') || {}).textContent || '', t: !!window.Train._.state().LIVE.x[0].s[2].t }));
    t.ok('1000 after 100 asks before it is ticked', /1000 lb\?/.test(r.dlg) && /Last time was 100 lb/.test(r.dlg) && /10 times/.test(r.dlg) && !r.t, JSON.stringify(r));
    await p.click('#dialogRoot [data-dlg="cancel"]');
    r = await p.evaluate(() => ({ t: !!window.Train._.state().LIVE.x[0].s[2].t, focus: document.activeElement && document.activeElement.id }));
    t.ok('Cancel leaves it unticked, with the weight box ready to fix', !r.t && r.focus === 'trw-0-2', JSON.stringify(r));
    await p.click('[data-t="tick"][data-x="0"][data-s="2"]');
    await p.click('#dialogRoot [data-dlg="ok"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s[2]);
    t.ok('and Keep ticks it as typed', !!r.t && r.w === 1000, JSON.stringify(r));
    await p.close();

    // a bodyweight lift: the box is what is added, and empty is the body alone
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="pullup"]');
    r = await p.evaluate(() => ({ head: [...document.querySelectorAll('.tr-set-h span')].map((x) => x.textContent).join('|'), ph: document.querySelector('#trw-0-0').placeholder }));
    t.ok('on a pull-up the column says +lb and an empty box says BW', /\|\+lb\|/.test(r.head) && r.ph === 'BW', JSON.stringify(r));
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s[0]);
    t.ok('and reps alone tick it, as the body alone', !!r.t && r.w === 0 && r.r === 8, JSON.stringify(r));
    await p.close();

    // Skip, with Undo for a few seconds
    p = await t.fresh();
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="qz"][data-f="goal"][data-v="keep"]');
    await p.click('[data-t="qz"][data-f="lvl"][data-v="2"]');
    await p.click('[data-t="qz"][data-f="dpw"][data-v="2"]');
    await p.click('[data-t="qz"][data-f="min"][data-v="0"]');
    await p.click('[data-t="qzn"]');
    await p.click('[data-t="qz"][data-f="kit"][data-v="gym"]');
    await p.click('[data-t="qzn"]');
    await p.click('[data-t="qzn"]');
    await p.click('[data-t="qz"][data-f="age"][data-v=""]');
    await p.click('[data-t="prog"][data-v="keep"]');
    await p.click('[data-t="build"]');
    await p.click('[data-t="begin"]');
    r = await p.evaluate(() => ({ busy: window.Train.busy() }));
    t.ok('Strengthen says it is not mid-way through anything on a plain screen', r.busy === false, JSON.stringify(r));
    await p.click('[data-t="skip"]');
    r = await p.evaluate(() => { const s = window.Train._.state(); return { sk: (s.T.ms[s.T.act].sk || []).join(), undo: (document.querySelector('.tr-undo') || {}).textContent || '' }; });
    t.ok('Skip skips at once and offers Undo', r.sk === '0:0' && /^Skipped .*Undo$/.test(r.undo), JSON.stringify(r));
    await p.click('[data-t="unskip"]');
    r = await p.evaluate(() => { const s = window.Train._.state(); return { sk: (s.T.ms[s.T.act].sk || []).join(), undo: !!document.querySelector('.tr-undo') }; });
    t.ok('and Undo puts the session back', r.sk === '' && !r.undo, JSON.stringify(r));
    await openSettings(p);
    r = await p.evaluate(() => window.Train.busy());
    t.ok('with a sheet open it is, and an update waits', r === true, String(r));
    await p.close();

    // reopened mid-rest, any touch wakes the chime's sound
    p = await t.fresh();
    await keepLive(p);
    await p.fill('#trw-0-0', '95');
    await p.fill('#trr-0-0', '8');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.reload();
    await p.waitForTimeout(300);
    r = await p.evaluate(() => { let n = 0; const C = window.AudioContext; window.AudioContext = function () { n++; return new C(); };
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return { n, live: !!window.Train._.state().LIVE }; });
    t.ok('reopened in the middle of a rest, the first touch wakes the sound for the chime', r.live && r.n === 1, JSON.stringify(r));
    await p.close();

    // the app open twice: each takes in the other's saves instead of writing over them
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    const p2 = await p.context().newPage();
    await p2.goto(t.base + 'index.html');
    await p2.waitForTimeout(300);
    const woA = wo('a1', '', 0, 0, 2, [{ e: 'bb-bench', s: sets(135, [8, 8]) }]), woB = wo('b1', '', 0, 0, 1, [{ e: 'bb-squat', s: sets(95, [10]) }]);
    await p.evaluate((w) => window.Train._.merge({ wo: { a1: { v: w, at: Date.now() } } }), woA);
    await p2.waitForTimeout(300);
    await p2.evaluate((w) => window.Train._.merge({ wo: { b1: { v: w, at: Date.now() } } }), woB);
    await p.waitForTimeout(300);
    r = await Promise.all([p, p2].map((q) => q.evaluate(() => Object.keys(window.Train._.state().T.wo).sort().join()))).then((a) => ({
      one: a[0], two: a[1] }));
    const stored = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bsc.train')).wo).sort().join());
    t.ok('a workout saved in one copy of the app survives a save in the other', r.one === 'a1,b1' && r.two === 'a1,b1' && stored === 'a1,b1', JSON.stringify({ r, stored }));
    await p2.close();
    await p.close();

    // the machine circuit: eight machines, upper and lower taking turns, pushes and pulls even
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, kit: 'gym' }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    r = await p.evaluate(() => { const _ = window.Train._, st = _.state(), d = (o, xp, ef) => { Object.assign(st.T.pr, o); return _.readyDay('circ', xp, ef); };
      const plain = d({ bk: '', jt: '' }, false, 1), back = d({ bk: 'fc' }, false, 1), half = d({ bk: '' }, true, 1), easy = d({}, false, 0), home = d({ kit: 'db' }, false, 1);
      st.T.pr.kit = 'gym';
      return { plain: plain.s.map((x) => x.e).join(), rounds: plain.s[0].n, back: back.s.map((x) => x.e).join(), half: half.s[0].n + ':' + half.n, easy: easy.s[0].n,
        home: home, all: plain.s.every((x) => ['mc', 'cb'].indexOf(_.lib(x.e).q) >= 0), mins: Math.round(_.estDay(plain)), halfMins: Math.round(_.estDay(half)) }; });
    t.ok('the circuit: chest press, leg press, row, leg extension, shoulder press, leg curl, pulldown, hip abduction — every one a machine',
      r.plain === 'mc-press,leg-press,mc-row,leg-ext,mc-ohp,seated-curl,lat-pd,abduct' && r.all && r.rounds === 3, JSON.stringify(r));
    t.ok('with a back protected from bending and weight on the spine, the belt squat stands in for the leg press', r.back.split(',')[1] === 'belt-squat' && r.back.split(',')[2] === 'mc-row', r.back);
    t.ok('the half hour is two rounds, easy two, and at home with dumbbells there is no machine circuit',
      r.half === '2:Machine circuit · 30 min' && r.easy === 2 && r.home === null && r.mins >= 40 && r.mins <= 45 && r.halfMins <= 30, JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await p.click('.tr-more [data-t="ready"]').catch(() => {});
    await p.evaluate(() => { if (!document.querySelector('.tr-rdb[data-v="circ"]')) document.querySelector('[data-t="ready"]').click(); });
    await p.click('.tr-rdb[data-v="circ"]');
    r = await p.evaluate(() => ({ go: [...document.querySelectorAll('.tr-rdr.on .tr-rdgo small')].map((e) => e.textContent).join('|'), hint: (document.querySelector('.tr-rdr.on .tr-hint') || {}).textContent || '' }));
    t.ok('opened, it says rounds, and how it goes', /^2 rounds.*\|3 rounds.*\|4 rounds/.test(r.go) && /One set at each machine/.test(r.hint), JSON.stringify(r));
    await p.click('.tr-rdr.on [data-t="rdgo"][data-e="1"]');
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE;
      return { n: L.n, cc: !!L.cc && L.x.every((x) => x.cc), labels: [...document.querySelectorAll('.tr-ex .tr-pair')].map((e) => e.textContent).join(),
        say: (document.querySelector('.tr-ex .tr-ex-m') || {}).textContent || '', sub: (document.querySelector('.tr-live-h .tr-sub') || {}).textContent || '' }; });
    t.ok('started, the stations are C1 to C8, each saying what comes next', r.n === 'Machine circuit' && r.cc && r.labels === 'C1,C2,C3,C4,C5,C6,C7,C8' &&
      /then Leg Press, 0:40 to get there/.test(r.say) && /then round again/.test(r.sub), JSON.stringify(r));
    await p.fill('#trw-0-0', '100'); await p.fill('#trr-0-0', '12');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.rs.dur);
    t.ok('a set done, forty seconds to reach the next machine', r === 40, String(r));
    await p.evaluate(() => { const L = window.Train._.state().LIVE; for (let i = 1; i < 7; i++) { L.x[i].s[0].w = 50; L.x[i].s[0].r = 12; L.x[i].s[0].t = Date.now(); } });
    await p.fill('#trw-7-0', '80'); await p.fill('#trr-7-0', '15');
    await p.click('[data-t="tick"][data-x="7"][data-s="0"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.rs.dur);
    t.ok('the last station of a round, two minutes before the next', r === 120, String(r));
    await p.close();

    /* A sheet keeps its place when a tap inside it draws it again. The
       machine circuit sits at the foot of the ready list: opening it threw
       the list back to the top, with the circuit out of sight below. */
    p = await t.fresh({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await seed(p, { pr: { qz: 1, kit: 'gym', lvl: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => document.querySelector('[data-t="ready"]').click());
    await p.waitForSelector('.tr-rdb[data-v="circ"]');
    const low = await p.evaluate(() => { const sc = document.querySelector('#trainRoot .scrim'); sc.scrollTop = sc.scrollHeight; return sc.scrollTop; });
    await p.evaluate(() => document.querySelector('.tr-rdb[data-v="circ"]').click());
    r = await p.evaluate(() => { const sc = document.querySelector('#trainRoot .scrim'), b = document.querySelector('.tr-rdr.on').getBoundingClientRect();
      return { top: sc.scrollTop, rowTop: Math.round(b.top), rowBottom: Math.round(b.bottom), h: sc.clientHeight }; });
    t.ok('opening the machine circuit at the foot of the list keeps the list where it was, and brings the circuit up into view',
      low > 100 && r.top >= low && r.rowTop >= 0 && r.rowBottom <= r.h, JSON.stringify({ low, r }));
    await p.evaluate(() => document.querySelector('#trainRoot .sheet-x').click());
    await p.evaluate(() => document.querySelector('[data-t="ready"]').click());
    r = await p.evaluate(() => document.querySelector('#trainRoot .scrim').scrollTop);
    t.ok('a sheet opened afresh still starts at its top', r === 0, String(r));
    await p.evaluate(() => document.querySelector('#trainRoot .sheet-x').click());
    await openSettings(p);
    const deep = await p.evaluate(() => { const sc = document.querySelector('#trainRoot .scrim'); sc.scrollTop = sc.scrollHeight; return sc.scrollTop; });
    await p.evaluate(() => document.querySelector('[data-t="s-yay"][aria-pressed="false"]').click());
    r = await p.evaluate(() => document.querySelector('#trainRoot .scrim').scrollTop);
    t.ok('and a setting changed at the foot of Settings leaves you there', deep > 100 && Math.abs(r - deep) < 40, JSON.stringify({ deep, r }));
    await p.close();

    // the best swaps: the same movement, the nearest kit, your back, what you know
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, kit: 'gym' }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    r = await p.evaluate(() => { const _ = window.Train._, st = _.state(), ids = (e, today, o) => { Object.assign(st.T.pr, o || {}); return _.swapBest(e, today || {}).map((b) => b.ex.id).join(); };
      const chest = ids('mc-press'), why = _.swapBest('mc-press', {})[0].why;
      const row = ids('mc-row', {}, { bk: '' }), rowBack = ids('mc-row', {}, { bk: 'fc' }), notToday = ids('mc-press', { 'db-bench': 1 }, { bk: '' });
      st.T.pr.avoid = ['db-bench']; const never = ids('mc-press'); st.T.pr.avoid = [];
      return { chest, why, row, rowBack, notToday, never }; });
    t.ok('a taken machine chest press: dumbbell bench first, the same movement, before a bar to load', r.chest.split(',')[0] === 'db-bench' && r.chest.split(',')[1] === 'bb-bench' && /^same movement · dumbbell · new to you$/.test(r.why), JSON.stringify(r));
    t.ok('a row for a row: a cable row for a taken machine row; with a protected back, the chest-supported one first and never the barbell',
      r.row.split(',')[0] === 'cb-row' && !/bb-row/.test(r.rowBack) && r.rowBack.split(',')[0] === 'db-cs-row', JSON.stringify(r));
    t.ok('never one already in today, or on your never list', !/db-bench/.test(r.notToday) && !/db-bench/.test(r.never), JSON.stringify(r));
    await p.close();
    p = await t.fresh();
    await keepLive(p);
    r = await p.evaluate(() => window.Train._.state().LIVE.x.map((x) => x.e).join());
    await p.click('[data-t="swap"][data-x="0"]');
    r = await p.evaluate(() => ({ best: [...document.querySelectorAll('.tr-best .tr-pick')].map((b) => b.dataset.e + ':' + b.querySelector('.tr-pk-m').textContent),
      head: [...document.querySelectorAll('.tr-bestw .tr-rdg')].map((e) => e.textContent).join('|') }));
    t.ok('the swap sheet opens with three best swaps, each saying why', r.best.length === 3 && r.best.every((b) => /·/.test(b)) && /^Best swaps\|Everything for /.test(r.head), JSON.stringify(r));
    await p.click('[data-t="pickm"][data-v=""]');
    await p.fill('#trPickQ', 'curl');
    await p.waitForTimeout(50);
    r = await p.evaluate(() => ({ best: !!document.querySelector('.tr-bestw'), lists: document.querySelectorAll('.tr-picks:not(.tr-best)').length }));
    t.ok('searching hides them, and the list is not doubled', !r.best && r.lists === 1, JSON.stringify(r));
    await p.fill('#trPickQ', '');
    await p.waitForTimeout(50);
    r = await p.evaluate(() => ({ best: !!document.querySelector('.tr-bestw'), lists: document.querySelectorAll('.tr-picks:not(.tr-best)').length }));
    t.ok('and a cleared search brings them back', r.best && r.lists === 1, JSON.stringify(r));
    const pick = await p.evaluate(() => document.querySelector('.tr-best .tr-pick').dataset.e);
    await p.click('.tr-best .tr-pick');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].e);
    t.ok('and one tap swaps it in', r === pick, r + ' vs ' + pick);
    await p.close();

    // the main lift, with a back protected: the one that loads it least
    p = await t.fresh();
    r = await p.evaluate(() => { const _ = window.Train._, m = (o) => _.build(Object.assign({ prog: 'waves', dpw: 3, kit: 'gym', lvl: 1 }, o)).days[0].s[0].e;
      const start = _.build({ prog: 'start', dpw: 3, kit: 'gym', lvl: 0, bk: 'fc' }).days.map((d) => d.s.map((x) => x.e).join()).join(' | ');
      return { plain: m({}), fc: m({ bk: 'fc' }), c: m({ bk: 'c' }), start }; });
    t.ok('with the back protected from bending and weight on the spine, the squat day opens with a belt squat, not a Smith squat', r.plain === 'bb-squat' && r.fc === 'belt-squat' && r.c !== 'sm-squat', JSON.stringify(r));
    t.ok('and a new lifter protecting bending gets no Romanian deadlift of any kind, as the block says', !/rdl/.test(r.start), r.start);
    await p.close();

    // ---- for the serious lifter: misses, assisted lifts, two deadlifts, RPE, a spreadsheet ----
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, ids = [];
      ['start', 'grow', 'keep', 'waves', 'power'].forEach((prog) => [0, 1, 2].forEach((lvl) => ['gym', 'bar', 'db'].forEach((kit) => [0, 1, 2, 3].forEach((seed) => {
        try { const ms = _.build({ prog, dpw: 4, kit, lvl, seed }); ms.days.forEach((d) => d.s.forEach((x) => ids.push(x.e))); } catch (e) { /* not for this kit */ }
      }))));
      return { n: ids.length, bad: ids.filter((e) => ['sumo-dl', 'trap-dl', 'as-pullup', 'as-dip'].indexOf(e) >= 0),
        lib: ['sumo-dl', 'trap-dl', 'as-pullup', 'as-dip'].map((e) => _.lib(e).n).join('|'), bar: _.barFor('trap-dl') };
    });
    t.ok('sumo and trap-bar deadlifts and the assisted pull-up and dip are in the library', r.lib === 'Sumo Deadlift|Trap-Bar Deadlift|Assisted Pull-Up|Assisted Dip', r.lib);
    t.ok('and never chosen for a program on their own', r.n > 500 && !r.bad.length, JSON.stringify({ n: r.n, bad: r.bad.slice(0, 5) }));
    t.ok('the trap bar starts as the hex bar', r.bar === 75, r.bar);
    await p.close();

    // a missed attempt: kept, never counted
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      m1: wo('m1', '', 0, 0, 8, [{ e: 'bb-bench', s: sets(225, [5, 5, 5]) }]),
      m2: wo('m2', '', 0, 0, 4, [{ e: 'bb-bench', s: [{ w: 225, r: 5, t: 1e12 }, { w: 315, r: 0, t: 1e12 + 1, ty: 'm' }] }]),
    } });
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, rec = _.records('bb-bench');
      return { kept: T.wo.m2 && T.wo.m2.x[0].s.length, w: rec.w, e1: Math.round(rec.e1), vol: _.volOf(T.wo.m2), prs: _.prsIn(T.wo.m2).length,
        tw: _.target(_.lib('bb-bench'), null, 0, 0, false).tw, prev: _.target(_.lib('bb-bench'), null, 0, 0, false).prev.length }; });
    t.ok('a missed 315 is kept with the workout', r.kept === 2, JSON.stringify(r));
    t.ok('and is not a record, not volume, and not what next time is worked from', r.w === 225 && r.e1 === 263 && r.vol === 1125 && r.prs === 0 && r.tw === 225 && r.prev === 1, JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    await p.click('[data-t="sty"][data-x="0"][data-s="1"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet') || document.body).textContent);
    t.ok('Missed is one of the kinds of set, and says what it means', /Missed/.test(r) && /never a record, never counted/.test(r), r.slice(0, 120));
    await p.click('[data-t="styset"][data-v="m"]');
    await p.fill('#trw-0-1', '315');
    await p.click('[data-t="tick"][data-x="0"][data-s="1"]');
    r = await p.evaluate(() => { const s = window.Train._.state().LIVE.x[0].s[1]; return { t: !!s.t, r: s.r, w: s.w, lab: document.querySelector('.tr-set.tr-mm .tr-snb').textContent }; });
    t.ok('ticked with no reps, a missed attempt is done at 0 reps, marked M', r.t && r.r === 0 && r.w === 315 && r.lab === 'M', JSON.stringify(r));
    r = await p.evaluate(() => { const _ = window.Train._; return _.ghost(0, 2); });
    t.ok('and the set after it follows the plan, not the miss', r.r > 0 && r.w !== 315, JSON.stringify(r));
    await p.close();

    // ---- the weight follows the effort you logged ----
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      const at = (q, pq, reps) => {
        const T = { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} };
        const x = { e: 'bb-bench', s: (reps || [8, 8, 8]).map((r, i) => Object.assign({ w: 200, r, t: 1e12 + i }, q === null ? {} : { q })) };
        if (pq !== null) x.pq = pq;
        T.wo.a = { id: 'a', st: Date.now() - 3 * 864e5, en: Date.now() - 3 * 864e5 + 36e5, dk: '2026-01-01', n: 'W', u: 'lb', ms: '', w: 0, d: 0, dl: 0, x: [x], sr: {}, fb: {} };
        localStorage.setItem('bsc.train', JSON.stringify(T));
        _.reload();
        const t = _.target(_.lib('bb-bench'), null, 0, 0, false);
        return { w: t.tw, r: t.tr, ef: t.ef || null };
      };
      return { none: at(null, 2), near: at(3, 2), easy: at(4, 2), hard: at(0, 2), cap: at(5, 0), unplanned: at(4, null), top: at(0, 2, [10, 10, 10]),
        low: at(0, 2, [5, 5, 5]), topEasy: at(5, 2, [10, 10, 10]), unplannedHard: at(0, null, [10, 10, 10]) };
    });
    t.ok('no effort logged: the usual double progression, 200 then 200 × 9', r.none.w === 200 && r.none.r === 9 && !r.none.ef, JSON.stringify(r.none));
    t.ok('one rep off the plan is inside the guess, and changes nothing', r.near.w === 200 && r.near.r === 9 && !r.near.ef, JSON.stringify(r.near));
    t.ok('4 to spare where 2 was asked: up past the usual step, with why', r.easy.w === 205 && r.easy.r === 9 && r.easy.ef && r.easy.ef.q === 4 && r.easy.ef.a === 2 && r.easy.ef.w0 === 200, JSON.stringify(r.easy));
    t.ok('none to spare where 2 was asked: the same weight and reps again, not one more', r.hard.w === 200 && r.hard.r === 8 && r.hard.ef && r.hard.ef.r0 === 9, JSON.stringify(r.hard));
    t.ok('five or more to spare where none was asked: up a tenth, 220', r.cap.w === 220 && r.cap.ef, JSON.stringify(r.cap));
    t.ok('and never more than a tenth over last time, even from the top of the range', r.topEasy.w === 220 && r.topEasy.r === 8, JSON.stringify(r.topEasy));
    t.ok('reps short of the range at none to spare: down to what the bottom of the range is worth', r.low.w === 185 && r.low.r === 6 && r.low.ef, JSON.stringify(r.low));
    t.ok('with no plan, two to spare is the ask', r.unplanned.w === 205 && r.unplanned.ef && r.unplanned.ef.a === 2, JSON.stringify(r.unplanned));
    t.ok('but with no plan, sets to failure never hold the weight back: the top of the range still goes up', r.unplannedHard.w === 205 && !r.unplannedHard.ef, JSON.stringify(r.unplannedHard));
    t.ok('the top of the range at none to spare: the same again, not the next weight', r.top.w === 200 && r.top.r === 10 && r.top.ef && r.top.ef.w0 === 205, JSON.stringify(r.top));

    // in a block: said on the card, and put back with a tap
    r = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      const ms = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'ef';
      // bench first, and only once
      const d0 = ms.days[0].s, k = d0.findIndex((z) => z.e === 'bb-bench');
      if (k > 0) d0.splice(k, 1);
      d0[0].e = 'bb-bench';
      const fb = (d) => { const o = {}; ms.days[d].s.forEach((s) => { o[_.lib(s.e).m] = { p: 0, k: 0 }; }); return o; };
      const day = (d, x) => ({ id: 'e' + d, st: Date.now() - (6 - d) * 864e5, en: Date.now() - (6 - d) * 864e5 + 36e5, dk: '2026-01-0' + (d + 1), n: 'W', u: 'lb',
        ms: 'ef', w: 0, d, dl: 0, x, fb: fb(d), sr: {} });
      st.T.ms = { ef: ms }; st.T.act = 'ef'; st.T.pr.rq = 1;
      st.T.wo = {
        e0: day(0, [{ e: 'bb-bench', pq: 3, s: [8, 8, 8].map((r, i) => ({ w: 200, r, q: 5, t: 1e12 + i })) }]),
        e1: day(1, [{ e: ms.days[1].s[0].e, s: [{ w: 50, r: 10, t: 1e12 }] }]),
        e2: day(2, [{ e: ms.days[2].s[0].e, s: [{ w: 50, r: 10, t: 1e12 }] }]),
      };
      localStorage.setItem('bsc.train', JSON.stringify(st.T));
      _.reload();
      const x = _.plan(_.state().T.ms.ef, 1, 0).x[0];
      return { e: x.e, tw: x.tw, tr: x.tr, rir: x.rir, ef: x.ef };
    });
    t.ok('the plan works next week from last week’s effort: 5+ to spare at 200 × 8 where 3 was asked', r.e === 'bb-bench' && r.tw === 210 && r.tr === 9 && r.ef && r.ef.a === 3, JSON.stringify(r));
    await p.click('.tab[data-view="train"]');
    await p.click('.tr-next [data-t="start"]');
    r = await p.evaluate(() => ({ note: (document.querySelector('.tr-ex .tr-efn') || {}).textContent || '', w: document.getElementById('trw-0-0').placeholder,
      rr: document.getElementById('trr-0-0').placeholder, wk: window.Train._.state().LIVE.w, n: document.querySelectorAll('.tr-efn').length }));
    t.ok('the card says by how much and why, in a line', r.wk === 1 && r.n === 1 && /^Up 10 lb: last time was 5\+ to spare, the plan asked 3 to spare\./.test(r.note) && r.w === '210' && r.rr === '9', JSON.stringify(r));
    await p.click('.tr-efn [data-t="efset"]');
    r = await p.evaluate(() => ({ note: (document.querySelector('.tr-ex .tr-efn') || {}).textContent || '', w: document.getElementById('trw-0-0').placeholder,
      w2: document.getElementById('trw-0-1').placeholder, rr: document.getElementById('trr-0-0').placeholder }));
    t.ok('Undo puts every set back to the usual step, and says so', /Usual step: 200 lb × 9/.test(r.note) && r.w === '200' && r.w2 === '200' && r.rr === '9', JSON.stringify(r));
    await p.click('.tr-efn [data-t="efset"]');
    r = await p.evaluate(() => ({ w: document.getElementById('trw-0-0').placeholder, kept: JSON.parse(localStorage.getItem('sh.trainLive')).x[0].ef.on }));
    t.ok('and one more tap takes your effort’s weight again, kept if the page goes away', r.w === '210' && r.kept === 1, JSON.stringify(r));
    await p.fill('#trw-0-0', '210');
    await p.fill('#trr-0-0', '9');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    r = await p.evaluate(() => ({ note: [...document.querySelectorAll('.tr-ex .tr-efn')].map((e) => e.closest('.tr-ex').dataset.xi + ':' + e.textContent),
      done: window.Train._.state().LIVE.x[0].s[0].t > 0 }));
    t.ok('once a set is done the line steps aside, and no other card has one', r.done && !r.note.length, JSON.stringify(r));
    await p.close();

    // assisted: you, less the help; less help is the step forward
    p = await t.fresh();
    await p.evaluate(() => {
      const D = 864e5, k = (ago) => { const d = new Date(Date.now() - ago * D); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const w = {}; [1, 2, 3, 5, 6, 8, 9, 10].forEach((a) => { w[k(a)] = 200; });
      localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
    });
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a1: wo('a1', '', 0, 0, 7, [{ e: 'as-pullup', s: sets(60, [10, 9, 8]) }], { bw: 200 }),
      a2: wo('a2', '', 0, 0, 2, [{ e: 'as-pullup', s: sets(50, [12, 12, 12]) }], { bw: 200 }),
    } });
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T, rec = _.records('as-pullup'), tg = _.target(_.lib('as-pullup'), null, 0, 0, false);
      return { e1: Math.round(rec.e1), w: rec.w, vol: _.volOf(T.wo.a2), tw: tg.tw, tr: tg.tr, won: _.wins(T.wo.a2).lines.map((l) => l.what).join('|') }; });
    t.ok('an assisted pull-up counts you less the help: 200 lb, 50 lb of help, 12 reps', r.e1 === Math.round(150 * (1 + 12 / 30)), JSON.stringify(r));
    t.ok('the help is never a heaviest or a volume', r.w === 0 && r.vol === 0 && !/heaviest/.test(r.won), JSON.stringify(r));
    t.ok('top of the range on every set: next time asks for less help', r.tw === 45 && r.tr === 10, JSON.stringify(r));
    await p.close();

    // RPE, if you would rather
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, rq: 1, eff: 'rpe' }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-squat"]');
    r = await p.evaluate(() => ({ head: document.querySelector('.tr-ex .tr-set-h').textContent,
      opts: [...document.querySelectorAll('.tr-rqs')[0].options].map((o) => o.textContent).join(',') }));
    t.ok('with RPE chosen, each set asks RPE by half steps', /RPE/.test(r.head) && r.opts === '–,10,9.5,9,8.5,8,7.5,7,6,≤5', JSON.stringify(r));
    await p.selectOption('.tr-rqs >> nth=0', '0.5');
    await p.fill('#trw-0-0', '275');
    await p.fill('#trr-0-0', '3');
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.x[0].s = L.x[0].s.filter((s) => s.t); });
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => { const T = window.Train._.state().T, w = Object.values(T.wo)[0]; return { q: w.x[0].s[0].q }; });
    t.ok('RPE 9.5 is kept as half a rep in reserve, the one scale underneath', r.q === 0.5, JSON.stringify(r));
    await p.click('.tr-done [data-t="close"]');
    await openSettings(p);
    r = await p.evaluate(() => (document.querySelector('[data-t="s-eff"][aria-pressed="true"]') || {}).textContent || '');
    t.ok('and Settings has the switch', r === 'RPE', r);
    await p.close();

    // a spreadsheet of every set, that Strong's importer (and this one) reads back
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      c1: wo('c1', '', 0, 0, 3, [{ e: 'bb-squat', s: [{ w: 135, r: 5, t: 1e12, wu: 1 }, { w: 225, r: 5, t: 1e12 + 1, q: 2 }, { w: 245, r: 0, t: 1e12 + 2, ty: 'm' }] },
        { e: 'as-pullup', s: sets(40, [8]) }], { nt: 'Felt good, "legs" day' }),
    } });
    r = await p.evaluate(() => { const _ = window.Train._, csv = _.woCsv(), rows = _.csvRows(csv), G = _.sgParse(csv);
      return { head: rows[0].slice(0, 12).join(','), n: rows.length, row2: rows[2].join('|'), miss: rows[3].join('|'),
        back: G.err || G.wos.length + ':' + G.wos[0].x.map((x) => x.nm + '=' + x.s.length).join(','), match: G.names.map((n) => n.e).join(','),
        nt: G.wos[0].nt.join('|'),
        bw: _.sgList(_.sgParse('Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Weight Unit,Reps,Distance,Seconds,Notes,Workout Notes,RPE,RIR,Set Type,Bodyweight\n' +
          '2024-09-24 18:00:00,Pull,,Pull-Up,1,0,lbs,8,,,,,,,Working set,182.4\n'), 0)[0].bw }; });
    t.ok('the spreadsheet has Strong’s columns, with the unit on every row', r.head === 'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Weight Unit,Reps,Distance,Seconds,Notes,Workout Notes', r.head);
    t.ok('a row a set: warm-up W, RPE and RIR both, and the workout note quoted', r.n === 5 && /\|1\|225\|lbs\|5\|/.test(r.row2) && /\|8\|2\|Working set\|/.test(r.row2) && /Felt good, "legs" day/.test(r.row2), JSON.stringify(r));
    t.ok('a missed attempt says so', /Missed attempt/.test(r.miss) && /\|245\|lbs\|0\|/.test(r.miss), r.miss);
    t.ok('and Bring in from Strong reads it back, lifts matched by name (the missed attempt left out, as Strong would)', r.back === '1:Back Squat=2,Assisted Pull-Up=1' && r.match.split(',').sort().join() === 'as-pullup,bb-squat', JSON.stringify(r));
    t.ok('what the export writes on a set (the machine\u2019s help, a missed attempt) is not brought back as a note', /Felt good/.test(r.nt) && !/machine|Missed/.test(r.nt), r.nt);
    t.ok('and its Bodyweight column comes back with the workout, for a pull-up\u2019s best', r.bw === 182.4, JSON.stringify(r.bw));
    r = await p.evaluate(() => { const G = window.Train._.sgParse('Date,Workout Name,Exercise Name,Set Order,Weight,Reps,RPE\n2026-01-05 18:00:00,Pull,Deadlift (Barbell),1,405,3,8.5\n');
      return G.wos[0].x[0].s[0].q; });
    t.ok('an RPE of 8.5 comes in as one and a half in reserve, not rounded', r === 1.5, r);
    await p.close();

    // ---- import from any app, or any spreadsheet ------------------------------------------
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._, sum = (G) => G.err || G.need || (G.app + ' ' + G.unit + (G.fixedUnit ? '!' : '?') + ' ' + G.wos.map((w) => new Date(w.st).toString().slice(4, 21) + ' ' +
        Math.round((w.dur || 0) / 60000) + 'm ' + w.x.map((x) => x.nm + '=' + x.s.map((z) => z.w + 'x' + z.r + (z.wu ? 'W' : z.ty || '') + (z.q !== undefined ? '@' + z.q : '')).join('/')).join(' ')).join(' | '));
      const hevy = _.sgParse('"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_lbs","reps","distance_miles","duration_seconds","rpe"\n' +
        '"Push","24 Sep 2024, 18:30","24 Sep 2024, 19:35","Good one","Bench Press (Barbell)",,"",0,"warmup",95,10,,,\n' +
        '"Push","24 Sep 2024, 18:30","24 Sep 2024, 19:35","Good one","Bench Press (Barbell)",,"",1,"normal",185,8,,,8.5\n' +
        '"Push","24 Sep 2024, 18:30","24 Sep 2024, 19:35","Good one","Bench Press (Barbell)",,"",2,"failure",185,6,,,\n' +
        '"Push","24 Sep 2024, 18:30","24 Sep 2024, 19:35","Good one","Plank",,"",0,"normal",,,,60,\n');
      const fitbod = _.sgParse('Date,Exercise,Reps,Weight(kg),Duration(s),Distance(m),Incline,Resistance,isWarmup,Note,multiplier\n' +
        '2024-09-24 18:30:00 +0000,Barbell Bench Press,10,40,0,0,0,0,true,,1\n2024-09-24 18:30:00 +0000,Barbell Bench Press,8,80,0,0,0,0,false,,1\n');
      const fitnotes = _.sgParse('Date,Exercise,Category,Weight (lbs),Reps,Distance,Distance Unit,Time,Comment\n' +
        '2024-09-24,Flat Barbell Bench Press,Chest,185.0,8,,,,\n2024-09-24,Flat Barbell Bench Press,Chest,185.0,7,,,,\n2024-09-25,Barbell Squat,Legs,225.0,5,,,,\n');
      return { hevy: sum(hevy), hevyE: hevy.names.map((n) => n.e).join(), fitbod: sum(fitbod), fitbodE: fitbod.names.map((n) => n.e).join(), fitbodT: fitbod.wos[0].st === Date.UTC(2024, 8, 24, 18, 30),
        fitnotes: sum(fitnotes), fitnotesE: fitnotes.names.map((n) => n.e).sort().join() };
    });
    t.ok('Hevy: recognised, its warm-ups and failure sets kept, the length from start to end, RPE 8.5 as 1.5, a timed plank left out',
      /^Hevy lb! Sep 24 2024 18:30 65m Bench Press \(Barbell\)=95x10W\/185x8@1\.5\/185x6f$/.test(r.hevy) && r.hevyE === 'bb-bench', JSON.stringify(r));
    t.ok('Fitbod: recognised, in kg, its UTC time read as UTC, warm-ups kept', /^Fitbod kg! .* Barbell Bench Press=40x10W\/80x8$/.test(r.fitbod) && r.fitbodE === 'bb-bench' && r.fitbodT, JSON.stringify(r));
    t.ok('FitNotes: recognised, one workout a day, plain lift names matched', /^FitNotes lb! /.test(r.fitnotes) && r.fitnotes.split(' | ').length === 2 && r.fitnotesE === 'bb-bench,bb-squat', JSON.stringify(r));
    r = await p.evaluate(() => { const _ = window.Train._, d = (s, o) => { const t = _.imDate(s, o); return t ? new Date(t).toString().slice(4, 21) : null; };
      return [d('45559'), d('Sep 24, 2024 6:30 PM'), d('24.09.2024'), d('03/04/2024', 'dmy'), d('03/04/2024', 'mdy'), d('9/24/24 7:05 am')].join('|'); });
    t.ok('dates as spreadsheets and apps write them: a day number, “Sep 24, 2024 6:30 PM”, 24.09.2024, either order, two-digit years',
      r === 'Sep 24 2024 12:00|Sep 24 2024 18:30|Sep 24 2024 12:00|Apr 03 2024 12:00|Mar 04 2024 12:00|Sep 24 2024 07:05', r);
    r = await p.evaluate(() => { const _ = window.Train._, d = (s) => _.imDate(s, 'mdy'), M = { C: { date: 0, ex: 1, w: 2, r: 3 } };
      // one weight that says kg, in a sheet of bare numbers: the rest are not kg
      const mix = _.sgParse('Date,Exercise,Weight,Reps\n2024-09-24,Bench Press,185,8\n2024-09-24,Bench Press,60kg,8\n', M);
      mix.unit = 'lb';
      // BW, BW+25, +25, a minus on an assisted lift and on anything else, and 1,000
      const wt = _.sgParse('Date,Exercise,Weight,Reps\n2024-09-24,Pull Up,BW,8\n2024-09-24,Pull Up,BW+25,6\n2024-09-24,Pull Up,+10,6\n' +
        '2024-09-24,Assisted Pull Up,-40,8\n2024-09-24,Bench Press,-5,8\n2024-09-24,Leg Press,"1,000",10\n', M);
      // a time on every row, no workout name: one workout a day, a new one after three hours
      const stamp = _.sgParse('Date,Exercise,Weight,Reps\n2024-09-24 18:00,Bench Press,185,8\n2024-09-24 18:04,Bench Press,185,7\n' +
        '2024-09-24 18:12,Squat,225,5\n2024-09-25 07:00,Squat,225,5\n2024-09-25 19:30,Bench Press,190,5\n', M);
      const set = (G) => _.sgList(G, 0).map((w) => w.x.map((x) => x.e + ':' + x.s.map((z) => z.w + 'x' + z.r).join('/')).join()).join(' | ');
      return { mix: mix.fixedUnit + ' ' + set(mix), wt: set(wt), n: stamp.wos.length, sets: stamp.wos.map((w) => w.x.reduce((a, x) => a + x.s.length, 0)).join(),
        yr: [d('15-Jan'), d('3/15'), d('Jan 15'), d('Jan 15 2024') ? 'y' : 'n'].join() }; });
    t.ok('a file of bare weights with one "60kg" is asked its unit, and the 60 kg comes in as 132.5 lb', r.mix === 'false bb-bench:185x8/132.5x8', r.mix);
    t.ok('BW is the body, BW+25 and +10 are added, the help on an assisted lift is kept, a minus elsewhere is no weight, "1,000" is a thousand',
      /^pullup:0x8\/25x6\/10x6,as-pullup:40x8,bb-bench:0x8,leg-press:1000x10$/.test(r.wt), r.wt);
    t.ok('a time on every row is still one workout a day, and a second session three hours later is its own', r.n === 3 && r.sets === '3,1,1', JSON.stringify(r));
    t.ok('a date with no year is not read as 2001', r.yr === ',,,y', r.yr);
    r = await p.evaluate(() => ['Pull Up (Weighted)', 'Chest Dip (Weighted)', 'Weighted Dips', 'Squats', 'OHP', 'DB Curls', 'RDL', 'Triceps Pushdown'].map((n) => window.Train._.sgMatch(n)).join());
    t.ok('names as people write them: (Weighted), plurals, OHP, DB and RDL', r.split(',').slice(0, 7).join() === 'pullup,dip,dip,bb-squat,bb-ohp,db-curl,bb-rdl' && r.split(',')[7] !== '', r);
    await p.close();

    // the same session from another app, a minute or two apart, is not brought in twice
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      h1: wo('h1', '', 0, 0, 3, [{ e: 'bb-bench', s: sets(185, [8]) }]) } });
    r = await p.evaluate(() => { const _ = window.Train._, st = _.state().T.wo.h1.st, dt = (ms) => { const d = new Date(st + ms), p2 = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
      const G = _.sgParse('Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n' + dt(90000) + ',Push,Bench Press (Barbell),1,185,8\n' + dt(3 * 3600000) + ',Legs,Squat (Barbell),1,225,5\n');
      return _.sgList(G, 0).map((w) => w.n).join(); });
    t.ok('the same session from another app, a minute and a half apart, is not brought in twice', r === 'Legs', r);
    await p.close();

    // any other spreadsheet: pasted, its columns matched once, remembered
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    r = await p.evaluate(() => ({ lab: [...document.querySelectorAll('.tr-sheet .tr-file, .tr-sheet [data-t="impaste"]')].map((e) => e.textContent.trim()).join('|') }));
    t.ok('Settings has one import for any app, and a paste', /Import from another app/.test(r.lab) && /Paste from a spreadsheet/.test(r.lab), r.lab);
    await p.click('[data-t="impaste"]');
    await p.fill('#trPaste', 'Day\tLift\tSets\tReps\tLoad (kg)\n24/09/2024\tBench Press\t3\t10\t60\n25/09/2024\tSquat\t5\t5\t100\n');
    await p.click('[data-t="impread"]');
    r = await p.evaluate(() => { const sh = document.querySelector('.tr-sheet');
      const sel = {}; sh.querySelectorAll('[data-imc]').forEach((s) => { sel[s.getAttribute('data-imc')] = s.options[s.selectedIndex].textContent; });
      return { title: sh.querySelector('.sheet-name').textContent, sel, peek: (sh.querySelector('.tr-fits') || {}).textContent || '',
        next: !sh.querySelector('[data-t="imok"]').disabled, order: !!sh.querySelector('[data-t="imord"]') }; });
    t.ok('a spreadsheet from no app it knows asks which column is which, with its guesses in place',
      r.title === 'Match the columns' && r.sel.date === 'Day' && r.sel.ex === 'Lift' && r.sel.n === 'Sets' && r.sel.r === 'Reps' && r.sel.w === 'Load (kg)', JSON.stringify(r));
    t.ok('the first workouts are shown read that way, day first worked out from “24/09”', /Sep 24 2024 · Bench Press 3 × 10 @ 60/.test(r.peek) && /Squat 5 × 5 @ 100/.test(r.peek) && r.next, JSON.stringify(r));
    await p.click('[data-t="imok"]');
    r = await p.evaluate(() => ({ title: (document.querySelector('.tr-sheet .sheet-name') || {}).textContent, go: (document.querySelector('[data-t="sggo"]') || {}).textContent || '',
      mem: Object.keys(JSON.parse(localStorage.getItem('sh.importMap') || '{}')).length }));
    t.ok('Next shows what would come in, and the matching is remembered for the same headings', r.title === 'From your file' && /Bring in 2 workouts/.test(r.go) && r.mem === 1, JSON.stringify(r));
    await p.click('[data-t="sgmap"][data-i="0"]');
    await p.click('#trainRoot .sheet-x');
    r = await p.evaluate(() => ({ title: (document.querySelector('.tr-sheet .sheet-name') || {}).textContent, go: !!document.querySelector('[data-t="sggo"]') }));
    t.ok('closing the lift picker goes back to the import, not out of it', r.title === 'From your file' && r.go, JSON.stringify(r));
    await p.click('[data-t="sggo"]');
    r = await p.evaluate(() => { const T = window.Train._.state().T, ws = Object.values(T.wo).sort((a, b) => a.st - b.st);
      return { n: ws.length, u: ws.map((w) => w.u).join(), sets: ws.map((w) => w.x.map((x) => x.e + ':' + x.s.map((z) => z.w + 'x' + z.r).join('/')).join()).join(' | '),
        banner: (document.querySelector('.tr-sgdone') || {}).textContent || '' }; });
    t.ok('in they come: a row that says 3 sets is three sets, in kg as the heading said',
      r.n === 2 && r.u === 'kg,kg' && r.sets === 'bb-bench:60x10/60x10/60x10 | bb-squat:100x5/100x5/100x5/100x5/100x5', JSON.stringify(r));
    t.ok('and History says where they came from', /Brought in 2 workouts from your file/.test(r.banner), r.banner);
    await p.close();

    // ---- a gym and home: your plates, your bar, weights you can load ----------------------
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, gy: { on: 1, u: 'lb', bar: 35, pl: { 45: 2, 10: 2, 5: 1 } } }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    r = await p.evaluate(() => { const _ = window.Train._, pm = (w, b, inv) => { const m = _.plateMath(w, b, 'lb', inv); return m.plates.join('+') + (m.left ? ' short ' + m.left : ''); };
      return { a: pm(225, 45, { 45: 2 }), b: pm(125, 45, { 25: 1, 20: 2 }), c: pm(315, 45, { 45: 2, 10: 1 }), std: pm(190, 45, null),
        up: _.snapHome(190, true), near: _.snapHome(190, false), max: _.homeLoads().slice(-1)[0] }; });
    t.ok('your plates: two 45s a side make 225; 20 + 20 when a 25 first would leave 15 no pair of yours makes; and what they can’t reach is said',
      r.a === '45+45' && r.b === '20+20' && r.c === '45+45+10 short 35' && r.std === '45+25+2.5', JSON.stringify(r));
    t.ok('at home a rising weight goes up to the next you can load, a held one to the nearest; the most you can load is known',
      r.up === 215 && r.near === 175 && r.max === 35 + 2 * (90 + 20 + 5), JSON.stringify(r));
    await p.close();

    p = await t.fresh();
    await seed(p, { pr: { qz: 1, pl: 'row', gy: { on: 1, u: 'lb', bar: 45, pl: { 45: 1, 25: 1, 10: 1, 5: 1 }, last: 'gym' } }, act: '', ms: {}, cx: {}, ax: {},
      wo: { h1: wo('h1', '', 0, 0, 3, [{ e: 'bb-bench', s: sets(185, [10, 10, 10]) }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="empty"]');
    await p.click('[data-t="addex"]');
    await p.click('.tr-pick[data-e="bb-bench"]');
    const benchAt = () => p.evaluate(() => { const c = document.querySelector('.tr-ex');
      return { where: (document.querySelector('[data-t="gyat"][aria-pressed="true"]') || {}).textContent || '', ph: document.querySelector('#trw-0-0').placeholder,
        note: (c.querySelector('.tr-homenote') || {}).textContent || '', bar: (c.querySelector('[data-t="barpick"]') || {}).textContent || '',
        pl: (document.querySelector('#trpl-0-0 .tr-stk') || {}).getAttribute ? document.querySelector('#trpl-0-0 .tr-stk').getAttribute('aria-label') : '' }; });
    r = await benchAt();
    t.ok('with a gym and home set up, a workout says which, starting where you were last; at the gym, the plan’s 190', r.where === 'Gym' && r.ph === '190' && !r.note, JSON.stringify(r));
    await p.click('[data-t="gyat"][data-v="home"]');
    r = await benchAt();
    t.ok('at home: the next weight your plates make, 195, and it says why', r.where === 'Home' && r.ph === '195' && /At home: 195 lb, the nearest your plates make \(the plan says 190\)/.test(r.note), JSON.stringify(r));
    t.ok('the row shows home’s plates; a home bar that weighs what the usual one does goes unsaid', /45, 25, 5 a side/.test(r.pl) && !r.bar, JSON.stringify(r));
    await p.click('[data-t="tick"][data-x="0"][data-s="0"]');
    await p.fill('#trr-0-0', '8');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[0].s[0].w);
    t.ok('ticked, the set is the weight you could load', r === 195, r);
    await p.evaluate(() => { const L = window.Train._.state().LIVE; L.x[0].s = L.x[0].s.filter((s) => s.t); });
    await p.click('[data-t="finish"]');
    await p.click('[data-t="save"]');
    await p.waitForSelector('.tr-done');
    r = await p.evaluate(() => { const T = window.Train._.state().T; return { g: Object.values(T.wo).filter((w) => w.id !== 'h1')[0].g, last: T.pr.gy.last }; });
    t.ok('the workout keeps that it was at home, and the next starts there', r.g === 'home' && r.last === 'home', JSON.stringify(r));
    await p.close();

    // setting it up
    p = await t.fresh();
    await seed(p, { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    await p.click('[data-t="s-gyon"][data-v="1"]');
    await p.click('[data-t="gypl"][data-v="45"][data-d="1"]');
    await p.click('[data-t="gypl"][data-v="2.5"][data-d="-1"]');
    await p.fill('#trGyBar', '35');
    await p.click('[data-t="gybar"]');
    await p.fill('#trBarDef', '44');
    await p.click('[data-t="s-barown"]');
    r = await p.evaluate(() => { const pr = window.Train._.state().T.pr; return { on: pr.gy.on, pl: JSON.stringify(pr.gy.pl), bar: pr.gy.bar, def: pr.bar,
      say: (document.querySelector('.tr-sheet') || {}).textContent.match(/The most you can load at home: [\d.]+ lb/) }; });
    t.ok('Settings sets up home: plates in pairs, a bar you type, and a default bar of any weight', r.on === 1 && r.pl === '{"5":2,"10":2,"25":1,"45":3}' && r.bar === 35 && r.def === 44 &&
      r.say && r.say[0] === 'The most you can load at home: ' + (35 + 2 * (135 + 25 + 20 + 10)) + ' lb', JSON.stringify(r));
    await p.close();

    // ---- quiet by default: help behind an i, Review as headlines, notes only for a change ----
    p = await t.fresh();
    {
      const b = await p.evaluate(() => { const ms = window.Train._.build({ dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] }); ms.id = 'qb'; return ms; });
      const x0 = b.days[0].s.map((z) => ({ e: z.e, s: sets(100, [10, 10, 10]) }));
      await seed(p, { pr: { qz: 1, u: 'lb' }, act: 'qb', ms: { qb: b }, cx: {}, ax: {}, wo: {
        a: wo('a', 'qb', 0, 0, 9, x0), b1: wo('b1', 'qb', 0, 1, 8, b.days[1].s.map((z) => ({ e: z.e, s: sets(100, [10, 10]) }))),
        c: wo('c', 'qb', 0, 2, 7, b.days[2].s.map((z) => ({ e: z.e, s: sets(100, [10, 10]) }))) } });
    }
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    r = await p.evaluate(() => ({ hints: document.querySelectorAll('#trainRoot .tr-settings .tr-hint').length, is: document.querySelectorAll('#trainRoot .tr-ibtn').length }));
    t.ok('settings: what each one does is behind an i, not a paragraph under every row', r.hints === 0 && r.is >= 5, JSON.stringify(r));
    await p.click('#trainRoot .tr-ibtn >> nth=1');
    r = await p.evaluate(() => ({ hints: document.querySelectorAll('#trainRoot .tr-settings .tr-hint').length, open: document.querySelectorAll('#trainRoot .tr-ibtn[aria-expanded="true"]').length }));
    t.ok('and the i opens its paragraph in place', r.hints === 1 && r.open === 1, JSON.stringify(r));
    /* An open i stays on its own paragraph when the sheet redraws with a
       hint added or taken away above it (review, 2026-09-28): keyed by
       order, it jumped to a different one. */
    await p.click('#trainRoot .tr-ibtn[aria-expanded="true"]');
    await p.click('#trainRoot .tr-ibtn >> nth=-1');
    const lastTip = await p.evaluate(() => (document.querySelector('#trainRoot .tr-info-t') || {}).textContent || '');
    for (const v of ['1', '0']) {
      await p.evaluate((v) => { const b = document.querySelector('#trainRoot [data-t="s-gyon"][data-v="' + v + '"]'); if (b) b.click(); }, v);
      await p.waitForTimeout(150);
    }
    await p.evaluate(() => { const b = document.querySelector('#trainRoot [data-t="s-gyon"][data-v="1"]'); if (b) b.click(); });
    await p.waitForTimeout(150);
    const stillTip = await p.evaluate(() => (document.querySelector('#trainRoot .tr-info-t') || {}).textContent || '');
    t.ok('and an open i keeps its own paragraph when a hint above it comes or goes',
      !!lastTip && stillTip === lastTip, JSON.stringify({ lastTip: lastTip.slice(0, 50), stillTip: stillTip.slice(0, 50) }));
    await p.evaluate(() => { const b = document.querySelector('#trainRoot [data-t="s-gyon"][data-v="0"]'); if (b) b.click(); });
    await p.waitForTimeout(150);
    await p.click('.sheet-x');
    await p.click('[data-t="sub"][data-v="review"]');
    r = await p.evaluate(() => ({ cards: document.querySelectorAll('.tr-check').length, bodies: document.querySelectorAll('.tr-check .tr-ck-b').length }));
    t.ok('Review: each check a one-line headline', r.cards >= 3 && r.bodies === 0, JSON.stringify(r));
    await p.click('.tr-check [data-t="ckopen"] >> nth=0');
    r = await p.evaluate(() => document.querySelectorAll('.tr-check .tr-ck-b').length);
    t.ok('which opens to its reasons on a tap', r === 1, r);
    r = await p.evaluate(() => {
      const _ = window.Train._, ms = _.state().T.ms.qb, pl = _.plan(ms, 1, 0);
      return { whys: pl.x.map((x) => x.why || ''), html: (() => { const d = document.createElement('div'); d.innerHTML = _.planList(pl, ms); return d.textContent; })() };
    });
    t.ok('a plan says nothing for a muscle held where it was, and a change in a few words with a why?',
      !/Held —/.test(r.html) && (!r.whys.some((w) => /^\+\d/.test(w)) || /why\?/.test(r.html)), r.html.slice(0, 200));
    await p.close();

    // ---- what the second look found ----
    p = await t.fresh();
    r = await p.evaluate(() => {
      const _ = window.Train._;
      return {
        // one pass: a lift's new name is never renamed again by the next
        name: _.dayName({ n: 'Deadlift & press', s: [{ m: 'dead', e: 'leg-press' }, { m: 'press', e: 'db-ohp' }] }),
        plain: _.dayName({ n: 'Squat day', s: [{ m: 'squat', e: 'bb-squat' }] }),
      };
    });
    t.ok('day names are rewritten in one pass', r.name === 'Leg press & dumbbell press' && r.plain === 'Squat day', JSON.stringify(r));
    await p.close();
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(p, { pr: { qz: 1, u: 'lb' }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="review"]');
    r = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      card: (document.querySelector('.tr-check.tr-info') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width }));
    t.ok('an empty Review is a card across the page, not a stray box that scrolls it sideways', r.over <= 0 && r.card > 300, JSON.stringify(r));
    await p.close();
    // a Review fix is one set, once: the log it is read from still says short until the next week
    p = await t.fresh();
    {
      const b = await p.evaluate(() => { const ms = window.Train._.build({ dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] }); ms.id = 'fx'; return ms; });
      const wos = {};
      [0, 1, 2, 3].forEach((d) => { wos['w' + d] = wo('w' + d, 'fx', 0, d, 10 - d, b.days[d].s.map((z) => ({ e: z.e, s: sets(100, [10]) }))); });
      await seed(p, { pr: { qz: 1, u: 'lb' }, act: 'fx', ms: { fx: b }, cx: {}, ax: {}, wo: wos });
    }
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="review"]');
    const fx1 = await p.evaluate(() => { const b = document.querySelector('[data-t="fixset"]'); return b ? { d: b.dataset.d, i: b.dataset.i, say: b.textContent } : null; });
    if (fx1) {
      const n0 = await p.evaluate((f) => window.Train._.state().T.ms.fx.days[f.d].s[f.i].n, fx1);
      await p.click('[data-t="fixset"]');
      r = await p.evaluate((f) => ({ n: window.Train._.state().T.ms.fx.days[f.d].s[f.i].n, again: !!document.querySelector('[data-t="fixset"][data-d="' + f.d + '"][data-i="' + f.i + '"]'),
        say: (document.querySelector('.tr-flash2') || {}).textContent || '' }), fx1);
      t.ok('a Review fix adds one set, says so, and is not offered again for the same week', r.n === n0 + 1 && !r.again && /Added a set/.test(r.say), JSON.stringify(Object.assign(r, { n0, fx1 })));
    } else {
      t.ok('a week one set short of five offers a fix', false, 'no fix button');
    }
    // last time's answers, untouched, move the sets by the standard step at most
    r = await p.evaluate(() => {
      const _ = window.Train._, T = _.state().T, ms = T.ms.fx, w0 = T.wo.w0, m = _.lib(ms.days[0].s[0].e).m;
      w0.fb = { [m]: { p: 0, k: 0, j: 0 } }; w0.sr = {};
      const free = _.feedback(ms, 0, 0, m).d;
      w0.fbp = { [m]: 1 };
      const pre = _.feedback(ms, 0, 0, m).d;
      return { free, pre };
    });
    t.ok('answers carried over untouched add at most the standard set a week', r.free === 2 && r.pre === 1, JSON.stringify(r));
    await p.close();

    // ---- Lifts: search, muscle, and where each is heading ----
    p = await t.fresh();
    await seed(p, { pr: { qz: 1, u: 'lb' }, act: '', ms: {}, cx: {}, ax: {}, wo: {
      a: wo('a', '', -1, -1, 40, [{ e: 'bb-bench', s: sets(185, [5, 5]) }, { e: 'leg-ext', s: sets(100, [12]) }]),
      b: wo('b', '', -1, -1, 35, [{ e: 'bb-bench', s: sets(195, [5, 5]) }, { e: 'lat-pd', s: sets(140, [10]) }]),
      c: wo('c', '', -1, -1, 2, [{ e: 'bb-bench', s: sets(205, [5, 5]) }, { e: 'leg-ext', s: sets(110, [12]) }]) } });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="lifts"]');
    r = await p.evaluate(() => ({ n: document.querySelectorAll('.tr-lrow').length, spark: !!document.querySelector('.tr-lrow[data-e="bb-bench"] .tr-spark'),
      ch: (document.querySelector('.tr-lrow[data-e="bb-bench"] .tr-l-c') || {}).textContent || '' }));
    t.ok('each lift carries a small line of its sessions and its change over four weeks', r.n === 3 && r.spark && /^\+\d+% in 4 weeks$/.test(r.ch), JSON.stringify(r));
    await p.fill('#trLiftQ', 'ext leg');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-lrow')].map((b) => b.dataset.e).join());
    t.ok('the search goes word by word, any order', r === 'leg-ext', r);
    t.ok('and the box keeps the cursor while you type', await p.evaluate(() => document.activeElement && document.activeElement.id === 'trLiftQ'));
    await p.fill('#trLiftQ', '');
    await p.click('[data-t="liftm"][data-v="back"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-lrow')].map((b) => b.dataset.e).join());
    t.ok('and a muscle narrows it', r === 'lat-pd', r);
    r = await p.evaluate(() => { const _ = window.Train._; return { tk: _.niceTicks(153, 169, 4).join(), tr: Math.round(_.trend4([[0, 100], [10 * 864e5, 104], [30 * 864e5, 110]]) * 100) }; });
    t.ok('charts sit on round numbers, and four weeks is held against the session four weeks before', r.tk === '150,155,160,165,170' && r.tr === 10, JSON.stringify(r));
    await p.click('[data-t="liftm"][data-v=""]');
    await p.click('.tr-lrow[data-e="bb-bench"]');
    await p.click('[data-t="extab"][data-v="charts"]');
    r = await p.evaluate(() => ({ read: (document.querySelector('.tr-chart-read') || {}).textContent || '', prs: document.querySelectorAll('svg.tr-chart .tr-dot.pr').length }));
    t.ok('a chart reads out its latest session, and its records are marked', /^Latest: /.test(r.read) && r.prs >= 2, JSON.stringify(r));
    const bx = await p.evaluate(() => { const b = document.querySelector('svg.tr-chart').getBoundingClientRect(); return { x: b.left + 3, y: b.top + b.height / 2 }; });
    await p.mouse.click(bx.x, bx.y);
    r = await p.evaluate(() => (document.querySelector('.tr-chart-read') || {}).textContent || '');
    t.ok('and a finger on it reads out the session under it', !/^Latest/.test(r) && / · /.test(r), r);
    await p.click('[data-t="crng"][data-v="1m"]');
    r = await p.evaluate(() => (document.querySelector('.tr-sheet .tr-note') || {}).textContent || '');
    t.ok('a range with fewer than two sessions says so', /Fewer than two sessions/.test(r), r);
    await p.close();

    // ---- the block's calendar: tap a box, that session is the card under it ----
    p = await t.fresh();
    await p.evaluate(() => {
      const _ = window.Train._; const ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] }); ms.id = 'cal'; ms.n = 'Calendar';
      ms.sk = ['1:1'];
      const now = Date.now(), wo = {};
      [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]].forEach(([w, d], i) => {
        const st = now - (6 - i) * 2 * 864e5, pl = _.plan(ms, w, d);
        wo['c' + i] = { id: 'c' + i, st, en: st + 3600e3, u: 'lb', ms: 'cal', w, d, n: pl.n,
          x: pl.x.map((x, k) => ({ e: x.e, s: Array.from({ length: x.sets }, (_, j) => ({ w: 50 + 10 * k + (i === 4 && k === 0 ? 60 : 0), r: 10, t: st + 60e3 * (k * 5 + j + 1) })) })), sr: {}, fb: {} };
      });
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'cal', ms: { cal: ms }, cx: {}, ax: {}, wo }));
      localStorage.removeItem('bsc.trainStamps'); _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(150);
    const cal = () => p.evaluate(() => {
      const c = document.getElementById('trSesh');
      return { cls: c ? c.className : '', eb: c ? c.querySelector('.tr-eyebrow').textContent : '', title: c ? c.querySelector('.tr-title').textContent : '',
        chips: c ? [...c.querySelectorAll('.tr-schip')].map((x) => x.textContent) : [], names: c ? c.querySelectorAll('.tr-snames li').length : 0,
        btns: c ? [...c.querySelectorAll('button')].map((b) => b.textContent) : [],
        sel: [...document.querySelectorAll('.tr-gc.sel')].map((x) => x.dataset.w + ':' + x.dataset.d).join(),
        cur: [...document.querySelectorAll('.tr-gc[aria-current="true"]')].map((x) => x.dataset.w + ':' + x.dataset.d).join(),
        prog: (document.querySelector('.tr-cstat') || {}).textContent || '', pct: (document.querySelector('.tr-cpct') || {}).textContent || '',
        hint: !!document.querySelector('.tr-ghint') };
    });
    r = await cal();
    t.ok('five done and one skipped of twenty: 30% through, the skip counted as behind you', /5 of 20 sessions, 1 skipped/.test(r.prog) && /1 of 4 this week/.test(r.prog) && r.pct === '30%', JSON.stringify(r));
    t.ok('nothing tapped: the next session is chosen, and it is the card with Start', r.sel === '1:2' && r.cur === '1:2' && /tr-next/.test(r.cls) && r.btns.some((b) => /Start/.test(b)) && r.hint, JSON.stringify(r));
    t.ok('the card says the session in a few numbers and each exercise by name', r.chips.some((c) => /min$/.test(c)) && r.chips.some((c) => /exercises/.test(c)) && r.names >= 4, JSON.stringify(r));
    await p.click('.tr-gc[data-w="1"][data-d="0"]');
    r = await cal();
    t.ok('a done box: what was lifted, and the record in it', r.sel === '1:0' && /^Done · /.test(r.eb) && /tr-sesh-done/.test(r.cls) &&
      r.chips.some((c) => /lb moved/.test(c)) && r.chips.some((c) => /1 record/.test(c)) && r.btns.includes('See what you did'), JSON.stringify(r));
    t.ok('and the hint to tap goes once a box has been', !r.hint);
    t.ok('the box keeps the focus, for a keyboard', await p.evaluate(() => document.activeElement && document.activeElement.matches('.tr-gc[data-w="1"][data-d="0"]')));
    await p.click('#trSesh [data-t="wosheet"]');
    t.ok('and it opens the workout itself', await p.evaluate(() => !!document.querySelector('.tr-sheet')));
    await p.evaluate(() => { const b = document.querySelector('.tr-sheet [data-t="close"]'); if (b) b.click(); });
    await p.waitForTimeout(100);
    await p.click('.tr-gc[data-w="2"][data-d="1"]');
    r = await cal();
    t.ok('a box to come: planned, with its effort and how many sets it has gained on week one', /^Planned · Week 3 of 5/.test(r.eb) &&
      r.chips.some((c) => /sets on week 1$/.test(c)) && r.chips.some((c) => /to spare/.test(c)) && r.btns.includes('Start it early'), JSON.stringify(r));
    await p.click('#trSesh [data-t="planopen"]');
    r = await p.evaluate(() => ({ plan: !!document.querySelector('#trSesh .tr-plan'), sel: document.querySelector('.tr-gc.sel').dataset.w }));
    t.ok('its full plan opens in place, on the box still chosen', r.plan && r.sel === '2', JSON.stringify(r));
    await p.click('.tr-gc[data-w="1"][data-d="1"]');
    r = await cal();
    t.ok('a skipped box says so, and can be done after all', /^Skipped/.test(r.eb) && r.btns.includes('Do it after all') && r.names > 0, JSON.stringify(r));
    await p.click('#trSesh [data-t="gridsel"]');
    r = await cal();
    t.ok('Back to the next one goes back to it', r.sel === '1:2' && /tr-next/.test(r.cls), JSON.stringify(r));
    await p.click('.tr-gc[data-w="3"][data-d="3"]');
    await p.click('#trSesh [data-t="start"]');
    r = await p.evaluate(() => { const L = window.Train._.state().LIVE; return L ? L.w + ':' + L.d : ''; });
    t.ok('and Start it early starts that one', r === '3:3', r);
    await p.close();

    /* A session started Saturday at 23:40 and saved after midnight, on a
       block lifting Tuesday, Thursday, Friday and Saturday. The done column
       kept its usual day, Tue, and the next session slid onto Tuesday too:
       two columns read "Tue". The done one now says the day it was done. */
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.setFixedTime(new Date(2026, 9, 4, 0, 10));
    await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'b'; ms.n = 'Autumn push'; ms.at = new Date(2026, 9, 1).getTime();
      const pl = _.plan(ms, 0, 0), st = new Date(2026, 9, 3, 23, 40).getTime();
      const wo = { w1: { id: 'w1', st, en: st + 30 * 60e3, dk: '2026-10-03', u: 'lb', ms: 'b', w: 0, d: 0, n: pl.n,
        x: pl.x.map((x) => ({ e: x.e, s: [{ w: 80, r: 8, t: st + 60e3 }] })), sr: {}, fb: {} } };
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [1, 3, 4, 5] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo }));
      localStorage.removeItem('bsc.trainStamps'); _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="block"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-ghd')].map((e) => e.textContent + (e.classList.contains('moved') ? '*' : '')));
    t.ok('after a session that ran past midnight its column says the day it was done, and no two columns say the same day',
      r.join() === 'Sat*,Tue*,Thu*,Fri*', r.join());
    await p.close();

    // ---- History by block: the mesocycles, named, kept, looked back on, run again ----
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.evaluate(() => {
      const _ = window.Train._, day = 864e5, now = Date.now(), wo = {}, ax = {};
      const old = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] }); old.id = 'old'; old.n = 'Winter bulk'; old.at = now - 80 * day;
      const cur = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [], seed: 1 }); cur.id = 'cur'; cur.n = 'Spring block'; cur.at = now - 14 * day;
      const dropped = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] }); dropped.id = 'dropped'; dropped.at = now - 20 * day;
      let n = 0;
      const log = (ms, w, d, st, bump) => { const pl = _.plan(ms, w, d); const id = 'w' + (n++);
        wo[id] = { id, st, en: st + 3600e3, u: 'lb', ms: ms.id, w, d, n: pl.n,
          x: pl.x.map((x, k) => ({ e: x.e, s: Array.from({ length: x.sets }, (_, j) => ({ w: 70 + 10 * k + bump, r: 10, t: st + 60e3 * (k * 5 + j + 1) })) })), sr: {}, fb: {} }; };
      for (let w = 0; w < 5; w++) for (let d = 0; d < 4; d++) { if (w === 2 && d === 3) continue; log(old, w, d, old.at + (w * 7 + d * 2) * day, w * 5); }
      old.sk = ['2:3'];
      [[0, 0], [0, 1]].forEach(([w, d]) => log(cur, w, d, cur.at + (w * 7 + d * 2) * day, 30));
      ax.a1 = { id: 'a1', k: 'walk', st: old.at + 10 * day, min: 45, lv: 'm' };
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'cur', ms: { old, cur, dropped }, cx: {}, ax, wo }));
      localStorage.removeItem('bsc.trainStamps'); _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="history"]');
    r = await p.evaluate(() => ({
      seg: [...document.querySelectorAll('[data-t="hview"]')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')).join(),
      rows: [...document.querySelectorAll('.tr-brow')].map((b) => b.querySelector('.tr-h-n').textContent + '|' + b.querySelector('.tr-btag').textContent) }));
    t.ok('History opens by block: the current one first, then the finished one; one begun and never trained is not a block',
      r.seg === 'Blocks:true,Workouts:false' && JSON.stringify(r.rows) === JSON.stringify(['Spring block|Current', 'Winter bulk|Finished']), JSON.stringify(r));
    // the lift that rose most wrapped wherever the sessions line ran out, "+33%" alone on the next line
    r = await p.evaluate(() => {
      const row = [...document.querySelectorAll('.tr-brow')].find((b) => /Winter bulk/.test(b.textContent));
      const metas = [...row.querySelectorAll('.tr-h-meta')], tail = row.querySelector('.tr-bup'), up = tail && tail.querySelector('.tr-up');
      return { tail: tail ? tail.textContent : '', sessions: metas[1] ? metas[1].textContent : '',
        own: !!tail && tail.getBoundingClientRect().top >= metas[1].getBoundingClientRect().bottom - 1,
        together: !!up && Math.abs(up.getBoundingClientRect().top - tail.getBoundingClientRect().top) < 4 };
    });
    t.ok('the lift that rose most has a line of its own under the sessions, its name and its rise together',
      /\S\u00a0\+\d+%$/.test(r.tail) && /sessions/.test(r.sessions) && !/%/.test(r.sessions) && r.own && r.together, JSON.stringify(r));
    await p.click('[data-t="hbopen"][data-id="old"]');
    r = await p.evaluate(() => ({
      eb: document.querySelector('.tr-hblk .tr-eyebrow').textContent, name: document.querySelector('.tr-hbt .tr-title').textContent,
      chips: [...document.querySelectorAll('.tr-hblk .tr-schip')].map((c) => c.textContent),
      cells: document.querySelectorAll('.tr-hblk .tr-gc').length, done: document.querySelectorAll('.tr-hblk .tr-gc.done').length,
      skip: document.querySelectorAll('.tr-hblk .tr-gc.skip').length, next: document.querySelectorAll('.tr-hblk .tr-gc.next').length,
      wkday: document.querySelectorAll('.tr-hblk .tr-ghd').length,
      lifts: document.querySelectorAll('.tr-blifts li').length, up: /→/.test((document.querySelector('.tr-blifts li') || {}).textContent || ''),
      vol: document.querySelectorAll('.tr-bvol [role="row"]').length, volHead: [...document.querySelectorAll('.tr-bvol [role="columnheader"]')].map((c) => c.textContent).join(),
      outside: [...document.querySelectorAll('.tr-card .tr-ql')].some((q) => /Outside the gym/.test(q.textContent)),
      note: !!document.getElementById('trBlkNote'), again: !!document.querySelector('[data-t="hbagain"]') }));
    t.ok('a finished block says so, with its name, its sessions and its skip', r.eb === 'Finished' && r.name === 'Winter bulk' &&
      r.chips.some((c) => /19 of 20 sessions, 1 skipped/.test(c)) && r.chips.some((c) => /records?/.test(c)), JSON.stringify(r));
    t.ok('nineteen hours of it say "19 h", not "19 h 00"', r.chips.includes('19 h lifting'), JSON.stringify(r.chips));
    t.ok('its calendar is all there: nineteen done, one skipped, nothing next and no weekdays of this week under a block gone by',
      r.cells === 20 && r.done === 19 && r.skip === 1 && r.next === 0 && r.wkday === 0, JSON.stringify(r));
    t.ok('with what each lift did over it', r.lifts > 0 && r.up, JSON.stringify(r));
    t.ok('the hard sets per muscle week by week, the deload marked', r.vol > 3 && r.volHead === ',W1,W2,W3,W4,DL', r.volHead);
    t.ok('what was done outside the gym while it ran, a place for notes, and Run it again', r.outside && r.note && r.again, JSON.stringify(r));
    // "‹ All blocks" is 44 px tall, and all 44 of them answer a tap, not 40
    r = await p.evaluate(() => {
      const b = document.querySelector('[data-t="hbclose"]');
      b.scrollIntoView({ block: 'center' });
      const a = b.getBoundingClientRect(), miss = [];
      [a.left + 3, a.left + a.width / 2, a.right - 3].forEach((x) => {
        for (let y = Math.ceil(a.top); y < Math.floor(a.bottom); y++) { const h = document.elementFromPoint(x, y); if (!h || !(h === b || b.contains(h))) miss.push(Math.round(x) + ',' + y); }
      });
      return { h: Math.round(a.height), miss };
    });
    t.ok('the way back to all blocks answers a tap over its whole 44 px', r.h >= 44 && !r.miss.length, JSON.stringify(r));
    await p.click('.tr-hblk [data-t="hbsel"][data-w="1"][data-d="2"]');
    r = await p.evaluate(() => ({ eb: (document.querySelector('#trSesh .tr-eyebrow') || {}).textContent || '', see: !!document.querySelector('#trSesh [data-t="wosheet"]'),
      start: !!document.querySelector('#trSesh [data-t="start"]') }));
    t.ok('a box on it opens that session: what was lifted, and the way into the workout, with nothing to start', /^Done · /.test(r.eb) && r.see && !r.start, JSON.stringify(r));
    await p.click('.tr-hblk [data-t="hbsel"][data-w="2"][data-d="3"]');
    r = await p.evaluate(() => (document.querySelector('#trSesh .tr-eyebrow') || {}).textContent || '');
    t.ok('and the skipped one says it was skipped', /^Skipped/.test(r), r);
    // notes, kept and synced
    await p.fill('#trBlkNote', 'Shoulder cranky in week 3.');
    await p.waitForTimeout(800);
    r = await p.evaluate(() => { const st = window.Train._.state(); return { note: st.T.ms.old.note, stamped: st.TS.ms && st.TS.ms.old > 0,
      kept: JSON.parse(localStorage.getItem('bsc.train')).ms.old.note }; });
    t.ok('a note on the block is kept with it, on this phone and for the account', r.note === 'Shoulder cranky in week 3.' && r.stamped && r.kept === r.note, JSON.stringify(r));
    // rename
    await p.click('[data-t="hbren"][data-id="old"]');
    await p.fill('#trBlkName', 'Winter bulk 2026');
    await p.keyboard.press('Enter');
    r = await p.evaluate(() => ({ shown: (document.querySelector('.tr-hbt .tr-title') || {}).textContent, stored: window.Train._.state().T.ms.old.n }));
    t.ok('renamed with Enter, and it stays renamed', r.shown === 'Winter bulk 2026' && r.stored === 'Winter bulk 2026', JSON.stringify(r));
    await p.click('[data-t="hbclose"]');
    r = await p.evaluate(() => [...document.querySelectorAll('.tr-brow .tr-h-n')].map((x) => x.textContent).join());
    t.ok('and the list says the new name', /Winter bulk 2026/.test(r), r);
    // run it again
    await p.click('[data-t="hbopen"][data-id="old"]');
    await p.click('[data-t="hbagain"][data-id="old"]');
    r = await p.evaluate(() => { const st = window.Train._.state(), d = st.S.draft, o = st.T.ms.old;
      return { sub: st.S.sub, name: (document.getElementById('trDraftName') || {}).value, same: !!d && JSON.stringify(d.days.map((x) => x.s.map((y) => y.e))) === JSON.stringify(o.days.map((x) => x.s.map((y) => y.e))),
        fresh: !!d && d.id !== 'old' && !(d.sk || []).length && !d.note, ends: /Starting it ends/.test(document.querySelector('#trBody').textContent),
        shuffle: !!document.querySelector('[data-t="shuffle"]') }; });
    t.ok('Run it again opens the same days and exercises as a new block, named as before, nothing of its progress carried',
      r.sub === 'block' && r.name === 'Winter bulk 2026' && r.same && r.fresh, JSON.stringify(r));
    t.ok('it says the current block ends if it starts, and offers no different exercises it has nowhere to draw from', r.ends && !r.shuffle, JSON.stringify(r));
    await p.fill('#trDraftName', 'Winter bulk, again');
    await p.click('[data-t="begin"]');
    r = await p.evaluate(() => { const st = window.Train._.state(), a = st.T.ms[st.T.act]; return { name: a && a.n, old: !!st.T.ms.old, cur: !!st.T.ms.cur }; });
    t.ok('the name typed before it starts is the block’s, and the blocks before it are all still kept', r.name === 'Winter bulk, again' && r.old && r.cur, JSON.stringify(r));
    // the Block card goes to its own page
    await p.click('[data-t="hbopen"]');
    r = await p.evaluate(() => ({ sub: window.Train._.state().S.sub, eb: (document.querySelector('.tr-hblk .tr-eyebrow') || {}).textContent || '' }));
    t.ok('the Block card’s Details opens this block in History', r.sub === 'history' && /^Current/.test(r.eb), JSON.stringify(r));
    await p.click('[data-t="hview"][data-v="wo"]');
    r = await p.evaluate(() => document.querySelectorAll('.tr-hrow').length);
    t.ok('and Workouts is every workout in a row, as it always was', r >= 21, String(r));
    await p.close();

    // ---- a block deleted, its workouts kept; a session put right from the calendar ----
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const perr = [];
    p.on('pageerror', (e) => perr.push(e.message));
    await p.evaluate(() => {
      const _ = window.Train._, day = 864e5, now = Date.now(), wo = {};
      const old = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] }); old.id = 'old'; old.n = 'Winter bulk'; old.at = now - 60 * day; old.note = 'Knees fine.';
      const cur = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [], seed: 1 }); cur.id = 'cur'; cur.n = 'Spring block'; cur.at = now - 10 * day;
      let n = 0;
      const log = (ms, w, d, st) => { const pl = _.plan(ms, w, d); const id = 'w' + (n++);
        wo[id] = { id, st, en: st + 3600e3, u: 'lb', ms: ms.id, w, d, n: pl.n,
          x: pl.x.map((x, k) => ({ e: x.e, s: Array.from({ length: x.sets }, (_, j) => ({ w: 80 + 10 * k + 5 * w, r: 10, t: st + 60e3 * (k * 5 + j + 1) })) })), sr: {}, fb: {} }; };
      for (let w = 0; w < 3; w++) for (let d = 0; d < 3; d++) log(old, w, d, old.at + (w * 7 + d * 2) * day);
      log(cur, 0, 0, cur.at + day);
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 2, 4] }, act: 'cur', ms: { old, cur }, cx: {}, ax: {}, wo }));
      localStorage.removeItem('bsc.trainStamps'); _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="history"]');
    await p.click('[data-t="hbopen"][data-id="old"]');
    // Edit, one tap from the box
    await p.click('.tr-hblk [data-t="hbsel"][data-w="1"][data-d="0"]');
    r = await p.evaluate(() => [...document.querySelectorAll('#trSesh .tr-acts button')].map((b) => b.textContent));
    t.ok('a done session on a block’s calendar offers Edit beside See what you did', r.includes('Edit') && r.includes('See what you did'), JSON.stringify(r));
    await p.click('#trSesh [data-t="woedit"]');
    r = await p.evaluate(() => !!document.querySelector('.tr-sheet input[data-ed="w"]'));
    t.ok('and Edit opens the workout already being corrected', r);
    const wid = await p.evaluate(() => Object.values(window.Train._.state().T.wo).find((w) => w.ms === 'old' && w.w === 1 && w.d === 0).id);
    await p.fill('.tr-sheet input[data-ed="w"][data-x="0"][data-s="0"]', '123');
    await p.click('.tr-sheet [data-t="edsave"]');
    await p.waitForTimeout(150);
    r = await p.evaluate((id) => { const w = window.Train._.state().T.wo[id]; return { w: w.x[0].s[0].w, ed: !!w.ed }; }, wid);
    t.ok('the corrected set is saved, and the workout says it was edited', r.w === 123 && r.ed, JSON.stringify(r));
    await p.evaluate(() => { const b = document.querySelector('.tr-sheet [data-t="close"]'); if (b) b.click(); });
    await p.waitForTimeout(150);
    // Delete this block
    t.ok('a block’s page offers Delete this block', await p.evaluate(() => !!document.querySelector('[data-t="hbdel"][data-id="old"]')));
    await p.click('[data-t="hbdel"][data-id="old"]');
    await p.waitForTimeout(250);
    r = await p.evaluate(() => { const d = document.querySelector('#dialogRoot .dlg'); return d ? d.textContent : ''; });
    t.ok('it asks first, and says the workouts stay', /Delete this block\?/.test(r) && /9 workouts stay in Workouts and Lifts/.test(r), r);
    await p.click('#dialogRoot .btn-primary.danger');
    await p.waitForTimeout(250);
    r = await p.evaluate(() => { const st = window.Train._.state();
      return { gone: !st.T.ms.old, kept: Object.values(st.T.wo).filter((w) => w.ms === 'old').length, stamped: st.TS.ms && st.TS.ms.old > 0,
        act: st.T.act, rows: [...document.querySelectorAll('.tr-brow .tr-h-n')].map((x) => x.textContent).join(), page: !!document.querySelector('.tr-hblk') }; });
    t.ok('the block is gone, stamped for the other devices, and History is back on the list without it',
      r.gone && r.stamped && !r.page && r.rows === 'Spring block' && r.act === 'cur', JSON.stringify(r));
    t.ok('every one of its workouts is kept', r.kept === 9, JSON.stringify(r));
    await p.click('[data-t="hview"][data-v="wo"]');
    r = await p.evaluate(() => ({ rows: document.querySelectorAll('.tr-hrow').length, fixed: [...document.querySelectorAll('.tr-hrow')].length }));
    t.ok('and Workouts still lists all ten', r.rows === 10, JSON.stringify(r));
    await p.click('[data-t="hview"][data-v="blk"]');
    // not while a workout of the block is going
    await p.click('[data-t="sub"][data-v="block"]');
    await p.click('[data-t="start"]');
    await p.waitForTimeout(150);
    t.ok('a workout of the current block is going', await p.evaluate(() => { const L = window.Train._.state().LIVE; return !!L && L.ms === 'cur'; }));
    await p.click('[data-t="minim"]');
    await p.click('[data-t="sub"][data-v="history"]');
    await p.click('[data-t="hbopen"][data-id="cur"]');
    t.ok('meanwhile its block cannot be deleted', await p.evaluate(() => !document.querySelector('[data-t="hbdel"]')));
    // the workout set aside, as Discard would
    await p.evaluate(() => { localStorage.removeItem('sh.trainLive'); window.Train._.reload(); });
    await p.click('[data-t="hbclose"]');
    await p.click('[data-t="hbopen"][data-id="cur"]');
    await p.click('[data-t="hbdel"][data-id="cur"]');
    await p.waitForTimeout(250);
    r = await p.evaluate(() => (document.querySelector('#dialogRoot .dlg') || {}).textContent || '');
    t.ok('the current block says it stops being current', /stops being your current block/.test(r), r);
    await p.click('#dialogRoot .btn-primary.danger');
    await p.waitForTimeout(250);
    r = await p.evaluate(() => { const st = window.Train._.state(); return { act: st.T.act, ms: Object.keys(st.T.ms).join(), wos: Object.keys(st.T.wo).length }; });
    t.ok('deleting the current block ends it, and still keeps every workout', r.act === '' && r.ms === '' && r.wos === 10, JSON.stringify(r));
    // the medal on the lift that earned it (with no block left, History is the workouts)
    if (await p.$('[data-t="hview"][data-v="wo"]')) await p.click('[data-t="hview"][data-v="wo"]');
    r = await p.evaluate(() => { const _ = window.Train._, T = _.state().T;
      const wo = Object.values(T.wo).find((w) => _.prsIn(w).length);
      if (!wo) return { none: true };
      const want = [...new Set(_.prsIn(wo).map((x) => x.e))];
      const row = document.querySelector('.tr-hrow[data-id="' + wo.id + '"] .tr-h-x');
      const lines = row ? row.innerHTML.split('<br>') : [];
      return { want: want.length, medals: lines.filter((l) => /🥇/.test(l)).length,
        right: wo.x.every((x, i) => /🥇/.test(lines[i] || '') === want.includes(x.e)) }; });
    t.ok('in Workouts, each lift that set a record wears the medal, and only those', !r.none && r.medals === r.want && r.right, JSON.stringify(r));
    t.ok('no page errors through any of it', perr.length === 0, perr.join(' | '));
    await p.close();

    // ---- the end of a rest: a call that carries over music, heard when it is chosen ----
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.addInitScript(() => {
      window.__notes = [];
      class FakeAC {
        constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
        resume() {}
        createBiquadFilter() { return { type: '', frequency: {}, connect() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        createOscillator() { const o = { type: 'sine', frequency: {}, connect() {}, start(t) { o.t = t; }, stop(t) { window.__notes.push({ f: o.frequency.value, type: o.type, a: o.t, b: t }); } }; return o; }
      }
      window.AudioContext = FakeAC; window.webkitAudioContext = FakeAC;
    });
    await p.reload();
    await p.waitForTimeout(600);
    await p.click('.tab[data-view="train"]');
    await openSettings(p);
    await p.click('[data-t="s-snd"][data-v="0"]');
    await p.click('[data-t="s-snd"][data-v="1"]');
    r = await p.evaluate(() => ({ n: window.__notes.length, span: Math.max(...window.__notes.map((x) => x.b)), sq: window.__notes.every((x) => x.type === 'square'),
      hi: Math.min(...window.__notes.map((x) => x.f)), say: /Tap Beep and buzz to hear it/.test(document.querySelector('.tr-sheet').textContent) }));
    t.ok('choosing Beep and buzz plays it: three bursts of a high two-note call, about a second and a half, and says so',
      r.n === 6 && r.span > 1.2 && r.span < 2 && r.sq && r.hi >= 1000 && r.say, JSON.stringify(r));
    await p.close();

    // ---- a rest's end calls again until you touch the screen ----
    {
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.install();
    await p.addInitScript(() => {
      window.__notes = 0;
      class FakeAC {
        constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
        resume() {}
        createBiquadFilter() { return { frequency: {}, connect() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        createOscillator() { return { frequency: {}, connect() {}, start() {}, stop() { window.__notes++; } }; }
      }
      window.AudioContext = FakeAC; window.webkitAudioContext = FakeAC;
    });
    await p.reload();
    await p.clock.runFor(800);
    await p.evaluate(() => {
      const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 3, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'b'; ms.n = 'Block'; ms.at = Date.now();
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 2, 4] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: {} }));
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="block"]');
    await p.click('[data-t="start"]');
    await p.clock.runFor(300);
    const notes = () => p.evaluate(() => window.__notes);
    await p.mouse.click(5, 400);              // a tap, which is what lets a page make sound
    const r0 = await notes();
    await p.evaluate(() => window.Train._.ringRest());
    const r1 = await notes();
    await p.clock.runFor(6100);
    const r2 = await notes();
    await p.mouse.click(5, 400);
    await p.clock.runFor(13000);
    const r3 = await notes();
    t.ok('a rest’s end calls, calls again six seconds on, and a touch on the screen stops it',
      r1 - r0 === 6 && r2 - r1 === 6 && r3 === r2 && !(await p.evaluate(() => window.Train._.ringing())), JSON.stringify([r0, r1, r2, r3]));
    await p.evaluate(() => window.Train._.ringRest());
    const m0 = await notes();
    await p.clock.runFor(60000);
    const m1 = await notes();
    t.ok('left alone, it gives up after half a minute: the first call and five more', m1 - m0 === 30, String(m1 - m0));
    await p.close();
    }

    // ---- Collapsed Done-for-today card & Review 2x2 KPI + Front/Back Muscle Heatmap ----
    {
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.evaluate(() => {
      const _ = window.Train._, now = Date.now(), day = 864e5;
      const ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'hm'; ms.n = 'Upper & Lower'; ms.at = now - 10 * day;
      const wo = {};
      let n = 0;
      const log = (w, d, st) => {
        const pl = _.plan(ms, w, d), id = 'h' + (n++);
        wo[id] = { id, st, en: st + 35 * 60e3, u: 'lb', ms: ms.id, w, d, n: pl.n,
          x: pl.x.map((x, k) => ({ e: x.e, s: Array.from({ length: x.sets }, (_, j) => ({ w: 90 + 10 * k + 5 * w, r: 10, t: st + 60e3 * (k * 5 + j + 1) })) })), sr: {}, fb: {} };
      };
      // Complete Week 1 (w=0, d=0..3) and log Week 2 Day 0 (w=1, d=0) TODAY
      [0, 1, 2, 3].forEach((d) => log(0, d, now - (9 - d * 2) * day));
      log(1, 0, now - 3600e3);
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'hm', ms: { hm: ms }, cx: {}, ax: {}, wo }));
      localStorage.removeItem('bsc.trainStamps'); _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.click('[data-t="sub"][data-v="block"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => {
      const c = document.getElementById('trSesh');
      return {
        doneCard: !!c && c.classList.contains('tr-done-card'),
        open: !!c && c.classList.contains('is-open'),
        title: (c && c.querySelector('.tr-title') || {}).textContent || '',
        badge: (c && c.querySelector('.tr-dc-badge') || {}).textContent || '',
        names: c ? c.querySelectorAll('.tr-snames li').length : -1,
        peekBtn: !!c && !!c.querySelector('[data-t="peeknext"]')
      };
    });
    t.ok('Done for today card is collapsed by default when a workout was logged today',
      r.doneCard && !r.open && r.title === 'Done for today ✓' && /Workout logged/.test(r.badge) && r.names === 0 && r.peekBtn, JSON.stringify(r));
    await p.click('#trSesh [data-t="peeknext"]');
    r = await p.evaluate(() => {
      const c = document.getElementById('trSesh');
      return { open: !!c && c.classList.contains('is-open'), names: c ? c.querySelectorAll('.tr-snames li').length : 0, start: !!c.querySelector('[data-t="start"]') };
    });
    t.ok('tapping Preview expands tomorrow’s exercises and Start it anyway', r.open && r.names >= 4 && r.start, JSON.stringify(r));
    await p.click('#trSesh [data-t="peeknext"]');
    r = await p.evaluate(() => !!document.querySelector('#trSesh.is-open'));
    t.ok('tapping Hide preview collapses the card back down', !r);

    // Switch to Review tab and verify 2x2 KPI grid, 5-week block strip, and Front/Back Muscle Heatmap
    await p.click('[data-t="sub"][data-v="review"]');
    await p.waitForTimeout(100);
    r = await p.evaluate(() => ({
      kpiCards: document.querySelectorAll('.tr-week .tr-kpi-card').length,
      blkWeeks: document.querySelectorAll('.tr-bprog .tr-bp-wk').length,
      svgs: document.querySelectorAll('.tr-hm-card .tr-hm-svg').length,
      musRows: document.querySelectorAll('.tr-hm-card .tr-mus-row').length,
      title: (document.querySelector('.tr-hm-card .tr-title') || {}).textContent || '',
      mids: document.querySelectorAll('.tr-hm-card .tr-hm-svg .hm-mid, .tr-hm-card .tr-hm-svg .hm-low, .tr-hm-card .tr-hm-svg .hm-hit').length
    }));
    t.ok('Review shows 2x2 KPI cards, 5-week block progress strip, and Front & Back SVG muscle heatmap for the active week',
      r.kpiCards === 4 && r.blkWeeks === 5 && r.svgs === 2 && r.musRows >= 6 && /Week 2 muscle coverage/.test(r.title) && r.mids > 0, JSON.stringify(r));

    await p.click('.tr-hm-card [data-t="revwk"][data-w="0"]');
    r = await p.evaluate(() => ({
      title: (document.querySelector('.tr-hm-card .tr-title') || {}).textContent || '',
      hits: document.querySelectorAll('.tr-hm-card .tr-hm-svg .hm-hit').length
    }));
    t.ok('selecting completed Week 1 lights up the muscle heatmap at 100% plan hit',
      /Week 1 muscle coverage/.test(r.title) && r.hits >= 6, JSON.stringify(r));

    await p.click('.tr-hm-card [data-t="revwk"][data-w="4"]');
    r = await p.evaluate(() => ({
      title: (document.querySelector('.tr-hm-card .tr-title') || {}).textContent || '',
      sets: [...document.querySelectorAll('.tr-hm-card .tr-mus-sets')].map((s) => s.textContent.trim())
    }));
    t.ok('selecting Deload week updates the muscle heatmap to Deload planned sets',
      /Deload week muscle coverage/.test(r.title) && r.sets.length >= 6, JSON.stringify(r));
    await p.close();
    }
  },
};
