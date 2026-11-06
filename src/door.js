/* The front door: four short questions on a phone that has never opened the
 * app, then Today.
 *
 * Blake's goal is one app that suits a heavy tracker, a busy mom and anyone
 * in between. Somebody new should not land on 350 recipes with no idea which
 * of four tabs is for them, so a new phone is asked, once: what would you
 * like help with, your kitchen (how many eat, where your staples come from),
 * your workouts and your goal — the last two only if they were picked.
 *
 * Nobody who has used the app ever sees it. Whether a phone is new is read
 * here, before sync.js has written anything: no tab remembered and nothing
 * of the app's in storage. A phone with anything on it is marked as having
 * been here, so clearing a plan later does not bring the door back. "Just
 * look around" skips it for good.
 *
 * It keeps nothing of its own. Each answer is handed to the part of the app
 * that already owns it, through window.Hive: the household's staples
 * switches and Plan my week's "how many are eating", Strengthen's first-run
 * setup (sh.doorWork, which it reads), Nourish's goal. What Today shows is
 * sh.help, changed later under Share & settings. ES5, like the rest. */
(function () {
  'use strict';

  var KEY = 'sh.door';
  var due = false, joining = false;
  try {
    var used = !!localStorage.getItem('sh.view');
    for (var i = 0; i < localStorage.length && !used; i++) {
      var k = localStorage.key(i);
      if (/^bsc\./.test(k) && k !== 'bsc.invite' && k !== 'bsc.emailForLink') used = true;
    }
    var mark = localStorage.getItem(KEY);
    if (!mark && used) localStorage.setItem(KEY, 'had');
    /* 'open' is a door that was up when the page went: the first boot writes
       a dozen bsc.* keys of its own before anything is answered, so the next
       load would otherwise count the phone as used and never ask. */
    due = mark === 'open' || (!mark && !used);
    joining = /[?&]invite=/.test(location.search) || !!localStorage.getItem('bsc.invite');
  } catch (e) { due = false; }

  /* What Today shows: dinners and the shopping, eating, workouts. A phone
     that never answered shows everything, as Today always has. */
  function help() {
    try {
      var h = JSON.parse(localStorage.getItem('sh.help') || 'null');
      if (h && typeof h === 'object') return { d: !!h.d, e: !!h.e, w: !!h.w };
    } catch (e) { /* private mode or corrupt */ }
    return { d: true, e: true, w: true };
  }
  function setHelp(h) {
    try { localStorage.setItem('sh.help', JSON.stringify({ d: h.d ? 1 : 0, e: h.e ? 1 : 0, w: h.w ? 1 : 0 })); } catch (e) { /* private */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  var ICON = {
    d: '<path d="M7 3v8a2 2 0 0 0 4 0V3"></path><path d="M9 11v10"></path><path d="M17 3c-1.7 1.3-2.5 3.3-2.5 6 0 1.4.6 2.3 2.5 2.6V21"></path>',
    e: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"></path><path d="M5 19l7-7"></path>',
    w: '<path d="M6.5 7v10"></path><path d="M3.5 9.5v5"></path><path d="M17.5 7v10"></path><path d="M20.5 9.5v5"></path><path d="M6.5 12h11"></path>'
  };
  function ico(k) { return '<svg class="dr-ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; }

  var HELP = [
    ['d', 'Dinners and the shopping', 'This week’s dinners, one shopping list and a Walmart cart.'],
    ['e', 'Eating well', 'Know what you eat and reach a goal.'],
    ['w', 'A workout that fits', 'At home or a gym, planned around your week.']
  ];
  var HELP_JOIN = { e: 'Your own goal and your own day. Nobody else sees it.', w: 'Your own plan, at home or a gym.' };
  /* Plan my week's own choices, so the two can never disagree. */
  var PPL = [[2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8+']];
  /* Strengthen's own: its kits, its days, its minutes. */
  var KIT = [
    ['bw', 'Bodyweight only'],
    ['db', 'Dumbbells at home'],
    ['bar', 'Barbell & dumbbells'],
    ['cage', 'Home gym (cage & cables)'],
    ['gym', 'Full gym']
  ];
  var DPW = [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']];
  var MIN = [[30, '30'], [40, '40'], [45, '45'], [60, '60'], [0, 'No limit']];
  /* Nourish's four, in its own words. */
  var GOAL = [
    ['cut1', 'Lose weight steadily', 'About a pound a week'],
    ['cut2', 'Lose weight quickly', 'Faster, and harder to keep up'],
    ['keep', 'Stay about where I am', 'Eat what you burn'],
    ['gain', 'Put weight on slowly', 'With training, mostly muscle']
  ];

  var A = null, at = 0;
  function steps() {
    var s = ['help'];
    if (!joining && A.help.d) s.push('kitchen');
    if (A.help.w) s.push('work');
    if (A.help.e) s.push('eat');
    return s;
  }

  function chips(q, list, cur, label) {
    return '<div class="dr-chips" role="group"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + list.map(function (o) {
      return '<button type="button" class="pw-chip" data-dr="' + q + '" data-v="' + o[0] + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  /* One Tab stop, the chosen one, and the arrows between them (below), as
     a native radio group has it. */
  function radios(q, list, cur, label) {
    var any = list.some(function (o) { return cur === o[0]; });
    return '<div class="dr-radios" role="radiogroup" aria-label="' + esc(label) + '">' + list.map(function (o, i) {
      var stop = any ? cur === o[0] : !i;
      return '<button type="button" class="wh-opt dr-radio" role="radio" data-dr="' + q + '" data-v="' + o[0] + '" aria-checked="' + (cur === o[0]) + '" aria-pressed="' + (cur === o[0]) + '" tabindex="' + (stop ? 0 : -1) + '">' +
        '<span class="wh-dot"></span><span><b>' + esc(o[1]) + '</b><span>' + esc(o[2]) + '</span></span></button>';
    }).join('') + '</div>';
  }
  function q(label, body, sub) {
    return '<div class="dr-q"><div class="dr-ql">' + esc(label) + '</div>' + (sub ? '<div class="dr-note">' + esc(sub) + '</div>' : '') + body + '</div>';
  }
  function head(kicker, title, lede) {
    var s = steps();
    return '<div class="dr-head"><div class="dr-k"><span>' + esc(kicker) + ' · ' + (at + 1) + ' of ' + s.length + '</span>' +
      '<span class="dr-bar" aria-hidden="true"><i style="width:' + Math.round((at + 1) * 100 / s.length) + '%"></i></span></div>' +
      '<h1 class="dr-h" tabindex="-1">' + esc(title) + '</h1>' + (lede ? '<p class="dr-lede">' + esc(lede) + '</p>' : '') + '</div>';
  }

  function screen() {
    var s = steps()[at], last = at === steps().length - 1;
    var next = function (label, dis) {
      return '<button type="button" class="btn-primary dr-next" data-dr="next"' + (dis ? ' disabled' : '') + '>' + esc(label) + '</button>';
    };
    var back = at ? '<button type="button" class="nut-ask dr-back" data-dr="back">‹ Back</button>' : '';
    if (s === 'help') {
      var opts = joining ? HELP.filter(function (o) { return o[0] !== 'd'; }) : HELP;
      var none = !opts.some(function (o) { return A.help[o[0]]; });
      return head('Welcome', joining ? 'You’re joining a kitchen' : 'What would you like help with?',
          joining ? 'The week’s dinners and the shopping list are shared. The rest is yours.' : 'Pick one, two or all three. The rest is a tap away later.') +
        (joining ? '<div class="dr-ql dr-ql-gap">What would you like help with?</div>' : '') +
        '<div class="dr-opts">' + opts.map(function (o) {
          var on = !!A.help[o[0]];
          return '<button type="button" class="dr-opt" data-dr="help" data-v="' + o[0] + '" aria-pressed="' + on + '">' +
            '<span class="dr-badge">' + ico(o[0]) + '</span><span class="dr-ot"><b>' + esc(o[1]) + '</b><span>' + esc(joining ? HELP_JOIN[o[0]] : o[2]) + '</span></span>' +
            '<span class="dr-tick" aria-hidden="true"></span></button>';
        }).join('') + '</div>' +
        '<div class="dr-foot">' + (last ? next('Show me today', none && !joining) : next('Next', none)) +
          '<button type="button" class="nut-ask" data-dr="skip">Just look around</button>' +
          '<p class="dr-note">Takes about a minute.</p></div>';
    }
    if (s === 'kitchen') {
      return head('Your kitchen', 'Your kitchen') +
        q('How many are eating?', chips('ppl', PPL, A.ppl, 'How many are eating?'),
          'Recipes and shopping lists start with common pantry staples stocked, and anything missing goes on your list.') +
        '<div class="dr-foot">' + next(last ? 'Show me today' : 'Next') + back +
          '<p class="dr-note">Shared with everyone in your kitchen. Change it any time under Share › Your kitchen.</p></div>';
    }
    if (s === 'work') {
      return head('Your workouts', 'Your workouts') +
        q('What do you have to train with?', chips('kit', KIT, A.kit, 'What do you have to train with?')) +
        q('Days a week', chips('dpw', DPW, A.dpw, 'Days a week')) +
        q('Minutes a session', chips('min', MIN, A.min, 'Minutes a session'), 'Warm-up included.') +
        '<div class="dr-foot">' + next(last ? 'Show me today' : 'Next') + back +
          '<p class="dr-note">Strengthen starts its setup with these filled in, and asks the rest: your goal, how long you have lifted, your back and joints.</p></div>';
    }
    return head('Eating', 'What’s your goal?') +
      radios('goal', GOAL, A.goal, 'Your goal') +
      '<p class="dr-note">Next, Nourish asks your height, weight and how active you are, so the numbers fit you.</p>' +
      '<div class="dr-foot">' + next('Set my numbers') +
        '<button type="button" class="nut-ask" data-dr="later">Later. Show me today</button>' + back + '</div>';
  }

  function root() { return document.getElementById('doorRoot'); }
  function draw(focus) {
    var r = root();
    if (!r) return;
    r.innerHTML = '<div class="dr-top"><span class="dr-brand">Nourish &amp; Strengthen</span></div><div class="dr-body">' + screen() + '</div>';
    if (focus) { var h = r.querySelector('.dr-h'); if (h) h.focus(); r.scrollTop = 0; }
  }

  function open() {
    A = { help: joining ? { d: true, e: true, w: false } : { d: true, e: true, w: true },
      ppl: 4, kit: null, dpw: null, min: null, goal: 'cut1' };
    at = 0;
    var r = document.createElement('div');
    r.id = 'doorRoot';
    r.className = 'door no-print';
    r.setAttribute('role', 'dialog');
    r.setAttribute('aria-modal', 'true');
    r.setAttribute('aria-label', 'Welcome');
    document.body.appendChild(r);
    document.documentElement.classList.add('door-up');
    /* A modal in fact, not only in name: Tab walked out of it into the app
       behind, and a screen reader read the whole app under "Welcome". */
    behind(true);
    try { localStorage.setItem(KEY, 'open'); } catch (e) { /* private mode: asked again next time */ }
    draw(true);
  }
  function behind(off) {
    var els = document.querySelectorAll('#main, .topbar, #shareHint');
    for (var i = 0; i < els.length; i++) els[i].inert = off;
  }
  /* Closed on this page: Today's "Cooking with someone else?" waits for
     the next open, or a new phone met two questions in a row. */
  var shut = false;
  function close(mark) {
    shut = true;
    try { localStorage.setItem(KEY, mark); } catch (e) { /* private mode: asked again next time */ }
    var r = root();
    if (r) r.parentNode.removeChild(r);
    document.documentElement.classList.remove('door-up');
    behind(false);
  }

  /* Every answer, handed to what owns it. */
  function finish(numbers) {
    var H = window.Hive || {};
    setHelp(A.help);
    if (steps().indexOf('kitchen') >= 0 && H.kitchen) H.kitchen(A.ppl);
    if (A.help.w) {
      var w = {};
      if (A.kit) w.kit = A.kit;
      if (A.dpw) w.dpw = A.dpw;
      if (A.min !== null) w.min = A.min;
      try { localStorage.setItem('sh.doorWork', JSON.stringify(w)); } catch (e) { /* private */ }
    }
    close('done');
    if (A.help.e && H.goal) H.goal(A.goal, A.help.w ? A.dpw : null);
    if (H.go) H.go('today');
    if (numbers && H.numbersSetup) H.numbersSetup();
  }

  /* Tab stays inside the door while it is up. With the app behind inert
     there is nowhere else on the page to go, but off the last control the
     keyboard still left the page for the browser's own bar and came back
     at the top; wrapped here instead, as the app's own dialogs do. */
  document.addEventListener('keydown', function (e) {
    var r = root();
    if (e.key !== 'Tab' || !r) return;
    var f = Array.prototype.filter.call(r.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var a = document.activeElement, first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (a === first || !r.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !r.contains(a))) { e.preventDefault(); first.focus(); }
  });

  /* The arrows move a radio group: Left and Up the one before, Right and
     Down the one after, round from either end, choosing as they go with the
     focus on the choice. The group said radiogroup and the arrows did
     nothing. Chosen by the same click a tap makes, whose redraw puts the
     focus back on it. */
  document.addEventListener('keydown', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#doorRoot [role="radio"]');
    var step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!b || !step || e.altKey || e.ctrlKey || e.metaKey) return;
    var all = Array.prototype.slice.call(b.parentNode.querySelectorAll('[role="radio"]'));
    e.preventDefault();
    all[(all.indexOf(b) + step + all.length) % all.length].click();
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#doorRoot [data-dr]');
    if (!b || !A) return;
    var k = b.getAttribute('data-dr'), v = b.getAttribute('data-v');
    if (k === 'skip') { close('skip'); if (window.Hive && window.Hive.go) window.Hive.go('today'); return; }
    if (k === 'next') {
      if (at >= steps().length - 1) { finish(steps()[at] === 'eat'); return; }
      at++;
      draw(true);
      return;
    }
    if (k === 'later') { finish(false); return; }
    if (k === 'back') { at = Math.max(0, at - 1); draw(true); return; }
    if (k === 'help') A.help[v] = !A.help[v];
    else if (k === 'kit' || k === 'goal') A[k] = A[k] === v && k === 'kit' ? null : v;
    else A[k] = A[k] === Number(v) && k !== 'ppl' ? null : Number(v);
    draw(false);
    var again = root() && root().querySelector('[data-dr="' + k + '"][data-v="' + v + '"]');
    if (again) again.focus();
  });

  if (due) {
    var go = function () { if (window.Hive) open(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }

  window.Door = { help: help, setHelp: setHelp, due: function () { return due && !!root(); },
    closed: function () { return shut; } };
})();
