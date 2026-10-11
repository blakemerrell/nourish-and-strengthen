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

    /* ---- three views (Blake, 2026-10-10) ----
       Where each card starts: Lunch is the next meal with food to eat, so
       it is on Details; Dinner and Snacks after it on Foods; Breakfast has
       nothing on it, so there is nothing to step and its name is the way
       to food. */
    const views = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray[data-mslot]')].map((c) => ({
      k: c.dataset.mslot, v: c.querySelector('[data-mview]') ? c.querySelector('[data-mview]').dataset.mv : '',
      cls: c.className, head: Object.keys((c.querySelector('.mtray-hd') || { dataset: {} }).dataset).join() })));
    t.ok('each card starts where it should: Lunch (next) on Details, Dinner and Snacks on Foods, empty Breakfast one row its name opens',
      views.map((c) => c.k + (c.v || '-')).join() === 'b-,l3,d2,s2' && /\bmtray-empty\b/.test(views[0].cls) && views[0].head === 'meopen' &&
      /\bmv-3\b/.test(views[1].cls), JSON.stringify(views));

    /* Foods: the leaf, the name, what it costs, and nothing else to press */
    const foods = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-f')].map((l) => ({
      name: (l.querySelector('.mtray-fn') || {}).textContent, kcal: (l.querySelector('.mtray-ck') || {}).textContent,
      mac: (l.querySelector('.mtray-cm') || {}).textContent, amt: !!l.querySelector('.mfl-amt'), tick: !!l.querySelector('input.mitem-ate'),
      buttons: l.querySelectorAll('button').length, h: Math.round(l.getBoundingClientRect().height) })), card('d'));
    t.ok('Foods: each line is its leaf, its name, its calories and its P, F and C, the name the only thing to press',
      foods.length === 2 && foods[1].name === 'Eggs' && /^\d+ kcal$/.test(foods[1].kcal) && /^\d+P\d+F\d+C$/.test(foods[1].mac) &&
      foods.every((l) => !l.amt && !l.tick && l.buttons === 1 && l.h >= 44), JSON.stringify(foods));
    const verbs = (sel) => p.evaluate((s2) => [...document.querySelectorAll(s2 + ' .mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]), sel);
    t.ok('and its verbs are drawings: + to add and ⊘ to skip (the scale waits for Details)',
      (await verbs(card('d'))).join() === 'mopen,mskipask', JSON.stringify(await verbs(card('d'))));
    t.ok('Details carries the scale as well', (await verbs(card('l'))).join() === 'mopen,mbal,mskipask', JSON.stringify(await verbs(card('l'))));

    /* The scale on the card balances the meal there, on the day, and says so */
    const before = await mealOf(p, 'l');
    await p.click(card('l') + ' [data-mbal="l"]');
    await p.waitForTimeout(300);
    const after = await mealOf(p, 'l');
    t.ok('the card’s scale balances the meal on the day, letting go of the lock, and the toast says it',
      after.some((it, i) => it.x !== before[i].x) && after.every((it) => !it.l) &&
      /Lunch balanced: \d+ foods? moved/.test(await textOf(p, '#mToast')) && !(await p.$('#modalRoot .msheet')), JSON.stringify({ before, after }));

    /* What each ring should say, worked out here from the meal's own pills
       (have/want): within a tenth on plan, past it over, short of it still
       filling — protein over stays on (2026-10-11). */
    const want = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-caps .mcap')].map((c) => ({
      want: Number(c.dataset.want), have: Number(c.querySelector('.mcap-t').childNodes[1].textContent.replace(/,/g, '')) })), card('l'));
    const judged = want.map((w, i) => {
      const r = w.have / w.want;
      return r >= 0.9 && (i === 1 || r <= 1.1) ? 'on' : r > 1.1 ? 'over' : 'under';
    });

    /* the name steps the card: Details → Status → Foods → Details */
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    const status = await p.evaluate((sel) => {
      const c = document.querySelector(sel);
      return { v: c.querySelector('[data-mview]').dataset.mv, lines: c.querySelectorAll('.mtray-f').length, pills: !!c.querySelector('.mtray-caps'),
        beads: [...c.querySelectorAll('.mbd')].map((b) => b.className.replace('mbd ', '')), say: c.querySelector('[data-mview]').getAttribute('aria-label'),
        verbs: [...c.querySelectorAll('.mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]), h: Math.round(c.getBoundingClientRect().height),
        focus: document.activeElement === c.querySelector('[data-mview]') };
    }, card('l'));
    t.ok('a tap on the name shuts the card to its Status: no lines, no pills, a circle each for 🔥 P F C, and only Skip',
      status.v === '1' && status.lines === 0 && !status.pills && status.beads.length === 4 && /^mbd-kcal/.test(status.beads[0]) &&
      status.verbs.join() === 'mskipask' && status.h < 70 && status.focus, JSON.stringify(status));
    const SAY = { on: '(on plan|over, which is fine)', over: 'over', under: '\\d+% there' };
    const said = new RegExp('^Lunch, planned: ' + ['calories', 'protein', 'fat', 'carbs'].map((m, i) => m + ' ' + SAY[judged[i]]).join(', ') +
      '\\. Showing its status; tap for its foods$');
    t.ok('the rings fill by the meal’s share, green on plan, and it is said in words',
      want.length === 4 && judged.some((j) => j !== 'under') && status.beads.join() === ['kcal', 'p', 'f', 'c'].map((m, i) => 'mbd-' + m + ' rg-' + judged[i]).join() &&
      said.test(status.say), JSON.stringify({ want, judged, status }));
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    t.ok('again, and it is on Foods', await p.evaluate((sel) => document.querySelector(sel).classList.contains('mv-2') &&
      document.querySelectorAll(sel + ' .mtray-cl').length === 2, card('l')));
    await p.click(card('l') + ' [data-mview]');
    await p.waitForTimeout(250);
    const reExpanded = await p.evaluate((sel) => {
      const ls = [...document.querySelectorAll(sel + ' .mtray-f')];
      return ls.length === 2 && ls.every((l) => !!l.querySelector('.mfl-amt') && !!l.querySelector('input.mitem-ate'));
    }, card('l'));
    t.ok('and once more back to Details, each line with its amount and tick', reExpanded);

    /* A view chosen holds for that day: Dinner put on Details stays there
       across a redraw, and every card asks for what it needs from there. */
    await p.click(card('d') + ' [data-mview]');
    await p.waitForTimeout(250);
    await p.click(card('s') + ' [data-mview]');
    await p.waitForTimeout(250);

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
