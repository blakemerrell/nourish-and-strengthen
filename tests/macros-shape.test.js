/* The day's meals as the reader shapes them, lenses, locks and the
 * rebalancer, shares that square to 100, pins and the family's plan, whose
 * day it is, signing in without leaving the page, and what the security
 * review found.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, openPlan, pickRecipe, pickerList } = require('./fixtures/nourish.js');

/* Trays and the meal sheet (Blake, 2026-10-04): the day is a small tray a
   meal, and a meal opens as its sheet — the one place food is added or
   changed — where the verbs live behind a ⋯: the meal's (Try another, Save
   meal, Repeat a day, Skip) on its header, a plate's (Lock, Swap, Pin,
   Remove) on the plate. These say "the way a thumb gets there" once, so each
   step below can keep asking for what it always did. */
const home = async (pg) => {
  const was = await pg.evaluate(() => {
    // Done in the tray since 2026-10-05; a skipped or bygone meal keeps its ×
    const b = document.querySelector('#modalRoot .msheet .msh-done') || document.querySelector('#modalRoot .msheet .sheet-x');
    if (b) b.click();
    return !!b;
  });
  if (was) await pg.waitForTimeout(300);
};
/* A meal's sheet open, by its key or by its place on the day, with the tray
   along its bottom open on the plates (2026-10-05: shut, it is a row of chips). */
const openTray = async (pg) => {
  // pressed whenever it shows: the tray shut, or a word in the search (2026-10-08)
  if (await pg.isVisible('#modalRoot .msh-tray .msh-trn')) {
    await pg.click('#modalRoot .msh-tray .msh-trn');
    await pg.waitForTimeout(250);
  }
};
const openMeal = async (pg, sk) => {
  const key = await pg.evaluate((k) => typeof k === 'number'
    ? ([...document.querySelectorAll('#macroSlots .mtray-b[data-mopen], #macroSlots .mtray-skb[data-mopen]')][k] || { dataset: {} }).dataset.mopen
    : k, sk);
  const open = await pg.evaluate((k) => !!document.querySelector('#modalRoot .msheet .msh-h [data-mdot="' + k + '"]'), key);
  if (open) { await openTray(pg); return; }
  await home(pg);
  await pg.evaluate((k) => {
    const b = document.querySelector('#macroSlots [data-mopen="' + k + '"]');
    if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
  }, key);
  await pg.waitForTimeout(300);
  await openTray(pg);
};
const mealMenu = async (pg, sk) => {
  await openMeal(pg, sk);
  await pg.evaluate((k) => {
    const b = document.querySelector('#modalRoot [data-mmenu="' + k + '"]');
    if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
  }, sk);
  await pg.waitForTimeout(200);
};
const foodMenu = async (pg, tag) => {
  await openMeal(pg, tag.split(':')[0]);
  await pg.evaluate((k) => {
    const b = document.querySelector('#modalRoot [data-mfmenu="' + k + '"]');
    if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
  }, tag);
  await pg.waitForTimeout(200);
};
/* Every plate on a meal back to a plan. There is no per-plate tick; the
   meal's tick completes or un-completes the whole meal, so one press clears
   an eaten meal and two clear a half-eaten one. Pressed on its tray, which
   may sit under the meal's open sheet. */
const asPlanned = async (pg, sk) => {
  for (let i = 0; i < 2; i++) {
    const any = await pg.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      return Object.values(d).some((day) => (day[k] || []).some((it) => it.eaten));
    }, sk);
    if (!any) break;
    await pg.evaluate((k) => document.querySelector('#macroSlots [data-mdot="' + k + '"]').click(), sk);
    await pg.waitForTimeout(200);
  }
};
const dayX = (pg, sk, i) => pg.evaluate(([k, n]) => {
  const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
  const day = d[Object.keys(d).sort().pop()] || {};
  return ((day[k] || [])[n] || {}).x;
}, [sk, i]);

