/* The first number a new reader types, the first run's four steps, training
 * never feeding you less, the wizard agreeing with itself, "Fill from"
 * governing drafting, the lens and the order keeping focus, and the shelf
 * rail.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openPlan, addOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — the first run, the wizard, and the shelf rail',
  async suite(t) {
    /* ---- the first number a new reader types --------------------------
     * The About-you boxes used to open at 0 on a first run, right-aligned at
     * the far end of their row, and a tap puts the caret wherever the thumb
     * landed — usually LEFT of the digit. Typing 180 into the weight box
     * produced "1800", which the sheet accepted (max=999 is the browser's
     * business, not mtProfileFromDom's) and turned into a ten-thousand-calorie
     * plan. The very first number anybody typed into this app came back wrong
     * by a factor of ten.
     *
     * That was answered by making the caret safe. The nought is gone as well
     * now — unanswered is not zero, and a box that opens empty cannot be
     * typed in front of — so the first assertion below is the new state and
     * the second still guards the caret, which matters the moment a box DOES
     * hold a figure and somebody edits it.
     *
     * Typed with real keys at the caret the tap leaves, not with fill(),
     * which replaces the value and would pass either way. */
    const zeroBox = await t.fresh({ viewport: { width: 412, height: 915 } });
    await zeroBox.evaluate(() => localStorage.removeItem('bsc.macroProfile'));
    await zeroBox.reload();
    await zeroBox.waitForTimeout(400);
    await zeroBox.click('.tab[data-view="macros"]');
    await zeroBox.waitForTimeout(300);
    await openPlan(zeroBox);
    await zeroBox.waitForTimeout(500);
    const opensAtZero = await zeroBox.evaluate(() =>
      (document.getElementById('mtLb') || {}).value);
    t.ok('the weight box opens empty, because nobody has answered it yet',
      opensAtZero === '', JSON.stringify(opensAtZero));
    /* A tap at the LEFT edge of the box — where a thumb aiming at the box
       rather than at the digit lands. */
    const lbBox = await zeroBox.$('#mtLb');
    /* Into view first. The tap below is at real coordinates, so a box sitting
       under the fold is a tap on whatever is at those coordinates instead —
       which is a test that breaks every time a row moves, rather than when
       the thing it is about breaks. */
    await lbBox.scrollIntoViewIfNeeded();
    await zeroBox.waitForTimeout(150);
    const lbRect = await lbBox.boundingBox();
    await zeroBox.mouse.click(lbRect.x + 4, lbRect.y + lbRect.height / 2);
    await zeroBox.waitForTimeout(200);
    await zeroBox.keyboard.type('180');
    await zeroBox.waitForTimeout(400);
    t.ok('and typing a weight into it gives that weight, not ten times it',
      await zeroBox.evaluate(() => (document.getElementById('mtLb') || {}).value) === '180',
      await zeroBox.evaluate(() => (document.getElementById('mtLb') || {}).value));

    /* And the dash is not a permanent state — one answer is enough for the
       arithmetic to have something to say, and it says it while you are still
       standing in the sheet. */
    t.ok('and the dash becomes a figure the moment there is one to show',
      await zeroBox.evaluate(() =>
        /\d/.test((document.getElementById('mtBigKcal') || {}).textContent || '')),
      await zeroBox.evaluate(() =>
        (document.getElementById('mtBigKcal') || {}).textContent));

    await zeroBox.context().close();

    /* The other side of it, and the reason the blanking is conditional: with a
       plan made, a 0 is a real answer — six foot nothing is a height — and the
       boxes have to show what was saved. Blanking those would be the same
       mistake pointed the other way. */
    const filled = await t.fresh({ viewport: { width: 412, height: 915 } });
    await filled.evaluate(() => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43,
        ft: 6, inch: 0, lb: 190, act: 1.375, goal: 'cut1', goalLb: 175,
        goalBy: '', workouts: 4, steps: 8000 }));
    });
    await filled.reload();
    await filled.waitForTimeout(400);
    await filled.click('.tab[data-view="macros"]');
    await filled.waitForTimeout(300);
    await openPlan(filled);
    await filled.waitForTimeout(500);
    t.ok('but a plan that exists shows every figure it was given, noughts and all',
      await filled.evaluate(() => {
        const v = (id) => (document.getElementById(id) || {}).value;
        return v('mtAge') === '43' && v('mtFt') === '6' && v('mtIn') === '0' &&
          v('mtGoalLb') === '175';
      }),
      await filled.evaluate(() => ['mtAge', 'mtFt', 'mtIn', 'mtGoalLb']
        .map((id) => id + '=' + (document.getElementById(id) || {}).value).join(' ')));
    t.ok('and its headline is a number, not a dash',
      await filled.evaluate(() =>
        /\d/.test((document.getElementById('mtBigKcal') || {}).textContent || '')),
      await filled.evaluate(() =>
        (document.getElementById('mtBigKcal') || {}).textContent));
    await filled.context().close();

    /* The headline over the boxes is the same statement in larger type, and it
       said 0 kcal a day over 0 protein, 0 fat, 0 carbs — a plan of nothing,
       stated as fact, to somebody who has not been asked a question yet.

       Its own page, and everything cleared. The fixture above legitimately
       carries saved grams with no profile — you can hand-edit the three boxes
       without answering anything about yourself — and a figure is the right
       answer there. The dash is for a reader who has stored nothing. */
    const cold = await t.fresh({ viewport: { width: 412, height: 915 } });
    await cold.evaluate(() => {
      ['bsc.macroProfile', 'bsc.macroTargets', 'bsc.macroWeights']
        .forEach((k) => localStorage.removeItem(k));
    });
    await cold.reload();
    await cold.waitForTimeout(400);
    await cold.click('.tab[data-view="macros"]');
    await cold.waitForTimeout(300);
    await openPlan(cold);
    await cold.waitForTimeout(500);
    t.ok('a plan nobody has made says so, rather than claiming nought calories',
      await cold.evaluate(() => {
        const big = document.getElementById('mtBigKcal');
        return !!big && !/\d/.test(big.textContent);
      }),
      await cold.evaluate(() =>
        (document.getElementById('mtBigKcal') || {}).textContent));
    t.ok('and neither do the three tiles under it',
      await cold.evaluate(() => ['mtTileP', 'mtTileF', 'mtTileC'].every((id) => {
        const el = document.getElementById(id);
        return el && !/\d/.test(el.textContent);
      })),
      await cold.evaluate(() => ['mtTileP', 'mtTileF', 'mtTileC']
        .map((id) => (document.getElementById(id) || {}).textContent).join('|')));
    await cold.context().close();

    /* ---- the first run is four steps, and all of them are in the document
     *
     * mtProfileFromDom reads the whole form out of the live DOM in one pass
     * and falls back to storage for any field it cannot find:
     *
     *     var n = function (id, fb) { var el = $(id); if (!el) return fb; ... }
     *
     * So a step that was built when you reached it, rather than hidden until
     * then, would have every question on it answered as a zero — and a plan
     * computed confidently from those zeros, with nothing thrown and nothing
     * to see. That is the whole reason the steps are rendered together and
     * only shown apart, and it is what this asserts. */
    const wiz = await t.fresh({ viewport: { width: 412, height: 915 } });
    await wiz.evaluate(() => {
      ['bsc.macroProfile', 'bsc.macroTargets', 'bsc.macroWeights']
        .forEach((k) => localStorage.removeItem(k));
    });
    await wiz.reload();
    await wiz.waitForTimeout(400);
    await wiz.click('.tab[data-view="macros"]');
    await wiz.waitForTimeout(300);
    /* deliberately NOT openPlan(), which reveals every step for the tests
       that are about something else */
    await wiz.click('#macroFill');
    await wiz.waitForTimeout(500);

    t.ok('a first run opens as five steps with one of them showing',
      await wiz.evaluate(() => {
        const all = [...document.querySelectorAll('[data-mtwstep]')];
        const shown = all.filter((s) => !s.hidden);
        return all.length === 5 && shown.length === 1 && shown[0].dataset.mtwstep === '1';
      }),
      await wiz.evaluate(() => [...document.querySelectorAll('[data-mtwstep]')]
        .map((s) => s.dataset.mtwstep + (s.hidden ? ':hidden' : ':shown')).join(' ')));

    const FIELDS = ['mtAge', 'mtFt', 'mtIn', 'mtLb', 'mtAct', 'mtSteps',
      'mtWorkouts', 'mtGoalLb', 'mtGoalBy', 'mtP', 'mtF', 'mtC'];
    t.ok('and every question is in the document, including the ones not showing',
      await wiz.evaluate((ids) => ids.every((id) => !!document.getElementById(id)), FIELDS),
      await wiz.evaluate((ids) => ids.filter((id) => !document.getElementById(id)).join(', ')
        || 'all present', FIELDS));

    /* The step you are on is answered before the next is put. Nothing is said
       until there is enough to say something true. */
    t.ok('step one says nothing before it has been answered',
      await wiz.evaluate(() => !(document.getElementById('mtwSaid1') || {}).textContent.trim()),
      await wiz.evaluate(() => (document.getElementById('mtwSaid1') || {}).textContent));

    await wiz.fill('#mtAge', '43');
    await wiz.fill('#mtFt', '5');
    await wiz.fill('#mtIn', '11');
    await wiz.fill('#mtLb', '190');
    await wiz.waitForTimeout(350);
    t.ok('and answers with a figure once it can',
      await wiz.evaluate(() => /\d/.test((document.getElementById('mtwSaid1') || {}).textContent || '')),
      await wiz.evaluate(() => ((document.getElementById('mtwSaid1') || {}).textContent || '').trim().slice(0, 60)));

    /* The figure step one calls being alive is the figure step two breaks out
       under the same words. mBurn's `base` is two different quantities wearing
       one name depending on whether steps have been given yet, and reading it
       here gave a resting burn of 2,757 on step one against 2,135 on step
       two — the same idea, two numbers, one screen apart. */
    await wiz.click('[data-mtw="next"]');
    await wiz.waitForTimeout(300);
    await wiz.fill('#mtSteps', '8000');
    for (const d of [0, 2, 5]) await wiz.click('[data-mtrain="' + d + '"]');
    await wiz.waitForTimeout(350);
    /* Step one says two figures now — the basal rate as "at rest" and bmr ×
       1.2 as "sitting still" — so it is the sitting-still one that step two
       must break out, under the same words. */
    t.ok('and step two breaks the same figure out, not a different one',
      await wiz.evaluate(() => {
        const one = ((document.getElementById('mtwSaid1') || {}).textContent || '').match(/([\d,]+) sitting still/);
        const part = [...document.querySelectorAll('#mtwSaid2 .mtw-part')]
          .find((x) => /sitting still/.test(x.textContent));
        return !!one && !!part && part.querySelector('b').textContent === one[1];
      }),
      await wiz.evaluate(() => [(document.getElementById('mtwSaid1') || {}).textContent,
        (document.getElementById('mtwSaid2') || {}).textContent].join(' || ').slice(0, 150)));

    t.ok('Back goes back, and the step you left is showing again',
      await (async () => {
        await wiz.click('[data-mtw="back"]');
        await wiz.waitForTimeout(300);
        return wiz.evaluate(() => {
          const shown = [...document.querySelectorAll('[data-mtwstep]')].filter((s) => !s.hidden);
          return shown.length === 1 && shown[0].dataset.mtwstep === '1';
        });
      })(),
      await wiz.evaluate(() => [...document.querySelectorAll('[data-mtwstep]')]
        .map((s) => s.dataset.mtwstep + (s.hidden ? ':hidden' : ':shown')).join(' ')));

    /* The pips are drawn from the step count now. They were four spans typed
       by hand, so the fifth step would have arrived under a bar still saying
       four — the kind of disagreement nobody sees until they count. */
    t.ok('and the progress bar has a pip per step, not a hardcoded four',
      await wiz.evaluate(() =>
        document.querySelectorAll('.mtw-pip').length ===
        document.querySelectorAll('[data-mtwstep]').length),
      await wiz.evaluate(() => document.querySelectorAll('.mtw-pip').length + ' pips'));

    /* The PLAN step carries the Save. Next used to stand in for it by finding
       the button and clicking it — which worked in the one-screen sheet,
       where such a button exists, and did nothing at all in the wizard, where
       it did not. The wizard could not save.
     *
       It is no longer the LAST step: the food grid comes after it, because
       "1,910 calories a day" is the answer that earns "so what do you eat".
       So Next is still there on this one, and what has to hold is that Save
       is present and reachable rather than that nothing follows it. */
    for (let i = 0; i < 3; i++) {
      await wiz.click('[data-mtw="next"]');
      await wiz.waitForTimeout(250);
    }
    t.ok('the plan step carries a Save you can actually press',
      await wiz.evaluate(() => {
        const sv = document.querySelector('[data-mtarg="save"]');
        const st = [...document.querySelectorAll('[data-mtwstep]')].find((x) => !x.hidden);
        return !!sv && !sv.closest('[data-mtwstep]').hidden &&
          st && st.dataset.mtwstep === '4';
      }),
      await wiz.evaluate(() => {
        const sv = document.querySelector('[data-mtarg="save"]');
        return 'save:' + (sv ? (sv.closest('[data-mtwstep]').hidden ? 'hidden' : 'shown') : 'MISSING');
      }));

    /* And the last step finishes rather than leaving you to the x in the
       corner: Next stands down, Done takes its place. Blake: "make the pick
       my foods the next step, with a subtle I'm ready to just start now" —
       so Next is the way on, and the Save on the plan step is the quiet
       line under it. */
    t.ok('and the plan step keeps Next, with the quiet start-now line as its Save',
      await wiz.evaluate(() => {
        const nx = document.querySelector('[data-mtw="next"]');
        const sv = document.querySelector('[data-mtarg="save"]');
        return !!nx && !nx.hidden && !!sv && sv.classList.contains('mtw-link') &&
          /start now/i.test(sv.textContent);
      }), await wiz.evaluate(() => (document.querySelector('[data-mtarg="save"]') || {}).textContent));
    await wiz.click('[data-mtw="next"]');
    await wiz.waitForTimeout(300);
    t.ok('the last step swaps Next for a Done',
      await wiz.evaluate(() => {
        const nx = document.querySelector('[data-mtw="next"]');
        const dn = document.querySelector('[data-mtw="done"]');
        const st = [...document.querySelectorAll('[data-mtwstep]')].find((x) => !x.hidden);
        return !!nx && nx.hidden && !!dn && !dn.hidden && st.dataset.mtwstep === '5';
      }),
      await wiz.evaluate(() => {
        const dn = document.querySelector('[data-mtw="done"]');
        return 'done ' + (dn ? (dn.hidden ? 'hidden' : 'shown') : 'missing');
      }));
    /* A tap on the last step has to SHOW. The wizard's sheet is drawn once
       and left — a redraw would throw away half-typed answers on four other
       steps — so renderModal does nothing here, and the first version of this
       screen wrote the favourite and repainted nothing. bsc.favs had the
       food; the chip looked untouched; the honest reading was that the tap
       had missed, and the next tap took it back off. */
    const fav1 = await wiz.evaluate(() => {
      const b = document.querySelector('.fp-chip:not(.on)');
      const id = b.dataset.fppick;
      b.click();
      return id;
    });
    await wiz.waitForTimeout(300);
    t.ok('a food tapped on the last step shows that it was tapped',
      await wiz.evaluate((id) => {
        const b = document.querySelector('[data-fppick="' + id + '"]');
        return !!b && b.classList.contains('on') &&
          b.getAttribute('aria-pressed') === 'true';
      }, fav1), fav1);
    t.ok('and it is still the last step afterwards, not back at the first',
      await wiz.evaluate(() => {
        const st = [...document.querySelectorAll('[data-mtwstep]')].find((x) => !x.hidden);
        return !!st && st.dataset.mtwstep === '5';
      }));
    /* The button says which of the two things pressing it means. */
    t.ok('and the finish button counts what you chose',
      await wiz.evaluate(() =>
        /\d+ chosen/.test(document.querySelector('[data-mtw="done"]').textContent)),
      await wiz.evaluate(() => document.querySelector('[data-mtw="done"]').textContent));
    await wiz.evaluate((id) => document.querySelector('[data-fppick="' + id + '"]').click(), fav1);
    await wiz.waitForTimeout(300);
    t.ok('and offers to skip once nothing is chosen',
      await wiz.evaluate(() =>
        /skip/i.test(document.querySelector('[data-mtw="done"]').textContent)),
      await wiz.evaluate(() => document.querySelector('[data-mtw="done"]').textContent));

    /* Back to the plan step, because Save lives there and the next assertion
       presses it. */
    await wiz.click('[data-mtw="back"]');
    await wiz.waitForTimeout(300);

    await wiz.click('[data-mtarg="save"]');
    await wiz.waitForTimeout(400);
    t.ok('and saving from it keeps every answer, including the hidden steps',
      await wiz.evaluate(() => {
        const pr = JSON.parse(localStorage.getItem('bsc.macroProfile') || '{}');
        return pr.age === 43 && pr.ft === 5 && pr.inch === 11 && pr.lb === 190 &&
          Number(pr.steps) === 8000 && pr.workouts === 3;
      }),
      await wiz.evaluate(() => localStorage.getItem('bsc.macroProfile')));

    /* And every time after, it is one screen. Changing your step count should
       not be four taps through questions you answered months ago. */
    await wiz.reload();
    await wiz.waitForTimeout(400);
    await wiz.click('.tab[data-view="macros"]');
    await wiz.waitForTimeout(300);
    await openPlan(wiz);
    await wiz.waitForTimeout(400);
    t.ok('but a plan already made opens as one sheet, not four steps',
      await wiz.evaluate(() => document.querySelectorAll('[data-mtwstep]').length === 0 &&
        !!document.getElementById('mtEditor')),
      await wiz.evaluate(() => 'steps:' + document.querySelectorAll('[data-mtwstep]').length));
    await wiz.context().close();

    /* ---- telling the plan you train never feeds you less -----------------
     *
     * The wizard's activity question is "only the job; the workouts asked
     * next carry the training". But once a session or a step count was told,
     * mBurn rebuilt the day from a desk and never read the job again, so "On
     * my feet" with no training said burned 2,446, and ticking ONE lifting day
     * took it to 2,183. The job and the steps are two guesses at the same
     * movement; the larger stands and the sessions go on top. */
    const jobPg = await t.fresh({ viewport: { width: 412, height: 915 } });
    const burnSums = await jobPg.evaluate(() => {
      const L = window.__macroLab, bad = [];
      const who = (o) => Object.assign({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.2 }, o);
      /* At a desk the job adds nothing, so the day is what the steps-and-
         sessions arithmetic always made it — worked out here the way it was
         before, against every combination of the two. */
      const before = (pr) => {
        const kg = pr.lb * 0.45359237, cm = (pr.ft * 12 + pr.inch) * 2.54;
        const bmr = 10 * kg + 6.25 * cm - 5 * pr.age + (pr.sex === 'f' ? -161 : 5);
        if (!(pr.steps > 0) && !(pr.workouts > 0)) return bmr * pr.act;
        return bmr * 1.2 + Math.max(0, (pr.steps || 0) - 2500) * 0.53 * kg * 0.00075 +
          (5 * 3.5 * kg / 200) * 45 * (pr.workouts || 0) / 7;
      };
      let desks = 0;
      ['m', 'f'].forEach((sex) => [0, 1000, 7000, 13000].forEach((steps) => [0, 1, 3, 5].forEach((workouts) => {
        const pr = who({ sex, steps, workouts });
        desks++;
        if (Math.abs(L.tdee(pr) - before(pr)) > 1e-6) bad.push('desk ' + JSON.stringify(pr) + ': ' + L.tdee(pr) + ' vs ' + before(pr));
      })));
      /* And for every job, saying you train only ever adds: from nothing
         said to one session, and from each session to the next. */
      [1.2, 1.375, 1.55].forEach((act) => {
        let last = L.tdee(who({ act }));
        [1, 2, 3, 4, 5].forEach((workouts) => {
          const now = L.tdee(who({ act, workouts }));
          if (now < last - 1e-6) bad.push(act + ' at ' + workouts + ' sessions: ' + Math.round(last) + ' -> ' + Math.round(now));
          last = now;
        });
        // to a hair: 1.2 + (1.55 − 1.2) is not 1.55 in floating point
        if (L.tdee(who({ act, steps: 3000 })) < L.tdee(who({ act })) - 1e-6) bad.push(act + ': a step count lowered it');
      });
      /* The old five-word dial's top two had training in them; told, they
         are read as the most active job, with the sessions counted once. */
      if (Math.abs(L.tdee(who({ act: 1.9, workouts: 3 })) - L.tdee(who({ act: 1.55, workouts: 3 }))) > 1e-6) {
        bad.push('1.9 is not read as 1.55 once the training is told');
      }
      return { bad, desks };
    });
    t.ok('at a desk the burn is exactly what it was, every step count and session count',
      burnSums.desks === 32 && !burnSums.bad.some((b) => /^desk/.test(b)), JSON.stringify(burnSums));
    t.ok('and on any job, one more session never lowers it — nor does a step count',
      burnSums.bad.length === 0, JSON.stringify(burnSums.bad));

    // the same, as the wizard says it
    await jobPg.evaluate(() => ['bsc.macroProfile', 'bsc.macroTargets', 'bsc.macroWeights']
      .forEach((k) => localStorage.removeItem(k)));
    await jobPg.reload();
    await jobPg.waitForTimeout(400);
    await jobPg.click('.tab[data-view="macros"]');
    await jobPg.waitForTimeout(300);
    await jobPg.click('#macroFill');
    await jobPg.waitForTimeout(500);
    await jobPg.fill('#mtAge', '43');
    await jobPg.fill('#mtFt', '5');
    await jobPg.fill('#mtIn', '11');
    await jobPg.fill('#mtLb', '190');
    await jobPg.click('[data-mtw="next"]');
    await jobPg.waitForTimeout(300);
    await jobPg.click('[data-mtact="1.375"]');
    await jobPg.waitForTimeout(300);
    const burnSaid = () => jobPg.evaluate(() => {
      const el = document.getElementById('mtwSaid2');
      const m = ((el && el.querySelector('.mtw-head b')) || {}).textContent || '';
      return { kcal: Number(m.replace(/,/g, '')), text: el ? el.textContent : '' };
    });
    const onFeet = await burnSaid();
    await jobPg.click('[data-mtrain="0"]');
    await jobPg.waitForTimeout(300);
    const oneDay = await burnSaid();
    t.ok('on my feet, ticking one lifting day adds to the burn rather than taking 263 off it',
      onFeet.kcal > 0 && oneDay.kcal >= onFeet.kcal, onFeet.kcal + ' → ' + oneDay.kcal);
    t.ok('and the parts it breaks into say the job is moving about, not a walk',
      /moving about/.test(oneDay.text) && !/walking/.test(oneDay.text), oneDay.text);
    await jobPg.context().close();

    /* ---- the wizard agrees with itself -----------------------------------
     *
     * Step one said "2,135 kcal at rest" (bmr × 1.2) and the plan step, under
     * the same words, "Below your 1779 kcal at rest" (bmr). And the goal card
     * said "About 1 lb a week" over an answer reading "about 1.4 lb a week
     * off" for the same goal at 190 lb. At rest is the basal rate everywhere;
     * the card says the goal's pounds for the weight typed. */
    const restPg = await t.fresh({ viewport: { width: 412, height: 915 } });
    await restPg.evaluate(() => ['bsc.macroProfile', 'bsc.macroTargets', 'bsc.macroWeights']
      .forEach((k) => localStorage.removeItem(k)));
    await restPg.reload();
    await restPg.waitForTimeout(400);
    await restPg.click('.tab[data-view="macros"]');
    await restPg.waitForTimeout(300);
    await restPg.click('#macroFill');
    await restPg.waitForTimeout(500);
    const cardSays = () => restPg.evaluate(() =>
      (document.querySelector('[data-mtgoal="cut1"] span') || {}).textContent || '');
    const noWeight = await cardSays();
    await restPg.fill('#mtAge', '43');
    await restPg.fill('#mtFt', '5');
    await restPg.fill('#mtIn', '11');
    await restPg.fill('#mtLb', '190');
    await restPg.waitForTimeout(350);
    const rest1 = await restPg.evaluate(() => {
      const s = (document.getElementById('mtwSaid1') || {}).textContent || '';
      const n = (re) => { const m = s.match(re); return m ? Number(m[1].replace(/,/g, '')) : 0; };
      return { s, rest: n(/([\d,]+)\s*kcal at rest/), still: n(/([\d,]+) sitting still/) };
    });
    t.ok('step one says the basal rate as at rest, and the day sitting still beside it',
      rest1.rest > 0 && rest1.still > rest1.rest && /^[\d,]+ kcal at rest · [\d,]+ sitting still/.test(rest1.s.trim()),
      rest1.s);
    await restPg.click('[data-mtw="next"]');
    await restPg.waitForTimeout(300);
    await restPg.click('[data-mtact="1.375"]');
    await restPg.click('[data-mtw="next"]');
    await restPg.waitForTimeout(300);
    await restPg.click('[data-mtgoal="cut1"]');
    await restPg.waitForTimeout(300);
    const goalSaid = await restPg.evaluate(() => (document.getElementById('mtwSaid3') || {}).textContent || '');
    const withWeight = await cardSays();
    const perWk = (goalSaid.match(/about ([\d.]+) lb a week/) || [])[1];
    t.ok('the goal card says the pounds a week the answer under it works out, for the weight typed',
      !!perWk && withWeight.indexOf('About ' + perWk + ' lb a week') === 0 &&
        /^About 1 lb a week/.test(noWeight),
      JSON.stringify({ noWeight, withWeight, goalSaid }));
    await restPg.click('[data-mtw="next"]');
    await restPg.waitForTimeout(300);
    const restPlan = await restPg.evaluate(() => (document.getElementById('mtPlan') || {}).textContent || '');
    t.ok('and the plan step’s "below at rest" is the same at-rest figure step one gave',
      restPlan === 'Below your ' + rest1.rest.toLocaleString('en-US') + ' kcal at rest.',
      restPlan + ' vs ' + rest1.s);
    await restPg.context().close();
    /* ---- "Fill from" governs drafting, not looking ------------------------
     * The setting says what the SOLVER may shop from — a day drafted out of
     * salmon that is not in the house is not a day. It was also gating the
     * "Single foods" lens and the typed-word pool, so all twenty-eight
     * outside foods vanished from the one lens whose whole job is "let me
     * look through the shelf" — while the same foods came straight back the
     * moment you typed their name. A shelf disagreeing with its own search
     * box. Three comments in the file say the gate is about drafting; only
     * the four drafting pools should hold it, and this asserts BOTH halves,
     * because deleting the gate outright would be the worse bug. */
    const extGate = async (extFill) => {
      const pg = await t.fresh({ viewport: { width: 412, height: 915 } });
      await pg.evaluate((e) => {
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43,
          ft: 5, inch: 11, lb: 190, act: 1.375, goal: 'cut1', goalLb: 0, goalBy: '',
          workouts: 4, steps: 8000, extFill: e }));
      }, extFill);
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(300);
      await addOn(pg);
      await pg.waitForTimeout(600);
      await pg.evaluate(() => {
        const sel = document.getElementById('mpSec');
        if (sel) { sel.value = 'foods'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await pg.waitForTimeout(500);
      const out = await pg.evaluate(() => {
        const N = window.Nutrition.FOODS;
        const isExt = (id) => id.indexOf('f:') === 0 && N[id.slice(2)] && !!N[id.slice(2)].ext;
        const rows = [...document.querySelectorAll('.mpick-row[data-mpick]')]
          .map((r) => r.dataset.mpick);
        const lev = window.__macroLab.levers();
        const levIds = [].concat(lev.p || [], lev.f || [], lev.c || []).map((x) => x.id);
        return { browse: rows.filter(isExt).length, shelf: rows.length,
          drafting: levIds.filter(isExt).length };
      });
      await pg.context().close();
      return out;
    };
    const gateShut = await extGate(false);
    const gateOpen = await extGate(true);
    /* Counted, not named: the list is capped at forty plus whatever is held,
       and no individual outside food is guaranteed to survive that cap — the
       closers come off a different bench in the two settings and claim
       different rows into `shown`. What is not a matter of ranking is whether
       ANY of them can appear, and before this that number was flatly zero. */
    t.ok('the shelf shows the outside foods even when Fill may not shop for them',
      gateShut.browse > 20, JSON.stringify(gateShut));
    t.ok('and shows about as many of them either way',
      Math.abs(gateShut.browse - gateOpen.browse) <= 4,
      JSON.stringify({ shut: gateShut, open: gateOpen }));
    /* The half that must NOT change: deleting the gate would be worse than
       the bug, because a drafted day would send you shopping. */
    t.ok('while the solver still refuses to draft from them',
      gateShut.drafting === 0 && gateOpen.drafting > 0,
      JSON.stringify({ shutDraft: gateShut.drafting, openDraft: gateOpen.drafting }));

    /* ---- the lens and the order keep the focus that changed them ----------
     * Both selects used to sit in .mp-controls, a sibling of #mpList, where
     * redrawing the list could not touch them. They moved onto the "Fits best
     * / On the shelf" divider, which mpFitsHTML returns as PART of the list —
     * so the redraw destroyed the very select that asked for it and focus
     * fell to the body. A keyboard or screen-reader user had to tab from the
     * top of the sheet back down again for every change. focusKey already
     * falls back to #id; nothing was holding on. */
    const lensPg = await t.fresh({ viewport: { width: 412, height: 915 } });
    await lensPg.click('.tab[data-view="macros"]');
    await lensPg.waitForTimeout(250);
    await addOn(lensPg);
    await lensPg.waitForTimeout(600);
    const held = [];
    for (const [id, val] of [['mpSec', 'all'], ['mpSort', 'protein']]) {
      await lensPg.focus('#' + id);
      await lensPg.selectOption('#' + id, val);
      await lensPg.waitForTimeout(350);
      held.push(await lensPg.evaluate((i) => ({
        id: i, active: document.activeElement ? document.activeElement.id || document.activeElement.tagName : 'NONE',
        value: (document.getElementById(i) || {}).value }), id));
    }
    t.ok('changing the lens leaves the focus on the lens',
      held[0].active === 'mpSec' && held[0].value === 'all', JSON.stringify(held[0]));
    t.ok('and changing the order leaves it on the order',
      held[1].active === 'mpSort' && held[1].value === 'protein', JSON.stringify(held[1]));
    await lensPg.context().close();

    const findPg = await t.fresh({ viewport: { width: 412, height: 915 } });
    await findPg.click('.tab[data-view="macros"]');
    await findPg.waitForTimeout(250);
    await addOn(findPg);
    await findPg.waitForTimeout(500);
    const bandsOf = () => findPg.evaluate(() =>
      [...document.querySelectorAll('#mpList .mt-div')].map((e) => e.textContent));
    const resting = await bandsOf();
    t.ok('the resting screen has a search box on it',
      await findPg.evaluate(() => !!document.getElementById('mpFind')));
    t.ok('and ranked bands under it', resting.length > 0, JSON.stringify(resting));

    /* A word taken from a row the ranking itself chose, so the assertion is
       that the band SURVIVES being searched — never a literal dish, which
       would be pinning today's arithmetic. */
    /* A word from a RECIPE in the ranked bands, not from whatever row is
       first: a food that matches by name is hoisted into its own "Foods" band
       ahead of everything, so a word taken from row one tests the hoist
       rather than the survival of the ranking. */
    const word = await findPg.evaluate(() => {
      const row = [...document.querySelectorAll('#mpList .mpick-wrap')]
        .find((w) => {
          const b = w.querySelector('.mpick-row');
          return b && !/^f:/.test(b.dataset.mpick);
        });
      const n = row ? (row.querySelector('.mp-name') || {}).textContent || '' : '';
      return (n.split(/[\s,&]+/).find((w2) => w2.length > 4) || '').toLowerCase();
    });
    await findPg.fill('#mpFind', word);
    await findPg.waitForTimeout(450);
    const narrowed = await bandsOf();
    t.ok('typing keeps the ranked bands rather than throwing them away',
      !!word && narrowed.length > 0 &&
      narrowed.some((b) => resting.indexOf(b) >= 0), word + ' -> ' + JSON.stringify(narrowed));

    /* And it still reaches what the bands do not hold. Salmon is deliberately
       kept out of the ranked pool by the storehouse gate; searching must find
       it anyway, because looking a thing up is how you decide to buy it. */
    await findPg.fill('#mpFind', 'salmon');
    await findPg.waitForTimeout(450);
    t.ok('and still finds what the bands were never going to offer',
      await findPg.evaluate(() => [...document.querySelectorAll('#mpList .mp-name')]
        .some((e) => /salmon/i.test(e.textContent))));

    /* THE CONSTRAINT THE WHOLE DESIGN RESTS ON: the box is a SIBLING of
       #mpList, and a keystroke rebuilds only the list. Replacing the sheet
       would redraw the input mid-word. Typed with a real keyboard and the
       caret put back inside the word, because page.fill() would not notice. */
    await findPg.evaluate(() => {
      const i = document.getElementById('mpFind');
      i.focus();
      i.setSelectionRange(3, 3);
    });
    await findPg.keyboard.type('x');
    await findPg.waitForTimeout(400);
    const typedState = await findPg.evaluate(() => ({
      active: document.activeElement.id,
      caret: document.activeElement.selectionStart,
      val: document.activeElement.value }));
    t.ok('and a keystroke leaves the caret where you put it',
      typedState.active === 'mpFind' && typedState.caret === 4 && typedState.val === 'salxmon',
      JSON.stringify(typedState));

    /* Home had no empty state at all — every band returns '' when it has
       nothing, so a query matching nothing rendered a silence. */
    await findPg.fill('#mpFind', 'zzzqqqxx');
    await findPg.waitForTimeout(400);
    t.ok('and a query that matches nothing says so',
      await findPg.evaluate(() => {
        const e = document.querySelector('#mpList .mslot-empty');
        return !!e && /zzzqqqxx/.test(e.textContent);
      }));
    /* ---- the shelf rail --------------------------------------------------
     * Chips that narrow the same list the search box narrows, so the two
     * compose: 🥩 with "chicken" typed is the chicken that is mostly protein.
     * That is why a chip is a filter and not a mode — Recipes as a MODE could
     * never have been crossed with a macro.
     *
     * Measured at 320, the narrowest width supported, because that is where
     * the rail is tightest and the chips nearest the edge. */
    await findPg.context().close();
    const railPg = await t.fresh({ viewport: { width: 320, height: 844 },
      hasTouch: true, isMobile: true });
    await railPg.click('.tab[data-view="macros"]');
    await railPg.waitForTimeout(250);
    await addOn(railPg);
    await railPg.waitForTimeout(500);
    const railInfo = await railPg.evaluate(() => {
      const rail = document.getElementById('mpShelves');
      if (!rail) return null;
      const chips = [...rail.querySelectorAll('[data-mpshelf]')];
      return { n: chips.length,
        labels: chips.map((c) => c.getAttribute('aria-label') || c.textContent.trim()),
        tap: Math.min(...chips.map((c) => Math.round(c.getBoundingClientRect().height))),
        scrolls: rail.scrollWidth - rail.clientWidth > 1,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    t.ok('the picker has a shelf rail', !!railInfo && railInfo.n >= 5, JSON.stringify(railInfo));
    /* A thumb target, and the rail — not the page — is what scrolls sideways. */
    t.ok('and its chips are a thumb’s worth, without pushing the page sideways',
      railInfo.tap >= 40 && railInfo.pageOverflow === 0, JSON.stringify(railInfo));

    /* An 🫒 Oils chip that filters to one row is worse than no chip: it looks
       like the app has nothing when what it has is one oil. Every chip drawn
       has to find something. */
    const shelved = await railPg.evaluate(async () => {
      const out = {};
      const chips = [...document.querySelectorAll('[data-mpshelf]')]
        .map((c) => c.dataset.mpshelf).filter((k) => k);
      for (const k of chips) {
        document.querySelector('[data-mpshelf="' + k + '"]').click();
        await new Promise((r) => setTimeout(r, 120));
        out[k] = document.querySelectorAll('#mpList .mpick-wrap').length;
      }
      return out;
    });
    t.ok('and every chip it draws actually finds something',
      Object.keys(shelved).length > 0 &&
      Object.keys(shelved).every((k) => shelved[k] > 0), JSON.stringify(shelved));

    /* Composed with the box, which is the whole reason it is a filter. */
    await railPg.evaluate(() => {
      const v = document.querySelector('[data-mpshelf="carb"]');
      if (v && v.getAttribute('aria-pressed') !== 'true') v.click();
    });
    await railPg.waitForTimeout(300);
    await railPg.fill('#mpFind', 'bean');
    await railPg.waitForTimeout(450);
    t.ok('a chip and a query narrow together, not one instead of the other',
      await railPg.evaluate(() => {
        const rows = [...document.querySelectorAll('#mpList .mp-name')].map((e) => e.textContent);
        return rows.length > 0 && rows.every((n) => /bean/i.test(n));
      }),
      await railPg.evaluate(() =>
        [...document.querySelectorAll('#mpList .mp-name')].map((e) => e.textContent).join(' | ')));

    /* Same constraint as the keystroke path: pressing a chip repaints the
       list, never the sheet, or the search box would be redrawn mid-word. */
    await railPg.evaluate(() => {
      const i = document.getElementById('mpFind');
      i.focus();
      i.setSelectionRange(2, 2);
    });
    await railPg.keyboard.type('X');
    await railPg.waitForTimeout(350);
    t.ok('and typing after pressing one keeps both the caret and the chip',
      await railPg.evaluate(() => document.activeElement.id === 'mpFind' &&
        document.activeElement.selectionStart === 3 &&
        (document.querySelector('.mp-shelf.on') || {}).dataset.mpshelf === 'carb'));

    /* The three macro pills (🥩 Protein, 🥑 Fats, 🍚 Carbs) filter single
       foods by dominant macro calorie share, while 🍲 Recipes filters dishes. */
    await railPg.evaluate(() => {
      const i = document.getElementById('mpFind');
      i.value = '';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      const p2 = document.querySelector('[data-mpshelf="protein"]');
      if (p2) p2.click();
    });
    await railPg.waitForTimeout(400);
    t.ok('and a macro shelf holds single foods by dominant macro',
      await railPg.evaluate(() => {
        const rows = [...document.querySelectorAll('#mpList .mpick-wrap .mpick-row')];
        return rows.length > 0 && rows.every((r) => /^f:/.test(r.dataset.mpick));
      }),
      await railPg.evaluate(() => [...document.querySelectorAll('#mpList .mpick-wrap .mpick-row')]
        .map((r) => r.dataset.mpick).join(',')));
    await railPg.context().close();
  },
});
