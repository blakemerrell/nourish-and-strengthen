/*
 * The picture on the Stripe checkout page.
 *
 * Not a drawing of a book. Page one of the rendered PDF at 300dpi, with the
 * coil and the block of paper drawn around it — so the image somebody sees
 * before paying is the object that arrives, down to the year on the cover.
 * Change the cover and re-run this; anything else drifts.
 *
 * The coil is drawn rather than borrowed. A stock photograph of a spiral book
 * has whatever ring pitch that book had, and laying it against a block of a
 * different height reads as wrong without a reader being able to say why. Here
 * the rings are spaced to this block, because the script knows how tall it is.
 *
 * 1200x1200 square, which is what Stripe's checkout wants. It crops nothing:
 * the book is 5.5x8.5, so it sits in the middle with room either side.
 *
 * Replace it with a photograph as soon as there is a real one to photograph.
 * A render says "product". A book on a kitchen counter next to something you
 * cooked from it says "I made this".
 *
 * Run:  node tools/build-product-shot.js
 * Needs: print/Nourish-and-Strengthen-Recipes.pdf, and pdftoppm on the path.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PDF = path.join(ROOT, 'print', 'Nourish-and-Strengthen-Recipes.pdf');
const OUT = path.join(ROOT, 'store', 'product-book.png');

if (!fs.existsSync(PDF)) {
  console.error('no ' + path.relative(ROOT, PDF) + ' — run tools/print-books.js one first');
  process.exit(2);
}

function playwright() {
  try { return require('playwright'); } catch (e) { /* fall through */ }
  console.error('Playwright is not installed. `npm i -D playwright` and try again.');
  process.exit(2);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
execFileSync('pdftoppm', ['-png', '-r', '300', '-f', '1', '-l', '1', PDF, path.join(tmp, 'cover')]);
const cover = fs.readdirSync(tmp).find((f) => f.endsWith('.png'));
const b64 = fs.readFileSync(path.join(tmp, cover)).toString('base64');

const BOOK_H = 860;          // the block, in the 1200px square
const INSET = 16;            // how far the coil is held off the head and foot
const RINGS = 34;

let rings = '';
for (let k = 0; k < RINGS; k++) {
  rings += '<i style="top:' + (k * ((BOOK_H - INSET * 2) / RINGS)).toFixed(1) + 'px"></i>';
}

const html = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:1200px;display:grid;place-items:center;
  background:radial-gradient(120% 100% at 50% 0%, #faf5ea 0%, #ece4d3 70%, #e2d8c3 100%)}
.stage{position:relative;
  filter:drop-shadow(0 26px 34px rgba(59,54,48,.30)) drop-shadow(0 6px 10px rgba(59,54,48,.16))}
.book{position:relative;height:${BOOK_H}px;aspect-ratio:1650/2550;
  border-radius:2px 6px 6px 2px;overflow:hidden;background:#fff}
.book img{width:100%;height:100%;display:block;object-fit:cover}
/* the fore-edge, so it reads as 156 sheets rather than as a pamphlet */
.edge{position:absolute;top:5px;bottom:5px;right:-9px;width:9px;border-radius:0 3px 3px 0;
  background:repeating-linear-gradient(to right,#fdfbf6 0 1px,#e6ded0 1px 2px)}
.coil{position:absolute;left:-16px;top:${INSET}px;bottom:${INSET}px;width:46px}
.coil i{position:absolute;left:0;width:46px;height:15px;border-radius:50%;
  border:4px solid #6b6257;border-right-color:transparent;border-bottom-color:transparent;
  transform:rotate(-16deg)}
</style>
<div class=stage><div class=coil>${rings}</div>
<div class=book><img src="data:image/png;base64,${b64}"></div>
<div class=edge></div></div>`;

fs.writeFileSync(path.join(tmp, 'shot.html'), html);

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.goto('file://' + path.join(tmp, 'shot.html'));
  await page.waitForTimeout(600);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.screenshot({ path: OUT });
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote ' + path.relative(ROOT, OUT) + '  (1200x1200, ' +
    Math.round(fs.statSync(OUT).size / 1024) + ' KB)');
})();
