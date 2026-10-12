/* Plan my week: a few questions, the week's dinners, and what they cost.
 *
 * Chantel, trying Tapcook: answer some questions and get a list of meals to
 * make for the week. Every figure here is worked out from window.RECIPES and
 * window.PANTRY, never typed in, so the test follows the book and the prices. */

const DINNER = ['1-4', '2-3', '2-4'];

module.exports = {
  name: 'Plan my week',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    /* A Sunday morning: every day of the week is still ahead, so a plan
       written in this test is never a plan for a day already gone. */
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(900);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    /* Tuesday already has a dinner; the answers are remembered from last time. */
    const tueId = await p.evaluate(() => {
      localStorage.setItem('sh.pw', JSON.stringify({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], ppl: 4, bud: 60, t: 45, avoid: ['Pork'] }));
      /* Buying everything is Plan's step 1 now: I keep my own. */
      window.Store.setOpt('store', false);
      const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);
      window.Store.addToDay(r.id, 'tue', 1);
      return r.id;
    });
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);

    const q = await p.evaluate(() => {
      const on = (q) => [...document.querySelectorAll('[data-pwq="' + q + '"][aria-pressed="true"]')].map((b) => b.dataset.pwv);
      return { days: on('days'), ppl: on('ppl'), t: on('t'), avoid: on('avoid'), 
        bud: (document.getElementById('pwBudV') || {}).textContent };
    });
    t.ok('Plan my week opens on the questions, with last time’s answers',
      q.days.join() === 'mon,tue,wed,thu,fri' && q.ppl.join() === '4' && q.t.join() === '45' && q.avoid.join() === 'Pork' &&
        q.bud === '$60', JSON.stringify(q));

    /* The screen: the count follows the answers, a typed ingredient comes
       off, and too few to fill the nights holds the button back. */
    const cnt = () => p.evaluate(() => Number(document.querySelector('.pw-cnt b').textContent));
    const n0 = await cnt();
    await p.fill('#pwIng', 'onio');
    await p.waitForTimeout(150);
    await p.click('#pwSug [data-pwing]');
    await p.waitForTimeout(200);
    const n1 = await cnt();
    const chip = await p.evaluate(() => (document.querySelector('[data-pwingx]') || {}).dataset || {});
    await p.click('[data-pwq="prot"][data-pwv="Meatless"]');
    await p.click('[data-pwq="t"][data-pwv="20"]');
    await p.waitForTimeout(200);
    const tight = await p.evaluate(() => ({ n: Number(document.querySelector('.pw-cnt b').textContent),
      dis: document.querySelector('.pw-bar .pw-go').disabled, say: document.querySelector('.pw-cnt span').textContent }));
    t.ok('the count drops as an ingredient is left out, and too few holds the button back',
      n1 < n0 && chip.pwingx === 'onion' && tight.n < 4 && tight.dis && /loosen/.test(tight.say),
      JSON.stringify({ n0, n1, chip, tight }));
    await p.click('[data-pwingx="onion"]');
    await p.click('[data-pwq="prot"][data-pwv="Meatless"]');
    await p.click('[data-pwq="t"][data-pwv="45"]');
    await p.waitForTimeout(200);
    t.ok('and undoing them brings the same count back', await cnt() === n0);

    await p.click('[data-pwsee]');
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(400);
    t.ok('Pick my dinners closes the sheet onto the week', await p.evaluate(() => !document.querySelector('.pw-sheet')));
    /* The week, read back: the nights asked for, each with its dinner. */
    const read = () => p.evaluate((tue) => ['mon', 'wed', 'thu', 'fri'].map((d) => {
      const e = window.Store.day(d).find((x) => String(x.id) !== String(tue));
      return e ? { day: d.toUpperCase(), id: String(e.id) } : null;
    }).filter(Boolean), tueId);
    const picks = await read();

    const check = await p.evaluate(([picks, DINNER]) => {
      const byId = (id) => window.RECIPES.find((r) => String(r.id) === String(id));
      const P = window.PANTRY;
      const mins = (r) => { const s = String(r.time || ''), h = s.match(/(\d+(?:\.\d+)?)\s*hr/), m = s.match(/(\d+)\s*min/);
        return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0) || 60; };
      const pork = ['pork_roast', 'pork_sausage', 'ham', 'sweet_pork'];
      let usd = 0;
      const bad = [];
      picks.forEach((pk) => {
        const r = byId(pk.id);
        const dinner = DINNER.indexOf(r.book + '-' + r.secNum) >= 0 ||
          (r.book === 2 && r.secNum === 7 && !(r.makes || []).length && r.macro.kcal >= 350);
        if (!dinner) bad.push(r.name + ' is not a dinner');
        if (mins(r) > 45) bad.push(r.name + ' takes ' + mins(r));
        if (/pork|\bham\b|sausage|carnitas|bacon/i.test(r.name) || r.ingp.some((it) => pork.indexOf(it.k) >= 0)) bad.push(r.name + ' has pork');
        const x = Math.max(1, Math.round((4 / (Number(r.servN) || 4)) * 2) / 2);
        r.ingp.forEach((it) => {
          if (!it.k || it.k === 'water' || it.k === 'free' || it.o) return;
          const pr = P[it.k] && P[it.k].usd;
          if (pr) usd += it.g * x * pr / 100;
        });
      });
      return { bad, usd, sum: document.getElementById('planSum').textContent };
    }, [picks, DINNER]);
    t.ok('a dinner on each night asked for that had none, Tuesday left alone',
      picks.length === 4 && picks.map((x) => x.day).join() === 'MON,WED,THU,FRI', JSON.stringify(picks));
    t.ok('every one is a dinner, fits 45 minutes, and leaves out pork',
      check.bad.length === 0, check.bad.join('; '));
    t.ok('none repeats', new Set(picks.map((x) => x.id)).size === picks.length, JSON.stringify(picks));
    t.ok('the week comes in under the budget, and the week says what it comes to',
      check.usd <= 60 && /~\$\d+/.test(check.sum) && /to buy/.test(check.sum),
      JSON.stringify({ usd: check.usd, sum: check.sum }));

    await p.click('#planGrid [data-pswap][data-day="wed"]');
    await p.waitForTimeout(250);
    const after = await read();
    t.ok('↻ on the week swaps that one night and nothing else',
      after[1].id !== picks[1].id && after[0].id === picks[0].id && after[2].id === picks[2].id && after[1].day === 'WED',
      JSON.stringify({ was: picks.map((x) => x.id), now: after.map((x) => x.id) }));

    // the week's figure as it stands now, after the swap
    const weekSum = await p.evaluate(() => document.getElementById('planSum').textContent);
    await p.click('#planNext [data-stepgo="list"]');
    await p.waitForTimeout(300);
    const list = await p.evaluate(() => ({
      lines: document.querySelectorAll('#view-list .list-group.where-b .list-line').length,
      priced: document.querySelectorAll('#view-list .list-usd').length, head: document.getElementById('listCount').textContent,
      aisles: [...document.querySelectorAll('#view-list .where-b .list-aisle-h span')].map((a) => a.textContent),
      first: (document.querySelector('.list-group-title') || {}).textContent || '', titles: [...document.querySelectorAll('.list-group-title')].map((g) => g.textContent) }));
    /* One total, the week's, and no price on the lines: the per-line prices
       made 21 lines read as 63 things (Blake: "Rows too busy"). The total is
       the same figure the week says, from the same sum. */
    const weekUsd = Number((weekSum.match(/~\$(\d+(?:\.\d+)?)/) || [])[1]), listUsd = Number((list.head.match(/~\$(\d+(?:\.\d+)?)/) || [])[1]);
    t.ok('the list is every ingredient to buy, a line each with no price on it, and its one total is the week’s',
      list.lines > 5 && list.priced === 0 && listUsd > 0 && listUsd === weekUsd, JSON.stringify({ list, weekUsd, listUsd }));
    const order = ['Produce', 'Meat', 'Dairy & eggs', 'Bread', 'Canned', 'Rice, beans & pasta', 'Baking', 'Sauces & condiments', 'Drinks & treats', 'Other', 'Spices'];
    t.ok('to buy goes by aisle, in the order a store is walked, the spices last',
      list.aisles.length >= 2 && list.aisles.every((a, i) => i === 0 || order.indexOf(a) > order.indexOf(list.aisles[i - 1])) && list.aisles.every((a) => order.indexOf(a) >= 0),
      JSON.stringify(list.aisles));
    t.ok('buying everything (I keep my own), the list opens on what to buy, with no storehouse order in it',
      /^To buy$/i.test(list.first.trim()) && !list.titles.some((g) => /storehouse/i.test(g)), JSON.stringify(list.titles));
    await p.click('#listNext [data-stepgo="plan"]');
    await p.waitForTimeout(250);

    /* The picker has chance in it, so one run proves little: forty weeks,
       each held to every rule. */
    const many = await p.evaluate(() => {
      const W = window.__pw, bad = [];
      const a = { days: ['mon', 'tue', 'wed', 'thu', 'fri'], ppl: 4, bud: 45, t: 45, prot: [], kind: [], fit: false, avoid: ['Pork', 'Beans'], ing: [], rec: 0, shelf: false };
      const cheapest5 = W.pool(a).map((r) => W.cost([{ r, x: Math.max(1, Math.round((4 / (Number(r.servN) || 4)) * 2) / 2) }], false))
        .sort((x, y) => x - y).slice(0, 5).reduce((n, v) => n + v, 0);
      /* A budget with little room over the cheapest possible week, so it is
         the budget that decides, not the picker's taste for cheap dinners. */
      a.bud = Math.ceil(cheapest5 * 1.15);
      for (let run = 0; run < 40; run++) {
        const picks = [];
        for (let i = 0; i < 5; i++) { const nx = W.next(a, picks, []); if (!nx) break; picks.push(nx); }
        const ids = picks.map((e) => e.r.id);
        if (new Set(ids).size !== ids.length) bad.push('repeat in run ' + run);
        picks.forEach((e) => { if (W.avoids(e.r, a.avoid)) bad.push(e.r.name + ' breaks a leave-out'); });
        const usd = W.cost(picks, false);
        if (cheapest5 <= a.bud && usd > a.bud + 0.01) bad.push('run ' + run + ' costs ' + usd.toFixed(2));
      }
      return { bad, cheapest5 };
    });
    t.ok('forty runs: never a repeat, never a leave-out, never over a budget that five dinners can meet',
      many.bad.length === 0, JSON.stringify(many).slice(0, 300));

    const f = await p.evaluate(() => {
      const W = window.__pw, bad = [];
      const base = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: false, avoid: [], ing: [], rec: 0, shelf: true };
      const all = W.pool(base, false).length;
      const chick = W.pool(Object.assign({}, base, { prot: ['Chicken'] }), false);
      if (!chick.length || chick.some((r) => W.prot(r) !== 'Chicken')) bad.push('protein');
      const sun = W.pool(Object.assign({}, base, { kind: ['Sunday'] }), false);
      if (!sun.length || sun.some((r) => r.book + '-' + r.secNum !== '2-4')) bad.push('kind');
      const onion = W.pool(Object.assign({}, base, { ing: ['onion'] }), false);
      if (!(onion.length < all) || onion.some((r) => r.ingp.some((i) => i.k === 'onion'))) bad.push('ingredient');
      const cap = W.fit();
      // judged on protein for the calories, since a plate can be more or less than a serving
      const fit = W.pool(Object.assign({}, base, { fit: 1 }), false);
      if (!(fit.length < all) || fit.some((r) => r.macro.p / r.macro.kcal < cap.p / cap.kc)) bad.push('fit');
      const high = W.pool(Object.assign({}, base, { fit: 2 }), false);
      if (!(high.length < all) || high.some((r) => 4 * r.macro.p / r.macro.kcal < 0.4)) bad.push('high protein');
      if (W.pool(Object.assign({}, base, { fit: true }), false).length !== fit.length) bad.push('an answer saved as true is Hits it');
      const quick = Object.assign({}, base, { t: 20 });
      if (!(W.pool(quick, false).length < W.pool(quick, true).length)) bad.push('the weekend lifts the time limit');
      localStorage.setItem('sh.pwHist', JSON.stringify({ [String(chick[0].id)]: new Date().toISOString().slice(0, 10) }));
      if (W.pool(Object.assign({}, base, { rec: 2 }), false).some((r) => r.id === chick[0].id)) bad.push('recent');
      if (!W.pool(base, false).some((r) => r.id === chick[0].id)) bad.push('repeats are fine lets it back');
      localStorage.removeItem('sh.pwHist');
      localStorage.setItem('sh.pw', JSON.stringify({ n: 3 }));
      if (W.answers().days.join() !== 'mon,tue,wed') bad.push('old answers: ' + W.answers().days.join());
      return { bad, all };
    });
    t.ok('each filter keeps only what it says: protein, kind of night, an ingredient, Nourish, time, recent',
      f.bad.length === 0, JSON.stringify(f));

    const plan = await p.evaluate(() => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      .map((d) => window.Store.day(d).map((e) => String(e.id)).join('+')));
    t.ok('the week holds each dinner on its night and Tuesday’s as it was',
      plan[0] === after[0].id && plan[1] === String(tueId) && plan[2] === after[1].id && plan[4] === after[3].id && plan[5] === '' && plan[6] === '',
      JSON.stringify(plan));

    /* Blake's plan: 210 g of protein in about 1,650 cal. A dinner's share of
       it was a flat third (550 cal and 70 g), which is no meal Nourish has:
       Plan said "1.6 servings · 771 cal" of a dinner Fill put on the plate at
       1½ and 723. It is dinner's own share now, the one Fill sizes by — read
       here off Nourish's ask for dinner, not written down — to 25 cal and
       5 g, and the plate is in the quarters Nourish's dial takes. Held to one
       printed serving, the chip let nothing in ("I toggled on that selector
       and nothing was presented"). A plate sized to the protein does it, and
       High protein lets in more for Fill my day to top up. */
    await p.evaluate(() => localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 210, c: 90, f: 50 })));
    const hp = await p.evaluate(() => {
      const W = window.__pw, cap = W.fit();
      const frac = window.__macroLab.ask('d').plan.frac, kc = 4 * 210 + 4 * 90 + 9 * 50;
      const want = { kc: Math.round(kc * frac / 25) * 25, p: Math.round(210 * frac / 5) * 5 };
      const base = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: 0, avoid: [], ing: [], rec: 0, shelf: true };
      const all = W.pool(base, true);
      const hits = W.pool(Object.assign({}, base, { fit: 1 }), true), high = W.pool(Object.assign({}, base, { fit: 2 }), true);
      /* Within the calories, always; and meeting the protein unless the next
         quarter up would break the calories — a quarter of a serving is a
         coarser step than the tenth it was, and the calories are the cap. */
      const offPlates = hits.filter((r) => {
        const pl = W.plate(r, cap);
        if (!pl || pl.kc > cap.kc * 1.02 || pl.x * 4 !== Math.round(pl.x * 4)) return true;
        return pl.p < cap.p * 0.97 && (pl.x + 0.25) * r.macro.kcal <= cap.kc * 1.02;
      }).map((r) => { const pl = W.plate(r, cap); return pl && [r.name, pl.x, pl.kc, pl.p]; });
      return { cap, want, frac, oneServing: all.filter((r) => r.macro.kcal <= cap.kc && r.macro.p >= cap.p).length, hits: hits.length, high: high.length,
        offPlates };
    });
    t.ok('dinner’s own share of the plan: one printed serving can’t fill four nights, a plate in quarters sized to it can, each plate within the calories',
      hp.frac > 1 / 3 && hp.frac < 1 && hp.cap.kc === hp.want.kc && hp.cap.p === hp.want.p &&
        hp.oneServing < 4 && hp.hits >= 4 && hp.offPlates.length === 0, JSON.stringify(hp));
    t.ok('and High protein lets in more, for Fill my day to top up', hp.high > hp.hits, JSON.stringify(hp));

    // on the screen: both chips with their counts, and each dinner says its plate (Saturday and Sunday are still free)
    await p.evaluate(() => localStorage.setItem('sh.pw', JSON.stringify({ days: ['sat', 'sun'], ppl: 4, bud: 150, t: 0, wk: window.Store.activeWeek().id })));
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.querySelector('[data-pwq="fit"][data-pwv="1"]'); b.scrollIntoView({ block: 'center' }); });
    await p.click('[data-pwq="fit"][data-pwv="1"]');
    await p.waitForTimeout(200);
    const scr = await p.evaluate(() => ({
      label: document.querySelector('[data-pwq="fit"]').closest('.pw-q').querySelector('.pw-ql').textContent,
      chips: [...document.querySelectorAll('[data-pwq="fit"]')].map((b) => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
      n: Number(document.querySelector('.pw-cnt b').textContent), dis: document.querySelector('.pw-bar .pw-go').disabled }));
    /* "Hits my plan", not "Hits 70 g protein", now that a household can
       hold more than one plan: whose it is is the thing to say. */
    t.ok('the question says the dinner’s share, and the chips say how many each lets in',
      scr.label.indexOf(hp.cap.kc + ' cal · ' + hp.cap.p + ' g protein') >= 0 && scr.chips[0] === 'Don’t mind' && /^Hits my plan \d+\*$/.test(scr.chips[1]) && /^High protein \d+$/.test(scr.chips[2]),
      JSON.stringify(scr));
    t.ok('with nobody else sharing, there is no chip for anybody else and none for both',
      scr.chips.length === 3 && !scr.chips.some((c) => /both|everyone|’s plan/.test(c)), JSON.stringify(scr));
    t.ok('Hits my plan leaves dinners to pick from', scr.n > 0, JSON.stringify(scr));
    if (!scr.dis) {
      await p.click('.pw-bar .pw-go');
      await p.click('[data-pwpick="all"]');
      await p.waitForTimeout(400);
      /* The plate is on the day's sheet now: open each dinner from the week. */
      const plates = await p.evaluate(async () => {
        const out = [];
        for (const b of document.querySelectorAll('#planGrid .day-item:not(.lo) [data-dayopen]')) {
          b.click();
          await new Promise((r) => setTimeout(r, 150));
          out.push({ plate: (document.querySelector('.dsh-sheet .pw-plate') || {}).textContent || '' });
          document.querySelector('.dsh-sheet .sheet-x').click();
          await new Promise((r) => setTimeout(r, 150));
        }
        return out;
      });
      t.ok('each dinner’s sheet says the plate that meets the plan',
        plates.length > 0 && plates.every((x) => /^Your plate: (\d+ ?)?[¼½¾]? [A-Za-z'’]+ · \d+ cal · \d+ g protein$/.test(x.plate)) &&
          plates.every((x) => !/\d\.\d/.test(x.plate)), JSON.stringify(plates));
    } else t.ok('there were enough dinners to pick', false, JSON.stringify(scr));

    /* Blake: "Fits my Nourish plan is applicable to me right now, but what
       if my wife has a different plan?" She shares a dinner's numbers with
       the household (household.test.js has that half), and every phone in
       it gets a chip for her plan and one for both. Seeded here as sync
       leaves the household's copy on a phone, bsc.diners — with Blake's own
       entry in it too, as his phone would see it, which is not a second plan
       beside the one his own targets make. */
    const share = { sarah1: { n: 'Sarah', kc: 400, p: 40 }, blake1: { n: 'Blake', kc: 900, p: 20 } };
    const openSheet = async (pw) => {
      await p.evaluate(([d, a]) => {
        window.Store.clearPlan();
        localStorage.setItem('bsc.diners', JSON.stringify(d));
        localStorage.setItem('bsc.myOwner', 'blake1');
        localStorage.setItem('sh.pw', JSON.stringify(a));
      }, [share, pw]);
      await p.reload();
      await p.waitForTimeout(400);
      if (!await p.$('#planMyWeek:visible')) { await p.click('.tab[data-view="plan"]'); await p.waitForTimeout(300); }
      await p.click('#planMyWeek');
      await p.waitForTimeout(300);
    };
    /* The picks land on the week; each dinner's plates are on its sheet. */
    const onWeek = () => p.evaluate(async () => {
      const out = [];
      for (const b of document.querySelectorAll('#planGrid .day-item:not(.lo) [data-dayopen]')) {
        b.click();
        await new Promise((r) => setTimeout(r, 150));
        out.push({ id: b.dataset.dayopen, plates: [...document.querySelectorAll('.dsh-sheet .pw-plate')].map((x) => x.textContent),
          img: document.querySelectorAll('.dsh-sheet img').length });
        document.querySelector('.dsh-sheet .sheet-x').click();
        await new Promise((r) => setTimeout(r, 150));
      }
      return out;
    });
    const fitQ = () => p.evaluate(() => {
      const W = window.__pw, mine = W.fit(), d = window.Store.diners(), s = d.sarah1;
      // what the chips count from: every other answer as it is, Nourish left out
      const pool = W.pool(Object.assign({}, W.answers(), { fit: 0 }), false);
      const meets = (r, c) => r.macro && r.macro.kcal > 0 && (r.macro.p || 0) / r.macro.kcal >= c.p / c.kc;
      const q = document.querySelector('[data-pwq="fit"]').closest('.pw-q');
      return { mine, s,
        N: pool.filter((r) => meets(r, mine)).length, M: pool.filter((r) => meets(r, s)).length,
        K: pool.filter((r) => meets(r, mine) && meets(r, s)).length,
        H: pool.filter((r) => r.macro && r.macro.kcal > 0 && 4 * (r.macro.p || 0) / r.macro.kcal >= 0.4).length,
        small: q.querySelector('.pw-ql small').textContent,
        chips: [...q.querySelectorAll('[data-pwq="fit"]')].map((b) => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')) };
    });
    await openSheet({ days: ['sat', 'sun'], ppl: 4, bud: 150, t: 0, fit: 3 });
    const two = await fitQ();
    t.ok('two plans: a chip for mine, one for hers, one for both and High protein, each with how many it lets in',
      JSON.stringify(two.chips) === JSON.stringify(['Don’t mind', 'Hits my plan ' + two.N, 'Hits Sarah’s plan ' + two.M,
        'Hits both ' + two.K + '*', 'High protein ' + two.H]), JSON.stringify(two));
    t.ok('the question says both shares, and my own entry in the household is not a third plan',
      two.small === 'You ' + two.mine.kc + ' cal · ' + two.mine.p + ' g · Sarah ' + two.s.kc + ' cal · ' + two.s.p + ' g' &&
        !two.chips.some((c) => /Blake/.test(c)), JSON.stringify(two));
    t.ok('both lets in no more than either plan alone, and leaves dinners to pick', two.K <= Math.min(two.N, two.M) && two.K > 0,
      JSON.stringify(two));
    await p.click('.pw-bar .pw-go');
      await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(400);
    const week = await onWeek();
    const both = await p.evaluate((week) => {
      const W = window.__pw, mine = W.fit(), s = window.Store.diners().sarah1;
      const byId = (id) => window.RECIPES.find((r) => String(r.id) === String(id));
      const say = (who, pl) => who + ' plate: ' + pl.say + ' · ' + pl.kc + ' cal · ' + pl.p + ' g protein';
      return week.map((m) => {
        const r = byId(m.id);
        return { name: r.name, mine: r.macro.p / r.macro.kcal >= mine.p / mine.kc, hers: r.macro.p / r.macro.kcal >= s.p / s.kc,
          plates: m.plates, want: [say('Your', W.plate(r, mine)), say('Sarah’s', W.plate(r, s))] };
      });
    }, week);
    t.ok('every dinner picked under Hits both meets both plans', both.length > 0 && both.every((x) => x.mine && x.hers),
      JSON.stringify(both));
    t.ok('and says two plates, mine and hers, each sized to its own share',
      both.every((x) => JSON.stringify(x.plates) === JSON.stringify(x.want)), JSON.stringify(both));

    /* A name comes from the household document, which anybody holding the
       code can write to: it is text on every phone, never markup. With a
       third person sharing, both becomes everyone's. */
    share.evil1 = { n: '<img src=x onerror=__pwX=1>', kc: 500, p: 45 };
    await openSheet({ days: ['sat', 'sun'], ppl: 4, bud: 150, t: 0, fit: 'u:evil1' });
    const three = await p.evaluate(() => ({
      chips: [...document.querySelectorAll('[data-pwq="fit"]')].map((b) => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
      small: document.querySelector('[data-pwq="fit"]').closest('.pw-q').querySelector('.pw-ql small').textContent }));
    t.ok('three plans: a chip each, and Hits everyone’s in place of Hits both',
      three.chips.some((c) => /^Hits everyone’s \d+$/.test(c)) && !three.chips.some((c) => /^Hits both/.test(c)) &&
        three.chips.some((c) => /^Hits Sarah’s plan \d+$/.test(c)), JSON.stringify(three));
    await p.click('.pw-bar .pw-go');
      await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(400);
    const evilWk = await onWeek();
    const evil = await p.evaluate((w) => ({ img: w.reduce((n, m) => n + m.img, 0), ran: window.__pwX,
      plate: (w[0] && w[0].plates[0]) || '' }), evilWk);
    t.ok('a name with markup in it is shown as the text it is, on the chip, the question and the plate, and nothing runs',
      three.chips.some((c) => c === 'Hits <img src=x onerror=__pwX=1>’s plan ' + c.split(' ').pop().replace('*', '') + '*') &&
        /<img src=x onerror=__pwX=1> 500 cal · 45 g/.test(three.small) &&
        /^<img src=x onerror=__pwX=1>’s plate: /.test(evil.plate) && evil.img === 0 && evil.ran === undefined, JSON.stringify({ three, evil }));

    // answers saved before somebody stopped sharing, and the ones saved before there were plans at all
    const saved = await p.evaluate(() => [true, 1, 2, 3, 'u:sarah1', 'u:gone1', 'u:blake1'].map((fit) => {
      localStorage.setItem('sh.pw', JSON.stringify({ fit }));
      return window.__pw.answers().fit;
    }));
    t.ok('a saved answer keeps working: on is mine, a plan still shared stays, one no longer shared (or my own) is Don’t mind',
      JSON.stringify(saved) === JSON.stringify([1, 1, 2, 3, 'u:sarah1', 0, 0]), JSON.stringify(saved));

    /* Two people sharing under one name made two chips that both said
       "Hits Sarah’s plan", and no telling which was which. The second of a
       name, in account order, is (2) — on the chip, the question and the
       plate — and somebody else under my own shared name is the second of
       mine. */
    delete share.evil1;
    share.sarah2 = { n: 'Sarah', kc: 650, p: 30 };
    share.blake2 = { n: 'Blake', kc: 700, p: 50 };
    await openSheet({ days: ['sat', 'sun'], ppl: 4, bud: 150, t: 0, fit: 'u:sarah2' });
    const twins = await p.evaluate(() => ({
      chips: [...document.querySelectorAll('[data-pwq="fit"]')].map((b) => b.dataset.pwv + '=' + b.textContent.trim().replace(/ \d+\*?$/, '') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
      small: document.querySelector('[data-pwq="fit"]').closest('.pw-q').querySelector('.pw-ql small').textContent, mine: window.__pw.fit() }));
    t.ok('two people under one name are two chips that say which, the same way round every time',
      JSON.stringify(twins.chips) === JSON.stringify(['0=Don’t mind', '1=Hits my plan', 'u:blake2=Hits Blake’s plan (2)', 'u:sarah1=Hits Sarah’s plan',
        'u:sarah2=Hits Sarah’s plan (2)*', '3=Hits everyone’s', '2=High protein']), JSON.stringify(twins.chips));
    t.ok('and the question says whose share is whose the same way',
      twins.small === 'You ' + twins.mine.kc + ' cal · ' + twins.mine.p + ' g · Blake (2) 700 cal · 50 g · Sarah 400 cal · 40 g · Sarah (2) 650 cal · 30 g', twins.small);
    await p.click('.pw-bar .pw-go');
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(400);
    const twinWk = await onWeek();
    t.ok('the plate is the second Sarah’s, and says so', twinWk.length > 0 && twinWk.every((m) => m.plates.length === 1 && /^Sarah’s plate \(2\): /.test(m.plates[0])),
      JSON.stringify(twinWk));
    await p.evaluate(() => { localStorage.removeItem('bsc.diners'); localStorage.setItem('sh.pw', JSON.stringify({ fit: 3 })); });
    await p.reload();
    await p.waitForTimeout(300);
    t.ok('and both, with nobody else sharing any more, is my plan', await p.evaluate(() => window.__pw.answers().fit) === 1);
    await p.evaluate(() => { localStorage.removeItem('bsc.macroTargets'); localStorage.removeItem('sh.pw'); localStorage.removeItem('bsc.myOwner'); });

    /* ---- no plan in Nourish, and picked for you over the budget ---- */
    await p.evaluate(() => { window.Store.clearPlan(); localStorage.setItem('sh.pw', JSON.stringify({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], ppl: 8, bud: 20, t: 0, avoid: [] })); });
    await p.reload();
    await p.waitForTimeout(800);
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);
    const lbl = await p.evaluate(() => {
      const q = [...document.querySelectorAll('.pw-ql')].find((x) => /^Fits my Nourish plan/.test(x.textContent));
      return { chip: document.querySelector('[data-pwq="fit"][data-pwv="1"]').textContent.trim(), small: q ? q.querySelector('small').textContent : '' };
    });
    t.ok('with no plan in Nourish the chip says what it holds a dinner to, and the line says to set one',
      /^Hits 35 g in 600 cal/.test(lbl.chip) && /no plan yet/.test(lbl.small), JSON.stringify(lbl));
    await p.click('[data-pwsee]');
    await p.waitForTimeout(400);
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(500);
    const toast = await p.evaluate(() => document.body.textContent);
    const cost = await p.evaluate(() => {
      const a = window.__pw.answers();
      const picks = [].concat(...['mon', 'tue', 'wed', 'thu', 'fri'].map((d) => window.Store.day(d).map((e) => ({ r: window.RECIPES.find((r) => String(r.id) === String(e.id)), x: e.x, lo: e.lo }))));
      return window.__pw.cost(picks, a.shelf);
    });
    t.ok('five dinners for eight on $20 cost more than that, and the toast says about how much over',
      cost > 20.5 && /over your \$20/.test(toast) && /dinners added/.test(toast), JSON.stringify({ cost, said: /over your \$20/.test(toast) }));

    /* ---- on a Saturday, the nights that are gone are not lit ---- */
    await p.clock.setFixedTime(new Date(2026, 9, 3, 9, 0, 0));   // Saturday 3 October, the same week
    await p.reload();
    await p.waitForTimeout(800);
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);
    const sat = await p.evaluate(() => ({
      on: [...document.querySelectorAll('[data-pwq="days"][aria-pressed="true"]')].map((b) => b.dataset.pwv),
      gone: [...document.querySelectorAll('[data-pwq="days"][disabled]')].map((b) => b.dataset.pwv),
      bar: document.querySelector('.pw-cnt span').textContent, go: !document.querySelector('[data-pwsee]').disabled,
    }));
    t.ok('on a Saturday with Mon–Fri remembered, only the night left is lit, the gone ones are greyed, and Pick my dinners is on',
      sat.on.join() === 'sat' && sat.gone.join() === 'sun,mon,tue,wed,thu,fri' && sat.go && sat.bar === 'for Sat only', JSON.stringify(sat));
    // the sheet takes the focus, and Escape closes it, as the recipe sheet does
    const focused = await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('sheet-x'));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    const shut = await p.evaluate(() => ({ open: !!document.querySelector('.pw-body'), chips: document.querySelectorAll('[data-pwq]').length }));
    t.ok('Plan my week opens with its × focused, and Escape closes it', focused && !shut.open && shut.chips === 0, JSON.stringify({ focused, shut }));
    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
