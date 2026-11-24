/* Searching, and reading a recipe by weight.
 *
 * Both of these came from cooking with the app on a phone rather than from
 * looking at the code, which is why neither was caught earlier: searching
 * "breakfast" returned fifty recipes of which seven were breakfasts, and the
 * section picker said "Run and Not Be Weary" four times and "Around the Table"
 * eight before it said anything you were reading it for.
 */

module.exports = {
  name: 'Searching and units',
  async run(t) {
    const ctx = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    await p.goto(t.base + 'index.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(700);
    await p.click('.tab[data-view="browse"]');   // the app opens on Today; searching is Recipes'
    await p.waitForTimeout(200);

    /* ---- the section picker ------------------------------------------- */
    const groups = await p.evaluate(() =>
      [...document.querySelectorAll('#secSel optgroup')].map((g) => g.label));
    t.ok('the section picker names each volume once, as a group',
      groups.length === 2 && groups[0] === 'Run and Not Be Weary', groups.join(' | '));

    const repeats = await p.evaluate(() =>
      [...document.querySelectorAll('#secSel option')].filter((o) => /Run and Not|Around the Table/.test(o.textContent)).length);
    t.ok('and no option repeats the volume name inside itself', repeats === 0, repeats + ' do');

    /* A native picker on a phone wraps a long option onto a second line, and
       twelve two-line options is a wall rather than a list. The full names run
       to 43 characters — they are written for a printed contents page — so the
       picker uses short ones. 22 is about what fits on one line at 390px. */
    const longest = await p.evaluate(() => {
      const o = [...document.querySelectorAll('#secSel option')]
        .map((x) => x.textContent).sort((a, b) => b.length - a.length);
      return { text: o[0], len: o[0].length };
    });
    t.ok('and every one fits on a single line on a phone',
      longest.len <= 22, longest.len + ' chars: ' + longest.text);

    /* ---- ranking -------------------------------------------------------- */
    await p.fill('#search', 'breakfast');
    await p.waitForTimeout(400);

    const named = await p.evaluate(() => {
      const names = [...document.querySelectorAll('.card-name')].map((n) => n.textContent.toLowerCase());
      const hits = names.map((n, i) => (n.includes('breakfast') ? i : -1)).filter((i) => i >= 0);
      return { total: names.length, hits: hits.length, last: hits[hits.length - 1] };
    });
    /* The seven recipes actually named for a breakfast come first, before the
       forty-three that are only in a section called one. Anything else and the
       reader is scrolling a list of fifty looking for the mistake. */
    t.ok('recipes named for the search come before ones only in a matching section',
      named.hits > 0 && named.last === named.hits - 1, JSON.stringify(named));

    const count = await p.textContent('#browseCount');
    t.ok('and the count says why the rest are there',
      /\d+ matching, \d+ more from sections named for it/.test(count), count);

    /* An explicit sort is the reader's decision and outranks relevance. */
    await p.click('#filtBtn');
    await p.waitForTimeout(80);
    await p.selectOption('#sortSel', 'protein');
    await p.waitForTimeout(400);
    const byProtein = await p.evaluate(() =>
      [...document.querySelectorAll('.card')].slice(0, 6).map((c) => c.dataset.open));
    const proteins = await p.evaluate((ids) =>
      ids.map((id) => (window.RECIPES.find((r) => String(r.id) === id).macro || {}).p || 0), byProtein);
    t.ok('but a sort you chose on purpose still wins',
      proteins.every((v, i) => i === 0 || v <= proteins[i - 1]), proteins.join(' '));

    await p.selectOption('#sortSel', 'book');
    await p.click('#filtersDone');
    await p.fill('#search', '');
    await p.waitForTimeout(400);

    /* ---- cups and grams ------------------------------------------------- */
    if (await p.$('.chap-card')) { await p.click('.chap-card >> nth=0'); await p.waitForTimeout(150); }
    await p.click('.card');
    await p.waitForTimeout(350);

    /* It has to look like a choice. Showing only the unit in force made it a
       label — nothing said another state existed, so it went unpressed. Both
       halves present, exactly one pressed, and a target a thumb can hit. */
    const seg = await p.evaluate(() => {
      const b = [...document.querySelectorAll('.unitseg button')];
      return {
        labels: b.map((x) => x.textContent.trim()),
        pressed: b.filter((x) => x.getAttribute('aria-pressed') === 'true').length,
        minH: Math.min(...b.map((x) => x.getBoundingClientRect().height)),
      };
    });
    t.ok('both units are on show, so it reads as a choice',
      seg.labels.join('/') === 'cups/grams' && seg.pressed === 1, JSON.stringify(seg));
    t.ok('and each half is big enough to press', seg.minH >= 24, seg.minH + 'px');

    const cups = await p.$$eval('.sheet-ing div', (n) => n.map((x) => x.textContent));

    await p.click('[data-units="grams"]');
    await p.waitForTimeout(350);
    const grams = await p.$$eval('.sheet-ing div', (n) => n.map((x) => x.textContent));

    t.ok('the same recipe reads by weight', grams.some((l) => / g /.test(l)), grams.join(' | '));
    t.ok('and every line is still there', cups.length === grams.length, cups.length + ' vs ' + grams.length);

    /* A dash of vanilla has no weight, and rendering it as 0 g would be worse
       than leaving it as written. */
    const unweighable = cups.map((l, i) => [l, grams[i]]).filter(([c]) => /^(dash|pinch|salt|pepper)\b/i.test(c));
    t.ok('what cannot be weighed is left as written',
      unweighable.every(([c, g]) => c === g), JSON.stringify(unweighable));
    t.ok('and nothing reads as 0 g', !grams.some((l) => /\b0 g\b/.test(l)), grams.filter((l) => /\b0 g\b/.test(l)).join(' | '));

    /* Scaling and units are different questions and must compose. */
    await p.click('[data-scale="up"]');
    await p.waitForTimeout(350);
    const doubled = await p.$$eval('.sheet-ing div', (n) => n.map((x) => x.textContent));
    const firstCups = parseFloat(grams[0]), firstDoubled = parseFloat(doubled[0]);
    t.ok('doubling the recipe doubles the grams',
      Math.abs(firstDoubled - firstCups * 2) < 1, grams[0] + ' → ' + doubled[0]);

    // and the choice is remembered, because it is a preference not a mode
    await p.reload();
    await p.waitForTimeout(700);
    if (await p.$('.chap-card')) { await p.click('.chap-card >> nth=0'); await p.waitForTimeout(150); }
    await p.click('.card');
    await p.waitForTimeout(350);
    t.ok('the choice survives a reload',
      (await p.$$eval('.sheet-ing div', (n) => n.map((x) => x.textContent))).some((l) => / g /.test(l)));

    await ctx.close();
  },
};
