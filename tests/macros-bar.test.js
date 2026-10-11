/* The commit button on the bar, ticking a plate, a skipped meal, adding
 * without losing your place, the basket on the bar, searching that narrows,
 * whole servings on an unplanned day, the rail, the list's order,
 * thumb-sized controls, a food nobody has heard of, a typed barcode, and
 * printing a day.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, addOn, openMeal, closeSheet } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — the bar, the list, and the picker\'s controls',
  async suite(t, freshBare) {
    /* ---- a tap is the commit ---------------------------------------------
     * There used to be a commit button, and the story of this block was
     * keeping it reachable: out of the sheet's header, onto a bar pinned to
     * the bottom where a thumb rests. Since 2026-10-04 there is nothing to
     * reach (Blake: no basket, no "Add N"): a tap on a row puts the food on
     * the meal. What is left to guard is that the tap does exactly that, that
     * the row is a thumb's size, and that nothing is pinned over the list.
     *
     * Measured in a coarse-pointer context at 320px, the narrowest the app
     * supports. */
    const barPg = await t.fresh({ viewport: { width: 320, height: 844 },
      hasTouch: true, isMobile: true });
    await barPg.click('.tab[data-view="macros"]');
    await barPg.waitForTimeout(250);
    await addOn(barPg);
    await barPg.waitForTimeout(400);
    t.ok('the sheet has no commit button anywhere, and no bar to carry one',
      await barPg.evaluate(() => !document.querySelector('[data-mpdone], .mp-foot, .mp-bar')));
    const n0 = await barPg.evaluate(() => document.querySelectorAll('#modalRoot .mrows .mrow').length);
    const tapRow = await barPg.evaluate(() => {
      const r = document.querySelectorAll('#modalRoot .mpick-row[data-mpick]')[0];
      const h = Math.round(r.getBoundingClientRect().height);
      r.click();
      return { h: h };
    });
    await barPg.waitForTimeout(400);
    const tapped = await barPg.evaluate(() => ({
      rows: document.querySelectorAll('#modalRoot .mrows .mrow').length,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    t.ok('a tap on a row puts the food on the meal, in the list above',
      tapped.rows === n0 + 1, JSON.stringify({ n0, tapped }));
    t.ok('a thumb can hit the row', tapRow.h >= 44, JSON.stringify(tapRow));
    t.ok('and the sheet does not scroll the page sideways', tapped.overflowX === 0, JSON.stringify(tapped));

    /* Scrolled to the very end, nothing pinned sits on the last row. */
    await barPg.evaluate(() => { const s = document.querySelector('#modalRoot .scrim'); s.scrollTop = s.scrollHeight; });
    await barPg.waitForTimeout(300);
    const footGeo = await barPg.evaluate(() => {
      const rows = [...document.querySelectorAll('#modalRoot .mpick-row')];
      const last = rows[rows.length - 1].getBoundingClientRect();
      return { lastBottom: Math.round(last.bottom), view: window.innerHeight };
    });
    t.ok('and at the end of the list nothing covers the last row',
      footGeo.lastBottom <= footGeo.view, JSON.stringify(footGeo));
    await barPg.context().close();

    /* ---- ticking a plate must not truncate what you ate ------------------
     * An eaten portion becomes `<button class="mstep-x mstep-wake">` so it can
     * be tapped to correct. `.mstep button` is 0-1-1 and `.mstep-x` is 0-1-0,
     * so every box property on the former beat the latter: `flex: none` and
     * `width: 44px` shrank the cell to a key's size, and `.mstep-x`'s own
     * 20px of padding left 24px for the words. "2 ½ cups" rendered "2 ½ c".
     *
     * THIS RULE HAS NOW CAUGHT THAT ELEMENT THREE TIMES — twice on font-size
     * (15px, then 18px) and once on width. The first two fixes scoped
     * font-size alone and left the box unscoped, which is why there was a
     * third. Asserted as an invariant rather than a measurement: ticking
     * changes the state of a plate, never the words on it.
     *
     * Coarse pointer, because that is where the 44px box rules live. */
    const wakePg = await t.fresh({ viewport: { width: 412, height: 915 },
      hasTouch: true, isMobile: true });
    await wakePg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [],
        l: [{ id: 'f:egg_white', x: 2.5, eaten: 0 }, { id: 'f:applesauce', x: 0.75, eaten: 0 }],
        d: [], s: [] } }));
    });
    await wakePg.reload();
    await wakePg.waitForTimeout(400);
    await wakePg.click('.tab[data-view="macros"]');
    await wakePg.waitForTimeout(300);
    /* Lunch's sheet, where its plates are dialled (2026-10-04). */
    await openMeal(wakePg, 'l');
    const portionCells = () => wakePg.evaluate(() =>
      [...document.querySelectorAll('#modalRoot .mrows .mstep-x')].map((e) => ({
        text: e.textContent.trim(), w: Math.round(e.getBoundingClientRect().width),
        clipped: e.scrollWidth > e.clientWidth + 1 })));
    const before2 = await portionCells();
    /* Ticked by the meal's own tick: there is no tick on a food since the
       RP-style meal (Blake, 2026-10-04: "No individual foods ticks... I'll
       complete the whole meal"). Both plates go eaten, both portions become
       the wake-to-correct button this guard is about. */
    await wakePg.click('#modalRoot .msh-h [data-mdot="l"]');
    await wakePg.waitForTimeout(350);
    t.ok('the meal\'s tick leaves every plate on it eaten, its portion the wake-to-correct button',
      await wakePg.evaluate(() => {
        const rows = [...document.querySelectorAll('#modalRoot .mrows .mitem')];
        return rows.length === 2 && rows.every((r) => r.classList.contains('eaten') &&
          !!r.querySelector('.mstep-x.mstep-wake[data-medit]'));
      }));
    const eatenPortion = await portionCells();
    t.ok('a plate reads the same words once it is eaten',
      before2.length > 1 && eatenPortion.length === before2.length &&
      before2.every((x, i) => x.text === eatenPortion[i].text),
      JSON.stringify({ before: before2, after: eatenPortion }));
    t.ok('and the portion is not clipped down to a key’s width',
      eatenPortion.length > 0 && eatenPortion.every((x, i) => !x.clipped && x.w === before2[i].w),
      JSON.stringify(eatenPortion));
    await wakePg.context().close();

    /* ---- a skipped meal is not still coming -----------------------------
     * From Blake's screenshots: the bar read "1802 / 1745" and the number on
     * the same row read "+930". Both cannot be true. The meal cards summed to
     * 1802 against 1745, so the bar was right and the delta was wrong — by
     * 873 kcal, which is almost exactly half the day.
     *
     * The delta is `on the day + ASSUMED - target`, and mAssumed counted
     * every meal with no food on it as one still to come. Four of his six
     * were SKIPPED, which is the opposite claim: skipping says the food is
     * not coming and hands the share to the rest. So half the day's target
     * was being added back as food he had already said he was not eating.
     *
     * Asserted as the invariant rather than against his numbers: once no meal
     * is both empty and expected, there is nothing left to assume, so the
     * delta IS got minus target. */
    const skipPg2 = await t.fresh();
    await skipPg2.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        l: [{ id: 'f:egg_white', x: 1.5, eaten: 1 }, { id: 'f:cheddar', x: 0.5, eaten: 1 }],
        d: [{ id: 'f:cooked_beef', x: 2, eaten: 1 }, { id: 'f:potato', x: 1.5, eaten: 1 }] } }));
    });
    await skipPg2.reload();
    await skipPg2.waitForTimeout(400);
    await skipPg2.click('.tab[data-view="macros"]');
    await skipPg2.waitForTimeout(300);
    /* `[data-macro]`, not `.mbrow[data-macro]`: calories are the headline
       now and wear `.mhead`, and scoping to the old class would have quietly
       dropped them from a guard that counts four. */
    const deltaRows = () => skipPg2.evaluate(() =>
      [...document.querySelectorAll('[data-macro]')].map((r) => {
        const num = (r.querySelector('.mb-num') || {}).textContent || '';
        const m = /(-?[\d,]+)\s*\/\s*([\d,]+)/.exec(num.replace(/\s+/g, ' '));
        /* The signed figure is data-d: the words are "612 to go" now, with
           no minus to parse — parsing it and multiplying by -1 was how this
           first reported 612 against an expected -612. */
        const shown = Number((r.querySelector('.mb-d') || { dataset: {} }).dataset.d) || 0;
        return m ? { k: r.dataset.macro, got: Number(m[1].replace(/,/g, '')),
          target: Number(m[2].replace(/,/g, '')), shown: shown } : null;
      }).filter(Boolean));

    /* With empty meals still on the day the delta SHOULD differ from
       got − target — that is what the assumption is for, and asserting
       otherwise here would pass with the assumption deleted entirely. */
    const emptyDelta = await deltaRows();
    t.ok('an empty meal is still expected, so the delta is not just what is on the day',
      emptyDelta.length === 4 && emptyDelta.some((r) => r.shown !== r.got - r.target),
      JSON.stringify(emptyDelta));

    /* Now skip everything that is still empty. Skip lives in an empty meal's
       ⋯ in its sheet since 2026-10-04, so each empty tray is opened, its
       menu opened, Skip today pressed, and back to the day. */
    for (let i = 0; i < 8; i++) {
      const sk = await skipPg2.evaluate(() => {
        const b = document.querySelector('#macroSlots .mtray:not(.filled) [data-mopen]');
        return b ? b.dataset.mopen : null;
      });
      if (!sk) break;
      await openMeal(skipPg2, sk);
      await skipPg2.click('#modalRoot [data-mmenu="' + sk + '"]');
      await skipPg2.waitForTimeout(200);
      await skipPg2.click('#modalRoot .msh-menu [data-mskip="' + sk + '"]');
      await skipPg2.waitForTimeout(250);
      await closeSheet(skipPg2);
    }
    await skipPg2.waitForTimeout(300);
    const skipDelta = await deltaRows();
    t.ok('and once it is skipped it is not expected any more',
      skipDelta.length === 4 &&
      skipDelta.every((r) => Math.abs(r.shown - (r.got - r.target)) <= 1),
      JSON.stringify(skipDelta));
    /* The bar and the number beside it are one reading of one day. */
    t.ok('so the bar and the number on its own row agree',
      skipDelta.every((r) => (r.got > r.target) === (r.shown > 0) || r.got === r.target),
      JSON.stringify(skipDelta));
    await skipPg2.context().close();

    /* ---- adding does not throw the list back to the top ------------------
     * The basket's remove button used to carry `data-mpick` — the same
     * attribute the list row carries. After an add there were two elements
     * answering the same focus key, and focusKey takes the FIRST in document
     * order: the basket copy, which sits at the top of the sheet. Focusing it
     * scrolled the scrim to 0, so every add threw the list back to the top
     * from wherever you had scrolled to.
     *
     * MUST BE A REAL POINTER CLICK. `element.click()` from page script never
     * moves focus, so focusKey has nothing to restore and the bug is
     * invisible — a probe driven that way reports a preserved scroll against
     * broken code. */
    const jumpPg = await t.fresh({ viewport: { width: 320, height: 640 } });
    await jumpPg.click('.tab[data-view="macros"]');
    await jumpPg.waitForTimeout(250);
    await addOn(jumpPg);
    await jumpPg.waitForTimeout(500);
    /* One thing on the meal first: the duplicate key only ever existed once
       an add had drawn a second copy of the food above the list (the
       basket's, then; the meal's own rows, now). */
    await jumpPg.evaluate(() => {
      document.querySelectorAll('#modalRoot .mpick-row[data-mpick]')[0].click();
    });
    await jumpPg.waitForTimeout(400);
    /* Asserted on the attribute itself, not on a live duplicate count. */
    const dupKeys = await jumpPg.evaluate(() => {
      const outs = [...document.querySelectorAll('#modalRoot .mrows .mrow')];
      return { n: outs.length, borrowing: outs.filter((b) => !!b.querySelector('[data-mpick]')).length };
    });
    t.ok('the meal’s own rows do not answer the list row’s attribute',
      dupKeys.n > 0 && dupKeys.borrowing === 0, JSON.stringify(dupKeys));

    await jumpPg.evaluate(() => { document.querySelector('.scrim').scrollTop = 300; });
    await jumpPg.waitForTimeout(200);
    const target = await jumpPg.evaluate(() => {
      const w = [...document.querySelectorAll('#modalRoot .mpick-wrap')]
        .find((x) => !x.classList.contains('in') &&
          x.getBoundingClientRect().top > 250 && x.getBoundingClientRect().bottom < 560);
      if (!w) return null;
      const r = w.querySelector('.mpick-row').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + 12, id: w.querySelector('.mpick-row').dataset.mpick };
    });
    if (target) await jumpPg.mouse.click(target.x, target.y);
    await jumpPg.waitForTimeout(450);
    /* The place is where the row you tapped SITS, not only scrollTop: the
       tap now also adds a row to the meal's list above the picker, which
       would push everything down under a held scrollTop. */
    const heldScroll = await jumpPg.evaluate((id) => {
      const r = document.querySelector('#modalRoot .mpick-row[data-mpick="' + id + '"]');
      return { top: Math.round(document.querySelector('.scrim').scrollTop),
        y: r ? Math.round(r.getBoundingClientRect().y + 12) : null };
    }, target && target.id);
    /* Held by where the row SITS, not by scrollTop: since 2026-10-05 a tap
       re-fits the meal and Fits best re-ranks toward what it still needs,
       so rows above the one you tapped can move below it, and the scroll
       moves to keep yours under your finger. The bug this guards threw the
       row to the top of the sheet. */
    t.ok('and adding it leaves the row you tapped where you were reading it',
      !!target && heldScroll.y !== null && Math.abs(heldScroll.y - target.y) <= 2,
      JSON.stringify({ target, heldScroll }));
    await jumpPg.context().close();

    /* ---- the basket rides the bar, and a pick holds your place ------------
     * It used to sit in the SCROLL above the rows and grow as you picked —
     * measured at 71px after one thing, 119 after two, 167 after three — so
     * the list slid down under the finger on every tap, and once you had
     * scrolled past it the panel was off-screen (y -106) and the one question
     * it answers, "what have I got", needed scrolling back to ask.
     *
     * Two things had to change together for the place to hold. The panel came
     * out of the flow, and a picked row stopped VANISHING: it left the closers
     * band once it was in the basket and then fit worse, so it fell out of the
     * ranking too — the list went 13 rows to 10 over three taps and
     * `.mpick-wrap.in` was never once on screen. */
    /* 412x915, a Pixel, and NOT the narrow phone: at 320 the list is long
       enough that a picked row can survive inside the top ten by itself, so
       the tick assertion passes with the fix reverted. Mutation said so. */
    const barPg2 = await t.fresh({ viewport: { width: 412, height: 915 } });
    await barPg2.click('.tab[data-view="macros"]');
    await barPg2.waitForTimeout(250);
    await addOn(barPg2);
    await barPg2.waitForTimeout(500);
    t.ok('there is no basket in the list, and no bar',
      await barPg2.evaluate(() => !document.querySelector('.mp-basket, .mp-bar')));

    const heldAt = [];
    for (let i = 0; i < 3; i++) {
      /* Scroll as far as this sheet allows and READ BACK what it gave: a
         sheet shorter than the ask clamps, and comparing against the ask
         rather than the result would report a failure the browser had no
         choice about. */
      const at = await barPg2.evaluate(() => {
        const s = document.querySelector('.scrim');
        /* Deliberately short of the end. Scrolled to the very bottom of a list
           that then gets shorter, the browser must clamp and no amount of
           care can hold the position — asserting there would be asserting
           against the platform.
         *
           240 and not 40 since the closers were moved BELOW Fits best. The
           row this test finds is a recipe now, and a recipe that fits closes
           the meal outright — which retires the whole closers band, three
           rows at once, from under your finger. That is a bigger shrink than
           the old margin allowed for, and the clamp it caused was the
           platform doing its job, not the scroll restore failing. Worth
           knowing the reorder made the common case BETTER: what disappears is
           below the reader now rather than above, so it only bites at the very
           end of the list, which is exactly where nothing can help. */
        s.scrollTop = Math.min(120, Math.max(0, (s.scrollHeight - s.clientHeight) - 240));
        return Math.round(s.scrollTop);
      });
      await barPg2.waitForTimeout(200);
      const box = await barPg2.evaluate(() => {
        const w = [...document.querySelectorAll('#mpList .mpick-wrap:not(.in)')]
          .find((x) => x.getBoundingClientRect().top > 260 &&
            x.getBoundingClientRect().bottom < window.innerHeight - 90);
        if (!w) return null;
        const r = w.querySelector('.mpick-row').getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + 12, id: w.querySelector('.mpick-row').dataset.mpick };
      });
      if (!box) break;
      /* A REAL pointer click: a scripted one never moves focus, and the focus
         restore is half of what used to move the list. */
      await barPg2.mouse.click(box.x, box.y);
      await barPg2.waitForTimeout(400);
      /* Where the tapped row SITS: each tap also puts a row on the meal's
         list above the picker (2026-10-04), so a held scrollTop alone would
         let the list slide down a row per tap. */
      heldAt.push(Object.assign({ was: box.y }, await barPg2.evaluate((id) => {
        const r = document.querySelector('#mpList .mpick-row[data-mpick="' + id + '"]');
        return { now: r ? Math.round(r.getBoundingClientRect().y + 12) : null, top: Math.round(document.querySelector('.scrim').scrollTop) };
      }, box.id)));
    }
    /* The tap re-fits the meal and Fits best re-ranks (2026-10-05), so what
       sits above the row can shrink. The scroll gives that back; only at the
       very top, with nothing left to give, may the row ride up. */
    t.ok('adding something leaves the list where you were reading it',
      heldAt.length === 3 && heldAt.every((h) => h.now !== null && (Math.abs(h.now - h.was) <= 2 || (h.top === 0 && h.now < h.was))),
      JSON.stringify(heldAt));
    /* The ✓ and the green wash a picked row wears had nothing to wear them
       while picked rows disappeared. */
    t.ok('and the row you picked stays, wearing its tick',
      await barPg2.evaluate(() =>
        document.querySelectorAll('#mpList .mpick-wrap.in').length === 3));

    /* What you have picked is on the meal's own list above, all three. (Was:
       the basket bar on the bottom, opened to show what it was made of.) */
    t.ok('and the meal\u2019s list above holds all three',
      await barPg2.evaluate(() => document.querySelectorAll('#modalRoot .mrows .mrow').length >= 3));
    await barPg2.context().close();

    /* ---- searching narrows the list instead of replacing it --------------
     * Every day / Recent / the closers / Fits best were emitted only in the
     * home branch, and typing switched you out of it — so the moment you went
     * looking for something, the thinking the sheet had done for you
     * vanished. That is most of what "bouncing around" was.
     *
     * Now one box sits on the resting screen, the four bands narrow, and
     * anything else the query finds is appended underneath. */
    /* ---- an unplanned day offers whole servings, never half ones ----------
     * With targets of 0/0/0 every share is 0 and D falls to its floor, which
     * leaves the fit nothing to weigh but the overshoot term — and that is
     * smallest at the smallest portion it is allowed to try. So every ranked
     * row came back at ×½: the picker offered half a serving of everything
     * and a tap logged half a serving nobody had asked for, on the one kind
     * of day the app has already promised not to invent numbers on. */
    const noPlan = await freshBare();
    await noPlan.click('.tab[data-view="macros"]');
    await noPlan.waitForTimeout(250);
    await addOn(noPlan);
    await noPlan.waitForTimeout(500);
    await noPlan.fill('#mpFind', 'chicken');
    await noPlan.waitForTimeout(400);
    const unplannedRows = await noPlan.evaluate(() =>
      [...document.querySelectorAll('.mpick-row[data-mpx]')].map((r) => ({
        x: Number(r.dataset.mpx),
        t: r.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) })));
    t.ok('a day with no plan still has rows to offer',
      unplannedRows.length > 0, JSON.stringify(unplannedRows.slice(0, 3)));
    t.ok('and every one of them is a whole serving, not a half',
      unplannedRows.every((r) => r.x === 1),
      JSON.stringify(unplannedRows.filter((r) => r.x !== 1).slice(0, 5)));
    await noPlan.context().close();

    /* ---- the rail counts what you typed ----------------------------------
     * The chips were built from the whole pool whatever was in the box, so a
     * search left a row of shelves describing a list that had moved on — and
     * the one question you have while typing is WHERE the hits are. The
     * mockup's words: searching turns the chips into counts instead of
     * blanking them.
     *
     * Asserted on the arithmetic rather than on a number: All has to equal
     * what the other chips add up to, whatever the food table happens to hold
     * this week. */
    const railPg2 = await t.fresh({ viewport: { width: 412, height: 915 } });
    await railPg2.click('.tab[data-view="macros"]');
    await railPg2.waitForTimeout(300);
    await addOn(railPg2);
    await railPg2.waitForTimeout(500);
    const railOf = () => railPg2.evaluate(() =>
      [...document.querySelectorAll('.mp-shelf')].map((c) => ({
        k: c.dataset.mpshelf,
        n: (c.querySelector('.mp-shn') || {}).textContent || null })));
    const restingRail = await railOf();
    t.ok('a resting rail carries no counts',
      restingRail.length > 2 && restingRail.every((c) => c.n === null),
      JSON.stringify(restingRail));
    await railPg2.fill('#mpFind', 'bean');
    await railPg2.waitForTimeout(600);
    const typedRail = await railOf();
    const allChip = typedRail.filter((c) => c.k === '')[0];
    const rest = typedRail.filter((c) => c.k !== '');
    t.ok('typing turns them into counts',
      !!allChip && allChip.n !== null && rest.length > 0 && rest.every((c) => c.n !== null),
      JSON.stringify(typedRail));
    /* Guarded on the counts existing at all: Number(null) is 0, so without
       this an app that had stopped counting would satisfy "0 equals 0". */
    t.ok('and the counts add up to what All says',
      !!allChip && allChip.n !== null &&
        Number(allChip.n) === rest.reduce((s2, c) => s2 + Number(c.n), 0),
      JSON.stringify(typedRail));
    await railPg2.fill('#mpFind', '');
    await railPg2.waitForTimeout(600);
    /* And it had them to take away — otherwise this is green on an app that
       never counted. */
    t.ok('and clearing the box takes the counts away again',
      typedRail.some((c) => c.n !== null) &&
        (await railOf()).every((c) => c.n === null), JSON.stringify(await railOf()));

    /* ---- an order is a question about a long list -------------------------
     * The mockup: sorts only appear on Recipes, because a shelf of nine
     * vegetables does not need one. Both the control and the sorting itself
     * read one function — a hidden control still steering the order is an
     * invisible setting, which is the shape of half the bugs this app has had.
     */
    const sortWhen = async (fn) => {
      await fn();
      await railPg2.waitForTimeout(600);
      return railPg2.evaluate(() => ({
        lens: !!document.getElementById('mpSec'),
        sort: !!document.getElementById('mpSort') }));
    };
    t.ok('browsing recipes offers an order',
      (await sortWhen(async () => railPg2.selectOption('#mpSec', 'all'))).sort,
      'lens=all');
    t.ok('a shelf of single foods does not',
      !(await sortWhen(async () => railPg2.selectOption('#mpSec', 'foods'))).sort,
      'lens=foods');
    /* And the way back out survives a lens with nothing in it. Press a food
       shelf while the lens says "Every recipe" and you have asked for a
       recipe that is a vegetable: the band used to return nothing and take
       the lens with it, leaving no way to undo what emptied the list. */
    const stranded = await sortWhen(async () => {
      await railPg2.selectOption('#mpSec', 'all');
      await railPg2.waitForTimeout(400);
      await railPg2.evaluate(() => {
        const ch = document.querySelector('.mp-shelf[data-mpshelf="veg"]');
        if (ch) ch.click();
      });
    });
    t.ok('and an empty lens keeps the control that undoes it',
      stranded.lens && !stranded.sort, JSON.stringify(stranded));
    t.ok('and says so rather than showing a heading over nothing',
      await railPg2.evaluate(() =>
        document.querySelectorAll('.mpick-row[data-mpick]').length === 0 &&
        /nothing here in this lens/i.test(document.getElementById('mpList').textContent)),
      await railPg2.evaluate(() =>
        document.getElementById('mpList').textContent.replace(/\s+/g, ' ').trim().slice(0, 70)));
    await railPg2.context().close();

    /* ---- every control in the picker is a thumb's width ------------------
     * The mockup asks for it in three words — "Every control 44px" — and the
     * picker had never had the pass: measured at 412 and at 320 it came back
     * with twenty-seven under it, including the × that gets you out of the
     * sheet at 21x22, the camera at 36, the two selects at 23 and every shelf
     * chip at 40. The chips had been held at 40 deliberately, to keep the
     * rail from standing taller than the search box — and the search box was
     * 33 and under the line itself, so the rail was being measured against
     * something that was also wrong.
     *
     * A standing count rather than a list of sizes: a rule the whole sheet
     * has to keep is worth a test that notices a NEW control breaking it, and
     * naming today's controls would only ever check today's. */
    for (const vp of [{ width: 412, height: 915 }, { width: 320, height: 568 }]) {
      const tapPg = await t.fresh({ viewport: vp, hasTouch: true, isMobile: true });
      await tapPg.click('.tab[data-view="macros"]');
      await tapPg.waitForTimeout(300);
      await addOn(tapPg);
      await tapPg.waitForTimeout(500);
      const undersized = await tapPg.evaluate(() => {
        const out = [];
        document.querySelectorAll('#modalRoot button, #modalRoot select, #modalRoot input')
          .forEach((e) => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return;              // not drawn
            if (Math.min(r.width, r.height) >= 44) return;
            out.push(((e.className && String(e.className).split(' ')[0]) || e.id || e.tagName) +
              ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
          });
        return out;
      });
      t.ok('every control in the picker is at least 44px at ' + vp.width,
        undersized.length === 0, JSON.stringify(undersized));
      await tapPg.context().close();
    }

    /* ---- a food the storehouse has never heard of -------------------------
     * The live lookup was in the app the whole time — it is what fills a
     * packet's numbers in from the USDA — but the only thing that called it
     * was the search box inside the "Look up" tile, and the tiles went in
     * v283. So typing a food the book does not stock ended at "Nothing
     * matches american cheese." and there was no way on from there. Blake
     * hit it looking for American cheese, which the table does not carry and
     * the tables do.
     *
     * The click asserts the WIRING, not the USDA: the row is pressed and the
     * container underneath it must say it is asking. What the tables answer
     * is their business and not something a test should wait on.
     *
     * It asks for gouda now. American cheese stopped being nothing when
     * American Goulash, which carries cheese, joined the book (2026-10-06);
     * the search was right to find it, and the test wants a food the book
     * has no word for at all. */
    const look = await t.fresh({ viewport: { width: 412, height: 915 } });
    await look.click('.tab[data-view="macros"]');
    await look.waitForTimeout(250);
    await addOn(look);
    await look.waitForTimeout(600);
    const lookRow = () => look.evaluate(() => ({
      results: !!document.getElementById('nfResults'),
      says: (document.querySelector('#mpList .mslot-empty') || {}).textContent || '',
      net: (document.getElementById('nfResults') || {}).textContent || '',
    }));

    await look.fill('#mpFind', 'gouda cheese');
    await look.waitForTimeout(500);
    const dead = await lookRow();
    t.ok('a food the book does not stock still has somewhere for the answer to land',
      dead.results, JSON.stringify(dead));
    t.ok('and still says plainly that it has nothing of its own',
      /nothing matches/i.test(dead.says), JSON.stringify(dead.says));

    /* And it goes and asks, with no row to press. Any of the states mLookNet
       can be in counts — asking, answered, or refused — because what the
       tables say is their business and this is about the wiring. The query is
       still "gouda cheese" here: the two-letter case below retypes it, and
       putting this after that was checking a lookup that correctly never
       happened. */
    await look.waitForTimeout(900);
    t.ok('and asks the food tables on its own once the typing stops',
      /asking the usda|from the usda|did not answer|asked too often|no usda key|nothing came back/i
        .test((await lookRow()).net), JSON.stringify((await lookRow()).net.slice(0, 120)));

    /* Two characters is not a question worth asking somebody else's server. */
    await look.fill('#mpFind', 'am');
    await look.waitForTimeout(400);
    t.ok('two letters is not a lookup', !(await lookRow()).results);

    /* A barcode already has its own row at the top; two rows offering to look
       the same thing up is the tile problem again, smaller. */
    await look.fill('#mpFind', '01234567890');
    await look.waitForTimeout(400);
    const codeRow = await look.evaluate(() => ({
      look: !!document.getElementById('nfResults'),
      code: !!document.querySelector('[data-nfcode]') }));
    t.ok('a barcode is offered once, by the row that already did it',
      !codeRow.look && codeRow.code, JSON.stringify(codeRow));
    await look.context().close();

    /* ---- a barcode you TYPE is a barcode you asked about -------------------
     * The picker offers "Look up <number>" for anything that parses as a
     * barcode, and pressing it did nothing at all. It routes through
     * mScanGot, whose first line is a guard against a late decode arriving
     * after the camera has been stopped — and a typed number has no camera
     * behind it, so the guard ate the request. It ate it even WITH a working
     * camera: the handler renders the scan sheet and calls straight through,
     * while mScanStart only sets mCam once getUserMedia resolves, so mCam is
     * still null on the very next line. The row had never worked.
     *
     * Asserted on the asking, not on the answer: Open Food Facts is somebody
     * else's server and whether it knows a given packet is not this suite's
     * business. */
    const codePg = await t.fresh({ viewport: { width: 412, height: 915 } });
    await codePg.click('.tab[data-view="macros"]');
    await codePg.waitForTimeout(250);
    await addOn(codePg);
    await codePg.waitForTimeout(600);
    await codePg.fill('#mpFind', '028400090896');
    await codePg.waitForTimeout(500);
    const codeOffer = await codePg.evaluate(() => {
      const b = document.querySelector('[data-nfcode]');
      return { there: !!b, text: b ? b.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
    t.ok('a typed barcode is offered as a lookup', codeOffer.there, JSON.stringify(codeOffer));
    await codePg.click('[data-nfcode]');
    await codePg.waitForTimeout(250);
    t.ok('and pressing it actually asks, rather than opening a blank scanner',
      await codePg.evaluate(() => {
        const r = document.getElementById('nfResults');
        return !!r && /looking up/i.test(r.textContent);
      }),
      await codePg.evaluate(() => {
        const r = document.getElementById('nfResults');
        return 'scanSheet=' + !!document.getElementById('scanRoot') +
          ' nfResults=' + JSON.stringify(r ? r.textContent.trim() : null);
      }));
    await codePg.context().close();

    /* ---- printing a day opens it, instead of throwing -------------------
     * `mOnPaper` was assigned in both print handlers and never declared, and
     * under 'use strict' that throws. It threw on the line BEFORE
     * renderMacros(), so the unfold-for-paper pass never ran: a day with a
     * folded meal printed as dish names with no numbers on them — the exact
     * thing the comment above the handler says it exists to prevent — and
     * every print from My Day raised two uncaught ReferenceErrors.
     *
     * Asserted through the events rather than a real print dialog, which is
     * what beforeprint/afterprint are for. */
    const paper = await t.fresh({ viewport: { width: 412, height: 915 } });
    const paperErrs = [];
    paper.on('pageerror', (e) => paperErrs.push(e.message));
    await paper.click('.tab[data-view="macros"]');
    await paper.waitForTimeout(250);
    await paper.click('#macroFill');
    await paper.waitForTimeout(700);
    /* Restated for the trays (2026-10-04): nothing on the day folds, and
       every tray carries its foods with their amounts — so what went wrong
       here (a folded meal printed as dish names with no numbers) cannot, and
       printing has to leave that so and not throw. */
    /* Since 2026-10-10 a card on the day is in one of three views, and only
       Details carries the amounts; Foods carries what each food costs and
       Status is shut. Paper is what has to carry them all. */
    const amounts = () => paper.evaluate(() => {
      const lines = [...document.querySelectorAll('#macroSlots .mtray.filled .mtray-f')];
      return { n: lines.length, withAmount: lines.filter((l) => /\d/.test((l.querySelector('em') || {}).textContent || '')).length,
        withCost: lines.filter((l) => /\d/.test((l.querySelector('em, .mtray-ck') || {}).textContent || '')).length,
        shut: document.querySelectorAll('#macroSlots .mtray.filled.mv-1').length };
    });
    const before3 = await amounts();
    t.ok('a filled day\u2019s trays carry every food with its amount or what it costs',
      before3.n > 0 && before3.withCost === before3.n && before3.shut === 0, JSON.stringify(before3));
    paperErrs.length = 0;
    await paper.emulateMedia({ media: 'print' });
    await paper.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await paper.waitForTimeout(500);
    const onPaper = await amounts();
    t.ok('the day goes to the printer with its amounts, and without throwing',
      paperErrs.length === 0 && onPaper.n === before3.n && onPaper.withAmount === onPaper.n,
      'errors ' + JSON.stringify(paperErrs) + ' ' + JSON.stringify(onPaper));
    await paper.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await paper.waitForTimeout(400);
    t.ok('and comes back afterwards, still without throwing',
      paperErrs.length === 0 && (await amounts()).n === before3.n,
      JSON.stringify(paperErrs));
    await paper.context().close();
  },
});
