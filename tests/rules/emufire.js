/* src/sync.js against Google's Firestore emulator, through the Firebase SDK
 * the app ships and under firestore.rules as published.
 *
 * tests/fixtures/fakefire.js is a stand-in Firestore written for these tests.
 * It is fast and it is ours, which is the trouble: where it differs from the
 * real thing, a bug passes. This is the real client (the compat build of the
 * very version src/sync.js loads from gstatic) talking to the real server
 * (Google's emulator) under the real rules, so a write the rules refuse is
 * refused here, a transaction runs as one, and a snapshot carries the
 * metadata Firestore really sends.
 *
 * What is still not real: sign-in. The emulator for that is another program;
 * instead each phone's Firestore is handed a token saying who it is and how
 * it signed in (anonymously, or with an account), which is all the rules look
 * at, and sync.js is handed an auth object that answers the same. And there
 * is no IndexedDB in Node, so Firestore's offline queue lives in memory, as
 * it does in a browser that refuses persistence.
 *
 * A phone here is what fakefire's is: localStorage, a window, and its own
 * copy of sync.js, so two phones share nothing but the server. Its own copy,
 * but not its own vm context: the SDK accepts only plain objects of its own
 * realm, and an object literal made in another context has another realm's
 * Object.prototype, so every write was refused as "a custom Object object".
 * sync.js is compiled once here as a function of the globals it reads, and
 * each phone calls it with its own. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const firebase = require('firebase-shipped/compat/app').default;
require('firebase-shipped/compat/firestore');

const FILE = path.join(__dirname, '..', '..', 'src', 'sync.js');
const SRC = fs.readFileSync(FILE, 'utf8');
const GLOBALS = ['window', 'localStorage', 'document', 'location', 'Date', 'setTimeout', 'clearTimeout'];
const syncFor = vm.runInThisContext('(function (' + GLOBALS.join(', ') + ') {\n' + SRC + '\n})', { filename: FILE, lineOffset: -1 });

/* The version src/sync.js loads, and the one installed here as
   firebase-shipped. A test of a different client is a test of a different
   app, so a bump to one without the other stops here, saying which. */
const LOADS = (SRC.match(/gstatic\.com\/firebasejs\/([0-9.]+)\//) || [])[1];
const HAS = require('firebase-shipped/package.json').version;
if (LOADS !== HAS) {
  throw new Error('src/sync.js loads Firebase ' + LOADS + ' but tests/rules has ' + HAS +
    ' as firebase-shipped: change both together (npm i -D -E firebase-shipped@npm:firebase@' + LOADS + ')');
}

/* Firestore is quiet about what it was told to say: a write the rules refuse
   is the test's to judge, and the phone's own status says it on screen. */
firebase.firestore.setLogLevel('silent');

/* Every set() and update() a phone's sync.js makes, in order, as
   { who, set } or { who, update: [paths] }, the way fakefire records them —
   so a check can count writes and catch a loop. Recorded on the SDK's own
   DocumentReference, once, because a wrapper round it would not be the
   reference a transaction accepts. */
let log = null;
const whose = new WeakMap();
function record(ref) {
  const proto = Object.getPrototypeOf(ref);
  if (proto.__recorded) return;
  proto.__recorded = true;
  const set = proto.set, update = proto.update;
  proto.set = function (v, o) {
    if (log && whose.has(this.firestore)) log.push({ who: whose.get(this.firestore), path: this.path, set: JSON.parse(JSON.stringify(v)), merge: !!(o && o.merge) });
    return set.apply(this, arguments);
  };
  proto.update = function (u) {
    if (log && whose.has(this.firestore) && u && typeof u === 'object') log.push({ who: whose.get(this.firestore), path: this.path, update: Object.keys(u) });
    return update.apply(this, arguments);
  };
}

function world(port, projectId) {
  let seq = 0;
  const apps = [], writes = [];
  log = writes;

  /* A phone signed in to an account ({ account: true }) or, as most are,
     anonymous. `ls` is its localStorage, as fakefire's joined() makes it. */
  function phone(name, ls, opts) {
    ls = ls || {};
    opts = opts || {};
    const app = firebase.initializeApp({ projectId, apiKey: 'demo-key' }, 'phone' + (++seq) + '-' + name);
    apps.push(app);
    const db = app.firestore();
    whose.set(db, name);
    db.useEmulator('127.0.0.1', port, {
      mockUserToken: {
        sub: name, user_id: name,
        firebase: { sign_in_provider: opts.account ? 'google.com' : 'anonymous' },
        email: opts.account ? name + '@example.com' : undefined,
      },
    });
    const user = opts.account
      ? { uid: name, isAnonymous: false, email: name + '@example.com', displayName: name }
      : { uid: name, isAnonymous: true };
    const auth = {
      currentUser: user,
      getRedirectResult: () => Promise.resolve(null),
      onAuthStateChanged(cb) { setTimeout(() => cb(user)); return () => {}; },
      signInAnonymously: () => Promise.resolve({ user }),
      signOut: () => Promise.resolve(),
    };
    const ns = {
      apps: [app],
      initializeApp() {},
      firestore: Object.assign(() => db, { FieldValue: firebase.firestore.FieldValue }),
      auth: Object.assign(() => auth, { GoogleAuthProvider: { credential: () => ({}) } }),
    };
    const store = {
      getItem: (k) => (k in ls ? ls[k] : null),
      setItem: (k, v) => { ls[k] = String(v); },
      removeItem: (k) => { delete ls[k]; },
    };
    const errors = [], heard = {};
    const location = { origin: 'https://example.test', pathname: '/nourish-and-strengthen/' };
    const win = {
      firebase: ns, FIREBASE_CONFIG: { apiKey: 'demo-key', projectId }, crypto: webcrypto,
      localStorage: store, location,
      addEventListener(type, fn) { (heard[type] = heard[type] || []).push(fn); },
    };
    record(db.collection('households').doc('-'));
    syncFor(win, store, {}, location, Date,
      (f, ms) => setTimeout(() => { try { f(); } catch (e) { errors.push(e.message); } }, ms),
      clearTimeout);
    return {
      S: win.Store, ls, errors, db,
      // Firestore's own switch: writes queue in its memory, listeners hear the cache
      offline: () => db.disableNetwork(),
      online: () => db.enableNetwork().then(() => (heard.online || []).forEach((f) => f({}))),
    };
  }

  async function end() { await Promise.all(apps.map((a) => a.delete().catch(() => {}))); }
  return { phone, end, writes };
}

/* Until fn() is true, or say what never happened. The server is a real one
   on the other end of a socket, so there is no counting its timers the way
   fakefire's settle() does; what can be done is wait for the outcome itself,
   and fail with a sentence when it does not come. */
async function until(fn, what, ms) {
  const end = Date.now() + (ms || 10000);
  let last;
  while (Date.now() < end) {
    try { if (await fn()) return; } catch (e) { last = e; }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('never happened: ' + what + (last ? ' (' + last.message + ')' : ''));
}

module.exports = { world, until };
