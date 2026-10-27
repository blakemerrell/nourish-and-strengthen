/* What the Nourish suites share.
 *
 * tests/macros.test.js was one suite of sixteen thousand lines, split by
 * topic into tests/macros-*.test.js; `node tests/run.js macros` still runs
 * them all. What every one of them needs is here: the page helpers, and
 * nourish(), which gives each suite what the one file gave every page it
 * opened, the morning card shown and a plan already on the page. */

/* The way into the plan lives behind the morning card's press now that the
   weigh-in and the plan card are one card: on the face while there is no plan
   to adjust, folded away with the rest of the evidence once there is. Every
   test that used to reach straight for the button opens the card first, the
   way a thumb would. */
/* The morning card sits SHUT until a weight is entered — the trend, the week
   and the pace are evidence for a number, and before there is a number there
   is nothing for them to be evidence of. So anything reading .mw-verdict has
   to open the card first; it used to be on the face and is now behind the
   same handle the meals wear. */
async function openWeigh(pg) {
  if (await pg.$('.mw-verdict')) return;
  const h = await pg.$('.mday-weigh [data-mfold]');
  if (h) { await h.click(); await pg.waitForTimeout(250); }
}

/* Two doors, and which one is showing depends on whether there is a plan yet.
   With none, the bottom bar's primary button IS the way in — it used to sit
   there disabled and green at exactly this moment, which is the first thing a
   newcomer met. Once a plan exists the bar goes back to saying Fill and the
   card carries "Adjust my plan" behind its fold. */
async function openPlan(pg) {
  if (await pg.evaluate(() => {
    const b = document.getElementById('macroFill');
    return !!b && b.classList.contains('to-plan') && !b.disabled;
  })) { await pg.click('#macroFill'); await pg.waitForTimeout(250); await revealPlanFields(pg); return; }
  if (!await pg.$('#macroTargBtn')) {
    const handle = await pg.$('.mday-weigh [data-mfold]');
    if (handle) { await handle.click(); await pg.waitForTimeout(250); }
  }
  await pg.click('#macroTargBtn');
  await revealPlanFields(pg);
}

/* A first run opens as four steps with three of them hidden, and Playwright
   will not type into what it cannot see. Nearly every test that touches these
   fields is about something else entirely — carb cycling, the measured burn,
   what Save keeps — so they get the sheet with everything reachable rather
   than a page of Next-tapping in front of the thing they are actually
   asserting. The stepping itself has its own tests, which open the sheet
   without this. */
/* The meal rows and Save fold away on a known profile for the same reason —
   the sheet opens on the plan, not on the editor — so they are opened here
   too. #mtEditor is deliberately NOT: whether the profile form arrives folded
   is a thing tests assert, and the ones that want the boxes press Edit, which
   is what a reader does. */
