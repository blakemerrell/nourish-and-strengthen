/* ---------------------------------------------------------------------------
 * src/sync.js, run against the Firestore emulator under firestore.rules.
 *
 *     cd tests/rules && npm ci && npm test
 *
 * rules.check.js asks the rules about writes written out by hand. This runs
 * the app's own sync code on two and more phones, with the Firebase client
 * the app ships (emufire.js), so what is checked is what a phone actually
 * sends. Two things only this can catch:
 *
 *   The app and the rules disagreeing. A rule that refuses a write the app
 *   makes passes every check in rules.check.js and breaks every phone. The
 *   workflow that publishes the rules runs this first, so such a rule never
 *   reaches the live project.
 *
 *   The stand-in being wrong. The Node suites in tests/ run sync.js against
 *   tests/fixtures/fakefire.js, which has no transactions, no rules, and
 *   snapshots whose metadata never changes. Claiming a code and spending an
 *   invite are transactions, the members list is all rules, and "synced" is
 *   read from the metadata. Until this, those ran only by hand against the
 *   live project (tests/sync*.test.js), and the rules now refuse how those
 *   suites set up and clear their test households.
 *
 * Never the live project: the project id is a demo- one.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { startEmulator } = require('./emulator.js');
const { world, until } = require('./emufire.js');

const RULES = fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-storehouse-sync';

let passed = 0, failed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed++;
    failures.push(name);
    console.log('  ✗ ' + name + '\n      ' + String((e && e.message) || e).split('\n')[0]);
  }
}
function section(name) { console.log('\n' + name); }
function ok(cond, what) { if (!cond) throw new Error(what); }

(async () => {
  const emu = await startEmulator();
  let env, w;
  try {
    env = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES, host: '127.0.0.1', port: emu.port }
    });
    const read = async (p) => {
      let d = null;
      await env.withSecurityRulesDisabled(async (ctx) => {
        const s = await ctx.firestore().doc(p).get();
        d = s.exists ? s.data() : null;
      });
      return d;
    };
    const seed = (p, data) => env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc(p).set(data));
    const has = (S, day, id) => S.day(day).some((e) => e && e.id === id);
    // a dinner on a day of a week, as the server holds it: an id, or { i, x }
    const served = async (c, wk, day, id) => {
      const d = await read('households/' + c);
      const list = ((((d && d.weeks) || {})[wk] || {}).plan || {})[day] || [];
      return list.some((e) => e === id || (e && e.i === id));
    };
    const synced = (P, who) => until(() => P.S.status === 'synced', who + ' synced (it says "' + P.S.status + '": ' + P.S.statusNote + ')');

    w = world(emu.port, PROJECT);
    const paths = (who) => w.writes.filter((x) => x.who === who).map((x) => x.update ? x.update.join(',') : 'set').join(' | ');

    section('Two phones, one household');
    const A = w.phone('alice', {}, { account: true });
    A.S.init(() => {});
    let code = '';
    await check('a new household is claimed in one transaction, with its maker on the list', async () => {
      code = await A.S.createHousehold();
      await synced(A, 'alice');
      const d = await read('households/' + code);
      ok(d && JSON.stringify(d.members) === '["alice"]' && d.weeks && d.active,
        'server holds ' + JSON.stringify(d && { members: d.members, active: d.active }));
    });
    const B = w.phone('bob', {});
    B.S.init(() => {});
    await check('a second phone joins by the code alone', async () => {
      B.S.join(code);
      await synced(B, 'bob');
      ok(B.S.house === code, 'bob is in ' + B.S.house);
    });
    await check('a dinner one phone adds, the other hears', async () => {
      A.S.addToDay(42, 'mon');
      await until(() => has(B.S, 'mon', 42), 'bob hearing dinner 42 on Monday');
    });
    await check('and a check-off goes the other way', async () => {
      B.S.toggleChecked('milk');
      await until(() => A.S.isChecked('milk'), 'alice hearing milk ticked');
    });
    await check('each phone says "synced" once the server has its write', async () => {
      A.S.addToDay(43, 'tue');
      await until(() => has(B.S, 'tue', 43), 'bob hearing dinner 43');
      await synced(A, 'alice');
      await synced(B, 'bob');
    });
    await check('an anonymous phone is never put on the list, and never asks to be', async () => {
      const d = await read('households/' + code);
      ok(JSON.stringify(d.members) === '["alice"]', 'members ' + JSON.stringify(d.members));
      ok(!/members/.test(paths('bob')), 'bob wrote ' + paths('bob'));
    });

    section('With no signal, and back');
    await check('what a phone does offline reaches the other once it is back', async () => {
      await B.offline();
      B.S.addToDay(77, 'wed');
      B.S.toggleChecked('eggs');
      ok(has(B.S, 'wed', 77) && B.S.isChecked('eggs'), 'bob does not show his own offline change');
      await B.online();
      await until(() => has(A.S, 'wed', 77) && A.S.isChecked('eggs'), 'alice hearing what bob did offline');
      await synced(B, 'bob');
    });

    section('Claiming a code somebody already has');
    await check('a code already taken is left alone, and another is drawn', async () => {
      await seed('households/TAKEN-1234-CODE-HERE', { favs: [], weeks: {}, mine: { u1: { id: 'u1', book: 3, name: 'Not yours', ing: [], steps: [] } }, members: [] });
      const C = w.phone('carol', {}, { account: true });
      C.S.init(() => {});
      const got = await C.S.createHousehold('TAKEN-1234-CODE-HERE');
      ok(got !== 'TAKEN-1234-CODE-HERE', 'carol was given the taken code');
      const d = await read('households/TAKEN-1234-CODE-HERE');
      ok(d.mine.u1.name === 'Not yours' && JSON.stringify(d.members) === '[]', 'the taken household changed: ' + JSON.stringify(d.members));
      await until(async () => !!(await read('households/' + got)), 'carol\'s own household existing');
    });

    section('Accounts on the list');
    const D = w.phone('dave', {}, { account: true });
    D.S.init(() => {});
    await check('an account that joins is put on the list, once', async () => {
      D.S.join(code);
      await synced(D, 'dave');
      await until(async () => (await read('households/' + code)).members.indexOf('dave') >= 0, 'dave on the list');
      const asks = w.writes.filter((x) => x.who === 'dave' && x.update && x.update.indexOf('members') >= 0).length;
      ok(asks === 1, 'dave asked ' + asks + ' times');
    });
    await check('leaving takes the account off it again', async () => {
      D.S.leave();
      await until(async () => (await read('households/' + code)).members.indexOf('dave') < 0, 'dave off the list');
    });
    await check('a full list refuses the next account; it asks once, and the household still works', async () => {
      const full = ['alice'];
      for (let i = 1; full.length < 50; i++) full.push('member' + i);
      await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('households/' + code).update({ members: full }));
      const E = w.phone('erin', {}, { account: true });
      E.S.init(() => {});
      E.S.join(code);
      await synced(E, 'erin');
      E.S.addToDay(55, 'thu');
      await until(() => has(A.S, 'thu', 55), 'alice hearing erin\'s dinner');
      A.S.addToDay(56, 'thu');
      await until(() => has(E.S, 'thu', 56), 'erin hearing alice\'s dinner');
      const asks = w.writes.filter((x) => x.who === 'erin' && x.update && x.update.indexOf('members') >= 0).length;
      const d = await read('households/' + code);
      ok(asks === 1 && d.members.length === 50 && d.members.indexOf('erin') < 0, 'erin asked ' + asks + ' times; list ' + d.members.length);
      await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('households/' + code).update({ members: ['alice'] }));
    });

    section('Invites');
    let link = '';
    await check('a member makes a link', async () => {
      link = await A.S.invite();
      ok(/^https:\/\/example\.test\/nourish-and-strengthen\/\?invite=[0-9a-z]{24}$/.test(link), 'link ' + link);
    });
    const token = () => link.split('invite=')[1];
    const F = w.phone('frank', {}, { account: true });
    F.S.init(() => {});
    await check('an account spends it and is in the household, and on its list', async () => {
      const got = await F.S.redeem(token());
      ok(got === code, 'frank was sent to ' + got);
      await synced(F, 'frank');
      const d = await read('households/' + code), inv = await read('invites/' + token());
      ok(d.members.indexOf('frank') >= 0 && inv.used === true && inv.usedBy === 'frank',
        JSON.stringify({ members: d.members, used: inv.used, usedBy: inv.usedBy }));
    });
    await check('the same link a second time is spent', async () => {
      const G = w.phone('grace', {}, { account: true });
      G.S.init(() => {});
      const said = await G.S.redeem(token()).then(() => 'joined', (e) => e.message);
      ok(said === 'spent' && G.S.house === '', 'grace was told "' + said + '" and is in "' + G.S.house + '"');
    });
    await check('a link that never existed is gone', async () => {
      const H = w.phone('heidi', {}, { account: true });
      H.S.init(() => {});
      const said = await H.S.redeem('nosuchtoken0000000000000').then(() => 'joined', (e) => e.message);
      ok(said === 'gone', 'heidi was told "' + said + '"');
    });
    await check('a link past its week is spent, and lets nobody in', async () => {
      await seed('invites/oldtoken0000000000000000', { house: code, by: 'alice', made: Date.now() - 9 * 86400000, exp: Date.now() - 86400000, used: false });
      const I = w.phone('ivan', {}, { account: true });
      I.S.init(() => {});
      const said = await I.S.redeem('oldtoken0000000000000000').then(() => 'joined', (e) => e.message);
      const d = await read('households/' + code);
      ok(said === 'spent' && d.members.indexOf('ivan') < 0, 'ivan was told "' + said + '"; list ' + JSON.stringify(d.members));
    });
    await check('an anonymous phone cannot make one', async () => {
      const said = await B.S.invite().then(() => 'made', (e) => e.message);
      ok(said === 'signed-out', 'bob was told "' + said + '"');
    });

    section('What a phone does not lose');
    await check('a join made with no signal still brings this phone\'s things after a restart', async () => {
      const ls = { 'bsc.favs': '[7,8,9]', 'bsc.rate': JSON.stringify({ 7: 2 }) };
      const K1 = w.phone('kim', ls);
      await K1.offline();
      K1.S.init(() => {});
      K1.S.join(code);
      await until(() => ls['bsc.house'] === JSON.stringify(code), 'the code saved on kim\'s phone');
      const K2 = w.phone('kim', ls);              // the app opened again, now with signal
      K2.S.init(() => {});
      await synced(K2, 'kim');
      await until(async () => {
        const d = await read('households/' + code);
        return [7, 8, 9].every((f) => d.favs.indexOf(f) >= 0) && d.rate && d.rate[7] === 2;
      }, 'kim\'s favorites and rating in the household');
      ok(K2.S.isFav(8), 'kim\'s phone lost favorite 8');
    });
    await check('a serving count changed with no signal is handed over whole, before the signal returns', async () => {
      A.S.addToDay(61, 'sat');
      await until(() => has(B.S, 'sat', 61), 'bob hearing dinner 61');
      await A.offline();
      const before = w.writes.filter((x) => x.who === 'alice').length;
      A.S.addToDay(61, 'sat', 3);
      const handed = w.writes.filter((x) => x.who === 'alice').length - before;
      await A.online();
      await until(() => B.S.day('sat').some((e) => e.id === 61 && e.x === 3), 'bob hearing 61 for three');
      ok(handed === 2, handed + ' of the 2 writes were with Firestore before the signal came back');
    });
    await check('a write refused before the connection was up holds up nothing behind it', async () => {
      const own = {};
      for (let i = 0; i < 1000; i++) own['own_x' + i] = { l: 'X' + i, c: 'Yours' };
      await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('households/' + code).update({ pantryNew: own }));
      const ls = { 'bsc.house': JSON.stringify(code), 'bsc.houseNew': JSON.stringify('') };
      const L = w.phone('liam', ls);
      L.S.init(() => {});
      L.S.addPantryItem('Saffron', 'Yours');      // the shelf is at its cap: refused
      L.S.addToDay(71, 'sun');                    // and this is not
      await until(() => served(code, L.S.state.active, 'sun', 71), 'dinner 71 on the server');
      A.S.addToDay(72, 'sun');
      await until(() => has(L.S, 'sun', 72), 'liam hearing alice afterwards');
      await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('households/' + code).update({ pantryNew: {} }));
    });
    await check('a write made the moment another code is typed goes to that household', async () => {
      const N = w.phone('nina', {}, { account: true });
      N.S.init(() => {});
      const other = await N.S.createHousehold();
      await synced(N, 'nina');
      await until(async () => !!(await read('households/' + other)), 'nina\'s household');
      B.S.join(other);
      B.S.toggleChecked('saffron');
      await until(async () => JSON.stringify(await read('households/' + other)).indexOf('saffron') >= 0, 'saffron ticked in nina\'s household');
      ok(JSON.stringify(await read('households/' + code)).indexOf('saffron') < 0, 'saffron was ticked in the household bob left');
      B.S.join(code);
      await synced(B, 'bob');
    });
    await check('a household whose rules refuse the tidying is asked once, not in a loop', async () => {
      await seed('households/REFUSES-ALL', { favs: [], weeks: { d20250105: { name: '', ord: 0, plan: { mon: [1] }, checked: {} } }, mine: {}, edits: {}, zzz: 1 });
      const M = w.phone('mia', {});
      M.S.init(() => {});
      M.S.join('REFUSES-ALL');
      const n = () => w.writes.filter((x) => x.who === 'mia').length;
      await until(() => n() >= 1, 'mia trying to tidy the old week');
      /* The tidy-ups of the first snapshot all leave before the first refusal
         is back, so there are a few. What matters is that they stop: the same
         household took 213 in three seconds before. */
      await new Promise((r) => setTimeout(r, 1000));
      const first = n();
      await new Promise((r) => setTimeout(r, 1000));
      ok(n() === first && first <= 5, 'mia sent ' + first + ' writes, then ' + (n() - first) + ' more in the next second');
    });

    section('Nothing went wrong along the way');
    await check('no phone threw', async () => {
      const all = [A, B, D, F].map((P) => P.errors).reduce((a, b) => a.concat(b), []);
      ok(all.length === 0, all.join('; '));
    });
  } finally {
    if (w) await w.end();
    if (env) await env.cleanup();
    emu.proc.kill();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { failures.forEach((f) => console.log('  ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
