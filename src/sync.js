/* ---------------------------------------------------------------------------
 * Store — favorites, the weeks, and their shopping-list check-offs.
 *
 * Two modes:
 *   local   nothing configured, or no household joined. Everything lives in this
 *           browser's localStorage. Works offline, works from a file:// URL.
 *   synced  src/config.js is filled in and a household code has been entered.
 *           The same things live in one Firestore document that both phones
 *           watch, so a change on one appears on the other in about a second.
 *           localStorage still mirrors everything, so the app keeps working
 *           with no signal and catches up when it returns.
 *
 * A week is a name, seven days of recipe ids, and the ticks on the shopping
 * list it produces. There can be any number of them; one is active, and the
 * active one is what the Meal Plan and Shopping List tabs show. Which week is
 * active is shared too — the two of you are meant to be looking at one list.
 *
 * Writes are field-level on purpose: adding a recipe to Tuesday touches only
 * weeks.<id>.plan.tue, and ticking milk touches only that one key. Two people
 * editing at once do not overwrite each other.
 * ------------------------------------------------------------------------- */

window.Store = (function () {
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var LS = {
    favs: 'bsc.favs', weeks: 'bsc.weeks', active: 'bsc.active', house: 'bsc.house',
    mine: 'bsc.mine', edits: 'bsc.edits',
    /* These two were missing for as long as the pantry has existed. saveLocal
       wrote to LS.pantry and LS.pantryNew, both of which were undefined, so
       both calls landed on one localStorage key literally named "undefined" —
       the second overwriting the first — and init read that same key back into
       both fields. Every "I don't keep this" answer died on the next reload,
       and state.pantry came back holding the {l,c} shape of pantryNew rather
       than the 1/0 the rest of this file expects. */
    pantry: 'bsc.pantry', pantryNew: 'bsc.pantryNew', houseNew: 'bsc.houseNew',
    kitchen: 'bsc.kitchen', src: 'bsc.src', rate: 'bsc.rate', opts: 'bsc.opts', low: 'bsc.low',
    diners: 'bsc.diners',
    plan: 'bsc.plan', checked: 'bsc.checked',  // the single week this replaced
    kept: 'bsc.houseKept',                      // what the household lost: see keepRemoved
    merge: 'bsc.houseMerge'                     // a join still to bring this phone's things: see setMerge
  };

  /* What the bug left behind. pantryNew was written second, so the stray key
     holds the shelf items somebody typed in by hand — the part that cannot be
     reconstructed from anything else. The overrides that were written first
     are not recoverable; they were overwritten on every save. Read once, moved
     to its proper key, and the stray removed so this never runs again. */
  function rescueStrayPantry() {
    try {
      if (localStorage.getItem('bsc.pantryNew') === null) {
        var stray = localStorage.getItem('undefined');
        if (stray) localStorage.setItem('bsc.pantryNew', stray);
      }
      localStorage.removeItem('undefined');
    } catch (e) { /* private mode: nothing to rescue and nowhere to put it */ }
  }

  /* The week carried over from the one-week version gets a fixed id, so if both
     phones do the conversion at the same moment they write the same thing
     rather than two copies of the same week. */
  var FIRST = 'w1';

  /* mine  recipes written here, keyed by their own id
     edits  changes to a printed recipe, keyed by its number — kept apart from
            the recipe so the original is never lost and can always be restored */
  var state = { favs: [], weeks: {}, active: '', plan: {}, checked: {}, mine: {}, edits: {},
    /* The shelf. `pantry` holds only the answers that differ from the book's
       — key -> 1 kept, 0 not — so a household that changes nothing carries
       nothing, and a food added to the storehouse list later is picked up
       rather than frozen at whatever it was the day someone first looked.
       `pantryNew` is what they keep that the books never mention. */
    pantry: {}, pantryNew: {},
    /* The kitchen, which is not the storehouse. Blake: "I should just be able
       to tell it what I have in my pantry, whether I pick it up from the
       storehouse or not." kitchen  food -> 1 have it, 0 do not (over a dried
       spice's default); src  food -> 's' storehouse or 'b' buy, over the
       storehouse order; rate  recipe -> 2 a favourite, 1 liked, -1 not
       again; opts  household switches, `store` for shopping the storehouse.
       All four merge a key at a time, like the shelf. */
    kitchen: {}, src: {}, rate: {}, opts: {},
    /* low  a staple that has run out: food -> 1, on the list until it is not */
    low: {},
    /* diners  a dinner's share of each person's Nourish plan, by account:
       uid -> {n name, kc calories, p protein}. Blake: "what if my wife has a
       different plan?" Only the dinner's two numbers come here, never the
       weight or the day's log, which stay in the person's own account; and
       each person writes only their own (see setMyDiner, and the rules). */
    diners: {} };
  var MAPS = ['kitchen', 'src', 'rate', 'opts', 'low', 'diners'];
  /* What each may hold, checked at the door like a recipe: anything else is
     a phone on another version or a half-written field, and costs its key. */
  var MAP_OK = {
    kitchen: function (v) { return v === 1 || v === 0; },
    src: function (v) { return v === 's' || v === 'b'; },
    rate: function (v) { return v === 2 || v === 1 || v === -1; },
    opts: function (v) { return v === 1 || v === 0; },
    low: function (v) { return v === 1; },
    /* A name somebody else typed, shown on everybody's phone, so it is held
       to exactly the three things and their sizes; the rules say the same. */
    diners: function (v) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
      var ks = Object.keys(v);
      return ks.length === 3 && ks.every(function (k) { return k === 'n' || k === 'kc' || k === 'p'; }) &&
        typeof v.n === 'string' && v.n === v.n.trim() && v.n.length >= 1 && v.n.length <= 30 &&
        typeof v.kc === 'number' && v.kc >= 150 && v.kc <= 3000 &&
        typeof v.p === 'number' && v.p >= 0 && v.p <= 400;
    }
  };
  /* A diner's key is an account's id, which goes into a chip's value and a
     field path; Firebase's are letters and digits, and anything else (a
     '__proto__' among them) is not one. */
  var DINER_ID = /^[A-Za-z0-9]{1,128}$/;
  /* Every other map key goes into a Firestore field path too. A dot in one
     splits it, so the key the household holds is never the key this phone
     deletes — and the phone deletes it again on every snapshot, forever, on
     every phone (253 writes in three seconds, and the badge said synced). A
     star, a slash or an empty piece makes the client throw, in the middle of
     a snapshot, and the household goes quiet on that phone with nothing on
     screen. The keys the app makes are letters, digits, '_' and '-'
     (encodeKey, newId, newRecipeId); any other key is somebody's input. */
  var KEY_OK = /^[A-Za-z0-9_-]{1,200}$/;
  // a week's id as the app makes them: a Sunday (weekIdOf), or 'w' and newId
  var WEEK_ID = /^(d\d{8}|w[A-Za-z0-9_]{1,40})$/;
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  /* A diner's numbers as the app would have written them: the name trimmed,
     the numbers whole. The rules take a name with a space on the end and a
     calorie count with a fraction; held to the letter, both vanished. */
  function dinerNorm(v) {
    if (!v || typeof v !== 'object' || typeof v.n !== 'string') return v;
    return Object.assign({}, v, { n: v.n.trim().slice(0, 30) },
      typeof v.kc === 'number' && isFinite(v.kc) ? { kc: Math.round(v.kc) } : {},
      typeof v.p === 'number' && isFinite(v.p) ? { p: Math.round(v.p) } : {});
  }
  function cleanMap(k, v) {
    var o = obj(v), out = {};
    Object.keys(o).forEach(function (key) {
      if (!(k === 'diners' ? DINER_ID : KEY_OK).test(key)) return;
      var val = k === 'diners' ? dinerNorm(o[key]) : o[key];
      if (MAP_OK[k](val)) out[key] = val;
    });
    return out;
  }
  /* A week's cooked nights: which dinners have been made, said once by
     whoever cooked and seen on every phone in the household. A day of the
     week, ticked; nothing else. */
  function cleanCooked(v) {
    var o = obj(v), out = {};
    Object.keys(o).forEach(function (d) { if (DAY_KEYS.indexOf(d) >= 0 && o[d] === true) out[d] = true; });
    return out;
  }
  // a week's check-offs: the keys encodeKey makes, each one ticked
  function cleanChecked(v) {
    var o = obj(v), out = {};
    Object.keys(o).forEach(function (key) { if (KEY_OK.test(key) && o[key] === true) out[key] = true; });
    return out;
  }
  /* local      not sharing — this phone only
     connecting  joined, still waiting for the first word from the server
     synced      the server has everything this phone has
     sending     changes made here have not been acknowledged yet
     waiting     no signal, and nothing of ours is queued — we may be missing theirs
     error       sharing has stopped, and statusNote says why

     "offline" used to cover the last three at once, which is why it explained
     nothing: it was equally the state of a phone that had just been opened, a
     phone holding an unsent change, and a phone that had simply lost signal.
     Those want three different sentences from the person reading them. */
  var status = 'local';
  var lastSync = 0;           // when the server last confirmed, ms
  var everLive = false;       // have we heard from the server at all this session
  var statusNote = '';
  var house = '';
  var pendingMerge = false;   // set by join(), consumed by the next connect()
  /* Written down as well as held, for the reason houseMine below is: a join
     made with no signal contributes on the next connect, and the next
     connect may be after the app was closed. Held only in memory, the
     intention died with the app while join() had already saved the code —
     so the next launch adopted the household over the top of this phone,
     and its favorites, ratings and pantry went with it, on a test as on a
     phone (the emulator check "a join made with no signal still brings
     this phone's things"). */
  function setMerge(v) { pendingMerge = !!v; write(LS.merge, pendingMerge ? 1 : 0); }
  /* This phone's own dated weeks that a join put aside as templates, because
     the household had planned those dates already: [{name, dates}], said
     once (parkedNote). The household's week stands, which is right, and hers
     used to vanish from the calendar with no word on screen — kept only
     under Cook this again, on a week with an empty night. */
  var parked = null;
  /* Whether this code is ours to bring into being.
   *
     A code is not a login and there is no password on the document, so the
     only thing standing between a typo and somebody else's grocery list is
     that the code is hard to guess. What there was no guard on at all was a
     typo that matches NOBODY: connect() seeded a brand-new household from
     whatever was on the phone, and the sheet then said "Shared, just now",
     pixel for pixel what a real join says. You end up alone in a household
     of one, syncing perfectly with nobody, with nothing to tell you.
   *
     Creating still has to seed, and a household created with no signal is
     seeded on the next connect, possibly after a reload — so the intent
     cannot live in memory and cannot be inferred from `seeded`, which is
     false for both an unverified create and every typed code. It is
     written down instead, by the one caller entitled to it. */
  var houseMine = false;
  var queued = [];            // writes made before the connection was up
  /* Who belongs to this household, by account. Recorded on every signed-in
     visit. It gates nothing about reading — the code is still the key, by
     choice — but the rules keep it honest: it changes only by the person
     writing putting themselves on or taking themselves off, and only a
     member can make an invite. */
  var members = [];
  var enrolling = '';         // the household an enrol write is out for
  var dinerRefused = false;   // the server would not take this account's dinner numbers
  var heard = 0, heardWas = '';   // the household, changed, from the server: see api.heard
  var listeners = [];
  var db = null, doc = null, unsub = null, FV = null;

  // ---------------------------------------------------------------- helpers
  function read(k, d) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  }
  /* Whether the last save of each key failed. A write that failed used to
     be swallowed as "private mode", which is true of private mode and a lie
     on a phone whose storage is full: the week planned and the recipe
     written sat on screen looking kept, and were gone on the next open.
     My Day and Strengthen already say so when it happens (mPut, LSFULL);
     storageFull is how the app learns it here. */
  var lsBad = {};
  function write(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      delete lsBad[k];
      return true;
    } catch (e) {
      lsBad[k] = 1;
      return false;
    }
  }
  /* Whether this phone can still take a few dozen bytes, asked at every
     open. The saves at init put each key back with the same bytes, which a
     full phone allows, so after a reload nothing had failed yet, and the
     app said nothing until the next thing was lost. */
  function probeStorage() {
    try { localStorage.setItem('sh.probe', new Array(65).join('x')); localStorage.removeItem('sh.probe'); }
    catch (e) { lsBad['sh.probe'] = 1; }
  }
  function saveLocal() {
    write(LS.favs, state.favs); write(LS.weeks, state.weeks); write(LS.active, state.active);
    write(LS.mine, state.mine); write(LS.edits, state.edits);
    write(LS.pantry, state.pantry); write(LS.pantryNew, state.pantryNew);
    MAPS.forEach(function (k) { write(LS[k], state[k]); });
  }
  /* Each listener on its own: one that throws is reported, and the others,
     and whatever comes after the emit, still run. */
  function emit() {
    listeners.forEach(function (f) {
      try { f(state, status, statusNote, house); } catch (e) { setTimeout(function () { throw e; }); }
    });
  }
  function setStatus(s, note) { status = s; statusNote = note || ''; emit(); }

  /* Firestore field names cannot contain dots or slashes, and shopping-list
     keys are raw ingredient text. Encode once, use the same key everywhere. */
  function encodeKey(k) { return String(k).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, ''); }

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }

  /* A map of recipes, with anything the app cannot render dropped. The book
     number is the one the renderer indexes with and the one that took the page
     down when it was wrong; name, ing and steps are the three the sheet reads
     without checking. Everything else has a default somewhere downstream. */
  /* Rebuilt field by field, rather than waved through.
   *
     This used to check four fields and then keep the whole object — `out[k] =
     r` — which meant every OTHER field arrived from the household document
     exactly as somebody else typed it, including fields nothing had ever
     thought to validate. secNum was one, and it is concatenated into a
     section key that two of the newer screens wrote straight into an HTML
     attribute; a household member could put a quote and an img tag in it and
     run script in everybody else's app. The escaping is fixed at those sinks
     too, but a sink-by-sink fix only holds until the next sink, and there is
     no shape here worth trusting a stranger to supply.
   *
     A household code is meant to be read aloud. Anyone who has ever heard one
     can write to that document forever, so what comes back is not friendly
     data — it is input. */
  function num(v, fallback) { return typeof v === 'number' && isFinite(v) ? v : fallback; }
  function str(v, fallback) { return typeof v === 'string' ? v : fallback; }

  /* A recipe id as this app makes them: a book's number, or a 'u' and
     letters for one somebody wrote (newRecipeId). The id goes into HTML
     attributes, into lookups on plain objects, and into Firestore paths, so
     one that looks like anything else is somebody else's input, not ours:
     a quote and an img tag in it ran script on every phone in the household,
     and 'constructor' found something in every lookup table. Dropped at the
     door, as a bad recipe is. */
  var OWN_ID = /^u[A-Za-z0-9_-]{1,40}$/, BOOK_ID = /^\d{1,6}$/;
  function idOk(v) {
    if (typeof v === 'number') return v >= 0 && v < 1e6 && Math.floor(v) === v;
    return typeof v === 'string' && (OWN_ID.test(v) || BOOK_ID.test(v));
  }

  /* A week's days: arrays of ids, or {i, x, lo} where the count or
     leftovers matter (see writeDay). A day that arrived as anything else
     took the list and the plan down on every phone in the household, and
     stayed down, because the bad copy was saved before anything drew. */
  function cleanPlan(v) {
    var o = obj(v), out = {};
    Object.keys(o).forEach(function (d) {
      // only the seven days: a day called 'mon*' made every write to the week throw
      if (DAY_KEYS.indexOf(d) < 0 || !Array.isArray(o[d])) return;
      var list = [];
      o[d].forEach(function (e) {
        if (idOk(e)) { list.push(e); return; }
        if (!e || typeof e !== 'object' || !idOk(e.i)) return;
        var x = num(e.x, 1), z = { i: e.i, x: x > 0 && x <= 100 ? x : 1 };
        if (e.lo === 1) z.lo = 1;
        list.push(z);
      });
      if (list.length) out[d] = lastOf(list, function (e) { return typeof e === 'object' ? e.i : e; });
    });
    return out;
  }
  /* The same dinner twice on a day — two phones adding it at two sizes,
     which arrayUnion takes for two things — is one dinner: the later
     statement about it stands. */
  function lastOf(list, idOf) {
    var seen = Object.create(null), out = [];
    for (var j = list.length - 1; j >= 0; j--) {
      var id = idOf(list[j]);
      if (seen[id]) continue;
      seen[id] = true;
      out.unshift(list[j]);
    }
    return out;
  }

  // what somebody keeps that the books never mention: a label and a shelf, both words
  function cleanPantryNew(v) {
    var o = obj(v), out = {};
    Object.keys(o).forEach(function (k) {
      var it = o[k];
      if (!KEY_OK.test(k)) return;      // the key is a field path when the pill is tapped
      if (!it || typeof it !== 'object' || typeof it.l !== 'string' || !it.l.trim()) return;
      out[k] = { l: it.l.slice(0, 120), c: typeof it.c === 'string' && it.c ? it.c.slice(0, 60) : 'Yours' };
    });
    return out;
  }

  function sane(v, key) {
    var src = obj(v), out = {};
    Object.keys(src).forEach(function (k) {
      if (!key.test(k)) return;
      var r = src[k];
      if (!r || typeof r !== 'object' || Array.isArray(r)) return;
      if (r.book !== 1 && r.book !== 2 && r.book !== 3) return;
      if (typeof r.name !== 'string') return;
      if (!Array.isArray(r.ing) || !Array.isArray(r.steps)) return;
      var mac = r.macro && typeof r.macro === 'object' && !Array.isArray(r.macro) ? r.macro : null;
      out[k] = {
        /* the key is the id, so nothing supplied can disagree with it */
        id: k,
        book: r.book,
        secNum: num(r.secNum, 1),
        secName: str(r.secName, 'Ours'),
        name: r.name,
        ing: r.ing.filter(function (x) { return typeof x === 'string'; }),
        steps: r.steps.filter(function (x) { return typeof x === 'string'; }),
        servings: str(r.servings, '1 Serving'),
        servN: num(r.servN, 1),
        time: str(r.time, '0 mins'),
        diff: r.diff === 'Medium' || r.diff === 'In-Depth' ? r.diff : 'Easy',
        tagline: typeof r.tagline === 'string' ? r.tagline : null,
        score: typeof r.score === 'number' && isFinite(r.score) ? r.score : null,
        est: !!r.est,
        own: !!r.own,
        no: num(r.no, 0),
        macro: mac ? {
          kcal: num(mac.kcal, 0), p: num(mac.p, 0), c: num(mac.c, 0),
          f: num(mac.f, 0), na: num(mac.na, 0), fib: num(mac.fib, 0)
        } : null,
        ingp: Array.isArray(r.ingp) ? r.ingp.filter(function (x) {
          return x && typeof x === 'object' && typeof x.k === 'string';
        }).map(function (x) {
          var item = { k: x.k, g: num(x.g, 0), u: str(x.u, 'g') };
          if (typeof x.a === 'string' && x.a) item.a = x.a;
          if (x.o) item.o = true;
          if (x.x) item.x = true;
          return item;
        }) : []
      };
    });
    return out;
  }

  function newId() {
    return 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  }

  /* Sixty-four words rather than sixteen, and drawn from the machine's own
     randomness rather than Math.random.

     The code is the only thing standing between a household and anybody else,
     and the rules let any signed-in client fetch a household by name — they
     have to, that is how joining works. Sixteen words either side of four
     digits is 2.3 million codes, which is a number a script can walk. Sixty-
     four either side is 36.9 million, sixteen times the work, for a code that
     is exactly as long to say down the phone and exactly as easy to type.
     Words are still concrete nouns with no near-homophones in the list, since
     these get read aloud across a kitchen.

     And Math.random is not unpredictable — it is not meant to be. Somewhere
     that a guessed value costs somebody their grocery list, the browser's
     crypto is free and right. Old codes keep working; nothing about joining
     changed, only what a new one is drawn from. */
  var CODE_WORDS = [
    'KETTLE', 'PANTRY', 'HEARTH', 'BASKET', 'ORCHARD', 'HARVEST', 'CELLAR', 'GRANARY',
    'SKILLET', 'LADLE', 'THISTLE', 'JUNIPER', 'CLOVER', 'BRAMBLE', 'MEADOW', 'QUARRY',
    'ANVIL', 'BARLEY', 'BEACON', 'BELLOWS', 'BIRCH', 'BRIDLE', 'BUTTER', 'CANDLE',
    'CANYON', 'CIDER', 'COBBLE', 'COMPASS', 'COPPER', 'CRADLE', 'DAMSON', 'FENNEL',
    'FURROW', 'GARLAND', 'GINGER', 'HAMMOCK', 'HAYLOFT', 'HOLLOW', 'HONEY', 'KINDLING',
    'LANTERN', 'LATTICE', 'MARROW', 'MILLET', 'MORTAR', 'NUTMEG', 'PADDOCK', 'PARSNIP',
    'PEBBLE', 'PEWTER', 'PIGEON', 'QUILT', 'RAFTER', 'RHUBARB', 'SADDLE', 'SORREL',
    'SPINDLE', 'TANSY', 'THIMBLE', 'TIMBER', 'TROWEL', 'VELVET', 'WALNUT', 'WILLOW'
  ];

  /* Uniform over `n`. Taking a random byte modulo 64 happens to be uniform,
     but taking one modulo 9000 is not, and a lopsided draw is a smaller
     keyspace than it looks. Rejection sampling costs nothing here. */
  function rnd(n) {
    var c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) {
      var limit = Math.floor(4294967296 / n) * n, v = new Uint32Array(1);
      do { c.getRandomValues(v); } while (v[0] >= limit);
      return v[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  /* And a third word. The code is still the only key — the owner chose to
     keep codes that can be read out rather than lock the household to its
     members list — so what can be done is make one harder to find by trying:
     64 × 9,000 × 64 × 64 is 2.4 billion, sixty-four times the walk of two
     words, for one more word said across the kitchen. Codes already handed
     out keep working; join() takes any code as it is typed. */
  function newCodeStr() {
    var pick = function () { return CODE_WORDS[rnd(CODE_WORDS.length)]; };
    return pick() + '-' + String(1000 + rnd(9000)) + '-' + pick() + '-' + pick();
  }

  /* state.plan and state.checked are the active week's, kept as plain fields so
     the rest of the app never has to know which week it is looking at. */
  function derive() {
    var w = state.weeks[state.active];
    state.plan = obj(w && w.plan);
    state.checked = obj(w && w.checked);
  }

  function ids() {
    return Object.keys(state.weeks).sort(function (a, b) {
      var oa = state.weeks[a].ord || 0, ob = state.weeks[b].ord || 0;
      return oa - ob || (a < b ? -1 : 1);
    });
  }

  /* ---- dated weeks -------------------------------------------------------
     A week is the seven days from a Sunday, and its id says which Sunday:
     d20260927. Blake: "a calendar type view... move forward or backward to
     see my history or my planning." Which week is on screen is this phone's
     own business (`view`), not the household's — scrolling to next week on
     one phone no longer moves the other. Undated weeks from before are either
     moved onto this week (the one that was "This Week") or kept as templates. */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function weekIdOf(date) {
    var d = new Date(date); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
    return 'd' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }
  function weekStart(id) {
    var m = /^d(\d{4})(\d{2})(\d{2})$/.exec(id || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
  }
  function isDated(id) { return !!weekStart(id); }
  // the seven days from a week's Sunday, as the Plan tab heads them: Sep 27 – Oct 3
  function span(st) {
    var end = new Date(st); end.setDate(end.getDate() + 6);
    var f = function (d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    return f(st) + ' \u2013 ' + f(end);
  }
  var view = '';                       // the week on this phone's screen; '' is this week
  function viewing() { return view || weekIdOf(new Date()); }
  var legacyActive = '';               // the shared "active" week an older version left

  function nextOrd() {
    return Object.keys(state.weeks).reduce(function (n, k) {
      return Math.max(n, (state.weeks[k].ord || 0) + 1);
    }, 0);
  }

  function wpath(suffix) { return 'weeks.' + state.active + (suffix ? '.' + suffix : ''); }

  /* The old named weeks, once: the one that was "This Week" (or the one that
     was showing) becomes this Sunday's week unless this week already has a
     plan, and every other one becomes a template. Written as one update — the
     rules let a write drop one week at most, and this drops exactly the one
     it moved. Returns the update for the household, or null if nothing to do. */
  function migrateWeeks() {
    var und = Object.keys(state.weeks).filter(function (k) { return !isDated(k) && !state.weeks[k].tpl; });
    if (!und.length) return null;
    var cur = weekIdOf(new Date()), weeks = Object.assign({}, state.weeks), u = {};
    var named = und.filter(function (k) { return /^this week$/i.test(weeks[k].name); })[0];
    var pick = named || (und.indexOf(legacyActive) >= 0 ? legacyActive : und[0]);
    var curPlan = obj(weeks[cur] && weeks[cur].plan);
    var curEmpty = !Object.keys(curPlan).some(function (d) { return Array.isArray(curPlan[d]) && curPlan[d].length; });
    if (curEmpty) {
      weeks[cur] = { name: '', ord: 0, plan: obj(weeks[pick].plan), checked: obj(weeks[pick].checked) };
      delete weeks[pick];
      /* Day by day and tick by tick, never the week whole: a write that set
         the whole week would take away whatever another phone had put on it
         since, if this one reached the server late. */
      Object.keys(weeks[cur].plan).forEach(function (d) { u['weeks.' + cur + '.plan.' + d] = weeks[cur].plan[d]; });
      Object.keys(weeks[cur].checked).forEach(function (k) { u['weeks.' + cur + '.checked.' + encodeKey(k)] = weeks[cur].checked[k]; });
      u['weeks.' + pick] = 'DELETE';
    } else pick = null;
    und.forEach(function (k) {
      if (k === pick) return;
      weeks[k] = Object.assign({}, weeks[k], { tpl: 1 });
      u['weeks.' + k + '.tpl'] = 1;
    });
    state.weeks = weeks;
    return u;
  }
  /* A dated week more than six months gone, one a time: the household keeps
     half a year of history and never runs up against the rules' ceiling. */
  function staleWeek() {
    var cut = new Date(); cut.setDate(cut.getDate() - 182);
    var old = Object.keys(state.weeks).filter(function (k) { var d = weekStart(k); return d && d < cut; }).sort();
    return old[0] || null;
  }
  /* The writes a snapshot makes by itself — a week moved onto its date, one
     too old pruned — are asked again by the next snapshot until they land.
     When the rules refuse one, Firestore undoes it locally, and that undoing
     is itself a snapshot, which asked again: a household whose document the
     rules refuse took 213 writes in three seconds from one phone on the
     emulator, for as long as the app stayed open. Refused once, a household
     is not asked again this session, as enrol already does for the list. */
  var tidyDenied = '';
  function denied(err) { return !!(err && err.code === 'permission-denied'); }
  function sendUpdate(u) {
    if (!doc || !u || !Object.keys(u).length || tidyDenied === house) return;
    var out = {}, at = house;
    Object.keys(u).forEach(function (k) { out[k] = u[k] === 'DELETE' ? FV.delete() : u[k]; });
    /* The client refuses a bad field path before it sends anything — by
       throwing, here, inside the snapshot that asked. Caught, so one bad key
       is one lost write and not a household that never speaks again. */
    try {
      doc.update(out).catch(function (err) { if (denied(err)) tidyDenied = at; });
    } catch (e) { /* the key check at the door says why */ }
  }

  /* Take a document — from the network or from localStorage — and make it the
     state. Returns true if it held no weeks and one had to be made, which is
     how a household saved by the previous version is carried over. */
  function adopt(d) {
    var weeks = {}, raw = obj(d.weeks), made = false;
    Object.keys(raw).forEach(function (k) {
      if (!WEEK_ID.test(k)) return;    // its id is a field path on every write to it
      var w = obj(raw[k]);
      weeks[k] = {
        name: typeof w.name === 'string' && w.name ? w.name : isDated(k) ? '' : 'Untitled week',
        ord: typeof w.ord === 'number' ? w.ord : 0,
        plan: cleanPlan(w.plan), checked: cleanChecked(w.checked)
      };
      var ck = cleanCooked(w.cooked);
      if (Object.keys(ck).length) weeks[k].cooked = ck;
      if (w.tpl === 1) weeks[k].tpl = 1;
    });
    if (!Object.keys(weeks).length) {
      weeks[FIRST] = { name: 'This Week', ord: 0, plan: cleanPlan(d.plan), checked: cleanChecked(d.checked) };
      made = true;
    }
    state.weeks = weeks;
    if (d.active && weeks[d.active] && !isDated(d.active)) legacyActive = d.active;
    state.active = viewing();
    /* Recipes arrive from the shared document, which means they arrive from
       somebody else's phone — an older version of the app, a half-finished
       write, a field that lost its type on the way. One record without a
       `book` the app knows took every render down, on every other phone in the
       household, with nothing on screen to say why and no way back except
       clearing the browser. So they are checked at the door, where a bad one
       costs its own recipe and nothing else. */
    state.mine = sane(d.mine, OWN_ID);
    state.edits = sane(d.edits, BOOK_ID);
    /* The shelf travelled one way only. setPantry and addPantryItem have
       always written pantry.<key> and pantryNew.<key> up to the document, but
       nothing ever read them back — so the second phone in a household never
       saw a word of it, and a phone that cleared its browser could not recover
       its own. */
    /* Only when the document actually carries them. A household written by any
       version before this one has no pantry field at all, and treating that as
       "the shelf is empty" would clear the very answers this change exists to
       keep — on the first load after the upgrade, before the phone had any
       chance to contribute them. An emptied shelf is a different thing and
       looks different: resetPantry writes pantry: {}, which is present. */
    if (d.pantry !== undefined) state.pantry = obj(d.pantry);
    if (d.pantryNew !== undefined) state.pantryNew = cleanPantryNew(d.pantryNew);
    /* Diners always, present or not. They are never this phone's to keep:
       a household without the field has nobody sharing, and a phone that
       moved from one household to another must not go on showing the first
       one's people. */
    /* The switches too: a household that never chose is on the defaults,
       and a phone that answered the front door alone takes the household's
       answer on joining, as the other phones have it. */
    MAPS.forEach(function (k) { if (d[k] !== undefined || k === 'diners' || k === 'opts') state[k] = cleanMap(k, d[k]); });
    derive();
    return made;
  }

  /* ------------------------------------------- what the household lost
   *
   * The code is a key that can be read aloud, kept on purpose, so anybody who
   * has ever heard it can reach the document — and every phone mirrors the
   * document, so whatever is taken from it is taken from every phone the next
   * time it listens. A recipe somebody wrote exists nowhere else. The rules
   * now stop it all going in one write (see firestore.rules); this is what
   * makes the rest recoverable.
   *
   * Before a snapshot from the household is adopted, anything it no longer
   * has that this phone still does — a recipe of your own, an edit to a
   * printed one, a week with dinners on it — is copied aside, here, on this
   * phone. It says nothing about who took it or why: the other person may
   * simply have deleted it, which is why nothing comes back by itself.
   * Sync & sharing lists it and offers to put it back; a month later, or on
   * "Leave them out", it is forgotten.
   *
   * This phone's own deletions never land here. They change the state first
   * (see push), so by the time the household echoes them back there is
   * nothing left over to notice. */
  var KEPT_DAYS = 30, KEPT_MOST = 60;
  function keptAll() {
    var k = read(LS.kept, []);
    if (!Array.isArray(k)) return [];
    var since = Date.now() - KEPT_DAYS * 86400000;
    return k.filter(function (x) { return x && typeof x === 'object' && x.at > since && x.v; });
  }
  function keepRemoved(d) {
    if (!house) return;
    var add = [], theirs = { mine: sane(d.mine, OWN_ID), edits: sane(d.edits, BOOK_ID) };
    ['mine', 'edits'].forEach(function (k) {
      Object.keys(state[k]).forEach(function (id) {
        if (!theirs[k][id]) add.push({ k: k, id: id, name: state[k][id].name, v: state[k][id] });
      });
    });
    /* Weeks only from a document that has weeks at all: one written by the
       one-week version has none, and is carried over rather than emptied. */
    if (d.weeks !== undefined) {
      var tw = obj(d.weeks), cut = new Date(); cut.setDate(cut.getDate() - 182);
      /* Not yet moved onto dates there: this phone's dated weeks are the
         move, not something taken away. */
      var unmoved = Object.keys(tw).some(function (k) { return !isDated(k) && !obj(tw[k]).tpl; });
      Object.keys(state.weeks).forEach(function (id) {
        var w = state.weeks[id], st = weekStart(id);
        if (tw[id] || !planned(w)) return;
        if (st && (unmoved || st < cut)) return;    // the move, or half a year gone and pruned
        add.push({ k: 'weeks', id: id, name: w.name,
          v: { name: w.name, ord: w.ord || 0, plan: obj(w.plan), checked: {} } });
      });
    }
    if (!add.length) return;
    var now = Date.now(), had = keptAll().filter(function (x) {
      return !add.some(function (a) { return a.k === x.k && a.id === x.id && x.house === house; });
    });
    add.forEach(function (x) { x.at = now; x.house = house; });
    write(LS.kept, add.concat(had).slice(0, KEPT_MOST));
  }

  /* Has anybody been put on a day of this week. An empty week is not worth
     carrying into a household that already has weeks in it. */
  function planned(w) {
    var plan = obj(w && w.plan);
    return Object.keys(plan).some(function (d) {
      return Array.isArray(plan[d]) && plan[d].length;
    });
  }

  function samePlan(a, b) {
    try { return JSON.stringify(obj(a)) === JSON.stringify(obj(b)); } catch (e) { return false; }
  }

  /* What this phone has that the household has not.
   *
   * Joining used to replace. adopt() overwrote the favorites, the weeks, the
   * edits and the recipes somebody had written themselves with whatever the
   * household held, and only the first device into a new household seeded it —
   * so the second one in always lost everything, with no warning and no undo.
   * That is the exact case the app invites: two people who have each been
   * using it, putting both phones on one list.
   *
   * So a join contributes instead. Favorites are a union. Recipes written here
   * and edits made here arrive under their own keys, and where both sides have
   * touched the same one the household's copy stands — it is the shared record
   * and this is a phone arriving at it.
   *
   * Weeks are the awkward part, because a fresh phone and a fresh household
   * both call their first week w1: the ids collide while the plans do not. So
   * a local week comes across when the household has nothing under that id, or
   * has something different under it, in which case it arrives under a new id
   * and both are kept. A name already in use gets a number after it, or the
   * household ends up with two weeks called This Week and no way to tell them
   * apart.
   *
   * Returns null when there is nothing to add, which is the ordinary case —
   * rejoining a household this phone already mirrors contributes nothing.
   * `parked`, when given, is told each of this phone's dated weeks that went
   * in as a template (see parkedNote). */
  function contribute(d, parked) {
    var out = {}, any = false;

    var theirFavs = Array.isArray(d.favs) ? d.favs : [];
    var favs = theirFavs.slice();
    state.favs.forEach(function (id) { if (favs.indexOf(id) < 0) favs.push(id); });
    if (favs.length !== theirFavs.length) { out.favs = favs; any = true; }

    /* pantry and pantryNew join these because they are the same shape of
       thing: a map keyed by something stable, where a key this phone has and
       the household has not is a contribution rather than a conflict. A shelf
       answer the household already holds stands, like everything else here. */
    /* Not opts: the household's switches are the household's. A phone that
       answered the front door on its own ("I keep my own") and then typed a
       code was flipping every phone in the household to its staples source,
       because a household on the defaults has no opts at all to stand. */
    ['mine', 'edits', 'pantry', 'pantryNew'].concat(MAPS.filter(function (k) { return k !== 'opts'; })).forEach(function (k) {
      // of the diners, only this account's own: the rules refuse anybody else's
      var theirs = obj(d[k]), mine = k === 'diners' ? ownDiners() : obj(state[k]), add = {};
      Object.keys(mine).forEach(function (id) {
        if (!(id in theirs)) add[id] = mine[id];
      });
      if (Object.keys(add).length) { out[k] = add; any = true; }
    });

    var theirWeeks = obj(d.weeks), addW = {};
    var used = Object.keys(theirWeeks).map(function (k) { return theirWeeks[k].name; });
    var ord = Object.keys(theirWeeks).reduce(function (n, k) {
      return Math.max(n, (theirWeeks[k].ord || 0) + 1);
    }, 0);
    Object.keys(state.weeks).forEach(function (id) {
      var w = state.weeks[id];
      if (!planned(w)) return;
      var mirror = theirWeeks[id];
      if (mirror && samePlan(mirror.plan, w.plan)) return;   // already there under this id
      /* A dated week goes in under its own date, nameless, if the household
         has nothing there. If the household planned those dates differently,
         this phone's plan comes along as a template — never as an undated
         week, which the move onto dates would take for the old This Week and
         put over the household's current one. Templates stay templates. */
      var st = weekStart(id), tpl = w.tpl === 1 || !!(st && mirror);
      if (st && !tpl) {
        addW[id] = { name: '', ord: ord++, plan: obj(w.plan), checked: obj(w.checked) };
        return;
      }
      var base = w.name || (st ? 'Week of ' + st.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'This Week');
      var name = base, n = 2;
      while (used.indexOf(name) >= 0) { name = base + ' (' + n++ + ')'; }
      used.push(name);
      var nw = { name: name, ord: ord++, plan: obj(w.plan), checked: tpl ? {} : obj(w.checked) };
      if (tpl) nw.tpl = 1;
      addW[mirror ? newId() : id] = nw;
      if (st && w.tpl !== 1 && parked) parked.push({ name: name, dates: span(st) });
    });
    if (Object.keys(addW).length) { out.weeks = addW; any = true; }

    return any ? out : null;
  }

  /* Exposed for tests/joining.test.js. What this does is the difference
     between joining a household and losing everything on the phone that
     joined, and it is worth checking without a network in front of it. */
  window.__contribute = function (d) { return contribute(d); };

  /* Also for tests. Both of these are invisible from outside and both are
     places a change quietly went missing: pendingMerge decides whether the
     next connect contributes or adopts, and queued holds the writes made
     before there was anywhere to send them. */
  window.__syncDebug = function () {
    return { pendingMerge: pendingMerge, queued: queued.length, status: status };
  };

  function configured() {
    var c = window.FIREBASE_CONFIG;
    return !!(c && c.apiKey && c.projectId);
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = res;
      s.onerror = function () { rej(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------ signing in, in place
   * Firebase's own Google sign-in leaves this page for
   * storehouse-recipe-book.firebaseapp.com and comes back. It keeps the
   * handshake in that origin's storage, and every current browser now
   * partitions storage by the top-level site — so the trip out worked, the
   * trip back read an empty box, and the code below fell through to an
   * anonymous account. From the outside: press the button, nothing happens,
   * and the app still does not know who you are.
   *
   * Google Identity Services never leaves the page. It hands the page an ID
   * token and Firebase takes it directly, so there is no second origin and
   * nothing to partition.
   *
   * Loaded on demand and never at boot: a visitor with no account must
   * fetch nothing from another host, which is the same rule the Firebase
   * SDK below already follows and a test already holds. */
  var GIS_SRC = 'https://accounts.google.com/gsi/client';
  var gisP = null;
  var gisInit = false, gisDone = null, gisFail = null;   // see mountGoogleButton
  function gisReady() {
    if (gisP) return gisP;
    var cid = window.GOOGLE_CLIENT_ID;
    if (!cid) return Promise.reject(new Error('no client id'));
    gisP = loadScript(GIS_SRC).then(function () {
      var g = window.google && window.google.accounts && window.google.accounts.id;
      if (!g) throw new Error('identity services did not load');
      return { id: g, cid: cid };
    });
    gisP.catch(function () { gisP = null; });      // let a later attempt retry
    return gisP;
  }

  /* The token in hand, become that person. Linking first so whatever is
     already on this device comes with you; when the account exists already
     the link is refused and the honest thing is to sign into it and let the
     older account's history stand — the same bargain the popup path makes. */
  function useIdToken(token) {
    return ready().then(function () {
      var auth = window.firebase.auth();
      var cred = window.firebase.auth.GoogleAuthProvider.credential(token);
      var cur = auth.currentUser;
      if (!cur || !cur.isAnonymous) return auth.signInWithCredential(cred);
      return cur.linkWithCredential(cred).catch(function (err) {
        if (err && /credential-already-in-use|email-already-in-use/.test(err.code || '')) {
          return auth.signInWithCredential(cred);
        }
        throw err;
      });
    });
  }

  // ------------------------------------------------------------- connecting
  /* The SDK, the app, offline persistence and the anonymous sign-in. Once,
     however many things ask for it — connecting to a household and claiming a
     new code both need all of it, and doing it twice would sign in twice. The
     promise is dropped again on failure so a later attempt can retry rather
     than inheriting the first one's error forever. */
  var readyP = null;
  /* Where a popup cannot be trusted: an installed app has no browser window
     to open one in, and phones in general treat popups as something to
     suppress. Desktop keeps the popup, where it stays on the same page and
     costs no reload. */
  function wantsRedirect() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone) return true;
    } catch (e) { /* older browser: fall through to the agent string */ }
    return /Android|iPhone|iPad|iPod/i.test((window.navigator && navigator.userAgent) || '');
  }

  function ready() {
    if (readyP) return readyP;
    readyP = (window.firebase && window.firebase.firestore
      ? Promise.resolve()
      : loadScript(SDK + 'firebase-app-compat.js')
        .then(function () { return loadScript(SDK + 'firebase-auth-compat.js'); })
        .then(function () { return loadScript(SDK + 'firebase-firestore-compat.js'); })
    ).then(function () {
      if (!window.firebase.apps.length) window.firebase.initializeApp(window.FIREBASE_CONFIG);
      db = window.firebase.firestore();
      FV = window.firebase.firestore.FieldValue;
      // keep working with no signal, and queue writes made while offline
      return db.enablePersistence({ synchronizeTabs: true }).catch(function () {});
    }).then(function () {
      /* A redirect sign-in finishes HERE, one page load later.
       *
         onAuthStateChanged alone would report the new user, but the one
         failure that matters is invisible without asking: linking the
         anonymous identity to a Google account that already exists is
         refused, and on the redirect path that refusal arrives only in the
         redirect result. Unasked, the sign-in looks like it silently did
         nothing. Ask, and fall back the same way the popup path does. */
      return window.firebase.auth().getRedirectResult().catch(function (err) {
        if (err && /credential-already-in-use|email-already-in-use/.test(err.code || '') &&
          err.credential) {
          return window.firebase.auth().signInWithCredential(err.credential);
        }
        return null;
      });
    }).then(function () {
      /* Wait for whatever identity the browser already holds before making a
         new one. signInAnonymously() on a page where somebody is signed in
         with their email replaces them with a stranger, and takes their
         second device with it. */
      return new Promise(function (done) {
        var off = window.firebase.auth().onAuthStateChanged(function (u) {
          off();
          if (u) return done(u);
          window.firebase.auth().signInAnonymously()
            .then(function (c) { done(c.user); }, function () { done(null); });
        });
      });
    });
    readyP.catch(function () { readyP = null; });
    return readyP;
  }

  // everything a household document holds, as this phone currently has it
  function localDoc() {
    var d = {
      favs: state.favs, weeks: state.weeks, active: state.active,
      mine: state.mine, edits: state.edits,
      pantry: state.pantry, pantryNew: state.pantryNew,
      kitchen: state.kitchen, src: state.src, rate: state.rate, opts: state.opts, low: state.low
    };
    /* Only with something in it. Rules published before diners existed
       refuse a field they have never heard of, and an empty one would have
       stopped anybody making a household until they were published again. */
    var mine = ownDiners();
    if (Object.keys(mine).length) d.diners = mine;
    return d;
  }

  // the signed-in account's own diner, if this phone holds one: all a phone may write of them
  function ownDiners() {
    var me = api.user(), out = {};
    if (me && hasOwn(state.diners, me.uid)) out[me.uid] = state.diners[me.uid];
    return out;
  }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function connect() {
    if (!configured() || !house) { setStatus('local'); return; }
    setStatus('connecting');

    /* Only an explicit join contributes. connect() also runs on every page
       load, and merging then would be wrong in a way that is hard to see: this
       phone's mirror is stale by definition, so anything the other phone had
       deleted since would be put back by the phone that had not heard yet. */
    var merging = pendingMerge;

    ready().then(function () {
      doc = db.collection('households').doc(house);
      return doc.get().then(function (snap) {
        if (!snap.exists) {
          // first device into a household we are creating seeds it with what is here
          if (houseMine) {
            setMerge(false);
            return doc.set(localDoc()).then(function () { write(LS.houseNew, ''); houseMine = false; });
          }
          /* We reached the server and there is no such household. Typing a
             code wrong is the likeliest way to arrive here, and the worst
             answer is to make the typo real. Let it go and say so; an
             offline join never reaches this line, because ready() rejects
             first and the code stays pending for the next try. */
          var missed = house;
          house = ''; write(LS.house, '');
          setMerge(false); doc = null;
          /* And what was waiting to go to it goes nowhere. It used to be kept,
             and sent after this into whichever household was joined next —
             and flushQueued ran straight after this line with no document,
             threw, and put "Cannot read properties of null" on screen in
             place of the sentence above. */
          queued = [];
          setStatus('local', 'No shared pantry with the code ' + missed + '. Check it and try again.');
          return;
        }
        if (!merging) return;
        var park = [], add = contribute(snap.data() || {}, park);
        /* Only once the contribution is actually away. This used to be cleared
           at the top of connect(), which meant a join attempted with no signal
           threw the intention away while join() had already written the house
           code to localStorage — so the next launch adopted the household over
           the top of this phone instead of contributing to it, which is the
           very thing contribute() exists to prevent, moved into the failure
           path where nobody would see it. */
        return Promise.resolve(add ? doc.set(add, { merge: true }) : null)
          .then(function () { setMerge(false); if (park.length) parked = park; });
      });
    }).then(flushQueued).then(function () {
      /* No household by that code: the sentence set above is the answer, and
         there is nothing to listen to. This went on to listen to nothing —
         "Cannot read properties of null" — and the catch below put that on
         screen in place of the sentence. */
      if (!doc) return;
      if (unsub) unsub();
      /* includeMetadataChanges, or the listener never hears the one thing the
         status is built from. Without it Firestore fires on DATA changes only,
         so the moment a write is acknowledged — hasPendingWrites going false,
         nothing else different — passed in silence, and the button sat on
         "Sending…" until somebody changed something else. Same for the first
         cache answer turning into a server answer: "Syncing…" forever. */
      unsub = doc.onSnapshot({ includeMetadataChanges: true }, function (snap) {
        var d = snap.data() || {};
        if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
          var now = JSON.stringify(d);
          if (now !== heardWas) { heardWas = now; heard++; }
        }
        members = Array.isArray(d.members)
          ? d.members.filter(function (m) { return typeof m === 'string'; }) : [];
        enrol();
        keepRemoved(d);
        state.favs = Array.isArray(d.favs) ? d.favs.slice() : [];
        var made = adopt(d);
        /* Moving and pruning weeks only from the server's copy. A phone
           opening offline holds a cached document from before another phone
           moved the weeks, and would queue the move again on top of it. */
        var live = !snap.metadata.fromCache, mig = live ? migrateWeeks() : null;
        if (live && !mig) { var st = staleWeek(); if (st) { var w0 = Object.assign({}, state.weeks); delete w0[st]; state.weeks = w0; mig = {}; mig['weeks.' + st] = 'DELETE'; } }
        derive();
        saveLocal();
        if (mig) sendUpdate(mig);
        /* Firestore answers a new listener out of its own cache first and the
           server a moment later, so a cache-only snapshot means "not yet" on
           the first one and "lost signal" on the hundredth. everLive is what
           tells those apart — without it the app announced OFFLINE half a
           second after opening, on a phone with five bars. */
        if (!snap.metadata.fromCache) { everLive = true; lastSync = Date.now(); }
        setStatus(snap.metadata.hasPendingWrites ? 'sending'
          : snap.metadata.fromCache ? (everLive ? 'waiting' : 'connecting')
            : 'synced');
        /* A household last written by the one-week version. Send the week up so
           the other phone sees the same thing; the old plan and checked fields
           are left alone rather than deleted, as a copy of what was there. */
        if (made && tidyDenied !== house) {
          var at = house;
          doc.set({ weeks: state.weeks, active: state.active }, { merge: true })
            .catch(function (err) { if (denied(err)) tidyDenied = at; });
        }
      }, function (err) {
        setStatus('error', err && err.code === 'permission-denied'
          ? 'Firestore refused the connection. Check the security rules in SETUP.md.'
          : (err && err.message) || 'Could not reach Firestore.');
      });
    }).catch(function (err) {
      setStatus('error', (err && err.message) || 'Could not start syncing. Still saving on this device.');
    });
  }

  // ------------------------------------------------------------------ writes
  /* Several writes that are one change — a week of dinners, a food moved
     from the shop to the kitchen — derive, save and redraw once, not once a
     write. The remote halves still go in order. */
  var batching = 0, batched = [];
  function push(remote, localChange) {
    localChange();
    derive();       // always: the next write in a batch reads what this one left
    if (batching) { batched.push(remote); return; }
    saveLocal();
    send(remote);   // before the redraw: the change is away whatever the screen does
    emit();
  }
  function send(remote) {
    /* Any state where we are actually joined. Firestore queues a write made
       with no signal and sends it when there is some, so refusing to try is
       the one thing that would genuinely lose it. */
    /* Not while 'error', it used to say. But 'error' is also what one refused
       write leaves behind until the next snapshot clears it, and a write made
       in that moment went to the queue below, which is only emptied by a
       connect — so it sat there, unsent, while the screen went back to
       "synced". With a document in hand Firestore takes the write itself,
       queues it with no signal, and says for itself if it is refused. */
    if (doc && status !== 'local') {
      var failed = function (err) { setStatus('error', (err && err.message) || 'Write failed.'); };
      // a refused field path throws before there is a promise; the same answer either way
      try { remote().catch(failed); } catch (err) { failed(err); }
      return;
    }
    /* Not local, but not able to send either: `doc` is null for the second or
       two it takes to fetch three scripts and sign in, and stays null after a
       failure. A tap in that window used to be applied here and then dropped —
       Firestore never saw it, so its own offline queue never held it, and the
       first snapshot to arrive adopted the household over the top of it. Held
       here instead, and sent by connect() before it starts listening. */
    if (house && configured()) queued.push(remote);
  }
  function batch(fn) {
    batching++;
    try { fn(); } finally {
      batching--;
      if (!batching && batched.length) {
        var go = fold(batched); batched = [];
        saveLocal();
        go.forEach(send);
        emit();
      }
    }
  }

  /* A write that is only field paths and what goes in them, DEL for a field
     taken out. Each was its own doc.update, so one tap on where the staples
     come from — three switches, four from the front door — was four billed
     writes and four snapshots on every phone in the household. Marked, so a
     batch can fold it into its neighbours. */
  var DEL = {};
  function plain(u) {
    var f = function () {
      var out = {};
      Object.keys(u).forEach(function (k) { out[k] = u[k] === DEL ? FV.delete() : u[k]; });
      return doc.update(out);
    };
    f.plain = u;
    return f;
  }
  /* Runs of plain writes, one write a run. A write that touches a path the
     run already has (the same field, or one inside it) starts a new run, and
     anything that is not plain — a set, a union, the two writes of a changed
     count — stays as it was, where it was, so the household still hears the
     changes in the order they were made. */
  function fold(list) {
    var out = [];
    list.forEach(function (f) {
      var last = out[out.length - 1];
      if (f.plain && last && last.plain && !clash(last.plain, f.plain)) {
        out[out.length - 1] = plain(Object.assign({}, last.plain, f.plain));
      } else out.push(f);
    });
    return out;
  }
  function clash(a, b) {
    return Object.keys(b).some(function (k) {
      return Object.keys(a).some(function (j) { return j === k || j.indexOf(k + '.') === 0 || k.indexOf(j + '.') === 0; });
    });
  }

  /* In order, all handed to Firestore at once, which sends one phone's writes
     in the order they were made and keeps them through no signal. Each used
     to wait for the server to acknowledge the one before, and the listening
     waited for all of them — so one write the rules refused stopped every
     write behind it, and the phone never heard the household again, while
     each retry sent the refused one first (the back-end review, 4 October;
     tests/rules/sync.check.js holds it now). A refused one says so and is
     the only one lost. */
  function flushQueued() {
    if (!queued.length || !doc) return Promise.resolve();
    var sending = queued; queued = [];
    var failed = function (err) { setStatus('error', (err && err.message) || 'Write failed.'); };
    sending.forEach(function (fn) {
      try { fn().catch(failed); } catch (err) { failed(err); }
    });
    return Promise.resolve();
  }

  /* A day entry as it is stored. Anything cooked at its own serving count
     goes in as a plain id, so a week only carries the {i, x} form where it
     means something. A leftovers night is the same dinner again, eaten not
     cooked: lo, so the shopping list leaves it out. */
  function stored(e) {
    if (e.lo) return { i: e.id, x: e.x || 1, lo: 1 };
    return e.x === 1 ? e.id : { i: e.id, x: e.x };
  }

  /* Store a day back.
   *
     `added` and `gone` say what changed, when that is all that changed, and
     then only that goes up: a dinner added is arrayUnion of that one entry,
     one taken off is arrayRemove of it. The whole day used to be written
     every time, and a day is a list — so a phone that had been offline sent
     its stale Tuesday when it came back and took off whatever the other
     phone had added in the meantime. Firestore applies union and remove on
     the server, against what is there then, so two phones adding at once
     both keep theirs. A change to an entry already there (its serving count)
     still writes the day whole; there is no smaller way to say it.
   *
     The path is fixed when the change is made, not when it is sent. A write
     queued before the connection was up went to whichever week was showing
     by the time it left.
   *
     `wk` is a week other than the one on screen, for the one change that
     reaches across the end of a week: Saturday cooked double, its leftovers
     on next week's Sunday. */
  function writeDay(day, entries, added, gone, wk) {
    var list = entries.map(stored);
    wk = wk || state.active;
    var path = 'weeks.' + wk + '.plan.' + day;
    var local = function () {
      editWeek(wk, function (w) { w.plan = Object.assign({}, w.plan); w.plan[day] = list; });
    };
    // the day whole is a plain write: Cook this again's nights go up as one
    if (!added && !(gone && gone.length)) {
      var whole = {}; whole[path] = list;
      push(plain(whole), local);
      return;
    }
    push(function () {
      var u = {};
      if (added && gone && gone.length) {
        /* A dinner's count changed: the old entry off, then the new one on,
           as two writes, since one write may not both take from a field and
           add to it. The day used to go up whole from this phone's copy, and
           took with it whatever the other phone had done to the day since —
           a double undone, a dinner taken off put back.
         *
           Both handed to Firestore at once, which sends one phone's writes in
           the order they were made. The second used to wait for the server
           to acknowledge the first, which with no signal it never did — so
           the removal was all that was queued, and a phone closed before the
           signal came back sent only that: the dinner was gone. */
        u[path] = FV.arrayRemove.apply(FV, gone);
        var v = {}; v[path] = FV.arrayUnion(stored(added));
        var off = doc.update(u);
        return Promise.all([off, doc.update(v)]);
      }
      if (added) u[path] = FV.arrayUnion(stored(added));
      else u[path] = FV.arrayRemove.apply(FV, gone);
      return doc.update(u);
    }, local);
  }

  /* One key of a shared map; null takes it out. */
  function setMapKey(map, key, v) {
    var u = {}; u[map + '.' + encodeKey(key)] = v === null ? DEL : v;
    push(plain(u), function () {
      state[map] = Object.assign({}, state[map]);
      if (v === null) delete state[map][key]; else state[map][key] = v;
    });
  }

  // a shallow copy of the active week, safe to mutate and assign back
  function editActive(fn) { editWeek(state.active, fn); }
  // any week, made if it is not there yet, as a first dinner on next week makes it
  function editWeek(id, fn) {
    var weeks = Object.assign({}, state.weeks);
    var w = Object.assign({ name: '', ord: 0, plan: {}, checked: {} }, weeks[id]);
    fn(w);
    weeks[id] = w;
    state.weeks = weeks;
  }

  /* Off the household's list and out of its diners, while there is still a
     document to say so to: on leaving, and on moving to another household.
     The rules let nobody else remove them, so an entry left behind stayed
     for good — the household went on offering "Hits Alice's plan" for
     somebody who had gone. Best effort, as deleteAccount's is. */
  function goodbye() {
    var me = api.user();
    if (!me || !doc || !FV || !(members.indexOf(me.uid) >= 0 || hasOwn(state.diners, me.uid))) return;
    var bye = { members: FV.arrayRemove(me.uid) };
    if (hasOwn(state.diners, me.uid)) bye['diners.' + me.uid] = FV.delete();
    try { doc.update(bye).catch(function () {}); } catch (e) { /* gone either way */ }
  }

  /* Put the signed-in person on the household's list, once. Anonymous
     visitors are not recorded: an anonymous identity lives and dies with one
     browser, and a list of those is a list of nobody. */
  var unenrolling = false;       // an account is being deleted: see deleteAccount
  var enrolDenied = '';          // the household whose rules refused this account; asked once
  function enrol() {
    var me = api.user();
    if (!me || !doc || !FV || !house || unenrolling) return;
    if (members.indexOf(me.uid) >= 0 || enrolling === house || enrolDenied === house) return;
    enrolling = house;
    doc.update({ members: FV.arrayUnion(me.uid) })
      .catch(function (err) {
        /* Refused outright (a full list, rules from before this version):
           asking again on every snapshot is a loop of refused writes. Anything
           else — no signal — the next snapshot tries again. */
        if (err && err.code === 'permission-denied') enrolDenied = house;
      })
      .then(function () { enrolling = ''; });
  }

  /* Long enough that nobody walks it: 24 characters of 36, drawn from the
     machine's randomness. Unlike a code it is never read aloud, so it does
     not have to be easy to say. */
  function newToken() {
    var a = '0123456789abcdefghijklmnopqrstuvwxyz', out = '';
    for (var i = 0; i < 24; i++) out += a.charAt(rnd(a.length));
    return out;
  }
  var INVITE_DAYS = 7;

  // ------------------------------------------------------------------ public
  var api = {
    get state() { return state; },
    get status() { return status; },
    get statusNote() { return statusNote; },
    /* Whether connect() would bring this code into being if the server had
       never heard of it. The decision is one line and the cost of getting
       it wrong is a household of one, so it is askable. */
    get houseIsMine() { return houseMine; },
    /* When the server last confirmed it had everything. 0 if it never has. */
    get lastSync() { return lastSync; },
    get house() { return house; },
    get configured() { return configured(); },
    // a save to this phone's storage is failing: see write
    get storageFull() { return Object.keys(lsBad).length > 0; },
    encodeKey: encodeKey,

    /* The signed-in Firestore handle, for the one thing in this app that
       deliberately does not go through this file. My Day is personal — it
       has been kept out of the household document on purpose since it was
       built — but "personal" was only ever an argument about WHOSE data it
       is, never about which devices should see it. It borrows the connection
       and keeps its own document. */
    ready: function () { return ready().then(function () { return db; }); },

    /* ------------------------------------------------------------------ who
     * Everyone is signed in anonymously and everyone can use the whole app
     * that way, on their own device, forever. An account is not a gate on the
     * app; it is the only way to be recognised on a SECOND device, which is
     * the only thing it is offered for.
     *
     * Signing in links the anonymous identity rather than replacing it, so
     * whatever is already on the device comes along. When the account is
     * already in use somewhere else that link is refused, and the honest
     * thing then is to sign into it and let the older account's data stand —
     * it is the one with the history. */
    user: function () {
      var u = window.firebase && window.firebase.auth && window.firebase.auth().currentUser;
      return u && !u.isAnonymous ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null;
    },
    uid: function () {
      var u = window.firebase && window.firebase.auth && window.firebase.auth().currentUser;
      return u ? u.uid : '';
    },
    onUser: function (cb) {
      /* Caught: offline, the SDK does not load and ready() rejects. The
         caller already learns that through its own ready(); left unhandled
         here it was an uncaught rejection on every offline start of a
         signed-in device. It says whether it is watching, so a caller whose
         first try found no signal knows to ask again once there is some. */
      return ready().then(function () {
        window.firebase.auth().onAuthStateChanged(function () { cb(); });
        return true;
      }, function () { return false; /* no network: nothing to watch yet */ });
    },

    /* A popup is the wrong instrument on a phone.
     *
       Inside an installed PWA there is no window to put it in: Android hands
       the popup to the browser as a separate task, and the promise waiting on
       it may reject as blocked or simply never settle. Either way the app sat
       there having apparently done nothing, and the only thing left to do was
       press it again — which is what "I seem to be logging in more than I
       should" felt like from the outside. Redirect leaves the page and comes
       back signed in, which is the flow phones are built for. */
    wantsRedirect: wantsRedirect,

    /* Google's own button, and it has to be Google's: the ID-token flow has no
       way to be started from a button of ours. It is drawn into whatever
       element is handed over, and the caller keeps its own button ready for
       the case where this never loads at all — a browser with the host
       blocked, or no client id configured.
     *
       Rejects rather than throwing into nowhere, so the sheet can put its own
       button back and say why. */
    mountGoogleButton: function (el, onDone, onFail) {
      if (!el) return Promise.reject(new Error('nowhere to put it'));
      gisDone = onDone; gisFail = onFail;
      return gisReady().then(function (g) {
        /* Once a page, not once a draw. The sign-in sheet is redrawn on every
           change anywhere in the app, and each redraw initialised Google's
           library again — which it warns against, and which is where the
           test sandbox's "gis is not defined" was coming from twice over.
           The callback reads whichever handlers the latest draw handed in. */
        if (!gisInit) {
          g.id.initialize({
            client_id: g.cid,
            /* FedCM is how a current browser draws the account chooser, and
               from 2025 it is the only way this library is allowed to. */
            use_fedcm_for_prompt: true,
            callback: function (res) {
              var token = res && res.credential;
              var done = gisDone, fail = gisFail;
              if (!token) { if (fail) fail(new Error('no token came back')); return; }
              useIdToken(token).then(function () { if (done) done(); },
                function (err) { if (fail) fail(err); });
            }
          });
          gisInit = true;
        }
        // the same slot, still holding the button drawn last time: leave it be
        if (el.getAttribute('data-gis') === '1' && el.firstChild) return true;
        el.setAttribute('data-gis', '1');
        el.innerHTML = '';
        g.id.renderButton(el, {
          type: 'standard', theme: 'outline', size: 'large',
          text: 'signin_with', shape: 'pill', logo_alignment: 'left',
          width: Math.max(220, Math.min(360, Math.round(el.clientWidth || 280)))
        });
        return true;
      });
    },

    signInGoogle: function () {
      return ready().then(function () {
        var auth = window.firebase.auth();
        var prov = new window.firebase.auth.GoogleAuthProvider();
        var cur = auth.currentUser;
        if (wantsRedirect()) {
          return cur && cur.isAnonymous
            ? cur.linkWithRedirect(prov)
            : auth.signInWithRedirect(prov);
        }
        var link = cur && cur.isAnonymous
          ? cur.linkWithPopup(prov)
          : auth.signInWithPopup(prov);
        return link.catch(function (err) {
          // already an account of its own: sign into it, keep its history
          if (err && /credential-already-in-use|email-already-in-use/.test(err.code || '')) {
            return auth.signInWithCredential(err.credential);
          }
          throw err;
        });
      });
    },

    /* No password to invent, forget, or store. The link is the proof. */
    sendEmailLink: function (email) {
      return ready().then(function () {
        /* Pinned to the page, not to whatever is in the address bar. Deriving
           it from location.href carried a spent oobCode from a failed attempt
           into the next link's continueUrl, and the duplicate parameter made
           every retry read the stale code and fail. */
        var settings = { url: location.origin + location.pathname, handleCodeInApp: true };
        return window.firebase.auth().sendSignInLinkToEmail(email, settings).then(function () {
          try { localStorage.setItem('bsc.emailForLink', email); } catch (e) { /* private */ }
        });
      });
    },
    completeEmailLink: function () {
      return ready().then(function () {
        var auth = window.firebase.auth();
        if (!auth.isSignInWithEmailLink(location.href)) return null;
        var email = '';
        try { email = localStorage.getItem('bsc.emailForLink') || ''; } catch (e) { /* private */ }
        if (!email) email = window.prompt('Which email did you ask for the link with?') || '';
        if (!email) return null;
        var cur = auth.currentUser;
        var cred = window.firebase.auth.EmailAuthProvider.credentialWithLink(email, location.href);
        var go = (cur && cur.isAnonymous
          ? cur.linkWithCredential(cred)
          : auth.signInWithCredential(cred)
        ).catch(function (err) {
          if (err && /credential-already-in-use|email-already-in-use/.test(err.code || '')) {
            return auth.signInWithCredential(cred);
          }
          throw err;
        });
        var scrub = function () {
          /* The sign-in parameters are in the QUERY, not the fragment, so the
             old line — pathname + search — put back everything it meant to
             remove. And it only ran on success, leaving an unspent code in
             the bar and the history of every failed attempt. */
          try {
            var q = new URLSearchParams(location.search);
            ['mode', 'oobCode', 'apiKey', 'continueUrl', 'lang', 'tenantId'].forEach(function (k) {
              q.delete(k);
            });
            var rest = q.toString();
            history.replaceState({}, '', location.pathname + (rest ? '?' + rest : ''));
          } catch (e) { /* older browser: the link stays in the bar */ }
        };
        return go.then(function (res) {
          try { localStorage.removeItem('bsc.emailForLink'); } catch (e) { /* private */ }
          scrub();
          return res;
        }, function (err) { scrub(); throw err; });
      });
    },

    /* Delete the account outright: the record first, then the identity.

       That order is the whole of it. Firestore's rule on /users/{uid} is
       `request.auth.uid == uid` — so deleting the sign-in first would leave a
       document nobody on earth can reach, least of all its owner, and no way
       left to ask for it to go. The record goes while there is still somebody
       entitled to remove it.

       Firebase refuses to delete an identity that has not signed in recently,
       which is correct and is not an error to swallow: it comes back as
       'recent-login' so the caller can say so rather than reporting a success
       that did not happen.

       Then straight back to an anonymous identity, because every visitor has
       one and the app is unusable without it. Deleting your account is not
       the same as deleting the app. */
    deleteAccount: function (onGone) {
      return ready().then(function () {
        var auth = window.firebase.auth();
        var u = auth.currentUser;
        if (!u || u.isAnonymous) return Promise.reject(new Error('no-account'));
        /* The document has to go while this device is still signed in. Once
           the identity is deleted there is no uid left to authorise the
           delete, and the data would be stranded on the server after somebody
           asked for it to be destroyed. So: data first, always.
         *
           Which means the failure below happens with the data ALREADY GONE,
           and the caller has to be told which of the two failures it is.
           Reporting "could not delete, sign in again first" over a wiped
           account reads as "nothing happened" — and the one thing that had
           happened was the irreversible half. */
        var wiped = false, mine = db.collection('users').doc(u.uid);
        /* Strengthen's workouts live a year to a record under this one, and
           deleting a record in Firestore leaves the records under it where
           they are. So those go first, every one of them, then this. A
           refusal to list them means the rule that lets them exist was never
           published, so there are none. */
        /* Off the household's list first, while there is still a uid to
           remove. The list is who belongs by account; an account that has
           asked to be deleted does not, and its id left there is a record of
           it kept after it asked to be forgotten. Best effort: a household
           this device has left, or no signal for it, does not stop the rest.
         *
           And not put straight back: the echo of this write is a snapshot,
           and every snapshot enrols whoever is signed in — which, until the
           identity is gone, is still this account. */
        unenrolling = true;
        /* And its dinner numbers, in the same write, for the same reason —
           only when there are some, so a household on rules from before
           diners existed is not asked to take a field it has never heard of. */
        var bye = FV ? { members: FV.arrayRemove(u.uid) } : null;
        if (bye && hasOwn(state.diners, u.uid)) bye['diners.' + u.uid] = FV.delete();
        var off = house && doc && FV
          ? doc.update(bye).catch(function () { return null; })
          : Promise.resolve();
        return off.then(function () { return mine.collection('train').get(); })
          .then(function (qs) { return Promise.all(qs.docs.map(function (d) { return d.ref.delete(); })); },
            function (err) { if (err && err.code === 'permission-denied') return null; throw err; })
          .then(function () { return mine.delete(); })
          .then(function () { wiped = true; return onGone ? onGone() : null; })
          .then(function () { return u.delete(); })
          .catch(function (err) {
            // the account stands after all, and belongs on the list again
            unenrolling = false;
            if (err && err.code === 'auth/requires-recent-login') {
              throw new Error(wiped ? 'recent-login-wiped' : 'recent-login');
            }
            throw err;
          })
          .then(function () { return auth.signInAnonymously(); })
          .then(function (r) { unenrolling = false; return r; });
      });
    },

    signOutAccount: function () {
      return ready().then(function () {
        return window.firebase.auth().signOut().then(function () {
          return window.firebase.auth().signInAnonymously();
        });
      });
    },

    init: function (onChange) {
      listeners.push(onChange);
      probeStorage();
      rescueStrayPantry();
      state.favs = read(LS.favs, []);
      /* The pantry goes through adopt with everything else now that adopt
         restores it — reading it into state first and then calling adopt would
         hand it straight back an empty document and undo the read. */
      adopt({
        weeks: read(LS.weeks, null),
        active: read(LS.active, ''),
        mine: read(LS.mine, {}),
        edits: read(LS.edits, {}),
        pantry: read(LS.pantry, {}),
        pantryNew: read(LS.pantryNew, {}),
        kitchen: read(LS.kitchen, {}), src: read(LS.src, {}), rate: read(LS.rate, {}), opts: read(LS.opts, {}), low: read(LS.low, {}),
        diners: read(LS.diners, {}),
        plan: read(LS.plan, {}),        // whatever the one-week version left behind
        checked: read(LS.checked, {})
      });
      migrateWeeks();
      derive();
      saveLocal();
      house = read(LS.house, '') || '';
      houseMine = read(LS.houseNew, null) === '1';
      /* A household already on this device predates the flag, and being
         strict with it would evict people who joined perfectly well. The
         rule is for codes typed from here on. */
      if (house && read(LS.houseNew, null) === null) { houseMine = true; write(LS.houseNew, '1'); }
      pendingMerge = !!house && read(LS.merge, 0) === 1;
      if (house && configured()) connect(); else setStatus('local');

      /* A way out of 'error'. It used to latch for the whole session: the SDK
         fails to load on a phone with no bars, status goes to error, and
         nothing ever tried again — so everything after that was held in the
         queue above with nowhere to go until the app was killed and reopened.
         Coming back onto a network is the moment to retry, and connect() is
         safe to call twice: it drops the old listener before taking a new one. */
      if (window.addEventListener) {
        window.addEventListener('online', function () {
          if (house && configured() && (status === 'error' || status === 'waiting')) connect();
        });

        /* Two tabs of the app used to be two separate copies of everything.
           Each held the state it had read at load, each wrote the whole of it
           on every change, and neither ever looked again — so planning a week
           in one tab and ticking the list in the other meant whichever saved
           last erased the other's work, including recipes somebody had
           written. A household hides it, because Firestore tells both tabs;
           on a phone with no sharing set up there was nothing to tell them.

           The storage event fires only in the *other* tabs, which is exactly
           the ones that need to hear. Firestore's own synchronizeTabs handles
           the joined case, so this only steps in when there is no household. */
        window.addEventListener('storage', function (e) {
          if (house || !e || !e.key || e.key.indexOf('bsc.') !== 0) return;
          if (e.key === LS.house) return;
          state.favs = read(LS.favs, []);
          adopt({
            weeks: read(LS.weeks, null), active: read(LS.active, ''),
            mine: read(LS.mine, {}), edits: read(LS.edits, {}),
            pantry: read(LS.pantry, {}), pantryNew: read(LS.pantryNew, {}),
            kitchen: read(LS.kitchen, {}), src: read(LS.src, {}), rate: read(LS.rate, {}), opts: read(LS.opts, {}), low: read(LS.low, {}),
            diners: read(LS.diners, {})
          });
          emit();
        });
      }
    },

    isFav: function (id) { return state.favs.indexOf(id) >= 0; },

    toggleFav: function (id) {
      var on = state.favs.indexOf(id) < 0;
      push(function () {
        return doc.set({ favs: on ? FV.arrayUnion(id) : FV.arrayRemove(id) }, { merge: true });
      }, function () {
        state.favs = on ? state.favs.concat(id) : state.favs.filter(function (x) { return x !== id; });
      });
    },

    // ------------------------------------------------------------- the weeks
    /* [{id, name, active}] in the order they are shown. */
    weeks: function () {
      return ids().map(function (k) {
        return { id: k, name: state.weeks[k].name, active: k === state.active };
      });
    },

    /* The week on screen: its id, when it starts, and what to call it. */
    activeWeek: function () {
      var w = state.weeks[state.active], st = weekStart(state.active);
      if (!st) return { id: state.active, name: (w && w.name) || 'This Week', start: null };
      return { id: state.active, name: span(st), start: st };
    },
    weekIdOf: weekIdOf,
    weekStart: weekStart,
    thisWeek: function () { return weekIdOf(new Date()); },

    /* Show another week on this phone. Nothing is written: a week exists in
       the household only once something is planned in it. */
    setWeek: function (id) {
      if (!id || id === state.active) return;
      view = id === weekIdOf(new Date()) ? '' : id;
      state.active = viewing();
      derive();
      emit();
    },

    /* Any week's day, not only the one on screen: Nourish reads the day it
       is showing from the week that day belongs to. */
    dayOf: function (weekId, day) {
      var w = state.weeks[weekId], list = (w && w.plan && w.plan[day]) || [];
      return list.map(function (e) {
        return typeof e === 'object' && e ? { id: e.i, x: e.x || 1, lo: e.lo === 1 } : { id: e, x: 1, lo: false };
      }).filter(function (e) { return e.id !== undefined && e.id !== null && e.id !== ''; });
    },

    /* The weeks you can cook again: saved templates, and dated weeks that
       had anything in them, newest first. */
    sources: function () {
      var count = function (w) {
        var n = 0, p = obj(w.plan);
        Object.keys(p).forEach(function (d) { n += (p[d] || []).length; });
        return n;
      };
      return Object.keys(state.weeks).filter(function (k) { return k !== state.active && count(state.weeks[k]); })
        .map(function (k) { var w = state.weeks[k]; return { id: k, name: w.name, tpl: !!w.tpl, start: weekStart(k), n: count(w) }; })
        .sort(function (a, b) { return (a.tpl - b.tpl) || ((b.start || 0) - (a.start || 0)); });
    },

    /* Put another week's meals on this one, day for day, filling only the
       days that are empty here and, when `days` is given, only those (the
       days still to come). A leftovers night comes only with its dinner. */
    cookAgain: function (fromId, days) {
      var from = state.weeks[fromId];
      if (!from) return;
      var self = this, fill = {};
      Object.keys(obj(from.plan)).forEach(function (d) {
        if (days && days.indexOf(d) < 0) return;
        if (!self.day(d).length) fill[d] = self.dayOf(fromId, d);
      });
      var order = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      batch(function () {
        Object.keys(fill).forEach(function (d) {
          var before = order[(order.indexOf(d) + 6) % 7];
          var prevDinners = (fill[before] || []).concat(self.day(before) || []);
          var list = fill[d].filter(function (e) {
            return !e.lo || prevDinners.some(function (c) { return c.id === e.id && !c.lo; });
          });
          if (list.length) writeDay(d, list);
        });
      });
    },

    /* The week on screen, kept under a name to cook again another time. */
    saveTemplate: function (name) {
      var id = newId(), n = String(name || '').trim() || 'Saved week';
      var w = { name: n, ord: nextOrd(), plan: JSON.parse(JSON.stringify(state.plan)), checked: {}, tpl: 1 };
      push(function () {
        var u = {}; u['weeks.' + id] = w; return doc.update(u);
      }, function () {
        var weeks = Object.assign({}, state.weeks); weeks[id] = w; state.weeks = weeks;
      });
      return id;
    },

    /* A new empty week, or a copy of the one showing. Copying takes the plan
       and not the ticks — the shopping has to be done again. */
    addWeek: function (name, copyCurrent) {
      var id = newId();
      var w = {
        name: String(name || '').trim() || 'New week', ord: nextOrd(),
        plan: copyCurrent ? JSON.parse(JSON.stringify(state.plan)) : {}, checked: {}
      };
      push(function () {
        var u = { active: id }; u['weeks.' + id] = w; return doc.update(u);
      }, function () {
        var weeks = Object.assign({}, state.weeks);
        weeks[id] = w; state.weeks = weeks; state.active = id;
      });
      return id;
    },

    renameWeek: function (name) {
      var n = String(name || '').trim();
      if (!n || !state.weeks[state.active]) return;
      var path = wpath('name');      // the week showing now: see writeDay
      push(function () {
        var u = {}; u[path] = n; return doc.update(u);
      }, function () {
        editActive(function (w) { w.name = n; });
      });
    },

    /* Never leave nothing to plan in — the last week empties instead. */
    deleteWeek: function () {
      var order = ids();
      if (order.length < 2) { this.clearPlan(); return; }
      var gone = state.active;
      var i = order.indexOf(gone);
      var next = order[i + 1] || order[i - 1];
      push(function () {
        var u = { active: next }; u['weeks.' + gone] = FV.delete(); return doc.update(u);
      }, function () {
        var weeks = Object.assign({}, state.weeks);
        delete weeks[gone];
        state.weeks = weeks; state.active = next;
      });
    },

    /* A day holds recipe ids. One cooked at anything other than its own serving
       count is stored as {i, x} instead, so a plain id still means "as written"
       and a week saved by an older version still reads. */
    day: function (day) {
      return lastOf((state.plan[day] || []).map(function (e) {
        return typeof e === 'object' && e ? { id: e.i, x: e.x || 1, lo: e.lo === 1 } : { id: e, x: 1, lo: false };
      }).filter(function (e) { return e.id !== undefined && e.id !== null && e.id !== ''; }), function (e) { return e.id; });
    },

    scaleOf: function (id, day) {
      var hit = this.day(day).filter(function (e) { return e.id === id; })[0];
      return hit ? hit.x : 1;
    },

    addToDay: function (id, day, x, lo) { this.addToWeekDay(state.active, day, id, x, lo); },
    /* The same, on a day of any week. Saturday is the end of a week but not
       of the cooking: cooked double, its leftovers night is next week's
       Sunday, which is not the week on screen. The same arrayUnion to
       weeks.<id>.plan.<day> as any other day, and the week is made by it if
       nothing was planned in it yet, as it is when you plan next week. */
    addToWeekDay: function (weekId, day, id, x, lo) {
      var had = lastOf(this.dayOf(weekId, day), function (e) { return e.id; });
      var list = had.filter(function (e) { return e.id !== id; });
      var entry = { id: id, x: x || 1, lo: !!lo };
      var was = had.filter(function (e) { return e.id === id; })[0] || null;
      if (was && was.x === entry.x && was.lo === entry.lo) return;   // already so
      list.push(entry);
      // new to the day: only it goes up; already there: off and back on (see writeDay)
      writeDay(day, list, entry, was ? [stored(was)] : null, weekId);
    },

    batch: batch,

    /* The shared maps, one setter each way. */
    kitchen: function (key) { return state.kitchen[key]; },
    kitchenAll: function () { return state.kitchen; },
    setKitchen: function (key, v) { setMapKey('kitchen', key, v === 1 || v === 0 ? v : null); },
    src: function (key) { return state.src[key]; },
    setSrc: function (key, v) { setMapKey('src', key, v === 's' || v === 'b' ? v : null); },
    rating: function (id) { return state.rate[id] || 0; },
    ratings: function () { return state.rate; },
    setRating: function (id, v) { setMapKey('rate', String(id), v === 2 || v === 1 || v === -1 ? v : null); },
    opt: function (k, dflt) { var v = state.opts[k]; return v === 1 || v === 0 ? v === 1 : !!dflt; },
    setOpt: function (k, on) { setMapKey('opts', k, on ? 1 : 0); },
    low: function (key) { return state.low[key] === 1; },
    lowAll: function () { return state.low; },
    setLow: function (key, on) { setMapKey('low', key, on ? 1 : null); },

    /* Everybody in the household sharing a dinner's numbers, by account:
       {uid: {n, kc, p}}. A copy, so nothing outside can change the state. */
    diners: function () { return Object.assign({}, state.diners); },
    /* This account's own, and only that: {n, kc, p} to share it, null to take
       it back. false, and nothing written, without an account signed in or a
       household to write to — an anonymous visitor is nobody the other
       phones could put a name to, and the rules let a person write only the
       key that is their own uid.
     *
       A refusal from the server is said here (dinerRefused) rather than
       stopping the household's sync for the session the way another refused
       write does: until firestore.rules is published again, the server has
       never heard of diners, and that should cost this switch and nothing
       else. */
    setMyDiner: function (e) {
      var me = api.user();
      if (!me || !house || !DINER_ID.test(me.uid)) return false;
      var v = null;
      if (e) {
        v = { n: String(e.n === undefined || e.n === null ? '' : e.n).trim(), kc: Number(e.kc), p: Number(e.p) };
        if (!MAP_OK.diners(v)) return false;
      }
      var key = me.uid, at = house, was = hasOwn(state.diners, key) ? state.diners[key] : null;
      dinerRefused = false;
      push(function () {
        var u = {}; u['diners.' + key] = v === null ? FV.delete() : v;
        return doc.update(u).catch(function (err) {
          if (!(err && err.code === 'permission-denied')) throw err;
          dinerRefused = true;
          /* And the change is taken back here too, unless something newer
             has been said since. Left in, Store.diners() went on holding
             numbers the household never took, so the app thought them
             shared and never sent them again (dinerKeep's `had`). */
          var now = hasOwn(state.diners, key) ? state.diners[key] : null;
          if (house === at && JSON.stringify(now) === JSON.stringify(v)) {
            state.diners = Object.assign({}, state.diners);
            if (was === null) delete state.diners[key]; else state.diners[key] = was;
            saveLocal();
          }
          emit();
        });
      }, function () {
        state.diners = Object.assign({}, state.diners);
        if (v === null) delete state.diners[key]; else state.diners[key] = v;
      });
      return true;
    },
    get dinerRefused() { return dinerRefused; },
    /* How many times the household's document has come from the server
       different from the time before. A refused write is put back by the
       server without changing it, so this is what tells a household that
       has moved on (and might take the dinner numbers now) from the echo of
       the refusal itself: see dinerWatch in app.js. */
    get heard() { return heard; },

    /* The weeks a join put aside (see `parked`), once: handed over and
       forgotten, so the app says it the one time. null when there are none. */
    parkedNote: function () { var p = parked; parked = null; return p; },

    removeFromDay: function (id, day) { this.removeFromWeekDay(state.active, day, id); },
    // and off a day of any week: Saturday's leftovers night follows its dinner
    removeFromWeekDay: function (weekId, day, id) {
      /* The entries exactly as stored, because arrayRemove takes away only
         what is equal to what it is handed. One the other phone has changed
         meanwhile (its serving count) is no longer equal, and stays — the
         newer statement about that dinner wins. */
      var w = state.weeks[weekId], plan = obj(w && w.plan);
      var gone = (Array.isArray(plan[day]) ? plan[day] : []).filter(function (e) {
        return (typeof e === 'object' && e ? e.i : e) === id;
      });
      var list = lastOf(this.dayOf(weekId, day), function (e) { return e.id; });
      writeDay(day, list.filter(function (e) { return e.id !== id; }), null, gone, weekId);
    },

    clearPlan: function () {
      // the shopping list goes with the week — leaving the check-offs behind
      // meant next week's list arrived with things already ticked off
      var plan = wpath('plan'), checked = wpath('checked'), cooked = wpath('cooked');
      push(function () {
        var u = {}; u[plan] = {}; u[checked] = {}; u[cooked] = FV.delete(); return doc.update(u);
      }, function () {
        editActive(function (w) { w.plan = {}; w.checked = {}; delete w.cooked; });
      });
    },

    /* Forget check-offs for anything no longer on the list. Ticks are keyed by
       ingredient, so without this, buying milk one week left milk ticked the
       next time a recipe called for it — and an unticked box is the only thing
       telling you it still needs buying. */
    pruneChecked: function (liveKeys) {
      var live = {};
      liveKeys.forEach(function (k) { live[encodeKey(k)] = true; });
      // never a key that is not a field path: deleting it would not delete it, and this would run again
      var stale = Object.keys(state.checked).filter(function (k) { return !live[k] && KEY_OK.test(k); });
      if (!stale.length) return false;
      var paths = stale.map(function (k) { return wpath('checked.' + k); });
      push(function () {
        var u = {};
        paths.forEach(function (p) { u[p] = FV.delete(); });
        return doc.update(u);
      }, function () {
        editActive(function (w) {
          w.checked = Object.assign({}, w.checked);
          stale.forEach(function (k) { delete w.checked[k]; });
        });
      });
      return true;
    },

    isChecked: function (key) { return !!state.checked[encodeKey(key)]; },

    /* Tonight's dinner, cooked: one day of the week on screen, for the
       household. Written by its own field, as a tick on the list is, so two
       phones marking two nights never undo each other. */
    cooked: function (day) {
      var w = state.weeks[state.active];
      return !!(w && w.cooked && w.cooked[day]);
    },
    setCooked: function (day, on) {
      if (DAY_KEYS.indexOf(day) < 0) return;
      if (!!this.cooked(day) === !!on) return;
      var path = wpath('cooked.' + day);
      push(function () {
        var u = {}; u[path] = on ? true : FV.delete(); return doc.update(u);
      }, function () {
        editActive(function (w) {
          w.cooked = Object.assign({}, w.cooked);
          if (on) w.cooked[day] = true; else delete w.cooked[day];
          if (!Object.keys(w.cooked).length) delete w.cooked;
        });
      });
    },

    toggleChecked: function (key) {
      var k = encodeKey(key);
      if (!k) return;                   // a label of symbols only encodes to nothing, and no path
      var on = !state.checked[k];
      var path = wpath('checked.' + k);
      push(function () {
        var u = {}; u[path] = on ? true : FV.delete(); return doc.update(u);
      }, function () {
        editActive(function (w) {
          w.checked = Object.assign({}, w.checked);
          if (on) w.checked[k] = true; else delete w.checked[k];
        });
      });
    },

    // ------------------------------------------------- recipes of your own
    /* Written here rather than printed. Ids are strings so they can never
       collide with the numbered ones, and so a glance at an id tells you
       which kind you are holding. */
    /* ------------------------------------------------------------ the shelf
       What this household actually keeps. The books were written against the
       storehouse order, and every recipe records whether the storehouse
       carried each ingredient — but that is a fact about a shop, not about a
       kitchen. Once someone stops ordering from it, the useful question is
       whether *they* have the thing in, which is the same question a recipe
       has always been answering with "Also needs".

       Overrides only. A food nobody has touched follows the book, so a change
       to the storehouse list still arrives instead of being pinned to whatever
       it was the day someone first opened this tab. */
    pantryHas: function (key, dflt) {
      var o = state.pantry[key];
      if (o === 1 || o === 0) return o === 1;
      if (state.pantryNew[key]) return true;
      return !!dflt;
    },

    setPantry: function (key, on) {
      var u = {}; u['pantry.' + encodeKey(key)] = on ? 1 : 0;
      push(plain(u), function () {
        state.pantry = Object.assign({}, state.pantry); state.pantry[key] = on ? 1 : 0;
      });
    },

    /* Back to the book: clear the overrides rather than write today's answer
       into all 114 of them. */
    resetPantry: function () {
      push(function () { return doc.set({ pantry: {} }, { merge: true }); },
        function () { state.pantry = {}; });
    },

    addPantryItem: function (label, cat) {
      var key = 'own_' + encodeKey(String(label).toLowerCase());
      var item = { l: String(label).trim(), c: cat || 'Yours' };
      push(function () {
        var u = {}; u['pantryNew.' + key] = item; return doc.update(u);
      }, function () {
        state.pantryNew = Object.assign({}, state.pantryNew); state.pantryNew[key] = item;
      });
      return key;
    },

    renamePantryItem: function (key, label) {
      if (!state.pantryNew[key]) return;
      var item = Object.assign({}, state.pantryNew[key], { l: String(label).trim() });
      push(function () {
        var u = {}; u['pantryNew.' + key] = item; return doc.update(u);
      }, function () {
        state.pantryNew = Object.assign({}, state.pantryNew); state.pantryNew[key] = item;
      });
    },

    removePantryItem: function (key) {
      if (!state.pantryNew[key]) return;
      push(function () {
        var u = {}; u['pantryNew.' + key] = FV.delete(); return doc.update(u);
      }, function () {
        state.pantryNew = Object.assign({}, state.pantryNew); delete state.pantryNew[key];
      });
    },

    /* What keepRemoved set aside from this household, newest first: {k, id,
       name, at}. And the two answers to it. Putting back never overwrites —
       a recipe or week the household has again by the same id is left as
       it is — and goes up as ordinary additions, which the rules allow. */
    removed: function () {
      return keptAll().filter(function (x) { return x.house === house; })
        .map(function (x) { return { k: x.k, id: x.id, name: x.name || '', at: x.at }; });
    },
    restoreRemoved: function () {
      var all = keptAll(), back = all.filter(function (x) { return x.house === house; });
      write(LS.kept, all.filter(function (x) { return x.house !== house; }));
      batch(function () {
        back.forEach(function (x) {
          if (x.k === 'mine' && !state.mine[x.id]) api.saveRecipe(Object.assign({}, x.v, { id: x.id }));
          // an edit is keyed by the printed recipe's number, which saveRecipe tells from a string id
          else if (x.k === 'edits' && !state.edits[x.id]) api.saveRecipe(Object.assign({}, x.v, { id: Number(x.id) }));
          else if (x.k === 'weeks' && !state.weeks[x.id]) {
            var w = { name: String(x.v.name || 'Week'), ord: nextOrd(), plan: cleanPlan(x.v.plan), checked: {} };
            push(function () {
              var u = {}; u['weeks.' + x.id] = w; return doc.update(u);
            }, function () {
              var weeks = Object.assign({}, state.weeks); weeks[x.id] = w; state.weeks = weeks;
            });
          }
        });
      });
      emit();
    },
    forgetRemoved: function () {
      write(LS.kept, keptAll().filter(function (x) { return x.house !== house; }));
      emit();
    },

    pantryOwn: function () { return state.pantryNew; },
    pantryChanged: function () {
      return Object.keys(state.pantry).length + Object.keys(state.pantryNew).length;
    },

    newRecipeId: function () {
      return 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    },

    saveRecipe: function (rec) {
      var id = rec.id;
      var own = typeof id === 'string';
      var field = (own ? 'mine.' : 'edits.') + id;
      push(function () {
        var u = {}; u[field] = rec; return doc.update(u);
      }, function () {
        var m = Object.assign({}, own ? state.mine : state.edits);
        m[id] = rec;
        if (own) state.mine = m; else state.edits = m;
      });
    },

    /* Deletes one of yours. On a printed recipe it drops the changes instead,
       which puts the book's own version back. */
    /* Delete it everywhere it is referred to, not only where it is stored.
     *
     * This used to remove the record and stop. A recipe of your own that was
     * on Monday stayed on Monday: the plan kept its id, the day rendered empty
     * because nothing could be found to draw, and the dead id went on syncing
     * to every phone in the household. Copy that week and you copied the
     * ghost with it.
     *
     * Favorites had the same hole. Neither shows up as an error — an id that
     * matches nothing is skipped by every reader — which is exactly why it
     * would have sat there.
     *
     * Only own recipes can strand a reference this way: an edit to a printed
     * recipe is a layer over something that still exists, so reverting it
     * leaves the original in the week, which is right. */
    deleteRecipe: function (id) {
      var own = typeof id === 'string';
      var field = (own ? 'mine.' : 'edits.') + id;
      var idOfEntry = function (e) { return typeof e === 'object' && e ? e.i : e; };
      /* Every day it is on, found now, while the state still has it: one
         arrayRemove per day, of exactly the entries that name it. This sent
         the whole of every week instead — the only way, it said, to reach
         one value in many nested arrays — and a merge of the whole weeks
         object put this phone's copy of every day of every week over the
         household's, including days the other phone had just changed. It
         also could not empty a day, since a merge cannot say "this list is
         shorter now". Field paths to each day can do both. */
      var refs = [];
      if (own) {
        Object.keys(state.weeks).forEach(function (wk) {
          var plan = state.weeks[wk].plan || {};
          Object.keys(plan).forEach(function (d) {
            var hit = (plan[d] || []).filter(function (e) { return idOfEntry(e) === id; });
            if (hit.length) refs.push({ path: 'weeks.' + wk + '.plan.' + d, hit: hit });
          });
        });
      }

      push(function () {
        var u = {}; u[field] = FV.delete();
        return doc.update(u).then(function () {
          if (!own) return null;
          var v = { favs: FV.arrayRemove(id) };
          refs.forEach(function (r) { v[r.path] = FV.arrayRemove.apply(FV, r.hit); });
          return doc.update(v);
        });
      }, function () {
        var m = Object.assign({}, own ? state.mine : state.edits);
        delete m[id];
        if (own) state.mine = m; else state.edits = m;
        if (!own) return;

        state.favs = state.favs.filter(function (x) { return x !== id; });
        Object.keys(state.weeks).forEach(function (k) {
          var plan = state.weeks[k].plan || {};
          Object.keys(plan).forEach(function (d) {
            var kept = (plan[d] || []).filter(function (e) { return idOfEntry(e) !== id; });
            if (kept.length) plan[d] = kept; else delete plan[d];
          });
        });
      });
    },

    /* A household code both of you type in once. Random rather than chosen:
       there is no password on the document, so the code is what keeps it yours.
       This only draws one — createHousehold is what makes sure it is free. */
    newCode: newCodeStr,

    /* Claim a code nobody is using.
     *
     * newCode() draws from sixteen words, four digits and sixteen words: 2.3
     * million codes, which sounds ample and is not, because nothing ever
     * releases one. The birthday sum puts some pair of households colliding at
     * roughly one in five hundred by a hundred households, one in twenty by
     * five hundred, and even money by eighteen hundred — and a collision is
     * two families silently sharing a grocery list.
     *
     * In a transaction, because a plain get-then-set has a gap in it and the
     * gap is exactly where the collision lives. With no signal a transaction
     * cannot run at all, so the code is taken anyway rather than blocking
     * setup; connect() seeds it when there is signal, and a household created
     * on a phone with no bars is not one somebody else is racing for.
     *
     * `preferred` is the code already on screen. It is tried first so that the
     * code somebody is reading is the code they get, every time but the rare
     * one. */
    createHousehold: function (preferred) {
      var self = this, tries = 0;

      function attempt(code) {
        var ref = db.collection('households').doc(code);
        return db.runTransaction(function (t) {
          return t.get(ref).then(function (snap) {
            if (snap.exists) throw new Error('taken');
            var me = api.user(), body = localDoc();
            if (me) body.members = [me.uid];
            t.set(ref, body);
          });
        }).then(function () { return { code: code, seeded: true }; }, function (err) {
          if (err && err.message === 'taken' && ++tries < 6) return attempt(newCodeStr());
          // no signal, or six unlucky draws: take it, but do not claim it is ours
          return { code: code, seeded: false };
        });
      }

      return ready()
        .then(function () { return attempt(preferred || newCodeStr()); })
        .catch(function () { return { code: preferred || newCodeStr(), seeded: false }; })
        .then(function (res) {
          /* seeded only where the transaction actually ran and wrote this
             phone's state as the whole document. Where it did not — no signal,
             or the SDK never loaded — the code is unverified, and saying
             otherwise told join() there was nothing to contribute. If that
             code turned out to belong to somebody else, the next connect would
             have adopted a stranger's week straight over the top of this one.
             Unverified means treat it like any typed code: bring our things. */
          self.join(res.code, res.seeded, true);
          return res.code;
        });
    },

    /* `seeded` is set by createHousehold, which has already put this phone's
       state in the document. Every other join is somebody typing a code that
       may well have a household behind it, and those bring their favorites,
       weeks and written recipes with them. */
    join: function (code, seeded, mine) {
      var next = String(code || '').trim().toUpperCase().replace(/\s+/g, '-');
      /* Moving from one household to another is leaving the first — by the
         box under the code, an invite, or the account's own pantry — and
         each of those left this account on the old household's list and its
         numbers in its diners, where nobody else may take them off. */
      if (house && next !== house) goodbye();
      // what was held for one household is not sent into another
      /* And not to the household being left: `doc` is the old one until
         connect() has the new one, and a write made in between went there. */
      if (next !== house) { queued = []; enrolDenied = ''; tidyDenied = ''; doc = null; }
      house = next;
      write(LS.house, house);
      houseMine = !!mine;
      write(LS.houseNew, houseMine ? '1' : '');
      setMerge(!seeded);
      if (unsub) { unsub(); unsub = null; }
      connect();
    },

    leave: function () {
      goodbye();
      if (unsub) { unsub(); unsub = null; }
      queued = [];                  // meant for the household being left, not the next one
      house = ''; write(LS.house, '');
      houseMine = false; write(LS.houseNew, '');
      doc = null;
      members = []; enrolling = ''; enrolDenied = ''; tidyDenied = '';
      /* The household's people go with it: their dinner numbers were shared
         with the household, not with this phone. */
      state.diners = {}; write(LS.diners, {}); dinerRefused = false;
      everLive = false; lastSync = 0; setMerge(false);
      setStatus('local');
    },

    get members() { return members.slice(); },

    /* For a caller that has just learned who we are: a sign-in does not make
       the household document speak, so nothing else would record it. */
    enrol: function () { enrol(); },

    /* A link that lets one person into this household, once, for a week.
       Only an account on the household's list can make one — the rules hold
       that — so it is refused here first rather than failing at the server. */
    invite: function () {
      var me = api.user();
      if (!me) return Promise.reject(new Error('signed-out'));
      if (!house) return Promise.reject(new Error('no-house'));
      var token = newToken(), now = Date.now();
      return ready().then(function () {
        /* Enrolled first and waited for: the invite rule reads the list, and
           an invite made in the same second as the enrol would lose the race. */
        return members.indexOf(me.uid) >= 0 ? null
          : db.collection('households').doc(house).update({ members: FV.arrayUnion(me.uid) });
      }).then(function () {
        return db.collection('invites').doc(token).set({
          house: house, by: me.uid, made: now,
          exp: now + INVITE_DAYS * 86400000, used: false
        });
      }).then(function () {
        return location.origin + location.pathname + '?invite=' + token;
      });
    },

    /* Spend an invite and join what it points at. In one transaction, so two
       people tapping the same forwarded link cannot both get in: the second
       reads it already used. Rejects with 'spent' for a used or expired one
       and 'gone' for one that never existed, which the sheet says in words. */
    redeem: function (token) {
      var me = api.user();
      if (!me) return Promise.reject(new Error('signed-out'));
      var code = '';
      return ready().then(function () {
        var inv = db.collection('invites').doc(String(token));
        return db.runTransaction(function (t) {
          return t.get(inv).then(function (snap) {
            if (!snap.exists) throw new Error('gone');
            var d = snap.data() || {};
            if (d.used || !(d.exp > Date.now()) || typeof d.house !== 'string') throw new Error('spent');
            code = d.house;
            var hh = db.collection('households').doc(code);
            return t.get(hh).then(function (h) {
              if (!h.exists) throw new Error('gone');
              t.update(inv, { used: true, usedBy: me.uid });
              t.update(hh, { members: FV.arrayUnion(me.uid), lastInvite: String(token) });
            });
          });
        });
      }).then(function () {
        api.join(code);
        return code;
      }, function (err) {
        /* A spent or expired invite can no longer be read at all (see
           firestore.rules: an old link must not keep handing out the
           household's code), so the server's answer to one is a refusal
           rather than a document saying it is used. Said in the same words. */
        if (err && err.code === 'permission-denied') throw new Error('spent');
        throw err;
      });
    }
  };
  return api;
})();