async function revealPlanFields(pg) {
  await pg.evaluate(() => {
    document.querySelectorAll('[data-mtwstep]').forEach((s) => { s.hidden = false; });
    // and the wizard's folds — the pace rows, the training days, the gram boxes
    document.querySelectorAll('.mt-sheet details').forEach((d) => { d.open = true; });
    // the activity select is hidden behind three words on a first run; the
    // tests that pick a multiplier off it are about the multiplier
    ['mtMealsWrap', 'mtSave', 'mtAct'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hide');
    });
  });
  await pg.waitForTimeout(80);
}

  /* The picker's resting list. It used to be reached by pressing one of three
     tiles — Scan / Look up / Recipes — each of which drew a whole different
     screen. Two of those are gone: one box on the resting screen does both
     jobs, so "go to the list" is now "make sure no chip is filtering it".
     Kept as a helper rather than deleted from twenty-four call sites, because
     every one of them means "get me to the list" and that is worth still
     being able to say. */
  /* Puts a RECIPE on the plate, not whatever row is first. The picker's list
     holds single foods beside dishes now, and a food plate is opened by a
     different attribute and has no entry in window.RECIPES — so tests that go
     on to read the recipe behind the plate have to ask for one. */
  /* Opens the basket on the bar. It is shut when a sheet opens — a basket you
     have not filled has nothing to say — and it holds the rows a test needs to
     count or click. The readout on the bar is the handle. */
  /* Opens the picker on the first meal.
   *
     The add button sits at the foot of the open meal now, and a card that
     happens to end near the bottom of a short screen leaves it under the
     pinned bar. A thumb just scrolls on; Playwright scrolls only far enough
     to touch the nearest edge, which is the edge the bar is on. Verified that
     every add button — the last meal's included — clears the bar at some
     scroll position, so this is the harness catching up with the layout, not
     a control a reader cannot reach. */
  async function addOn(pg) {
    /* A meal's tray is the one door to adding food since 2026-10-04: a tap
       opens the meal's sheet, with the picker inside it. The first meal on
       the day that is not skipped. */
    /* By the first of its doors a thumb can see: the pills, or since
       2026-10-11 the + on an empty meal's one row, whose door is drawn
       with nothing in it (myday.js, emptyHTML). */
    await pg.evaluate(() => {
      const c = document.querySelector('#macroSlots .mtray');
      const b = c && [...c.querySelectorAll('[data-mopen]')].find((e) => e.getBoundingClientRect().height > 0);
      document.querySelectorAll('[data-addon]').forEach((e) => e.removeAttribute('data-addon'));
      if (b) { b.setAttribute('data-addon', '1'); b.scrollIntoView({ block: 'center' }); }
    });
    await pg.waitForTimeout(150);
    await pg.click('#macroSlots [data-addon]');
    await pg.waitForTimeout(250);
    // the meal's rows are in its tray, which opens shut
    await openTray(pg);
  }

  /* A plate added to a meal whose time has come arrives eaten, and an eaten
     plate's stepper is quiet. Tests that go on to dial, balance or retry what
     they have just added want it as a plan, whatever hour the suite happens
     to run at — so they untick it, the way a thumb would. One at a time,
     because each tick redraws the day under the next. */
  /* Every plate on a meal back to planned. There is no tick on a single food
     since the meal became its own screen (2026-10-04, Blake: "I'll complete
     the whole meal"), so this works the meal's own tick: pressed, it unticks
     every plate; part-eaten, one press ticks the rest and a second unticks
     them all. */
  async function asPlanned(pg, sk) {
    for (let i = 0; i < 3; i++) {
      const hit = await pg.evaluate((sk2) => {
        const d = [...document.querySelectorAll('[data-mdot="' + sk2 + '"]')].find((x) => x.offsetParent);
        if (!d) return false;
        const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        const any = Object.keys(days).some((k) => ((days[k] || {})[sk2] || []).some((it) => it.eaten));
        if (!any) return false;
        d.click();
        return true;
      }, sk);
      if (!hit) break;
      await pg.waitForTimeout(150);
    }
  }

  /* The basket went on 2026-10-04 (a tap puts food on the meal itself);
     kept as a no-op so a suite that opened it still reads. */
  async function openBasket() {}

  /* One meal's sheet, by key: its tray's door. */
  async function openMeal(pg, sk) {
    await pg.evaluate((k) => {
      const b = document.querySelector('#macroSlots [data-mopen="' + k + '"]');
      if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
    }, sk);
    await pg.waitForTimeout(250);
    await openTray(pg);
  }

  /* Out of the meal's sheet, by Done in its tray (the × left the header on
     2026-10-05; a skipped or bygone meal, with no tray, keeps one). */
  async function closeSheet(pg) {
    /* By selector, not by a handle: the sheet can redraw between finding
       the button and pressing it, and a handle would be to a node now gone. */
    for (const sel of ['#modalRoot .msheet .msh-done', '#modalRoot .msheet .sheet-x']) {
      if (await pg.$(sel)) {
        await pg.click(sel);
        await pg.waitForTimeout(250);
        return;
      }
    }
  }

  /* The meal's tray, opened on its rows: shut, it shows the foods as chips,
     and the dials, the ⋯ and the typed amounts are in the rows. */
  /* The meal's foods up in the page, to dial: since 2026-10-08 a meal with
     food on it opens on them, and a word in the search puts them down to the
     tray's chips, where the count is what brings them back. So the count is
     pressed whenever it is showing. */
  async function openTray(pg) {
    if (await pg.isVisible('#modalRoot .msh-tray .msh-trn')) {
      await pg.click('#modalRoot .msh-tray .msh-trn');
      await pg.waitForTimeout(250);
    }
  }

  async function pickRecipe(pg) {
    await pg.evaluate(() => {
      const r = [...document.querySelectorAll('.mpick-row[data-mpx]')]
        .find((x) => !/^f:/.test(x.dataset.mpick));
      if (r) r.click();
    });
    await pg.waitForTimeout(200);
  }

  async function pickerList(pg) {
    await pg.evaluate(() => {
      const on = document.querySelector('.mp-shelf.on[data-mpshelf]');
      if (on && on.dataset.mpshelf) on.click();
    });
    await pg.waitForTimeout(200);
  }

  /* A dish onto the nth meal of the day, the way a thumb adds one: that
     meal's tray, the list, the first recipe (a tap puts it on the meal), and
     out again. */
  async function addTo(pg, nth) {
    await pg.evaluate((n) => {
      const a = document.querySelectorAll('#macroSlots [data-mopen]')[n];
      a.scrollIntoView({ block: 'center' });
      a.click();
    }, nth);
    await pg.waitForTimeout(250);
    await pickerList(pg);
    await pickRecipe(pg);
    await closeSheet(pg);
  }

  /* What storage holds for one day of the log, or null. */
  function storedDay(pg, k) {
    return pg.evaluate((d) => (JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'))[d] || null, k);
  }

  /* A weigh-in typed and committed, the way Enter does it. */
  async function weighIn(pg, txt) {
    await pg.fill('#mWeight', txt);
    await pg.press('#mWeight', 'Enter');
    await pg.waitForTimeout(250);
  }

  /* The page's own today, which is not the runner's when a test pins it. */
  function todayOn(pg) {
    return pg.evaluate(() => {
      const d = new Date(), q = (n) => (n < 10 ? '0' : '') + n;
      return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate());
    });
  }

/* Going to a day the way a person does since 2026-10-18: the date in the
   day's head is the phone's calendar (#macroDayPick, over the date), and the
   arrows step a week. goDay picks a date in it; stepDay goes n days from the
   one showing, as the old one-day arrows did. */
async function goDay(pg, key) {
  await pg.evaluate((k) => {
    const b = document.getElementById('macroDayPick');
    b.value = k;
    b.dispatchEvent(new Event('change', { bubbles: true }));
  }, key);
  await pg.waitForTimeout(150);
}
async function stepDay(pg, n) {
  const k = await pg.evaluate((n2) => {
    const v = document.getElementById('macroDayPick').value.split('-').map(Number);
    const d = new Date(v[0], v[1] - 1, v[2] + n2), q = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate());
  }, n);
  await goDay(pg, k);
}

