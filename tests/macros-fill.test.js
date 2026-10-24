/* The plan calculator, favorites, and Fill my day: a card sent away staying
 * away, a favorite never ranking worse for being loved, Fill drafting every
 * empty meal as one combination and leaving placed plates alone, and the
 * plan sheet's weight.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openWeigh, openPlan, pickerList, openMeal, closeSheet, openRow } = require('./fixtures/nourish.js');

/* The day is trays and a meal opens as one sheet (Blake, 2026-10-04): the
   picker and a food's ⋯ live in the meal's sheet; Fill lives on the day's
   bar, under the sheet. So a test opens the meal it means, and closes its
   sheet before it reaches for the bar. */
async function toDay(pg) { await closeSheet(pg); }

module.exports = nourish({
  name: 'Macros — the plan calculator, favorites, and Fill my day',
  async suite(t) {
    /* ---- the plan calculator, favorites, and Fill my day ------------------
     * A second fresh page: this chapter is about deriving the targets and
     * drafting the day, and it must not inherit the hand-made day above. */
    const q = await t.fresh();
    await q.click('.tab[data-view="macros"]');
    await q.waitForTimeout(150);

    await openPlan(q);
    await q.waitForTimeout(200);
    t.ok('an empty profile asks for the numbers rather than inventing a plan',
      /fill in who you are/i.test(await q.textContent('#mtPlan')),
      await q.textContent('#mtPlan'));

    /* The same arithmetic the app claims: Mifflin–St Jeor for the basal rate,
       an activity multiplier for the day, and then a RATE — a cut is a pound
       a week per hundred of bodyweight, the way RP frames it, not a flat
       percentage off the day. A percentage scales wrong: the same quarter
       off gives a big man a comfortable day and a small woman a dangerous
       one. */
    const prof = { lb: 200, ftIn: 72, age: 40, act: 1.55 };
    const bmr = 10 * (prof.lb * 0.45359237) + 6.25 * (prof.ftIn * 2.54) - 5 * prof.age + 5;
    const tdee = bmr * prof.act;
    const perWeek = 0.01 * prof.lb;                          // hard cut = 1%/wk
    const kcal = Math.max(1500, Math.round(tdee - perWeek * 3500 / 7));
    /* Protein is a gram a pound of the reference weight at the default
       level — today's weight here, with no goal weight and no body fat typed
       — whatever the pace; and it gives ground to 0.8 g a pound of the same
       reference when the carbohydrate is squeezed. */
    let planP = Math.round(1.0 * prof.lb);
    const planF = Math.round(Math.max(0.3 * prof.lb, 0.25 * kcal / 9));
    const minC = Math.round(0.15 * kcal / 4);
    if ((kcal - 4 * planP - 9 * planF) / 4 < minC) {
      planP = Math.max(Math.round(0.8 * prof.lb),
        Math.round((kcal - 9 * planF - 4 * minC) / 4));
    }
    const planC = Math.max(0, Math.round((kcal - 4 * planP - 9 * planF) / 4));

    await q.fill('#mtAge', String(prof.age));
    await q.fill('#mtFt', '6');
    await q.fill('#mtIn', '0');
    await q.fill('#mtLb', String(prof.lb));
    await q.selectOption('#mtAct', '1.55');
    await q.click('[data-mtgoal="cut2"]');
    await q.waitForTimeout(150);
    /* The boxes are the plan's one rendering now — the old separate preview
       line could disagree with them by a rounding kcal, and did. A complete
       profile leaves the status line silent and the kcal readout summing the
       boxes themselves. */
    t.ok('a complete profile leaves the status line with nothing to say',
      (await q.textContent('#mtPlan')).trim() === '', await q.textContent('#mtPlan'));
    t.ok('and one kcal figure, summed from the boxes',
      (await q.textContent('#mtKcal')).indexOf('= ' + (4 * planP + 4 * planC + 9 * planF) + ' kcal') >= 0,
      await q.textContent('#mtKcal'));

    /* The plan and the gram boxes are ONE model: the plan writes into the
       boxes as the profile changes, and the single Save commits the boxes.
       (v1 had a second "Use this plan" button, and Save after it silently
       restored the old grams — the exact trap a two-commit sheet lays.) */
    t.ok('the plan fills the gram boxes as the profile is typed',
      await q.evaluate(([p2, f2, c2]) =>
        mtP.value === String(p2) && mtF.value === String(f2) && mtC.value === String(c2),
        [planP, planF, planC]),
      await q.evaluate(() => [mtP.value, mtF.value, mtC.value].join('/')) +
        ' — wanted ' + planP + '/' + planF + '/' + planC);
    await q.click('[data-mtarg="save"]');
    await q.waitForTimeout(300);
    const qfoot = () => q.textContent('#macroFoot');
    t.ok('and Save carries the plan into the targets',
      new RegExp('/ ' + planP + ' g').test(await qfoot()) &&
      new RegExp('/ ' + planF + ' g').test(await qfoot()) &&
      new RegExp('/ ' + planC + ' g').test(await qfoot()), await qfoot());
    t.ok('and remembers who you are for next time',
      await q.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroProfile')).lb === 200));

    /* Answer first: once the plan computes, the sheet opens on the number and
       the form folds behind one line. The first visit, with nothing to
       compute from, opens the form instead — there is no answer to lead with. */
    await openPlan(q);
    await q.waitForTimeout(250);
    t.ok('a known profile opens on the answer, with the form folded away',
      await q.evaluate(() => document.getElementById('mtEditor').classList.contains('hide') &&
        document.querySelector('.mt-who').getAttribute('aria-expanded') === 'false'));
    t.ok('the headline is the day, in calories and grams',
      await q.evaluate(([k, p2, f2, c2]) =>
        document.getElementById('mtBigKcal').textContent === String(k) &&
        document.getElementById('mtTileP').textContent === String(p2) &&
        document.getElementById('mtTileF').textContent === String(f2) &&
        document.getElementById('mtTileC').textContent === String(c2),
        [4 * planP + 4 * planC + 9 * planF, planP, planF, planC]));
    t.ok('and one line says who it was worked out for',
      /40 · 6′0″ · male/.test(await q.textContent('#mtWho')),
      await q.textContent('#mtWho'));
    await q.click('[data-mtedit]');
    await q.waitForTimeout(150);
    t.ok('Edit unfolds the ledger',
      await q.evaluate(() => !document.getElementById('mtEditor').classList.contains('hide')));
    t.ok('where every fact has its own line',
      await q.evaluate(() => document.querySelectorAll('#mtEditor .mtl-row').length >= 6));
    await q.fill('#mtP', '175');
    await q.waitForTimeout(150);
    t.ok('and a hand-typed gram moves the headline with it',
      await q.evaluate(([f2, c2]) =>
        document.getElementById('mtTileP').textContent === '175' &&
        document.getElementById('mtBigKcal').textContent === String(4 * 175 + 4 * c2 + 9 * f2),
        [planF, planC]));
    /* A goal with a date does its own arithmetic — the deficit falls out of
       the pounds and the weeks rather than out of a preset. */
    await q.fill('#mtGoalLb', '185');
    const inTen = await q.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date(); d.setDate(d.getDate() + 70);
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    });
    await q.fill('#mtGoalBy', inTen);
    await q.waitForTimeout(200);
    /* The destination is a FACT in the ledger under the number, not a
       headline over it and not a sentence crushed onto the fold's handle.
       It used to be set in the book's largest serif above the plan, where a
       sentence reads as a title filled in wrong; then it moved onto the
       handle, where it was said twice on one screen. */
    t.ok('the destination is a fact in the ledger, not a headline over it',
      /200 lb → 185 lb/.test(await q.textContent('#mtFacts')) &&
      await q.evaluate(() => !document.querySelector('.mt-sheet .sheet-name') &&
        !document.getElementById('mtGoalLine')),
      await q.textContent('#mtFacts'));
    t.ok('and the pace beside it, from the date rather than a preset',
      /1\.5 lb a week/.test(await q.textContent('#mtFacts')),
      await q.textContent('#mtFacts'));
    t.ok('and the pace it implies — 15 lb over ten weeks is 1.5 a week',
      /15 lb over 10 weeks/.test(await q.textContent('#mtGoalNote')) &&
      /1\.5 lb a week/.test(await q.textContent('#mtGoalNote')), await q.textContent('#mtGoalNote'));
    t.ok('which sets the calories from the goal, not from the preset',
      await q.evaluate(() => {
        const kc = Number(document.getElementById('mtBigKcal').textContent);
        // 1.5 lb a week is 750 kcal a day under a ~2900 kcal burn for this profile
        return kc > 1900 && kc < 2400;
      }), await q.textContent('#mtBigKcal'));
    await q.fill('#mtGoalLb', '120');
    await q.waitForTimeout(200);
    /* The old cap was on the RATE, and a rate cap is no cap at all on a big
       frame: 1% of 205 lb is 2.05 lb a week, a 1,025 kcal deficit, three
       hundred calories BELOW basal — and the app wrote that plan, then could
       only fill it with quarter portions. The deficit is capped now, and the
       plan says when you would really arrive. */
    t.ok('an impossible pace is held, and the plan says when you would really arrive',
      /more than a body gives up/.test(await q.textContent('#mtGoalNote')) &&
      /arriving about /.test(await q.textContent('#mtGoalNote')),
      await q.textContent('#mtGoalNote'));
    t.ok('and no plan it writes is ever under the floor it keeps',
      await q.evaluate(() =>
        Number(document.getElementById('mtBigKcal').textContent) >= 1500),
      await q.textContent('#mtBigKcal'));
    t.ok('nor one with no room left to eat carbohydrate',
      await q.evaluate(() => {
        const k = Number(document.getElementById('mtBigKcal').textContent);
        return 4 * Number(document.getElementById('mtC').value) >= 0.14 * k;
      }), await q.evaluate(() => document.getElementById('mtC').value + 'g of ' +
        document.getElementById('mtBigKcal').textContent));
    /* Two controls for one decision, one of them silently dead. */
    /* Dimming was not enough. They still took the press, still lit up, and
       still changed nothing — which is worse than being plainly out of use. */
    t.ok('the four presets are properly out of use, not merely faded',
      await q.evaluate(() => {
        const seg = document.getElementById('mtGoalSeg');
        return seg.classList.contains('spent') &&
          Array.from(seg.querySelectorAll('[data-mtgoal]')).every((b2) => b2.disabled);
      }));
    t.ok('and there is a button to put them back in charge',
      await q.evaluate(() => {
        const b2 = document.querySelector('[data-mtfree]');
        return b2 && b2.offsetParent !== null;
      }));
    const wasKcal = await q.textContent('#mtBigKcal');
    await q.click('[data-mtfree]');
    await q.waitForTimeout(200);
    t.ok('pressing it drops the deadline and hands the presets back',
      await q.evaluate(() => {
        const seg = document.getElementById('mtGoalSeg');
        return document.getElementById('mtGoalBy').value === '' &&
          !seg.classList.contains('spent') &&
          Array.from(seg.querySelectorAll('[data-mtgoal]')).every((b2) => !b2.disabled);
      }));
    t.ok('keeping the goal weight, which is not the thing you tired of',
      await q.evaluate(() => document.getElementById('mtGoalLb').value !== ''));
    await q.click('[data-mtgoal="keep"]');
    await q.waitForTimeout(200);
    t.ok('and now a preset actually moves the day',
      (await q.textContent('#mtBigKcal')) !== wasKcal,
      wasKcal + ' → ' + await q.textContent('#mtBigKcal'));
    await q.fill('#mtGoalLb', '');
    await q.fill('#mtGoalBy', '');
    await q.waitForTimeout(200);

    await q.click('.sheet-x');
    await q.waitForTimeout(250);

    /* With a goal and a date, the line says the destination, the distance
       and — once the scale has two weeks to compare — whether it agrees. */
    await openPlan(q);
    await q.waitForTimeout(250);
    // a known profile opens on the answer, so unfold the ledger to reach the goal
    await q.evaluate(() => {
      if (document.getElementById('mtEditor').classList.contains('hide')) {
        document.querySelector('[data-mtedit]').click();
      }
    });
    await q.waitForTimeout(150);
    await q.fill('#mtGoalLb', '185');
    const tenWeeks = await q.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date(); d.setDate(d.getDate() + 70);
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    });
    await q.fill('#mtGoalBy', tenWeeks);
    await q.click('[data-mtarg="save"]');
    await q.waitForTimeout(300);
    const narr = async () => { await openWeigh(q); return q.textContent('.mw-verdict'); };
    /* Both facts, in the shorter words: "15 lb in 10 weeks" says what "15 lb
       to go over 10 weeks" said, and is short enough that the pace verdict
       stays on the line it is a verdict about rather than dropping to one of
       its own. The claim here is the destination and the distance, not the
       preposition between them. */
    t.ok('the line names the destination and the distance',
      /185 lb by/.test(await narr()) && /15 lb in 10 weeks/.test(await narr()), await narr());
    /* It used to add "Two weeks of mornings and this says whether you are on
       pace" here — the app explaining itself, which is the one thing the copy
       is not for. With nothing to judge yet it simply claims no verdict. */
    t.ok('and claims no verdict until the scale has one, without explaining why',
      !/mornings|on pace|behind pace|ahead of pace/i.test(await narr()), await narr());
    await openWeigh(q);
    t.ok('with the way back into the plan behind the press, not standing on the face',
      await q.evaluate(() => {
        const face = document.querySelector('.mw-verdict #macroTargBtn');
        const body = document.querySelector('.mw-body #macroTargBtn');
        return !face && !!body && /Adjust/.test(body.textContent) &&
          !document.querySelector('.mday-head #macroTargBtn');
      }),
      await q.evaluate(() => 'face:' + !!document.querySelector('.mw-verdict #macroTargBtn') +
        ' body:' + ((document.querySelector('.mw-body #macroTargBtn') || {}).textContent || 'none')));

    /* Two weeks of mornings, losing a pound a week against a goal that needs
       about two — the line should say so rather than flatter it. */
    await q.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const ws = {};
      for (let i = 0; i < 16; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        ws[d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())] =
          Math.round((200 + i * 0.14) * 10) / 10;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
    });
    await q.reload();
    await q.waitForTimeout(400);
    /* A goal above your weight is still a goal. Both sides of the verdict are
       normalized to "progress toward it", so the bar to clear stays positive
       — negating it told somebody trying to gain that standing still, or
       losing, was ahead of pace. */
    t.ok('a gain goal is judged on gaining, not on any movement at all',
      await q.evaluate(() => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const by = new Date(); by.setDate(by.getDate() + 70);
        const pr = JSON.parse(localStorage.getItem('bsc.macroProfile'));
        pr.goalLb = pr.lb + 10;            // ten pounds ON, ten weeks
        pr.goalBy = by.getFullYear() + '-' + p2(by.getMonth() + 1) + '-' + p2(by.getDate());
        /* A goal written by hand bypasses the writer that stamps where it
           started; leaving the old stamp on it is a goal set from another
           goal's morning, which nothing in the app can produce. */
        delete pr.goalSet; delete pr.goalFrom;
        localStorage.setItem('bsc.macroProfile', JSON.stringify(pr));
        const ws = {};
        for (let i = 0; i < 16; i++) {     // losing half a pound a week
          const d = new Date(); d.setDate(d.getDate() - i);
          ws[d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())] =
            Math.round((pr.lb + i * 0.07) * 10) / 10;
        }
        localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
        return true;
      }));
    await q.reload();
    await q.waitForTimeout(400);
    t.ok('and losing weight against a gain goal reads behind, not ahead',
      /late|no date yet/.test(await narr()) && !/early/.test(await narr()), await narr());
    await q.evaluate(() => {
      const pr = JSON.parse(localStorage.getItem('bsc.macroProfile'));
      pr.goalLb = 185; delete pr.goalSet; delete pr.goalFrom;
      localStorage.setItem('bsc.macroProfile', JSON.stringify(pr));
    });
    await q.reload();
    await q.waitForTimeout(400);

    /* The verdict and the arithmetic behind it sit on opposite sides of the
       fold, and deliberately so: "behind pace" is the line you steer by, so
       it is on the face; "Averaging 200.2 lb, down 0.5 a week. Needs 1.5."
       is the evidence for it, and evidence lives behind the press with the
       rest of the evidence. So this pair reads both sides. */
    const detail = async () => {
      if (!await q.$('.mw-body')) {
        const h = await q.$('.mday-weigh [data-mfold]');
        if (h) { await h.click(); await q.waitForTimeout(300); }
      }
      return q.textContent('.mw-body');
    };
    /* The numbers are one line under the goal now (2026-09-23): the average,
       the week, and what the goal needs — said once. */
    t.ok('once there are mornings, the scale gets an opinion',
      /seven-day average/.test(await narr()) && /needs down [\d.]+ a week/.test(await narr()), await narr());
    t.ok('and it is behind pace, because a pound a week is not two — said on the face',
      /weeks? late|days late|no date yet/.test(await narr()), await narr());

    /* ---- a card sent away stays away --------------------------------
     *
     * "Leave it" added a class that set display:none, and did nothing else.
     * The class was written nowhere and read nowhere, so it lasted exactly as
     * long as the element did — and a check, a portion nudge, a weigh-in or an
     * arriving sync all rebuild this region. Blake dismissed the pace card and
     * it was back a tap later, over and over, which reads as the app not
     * listening to him.
     *
     * Reload is the honest test of it: nothing was being stored at all, so
     * anything that redraws from scratch brought it back. */
    const paceCard = () => q.evaluate(() => {
      const el = document.querySelector('.mline.act');
      return el ? el.textContent.slice(0, 40) : null;
    });
    /* The plan this sheet saved sits twenty calories over what the scale now
       says to eat, and twenty is not a decision (MLINE_NEAR): the card says
       stay with it. A hundred over is one, so the target is moved a hundred
       off for the card to have something to ask. */
    await q.evaluate(() => {
      const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
      t2.c += 25;
      localStorage.setItem('bsc.macroTargets', JSON.stringify(t2));
    });
    await q.reload();
    await q.waitForTimeout(500);
    t.ok('the pace card is showing, with a way to send it away',
      !!(await paceCard()) && !!(await q.$('.mline.act [data-mline^="mline:none"]')),
      String(await paceCard()));

    await q.click('.mline.act [data-mline^="mline:none"]');
    await q.waitForTimeout(300);
    t.ok('sending it away takes it off the day', (await paceCard()) === null,
      String(await paceCard()));

    await q.reload();
    await q.waitForTimeout(500);
    t.ok('and it is still gone after everything redraws', (await paceCard()) === null,
      String(await paceCard()));

    /* The other half, and the reason the refusal is keyed to the advice and
       not only to the day: refusing 1,903 is a decision about 1,903. Asserted
       against the stored key rather than by moving the goal and hoping the
       arithmetic lands somewhere useful — pushing the goal around moves the
       card between branches, which would prove something else. A refusal of
       a number that is not today's number must not silence today's card. */
    t.ok('and what it wrote down is the advice, not just the day',
      await q.evaluate(() => {
        const h = JSON.parse(localStorage.getItem('bsc.macroHush') || '{}');
        const k = Object.keys(h)[0];
        return !!k && /^act:\d+$/.test(h[k]);
      }),
      await q.evaluate(() => localStorage.getItem('bsc.macroHush')));
    await q.evaluate(() => {
      const h = JSON.parse(localStorage.getItem('bsc.macroHush'));
      const k = Object.keys(h)[0];
      h[k] = 'act:1';                  // a refusal of some quite different number
      localStorage.setItem('bsc.macroHush', JSON.stringify(h));
    });
    await q.reload();
    await q.waitForTimeout(500);
    t.ok('but advice you have not refused is still entitled to speak',
      !!(await paceCard()), String(await paceCard()));

    /* leave the day clean for everything downstream */
    await q.evaluate(() => localStorage.removeItem('bsc.macroHush'));
    await q.reload();
    await q.waitForTimeout(500);

    /* ---- and the other button has to be SEEN to work -------------------
     *
     * "Eat 1,846" wrote the targets and redrew the card, and the card —
     * computed from the scale alone — came back word for word with the same
     * button on it. Blake: "I hit eat it but nothing happened." It had.
     * Once the plan already eats what the card would ask, the card says so
     * and stops asking. */
    const targetsBefore = await q.evaluate(() => localStorage.getItem('bsc.macroTargets'));
    const eatBtn = await q.$('.mline.act [data-mline^="mline:eat"]');
    t.ok('the pace card is back with an Eat button once the refusal is forgotten', !!eatBtn);
    const askedFor = await q.evaluate(() =>
      Number((document.querySelector('.mline.act [data-mline^="mline:eat"]').dataset.mline.split(':')[2])));
    await q.click('.mline.act [data-mline^="mline:eat"]');
    await q.waitForTimeout(300);
    const took = await q.evaluate(() => {
      const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
      const kcal = 4 * t2.p + 4 * t2.c + 9 * t2.f;
      const line = document.querySelector('.mline');
      return { kcal, text: line ? line.textContent.replace(/\s+/g, ' ').trim() : '',
        stillAsking: !!document.querySelector('[data-mline^="mline:eat"]') };
    });
    t.ok('pressing Eat writes the number into the plan', Math.abs(took.kcal - askedFor) <= 5,
      took.kcal + ' vs ' + askedFor);
    /* The target the card names is the target, to the calorie the grams
       came to — Eat writes grams, so it lands within a few of what it asked —
       rather than the number it would have asked for. */
    t.ok('and the card says it is being eaten, instead of asking again',
      !took.stillAsking && Math.abs(took.kcal - askedFor) <= 5 &&
        new RegExp('Your target: ' + took.kcal.toLocaleString()).test(took.text), took.text.slice(0, 120));

    /* Seventeen calories is not a decision. The tolerance was five, so a
       target a few calories off what the estimate wanted — which drifts a
       little every morning on its own — asked "Use 1,404 / Keep 1,421". Within
       fifty it stays quiet and names the target; a hundred off still asks. */
    const afterEat = await q.evaluate(() => localStorage.getItem('bsc.macroTargets'));
    const nudged = async (dc) => {
      await q.evaluate(([a, d]) => {
        const t2 = JSON.parse(a); t2.c += d;
        localStorage.setItem('bsc.macroTargets', JSON.stringify(t2));
      }, [afterEat, dc]);
      await q.reload();
      await q.waitForTimeout(500);
      return q.evaluate(() => {
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        const line = document.querySelector('.mline');
        return { kcal: 4 * t2.p + 4 * t2.c + 9 * t2.f, need: window.__macroLab.pace().need,
          asking: !!document.querySelector('[data-mline^="mline:eat"]'),
          text: line ? line.textContent.replace(/\s+/g, ' ').trim() : '' };
      });
    };
    const near = await nudged(5);
    t.ok('twenty calories over what it would ask is not asked about, and the target is named as it is',
      Math.abs(near.kcal - near.need) > 5 && Math.abs(near.kcal - near.need) <= 50 && !near.asking &&
        new RegExp('Your target: ' + near.kcal.toLocaleString()).test(near.text), JSON.stringify(near));
    const far = await nudged(25);
    t.ok('a hundred over still is', far.kcal - far.need > 50 && far.asking, JSON.stringify(far));
    /* and put the plan back the way it was, for everything downstream */
    await q.evaluate((tb) => localStorage.setItem('bsc.macroTargets', tb), targetsBefore);
    await q.reload();
    await q.waitForTimeout(500);



    // ---- a favorite never ranks worse for being loved, and wears its star
    await openMeal(q, 'b');
    await pickerList(q);
    await q.waitForTimeout(200);
    /* A recipe from the middle of the ranking. Recipes only, because the line
       below looks it up in window.RECIPES to star it — the list carries
       single foods too now, and a food id finds nothing there. */
    const mid = await q.evaluate(() => {
      const rows = [...document.querySelectorAll('.mpick-row[data-mpx]')]
        .filter((r) => !/^f:/.test(r.dataset.mpick));
      const at = Math.min(7, rows.length - 1);
      return { id: rows[at].dataset.mpick, at: at };
    });
    await q.goBack();
    await q.waitForTimeout(250);
    await q.evaluate((id) => {
      const r = window.RECIPES.find((x) => String(x.id) === id);
      window.Store.toggleFav(r.id);
    }, mid.id);
    await q.waitForTimeout(200);
    await openMeal(q, 'b');
    await pickerList(q);
    await q.waitForTimeout(200);
    const after = await q.evaluate((id) => {
      const rows = [...document.querySelectorAll('.mpick-row[data-mpx]')]
        .filter((r) => !/^f:/.test(r.dataset.mpick));
      const at = rows.findIndex((r) => r.dataset.mpick === id);
      return { at, starred: at >= 0 && rows[at].textContent.indexOf('★') >= 0 };
    }, mid.id);
    t.ok('a favorite moves up the picker, or at worst holds its place',
      after.at >= 0 && after.at <= mid.at, after.at + ' from ' + mid.at);
    t.ok('and wears its star in the list', after.starred);
    await q.goBack();
    await q.waitForTimeout(250);

    // ---- Fill my day drafts every empty meal as one coherent combination
    /* Fill picks at random from the top three fits, so one press is one draw
       and a check on it was a dice roll: about one run in thirty drew a day
       that finished its protein short and failed CI on a change that never
       touched Fill. So the spread is measured first, over sixty drafted days
       on the bench's own hooks — the same seeds every run — and then the one
       press below is seeded too, so it is the same day every run. */
    const mulberry = `(a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }`;
    const spread = await q.evaluate((src) => {
      const seeded = new Function('return ' + src)(), real = Math.random, lab = window.__macroLab;
      const T = lab.targets(), out = { short: 0, worst: 1, notProtein: [] };
      for (let i = 1; i <= 60; i++) {
        Math.random = seeded(i); lab.forget(); lab.draft();
        const d = lab.read(), r = d.tot.p / T.p;
        if (r < 0.88) out.short++;
        out.worst = Math.min(out.worst, r);
        d.meals.forEach((m) => m.items.forEach((it) => {
          if (it.why === 'p' && 4 * it.p < 0.3 * it.kcal) out.notProtein.push(it.name);
        }));
      }
      Math.random = real; lab.forget();
      return out;
    }, mulberry);
    t.ok('over sixty drafted days, a topper added for protein is always a protein food',
      spread.notProtein.length === 0, JSON.stringify(spread.notProtein.slice(0, 5)));
    t.ok('and no more than three of them finish under 88% of the protein, none under 75%',
      spread.short <= 3 && spread.worst >= 0.75, spread.short + ' short, worst ' + Math.round(100 * spread.worst) + '%');
    await toDay(q);
    await q.evaluate((src) => { window.__realRandom = Math.random; Math.random = new Function('return ' + src)()(1); }, mulberry);
    await q.click('#macroFill');
    await q.evaluate(() => { Math.random = window.__realRandom; });
    await q.waitForTimeout(300);
    const drafted = await q.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      // days are lazily keyed, and a tight budget can leave a meal unfilled
      const items = ['b', 'l', 'd', 's'].map((k) => day[k] || []);
      const ids = [].concat(...items).map((i) => String(i.id));
      const tot = { p: 0, f: 0, c: 0 };
      /* Recipes only. A drafted day can carry a topper — a single food, which
         lives in the food table and not in RECIPES — so a lookup that assumed
         every id was a recipe would throw the moment one appeared. The totals
         below therefore understate a topped-up day, which is safe: every
         assertion on them is a floor on protein or a ceiling on fat. */
      ids.forEach((id, n) => {
        const r = window.RECIPES.find((x) => String(x.id) === id);
        if (!r || !r.macro) return;
        const x = [].concat(...items)[n].x;
        tot.p += r.macro.p * x; tot.f += r.macro.f * x; tot.c += r.macro.c * x;
      });
      return {
        perSlot: items.map((i) => i.length),
        unique: new Set(ids).size === ids.length,
        tot,
        foods: ids.filter((id) => id.indexOf('f:') === 0).length,
        bars: [...document.querySelectorAll('[data-macro]')].map((row) => {
          const m = row.querySelector('.mb-num').textContent
            .replace(/,/g, '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
          return { m: row.dataset.macro, have: +m[1], want: +m[2] };
        }),
        fillMode: document.getElementById('macroFill').dataset.mode,
      };
    });
    /* EVERY meal, not most of them.
     *
       This asserted "at least three of four" and passed for months over a
       real bug: the room check sat inside the fill loop and read the day's
       remaining live, so the dishes Fill had just drafted were the reason the
       next meal got refused — and meals are walked in order, so it was always
       the last one. Measured over thirty runs, a five-meal day came back with
       an empty meal 47% of the time. The draft is resized by mBalanceDay a
       few lines later, so those dishes were never final and never a reason to
       refuse anybody.
       An assertion loose enough to accommodate the bug is how the bug got to
       stay. A day that starts empty gets every meal drafted. */
    t.ok('every meal on the plan gets something, not just most of them',
      drafted.perSlot.every((n) => n >= 1), drafted.perSlot.join(','));
    t.ok('and never the same recipe twice in a day', drafted.unique);
    t.ok('the draft chases the protein target',
      drafted.tot.p >= 0.6 * planP, Math.round(drafted.tot.p) + ' of ' + planP);
    t.ok('without blowing the fat budget wide open',
      drafted.tot.f <= planF + 30, Math.round(drafted.tot.f) + ' vs ' + planF);
    /* It stops SAYING Fill exactly when there is nothing left to draft — and
       says the next useful thing instead of going dead, which is the whole
       point of merging the tick into it. Fill stops once a meal's remaining
       budget is under a hundred calories, so on a tight plan it can honestly
       leave the last one empty, and then the button is rightly still Fill.
       Asserting "always done after Fill" made this a coin toss on which
       meals the draft happened to reach. */
    t.ok('the button stops offering to fill exactly when every meal has something',
      (drafted.fillMode !== 'fill') === drafted.perSlot.every((n) => n >= 1),
      'mode=' + drafted.fillMode + ' slots=' + drafted.perSlot.join(','));

    /* One press has to produce a day you could actually eat to. Four dishes
       sized against their own shares land the day near the target but not on
       it, so Fill settles the portions and then closes what is left with a
       single food. Judged against the app's OWN target for the day, which is
       the cycled one — the base plan is not what any single day is aiming at.
       The tolerance is a real day's worth of slack, not a rounding error. */
    const kcalBar = drafted.bars.find((b) => b.m === 'kcal');
    const pBar = drafted.bars.find((b) => b.m === 'p');
    t.ok('a drafted day lands on the day\'s own calorie target',
      Math.abs(kcalBar.have - kcalBar.want) <= kcalBar.want * 0.10,
      kcalBar.have + ' of ' + kcalBar.want);
    t.ok('and does not leave the protein behind to get there',
      pBar.have >= pBar.want * 0.88, pBar.have + ' of ' + pBar.want + ' g');
    /* A topper finishes a day; it does not become the day. */
    t.ok('and tops up with at most a couple of single foods',
      drafted.foods <= 2, drafted.foods + ' foods');

    /* Only the empty meals are drafted — what you placed is yours. Recorded
       per meal that actually has something, since a tight plan can leave one
       of them empty and that is not this assertion's business. */
    const keepIds = await q.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      const out = {};
      ['b', 'd', 's'].forEach((k) => {
        if ((day[k] || []).length) out[k] = String(day[k][0].id);
      });
      return out;
    });
    /* Remove is in the food's ⋯ menu on lunch's own screen (RP-style meal,
       2026-10-04), and Fill is back on the day. */
    await openMeal(q, 'l');
    await openRow(q, 'l:0');
    await q.click('[data-mfmenu="l:0"]');
    await q.waitForTimeout(150);
    await q.click('[data-mdel="l:0"]');
    await q.waitForTimeout(200);
    await toDay(q);
    await q.click('#macroFill');
    await q.waitForTimeout(300);
    /* Lunch gets a dish again. It may also get a single food on top: the
       topper finishes the DAY and lands on whichever meal is shortest, which
       can be the one just refilled. Asserting exactly one item there made
       this pass or fail on Fill's random pick from the top three. */
    const refill = await q.evaluate((keep) => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      const dishes = (day.l || []).filter((it) => String(it.id).indexOf('f:') !== 0);
      return { ok: dishes.length === 1 && Object.keys(keep).every(
        (k) => (day[k] || []).length && String(day[k][0].id) === keep[k]),
        l: (day.l || []).map((it) => String(it.id)), keep };
    }, keepIds);
    t.ok('refilling touches only the meal that was emptied', refill.ok, JSON.stringify(refill));

    await q.context().close();

    /* Fill is an offer to build out the EMPTY meals. It was resizing the full
       ones too: a hand-placed 1,139 kcal Slow-Cooker Pulled Beef on dinner at
       one serving came back at ×0.25 after a single press, and the day then
       read 184/180 P in green while being some 850 kcal wrong. Nothing could
       tell whose a plate was — every free-list frees whatever is neither
       eaten nor locked — so Fill signs its own work now and asks only for
       that back.
     *
       The dish is chosen from the data rather than named, and the assertion
       is that the portion is UNCHANGED, not that it is any particular number:
       a literal would pass against an app that had stopped solving at all. */
    const mine = await t.fresh();
    const heavy = await mine.evaluate(() => {
      const r = window.RECIPES.filter((x) => x.macro && x.macro.kcal > 700)
        .sort((a, b) => b.macro.kcal - a.macro.kcal)[0];
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays',
        JSON.stringify({ [k]: { b: [], l: [], d: [{ id: r.id, x: 1, eaten: 0 }], s: [] } }));
      return { id: r.id, kcal: r.macro.kcal };
    });
    await mine.reload();
    await mine.waitForTimeout(400);
    await mine.click('.tab[data-view="macros"]');
    await mine.waitForTimeout(300);
    await mine.click('#macroFill');
    await mine.waitForTimeout(900);
    const kept = await mine.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      return { x: day.d[0].x, by: day.d[0].by,
        others: ['b', 'l', 's'].reduce((n, k) => n + (day[k] || []).length, 0) };
    });
    t.ok('Fill leaves a plate you placed by hand at the portion you placed it',
      kept.x === 1, JSON.stringify({ heavy: heavy.kcal, after: kept.x }));
    t.ok('and does not sign it, because it is not Fill’s',
      kept.by === undefined, String(kept.by));
    /* The other half: a fix that simply stopped the solver would pass the two
       above and break Fill. */
    t.ok('and still fills every empty meal around it',
      kept.others >= 3, String(kept.others));

    /* Rebalance is deliberately NOT narrowed. Pressing ⚖ is asking the
       machine to move things; answering "only my own" would be refusing the
       request. This is what stops the fix above from growing too broad. */
    await mine.click('#macroRebal');
    await mine.waitForTimeout(700);
    const rebal = await mine.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      return days[Object.keys(days)[0]].d[0].x;
    });
    t.ok('but Rebalance, which you pressed, may still move it',
      rebal !== 1, 'x after rebalance: ' + rebal);

    /* Bodyweight was stored twice and the two disagreed: a falling weigh-in
       log, and a `lb` in the profile that only the plan sheet has ever
       written. Every target built on bodyweight was worked out against the
       stale one and nothing said so.
     *
       Asserted differentially rather than against a number: two pages with
       the SAME profile weight and different logs must produce different
       plans, and the heavier log the higher protein. A literal here would
       pass against an app that had stopped reading the scale at all, which
       is the whole bug. */
    const sotPage = async (lbNow) => {
      const pg = await t.fresh();
      await pg.evaluate((lb) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const w = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          w[d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())] = lb;
        }
        localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut1', goalLb: 0, goalBy: '',
          workouts: 4, steps: 8000, train: ['mo', 'we', 'fr'] }));
        localStorage.removeItem('bsc.macroTargets');
      }, lbNow);
      await pg.reload();
      await pg.waitForTimeout(350);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      await openPlan(pg);
      await pg.waitForTimeout(350);
      return pg;
    };
    const planBoxes = (pg) => pg.evaluate(() =>
      ['mtP', 'mtF', 'mtC'].map((id) => Number((document.getElementById(id) || {}).value) || 0));

    const lightLog = await sotPage(150);
    const heavyLog = await sotPage(240);
    const lightPlan = await planBoxes(lightLog);
    const heavyPlan = await planBoxes(heavyLog);
    t.ok('the plan is built on the scale, not the weight typed into the sheet',
      lightPlan[0] !== heavyPlan[0],
      'protein light ' + lightPlan[0] + ' vs heavy ' + heavyPlan[0] + ' (profile says 205 in both)');
    t.ok('and it follows the scale the right way round',
      heavyPlan[0] > lightPlan[0], heavyPlan[0] + ' > ' + lightPlan[0]);

    /* Two boxes for one number is how they came to disagree, so once the log
       can answer, the sheet states it instead of asking again. */
    const scaleSot = await lightLog.evaluate(() => {
      const rows = [...document.querySelectorAll('.mtl-row')]
        .map((r) => r.textContent.replace(/\s+/g, ' ').trim());
      return { row: rows.find((x) => /weigh/i.test(x)),
        input: !!document.getElementById('mtLb'),
        stored: (JSON.parse(localStorage.getItem('bsc.macroProfile')) || {}).lb };
    });
    t.ok('the sheet states the weight from the log rather than asking for it again',
      !scaleSot.input && /150/.test(scaleSot.row), JSON.stringify(scaleSot));

    /* Save rebuilt the profile from the DOM over a bare setItem, so it
       silently dropped everything the sheet has no box for — the training
       days were being lost on every save, and the fallback weight was about
       to join them now that its box is gone.
     *
       The weight it keeps is the LOG'S, not the stale typed one. The absent
       box falls back to mReadProfile, which is where what-the-weight-is is
       defined; falling back to the raw store instead wrote 205 back over a
       log that had been saying 150 for a fortnight, and the number the sheet
       had just been built from was not the number Save committed. */
    await lightLog.click('[data-mtarg="save"]');
    await lightLog.waitForTimeout(600);
    const kept2 = await lightLog.evaluate(() => {
      const pr = JSON.parse(localStorage.getItem('bsc.macroProfile')) || {};
      return { lb: pr.lb, train: (pr.train || []).join(','), steps: pr.steps };
    });
    t.ok('and Save keeps what the sheet has no box for, at the weight the log states',
      kept2.train === 'mo,we,fr' && kept2.lb === 150, JSON.stringify(kept2));

    /* ---- and the sheet never slips back to the stale weight ---------------
     * The weight box goes away once the log can answer — so mtProfileFromDom
     * has no #mtLb to read and falls back. Falling back to the raw store got
     * the very number the log supersedes: the sheet OPENED on the scale's
     * plan and then flipped to the stale one the moment any other control was
     * touched, with the weight row still crediting the weigh-ins underneath
     * it. Age is the control used here because it is the one least related to
     * weight on the sheet — changing it and changing it straight back has to
     * leave the proposal exactly where it started. */
    /* ---- a comma is not a weight ------------------------------------------
     * The box was type=number, and a number input EATS a comma before any
     * script sees it: "80,5" arrived as "805", a real number that passed
     * every guard and stored eight hundred and five pounds — doubling the
     * day's calories off a seven-day average that had just moved four hundred
     * pounds. Blake does not write weights with commas, so a comma is not a
     * weight to interpret; it is a keystroke that means the entry is wrong.
     * It can only be refused if it survives to be seen, which is why the box
     * is text with a decimal keypad rather than a number.
     *
     * Typed with real keys, because the entire bug lives in what the browser
     * does to a keystroke before the value is ever read. fill() sets the
     * value directly and would prove nothing. */
    /* Built here rather than borrowed from sotPage, which leaves the plan
       sheet open over the box this is about. */
    const wPage = await t.fresh({ viewport: { width: 412, height: 915 } });
    await wPage.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const w = {};
      for (let i = 9; i >= 1; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        w[d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())] = 205;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
        inch: 11, lb: 205, act: 1.375, goal: 'cut1', goalLb: 175, goalBy: '',
        workouts: 4, steps: 8000 }));
    });
    await wPage.reload();
    await wPage.waitForTimeout(400);
    await wPage.click('.tab[data-view="macros"]');
    await wPage.waitForTimeout(400);
    const wState = () => wPage.evaluate(() => {
      const d = new Date(), q = (n) => (n < 10 ? '0' : '') + n;
      const key = d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate());
      return { box: (document.getElementById('mWeight') || {}).value,
        note: ((document.getElementById('mWeightNote') || {}).textContent || '').trim(),
        stored: (JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}'))[key] };
    });
    const wType = async (txt) => {
      await wPage.click('#mWeight');
      await wPage.evaluate(() => { const e = document.getElementById('mWeight'); e.value = ''; });
      await wPage.keyboard.type(txt);
      await wPage.waitForTimeout(850);
    };
    await wType('185');
    const wGood = await wState();
    t.ok('a plain weight is taken', wGood.stored === 185 && !wGood.note, JSON.stringify(wGood));
    await wType('80,5');
    const wComma = await wState();
    t.ok('a comma is shown back to you rather than swallowed',
      wComma.box === '80,5', JSON.stringify(wComma));
    t.ok('and it is refused, not read as eight hundred and five',
      !!wComma.note && wComma.stored === 185, JSON.stringify(wComma));
    await wType('205.4');
    const wPoint = await wState();
    t.ok('a point still works', wPoint.stored === 205.4, JSON.stringify(wPoint));
    await wPage.context().close();

    const slip = await sotPage(150);
    /* The ledger, not the fold's handle: the weight moved there when the plan
       screen was rearranged, and it is the ledger that is built from the
       profile's resolved lb — which is the value this drift was in. */
    const whoOf = (pg) => pg.evaluate(() =>
      ((document.getElementById('mtFacts') || {}).textContent || '').replace(/\s+/g, ' ').trim());
    const openedOn = await planBoxes(slip);
    const whoOpened = await whoOf(slip);
    /* The editor is folded away while there is a plan to show, so the boxes
       are reached the way a thumb reaches them: by pressing Edit. */
    await slip.click('[data-mtedit]');
    await slip.waitForTimeout(200);
    await slip.fill('#mtAge', '44');
    await slip.waitForTimeout(300);
    await slip.fill('#mtAge', '43');
    await slip.waitForTimeout(300);
    const settledOn = await planBoxes(slip);
    const whoSettled = await whoOf(slip);
    t.ok('touching another control does not swap the scale weight for the stale one',
      whoSettled.indexOf('150') >= 0 && whoSettled.indexOf('205') < 0,
      'ledger: "' + whoOpened + '" -> "' + whoSettled + '"');
    t.ok('so the plan it proposes is still the plan it opened on',
      openedOn.join() === settledOn.join(), openedOn.join() + ' -> ' + settledOn.join());
    await slip.context().close();
  },
});
