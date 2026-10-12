/* The shopping list, by aisle.
 *
 * Blake, 2026-10-12, of the list a week of dinners made — one A-to-Z run
 * with a price and a "BUY ›" tag on every line and the Walmart button under
 * all 21 of them: "Rows too busy... No aisles... Just feels unintuitive". So
 * To buy is in aisles in the order a store is walked, a line is the box, the
 * thing and how much, the spices fold away, where a thing comes from is
 * changed for the whole list under Mark what I have, and the Walmart button
 * rides pinned to the foot of the screen while To buy is on it. */

module.exports = {
  name: 'The list, by aisle',
  async run(t) {
    const setup = async (w, scheme) => {
      const p = await t.fresh({ viewport: { width: w, height: 760 }, colorScheme: scheme });
      await p.clock.setFixedTime(new Date(2026, 9, 12, 9, 0, 0));
      await p.reload();
      await p.waitForTimeout(900);
      // my own shelf, and buy what is missing: everything goes on the Walmart cart
      await p.evaluate(() => window.Hive.go('where'));
      await p.waitForTimeout(300);
      await p.click('[data-srcpick="own"]');
      await p.click('[data-weekbuy="1"]');
      await p.click('[data-stepgo="plan"]');
      await p.waitForTimeout(300);
      await p.click('#planMyWeek');
      await p.waitForTimeout(300);
      await p.click('.pw-go[data-pwsee]');
      await p.click('[data-pwpick="all"]');
      await p.waitForTimeout(600);
      await p.evaluate(() => { const m = document.getElementById('mToast'); if (m) m.hidden = true; window.Hive.go('list'); });
      await p.waitForTimeout(500);
      return p;
    };
    const p = await setup(390, 'light');
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const read = () => p.evaluate(() => {
      const b = document.querySelector('.list-group.where-b');
      const lines = [...b.querySelectorAll('.list-line')];
      const btn = b.querySelector('.wm-bar .wm-btn');
      return {
        aisles: [...b.querySelectorAll('.list-aisle-h span')].map((s) => s.textContent),
        spices: (() => { const d = b.querySelector('details.list-aisle'); return d ? { open: d.open, says: d.querySelector('summary').textContent } : null; })(),
        lines: lines.length,
        bare: lines.every((l) => l.querySelector('input[data-check]') && l.querySelector('.qty') && !l.querySelector('.src-seg, [data-srctag], .list-usd')),
        tall: lines.filter((l) => l.offsetParent).every((l) => l.getBoundingClientRect().height >= 44),
        btn: btn ? btn.textContent : '', cart: btn ? (btn.getAttribute('href').match(/items=([^&]*)/) || [])[1].split(',').length : 0,
        // what is bought: cooked rice goes in as the dry rice it is made from, so two lines can be one product
        bought: new Set(lines.map((l) => { const k = l.querySelector('input[data-check]').dataset.check, d = (window.PANTRY || {})[k]; return d && d.wa ? d.wa[0] : k; })).size,
        // and what has no product to put in, named under the list to find yourself (or where it is bought instead)
        named: b.querySelectorAll('.wm > .wm-sub a').length,
        head: document.getElementById('listCount').textContent,
      };
    });

    let s = await read();
    const order = ['Produce', 'Meat', 'Dairy & eggs', 'Bread', 'Canned', 'Rice, beans & pasta', 'Baking', 'Sauces & condiments', 'Drinks & treats', 'Other', 'Spices'];
    t.ok('to buy is in aisles, in the order a store is walked', s.aisles.length >= 3 &&
      s.aisles.every((a, i) => order.indexOf(a) >= 0 && (i === 0 || order.indexOf(a) > order.indexOf(s.aisles[i - 1]))), JSON.stringify(s.aisles));
    t.ok('the spices come last, folded, saying you may have these', !!s.spices && !s.spices.open && /^Spices/.test(s.spices.says) && /you may have these/.test(s.spices.says),
      JSON.stringify(s.spices));
    t.ok('a line is the box, the thing and how much: no price, no tag, no switch, and a thumb tall', s.lines > 5 && s.bare && s.tall, JSON.stringify(s));
    t.ok('the Walmart button counts the products it puts in, one for each thing bought, and the rest are named to find yourself',
      Number((s.btn.match(/^Add (\d+) items? to Walmart cart$/) || [])[1]) === s.cart && s.cart > 0 && s.cart + s.named === s.bought,
      JSON.stringify({ btn: s.btn, cart: s.cart, bought: s.bought, named: s.named, lines: s.lines }));

    /* Pinned: on the first screen, before any scrolling, the button sits on
       the foot of the screen, inside the To buy box. */
    const pin = await p.evaluate(() => {
      window.scrollTo(0, 0);
      const bar = document.querySelector('.list-group.where-b > .wm-bar');
      const r = bar.getBoundingClientRect(), last = [...document.querySelectorAll('.where-b .list-line')].pop().getBoundingClientRect();
      return { bottom: Math.round(r.bottom), vh: innerHeight, lastBelow: last.top > innerHeight };
    });
    t.ok('the Walmart button is pinned to the foot of the screen while the list goes on below it',
      pin.lastBelow && Math.abs(pin.bottom - pin.vh) <= 1, JSON.stringify(pin));

    /* Mark what I have: the switch on every line, one tap to Have, and the
       line leaves To buy and the cart. */
    await p.click('[data-listmark="1"]');
    await p.waitForTimeout(250);
    const marking = await p.evaluate(() => ({
      tools: (document.querySelector('.list-tools.list-marking') || {}).textContent || '',
      seg: [...document.querySelectorAll('.where-b .list-line')].every((l) => l.querySelector('.src-seg')),
      labels: [...document.querySelectorAll('.where-b .src-seg')][0] ? [...[...document.querySelectorAll('.where-b .src-seg')][0].querySelectorAll('button')].map((b) => b.textContent).join() : '',
      boxes: [...document.querySelectorAll('.where-b .list-row input')].filter((i) => i.offsetParent).length,
    }));
    t.ok('Mark what I have puts Have · Buy on every line, says what to do, and puts the boxes away',
      /Tap Have on anything already in your kitchen/.test(marking.tools) && marking.seg && marking.labels === 'Have,Buy' && marking.boxes === 0, JSON.stringify(marking));
    /* A line that is its own product in the cart (not cooked rice, and not
       something another line is bought as), so Have takes exactly one out. */
    const k = await p.evaluate(() => {
      const P = window.PANTRY, keys = [...document.querySelectorAll('.where-b [data-src][data-v="h"]')].map((b) => b.dataset.src);
      const as = keys.map((x) => P[x] && P[x].wa && P[x].wa[0]).filter(Boolean);
      return keys.find((x) => P[x] && P[x].wm && !P[x].wa && !P[x].we && as.indexOf(x) < 0);
    });
    await p.click('.where-b [data-src="' + k + '"][data-v="h"]');
    await p.waitForTimeout(250);
    const after = await read();
    const kept = await p.evaluate((k) => ({ kit: window.Store.kitchen(k), fold: !!document.querySelector('.list-fold [data-src="' + k + '"]') }), k);
    t.ok('Have takes the line off To buy and out of the cart, into Already in your kitchen',
      after.lines === s.lines - 1 && after.cart === s.cart - 1 && kept.kit === 1 && kept.fold, JSON.stringify({ was: s.lines, now: after.lines, cart: after.cart, kept }));
    await p.click('.list-fold [data-src="' + k + '"][data-v="b"]');
    await p.click('[data-listmark="0"]');
    await p.waitForTimeout(250);
    s = await read();
    t.ok('Buy puts it back, and Done returns the list to boxes', s.lines === after.lines + 1 && s.bare, JSON.stringify(s));

    /* 320 px, dark: nothing sideways, and the button on one line. */
    const q = await setup(320, 'dark');
    const narrow = await q.evaluate(() => {
      const btn = document.querySelector('.wm-bar .wm-btn').getBoundingClientRect();
      return { page: document.documentElement.scrollWidth <= innerWidth, btnH: Math.round(btn.height),
        rows: [...document.querySelectorAll('.where-b .list-line')].every((l) => l.scrollWidth <= l.clientWidth + 1) };
    });
    t.ok('at 320 px nothing runs off the side, and the Walmart button keeps to one line', narrow.page && narrow.rows && narrow.btnH <= 52, JSON.stringify(narrow));
    await q.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
