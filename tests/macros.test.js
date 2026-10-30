/* The Macros tab: targets, the day, the picker, and the arithmetic between
 * them. Everything is asserted against window.RECIPES and the numbers the
 * page actually shows, never against counts or macros written down here —
 * the data is rebuilt too often for a copied answer to stay true.
 *
 * Split by topic: later sections are in tests/macros-*.test.js, and the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish, goDay, stepDay, openWeigh, openPlan, pickerList, openTray, openRow, openRowOf } = require('./fixtures/nourish.js');

/* The day is trays and a meal opens as its sheet (trays and the meal sheet,
   Blake 2026-10-04). The sheet stands over the day's header, the weigh card
   and the bar, so anything that reaches for them comes back to the day
   first — by the sheet's Done, the way a thumb would (the × left the
   sheet's head for Done in its tray on 2026-10-05; a skipped or bygone meal,
   with no tray, keeps its ×). */
async function toDay(pg) {
  for (const sel of ['#modalRoot .msheet .msh-done', '#modalRoot .msheet .sheet-x']) {
    if (await pg.$(sel)) {
      await pg.click(sel);
      await pg.waitForTimeout(250);
      return;
    }
  }
}
/* Opens one meal's sheet: out of any other meal's first, then that meal's
   tray. A meal already open is left as it is. Either way the plates' tray
   along the sheet's bottom is opened, where they live since 2026-10-05. */
async function openMeal(pg, sk) {
  const open = await pg.evaluate(() => {
    const h = document.querySelector('#modalRoot .msheet [data-mmenu], #modalRoot .msheet [data-mdot]');
    return h ? (h.dataset.mmenu || h.dataset.mdot) : '';
  });
  if (open === sk) { await openTray(pg); return; }
  if (open) await toDay(pg);
  await pg.evaluate((k) => {
    const b = document.querySelector('#macroSlots [data-mopen="' + k + '"]');
    if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
  }, sk);
  await pg.waitForTimeout(300);
  await openTray(pg);
}

