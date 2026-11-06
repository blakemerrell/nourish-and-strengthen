/*
 * The pictures the landing page animates through.
 *
 * Both halves are real. The book frames are pages lifted out of the rendered
 * PDF; the app frames are the app itself, driven at phone size and
 * photographed. Nothing here is a mockup, which matters more than it sounds:
 * a landing page that shows a drawing of a product is making a claim it has
 * not checked, and this one regenerates from the current build every time.
 *
 * It replaced a strip of twelve engravings. Those were the best thing on the
 * page and they are still in it — one of the book frames is a section opener,
 * so the art appears where it belongs instead of in a gallery of its own.
 *
 * WebP at quality 82. The strip it replaced was 2.6 MB of PNG for pictures a
 * reader scrolled past; this is eight frames at roughly a tenth of that, and
 * they are the argument rather than the decoration.
 *
 * Run:  node tools/build-demo.js
 * Needs: print/Nourish-and-Strengthen-Recipes.pdf, pdftoppm, pdftotext and pdfinfo
 *        (poppler-utils), playwright, sharp.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PDF = path.join(ROOT, 'print', 'Nourish-and-Strengthen-Recipes.pdf');
const OUT = path.join(ROOT, 'welcome', 'demo');

/* Four pages, chosen to answer four different doubts: that it is a real book,
   that the sections are illustrated, that a recipe is properly set, and that
   you can find anything in it.
 *
   Found by what is on them, not by number. They were page numbers, with a
   note to check them if the book grew — and it grew: every recipe added puts
   more lines in the contents, the contents pushed everything after it along,
   and "the section opener" and "a page of recipes" turned into a contents
   page and a part title while the alt text went on describing an engraving.
   Nothing failed; the landing page just quietly showed the wrong pages. The
   text a page carries says what it is, so it is asked. */
const PAGES = [
  { name: 'book-1-cover', alt: 'The printed cover: a beehive above the title, Nourish and Strengthen Recipes',
    is: (t, n) => n === 1 },
  { name: 'book-2-opener', alt: 'A section opening page: an engraving of a breakfast spread above the section\u2019s name',
    // the first section's opener: "SECTION 1 Breakfasts", letter-spaced in the text layer
    is: (t) => /^S\s*E\s*C\s*T\s*I\s*O\s*N\s+1\s+\D/.test(t) },
  { name: 'book-3-recipes', alt: 'A page of the printed book, two recipes with ingredients and method side by side',
    // the first page of recipes after it: two recipe numbers on one page
    is: (t) => (t.match(/\bNO\.\s*\d{3}\b/g) || []).length >= 2 },
  { name: 'book-4-contents', alt: 'A contents page listing recipes with their page numbers',
    is: (t) => /C\s*ONTENTS/.test(t) },
];

function pageCount() {
  const info = execFileSync('pdfinfo', [PDF]).toString();
  return Number((info.match(/^Pages:\s+(\d+)/m) || [])[1]) || 0;
}
function pageText(n) {
  return execFileSync('pdftotext', ['-f', String(n), '-l', String(n), PDF, '-']).toString()
    .replace(/\s+/g, ' ').trim();
}
/* The first page each description fits. The page of recipes is looked for
   after the opener, so it is that section's first page and not a stray
   page of recipes somewhere before it. Refuses rather than guessing when one
   is not found: a frame of the wrong page is what this exists to prevent. */
function findPages() {
  const total = pageCount(), found = {};
  const first = (p, from) => {
    for (let n = from; n <= total; n++) if (p.is(pageText(n), n)) return n;
    throw new Error('no page in the book looks like ' + p.name);
  };
  const byName = {};
  PAGES.forEach((p) => { byName[p.name] = p; });
  found['book-1-cover'] = 1;
  found['book-4-contents'] = first(byName['book-4-contents'], 1);
  found['book-2-opener'] = first(byName['book-2-opener'], 1);
  found['book-3-recipes'] = first(byName['book-3-recipes'], found['book-2-opener'] + 1);
  return found;
}

/* And four of the app, in the order somebody uses it. */
const SCREENS = [
  { name: 'app-1-browse', alt: 'The app browsing recipes as cards, each with its nutrition score' },
  { name: 'app-2-recipe', alt: 'A recipe open in the app, with its ingredients, method and score' },
  { name: 'app-3-plan', alt: 'The meal plan, with recipes assigned to days of the week' },
  { name: 'app-4-list', alt: 'The shopping list, with quantities added up across recipes' },
];

