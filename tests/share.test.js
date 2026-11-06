/* The one-page handout at /share/.
 *
 * It is the only thing in this repository that goes out on paper into somebody
 * else's hands without either of us in the room, and it makes exactly one
 * checkable promise: every recipe on it can be made from the storehouse order
 * alone. Somebody reads that, takes the sheet home, and finds out at the stove
 * whether it was true.
 *
 * So the promise is tested rather than trusted. The eight recipes are rendered
 * out of data/recipes.js at page load, and this reads them back and asks the
 * pantry the same question the app asks — not the ingp `x` flag, which is a
 * build-time input to the pantry table and is not the same answer. That flag
 * would have waved through a smoothie built on whey protein.
 *
 * And it has to stay one sheet, printed both sides. A third side is a second
 * sheet and a different photocopying job.
 */

module.exports = {
  name: 'The handout',
  async run(t) {
    const fs = require('fs'), path = require('path');
    const ctx = await t.browser.newContext({ viewport: { width: 1200, height: 1400 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));

    const outside = [];
    p.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:') outside.push(r.url());
    });

    const res = await p.goto(t.base + 'share/');
    t.ok('is served', res.status() === 200, String(res.status()));
    await p.waitForTimeout(400);
    t.ok('and fetches nothing from another host', outside.length === 0, outside.join(' '));

    const sheet = await p.evaluate(() => ({
      sheets: document.querySelectorAll('.sheet').length,
      recipes: [...document.querySelectorAll('.rec')].map((el) => ({
        no: (el.querySelector('.rec-kind').textContent.match(/No\.\s*(\d+)/) || [])[1],
        kind: el.querySelector('.rec-kind').textContent.split('·')[0].trim(),
        score: (el.querySelector('.leaf-n') || {}).textContent,
        name: el.querySelector('h2').textContent.trim(),
        ing: el.querySelector('.rec-ing').innerHTML.split(/<br\s*\/?>/i).map((x) => x.trim()),
        steps: [...el.querySelectorAll('.rec-steps li')].map((x) => x.textContent.trim()),
      })),
      qr: document.querySelectorAll('.foot-qr svg').length,
      url: (document.querySelector('[data-url]') || {}).textContent || '',
    }));

    t.ok('it puts eight recipes on the sheet', sheet.recipes.length === 8, sheet.recipes.length);
    t.ok('on two sides of one sheet', sheet.sheets === 2, sheet.sheets);
    t.ok('with the code on both of them', sheet.qr === 2, sheet.qr);
    /* Every recipe carries the promise it is answering — a dinner, a breakfast,
       a pudding. Without them eight recipes read as a list rather than a range,
       which is the argument the sheet is making. */
    t.ok('and each one says what it is for',
      sheet.recipes.every((r) => r.kind), sheet.recipes.map((r) => r.kind).join(' | '));

    /* The recipes are the book's, not retyped — a corrected recipe has to
       correct the handout, or the sheet becomes a second source of truth that
       nobody remembers to update. */
    const root = path.join(__dirname, '..');
    global.window = {};
    delete require.cache[require.resolve(path.join(root, 'data', 'recipes.js'))];
    require(path.join(root, 'data', 'recipes.js'));
    const R = global.window.RECIPES, P = global.window.PANTRY;
    /* Keyed on the printed number, which is what the sheet shows and what a
       reader holding the book can look up. This was keyed on the id, and so
       was the sheet — and every one of the 335 recipes has an id that is no
       longer its number. Somebody handed the sheet and told to find No. 219,
       the bread pudding, opened the book at Shepherd's Pie. The sheet prints
       `no` now; this joins on the same thing it prints. */
    const byNo = {};
    R.forEach((r) => { byNo[r.no] = r; });

    const wrong = sheet.recipes.filter((s) => {
      const r = byNo[Number(s.no)];
      return !r || r.name !== s.name ||
        r.ing.join('|') !== s.ing.join('|') ||
        r.steps.join('|') !== s.steps.join('|');
    });
    t.ok('and every one of them is word for word the recipe in the book',
      wrong.length === 0, wrong.map((s) => s.no + ' ' + s.name).join(', '));

    /* The claim on the sheet, in the words the sheet uses: "nothing to buy,
       nothing to substitute". Asked of the pantry the way the app asks it —
       PANTRY[key].s, not ingp[].x, which says something else and would pass a
       recipe built on whey protein. */
    const needs = sheet.recipes.map((s) => {
      const r = byNo[Number(s.no)] || { ingp: [] };
      const out = [];
      (r.ingp || []).forEach((i) => {
        if (i.k === 'water') return;
        /* Not `free` wholesale, which is how this promise stayed broken. A
           free line is a seasoning costing nothing, and most are the salt and
           cinnamon the storehouse carries — but `x` marks the ones it does
           not, and skipping the whole class skipped the flag as well. No. 244
           was on this sheet needing chili powder and cumin from a shop, under
           a heading that says nothing to buy and nothing to substitute, and
           the assertion below reported it clean every run. */
        if (i.k === 'free') {
          if (i.x && out.indexOf(i.a || 'a seasoning') < 0) out.push(i.a || 'a seasoning');
          return;
        }
        const d = P[i.k];
        if (d ? (d.s || d.sp) : true) return;
        if (out.indexOf(d ? d.l : i.k) < 0) out.push(d ? d.l : i.k);
      });
      return { no: s.no, needs: out };
    }).filter((x) => x.needs.length);
    t.ok('nothing on it sends you to a shop',
      needs.length === 0, needs.map((x) => x.no + ' needs ' + x.needs.join(', ')).join('; '));

    /* Somebody types this by hand when the code will not scan, so it has to be
       the address the code encodes and not a copy of it that drifted. The page
       renders it from window.APP_QR_URL, which tools/build-qr.js writes beside
       the symbol it built — so changing the site's address is one edit and a
       rebuild, and the printed line cannot be left behind. */
    global.window.APP_QR_URL = undefined;
    delete require.cache[require.resolve(path.join(root, 'data', 'qr.js'))];
    require(path.join(root, 'data', 'qr.js'));
    t.ok('the printed address is the one the code encodes',
      sheet.url.trim() === String(global.window.APP_QR_URL).replace(/^https?:\/\//, ''),
      sheet.url + ' vs ' + global.window.APP_QR_URL);

    /* The leaf is on the sheet because a score is a glance, and a glance is the
       only thing a handout gets. */
    t.ok('every recipe wears its score',
      sheet.recipes.every((r) => r.score && byNo[Number(r.no)] &&
        String(byNo[Number(r.no)].score) === r.score),
      sheet.recipes.map((r) => r.no + ':' + r.score).join(' '));

    /* Both sides, measured in print media rather than on screen — and both,
       because the back is the one that grows: it carries the long recipe. */
    await p.emulateMedia({ media: 'print' });
    await p.waitForTimeout(250);
    const sides = await p.evaluate(() =>
      [...document.querySelectorAll('.sheet')].map((s) => ({
        id: s.id, content: s.scrollHeight / 96, box: s.getBoundingClientRect().height / 96 })));
    const over = sides.filter((x) => x.content > x.box + 0.02);
    t.ok('and neither side runs off the letter paper',
      over.length === 0,
      sides.map((x) => x.id + ' ' + x.content.toFixed(2) + 'in in ' + x.box.toFixed(2) + 'in').join(', '));

    /* And on both sides, the sentence that keeps this from reading as the
       storehouse's own handout. This sheet is made to be photocopied and sent
       home with an order — of everything here it is the most likely to be
       mistaken for something official, and it was the last thing to say
       otherwise. */
    const disc = await p.evaluate(() => [...document.querySelectorAll('.sheet')]
      .map((s) => /not affiliated with or endorsed by the Church/i.test(s.innerText)));
    t.ok('both sides say it is not the Church’s and not endorsed by it',
      disc.length === 2 && disc.every(Boolean), JSON.stringify(disc));

    /* Rendered ahead of time and committed, like the books, so somebody can be
       handed a file rather than a URL and a print dialog.
     *
     * Existing was all this used to ask, which is how the shipped handout came
     * to be a day older than the collection it advertises — quoting 271
     * recipes over a code leading to 277, on the one artefact designed to be
     * photocopied and sent home with an order. The books are held against what
     * the app renders today; this is the same check for the sheet. */
    const pdf = path.join(root, 'print', 'Pantry-Handout.pdf');
    t.ok('the rendered handout ships with the repository', fs.existsSync(pdf));

    if (fs.existsSync(pdf)) {
      let lib = null;
      try { lib = require('pdf-lib'); } catch (e) { /* reported below */ }
      if (!lib) {
        t.ok('and it was rendered from the collection as it stands', false, 'pdf-lib not available');
      } else {
        const doc = await lib.PDFDocument.load(fs.readFileSync(pdf));
        t.ok('and it is the two sides the page lays out',
          doc.getPageCount() === sides.length,
          doc.getPageCount() + ' in the file, ' + sides.length + ' laid out');

        /* The number on the sheet, against the collection it points at. Read
           off the rendered page rather than the source, so a count that is
           filled in at render time is checked the way a reader meets it. */
        const said = await p.evaluate(() =>
          [...document.querySelectorAll('[data-n="all"]')].map((e) => Number(e.textContent)));
        const real = await p.evaluate(() => window.RECIPES.length);
        t.ok('and every count printed on it is the size of the collection',
          said.length >= 2 && said.every((x) => x === real),
          said.join(', ') + ' printed, ' + real + ' recipes');

        /* Whether the sheet in the file is the sheet the page sets today.
           This was the commit time of the PDF held against the recipes',
           which a fresh checkout could not spoil but a recipe change the sheet
           does not show could: the meatloaf's glaze changed, the handout came
           out of `npm run handout` byte for byte the same, git had nothing to
           commit, and this failed with nothing left to do. So it asks the
           question directly. tools/print-handout.js stamps the text it
           photographed and the file that made; here the page is read again,
           and both have to agree — a recipe on the sheet changing, the count
           moving, or the PDF swapped without the stamp. */
        const { hash, pageTextHash } = require(path.join(root, 'tools', 'pdf-file.js'));
        const stampFile = path.join(root, 'print', 'Pantry-Handout.json');
        let stamp = {};
        try { stamp = JSON.parse(fs.readFileSync(stampFile, 'utf8')); } catch (e) { /* reported below */ }
        const now = await pageTextHash(p, '.sheet');
        const file = hash(fs.readFileSync(pdf));
        t.ok('and it is the sheet the page sets today, from the recipes as they stand',
          stamp.sheet === now && stamp.pdf === file,
          'stamp ' + JSON.stringify(stamp) + ', page ' + now + ', file ' + file + ' — run npm run handout');
      }
    }

    await ctx.close();
  },
};
