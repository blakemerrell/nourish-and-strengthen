/* ---------------------------------------------------------------------------
 * What a built site has to be true of, checked from its files.
 *
 * Not a suite of its own — tests/offline.test.js runs it over whatever is
 * being served, or over a site it builds when the repository is being served
 * instead, and tests/upgrade.test.js leans on the same reading of a worker.
 *
 * The version used to be a number with a stamp file beside it, and the checks
 * here used to be "the stamp matches the files". There is no stamp now: the
 * version is a hash of the files, written in at build time. So the question
 * is no longer whether somebody remembered to bump it, but whether the
 * build did what it says — every URL carries the one version, the worker is
 * named for it, and the version really is the hash of the bytes that ship.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const site = require('../tools/build-site.js');

/* The worker a directory serves, read by running it. */
function worker(dir) {
  return site.readWorker(fs.readFileSync(path.join(dir, 'sw.js'), 'utf8'));
}

/* Same-origin scripts and stylesheets a page loads, as written in it. */
function assets(html) {
  const out = [];
  html.replace(/<script\b[^>]*\bsrc="([^"]+)"/g, (m, u) => out.push(u));
  html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g, (m, u) => out.push(u));
  return out.filter((u) => !/^(https?:)?\/\//.test(u));
}

function walk(dir, rel, out) {
  fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).forEach((d) => {
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) walk(dir, r, out); else out.push(r);
  });
  return out;
}

/* Every invariant, as [name, ok, detail] rows for the caller to report. */
function check(dir) {
  const rows = [];
  const ok = (name, cond, detail) => rows.push([name, !!cond, detail]);
  const w = worker(dir);
  const V = w.VERSION;

  ok('the worker carries a built version, not the placeholder',
    /^\d{13}$/.test(V) && /^\d{13}$/.test(w.ART_VERSION) && !w.DEV,
    'VERSION ' + V + ', ART_VERSION ' + w.ART_VERSION);
  ok('and its caches are named for it',
    w.CACHE === 'storehouse-v' + V && w.ART === 'storehouse-art-' + w.ART_VERSION,
    w.CACHE + ' / ' + w.ART);

  /* Every URL the worker holds by version, holds this version. */
  const coreV = w.CORE.filter((u) => /[?&]v=/.test(u));
  const wrong = coreV.filter((u) => !new RegExp('[?&]v=' + V + '$').test(u));
  ok('every versioned file the worker caches carries that version',
    coreV.length >= 9 && wrong.length === 0, wrong.join(' ') || coreV.length + ' files');

  /* And every page that loads the app's files asks for exactly those URLs —
     index.html, and the handout, which loads the recipes and the code. */
  const core = new Set(w.CORE.map((u) => u.replace(/^\.\//, '')));
  ['index.html', 'share/index.html'].forEach((page) => {
    const f = path.join(dir, page);
    if (!fs.existsSync(f)) { ok(page + ' is in the site', false, 'missing'); return; }
    const up = page.split('/').length - 1;
    const list = assets(fs.readFileSync(f, 'utf8'));
    const bad = list.filter((u) => {
      const rel = path.posix.normalize(path.posix.join(path.posix.dirname(page), u));
      return !new RegExp('[?&]v=' + V + '$').test(u) || !core.has(rel);
    });
    ok(page + ' loads the app’s files at this version, and only files the worker keeps',
      list.length > (up ? 1 : 8) && bad.length === 0, bad.join(' ') || list.length + ' files');
  });

  /* No placeholder survived into anything that ships. */
  const files = walk(dir, '', []);
  const left = files.filter((f) => /\.(html|js|css)$/.test(f))
    .filter((f) => /[?&]v=0(?![\w.-])/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  ok('no page or script still asks for the unbuilt ?v=0', left.length === 0, left.join(' '));

  /* The version is the hash of the bytes that ship — the files the worker
     holds as the app, the covers it keeps with them, and the worker — with
     the version itself read back out. A file edited after the build, or a
     build that wrote something other than what it hashed, fails here. */
  const covered = [...new Set(w.CORE.concat(w.COVERS).map(site.fileOf).concat('sw.js'))];
  const back = covered.map((f) => [f, Buffer.from(fs.readFileSync(path.join(dir, f), 'latin1')
    .split(V).join(site.UNBUILT), 'latin1')]);
  const again = site.contentVersion(back);
  ok('and the version is the hash of the files it covers', again === V, again + ' from the files, ' + V + ' in them');
  const liftFiles = files.filter((f) => /^art\/lifts\/[^/]+\.gif$/.test(f));
  const art = site.contentVersion(w.EXTRAS.map(site.fileOf).concat(liftFiles).map((f) => [f, fs.readFileSync(path.join(dir, f))]));
  ok('the art cache is named for the pictures and typefaces in it', art === w.ART_VERSION,
    art + ' from the files, ' + w.ART_VERSION + ' in the worker');

  /* What stays in the repository stays there. */
  const shipped = files.filter((f) => site.excluded(f));
  ok('nothing that is not the site ships with it — no tests, tools, source art or preview',
    shipped.length === 0 && !fs.existsSync(path.join(dir, 'art', 'src')) &&
    !fs.existsSync(path.join(dir, 'preview.html')) && !fs.existsSync(path.join(dir, 'tests')),
    shipped.slice(0, 8).join(' '));
  return rows;
}

module.exports = { check, worker, assets };
