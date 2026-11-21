/* Two phones, really talking to Firestore.
 *
 * Not in the default run, because it needs a network and it writes to the live
 * project named in src/config.js. Run it deliberately:
 *
 *     node tests/run.js sync --live
 *
 * It uses a throwaway household code and deletes the document afterwards, both
 * before it starts and when it finishes, so a run that dies halfway does not
 * poison the next one. It never touches a real household.
 *
 * Each phone gets its own browser context, so nothing can pass between them
 * except through the server — otherwise the shared IndexedDB would make a
 * completely broken sync look like a working one.
 *
 * If www.gstatic.com is unreachable (a sandbox, a locked-down network), put the
 * three firebase-*-compat.js files somewhere local and point SDK at them; Store
 * skips its own loader when firebase is already on the page, so every other
 * line of this exercises the real path.
 */

const CODE = 'TESTONLY-9911-DELETEME';
const SDK = process.env.FIREBASE_SDK || 'https://www.gstatic.com/firebasejs/10.12.2/';
const FILES = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'];

async function waitFor(page, fn, ms = 15000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

module.exports = {
  name: 'Sync (live Firestore)',
  async run(t) {
    const made = [];

    const phone = async (legacyPlan) => {
      const ctx = await t.browser.newContext({ viewport: { width: 1100, height: 900 } });
      made.push(ctx);
      const p = await ctx.newPage();
      p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
      await p.goto(t.base + 'index.html');
      await p.evaluate((plan) => {
        localStorage.clear();
        if (plan) localStorage.setItem('bsc.plan', plan);
      }, legacyPlan || '');
      await p.reload();
      if (SDK !== 'https://www.gstatic.com/firebasejs/10.12.2/') {
        for (const f of FILES) await p.addScriptTag({ url: SDK + f });
      }
      /* The app stopped fetching Firebase at boot — a visitor with no account
         and no household fetches nothing offsite — so a fresh phone has no
         `firebase` on the page until something asks for it. Ask. */
      await p.evaluate(() => window.Store.ready());
      return p;
    };

    const admin = async (fn, arg) => {
      const p = await phone();
      const r = await p.evaluate(async ([code, src, a]) => {
        if (!window.firebase.apps.length) window.firebase.initializeApp(window.FIREBASE_CONFIG);
        await window.firebase.auth().signInAnonymously();
        const doc = window.firebase.firestore().collection('households').doc(code);
        return (new Function('return ' + src)())(doc, a);
      }, [CODE, fn.toString(), arg]);
      await p.context().close();
      return r;
    };

    /* Emptied rather than deleted.
     *
     * firestore.rules says `allow list, delete: if false` — deliberately, so a
     * household cannot be enumerated or destroyed by anyone who merely knows a
     * code. This test signed in as an ordinary anonymous visitor and then
     * called delete() to tidy up, which the rules refuse, so the one test that
     * exercises the live project could not finish against the live project.
     *
     * create and update are allowed, so the fixture is overwritten with an
     * empty household instead. Same effect for a test — the next run starts
     * from nothing — without asking the rules to permit something the app
     * never does. */
    const wipe = () => admin(async (doc) => {
      await doc.set({ favs: [], weeks: {}, active: '', mine: {}, edits: {},
        pantry: {}, pantryNew: {} });
    });

    try {
      if (!(await t.browser.newContext().then((c) => c.close().then(() => true)))) return;

      await wipe();

      /* Exactly what the one-week version left in a household that had been in
         use: a plan and its ticks at the top level, and no weeks at all. */
      await admin(async (doc) => {
        await doc.set({ favs: [4, 11], plan: { mon: [1], fri: [9] }, checked: {} });
      });

      // ---- phone A joins that household -----------------------------------
      const A = await phone();
      await A.evaluate((c) => window.Store.join(c), CODE);
      t.ok('A connects', await waitFor(A, () => /synced|waiting/.test(window.Store.status)),
        await A.evaluate(() => window.Store.status + ' ' + window.Store.statusNote));

      t.ok('a household from the one-week version is carried over',
        await waitFor(A, () => window.Store.weeks().length === 1 &&
          window.Store.weeks()[0].name === 'This Week' &&
          (window.Store.state.weeks.w1.plan.mon || []).join() === '1' &&
          window.Store.state.favs.join() === '4,11'),
        await A.evaluate(() => JSON.stringify(window.Store.state.weeks)));

      await A.evaluate(() => window.Hive.go('plan'));
      await A.click('[data-neww="new"]');
      await A.click('#renameWeek');
      await A.waitForSelector('#dlgInput');
      await A.fill('#dlgInput', 'Fast week');
      await A.click('[data-dlg="ok"]');
      await A.waitForTimeout(600);

      // ---- phone B, with nothing of its own --------------------------------
      const B = await phone();
      await B.evaluate((c) => window.Store.join(c), CODE);
      t.ok('B connects', await waitFor(B, () => /synced|waiting/.test(window.Store.status)),
        await B.evaluate(() => window.Store.status + ' ' + window.Store.statusNote));
      t.ok('and sees both of A’s weeks',
        await waitFor(B, () => window.Store.weeks().map((w) => w.name).join() === 'This Week,Fast week'),
        await B.evaluate(() => window.Store.weeks().map((w) => w.name).join()));
      t.ok('looking at the same one', (await B.evaluate(() => window.Store.activeWeek().name)) === 'Fast week');

      // ---- what one does, the other sees -----------------------------------
      await A.click('.tab[data-view="browse"]');
      await A.click('#grid .card >> nth=2');
      await A.click('.daybtn[data-day="thu"]');
      await A.click('.sheet-x');
      t.ok('planning on one phone lands on the other',
        await waitFor(B, () => (window.Store.state.plan.thu || []).length === 1),
        await B.evaluate(() => JSON.stringify(window.Store.state.plan)));

      await B.evaluate(() => window.Hive.go('plan'));
      await B.click('#weekBar .wk >> nth=0');
      t.ok('switching week moves both of you',
        await waitFor(A, () => window.Store.activeWeek().name === 'This Week' &&
          (window.Store.state.plan.mon || []).join() === '1'),
        await A.evaluate(() => window.Store.activeWeek().name));

      await B.evaluate(() => window.Hive.go('list'));
      await B.waitForSelector('.list-row', { timeout: 8000 });
      await B.click('.list-row:not(.done) >> nth=0');
      await A.evaluate(() => window.Hive.go('list'));
      t.ok('a tick in the shop greys out on the other phone',
        await waitFor(A, () => document.querySelectorAll('.list-row.done').length === 1),
        await A.evaluate(() => document.querySelectorAll('.list-row.done').length));

      // ---- a recipe written on one appears on the other ---------------------
      await A.click('.tab[data-view="browse"]');
      await A.click('#newRecipe');
      await A.waitForSelector('.ed-sheet');
      await A.fill('#edName', 'Test Rolls');
      await A.fill('#edIng', '4 cups flour\n1 packet yeast\n1 ½ cups milk');
      await A.fill('#edSteps', 'Mix. Rise. Bake.');
      await A.click('[data-ed="save"]');
      // window.RECIPES is the printed book; what B renders is the merged list
      await B.click('.tab[data-view="browse"]');
      t.ok('a recipe written on one phone reaches the other',
        await waitFor(B, () => Object.keys(window.Store.state.mine).length === 1 &&
          [...document.querySelectorAll('.card-name')].some((e) => e.textContent === 'Test Rolls')),
        await B.evaluate(() => JSON.stringify(Object.keys(window.Store.state.mine))));
      await A.click('.sheet-x');

      // ---- both at once, on different fields --------------------------------
      await B.evaluate(() => window.Hive.go('plan'));
      await Promise.all([
        A.evaluate(() => window.Store.addToDay(20, 'sat')),
        B.evaluate(() => window.Store.renameWeek('Renamed by B')),
      ]);
      await A.waitForTimeout(2500);
      const end = await A.evaluate(() => ({
        names: window.Store.weeks().map((w) => w.name),
        sat: (window.Store.state.plan.sat || []).indexOf(20) >= 0,
      }));
      t.ok('two people editing at once do not overwrite each other',
        end.names.join() === 'Renamed by B,Fast week' && end.sat, JSON.stringify(end));

      // ---- and what actually landed on the server ---------------------------
      await A.waitForTimeout(1500);
      const doc = JSON.parse(await A.evaluate((code) => window.firebase.firestore()
        .collection('households').doc(code).get({ source: 'server' })
        .then((s) => JSON.stringify(s.data())), CODE));
      t.ok('the server document holds the weeks, the recipe and the favorites',
        Object.keys(doc.weeks).length === 2 && Object.keys(doc.mine).length === 1 &&
        doc.favs.join() === '4,11', Object.keys(doc).sort().join(','));
      t.ok('and the one-week fields are left where they were, not deleted',
        doc.plan && (doc.plan.mon || []).join() === '1', JSON.stringify(doc.plan));

      t.ok('the status settles on synced rather than stuck on cache',
        await waitFor(A, () => window.Store.status === 'synced', 8000),
        await A.evaluate(() => window.Store.status));

      /* ---- a code already in use is never handed out again ------------------
       *
       * newCode draws from 2.3 million combinations and nothing ever releases
       * one, so collisions are rare and cumulative — and a collision is two
       * families silently sharing a grocery list, which is the kind of bug
       * nobody reports because neither of them knows the other exists.
       *
       * createHousehold takes the code on screen as its first candidate, so
       * handing it one that is already taken is the collision, staged. It has
       * to come back with a different one, and it must not have touched what
       * was there. */
      const C = await phone();
      const before = JSON.parse(await C.evaluate((code) => window.firebase.firestore()
        .collection('households').doc(code).get({ source: 'server' })
        .then((s) => JSON.stringify(s.data())), CODE));
      const claimed = await C.evaluate((code) => window.Store.createHousehold(code), CODE);
      t.ok('a code that is already somebody else\'s is not handed out again',
        claimed && claimed !== CODE, String(claimed));

      await C.waitForTimeout(1500);
      const after = JSON.parse(await C.evaluate((code) => window.firebase.firestore()
        .collection('households').doc(code).get({ source: 'server' })
        .then((s) => JSON.stringify(s.data())), CODE));
      t.ok('and the household that already held it is untouched',
        JSON.stringify(after) === JSON.stringify(before),
        Object.keys(after || {}).sort().join(','));

      /* The code it settled on is a real household now, and firestore.rules
         denies delete, so it is emptied rather than removed. A stray document
         holding nothing is a code out of circulation and no more. */
      if (claimed && claimed !== CODE) {
        await C.evaluate((code) => window.firebase.firestore()
          .collection('households').doc(code)
          .set({ favs: [], weeks: {}, active: '', mine: {}, edits: {} }), claimed);
      }
    } finally {
      try { await wipe(); } catch (e) { t.ok('the test household was cleaned up', false, e.message); }
      for (const c of made) { try { await c.close(); } catch (e) { /* already gone */ } }
    }
  },
};
