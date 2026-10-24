/* The plan's calories as its grams, one verdict on the morning card, the
 * plan line, the word beside an amount, the sheet a plate opens, the family
 * plan's plate, the solver's ask, the floor and what goes under it, the burn
 * switch, sweeping the day back, a pin as a standing order, one press of
 * Add, a skipped meal dealt with, and the bar's order.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openWeigh, openPlan, openMeal, closeSheet, openRowOf } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — the plan\'s arithmetic, the floor, and the burn switch',
  async suite(t) {
    /* ---- the plan's calories are its grams -------------------------------
     *
     * When the floor bit, kcal was clamped and the protein and fat floors
     * were not, so a 250 lb woman on a quick cut got a plan reading 1,200
     * over grams that add to 1,475. The face, the projection and the plan
     * line printed one; the wizard, the coach and the day bars the other.
     * A `floored` flag was set to say so and nothing ever read it. */
    const planPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    const planGrams = await planPg.evaluate(() => {
      const pl = window.__macroLab.plan({ sex: 'f', age: 40, ft: 5, inch: 4, lb: 250, act: 1.2,
        goal: 'cut2', goalLb: 0, goalBy: '', workouts: 0, steps: 0 });
      return { kcal: pl.kcal, sum: 4 * pl.p + 4 * pl.c + 9 * pl.f, p: pl.p, f: pl.f, c: pl.c };
    });
    await planPg.context().close();
    t.ok('a plan whose floors add to more than its floor says the larger number',
      planGrams.kcal === planGrams.sum && planGrams.sum > 1200 &&
        planGrams.p >= 200 && planGrams.f >= 75,
      JSON.stringify(planGrams));

    /* ---- one verdict on the morning card ---------------------------------
     *
     * The face judged by RATE (this week's loss against the rate the date
     * needs) and the line beneath it by POSITION (the seven-day average
     * against the plan line). A fortnight that gained for a week and then
     * lost fast reads "on pace" by rate — the week's loss is what the date
     * needs — while sitting well above the line: the face said on pace over
     * a line saying days behind. Now both read the side of the line. */
    const twoFaces = await t.fresh({ viewport: { width: 390, height: 800 } });
    await twoFaces.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = {};
      for (let i = 0; i < 15; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        // a week climbing 0.4 a day, then a week falling 0.7 a day
        ws[key(d)] = Math.round((i >= 7 ? 205 + (14 - i) * 0.4 : 207.8 - (7 - i) * 0.7) * 10) / 10;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      const g = new Date(); g.setDate(g.getDate() + 100);
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 205, act: 1.375, goal: 'cut1',
        goalLb: 185, goalBy: key(g), workouts: 4, steps: 8000 }));
    });
    await twoFaces.reload();
    await twoFaces.waitForTimeout(400);
    await twoFaces.click('.tab[data-view="macros"]');
    await twoFaces.waitForTimeout(300);
    await openWeigh(twoFaces);
    const faceSaid = await twoFaces.textContent('.mw-verdict');
    const lineSaid = await twoFaces.evaluate(() => {
      const el = document.querySelector('.mline');
      return { text: el ? el.textContent : '', side: window.__macroLab.pace().side };
    });
    /* Since 2026-09-23 both say WHEN, not "behind": the chip on the face and
       the coach line under it must name the same arrival date. */
    const D = '([A-Z][a-z]{2} \\d{1,2}(?:, \\d{4})?)';
    const dateIn = (str) => {
      if (/no (?:arrival )?date/.test(str)) return 'none';
      if (/on track|On track/.test(str)) return 'on track';
      const m = str.match(new RegExp(D + ' · \\d+ (?:days|weeks) (?:late|early)')) ||
        str.match(new RegExp('Arriving around ' + D));
      return m ? m[1] : '';
    };
    t.ok('the face and the morning line give one estimate, the same date',
      !!dateIn(faceSaid) && dateIn(faceSaid) === dateIn(lineSaid.text),
      'face: ' + faceSaid + ' | line: ' + lineSaid.text.slice(0, 120));
    /* The graph carries the plan's own line, so "behind" is something you
       can see: your weight above the dashed one. */
    const planLine = await twoFaces.evaluate(() => {
      const pl = document.querySelector('.mw-spark .mw-spark-plan');
      return pl ? pl.getAttribute('points').split(' ').length : 0;
    });
    t.ok('the weight graph draws where the plan says you should be', planLine >= 2, String(planLine));
    await twoFaces.context().close();

    /* ---- the plan line starts where the goal was set ----------------------
     *
     * It used to start at the first morning ever logged, which for a goal
     * set after weeks of mornings was a weight long gone, and today's
     * "planned" figure came out pounds above the scale — ahead of a pace
     * nobody set. Saving a goal now records the morning and what the scale
     * averaged; a goal saved before that keeps the old anchor. */
    const anchorPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await anchorPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = {};
      for (let i = 0; i < 40; i++) {           // 205 down to 195 over forty mornings
        const d = new Date(); d.setDate(d.getDate() - i);
        ws[key(d)] = Math.round((195.25 + i * 0.25) * 10) / 10;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      const g = new Date(); g.setDate(g.getDate() + 100);
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 205, act: 1.375, goal: 'cut1',
        goalLb: 175, goalBy: key(g), workouts: 4, steps: 8000 }));
    });
    await anchorPg.reload();
    await anchorPg.waitForTimeout(400);
    await anchorPg.click('.tab[data-view="macros"]');
    await anchorPg.waitForTimeout(300);
    const kf = await anchorPg.evaluate(() => {
      const pf = window.__macroLab.pace();
      return { legacy: pf && Math.round(pf.plan.lb * 10) / 10, avg7: window.__macroLab.profile().lb };
    });
    await openPlan(anchorPg);
    // a returning reader's rows sit behind Edit, and the helper leaves that fold as it found it
    if (await anchorPg.evaluate(() => document.getElementById('mtEditor').classList.contains('hide'))) {
      await anchorPg.click('[data-mtedit]');
      await anchorPg.waitForTimeout(150);
    }
    await anchorPg.fill('#mtGoalLb', '176');
    await anchorPg.click('[data-mtarg="save"]');
    await anchorPg.waitForTimeout(400);
    const anchored = await anchorPg.evaluate(() => {
      const pr = JSON.parse(localStorage.getItem('bsc.macroProfile'));
      const pf = window.__macroLab.pace();
      const ws = Object.keys(JSON.parse(localStorage.getItem('bsc.macroWeights'))).sort();
      return { set: pr.goalSet, today: ws[ws.length - 1], from: pr.goalFrom,
        planned: pf && Math.round(pf.plan.lb * 10) / 10, side: pf && pf.side };
    });
    t.ok('a saved goal records the morning it was set and what the scale read',
      anchored.set === anchored.today && Math.abs(anchored.from - kf.avg7) < 0.11,
      JSON.stringify({ before: kf, after: anchored }));
    t.ok('and the plan line starts there, so the day a goal is set is on pace',
      anchored.planned === anchored.from && anchored.side === 'on' && kf.legacy !== anchored.planned,
      JSON.stringify({ before: kf, after: anchored }));
    await anchorPg.context().close();

    /* ---- the word beside the amount is the serving's word ----------------
     *
     * The word came off the servings line — its last word before the
     * parenthesis — on the assumption that the number in front was the
     * serving count. On "8 Pancakes (4 Servings)" a plate at ×1 read "1
     * pancake" and charged two; on "2 Loaves (24 Slices)" a slice read "1
     * loaf". Three plates: the pancakes, the bread, and a line that always
     * led with its count, so the ordinary word still comes through. */
    const unitPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await unitPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 340, x: 1, eaten: 0 }, { id: 226, x: 1, eaten: 0 }, { id: 91, x: 1, eaten: 0 }],
      } }));
    });
    await unitPg.reload();
    await unitPg.waitForTimeout(400);
    await unitPg.click('.tab[data-view="macros"]');
    await unitPg.waitForTimeout(300);
    await openMeal(unitPg, 'b');
    /* The dial is grams for a recipe with a serving weight (2026-10-04), so
       the count is said in the small print beside the macros; a recipe with
       no weight still says it on the dial. */
    const plateWords = await unitPg.evaluate(() => {
      const out = {};
      document.querySelectorAll('#modalRoot .mitem').forEach((row) => {
        const b = row.querySelector('[data-open]');
        const u = row.querySelector('.mitem-uom');
        const x = row.querySelector('.mstep-x');
        if (b && (u || x)) out[String(b.dataset.open)] = (u ? u.textContent : x.textContent).trim();
      });
      return out;
    });
    t.ok('a plate is counted in servings, slices and bites — never in the yield’s word',
      /serving/.test(plateWords['340'] || '') && !/pancake/.test(plateWords['340'] || '') &&
        /slice/.test(plateWords['226'] || '') && !/loa/.test(plateWords['226'] || '') &&
        /bite/.test(plateWords['91'] || ''),
      JSON.stringify(plateWords));
    await unitPg.context().close();

    /* ---- the sheet a plate opens cooks the plate ---------------------------
     *
     * mCookScale snapped the batch fraction to an eighth, which is exact
     * only when the yield is 1, 2, 4 or 8. One plate of a six-serving dish
     * opened at ⅛ and made three quarters of a serving; one and three
     * quarters of a twelve-serving sauce opened at ⅛ and made a serving and
     * a half. The sheet said "at ×⅛" over both. Now the factor is the true
     * one and the sheet says the portion in servings. */
    const cooked = [];
    /* fmtNum spaces a fraction off its whole number — "1 ¾", not "1¾" —
       which is what the sheet has always printed beside quantities. */
    for (const seed of [{ id: 91, x: 1, want: /for 1 serving\b/ }, { id: 264, x: 1.75, want: /for 1\s*¾ servings/ }]) {
      const cookPg = await t.fresh({ viewport: { width: 390, height: 800 } });
      await cookPg.evaluate((sd) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { l: [{ id: sd.id, x: sd.x, eaten: 0 }] } }));
      }, seed);
      await cookPg.reload();
      await cookPg.waitForTimeout(400);
      await cookPg.click('.tab[data-view="macros"]');
      await cookPg.waitForTimeout(300);
      await openMeal(cookPg, 'l');
      await openRowOf(cookPg, '#modalRoot .mitem [data-open="' + seed.id + '"]');
      await cookPg.click('#modalRoot .mitem [data-open="' + seed.id + '"]');
      await cookPg.waitForTimeout(300);
      const label = await cookPg.evaluate(() => (document.querySelector('.addto-x') || {}).textContent || '(no label)');
      cooked.push({ id: seed.id, x: seed.x, label, ok: seed.want.test(label) && !/⅛/.test(label) });
      await cookPg.context().close();
    }
    t.ok('a sheet opened from a plate makes the plate, and says so in servings',
      cooked.every((c) => c.ok), JSON.stringify(cooked));

    /* ---- Fill sizes the plate the family plan seeded ------------------------
     *
     * A dish on the week's plan for today arrives on the day at ×1 with a
     * comment promising the solver will size it. Fill's solver was narrowed
     * to its OWN plates — the right rule for what a hand placed — and the
     * family plate was not one, so a 1,143-kcal dinner sat at ×1 on a
     * 1,370-kcal day and the solver shrank Fill's own plates to pay for it. */
    const famPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await famPg.evaluate(() => {
      const wd = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
      const r = window.RECIPES.find((q) => /pulled beef/i.test(q.name));
      window.Store.addToDay(r.id, wd, 1);
    });
    await famPg.reload();
    await famPg.waitForTimeout(400);
    await famPg.click('.tab[data-view="macros"]');
    await famPg.waitForTimeout(300);
    await famPg.click('#macroFill');
    await famPg.waitForTimeout(600);
    const famPlate = await famPg.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const day = days[Object.keys(days)[0]] || {};
      let w = null;
      Object.keys(day).forEach((k) => day[k].forEach((it) => { if (it.by === 'w') w = it; }));
      const r = w && window.RECIPES.find((q) => q.id === w.id);
      return w ? { x: w.x, kcal: r && Math.round(r.macro.kcal * w.x) } : null;
    });
    t.ok('Fill sizes the family plate along with its own',
      !!famPlate && famPlate.x < 1 && famPlate.kcal < 900, JSON.stringify(famPlate));
    await famPg.context().close();

    /* ---- the solver prices a meal at the ask its pills show ----------------
     *
     * The share term priced each meal at its PLAN share while the meal's
     * pills showed what the day so far still leaves it. After a breakfast
     * that ate most of the day, dinner's pill asked a few hundred and the
     * solver pulled the dinner plate toward its five hundred plan. */
    const priceDayPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await priceDayPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const beef = window.RECIPES.find((q) => /pulled beef/i.test(q.name));
      const plate = window.RECIPES.find((q) => /cold roast beef & pepper/i.test(q.name));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: beef.id, x: 0.75, eaten: 1 }],
        d: [{ id: plate.id, x: 1, eaten: 0 }],
      } }));
    });
    await priceDayPg.reload();
    await priceDayPg.waitForTimeout(400);
    await priceDayPg.click('.tab[data-view="macros"]');
    await priceDayPg.waitForTimeout(300);
    /* The ask is on the dinner's tray, "352 / 959" (2026-10-04): the
       number after the stroke is the meal's share as it stands. */
    /* Read the price, not the landing: the day-level terms shrink a plate
       after a breakfast like that on their own, so where the plate lands
       proves nothing about which figure the share term used. The figure it
       used is what the test holds to the pill. */
    const priced = await priceDayPg.evaluate(() => {
      const card = document.querySelector('[data-mdot="d"]').closest('.mtray');
      const pill = Number(card.querySelector('.mtray-caps .mcap').dataset.want);
      const want = (window.__macroLab.wants().find((a) => a.k === 'd') || {}).want;
      const dayK = 4 * 180 + 4 * 50 + 9 * 50;
      return { pill: pill, want: want && Math.round(want), planShare: Math.round(dayK * 0.39) };
    });
    t.ok('after a heavy breakfast the solver prices dinner at the ask on its pills, not its plan share',
      priced.pill > 0 && priced.want === priced.pill && priced.pill < 0.8 * priced.planShare,
      JSON.stringify(priced));
    await priceDayPg.context().close();

    /* ---- the floor, and the one thing under it ---------------------------
     *
     * 1,500 for a man was a magazine number. 1,200 is the clinical figure —
     * roughly where a day stops being able to meet its micronutrients — and
     * it was 1,500 that stood between Blake and the 1,300-kcal day an RP-style
     * hard cut asks him for. What keeps a plan sane is the rate cap and the
     * ceiling on how fast fat can actually be spent, not a flat number. */
    const floorPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    const floors = await floorPg.evaluate(() => {
      const man = { sex: 'm', age: 43, ft: 5, inch: 10, lb: 191, act: 1.2,
        goal: 'cut2', goalLb: 0, goalBy: '', workouts: 0, steps: 0 };
      const L = window.__macroLab;
      const small = Object.assign({}, man, { lb: 130, sex: 'f' });
      return { flat: L.floorK(small), big: L.floorK(man),
        man: L.plan(man).kcal,
        woman: L.plan(Object.assign({}, man, { sex: 'f' })).kcal };
    });
    /* The floor is the person's, not a number. 1,200 is the nutrient floor
       and it still holds for somebody small enough that it binds; for a
       bigger frame the floor is what THAT body's own minimums cost, which is
       always more. A flat 1,200 under a 205 lb man is not a floor, it is a
       day the planner cannot build — see the sweep below. */
    t.ok('a small frame still floors at the clinical 1,200',
      floors.flat === 1200, JSON.stringify(floors));
    t.ok('and a bigger one floors higher, because its own minimums cost more',
      floors.big > floors.flat, JSON.stringify(floors));
    t.ok('and a hard cut is still allowed under the old 1,500',
      floors.man < 1500 && floors.man >= 1200, JSON.stringify(floors));

    /* ---- no profile is ever handed a day it cannot eat -------------------
     *
     * Blake, on a plan reading C 62 / 0 g: "I feel I should have some carbs
     * to eat for the day." His day was 205 g of protein and 61 g of fat on
     * 1,369 kcal, which is all of it, and carbohydrate got what was left.
     *
     * The planner has a rule reserving MCARB_SHARE of the day for
     * carbohydrate and lets protein give ground to 0.8 g/lb to make room.
     * Fat never gives ground, and once protein is at its floor there is
     * nothing left to take — so `Math.max(0, ...)` quietly handed back zero.
     * A sweep of this grid found 6,455 of 34,056 profiles, nineteen per
     * cent, planned with no carbohydrate at all.
     *
     * The floor knows the planner's own minimums now, so a day is never
     * planned smaller than it costs to build. Swept rather than sampled,
     * because the hole was in a corner nobody had a fixture for. */
    const noZero = await floorPg.evaluate(() => {
      const L = window.__macroLab;
      let n = 0; const bad = [];
      for (const goal of ['cut1', 'cut2', 'cut3', 'lean', 'keep'])
        for (let lb = 110; lb <= 320; lb += 10)
          for (let age = 20; age <= 70; age += 10)
            for (const act of [1.2, 1.375, 1.55, 1.725])
              for (const sex of ['m', 'f'])
                for (const [ft, inch] of [[5, 2], [5, 8], [6, 1]]) {
                  const pl = L.plan({ sex, age, lb, ft, inch, act, goal,
                    goalLb: 0, goalBy: '', workouts: 0, steps: 0 });
                  if (!pl) continue;
                  n++;
                  if (!(pl.c > 0)) bad.push(goal + ' ' + sex + lb + ' age' + age +
                    ' act' + act + ' -> ' + pl.kcal + ' ' + pl.p + '/' + pl.f + '/' + pl.c);
                }
      return { n: n, bad: bad.length, sample: bad.slice(0, 3) };
    });
    t.ok('no body on any goal is planned a day with no carbohydrate in it',
      noZero.n > 3000 && noZero.bad === 0,
      noZero.bad + ' of ' + noZero.n + ' — ' + noZero.sample.join(' | '));

    /* The term that does the hormone protecting, and the shape is the point.
       Energy availability is what the lean mass gets once the fat store has
       handed over what it can, so somebody with fat to spend barely feels
       it, and it tightens on its own as they lean out — which is when the
       endocrine picture it is named for starts to matter. Two bodies at one
       weight: the leaner one has less fat to draw on, so its floor is
       higher. */
    const eaShape = await floorPg.evaluate(() => {
      const L = window.__macroLab;
      const at = (bf) => L.floorK({ sex: 'm', age: 35, ft: 5, inch: 10, lb: 185,
        act: 1.55, bf: bf, goal: 'cut1', goalLb: 0, goalBy: '', workouts: 0, steps: 0 });
      return { lean: at(10), fat: at(30) };
    });
    t.ok('at one weight the leaner body floors higher, having less fat to spend',
      eaShape.lean > eaShape.fat, JSON.stringify(eaShape));

    /* Estimated from what is already asked, and typed over when you know. */
    const fatEst = await floorPg.evaluate(() => {
      const man = { sex: 'm', age: 43, ft: 5, inch: 10, lb: 191 };
      const guess = window.__macroLab.bodyFat(man);
      const told = window.__macroLab.bodyFat(Object.assign({}, man, { bf: 18 }));
      return { guess: guess, told: told,
        none: window.__macroLab.bodyFat({ sex: 'm', age: 0, ft: 0, inch: 0, lb: 0 }) };
    });
    t.ok('body fat is estimated from the figures already asked for',
      fatEst.guess.told === false && fatEst.guess.pct > 15 && fatEst.guess.pct < 40 &&
        Math.abs(fatEst.guess.lb - 191 * fatEst.guess.pct / 100) < 0.6,
      JSON.stringify(fatEst.guess));
    t.ok('and a measured one replaces it rather than arguing with it',
      fatEst.told.told === true && fatEst.told.pct === 18 &&
        Math.abs(fatEst.told.lb - 34.4) < 0.2 && fatEst.none === null,
      JSON.stringify(fatEst));

    /* The ceiling that is about the person. Two bodies at one weight and one
       date: the leaner one has less fat to spend, so it must be given MORE
       food, not the same. Differential, because re-deriving the burn beside
       the app is how a test ends up asserting its own arithmetic. */
    const leanPlan = await floorPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const g = new Date(); g.setDate(g.getDate() + 60);
      const by = g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate());
      const base = { sex: 'm', age: 43, ft: 5, inch: 10, lb: 191, act: 1.2,
        goal: 'cut2', goalLb: 165, goalBy: by, workouts: 0, steps: 0 };
      return { lean: window.__macroLab.plan(Object.assign({}, base, { bf: 8 })).kcal,
        fat: window.__macroLab.plan(Object.assign({}, base, { bf: 34 })).kcal };
    });
    t.ok('a lean body is given more food for the same goal, because it has less fat to spend',
      leanPlan.lean > leanPlan.fat, JSON.stringify(leanPlan));
    await floorPg.context().close();

    /* ---- the burn switch, and the two things it must not lie about --------
     *
     * The measured burn sat below the four facts in the EDITOR's row
     * language, with a filled green pill reading "In use" / "Use it", and it
     * was wrong in two ways at once.
     *
     * The row showed the MEASURED figure whether or not the plan was built
     * on it, and said which in the pill — so the one number on screen was
     * not necessarily the one the plan used. And tapping the pill wrote
     * useTdee to storage and then called renderModal, which returns without
     * touching the DOM while the plan sheet is open (the sheet is drawn once
     * so a sync arriving mid-keystroke cannot reset the draft boxes). The
     * pill still read "In use" after turning the measured burn OFF.
     *
     * Its replacement repaints through mtRefreshPlan, the sheet's own
     * mechanism for "the profile moved, redraw the answers". That mechanism
     * also writes the worked-out plan into the gram boxes, which is right
     * for every control inside the editor fold and wrong for this one: it
     * can be tapped with both folds shut and no Save on screen, and it put
     * grams on the sheet that storage did not hold and offered no way to
     * commit them. */
    const burnPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await burnPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      /* Four weeks of mornings and four weeks of logged days is what
         mMeasuredTdee asks for: eight weigh-ins at least, three in each end
         week, twenty-one days between the first and the last, and fourteen
         days with real food on them. Eating far under the formula's guess so
         the two numbers cannot be confused for one another. */
      const W = {}, D = {}, now = new Date();
      for (let i = 27; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        W[key(d)] = Math.round((198 - (27 - i) * 0.055) * 10) / 10;
        D[key(d)] = { b: [{ id: 150, x: 1, eaten: 1 }], l: [{ id: 311, x: 1, eaten: 1 }],
          d: [{ id: 195, x: 1, eaten: 1 }] };
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(W));
      localStorage.setItem('bsc.macroDays', JSON.stringify(D));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 38, lb: 198,
        ft: 6, inch: 1, act: 1.55, goal: 'cut1', goalLb: 180, goalBy: '', workouts: 0,
        steps: 7000, useTdee: true }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 190 }));
    });
    await burnPg.reload();
    await burnPg.waitForTimeout(400);
    await burnPg.click('.tab[data-view="macros"]');
    await burnPg.waitForTimeout(300);
    await burnPg.click('#macroMore');
    await burnPg.waitForTimeout(150);
    await burnPg.click('[data-mmore="plan"]');
    await burnPg.waitForTimeout(400);

    /* Both burns are read off the screen and the pair is asserted to SWAP,
       so no kcal figure is typed into this file — the fixture's measured
       burn moves with whatever mMeasuredTdee makes of those weigh-ins. */
    const burnRead = () => burnPg.evaluate(() => {
      const num = (s) => Number(String(s || '').replace(/[^0-9]/g, '')) || 0;
      const row = document.querySelector('.mt-burn .mtf-row b');
      const swap = document.querySelector('.mt-swap');
      return {
        shown: num(row && row.textContent),
        offer: num(swap && swap.textContent),
        useTdee: !!JSON.parse(localStorage.getItem('bsc.macroProfile')).useTdee,
        boxes: ['mtP', 'mtF', 'mtC'].map((i) => (document.getElementById(i) || {}).value).join('/'),
        saved: JSON.stringify(JSON.parse(localStorage.getItem('bsc.macroTargets'))),
      };
    });
    const burnOn = await burnRead();
    await burnPg.click('.mt-swap');
    await burnPg.waitForTimeout(350);
    const burnOff = await burnRead();

    t.ok('the plan sheet states a measured burn and offers the other number',
      burnOn.shown > 0 && burnOn.offer > 0 && burnOn.shown !== burnOn.offer,
      JSON.stringify(burnOn));
    t.ok('tapping it switches which burn the plan is built on',
      burnOn.useTdee === true && burnOff.useTdee === false, JSON.stringify([burnOn, burnOff]));
    /* The fault the old pill had: storage flipped and the screen did not. */
    t.ok('and the row states the burn now in use, not the measured one regardless',
      burnOff.shown === burnOn.offer && burnOff.offer === burnOn.shown,
      JSON.stringify([burnOn, burnOff]));
    /* The fault repainting introduced: a plan on screen that storage does
       not hold, with both folds shut and no Save to close the gap. */
    t.ok('and it leaves the grams alone, on the screen and in storage',
      burnOff.boxes === burnOn.boxes && burnOff.saved === burnOn.saved,
      JSON.stringify([burnOn.boxes, burnOff.boxes, burnOn.saved, burnOff.saved]));
    await burnPg.context().close();

    /* ---- sweeping the day back to what you actually ate -------------------
     *
     * Blake: "sometimes I just want to sweep the whole day that hasn't been
     * marked done. Start fresh." It keeps every plate you ticked — clearing
     * those destroys a record rather than a plan — and keeps anything you
     * locked, because a lock is you saying this one stays. His call that it
     * runs without asking, like the meal dot and the tick beside it. */
    const sweepPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await sweepPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:egg', x: 2, eaten: 1 }],          // eaten: stays
        l: [{ id: 'f:tuna', x: 1, eaten: 0, l: 1 }],   // locked: stays
        d: [{ id: 'f:cheddar', x: 1, eaten: 0 },
          { id: 'f:milk', x: 1, eaten: 0 }],           // loose: goes
      } }));
    });
    await sweepPg.reload();
    await sweepPg.waitForTimeout(400);
    await sweepPg.click('.tab[data-view="macros"]');
    await sweepPg.waitForTimeout(300);
    const sweptBefore = await sweepPg.evaluate(() => {
      const day = JSON.parse(localStorage.getItem('bsc.macroDays'))[Object.keys(
        JSON.parse(localStorage.getItem('bsc.macroDays')))[0]];
      return { b: day.b.length, l: day.l.length, d: day.d.length,
        off: document.getElementById('macroSweep').disabled };
    });
    t.ok('the sweeper is live while there is something loose to sweep',
      sweptBefore.off === false, JSON.stringify(sweptBefore));
    await sweepPg.click('#macroSweep');
    await sweepPg.waitForTimeout(400);
    const sweptAfter = await sweepPg.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = all[Object.keys(all)[0]];
      return { b: (day.b || []).length, l: (day.l || []).length, d: (day.d || []).length,
        off: document.getElementById('macroSweep').disabled };
    });
    t.ok('it takes the loose plates and leaves what you ate and what you locked',
      sweptAfter.b === 1 && sweptAfter.l === 1 && sweptAfter.d === 0,
      JSON.stringify({ before: sweptBefore, after: sweptAfter }));
    t.ok('and goes quiet once there is nothing loose left',
      sweptAfter.off === true, JSON.stringify(sweptAfter));
    await sweepPg.context().close();

    /* ---- a pin is a standing order, not a licence to reopen a meal --------
     *
     * Blake, having swept the day and pressed Fill: "Breakfast was marked
     * complete and it did it and added more foods."
     *
     * Every pass in the drafter steps over a meal carrying a tick — the
     * best-fit pass, the family plan, the topper and the vegetable side all
     * ask. The PIN pass never did. It asked only whether the pin was already
     * on the day and whether the meal was skipped, so a pinned dish swept off
     * a finished breakfast came straight back on the next Fill. The un-eaten
     * plate then re-opened the meal, which also handed it to the topper,
     * because mTopSlot counts a meal with anything un-ticked on it as open.
     *
     * The fix must not cost the pin its rank. A pin runs BEFORE the family
     * plan and before best-fit precisely because it outranks a chosen dish;
     * what it must not outrank is a tick. So both halves are asserted here:
     * the pin stays off a ticked meal, and still lands beside a hand-placed
     * one. */
    const standPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    const standRun = async (eaten) => {
      const set = await standPg.evaluate((ate) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        /* Two different breakfast dishes out of the book itself, so the pin
           and the plate beside it can never be the same recipe — mOnDay would
           make the whole question moot if they were. */
        const bs = window.RECIPES.filter((r) => r.macro &&
          (r.book + '-' + r.secNum === '1-1' || r.book + '-' + r.secNum === '2-1'));
        const pinned = bs[0], other = bs[1];
        localStorage.setItem('bsc.macroSlots', JSON.stringify({
          list: [{ k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: pinned.id, x: 1 }] },
            { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' },
            { k: 's', n: 'Snacks', t: 's' }],
          names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
          b: [{ id: other.id, x: 1, eaten: ate }] } }));
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 38, lb: 198,
          ft: 6, inch: 1, act: 1.55, goal: 'cut1', goalLb: 0, goalBy: '', workouts: 0,
          steps: 7000 }));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 190 }));
        return { pinned: pinned.id, other: other.id };
      }, eaten);
      await standPg.reload();
      await standPg.waitForTimeout(400);
      await standPg.click('.tab[data-view="macros"]');
      await standPg.waitForTimeout(300);
      await standPg.evaluate(() => { document.getElementById('macroFill').dataset.mode = 'fill'; });
      await standPg.click('#macroFill');
      await standPg.waitForTimeout(700);
      return standPg.evaluate((s2) => {
        const all = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = all[Object.keys(all)[0]] || {};
        return { onB: (day.b || []).some((it) => it.id === s2.pinned),
          bCount: (day.b || []).length };
      }, set);
    };
    const standTicked = await standRun(1);
    t.ok('Fill puts nothing on a breakfast you have already ticked, not even a pin',
      standTicked.onB === false && standTicked.bCount === 1,
      JSON.stringify(standTicked));
    const standHand = await standRun(0);
    t.ok('but a pin still lands beside a dish you placed by hand',
      standHand.onB === true, JSON.stringify(standHand));
    await standPg.context().close();

    /* ---- one press of Add, however many times the button is pressed ------
     *
     * Blake, having added two foods: "I added foods. And it double added
     * them." The day showed franks, buns, franks, buns — the basket
     * committed twice, in order.
     *
     * close() does not close synchronously. The picker is pushed onto
     * history, so close() takes its first branch — history.go(-n) and RETURN
     * — and everything it clears, S.macroPick and the basket included, is
     * cleared when the popstate lands. On a phone that is long enough for a
     * second press to find the sheet still up, S.macroPick still set and the
     * basket still full.
     *
     * Two clicks dispatched back to back rather than two Playwright taps:
     * the point is the window BEFORE the sheet has gone, and a driver that
     * waits for actionability would never press into it. */
    const twicePg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await twicePg.click('.tab[data-view="macros"]');
    await twicePg.waitForTimeout(300);
    /* The basket and its Add went on 2026-10-04: a tap on a row puts the
       food on the meal at once, and a second tap takes it back off. So the
       double press this guarded against is now a double tap on a row, and it
       must never leave two plates of one food on the meal. */
    const twiceAdd = async (presses) => {
      await twicePg.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        days[k] = {};
        localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      });
      await twicePg.reload();
      await twicePg.waitForTimeout(400);
      await twicePg.click('.tab[data-view="macros"]');
      await twicePg.waitForTimeout(300);
      await openMeal(twicePg, 'd');
      /* Two raw foods, found the way a thumb finds them. */
      for (const q of ['beef frank', 'bun']) {
        await twicePg.fill('#mpFind', q);
        await twicePg.waitForTimeout(400);
        await twicePg.evaluate((n) => {
          const r = [...document.querySelectorAll('.mpick-row[data-mpick]')]
            .find((x) => x.dataset.mpick.indexOf('f:') === 0);
          for (let i = 0; r && i < n; i++) r.click();
        }, presses);
        await twicePg.waitForTimeout(250);
      }
      const ids = await twicePg.evaluate(() => {
        const p2 = (x) => (x < 10 ? '0' : '') + x;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const day = JSON.parse(localStorage.getItem('bsc.macroDays'))[k] || {};
        return (day.d || []).map((it) => String(it.id));
      });
      await closeSheet(twicePg);
      return ids;
    };
    const twiceOnce = await twiceAdd(1);
    t.ok('two foods tapped put two plates on the meal',
      twiceOnce.length === 2 && twiceOnce[0] !== twiceOnce[1], twiceOnce.join(','));
    const twiceTwice = await twiceAdd(2);
    t.ok('and a row tapped twice before the sheet redraws never puts the food on twice',
      twiceTwice.length === new Set(twiceTwice).size && twiceTwice.length <= 2, twiceTwice.join(','));
    await twicePg.context().close();

    /* ---- a skipped meal is a meal dealt with -----------------------------
     *
     * The primary button asked whether every meal had food on it before it
     * would stop offering to Fill. A skipped meal never will, so one skip
     * pinned it to "Fill" for the rest of the day — through every plate
     * being ticked — and neither "Mark all complete" nor "Complete the day"
     * could be reached at all. Blake: "when all foods are marked complete,
     * it's still showing fill. I'd expect to see something else."
     *
     * The other half matters as much: a meal that is merely EMPTY is not
     * dealt with, and the button must still offer to fill it. */
    const modePg = await t.fresh({ viewport: { width: 390, height: 800 } });
    const modeRun = async (skip) => {
      await modePg.evaluate((sk) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const pick = (s) => window.RECIPES.filter((r) => r.macro &&
          r.book + '-' + r.secNum === s)[0];
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
          b: [{ id: pick('1-1').id, x: 1, eaten: 1 }],
          l: [{ id: pick('1-3').id, x: 1, eaten: 1 }],
          d: [{ id: pick('1-4').id, x: 1, eaten: 1 }] } }));
        if (sk) localStorage.setItem('bsc.macroSkip', JSON.stringify({ [k]: ['s'] }));
        else localStorage.removeItem('bsc.macroSkip');
      }, skip);
      await modePg.reload();
      await modePg.waitForTimeout(400);
      await modePg.click('.tab[data-view="macros"]');
      await modePg.waitForTimeout(300);
      return modePg.evaluate(() => document.getElementById('macroFill').dataset.mode);
    };
    const modeSkip = await modeRun(true);
    t.ok('with every plate eaten and the fourth meal skipped, the button offers to close the day',
      modeSkip === 'done', 'mode=' + modeSkip);
    const modeEmpty = await modeRun(false);
    t.ok('but a meal merely left empty is still a meal to fill',
      modeEmpty === 'fill', 'mode=' + modeEmpty);
    /* Blake, 2026-10-13: 1,335 / 1,413 kcal eaten (111/171 P, 57/61 F, 96/45 C)
       with Dinner (148 kcal) and Snacks (25 kcal) still open and unskipped must
       offer Fill, not "Complete the day". */
    await modePg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 171, f: 61, c: 45 }));
      localStorage.setItem('bsc.myFoods', JSON.stringify({ soFar: { name: 'Eaten so far', kcal: 1335, p: 111, f: 57, c: 96 } }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:my:soFar', x: 1, eaten: 1 }], l: [], d: [], s: [] } }));
      localStorage.removeItem('bsc.macroSkip');
    });
    await modePg.reload();
    await modePg.waitForTimeout(400);
    await modePg.click('.tab[data-view="macros"]');
    await modePg.waitForTimeout(300);
    const modeCarbOver = await modePg.evaluate(() => document.getElementById('macroFill').dataset.mode);
    t.ok('even with < 100 net kcal left after carb overshoot, open meals still asking for protein keep the button on Fill',
      modeCarbOver === 'fill', 'mode=' + modeCarbOver);
    await modePg.context().close();

    /* ---- the bar's order --------------------------------------------------
     *
     * Blake's grouping: the whole-day actions, then out, then the one
     * primary. Add food and Open all left the bar on 2026-10-04 (a meal's
     * tray is the one door to adding food, and trays show their foods), so
     * it is one row: Rebalance, Sweep, Copy day, and the primary. */
    const orderPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await orderPg.click('.tab[data-view="macros"]');
    await orderPg.waitForTimeout(300);
    const barOrder = await orderPg.evaluate(() =>
      [...document.querySelectorAll('.mday-acts button')].map((b) => b.id).join(' '));
    t.ok('the day bar reads rebalance, sweep, copy, then Fill',
      barOrder === 'macroRebal macroSweep macroCopy macroFill',
      barOrder);
    await orderPg.context().close();
  },
});
