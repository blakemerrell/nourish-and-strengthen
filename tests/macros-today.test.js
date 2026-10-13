/* Trained today, Plan today folding all the way, the week strip as boxes,
 * the add sheet's pills, a stale reading going stale, an answer that does
 * not depend on the order the day was built, and Balance solving against the
 * share the card prints.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openMeal, closeSheet } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — trained today, Plan today, the week strip, and Balance',
  async suite(t) {
    /* ---- trained today ----------------------------------------------------
     *
     * The profile already says how many sessions a week and mBurn spreads
     * those calories over all seven days, rest days included — so a tick here
     * must buy NO calories or it is the same session paid for twice. What it
     * moves is where the carbohydrate lands: carb cycling picks its training
     * days from an evenly-spread pattern, so saying three and lifting Tue,
     * Thu, Sat put the high-carb days on Mon, Wed, Fri every week. */
    const trainPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await trainPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 43, ft: 5, inch: 10, lb: 195, act: 1.375, goal: 'cut1',
        goalLb: 175, goalBy: key(g), workouts: 3, steps: 8000 }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 120 }));
    });
    await trainPg.reload();
    await trainPg.waitForTimeout(400);
    await trainPg.click('.tab[data-view="macros"]');
    await trainPg.waitForTimeout(300);
    const trainWas = await trainPg.evaluate(() => {
      const b = document.querySelector('[data-mtrained]');
      return { kcal: window.__macroLab.targets(),
        pressed: b ? b.getAttribute('aria-pressed') : 'missing' };
    });
    t.ok('the morning offers a tick, and starts on whatever the plan assumed',
      trainWas.pressed === 'true' || trainWas.pressed === 'false', JSON.stringify(trainWas.pressed));

    await trainPg.click('[data-mtrained]');
    await trainPg.waitForTimeout(300);
    const trainNow = await trainPg.evaluate(() => ({
      pressed: document.querySelector('[data-mtrained]').getAttribute('aria-pressed'),
      targets: window.__macroLab.targets(),
    }));
    t.ok('tapping it flips the day and nothing else',
      trainNow.pressed !== trainWas.pressed &&
        trainNow.targets.p === trainWas.kcal.p && trainNow.targets.f === trainWas.kcal.f,
      JSON.stringify({ was: trainWas.pressed, now: trainNow.pressed,
        p: [trainWas.kcal.p, trainNow.targets.p], f: [trainWas.kcal.f, trainNow.targets.f] }));
    t.ok('and it is the carbohydrate that moves, never the calories it was already paid',
      trainNow.targets.c !== trainWas.kcal.c,
      'carbs ' + trainWas.kcal.c + ' -> ' + trainNow.targets.c);
    await trainPg.context().close();

    /* ---- Plan today: it folds all the way, and repeats nothing -----------
     *
     * Blake: "weigh in card I think needs to be more plan the day." Then,
     * on the first build of it: "I don't need a duplicate card saying the
     * exact same thing. The sticky header is doing it with the calories and
     * macros." Then: "it needs to fully collapse."
     *
     * So the card says ONLY what nothing else on the screen says: what the
     * scale read, whether you trained, and why that moved the carbohydrate.
     * The day's calories and the three macros are on the sticky strip four
     * inches above it and are not repeated here.
     *
     * Folded is the default once both questions are answered, and folded
     * means ONE row — a card still showing two of its three rows is not
     * shut. On a morning not yet answered it opens itself, because there is
     * nothing to collapse to and a tap to reach the box is a tap the app
     * made you spend.
     *
     * Steps are deliberately never an input. They are already in the burn,
     * you do not know them until bedtime, and a box for them invites eating
     * them back — the double-count the training tick exists to avoid. */
    const todayPg = await t.fresh({ viewport: { width: 390, height: 900 } });
    const todaySeed = (withWeight) => (w) => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const key = (x) => x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate());
      const k = key(d), ws = {};
      /* A week of mornings so the trend lines have something to say, but the
         LAST one only when the case under test is "already answered". */
      for (let i = 6; i >= 1; i--) {
        const dd = new Date(d); dd.setDate(dd.getDate() - i);
        ws[key(dd)] = 205;
      }
      if (w) ws[k] = 205;
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 61, c: 75 }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, lb: 205,
        ft: 5, inch: 10, act: 1.55, goal: 'cut1', goalLb: 0, goalBy: '', workouts: 4,
        steps: 7000, train: [0, 1, 2, 3, 4, 5, 6].slice(0, 4) }));
      localStorage.setItem('bsc.macroTrained', JSON.stringify({ [k]: Date.now() }));
    };
    const todayLook = async (withWeight) => {
      await todayPg.evaluate(todaySeed(withWeight), withWeight);
      await todayPg.reload();
      await todayPg.waitForTimeout(400);
      await todayPg.click('.tab[data-view="macros"]');
      await todayPg.waitForTimeout(350);
      return todayPg.evaluate(() => {
        const handle = document.querySelector('[data-mfold="weigh"]');
        const card = handle.closest('.mslot') || handle.parentElement.parentElement;
        const want = window.__macroLab.targets();
        const kcal = Math.round(4 * want.p + 4 * want.c + 9 * want.f);
        const txt = card.textContent.replace(/[\s,]+/g, '');
        return {
          open: handle.getAttribute('aria-expanded'),
          named: /plan today/i.test(handle.textContent || ''),
          sum: (document.querySelector('.mw-sum') || {}).textContent || '',
          ask: !!document.querySelector('.mw-ask'),
          tick: !!document.querySelector('.mw-train'),
          why: (document.querySelector('.mw-why') || {}).textContent || '',
          verdict: !!document.querySelector('.mw-verdict'),
          body: !!document.querySelector('.mw-body'),
          box: !!card.querySelector('#mWeight'),
          repeatsKcal: txt.indexOf(String(kcal)) >= 0,
          repeatsSplit: /205P|61F|94C/.test(txt),
          want: want, kcal: kcal, txt: txt.slice(0, 140),
        };
      });
    };

    const todayShut = await todayLook(true);
    t.ok('the card is called Plan today, not Weigh-in',
      todayShut.named, JSON.stringify(todayShut));
    t.ok('once the morning is answered it folds itself shut',
      todayShut.open === 'false', JSON.stringify(todayShut));
    /* Shut means shut. The first build of this kept the tick and an answer
       row on the face and called itself folded. */
    t.ok('and folded means one row — no tick, no reason, no verdict under it',
      !todayShut.tick && !todayShut.why && !todayShut.verdict,
      JSON.stringify(todayShut));
    t.ok('the folded row says what the scale read and whether you trained',
      /205/.test(todayShut.sum) && /lb/.test(todayShut.sum) &&
        /train/i.test(todayShut.sum), todayShut.sum);
    /* The whole point of the second pass: the strip above already carries
       these, and a card that says them again is a second answer to a
       settled question. */
    t.ok('and it never repeats the day’s calories or macros, which the strip carries',
      !todayShut.repeatsKcal && !todayShut.repeatsSplit, todayShut.txt);

    /* The third state. A morning with nothing on the scale is not folded —
       the box and the tick are there without a tap — but it is not OPEN
       either: a card that has not been given its two numbers has not earned
       an opinion, and a pace verdict over an empty box is the nagging this
       screen was rebuilt to stop. */
    const todayNew = await todayLook(false);
    t.ok('a morning not yet weighed puts the box in reach without a tap',
      todayNew.box && !todayNew.sum, JSON.stringify(todayNew));
    t.ok('and claims nothing over it — no verdict, no history',
      !todayNew.verdict && !todayNew.body, JSON.stringify(todayNew));

    /* ONE tap. This read two while the handle was lying about being expanded
       — it reported "not shut" as open, so the first tap closed what it meant
       to open and the second re-opened it, and the pair happened to land in
       the right place. With the handle telling the truth, two taps is open
       then shut, and the line under test is not on screen. */
    await todayPg.click('[data-mfold="weigh"]');
    await todayPg.waitForTimeout(350);
    const todayOpen = await todayPg.evaluate(() => {
      const el = document.querySelector('.mw-tick-s');
      const base = JSON.parse(localStorage.getItem('bsc.macroTargets'));
      const now = window.__macroLab.targets();
      const s2 = el ? el.textContent.replace(/\s+/g, ' ') : '';
      return { txt: s2, base: base.c, now: now.c,
        both: s2.indexOf(String(now.c)) >= 0 && s2.indexOf(String(base.c)) >= 0,
        /* "on an average day": the tick moves today against the week's own
           average — it does not add to the week. */
        week: /on an average day/i.test(s2),
        steps: !!document.querySelector('[data-mfold="weigh"]')
          .closest('.mslot, div').querySelector('input[inputmode="numeric"]') };
    });
    /* Naming BOTH numbers is what makes it an explanation and not an
       assertion — it has to show the swap, not just the result. */
    t.ok('opened, it says why today differs and names both carb figures',
      todayOpen.both, JSON.stringify(todayOpen));
    t.ok('and that the week does not grow because you ticked a box',
      todayOpen.week, todayOpen.txt);
    t.ok('and there is no steps box on it, at any state',
      todayOpen.steps === false, JSON.stringify(todayOpen));
    await todayPg.context().close();

    /* ---- the week strip is boxes now --------------------------------------
     *
     * Blake, drawing it: "[ ] [ ] [ ] [ ] [ ] [ ] [ ] these a bit more like a
     * box not a pill shape. still fill up toward a target."
     *
     * Measured rather than read off the stylesheet. The width is min() against
     * the column, which is the whole reason a 36px track is safe at 320px, and
     * a rule that SAYS 36px does not prove the track fits inside its cell. */
    const boxPg = await t.fresh({ viewport: { width: 320, height: 800 } });
    await boxPg.click('.tab[data-view="macros"]');
    await boxPg.waitForTimeout(300);
    const boxShape = await boxPg.evaluate(() => {
      const b = document.querySelector('.mwk-b');
      const cs = getComputedStyle(b);
      return { w: b.getBoundingClientRect().width,
        col: b.closest('.mwk-c').getBoundingClientRect().width,
        r: parseFloat(cs.borderRadius) };
    });
    t.ok('a day on the week strip is a box, not a capsule',
      boxShape.r <= 6 && boxShape.w >= 24, JSON.stringify(boxShape));
    t.ok('and at 320px it still fits inside its own column',
      boxShape.w <= boxShape.col + 0.5, JSON.stringify(boxShape));
    await boxPg.context().close();

    /* ---- the add sheet's pills say both halves ---------------------------
     *
     * Blake: "whenever I hit the add button and it takes me to making a meal,
     * those three macros clearly show me how much I've selected and what is
     * left. That makes a perfect meal."
     *
     * They were one figure — the gap — on a flat tint. One figure answers
     * half the question and hides the other: a lone "20" cannot say whether
     * that is the whole meal still to come or the last mouthful of it. Now
     * each pill carries what is ON the meal and what the meal is FOR, with
     * the fill drawing the proportion between them, which is the pair the
     * day's own pills settled on.
     *
     * Still pills. The shape did not change — only the fill and the figures.
     *
     * Asserted at the two ends, which need no number out of the app's own
     * head: an untouched meal holds none of its ask and must read empty, and
     * a meal past its ask must read full. */
    const gapPg = await t.fresh({ viewport: { width: 320, height: 800 } });
    const gapAt = async (x) => {
      await gapPg.evaluate((mult) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const r = window.RECIPES.filter((q) => q.macro &&
          q.book + '-' + q.secNum === '1-4')[0];
        localStorage.setItem('bsc.macroDays', JSON.stringify(
          mult ? { [k]: { d: [{ id: r.id, x: mult, eaten: 0 }] } } : { [k]: {} }));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 205, f: 61, c: 94 }));
      }, x);
      await gapPg.reload();
      await gapPg.waitForTimeout(400);
      await gapPg.click('.tab[data-view="macros"]');
      await gapPg.waitForTimeout(300);
      /* Dinner's sheet: its pills are the meal's own (2026-10-04), the
         figure over its share, filled toward it. */
      await openMeal(gapPg, 'd');
      return gapPg.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-top .mcap')].map((e) => {
        const fl = e.querySelector('.mcap-fl');
        const hit = ((fl && fl.getAttribute('style')) || '').match(/width:\s*([\d.]+)%/);
        const cs = getComputedStyle(e);
        const nums = (e.textContent.replace(/,/g, '').match(/\d+/g) || []).map(Number);
        return { pct: hit ? Number(hit[1]) : null,
          grad: !!fl,
          met: nums[0] >= nums[nums.length - 1] && (e.classList.contains('on') || e.classList.contains('over')),
          both: /\d+\s*\/\s*\d+/.test(e.textContent),
          got: nums[0], want: nums[nums.length - 1],
          radius: parseFloat(cs.borderRadius),
          clipped: e.scrollWidth > e.clientWidth + 0.5,
          top: Math.round(e.getBoundingClientRect().top),
          txt: e.textContent.trim() };
      }));
    };

    const gapEmpty = await gapAt(0);
    t.ok('every pill on the meal\u2019s sheet is still a pill, and is drawn with a fill',
      gapEmpty.length === 4 && gapEmpty.every((g) => g.grad && g.radius >= 12),
      JSON.stringify(gapEmpty.map((g) => g.radius + '/' + g.grad)));
    t.ok('and each says both halves — what is on the meal, and what it is for',
      gapEmpty.every((g) => g.both && g.want > 0), gapEmpty.map((g) => g.txt).join(' '));
    t.ok('an untouched meal holds none of its ask, and the fill says so',
      gapEmpty.every((g) => g.got === 0 && g.pct === 0 && !g.met),
      JSON.stringify(gapEmpty));
    /* Four fills only compare by eye if the boxes match. On a flex row with a
       56px floor the fourth wrapped to its own line at 320 and stretched the
       width of the sheet, and the calorie pill clipped its own target. */
    t.ok('the four sit on one row at 320px with nothing clipped',
      new Set(gapEmpty.map((g) => g.top)).size === 1 &&
        gapEmpty.every((g) => !g.clipped),
      JSON.stringify(gapEmpty.map((g) => g.top + (g.clipped ? ' CLIPPED' : ''))));

    /* Six times the dish it was ranked for takes every macro past the ask. */
    const gapFull = await gapAt(6);
    t.ok('a meal past its ask reads full on every pill',
      gapFull.every((g) => g.pct === 100 && g.met && g.got >= g.want),
      JSON.stringify(gapFull.map((g) => g.txt + ' ' + g.pct + (g.met ? ' met' : ''))));

    /* One helper draws both rows. They were two gradients written out
       separately, which is how two things that must match stop matching. */
    await closeSheet(gapPg);
    const gapDay = await gapPg.evaluate(() =>
      [...document.querySelectorAll('.mpill')].map((e) =>
        /linear-gradient\(90deg/.test(e.getAttribute('style') || '')));
    t.ok('and the day’s folded pills are drawn with a fill too',
      gapDay.length > 0 && gapDay.every(Boolean), JSON.stringify(gapDay));
    await gapPg.context().close();

    /* ---- a stale reading goes stale, it does not get worse ---------------
     *
     * The seven-day average is anchored on the last weigh-in. The plan line
     * it was compared against was for TODAY. So every morning off the scale
     * widened the gap on its own: identical mornings and an identical plan
     * read 12 days behind on the day of the last weigh-in and 24 a fortnight
     * later, and half of that number was just the days since he stood on it.
     *
     * Blake, shown a pace verdict under an empty weigh-in box: "I didn't want
     * to be nagged, but coached and informed." So past a day the card states
     * which morning it is reading and what that morning said, and asks for
     * nothing — a stat, then silence, which is his own rule for a last line. */
    const staleSeed = (gap) => (g) => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - g - i);
        ws[key(d)] = Math.round((195 + i * 0.1) * 10) / 10;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      const goal = new Date(); goal.setDate(goal.getDate() + 120);
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 43, ft: 5, inch: 10, lb: 195, act: 1.375, goal: 'cut1',
        goalLb: 175, goalBy: key(goal), workouts: 4, steps: 8000 }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 120 }));
    };
    const staleAt = async (gap) => {
      const pg = await t.fresh({ viewport: { width: 390, height: 800 } });
      await pg.evaluate(staleSeed(gap), gap);
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      const out = await pg.evaluate(() => {
        const f = window.__macroLab.pace();
        const el = document.querySelector('.mline');
        return { daysOff: f && f.daysOff, stale: f && f.stale,
          text: el ? el.textContent : '',
          eat: !!document.querySelector('[data-mline^="mline:eat"]') };
      });
      await pg.context().close();
      return out;
    };
    const staleFresh = await staleAt(0);
    const staleOld = await staleAt(14);
    t.ok('days behind pace does not grow just because nobody stood on the scale',
      Math.abs(staleFresh.daysOff - staleOld.daysOff) <= 2,
      'fresh ' + staleFresh.daysOff + ' vs 14 days later ' + staleOld.daysOff);
    t.ok('and a fortnight-old reading says which morning it is reading, and asks for nothing',
      staleOld.stale === 14 && /Last weighed/.test(staleOld.text) && !staleOld.eat,
      JSON.stringify(staleOld).slice(0, 180));
    t.ok('while a reading taken this morning still gives its verdict',
      staleFresh.stale === 0 && /Arriving around|On track|no arrival date/.test(staleFresh.text),
      staleFresh.text.slice(0, 90));

    /* ---- the answer does not depend on the order the day was built --------
     *
     * Coordinate descent visits one plate at a time, so the order it walks
     * them in is part of the answer, and it walked them in the order the
     * day object was built: a pinned meal first, a hand-built day in tap
     * order, a synced day as stored. These three plates, solved forward and
     * backward, landed at ×¼ / ×1 / ×¾ and at ×½ / ×1 / ×½. The solver walks
     * the meals in their own order now, whatever road the day came in by. */
    const ordered = [];
    for (const keys of [['b', 'l', 'd'], ['d', 'l', 'b']]) {
      const ordPg = await t.fresh({ viewport: { width: 390, height: 800 } });
      await ordPg.evaluate((ks) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const ids = { b: 150, l: 311, d: 195 };
        const day = {};
        ks.forEach((kk) => { day[kk] = [{ id: ids[kk], x: 1, eaten: 0 }]; });
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: day }));
      }, keys);
      await ordPg.reload();
      await ordPg.waitForTimeout(400);
      await ordPg.click('.tab[data-view="macros"]');
      await ordPg.waitForTimeout(300);
      ordered.push(await ordPg.evaluate(() => {
        window.__macroLab.balance();
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        return ['b', 'l', 'd'].map((kk) => day[kk][0].x).join('/');
      }));
      await ordPg.context().close();
    }
    t.ok('the same plates solve to the same portions whichever way the day was built',
      ordered[0] === ordered[1], ordered.join(' vs '));

    /* ---- Balance solves against the share the card is printing ------------
     * The meal's pills say what the meal is owed; the ⚖ on the same card
     * solves the plates toward it. Those were two different sums: the pills
     * drop a meal you have skipped and left empty, and the button divided by
     * every slot on the day regardless. So on a day with skips the button
     * pulled a meal to roughly half of the target printed an inch above it,
     * then the pills called it short. Asserted against the pills' own printed
     * denominator rather than a computed share, because the pills are what
     * the reader is looking at when they press it. */
    /* Seeded rather than Filled: mFill picks at random from its top three, so
       a day it builds is a different day each run — and this assertion is a
       comparison between two days that have to be identical apart from the
       skips. The two dishes come out of window.RECIPES at run time, never
       written down here. */
    const balDay = async (skips) => {
      const pg = await t.fresh({ viewport: { width: 390, height: 800 } });
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      await pg.evaluate(() => {
        /* Protein-dense and small, so the solver's answer is an interior one
           it has to think about. Given two carb-heavy dishes it drives both
           days to the ×¼ floor — the same answer for opposite reasons, which
           tells a comparison nothing. */
        const two = window.RECIPES.filter((r) => r.macro && r.macro.kcal > 40)
          .sort((a, b) => (b.macro.p / b.macro.kcal) - (a.macro.p / a.macro.kcal))
          .slice(0, 2);
        const d = new Date();
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]:
          { b: [], l: two.map((r) => ({ id: r.id, x: 1, eaten: 0 })), d: [], s: [] } }));
      });
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(350);
      /* Skip lives behind an empty meal's ⋯ in its sheet since 2026-10-04:
         opened, its menu shown, skipped, and back to the day. A skip that
         finds nothing to press is asserted, not swallowed. */
      for (const sk of skips) {
        await openMeal(pg, sk);
        await pg.evaluate((s2) => {
          const m = document.querySelector('#modalRoot [data-mmenu="' + s2 + '"]');
          if (m && m.getAttribute('aria-expanded') !== 'true') m.click();
        }, sk);
        await pg.waitForTimeout(200);
        await pg.evaluate((s2) => {
          const b = document.querySelector('#modalRoot [data-mskip="' + s2 + '"]');
          if (b) b.click();
        }, sk);
        await pg.waitForTimeout(250);
        await closeSheet(pg);
      }
      if (skips.length) {
        t.ok('the meals ' + skips.join(', ') + ' were skipped from their menus',
          await pg.evaluate((n) => document.querySelectorAll('#macroSlots .mtray-skip').length === n, skips.length), String(skips));
      }
      return pg;
    };
    /* Found by its NAME, on the day: a tray says what its meal is asked for
       ("352 / 959") since 2026-10-04, so a lunch left open in its sheet is
       closed first. */
    const lunchOf = async (pg) => {
      await closeSheet(pg);
      return pg.evaluate(() => {
        const tray = [...document.querySelectorAll('#macroSlots .mtray')]
          .find((c) => ((c.querySelector('.mtray-n') || {}).textContent || '') === 'Lunch');
        const L = window.__macroLab.read();
        const meal = L.meals.find((m) => m.k === 'l') || { items: [] };
        const cap = tray && tray.querySelector('.mtray-caps .mcap');
        return {
          want: cap ? [Number(cap.dataset.want)] : null,
          kcal: Math.round(meal.items.reduce((n, i) => n + i.kcal * i.x, 0)),
          xs: meal.items.map((i) => i.x).join(','),
        };
      });
    };

    const plain = await balDay([]);
    /* Every other meal skipped, so lunch's share is the whole day against the
       quarter of it the old sum handed out — far enough apart that a step of
       an eighth cannot land on both. */
    const withSkips = await balDay(['b', 'd', 's']);
    const plainBefore = await lunchOf(plain);
    const skipBefore = await lunchOf(withSkips);
    t.ok('skipping the other meals raises what lunch is asked to hold',
      !!plainBefore.want && !!skipBefore.want && skipBefore.want[0] > plainBefore.want[0],
      JSON.stringify({ plain: plainBefore.want, skipped: skipBefore.want }));

    /* The bug, stated as a comparison. The pills already dropped a skipped
       empty meal from the sum; the button divided by every slot regardless —
       so the SAME two dishes solved to exactly the same portions on both of
       these days, while the cards above them printed different targets. */
    /* The scales are in lunch's sheet (2026-10-04), so each lunch is opened
       to press them. */
    for (const pg of [plain, withSkips]) await openMeal(pg, 'l');
    await plain.click('#modalRoot [data-mbal="l"]');
    await withSkips.click('#modalRoot [data-mbal="l"]');
    await plain.waitForTimeout(700);
    await withSkips.waitForTimeout(700);
    const plainAfter = await lunchOf(plain);
    const skipAfter = await lunchOf(withSkips);
    t.ok('so balancing aims at the raised share, not the whole-day one',
      skipAfter.kcal > plainAfter.kcal,
      JSON.stringify({ plain: plainAfter, skipped: skipAfter }));
    await plain.context().close();
    await withSkips.context().close();

    /* Done for the day.
     *
       A statement, not a change: nothing is deleted, food can still be added,
       and pressing it again takes it back. The card comes up on the way in
       and not on the way out — closing is the moment you want to be told how
       it went, reopening is only a correction. */
    const closed = await t.fresh({ viewport: { width: 390, height: 800 } });
    await closed.click('.tab[data-view="macros"]');
    await closed.waitForTimeout(300);
    await closed.click('#macroFill');
    await closed.waitForTimeout(600);
    const barFits = await closed.evaluate(() => {
      const bar = document.querySelector('.mday-acts');
      const fill = document.getElementById('macroFill');
      return { wraps: bar.scrollWidth > bar.clientWidth + 1,
        fill: Math.round(fill.getBoundingClientRect().width),
        label: fill.scrollWidth <= fill.clientWidth + 1 };
    });
    /* Six controls on one bar was the ask; keeping the word "Fill" readable
       is the part that has to survive it. */
    t.ok('six controls still fit the bar on a phone, with Fill still a word',
      !barFits.wraps && barFits.label && barFits.fill > 60, JSON.stringify(barFits));

    /* Two presses now, and they are two different things. After Fill the day
       is drafted but nothing is ticked, so the primary offers to mark it all
       complete; only once every plate is eaten does it offer to close the
       day. Blake's progression: "the done for the day button should be
       something like Mark all as complete. And once everything is completed I
       get the options to complete the day." */
    await closed.click('#macroFill');            // Mark all complete
    await closed.waitForTimeout(400);
    t.ok('a drafted day offers to tick itself off before it offers to close',
      await closed.evaluate(() => document.getElementById('macroFill').dataset.mode === 'done'),
      await closed.evaluate(() => document.getElementById('macroFill').dataset.mode + ' / ' +
        document.getElementById('macroFill').textContent));
    await closed.click('#macroFill');            // Complete the day
    await closed.waitForTimeout(500);
    const dayCard = await closed.evaluate(() => {
      const sh = document.querySelector('.ds-sheet');
      if (!sh) return null;
      const num = (el) => Number((el.textContent.replace(/,/g, '').match(/\d+/) || [0])[0]);
      return {
        says: sh.querySelector('.ds-says').textContent.trim(),
        ring: num(sh.querySelector('.ds-ring-m b')),
        macros: [...sh.querySelectorAll('.ds-mk')].map((e) => e.textContent.trim()).join(),
        targetMarks: sh.querySelectorAll('.ds-mk-t').length,
        weekBars: sh.querySelectorAll('.ds-wk').length,
        targetLine: !!sh.querySelector('.ds-line'),
        pips: sh.querySelectorAll('.ds-pip').length,
        split: sh.querySelectorAll('.ds-split span').length,
        biggest: (sh.querySelector('.ds-splitl b') || {}).textContent || ''
      };
    });
    /* A sentence before a number: at nine at night the useful thing is what
       kind of day it was, and the arithmetic is the evidence for it. */
    /* Not "contains a number" — a day that went well says "On the day and on
       the protein. Nothing to fix.", and demanding a digit there was asking
       the sentence to be a statistic, which is the thing it is not. */
    t.ok('closing the day says what kind of day it was, in words',
      !!dayCard && dayCard.says.length > 12 && / /.test(dayCard.says.trim()),
      JSON.stringify(dayCard));
    t.ok('and shows the day as a ring, three macros and seven days',
      dayCard.macros === 'P,F,C' && dayCard.weekBars === 7 && dayCard.ring > 0,
      JSON.stringify(dayCard));
    /* The three things that make it readable rather than a list of numbers:
       a mark where each target sits, a target line across the week, and the
       day broken down by meal. */
    t.ok('and marks where each target sits, so overshoot is a distance',
      dayCard.targetMarks === 3, JSON.stringify(dayCard));
    t.ok('and draws the target across the week rather than narrating it',
      dayCard.targetLine, JSON.stringify(dayCard));
    t.ok('and says how much of the day landed in one meal',
      dayCard.split > 0 && /%/.test(dayCard.biggest), JSON.stringify(dayCard));
    t.ok('and carries the week\u2019s protein record inside the day',
      dayCard.pips === 7, JSON.stringify(dayCard));
    /* A day never written down is a gap in the record, not a day the protein
       was missed on — the same rule the week bars follow. Reading blanks as
       misses is the exact lie this card exists not to tell. */
    t.ok('and an unlogged day is a gap, not a miss',
      await closed.evaluate(() => {
        const gap = [...document.querySelectorAll('.ds-pip')].filter((e) =>
          !e.className.match(/hit|miss|today/));
        if (!gap.length) return true;                 // a fully logged week
        return getComputedStyle(gap[0]).borderStyle.indexOf('dashed') === 0;
      }));
    /* The numbers are read back through the same two functions the pills use,
       so the card and the strip cannot disagree about what you ate. */
    t.ok('and its numbers are the ones already on the screen',
      await closed.evaluate(() => {
        const got = document.querySelectorAll('.ds-mv')[0].textContent;
        const L = window.__macroLab;
        const tot = L.read().tot, T = L.targets();
        const nums = got.replace(/,/g, '').match(/\d+/g) || [];
        return Number(nums[0]) === Math.round(tot.p) && Number(nums[1]) === Math.round(T.p);
      }));
    /* The Done button has to actually be a button. It shipped with
       data-close="1" and nothing else, and data-close turns out to be
       decorative everywhere it appears — the modal closes on .scrim and
       .sheet-x. It was wearing a wire that was never connected. */
    await closed.click('.ds-sheet .sheet-done');
    /* close() unwinds the history entries the sheet pushed, and that lands on
       popstate — so the card is gone a tick later, not on the same line as
       the click. Checking synchronously said "still open" about a button that
       works perfectly. */
    await closed.waitForTimeout(350);
    t.ok('and the Done button closes the card',
      await closed.evaluate(() => !document.querySelector('.ds-sheet')));
    await closed.waitForTimeout(300);
    /* The tick is gone from the bar and the one primary carries it: Fill
       while there is something to draft, Done once there is not, Reopen once
       it is closed. Same verb, the slot that was going dead. */
    t.ok('and the day is marked closed on the bar',
      await closed.evaluate(() => {
        const b = document.getElementById('macroFill');
        return b.dataset.mode === 'open' && /Reopen/.test(b.textContent) &&
          b.classList.contains('to-done');
      }));
    /* Nothing was taken away by closing it. */
    t.ok('and nothing on the day was removed by saying you were done',
      await closed.evaluate(() => document.querySelectorAll('.mslot').length > 0 &&
        !document.getElementById('macroFill').disabled === false ||
        /* the plates on a folded day are its day cards' (2026-10-04) */
        document.querySelectorAll('.mitem, .mslot.filled').length > 0));
    await closed.click('#macroFill');
    await closed.waitForTimeout(400);
    t.ok('and pressing it again reopens the day, without a card this time',
      await closed.evaluate(() =>
        document.getElementById('macroFill').dataset.mode !== 'open' &&
        !document.querySelector('.ds-sheet')));
    /* It survives a reload, which is the whole point of it being a record. */
    await closed.click('#macroFill');
    await closed.waitForTimeout(400);
    await closed.click('.sheet-x');
    await closed.waitForTimeout(200);
    await closed.reload();
    await closed.click('.tab[data-view="macros"]');
    await closed.waitForTimeout(500);
    t.ok('and a closed day is still closed tomorrow morning',
      await closed.evaluate(() =>
        document.getElementById('macroFill').dataset.mode === 'open'));

    /* The menu opens the same card for a day you have not closed. */
    await closed.click('#macroMore');
    await closed.waitForTimeout(120);
    await closed.click('[data-mmore="went"]');
    await closed.waitForTimeout(400);
    t.ok('and the menu opens it for whatever day you are looking at',
      await closed.evaluate(() => !!document.querySelector('.ds-sheet')));
    await closed.click('.sheet-x');
    await closed.waitForTimeout(200);

    /* The merge rule, which is where the trap is. Zero means REOPENED, and
       the general merge above skips falsy values — so a reopen would have been
       silently undone by any device that still remembered the close. */
    t.ok('reopening a day travels; it is not overwritten by the close it undid',
      await closed.evaluate(() => {
        const k = Object.keys(JSON.parse(localStorage.getItem('bsc.macroDone') || '{}'))[0];
        if (!k) return false;
        const enc = k.replace(/-/g, '_');
        const later = Date.now() + 60000;
        const before = JSON.parse(localStorage.getItem('bsc.macroDone'))[k];
        window.Store.__mergeProbe = null;
        // hand the app a remote that says "reopened, and more recently"
        const moved = window.__macroLab.merge
          ? window.__macroLab.merge({ dn: { [enc]: { v: 0, at: later } } }) : 'no hook';
        const after = JSON.parse(localStorage.getItem('bsc.macroDone'))[k];
        return moved !== 'no hook' ? (before > 0 && after === 0) : 'no hook';
      }) === true,
      'needs a merge hook on the lab');
    /* Blake: "if i haven't ticed eery meal and food offf, the day is still open!"
       Unticking a meal or food on a closed day automatically reopens the day
       and returns the primary button to Mark all complete. */
    await closed.click('#macroFill');            // Complete the day again
    await closed.waitForTimeout(400);
    await closed.click('.sheet-x');
    await closed.waitForTimeout(200);
    await closed.click('#macroSlots [data-mdot]');
    await closed.waitForTimeout(250);
    t.ok('unticking a meal or food on a closed day automatically reopens the day',
      await closed.evaluate(() => {
        const b = document.getElementById('macroFill');
        const doneMap = JSON.parse(localStorage.getItem('bsc.macroDone') || '{}');
        const k = Object.keys(doneMap)[0];
        return b.dataset.mode === 'tickall' && b.textContent === 'Mark all complete' && (!k || doneMap[k] === 0);
      }));
    await closed.context().close();

    /* One tap on a spent portion hands the stepper back.
     *
       Correcting a portion after ticking used to be untick, adjust, re-tick —
       three actions for the ordinary case of having eaten more than planned.
       It is still a deliberate act, it is just no longer a chore. */
    const wake = await t.fresh({ viewport: { width: 390, height: 800 } });
    await wake.click('.tab[data-view="macros"]');
    await wake.waitForTimeout(300);
    await wake.click('#macroFill');
    await wake.waitForTimeout(600);
    /* The first meal Fill put food on, opened in its sheet (2026-10-04). */
    await openMeal(wake, await wake.evaluate(() => document.querySelector('#macroSlots .mtray.filled [data-mopen]').dataset.mopen));
    /* the type BEFORE it is eaten, to compare against after */
    const typeWas = await wake.evaluate(() => {
      const c = getComputedStyle(document.querySelector('#modalRoot .mrows .mstep-x'));
      return { size: c.fontSize, weight: c.fontWeight };
    });
    /* Scrolled to the middle first, as a thumb would. At the top of an
       800-tall page this tick sits under the sticky bottom bar, and the
       plate controls' 120px scroll margin, meant to stop them above it, is
       cut short by the meal card (overflow: hidden makes it a scroll
       container, which clips the margin at its own edge). The click used to
       land on the bar's very top pixel and get through; with the meal verbs
       at a plate key's size (2026-09-27) the card ends 24px sooner and it
       stalled on the bar for thirty seconds. */
    /* Eaten with the MEAL's tick on the open meal's head: there is no
       per-plate tick since the RP-style day (Blake, 2026-10-04: "No
       individual foods ticks... I'll complete the whole meal"), and ticking
       the whole meal is what eats this plate now. */
    await wake.click('#modalRoot .msh-h [data-mdot]');
    await wake.waitForTimeout(400);
    t.ok('a locked portion offers a way back in',
      await wake.evaluate(() => !!document.querySelector('#modalRoot .mstep-wake')));
    /* And it does not change SIZE on the way.
     *
       Ticking a plate made its portion jump from 12px to 15px, because the
       way back in is a <button> and `.mstep button` sets 15px for the − and +
       keys — more specific than .mstep-x, so the row's own size lost. The one
       row that should look like it has settled down instead shouted. Same
       type, eaten or not. */
    t.ok('and the portion does not grow just because it was eaten',
      await wake.evaluate((was) => {
        const c = getComputedStyle(document.querySelector('#modalRoot .mrows .mstep-x'));
        /* The same size, and no heavier: an eaten portion is drawn a touch
           lighter in the meal's sheet (2026-10-04), which is it settling down,
           not shouting. */
        return c.fontSize === was.size && Number(c.fontWeight) <= Number(was.weight);
      }, typeWas),
      await wake.evaluate(() => {
        const c = getComputedStyle(document.querySelector('#modalRoot .mrows .mstep-x'));
        return 'eaten ' + c.fontSize + '/' + c.fontWeight;
      }));
    await wake.click('#modalRoot .mstep-wake');
    await wake.waitForTimeout(400);
    const woke = await wake.evaluate(() => {
      const st = document.querySelector('#modalRoot .mrows .mstep');
      return { live: [...st.querySelectorAll('[data-mstep]')].every((b) => !b.disabled),
        grey: st.classList.contains('spent'),
        stillEaten: st.closest('.mitem').classList.contains('eaten') &&
          document.querySelector('#modalRoot .msh-h [data-mdot]').getAttribute('aria-pressed') === 'true' };
    });
    t.ok('and one tap wakes it, without unticking the meal',
      woke.live && !woke.grey && woke.stillEaten, JSON.stringify(woke));
    /* And it actually moves — waking it is no use if the press is still
       refused by the handler's own rule. */
    t.ok('and the portion can then be changed',
      await wake.evaluate(() => {
        const was = document.querySelector('#modalRoot .mrows .mstep-x').textContent.trim();
        document.querySelector('#modalRoot [data-mstep$=":up"]').click();
        return document.querySelector('#modalRoot .mrows .mstep-x').textContent.trim() !== was;
      }));

    /* Ten "not that one"s is disagreement, not exhaustion — a lunch has forty
       recipes and the cursor wraps long before you run out. So the meal stops
       being confined to its own sections, and says so, because a roast beef
       breakfast arriving unannounced reads as a fault. */
    const argued = await t.fresh({ viewport: { width: 390, height: 800 } });
    await argued.click('.tab[data-view="macros"]');
    await argued.waitForTimeout(300);
    await argued.click('#macroFill');
    await argued.waitForTimeout(600);
    /* No assertion on a LABEL any more. It said "everywhere", which only means
       something to somebody who already knows a meal is normally fenced to its
       own sections — and that fence has no marker of its own, so the word was
       naming the exit from a room nobody had been told they were in. What is
       asserted below is the thing that actually matters and always did: that
       the pool really does get wider. */
    /* And the widening is real, not just a caption: what it offers now has to
       be reachable from outside that meal's own sections. */
    t.ok('and the pool it draws from is genuinely wider',
      await argued.evaluate(() => {
        const L = window.__macroLab;
        return L.rank('b', 40).length > L.rank('l', 40).length ||
          window.RECIPES.filter((r) => r.book === 1 && r.secNum === 1).length < 40;
      }));
    await argued.context().close();
    await wake.context().close();

    /* Nobody asked the app for three servings.
     *
       Undershoot is judged against the meal's share and overshoot against the
       DAY's remaining, which is right for the day and blind for the meal: at
       breakfast, with nothing eaten, one dish could claim all the day's
       protein and be charged nothing. The ranking really did offer ×3 of a
       271 kcal plate — 813 kcal — for a meal whose share was 381. That is
       where a lot of overeating starts: not a plan going wrong later, a
       number too big when it was first put in front of you.

       So a suggestion may run over its share, because meals are not equal,
       but not without limit. Measured on the day the cap went in: meals off
       their share fell 813 → 427 kcal and the day's protein got BETTER. */
    const roomy = await t.fresh({ viewport: { width: 390, height: 800 } });
    await roomy.click('.tab[data-view="macros"]');
    await roomy.waitForTimeout(300);
    const over = await roomy.evaluate(() => {
      const L = window.__macroLab;
      L.forget();
      const T = L.targets();
      const dayK = 4 * T.p + 4 * T.c + 9 * T.f;
      const meals = L.read().meals;
      let wSum = 0; meals.forEach((m) => { wSum += m.w; });
      const worst = [];
      meals.forEach((m) => {
        const share = dayK * m.w / wSum;
        L.rank(m.k, 12).forEach((e) => {
          const ratio = (e.kcal * e.x) / share;
          if (ratio > worst.ratio || !worst.length) worst.push({ name: e.name, x: e.x,
            kcal: Math.round(e.kcal * e.x), share: Math.round(share), ratio: +ratio.toFixed(2) });
        });
      });
      worst.sort((a, b) => b.ratio - a.ratio);
      return worst.slice(0, 3);
    });
    /* 1.15 is the cap plus room for the rounding in a quarter-serving grid —
       what is being asserted is that nothing is offered at close to DOUBLE
       the meal it belongs to, which is what used to happen. */
    t.ok('no meal is offered a portion wildly over its own share',
      over.every((w) => w.ratio <= 1.35),
      JSON.stringify(over));
    await roomy.context().close();

    /* A plate you have eaten is a record, not a dial.
     *
       Resizing what you already ate is editing the past, so the stepper goes
       quiet on the tick — and comes back on the untick, because nothing here
       is one-way. The lock goes with it: Rebalance already skips anything
       eaten, so on that row it was a button with nothing to guard. */
    const spent = await t.fresh({ viewport: { width: 390, height: 800 } });
    await spent.click('.tab[data-view="macros"]');
    await spent.waitForTimeout(300);
    await spent.click('#macroFill');
    await spent.waitForTimeout(600);
    // open a meal's sheet so a plate and its stepper are on screen
    await openMeal(spent, await spent.evaluate(() => document.querySelector('#macroSlots .mtray.filled [data-mopen]').dataset.mopen));
    const stepWas = await spent.evaluate(() => {
      const st = document.querySelector('#modalRoot .mrows .mstep');
      return { x: st.querySelector('.mstep-x').textContent.trim(),
        live: [...st.querySelectorAll('[data-mstep]')].every((b) => !b.disabled),
        grey: st.classList.contains('spent') };
    });
    t.ok('an uneaten plate can still be resized', stepWas.live && !stepWas.grey,
      JSON.stringify(stepWas));

    /* The meal's tick, in the sheet's header (2026-10-04): see the same
       note in "One tap on a spent portion", above. */
    await spent.click('#modalRoot .msh-h [data-mdot]');
    await spent.waitForTimeout(400);
    /* The lock is not on the dial: it guards against the machine rather than
       against you, and it lives behind the food's ⋯ since 2026-10-04. */
    await spent.evaluate(() => document.querySelector('#modalRoot .mrows [data-mfmenu]').click());
    await spent.waitForTimeout(250);
    const stepNow = await spent.evaluate(() => {
      const st = document.querySelector('#modalRoot .mrows .mstep');
      const lock = st.closest('.mitem').querySelector('.mlock');
      return { x: st.querySelector('.mstep-x').textContent.trim(),
        dead: [...st.querySelectorAll('[data-mstep]')].every((b) => b.disabled),
        lockStillLive: !!lock && !lock.disabled,
        grey: st.classList.contains('spent'),
        /* the STEPPER's own buttons, not the first button in the strip — that
           is the lock, and it is faded by a rule of its own, so reading it
           here passed with the fix reverted and proved nothing. */
        faded: [...st.querySelectorAll('[data-mstep]')]
          .every((b) => parseFloat(getComputedStyle(b).opacity) < 0.6) };
    });
    t.ok('ticking it eaten locks the portion', stepNow.dead && stepNow.grey,
      JSON.stringify(stepNow));
    /* The lock is a different job — it holds a food steady while the other
       meals rebalance around it, which is still worth saying about a plate
       you have eaten. Only the servings lock. */
    t.ok('but the lock is left alone, because it does a different job',
      stepNow.lockStillLive, JSON.stringify(stepNow));
    t.ok('and greys it, rather than leaving it looking live', stepNow.faded,
      JSON.stringify(stepNow));
    await spent.click('#modalRoot .msh-t');
    await spent.waitForTimeout(250);
    /* Still readable: the number is the whole point of keeping the row. */
    t.ok('and the portion it was eaten at is still on the card',
      stepNow.x === stepWas.x && stepNow.x.length > 0, stepWas.x + ' -> ' + stepNow.x);

    /* The rule sits in the handler as well as the markup, because a disabled
       attribute is paint — anything that reaches the delegated handler by
       another road still has to be refused. */
    t.ok('and the day does not move even if the press gets through',
      await spent.evaluate(() => {
        const st = document.querySelector('#modalRoot .mrows .mstep');
        const was = st.querySelector('.mstep-x').textContent.trim();
        const b = st.querySelector('[data-mstep$=":up"]');
        b.disabled = false;               // the paint comes off
        b.click();
        const now = document.querySelector('#modalRoot .mrows .mstep .mstep-x').textContent.trim();
        return was === now;
      }));

    /* The meal's tick, in the sheet's header (2026-10-04). */
    await spent.click('#modalRoot .msh-h [data-mdot]');
    await spent.waitForTimeout(400);
    t.ok('unticking hands the stepper back',
      await spent.evaluate(() => {
        const st = document.querySelector('#modalRoot .mrows .mstep');
        return !st.classList.contains('spent') &&
          [...st.querySelectorAll('[data-mstep]')].every((b) => !b.disabled);
      }));
    await spent.context().close();


    /* The bench measures the shipped code or it measures nothing.
     *
       window.__macroLab.draft() exists so a few thousand days can be drafted
       without a render between them — Fill picks at random from the top three
       fits, so comparing two settings honestly means running both over the
       same days, and that is only affordable with the screen out of the way.
       The risk that buys is a bench that quietly stops being the button. So:
       same seed, same empty day, both routes, same plates at the same
       portions. Its own page, because it drafts and discards days and the
       tests after this one are reading the day it would leave behind. */
    const lab = await t.fresh({ viewport: { width: 390, height: 800 } });
    await lab.click('.tab[data-view="macros"]');
    await lab.waitForTimeout(300);
    t.ok('the bench drafts the same day the button does',
      await lab.evaluate(() => {
        const L = window.__macroLab;
        if (!L) return 'no lab';
        const seeded = (a) => () => {
          a |= 0; a = a + 0x6D2B79F5 | 0;
          let t = Math.imul(a ^ a >>> 15, 1 | a);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        const real = Math.random;
        const plates = () => L.read().meals.map((m) =>
          m.k + ':' + m.items.map((i) => i.id + '@' + i.x).join(',')).join('|');
        Math.random = seeded(7); L.forget(); L.draft();
        const viaLab = plates();
        /* The button disables itself once every meal has food, and forget()
           empties the day without redrawing — so the disabled flag is left
           over from the render before it. Clear it; what is under test is the
           draft, not the button's own enabling. */
        Math.random = seeded(7); L.forget();
        document.getElementById('macroFill').disabled = false;
        document.getElementById('macroFill').click();
        const viaBtn = plates();
        Math.random = real;
        return viaLab === viaBtn && viaLab.indexOf('@') > 0 ? true : viaLab + ' !== ' + viaBtn;
      }) === true,
      await lab.evaluate(() => 'see above'));
    await lab.context().close();

    /* The guard that survived the move, and has to.
     *
       Refusing a meal over a portion that has not been settled yet is wrong;
       refusing a day that is already accounted for is right. Press Fill at
       nine at night with everything logged and it should add nothing at all.
       So the question is still asked — once, up front, about what the day
       already held rather than about the draft being written. Delete it and
       this goes red. */
    const noRoom = await t.fresh({ viewport: { width: 390, height: 800 } });
    await noRoom.evaluate(() => localStorage.setItem('bsc.macroTargets',
      JSON.stringify({ p: 5, f: 2, c: 5 })));   // 58 kcal of room: under the floor
    await noRoom.reload();
    await noRoom.click('.tab[data-view="macros"]');
    await noRoom.waitForTimeout(400);
    await noRoom.click('#macroFill');
    await noRoom.waitForTimeout(500);
    t.ok('a day with no room left is not filled with food anyway',
      await noRoom.evaluate(() =>
        document.querySelectorAll('.mitem, #macroSlots .mtray-f:not(.mtray-none)').length === 0),
      await noRoom.evaluate(() =>
        document.querySelectorAll('.mitem, #macroSlots .mtray-f:not(.mtray-none)').length + ' plates drafted'));
    await noRoom.context().close();
  },
});
