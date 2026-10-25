/* My Day on your other devices, its footing: the state of the sync and the
 * one door every change of it goes through (mSyncState, which tells the
 * sheet as it sets it), the targets that wait for the account before they
 * are booted (mBootTargets), what the account mark says, the local stores'
 * one safe write and what is said when the phone is full (mPut, mLsFull,
 * mLsFullSay), and the stamps every part carries (MSTAMPS), so that newer
 * wins part by part. The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.daysync(app) once, as it starts. S_SYNC_STATE and
 * mBootTargetsDue stay declared in app.js, which reads them all over; the
 * part reads and sets them, and mAuthKnown and mSyncUnreachable, through
 * LIVE (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 */
(window.HiveParts = window.HiveParts || {}).daysync = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: S_SYNC_STATE, mAuthKnown, mBootTargetsDue, mSyncUnreachable
  var S = app.S;
  var mAccount = app.mAccount;
  var mFollowScale = app.mFollowScale;
  var mHealTargets = app.mHealTargets;
  var mSuspectAccount = app.mSuspectAccount;
  var mToast = app.mToast;
  var renderMacros = app.renderMacros;
  var renderModal = app.renderModal;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------------
   * My Day, on your other devices.
   *
   * The household sync in sync.js shares one plan between people. This shares
   * one day between DEVICES belonging to one person, which is a different
   * promise and deserves a different door: a private code, its own document,
   * and nothing of it in the family's.
   *
   * It rides on the same collection because the rule that guards it is the
   * right rule already — a document addressed by a secret code, fetchable
   * only by someone who has the code, never listable. A second collection
   * would need those rules written again and deployed, to say the same thing.
   *
   * Every part carries the moment it was written, and days carry one each, so
   * a phone that has been in a pocket all day cannot land and wipe an evening
   * entered on the desk. Newer wins, part by part.
   * --------------------------------------------------------------------- */

  /* Every transition through one door.
   *
     This was nine bare assignments, and each site separately remembered to
     redraw the sheet. Two forgot, and both failures were silent: a push that
     could not be saved set 'error' and told nobody, so a sheet left open went
     on saying Synced over a day that had not been written; and the load that
     never arrives set 'error' under a sheet still reading "Connecting…",
     which is the one word that promises it is still trying.

     A state nobody is told about is not a state, it is a variable. So the
     assignment and the telling are the same act now, and there is one place
     left to forget rather than nine. */
  /* The two boot-time decisions about the targets — heal an uneatable plan,
     follow the scale weekly — WRITE, and a write is stamped now. Run before
     this device had heard from the account, a laptop last opened three days
     ago would follow the scale on its own stale copy, stamp it newer than
     the grams typed on the phone yesterday, and win: the phone's numbers
     and its "leave mine alone" were overwritten by the device that knew
     least. So a device with an account decides after the account's first
     real answer, and one without decides at boot as before. */
  function mBootTargets() {
    if (!LIVE.mBootTargetsDue) return;
    LIVE.mBootTargetsDue = false;
    var moved = mHealTargets();
    if (mFollowScale()) moved = true;
    if (moved && S.view === 'macros') renderMacros();
  }

  function mSyncState(next) {
    LIVE.S_SYNC_STATE = next;
    /* Signed out, as far as the server can tell: nobody else's copy is
       coming, so this device's is the one to decide on. */
    if (next === 'off' && LIVE.mAuthKnown) mBootTargets();
    mMarkAccountUI();
    if (S.syncOpen) renderModal();
  }

  /* Whether the day is failing to reach the account it belongs to.
   *
     Only ever true for a device that HAS one. Someone who has never signed in
     has not lost anything, and finding that out must not cost them a call to
     Firebase — the flag is read from storage, and the network is never asked.

     'off' counts only once mAuthKnown: before we have asked, "nobody is
     signed in" is a guess, and a warning built on a guess is worse than none. */
  function mSyncTrouble() {
    if (!mSuspectAccount()) return false;
    if (LIVE.S_SYNC_STATE === 'error') return true;
    return LIVE.S_SYNC_STATE === 'off' && LIVE.mAuthKnown;
  }

  /* The mark on the gear, and the line under the menu item that names who.
   *
     The gear is quiet while it works. A dot that is always lit says nothing —
     it is furniture — so this one appears only when there is something to
     act on, and its absence is the good news. The menu underneath answers the
     other half in words, one press away, in both directions: who you are, or
     that you are nobody yet. It says nothing at all until the SDK has
     answered, because "Not signed in" before we have asked is a lie that
     happens to be true half the time. */
  function mMarkAccountUI() {
    var g = $('macroMore'), bad = mSyncTrouble();
    if (g) {
      // a no-op toggle still rewrites the attribute, and something is watching
      if (g.classList.contains('mday-warn') !== bad) g.classList.toggle('mday-warn', bad);
    }
    /* The top-left skep logo (#syncBtn) carries the sync colour across every
       tab: green when the household or your account has it all, amber while
       something is on its way or there is no signal, red when sync has
       stopped, and warm cream when kept on this phone only. */
    var hst = (window.Store && window.Store.status) || 'local';
    var T = mSyncTone(hst, bad, !!mAccount()), tone = T.tone || 'local', say = T.say;
    var sb = $('syncBtn'), sl = $('syncLabel');
    if (sb && sb.getAttribute('data-tone') !== tone) sb.setAttribute('data-tone', tone);
    if (bad || hst === 'local') {
      var lbl = (bad || mAccount()) ? say : 'Share';
      var tip = (bad || mAccount()) ? say + '. Tap for Share & settings.' : 'Saving on this phone only. Tap to share one list with another phone.';
      if (sl && sl.textContent !== lbl) sl.textContent = lbl;
      if (sb && sb.title !== tip) sb.title = tip;
    } else if (sl && sl.textContent === 'Sync has stopped' && hst === 'synced') {
      sl.textContent = 'Synced';
      if (sb) sb.title = 'The other phones have everything this one has. Tap for the code.';
    }
    if (g && g.getAttribute('aria-label') !== 'Nourish menu. ' + say) g.setAttribute('aria-label', 'Nourish menu. ' + say);
    var ss = $('macroSyncSay');
    if (ss && ss.textContent !== say) ss.textContent = say;
    var el = $('macroWho');
    if (el) {
      var who = mAccount();
      /* Unreachable is not signed out. A signed-in phone opened with no
         signal was told "Not signed in", and the sheet under it offered a
         big Sign in with Google — the one thing it did not need. */
      var says = who ? (who.email || who.name || 'Signed in')
        : mSyncAway() ? 'Signed in \u00b7 can\u2019t reach the server'
        : (LIVE.mAuthKnown ? 'Not signed in' : '');
      if (el.textContent !== says) el.textContent = says;
    }
  }
  /* The skep logo's colour and its words, from the household's sync state, the
     account's trouble and whether there is an account at all. */
  function mSyncTone(st, bad, acct) {
    var tone = bad || st === 'error' ? 'off'
      : (st === 'sending' || st === 'waiting' || st === 'connecting') ? 'wait'
        : (st === 'synced' || acct) ? 'on' : '';
    return { tone: tone, say: tone === 'off' ? 'Sync has stopped' : st === 'waiting' ? 'No signal'
      : tone === 'wait' ? 'Sending\u2026' : tone === 'on' ? 'All synced' : 'On this phone only' };
  }

  /* Signed in as far as this device knows, and the server out of reach. */
  function mSyncAway() { return !mAccount() && LIVE.mSyncUnreachable && mSuspectAccount(); }

  /* Every write My Day makes to this phone's storage, through one door.
   *
     Each writer used to catch its own failure and say nothing — "in-memory
     only for this session" — which is true of private mode and a lie on a
     phone whose storage is full: the weigh-in and the breakfast sat on the
     screen looking kept, nothing was written, and both were gone the next
     time the app opened, with not a word. Strengthen already says so when it
     happens; this is the same promise here. The first failure says it at
     once, wherever you are, and the day card keeps saying it while any store
     is still failing. A store that writes again is taken off the list. */
  var MLS_BAD = {};
  function mPut(key, v) {
    var ok = true;
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { ok = false; }
    var was = mLsFull();
    if (ok) delete MLS_BAD[key]; else MLS_BAD[key] = 1;
    if (!ok && !was) mToast(esc(mLsFullSay()));
    return ok;
  }
  function mLsFull() { return Object.keys(MLS_BAD).length > 0; }
  function mLsFullSay() {
    return 'This phone’s storage for the app is full, so the newest changes aren’t kept on it' +
      (mAccount() && LIVE.S_SYNC_STATE !== 'error' ? ' — they go to your account while there’s signal.'
        : '. Free some space, or sign in so they’re kept in an account.');
  }

  var MSTAMPS = (function () {
    var st;
    try { st = JSON.parse(localStorage.getItem('bsc.myStamps')) || {}; }
    catch (e) { st = {}; }
    /* The weight log used to be stamped as one value, the way the profile and
       the targets still are, and that is what made a cleared weigh-in come
       back: one stamp for the whole map can only say "mine is newer", never
       "this morning is gone", so the merge had to union the two maps and a
       deletion had nowhere to live. It is stamped per morning now, like the
       day log and the closed days.
     *
       Devices upgrading carry a number here. Read as a map it would silently
       swallow every write — `n[key] = v` on a primitive throws nothing and
       stores nothing — so it is converted once, with the old single stamp
       standing as the stamp of every morning already logged. */
    if (typeof st.w === 'number') {
      var was = st.w, map = {};
      try {
        var w = JSON.parse(localStorage.getItem('bsc.macroWeights'));
        if (w && typeof w === 'object') {
          Object.keys(w).forEach(function (k) { map[k] = was; });
        }
      } catch (e2) { /* nothing logged, or unreadable: an empty map is right */ }
      st.w = map;
      try { localStorage.setItem('bsc.myStamps', JSON.stringify(st)); }
      catch (e3) { /* private mode: the conversion holds for this session */ }
    }
    return st;
  })();

  return { mBootTargets: mBootTargets, mSyncState: mSyncState, mMarkAccountUI: mMarkAccountUI, mSyncTone: mSyncTone, mSyncAway: mSyncAway, mPut: mPut, mLsFull: mLsFull, mLsFullSay: mLsFullSay, MSTAMPS: MSTAMPS };
};
