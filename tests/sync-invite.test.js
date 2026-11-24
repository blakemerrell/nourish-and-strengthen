/* An invite link, end to end, against the live project.
 *
 * Runs only when asked for (`node tests/run.js sync --live`). Accounts are the pages'
 * own anonymous identities with Store.user() made to answer for them, as in
 * sync-account.test.js; the rules decide on uid and membership, not on the
 * sign-in provider, so everything after that one line is the real path.
 *
 * Spent invites are left behind: the rules deny delete on purpose, and a used
 * one grants nothing to anybody.
 */

const CODE = 'TESTONLY-5521-INVITES';

async function waitFor(page, fn, ms = 15000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

function asAccount() {
  let real;
  try { if (!sessionStorage.getItem('t.once')) { localStorage.setItem('bsc.myAccount', '1'); sessionStorage.setItem('t.once', '1'); } } catch (e) { /* */ }
  Object.defineProperty(window, 'Store', {
    configurable: true,
    get() { return real; },
    set(v) {
      v.user = () => { const id = v.uid(); return id ? { uid: id, email: 'test@example.com', name: '' } : null; };
      real = v;
    },
  });
}

module.exports = {
  name: 'Sync (invite links)',
  async run(t) {
    const made = [];
    const device = async (signedIn) => {
      const ctx = await t.browser.newContext({ viewport: { width: 1100, height: 900 } });
      made.push(ctx);
      const p = await ctx.newPage();
      p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
      if (signedIn) await p.addInitScript(asAccount);
      return p;
    };
    const serverDoc = (p, path) => p.evaluate((pth) => window.Store.ready().then((db) =>
      db.doc(pth).get({ source: 'server' }).then((s) => (s.exists ? s.data() : null))), path);

    let A;
    try {
      // ---- A: in the household, signed in ---------------------------------
      A = await device(true);
      await A.goto(t.base + 'index.html');
      await A.evaluate(() => window.Store.ready());
      await A.evaluate((c) => window.Store.ready().then((db) => db.collection('households').doc(c)
        .set({ favs: [4, 11], weeks: {}, active: '', mine: {}, edits: {}, pantry: {}, pantryNew: {} })), CODE);
      await A.evaluate((c) => window.Store.join(c), CODE);
      const aUid = await A.evaluate(() => window.Store.uid());
      t.ok('a signed-in member is put on the household list',
        await waitFor(A, () => window.Store.members.indexOf(window.Store.uid()) >= 0),
        JSON.stringify(await A.evaluate(() => window.Store.members)));

      const url = await A.evaluate(() => window.Store.invite());
      t.ok('a member can make an invite link', /\?invite=[a-z0-9]{24}$/.test(url || ''), String(url));
      const token = (url || '').split('invite=')[1];

      // ---- B: signed in, opens the link -----------------------------------
      const B = await device(true);
      await B.goto(url);
      t.ok('the link takes the person who opens it into the household',
        await waitFor(B, () => window.Store.house === 'TESTONLY-5521-INVITES' && window.Store.status === 'synced', 20000),
        await B.evaluate(() => window.Store.house + ' ' + window.Store.status));
      t.ok('and they see what is in it',
        await waitFor(B, () => window.Store.state.favs.join() === '4,11'),
        await B.evaluate(() => JSON.stringify(window.Store.state.favs)));
      t.ok('the token is taken out of the address bar', !/invite=/.test(B.url()), B.url());
      const bUid = await B.evaluate(() => window.Store.uid());
      const hh = await serverDoc(A, 'households/' + CODE);
      t.ok('both of them are on the list', hh && hh.members.indexOf(aUid) >= 0 && hh.members.indexOf(bUid) >= 0,
        JSON.stringify(hh && hh.members));
      const inv = await serverDoc(A, 'invites/' + token);
      t.ok('and the invite is spent, by B', inv && inv.used === true && inv.usedBy === bUid, JSON.stringify(inv));
      t.ok('B’s account now carries the pantry',
        await waitFor(B, () => window.Store.ready().then((db) =>
          db.collection('users').doc(window.Store.uid()).get({ source: 'server' }))
          .then((s) => s.exists && s.data().house === 'TESTONLY-5521-INVITES')));

      // ---- C: the same link, a second time --------------------------------
      const C = await device(true);
      await C.goto(url);
      t.ok('a spent link lets nobody else in',
        await waitFor(C, () => !localStorage.getItem('bsc.invite')) &&
        !(await C.evaluate(() => window.Store.house)),
        await C.evaluate(() => window.Store.house));
      await C.click('#syncBtn');
      t.ok('and says so in words',
        /used or has expired/.test(await C.textContent('.sync-sheet')));

      // ---- D: no account at all -------------------------------------------
      const D = await device(false);
      await D.goto(t.base + 'index.html?invite=abcdefghijklmnopqrstuvwx');
      await D.waitForSelector('.sync-sheet');
      t.ok('someone with no account is told to sign in to join',
        /invited to a pantry\. Sign in above/.test(await D.textContent('.sync-sheet')));
      t.ok('and nothing happens to the app for them otherwise',
        !(await D.evaluate(() => window.Store.house)) && (await D.$$('#grid .card, #grid .chap-card')).length > 0);

      // ---- the rules, asked directly --------------------------------------
      const denied = async (p, fn, arg) => p.evaluate(async ([src, a]) => {
        const db = await window.Store.ready();
        try { await (new Function('return ' + src)())(db, a); return 'allowed'; }
        catch (e) { return e.code || e.message; }
      }, [fn.toString(), arg]);
      t.ok('somebody not on the list cannot make an invite',
        (await denied(D, (db, c) => db.collection('invites').doc('zzzzzzzzzzzzzzzzzzzzzzzz' + Date.now()).set({
          house: c, by: window.Store.uid(), used: false, exp: Date.now() + 1000, made: Date.now() }), CODE))
          === 'permission-denied');
      t.ok('a spent invite cannot be spent again',
        (await denied(D, (db, tok) => db.collection('invites').doc(tok).update({
          used: true, usedBy: window.Store.uid() }), token)) === 'permission-denied');
      t.ok('nor pointed at another household',
        (await denied(A, (db, tok) => db.collection('invites').doc(tok).update({ house: 'ELSEWHERE' }), token))
          === 'permission-denied');
      t.ok('invites cannot be listed',
        (await denied(D, (db) => db.collection('invites').limit(1).get())) === 'permission-denied');
    } finally {
      try {
        if (A) await A.evaluate((c) => window.Store.ready().then((db) => db.collection('households').doc(c)
          .set({ favs: [], weeks: {}, active: '', mine: {}, edits: {} })), CODE);
      } catch (e) { t.ok('the test household was cleaned up', false, e.message); }
      for (const c of made) { try { await c.close(); } catch (e) { /* gone */ } }
    }
  },
};
