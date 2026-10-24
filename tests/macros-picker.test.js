/* Adding from the bar, the three foods that close a meal, the meal's four
 * gauges, controls that belong together and controls that do nothing, one
 * query rather than two, what closes the day on arrival, the box that
 * answers a number, and Look up. The last two use comboAt, set up with the
 * closing foods, so they sit in this file after them, in their original
 * order.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, addOn, pickerList, closeSheet, openTray, openRow } = require('./fixtures/nourish.js');

/* Since 2026-10-04 the day is trays and a meal's plates, its scales and its
   ⋯ live in the meal's sheet (#modalRoot .msheet), opened by its tray — the
   one place food is added or changed. A test reaching for them opens that
   sheet, leaving any other meal's first. Since 2026-10-05 the plates ride in
   a tray along the sheet's bottom, shut to a line of chips, so it opens that
   too. */
async function openMeal(pg, sk) {
  const cur = await pg.$('#modalRoot .msheet');
  if (cur) {
    if (await pg.$('#modalRoot .msh-h [data-mdot="' + sk + '"], #modalRoot .msh-h [data-mmenu="' + sk + '"]')) return;
    await closeSheet(pg);
  }
  await pg.evaluate((k) => {
    const b = document.querySelector('#macroSlots [data-mopen="' + k + '"]');
    if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
  }, sk);
  await pg.waitForTimeout(300);
  await openTray(pg);
}
async function backToDay(pg) { await closeSheet(pg); }
/* A plate added to a meal whose time has come arrives eaten, and an eaten
   plate's keys are quiet. There is no per-food tick to undo that
   (2026-10-04: "I'll complete the whole meal"), so a test that means to dial
   what it just added unticks the meal's own — the sheet's, when one is open. */
async function asPlannedMeal(pg, sk) {
  const dot = await pg.$('#modalRoot .msh-h [data-mdot="' + sk + '"][aria-pressed="true"]') ||
    await pg.$('#macroSlots [data-mdot="' + sk + '"][aria-pressed="true"]');
  if (dot) { await dot.click(); await pg.waitForTimeout(250); }
}
/* The meal's ⋯ in its sheet holds Try another, Save meal and Repeat a day. */
async function openMealMenu(pg, sk) {
  if (await pg.$('#modalRoot .msh-menu')) return;
  await pg.click('#modalRoot [data-mmenu="' + sk + '"]');
  await pg.waitForTimeout(200);
}

