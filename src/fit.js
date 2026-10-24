/* What a plate scores against the day: the weights that keep a meal to its
 * share without busting the day (MW), the servings a suggestion may offer
 * and how far past its share one may go (MX), a single food stopped at a
 * plateful (MFOOD_G_MAX), the score itself (macroFit) and the list ranked by
 * it (mRank); salt on its own line (mSaltChip, mSaltNote, mSaltFibre); one
 * line of a plate's numbers (mMacLine); what the day is still owed, cached
 * for one render (mGapFresh); and whether a portion lands the macro it is
 * read against (mClosesIt). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.fit(app) once, as it starts, and keeps what it gives back under
 * the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).fit = function (app) {
  'use strict';

  // what it reads of the app's
  var mDayEaten = app.mDayEaten;
  var mDayTargets = app.mDayTargets;
  var mIsFav = app.mIsFav;
  var mShares = app.mShares;
  var mViewKey = app.mViewKey;

  /* Fill your share, never bust the day.
   *
   * Undershoot is judged against the MEAL's share T — a breakfast is not
   * blamed for failing to deliver the whole day's protein — but overshoot is
   * judged against the DAY's remaining R, because a portion that spends grams
   * the day no longer has is a problem no matter which meal spends them. That
   * one asymmetry is what makes the same formula behave at nine in the morning
   * (share = a quarter of the day, ×1 of a normal breakfast scores high) and
   * at nine at night (share = exactly the gap, the picker chases it).
   *
   * The weights are the cut, written down: protein is the only macro that is
   * expensive to leave on the table (1.00 under vs 0.55 for fat and carbs),
   * and going over on fat or carbs costs about twice what undershooting them
   * does (1.20 vs 0.55). Protein overshoot is mildly charged (0.35) so nobody
   * is told to eat three chicken dinners at bedtime.       [under, over]
   *
   * Fat and carbs were once 0.10 under against 2.00 over — twenty to one, on
   * the theory that busting a cut is the thing to fear. Measured over ten
   * drafted days at each of the four goals, that theory cost 250 to 350
   * calories a day and, on a hard cut, 52 grams of protein; it bought nothing,
   * because not one day at any weighting went over on fat or carbohydrate.
   * There was no bust to protect against. Two to one keeps the instinct —
   * under still beats over on a cut — at a price the day can pay. */
  var MW = { p: [1.00, 0.35], f: [0.55, 1.20], c: [0.55, 1.20] };

  /* Half a serving up to three. x is servings EATEN, not batches cooked, so
     there is no cap tied to servN — three servings of a six-serving roast is a
     plate, and a dessert at any x sinks on its own fat and carbs. */
  var MX = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

  /* How far over its own share a single suggested portion may go.
   *
     Undershoot is judged against the meal's share and overshoot against the
     DAY's remaining, which is right for the day and blind for the meal: at
     breakfast, with nothing eaten yet, one dish can claim all of the day's
     protein and be charged nothing for it. The ranking did exactly that — it
     offered three servings of a 271 kcal plate, 813 kcal, for a meal whose
     share was 381.

     Nobody asked the app for that and it is where a lot of overeating starts:
     not a plan gone wrong later, a number too big when it was first put in
     front of you. So a portion may run over its share, because meals are not
     equal and the day still has to be filled — but not without limit.

     1.15 is measured, not chosen: swept over 600 seeded days at 1.15 / 1.25 /
     1.35 / 1.5 / 1.75 / 2.0 against no cap at all. It gives the best meal
     balance (meals off their share 813 -> 427 kcal), better protein than no
     cap (5.3 -> 4.8 g), and a third as many oversized plates as the next
     setting up. It costs about 16 kcal a day of precision on the day's total,
     which is the honest price of not stuffing the day through one meal.

     Only the SUGGESTION is bound. mBalanceDay does its own sizing against the
     whole day and is deliberately left alone: it is what lets the day still
     reach its protein, and constraining it costs about 14 g a day, which is
     measured and not worth it. */
  var MX_OVER = 1.15;
  /* A single food offered as a dish stops at a plateful. The ladder counts
     in the food's own unit, and for the vegetables that unit is the pound —
     so "no portion exceeds ×3" was a three-pound ceiling for broccoli, and the
     picker opened Wake Up on Broccoli ×1½ lb · 281 kcal · 19P, a protein
     source that is a bag of broccoli. Four hundred grams clears every real
     plate in the book (a cup and a half of egg whites is 365) and stops the
     bag. Foods only: a dish is measured in servings, and its own portion has
     its own rule. */
  var MFOOD_G_MAX = 400;

  function macroFit(r, R, T, D) {
    var best = null, smallest = null;
    // the share in calories, which is the thing a portion can be too big for
    var roof = MX_OVER * (4 * (T.p || 0) + 4 * (T.c || 0) + 9 * (T.f || 0));
    var kc = (r.macro && r.macro.kcal) || 0;
    var rungs = r.eatout ? [1] : MX;
    for (var i = 0; i < rungs.length; i++) {
      var x = rungs[i], pen = 0;
      if (!r.eatout && r.food && r.grams && r.grams * x > MFOOD_G_MAX) break;   // rungs only go up
      for (var m in MW) {
        var s = (r.macro[m] || 0) * x;
        pen += MW[m][0] * Math.max(0, T[m] - s) / D[m];
        pen += MW[m][1] * Math.max(0, s - R[m]) / D[m];
      }
      var sc = Math.round(100 * (1 - pen));
      // strict >, walking x upward: a tie keeps the smaller portion. On a cut,
      // when two sizes score the same, eat less.
      if (!smallest) smallest = { x: x, score: sc };
      if (roof > 0 && kc * x > roof) continue;
      if (!best || sc > best.score) best = { x: x, score: sc };
    }
    /* A dish bigger than the roof at even the smallest portion still has to
       come back with something — a meal with no answer is worse than a large
       one, and the ranking will sink it on its own merits. */
    return best || smallest;
  }

  /* The two the fit scorer never knew about.
   *
     Six days drafted by Fill my day averaged 3,408 mg of sodium against a
     2,300 mg guideline, and 12 g of fibre against 18 — and not one of the six
     reached the fibre floor. The scorer was choosing honestly against protein,
     fat and carbohydrate and blind to both, so it kept picking the salty
     option when two plates fit the macros equally well.
   *
     Small on purpose. This is a thumb on the scale between plates that
     already fit, in the same weight class as the favourite bonus — not a
     second opinion loud enough to argue a cut out of its protein. A plate is
     judged per hundred calories, so a big serving is not punished for being
     big. */
  /* A plate salty enough to matter on its own says so.
   *
     A thumb on the ranking cannot fix this pantry: the median recipe here is
     128 mg of sodium per 100 kcal against a line of about 115, only 125 of
     277 sit under it, and one serving of the worst is 2,096 mg — most of a
     day's ceiling in a single plate. Penalising hard enough to avoid that
     would quietly hide half the book. So the ranking nudges, and the plate
     that is actually the problem is named. */
  var MSALT_FLAG = 800;                 // a third of the day's ceiling, on one plate

  /* The fifth thing a plate costs you, said on the cost line with the other
     four — not as a bordered chip beside the book.
   *
     The box was the bug. At 74x16 inside an 11px-tall .mitem-from carrying
     overflow:hidden it overhung 2.5px each way, so the top and bottom borders
     were clipped off and what reached the screen was "RUN │1,079 mg salt│" —
     two vertical strokes around the words. A border that survives being cut in
     half is not a border, and the warning colour was doing the work anyway.
     The triangle is the app's own line-art, at the weight the bin is drawn. */
  function mSaltChip(r, x) {
    var na = Math.round(((r.macro || {}).na || 0) * x);
    if (na < MSALT_FLAG) return '';
    return '<span class="msalt">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true">' +
        '<path d="M8 2.6 14.4 13.4H1.6Z" fill="none" stroke="currentColor" ' +
          'stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M8 6.8v2.6M8 11.3v.1" fill="none" stroke="currentColor" ' +
          'stroke-width="1.3" stroke-linecap="round"/>' +
      '</svg>' + na.toLocaleString() + ' mg salt</span>';
  }

  function mSaltNote(r, x) {
    var na = Math.round(((r.macro || {}).na || 0) * x);
    return na < MSALT_FLAG ? '' : ' <span class="mp-salt">' + na.toLocaleString() + ' mg salt</span>';
  }

  function mSaltFibre(r, x) {
    var mac = r.macro || {};
    var kcal = (mac.kcal || 0) * x;
    if (kcal < 40) return 0;                    // too small to say anything about
    var per100 = 100 / kcal;
    var na = (mac.na || 0) * x * per100;        // mg per 100 kcal
    var fib = (mac.fib || 0) * x * per100;      // g per 100 kcal
    /* 2300 mg against ~2000 kcal is about 115 mg per 100 kcal, and 14 g per
       1000 kcal is 1.4 g per 100. Those are the lines; the score is how far
       either side of them a plate sits, clamped so one outlier cannot decide
       a meal on its own. */
    var salt = Math.max(-6, Math.min(2, (115 - na) / 40));
    var fibre = Math.max(-2, Math.min(4, (fib - 1.4) * 2));
    return salt + fibre;
  }

  function mRank(list, day, targets, slot) {
    var sh = mShares(day, targets, slot);
    var ranked = [], flat = [];
    /* No plan, no ranking.
     *
       With targets of 0/0/0 every share is 0 and D falls to its floor of 1,
       which leaves macroFit nothing to weigh but the overshoot term — and
       that is smallest at the smallest portion it is allowed to try. So every
       row came back at ×½: the picker offered half a serving of everything,
       and a tap logged half a serving nobody had asked for, on the one kind
       of day where the app has already said it will not make anything up.
   *
       A day with no targets has no fit to compute, which is the same case as
       a recipe with no numbers — so it takes the same honest answer the flat
       branch below already gives: the whole thing, in book order, ranked
       against nothing and saying so. Callers that need a fit filter on
       `score !== null` and correctly find none. */
    var planned = !!(targets && (targets.p || targets.f || targets.c));
    list.forEach(function (r) {
      if (planned && r.macro && ((r.macro.p || 0) + (r.macro.c || 0) + (r.macro.f || 0)) > 0) {
        var fit = macroFit(r, sh.R, sh.T, sh.D);
        /* A few points for a favorite: enough that the meal you love wins the
           near-tie against the one you have never made, never enough to argue
           a dessert into a cut. The fit still owns the ranking. */
        ranked.push({ r: r, x: fit.x,
          score: fit.score + (mIsFav(r) ? 6 : 0) + mSaltFibre(r, fit.x) });
      } else {
        // reachable, honest, and unranked — a recipe with no numbers cannot
        // be sorted by them
        flat.push({ r: r, x: 1, score: null });
      }
    });
    ranked.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var pa = a.r.macro.kcal ? a.r.macro.p / a.r.macro.kcal : 0;
      var pb = b.r.macro.kcal ? b.r.macro.p / b.r.macro.kcal : 0;
      return (pb - pa) || (a.r.book - b.r.book) || ((a.r.no || 0) - (b.r.no || 0));
    });
    return ranked.concat(flat);
  }

  /* One line of an item's arithmetic: "~415 kcal · 43P · 6F · 42C". The tilde
     carries the honesty of est through the multiplication — figures estimated
     from a food table do not become label-accurate by being scaled. */
  /* The same four numbers everywhere they appear, with the letters carrying
     the macro's own colour. Identity, not status — a P is the same red on a
     plate, in the picker and in the basket, which is what lets the eye find
     the protein without reading the line. */
  /* What the day is still owed, cached for the length of one render.
   *
     Every row on a forty-row list asks the same question, and answering it
     per row walked the whole day forty times. Cleared by mGapFresh() at the
     top of each list build, because a tick changes the answer and a stale
     one would paint the row that just moved against the gap it moved from. */
  var MGAP = null;
  function mGapFresh() { MGAP = null; }
  function mGapLeft() {
    if (MGAP) return MGAP;
    var k = mViewKey(), t = mDayTargets(k);
    if (!t.p && !t.f && !t.c) { MGAP = { none: true }; return MGAP; }
    var sub = mDayEaten(k);
    MGAP = { none: false, p: Math.max(0, t.p - sub.p), f: Math.max(0, t.f - sub.f),
      c: Math.max(0, t.c - sub.c), t: t };
    return MGAP;
  }

  /* Does this portion LAND the macro it is being read against, or bust it?
   *
     The band is the day's, not the row's — a tenth of the day's target,
     floored so a nearly-closed macro does not call everything a bust. The
     same rule the meal gauges use, and for the same reason: a tolerance
     measured against a small remainder lights up on everything. */
  /* Honest note on `busts`: it is nearly unreachable from the picker's own
     suggested portions, and that is the fit engine working rather than a
     bug. macroFit prices fat and carb overshoot at twenty times undershoot,
     so the portion it solves for almost never lands past the gap — a
     mutation that disabled busting entirely left the suite green, on every
     seeded day tried. It fires where a portion is not fit-solved: a plate
     stepped up by hand. Kept because that path is real, not claimed as
     covered. */
  function mAgainstGap(m, got) {
    var g = mGapLeft();
    if (g.none || !(g[m] > 0)) return '';
    var band = Math.max(3, (g.t[m] || 0) * 0.1);
    if (got > g[m] + band) return ' busts';
    if (Math.abs(got - g[m]) <= band) return ' lands';
    return '';
  }

  /* `vsGap` is opt-in, and the reason is worth stating: reading a macro
     against what the day is still owed only means something for food you
     have NOT put on the day yet.
   *
     A plate you already ate is counted IN that gap — mDayEaten walks the
     whole day — so painting it against the remainder is circular: the plate
     turns warm for busting a gap it is itself the reason for. Same for a row
     sitting in the basket, which is counted before it is committed. Those
     rows state what they are; only candidates are judged. */
  function mMacLine(r, x, vsGap) {
    var mac = r.macro || {};
    var cell = function (m, lbl) {
      var v = Math.round((mac[m] || 0) * x);
      return '<span class="mgc' + (vsGap ? mAgainstGap(m, (mac[m] || 0) * x) : '') + '">' + v +
        '<i class="mb-' + m + '">' + lbl + '</i></span>';
    };
    /* No tilde. Two thirds of the book's recipes are estimated from the
       food table rather than a label, so the mark was on most rows most of
       the time — and a hedge that is always on is not a hedge, it is noise
       taking up the width the numbers needed. The figures earn trust by
       being right, not by apologising. (`est` is still on the record; only
       the apology is gone.) */
    return Math.round((mac.kcal || 0) * x) + ' kcal · ' +
      cell('p', 'P') + ' · ' + cell('f', 'F') + ' · ' + cell('c', 'C');
  }

  /* The one mark nothing else on the list can earn: this portion of this
     dish leaves every macro inside the band at once.
   *
     Rare on purpose. Judged only when there is a real gap to close — with a
     gram of protein and no fat left, almost anything lands all three, and a
     badge on twelve rows is the same as a badge on none. It also has to do
     some of the work rather than merely not disturb it. */
  function mClosesIt(r, x) {
    var g = mGapLeft();
    if (g.none) return false;
    var owed = g.p + g.f + g.c;
    if (owed < 25) return false;
    var mac = r.macro || {}, did = 0, ok = true;
    ['p', 'f', 'c'].forEach(function (m) {
      var got = (mac[m] || 0) * x;
      did += got;
      if (Math.abs(g[m] - got) >= 8) ok = false;
    });
    return ok && did >= owed * 0.5;
  }

  return { macroFit: macroFit, mSaltChip: mSaltChip, mSaltNote: mSaltNote, mSaltFibre: mSaltFibre, mRank: mRank, mGapFresh: mGapFresh, mMacLine: mMacLine, mClosesIt: mClosesIt, MW: MW, MX: MX, MFOOD_G_MAX: MFOOD_G_MAX };
};
