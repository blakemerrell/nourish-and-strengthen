/* Staples: the storehouse, for anybody.
 *
 * Blake: "how do I reframe the storehouse to be generic worldwide... staple
 * pantry and freezer foods?" The foods that keep are the staples; where they
 * come from is a choice: the bishops' storehouse, a food bank or pantry, a big
 * monthly shop, or nothing but your own shelf. The list a source carries, the
 * half of the shopping list that comes from it and the middle of Have /
 * Storehouse / Buy work the same for each, under its own name. A household
 * that never chose is the storehouse, word for word as before — the ward's
 * edition does not change, and neither do the printed books. */
module.exports = {
  name: 'Staples, from any source',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.setFixedTime(new Date(2026, 9, 1, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(800);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    /* Three dinners off the storehouse order, Thursday to Saturday. */
    await p.evaluate(() => {
      window.Store.setOpt('setup', true);
      const din = window.RECIPES.filter((r) => /^(Salsa Chicken & Bean Bowls|Taco Pasta Skillet|Chicken & Broccoli Rice Skillet)$/.test(r.name));
      ['thu', 'fri', 'sat'].forEach((d, i) => window.Store.addToDay(din[i].id, d, 1));
    });

    const step1 = async () => {
      await p.click('.tab[data-view="plan"]');
      await p.evaluate(() => window.Hive.go('where'));
      await p.waitForTimeout(250);
      return p.evaluate(() => ({
        h: (document.querySelector('#whereBody .step-h') || {}).textContent,
        picks: [...document.querySelectorAll('[data-srcpick]')].map((b) => b.dataset.srcpick + ':' + b.getAttribute('aria-pressed')),
        week: [...document.querySelectorAll('[data-weekbuy]')].map((b) => b.querySelector('b').textContent + ':' + b.getAttribute('aria-pressed')),
        carries: (document.querySelector('#whereBody .step-sec .step-h2') || {}).textContent || '',
        find: (document.getElementById('carryFind') || {}).getAttribute ? document.getElementById('carryFind').getAttribute('aria-label') : '',
      }));
    };
    const shop = async () => {
      await p.evaluate(() => window.Hive.go('list'));
      await p.waitForTimeout(300);
      // the Have / source / Buy switch is on every line under Mark what I have
      await p.evaluate(() => { const b = document.querySelector('#view-list [data-listmark="1"]'); if (b) b.click(); });
      await p.waitForTimeout(200);
      return p.evaluate(() => ({
        groups: [...document.querySelectorAll('#view-list .list-group-title')].map((g) => g.textContent),
        count: document.getElementById('listCount').textContent,
        copy: (document.querySelector('[data-copyorder]') || {}).textContent || '',
        seg: [...((document.querySelector('#view-list .src-seg') || {}).querySelectorAll ? document.querySelector('#view-list .src-seg').querySelectorAll('button') : [])].map((b) => b.textContent),
      }));
    };

    /* ---- out of the box: the storehouse, as it always was ---- */
    let s = await step1();
    t.ok('step 1 asks where your staples come from, the storehouse chosen until somebody says otherwise',
      s.h === 'Where do your staples come from?' && s.picks.join() === 'sh:true,fb:false,big:false,own:false', JSON.stringify(s));
    t.ok('and this week: buy what is missing, or only what I have',
      s.week.join() === 'Buy what’s missing:true,Only what I have:false', JSON.stringify(s.week));
    t.ok('what the storehouse carries is its list, as before', s.carries === 'What your storehouse carries', s.carries);
    let l = await shop();
    t.ok('the storehouse list is word for word the ward’s: Storehouse order, Copy the order, Have · Storehouse · Buy',
      l.groups.includes('Storehouse order') && /from the storehouse/.test(l.count) && l.copy === 'Copy the order' &&
      l.seg.join() === 'Have,Storehouse,Buy', JSON.stringify(l));

    /* ---- a food bank ---- */
    await p.evaluate(() => window.Hive.go('where'));
    await p.click('[data-srcpick="fb"]');
    await p.waitForTimeout(250);
    s = await step1();
    const opts = await p.evaluate(() => ({ store: window.Store.opt('store', true), fb: window.Store.opt('fb', false), big: window.Store.opt('big', false), kind: window.__src.kind() }));
    t.ok('choosing a food bank is two household switches the rules already allow',
      opts.store && opts.fb && !opts.big && opts.kind === 'fb' && s.picks.join() === 'sh:false,fb:true,big:false,own:false', JSON.stringify(opts));
    t.ok('and what it carries is called what it is', s.carries === 'What your food bank carries' && s.find === 'Find a food the food bank carries', JSON.stringify(s));
    await p.evaluate(() => window.Hive.go('pantry'));
    await p.waitForTimeout(250);
    const legend = await p.evaluate(() => document.getElementById('kitNote').textContent);
    t.ok('On hand says the dashed edge is one the food bank doesn’t carry', /one the food bank doesn’t carry/.test(legend), legend);
    l = await shop();
    t.ok('the list: From the food bank, Copy the list, Have · Food bank · Buy',
      l.groups.includes('From the food bank') && /from the food bank/.test(l.count) && l.copy === 'Copy the list' &&
      l.seg.join() === 'Have,Food bank,Buy' && !l.groups.includes('Storehouse order'), JSON.stringify(l));

    /* ---- a big monthly shop ---- */
    await p.evaluate(() => window.Hive.go('where'));
    await p.click('[data-srcpick="big"]');
    await p.waitForTimeout(250);
    l = await shop();
    t.ok('a big shop: The big shop, Have · Big shop · Buy', l.groups.includes('The big shop') && l.seg.join() === 'Have,Big shop,Buy', JSON.stringify(l));

    /* ---- nothing but your own shelf ---- */
    await p.evaluate(() => window.Hive.go('where'));
    await p.click('[data-srcpick="own"]');
    await p.waitForTimeout(250);
    s = await step1();
    t.ok('I keep my own: no list of what a source carries', !s.carries && s.picks.join() === 'sh:false,fb:false,big:false,own:true', JSON.stringify(s));
    /* Recipes with nothing but a shelf, and nothing ticked on it yet. The
       filter said "Just my staples" and answered "0 recipes · Nothing
       matches those filters", which reads as a broken filter. */
    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(250);
    const pick = (v) => p.evaluate((v) => { const el = document.getElementById('pantrySel'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
    await pick('base');
    await p.waitForTimeout(250);
    const shelf = await p.evaluate(() => ({
      filter: [...document.querySelectorAll('#pantrySel option')].map((o) => o.textContent).join('|'),
      count: document.getElementById('browseCount').textContent,
      empty: document.getElementById('browseEmpty').textContent,
      shown: !document.getElementById('browseEmpty').classList.contains('hide'),
    }));
    t.ok('I keep my own: Recipes’ filter is worded for your shelf, and with nothing on it says where to tick what you keep',
      shelf.filter === 'Everything|Only what\'s on my shelf|Needs a shop' && /^0 recipes/.test(shelf.count) && shelf.shown &&
      shelf.empty === 'Nothing on your shelf yet — tick what you keep on hand, under Share › Your kitchen', JSON.stringify(shelf));
    await pick('all');
    await p.waitForTimeout(200);
    l = await shop();
    t.ok('and every food is just Have · Buy, with nothing from a source', l.seg.join() === 'Have,Buy' && l.groups.every((g) => /To buy|Needs a store|In your kitchen/.test(g)) && !/from the/.test(l.count), JSON.stringify(l));
    await p.evaluate(() => window.Hive.go('where'));
    await p.click('[data-weekbuy="0"]');
    await p.waitForTimeout(250);
    const only = await p.evaluate(() => {
      const a = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: false, avoid: [], ing: [], rec: 0, shelf: true };
      const pool = window.__pw.pool(a, false);
      return { buy: window.Store.opt('buy', true), mode: window.__flow.mode(), bad: pool.filter((r) => window.__flow.needs(r) > 0).length, near: !!document.querySelector('[data-near]') };
    });
    t.ok('only what I have, with no source: every suggestion is made from the shelf alone, and the one-or-two allowance is offered',
      !only.buy && only.bad === 0 && only.near, JSON.stringify(only));
    await p.click('[data-weekbuy="1"]');
    await p.click('[data-srcpick="sh"]');
    await p.waitForTimeout(250);
    l = await shop();
    t.ok('back to the storehouse, the ward’s words come back with it', l.groups.includes('Storehouse order') && l.copy === 'Copy the order', JSON.stringify(l));

    /* ---- Recipes says staples; the printed books keep the storehouse ---- */
    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(300);
    const rec = await p.evaluate(() => ({
      blurb: document.getElementById('browseBlurb').textContent,
      filter: [...document.querySelectorAll('#pantrySel option')].map((o) => o.textContent).join('|'),
      book: window.__secNote['2-9'],
    }));
    t.ok('the collection is built on staples that keep', /staples that keep/.test(rec.blurb) && !/storehouse/i.test(rec.blurb), rec.blurb);
    t.ok('the filter says Just my staples', rec.filter === 'Everything|Just my staples|Needs a shop', rec.filter);
    t.ok('and the printed books keep their storehouse words', /storehouse/.test(rec.book), rec.book);

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
