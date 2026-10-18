/* The shared household, against a stand-in for Firestore.
 *
 * tests/sync.test.js talks to the live project and is run by hand; this is
 * the half that runs every time. The server is a plain object in this
 * process, and the SDK the page gets is a few dozen lines that hand each
 * write here as it was made — including Firestore's own markers for
 * arrayUnion, arrayRemove and delete, applied here the way Firestore applies
 * them, against whatever the document holds when the write arrives. So what
 * is checked is what the app ASKS the server to do, which is the thing the
 * rules (tests/rules/) and the two-phones problem are both about.
 *
 * Nothing reaches the real project: the SDK is injected before the page
 * loads, and sync.js skips its own loader when firebase is already there. */

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* A Firestore marker, applied to what is there now. undefined means "take
   the field away". */
function resolve(v, cur) {
  if (isObj(v) && v.__fv) {
    if (v.__fv === 'delete') return undefined;
    if (v.__fv === 'ts') return { __ts: Date.now() };
    const was = Array.isArray(cur) ? cur.slice() : [];
    if (v.__fv === 'union') { v.v.forEach((x) => { if (!was.some((y) => same(x, y))) was.push(x); }); return was; }
    if (v.__fv === 'remove') return was.filter((y) => !v.v.some((x) => same(x, y)));
  }
  if (isObj(v)) {
    const o = {};
    Object.keys(v).forEach((k) => { const r = resolve(v[k], undefined); if (r !== undefined) o[k] = r; });
    return o;
  }
  return v;
}
// set(..., {merge: true}): maps merge, and an empty map is written as one
function mergeInto(to, from) {
  Object.keys(from).forEach((k) => {
    const v = from[k];
    if (isObj(v) && !v.__fv && Object.keys(v).length && isObj(to[k])) { mergeInto(to[k], v); return; }
    const r = resolve(v, to[k]);
    if (r === undefined) delete to[k]; else to[k] = r;
  });
}
// update(): each key a field path, each path replaced (or marked) where it is
function atPath(doc, path, v) {
  const parts = path.split('.');
  let o = doc;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!isObj(o[parts[i]])) o[parts[i]] = {};
    o = o[parts[i]];
  }
  const last = parts[parts.length - 1];
  const r = resolve(v, o[last]);
  if (r === undefined) delete o[last]; else o[last] = r;
}

const SDK = `(function(){
  var cfg = window.__fakeCfg || {};
  var user = cfg.user || { uid: 'anon1', isAnonymous: true };
  var authObj = { currentUser: user,
    getRedirectResult: function(){ return Promise.resolve(null); },
    onAuthStateChanged: function(cb){ setTimeout(function(){ cb(authObj.currentUser); }, 0); return function(){}; },
    signInAnonymously: function(){ authObj.currentUser = { uid: 'anon9', isAnonymous: true }; return Promise.resolve({ user: authObj.currentUser }); },
    signOut: function(){ return Promise.resolve(); } };
  user.delete = function(){ return Promise.resolve(); };
  var subs = [];
  function snapOf(path, d){ return { id: path.split('/').pop(), exists: d !== null && d !== undefined,
    data: function(){ return d ? JSON.parse(JSON.stringify(d)) : undefined; },
    metadata: { fromCache: false, hasPendingWrites: false } }; }
  function deliver(){ subs.slice().forEach(function(s){ s(); }); }
  window.__hhPoke = deliver;
  function refused(r){ if (r && r.denied) { var e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; } return r; }
  function write(op, path, d, merge){ return window.__hhWrite(op, path, JSON.parse(JSON.stringify(d)), merge).then(refused).then(deliver); }
  function docRef(path){ return { id: path.split('/').pop(), path: path,
    collection: function(n){ return colRef(path + '/' + n); },
    set: function(d, o){ return write('set', path, d, !!(o && o.merge)); },
    update: function(d){ return write('update', path, d, true); },
    delete: function(){ return write('delete', path, {}, false); },
    get: function(){ return window.__hhGet(path).then(refused).then(function(r){ return snapOf(path, r.d); }); },
    onSnapshot: function(o, next, err){ if (typeof o === 'function') { err = next; next = o; }
      var on = true; var fire = function(){ if (!on) return; window.__hhGet(path).then(function(r){ if (on) next(snapOf(path, r.d)); }); };
      subs.push(fire); setTimeout(fire, 20); return function(){ on = false; }; } }; }
  function colRef(path){ return { doc: function(id){ return docRef(path + '/' + id); },
    get: function(){ return window.__hhList(path).then(function(list){
      var docs = list.map(function(r){ return { id: r.path.split('/').pop(), ref: docRef(r.path), data: function(){ return r.data; } }; });
      return { docs: docs, forEach: function(fn){ docs.forEach(fn); } }; }); },
    onSnapshot: function(o, next){ if (typeof o === 'function') next = o;
      var on = true; var fire = function(){ if (!on) return; window.__hhList(path).then(function(list){ if (!on) return;
        next({ metadata: { fromCache: false }, forEach: function(fn){ list.forEach(function(r){ fn(snapOf(r.path, r.data)); }); } }); }); };
      subs.push(fire); setTimeout(fire, 20); return function(){ on = false; }; } }; }
  var db = { collection: function(n){ return colRef(n); }, enablePersistence: function(){ return Promise.resolve(); },
    runTransaction: function(fn){
      var ops = [];
      var t = { get: function(ref){ return ref.get(); },
        set: function(ref, d){ ops.push(['set', ref.path, d, false]); return t; },
        update: function(ref, d){ ops.push(['update', ref.path, d, true]); return t; } };
      return Promise.resolve(fn(t)).then(function(r){
        return ops.reduce(function(p, op){ return p.then(function(){ return write(op[0], op[1], op[2], op[3]); }); }, Promise.resolve())
          .then(function(){ return r; });
      });
    } };
  var fs = function(){ return db; };
  fs.FieldValue = {
    delete: function(){ return { __fv: 'delete' }; },
    arrayUnion: function(){ return { __fv: 'union', v: [].slice.call(arguments) }; },
    arrayRemove: function(){ return { __fv: 'remove', v: [].slice.call(arguments) }; },
    serverTimestamp: function(){ return { __fv: 'ts' }; } };
  var auth = function(){ return authObj; };
  auth.GoogleAuthProvider = function(){};
  window.firebase = { apps: [], initializeApp: function(){ window.firebase.apps.push({}); }, firestore: fs, auth: auth };
})();`;

