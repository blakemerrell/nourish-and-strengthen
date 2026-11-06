/* ---------------------------------------------------------------------------
 * Cover thumbnails for the print screen.
 *
 *     node tools/build-covers.js
 *
 * Page one of each shipped PDF, at thumbnail size, into art/covers/. The print
 * screen shows them as a grid you pick from, which is the whole reason they
 * have to be real renders rather than drawings: a picture of a cover is a
 * claim about what arrives when you press the button, and the four covers
 * genuinely differ — two volumes with their own titles, the combined edition,
 * and the one-book run.
 *
 * Run by tools/print-books.js after it renders, so a cover cannot go on
 * advertising a book that has been reset since. tests/print.test.js checks
 * that every offered file has one and that it is newer than the PDF it is of.
 *
 * Needs pdftoppm (poppler-utils) and sharp.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PDFS = path.join(ROOT, 'print');
const OUT = path.join(ROOT, 'art', 'covers');

/* Keyed by the print set, so src/book.js can look one up by the same key it
   already uses for READY_MADE.
 *
 * 'all' is deliberately not Both-Books.pdf's own first page. That file opens
 * on Volume One's cover, so its thumbnail came out pixel-identical to Run and
 * Not Be Weary's — two different downloads showing the same picture, in a grid
 * whose entire job is telling them apart. It is drawn as the two volumes
 * overlapping instead, which is also what the file actually is. */
const COVERS = {
  one: 'Nourish-and-Strengthen-Recipes.pdf',
  1: 'Run-and-Not-Be-Weary.pdf',
  2: 'Around-the-Table.pdf',
};

/* Wide enough to stay sharp on a 2x screen at the ~150px the grid draws them,
   small enough that four of them are a rounding error next to the engravings. */
const W = 320;

function sharpLib() {
  try { return require('sharp'); } catch (e) { return null; }
}

/*
 * opts.only   the print-set keys whose PDF changed on this run; only their
 *             covers are remade (and the combined one, if either volume's
 *             was). Left out, as when this is run by hand, all of them are.
 *
 * A cover is written only when its bytes change: the service worker keeps the
 * covers with the app, under a version that is a hash of what it holds, so one
 * rewritten for nothing is a new version and every phone fetching the app
 * again.
 */
async function build(opts) {
  const sharp = sharpLib();
  if (!sharp) { console.log('  sharp is not installed — cover thumbnails not rebuilt'); return; }
  const { keep } = require('./pdf-file.js');
  const only = opts && opts.only;
  const want = (key) => !only || only.indexOf(key) >= 0;

  fs.mkdirSync(OUT, { recursive: true });
  const made = [];
  const put = (name, buf) => { if (keep(path.join(OUT, name), buf)) made.push(name + ' ' + Math.round(buf.length / 1024) + ' KB'); };
  for (const key of Object.keys(COVERS)) {
    const pdf = path.join(PDFS, COVERS[key]);
    if (!fs.existsSync(pdf) || !want(key)) continue;   // that book was not rendered, or did not change

    const stem = path.join(OUT, 'tmp-' + key);
    try {
      execFileSync('pdftoppm', ['-png', '-r', '100', '-f', '1', '-l', '1', pdf, stem],
        { stdio: 'pipe' });
    } catch (e) {
      console.log('  pdftoppm failed for ' + COVERS[key] + ' — is poppler-utils installed?');
      continue;
    }
    const raw = fs.readdirSync(OUT).filter((f) => f.indexOf('tmp-' + key + '-') === 0)[0];
    if (!raw) { console.log('  no page came out of ' + COVERS[key]); continue; }

    put(key + '.webp', await sharp(path.join(OUT, raw)).resize({ width: W }).webp({ quality: 82 }).toBuffer());
    fs.unlinkSync(path.join(OUT, raw));
  }

  /* The combined edition: both volumes, one behind the other. Drawn rather
     than lifted, for the reason in COVERS above. */
  const v1 = path.join(OUT, '1.webp'), v2 = path.join(OUT, '2.webp');
  if (fs.existsSync(v1) && fs.existsSync(v2) &&
      (want('1') || want('2') || !fs.existsSync(path.join(OUT, 'all.webp')))) {
    const back = Math.round(W * 0.80), lift = Math.round(W * 0.075);
    const frame = (f) => sharp(f).resize({ width: back })
      .extend({ top: 1, bottom: 1, left: 1, right: 1,
                background: { r: 150, g: 130, b: 100, alpha: 1 } }).toBuffer();
    const b = await frame(v2), f = await frame(v1);
    const m = await sharp(b).metadata();
    put('all.webp', await sharp({
      create: { width: W, height: m.height + lift + 2, channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: b, left: W - back - 2, top: 0 },
                  { input: f, left: 0, top: lift }])
      .webp({ quality: 82 }).toBuffer());
  }

  fs.readdirSync(OUT).filter((f) => f.indexOf('tmp-') === 0)
    .forEach((f) => { try { fs.unlinkSync(path.join(OUT, f)); } catch (e) { /* gone */ } });
  console.log('cover thumbnails: ' + (made.length ? made.join(', ') : 'unchanged'));
}

module.exports = { build, COVERS, OUT };

if (require.main === module) build().catch((e) => { console.error(e.message); process.exit(1); });
