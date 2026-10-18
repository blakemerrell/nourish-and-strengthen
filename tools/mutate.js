/*
 * Mutation testing — the only honest answer to "is this test any good?".
 *
 * A green suite says nothing on its own. It says the code passes the tests,
 * not that the tests would notice if the code were wrong. So this breaks
 * something a person actually depends on, runs the lot, and asks whether
 * anything went red. A mutation that survives is a gap: the suite believes it
 * is asserting a rule and is in fact asserting an example that happens to be
 * true either way.
 *
 * Twelve of these were run over the suite. Eight were caught. Four were not:
 *
 *   esc() stops escaping            nothing tested escaping at all
 *   flagged seasonings unmarked     the test checked the foot and the lines
 *                                   agreed, and they agreed about nothing
 *   the cache name stops moving     the name and the asset version were free
 *                                   to drift, and already had, by one
 *   a week planned on the wrong day  the remote write path, which the default
 *                                   run cannot reach — see tests/sync.test.js
 *
 * The first three are covered now, each verified by running its own mutation
 * again and watching it fail. The fourth is a boundary rather than an
 * oversight and is left standing on purpose: every remote write rests on
 * tests/sync.test.js, which needs a network and is not in the default run.
 *
 * Run: node tools/mutate.js   (about two minutes per mutation)
 * Every mutation is written to the file and restored in a finally, so an
 * interrupted run leaves the tree as it found it. Check `git status` after.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const M = [
  ['shopping list stops adding duplicates together', 'src/list.js',
   'bucket[key].g += it.g * e.x;', 'bucket[key].g = it.g * e.x;'],
  ['scaling is ignored', 'src/sync.js',
   'var entry = { id: id, x: x || 1, lo: !!lo };', 'var entry = { id: id, x: 1, lo: !!lo };'],
  ['esc() stops escaping', 'src/app.js',
   ".replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')", '.replace(/\\u0000/g, "")'],
  ['leaf bands shift so everything looks good', 'src/app.js',
   "return n >= 70 ? 'good' : n >= 45 ? 'ok' : 'low';", "return n >= 10 ? 'good' : n >= 5 ? 'ok' : 'low';"],
  ['ticks are never pruned when a recipe leaves the week', 'src/sync.js',
   'var stale = Object.keys(state.checked).filter(function (k) { return !live[k] && KEY_OK.test(k); });',
   'var stale = [];'],
  ['flagged seasonings stop being marked again', 'src/shelf.js',
   "if (it.k === 'free') return !!it.x;", "if (it.k === 'free') return false;"],
  ['the pantry stops saving', 'src/sync.js',
   'write(LS.pantry, state.pantry); write(LS.pantryNew, state.pantryNew);', ''],
  ['favorites stop persisting', 'src/sync.js', 'write(LS.favs, state.favs);', ''],
  ['the service worker stops caching the scripts', 'sw.js',
   "  './src/app.js?v=0',\n", ''],
  ['the cache name stops changing between builds', 'sw.js',
   "var CACHE = 'storehouse-v' + VERSION;", "var CACHE = 'storehouse-fixed';"],
  ['a versioned file is fetched again on every open', 'sw.js',
   "  var v = url.searchParams.get('v');\n  if (v) {", "  var v = url.searchParams.get('v');\n  if (false) {"],
  ['an install keeps a page from another build', 'sw.js',
   'if (v.length !== 1 || v[0] !== VERSION) {', 'if (false) {'],
  ['joining stops carrying your own recipes across', 'src/sync.js',
   "['mine', 'edits', 'pantry', 'pantryNew'].concat(MAPS", "['edits', 'pantry', 'pantryNew'].concat(MAPS"],
  ['a week can be planned onto the wrong day', 'src/sync.js',
   "function wpath(suffix) { return 'weeks.' + state.active + (suffix ? '.' + suffix : ''); }",
   "function wpath(suffix) { return 'weeks.' + state.active + (suffix ? '.' + String(suffix).replace('tue','wed') : ''); }"],
  ['a day leaves the one record before its year holds it', 'src/signin.js',
   '        if (!dyHolds(DY.seenY, p, enc, was)) return;\n', ''],
  ['a whole push sends every day again, however many years of them', 'src/dayup.js',
   'var owed = !((had[enc] || 0) >= at)', 'var owed = true'],
];

/* The list is read by tests/mutants.test.js, which fails the moment a
   mutation's text is no longer in its file. A mutation that finds nothing
   to change is skipped here, and a skip said only in the last lines of a
   long run is how two of these went unnoticed: one from 29 September, one
   from 3 October, after the code they break was rewritten. */
module.exports = { M };
if (require.main === module) run();

function run() {
  const results = [];
  for (const [name, file, from, to, altFile] of M) {
    const target = fs.existsSync(`${ROOT}/${file}`) && fs.readFileSync(`${ROOT}/${file}`, 'utf8').includes(from)
      ? file : (altFile || file);
    const p = `${ROOT}/${target}`;
    const orig = fs.readFileSync(p, 'utf8');
    if (!orig.includes(from)) { results.push([name, 'SKIP', 'pattern not found in ' + target]); continue; }
    fs.writeFileSync(p, orig.replace(from, to));
    let caught = false, detail = '';
    try {
      /* MUTANT names the mutation in place, so tests/mutants.test.js leaves
         that one alone. Its text is gone because it was mutated, and the
         guard failing would count as caught, whatever else noticed. */
      const out = execSync('node tests/run.js 2>&1', { cwd: ROOT, encoding: 'utf8', timeout: 600000,
        env: Object.assign({}, process.env, { MUTANT: name }) });
      const m = out.match(/(\d+) passed, (\d+) failed/);
      caught = m && Number(m[2]) > 0;
      detail = m ? m[0] : 'no summary';
      if (caught) {
        const first = (out.match(/^\s+✗ .+$/m) || [''])[0].trim();
        detail += ' — ' + first;
      }
    } catch (e) {
      caught = true; detail = 'suite errored (counts as caught)';
    } finally {
      fs.writeFileSync(p, orig);
    }
    results.push([name, caught ? 'caught' : 'SURVIVED', detail]);
    console.log((caught ? '  caught   ' : '  SURVIVED') + '  ' + name + '  [' + detail + ']');
  }
  console.log('\n--- survivors ---');
  results.filter(r => r[1] === 'SURVIVED').forEach(r => console.log('  ' + r[0]));
  results.filter(r => r[1] === 'SKIP').forEach(r => console.log('  (skipped) ' + r[0] + ': ' + r[2]));
  fs.writeFileSync(path.join(os.tmpdir(), 'mutants.json'), JSON.stringify(results, null, 1));
  if (results.some((r) => r[1] !== 'caught')) process.exitCode = 1;
}