const CODE = 'KETTLE-1234-WILLOW';
const HP = 'households/' + CODE;
/* This week's id. Weeks have dates now (a Sunday, d20260927), and a household
   still holding the old undated "This Week" has it moved onto this week the
   first time a phone sees it — so the stand-in household starts as one that
   already has. */
const WK = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
  return 'd' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); })();

function seedHouse(extra) {
  return Object.assign({
    favs: [3, 'u1'],
    weeks: {
      [WK]: { name: '', ord: 0, plan: { mon: [12, 'u1'], wed: ['u1', 40], thu: [30] }, checked: {} },
      w2: { name: 'Next', ord: 1, plan: { tue: ['u1'] }, checked: {} }
    },
    active: WK,
    mine: {
      u1: { id: 'u1', book: 3, secNum: 1, secName: 'Ours', name: 'Lentil soup', ing: ['lentils'], steps: ['boil'] },
      u2: { id: 'u2', book: 3, secNum: 1, secName: 'Ours', name: 'Grandma’s bread', ing: ['flour'], steps: ['bake'] },
      u3: { id: 'u3', book: 3, secNum: 1, secName: 'Ours', name: 'Plain rice', ing: ['rice'], steps: ['cook'] }
    },
    edits: {}, pantry: {}, pantryNew: {}, kitchen: {}, src: {}, rate: {}, opts: {}, low: {}
  }, extra || {});
}

