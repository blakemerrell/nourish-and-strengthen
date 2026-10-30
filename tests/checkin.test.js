/* The morning check-in under the weigh-in (Blake, 2026-10-26).
 *
 * "Add sleep, steps, and creatine; caffeine, I'll type them in", in the place
 * he already weighs in: "One place to do it all as far as stats go." The
 * sheet Today opens is Good morning, with a row a question under the scale.
 * Only the drinks you use are on it; Crio Bru counts about 10 mg a cup.
 * Mockup: https://claude.ai/artifact/F95PhNPeLVtGRVhi7ynvqe (Morning.dc.html) */
const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 200, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  const ws = {};
  for (let i = 1; i <= 10; i++) { const d = new Date(2026, 9, 26 - i); ws[d.toISOString().slice(0, 10)] = 200 - i * 0.1; }
  localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
  // three mornings of steps before today, so the average has something to say
  localStorage.setItem('bsc.macroAm', JSON.stringify({ '2026-10-23': { sy: 7000, cr: 1 }, '2026-10-24': { sy: 8000, cr: 1 }, '2026-10-25': { sy: 9000, cr: 1 } }));
};
const am = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroAm') || '{}')['2026-10-26'] || {});
const txt = (p, sel) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);

module.exports = {
  name: 'Morning check-in: sleep, steps, creatine and caffeine under the weigh-in',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await p.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await p.reload();
    await p.waitForTimeout(500);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);

    await p.click('.td-weigh');
    await p.waitForTimeout(500);
    t.ok('the sheet Today opens is Good morning', /Good morning/.test(await txt(p, '.wg-sheet .sheet-eyebrow')));
    const rows = await p.evaluate(() => [...document.querySelectorAll('#weighSheet .am .am-l > span')].map((s) => s.textContent));
    t.ok('under the scale: sleep, steps, creatine and caffeine, in that order',
      rows.join('|') === 'Sleep last night|Steps yesterday|Creatine|Caffeine today', rows.join('|'));
    t.ok('the weight box is still first on the card', await p.evaluate(() => {
      const c = document.querySelector('#weighSheet #macroWeigh');
      return !!c.querySelector('#mWeight') && c.querySelector('#mWeight').compareDocumentPosition(c.querySelector('.am')) & Node.DOCUMENT_POSITION_FOLLOWING;
    }));
    t.ok('the steps row says the week’s average', /7-day average 8,000/.test(await txt(p, '#weighSheet .am')));
    t.ok('creatine counts the mornings in a row already taken', /3 days in a row/.test(await txt(p, '#weighSheet .am')));
    t.ok('no drink is on the card until you add one', await p.evaluate(() => !document.querySelector('#weighSheet .am-drink')));

    // sleep: the first tap is 7 hours, then quarter hours
    await p.click('[data-am="sl:1"]');
    t.ok('the first tap on sleep starts at 7 hours', (await am(p)).sl === 7, JSON.stringify(await am(p)));
    await p.click('[data-am="sl:1"]');
    await p.click('[data-am="sl:-1"]');
    await p.click('[data-am="sl:-1"]');
    const s = await am(p);
    t.ok('then a quarter hour a tap: 6h 45m', s.sl === 6.75, JSON.stringify(s));
    t.ok('under 7 hours, it says what that costs on a cut', /short sleep costs muscle/.test(await txt(p, '#weighSheet .am')));
    t.ok('and focus stays on the button tapped', await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-am') === 'sl:-1'));

    // steps, with a comma the way a step count is written
    await p.fill('#amSteps', '8,412');
    await p.press('#amSteps', 'Enter');
    await p.locator('#amSteps').blur();
    await p.waitForTimeout(200);
    t.ok('steps typed with a comma are kept as a number', (await am(p)).sy === 8412, JSON.stringify(await am(p)));
    await p.fill('#amSteps', 'lots');
    await p.locator('#amSteps').blur();
    await p.waitForTimeout(200);
    t.ok('and words are refused, the last good number kept', (await am(p)).sy === 8412);
    t.ok('the box says it is not a number', await p.evaluate(() => document.getElementById('amSteps').getAttribute('aria-invalid') === 'true'));
    await p.fill('#amSteps', '8412');
    await p.locator('#amSteps').blur();

    await p.click('[data-am="cr"]');
    t.ok('creatine is one tap', (await am(p)).cr === 1);
    t.ok('and the streak counts today', /4 days in a row/.test(await txt(p, '#weighSheet .am')));

    // drinks: only the ones you use
    await p.click('[data-am="add"]');
    const chips = await p.evaluate(() => [...document.querySelectorAll('#weighSheet .am-chip')].map((c) => c.textContent));
    t.ok('Add a drink offers the usual ones, Crio Bru at 10 mg', chips.some((c) => /Crio Bru 10 mg/.test(c)) && chips.length >= 5, chips.join(', '));
    await p.click('[data-am="on:crio"]');
    await p.fill('#amNewN', 'Celsius');
    await p.fill('#amNewMg', '200');
    await p.click('[data-am="new"]');
    await p.click('[data-am="done"]');
    const shown = await p.evaluate(() => [...document.querySelectorAll('#weighSheet .am-drink b:first-child')].map((b) => b.textContent));
    t.ok('the card then shows only your drinks: Crio Bru and the one you made', shown.join('|') === 'Crio Bru|Celsius', shown.join('|'));
    await p.click('[data-am="cf:crio:1"]');
    await p.click('[data-am="cf:crio:1"]');
    t.ok('two Crio Bru is 20 mg', /20 mg/.test(await txt(p, '#weighSheet .am-cafh')), await txt(p, '#weighSheet .am-cafh'));
    const cel = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDrinks')).list.find((d) => d.n === 'Celsius').id);
    await p.click('[data-am="cf:' + cel + ':1"]');
    await p.click('[data-am="cf:' + cel + ':1"]');
    await p.click('[data-am="cf:' + cel + ':1"]');
    t.ok('past 400 mg, it says so', /over the usual 400 mg ceiling/.test(await txt(p, '#weighSheet .am-cafh')));
    await p.click('[data-am="cf:' + cel + ':-1"]');
    t.ok('and less is a tap: 420 mg is 20 plus two of 200', /420 mg/.test(await txt(p, '#weighSheet .am-cafh')));

    // a drink's milligrams are yours
    await p.click('[data-am="add"]');
    await p.fill('[data-ammg="crio"]', '15');
    await p.locator('[data-ammg="crio"]').blur();
    await p.waitForTimeout(200);
    t.ok('changing Crio Bru to 15 mg changes the total: 430 mg', /430 mg/.test(await txt(p, '#weighSheet .am-cafh')), await txt(p, '#weighSheet .am-cafh'));
    await p.click('[data-am="done"]');

    // the stamps that carry it to your other phone
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.myStamps')));
    t.ok('the morning is stamped for sync, per morning', st && st.am && st.am['2026-10-26'] > 0, JSON.stringify(st && st.am));
    t.ok('and the drinks list as a part of its own', st && st.dk > 0);

    // Today says it, and Save & Done ✓ closes the check-in cleanly
    t.ok('the check-in footer shows progress and a Save & Done button',
      /3 of 4 checked in/.test(await txt(p, '#weighFoot')) && !!(await p.$('#weighFoot [data-wdone]')),
      await txt(p, '#weighFoot'));
    await p.fill('#mWeight', '198.6');
    await p.click('#weighSheet [data-mwsave]');
    await p.waitForTimeout(200);
    t.ok('explicit Save button next to weight confirms Saved ✓ and completes all 4',
      /Saved ✓/.test(await txt(p, '#weighSheet [data-mwsave]')) && /All 4 checked in ✓/.test(await txt(p, '#weighFoot')));
    await p.click('#weighFoot [data-wdone]');
    await p.waitForTimeout(500);
    const line = await txt(p, '.td-weigh .td-am');
    t.ok('Today’s weigh-in line carries the morning: sleep, steps, creatine, caffeine',
      /6h 45m sleep/.test(line) && /8\.4k steps/.test(line) && /creatine ✓/.test(line) && /430 mg caffeine/.test(line), line);

    // Water & Drinks on Today and in Nourish (16 oz plain water + 40 oz from 2x Crio Bru 8oz & 2x Celsius 12oz = 56 oz)
    await p.click('[data-card="eating"] [data-td="water"][data-oz="16"]');
    await p.waitForTimeout(200);
    t.ok('Today’s Eating card logs +16 oz water in one tap', (await am(p)).wt === 16, JSON.stringify(await am(p)));
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    t.ok('Nourish renders Water & Drinks counting both plain water (16 oz) and drink fluid (40 oz) = 56 / 100 oz',
      /Water & Drinks/.test(await txt(p, '#macroSlots .mhyd-card')) && /56 \/ 100 oz/.test(await txt(p, '#macroSlots .mhyd-card')) &&
      /16 oz water \+ 40 oz from drinks/.test(await txt(p, '#macroSlots .mhyd-card')),
      await txt(p, '#macroSlots .mhyd-card'));
    await p.click('#macroSlots .mhyd-card [data-hyd="wt:8"]');
    await p.waitForTimeout(200);
    t.ok('+8 oz on Nourish Water & Drinks card updates plain water to 24 oz and total hydration to 64 / 100 oz',
      (await am(p)).wt === 24 && /64 \/ 100 oz/.test(await txt(p, '#macroSlots .mhyd-card')));
    await p.click('#macroSlots .mhyd-card [data-hyd="wt:42"]');
    await p.waitForTimeout(200);
    t.ok('tapping the 42 oz Stanley mug card tracks vessel count (1× 42oz Stanley, 1× 16oz bottle, 1× 8oz cup) and updates total to 106 / 100 oz',
      (await am(p)).wt === 66 && (await am(p)).vs.v42 === 1 && /106 \/ 100 oz/.test(await txt(p, '#macroSlots .mhyd-card')) &&
      /1× 42oz Stanley/.test(await txt(p, '#macroSlots .mhyd-card')));
    await p.click('#macroSlots .mhyd-card [data-hyd="wt:-42"]');
    await p.waitForTimeout(200);
    await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      days['2026-10-26'] = { b: [{ id: 'f:crio_bru', x: 1, eaten: 1 }, { id: 'f:milk', x: 1, eaten: 1 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await p.reload();
    await p.waitForTimeout(600);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);
    t.ok('logging liquid foods/drinks in a meal (Crio Bru + Milk) auto-counts their fluid oz in Water & Drinks',
      /Auto-counted from meals/.test(await txt(p, '#macroSlots .mhyd-card')) &&
      /oz from meals/.test(await txt(p, '#macroSlots .mhyd-card')));
    await p.click('#macroSlots .mhyd-card [data-hyd="fold"]');
    await p.waitForTimeout(150);
    t.ok('tapping Water & Drinks header collapses the section like a meal card',
      await p.evaluate(() => {
        const c = document.querySelector('#macroSlots .mhyd-card');
        return c && c.classList.contains('shut') && !c.querySelector('.mhyd-body');
      }));
    await p.click('#macroSlots .mhyd-card [data-hyd="fold"]');
    await p.waitForTimeout(150);
    t.ok('tapping Water & Drinks header again expands it back open',
      await p.evaluate(() => {
        const c = document.querySelector('#macroSlots .mhyd-card');
        return c && !c.classList.contains('shut') && !!c.querySelector('.mhyd-body');
      }));

    await p.reload();
    await p.waitForTimeout(800);
    const back = await am(p);
    t.ok('all of it is still there after a reload', back.sl === 6.75 && back.sy === 8412 && back.cr === 1 && back.cf.crio === 2, JSON.stringify(back));

    // what another phone sends is let in only in the right shape
    const merged = await p.evaluate(() => {
      const H = window.Hive;
      return typeof H.progress === 'function';
    });
    t.ok('Review can read the mornings back (Hive.progress)', merged);
    const prog = await p.evaluate(() => window.Hive.progress('2026-10-24', '2026-10-26').days);
    const d25 = prog.find((d) => d.k === '2026-10-25');
    t.ok('steps said this morning are moved back onto yesterday, the day they were walked', d25 && d25.sy === 8412, JSON.stringify(d25));
    const d26 = prog.find((d) => d.k === '2026-10-26');
    t.ok('and today keeps its sleep, creatine and caffeine', d26 && d26.sl === 6.75 && d26.cr === 1 && d26.mg === 430, JSON.stringify(d26));

    // a morning not weighed but slept on still asks about sleep only once weighed
    const q = await t.fresh({ viewport: { width: 390, height: 844 } });
    await q.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await q.reload();
    await q.evaluate(() => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroWeights', JSON.stringify({ '2026-10-26': 199 }));
    });
    await q.reload();
    await q.waitForTimeout(800);
    t.ok('weighed but not checked in: Today asks how you slept', /How did you sleep\?/.test(await txt(q, '.td-weigh')), await txt(q, '.td-weigh'));
    await q.context().close();

    /* ---- a recipe's fluid, from its ingredients --------------------------
     * Blake's own Protein Crio Brew (two cups of brewed Crio Bru, a cup of
     * 2% milk, whey, creatine, sweetener) counted no water at all: the name
     * says "Brew", not "Bru", and the old rule only went by the name. The
     * liquid lines are 480 + 244 g of a 770 g serving, so about 24 oz. And
     * overnight oats, which soak in half a cup of water, are still food. */
    const r = await t.fresh({ viewport: { width: 390, height: 844 } });
    await r.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await r.evaluate(() => window.Store.saveRecipe({ id: 'ucriobrew', book: 3, secNum: 1, secName: 'Ours', own: true,
      name: 'Protein Crio Brew', ing: ['2 cups Crio Bru', '3 tablespoons Splenda', '1 scoop whey protein', '1 scoop creatine', '1 cup of 2% milk'],
      steps: ['Brew, mix, pour.'], servings: '1 Serving', servN: 1, time: '15', diff: 'Easy',
      macro: { kcal: 260, p: 35, c: 14, f: 6, na: 200, fib: 1 },
      ingp: [{ k: 'crio_bru', g: 480 }, { k: 'free', g: 12 }, { k: 'whey', g: 30 }, { k: 'free', g: 5 }, { k: 'milk', g: 244 }] }));
    await r.evaluate(() => {
      localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-26': {
        s: [{ id: 'ucriobrew', x: 1, eaten: 1 }], b: [{ id: 27, x: 1, eaten: 1 }] } }));
    });
    await r.reload();
    await r.waitForTimeout(700);
    await r.click('.tab[data-view="macros"]');
    await r.waitForTimeout(300);
    /* Overnight oats run breakfast over its share, and the sheet that offers
       to take it from later meals sits over the card; a click on the header
       itself, not at its coordinates, is what a reader of this test means. */
    t.ok('the day\u2019s water is the 24 oz in that one drink',
      /24 \/ 100 oz/.test(await txt(r, '#macroSlots .mhyd-card')), await txt(r, '#macroSlots .mhyd-card'));
    // open it if it is folded (it arrives folded once the card stops opening by default)
    await r.evaluate(() => {
      const c = document.querySelector('#macroSlots .mhyd-card');
      if (c.classList.contains('shut')) c.querySelector('[data-hyd="fold"]').click();
    });
    await r.waitForTimeout(150);
    const liq = await txt(r, '#macroSlots .mhyd-card .mhyd-meals');
    t.ok('your own Crio Bru drink counts its brewed Crio Bru and milk as water (about 24 oz)',
      /\+24 oz\s*Protein Crio Brew/.test(liq), liq);
    t.ok('and a recipe that only soaks in water, like overnight oats, does not',
      !/Overnight Oats/.test(liq), liq);
    await r.context().close();
  }
};
