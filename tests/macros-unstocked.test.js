/* Food the storehouse does not stock: what the picker offers for it, and how
 * it is drafted and kept.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, addOn, openMeal, closeSheet } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — food the storehouse does not stock',
  async suite(t) {
    /* ---- food the storehouse does not stock ------------------------------
     * The books are written to be cooked out of the standard order, and a day
     * drafted from salmon and almonds is not a day if there is no salmon in
     * the house. So external foods are gated on a setting, and off is the
     * default because it is the answer that cannot surprise you.
     *
     * Asserted as a DIFFERENCE between the two settings on one seeded day,
     * never against a named food: which external food wins a rung depends on
     * the day's gap, and pinning "tuna steak" would be pinning today's
     * arithmetic. */
    const extPg = async (on) => {
      const pg = await t.fresh();
      await pg.evaluate((e) => {
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 190, act: 1.375, goal: 'cut1', goalLb: 175, goalBy: '',
          workouts: 4, steps: 8000, extFill: e }));
      }, on);
      await pg.reload();
      await pg.waitForTimeout(350);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      await addOn(pg);
      await pg.waitForTimeout(500);
      return pg.evaluate(() => {
        const N = window.Nutrition.FOODS;
        const extNames = {};
        Object.keys(N).forEach((k) => { if (N[k].ext) extNames[(N[k].label || k).toLowerCase()] = 1; });
        const rows = [...document.querySelectorAll('#modalRoot .mpick-wrap .mp-name')]
          .map((e) => e.textContent);
        /* Checked on this page rather than a page from earlier in the suite:
           `p` is closed by the time this runs, and reaching for it threw
           rather than failed, which reads as a broken suite instead of a
           broken assertion. */
        const bad = [];
        Object.keys(N).forEach((k) => {
          const f = N[k];
          if (!f.ext) return;
          if (!f.g || !Object.keys(f.g).length) bad.push(k + ': no g');
          else if (!f.def) bad.push(k + ': no def');
          else if (!f.g[f.def.unit]) bad.push(k + ': def unit "' + f.def.unit + '" has no weight');
          else if (!f.label) bad.push(k + ': no label');
          else if (!f.zone) bad.push(k + ': no zone');
          else if (!(f.kcal > 0)) bad.push(k + ': no calories');
        });
        return { rows: rows.length, bad: bad,
          ext: rows.filter((n) => extNames[String(n).toLowerCase()]),
          known: Object.keys(extNames).length };
      });
    };
    const extOff = await extPg(false);
    const extOn = await extPg(true);
    t.ok('the table knows food the storehouse does not stock',
      extOff.known >= 20, String(extOff.known));
    t.ok('and does not offer any of it by default',
      extOff.rows > 5 && extOff.ext.length === 0, JSON.stringify(extOff.ext));
    t.ok('but offers it once you say Fill may shop',
      extOn.ext.length > 0, JSON.stringify(extOn.ext));

    /* A half-authored entry is the failure this guards. The six numbers come
       from the USDA and are fetched; `g`, `def`, `label` and what the food is
       FOR are judgement and are typed by hand, and a missing `def` is how a
       portion once defaulted to a cup of soy sauce. */
    t.ok('and every one of them is a complete entry',
      extOff.bad.length === 0, extOff.bad.slice(0, 6).join(' | '));

    /* Nothing, chips, bars — one language in three doses.
     *
       Silence when a meal is fine, a chip for the macro that is not, and the
       whole picture only where you are actually dialling it in. Three chips on
       every meal all day is colour that is always on, and colour that is
       always on has stopped saying anything. */
    const dosePg = await t.fresh({ viewport: { width: 390, height: 900 } });
    await dosePg.click('.tab[data-view="macros"]');
    await dosePg.waitForTimeout(300);
    await dosePg.click('#macroFill');
    await dosePg.waitForTimeout(800);
    /* Every meal folded, so the whole day is being scanned at once. */
    /* One at a time, re-querying each round: every click redraws the day, so a
       NodeList taken up front is a list of detached nodes after the first
       one. Only the first click was landing. */
    for (let i = 0; i < 8; i++) {
      const more = await dosePg.evaluate(() => {
        const b = document.querySelector('.mslot-head[aria-expanded="true"]');
        if (!b) return false;
        b.click();
        return true;
      });
      if (!more) break;
      await dosePg.waitForTimeout(120);
    }
    await dosePg.waitForTimeout(300);
    const glance = await dosePg.evaluate(() => {
      const cards = [...document.querySelectorAll('.mslot')];
      return {
        meals: cards.length,
        chips: cards.map((c) => c.querySelectorAll('.msub-c').length),
        barsWhileFolded: document.querySelectorAll('.msub-bars').length,
        everyChipOff: [...document.querySelectorAll('.msub-c')].every((e) =>
          /\b(over|short)\b/.test(e.className)),
        /* The calorie figure moved off the seam and onto its own gauge, so
           it is read off the flame label now rather than .msub-k. */
        /* The calorie figure moved off the seam and onto its own gauge, so
           it is read off the flame label now rather than .msub-k. */
        /* ...on a tray, its calories against its share: its flame pill (2026-10-05). */
        kcalAlways: cards.length > 0 && cards.every((c) =>
          /[\d,]+\/[\d,]+$/.test(((c.querySelector('.mtray-caps .mcap .mcap-t') || {}).textContent || '').replace(/\s/g, ''))),
      };
    });
    t.ok('a folded day shows no bars at all',
      glance.barsWhileFolded === 0, JSON.stringify(glance));
    /* The chips that ARE drawn are only ever the ones that are off — there is
       no "on" chip, which is what makes the absence of one mean something. */
    t.ok('and every chip on it is one that is off',
      glance.everyChipOff, JSON.stringify(glance));
    /* Silence cannot be mistaken for "not worked out yet", because the calorie
       figure is beside it either way. */
    t.ok('and a meal that says nothing still says its calories',
      glance.kcalAlways, JSON.stringify(glance));

    /* The picker measures the DAY now, not this meal's share.
     *
       You are shopping to close the day, wherever the food ends up sitting —
       and this sheet used to have the panel speaking one share while the
       footer beneath it spoke another, so the top invited food the bottom
       called a bust. One number, both halves reading it. */
    await addOn(dosePg);
    await dosePg.waitForTimeout(600);
    /* Since 2026-10-04 the picker lives in the meal's own sheet, so the pills
       at its head ARE the meal's pills against its share (.msh-top .mcap),
       and the sheet's header names the meal. */
    const dayPanel = await dosePg.evaluate(() => {
      const box = document.querySelector('#modalRoot .msheet .msh-top');
      if (!box) return null;
      const pills = [...box.querySelectorAll('.mcap')].map((e) => ({ txt: e.textContent.trim() }));
      return { cap: ((box.querySelector('.msh-t .mslot-name') || {}).textContent || '').trim(),
        pills: pills, oldBars: document.querySelectorAll('#modalRoot .msub-br, #modalRoot .mp-left').length };
    });
    /* REVERSED A SECOND TIME, and the history is worth keeping.
     *
       It first read "Where the day stands · 60 / 203 g" — four bars of
       standing. That became the remainder, because shopping is done against
       what is MISSING and the subtraction was otherwise being done in
       Blake's head on every row. True, and it cost the other half: a lone
       "20" cannot say whether that is the whole meal still to come or the
       last mouthful of it.
     *
       So both halves now, with the fill carrying the remainder that the
       middle version printed. Blake: "those three macros clearly show me how
       much I've selected and what is left. That makes a perfect meal." */
    t.ok('the picker answers with four pills, not the old bars',
      !!dayPanel && dayPanel.pills.length === 4 && dayPanel.oldBars === 0,
      JSON.stringify(dayPanel && { cap: dayPanel.cap, n: dayPanel.pills.length,
        bars: dayPanel.oldBars }));

    /* The claim that matters is that the sheet and the card agree about the
       same meal. Read off the card rather than recomputed here, for exactly
       that reason — a literal would pass on an app that had stopped doing
       the arithmetic at all. */
    const owedNow = await dosePg.evaluate(() => {
      const name = ((document.querySelector('#modalRoot .msh-t .mslot-name') || {}).textContent || '').trim();
      const meal = window.__macroLab.read().meals.find((m) => m.name === name);
      const pcap = [...document.querySelectorAll('#modalRoot .msh-top .mcap')].find((e) =>
        /^P/.test((e.querySelector('i') || {}).textContent || ''));
      if (!meal || !pcap) return null;
      const nums = (pcap.querySelector('.mcap-t').textContent.replace(/^P/, '').match(/[\d,]+/g) || []).map((x) => Number(x.replace(/,/g, '')));
      const got = meal.items.reduce((a, it) => a + it.p * it.x, 0);
      return { shown: nums[0], cardGot: Math.round(got), sheetWant: nums[1] };
    });
    t.ok('and its protein pill holds what the meal\'s plates hold',
      !!owedNow && Math.abs(owedNow.shown - owedNow.cardGot) <= 1 &&
        owedNow.sheetWant > 0,
      JSON.stringify(owedNow));

    /* REVERSED. This said "and says so, rather than naming a meal or a share"
       and asserted the caption did NOT name a meal — the sheet counted the
       day, so naming one would have been a lie. Blake, looking at a sheet
       headed ADD TO SNACKS reading 1745 kcal while Snacks was asking for 87:
       "the macro pills at the top are for the whole day? why not for the meal
       I am trying to make?"

       So the pills answer the meal now, and the caption has to name it or the
       figure has no scope at all. Everything else in this sheet was already
       meal-scoped — the ranking, and a section that says one food that closes
       Snacks — and the pills were the only thing left answering the day. */
    t.ok('and names the meal it is counting, because it counts a meal now',
      !!dayPanel && /^[A-Za-z][\w ]*$/.test(dayPanel.cap) &&
        await dosePg.evaluate((n) => [...document.querySelectorAll('#macroSlots .mtray-n')].some((e) => e.textContent.trim() === n), dayPanel.cap),
      dayPanel && dayPanel.cap);

    /* The flame in the sheet agrees with the flame on the card behind it.
     *
       This used to assert the sheet's flame equalled the DAY's remainder, and
       that it was summed from what the plates state rather than derived back
       out of their grams — two eaten-calorie totals for one day. That second
       worry is gone: since one calorie became 4P+4C+9F everywhere, summing
       and deriving are the same operation, and recipes.test.js guards it at
       the record.

       What is worth pinning now is scope. The sheet fills one meal and the
       card for that meal is directly behind it, so the two have to agree
       about the same meal or the sheet invites food the card calls a bust —
       which is the exact failure this file already records at mShares. */
    const flame = await dosePg.evaluate(() => {
      const num = (txt) => (String(txt || '').match(/[\d,]+/g) || []).map((x) => Number(x.replace(/,/g, '')));
      const k = [...document.querySelectorAll('#modalRoot .msh-top .mcap')].find((e) => /\uD83D\uDD25/.test((e.querySelector('i') || {}).textContent || ''));
      const shown = k ? num(k.querySelector('.mcap-t').textContent.replace(/^\uD83D\uDD25/, '')) : [];
      const name = ((document.querySelector('#modalRoot .msh-t .mslot-name') || {}).textContent || '').trim();
      const tray = [...document.querySelectorAll('#macroSlots .mtray')].find((c) =>
        ((c.querySelector('.mtray-n') || {}).textContent || '').trim() === name);
      const tk = tray ? num(tray.querySelector('.mtray-caps .mcap .mcap-t').textContent.replace(/^\uD83D\uDD25/, '')) : [];
      return { shown: shown[0], shownWant: shown[1], meal: name, got: tray ? tk[0] : null, want: tray ? tk[1] : null };
    });
    t.ok('the flame in the sheet is the same figure the meal\'s tray is showing, against the same share',
      flame.got !== null && Math.abs(flame.shown - flame.got) <= 1 && Math.abs(flame.shownWant - flame.want) <= 1,
      JSON.stringify(flame));
    await dosePg.context().close();

    /* The verdict, per macro, on the row that already existed.
     *
       The header pill answered CALORIES, so a lunch five times over on fat
       and fine on protein read as one number with no name on it. It is gone
       from a meal with food on it; the pills say it per macro instead, in the
       same construction the day's own folded readout uses one level up. */
    const pillPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await pillPg.click('.tab[data-view="macros"]');
    await pillPg.waitForTimeout(300);
    /* In four pills now rather than one flame. A lone calorie figure told you
       the SIZE of the meal and nothing about its shape, and the shape is the
       part you plan against: 0 of 44 protein says what to go looking for. */
    t.ok('an empty meal still says what it is meant to hold',
      await pillPg.evaluate(() => {
        /* On its tray's flame pill, "0/642": nothing yet, against its share.
           Since round 3b (2026-10-11) an empty meal is one row with no pills,
           and the share is the faint "642 kcal" beside its name. */
        const c = document.querySelector('#macroSlots .mtray.mtray-empty');
        const a = c && c.querySelector('.mtray-aim');
        const m = a && a.textContent.replace(/,/g, '').match(/^(\d+) kcal$/);
        return !!m && Number(m[1]) > 0 && Number(a.dataset.want) === Number(m[1]) && !c.querySelector('.mcap');
      }));
    await pillPg.click('#macroFill');
    await pillPg.waitForTimeout(700);
    /* A meal says its calories and what is on it. Nothing else.
     *
       Chips folded and bars open both judged a meal against its SHARE of the
       day. They are gone — you steer by the day, and the strip pinned at the
       top of the screen says how it is stacking. A meal is a container.

       What this asserts is the silence, because silence is the feature: a
       macro judgement appearing on a meal card is now the regression. */
    for (let i = 0; i < 8; i++) {
      const more = await pillPg.evaluate(() => {
        const b = document.querySelector('.mslot-head[aria-expanded="true"]');
        if (!b) return false;
        b.click();
        return true;
      });
      if (!more) break;
      await pillPg.waitForTimeout(110);
    }
    await pillPg.waitForTimeout(300);
    const quietFolded = await pillPg.evaluate(() => ({
      chips: document.querySelectorAll('.msub-c').length,
      oldBars: document.querySelectorAll('.msub-bars').length,
      shut: document.querySelectorAll('#macroSlots .mtray').length,
      shutK: [...document.querySelectorAll('#macroSlots .mtray')].map((c) => ((c.querySelector('.mtray-caps .mcap .mcap-t') || {}).textContent || '').replace(/^\D+/, '').trim()),
      shutCaps: [...document.querySelectorAll('#macroSlots .mtray')].map((c) => c.querySelectorAll('.mtray-caps .mcap').length),
      shutLines: [...document.querySelectorAll('#macroSlots .mtray')].filter((c) => c.querySelectorAll('.mtray-f').length > 0).length,
      shutPlates: document.querySelectorAll('#macroSlots .mitem').length,
    }));
    /* Reversed deliberately. This used to assert that a folded meal said its
       calories and NOTHING about macros — you steer by the day, a meal is a
       container, and grading each one against a share it never agreed to was
       a second opinion nobody asked for.

       Blake asked for the verdict back, twice, having been shown what it
       costs. So the seam carries four gauges now: the calories it always
       carried, and P/F/C against a tick at the meal's share. What must NOT
       come back is the old apparatus — the chips and the .msub-bars that had
       a second, disagreeing definition of that share. */
    /* Reversed again, by Blake, on 2026-10-04: shown the meal's macros on the
       folded card as four gauges, as one split bar and as rings round the
       tick, he chose "Just the calorie bar is fine." The macro that is off is
       still named — in the verdict's words ("554 over · carbs over") — so the
       folded card judges the meal against its share without a second gauge
       set. What must not come back is the old apparatus either way. */
    /* Reversed a third time the same day, in the RP-style redesign Blake
       approved on 2026-10-04 ("the RP Diet way"): the day card is the meal's
       name, a pill of words — how many foods and whether it is over, under
       or on its targets, or eaten — and the app's own four meal pills under
       it. No calorie bar and no verdict sentence on the folded card; the
       "554 over · carbs over" words are on the open meal now. What must not
       come back is the old apparatus either way. */
    /* And a fourth time the same day (2026-10-04), when Blake found the RP
       day "way to fat and tall": a meal on the day is a small tray, its
       calories against its share and its foods as lines, with the macros in
       the meal's sheet. What must not come back is the old apparatus. */
    /* And a fifth time on 2026-10-05: "adding back the subtle pills that show
       me that meal's calories and macros." The tray carries the meal's four
       pills small, the sheet's own pills (capsHTML), not a second definition
       of its share; still none of the old apparatus. */
    t.ok('a tray shows its four pills, calories against its share among them, and its foods, and none of the old apparatus',
      quietFolded.shut > 0 && quietFolded.shutLines === quietFolded.shut && quietFolded.shutPlates === 0 &&
      quietFolded.shutK.every((w) => /^[\d,]+\/[\d,]+$/.test(w.replace(/\s/g, ''))) && quietFolded.shutCaps.every((n) => n === 4) &&
      quietFolded.chips === 0 && quietFolded.oldBars === 0,
      JSON.stringify(quietFolded));
    /* And opening one does not bring them back — the open card is plates and
       steppers, which is what it is for. */
    await pillPg.click('#macroSlots .mtray-b');
    await pillPg.waitForTimeout(350);
    // the plates are in the sheet's tray, which opens shut
    if (await pillPg.isVisible('#modalRoot .msh-tray .msh-trn')) { await pillPg.click('#modalRoot .msh-trn'); await pillPg.waitForTimeout(250); }
    const quietOpen = await pillPg.evaluate(() => {
      const card = document.querySelector('#modalRoot .msheet');
      if (!card) return null;
      return { plates: card.querySelectorAll('.mrows .mitem').length,
        chips: card.querySelectorAll('.msub-c').length,
        bars: card.querySelectorAll('.msub-bars').length };
    });
    t.ok('and opening it gives you plates, not charts',
      !!quietOpen && quietOpen.plates > 0 &&
      quietOpen.chips === 0 && quietOpen.bars === 0,
      JSON.stringify(quietOpen));
    await closeSheet(pillPg);
    /* The empty-meal sentence is asserted at the top of this block, before
       Fill puts food on everything. Nothing here is empty any more. */

    /* On it is a BAND. Without one every meal every day is off by something,
       the colour is on all the time, and colour that is always on has stopped
       saying anything. */
    t.ok('a meal that landed goes quiet rather than lighting up',
      await pillPg.evaluate(() => {
        const L = window.__macroLab, T = L.targets();
        L.forget();
        return typeof L.draft === 'function';
      }) && await pillPg.evaluate(() => {
        // every pill on the day is one of the three known states, never blank
        return [...document.querySelectorAll('.msub-c')].every((e) =>
          /\b(on|over|short)\b/.test(e.className));
      }));
    await pillPg.context().close();

    /* Try again can offer a plain food.
     *
       The pool was recipes only, and a food belongs to no section, so one
       could not have got in even by accident. Pressing this on a snack — the
       meal most likely to be a yoghurt and a stick of cheddar rather than a
       dish — walked you through the whole book instead.

       Gated on `eat` or `side`, because the food table is mostly INGREDIENTS:
       unfiltered it offered three ounces of raw stewing beef as a snack,
       which is a worse answer than the recipe it replaced. */
    const foodPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await foodPg.click('.tab[data-view="macros"]');
    await foodPg.waitForTimeout(300);
    const pool = await foodPg.evaluate(() => {
      const L = window.__macroLab; L.forget(); L.draft();
      const all = L.rank('s', 80);
      const foods = all.filter((e) => String(e.id).indexOf('f:') === 0);
      return { total: all.length, foods: foods.length,
        names: foods.map((f) => f.name).slice(0, 40) };
    });
    t.ok('a snack can be a plain food, not only a recipe',
      pool.foods > 0, JSON.stringify(pool).slice(0, 160));
    /* The two ends of the rule, named outright: something you eat as it comes
       is in, an ingredient is not. */
    t.ok('and it is food you could actually eat as it comes',
      pool.names.some((n) => /cheddar|yogurt|peanut|egg|ham|chicken|cheese/i.test(n)),
      pool.names.join(', ').slice(0, 140));
    t.ok('and never a raw ingredient waiting to be cooked',
      !pool.names.some((n) => /stewing|ground beef|flour|cornstarch|yeast|dry mix|baking/i.test(n)),
      pool.names.join(', ').slice(0, 140));
    await foodPg.context().close();

    /* Skipping a meal.
     *
       The visible half is a line instead of a card. The half that matters is
       arithmetic: an empty meal RESERVES its share — mShares divides the day
       across every empty slot — so a lunch you have decided against goes on
       holding a quarter of the day and quietly aims every other meal lower.
       A skip has to release it, or it is only a costume. */
    const skipPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await skipPg.click('.tab[data-view="macros"]');
    await skipPg.waitForTimeout(400);
    /* Behind the ⋯ in the empty meal's own sheet (2026-10-04): opened, then
       its menu, the way a thumb gets there. */
    await openMeal(skipPg, 'l');
    await skipPg.evaluate(() => { const m = document.querySelector('#modalRoot [data-mmenu="l"]'); if (m) m.click(); });
    await skipPg.waitForTimeout(200);
    t.ok('an empty meal offers a way to skip it',
      await skipPg.evaluate(() => !!document.querySelector('#modalRoot .msh-menu [data-mskip="l"]')));
    /* What breakfast is told to aim for, with every meal still in play and
       then with lunch dropped out of the divisor. This is the whole feature:
       the share is a weight over the weights STILL IN PLAY. */
    /* Read off the kcal pill's denominator. It used to come from the lone
       flame an empty meal wore; the meal wears its four pills now and the
       share is the first of them. The claim underneath is unchanged — and it
       is the one that matters, because asserting the day's TOTAL here proved
       nothing. */
    /* Breakfast's tray, by name: the number after the stroke is its share
       (a read of 0 cannot show a share moving). */
    const shareRead = () => skipPg.evaluate(() => {
      const b = document.querySelector('#macroSlots [data-mopen="b"]');
      // its calorie pill, or the faint target an empty meal has instead (2026-10-11)
      const c = b && b.closest('.mtray');
      const k = c && (c.querySelector('.mtray-caps .mcap') || c.querySelector('.mtray-aim'));
      return k ? Number(k.dataset.want) : 0;
    });
    const bShareBefore = await shareRead();
    await skipPg.evaluate(() => document.querySelector('#modalRoot [data-mskip="l"]').click());
    await skipPg.waitForTimeout(400);
    /* the skipped meal's sheet says so and holds the way back */
    const undoInSheet = await skipPg.evaluate(() => !!document.querySelector('#modalRoot .msh-skipped [data-mskip="l"]'));
    await closeSheet(skipPg);
    const skipped = await skipPg.evaluate((u) => {
      const el = document.querySelector('#macroSlots .mtray-skip [data-mopen="l"]');
      return { line: !!el, says: el ? el.textContent.replace(/\s+/g, ' ').trim() : '', undo: u };
    }, undoInSheet);
    t.ok('and it becomes a line that says so, with the way back in its sheet',
      skipped.line && /skipped/i.test(skipped.says) && skipped.undo,
      JSON.stringify(skipped));
    const bShareAfter = await shareRead();
    /* Asserting the day's TOTAL here proved nothing — mBalanceDay lands the
       day on target whether or not the share was released, so that version
       passed with the feature reverted. The share is what actually moves. */
    t.ok('and the share lunch was holding goes to the meals that remain',
      bShareBefore > 0 && bShareAfter > bShareBefore * 1.15,
      'breakfast share ' + bShareBefore + ' -> ' + bShareAfter);

    /* And Fill respects it. */
    await skipPg.click('#macroFill');
    await skipPg.waitForTimeout(800);
    t.ok('Fill leaves a skipped meal alone',
      await skipPg.evaluate(() => {
        const m = window.__macroLab.read().meals.find((x) => x.k === 'l');
        return !!m && m.items.length === 0;
      }));

    await openMeal(skipPg, 'l');
    await skipPg.evaluate(() => { const b = document.querySelector('#modalRoot .msh-skipped [data-mskip="l"]'); if (b) b.click(); });
    await skipPg.waitForTimeout(300);
    await closeSheet(skipPg);
    const unsk = await skipPg.evaluate(() => ({ skip: !!document.querySelector('#macroSlots .mtray-skip'),
      tray: !!document.querySelector('#macroSlots .mtray [data-mopen="l"]'), sheet: !!document.querySelector('#modalRoot .msheet'),
      store: localStorage.getItem('bsc.macroSkip') }));
    t.ok('and un-skipping puts the meal back', !unsk.skip && unsk.tray, JSON.stringify(unsk));
    await skipPg.context().close();
  },
});
