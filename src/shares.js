/* How what is left of the day divides across the meals still to come.
 * Whether a meal is finished (mMealDone); what a meal is asked for now
 * against what it was planned for, never under a third of its plan
 * (mMealAsk), with protein the last to give ground; which meal a plate is
 * on (mSlotOf); the line under the meal that moved the rest, saying what
 * happened and where the slack went (mLastFinished, mCascadeLineHTML,
 * MCASCADE_MIN). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.shares(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipes by id (BY_ID) are replaced as the
 * recipes change, so the part reads them through LIVE (tests/scope.test.js
 * holds the lists to each other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).shares = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var kcalOf = app.kcalOf;
  var mDay = app.mDay;
  var mInfoText = app.mInfoText;
  var mSendOf = app.mSendOf;
  var mSkipped = app.mSkipped;
  var mSlotW = app.mSlotW;
  var mTotals = app.mTotals;
  var mViewKey = app.mViewKey;
  var mWhyBtn = app.mWhyBtn;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* The order a shrinking day gives way in, and what a gram of each costs.
     Protein last to go because a deficit is when muscle is easiest to lose;
     carbohydrate first because it was the remainder when the plan was built. */
  var MDRAW = [['p', 4], ['f', 9], ['c', 4]];

  /* Is this meal finished? Plates on it, and every one of them eaten.
   *
     A meal with nothing on it is not finished, it is empty — and an empty
     meal is the one most in need of a share. */
  function mMealDone(sk) {
    var items = (mDay(mViewKey())[sk] || []).filter(function (it) { return LIVE.BY_ID[it.id]; });
    if (!items.length) return false;
    return items.every(function (it) { return it.eaten; });
  }

  /* What a meal is being asked for NOW, and what it was planned for.
   *
     The two are the same until something is eaten. After that they part, and
     the gap between them is the whole answer to "where did the slack go":
     eat a breakfast a thousand over and the meals still ahead are asked for
     less; leave half of it and they are asked for more.
   *
     The arithmetic is the plain one. What is LEFT is the day's targets less
     what has actually been EATEN — not less what is merely plated, because a
     dinner you have not had yet is a plan, not a fact, and a plan cannot use
     up a day. What is left is then split across the meals still to come, by
     the same weights the plan uses, so the split is the plan's own rule
     applied to a smaller day.
   *
     A finished meal keeps its PLAN as its denominator. It is history: "1,425
     against a 387 plan" is the sentence you want tomorrow, and a finished
     meal that quietly re-scored itself against the day it left behind would
     be rewriting what happened.
   *
     `spent` is the honest part. Overrun the day's carbs and every meal still
     to come is owed nought of them — and three meals printing 0/0 is true and
     useless. The pill says so in a word instead. */
  function mMealAsk(sk, targets, slots, adjust) {
    var plan = mMealShare(sk, targets, slots);
    if (!plan) return null;
    var done = mMealDone(sk);
    /* Behind you, so its share is the plain one — see the note on `past`. */
    if (done) {
      var was = mMealShare(sk, targets, slots, true) || plan;
      return { now: was, plan: was, done: true, spent: {} };
    }

    var vk = mViewKey(), day = mDay(vk);
    var eaten = mTotals(day).eaten;
    /* Only what FINISHED meals ate comes off the day before it is shared out.
       A plate ticked on a meal still open is that meal's own food: it is
       already in what the meal holds, which is what its ask is compared to.
       Taken off the day as well, it was counted twice — a dinner sitting
       exactly on its share went red the moment one of its two plates was
       ticked, back to green when the other was, and every other meal's ask
       shrank by a plate that was never theirs. */
    eaten = { kcal: eaten.kcal, p: eaten.p, f: eaten.f, c: eaten.c };
    slots.list.forEach(function (s0) {
      if (mMealDone(s0.k)) return;
      (day[s0.k] || []).forEach(function (it) {
        var r0 = LIVE.BY_ID[it.id];
        if (!it.eaten || !r0 || !r0.macro) return;
        ['kcal', 'p', 'f', 'c'].forEach(function (m0) {
          eaten[m0] -= (r0.macro[m0] || 0) * it.x;
        });
      });
    });
    /* `adjust`, when given, is added to what has been eaten before anything
       is drawn from it. It exists for one caller: the cascade card asks what
       each open meal would be asked for had the meal that just finished
       landed exactly on its share, and the difference between that answer
       and the real one is what that meal's miss did — and nothing else. */
    if (adjust) {
      eaten = { kcal: eaten.kcal + (adjust.kcal || 0), p: eaten.p + (adjust.p || 0),
        f: eaten.f + (adjust.f || 0), c: eaten.c + (adjust.c || 0) };
    }
    /* One budget, spent in the order the plan was built in.
     *
       Taken macro by macro this produced a card that contradicted itself: a
       breakfast a thousand over left 315 calories in the day and 114 g of
       protein untouched, so lunch was asked for 41 g of protein and 17 g of
       fat inside a 113 kcal budget — three hundred kcal of food in a third of
       that. The overrun was real but it was CARBS, and flooring each macro at
       nought threw that away while the calorie line still counted it.
     *
       So the calories left are the budget, and the macros are drawn from it
       in turn: protein, then fat, then whatever is still there for carbs.
       That is the order mPlanCalc builds the plan in — protein off bodyweight,
       fat to its floor, carbohydrate the remainder — so a day that has to
       shrink gives way in the reverse order it was built, and carbohydrate,
       which was the remainder, is the remainder still.
     *
       It costs nothing on a day going to plan: with nothing eaten the three
       draws come to exactly the targets, because that is how the targets were
       computed. It only bites once the day is short, which is the only time
       anybody needs to be told what to protect. */
    var budget = Math.max(0, kcalOf(targets) - eaten.kcal);
    var room = { p: Math.max(0, targets.p - eaten.p),
      f: Math.max(0, targets.f - eaten.f),
      c: Math.max(0, targets.c - eaten.c) };
    var left = {};
    MDRAW.forEach(function (d2) {
      var m = d2[0], per = d2[1];
      var take = Math.min(room[m], budget / per);
      left[m] = take;
      budget -= take * per;
    });
    /* Derived, so the calorie line and the three macro lines are the same
       statement said two ways rather than two statements that can disagree. */
    left.kcal = 4 * left.p + 4 * left.c + 9 * left.f;

    /* The meals the slack has to go to: everything not skipped and not
       finished. This one is always among them — it is the meal being asked
       about, and a meal cannot be asked for nothing on the grounds that it
       does not exist. */
    var open = [], me = null;
    slots.list.forEach(function (s2) {
      if (s2.k === sk) { me = s2; open.push(s2); return; }
      if (mSkipped(vk, s2.k) && !(day[s2.k] || []).length) return;
      if (mMealDone(s2.k)) return;
      open.push(s2);
    });
    if (!me) return { now: plan, plan: plan, done: false, spent: {} };

    var share = mPlaceLeft(left, open, targets, slots);
    var frac = share.w[sk];
    if (frac === undefined) frac = 1;

    var now = {}, spent = {};
    ['kcal', 'p', 'f', 'c'].forEach(function (m) {
      now[m] = left[m] * frac;
      /* Nothing left to give, and the day has actually started — an untouched
         day has nothing eaten and is not "spent", it is just beginning. */
      spent[m] = left[m] <= 0 && eaten.kcal > 0;
    });
    return { now: now, plan: plan, done: false, spent: spent,
      capped: !!share.capped[sk], unplaced: share.unplaced };
  }

  /* A meal is never asked for less than a third of its plan nor more than
     double it. Below the floor it has stopped being a meal; above the ceiling
     the app is asking you to eat a dinner and calling it a snack — which is
     what happens without one the moment the only thing left is snacks. */
  var MFLOOR = 0.35, MCEIL = 2;

  /* How what is LEFT divides across the meals that are left.
   *
     Worked in fractions of `left` rather than in calories, and that is the
     load-bearing choice: every meal's four figures are then `left` times one
     number, so the macros a meal is asked for always add up to the macros the
     day has left, and the protein-first waterfall above survives intact. Hand
     out calories and then reconstruct macros from them and the two drift —
     which is the same two-answers-to-one-question this app keeps being bitten
     by, in a new place.

     The default is by size, never evenly. Dinner is the biggest meal, so it
     takes the biggest share of a surplus and gives up the most of a debt, and
     every meal moves by the same PROPORTION. Split evenly, 260 spare calories
     make a snack 41% bigger and a dinner 18% bigger, and the day stops looking
     like the day that was planned. */
  function mPlaceLeft(left, open, targets, slots) {
    var w = {}, capped = {}, lo = {}, hi = {}, plan = {};
    var vk = mViewKey();
    var sent = mSendOf(vk) || { to: [], off: false };
    var K = left.kcal;
    if (!(K > 0)) {
      /* Nothing left to divide. Everyone asks for nothing rather than for a
         share of a negative number, which would read as the day owing food. */
      open.forEach(function (s) { w[s.k] = 0; });
      return { w: w, capped: capped, unplaced: 0 };
    }
    open.forEach(function (s) {
      var pl = mMealShare(s.k, targets, slots);
      plan[s.k] = pl ? pl.kcal : 0;
      w[s.k] = plan[s.k] / K;                    // what following the plan costs
      lo[s.k] = (plan[s.k] * MFLOOR) / K;
      hi[s.k] = (plan[s.k] * MCEIL) / K;
    });
    /* Positive: the meals before this one came in light and there is more to
       go round than the plan claims. Negative: they ran over and the rest of
       the day has to give some back. */
    var rest = 1 - open.reduce(function (a, s) { return a + w[s.k]; }, 0);

    function give(keys, amount, byWeight) {
      var pass = 0;
      while (Math.abs(amount) > 1e-6 && pass < 8) {
        var able = keys.filter(function (k) {
          return amount > 0 ? w[k] < hi[k] - 1e-9 : w[k] > lo[k] + 1e-9;
        });
        if (!able.length) break;
        var sum = able.reduce(function (a, k) {
          return a + (byWeight ? mSlotW(mSlotOf(slots, k)) : 1);
        }, 0);
        if (!sum) break;
        var moved = 0;
        able.forEach(function (k) {
          var want = amount * ((byWeight ? mSlotW(mSlotOf(slots, k)) : 1) / sum);
          var room = amount > 0 ? hi[k] - w[k] : lo[k] - w[k];
          var take = amount > 0 ? Math.min(want, room) : Math.max(want, room);
          w[k] += take;
          moved += take;
          if (Math.abs(w[k] - (amount > 0 ? hi[k] : lo[k])) < 1e-9) capped[k] = 1;
        });
        amount -= moved;
        if (Math.abs(moved) < 1e-9) break;
        pass++;
      }
      return amount;
    }

    var keys = open.map(function (s) { return s.k; });
    /* The meals you ticked are the whole set, and they share by size.
     *
       Two things changed here when the card became a list of checkboxes.
       It used to walk the tapped meals IN THE ORDER TAPPED, each absorbing
       all it could before the next was asked, and then hand whatever was
       left to the meals you had NOT tapped. Both of those make a tick mean
       "first in the queue" rather than "this one" — untick a meal and it
       could still end up paying, which is the one thing a cleared checkbox
       must not do. A set is unordered and a set is exhaustive.

       What is left over when the ticked meals hit their floors is not
       quietly pushed somewhere else now: it stays unplaced, and the card
       says the day ends that far off. That is the answer Blake asked this
       card for — "let me know what's going to happen" — and it can only be
       given honestly if the overflow is allowed to exist. */
    var picked = sent.to.filter(function (k) { return keys.indexOf(k) >= 0; });
    if (picked.length) rest = give(picked, rest, true);
    else if (!sent.off) rest = give(keys, rest, true);
    return { w: w, capped: capped, unplaced: rest * K };
  }

  function mSlotOf(slots, k) {
    var out = null;
    slots.list.forEach(function (s) { if (s.k === k) out = s; });
    return out || { k: k };
  }

  /* Big enough that the meals after it visibly change size. Under this the day
     still moves — it always has — it just does it without saying so, which is
     what most days are. Raise it if the line starts reading as nagging; it is
     one number and it is not a setting, deliberately. */
  var MCASCADE_MIN = 150;

  /* The meal the line is about: the last one finished or skipped that still
     has meals after it.
   *
     DERIVED, not recorded. Nothing has to hook the eaten toggle, the whole-meal
     dot, the skip button and every other road to "this meal is over" — and
     nothing can be missed when a new road is added. It also gives the clearing
     rule away for free: finish lunch and lunch becomes the last finished meal,
     so breakfast's line stops being drawn without anything having to remember
     to remove it. Four buttons parked under breakfast at nine at night was the
     alternative. */
  function mLastFinished(targets, slots) {
    var vk = mViewKey(), day = mDay(vk), out = null, openAfter = false;
    for (var i = slots.list.length - 1; i >= 0; i--) {
      var s = slots.list[i];
      var items = (day[s.k] || []).filter(function (it) { return LIVE.BY_ID[it.id]; });
      var skipped = mSkipped(vk, s.k) && !items.length;
      var done = mMealDone(s.k);
      if (!done && !skipped) { openAfter = true; continue; }
      if (!openAfter) continue;          // nothing left after it to share with
      /* The plain share, for the same reason: this meal is finished or
         skipped, and its miss is measured against what the day actually
         asked it for rather than against a figure a later skip inflated. */
      var plan = mMealShare(s.k, targets, slots, true);
      if (!plan) continue;
      var got = { kcal: 0, p: 0, f: 0, c: 0 };
      items.forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (!r || !r.macro) return;
        ['kcal', 'p', 'f', 'c'].forEach(function (m) { got[m] += (r.macro[m] || 0) * it.x; });
      });
      out = { k: s.k, name: s.n, skipped: skipped, got: got, plan: plan,
        miss: got.kcal - plan.kcal };
      break;
    }
    return out;
  }

  /* One line, under the meal it is about, saying what already happened and
     offering to do it differently. It reports rather than asks: the share has
     landed by the time you read this, so ignoring the line entirely still
     leaves the day right and nothing sits half-updated waiting on an answer. */
  function mCascadeLineHTML(sk, targets, slots) {
    var ev = mLastFinished(targets, slots);
    if (!ev || ev.k !== sk) return '';
    if (Math.abs(ev.miss) < MCASCADE_MIN) return '';
    var vk = mViewKey(), day = mDay(vk);
    var sent = mSendOf(vk);
    if (sent && sent.f !== sk) sent = null;         // the question has moved on
    var to = sent ? sent.to : [], off = !!(sent && sent.off);
    var shut = !!(sent && sent.ack);
    var over = ev.miss > 0;
    var amt = Math.abs(Math.round(ev.miss));

    var open = [];
    slots.list.forEach(function (s2) {
      if (mMealDone(s2.k)) return;
      if (mSkipped(vk, s2.k) && !(day[s2.k] || []).length) return;
      open.push(s2);
    });
    if (!open.length) return '';

    /* Every open meal's own share and what it is being asked for now. The
       difference is what this miss did to it, and it is read off mMealAsk
       rather than worked out again here — the card and the meal's own pills
       have to agree about the same meal, and the only way to guarantee that
       is to read the same function. */
    var rows = [], floored = [], un = 0;
    /* `was` is each meal's ask had this meal landed on its share; `now` is
       its ask as things stand. The difference is what THIS miss did to it.
     *
       It used to show the meal's plan share against its current ask, which
       folds in every meal finished so far — so under a heading that said
       "Lunch went 216 under", the rows summed to 850, and a wake-up and a
       breakfast that had run over were doing most of the moving. Blake, with
       the screenshots: "the macro is shifting after I click Complete". The
       rows were true and the heading was about something else. The note on
       `un` below records the same confusion caught once already, for the
       landing line; this is the rows catching up. */
    var undo = { kcal: ev.plan.kcal - ev.got.kcal, p: ev.plan.p - ev.got.p,
      f: ev.plan.f - ev.got.f, c: ev.plan.c - ev.got.c };
    open.forEach(function (s2) {
      var a = mMealAsk(s2.k, targets, slots);
      if (!a || !a.plan) return;
      var before = mMealAsk(s2.k, targets, slots, undo);
      var was = Math.round(((before && before.now) || a.plan).kcal);
      var now = Math.round((a.now || a.plan).kcal);
      var on = off ? false : (to.length ? to.indexOf(s2.k) >= 0 : true);
      if (on && a.capped) floored.push(s2.n);
      /* One number for the whole day's remainder, so every open meal's ask
         carries the same copy of it. Read rather than reconstructed: the
         first version of this line worked the landing out as "the miss minus
         what the rows gave up", which are two different quantities — the
         miss is measured against LUNCH'S share and the rows against their
         own — and it confidently reported a day 463 over that was not. */
      if (typeof a.unplaced === 'number') un = Math.round(a.unplaced);
      rows.push({ k: s2.k, n: s2.n, was: was, now: now, d: was - now, on: on, cap: !!a.capped });
    });
    if (!rows.length) return '';

    /* Where the day lands, in the same sentence in every state. Negative
       means the meals left cannot give back enough and the day runs over;
       positive means they cannot absorb it all and the day comes in short. */
    var lands = un < -0.5 ? 'The day ends <b>' + Math.abs(un) + ' over</b>.'
      : un > 0.5 ? 'The day ends <b>' + un + ' short</b>.'
      : 'The day still <b>lands on plan</b>.';

    /* Where the day LANDS. The old card ended on what it had done —
       "Borrowed from Evening Snack and Dinner" — which is the app's own
       bookkeeping, in the app's vocabulary, leaving the reader to work out
       what it meant for them. Blake: "I kind of want something that will let
       me know what's going to happen now that I've overeaten."
     *
       A meal never drops below a third of its share nor grows past twice it,
       so a big miss frequently cannot be absorbed at all — and the line that
       matters is the one saying so. Ending on "borrowed from" implied the
       books were square when they were hundreds of calories from it. */
    var said = off
      ? (over ? '<b>No meal shrinks.</b> ' : '<b>No meal grows.</b> ') + lands
      : lands + (floored.length
        ? ' ' + floored.join(' and ') + (floored.length > 1 ? ' are' : ' is') +
          ' at the ' + (over ? 'floor' : 'ceiling') + ' — ticking more places no more.'
        : '');

    var head = ev.skipped
      ? 'Skipping ' + esc(ev.name) + ' frees ' + amt
      : esc(ev.name) + ' went ' + amt + (over ? ' over its share' : ' under its share');

    var shell = function (inner, ariaShut) {
      return '<div class="mcasc' + (over ? ' over' : '') + (shut ? ' shut' : '') +
        '" role="status">' +
        '<span class="mcasc-i" aria-hidden="true">' + (over ? '&#8599;' : '&#8600;') + '</span>' +
        '<span class="mcasc-b">' + inner + '</span></div>';
    };

    /* Answered, so it gets out of the way. The day was already right before
       any of this was read — the share lands on render — so once you have
       looked at it the card has no further business taking a third of the
       screen. The line stays, because what happened to the day is worth
       being able to see; the apparatus for changing it does not. */
    if (shut) {
      return shell(
        '<button class="mcasc-fold" data-msend="open" aria-expanded="false">' +
          '<span class="mcasc-foldt">' +
            '<span class="mcasc-t">' + head + '</span>' +
            '<span class="mcasc-s">' + said + '</span>' +
          '</span>' +
          '<span class="mcasc-cue" aria-hidden="true">&#8964;</span>' +
        '</button>');
    }

    /* A list you choose several from, drawn as one. Each was a ghost button
       reading "Borrow from Dinner" that toggled when pressed a second time —
       a control that toggles ought to look like it toggles — and "Don't
       borrow" sat at the bottom in different words for what is plainly the
       None of this list. */
    var pick = rows.map(function (r) {
      return '<button class="mcasc-row" role="checkbox" data-msend="' + esc(r.k) + '"' +
        ' aria-checked="' + (r.on ? 'true' : 'false') + '">' +
        '<span class="mcasc-box" aria-hidden="true">&#10003;</span>' +
        '<span class="mcasc-nm">' + esc(r.n) +
          (r.on && r.cap
            ? '<span class="mcasc-cap">at its ' + (over ? 'floor' : 'ceiling') + '</span>'
            : '') +
        '</span>' +
        /* The price of ticking this one, on the row that does it. Choosing
           between consequences rather than between meal names. */
        '<span class="mcasc-was">' + r.was + ' &rarr; <i>' + r.now + '</i></span>' +
        /* The sign is the row's own. It was chosen by whether the finished
           meal went over, so a row moving down read "+49" whenever lunch had
           come in light. `d` is was - now: positive means this meal is being
           asked for less than it would have been, and that is a minus. */
        '<span class="mcasc-d">' + (r.on && r.d ? (r.d > 0 ? '&minus;' : '+') +
          Math.abs(r.d) : '&mdash;') + '</span>' +
      '</button>';
    }).join('');

    /* Why a big miss can outlast the other meals is the same sentence every
       time, so it waits behind "why?" under the line it explains. */
    var capWhy = 'A meal never ' +
      (over ? 'drops below a third of its share' : 'grows past twice its share') +
      ', so there is a limit to what ' + (over ? 'an overshoot' : 'a surplus') +
      ' can be made to disappear into.';
    return shell(
      '<span class="mcasc-t">' + head + '</span>' +
      '<span class="mcasc-s">' + said + ' ' + mWhyBtn('casc') + '</span>' +
      mInfoText('casc', capWhy, 'mcasc-note') +
      '<div class="mcasc-pick no-print">' +
        '<div class="mcasc-ph">' +
          '<span>' + (over ? 'Take it from' : 'Give it to') + '</span>' +
          '<span class="mcasc-pa">' +
            '<button data-msend="all">All</button>' +
            '<button data-msend="none" aria-pressed="' + (off ? 'true' : 'false') + '">None</button>' +
          '</span>' +
        '</div>' + pick +
        '<div class="mcasc-done">' +
          '<button class="btn-primary" data-msend="ack">Done</button>' +
        '</div>' +
      '</div>');
  }

  /* `past` asks for the share a meal BEHIND you had, which is its plain
     share of the day and nothing else.
   *
     A skipped meal's weight comes out of the denominator so that its food
     goes to the meals still ahead of you. That is right for those meals and
     wrong for every meal already eaten: skipping a lunch raised Wake Up's
     target from 248 to 310, hours after Wake Up was eaten and closed, and
     its bar then read 62 short of something the day never asked it for.
     Nothing moved — a done meal's ask is its own plan either way — but the
     figure beside it was a claim about the past that the past did not make.
     You cannot send freed calories backwards in time. */
  function mMealShare(sk, targets, slots, past) {
    var me = null, sumW = 0, vk = mViewKey(), day = mDay(vk);
    slots.list.forEach(function (s) {
      if (!past && s.k !== sk && mSkipped(vk, s.k) && !(day[s.k] || []).length) return;
      sumW += mSlotW(s);
      if (s.k === sk) me = s;
    });
    if (!me || !sumW) return null;
    var frac = mSlotW(me) / sumW;
    return { frac: frac, kcal: kcalOf(targets) * frac,
      p: targets.p * frac, f: targets.f * frac, c: targets.c * frac };
  }

  /* An empty meal, and what it is for.
   *
     It read "at its share &middot; 98". A share is how the solver divides the
     day's remainder between the meals you have not filled — an implementation
     detail wearing a chip, and the one thing on this screen Blake said was
     not intuitive. He is right: nobody should have to learn that word to read
     their own breakfast.

     The number was never the problem. It stays, with the flame the rest of
     the row uses, and the sentence goes. No gauges here — there is nothing on
     the plate to draw, and four empty tracks per meal is most of what you see
     first thing in the morning. */

  return { mMealDone: mMealDone, mMealAsk: mMealAsk, mLastFinished: mLastFinished, mCascadeLineHTML: mCascadeLineHTML, MCASCADE_MIN: MCASCADE_MIN };
};
