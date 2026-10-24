/* The plan screen rearranged, a food logged with nothing but its calories, a
 * pin that survives an emptied day, "What do you actually eat", the cascade
 * card's rows, a fourteen-day audit of a real plan, and a solver that prices
 * where food lands.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openMeal: openMeal0, closeSheet, openRow } = require('./fixtures/nourish.js');

/* Since 2026-10-04 the day is trays and a meal opens as one sheet over it:
   its plates and the picker are in the sheet, so a test reaching for them
   opens the meal the way a thumb does — closing another meal's sheet first. */
async function openMeal(pg, sk) {
  const on = await pg.evaluate(() => {
    const d = document.querySelector('#modalRoot .msheet [data-mbal], #modalRoot .msheet [data-mmenu]');
    return d ? (d.dataset.mbal || d.dataset.mmenu) : (document.querySelector('#modalRoot .msheet') ? '?' : '');
  });
  if (on === sk) return;
  if (on) await closeSheet(pg);
  await openMeal0(pg, sk);
}
async function backToDay(pg) { await closeSheet(pg); }

module.exports = nourish({
  name: 'Macros — the plan screen, pins, and the solver',
  async suite(t) {
    /* ---- the plan screen, rearranged ------------------------------------
     *
     * Three things moved. The plan became four facts you can read; the meal
     * editor — six rows of five controls, about three fifths of the screen —
     * folded to the one line anybody opens it to check; and Save went with
     * it, because a screen you are only reading has nothing to commit.
     *
     * The fourth fact is the one that was not on this screen at all: where
     * the scale says you actually stand. It lived only on My Day, so the plan
     * could be read end to end without ever meeting the evidence for it. */
    const planPage = async (drift) => {
      const pg = await t.fresh();
      await pg.evaluate((dr) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (off) => {
          const d = new Date(); d.setDate(d.getDate() + off);
          return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        };
        const ws = {};
        // twenty mornings, drifting `dr` lb a day off a 205 lb start
        for (let i = 19; i >= 0; i--) ws[key(-i)] = Math.round((205 - (19 - i) * dr) * 10) / 10;
        localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut1', goalLb: 185, goalBy: key(70),
          workouts: 3, steps: 8000 }));
        localStorage.removeItem('bsc.macroTargets');
      }, drift);
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(350);
      return pg;
    };
    /* Opened the way a thumb opens it, NOT through openPlan — that helper
       unfolds everything on purpose, and what is folded is the thing under
       test here. */
    const openPlanShut = async (pg) => {
      if (!await pg.$('#macroTargBtn')) {
        const h = await pg.$('.mday-weigh [data-mfold]');
        if (h) { await h.click(); await pg.waitForTimeout(250); }
      }
      await pg.click('#macroTargBtn');
      await pg.waitForTimeout(350);
    };

    // flat on the scale against a plan that wants a pound a week: planShut
    const planShut = await planPage(0);
    const planMorn = await planShut.evaluate(() => {
      const el = document.querySelector('.mline');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    t.ok('My Day says when you will arrive, or that there is no date yet',
      /Arriving around|no arrival date/.test(planMorn), planMorn);

    await openPlanShut(planShut);
    const planLedger = () => planShut.evaluate(() => {
      const el = document.getElementById('mtFacts');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    const led0 = await planLedger();
    t.ok('the plan sheet opens on four facts: where to, how fast, when, and where you stand',
      /Going from\s*205 lb → 185 lb/.test(led0) && /At\s*\d/.test(led0) &&
      /Arriving/.test(led0) && /Averaging now\s*205 lb/.test(led0), led0);

    /* One arithmetic, two screens. They used to be worked out separately,
       which is two chances to disagree about one fact — and on the calorie
       bar and the week strip they already had. */
    const planSays = await planShut.evaluate(() => {
      const el = document.getElementById('mtStatus');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    const dayCount = (str) => /no arrival date/i.test(str) ? 'none'
      : (str.match(/Arriving around ([A-Z][a-z]{2} \d{1,2}(?:, \d{4})?)/) || [])[1];
    t.ok('and the pace line beneath them is the SAME estimate My Day gave, not a second one',
      !!dayCount(planSays) && dayCount(planSays) === dayCount(planMorn),
      'sheet: "' + planSays + '" vs day: "' + planMorn + '"');

    /* Both folds shut, so there is nothing on screen that Save could commit. */
    const pl_shutState = () => planShut.evaluate(() => ({
      who: document.getElementById('mtEditor').classList.contains('hide'),
      meals: document.getElementById('mtMealsWrap').classList.contains('hide'),
      save: document.getElementById('mtSave').classList.contains('hide'),
      rows: document.querySelectorAll('#mtMeals .mtm-row').length,
      handle: document.getElementById('mtMealSum').textContent.replace(/\s+/g, ' ').trim()
    }));
    const st0 = await pl_shutState();
    t.ok('the meal editor arrives folded, with its rows still in the document',
      st0.meals && st0.who && st0.rows >= 4, JSON.stringify(st0));
    t.ok('and its handle says how many meals and at what shares',
      /^\w+ meals · (\d+ \/ )+\d+%$/.test(st0.handle), st0.handle);
    t.ok('with nothing being edited, there is no Save to press', st0.save,
      JSON.stringify(st0));

    await planShut.click('[data-mtmfold]');
    await planShut.waitForTimeout(200);
    const st1 = await pl_shutState();
    t.ok('opening the meals unfolds them and brings Save back with them',
      !st1.meals && !st1.save && st1.who, JSON.stringify(st1));
    await planShut.click('[data-mtmfold]');
    await planShut.waitForTimeout(200);
    t.ok('and shutting them takes it away again', (await pl_shutState()).save);
    await planShut.click('[data-mtedit]');
    await planShut.waitForTimeout(200);
    const st2 = await pl_shutState();
    t.ok('the other fold brings it back just the same', !st2.who && !st2.save,
      JSON.stringify(st2));

    /* Editing the goal moves the planLedger with it — the whole point of putting
       the facts and the boxes on one screen is that they cannot disagree. */
    await planShut.fill('#mtGoalLb', '175');
    await planShut.waitForTimeout(300);
    t.ok('and a goal typed into the open fold moves the facts above it',
      /→ 175 lb/.test(await planLedger()), await planLedger());
    await planShut.context().close();

    /* On pace, it says nothing at all. A plan you are keeping to has no news,
       and the last line of a card speaks only when something needs doing. */
    const onPacePg = await planPage((20 / 89) * (19 / 16));
    await openPlanShut(onPacePg);
    t.ok('a plan being kept to says nothing where the pace line would be',
      await onPacePg.evaluate(() => {
        const el = document.getElementById('mtStatus');
        return !!el && !el.textContent.trim() && el.classList.contains('hide');
      }), await onPacePg.evaluate(() =>
        (document.getElementById('mtStatus') || {}).textContent));
    t.ok('though the four facts are still there to read',
      /Averaging now/.test(await onPacePg.evaluate(() =>
        document.getElementById('mtFacts').textContent)));
    await onPacePg.context().close();

    /* ---- a food logged with nothing but its calories ------------------- */
    /* Eating out is the one entry that arrives as a single number, and the
       summary sheet used to lose it whole. mDaySummary derived the day's
       energy as 4P + 4C + 9F, so a 700 kcal salad carrying no macros came to
       nothing: the sheet said "Nothing was written down on this day" directly
       underneath a day bar reading 700. A plate states its own energy and the
       bar has always carried it; this pins the sheet to the same reading of
       the same day. */
    const outPg = await t.fresh();
    await outPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.myFoods', JSON.stringify({
        cafe_rio_salad: { name: 'Cafe Rio salad', unit: 'salad', kcal: 700, p: 0, f: 0, c: 0 },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [k]: { b: [{ id: 'f:my:cafe_rio_salad', x: 1, eaten: 1 }] },
      }));
    });
    await outPg.reload();
    await outPg.evaluate(() => document.fonts.ready);
    await outPg.click('.tab[data-view="macros"]');
    await outPg.waitForTimeout(250);
    const outDay = (await outPg.innerText('#view-macros')).replace(/\s+/g, ' ');
    t.ok('the day bar counts a food logged with only its calories',
      /700 \/ 1,370 kcal/.test(outDay), outDay.slice(0, 200));

    /* Through the menu, because this day has one meal on it and five empty:
       the primary still reads Fill there, and pressing it would draft a day
       rather than close one. "How today went" opens the same card for any
       day, closed or not, which is what this is about. */
    await outPg.click('#macroMore');
    await outPg.waitForTimeout(120);
    await outPg.click('[data-mmore="went"]');
    await outPg.waitForTimeout(400);
    const outSheet = (await outPg.innerText('#modalRoot')).replace(/\s+/g, ' ');
    t.ok('and the summary does not call that day blank',
      !/Nothing was written down/.test(outSheet), outSheet.slice(0, 200));
    t.ok('and the summary reads the same calories the bar does',
      /700/.test(outSheet) && /1,370/.test(outSheet), outSheet.slice(0, 200));
    await outPg.context().close();

    /* ---- a pin survives an emptied day, and does not shut the meal ------ */
    /* Two faults, found dogfooding. Pins were placed in one moment only --
       the first time a day was ever looked at -- and an emptied day keeps its
       key as an object with empty arrays, which is truthy, so that branch
       never ran again and the pin was gone for good. And a pin counted as the
       meal being spoken for, so seven calories of Crio Bru pinned to breakfast
       made Fill step over breakfast entirely. */
    const pinPg = await t.fresh();
    await pinPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [{ k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:crio_bru', x: 1 }] },
          { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' }],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
      // the day EXISTS and is empty -- what deleting every plate leaves behind
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [], l: [], d: [], s: [] } }));
    });
    await pinPg.reload();
    await pinPg.evaluate(() => document.fonts.ready);
    await pinPg.click('.tab[data-view="macros"]');
    await pinPg.waitForTimeout(300);
    /* A folded day card names no foods (2026-10-04, RP-style), so the page
       text alone would pass here whatever the day held. Read the stored day,
       and breakfast's own screen, where the plate would be. */
    const pinB = () => pinPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[k] || {};
      return (day.b || []).map((it) => it.id);
    });
    await openMeal(pinPg, 'b');
    const pinArrive = (await pinPg.innerText('#view-macros')).replace(/\s+/g, ' ');
    const pinArriveB = await pinB();
    t.ok('an emptied day is not re-seeded with its pins just by arriving',
      !/Crio Bru/.test(pinArrive) && pinArriveB.indexOf('f:crio_bru') < 0,
      JSON.stringify(pinArriveB) + ' ' + pinArrive.slice(0, 200));
    await backToDay(pinPg);

    await pinPg.click('#macroFill');
    await pinPg.waitForTimeout(900);
    await openMeal(pinPg, 'b');
    const pinDay = (await pinPg.innerText('#view-macros')).replace(/\s+/g, ' ');
    t.ok('but Fill puts the pin back, because a pin is a standing instruction',
      /Crio Bru/.test(pinDay) && (await pinB()).indexOf('f:crio_bru') >= 0, pinDay.slice(0, 200));
    // the meal's calories are on its tray, so back to the day to read them
    await backToDay(pinPg);

    /* The pin must not be the whole of breakfast. Read off the bench rather
       than the card's own number, which is formatted with a comma. */
    const bKcal = await pinPg.evaluate(() => {
      const day = window.__macroLab.read ? null : null;
      const b = document.querySelector('[data-mopen="b"]');
      const k2 = b && b.closest('.mtray') && b.closest('.mtray').querySelector('.mtray-caps .mcap .mcap-t');
      const m = k2 && /([\d,]+)\s*\//.exec(k2.textContent);
      return m ? Number(m[1].replace(/,/g, '')) : null;
    });
    t.ok('and fills the meal around it rather than counting it as done',
      bKcal !== null && bKcal > 100, 'breakfast came to ' + bKcal + ' kcal');
    /* And a pin that has been EATEN closes the meal like anything else.
       The carve-out above was written for pins — "a pin says I have this
       every day, not this meal is finished" — and forgot a pin can be ticked
       like any other plate. A meal holding one eaten pin read as empty to the
       drafter, and Fill put a second dish on a breakfast that was over. */
    await pinPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [k]: { b: [{ id: 'f:crio_bru', x: 1, eaten: 1 }], l: [], d: [], s: [] } }));
    });
    await pinPg.reload();
    await pinPg.evaluate(() => document.fonts.ready);
    await pinPg.click('.tab[data-view="macros"]');
    await pinPg.waitForTimeout(300);
    await pinPg.click('#macroFill');
    await pinPg.waitForTimeout(900);
    t.ok('and Fill adds nothing to a meal whose pin has been eaten',
      await pinPg.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[k] || {};
        return (day.b || []).length === 1 && day.b[0].id === 'f:crio_bru';
      }),
      await pinPg.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[k] || {};
        return JSON.stringify(day.b || []);
      }));
    await pinPg.context().close();

    /* ---- "What do you actually eat" ------------------------------------ */
    /* The favourite star laid out as a grid, so the ranker has something to
       go on before there is any history. It asserts the WIRING — a tap leaves
       a favourite behind, and picking food the storehouse does not carry says
       so and turns shopping on — not which foods are on which shelf, which is
       the food table's business and changes. */
    const fpPg = await t.fresh();
    await fpPg.click('.tab[data-view="macros"]');
    await fpPg.waitForTimeout(200);
    await fpPg.click('#macroMore');
    await fpPg.waitForTimeout(120);
    await fpPg.click('[data-mmore="foods"]');
    await fpPg.waitForTimeout(400);

    const fpShape = await fpPg.evaluate(() => ({
      shelves: document.querySelectorAll('.fp-shelf').length,
      chips: document.querySelectorAll('.fp-chip').length,
      more: document.querySelectorAll('[data-fpmore]').length,
    }));
    t.ok('the food screen groups the table onto its shelves',
      fpShape.shelves > 2 && fpShape.chips > 20, JSON.stringify(fpShape));
    /* Truncated, or the table's hundred-plus foods are one endless column. */
    t.ok('and a long shelf offers the rest rather than printing it',
      fpShape.more > 0, JSON.stringify(fpShape));

    const grew = await (async () => {
      await fpPg.click('[data-fpmore]');
      await fpPg.waitForTimeout(300);
      return fpPg.evaluate(() => document.querySelectorAll('.fp-chip').length);
    })();
    t.ok('and asking for them gives them', grew > fpShape.chips,
      fpShape.chips + ' -> ' + grew);

    /* A tap is the star, which is the whole point: it costs no new ranking. */
    const fpTap = await fpPg.evaluate(() => {
      const b = [...document.querySelectorAll('.fp-chip:not(.on)')][0];
      const id = b.dataset.fppick;
      b.click();
      return id;
    });
    await fpPg.waitForTimeout(300);
    t.ok('tapping a food keeps it as a favourite',
      await fpPg.evaluate((id) => {
        const on = document.querySelector('[data-fppick="' + id + '"]');
        return !!on && on.classList.contains('on') &&
          on.getAttribute('aria-pressed') === 'true';
      }, fpTap), fpTap);

    /* Choosing food the storehouse does not carry turns Fill-may-shop on --
       a favourite the drafter can never use is a tap that did nothing -- and
       the sheet says so rather than letting you find out by noticing. */
    const fpExt = await fpPg.evaluate(() => {
      const b = [...document.querySelectorAll('.fp-chip.ext:not(.on)')][0];
      if (!b) return null;
      b.click();
      return true;
    });
    await fpPg.waitForTimeout(300);
    t.ok('picking food the storehouse lacks turns shopping on, and says so',
      !fpExt || await fpPg.evaluate(() =>
        !!document.querySelector('.fp-note') &&
        JSON.parse(localStorage.getItem('bsc.macroProfile') || '{}').extFill === true),
      await fpPg.evaluate(() => (document.querySelector('.fp-note') || {}).textContent || '(no note)'));
    /* And it has a door. close() clears every sheet flag there is, and this
       one was added without being added to it — so x and the backdrop both
       called close(), close() left S.favPick standing, and renderModal drew
       the grid straight back. Blake, stuck inside it: "when I click done or
       try to exit out of this screen it doesn't let me go anywhere." The note
       above that block in close() describes this exact failure, from the last
       time somebody made it. */
    await fpPg.evaluate(() => document.querySelector('.sheet-x').click());
    await fpPg.waitForTimeout(400);
    t.ok('the food screen closes on the x',
      await fpPg.evaluate(() => !document.querySelector('.fp-shelf')));

    await fpPg.click('#macroMore');
    await fpPg.waitForTimeout(120);
    await fpPg.click('[data-mmore="foods"]');
    await fpPg.waitForTimeout(400);
    await fpPg.evaluate(() => {
      const b = document.querySelector('.fp-chip:not(.on)');
      if (b) b.click();
    });
    await fpPg.waitForTimeout(300);
    await fpPg.evaluate(() => document.querySelector('.sync-row .btn-primary').click());
    await fpPg.waitForTimeout(400);
    t.ok('and on its own Done, with food chosen',
      await fpPg.evaluate(() => !document.querySelector('.fp-shelf')));
    t.ok('and the day is reachable again behind it',
      await fpPg.evaluate(() => !!document.getElementById('macroFill')));
    /* The wizard's own finish, which takes a different road out — its own
       handler rather than the sheet-done class — and has to arrive anyway. */
    await fpPg.evaluate(() => {
      ['bsc.macroProfile', 'bsc.macroTargets'].forEach((k) => localStorage.removeItem(k));
    });
    await fpPg.reload();
    await fpPg.waitForTimeout(400);
    await fpPg.click('.tab[data-view="macros"]');
    await fpPg.waitForTimeout(250);
    await fpPg.click('#macroFill');
    await fpPg.waitForTimeout(400);
    for (let i = 0; i < 4; i++) {
      await fpPg.click('[data-mtw="next"]');
      await fpPg.waitForTimeout(220);
    }
    await fpPg.click('[data-mtw="done"]');
    await fpPg.waitForTimeout(400);
    t.ok('and the first run lets go when its last step is finished',
      await fpPg.evaluate(() => !document.querySelector('[data-mtwstep]')));
    await fpPg.context().close();

    /* ---- the cascade card's rows are about THIS meal's miss ------------ */
    /* They showed each meal's plan share against its current ask, which
       folds in every meal finished so far — so under "Lunch went 216 under"
       the rows summed to 850, and the sign on each was chosen by whether
       lunch went over rather than by which way the row moved: "573 -> 524
       +49". Blake, with before/after screenshots: "the macro is shifting
       after I click Complete". Two assertions, one per fault: the deltas add
       up to the miss, and every sign points the way its arrow does. */
    const ccPg = await t.fresh();
    await ccPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 62, c: 133 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [
        { k: 'w', n: 'Wake Up', t: 'b', w: 15 }, { k: 'b', n: 'Breakfast', t: 'b', w: 25 },
        { k: 'l', n: 'Lunch', t: 'l', w: 20 }, { k: 'd', n: 'Dinner', t: 'd', w: 30 },
        { k: 'e', n: 'Evening Snack', t: 's', w: 10 }],
        names: { w: 'Wake Up', b: 'Breakfast', l: 'Lunch', d: 'Dinner', e: 'Evening Snack' } }));
      // two meals already over their share, lunch finished light
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        w: [{ id: 27, x: 1, eaten: 1 }], b: [{ id: 28, x: 1, eaten: 1 }, { id: 'f:egg', x: 2, eaten: 1 }],
        l: [{ id: 'f:egg_white', x: 1.25, eaten: 1 }], d: [], e: [] } }));
    });
    await ccPg.reload();
    await ccPg.evaluate(() => document.fonts.ready);
    await ccPg.click('.tab[data-view="macros"]');
    await ccPg.waitForTimeout(400);
    const cc = await ccPg.evaluate(() => {
      const el = document.querySelector('.mcasc');
      if (!el) return null;
      const head = (el.querySelector('.mcasc-t') || {}).textContent || '';
      const miss = Number((head.match(/(\d+) (under|over)/) || [])[1]);
      const rows = [...el.querySelectorAll('.mcasc-row[aria-checked="true"]')].map((r) => {
        const w = (r.querySelector('.mcasc-was') || {}).textContent || '';
        const was = Number(w.split('\u2192')[0].trim()), now = Number(w.split('\u2192')[1].trim());
        const dTxt = (r.querySelector('.mcasc-d') || {}).textContent || '';
        return { was, now, sign: dTxt.charAt(0), d: Number(dTxt.replace(/[^\d]/g, '')) };
      });
      return { head, miss, rows };
    });
    t.ok('the cascade card appears under a lunch that finished light',
      !!cc && /under/.test(cc.head) && cc.rows.length > 0, JSON.stringify(cc));
    /* Within a few calories of rounding, and only when nothing is capped —
       a capped meal cannot take its full part, and the landing line says so. */
    t.ok('and its rows add up to the miss the heading names',
      !!cc && Math.abs(cc.rows.reduce((a, r) => a + r.d, 0) - cc.miss) <= cc.rows.length + 1,
      !!cc && cc.rows.map((r) => r.d).join(' + ') + ' vs ' + cc.miss);
    t.ok('and every sign points the way its own arrow does',
      !!cc && cc.rows.every((r) => (r.now > r.was && r.sign === '+') ||
        (r.now < r.was && r.sign === '\u2212') || r.now === r.was),
      !!cc && JSON.stringify(cc.rows));
    await ccPg.context().close();

    { /* own scope: run(t) is one function and its names are spoken for */
    /* ---- two things a fourteen-day audit found on Blake's own plan ------ */
    /* Snacks drew from Worth the Afternoon and the Copycat Shelf, so its
       Fits best opened on a braise and Fill put taco beef in an evening
       snack; and the picker's portion cap counts in the food's own unit,
       which for the vegetables is the pound, so Wake Up was offered a bag of
       broccoli as a protein source. Pinned against the rendered picker. */
    const auPg = await t.fresh();
    await auPg.evaluate(() => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 62, c: 133 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [
        { k: 'w', n: 'Wake Up', t: 'b', w: 12 }, { k: 'b', n: 'Breakfast', t: 'b', w: 23 },
        { k: 's', n: 'Snacks', t: 's', w: 8 }, { k: 'l', n: 'Lunch', t: 'l', w: 22 },
        { k: 'd', n: 'Dinner', t: 'd', w: 27 }, { k: 'e', n: 'Evening Snack', t: 's', w: 8 }],
        names: { w: 'Wake Up', b: 'Breakfast', s: 'Snacks', l: 'Lunch', d: 'Dinner', e: 'Evening Snack' } }));
    });
    await auPg.reload();
    await auPg.evaluate(() => document.fonts.ready);
    await auPg.click('.tab[data-view="macros"]');
    await auPg.waitForTimeout(300);
    const fitsOf = async (slotKey) => {
      // the picker is in the meal's own sheet (2026-10-04)
      await openMeal(auPg, slotKey);
      await auPg.waitForTimeout(250);
      const rows = await auPg.evaluate(() => {
        const ds = [...document.querySelectorAll('#mpList .mt-div')];
        const h = ds.find((d) => /fits best|on the shelf/i.test(d.innerText));
        const out = []; let n = h && h.nextElementSibling;
        while (n && !n.classList.contains('mt-div')) {
          const b = n.querySelector && n.querySelector('.mpick-row');
          if (b) {
            const id = b.dataset.mpick, x = Number(b.dataset.mpx);
            const r = window.RECIPES.find((rr) => String(rr.id) === id);
            out.push({ id, x, sec: r ? r.book + '-' + r.secNum : null, food: !r,
              grams: r ? null : (b.querySelector('.mp-fit') || {}).textContent });
          }
          n = n.nextElementSibling;
        }
        return out;
      });
      // out by Done (the × left the meal's head on 2026-10-05)
      await closeSheet(auPg);
      return rows;
    };
    const auSnack = await fitsOf('s');
    t.ok('a snack slot is never offered a dish from Worth the Afternoon or the Copycat Shelf',
      auSnack.length > 0 && auSnack.every((r) => r.sec !== '2-6' && r.sec !== '2-7'),
      JSON.stringify(auSnack.map((r) => r.sec)));
    /* Read the gram figure off the row's own fit line: a food's portion is
       stated there in the plate's words — "340 g · ¾ lb", "2 whole · 100 g"
       — and the plate it makes is what the fit line prices. Four hundred
       grams is the ceiling in the code. */
    const auWake = await fitsOf('w');
    const heavy = await auPg.evaluate((rows) => rows.filter((r) => r.food).map((r) => r.grams), auWake);
    t.ok('and no single food is offered as a dish beyond a plateful',
      heavy.every((g) => {
        const m = /(?:^|· )(\d+) g\b/.exec(g || '');
        return !m || Number(m[1]) <= 400;
      }), JSON.stringify(heavy));
    await auPg.context().close();
    }

    /* ---- the solver prices where food lands, not only how much ---------- */
    /* Fill is random, so this pins mBalanceDay directly on a built day: a
       dinner holding three servings of one dish beside an empty lunch. With
       nothing pricing the meal shares, the balancer had no reason to move
       calories from dinner to lunch — the day's totals are the same either
       way — and on Blake's plan the last meal came in at 0.59 of its share as
       a result. With the share term it does. Deterministic: no draw. */
    { const shPg = await t.fresh();
    const shWas = await shPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 62, c: 133 }));
      const dish = window.RECIPES.find((r) => r.book === 2 && r.secNum === 3 && r.macro && r.macro.kcal > 350);
      const lunch = window.RECIPES.find((r) => r.book === 2 && r.secNum === 2 && r.macro && r.macro.kcal > 300);
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [], l: [{ id: lunch.id, x: 0.5, eaten: 0, by: 'f' }],
        d: [{ id: dish.id, x: 3, eaten: 0, by: 'f' }], s: [] } }));
      return { dish: dish.id, lunch: lunch.id, k };
    });
    await shPg.reload();
    await shPg.evaluate(() => document.fonts.ready);
    await shPg.click('.tab[data-view="macros"]');
    await shPg.waitForTimeout(300);
    const shAfter = await shPg.evaluate((w) => {
      window.__macroLab.balance();
      const day = JSON.parse(localStorage.getItem('bsc.macroDays'))[w.k];
      return { dinnerX: day.d[0].x, lunchX: day.l[0].x };
    }, shWas);
    /* The first of these holds with the share term zeroed — a day over its
       target shrinks its biggest plate whatever prices the meals — so it is
       the setting, not the evidence. The second is the evidence: with the
       term at nought the lunch stays at half a serving, mutation-proved. */
    t.ok('balancing a day over target brings the three-serving dinner down',
      shAfter.dinnerX < 3, 'dinner ×' + shAfter.dinnerX);
    t.ok('and the share term moves food onto the lunch beside it, not only off the dinner',
      shAfter.lunchX > 0.5, 'lunch ×' + shAfter.lunchX);
    await shPg.context().close(); }

    /* Dialled by the gram.
     *
       Blake weighs, and asked for it outright: "adjust grams with the +/-
       and show the serving size where the grams are being shown now." A food
       measured by the cup or the spoon shows its weight on the dial and its
       kitchen unit on the chip; a tap moves five grams; typing types grams.
       A food that comes in ones — an egg — still counts in ones. */
    {
      const gp = await t.fresh();
      await gp.click('.tab[data-view="macros"]');
      await gp.waitForTimeout(300);
      const cup = await gp.evaluate(() => {
        const r = window.__macroLab.foods().find((f) => /chicken breast/i.test(f.name));
        const egg = window.__macroLab.foods().find((f) => f.unit === 'each' && /^eggs?$/i.test(f.name));
        return { id: r && r.id, grams: r && r.grams, unit: r && r.unit, egg: egg && egg.id };
      });
      t.ok('chicken breast is a cup in the table', cup.unit === 'cup' && cup.grams > 0, JSON.stringify(cup));
      await gp.evaluate(([id, egg]) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
          b: [{ id: egg, x: 2, eaten: 0 }], l: [{ id: id, x: 1, eaten: 0 }], d: [], s: [] } }));
      }, [cup.id, cup.egg]);
      await gp.reload();
      await gp.click('.tab[data-view="macros"]');
      await gp.waitForTimeout(400);
      /* A meal opens as its own screen (2026-10-04), so a row is read with
         its meal opened first — and the plate is found by its amount bar,
         the per-food eaten tick it used to be found by having gone with that
         redesign ("No individual foods ticks"). */
      const row = async (slot) => {
        await openMeal(gp, slot);
        return gp.evaluate((s) => {
          const it = document.querySelector('[data-mstep="' + s + ':0:up"]').closest('.mitem');
          return { dial: it.querySelector('.mstep-x').textContent.trim(),
            chip: (it.querySelector('.mitem-uom') || {}).textContent || '' };
        }, slot);
      };
      const c0 = await row('l');
      t.ok('a cup of chicken shows its weight on the dial', /^\d+ g$/.test(c0.dial), JSON.stringify(c0));
      t.ok('and the cup on the chip', /1 cup/.test(c0.chip), JSON.stringify(c0));
      await openRow(gp, 'l:0');
      await gp.click('[data-mstep="l:0:up"]');
      await gp.waitForTimeout(150);
      const c1 = await row('l');
      t.ok('a tap moves it five grams', parseInt(c1.dial, 10) === parseInt(c0.dial, 10) + 5, c0.dial + ' → ' + c1.dial);
      /* 145 g is 1.04 cups: the chip rounds to the eighth and says "1 cup" —
         the live site said "1 cups", plural by the unrounded number. */
      t.ok('and the chip still says one cup, not one cups', /^1 cup$/.test(c1.chip), JSON.stringify(c1));
      /* And keeps moving. 145 of a 140 g cup is 1.0357 of it, which times
         140 is 144.998 — one grid point short of the dial — and the second
         tap landed on 145 again. Blake: "it stops at a number and won't go
         past." Ten taps, fifty grams, on the one food he eats most. */
      await openRow(gp, 'l:0');
      for (let i = 0; i < 9; i++) await gp.click('[data-mstep="l:0:up"]');
      await gp.waitForTimeout(200);
      const c10 = await row('l');
      t.ok('and ten taps are fifty grams, not one tap and a wall',
        parseInt(c10.dial, 10) === parseInt(c0.dial, 10) + 50, c0.dial + ' → ' + c10.dial + ' after ten taps');
      await openRow(gp, 'l:0');
      await gp.click('[data-mtype="l:0"]');
      await gp.waitForTimeout(100);
      await gp.fill('.mstep-in', '185');
      await gp.press('.mstep-in', 'Enter');
      await gp.waitForTimeout(200);
      const c2 = await row('l');
      const stored = await gp.evaluate(() => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        return days[Object.keys(days)[0]].l[0].x;
      });
      t.ok('typing 185 is a hundred and eighty-five grams', c2.dial === '185 g', JSON.stringify(c2));
      t.ok('stored as a share of the cup, not as servings', Math.abs(stored * cup.grams - 185) < 0.6, stored + ' × ' + cup.grams);
      const e0 = await row('b');
      /* Grams are the dial for every food with a weight since 2026-10-04
         (Blake: "I dial in grams of food not kitchen measurements"), an egg
         included — but nobody eats a fraction of one, so it still steps a
         whole egg at a time, and the count is the small print. */
      t.ok('an egg says its weight on the dial and its count in the small print', /^100 g$/.test(e0.dial) && /^2 whole$/.test(e0.chip.trim()), JSON.stringify(e0));
      await openRow(gp, 'b:0');
      await gp.click('[data-mstep="b:0:up"]');
      await gp.waitForTimeout(150);
      const e1 = await row('b');
      t.ok('but an egg still counts in ones: a tap is one more egg', /^150 g$/.test(e1.dial) && /^3 whole$/.test(e1.chip.trim()), JSON.stringify(e1));
      await gp.context().close();
    }
  },
});
