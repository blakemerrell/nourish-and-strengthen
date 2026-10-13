/* Each food on the day a line of its own, opened where it is (Blake, 2026-10-08).
 *
 * Blake, dialling his evening snack in its sheet: "How am I supposed to see
 * how this meal and the daily macros at the same time?" Then, shown the day
 * of a few days before: "We had this pretty dialed in a few days ago!" So the
 * cards stay as they are and each food is a line again: its leaf, its name,
 * the kitchen measure, the grams at the far right and its tick. A tap on the
 * line opens it in place, under the day's pills; its name opens the food (or
 * the recipe); the card's pills open the meal's sheet, where food is added.
 * Mockup: https://claude.ai/artifact/XfZHLy1Fhphi8BCPb6CdZe
 *
 * Since 2026-10-10 those lines are a card's Details, the last of three
 * views its name steps through (Status, Foods, Details), and each card
 * starts where Blake chose: an eaten meal on Status, the next meal on
 * Details, the rest on Foods. The three are tested here too.
 *
 * Also here, two plates that read wrong on his day the same evening: a
 * scanned can, "1 1 can (335 ml)", and a USDA food whose dial said
 * ", NS as t" (src/portion.js, mLabelServing). */
const DAY = '2026-10-08';

const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
  localStorage.setItem('bsc.myFoods', JSON.stringify({
    spark: { name: 'Sparkling Protein', unit: '1 can (335 ml)', kcal: 124, p: 30, f: 0, c: 1 },
    fries: { name: 'Potato, french fries, from fresh, fried', unit: '1 order, NS as to size', kcal: 202, p: 0, f: 16, c: 16 } }));
  const f = (k, x) => ({ id: 'f:' + k, x: x, eaten: 0 });
  localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-08': {
    l: [f('chicken_breast', 1), f('green_beans', 1), f('apple', 1)],
    // a recipe from the book, so a line wears a leaf: Chicken & Broccoli Rice Skillet
    d: [{ id: 66, x: 1, eaten: 0 }, f('egg', 2)],
    s: [{ id: 'f:my:spark', x: 1, eaten: 0 }, { id: 'f:my:fries', x: 1, eaten: 0 }] } }));
};
const mealOf = (p, sk) => p.evaluate((a) => JSON.parse(localStorage.getItem('bsc.macroDays'))[a[0]][a[1]] || [], [DAY, sk]);
const textOf = (p, sel) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);
const card = (sk) => '#macroSlots .mtray[data-mslot="' + sk + '"]';
const line = (sk, i) => card(sk) + ' .mtray-f:nth-child(' + (i + 1) + ')';

