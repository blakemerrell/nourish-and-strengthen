/* ---------------------------------------------------------------------------
 * The site as it is served, built from the repository into _site/.
 *
 *     node tools/build-site.js               _site/, minified
 *     node tools/build-site.js --no-minify   the same, with every comment kept
 *     node tools/build-site.js <dir>         somewhere else
 *
 * GitHub Pages used to serve the repository itself, straight off main, and the
 * version that gets a phone off its cached copy was a number kept in the files:
 * ?v=N on ten lines of index.html, eleven of sw.js and the cache name, bumped
 * by tools/bump-version.js. That had two faults, and they were the same fault.
 * Forget the bump and phones keep the old app with nothing to say so — it
 * reached main eleven times. Remember it on two branches cut from the same
 * commit and both pick N+1, so every merge conflicted on twenty-odd lines that
 * nobody had meant to change. A number in the files is a number somebody has
 * to keep, and two people keep it differently.
 *
 * So the files carry a placeholder, ?v=0, and this writes the real version in
 * on the way out: a hash of every file the service worker holds as the app,
 * the worker included. It is computed rather than chosen, so the same files
 * always give the same version — two branches that end up identical agree
 * without talking — and changed files always give a new one, so there is
 * nothing to forget. The deploy workflow runs this and publishes _site/;
 * the repository never sees the number at all.
 *
 * What ships is only what the site serves. The 105 MB of source engravings,
 * the tests and tools, the design archive and the generated preview all
 * stayed in the repository and all went out with every deploy; they do not
 * now. The scripts, the data, the worker and the stylesheet go out with their
 * comments stripped — this codebase explains itself at length, which is right
 * for somebody reading it and a cost for a phone on one bar of signal. The
 * repository keeps every word.
 *
 * Run the suite against what this produces with `npm run test:site`, which is
 * what CI does and what the deploy does before it publishes anything.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* The placeholder, as it appears in the committed files. The worker explains
   why it is a digit rather than a word. */
const UNBUILT = '0';

/* Not part of the site. Each is here for a reason, and anything not listed
   ships — a new page added at the top level should go out without anybody
   remembering to come here, and a stray file going out is the cheaper
   mistake of the two.
 *
   Matched against the path from the repository root, with forward slashes. */
