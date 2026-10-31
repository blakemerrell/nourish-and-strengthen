/* The charts behind the bars, a gap that is not a moving range, the morning
 * line, and the weigh-in card.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, goDay, stepDay, openWeigh } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — the charts and the morning card',
  async suite(t) {
    /* ---- the charts, behind the bars ------------------------------------
     * Its own page, because the history has to be seeded before boot. */
    const chartPage = await t.fresh();
    await chartPage.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = {}, days = {};
      const norm = window.RECIPES.find((x) => x.macro && x.macro.kcal > 300 && x.macro.na < 200);
      const salty = window.RECIPES.find((x) => x.macro && x.macro.kcal > 300 && x.macro.na > 900);
      const jit = [0, 0.4, -0.3, 0.5, -0.2, 0.1, -0.4, 0.3, -0.1, 0.2];
      for (let i = 39; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        let w = 204 - (1.5 / 7) * (39 - i) + jit[i % 10] * 0.6;
        if (i % 9 === 0 && i < 39) w += 2.4;
        ws[key(d)] = Math.round(w * 10) / 10;
        const r = (i % 9 === 1) ? salty : norm;
        days[key(d)] = { b: [{ id: r.id, x: Math.round((1700 / r.macro.kcal) * 8) / 8, eaten: 1 }] };
      }
      const goal = new Date(); goal.setDate(goal.getDate() + 120);
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
        goalLb: 175, goalBy: key(goal), workouts: 4, steps: 8000,
      }));
    });
    await chartPage.reload();
    await chartPage.waitForTimeout(400);
    await chartPage.click('.tab[data-view="macros"]');
    await chartPage.waitForTimeout(250);
    await chartPage.click('#macroMore'); await chartPage.click('#macroMenu [data-mchartopen]');  // Trends lives in the menu since 2026-10-30
    await chartPage.waitForTimeout(300);
    t.ok('the bars open onto their own history',
      await chartPage.evaluate(() => !!document.querySelector('.mc-sheet') &&
        document.querySelectorAll('.mc-tabs [data-mchart]').length === 3 &&     // Weight, Body, Vs plan since 2026-10-30
        document.querySelectorAll('.mc-sub [data-mchart]').length === 3));     // and Weight's trend, rate, overnight

    const chart = async (which) => {
      /* Rate and overnight live under Weight since the tabs folded to three
         (2026-10-30), so they are reached through it. */
      if (!(await chartPage.$('[data-mchart="' + which + '"]'))) await chartPage.click('.mc-tabs [data-mchart="weight"]');
      await chartPage.click('[data-mchart="' + which + '"]');
      await chartPage.waitForTimeout(200);
      return chartPage.evaluate(() => ({
        // the points, not the ring a finger puts on one (2026-09-27)
        pts: document.querySelectorAll('.mc-svg circle:not(.mc-hl)').length,
        flagged: document.querySelectorAll('.mc-sig').length,
        salt: document.querySelectorAll('.mc-salt').length,
        plan: !!document.querySelector('.mc-plan'),
      }));
    };

    /* Baseline limits held across a cut saturate — you leave the band in week
       two and every morning after reads as "outside", which flags thirty
       points and means none of them. Weight is for looking at; Off plan is
       the chart that signals. */
    const wc = await chart('weight');
    t.ok('the weight chart draws the plan beside it and flags nothing',
      wc.pts === 40 && wc.plan && wc.flagged === 0,
      JSON.stringify(wc));

    const oc = await chart('off');
    t.ok('the off-plan chart carries limits and speaks rarely',
      oc.pts === 40 && oc.flagged > 0 && oc.flagged < 8, JSON.stringify(oc));

    /* A storehouse pantry is over the public sodium line most days, so a
       fixed threshold marked every point and said nothing. Salt is judged
       against your own usual, and only where a jump followed it. */
    const jc = await chart('jump');
    t.ok('the day-to-day chart marks some mornings as salt, not all of them',
      jc.salt > 0 && jc.salt < jc.pts / 3, JSON.stringify(jc));

    const rc = await chart('rate');
    t.ok('and the rate chart draws once there is a fortnight of it', rc.pts > 20);

    /* ---- a gap is not a moving range ------------------------------------
     * Miss a fortnight of mornings and the next reading is a fortnight of
     * drift. Pairing it with the last one before the gap and calling the
     * difference a "day-to-day change" inflates mR-bar, which widens every
     * limit on every chart and makes the salt warning fire LESS often --
     * the failure is silent and points the wrong way. Thirty consecutive
     * mornings, a fortnight away, then six more. */
    const gapPage = await t.fresh();
    await gapPage.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = {}, days = {};
      const r = window.RECIPES.find((x) => x.macro && x.macro.kcal > 300);
      const jit = [0, 0.3, -0.2, 0.4, -0.3, 0.1, -0.1, 0.2, -0.4, 0.3];
      const at = (i) => { const d = new Date(); d.setDate(d.getDate() - i); return key(d); };
      [].concat(
        Array.from({ length: 30 }, (_, n) => 49 - n),   // 49..20, consecutive
        Array.from({ length: 6 }, (_, n) => 5 - n),     // 5..0, after the gap
      ).forEach((i) => {
        ws[at(i)] = Math.round((204 - 0.2 * (49 - i) + jit[i % 10]) * 10) / 10;
        days[at(i)] = { b: [{ id: r.id, x: 1, eaten: 1 }] };
      });
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      const goal = new Date(); goal.setDate(goal.getDate() + 120);
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
        goalLb: 175, goalBy: key(goal), workouts: 4, steps: 8000,
      }));
    });
    await gapPage.reload();
    await gapPage.waitForTimeout(400);
    await gapPage.click('.tab[data-view="macros"]');
    await gapPage.waitForTimeout(250);
    await gapPage.click('#macroMore'); await gapPage.click('#macroMenu [data-mchartopen]');  // Trends lives in the menu since 2026-10-30
    await gapPage.waitForTimeout(300);
    await gapPage.click('[data-mchart="jump"]');
    await gapPage.waitForTimeout(200);
    const gc = await gapPage.evaluate(() => Array.prototype.map.call(
      document.querySelectorAll('.mc-svg circle title'), (el) => el.textContent));

    /* Every assertion carries its own length check: an empty list makes
       .every() true, which is exactly how a broken chart passes a test. */
    t.ok('the pair that straddles the gap is not plotted as a day-to-day change',
      gc.length === 34, 'points: ' + gc.length);

    /* And the harm the limits take: bridged, that one ~3 lb "overnight
       change" sits far outside its own upper limit and flags -- while
       dragging mR-bar up under every other chart's limits with it. */
    t.ok('and nothing on the chart reads as a signal, because nothing is one',
      await gapPage.evaluate(() => document.querySelectorAll('.mc-sig').length) === 0);

    /* The consequence the limits actually turn on: with the gap bridged, a
       fortnight of loss enters mR-bar as one ~3 lb overnight change. */
    t.ok('and no plotted overnight change is a fortnight of drift in disguise',
      gc.length > 0 && gc.every((s) => Math.abs(parseFloat(s.split('\u00b7').pop())) < 2),
      gc.filter((s) => Math.abs(parseFloat(s.split('\u00b7').pop())) >= 2).join(' | '));

    await gapPage.click('[data-mchart="weight"]');
    await gapPage.waitForTimeout(200);
    t.ok('while the weight chart still plots every morning there was one',
      await gapPage.evaluate(() => document.querySelectorAll('.mc-svg circle:not(.mc-hl)').length) === 36);
    await gapPage.context().close();

    await chartPage.goBack();
    await chartPage.waitForTimeout(250);
    t.ok('the back gesture closes it like every other sheet',
      await chartPage.evaluate(() => !document.querySelector('.mc-sheet')));
    await chartPage.context().close();

    /* ---- the morning line -----------------------------------------------
     * One sentence about what to do, and most mornings it says nothing to
     * do. Its own page, because every state needs a different history seeded
     * underneath it and the app reads those once, at boot. */
    const lineFor = async (seed) => {
      const pg = await t.fresh();
      await pg.evaluate((cfg) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const ws = {}, days = {};
        const r = window.RECIPES.find((x) => x.macro && x.macro.kcal > 300 && x.macro.na > 400);
        const jitter = [0, 0.3, -0.2, 0.4, -0.3, 0.1, -0.1, 0.2, -0.4, 0.3];
        const gap = cfg.gapDays || 0;         // mornings missed just before today
        const prevI = gap + 1;                // so the last morning there WAS one
        for (let i = cfg.n - 1; i >= 0; i--) {
          if (i > 0 && i <= gap) continue;    // the fortnight away
          const d = new Date(); d.setDate(d.getDate() - i);
          let w = 204 - cfg.rate * (cfg.n - 1 - i) + jitter[i % 10] * 0.9;
          if (cfg.saltToday && i === 0) w += 2.6;
          ws[key(d)] = Math.round(w * 10) / 10;
          const x = Math.round((1700 / r.macro.kcal) * 8) / 8;
          days[key(d)] = { b: [{ id: r.id, x: (cfg.saltToday && i === prevI) ? x * 3 : x, eaten: 1 }] };
        }
        localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
        localStorage.setItem('bsc.macroDays', JSON.stringify(days));
        const goal = new Date(); goal.setDate(goal.getDate() + 126);
        const prL = { sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
          goalLb: cfg.noGoal ? 0 : 175, goalBy: cfg.noGoal ? '' : key(goal),
          workouts: 4, steps: 8000 };
        localStorage.setItem('bsc.macroProfile', JSON.stringify(prL));
      }, seed);
      await pg.reload();
      await pg.waitForTimeout(400);
      /* The plan this profile asks for, taken from the app rather than
         computed beside it. The profile states 204 lb and thirty mornings of
         weigh-ins put the body at 201.8, so a plan worked out here from the
         typed figure is a plan for somebody else — and "taking it leaves the
         protein alone" then compares two different people's protein.
       *
         The suite's 180/50/50 placeholder used to be rewritten on read,
         because 1,370 fell under the old 1,500 floor for a man. At the
         clinical 1,200 it stands, so a fixture that wants a coherent plan
         has to say so. */
      await pg.evaluate(() => {
        const plan = window.__macroLab.plan(window.__macroLab.profile());
        if (plan) localStorage.setItem('bsc.macroTargets',
          JSON.stringify({ p: plan.p, f: plan.f, c: plan.c }));
      });
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      return pg;
    };

    const onPace = await lineFor({ n: 30, rate: 1.5 / 7 });
    t.ok('on pace, the line says there is nothing to do',
      await onPace.evaluate(() => {
        const el = document.querySelector('.mline');
        return !!el && el.classList.contains('calm') &&
          /On track|Arriving around|no arrival date/.test(el.textContent) &&
          !el.querySelector('[data-mline]');          // no decision, so no buttons
      }), await onPace.textContent('.mline'));
    await onPace.context().close();

    /* The one that stops you acting. Cutting calories after a salty Tuesday
       is the mistake the whole apparatus exists to prevent. */
    const salty = await lineFor({ n: 30, rate: 1.5 / 7, saltToday: true });
    /* Behind the press now. It is evidence for a number rather than a thing
       to do, and Blake asked for it with the trend line: "I don't like the
       persistent salt notice... it is interesting once." */
    t.ok('a salty morning says nothing on the face, where a verdict would go',
      await salty.evaluate(() => !document.querySelector('.mw-verdict ~ .mline, .mslot-h ~ .mline')),
      await salty.evaluate(() => (document.querySelector('.mline') || {}).textContent || '(none)'));
    await openWeigh(salty);
    t.ok('a jump the sodium explains is named as salt, not fat',
      await salty.evaluate(() => {
        const el = document.querySelector('.mline');
        return !!el && el.classList.contains('noise') && /salt, not fat/.test(el.textContent) &&
          !el.querySelector('[data-mline]');
      }), await salty.textContent('.mline'));
    await salty.context().close();

    /* The same claim, after a fortnight away. "Up 2.6 lb -- that is salt,
       not fat" is the one line in the app whose whole job is to stop you
       cutting; aimed at a fortnight of regain and pinned on a dinner two
       weeks gone, it stops you acting on something you should act on. The
       control above it holds every other thing equal, so a failure here is
       the gap and nothing else. */
    const gapCtl = await lineFor({ n: 30, rate: 0, saltToday: true });
    await openWeigh(gapCtl);
    t.ok('a salty morning against yesterday still reads as salt',
      /salt, not fat/.test(await gapCtl.textContent('.mline')),
      await gapCtl.textContent('.mline'));
    await gapCtl.context().close();

    const gapped = await lineFor({ n: 30, rate: 0, saltToday: true, gapDays: 14 });
    await openWeigh(gapped);
    const gapLine = await gapped.textContent('.mline');
    t.ok('but the same morning after a fortnight away is not blamed on a dinner',
      gapLine.length > 0 && !/salt, not fat/.test(gapLine), gapLine);
    await gapped.context().close();

    const slow = await lineFor({ n: 30, rate: 0.6 / 7 });
    const behind = await slow.textContent('.mline');
    t.ok('behind pace, it offers a number and the option to ignore it',
      await slow.evaluate(() => {
        const el = document.querySelector('.mline');
        return !!el && el.classList.contains('act') && /Arriving around [^,]+(?:, \d{4})?, not |no arrival date|Too slow yet to give a date/.test(el.textContent) &&
          el.querySelectorAll('[data-mline]').length === 2;
      }), behind);
    /* A line that says "eat 1,278" is not advice. Whatever it offers has to
       clear the basal rate and stay within a quarter of the day's burn. */
    /* It used to assert the offer cleared the BASAL RATE, which was this
       line keeping a floor of its own — and that floor sat ABOVE the plan, so
       on a day already behind pace the card offered more food than the plan
       and called it the lowest it goes. Blake's call was that the plan is
       whatever meets the goal, so the line now lives under the plan's floor:
       the nutrient floor, then what the fat store can actually supply. */
    t.ok('and never asks for less than the plan itself is allowed to be',
      await slow.evaluate(() => {
        const b = document.querySelector('[data-mline^="mline:eat"]');
        const want = Number(b.dataset.mline.split(':')[2]);
        return want >= window.__macroLab.floorK();
      }), behind);
    t.ok('and never offers MORE than the plan while saying it is the least it can',
      await slow.evaluate(() => {
        const b = document.querySelector('[data-mline^="mline:eat"]');
        const want = Number(b.dataset.mline.split(':')[2]);
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        const plan = 4 * t2.p + 4 * t2.c + 9 * t2.f;
        /* Only when it is capped does it claim to be a floor. An uncapped
           number is an answer to the date, and may be anything. */
        return !/as low as it\u2019s safe to go|lowest it\u2019s safe to go/.test(document.querySelector('.mline').textContent) ||
          want <= plan;
      }), behind);
    // taking it rewrites the grams, and protein is not what gives way
    const heldP = await slow.evaluate(() => (JSON.parse(
      localStorage.getItem('bsc.macroTargets')) || { p: 180 }).p);
    await slow.click('[data-mline^="mline:eat"]');
    await slow.waitForTimeout(300);
    /* Protein holds unless holding it would leave a day with less
       carbohydrate than can be eaten — which the app then replaced with the
       plan on the next read, so the button did nothing at all (the audit of
       2026-09-22). It gives only what that line needs, never under 0.8 g a
       pound, and what is stored is what is read back. */
    t.ok('taking it holds protein as far as the day stays eatable, and it sticks',
      await slow.evaluate((wasP) => {
        const b = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        const k = 4 * b.p + 4 * b.c + 9 * b.f;
        const lb = window.__macroLab.profile().lb;
        const read = window.__macroLab.targets();
        const eatable = 4 * b.c >= 0.12 * k;
        const heldOrFloor = b.p === wasP || (b.p >= Math.round(0.8 * lb) && 4 * (b.c - 1) < 0.12 * k + 8);
        return eatable && heldOrFloor && read.p === b.p && read.c === b.c && read.f === b.f;
      }, heldP),
      'was p=' + heldP + ' now ' + await slow.evaluate(() => localStorage.getItem('bsc.macroTargets')));
    await slow.context().close();

    /* It used to draw "7 more mornings and this will say whether you are on
       pace" here, with a progress count under it — a line whose content was
       that it had no content, first thing every morning for a fortnight. A
       line that cannot answer is not a smaller answer.

       Note the failure message reads the CARD, not the line: asking for the
       text of an element that should not exist is a thirty-second timeout
       rather than a red test, which is how this one announced itself. */
    const early = await lineFor({ n: 9, rate: 1.5 / 7 });
    t.ok('with too few mornings to judge, it says nothing at all',
      await early.evaluate(() => !document.querySelector('.mline')),
      await early.evaluate(() => (document.querySelector('.mline') || {}).textContent || ''));

    /* Nothing of it survives, not just the outer box — and the first thing
       in the card is the weigh-in, which was the complaint: it was one of
       the first things read, every morning, and it never said anything.

       (The check this replaced looked for .mline-wrap / .mline-box. Neither
       class has ever existed, so it passed whatever the code did.) */
    t.ok('and nothing of the line is left in the card above the plate',
      await early.evaluate(() => {
        const card = document.querySelector('.mw, .mweigh') || document.body;
        /* "Plan today", not "WEIGH" — the card was renamed when it stopped
           being only an input and started stating the day it planned. The
           word here is a proxy for "the card is still on screen", so it has
           to track the card's actual name or it proves nothing. */
        return card.querySelectorAll('[class*="mline"]').length === 0 &&
          /PLAN TODAY/i.test(card.textContent) &&
          !/more mornings|on pace/i.test(card.textContent);
      }), await early.evaluate(() =>
        (document.querySelector('.mw, .mweigh') || document.body).textContent.slice(0, 100)));
    await early.context().close();

    /* No date named means no pace to be off — but the burn is the most useful
       thing here and it does not need one. Treating a goal date as the price
       of admission to your own numbers was the bug. */
    const noGoal = await lineFor({ n: 30, rate: 1.5 / 7, noGoal: true });
    t.ok('with no goal date it still says what you burn and what that is worth',
      await noGoal.evaluate(() => {
        const el = document.querySelector('.mline');
        return !!el && /burning about/.test(el.textContent) &&
          /lb a week/.test(el.textContent);
      }), await noGoal.evaluate(() => {
        const el = document.querySelector('.mline');
        return el ? el.textContent : '(no line)';
      }));
    await noGoal.context().close();

    // and nothing at all when there is neither a goal nor enough to measure
    const bare = await lineFor({ n: 5, rate: 1.5 / 7, noGoal: true });
    t.ok('and nothing at all when it has neither',
      await bare.evaluate(() => !document.querySelector('.mline')));
    await bare.context().close();

    /* ---- the weigh-in card ----------------------------------------------
     * Its own page again: weight history is seeded wholesale and the app
     * reads its store once at boot, so the seeding needs a clean reload. */
    const w = await t.fresh();
    await w.click('.tab[data-view="macros"]');
    await w.waitForTimeout(150);

    /* The invitation is on the bar while there is nothing to adjust; the card
       only offers "Adjust my plan", and only once there is one. Two labels,
       each naming the thing it actually does — the card used to say "Craft my
       plan" whether or not a plan existed. */
    /* Invites, wherever it is showing. "Craft" while nothing has been
       crafted; "Adjust" only once a profile stands behind the numbers. And
       only one of them at a time — there used to be three in a screenful. */
    t.ok('the plan button invites rather than administrates',
      await w.evaluate(() => {
        const bar = document.getElementById('macroFill');
        const card = document.querySelector('#macroTargBtn');
        const doors = [bar && bar.classList.contains('to-plan') ? bar : null, card]
          .filter(Boolean);
        return doors.length === 1 && /^Craft my plan$/.test(doors[0].textContent.trim());
      }),
      await w.evaluate(() => {
        const bar = document.getElementById('macroFill');
        const card = document.querySelector('#macroTargBtn');
        return 'bar=' + (bar ? bar.textContent + '/' + bar.className : 'none') +
          ' card=' + (card ? card.textContent : 'none');
      }));

    // one morning's number, filed under the local date at one decimal
    await w.fill('#mWeight', '187.45');
    await w.dispatchEvent('#mWeight', 'change');
    await w.waitForTimeout(200);
    const logged = await w.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const key = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const ws = JSON.parse(localStorage.getItem('bsc.macroWeights'));
      return { keys: Object.keys(ws), val: ws[key] };
    });
    t.ok('a weigh-in lands under the local date, rounded to a tenth',
      logged.keys.length === 1 && logged.val === 187.5, JSON.stringify(logged));
    t.ok('and the first stop of the day fills in',
      await w.evaluate(() => document.getElementById('macroWeigh').classList.contains('done')));

    // typing alone is enough — the quiet save runs without leaving the box
    await w.fill('#mWeight', '186.2');
    await w.waitForTimeout(900);
    t.ok('a weight saves itself as it is typed, no blur required',
      await w.evaluate(() => {
        const ws = JSON.parse(localStorage.getItem('bsc.macroWeights'));
        return ws[Object.keys(ws)[0]] === 186.2;
      }));

    /* The scale's box is a draft. A sync emit landing mid-keystroke used to
       replace what was typed with the last saved value, while the pending
       save still held the typed one — box and store disagreeing until the
       next render, with further digits landing on the restored old ones. */
    await w.click('#mWeight');
    await w.evaluate(() => {
      const el = document.getElementById('mWeight');
      el.focus();
      el.value = '191.3';
      window.Store.emit && window.Store.emit();
    });
    await w.evaluate(() => window.dispatchEvent(new Event('resize')));
    await w.waitForTimeout(150);
    t.ok('a re-render mid-keystroke does not eat what is being typed',
      await w.evaluate(() => document.getElementById('mWeight').value === '191.3'),
      await w.evaluate(() => document.getElementById('mWeight').value));
    await w.evaluate(() => { document.getElementById('mWeight').blur(); });
    await w.waitForTimeout(150);

    // an emptied box un-logs the day
    await w.fill('#mWeight', '');
    await w.dispatchEvent('#mWeight', 'change');
    await w.waitForTimeout(200);
    t.ok('clearing the box un-logs the morning',
      await w.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bsc.macroWeights'))).length === 0));

    /* twenty mornings of a working cut: 0.2 lb a day, latest today. The same
       arithmetic the card claims, done independently here: seven-day average
       190.6, the week before averages 192.0, so the week reads down 1.4. */
    await w.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const ws = {};
      for (let i = 0; i < 20; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        ws[d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())] =
          Math.round((190 + i * 0.2) * 10) / 10;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
    });
    await w.reload();
    await w.waitForTimeout(300);
    await w.click('.tab[data-view="macros"]');
    await w.waitForTimeout(150);
    const card = () => w.textContent('#macroWeigh');
    /* Folded, the card is the number you type and the average — the whole job
       most mornings. The trend and the sparkline are behind the same press
       the meals use. */
    /* This morning's number once you have weighed (2026-09-25) — Blake read
       the average there as the app disagreeing with his scale. */
    t.ok('folded, the card carries this morning\u2019s weight and nothing else',
      /190 lb/.test(await card()) && !/lb avg/.test(await card()) && !/since/.test(await card()), await card());
    await w.click('#macroWeigh [data-mfold]');
    await w.waitForTimeout(200);
    /* Said once (2026-09-23). The card used to give the average four times
       and the week three; the history is the graph's to show. */
    t.ok('the headline is the seven-day average',
      /190\.6 lb avg/.test(await card()), await card());
    t.ok('the week is judged average against average',
      /down 1\.4 lb this week/.test(await card()), await card());
    t.ok('and the average is said once, not four times',
      ((await card()).match(/190\.6/g) || []).length === 1, await card());
    t.ok('with a sparkline once there is a line to draw',
      await w.evaluate(() => !!document.querySelector('.mw-spark polyline')));

    // yesterday shows yesterday's number in the box, filed where it belongs
    await stepDay(w, -1);
    t.ok('a missed morning can be read and edited under its own day',
      await w.evaluate(() => Number(document.getElementById('mWeight').value) === 190.2),
      await w.evaluate(() => document.getElementById('mWeight').value));

    // and the calendar jumps straight to a day five back
    const fiveBack = await w.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date(); d.setDate(d.getDate() - 5);
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    });
    await goDay(w, fiveBack);
    await w.waitForTimeout(150);
    t.ok('the day selector jumps, and the day it lands on is really that day',
      await w.evaluate(() => Number(document.getElementById('mWeight').value) === 191),
      await w.evaluate(() => document.getElementById('mWeight').value));

    await w.context().close();
  },
});