module.exports = {
  name: 'Each food a line on the day, opened where it is',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await p.clock.setFixedTime(new Date(2026, 9, 8, 10, 0, 0));
    await p.reload();
    await p.waitForTimeout(600);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(500);

    /* ---- shut: a line a food, and no keys until one is opened ---- */
    const shut = await p.evaluate((sel) => {
      const ls = [...document.querySelectorAll(sel + ' .mtray-f')];
      return ls.map((l) => ({ name: (l.querySelector('.mtray-fn') || {}).textContent, fm: (l.querySelector('.mtray-fm') || {}).textContent,
        g: (l.querySelector('.mfl-amt em') || {}).textContent, tick: !!l.querySelector('input.mitem-ate[type="checkbox"]'),
        keys: l.querySelectorAll('[data-mstep]').length, h: Math.round(l.getBoundingClientRect().height) }));
    }, card('l'));
    t.ok('each food on Lunch is a line: its name, the kitchen measure (a cup with its mL), the grams and a tick',
      shut.length === 3 && shut[0].name === 'Chicken breasts' && shut[0].fm === '1 cup · 235 mL' && shut[0].g === '140 g' &&
      shut[1].fm === '1 can' && shut[1].g === '240 g' && shut.every((l) => l.tick), JSON.stringify(shut));
    t.ok('with no keys on it until it is opened, and tall enough for a thumb', shut.every((l) => l.keys === 0 && l.h >= 44), JSON.stringify(shut));
    const rec = await p.evaluate((sel) => {
      const l = document.querySelector(sel);
      return { leaf: !!l.querySelector('.mfl-lf .leaf'), go: l.classList.contains('mtray-go'), open: (l.querySelector('.mtray-fn') || {}).dataset.open,
        foodLeaf: !!document.querySelector(sel.replace('nth-child(1)', 'nth-child(2)') + ' .mfl-lf .leaf') };
    }, line('d', 0));
    t.ok('a recipe’s line wears its leaf, and its name is the door to the recipe', rec.leaf && rec.go && rec.open === '66' && !rec.foodLeaf, JSON.stringify(rec));
    const names = await p.evaluate(() => {
      const meal = document.querySelector('#macroSlots .mtray-n').getBoundingClientRect().left;
      return { meal, foods: [...document.querySelectorAll('#macroSlots .mtray-fn')].map((b) => Math.round(b.getBoundingClientRect().left - meal)) };
    });
    t.ok('every name starts where the meal’s own name does, the leaf in the column under the tick',
      names.foods.every((d) => Math.abs(d) <= 2), JSON.stringify(names));

    /* ---- a tap on the line opens it there, on the day ---- */
    const at = await p.evaluate((sel) => { const r = document.querySelector(sel + ' .mfl-r').getBoundingClientRect(); return { x: r.left + r.width * 0.62, y: r.top + r.height / 2 }; }, line('l', 0));
    await p.touchscreen.tap(at.x, at.y);
    await p.waitForTimeout(300);
    const open = await p.evaluate((sel) => {
      const l = document.querySelector(sel);
      const pills = document.getElementById('macroPills');
      return { sheet: !!document.querySelector('#modalRoot .msheet'), open: l.classList.contains('open'),
        exp: l.querySelector('[data-mamt]').getAttribute('aria-expanded'), mac: (l.querySelector('.mfl-mac') || {}).textContent || '',
        verbs: [...l.querySelectorAll('.mfl-ics button')].map((b) => Object.keys(b.dataset)[0]),
        keys: [...l.querySelectorAll('[data-mstep]')].map((b) => b.dataset.mstep), amt: (l.querySelector('[data-mtype]') || {}).textContent,
        opened: document.querySelectorAll('#macroSlots .mtray-f.open').length, pills: !!pills && /\d/.test(pills.textContent) };
    }, line('l', 0));
    t.ok('a tap on a food’s line opens it in place, not the meal’s sheet', !open.sheet && open.open && open.exp === 'true' && open.opened === 1, JSON.stringify(open));
    t.ok('opened, it says what it costs, then the bin, the lock, the pin and the star, and the dial',
      /kcal/.test(open.mac) && open.verbs.join() === 'mdel,mlock,mpin,mfav' && open.keys.join() === 'l:0:down,l:0:up' && open.amt === '140 g',
      JSON.stringify(open));

    /* + moves the food, the meal and the day together */
    const meal0 = await textOf(p, card('l') + ' .mtray-caps'), day0 = await textOf(p, '#macroPills');
    await p.click('[data-mstep="l:0:up"]');
    await p.waitForTimeout(300);
    const l1 = await mealOf(p, 'l');
    const meal1 = await textOf(p, card('l') + ' .mtray-caps'), day1 = await textOf(p, '#macroPills');
    t.ok('+ on the chicken adds five grams, there on the day', Math.round(l1[0].x * 140) === 145, JSON.stringify(l1[0]));
    t.ok('and the meal’s pills and the day’s move with it, the line still open and saying 145 g',
      meal1 !== meal0 && day1 !== day0 && (await textOf(p, line('l', 0) + ' .mfl-amt em')) === '145 g' &&
      !!(await p.$(line('l', 0) + '.open')), JSON.stringify({ meal0, meal1, day0, day1 }));

    /* an amount typed on the day */
    await p.click(line('l', 0) + ' [data-mtype]');
    await p.waitForTimeout(200);
    const box = await p.evaluate(() => { const b = document.querySelector('#macroSlots .mtray-f.open .mstep-in'); return !!b && document.activeElement === b; });
    await p.keyboard.type('150');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    t.ok('tapping the amount opens a box there, focused, and what is typed is the amount',
      box && Math.round((await mealOf(p, 'l'))[0].x * 140) === 150 && (await textOf(p, line('l', 0) + ' .mfl-amt em')) === '150 g');

    /* the lock: pressed in the line's keys, and shown on the line itself */
    await p.click(line('l', 0) + ' [data-mlock]');
    await p.waitForTimeout(200);
    t.ok('the lock holds the amount, and the shut line says so with a small lock',
      (await mealOf(p, 'l'))[0].l === 1 && !!(await p.$(line('l', 0) + ' .mtray-fm .mcard-lk')) &&
      (await p.getAttribute(line('l', 0) + ' [data-mlock]', 'aria-pressed')) === 'true');

    /* one open at a time, and a tap on the open line's amount shuts it */
    await p.click(line('l', 1) + ' [data-mamt]');
    await p.waitForTimeout(200);
    const one = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray-f.open .mtray-fn')].map((b) => b.textContent));
    await p.click(line('l', 1) + ' [data-mamt]');
    await p.waitForTimeout(200);
    t.ok('opening the beans shuts the chicken: one line open at a time, and its amount shuts it again',
      one.join() === 'Green beans' && !(await p.$('#macroSlots .mtray-f.open')), JSON.stringify(one));

    /* the tick, on a line: that food eaten, and its dial quiet until asked */
    await p.click(line('l', 2) + ' input.mitem-ate');
    await p.waitForTimeout(250);
    await p.click(line('l', 2) + ' [data-mamt]');
    await p.waitForTimeout(200);
    const ate = await p.evaluate((sel) => ({ keys: [...document.querySelectorAll(sel + ' [data-mstep]')].map((b) => b.disabled),
      wake: !!document.querySelector(sel + ' [data-medit]') }), line('l', 2));
    t.ok('a food’s tick marks that one eaten, and opened its keys are quiet with the amount the way back',
      (await mealOf(p, 'l'))[2].eaten === 1 && ate.keys.every(Boolean) && ate.wake, JSON.stringify(ate));

    /* the bin: gone, and nothing left open on the line that moves up */
    await p.click(line('l', 2) + ' [data-mdel]');
    await p.waitForTimeout(300);
    t.ok('the bin takes the food off the meal, and no line is left open',
      (await mealOf(p, 'l')).length === 2 && !(await p.$('#macroSlots .mtray-f.open')));

    /* ---- the doors: the name to the food, the head to collapse, the pills to the meal ---- */
    await p.click(line('l', 1) + ' .mtray-fn');
    await p.waitForTimeout(500);
    t.ok('a food’s name opens the food, the page search opens', !!(await p.$('#mfsAmt')) && !(await p.$('#modalRoot .msheet')));
    await p.goBack();
    await p.waitForTimeout(500);

    /* ---- three views (Blake, 2026-10-13) ----
       Where each card starts: uneaten meals start on State 2 (Foods with
       Unified Split Pill and checkboxes); eaten meals start on State 1
       (Status); empty Breakfast is one row its name opens. */
    const views = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray[data-mslot]')].map((c) => ({
      k: c.dataset.mslot, v: c.querySelector('[data-mview]') ? c.querySelector('[data-mview]').dataset.mv : '',
      cls: c.className, head: Object.keys((c.querySelector('.mtray-hd') || { dataset: {} }).dataset).join() })));
    t.ok('each card starts where it should: uneaten meals on State 2 (mv-2), empty Breakfast one row its name opens',
      views.map((c) => c.k + (c.v || '-')).join() === 'b-,l2,d2,s2' && /\bmtray-empty\b/.test(views[0].cls) && views[0].head === 'meopen' &&
      /\bmv-2\b/.test(views[1].cls), JSON.stringify(views));

    /* State 2 (Foods): leaf, name, Unified Split Pill (kitchen/each + g), and eaten checkbox */
    const foods = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-f')].map((l) => ({
      name: (l.querySelector('.mtray-fn') || {}).textContent,
      fm: (l.querySelector('.mtray-fm') || {}).textContent,
      g: (l.querySelector('.mfl-amt em') || {}).textContent,
      split: !!l.querySelector('.mfl-amt.split-pill'),
      tick: !!l.querySelector('input.mitem-ate'),
      open: l.classList.contains('open'),
      h: Math.round(l.getBoundingClientRect().height) })), card('d'));
    t.ok('State 2: each line has its leaf, name, Unified Split Pill (kitchen/each + grams), and eaten tick, closed by default',
      foods.length === 2 && foods[1].name === 'Eggs' && foods[1].fm === '2 whole' && foods[1].g === '100 g' &&
      foods.every((l) => l.split && l.tick && !l.open && l.h >= 44), JSON.stringify(foods));
    const verbs = (sel) => p.evaluate((s2) => [...document.querySelectorAll(s2 + ' .mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]), sel);
    t.ok('and its verbs in State 2 are drawings: + to add and ⊘ to skip (the scale waits for State 3)',
      (await verbs(card('d'))).join() === 'mopen,mskipask', JSON.stringify(await verbs(card('d'))));

    /* What each ring should say, worked out here from the meal's own pills
       (have/want): within a tenth on plan, past it over, short of it still
       filling — protein over stays on (2026-10-11). */
    const want = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-caps .mcap')].map((c) => ({
      want: Number(c.dataset.want), have: Number(c.querySelector('.mcap-t').childNodes[1].textContent.replace(/,/g, '')) })), card('l'));

    /* Stepping Lunch from State 2 (mv-2) -> State 3 (mv-3): all foods open simultaneously + inline Quick-Add drawer */
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    t.ok('State 3 carries the scale in the header as well', (await verbs(card('l'))).join() === 'mopen,mbal,mskipask', JSON.stringify(await verbs(card('l'))));
    const s3 = await p.evaluate((sel) => {
      const c = document.querySelector(sel);
      const ls = [...c.querySelectorAll('.mtray-f')];
      return {
        mv3: c.classList.contains('mv-3'),
        allOpen: ls.length === 2 && ls.every((l) => l.classList.contains('open') && l.querySelectorAll('[data-mstep]').length === 2),
        hasAddBox: !!c.querySelector('.mtray-add-box [data-mqslot="l"]'),
        hasBalBtn: !!c.querySelector('.mtray-s3-bal[data-mbal="l"]'),
        picks: c.querySelectorAll('.mtray-pick[data-mqadd]').length
      };
    }, card('l'));
    t.ok('State 3 opens all food rows simultaneously for immediate multi-food adjusting and shows the inline Quick-Add drawer',
      s3.mv3 && s3.allOpen && s3.hasAddBox && s3.hasBalBtn && s3.picks > 0, JSON.stringify(s3));

    /* The scale on the card balances the meal there, on the day, and says so */
    const before = await mealOf(p, 'l');
    await p.click(card('l') + ' .mtray-s3-bal[data-mbal="l"]');
    await p.waitForTimeout(300);
    const after = await mealOf(p, 'l');
    t.ok('the card’s scale balances the meal on the day, letting go of the lock, and the toast says it',
      after.some((it, i) => it.x !== before[i].x) && after.every((it) => !it.l) &&
      /Lunch balanced: \d+ foods? moved/.test(await textOf(p, '#mToast')) && !(await p.$('#modalRoot .msheet')), JSON.stringify({ before, after }));

    /* Recompute ring expectations after balancing Lunch */
    const wantAfter = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-caps .mcap')].map((c) => ({
      want: Number(c.dataset.want), have: Number(c.querySelector('.mcap-t').childNodes[1].textContent.replace(/,/g, '')) })), card('l'));
    const judged = wantAfter.map((w, i) => {
      const r = w.have / w.want;
      return r >= 0.9 && (i === 1 || r <= 1.1) ? 'on' : r > 1.1 ? 'over' : 'under';
    });

    /* the name steps the card: State 3 (Details) → State 1 (Status) → State 2 (Foods) → State 3 (Details) */
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    const status = await p.evaluate((sel) => {
      const c = document.querySelector(sel);
      return { v: c.querySelector('[data-mview]').dataset.mv, lines: c.querySelectorAll('.mtray-f').length, pills: !!c.querySelector('.mtray-caps'),
        beads: [...c.querySelectorAll('.mbd')].map((b) => b.className.replace('mbd ', '')), say: c.querySelector('[data-mview]').getAttribute('aria-label'),
        verbs: [...c.querySelectorAll('.mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]), h: Math.round(c.getBoundingClientRect().height),
        focus: document.activeElement === c.querySelector('[data-mview]') };
    }, card('l'));
    t.ok('a tap on the name from State 3 shuts the card to State 1 (Status): no lines, no pills, a circle each for 🔥 P F C, and only Skip',
      status.v === '1' && status.lines === 0 && !status.pills && status.beads.length === 4 && /^mbd-kcal/.test(status.beads[0]) &&
      status.verbs.join() === 'mskipask' && status.h < 70 && status.focus, JSON.stringify(status));
    const SAY = { on: '(on plan|over, which is fine)', over: 'over', under: '\\d+% there' };
    const said = new RegExp('^Lunch, planned: ' + ['calories', 'protein', 'fat', 'carbs'].map((m, i) => m + ' ' + SAY[judged[i]]).join(', ') +
      '\\. Showing its status; tap for its foods$');
    t.ok('the rings fill by the meal’s share, green on plan, and it is said in words',
      wantAfter.length === 4 && judged.some((j) => j !== 'under') && status.beads.join() === ['kcal', 'p', 'f', 'c'].map((m, i) => 'mbd-' + m + ' rg-' + judged[i]).join() &&
      said.test(status.say), JSON.stringify({ wantAfter, judged, status }));
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    const onState2 = await p.evaluate((sel) => {
      const c = document.querySelector(sel);
      const ls = [...c.querySelectorAll('.mtray-f')];
      return c.classList.contains('mv-2') && ls.length === 2 &&
        ls.every((l) => !!l.querySelector('.mfl-amt.split-pill') && !!l.querySelector('input.mitem-ate') && !l.classList.contains('open'));
    }, card('l'));
    t.ok('again, and it is on State 2 (Foods with Unified Split Pill and ticks)', onState2);
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    const reExpanded = await p.evaluate((sel) => {
      const ls = [...document.querySelectorAll(sel + ' .mtray-f')];
      return ls.length === 2 && ls.every((l) => l.classList.contains('open') && !!l.querySelector('.mfl-amt') && !!l.querySelector('input.mitem-ate'));
    }, card('l'));
    t.ok('and once more back to State 3 (Details), all lines open with their dials and quick-add drawer', reExpanded);

    /* Inline Quick-Add drawer in State 3: search and 1-tap add food directly on the card */
    await p.click(card('l') + ' [data-mqslot="l"]');
    await p.keyboard.type('rice');
    await p.waitForTimeout(250);
    await p.click(card('l') + ' .mtray-pick[data-mqadd]');
    await p.waitForTimeout(300);
    const afterQuickAdd = await p.evaluate((sel) => {
      const ls = [...document.querySelectorAll(sel + ' .mtray-f')];
      const qin = document.querySelector(sel + ' [data-mqslot="l"]');
      return { count: ls.length, allOpen: ls.every((l) => l.classList.contains('open')), qVal: qin ? qin.value : 'missing' };
    }, card('l'));
    t.ok('1-tap quick-add in State 3 adds the food to the meal with its dial open and clears the inline search box',
      afterQuickAdd.count === 3 && afterQuickAdd.allOpen && afterQuickAdd.qVal === '', JSON.stringify(afterQuickAdd));

    /* the meal’s pills open the meal sheet, where food is added */
    await p.click(card('l') + ' .mtray-caps');
    await p.waitForTimeout(500);
    t.ok('and the meal’s pills open the meal sheet, where food is added', !!(await p.$('#modalRoot .msheet')));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(400);

    /* a line opened on one day is not open on another */
    await p.click(line('d', 1) + ' [data-mamt]');
    await p.waitForTimeout(200);
    await p.click('#macroNext');
    await p.waitForTimeout(300);
    await p.click('#macroPrev');
    await p.waitForTimeout(300);
    t.ok('and a line left open is still open back on its own day', !!(await p.$(line('d', 1) + '.open')));

    /* ---- two plates that read wrong ---- */
    const snack = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-f')].map((l) => (l.querySelector('.mtray-fm') || {}).textContent), card('s'));
    t.ok('a can said "1 can (335 ml)" reads "1 can" on the day, not "1 1 can (335 ml)"', snack[0] === '1 can', JSON.stringify(snack));
    await p.click(line('s', 1) + ' [data-mamt]');
    await p.waitForTimeout(250);
    const fries = await textOf(p, line('s', 1) + ' [data-mtype]');
    t.ok('and the USDA’s "1 order, NS as to size" dials as "1 order", its shrug left out', fries === '1 order', fries);
  },
};