/* The day is trays now (2026-10-04): every food shows on its tray and a
   plate's own controls live in its meal's sheet (openMeal). Nothing on the
   day folds, so there is nothing to open; kept as a no-op for the suites
   that read the day. */
const openDay = async () => {};

/* A suite for tests/run.js: nourish({ name, async suite(t, freshBare) { ... } }). */
function nourish(def) {
  return {
    name: def.name,
    /* The morning card (the weigh-in, the training tick, the plan line, the
       coaching lines) lives on Today now: Nourish's page keeps it but does not
       show it, and Today's Weigh in moves it into a sheet. Its behaviour did not
       change, only where a person meets it, and that is held by
       tests/todaydo.test.js. So this suite, which is about the card's own rules,
       shows it in Nourish's page for its pages, and every check below reads it
       where it always has. */
    async run(t) {
      const SHOW = '#view-macros #macroWeigh { display: block !important; }';
      const show = () => { const add = () => { const st = document.createElement('style'); st.textContent = '#view-macros #macroWeigh { display: block !important; }'; document.head.appendChild(st); };
        if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); };
      const fresh0 = t.fresh, ctx0 = t.browser.newContext;
      t.fresh = async (o) => { const pg = await fresh0.call(t, o); await pg.context().addInitScript(show); await pg.addStyleTag({ content: SHOW }); return pg; };
      t.browser.newContext = async (o) => { const c = await ctx0.call(t.browser, o); await c.addInitScript(show); return c; };
      try {
        /* Every page in this suite starts with a plan on it. A page without one no
           longer invents targets — the bars say "Craft your plan." and Fill is
           disabled — so a test that wants a working day has to set one, the way a
           user does. Wrapping t.fresh rather than editing thirty-nine call sites:
           the harness builds a new `t` per suite, so this reaches nothing else,
           and a scripted rename across that many lines is how test names have been
           corrupted here before.
         *
           The first-run tests take their page from bare(), which is the whole
           point of them — they are the ones asserting that an unplanned day says
           so. */
        const freshBare = t.fresh.bind(t);
        t.fresh = async (opts) => {
          const pg = await freshBare(opts);
          await pg.evaluate(() => localStorage.setItem('bsc.macroTargets',
            JSON.stringify({ p: 180, f: 50, c: 50 })));
          await pg.reload();
          await pg.evaluate(() => document.fonts.ready);
          return pg;
        };
        await def.suite(t, freshBare);
      } finally { t.fresh = fresh0; t.browser.newContext = ctx0; }
    },
  };
}

