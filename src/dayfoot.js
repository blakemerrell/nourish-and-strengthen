/* The foot of My Day: the one way into the plan sheet (mOpenTargets), and
 * the readout under the day, the bars that fold away and the pills they
 * fold into, built together because they are the same six numbers, with
 * the one sentence that says where the day stands (macroFootHTML). The
 * longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.dayfoot(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).dayfoot = function (app) {
  'use strict';

  // what it reads of the app's
  var MPILL_TONE = app.MPILL_TONE;
  var MWEIGHTS = app.MWEIGHTS;
  var S = app.S;
  var dayKey = app.dayKey;
  var kcalOf = app.kcalOf;
  var keyDate = app.keyDate;
  var mAmOf = app.mAmOf;
  var mAssumed = app.mAssumed;
  var mBurn = app.mBurn;
  var mDayDone = app.mDayDone;
  var mDayJudged = app.mDayJudged;
  var mFibreIconStyle = app.mFibreIconStyle;
  var mFillPill = app.mFillPill;
  var mGymIconStyle = app.mGymIconStyle;
  var mIsTrainingDay = app.mIsTrainingDay;
  var mPillDotsSVG = app.mPillDotsSVG;
  var mReadProfile = app.mReadProfile;
  var mSaltIconStyle = app.mSaltIconStyle;
  var mSkipped = app.mSkipped;
  var mTotals = app.mTotals;
  var mTrainedAt = app.mTrainedAt;
  var mVerdict = app.mVerdict;
  var mViewKey = app.mViewKey;
  var mWShow = app.mWShow;
  var mWUnit = app.mWUnit;
  var mWaterGoalOz = app.mWaterGoalOz;
  var mWaterOz = app.mWaterOz;
  var pushSheet = app.pushSheet;
  var rememberOpener = app.rememberOpener;
  var renderModal = app.renderModal;
  var todayKey = app.todayKey;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* The one way into the plan sheet. It was written inline in the weigh-in
     card's click handler, which was the only door there was; the bottom bar's
     button is a second, and a second copy of six lines is how two doors start
     opening onto slightly different rooms. */
  function mOpenTargets() {
    rememberOpener();
    S.macroTargOpen = true;
    pushSheet({ m: 1 });
    renderModal();
    var tf = $('mtGoalLb') || $('mtP');
    if (tf) tf.focus();
  }

  function mPillTrayHTML(k, day, targets, slots, tot, tK, fib, fibFloor, na, naCap, waterOz, goalOz) {
    var train = mIsTrainingDay ? mIsTrainingDay(k) : false;
    var trained = mTrainedAt ? mTrainedAt(k) > 0 : false;
    var bigDots = mPillDotsSVG ? mPillDotsSVG(80, 170, 44, 5, targets, tot.all) : '';
    var fibStyle = mFibreIconStyle ? mFibreIconStyle(fib, fibFloor) : '';
    var saltStyle = mSaltIconStyle ? mSaltIconStyle(na, naCap) : '';
    var gymStyle = mGymIconStyle ? mGymIconStyle(train, trained) : '';
    var vK = tot.all.kcal > 0 && tK > 0 ? mVerdict('kcal', tot.all.kcal, tK) : '';
    var fillPct = tK > 0 ? Math.min(100, Math.round(tot.all.kcal / tK * 100)) : 0;
    var fillBg = vK === 'over'
      ? 'background:linear-gradient(var(--pill-fire) 0 14%, var(--pill-fill) 14% 100%);'
      : 'background:var(--pill-fill);';

    var pr = mReadProfile ? mReadProfile() : {};
    var burnObj = mBurn ? mBurn(pr) : null;
    var estBurn = burnObj && burnObj.tdee ? Math.round(burnObj.tdee) : Math.round(tK || 2000);
    var done = mDayDone ? mDayDone(day) : false;
    var judged = mDayJudged ? mDayJudged(k) : done;
    var eatenKcal = Math.round(done ? tot.all.kcal : tot.eaten.kcal);
    var netKcal = eatenKcal - estBurn;
    var netStr = (netKcal > 0 ? '+' : netKcal < 0 ? '\u2212' : '') + Math.abs(netKcal).toLocaleString();

    var actPK = Math.max(0, (tot.all.p || 0) * 4);
    var actFK = Math.max(0, (tot.all.f || 0) * 9);
    var actCK = Math.max(0, (tot.all.c || 0) * 4);
    var actSumK = actPK + actFK + actCK;
    var pPct = actSumK > 0 ? Math.round(actPK / actSumK * 100) : 0;
    var fPct = actSumK > 0 ? Math.round(actFK / actSumK * 100) : 0;
    var cPct = actSumK > 0 ? Math.max(0, 100 - pPct - fPct) : 0;

    var tgtPK = Math.max(1, (targets.p || 0) * 4);
    var tgtFK = Math.max(1, (targets.f || 0) * 9);
    var tgtCK = Math.max(1, (targets.c || 0) * 4);
    var vP = mVerdict('p', tot.all.p, Math.max(1, targets.p));
    var vF = mVerdict('f', tot.all.f, Math.max(1, targets.f));
    var vC = mVerdict('c', tot.all.c, Math.max(1, targets.c));

    var floorTile = function (name, v, goal, unit) {
      var g = Math.max(1, goal);
      var p = v / g;
      var met = p >= 1;
      var tag = met ? 'met' : Math.round(g - v).toLocaleString() + ' short';
      var col = met ? 'var(--pill-p)' : 'var(--muted)';
      var w = Math.min(100, Math.round(p * 100));
      var op = (0.35 + 0.65 * Math.min(1, p)).toFixed(2);
      return '<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">' + esc(name) + '</span><span class="mpt-tt" style="color:' + col + '">' + esc(tag) + '</span></div>' +
        '<div class="mpt-tv num"><b>' + Math.round(v).toLocaleString() + '</b> / ' + Math.round(g).toLocaleString() + ' ' + esc(unit) + '</div>' +
        '<div class="mpt-tb"><i style="width:' + w + '%;background:var(--pill-p);opacity:' + op + '"></i></div>' +
      '</div>';
    };
    var ceilTile = function (name, v, cap, unit) {
      var c = Math.max(1, cap);
      var p = v / c;
      var col = p > 1 ? 'var(--pill-fire)' : p >= 0.8 ? 'var(--pill-amber)' : 'var(--muted)';
      var tag = p > 1 ? 'over' : p >= 0.8 ? 'near limit' : 'ok';
      var w = Math.min(100, Math.round(p * 100));
      return '<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">' + esc(name) + '</span><span class="mpt-tt" style="color:' + col + '">' + esc(tag) + '</span></div>' +
        '<div class="mpt-tv num"><b>' + Math.round(v).toLocaleString() + '</b> / ' + Math.round(c).toLocaleString() + ' ' + esc(unit) + '</div>' +
        '<div class="mpt-tb"><i style="width:' + w + '%;background:' + col + '"></i></div>' +
      '</div>';
    };

    var fuelHTML =
      floorTile('Protein', tot.all.p || 0, targets.p || 1, 'g') +
      floorTile('Fibre', fib, fibFloor || 20, 'g') +
      ceilTile('Sodium', na, naCap, 'mg') +
      floorTile('Water', waterOz, goalOz || 80, 'oz');

    // Meals breakdown: where the calories came from
    var mealRowsData = [];
    var maxMealK = 1;
    (slots && slots.list ? slots.list : []).forEach(function (s) {
      var sk = s.k;
      var items = day[sk] || [];
      var skipped = !items.length && mSkipped && mSkipped(k, sk);
      var subOne = {}; subOne[sk] = items;
      var subTot = items.length ? mTotals(subOne).all : { kcal: 0, p: 0, f: 0, c: 0 };
      var mK = Math.round(subTot.kcal);
      if (mK > maxMealK) maxMealK = mK;
      mealRowsData.push({
        name: s.n || 'Meal',
        kcal: mK,
        skipped: skipped,
        pK: Math.max(0, subTot.p * 4),
        fK: Math.max(0, subTot.f * 9),
        cK: Math.max(0, subTot.c * 4)
      });
    });

    var mealsSection = '<div class="mpt-sec">' +
      '<div class="mpt-sh">MEALS &middot; WHERE THE CALORIES CAME FROM</div>' +
      '<div class="mpt-meals">' +
        mealRowsData.map(function (m) {
          var wPct = m.kcal > 0 ? Math.max(6, Math.round(m.kcal / maxMealK * 100)) : 0;
          var sumM = m.pK + m.fK + m.cK || 1;
          return '<div class="mpt-mrow' + (m.skipped ? ' is-skip' : '') + '">' +
            '<span class="mpt-mn">' + esc(m.name) + '</span>' +
            '<span class="mpt-mbar-w">' +
              (m.kcal > 0
                ? '<span class="mpt-mbar" style="width:' + wPct + '%">' +
                    '<i style="flex:' + (m.pK / sumM).toFixed(3) + ';background:var(--pill-p)"></i>' +
                    '<i style="flex:' + (m.fK / sumM).toFixed(3) + ';background:var(--pill-f)"></i>' +
                    '<i style="flex:' + (m.cK / sumM).toFixed(3) + ';background:var(--pill-c)"></i>' +
                  '</span>'
                : '<span class="mpt-mbar-empty">' + (m.skipped ? 'skipped' : 'empty') + '</span>') +
            '</span>' +
            '<span class="mpt-mk num">' + (m.skipped ? '&mdash;' : m.kcal) + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    // Move & Recover from real Health Connect / Check-in data only
    var tk = todayKey ? todayKey() : k;
    var daySteps = 0;
    if (k === tk && window.Health && window.Health.todaySteps) {
      daySteps = Number(window.Health.todaySteps()) || 0;
    }
    if (!daySteps && mAmOf && keyDate && dayKey) {
      var nx = keyDate(k);
      nx.setDate(nx.getDate() + 1);
      var nk = dayKey(nx);
      var nextAm = mAmOf(nk);
      if (nextAm && nextAm.sy > 0) daySteps = Number(nextAm.sy) || 0;
    }
    var stepGoal = Number(pr && pr.steps) > 0 ? Number(pr.steps) : 10000;
    var am = mAmOf ? mAmOf(k) : {};
    var sleepHrs = am && am.sl > 0 ? Number(am.sl) : 0;
    var dayW = MWEIGHTS && MWEIGHTS[k] > 0 ? MWEIGHTS[k] : 0;
    var moveTiles = [];
    if (daySteps > 0) {
      moveTiles.push('<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">Steps</span><span class="mpt-tt">' + Math.round(daySteps / stepGoal * 100) + '%</span></div>' +
        '<div class="mpt-tv num"><b>' + daySteps.toLocaleString() + '</b> / ' + stepGoal.toLocaleString() + '</div>' +
      '</div>');
    }
    if (train || trained) {
      moveTiles.push('<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">Workout</span><span class="mpt-tt" style="color:' + (trained ? 'var(--pill-p)' : 'var(--muted)') + '">' + (trained ? 'logged' : 'planned') + '</span></div>' +
        '<div class="mpt-tv"><b>' + (trained ? 'Strength &check;' : 'Lifting day') + '</b></div>' +
      '</div>');
    }
    if (sleepHrs > 0) {
      var sH = Math.floor(sleepHrs);
      var sM = Math.round((sleepHrs - sH) * 60);
      moveTiles.push('<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">Sleep</span></div>' +
        '<div class="mpt-tv num"><b>' + sH + 'h' + (sM ? ' ' + sM + 'm' : '') + '</b></div>' +
      '</div>');
    }
    if (dayW > 0 && mWShow && mWUnit) {
      moveTiles.push('<div class="mpt-tile">' +
        '<div class="mpt-th"><span class="mpt-tn">Weight</span></div>' +
        '<div class="mpt-tv num"><b>' + esc(mWShow(dayW)) + ' ' + esc(mWUnit()) + '</b></div>' +
      '</div>');
    }
    var moveSection = moveTiles.length
      ? '<div class="mpt-sec">' +
          '<div class="mpt-sh">MOVE &amp; RECOVER</div>' +
          '<div class="mpt-grid">' + moveTiles.join('') + '</div>' +
        '</div>'
      : '';

    return '<div class="mpill-tray" id="macroPillTray" role="region" aria-label="Selected day detail">' +
      '<div class="mpt-hero">' +
        '<div class="mpt-bigpill" aria-hidden="true">' +
          bigDots +
          '<div class="mpt-bigwell"><div class="mpt-bigfill" style="height:' + fillPct + '%;' + fillBg + '"></div></div>' +
          '<div class="mpt-bigicos">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="' + fibStyle + '"><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19l8-8"/></svg>' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="' + saltStyle + '"><path d="M8 10h8l-1 10H9z"/><path d="M8 10c0-3 2-6 4-6s4 3 4 6"/><path d="M11 7h.01M13 7h.01"/></svg>' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="' + gymStyle + '"><path d="M3 12h18M6 8v8M18 8v8M3 10v4M21 10v4"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="mpt-bal">' +
          '<div class="mpt-sh">ENERGY BALANCE</div>' +
          '<div class="mpt-bal3">' +
            '<div><div class="mpt-bv num">' + eatenKcal.toLocaleString() + '</div><div class="mpt-bl">eaten</div></div>' +
            '<div><div class="mpt-bv num">' + estBurn.toLocaleString() + '</div><div class="mpt-bl">burned &middot; est.</div></div>' +
            '<div><div class="mpt-bv num" style="color:' + (netKcal <= 0 ? 'var(--pill-p)' : 'var(--pill-fire)') + '">&approx; ' + netStr + '</div><div class="mpt-bl">' + (judged ? 'net' : 'net so far') + '</div></div>' +
          '</div>' +
          '<div class="mpt-bl">Macro split &middot; actual vs target</div>' +
          '<div class="mpt-split-act">' +
            '<i style="flex:' + Math.max(1, actPK) + ';background:' + (vP === 'over' ? 'var(--pill-fire)' : 'var(--pill-p)') + '"></i>' +
            '<i style="flex:' + Math.max(1, actFK) + ';background:' + (vF === 'over' ? 'var(--pill-fire)' : 'var(--pill-f)') + '"></i>' +
            '<i style="flex:' + Math.max(1, actCK) + ';background:' + (vC === 'over' ? 'var(--pill-fire)' : 'var(--pill-c)') + '"></i>' +
          '</div>' +
          '<div class="mpt-split-tgt">' +
            '<i style="flex:' + tgtPK + ';background:var(--pill-p)"></i>' +
            '<i style="flex:' + tgtFK + ';background:var(--pill-f)"></i>' +
            '<i style="flex:' + tgtCK + ';background:var(--pill-c)"></i>' +
          '</div>' +
          '<div class="mpt-split-leg num">' +
            '<span style="color:var(--pill-p)">P ' + pPct + '%' + (vP === 'over' ? ' &middot; over' : '') + '</span>' +
            '<span style="color:' + (vF === 'over' ? 'var(--pill-fire)' : 'var(--pill-f)') + '">F ' + fPct + '%' + (vF === 'over' ? ' &middot; over' : '') + '</span>' +
            '<span style="color:' + (vC === 'over' ? 'var(--pill-fire)' : 'var(--pill-c)') + '">C ' + cPct + '%' + (vC === 'over' ? ' &middot; over' : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mpt-sec">' +
        '<div class="mpt-sh">FUEL DETAIL</div>' +
        '<div class="mpt-grid">' + fuelHTML + '</div>' +
      '</div>' +
      mealsSection +
      moveSection +
    '</div>';
  }

  /* Two pieces of the same readout, because they live in two boxes: the bars
     are inside the part of the card that folds away, and the pills are what
     it folds into, outside it. They are built together because they are the
     same six numbers and neither is worth computing twice. */
  function macroFootHTML(day, targets, slots) {
    /* The one sentence this tab never had.
     *
       Driven cold, every other tab in the app explains itself when it is
       empty — Plan says what a week is for, List says where its lines come
       from, Pantry says what the storehouse carries. My Day said "Craft your
       plan." here and "No plan yet. [Craft my plan]" a hundred pixels below,
       which is the same instruction twice and an explanation none. It is also
       the tab with the steepest ideas in it.
     *
       So: what this is, and what happens first. The second prompt goes — the
       card below carries the button, and the bottom bar's own button is now
       the third and loudest way in. */
    if (!targets.p && !targets.f && !targets.c) {
      /* `limits` spelled out rather than left off: the caller assigns it to
         innerHTML, and a missing key there writes the word "undefined"
         across the card. */
      return { head: '', foot: '<div class="macro-none">' +
        '<b>This is your day.</b> Set a goal — lose, hold or gain — and Nourish ' +
        'works out what to eat, drafts a day from the recipes you like, and ' +
        'keeps count as you tick things off.</div>', limits: '', pills: '' };
    }
    var tot = mTotals(day);
    var asm = mAssumed(day, targets, slots);

    /* Four bars, not three dials and a bar underneath. Calories are the
       fourth line of the same budget, and reading them off a different shape
       in a different place made the day two readouts instead of one.
     *
     * Colour says WHERE YOU STAND and shade says HOW MUCH IS ALREADY EATEN:
     *
     *   solid    eaten
     *   pale     planned, not yet eaten
     *   hatched  assumed, because that meal is still empty
     *   grey     nothing has claimed it
     *
     * ochre under target, green landed in the band, red past it. Protein's
     * band runs to 110% because protein is the one macro a cut wants you to
     * overshoot; fat and carbs turn at the line, and calories get two per
     * cent of rounding grace. The fit scorer has always judged them that way
     * and the readout must not contradict the thing filling the day. */
    /* Calories get the flame, not a fourth letter: P, F and C are the three
       things food is made of and the flame is what the three add up to. The
       row names itself "Calories" in words to a reader either way.
     *
       And calories are not the fourth of four equal lines. They are the
       headline \u2014 the one figure the day is steered by, and the sum the other
       three are components of. Four identical bars said the opposite: that
       protein and the whole day's energy are the same rank of fact. So the
       flame takes the top of the card at display size with a bar the full
       width of it, and P, F and C sit under it as three columns of one
       height. Same four numbers, in the shape of what they are. */
    var ROWS = [['kcal', '\uD83D\uDD25', 'Calories', ''], ['p', 'P', 'Protein', ' g'],
      ['f', 'F', 'Fat', ' g'], ['c', 'C', 'Carbs', ' g']];
    var tK = kcalOf(targets);
    /* What is left of each, signed: under is negative, over is positive. It
       is the one figure that adds the assumption in \u2014 an empty meal counted
       at its share \u2014 because "how far off will the day land" is the question
       it answers, where the bar's own number answers "what is on it". */
    var left = {};
    ROWS.forEach(function (row) {
      var m = row[0];
      var target = m === 'kcal' ? tK : targets[m];
      left[m] = Math.round((m === 'kcal' ? tot.all.kcal : tot.all[m]) + asm[m] - target);
    });
    function signed(v) { return (v > 0 ? '+' : '') + v; }
    function sign(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'nil'; }
    /* Each row's verdict and how full it is, kept as the bars are built so the
       folded pills can wear the same two. Folding the card must not change
       what the day is said to be — the pills are the same reading, a line
       high, not a second opinion. */
    var barState = {}, barPct = {};
    var barHTML = {};
    ROWS.forEach(function (row) {
      var m = row[0];
      var target = Math.max(1, m === 'kcal' ? tK : targets[m]);
      var ate = m === 'kcal' ? tot.eaten.kcal : tot.eaten[m];
      var plan = m === 'kcal' ? tot.all.kcal : tot.all[m];
      /* The number is what is ACTUALLY on the day; the hatched band beside it
         is what an empty meal is assumed to become. Adding the assumption
         into the figure made "how much have I got" unanswerable — you could
         not tell food from expectation. The delta below is where the two are
         added up, because that is the question it answers. */
      var full = Math.round(plan);
      /* And the colour follows that same number, not the assumption. A bar
         reading 0 / 180 has no business being green because four empty meals
         are expected to cover it — the state must describe the bar you are
         looking at. The assumption is the delta's job, and only the delta's. */
      var pct = 100 * plan / target;
      /* A band, not a line. The old rule turned red the moment a macro
         crossed its target by anything at all — two grams of fat on a
         sixty-one gram target drew the same alarm as being a quarter over on
         carbohydrate, which is not what either of those days is. Ten grams
         either side of a macro counts as landing on it; calories get
         MKCAL_OVER's six and a half per cent (it was three here once, and
         two before that), because ten calories is a rounding error rather
         than a tolerance.
       *
         Protein keeps its wider ceiling on top of that: it is the one macro
         a cut wants you to overshoot, so it holds on target to 110%. */
      /* Off the same constant as the verdict below it, or it quietly puts back
         the bug it is sitting above: at 3% a day at 102.5% of target counted as
         near and so drew green, while the strip — over at 2% — had already
         called it over. One threshold has to mean one threshold. */
      /* The rule lives in mVerdict now, where the summary sheet reads it too.
         It was written out here once and three other ways elsewhere, and a
         day at 105.5% was on the bar, "close" on the strip, and a red ring
         on the sheet — one question, three answers. */
      var state = mVerdict(m, plan, target);
      barState[m] = state;
      barPct[m] = Math.min(100, pct);
      var wAte = Math.min(100, 100 * ate / target);
      var wPlan = Math.min(100 - wAte, 100 * (plan - ate) / target);
      var num = '<span class="mb-num"><b>' + (m === 'kcal' ? full.toLocaleString() : full) +
        '</b> / ' + (m === 'kcal' ? tK.toLocaleString() + ' kcal' : targets[m] + esc(row[3])) +
        '</span>';
      /* The figures go INSIDE the bar, and the fill is the whole pill.
       *
         Blake's layout. The bar used to be a stripe under a caption, which
         gave the fill whatever width the numbers beside it did not want; as
         the pill it gets the entire card and reads as a quantity rather than
         as decoration under a line of text.
       *
         The words are drawn TWICE — once in ink and once in paper, the paper
         copy clipped at exactly the eaten edge — which is the only way a
         figure sitting on a partial fill stays legible at both ends. Clipped
         at `wAte` rather than at the end of the whole fill, because the
         planned band and the assumed hatching are both pale and ink is what
         reads on those.
       *
         Two bands, not three. Solid is eaten, pale is planned — food and
         intention, which are both things you have actually put on the day.
         The third used to hatch in what an EMPTY meal is assumed to become,
         and Blake, on the new pills: "I don't need the hash lines when
         blank. Just blank is fine." He is right that it was loud: on a
         morning it covered most of four bars, and it is the one band you
         cannot act on — there is nothing on that meal to nudge.
       *
         The assumption itself has not gone anywhere. It still lands in the
         delta, which is what the pills at the top of the day print, so an
         untouched day still says +316 rather than 600 short. See the note on
         `left` above: that figure is what the DAY will come to, and this bar
         is what is on it. */
      var words = '<span class="mb-k mb-' + m + '" aria-hidden="true">' + row[1] + '</span>' + num;
      var track = '<span class="mb-track" style="--f:' + wAte.toFixed(1) + '%">' +
          '<i class="mb-ate" style="width:' + wAte.toFixed(1) + '%"></i>' +
          '<i class="mb-plan" style="width:' + wPlan.toFixed(1) + '%"></i>' +
          '<span class="mb-w">' + words + '</span>' +
          '<span class="mb-w mb-on" aria-hidden="true">' + words + '</span>' +
        '</span>';
      /* What is left of the line, signed. It used to be printed beside every
         bar; three columns have no room for a third figure at a width a
         phone actually is, and the pills carry the same number visibly a
         line higher. So it stays in the markup, spoken rather than printed —
         which is also what keeps a reader who cannot see the fill told how
         far off the day is. */
      /* Said the way it reads: "495 to go", "+36 over". The minus stayed in
         the "to go" branch, so a screen reader heard "-495 to go". The signed
         figure rides along as data-d for anything that wants the arithmetic. */
      var delta = '<span class="mb-d ' + sign(left[m]) + ' vis-hidden" data-d="' + left[m] + '"><b>' +
        (left[m] > 0 ? signed(left[m]) : Math.abs(left[m])) + '</b>' + (left[m] > 0 ? ' over' : ' to go') + '</span>';
      var open = '<div class="' + (m === 'kcal' ? 'mhead' : 'mbrow') + ' ' + state +
        '" data-macro="' + m + '" data-state="' + state +
        '" data-eaten="' + Math.round(wAte) + '" data-planned="' +
        Math.round(Math.min(100, 100 * plan / target)) + '">';
      /* One shape for all four now: the pill IS the row. The headline is the
         same pill at display size, which is what keeps calories the headline
         without making them a different kind of object. */
      /* Calories as a ring, the macros stacked beside it. Blake, choosing A
         from the mockup: "I like the macro pills the way they are right now.
         Just stack them on the side of the ring." The ring fills to the
         target in the same two bands the pill had — eaten solid, planned
         pale — and what goes past the target runs on as a thin second lap
         through the middle of the band, ending in a dot, so a day over is
         still read as a full ring plus how far past it went. */
      if (m === 'kcal') {
        var R = 50, CIRC = 2 * Math.PI * R;
        var over = Math.max(0, Math.min(1, plan / target - 1));
        var arcOf = function (cls, from, len, w) {
          /* Always drawn, empty or not: the two bands are the ring's parts,
             and an empty day is a ring with nothing on it yet. */
          return '<circle class="' + cls + '" cx="58" cy="58" r="' + R + '" fill="none" stroke-width="' + w +
            '" stroke-dasharray="' + (len * CIRC / 100).toFixed(1) + ' ' + CIRC.toFixed(1) +
            '" stroke-dashoffset="' + (-from * CIRC / 100).toFixed(1) + '" transform="rotate(-90 58 58)"/>';
        };
        var endA = over * 2 * Math.PI;
        var ring = '<svg class="mring" viewBox="0 0 116 116" aria-hidden="true">' +
          '<circle class="mring-track" cx="58" cy="58" r="' + R + '" fill="none" stroke-width="11"/>' +
          arcOf('mb-ate', 0, wAte, 11) + arcOf('mb-plan', wAte, wPlan, 11) +
          (over > 0 ? arcOf('mring-over', 0, over * 100, 3.5) +
            '<circle class="mring-dot" cx="' + (58 + R * Math.sin(endA)).toFixed(1) + '" cy="' +
            (58 - R * Math.cos(endA)).toFixed(1) + '" r="4"/>' : '') +
          '</svg>';
        /* Just the figure and its target in the middle — no "left" or
           "over". Worked out from what is on the day, it disagreed with the
           folded pill, which counts an empty meal at its share: "969 left"
           over a pill saying 0 (review, 2026-09-28). The ring's arc and its
           second lap already say which side of the target the day is. */
        barHTML[m] = open + ring + '<span class="mring-c">' + num + '</span>' +
          '<span class="vis-hidden">' + row[2] + '</span>' + delta + '</div>';
        return;
      }
      barHTML[m] = open + track +
        '<span class="vis-hidden">' + row[2] + '</span>' + delta + '</div>';
    });
    var bars = '<div class="mdash">' + barHTML.kcal + '<div class="mbars3">' +
      barHTML.p + barHTML.f + barHTML.c + '</div></div>';

    /* A floor and a ceiling, not two more budgets — which is why they are a
       line rather than two more bars. Fibre is what makes a cut survivable
       and we come up short on it most days; sodium is half again over the
       guideline on a day this app fills, and it is also what moves the scale
       overnight without moving any fat. */
    var naCap = 2300;
    var fibFloor = Math.round(tK * 14 / 1000);          // 14 g per 1000 kcal
    var na = Math.round(tot.all.na), fib = Math.round(tot.all.fib);
    /* Fibre NEVER turns red. Over a floor is still good \u2014 there is no such
       thing as too much fibre on a cut \u2014 so the only two states are short
       and met.
     *
       Salt NEVER turns green. Staying under a ceiling is the default, not an
       achievement, so it is quiet until it is within a fifth of the cap,
       then it warns, then it is over. Green there would congratulate you for
       having eaten nothing in particular. */
    var fibState = fib >= fibFloor ? 'met' : 'short';
    var naState = na > naCap ? 'past' : na >= naCap * 0.8 ? 'near' : 'quiet';
    /* And that is the whole argument for why these two are not a row of the
       readout any more.
     *
       They were a pair of bars under the macros, which put five things in a
       column and invited you to read them as five budgets to fill. Salt is
       not a budget. Filling the protein bar is the day going right and
       filling the salt bar is the day going wrong, and drawing both the same
       way, always, in the same stack, is the readout arguing with itself.
     *
       So they are silent. Nothing is drawn while fibre clears its floor and
       salt is nowhere near its ceiling, which is most days and is exactly
       when there is nothing to do about either. When one goes off, one line
       appears and says which and by how much.
     *
       This is the rule the app already keeps a level down: a plate has no
       "on" chip, and the absence of one is what makes a chip mean something.
       A warning that is always on the screen is not a warning, it is
       furniture. */
    var limitLine = function (state, glyph, text, name) {
      return '<div class="mlim ' + state + '" data-lim="' + name + '">' +
        '<span class="mlim-g" aria-hidden="true">' + glyph + '</span>' +
        '<span class="mlim-t">' + text + '</span></div>';
    };
    var micro = '';
    /* A ceiling can be busted at lunch; a floor can only be missed at the
       end. So the two do not warn on the same schedule.
     *
       An empty day is short of fibre by the whole floor, and saying so is
       the most useless sentence this card could carry \u2014 of course it is, you
       have not eaten yet, and the rest of the day is precisely what fixes
       it. A day still carrying an empty meal is the same story less far
       along. So fibre holds its tongue until nothing is being assumed any
       more: every meal has something in it, the day is built, and a
       shortfall is now a finding rather than an unfinished sentence.
     *
       Salt has no such patience. Two thousand milligrams by lunch is worth
       knowing at lunch, while there are still meals left to choose. */
    if (fibState === 'short' && !asm.kcal) {
      micro += limitLine('short', '\uD83C\uDF3E', '<b>' + fib + ' g</b> fibre &middot; ' +
        (fibFloor - fib) + ' short of the floor', 'fib');
    }
    if (naState !== 'quiet') {
      micro += limitLine(naState, '\uD83E\uDDC2', '<b>' + na.toLocaleString() + ' mg</b> salt &middot; ' +
        (naState === 'past' ? 'over' : 'nearing') + ' the ' + naCap.toLocaleString() +
        ' ceiling', 'na');
    }

    /* The same six numbers folded into one row of pills, for when the page
       has scrolled and the bars would be eating the screen. Four signed
       deltas, then fibre and sodium against their floor and ceiling.
       Pressing the row scrolls back up to the bars it stands in for. */
    /* Each pill IS its own bar. Folded, the row used to give the gap and never
       the proportion — minus twenty-four reads the same whether you are five
       per cent off or half a day off, and four pills all reading "under" in
       the same grey say nothing about which one still has a third of the day
       in it.
     *
       There is no room to draw a bar beside the number: six of these only
       just fit a 375-wide phone. But a pill is already a rounded box with a
       background, so it does not need one drawn inside it — it fills left to
       right instead, and costs nothing. The fill is the PALE tone the open
       bars use for planned-not-eaten, because a solid one would win the
       contrast fight against the number sitting on it; and it stops at full,
       so over target fills the pill and lets the figure carry the overshoot,
       which is the rule the bars already follow.
     *
       Verdict and fill both come from the row above, so folding the card
       cannot change what the day is said to be.
     *
       And the denominators go. The fill says the proportion now, so "/2300"
       says it a second time — and dropping it is what buys every pill the
       same width, which is the point: six fills only compare by eye if the
       boxes match. The open bars keep both numbers. */
    var fillPill = function (cls, tone, pct, body) {
      return mFillPill('mpill ' + cls, tone, pct, body);
    };
    var TONE = MPILL_TONE;
    var pills = ROWS.map(function (row) {
      var m = row[0];
      return fillPill(sign(left[m]), TONE[barState[m]] || TONE.under, barPct[m] || 0,
        '<span class="mb-' + m + '">' + row[1] + '</span><b>' + signed(left[m]) + '</b>');
    }).join('') +
      fillPill('mpill-m ' + fibState, TONE[fibState], Math.min(100, 100 * fib / fibFloor),
        '🌾<b>' + fib + '</b>') +
      /* no thousands separator: the comma is four pixels, and four pixels is
         the difference between six pills fitting a 375-wide phone and a
         clipped sixth one, which reads as a bug */
      fillPill('mpill-m ' + naState, TONE[naState], Math.min(100, 100 * na / naCap),
        '🧂<b>' + na + '</b>');

    /* The bars are the door to their own history. Tapping the summary to see
       the detail costs no navigation and puts the two in the same place. */
    var vk = mViewKey ? mViewKey() : (todayKey ? todayKey() : '');
    var prHyd = mReadProfile ? mReadProfile() : {};
    var goalOz = mWaterGoalOz ? mWaterGoalOz(prHyd && prHyd.lb) : 80;
    var waterOz = mWaterOz ? mWaterOz(vk) : 0;
    var trayOpen = !!S.mPillTrayOpen;
    var trayHTML = trayOpen ? mPillTrayHTML(vk, day, targets, slots, tot, tK, fib, fibFloor, na, naCap, waterOz, goalOz) : '';
    var fullKcal = Math.round(tot.all.kcal);
    var headBar = '<div class="mpillwk-top">' +
      '<button type="button" class="mpillwk-hbtn" id="macroTrayHead" data-mpilltray="toggle" aria-expanded="' + (trayOpen ? 'true' : 'false') + '" aria-label="' + fullKcal.toLocaleString() + ' of ' + tK.toLocaleString() + ' calories, ' + waterOz + ' of ' + goalOz + ' oz water. ' + (trayOpen ? 'Collapse day detail' : 'Open day detail') + '">' +
        '<span class="mpillwk-k"><b class="serif num">' + fullKcal.toLocaleString() + '</b><span class="mpillwk-kt"> / ' + tK.toLocaleString() + ' kcal</span></span>' +
        '<span class="mpillwk-w num"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-3 4-6 7-6 11a6 6 0 0012 0c0-4-3-7-6-11z"/></svg>' + waterOz + ' / ' + goalOz + ' oz</span>' +
      '</button>' +
      '<button type="button" class="mbars mpillwk-chart" data-mchartopen="1" aria-label="See these over time">' +
        '<span class="mpillwk-clab">Trends &rsaquo;</span>' +
      '</button>' +
    '</div>';
    var footHint = '<button type="button" class="mpillwk-hint" id="macroTrayToggle" data-mpilltray="toggle" aria-expanded="' + (trayOpen ? 'true' : 'false') + '">' +
      (trayOpen ? 'Tap to collapse' : 'Tap for day\u2019s detail') +
    '</button>' +
    '<div class="mpillwk-a11y">' + bars + '</div>' +
    trayHTML;
    return {
      head: headBar,
      foot: footHint,
      /* Handed back separately, because the element it goes into is static
         markup in the page. A live region has to be on the page and watched
         BEFORE it gains content; building it here would mean a new region
         every redraw, and a screen reader announcing none of them. */
      limits: micro,
      pills: pills
    };
  }

  return { mOpenTargets: mOpenTargets, macroFootHTML: macroFootHTML };
};
