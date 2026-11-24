/* Recipes of your own, and changes to the printed ones. */

const ROLLS = {
  name: "Grandma's Rolls",
  servings: '12 Rolls',
  time: '2 hr 30 mins',
  ing: '4 cups flour\n1 packet yeast\n1 ½ cups milk\n2 tbsp sugar\n2 tsp salt\n4 tbsp butter\n1 egg',
  steps: 'Warm the milk to blood heat.\nStir in the yeast and leave ten minutes.\n'
    + 'Mix in flour, sugar, salt and the egg, then knead ten minutes.\n'
    + 'Rise an hour, shape into twelve, rise again.\n'
    + 'Bake at 375°F for 18 minutes, until the tops are deep gold.',
};

async function write(p, r) {
  await p.click('#newRecipe');
  await p.waitForSelector('.ed-sheet');
  await p.fill('#edName', r.name);
  await p.fill('#edServings', r.servings);
  await p.fill('#edTime', r.time);
  await p.fill('#edIng', r.ing);
  await p.fill('#edSteps', r.steps);
  await p.waitForTimeout(250);
}

module.exports = {
  name: 'Writing and editing recipes',
  async run(t) {
    const p = await t.fresh();
    await p.click('.tab[data-view="browse"]');   // the app opens on Today; these are Recipes' tests
    await p.waitForTimeout(200);

    t.ok('the third volume does not exist until there is something in it',
      await p.evaluate(() => document.getElementById('bookOurs').classList.contains('hide')));

    await write(p, ROLLS);
    const preview = await p.textContent('.ed-score');
    t.ok('the nutrition works itself out as you type',
      /out of 100/.test(preview) && /mg sodium/.test(preview) && /fiber/.test(preview),
      preview.split('Worked')[0].trim());

    /* The whole point of generating data/nutrition.js from the same source as
       the build: a recipe written here must be measured exactly as a printed
       one was, not approximately. */
    const same = await p.evaluate(() => {
      const N = window.Nutrition;
      const r = window.RECIPES[0];
      const est = N.nutritionFor(r.ing, r.servN, r.extras, N.parseLine, N.FOODS, N.SPICE_NAMES);
      return { na: est.perServing.na, fib: est.perServing.fib, was: r.macro.na, wasFib: r.macro.fib };
    });
    t.ok('and by the same code the printed books were measured with',
      same.na === same.was && same.fib === same.wasFib, JSON.stringify(same));

    await p.click('[data-ed="save"]');
    await p.waitForTimeout(400);
    t.ok('saving opens what you just wrote', /Grandma/.test(await p.textContent('.sheet-name')));
    t.ok('numbered in its own volume',
      (await p.textContent('.sheet-eyebrow')) === 'Ours · No. 001', await p.textContent('.sheet-eyebrow'));

    /* "Needs beyond the staples" was typed in and shown nowhere: the
       calories never read it, and it only marked the ingredient lines it
       appeared in. The sheet says what no line of the recipe already says. */
    await p.click('[data-edit]');
    await p.waitForSelector('.ed-sheet');
    await p.fill('#edExtras', 'Buttermilk, Nutmeg <b>x</b>, flour');
    await p.click('[data-ed="save"]');
    await p.waitForTimeout(400);
    const also = await p.evaluate(() => {
      const el = document.querySelector('.sheet [data-also]');
      return el ? { t: el.textContent, b: el.querySelectorAll('b').length } : null;
    });
    t.ok('what the editor says it needs beyond the staples is on the sheet, as typed and as text, less what an ingredient line says',
      !!also && also.t === 'Also needs: Buttermilk, Nutmeg <b>x</b>.' && also.b === 0, JSON.stringify(also));
    await p.click('.sheet-x');
    await p.waitForTimeout(200);
    // a printed one whose extra is on its own ingredient list says it once, not twice
    const book = await p.evaluate(() => new Promise((ok) => {
      const r = window.RECIPES.find((x) => x.extras === 'Whey Protein' && x.ing.some((l) => /whey/i.test(l)));
      window.Hive.open(r.id);
      setTimeout(() => ok({ name: r.name, open: (document.querySelector('.sheet-name') || {}).textContent, also: !!document.querySelector('.sheet [data-also]') }), 300);
    }));
    t.ok('a printed recipe whose extra is one of its ingredients adds no second line', book.open === book.name && !book.also, JSON.stringify(book));
    await p.click('.sheet-x');

    t.ok('the volume appears once it has a recipe',
      !(await p.evaluate(() => document.getElementById('bookOurs').classList.contains('hide'))));
    /* The printed collection plus the one just written. As the literal 267 it
       was really asserting how many recipes the books hold, in a test about
       writing one — so it went red every time a recipe was added anywhere. */
    const withMine = await p.evaluate(() => window.RECIPES.length + 1);
    t.ok('and the header counts it',
      (await p.textContent('.brand-sub')) === withMine + ' recipes · three volumes',
      await p.textContent('.brand-sub') + ' (expected ' + withMine + ')');

    // it is a recipe like any other
    await p.fill('#search', 'grandma');
    await p.waitForTimeout(200);
    t.ok('it is searchable', (await p.evaluate(() => document.querySelectorAll('.card').length)) === 1);
    await p.click('#grid .card');
    await p.click('.daybtn[data-day="mon"]');
    await p.click('.sheet-x');
    await p.evaluate(() => window.Hive.go('list'));
    await p.waitForTimeout(300);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.list-row')].map((r) => r.textContent));
    t.ok('it can be planned and shopped for',
      rows.length >= 5 && rows.some((r) => /Flour/.test(r)), rows.join(' | '));
    await p.click('.tab[data-view="browse"]');
    await p.fill('#search', '');

    // ---- changing a printed recipe ----------------------------------------
    await p.click('#filtBtn');
    await p.waitForTimeout(80);
    await p.click('[data-book="1"]');
    await p.click('#filtersDone');
    await p.waitForTimeout(200);
    await p.click('[data-browseall]');
    await p.waitForTimeout(150);
    await p.click('#grid .card >> nth=0');
    await p.click('[data-edit]');
    await p.waitForSelector('.ed-sheet');
    await p.fill('#edName', 'Cottage Cheese Bowl, our way');
    await p.fill('#edIng', '1 cup cottage cheese\n1 diced apple\n1 tsp cinnamon\n2 tbsp raisins');
    await p.click('[data-ed="save"]');
    await p.waitForTimeout(400);
    t.ok('a printed recipe can be changed',
      /our way/.test(await p.textContent('.sheet-name')), await p.textContent('.sheet-name'));
    /* The claim is that editing a printed recipe leaves the printed recipe
       alone — asked of the recipe that was actually edited, whichever it is.
       It used to name the recipe sitting at index 0, which made it a test of
       the running order: re-sectioning a volume moved a different recipe to
       the front and this went red while the thing it describes still held. */
    const untouched = await p.evaluate(() => {
      const shown = document.querySelector('.sheet-name').textContent.trim();
      const edited = window.RECIPES.find((r) => /our way/.test(shown) &&
        r.name === 'Cottage Cheese & Cinnamon Apple Bowl');
      return { found: !!edited, name: edited ? edited.name : null };
    });
    t.ok('but the book itself is never touched',
      untouched.found, JSON.stringify(untouched));

    await p.click('[data-edit]');
    await p.waitForSelector('.ed-sheet');
    await p.click('[data-ed="revert"]');
    await p.waitForSelector('.dlg');
    await p.click('[data-dlg="ok"]');
    await p.waitForTimeout(400);
    t.ok('and one button puts the printed version back',
      (await p.evaluate(() => Object.keys(window.Store.state.edits).length)) === 0 &&
      /Cinnamon Apple Bowl/.test(await p.evaluate(() =>
        [...document.querySelectorAll('.card-name')].map((e) => e.textContent).join('|'))));

    // ---- it lasts, and it prints ------------------------------------------
    await p.reload();
    await p.waitForTimeout(400);
    t.ok('your recipe survives a reload',
      (await p.evaluate(() => Object.keys(window.Store.state.mine).length)) === 1);

    await p.click('.tab[data-view="browse"]'); await p.click('#bookBtn');
    await p.click('[data-print="3"]');
    await p.waitForTimeout(1500);
    const own = await p.evaluate(() => ({
      pages: document.querySelectorAll('.pg:not(.no-print)').length,
      cover: (document.querySelector('.pg-title') || {}).textContent,
      hasIt: /Grandma/.test(document.getElementById('pages').textContent),
    }));
    t.ok('and prints as a volume of its own, cover and all',
      own.pages >= 2 && own.cover === 'Ours' && own.hasIt, JSON.stringify(own));

    await p.click('[data-print="all"]');
    await p.waitForTimeout(3500);
    t.ok('and is in the whole set too',
      await p.evaluate(() => /Grandma/.test(document.getElementById('pages').textContent)));

    // ---- refusals ----------------------------------------------------------
    await p.click('.tab[data-view="browse"]');
    await p.click('#newRecipe');
    await p.waitForSelector('.ed-sheet');
    await p.click('[data-ed="save"]');
    await p.waitForTimeout(200);
    t.ok('an unnamed recipe is refused, in the app’s own words',
      /name/i.test((await p.textContent('.dlg-t')) || ''), await p.textContent('.dlg-t').catch(() => 'no dialog'));
    await p.click('[data-dlg="ok"]');

    /* ---- a deleted recipe leaves nothing pointing at it ----
     *
     * deleteRecipe removed the record and stopped. A recipe of your own that
     * was on Monday stayed on Monday: the plan kept its id, the day drew empty
     * because nothing could be found for it, and the dead id went on syncing
     * to every phone in the household. Copy that week and the ghost came with
     * it. Favorites had the same hole. Neither shows as an error, because an
     * id matching nothing is skipped by every reader — which is why it would
     * have sat there indefinitely. */
    const ghost = await p.evaluate(async () => {
      const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const S = window.Store;
      const id = S.newRecipeId();
      S.saveRecipe({ id: id, book: 3, secNum: 1, secName: 'Ours', name: 'Doomed',
        servings: '1 Serving', servN: 1, ing: ['1 cup rice'], steps: ['Cook.'],
        macro: null, score: null, sc: null, diff: 'Easy', time: '5 mins', extras: null });
      await wait(250);
      S.addToDay(id, 'mon');
      S.toggleFav(id);
      await wait(250);
      const before = { day: S.day('mon').length, fav: S.isFav(id) };
      S.deleteRecipe(id);
      await wait(400);
      const after = {
        day: S.day('mon').length,
        fav: S.isFav(id),
        inAnyWeek: Object.keys(S.state.weeks).some((k) =>
          Object.keys(S.state.weeks[k].plan || {}).some((d) =>
            (S.state.weeks[k].plan[d] || []).some((e) =>
              (typeof e === 'object' && e ? e.i : e) === id))),
        inFavs: (S.state.favs || []).indexOf(id) >= 0,
      };
      return { before, after };
    });
    /* One fewer on the day, and gone from every week — not "the day is empty",
       because this test has already put another recipe on Monday. */
    t.ok('a recipe you delete is taken out of the week it was in',
      ghost.after.day === ghost.before.day - 1 && !ghost.after.inAnyWeek,
      JSON.stringify(ghost));
    t.ok('and out of your favorites',
      ghost.before.fav && !ghost.after.fav && !ghost.after.inFavs,
      JSON.stringify(ghost));

    await p.context().close();
  },
};
