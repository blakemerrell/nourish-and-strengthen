/* The pantry.
 *
 * The books were written against the storehouse order, and every ingredient
 * records whether the storehouse carried it. That is a fact about a shop, not
 * about a kitchen, and it is baked into the data. The pantry turns it into a
 * default that a household can answer over the top of, so the app is still
 * telling you the truth after you stop shopping there.
 *
 * What is worth asserting is not the list — a list of 114 things renders or it
 * does not — but that changing it actually changes what the app tells you to
 * buy, in all three places that answer that question.
 */

module.exports = {
  name: 'The pantry',
  async run(t) {
    const ctx = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    await p.goto(t.base + 'index.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(700);

    /* What the storehouse carries is step 1's question now, asked with the
       same pills as everything else: on means it carries it. */
    await p.evaluate(() => window.Hive.go('where'));
    await p.waitForTimeout(400);
    /* Every shelf opened, so every food is on screen to be counted. */
    await p.evaluate(() => {
      for (let i = 0; i < 40; i++) {
        const more = [...document.querySelectorAll('#whereBody [data-carrymore]')].find((b) => /^\+/.test(b.textContent));
        if (!more) break;
        more.click();
      }
    });
    await p.waitForTimeout(200);
    const shape = await p.evaluate(() => ({
      shelves: document.querySelectorAll('#whereBody .kit-grp').length,
      kept: document.querySelectorAll('#whereBody [data-carry][aria-pressed="true"]').length,
      gone: document.querySelectorAll('#whereBody [data-carry][aria-pressed="false"]').length,
      boxes: document.querySelectorAll('#whereBody input[type=checkbox]').length,
    }));
    const split = await p.evaluate(() => {
      const P = window.PANTRY, shelves = {};
      let on = 0, off = 0;
      // a dried spice is kept by default too (Blake: spices don't count)
      Object.keys(P).forEach((k) => { shelves[P[k].c] = 1; if (P[k].s || P[k].sp) on++; else off++; });
      return { shelves: Object.keys(shelves).length, on, off };
    });
    t.ok('step 1 opens on the storehouse order, every shelf of it, as pills',
      shape.shelves === split.shelves && shape.kept === split.on,
      JSON.stringify(shape) + ' vs ' + JSON.stringify(split));
    /* The ones the storehouse never carried are not on the shelf, so they sit
       under what is not kept rather than in the list proper.

       Five of them were wrong until a reader made his own breadcrumbs on a
       Sunday. Stocked-ness used to be inferred — an item counted as available
       unless some recipe had named it in its own extras line — so anything
       nobody had thought to annotate looked exactly like a staple, and the
       book quietly claimed you could pick up breadcrumbs with the flour. It is
       declared in pantry-cats.js now, which is why this counts rather than
       remembers. */
    t.ok('with everything it never carried showing as not carried',
      shape.gone === split.off, JSON.stringify(shape) + ' vs ' + split.off + ' off-list');
    // it is a list of what you keep, not a checklist of what to fetch
    t.ok('and it is pills rather than a checklist', shape.boxes === 0, shape.boxes + ' checkboxes');

    // a recipe whose ingredients are all on the standard order
    const dish = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => x.id === 1);
      return { id: r.id, name: r.name };
    });
    const foot = async () => {
      await p.click('.tab[data-view="browse"]'); await p.waitForTimeout(300);
      await p.click('.card'); await p.waitForTimeout(300);
      const s = await p.evaluate(() => {
        const e = document.querySelector('.sheet-extras');
        return e ? e.textContent.trim() : '';
      });
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      return s;
    };
    t.ok('a recipe you have everything for says nothing about shopping',
      (await foot()) === '', dish.name);

    // stop keeping one of its ingredients
    await p.evaluate(() => window.Hive.go('where')); await p.waitForTimeout(300);
    await p.click('#whereBody [data-carry="cottage_cheese"]'); await p.waitForTimeout(400);

    /* One fewer than the storehouse list, whatever that list happens to hold.
       Written as 99 it measured the size of the order rather than the thing it
       is about, which is that removing one item removes exactly one. */
    const onList = await p.evaluate(() =>
      Object.keys(window.PANTRY).filter((k) => window.PANTRY[k].s || window.PANTRY[k].sp).length);
    t.ok('taking something off is counted',
      (await p.textContent('#carryN')) === String(onList - 1),
      await p.textContent('#carryN') + '  (expected ' + (onList - 1) + ')');

    /* The point of the whole feature: the recipe changes its mind. */
    t.ok('and the recipe now says what you would have to go out for',
      /Not on your shelf: Cottage cheese/.test(await foot()), await foot());

    /* And the ingredient itself is tinted, not just named at the foot — that is
       the difference between reading the list and reading a footnote. */
    const tinted = async () => {
      await p.click('.tab[data-view="browse"]'); await p.waitForTimeout(300);
      await p.click('.card'); await p.waitForTimeout(300);
      const rows = await p.evaluate(() => [...document.querySelectorAll('.sheet-ing div')]
        .map((d) => ({ t: d.textContent.trim(), buy: d.classList.contains('ing-buy') })));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      return rows;
    };
    const rows = await tinted();
    t.ok('the ingredient line itself is marked, not only the foot',
      rows.some((r) => r.buy && /cottage cheese/i.test(r.t)), JSON.stringify(rows));
    t.ok('and only that one — what you keep stays plain',
      rows.filter((r) => r.buy).length === 1, JSON.stringify(rows.filter((r) => r.buy)));

    /* The same question, asked of all 266 rather than of one.
     *
     * The two assertions above passed for a year while thirty-one lines across
     * twenty-one recipes were wrong: they check a food taken off the shelf,
     * and the lines that went unmarked were seasonings the storehouse does not
     * carry — paprika, cumin, a sweetener. The foot named them and the line
     * sat in the same colour as the flour above it, because the foot had been
     * taught about flagged seasonings and the line had not.
     *
     * So this asks the invariant instead of an example: whatever the foot of a
     * recipe says you must buy, the lines must mark, and the other way round.
     * Any single example can be true while the rule is broken. */
    const disagree = await p.evaluate(() => {
      const P = window.PANTRY || {};
      const kept = (k) => { const d = P[k]; return window.Store.pantryHas(k, d ? (d.s || !!d.sp) : true); };
      const needs = (it) => {
        if (!it || !it.k) return false;
        if (it.k === 'free') return !!it.x;
        return it.k !== 'water' && !kept(it.k);
      };
      const bad = [];
      window.RECIPES.forEach((r) => {
        const ingp = r.ingp || [], ing = r.ing || [];
        if (ingp.length !== ing.length) { bad.push(r.id + ' lists of different length'); return; }
        const marked = ing.filter((_, ix) => needs(ingp[ix])).length;
        const foot = ingp.filter(needs).length;
        if (marked !== foot) bad.push(r.id + ' marks ' + marked + ' but names ' + foot);
      });
      return bad;
    });
    t.ok('and every recipe marks exactly what its foot says you must buy',
      disagree.length === 0, disagree.slice(0, 8).join('; '));

    /* And the pair of them is anchored to something true.
     *
     * The assertion above checks that the foot and the lines agree, which is
     * the bug it was written for — and on its own it is another example
     * dressed as a rule. Teach both halves that a flagged seasoning needs
     * nothing and they agree perfectly, about nothing: mutating the shared
     * predicate to `return false` for every `free` line left this file green.
     *
     * So one known case is held down. No. 017 lists paprika, the storehouse
     * does not carry it, and the collection has thirty-one lines like it. If
     * the count ever drops to zero the rule has been switched off, however
     * neatly the two halves still agree with each other. */
    await p.click('.tab[data-view="browse"]'); await p.waitForTimeout(250);
    await p.evaluate(() => {
      const el = document.querySelector('[data-open="17"]');
      if (el) el.click();
      else window.RECIPES.length;   // fall through to the assertion, which will say so
    });
    await p.waitForTimeout(400);
    const grounded = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('.sheet-ing div')];
      const pap = rows.find((d) => /paprika/i.test(d.textContent));
      const salt = rows.find((d) => /^salt$/i.test(d.textContent.trim()));
      return {
        opened: rows.length > 0,
        paprikaMarked: !!(pap && pap.classList.contains('ing-buy')),
        saltPlain: !!(salt && !salt.classList.contains('ing-buy')),
        foot: (document.querySelector('.sheet-extras') || {}).textContent || '',
      };
    });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);

    /* Blake, 2026-09-26: dried spices don't count — paprika is not a trip to
       the shop. So No. 017's paprika is assumed on hand: plain on the line and
       not named at the foot. What still has to be bought is held down by the
       lime in No. 310 below, so the rule cannot be switched off unnoticed. */
    t.ok('a dried spice is assumed on hand: not marked on its line',
      grounded.opened && !grounded.paprikaMarked, JSON.stringify(grounded));
    t.ok('and not named at the foot, and the salt beside it stays plain',
      !/paprika/i.test(grounded.foot) && grounded.saltPlain, JSON.stringify(grounded));
    await p.evaluate(() => { const el = document.querySelector('[data-open="310"]');
      if (el) el.click(); else { const b = document.createElement('button'); b.setAttribute('data-open', 310);
        document.getElementById('grid').appendChild(b); b.click(); } });
    await p.waitForTimeout(400);
    const lime = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('.sheet-ing div')];
      const l = rows.find((d) => /\blime\b/i.test(d.textContent));
      return { marked: !!(l && l.classList.contains('ing-buy')), foot: (document.querySelector('.sheet-extras') || {}).textContent || '' };
    });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    t.ok('but a fresh lime the storehouse does not carry is still marked and named',
      lime.marked && /lime/i.test(lime.foot), JSON.stringify(lime));

    // and so does the shopping list
    await p.evaluate(() => window.Store.addToDay(1, 'mon'));
    await p.evaluate(() => window.Hive.go('list')); await p.waitForTimeout(600);
    const list = await p.evaluate(() => {
      const g = [...document.querySelectorAll('.list-group')];
      return g.map((x) => ({
        title: x.querySelector('.list-group-title').textContent.trim(),
        items: [...x.querySelectorAll('.list-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()),
      }));
    });
    const buy = list.find((g) => /^to buy$/i.test(g.title));
    t.ok('the shopping list moves it to what you must buy',
      !!buy && buy.items.some((i) => /Cottage cheese/i.test(i)), JSON.stringify(list));

    /* Seasonings share one food key and are not in the pantry at all. Defaulting
       an unknown key to "missing" put salt and vanilla under things to buy —
       which the storehouse flag never did. */
    t.ok('and seasonings do not fall through onto it',
      !!buy && !buy.items.some((i) => /vanilla|salt|pepper|cinnamon/i.test(i)),
      buy ? buy.items.join(' | ') : 'no buy list');

    // something of your own, which the books have never heard of: typed
    // into On hand's search, and added from there
    await p.evaluate(() => window.Hive.go('pantry')); await p.waitForTimeout(300);
    await p.fill('#kitFind', 'Olive oil');
    await p.waitForTimeout(200);
    await p.click('[data-kitnew]');
    await p.waitForTimeout(300);
    await p.reload(); await p.waitForTimeout(700);
    await p.evaluate(() => window.Hive.go('pantry')); await p.waitForTimeout(400);
    const own = await p.evaluate(() => {
      const g = [...document.querySelectorAll('#view-pantry .kit-grp')].find((x) => (x.querySelector('.kit-gh span') || {}).textContent === 'Yours');
      return { shelf: !!g, oil: !!g && [...g.querySelectorAll('.kit-pill')].some((b) => b.textContent === 'Olive oil' && b.getAttribute('aria-pressed') === 'true') };
    });
    t.ok('what you add yourself gets a shelf and survives a reload', own.shelf && own.oil, JSON.stringify(own));

    /* This assertion is the one whose absence let the bug ship, and the count
       above is the evidence of it. It used to read 101 — one hundred
       storehouse items plus the oil — which is only the right number if the
       "I don't keep cottage cheese" answer above has been forgotten across the
       reload. It had been: LS.pantry and LS.pantryNew were undefined, so both
       saves landed on one localStorage key named "undefined" and the second
       overwrote the first. The suite reloaded, saw the answer gone, and
       asserted the count that proved it.
       100 is the hundred, less the one taken off, plus the one added. */
    t.ok('and so does the answer you gave before it',
      (await p.evaluate(() => window.Store.pantryHas('cottage_cheese', true))) === false,
      await p.evaluate(() => JSON.stringify(window.Store.state.pantry)));
    t.ok('each of which is saved under a name, not under "undefined"',
      await p.evaluate(() => localStorage.getItem('undefined') === null &&
        localStorage.getItem('bsc.pantry') !== null &&
        localStorage.getItem('bsc.pantryNew') !== null),
      await p.evaluate(() => Object.keys(localStorage).sort().join(' ')));

    // and back to the book
    await p.evaluate(() => window.Store.resetPantry());
    await p.waitForTimeout(300);
    await p.click('.tab[data-view="browse"]'); await p.waitForTimeout(300);
    t.ok('resetting puts the storehouse list back', (await foot()) === '');
    t.ok('but keeps what you added yourself',
      await p.evaluate(() => !!window.Store.pantryOwn().own_olive_oil));

    await ctx.close();

    /* The row is 24px of target under a mouse, and revealed by hovering it.
       Neither of those exists on a phone, so both are given back — but the rule
       is about the pointer rather than the width, and a narrow desktop window
       is still a mouse. Which means proving it needs a context that actually
       reports touch, not just a small one. */
    const touch = await t.browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const tp = await touch.newPage();
    await tp.goto(t.base + 'index.html');
    await tp.waitForTimeout(700);
    await tp.evaluate(() => window.Hive.go('pantry')); await tp.waitForTimeout(400);
    const thumb = await tp.evaluate(() => {
      const x = document.querySelector('#view-pantry .kit-pill');
      return { h: x.getBoundingClientRect().height, seen: getComputedStyle(x).opacity };
    });
    t.ok('and on a phone a pill is thumb-sized and needs no hovering',
      thumb.h >= 44 && thumb.seen === '1', JSON.stringify(thumb));
    await touch.close();
  },
};