module.exports = {
  name: 'The shared household',
  async run(t) {
    const SRV = { db: {}, log: [], denyGet: {} };
    const since = () => SRV.log.length;
    const writesFrom = (n) => SRV.log.slice(n);

    async function phone(opts) {
      opts = opts || {};
      const ctx = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.exposeBinding('__hhWrite', async (src, op, path, data, merge) => {
        SRV.log.push({ op, path, data });
        if (op === 'delete') { delete SRV.db[path]; return true; }
        if (op === 'set' && !merge) { SRV.db[path] = resolve(data, undefined); return true; }
        if (op === 'set') { SRV.db[path] = SRV.db[path] || {}; mergeInto(SRV.db[path], data); return true; }
        if (!SRV.db[path]) return { denied: true };              // update() on nothing: refused
        if (SRV.refuse && Object.keys(data).some((k) => SRV.refuse.test(k))) return { denied: true };   // rules that refuse it
        Object.keys(data).forEach((k) => atPath(SRV.db[path], k, data[k]));
        return true;
      });
      await ctx.exposeBinding('__hhGet', async (src, path) => (SRV.denyGet[path] ? { denied: true }
        : { d: SRV.db[path] === undefined ? null : JSON.parse(JSON.stringify(SRV.db[path])) }));
      await ctx.exposeBinding('__hhList', async (src, path) => Object.keys(SRV.db)
        .filter((k) => k.indexOf(path + '/') === 0 && k.slice(path.length + 1).indexOf('/') < 0)
        .map((k) => ({ path: k, data: SRV.db[k] })));
      await ctx.addInitScript((c) => { window.__fakeCfg = c; }, { user: opts.user || null });
      await ctx.addInitScript(SDK);
      await ctx.route(/api\.nal\.usda\.gov|accounts\.google\.com|www\.gstatic\.com/, (r) => r.abort());
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message));
      await p.goto(t.base + 'index.html');
      await p.evaluate((o) => {
        localStorage.clear();
        if (o.house) { localStorage.setItem('bsc.house', JSON.stringify(o.house)); localStorage.setItem('bsc.houseNew', JSON.stringify('')); }
        if (o.account) localStorage.setItem('bsc.myAccount', '1');
      }, { house: opts.house || '', account: !!opts.user });
      await p.reload();
      if (opts.house) await p.waitForFunction(() => window.Store.status === 'synced', null, { timeout: 5000 });
      return { p, ctx, errs };
    }
    const poke = (p) => p.evaluate(() => new Promise((r) => { window.__hhPoke(); setTimeout(r, 120); }));

    // ---- a day is changed a dinner at a time ---------------------------
    SRV.db[HP] = seedHouse();
    const A = await phone({ house: CODE });
    let n = since();
    await A.p.evaluate(() => window.Store.addToDay(15, 'thu', 1));
    await A.p.waitForTimeout(150);
    let w = writesFrom(n);
    t.ok('a dinner added to a day goes up as that one dinner, not the whole day',
      w.length === 1 && w[0].op === 'update' && same(w[0].data['weeks.' + WK + '.plan.thu'], { __fv: 'union', v: [15] }),
      JSON.stringify(w));
    // the other phone adds Thursday's second dinner in between
    SRV.db[HP].weeks[WK].plan.thu.push(21);
    await poke(A.p);
    n = since();
    await A.p.evaluate(() => window.Store.removeFromDay(30, 'thu'));
    await A.p.waitForTimeout(150);
    w = writesFrom(n);
    t.ok('and one taken off goes up as that one taken off',
      w.length === 1 && same(w[0].data['weeks.' + WK + '.plan.thu'], { __fv: 'remove', v: [30] }), JSON.stringify(w));
    t.ok('so the other phone’s dinner, added meanwhile, is still there',
      same(SRV.db[HP].weeks[WK].plan.thu, [15, 21]), JSON.stringify(SRV.db[HP].weeks[WK].plan.thu));
    n = since();
    await A.p.evaluate(() => window.Store.addToDay(15, 'thu', 2));
    await A.p.waitForTimeout(150);
    w = writesFrom(n);
    /* It used to go up as the whole day, from this phone's copy, and took
       with it whatever the other phone had done to the day meanwhile. */
    t.ok('a serving count changed goes up as the old entry off and then the new one on, never the day whole',
      w.length === 2 && same(w[0].data['weeks.' + WK + '.plan.thu'], { __fv: 'remove', v: [15] }) &&
        same(w[1].data['weeks.' + WK + '.plan.thu'], { __fv: 'union', v: [{ i: 15, x: 2 }] }), JSON.stringify(w));
    t.ok('so the day on the server holds the other phone’s dinner and the new count',
      same(SRV.db[HP].weeks[WK].plan.thu.slice().sort((a, b) => String(a.i || a).localeCompare(String(b.i || b))), [{ i: 15, x: 2 }, 21]), JSON.stringify(SRV.db[HP].weeks[WK].plan.thu));

    // ---- a queued change goes to the week it was made in ----------------
    await A.ctx.close();
    SRV.db[HP] = seedHouse();
    const Q = await phone();
    n = since();
    await Q.p.evaluate((code) => {
      // made before the connection is up, so they are held and sent later, in order
      window.Store.join(code);
      window.Store.toggleChecked('milk');
      window.Store.addWeek('Later');   // and a new week showing before either has left
    }, CODE);
    await Q.p.waitForFunction(() => window.Store.status === 'synced', null, { timeout: 5000 });
    await Q.p.waitForTimeout(200);
    const tick = writesFrom(n).find((x) => x.op === 'update' && Object.keys(x.data).some((k) => /checked\.milk$/.test(k)));
    t.ok('a tick made before the household answered lands in the week it was made in',
      !!tick && Object.keys(tick.data)[0] === 'weeks.' + WK + '.checked.milk', JSON.stringify(writesFrom(n)).slice(0, 400));
    await Q.ctx.close();

    // ---- deleting a recipe takes it off its days, and only those --------
    SRV.db[HP] = seedHouse();
    const D = await phone({ house: CODE });
    SRV.db[HP].weeks[WK].plan.thu.push(31);        // the other phone, a moment ago
    n = since();
    await D.p.evaluate(() => window.Store.deleteRecipe('u1'));
    await D.p.waitForTimeout(250);
    w = writesFrom(n);
    const keys = w.map((x) => Object.keys(x.data)).reduce((a, b) => a.concat(b), []);
    t.ok('deleting your recipe sends the recipe gone, then each day it was on',
      keys.indexOf('mine.u1') >= 0 && keys.indexOf('weeks.' + WK + '.plan.mon') >= 0 && keys.indexOf('weeks.' + WK + '.plan.wed') >= 0 &&
      keys.indexOf('weeks.w2.plan.tue') >= 0 && keys.indexOf('favs') >= 0, JSON.stringify(keys));
    t.ok('and never the whole of every week', keys.indexOf('weeks') < 0 && keys.indexOf('weeks.' + WK + '.plan.thu') < 0, JSON.stringify(keys));
    const after = SRV.db[HP];
    t.ok('so it is off every day, and the other phone’s Thursday dinner stays',
      !JSON.stringify(after.weeks).includes('"u1"') && same(after.weeks[WK].plan.thu, [30, 31]) && after.favs.indexOf('u1') < 0,
      JSON.stringify(after.weeks) + JSON.stringify(after.favs));
    t.ok('a day it leaves empty is empty, not still holding it', same(after.weeks.w2.plan.tue, []),
      JSON.stringify(after.weeks.w2.plan));

    // ---- a recipe taken on another phone is kept here, and can come back
    SRV.db[HP] = seedHouse();
    await D.p.evaluate(() => { localStorage.removeItem('bsc.houseKept'); });
    await D.ctx.close();
    const K = await phone({ house: CODE });
    delete SRV.db[HP].mine.u2;                      // somebody else, holding the code
    delete SRV.db[HP].weeks.w2;
    await poke(K.p);
    await K.p.waitForTimeout(150);
    const kept = await K.p.evaluate(() => window.Store.removed());
    t.ok('what the household lost, this phone kept: the recipe, and the week with dinners on it',
      kept.length === 2 && kept.some((x) => x.k === 'mine' && x.id === 'u2') && kept.some((x) => x.k === 'weeks' && x.id === 'w2'),
      JSON.stringify(kept));
    const toast = await K.p.evaluate(() => (document.getElementById('mToast') || {}).textContent || '');
    t.ok('and it says so, once, wherever you are', /taken out of the shared pantry on another phone/.test(toast), toast);
    await K.p.evaluate(() => window.Store.deleteRecipe('u3'));
    await K.p.waitForTimeout(250);
    await poke(K.p);
    const kept2 = await K.p.evaluate(() => window.Store.removed());
    t.ok('a recipe deleted on this phone is not mistaken for one taken from it',
      !kept2.some((x) => x.id === 'u3'), JSON.stringify(kept2));
    await K.p.click('#syncBtn');
    await K.p.waitForTimeout(250);
    const sheet = await K.p.evaluate(() => (document.querySelector('.sync-gone') || {}).innerText || '');
    t.ok('Sync & sharing lists them by name', /Grandma.s bread/.test(sheet) && /Next/.test(sheet), sheet);
    await K.p.click('[data-sync="restore"]');
    await K.p.waitForTimeout(300);
    t.ok('and Put them back puts them back in the household',
      !!SRV.db[HP].mine.u2 && SRV.db[HP].mine.u2.name === 'Grandma’s bread' && !!SRV.db[HP].weeks.w2 &&
      same(SRV.db[HP].weeks.w2.plan.tue, ['u1']), JSON.stringify(Object.keys(SRV.db[HP].mine)) + JSON.stringify(SRV.db[HP].weeks.w2));
    t.ok('after which there is nothing left to put back',
      (await K.p.evaluate(() => window.Store.removed().length)) === 0 && !(await K.p.$('.sync-gone')));
    t.ok('with nothing thrown on the way', K.errs.length === 0, K.errs.join(' | '));
    await K.ctx.close();

    // ---- a code that is nobody's, with a change waiting for it ----------
    const M = await phone();
    n = since();
    await M.p.evaluate(() => { window.Store.join('NOBODY-0000-HERE'); window.Store.toggleFav(3); });
    await M.p.waitForFunction(() => window.Store.status === 'local', null, { timeout: 5000 });
    await M.p.waitForTimeout(150);
    const miss = await M.p.evaluate(() => ({ note: window.Store.statusNote, q: window.__syncDebug().queued, house: window.Store.house }));
    t.ok('a mistyped code says so, in words, rather than an error',
      /No shared pantry with the code NOBODY-0000-HERE/.test(miss.note) && miss.house === '', JSON.stringify(miss));
    t.ok('and what was waiting for it is dropped, not sent into the next household joined',
      miss.q === 0 && !writesFrom(n).some((x) => /NOBODY/.test(x.path)), JSON.stringify(miss) + JSON.stringify(writesFrom(n)));
    t.ok('nothing thrown', M.errs.length === 0, M.errs.join(' | '));
    await M.ctx.close();

    // ---- a phone whose storage is full says so --------------------------
    SRV.db[HP] = seedHouse();
    const F = await phone({ house: CODE });
    await F.p.evaluate(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'bsc.weeks') throw new DOMException('full', 'QuotaExceededError');
        return real.call(this, k, v);
      };
      window.Store.addWeek('Spare');
    });
    await F.p.waitForTimeout(150);
    const full = await F.p.evaluate(() => ({ full: window.Store.storageFull, toast: (document.getElementById('mToast') || {}).textContent || '' }));
    t.ok('a plan that could not be saved on this phone is said, not swallowed',
      full.full && /storage for the app is full/.test(full.toast) && /still go to the shared pantry/.test(full.toast), JSON.stringify(full));
    await F.ctx.close();

    // ---- joining over a week the household has planned says where hers went
    /* The household's week stands and this phone's goes in as a template,
       which is right; what was wrong was the silence. Her Monday and Tuesday
       were simply gone from the calendar, kept only under Cook this again. */
    SRV.db[HP] = seedHouse();
    const J = await phone();
    await J.p.evaluate((wk) => localStorage.setItem('bsc.weeks', JSON.stringify({ [wk]: { name: '', ord: 0, plan: { mon: [5], tue: [6] }, checked: {} } })), WK);
    await J.p.reload();
    await J.p.evaluate((code) => window.Store.join(code), CODE);
    await J.p.waitForFunction(() => window.Store.status === 'synced', null, { timeout: 5000 });
    await J.p.waitForTimeout(200);
    const parkSaid = await J.p.evaluate(() => {
      const aw = window.Store.activeWeek();
      return { toast: (document.getElementById('mToast') || {}).textContent || '', hidden: (document.getElementById('mToast') || {}).hidden,
        want: 'Your dinners for ' + aw.name + ' are kept as the template ‘Week of ' +
          aw.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '’ — Plan › Cook this again' };
    });
    const parkedWk = Object.values(SRV.db[HP].weeks).find((x) => x.tpl === 1 && same(x.plan, { mon: [5], tue: [6] }));
    t.ok('joining over a week the household had planned says, once, where this phone’s dinners went',
      parkSaid.toast === parkSaid.want && parkSaid.hidden === false && !!parkedWk && 'Week of ' + parkSaid.want.split('‘Week of ')[1].split('’')[0] === parkedWk.name,
      JSON.stringify({ parkSaid, parkedWk }));
    t.ok('and the household’s own week is the one on the calendar', same(SRV.db[HP].weeks[WK].plan, seedHouse().weeks[WK].plan) &&
      await J.p.evaluate(() => window.Store.day('mon').map((e) => e.id).join()) === '12,u1');

    // ---- one tap on where the staples come from is one write -------------
    n = since();
    await J.p.click('#syncBtn');
    await J.p.waitForTimeout(250);
    await J.p.click('[data-sync="where"]');
    await J.p.waitForTimeout(250);
    await J.p.click('[data-srcpick="fb"]');
    await J.p.waitForTimeout(250);
    w = writesFrom(n);
    t.ok('a tap on where the staples come from is one write, not one a switch',
      w.length === 1 && same(Object.keys(w[0].data).sort(), ['opts.big', 'opts.fb', 'opts.store']) && SRV.db[HP].opts.fb === 1 && SRV.db[HP].opts.store === 1,
      JSON.stringify(w));
    t.ok('with nothing thrown', J.errs.length === 0, J.errs.join(' | '));
    await J.ctx.close();

    // ---- a dinner's numbers, shared by the person they belong to ---------
    /* Blake: "what if my wife has a different plan?" She shares a dinner's
       share of hers from Sync & sharing, and Plan my week on every phone in
       the household can hold a dinner to it. Only those two numbers go, and
       only she can put them there or take them back. */
    const dn = (n, kc, p) => ({ n, kc, p });
    const ALICE = { uid: 'alice', isAnonymous: false, email: 'a@test.example', displayName: 'Alice Smith' };
    const dinerSay = (pg) => pg.evaluate(() => ({
      sw: (document.querySelector('[data-sync="diner"]') || { getAttribute: () => null }).getAttribute('aria-checked'),
      name: (document.getElementById('dinerName') || {}).value,
      say: (document.querySelector('.sync-diner') || {}).textContent || '' }));
    SRV.db[HP] = seedHouse({ members: ['bob'], diners: { bob: dn('Bob', 400, 40) } });
    const G = await phone({ house: CODE });
    await G.p.click('#syncBtn');
    await G.p.waitForTimeout(250);
    let ds = await dinerSay(G.p);
    t.ok('signed out, the sheet says what sharing dinner numbers needs, and offers no switch',
      ds.sw === null && /Sign in above to share your dinner numbers/.test(ds.say), JSON.stringify(ds));
    t.ok('and an anonymous phone writes nothing, though the household’s are there to plan with',
      await G.p.evaluate(() => window.Store.setMyDiner({ n: 'Anon', kc: 500, p: 50 })) === false &&
        same(Object.keys(SRV.db[HP].diners), ['bob']) && await G.p.evaluate(() => window.Store.diners().bob.n) === 'Bob',
      JSON.stringify(SRV.db[HP].diners));
    await G.ctx.close();

    const L = await phone({ user: ALICE });
    await L.p.click('#syncBtn');
    await L.p.waitForTimeout(250);
    ds = await dinerSay(L.p);
    t.ok('signed in with no pantry, it says to join one, and there is nothing to write to',
      ds.sw === null && /Join a pantry to share your dinner numbers/.test(ds.say) &&
        await L.p.evaluate(() => window.Store.setMyDiner({ n: 'Alice', kc: 500, p: 50 })) === false, JSON.stringify(ds));
    // rules published before diners refuse a field they have never heard of, so a new household carries none it need not
    const madeCode = await L.p.evaluate(() => window.Store.createHousehold('FRESH-1111-CODE-HERE'));
    t.ok('a household made by somebody sharing nothing has no diners field in it',
      !!SRV.db['households/' + madeCode] && !('diners' in SRV.db['households/' + madeCode]), JSON.stringify(Object.keys(SRV.db['households/' + madeCode] || {})));
    await L.ctx.close();

    SRV.db[HP] = seedHouse({ members: ['alice', 'bob'], diners: { bob: dn('Bob', 400, 40) } });
    /* Her account on this household. The pantry made just above told it
       FRESH, and whenever the account answered before the next click,
       "Use your account’s pantry?" sat over the sheet and the click never
       landed (two runs in five). */
    SRV.db['users/alice'] = { house: CODE };
    const A2 = await phone({ house: CODE, user: ALICE });
    await A2.p.evaluate(() => localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 210, c: 90, f: 50 })));
    await A2.p.click('#syncBtn');
    await A2.p.waitForTimeout(250);
    ds = await dinerSay(A2.p);
    t.ok('signed in and in a pantry: a switch, off, a name box holding the first word of the account’s name, and what goes',
      ds.sw === 'false' && ds.name === 'Alice' &&
        /Only a dinner’s calories and protein go to the household — not your weight or what you eat\./.test(ds.say), JSON.stringify(ds));
    n = since();
    await A2.p.click('[data-sync="diner"]');
    await A2.p.waitForTimeout(250);
    const mineShare = await A2.p.evaluate(() => window.__pw.fit());
    w = writesFrom(n);
    t.ok('on, the household gets this person’s dinner share under that name, in one write of that one key',
      same(SRV.db[HP].diners.alice, dn('Alice', mineShare.kc, mineShare.p)) &&
        w.length === 1 && same(Object.keys(w[0].data), ['diners.alice']), JSON.stringify({ d: SRV.db[HP].diners, w }));
    t.ok('and Store.diners() has it beside the other person’s, which is left as it was',
      same(await A2.p.evaluate(() => window.Store.diners()), { bob: dn('Bob', 400, 40), alice: dn('Alice', mineShare.kc, mineShare.p) }),
      JSON.stringify(await A2.p.evaluate(() => window.Store.diners())));
    t.ok('the sheet says what is going', (await dinerSay(A2.p)).sw === 'true' &&
      new RegExp('Yours: ' + mineShare.kc + ' cal · ' + mineShare.p + ' g protein').test((await dinerSay(A2.p)).say));

    n = since();
    await A2.p.reload();
    await A2.p.waitForFunction(() => window.Store.status === 'synced', null, { timeout: 5000 });
    await A2.p.waitForTimeout(300);
    await A2.p.click('#syncBtn');
    await A2.p.waitForTimeout(250);
    t.ok('the switch is remembered across a reload, and nothing is sent again for it',
      (await dinerSay(A2.p)).sw === 'true' && !writesFrom(n).some((x) => Object.keys(x.data).some((k) => /^diners/.test(k))),
      JSON.stringify(writesFrom(n)));

    /* A new plan saved on her other device reaches this one through her
       account, and the dinner she shares follows it. */
    n = since();
    const acct = SRV.db['users/alice'] || {};
    SRV.db['users/alice'] = Object.assign({}, acct, { myday: Object.assign({}, acct.myday, { t: { v: { p: 150, c: 150, f: 60 }, at: Date.now() } }) });
    await poke(A2.p);
    await A2.p.waitForTimeout(250);
    const moved = await A2.p.evaluate(() => window.__pw.fit());
    t.ok('a new plan from another of her devices moves the dinner she shares',
      moved.p !== mineShare.p && same(SRV.db[HP].diners.alice, dn('Alice', moved.kc, moved.p)), JSON.stringify({ moved, d: SRV.db[HP].diners }));

    /* Dinner's share of her day is a share of the dinner she shares: a
       bigger dinner in her meals is a bigger plate for the household. */
    await A2.p.keyboard.press('Escape');
    await A2.p.click('.tab[data-view="macros"]');
    await A2.p.waitForTimeout(250);
    // her plan, from Nourish's own way in: the gear, My plan
    await A2.p.click('#macroMore');
    await A2.p.click('[data-mmore="plan"]');
    await A2.p.waitForTimeout(250);
    // the meals and Save, out from behind the wizard's folds, as revealPlanFields in tests/fixtures/nourish.js does
    await A2.p.evaluate(() => {
      document.querySelectorAll('[data-mtwstep]').forEach((s) => { s.hidden = false; });
      document.querySelectorAll('.mt-sheet details').forEach((d) => { d.open = true; });
      ['mtMealsWrap', 'mtSave'].forEach((id) => { const el = document.getElementById(id); if (el) el.classList.remove('hide'); });
    });
    await A2.p.waitForTimeout(80);
    await A2.p.fill('#mtMeals .mtm-row[data-mtmk="d"] .mtm-share', '70');
    await A2.p.click('[data-mtarg="save"]');
    await A2.p.waitForTimeout(400);
    const bigger = await A2.p.evaluate(() => window.__pw.fit());
    t.ok('and so does a bigger share of her day for dinner',
      bigger.kc > moved.kc && same(SRV.db[HP].diners.alice, dn('Alice', bigger.kc, bigger.p)), JSON.stringify({ moved, bigger, d: SRV.db[HP].diners }));
    // and back to the sharing sheet the rest of this runs on
    if (await A2.p.$('#modalRoot .scrim')) { await A2.p.keyboard.press('Escape'); await A2.p.waitForTimeout(200); }
    await A2.p.click('#syncBtn');
    await A2.p.waitForTimeout(250);

    // a new name, typed and left
    await A2.p.fill('#dinerName', '  Ali  ');
    await A2.p.press('#dinerName', 'Tab');
    await A2.p.waitForTimeout(600);
    t.ok('a new name goes up trimmed', SRV.db[HP].diners.alice && SRV.db[HP].diners.alice.n === 'Ali', JSON.stringify(SRV.db[HP].diners));

    n = since();
    await A2.p.click('[data-sync="diner"]');
    await A2.p.waitForTimeout(250);
    w = writesFrom(n);
    t.ok('off takes it back out of the household, and only it',
      !('alice' in SRV.db[HP].diners) && same(SRV.db[HP].diners.bob, dn('Bob', 400, 40)) &&
        w.length === 1 && same(w[0].data, { 'diners.alice': { __fv: 'delete' } }), JSON.stringify({ d: SRV.db[HP].diners, w }));
    t.ok('and out of Store.diners()', same(Object.keys(await A2.p.evaluate(() => window.Store.diners())), ['bob']));
    t.ok('the setter writes only its own account’s key, whatever it is handed',
      await A2.p.evaluate(() => window.Store.setMyDiner({ n: 'x'.repeat(31), kc: 500, p: 50 }) === false &&
        window.Store.setMyDiner({ n: 'Alice', kc: 'lots', p: 50 }) === false) && !('alice' in SRV.db[HP].diners));
    t.ok('with nothing thrown', A2.errs.length === 0, A2.errs.join(' | '));
    await A2.ctx.close();

    /* Until firestore.rules is published again the server has never heard
       of diners and refuses the write. That costs the switch, which says
       so, and not the household's sync. */
    SRV.db[HP] = seedHouse({ members: ['alice'] });
    const R = await phone({ house: CODE, user: ALICE });
    await R.p.evaluate(() => localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 210, c: 90, f: 50 })));
    SRV.refuse = /^diners\./;
    await R.p.click('#syncBtn');
    await R.p.waitForTimeout(250);
    await R.p.click('[data-sync="diner"]');
    await R.p.waitForTimeout(300);
    const refused = await R.p.evaluate(() => ({ st: window.Store.status, r: window.Store.dinerRefused,
      say: (document.querySelector('.sync-diner') || {}).textContent || '' }));
    t.ok('a household on the old rules refuses the numbers: the switch says why, and sharing carries on',
      refused.r === true && /publishing again/.test(refused.say) && refused.st !== 'error' && !(SRV.db[HP].diners || {}).alice,
      JSON.stringify(refused));
    /* And after the rules are published, the next word from the household
       sends them. It did not: the refused entry stayed in this phone's
       diners, so the app took them for shared, and nothing tried again until
       the app was reopened. */
    t.ok('the numbers the household refused are not left on this phone as if it had them',
      !(await R.p.evaluate(() => 'alice' in window.Store.diners())) && !(await R.p.evaluate(() => JSON.parse(localStorage.getItem('bsc.diners') || '{}').alice)));
    const dinerTries = (from) => writesFrom(from).filter((x) => x.path === HP && Object.keys(x.data).some((k) => /^diners\./.test(k))).length;
    n = since();
    await poke(R.p);                             // the household says the same again
    await poke(R.p);
    t.ok('nothing is sent again while the household has not changed', dinerTries(n) === 0, JSON.stringify(writesFrom(n)));
    SRV.db[HP].favs.push(77);                    // the other phone, a favourite
    await poke(R.p);
    await poke(R.p);
    await poke(R.p);
    t.ok('still on the old rules, a change in the household is one more try, refused, and no loop',
      dinerTries(n) === 1 && await R.p.evaluate(() => window.Store.dinerRefused) === true, JSON.stringify(writesFrom(n)));
    SRV.refuse = null;                           // the rules, published
    n = since();
    SRV.db[HP].favs.push(78);
    await poke(R.p);
    await R.p.waitForTimeout(250);
    const after2 = await R.p.evaluate(() => ({ r: window.Store.dinerRefused, mine: window.Store.diners().alice,
      say: (document.querySelector('.sync-diner') || {}).textContent || '' }));
    t.ok('published, the next change in the household sends them, and the warning goes',
      dinerTries(n) === 1 && !!(SRV.db[HP].diners || {}).alice && SRV.db[HP].diners.alice.n === 'Alice' && after2.r === false &&
        !!after2.mine && !/publishing again/.test(after2.say), JSON.stringify({ after2, d: SRV.db[HP].diners, w: writesFrom(n) }));
    t.ok('with nothing thrown', R.errs.length === 0, R.errs.join(' | '));
    await R.ctx.close();

    // ---- a second phone with a pantry of its own can still join another --
    /* His wife installs it, signs in and keeps one favourite, and the
       account makes her a pantry of her own (mHouseReconcile). Then she is
       read the code — and the box to type it in had gone with the screen
       for having no pantry. */
    const WIFE = { uid: 'wife', isAnonymous: false, email: 'w@test.example', displayName: 'Sarah Smith' };
    const OWN = 'WILLOW-0001-OWN-CODE', OTHER = 'OTHER-2222-HOUSE-CODE';
    SRV.db[HP] = seedHouse({ members: ['alice', 'bob'] });
    SRV.db['households/' + OWN] = { favs: [99], weeks: {}, mine: {}, edits: {}, members: ['wife'] };
    SRV.db['households/' + OTHER] = { favs: [], weeks: {}, mine: {}, edits: {}, members: ['carol'] };
    SRV.db['users/wife'] = { house: OWN };
    const W = await phone({ house: OWN, user: WIFE });
    await W.p.click('#syncBtn');
    await W.p.waitForTimeout(250);
    const wbox = await W.p.evaluate(() => ({ code: (document.querySelector('.sync-code') || {}).textContent,
      box: !!document.getElementById('joinCode'), btn: !!document.querySelector('[data-sync="join"]') }));
    t.ok('in a pantry of her own, the sheet still has a box for another pantry’s code', wbox.code === OWN && wbox.box && wbox.btn, JSON.stringify(wbox));
    const wsay = () => W.p.evaluate(() => ({ house: window.Store.house, dlg: (document.getElementById('dlgT') || {}).textContent || '',
      warn: [...document.querySelectorAll('.sync-sheet .sync-warn')].map((x) => x.textContent).join(' | '),
      box: (document.getElementById('joinCode') || {}).value }));
    // one wrong digit: she stays where she was, and is told
    await W.p.fill('#joinCode', 'NOBODY-0000-HERE');
    await W.p.click('[data-sync="join"]');
    await W.p.waitForFunction((c) => window.Store.house === c && window.Store.status === 'synced', OWN, { timeout: 5000 });
    await W.p.waitForTimeout(200);
    let ws = await wsay();
    t.ok('a code that is nobody’s leaves her in her own pantry, and says so there', ws.house === OWN && !ws.dlg &&
      /No shared pantry with the code NOBODY-0000-HERE/.test(ws.warn), JSON.stringify(ws));
    await W.p.fill('#joinCode', ' ' + CODE.toLowerCase().replace(/-/g, ' ') + ' ');
    await W.p.click('[data-sync="join"]');
    await W.p.waitForFunction((c) => window.Store.house === c && window.Store.status === 'synced', CODE, { timeout: 5000 });
    await W.p.waitForTimeout(300);
    ws = await wsay();
    t.ok('the household’s code typed there moves the phone, unasked, since nobody else was in hers',
      ws.house === CODE && !ws.dlg && !/No shared pantry/.test(ws.warn) && ws.box === '', JSON.stringify(ws));
    t.ok('her favourite comes with her, and her account follows', SRV.db[HP].favs.indexOf(99) >= 0 &&
      SRV.db['users/wife'].house === CODE && SRV.db[HP].members.indexOf('wife') >= 0, JSON.stringify({ f: SRV.db[HP].favs, u: SRV.db['users/wife'], m: SRV.db[HP].members }));
    // from a pantry other people share, asked first
    await W.p.fill('#joinCode', OTHER);
    await W.p.click('[data-sync="join"]');
    await W.p.waitForTimeout(250);
    ws = await wsay();
    t.ok('from a pantry other people share, it asks before taking the phone out of it',
      /Leave this pantry/.test(ws.dlg) && ws.house === CODE, JSON.stringify(ws));
    await W.p.click('[data-dlg="cancel"]');
    await W.p.waitForTimeout(250);
    t.ok('and Cancel leaves it where it was', (await wsay()).house === CODE);
    if (!await W.p.$('#joinCode')) { await W.p.click('#syncBtn'); await W.p.waitForTimeout(250); }
    await W.p.fill('#joinCode', OTHER);
    await W.p.click('[data-sync="join"]');
    await W.p.waitForTimeout(250);
    await W.p.click('[data-dlg="ok"]');
    await W.p.waitForFunction((c) => window.Store.house === c && window.Store.status === 'synced', OTHER, { timeout: 5000 });
    await W.p.waitForTimeout(300);
    t.ok('and Join moves it, and the account with it', (await wsay()).house === OTHER && SRV.db['users/wife'].house === OTHER,
      JSON.stringify(SRV.db['users/wife']));
    t.ok('with nothing thrown', W.errs.length === 0, W.errs.join(' | '));
    await W.ctx.close();

    // ---- an account deleted takes its name off the household ------------
    SRV.db[HP] = seedHouse({ members: ['alice', 'bob'], diners: { alice: dn('Alice', 550, 70), bob: dn('Bob', 400, 40) } });
    SRV.db['users/alice'] = { myday: {} };
    // her food log's years and her workouts' years, each a record under hers
    SRV.db['users/alice/days/2025'] = { myday: { d: { '2025_03_02': { v: { b: [] }, at: 1 } } } };
    SRV.db['users/alice/days/2026'] = { myday: {} };
    SRV.db['users/alice/train/2026'] = { wo: {} };
    const Z = await phone({ house: CODE, user: { uid: 'alice', isAnonymous: false, email: 'a@test.example' } });
    const gone = await Z.p.evaluate(() => window.Store.deleteAccount().then(() => 'ok', (e) => 'failed: ' + e.message));
    t.ok('deleting an account takes it off the household’s members list',
      gone === 'ok' && same(SRV.db[HP].members, ['bob']) && !SRV.db['users/alice'],
      gone + ' ' + JSON.stringify(SRV.db[HP].members));
    t.ok('and every year’s record of its food log and its workouts goes before its own',
      !Object.keys(SRV.db).some((k) => k.indexOf('users/alice/') === 0), Object.keys(SRV.db).filter((k) => /^users\//.test(k)).join());
    t.ok('and its dinner numbers with it, leaving everybody else’s',
      same(SRV.db[HP].diners, { bob: dn('Bob', 400, 40) }), JSON.stringify(SRV.db[HP].diners));

    // ---- an invite that can no longer be read reads as spent ------------
    SRV.denyGet['invites/tok-spent'] = true;
    await Z.p.evaluate(() => { window.firebase.auth().currentUser = { uid: 'carol', isAnonymous: false }; });
    const said = await Z.p.evaluate(() => window.Store.redeem('tok-spent').then(() => 'joined', (e) => e.message));
    t.ok('a spent invite, which the rules now refuse to show, is said to be spent', said === 'spent', said);
    await Z.ctx.close();
  }
};
