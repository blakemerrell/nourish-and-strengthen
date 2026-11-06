/* ---------------------------------------------------------------------------
 * Renders the books to PDF, the same way the Print button does.
 *
 *     node tools/print-books.js            both volumes, and each on its own
 *     node tools/print-books.js 1          just Run and Not Be Weary
 *     node tools/print-books.js 3          just Ours (needs recipes of your own,
 *                                          which live on your phone, not here)
 *
 * Files land in print/. Half-letter, 5.5 × 8.5 in, ready for a print shop or
 * for a duplex printer with the booklet setting on.
 *
 * The pages are packed by measuring in a real browser, so this has to be a real
 * browser: it serves the repository, waits for the layout to settle, and prints
 * exactly what you would get from the app.
 * ------------------------------------------------------------------------- */

const http = require('http');
const fs = require('fs');
const path = require('path');

const { impose } = require('./booklet.js');
const { fixDates, keep } = require('./pdf-file.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'print');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.png': 'image/png',
};

const BOOKS = {
  1: 'Run-and-Not-Be-Weary.pdf',
  2: 'Around-the-Table.pdf',
  3: 'Ours.pdf',
  all: 'Both-Books.pdf',
  one: 'Nourish-and-Strengthen-Recipes.pdf',
};

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, '')), (err, body) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      res.end(body);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

function playwright() {
  try { return require('playwright'); } catch (e) { /* below */ }
  console.error('Playwright is not installed. `npm ci` and try again.');
  process.exit(2);
}

/* The landing page quotes the same numbers a third time.
 *
 * "All 271 recipes, 160 pages" over a Buy button, and a fold-it-yourself note
 * giving each volume's recipes and pages — five numbers, all typed, all of
 * them stale by the end of an afternoon of adding recipes. The suite caught
 * them only because it reads the PDFs; the page itself had no way to know.
 *
 * They are marked with data-n now and filled in from the render and the built
 * data, so the sentence on the page cannot say one thing while the file behind
 * the button says another. */
