/* ---------------------------------------------------------------------------
 * firestore.rules, checked against the Firestore emulator.
 *
 *     cd tests/rules && npm ci && npm test
 *
 * Every pull request runs this, and so does the workflow that publishes the
 * rules (.github/workflows/rules.yml), before it publishes: nothing reaches
 * the live project that has not passed here first. It starts Google's own
 * Firestore emulator (emulator.js) and asks it, as different people, to do
 * what the app does and what somebody holding a household code might try
 * instead. sync.check.js, run after it, does the same with the app itself.
 *
 * It never touches the live project: the project id is a demo- one, which
 * the SDK refuses to send anywhere but the emulator.
 *
 * Kept out of tests/run.js because it needs Java and these packages, which
 * nothing the app ships needs. CI runs it as its own job.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertSucceeds, assertFails
} = require('@firebase/rules-unit-testing');
const firebase = require('firebase/compat/app').default;
require('firebase/compat/firestore');
const { startEmulator } = require('./emulator.js');

const FV = firebase.firestore.FieldValue;
const RULES = fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8');
const DAY = 86400000;

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

/* A household as the app writes one: what localDoc() in src/sync.js sends
   when a phone seeds a new code. */
function seedDoc(extra) {
  return Object.assign({
    favs: [3, 'u1'],
    weeks: {
      w1: { name: 'This Week', ord: 0, plan: { mon: [12], tue: [{ i: 40, x: 2 }] }, checked: {} },
      w2: { name: 'Next', ord: 1, plan: {}, checked: {} }
    },
    active: 'w1',
    mine: {
      u1: { id: 'u1', book: 3, name: 'Ours', ing: [], steps: [] },
      u2: { id: 'u2', book: 3, name: 'Also ours', ing: [], steps: [] },
      u3: { id: 'u3', book: 3, name: 'And this', ing: [], steps: [] }
    },
    edits: { 12: { name: 'Changed' } },
    pantry: { rice: 1 }, pantryNew: { own_saffron: { l: 'Saffron', c: 'Yours' }, own_mace: { l: 'Mace', c: 'Yours' } },
    kitchen: {}, src: {}, rate: {}, opts: {}, low: {}
  }, extra || {});
}