module.exports = nourish({
  name: 'Macros — the picker: the bar, closing a meal, a typed number, Look up',
  async suite(t) {
    /* ---- adding from the bar, balancing, and keeping --------------------- */
    const bar = await t.fresh();
    await bar.click('.tab[data-view="macros"]');
    await bar.waitForTimeout(200);
    /* One row since 2026-10-04: three tools, each an icon over its word, and
       the one primary. Adding food is not on the bar any more — a meal's tray
       is the one door to that (Blake: "ONE way to add and select food"). */
    t.ok('everything you do to today is in the bar, in one row, and adding food is not one of them',
      await bar.evaluate(() => {
        const b2 = [...document.querySelectorAll('.mday-acts button')]
          .filter((x) => !x.classList.contains('hide')).map((x) => x.id);
        const rows = new Set([...document.querySelectorAll('.mday-acts button')]
          .map((x) => Math.round(x.getBoundingClientRect().top)));
        return b2.join() === 'macroRebal,macroSweep,macroCopy,macroFill' && rows.size === 1 &&
          document.querySelector('.mday-acts').getBoundingClientRect().height < 80;
      }), await bar.evaluate(() => Math.round(document.querySelector('.mday-acts').getBoundingClientRect().height) + 'px ' +
        [...document.querySelectorAll('.mday-acts button')].map((x) => x.id).join(',')));
    /* The gear keeps the title row, because setting the day up is not
       something you do mid-scroll. Open all went with the meal screens it
       opened (2026-10-04): every tray already shows its foods. */
    t.ok('the gear keeps the title row, and there is no Open all to keep',
      await bar.evaluate(() => {
        const head = document.querySelector('.mday-head');
        const gear = document.getElementById('macroMore');
        if (!head.contains(gear) || document.getElementById('macroOpenAll')) return false;
        const h = head.getBoundingClientRect(), g = gear.getBoundingClientRect();
        return g.left > document.getElementById('macroNext').getBoundingClientRect().right &&
          h.right - g.right < 24;
      }), await bar.evaluate(() =>
        'gear in head ' + document.querySelector('.mday-head').contains(document.getElementById('macroMore')) +
        ' / Open all ' + !!document.getElementById('macroOpenAll')));
    /* The bar's barcode button has gone — it opened the same sheet the plus
       opens, one step further in, and that sheet carries a camera in its own
       search field. Blake: "the plus button and the scanner button are the
       same thing. In both cases I should be able to open up and scan
       something right away." So the claim is now about the sheet: one door,
       and the lens inside it. */
    t.ok('the bar has no second door to the same sheet',
      await bar.evaluate(() => !document.getElementById('macroScan')));

    /* A tray opens its own meal's sheet: the meal is named by the door you
       came in by, so there is no "which meal?" to ask. */
    await openMeal(bar, 'd');
    t.ok('the dinner tray opens the sheet for dinner',
      await bar.evaluate(() => {
        const s2 = document.querySelector('#modalRoot .msheet');
        return !!s2 && /Dinner/i.test(s2.getAttribute('aria-label') || '') &&
          !document.querySelector('[data-mpslot]');
      }));

    // three raw foods onto dinner, through the one box
    await pickerList(bar);
    await bar.waitForTimeout(200);
    /* Typing a food's name has to show that food. Dozens of recipes list
       honey among their ingredients and every one of them fills a dinner
       better than a spoonful does, so ranked on fit alone the row the search
       was for sinks below a twelve-row box. The word you typed is the whole
       of the question. */
    await bar.fill('#mpFind', 'honey');
    await bar.waitForTimeout(400);
    t.ok('searching a food by name puts the food itself on top',
      await bar.evaluate(() => {
        const rows = [...document.querySelectorAll('.mpick-row[data-mpick]')];
        return rows.length > 0 && rows[0].dataset.mpick.indexOf('f:') === 0;
      }));

    /* Each tap puts the food on dinner at once (2026-10-04: no basket, no
       Add N), and the plates arrive in the tray under the picker (2026-10-05):
       a chip each while it is shut, a row each when it is open, as it is here. */
    for (const q of ['chicken breast', 'honey', 'peanut']) {
      await bar.fill('#mpFind', q);
      await bar.waitForTimeout(400);
      await bar.evaluate(() => {
        const r = [...document.querySelectorAll('.mpick-row[data-mpick]')]
          .find((x) => x.dataset.mpick.indexOf('f:') === 0);
        if (r) r.click();
      });
      await bar.waitForTimeout(250);
    }
    const tapped = await bar.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const day = d[Object.keys(d).sort().pop()] || {};
      return { plates: (day.d || []).length, chips: document.querySelectorAll('#modalRoot .msh-tray .msh-chip').length,
        rows: document.querySelectorAll('#modalRoot .msh-on .mrow, #modalRoot .msh-tray .mrow').length };
    });
    t.ok('each tap puts its food on the meal there and then, in the tray under the picker',
      tapped.plates === 3 && (tapped.chips === 3 || tapped.rows === 3), JSON.stringify(tapped));
    // its tick undone so the plates can be dialled
    await asPlannedMeal(bar, 'd');
    /* Balance sits in the tray under the thumb (2026-10-05; it was the
       scales on the sheet's head) and Save meal in the ⋯: both offered, one
       tap and two away. */
    const balOffered = await bar.evaluate(() => {
      const b2 = document.querySelector('#modalRoot .msh-tray [data-mbal="d"]');
      return !!b2 && !b2.disabled;
    });
    await openMealMenu(bar, 'd');
    t.ok('a meal of parts offers to be balanced and to be kept',
      balOffered && await bar.evaluate(() => !!document.querySelector('#modalRoot .msh-menu [data-mkeep="d"]')));

    /* Knock the portions out of shape, then solve them. The target of a meal
       is its weight's worth of the DAY — not what is left of the day after
       it, which is the picker's question and would solve a meal already on
       target down to a quarter of itself.
     *
       Since the meal re-fits itself (2026-10-05), + on one plate is answered
       by the others giving way, so every plate is pushed up: each + marks
       its plate Kept, and Balance is what lets them all move again. */
    await openTray(bar);
    await bar.evaluate(() => {
      for (let n = 0; n < 4; n++) {
        for (let i = 0; i < 3; i++) {
          const b2 = document.querySelector('#modalRoot [data-mstep="d:' + i + ':up"]');
          if (b2) b2.click();
        }
      }
    });
    await bar.waitForTimeout(350);
    /* Read off the day itself rather than off a label. The header pill used
       to carry "N over" and this parsed it; the pill is now only on an empty
       meal, because the macro pills on the row say it per macro instead. The
       thing being tested was never the wording. */
    const gapOf = () => bar.evaluate(() => {
      const L = window.__macroLab, T = L.targets(), day = L.read();
      const dayK = 4 * T.p + 4 * T.c + 9 * T.f;
      let sumW = 0;
      day.meals.forEach((m) => { sumW += m.w; });
      const me = day.meals.find((m) => m.k === 'd');
      if (!me) return 0;
      let kc = 0;
      me.items.forEach((it) => { kc += it.kcal * it.x; });
      return Math.abs(Math.round(kc - dayK * me.w / sumW));
    });
    const wasOff = await gapOf();
    await bar.click('#modalRoot [data-mbal="d"]');
    await bar.waitForTimeout(500);
    const nowOff = await gapOf();
    t.ok('balancing a meal moves it toward its share, not away',
      nowOff < wasOff / 2, wasOff + ' off -> ' + nowOff + ' off');

    /* Kept to yourself means kept to yourself: the household document is
       where recipes live, and four scanned packets are not everyone's. */
    await openMealMenu(bar, 'd');
    await bar.click('[data-mkeep="d"]');
    await bar.waitForTimeout(300);
    await bar.fill('#mkName', 'Chicken Rice Bowl');
    await bar.click('[data-mkdo="mine"]');
    await bar.waitForTimeout(450);
    t.ok('keeping it to yourself puts it in your account, not the household',
      await bar.evaluate(() =>
        JSON.stringify(window.Store.state.mine || {}).indexOf('Chicken Rice Bowl') < 0 &&
        (localStorage.getItem('bsc.myFoods') || '').indexOf('Chicken Rice Bowl') >= 0));
    t.ok('and the parts collapse into the one thing they were describing',
      await bar.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = d[Object.keys(d)[0]];
        return day.d.length === 1 && String(day.d[0].id).indexOf('f:my:') === 0;
      }));
    await bar.context().close();

    /* ---- three foods that close the meal ---------------------------------
     * A food taking most of its energy from ONE macro is a knob you can turn
     * without disturbing the other two, and three of them reach any P/F/C
     * combination exactly. The panel is that, made tappable. */
    const comboAt = async (seed) => {
      const pg = await t.fresh();
      await pg.evaluate((cfg) => {
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        const days = {};
        for (let i = 8; i >= 1; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          days[key(d)] = cfg.hist
            ? { b: cfg.hist.map((id) => ({ id: id, x: 1, eaten: 1 })), l: [], d: [], s: [] }
            : { b: [], l: [], d: [], s: [] };
        }
        days[key(new Date())] = { b: [], l: [], d: [], s: [] };
        const g = new Date(); g.setDate(g.getDate() + 120);
        localStorage.setItem('bsc.macroDays', JSON.stringify(days));
        const pr = { sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
          goalLb: 175, goalBy: key(g), workouts: 4, steps: 8000 };
        localStorage.setItem('bsc.macroProfile', JSON.stringify(pr));
        /* The plan this profile actually asks for, written down rather than
           left to the suite's 180/50/50 placeholder. That placeholder used to
           be rewritten on read, because 1,370 fell under the old 1,500 floor
           for a man — so this fixture has always run against the profile's
           real plan, by accident. With the floor at the clinical 1,200 the
           placeholder stands, the meal's gaps shrink, and a band that offers
           one food per OPEN macro correctly offered two. State the plan. */
        const plan = window.__macroLab.plan(pr);
        localStorage.setItem('bsc.macroTargets',
          JSON.stringify({ p: plan.p, f: plan.f, c: plan.c }));
      }, seed || {});
      await pg.reload();
      await pg.waitForTimeout(400);
      await pg.click('.tab[data-view="macros"]');
      await pg.waitForTimeout(250);
      await addOn(pg);       // breakfast
      await pg.waitForTimeout(300);
      return pg;
    };

    /* The foods that close the meal are rows in the list now, not a panel of
       their own — read the way the list is read: a heading, then every row
       under it until the next heading. */
    const closersOf = (pg) => pg.evaluate(() => {
      const kids = [...document.querySelectorAll('#modalRoot .mt-div, #modalRoot .mpick-wrap')];
      let on = false;
      const out = { cap: null, names: [], prot: 0, panel: !!document.querySelector('.mcombo') };
      for (const el of kids) {
        if (el.classList.contains('mt-div')) {
          if (on) break;
          if (/that closes?\b/.test(el.textContent)) { on = true; out.cap = el.textContent; }
          continue;
        }
        if (!on) continue;
        out.names.push((el.querySelector('.mp-name') || {}).textContent);
        const m = /(\d+)P/.exec(el.textContent);
        if (m) out.prot += Number(m[1]);
      }
      return out;
    });

    const comboPage = await comboAt();
    const cbo = await closersOf(comboPage);
    t.ok('the picker offers three foods, one per macro, as rows in the list',
      cbo.names.length === 3, JSON.stringify(cbo));
    /* Blake: "instead of the three foods that close the day, just put them in
       my suggested foods area." No second way to read a food, no second way
       to add one. */
    t.ok('and no panel of its own above the list',
      !cbo.panel && /^Three foods that close /.test(cbo.cap || ''), JSON.stringify(cbo.cap));

    /* The bug this had on its first outing: pointed at the DAY it asked three
       foods to BE a day. Every portion pegged at the ×4 ceiling -- four cans
       of tuna -- and still came up short, because no three foods are 180 g of
       protein. It is aimed at the meal's share of the gap.
     *
       Summed off the rows the page actually renders, which is also the check
       that the rows carry the combo's own portions rather than a ranked
       one. */
    const cboFit = await comboPage.evaluate((p) => {
      const t2 = window.__macroLab.targets();
      return { p: p, day: t2.p, share: t2.p / 4 };
    }, cbo.prot);
    t.ok('and it is a meal, not the whole day, asked of three foods',
      cboFit.p > cboFit.share * 0.6 && cboFit.p < cboFit.day * 0.6, JSON.stringify(cboFit));

    /* Purity says oil is the best fat lever on the shelf, at 100%. It is also
       not breakfast. A food you can eat as it comes outranks a thing that
       goes ON food, and the rung below is where the oil lives. */
    t.ok('and no rung opens on a condiment while there is a food for it',
      cbo.names.length === 3 &&
      cbo.names.every((n) => !/^(Oil|Butter|Mayo|Light mayo|Ranch|Light ranch)$/.test(n)),
      cbo.names.join(' | '));
    /* The control for the history test below, taken while this page is still
       open and from the same source, so the two are comparable. */
    const noHistLevers = await comboPage.evaluate(() =>
      (window.__macroLab.closers() || []).map((c) => c.name));
    await comboPage.context().close();

    /* Reproduced from the shape of Blake's own screenshot: a day whose fat
       is mostly spent by the evening, so the last meal's fat rung has
       nothing left to move and drops out. Two earlier guesses at this seed
       both produced three rungs, and the test passed on the three-branch
       while the two-branch — the one that was actually broken — went
       unexercised. */
    const comboPage2 = await t.fresh();
    await comboPage2.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:cheddar', x: 1, eaten: 1 }, { id: 'f:egg', x: 3, eaten: 1 }],
        l: [{ id: 'f:peanut_butter', x: 2, eaten: 1 }], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
    });
    await comboPage2.reload();
    await comboPage2.waitForTimeout(400);
    await comboPage2.click('.tab[data-view="macros"]');
    await comboPage2.waitForTimeout(300);
    // the last meal's sheet, opened by its tray
    const lastMeal = await comboPage2.evaluate(() => {
      const hs = [...document.querySelectorAll('#macroSlots .mtray-b[data-mopen]')];
      return hs.length ? hs[hs.length - 1].dataset.mopen : null;
    });
    await openMeal(comboPage2, lastMeal);

    /* The heading says how many foods are actually under it. A meal whose
       protein is already covered gets two levers, and the old panel read
       "Three foods for dinner" over two rows.
     *
       Pinned to FEWER THAN THREE and to the words agreeing with the count,
       never to exactly two: the targets are carb-cycled by weekday, so a rest
       day's smaller carb gap closes a second rung and only one is offered.
       The seed cannot control the weekday, so the assertion must not depend
       on it — and it is still not vacuous, because the broken branch said
       "Three" over whatever it drew. */
    const counted = await closersOf(comboPage2);
    t.ok('the heading counts the foods actually under it',
      counted.names.length > 0 && counted.names.length < 3 && (
        (counted.names.length === 2 && /^Two foods that close /.test(counted.cap)) ||
        (counted.names.length === 1 && /^One food that closes /.test(counted.cap))),
      JSON.stringify(counted));
    await comboPage2.context().close();

    /* Two rules, and this pins the second one.
     *
       A food may now carry `meals`, which GATES the meals it can be offered
       at unasked -- canned tuna is not breakfast, and no amount of protein
       per calorie was ever going to work that out. See tools/food-db.js. What
       ORDERS the foods that pass that gate is still, and only, what you have
       put in THIS meal before. Slots are still yours to name: a meal you made
       yourself has no kind to judge against and is never gated at all.
     *
       Whey rather than egg whites, which this used to seed with. Egg whites
       are the purest protein the breakfast gate admits, so they now open the
       band on their own and the assertion could no longer tell history from
       the default -- it passed against itself. The seed has to be a food the
       ordering must MOVE, and it also has to clear MLEV_PURE or it is not on
       the bench to be moved: cottage cheese reads like a breakfast protein
       and is 52% of its calories, so it never appears at all.
       The control above shares every other condition, so a failure here is
       the history and nothing else. */
    /* Read off the bench, not the rendered rows. A food you ate yesterday is
       claimed by "Recent" and deduped out of the closers band, so the DOM
       stopped being able to show which rung it opened — which is a rendering
       fact, and this assertion is about the rule. */
    const histPage = await comboAt({ hist: ['f:whey', 'f:salsa'] });
    const withHist = await histPage.evaluate(() =>
      (window.__macroLab.closers() || []).map((c) => c.name));
    t.ok('a week of whey at breakfast puts whey at the top of it',
      withHist[0] === 'Whey protein' && noHistLevers[0] !== 'Whey protein',
      'no history: ' + noHistLevers.join(' | ') + ' -- with: ' + withHist.join(' | '));

    /* Ordinary rows: since 2026-10-04 a tap puts the food on the meal itself
       at the portion the row offered (Blake: no basket, no "Add N"), and it
       wears the ✓ so a second tap can take it back off. */
    const offered = (await closersOf(histPage)).names.length;
    for (let i = 0; i < offered; i++) {
      await histPage.evaluate((nm) => {
        const row = [...document.querySelectorAll('#modalRoot .mpick-wrap')]
          .find((w) => (w.querySelector('.mp-name') || {}).textContent === nm &&
            !w.classList.contains('in'));
        if (row) row.querySelector('.mpick-row').click();
      }, (await closersOf(histPage)).names[0]);
      await histPage.waitForTimeout(300);
    }
    const onMeal = await histPage.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const p2 = (x) => (x < 10 ? '0' : '') + x;
      const dd = new Date();
      const k = dd.getFullYear() + '-' + p2(dd.getMonth() + 1) + '-' + p2(dd.getDate());
      return { plates: ((d[k] || {}).b || []).length, ticked: document.querySelectorAll('#modalRoot .mpick-wrap.in').length,
        rows: document.querySelectorAll('#modalRoot .mrows .mrow').length };
    });
    t.ok('tapping them puts them on the meal at once, each row ticked',
      offered > 0 && onMeal.plates === offered && onMeal.rows === offered && onMeal.ticked >= offered,
      'offered ' + offered + ', ' + JSON.stringify(onMeal));

    /* And once the meal is closed by them, more foods to close it is not
       help — the heading goes with them. */
    t.ok('and it stops offering once there is nothing left to close',
      (await closersOf(histPage)).cap === null);
    await histPage.context().close();

    /* ---- the meal's four gauges ------------------------------------------
     * Calories and P/F/C on the meal's own seam, each read against a tick
     * where the plan is. */
    const gaugePage = await t.fresh();
    await gaugePage.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:egg', x: 3, eaten: 1 }, { id: 'f:cheddar', x: 0.25, eaten: 1 }],
        l: [{ id: 'f:chicken_breast', x: 1, eaten: 0 }],
        d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
        goalLb: 175, goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000,
      }));
    });
    await gaugePage.reload();
    await gaugePage.waitForTimeout(400);
    await gaugePage.click('.tab[data-view="macros"]');
    await gaugePage.waitForTimeout(350);
    /* A meal's tray carries its pills small (2026-10-05) and its sheet the
       full ones — so the gauges are read there, a meal at a time, and the
       tray read for what its flame pill says. */
    const trays = await gaugePage.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray')].map((tr) => {
      const kEl = tr.querySelector('.mtray-caps .mcap');
      /* An empty meal is one row since 2026-10-11 and says what it is for
         in faint type beside its name ("272 kcal"), with nothing yet against it. */
      const aim = tr.querySelector('.mtray-aim');
      const k = aim ? '0 / ' + aim.textContent.replace(/\D/g, '') : (kEl || {}).textContent || '';
      const m = /([\d,]+)\s*\/\s*([\d,]+)/.exec(k.trim()) || [];
      const n = (x) => Number(String(x || '').replace(/,/g, ''));
      return { sk: tr.querySelector('[data-mopen]').dataset.mopen, name: tr.querySelector('.mtray-n').textContent,
        got: n(m[1]), want: n(m[2]), filled: tr.classList.contains('filled'), shut: tr.classList.contains('mv-1'),
        verdict: !!kEl && (kEl.classList.contains('over') || kEl.classList.contains('on')),
        foods: tr.querySelectorAll('.mtray-f:not(.mtray-none)').length, h: Math.round(tr.getBoundingClientRect().height),
        say: tr.querySelector('.mtray-b').getAttribute('aria-label') || '' };
    }));
    const gz = [];
    for (const tr of trays) {
      await openMeal(gaugePage, tr.sk);
      const caps = await gaugePage.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-top .mcap')].map((c) => {
        const t2 = c.querySelector('.mcap-t');
        const em = t2.querySelector('em');
        return { l: t2.textContent, v: Number(t2.textContent.replace(em ? em.textContent : '', '').replace(/[^\d]/g, '')),
          want: Number(c.dataset.want || 0), cls: c.classList.contains('over') ? 'over' : c.classList.contains('on') ? 'on' : '',
          fill: parseFloat(c.querySelector('.mcap-fl').style.width || 0) };
      }));
      gz.push(Object.assign({}, tr, { caps: caps }));
    }
    await closeSheet(gaugePage);
    const fed = gz.filter((c) => c.filled);
    const noFood = gz.filter((c) => !c.filled);

    t.ok('a meal with food carries four gauges, calories among them',
      fed.length >= 2 && fed.every((c) => c.caps.length === 4 && /🔥/.test(c.caps[0].l)),
      JSON.stringify(fed.map((c) => c.name + ':' + c.caps.length)));

    t.ok('and every pill states the target it is filling toward',
      fed.length > 0 && fed.every((c) => c.caps.every((g) => g.want > 0)),
      JSON.stringify(fed[0] && fed[0].caps));

    /* Two spellings of one fact is how facts diverge: the tray's door says the
       meal's numbers aloud ("… 280 of 316 kcal …"), and every figure it says
       must be one a pill in the sheet prints. */
    t.ok('and what the pills claim is what the tray says out loud',
      fed.length > 0 && fed.every((c) => {
        const said = [...c.say.matchAll(/(\d+) of (\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
        return said.length >= 2 && said.every((p2) => c.caps.some((g) => g.v === p2[0] && g.want === p2[1]));
      }),
      JSON.stringify(fed.map((c) => c.say + ' || ' + c.caps.map((g) => g.v + '/' + g.want).join(' '))));

    /* A plate past its share fills its pill and prints how far past. */
    const pastPlan = [];
    fed.forEach((c) => c.caps.forEach((g) => { if (g.cls === 'over') pastPlan.push(g); }));
    t.ok('a plate past the plan says how far past, not merely that it is',
      pastPlan.length > 0 && pastPlan.every((g) => g.fill >= 99 && g.v > g.want),
      JSON.stringify(pastPlan));

    /* Colour says whether it matters; length says how much. They may not
       contradict — a short bar painted green is unreadable.
     *
       Asked of whatever the seed happened to draw, this proved nothing: the
       cap only bites in a narrow window and no plate on an arbitrary day
       lands in it. So it asks the rule directly. A five-meal day gives each
       meal a fifth of the target, and the day-relative floor alone would
       forgive a miss of a tenth of the DAY — which is half of that meal's
       whole share. Half short is not "landed" however little it moves the
       day. */
    const bandRule = await gaugePage.evaluate(() => {
      const day = 200, want = day * 0.2;            // 40 g, a fifth of the day
      const at = (frac) => window.__macroLab.gauge(want * frac, want, day).st;
      return { half: at(0.55), most: at(0.85), on: at(1.0), past: at(1.6) };
    });
    t.ok('and nothing is painted landed while its bar is nowhere near the tick',
      bandRule.half === 'u' && bandRule.most === 'o' &&
      bandRule.on === 'o' && bandRule.past === 'x', JSON.stringify(bandRule));

    /* Blake: "I don't like the at it's share. it's not intuitive to me." The
       number survives; the vocabulary does not. */
    t.ok('an empty meal says what it is for with no vocabulary to learn',
      noFood.length > 0 && noFood.every((c) => c.want > 0) &&
      !(await gaugePage.evaluate(() => /at its share/i.test(document.body.textContent))),
      JSON.stringify(noFood.map((c) => c.name + ':' + c.got + '/' + c.want)));

    /* Blake, on his own breakfast: "I can't see what my target macros are
       from the main screen. I simply want this breakfast to show a greyed out
       target number instead of zeros." An empty tray prints what it is for,
       its calories against its share: nothing yet, out of the target. */
    t.ok('a meal with nothing on it prints its target, not a bare nought',
      noFood.length > 0 && noFood.every((c) => c.got === 0 && c.want > 0),
      JSON.stringify(noFood.map((c) => c.name + ' ' + c.got + '/' + c.want)));

    /* An eaten meal's card starts shut to its Status since 2026-10-10 —
       circles, not numbers — so there it is its sheet that prints it. */
    t.ok('while a meal with food on it still prints the food: in its sheet, and on its card unless shut to Status',
      fed.length > 0 && fed.every((c) => c.caps[0].v > 0 && (c.shut || c.got > 0)) && fed.some((c) => !c.shut),
      JSON.stringify(fed.map((c) => c.name + ' ' + c.got + '/' + c.want)));

    /* Quiet, still: an empty meal wears no verdict colour, about food the day
       has not got to yet. The colour arrives with the food. */
    t.ok('and it reads quietly — no verdict on an empty meal',
      noFood.length > 0 && noFood.every((c) => !c.verdict),
      JSON.stringify(noFood.map((c) => c.name + ':' + c.verdict)));
    t.ok('while a fed meal wears its verdict in colour',
      fed.length > 0 && fed.some((c) => c.caps.some((g) => g.cls)),
      JSON.stringify(fed.map((c) => c.name + ':' + c.caps.map((g) => g.cls || '-').join('|'))));

    /* An empty tray used to be as tall as one holding a single food, saying
       "Nothing yet" on the line the food would take. Blake, 2026-10-11: "I
       don't like seeing that expanded and 'nothing yet'... a collapsed card".
       So it is one row now, shorter than any meal with food on it. */
    const one = gz.filter((c) => c.foods === 1);
    t.ok('and a blank meal is one row, shorter than a one-food one, with no "Nothing yet"',
      one.length > 0 && noFood.length > 0 && noFood.every((c) => c.h < one[0].h && c.h < 70 && c.foods === 0),
      JSON.stringify(gz.map((c) => c.name + ':' + c.foods + ':' + c.h)));

    t.ok('and the meal keeps its whole name at phone width',
      await gaugePage.evaluate(() =>
        [...document.querySelectorAll('#macroSlots .mtray-n')]
          .every((n) => n.scrollWidth <= n.clientWidth + 1)),
      await gaugePage.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray-n')]
        .filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent).join(', ')));
    await gaugePage.context().close();

    /* ---- a tinyPhone's targets44 ---------------------------------------------------
     * The lock was 34x33, the keys 44 wide but 33 tall, and the eaten
     * checkbox a 46 px label wrapped around a 17 px box — the thing that
     * LOOKED like the target and the thing that WAS one were different
     * sizes. Measured on a real phone viewport, not asserted from the CSS,
     * because `width` inside a flex row is only a suggestion: a plate with a
     * long yield noun squeezed all three to 36 while the rule still said 44. */
    const tinyPhone = await t.fresh({ viewport: { width: 320, height: 900 }, hasTouch: true, isMobile: true });
    await tinyPhone.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      /* a recipe as well as a food, so the long yield noun is in play */
      const long = (window.RECIPES.find((r) => /container|meal prep/i.test(r.servings || '')) ||
        window.RECIPES.find((r) => r.macro && r.macro.kcal > 200) || {}).id;
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:whey', x: 1, eaten: 0 }].concat(long ? [{ id: long, x: 1.75, eaten: 0 }] : []),
        l: [], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
    });
    await tinyPhone.reload();
    await tinyPhone.waitForTimeout(400);
    await tinyPhone.click('.tab[data-view="macros"]');
    await tinyPhone.waitForTimeout(300);
    await openMeal(tinyPhone, 'b');

    /* Re-aimed at the meal sheet (2026-10-04): every food is one compact row
       — name and small print, then − grams + and ⋯ — and the sheet's head
       carries the meal's tick, the scales, its ⋯ and ×. Blake: "controls no
       larger than the food text needs, while keeping 44 px tap targets."
       So the reach is measured, not the drawing: how far from its centre a
       thumb can land and still hit the control (elementFromPoint, so the
       invisible ring a small key carries counts). 44 tall for everything;
       wide enough (34) not to be a sliver. */
    await openRow(tinyPhone, 'b:0');
    const targets44 = await tinyPhone.evaluate(() => {
      const reach = (el) => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const on = (x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
        let up = 0, dn = 0, lf = 0, rt = 0;
        while (up < 40 && on(cx, cy - up - 1)) up++;
        while (dn < 40 && on(cx, cy + dn + 1)) dn++;
        while (lf < 40 && on(cx - lf - 1, cy)) lf++;
        while (rt < 40 && on(cx + rt + 1, cy)) rt++;
        return { w: lf + rt + 1, h: up + dn + 1, what: (el.getAttribute('data-mstep') ? 'key ' + el.getAttribute('data-mstep')
          : el.className.split(' ')[0] || el.tagName) };
      };
      /* What is on screen: every food's line, and the dial, Details and ⋯ of
         the one open (a shut line keeps its drawer unseen since 2026-10-24). */
      const els = [...document.querySelectorAll('#modalRoot .mrows .mrow [data-mrowopen], #modalRoot .mrows .mrow [data-mstep], #modalRoot .mrows .mrow .mstep-x, ' +
        '#modalRoot .mrows .mrow [data-mfmenu], #modalRoot .mrows .mrow .mrow-door, #modalRoot .msh-h button, #modalRoot .msh-acts button')]
        .filter((e) => e.getClientRects().length);
      const all = els.map(reach);
      return { n: els.length, keys: all.filter((x) => /^key/.test(x.what)).length, small: all.filter((x) => x.h < 44 || x.w < 34) };
    });
    t.ok('every control on a plate is a thumb wide at the narrowest phone',
      targets44.n >= 8 && targets44.keys >= 2 && targets44.small.length === 0,
      JSON.stringify(targets44));

    /* What has to hold one line at 320 is the dial: −, the grams and +, side
       by side, none over its neighbour, and the row not scrolling sideways. */
    const strip320 = await tinyPhone.evaluate(() => [...document.querySelectorAll('#modalRoot .mrows .mrow.mrow-open')].map((row) => {
      const R = (e) => e.getBoundingClientRect();
      const dial = row.querySelector('.mrow-dial');
      const parts = [row.querySelector('[data-mstep$=":down"]'), row.querySelector('.mstep-x'), row.querySelector('[data-mstep$=":up"]')];
      if (!dial || parts.some((e) => !e)) return { missing: true };
      const bar = R(dial);
      return { sameLine: parts.every((e) => R(e).top >= bar.top - 1 && R(e).bottom <= bar.bottom + 1),
        clear: parts.every((e, i) => !i || R(e).left >= R(parts[i - 1]).right - 1),
        fits: row.scrollWidth <= row.clientWidth + 1, amt: Math.round(R(parts[1]).width) };
    }));
    t.ok('a food’s dial fits one line at 320, each control clear of the one before',
      strip320.length === 1 && strip320.every((x) => !x.missing && x.sameLine && x.clear && x.fits),
      JSON.stringify(strip320));

    /* The meal's own verbs on the sheet's head, drawn without words, each
       named aloud; Try another, Save meal and Repeat a day are worded inside
       the ⋯ rather than drawn on the face. Since 2026-10-05 the head is the
       tick and the ⋯ alone: Balance and Done went down to the tray, worded,
       where the thumb is. */
    const verbs320 = await tinyPhone.evaluate(() => {
      const row = document.querySelector('#modalRoot .msh-h');
      if (!row) return null;
      const bs = [...row.querySelectorAll(':scope > button')];
      return {
        n: bs.length,
        rows: new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top))).size,
        worded: bs.filter((b) => { const w = b.querySelector('span'); return w && w.getBoundingClientRect().width > 0; }).length,
        // the tick is a ring drawn in CSS, × a glyph; every other verb is a drawing
        drawn: bs.filter((b) => b.hasAttribute('data-mdot') || b.classList.contains('sheet-x') ||
          (b.querySelector('svg') && b.querySelector('svg').getBoundingClientRect().width > 0)).length,
        unnamed: bs.filter((b) => !/\w/.test(b.getAttribute('aria-label') || '')).map((b) => b.className),
      };
    });
    t.ok('at 320 a meal’s verbs are drawings on one row, each named aloud',
      !!verbs320 && verbs320.n >= 2 && verbs320.rows === 1 && verbs320.worded === 0 &&
        verbs320.drawn === verbs320.n && verbs320.unnamed.length === 0,
      JSON.stringify(verbs320));

    /* The glyphs are the size the plate asks for, as a ceiling, so a stray
       rule cannot quietly blow them up. */
    t.ok('and the glyph inside it is the size the plate asks for, not a leftover',
      await tinyPhone.evaluate(() => {
        const g = [...document.querySelectorAll('#modalRoot .mrow-more svg, #modalRoot .msh-i svg')];
        return g.length >= 3 && g.every((e) => Math.round(e.getBoundingClientRect().width) <= 22);
      }),
      await tinyPhone.evaluate(() => [...new Set(
        [...document.querySelectorAll('#modalRoot .mrow-more svg, #modalRoot .msh-i svg')]
          .map((e) => Math.round(e.getBoundingClientRect().width)))].join(', ')));

    /* The star reaches everything a plate can hold.
     *
       Blake, on a breakfast of it: "I am not seeing a star on Greek yogurt.
       Why?" The control asked whether the thing was a recipe, so it was
       drawn for half of what a plate can carry. It lives in the food's ⋯
       since 2026-10-04, as Favourite. The plate here holds `f:whey`, a food
       out of the reference table. */
    const favMenu = async () => {
      if (!(await tinyPhone.$('#modalRoot .mrow-menu'))) {
        await openRow(tinyPhone, 'b:0');
        await tinyPhone.click('#modalRoot [data-mfmenu="b:0"]');
        await tinyPhone.waitForTimeout(250);
      }
    };
    await favMenu();
    const foodStar = await tinyPhone.evaluate(() =>
      !!document.querySelector('#modalRoot .mrow-menu [data-mfav="f:whey"]'));
    t.ok('a food from the table offers Favourite, the same as a recipe', foodStar);
    if (foodStar) {
      await tinyPhone.click('#modalRoot .mrow-menu [data-mfav="f:whey"]');
      await tinyPhone.waitForTimeout(250);
      await favMenu();
      t.ok('and tapping it keeps the food',
        await tinyPhone.evaluate(() => window.Store.isFav('f:whey') === true &&
          document.querySelector('#modalRoot .mrow-menu [data-mfav="f:whey"]')
            .getAttribute('aria-pressed') === 'true'));
      // put it back, so the rows below are measured on the same plate
      await tinyPhone.click('#modalRoot .mrow-menu [data-mfav="f:whey"]');
      await tinyPhone.waitForTimeout(250);
    }

    /* And the row still fits — targets that overflow are not a fix. */
    t.ok('and the row still fits without scrolling sideways',
      await tinyPhone.evaluate(() =>
        [...document.querySelectorAll('#modalRoot .mitem-r2')].every((e) => e.scrollWidth <= e.clientWidth + 1) &&
        document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    /* "A portion either fits or gets its own row; it never gets clipped." A
       portion that silently loses its last letters is the app misreporting
       what you ate, which is the one thing this tab is for. */
    t.ok('and no portion on it is clipped, on the narrowest phone there is',
      await tinyPhone.evaluate(() =>
        [...document.querySelectorAll('#modalRoot .mstep-x')].length > 0 &&
        [...document.querySelectorAll('#modalRoot .mstep-x')].every((e) =>
          e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1)),
      await tinyPhone.evaluate(() =>
        [...document.querySelectorAll('#modalRoot .mstep-x')].map((e) =>
          JSON.stringify(e.textContent.trim()) + ' box ' + Math.round(e.clientWidth) + 'x' +
          Math.round(e.clientHeight) + ' needs ' + e.scrollWidth + 'x' + e.scrollHeight).join(' | ')));
    await tinyPhone.context().close();

    /* ---- and the spacing says which controls belong together -------------
     * The stylesheet has claimed "two groups, and air between them" since the
     * chrome came off this row, and for a while it was not true: measured at
     * 390, the white between the three glyphs was 29px and the white between
     * the dial and the first of them was 24. The gap INSIDE the group was
     * wider than the gap AROUND it, so proximity argued against the grouping
     * and the row read as five scattered things. Blake, off his own phone:
     * "work on the spacing of the buttons".
     *
     * Measured rather than read off the CSS, because the gap is not in the
     * CSS: it is 44 minus the glyph, and the glyph is set three rules away.
     * That is exactly why nothing here caught it the first time. */
    const spacePhone = await t.fresh({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true });
    await spacePhone.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:whey', x: 1, eaten: 0 }], l: [], d: [], s: [] } }));
    });
    await spacePhone.reload();
    await spacePhone.waitForTimeout(400);
    await spacePhone.click('.tab[data-view="macros"]');
    await spacePhone.waitForTimeout(300);
    await openMeal(spacePhone, 'b');
    /* The food's ⋯ in the meal sheet (2026-10-04) is a short worded list:
       Lock, Swap, Pin, Favourite, then Remove last — the destructive one at
       the end, in the warning colour, never in the middle of the others. */
    await openRow(spacePhone, 'b:0');
    await spacePhone.click('#modalRoot [data-mfmenu="b:0"]');
    await spacePhone.waitForTimeout(250);
    const spacing = await spacePhone.evaluate(() => {
      const icons = [...document.querySelectorAll('#modalRoot .mrow-menu button')];
      if (icons.length < 3) return null;
      const g = icons.map((e) => e.getBoundingClientRect());
      const bin = icons.findIndex((e) => e.hasAttribute('data-mdel'));
      const air = (a2, b2) => Math.round(Math.max(b2.left - a2.right, a2.left - b2.right, b2.top - a2.bottom, a2.top - b2.bottom));
      return { binLast: bin === icons.length - 1, within: air(g[0], g[1]),
        warn: getComputedStyle(icons[bin]).color !== getComputedStyle(icons[0]).color,
        overlap: g.some((o, i) => i && o.top < g[i - 1].bottom - 1) };
    });
    t.ok('two verbs sit within a target of each other, not scattered',
      !!spacing && spacing.within <= 44 && !spacing.overlap, JSON.stringify(spacing));
    t.ok('and Remove stands last, in the warning colour',
      !!spacing && spacing.binLast && spacing.warn, JSON.stringify(spacing));
    t.ok('and it bought that without shrinking a single target',
      await spacePhone.evaluate(() => [...document.querySelectorAll('#modalRoot .mrow-menu button')]
        .every((e) => { const b2 = e.getBoundingClientRect();
          return Math.round(b2.width) >= 34 && Math.round(b2.height) >= 34; })),
      await spacePhone.evaluate(() => [...document.querySelectorAll('#modalRoot .mrow-menu button')]
        .map((e) => { const b2 = e.getBoundingClientRect();
          return Math.round(b2.width) + 'x' + Math.round(b2.height); }).join(' ')));
    await spacePhone.context().close();

    /* ---- what is held, said where it can be seen -------------------------
     * Lock the dinner you promised the family, fold the card, press
     * Rebalance. The whole gesture happens on the folded view, and the
     * folded view used to carry no sign of the lock at all. */
    const heldPage = await t.fresh();
    await heldPage.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      /* Two plates, so Rebalance has something to move the difference ONTO —
         with one plate and that plate held there is nothing to solve, and the
         test would pass on an app that had simply given up. */
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:egg_white', x: 2, eaten: 0 }, { id: 'f:cheddar', x: 1, eaten: 0 }],
        l: [], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1',
        goalLb: 175, goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000,
      }));
    });
    await heldPage.reload();
    await heldPage.waitForTimeout(400);
    await heldPage.click('.tab[data-view="macros"]');
    await heldPage.waitForTimeout(300);
    await openMeal(heldPage, 'b');                      // breakfast's sheet
    // the lock is in the food's ⋯ since 2026-10-04
    await openRow(heldPage, 'b:0');
    await heldPage.click('#modalRoot [data-mfmenu="b:0"]');
    await heldPage.waitForTimeout(250);
    const heldOk = await heldPage.evaluate(() => document.querySelectorAll('#modalRoot [data-mlock]').length > 0);
    t.ok('an open plate offers the lock', heldOk);

    await heldPage.click('#modalRoot [data-mlock]');
    await heldPage.waitForTimeout(300);
    t.ok('and tapping it is recorded on the plate, not just drawn',
      await heldPage.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        const day = d[Object.keys(d).sort().pop()] || {};
        return (day.b || []).some((it) => it.l);
      }));

    /* The hold is said where the food is: shut the meal's sheet, open it
       again, and the plate still says Kept — the hold survives, and it is the
       one plate. */
    await closeSheet(heldPage);
    const foldedBack = await heldPage.evaluate(() => !document.querySelector('#modalRoot .msheet'));
    await openMeal(heldPage, 'b');
    t.ok('and the fold still says which food is being held',
      foldedBack && await heldPage.evaluate(() => {
        const held = [...document.querySelectorAll('#modalRoot .mrows .mrow')].filter((f) =>
          [...f.querySelectorAll('.mrow-mk.kept')].some((c) => /Kept|Locked/.test(c.textContent)));
        return held.length === 1 && held[0].classList.contains('held');
      }),
      await heldPage.evaluate(() => [...document.querySelectorAll('#modalRoot .mrows .mrow')]
        .map((f) => f.className + ' [' + (f.querySelector('.mitem-nm') || {}).textContent + ']').join(' | ') || 'no plates'));
    // and back to the day, where Rebalance is pressed
    await backToDay(heldPage);

    /* The point of the mark: Rebalance is about to skip that plate, and you
       are looking at the folded card when you press it. */
    t.ok('and Rebalance leaves the held plate at the size it was held at',
      await heldPage.evaluate(() => {
        const read = () => {
          const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
          return (d[Object.keys(d).sort().pop()] || {}).b || [];
        };
        const was = read().filter((it) => it.l).map((it) => it.x);
        const btn = document.getElementById('macroRebal');
        if (!btn || btn.disabled) return false;
        btn.click();
        const now = read().filter((it) => it.l).map((it) => it.x);
        return was.length > 0 && was.join() === now.join();
      }));
    await heldPage.context().close();

    /* ---- one query, not two ---------------------------------------------
     * There were two search boxes with near-identical placeholders — "Search
     * a food or a dish…" and "Search a dish or ingredient…" — backed by two
     * separate state fields. Typing a word into one and switching to the
     * other threw the word away and asked for it again. */
    const oneQ = await comboAt();
    await pickerList(oneQ);
    await oneQ.waitForTimeout(350);
    await oneQ.fill('#mpFind', 'chicken');
    await oneQ.waitForTimeout(500);
    const lookHits = await oneQ.evaluate(() =>
      document.querySelectorAll('#mpList [data-mpick]').length);

    await pickerList(oneQ);
    await oneQ.waitForTimeout(450);
    t.ok('a word typed in one box is still there in the other',
      await oneQ.evaluate(() => (document.getElementById('mpFind') || {}).value === 'chicken'),
      JSON.stringify(await oneQ.evaluate(() => (document.getElementById('mpFind') || {}).value)));

    /* And it is the same word doing the same work, not merely the same
       string sitting in a box: both lists answer to it. */
    t.ok('and it is narrowing the other list too',
      lookHits > 0 && await oneQ.evaluate(() =>
        document.querySelectorAll('#mpList [data-mpick]').length > 0 &&
        [...document.querySelectorAll('#mpList .mp-name')]
          .some((n) => /chicken/i.test(n.textContent))));
    await oneQ.context().close();

    /* ---- a control that cannot do anything is not a control ---------------
     * The meal name was a fold button on an EMPTY meal too, where there is
     * nothing to fold: `folded` is gated on items.length and the seam only
     * exists `if (rows)`, so the press did nothing you could see. It wrote
     * S.mFold[sk] regardless, and mFoldFor stops Fill from clearing it — so
     * pressing an empty meal's name and then pressing Fill brought that one
     * meal back FOLDED, with no steppers, while every other meal opened. */
    const deadFold = await t.fresh();
    await deadFold.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [], l: [], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
    });
    await deadFold.reload();
    await deadFold.waitForTimeout(400);
    await deadFold.click('.tab[data-view="macros"]');
    await deadFold.waitForTimeout(300);

    /* An empty meal is a tray like any other, and pressing it opens its
       sheet, which says it is empty and carries the search and the picker
       under it — the press does something you can see. What has to stay true
       is the consequence below. */
    await openMeal(deadFold, 'b');
    t.ok('an empty meal’s tray opens to a sheet with something to do on it',
      await deadFold.evaluate(() => {
        const sc = document.querySelector('#modalRoot .msheet');
        return !!sc && !!(sc.querySelector('.msh-on-empty') || sc.querySelector('.msh-tray .msh-none')) && !!sc.querySelector('#mpFind') &&
          sc.querySelectorAll('#mpList [data-mpick]').length > 0;
      }));

    /* The consequence, which is what actually bit: press it, then Fill —
       from the day. */
    await backToDay(deadFold);
    await deadFold.click('#macroFill');
    await deadFold.waitForTimeout(700);
    const afterFill = await deadFold.evaluate(() =>
      [...document.querySelectorAll('#macroSlots .mtray')]
        .map((c) => ({ n: c.querySelector('.mtray-n').textContent.trim(),
          k: (c.querySelector('[data-mopen]') || {}).dataset.mopen,
          filled: c.classList.contains('filled') })));
    /* Every meal Fill drafted comes back the same way — the one pressed
       first is not singled out — and its sheet opens onto its dials. */
    await openMeal(deadFold, 'b');
    const bSteppers = await deadFold.evaluate(() =>
      document.querySelectorAll('#modalRoot .mrows [data-mstep^="b:"]').length);
    t.ok('and pressing it before Fill does not leave that meal behind',
      afterFill.length >= 3 && afterFill.every((m) => m.filled) && bSteppers > 0,
      JSON.stringify({ afterFill, bSteppers }));
    await deadFold.context().close();

    /* ---- what closes the day, on arrival ---------------------------------
     * The sheet used to open on six things eaten lately and a way to go
     * looking. The one thing it never offered was the answer to the question
     * it was opened with — what would close the day — even though the app
     * has worked that out for every dish since the tab existed. It was an
     * option inside a sort dropdown, two taps and a mode away. */
    /* Seeded with a RECIPE eaten yesterday, not a food: it lands in Recent
       and is also in the meal's own ranked pool, so the two bands genuinely
       compete for it. Without that overlap the dedupe check below is
       vacuous — which it was, and a mutation removing the dedupe left the
       suite green. */
    const fitsPg = await t.fresh();
    /* Two-phase: settle the day first, ask the fit engine which dish it
       would put FIRST, and make that the thing eaten yesterday. Anything
       less than rank one is not enough — the band draws ten, so a recent
       sitting fiftieth never competes and the dedupe has nothing to do.
       (Seeded at rank 200 first; the mutation still passed.) */
    await fitsPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [], l: [], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
    });
    await fitsPg.reload();
    await fitsPg.waitForTimeout(400);
    await fitsPg.click('.tab[data-view="macros"]');
    await fitsPg.waitForTimeout(300);
    const seedId = await fitsPg.evaluate(() => {
      const top = window.__macroLab.rank('b', 1);
      return top && top.length ? top[0].id : null;
    });
    await fitsPg.evaluate((rid) => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (o) => { const d = new Date(); d.setDate(d.getDate() - o);
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
      const g = new Date(); g.setDate(g.getDate() + 120);
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [key(1)]: { b: [{ id: rid, x: 1, eaten: 1 }], l: [], d: [], s: [] },
        [key(0)]: { b: [], l: [], d: [], s: [] } }));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 41, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
    }, seedId);
    await fitsPg.reload();
    await fitsPg.waitForTimeout(400);
    await fitsPg.click('.tab[data-view="macros"]');
    await fitsPg.waitForTimeout(300);
    await addOn(fitsPg);
    await fitsPg.waitForTimeout(500);
    const fits = await fitsPg.evaluate(() => {
      const bands = [...document.querySelectorAll('.sheet .mt-div')].map((d) => d.textContent);
      const under = (label) => {
        const d = [...document.querySelectorAll('.sheet .mt-div')]
          .find((x) => new RegExp(label, 'i').test(x.textContent));
        if (!d) return [];
        const out = []; let el = d.nextElementSibling;
        while (el && !el.classList.contains('mt-div')) {
          const b = el.querySelector('[data-mpick]');
          const c = el.querySelector('[data-mpfit]');
          if (b) out.push({ id: b.dataset.mpick, x: Number(b.dataset.mpx), fit: c ? Number(c.dataset.mpx) : null });
          el = el.nextElementSibling;
        }
        return out;
      };
      const all = [...document.querySelectorAll('.sheet [data-mpick]')].map((b) => b.dataset.mpick);
      return { bands: bands, fits: under('Fits best'), recent: under('Recent'),
        dupes: all.filter((x, i) => all.indexOf(x) !== i) };
    });
    t.ok('the sheet opens with what fits the day, no mode to pick first',
      fits.bands.some((b) => /Fits best/i.test(b)) && fits.fits.length >= 5,
      JSON.stringify({ bands: fits.bands, n: fits.fits.length }));

    /* The same dish under two headings is a list that is not thinking. The
       first clause proves the two bands were actually competing: the recent
       dish IS in this meal's ranked pool, so only the dedupe keeps it from
       being drawn twice. */
    const couldClash = await fitsPg.evaluate((rid) =>
      window.__macroLab.rank('b', 10).some((e) => String(e.id) === String(rid)), seedId);
    t.ok('and no dish is drawn twice under two headings',
      couldClash && fits.recent.length > 0 && fits.dupes.length === 0,
      JSON.stringify({ couldClash: couldClash, recent: fits.recent.length,
        dupes: fits.dupes }));

    /* What a row arrives at. Blake, earlier: "Default to what you had last
       time (else 1 serving); 'fits the meal' becomes a one-tap chip beside
       it." On 2026-10-05 the meal began re-fitting itself as you add, and the
       chip went: "Last time, else what fits". So a food you have had arrives
       at that, a food you never have at what fits THIS meal (mMealFitX, not
       the room left in the day), and no row carries a chip. */
    const fitMeal = await fitsPg.evaluate((ids) => {
      const o = {}; ids.forEach((id) => { o[id] = window.__macroLab.mealFit('b', id); }); return o;
    }, fits.fits.map((e) => e.id));
    const chips = await fitsPg.evaluate(() => document.querySelectorAll('.sheet [data-mpfit]').length);
    t.ok('and every row arrives at what you had last time, else at what fits the meal, with no chip beside it',
      fits.fits.length > 0 && chips === 0 && fits.fits.every((e) => e.x > 0) &&
      fits.fits.every((e) => String(e.id) === String(seedId) ? e.x === 1 : Math.abs(e.x - fitMeal[e.id]) < 1e-6) &&
      fits.fits.some((e) => e.x !== 1),
      JSON.stringify({ chips, rows: fits.fits.map((e) => [e.id, e.x, fitMeal[e.id]]) }));

    /* And it really is ranked, not merely listed: the bench scores the same
       pool and the band must agree with its order. */
    t.ok('and the band is in the order the fit engine ranks them',
      await fitsPg.evaluate((shown) => {
        const ranked = window.__macroLab.rank('b', 60);
        if (!ranked || !ranked.length) return false;
        const pos = {};
        ranked.forEach((e, i) => { pos[String(e.id)] = i; });
        const seq = shown.map((e) => pos[String(e.id)]).filter((n) => n !== undefined);
        if (seq.length < 3) return false;
        for (let i = 1; i < seq.length; i++) if (seq[i] < seq[i - 1]) return false;
        return true;
      }, fits.fits),
      JSON.stringify(fits.fits.map((e) => e.id)));
    await fitsPg.context().close();

    /* ---- the box answers a number -----------------------------------------
     * Every recipe in the two printed volumes carries a number, on the card,
     * the page and the contents. Standing over the open book at No. 142, the
     * fastest way in is to type 142 — and it was wired to nothing. */
    const numQ = await comboAt();
    await pickerList(numQ);
    await numQ.waitForTimeout(350);

    /* The expectation is computed from the data, never written down here: a
       literal name would pass on an app that had stopped reading .no. */
    const want142 = await numQ.evaluate(() => {
      const r = window.RECIPES.find((x) => x.book !== 3 && Number(x.no || x.id) === 142);
      return r ? r.name : null;
    });
    await numQ.fill('#mpFind', '142');
    await numQ.waitForTimeout(500);
    t.ok('typing a recipe number puts that recipe at the top',
      !!want142 && await numQ.evaluate((nm) => {
        const band = document.querySelector('#mpList .mt-div');
        const first = document.querySelector('#mpList .mp-name');
        return !!band && /Recipe no\. 142/.test(band.textContent) &&
          !!first && first.textContent === nm;
      }, want142),
      want142 + ' — got ' + await numQ.evaluate(() =>
        (document.querySelector('#mpList .mp-name') || {}).textContent));

    /* The Ours shelf numbers itself from 1 at every boot, so the FIRST
       household recipe collides with printed No. 1 immediately.
     *
       Asked at 142 this proved nothing: the shelf is empty in a fresh
       profile, so there was no collision to detect and the check passed with
       the book-3 guard deleted. It seeds a household recipe and asks at the
       number that actually collides. */
    await numQ.evaluate(() => {
      const mine = JSON.parse(localStorage.getItem('bsc.mine') || '{}');
      mine.ucollide1 = { id: 'ucollide1', book: 3, secNum: 1, secName: 'Ours',
        name: 'Household Collision Test Loaf', servings: '1 Serving', servN: 1,
        ing: ['flour'], steps: ['bake'], time: '0 mins', diff: 'Easy',
        macro: { kcal: 300, p: 20, c: 30, f: 8, na: 200, fib: 2 } };
      localStorage.setItem('bsc.mine', JSON.stringify(mine));
    });
    await numQ.reload();
    await numQ.waitForTimeout(400);
    await numQ.click('.tab[data-view="macros"]');
    await numQ.waitForTimeout(250);
    await addOn(numQ);
    await numQ.waitForTimeout(300);
    await pickerList(numQ);
    await numQ.waitForTimeout(300);

    /* window.RECIPES is the BASE array the data file ships (app.js:26 keeps
       the rebuilt list, with Ours folded in, module-scoped) — so the shelf
       has to be confirmed through the interface, by searching for it. */
    await numQ.fill('#mpFind', 'Household Collision');
    await numQ.waitForTimeout(500);
    const seeded = await numQ.evaluate(() =>
      [...document.querySelectorAll('#mpList .mp-name')]
        .some((n) => /Household Collision Test Loaf/.test(n.textContent)));

    const printedNo1 = await numQ.evaluate(() => {
      const r = window.RECIPES.find((x) => Number(x.no || x.id) === 1);
      return r ? r.name : null;      // BASE is printed-only, which is the point
    });
    await numQ.fill('#mpFind', '1');
    await numQ.waitForTimeout(500);
    t.ok('and it is the printed book\u2019s number, not the Ours shelf\u2019s',
      seeded && !!printedNo1 && await numQ.evaluate((nm) => {
        const first = document.querySelector('#mpList .mp-name');
        return !!first && first.textContent === nm;
      }, printedNo1),
      'shelf seeded: ' + seeded + ', printed No.1 is ' + printedNo1 + ', got ' +
      await numQ.evaluate(() =>
        (document.querySelector('#mpList .mp-name') || {}).textContent));

    /* Eight digits is nobody's recipe number. It is a barcode, and typing one
       is the same request the camera makes. */
    await numQ.fill('#mpFind', '012345678901');
    await numQ.waitForTimeout(500);
    t.ok('and eight digits or more is read as a barcode instead',
      await numQ.evaluate(() => {
        const band = document.querySelector('#mpList .mt-div');
        const row = document.querySelector('[data-nfcode]');
        return !!band && /Barcode/.test(band.textContent) &&
          !!row && row.dataset.nfcode === '012345678901';
      }));

    /* A mistyped digit must not blank the screen. The band is drawn ABOVE
       whatever the list was going to say, never instead of it. */
    await numQ.fill('#mpFind', '999');
    await numQ.waitForTimeout(500);
    t.ok('and a number nobody has still says something',
      await numQ.evaluate(() => {
        const el = document.getElementById('mpList');
        return el.textContent.trim().length > 0 &&
          !document.querySelector('#mpList .mt-div');
      }), await numQ.evaluate(() =>
        document.getElementById('mpList').textContent.trim().slice(0, 80)));
    await numQ.context().close();

    /* ---- Look up browses, instead of waiting to be told a word -----------
     * It opened on a search box and nothing else: no way in unless you
     * already knew what you wanted to type. */
    const lookPage = await comboAt();
    await pickerList(lookPage);
    await lookPage.waitForTimeout(400);
    /* The Look up screen that grouped foods under Protein / Carbs / Fats is
       gone; the shelf rail asks the same question and asks it of dishes too,
       so the foods are harvested one chip at a time. Pressed from the test
       rather than inside one evaluate(), because each press re-renders the
       list and a node captured beforehand is detached by the next round. */
    /* The LENS says foods, the CHIP says which macro — the two compose, and
       between them they are the old browse screen's question. The chip alone
       is not: on a planned day Fits best ranks by fit and a dish out-fits a
       spoonful, so 🍚 on its own answers with ten recipes and no foods, which
       is the right answer to "what carbohydrate should I eat" and not to
       "show me the carbohydrate foods". */
    await lookPage.selectOption('#mpSec', 'foods');
    await lookPage.waitForTimeout(250);
    const lk = { heads: [], rows: {} };
    for (const [key, head] of [['protein', 'Protein'], ['carb', 'Carbs'], ['fat', 'Fats']]) {
      if (!(await lookPage.$('[data-mpshelf="' + key + '"]'))) continue;
      await lookPage.click('[data-mpshelf="' + key + '"]');
      await lookPage.waitForTimeout(250);
      lk.heads.push(head);
      lk.rows[head] = await lookPage.evaluate(() =>
        [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')]
          .map((r) => r.dataset.mpick).filter((id) => /^f:/.test(id)));
      await lookPage.click('[data-mpshelf="' + key + '"]');
      await lookPage.waitForTimeout(200);
    }
    t.ok('the lens and the rail together file foods by macro, protein first',
      lk.heads.join('/') === 'Protein/Carbs/Fats' &&
      lk.heads.every((h) => lk.rows[h].length > 0),
      JSON.stringify(lk.heads) + ' ' + JSON.stringify(
        lk.heads.map((h) => lk.rows[h].length)));

    /* Classed by where the calories come from, not by grams -- a cup of milk
       carries more grams of carbohydrate than fat and is not a fat. */
    const misfiled = await lookPage.evaluate((rows) => {
      /* Read the macros off the rendered rows rather than out of the app --
         a check that asks the code under test for its own answer proves
         nothing. Every row prints "62P · 2F · 0C". */
      const bad = [];
      Object.keys(rows).forEach((h) => {
        const want = h === 'Protein' ? 'p' : h === 'Carbs' ? 'c' : 'f';
        rows[h].forEach((id) => {
          const btn = document.querySelector('[data-mpick="' + id + '"]');
          const txt = btn ? btn.textContent : '';
          const g = (l) => { const m = new RegExp('(\\d+)' + l).exec(txt); return m ? +m[1] : 0; };
          const kp = g('P') * 4, kf = g('F') * 9, kc = g('C') * 4;
          if (!(kp + kf + kc)) return;
          /* A row PRINTS whole grams; the app files on the unrounded ones.
             Mushrooms are 3.1 g protein against 3.3 g carbohydrate per 100 g,
             so a 70 g cup renders "2P · 2C" and the tie-break here picks
             protein while the app correctly picks carbohydrate. Within one
             gram of a tie the rendered row simply cannot say which shelf is
             right, so it is not evidence either way — the same reason the
             gap-row painting check skips its band edges. */
          const rank = [kp, kf, kc].sort((a, b) => b - a);
          if (rank[0] - rank[1] <= 4) return;
          const dom = kp >= kf && kp >= kc ? 'p' : (kf >= kc ? 'f' : 'c');
          if (dom !== want) bad.push(h + ':' + id);
        });
      });
      return bad;
    }, lk ? lk.rows : {});
    t.ok('and every food is filed under the macro its calories come from',
      !!lk && lk.rows.Protein.length > 2 && lk.rows.Carbs.length > 2 &&
        lk.rows.Fats.length > 2 && misfiled.length === 0,
      misfiled.join(' '));

    /* Oil is the purest fat on the shelf and it is not dinner. A thing that
       goes ON food sits under the food, in this list and on the combo's
       rungs both -- same rule, stated once. */
    const lkFats = lk ? lk.rows.Fats : [];
    /* The RULE, not two ids. It used to name oil and cheddar, and which
       particular foods reach a fit-ranked list of forty is not the claim —
       the claim is that anything you put ON food sits below everything you
       eat as it comes. Asserted over the whole list, which is also stronger:
       one condiment out of place fails it. */
    const condOrder = await lookPage.evaluate((ids) => {
      const N = window.Nutrition.FOODS;
      let lastFood = -1, firstCond = 1e9, conds = 0;
      ids.forEach((id, i) => {
        const f = N[String(id).replace(/^f:/, '')];
        if (!f) return;
        if (f.eat || f.side) lastFood = i;
        else { conds++; firstCond = Math.min(firstCond, i); }
      });
      return { lastFood: lastFood, firstCond: firstCond, conds: conds, n: ids.length };
    }, lkFats);
    t.ok('and the condiments sit under the foods, not over them',
      condOrder.n > 4 && condOrder.conds > 0 && condOrder.firstCond > condOrder.lastFood,
      JSON.stringify(condOrder) + ' ' + lkFats.join(' '));

    /* And the search it used to be is still the search it is. */
    await lookPage.fill('#mpFind', 'honey');
    await lookPage.waitForTimeout(400);
    /* It used to require NO headings, because the old Look up screen threw
       the ranked bands away the moment you typed. Keeping them is the point
       of the rework, so the claim is now the one that always mattered: the
       thing you named leads, and the list is about it. */
    t.ok('and typing still narrows it to what you typed',
      await lookPage.evaluate(() => {
        const el = document.getElementById('mpList');
        const first = el.querySelector('.mpick-row[data-mpick] .mp-name');
        return el.querySelectorAll('[data-mpick]').length > 0 &&
          !!first && /honey/i.test(first.textContent);
      }), await lookPage.evaluate(() =>
        document.getElementById('mpList').textContent.slice(0, 120)));

    /* ---- Price & Spanish Fork Restaurant Smart Combos (🥡 Eating out) ---- */
    await lookPage.fill('#mpFind', '');
    await lookPage.waitForTimeout(250);
    await lookPage.selectOption('#mpSec', 'meal');
    await lookPage.waitForTimeout(200);
    const eatoutCatalog = await lookPage.evaluate(() => {
      const combos = window.__macroLab.foods().filter((r) => r.eatout);
      const menus = window.__macroLab.foods().filter((r) => r.eatoutMenu);
      const bad = combos.filter((r) => !r.parts || !r.parts.length || !r.spot || r.unit !== 'order');
      return { n: combos.length, menus: menus.length, bad: bad.length };
    });
    t.ok('Price & Spanish Fork catalog registers 160 restaurant Smart Combos and 140+ individual Menu Items',
      eatoutCatalog.n === 160 && eatoutCatalog.menus >= 140 && eatoutCatalog.bad === 0, JSON.stringify(eatoutCatalog));

    t.ok('the shelf rail carries an Eating out chip, and #mpSpots is hidden until Eating out is active',
      !!(await lookPage.$('#mpShelves [data-mpshelf="eatout"]')) && !(await lookPage.$('#mpSpots')));
    await lookPage.click('#mpShelves [data-mpshelf="eatout"]');
    await lookPage.waitForTimeout(250);
    const eatoutRows = await lookPage.evaluate(() => {
      const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
      const comboRows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:rc_"]')];
      const menuRows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:ro_"]')];
      const hasMenuBand = [...document.querySelectorAll('#mpList .mt-div')].some((d) => d.textContent.trim() === 'Menu items');
      const firstId = rows[0] ? rows[0].dataset.mpick : null;
      const firstRec = window.__macroLab.foods().find((r) => r.id === firstId);
      const spotsEl = document.getElementById('mpSpots');
      const spotChips = spotsEl ? [...spotsEl.querySelectorAll('[data-mpspot]')] : [];
      return {
        n: rows.length,
        comboN: comboRows.length,
        menuN: menuRows.length,
        hasMenuBand,
        allEatout: rows.every((r) => /^f:r[co]_/.test(r.dataset.mpick) && r.dataset.mpx === '1'),
        firstId,
        firstMeals: firstRec ? firstRec.meals : '',
        firstTxt: rows[0] ? rows[0].textContent : '',
        spotCount: spotChips.length,
        allPressed: spotChips[0] && spotChips[0].dataset.mpspot === '' && spotChips[0].getAttribute('aria-pressed') === 'true',
        hasChains: ['McDonald\u2019s', 'Arby\u2019s', 'KFC', 'Dairy Queen', 'Costa Vida'].every((s) =>
          spotChips.some((c) => c.dataset.mpspot === s)),
        noTownInChip: spotChips.every((c) => !/Spanish Fork|Price/.test(c.textContent)),
        minTapH: spotChips.length ? Math.min(...spotChips.map((c) => Math.round(c.getBoundingClientRect().height))) : 0,
        minTapW: spotChips.length ? Math.min(...spotChips.map((c) => Math.round(c.getBoundingClientRect().width))) : 0
      };
    });
    t.ok('tapping Eating out on Breakfast ranks breakfast Smart Combos first at 1 order and shows the Menu items band below',
      eatoutRows.comboN >= 20 && eatoutRows.menuN >= 15 && eatoutRows.hasMenuBand && eatoutRows.allEatout &&
      /1 order/.test(eatoutRows.firstTxt) && eatoutRows.firstMeals.indexOf('b') >= 0,
      JSON.stringify(eatoutRows));
    t.ok('tapping Eating out reveals a horizontal swipeable row of 44px restaurant filter chips without town suffixes',
      eatoutRows.spotCount >= 30 && eatoutRows.allPressed && eatoutRows.hasChains &&
      eatoutRows.noTownInChip && eatoutRows.minTapH >= 44 && eatoutRows.minTapW >= 44,
      JSON.stringify(eatoutRows));

    /* Tapping a restaurant chip filters to only that restaurant's combos and menu items, and tapping All restores all */
    await lookPage.click('#mpSpots [data-mpspot="McDonald\u2019s"]');
    await lookPage.waitForTimeout(200);
    const mcFiltered = await lookPage.evaluate(() => {
      const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
      const combos = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:rc_"]')];
      const menus = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:ro_"]')];
      const active = [...document.querySelectorAll('#mpSpots [data-mpspot][aria-pressed="true"]')].map((b) => b.dataset.mpspot);
      return {
        n: rows.length,
        comboN: combos.length,
        menuN: menus.length,
        allMc: rows.length > 0 && rows.every((r) => /McDonald/.test(r.textContent)),
        active
      };
    });
    t.ok('tapping a restaurant chip filters the list to only that restaurant’s combos and individual menu items',
      mcFiltered.comboN === 7 && mcFiltered.menuN >= 6 && mcFiltered.allMc && mcFiltered.active.join(',') === 'McDonald\u2019s',
      JSON.stringify(mcFiltered));

    await lookPage.click('#mpSpots [data-mpspot="KFC"]');
    await lookPage.waitForTimeout(200);
    const kfcFiltered = await lookPage.evaluate(() => {
      const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
      const combos = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:rc_"]')];
      const menus = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:ro_"]')];
      return { comboN: combos.length, menuN: menus.length, allKfc: rows.length >= 10 && rows.every((r) => /KFC/.test(r.textContent)) };
    });
    t.ok('switching to another restaurant chip (KFC) shows its combos and individual menu items immediately',
      kfcFiltered.comboN === 5 && kfcFiltered.menuN >= 6 && kfcFiltered.allKfc, JSON.stringify(kfcFiltered));

    await lookPage.click('#mpSpots [data-mpspot=""]');
    await lookPage.waitForTimeout(200);
    t.ok('tapping All on the restaurant bar restores the full Eating out list',
      await lookPage.evaluate(() => document.querySelectorAll('#mpList .mpick-row[data-mpick]').length >= 30));

    /* Searching by restaurant or town narrows the list */
    await lookPage.fill('#mpFind', 'Grogg');
    await lookPage.waitForTimeout(300);
    t.ok('searching a local Price restaurant finds its Smart Combos and menu items',
      await lookPage.evaluate(() => {
        const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
        const combos = [...document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:rc_"]')];
        return combos.length === 4 && rows.length >= 7 && rows.every((r) => /Grogg/.test(r.textContent));
      }));

    await lookPage.fill('#mpFind', 'Spanish Fork');
    await lookPage.waitForTimeout(300);
    t.ok('searching by town ("Spanish Fork") matches combos via their spot metadata',
      await lookPage.evaluate(() =>
        document.querySelectorAll('#mpList .mpick-row[data-mpick^="f:rc_"]').length >= 10));

    /* Tapping a combo adds 1 order, wears no "A saved meal" badge, and Explode splits it into parts */
    await lookPage.fill('#mpFind', 'Costa Vida');
    await lookPage.waitForTimeout(300);
    await lookPage.click('#mpList .mpick-row[data-mpick="f:rc_cv_2_chk_tacos"]');
    await lookPage.waitForTimeout(300);
    const onPlate = await lookPage.evaluate(() => {
      const hasSavedBadge = !!document.querySelector('#modalRoot .mrows .mfood-saved');
      const sub = window.__macroLab.read().meals.find((m) => m.items.some((it) => it.id === 'f:rc_cv_2_chk_tacos'));
      return {
        found: !!sub,
        hasSavedBadge,
        hasMenu: !!document.querySelector('#modalRoot .mrows [data-mfmenu]')
      };
    });
    t.ok('adding a restaurant combo logs 1 order with an Explode menu and no saved-meal badge',
      onPlate.found && !onPlate.hasSavedBadge && onPlate.hasMenu, JSON.stringify(onPlate));

    const beforeExplode = await lookPage.evaluate(() => {
      const m = window.__macroLab.read().meals.find((ml) => ml.items.some((it) => it.id === 'f:rc_cv_2_chk_tacos'));
      const it = m.items.find((x) => x.id === 'f:rc_cv_2_chk_tacos');
      return { sk: m.k, kcal: it.kcal, p: it.p, f: it.f, c: it.c };
    });
    /* Each food is a line that opens its controls (layout B), so open the
       combo's own line before its ⋯ menu; a meal that already held a food
       would otherwise have its first, hidden, menu picked. */
    const cvTag = await lookPage.evaluate(() => {
      const row = [...document.querySelectorAll('#modalRoot .mrows .mrow')]
        .find((r) => /Costa Vida/.test(r.textContent));
      const b = row && row.querySelector('[data-mrowopen]');
      return b ? b.dataset.mrowopen : null;
    });
    await openRow(lookPage, cvTag);
    await lookPage.click('#modalRoot .mrows .mrow:not(.mrow-shut) [data-mfmenu]');
    await lookPage.waitForTimeout(200);
    await lookPage.click('#modalRoot .mrows [data-mexplode]');
    await lookPage.waitForTimeout(300);
    const afterExplode = await lookPage.evaluate((sk) => {
      const m = window.__macroLab.read().meals.find((ml) => ml.k === sk);
      const ro = m.items.filter((it) => /^f:ro_/.test(it.id));
      const sum = ro.reduce((acc, it) => ({
        kcal: acc.kcal + it.kcal * it.x,
        p: acc.p + it.p * it.x,
        f: acc.f + it.f * it.x,
        c: acc.c + it.c * it.x
      }), { kcal: 0, p: 0, f: 0, c: 0 });
      return { n: ro.length, sum };
    }, beforeExplode.sk);
    t.ok('Explode into foods splits the restaurant combo into its atomic parts with identical macros',
      afterExplode.n === 4 &&
      Math.round(afterExplode.sum.kcal) === Math.round(beforeExplode.kcal) &&
      Math.abs(afterExplode.sum.p - beforeExplode.p) < 0.01 &&
      Math.abs(afterExplode.sum.f - beforeExplode.f) < 0.01 &&
      Math.abs(afterExplode.sum.c - beforeExplode.c) < 0.01,
      JSON.stringify({ beforeExplode, afterExplode }));

    await lookPage.context().close();
  },
});