const EXCLUDE = [
  [/^_site(\/|$)/, 'this output'],
  [/^node_modules\//, 'dependencies of the tools'],
  [/(^|\/)\./, 'dotfiles: .git, .github, .gitignore, .nojekyll, .firebaserc'],
  [/^tests\//, 'the suite'],
  [/^tools\//, 'the build and print tools'],
  [/^android\//, 'the Android app project'],
  [/^scratch\//, 'local scratch files'],
  [/^design\//, 'the original prototype and its transcript; nothing links to it'],
  [/^art\/src\//, '105 MB of source engravings; art/*.png are prepared from them'],
  [/^art\/svg\//, 'a proposal for drawn section art, not used by any page'],
  [/^art\/contact-sheet\.png$/, 'prep-art --preview output, ignored by git'],
  [/^preview\.html$/, 'tools/build-preview.js output, 3 MB, linked from nowhere'],
  [/\.md$/, 'README, SETUP, AUDIT and the notes beside the art'],
  [/^package(-lock)?\.json$/, 'npm'],
  [/^firebase\.json$|^firestore\.rules$/, 'Firebase configuration, deployed with the firebase CLI'],
  [/^welcome\/demo\/stamp\.json$/, 'records which build the demo frames were taken of, for the suite'],
  [/^print\/Storehouse-Handout\.json$/, 'records what the handout PDF was rendered from, for the suite'],
];

function excluded(rel) {
  return EXCLUDE.some(([re]) => re.test(rel));
}

/* Every file under the root that the site should carry, sorted, so the
   output does not depend on the order a filesystem happens to list in. */
function listFiles(root) {
  const out = [];
  (function walk(dir) {
    fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((d) => {
      const rel = dir ? dir + '/' + d.name : d.name;
      if (excluded(rel) || excluded(rel + '/')) return;
      if (d.isDirectory()) walk(rel);
      else if (d.isFile()) out.push(rel);
    });
  })('');
  return out.sort();
}

/* The worker's own lists, read by running it rather than by pattern. Its
   CORE and EXTRAS are the definition of what the app is and what its art is;
   reading them here means a file added to either is covered by the version
   without anybody coming back to this file. */
function readWorker(src) {
  const self = {
    location: new URL('https://example.invalid/app/sw.js'),
    addEventListener() {},
  };
  const box = { self, URL, caches: {}, console };
  vm.createContext(box);
  vm.runInContext(src + '\n;this.__worker = { VERSION: VERSION, ART_VERSION: ART_VERSION, ' +
    'CACHE: CACHE, ART: ART, DEV: DEV, CORE: CORE, EXTRAS: EXTRAS, COVERS: COVERS };', box);
  return box.__worker;
}

/* './src/app.js?v=0' -> 'src/app.js' */
function fileOf(u) {
  return u.replace(/^\.\//, '').replace(/[?#].*$/, '');
}

/* A version from a set of files: sha-256 over each path and its bytes, in
   path order, cut to its first forty bits and written as thirteen decimal
   digits. Decimal because the workers already installed on phones read a
   page's version with /v=(\d+)/, and a version they cannot read as a number
   is one they treat as no version at all — see the note on VERSION in
   sw.js. Forty bits is a collision somewhere past a million builds. */
function contentVersion(entries) {
  const h = crypto.createHash('sha256');
  entries.slice().sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).forEach(([rel, buf]) => {
    h.update(rel + '\0' + buf.length + '\0');
    h.update(buf);
  });
  return String(parseInt(h.digest('hex').slice(0, 10), 16)).padStart(13, '0');
}

/* ---- minifying --------------------------------------------------------
 *
 * Deliberately timid. terser removes comments and whitespace and renames the
 * variables local to each function, and does nothing else: no compress pass,
 * so no expression is rewritten, no branch is folded away, and no string is
 * touched. Top-level names are left alone, because the scripts talk to each
 * other through them. Quotes are kept as written, so the placeholders above
 * are still exactly where the source put them when the version is written in.
 *
 * The stylesheet loses its comments and whitespace and nothing else; clean-css
 * with every level-one optimisation off does exactly that.
 *
 * Remembered by content, so a second build in the same process — the suite
 * builds a few — only minifies what changed. */
const MIN = new Map();

async function minifyJs(rel, code) {
  const key = 'js\0' + crypto.createHash('sha256').update(code).digest('hex');
  if (MIN.has(key)) return MIN.get(key);
  const { minify } = require('terser');
  const out = await minify({ [rel]: code }, {
    ecma: 5,
    compress: false,
    mangle: { toplevel: false },
    format: { comments: /^!|@preserve|@license/i, quote_style: 3, ascii_only: false },
  });
  MIN.set(key, out.code);
  return out.code;
}

function minifyCss(code) {
  const key = 'css\0' + crypto.createHash('sha256').update(code).digest('hex');
  if (MIN.has(key)) return MIN.get(key);
  const CleanCSS = require('clean-css');
  const out = new CleanCSS({ level: { 1: { all: false } }, inline: false, rebase: false }).minify(code);
  if (out.errors.length) throw new Error('style.css: ' + out.errors.join('; '));
  MIN.set(key, out.styles);
  return out.styles;
}

/* Which files are minified: the app's scripts, its data, its stylesheet and
   the worker. The pages keep their markup as written. */
function minifiable(rel) {
  return /^(src|data)\/[^/]+\.js$/.test(rel) || rel === 'sw.js' || rel === 'src/style.css';
}

/* ---- the version, written in -------------------------------------------- */

/* ?v=0 in a URL, and nothing that merely starts with a zero. */
const V_URL = new RegExp('([?&]v=)' + UNBUILT + '(?![\\w.-])', 'g');

function declared(name) {
  return new RegExp('(\\b' + name + "\\s*=\\s*')" + UNBUILT + "(')", 'g');
}

function replaceCounted(text, re, to, want, what) {
  let n = 0;
  // the text before the placeholder, and after it when the pattern has a second group
  const out = text.replace(re, (m, a, b) => { n++; return a + to + (typeof b === 'string' ? b : ''); });
  if (want !== undefined ? n !== want : n === 0) {
    throw new Error(what + ': expected ' + (want === undefined ? 'at least one' : want) +
      ' placeholder' + (want === 1 ? '' : 's') + ', found ' + n);
  }
  return out;
}

/* ---- the build ---------------------------------------------------------- */

/* The output is emptied before it is written, so it had better be output.
   `node tools/build-site.js src` would otherwise delete src/. A directory is
   fair game when it is missing, empty, or a site this built before — it has a
   worker and a page and none of the things only a working tree has. */
function safeToEmpty(dir, root) {
  const d = path.resolve(dir), r = path.resolve(root);
  if (d === r || r.startsWith(d + path.sep)) return false;
  if (!fs.existsSync(d)) return true;
  const has = fs.readdirSync(d);
  if (!has.length) return true;
  return has.indexOf('sw.js') >= 0 && has.indexOf('index.html') >= 0 &&
    ['.git', 'package.json', 'tools', 'tests', 'node_modules'].every((x) => has.indexOf(x) < 0);
}

/*
 * opts.root     where to read from (the repository)
 * opts.out      where to write; emptied first
 * opts.minify   true unless false
 * opts.edit     (rel, Buffer) -> Buffer, applied to a file as it is read —
 *               the suite uses it to make "the next build" out of this one
 * opts.include  (rel) -> bool, which files to write. Everything is still read
 *               and hashed; this only saves copying forty megabytes of books
 *               for a test that never opens them.
 */
async function build(opts) {
  const o = { root: ROOT, out: path.join(ROOT, '_site'), minify: true };
  Object.keys(opts || {}).forEach((k) => { if (opts[k] !== undefined) o[k] = opts[k]; });
  const files = listFiles(o.root);
  const src = new Map();
  files.forEach((rel) => {
    let buf = fs.readFileSync(path.join(o.root, rel));
    if (o.edit) buf = o.edit(rel, buf) || buf;
    src.set(rel, buf);
  });

  const out = new Map();
  for (const rel of files) {
    const buf = src.get(rel);
    if (o.minify && minifiable(rel)) {
      const text = buf.toString('utf8');
      out.set(rel, Buffer.from(rel.endsWith('.css') ? minifyCss(text) : await minifyJs(rel, text)));
    } else {
      out.set(rel, buf);
    }
  }

  if (!out.has('sw.js') || !out.has('index.html')) throw new Error('no sw.js or index.html under ' + o.root);
  const worker = readWorker(src.get('sw.js').toString('utf8'));
  if (worker.VERSION !== UNBUILT || worker.ART_VERSION !== UNBUILT) {
    throw new Error('sw.js already carries a version (' + worker.VERSION + '); the repository should say ' + UNBUILT);
  }
  const missing = worker.CORE.concat(worker.EXTRAS, worker.COVERS).map(fileOf).filter((f) => !out.has(f));
  if (missing.length) throw new Error('sw.js caches files the site does not have: ' + missing.join(', '));

  /* The art first, because its version is written into the worker, and the
     worker is part of what the app's version covers. A new picture is
     therefore a new worker and a new app cache as well as a new art cache —
     the app's cache is small, and one version meaning one worker is simpler
     to reason about than two workers sharing a cache name. */
  const liftFiles = files.filter((f) => /^art\/lifts\/[^/]+\.gif$/.test(f));
  const artFiles = worker.EXTRAS.map(fileOf).concat(liftFiles);
  const art = contentVersion(artFiles.map((f) => [f, out.get(f)]));
  let sw = out.get('sw.js').toString('utf8');
  sw = replaceCounted(sw, declared('ART_VERSION'), art, 1, 'sw.js ART_VERSION');
  out.set('sw.js', Buffer.from(sw));

  /* The app: every file the worker holds as the app — the covers too,
     which it keeps in the app's cache — and the worker. */
  const covered = [...new Set(worker.CORE.concat(worker.COVERS).map(fileOf).concat('sw.js'))].sort();
  const version = contentVersion(covered.map((f) => [f, out.get(f)]));
  covered.forEach((f) => {
    if (out.get(f).includes(version)) throw new Error(f + ' already contains ' + version + ' — the version would not read back');
  });

  /* Written into the worker, every page that loads the app's files by
     version, and nowhere else. */
  sw = replaceCounted(sw, declared('VERSION'), version, 1, 'sw.js VERSION');
  sw = replaceCounted(sw, V_URL, version, worker.CORE.filter((u) => /[?&]v=/.test(u)).length, 'sw.js CORE');
  out.set('sw.js', Buffer.from(sw));
  const pages = [];
  files.filter((f) => f.endsWith('.html')).forEach((f) => {
    const text = out.get(f).toString('utf8');
    V_URL.lastIndex = 0;
    if (!V_URL.test(text)) return;
    out.set(f, Buffer.from(replaceCounted(text, V_URL, version, undefined, f)));
    pages.push(f);
  });
  if (pages.indexOf('index.html') < 0) throw new Error('index.html carries no ?v=' + UNBUILT);

  /* A placeholder that survived would be a page asking for the unbuilt
     files in production, where nothing will ever refresh them. */
  const left = [...out.keys()].filter((f) => /\.(html|js|css)$/.test(f))
    .filter((f) => { V_URL.lastIndex = 0; return V_URL.test(out.get(f).toString('utf8')); });
  if (left.length) throw new Error('?v=' + UNBUILT + ' left in ' + left.join(', '));

  if (!safeToEmpty(o.out, o.root)) {
    throw new Error(o.out + ' is not empty and is not a site built before; not emptying it');
  }
  fs.rmSync(o.out, { recursive: true, force: true });
  let written = 0, bytes = 0;
  for (const [rel, buf] of out) {
    if (o.include && !o.include(rel)) continue;
    const dest = path.join(o.out, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    written++; bytes += buf.length;
  }

  return {
    version, art, covered, artFiles, pages, out: o.out, files: written, bytes,
    sizes: covered.concat(worker.EXTRAS.map(fileOf)).map((f) => ({ file: f, raw: src.get(f).length, built: out.get(f).length })),
  };
}

module.exports = { build, contentVersion, readWorker, listFiles, excluded, fileOf, EXCLUDE, UNBUILT, ROOT };

if (require.main === module) {
  const args = process.argv.slice(2);
  const minify = args.indexOf('--no-minify') < 0;
  const dir = args.filter((a) => !a.startsWith('--'))[0];
  const t0 = Date.now();
  build({ minify, out: dir ? path.resolve(dir) : undefined }).then((r) => {
    const zlib = require('zlib');
    const sum = (k) => r.sizes.reduce((n, s) => n + s[k], 0);
    const gz = (f, k) => zlib.gzipSync(k === 'raw' ? fs.readFileSync(path.join(ROOT, f)) :
      fs.readFileSync(path.join(r.out, f)), { level: 9 }).length;
    const core = r.sizes.filter((s) => r.covered.indexOf(s.file) >= 0);
    const gzRaw = core.reduce((n, s) => n + gz(s.file, 'raw'), 0);
    const gzBuilt = core.reduce((n, s) => n + gz(s.file, 'built'), 0);
    const kb = (n) => (n / 1024).toFixed(0) + ' KB';
    console.log('_site: ' + r.files + ' files, ' + (r.bytes / 1048576).toFixed(1) + ' MB  -> ' +
      path.relative(process.cwd(), r.out) + '/');
    console.log('version ' + r.version + '   art ' + r.art + '   written into sw.js, ' + r.pages.join(', '));
    console.log('the app: ' + kb(core.reduce((n, s) => n + s.raw, 0)) + ' as written, ' +
      kb(core.reduce((n, s) => n + s.built, 0)) + ' as shipped' +
      '  (gzipped ' + kb(gzRaw) + ' -> ' + kb(gzBuilt) + ')' + (minify ? '' : '  [not minified]'));
    console.log('precache: ' + kb(sum('built')) + ' for a first install, of which ' +
      kb(sum('built') - core.reduce((n, s) => n + s.built, 0)) + ' is art and type that later deploys reuse' +
      '   (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
