/* The shopping list: one line per thing, and the quantities added up.
 *
 * These are the two faults the list had for most of its life — a diced apple
 * and a sliced apple on separate lines, and "1 cup + 1 cup + 2 tbsp" where a
 * total belonged — so they are worth holding onto. */

module.exports = {
  name: 'Shopping list',
  async run(t) {
    const p = await t.fresh();

    // ---- one line per thing ------------------------------------------------
    const all = await p.evaluate(() => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      window.RECIPES.forEach((r, i) => window.Store.addToDay(r.id, days[i % 7]));
      document.querySelector('.tab[data-view="list"]').click();
      return [...document.querySelectorAll('.list-row span:not(.qty)')].map((e) => e.textContent);
    });
    t.ok('every recipe in both books makes one list, not a heap',
      all.length > 100 && all.length < 170, all.length + ' lines');

    const dupes = ['apple', 'chicken breast', 'onion', 'cucumber', 'whey'].map((w) => {
      const hits = all.filter((l) => new RegExp('\\b' + w, 'i').test(l));
      return w + ': ' + hits.join(' / ');
    });
    t.ok('an apple is an apple however it was cut',
      all.filter((l) => /apple/i.test(l)).join() === 'Apples,Applesauce',
      all.filter((l) => /apple/i.test(l)).join(' / '));
    t.ok('but canned chicken is not a chicken breast',
      all.indexOf('Canned chicken') >= 0 && all.indexOf('Chicken breasts') >= 0, dupes[1]);
    t.ok('nothing appears twice, not even across the two headings',
      new Set(all).size === all.length,
      all.filter((x, i) => all.indexOf(x) !== i).join(', '));

    // ---- quantities --------------------------------------------------------
    await p.evaluate(() => {
      window.Store.clearPlan();
      const hits = window.RECIPES.filter((r) => r.ing.some((i) => /cottage cheese/i.test(i))).slice(0, 3);
      hits.forEach((r, i) => window.Store.addToDay(r.id, ['mon', 'tue', 'wed'][i]));
    });
    await p.waitForTimeout(250);
    const cc = await p.evaluate(() => {
      const row = [...document.querySelectorAll('.list-row')]
        .find((r) => /Cottage cheese/.test(r.textContent));
      return row ? row.querySelector('.qty').textContent : '';
    });
    t.ok('three recipes of cottage cheese come to one number',
      /^\d/.test(cc) && cc.indexOf('+') < 0 && /cups?$/.test(cc), cc);

    // ---- what does and does not get a number -------------------------------
    await p.evaluate(() => {
      window.Store.clearPlan();
      // a yeasted bread: flour by the cup, salt by the pinch
      const r = window.RECIPES.find((x) => x.ing.some((i) => /yeast/i.test(i)));
      window.Store.addToDay(r.id, 'mon');
    });
    await p.waitForTimeout(250);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.list-row')].map((r) => ({
      name: r.querySelector('span:not(.qty)').textContent,
      qty: r.querySelector('.qty').textContent,
    })));
    const salt = rows.find((r) => /^Salt$/.test(r.name));
    const flour = rows.find((r) => /Flour/.test(r.name));
    t.ok('staples carry a quantity', flour && /cup/.test(flour.qty), JSON.stringify(flour));
    t.ok('seasonings do not, because nobody shops for two teaspoons of salt',
      !salt || salt.qty === '', JSON.stringify(salt));
    /* An ingredient the recipe itself flagged as an extra, under the right
     * heading.
     *
     * The list decided this with `!inPantry(it.k)` — the shelf alone — while
     * the coloured ingredient line and the "Also needs" foot both used
     * itemNeedsBuying, which reads the recipe's flag first. Two answers to one
     * question, and they disagreed on exactly the case the flag exists for: a
     * line the food table cannot weigh carries the key "free", every seasoning
     * shares it, and the pantry has never heard of "free" so it defaults to
     * kept. Right for salt and vanilla. Wrong for the five grams of creatine
     * in a Crio Bru drink, which came out under "From the storehouse" — the
     * app telling a reader the storehouse stocks creatine.
     *
     * The shared bucket is gone: every seasoning has its own key now, and
     * creatine is declared off the order sheet next to the shelving rather
     * than being rescued by a flag downstream. So this no longer hunts for an
     * extra filed under "free" — there are none — it takes any extra at all,
     * which is what the assertion was ever about. */
    const flagged = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => (x.ingp || []).some((i) => i && i.x));
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      days.forEach((d) => window.Store.day(d).forEach((e) =>
        window.Store.removeFromDay(e.id !== undefined ? e.id : e, d)));
      window.Store.addToDay(r.id, 'mon');
      document.querySelector('.tab[data-view="list"]').click();
      const hit = r.ingp.find((i) => i && i.x) || {};
      const name = ((window.PANTRY || {})[hit.k] || {}).l || hit.a || String(hit.k).replace(/_/g, ' ');
      const groups = [...document.querySelectorAll('.list-group')].map((g) => ({
        title: g.querySelector('.list-group-title').textContent.trim(),
        items: [...g.querySelectorAll('.list-row span:not(.qty)')].map((e) => e.textContent.trim()),
      }));
      return { name: name, groups: groups };
    });
    await p.waitForTimeout(400);
    const stocked = (flagged.groups.find((g) => /storehouse|shelf/i.test(g.title)) || { items: [] }).items;
    const buy = (flagged.groups.find((g) => /^to buy$/i.test(g.title)) || { items: [] }).items;
    const named = new RegExp(flagged.name, 'i');
    t.ok('an ingredient the recipe calls an extra is not filed under the storehouse',
      !stocked.some((x) => named.test(x)) && buy.some((x) => named.test(x)),
      flagged.name + ' — storehouse: ' + JSON.stringify(stocked) + '  buy: ' + JSON.stringify(buy));

    /* A tick survives the item changing heading.
     *
     * The checked key was prefixed with the heading — base| or extra| — so a
     * ticked item's identity depended on where it was filed. Take something
     * off your pantry shelf and every tick against it vanished, because
     * "base|ground beef" and "extra|ground beef" are two things to a checklist
     * and one thing to a person standing in a shop. */
    const survives = await p.evaluate(async () => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      days.forEach((d) => window.Store.day(d).forEach((e) =>
        window.Store.removeFromDay(e.id !== undefined ? e.id : e, d)));
      const r = window.RECIPES.find((x) => (x.ingp || []).some((i) => i && i.k === 'ground_beef'));
      window.Store.addToDay(r.id, 'mon');
      document.querySelector('.tab[data-view="list"]').click();
      await new Promise((ok) => setTimeout(ok, 400));
      const row = [...document.querySelectorAll('.list-row')]
        .find((x) => /ground beef/i.test(x.textContent));
      row.querySelector('input').click();
      await new Promise((ok) => setTimeout(ok, 300));
      window.Store.setPantry('ground_beef', false);
      await new Promise((ok) => setTimeout(ok, 500));
      const after = [...document.querySelectorAll('.list-row')]
        .find((x) => /ground beef/i.test(x.textContent));
      return { moved: after.closest('.list-group').querySelector('.list-group-title').textContent,
        still: after.querySelector('input').checked };
    });
    t.ok('a ticked item stays ticked when it moves to the other heading',
      survives.still, JSON.stringify(survives));

    t.ok('water never appears at all', !rows.some((r) => /^Water$/.test(r.name)),
      rows.map((r) => r.name).join(', '));

    // ---- spoons roll up into cups -----------------------------------------
    const big = await p.evaluate(() => {
      window.Store.clearPlan();
      // enough ranch dressing that tablespoons stop being a sensible unit
      const r = window.RECIPES.find((x) => x.ing.some((i) => /ranch/i.test(i)));
      window.Store.addToDay(r.id, 'mon', 8);
      return null;
    });
    await p.waitForTimeout(250);
    const ranch = await p.evaluate(() => {
      const row = [...document.querySelectorAll('.list-row')].find((r) => /Ranch/.test(r.textContent));
      return row ? row.querySelector('.qty').textContent : '';
    });
    t.ok('a great many tablespoons become cups', /cup/.test(ranch), ranch);

    // ---- storehouse and extras stay apart ---------------------------------
    await p.evaluate(() => {
      window.Store.clearPlan();
      const r = window.RECIPES.find((x) => x.extras);
      window.Store.addToDay(r.id, 'mon');
    });
    await p.waitForTimeout(250);
    const groups = await p.evaluate(() =>
      [...document.querySelectorAll('.list-group-title')].map((e) => e.textContent));
    /* What you must buy comes first, since that is the trip; the storehouse
       pick-up and what is already in the kitchen follow it, apart. */
    t.ok('what you must buy and what comes from pantry staples are separate lists, buying first',
      groups.length >= 2 && /^to buy$/i.test(groups[0]) && groups.slice(1).some((g) => /pantry staples|storehouse/i.test(g)),
      groups.join(' | '));

    // ---- Copy the order: a name, then its amount, with something between -----
    /* The two spans sit flush, so their text ran together on the bishop's
       copy: "Bell peppers6", "Chicken breasts9 ½ lbs". */
    await p.evaluate(() => {
      window.Store.clearPlan();
      window.Store.setOpt('store', true);
      const r = window.RECIPES.find((x) => x.ing.some((i) => /bell pepper/i.test(i)));
      window.Store.addToDay(r.id, 'mon');
      navigator.clipboard.writeText = (s) => { window.__copied = s; return Promise.resolve(); };
    });
    await p.waitForTimeout(250);
    await p.click('[data-copyorder]');
    await p.waitForTimeout(200);
    const copied = await p.evaluate(() => window.__copied || '');
    const orderRows = await p.evaluate(() => [...document.querySelectorAll('.list-group.where-s .list-row')].map((r) => {
      const n = r.querySelector('span:not(.qty)').textContent.trim(), q = r.querySelector('.qty').textContent.trim();
      return q ? n + ' — ' + q : n;
    }));
    t.ok('Copy the order keeps each name and its amount apart ("Bell peppers — 2", never "Bell peppers2")',
      orderRows.length > 0 && copied === orderRows.join('\n') && !/[a-z]\d/.test(copied), JSON.stringify({ copied: copied.slice(0, 160), rows: orderRows.slice(0, 3) }));

    await p.context().close();
  },
};