(async () => {
  const emu = await startEmulator();
  let env;
  try {
    env = await initializeTestEnvironment({
      projectId: 'demo-storehouse-rules',
      firestore: { rules: RULES, host: '127.0.0.1', port: emu.port }
    });
    const as = (uid) => env.authenticatedContext(uid).firestore();
    const nobody = () => env.unauthenticatedContext().firestore();
    const seed = async (p, data) => {
      await env.withSecurityRulesDisabled(async (ctx) => { await ctx.firestore().doc(p).set(data); });
    };
    const read = async (p) => {
      let d = null;
      await env.withSecurityRulesDisabled(async (ctx) => { d = (await ctx.firestore().doc(p).get()).data(); });
      return d;
    };
    const H = 'households/KETTLE-1234-WILLOW';
    const fresh = async (extra) => { await env.clearFirestore(); await seed(H, seedDoc(extra)); };

    section('Households: who can reach one');
    await fresh({ members: ['alice'] });
    await check('somebody signed in, even anonymously, can fetch it by its code', () =>
      assertSucceeds(as('stranger').doc(H).get()));
    await check('nobody signed in cannot', () => assertFails(nobody().doc(H).get()));
    await check('nobody can list the households', () => assertFails(as('alice').collection('households').get()));
    await check('nobody can delete one, not even a member', () => assertFails(as('alice').doc(H).delete()));

    section('Households: making one');
    await env.clearFirestore();
    await check('a phone seeds a new code with what it has, as it always has', () =>
      assertSucceeds(as('anon1').doc('households/NEW-1').set(seedDoc())));
    await check('a signed-in phone can put itself on the list as it makes it', () =>
      assertSucceeds(as('alice').doc('households/NEW-2').set(seedDoc({ members: ['alice'] }))));
    await check('but not somebody else', () =>
      assertFails(as('alice').doc('households/NEW-3').set(seedDoc({ members: ['alice', 'mallory'] }))));
    await check('a field the app has never written is refused', () =>
      assertFails(as('alice').doc('households/NEW-4').set(seedDoc({ script: '<img>' }))));
    await check('and so is a field of the wrong kind', () =>
      assertFails(as('alice').doc('households/NEW-5').set(seedDoc({ weeks: 'all of them' }))));

    section('Households: every write the app makes still goes through');
    await fresh({ members: ['alice'] });
    const ann = as('anon2'), hd = ann.doc(H);
    await check('a dinner added to a day (arrayUnion on that day)', () =>
      assertSucceeds(hd.update({ 'weeks.w1.plan.mon': FV.arrayUnion(15) })));
    await check('a dinner taken off a day (arrayRemove)', () =>
      assertSucceeds(hd.update({ 'weeks.w1.plan.mon': FV.arrayRemove(12) })));
    await check('a day written whole (a serving count changed)', () =>
      assertSucceeds(hd.update({ 'weeks.w1.plan.tue': [{ i: 40, x: 3 }] })));
    await check('a list item ticked and unticked', async () => {
      await assertSucceeds(hd.update({ 'weeks.w1.checked.milk': true }));
      await assertSucceeds(hd.update({ 'weeks.w1.checked.milk': FV.delete() }));
    });
    await check('a week added, renamed, switched to, and deleted', async () => {
      await assertSucceeds(hd.update({ active: 'w3', 'weeks.w3': { name: 'New week', ord: 2, plan: {}, checked: {} } }));
      await assertSucceeds(hd.update({ 'weeks.w3.name': 'Later' }));
      await assertSucceeds(hd.update({ active: 'w1' }));
      await assertSucceeds(hd.update({ active: 'w1', 'weeks.w3': FV.delete() }));
    });
    await check('a week emptied', () =>
      assertSucceeds(hd.update({ 'weeks.w2.plan': {}, 'weeks.w2.checked': {} })));
    await check('a recipe written, and one deleted with its favourite and its days', async () => {
      await assertSucceeds(hd.update({ 'mine.u9': { id: 'u9', book: 3, name: 'Mine', ing: [], steps: [] } }));
      await assertSucceeds(hd.update({ 'mine.u1': FV.delete() }));
      await assertSucceeds(hd.update({ favs: FV.arrayRemove('u1'), 'weeks.w1.plan.mon': FV.arrayRemove('u1') }));
    });
    await check('a favourite starred and unstarred', async () => {
      await assertSucceeds(hd.set({ favs: FV.arrayUnion(99) }, { merge: true }));
      await assertSucceeds(hd.set({ favs: FV.arrayRemove(99) }, { merge: true }));
    });
    await check('the pantry answered, reset to the book, and added to', async () => {
      await assertSucceeds(hd.update({ 'pantry.beans': 0 }));
      await assertSucceeds(hd.set({ pantry: {} }, { merge: true }));
      await assertSucceeds(hd.update({ 'pantryNew.own_clove': { l: 'Clove', c: 'Yours' } }));
      await assertSucceeds(hd.update({ 'pantryNew.own_clove': FV.delete() }));
    });
    await check('a joining phone contributes what the household lacks', () =>
      assertSucceeds(hd.set({ mine: { u7: { id: 'u7', book: 3, name: 'Brought', ing: [], steps: [] } }, favs: [3, 'u1', 5] }, { merge: true })));
    await check('a household from the one-week version gets its weeks', () =>
      assertSucceeds(hd.set({ weeks: { w1: { name: 'This Week', ord: 0, plan: {}, checked: {} } }, active: 'w1' }, { merge: true })));
    await check('the shared maps set and cleared a key at a time', async () => {
      await assertSucceeds(hd.update({ 'kitchen.salt': 1, 'rate.12': 2, 'opts.store': 0, 'low.oil': 1, 'src.rice': 'b' }));
      await assertSucceeds(hd.update({ 'low.oil': FV.delete() }));
    });

    section('Households: what somebody with the code can no longer do');
    await fresh({ members: ['alice', 'bob'] });
    const mal = as('mallory'), md = mal.doc(H);
    await check('write the document over with nothing', () => assertFails(md.set({})));
    await check('write it over with a shell of itself', () =>
      assertFails(md.set({ weeks: {}, mine: {}, favs: [] })));
    await check('empty everybody’s recipes in one write', () => assertFails(md.update({ mine: {} })));
    await check('or with a merge', () => assertFails(md.set({ mine: {} }, { merge: true })));
    await check('take two recipes at once', () =>
      assertFails(md.update({ 'mine.u1': FV.delete(), 'mine.u2': FV.delete() })));
    await check('take every week at once', () => assertFails(md.update({ weeks: {} })));
    await check('take the edits to the printed recipes at once', async () => {
      await seed(H, seedDoc({ members: ['alice', 'bob'], edits: { 12: { name: 'A' }, 13: { name: 'B' } } }));
      await assertFails(md.update({ edits: {} }));
    });
    await check('empty the favourites', () => assertFails(md.update({ favs: [] })));
    await check('empty the things typed onto the shelf', () => assertFails(md.update({ pantryNew: {} })));
    await check('remove a field outright', () => assertFails(md.update({ pantryNew: FV.delete() })));
    await check('add a field of their own', () => assertFails(md.update({ note: 'hello' })));
    await check('throw a member off the list', () =>
      assertFails(md.update({ members: FV.arrayRemove('bob') })));
    await check('replace the list with themselves', () => assertFails(md.update({ members: ['mallory'] })));
    await check('put somebody else on it', () => assertFails(md.update({ members: FV.arrayUnion('eve') })));
    await check('pad the list with copies of who is already on it, filling the fifty places', async () => {
      const copies = ['alice', 'bob'];
      while (copies.length < 50) copies.push('alice');
      await assertFails(env.authenticatedContext('ghost', { firebase: { sign_in_provider: 'anonymous' } }).firestore().doc(H).update({ members: copies }));
      await assertFails(md.update({ members: copies }));
      await assertFails(md.update({ members: ['alice', 'bob', 'mallory', 'mallory'] }));
    });
    await check('stretch the invite note, or the week on screen, toward the megabyte a document holds', async () => {
      await assertFails(md.update({ lastInvite: 'x'.repeat(900 * 1024) }));
      await assertFails(md.update({ active: 'w'.repeat(65) }));
    });

    section('Households: the members list, by the member');
    await fresh({ members: ['alice'] });
    await check('a signed-in visitor puts themselves on it', () =>
      assertSucceeds(as('bob').doc(H).update({ members: FV.arrayUnion('bob') })));
    await check('an invite spent puts its spender on it, with the invite noted', () =>
      assertSucceeds(as('carol').doc(H).update({ members: FV.arrayUnion('carol'), lastInvite: 'tok' })));
    await check('an account being deleted takes itself off', () =>
      assertSucceeds(as('bob').doc(H).update({ members: FV.arrayRemove('bob') })));
    await check('the old private My Day left in this collection can be cleared', async () => {
      await seed(H, seedDoc({ members: ['alice'], myday: { t: { v: {}, at: 1 } } }));
      await assertSucceeds(as('alice').doc(H).update({ myday: FV.delete() }));
    });

    section('Households: dinner numbers, each by their own');
    const dn = (n, kc, p) => ({ n, kc, p });
    await fresh({ members: ['alice', 'bob'] });
    const ad = as('alice').doc(H), bd = as('bob').doc(H);
    await check('a member shares their own dinner numbers', () =>
      assertSucceeds(ad.update({ 'diners.alice': dn('Alice', 550, 70) })));
    await check('and changes them when the plan changes', () =>
      assertSucceeds(ad.update({ 'diners.alice': dn('Alice', 600, 75) })));
    await check('alongside somebody else’s, each written by its own', () =>
      assertSucceeds(bd.update({ 'diners.bob': dn('Bob', 400, 40) })));
    await check('a joining phone contributes its own with a merge', () =>
      assertSucceeds(as('carol').doc(H).set({ diners: { carol: dn('Carol', 450, 35) } }, { merge: true })));
    await check('and takes their own back', () =>
      assertSucceeds(ad.update({ 'diners.alice': FV.delete() })));
    await check('nobody shares numbers in somebody else’s name', () =>
      assertFails(as('mallory').doc(H).update({ 'diners.bob': dn('Bob', 3000, 0) })));
    await check('not even another member', () =>
      assertFails(ad.update({ 'diners.bob': dn('Bob', 500, 50) })));
    await check('nor takes somebody else’s away', () =>
      assertFails(ad.update({ 'diners.bob': FV.delete() })));
    await check('nor writes the map over, taking the others with it', () =>
      assertFails(ad.update({ diners: { alice: dn('Alice', 550, 70) } })));
    await check('nor changes their own and somebody else’s in one write', () =>
      assertFails(ad.update({ 'diners.alice': dn('Alice', 550, 70), 'diners.bob': dn('Bob', 9, 9) })));
    await check('an entry with anything more in it is refused', () =>
      assertFails(ad.update({ 'diners.alice': Object.assign(dn('Alice', 550, 70), { lb: 180 }) })));
    await check('so is a 200-character name', () =>
      assertFails(ad.update({ 'diners.alice': dn('A'.repeat(200), 550, 70) })));
    await check('and an empty one', () => assertFails(ad.update({ 'diners.alice': dn('', 550, 70) })));
    await check('calories written as words', () =>
      assertFails(ad.update({ 'diners.alice': dn('Alice', '550', 70) })));
    await check('and numbers no dinner is', async () => {
      await assertFails(ad.update({ 'diners.alice': dn('Alice', 9000, 70) }));
      await assertFails(ad.update({ 'diners.alice': dn('Alice', 550, -5) }));
    });
    await check('nor a piece of one: a name with no numbers', () =>
      assertFails(ad.update({ 'diners.alice': { n: 'Alice' } })));
    await check('an account being deleted takes itself and its numbers off in one write', async () => {
      await seed(H, seedDoc({ members: ['alice', 'bob'], diners: { alice: dn('Alice', 550, 70), bob: dn('Bob', 400, 40) } }));
      await assertSucceeds(ad.update({ members: FV.arrayRemove('alice'), 'diners.alice': FV.delete() }));
      const d = await read(H);
      if (d.diners.alice || !d.diners.bob) throw new Error('diners are ' + JSON.stringify(d.diners));
    });
    await check('a household from before diners takes every other write as it did', async () => {
      await seed(H, seedDoc({ members: ['alice'] }));
      await assertSucceeds(as('anon3').doc(H).update({ 'kitchen.salt': 1 }));
    });
    await check('calories with a fraction are refused: the app writes whole numbers', () =>
      assertFails(ad.update({ 'diners.alice': dn('Alice', 599.9, 70) })));
    await check('an entry from looser rules does not stop its owner’s other writes', async () => {
      await seed(H, seedDoc({ members: ['alice'], diners: { alice: { n: 'Alice ', kc: 599.9, p: 70 } } }));
      await assertSucceeds(ad.update({ 'kitchen.salt': 1 }));
    });

    /* With the code, fifty throwaway identities could be put on the list,
       which is capped at fifty and which nobody may take another's entry
       off: then no account could ever join. */
    section('Households: a browser’s throwaway identity is not an account');
    const anon = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await fresh({ members: ['alice'] });
    await check('an anonymous sign-in reads the household by its code', () => assertSucceeds(anon('ghost').doc(H).get()));
    await check('and writes to the pantry as any phone does', () => assertSucceeds(anon('ghost').doc(H).update({ 'kitchen.salt': 1 })));
    await check('but cannot put itself on the list', () =>
      assertFails(anon('ghost').doc(H).update({ members: FV.arrayUnion('ghost') })));
    await check('nor share dinner numbers', () =>
      assertFails(anon('ghost').doc(H).update({ 'diners.ghost': dn('Ghost', 500, 50) })));
    await check('it may make a household of its own, with nobody listed', () =>
      assertSucceeds(anon('ghost').doc('households/ANON-1').set(seedDoc({}))));
    await check('but not one with itself listed, or sharing', async () => {
      await assertFails(anon('ghost').doc('households/ANON-2').set(seedDoc({ members: ['ghost'] })));
      await assertFails(anon('ghost').doc('households/ANON-3').set(seedDoc({ diners: { ghost: dn('Ghost', 500, 50) } })));
    });
    await env.clearFirestore();
    await check('a household is made with the maker’s own numbers in it', () =>
      assertSucceeds(as('alice').doc('households/NEW-D1').set(seedDoc({ members: ['alice'], diners: { alice: dn('Alice', 550, 70) } }))));
    await check('but not made with somebody else’s', () =>
      assertFails(as('alice').doc('households/NEW-D2').set(seedDoc({ members: ['alice'], diners: { bob: dn('Bob', 400, 40) } }))));
    await check('nor with its maker’s in a shape the app never writes', () =>
      assertFails(as('alice').doc('households/NEW-D3').set(seedDoc({ members: ['alice'], diners: { alice: { n: 'Alice', kc: 'lots', p: 70 } } }))));

    section('Households: two phones at once');
    await fresh();
    const p1 = as('anon1').doc(H), p2 = as('anon2').doc(H);
    await check('two dinners added to Monday on two phones both stay', async () => {
      await p1.update({ 'weeks.w1.plan.mon': FV.arrayUnion(20) });
      await p2.update({ 'weeks.w1.plan.mon': FV.arrayUnion(21) });
      const mon = (await read(H)).weeks.w1.plan.mon;
      if (![12, 20, 21].every((x) => mon.indexOf(x) >= 0)) throw new Error('Monday is ' + JSON.stringify(mon));
    });
    await check('one phone taking a dinner off does not take the other’s addition with it', async () => {
      await p1.update({ 'weeks.w1.plan.mon': FV.arrayRemove(12) });
      const mon = (await read(H)).weeks.w1.plan.mon;
      if (mon.indexOf(12) >= 0 || mon.indexOf(21) < 0) throw new Error('Monday is ' + JSON.stringify(mon));
    });

    section('Invites');
    await env.clearFirestore();
    await seed(H, seedDoc({ members: ['alice'] }));
    const now = Date.now();
    const inv = (by, extra) => Object.assign({ house: 'KETTLE-1234-WILLOW', by, made: now, exp: now + 7 * DAY, used: false }, extra || {});
    await check('a member makes one for a week', () =>
      assertSucceeds(as('alice').doc('invites/tokgood').set(inv('alice'))));
    await check('a stranger cannot make one', () =>
      assertFails(as('mallory').doc('invites/tokbad').set(inv('mallory'))));
    await check('nor in somebody else’s name', () =>
      assertFails(as('mallory').doc('invites/tokbad').set(inv('alice'))));
    await check('an invite cannot be made to last a month', () =>
      assertFails(as('alice').doc('invites/toklong').set(inv('alice', { exp: now + 30 * DAY }))));
    await check('nor made already expired', () =>
      assertFails(as('alice').doc('invites/tokold').set(inv('alice', { exp: now - DAY }))));
    await check('nor carry anything else', () =>
      assertFails(as('alice').doc('invites/tokx').set(inv('alice', { note: 'hi' }))));
    await check('the one who has the link can read it', () =>
      assertSucceeds(as('bob').doc('invites/tokgood').get()));
    await check('a link that never existed reads as missing, not refused', async () => {
      const s = await assertSucceeds(as('bob').doc('invites/nosuch').get());
      if (s.exists) throw new Error('it exists');
    });
    await check('spending it: once', () =>
      assertSucceeds(as('bob').doc('invites/tokgood').update({ used: true, usedBy: 'bob' })));
    await check('and not twice', () =>
      assertFails(as('eve').doc('invites/tokgood').update({ used: true, usedBy: 'eve' })));
    await check('a spent one no longer gives away the household', () =>
      assertFails(as('eve').doc('invites/tokgood').get()));
    await check('nor does an expired one', async () => {
      await seed('invites/tokexp', inv('alice', { exp: now - 1000 }));
      await assertFails(as('eve').doc('invites/tokexp').get());
    });
    await check('invites cannot be listed or deleted', async () => {
      await assertFails(as('alice').collection('invites').get());
      await assertFails(as('alice').doc('invites/tokexp').delete());
    });

    section('Your own record');
    await env.clearFirestore();
    await check('yours to write and read', async () => {
      await assertSucceeds(as('alice').doc('users/alice').set({ myday: {} }));
      await assertSucceeds(as('alice').doc('users/alice').get());
    });
    await check('nobody else’s', async () => {
      await assertFails(as('mallory').doc('users/alice').get());
      await assertFails(as('mallory').doc('users/alice').set({ myday: {} }));
    });
    await check('your training years are yours, and listable only by you', async () => {
      await assertSucceeds(as('alice').doc('users/alice/train/2026').set({ wo: {} }));
      await assertSucceeds(as('alice').collection('users/alice/train').get());
      await assertFails(as('mallory').collection('users/alice/train').get());
    });
    await check('nobody lists the accounts', () => assertFails(as('alice').collection('users').get()));
    await check('a training record is named by its year, as the app names one, and nothing else', async () => {
      await assertFails(as('alice').doc('users/alice/train/zzz-999').set({ wo: {} }));
      await assertFails(as('alice').doc('users/alice/train/20261').set({ wo: {} }));
      await seed('users/alice/train/zzz-999', { wo: {} });
      await assertSucceeds(as('alice').doc('users/alice/train/zzz-999').delete());
    });
    await check('your food log’s years too: yours, listable only by you, named by their year', async () => {
      await assertSucceeds(as('alice').doc('users/alice/days/2026').set({ myday: { d: {} } }));
      await assertSucceeds(as('alice').collection('users/alice/days').get());
      await assertFails(as('mallory').collection('users/alice/days').get());
      await assertFails(as('mallory').doc('users/alice/days/2026').set({ myday: {} }));
      await assertFails(as('alice').doc('users/alice/days/notayear').set({ myday: {} }));
      await assertSucceeds(as('alice').doc('users/alice/days/2026').delete());
    });

    /* Firestore evaluates at most a thousand expressions a request, and these
       rules spend most of them on every write: on 4 October the household's
       heaviest writes had room for about ten more calls of the five-comparison
       function below, and a draft that checked every map's values left a
       phone joining a household none at all — it would have been refused, on
       every phone, the day it was published. So each write the app makes is
       made here with six of those calls added to the rule that judges it. A
       change to the rules that eats the room fails here, not on a phone. */
    section('Room to spare under Firestore’s limit of a thousand expressions');
    const SPARE = 6;
    const burner = '    function spare5(x) { return x == x && x == x && x == x && x == x && x == x; }\n';
    const spare = Array(SPARE).fill('spare5(1)').join(' && ');
    const tight = RULES.replace('    match /households/{code} {', burner + '    match /households/{code} {')
      .replace('allow create: if request.auth != null\n', 'allow create: if request.auth != null && ' + spare + '\n')
      .replace('allow update: if request.auth != null\n', 'allow update: if request.auth != null && ' + spare + '\n');
    if (tight.split('spare5(1)').length - 1 !== 2 * SPARE) throw new Error('the room check no longer finds the household rules to add to');
    const big = () => {
      const d = seedDoc({ members: ['alice', 'bob'], diners: { bob: dn('Bob', 400, 40) }, lastInvite: 'x' });
      for (let i = 0; i < 50; i++) {
        d.favs.push('r' + i); d.mine['r' + i] = { id: 'r' + i, book: 3, name: 'R' + i, ing: ['a'], steps: ['b'] };
        d.rate['r' + i] = 1; d.kitchen['k' + i] = 1; d.src['k' + i] = 's'; d.low['k' + i] = 1;
        d.pantryNew['own_' + i] = { l: 'P' + i, c: 'Yours' };
      }
      return d;
    };
    const joining = () => {
      const d = big();
      return { favs: d.favs.concat(['r99']), mine: Object.assign(d.mine, { r99: { id: 'r99', book: 3, name: 'Hers', ing: [], steps: [] } }),
        edits: Object.assign(d.edits, { 13: { name: 'Hers' } }), weeks: Object.assign(d.weeks, { d20261011: { name: '', ord: 9, plan: {}, checked: {} } }),
        pantry: Object.assign(d.pantry, { oats: 1 }), pantryNew: Object.assign(d.pantryNew, { own_mace: { l: 'Mace', c: 'Yours' } }),
        kitchen: Object.assign(d.kitchen, { kz: 1 }), src: Object.assign(d.src, { kz: 's' }), rate: Object.assign(d.rate, { r99: 2 }),
        opts: Object.assign(d.opts, { fb: 0 }), low: Object.assign(d.low, { kz: 1 }) };
    };
    const heavy = [
      ['a household made, with its maker listed and sharing', 'alice', (db) => db.doc('households/ROOM-NEW').set(seedDoc({ members: ['alice'], diners: { alice: dn('Alice', 550, 70) } }))],
      ['a dinner\'s numbers shared', 'alice', (db) => db.doc(H).update({ 'diners.alice': dn('Alice', 550, 70) })],
      ['an account leaving, and its numbers with it', 'bob', (db) => db.doc(H).update({ members: FV.arrayRemove('bob'), 'diners.bob': FV.delete() })],
      ['an invite spent', 'carol', (db) => db.doc(H).update({ members: FV.arrayUnion('carol'), lastInvite: 'x'.repeat(24) })],
      ['a recipe saved', 'alice', (db) => db.doc(H).update({ 'mine.r5': { id: 'r5', book: 3, name: 'Changed', ing: ['a'], steps: ['b'] } })],
      ['a kitchen answer and its source, folded', 'alice', (db) => db.doc(H).update({ 'kitchen.salt': 0, 'src.salt': 'b' })],
      ['a phone joining, adding to every map at once', 'dave', (db) => db.doc(H).set(joining(), { merge: true })],
    ];
    const roomy = await initializeTestEnvironment({
      projectId: 'demo-storehouse-room',
      firestore: { rules: tight, host: '127.0.0.1', port: emu.port }
    });
    try {
      for (const [name, who, fn] of heavy) {
        await check(name, async () => {
          await roomy.clearFirestore();
          await roomy.withSecurityRulesDisabled(async (ctx) => { await ctx.firestore().doc(H).set(big()); });
          await assertSucceeds(fn(roomy.authenticatedContext(who).firestore()));
        });
      }
    } finally {
      await roomy.cleanup();
    }
  } finally {
    if (env) await env.cleanup();
    emu.proc.kill();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { failures.forEach((f) => console.log('  ' + f)); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