function stampWelcome(made) {
  const file = path.join(ROOT, 'welcome', 'index.html');
  if (!fs.existsSync(file)) return;

  const g = {}; global.window = g;
  delete require.cache[require.resolve('../data/recipes.js')];
  require('../data/recipes.js');
  const R = g.RECIPES || [];
  const n = (b) => R.filter((r) => r.book === b).length;

  const want = {
    'all-recipes': R.length,
    'b1-recipes': n(1),
    'b2-recipes': n(2),
    'one-pages': made.one,
    'b1-pages': made['1'],
    'b2-pages': made['2'],
  };

  let src = fs.readFileSync(file, 'utf8');
  const done = [];
  Object.keys(want).forEach((k) => {
    if (want[k] === undefined) return;            // that book was not rendered this run
    const re = new RegExp('(<span data-n="' + k + '">)(\\d+)(</span>)', 'g');
    const found = src.match(re);
    if (!found) { console.log('  welcome/index.html has no ' + k + ' to fill in'); return; }
    const was = (found[0].match(/>(\d+)</) || [])[1];   // the value, not the digits in the key
    if (Number(was) !== want[k]) done.push(k + ' \u00d7' + found.length + ' ' + was + ' -> ' + want[k]);
    src = src.replace(re, '$1' + want[k] + '$3');
  });

  /* The three that live in attributes rather than in the page.
   *
   * A description, an og:description and the alt text on the shared image, all
   * saying "271 recipes" on a day there were 277 — and invisible to a reader,
   * which is why they were the last to be noticed and the longest wrong. They
   * cannot hold a span, so they are matched on the phrase instead. The image
   * itself is built by tools/build-og.js, which counts. */
  const metas = src.match(/<meta[^>]*(?:name="description"|property="og:description"|property="og:image:alt")[^>]*>/g) || [];
  metas.forEach((tag) => {
    const fixed = tag.replace(/\b\d+(?= recipes)/g, String(want['all-recipes']));
    if (fixed !== tag) {
      done.push('meta ' + (tag.match(/(?:name|property)="([^"]+)"/) || [])[1]);
      src = src.replace(tag, fixed);
    }
  });
  if (!done.length) return;
  fs.writeFileSync(file, src);
  console.log('welcome/index.html updated: ' + done.join(', '));
}

/* And the app's own shell says it a fourth time.
 *
 * stampWelcome covers welcome/index.html. It does not cover index.html, which
 * carries the same claim in two places nobody looks at: the meta description a
 * search result and a shared link quote, and the "271 recipes · two volumes"
 * under the wordmark. The second is rewritten by the app a moment after load,
 * so it is only wrong for the moment before the JavaScript runs — but it is
 * the moment a screenshot is taken in. The first is never rewritten by
 * anything and had been saying 271 since the collection was 271.
 *
 * Counted from the built data rather than from a render, so it is right even
 * on a run that printed only one volume. */
function stampApp() {
  const file = path.join(ROOT, 'index.html');
  const g = {}; global.window = g;
  delete require.cache[require.resolve('../data/recipes.js')];
  require('../data/recipes.js');
  const n = (g.RECIPES || []).length;
  if (!n) return;

  let src = fs.readFileSync(file, 'utf8');
  const done = [];
  /* Only these two. "271 recipes" also appears in a comment recounting the
     day the labels were wrong, which is a record of what happened and not a
     claim about today — rewriting it would erase the point of it. */
  [/<meta name="description" content="[^"]*?\b(\d+)(?= recipes)/,
    /<div class="brand-sub">(\d+)(?= recipes)/].forEach((re) => {
    const m = src.match(re);
    if (!m) { console.log('  index.html: nothing matched ' + re); return; }
    if (Number(m[1]) !== n) {
      done.push(m[1] + ' -> ' + n);
      src = src.replace(re, (hit) => hit.replace(/\d+$/, String(n)));
    }
  });
  if (!done.length) return;
  fs.writeFileSync(file, src);
  console.log('index.html recipe counts updated: ' + done.join(', '));
}

/* The page count printed on the Download button, written back into the app.
 *
 * READY_MADE in src/book.js says how many pages each shipped PDF has, and until
 * now that number was typed in by hand after looking at the console output
 * above. It was wrong three separate times in one afternoon of adding recipes,
 * which is the whole shape of the problem: two copies of one fact, and only
 * one of them gets updated when the fact moves. The renderer knows the answer
 * — it just counted the pages — so it writes it down instead of announcing it
 * and hoping.
 *
 * Only the books actually rendered this run are touched. `node tools/print-
 * books.js 1` leaves the other three alone, because their files on disk are
 * also untouched and their numbers are therefore still right.
 */
function stampPageCounts(made) {
  const file = path.join(ROOT, 'src', 'book.js');
  let src = fs.readFileSync(file, 'utf8');
  const done = [];
  Object.keys(made).forEach((key) => {
    const re = new RegExp("(file: '" + BOOKS[key].replace(/\./g, '\\.') + "',[^}]*?pages: )(\\d+)");
    const m = src.match(re);
    if (!m) { console.log('  ' + BOOKS[key] + ' is not in READY_MADE — page count not recorded'); return; }
    if (Number(m[2]) !== made[key]) done.push(BOOKS[key] + ' ' + m[2] + ' -> ' + made[key]);
    src = src.replace(re, '$1' + made[key]);
  });
  if (!done.length) return;
  fs.writeFileSync(file, src);
  console.log('\nsrc/book.js READY_MADE updated: ' + done.join(', '));
}

