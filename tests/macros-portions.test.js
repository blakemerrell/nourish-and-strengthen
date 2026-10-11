/* Portions measured in what the food is measured in, how far one goes, a
 * label's serving, what it weighs, typing one, a portion of a batch, the
 * family week on the day, Add food at six being dinner, and the fold.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
/* Since 2026-10-04 the day is trays and a plate's controls live in its
   meal's sheet (#modalRoot): openMeal is the tray's own door. */
const { nourish, openPlan, pickerList, openMeal } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — portions, and the fold',
  async suite(t) {
    /* ---- a portion is measured in what the food is measured in -----------
     * Blake: "that cheddar cheese unit is weird. i don't eat a whole cheddar
     * cheese." He was right, and the table already knew: the entry carries a
     * `def` of half a cup, and the code was overruling it with a guess that
     * picked whichever unit landed nearest 130 kcal — a 28 g slice, rendered
     * as "1 whole". Ketchup, mustard, soy and hot sauce were all defaulting
     * to a CUP for the same reason. Where the table states a portion, the
     * table wins. */
    const units = await t.fresh();
    /* Read off the PLATE, not off a re-derivation. The first version of this
       asked window.MFOODS, which the app does not expose, so it passed while
       proving nothing — the same vacuous-green trap the batch test above
       exists to avoid. Put the cheese on a day and read what the card says. */
    const put = await units.evaluate(() => {
      const F = (window.Nutrition || {}).FOODS || {};
      if (!F.cheddar) return null;
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
        '-' + String(d.getDate()).padStart(2, '0');
      const days = {}; days[k] = { b: [{ id: 'f:cheddar', x: 1, eaten: 0 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      return { def: F.cheddar.def && F.cheddar.def.unit, has: Object.keys(F.cheddar.g || {}) };
    });
    await units.reload();
    await units.click('.tab[data-view="macros"]');
    await units.waitForTimeout(400);
    await openMeal(units, 'b');
    /* The cup is on the chip now and the weight on the dial — a food
       measured by the cup is dialled by the gram — so the word the table
       chose is read off the chip, and the dial is checked for the thing it
       must not say. */
    const said = await units.evaluate(() => {
      const x = document.querySelector('#modalRoot .mstep-x'), u = document.querySelector('#modalRoot .mitem-uom');
      return x ? { dial: x.textContent.trim(), chip: u ? u.textContent.trim() : '' } : null;
    });
    t.ok('the table states a portion for cheddar, and it is not a whole cheese',
      !!put && put.def && put.def !== 'each', JSON.stringify(put));
    t.ok('and the plate counts it in that, not in whole cheeses',
      !!said && said.dial.indexOf('whole') < 0 && said.chip.indexOf(put.def) >= 0,
      'the card says ' + JSON.stringify(said) + ', the table says ' + (put && put.def));
    await units.context().close();

    /* ---- opening a day that was left scrolled ----------------------------
     * The one that actually bit. The browser puts the old scroll position
     * back before the app has drawn anything, so the fold is asked to work
     * before it has ever seen the top of the page — and the gap it needs used
     * to fall back to the card's own computed bottom margin, which is the
     * margin the fold itself wrote a frame earlier. Every frame read its own
     * output and added to it: 183px became 37,691px in under two seconds, and
     * My Day was a screenful of blank paper with the day far above it.
     *
     * Two things hold it now. The app opens at the top, because a restored
     * scroll position belongs to a page that did not exist yet. And there is
     * no fallback at all — with no honest gap the card does not fold. */
    const reopen = await t.fresh({ viewport: { width: 412, height: 915 },
      hasTouch: true, isMobile: true });
    await reopen.click('.tab[data-view="macros"]');
    await reopen.waitForTimeout(200);
    await openPlan(reopen);
    await reopen.waitForTimeout(150);
    await reopen.click('[data-mtarg="save"]');
    await reopen.waitForTimeout(250);
    await reopen.click('#macroFill');
    await reopen.waitForTimeout(700);
    const beforeReopen = await reopen.evaluate(() => document.documentElement.scrollHeight);
    await reopen.evaluate(() => window.scrollTo(0, 600));
    await reopen.waitForTimeout(400);
    await reopen.reload();
    await reopen.waitForTimeout(1000);
    const back = await reopen.evaluate(() => {
      const st = document.querySelector('.mday-stick');
      // a meal is a tray on the day now (2026-10-04)
      const items = [...document.querySelectorAll('#macroSlots .mtray')];
      return { y: Math.round(window.scrollY), page: document.documentElement.scrollHeight,
        margin: parseFloat((st && st.style.marginBottom) || 0) || 0,
        restoration: history.scrollRestoration,
        onScreen: items.filter((e) => {
          const r = e.getBoundingClientRect();
          return r.bottom > 0 && r.top < window.innerHeight;
        }).length };
    });
    t.ok('reopening a day that was left scrolled starts it at the top',
      back.y === 0 && back.restoration === 'manual',
      'y=' + back.y + ' restoration=' + back.restoration);
    /* The failure was unbounded growth, so what matters is that the page did
       not BALLOON — it is legitimately shorter, because the meals come back
       folded. */
    t.ok('and the page has not run away with itself',
      back.page < beforeReopen + 300 && back.margin < 400,
      'page ' + beforeReopen + ' → ' + back.page + ', margin ' + back.margin + 'px');
    t.ok('and the day is on the screen rather than far above it',
      back.onScreen > 0, 'plates on screen: ' + back.onScreen);
    /* And it must settle, not creep: the old bug grew on every frame, so a
       second look a beat later is the difference between fixed and slower. */
    await reopen.waitForTimeout(1200);
    const settled = await reopen.evaluate(() => document.documentElement.scrollHeight);
    t.ok('and it is still that size a second later, not creeping',
      settled === back.page, back.page + ' → ' + settled);
    await reopen.context().close();

    /* ---- how far a portion goes ------------------------------------------
     * Blake, logging his lunch: "the limit on the qty I can select. Is it
     * limiting me to 4 nuts and won't let me add more." It was — and his day
     * had bacon at 4 slices, gummies at 4 pieces and ground beef at 4 oz, all
     * pinned on the same ceiling. Both steppers carried their own copy of
     * Math.min(4, x + 0.25): a sane ceiling for a multiple of a SERVING, and
     * a nonsense one for a count of a THING. */
    const qty = await t.fresh();
    const qtyFood = await qty.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      /* Blake's own case, seeded the way he made it: a food of his own,
         counted in a unit you cannot have a quarter of. The single foods the
         table ships are measured in grams and cups and never hit this. */
      localStorage.setItem('bsc.myFoods', JSON.stringify({
        corn_nuts: { name: 'Corn nuts', unit: 'nut', kcal: 4, p: 0, f: 0.2, c: 0.6 } }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 55, c: 120 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:my:corn_nuts', x: 1, eaten: 0 }], l: [], d: [], s: [] } }));
      return { id: 'f:my:corn_nuts', unit: 'nut', name: 'Corn nuts' };
    });
    await qty.reload();
    await qty.waitForTimeout(400);
    await qty.click('.tab[data-view="macros"]');
    await qty.waitForTimeout(300);
    await openMeal(qty, 'b');
    const readX = () => qty.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const k = Object.keys(days).sort().pop();
      return ((days[k] || {}).b || [])[0].x;
    });
    for (let i = 0; i < 12; i++) {
      await qty.click('#modalRoot [data-mstep$=":up"]');
      await qty.waitForTimeout(60);
    }
    const climbed = await readX();
    t.ok('a countable food climbs past four rather than stopping on it',
      climbed > 4, JSON.stringify({ food: qtyFood, x: climbed }));
    /* And it climbs in whole ones: a quarter of a nut is not a portion, it is
       an arithmetic accident. */
    /* Twelve presses from one, a whole nut each: thirteen. Asserted exactly,
       because "more than four" alone would pass on a stepper that had merely
       had its ceiling raised while still counting in quarters. */
    t.ok('and it climbs in whole ones, not in quarters',
      climbed === 13, JSON.stringify({ unit: qtyFood.unit, x: climbed }));
    t.ok('and the plate says so in the food own word',
      /13\s*nuts?/.test(await qty.textContent('#modalRoot .mstep-x')),
      await qty.textContent('#modalRoot .mstep-x'));
    /* The floor still holds: a portion never steps to nothing. */
    for (let i = 0; i < 40; i++) {
      await qty.click('#modalRoot [data-mstep$=":down"]');
      await qty.waitForTimeout(40);
    }
    t.ok('and it never steps down to nothing',
      (await readX()) > 0, JSON.stringify({ x: await readX() }));
    await qty.context().close();

    /* ---- a label's serving, said the same on the plate and in the list -----
     *
     * A food whose label says its own amount — "0.5 cup (113 g)" — reads "2
     * cups · 452 g" on the plate at four, and the picker's row said "×4 0.5
     * cup (113 g)": two numbers side by side, neither the amount. And a
     * label noun never counted up: "1 bar (40 g)" at two was "2 bar". */
    const lbl = await t.fresh();
    await lbl.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.myFoods', JSON.stringify({
        tam: { name: 'Tamale', unit: '0.5 cup (113 g)', kcal: 250, p: 10, f: 12, c: 25 },
        pbar: { name: 'Protein bar', unit: '1 bar (40 g)', kcal: 200, p: 20, f: 5, c: 20 } }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 55, c: 220 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [], l: [{ id: 'f:my:tam', x: 4, eaten: 0 }, { id: 'f:my:pbar', x: 2, eaten: 0 }], d: [], s: [] } }));
    });
    await lbl.reload();
    await lbl.waitForTimeout(400);
    await lbl.click('.tab[data-view="macros"]');
    await lbl.waitForTimeout(300);
    // both plates are on lunch, so lunch's sheet is the one opened
    await openMeal(lbl, 'l');
    const lblPlate = await lbl.evaluate(() => [...document.querySelectorAll('#modalRoot .mrows .mitem')]
      .map((it) => it.textContent.replace(/\s+/g, ' ')));
    t.ok('a label noun counts up on the plate: two bars, not "2 bar"',
      lblPlate.some((x) => /Protein bar/.test(x) && /2 bars/.test(x)) &&
        !lblPlate.some((x) => /2 bar(?!s)/.test(x)), JSON.stringify(lblPlate));
    // the picker is in the same sheet, under the plates
    await pickerList(lbl);
    const lblRows = await lbl.evaluate(() => {
      const fit = (id) => ((document.querySelector('.mpick-row[data-mpick="' + id + '"] .mp-fit') || {}).textContent || '')
        .replace(/\s+/g, ' ').trim();
      return { tam: fit('f:my:tam'), bar: fit('f:my:pbar') };
    });
    /* Grams first since 2026-10-04 (Blake: "I dial in grams"), the label's
       own words after. */
    t.ok('and the picker row says the amount the plate says: "452 g · 2 cups", "80 g · 2 bars"',
      /^452 g · 2 cups · /.test(lblRows.tam) && /^80 g · 2 bars · /.test(lblRows.bar) &&
        !/0\.5 cup|×/.test(lblRows.tam), JSON.stringify(lblRows));
    await lbl.context().close();

    /* ---- Add food at six in the evening is dinner ------------------------
     * Gone with the day bar's Add food (2026-10-04): every way in to adding
     * food names its meal now (a tray opens its own sheet), so there is no
     * "which meal?" left for the clock to answer. */

    /* ---- what it weighs --------------------------------------------------
     * Blake: "sometimes it's just easier for me to measure the food on a scale
     * than using cups." A cup of oats is a range; 40 g of oats is 40 g. The
     * weight was on the plate until the provenance row was deleted and took
     * mPortion's detail with it — named as that removal's cost at the time,
     * and then found in use, which is the right order. It is back beside the
     * cost rather than beside the shelf the food came from. */
    const wg = await t.fresh();
    await wg.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 55, c: 120 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:cheddar', x: 1, eaten: 0 }], l: [], d: [], s: [] } }));
    });
    await wg.reload();
    await wg.waitForTimeout(400);
    await wg.click('.tab[data-view="macros"]');
    await wg.waitForTimeout(300);
    await openMeal(wg, 'b');
    const weighed = await wg.evaluate(() => {
      const row = document.querySelector('#modalRoot .mrows .mitem');
      /* It has its own chip on the facts band now, ahead of the figures —
         the weight is how you MEASURE the plate, so it leads the line that
         says what the plate is. */
      const g = row.querySelector('.mitem-uom');
      const mac = row.querySelector('.mitem-mac');
      if (!g || !mac) return null;
      const gb = g.getBoundingClientRect(), mb = mac.getBoundingClientRect();
      return { text: g.textContent.trim(),
        portion: (row.querySelector('.mstep-x') || {}).textContent.trim(),
        /* The small print under the name (2026-10-04, the meal sheet): the
           kitchen word first, then the cost, in one line of it. */
        sameLine: !!g.closest('.mrow-m') && g.closest('.mrow-m') === mac.closest('.mrow-m') &&
          gb.top < mb.bottom && mb.top - gb.top < 16,
        quieter: parseFloat(getComputedStyle(g).fontSize) <=
          parseFloat(getComputedStyle(mac).fontSize) };
    });
    /* Turned around since: the weight is the number on the dial, because a
       food measured by the cup is dialled by the gram, and the cup it came
       in is the chip on the cost line. */
    t.ok('a plate measured in cups is dialled by the gram',
      !!weighed && /^\d+\s*g$/.test(weighed.portion), JSON.stringify(weighed));
    t.ok('and the cup it came in is the chip beside it',
      !!weighed && /cup/.test(weighed.text), JSON.stringify(weighed));
    t.ok('and it says it in the small print with the cost, where the eye already is',
      !!weighed && weighed.sameLine, JSON.stringify(weighed));
    t.ok('and quieter than the cost, being how you measure it rather than what it costs',
      !!weighed && weighed.quieter, JSON.stringify(weighed));
    /* And a tap is at most five grams, to the next point on the five-gram
       grid: a cup of cheddar is 113 g and goes to 115, not to 120. The chip
       only moves when the weight crosses an eighth of a cup; the dial moves
       every time. */
    await wg.click('#modalRoot [data-mstep$=":up"]');
    await wg.waitForTimeout(250);
    t.ok('and a tap moves the weight up to the next five grams',
      await wg.evaluate((was) => {
        const x = document.querySelector('#modalRoot .mstep-x');
        return !!x && parseInt(x.textContent, 10) === Math.floor(parseInt(was, 10) / 5) * 5 + 5;
      }, weighed.portion),
      weighed.portion + ' → ' + await wg.evaluate(() => (document.querySelector('#modalRoot .mstep-x') || {}).textContent));
    await wg.context().close();

    /* ---- typing a portion ------------------------------------------------
     * Blake: "why even have a cap? Probably can remove it for foods." Right,
     * and the cap was never what stopped him: thirty nuts is twenty-nine taps
     * and a hundred and eighty-five grams is seven hundred and forty. The dial
     * gets you from one to two. A logger has to let you say the number.
     *
     * The unit stays beside the box and only the count is typed, so there is
     * nothing to parse and no way for a bare number to mean two things. */
    const typ = await t.fresh();
    await typ.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.myFoods', JSON.stringify({
        corn_nuts: { name: 'Corn nuts', unit: 'nut', kcal: 4, p: 0, f: 0.2, c: 0.6 },
        rice: { name: 'Rice, cooked', unit: 'g', kcal: 130, p: 2.7, f: 0.3, c: 28 } }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 55, c: 120 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:my:corn_nuts', x: 1, eaten: 0 },
            { id: 'f:my:rice', x: 1, eaten: 0 }], l: [], d: [], s: [] } }));
    });
    await typ.reload();
    await typ.waitForTimeout(400);
    await typ.click('.tab[data-view="macros"]');
    await typ.waitForTimeout(300);
    await openMeal(typ, 'b');
    const plate = (n) => typ.evaluate((i) => {
      const e = document.querySelectorAll('#modalRoot .mrows .mitem')[i];
      return { portion: (e.querySelector('.mstep-x') || {}).textContent.trim(),
        mac: (e.querySelector('.mitem-mac') || {}).textContent };
    }, n);

    // by position among the food rows of the meal's sheet
    const typeOn = (i) => typ.locator('#modalRoot .mrows .mitem').nth(i).locator('[data-mtype]').click();
    await typeOn(0);
    await typ.waitForTimeout(200);
    t.ok('tapping a portion opens an empty box, the number that was there shown faint in it',
      (await typ.inputValue('#modalRoot .mstep-in')) === '' &&
      (await typ.getAttribute('#modalRoot .mstep-in', 'placeholder')) === '1',
      await typ.getAttribute('#modalRoot .mstep-in', 'placeholder'));
    await typ.fill('#modalRoot .mstep-in', '30');
    await typ.keyboard.press('Enter');
    await typ.waitForTimeout(300);
    const nuts = await plate(0);
    t.ok('and typing thirty makes it thirty, in the food own word',
      /^30\s*nuts?$/.test(nuts.portion), JSON.stringify(nuts));
    /* 126: a nut is 0.6 g of carbs and 0.2 of fat, 4.2 kcal at four and nine.
       It read 120 until 2026-10-11, when an own food stopped being rounded
       to whole calories a unit (a drink kept per 100 mL read 162 for 160). */
    t.ok('and the cost follows it rather than the number alone moving',
      /^126 kcal/.test(nuts.mac), JSON.stringify(nuts));

    /* Grams are the case where the number on screen is NOT x: mPortion shows
       r.grams * x, so typing 185 and storing 185 would store a hundred and
       eighty-five portions of it.
     *
       The rice is read off its dial rather than assumed to be the 100 g it
       went on at: since 2026-10-05 a typed amount is kept and the rest of the
       meal re-fits around it, so thirty corn nuts have already moved it. */
    const riceWas = (await plate(1)).portion;
    await typeOn(1);
    await typ.waitForTimeout(200);
    const riceBox = await typ.getAttribute('#modalRoot .mstep-in', 'placeholder');
    t.ok('a food measured in grams opens on its grams, not on its multiplier',
      (await typ.inputValue('#modalRoot .mstep-in')) === '' && /^\d+$/.test(riceBox) &&
      riceWas === riceBox + ' g' && Number(riceBox) >= 5, JSON.stringify({ riceWas, riceBox }));
    await typ.fill('#modalRoot .mstep-in', '185');
    await typ.keyboard.press('Enter');
    await typ.waitForTimeout(300);
    const rice = await plate(1);
    t.ok('and typing its grams shows those grams back', /^185\s*g$/.test(rice.portion),
      JSON.stringify(rice));
    // 125.5 kcal a unit times 1.85, unrounded per unit since 2026-10-11 (it read 233 from 126)
    t.ok('and 185 g of it costs 185 g worth', /^232 kcal/.test(rice.mac),
      JSON.stringify(rice));
    t.ok('and what is stored is the multiplier, not the weight',
      await typ.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const k = Object.keys(d).sort().pop();
        return (d[k].b.filter((i) => i.id === 'f:my:rice')[0] || {}).x === 1.85;
      }),
      await typ.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
        const k = Object.keys(d).sort().pop();
        return JSON.stringify(d[k].b);
      }));

    /* Nonsense is not a portion. An empty box or a stray letter leaves the
       plate as it was rather than writing a nought and quietly taking the
       food off the day arithmetic. */
    await typeOn(0);
    await typ.waitForTimeout(200);
    await typ.fill('#modalRoot .mstep-in', 'abc');
    await typ.keyboard.press('Enter');
    await typ.waitForTimeout(300);
    t.ok('and nonsense typed into it changes nothing',
      /^30\s*nuts?$/.test((await plate(0)).portion), JSON.stringify(await plate(0)));
    await typeOn(0);
    await typ.waitForTimeout(200);
    await typ.fill('#modalRoot .mstep-in', '0');
    await typ.keyboard.press('Enter');
    await typ.waitForTimeout(300);
    t.ok('and nor does a nought, which is not a portion either',
      /^30\s*nuts?$/.test((await plate(0)).portion), JSON.stringify(await plate(0)));

    /* And the solver may now PROPOSE a size a food actually comes in.
     *
       Asserted by making it climb, not by leaving a big number alone: the
       descent starts from the plate's current size and only moves if a rung
       beats it, so a hand-set thirty survives the old quarter-to-four ladder
       too — on a day still under target, where bigger always scores better.
       That made the first version of this test pass against the very code it
       was written to catch. Starting LOW is what separates them: the old
       ladder could not offer more than four of anything, whatever the day
       wanted. */
    await typ.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {
        b: [{ id: 'f:my:corn_nuts', x: 1, eaten: 0 }], l: [], d: [], s: [] } }));
    });
    await typ.reload();
    await typ.waitForTimeout(400);
    await typ.click('.tab[data-view="macros"]');
    await typ.waitForTimeout(300);
    /* Rebalance is on the day's bar, so it is pressed from the day, and the
       meal's sheet opened afterwards to read the plate. */
    await typ.click('#macroRebal');
    await typ.waitForTimeout(700);
    await openMeal(typ, 'b');
    const reb = await plate(0);
    t.ok('Rebalance can offer more of a food than a dish ceiling ever allowed',
      Number((reb.portion.match(/[\d.]+/) || [0])[0]) > 4, JSON.stringify(reb));
    await typ.context().close();

    /* ---- the family week, on the day ------------------------------------
     * The two halves of this app had never spoken. The Plan tab keeps a week
     * of meals for the house — shared with whoever holds the code — and My Day
     * kept a private day measured against a cut, and neither read the other.
     * You could plan Tuesday's dinner on one screen and, on Tuesday, press
     * Fill on the other and be handed something else.
     *
     * Blake: "seeding my day with family recipes planned for that day would be
     * good... auto fill a day based on my favorites and best fits." So Fill
     * now means: draft my day, starting from what the family already decided.
     *
     * The week is dateless by design — "Monday is a slot, not a date" — so the
     * join is the weekday, and it is a READ. The day may take from the week;
     * the week must never notice. */
    const fam = await t.fresh();
    const famPick = await fam.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const g = new Date(); g.setDate(g.getDate() + 120);
      /* A dinner, so the slot it lands on is decided by its own section and
         can be checked rather than assumed. */
      const dinner = window.RECIPES.find((r) => r.macro && r.macro.kcal > 250 &&
        ['1-4', '2-3', '2-4'].indexOf(r.book + '-' + r.secNum) >= 0);
      const wd = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
      const weeks = { w1: { name: 'This Week', ord: 0, plan: {}, checked: {} } };
      weeks.w1.plan[wd] = [{ i: dinner.id, x: 1 }];
      localStorage.setItem('bsc.weeks', JSON.stringify(weeks));
      localStorage.setItem('bsc.active', 'w1');
      localStorage.setItem('bsc.macroProfile', JSON.stringify({
        sex: 'm', age: 43, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 175,
        goalBy: g.getFullYear() + '-' + p2(g.getMonth() + 1) + '-' + p2(g.getDate()),
        workouts: 4, steps: 8000 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: {} }));
      return { id: dinner.id, name: dinner.name, weekday: wd, kcal: dinner.macro.kcal };
    });
    await fam.reload();
    await fam.waitForTimeout(400);
    await fam.click('.tab[data-view="macros"]');
    await fam.waitForTimeout(300);
    await fam.click('#macroFill');
    await fam.waitForTimeout(600);

    const famDay = await fam.evaluate((want) => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const k = Object.keys(days).sort().pop();
      const day = days[k] || {};
      const where = Object.keys(day).filter((sk) => (day[sk] || [])
        .some((it) => it.id === want.id));
      const plate = (day[where[0]] || []).filter((it) => it.id === want.id)[0];
      const all = Object.keys(day).reduce((n, sk) => n + (day[sk] || []).length, 0);
      return { on: where, plate: plate || null, plates: all,
        weekUntouched: localStorage.getItem('bsc.weeks') };
    }, famPick);

    t.ok('Fill puts the dish the family planned for today on the day',
      famDay.on.length === 1, JSON.stringify({ famPick, on: famDay.on }));
    /* Its section decides the meal — the same map Fill steers by. A dinner
       recipe does not land on breakfast. */
    t.ok('and on the meal its own section names, not the first one going',
      famDay.on[0] === 'd', JSON.stringify(famDay.on));
    /* Marked, so a plate knows where it came from — beside 'f' for fill. */
    t.ok('and the plate says it came from the week',
      !!famDay.plate && famDay.plate.by === 'w', JSON.stringify(famDay.plate));
    /* The portion is not left at the 1x it was placed with: mBalanceDay sizes
       every plate on the finished day at once, which is the only place that
       can see what the rest of the day came to. This is the "solved to fit my
       macros" half of the answer. */
    t.ok('and its portion is solved against the day rather than left at one',
      !!famDay.plate && famDay.plate.x > 0, JSON.stringify(famDay.plate));
    /* Fill still did its own job around it. */
    t.ok('and the rest of the day is drafted around it',
      famDay.plates > 1, JSON.stringify({ plates: famDay.plates }));
    /* The week belongs to the house. Reading it must not edit it. */
    t.ok('and the family\u2019s week is not touched by any of it',
      (() => { const w2 = JSON.parse(famDay.weekUntouched || '{}');
        const wk = Object.keys(w2).filter((k) => /^d\d{8}$/.test(k))[0];     // weeks have dates
        const pl = ((w2[wk] || {}).plan || {})[famPick.weekday] || [];
        return pl.length === 1 && (pl[0].i || pl[0]) === famPick.id; })(),
      famDay.weekUntouched);

    /* And it does not overwrite a meal you have already dealt with. */
    await fam.evaluate((want) => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const k = Object.keys(days).sort().pop();
      const other = window.RECIPES.find((r) => r.macro && r.id !== want.id);
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [k]: { d: [{ id: other.id, x: 1, eaten: 1 }] } }));
      window.__other = other.id;
    }, famPick);
    await fam.reload();
    await fam.waitForTimeout(400);
    await fam.click('.tab[data-view="macros"]');
    await fam.waitForTimeout(300);
    await fam.click('#macroFill');
    await fam.waitForTimeout(600);
    t.ok('and a meal already eaten is left exactly as it was',
      await fam.evaluate((want) => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        const k = Object.keys(days).sort().pop();
        const d = (days[k] || {}).d || [];
        return d.length === 1 && d[0].id !== want.id && d[0].eaten === 1;
      }, famPick),
      await fam.evaluate(() => {
        const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
        const k = Object.keys(days).sort().pop();
        return JSON.stringify((days[k] || {}).d || []);
      }));
    await fam.context().close();

    /* ---- a portion of a batch --------------------------------------------
     * The two tests above ride on whatever Fill happened to draft, and a day
     * of single-serving plates would pass them while proving nothing: only a
     * recipe that makes SEVERAL could ever show the fault. So this one puts a
     * known batch on a known day and reads the card back.
     *
     * The case, exactly as it appeared on Blake's phone: a recipe that makes
     * six, eaten one and three quarters. The card said "10½ servings" — the
     * portion times the whole yield — while the calories on the same line
     * charged for 1¾. Six times too much, on every batch recipe in the book. */
    const batch = await t.fresh();
    const bat = await batch.evaluate(() => {
      const r = window.RECIPES.find((q) => q.servN === 6 && q.macro && q.macro.kcal > 0)
        || window.RECIPES.find((q) => (q.servN || 1) > 1 && q.macro && q.macro.kcal > 0);
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
        '-' + String(d.getDate()).padStart(2, '0');
      const days = {}; days[k] = { b: [{ id: r.id, x: 1.75, eaten: 0 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      return { name: r.name, servN: r.servN, kcal: r.macro.kcal, servings: r.servings };
    });
    await batch.reload();
    await batch.click('.tab[data-view="macros"]');
    await batch.waitForTimeout(300);
    await openMeal(batch, 'b');
    const batCard = await batch.evaluate(() => {
      const row = document.querySelector('#modalRoot .mrows .mitem');
      if (!row) return null;
      return {
        /* The dial is grams since 2026-10-04 (recipes too, from their serving
           weight); the portion in servings is the small print beside it. */
        amount: (row.querySelector('.mitem-uom') || {}).textContent.trim(),
        dial: row.querySelector('.mstep-x').textContent.trim(),
        chips: [...row.querySelectorAll('.mchip')].map((c) => c.textContent.trim()),
        from: (row.querySelector('.mitem-from') || {}).textContent || '',
        mac: (row.querySelector('.mitem-mac') || {}).textContent || ''
      };
    });
    t.ok('a plate holding part of a batch says the part, not the batch',
      !!batCard && batCard.amount.indexOf('1') === 0 && /¾/.test(batCard.amount) &&
        batCard.amount.indexOf(String(bat.servN)) < 0 && /^~?[\d,]+ g$/.test(batCard.dial),
      bat.name + ' (' + bat.servings + ') at ×1¾ shows "' + (batCard && batCard.amount) + '", dial "' + (batCard && batCard.dial) + '"');
    t.ok('and the calories on that line are for the part as well',
      !!batCard && Math.abs(parseInt(batCard.mac.replace(/[^\d]/, ''), 10) -
        Math.round(bat.kcal * 1.75)) <= 1,
      (batCard && batCard.mac) + ' — wanted ' + Math.round(bat.kcal * 1.75) + ' kcal');
    /* And what the recipe MAKES is no longer said here at all. The yield went
       with the book and the portion detail when the provenance row was
       deleted: it is a cooking fact rather than an eating one, and the plate
       is the eating. "Makes 4" is on the recipe, behind the name.

       The distinction this leaves is the one that was always doing the work,
       and it is asserted directly above: the plate says the PART, not the
       batch. A row that said "1¾ servings" and "makes 8" in the same breath
       was offering two numbers for one question. */
    t.ok('while what the recipe makes is no longer said on the plate',
      !!batCard && batCard.from === '' &&
      batCard.amount.indexOf('makes') < 0 && batCard.mac.indexOf('makes') < 0,
      'from "' + (batCard && batCard.from) + '" amount "' +
        (batCard && batCard.amount) + '" mac "' + (batCard && batCard.mac) + '"');
    await batch.context().close();

    /* ---- the one thing on that row worth keeping -------------------------
     * The salt warning came off the provenance row rather than going with it:
     * it is the only one of those four that was a WARNING and not a label, so
     * it moved up beside the figures, which is where the other things a plate
     * costs you already are.
     *
     * It stopped being a chip on the way, and that is the bug. At 74x16 inside
     * an 11px-tall .mitem-from carrying overflow:hidden it overhung 2.5px top
     * and bottom, and both were shaved off — so the border drawn to mark it as
     * a warning reached the screen as two loose vertical strokes either side
     * of the words: "RUN │1,079 mg salt│". The comment in the stylesheet was
     * proud of that border for months.
     *
     * A known salty recipe on a known day, for the same reason the batch above
     * gets one: the shared fixture's plates are whatever Fill drafted, and a
     * day of unsalted ones would pass this while proving nothing. */
    const saltPage = await t.fresh();
    const salt = await saltPage.evaluate(() => {
      const r = window.RECIPES.find((q) => q.macro && q.macro.na > 900);
      if (!r) return null;
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
        '-' + String(d.getDate()).padStart(2, '0');
      const days = {}; days[k] = { b: [{ id: r.id, x: 1, eaten: 0 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      return { name: r.name, na: r.macro.na };
    });
    t.ok('the book still holds a plate salty enough to warn about',
      !!salt, JSON.stringify(salt));
    await saltPage.reload();
    await saltPage.click('.tab[data-view="macros"]');
    await saltPage.waitForTimeout(300);
    await openMeal(saltPage, 'b');
    t.ok('a salty plate says so in words, whole, inside its own box on every edge',
      await saltPage.evaluate(() => {
        const el = document.querySelector('#modalRoot .msalt');
        if (!el) return false;
        const meta = el.closest('.mitem-r2');
        const mb = meta.getBoundingClientRect(), sb = el.getBoundingClientRect();
        return /mg salt/.test(el.textContent) &&
          /* Nothing of it clipped, on either axis. The chip it replaces failed
             on the VERTICAL, which is the axis nobody thinks to check — and
             the reason it was invisible for so long is that the horizontal
             was fine. */
          sb.top >= mb.top - 0.5 && sb.bottom <= mb.bottom + 0.5 &&
          sb.left >= mb.left - 0.5 && sb.right <= mb.right + 0.5 &&
          el.scrollWidth <= el.clientWidth + 1 &&
          el.scrollHeight <= el.clientHeight + 1;
      }),
      await saltPage.evaluate(() => {
        const el = document.querySelector('#modalRoot .msalt');
        if (!el) return 'no salt warning drawn';
        const box = (e) => { const b = e.getBoundingClientRect();
          return [b.top, b.bottom, b.left, b.right].map(Math.round).join(','); };
        return el.textContent.trim() + ' salt[' + box(el) + '] meta[' +
          box(el.closest('.mitem-r2')) + ']';
      }));
    /* And it is a warning rather than a label, said by the ink now that there
       is no border left to say it. */
    t.ok('and says it in the warning colour, not in the colour of the figures',
      await saltPage.evaluate(() => {
        const el = document.querySelector('#modalRoot .msalt');
        const mac = document.querySelector('#modalRoot .mitem-mac');
        if (!el || !mac) return false;
        return getComputedStyle(el).color !== getComputedStyle(mac).color;
      }));
    await saltPage.context().close();

    /* ---- the fold ---------------------------------------------------------
     * On a phone the sticky readout — week strip, four bars, fibre and salt —
     * is a third of the screen, and scrolling down to dinner meant reading
     * dinner through a letterbox. As the page scrolls it closes onto one row
     * of pills carrying the same six numbers; back at the top it opens again.
     *
     * It closes by degrees, not at a line. How far shut the card is comes
     * straight from the scroll position, so there is no threshold anywhere
     * for the two states to flap across — the same scroll position always
     * gives the same card, whichever way you arrived at it, which is what
     * the two-threshold version was buying with hysteresis. `.shrunk` marks
     * the far end of the fold and nothing in between. */
    const ph = await t.fresh({ viewport: { width: 390, height: 720 } });
    await ph.click('.tab[data-view="macros"]');
    await ph.waitForTimeout(200);
    await openPlan(ph);
    await ph.waitForTimeout(200);
    await ph.click('[data-mtarg="save"]');
    await ph.waitForTimeout(250);
    await ph.click('#macroFill');
    await ph.waitForTimeout(500);
    /* The fold needs a day longer than the screen to scroll through. Open all
       used to give it one; the day is compact trays since 2026-10-04, so the
       day here is made long the honest way, with more on every meal. */
    await ph.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const k = Object.keys(d).sort().pop();
      ['b', 'l', 'd', 's'].forEach((sk) => {
        d[k][sk] = d[k][sk] || [];
        for (let i = 0; i < 6; i++) d[k][sk].push({ id: 'f:banana', x: 1, eaten: 0 });
      });
      localStorage.setItem('bsc.macroDays', JSON.stringify(d));
    });
    await ph.reload();
    await ph.waitForTimeout(500);
    await ph.click('.tab[data-view="macros"]');
    await ph.waitForTimeout(400);
    t.ok('at the top of the day the readout is open and the pills are put away',
      await ph.evaluate(() => {
        const st = document.querySelector('.mday-stick');
        const pills = document.querySelector('.mpills');
        return !st.classList.contains('shrunk') &&
          getComputedStyle(pills).opacity === '0' &&
          getComputedStyle(document.querySelector('.mbars')).opacity === '1';
      }), await ph.evaluate(() => 'pills opacity ' +
        getComputedStyle(document.querySelector('.mpills')).opacity));
    t.ok('the pills carry the same six numbers as the rows and the bars under them',
      await ph.evaluate(() => {
        const pills = [...document.querySelectorAll('.mpill')].map((x) => x.textContent.replace(/[\s,]/g, ''));
        const rows = [...document.querySelectorAll('[data-macro] .mb-d')].map((x) => x.dataset.d);
        /* The limit pills carry the figure only — the fill says the
           proportion, so a denominator would say it twice, and dropping it is
           what buys every pill the same width. The open bars keep both.
         *
           The limit ROWS are gone from the card unless one of them is off,
           so they cannot be the source here: `lim` would be empty and
           `[].every()` is true, which is a guard that passes hardest when
           the thing it guards has been deleted. So the last two pills are
           asserted on their own terms — the glyph that names which limit,
           and a figure — and any row that IS showing must agree with its
           pill. */
        const lim = [...document.querySelectorAll('.mlimits .mlim')].map((r) =>
          ({ k: r.dataset.lim, v: (r.querySelector('.mlim-t b').textContent
            .match(/[\d,]+/) || [''])[0].replace(/,/g, '') }));
        const IDX = { fib: 4, na: 5 };
        return pills.length === 6 &&
          rows.length === 4 && rows.every((v, i) => pills[i].indexOf(v) >= 0) &&
          /🌾\d/.test(pills[4]) && /🧂\d/.test(pills[5]) &&
          lim.every((x) => pills[IDX[x.k]].indexOf(x.v) >= 0);
      }), await ph.evaluate(() => document.querySelector('.mpills').textContent));
    /* And each one is its own bar. This is the whole reason the row exists in
       this form: folded, the number gives the gap and the fill gives the
       proportion, so "under" stops being four identical greys. */
    /* Across the whole row, and the two limits set apart from the four
       that matter most. Measured at 375, the narrowest phone the row was
       ever sized for, and the row must not scroll there. */
    await ph.setViewportSize({ width: 375, height: 720 });
    await ph.waitForTimeout(200);
    const laid = await ph.evaluate(() => {
      const row = document.querySelector('.mpills').getBoundingClientRect();
      const ps = [...document.querySelectorAll('.mpill')].map((p) => p.getBoundingClientRect());
      const w = ps.slice(0, 4).map((r) => Math.round(r.width));
      return { n: ps.length, macroWidths: w,
        equal: Math.max.apply(null, w) - Math.min.apply(null, w) <= 1,
        fillsRow: Math.round(row.right - ps[ps.length - 1].right) <= 1,
        breakBeforeLimits: Math.round(ps[4].left - ps[3].right) >= 8,
        scrolls: document.querySelector('.mpills').scrollWidth >
          document.querySelector('.mpills').clientWidth + 1 };
    });
    t.ok('the four macro pills share the row equally and reach its far edge',
      laid.n === 6 && laid.equal && laid.fillsRow, JSON.stringify(laid));
    t.ok('with a break before fibre and salt, and no sideways scroll on a 375 phone',
      laid.breakBeforeLimits && !laid.scrolls, JSON.stringify(laid));
    await ph.setViewportSize({ width: 390, height: 720 });
    await ph.waitForTimeout(200);
    t.ok('and each pill is filled to the same point as the bar it stands for',
      await ph.evaluate(() => {
        const pct = (el) => {
          const m = (el.getAttribute('style') || '').match(/0 ([\d.]+)%/);
          return m ? parseFloat(m[1]) : null;
        };
        const pills = [...document.querySelectorAll('.mpill')];
        const rows = [...document.querySelectorAll('[data-macro]')];
        const okMacro = rows.every((r, i) =>
          pct(pills[i]) !== null && Math.abs(pct(pills[i]) - Number(r.dataset.planned)) <= 1);
        /* The two limit pills are checked against the caps themselves,
           because the rows that used to carry a denominator only appear when
           one of them is off — and a comparison against an absent row is a
           comparison that always holds. The sodium ceiling is fixed; the
           fibre floor is 14 g per 1000 kcal of the day's own target, which
           the headline prints. */
        const tK = Number((document.querySelector('.mhead .mb-num').textContent
          .match(/\/\s*([\d,]+)/) || [0, 0])[1].replace(/,/g, ''));
        const CAP = { 4: Math.round(tK * 14 / 1000), 5: 2300 };
        const okLim = [4, 5].every((i) => {
          const got = Number((pills[i].textContent.match(/[\d,]+/) || ['0'])[0].replace(/,/g, ''));
          const want = Math.min(100, 100 * got / CAP[i]);
          return CAP[i] > 0 && pct(pills[i]) !== null && Math.abs(pct(pills[i]) - want) <= 1;
        });
        return okMacro && rows.length === 4 && okLim;
      }),
      await ph.evaluate(() => [...document.querySelectorAll('.mpill')]
        .map((x) => x.textContent.trim() + ((x.getAttribute('style') || '').match(/0 [\d.]+%/) || [''])[0])
        .join(' | ')));
    /* Folding must not change what the day is said to be: a pill filled green
       above a bar coloured red would be two opinions of one number. */
    t.ok('and wears the same verdict, so folding says nothing new',
      await ph.evaluate(() => {
        const tone = (el) => ((el.getAttribute('style') || '').match(/--dial-(\w+)-pale|--mlim-(\w+)-pale/) || [])[0] || '';
        const pills = [...document.querySelectorAll('.mpill')];
        const rows = [...document.querySelectorAll('[data-macro]')];
        return rows.every((r, i) => tone(pills[i]).indexOf(r.dataset.state) >= 0);
      }),
      await ph.evaluate(() => [...document.querySelectorAll('[data-macro]')]
        .map((r, i) => r.dataset.state + '/' +
          (((document.querySelectorAll('.mpill')[i].getAttribute('style') || '')
            .match(/--[\w-]+-pale/) || [''])[0])).join(' | ')));
    const stickH = await ph.evaluate(() => document.querySelector('.mday-stick').getBoundingClientRect().height);
    /* The fold is a scroll effect and nothing else: the page must be exactly
       as tall after it as before, and the plates must stay where they were.
       The first version took the hidden bars' height out of the flow, so
       every plate jumped up ~140px in one frame — the "flash" Blake saw
       right before the collapse. */
    const pageBefore = await ph.evaluate(() => document.documentElement.scrollHeight);
    const railAtTop = await ph.evaluate(() => document.querySelector('.mday-rail').getBoundingClientRect().top);
    const foldAt = Math.ceil(stickH) + 100;
    // where the rail lands if the scroll moves it and nothing else does
    const railBefore = railAtTop - foldAt;
    await ph.evaluate((y) => window.scrollTo(0, y), foldAt);
    await ph.waitForTimeout(250);
    t.ok('scrolling into the day folds the readout to one row of pills',
      await ph.evaluate(() => {
        const st = document.querySelector('.mday-stick');
        return st.classList.contains('shrunk') &&
          getComputedStyle(document.querySelector('.mpills')).opacity === '1' &&
          getComputedStyle(document.querySelector('.mbars')).opacity === '0' &&
          getComputedStyle(document.querySelector('.mweek')).visibility === 'hidden';
      }), await ph.evaluate(() => document.querySelector('.mday-stick').className + ' y=' + window.scrollY));
    const shrunkH = await ph.evaluate(() => document.querySelector('.mday-stick').getBoundingClientRect().height);
    t.ok('and the folded readout is well under half the height of the open one',
      shrunkH < stickH / 2, 'open ' + Math.round(stickH) + 'px, folded ' + Math.round(shrunkH) + 'px');
    t.ok('folding moves nothing: same scroll position, same page height, plates where they were',
      await ph.evaluate((args) => {
        const rail = document.querySelector('.mday-rail').getBoundingClientRect().top;
        return window.scrollY === args.y &&
          document.documentElement.scrollHeight === args.page &&
          Math.abs(rail - args.rail) < 1;
      }, { y: foldAt, page: pageBefore, rail: railBefore }),
      await ph.evaluate((args) => 'y=' + window.scrollY + '/' + args.y + ' page=' +
        document.documentElement.scrollHeight + '/' + args.page + ' rail=' +
        Math.round(document.querySelector('.mday-rail').getBoundingClientRect().top) + '/' + Math.round(args.rail),
      { y: foldAt, page: pageBefore, rail: railBefore }));
    t.ok('the fold still fits on one line — pills never wrap',
      await ph.evaluate(() => {
        const tops = [...document.querySelectorAll('.mpill')].map((x) => Math.round(x.getBoundingClientRect().top));
        return new Set(tops).size === 1;
      }));
    /* The row may scroll sideways as a last resort, but a clipped sixth pill
       reads as a bug, so on the narrowest phone in the house (375) the six
       must fit edge to edge on a wide day — Blake's own example figures, which
       are about as long as the six numbers get. */
    /* Measured on a real 375 viewport now. The old proxy — the pills' span
       against "this row minus 15px" on a 390 page — assumed the pills keep
       their natural width, and since the four macro pills share the row
       they always span all of it. The honest check is the narrow phone
       itself: no sideways scroll, and the last pill inside the row. */
    await ph.setViewportSize({ width: 375, height: 720 });
    await ph.waitForTimeout(200);
    t.ok('and all six fit a 375-wide phone even on a day of three-digit deltas',
      await ph.evaluate(() => {
        const row = document.querySelector('.mpills');
        const vals = ['+159', '-24', '+12', '+37', '8', '1474'];
        row.querySelectorAll('.mpill b').forEach((el, i) => { el.textContent = vals[i]; });
        const ps = row.querySelectorAll('.mpill');
        return row.scrollWidth <= row.clientWidth + 1 &&
          ps[ps.length - 1].getBoundingClientRect().right <= row.getBoundingClientRect().right + 1;
      }), await ph.evaluate(() => {
        const row = document.querySelector('.mpills');
        return 'row scrolls ' + row.scrollWidth + 'px of ' + row.clientWidth + 'px';
      }));
    await ph.setViewportSize({ width: 390, height: 720 });
    await ph.waitForTimeout(200);
    /* Half-way down, the card is half shut: both halves of the readout on
       screen at once, one fading out as the other fades in. This is the
       whole point of the change — the old fold had no state between open
       and shut, so there was nothing here to see. */
    const half = await ph.evaluate((args) => {
      window.scrollTo(0, args.span / 2);
      return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => {
        const st = document.querySelector('.mday-stick');
        ok({
          p: parseFloat(st.style.getPropertyValue('--fold') || 0),
          card: st.getBoundingClientRect().height,
          bars: parseFloat(getComputedStyle(document.querySelector('.mbars')).opacity),
          pills: parseFloat(getComputedStyle(document.querySelector('.mpills')).opacity),
          shrunk: st.classList.contains('shrunk')
        });
      })));
    }, { span: await ph.evaluate(() => {
      const f = document.getElementById('macroFold');
      return f.scrollHeight - document.getElementById('macroPills').offsetHeight;
    }) });
    /* The halves take turns now rather than crossing (2026-09-27): with the
       ring the open header is dense, and the pills fading in over it at the
       same time was a smudge in Blake's screenshot. Half-way, the open half
       is still going and the pills have not started. */
    t.ok('half-way down the card is half shut, the open readout fading and the pills not yet in',
      half.p > 0.3 && half.p < 0.7 && !half.shrunk &&
        half.bars > 0 && half.bars < 0.6 && half.pills === 0 &&
        half.card > shrunkH && half.card < stickH,
      JSON.stringify({ p: +half.p.toFixed(2), card: Math.round(half.card),
        bars: +half.bars.toFixed(2), pills: +half.pills.toFixed(2) }));
    /* No threshold means no hysteresis to get wrong: a scroll position gives
       the same card whichever direction you reached it from. The old fold
       needed two lines precisely because this was not true of it. */
    const fromAbove = await ph.evaluate((y) => {
      window.scrollTo(0, 900);
      return new Promise((ok) => setTimeout(() => {
        window.scrollTo(0, y);
        requestAnimationFrame(() => requestAnimationFrame(() =>
          ok(document.querySelector('.mday-stick').getBoundingClientRect().height)));
      }, 120));
    }, Math.round(await ph.evaluate(() => {
      const f = document.getElementById('macroFold');
      return (f.scrollHeight - document.getElementById('macroPills').offsetHeight) / 2;
    })));
    t.ok('and the same scroll position gives the same card from either direction',
      Math.abs(fromAbove - half.card) < 1,
      'coming down ' + Math.round(half.card) + 'px, coming back up ' + Math.round(fromAbove) + 'px');
    /* The failure mode of a fold that runs every frame is not a flash, it is
       a creep: if the margin gives back a pixel less than the card takes out,
       the page shortens a little on every frame and the plates crawl under
       the finger. Watch every frame of a slow scroll, not just the ends. */
    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(250);
    await ph.evaluate(() => {
      const rail = document.querySelector('.mday-rail');
      const railPage = () => rail.getBoundingClientRect().top + (window.scrollY || 0);
      window.__w = { page: document.documentElement.scrollHeight, rail: railPage(), worst: 0, stop: false };
      const tick = () => {
        if (window.__w.stop) return;
        window.__w.worst = Math.max(window.__w.worst,
          Math.abs(document.documentElement.scrollHeight - window.__w.page),
          Math.abs(railPage() - window.__w.rail));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await ph.mouse.move(200, 500);
    for (let i = 0; i < 14; i++) { await ph.mouse.wheel(0, 20); await ph.waitForTimeout(35); }
    await ph.waitForTimeout(200);
    const window_innerHeightGuess = 720;   // the viewport this page was opened at
    const creep = await ph.evaluate(() => { window.__w.stop = true; return window.__w.worst; });
    t.ok('and no frame of the fold moves the page or the plates by so much as a pixel',
      creep < 1, 'worst drift seen mid-fold: ' + creep.toFixed(1) + 'px');

    /* A phone resizes while you scroll — iOS collapses the URL bar and the
       viewport loses forty pixels mid-gesture, over and over. That used to
       re-measure the room under the card, and the card is position:sticky:
       once the page has scrolled it is pinned to the top of the screen and
       nowhere near its place in the flow, so "the distance down to the next
       card" stopped being a margin and became most of the page. Each wrong
       reading went into a margin that made the next one wronger — twelve
       pixels became two thousand in two resizes, and My Day turned into
       blank paper below the plates. */
    await ph.evaluate(() => window.scrollTo(0, 260));
    await ph.waitForTimeout(250);
    const beforeR = await ph.evaluate(() => ({
      page: document.documentElement.scrollHeight,
      margin: parseFloat(document.querySelector('.mday-stick').style.marginBottom) || 0
    }));
    for (let i = 0; i < 3; i++) {
      await ph.setViewportSize({ width: 390, height: 680 });
      await ph.waitForTimeout(180);
      await ph.setViewportSize({ width: 390, height: 720 });
      await ph.waitForTimeout(180);
    }
    const afterR = await ph.evaluate(() => {
      const st = document.querySelector('.mday-stick');
      const r = st.getBoundingClientRect();
      return {
        page: document.documentElement.scrollHeight,
        margin: parseFloat(st.style.marginBottom) || 0,
        cardOnScreen: r.bottom > 0 && r.top < window.innerHeight,
        platesOnScreen: [...document.querySelectorAll('#macroSlots .mtray')]
          .filter((e) => { const q = e.getBoundingClientRect(); return q.bottom > 0 && q.top < window.innerHeight; }).length
      };
    });
    t.ok('resizing while scrolled — a phone hiding its URL bar — leaves the page where it was',
      afterR.page === beforeR.page && Math.abs(afterR.margin - beforeR.margin) < 1,
      'page ' + beforeR.page + ' → ' + afterR.page +
      ', margin ' + Math.round(beforeR.margin) + ' → ' + Math.round(afterR.margin));
    t.ok('and the day is still on the screen rather than above a field of margin',
      afterR.cardOnScreen && afterR.platesOnScreen > 0,
      'card on screen: ' + afterR.cardOnScreen + ', plates on screen: ' + afterR.platesOnScreen);
    /* The room under the card is two margins in the stylesheet, and a margin
       is small. Anything else means it has been measured off the page again. */
    t.ok('and the room the fold hands back is still the size of a margin',
      afterR.margin > 0 && afterR.margin < 400, afterR.margin + 'px');

    /* Twice now My Day has gone blank on a phone, and both times it looked
       identical from the outside: the day scrolled off the top of a screenful
       of empty paper. Both times the cause was a number that had no business
       being believed going into the card's bottom margin.
     *
       So this stops testing the causes and tests the consequence. Make the
       fold measure something absurd — a card three thousand pixels tall,
       which is what a bad reading looks like — and the fold must decline to
       fold at all rather than hand back three thousand pixels of margin. One
       frame unfolded is the price; the tab is what the alternative costs. */
    await ph.evaluate(() => {
      const st = document.createElement('style');
      st.id = 'absurd';
      st.textContent = '#macroFold { min-height: 3000px; }';
      document.head.appendChild(st);
    });
    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(250);
    const sane = await ph.evaluate(() => document.documentElement.scrollHeight);
    /* The card is measured once and remembered, so the absurd size has to be
       forced into a fresh reading — a resize is what throws the old one away,
       and a resize is also exactly when a phone takes a bad one. */
    await ph.evaluate(() => window.dispatchEvent(new Event('resize')));
    await ph.waitForTimeout(200);
    await ph.evaluate(() => window.scrollTo(0, 500));
    await ph.waitForTimeout(350);
    const absurd = await ph.evaluate(() => {
      const st = document.querySelector('.mday-stick');
      const items = [...document.querySelectorAll('#macroSlots .mtray')];
      return {
        margin: parseFloat(st.style.marginBottom) || 0,
        page: document.documentElement.scrollHeight,
        onScreen: items.filter((e) => {
          const r = e.getBoundingClientRect();
          return r.bottom > 0 && r.top < window.innerHeight;
        }).length
      };
    });
    t.ok('a fold that measures something absurd refuses to fold at all',
      absurd.margin <= window_innerHeightGuess,
      'margin ' + absurd.margin + 'px');
    t.ok('and the day is still on the screen, which is the whole point',
      absurd.onScreen > 0 || absurd.page <= sane + 3200,
      'plates on screen ' + absurd.onScreen + ', page ' + sane + ' → ' + absurd.page);
    await ph.evaluate(() => {
      const st = document.getElementById('absurd');
      if (st) st.remove();
    });
    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(300);

    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(250);
    t.ok('back at the top the readout opens again',
      await ph.evaluate(() => !document.querySelector('.mday-stick').classList.contains('shrunk')));
    t.ok('and opening hands the room back — page height and rail exactly as at the start',
      await ph.evaluate((args) =>
        document.documentElement.scrollHeight === args.page &&
        Math.abs(document.querySelector('.mday-rail').getBoundingClientRect().top - args.rail) < 1 &&
        document.querySelector('.mday-stick').style.marginBottom === '',
      { page: pageBefore, rail: railAtTop }),
      await ph.evaluate(() => 'page=' + document.documentElement.scrollHeight + ' rail=' +
        Math.round(document.querySelector('.mday-rail').getBoundingClientRect().top) +
        ' margin="' + document.querySelector('.mday-stick').style.marginBottom + '"'));
    /* A slow thumb through the fold, ten pixels a frame, the way it is
       actually met on a phone. One toggle each way, and between any two
       frames the plates move by the scroll step and nothing more. */
    const thumb = await ph.evaluate(() => {
      const st = document.querySelector('.mday-stick');
      window.__toggles = 0;
      new MutationObserver(() => { window.__toggles++; })
        .observe(st, { attributes: true, attributeFilter: ['class'] });
      return st.getBoundingClientRect().height;
    });
    const steps = Math.ceil(thumb / 10) + 12;
    const jumps = [];
    let last = await ph.evaluate(() => document.querySelector('.mday-rail').getBoundingClientRect().top);
    for (let i = 0; i < steps; i++) {
      await ph.mouse.wheel(0, 10);
      await ph.waitForTimeout(40);
      const now = await ph.evaluate(() => document.querySelector('.mday-rail').getBoundingClientRect().top);
      jumps.push(Math.round(last - now));
      last = now;
    }
    const downToggles = await ph.evaluate(() => window.__toggles);
    t.ok('a slow thumb down through the fold folds it once',
      downToggles === 1 && await ph.evaluate(() => document.querySelector('.mday-stick').classList.contains('shrunk')),
      'toggles=' + downToggles + ' y=' + await ph.evaluate(() => window.scrollY));
    t.ok('and no frame on the way moved the plates by more than the thumb did',
      jumps.every((j) => j >= 0 && j <= 12), 'per-step rail moves: ' + jumps.join(' '));
    for (let i = 0; i < steps; i++) {
      await ph.mouse.wheel(0, -10);
      await ph.waitForTimeout(40);
      const now = await ph.evaluate(() => document.querySelector('.mday-rail').getBoundingClientRect().top);
      jumps.push(Math.round(now - last));
      last = now;
    }
    const upToggles = await ph.evaluate(() => window.__toggles);
    t.ok('and back up opens it once, again without a jump',
      upToggles === 2 && jumps.every((j) => j >= 0 && j <= 12) &&
        await ph.evaluate(() => !document.querySelector('.mday-stick').classList.contains('shrunk')),
      'toggles=' + upToggles + ' y=' + await ph.evaluate(() => window.scrollY) + ' moves: ' + jumps.join(' '));
    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(250);
    await ph.evaluate((y) => window.scrollTo(0, y), foldAt);
    await ph.waitForTimeout(250);
    /* The pills answer a tap only when the card is all the way shut — while
       the bars are still on screen they are the thing under the finger. */
    t.ok('the folded pills are what takes the tap, not the bars behind them',
      await ph.evaluate(() => getComputedStyle(document.querySelector('.mpills')).pointerEvents === 'auto' &&
        document.elementFromPoint(60, document.querySelector('.mpills').getBoundingClientRect().top + 10)
          .closest('[data-mpills]') !== null));
    await ph.click('.mpills');
    /* It glides back rather than jumping, so this waits for the scroll to
       arrive instead of assuming it already has. */
    await ph.waitForFunction(() => window.scrollY === 0, null, { timeout: 3000 });
    await ph.waitForTimeout(150);
    t.ok('pressing the pills takes you back to the top, where the readout is open',
      await ph.evaluate(() => window.scrollY === 0 &&
        !document.querySelector('.mday-stick').classList.contains('shrunk')),
      await ph.evaluate(() => 'y=' + window.scrollY + ' ' + document.querySelector('.mday-stick').className));
    /* Leaving the tab must not carry the fold to the next one, and the fold
       waits until the whole open readout has scrolled by — earlier, and the
       pills would sit over a band of nothing the bars had not yet covered. */
    await ph.click('.tab[data-view="browse"]');
    await ph.waitForTimeout(200);
    await ph.evaluate(() => window.scrollTo(0, 320));
    await ph.waitForTimeout(250);
    await ph.click('.tab[data-view="macros"]');
    await ph.waitForTimeout(250);
    await ph.evaluate(() => window.scrollTo(0, 0));
    await ph.waitForTimeout(250);
    t.ok('coming back to My Day at the top finds the readout open',
      await ph.evaluate(() => !document.querySelector('.mday-stick').classList.contains('shrunk')));
    await ph.context().close();

    /* Someone who has asked for less motion gets the switch back rather than
       the glide: the card is open or it is shut, with the two thresholds
       that keep an instant fold from chasing itself. */
    const still = await t.fresh({ viewport: { width: 390, height: 720 }, reducedMotion: 'reduce' });
    await still.click('.tab[data-view="macros"]');
    await still.waitForTimeout(200);
    const stillSpan = await still.evaluate(() => {
      const f = document.getElementById('macroFold');
      return f.scrollHeight - document.getElementById('macroPills').offsetHeight;
    });
    await still.evaluate((y) => window.scrollTo(0, y), Math.round(stillSpan / 2));
    await still.waitForTimeout(250);
    t.ok('asking for less motion trades the glide for the old switch — no half-shut card',
      await still.evaluate(() => {
        const st = document.querySelector('.mday-stick');
        const p = parseFloat(st.style.getPropertyValue('--fold') || 0);
        return p === 0 || p === 1;
      }), await still.evaluate(() => 'fold=' + (document.querySelector('.mday-stick').style.getPropertyValue('--fold') || '0')));
    await still.context().close();

    const wide = await t.fresh();
    await wide.click('.tab[data-view="macros"]');
    await wide.waitForTimeout(200);
    /* The fold runs over exactly the height it takes out of the card, which
       is what keeps the first plate glued to the underside of it the whole
       way down instead of sliding out from behind it. */
    const wideSpan = await wide.evaluate(() => {
      const f = document.getElementById('macroFold');
      return f.scrollHeight - document.getElementById('macroPills').offsetHeight;
    });
    await wide.evaluate(() => window.scrollTo(0, 500));
    await wide.waitForTimeout(250);
    t.ok('a day is fully folded once it has given up its own height to the scroll',
      await wide.evaluate((span) =>
        document.querySelector('.mday-stick').classList.contains('shrunk') === (window.scrollY >= span),
      wideSpan),
      await wide.evaluate((span) => 'y=' + window.scrollY + ' span=' + Math.round(span) + ' ' +
        document.querySelector('.mday-stick').className, wideSpan));
    await wide.context().close();
  },
});