function playwright() {
  try { return require('playwright'); } catch (e) { /* fall through */ }
  console.error('Playwright is not installed. `npm i -D playwright` and try again.');
  process.exit(2);
}

function serve() {
  const http = require('http');
  const TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
    '.webmanifest': 'application/manifest+json',
  };
  return new Promise((res) => {
    const s = require('http').createServer((q, r) => {
      let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (f.endsWith('/')) f += 'index.html';
      fs.readFile(f, (e, d) => e
        ? (r.writeHead(404), r.end())
        : (r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }), r.end(d)));
    }).listen(0, () => res(s));
  });
}

(async () => {
  if (!fs.existsSync(PDF)) {
    console.error('no print/Nourish-and-Strengthen-Recipes.pdf — run tools/print-books.js one first');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-'));
  global.window = {};
  require(path.join(ROOT, 'data', 'recipes.js'));
  const RECIPE_COUNT = global.window.RECIPES.length;

  // ---- the book ---------------------------------------------------------
  const at = findPages();
  for (const p of PAGES) {
    p.n = at[p.name];
    console.log(p.name + ': page ' + p.n);
    execFileSync('pdftoppm', ['-png', '-r', '150', '-f', String(p.n), '-l', String(p.n),
      PDF, path.join(tmp, p.name)]);
    const f = fs.readdirSync(tmp).find((x) => x.startsWith(p.name) && x.endsWith('.png'));
    await sharp(path.join(tmp, f)).resize({ width: 760 })
      .webp({ quality: 82 }).toFile(path.join(OUT, p.name + '.webp'));
  }

  // ---- the app ----------------------------------------------------------
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(base + 'index.html');
  await page.evaluate(() => localStorage.clear());
  /* Past the front door (src/door.js), which a cleared phone meets first and
     which stands over every tab below. The mark is the one the door leaves
     when it is done, and the one tests/run.js and print-books.js set. */
  await page.evaluate(() => localStorage.setItem('sh.door', 'demo'));
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  /* A week with something in it, so the plan and the list are not photographs
     of two empty states. */
  await page.evaluate(() => {
    [1, 26, 51, 104, 200].forEach((id, i) =>
      window.Store.addToDay(id, ['mon', 'tue', 'wed', 'thu', 'fri'][i]));
  });
  await page.waitForTimeout(600);

  const shot = (name) => page.screenshot({ path: path.join(tmp, name + '.png') });

  await page.click('.tab[data-view="browse"]'); await page.waitForTimeout(500);
  await shot('app-1-browse');
  await page.click('.card'); await page.waitForTimeout(700);
  await shot('app-2-recipe');
  await page.click('.sheet-x'); await page.waitForTimeout(300);
  await page.click('.tab[data-view="plan"]'); await page.waitForTimeout(600);
  await shot('app-3-plan');
  // the step row went; the plan's own "The list" button is the way on now
  await page.click('[data-stepgo="list"]'); await page.waitForTimeout(700);
  await shot('app-4-list');

  await browser.close();
  srv.close();

  for (const s of SCREENS) {
    await sharp(path.join(tmp, s.name + '.png')).resize({ width: 470 })
      .webp({ quality: 82 }).toFile(path.join(OUT, s.name + '.webp'));
  }

  /* A stamp, because these frames rot silently and expensively. They are
     photographs of a build; the build moves; the page goes on showing a cover
     that advertises a recipe count from two commits ago, and nothing about the
     page looks wrong. It is the same failure mode the rendered PDFs have, and
     it gets the same treatment: record what was photographed, and let
     tests/welcome.test.js fail when the app has moved on without them. */
  fs.writeFileSync(path.join(OUT, 'stamp.json'), JSON.stringify({
    recipes: RECIPE_COUNT,
    pdf: require('crypto').createHash('sha1').update(fs.readFileSync(PDF)).digest('hex').slice(0, 12),
  }, null, 2) + '\n');

  fs.rmSync(tmp, { recursive: true, force: true });
  const frames = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp'));
  const total = frames.reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
  console.log('wrote ' + frames.length + ' frames to welcome/demo  (' +
    Math.round(total / 1024) + ' KB total, ' + RECIPE_COUNT + ' recipes)');
  console.log(PAGES.concat(SCREENS).map((x) => '  ' + x.name).join('\n'));
})();
