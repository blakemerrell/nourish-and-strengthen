/* A week rather than one day seven times, salt in the arithmetic, a meal's
 * tray and its sheet, the slack from a finished meal going to the meals ahead, a
 * skipped meal handing its share over, and the verb an empty meal offers.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, goDay, stepDay, openPlan, openMeal, closeSheet, openTray, openRow } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — salt, a meal\'s tray, and handing slack on',
  async suite(t) {
    /* ---- a week, not the same day seven times --------------------------- */
    const wk = await t.fresh();
    await wk.click('.tab[data-view="macros"]');
    await wk.waitForTimeout(180);
    const drafted3 = [];
    for (let d = 0; d < 3; d++) {
      await wk.click('#macroFill');
      await wk.waitForTimeout(320);
      drafted3.push(await wk.evaluate(() => {
        const D = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        const k = Object.keys(D).sort();
        const day = D[k[k.length - 1]] || {};
        const out = [];
        ['b', 'l', 'd', 's'].forEach((sk) => (day[sk] || []).forEach((it) => out.push(String(it.id))));
        return out;
      }));
      if (d < 2) { await stepDay(wk, 1); await wk.waitForTimeout(70); }
    }
    /* Fill knew only about the day in front of it, so seven drafted days ran
       to nineteen distinct dishes and served one of them four times. A cook
       notices that long before they notice a macro. Consecutive days must not
       share a plate — unless the section is too thin to offer another, which
       is why this asks about the days either side and not about the week. */
    const sharedAdjacent = drafted3[0].filter((x) => drafted3[1].indexOf(x) >= 0)
      .concat(drafted3[1].filter((x) => drafted3[2].indexOf(x) >= 0));
    t.ok('two days running are not the same day twice',
      sharedAdjacent.length === 0, sharedAdjacent.join(',') || 'nothing shared');
    t.ok('and each of them still got fed',
      drafted3.every((d) => d.length >= 3), drafted3.map((d) => d.length).join(','));

    /* ---- salt is part of the arithmetic now ----------------------------- */
    /* On a hard cut, and only there. The default plan is roomy enough that
       the chooser never has to reach for the salted end of the book, so a day
       drafted against it proves nothing — both assertions below passed with
       the guards deliberately removed until this profile was put in front of
       them. A hard cut is where protein crowds a day small enough that the
       cheapest way to hit it is a salty one. */
    await wk.evaluate(() => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55,
        goal: 'cut2', goalLb: 0, goalBy: '', workouts: 4, steps: 8000 }));
      localStorage.removeItem('bsc.macroTargets');
      localStorage.removeItem('bsc.macroDays');
    });
    await wk.reload();
    await wk.waitForTimeout(380);
    await wk.click('.tab[data-view="macros"]');
    await wk.waitForTimeout(180);
    await openPlan(wk);
    await wk.waitForTimeout(280);
    await wk.evaluate(() => {
      const g = document.querySelector('[data-mtgoal="cut2"]');
      if (g && !g.disabled) g.click();
    });
    await wk.waitForTimeout(160);
    await wk.evaluate(() => { const u = document.querySelector('[data-mtuse]'); if (u) u.click(); });
    await wk.waitForTimeout(160);
    await wk.click('[data-mtarg="save"]');
    await wk.waitForTimeout(320);
    const hardCut = await wk.evaluate(() =>
      JSON.parse(localStorage.getItem('bsc.macroTargets') || 'null'));
    t.ok('the day under test really is a hard cut',
      hardCut && hardCut.p >= 190, JSON.stringify(hardCut));
    for (let d = 0; d < 4; d++) {
      await wk.click('#macroFill');
      await wk.waitForTimeout(320);
      if (d < 3) { await stepDay(wk, 1); await wk.waitForTimeout(70); }
    }

    /* Chasing protein, the portion solver took a chicken salad carrying
       fourteen hundred milligrams a serving to four servings: five and a half
       grams of sodium out of one bowl, twice the day's ceiling, every macro
       bar green. Sodium was not in the penalty it was minimising, so nothing
       objected. No single plate on a drafted day may carry the whole day's
       ceiling by itself. */
    const worst = await wk.evaluate(() => {
      const D = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      let top = 0;
      Object.keys(D).forEach((k) => ['b', 'l', 'd', 's'].forEach((sk) => (D[k][sk] || []).forEach((it) => {
        const r = window.RECIPES.find((x) => String(x.id) === String(it.id));
        if (r && r.macro) top = Math.max(top, r.macro.na * it.x);
      })));
      return Math.round(top);
    });
    t.ok('no one plate on a drafted day carries the whole day\'s salt',
      worst < 2300, worst + ' mg on a single plate');

    /* A topper is a spoonful to finish a day. A cup of soy sauce is a hundred
       and thirty-five calories at fifteen grams of protein per hundred —
       denser than chicken breast on paper — and fourteen thousand milligrams
       of sodium, and it scored beautifully until the ceiling was written
       down.
     *
       Opportunistic, and known to be: a topper is only placed when the dishes
       leave a gap worth closing, so some drafts carry none and this passes by
       having nothing to judge. It is here to catch the regression when it
       does fire, not to prove it cannot. The guard it watches is a stated
       ceiling in the code, not an emergent property to be sampled for. */
    const topSalt = await wk.evaluate(() => {
      const D = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const N = (window.Nutrition || {}).FOODS || {};
      /* A second copy of mFoodServing, and it has to track it: the app chose
         to count cheddar in whole cheeses until the table's own stated
         portion was honoured, and this copy went on pricing the old unit and
         reporting salt for a serving nobody was eating. Where the table
         states the unit, the table wins — here as there. */
      const serve = (f) => {
        if (f.def && f.def.unit && f.g && f.g[f.def.unit]) return f.g[f.def.unit];
        const u = f.g || {}; let best = null;
        Object.keys(u).forEach((k2) => {
          const g = u[k2]; if (!g) return;
          const miss = Math.abs((f.kcal || 0) * g / 100 - 130) + (k2 === 'each' ? -25 : 0);
          if (!best || miss < best.miss) best = { g, miss };
        });
        return best ? best.g : 100;
      };
      let top = 0;
      Object.keys(D).forEach((k) => ['b', 'l', 'd', 's'].forEach((sk) => (D[k][sk] || []).forEach((it) => {
        const id = String(it.id);
        if (id.indexOf('f:') !== 0 || id.indexOf('f:my:') === 0) return;
        const f = N[id.slice(2)]; if (!f) return;
        top = Math.max(top, (f.na || 0) * serve(f) / 100 * it.x);
      })));
      return Math.round(top);
    });
    t.ok('and a topper never brings a condiment\'s worth of salt with it',
      topSalt <= 400, topSalt + ' mg from a single food');

    await wk.context().close();

    /* ---- the meal on the day: a tray ----------------------------------------
     * Trays and the meal sheet (Blake, 2026-10-04): the day is small trays —
     * the meal's tick, its name, its calories against its share, its foods as
     * lines — and a tap anywhere on a tray but the tick opens that meal's
     * sheet, the one place food is added or changed. This section used to
     * guard the fold (a meal folded to a card, opened as its own screen); the
     * claims underneath it carry over: every meal has one wide door, the tick
     * is the only other thing on it, nothing on it wraps, and the door is
     * where a thumb lands. Mockup:
     * https://claude.ai/artifact/SseR1TPa4JAFNanYYsGP4k */
    const fold = await t.fresh({ viewport: { width: 375, height: 720 } });
    await fold.click('.tab[data-view="macros"]');
    await fold.waitForTimeout(200);
    await openPlan(fold);
    await fold.waitForTimeout(200);
    await fold.click('[data-mtarg="save"]');
    await fold.waitForTimeout(250);
    await fold.click('#macroFill');
    await fold.waitForTimeout(600);
    /* Every meal, an empty one too, is a tray with the same door into it,
       and no plate's keys are on the day until its line is opened
       (tests/daylines.test.js). */
    t.ok('every meal arrives as a tray with its door, an empty one too, and no plate’s keys on the day until one is opened',
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mslot')].every((s) =>
        s.classList.contains('mtray') &&
        s.querySelectorAll('.mtray-b[data-mopen]').length === 1)) &&
        await fold.evaluate(() => document.querySelectorAll('#macroSlots .mstep, #macroSlots .mrow, #macroSlots [data-mfmenu], #macroSlots [data-mstep]').length === 0),
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mslot')].map((s) =>
        (s.querySelector('.mtray-n') || {}).textContent + ':' + s.className +
        (s.querySelector('.mtray-b[data-mopen]') ? ' door' : ' none')).join(' | ')));
    /* The door holds the pills, under the meal's name (since 2026-10-10 the
       name is the card's head, which steps its views). Since 2026-10-08 each food under
       it is a line of its own that stands above the door's reach
       (tests/daylines.test.js): a press on a food is the food's. The door
       still does not reach the tray's left edge and should not: the dot
       lives out there, and pressing the dot marks the meal eaten. */
    /* Each line is probed in view, one at a time, with the day's card given
       a moment to fold as it does under a scrolling thumb: unfolded, it would
       sit over the line, and the bar along the bottom covers what is under
       it. */
    const doorOk = await fold.evaluate(() => {
      const b = document.querySelector('#macroSlots .mtray-b[data-mopen]');
      if (!b) return false;
      const tray = b.closest('.mtray');
      return b.getBoundingClientRect().width >= tray.getBoundingClientRect().width * 0.7 && !!tray.querySelector('.mtray-hd .mtray-n') &&
        !!b.querySelector('.mtray-caps') && tray.querySelectorAll('.mtray-f').length > 0;
    });
    const firstTray = '#macroSlots .mtray:has(.mtray-b[data-mopen])';
    const presses = [];
    for (let i = 0; i < await fold.evaluate((s) => document.querySelector(s).querySelectorAll('.mtray-f').length, firstTray); i++) {
      await fold.evaluate((a) => document.querySelector(a[0]).querySelectorAll('.mtray-f')[a[1]].scrollIntoView({ block: 'center', behavior: 'instant' }), [firstTray, i]);
      await fold.waitForTimeout(300);
      presses.push(await fold.evaluate((a) => {
        const f = document.querySelector(a[0]).querySelectorAll('.mtray-f')[a[1]];
        const g = f.getBoundingClientRect();
        const hit = document.elementFromPoint(g.right - 60, g.top + g.height / 2);
        return { own: !!hit && hit.closest('.mtray-f') === f, hit: hit ? hit.className : 'none' };
      }, [firstTray, i]));
    }
    t.ok('and the door carries the meal’s pills under its name, each food under it a line of its own',
      doorOk && presses.length > 0 && presses.every((x) => x.own), JSON.stringify({ doorOk, presses }));
    /* And the tray carries nothing else to press: the door, the meal's tick,
       its name (which steps its views, or on an empty meal opens it) and its
       drawings (+, the scale, ⊘), and each food's name (the door to the food
       or the recipe), its line (which opens it) and its own tick. */
    t.ok('and the tray carries nothing to press but the door, the dot, its name and drawings, and each food’s name, line and tick',
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')]
        .every((h) => [...h.querySelectorAll('button')].every((b) =>
          b.classList.contains('mtray-b') || b.classList.contains('mday-dot') ||
          (b.classList.contains('mtray-hd') && !!(b.dataset.mview || b.dataset.mopen)) ||
          (b.classList.contains('mtray-ib') && !!(b.dataset.mopen || b.dataset.mtry || b.dataset.mbal || b.dataset.mskipask)) ||
          (b.classList.contains('mtray-fn') && !!(b.dataset.open || b.dataset.mfood)) ||
          (b.classList.contains('mfl-amt') && !!b.dataset.mamt)) &&
          [...h.querySelectorAll('input')].every((i) => i.classList.contains('mitem-ate') && !!i.dataset.meat))),
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')]
        .map((h) => [...h.querySelectorAll('button, input')].map((b) => b.className.split(' ')[0]).join('+'))
        .join(' | ')));
    /* Nothing on the tray wraps but a long name: the meal's name is one line,
       its pills one row, and each food's measure and grams one line (a cup's
       mL sits under the cup by design), on a line a thumb tall. On a card
       showing its Foods (2026-10-10), a food's calories and its P F C are
       one line each instead. */
    t.ok('and nothing on a tray wraps but a long food name, and each food’s line is a thumb tall',
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')].every((c) => {
        const caps = [...c.querySelectorAll('.mtray-caps .mcap')].map((x) => x.getBoundingClientRect());
        return c.querySelector('.mtray-n').getBoundingClientRect().height <= 22 &&
          caps.every((r) => Math.abs(r.top - caps[0].top) <= 1 && r.height <= 30) &&
          [...c.querySelectorAll('.mtray-f:not(.mtray-none)')].every((f) => f.classList.contains('mtray-cl')
            ? f.getBoundingClientRect().height >= 44 && f.querySelector('.mtray-ck').getBoundingClientRect().height <= 24 &&
              f.querySelector('.mtray-cm').getBoundingClientRect().height <= 24
            : f.querySelector('.mfl-r').getBoundingClientRect().height >= 44 &&
              f.querySelector('.mfl-amt .mtray-fm b').getBoundingClientRect().height <= 24 &&
              f.querySelector('.mfl-amt em').getBoundingClientRect().height <= 24);
      })),
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')]
        .map((c) => 'head ' + Math.round(c.querySelector('.mtray-hr').getBoundingClientRect().height) + ' lines [' +
          [...c.querySelectorAll('.mtray-f:not(.mtray-none)')].map((m) => Math.round(m.getBoundingClientRect().height)).join(',') + ']').join('  ')));
    /* The whole tray is the door. Probed at 60% ACROSS THE TRAY, which is
       away from the name: measuring from the name's own box would land
       inside the button either way and pass against the bug. */
    const headGeo = await fold.evaluate(() => {
      const h = document.querySelector('#macroSlots .mtray').getBoundingClientRect();
      const b = document.querySelector('#macroSlots .mtray .mtray-b').getBoundingClientRect();
      const name = (document.querySelector('#macroSlots .mtray .mtray-n') || {}).textContent;
      return { rowW: Math.round(h.width), headW: Math.round(b.width), headH: Math.round(b.height),
        x: h.left + h.width * 0.6, y: b.top + 12, name: name };
    });
    t.ok('the door fills the tray rather than sitting in it',
      headGeo.headW > headGeo.rowW * 0.7, JSON.stringify(headGeo));
    await fold.mouse.click(headGeo.x, headGeo.y);
    await fold.waitForTimeout(400);
    const opened = await fold.evaluate(() => {
      const s = document.querySelector('#modalRoot .msheet');
      return { sheet: !!s, name: s ? (s.querySelector('.msh-t .mslot-name') || {}).textContent : '',
        trays: document.querySelectorAll('#macroSlots .mtray').length };
    });
    t.ok('so a thumb landing well away from the word still opens the meal, in its sheet',
      opened.sheet && opened.name === headGeo.name, JSON.stringify(opened));

    /* The sheet's head: the meal's tick at the left, then its name, then the
       ⋯ alone at the right edge. It carried the scales and × as well until
       2026-10-05, when Balance and Done went down to the tray along the
       sheet's bottom, under the thumb (Blake: "so it's not at the very top
       where my thumb has to stretch to reach it"). Adding is the picker in
       the sheet itself, its search box a line of its own. */
    const headRow = await fold.evaluate(() => {
      const h = document.querySelector('#modalRoot .msheet .msh-h');
      if (!h) return null;
      const rb = h.getBoundingClientRect(), cs = getComputedStyle(h);
      const k = [...h.children].filter((c) => !c.classList.contains('mfood-menu')).map((c) => {
        const r = c.getBoundingClientRect();
        return { c: c.className.split(' ').slice(0, 2).join('.'), l: c.getAttribute('aria-label') || '',
          x: Math.round(r.x - rb.x), w: Math.round(r.width), h: Math.round(r.height),
          right: Math.round(rb.right - r.right) };
      });
      return { pad: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight),
        gap: parseFloat(cs.columnGap) || 0, kids: k };
    });
    const dotK = headRow && headRow.kids[0];
    t.ok('the sheet’s head starts with the meal’s tick, a thumb square, at its left edge',
      !!dotK && /mday-dot/.test(dotK.c) && dotK.w >= 44 && dotK.h >= 44 && dotK.x <= headRow.pad + 1,
      JSON.stringify(headRow));
    t.ok('and only the ⋯ sits at the right edge, Balance and Done in the tray below, with the search box a line of its own',
      !!headRow && headRow.kids.length === 3 && /msh-i/.test(headRow.kids[2].c) &&
        headRow.kids[2].right <= headRow.padR + 1 &&
        await fold.evaluate(() => !!document.querySelector('#modalRoot .msheet .msh-tray .msh-bal') &&
          !!document.querySelector('#modalRoot .msheet .msh-tray .msh-done')) &&
        await fold.evaluate(() => { const f = document.querySelector('#modalRoot .msheet #mpFind');
          const s = document.querySelector('#modalRoot .msheet');
          return !!f && f.closest('.mp-find').getBoundingClientRect().width >= s.getBoundingClientRect().width - 48; }),
      JSON.stringify(headRow));

    /* On the narrowest phone in common use. Blake (2026-09-27): "get all the
       buttons on the food tag into a single row", and then "Just use icons".
       The head's controls are still drawings alone on one row, each named for
       a screen reader, each a thumb square. The meal's verbs behind the ⋯ are
       an icon WITH a word each; they keep the thumb's height and stay inside
       their menu. */
    await fold.setViewportSize({ width: 360, height: 720 });
    await fold.waitForTimeout(150);
    await fold.click('#modalRoot .msheet [data-mmenu]');
    await fold.waitForTimeout(250);
    const narrow = await fold.evaluate(() => {
      const h = document.querySelector('#modalRoot .msheet .msh-h');
      const bs = [...h.querySelectorAll('button')].filter((b) => !b.closest('.mfood-menu'));
      const menu = document.querySelector('#modalRoot .msheet .msh-menu');
      const mb = menu ? menu.getBoundingClientRect() : null;
      const ms = menu ? [...menu.querySelectorAll('button')] : [];
      return {
        n: bs.length,
        rows: new Set(bs.map((b) => { const r = b.getBoundingClientRect(); return Math.round((r.top + r.height / 2) / 8); })).size,
        /* × is a glyph, not a word */
        worded: bs.filter((b) => b.textContent.trim().length > 1).length,
        unnamed: bs.filter((b) => !/\w/.test(b.getAttribute('aria-label') || '') ||
          (!b.classList.contains('mday-dot') && !b.classList.contains('sheet-x') && !b.querySelector('svg'))).length,
        offThumb: bs.filter((b) => { const r = b.getBoundingClientRect(); return r.width < 43 || r.height < 43; }).length,
        menu: ms.map((b) => { const r = b.getBoundingClientRect();
          return { t: b.textContent.trim(), h: Math.round(r.height), svg: !!b.querySelector('svg'),
            inside: r.left >= mb.left - 1 && r.right <= mb.right + 1 }; }),
      };
    });
    t.ok('a meal’s verbs are drawings on one row at 360px, each a thumb wide and named',
      narrow.n >= 2 && narrow.rows === 1 && narrow.worded === 0 && narrow.unnamed === 0 && narrow.offThumb === 0 &&
        narrow.menu.length >= 2 && narrow.menu.every((m) => m.t && m.svg && m.h >= 44 && m.inside),
      JSON.stringify(narrow));
    await fold.setViewportSize({ width: 375, height: 720 });
    await fold.waitForTimeout(150);
    /* The phone's back comes home to the day: the sheet is a history entry. */
    await fold.goBack();
    await fold.waitForTimeout(400);
    t.ok('and the phone’s back gesture brings the day back, every meal a tray',
      await fold.evaluate(() => !document.querySelector('#modalRoot .msheet') &&
        document.querySelectorAll('#macroSlots .mtray').length > 0 &&
        getComputedStyle(document.querySelector('.mday-acts')).display !== 'none'),
      await fold.evaluate(() => 'sheets ' + document.querySelectorAll('#modalRoot .msheet').length +
        ' trays ' + document.querySelectorAll('#macroSlots .mtray').length));
    /* ---- the slack from a finished meal goes to the meals ahead ----------
     * A meal's denominator was a fixed slice of the day by weight: eat a
     * breakfast a thousand calories over and Lunch and Dinner went on asking
     * for 483 and 677 as though nothing had happened. The day strip knew; the
     * meals never found out, and Rebalance solved toward a plan the day could
     * no longer pay for.
     *
     * What is LEFT is the targets less what has actually been EATEN — not
     * less what is merely plated, because a dinner you have not had is a plan
     * and a plan cannot use up a day — split across the meals still to come
     * by the same weights the plan uses. A finished meal keeps its plan,
     * because "1,425 against a 387 plan" is the sentence you want tomorrow.
     *
     * Asserted as relationships, never as figures: the arithmetic is the
     * app's and a copied number would only pin today's food table. */
    const askPg = async (x) => {
      const pg = await t.fresh({ viewport: { width: 412, height: 915 } });
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      await pg.evaluate((mult) => {
        const big = window.RECIPES.filter((r) => r.macro && r.macro.kcal > 400)[0];
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const d = new Date();
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        /* Food on every meal: an EMPTY meal draws its verdict chip instead of
           pills, so a day of empty meals has nothing here to read. */
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]:
          { b: [{ id: big.id, x: mult, eaten: 0 }],
            l: [{ id: big.id, x: 1, eaten: 0 }],
            d: [{ id: big.id, x: 1, eaten: 0 }],
            s: [{ id: big.id, x: 1, eaten: 0 }] } }));
      }, x);
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(400);
      return pg;
    };
    /* The pills are in the meal's SHEET since the trays (2026-10-04) — a
       tray says its calories only — so each meal is opened in turn, its four
       pills read, and the sheet closed again, the way a thumb would look. */
    const asked = async (pg) => {
      await closeSheet(pg);
      const keys = await pg.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray .mtray-b[data-mopen]')]
        .map((b) => b.dataset.mopen));
      const out = {};
      for (const k of keys) {
        await openMeal(pg, k);
        const r = await pg.evaluate(() => {
          const s = document.querySelector('#modalRoot .msheet');
          if (!s) return null;
          return { n: (s.querySelector('.msh-t .mslot-name') || {}).textContent,
            pills: [...s.querySelectorAll('.msh-top .mcap')].map((e) => ({
              want: Number(e.dataset.want), spent: e.classList.contains('spent') })) };
        });
        if (r && r.n) out[r.n] = r.pills;
        await closeSheet(pg);
      }
      return out;
    };
    const overPg = await askPg(3);
    const beforeAte = await asked(overPg);
    /* Said against the plan itself rather than against the absence of a
       was-number, which is what this used to read and which is gone. Stronger
       for it: "nothing is marked as moved" is satisfied by an app that never
       marks anything, while this compares the figure on the card to the share
       the weights actually give it. */
    const plansNow = await overPg.evaluate(() => {
      const T = window.__macroLab.targets();
      const dayK = 4 * T.p + 4 * T.c + 9 * T.f;
      const list = JSON.parse(localStorage.getItem('bsc.macroSlots') || 'null');
      const ws = (list && list.list ? list.list : []).map((sl) => ({
        n: sl.n, w: typeof sl.w === 'number' ? sl.w : 20 }));
      const sum = ws.reduce((a, x) => a + x.w, 0) || 1;
      const out = {};
      ws.forEach((x) => { out[x.n] = Math.round(dayK * (x.w / sum)); });
      return out;
    });
    t.ok('before anything is eaten, every meal is asked for exactly its plan share',
      Object.keys(beforeAte).length > 2 &&
      Object.keys(plansNow).every((n) => !beforeAte[n] ||
        Math.abs(beforeAte[n][0].want - plansNow[n]) <= 2),
      JSON.stringify({ shown: beforeAte, share: plansNow }));

    /* Eat the oversized breakfast. */
    /* Eaten with the MEAL's tick: there is no per-plate tick since the
       RP-style day (Blake, 2026-10-04: "No individual foods ticks... I'll
       complete the whole meal"), and breakfast holds the one plate. A
       selector that finds nothing here does not fail: it silently eats
       nothing and the cascade guards below go red for reasons that have
       nothing to do with the cascade — so the tick is asserted pressed. */
    await overPg.click('#macroSlots [data-mdot="b"]');
    await overPg.waitForTimeout(600);
    t.ok('the meal tick ate the one plate on breakfast',
      await overPg.evaluate(() => document.querySelector('[data-mdot="b"]').getAttribute('aria-pressed') === 'true'),
      await overPg.evaluate(() => JSON.stringify(Object.values(JSON.parse(localStorage.getItem('bsc.macroDays')))[0].b)));
    const afterAte = await asked(overPg);
    const lunch = afterAte.Lunch, brek = afterAte.Breakfast;
    /* Read across the pills, not off the first one. After a breakfast that
       size the day's calories and carbs are gone outright — those pills are
       spent and carry no plan to compare against — and the macro that still
       has something left is where the lowering is visible. */
    /* Lowered, or gone entirely. A breakfast this size does not just shrink
       the day, it spends it — and a pill the day cannot pay for is the most
       lowered a pill can be. */
    t.ok('eating a meal over its share lowers what the meals ahead are asked for',
      /* Against the reading BEFORE breakfast was eaten: the was-number this
         compared with is gone from the pill, and `undefined !== null` let
         the old guard pass on nothing. No pill rises, and at least one is
         lowered or spent. */
      !!lunch && !!beforeAte.Lunch && lunch.length === beforeAte.Lunch.length && lunch.length > 0 &&
        lunch.every((p2, i) => p2.spent || p2.want <= beforeAte.Lunch[i].want) &&
        lunch.some((p2, i) => p2.spent || p2.want < beforeAte.Lunch[i].want),
      JSON.stringify({ before: beforeAte.Lunch, after: lunch }));
    /* And the plan is shown ONLY where it moved. A macro whose share came
       out the same — fat, here, because that breakfast was huge but lean —
       carries nothing, because repeating a number back to itself is noise on
       a row that has four of them. */
    /* The rule about never repeating a plan back to itself went with the
       was-numbers it was about — there is no second figure on a pill to
       repeat anything. What survives is the claim underneath it, and it is
       the one that matters: a meal already eaten is HISTORY, so the day
       moving does not move it. Read before and after rather than off the
       rendering. */
    t.ok('while the meal that was eaten keeps its own plan, being history',
      !!brek && !!beforeAte.Breakfast && brek.length === beforeAte.Breakfast.length &&
      brek.every((p2, i) => p2.want === beforeAte.Breakfast[i].want),
      JSON.stringify({ before: beforeAte.Breakfast, after: brek }));
    /* Carbs are gone for the day after that breakfast — and three meals
       printing 0/0 would be true and useless. */
    t.ok('a macro the day cannot pay for says so rather than showing a nought',
      !!lunch && lunch.some((p2) => p2.spent), JSON.stringify(lunch));
    await overPg.context().close();

    /* ---- a skipped meal hands its share over ------------------------------
     * The share is divided among the meals still in play, and a meal you have
     * said you are not eating is not one of them — which is the whole point of
     * the skip, and the same rule the plan already used. It has to hold here
     * too, or the day would go on reserving a quarter of itself for food that
     * is never coming. */
    const skipPg3 = await askPg(1);
    const lunchBefore = (await asked(skipPg3)).Lunch;
    /* In Snacks' own sheet: the delete is behind a food's ⋯ and the Skip
       behind the meal's ⋯ (2026-10-04). */
    await openMeal(skipPg3, 's');
    /* Empty it, then skip it — you do not skip a meal you have put food on,
       you delete the food. */
    for (let i = 0; i < 6; i++) {
      const gone = await skipPg3.evaluate(() => {
        const m = document.querySelector('#modalRoot [data-mfmenu^="s:"]');
        if (!m) return true;
        if (m.getAttribute('aria-expanded') !== 'true') m.click();
        return false;
      });
      if (gone) break;
      await skipPg3.waitForTimeout(200);
      await skipPg3.evaluate(() => { const d = document.querySelector('#modalRoot [data-mdel^="s:"]'); if (d) d.click(); });
      await skipPg3.waitForTimeout(300);
    }
    await skipPg3.evaluate(() => {
      const m = document.querySelector('#modalRoot [data-mmenu="s"]');
      if (m && m.getAttribute('aria-expanded') !== 'true') m.click();
    });
    await skipPg3.waitForTimeout(250);
    await skipPg3.evaluate(() => {
      const b = document.querySelector('#modalRoot [data-mskip="s"]');
      if (b) b.click();
    });
    await skipPg3.waitForTimeout(550);
    await closeSheet(skipPg3);
    t.ok('the empty snack was skipped from its meal menu',
      await skipPg3.evaluate(() => !!document.querySelector('#macroSlots .mtray-skip [data-mopen="s"]')),
      await skipPg3.evaluate(() => [...document.querySelectorAll('#macroSlots > *')].map((x) => x.className).join(' | ')));
    const lunchAfter = (await asked(skipPg3)).Lunch;
    t.ok('skipping a meal raises what the meals still in play are asked for',
      !!lunchBefore && !!lunchAfter && lunchAfter[1].want > lunchBefore[1].want,
      JSON.stringify({ before: lunchBefore, after: lunchAfter }));
    await skipPg3.context().close();

    const underPg = await askPg(0.25);
    /* Read BEFORE, act, read AFTER — the way the skip test above does it.
       This used to compare a pill's want against the little was-number
       rendered beside it, which is gone: Blake, on his own day, "those little
       numbers under the pills? I don't know what they mean." Leaning on a
       rendering artifact for the 'before' also meant the test could only see
       what the renderer chose to admit. */
    const lightBefore = (await asked(underPg)).Lunch;
    /* Eaten with the MEAL's tick: there is no per-plate tick since the
       RP-style day (Blake, 2026-10-04: "No individual foods ticks... I'll
       complete the whole meal"), and breakfast holds the one plate. A
       selector that finds nothing here does not fail: it silently eats
       nothing and the cascade guard below goes red for reasons that have
       nothing to do with the cascade. */
    await underPg.click('#macroSlots [data-mdot="b"]');
    await underPg.waitForTimeout(600);
    const light = (await asked(underPg)).Lunch;
    /* Guarded on the plan being there at all. Number(null) is 0, so without
       it an app that had stopped redistributing entirely would satisfy
       "bigger than nothing" — which is exactly what it did the first time
       this was mutated. */
    /* Guarded on both readings existing. Number(null) is 0, so without it an
       app that had stopped redistributing entirely would satisfy "bigger than
       nothing" — which is exactly what it did the first time this was
       mutated. */
    t.ok('and leaving food on a plate raises what the meals ahead are asked for',
      !!lightBefore && !!light && lightBefore.length === light.length &&
      light.some(function (p2, i) { return p2.want > lightBefore[i].want; }),
      JSON.stringify({ before: lightBefore, after: light }));
    await underPg.context().close();

    /* ---- an empty meal offers the verb it has ----------------------------
     * Another means "not that one, what else" and Balance means "solve these
     * against each other". Neither is a question you have about a meal with
     * nothing on it, and drawn anyway they were two dead buttons on every
     * empty meal of every empty day. Skip is the verb that meal DOES have,
     * and it used to sit in the header wearing a ⊘ nobody reads as a word.
     *
     * Its own page, unfilled: the fold page above has food on every meal by
     * the time it gets here, which is the one state this cannot be asked in.
     */
    const emptyPg = await t.fresh({ viewport: { width: 412, height: 915 } });
    await emptyPg.click('.tab[data-view="macros"]');
    await emptyPg.waitForTimeout(300);
    /* An empty meal opens like any other, from its tray, and its verbs are
       behind the ⋯ on the sheet's head, so it is opened and the menu shown
       the way a thumb would before they are read. */
    /* By its +, since round 3b (2026-10-11): an empty meal is one row, its
       name opening the ways to fill it and + its way into the sheet. */
    await emptyPg.click('#macroSlots .mtray .mtray-ib[data-mopen]');
    await emptyPg.waitForTimeout(400);
    await emptyPg.click('#modalRoot .msheet [data-mmenu]');
    await emptyPg.waitForTimeout(250);
    const emptyVerbs = await emptyPg.evaluate(() => {
      const card = document.querySelector('#modalRoot .msheet');
      if (!card || card.querySelector('.mrow')) return null;
      const row = card.querySelector('.msh-menu');
      const bal = card.querySelector('[data-mbal]');
      return {
        /* By spoken name where there is one, else by the word: the name is
           the contract a screen reader hears. */
        verbs: row ? [...row.querySelectorAll('button')].map((b) => ({
          t: b.getAttribute('aria-label') || b.textContent.trim(), off: b.disabled, word: b.textContent.trim(),
          svg: !!b.querySelector('svg'),
          w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })) : null,
        skipInHeader: [...card.querySelectorAll('.msh-h [data-mskip]')].some((b) => !b.closest('.mfood-menu')),
        /* The scales are drawn in the sheet's head (the approved mockup), and
           with nothing to balance they cannot be pressed. */
        scalesLive: !!bal && !bal.disabled,
        addLine: (() => { const f = card.querySelector('#mpFind');
          return f ? Math.round(f.closest('.mp-find').getBoundingClientRect().width) : 0; })(),
      };
    });
    /* Skip and "Repeat a day" (2026-09-27: a meal again, in one tap, is what
       an empty meal most wants); adding is the picker in the sheet itself. */
    t.ok('an empty meal offers Skip, not two verbs it cannot use',
      !!emptyVerbs && !!emptyVerbs.verbs && emptyVerbs.verbs.length === 2 &&
        /skip/i.test(emptyVerbs.verbs[0].t) && !emptyVerbs.verbs[0].off &&
        /* at the START of a name: Repeat's is "... from another day" */
        !emptyVerbs.verbs.some((v) => /^(another|try another|balance)/i.test(v.t)) && !emptyVerbs.scalesLive,
      JSON.stringify(emptyVerbs));
    t.ok('and skip is no longer a glyph in the header',
      !!emptyVerbs && !emptyVerbs.skipInHeader, JSON.stringify(emptyVerbs));
    /* Blake (2026-09-27): "Just use icons and the box size that is in the
       meal/food card uses." Behind the ⋯ each is an icon with a word, a thumb
       tall; the search box is the wide line under the foods. */
    t.ok('and each is an icon with its word, a thumb tall, with the search box a line of its own',
      !!emptyVerbs && !!emptyVerbs.verbs && emptyVerbs.verbs.every((v) => v.svg && v.word && v.h >= 44) &&
        emptyVerbs.addLine > 200,
      JSON.stringify(emptyVerbs));
    await emptyPg.context().close();

    /* One meal's sheet at a time, and nothing on the day folds: Open all went
       with the meal screens it opened (2026-10-04), because every tray already
       shows its foods. */
    t.ok('the bar has no Open all, and every tray with food already lists it',
      await fold.evaluate(() => !document.getElementById('macroOpenAll') &&
        [...document.querySelectorAll('#macroSlots .mtray.filled')].length > 0 &&
        [...document.querySelectorAll('#macroSlots .mtray.filled')].every((m) => m.querySelectorAll('.mtray-f').length > 0)),
      await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')].map((m) => m.querySelectorAll('.mtray-f').length).join(',')));
    const trayKeys = await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray .mtray-b[data-mopen]')].map((b) => b.dataset.mopen));
    await openMeal(fold, trayKeys[0]);
    await closeSheet(fold);
    await openMeal(fold, trayKeys[1]);
    const openNow = await fold.evaluate(() =>
      [...document.querySelectorAll('#modalRoot .msheet')].map((s) => (s.querySelector('.msh-t .mslot-name') || {}).textContent));
    const secondName = await fold.evaluate((k) => (document.querySelector('#macroSlots [data-mslot="' + k + '"] .mtray-n') || {}).textContent, trayKeys[1]);
    t.ok('one meal’s sheet at a time: opening the next shows only that meal',
      openNow.length === 1 && openNow[0] === secondName, JSON.stringify({ openNow, secondName }));
    /* The sheet's rows sit under its pinned head, not across it. */
    t.ok('and the open meal’s plates sit under its head, not across it',
      await fold.evaluate(() => {
        const head = document.querySelector('#modalRoot .msheet .msh-top');
        const list = document.querySelector('#modalRoot .msheet .mrows');
        /* Since #102 (2026-10-15) the meal's plates are pinned inside its head,
           where the head cannot cover them; anything else still sits below it. */
        return !!head && !!list && (head.contains(list) || list.getBoundingClientRect().top >= head.getBoundingClientRect().bottom - 1);
      }),
      await fold.evaluate(() => { const h = document.querySelector('#modalRoot .msheet .msh-top'), l = document.querySelector('#modalRoot .msheet .mrows');
        return 'head ' + (h ? Math.round(h.getBoundingClientRect().bottom) : '-') + ', list ' + (l ? Math.round(l.getBoundingClientRect().top) : '-'); }));
    /* × goes back to the day, the meal its tray again. */
    await closeSheet(fold);
    t.ok('and × folds that meal back to its tray',
      await fold.evaluate(() => !document.querySelector('#modalRoot .msheet') &&
        document.querySelectorAll('#macroSlots .mtray').length > 0 && !document.querySelector('#macroSlots .mrow')),
      await fold.evaluate(() => 'sheets ' + document.querySelectorAll('#modalRoot .msheet').length));
    /* A tray says its foods by name, each with its weight (on Details) or
       what it costs (on Foods, since 2026-10-10), and its calories against
       its share in its flame pill — not a count and a word, as the card did. */
    const named = await fold.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray.filled')]
      .map((c) => ({ k: ((c.querySelector('.mtray-caps .mcap .mcap-t') || {}).textContent || '').replace(/^\D+/, '').replace('/', ' / '),
        lines: [...c.querySelectorAll('.mtray-f')].map((f) => ({ n: (f.querySelector('.mtray-fn') || {}).textContent || '',
          amt: (f.querySelector('em, .mtray-ck') || {}).textContent || '' })) })));
    t.ok('a tray says each food by name with its amount or what it costs, and its calories against its share',
      named.length > 0 && named.every((c) => /^[\d,]+( \/ [\d,]+| kcal)$/.test(c.k) && c.lines.length > 0 &&
        c.lines.every((l) => l.n && /\d/.test(l.amt))), JSON.stringify(named));
    await openMeal(fold, trayKeys[0]);
    const door = await fold.evaluate(() => {
      const n = document.querySelector('#modalRoot .msheet .mrow .mitem-name');
      if (!n) return null;
      return { tag: n.tagName, id: n.dataset.open || n.dataset.mfood || '',
        food: n.dataset.mfood !== undefined, name: n.closest('.mrow').querySelector('.mrow-sum .mrow-nm').textContent.trim() };
    });
    t.ok('a food’s name is a door, not a label',
      !!door && door.tag === 'BUTTON' && door.id !== '', JSON.stringify(door));
    await openRow(fold);
    await fold.click('#modalRoot .msheet .mrow .mitem-name');
    await fold.waitForTimeout(400);
    t.ok('and pressing it opens what it names',
      await fold.evaluate((d) => {
        if (document.querySelector('#modalRoot .msheet')) return false;
        const sheet = document.querySelector('#modalRoot .sheet');
        if (!sheet) return false;
        return sheet.textContent.indexOf(d.name.slice(0, 12)) !== -1;
      }, door),
      await fold.evaluate(() => {
        const s = document.querySelector('#modalRoot .sheet');
        return s ? s.textContent.trim().slice(0, 90) : 'no sheet opened';
      }));
    await fold.context().close();
    /* The controls on a meal carry no boxes, which is the point — but a
       border is also how a control used to claim its size, and the reach has
       to survive the paint going away. So on a finger every one of them is a
       thumb's worth: the rule that grants it lives in a `pointer: coarse`
       block or a hit area wider than the drawing, and either is invisible to
       a test that forgets to bring a touchscreen. */
    const reachPage = await t.fresh({ viewport: { width: 390, height: 800 },
      hasTouch: true, isMobile: true });
    await reachPage.click('.tab[data-view="macros"]');
    await reachPage.waitForTimeout(200);
    await openPlan(reachPage);
    await reachPage.waitForTimeout(150);
    await reachPage.click('[data-mtarg="save"]');
    await reachPage.waitForTimeout(250);
    await reachPage.click('#macroFill');
    await reachPage.waitForTimeout(600);
    const box = (sel) => reachPage.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }, sel);
    /* What a finger can hit, not what is drawn: the − and + are small circles
       with a hit area round them (::after), so the reach is probed with
       elementFromPoint from the drawing's centre outwards. */
    const hit = (sel) => reachPage.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const on = (x, y) => { const at = document.elementFromPoint(x, y); return !!at && (at === e || e.contains(at)); };
      let up = 0, dn = 0, lf = 0, rt = 0;
      while (up < 40 && on(cx, cy - up - 1)) up++;
      while (dn < 40 && on(cx, cy + dn + 1)) dn++;
      while (lf < 40 && on(cx - lf - 1, cy)) lf++;
      while (rt < 40 && on(cx + rt + 1, cy)) rt++;
      return { w: lf + rt + 1, h: up + dn + 1, drawn: Math.round(r.width) + 'x' + Math.round(r.height) };
    }, sel);
    /* The bar's own button and the tray's door, measured on the day. */
    const reach = { coarse: await reachPage.evaluate(() => matchMedia('(pointer: coarse)').matches),
      bar: await box('.mday-acts button:not(#macroFill)'), seam: await box('#macroSlots .mtray .mtray-b') };
    await reachPage.click('#macroSlots .mtray .mtray-b');
    await reachPage.waitForTimeout(400);
    await openTray(reachPage);
    await openRow(reachPage);
    Object.assign(reach, { key: await hit('#modalRoot .msheet .mrow-open [data-mstep$=":up"]'),
      add: await box('#modalRoot .msheet .mp-find') });
    await reachPage.click('#modalRoot .msheet [data-mmenu]');
    await reachPage.waitForTimeout(250);
    Object.assign(reach, {
      retry: await box('#modalRoot .msheet .msh-menu .mslot-try'),
      icon: await box('#modalRoot .msheet .msh-h [data-mmenu]'), back: await box('#modalRoot .msheet .msh-done') });
    /* Against the BAR, not against a number — and then against a PLATE KEY
       (Blake, 2026-09-27: "Just use icons and the box size that is in the
       meal/food card uses"), and his rule for the sheet (2026-10-04): "Rows
       must be compact: controls no larger than the food text needs, while
       keeping 44 px tap targets." */
    t.ok('the sheet’s verbs and a plate’s keys are a thumb on a finger, the bar’s tools a thumb tall',
      reach.coarse && reach.add && reach.retry && reach.bar && reach.key && reach.icon &&
        reach.add.h >= 44 && reach.add.w > 200 &&
        reach.retry.h >= 44 && reach.icon.h >= 44 && reach.icon.w >= 44 &&
        reach.key.h >= 44 && reach.key.w >= 44 && reach.bar.h >= 44,
      JSON.stringify(reach));
    /* The tray is the handle and stays a thumb's worth; the way back out of
       the sheet, Done since 2026-10-05, is a thumb square at least. */
    t.ok('and the tray is a thumb tall as well, being the handle, and Done a thumb square at least',
      !!reach.seam && reach.seam.h >= 44 && !!reach.back && reach.back.h >= 44 && reach.back.w >= 44,
      JSON.stringify({ seam: reach.seam, back: reach.back }));
    await closeSheet(reachPage);
    /* The door says nothing to the eye but the tray, so it says out loud
       which meal it opens. */
    t.ok('every tray’s door tells a screen reader which meal it opens',
      await reachPage.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray-b')].length > 0 &&
        [...document.querySelectorAll('#macroSlots .mtray-b')]
          .every((b) => /^Open .+/.test(b.getAttribute('aria-label') || ''))),
      await reachPage.evaluate(() => (document.querySelector('#macroSlots .mtray-b') || { getAttribute: () => 'none' })
        .getAttribute('aria-label')));
    await reachPage.context().close();
  },
});