(async () => {
  const want = process.argv.slice(2);
  const jobs = (want.length ? want : ['1', '2', 'all', 'one']).filter((k) => BOOKS[k]);
  if (!jobs.length) { console.error('nothing to print; try 1, 2, 3 or all'); process.exit(2); }

  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));

  await page.goto('http://127.0.0.1:' + srv.address().port + '/index.html');
  await page.evaluate(() => localStorage.clear());   // print the books, not somebody's week
  /* ...and past the front door (src/door.js), which a cleared phone meets
     first and which stands over the button below. The mark is the one the
     door leaves when it is done, and the one tests/run.js sets. */
  await page.evaluate(() => localStorage.setItem('sh.door', 'print'));
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  /* the book left the tab row (c57d39a); it opens from Recipes now, and the
     app opens on Today, so Recipes first or the button is never on screen */
  await page.click('.tab[data-view="browse"]');
  await page.click('#bookBtn');

  const made = {};
  const changed = [];
  for (const key of jobs) {
    await page.click('[data-print="' + key + '"]');

    /* Packing is measure-then-lay-out and runs asynchronously; wait for the
       page count to stop moving rather than guessing at a timeout. */
    let last = -1, still = 0;
    for (let i = 0; i < 120 && still < 3; i++) {
      await page.waitForTimeout(250);
      const n = await page.evaluate(() =>
        document.querySelectorAll('.pg:not(.no-print)').length);
      if (n === last && n > 0) still++; else { still = 0; last = n; }
    }
    if (!last) { console.log(BOOKS[key].padEnd(24), 'nothing to print'); continue; }

    const file = path.join(OUT, BOOKS[key]);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ width: '5.5in', height: '8.5in', printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
    /* Written only if the book actually changed. The same book renders to the
       same bytes once its dates are fixed, and print/ is committed, so an
       unchanged book rewritten is a few megabytes added to the history of
       the repository for nothing. tools/pdf-file.js has the rest. */
    const wrote = keep(file, fixDates(pdf));
    if (wrote) changed.push(key);

    made[key] = last;
    const size = (f) => String(Math.round(fs.statSync(f).size / 1024)).padStart(4) + ' KB';
    console.log(BOOKS[key].padEnd(26), String(last).padStart(3), 'pages  ',
      wrote ? size(file) : size(file) + '  unchanged');

    /* The same book again, imposed on letter sheets. Not for the combined
       edition: 142 pages is 36 folded sheets, which is not a booklet, it is a
       phone book.
     *
       Only when the book changed, or the booklet is missing. The booklet is
       made from the book and from nothing else, so an unchanged book has an
       unchanged booklet — and imposing it again would rewrite a booklet made
       before its dates were fixed for the sake of the date alone. After a
       change to tools/booklet.js itself, re-impose by hand:
       node tools/booklet.js print/<book>.pdf */
    if (key !== 'all' && key !== 'one') {
      const bk = file.replace(/\.pdf$/, '-booklet.pdf');
      if (!wrote && fs.existsSync(bk)) {
        console.log(path.basename(bk).padEnd(26), '    unchanged');
        continue;
      }
      try {
        const r = await impose(file, bk);
        console.log(path.basename(bk).padEnd(26), String(r.sheets).padStart(3),
          'sheets ', size(bk) + (r.written ? '' : '  unchanged'));
      } catch (e) {
        console.log('  could not impose ' + path.basename(file) + ': ' + e.message);
      }
    }
  }

  await browser.close();
  srv.close();
  console.log('\nin ' + path.relative(process.cwd(), OUT) + '/');
  stampPageCounts(made);
  stampWelcome(made);
  stampApp();
  /* The covers on the print screen are page one of the files just written, so
     they are remade here rather than left to be remembered — the ones whose
     book changed, and no others. The service worker keeps the covers under a
     version that is a hash of them, so a cover rewritten for nothing would be
     a new version, and every phone fetching the app again. */
  await require('./build-covers.js').build({ only: changed });
  /* src/book.js may just have changed, and it is served from the cache at
     ?v=N. N is a hash of the files, written in when the site is built for
     deployment, so there is nothing to bump here. */
})();