/* A food's controls in a meal's sheet are behind a tap on its line since
   2026-10-24 (Blake's layout "B", src/myday.js mOpenRow): open the line the
   way a thumb does, if it is not open already. `tag` is the meal and the
   food's place in it, "l:0"; with none, the sheet's first food. */
async function openRow(pg, tag) {
  const sel = tag ? '#modalRoot [data-mrowopen="' + tag + '"]' : '#modalRoot [data-mrowopen]';
  const shut = await pg.evaluate((q) => { const b = document.querySelector(q); return !!b && b.getAttribute('aria-expanded') !== 'true'; }, sel);
  if (shut) { await pg.click(sel); await pg.waitForTimeout(150); }
}

/* The same, for the line that holds `inner` (a selector inside a food's
   drawer, say its Details door), wherever in the sheet that food is. */
async function openRowOf(pg, inner) {
  const tag = await pg.evaluate((q) => { const e = document.querySelector(q), row = e && e.closest('.mrow');
    const b = row && row.querySelector('[data-mrowopen]'); return b ? b.dataset.mrowopen : null; }, inner);
  if (tag) {
    await openRow(pg, tag);
    const inMenu = await pg.evaluate((q) => { const e = document.querySelector(q); return !!e && e.hidden; }, inner);
    if (inMenu) { await pg.click('#modalRoot [data-mfmenu="' + tag + '"]'); await pg.waitForTimeout(150); }
  }
}

/* Sync & sharing, the way a thumb reaches it: the top line's pill, or on
   Nourish, where the pill is a dot on the menu since 2026-10-24, ☰ and then
   Sync & sharing. Both open the same sheet. */
async function openSync(pg) {
  const pill = await pg.evaluate(() => { const b = document.getElementById('syncBtn'); return !!b && getComputedStyle(b).display !== 'none'; });
  if (pill) { await pg.click('#syncBtn'); return; }
  await pg.click('#macroMore');
  await pg.click('#macroMenu [data-mmore="you"]');
}

module.exports = { openSync, openRowOf, openRow, goDay, stepDay, nourish, openWeigh, openPlan, revealPlanFields, addOn, asPlanned, openBasket, openMeal, closeSheet, openTray, pickRecipe, pickerList, addTo, storedDay, weighIn, todayOn, openDay };