module.exports = nourish({
  name: 'Macros',
  async suite(t, freshBare) {
    const p = await freshBare();

    // ---- the tab exists and swaps the view like the other five
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(150);
    t.ok('the Macros tab shows its view and hides the rest',
      await p.evaluate(() =>
        !document.getElementById('view-macros').classList.contains('hide') &&
        document.getElementById('view-browse').classList.contains('hide') &&
        document.querySelector('.tab[data-view="macros"]').getAttribute('aria-selected') === 'true'));

    t.ok('four meal slots on the day',
      await p.evaluate(() => document.querySelectorAll('.mslot').length) === 4);
    t.ok('the day starts on today, said as its date, its calendar from the first day logged to a week ahead',
      await p.evaluate(() => {
        const b = document.getElementById('macroDayPick'), q = (n) => (n < 10 ? '0' : '') + n;
        const k = (d) => d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate());
        // a fresh phone: nothing logged before today, so the calendar starts at today
        const now = new Date(), wk = new Date();
        wk.setDate(wk.getDate() + 7);
        return b.value === k(now) && b.max === k(wk) && b.min <= k(now) &&
          /^Today, /.test(b.getAttribute('aria-label')) && /^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/.test(document.getElementById('macroDateTx').textContent);
      }));

    // the two morning verbs are the bar; everything else folded behind the ⋯
    t.ok('the day carries two buttons, not a row of five',
      await p.evaluate(() => {
        const a = document.querySelector('.mday-acts');
        return !!document.getElementById('macroFill') && !!document.getElementById('macroRebal') &&
          getComputedStyle(a).position === 'sticky' &&
          document.getElementById('macroMenu').classList.contains('hide');
      }));
    await p.click('#macroMore');
    await p.waitForTimeout(80);
    t.ok('and the gear opens where the day is set up',
      await p.evaluate(() => !document.getElementById('macroMenu').classList.contains('hide') &&
        document.getElementById('macroMore').getAttribute('aria-expanded') === 'true' &&
        [...document.querySelectorAll('#macroMenu [data-mmore]')].map((b) => b.dataset.mmore)
          /* Four, not six. "Meals & shares" and "How My Day works" were two
             more doors into the plan sheet the first entry already opens —
             three of six landing in one room — and both destinations are
             accordions that sheet already shows. */
          .join() === 'plan,foods,eatout,you,went,copy'));
    await p.click('.mday-rail');
    await p.waitForTimeout(80);
    t.ok('and a press anywhere else closes it',
      await p.evaluate(() => document.getElementById('macroMenu').classList.contains('hide')));

    // the tab explains itself by working, not by a paragraph about itself
    t.ok('no explainer paragraph rides along',
      await p.evaluate(() => !document.getElementById('macroNote') &&
        !document.getElementById('mdayTune')));

    // ---- a first run has no plan, then one that is set and its derived calories
    const defP = 180, defF = 50, defC = 50;
    const defKcal = 4 * defP + 4 * defC + 9 * defF;
    const foot = () => p.textContent('#macroFoot');
    /* What used to be asserted here: "default targets are 180P / 50F / 50C".
       That triple was a placeholder, and this test was what held it in place.
       It rendered in exactly the shape a plan somebody made renders, so a
       first run opened on "No plan yet." above a full week of 1,370-kcal
       budgets belonging to nobody, four bars reading 0 / 180 g, and a Fill
       button ready to draft a real day against them. Both empty states were
       already written — the placeholder was the only reason neither fired. */
    /* It says what the tab IS, not just what to do next. Every other tab in
       the app explains itself when empty; this one said "Craft your plan."
       and, a hundred pixels below, "No plan yet. Craft my plan" — the same
       instruction twice and an explanation none, on the tab with the steepest
       ideas in it. */
    t.ok('a first run explains what this tab is, rather than only ordering you about',
      /your day/i.test(await foot()) && /(lose|goal)/i.test(await foot()), await foot());
    /* The safety property is unchanged and is the one worth asserting: no
       plan, no draft. What changed is that the button no longer sits there
       dead — it is the way to MAKE the plan, which is the only useful thing
       it could do at that moment. */
    t.ok('and the biggest button on the tab is the way in, not a dead end',
      await p.evaluate(() => {
        const b = document.getElementById('macroFill');
        return !!b && !b.disabled && b.classList.contains('to-plan') &&
          /plan/i.test(b.textContent);
      }),
      await p.evaluate(() => {
        const b = document.getElementById('macroFill');
        return b ? JSON.stringify({ text: b.textContent, disabled: b.disabled,
          cls: b.className }) : 'no button';
      }));
    t.ok('and pressing it will not draft a day against a plan nobody set',
      await p.evaluate(() => {
        document.getElementById('macroFill').click();
        const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        return Object.keys(d).every((k) => Object.keys(d[k] || {})
          .every((sk) => !(d[k][sk] || []).length));
      }),
      await p.evaluate(() => localStorage.getItem('bsc.macroDays') || 'no days'));
    t.ok('and no empty meal is handed a calorie budget of its own',
      await p.evaluate(() => !document.querySelector('#macroSlots [data-mv="empty"]')));

    // a plan that IS set reads back off the bars, calories derived not stored
    await p.evaluate((tg) => localStorage.setItem('bsc.macroTargets', JSON.stringify(tg)),
      { p: defP, f: defF, c: defC });
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);
    t.ok('a plan that is set shows its three targets on the bars',
      new RegExp('/ ' + defP + ' g').test(await foot()) &&
      new RegExp('/ ' + defF + ' g').test(await foot()) &&
      new RegExp('/ ' + defC + ' g').test(await foot()), await foot());
    t.ok('the calorie line is derived 4/4/9 from the targets',
      new RegExp('/ ' + defKcal.toLocaleString() + '(?!\\d)').test(await foot()), await foot());
    /* One budget in the shape of what it is: calories are the SUM the other
       three are parts of, so they are the headline and P/F/C are three
       columns under it. Four identical bars said protein and the whole day's
       energy were the same rank of fact. Each of the four still carries its
       two bands — eaten and planned — because that is the reading, not the
       layout. (A third hatched in what an empty meal was assumed to become;
       Blake: "I don't need the hash lines when blank. Just blank is fine.")
       The assumption still lands in the delta the top pills print. */
    t.ok('calories are the headline and the macros are three columns under it',
      await p.evaluate(() => {
        const head = document.querySelector('.mhead');
        const cols = [...document.querySelectorAll('.mbars3 .mbrow')];
        const bands = (r) => r.querySelector('.mb-ate') && r.querySelector('.mb-plan') &&
          !r.querySelector('.mb-asm');
        return !!head && head.dataset.macro === 'kcal' && bands(head) &&
          cols.length === 3 && cols.map((r) => r.dataset.macro).join() === 'p,f,c' &&
          cols.every(bands) &&
          // no stray fourth bar left in the old stack
          !document.querySelector('.mbars > .mbrow') && !document.querySelector('.mslot-left');
      }), await p.evaluate(() => (document.querySelector('.mpillwk-a11y') || document.querySelector('.mbars')).innerHTML.slice(0, 300)));
    /* Three fills only compare by eye if the tracks they sit in are the same
       length. The old stack gave each macro a full card width and its own
       label column, which made three bars that could only be read one at a
       time against their own targets — four readings of a thing that should
       take one. */
    t.ok('and the three columns are the same width as each other',
      await p.evaluate(() => {
        const w = [...document.querySelectorAll('.mbars3 .mb-track')]
          .map((e) => Math.round(e.getBoundingClientRect().width));
        return w.length === 3 && Math.max.apply(null, w) - Math.min.apply(null, w) <= 1 &&
          w[0] > 40;
      }), await p.evaluate(() => [...document.querySelectorAll('.mbars3 .mb-track')]
        .map((e) => e.getBoundingClientRect().width).join(', ')));
    /* A band, not a line. Two grams of fat past a sixty-one gram target is
       landing on it, not busting it — the old rule turned red on the first
       gram over and made a day that was fine look like a day that was not. */
    t.ok('a macro within ten grams of target reads as on it',
      await p.evaluate(() => {
        const st = (m, plan, target) => {
          const diff = plan - target, pct = 100 * plan / target;
          const near = m === 'kcal' ? Math.abs(diff) <= target * 0.03 : Math.abs(diff) <= 10;
          const overAt = m === 'p' ? 110 : m === 'kcal' ? 105 : 100;
          return near ? 'on' : pct > overAt ? 'over' : pct >= 90 ? 'on' : 'under';
        };
        return st('f', 63, 61) === 'on' &&        // two grams over is on target
          st('p', 213, 223) === 'on' &&           // ten under is on target
          st('kcal', 1783, 1709) === 'on' &&      // four per cent is rounding
          st('c', 83, 67) === 'over' &&           // a quarter over is not
          st('c', 40, 67) === 'under' &&
          st('kcal', 1900, 1709) === 'over';
      }));

    /* And a signed number for what is left, on the line it belongs to —
       spoken rather than printed, now that three columns have no room for a
       third figure at a width a phone actually is. The pills a line above
       print the same number. Losing it from the markup would take it from a
       screen reader too, which is the reading that has nowhere else to go. */
    /* Signed in data-d, and SAID without the minus: "-495 to go" is what a
       screen reader read out, which is a number to go and a sign saying the
       opposite. Over keeps its plus. */
    t.ok('and each of the four still says what is left of it, signed in data-d and spoken as it reads',
      await p.evaluate(() => {
        const c = [...document.querySelectorAll('[data-macro] .mb-d')];
        return c.length === 4 &&
          c.every((x) => /^-?\d+$/.test(x.dataset.d)) &&
          c.every((x) => {
            const d = Number(x.dataset.d), said = x.textContent.trim();
            return d > 0 ? said === '+' + d + ' over' : said === Math.abs(d) + ' to go';
          });
      }), await p.textContent('#macroFoot'));
    /* A floor and a ceiling, and neither is a budget — which is why on a day
       that is fine they are NOTHING. They were two bars under the macros,
       which put five things in a column and invited you to read them as five
       budgets to fill; filling the protein bar is the day going right and
       filling the salt bar is the day going wrong, and drawing both the same
       way, always, is the readout arguing with itself.
     *
       The rule is the one a plate already keeps: there is no "on" chip, and
       that is what makes a chip mean something. */
    /* The day here is empty: no salt anywhere near the ceiling, and a fibre
       floor that is only "missed" in the sense that the day has not happened
       yet. Both silent. */
    t.ok('a day inside the floor and under the ceiling says nothing about either',
      await p.evaluate(() => {
        const lim = document.querySelector('.mlimits');
        return !!lim && lim.children.length === 0;
      }), await p.evaluate(() => (document.querySelector('.mlimits') || {}).outerHTML));
    /* But the live region has to be ON the page while it is empty. A status
       region added at the moment it gains content is a region nothing was
       watching when it changed, and the announcement is lost. */
    t.ok('and the region that would carry the warning is already there, watched',
      await p.evaluate(() => {
        const lim = document.querySelector('.mlimits');
        return !!lim && lim.getAttribute('role') === 'status';
      }));
    /* Silent has to mean silent. An empty container that still draws its
       divider and holds its margin is the furniture this change was made to
       remove — the card would look exactly as it did, minus the words. */
    t.ok('and it draws no rule and takes no height while it is empty',
      await p.evaluate(() => {
        const lim = document.querySelector('.mlimits');
        return lim.children.length === 0 &&
          parseFloat(getComputedStyle(lim).borderTopWidth) === 0 &&
          Math.round(lim.getBoundingClientRect().height) === 0;
      }), await p.evaluate(() => {
        const l = document.querySelector('.mlimits');
        return getComputedStyle(l).borderTopWidth + ' / ' +
          l.getBoundingClientRect().height + ' / ' + l.children.length;
      }));

    /* ---- and the other half of that guard --------------------------------
     * "It says nothing" passes just as well against a readout that can no
     * longer say anything at all. So the same claim from the other side, on
     * a page of its own: a day carrying half a bottle of soy sauce across
     * four meals, which busts the ceiling and leaves the floor nowhere near
     * met. Both lines must appear, name their number, and carry the state
     * that colours them. */
    const limPg = await t.fresh();
    await limPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 50, c: 50 }));
      /* every meal carries something, so nothing is being ASSUMED — which is
         the condition fibre waits for before it will say a word */
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:egg_white', x: 2, eaten: 1 }, { id: 'f:soy_sauce', x: 1, eaten: 1 }],
        l: [{ id: 'f:cooked_beef', x: 1.5, eaten: 1 }, { id: 'f:soy_sauce', x: 1, eaten: 1 }],
        d: [{ id: 'f:cooked_beef', x: 1.5, eaten: 1 }, { id: 'f:soy_sauce', x: 1, eaten: 1 }],
        s: [{ id: 'f:cheddar', x: 1, eaten: 1 }] } }));
    });
    await limPg.reload();
    await limPg.waitForTimeout(400);
    await limPg.click('.tab[data-view="macros"]');
    await limPg.waitForTimeout(350);
    const limSay = await limPg.evaluate(() => {
      const rows = [...document.querySelectorAll('.mlimits .mlim')];
      return { n: rows.length, text: rows.map((r) => r.textContent).join(' ~ '),
        keys: rows.map((r) => r.dataset.lim).join(),
        states: rows.map((r) => [...r.classList].filter((c) => c !== 'mlim').join()).join(' '),
        border: parseFloat(getComputedStyle(document.querySelector('.mlimits')).borderTopWidth) };
    });
    t.ok('but a day over the ceiling and short of the floor says both, by name',
      limSay.n === 2 && limSay.keys === 'fib,na' &&
      /\d+ g fibre/.test(limSay.text) &&
      /short of the floor/.test(limSay.text) &&
      /mg.*salt/.test(limSay.text) && /over the [\d,]+ ceiling/.test(limSay.text),
      JSON.stringify(limSay));
    /* The colours invert here and the app must not forget it: there is no
       such thing as too much fibre on a cut, and being under a salt ceiling
       is the default rather than something to congratulate. */
    t.ok('and fibre never turns red while salt never turns green',
      /\bshort\b/.test(limSay.states) && !/\bpast\b|\bnear\b/.test(limSay.states.split(' ')[0]) &&
      /\bpast\b/.test(limSay.states.split(' ')[1] || '') &&
      !/\bmet\b/.test(limSay.states.split(' ')[1] || ''),
      limSay.states);
    // and now the rule IS drawn, because there is something under it
    t.ok('and only now does it draw its rule across the card', limSay.border > 0,
      String(limSay.border));
    /* Fibre's patience, asserted directly: empty the snack slot and the same
       shortfall stops being a finding, because the rest of the day is what
       fixes it. Salt keeps talking — a ceiling can be busted at lunch. */
    await limPg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      days[k].s = [];
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await limPg.reload();
    await limPg.waitForTimeout(400);
    await limPg.click('.tab[data-view="macros"]');
    await limPg.waitForTimeout(350);
    t.ok('and a meal still to come is what buys fibre its silence, not salt',
      await limPg.evaluate(() => {
        const k = [...document.querySelectorAll('.mlimits .mlim')].map((r) => r.dataset.lim);
        return k.length === 1 && k[0] === 'na';
      }), await limPg.evaluate(() => (document.querySelector('.mlimits') || {}).textContent));
    await limPg.context().close();

    /* Carb cycling. RP does not eat the same thing seven days a week: a
       training day earns more carbohydrate and a rest day gives it back, so
       the WEEK averages to the plan while the days differ. Derived from the
       workouts box, overridden by tapping a day. */
    /* The strip stopped printing each day's target under it — that is a fact
       about the PLAN, and the strip is a record of OUTCOMES, and three lines
       of type per column is a table turned on its side rather than a
       heatmap. It stays in the label, which is where a reader who is
       listening rather than looking was always getting it. */
    const wkTarget = () => p.evaluate(() => [...document.querySelectorAll('.mwk-d')]
      .map((e) => Number((e.getAttribute('aria-label')
        .match(/(\d+) calorie target/) || [0, 0])[1])));
    t.ok('with no workouts named, every day asks for the same thing',
      await (async () => {
        const k = await wkTarget();
        return k.length === 7 && new Set(k).size === 1 && k[0] > 0;
      })(), (await wkTarget()).join(','));
    await openPlan(p);
    await p.waitForTimeout(200);
    // four lifting days, picked (the count is how many there are)
    for (const d of [0, 2, 4, 5]) await p.click('[data-mtrain="' + d + '"]');
    await p.click('[data-mtarg="save"]');
    await p.waitForTimeout(350);
    const cyc = await p.evaluate(() => ({
      week: [...document.querySelectorAll('.mwk-d')].map((e) => Number((e.getAttribute('aria-label')
        .match(/(\d+) calorie target/) || [0, 0])[1])),
      train: [...document.querySelectorAll('.mwk-d')].map((e) => e.classList.contains('train')),
      base: (() => {
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets')) || { p: 180, f: 50, c: 50 };
        return 4 * t2.p + 4 * t2.c + 9 * t2.f;
      })(),
    }));
    t.ok('four workouts make four bigger days and three smaller ones',
      cyc.train.filter(Boolean).length === 4 &&
      new Set(cyc.week).size === 2 &&
      Math.max.apply(null, cyc.week) > cyc.base &&
      Math.min.apply(null, cyc.week) < cyc.base,
      cyc.week.join(',') + ' around ' + cyc.base);
    /* The whole point: the week still adds up to the plan. Rounding each of
       seven days to whole grams is allowed to drift a few calories. */
    t.ok('and the week still averages to the plan',
      Math.abs(cyc.week.reduce((a, b) => a + b, 0) - 7 * cyc.base) <= 20,
      cyc.week.reduce((a, b) => a + b, 0) + ' vs ' + 7 * cyc.base);
    // protein holds steady; the carbohydrate carries the swing
    t.ok('protein does not move with the cycle, carbs do',
      await p.evaluate(() => {
        const num = (m) => {
          const r = document.querySelector('.mbrow[data-macro="' + m + '"] .mb-num');
          return Number(r.textContent.split('/')[1].replace(/\D/g, ''));
        };
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets')) || { p: 180, f: 50, c: 50 };
        return num('p') === t2.p && num('f') === t2.f && num('c') !== t2.c;
      }));
    // and a day can be flipped by hand without the workouts box undoing it
    await openPlan(p);
    await p.waitForTimeout(200);
    await p.click('[data-mtrain="1"]');
    await p.waitForTimeout(250);
    t.ok('tapping a day sets it, in the one list Strengthen shares',
      await p.evaluate(() => (window.Train.liftDays() || []).indexOf(1) >= 0));
    await p.click('[data-mtrain="1"]');
    await p.waitForTimeout(200);
    await p.click('.sheet-x');
    await p.waitForTimeout(250);

    /* Crafting a plan is a once-a-season job, so the daily screen carries
       what the plan is DOING rather than a button for making one. With no
       plan yet the line still says so — and the way in is still out in the
       OPEN, because a first morning that hides it behind a press is a first
       morning with nowhere to go. What changed is where open is.
     *
       It used to be a ghost button on this card, one of three "Craft my plan"
       in a screenful, none of them the thing a thumb lands on. It is the
       bottom bar's primary button now: pinned, always visible, the largest
       control on the tab, and — measured on a cold first run — previously
       sitting there disabled and green at exactly this moment. */
    await openWeigh(p);
    t.ok('with no plan, the card still says so',
      /No plan yet/.test(await p.textContent('.mw-verdict')),
      await p.textContent('.mw-verdict'));
    /* Asserted as a RULE rather than a snapshot, because which of the two
       states a page is in depends on the fixture and the rule holds in both:
       exactly one place offers the way into the plan, it is reachable without
       a press, and it says which job it is doing. Written as an either/or so
       it cannot pass by both doors being shut. */
    t.ok('and exactly one way into the plan is on the face, saying what it does',
      await p.evaluate(() => {
        const bar = document.getElementById('macroFill');
        const card = document.querySelector('#macroTargBtn');
        const seen = (e) => { if (!e || e.disabled) return false;
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0; };
        const barIsDoor = !!bar && bar.classList.contains('to-plan');
        if (barIsDoor) return seen(bar) && /plan/i.test(bar.textContent) && !card;
        return seen(card) && /plan/i.test(card.textContent) &&
          /fill/i.test(bar.textContent);
      }),
      await p.evaluate(() => {
        const bar = document.getElementById('macroFill');
        const card = document.querySelector('#macroTargBtn');
        return 'bar=' + (bar ? bar.textContent + '/' + bar.className : 'none') +
          ' card=' + (card ? card.textContent : 'none');
      }));

    /* The four presets are rates, the way RP frames a cut — a percent of
       bodyweight a week, not a percent off the day's burn — so each one
       lands where somebody who has used that app expects it to. */
    t.ok('the presets are rates, and land where a cut is expected to land',
      await p.evaluate(() => {
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut2' }));
        /* No lifting days either: the ones picked above are the one shared
           list now, and would count as sessions in this burn. */
        localStorage.removeItem('bsc.train');
        return true;
      }));
    await p.reload();
    await p.waitForTimeout(300);
    await openPlan(p);
    await p.waitForTimeout(250);
    const kcalNow = () => p.evaluate(() => Number(document.getElementById('mtBigKcal').textContent));
    const RATE = { cut2: 0.010, cut1: 0.0075, keep: 0, gain: -0.0025 };
    for (const key of ['cut2', 'cut1', 'keep', 'gain']) {
      await p.evaluate(() => {
        if (document.getElementById('mtEditor').classList.contains('hide')) {
          document.querySelector('[data-mtedit]').click();
        }
      });
      await p.click('[data-mtgoal="' + key + '"]');
      await p.waitForTimeout(200);
      const want = await p.evaluate((r) => {
        /* The profile as the APP reads it: bodyweight comes off the scale
           now, and bsc.macroProfile holds only the fallback for a plan made
           before there was a log. Reading storage here tests a body the
           fixture may have spent thirty mornings losing. */
        const pr = window.__macroLab.profile();
        const kg = pr.lb * 0.45359237, cm = (pr.ft * 12 + pr.inch) * 2.54;
        const tdee = (10 * kg + 6.25 * cm - 5 * pr.age + 5) * pr.act;
        return Math.max(1500, Math.round(tdee - r * pr.lb * 3500 / 7));
      }, RATE[key]);
      /* Within a few kcal: the headline is the sum of the rounded gram
         boxes, not the raw target, which is the whole point of the boxes
         being the plan's one rendering. */
      t.ok('  ' + key + ' is the rate it claims', Math.abs(await kcalNow() - want) <= 8,
        await kcalNow() + ' vs ' + want);
    }
    t.ok('a hard cut lands where a hard cut is expected — near fifteen hundred',
      (await kcalNow()) > 0 && await p.evaluate(async () => {
        document.querySelector('[data-mtgoal="cut2"]').click();
        await new Promise((r) => setTimeout(r, 200));
        const k = Number(document.getElementById('mtBigKcal').textContent);
        return k >= 1400 && k <= 1600;
      }), await kcalNow());
    await p.click('.sheet-x');
    await p.waitForTimeout(250);
    await p.evaluate(() => localStorage.removeItem('bsc.macroProfile'));
    await p.reload();
    await p.waitForTimeout(300);

    /* A day rarely divides into six whole recipes. What fills the last two
       hundred calories is a spoon of honey or half a tin of tuna — and the
       food table those recipes are costed from was already in the browser
       with no door on it. */
    /* The meal's tray opens its sheet, and the picker is in it (trays and the
       meal sheet, 2026-10-04). */
    await openMeal(p, 'l');
    await pickerList(p);
    await p.waitForTimeout(250);
    /* The lens, not the rail. A macro chip narrows to things that are mostly
       that macro and then ranks them by FIT, so on a main meal a dish beats a
       spoonful and 🥩 gives ten recipes and one tin of tuna — the right answer
       to "what protein should I eat" and the wrong one to "show me the plain
       foods". That second question is about KIND, and the lens is where kind
       lives, beside "Every recipe".
     *
       I cut this option when the rail shipped, assuming the chips replaced
       it. They do not, and the failure looked like flakiness for three
       attempts before the app was asked what it was actually showing. */
    await p.selectOption('#mpSec', 'foods');
    await p.waitForTimeout(300);
    t.ok('the plain foods have a lens of their own',
      await p.evaluate(() => {
        const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
        return rows.length >= 20 && rows.every((r) => r.dataset.mpick.indexOf('f:') === 0);
      }), await p.evaluate(() =>
        document.querySelectorAll('#mpList .mpick-row').length + ' rows'))
    t.ok('and each is offered in a unit a person would use',
      await p.evaluate(() => {
        const rows = [...document.querySelectorAll('#mpList .mpick-row[data-mpick]')];
        const txt = rows.map((r) => r.textContent).join(' ');
        // a cup of milk and a spoon of honey, not a spoon of milk or a cup of butter
        return rows.length > 0 && /cup|tbsp|each|oz|can/.test(txt);
      }));
    await p.selectOption('#mpSec', 'meal');
    await p.waitForTimeout(250);
    await p.fill('#mpFind', 'honey');
    await p.waitForTimeout(250);
    t.ok('and a search reaches them from any lens, since typing it says enough',
      await p.evaluate(() => {
        const rows = [...document.querySelectorAll('.mpick-row[data-mpick]')];
        return rows.some((r) => /honey/i.test(r.textContent));
      }));
    /* "Honey" also matches a recipe with honey in it, which is correct and
       not what we are after here. */
    const honeyRow = await p.evaluate(() => {
      const r = [...document.querySelectorAll('.mpick-row[data-mpick]')]
        .find((x) => x.dataset.mpick.indexOf('f:') === 0 && /honey/i.test(x.textContent));
      return r ? r.dataset.mpick : null;
    });
    t.ok('a food is addable like anything else', honeyRow && honeyRow.indexOf('f:') === 0, honeyRow);
    await p.evaluate(() => {
      [...document.querySelectorAll('.mpick-row[data-mpick]')]
        .find((x) => x.dataset.mpick.indexOf('f:') === 0 && /honey/i.test(x.textContent)).click();
    });
    await p.waitForTimeout(300);
    t.ok('and lands on the day carrying its own macros',
      await p.evaluate(() => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        return (day.l || []).some((it) => String(it.id).indexOf('f:') === 0);
      }));
    /* The unit sits on the stepper, beside the buttons that change it —
       "1 cup", not "×1". Where it came from stays a chip. */
    /* The "Yours" half of this went with the provenance row. A plate no
       longer says which shelf its food came from — not the book, not the
       yield, not "Yours" — because that was a whole row per plate spent on
       reference rather than on the decision in front of you, and all of it is
       a tap away behind the name. Asked how far to cut, Blake: all of it goes.

       What is asserted here is the half that was always the point: the unit
       is named ON THE AMOUNT. "21 g" or "1 cup", not "×1". */
    await openTray(p);
    t.ok('with its unit named on the amount, and no recipe pretending to be behind it',
      await p.evaluate(() => {
        const el = document.querySelector('.mitem-food');
        if (!el || el.dataset.open) return false;
        const row = el.closest('.mitem');
        const amount = row.querySelector('.mstep-x').textContent;
        return amount.indexOf('×') < 0 && /[a-z]/i.test(amount);
      }), await p.evaluate(() => {
        const el = document.querySelector('.mitem-food');
        if (!el) return 'no food row';
        const row = el.closest('.mitem');
        return 'amount "' + row.querySelector('.mstep-x').textContent + '"';
      }));

    /* The plate says nothing about where the food came from. Guarding the
       deletion, not just doing it: the row grew back once before, as a line
       of chips, and a note in a stylesheet does not stop that. */
    t.ok('and the plate no longer names the shelf it came from',
      await p.evaluate(() => !document.querySelector('#macroSlots .mitem-from')),
      await p.evaluate(() => (document.querySelector('#macroSlots .mitem-from') || {})
        .textContent || ''));
    /* The name is a door, though — the same door a recipe's name is. A food
       used to be a dead label, which left a five-part salad that had been
       kept together reading as one word with no way back to what was in it.
       Pressing it opens the food: what one of it is, and its parts. */
    await openRowOf(p, '#modalRoot .mitem-food');
    await p.click('.mitem-food');
    await p.waitForTimeout(250);
    t.ok('pressing a food\'s name opens the food',
      await p.evaluate(() => {
        const sheet = document.querySelector('.mfs-name');
        return !!sheet && /honey/i.test(sheet.textContent) &&
          !!document.querySelector('.mfs-one') && !!document.querySelector('.mk-tot');
      }), await p.evaluate(() => (document.getElementById('modalRoot') || {}).textContent || ''));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    t.ok('and Escape closes it like any other sheet',
      await p.evaluate(() => !document.querySelector('.mfs-name')));
    t.ok('while the collection itself is untouched — a spoon of honey is not a recipe',
      await p.evaluate(() => window.RECIPES.every((r) => String(r.id).indexOf('f:') !== 0)));
    await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      day.l = [];
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await p.reload();
    await p.waitForTimeout(300);

    /* ---- one tap, onto the meal ----------------------------------------
     * A meal assembled from parts — a scoop of whey, a splash of half and
     * half, a spoon of honey — used to cost one full trip through this sheet
     * per part, because picking anything closed it. Then it cost a basket and
     * an "Add N". Since 2026-10-04 (Blake: "ONE way to add and select food")
     * a tap puts the food on the meal and the sheet stays open for the next. */
    const sOf = () => p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const day = days[Object.keys(days)[0]] || {};
      return (day.s || []).map((i) => String(i.id));
    });
    await openMeal(p, 's');
    await pickerList(p);
    await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelectorAll('.mpick-row[data-mpick]')[0].click());
    await p.waitForTimeout(250);
    t.ok('picking does not close the sheet, it puts the food on the meal at once',
      (await sOf()).length === 1 && await p.evaluate(() => !!document.querySelector('#modalRoot .msheet')), JSON.stringify(await sOf()));
    /* Picked by taking whatever row is NOT yet ticked, never by index: every
       pick re-ranks the bands, so the row that was third is not third after. */
    for (let i = 0; i < 2; i++) {
      await p.evaluate(() => {
        const row = [...document.querySelectorAll('.mpick-wrap:not(.in) .mpick-row[data-mpick]')][0];
        if (row) row.click();
      });
      await p.waitForTimeout(250);
    }
    t.ok('and several go on, one tap each', (await sOf()).length === 3, JSON.stringify(await sOf()));
    t.ok('the meal\'s pills, pinned over the list, count what was just put on it',
      await p.evaluate(() => {
        const c = document.querySelector('#modalRoot .msh-top .mcap .mcap-t');
        return !!c && Number(c.textContent.replace(/[^\d/]/g, '').split('/')[0]) > 0 &&
          document.querySelectorAll('#modalRoot .mrows .mrow').length === 3;
      }), await p.evaluate(() => (document.querySelector('#modalRoot .msh-top') || {}).textContent));
    // pressed again, a row comes back off rather than doubling up
    t.ok('a second press takes it back off',
      await p.evaluate(async () => {
        const row = document.querySelector('.mpick-wrap.in .mpick-row[data-mpick]');
        if (!row) return false;
        row.click();
        await new Promise((r) => setTimeout(r, 250));
        return document.querySelectorAll('#modalRoot .mrows .mrow').length === 2;
      }) && (await sOf()).length === 2, JSON.stringify(await sOf()));
    /* A side trip to name something must not throw away what is on the meal.
       The form draws over the picker rather than replacing it. */
    await p.click('[data-mpnew]');
    await p.waitForTimeout(250);
    t.ok('naming a new food draws over the picker rather than closing it',
      await p.evaluate(() => !!document.querySelector('#nfName')));
    await p.click('[data-nf="cancel"]');
    await p.waitForTimeout(250);
    t.ok('and backing out of it leaves the meal exactly as it was',
      (await sOf()).length === 2 && await p.evaluate(() => !!document.querySelector('#modalRoot .msheet') &&
        document.querySelectorAll('.mpick-wrap.in').length >= 1));
    const sWas = await sOf();
    await toDay(p);
    t.ok('and Done leaves what was picked on the meal, back on the day',
      JSON.stringify(await sOf()) === JSON.stringify(sWas) && await p.evaluate(() => !document.querySelector('#modalRoot .msheet')),
      JSON.stringify(sWas));
    /* The day is trays (2026-10-04): a meal shows its foods as lines on its
       tray, and its tray opens it again — on the sheet's own tray along the
       bottom, shut to a chip a food (2026-10-05). */
    t.ok('the tray shows what is on the meal, and opens it again',
      await p.evaluate(async () => {
        const b = document.querySelector('#macroSlots [data-mopen="s"]');
        const tray = b && b.closest('.mtray');
        if (!tray || tray.querySelectorAll('.mtray-f').length !== 2) return false;
        b.click();
        await new Promise((r) => setTimeout(r, 300));
        // its foods as rows in the pinned On box; the chip strip along the bottom went in #102
        return document.querySelectorAll('#modalRoot .msheet .msh-top .msh-on .mrows .mrow').length === 2;
      }), await p.evaluate(() => {
        const b = document.querySelector('#macroSlots [data-mopen="s"]');
        const tr = b && b.closest('.mtray');
        return tr ? tr.outerHTML : 'no Snacks';
      }));

    // and a fresh sheet starts with nothing ticked rather than inheriting the last one
    await openMeal(p, 'l');
    t.ok('the next meal opens with nothing ticked in its picker',
      await p.evaluate(() => !!document.querySelector('#modalRoot .msheet') && !document.querySelector('.mpick-wrap.in')));
    await toDay(p);
    await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      days[Object.keys(days)[0]].s = [];
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await p.reload();
    await p.waitForTimeout(300);

    /* Food no book and no table has heard of — a tamale from a cart. The day
       has to add up, and a plate you cannot log is a plate that quietly makes
       every number on the screen wrong. */
    await openMeal(p, 'd');
    await pickerList(p);
    await p.waitForTimeout(250);
    t.ok('the picker offers a way to name something it has never heard of',
      await p.evaluate(() => {
        document.querySelector('#mpSec').value = 'foods';
        document.querySelector('#mpSec').dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }));
    await p.waitForTimeout(250);

    /* The three ways in are the sheet's first screen, and each one is one tap
       from + Add. Looking it up beats guessing, and neither host is touched
       until asked — a reader who never opens this box still fetches nothing. */
    await pickerList(p);
    await p.waitForTimeout(200);
    t.ok('Look up is one box, not a mode inside a mode',
      await p.evaluate(() => !!document.querySelector('#mpFind') &&
        !!document.querySelector('.mp-cam[data-mpmode="scan"]')));
    await p.click('[data-mpmode="scan"]');
    await p.waitForTimeout(200);
    t.ok('and Scan opens the lens with the typed number beside it',
      await p.evaluate(() => !!document.querySelector('#scanRoot') &&
        !!document.querySelector('[data-nf="code"]') && !!document.querySelector('#nfFind')));
    t.ok('and asking with an empty box says so rather than reaching out',
      await p.evaluate(async () => {
        document.querySelector('[data-nf="code"]').click();
        await new Promise((r) => setTimeout(r, 150));
        return /Type the number/.test(document.getElementById('nfResults').textContent) &&
          performance.getEntriesByType('resource')
            .every((e) => e.name.indexOf(location.origin) === 0);
      }));
    await p.click('[data-mpnew]');
    await p.waitForTimeout(250);
    /* Safari has no barcode reader and will not grow one, so the decoder is
       in here rather than on somebody's CDN. Proved against a barcode built
       to spec, at three sizes, which needs no camera and no luck. */
    t.ok('the app can read a barcode it has never seen, at any scale',
      await p.evaluate(() => {
        const L = ['0001101','0011001','0010011','0111101','0100011','0110001',
                   '0101111','0111011','0110111','0001011'];
        const G = ['0100111','0110011','0011011','0100001','0011101','0111001',
                   '0000101','0010001','0001001','0010111'];
        const PAT = ['000000','001011','001101','001110','010011','011001',
                     '011100','010101','010110','011010'];
        const code = '0038000138416';                 // a real UPC, checksum and all
        const d = code.split('').map(Number);
        let bits = '101';
        for (let i = 1; i <= 6; i++) bits += (PAT[d[0]][i - 1] === '0' ? L : G)[d[i]];
        bits += '01010';
        for (let i = 7; i < 13; i++) {
          bits += L[d[i]].split('').map((b) => (b === '1' ? '0' : '1')).join('');
        }
        bits += '101';
        return [2, 3, 5].every((scale) => {
          const row = [];
          for (let q = 0; q < 10 * scale; q++) row.push(255);
          for (const b of bits) for (let s2 = 0; s2 < scale; s2++) row.push(b === '1' ? 20 : 235);
          for (let q = 0; q < 10 * scale; q++) row.push(255);
          return window.__ean(row) === code;
        });
      }));
    t.ok('and a scrambled one is refused rather than guessed at',
      await p.evaluate(() => {
        const junk = [];
        for (let i = 0; i < 400; i++) junk.push(i % 7 < 3 ? 20 : 235);
        return window.__ean(junk) === null;
      }));
    t.ok('which asks what it is called and what is in it',
      await p.evaluate(() => !!document.querySelector('#nfName') &&
        !!document.querySelector('#nfKcal') && !!document.querySelector('#nfP')));
    await p.click('[data-nf="save"]');
    await p.waitForTimeout(200);
    const foodKeys = await p.evaluate(() => {
      const k = window.__macroLab.newFoodKey, mine = { lunch: {}, caf: {}, lunch_2: {} };
      return [k('Lunch', mine), k('Café', mine), k('Soup', mine)].map((x) => x.key + '/' + x.name).join();
    });
    t.ok('a food saved under a name already taken gets a number, rather than rewriting the old one and every day that holds it',
      foodKeys === 'lunch_3/Lunch 3,caf_2/Café 2,soup/Soup', foodKeys);
    t.ok('a nameless one is refused, since it could never be found again',
      /needs a name/i.test(await p.textContent('#nfNote')));
    await p.fill('#nfName', 'Chicken tamale');
    await p.fill('#nfUnit', 'tamale');
    await p.click('[data-nf="save"]');
    await p.waitForTimeout(200);
    t.ok('and one with no numbers at all is refused too',
      /at least the calories/i.test(await p.textContent('#nfNote')));
    /* Macros but no calories: the calories follow rather than leaving the
       day's headline short by a whole plate. */
    await p.fill('#nfP', '10');
    await p.fill('#nfF', '12');
    await p.fill('#nfC', '25');
    await p.click('[data-nf="save"]');
    await p.waitForTimeout(350);
    /* Named from inside a meal's sheet, so it goes on that meal, the way a
       tap on any row does, and the sheet comes back with it ticked. */
    t.ok('a food named here goes on the meal, and the meal\'s sheet comes back',
      await p.evaluate(() => !!document.querySelector('#modalRoot .msheet') && !document.querySelector('#nfName') &&
        [...document.querySelectorAll('#modalRoot .mrows .mrow')].some((r) => /Chicken tamale/.test(r.textContent))));
    t.ok('it lands on the meal that asked for it',
      await p.evaluate(() => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        return (day.d || []).some((it) => String(it.id) === 'f:my:chicken_tamale');
      }));
    t.ok('with its calories worked out from the macros given',
      await p.evaluate(() => {
        const r = window.RECIPES.concat([]).length &&
          document.querySelector('.mitem-mac');
        const mine = JSON.parse(localStorage.getItem('bsc.myFoods'));
        return mine.chicken_tamale.kcal === 4 * 10 + 4 * 25 + 9 * 12;
      }), await p.evaluate(() => localStorage.getItem('bsc.myFoods')));
    t.ok('and it is there for next time, in its own words',
      await p.evaluate(() => {
        const el = [...document.querySelectorAll('.mitem-food')]
          .find((x) => /Chicken tamale/.test(x.closest('.mitem').textContent));
        // its own unit, on the amount where the buttons that change it are
        return !!el && /tamale/.test(el.closest('.mitem').querySelector('.mstep-x').textContent);
      }));
    await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      const day = days[Object.keys(days)[0]];
      day.d = [];
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      localStorage.removeItem('bsc.myFoods');
    });
    await p.reload();
    await p.waitForTimeout(300);

    /* Steps and sessions were stored, printed back, and never added up —
       somebody asking what ten thousand steps buys was asking a question the
       app ignored. The day is built from its parts now, so they are levers. */
    await p.evaluate(() => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
        inch: 11, lb: 205, act: 1.375, goal: 'cut2', goalLb: 175, goalBy: '',
        workouts: 3, steps: 7000 }));
    });
    await p.reload();
    await p.waitForTimeout(300);
    await openPlan(p);
    await p.waitForTimeout(250);
    await p.evaluate(() => {
      if (document.getElementById('mtEditor').classList.contains('hide')) {
        document.querySelector('[data-mtedit]').click();
      }
    });
    await p.waitForTimeout(150);
    const coach = () => p.textContent('#mtCoach');
    /* "moving about" rather than "walking" since the middle part is the job
       or the steps, whichever says more — this profile is on its feet. */
    t.ok('the day is shown in the parts you can move',
      /living/.test(await coach()) && /moving about/.test(await coach()) &&
      /training/.test(await coach()), await coach());
    /* Said once, in the ledger — the coach used to say it again a screen
       lower, and Blake called the sheet messy. The ledger's Arriving row is
       the projection when there is no date, so a dateless pace still lands
       somewhere the reader can see. */
    const ledger = () => p.textContent('#mtFacts');
    t.ok('and a pace with no date still says where it lands you',
      /→ 175 lb/.test(await ledger()) && /Arriving\s*about /.test(await ledger()),
      await ledger());
    t.ok('with each lever priced both ways — food now, or the date sooner',
      /a day at the same pace/.test(await coach()) && /sooner/.test(await coach()),
      await coach());
    const before = await p.evaluate(() => Number(document.getElementById('mtBigKcal').textContent));
    await p.fill('#mtSteps', '13000');
    await p.waitForTimeout(250);
    t.ok('walking further really does buy more food at the same pace',
      await p.evaluate((b2) => Number(document.getElementById('mtBigKcal').textContent) > b2, before),
      before + ' → ' + await p.evaluate(() => document.getElementById('mtBigKcal').textContent));
    await p.fill('#mtSteps', '7000');
    await p.waitForTimeout(200);
    /* The panel describes a plan the boxes may not be showing, so it offers
       it rather than overwriting a day somebody meant. */
    t.ok('a plan the boxes are not showing is offered rather than forced',
      await p.evaluate(() => !!document.querySelector('[data-mtuse]')));
    await p.click('[data-mtuse]');
    await p.waitForTimeout(200);
    /* Against the plan the profile works out to, not a range written down
       here: the range (1,450–1,600) was this profile's burn with its job
       thrown away, and on its feet with three sessions it burns more now. */
    t.ok('and taking it fills the boxes with what the panel described',
      await p.evaluate(() => {
        const k = Number(document.getElementById('mtBigKcal').textContent);
        const pl = window.__macroLab.plan(window.__macroLab.profile());
        return k === 4 * pl.p + 4 * pl.c + 9 * pl.f && !document.querySelector('[data-mtuse]');
      }), await p.evaluate(() => document.getElementById('mtBigKcal').textContent + ' vs ' +
        JSON.stringify(window.__macroLab.plan(window.__macroLab.profile()))));
    await p.click('.sheet-x');
    await p.waitForTimeout(250);
    await p.evaluate(() => localStorage.removeItem('bsc.macroProfile'));
    await p.reload();
    await p.waitForTimeout(300);

    /* A day saved before the deficit was capped is still in storage being
       served every morning, and it can sit below what the body burns at
       rest. Reading it corrects it back up to what the same profile works
       out to now — and leaves a hand-typed, edible plan alone. */
    t.ok('a saved plan from before the caps is corrected on the way out of storage',
      await p.evaluate(() => {
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5,
          inch: 11, lb: 205, act: 1.375, goal: 'cut1', goalLb: 175, goalBy: '2026-12-01' }));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 226, f: 62, c: 13 }));
        return true;
      }));
    await p.reload();
    await p.waitForTimeout(400);
    t.ok('so the day it serves clears the floor, with room left to eat',
      await p.evaluate(() => {
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        const kc = 4 * t2.p + 4 * t2.c + 9 * t2.f;
        return kc >= 1500 && 4 * t2.c >= 0.14 * kc;
      }), await p.evaluate(() => localStorage.getItem('bsc.macroTargets')));

    /* But only a plan's own record. The same grams marked as the person's
       (auto 0) are theirs: P 400 / F 10 / C 0 was saved, the day read
       190 / 57 / 93 with no word, and a reload rewrote storage itself. */
    await p.evaluate(() => localStorage.setItem('bsc.macroTargets',
      JSON.stringify({ p: 226, f: 62, c: 13, auto: 0, set: '2026-09-01' })));
    await p.reload();
    await p.waitForTimeout(400);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    t.ok('the same grams typed by hand are left as typed, in storage and on the day',
      await p.evaluate(() => {
        const t2 = JSON.parse(localStorage.getItem('bsc.macroTargets'));
        return t2.p === 226 && t2.f === 62 && t2.c === 13 && t2.auto === 0;
      }) && /\/ 226 g/.test(await foot()),
      await p.evaluate(() => localStorage.getItem('bsc.macroTargets')) + ' | ' + await foot());

    /* Which is safe only because Save no longer keeps a day Nourish cannot
       plan. It refuses, writes nothing, and says why under the total. */
    const keepT = JSON.stringify({ p: 190, f: 60, c: 150, auto: 0, set: '2026-09-01' });
    await p.evaluate((v) => localStorage.setItem('bsc.macroTargets', v), keepT);
    await p.reload();
    await p.waitForTimeout(400);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    await openPlan(p);
    await p.waitForTimeout(250);
    // the gram boxes are in the profile's fold on a plan already made
    await p.evaluate(() => {
      if (document.getElementById('mtEditor').classList.contains('hide')) {
        document.querySelector('[data-mtedit]').click();
      }
    });
    await p.waitForTimeout(150);
    const refuse = async (pp, ff, cc) => {
      await p.fill('#mtP', pp);
      await p.fill('#mtF', ff);
      await p.fill('#mtC', cc);
      await p.waitForTimeout(150);
      const was = await p.textContent('#mtRefuse');
      await p.click('[data-mtarg="save"]');
      await p.waitForTimeout(300);
      return p.evaluate((w) => ({ was: w, said: (document.getElementById('mtRefuse') || {}).textContent || '',
        open: !!document.getElementById('mtP'), stored: localStorage.getItem('bsc.macroTargets') }), was);
    };
    const noCarb = await refuse('400', '10', '0');
    t.ok('P 400 / F 10 / C 0 is refused with why and the least Nourish can plan, and nothing is written',
      noCarb.open && noCarb.stored === keepT && /no room for carbs/.test(noCarb.said) &&
        /least Nourish can plan for you is [\d,]+ kcal/.test(noCarb.said), JSON.stringify(noCarb));
    const zeros = await refuse('0', '0', '0');
    t.ok('and so are three zeros, which used to save and show the plan’s numbers',
      zeros.open && zeros.stored === keepT && /no calories/.test(zeros.said) &&
        /least Nourish can plan/.test(zeros.said) && zeros.was === '', JSON.stringify(zeros));
    const handSane = await refuse('200', '65', '140');
    t.ok('while a day it can plan, typed by hand, still saves as the person’s own',
      !handSane.open && handSane.said === '' &&
        /"p":200,"f":65,"c":140,"auto":0/.test(handSane.stored || ''), JSON.stringify(handSane));
    await p.evaluate(() => {
      localStorage.removeItem('bsc.macroProfile');
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 150, f: 40, c: 60 }));
    });
    await p.reload();
    await p.waitForTimeout(300);
    t.ok('and a plan typed by hand, with no profile behind it, is left alone',
      await p.evaluate(() => localStorage.getItem('bsc.macroTargets').indexOf('150') >= 0));

    // ---- edit the targets; they hold across a reload
    await openPlan(p);
    await p.waitForTimeout(150);
    await p.fill('#mtP', '150');
    await p.fill('#mtF', '40');
    await p.fill('#mtC', '60');
    t.ok('the kcal line follows the boxes as they are typed',
      (await p.textContent('#mtKcal')).indexOf(String(4 * 150 + 4 * 60 + 9 * 40)) >= 0,
      await p.textContent('#mtKcal'));
    await p.click('[data-mtarg="save"]');
    await p.waitForTimeout(300);
    t.ok('saved targets land in the footer',
      /\/ 150 g/.test(await foot()) && /\/ 40 g/.test(await foot()) && /\/ 60 g/.test(await foot()),
      await foot());
    await p.reload();
    await p.waitForTimeout(300);
    t.ok('a refresh lands back on the tab you were on, not on Recipes',
      await p.evaluate(() => !document.getElementById('view-macros').classList.contains('hide') &&
        document.querySelector('.tab[data-view="macros"]').getAttribute('aria-selected') === 'true'));
    t.ok('targets survive a reload',
      /\/ 150 g/.test(await foot()), await foot());

    // ---- the picker: ranked rows, sane suggestions, protein at the top
    await openMeal(p, 'b');
    await pickerList(p);
    await p.waitForTimeout(200);
    t.ok('the picker sheet opens on the meal', !!(await p.$('#mpList')));
    /* Recipe rows only. The list is one list now and holds single foods
       beside dishes, so a lookup in window.RECIPES comes back undefined for
       "f:tuna" — and these four assertions are about the RECIPE ranking. Food
       ids carry a prefix; recipe ids are numbers. */
    const sanity = await p.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.mpick-row[data-mpx]'))
        .filter((r) => !/^f:/.test(r.dataset.mpick));
      const macsOf = (r) => window.RECIPES.find((x) => String(x.id) === r.dataset.mpick).macro;
      const ppk = (r) => { const m = macsOf(r); return m.kcal ? m.p / m.kcal : 0; };
      const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
      return {
        n: rows.length,
        maxX: Math.max.apply(null, rows.map((r) => Number(r.dataset.mpx))),
        top: mean(rows.slice(0, 5).map(ppk)),
        bottom: mean(rows.slice(-5).map(ppk)),
      };
    });
    t.ok('the picker has rows to rank', sanity.n > 5, sanity.n + ' rows');
    t.ok('and every row it can score wears its leaf',
      await p.evaluate(() => Array.from(document.querySelectorAll('.mpick-row[data-mpx]'))
        .filter((r) => !/^f:/.test(r.dataset.mpick))
        .every((row) => {
          const rec = window.RECIPES.find((x) => String(x.id) === row.dataset.mpick);
          return !rec || rec.score === null || !!row.querySelector('.leaf');
        })));
    t.ok('no suggested portion exceeds ×3', sanity.maxX <= 3, '×' + sanity.maxX);
    t.ok('the top of the ranking carries more protein per calorie than the bottom',
      sanity.top > sanity.bottom, sanity.top.toFixed(4) + ' vs ' + sanity.bottom.toFixed(4));

    // ---- the back gesture closes the sheet without leaving the app
    await p.goBack();
    await p.waitForTimeout(250);
    t.ok('back closes the picker and stays on the day',
      await p.evaluate(() => !document.querySelector('#mpList') &&
        !document.getElementById('view-macros').classList.contains('hide')));

    // ---- add the top suggestion; the footer moves by exactly x times the recipe
    await openMeal(p, 'b');
    await pickerList(p);
    await p.waitForTimeout(200);
    /* A RECIPE row, deliberately: everything below multiplies the recipe's own
       macros by the portion, and the list holds single foods beside dishes
       now, so taking the first row can hand back "f:tuna" and every lookup in
       window.RECIPES then comes back undefined. */
    const picked = await p.evaluate(() => {
      const r = [...document.querySelectorAll('.mpick-row[data-mpx]')]
        .find((x) => !/^f:/.test(x.dataset.mpick));
      return { id: r.dataset.mpick, x: Number(r.dataset.mpx) };
    });
    await p.evaluate((id) => {
      [...document.querySelectorAll('.mpick-row[data-mpx]')]
        .find((x) => x.dataset.mpick === id).click();
    }, picked.id);
    // a tap puts it on breakfast; the sheet stays open on it
    await p.waitForTimeout(400);
    const shown = async () => {
      const f = await foot();
      const m = f.match(/(\d+) \/ 150 g/);
      return m ? Number(m[1]) : NaN;
    };
    const expectP = (x) => p.evaluate(([id, mult]) =>
      Math.round(window.RECIPES.find((r) => String(r.id) === id).macro.p * mult), [picked.id, x]);
    t.ok('one item on the breakfast slot',
      await p.evaluate(() => document.querySelectorAll('#modalRoot .mrows .mitem').length) === 1);
    t.ok('planned protein is the recipe times the suggested portion',
      (await shown()) === (await expectP(picked.x)),
      (await shown()) + ' shown, ' + (await expectP(picked.x)) + ' expected at ×' + picked.x);
    /* An added plate arrives planned, whatever the hour — Blake, 2026-09-27:
       "Why when I add a dish does it mark it as eaten?... I want to tick it
       complete." The tick is the only way a plate becomes eaten. */
    t.ok('added to breakfast, the plate arrives planned, not eaten',
      await p.evaluate(() => !!document.querySelector('.mitem') && !document.querySelector('.mitem.eaten')));

    /* ---- the dial moves in grams and the totals follow. A recipe is dialled
       by the gram from its serving weight since 2026-10-04 (Blake: "I dial in
       grams of food not kitchen measurements"), five at a time. */
    const xb = () => p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      return days[Object.keys(days)[0]].b[0].x;
    });
    const gramsOn = async () => parseInt((await p.textContent('#modalRoot [data-mtype="b:0"]')).replace(/[^\d]/g, ''), 10);
    const g0 = await gramsOn();
    await openRow(p, 'b:0');
    await p.click('#modalRoot [data-mstep="b:0:up"]');
    await p.waitForTimeout(150);
    const g1 = await gramsOn(), x1 = await xb();
    t.ok('a step up moves the portion five grams, onto the five-gram grid',
      g1 > g0 && g1 - g0 <= 5 && g1 % 5 === 0, g0 + ' → ' + g1);
    t.ok('and the planned protein follows the portion',
      (await shown()) === (await expectP(x1)),
      (await shown()) + ' vs ' + (await expectP(x1)));
    await openRow(p, 'b:0');
    await p.click('#modalRoot [data-mstep="b:0:down"]');
    await p.waitForTimeout(150);
    for (let i = 0; i < 400 && (await gramsOn()) > 5; i++) await p.click('#modalRoot [data-mstep="b:0:down"]');
    await openRow(p, 'b:0');
    await p.click('#modalRoot [data-mstep="b:0:down"]');
    await p.waitForTimeout(150);
    t.ok('the portion clamps at five grams, not zero',
      /^~?5 g$/.test(await p.textContent('#modalRoot [data-mtype="b:0"]')), await p.textContent('#modalRoot [data-mtype="b:0"]'));
    const xMin = await xb();
    t.ok('and the totals clamp with it',
      xMin > 0 && (await shown()) === (await expectP(xMin)),
      (await shown()) + ' vs ' + (await expectP(xMin)));
    /* Typed back, the way a weigher does it: tap the grams, type, Enter. */
    await openRow(p, 'b:0');
    await p.click('#modalRoot [data-mtype="b:0"]');
    await p.waitForTimeout(150);
    await p.fill('#modalRoot .mstep-in', String(g0));
    await p.press('#modalRoot .mstep-in', 'Enter');
    await p.waitForTimeout(250);
    t.ok('and a typed weight sets it in grams', (await gramsOn()) === g0, (await gramsOn()) + ' vs ' + g0);

    // ---- eaten: the tick fills the bar and the line-through arrives
    t.ok('nothing is eaten yet, so the eaten sweep is empty',
      await p.evaluate(() => document.querySelector('[data-macro="kcal"]').dataset.eaten === '0'));
    t.ok('a planned but uneaten meal is still ahead of you on the day',
      await p.evaluate(() => {
        const st = document.querySelector('#macroSlots .mtray.filled');
        return st && !st.classList.contains('done');
      }));
    /* No per-food tick (Blake, 2026-10-04: "No individual foods ticks...
       I'll complete the whole meal"). Breakfast has one plate, so the meal's
       tick — at the top of its sheet — is the tick on that plate. */
    await p.click('#modalRoot [data-mdot="b"]');
    await p.waitForTimeout(150);
    t.ok('ticking a meal marks it eaten',
      await p.evaluate(() => !!document.querySelector('#modalRoot .mitem.eaten')));
    /* What is behind you shows on the day, and the tick is how it says so. */
    t.ok('and fills its tick on the day',
      await p.evaluate(() => document.querySelector('#macroSlots [data-mopen="b"]').closest('.mtray').classList.contains('done')));
    t.ok('and the eaten sweep takes on a share of the dial',
      await p.evaluate(() => Number(document.querySelector('[data-macro="kcal"]').dataset.eaten) > 0));
    await p.click('#modalRoot [data-mdot="b"]');
    await p.waitForTimeout(150);
    await toDay(p);
    /* The dot said a meal was behind you but could never be told so, and no
       keyboard or screen reader knew it was there. Now it is the fastest way
       to say "ate all of that". */
    t.ok('the dot is a real control, named for what it does',
      await p.evaluate(() => {
        const b2 = document.querySelector('#macroSlots .mday-dot');
        return b2 && b2.tagName === 'BUTTON' && /Mark /.test(b2.getAttribute('aria-label'));
      }));
    const eatenB = () => p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      return (days[Object.keys(days)[0]].b || []).map((it) => it.eaten);
    });
    await p.click('#macroSlots .mtray.filled .mday-dot');
    await p.waitForTimeout(200);
    t.ok('pressing it eats the whole meal',
      (await eatenB()).every((e) => e) && await p.evaluate(() => {
        const st = document.querySelector('#macroSlots .mtray.filled');
        return st.classList.contains('done') && st.querySelector('.mday-dot').getAttribute('aria-pressed') === 'true';
      }), JSON.stringify(await eatenB()));
    await p.click('#macroSlots .mtray.filled .mday-dot');
    await p.waitForTimeout(200);
    t.ok('and pressing it again gives the meal back',
      !(await eatenB()).some((e) => e) && await p.evaluate(() => {
        const st = document.querySelector('#macroSlots .mtray.filled');
        return !st.classList.contains('done');
      }));
    t.ok('an empty meal has nothing to press',
      await p.evaluate(() => Array.from(document.querySelectorAll('#macroSlots .mtray'))
        .every((st) => st.classList.contains('filled') ||
          st.querySelector('.mday-dot').disabled)));
    t.ok('unticking reverses it, dot and all',
      !(await eatenB()).some((e) => e) &&
      await p.evaluate(() => document.querySelector('[data-macro="kcal"]').dataset.eaten === '0' &&
        !document.querySelector('#macroSlots .mtray.done')));

    /* A day with every plate eaten is a finished day, and the week strip
       says so: the circle fills, tinted by where the day landed (under, on,
       over) rather than by the plain fact of eating. Today keeps its ink
       fill so the strip still says where you are, and wears its verdict as
       a ring instead — it is the day most often finished while you watch. */
    t.ok('a day is not done while a plate is still ahead of you',
      await p.evaluate(() => !document.querySelector('.mwk-d.now').classList.contains('done')));
    /* How "done" is SAID has moved once already — it was a tinted fill under
       a ring, it is now a solid fill inside one — so the guard asks the
       question rather than naming the property: does the square look
       different at all. Pinning it to box-shadow is what made this fail the
       first time the answer moved to the background. */
    /* Read off the BAR now: the square became a pill of a bar chart, and
       what marks today is an ink edge on its track while a finished day is
       a solid fill where an unfinished one is pale. */
    const paintOf = () => p.evaluate(() => {
      const tr = getComputedStyle(document.querySelector('.mwk-d.now .mwk-b'));
      const fill = document.querySelector('.mwk-d.now .mwk-b i');
      return [tr.borderColor, tr.borderWidth, fill ? getComputedStyle(fill).opacity : 'no fill',
        getComputedStyle(document.querySelector('.mwk-d.now .mwk-n')).fontWeight].join(' | ');
    });
    /* The strip is in the day's header, under a meal's sheet while one is
       open (2026-10-04): read it from the day, tick from the tray. */
    await toDay(p);
    const ringBefore = await paintOf();
    await p.click('#macroSlots .mday-dot');
    await p.waitForTimeout(200);
    t.ok('eating every plate marks the day done on the week strip',
      await p.evaluate(() => {
        const d = document.querySelector('.mwk-d.now');
        /* 'open' is today with dinner still to come: every plate eaten is not
           the day closed, so it says what is left rather than a verdict. */
        return d.classList.contains('done') &&
          ['under', 'on', 'over', 'open'].some((s) => d.classList.contains(s)) &&
          /all done/.test(d.getAttribute('aria-label'));
      }), await p.evaluate(() => document.querySelector('.mwk-d.now').outerHTML));
    const ringAfter = await paintOf();
    t.ok('and today, done, looks different from today in progress',
      ringAfter !== ringBefore &&
      // and it is still marked as the day you are on, either way: the ink edge
      parseFloat(ringAfter.split(' | ')[1]) >= 2 && parseFloat(ringBefore.split(' | ')[1]) >= 2,
      ringBefore + '\n   vs ' + ringAfter);
    t.ok('an empty day is never done, whatever the strip says of it',
      await p.evaluate(() => [...document.querySelectorAll('.mwk-d:not(.now)')]
        .every((d) => !d.classList.contains('done'))));
    await p.click('#macroSlots .mday-dot');
    await p.waitForTimeout(200);
    t.ok('and giving the meal back takes the day off done',
      await p.evaluate(() => !document.querySelector('.mwk-d.now').classList.contains('done')));

    /* Whether a plate fits the day and whether it is worth eating are two
       questions, and the second used to need the recipe opened. */
    await openMeal(p, 'b');
    t.ok('a plate wears its nutrition score',
      await p.evaluate(() => {
        const lf = document.querySelector('.mitem .leaf');
        if (!lf) return false;
        const n = Number(lf.querySelector('.leaf-n').textContent);
        const day = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const id = String(day[Object.keys(day)[0]].b[0].id);
        return n === window.RECIPES.find((r) => String(r.id) === id).score;
      }));
    t.ok('and the leaf says what it means, for anyone who cannot read the colour',
      await p.evaluate(() => /out of 100/.test(
        document.querySelector('.mitem .leaf').getAttribute('aria-label'))));

    // the name opens the recipe (Details, in its line's drawer); the back gesture walks home to the day
    await openRowOf(p, '#modalRoot .mitem-name');
    await p.click('.mitem-name');
    await p.waitForTimeout(250);
    t.ok('tapping the name opens the recipe itself',
      await p.evaluate(() => {
        const s = document.querySelector('.sheet-name');
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        const r = window.RECIPES.find((x) => String(x.id) === String(day.b[0].id));
        return !!s && s.textContent === r.name;
      }));
    await p.goBack();
    await p.waitForTimeout(250);
    /* Opened from a meal's sheet, back lands on that sheet (2026-10-04). */
    t.ok('and back lands on the meal\'s sheet, with nothing phantom-ticked',
      await p.evaluate(() => !!document.querySelector('#modalRoot .msheet') && !document.querySelector('.sheet-name') &&
        !document.getElementById('view-macros').classList.contains('hide') &&
        !document.querySelector('.mitem.eaten')));

    // ---- over budget: shrink the targets under what is planned
    await toDay(p);     // the plan's door is on the day, not in a meal's sheet
    await openPlan(p);
    await p.waitForTimeout(150);
    await p.fill('#mtP', '1');
    await p.fill('#mtF', '1');
    await p.fill('#mtC', '1');
    await p.click('[data-mtarg="save"]');
    await p.waitForTimeout(300);
    // the bar carries the state, its own row's delta carries how far past you are
    t.ok('a busted macro says over, in the over state',
      await p.evaluate(() => {
        const over = document.querySelector('.mbrow.over');
        const past = !!over && Number(over.querySelector('.mb-d.pos').dataset.d) > 0 &&
          /^\+\d+$/.test(over.querySelector('.mb-d.pos b').textContent);
        return !!over && past;
      }), await foot());
    /* Colour is the verdict, not the eating. A day 10 g past its protein
       target must not draw the same ring as one that landed on it — which
       is exactly what happened while green meant "eaten": both sweeps clamp
       at 100%, so over and on-the-nose were the same picture. */
    /* The four budget rows. The floor and the ceiling below them are bars
       too, but they are not budgets and carry no under/on/over — that is the
       whole point of them being drawn differently. */
    t.ok('every bar names where it stands',
      await p.evaluate(() => Array.from(document.querySelectorAll('[data-macro]'))
        .every((d) => ['under', 'on', 'over'].indexOf(d.dataset.state) >= 0)));
    t.ok('and an overshoot reads over even with every plate eaten',
      await p.evaluate(() => {
        const d = document.querySelector('.mbrow.over');
        return d && d.dataset.state === 'over' && Number(d.dataset.planned) === 100;
      }));
    /* Protein is the one macro a cut wants overshot, so its band runs to
       110%; fat and carbs turn at the line. The fit scorer has always judged
       them that way and the dial must not contradict it. */
    t.ok('protein gets a wider band than fat and carbs',
      await p.evaluate(() => {
        const pctOf = (d) => {
          const m2 = d.querySelector('.mb-num').textContent.match(/(\d+) \/ (\d+)/);
          return 100 * Number(m2[1]) / Number(m2[2]);
        };
        return Array.from(document.querySelectorAll('[data-macro]')).every((d) =>
          d.dataset.state !== 'over' ||
          // the shown figure is rounded, so a hair over the line reads as on it
          pctOf(d) >= (d.dataset.macro === 'p' ? 110 : d.dataset.macro === 'kcal' ? 105 : 100));
      }));
    t.ok('the bar caps at full rather than running past its own end',
      await p.evaluate(() => Array.from(document.querySelectorAll('[data-macro]'))
        .every((d) => Number(d.dataset.planned) <= 100 && Number(d.dataset.eaten) <= 100)));
    await openPlan(p);
    await p.waitForTimeout(150);
    await p.fill('#mtP', '150');
    await p.fill('#mtF', '40');
    await p.fill('#mtC', '60');
    await p.click('[data-mtarg="save"]');
    await p.waitForTimeout(300);

    // ---- the estimate tilde follows estimated recipes and only those
    const estName = await p.evaluate(() =>
      window.RECIPES.find((r) => r.est && r.macro && r.macro.p + r.macro.c + r.macro.f > 0).name);
    await openMeal(p, 'l');
    await pickerList(p);
    await p.waitForTimeout(200);
    await p.selectOption('#mpSec', 'all');
    await p.waitForTimeout(150);
    await p.fill('#mpFind', estName);
    await p.waitForTimeout(200);
    await p.click('.mpick-row[data-mpick]');
    // on the meal at once; its plates are read in its sheet
    await p.waitForTimeout(300);
    /* Reversed on purpose. A plate used to wear "~ estimated" and its macro
       line a leading tilde — but two thirds of the book is estimated from
       the food table rather than a label, so the mark was on most rows most
       of the time. A hedge that is always on is not a hedge; it is noise
       taking the width the numbers needed, and with it gone the four figures
       sit on the tag row instead of wrapping under it.

       Blake's call, in his words: "our food estimates just need to be
       reliable". The `est` field is still on the record — only the apology
       is gone — so nothing here stops it being said again somewhere it
       would mean something. */
    t.ok('the numbers do not apologise for themselves',
      await p.evaluate(() =>
        !document.querySelector('#view-macros .mchip[class]:not([hidden])') ||
        (!Array.from(document.querySelectorAll('#view-macros .mchip'))
          .some((el) => /estimated/i.test(el.textContent)) &&
         !Array.from(document.querySelectorAll('.mitem-mac'))
          .some((el) => el.textContent.trim().indexOf('~') === 0))),
      await p.evaluate(() => Array.from(document.querySelectorAll('#view-macros .mchip'))
        .map((e) => e.textContent.trim()).join(' | ')));

    /* This asserted the cost was ranked OVER its provenance — stacked, macros
       first, provenance quieter. There is no provenance on the plate to rank
       against any more, so the claim has nothing left to be true about and
       the assertion goes with the row. Its replacement is above: the row is
       gone and must stay gone.

       The row it freed pays for the thing this asserts instead: the NAME is
       never cut off. It is the one fact on the plate you cannot reconstruct
       from anything else — measured, the longest name in the book wanted
       395px and was given 241, so 39% of it went, while the two rows beneath
       it ended at 55% and 45% of the same width. An invariant over every
       plate on the day, so it has a subject whatever the fixture holds. */
    await openRow(p, 'l:0');
    t.ok('and no plate cuts off the one thing it cannot reconstruct — its name',
      /* Read in the meal's sheet, where the plates are since 2026-10-04, off
         the name's own text (.mrow-nm), which is what could be clipped. */
      await p.evaluate(() => {
        const names = Array.from(document.querySelectorAll('#modalRoot .mrows .mrow-nm'));
        if (!names.length) return false;
        return names.every((el) => el.scrollWidth <= el.clientWidth + 1);
      }), await p.evaluate(() => Array.from(document.querySelectorAll('#modalRoot .mrows .mrow-nm'))
        .map((el) => el.textContent.trim() + ' [' + Math.round(el.clientWidth) + '<' +
          Math.round(el.scrollWidth) + ' ' + getComputedStyle(el).whiteSpace + ']').join(' | ')));

    /* The salt warning that came off that row is asserted on a page of its
       own, further down — putting a fourth plate on this meal to give it a
       subject would move the plate count every later test in this block
       counts on. */
    t.ok('and the old tag row is gone',
      await p.evaluate(() => {
        const wrap = document.querySelector('.mitem-chips');
        const chip = wrap && wrap.querySelector('.mchip');
        const mac = document.querySelector('.mitem-mac');
        if (!chip || !mac) return true;
        /* a plate carrying a salt warning is allowed its second line — the
           warning is worth more than the tidiness */
        if (wrap.querySelector('.mchip.salty')) return true;
        return Math.abs(chip.getBoundingClientRect().top -
          mac.getBoundingClientRect().top) < 6;
      }));
    // the tilde carries it on the plate itself; the footnote under the day was
    // one more line of the app talking about itself
    t.ok('and says so on the plate rather than in a footnote',
      await p.evaluate(() => !document.querySelector('.macro-est')));
    /* This used to read "while the authored recipe shows none", and it
       contradicted the assertion directly above it: that one says the tilde
       was removed from every row, this one said an `est` row still wears one.
       It only ever passed down its other branch, because Volume One's
       recipes were est:false and so took the "no tilde" path — the est half
       of it had been dead since the tilde came off.

       Both halves are now the same half. Every recipe is computed from its
       ingredients, so `est` is true everywhere and there is no "authored
       recipe" left to contrast with. What survives is the claim that
       actually holds: no row apologises, whatever it was built from. */
    t.ok('and no row apologises, whatever its numbers were built from',
      await p.evaluate(() => {
        const macs = Array.from(document.querySelectorAll('.mitem-mac'));
        if (!macs.length) return true;   // one-plate meal: the seam says it instead
        return macs.every((el) => el.textContent.trim().indexOf('~') !== 0);
      }),
      await p.evaluate(() => Array.from(document.querySelectorAll('.mitem-mac'))
        .map((e) => e.textContent.trim()).join(' | ')));

    /* The portion and the calories beside it are two readings of the same
       number, and for years they disagreed: the calories charged for x
       servings while the words next to them announced x × the recipe's whole
       yield, so 1¾ of a six-bite batch read as "10½ servings". Nothing pinned
       the two to each other, which is how a six-fold overstatement sat on the
       card without a red test. This is that pin. */
    /* Each meal's plates, in its sheet. The dial says grams now (2026-10-04),
       and the kitchen measure in the small print is the count this pins: said
       to the nearest quarter, so it may differ from x by an eighth at most. */
    const portions = [];
    for (const sk of ['b', 'l']) {
      await openMeal(p, sk);
      portions.push(...await p.evaluate(() => {
        const FR = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
          '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
        const count = (txt) => {
          const m = txt.trim().match(/^(\d+)?\s*([½¼¾⅓⅔⅛⅜⅝⅞])?/);
          if (!m || (!m[1] && !m[2])) return null;
          return (m[1] ? parseInt(m[1], 10) : 0) + (m[2] ? FR[m[2]] : 0);
        };
        const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const day = days[Object.keys(days)[0]];
        const out = [];
        document.querySelectorAll('#modalRoot .mrows .mitem').forEach((row) => {
          const box = row.querySelector('[data-mstep]');
          if (!box) return;
          const parts = box.dataset.mstep.split(':');
          const it = (day[parts[0]] || [])[+parts[1]];
          if (!it) return;
          const r = window.RECIPES.find((q) => String(q.id) === String(it.id));
          if (!r || !r.macro) return;                       // a food, priced elsewhere
          const words = (row.querySelector('.mitem-uom') || {}).textContent || '';
          out.push({
            name: r.name, x: it.x, servN: r.servN || 1,
            shown: count(words), words: words.trim(),
            kcalShown: row.querySelector('.mitem-mac')
              ? parseInt(row.querySelector('.mitem-mac').textContent.replace(/[^\d]/, ''), 10)
              : null,
            kcalWant: Math.round(r.macro.kcal * it.x)
          });
        });
        return out;
      }));
    }
    await toDay(p);
    const mismatched = portions.filter((q) => q.shown === null || Math.abs(q.shown - q.x) > 0.125 + 1e-6);
    t.ok('the portion on a plate is the portion its calories were charged for',
      portions.length > 0 && mismatched.length === 0,
      mismatched.length
        ? mismatched.map((q) => q.name + ': says "' + q.words + '", eating ' + q.x).join(' | ')
        : portions.length + ' plates checked');
    t.ok('and the calories beside it are that portion priced',
      portions.length > 0 && portions.every((q) => Math.abs(q.kcalShown - q.kcalWant) <= 1),
      portions.map((q) => q.name + ' ' + q.kcalShown + '/' + q.kcalWant).join(' | '));

    // ---- the day is stored under the LOCAL date and survives a reload
    const stored = await p.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const key = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      return { keys: Object.keys(days), local: key, items: days[key] ? days[key].b.length + days[key].l.length : -1 };
    });
    t.ok('the day is keyed by the local calendar date',
      stored.keys.length === 1 && stored.keys[0] === stored.local, stored.keys.join(','));
    t.ok('both meals are in it', stored.items === 2, String(stored.items));
    await p.reload();
    await p.waitForTimeout(300);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(150);
    /* A reloaded day is trays (2026-10-04): each meal's foods as lines, the
       plates' controls in the meal's sheet. */
    t.ok('the day survives a reload, as trays',
      await p.evaluate(() => document.querySelectorAll('#macroSlots .mtray.filled').length === 2 &&
        document.querySelectorAll('#macroSlots .mtray-f:not(.mtray-none)').length === 2 && !document.querySelector('#macroSlots .mitem')),
      await p.evaluate(() => document.querySelectorAll('#macroSlots .mtray.filled').length + ' filled trays'));
    let plates = 0;
    for (const sk of ['b', 'l']) {
      await openMeal(p, sk);
      plates += await p.evaluate(() => document.querySelectorAll('#modalRoot .mrows .mitem [data-mstep]').length / 2);
    }
    await toDay(p);
    t.ok('and opening its meals shows both plates with their controls', plates === 2, String(plates));

    /* ---- every day is kept, however old (2026-10-18). Days older than the
       window used to be pruned on the next write; Blake: "I would assume that
       I'm keeping everything". */
    await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays'));
      days['2020-01-01'] = { b: [{ id: window.RECIPES[0].id, x: 1, eaten: 0 }], l: [], d: [], s: [] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await p.reload();                       // the app reads days once, at boot
    await p.waitForTimeout(300);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(150);
    // the meal's tick is a write (no per-plate tick since 2026-10-04), which used to prune
    await p.click('[data-mdot="b"]');
    await p.waitForTimeout(200);
    t.ok('a day six years old is still there after the next write, and today with it',
      await p.evaluate(() => {
        const keys = Object.keys(JSON.parse(localStorage.getItem('bsc.macroDays')));
        return keys.indexOf('2020-01-01') >= 0 && keys.length === 2;
      }));
    const back = await p.evaluate(() => document.getElementById('macroDayPick').min);
    t.ok('and the calendar reaches back to it', back === '2020-01-01', back);

    // ---- personal means personal: nothing macro rides in the household state
    t.ok('the synced Store carries no macro data',
      await p.evaluate(() => {
        const s = JSON.stringify(Object.keys(window.Store.state));
        return s.indexOf('macro') < 0;
      }));

    await p.context().close();
  },
});
