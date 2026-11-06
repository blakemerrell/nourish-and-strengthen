/* The picture that shows up when somebody texts this page to somebody else.
 *
 * That is the whole life of this link — it is not found by search, it is sent
 * by a person to a person, in a message or a ward group. Without an og:image
 * it arrives as a line of grey text, and a line of grey text is not opened.
 *
 * Composed here rather than cropped from a screenshot because the cover is
 * portrait and every social card is landscape: cropping it to 1200×630 would
 * cut the title off. So the cover is set whole on the page's own paper, at the
 * page's own typefaces, and the words beside it are the ones the hero uses.
 *
 * Run: node tools/build-og.js   (writes welcome/demo/og.png)
 */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');

const root = path.join(__dirname, '..');
const TYPES = { '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png' };

/* The number in the sentence, off the collection.
 *
 * It said 266 on a day the collection held 277, which is the worst place on
 * the whole site for a stale number: this is the picture that arrives in a
 * message when somebody sends the link to somebody else, and it is the first
 * and sometimes only thing they read. Nothing rebuilt it and nothing checked
 * it, because a number baked into a PNG is invisible to every test that reads
 * markup. */
const g = {}; global.window = g;
require('../data/recipes.js');
const COUNT = (g.RECIPES || []).length;

const HTML = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: 'Source Serif 4'; src: url('/fonts/source-serif-4-latin-wght-normal.woff2') format('woff2');
  font-weight: 200 900; font-display: block }
@font-face { font-family: 'Work Sans'; src: url('/fonts/work-sans-latin-wght-normal.woff2') format('woff2');
  font-weight: 100 900; font-display: block }
* { margin: 0; box-sizing: border-box }
body { width: 1200px; height: 630px; display: flex; align-items: center; gap: 56px;
  padding: 0 72px; background: #f7f2e7; font-family: 'Work Sans', sans-serif; overflow: hidden }
.cover { flex: none; width: 340px; box-shadow: 0 18px 44px rgba(59,54,48,.28); display: block }
.eyebrow { font-size: 19px; letter-spacing: .28em; text-transform: uppercase;
  color: #a9853c; font-weight: 600 }
h1 { font-family: 'Source Serif 4', serif; font-size: 92px; font-weight: 700;
  color: #3b3630; letter-spacing: -.015em; margin: 14px 0 22px; line-height: .96 }
p { font-size: 27px; line-height: 1.45; color: #5f574c; max-width: 19em }
.foot { margin-top: 30px; font-size: 21px; color: #8a8175; letter-spacing: .01em }
</style>
<img class="cover" src="/welcome/demo/book-1-cover.webp">
<div>
  <div class="eyebrow">Nourish &amp; Strengthen</div>
  <h1>Recipes</h1>
  <p>${COUNT} recipes built mostly from everyday pantry staples.</p>
  <div class="foot">Free &middot; No account &middot; Works with no signal</div>
</div>`;

(async () => {
  const srv = http.createServer((q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(HTML); }
    const f = path.join(root, decodeURIComponent(q.url));
    fs.readFile(f, (e, d) => {
      if (e) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      r.end(d);
    });
  });
  await new Promise((r) => srv.listen(8899, r));

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('http://localhost:8899/');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  const out = path.join(root, 'welcome', 'demo', 'og.png');
  await p.screenshot({ path: out });
  await b.close(); srv.close();
  console.log('wrote', path.relative(root, out),
    (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
})();
