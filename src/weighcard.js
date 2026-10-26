/* The weigh-in card on My Day (macroWeighHTML): the box for this morning's
 * weight in Strengthen's unit, the seven-day average and its spark, the
 * plan's line and the arithmetic behind it, today's training in one row,
 * and the morning card under it. The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.weighcard(app) once, as it starts, and keeps what it gives
 * back under the same name. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).weighcard = function (app) {
  'use strict';

  // what it reads of the app's
  var MWEIGHTS = app.MWEIGHTS;
  var S = app.S;
  var kcalOf = app.kcalOf;
  var mAhead = app.mAhead;
  var mDayTargets = app.mDayTargets;
  var mIsTrainingDay = app.mIsTrainingDay;
  var mLbWord = app.mLbWord;
  var mLineHTML = app.mLineHTML;
  var mLsFull = app.mLsFull;
  var mLsFullSay = app.mLsFullSay;
  var mCheckinHTML = app.mCheckinHTML;
  var mMorningHTML = app.mMorningHTML;
  var mMovedHTML = app.mMovedHTML;
  var mPlanDetail = app.mPlanDetail;
  var mPlanFace = app.mPlanFace;
  var mSparkSVG = app.mSparkSVG;
  var mSynced = app.mSynced;
  var mTrainDays = app.mTrainDays;
  var mTrainRow = app.mTrainRow;
  var mTrainWord = app.mTrainWord;
  var mTrainedSaid = app.mTrainedSaid;
  var mWShow = app.mWShow;
  var mWUnit = app.mWUnit;
  var mWeekOn = app.mWeekOn;
  var mWeightStats = app.mWeightStats;
  var todayKey = app.todayKey;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function macroWeighHTML(k) {
    var v = MWEIGHTS[k];
    var st = mWeightStats();
    /* Whether there is a plan at all decides which of the two doors this card
       shows — and whether it shows one. See the note beside the button. */
    var hasPlan = !!kcalOf(mDayTargets(k));
    var body;
    /* The graph, and nothing else. Beside it there were four lines saying
       the seven-day average four ways and the weekly change three — "204.5
       avg", "Averaging 204.5", "seven-day average 204.5", "up 0.2 on the week
       before" — and the rate the plan expects twice. Blake: "that whole
       thing can be way more concise and easy to understand. I like the graph
       though." The numbers are said once, under the goal (mPlanDetail). */
    if (st && st.n >= 2) {
      body = mSparkSVG();
    } else {
      body = '<div class="mw-stat">Weigh in a few mornings and your trend appears here.</div>';
    }
    /* ---- the morning card ----
     * The same card the meals wear, and now the whole morning rather than
     * half of it. The weigh-in and the plan were two cards saying one thing:
     * one held the number, the other held what the number meant, and reading
     * the second meant carrying the first down the screen to it. Together
     * they took about two hundred pixels before the day reached any food.
     *
     * What is on the face is what you do every morning and the one line that
     * says whether it is working. What is behind the press is the evidence
     * for that line — the average, the week, the sparkline, and the way in to
     * change the plan. Crafting a plan is a once-a-season job and does not
     * get a permanent seat; the press is the same one the meal cards wear,
     * so the gesture is already learned by the time it is needed here, and
     * "Craft my plan" stays in the gear as a second way in.
     *
     * The one exception on the face is the morning line, and it earns it by
     * being rare and by being the only line in the app that ever tells you
     * NOT to act on the number above it. A salt jump you cannot see is a
     * salt jump you cut calories over. */
    /* Three states, not two.
     *
       ASKING is a morning with nothing on the scale yet: the box and the tick
       and nothing else. No verdict, no history — a card that has not been
       given its two numbers has not earned an opinion, and a pace line over
       an empty box is the nagging this screen was rebuilt to stop.
     *
       SHUT is a morning already answered, and it means one row. Blake: "it
       needs to fully collapse." A card still showing two of its three rows is
       not shut.
     *
       OPEN is a tap, and only a tap. It is the only state that brings the
       trend, the history and the chart, because those are things you go
       looking for rather than things a morning owes you. */
    var answeredW = !!MWEIGHTS[k];
    var touchedW = S.mFold.weigh !== undefined;
    var openAll = touchedW && S.mFold.weigh === false;
    var asking = !touchedW && !answeredW && !mAhead(k);
    var shut = !openAll && !asking;
    var face = mPlanFace();
    var detail = mPlanDetail();
    var head = st && st.n >= 2
      ? Math.round(st.avg7 * 10) / 10 + ' lb avg' +
        (st.dWeek === null ? '' : ' &middot; ' + mLbWord(st.dWeek) + ' this week')
      : '';
    var ahead = mAhead(k);
    return '<div class="mslot-h">' +
        '<button class="mday-dot no-print" data-mdot="weigh"' + (ahead ? ' disabled' : '') +
          ' aria-label="Log this morning&rsquo;s weight"></button>' +
        /* "Plan today", not "Weigh-in". The card takes two things only you
           know — what the scale said and whether you are training — and hands
           back the one thing you opened the app for. Naming it after the
           first of its two inputs described a third of it. Blake: "weigh in
           card I think needs to be more plan the day." */
        /* aria-expanded is OPEN, not "not shut". The asking state shows the
           box and the tick and is still closed as far as the fold is
           concerned — and while it claimed to be expanded, the toggle read
           it as open and every tap CLOSED the card. Which is also how the
           only door to the plan sheet became unreachable: the suite's
           opener taps this handle to reach "Adjust my plan", and the tap was
           being spent shutting what it meant to open. */
        '<button class="mslot-name" data-mfold="weigh" aria-expanded="' +
          (openAll ? 'true' : 'false') + '">Plan today' +
          /* The handle lives on this row now, because on a morning you have
             not weighed yet this row IS the card. It used to sit on the
             verdict line below, which only exists once there is a plan and a
             week of mornings to say anything about. */
          '<span class="mfold-cue" aria-hidden="true">&#8964;</span>' +
        '</button>' +
        /* The box, and nothing else. It wore the word "Weight" in front of
           it — on a card headed WEIGH-IN, above a line about weight, next to
           a figure in pounds — which pushed the whole thing onto a second
           row to say what the card had already said twice. The label is the
           card; the unit is the only word that carries anything. */
        /* Folded, the row carries what the card decided instead of the box
           that decides it. Blake: "it needs to fully collapse." A card that
           keeps three rows when shut is not shut, and the two inputs are no
           use to a morning already answered — but the answer is, all day. */
        (shut
          ? (function () {
              if (!answeredW && !(st && st.n >= 2)) {
                return '<span class="mw-ask">Weigh in</span>';
              }
              /* The AVERAGE, not this morning's number, because the average
                 is what the plan is actually built on — mScaleLb reads avg7,
                 and a single morning is mostly water. With too few mornings
                 to average, the number you typed stands in.
               *
                 And not the day's calories or macros: the sticky strip above
                 carries those, and a card repeating them is a second answer
                 to a settled question. */
              /* This morning's number when you weighed, because that is the
                 number you just typed — Blake read the average there as the
                 app disagreeing with his scale. The average is on the open
                 card. */
              // in the unit the box asks in (mWUnit), the number typed back
              var wu = ' ' + mWUnit();
              var sumN = answeredW
                ? '<b>' + mWShow(MWEIGHTS[k]) + '</b><u>' + wu
                : st && st.n >= 2
                ? '<b>' + mWShow(st.avg7) + '</b><u>' + wu + ' avg'
                : '<b>' + mWShow(MWEIGHTS[k]) + '</b><u>' + wu;
              /* No verdict chip here: the coaching line directly under the
                 closed card already says where you stand, and a chip beside
                 it pushed the card's name onto two lines at phone width. */
              var tw = mTrainWord(k);
              return '<span class="mw-sum">' + sumN + '</u>' +
                (tw ? '<span class="mw-sum-t">' + tw + '</span>' : '') + '</span>';
            })()
        : ahead
          ? '<span class="mw-avg mw-later">not yet</span>'
          /* Text, not number, with the decimal keypad asked for separately.
           *
             A number input EATS a comma before any script sees it: type
             "80,5" and the browser hands you "805", which is a real number,
             passes every guard, stores eight hundred and five pounds and
             doubles the day's calories off a seven-day average. Blake does
             not write weights with commas — so a comma is not a weight that
             needs interpreting, it is a keystroke that means the entry is
             wrong. It can only be refused if it survives long enough to be
             seen, and only a text box lets it. Length-capped because the box
             no longer has a max of its own. */
          : '<label class="mt-lab no-print"><input type="text" id="mWeight" maxlength="6" ' +
            'inputmode="decimal" autocomplete="off" ' +
            'aria-label="This morning\u2019s weight in ' + (mWUnit() === 'kg' ? 'kilograms' : 'pounds') + '" ' +
            'value="' + (v ? mWShow(v) : '') + '"> ' + mWUnit() +
            '<span class="mw-note" id="mWeightNote" role="status"></span></label>') +
      '</div>' +
      /* Next to the weigh-in, because it is the other thing a morning knows
         about you, and on its own line because that header row already
         carries a dot, a name, a fold cue and a number box.
       *
         It says nothing when there is no cycling to move: with a flat plan
         the tick would be a box that changes nothing, which is worse than no
         box. And it never claims to have earned anything — the calories were
         counted when the profile was filled in.
       *
         With no lifting days picked it says something only about a day that
         was trained anyway — a workout in Strengthen, or a tick already
         given — because that is the one day the carbohydrate moves. */
      (shut || ahead || mTrainDays().length >= 7 ||
        (!mTrainDays().length && !mIsTrainingDay(k) && (mSynced() || !mTrainedSaid(k))) ? ''
        : mTrainRow(k)) +
      /* The day's numbers are NOT repeated here. They were, for one build:
         "1,745 calories today, 205 P 61 F 94 C" — which is the sticky strip
         four inches above it, said again in different words. Blake: "I don't
         need a duplicate card saying the exact same thing. The sticky header
         is doing it with the calories and macros."
       *
         So this card says only what nothing else does: what the scale read,
         whether you trained, and why that moved the carbohydrate. */
      /* The tick's whole justification, said once where somebody looking for
         it will find it. It buys no calories — the sessions were counted when
         the profile was filled in, and paying for them twice is the fault this
         tick was built to avoid. What it does buy is carbohydrate moved onto
         today and off a rest day, and the week ends where it started. Blake,
         reasonably suspicious: "with the training tick, it does give me more
         calories. From what I understand it should not." Both are true, and
         only saying so out loud settles it. */
      '' +
      /* The plan, one line, on the face — and the same handle the meals wear,
         on the seam rather than in the header: this line is the last thing
         above what folds away, so the mark on the end of it is sitting at the
         edge that moves.
       *
         With no plan yet the line is the invitation instead, and then it is
         not a handle at all: it carries a button of its own, and a button
         inside a button is not a thing. The name still folds the card. */
      /* Two verdicts, and only one of them is an opinion.
       *
         With a plan (face.has) this line judges your pace, and judging is
         something you go looking for — OPEN only, never over a morning that
         has not been weighed.
       *
         With NO plan it is not a judgement at all, it is the invitation, and
         it carries the only door into the plan sheet that is not the gear.
         Gating it on `open` shut that door on a page nobody had weighed in
         on, and the suite threw at the first test that tried to walk through
         it. The comment below this one records the same mistake being made
         once before. It renders whenever the card is not collapsed. */
      (face.has
        ? (!openAll ? ''
        : '<div class="mw-verdict mw-open">' + face.html +
            (detail ? '<span class="mw-avg mw-stats">' + detail + '</span>' : '') + '</div>')
        : shut ? ''
        /* The button here only while there IS a plan to adjust.
         *
           With NO plan there were three "Craft my plan" in one screenful —
           this one, the readout's line above it, and the gear — none of them
           the thing a thumb lands on. The bottom bar's primary button is that
           way in now: the largest control on the tab, and previously dead and
           green at exactly this moment.
         *
           But it may not simply go. Dropping it outright left a plan that was
           already set, on a morning not yet weighed, with no way into the
           sheet except the gear — because the "Adjust my plan" copy below
           only renders once there is a weigh-in to fold away. The suite
           caught it in one run. So: gone when the bar is carrying it, present
           when the bar has gone back to Fill.
         *
           And it still says CRAFT, not adjust. Two different things get called
           a plan here: kcalOf(targets) is "are there numbers to eat against",
           which is what the bar branches on, and face.has is "is there a
           profile behind them" — a goal, a weight, a date. This is the
           face.has === false branch, so there is no crafted plan to adjust
           yet however the numbers got set, and "Adjust" would be offering to
           change something that does not exist. */
        : '<div class="mw-verdict">' +
          (head ? '<span class="mw-avg">' + head + '</span>' : '') + face.html +
          (hasPlan ? ' <button class="ghost mplan-go no-print" id="macroTargBtn">' +
            'Craft my plan</button>' : '') + '</div>') +
      (mLsFull() ? mLineHTML('act', '!', '<b>Not saved on this phone.</b>', esc(mLsFullSay())) : '') +
      (k === todayKey() ? mMovedHTML() : '') +
      mMorningHTML(k, 'face') +
      (!openAll ? '' : '<div class="mw-body">' + mMorningHTML(k, 'body') + body +
        /* The week, beside the plan: the same check-in Strengthen's Review
           opens, the scale and the food and the training side by side. */
        (face.has || mWeekOn()
          ? '<div class="mw-adj no-print">' +
            (face.has ? '<button class="ghost mplan-go" id="macroTargBtn">Adjust my plan</button>' : '') +
            (mWeekOn() ? '<button class="ghost mplan-go" id="macroWeekBtn">This week</button>' : '') + '</div>'
          : '') +
      '</div>') +
      /* The rest of the morning, after everything the scale decides, so the
         weight and what it means stay together at the top: last night's
         sleep, yesterday's steps, the creatine and the day's drinks
         (src/checkin.js). On every state of the card, shut
         included, because the card is only ever seen in the sheet Today
         opens — and a check-in that shut itself the moment the scale was
         read would ask the other four questions of nobody. Not on a morning
         still ahead: nobody has slept it yet. */
      (ahead ? '' : mCheckinHTML(k));
  }

  return { macroWeighHTML: macroWeighHTML };
};
