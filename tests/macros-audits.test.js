/* Targets that follow the scale once a week, and what the algorithm audits
 * of 22 to 28 September found: the arrival estimate, the block planning the
 * carbs, a shut meal's rows, and why Fill added what it added.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, goDay, stepDay, openMeal: openMeal0, closeSheet, openRow, openRowOf } = require('./fixtures/nourish.js');

/* Opens one meal's sheet the way a thumb does, if it is not open already.
   Since 2026-10-04 the day is trays, and a meal's plates and verbs are in
   its sheet, opened from its tray. */
async function openMeal(pg, sk) {
  const on = await pg.evaluate(() => {
    const d = document.querySelector('#modalRoot .msheet [data-mbal], #modalRoot .msheet [data-mmenu]');
    return d ? (d.dataset.mbal || d.dataset.mmenu) : (document.querySelector('#modalRoot .msheet') ? '?' : '');
  });
  if (on === sk) return;
  if (on) await closeSheet(pg);
  await openMeal0(pg, sk);
}

module.exports = nourish({
  name: 'Macros — targets that follow the scale, and the audits',
  async suite(t) {
    /* ---- targets follow the scale, once a week ------------------------
     *
     * Blake chose it: the saved grams catch up with the weight weekly, RP
     * style, and the app says so. A week with nothing on the scale moves
     * nothing, grams somebody typed are theirs, and Undo gives them back. */
    {
      const fp = await t.fresh();
      const seed = (targ) => fp.evaluate((tg) => {
        const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n);
          const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.clear();
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut2', goalLb: 0, goalBy: '' }));
        const w = {};
        for (let i = 0; i < 7; i++) w[key(i)] = 190;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
        if (tg) localStorage.setItem('bsc.macroTargets', JSON.stringify(
          Object.assign({}, tg, tg.set !== undefined ? { set: key(tg.set) } : {})));
      }, targ);
      const read = () => fp.evaluate(() => ({
        rec: JSON.parse(localStorage.getItem('bsc.macroTargets')),
      }));

      await seed({ p: 205, f: 68, c: 170, set: 9 });
      await fp.reload();
      await fp.click('.tab[data-view="macros"]');
      await fp.waitForTimeout(300);
      const moved = await read();
      const r = moved.rec;
      t.ok('a week on, the saved grams follow the scale',
        r.p !== 205 && r.auto === 1 && r.moved && r.moved.prev.p === 205 &&
        r.moved.to === 4 * r.p + 4 * r.c + 9 * r.f, JSON.stringify(r));
      const notice = await fp.textContent('#macroWeigh');
      t.ok('and the card says so, with both numbers',
        /Targets updated for your weight/.test(notice) &&
        notice.indexOf(Number(r.moved.to).toLocaleString()) >= 0, notice.slice(0, 300));

      await fp.click('[data-mline="mline:moved:undo"]');
      await fp.waitForTimeout(200);
      const undone = (await read()).rec;
      t.ok('Undo puts the old grams back and leaves them alone after',
        undone.p === 205 && undone.f === 68 && undone.c === 170 && undone.auto === 0 && !undone.moved,
        JSON.stringify(undone));
      await fp.reload();
      await fp.waitForTimeout(300);
      t.ok('so the next load does not move them again', (await read()).rec.p === 205);

      await seed({ p: 205, f: 68, c: 170, set: 3 });
      await fp.reload();
      await fp.waitForTimeout(300);
      t.ok('inside the week, nothing moves', (await read()).rec.p === 205);

      await seed({ p: 205, f: 68, c: 170, set: 9, auto: 0 });
      await fp.reload();
      await fp.waitForTimeout(300);
      t.ok('grams somebody typed are never moved', (await read()).rec.p === 205);

      await fp.evaluate(() => {
        localStorage.setItem('bsc.macroWeights', JSON.stringify({ '2020-01-01': 190 }));
        const tg = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        delete tg.auto; localStorage.setItem('bsc.macroTargets', JSON.stringify(tg));
      });
      await fp.reload();
      await fp.waitForTimeout(300);
      t.ok('and a week with nothing on the scale moves nothing', (await read()).rec.p === 205);
      await fp.context().close();
    }

    /* ---- the algorithm audit, 2026-09-22 ------------------------------
     *
     * Each of these was reproduced against v466 before it was fixed, and each
     * asserts the thing the audit found broken. */
    {
      const ap = await t.fresh();
      const today = await ap.evaluate(() => { const d = new Date(); const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); });
      const seedAll = (o) => ap.evaluate((obj) => {
        localStorage.clear();
        Object.keys(obj).forEach((k) => localStorage.setItem(k, JSON.stringify(obj[k])));
      }, o);
      const draftWith = (seed) => ap.evaluate((sd) => {
        let a = sd;
        Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a);
          q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
        window.__macroLab.draft();
        return JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      }, seed);

      // Fill does not add to a meal that is locked, or that has a plate ticked.
      let intruded = [];
      for (const sd of [1, 2, 3, 4, 5, 6]) {
        await seedAll({ 'bsc.macroTargets': { p: 180, f: 50, c: 50 }, 'bsc.macroDays': { [today]: {
          d: [{ id: 'f:chicken_breast', x: 1, eaten: 0, l: 1 }],
          b: [{ id: 'f:chicken_breast', x: 1, eaten: 1 }, { id: 'f:tuna', x: 1, eaten: 0 }] } } });
        await ap.reload();
        const days = await draftWith(sd);
        const d = days[today];
        if (d.d.length !== 1 || d.b.length !== 2 || d.b[1].x !== 1) intruded.push(sd + ':' + JSON.stringify({ d: d.d, b: d.b }));
      }
      t.ok('Fill adds nothing to a locked meal or one with a plate ticked, and resizes nothing there',
        !intruded.length, intruded.join(' | '));

      // Anything Fill places as a single food stays under its salt and portion ceilings.
      let over = [];
      /* Three meals skipped, so the whole day lands on the snack — the shape
         that, with no ceiling on the solver's rungs, served chicken at four
         cups (560 g) in 21 of 30 seeds. */
      for (const sd of [1, 2, 3, 4, 5, 6, 7, 8]) {
        await seedAll({ 'bsc.macroTargets': { p: 180, f: 50, c: 50 },
          'bsc.macroSkip': { [today]: ['b', 'l', 'd'] } });
        await ap.reload();
        const days = await draftWith(sd);
        const bad = await ap.evaluate((d) => {
          const F = window.__macroLab.foods(), by = {}; F.forEach((f) => { by[f.id] = f; });
          const out = [];
          Object.keys(d).forEach((sk) => (d[sk] || []).forEach((it) => {
            const r = by[it.id];
            if (!r || it.by !== 'f') return;
            const na = (r.macro.na || 0) * it.x, g = (r.grams || 0) * it.x;
            if (na > 400.5 || g > 400.5) out.push(r.name + ' x' + it.x + ' ' + Math.round(na) + 'mg ' + Math.round(g) + 'g');
          }));
          return out;
        }, days[today]);
        over = over.concat(bad);
      }
      t.ok('no single food Fill places carries more than 400 mg of salt or 400 g', !over.length, over.join(', '));

      // Six training days: the rest day keeps the floor and some carbohydrate, and the week averages to plan.
      await seedAll({ 'bsc.macroProfile': { sex: 'm', age: 43, ft: 5, inch: 11, lb: 205, act: 1.375,
        goal: 'cut1', goalLb: 0, goalBy: '', workouts: 6 } });
      await ap.reload();
      const cyc = await ap.evaluate(() => {
        const pr = window.__macroLab.profile();
        const plan = window.__macroLab.plan(pr);
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: plan.p, f: plan.f, c: plan.c }));
        const out = [];
        const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const p2 = (x) => (x < 10 ? '0' : '') + x;
          const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
          out.push(window.__macroLab.dayTargets(k));
          d.setDate(d.getDate() + 1);
        }
        return { plan, floor: window.__macroLab.floorK(pr), days: out };
      });
      const kc = (x) => 4 * x.p + 4 * x.c + 9 * x.f;
      const low = cyc.days.reduce((m, x) => (kc(x) < kc(m) ? x : m));
      const week = cyc.days.reduce((a, x) => a + kc(x), 0);
      t.ok('six training days leave the rest day on the floor, with carbohydrate on it',
        kc(low) >= cyc.floor - 2 && low.c > 0 && 4 * low.c >= 0.12 * kc(low),
        JSON.stringify({ low, floor: cyc.floor }));
      t.ok('and the week still averages to the plan', Math.abs(week - 7 * cyc.plan.kcal) <= 21,
        week + ' vs ' + 7 * cyc.plan.kcal);

      // Keeping a meal keeps it eaten, and keeps calories no gram accounts for.
      await seedAll({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.myFoods': { fp: { name: 'Friend plate', kcal: 700, unit: 'plate' } },
        'bsc.macroDays': { [today]: { l: [{ id: 'f:my:fp', x: 1, eaten: 1 },
          { id: 'f:chicken_breast', x: 1, eaten: 1 }] } } });
      await ap.reload();
      await ap.click('.tab[data-view="macros"]');
      await ap.waitForTimeout(300);
      /* Save meal lives in the meal's ⋯ menu, in its sheet (2026-10-04):
         Lunch is opened and its menu pressed. */
      await openMeal(ap, 'l');
      await ap.click('#modalRoot [data-mmenu="l"]');
      await ap.waitForTimeout(250);
      const keepOpen = await ap.$('[data-mkeep="l"]');
      t.ok('the finished meal offers Save meal from its menu', !!keepOpen);
      if (keepOpen) {
        await keepOpen.click();
        await ap.waitForTimeout(200);
        await ap.fill('#mkName', 'Lunch out');
        await ap.click('[data-mkdo="mine"]');
        await ap.waitForTimeout(300);
      }
      const kept = await ap.evaluate((k) => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[k];
        const f = window.__macroLab.foods().find((x) => x.id === 'f:my:lunch_out');
        return { l: d.l, kcal: f && f.macro.kcal };
      }, today);
      t.ok('keeping a finished meal as one leaves it eaten',
        kept.l.length === 1 && kept.l[0].eaten === 1, JSON.stringify(kept));
      t.ok('and counts the calories a calories-only part brought', kept.kcal >= 850, JSON.stringify(kept));

      // Batch Prep is not offered unasked, and one added by hand lands at lunch.
      const bp = await ap.evaluate(() => {
        const r = (window.RECIPES || []).find((x) => x.book === 1 && x.secNum === 7);
        return r ? r.id : null;
      });
      t.ok('a Batch Prep dish added by hand lands at lunch, not in a snack',
        bp !== null && (await ap.evaluate((id) => window.__macroLab.slotFor(id), bp)) === 'l');
      let offered = 0;
      for (const sd of [1, 2, 3, 4, 5, 6, 7, 8]) {
        await seedAll({ 'bsc.macroTargets': { p: 180, f: 60, c: 170 } });
        await ap.reload();
        const days = await draftWith(sd);
        offered += await ap.evaluate((d) => {
          let n = 0;
          Object.keys(d).forEach((sk) => (d[sk] || []).forEach((it) => {
            const r = (window.RECIPES || []).find((x) => x.id === it.id);
            if (r && r.book === 1 && r.secNum === 7) n++;
          }));
          return n;
        }, days[today]);
      }
      t.ok('and Fill does not serve Batch Prep containers unasked', offered === 0, offered + ' plates');
      await ap.context().close();
    }

    /* ---- the audit's second four, 2026-09-22 ------------------------ */
    {
      const bp = await t.fresh();
      const key = (n) => bp.evaluate((m) => { const d = new Date(); d.setDate(d.getDate() - m);
        const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }, n);
      const today = await key(0);

      /* Measured burn: food and weight over the same weeks. Lost 200 -> 180
         between four and two months ago, flat since, eating 2,400. The old
         window read weight from the first week ever against the last fortnight
         of food: "burning about 2,983". */
      await bp.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.clear();
        const w = {}, intake = {};
        for (let n = 120; n >= 60; n--) w[k(n)] = 200 - 20 * (120 - n) / 60;
        for (let n = 59; n >= 1; n--) w[k(n)] = 180;
        for (let n = 40; n >= 1; n--) intake[k(n)] = 2400;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
        localStorage.setItem('bsc.macroIntake', JSON.stringify(intake));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k(0)]: { b: [{ id: 'f:whey', x: 1, eaten: 1 }] } }));
      });
      await bp.reload();
      const meas = await bp.evaluate(() => window.__macroLab.measured());
      t.ok('measured burn reads food and weight over the same weeks',
        meas && Math.abs(meas.tdee - 2400) < 60, JSON.stringify(meas));
      const logged = await bp.evaluate((k) => JSON.parse(localStorage.getItem('bsc.macroIntake'))[k], today);
      t.ok('and today, not over yet, is not counted as a day', logged === undefined, String(logged));

      /* A mistyped morning is asked about, not stored. */
      await bp.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.clear();
        const w = {}; for (let n = 7; n >= 1; n--) w[k(n)] = 190;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
      });
      await bp.reload();
      await bp.click('.tab[data-view="macros"]');
      await bp.waitForTimeout(300);
      /* 1905 for 190.5 is past anything a person weighs: refused outright,
         with a reason. 290 for 190 could be a weight, so it is asked about. */
      await bp.fill('#mWeight', '1905');
      await bp.press('#mWeight', 'Tab');
      await bp.waitForTimeout(300);
      const big = await bp.evaluate((k) => ({ note: document.getElementById('mWeightNote').textContent,
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights'))[k] }), today);
      t.ok('a weight no person has is refused, with the reason', /A point missing/.test(big.note) &&
        big.stored === undefined, JSON.stringify(big));
      await bp.fill('#mWeight', '290');
      await bp.waitForTimeout(800);
      await bp.press('#mWeight', 'Tab');
      await bp.waitForTimeout(300);
      const asked = await bp.evaluate((k) => ({
        dlg: !!document.querySelector('[data-dlg="ok"]'),
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights'))[k],
      }), today);
      t.ok('a weight far from your average is asked about before it is written',
        asked.dlg && asked.stored === undefined, JSON.stringify(asked));
      if (asked.dlg) {
        await bp.click('button[data-dlg="cancel"]');
        await bp.waitForTimeout(200);
      }
      const still = await bp.evaluate((k) => JSON.parse(localStorage.getItem('bsc.macroWeights'))[k], today);
      t.ok('and declining it writes nothing', still === undefined, String(still));

      /* In kilograms when Strengthen weighs in kilograms. The box said "lb"
         whatever Strengthen said, and 86 — a kilogram reading — was stored as
         86 lb with no question, the weight the next plan would be built for.
         Storage stays in pounds; the box and its folded line speak kg. */
      await bp.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'kg' } }));
      });
      await bp.reload();
      await bp.click('.tab[data-view="macros"]');
      await bp.waitForTimeout(300);
      const kgBox = await bp.evaluate(() => {
        const b = document.getElementById('mWeight');
        return { unit: b ? b.closest('label').textContent.trim() : 'no box', aria: b ? b.getAttribute('aria-label') : '' };
      });
      t.ok('with Strengthen in kilograms the weigh-in box asks in kg',
        /^kg/.test(kgBox.unit) && /kilograms/.test(kgBox.aria), JSON.stringify(kgBox));
      await bp.fill('#mWeight', '86');
      await bp.press('#mWeight', 'Enter');
      await bp.waitForTimeout(300);
      const kgSaved = await bp.evaluate((k) => ({ dlg: !!document.querySelector('[data-dlg="ok"]'),
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')[k] }), today);
      t.ok('and 86 typed there is kept as the pounds 86 kg is, without a question',
        !kgSaved.dlg && Math.abs(kgSaved.stored - 86 * 2.20462) <= 0.05, JSON.stringify(kgSaved));
      await bp.reload();
      await bp.click('.tab[data-view="macros"]');
      await bp.waitForTimeout(300);
      const kgFold = await bp.evaluate(() => (document.querySelector('.mw-sum') || {}).textContent || '');
      await bp.click('.mday-weigh [data-mfold]');
      await bp.waitForTimeout(250);
      const kgBack = await bp.evaluate(() => (document.getElementById('mWeight') || {}).value);
      t.ok('and the morning is said back in kg, folded and in the box',
        /^86 kg/.test(kgFold.trim()) && kgBack === '86', JSON.stringify({ kgFold, kgBack }));

      /* In pounds, a first-ever morning under 90 is asked about: with nothing
         to compare it to, a kilogram number in a pound box is the likely
         mistake, and it used to pass anything over 60. */
      await bp.evaluate(() => localStorage.clear());
      await bp.reload();
      await bp.click('.tab[data-view="macros"]');
      await bp.waitForTimeout(300);
      await bp.fill('#mWeight', '86');
      await bp.press('#mWeight', 'Enter');
      await bp.waitForTimeout(300);
      const lightFirst = await bp.evaluate((k) => ({ title: (document.getElementById('dlgT') || {}).textContent || '',
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')[k] }), today);
      t.ok('a first-ever 86 lb is asked about before it is written',
        lightFirst.title === 'Keep 86 lb?' && lightFirst.stored === undefined, JSON.stringify(lightFirst));
      if (lightFirst.title) {
        await bp.click('button[data-dlg="cancel"]');
        await bp.waitForTimeout(200);
      }

      /* A device with an account decides its targets after the account answers. */
      await bp.context().route('**://www.gstatic.com/**', (r) => r.abort());
      await bp.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.clear();
        localStorage.setItem('bsc.myAccount', '1');
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut2', goalLb: 0, goalBy: '' }));
        const w = {}; for (let i = 0; i < 7; i++) w[k(i)] = 190;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 68, c: 170, set: k(9) }));
      });
      await bp.reload();
      await bp.waitForTimeout(1500);
      const held = await bp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroTargets')));
      t.ok('a device with an account does not move its targets before the account has answered',
        held.p === 205 && !held.moved, JSON.stringify(held));

      /* A plate ticked on an open meal is not counted against the day twice. */
      await bp.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 150, f: 60, c: 215 }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k(0)]: {
          d: [{ id: 'f:chicken_breast', x: 2, eaten: 0 }, { id: 'f:tuna', x: 1, eaten: 0 }] } }));
      });
      await bp.reload();
      const asks = () => bp.evaluate(() => ['b', 'l', 'd', 's'].map((sk) => {
        const a = window.__macroLab.ask(sk); return a ? Math.round(a.now.kcal) : null; }).join(','));
      const before = await asks();
      await bp.evaluate((k) => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        days[k].d[0].eaten = 1;
        localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      }, today);
      await bp.reload();
      const after = await asks();
      t.ok('ticking one plate of an open meal changes no meal\'s ask', before === after, before + ' → ' + after);
      await bp.context().close();
    }

    /* ---- the audit's third batch, 2026-09-22 ------------------------- */
    {
      const cp = await t.fresh();
      const K = (n) => cp.evaluate((m) => { const d = new Date(); d.setDate(d.getDate() - m);
        const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }, n);
      const today = await K(0);
      const put = (o) => cp.evaluate((obj) => { localStorage.clear();
        Object.keys(obj).forEach((k) => localStorage.setItem(k, JSON.stringify(obj[k]))); }, o);

      // The headline forecasts the day the meals are asking for.
      await put({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.myFoods': { big: { name: 'Big breakfast', p: 50, f: 40, c: 200 } },
        'bsc.macroDays': { [today]: { b: [{ id: 'f:my:big', x: 1, eaten: 1 }] } } });
      await cp.reload();
      const fc = await cp.evaluate(() => {
        const a = window.__macroLab.assumed();
        return { asm: Math.round(a.kcal) };
      });
      t.ok('the headline forecasts the day the empty meals are asked for, not their first shares',
        Math.abs(1360 + fc.asm - 2000) <= 60, JSON.stringify(fc));

      // Weights for pace tests: a month, flat.
      const month = (lb) => { const w = {}; return cp.evaluate((l) => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        const ww = {}; for (let n = 30; n >= 0; n--) ww[k(n)] = l;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(ww));
        return k; }, lb); };

      // A gain goal is capped on the way up, like a cut on the way down.
      await put({ 'bsc.macroProfile': { sex: 'm', age: 30, ft: 5, inch: 10, lb: 150, act: 1.55,
        goal: 'gain', goalLb: 165, goalBy: await K(-20), goalSet: await K(30), goalFrom: 150 } });
      await month(150);
      await cp.reload();
      const gain = await cp.evaluate(() => {
        const pf = window.__macroLab.pace();
        return pf && { need: pf.need, burn: Math.round(pf.burn), capHigh: pf.capHigh };
      });
      t.ok('a gain goal never asks for more than the plan\'s own gain limit',
        gain && gain.need !== null && gain.need <= gain.burn * 1.2 + 1 && gain.capHigh, JSON.stringify(gain));

      // A goal date gone: the line stops at the goal, and the card says so.
      await put({ 'bsc.macroTargets': { p: 170, f: 60, c: 180 },
        'bsc.macroProfile': { sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.375,
        goal: 'cut2', goalLb: 190, goalBy: await K(10), goalSet: await K(60), goalFrom: 200 } });
      await month(190.1);
      await cp.reload();
      const past = await cp.evaluate(() => ({ pace: window.__macroLab.pace(), face: window.__macroLab.face().html }));
      t.ok('past its date, at its weight, a goal is not "behind" and asks for nothing',
        past.pace && past.pace.side === 'on' && past.pace.need === null, JSON.stringify(past.pace && past.pace.side));
      t.ok('and the card says the date has passed rather than asking for one',
        /the date has passed/.test(past.face) && !/name a weight and a date/.test(past.face), past.face);

      // A preset cut asks no more of the fat store than a dated goal may.
      await put({ 'bsc.macroProfile': { sex: 'm', age: 43, ft: 5, inch: 11, lb: 200, act: 1.375,
        goal: 'cut2', goalLb: 0, goalBy: '', bf: 15 } });
      await cp.reload();
      const lean = await cp.evaluate(() => {
        const pr = window.__macroLab.profile(), plan = window.__macroLab.plan(pr);
        const fat = window.__macroLab.bodyFat(pr), tdee = window.__macroLab.tdee(pr);
        return { kcal: plan.kcal, tdee: Math.round(tdee), fatLb: fat && fat.lb,
          floor: window.__macroLab.floorK(pr) };
      });
      t.ok('a lean body on a preset cut is not planned deeper than its fat can supply',
        lean.fatLb && lean.kcal >= lean.tdee - lean.fatLb * 22 - 5,
        JSON.stringify(lean));

      // The summary sheet agrees with the bars.
      await put({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.myFoods': { d: { name: 'Day', p: 150, f: 60, c: 242.5 } },
        'bsc.macroDays': { [today]: { d: [{ id: 'f:my:d', x: 1, eaten: 1 }] } } });
      await cp.reload();
      const sum = await cp.evaluate((k) => window.__macroLab.summary(k), today);
      t.ok('a day at 105.5% reads on target on the summary sheet, as on the bars',
        /ds-d on/.test(sum) && !/dial-over/.test(sum), (sum.match(/ds-d [a-z]+/) || [''])[0]);

      // Fill does not add to a day already over, and its button moves on.
      await put({ 'bsc.macroTargets': { p: 180, f: 60, c: 170 },
        'bsc.myFoods': { m: { name: 'Meals', p: 240, f: 70, c: 120 } },
        'bsc.macroDays': { [today]: { b: [{ id: 'f:my:m', x: 1, eaten: 1 }] } } });
      await cp.reload();
      await cp.click('.tab[data-view="macros"]');
      await cp.waitForTimeout(300);
      const over = await cp.evaluate((k) => {
        window.__macroLab.draft();
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[k];
        return { added: Object.keys(d).filter((sk) => sk !== 'b' && (d[sk] || []).length),
          mode: document.getElementById('macroFill').dataset.mode };
      }, today);
      t.ok('Fill adds nothing to a day already over its calories', !over.added.length, JSON.stringify(over));
      t.ok('and the button moves on instead of offering Fill again', over.mode !== 'fill', over.mode);
      await cp.context().close();
    }

    /* A screen left open across midnight: a tap acts on the day it shows. */
    {
      const ctx = await t.browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: 'block' });
      await ctx.route(/api\.nal\.usda\.gov/, (r) => r.abort());
      const mp = await ctx.newPage();
      mp.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
      await mp.clock.install({ time: new Date(2026, 8, 22, 23, 58, 0) });
      await mp.goto(t.base + 'index.html');
      await mp.evaluate(() => { localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 150, f: 60, c: 215 }));
        localStorage.setItem('bsc.myFoods', JSON.stringify({ a: { name: 'Late dessert', p: 5, f: 10, c: 40 },
          b: { name: 'Tomorrow oats', p: 10, f: 5, c: 50 } }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-09-22': { s: [{ id: 'f:my:a', x: 1, eaten: 0 }] },
          '2026-09-23': { s: [{ id: 'f:my:b', x: 1, eaten: 0 }] } })); });
      await mp.reload();
      await mp.waitForTimeout(500);
      await mp.click('.tab[data-view="macros"]');
      await mp.waitForTimeout(400);
      /* The tick is the meal's since the RP-style meal (Blake, 2026-10-04:
         "No individual foods ticks... I'll complete the whole meal"), so the
         snack — one plate — is opened and its meal tick pressed. */
      await openMeal(mp, 's');
      await mp.clock.fastForward('03:00');
      await mp.evaluate(() => { const b = document.querySelector('#macroSlots [data-mdot="s"]'); if (b) b.click(); });
      await mp.waitForTimeout(400);
      const mid = await mp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays')));
      t.ok('a tick after midnight lands on the plate it was pressed on, not the new day\'s',
        mid['2026-09-22'].s[0].eaten === 1 && mid['2026-09-23'].s[0].eaten === 0, JSON.stringify(mid));
      await ctx.close();
    }

    /* ---- the audit's fourth batch, 2026-09-23 ------------------------ */
    {
      const dp = await t.fresh();
      const today = await dp.evaluate(() => { const d = new Date(); const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); });
      const yest = await dp.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); });
      const put = (o) => dp.evaluate((obj) => { localStorage.clear();
        Object.keys(obj).forEach((k) => localStorage.setItem(k, JSON.stringify(obj[k]))); }, o);

      // The add sheet judges a meal as its card does.
      await put({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.myFoods': { a: { name: 'Lunch 80', p: 33.6, f: 13.6, c: 48, unit: 'serving' } },
        'bsc.macroDays': { [today]: { l: [{ id: 'f:my:a', x: 1, eaten: 0 }] } } });
      await dp.reload();
      await dp.click('.tab[data-view="macros"]');
      await dp.waitForTimeout(300);
      /* Lunch's tray says its calories against its share in its flame pill,
         coloured by where they stand (2026-10-05); the sheet it opens says
         the same in its own. Read shut, then opened. */
      const cardSt = await dp.evaluate(() => {
        const k = document.querySelector('[data-mopen="l"]').closest('.mtray').querySelector('.mtray-caps .mcap');
        return [k.classList.contains('over') ? 'x' : k.classList.contains('on') ? 'o' : 'u',
          k.textContent.replace(/[^\d/]/g, '')];
      });
      await openMeal(dp, 'l');
      const sheetSt = await dp.evaluate(() => {
        const k = document.querySelector('#modalRoot .msh-top .mcap');
        return k ? [k.classList.contains('over') ? 'x' : k.classList.contains('on') ? 'o' : 'u',
          k.querySelector('.mcap-t').textContent.replace(/[^\d/]/g, '')] : [];
      });
      t.ok('the add sheet calls a meal what its tray calls it', cardSt.join() === sheetSt.join(),
        cardSt.join() + ' vs ' + sheetSt.join());
      await closeSheet(dp);

      // A past day keeps the targets it was lived against.
      await put({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.macroDayT': { [yest]: { p: 150, f: 60, c: 215 } } });
      await dp.reload();
      const before = await dp.evaluate((k) => window.__macroLab.dayTargets(k), yest);
      await dp.evaluate(() => localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 150, f: 60, c: 140 })));
      await dp.reload();
      const after = await dp.evaluate((k) => window.__macroLab.dayTargets(k), yest);
      const todayT = await dp.evaluate((k) => window.__macroLab.dayTargets(k), today);
      t.ok('changing the plan today does not re-judge yesterday', before.c === 215 && after.c === 215 && todayT.c === 140,
        JSON.stringify({ before, after, todayT }));

      // One cookie of forty-eight opens the batch, not "0 cup butter".
      const cookie = await dp.evaluate(() => { const r = window.RECIPES.find((x) => x.servN >= 48); return r && r.id; });
      await put({ 'bsc.macroDays': { [today]: { s: [{ id: cookie, x: 1, eaten: 0 }] } } });
      await dp.reload();
      await dp.click('.tab[data-view="macros"]');
      await dp.waitForTimeout(300);
      await openMeal(dp, 's');
      await openRowOf(dp, '#modalRoot .mitem [data-open="' + cookie + '"]');
      await dp.click('.mitem [data-open="' + cookie + '"]');
      await dp.waitForTimeout(300);
      const sheet = await dp.evaluate(() => (document.querySelector('.sheet') || {}).textContent || '');
      t.ok('one of a big batch opens the batch, with no zero quantities', !/(^|\s)0 (cup|tbsp|tsp|oz|lb)/.test(sheet) &&
        !/for 2\s*⅜ servings/.test(sheet), (sheet.match(/(^|\s)0 (cup|tbsp|tsp|oz|lb)[^,]{0,20}/) || [''])[0]);

      // Two family dinners both go on the day; a Batch Prep dish finds dinner when lunch is taken.
      const fam = await dp.evaluate(() => {
        const R = window.RECIPES;
        const dinners = R.filter((x) => x.book === 2 && x.secNum === 3 && x.macro).slice(0, 2).map((x) => x.id);
        const prep = R.find((x) => x.book === 1 && x.secNum === 7 && x.macro).id;
        return { dinners, prep };
      });
      const wd = await dp.evaluate(() => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]);
      await dp.evaluate(() => localStorage.clear());
      await dp.reload();
      await dp.evaluate(([f, d]) => {
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 170 }));
        f.dinners.forEach((id) => window.Store.addToDay(id, d));
        window.Store.addToDay(f.prep, d);
      }, [fam, wd]);
      await dp.evaluate((k) => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        days[k] = { l: [{ id: 'f:chicken_breast', x: 1, eaten: 0 }] };
        localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      }, today);
      await dp.reload();
      const famDay = await dp.evaluate((k) => { window.__macroLab.draft();
        return JSON.parse(localStorage.getItem('bsc.macroDays'))[k]; }, today);
      const onDay = (id) => Object.keys(famDay).some((sk) => (famDay[sk] || []).some((it) => it.id === id));
      t.ok('both family dinners go on the day', fam.dinners.every(onDay), JSON.stringify(famDay.d));
      t.ok('and the Batch Prep dish finds dinner when lunch is taken', onDay(fam.prep), JSON.stringify(famDay));

      // Oil is never a topper.
      let oil = 0;
      for (const sd of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        await put({ 'bsc.macroTargets': { p: 180, f: 50, c: 50 } });
        await dp.reload();
        oil += await dp.evaluate((a0) => {
          let a = a0;
          Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a);
            q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
          window.__macroLab.draft();
          const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
          const F = {}; window.__macroLab.foods().forEach((f) => { F[f.id] = f; });
          let n = 0;
          Object.values(d).forEach((day) => Object.values(day).forEach((list) => (list || []).forEach((it) => {
            const r = F[it.id]; if (!r || it.by !== 'f') return;
            const m = r.macro; if (4 * ((m.p || 0) + (m.c || 0)) < 0.10 * (m.kcal || 0)) n++;
          })));
          return n;
        }, sd);
      }
      t.ok('Fill never tops a day up with a food that is nearly all fat', oil === 0, oil + ' plates');
      await dp.context().close();
    }

    /* ---- the audit's small ones, 2026-09-23 -------------------------- */
    {
      const ep = await t.fresh();
      const K = (n) => ep.evaluate((m) => { const d = new Date(); d.setDate(d.getDate() - m);
        const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }, n);
      const today = await K(0), tomorrow = await K(-1);
      const put = (o) => ep.evaluate((obj) => { localStorage.clear();
        Object.keys(obj).forEach((k) => localStorage.setItem(k, JSON.stringify(obj[k]))); }, o);

      /* The strip and the bar agree at the edge. A food's calories are whole,
         so the fraction comes from the portion: 0.4 of 5,326 is 2,130.4 —
         over 2,130 (106.5% of 2,000) unrounded, and not once rounded. */
      await put({ 'bsc.macroTargets': { p: 150, f: 60, c: 215 },
        'bsc.myFoods': { e: { name: 'Edge', p: 300, f: 150, c: 694 } },
        'bsc.macroDays': { [today]: { d: [{ id: 'f:my:e', x: 0.4, eaten: 1 }] } } });
      await ep.reload();
      await ep.click('.tab[data-view="macros"]');
      await ep.waitForTimeout(300);
      const edge = await ep.evaluate((k) => {
        const b = document.querySelector('.mwk-d[data-mweek="' + k + '"]');
        return { strip: b ? b.className : '', kcal: 0.4 * window.__macroLab.foods().find((f) => f.id === 'f:my:e').macro.kcal };
      }, today);
      t.ok('the week strip and the bar give a day at the edge the same verdict',
        edge.kcal > 2130 && edge.kcal < 2130.5 && /\bover\b/.test(edge.strip), JSON.stringify(edge));

      // Looking at tomorrow does not write the routine onto it.
      await put({ 'bsc.macroSlots': { list: [{ k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:whey', x: 1 }] },
        { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: {} } });
      await ep.reload();
      await ep.click('.tab[data-view="macros"]');
      await ep.waitForTimeout(300);
      await stepDay(ep, 1);
      await ep.waitForTimeout(150);
      const tmr = await ep.evaluate((k) => (JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'))[k] || null, tomorrow);
      const tdy = await ep.evaluate((k) => (JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'))[k] || null, today);
      t.ok('browsing to tomorrow writes nothing onto it; today still gets its pins',
        tmr === null && tdy && (tdy.b || []).some((it) => it.id === 'f:whey'), JSON.stringify({ tmr, tdy }));

      // "Try another" hands Fill its pick.
      await put({ 'bsc.macroTargets': { p: 180, f: 60, c: 170 } });
      await ep.reload();
      await ep.click('.tab[data-view="macros"]');
      await ep.waitForTimeout(300);
      await ep.evaluate(() => window.__macroLab.draft());
      await ep.reload();
      await ep.click('.tab[data-view="macros"]');
      await ep.waitForTimeout(300);
      const wasD = await ep.evaluate((k) => (JSON.parse(localStorage.getItem('bsc.macroDays'))[k].d || []).map((it) => it.id), today);
      /* What the ↻ Another button calls; the button itself only shows once a
         meal's actions are opened. */
      const tryBtn = await ep.evaluate(() => { window.__macroLab.tryAgain('d'); return true; });
      await ep.waitForTimeout(300);
      const tried = await ep.evaluate((k) => (JSON.parse(localStorage.getItem('bsc.macroDays'))[k].d || []), today);
      const swapped = tried.filter((it) => wasD.indexOf(it.id) < 0);
      t.ok('a dish from "Try another" is Fill\'s to size',
        !!tryBtn && swapped.length > 0 && swapped.every((it) => it.by === 'f'),
        JSON.stringify({ button: !!tryBtn, was: wasD, now: tried }));

      // Coming back to the app follows the scale, not only a cold start.
      /* Weights before the load (they live in memory once loaded); the
         targets after it, so the boot-time follow has nothing to move and
         only the resume can. */
      await put({ 'bsc.macroProfile': { sex: 'm', age: 43, ft: 5, inch: 11, lb: 205, act: 1.375,
        goal: 'cut2', goalLb: 0, goalBy: '' } });
      await ep.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        const w = {}; for (let i = 0; i < 7; i++) w[k(i)] = 190;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
      });
      await ep.reload();
      await ep.evaluate(() => {
        const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); const p2 = (x) => (x < 10 ? '0' : '') + x;
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 68, c: 170, set: k(9) }));
      });
      await ep.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await ep.waitForTimeout(200);
      const resumed = await ep.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroTargets')));
      t.ok('the weekly follow runs when the app is resumed, not only when it starts',
        resumed.p !== 205 && resumed.moved, JSON.stringify(resumed));
      await ep.context().close();
    }

    /* ---- the arrival estimate, 2026-09-23 ----------------------------
     * Blake: "not telling me I'm behind but that my target date estimate has
     * moved from when to when." Read over three weeks, so a salty weekend
     * does not erase a trend; and a flat scale gives no date rather than an
     * invented one. */
    {
      const ap2 = await t.fresh();
      const seedW = (fn) => ap2.evaluate((src) => {
        const f = new Function('i', 'return ' + src);
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const w = {};
        for (let i = 21; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); w[key(d)] = Math.round(f(i) * 10) / 10; }
        localStorage.clear();
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
        const g = new Date(); g.setDate(g.getDate() + 120);
        const s0 = new Date(); s0.setDate(s0.getDate() - 21);
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 210,
          act: 1.375, goal: 'cut1', goalLb: 185, goalBy: key(g), goalSet: key(s0), goalFrom: 210 }));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 65, c: 180 }));
      }, fn);
      // a pound a week for three weeks, then two salty mornings
      await seedW("210 - (21 - i) / 7 + (i <= 1 ? 2.5 : 0)");
      await ap2.reload();
      const salty = await ap2.evaluate(() => { const pf = window.__macroLab.pace();
        return { rate3: pf && pf.rate3, arrive: pf && pf.arrive, dWeek: pf && pf.st.dWeek }; });
      t.ok('two salty mornings do not erase a three-week trend from the estimate',
        salty.arrive && salty.rate3 < -0.3, JSON.stringify(salty));
      await seedW("205 + (i % 2 ? 0.2 : -0.2)");
      await ap2.reload();
      await ap2.click('.tab[data-view="macros"]');
      await ap2.waitForTimeout(300);
      const flat = await ap2.evaluate(() => (document.querySelector('.mline') || {}).textContent || '');
      t.ok('a flat scale gives no arrival date rather than inventing one',
        /no arrival date yet/.test(flat) && !/Arriving around/.test(flat), flat);
      /* Blake, 2026-09-25: "That I'll meet my goal by 2029??" Down a fifth of
         a pound a week on a plan that needs well over one, the arithmetic
         said Sep 2029. Too slow to date: the card gives the rate. */
      await seedW("210 - (21 - i) * 0.2 / 7");
      await ap2.reload();
      await ap2.click('.tab[data-view="macros"]');
      await ap2.waitForTimeout(300);
      await ap2.click('#macroWeigh [data-mfold]');
      await ap2.waitForTimeout(200);
      const slow = await ap2.evaluate(() => ({
        pf: window.__macroLab.pace(),
        chip: [...document.querySelectorAll('.mw-chip')].map((e) => e.textContent).join('|'),
        line: (document.querySelector('.mline') || {}).textContent || '',
        card: (document.querySelector('#macroWeigh') || {}).textContent || '' }));
      t.ok('a crawl gives the rate, not a date years out',
        !slow.pf.arriveD && slow.pf.slow === 0.2 && /down 0\.2 lb a week/.test(slow.chip) &&
        !/20[2-9]\d|weeks late/.test(slow.card + slow.line), JSON.stringify({ chip: slow.chip, slow: slow.pf.slow, line: slow.line }));
      t.ok('and the chip wears the behind colour',
        await ap2.evaluate(() => !!document.querySelector('.mw-chip.behind')));
      await ap2.context().close();
    }

    /* ---- the block plans the carbs, what you do wins, 2026-09-25 -------
     * Blake: "I have a block setup now and it should pipe to Nourish", and
     * "the plan might be planned but I also might ad hoc go to the gym, or
     * skip a day sometimes." The block's lifting days drive Nourish; a skip or
     * an extra day moves today, and the rest of the week makes it up. */
    {
      /* On a fixed Wednesday, not whatever day the suite runs: what these
         check is how the days left in the week make up for today, and how
         many days are left changes with the day. A Saturday, with only Sunday
         left, has its own check at the end. */
      const NOW = new Date(2026, 8, 23, 9, 0, 0);
      const sp = await t.fresh();
      await sp.clock.install({ time: NOW });
      await sp.reload();
      const seedBlock = async (ld, own) => {
        await sp.evaluate(([ld, own]) => {
          const p2 = (n) => (n < 10 ? '0' : '') + n;
          const d = new Date(), key = (x) => x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate());
          const ws = {};
          for (let i = 6; i >= 1; i--) { const dd = new Date(d); dd.setDate(dd.getDate() - i); ws[key(dd)] = 205; }
          localStorage.clear();
          localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
          localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 61, c: 75 }));
          /* Nourish's own days: none of them today, so only the block can say so. */
          localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, lb: 205,
            ft: 5, inch: 10, act: 1.55, goal: 'cut1', goalLb: 0, goalBy: '', workouts: 3, steps: 7000, train: own || [] }));
          localStorage.setItem('bsc.train', JSON.stringify({ act: 'b1', pr: { ld: ld, qz: 1 }, ms: { b1: { n: 'Upper / Lower', acc: 4,
            days: [{ n: 'Upper A', s: [{ e: 'db-bench', n: 3 }] }, { n: 'Lower A', s: [{ e: 'goblet', n: 3 }] }] } } }));
        }, [ld, own]);
        await sp.reload();
        await sp.click('.tab[data-view="macros"]');
        await sp.waitForTimeout(250);
        const f = await sp.$('[data-mfold="weigh"][aria-expanded="false"]');
        if (f) { await f.click(); await sp.waitForTimeout(200); }
      };
      const look = () => sp.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (x) => x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate());
        const d = new Date(), wk = (d.getDay() + 6) % 7, week = [];
        for (let i = 0; i < 7; i++) { const x = new Date(d); x.setDate(x.getDate() - wk + i); week.push(window.__macroLab.dayTargets(key(x)).c); }
        return { wk, week, sum: week.reduce((a, b) => a + b, 0), today: week[wk],
          row: (document.querySelector('.mw-train') || {}).textContent || '',
          btn: (document.querySelector('.mw-train button') || {}).textContent || '',
          tick: (document.querySelector('.mw-train .mw-tick') || { getAttribute: () => '' }).getAttribute('aria-pressed') };
      });
      const wd = NOW.getDay(), todayIx = (wd + 6) % 7;
      const two = [0, 1, 2, 3, 4, 5, 6].filter((i) => i !== todayIx).slice(0, 2);

      // synced: today is a training day in the block, and there is nothing to press
      await seedBlock([todayIx].concat(two).sort());
      const lift = await look();
      t.ok('synced, the block’s training day is Nourish’s, named by its next session, with no toggle',
        /Upper A today/.test(lift.row) && !lift.btn && !/[Ll]ift/.test(lift.row.replace('Upper A', '')) && lift.today > 75, JSON.stringify(lift));
      t.ok('and the planned week still averages to the plan',
        Math.abs(lift.sum - 7 * 75) <= 3, JSON.stringify(lift.week));

      // synced, a day off: nothing to press either
      await seedBlock(two);
      const off = await look();
      t.ok('synced, a day off says Rest day and asks nothing', /Rest day/.test(off.row) && !off.btn, JSON.stringify(off));

      // synced, a tick left over from before sync is not a hidden override
      await sp.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.setItem('bsc.macroTrained', JSON.stringify({ [k]: 1 }));
      });
      await sp.reload();
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      { const f5 = await sp.$('[data-mfold="weigh"][aria-expanded="false"]'); if (f5) { await f5.click(); await sp.waitForTimeout(200); } }
      t.ok('and an old tick cannot quietly override what Strengthen says', /Rest day/.test((await look()).row), (await look()).row);

      // synced, a planned day that ended with nothing logged was a rest day
      if (todayIx >= 1) {
        const yIx = todayIx - 1;
        await seedBlock([yIx, todayIx]);
        const before = await look();
        await sp.evaluate(() => {
          const T = JSON.parse(localStorage.getItem('bsc.train'));
          const st = Date.now() - 9 * 86400000;           // Strengthen in use before this week
          T.wo = { w0: { id: 'w0', n: 'Upper A', st: st, en: st + 1800000, x: [{ e: 'db-bench', s: [{ w: 60, r: 8 }] }] } };
          localStorage.setItem('bsc.train', JSON.stringify(T));
        });
        await sp.reload();
        await sp.click('.tab[data-view="macros"]');
        await sp.waitForTimeout(250);
        const after = await look();
        t.ok('synced, yesterday’s session with nothing logged counts as rest, and the carbs move on',
          after.week[yIx] < before.week[yIx] || after.today > before.today || (todayIx < 6 && after.week.slice(todayIx).some((c, i) => c > before.week[todayIx + i])),
          JSON.stringify({ before: before.week, after: after.week }));
        await sp.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.wo = {}; localStorage.setItem('bsc.train', JSON.stringify(T)); });
        await sp.reload();
        await sp.click('.tab[data-view="macros"]');
        await sp.waitForTimeout(250);
        t.ok('but not before Strengthen has any workout on record', JSON.stringify((await look()).week) === JSON.stringify(before.week));
      }

      // a planned day eaten as a training day, nothing logged: it owes the week nothing
      if (todayIx >= 1) {
        const yIx = todayIx - 1;
        await seedBlock([yIx, todayIx]);
        const plain = await look();
        await sp.evaluate(([yIx, c]) => {
          const p2 = (n) => (n < 10 ? '0' : '') + n, y = new Date(); y.setDate(y.getDate() - 1);
          const yk = y.getFullYear() + '-' + p2(y.getMonth() + 1) + '-' + p2(y.getDate());
          localStorage.setItem('bsc.macroDayT', JSON.stringify({ [yk]: { p: 205, f: 61, c: c } }));
          const T = JSON.parse(localStorage.getItem('bsc.train'));
          const st = Date.now() - 9 * 86400000;
          T.wo = { w0: { id: 'w0', n: 'Upper A', st: st, en: st + 1800000, x: [{ e: 'db-bench', s: [{ w: 60, r: 8 }] }] } };
          localStorage.setItem('bsc.train', JSON.stringify(T));
        }, [yIx, plain.week[yIx]]);
        await sp.reload();
        await sp.click('.tab[data-view="macros"]');
        await sp.waitForTimeout(250);
        const eaten = await look();
        t.ok('a skipped day that was shown and eaten as a training day is not paid out again',
          JSON.stringify(eaten.week.slice(todayIx)) === JSON.stringify(plain.week.slice(todayIx)) && Math.abs(eaten.sum - 7 * 75) <= 3,
          JSON.stringify({ plain: plain.week, eaten: eaten.week }));
      }

      // a block running with no days picked there is still synced      // a block running with no days picked there is still synced
      await seedBlock([], two);
      t.ok('a running block is synced even before days are picked there', /Upper A|Rest day/.test((await look()).row) && !(await look()).btn);

      // clearing every day sticks
      const openPl = async () => {
        await sp.click('#macroMore');
        await sp.waitForTimeout(150);
        await sp.click('[data-mmore="plan"]');
        await sp.waitForTimeout(300);
        await sp.evaluate(() => {
          if (document.getElementById('mtEditor').classList.contains('hide')) document.querySelector('[data-mtedit]').click();
        });
        await sp.waitForTimeout(150);
      };
      await seedBlock([], [0, 3]);
      await sp.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.act = ''; localStorage.setItem('bsc.train', JSON.stringify(T)); });
      await sp.reload();
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      await openPl();
      await sp.click('[data-mtrain="0"]');
      await sp.waitForTimeout(150);
      await sp.click('[data-mtrain="3"]');
      await sp.waitForTimeout(150);
      await sp.reload();
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      await openPl();
      t.ok('untick every training day and they stay unticked after a reload',
        await sp.evaluate(() => document.querySelectorAll('#mtTrain [aria-pressed="true"]').length === 0));
      await sp.keyboard.press('Escape');

      // not synced (no block, no days in Strengthen): the checkbox, as before
      const unsync = async (own) => {
        await seedBlock([], own);
        await sp.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.act = ''; localStorage.setItem('bsc.train', JSON.stringify(T)); });
        await sp.reload();
        await sp.click('.tab[data-view="macros"]');
        await sp.waitForTimeout(250);
        const f3 = await sp.$('[data-mfold="weigh"][aria-expanded="false"]'); if (f3) { await f3.click(); await sp.waitForTimeout(200); }
      };
      await unsync([todayIx].concat(two).sort());
      const on = await look();
      t.ok('not synced, it is the Trained today checkbox, ticked on a planned day',
        /Trained today/.test(on.row) && on.tick === 'true' && on.today > 75, JSON.stringify(on));
      await sp.click('.mw-train .mw-tick');
      await sp.waitForTimeout(250);
      const skip = await look();
      t.ok('unticking it drops today’s carbs', skip.tick === 'false' && skip.today < 75, JSON.stringify(skip));
      if (todayIx < 6) {
        t.ok('and the days left in the week make up what it did not use',
          Math.abs(skip.sum - on.sum) <= 3 && skip.week.slice(todayIx + 1).some((c, i) => c > on.week[todayIx + 1 + i]),
          JSON.stringify({ was: on.week, now: skip.week }));
      }
      t.ok('and the days before it are not touched',
        skip.week.slice(0, todayIx).join() === on.week.slice(0, todayIx).join(), JSON.stringify({ was: on.week, now: skip.week }));

      await unsync(two);
      const rest = await look();
      await sp.click('.mw-train .mw-tick');
      await sp.waitForTimeout(250);
      const extra = await look();
      t.ok('on a day off, ticking it puts the carbs on it',
        rest.tick === 'false' && extra.tick === 'true' && extra.today > rest.today, JSON.stringify({ rest: rest.row, extra: extra.row }));
      if (todayIx < 6) {
        /* Not borrowed from the days after, any more. It was, and training
           more than planned then meant eating less than planned: a newcomer's
           first workout on an unplanned Saturday took Sunday from 217 g to
           100. A day over the plan runs the week a little high instead. */
        t.ok('and the days after it keep their own carbs: training more is never paid for with less food',
          extra.week.slice(todayIx + 1).join() === rest.week.slice(todayIx + 1).join() && extra.sum > rest.sum,
          JSON.stringify({ was: rest.week, now: extra.week }));
      }

      // a workout saved in Strengthen, on a day off
      await seedBlock(two);
      await sp.evaluate(() => {
        const T = JSON.parse(localStorage.getItem('bsc.train'));
        T.wo = { w1: { id: 'w1', n: 'Upper A', st: Date.now() - 3600000, en: Date.now() - 600000,
          x: [{ e: 'db-bench', s: [{ w: 60, r: 8 }, { w: 60, r: 8 }] }] } };
        localStorage.setItem('bsc.train', JSON.stringify(T));
        window.Train._.reload();
      });
      await sp.click('.tab[data-view="plan"]');
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      const f2 = await sp.$('[data-mfold="weigh"][aria-expanded="false"]');
      if (f2) { await f2.click(); await sp.waitForTimeout(200); }
      const done = await look();
      t.ok('a saved workout is the confirmation: done, with no button left to press',
        /Upper A · done/.test(done.row) && /2 sets/.test(done.row) && !done.btn && done.today > 75, JSON.stringify(done));

      // Sync with Strengthen off: the log no longer decides the day
      await sp.evaluate(() => { const pr = JSON.parse(localStorage.getItem('bsc.macroProfile')); pr.syncTrain = false;
        localStorage.setItem('bsc.macroProfile', JSON.stringify(pr)); });
      await sp.reload();
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      { const f4 = await sp.$('[data-mfold="weigh"][aria-expanded="false"]'); if (f4) { await f4.click(); await sp.waitForTimeout(200); } }
      const unsynced = await look();
      t.ok('with sync off, a logged workout does not decide the day; the checkbox does',
        !/done/.test(unsynced.row) && /Trained today/.test(unsynced.row) && unsynced.tick === 'false', JSON.stringify(unsynced));
      await sp.click('#macroMore');
      await sp.waitForTimeout(150);
      await sp.click('[data-mmore="plan"]');
      await sp.waitForTimeout(300);
      await sp.evaluate(() => {
        if (document.getElementById('mtEditor').classList.contains('hide')) document.querySelector('[data-mtedit]').click();
      });
      await sp.waitForTimeout(150);
      await sp.click('[data-mtsync="1"]');
      await sp.waitForTimeout(250);
      await sp.keyboard.press('Escape');
      await sp.waitForTimeout(250);
      t.ok('and turning Sync with Strengthen on in the plan brings it back',
        /Upper A · done/.test((await look()).row), (await look()).row);

      // the grid's days slide: nothing done yet, so the first session lands on
      // your next lifting day from today, and the next one after it
      await seedBlock(two);
      await sp.click('.tab[data-view="train"]');
      await sp.waitForTimeout(300);
      const heads = await sp.evaluate(() => [...document.querySelectorAll('.tr-ghd')].map((e) => ({ d: e.textContent, g: e.classList.contains('moved') })));
      {
        const W0 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const seq = [];
        for (let o = 0; seq.length < 2 && o < 14; o++) if (two.indexOf((todayIx + o) % 7) >= 0) seq.push((todayIx + o) % 7);
        const exp = seq.map((wd, i) => ({ d: W0[wd], g: wd !== two[i] }));
        t.ok('each session’s day is where it will land, and green when that is not its usual day',
          JSON.stringify(heads) === JSON.stringify(exp), JSON.stringify({ heads, exp }));
      }
      // skip the first session: the second slides to your next lifting day
      await sp.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.ms.b1.sk = ['0:0'];
        localStorage.setItem('bsc.train', JSON.stringify(T)); });
      await sp.reload();
      await sp.click('.tab[data-view="train"]');
      await sp.waitForTimeout(300);
      const slid = await sp.evaluate(() => [...document.querySelectorAll('.tr-ghd')].map((e) => ({ d: e.textContent, g: e.classList.contains('moved') })));
      {
        const W0 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let lands = -1;
        for (let o = 0; lands < 0 && o < 14; o++) if (two.indexOf((todayIx + o) % 7) >= 0) lands = (todayIx + o) % 7;
        const exp = [{ d: W0[two[0]], g: false }, { d: W0[lands], g: lands !== two[1] }];
        t.ok('a skipped session moves the next one along, marked when it is off its usual day',
          JSON.stringify(slid) === JSON.stringify(exp), JSON.stringify({ slid, exp }));
      }
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(200);

      // one list, one place to change it while a block runs
      await seedBlock(two);                       // two sessions, two days
      const W = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const openSheet = async () => {
        await sp.click('#macroMore');
        await sp.waitForTimeout(150);
        await sp.click('[data-mmore="plan"]');
        await sp.waitForTimeout(300);
        await sp.evaluate(() => {
          if (document.getElementById('mtEditor').classList.contains('hide')) document.querySelector('[data-mtedit]').click();
        });
        await sp.waitForTimeout(150);
      };
      await openSheet();
      const sh = await sp.evaluate(() => ({ chips: (document.querySelector('.mt-ld') || {}).textContent || '',
        go: !!document.querySelector('[data-mgotrain]'), picker: !!document.querySelector('#mtTrain'),
        stepper: !!document.querySelector('[data-mtwk]') }));
      t.ok('with a block, Nourish shows its days and one way to change them, no second picker',
        sh.chips === two.map((i) => W[i]).join('') && sh.go && !sh.picker && !sh.stepper, JSON.stringify(sh));
      await sp.click('[data-mgotrain]');
      await sp.waitForTimeout(350);
      const blk = await sp.evaluate(() => ({ panel: !!document.querySelector('.tr-ldpanel'),
        on: [...document.querySelectorAll('.tr-ldpanel .tr-ldb[aria-pressed="true"]')].map((b) => Number(b.dataset.v)),
        heads: [...document.querySelectorAll('.tr-ghd')].length, circlesOutside: !!document.querySelector('.tr-card > .tr-ld') }));
      t.ok('Change days lands on the block with the picker open on the same days',
        blk.panel && JSON.stringify(blk.on) === JSON.stringify(two) && !blk.circlesOutside, JSON.stringify(blk));
      t.ok('and each session’s column says its day', blk.heads === 2, JSON.stringify(blk));
      const add = [0, 1, 2, 3, 4, 5, 6].find((i) => two.indexOf(i) < 0);
      await sp.click('.tr-ldpanel .tr-ldb[data-v="' + add + '"]');
      await sp.waitForTimeout(150);
      const over = await sp.evaluate(() => ({ dis: document.querySelector('[data-t="ldsave"]').disabled,
        n: document.querySelector('.tr-ldn').textContent }));
      t.ok('a day more than the block has sessions cannot be saved', over.dis && /3 of 2/.test(over.n), JSON.stringify(over));
      await sp.click('.tr-ldpanel .tr-ldb[data-v="' + two[1] + '"]');
      await sp.waitForTimeout(150);
      await sp.click('[data-t="ldsave"]');
      await sp.waitForTimeout(250);
      const want = [two[0], add].sort();
      const saved = await sp.evaluate(() => ({ ld: window.Train.liftDays(),
        wk: JSON.parse(localStorage.getItem('bsc.macroProfile')).workouts, panel: !!document.querySelector('.tr-ldpanel') }));
      t.ok('saved there, the days are Nourish’s and the count follows',
        JSON.stringify(saved.ld) === JSON.stringify(want) && saved.wk === 2 && !saved.panel, JSON.stringify(saved));
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      await openSheet();
      t.ok('and Nourish shows the new days', (await sp.textContent('.mt-ld')) === want.map((i) => W[i]).join(''),
        await sp.textContent('.mt-ld'));
      await sp.keyboard.press('Escape');

      /* Only claim one day for each session when that is true: three days
         picked for a two-session block says so, and how to fix it. */
      await seedBlock([0, 2, 4]);
      await openSheet();
      t.ok('a day count that does not match the block says so, not "one for each session"',
        /your block has 2 sessions, so pick 2/.test(await sp.textContent('#mtTrainN')), await sp.textContent('#mtTrainN'));
      await sp.keyboard.press('Escape');
      await seedBlock([0, 2]);
      await openSheet();
      t.ok('and a matching count reads as one for each session',
        /one for each session of your block/.test(await sp.textContent('#mtTrainN')), await sp.textContent('#mtTrainN'));
      await sp.keyboard.press('Escape');

      /* A block of nothing but easy days has no sessions to give days to. */
      const errs = [];
      sp.on('pageerror', (e) => errs.push(e.message));
      await sp.evaluate(() => {
        const T = JSON.parse(localStorage.getItem('bsc.train'));
        T.ms.b1.days = [{ n: 'Easy', ez: 1, s: [] }];
        localStorage.setItem('bsc.train', JSON.stringify(T));
      });
      await sp.reload();
      await sp.click('.tab[data-view="train"]');
      await sp.waitForTimeout(400);
      t.ok('a block of only easy days draws without the days picker and without an error',
        errs.length === 0 && !(await sp.$('.tr-ldgo')) && !(await sp.$('.tr-ldpanel')), JSON.stringify(errs));

      // no block: Nourish's own picker edits the same one list
      await sp.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.act = ''; localStorage.setItem('bsc.train', JSON.stringify(T)); });
      await sp.reload();
      await sp.click('.tab[data-view="macros"]');
      await sp.waitForTimeout(250);
      await openSheet();
      const free = [0, 1, 2, 3, 4, 5, 6].find((i) => want.indexOf(i) < 0);
      await sp.click('[data-mtrain="' + free + '"]');
      await sp.waitForTimeout(200);
      const nb = await sp.evaluate(() => ({ ld: window.Train.liftDays(), n: document.getElementById('mtTrainN').textContent,
        wk: JSON.parse(localStorage.getItem('bsc.macroProfile')).workouts }));
      t.ok('with no block running, Nourish picks the days itself, in the same list',
        nb.ld && nb.ld.length === 3 && nb.ld.indexOf(free) >= 0 && nb.wk === 3 && /3 a week/.test(nb.n), JSON.stringify(nb));

      /* A Saturday: an extra day used to be borrowed from Sunday, down to
         Sunday's floor. It is not borrowed at all now — a newcomer's first
         workout on a Saturday took Sunday from 217 g to 100 — so Sunday
         keeps a rest day's carbs and the week comes out over by the lift. */
      await sp.clock.setSystemTime(new Date(2026, 8, 26, 9, 0, 0));
      await unsync([0, 1]);
      const satRest = await look();
      await sp.click('.mw-train .mw-tick');
      await sp.waitForTimeout(250);
      const satLift = await look();
      t.ok('on a Saturday, an extra day still gets its carbs, and Monday to Friday are not touched',
        satRest.wk === 5 && satLift.today > satRest.today && satLift.week.slice(0, 5).join() === satRest.week.slice(0, 5).join(),
        JSON.stringify({ was: satRest.week, now: satLift.week }));
      t.ok('and Sunday gives nothing back: it keeps a rest day’s carbs',
        satLift.week[6] === satRest.week[6] && satLift.sum === satRest.sum + (satLift.today - satRest.today),
        JSON.stringify({ was: satRest.week, now: satLift.week }));
      await sp.context().close();
    }

    /* ---- a shut meal's rows each own their own strip, 2026-09-28 ---------
     * The eaten-food rows are 32px with a 44px reach. Centred, the reach
     * overlapped the row above and a tap on the foot of one food opened the
     * next. */
    {
      const tp = await t.fresh();
      await tp.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 206, f: 61, c: 57 }));
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, lb: 205, ft: 5, inch: 10, act: 1.55, goal: 'cut1' }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [{ id: 'f:egg', x: 3, eaten: 1 }, { id: 'f:banana', x: 1, eaten: 1 }, { id: 'f:oats', x: 1, eaten: 1 }] } }));
      });
      await tp.reload();
      await tp.click('.tab[data-view="macros"]');
      await tp.waitForTimeout(400);
      /* The folded list went with the meal card, and the food cards went
         with the RP-style meal: every food is a compact row in the meal's
         sheet (2026-10-04). The same promise holds for those rows, which are
         what a thumb taps now. */
      await openMeal(tp, 'b');
      const hits = await tp.evaluate(() => {
        const rows = [...document.querySelectorAll('#modalRoot .mfood')];
        return rows.slice(0, 2).map((r, i) => {
          r.scrollIntoView({ block: 'center' });
          const b = r.getBoundingClientRect();
          const at = (y) => rows.indexOf((document.elementFromPoint(b.left + 60, y) || document.body).closest('.mfood'));
          return [at(b.top + 2), at(b.bottom - 2)].every((x) => x === i);
        });
      });
      t.ok('a tap anywhere on a food’s line lands on that food, not the next one',
        hits.length === 2 && hits.every(Boolean), JSON.stringify(hits));
      await tp.context().close();
    }

    /* ---- why Fill added it, and "Don't suggest", 2026-09-23 -----------
     * Blake, on the endive: the logic is fine, "it's just invisible in the
     * app and a food i might want to stop from suggesting somehow." */
    {
      const np = await t.fresh();
      const today = await np.evaluate(() => { const d = new Date(); const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); });
      const seedDraft = (sd) => np.evaluate((a0) => {
        let a = a0;
        Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a);
          q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
        window.__macroLab.draft();
      }, sd);
      let side = null, seedUsed = 0;
      for (const sd of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        await np.evaluate(() => { localStorage.clear();
          localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 50, c: 50 })); });
        await np.reload();
        await seedDraft(sd);
        side = await np.evaluate((k) => {
          const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[k];
          for (const sk of Object.keys(d)) for (let i = 0; i < d[sk].length; i++) {
            if (d[sk][i].why === 'fib') return { sk, i, id: d[sk][i].id };
          }
          return null;
        }, today);
        if (side) { seedUsed = sd; break; }
      }
      t.ok('a side Fill adds for fibre says so on the plate', !!side, String(seedUsed));
      if (side) {
        await np.reload();
        await np.click('.tab[data-view="macros"]');
        await np.waitForTimeout(300);
        await openMeal(np, side.sk);
        const tag = side.sk + ':' + side.i;
        const chip = await np.evaluate((tg) => {
          const c = document.querySelector('[data-mwhy="' + tg + '"]');
          return c ? c.textContent.trim() : 'no chip';
        }, tag);
        t.ok('with a chip beside its name: "Added for fiber"', chip === 'Added for fiber', chip);
        /* Blake chose the chip as the button (option 1): it opens a strip
           inside the plate, in the style of the app's other in-meal cards. */
        await openRow(np, tag);
        await np.click('[data-mwhy="' + tag + '"]');
        await np.waitForTimeout(150);
        const strip = await np.evaluate(() => {
          const st = document.querySelector('.mwhy-strip');
          return st ? { text: st.textContent, inPlate: !!st.closest('.mitem'),
            menus: document.querySelectorAll('.mitem-pop, [data-mdots]').length } : null;
        });
        t.ok('tapping the chip opens a strip inside the plate that says why, with no floating menu',
          strip && /Fill added this to reach your fiber/.test(strip.text) && strip.inPlate && strip.menus === 0,
          JSON.stringify(strip));
        await np.click('[data-mdo="never:' + tag + '"]');
        await np.waitForTimeout(300);
        const after = await np.evaluate(([k, id]) => {
          const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[k];
          const ids = Object.values(d).flat().map((it) => String(it.id));
          const never = JSON.parse(localStorage.getItem('bsc.macroNever') || '{}');
          const toast = document.getElementById('mToast');
          return { gone: ids.indexOf(String(id)) < 0, never: !!never[String(id)],
            replaced: Object.values(d).flat().some((it) => it.why === 'fib'),
            toast: toast && !toast.hidden ? toast.textContent : '' };
        }, [today, side.id]);
        t.ok('"Don’t suggest" takes it off, remembers it, and says so',
          after.gone && after.never && /won’t be suggested/.test(after.toast), JSON.stringify(after));
        t.ok('and something else covers the fibre in its place', after.replaced, JSON.stringify(after));
        /* And the message goes away. It was set hidden on time and stayed on
           screen, because its own display:flex beat the attribute — Blake:
           "The undo pop-up won't go away." Judged by what is DRAWN. */
        await np.waitForTimeout(6300);
        const toastGone = await np.evaluate(() => {
          const el = document.getElementById('mToast');
          return !el || getComputedStyle(el).display === 'none';
        });
        t.ok('the message goes away on its own', toastGone);
        // never again, whatever the draw
        let back = 0;
        for (const sd of [1, 2, 3, 4, 5, 6, 7, 8]) {
          // the list and its stamp: an unstamped part never goes up, as it could never win anywhere
          await np.evaluate((id) => { const nv = localStorage.getItem('bsc.macroNever'), st = localStorage.getItem('bsc.myStamps');
            localStorage.clear(); localStorage.setItem('bsc.macroNever', nv); if (st) localStorage.setItem('bsc.myStamps', st);
            localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 50, c: 50 })); }, side.id);
          await np.reload();
          await seedDraft(sd);
          back += await np.evaluate(([k, id]) => Object.values(JSON.parse(localStorage.getItem('bsc.macroDays'))[k])
            .flat().filter((it) => String(it.id) === String(id)).length, [today, side.id]);
        }
        t.ok('Fill never suggests it again', back === 0, back + ' times');
        const sent = await np.evaluate((id) => { const pl = window.__macroLab.payload(); return !!(pl.nv && pl.nv.v && pl.nv.v[String(id)]); }, side.id);
        t.ok('and the list travels to your other devices', sent);
        // Allow, from the foods sheet
        await np.click('.tab[data-view="macros"]');
        await np.waitForTimeout(300);
        await np.click('#macroMore');
        await np.waitForTimeout(150);
        await np.click('[data-mmore="foods"]');
        await np.waitForTimeout(300);
        const listed = await np.evaluate(() => !!document.querySelector('.mnv-row [data-mallow]'));
        await np.click('.mnv-row [data-mallow]');
        await np.waitForTimeout(200);
        const allowed = await np.evaluate((id) => !JSON.parse(localStorage.getItem('bsc.macroNever') || '{}')[String(id)], side.id);
        t.ok('the foods sheet lists it, and Allow gives it back', listed && allowed, JSON.stringify({ listed, allowed }));
      }
      // A dish Fill chose for an empty meal says so too.
      await np.evaluate(() => { localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 170 })); });
      await np.reload();
      await seedDraft(3);
      await np.reload();
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(300);
      /* the chips are on the plates, in each meal's sheet */
      const picks = [];
      for (const sk of await np.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray-b[data-mopen]')].map((b) => b.dataset.mopen))) {
        await openMeal(np, sk);
        picks.push(...await np.evaluate(() => [...document.querySelectorAll('#modalRoot .mwhy-pick')].map((c) => c.textContent.trim())));
        await closeSheet(np);
      }
      t.ok('a dish Fill picked wears "Fill\u2019s pick"', picks.length > 0 && picks.every((x) => x === 'Fill\u2019s pick'),
        JSON.stringify(picks));

      /* Sweep on tomorrow. Blake: "I tried to sweep all the foods for
         tomorrow... It didn't sweep away anything" — the button was off on
         every future day. It clears tomorrow's plan now, keeping what is
         locked or pinned. */
      const tmr = await np.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); const p2 = (x) => (x < 10 ? '0' : '') + x;
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); });
      await np.evaluate((k) => {
        localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 170 }));
        localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [
          { k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:whey', x: 1 }] }, { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: {} }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
          b: [{ id: 'f:whey', x: 1, eaten: 0 }, { id: 'f:banana', x: 1, eaten: 0, by: 'f' }],
          l: [{ id: 'f:chicken_breast', x: 1, eaten: 0, l: 1 }, { id: 'f:tuna', x: 1, eaten: 0 }],
          d: [{ id: 'f:ground_beef', x: 1, eaten: 0, by: 'f' }] } }));
      }, tmr);
      await np.reload();
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(300);
      await stepDay(np, 1);
      await np.waitForTimeout(150);
      const canSweep = await np.evaluate(() => !document.getElementById('macroSweep').disabled);
      await np.click('#macroSweep');
      await np.waitForTimeout(300);
      const swept = await np.evaluate((k) => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[k];
        return Object.keys(d).reduce((o, sk) => { o[sk] = (d[sk] || []).map((it) => it.id); return o; }, {});
      }, tmr);
      t.ok('sweep works on tomorrow, and keeps what is locked or pinned',
        canSweep && swept.b.join() === 'f:whey' && swept.l.join() === 'f:chicken_breast' && !(swept.d || []).length,
        JSON.stringify({ canSweep, swept }));

      /* A recipe plate says what it weighs. Blake, on the Cafe Rio pork: half
         a serving meant opening the recipe, switching to grams and dividing
         on a calculator. An estimate from the raw ingredients until the
         batch is weighed once; then exact, remembered, synced. */
      const pork = await np.evaluate(() => window.RECIPES.find((r) => /Barbacoa, Cafe Rio/.test(r.name)));
      await np.evaluate(([k, id]) => {
        localStorage.clear();
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 170 }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { l: [{ id, x: 0.5, eaten: 0 }] } }));
      }, [today, pork.id]);
      await np.reload();
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(300);
      /* The weight is the plate's dial now (2026-10-04), "~N g" until the
         batch is weighed; Weigh the batch is in the plate's ⋯. */
      await openMeal(np, 'l');
      const est = await np.evaluate(() => { const b = document.querySelector('#modalRoot [data-mtype="l:0"]');
        return b ? { t: b.textContent.trim().replace(/^~/, '~'), est: /^~/.test(b.textContent.trim()) } : null; });
      const rawHalf = Math.round(pork.ingp.reduce((a, x) => a + x.g * (x.pe > 0 ? x.pe : 1), 0) / pork.servN * 0.5);
      t.ok('a recipe plate shows its weight, marked as an estimate until weighed',
        est && est.est && est.t === '~' + rawHalf + ' g', JSON.stringify({ est, rawHalf }));
      await openRow(np, 'l:0');
      await np.click('#modalRoot [data-mfmenu="l:0"]');
      await np.waitForTimeout(150);
      await np.click('#modalRoot [data-mbatch="l:0"]');
      await np.waitForTimeout(200);
      await np.fill('#mBatchIn', '1800');
      await np.click('[data-mbsave="l:0"]');
      await np.waitForTimeout(250);
      const weighed = await np.evaluate((id) => { const b = document.querySelector('#modalRoot [data-mtype="l:0"]');
        return { t: b && b.textContent.trim(), est: !!b && /^~/.test(b.textContent.trim()),
          stored: JSON.parse(localStorage.getItem('bsc.macroBatchG') || '{}')[String(id)],
          sent: !!(window.__macroLab.payload().bg || {}).v }; }, pork.id);
      t.ok('weighing the batch once makes it exact: 1,800 g for 10 is 90 g on a half-serving plate',
        weighed.t === '90 g' && !weighed.est && weighed.stored && weighed.stored.s === 180 && weighed.sent,
        JSON.stringify(weighed));
      await np.context().close();
    }
  },
});