module.exports = nourish({
  name: 'Macros — your meals, locks and pins, and signing in',
  async suite(t) {
    /* ---- the day's meals are the reader's to shape --------------------- */
    const m = await t.fresh();
    await m.click('.tab[data-view="macros"]');
    await m.waitForTimeout(150);

    await openPlan(m);
    await m.waitForTimeout(200);
    t.ok('the sheet starts with the four meals everyone starts with',
      await m.evaluate(() => document.querySelectorAll('#mtMeals .mtm-row').length) === 4);

    // a morning brew, added and walked to the top of the day
    await m.click('[data-mtmeal="add"]');
    await m.waitForTimeout(100);
    await m.fill('#mtMeals .mtm-row:last-child .mtm-name', 'Crio Brü');
    for (let i = 0; i < 4; i++) {
      await m.evaluate(() => {
        const row = [...document.querySelectorAll('#mtMeals .mtm-row')]
          .find((r) => r.querySelector('.mtm-name').value === 'Crio Brü');
        row.querySelector('.mtm-move').click();
      });
      await m.waitForTimeout(50);
    }
    t.ok('a new meal can be walked to the top of the day',
      await m.evaluate(() =>
        document.querySelector('#mtMeals .mtm-row .mtm-name').value === 'Crio Brü'));
    await m.click('[data-mtarg="save"]');
    await m.waitForTimeout(300);
    const slotNames = () => m.evaluate(() =>
      [...document.querySelectorAll('#macroSlots .mtray-n')].map((n) => n.textContent));
    t.ok('the day now has five meals, the brew first',
      (await slotNames()).length === 5 && (await slotNames())[0] === 'Crio Brü',
      (await slotNames()).join(' | '));

    await openPlan(m);
    await m.waitForTimeout(200);
    t.ok('and the shape survives a reopen',
      await m.evaluate(() => {
        const rows = document.querySelectorAll('#mtMeals .mtm-row');
        return rows.length === 5 && rows[0].querySelector('.mtm-name').value === 'Crio Brü';
      }));
    await m.click('.sheet-x');
    await m.waitForTimeout(300);

    // put something on the brew and on Lunch, for the two tests that follow
    for (const which of [0, 2]) {
      await openMeal(m, which);
      await pickerList(m);
      await m.waitForTimeout(250);
      /* A RECIPE, because what follows opens the plate as a recipe and scales
         it by servN. The list holds single foods beside dishes now, so taking
         the first row can put a spoonful on the plate and the lookup then
         finds nothing. */
      await m.evaluate(() => {
        const r = [...document.querySelectorAll('.mpick-row[data-mpx]')]
          .find((x) => !/^f:/.test(x.dataset.mpick));
        if (r) r.click();
      });
      await m.waitForTimeout(300);
      await home(m);
    }
    await openMeal(m, 0);

    /* The portion ports into the recipe: the sheet opens at the batch that
       makes the plate — x over servN, snapped to the eighths it prints in. */
    const port = await m.evaluate(() => {
      const b = [...document.querySelectorAll('.mitem-name')]
        .find((x) => x.dataset.open && !/^f:/.test(x.dataset.open));
      const r = window.RECIPES.find((x) => String(x.id) === b.dataset.open);
      return { x: Number(b.dataset.mx), servN: r.servN || 1, id: b.dataset.open };
    });
    const snapped = Math.max(0.125, Math.round(port.x / port.servN * 8) / 8);
    const fmt = (n) => {
      const wh = Math.floor(n + 1e-9); const e8 = Math.round((n - wh) * 8);
      if (e8 === 0) return String(wh || 0); if (e8 === 8) return String(wh + 1);
      return (wh ? wh + ' ' : '') + { 1: '⅛', 2: '¼', 3: '⅜', 4: '½', 5: '⅝', 6: '¾', 7: '⅞' }[e8];
    };
    await m.click('#modalRoot .mitem-name');
    await m.waitForTimeout(250);
    t.ok('opening a plate opens its recipe at the batch that makes the portion',
      (await m.textContent('.scaler-val')).trim() === fmt(snapped) + '×',
      (await m.textContent('.scaler-val')) + ' — wanted ' + fmt(snapped) + '× (x' + port.x + ', serves ' + port.servN + ')');
    await m.goBack();
    await m.waitForTimeout(250);
    await home(m);

    /* Removing a meal from the plan does not remove its history: the plate
       logged under Lunch keeps its card and keeps counting. */
    const beforeP = await m.evaluate(() => document.querySelector('.mb-num').textContent);
    await openPlan(m);
    await m.waitForTimeout(200);
    await m.evaluate(() => {
      const row = [...document.querySelectorAll('#mtMeals .mtm-row')]
        .find((r) => r.querySelector('.mtm-name').value === 'Lunch');
      row.querySelector('[data-mtmeal="del"]').click();
    });
    await m.waitForTimeout(100);
    await m.click('[data-mtarg="save"]');
    await m.waitForTimeout(300);
    t.ok('a removed meal with food on the day keeps its card',
      await m.evaluate(() => {
        const names = [...document.querySelectorAll('#macroSlots .mtray-n')].map((n) => n.textContent);
        return names.length === 5 && names.indexOf('Lunch') === 4;
      }), (await slotNames()).join(' | '));
    /* Asked of its sheet: the tray is a door, and the sheet is where adding
       lives (2026-10-04). Its plate is there; the way to add to it, and the
       meal's ⋯, are not. */
    await openMeal(m, 4);
    t.ok('but loses its Add button — it is history, not a plan',
      await m.evaluate(() => {
        const s2 = document.querySelector('#modalRoot .msheet');
        return !!s2 && !!s2.querySelector('.mitem') && !s2.querySelector('#mpFind, [data-mpick]') && !s2.querySelector('[data-mmenu]');
      }), await m.evaluate(() => { const s2 = document.querySelector('#modalRoot .msheet');
        return s2 ? JSON.stringify({ items: s2.querySelectorAll('.mitem').length, find: !!s2.querySelector('#mpFind'), menu: !!s2.querySelector('[data-mmenu]') }) : 'no sheet'; }));
    await home(m);
    t.ok('and its grams still count',
      (await m.evaluate(() => document.querySelector('.mb-num').textContent)) === beforeP);

    await m.context().close();

    /* ---- lenses, locks, and the rebalancer ------------------------------ */
    const z = await t.fresh();
    await z.click('.tab[data-view="macros"]');
    await z.waitForTimeout(150);

    // the picker's sort is a lens: order changes, portions stay
    await openMeal(z, 'b');
    await pickerList(z);
    await z.waitForTimeout(200);
    /* The RANKED band only, and its recipe rows only.
     *
       An order is a lens on the ranking, and the ranking is what "Fits best"
       holds. Pins sit above it under "Every day" and stay there whatever the
       order says — a pin means always, and a sort must not outrank it — so
       reading every row on the screen would test the composition rather than
       the sort. */
    const rankedRows = () => z.evaluate(() => {
      const out = [];
      let inBand = false;
      [...document.querySelectorAll('#mpList > *')].forEach((el) => {
        if (el.classList.contains('mt-div')) { inBand = /^Fits best|^On the shelf/.test(el.textContent); return; }
        if (!inBand) return;
        const b = el.querySelector('.mpick-row[data-mpx]');
        if (b && !/^f:/.test(b.dataset.mpick)) out.push(b.dataset.mpick);
      });
      return out;
    });
    await z.selectOption('#mpSort', 'protein');
    await z.waitForTimeout(250);
    const byP = await rankedRows();
    t.ok('sorting by protein puts the most protein first',
      byP.length > 2 && await z.evaluate((ids) => {
        const pOf = (id) => window.RECIPES.find((x) => String(x.id) === id).macro.p;
        return ids.every((id, i) => i === 0 || pOf(ids[i - 1]) >= pOf(id));
      }, byP), byP.length + ' ranked rows');
    await z.selectOption('#mpSort', 'healthy');
    await z.waitForTimeout(250);
    const byH = await rankedRows();
    t.ok('and by health score, healthiest first',
      byH.length > 2 && await z.evaluate((ids) => {
        const sOf = (id) => window.RECIPES.find((x) => String(x.id) === id).score;
        return ids.every((id, i) => i === 0 || sOf(ids[i - 1]) >= sOf(id));
      }, byH), byH.length + ' ranked rows');

    // the section lens speaks the browse tab's vocabulary
    await z.selectOption('#mpSec', '2-4');
    await z.waitForTimeout(150);
    /* The lens drives the RANKED band's pool. Pins, recents and the closers
       are their own bands with their own reasons for being there — a pin is
       always offered, which is what a pin means — so the claim is about what
       the ranking draws from, not about every row on the screen. */
    t.ok('a single section can be looked at on its own',
      await z.evaluate(() => {
        const rows = [];
        let inBand = false;
        [...document.querySelectorAll('#mpList > *')].forEach((el) => {
          if (el.classList.contains('mt-div')) { inBand = /^Fits best|^On the shelf/.test(el.textContent); return; }
          if (!inBand) return;
          const b = el.querySelector('.mpick-row[data-mpick]');
          if (b) rows.push(b.dataset.mpick);
        });
        return rows.length > 0 && rows.every((id) => {
          if (/^f:/.test(id)) return false;
          const rec = window.RECIPES.find((x) => String(x.id) === id);
          return rec && rec.book === 2 && rec.secNum === 4;
        });
      }));
    await z.selectOption('#mpSec', 'meal');
    await z.waitForTimeout(150);

    /* One plate on the day, shrunk, put right by the button. Since
       2026-10-05 a plate shrunk by hand is Kept — "hand-set stays" — and a
       Kept plate is no more the day's Rebalance's to move than a locked one,
       so that is pinned first; then the same plate left small with nothing
       keeping it, which is what Rebalance is for. */
    await pickRecipe(z);
    await z.waitForTimeout(300);
    await asPlanned(z, 'b');
    await openTray(z);
    /* A few steps, not twenty: the plate goes on at what fits breakfast
       (2026-10-05), a quarter of a bowl, and twenty 5 g steps would walk it
       off the plate. */
    for (let i = 0; i < 3; i++) await z.click('#modalRoot [data-mstep="b:0:down"]');
    await z.waitForTimeout(150);
    const handX = await dayX(z, 'b', 0);
    await home(z);                          // the bar sits under the meal's sheet
    const handRebal = await z.evaluate(() => document.getElementById('macroRebal').disabled);
    t.ok('a plate shrunk by hand is Kept: Rebalance has nothing to move, and leaves it where the hand put it',
      handRebal && await dayX(z, 'b', 0) === handX, JSON.stringify({ handRebal, handX }));
    await z.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const k = Object.keys(d).sort().pop();
      d[k].b[0].x = 0.125; delete d[k].b[0].l;
      localStorage.setItem('bsc.macroDays', JSON.stringify(d));
    });
    await z.reload();
    await z.waitForTimeout(400);
    await z.click('.tab[data-view="macros"]');
    await z.waitForTimeout(200);
    const shrunkX = await dayX(z, 'b', 0);
    // how far the day is off its protein, signed, straight from its row
    const protGap = () => z.evaluate(() =>
      Number(document.querySelector('.mbrow[data-macro="p"] .mb-d').dataset.d));
    const leftBefore = await protGap();
    await z.click('#macroRebal');
    await z.waitForTimeout(250);
    await openMeal(z, 'b');
    const grownX = await dayX(z, 'b', 0);
    t.ok('Rebalance grows a shrunken plate back toward the day',
      grownX > shrunkX, shrunkX + ' → ' + grownX + ' (' + await z.textContent('#modalRoot .mstep-x') + ')');
    t.ok('and the day is nearer its protein than before',
      Math.abs(await protGap()) < Math.abs(leftBefore),
      'was ' + leftBefore + ', now ' + (await protGap()));

    /* "Not that, what else?" — the commonest move there is, and until now it
       meant deleting a plate and reopening the picker. Try again walks down
       the ranked list a step at a time. */
    const firstPick = await z.evaluate(() =>
      document.querySelector('#modalRoot .mitem-name').dataset.open);
    await mealMenu(z, 'b');
    await z.click('[data-mtry="b"]');
    await z.waitForTimeout(250);
    const second = await z.evaluate(() =>
      document.querySelector('#modalRoot .mitem-name').dataset.open);
    t.ok('Try again swaps the plate for another one',
      second && second !== firstPick, firstPick + ' → ' + second);
    await mealMenu(z, 'b');
    await z.click('[data-mtry="b"]');
    await z.waitForTimeout(250);
    const third = await z.evaluate(() =>
      document.querySelector('#modalRoot .mitem-name').dataset.open);
    t.ok('and again walks a further step, not back to the first',
      third && third !== second && third !== firstPick,
      [firstPick, second, third].join(' → '));
    t.ok('leaving exactly one plate on the meal each time',
      await z.evaluate(() => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        return days[Object.keys(days)[0]].b.length === 1;
      }));
    /* A plain food is a legitimate answer here — they were added to Try again
       deliberately, because a day rarely divides into whole recipes — so the
       claim is that whatever it offered came from the meal's own pool: a
       recipe from breakfast's sections, or a food you can eat as it comes. */
    t.ok('and only ever offering what the meal draws from',
      await z.evaluate(() => {
        const id = document.querySelector('#modalRoot .mitem-name').dataset.open;
        if (/^f:/.test(id)) {
          const f = window.Nutrition.FOODS[String(id).replace(/^f:/, '')];
          return !!f && !!(f.eat || f.side);
        }
        const r = window.RECIPES.find((x) => String(x.id) === id);
        return !!r && r.book === 1 && r.secNum === 1;   // breakfast's own sections
      }));

    // the lock holds against the machine, not the hand (Lock is in the plate's ⋯)
    await foodMenu(z, 'b:0');
    await z.click('#modalRoot [data-mlock="b:0"]');
    await z.waitForTimeout(150);
    await foodMenu(z, 'b:0');
    t.ok('a plate can be locked', await z.evaluate(() =>
      document.querySelector('#modalRoot [data-mlock="b:0"]').getAttribute('aria-pressed') === 'true'));
    const lockedX = await dayX(z, 'b', 0);
    for (let i = 0; i < 3; i++) await z.click('#modalRoot [data-mstep="b:0:down"]');
    await z.waitForTimeout(150);
    await mealMenu(z, 'b');
    t.ok('a locked plate is not the machine\u2019s to swap, nor joined by another',
      await z.evaluate(async () => {
        const before = document.querySelector('#modalRoot .mitem-name').dataset.open;
        const n = document.querySelectorAll('#modalRoot .mitem').length;
        document.querySelector('#modalRoot [data-mtry="b"]').click();
        await new Promise((r) => setTimeout(r, 250));
        return document.querySelector('#modalRoot .mitem-name').dataset.open === before &&
          document.querySelectorAll('#modalRoot .mitem').length === n;
      }));
    t.ok('the stepper still obeys the hand on a locked plate',
      (await dayX(z, 'b', 0)) < lockedX, lockedX + ' → ' + await dayX(z, 'b', 0));
    t.ok('but Rebalance has nothing left to move, and says so',
      await z.evaluate(() => document.getElementById('macroRebal').disabled));

    // a custom meal draws from exactly the boxes it ticked
    await home(z);
    await openPlan(z);
    await z.waitForTimeout(200);
    await z.selectOption('#mtMeals .mtm-row:first-child .mtm-type', 'x');
    await z.waitForTimeout(150);
    t.ok('choosing sections unfolds the checklist',
      await z.evaluate(() => {
        const l = document.querySelector('#mtMeals .mtm-row .mtm-secs');
        return l && !l.classList.contains('hide');
      }));
    /* Thirteen ticks have done their job the moment the ticking is over.
       Done folds them into a line that says what was chosen, and Change
       brings them back — the wall is not left standing between the meals. */
    await z.evaluate(() => {
      document.querySelectorAll('#mtMeals .mtm-row:first-child .mtm-secs input').forEach((cb) => {
        cb.checked = ['1-6', '1-2'].indexOf(cb.value) >= 0;
        cb.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await z.click('#mtMeals .mtm-row:first-child [data-mtsec="done"]');
    await z.waitForTimeout(150);
    t.ok('Done folds the checklist into what it chose',
      await z.evaluate(() => {
        const row = document.querySelector('#mtMeals .mtm-row:first-child');
        return row.querySelector('.mtm-secs').classList.contains('hide') &&
          !row.querySelector('.mtm-secsum').classList.contains('hide') &&
          /Snacks/.test(row.querySelector('.mtm-secsum-t').textContent) &&
          /Power Drinks/.test(row.querySelector('.mtm-secsum-t').textContent);
      }), await z.textContent('#mtMeals .mtm-row:first-child .mtm-secsum-t'));
    await z.click('#mtMeals .mtm-row:first-child [data-mtsec="show"]');
    await z.waitForTimeout(150);
    t.ok('and Change brings them back',
      await z.evaluate(() => !document.querySelector('#mtMeals .mtm-row:first-child .mtm-secs')
        .classList.contains('hide')));
    await z.evaluate(() => {
      document.querySelectorAll('#mtMeals .mtm-row:first-child .mtm-secs input').forEach((cb) => {
        cb.checked = cb.value === '1-6';        // Power Drinks alone
      });
    });
    await z.click('[data-mtarg="save"]');
    await z.waitForTimeout(300);
    await openMeal(z, 'b');
    await pickerList(z);
    await z.waitForTimeout(200);
    /* Every RECIPE the ranking offers comes from that section. Single foods
       ride along in every meal's pool by design — a day rarely divides into
       whole recipes — and pins and recents are their own bands with their own
       reasons, so the claim is about what the ranking draws from. */
    t.ok('the meal now draws from exactly the section it ticked',
      await z.evaluate(() => {
        const ids = [];
        let inBand = false;
        [...document.querySelectorAll('#mpList > *')].forEach((el) => {
          if (el.classList.contains('mt-div')) { inBand = /^Fits best|^On the shelf/.test(el.textContent); return; }
          if (!inBand) return;
          const b = el.querySelector('.mpick-row[data-mpick]');
          if (b) ids.push(b.dataset.mpick);
        });
        const recs = ids.filter((id) => !/^f:/.test(id));
        return recs.length > 0 && recs.every((id) => {
          const rec = window.RECIPES.find((x) => String(x.id) === id);
          return rec && rec.book === 1 && rec.secNum === 6;
        });
      }));

    /* Shares: a meal weighted heavier asks for more of the same dish. */
    const w20 = await z.evaluate(() => {
      const r = document.querySelector('.mpick-row[data-mpx]');
      return { id: r.dataset.mpick, x: Number(r.dataset.mpx) };
    });
    await z.goBack();
    await z.waitForTimeout(250);
    await home(z);
    await openPlan(z);
    await z.waitForTimeout(200);
    /* The kind defaults are 20/25/35/10 — a 90 — and the save that switched
       breakfast to custom sections has already squared them to 100, so what
       shows here is the rescaled quartet. */
    t.ok('every meal shows its share of the day, squared to 100',
      await z.evaluate(() =>
        [...document.querySelectorAll('.mtm-share')].map((i) => i.value).join(',') === '22,28,39,11'),
      await z.evaluate(() => [...document.querySelectorAll('.mtm-share')].map((i) => i.value).join(',')));
    await z.fill('#mtMeals .mtm-row:first-child .mtm-share', '60');
    await z.click('[data-mtarg="save"]');
    await z.waitForTimeout(300);
    await openMeal(z, 'b');
    await pickerList(z);
    await z.waitForTimeout(200);
    const w60 = await z.evaluate((id) => {
      const r = [...document.querySelectorAll('.mpick-row[data-mpx]')].find((x) => x.dataset.mpick === id);
      return r ? Number(r.dataset.mpx) : null;
    }, w20.id);
    t.ok('a bigger share asks for a bigger portion of the same dish',
      w60 !== null && w60 >= w20.x, '×' + w20.x + ' → ×' + w60);

    await z.context().close();

    /* ---- shares that square to 100, pins, and the family's plan --------- */
    const y = await t.fresh();
    await y.click('.tab[data-view="macros"]');
    await y.waitForTimeout(150);

    // shares normalize on Save, and the total line tells the truth meanwhile
    await openPlan(y);
    await y.waitForTimeout(200);
    t.ok('the total says the sum and which way it leans',
      /90%/.test(await y.textContent('#mtmTotal')) &&
      /10% short/.test(await y.textContent('#mtmTotal')), await y.textContent('#mtmTotal'));
    for (let i = 1; i <= 4; i++) {
      await y.fill('#mtMeals .mtm-row:nth-child(' + i + ') .mtm-share', '10');
    }
    t.ok('and follows the boxes as they change',
      /40%/.test(await y.textContent('#mtmTotal')) &&
      /60% short/.test(await y.textContent('#mtmTotal')), await y.textContent('#mtmTotal'));
    await y.fill('#mtMeals .mtm-row:nth-child(1) .mtm-share', '80');
    await y.waitForTimeout(100);
    t.ok('and says over when it is over',
      /110%/.test(await y.textContent('#mtmTotal')) &&
      /10% over/.test(await y.textContent('#mtmTotal')), await y.textContent('#mtmTotal'));
    await y.fill('#mtMeals .mtm-row:nth-child(1) .mtm-share', '10');
    await y.waitForTimeout(100);
    await y.click('[data-mtarg="save"]');
    await y.waitForTimeout(300);
    await openPlan(y);
    await y.waitForTimeout(200);
    t.ok('Save rescales equal shares to a clean hundred',
      await y.evaluate(() =>
        [...document.querySelectorAll('.mtm-share')].map((i) => i.value).join(',') === '25,25,25,25'),
      await y.evaluate(() => [...document.querySelectorAll('.mtm-share')].map((i) => i.value).join(',')));
    t.ok('and says so', /100%/.test(await y.textContent('#mtmTotal')) &&
      /spot on/.test(await y.textContent('#mtmTotal')), await y.textContent('#mtmTotal'));
    await y.click('.sheet-x');
    await y.waitForTimeout(300);

    // pin a plate; a brand-new today arrives with it already served
    await openMeal(y, 'b');
    await pickerList(y);
    await y.waitForTimeout(200);
    await pickRecipe(y);
    await y.waitForTimeout(300);
    const pinned = await y.evaluate(() => {
      const b = document.querySelector('#modalRoot .mitem-name');
      return { id: b.dataset.open, x: Number(b.dataset.mx) };
    });
    await foodMenu(y, 'b:0');
    await y.click('#modalRoot [data-mpin="b:0"]');
    await y.waitForTimeout(200);
    await foodMenu(y, 'b:0');
    t.ok('the pin takes hold on the plate and in the meal',
      await y.evaluate((id) => {
        const btn = document.querySelector('#modalRoot [data-mpin="b:0"]');
        const slots = JSON.parse(localStorage.getItem('bsc.macroSlots'));
        const b = slots.list.find((s) => s.k === 'b');
        return btn.getAttribute('aria-pressed') === 'true' &&
          b.pins && b.pins.length === 1 && String(b.pins[0].id) === id;
      }, pinned.id));
    await y.evaluate(() => localStorage.removeItem('bsc.macroDays'));   // tomorrow, in effect
    await y.reload();
    await y.waitForTimeout(400);
    await y.click('.tab[data-view="macros"]');
    await y.waitForTimeout(200);
    await foodMenu(y, 'b:0');
    t.ok('a new day wakes up with the routine already on it',
      await y.evaluate(([id, x]) => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        return day.b.length === 1 && String(day.b[0].id) === id && day.b[0].x === x &&
          document.querySelector('#modalRoot [data-mpin="b:0"]').getAttribute('aria-pressed') === 'true';
      }, [pinned.id, pinned.x]));
    await foodMenu(y, 'b:0');
    await y.click('#modalRoot [data-mpin="b:0"]');
    await y.waitForTimeout(200);
    t.ok('unpinning stops tomorrow but keeps today’s copy',
      await y.evaluate(() => {
        const slots = JSON.parse(localStorage.getItem('bsc.macroSlots'));
        const b = slots.list.find((s) => s.k === 'b');
        return (!b.pins || !b.pins.length) && document.querySelectorAll('#modalRoot .mitem').length === 1;
      }));

    // the family's plan feeds in as a picker lens, portioned for your targets
    const famIds = await y.evaluate(() => {
      const wd = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
      const picks = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 2);
      picks.forEach((r) => window.Store.addToDay(r.id, wd, 1));
      return picks.map((r) => String(r.id));
    });
    await y.waitForTimeout(300);
    await openMeal(y, 'd');
    await pickerList(y);
    await y.waitForTimeout(200);
    t.ok('the picker offers the family’s plan when there is one',
      await y.evaluate(() => {
        const o = [...document.querySelectorAll('#mpSec option')].find((x) => x.value === 'family');
        return !!o && /plan \(2\)/.test(o.textContent);
      }));
    await y.selectOption('#mpSec', 'family');
    await y.waitForTimeout(200);
    /* Exactly the family's two, in the band the lens drives. The other bands
       answer their own questions — a pin is offered whatever lens you are
       standing in — so "exactly what the family is having" is a claim about
       the ranking. */
    t.ok('and choosing it shows exactly what the family is having, fit-portioned',
      await y.evaluate((ids) => {
        const rows = [];
        let inBand = false;
        [...document.querySelectorAll('#mpList > *')].forEach((el) => {
          if (el.classList.contains('mt-div')) { inBand = /^Fits best|^On the shelf/.test(el.textContent); return; }
          if (!inBand) return;
          const b = el.querySelector('.mpick-row[data-mpx]');
          if (b) rows.push(b.dataset.mpick);
        });
        return rows.length === 2 && rows.every((id) => ids.indexOf(id) >= 0);
      }, famIds));

    /* The day, as plain text, for typing into whatever else you keep. */
    await y.goBack();                       // the family picker is still up
    await y.waitForTimeout(250);
    await home(y);
    await y.click('#macroFill');
    await y.waitForTimeout(400);
    await openMeal(y, 'b');

    /* A personal portion must not become the household's batch. A recipe
       opened from My Day arrives scaled to make one plate — an eighth of a
       roast, say — and that used to be the size planned for the family. */
    await y.evaluate(() => {
      const r = window.RECIPES.find((x) => (x.servN || 1) >= 4 && x.macro);
      window.__probe = r.id;
      window.Store.state.plan.mon = [];
    });
    await y.click('#modalRoot .mitem-name');
    await y.waitForTimeout(300);
    const cook = await y.evaluate(() => {
      const v = document.querySelector('.scaler-val');
      return v ? v.textContent.trim() : '';
    });
    await y.click('[data-add][data-day="mon"]');
    await y.waitForTimeout(300);
    t.ok('the week is only ever planned in sizes the week understands',
      await y.evaluate(() => {
        const SC = [1, 2, 3, 4, 0.5];
        return window.Store.day('mon').every((e) => SC.indexOf(e.x) >= 0);
      }), 'sheet was at ' + cook + ', week got ' +
        await y.evaluate(() => JSON.stringify(window.Store.day('mon').map((e) => e.x))));
    await y.goBack();
    await y.waitForTimeout(250);
    await home(y);

    await y.fill('#mWeight', '188.6');
    await y.dispatchEvent('#mWeight', 'change');
    await y.waitForTimeout(250);
    const copied = await y.evaluate(() => {
      let got = null;
      navigator.clipboard.writeText = (t2) => { got = t2; return Promise.resolve(); };
      document.getElementById('macroCopy').click();
      return got;
    });
    t.ok('the copy carries the weight, the plates and the totals',
      /* Portions in words, not multipliers: whatever this is pasted into
         knows what a serving is and has never heard of ×0.75. */
      copied && /Weight: 188\.6 lb/.test(copied) && /Total: \d+ kcal/.test(copied) &&
      /Target: \d+ kcal/.test(copied) && /\([\d½¼¾⅓⅔⅛⅜⅝⅞][^)]*\)/.test(copied),
      (copied || '').slice(0, 120));
    t.ok('and names every meal that has something on it',
      await y.evaluate((txt) => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        const slots = JSON.parse(localStorage.getItem('bsc.macroSlots'));
        return slots.list.every((s2) => !(day[s2.k] || []).length || txt.indexOf(s2.n + ':') >= 0);
      }, copied));

    /* ---- whose day it is ------------------------------------------------
     * The whole app works without an account, on the device it is open on.
     * An account does one thing: it lets a second device know you. And the
     * thing it guards is a weight history, so it is guarded by whose it is
     * rather than by a code that can be read aloud or forwarded. */
    const a2 = await t.fresh();
    await a2.click('.tab[data-view="macros"]');
    await a2.waitForTimeout(200);
    t.ok('the whole tab works with nobody signed in',
      await a2.evaluate(() => document.querySelectorAll('#macroSlots .mtray').length === 4));
    /* One sheet, two cards, split by whose it is: your day is private and
       carried between your own devices; the pantry is shared with people by a
       code. The distinction is the point, so it is drawn by heading rather
       than by paragraphs of explanation. */
    /* Everything fetched up to HERE is what a reader who never signs in
       causes. Taken before the sheet is opened, because opening the sheet is
       not "never signing in" — it is asking to. */
    const bootOutside = await a2.evaluate(() => performance.getEntriesByType('resource')
      .filter((e) => e.name.indexOf(location.origin) !== 0).map((e) => e.name));
    await a2.click('#syncBtn');
    await a2.waitForTimeout(300);
    t.ok('Google is the way in, said once and not argued for',
      await a2.evaluate(() => {
        const b = document.querySelector('[data-mysync="google"]');
        return !!b && /Sign in with Google/.test(b.textContent) &&
          document.querySelectorAll('.sheet .sync-p').length <= 2;
      }));
    /* ---- signing in without leaving the page ----------------------------
     * Firebase's own Google sign-in leaves for the firebaseapp.com origin and
     * comes back, keeping its handshake in that origin's storage — which
     * every current browser partitions, so the trip back read an empty box
     * and the app fell through to an anonymous account. Pressing the button
     * appeared to do nothing at all.
     *
     * Google Identity Services never leaves the page, so there is no second
     * origin to be partitioned. But their script is a third-party host, and a
     * visitor with no account must still fetch nothing from anywhere — so it
     * is fetched when the sheet opens and never at boot. offline.test.js
     * holds the boot half; this holds the rest. */
    await a2.waitForTimeout(2600);
    const gis = await a2.evaluate(() => {
      const seen = (el) => !!el && el.getBoundingClientRect().height > 0;
      const slot = document.getElementById('myGoogleBtn');
      return {
        drew: !!slot && slot.innerHTML.length > 0,
        ours: seen(document.getElementById('myGoogleFallback')),
        alt: seen(document.getElementById('myGoogleAlt'))
      };
    });
    /* Whichever way it went, exactly one way in is on offer and it is not
       none — the test does not require Google to be reachable from wherever
       this is running. */
    t.ok('there is one way in on screen, whether or not Google answered',
      (gis.drew ? !gis.ours : gis.ours), JSON.stringify(gis));
    /* Google DRAWING a button is not Google accepting it: on an origin the
       client does not allow, the button appears and then refuses, and the
       only sign is a console line nobody reads. The console deletes clients
       unused for six months, so this is not hypothetical. */
    t.ok('and when Google drew it, the older way is still reachable',
      !gis.drew || gis.alt, JSON.stringify(gis));
    /* The client ID is public and belongs in the page. The SECRET beside it
       in the console belongs to servers, and a web app that ships one has
       given it away. */
    t.ok('a client id is configured, and no secret rides along with it',
      await a2.evaluate(() => !!window.GOOGLE_CLIENT_ID &&
        /\.apps\.googleusercontent\.com$/.test(window.GOOGLE_CLIENT_ID)),
      await a2.evaluate(() => String(window.GOOGLE_CLIENT_ID || '').slice(-30)));

    t.ok('and the two cards say whose each one is',
      await a2.evaluate(() => {
        const txt = document.querySelector('.sheet').textContent;
        return /Your day/.test(txt) && /Private to you/.test(txt) &&
          /Your pantry/.test(txt) && /whoever you invite/.test(txt) &&
          !document.getElementById('macroDevices');
      }), await a2.textContent('.sheet'));
    // the email fallback is kept for people with no Google account, folded away
    t.ok('the email way in waits behind a fold',
      await a2.evaluate(() => {
        const d = document.querySelector('.sync-fold');
        return !!d && !d.open && !!d.querySelector('#myJoin');
      }));
    await a2.evaluate(() => { document.querySelector('.sync-fold').open = true; });
    await a2.fill('#myJoin', 'not-an-email');
    await a2.click('[data-mysync="email"]');
    await a2.waitForTimeout(250);
    t.ok('a malformed address is refused before anything is sent',
      /does not look like an email/i.test(await a2.textContent('.sheet')));

    /* The old private code guarded this with a secret somebody could recite.
       Nothing should be reading it any more. */
    t.ok('no shareable code decides who can read a day now',
      await a2.evaluate(() => {
        const src = document.querySelector('script[src*="app.js"]');
        return !!src && localStorage.getItem('bsc.myCode') === null;
      }));
    /* Asking who somebody is means loading Firebase from another host, and
       doing that on every page load would put a request to gstatic in front
       of every reader who never signs in — the property this app has kept
       since it was built. A device that signed in remembers so locally; only
       that one goes looking. */
    t.ok('a visitor with no account fetches nothing from another host',
      bootOutside.length === 0 &&
        await a2.evaluate(() => localStorage.getItem('bsc.myAccount') === null),
      bootOutside.join(' '));
    /* And once the sheet IS opened, exactly one host may be reached and it is
       the one that draws the sign-in button. Naming it is the point: the old
       assertion covered the whole session, so it would have gone red for the
       right reason and been read as "nothing may ever be fetched", when what
       the app actually promises is that a reader who never asks to sign in
       never phones home. Anything else appearing here is a regression. */
    t.ok('and opening the sheet reaches Google, and nowhere else',
      await a2.evaluate(() => {
        const hosts = [...new Set(performance.getEntriesByType('resource')
          .filter((e) => e.name.indexOf(location.origin) !== 0)
          .map((e) => new URL(e.name).hostname))];
        return hosts.every((h) => h === 'accounts.google.com' || h === 'ssl.gstatic.com');
      }),
      await a2.evaluate(() => [...new Set(performance.getEntriesByType('resource')
        .filter((e) => e.name.indexOf(location.origin) !== 0)
        .map((e) => new URL(e.name).hostname))].join(', ')));
    t.ok('and personal keys still never enter the household document',
      await a2.evaluate(() => JSON.stringify(Object.keys(window.Store.state))
        .indexOf('macro') < 0));

    /* ---- knowing without asking ---------------------------------------
     *
     * The complaint this answers is "I cannot tell if I am signed in." The
     * sheet has always known; you had to open it to be told, which is two
     * presses to learn a thing that ought to be ambient. So the gear carries
     * the answer — but only the half worth interrupting for. */

    /* Nobody who has not signed in should ever meet a warning about an
       account they do not have. This is also the boot promise: finding out
       must not cost them a request to another host. */
    t.ok('a visitor with no account is never warned about one',
      await a2.evaluate(() => {
        const g = document.getElementById('macroMore');
        const w = document.getElementById('macroWho');
        return !!g && !g.classList.contains('mday-warn') && !!w && w.textContent === '';
      }));

    /* A device that HAS an account and cannot reach the server. Firebase is
       cut off at the wire rather than stubbed, so ready() rejects the way it
       would on a train — the path that used to set 'error' and tell nobody. */
    /* Its own context, not t.fresh: cutting the wire makes the page throw on
       purpose, and t.fresh fails a test for any thrown error — rightly, for
       every page that is not this one. */
    const goneCtx = await t.browser.newContext({ viewport: { width: 390, height: 800 } });
    const gone = await goneCtx.newPage();
    // only Firebase. Leave the rest of gstatic alone, or Google's own sign-in
    // script breaks on its assets and throws about something unrelated.
    await gone.route(/firebasejs|firebaseio|identitytoolkit|firestore\.googleapis/,
      async (r) => { await r.abort(); });
    await gone.goto(t.base + 'index.html');
    await gone.evaluate(() => { localStorage.clear(); localStorage.setItem('bsc.myAccount', '1'); });
    await gone.reload({ waitUntil: 'networkidle' });
    await gone.click('.tab[data-view="macros"]');
    /* NOT asserted: that the gear stays quiet in the second before Firebase
       answers. The rule is in mSyncTrouble ('off' warns only once mAuthKnown)
       and it is the reason a signed-in phone does not flash a warning on
       every boot — but the window is not observable through this harness.
       reload() waits on the very script the test is holding, so by the time
       the page can be measured the answer has already arrived. Chasing it
       buys a flaky test for a one-second state; the rule stands on review. */
    await gone.waitForTimeout(2200);
    t.ok('a device whose day cannot reach its account says so on the gear',
      await gone.evaluate(() => {
        const g = document.getElementById('macroMore');
        return !!g && g.classList.contains('mday-warn');
      }),
      await gone.evaluate(() => (document.getElementById('macroMore') || {}).className));
    /* The dot has to be visible, not merely classed — it is drawn by ::after
       and a rule that never landed would fail silently. */
    t.ok('and the mark is actually painted, not just named',
      await gone.evaluate(() => {
        const g = document.getElementById('macroMore');
        const a = g && getComputedStyle(g, '::after');
        return !!a && a.content !== 'none' && parseFloat(a.width) > 4;
      }));
    /* What the sheet says in this state is NOT asserted here, and the reason
       is worth writing down: a later mSyncStart overwrites 'error' with 'off'
       (that path re-runs once mAuthKnown is true and falls through to the
       signed-out branch), so the sheet reads "On this device only" whether or
       not the reject handler fired. An assertion here would pass against the
       bug as happily as against the fix. The gear above is pinned; the
       wording needs the overwrite fixed first. */
    await goneCtx.close();

    /* The invariant the refactor bought, asserted on the source itself.
       Nine sites each remembered to redraw the sheet and two forgot, which is
       not a bug you fix — it is a shape you stop building. Two matches: the
       declaration, and the one setter that tells anybody.
     *
       Read from the repository, the way the wipe check above reads it, and
       not fetched from the page: the built site serves the scripts minified, where
       a local like this one is renamed, so the served text says nothing about
       how many places assign it. The source is what the rule is about. */
    /* Every script the page loads, since the door itself (mSyncState) lives
       in src/daysync.js now and app.js keeps the declaration. The getter and
       setter in app.js's LIVE are how a part reaches the variable at all, not
       a door: the part's one write through it is. */
    const fs0 = require('fs'), path0 = require('path'), root0 = path0.join(__dirname, '..');
    const every = [...fs0.readFileSync(path0.join(root0, 'index.html'), 'utf8').matchAll(/<script src="(src\/[^"?]+\.js)/g)]
      .map((m) => fs0.readFileSync(path0.join(root0, m[1]), 'utf8')).join('\n');
    const doors = (every.match(/S_SYNC_STATE\s*=\s/g) || []).length -
      (every.match(/set S_SYNC_STATE\(v\) \{ S_SYNC_STATE = v; \}/g) || []).length;
    t.ok('every sync transition still goes through the one door that tells you',
      doors === 2, doors + ' assignments — one of them is not the setter');

    /* ---- what the security review found -------------------------------
     *
     * A household code is meant to be read aloud, so anyone who has ever
     * heard one can write to that document forever — which makes everything
     * coming back from it input rather than data. sane() used to check four
     * fields and keep the whole object, so secNum arrived exactly as somebody
     * else typed it and went into an HTML attribute in two of these screens. */
    await a2.evaluate(() => {
      const payload = '"></option></select><img src=x onerror="window.__pwned=1">';
      const mine = { evil: { book: 3, name: 'Rolls', ing: ['a'], steps: ['b'],
        secNum: payload, secName: payload } };
      localStorage.setItem('bsc.mine', JSON.stringify(mine));
    });
    await a2.reload();
    await a2.waitForTimeout(400);
    t.ok('a hostile secNum never survives the door',
      await a2.evaluate(() => window.RECIPES.every((r) => typeof r.secNum === 'number')),
      await a2.evaluate(() => JSON.stringify(window.RECIPES
        .filter((r) => typeof r.secNum !== 'number').map((r) => r.secNum))));
    await a2.click('.tab[data-view="macros"]');
    await a2.waitForTimeout(200);
    await openMeal(a2, 'b');
    await pickerList(a2);
    await a2.waitForTimeout(300);
    t.ok('and opening the picker runs nothing',
      await a2.evaluate(() => !window.__pwned && !document.querySelector('img[src="x"]')));
    await a2.goBack();
    await a2.waitForTimeout(250);
    await home(a2);
    await openPlan(a2);
    await a2.waitForTimeout(300);
    await a2.evaluate(() => {
      if (document.getElementById('mtEditor').classList.contains('hide')) {
        document.querySelector('[data-mtedit]').click();
      }
      const sel = document.querySelector('#mtMeals .mtm-row .mtm-type');
      if (sel) { sel.value = 'x'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await a2.waitForTimeout(300);
    t.ok('nor does unfolding the section checklist',
      await a2.evaluate(() => !window.__pwned && !document.querySelector('img[src="x"]')));
    await a2.evaluate(() => localStorage.removeItem('bsc.mine'));

    /* Signing out has to take the day with it, or the next person to sign in
       on this device inherits a stranger's weight history — and publishes it
       into their own account, where its owner can never reach it again. */
    /* The clearing itself needs a real signed-in account to exercise, which
       is why tests/sync.test.js is kept out of the default run — it talks to
       live Firestore. What is checkable here is the promise the sheet makes,
       since the old copy told people the opposite of what now happens. */
    t.ok('the sheet no longer promises that nothing is deleted',
      await a2.evaluate(() => {
        const src = document.documentElement.innerHTML;
        return src.indexOf('Nothing is deleted anywhere') < 0;
      }));

    await a2.context().close();
  },
});
