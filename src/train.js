/* ---------------------------------------------------------------------------
 * Train — a lifting block, the logger you carry into the gym, and what the
 * two add up to.
 *
 * Two apps' ideas in one tab, and a third thing neither of them does:
 *
 *   the block    Renaissance Periodization's mesocycle. A split built from
 *                the days you have and the kit you own; each muscle starting
 *                near the least volume that reliably grows it; sets moved
 *                week to week by how the last session actually felt; reps in
 *                reserve stepping from 3 down to 0; a deload to finish.
 *   the logger   Strong's. Set by set, last time's numbers beside this time's
 *                boxes, a rest timer that starts itself when you tick a set,
 *                plates worked out, a warm-up ramp, records as they fall.
 *   the review   What you did, held against what the research says — as a
 *                formula, not an opinion. Blake: "Review is simply review
 *                based on inputs and outputs compared to best science
 *                available. Should be pretty formulaic." It is, and every
 *                rule in it names the paper it came from.
 *
 * Personal, like My Day. Kept on this device, and carried by the account —
 * /users/{uid}, field `train` — once somebody is signed in, through the one
 * listener app.js already holds on that document. The household never sees
 * any of it.
 *
 * Loaded BEFORE app.js. app.js calls in through window.Train, and hands over
 * the things it owns — the back gesture, the confirm dialog, the day's
 * "trained" tick — through window.Hive, which it sets once it has booted.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  function hive() { return window.Hive || null; }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function plain(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function fin(v) { return typeof v === 'number' && isFinite(v); }
  function readLS(k) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  /* When the training log itself cannot be written, the phone's storage is
     full (or refused): said on screen rather than lost in silence. */
  /* The workout in progress counts too: a tick that cannot be written is a
     set that is gone if the app is closed, and it was going in silence. */
  var LSFULL = false, LSBAD = {};
  function writeLS(k, v) {
    var ok = true;
    try {
      if (v === null || v === undefined) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      /* private mode: this session only */
      ok = false;
    }
    if (k !== 'bsc.train' && k !== 'sh.trainLive' && k !== 'bsc.trainStamps') return ok;
    /* A workout saved while the log could not be written kept its live copy
       on the phone (saveWorkout); once the log is written, that copy is spent. */
    if (ok && k === 'bsc.train' && LSBAD[k] && !LIVE) { try { localStorage.removeItem('sh.trainLive'); } catch (e2) { /* as it was */ } }
    LSBAD[k] = !ok;
    LSFULL = !!(LSBAD['bsc.train'] || LSBAD['sh.trainLive'] || LSBAD['bsc.trainStamps']);
    return ok;
  }
  /* Firestore refuses a write carrying `undefined` anywhere in it, and takes
     the whole write down with it, while localStorage quietly drops the key —
     so a workout that saved perfectly here would never reach the other
     device. A JSON round trip is the cheapest way to be sure. */
  function clean(v) { return JSON.parse(JSON.stringify(v)); }
  function newId() {
    // letters and digits only: these become map keys in Firestore
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function dayKey(d) {
    // the local calendar, never toISOString(), which is UTC
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  var DAY_MS = 864e5;

  /* ------------------------------------------------------------ the muscles
   *
   * With Renaissance Periodization's volume landmarks: hard sets a week, for
   * somebody a few years in. MEV is the least that reliably grows the muscle;
   * MRV the most they expect you to recover from.
   *
   * These are RP's published starting estimates (Israetel, Hoffmann & Smith),
   * not measurements. They are practitioner numbers laid over the
   * dose-response research, and people land a long way either side of them.
   * So they are only where a block STARTS and the ceiling it stops climbing
   * at. Everything between is moved by what you report. A zero MEV means the
   * big compound lifts are thought to cover that muscle on their own. */
  var MUSCLES = [
    { k: 'chest', n: 'Chest', mev: 8, mrv: 22 },
    { k: 'back', n: 'Back', mev: 10, mrv: 25 },
    { k: 'quads', n: 'Quads', mev: 8, mrv: 20 },
    { k: 'hams', n: 'Hamstrings', mev: 6, mrv: 20 },
    { k: 'glutes', n: 'Glutes', mev: 0, mrv: 16 },
    { k: 'side', n: 'Side delts', mev: 8, mrv: 26 },
    { k: 'rear', n: 'Rear delts', mev: 6, mrv: 22 },
    { k: 'front', n: 'Front delts', mev: 0, mrv: 12 },
    { k: 'biceps', n: 'Biceps', mev: 8, mrv: 26 },
    { k: 'triceps', n: 'Triceps', mev: 6, mrv: 18 },
    { k: 'calves', n: 'Calves', mev: 8, mrv: 20 },
    { k: 'traps', n: 'Traps', mev: 0, mrv: 26 },
    { k: 'abs', n: 'Core', mev: 0, mrv: 25 }
  ];
  var MUS = {};
  MUSCLES.forEach(function (m) { MUS[m.k] = m; });

  /* ---------------------------------------------------------- the exercises
   *
   *   id, name, muscle, kind (c compound / i isolation), equipment, pattern,
   *   rep range low, high
   *
   * Equipment is bb barbell, db dumbbell, mc machine, cb cable, sm smith,
   * bw bodyweight. The pattern is what a split asks for when it wants a
   * particular KIND of chest press rather than any chest press, so that a
   * full-body day does not draw two flat presses.
   *
   * The rep ranges sit inside five to thirty, where load barely matters to
   * growth provided the set goes close to failure (Schoenfeld et al. 2017).
   * Library order is preference order within a muscle: the generator takes
   * the first that fits the kit, so a pulldown comes before a pull-up —
   * it loads in five-pound steps, and plenty of people cannot do five
   * pull-ups in week one.
   *
   * Heavy barbell work sits low in it, because a set of twenty back squats is
   * limited by breathing before the legs. Laterals, calves and the small
   * muscles sit high, because a set of six laterals is mostly momentum.
   *
   * Sets count toward the listed muscle only. That is the convention the
   * landmarks above were written in — a bench press is chest volume, and the
   * triceps' MEV already assumes it is being done. */
  var LIB_ROWS = [
    ['bb-bench', 'Barbell Bench Press', 'chest', 'c', 'bb', 'flat', 6, 10],
    ['db-bench', 'Dumbbell Bench Press', 'chest', 'c', 'db', 'flat', 8, 12],
    ['mc-press', 'Machine Chest Press', 'chest', 'c', 'mc', 'flat', 8, 12],
    ['bb-incline', 'Incline Barbell Press', 'chest', 'c', 'bb', 'incline', 6, 10],
    ['db-incline', 'Incline Dumbbell Press', 'chest', 'c', 'db', 'incline', 8, 12],
    ['sm-incline', 'Smith Machine Incline Press', 'chest', 'c', 'sm', 'incline', 8, 12],
    ['dip', 'Dip', 'chest', 'c', 'bw', 'dip', 6, 15],
    ['pushup-flat', 'Push-Up', 'chest', 'c', 'bw', 'flat', 8, 20],
    ['inc-pushup', 'Incline Push-Up', 'chest', 'c', 'bw', 'flat', 10, 20],
    ['pushup', 'Deficit Push-Up', 'chest', 'c', 'bw', 'flat', 10, 25],
    ['archer', 'Archer Push-Up', 'chest', 'c', 'bw', 'flat', 5, 12],
    ['cb-fly', 'Cable Fly', 'chest', 'i', 'cb', 'fly', 10, 15],
    ['pec-deck', 'Pec Deck', 'chest', 'i', 'mc', 'fly', 10, 15],
    ['db-fly', 'Dumbbell Fly', 'chest', 'i', 'db', 'fly', 10, 15],

    ['lat-pd', 'Lat Pulldown', 'back', 'c', 'cb', 'vert', 8, 12],
    ['pullup', 'Pull-Up', 'back', 'c', 'bw', 'vert', 5, 12],
    ['lat-pd-n', 'Close-Grip Pulldown', 'back', 'c', 'cb', 'vert', 8, 12],
    ['chinup', 'Chin-Up', 'back', 'c', 'bw', 'vert', 5, 12],
    ['pullup-neg', 'Negative Pull-Up', 'back', 'c', 'bw', 'vert', 5, 8],
    ['inv-row', 'Inverted Row', 'back', 'c', 'bw', 'horiz', 8, 15],
    ['bb-row', 'Barbell Row', 'back', 'c', 'bb', 'horiz', 6, 10],
    ['mc-row', 'Chest-Supported Machine Row', 'back', 'c', 'mc', 'horiz', 8, 12],
    ['cb-row', 'Seated Cable Row', 'back', 'c', 'cb', 'horiz', 8, 12],
    ['db-row', 'One-Arm Dumbbell Row', 'back', 'c', 'db', 'horiz', 8, 12],
    ['db-cs-row', 'Chest-Supported Dumbbell Row', 'back', 'c', 'db', 'horiz', 8, 12],
    ['db-pullover', 'Dumbbell Pullover', 'back', 'i', 'db', 'iso', 10, 15],
    ['cb-straight', 'Straight-Arm Pulldown', 'back', 'i', 'cb', 'iso', 10, 15],

    ['bb-squat', 'Back Squat', 'quads', 'c', 'bb', 'squat', 6, 10],
    ['hack', 'Hack Squat', 'quads', 'c', 'mc', 'squat', 8, 12],
    ['bb-front', 'Front Squat', 'quads', 'c', 'bb', 'squat', 6, 10],
    ['sm-squat', 'Smith Machine Squat', 'quads', 'c', 'sm', 'squat', 8, 12],
    ['leg-press', 'Leg Press', 'quads', 'c', 'mc', 'machine', 8, 15],
    ['belt-squat', 'Belt Squat', 'quads', 'c', 'mc', 'machine', 8, 12],
    ['db-bss', 'Bulgarian Split Squat', 'quads', 'c', 'db', 'single', 8, 12],
    ['goblet', 'Goblet Squat', 'quads', 'c', 'db', 'squat', 8, 15],
    ['db-lunge', 'Walking Lunge', 'quads', 'c', 'db', 'single', 8, 12],
    ['db-stepup', 'Dumbbell Step-Up', 'quads', 'c', 'db', 'single', 8, 12],
    ['bw-squat', 'Bodyweight Squat', 'quads', 'c', 'bw', 'squat', 15, 30],
    ['split-squat', 'Split Squat', 'quads', 'c', 'bw', 'single', 10, 20],
    ['bw-bss', 'Bulgarian Split Squat (bodyweight)', 'quads', 'c', 'bw', 'single', 8, 15],
    ['leg-ext', 'Leg Extension', 'quads', 'i', 'mc', 'ext', 10, 15],

    ['bb-rdl', 'Romanian Deadlift', 'hams', 'c', 'bb', 'hinge', 6, 10],
    ['db-rdl', 'Dumbbell Romanian Deadlift', 'hams', 'c', 'db', 'hinge', 8, 12],
    ['bb-sldl', 'Stiff-Legged Deadlift', 'hams', 'c', 'bb', 'hinge', 6, 10],
    ['bb-dl', 'Deadlift', 'hams', 'c', 'bb', 'hinge', 5, 8],
    ['good-am', 'Good Morning', 'hams', 'c', 'bb', 'hinge', 8, 12],
    ['lying-curl', 'Lying Leg Curl', 'hams', 'i', 'mc', 'curl', 10, 15],
    ['seated-curl', 'Seated Leg Curl', 'hams', 'i', 'mc', 'curl', 10, 15],
    ['slide-curl', 'Sliding Leg Curl (towel)', 'hams', 'i', 'bw', 'curl', 8, 15],
    ['nordic', 'Nordic Curl', 'hams', 'i', 'bw', 'curl', 5, 10],
    ['ball-curl', 'Stability-Ball Leg Curl', 'hams', 'i', 'bw', 'curl', 10, 20],
    ['sl-rdl', 'Single-Leg Romanian Deadlift', 'hams', 'c', 'bw', 'hinge', 8, 15],

    ['hip-thrust', 'Barbell Hip Thrust', 'glutes', 'c', 'bb', 'thrust', 8, 12],
    ['mc-thrust', 'Machine Hip Thrust', 'glutes', 'c', 'mc', 'thrust', 8, 12],
    ['db-thrust', 'Dumbbell Hip Thrust', 'glutes', 'c', 'db', 'thrust', 10, 15],
    ['back-ext', '45° Back Extension', 'glutes', 'i', 'bw', 'iso', 10, 20],
    ['abduct', 'Hip Abduction Machine', 'glutes', 'i', 'mc', 'iso', 12, 20],
    ['cb-kick', 'Cable Kickback', 'glutes', 'i', 'cb', 'iso', 12, 20],
    ['glute-bridge', 'Glute Bridge', 'glutes', 'c', 'bw', 'thrust', 12, 25],
    ['sl-bridge', 'Single-Leg Glute Bridge', 'glutes', 'c', 'bw', 'thrust', 10, 20],

    ['db-lat', 'Dumbbell Lateral Raise', 'side', 'i', 'db', 'raise', 12, 20],
    ['cb-lat', 'Cable Lateral Raise', 'side', 'i', 'cb', 'raise', 12, 20],
    ['mc-lat', 'Machine Lateral Raise', 'side', 'i', 'mc', 'raise', 12, 20],
    ['cb-upright', 'Cable Upright Row', 'side', 'i', 'cb', 'raise', 10, 15],

    ['rev-deck', 'Reverse Pec Deck', 'rear', 'i', 'mc', 'fly', 12, 20],
    ['face-pull', 'Face Pull', 'rear', 'i', 'cb', 'fly', 12, 20],
    ['db-rear', 'Bent-Over Rear Delt Fly', 'rear', 'i', 'db', 'fly', 12, 20],
    ['cb-rear', 'Cable Rear Delt Fly', 'rear', 'i', 'cb', 'fly', 12, 20],
    ['prone-y', 'Prone Y Raise', 'rear', 'i', 'bw', 'fly', 10, 20],

    ['bb-ohp', 'Overhead Press', 'front', 'c', 'bb', 'press', 6, 10],
    ['db-ohp', 'Seated Dumbbell Shoulder Press', 'front', 'c', 'db', 'press', 8, 12],
    ['mc-ohp', 'Machine Shoulder Press', 'front', 'c', 'mc', 'press', 8, 12],
    ['db-front', 'Dumbbell Front Raise', 'front', 'i', 'db', 'raise', 10, 15],
    ['pike-pushup', 'Pike Push-Up', 'front', 'c', 'bw', 'press', 6, 15],

    ['bb-curl', 'Barbell Curl', 'biceps', 'i', 'bb', '', 8, 12],
    ['ez-curl', 'EZ-Bar Curl', 'biceps', 'i', 'bb', '', 8, 12],
    ['db-curl', 'Dumbbell Curl', 'biceps', 'i', 'db', '', 10, 15],
    ['inc-curl', 'Incline Dumbbell Curl', 'biceps', 'i', 'db', '', 10, 15],
    ['hammer', 'Hammer Curl', 'biceps', 'i', 'db', '', 10, 15],
    ['cb-curl', 'Cable Curl', 'biceps', 'i', 'cb', '', 10, 15],
    ['preacher', 'Machine Preacher Curl', 'biceps', 'i', 'mc', '', 10, 15],

    ['pushdown', 'Cable Pushdown', 'triceps', 'i', 'cb', '', 10, 15],
    ['cb-oh-ext', 'Overhead Cable Extension', 'triceps', 'i', 'cb', '', 10, 15],
    ['skull', 'EZ-Bar Skull Crusher', 'triceps', 'i', 'bb', '', 8, 12],
    ['db-oh-ext', 'Overhead Dumbbell Extension', 'triceps', 'i', 'db', '', 10, 15],
    ['mc-tri', 'Machine Triceps Extension', 'triceps', 'i', 'mc', '', 10, 15],
    ['cgbp', 'Close-Grip Bench Press', 'triceps', 'c', 'bb', '', 6, 10],
    ['bench-dip', 'Bench Dip', 'triceps', 'c', 'bw', '', 10, 20],
    ['diamond', 'Diamond Push-Up', 'triceps', 'c', 'bw', '', 6, 15],

    ['calf-stand', 'Standing Calf Raise', 'calves', 'i', 'mc', '', 10, 20],
    ['calf-seat', 'Seated Calf Raise', 'calves', 'i', 'mc', '', 12, 20],
    ['calf-lp', 'Leg Press Calf Raise', 'calves', 'i', 'mc', '', 10, 20],
    ['calf-db', 'Single-Leg Dumbbell Calf Raise', 'calves', 'i', 'db', '', 10, 20],
    ['calf-bw', 'Single-Leg Calf Raise', 'calves', 'i', 'bw', '', 12, 25],

    ['db-shrug', 'Dumbbell Shrug', 'traps', 'i', 'db', '', 10, 15],
    ['bb-shrug', 'Barbell Shrug', 'traps', 'i', 'bb', '', 10, 15],
    ['cb-shrug', 'Cable Shrug', 'traps', 'i', 'cb', '', 12, 20],

    ['cb-crunch', 'Cable Crunch', 'abs', 'i', 'cb', '', 10, 20],
    ['hang-raise', 'Hanging Leg Raise', 'abs', 'i', 'bw', '', 8, 15],
    ['ab-wheel', 'Ab Wheel Rollout', 'abs', 'i', 'bw', '', 8, 15],
    ['mc-crunch', 'Machine Crunch', 'abs', 'i', 'mc', '', 10, 20],
    ['crunch', 'Crunch', 'abs', 'i', 'bw', '', 12, 25],
    ['pallof', 'Pallof Press', 'abs', 'i', 'cb', '', 10, 15],
    ['dead-bug', 'Dead Bug', 'abs', 'i', 'bw', '', 8, 12],
    ['bird-dog', 'Bird Dog', 'abs', 'i', 'bw', '', 8, 12],
    /* Added later, and never picked for a program on their own (NOPICK):
       there to add, swap to, or bring in from Strong. The weight on an
       assisted lift is the machine's help, not a load. */
    ['sumo-dl', 'Sumo Deadlift', 'hams', 'c', 'bb', 'hinge', 5, 8],
    ['trap-dl', 'Trap-Bar Deadlift', 'hams', 'c', 'bb', 'hinge', 5, 10],
    ['as-pullup', 'Assisted Pull-Up', 'back', 'c', 'mc', 'vert', 6, 12],
    ['as-dip', 'Assisted Dip', 'chest', 'c', 'mc', 'dip', 6, 12],
    ['seated-lp', 'Seated Leg Press', 'quads', 'c', 'mc', 'machine', 8, 15],
    ['mc-kick', 'Glute Kickback Machine', 'glutes', 'i', 'mc', 'iso', 12, 20],
    ['sm-thrust', 'Smith Machine Hip Thrust', 'glutes', 'c', 'sm', 'thrust', 8, 12]
  ];

  /* ------------------------------------------------------------ the back
   *
   * What each exercise asks of the lower back, in three ways a back can
   * object: F loaded bending (the spine rounding, or held rounded, under
   * weight — bent-over rows, the bottom of a deep squat, deadlifts, crunches),
   * C compression (weight pressing down through it — a bar on the shoulders,
   * shoulder pads, heavy dumbbells at your sides), X extension (arching under
   * load). A capital is a lot of it, a small letter some.
   *
   * With "protect my back" on, a capital in any of your triggers keeps that
   * exercise out of every block; a small letter lets it in but ranks it
   * below one that asks nothing, and puts a cue on it. Nothing is hidden
   * from the picker — you can still choose any of them; they say what they
   * load.
   *
   * These are judgements from the movement, not measurements of your spine.
   * What suits a particular back is for the physio who has examined it; the
   * avoid list is where their answer goes. */
  var BACK = {
    'bb-row': 'Fc', 'cb-row': 'f', 'db-row': 'f', 'db-pullover': 'x',
    'bb-squat': 'FC', 'bb-front': 'fC', 'sm-squat': 'fc', 'goblet': 'fc', 'hack': 'c',
    'leg-press': 'f', 'db-bss': 'c', 'db-lunge': 'c', 'db-stepup': 'c',
    'bb-rdl': 'F', 'db-rdl': 'F', 'bb-sldl': 'F', 'bb-dl': 'FC', 'sumo-dl': 'FC', 'trap-dl': 'fC', 'good-am': 'F',
    'hip-thrust': 'x', 'mc-thrust': 'x', 'db-thrust': 'x', 'sm-thrust': 'x', 'back-ext': 'Fx', 'mc-kick': 'x', 'seated-lp': 'f',
    'db-rear': 'f', 'bb-ohp': 'Cx', 'calf-stand': 'C',
    'db-shrug': 'c', 'bb-shrug': 'C', 'cb-shrug': 'c',
    'cb-crunch': 'F', 'hang-raise': 'F', 'mc-crunch': 'F', 'crunch': 'F', 'ab-wheel': 'X',
    'sl-rdl': 'F', 'bw-squat': '', 'split-squat': '', 'prone-y': 'x'
  };

  /* ------------------------------------------------------------ the joints
   *
   * The same idea as the back, for the rest of the body: which joints an
   * exercise works hard, in one letter each — N neck, S shoulder, E elbow,
   * W wrist, H hip, K knee, A ankle or foot. A capital is a lot, a small
   * letter some. Protect a joint and the capitals stay out of your blocks;
   * the small letters come with a cue.
   *
   * Judgements from how each movement loads each joint, and deliberately
   * conservative: overhead pressing for a shoulder, loaded wrist extension
   * for a wrist, deep loaded knee bends for a knee. They are not a diagnosis,
   * and one sore shoulder is not every sore shoulder — the never list is for
   * what yours says that these do not. Neck and foot are the thin ones: few
   * gym lifts load them much, so they mostly carry cues. */
  var JT = {
    'bb-bench': 'Sw', 'db-bench': 's', 'mc-press': 's', 'bb-incline': 'Sw', 'db-incline': 's', 'sm-incline': 's',
    'dip': 'SEw', 'as-dip': 'Sew', 'pushup-flat': 'sW', 'inc-pushup': 'w', 'pushup': 'sW', 'archer': 'SW',
    'cb-fly': 's', 'pec-deck': 's', 'db-fly': 'S',
    'lat-pd': 's', 'as-pullup': 's', 'pullup': 'se', 'lat-pd-n': 's', 'chinup': 'sew', 'pullup-neg': 'se', 'inv-row': 'w',
    'bb-row': 'w', 'db-pullover': 'S',
    'bb-squat': 'KhSwn', 'hack': 'K', 'bb-front': 'KW', 'sm-squat': 'K', 'leg-press': 'kh', 'seated-lp': 'kh', 'belt-squat': 'k',
    'db-bss': 'Kh', 'goblet': 'k', 'db-lunge': 'Ka', 'db-stepup': 'k', 'leg-ext': 'k',
    'bw-squat': 'k', 'split-squat': 'k', 'bw-bss': 'Kh',
    'bb-rdl': 'h', 'db-rdl': 'h', 'bb-sldl': 'h', 'bb-dl': 'hw', 'sumo-dl': 'hkw', 'trap-dl': 'hkw', 'good-am': 'hs', 'nordic': 'k', 'slide-curl': 'k', 'sl-rdl': 'ha',
    'hip-thrust': 'h', 'mc-thrust': 'h', 'db-thrust': 'h', 'sm-thrust': 'h', 'back-ext': 'h', 'abduct': 'h', 'cb-kick': 'h', 'mc-kick': 'h',
    'glute-bridge': '', 'sl-bridge': 'h',
    'db-lat': 's', 'cb-lat': 's', 'mc-lat': 's', 'cb-upright': 'SW',
    'bb-ohp': 'SWn', 'db-ohp': 'S', 'mc-ohp': 'S', 'db-front': 's', 'pike-pushup': 'SWn',
    'bb-curl': 'eW', 'ez-curl': 'e', 'db-curl': 'e', 'inc-curl': 'se', 'hammer': 'e', 'cb-curl': 'e', 'preacher': 'E',
    'pushdown': 'e', 'cb-oh-ext': 'sE', 'skull': 'E', 'db-oh-ext': 'sE', 'mc-tri': 'e', 'cgbp': 'ew',
    'bench-dip': 'SW', 'diamond': 'eW',
    'calf-stand': 'a', 'calf-seat': 'a', 'calf-lp': 'a', 'calf-db': 'a', 'calf-bw': 'a',
    'db-shrug': 'n', 'bb-shrug': 'n', 'cb-shrug': 'n',
    'cb-crunch': 'n', 'crunch': 'N', 'mc-crunch': 'n', 'hang-raise': 'sw', 'ab-wheel': 'sw', 'bird-dog': 'w'
  };
  var JOINTS = [['N', 'Neck'], ['S', 'Shoulder'], ['E', 'Elbow'], ['W', 'Wrist'], ['H', 'Hip'], ['K', 'Knee'], ['A', 'Ankle or foot']];
  var JNAME = {};
  JOINTS.forEach(function (j) { JNAME[j[0]] = j[1]; });
  var JOINT_CUE = {
    N: 'Keep your chin tucked and let your neck ride along rather than strain.',
    S: 'Stay in the range your shoulder is happy with; stop short of any pinch.',
    E: 'Use the grip and range that keeps your elbows quiet.',
    W: 'Keep your wrists stacked straight; handles or fists if they complain.',
    H: 'Only as deep as your hip moves without pinching.',
    K: 'Only as deep as your knee is comfortable, slow on the way down.',
    A: 'Supportive shoes, slow and controlled, no bouncing.'
  };

  /* Easier to harder. A bodyweight exercise has no plate to add, so it
     progresses by becoming a harder exercise: top out the rep range on every
     set and the next session moves you up a rung (Kotarsky et al. 2018 found
     progressed push-ups built strength and muscle much like the bench). */
  var LADDER = {
    'inc-pushup': 'pushup-flat', 'pushup-flat': 'pushup', 'pushup': 'archer',
    'bw-squat': 'split-squat', 'split-squat': 'bw-bss',
    'glute-bridge': 'sl-bridge', 'slide-curl': 'nordic', 'pullup-neg': 'pullup'
  };
  var LADDER_DOWN = {};
  Object.keys(LADDER).forEach(function (k) { LADDER_DOWN[LADDER[k]] = k; });

  /* What a bodyweight exercise needs that a floor does not have. At home it
     ranks below one that needs nothing, and says what it needs; in a gym
     all of it is there. */
  var GEAR = {
    'pullup': 'a pull-up bar', 'chinup': 'a pull-up bar', 'pullup-neg': 'a pull-up bar', 'hang-raise': 'a pull-up bar',
    'inv-row': 'a low bar or a sturdy table', 'dip': 'parallel bars or two sturdy chairs', 'bench-dip': 'a bench or chair',
    'ab-wheel': 'an ab wheel', 'ball-curl': 'a stability ball', 'nordic': 'something to hook your heels under',
    'back-ext': 'a back-extension bench'
  };
  /* The bodyweight versions of lifts a gym can load. At home they are the
     lift; in a gym they are a step down from it, so they rank well below
     a barbell or a machine that can keep adding weight. */
  var HOMEY = {};
  ['pushup-flat', 'inc-pushup', 'pushup', 'archer', 'pullup-neg', 'inv-row', 'bw-squat', 'split-squat', 'bw-bss',
    'sl-rdl', 'glute-bridge', 'sl-bridge', 'pike-pushup', 'diamond', 'calf-bw']
    .forEach(function (id) { HOMEY[id] = 1; });
  var BACK_CUE = {
    f: 'Stop each rep before your lower back starts to round.',
    c: 'Brace before every rep, and leave it out on a day your back is cranky.',
    x: 'Finish with your glutes, not by arching your lower back.'
  };
  var LIB = {}, LIB_LIST = [];
  LIB_ROWS.forEach(function (r, i) {
    var ex = { id: r[0], n: r[1], m: r[2], k: r[3], q: r[4], p: r[5], rr: [r[6], r[7]], o: i,
      bk: BACK[r[0]] || '', jt: JT[r[0]] || '' };
    LIB[ex.id] = ex;
    LIB_LIST.push(ex);
  });

  /* How to do each lift: three short steps, the cues a coach gives on the
     floor. Written for the library here, not a substitute for being shown,
     and nothing in them overrides the back and joint cues. */
  var HOWTO = {
    'bb-bench': ['Lie with your eyes under the bar, feet flat, shoulder blades pinched back and down.', 'Grip a little wider than your shoulders and lower the bar to the middle of your chest, elbows angled about 45–70° from your sides.', 'Press up and slightly back toward your face, shoulders staying pinned.'],
    'db-bench': ['Sit with the dumbbells on your thighs, lie back and bring them up over your chest.', 'Lower them to the sides of your chest, elbows angled down, until you feel a stretch.', 'Press up and slightly in, without knocking them together.'],
    'mc-press': ['Set the seat so the handles line up with the middle of your chest.', 'Shoulder blades back against the pad; press until your arms are nearly straight.', 'Come back slowly into a stretch without letting the stack rest.'],
    'bb-incline': ['Set the bench to 30–45° and unrack with your shoulder blades pinched back.', 'Lower the bar to your upper chest, just under the collarbones.', 'Press up over your shoulders, hips staying on the bench.'],
    'db-incline': ['Bench at 30–45°, dumbbells over your upper chest.', 'Lower to the sides of your upper chest until you feel the stretch.', 'Press back up, shoulder blades down and back.'],
    'sm-incline': ['Set the bench at 30–45° under the Smith bar so it meets your upper chest.', 'Unhook and lower under control to just above the chest.', 'Press up; rehook by turning your wrists at the top.'],
    'dip': ['Support yourself on straight arms between the bars, shoulders down.', 'Lean slightly forward and lower until your upper arms are about level with the bars, or as far as your shoulders are happy.', 'Press back up to straight arms.'],
    'pushup-flat': ['Hands under your shoulders, body straight from head to heels.', 'Lower your chest to a fist above the floor, elbows about 45° from your sides.', 'Press away to straight arms without your hips sagging.'],
    'inc-pushup': ['Hands on a bench, counter or wall, body straight.', 'Lower your chest to the edge, elbows angled back.', 'Press away. The lower the surface, the harder it is; move down as it gets easy.'],
    'pushup': ['Hands on two blocks, books or handles, so your chest can drop below them.', 'Lower slowly past hand height into a deep stretch, body straight.', 'Press back up.'],
    'archer': ['Hands wide, fingers turned out.', 'Lower toward one hand while the other arm straightens out to the side.', 'Press back to the middle and alternate sides.'],
    'cb-fly': ['Set the pulleys at shoulder height or above and step forward, elbows slightly bent.', 'Open your arms wide until your chest stretches, keeping the elbow bend fixed.', 'Bring the handles together in front of your chest and squeeze.'],
    'pec-deck': ['Seat so the handles are at chest height, back against the pad.', 'With a slight elbow bend, bring the handles together in front of you.', 'Open slowly until you feel a stretch across the chest.'],
    'db-fly': ['Lie on a flat bench, dumbbells over your chest, palms facing, elbows slightly bent.', 'Open your arms in a wide arc until you feel a stretch, elbow bend fixed.', 'Hug them back up over your chest.'],
    'lat-pd': ['Thighs under the pads, grip a little wider than your shoulders.', 'Pull the bar to your upper chest, elbows driving down and back, leaning back only a little.', 'Let it rise until your arms are straight and your shoulders lift.'],
    'pullup': ['Hang with your hands just outside shoulder width, palms away.', 'Pull your chest toward the bar, elbows driving down to your sides.', 'Lower all the way to straight arms.'],
    'lat-pd-n': ['Use a close, neutral-grip handle, thighs under the pads.', 'Pull the handle to your upper chest, elbows close to your body.', 'Return to straight arms with control.'],
    'chinup': ['Hang with your palms facing you, hands shoulder width.', 'Pull until your chin clears the bar, elbows down in front of you.', 'Lower to straight arms.'],
    'pullup-neg': ['Step or jump to the top, chin over the bar.', 'Lower yourself as slowly as you can, three to five seconds, to straight arms.', 'Step back up and repeat. This is the road to a full pull-up.'],
    'inv-row': ['Lie under a bar or rings at about waist height, heels down, body straight.', 'Pull your chest to the bar, squeezing your shoulder blades together.', 'Lower to straight arms. Walk your feet in to make it easier.'],
    'bb-row': ['Hinge forward to about 45°, back flat, bar hanging at arm’s length.', 'Row the bar to your lower ribs, elbows going back.', 'Lower under control without letting your back round.'],
    'mc-row': ['Chest against the pad, arms straight to the handles.', 'Row back, elbows past your sides, squeezing your shoulder blades.', 'Return slowly to a full stretch.'],
    'cb-row': ['Sit tall with a slight knee bend, arms straight to the handle.', 'Row the handle to your stomach, elbows close, chest up.', 'Reach forward with your arms, not your lower back.'],
    'db-row': ['One hand and knee on a bench, back flat, the dumbbell hanging.', 'Row it toward your hip, elbow close to your side.', 'Lower into a full stretch.'],
    'db-cs-row': ['Lie face down on an incline bench, dumbbells hanging.', 'Row them up, elbows back, shoulder blades squeezing.', 'Lower to straight arms. The bench takes your lower back out of it.'],
    'db-pullover': ['Lie on a bench holding one dumbbell over your chest with both hands.', 'With a slight elbow bend, lower it back over your head until your lats stretch.', 'Pull it back over your chest.'],
    'cb-straight': ['Face a high pulley, bar or rope at arm’s length, a slight hinge at the hips.', 'With arms nearly straight, sweep the handle down to your thighs.', 'Let it rise until your arms are overhead.'],
    'bb-squat': ['Bar across your upper back, feet about shoulder width, toes a little out.', 'Brace, then sit down between your heels, knees over your toes, as deep as your back stays neutral.', 'Drive up through the whole foot.'],
    'hack': ['Back and shoulders against the pads, feet shoulder width on the platform.', 'Lower until your thighs are at least level, knees over your toes.', 'Press up without snapping your knees straight.'],
    'bb-front': ['Bar resting on the front of your shoulders, elbows high.', 'Sit straight down, torso upright, as deep as you can.', 'Drive up keeping your elbows high.'],
    'sm-squat': ['Bar across your upper back, feet a little in front of the bar.', 'Unhook and squat to at least level.', 'Drive up and rehook at the top.'],
    'leg-press': ['Back flat on the pad, feet shoulder width in the middle of the platform.', 'Lower until your knees come toward your chest, without your lower back curling off the pad.', 'Press up without locking your knees.'],
    'seated-lp': ['Sit with your back and hips against the pad, feet shoulder width in the middle of the platform.', 'Press until your legs are nearly straight, without locking your knees.', 'Come back until your knees are near your chest, stopping before your lower back curls off the pad.'],
    'belt-squat': ['Clip the belt around your hips, stand on the platform and hold the rails.', 'Squat down between your feet, torso upright.', 'Stand back up. Your spine carries none of the weight.'],
    'db-bss': ['Rear foot on a bench behind you, front foot far enough ahead that the knee stays over it.', 'Holding the dumbbells, lower straight down until the back knee nearly touches the floor.', 'Push up through the front foot. All sets on one leg, then the other.'],
    'goblet': ['Hold a dumbbell or kettlebell at your chest, elbows down.', 'Squat down between your knees, torso tall.', 'Stand up through your heels.'],
    'db-lunge': ['Dumbbells at your sides; step forward into a long stride.', 'Lower until the back knee nearly touches the floor.', 'Push through the front foot into the next step.'],
    'db-stepup': ['Dumbbells at your sides, one foot on a knee-high box or bench.', 'Drive through that foot to stand on the box, without pushing off the back foot.', 'Step down with control. All reps on one leg, then the other.'],
    'bw-squat': ['Feet shoulder width, arms out in front for balance.', 'Sit as deep as you can with your heels on the floor.', 'Stand up. Go slower to make it harder.'],
    'split-squat': ['Stand in a long split stance, back heel up.', 'Lower straight down until the back knee nearly touches the floor.', 'Push back up. All reps on one side, then the other.'],
    'bw-bss': ['Rear foot on a bench or couch behind you.', 'Lower until the back knee nearly touches the floor.', 'Push up through the front foot.'],
    'leg-ext': ['Pad just above your ankles, knees lined up with the machine’s pivot.', 'Straighten your legs fully and squeeze.', 'Lower slowly.'],
    'bb-rdl': ['Stand with the bar at your thighs, knees soft.', 'Push your hips back, sliding the bar down your legs with a flat back, until your hamstrings stretch.', 'Drive your hips forward to stand.'],
    'db-rdl': ['Dumbbells in front of your thighs, knees soft.', 'Hinge at the hips, sliding them down your legs until your hamstrings stretch, back flat.', 'Stand by driving your hips forward.'],
    'bb-sldl': ['Bar at your thighs, knees only slightly bent.', 'Hinge forward with legs nearly straight and back flat, as far as your hamstrings allow.', 'Stand by squeezing your glutes.'],
    'bb-dl': ['Bar over the middle of your feet, grip just outside your legs, shins touching the bar.', 'Brace with a flat back and push the floor away until you stand tall.', 'Lower by pushing your hips back, the bar close to your legs.'],
    'sumo-dl': ['Feet wide, toes turned out, the bar over the middle of your feet; grip inside your knees.', 'Push your knees out over your toes, chest up, and brace.', 'Spread the floor apart as you stand, the bar close; lower the same way.'],
    'trap-dl': ['Stand in the middle of the bar, handles at your sides.', 'Sit down and back until you can grip the handles, chest up, back flat, and brace.', 'Stand tall by pushing the floor away; lower under control.'],
    'as-pullup': ['Set the help: more weight on the stack is more help. Kneel or stand on the pad.', 'Hands a little wider than your shoulders; pull your chest toward the bar, elbows down.', 'Lower all the way under control. Less help over time is the progress.'],
    'as-dip': ['Set the help: more weight on the stack is more help. Kneel or stand on the pad.', 'Lean slightly forward and lower until your upper arms are about level with the floor.', 'Press back up without shrugging. Less help over time is the progress.'],
    'good-am': ['Bar across your upper back, knees soft.', 'Push your hips back and hinge until your torso is near level or your hamstrings stop you, back flat.', 'Drive your hips forward to stand. Start light.'],
    'lying-curl': ['Lie face down, pad just above your heels, knees just off the bench.', 'Curl your heels toward your glutes, hips pressed down.', 'Lower slowly to straight legs.'],
    'seated-curl': ['Pad above your heels, thigh pad snug, knees lined up with the pivot.', 'Curl your heels down and back under the seat.', 'Return slowly to straight legs.'],
    'slide-curl': ['Lie on your back, heels on towels on a smooth floor, hips up.', 'Slide your heels toward your glutes, keeping your hips high.', 'Slide them back out slowly.'],
    'nordic': ['Kneel with your ankles anchored under something solid.', 'Keeping a straight line from knees to head, lower forward as slowly as you can, catching yourself with your hands.', 'Push off lightly and pull back up with your hamstrings.'],
    'ball-curl': ['Lie on your back, heels on a stability ball, hips lifted.', 'Roll the ball toward you by bending your knees, hips high.', 'Roll it back out slowly.'],
    'sl-rdl': ['Stand on one leg, knee soft.', 'Hinge forward, the free leg reaching back, until the standing hamstring stretches, hips square.', 'Stand back up. Hold something for balance if you need to.'],
    'hip-thrust': ['Upper back on a bench, a padded bar across your hips, feet flat.', 'Drive through your heels until your thighs are level, chin tucked.', 'Lower with control.'],
    'mc-thrust': ['Pad across your hips, upper back against the pad, feet flat.', 'Drive your hips up until your thighs are level and squeeze.', 'Lower with control.'],
    'db-thrust': ['Upper back on a bench, a dumbbell held on your hips.', 'Drive your hips up until your thighs are level.', 'Lower with control.'],
    'back-ext': ['Hips on the pad, ankles locked in, body straight.', 'Lower by hinging at the hips, back flat.', 'Rise by squeezing your glutes until your body is straight, and no further.'],
    'abduct': ['Sit tall with the pads on the outsides of your knees.', 'Push your knees apart as far as they go.', 'Return slowly.'],
    'cb-kick': ['Cuff on one ankle, facing the low pulley, holding the frame.', 'Kick the leg straight back, squeezing the glute, without arching your back.', 'Return slowly. All reps on one leg, then the other.'],
    'mc-kick': ['Chest on the pad, hands on the handles, one foot on the platform or the pad behind your knee.', 'Push the leg back by squeezing your glute until your thigh is in line with your body, ribs down, no arch.', 'Return slowly without letting the stack rest. All reps on one leg, then the other.'],
    'sm-thrust': ['Set the stops just above the floor. Upper back on a bench beside the bar, the bar padded across your hips, feet flat.', 'Unhook and drive through your heels until your thighs are level, chin tucked, ribs down.', 'Lower until your hips nearly touch the floor; rehook at the top.'],
    'glute-bridge': ['Lie on your back, knees bent, feet flat near your hips.', 'Drive through your heels until your body is straight from knees to shoulders.', 'Lower with control.'],
    'sl-bridge': ['Lie on your back, one foot flat, the other leg lifted.', 'Drive through the planted heel until your hips are level.', 'Lower slowly. All reps on one side, then the other.'],
    'db-lat': ['Dumbbells at your sides, a slight bend in your elbows.', 'Raise them out to the side to shoulder height, elbows leading.', 'Lower slowly.'],
    'cb-lat': ['Stand side-on to a low pulley, the handle in your far hand.', 'Raise the arm out to the side to shoulder height.', 'Lower slowly. All reps on one side, then the other.'],
    'mc-lat': ['Seat so your shoulders line up with the pivot, pads on your upper arms.', 'Raise your arms out to shoulder height.', 'Lower slowly.'],
    'cb-upright': ['Stand at a low pulley with a straight bar or rope.', 'Pull it up along your body to chest height, elbows leading out to the side.', 'Lower slowly. Stop lower if your shoulders pinch.'],
    'rev-deck': ['Face the pad, handles at shoulder height, arms straight.', 'Sweep your arms back and out until they line up with your body.', 'Return slowly.'],
    'face-pull': ['Rope on a pulley at about face height.', 'Pull toward your face, splitting the rope, elbows high, hands ending beside your ears.', 'Return slowly.'],
    'db-rear': ['Hinge forward with a flat back, or lie chest-down on an incline bench, dumbbells hanging.', 'Raise them out to the side with arms slightly bent, squeezing the backs of your shoulders.', 'Lower slowly.'],
    'cb-rear': ['Stand between two pulleys at shoulder height with the cables crossed: left hand holds the right cable.', 'Pull your arms back and out until they line up with your body.', 'Return slowly.'],
    'prone-y': ['Lie face down on an incline bench or the floor, arms overhead in a Y, thumbs up.', 'Lift your arms with the muscles between your shoulder blades.', 'Lower slowly. Tiny weights, or none.'],
    'bb-ohp': ['Bar at your collarbones, grip just outside your shoulders, glutes tight.', 'Press straight up, moving your head back out of the way, then under the bar at the top.', 'Lower to your collarbones.'],
    'db-ohp': ['Sit tall on an upright bench, dumbbells at shoulder height.', 'Press them overhead until your arms are straight.', 'Lower to your shoulders.'],
    'mc-ohp': ['Seat so the handles start at shoulder height.', 'Press overhead to nearly straight arms.', 'Lower slowly.'],
    'db-front': ['Dumbbells in front of your thighs.', 'Raise them in front of you to shoulder height, arms nearly straight.', 'Lower slowly.'],
    'pike-pushup': ['Hands and feet on the floor, hips high in an upside-down V.', 'Bend your elbows to lower the top of your head toward the floor between your hands.', 'Press back up. Feet on a box makes it harder.'],
    'bb-curl': ['Bar at your thighs, palms forward, elbows at your sides.', 'Curl it to your shoulders without swinging.', 'Lower all the way.'],
    'ez-curl': ['Hold the angled grips of an EZ bar, elbows at your sides.', 'Curl to your shoulders without swinging.', 'Lower all the way.'],
    'db-curl': ['Dumbbells at your sides, palms forward.', 'Curl them up with your elbows staying at your sides.', 'Lower all the way.'],
    'inc-curl': ['Sit back on a bench set at about 45°, arms hanging behind your body.', 'Curl the dumbbells up without your elbows moving forward.', 'Lower into a full stretch.'],
    'hammer': ['Dumbbells at your sides, palms facing in.', 'Curl them up, palms still facing in.', 'Lower all the way.'],
    'cb-curl': ['Face a low pulley with a bar or rope.', 'Curl it up with your elbows at your sides.', 'Lower all the way.'],
    'preacher': ['Seat so your armpits rest at the top of the pad, arms down it.', 'Curl the handles up.', 'Lower slowly to nearly straight arms.'],
    'pushdown': ['Face a high pulley, elbows pinned to your sides.', 'Push the bar or rope down until your arms are straight.', 'Let it rise until your forearms pass level.'],
    'cb-oh-ext': ['Face away from a pulley, rope behind your head, elbows by your ears.', 'Straighten your arms forward and up.', 'Bend back into a deep stretch.'],
    'skull': ['Lie on a bench holding an EZ bar over your chest.', 'Bend at the elbows to lower it toward your forehead or just behind your head, upper arms still.', 'Straighten your arms.'],
    'db-oh-ext': ['Sit tall holding one dumbbell overhead with both hands.', 'Lower it behind your head, elbows pointing up.', 'Straighten your arms.'],
    'mc-tri': ['Seat so your elbows line up with the pivot.', 'Push the handles until your arms are straight.', 'Return slowly.'],
    'cgbp': ['Lie as for a bench press, hands about shoulder width.', 'Lower the bar to your lower chest, elbows close to your sides.', 'Press up.'],
    'bench-dip': ['Hands on the edge of a bench behind you, legs out in front.', 'Bend your elbows to lower your hips, elbows pointing back rather than out.', 'Press back up. Stop short if your shoulders complain.'],
    'diamond': ['Push-up position with your hands together under your chest, thumbs and forefingers touching.', 'Lower your chest toward your hands, elbows close.', 'Press back up.'],
    'calf-stand': ['Shoulders under the pads, balls of your feet on the edge of the step.', 'Lower your heels into a deep stretch and pause.', 'Rise as high as you can.'],
    'calf-seat': ['Knees under the pad, balls of your feet on the edge.', 'Lower your heels into a deep stretch.', 'Rise as high as you can.'],
    'calf-lp': ['On the leg press, balls of your feet on the bottom edge of the platform, legs nearly straight.', 'Let your toes come back toward you into a stretch.', 'Push the platform away with your toes.'],
    'calf-db': ['Stand on one foot on a step, a dumbbell in that hand, the other hand holding on.', 'Lower your heel into a deep stretch.', 'Rise as high as you can. All reps on one side, then the other.'],
    'calf-bw': ['Stand on one foot on a step, holding on for balance.', 'Lower your heel into a deep stretch.', 'Rise as high as you can.'],
    'db-shrug': ['Dumbbells at your sides.', 'Shrug straight up toward your ears and pause.', 'Lower slowly.'],
    'bb-shrug': ['Bar in front of your thighs.', 'Shrug straight up and pause.', 'Lower slowly.'],
    'cb-shrug': ['Stand at a low pulley with a bar or handles.', 'Shrug straight up and pause.', 'Lower slowly.'],
    'cb-crunch': ['Kneel facing a high pulley, rope held beside your head.', 'Curl your ribs toward your hips, rounding your back.', 'Uncurl slowly; your hips stay still.'],
    'hang-raise': ['Hang from a bar.', 'Raise your knees, or straight legs, as high as you can, curling your pelvis up.', 'Lower without swinging.'],
    'ab-wheel': ['Kneel holding the wheel under your shoulders.', 'Roll forward as far as you can without your lower back sagging.', 'Pull back with your abs.'],
    'mc-crunch': ['Sit and take the handles, feet secured.', 'Curl forward, bringing your ribs toward your hips.', 'Return slowly.'],
    'crunch': ['Lie on your back, knees bent, hands by your head.', 'Curl your shoulders off the floor toward your hips.', 'Lower slowly, without pulling on your neck.'],
    'pallof': ['Stand side-on to a pulley at chest height, handle at your chest.', 'Press it straight out and hold, not letting it turn you.', 'Bring it back. All reps on one side, then the other.'],
    'dead-bug': ['Lie on your back, arms up, knees bent over your hips, lower back pressed down.', 'Slowly lower one arm and the opposite leg toward the floor.', 'Return and switch sides; your lower back stays down.'],
    'bird-dog': ['On hands and knees, back flat.', 'Reach one arm forward and the opposite leg back until level, and hold a moment.', 'Return and switch sides without rocking.']
  };

  /* A picture or a clip of the lift, when there is one: nothing yet. Put a
     file at art/lifts/<id>.webp (or .mp4) and name it here, and the lift's
     page shows it above the steps. Your own how-to link, set on the lift's
     note, shows whether or not there is one. */
  var MEDIA = {};

  var EQUIP = { bb: 'Barbell', db: 'Dumbbell', mc: 'Machine', cb: 'Cable', sm: 'Smith machine', bw: 'Bodyweight' };

  /* What you have to train with. The generator only draws from these. */
  var KITS = {
    gym: { n: 'Full gym', eq: ['bb', 'db', 'mc', 'cb', 'sm', 'bw'] },
    bar: { n: 'Barbell & dumbbells', eq: ['bb', 'db', 'bw'] },
    db: { n: 'Dumbbells at home', eq: ['db', 'bw'] },
    bw: { n: 'Bodyweight only', eq: ['bw'] }
  };
  function atHome(eq) { return eq.indexOf('mc') < 0 && eq.indexOf('bb') < 0; }
  var SMALL = { triceps: 1, biceps: 1, side: 1, rear: 1, calves: 1, traps: 1 };

  /* ------------------------------------------------------------ the splits
   *
   * One per number of days, each slot "muscle/kind/pattern". Every muscle
   * lands at least twice a week wherever the days allow it. Frequency barely
   * matters once weekly sets are equal (Schoenfeld, Grgic & Krieger 2019),
   * but a muscle hit once has to take its whole week's sets in one sitting,
   * and the last of twelve chest sets in a row is not doing what the first
   * one did. Big lifts go first, while you are fresh enough to load them. */
  var SPLITS = {
    2: { n: 'Full body', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'hams/i/curl', 'side/i', 'triceps/i', 'calves/i']],
      ['Full Body B', ['hams/c/hinge', 'back/c/horiz', 'chest/c/incline', 'quads/i', 'side/i', 'biceps/i', 'abs/i']]
    ] },
    3: { n: 'Full body', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'hams/i/curl', 'side/i', 'biceps/i']],
      ['Full Body B', ['hams/c/hinge', 'back/c/horiz', 'chest/c/incline', 'quads/i', 'rear/i', 'triceps/i', 'calves/i']],
      ['Full Body C', ['quads/c/single', 'back/c/vert', 'chest/c/flat', 'hams/i/curl', 'side/i', 'triceps/i', 'abs/i']]
    ] },
    4: { n: 'Upper / lower', days: [
      ['Upper A', ['chest/c/flat', 'back/c/vert', 'chest/i/fly', 'back/c/horiz', 'side/i', 'triceps/i', 'biceps/i']],
      ['Lower A', ['quads/c/squat', 'hams/c/hinge', 'quads/i', 'hams/i/curl', 'calves/i', 'abs/i']],
      ['Upper B', ['back/c/horiz', 'chest/c/incline', 'back/c/vert', 'side/i', 'rear/i', 'biceps/i', 'triceps/i']],
      ['Lower B', ['hams/i/curl', 'quads/c/machine', 'glutes/c/thrust', 'quads/i', 'calves/i', 'abs/i']]
    ] },
    5: { n: 'Upper / lower / push / pull / legs', days: [
      ['Upper', ['chest/c/flat', 'back/c/vert', 'back/c/horiz', 'side/i', 'triceps/i', 'biceps/i']],
      ['Lower', ['quads/c/squat', 'hams/c/hinge', 'quads/i', 'calves/i', 'abs/i']],
      ['Push', ['chest/c/incline', 'front/c/press', 'chest/i/fly', 'side/i', 'triceps/i']],
      ['Pull', ['back/c/vert', 'back/c/horiz', 'rear/i', 'biceps/i', 'traps/i']],
      ['Legs', ['hams/i/curl', 'quads/c/machine', 'glutes/c/thrust', 'quads/i', 'calves/i']]
    ] },
    6: { n: 'Push / pull / legs, twice', days: [
      ['Push A', ['chest/c/flat', 'front/c/press', 'chest/i/fly', 'side/i', 'triceps/i']],
      ['Pull A', ['back/c/vert', 'back/c/horiz', 'rear/i', 'biceps/i', 'traps/i']],
      ['Legs A', ['quads/c/squat', 'hams/c/hinge', 'quads/i', 'calves/i', 'abs/i']],
      ['Push B', ['chest/c/incline', 'chest/c/flat', 'side/i', 'triceps/i', 'side/i']],
      ['Pull B', ['back/c/horiz', 'back/c/vert', 'rear/i', 'biceps/i', 'biceps/i']],
      ['Legs B', ['hams/i/curl', 'quads/c/machine', 'glutes/c/thrust', 'quads/i', 'calves/i', 'abs/i']]
    ] }
  };

  /* What you tell it after a session, in RP's words, and what each answer
     is worth to next week's sets. A good session is a positive number; a
     session that has run past what you can recover from is a negative one.
     See feedback() for how they add up. */
  var SORE = ['Healed early', 'Just in time', 'Still sore'];
  var SORE_W = ['recovered early', 'healed just in time', 'still sore'];
  var SORE_V = [1, 0, -1];
  var PUMP = ['Low', 'Moderate', 'Great'];
  var PUMP_W = ['low pump', 'moderate pump', 'great pump'];
  var PUMP_V = [1, 0, 0];
  var WORK = ['Easy', 'About right', 'Pushed my limits', 'Too much'];
  var WORK_W = ['felt easy', 'workload about right', 'pushed your limits', 'too much'];
  var WORK_V = [1, 0, -1, -2];
  var JOINT = ['None', 'Some', 'A lot'];

  /* ------------------------------------------------------------ the sources
   *
   * Every rule in the review points at one of these. Journals and years
   * rather than volume and page, because the point is to be findable. */
  var REFS = {
    vol17: ['Schoenfeld, Ogborn & Krieger (2017)', 'Dose-response relationship between weekly resistance training volume and increases in muscle mass. Journal of Sports Sciences.',
      'More weekly sets, more growth. Under five sets a week grew the least; ten or more the most.'],
    vol24: ['Pelland et al. (2024)', 'The resistance training dose response: meta-regressions of weekly volume and frequency on hypertrophy and strength. SportRxiv preprint.',
      'Growth keeps rising with sets, but each extra set buys less than the one before.'],
    freq19: ['Schoenfeld, Grgic & Krieger (2019)', 'How many times per week should a muscle be trained to maximize muscle hypertrophy? Journal of Sports Sciences.',
      'With weekly sets equal, training a muscle once or three times a week grows it about the same.'],
    freq16: ['Schoenfeld, Ogborn & Krieger (2016)', 'Effects of resistance training frequency on measures of muscle hypertrophy. Sports Medicine.',
      'Twice a week beat once a week in the studies available then, mostly because it carried more sets.'],
    fail23: ['Refalo et al. (2023)', 'Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy. Sports Medicine.',
      'Going all the way to failure grew about as much as stopping a rep or two short.'],
    fail24: ['Robinson et al. (2024)', 'Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy. Sports Medicine.',
      'Growth improves the closer a set ends to failure. Strength cares much less.'],
    load17: ['Schoenfeld, Grgic, Ogborn & Krieger (2017)', 'Strength and hypertrophy adaptations between low- vs. high-load resistance training. Journal of Strength and Conditioning Research.',
      'Light and heavy loads grow muscle alike when sets go close to failure. Heavy wins for strength.'],
    rest16: ['Schoenfeld et al. (2016)', 'Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. Journal of Strength and Conditioning Research.',
      'Three minutes between sets grew more than one minute.'],
    rest24: ['Singer et al. (2024)', 'Give it a rest: a Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. Frontiers in Sports and Active Living.',
      'Resting longer than about 60 seconds is slightly better for growth; past 90 seconds it hardly matters.'],
    rir16: ['Helms et al. (2016)', 'Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. Strength and Conditioning Journal.',
      'Reps to spare ("reps in reserve" in the research): how many more you could have done. Lifters guess it well near failure and badly far from it.'],
    rp21: ['Israetel, Hoffmann & Smith (2021)', 'Scientific Principles of Hypertrophy Training. Renaissance Periodization.',
      'The volume landmarks (MEV, MRV) and the feedback-driven set progression. Practitioner guidance, not a trial.'],
    deload24: ['Coleman et al. (2024)', 'Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations. PeerJ.',
      'A week off mid-program did not change muscle growth. Deloads are about fatigue and joints, not about growing more.'],
    bickel11: ['Bickel, Cross & Bamman (2011)', 'Exercise dosing to retain resistance training adaptations in young and older adults. Medicine & Science in Sports & Exercise.',
      'After sixteen weeks of training, one session a week kept strength and size for eight months: younger lifters on a ninth of the sets, older lifters needing about a third to keep their muscle.'],
    spiering21: ['Spiering et al. (2021)', 'Maintaining physical performance: the minimal dose of exercise needed to preserve endurance and strength over time. Journal of Strength and Conditioning Research.',
      'Strength and muscle can be kept on as little as one session a week and a set or so per exercise, provided the load stays heavy; older adults need about two sessions.'],
    iversen21: ['Iversen et al. (2021)', 'No time to lift? Designing time-efficient training programs for strength and hypertrophy: a narrative review. Sports Medicine.',
      'For short sessions: favour lifts that train several muscles, pair exercises for different muscles, and keep weekly sets modest \u2014 about four hard sets a muscle a week still builds strength.'],
    who20: ['Bull et al. (2020)', 'World Health Organization 2020 guidelines on physical activity and sedentary behaviour. British Journal of Sports Medicine.',
      'Adults: 150\u2013300 minutes a week of moderate activity, or 75\u2013150 vigorous, plus muscle strengthening on two or more days.'],
    compendium11: ['Ainsworth et al. (2011)', 'Compendium of Physical Activities: a second update of codes and MET values. Medicine & Science in Sports & Exercise.',
      'Golf walking with clubs is about 4\u20135 METs, in a cart about 3.5; 3 to 6 METs counts as moderate.'],
    hayden21: ['Hayden et al. (2021)', 'Exercise therapy for chronic low back pain. Cochrane Database of Systematic Reviews.',
      'Exercise probably reduces pain in long-running low back pain compared with no treatment; no one kind of exercise stands out.'],
    long04: ['Long, Donelson & Fung (2004)', 'Does it matter which exercise? A randomized control trial of exercise for low back pain. Spine.',
      'People whose back pain eased in one direction of movement did better with exercise matched to it \u2014 the idea behind steering clear of what sets yours off.'],
    acsm09: ['American College of Sports Medicine (2009)', 'Progression models in resistance training for healthy adults. Medicine & Science in Sports & Exercise.',
      'For people starting out: two or three full-body sessions a week, one to three sets of eight to twelve reps, adding load as it gets easier.'],
    kotarsky18: ['Kotarsky et al. (2018)', 'Effect of progressive calisthenic push-up training on muscle strength and thickness. Journal of Strength and Conditioning Research.',
      'Push-ups made harder as people got stronger built chest strength and thickness much as the bench press did.'],
    simao12: ['Simão et al. (2012)', 'Exercise order in resistance training. Sports Medicine.',
      'The exercises done first in a session get the most reps and tend to improve most — so what you want to bring up goes first.'],
    murphy22: ['Murphy & Koehler (2022)', 'Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. Scandinavian Journal of Medicine & Science in Sports.',
      'Lifting while eating less still built strength; muscle gains shrank as the deficit grew. Lifting is what tells the body to keep its muscle.'],
    wilson12: ['Wilson et al. (2012)', 'Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. Journal of Strength and Conditioning Research.',
      'Cardio alongside lifting took a little off gains in muscle and strength, mostly with running and mostly with a lot of it.'],
    schumann22: ['Schumann et al. (2022)', 'Compatibility of concurrent aerobic and strength training for skeletal muscle size and function: an updated systematic review and meta-analysis. Sports Medicine.',
      'The newer pooled evidence: cardio did not hold back muscle growth or maximal strength, though it blunted explosive strength a little.'],
    watson18: ['Watson et al. (2018)', 'High-intensity resistance and impact training improves bone mineral density and physical function in postmenopausal women with osteopenia and osteoporosis: the LIFTMOR randomized controlled trial. Journal of Bone and Mineral Research.',
      'Supervised heavy lifting was safe for older women with low bone mass, and improved their bones and how well they moved.'],
    roberts20: ['Roberts, Nuckols & Krieger (2020)', 'Sex differences in resistance training: a systematic review and meta-analysis. Journal of Strength and Conditioning Research.',
      'Women and men gained muscle at about the same relative rate, and women gained upper-body strength relatively faster — why the quiz does not ask.'],
    jm: ['Smith, The Juggernaut Method 2.0', 'Juggernaut Training Systems.',
      'Waves of tens, eights, fives and threes, each run as accumulation, intensification and realization weeks and a deload, from a training max set a little under your true max; the last set of each realization week, for as many reps as you can, moves the max for the next wave. A coach\u2019s method, not a trial.'],
    williams17: ['Williams et al. (2017)', 'Comparison of periodized and non-periodized resistance training on maximal strength: a meta-analysis. Sports Medicine.',
      'Periodized training \u2014 loads and reps changing on a plan \u2014 built more one-rep-max strength than the same training done the same way every week.'],
    pb14: ['Schoenfeld et al. (2014)', 'Effects of different volume-equated resistance training loading strategies on muscular adaptations in well-trained men. Journal of Strength and Conditioning Research.',
      'Heavy powerlifting-style sets and moderate bodybuilding-style sets grew muscle about the same; the heavy sets built more strength.'],
    claudino18: ['Claudino et al. (2018)', 'CrossFit overview: systematic review and meta-analysis. Sports Medicine \u2013 Open.',
      'CrossFit-style training improved aerobic fitness and body composition in the studies available, most of them short and small.'],
    milanovic15: ['Milanovi\u0107, Sporis & Weston (2015)', 'Effectiveness of high-intensity interval training (HIT) and continuous endurance training for VO2max improvements: a systematic review and meta-analysis of controlled trials. Sports Medicine.',
      'Hard intervals raised aerobic fitness at least as much as longer steady cardio, in less time.'],
    klimek18: ['Klimek et al. (2018)', 'Are injuries more common with CrossFit training than other forms of exercise? Journal of Sport Rehabilitation.',
      'Injury rates in CrossFit were about those of other strength and fitness training \u2014 not zero, and highest where fatigue and form part company.'],
    epley: ['Epley (1985)', 'Poundage chart. Boyd Epley Workout.',
      'Estimated one-rep max = weight × (1 + reps ÷ 30). Least trustworthy past about twelve reps.']
  };

  /* ---------------------------------------------------------------- storage
   *
   * Everything that travels lives in one object, T, with a stamp beside each
   * piece so two devices can agree on which copy is newer without asking a
   * server to referee:
   *
   *   pr   settings — units, bar, rest times, sound
   *   act  which block is running
   *   ms   blocks, keyed by id
   *   wo   finished workouts, keyed by id
   *   cx   exercises you made yourself, keyed by id
   *   ax   activity outside the gym — golf, walks — keyed by id
   *
   * The workout in progress is NOT in T. It belongs to the phone in your
   * hand at the gym, not to the account, and syncing half a set to a laptop
   * at home helps nobody. It is written on every keystroke, so a phone that
   * locks, dies or reloads mid-session comes back to the same set. */
  var LS_T = 'bsc.train', LS_TS = 'bsc.trainStamps', LS_LIVE = 'sh.trainLive', LS_SUB = 'sh.trainSub', LS_HV = 'sh.trainHist';
  // how you matched the columns of a file no app of ours wrote, by its headings
  var LS_IMAP = 'sh.importMap';

  function defaultsPr(p) {
    p = plain(p) ? p : {};
    var u = p.u === 'kg' ? 'kg' : 'lb';
    return {
      u: u,
      bar: fin(p.bar) && p.bar >= 0 ? p.bar : (u === 'kg' ? 20 : 45),
      // Compound and isolation rest. Three minutes on the big lifts is where
      // Schoenfeld et al. (2016) saw the difference; ninety seconds is past
      // the point Singer et al. (2024) found it stops mattering.
      rc: fin(p.rc) && p.rc > 0 ? p.rc : 180,
      ri: fin(p.ri) && p.ri > 0 ? p.ri : 90,
      /* Between the two halves of a pair. A minute each way leaves each
         muscle about two and three-quarter minutes between its own sets,
         which is the whole trick of pairing. */
      rp: fin(p.rp) && p.rp > 0 ? p.rp : 60,
      snd: p.snd === 0 ? 0 : 1,
      // the chime and confetti when a workout is saved
      yay: p.yay === 0 ? 0 : 1,
      // a reps-in-reserve box on every set, for those who like to say
      rq: p.rq === 1 ? 1 : 0,
      /* The effort scale shown and typed: reps in reserve, or RPE the way
         Strong and most powerlifting programs write it. The same scale from
         the other end (RPE 8 is two in reserve), so what is stored is always
         reps in reserve and the review reads it either way. */
      eff: p.eff === 'rpe' ? 'rpe' : 'rir',
      // the plates for each side drawn beside a barbell set: in every set, while typing, or not at all
      pl: ['row', 'type', 'off'].indexOf(p.pl) >= 0 ? p.pl : 'row',
      // a bar of its own for a lift that is not on the usual one: an EZ bar, a Smith machine
      bars: cleanBars(p.bars),
      // a rest of its own for a lift: longer on the squat, shorter on the curls
      rests: cleanRests(p.rests),
      // the badge beside each lift's name, and which measure each lift shows in it
      fmo: p.fmo === 0 ? 0 : p.fmo === 2 ? 2 : 1,
      fm: cleanFm(p.fm),
      // a gym and home: the plates and bar you have at home, and where you were last
      gy: cleanGy(p.gy),
      // the card on how a workout goes, shown to someone new until put away
      hw: p.hw === 1 ? 1 : 0,
      // never ask your weight on a pull-up day
      nobw: p.nobw === 1 ? 1 : 0,
      // a block's weekly climb follows how far under maintenance Nourish says you eat
      nph: p.nph === 0 ? 0 : 1,
      /* Everything below is you, answered once in the quiz and read by the
         picks, the builder and the review. */
      // what you train for; the first version knew two, and 'grow' was the first
      goal: GOALS[p.goal] ? p.goal : 'muscle',
      lvl: [0, 1, 2].indexOf(p.lvl) >= 0 ? p.lvl : 1,
      // seven is six lifting days and an easy one: muscles need a day off even when you do not
      dpw: [2, 3, 4, 5, 6, 7].indexOf(p.dpw) >= 0 ? p.dpw : 3,
      // minutes a session may take, warm-up included; 0 is no limit
      min: [30, 40, 45, 60, 75].indexOf(p.min) >= 0 ? p.min : 0,
      kit: KITS[p.kit] ? p.kit : 'gym',
      // what sets your back off, as the letters BACK uses; '' is not protecting it
      bk: typeof p.bk === 'string' ? p.bk.replace(/[^fcx]/g, '').slice(0, 3) : '',
      // other joints to protect, as the letters JT uses
      jt: typeof p.jt === 'string' ? p.jt.replace(/[^NSEWHKA]/g, '').slice(0, 7) : '',
      // how your days go: at a desk, on your feet, physical work, very active
      day: ['desk', 'feet', 'labor', 'active'].indexOf(p.day) >= 0 ? p.day : '',
      age: ['u40', '40', '60'].indexOf(p.age) >= 0 ? p.age : '',
      // what you do outside the gym
      hab: Array.isArray(p.hab) ? p.hab.filter(function (h) { return !!HABITS[h]; }) : [],
      // exercises you never want suggested again
      avoid: Array.isArray(p.avoid) ? p.avoid.filter(function (e) { return typeof e === 'string'; }).slice(0, 200) : [],
      // when the quiz was last answered; 0 is never
      qz: fin(p.qz) ? p.qz : 0,
      /* The weekdays you lift, Monday 0 to Sunday 6. Nourish plans each day's
         carbohydrate from them; empty until picked, and then Nourish's own
         days stand in. */
      ld: Array.isArray(p.ld) ? p.ld.filter(function (d, i, a) { return d === (d | 0) && d >= 0 && d <= 6 && a.indexOf(d) === i; }).sort() : []
    };
  }

  /* Kept like the notes are: under the exercise's id squeezed to letters
     and digits, carrying the id itself, and the unit it was set in. */
  function cleanBars(b) {
    var out = {};
    if (!plain(b)) return out;
    Object.keys(b).slice(0, 200).forEach(function (k) {
      var v = b[k];
      if (plain(v) && typeof v.e === 'string' && fin(v.w) && v.w >= 0 && v.w <= 100 && (v.u === 'lb' || v.u === 'kg')) {
        out[k] = { e: v.e, w: v.w, u: v.u };
      }
    });
    return out;
  }

  function cleanRests(b) {
    var out = {};
    if (!plain(b)) return out;
    Object.keys(b).slice(0, 200).forEach(function (k) {
      var v = b[k];
      if (plain(v) && typeof v.e === 'string' && fin(v.s) && v.s >= 15 && v.s <= 600) out[k] = { e: v.e, s: v.s };
    });
    return out;
  }

  var FM = ['vc', 'vol', 'reps', 'best'];
  function cleanFm(b) {
    var out = {};
    if (!plain(b)) return out;
    Object.keys(b).slice(0, 200).forEach(function (k) {
      var v = b[k];
      if (plain(v) && typeof v.e === 'string' && FM.indexOf(v.m) > 0) out[k] = { e: v.e, m: v.m };
    });
    return out;
  }

  var GOALS = {
    muscle: { n: 'Build muscle', s: 'Look and feel bigger' },
    strength: { n: 'Get stronger', s: 'Lift heavier' },
    both: { n: 'Both', s: 'Bigger and stronger' },
    keep: { n: 'Keep what I have', s: 'Stay strong in less time' },
    lean: { n: 'Lose fat', s: 'Keep your muscle while the weight comes off' },
    health: { n: 'Feel better', s: 'Health, energy, moving well' }
  };

  /* Activity outside the gym, and what it counts as.
   *
   * lv is how hard it usually is, from the Compendium of Physical
   * Activities: l light (under 3 METs), m moderate (3–6), v vigorous (6 and
   * up). A moderate minute counts once toward the WHO's 150 and a vigorous
   * one twice, the way the guideline is written; light activity is logged
   * but does not count. Any single session can be marked easier or harder.
   *
   * legs, jt and back are what it asks of the body, so the plan can say what
   * not to schedule the day before: running and field sports load knees and
   * ankles, swimming and tennis the shoulder, golf the back. */
  var HABITS = {
    walk: { n: 'Walking', btn: 'Walk', min: 30, lv: 'm', legs: 1 },
    run: { n: 'Running or jogging', btn: 'Run', min: 30, lv: 'v', legs: 2, jt: 'KA' },
    cycle: { n: 'Cycling', btn: 'Ride', min: 45, lv: 'm', legs: 1 },
    swim: { n: 'Swimming', btn: 'Swim', min: 30, lv: 'm', jt: 'S' },
    hike: { n: 'Hiking', btn: 'Hike', min: 120, lv: 'v', legs: 2, jt: 'KA' },
    golfw: { n: 'Golf (walking)', btn: 'Golf (walked)', min: 240, lv: 'm', back: 1 },
    golfc: { n: 'Golf (cart)', btn: 'Golf (cart)', min: 240, lv: 'm', back: 1 },
    soccer: { n: 'Soccer', btn: 'Soccer', min: 60, lv: 'v', legs: 2, jt: 'KA' },
    hoops: { n: 'Basketball', btn: 'Basketball', min: 60, lv: 'v', legs: 2, jt: 'KA' },
    tennis: { n: 'Tennis', btn: 'Tennis', min: 60, lv: 'v', legs: 1, jt: 'SE' },
    pickle: { n: 'Pickleball', btn: 'Pickleball', min: 60, lv: 'm', legs: 1 },
    volley: { n: 'Volleyball', btn: 'Volleyball', min: 60, lv: 'm', legs: 1, jt: 'S' },
    row: { n: 'Rowing or paddling', btn: 'Row', min: 30, lv: 'v', back: 1 },
    climb: { n: 'Climbing', btn: 'Climb', min: 90, lv: 'v', jt: 'SE' },
    martial: { n: 'Martial arts or boxing', btn: 'Martial arts', min: 60, lv: 'v', legs: 1 },
    dance: { n: 'Dancing', btn: 'Dance', min: 60, lv: 'm', legs: 1 },
    ski: { n: 'Skiing or snowboarding', btn: 'Ski', min: 180, lv: 'm', legs: 2, jt: 'K' },
    yard: { n: 'Yard work or chores', btn: 'Yard work', min: 60, lv: 'm', back: 1 },
    yoga: { n: 'Yoga or mobility', btn: 'Yoga', min: 30, lv: 'l' },
    other: { n: 'Something else', btn: 'Other', min: 30, lv: 'm' }
  };
  var HAB_ORDER = Object.keys(HABITS);
  var LV = { l: 'Light', m: 'Moderate', v: 'Vigorous' };
  function blankT() { return { pr: defaultsPr(null), act: '', ms: {}, wo: {}, cx: {}, ax: {}, nt: {}, rt: {} }; }
  /* prk: when each setting was last changed, setting by setting. pr stays the
     newest of them, which is all a build from before this reads. msk is the
     same for each block, field by field (msStamp), beside its one stamp in ms. */
  function blankTS() { return { pr: 0, prk: {}, act: 0, ms: {}, msk: {}, wo: {}, cx: {}, ax: {}, nt: {}, rt: {} }; }
  var PARTS = ['ms', 'wo', 'cx', 'ax', 'nt', 'rt'];

  function loadT() {
    var t = readLS(LS_T), out = blankT();
    if (plain(t)) {
      out.pr = defaultsPr(t.pr);
      out.act = typeof t.act === 'string' ? t.act : '';
      PARTS.forEach(function (p) {
        if (!plain(t[p])) return;
        Object.keys(t[p]).forEach(function (k) {
          if (t[p][k] && SHAPE[p](t[p][k])) out[p][k] = t[p][k];
        });
      });
    }
    return out;
  }
  function loadTS() {
    var s = readLS(LS_TS), out = blankTS();
    if (!plain(s)) return out;
    out.pr = fin(s.pr) ? s.pr : 0;
    // stamps kept by a build from before settings had their own: made from pr when needed (prOwn)
    out.prk = plain(s.prk) ? s.prk : null;
    out.act = fin(s.act) ? s.act : 0;
    out.msk = plain(s.msk) ? s.msk : {};
    PARTS.forEach(function (p) { if (plain(s[p])) out[p] = s[p]; });
    return out;
  }

  /* What a value from another device has to look like before it is let in.
     A wrong-shaped one is ignored as if it never came; the next push from a
     device that has it right corrects the record. */
  var SHAPE = {
    /* Bounded as well as shaped. Everything downstream loops over weeks,
       days and sets, so a block claiming a million weeks or a slot of a
       million sets — a corrupt record, an old build's bug — would hang the
       phone that drew it rather than merely look wrong. */
    ms: function (v) {
      return plain(v) && Array.isArray(v.days) && v.days.length > 0 && v.days.length <= 7 &&
        fin(v.acc) && v.acc >= 1 && v.acc <= 12 &&
        v.days.every(function (d) {
          return plain(d) && Array.isArray(d.s) && d.s.length <= 20 && d.s.every(function (s) {
            return plain(s) && typeof s.e === 'string' && fin(s.n) && s.n >= 1 && s.n <= 10;
          });
        });
    },
    wo: function (v) {
      return plain(v) && fin(v.st) && Array.isArray(v.x) && v.x.every(function (x) {
        return plain(x) && typeof x.e === 'string' && Array.isArray(x.s) && x.s.every(function (s) {
          return plain(s) && fin(s.w) && fin(s.r) && (s.q === undefined || fin(s.q)) &&
            (s.ty === undefined || s.ty === 'd' || s.ty === 'f' || s.ty === 'm');
        });
      }) && (v.nt === undefined || (typeof v.nt === 'string' && v.nt.length <= 1000));
    },
    cx: function (v) { return plain(v) && typeof v.n === 'string' && !!MUS[v.m]; },
    ax: function (v) {
      return plain(v) && fin(v.st) && !!HABITS[v.k] && fin(v.min) && v.min > 0 && v.min <= 720 &&
        (v.lv === undefined || !!LV[v.lv]) && (v.nm === undefined || (typeof v.nm === 'string' && v.nm.length <= 40)) &&
        // counted as a block's easy day
        (v.ms === undefined || (typeof v.ms === 'string' && fin(v.w) && fin(v.d)));
    },
    // a note that follows an exercise: the seat, the grip, the bench that wobbles
    nt: function (v) {
      return plain(v) && typeof v.e === 'string' &&
        (v.t === undefined || (typeof v.t === 'string' && v.t.length <= 200)) &&
        (v.u === undefined || (typeof v.u === 'string' && v.u.length <= 300 && /^https?:\/\//i.test(v.u))) &&
        !!((v.t && v.t.length) || (v.u && v.u.length));
    },
    // a routine of your own: a name and its lifts in order, each with its sets
    rt: function (v) {
      return plain(v) && typeof v.n === 'string' && v.n.length > 0 && v.n.length <= 60 &&
        Array.isArray(v.x) && v.x.length > 0 && v.x.length <= 20 && v.x.every(function (x) {
          return plain(x) && typeof x.e === 'string' && fin(x.n) && x.n >= 1 && x.n <= 10;
        });
    }
  };

  var T = loadT();
  var TS = loadTS();
  var PRSEEN = prSeen();
  var MSSEEN = msSeenAll();
  var REV = 0;                           // bumped on every change; the index below keys on it

  /* Settings travel setting by setting. They used to go as one piece, newest
     wins, so a phone that had only ever had the defaults (a tablet where
     somebody tapped "I'm new" before signing in) carried its empty back
     protection, lifting days and answers over everything the account had.
     Now a setting only this device's defaults hold was never chosen here,
     has no stamp, and the account's own wins. */
  function prSeen() {
    var o = {};
    Object.keys(T.pr).forEach(function (k) { o[k] = JSON.stringify(T.pr[k]); });
    return o;
  }
  // an older build's single stamp, standing for every setting it holds
  function prOwn() {
    if (TS.prk) return;
    TS.prk = {};
    if (TS.pr) Object.keys(T.pr).forEach(function (k) { TS.prk[k] = TS.pr; });
  }
  function prStamp(now) {
    prOwn();
    var was = PRSEEN || {};
    Object.keys(T.pr).concat(Object.keys(was)).forEach(function (k) {
      if (JSON.stringify(T.pr[k]) !== was[k]) TS.prk[k] = now;
    });
    PRSEEN = prSeen();
  }

  /* A block travels field by field too. It went as one piece with one stamp,
     newest wins, so a session skipped on one phone came back the moment the
     other phone saved a note on the block: the note's copy was the newer, and
     it still had the session waiting. A rename went the same way, and of two
     notes one was lost. Now each field carries the stamp of the change that
     made it, found the way the settings' are, by what moved since the last
     stamp, and a merge takes only the fields that are newer. */
  function msSeen(id) {
    var o = {}, ms = T.ms[id];
    if (ms) Object.keys(ms).forEach(function (f) { o[f] = JSON.stringify(ms[f]); });
    return o;
  }
  function msSeenAll() {
    var o = {};
    Object.keys(T.ms).forEach(function (id) { o[id] = msSeen(id); });
    return o;
  }
  // a block stamped before this, or taken whole from an older build: every field as new as its one stamp
  function mskOwn(id) {
    if (plain(TS.msk[id])) return TS.msk[id];
    var o = TS.msk[id] = {};
    if (T.ms[id] && TS.ms[id]) Object.keys(T.ms[id]).forEach(function (f) { o[f] = TS.ms[id]; });
    return o;
  }
  function msStamp(id, now) {
    if (!T.ms[id]) { delete TS.msk[id]; delete MSSEEN[id]; return; }
    var k = mskOwn(id), was = MSSEEN[id] || {};
    Object.keys(T.ms[id]).concat(Object.keys(was)).forEach(function (f) {
      if (JSON.stringify(T.ms[id][f]) !== was[f]) k[f] = now;
    });
    MSSEEN[id] = msSeen(id);
  }

  /* The stamps only after the log they describe. A stamp is what makes a
     change win on the other device, and a key with a stamp and no value is
     how a deletion is sent: stamps saved over a log that failed to save
     came back after a reload as "this workout was deleted" and "this
     setting is the old one, newer", and every other device believed them. */
  function saveT() {
    REV++;
    if (writeLS(LS_T, T)) writeLS(LS_TS, TS);
  }

  /* Whose clock a stamp is written by. Nourish learns how far this device's
     clock is out from the server's (mClockHear in app.js) and hands the
     corrected one over, because newest wins here too, and a phone set a day
     fast would otherwise win every merge for a day. */
  var CLOCK = null;
  var CLOCK_SLACK = 5 * 60000;          // how far ahead of us a stamp is let be
  function tnow() { return CLOCK ? CLOCK() : Date.now(); }

  /* A change, recorded. The stamp is what makes it win on the other device;
     the dirty mark is what makes it the only thing sent. */
  function stamp(part, key) {
    var now = tnow();
    if (key === undefined) {
      TS[part] = now;
      if (part === 'pr') prStamp(now);
      dirty[part] = true;
    } else {
      // the fields first: a block with none of its own yet takes them from the stamp it had
      if (part === 'ms') msStamp(key, now);
      TS[part][key] = now;
      if (dirty[part] !== true) { dirty[part] = dirty[part] || {}; dirty[part][key] = 1; }
    }
    saveT();
    push();
  }

  /* ------------------------------------------------------------------ sync
   *
   * The same bargain My Day strikes (see mSyncPayload in app.js), in
   * miniature: newest wins, key by key; a deletion travels as a null with a
   * stamp, because an absent key cannot say "gone"; after the first push of
   * a session only what moved is sent.
   *
   * One difference, on purpose. The first push waits for the server's own
   * answer to have been merged. set(merge:true) does not compare stamps — it
   * writes what it is given — so a device that had been asleep for a week
   * and pushed before it listened would put its week-old copy of a workout
   * back over the one you edited yesterday, on the server, where the other
   * phone's stamps could no longer save it. Listening first means the whole
   * push carries the newer copy of everything. */
  var doc = null, dirty = {}, dirtyAll = true, pushTimer = null, heard = false;
  /* The one retry waiting after a failed push. Each failure used to start
     its own chain of retries and none was ever cleared, so edits made during
     an outage multiplied the pushes in flight — one more chain for every
     failure — all of them sending everything. */
  var retryTimer = null;
  /* Whether the last save to the account landed. A write that fails used to
     fail in silence; now it says so, keeps trying, and says when it lands. */
  var SY = { ok: 0, err: 0, tries: 0 };

  /* A record a year.
   *
   * An account record holds a megabyte, and a year of four workouts a week is
   * about 300 KB of them, so one record for everything filled in about three
   * years. Workouts now live beside it, one record per calendar year
   * (users/{uid}/train/2026), each far inside its megabyte; everything else
   * stays in the one record.
   *
   * It needs the rule in firestore.rules that lets you reach them. Until
   * that is published the listener below is refused, and everything carries
   * on in the one record exactly as it did. Once it is, the workouts still in
   * the one record are copied to their years first and only taken out of it
   * once the copy has landed — nothing is ever in neither place.
   *
   * on:    null not yet known, true by year, false all in the one record
   * seen:  the stamp each workout has in its year's record, from the
   *        listener: a session's first full push sends only what is newer
   *        here, not ten years of workouts every time the app opens
   * main:  the workouts the one record still holds
   * gone:  the year of a workout deleted this session, so the deletion goes
   *        to the record that holds it */
  var YR = { on: null, heard: false, off: null, seen: {}, main: [], gone: {}, purge: {}, fv: null, kb: {} };

  function attach(d, fv) {
    doc = d || null;
    heard = false;
    dirtyAll = true;
    clearTimeout(pushTimer);
    clearTimeout(retryTimer); retryTimer = null;
    if (YR.off) { try { YR.off(); } catch (e) { /* already gone */ } }
    YR.off = null; YR.on = null; YR.heard = false; YR.seen = {}; YR.main = []; YR.purge = {}; YR.kb = {};
    YR.fv = fv || null;
    if (!doc || typeof doc.collection !== 'function') return;
    try {
      YR.off = doc.collection('train').onSnapshot({ includeMetadataChanges: true }, function (qs) {
        var moved = false, kb = {};
        qs.forEach(function (ds) {
          var d2 = ds.data() || {};
          if (plain(d2.wo)) {
            Object.keys(d2.wo).forEach(function (k) { var r = d2.wo[k]; if (plain(r) && fin(r.at)) YR.seen[k] = Math.max(YR.seen[k] || 0, r.at); });
            try { kb[ds.id] = Math.round(JSON.stringify(d2).length / 1024); } catch (e) { /* no size */ }
          }
          if (merge({ wo: d2.wo })) moved = true;
        });
        YR.kb = kb;
        var live = !(qs.metadata && qs.metadata.fromCache);
        if (live && !YR.heard) {
          YR.heard = true; YR.on = true;
          purgeMark();
          dirtyAll = true;
          push(true);
        }
        if (moved) drawIfShowing();
      }, function () {
        // refused: the rule is not published yet, so the one record it is
        YR.on = false; YR.heard = true; YR.off = null;
        push(true);
        drawIfShowing();
      });
    } catch (e) {
      YR.on = false; YR.heard = true;
    }
  }
  function yearOf(wo) { return wo && fin(wo.st) ? String(new Date(wo.st).getFullYear()) : ''; }
  // the year's record a workout (or its deletion) belongs in, or '' for the one record
  function woYear(k) { return T.wo[k] ? yearOf(T.wo[k]) : YR.gone[k] || ''; }
  /* Workouts the one record still holds, that this phone has: marked to go
     to their years, and out of the one record once they are there. */
  function purgeMark() {
    if (YR.on !== true) return;
    YR.main.forEach(function (k) {
      if (!woYear(k)) return;
      YR.purge[k] = 1;
      if (dirty.wo !== true) { dirty.wo = dirty.wo || {}; dirty.wo[k] = 1; }
    });
  }

  function payload(whole) {
    var out = {}, any = false;
    ['pr', 'act'].forEach(function (p) {
      if (!whole && !dirty[p]) return;
      out[p] = { v: T[p], at: TS[p] || 0 };
      if (p === 'pr') { prOwn(); out.pr.k = TS.prk; }
      any = true;
    });
    PARTS.forEach(function (p) {
      var keys = {};
      if (whole || dirty[p] === true) {
        Object.keys(T[p]).forEach(function (k) { keys[k] = 1; });
        Object.keys(TS[p]).forEach(function (k) { keys[k] = 1; });
      } else if (dirty[p]) {
        Object.keys(dirty[p]).forEach(function (k) { keys[k] = 1; });
      }
      var map = {};
      Object.keys(keys).forEach(function (k) {
        /* By year, a full push sends a workout only when this phone's copy is
           newer than the one its year holds — or it is one the one record
           still has, on its way to its year. */
        if (p === 'wo' && YR.on === true && (whole || dirty.wo === true) && !(dirty.wo && dirty.wo !== true && dirty.wo[k]) &&
          !YR.purge[k] && woYear(k) && (TS.wo[k] || 0) <= (YR.seen[k] || 0)) return;
        map[k] = { v: T[p][k] || null, at: TS[p][k] || 0 };
        // a block goes with each field's own stamp
        if (p === 'ms' && T.ms[k]) map[k].k = mskOwn(k);
      });
      if (Object.keys(map).length) { out[p] = map; any = true; }
    });
    return any ? clean(out) : null;
  }

  function take() {
    var body = payload(dirtyAll);
    dirtyAll = false;
    dirty = {};
    return body;
  }

  function push(now) {
    // where the workouts go is not known until the years have answered
    if (!doc || !heard || (typeof doc.collection === 'function' && !YR.heard)) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      if (!doc) return;
      var body = take();
      if (!body) return;
      var writes = [], purge = [], d0 = doc;
      if (YR.on === true && body.wo) {
        var byY = {}, keep = {};
        Object.keys(body.wo).forEach(function (k) {
          var y = woYear(k);
          if (y) { (byY[y] = byY[y] || {})[k] = body.wo[k]; if (YR.purge[k]) purge.push(k); } else keep[k] = body.wo[k];
        });
        Object.keys(byY).forEach(function (y) {
          writes.push(d0.collection('train').doc(y).set({ wo: byY[y] }, { merge: true }).then(function () {
            Object.keys(byY[y]).forEach(function (k) { YR.seen[k] = Math.max(YR.seen[k] || 0, byY[y][k].at); });
          }));
        });
        if (Object.keys(keep).length) body.wo = keep; else delete body.wo;
      }
      if (Object.keys(body).length) writes.push(d0.set({ train: body }, { merge: true }));
      Promise.all(writes).then(function () {
        /* Landed in their years: now, and only now, out of the one record. */
        var fv = YR.fv;
        if (!purge.length || !fv || typeof fv.delete !== 'function' || d0 !== doc) return null;
        var del = {};
        purge.forEach(function (k) { del[k] = fv.delete(); });
        return d0.set({ train: { wo: del } }, { merge: true }).then(function () {
          purge.forEach(function (k) { delete YR.purge[k]; });
          YR.main = YR.main.filter(function (k) { return purge.indexOf(k) < 0; });
        });
      }).then(function () {
        var was = SY.err;
        SY.ok = Date.now(); SY.err = 0; SY.tries = 0;
        if (was) drawIfShowing();
      }, function () {
        // a write that never landed leaves no way to say what the far end
        // is missing, so the next one says everything
        dirtyAll = true;
        SY.err = Date.now(); SY.tries++;
        drawIfShowing();
        // and it tries again, backing off to five minutes — once, not once per failure
        clearTimeout(retryTimer);
        retryTimer = setTimeout(function () { retryTimer = null; push(true); },
          Math.min(300, 15 * Math.pow(2, SY.tries - 1)) * 1000);
      });
    }, now ? 0 : 900);
  }

  /* Newest wins, piece by piece. True when anything here changed. */
  function merge(tr, main) {
    if (!plain(tr)) return false;
    var moved = false, actWas = T.act;
    /* A stamp from the future is a device with the wrong time on it, and
       would win here until the real time caught up. Capped a few minutes
       ahead of our own corrected clock and kept capped; the next whole push
       carries the cap back up. The same rule My Day's merge keeps. */
    var cap = tnow() + CLOCK_SLACK;
    var when = function (at) { return at > cap ? cap : at; };
    if (plain(tr.pr) && fin(tr.pr.at) && plain(tr.pr.v)) {
      /* Setting by setting, each newer than this device's own. From a build
         without them, every setting it sent is as new as its one stamp. */
      prOwn();
      var ink = plain(tr.pr.k) ? tr.pr.k : null, nv = clean(T.pr), took = false;
      var keys = ink ? Object.keys(ink) : Object.keys(tr.pr.v).concat(Object.keys(nv).filter(function (k) { return tr.pr.v[k] === undefined; }));
      keys.forEach(function (k) {
        var at = ink ? ink[k] : tr.pr.at;
        // a setting's name, never an object's own machinery (__proto__)
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(k) || !fin(at) || !(when(at) > (TS.prk[k] || 0))) return;
        if (tr.pr.v[k] === undefined) delete nv[k]; else nv[k] = tr.pr.v[k];
        TS.prk[k] = when(at);
        took = true;
      });
      if (took) {
        T.pr = defaultsPr(nv);
        TS.pr = Math.max(TS.pr || 0, when(tr.pr.at));
        PRSEEN = prSeen();
        moved = true;
      }
    }
    if (plain(tr.act) && fin(tr.act.at) && when(tr.act.at) > (TS.act || 0) && typeof tr.act.v === 'string') {
      T.act = tr.act.v; TS.act = when(tr.act.at); moved = true;
    }
    /* A block both phones have, from a build that stamps its fields: each
       field newer than this phone's own is taken, whatever the stamp on the
       whole says — a note typed here after a skip there is newer as a block,
       and older as a skip. Anything else (a block only one side has, a
       deletion, an older build's copy) goes whole, newest wins, as before. */
    var msFields = function (k, r) {
      var mine = mskOwn(k), nv = clean(T.ms[k]), took = [];
      Object.keys(r.k).forEach(function (f) {
        var at = r.k[f];
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(f) || !fin(at) || !(when(at) > (mine[f] || 0))) return;
        if (r.v[f] === undefined) delete nv[f]; else nv[f] = r.v[f];
        took.push(f);
      });
      if (!took.length || !SHAPE.ms(nv)) return false;
      T.ms[k] = nv;
      MSSEEN[k] = MSSEEN[k] || {};
      took.forEach(function (f) {
        mine[f] = when(r.k[f]);
        if (nv[f] === undefined) delete MSSEEN[k][f]; else MSSEEN[k][f] = JSON.stringify(nv[f]);
      });
      TS.ms[k] = Math.max(TS.ms[k] || 0, when(r.at));
      return true;
    };
    PARTS.forEach(function (p) {
      var from = plain(tr[p]) ? tr[p] : {};
      Object.keys(from).forEach(function (k) {
        var r = from[k];
        if (p === 'ms' && plain(r) && fin(r.at) && plain(r.v) && plain(r.k) && T.ms[k]) {
          if (msFields(k, r)) moved = true;
          return;
        }
        if (!plain(r) || !fin(r.at) || !(when(r.at) > (TS[p][k] || 0))) return;
        if (r.v !== null && !SHAPE[p](r.v)) return;
        /* A workout deleted by a phone still on the one record: the deletion
           goes on to its year, so what was deleted does not stay there. */
        if (r.v === null && main && p === 'wo' && T.wo[k] && YR.on === true) {
          YR.gone[k] = yearOf(T.wo[k]);
          if (dirty.wo !== true) { dirty.wo = dirty.wo || {}; dirty.wo[k] = 1; }
        }
        if (r.v === null) delete T[p][k]; else T[p][k] = r.v;
        TS[p][k] = when(r.at);
        if (p === 'ms') {
          /* Taken whole: its fields' stamps with it, or, from a build without
             them, none — every field then as new as the one stamp (mskOwn). */
          delete TS.msk[k];
          if (r.v && plain(r.k)) {
            var o = TS.msk[k] = {};
            Object.keys(r.k).forEach(function (f) { if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(f) && fin(r.k[f])) o[f] = when(r.k[f]); });
          }
          if (r.v) MSSEEN[k] = msSeen(k); else delete MSSEEN[k];
        }
        moved = true;
      });
    });
    /* Deleted on one phone, renamed on the other a moment later: the rename
       is the newer word on the block, so the block came back — but with
       `act` cleared by the deletion, on both phones, and nothing running.
       The block that was current and is back is current again. */
    if (actWas && !T.act && T.ms[actWas] && (TS.ms[actWas] || 0) > (TS.act || 0)) {
      T.act = actWas; TS.act = TS.ms[actWas]; moved = true;
    }
    if (moved) saveT();
    return moved;
  }

  /* What the account says, handed over by app.js's listener. `live` is
     false for an answer served from this device's own cache. */
  function remote(tr, live) {
    var moved = tr ? merge(tr, true) : false;
    if (live) {
      YR.main = tr && plain(tr.wo) ? Object.keys(tr.wo).filter(function (k) { return plain(tr.wo[k]) && tr.wo[k].v !== null; }) : [];
      if (YR.on === true && YR.main.some(function (k) { return !YR.purge[k] && woYear(k); })) purgeMark();
      if (YR.on === true && dirty.wo) push();
    }
    if (live && !heard && doc) {
      heard = true;
      dirtyAll = true;
      push(true);
    }
    if (moved) drawIfShowing();
  }

  /* Everything of yours, gone from this device: sign-out, account deletion,
     or somebody else signing in here. The same moments My Day forgets its
     own, and for the same reason — the next push would otherwise carry this
     person's training into the next person's account. */
  function forget() {
    T = blankT();
    TS = blankTS();
    PRSEEN = prSeen();
    MSSEEN = {};
    YR.gone = {}; YR.purge = {};
    dirty = {};
    dirtyAll = true;
    clearTimeout(pushTimer);
    clearTimeout(retryTimer); retryTimer = null;
    [LS_T, LS_TS, LS_LIVE].forEach(function (k) { writeLS(k, null); });
    LIVE = null;
    REV++;
    stopWake();
    drawIfShowing();
  }

  /* --------------------------------------------------------------- lookups */
  function lib(id) {
    if (LIB[id]) return LIB[id];
    var c = T.cx[id];
    if (c) {
      var k = c.k === 'c' ? 'c' : 'i';
      return { id: id, n: c.n, m: c.m, k: k, q: EQUIP[c.q] ? c.q : 'mc', p: '',
        rr: k === 'c' ? [8, 12] : [10, 15], own: true, o: 1e4 };
    }
    return { id: id, n: 'Unknown exercise', m: 'chest', k: 'i', q: 'mc', p: '', rr: [8, 12], o: 1e5 };
  }
  function musOf(id) { return lib(id).m; }

  /* A note is kept under the exercise's id with anything but letters and
     digits taken out, the way every other key here is, and carries the id
     itself so two that squeeze to the same key cannot be mistaken. */
  function ntKey(e) { return 'n' + String(e).replace(/[^A-Za-z0-9]/g, ''); }
  function noteOf(e) {
    var n = T.nt[ntKey(e)];
    return n && n.e === e ? n.t || '' : '';
  }
  // a link to how it is done: a video you trust, your coach's clip
  function linkOf(e) {
    var n = T.nt[ntKey(e)];
    return n && n.e === e ? n.u || '' : '';
  }
  // what a pasted link becomes: https:// added to a bare address, anything else refused
  function cleanLink(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    return /^https?:\/\/[^\s<>"']+$/i.test(u) && u.length <= 300 ? u : null;
  }
  /* The bar a lift is loaded on: yours if you set one, else an EZ bar for
     the EZ-bar lifts, a Smith machine's for the Smith lifts (they run
     about 15 to 25 lb, some counterweighted to nothing, so it is shown to
     be checked), else the default bar in Settings. */
  /* The bars a gym has, by name, the way Strong lists them. An EZ bar is
     lighter than most people guess (15 lb); a Smith machine's bar is
     anybody's guess, which is why it is always shown beside the lift. */
  var BARS = [
    { k: 'oly', n: 'Olympic bar', lb: 45, kg: 20 },
    { k: 'short', n: 'Short bar', lb: 33, kg: 15 },
    { k: 'ez', n: 'EZ bar', lb: 15, kg: 7 },
    { k: 'hex', n: 'Hex bar', lb: 75, kg: 34 },
    { k: 'smith', n: 'Smith machine', lb: 20, kg: 10 },
    { k: 'none', n: 'No bar', lb: 0, kg: 0 }
  ];
  function barW(k) {
    for (var i = 0; i < BARS.length; i++) if (BARS[i].k === k) return T.pr.u === 'kg' ? BARS[i].kg : BARS[i].lb;
    return T.pr.bar;
  }
  function barFor(e) {
    var b = T.pr.bars[ntKey(e)];
    if (b && b.e === e) return conv(b.w, b.u);
    var ex = lib(e);
    if (SLED[e]) return 0;
    if (/\bez\b/i.test(ex.n)) return barW('ez');
    if (ex.q === 'sm') return barW('smith');
    if (e === 'trap-dl') return barW('hex');
    return T.pr.bar;
  }
  // "Olympic bar 45 lb", "Smith bar 20 lb", "bar 50 lb" for one of your own, "no bar"
  function barLabel(e) {
    if (SLED[e] && !barSet(e)) return 'plates only';
    var n = barName(e), w = fmtN(barFor(e)) + ' ' + T.pr.u;
    if (n === 'No bar') return 'no bar';
    if (n === 'Bar') return 'bar ' + w;
    return (n === 'Smith machine' ? 'Smith bar' : n) + ' ' + w;
  }
  // "Olympic bar", or plainly "Bar" for a weight no named bar has
  function barName(e) {
    var w = barFor(e), ex = lib(e);
    if (ex.q === 'sm' && w === barW('smith')) return 'Smith machine';
    // a sled is never an Olympic bar, whatever it weighs
    if (SLED[e]) return 'Sled';
    for (var i = 0; i < BARS.length; i++) if ((T.pr.u === 'kg' ? BARS[i].kg : BARS[i].lb) === w) return BARS[i].n;
    return 'Bar';
  }
  function barSet(e) { var b = T.pr.bars[ntKey(e)]; return !!(b && b.e === e); }
  function setBar(e, w) {
    var k = ntKey(e), bars = Object.assign({}, T.pr.bars);
    if (w === null) delete bars[k]; else bars[k] = { e: e, w: w, u: T.pr.u };
    T.pr.bars = bars;
    stamp('pr');
  }
  /* Plate-loaded machines: plates on the horns of a sled, and the sled not
     counted. Blake logs the plates only, as most lifters do, since a sled's
     own weight is anybody's guess from one gym to the next; so the plates
     are drawn and worked out as for a bar that weighs nothing. A sled
     weight of your own can still be set, like a bar of your own. */
  var SLED = { hack: 1, 'leg-press': 1, 'belt-squat': 1 };
  // lifts loaded with plates: on a bar, or on a sled
  function onBar(ex) { return ex.q === 'bb' || ex.q === 'sm' || !!SLED[ex.id]; }

  /* Home and the gym.
   *
   * The gym has every plate there is, as many as you like, and each lift's
   * own bar. Home has the plates you own, counted in pairs, and one bar you
   * weighed. At home the plates in each row are what yours can make, and the
   * weight a set suggests is the nearest one you can load — up to the next
   * one when it was meant to go up, so a missing 2.5 never keeps you at the
   * same weight for ever. */
  var PL_SIZES = { lb: [55, 45, 35, 25, 15, 10, 5, 2.5], kg: [25, 20, 15, 10, 5, 2.5, 1.25] };
  var PL_HOME = { lb: { 45: 2, 25: 1, 10: 2, 5: 2, 2.5: 1 }, kg: { 20: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 1 } };
  function cleanGy(g) {
    g = plain(g) ? g : {};
    var pl = {};
    if (plain(g.pl)) Object.keys(g.pl).forEach(function (k) {
      var n = g.pl[k];
      if (fin(+k) && +k > 0 && +k <= 100 && fin(n) && n >= 0 && n <= 10) pl[k] = Math.round(n);
    });
    return { on: g.on === 1 ? 1 : 0, bar: fin(g.bar) && g.bar >= 0 && g.bar <= 100 ? g.bar : null, pl: pl,
      u: g.u === 'kg' ? 'kg' : 'lb', last: g.last === 'home' ? 'home' : 'gym' };
  }
  // this workout is at home, with home set up in the unit you lift in
  function homeNow() { var g = T.pr.gy; return !!(g && g.on && g.u === T.pr.u && LIVE && LIVE.g === 'home'); }
  function homeBar() { var g = T.pr.gy; return fin(g.bar) ? g.bar : T.pr.bar; }
  // the bar for a lift where you are: at home, yours
  function barAt(e) { return homeNow() && onBar(lib(e)) && !SLED[e] ? homeBar() : barFor(e); }
  function barLabelAt(e) { return homeNow() && onBar(lib(e)) && !SLED[e] ? 'home bar ' + fmtN(homeBar()) + ' ' + T.pr.u : barLabel(e); }
  function homeInv() { return homeNow() ? T.pr.gy.pl : null; }
  /* Every total the home plates can make on the home bar, lightest first,
     worked in quarters so 1.25 kg adds up exactly. */
  var LOADS = { k: '', v: [] };
  function homeLoads() {
    var g = T.pr.gy, key = JSON.stringify(g.pl) + '|' + homeBar();
    if (LOADS.k === key) return LOADS.v;
    var sums = { 0: 1 };
    Object.keys(g.pl).forEach(function (k) {
      var q = Math.round(+k * 4), n = g.pl[k], next = {};
      Object.keys(sums).forEach(function (a) { for (var i = 0; i <= n; i++) next[+a + i * q] = 1; });
      sums = next;
    });
    var bar = homeBar();
    LOADS = { k: key, v: Object.keys(sums).map(function (a) { return bar + 2 * (+a / 4); }).sort(function (a, b) { return a - b; }) };
    return LOADS.v;
  }
  /* The nearest weight you can load at home: up to the next one when the
     weight is meant to rise, else the closest, the lighter on a tie. */
  function snapHome(w, up) {
    var v = homeLoads();
    if (!v.length || !fin(w)) return w;
    if (up) { for (var i = 0; i < v.length; i++) if (v[i] >= w - 1e-9) return v[i]; return v[v.length - 1]; }
    var best = v[0];
    v.forEach(function (x) { if (Math.abs(x - w) < Math.abs(best - w) - 1e-9) best = x; });
    return best;
  }

  /* What goes on each side, drawn end-on the way the bar looks from the
     rack: the sleeve, then the plates biggest first, taller the bigger. A
     weight that the plates cannot make says what is left over rather than
     rounding it away. Five or more plates of a kind fold to one with a
     count, so a heavy deadlift still fits the box. */
  var PL_H = { lb: { 45: 1, 35: 0.88, 25: 0.76, 10: 0.62, 5: 0.54, 2.5: 0.46 },
    kg: { 25: 1, 20: 1, 15: 0.9, 10: 0.78, 5: 0.62, 2.5: 0.54, 1.25: 0.46 } };
  // "pl-lb-45": the colour class for a plate, by its weight in the unit you lift in
  function plCls(p) { return 'pl-' + T.pr.u + '-' + String(p).replace('.', '_'); }
  function stackHTML(w, bar, dim, room) {
    if (w === null || !(w > 0)) return '';
    var u = T.pr.u, pm = plateMath(w, bar, u, homeInv());
    if (pm.under) return '<span class="tr-stk tr-stk-x">under the bar</span>';
    var ps = pm.plates, groups = [];
    ps.forEach(function (x) {
      var g = groups[groups.length - 1];
      if (ps.length > (room || 4) && g && g.p === x) g.n++; else groups.push({ p: x, n: 1 });
    });
    var say = (ps.length ? ps.map(fmtP).join(', ') + ' a side' : 'just the bar') +
      (pm.left > 0 ? ', ' + fmtP(pm.left) + ' ' + u + ' a side that the plates cannot make' : '');
    return '<span class="tr-stk' + (dim ? ' dim' : '') + '" role="img" aria-label="' + esc(say) + '">' +
      '<i class="tr-stk-bar"></i>' +
      (ps.length ? groups.map(function (g) {
        return '<b class="tr-stk-p ' + plCls(g.p) + '" style="--h:' + ((PL_H[u] || {})[g.p] || 0.5) + '">' + fmtP(g.p) +
          (g.n > 1 ? '<small>\u00d7' + g.n + '</small>' : '') + '</b>';
      }).join('') : '<span class="tr-stk-e">bar only</span>') +
      '<i class="tr-stk-end"></i>' +
      (pm.left > 0 ? '<span class="tr-stk-left">+' + fmtP(pm.left) + '?</span>' : '') +
    '</span>';
  }

  function setNote(e, t, u) {
    t = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    u = u === undefined ? linkOf(e) : u || '';
    var k = ntKey(e), v = { e: e };
    if (t) v.t = t;
    if (u) v.u = u;
    if (t || u) T.nt[k] = v; else if (T.nt[k]) delete T.nt[k]; else return;
    stamp('nt', k);
  }
  function allEx() {
    return LIB_LIST.concat(Object.keys(T.cx).map(lib));
  }

  var LIVE = readLS(LS_LIVE);
  if (!plain(LIVE) || !Array.isArray(LIVE.x)) LIVE = null;
  function setLive(v) {
    // a new workout opens full screen, whatever the last one was left at
    if (v && (!LIVE || LIVE.id !== v.id)) S.minim = 0;
    LIVE = v; writeLS(LS_LIVE, v);
  }
  function saveLive() { writeLS(LS_LIVE, LIVE); }

  /* The workouts, sorted and indexed once per change rather than walked on
     every lookup — the block view asks the same questions dozens of times a
     draw. */
  var IX = null;
  function ix() {
    weighIns();
    if (IX && IX.rev === REV && IX.wk === WTS.raw) return IX;
    var list = Object.keys(T.wo).map(function (k) { return T.wo[k]; })
      .filter(function (w) { return w && fin(w.st); })
      .sort(function (a, b) { return a.st - b.st; });
    var slot = {};
    list.forEach(function (w) {
      if (w.ms) slot[w.ms + ':' + w.w + ':' + w.d] = w;       // the latest wins
    });
    /* Records in the same pass. Walked in time order, so a record is a set
       that beat everything BEFORE it — and the first time you do a lift is
       not a record, because there was nothing to beat. That keeps the star
       meaning something. */
    var best = {}, prs = {};
    list.forEach(function (wo) {
      var out = [];
      var before = {};
      wo.x.forEach(function (x) { if (!before[x.e]) before[x.e] = best[x.e] || null; });
      wo.x.forEach(function (x) {
        var had = before[x.e];
        var now = best[x.e] || { e1: 0, w: 0, r: 0, vol: 0 };
        // a warm-up is never a record: 45 × 14 is not your most reps on the bench
        var work = x.s.filter(counts);
        // bodyweight only for a lift that counts it: looking it up reads every weigh-in, and this runs for every lift of every workout
        var hit = had ? beats(had, work, wo.u, x.e, usesBw(x.e) ? woBw(wo) : null) : '';
        var bw = bwFor(x.e, wo);
        work.forEach(function (s) {
          var w = conv(s.w, wo.u);
          now.e1 = Math.max(now.e1, e1Of(x.e, w, s.r, bw));
          // the help on an assisted lift is not a weight lifted: no heaviest, no best set
          if (!ASST[x.e]) { now.w = Math.max(now.w, w); now.vol = Math.max(now.vol, w * s.r); }
          // reps with the machine helping are not your most reps
          if (!(w < 0)) now.r = Math.max(now.r, s.r);
        });
        best[x.e] = now;
        if (hit) out.push({ e: x.e, what: hit });
      });
      prs[wo.id] = out;
    });
    var ez = {};
    Object.keys(T.ax).forEach(function (k) {
      var a = T.ax[k];
      if (a && a.ms) ez[a.ms + ':' + a.w + ':' + a.d] = a;
    });
    IX = { rev: REV, wk: WTS.raw, list: list, slot: slot, best: best, prs: prs, ez: ez };
    return IX;
  }
  function woFor(ms, w, d) { return ix().slot[ms.id + ':' + w + ':' + d] || null; }
  /* An easy day is done by anything logged outside the gym and counted as
     it: a walk, a ride, a round of golf. */
  function isEz(ms, d) { return !!(ms.days[d] && ms.days[d].ez); }
  function ezFor(ms, w, d) { return isEz(ms, d) ? ix().ez[ms.id + ':' + w + ':' + d] || null : null; }
  function slotDone(ms, w, d) { return woFor(ms, w, d) || ezFor(ms, w, d); }
  function exIn(wo, e) {
    for (var i = 0; i < wo.x.length; i++) if (wo.x[i].e === e) return wo.x[i];
    return null;
  }

  /* ------------------------------------------------------------- the maths */

  /* Weights are stored in the unit they were lifted in and shown in the one
     you read in now, so switching to kilograms does not rewrite a year of
     history in pounds. */
  function conv(w, from) {
    var to = T.pr.u;
    if (!fin(w) || from === to || (from !== 'kg' && from !== 'lb')) return w;
    var v = from === 'kg' ? w * 2.20462 : w / 2.20462;
    return Math.round(v * 2) / 2;
  }
  function inc(ex) {
    if (T.pr.u === 'kg') return ex.q === 'db' ? 2 : 2.5;
    return 5;
  }
  function roundTo(w, step) { return Math.round(w / step) * step; }
  function fmtN(v) {
    if (!fin(v)) return '';
    var r = Math.round(v * 10) / 10;
    return String(r % 1 ? r.toFixed(1) : r);
  }
  function fmtBig(v) { return Math.round(v).toLocaleString('en-US'); }
  // a plate is 1.25, not 1.3: to the hundredth, which is as fine as plates go
  function fmtP(v) { return fin(v) ? String(Math.round(v * 100) / 100) : ''; }

  /* Epley. Reps only, not reps plus what you had left: the app does not see
     how close you went, and an estimate built on a guess about effort is two
     guesses. So this underestimates a set left well short of failure, the
     same way for every set, which is what a trend line needs. */
  function e1rm(w, r) {
    if (!fin(w) || !fin(r) || w <= 0 || r <= 0) return 0;
    return r === 1 ? w : w * (1 + r / 30);
  }

  /* Pull-ups, chin-ups and dips lift you, so their strength is your weight
     plus whatever hangs from the belt. The weight comes from Nourish's
     weigh-ins (see bwInfo). Nothing older than a fortnight, so a stale
     number never moves a record. Without one, these lifts are counted in
     reps alone, as before. */
  var BWL = { pullup: 1, chinup: 1, 'pullup-neg': 1, dip: 1 };
  /* The assisted machine versions: the weight typed is the help, so less of
     it is progress, and your weight counts too — you, less the help. */
  var ASST = { 'as-pullup': 1, 'as-dip': 1 };
  // lifts that need your weight to mean anything
  function usesBw(e) { return !!(BWL[e] || ASST[e]); }
  /* Your body is the weight: the box is for what is added to it, and empty
     (or 0) is the body alone, said as BW rather than a grey 0 lb. */
  function onBody(e) { return !ASST[e] && (!!BWL[e] || lib(e).q === 'bw'); }
  // parsed once per change to what Nourish has stored, however often it is asked
  var WTS = { raw: null, v: {} };
  function weighIns() {
    var raw = null;
    try { raw = localStorage.getItem('bsc.macroWeights'); } catch (e) { raw = null; }
    if (raw !== WTS.raw) {
      var v = null;
      try { v = JSON.parse(raw); } catch (e) { v = null; }
      WTS = { raw: raw, v: plain(v) ? v : {} };
    }
    return WTS.v;
  }
  /* Your weight on a day, and how sure of it. The week's average when there
     are three or more weigh-ins in the seven days to it, which is steadier
     than any one reading; else that day's own weigh-in; else the latest in
     the fortnight before, which counts but is not trusted: on the day
     itself Strengthen asks rather than lean on it (bwNeed). */
  function bwInfo(dk, u) {
    if (typeof dk !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dk)) return null;
    var back = function (n) { var d = new Date(dk + 'T12:00:00'); d.setDate(d.getDate() - n); return dayKey(d); };
    var f7 = back(6), f14 = back(14), w = weighIns(), wk = [], last = '';
    Object.keys(w).forEach(function (k) {
      if (k > dk || !fin(w[k]) || !(w[k] > 0)) return;
      if (k >= f7) wk.push(w[k]);
      if (k >= f14 && k > last) last = k;
    });
    var cv = function (lb) { return Math.round((u === 'kg' ? lb / 2.20462 : lb) * 10) / 10; };
    if (wk.length >= 3) return { v: cv(wk.reduce(function (a, b) { return a + b; }, 0) / wk.length), src: 'avg', n: wk.length };
    if (fin(w[dk]) && w[dk] > 0) return { v: cv(w[dk]), src: 'day', k: dk };
    if (last) return { v: cv(w[last]), src: 'old', k: last };
    return null;
  }
  function bwOn(dk, u) { var b = bwInfo(dk, u); return b ? b.v : null; }
  // a workout's bodyweight in its own unit: kept when it was saved, else looked up
  function woBw(wo) { return wo && fin(wo.bw) && wo.bw > 0 ? wo.bw : wo ? bwOn(wo.dk, wo.u) : null; }
  // the same, in the unit you lift in, for a lift that lifts you; null for any other
  function bwFor(e, wo) { if (!usesBw(e)) return null; var b = woBw(wo); return fin(b) ? conv(b, wo.u) : null; }
  // a set's estimated max, counting your weight on the lifts that lift you
  function e1Of(e, w, r, bw) {
    // with the machine's help: you, less the help
    if (ASST[e]) return fin(bw) && bw > 0 ? e1rm(Math.max(0, bw - (fin(w) ? w : 0)), r) : 0;
    if (!BWL[e]) return e1rm(w, r);
    return fin(bw) && bw > 0 ? e1rm(bw + (fin(w) ? w : 0), r) : 0;
  }
  /* A set that counts: not a warm-up on the way up, and not an attempt that
     was missed. Records, volume, targets and the review read only these. */
  function counts(s) { return !!s && !s.wu && s.ty !== 'm'; }
  function bestE1(sets, u) {
    var b = 0;
    sets.forEach(function (s) { var v = e1rm(conv(s.w, u), s.r); if (v > b) b = v; });
    return b;
  }
  /* A lift's best in a session, for comparing one session with another. On
     an assisted lift the weight typed is the machine's help, so bestE1 read
     less help as less lifted: 60 lb of help down to 50 held the back's sets
     "because you were weaker". There it is you, less the help, when your
     weight is known, and nothing to compare when it is not. */
  function liftE1(x, wo) {
    if (!ASST[x.e]) return bestE1(x.s, wo.u);
    var bw = bwFor(x.e, wo), b = 0;
    if (!fin(bw)) return 0;
    x.s.forEach(function (z) { var v = e1Of(x.e, conv(z.w, wo.u), z.r, bw); if (v > b) b = v; });
    return b;
  }
  // the best set on an assisted lift: the least help, then the most reps
  function leastHelp(sets, u) {
    var t = null;
    sets.forEach(function (s) {
      var w = conv(s.w, u);
      if (!t || w < t.w || (w === t.w && s.r > t.r)) t = { w: w, r: s.r };
    });
    return t;
  }
  function topSet(sets, u) {
    var t = null;
    sets.forEach(function (s) {
      var w = conv(s.w, u);
      if (!t || w > t.w || (w === t.w && s.r > t.r)) t = { w: w, r: s.r };
    });
    return t;
  }

  /* Reps in reserve for a week of the block. Three at the start, none at the
     end, evenly between: the ramp RP runs, and the region Robinson et al.
     (2024) found most of the growth in. Heavy barbell and Smith lifts stop
     at one — Refalo et al. (2023) saw nothing gained by the last rep, and
     the last rep of a heavy squat is the one that goes wrong. */
  function isKeep(ms) { return !!ms && ms.goal === 'keep'; }
  /* Keeping and starting out are both steady: the sets hold unless a
     session says otherwise. */
  function steady(ms) { return !!ms && (ms.goal === 'keep' || ms.goal === 'base' || ms.goal === 'cond'); }
  /* A steady block has no deload week — nothing accumulates at that dose —
     so its weeks are all working weeks. */
  function accOf(ms) {
    if (steady(ms)) return ms.acc;
    return fin(ms.dlw) ? Math.min(ms.acc, ms.dlw) : ms.acc;
  }
  function weeksOf(ms) { return steady(ms) ? ms.acc : accOf(ms) + 1; }
  /* Keeping holds effort steady at about two reps short on the big lifts and
     one on the small ones: heavy enough that strength has a reason to stay,
     far enough from failure that it never costs a round of golf. Starting
     out begins at three, while the movements are still being learned, and
     eases to two halfway. A block for a fat-loss phase stops a rep short of
     failure: the last rep costs recovery that eating less cannot spare, and
     buys little (Refalo et al. 2023). */
  function rirFor(ms, w) {
    var n = accOf(ms);
    if (w >= n) return null;
    if (isKeep(ms)) return 2;
    if (ms.goal === 'base') return w < Math.ceil(n / 2) ? 3 : 2;
    // strength waves: the main lifts go by their percentages; the rest is steady
    if (ms.goal === 'str' || ms.goal === 'cond') return 2;
    if (n <= 1) return 2;
    var r = Math.round(3 * (1 - w / (n - 1)));
    var c = capAt(ms, w);
    return c && c <= 0.7 ? Math.max(1, r) : r;
  }
  function exRir(ex, rir, keep) {
    if (rir === null) return null;
    if (keep && ex.k !== 'c') return Math.max(0, rir - 1);
    return ex.k === 'c' && (ex.q === 'bb' || ex.q === 'sm') ? Math.max(1, rir) : rir;
  }
  /* A lift's own rest if you set one, else the compound or the isolation
     rest from Settings. */
  function restFor(ex) {
    var r = T.pr.rests && T.pr.rests[ntKey(ex.id)];
    if (r && r.e === ex.id) return r.s;
    return ex.k === 'c' ? T.pr.rc : T.pr.ri;
  }
  function restSet(e) { var r = T.pr.rests[ntKey(e)]; return !!(r && r.e === e); }
  function setRest(e, s) {
    var k = ntKey(e), rests = Object.assign({}, T.pr.rests);
    if (s === null) delete rests[k]; else rests[k] = { e: e, s: s };
    T.pr.rests = rests;
    stamp('pr');
    // the workout open now takes it at once
    if (LIVE) LIVE.x.forEach(function (x) { if (x.e === e) x.rest = restFor(lib(e)); });
  }

  // which measure a lift's badge shows: the change in volume unless you chose another
  function fmFor(e) { var f = T.pr.fm && T.pr.fm[ntKey(e)]; return f && f.e === e ? f.m : 'vc'; }
  function setFm(e, m) {
    var k = ntKey(e), fm = Object.assign({}, T.pr.fm);
    if (m === 'vc') delete fm[k]; else fm[k] = { e: e, m: m };
    T.pr.fm = fm;
    stamp('pr');
  }

  /* The last time this exercise was done properly: not in a deload, where
     the weights are light on purpose and would drag next week's down. */
  function lastPerf(e, before) {
    var list = ix().list;
    for (var i = list.length - 1; i >= 0; i--) {
      var w = list[i];
      if (before && w.st >= before) continue;
      if (w.dl) continue;
      var x = exIn(w, e);
      if (x && x.s.length) return { s: x.s, u: w.u, st: w.st, pq: x.pq };
    }
    return null;
  }

  /* What to lift next time, by the rule every logbook app runs: double
     progression. Reached the top of the range on your best set? Add the
     smallest jump the kit allows and expect about two fewer reps — each rep
     is worth roughly three per cent of a max by Epley, and a jump is about
     five. Didn't? Same weight, one more rep, which is what dropping one rep
     in reserve a week asks of you anyway. pq is the reps in reserve this
     time's plan asks for, when there is a plan; see byEffort. */
  function target(ex, ms, w, d, dl, pq) {
    var src = null;
    if (ms && w > 0) {
      var pw = woFor(ms, w - 1, d);
      var px = pw && !pw.dl && exIn(pw, ex.id);
      if (px && px.s.length) src = { s: px.s, u: pw.u, pq: px.pq };
    }
    if (!src) src = lastPerf(ex.id);
    if (!src) return { tw: null, tr: null, prev: [] };
    var prev = src.s.filter(function (s) { return s.ty !== 'm'; }).map(function (s) { return { w: conv(s.w, src.u), r: s.r, wu: s.wu ? 1 : 0 }; });
    // next time's weight is worked from the working sets, never the warm-ups
    var work = src.s.filter(counts);
    if (!work.length && !prev.length) return { tw: null, tr: null, prev: [] };
    var top = (ASST[ex.id] ? leastHelp : topSet)(work.length ? work : src.s.filter(function (s) { return s.ty !== 'm'; }), src.u);
    var step = inc(ex);
    if (dl) {
      /* Half the sets, and the weights of week one — RP's deload is less of
         everything, not nothing, so the groove is kept while the fatigue
         drains. */
      var first = ms && woFor(ms, 0, d);
      var fx = first && exIn(first, ex.id);
      var ft = fx && fx.s.filter(counts).length ? (ASST[ex.id] ? leastHelp : topSet)(fx.s.filter(counts), first.u) : null;
      var fw = ft ? ft.w : top.w * 0.9;
      return { tw: fw > 0 ? roundTo(fw, step) : top.w, tr: ex.rr[0], prev: prev };
    }
    if (ex.q === 'bw' && !(top.w > 0)) return { tw: 0, tr: top.r + 1, prev: prev };
    if (top.r >= ex.rr[1]) {
      // on an assisted lift the step is less help
      if (ASST[ex.id]) return { tw: Math.max(0, roundTo(top.w - step, step)), tr: Math.max(ex.rr[0], top.r - 2), prev: prev };
      return byEffort(ex, { tw: roundTo(top.w + step, step), tr: Math.max(ex.rr[0], top.r - 2), prev: prev }, top, work, src, pq, step);
    }
    return byEffort(ex, { tw: top.w, tr: Math.min(ex.rr[1], top.r + 1), prev: prev }, top, work, src, pq, step);
  }

  /* How many reps you had to spare at the top weight, when you said: the
     top set's own, or else the average of the sets at its weight. Five
     means five or more, and counts as five. A set taken to failure on
     purpose, or as many as you can, says nothing about whether the weight
     was right, so it is left out. */
  function effortAt(sets, u, top) {
    var qOf = function (s) { return Math.min(5, s.q); };
    var at = sets.filter(function (s) { return !s.am && s.ty !== 'f' && fin(s.q) && conv(s.w, u) === top.w; });
    if (!at.length) return null;
    var own = at.filter(function (s) { return s.r === top.r; })[0];
    return own ? qOf(own) : Math.round(at.reduce(function (a, s) { return a + qOf(s); }, 0) / at.length * 2) / 2;
  }

  /* The weight moved by how hard last time really was.
   *
     Double progression takes last time as having gone to plan. When the
     reps to spare you logged were two or more away from what the plan
     asked, it does not:
   *
     Easier than asked: next time is worked from the max those sets show,
     counting the reps you had left the way RTS and Juggernaut do (Epley on
     reps done plus reps to spare), at this time's reps and this time's
     effort. That moves the weight past the usual step, but never more than
     a tenth over last time, because one session is one session.
   *
     Harder than asked: the same weight and reps again, not the step up. It
     is not taken lower, because a "none to spare" that was really one or
     two would walk the weights down week after week; the next session's
     effort moves it on from there. Only reps short of the bottom of the
     range bring it down, to the weight the bottom of the range is worth,
     and no more than a tenth.
   *
     A gap of one is inside how well anyone guesses reps to spare, and
     changes nothing. With no plan the ask is two to spare, the app's usual,
     and only easier than that counts: plenty of people take every set to
     failure when nothing asks otherwise, and holding them there would stop
     the weights for good.
     What it would have been is kept beside it (ef), so the card can say
     why and put it back. */
  function byEffort(ex, t, top, work, src, pq, step) {
    if (ASST[ex.id] || !(top.w > 0) || !(t.tw > 0) || !fin(t.tr)) return t;
    var q = effortAt(work, src.u, top);
    if (q === null) return t;
    var asked = fin(src.pq) ? src.pq : 2, want = fin(pq) ? pq : asked;
    if (Math.abs(q - asked) < 2 || (q < asked && !fin(src.pq))) return t;
    var e1 = top.w * (1 + (top.r + q) / 30);
    var room = Math.max(step, Math.floor(top.w * 0.1 / step) * step);
    var at = function (reps) { return roundTo(e1 / (1 + (reps + want) / 30), step); };
    var tw = t.tw, tr = t.tr;
    if (q > asked) tw = Math.min(Math.max(t.tw, top.w + room), Math.max(t.tw, at(tr)));
    else if (top.r >= ex.rr[0]) { tw = Math.min(t.tw, top.w); tr = top.r; }
    else { tr = ex.rr[0]; tw = Math.max(top.w - room, Math.min(top.w, at(tr))); }
    if (tw === t.tw && tr === t.tr) return t;
    return { tw: tw, tr: tr, prev: t.prev, ef: { q: q, a: asked, w0: t.tw, r0: t.tr } };
  }

  /* How sore that muscle got after the session, as reported at the next
     session that trained it. RP asks before you train, about last time, and
     so does this. */
  function soreAfter(wo, m) {
    var list = ix().list;
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (w.st <= wo.st || w.st - wo.st > 14 * DAY_MS) continue;
      var v = w.sr && w.sr[m];
      if (fin(v)) return v;
    }
    return undefined;
  }

  /* Whether the muscle got WEAKER on the same exercises week over week. With
     one rep less in reserve every week, a muscle recovering from its sets
     should be doing a little more each time. Doing three per cent less is the
     plainest sign on offer that the sets have run ahead of recovery. */
  function regressed(ms, w, d, m) {
    if (w < 1) return false;
    var a = woFor(ms, w - 1, d), b = woFor(ms, w, d);
    if (!a || !b) return false;
    return b.x.some(function (x) {
      if (musOf(x.e) !== m) return false;
      var p = exIn(a, x.e);
      if (!p) return false;
      var ea = liftE1(p, a), eb = liftE1(x, b);
      return ea > 0 && eb < ea * 0.97;
    });
  }

  /* RP's set progression, written as a sum rather than a feeling.
   *
   * Three answers, each worth +1, 0 or less: recovered early is +1, a low
   * pump is +1, an easy session is +1; the other end of each is −1 (or −2
   * for "too much"). The total says how many sets to add next week:
   *
   *     2 or more   +2      the muscle is asking for more
   *     0 or 1      +1      the standard step up
   *     −1          hold
   *     −2 or less  −1      you are past what you recover from
   *
   * And four hard stops that no amount of pump overrides: still sore going
   * in, joints that hurt a lot, or measurably weaker than last week all hold
   * the sets where they are; a workload of "too much" takes one away.
   *
   * No answers at all is a total of zero: one more set, the default step. */
  function feedback(ms, w, d, m) {
    var wo = woFor(ms, w, d);
    if (!wo) return { d: 0, body: 'last week’s session was not logged' };
    var fb = (wo.fb && wo.fb[m]) || {};
    var sr = soreAfter(wo, m);
    var score = 0, said = [];
    if (fin(sr) && SORE_V[sr] !== undefined) { score += SORE_V[sr]; said.push(SORE_W[sr]); }
    if (fin(fb.p) && PUMP_V[fb.p] !== undefined) { score += PUMP_V[fb.p]; said.push(PUMP_W[fb.p]); }
    if (fin(fb.k) && WORK_V[fb.k] !== undefined) { score += WORK_V[fb.k]; said.push(WORK_W[fb.k]); }
    var dl = score >= 2 ? 2 : score >= 0 ? 1 : score === -1 ? 0 : -1;
    // carried over from the time before, untouched: the standard step at most
    if (dl > 1 && wo.fbp && wo.fbp[m]) dl = 1;
    var stop = '';
    if (fb.k === 3) dl = -1;
    else if (sr === 2 && dl > 0) dl = 0;
    if (fb.j === 2 && dl > 0) { dl = 0; stop = 'joints hurt'; }
    if (dl > 0 && regressed(ms, w, d, m)) { dl = 0; stop = 'you were weaker than the week before'; }
    return {
      d: dl,
      body: (said.length ? said.join(', ') : 'no feedback given, so the standard step') +
        (stop ? '; held because ' + stop : '')
    };
  }

  function whyHead(dl) {
    return dl > 0 ? '+' + dl + ' set' + (dl > 1 ? 's' : '') : dl < 0 ? '\u2212' + (-dl) + ' set' : 'Held';
  }

  /* Keeping: the sets stay where they are. Two things move them. A session
     that was too much, or hurt, takes one away. Strength sliding two weeks
     running adds one back — at a maintenance dose there is little room
     below it, and Spiering et al. (2021) put the answer to lost strength in
     more work or heavier work, not less. */
  function keepFeedback(ms, w, d, m) {
    var wo = woFor(ms, w, d);
    if (!wo) return { d: 0, body: '' };
    var fb = (wo.fb && wo.fb[m]) || {};
    if (fb.k === 3) return { d: -1, body: 'last week\u2019s workload was too much' };
    if (fb.j === 2) return { d: -1, body: T.pr.bk ? 'your back or joints hurt last week' : 'your joints hurt last week' };
    if (w >= 1 && regressed(ms, w, d, m) && regressed(ms, w - 1, d, m)) {
      return { d: 1, body: 'strength slipped two weeks running' };
    }
    return { d: 0, body: '' };
  }

  /* Add or take sets one at a time: added to the exercise with the fewest,
     taken from the one with the most. Six on one exercise is a ceiling —
     past that it is a new exercise's job. */
  function spread(arr, idxs, dl) {
    var guard = 20;
    while (dl > 0 && guard--) {
      var lo = null;
      idxs.forEach(function (i) { if (arr[i] < 6 && (lo === null || arr[i] < arr[lo])) lo = i; });
      if (lo === null) break;
      arr[lo]++; dl--;
    }
    while (dl < 0 && guard--) {
      var hi = null;
      idxs.forEach(function (i) { if (arr[i] > 1 && (hi === null || arr[i] > arr[hi])) hi = i; });
      if (hi === null) break;
      arr[hi]--; dl++;
    }
  }

  function totals(ms, sets) {
    var t = {};
    ms.days.forEach(function (day, d) {
      day.s.forEach(function (s, i) { var m = musOf(s.e); t[m] = (t[m] || 0) + sets[d][i]; });
    });
    return t;
  }

  /* ---------------------------------------------------------- eating less
   *
   * Recovery is slower on less food, so how far a week's sets may climb
   * follows how far under maintenance Nourish says you are eating. RP puts
   * a slow cut at about half a percent of bodyweight a week and a hard one
   * at a percent; in the research, lean mass kept up on a small deficit and
   * stopped growing at about 500 kcal a day (Murphy & Koehler 2022).
   *
   *     under a quarter of a percent a week   the usual ceiling, RP's MRV
   *     a quarter to a half                   85 per cent of it
   *     a half or more                        70 per cent, one set at a
   *                                           time, and a rep short of
   *                                           failure: Lean & strong's rules
   *
   * Each week keeps the reading it began with, taken as its first session
   * starts, so the plan does not move under a week already under way and
   * every device reads the week the same. A week not yet begun reads
   * Nourish as it is now. */
  var PH_CUTS = [[0.005, 0.7], [0.0025, 0.85]];
  function phaseCap(rate) {
    for (var i = 0; i < PH_CUTS.length; i++) if (rate >= PH_CUTS[i][0]) return PH_CUTS[i][1];
    return 1;
  }
  // read once a moment, however many weeks the plan walks through
  var phLive = { t: 0, v: null };
  function phaseNow() {
    if (Date.now() - phLive.t < 1500) return phLive.v;
    var h = hive(), v = null;
    try { v = h && h.phase ? h.phase() : null; } catch (e) { v = null; }
    v = v && fin(v.kcal) && fin(v.rate) ? { k: Math.round(v.kcal), r: v.rate, s: v.src === 'ate' ? 'ate' : 'plan', c: phaseCap(v.rate) } : null;
    phLive = { t: Date.now(), v: v };
    return v;
  }
  function phOk(p) { return plain(p) && fin(p.k) && fin(p.r) && fin(p.c) && p.c > 0 && p.c <= 1; }
  // a steady block or a strength block holds its sets, so there is no climb to follow
  function phMatters(ms) { return !!ms && !steady(ms) && ms.goal !== 'str'; }
  function phBegun(ms, w) { return ms.days.some(function (d, i) { return !!woFor(ms, w, i); }); }
  /* The reading week W goes by: the one it kept, or Nourish now for a week
     not yet begun. A week begun with none kept is from before this, and is
     left as it was. Off in Settings, or undone for the week, is none. */
  function phaseAt(ms, w) {
    if (!T.pr.nph || !phMatters(ms)) return null;
    var kept = plain(ms.ph) ? ms.ph[w] : null;
    if (kept) return phOk(kept) && !kept.off ? kept : null;
    return phBegun(ms, w) ? null : phaseNow();
  }
  // the ceiling for week W as a share of MRV, 0 for none: the program's own, lowered by what you eat
  function capOwn(ms) { return fin(ms.cap) && ms.cap > 0 && ms.cap < 1 ? ms.cap : 1; }
  function capAt(ms, w) {
    var ph = phaseAt(ms, w), c = Math.min(capOwn(ms), ph ? ph.c : 1);
    return c < 1 ? c : 0;
  }
  // the week's reading, kept as its first session starts
  function phaseKeep(ms, w) {
    if (!T.pr.nph || !phMatters(ms) || w >= accOf(ms)) return;
    if ((plain(ms.ph) && ms.ph[w]) || phBegun(ms, w)) return;
    var p = phaseNow();
    if (!p) return;
    ms.ph = plain(ms.ph) ? ms.ph : {};
    ms.ph[w] = { k: p.k, r: p.r, s: p.s, c: p.c };
    stamp('ms', ms.id);
  }
  function phaseSay(p) {
    return (p.s === 'ate' ? 'You\u2019ve eaten about ' : 'Nourish has you eating about ') + fmtBig(Math.abs(p.k)) + ' kcal a day under maintenance' +
      (p.s === 'ate' ? ' these two weeks' : '') + ' (' + fmtN(Math.round(p.r * 1000) / 10) + '% of your weight a week), so ' +
      (p.c <= 0.7 ? 'sets climb one at a time, to 70% of the usual ceiling, and stop a rep short of failure.'
        : 'sets climb to 85% of the usual ceiling.');
  }
  /* Said where the week is, only when it changes something, with a way
     out for the week and back in. */
  function phaseLine(ms, nx) {
    if (!nx || !T.pr.nph || !phMatters(ms) || nx.w >= accOf(ms)) return '';
    var kept = plain(ms.ph) ? ms.ph[nx.w] : null;
    if (kept && kept.off && phOk(kept) && kept.c < capOwn(ms)) {
      return '<div class="tr-ph">Not following Nourish\u2019s calories this week. ' +
        '<button class="tr-lnk" data-t="phon" data-w="' + nx.w + '">Follow them again</button></div>';
    }
    var p = phaseAt(ms, nx.w);
    if (!p || p.c >= capOwn(ms)) return '';
    return '<div class="tr-ph">' + esc(phaseSay(p)) +
      ' <button class="tr-lnk" data-t="phoff" data-w="' + nx.w + '">Undo for this week</button></div>';
  }

  /* Every slot's sets for week W, walked forward from week one so that each
     week is last week plus what last week's feedback said. Nothing about
     the progression is stored: it is a function of what was logged, so
     editing or deleting a workout moves the plan with it. */
  function setsFor(ms, W) {
    var keep = steady(ms);
    var str = ms.goal === 'str';
    var fx = Array.isArray(ms.fx) && ms.fx.length ? ms.fx : null;
    var own = capOwn(ms);
    var cur = ms.days.map(function (d) { return d.s.map(function (s) { return Math.max(1, s.n); }); });
    var why = ms.days.map(function (d) { return d.s.map(function () { return keep ? '' : 'Week one: RP\u2019s starting volume.'; }); });
    if (!keep && W >= accOf(ms)) {
      return {
        sets: cur.map(function (a) { return a.map(function (n) { return Math.max(1, Math.ceil(n / 2)); }); }),
        why: cur.map(function (a) { return a.map(function () {
          return 'Deload — half of week one’s sets at week one’s weights, well short of failure.';
        }); })
      };
    }
    for (var w = 1; w <= W; w++) {
      var tot = totals(ms, cur);
      // this week's ceiling, and whether eating less is what lowered it
      var cap = capAt(ms, w), ph = phaseAt(ms, w), phLow = !!ph && ph.c < own;
      var next = cur.map(function (a) { return a.slice(); });
      var wy = cur.map(function (a) { return a.map(function () { return ''; }); });
      /* eslint-disable no-loop-func */
      ms.days.forEach(function (day, d) {
        var by = {};
        // a main lift's sets are its program's, not the feedback's
        day.s.forEach(function (s, i) { if (s.m) return; var m = musOf(s.e); (by[m] = by[m] || []).push(i); });
        Object.keys(by).forEach(function (m) {
          // outside the focus of an emphasis block, a muscle is kept, not grown
          var held = keep || str || (fx && fx.indexOf(m) < 0);
          var f = held ? keepFeedback(ms, w - 1, d, m) : feedback(ms, w - 1, d, m);
          var dl = f.d, extra = '';
          var roof = cap ? Math.round(MUS[m].mrv * cap) : MUS[m].mrv;
          if (!held && cap && cap <= 0.7 && dl > 1) {
            dl = 1;
            extra += ' One set at a time while you are eating less.';
          }
          if (!held && dl > 0 && tot[m] + dl > roof) {
            dl = Math.max(0, roof - tot[m]);
            extra += !cap ? ' Capped at ' + roof + ' sets a week, RP\u2019s MRV for ' + MUS[m].n.toLowerCase() + '.'
              : phLow ? ' Capped at ' + roof + ' sets a week \u2014 below RP\u2019s MRV while you eat about ' + fmtBig(ph.k) + ' kcal a day under maintenance.'
              : ' Capped at ' + roof + ' sets a week \u2014 below RP\u2019s MRV, because recovery is slower while you eat less.';
          }
          /* And never past the minutes you said a session could take: a set
             that would not fit is a set that would not get done. */
          if (dl > 0 && ms.min) {
            var fits = dl;
            while (fits > 0) {
              var trial = next[d].slice();
              spread(trial, by[m], fits);
              if (estDay(day, trial) <= ms.min) break;
              fits--;
            }
            if (fits < dl) extra += ' Held to fit your ' + ms.min + '-minute session.';
            dl = fits;
          }
          /* What was actually added, not what was asked for: no exercise
             goes past six sets in a session or under one, so a muscle with
             one exercise a day stops climbing there, and says so. */
          var had = by[m].reduce(function (a, i) { return a + next[d][i]; }, 0);
          spread(next[d], by[m], dl);
          var got = by[m].reduce(function (a, i) { return a + next[d][i]; }, 0) - had;
          if (dl > 0 && got < dl) extra += ' Held at six sets an exercise, the most one exercise gets in a session.';
          if (dl < 0 && got > dl) extra += ' Already down to one set an exercise.';
          tot[m] += got;
          var said = f.body ? whyHead(got) + ' \u2014 ' + f.body + '.' + extra : extra.trim();
          by[m].forEach(function (i) { wy[d][i] = said; });
        });
      });
      cur = next;
      why = wy;
    }
    return { sets: cur, why: why };
  }

  /* One session of the block, as it should be done: exercises, sets, reps in
     reserve, and the weight and reps to aim for. */
  function plan(ms, w, d) {
    var dl = w >= accOf(ms);
    var sf = setsFor(ms, Math.min(w, accOf(ms)));
    var rir = rirFor(ms, w);
    var day = ms.days[d];
    var mc = day.mc && mcValid(day.mc) ? clean(day.mc) : null;
    if (mc) mc.last = lastCircuit(ms.id, d);
    return {
      w: w, d: d, n: dayName(day), deload: dl, rir: rir, mc: mc,
      x: day.s.map(function (s, i) {
        if (s.m) return mainPlan(ms, s, w, d, dl);
        // a deload is no week to try the harder version
        var e = dl ? s.e : rung(s.e);
        var ex = lib(e);
        var rq = exRir(ex, rir, steady(ms) || ms.goal === 'str');
        var t = target(ex, ms, w, d, dl, rq);
        return { e: e, sets: sf.sets[d][i], rr: ex.rr, rest: restFor(ex), rir: rq,
          tw: t.tw, tr: t.tr, prev: t.prev, why: sf.why[d][i], p: s.p || 0,
          up: e !== s.e ? s.e : '', ef: t.ef || null };
      })
    };
  }

  /* ------------------------------------------------------------ main lifts
   *
   * A main lift's session is written set by set: each has its own weight
   * and reps, and one may be for as many reps as you can. */
  function mainPlan(ms, s, w, d, dl) {
    var ex = lib(s.e);
    var pe = {};
    var st = ms.goal === 'str' ? waveSets(ms, s.e, w, dl) : pbSets(ex, ms, w, d, dl, pe);
    var t = target(ex, null, 0, 0, false);
    var last = st[st.length - 1] || {};
    return { e: s.e, sets: st.length, rr: ex.rr, rest: T.pr.rc, st: st, main: s.m, wv: ms.goal === 'str' ? 1 : 0,
      rir: dl ? null : ms.goal === 'str' ? null : 2, tm: ms.goal === 'str' ? tmOf(ms, s.e) : null,
      tw: last.tw, tr: last.tr, prev: t.prev, why: '', p: 0, up: '', ef: pe.ef || null };
  }

  /* The best estimated max for an exercise over the last `days` days. */
  function recentE1(e, days) {
    var from = Date.now() - days * DAY_MS, best = 0;
    ix().list.forEach(function (wo) {
      if (wo.st < from || wo.dl) return;
      var x = exIn(wo, e);
      if (x) best = Math.max(best, bestE1(x.s.filter(counts), wo.u));
    });
    return best;
  }

  /* The training max: what the block was given, or else nine-tenths of the
     best estimated max in your log from the last twelve weeks. A little
     under your true max on purpose — the method's own margin, so that the
     reps asked for are reps you can do on a bad day. Nothing logged yet is
     no max yet: the first session's sets are picked by feel, and the weeks
     after work from what they turned out to be. */
  function tmOf(ms, e) {
    var v = ms.tm && fin(ms.tm[e]) && ms.tm[e] > 0 ? conv(ms.tm[e], ms.tu) : null;
    if (v) return v;
    var e1 = recentE1(e, 84);
    return e1 > 0 ? roundTo(e1 * 0.9, inc(lib(e))) : null;
  }

  function waveSets(ms, e, w, dl) {
    var tm = tmOf(ms, e), step = inc(lib(e));
    var at = function (p) { return tm ? roundTo(tm * p, step) : null; };
    if (dl) return [[5, 0.4], [5, 0.5], [5, 0.6]].map(function (a) { return { tw: at(a[1]), tr: a[0], pct: a[1] }; });
    var row = (WAVES[ms.wave] || WAVES[10])[Math.min(w, 2)];
    var out = [];
    if (w >= 2) out.push({ tw: at(row[2] - 0.2), tr: 5, pct: row[2] - 0.2, wu: 1 }, { tw: at(row[2] - 0.1), tr: 3, pct: row[2] - 0.1, wu: 1 });
    for (var i = 0; i < row[0]; i++) out.push({ tw: at(row[2]), tr: row[1], pct: row[2], am: w >= 2 && i === row[0] - 1 ? 1 : 0 });
    return out;
  }

  /* Powerbuilding's main lift: one top set of four to six, about two short
     of failure, moved by double progression like everything else; then
     three back-off sets of eight at eighty-five per cent of it. A deload is
     one set of each at week one's weights. */
  function pbSets(ex, ms, w, d, dl, out) {
    var top = Object.assign({}, ex, { rr: [4, 6] });
    var t = target(top, ms, w, d, dl, 2);
    var mk = function (tw, tr) {
      var back = fin(tw) && tw > 0 ? roundTo(tw * 0.85, inc(ex)) : null;
      if (dl) return [{ tw: tw, tr: 4, top: 1 }, { tw: back, tr: 8 }];
      return [{ tw: tw, tr: tr || null, top: 1 }, { tw: back, tr: 8 }, { tw: back, tr: 8 }, { tw: back, tr: 8 }];
    };
    // the back-offs follow the top set, and so does what they would have been
    if (t.ef && out) out.ef = Object.assign({ alt: mk(t.ef.w0, t.ef.r0).map(function (z) { return [z.tw, z.tr]; }) }, t.ef);
    return mk(t.tw, t.tr);
  }

  /* After a wave: each rep past the realization target adds a small step to
     the max — the smallest jump on a press, twice that on a squat or a
     deadlift — and each rep short takes one off. Capped at five steps
     either way, because one very good or very bad day is one day. */
  function nextTm(ms) {
    var out = {};
    ms.days.forEach(function (day) {
      day.s.forEach(function (s) {
        if (!s.m) return;
        var tm = tmOf(ms, s.e);
        if (!tm) return;
        var ex = lib(s.e), step = inc(ex) * (MAINS[s.m] && MAINS[s.m].lower ? 1 : 0.5);
        var am = null;
        ix().list.forEach(function (wo) {
          if (wo.ms !== ms.id) return;
          var x = exIn(wo, s.e);
          if (!x) return;
          x.s.forEach(function (q) { if (q.am && fin(q.tr)) am = { r: q.r, tr: q.tr }; });
        });
        var moved = am ? Math.max(-5, Math.min(5, am.r - am.tr)) : 0;
        out[s.e] = Math.max(step, roundTo(tm + moved * step, T.pr.u === 'kg' ? 0.5 : 2.5));
      });
    });
    return out;
  }

  /* Bodyweight has no plate to add, so it gets harder by becoming a harder
     exercise. Every set of the last proper session at the top of the rep
     range, with nothing added, and the plan moves you up a rung — and keeps
     climbing while each rung is outgrown too. A rung you cannot manage is
     a swap away from the one below. */
  function outgrown(e) {
    var lp = lastPerf(e), top = lib(e).rr[1];
    return !!lp && lp.s.every(function (s) { return s.r >= top && !(s.w > 0); });
  }
  function rung(e) {
    var cur = e, guard = 6;
    var pf = { bk: T.pr.bk, jt: T.pr.jt, avoid: T.pr.avoid };
    while (guard-- && LADDER[cur] && outgrown(cur) && !barred(lib(LADDER[cur]), pf)) cur = LADDER[cur];
    return cur;
  }

  /* The next session of the block that has neither been logged nor skipped. */
  function nextSlot(ms) {
    var sk = Array.isArray(ms.sk) ? ms.sk : [];
    for (var w = 0; w < weeksOf(ms); w++) {
      for (var d = 0; d < ms.days.length; d++) {
        if (!slotDone(ms, w, d) && sk.indexOf(w + ':' + d) < 0) return { w: w, d: d };
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ generator */

  /* The exercise a slot gets: right muscle, kit you own, the kind and
     pattern asked for if possible, and not one this block already uses if
     there is any other choice. Library order is preference order, so the
     plain version of each lift comes first. */
  /* Whether an exercise is out, for this back and this avoid list. A capital
     in any of your triggers keeps it out; so does your saying never. */
  function barred(ex, pf) {
    if (!pf) return false;
    if (pf.avoid && pf.avoid.indexOf(ex.id) >= 0) return true;
    var bk = pf.bk || '', jt = pf.jt || '', i;
    for (i = 0; i < bk.length; i++) if (ex.bk.indexOf(bk[i].toUpperCase()) >= 0) return true;
    for (i = 0; i < jt.length; i++) if ((ex.jt || '').indexOf(jt[i]) >= 0) return true;
    return false;
  }
  /* How much it asks of this back, as a ranking penalty. Some of a trigger
     costs a lot; any other load costs a little, so that with protection on
     the version that asks nothing of the back wins a tie — a seated press
     over a standing one, a chest-supported row over a bent-over one. */
  function backCost(ex, pf) {
    var c = 0, i;
    var bk = pf && pf.bk;
    if (bk && ex.bk) {
      for (i = 0; i < ex.bk.length; i++) {
        var ch = ex.bk[i], low = ch.toLowerCase();
        if (bk.indexOf(low) >= 0) c += 20;
        else c += ch === low ? 3 : 6;
      }
    }
    // a joint you are protecting, loaded some: ranked below one that is not
    var jt = pf && pf.jt;
    if (jt && ex.jt) for (i = 0; i < jt.length; i++) if (ex.jt.indexOf(jt[i].toLowerCase()) >= 0) c += 15;
    return c;
  }
  /* The cue a moderately loading exercise carries for your back, if any. */
  function backCue(ex) {
    var bk = T.pr.bk, jt = T.pr.jt, i;
    if (bk && ex.bk) for (i = 0; i < bk.length; i++) if (ex.bk.indexOf(bk[i]) >= 0) return BACK_CUE[bk[i]];
    if (jt && ex.jt) for (i = 0; i < jt.length; i++) if (ex.jt.indexOf(jt[i].toLowerCase()) >= 0) return JOINT_CUE[jt[i]];
    return '';
  }

  function pickMain(key, eq, pf, used) {
    var list = MAINS[key].list.map(lib).filter(function (ex) { return eq.indexOf(ex.q) >= 0 && !barred(ex, pf); });
    /* The main lift is the one a program loads heaviest, so with your back
       protected the version that asks least of it goes first, whatever its
       place in the list: a Smith squat loads a back that is protected from
       bending and from weight on the spine, and was chosen over a belt
       squat that loads neither. With nothing protected every cost is nought
       and the list keeps its order. */
    var at = {};
    list.forEach(function (ex, i) { at[ex.id] = i; });
    list.sort(function (a, b) { return backCost(a, pf) - backCost(b, pf) || at[a.id] - at[b.id]; });
    var fresh = list.filter(function (ex) { return !used[ex.id]; });
    return fresh[0] || list[0] || null;
  }

  /* Starting out: what is easy to learn and hard to get wrong ranks first —
     a machine or a pair of dumbbells before a barbell, two feet before one,
     a pulldown before a pull-up. The harder versions are a Swap away, and
     where they are all there is, they are still picked. */
  var EASY = { 'leg-press': 1, 'goblet': 1, 'mc-press': 1, 'lat-pd': 1, 'cb-row': 1, 'mc-row': 1, 'db-rdl': 1,
    'glute-bridge': 1, 'mc-thrust': 1, 'mc-ohp': 1, 'db-stepup': 1, 'dead-bug': 1, 'seated-curl': 1 };
  var HARD = { 'belt-squat': 1, 'db-bss': 1, 'bw-bss': 1, 'sl-rdl': 1, 'pullup-neg': 1, 'pullup': 1, 'chinup': 1, 'dip': 1,
    'hip-thrust': 1, 'pallof': 1, 'bb-dl': 1, 'good-am': 1, 'bb-sldl': 1, 'nordic': 1, 'hang-raise': 1, 'ab-wheel': 1,
    'archer': 1, 'bb-front': 1, 'bb-row': 1, 'bb-ohp': 1, 'bb-incline': 1, 'skull': 1 };
  function newbieCost(ex, pf) {
    return pf && pf.lvl === 0 ? (EASY[ex.id] ? -4 : HARD[ex.id] ? 6 : 0) : 0;
  }

  // in the library to add or swap to, never chosen for you
  var NOPICK = { 'sumo-dl': 1, 'trap-dl': 1, 'as-pullup': 1, 'as-dip': 1, 'seated-lp': 1, 'mc-kick': 1, 'sm-thrust': 1 };
  function pickEx(m, k, p, eq, used, seed, pf, today, known) {
    var cand = allEx().filter(function (ex) { return ex.m === m && eq.indexOf(ex.q) >= 0 && !barred(ex, pf) && !NOPICK[ex.id]; });
    /* Never the same exercise twice in one day: with nothing else to hand,
       the slot is left out and the one already there carries the sets. */
    if (today) cand = cand.filter(function (ex) { return !today[ex.id]; });
    if (!cand.length) return null;
    /* At home, what needs a bar or a bench ranks below what needs the floor;
       with anything to load, the bodyweight version of a lift ranks below
       the loadable one. */
    var home = atHome(eq), bwOnly = eq.length === 1;
    var score = function (ex) {
      return (ex.k === k ? 0 : 100) + (p && ex.p !== p ? 10 : 0) + backCost(ex, pf) + newbieCost(ex, pf) +
        (home && GEAR[ex.id] ? 5 : 0) + (!bwOnly && HOMEY[ex.id] ? 20 : 0) + ex.o / 1000 -
        // a ready workout prefers a lift you already do, so its weights come from your own numbers
        (known && known[ex.id] ? 8 : 0);
    };
    cand.sort(function (a, b) { return score(a) - score(b); });
    /* Something this block does not use yet, unless the only fresh choices
       are well down the list — a second day of the machine row beats a row
       that loads a back you are protecting. */
    var fresh = cand.filter(function (ex) { return !used[ex.id]; });
    var pool = fresh.length && score(fresh[0]) - score(cand[0]) < 15 ? fresh : cand;
    var best = score(pool[0]);
    /* A slot that cannot have the kind of exercise it asks for is left
       empty rather than filled with another kind, when the muscle is one the
       rest of the session trains anyway (front delts, glutes, core) or a
       small one at home with nothing to isolate it: the push-ups already
       train the triceps. A big muscle still gets its compound. */
    if (best >= 100 && (MUS[m].mev === 0 || (home && SMALL[m]))) return null;
    var tier = pool.filter(function (ex) { return Math.floor(score(ex)) === Math.floor(best); });
    return tier[(seed || 0) % tier.length];
  }

  /* Keeping, not building.
   *
   * Strength that has been built takes far less to keep than it took to
   * build: in Bickel et al. (2011) one session a week at a fraction of the
   * sets held it for eight months, and Spiering et al. (2021) put the floor at
   * about one session and a set or so per exercise — provided the loads stay
   * heavy. Older lifters need a little more, which is why this is two or
   * three sessions rather than one.
   *
   * So: full body, every big movement each session, three sets (two when
   * there are three days), sets ending about two reps short of failure, and
   * no climb in volume and no deload — there is nothing accumulating to
   * recover from. The muscles are paired so that one rests while the other
   * works (the "+" joins a slot to the one after it); that is what fits a
   * whole body into forty minutes without cutting the rest either muscle
   * gets. Squat, hinge-free hip work, a push and a pull, and a core slot that
   * trains the trunk to resist movement rather than to bend. */
  var KEEP_SPLITS = {
    2: { n: 'Keep strength', days: [
      ['Strength A', ['quads/c/squat+', 'back/c/horiz', 'chest/c/flat+', 'hams/i/curl', 'front/c/press+', 'abs/i']],
      ['Strength B', ['glutes/c/thrust+', 'back/c/vert', 'quads/c/single+', 'chest/c/incline', 'side/i+', 'abs/i']]
    ] },
    3: { n: 'Keep strength', days: [
      ['Strength A', ['quads/c/squat+', 'back/c/horiz', 'chest/c/flat+', 'hams/i/curl', 'side/i+', 'abs/i']],
      ['Strength B', ['glutes/c/thrust+', 'back/c/vert', 'chest/c/incline+', 'quads/i', 'biceps/i+', 'triceps/i']],
      ['Strength C', ['quads/c/single+', 'back/c/horiz', 'front/c/press+', 'hams/i/curl', 'rear/i+', 'abs/i']]
    ] }
  };

  /* Starting out: every big movement, a couple of sets, twice or three
     times a week. The American College of Sports Medicine's advice for
     novices, more or less word for word — and the reason it is little is
     that little is all a beginner needs to grow and get stronger. */
  var START_SPLITS = {
    2: { n: 'Start here', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'hams/c/hinge', 'side/i', 'abs/i']],
      ['Full Body B', ['glutes/c/thrust', 'back/c/horiz', 'front/c/press', 'quads/c/single', 'hams/i/curl', 'abs/i']]
    ] },
    3: { n: 'Start here', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'hams/i/curl', 'abs/i']],
      ['Full Body B', ['hams/c/hinge', 'back/c/horiz', 'front/c/press', 'quads/c/single', 'calves/i']],
      ['Full Body C', ['quads/c/machine', 'chest/c/incline', 'back/c/vert', 'glutes/c/thrust', 'abs/i']]
    ] }
  };

  /* At home. Written for a floor, a pull-up bar if there is one, and
     dumbbells if there are some; a slot nothing at home can fill (a lateral
     raise with no dumbbells) simply is not there. */
  var HOME_SPLITS = {
    2: { n: 'Home', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'glutes/c/thrust', 'hams/i/curl', 'side/i', 'abs/i']],
      ['Full Body B', ['quads/c/single', 'back/c/horiz', 'front/c/press', 'hams/c/hinge', 'chest/c/flat', 'rear/i', 'calves/i']]
    ] },
    3: { n: 'Home', days: [
      ['Full Body A', ['quads/c/squat', 'chest/c/flat', 'back/c/vert', 'hams/i/curl', 'side/i', 'triceps/i']],
      ['Full Body B', ['hams/c/hinge', 'back/c/horiz', 'front/c/press', 'quads/c/single', 'rear/i', 'abs/i']],
      ['Full Body C', ['glutes/c/thrust', 'chest/c/flat', 'back/c/vert', 'quads/c/single', 'biceps/i', 'calves/i']]
    ] },
    4: { n: 'Home', days: [
      ['Upper A', ['chest/c/flat', 'back/c/vert', 'front/c/press', 'back/c/horiz', 'triceps/i', 'side/i']],
      ['Lower A', ['quads/c/squat', 'hams/c/hinge', 'glutes/c/thrust', 'calves/i', 'abs/i']],
      ['Upper B', ['back/c/horiz', 'chest/c/flat', 'back/c/vert', 'rear/i', 'biceps/i', 'triceps/i']],
      ['Lower B', ['quads/c/single', 'hams/i/curl', 'glutes/c/thrust', 'quads/c/squat', 'abs/i']]
    ] }
  };

  /* Bringing one part up. The muscles that belong to it go first in every
     session that trains them (Simão et al. 2012: what comes first gets the
     most out of you), get one more exercise on those days, start higher and
     climb on RP's feedback. Everything else is held at a dose that keeps it,
     and only moves if a session was too much. */
  var FOCUS = {
    chest: { n: 'Chest', m: ['chest'], add: ['chest/i/fly', 'chest/c/incline'] },
    back: { n: 'Back', m: ['back', 'rear'], add: ['back/c/vert', 'rear/i'] },
    shoulders: { n: 'Shoulders', m: ['side', 'rear', 'front'], add: ['side/i', 'rear/i'] },
    arms: { n: 'Arms', m: ['biceps', 'triceps'], add: ['biceps/i', 'triceps/i'] },
    glutes: { n: 'Glutes', m: ['glutes', 'hams'], add: ['glutes/c/thrust', 'glutes/i'] },
    legs: { n: 'Legs', m: ['quads', 'hams', 'glutes', 'calves'], add: ['quads/i', 'hams/i/curl'] }
  };

  /* The big lifts, for the strength programs: a squat, a bench press, a
     deadlift and an overhead press, or the nearest thing your kit, your back
     and your joints allow — the first of each list that is not ruled out.
     With bending protected the deadlift becomes a hip thrust, which keeps
     the hips as the engine and the spine out of it. */
  var MAINS = {
    squat: { n: 'Squat', lower: 1, list: ['bb-squat', 'bb-front', 'sm-squat', 'hack', 'belt-squat', 'leg-press', 'goblet', 'db-bss'] },
    bench: { n: 'Bench press', list: ['bb-bench', 'db-bench', 'mc-press', 'bb-incline', 'db-incline', 'sm-incline'] },
    dead: { n: 'Deadlift', lower: 1, list: ['bb-dl', 'bb-rdl', 'hip-thrust', 'mc-thrust', 'db-rdl', 'db-thrust'] },
    press: { n: 'Overhead press', list: ['bb-ohp', 'db-ohp', 'mc-ohp', 'bb-incline', 'db-incline'] }
  };
  /* A day is named for its main lift, and the lift is whichever one your kit
     and your back allowed: a "Squat day" that opens with a belt squat, or a
     "Deadlift day" with no deadlift in it, promised a lift the block had
     already left out. So the name follows the lift actually there, worked
     out as it is drawn, which also renames blocks built before this and
     follows a main lift swapped for the rest of the block. */
  var MAIN_W = { squat: 'Squat', bench: 'Bench', dead: 'Deadlift', press: 'Press' };
  var MAIN_SHORT = {
    'bb-squat': 'Squat', 'bb-front': 'Front squat', 'sm-squat': 'Smith squat', 'hack': 'Hack squat', 'belt-squat': 'Belt squat',
    'leg-press': 'Leg press', 'goblet': 'Goblet squat', 'db-bss': 'Split squat',
    'bb-bench': 'Bench', 'db-bench': 'Dumbbell bench', 'mc-press': 'Chest press', 'bb-incline': 'Incline bench',
    'db-incline': 'Dumbbell incline', 'sm-incline': 'Smith incline',
    'bb-dl': 'Deadlift', 'bb-rdl': 'Romanian deadlift', 'db-rdl': 'Romanian deadlift', 'hip-thrust': 'Hip thrust',
    'mc-thrust': 'Hip thrust', 'db-thrust': 'Hip thrust',
    'bb-ohp': 'Press', 'db-ohp': 'Dumbbell press', 'mc-ohp': 'Machine press'
  };
  function dayName(day) {
    var to = {};
    (day && Array.isArray(day.s) ? day.s : []).forEach(function (s) {
      var word = s && MAIN_W[s.m];
      if (word && !to[word]) to[word] = MAIN_SHORT[s.e] || lib(s.e).n;
    });
    // one pass over the name as written, so one lift's new name is never renamed by the next
    return String(day && day.n || '').replace(/\b(squat|bench|deadlift|press)\b/gi, function (hit) {
      var word = hit.charAt(0).toUpperCase() + hit.slice(1).toLowerCase(), short = to[word];
      if (!short || short === word) return hit;
      return hit.charAt(0) === word.charAt(0) ? short : short.toLowerCase();
    });
  }

  /* A slot beginning * is a main lift. Strength waves put one or two a
     day at the front and keep the accessory work after them steady;
     powerbuilding opens each day with one and lets the rest climb. */
  var STR_SPLITS = {
    2: { n: 'Strength waves', days: [
      ['Squat & bench', ['*squat', '*bench', 'back/c/horiz', 'abs/i']],
      ['Deadlift & press', ['*dead', '*press', 'back/c/vert', 'hams/i/curl']]
    ] },
    3: { n: 'Strength waves', days: [
      ['Squat', ['*squat', 'hams/i/curl', 'quads/i', 'abs/i']],
      ['Bench', ['*bench', 'back/c/horiz', 'front/c/press', 'triceps/i']],
      ['Deadlift', ['*dead', 'back/c/vert', 'quads/c/single', 'abs/i']]
    ] },
    4: { n: 'Strength waves', days: [
      ['Squat', ['*squat', 'hams/i/curl', 'quads/i', 'abs/i']],
      ['Bench', ['*bench', 'back/c/horiz', 'triceps/i', 'rear/i']],
      ['Deadlift', ['*dead', 'back/c/vert', 'quads/c/single', 'abs/i']],
      ['Press', ['*press', 'back/c/vert', 'side/i', 'biceps/i']]
    ] }
  };
  var PB_SPLITS = {
    3: { n: 'Powerbuilding', days: [
      ['Squat day', ['*squat', 'chest/c/incline', 'back/c/vert', 'hams/i/curl', 'side/i', 'abs/i']],
      ['Bench day', ['*bench', 'back/c/horiz', 'quads/c/single', 'rear/i', 'triceps/i', 'biceps/i']],
      ['Deadlift day', ['*dead', 'front/c/press', 'back/c/vert', 'quads/i', 'side/i', 'calves/i']]
    ] },
    4: { n: 'Powerbuilding', days: [
      ['Lower A', ['*squat', 'hams/i/curl', 'quads/i', 'calves/i', 'abs/i']],
      ['Upper A', ['*bench', 'back/c/vert', 'chest/i/fly', 'side/i', 'triceps/i']],
      ['Lower B', ['*dead', 'quads/c/single', 'hams/i/curl', 'glutes/c/thrust', 'abs/i']],
      ['Upper B', ['*press', 'back/c/horiz', 'chest/c/incline', 'rear/i', 'biceps/i']]
    ] }
  };

  /* A wave, in the style of the Juggernaut Method: sets, reps and a share of
     the training max for its accumulation, intensification and realization
     weeks. Realization climbs through two lighter sets to one set for as
     many reps as you can; how far past the target you get moves the max for
     the next wave. These are this app's round numbers in that shape, not
     the book's tables. */
  var WAVES = {
    10: [[5, 10, 0.60], [3, 10, 0.675], [1, 10, 0.75]],
    8: [[5, 8, 0.65], [3, 8, 0.725], [1, 8, 0.80]],
    5: [[6, 5, 0.70], [4, 5, 0.775], [1, 5, 0.85]],
    3: [[7, 3, 0.75], [5, 3, 0.825], [1, 3, 0.90]]
  };
  var NEXT_WAVE = { 10: 8, 8: 5, 5: 3, 3: 10 };

  /* -------------------------------------------------------------- circuits
   *
   * The conditioning half of a session, in the style of CrossFit: three
   * movements, done as many rounds as you can in the time, every minute on
   * the minute, or a set number of rounds for time. Movements are tagged the
   * way exercises are — kit, back, joints — so a bad knee loses the jumping
   * and a disc loses the sit-ups, and each carries the reps a round asks
   * for somebody a year or two in. */
  var MOVES = {
    'air-squat': { n: 'Air squat', q: 'bw', r: 15, t: 'legs', jt: 'k' },
    'lunge': { n: 'Alternating lunge', q: 'bw', r: 12, t: 'legs', jt: 'k' },
    'db-swing': { n: 'Dumbbell swing', q: 'db', r: 15, t: 'legs', bk: 'f', jt: 'h' },
    'db-step': { n: 'Dumbbell step-up (each leg)', q: 'db', r: 8, t: 'legs', jt: 'k' },
    'glute-br': { n: 'Glute bridge', q: 'bw', r: 15, t: 'legs' },
    'pushup': { n: 'Push-up', q: 'bw', r: 10, t: 'push', jt: 'sW' },
    'inc-push': { n: 'Incline push-up', q: 'bw', r: 12, t: 'push', jt: 'w' },
    'db-push-press': { n: 'Dumbbell push press', q: 'db', r: 10, t: 'push', bk: 'c', jt: 'S' },
    'db-thruster': { n: 'Dumbbell thruster', q: 'db', r: 10, t: 'push', bk: 'c', jt: 'sk' },
    'db-row-c': { n: 'Dumbbell row (each arm)', q: 'db', r: 10, t: 'pull', bk: 'f' },
    'db-snatch': { n: 'Dumbbell snatch (alternating)', q: 'db', r: 12, t: 'pull', bk: 'f', jt: 'Sw' },
    'ring-row': { n: 'Inverted row', q: 'bw', r: 10, t: 'pull', jt: 'w', gear: 1 },
    'burpee': { n: 'Burpee', q: 'bw', r: 8, t: 'cardio', bk: 'f', jt: 'Wka' },
    'jj': { n: 'Jumping jack', q: 'bw', r: 30, t: 'cardio', jt: 'kA' },
    'mtn': { n: 'Mountain climber (each leg)', q: 'bw', r: 20, t: 'cardio', jt: 'w' },
    'bear': { n: 'Bear crawl (steps)', q: 'bw', r: 20, t: 'cardio', jt: 'w' },
    'row-cal': { n: 'Row (calories)', q: 'mc', r: 12, t: 'cardio', bk: 'f' },
    'bike-cal': { n: 'Bike (calories)', q: 'mc', r: 12, t: 'cardio' },
    'step-ups': { n: 'Fast step-up (each leg)', q: 'bw', r: 12, t: 'cardio', jt: 'k' },
    'dead-bug-c': { n: 'Dead bug (each side)', q: 'bw', r: 10, t: 'core' },
    'situp': { n: 'Sit-up', q: 'bw', r: 15, t: 'core', bk: 'F', jt: 'n' }
  };
  var MC_K = { amrap: 'AMRAP', emom: 'EMOM', rft: 'Rounds for time' };
  function moveEx(id) { var m = MOVES[id]; return { id: id, bk: m.bk || '', jt: m.jt || '' }; }

  /* A circuit for one day of a block. The format turns over with the days
     (AMRAP, EMOM, rounds for time), the three movements are a leg one, a push
     or a pull, and a breathing one, and the length follows your minutes.
     New lifters get fewer reps a round; years in, more. */
  function circuit(di, o, eq, pf) {
    var k = ['amrap', 'emom', 'rft'][di % 3];
    var len = o.min && o.min <= 30 ? 8 : o.min && o.min <= 45 ? 10 : 12;
    if (o.lvl === 0) len = Math.min(len, 10);
    var scale = [0.7, 1, 1.25][[0, 1, 2].indexOf(o.lvl) >= 0 ? o.lvl : 1] * (k === 'emom' ? 0.6 : 1);
    var used = {}, mv = [];
    [['legs'], di % 2 ? ['pull', 'push'] : ['push', 'pull'], ['cardio']].forEach(function (want) {
      var cand = Object.keys(MOVES).filter(function (id) {
        var m = MOVES[id];
        return want.indexOf(m.t) >= 0 && eq.indexOf(m.q) >= 0 && !used[id] && !barred(moveEx(id), pf);
      });
      // a fall-back for a slot nothing fits: something for the trunk
      if (!cand.length) cand = Object.keys(MOVES).filter(function (id) {
        return MOVES[id].t === 'core' && !used[id] && !barred(moveEx(id), pf);
      });
      if (!cand.length) return;
      var cost = function (id) {
        return want.indexOf(MOVES[id].t) * 10 + backCost(moveEx(id), pf) + (MOVES[id].gear ? 4 : 0) +
          (MOVES[id].q === 'bw' && eq.length > 1 ? 2 : 0) +
          // somebody new starts on the gentler versions
          (o.lvl === 0 && (id === 'pushup' || id === 'burpee') ? 3 : 0);
      };
      cand.sort(function (a, b) { return cost(a) - cost(b); });
      // anything close to the best, so the days do not all get the same three
      var tier = cand.filter(function (id) { return cost(id) <= cost(cand[0]) + 3; });
      var id = tier[((o.seed || 0) + di) % tier.length];
      used[id] = 1;
      mv.push({ id: id, r: Math.max(4, Math.round(MOVES[id].r * scale)) });
    });
    var c = { k: k, min: len, mv: mv };
    if (k === 'rft') { c.rd = [3, 4, 5][[0, 1, 2].indexOf(o.lvl) >= 0 ? o.lvl : 1]; c.cap = len + 4; }
    return c;
  }
  function mcValid(c) {
    return plain(c) && !!MC_K[c.k] && fin(c.min) && c.min > 0 && c.min <= 60 && Array.isArray(c.mv) &&
      c.mv.every(function (m) { return plain(m) && !!MOVES[m.id] && fin(m.r); });
  }
  function mcMinutes(c) { return c.k === 'rft' ? (fin(c.cap) ? c.cap : c.min) : c.min; }
  function mcSay(c) {
    return MC_K[c.k] + ' ' + (c.k === 'rft' ? c.rd + ' rounds, ' + c.cap + '-minute cap' : c.min + ' min') + ': ' +
      c.mv.map(function (m) { return m.r + ' ' + MOVES[m.id].n.toLowerCase(); }).join(', ');
  }
  /* A circuit's score in words, and which of two is better: more rounds,
     more minutes done, or less time. */
  function mcScore(s) {
    if (!s) return '';
    if (s.k === 'amrap' && fin(s.r)) return s.r + ' round' + (s.r === 1 ? '' : 's') + (s.x ? ' + ' + s.x : '');
    if (s.k === 'emom' && fin(s.done)) return s.done + ' of ' + s.min + ' minutes';
    if (s.k === 'rft' && fin(s.sec)) return clock(s.sec) + (fin(s.cap) && s.sec >= s.cap * 60 ? ' (at the cap)' : '');
    return '';
  }
  function mcBetter(a, b) {
    if (!a || !b || a.k !== b.k) return 0;
    var v = function (s) { return s.k === 'amrap' ? (s.r || 0) * 1000 + (s.x || 0) : s.k === 'emom' ? s.done || 0 : -(s.sec || 1e9); };
    return v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0;
  }
  /* The last time this day's circuit was done, before `before`. */
  function lastCircuit(msId, d, before) {
    var list = ix().list;
    for (var i = list.length - 1; i >= 0; i--) {
      var w = list[i];
      if (w.ms === msId && w.d === d && w.mc && mcScore(w.mc) && (!before || w.st < before)) return w.mc;
    }
    return null;
  }

  var COND_SPLITS = {
    2: { n: 'Strength & conditioning', days: [
      ['Day A', ['quads/c/squat', 'chest/c/flat', 'back/c/horiz']],
      ['Day B', ['hams/c/hinge', 'front/c/press', 'back/c/vert']]
    ] },
    3: { n: 'Strength & conditioning', days: [
      ['Day A', ['quads/c/squat', 'chest/c/flat', 'back/c/horiz']],
      ['Day B', ['hams/c/hinge', 'front/c/press', 'back/c/vert']],
      ['Day C', ['quads/c/single', 'chest/c/incline', 'back/c/horiz']]
    ] },
    4: { n: 'Strength & conditioning', days: [
      ['Day A', ['quads/c/squat', 'chest/c/flat', 'back/c/horiz']],
      ['Day B', ['hams/c/hinge', 'front/c/press', 'back/c/vert']],
      ['Day C', ['quads/c/single', 'chest/c/incline', 'back/c/horiz']],
      ['Day D', ['glutes/c/thrust', 'chest/c/flat', 'back/c/vert']]
    ] },
    5: { n: 'Strength & conditioning', days: [
      ['Day A', ['quads/c/squat', 'chest/c/flat', 'back/c/horiz']],
      ['Day B', ['hams/c/hinge', 'front/c/press', 'back/c/vert']],
      ['Day C', ['quads/c/single', 'chest/c/incline', 'back/c/horiz']],
      ['Day D', ['glutes/c/thrust', 'chest/c/flat', 'back/c/vert']],
      ['Day E', ['quads/c/squat', 'front/c/press', 'back/c/horiz']]
    ] }
  };
  var PHASE = ['accumulation: more sets, moderate weight', 'intensification: fewer sets, heavier',
    'realization: work up to one set for as many good reps as you can'];
  // the same weeks, said plainly, under the day's name
  var PHASE_SAY = ['More sets at a moderate weight on the main lift', 'Fewer sets, heavier, on the main lift',
    'On the main lift, work up to one set of as many good reps as you can'];

  /* ---------------------------------------------------------- the programs
   *
   * What the picks and the library offer. Each is named for what it does,
   * with the style it borrows from said plainly — none of them is anybody's
   * program, and none pretends to be. `mode` is the engine underneath:
   *
   *   grow   RP's: sets climb on your feedback, reps in reserve step down,
   *          a deload to finish
   *   keep   steady sets, about two in reserve, no deload
   *   base   the same steadiness for a beginner, three in reserve easing
   *          to two
   *
   * `acc` is the choice of length: working weeks, to which a grow block
   * adds its deload. */
  var PROGS = {
    start: { n: 'Start here', sty: 'Full-body basics, in the style of a beginner program', mode: 'base',
      dpw: [2, 3], acc: [6, 8], dAcc: 6, refs: ['acsm09'],
      s: 'Two or three full-body sessions a week on the big movements: a few sets each, well short of failure, with the weight going up as it gets easy.',
      who: 'New to lifting, or back after a long break.' },
    grow: { n: 'Build muscle', sty: 'In the style of RP Hypertrophy', mode: 'grow',
      dpw: [2, 3, 4, 5, 6], acc: [3, 4, 5, 6], dAcc: 4, refs: ['rp21', 'vol17'],
      s: 'Sets that climb week to week for as long as you recover from them, moved by how each session felt, then a lighter week to shed the fatigue.',
      who: 'A year or more of lifting, and room for three to six sessions.' },
    focus: { n: 'Bring up a body part', sty: 'An emphasis block, RP style', mode: 'grow',
      dpw: [2, 3, 4, 5, 6], acc: [3, 4, 5], dAcc: 4, refs: ['simao12', 'rp21'],
      s: 'One area trained first and hardest, climbing every week; everything else held at a dose that keeps it.',
      who: 'A chest, back, shoulders, arms, glutes or legs that lag behind the rest.' },
    lean: { n: 'Lean & strong', sty: 'Lifting through a fat-loss phase', mode: 'grow', cap: 0.7,
      dpw: [2, 3, 4, 5], acc: [3, 4, 5], dAcc: 4, refs: ['murphy22', 'schumann22'],
      s: 'Heavy enough to give your body a reason to keep its muscle, modest enough in volume to recover from while you eat less.',
      who: 'Losing weight, and wanting it to come off as fat rather than muscle.' },
    waves: { n: 'Strength waves', sty: 'In the style of the Juggernaut Method', mode: 'str', kits: ['gym', 'bar'],
      dpw: [2, 3, 4], acc: [3], dAcc: 3, refs: ['jm', 'williams17', 'load17'],
      s: 'Four-week waves on the squat, bench, deadlift and press \u2014 tens, then eights, fives and threes \u2014 each ending in one set for as many reps as you can, which sets the weights for the next wave.',
      who: 'A year or more in, and wanting a bigger squat, bench, deadlift and press.' },
    power: { n: 'Powerbuilding', sty: 'Heavy top sets, then bodybuilding', mode: 'grow', pb: 1, kits: ['gym', 'bar'],
      dpw: [3, 4], acc: [3, 4, 5], dAcc: 4, refs: ['pb14', 'rp21'],
      s: 'Each session opens with one heavy top set of a big lift and three lighter back-off sets, then RP-style accessory work that climbs week to week.',
      who: 'Wanting to be both stronger and bigger, a year or more in.' },
    cond: { n: 'Strength & conditioning', sty: 'In the style of CrossFit', mode: 'cond',
      dpw: [2, 3, 4, 5], acc: [4, 6, 8], dAcc: 6, refs: ['claudino18', 'milanovic15', 'klimek18'],
      s: 'A few strength sets, then a short, hard circuit \u2014 as many rounds as you can, every minute on the minute, or rounds for time \u2014 from movements that suit your kit and your joints. Each circuit comes back the next week, so there is a score to beat.',
      who: 'Wanting fitness as much as muscle: harder breathing, less time.' },
    keep: { n: 'Keep strength', sty: 'A maintenance block', mode: 'keep',
      dpw: [2, 3], acc: [6, 8, 10], dAcc: 8, refs: ['bickel11', 'spiering21', 'iversen21'],
      s: 'Full body, two or three days, a few hard sets of each movement, paired to fit short sessions. The same every week: no climb, no deload.',
      who: 'Strength you have built, and less time — or more life — to fit it around.' },
    home: { n: 'Home & bodyweight', sty: 'Progressions instead of plates', mode: 'grow', kits: ['bw', 'db'],
      dpw: [2, 3, 4], acc: [3, 4, 5], dAcc: 4, refs: ['kotarsky18', 'load17'],
      s: 'Full body with what you have at home. When an exercise gets easy it moves you up to a harder version, which is how bodyweight keeps working.',
      who: 'Training at home, with a pair of dumbbells or with nothing.' }
  };
  var PROG_ORDER = ['start', 'grow', 'focus', 'waves', 'power', 'cond', 'lean', 'keep', 'home'];
  /* The days a program runs on, given the days you have: the nearest it
     offers, never more than you have unless it cannot run on fewer. */
  function fitDpw(P, dpw) {
    var ok = P.dpw.filter(function (d) { return d <= dpw; });
    return ok.length ? ok[ok.length - 1] : P.dpw[0];
  }

  /* ------------------------------------------------------------- the clock
   *
   * How long a session takes, estimated rather than promised: three quarters
   * of a minute a set, the rest the settings give it between straight sets,
   * the paired rest between the halves of a pair, a minute to move between
   * exercises, five to warm up. Close enough to plan a lunch hour around. */
  function estDay(day, sets) {
    if (day.cc) return circuitMin(day);
    var t = 5, groups = {};
    // a circuit is its own minutes, and two to set it up
    if (day.mc && mcValid(day.mc)) t += mcMinutes(day.mc) + 2;
    var straight = function (sl, n) { return n * 0.75 + Math.max(0, n - 1) * restFor(lib(sl.e)) / 60 + 1; };
    day.s.forEach(function (sl, i) {
      var n = sets ? sets[i] : sl.n;
      if (sl.p) { (groups[sl.p] = groups[sl.p] || []).push({ sl: sl, n: n }); return; }
      t += straight(sl, n);
    });
    Object.keys(groups).forEach(function (g) {
      var list = groups[g];
      // a pair that has lost its other half is a straight set again
      if (list.length < 2) { t += straight(list[0].sl, list[0].n); return; }
      var tot = list.reduce(function (a, b) { return a + b.n; }, 0);
      t += tot * 0.75 + Math.max(0, tot - 1) * T.pr.rp / 60 + 1;
    });
    return Math.round(t);
  }

  var REGION = { quads: 'l', hams: 'l', glutes: 'l', calves: 'l', chest: 'u', front: 'u', side: 'u',
    triceps: 'u', back: 'p', rear: 'p', biceps: 'p', traps: 'p', abs: 'c' };

  /* Make a day fit the minutes you have, in the order that costs least:
     pair what is not paired yet (a push beside a pull, legs beside arms),
     then take isolation work to two sets, then the big lifts to two, then
     drop exercises from the end — the ones for a muscle you did not ask to
     bring up first — until it fits or three are left. */
  function fitDay(day, min, pri) {
    if (!min || estDay(day) <= min) return;
    var g = day.s.reduce(function (m, sl) { return Math.max(m, sl.p || 0); }, 0);
    // a main lift is done on its own, rested, at its own sets
    day.s.forEach(function (a, i) {
      if (a.p || a.m) return;
      for (var j = i + 1; j < day.s.length; j++) {
        var b = day.s[j];
        if (b.p || b.m || REGION[musOf(a.e)] === REGION[musOf(b.e)]) continue;
        g++; a.p = g; b.p = g;
        var moved = day.s.splice(j, 1)[0];
        day.s.splice(i + 1, 0, moved);
        break;
      }
    });
    var trim = function (kind) {
      day.s.forEach(function (sl) {
        if (!sl.m && estDay(day) > min && lib(sl.e).k === kind && sl.n > 2) sl.n = 2;
      });
    };
    trim('i');
    trim('c');
    var guard = 20;
    while (estDay(day) > min && day.s.length > 3 && guard--) {
      var at = -1;
      for (var k = day.s.length - 1; k >= 0 && at < 0; k--) {
        if (!day.s[k].m && (pri || []).indexOf(musOf(day.s[k].e)) < 0 && lib(day.s[k].e).k === 'i') at = k;
      }
      if (at < 0) for (k = day.s.length - 1; k >= 0 && at < 0; k--) if (!day.s[k].m) at = k;
      if (at < 0) break;
      var gone = day.s.splice(at, 1)[0];
      if (gone.p) day.s.forEach(function (sl) { if (sl.p === gone.p) delete sl.p; });
    }
  }

  /* A block, from a program and your answers.
   *
   * To grow: week one's sets per muscle start at RP's MEV, moved two for
   * experience and two more for a muscle you want to bring up, then spread
   * across the slots that muscle has. Never under two per exercise, because
   * one set a week is not enough for the feedback to mean anything. And never
   * so high that a set a week would carry it past MRV before the deload.
   * An emphasis block starts its focus four over, and holds the rest at
   * about three-fifths of MEV; a fat-loss block climbs toward a lower roof.
   *
   * To keep, or to start out: the splits above, a few sets each, as they
   * stand.
   *
   * Then some of what you said about yourself, each of which the draft
   * says out loud because they are judgement rather than trial results:
   *   - a sport that works the legs hard, or a physical job, starts the
   *     leg sets two lower, and the job the back sets too — the feedback
   *     adds them back if you recover;
   *   - past sixty, keeping uses three sets of everything whatever the
   *     days: in Bickel et al. (2011) the older lifters needed about a
   *     third of the training that built their muscle to keep it, the
   *     younger about a ninth;
   *   - somebody new to lifting starts bodyweight work a rung down —
   *     push-ups from the incline, pull-ups from the negative.
   *
   * Last, made to fit the minutes you have and kept clear of what your back
   * and joints have said no to. */
  function build(o) {
    var pid = PROGS[o.prog] ? o.prog : o.goal === 'keep' ? 'keep' : 'grow';
    var P = PROGS[pid];
    var mode = P.mode, keep = mode === 'keep', base = mode === 'base', str = mode === 'str', cond = mode === 'cond';
    var wave = WAVES[o.wave] ? Number(o.wave) : 10;
    var dpw = fitDpw(P, [2, 3, 4, 5, 6, 7].indexOf(o.dpw) >= 0 ? o.dpw : 4);
    var fx = pid === 'focus' ? FOCUS[o.fx] || FOCUS.chest : null;
    var kit = KITS[o.kit] ? o.kit : 'gym';
    var eq = KITS[kit].eq;
    /* A gym split at home leaves gaps where the machines were; the home
       templates are written around them, so building or leaning out at home
       uses those where the days allow. */
    var homeDays = HOME_SPLITS[dpw] && (pid === 'home' || (atHome(eq) && (pid === 'grow' || pid === 'lean')));
    var split = keep ? KEEP_SPLITS[dpw] : base ? START_SPLITS[dpw] : str ? STR_SPLITS[dpw] : P.pb ? PB_SPLITS[dpw]
      : cond ? COND_SPLITS[dpw]
      : homeDays ? HOME_SPLITS[dpw] : SPLITS[dpw];
    var pf = { bk: o.bk || '', jt: o.jt || '', avoid: o.avoid || [], lvl: o.lvl };
    var used = {}, downs = [];
    var isFx = function (tok) { return !!fx && fx.m.indexOf(tok.split('/')[0]) >= 0; };
    var days = split.days.map(function (row, di) {
      var toks = row[1].slice();
      if (fx && toks.some(isFx)) {
        // one more for the focus: the first of its extras this day lacks
        var extra = fx.add.map(function (_, j) { return fx.add[(di + j) % fx.add.length]; })
          .filter(function (a) { return toks.map(function (t) { return t.replace(/\+$/, ''); }).indexOf(a) < 0; })[0];
        toks.push(extra || fx.add[di % fx.add.length]);
        var mine = toks.filter(isFx), rest = toks.filter(function (t) { return !isFx(t); });
        var kind = function (k) { return function (t) { return (t.split('/')[1] === 'c') === k; }; };
        toks = mine.filter(kind(true)).concat(mine.filter(kind(false)), rest);
      }
      var s = [], g = 0, open = false, today = {};
      toks.forEach(function (tok) {
        if (tok.charAt(0) === '*') {
          var mx = pickMain(tok.slice(1), eq, pf, used);
          if (mx) { used[mx.id] = 1; today[mx.id] = 1; s.push({ e: mx.id, n: str ? wave === 3 ? 7 : 5 : 4, m: tok.slice(1) }); }
          return;
        }
        var join = tok.charAt(tok.length - 1) === '+';
        var t = tok.replace(/\+$/, '').split('/');
        var ex = pickEx(t[0], t[1], t[2] || '', eq, used, o.seed || 0, pf, today);
        // the focus is never left out for want of the right kind of exercise
        if (!ex && isFx(tok)) ex = pickEx(t[0], t[1] === 'c' ? 'i' : 'c', '', eq, used, o.seed || 0, pf, today);
        if (!ex) { open = false; return; }
        var down = o.lvl === 0 && LADDER_DOWN[ex.id];
        if (down && !today[down] && !barred(lib(down), pf)) { downs.push(lib(down).n); ex = lib(down); }
        used[ex.id] = 1;
        today[ex.id] = 1;
        var sl = { e: ex.id, n: 2 };
        if (open) { sl.p = g; open = false; }
        else if (join) { g++; sl.p = g; open = true; }
        s.push(sl);
      });
      // a pair whose other half found no exercise is not a pair
      s.forEach(function (sl) {
        if (sl.p && s.filter(function (x) { return x.p === sl.p; }).length < 2) delete sl.p;
      });
      return { n: row[0], s: s };
    });

    var notes = [];
    var hab = (o.hab || []).filter(function (h) { return !!HABITS[h]; });
    var legSport = hab.filter(function (h) { return HABITS[h].legs === 2; });
    var labor = o.day === 'labor';
    var acc;
    if (keep) {
      acc = [4, 6, 8, 10, 12].indexOf(o.acc) >= 0 ? o.acc : 8;
      var older = o.age === '60';
      days.forEach(function (day) { day.s.forEach(function (sl) { sl.n = dpw >= 3 && !older ? 2 : 3; }); });
      if (older && dpw >= 3) notes.push('Three sets of everything, not two: past sixty, keeping muscle took about a third of the training that built it, where younger lifters needed a ninth.');
    } else if (cond) {
      // steady strength, three sets, and a circuit a day; no deload at this dose
      acc = [4, 6, 8].indexOf(o.acc) >= 0 ? o.acc : 6;
      days.forEach(function (day, di) {
        day.s.forEach(function (sl) { sl.n = 3; });
        day.mc = circuit(di, o, eq, pf);
      });
    } else if (str) {
      // one wave: three working weeks and a deload; the accessories steady at three sets
      acc = 3;
      days.forEach(function (day) { day.s.forEach(function (sl) { if (!sl.m) sl.n = 3; }); });
    } else if (base) {
      acc = [4, 6, 8].indexOf(o.acc) >= 0 ? o.acc : 6;
      days.forEach(function (day) {
        day.s.forEach(function (sl) { sl.n = lib(sl.e).k === 'c' && dpw < 3 ? 3 : 2; });
      });
    } else {
      acc = Math.max(2, Math.min(6, o.acc || P.dAcc));
      var by = {};
      days.forEach(function (day) {
        day.s.forEach(function (sl) { if (sl.m) return; var m = musOf(sl.e); (by[m] = by[m] || []).push(sl); });
      });
      var lvl = [-2, 0, 2][o.lvl] || 0;
      var trim = {};
      if (legSport.length || labor) ['quads', 'hams', 'glutes', 'calves'].forEach(function (m) { trim[m] = 1; });
      if (labor) trim.back = 1;
      var trimmed = false;
      Object.keys(by).forEach(function (m) {
        var mu = MUS[m], list = by[m], n = list.length;
        var roof = P.cap ? Math.round(mu.mrv * P.cap) : mu.mrv;
        var inFx = !!fx && fx.m.indexOf(m) >= 0;
        var want;
        if (fx && !inFx) {
          /* Held, at about three-fifths of MEV — near RP's maintenance
             volume — on as few exercises as carry it at two sets or more,
             so the time goes to the focus rather than to one-set slots. */
          want = Math.max(2, Math.round(mu.mev * 0.6));
          var dayOf = function (sl) { return days.filter(function (day) { return day.s.indexOf(sl) >= 0; })[0]; };
          while (list.length > 1 && list.length * 2 > want) {
            // never so far that a day is left with less than two exercises
            var can = list.filter(function (sl) { return dayOf(sl).s.length > 2; });
            if (!can.length) break;
            var drop = can.filter(function (sl) { return lib(sl.e).k === 'i'; }).pop() || can[can.length - 1];
            list.splice(list.indexOf(drop), 1);
            var home = dayOf(drop);
            home.s.splice(home.s.indexOf(drop), 1);
            if (drop.p) home.s.forEach(function (sl) { if (sl.p === drop.p) delete sl.p; });
          }
          n = list.length;
        } else {
          var cut = trim[m] && !inFx && mu.mev + lvl - 2 >= n * 2 ? 2 : 0;
          if (cut) trimmed = true;
          // a focus starts from at least four, so one with an MEV of zero still gets its extra work
          want = (inFx ? Math.max(mu.mev, 4) + 4 : mu.mev + ((o.pri || []).indexOf(m) >= 0 ? 2 : 0)) + lvl - cut;
          want = Math.min(want, roof - (acc - 1));
          want = Math.max(want, n * 2);
        }
        var b = Math.floor(want / n), extra = want - b * n;
        list.forEach(function (sl, i) { sl.n = Math.max(1, Math.min(5, b + (i < extra ? 1 : 0))); });
      });
      if (trimmed) {
        notes.push((labor ? 'Leg and back sets start two lower: a physical job is training too.'
          : 'Leg sets start two lower: ' + names(legSport.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; })) +
            ' already work' + (legSport.length > 1 ? '' : 's') + ' your legs hard.') +
          ' The feedback adds them back if you recover.');
      }
      if (fx) notes.push(fx.n + ' goes first and gets the most sets; everything else is held at a dose that keeps it.');
      if (P.cap) notes.push('The weekly climb stops lower than it would on a building block, and reps stay a rep short of failure: recovery is slower while you eat less.');
    }
    downs = uniq(downs);
    if (downs.length) notes.push(names(downs.map(function (n) { return { n: n }; })) + (downs.length > 1 ? ' are the easier versions' : ' is the easier version') + ' to start on; the plan moves you up as each gets easy.');
    if (pf.bk) notes.push('Leaves out lifts that load your back the way you said, and cues the ones that load it a little.');
    if (pf.jt) notes.push('Leaves out lifts that load your ' + names(pf.jt.split('').map(function (j) { return { n: JNAME[j].toLowerCase() }; })) +
      ' hard, and cues the ones that load ' + (pf.jt.length > 1 ? 'them' : 'it') + ' a little.');

    var min = [30, 40, 45, 60, 75].indexOf(o.min) >= 0 ? o.min : 0;
    days.forEach(function (day) { fitDay(day, min, fx ? fx.m : o.pri); });
    var label = pid === 'grow' && !homeDays ? split.n : fx ? fx.n + ' focus' : str ? P.n + ' \u00b7 ' + wave + 's' : P.n;
    /* The easy day goes in last, so nothing that shapes the lifting days
       sees it. It asks for no sets, so the volume and the minutes are the
       lifting days' alone. */
    if (o.ez) {
      days.push({ n: 'Easy day', s: [], ez: 1 });
      notes.push('One easy day a week: a walk, a ride, a swim or yoga, easy enough to talk through. It keeps you moving while what you trained recovers.');
    }
    var ms = {
      id: newId(), n: label + ' · ' + dpw + ' days' + (o.ez ? ' + easy' : '') + (min ? ' · ' + min + ' min' : ''),
      at: Date.now(), goal: mode, prog: pid, min: min,
      acc: acc, lvl: [0, 1, 2].indexOf(o.lvl) >= 0 ? o.lvl : 1, kit: kit, dpw: dpw,
      pri: mode === 'grow' && !fx ? (o.pri || []).slice(0, 3) : [],
      seed: o.seed || 0, days: days, sk: [], nt: notes
    };
    if (fx) { ms.fx = fx.m.slice(); ms.fk = FOCUS[o.fx] ? o.fx : 'chest'; }
    if (P.cap) ms.cap = P.cap;
    if (P.pb) ms.pb = 1;
    if (str) {
      ms.wave = wave;
      /* Training maxes: those handed over (from the last wave, or typed in),
         else from your log; a lift with neither gets one after its first
         session. Kept in the unit you read in now. */
      ms.tu = T.pr.u;
      ms.tm = {};
      days.forEach(function (day) {
        day.s.forEach(function (sl) {
          if (!sl.m) return;
          var given = o.tm && fin(o.tm[sl.e]) && o.tm[sl.e] > 0 ? o.tm[sl.e] : tmOf({}, sl.e);
          if (given) ms.tm[sl.e] = given;
        });
      });
    }
    return ms;
  }

  /* ---------------------------------------------------------------- records */
  function zeroRec() { return { e1: 0, w: 0, r: 0, vol: 0 }; }

  /* Everything logged for a lift, or everything before a moment — the second
     only for the workout still open, which is not in the index yet. */
  function records(e, upto) {
    if (!upto) return ix().best[e] || zeroRec();
    var best = zeroRec();
    ix().list.forEach(function (wo) {
      if (wo.st >= upto) return;
      var x = exIn(wo, e);
      if (!x) return;
      var bw = bwFor(e, wo);
      x.s.forEach(function (s) {
        if (!counts(s)) return;
        var w = conv(s.w, wo.u);
        best.e1 = Math.max(best.e1, e1Of(e, w, s.r, bw));
        if (!ASST[e]) { best.w = Math.max(best.w, w); best.vol = Math.max(best.vol, w * s.r); }
        if (!(w < 0)) best.r = Math.max(best.r, s.r);
      });
    });
    return best;
  }

  /* Which records these sets break, in words, or '' for none. Reps count as
     a record only on a bodyweight lift with nothing added — ten reps with
     half the weight is not a better set. */
  function beats(had, sets, u, e, bwRaw) {
    if (!(had.e1 > 0 || had.r > 0)) return '';
    var hit = { e1: false, w: false, r: false };
    var bw = usesBw(e) && fin(bwRaw) ? conv(bwRaw, u) : null;
    sets.forEach(function (s) {
      if (!counts(s)) return;
      var w = conv(fin(s.w) ? s.w : 0, u), r = fin(s.r) ? s.r : 0;
      if (had.e1 > 0 && e1Of(e, w, r, bw) > had.e1 + 0.01) hit.e1 = true;
      if (!ASST[e] && had.w > 0 && w > had.w) hit.w = true;
      if (w === 0 && !(had.w > 0) && r > had.r) hit.r = true;
    });
    return [hit.w ? 'heaviest' : '', hit.e1 ? 'best est. max' : '', hit.r ? 'most reps' : '']
      .filter(Boolean).join(', ');
  }

  /* Records set by a workout, against everything logged before it began. */
  function prsIn(wo) {
    var known = ix().prs[wo.id];
    if (known && T.wo[wo.id] === wo) return known;
    var out = [];
    wo.x.forEach(function (x) {
      var hit = beats(records(x.e, wo.st), x.s.filter(counts), wo.u, x.e, woBw(wo));
      if (hit) out.push({ e: x.e, what: hit });
    });
    return out;
  }

  /* ---------------------------------------------------------------- review
   *
   * The formula. Inputs are what you logged; outputs are what your lifts did;
   * each rule is a line from the research and says which line. It does not
   * know your goals, your sleep or your joints, and it says so rather than
   * pretending. */
  /* Which week the review reads.
   *
   * In a block, the block's own week: the latest one with every session
   * logged or skipped, from its first session up to the next week's first,
   * so a workout done outside the block that week counts too. A rolling
   * seven days was the first answer, and it cut training weeks in half — on
   * a Monday-to-Saturday rota, a review read on a Tuesday lost Monday's
   * session and called chest neglected on a week it got eight sets. Deload
   * weeks are skipped: their volume is low on purpose.
   *
   * With no block, the last seven days, which is the only week there is. */
  function reviewWindow(now) {
    var list = ix().list;
    var ms = active();
    if (ms) {
      var sk = Array.isArray(ms.sk) ? ms.sk : [];
      var starts = {};
      list.forEach(function (w) {
        if (w.ms === ms.id && fin(w.w) && w.w >= 0 && w.w < accOf(ms) && !w.dl) {
          if (starts[w.w] === undefined || w.st < starts[w.w]) starts[w.w] = w.st;
        }
      });
      var weeks = Object.keys(starts).map(Number).sort(function (a, b) { return a - b; });
      if (weeks.length) {
        var done = weeks.filter(function (w) {
          return ms.days.every(function (day, d) { return day.ez || woFor(ms, w, d) || sk.indexOf(w + ':' + d) >= 0; });
        });
        var pick = done.length ? done[done.length - 1] : weeks[weeks.length - 1];
        var from = starts[pick];
        var later = weeks.filter(function (w) { return w > pick; });
        var to = later.length ? starts[later[0]] : now + 1;
        return {
          wos: list.filter(function (w) { return w.st >= from && w.st < to && !w.dl; }),
          label: 'Week ' + (pick + 1) + ' of your block',
          partial: !done.length,
          pick: pick
        };
      }
    }
    var first = list[0];
    return {
      wos: list.filter(function (w) { return w.st >= now - 7 * DAY_MS && w.st <= now; }),
      label: 'The last seven days',
      partial: !!first && now - first.st < 6 * DAY_MS,
      age: first ? Math.max(1, Math.round((now - first.st) / DAY_MS)) : 0
    };
  }

  function review(now) {
    now = now || Date.now();
    var win = reviewWindow(now);
    var wos = win.wos;
    var mus = {};
    var reps = { n: 0, out: 0 };
    var rests = { c: [], i: [] }, restBy = {};
    wos.forEach(function (wo) {
      wo.x.forEach(function (x) {
        var ex = lib(x.e), m = ex.m;
        var r = mus[m] = mus[m] || { sets: 0, days: {} };
        // ramp sets on the way up to a heavy one are warm-ups, not hard sets
        var work = x.s.filter(counts);
        r.sets += work.length;
        if (work.length) r.days[wo.dk || dayKey(new Date(wo.st))] = 1;
        x.s.forEach(function (s, i) {
          if (!counts(s)) return;
          reps.n++;
          if (s.r < 5 || s.r > 30) reps.out++;
          if (i > 0 && fin(s.t) && fin(x.s[i - 1].t) && s.t && x.s[i - 1].t) {
            var gap = (s.t - x.s[i - 1].t) / 1000;
            // a set takes about forty seconds; what is left is the rest
            if (gap > 20 && gap < 900) {
              var rest = Math.max(0, gap - 40);
              rests[ex.k === 'c' ? 'c' : 'i'].push(rest);
              (restBy[x.e] = restBy[x.e] || []).push(rest);
            }
          }
        });
      });
    });

    var ms = active();
    var inBlock = {};
    if (ms) ms.days.forEach(function (d) { d.s.forEach(function (s) { inBlock[musOf(s.e)] = 1; }); });
    /* Graded against what you are training for. Keeping is judged by the
       keeping research, not by the growing research — six sets a week is a
       failing grade for growth and a comfortable one for maintenance. */
    var keep = ms ? isKeep(ms) : T.pr.goal === 'keep';
    /* A beginner's block by the beginner's evidence, and an emphasis block's
       held muscles by the keeping evidence: neither is failing for being
       under ten sets. */
    var base = !!ms && ms.goal === 'base';
    var str = !!ms && (ms.goal === 'str' || ms.goal === 'cond');
    var fxs = ms && Array.isArray(ms.fx) ? ms.fx : [];
    var held = function (k) { return keep || base || str || (fxs.length > 0 && fxs.indexOf(k) < 0); };
    /* What a steady plan itself asks of each muscle a week: doing all of it
       is never "under" anything, even where it is two sets. */
    var planned = {};
    if (ms && steady(ms)) ms.days.forEach(function (d) { d.s.forEach(function (s) { var m = musOf(s.e); planned[m] = (planned[m] || 0) + s.n; }); });
    var floor = function (k) { return Math.min(3, planned[k] || 3); };

    var rows = MUSCLES.filter(function (m) { return mus[m.k] || inBlock[m.k]; }).map(function (m) {
      var r = mus[m.k] || { sets: 0, days: {} };
      var st = held(m.k) ? (r.sets < floor(m.k) ? 'low' : 'good')
        : r.sets < 5 ? 'low' : r.sets < 10 ? 'fair' : r.sets <= 20 ? 'good' : 'high';
      return { k: m.k, n: m.n, sets: r.sets, days: Object.keys(r.days).length, mev: m.mev, mrv: m.mrv, st: st };
    });

    var checks = [];
    if (!wos.length) {
      checks.push({ st: 'info', t: 'Nothing logged in the last seven days',
        b: 'The review reads the last week of finished workouts. Log one and this fills in.', refs: [] });
      var ac0 = activityCheck(now, 0);
      if (ac0) checks.push(ac0);
      return { rows: rows, checks: checks, n: 0, prog: progress(now), label: win.label, keep: keep, base: base, str: str,
        cond: !!ms && ms.goal === 'cond' };
    }

    /* A week that is not over cannot be graded as a week. Half of one, with
       the other sessions still to come, would call half the body neglected,
       which is a true count and a false verdict. */
    var young = win.partial;
    var notYet = win.pick !== undefined
      ? 'Week ' + (win.pick + 1) + ' of your block is not finished, so this is not a whole week yet.'
      : 'Your log is ' + (win.age === 1 ? 'a day' : win.age + ' days') + ' old, so this is not a whole week yet.';
    var graded = rows.filter(function (r) { return !held(r.k); });
    var low = graded.filter(function (r) { return r.sets > 0 && r.sets < 5; });
    var high = graded.filter(function (r) { return r.sets > 20; });
    var none = graded.filter(function (r) { return !r.sets; });
    /* What the plan itself asks for this week is not a warning: a block
       that starts a muscle at four sets and builds from there is doing so on
       purpose, and "worth a look" over a choice you can't act on is noise.
       It is said, quietly, in the check's reasons instead. */
    var chose = [];
    if (ms && !keep && !base && !str && win.pick !== undefined) {
      var planT = totals(ms, setsFor(ms, Math.min(win.pick, accOf(ms))).sets);
      // on purpose: the plan has it, under five, and you did what it asked
      var onPurpose = function (r) { return planT[r.k] > 0 && planT[r.k] < 5 && r.sets >= planT[r.k]; };
      chose = low.concat(none).filter(onPurpose);
      low = low.filter(function (r) { return !onPurpose(r); });
      none = none.filter(function (r) { return !onPurpose(r); });
    }
    var inRange = graded.filter(function (r) { return r.sets >= 10 && r.sets <= 20; });
    var thin = rows.filter(function (r) { return r.sets < floor(r.k); });
    if (base) checks.push({
      st: young ? 'info' : thin.length ? 'look' : 'good',
      t: 'Enough to grow on?',
      b: young
        ? notYet + ' Starting out, about three hard sets a muscle a week is enough to grow and get stronger; read this again once a full week is in.'
        : thin.length
          ? names(thin) + (thin.length > 1 ? ' are' : ' is') + ' under three hard sets this week. A beginner needs little, but it has to be done.'
          : 'Every muscle got three or more hard sets. That is plenty while you are new: the first year grows on a fraction of what a trained lifter needs, which is why the sets are not climbing.',
      refs: ['acsm09', 'vol17']
    });
    else if (str && ms.goal === 'cond') checks.push({
      st: young ? 'info' : thin.length ? 'look' : 'good',
      t: 'Enough strength beside the circuits?',
      b: young
        ? notYet + ' A few steady, heavy sets a muscle a week keep and build strength beside the circuits; read this again once a full week is in.'
        : thin.length
          ? names(thin) + (thin.length > 1 ? ' are' : ' is') + ' under three hard sets this week. The circuits build fitness; strength still needs its own heavy sets.'
          : 'Every muscle got three or more hard sets beside the circuits: the strength half of the week is covered.',
      refs: ['spiering21', 'claudino18']
    });
    else if (str) checks.push({
      st: young ? 'info' : thin.length ? 'look' : 'good',
      t: 'Enough work around the big lifts?',
      b: young
        ? notYet + ' A strength wave keeps the work around its main lifts steady at a few hard sets a muscle; read this again once a full week is in.'
        : thin.length
          ? names(thin) + (thin.length > 1 ? ' are' : ' is') + ' under three hard sets this week. The main lifts carry the strength; the muscle behind them still needs a little direct work.'
          : 'Every muscle got three or more hard sets. The main lifts are where the strength is built; this is the muscle that holds it up.',
      refs: ['williams17', 'spiering21']
    });
    else if (keep) checks.push({
      st: young ? 'info' : thin.length ? 'look' : 'good',
      t: 'Enough to keep it?',
      b: young
        ? notYet + ' Keeping strength takes about three hard, heavy sets a muscle a week or more; read this again once a full week is in.'
        : thin.length
          ? names(thin) + (thin.length > 1 ? ' are' : ' is') + ' under three hard sets this week. Maintenance takes little, but not nothing: strength held on a fraction of the training that built it, not on none.'
          : 'Every muscle got three or more hard sets. Strength that has been built held for months on about a third of the training that built it \u2014 less for younger lifters, a little more for older \u2014 as long as the loads stayed heavy.',
      refs: ['bickel11', 'spiering21', 'iversen21']
    });
    else checks.push({
      st: young ? 'info' : low.length || none.length ? 'look' : 'good',
      t: 'Weekly sets per muscle',
      b: young
        ? notYet + ' Ten to twenty hard sets a muscle a week is where the evidence is strongest; read this again once a full week is in.'
        : (inRange.length ? inRange.length + ' of ' + rows.length + ' muscles are in the 10–20 hard sets a week the evidence favours. ' : '') +
        (low.length ? names(low) + (low.length > 1 ? ' are' : ' is') + ' under five, where growth was smallest. ' : '') +
        (none.length ? names(none) + ' had no direct sets this week. ' : '') +
        (high.length ? names(high) + (high.length > 1 ? ' are' : ' is') + ' over twenty — it can still pay, at a shrinking rate, if you are recovering. ' : '') +
        (!low.length && !none.length && !high.length && !inRange.length ? 'Every muscle is between five and ten: enough to grow, and more would likely grow more. ' : '') +
        (fxs.length ? 'The rest are held at a keeping dose on purpose, while ' + names(fxs.map(function (k) { return { n: mname(k).toLowerCase() }; })) + ' take' + (fxs.length > 1 ? '' : 's') + ' the extra work. ' : '') +
        (chose.length ? names(chose) + (chose.length > 1 ? ' are' : ' is') + ' under five this week because the plan starts ' + (chose.length > 1 ? 'them' : 'it') + ' there and builds. ' : ''),
      refs: ['vol17', 'vol24', 'rp21'],
      fix: young ? null : setFix(ms, low.concat(none), win.pick)
    });

    var once = rows.filter(function (r) { return r.days === 1 && r.sets >= 6; });
    checks.push({
      st: young ? 'info' : once.length ? 'look' : 'good',
      t: 'How often each muscle is trained',
      b: young ? 'Needs a full week of log to say. Twice a week per muscle is the practical default; with sets equal, how you split them matters little.'
        : once.length
        ? names(once) + ' got ' + (once.length > 1 ? 'their' : 'its') + ' sets in a single day. With sets equal, frequency barely matters — but splitting them over two days keeps the later sets from being done tired.'
        : 'Every muscle with real volume was trained on at least two days, or has few enough sets that one day holds them.',
      refs: ['freq19', 'freq16']
    });

    var outPct = reps.n ? Math.round(100 * reps.out / reps.n) : 0;
    checks.push({
      st: outPct > 20 ? 'look' : 'good',
      t: 'Reps per set',
      b: outPct
        ? outPct + '% of sets fell outside 5–30 reps. Inside that band load barely matters to growth when the set ends close to failure; outside it the evidence is thinner.'
        : 'Every set landed between 5 and 30 reps, the band where load barely matters to growth.',
      refs: ['load17']
    });

    /* Judged lift by lift. One median across every compound lift let two
       minutes on the bench hide forty seconds on the rows, which is the lift
       being short-changed. */
    var mc = median(rests.c), mi = median(rests.i);
    var rushed = Object.keys(restBy).filter(function (e) {
      var a = restBy[e];
      return a.length >= 2 && median(a) < (lib(e).k === 'c' ? 60 : 45);
    });
    var rushedN = function (c) {
      return rushed.filter(function (e) { return (lib(e).k === 'c') === c; })
        .map(function (e) { return lib(e).n; }).join(', ');
    };
    var shortC = !!rushedN(true), shortI = !!rushedN(false);
    checks.push({
      st: !rests.c.length && !rests.i.length ? 'info' : shortC || shortI ? 'look' : 'good',
      t: 'Rest between sets',
      b: !rests.c.length && !rests.i.length
        ? 'Rest is measured from when you tick one set to when you tick the next. Tick sets as you finish them and this fills in.'
        : 'Typical rest: ' + (rests.c.length ? clock(mc) + ' on compound lifts' : '') +
          (rests.c.length && rests.i.length ? ', ' : '') + (rests.i.length ? clock(mi) + ' on isolation work' : '') + '. ' +
          (shortC ? 'Under a minute between sets on ' + rushedN(true) + ' costs a little growth — longer rest let people do more on the next set. ' : '') +
          (shortI ? 'Under 45 seconds on ' + rushedN(false) + ' is shorter than most studies tested. ' : '') +
          (!shortC && !shortI ? 'Long enough that the next set is not being cut short.' : ''),
      refs: ['rest16', 'rest24'],
      fix: rushed.length ? { t: 'restpick', a: ' data-e="' + esc(rushed[0]) + '"', say: 'Longer rest for ' + lib(rushed[0]).n } : null
    });

    /* Effort, when you have said it. Held against what the plan asked for
       the same sets where it asked; outside a block, against the zero to
       three reps short where the growth research found most of the growth. */
    var eff = { n: 0, q: 0, dn: 0, dq: 0, pq: 0 };
    wos.forEach(function (wo) {
      wo.x.forEach(function (x) {
        x.s.forEach(function (s) {
          var qv = fin(s.q) ? s.q : s.ty === 'f' ? 0 : null;
          if (!counts(s) || s.am || qv === null) return;
          var q = Math.min(5, qv);
          eff.n++; eff.q += q;
          if (fin(x.pq)) { eff.dn++; eff.dq += q; eff.pq += x.pq; }
        });
      });
    });
    var cant = T.pr.rq
      ? 'You have not said how close you went on enough sets to grade it: six will do.'
      : 'This app cannot see how close you went unless you tell it \u2014 Settings \u2192 Effort on each set \u2014 so it does not grade it.';
    if (eff.n >= 6) {
      var mq = eff.q / eff.n;
      var planned = eff.dn >= 6;
      var pq = planned ? eff.pq / eff.dn : null, dq = planned ? eff.dq / eff.dn : null;
      var off = planned ? dq - pq : 0;
      var say1 = function (v) { return fmtN(Math.round(v * 2) / 2); };
      checks.push({
        st: planned ? (Math.abs(off) <= 1 ? 'good' : 'look') : (mq > 3.5 ? 'look' : 'good'),
        t: 'How close to failure',
        b: 'You logged about ' + say1(mq) + ' reps to spare across ' + eff.n + ' sets' +
          (planned ? ', where the plan asked about ' + say1(pq) + '. ' +
            (off > 1 ? 'Further from failure than planned: the weights the plan gives next are built on your getting nearer, so if these felt easy, add a rep or the next weight up. Sets that stop four or more short grew noticeably less. '
              : off < -1 ? 'Closer to failure than planned: the last rep or two buy little growth and cost recovery, which this plan counts on for next week. '
              : 'On target. ')
            : '. ' + (mq > 3.5 ? 'Most of the growth in the research came from sets ending zero to three short; further than that grew noticeably less. '
              : 'Inside the zero to three short where most of the growth in the research was. ')) +
          'Guesses of reps to spare get better with practice, and are best near failure.',
        refs: ['fail24', 'rir16']
      });
    } else {
      checks.push({
        st: 'info',
        t: 'How close to failure',
        b: str && ms.goal === 'cond'
          ? 'The strength sets stop about two reps short of failure; the circuits are hard on purpose, but a rep done badly because you are out of breath is the one to leave out. ' + cant
          : str
          ? 'The main lifts go by percentages of your training max, with one all-out set a wave; everything else stops about two reps short of failure. ' + cant
          : base
          ? 'Starting out asks for three reps to spare, easing to two. ' + cant + ' Near enough to failure to count, far enough to keep your form while the movements are new.'
          : keep
          ? 'Keeping asks for about two reps to spare on the big lifts and one on the small ones. ' + cant + ' What keeps strength is the load staying heavy; going to failure adds little but fatigue.'
          : 'The block asks for ' + (ms ? 'reps to spare stepping from 3 to 0' : 'sets ending 0\u20133 reps short of failure') +
          '. ' + cant + ' Growth improves the closer a set ends to failure, and the last rep or two add little but fatigue.',
        refs: str && ms.goal === 'cond' ? ['klimek18', 'rir16'] : str ? ['jm', 'rir16'] : base ? ['acsm09', 'rir16'] : keep ? ['spiering21', 'fail23', 'rir16'] : ['fail24', 'fail23', 'rir16']
      });
    }

    var sore = {}, joints = [];
    wos.forEach(function (wo) {
      Object.keys(wo.sr || {}).forEach(function (m) { if (wo.sr[m] === 2) sore[m] = 1; });
      Object.keys(wo.fb || {}).forEach(function (m) { if (wo.fb[m] && wo.fb[m].j === 2) joints.push(m); });
    });
    var soreL = Object.keys(sore);
    if (soreL.length || joints.length) {
      checks.push({
        st: 'look',
        t: 'Recovery',
        b: (soreL.length ? 'Still sore going into a session: ' + soreL.map(mname).join(', ') + '. The block holds those sets rather than adding. ' : '') +
          (joints.length ? (T.pr.bk ? 'Back or joints' : 'Joints') + ' hurt a lot on ' + uniq(joints).map(mname).join(', ') + ' \u2014 worth swapping the exercise before adding anything to it.' : ''),
        refs: ['rp21']
      });
    }

    /* Your back, as you reported it at the start of each session. Graded
       only on what you said; the app has no other way to know. */
    if (T.pr.bk || T.pr.jt) {
      var part = T.pr.bk ? 'back' : 'joints';
      var said = wos.filter(function (wo) { return fin(wo.bk); });
      var bad = said.filter(function (wo) { return wo.bk === 2; }).length;
      var tight = said.filter(function (wo) { return wo.bk === 1; }).length;
      checks.push({
        st: !said.length ? 'info' : bad ? 'look' : 'good',
        t: 'Your ' + part,
        b: !said.length
          ? 'Each session asks how your ' + part + (part === 'back' ? ' is' : ' are') + ' before you start. Answer it and this keeps the tally.'
          : (bad ? 'Sore going into ' + bad + ' session' + (bad > 1 ? 's' : '') + ' this week. ' +
              'If it keeps happening, the pattern matters more than any one day \u2014 worth taking to a physio, along with which exercises came before it. '
            : tight ? 'Tight on ' + tight + ' of ' + said.length + ', never sore. ' : 'Good going into every session this week. ') +
            (T.pr.bk ? 'Exercise helps most backs with long-running trouble; which exercises suit yours is the individual part.'
              : 'Which exercises suit your joints is the individual part; the never list in Settings is where the answer goes.'),
        refs: T.pr.bk ? ['hayden21', 'long04'] : []
      });
    }

    /* Minutes against what you said you have. */
    var budget = (ms && ms.min) || T.pr.min;
    if (budget) {
      var lens = wos.filter(function (wo) { return wo.en > wo.st; }).map(function (wo) { return (wo.en - wo.st) / 60000; });
      if (lens.length) {
        var typ = Math.round(median(lens));
        checks.push({
          st: typ > budget * 1.15 ? 'look' : 'good',
          t: 'Time per session',
          b: 'Typical session: ' + typ + ' minutes against your ' + budget + '. ' +
            (typ > budget * 1.15
              ? 'Running long. Pairing more exercises, or two sets instead of three on the small ones, gives time back with little lost.'
              : 'Inside it. Paired sets and fewer, harder sets are what make a short session work.'),
          refs: ['iversen21'],
          fix: typ > budget * 1.15 ? longFix(ms) : null
        });
      }
    }

    var ac = activityCheck(now, wos.length);
    if (ac) checks.push(ac);

    /* The all-out sets of a strength wave, against their targets: the one
       place the method itself grades you, and what moves the next maxes. */
    var ams = [];
    wos.forEach(function (wo) {
      wo.x.forEach(function (x) { x.s.forEach(function (s) { if (s.am && fin(s.tr)) ams.push({ e: x.e, r: s.r, tr: s.tr }); }); });
    });
    if (ams.length) {
      var shortA = ams.filter(function (a) { return a.r < a.tr; });
      checks.push({
        st: shortA.length ? 'look' : 'good',
        t: 'Your all-out sets',
        b: ams.map(function (a) {
          return lib(a.e).n + ': ' + a.r + ' against ' + a.tr + (a.r !== a.tr ? ' (' + (a.r > a.tr ? '+' : '\u2212') + Math.abs(a.r - a.tr) + ')' : '');
        }).join('; ') + '. Each rep past the target adds a step to that lift\u2019s training max for the next wave; each rep short takes one off. ' +
          (shortA.length ? 'Falling short usually means the max was set a little high, or the week took more out of you than usual \u2014 the next wave starts lower, which is the method working, not failing.'
            : 'Beating the target is what a well-set training max looks like.'),
        refs: ['jm', 'williams17']
      });
    }

    /* Circuits, against the last time the same one was done: the score to
       beat is the progression. */
    var mcs = wos.filter(function (wo) { return wo.mc && mcValid(wo.mc) && mcScore(wo.mc); });
    if (mcs.length) {
      var cmp = mcs.map(function (wo) {
        var was = wo.ms ? lastCircuit(wo.ms, wo.d, wo.st) : null;
        return { n: wo.n, now: wo.mc, was: was, b: mcBetter(wo.mc, was) };
      });
      var downs = cmp.filter(function (c) { return c.was && c.b < 0; }).length;
      checks.push({
        st: downs > cmp.length / 2 ? 'look' : 'good',
        t: 'Your circuits',
        b: cmp.map(function (c) {
          return c.n + ' ' + MC_K[c.now.k] + ': ' + mcScore(c.now) +
            (c.was ? (c.b > 0 ? ', up from ' : c.b < 0 ? ', down from ' : ', the same as ') + mcScore(c.was) : ', the first time');
        }).join('; ') + '. ' +
          (downs > cmp.length / 2 ? 'Mostly down on last time. A bad week happens; two running usually means the week outside the gym is taking more than usual \u2014 sleep first.'
            : 'The same circuit comes back each week, so this is the plainest measure of fitness the app has. Hard intervals like these built aerobic fitness at least as well as longer steady cardio in the research.'),
        refs: ['milanovic15', 'claudino18']
      });
    }

    var prog = progress(now);
    if (prog.n && keep) {
      checks.push({
        st: prog.fall.length ? 'look' : 'good',
        t: 'Is your strength holding?',
        b: prog.held + ' of ' + prog.n + ' lifts done at least twice in the last four weeks are holding or up on estimated max. ' +
          (prog.fall.length
            ? 'Down two sessions running: ' + prog.fall.map(function (e) { return lib(e).n; }).join(', ') + '. The block adds a set back when that happens; if it keeps sliding, look at sleep and what else the week asked of you first.'
            : 'Nothing has slid two sessions running, which is what keeping looks like.'),
        refs: ['spiering21', 'epley']
      });
    } else if (prog.n) {
      checks.push({
        st: prog.fall.length ? 'look' : 'good',
        t: 'Are the lifts going up?',
        b: prog.up + ' of ' + prog.n + ' lifts done at least twice in the last four weeks are up on estimated max' +
          (prog.flat ? ', ' + prog.flat + ' flat' : '') + (prog.down ? ', ' + prog.down + ' down' : '') + '. ' +
          (prog.fall.length
            ? 'Down two sessions running: ' + prog.fall.map(function (e) { return lib(e).n; }).join(', ') + '. With reps to spare falling each week that is the classic sign of fatigue outrunning recovery — RP would deload rather than push on.'
            : 'Nothing has slid two sessions in a row, so there is no sign of fatigue outrunning recovery.') +
          /* The estimate cannot see effort, and inside a block effort rises
             on purpose. Said, rather than let a climbing line be read as all
             new muscle. */
          (ms ? ' Some of any rise inside a block is the reps to spare coming down rather than new strength \u2014 the first week of one block against the first week of the next is the cleaner comparison.' : ''),
        refs: ['rp21', 'epley', 'deload24'],
        fix: prog.fall.length && ms && !steady(ms) && nextSlot(ms) && nextSlot(ms).w < accOf(ms) ? { t: 'deloadnow', a: '', say: 'Deload now' } : null
      });
    }
    return { rows: rows, checks: checks, n: wos.length, prog: prog, label: win.label, keep: keep, base: base, str: str,
      cond: !!ms && ms.goal === 'cond' };
  }

  /* The one thing to do about muscles short of sets: one more set, for the
     rest of the block, on the day that has the fewest of that muscle, on an
     exercise already there. The first such muscle only: one tap, one
     change, and the review reads it again next week. */
  function setFix(ms, rows, wk) {
    if (!ms) return null;
    var done = Array.isArray(ms.fixd) ? ms.fixd : [];
    for (var k = 0; k < rows.length; k++) {
      var m = rows[k].k, pick = null;
      // the review is read from the log, so it would offer the same set again after it was added
      if (done.indexOf(wk + ':' + m) >= 0) continue;
      ms.days.forEach(function (day, d) {
        if (day.ez) return;
        var tot = 0, slot = -1;
        day.s.forEach(function (sl, i) { if (musOf(sl.e) === m && !sl.m) { tot += sl.n; if (slot < 0 || sl.n < day.s[slot].n) slot = i; } });
        if (slot >= 0 && day.s[slot].n < 6 && (!pick || tot < pick.tot)) pick = { d: d, i: slot, tot: tot };
      });
      if (pick) {
        return { t: 'fixset', a: ' data-d="' + pick.d + '" data-i="' + pick.i + '" data-k="' + esc(wk + ':' + m) + '"',
          say: 'Add a set of ' + lib(ms.days[pick.d].s[pick.i].e).n + ' to ' + dayName(ms.days[pick.d]) };
      }
    }
    return null;
  }

  // the day that runs longest next week, opened to trim: a set off, a pair, a swap
  function longFix(ms) {
    var nx = ms && nextSlot(ms);
    if (!nx) return null;
    var sf = setsFor(ms, Math.min(nx.w, accOf(ms))), top = null;
    ms.days.forEach(function (day, d) {
      if (day.ez) return;
      var m = estDay(day, sf.sets[d]);
      if (!top || m > top.m) top = { d: d, m: m };
    });
    return top ? { t: 'plansheet', a: ' data-w="' + nx.w + '" data-d="' + top.d + '"', say: 'See ' + dayName(ms.days[top.d]) + ', the longest' } : null;
  }

  /* Cardio, from what you logged outside the gym, against the WHO's 150 to
     300 moderate minutes a week — and the two strength days it also asks
     for, which the workouts supply. Shown once you have said you golf or
     walk, or have logged either. */
  /* Minutes of circuit in the workouts of the last seven days: vigorous
     by any measure, so they count twice toward the WHO's 150 too. */
  function circuitMinutes(now) {
    var mins = 0;
    ix().list.forEach(function (wo) {
      if (wo.st < now - 7 * DAY_MS || wo.st > now || !wo.mc || !mcValid(wo.mc)) return;
      var c = wo.mc;
      mins += c.k === 'rft' ? (fin(c.sec) ? Math.min(c.sec / 60, mcMinutes(c)) : 0) : c.k === 'emom' ? (fin(c.done) ? c.done : 0) : (fin(c.r) ? c.min : 0);
    });
    return Math.round(mins);
  }
  function activityCheck(now, lifts) {
    var wk = axWeek(now);
    var cm = circuitMinutes(now);
    if (cm) {
      wk.min += cm; wk.mv += cm * 2;
      wk.by['circuits in your workouts'] = cm;
    }
    if (!T.pr.hab.length && !wk.min) return null;
    var parts = Object.keys(wk.by).map(function (k) { return k + ' ' + dur(wk.by[k] * 60000); });
    var ok = wk.mv >= 150;
    return {
      st: ok ? 'good' : wk.min ? 'look' : 'info',
      t: cm ? 'Active minutes, circuits included' : 'Active minutes outside the gym',
      b: (wk.min ? dur(wk.min * 60000) + ' in the last seven days (' + parts.join(', ') + '), worth ' + wk.mv + ' moderate minutes'
          : 'Nothing logged in the last seven days') +
        ' against the 150 a week the WHO recommends. A vigorous minute counts as two' +
        (wk.light ? '; light activity like gentle yoga is good for you but does not count toward it' : '') + '. ' +
        (lifts >= 2 ? 'And ' + lifts + ' strength sessions against its two. ' : lifts === 1 ? 'And one strength session so far against its two. ' : '') +
        (ok ? 'Covered.' : wk.min ? (150 - wk.mv) + ' minutes short \u2014 a couple of brisk walks would do it.'
          : 'Log a walk, a round or a game from the Block tab and this counts it.') +
        ' How hard each one was is the Compendium of Physical Activities\u2019 rating unless you marked it otherwise: golf is moderate whether you walk or ride; a run or a game of soccer is vigorous.',
      refs: ['who20', 'compendium11']
    };
  }

  /* Estimated max, first session against the latest, for every lift done at
     least twice in four weeks. Bodyweight lifts with nothing added are
     measured in reps instead. */
  function progress(now) {
    var from = now - 28 * DAY_MS;
    var per = {};
    ix().list.forEach(function (wo) {
      if (wo.st < from || wo.st > now || wo.dl) return;
      wo.x.forEach(function (x) {
        if (!x.s.length) return;
        var v = liftE1(x, wo);
        if (!(v > 0)) v = Math.max.apply(null, x.s.map(function (s) { return s.r; }));
        (per[x.e] = per[x.e] || []).push(v);
      });
    });
    var out = { n: 0, up: 0, flat: 0, down: 0, held: 0, fall: [], lifts: [] };
    Object.keys(per).forEach(function (e) {
      var v = per[e];
      if (v.length < 2) return;
      out.n++;
      var ch = v[v.length - 1] / v[0] - 1;
      if (ch > 0.01) out.up++; else if (ch < -0.01) out.down++; else out.flat++;
      if (ch >= -0.03) out.held++;
      var k = v.length;
      if (k >= 3 && v[k - 1] < v[k - 2] * 0.99 && v[k - 2] < v[k - 3] * 0.99) out.fall.push(e);
      out.lifts.push({ e: e, ch: ch, n: k });
    });
    out.lifts.sort(function (a, b) { return b.ch - a.ch; });
    return out;
  }

  /* ------------------------------------------------------ the week, both tabs
   *
   * One screen, opened from Nourish's morning card and from the Review: the
   * scale, the food and the training of the last seven days side by side,
   * and at most two things worth doing about them. Nourish reads its own
   * half (Hive.week); the training is read here, over the same seven days. */
  function checkin(now) {
    now = now || Date.now();
    var h = hive(), nw = null;
    try { nw = h && h.week ? h.week() : null; } catch (e) { nw = null; }
    var keyAgo = function (n) { var d = new Date(now); d.setDate(d.getDate() - n); return dayKey(d); };
    var from = keyAgo(7), to = keyAgo(1);
    var wos = ix().list.filter(function (wo) { var k = wo.dk || dayKey(new Date(wo.st)); return k >= from && k <= to; });
    var sets = wos.reduce(function (n, wo) {
      return n + wo.x.reduce(function (a, x) { return a + x.s.filter(counts).length; }, 0);
    }, 0);
    var c = { from: from, to: to, nw: nw, n: wos.length, sets: sets, prog: progress(now), ph: phaseNow(),
      today: trainedOn(keyAgo(0)) };
    c.reads = chkReads(c);
    return c;
  }
  function pctSay(v) { return fmtN(Math.round(Math.abs(v) * 1000) / 10) + '%'; }
  /* The reads, most pressing first, two at most: a few words saying what,
     and a few saying what to do. Each is a rule a coach would state: past
     about 1% a week more of what comes off is muscle; a lean gain is about
     a quarter of a percent; protein is what the lifting protects muscle
     with on a cut. A week with nothing wrong says what went right. */
  function chkReads(c) {
    var nw = c.nw, look = [], out = [];
    var w = nw && nw.w, lb = nw && nw.lb;
    var loss = w && w.now > 0 && w.was > 0 && w.n >= 3 && w.m >= 3 ? (w.was - w.now) / w.was : null;
    var plan = nw && fin(nw.plan) ? nw.plan : null;
    /* How far under maintenance, from the same seven days the rows show,
       so the reads and the numbers agree; Nourish's two-week reading when
       too few of the seven are logged to say. */
    var under = nw && nw.days >= 4 && fin(nw.kcal) && nw.maint > 0 ? Math.round((nw.maint - nw.kcal) / 10) * 10 : c.ph ? c.ph.k : null;
    var cut = under !== null && lb > 0 ? under * 7 / 3500 / lb >= 0.0025 : !!c.ph && c.ph.r >= 0.0025;
    var p = c.prog, slip = p.lifts.filter(function (l) { return l.ch < -0.03; }).map(function (l) { return lib(l.e).n; });
    var falling = p.n >= 2 && (p.fall.length > 0 || (p.down > p.up && p.down >= 2));
    if (loss !== null && loss >= 0.01 && (plan === null || loss > plan + 0.0025)) {
      var more = lb ? Math.round((loss - Math.max(plan || 0, 0.0075)) * lb * 3500 / 7 / 50) * 50 : 0;
      look.push({ h: 'Losing fast: ▼' + pctSay(loss) + ' this week',
        d: (more >= 50 ? 'About ' + fmtBig(more) + ' kcal a day more if it holds' : 'Past 1% a week, some is muscle') });
    }
    if (loss !== null && loss <= -0.005 && (plan === null || plan > -0.005)) {
      look.push({ h: 'Gaining fast: ▲' + pctSay(loss) + ' this week', d: 'Past a lean gain; likely fat if it holds' });
    }
    if (falling) {
      var who = slip.length ? slip.slice(0, 2).join(', ') : 'Lifts';
      look.push(cut ? { h: who + ' slipping on a cut', d: 'Slow the cut toward 0.5% a week' }
        : { h: who + ' slipping', d: 'Check sleep, stress and sets' });
    }
    if (nw && nw.pDays >= 4 && nw.pDays - nw.hit >= 2) {
      look.push({ h: 'Protein short ' + (nw.pDays - nw.hit) + ' of ' + nw.pDays + ' days', d: cut ? 'It keeps the muscle on a cut' : 'Aim for 90% or more' });
    }
    /* The seven days are the seven BEFORE today, shared with Nourish's half,
       and the Review counts a rolling week that includes today — so a
       session done this morning after a quiet week had the Review counting
       it beside a check-in saying there were none. Today is not in the
       window, but it is not nothing either. */
    if (!c.n && !c.today) look.push({ h: 'No workouts this week', d: '' });
    if (nw && nw.days > 0 && nw.days < 4) look.push({ h: 'Only ' + nw.days + ' of 7 days logged', d: 'Calories are a partial picture' });
    look.slice(0, 2).forEach(function (r) { out.push({ st: 'look', h: r.h, d: r.d }); });
    if (!out.length) {
      out.push(cut && p.n >= 2 && p.held === p.n ? { st: 'good', h: 'Strength held on a cut', d: 'The cut is costing fat, not muscle' }
        : p.up >= 2 && p.up > p.down ? { st: 'good', h: 'Strength up on ' + p.up + ' of ' + p.n + ' lifts', d: 'Keep going' }
        : { st: 'good', h: 'On track', d: 'Nothing to change' });
    }
    return out;
  }
  /* The week, at the top of the Review: numbers and pictures, few words.
     Nourish's This week lands here too. */
  function weekCard() {
    var c = checkin(), nw = c.nw, w = nw && nw.w, p = c.prog;
    var md = function (k) { var d = new Date(k + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    var row = function (k, t, v, x) {
      return '<div class="tr-wkr tr-wkr-' + k + '"><span class="tr-wkl">' + t + '</span><span class="tr-wkv">' + v + '</span>' +
        (x ? '<span class="tr-wkx">' + x + '</span>' : '') + '</div>';
    };
    var html = '<div class="tr-card tr-week" aria-label="This week">' +
      '<div class="tr-eyebrow">This week · ' + esc(md(c.from)) + '–' + esc(md(c.to)) + '</div>';
    // weight: the week's average, the change, and whether it is the pace planned
    if (w && w.now > 0) {
      var d = w.was > 0 ? w.now - w.was : null, pl = nw && fin(nw.plan) ? nw.plan : null;
      var ok = d === null || pl === null ? '' : Math.abs(-d / w.was - pl) <= 0.0025 ? ' tr-ok' : ' tr-off';
      html += row('w', 'Weight', '<b>' + fmtN(w.now) + '</b> lb',
        (d === null ? '' : '<span class="tr-wka' + ok + '">' + (d <= 0 ? '▼' : '▲') + fmtN(Math.abs(d)) + '</span>') +
        (pl !== null && Math.abs(pl) >= 0.001 ? '<span class="tr-wkm">plan ' + (pl > 0 ? '▼' : '▲') + pctSay(pl) + '/wk</span>' : ''));
    } else html += row('w', 'Weight', '<span class="tr-wkm">no weigh-ins</span>', '');
    // food: a bar of eaten against the day's target, and maintenance beside it
    if (nw && nw.days) {
      var tg = nw.target || 0, frac = tg ? Math.min(1, nw.kcal / tg) : 0, near = tg && Math.abs(nw.kcal / tg - 1) <= 0.1;
      html += row('f', 'Food', '<b>' + fmtBig(nw.kcal) + '</b> kcal',
        (tg ? '<span class="tr-wkbar' + (near ? ' tr-ok' : ' tr-off') + '" role="img" aria-label="' + fmtBig(nw.kcal) + ' of ' + fmtBig(tg) + ' target">' +
          '<i style="width:' + Math.round(frac * 100) + '%"></i></span><span class="tr-wkm">of ' + fmtBig(tg) + '</span>' : ''));
    } else html += row('f', 'Food', '<span class="tr-wkm">nothing logged</span>', '');
    // protein: a dot a day, filled where it reached 90% of target
    if (nw && nw.pDays) {
      var dots = (Array.isArray(nw.pd) ? nw.pd : []).map(function (h) { return '<i class="' + (h ? 'on' : '') + '"></i>'; }).join('');
      html += row('p', 'Protein', '<b>' + nw.hit + '</b> of ' + nw.pDays + ' days',
        (dots ? '<span class="tr-wkdots" role="img" aria-label="' + nw.hit + ' of ' + nw.pDays + ' days at target">' + dots + '</span>' : '') +
        '<span class="tr-wkm">' + nw.p + ' g avg</span>');
    }
    html += row('t', 'Training', '<b>' + c.n + '</b> session' + (c.n === 1 ? '' : 's'), '<span class="tr-wkm">' + c.sets + ' hard sets</span>');
    html += row('s', 'Lifts', p.n ? '<span class="tr-up">▲' + p.up + '</span> <span class="tr-lv">●' + p.flat + '</span> <span class="tr-dn">▼' + p.down + '</span>'
      : '<span class="tr-wkm">not enough yet</span>', p.n ? '<span class="tr-wkm">4 weeks</span>' : '');
    html += '<ul class="tr-chk-r">' + c.reads.map(function (r) {
      return '<li class="tr-chk-' + r.st + '"><b>' + esc(r.h) + '</b>' + (r.d ? '<span>' + esc(r.d) + '</span>' : '') + '</li>';
    }).join('') + '</ul></div>';
    return html;
  }

  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function mname(k) { return MUS[k] ? MUS[k].n : k; }
  var PLAIN = { quads: 'Front of thighs', hams: 'Back of thighs', side: 'Shoulders', rear: 'Back of shoulders',
    front: 'Front of shoulders', traps: 'Upper back' };
  function mnameP(k) { return T.pr.lvl === 0 && PLAIN[k] ? PLAIN[k] : mname(k); }
  function names(rows) {
    var n = rows.map(function (r) { return r.n; });
    return n.length < 3 ? n.join(' and ') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1];
  }
  function clock(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  // "7:05 AM"
  function hm(ts) {
    var d = new Date(ts), h = d.getHours(), m = d.getMinutes();
    return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  // "7:05–8:02 AM", or "11:40 AM–12:35 PM" when it crosses noon
  function hmSpan(a, b) {
    var x = hm(a), y = hm(b);
    return x.slice(-2) === y.slice(-2) ? x.slice(0, -3) + '\u2013' + y : x + '\u2013' + y;
  }
  /* What a date-and-time box holds: the local clock, never UTC, the same
     rule dayKey keeps. */
  function dtVal(ts) {
    var d = new Date(ts), h = d.getHours(), m = d.getMinutes();
    return dayKey(d) + 'T' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function dtParse(v) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : null;
  }
  /* A start and an end that can be believed: in order, not in the future,
     and no longer than a day. Says what is wrong, or ''. */
  function timesBad(st, en) {
    if (!fin(st)) return 'That start time could not be read.';
    if (en !== null && !fin(en)) return 'That end time could not be read.';
    if (st > Date.now() + 60000) return 'The start is in the future.';
    if (en !== null && en > Date.now() + 60000) return 'The end is in the future.';
    if (en !== null && en <= st) return 'The end has to come after the start.';
    if (en !== null && en - st > DAY_MS) return 'That is longer than a day.';
    return '';
  }
  // a workout's running time: past an hour, the hours say so (2:22:31, not 142:31)
  function elapsed(s) {
    s = Math.max(0, Math.floor(s));
    if (s < 3600) return clock(s);
    var m = Math.floor(s / 60) % 60;
    return Math.floor(s / 3600) + ':' + (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  // "19 h", not "19 h 00": a block's whole time is often a round number of hours
  function dur(ms) {
    var m = Math.max(1, Math.round(ms / 60000));
    return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60 < 10 ? '0' : '') + (m % 60) : '');
  }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // an old year says so: history brought in from another app goes back years
  function yr(d) { return d.getFullYear() === new Date().getFullYear() ? '' : ' ' + d.getFullYear(); }
  /* One way of writing a date, month first as the grid and the lists have
     it: "Mon, Sep 28" where the weekday helps, "Sep 28" where it doesn't.
     The long form used to put the day first, so one screen said "28 Sep"
     and the next "Sep 28". */
  function when(ts) {
    var d = new Date(ts);
    return DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate() + yr(d);
  }
  function shortDate(ts) { var d = new Date(ts); return MON[d.getMonth()] + ' ' + d.getDate() + yr(d); }

  function active() {
    var ms = T.act && T.ms[T.act];
    return ms || null;
  }
  // working sets only: a ramp of warm-ups is not the work, and the lift charts leave them out too
  function volOf(wo) {
    var v = 0;
    wo.x.forEach(function (x) { if (!ASST[x.e]) x.s.forEach(function (s) { if (counts(s)) v += Math.max(0, conv(s.w, wo.u)) * s.r; }); });
    return v;
  }
  function setsOf(wo) { return wo.x.reduce(function (n, x) { return n + x.s.length; }, 0); }

  /* ------------------------------------------------------------------ state */
  var S = {
    sub: (function () {
      try {
        var v = localStorage.getItem(LS_SUB);
        return ['block', 'history', 'lifts', 'review'].indexOf(v) >= 0 ? v : 'block';
      } catch (e) { return 'block'; }
    })(),
    qz: null,             // the quiz, while it is being answered; see quiz()
    lib: false,           // the whole library, rather than the picks
    browse: false,        // the picks, looked at with a block already running
    opt: null,            // a program's own choices, being set; see optFor()
    draft: null,          // a block being put together, before it is started
    sheet: null,          // whichever sheet is up
    q: '', qm: '',        // the picker's search and muscle
    arm: '',              // a two-tap confirm, armed
    own: null,            // the make-your-own form in the picker
    ed: null,             // a saved workout being corrected; see edOpen()
    hv: (function () { try { return localStorage.getItem(LS_HV) === 'wo' ? 'wo' : 'blk'; } catch (e) { return 'blk'; } })(),
    hb: '', hbSel: null, hbRen: ''   // History: the block open, its box chosen, its name being edited
  };

  /* ------------------------------------------------------------ the logger */

  function liveFromPlan(ms, w, d) {
    var p = plan(ms, w, d);
    return {
      id: newId(), st: Date.now(), n: p.n, u: T.pr.u, ms: ms.id, w: w, d: d,
      dl: p.deload ? 1 : 0, rir: p.rir,
      /* Each keeps the block's own exercise for its slot, which is what a
         swap for the rest of the block has to find: today's may be a harder
         version the plan moved you up to, or one swapped in for today. */
      x: p.x.map(function (s) { var x = liveEx(s.e, s.sets, s); x.sl = s.up || s.e; return x; }),
      sr: {}, fb: {}, rs: null, keep: steady(ms) || ms.goal === 'str' ? 1 : 0,
      ph: ms.goal === 'str' && !p.deload ? PHASE_SAY[Math.min(w, 2)] + '; the rest about 2 reps short of failure.'
        : ms.pb && !p.deload ? 'Top set about two reps short of failure, back-offs lighter; then ' + rirSay(p.rir) + '.' : '',
      fx: Array.isArray(ms.fx) ? ms.fx.slice() : [],
      mc: p.mc ? Object.assign(clean(p.mc), { st: 0, en: 0, rm: 0, r: '', x: '', done: '', sec: '' }) : null
    };
  }

  /* Ready workouts: one session started in a tap, outside any block. The
     days are the blocks' own, filled from the same library by the same
     rules (your kit, your back and joints, the lifts you never want), with
     the weights worked out from what you last lifted. The 30-minute
     version keeps the big lifts at two sets each. Nothing here moves a
     block: a ready workout is saved like one logged by hand. */
  var READY = [
    { g: 'Full body', d: [['fba', 3, 0], ['fbb', 3, 1], ['fbc', 3, 2]] },
    { g: 'Upper / lower', d: [['upa', 4, 0], ['loa', 4, 1], ['upb', 4, 2], ['lob', 4, 3]] },
    { g: 'Push / pull / legs', d: [['push', 6, 0, 'Push'], ['pull', 6, 1, 'Pull'], ['legs', 6, 2, 'Legs']] },
    { g: 'Machines only', d: [['circ', 0, 0, 'Machine circuit']] }
  ];

  /* The machine circuit: one set at each station, in order, then round
     again — the peripheral-heart-action idea, upper and lower body taking
     turns so each muscle rests while the next works, and the heart rate
     never quite comes down. Circuits of short rest build muscle when each
     set is taken near failure (Alcaraz et al. 2011 saw strength and muscle
     match a traditional rest-between-sets plan, in less time), and they
     carry a little conditioning with them.
   *
     Eight stations, pushes and pulls even — a chest press and a shoulder
     press against a row and a pulldown, which a circuit of presses alone
     is not — the pushes apart, the legs between, and the glutes a squat
     machine never reaches last. Every one a machine: nothing on the
     spine, nothing to balance, and the pin moved in a second. Each
     station is the first of its list your back and never list allow, the
     one that asks least of a protected back first, as a block's main lift
     is chosen.
   *
     Forty seconds to reach the next machine and set it, two minutes after
     each round: short enough to keep it a circuit, long enough that the
     weights stay honest. Three rounds is about forty-five minutes; two, as
     the half hour, about thirty. */
  var CIRCUIT = [
    ['chest', ['mc-press', 'pec-deck']],
    ['quads', ['leg-press', 'belt-squat', 'hack']],
    ['back', ['mc-row', 'cb-row']],
    ['quads', ['leg-ext']],
    ['front', ['mc-ohp']],
    ['hams', ['seated-curl', 'lying-curl']],
    ['back', ['lat-pd']],
    ['glutes', ['abduct', 'mc-kick']]
  ];
  var CC_SR = 40, CC_RR = 120;
  function circuitDay(xp, ef) {
    var E = EFF[ef] || EFF[1], p = T.pr;
    if (KITS[KITS[p.kit] ? p.kit : 'gym'].eq.indexOf('mc') < 0) return null;
    var pf = { bk: p.bk, jt: p.jt, avoid: p.avoid, lvl: p.lvl }, s = [];
    CIRCUIT.forEach(function (st) {
      var at = {}, c = st[1].filter(function (id) { return LIB[id] && !barred(LIB[id], pf); }).map(function (id, i) { at[id] = i; return LIB[id]; });
      c.sort(function (a, b) { return backCost(a, pf) - backCost(b, pf) || at[a.id] - at[b.id]; });
      c = c.filter(function (ex) { return !s.some(function (sl) { return sl.e === ex.id; }); });
      if (c.length) s.push({ e: c[0].id, n: xp ? 2 : Math.max(2, 3 + E.d) });
    });
    return s.length ? { n: 'Machine circuit' + (xp ? XP : ''), rir: E.rir, s: s, cc: 1 } : null;
  }
  // a round is every station once: its set, then the walk to the next
  function circuitMin(day) {
    var r = day.s.length ? day.s[0].n : 0;
    return 5 + (r * day.s.length * (45 + CC_SR) + Math.max(0, r - 1) * CC_RR) / 60;
  }
  var XP = ' \u00b7 30 min';
  // how hard today: one set fewer or more than usual, and how far short of failure
  var EFF = [{ n: 'Easy', d: -1, rir: 3 }, { n: 'Normal', d: 0, rir: 2 }, { n: 'Hard', d: 1, rir: 1 }];
  function readyRow(id) {
    var r = null;
    READY.forEach(function (g) { g.d.forEach(function (d) { if (d[0] === id) r = d; }); });
    return r;
  }
  function readyName(row) { return row[3] || SPLITS[row[1]].days[row[2]][0]; }
  function readyDay(id, xp, ef) {
    if (id === 'circ') return circuitDay(xp, ef);
    var E = EFF[ef] || EFF[1];
    if (T.rt[id]) {
      var rt = T.rt[id];
      return { n: rt.n, rir: E.rir, s: rt.x.filter(function (x) { return !!lib(x.e); }).map(function (x) {
        return { e: x.e, n: Math.max(1, Math.min(10, x.n + E.d)) };
      }) };
    }
    var row = readyRow(id);
    if (!row) return null;
    var p = T.pr, eq = KITS[KITS[p.kit] ? p.kit : 'gym'].eq;
    var pf = { bk: p.bk, jt: p.jt, avoid: p.avoid, lvl: p.lvl };
    var used = {}, today = {}, s = [];
    SPLITS[row[1]].days[row[2]][1].forEach(function (tok) {
      var t = tok.replace(/\+$/, '').split('/');
      var ex = pickEx(t[0], t[1], t[2] || '', eq, used, 0, pf, today, ix().best);
      if (!ex) return;
      used[ex.id] = 1; today[ex.id] = 1;
      s.push({ e: ex.id, n: 3 + E.d });
    });
    if (xp) {
      // the big lifts first, two sets each, and as much of the rest as fits the half hour
      var big = s.filter(function (sl) { return lib(sl.e).k === 'c'; }), small = s.filter(function (sl) { return lib(sl.e).k !== 'c'; });
      s = big.concat(small).map(function (sl) { return { e: sl.e, n: 2 }; });
      while (s.length > 2 && estDay({ s: s }) > 30) s.pop();
    }
    return { n: readyName(row) + (xp ? XP : ''), rir: E.rir, s: s };
  }
  /* The day after the last ready one you did, in its own rotation: Full
     Body B after A, Lower A after Upper A. Nothing until there is one. */
  function readyNext() {
    var last = null;
    ix().list.forEach(function (w) {
      if (w.ms) return;
      var n = String(w.n || '').replace(XP, '');
      READY.forEach(function (g) {
        g.d.forEach(function (d, i) { if (readyName(d) === n && (!last || w.st >= last.st)) last = { st: w.st, g: g, i: i }; });
      });
    });
    return last ? last.g.d[(last.i + 1) % last.g.d.length] : null;
  }
  function startReady(id, xp, ef) {
    if (LIVE) return;
    var day = readyDay(id, xp, ef);
    if (!day || !day.s.length) return;
    setLive({ id: newId(), st: Date.now(), n: day.n, u: T.pr.u, ms: '', w: -1, d: -1, dl: 0, rir: day.rir,
      x: day.s.map(function (sl) { var x = liveEx(sl.e, sl.n); x.rir = day.rir; if (day.cc) x.cc = 1; return x; }),
      sr: {}, fb: {}, rs: null, cc: day.cc ? { sr: CC_SR, rr: CC_RR } : null });
    S.sub = 'block';
    closeSheet();
    draw();
    wake();
    scrollTop();
  }
  // a finished workout kept as a routine: its lifts in order, each with its working sets
  function saveRoutine(wid, name) {
    var wo = T.wo[wid];
    if (!wo) return null;
    var x = wo.x.map(function (e) {
      return { e: e.e, n: Math.max(1, Math.min(10, e.s.filter(counts).length || e.s.length)) };
    }).filter(function (e) { return !!lib(e.e); }).slice(0, 20);
    var n = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 60) || String(wo.n || 'Routine').slice(0, 60);
    if (!x.length) return null;
    var id = 'r' + newId();
    T.rt[id] = { n: n, x: x, at: Date.now() };
    stamp('rt', id);
    return id;
  }

  function readyHTML(sh) {
    var xp = !!S.rdx, open = S.rdo || '';
    var mins = function (day) { return day && day.s.length ? '~' + Math.round(estDay(day.cc ? day : { s: day.s }) / 5) * 5 + ' min' : ''; };
    var row = function (id, name, key) {
      var day = readyDay(id, xp, 1);
      if (!day || !day.s.length) return '';
      key = key || id;
      var on = open === key;
      var names = day.s.map(function (sl) { return lib(sl.e).n; });
      var out = '<div class="tr-rdr' + (on ? ' on' : '') + '">' +
        '<button class="tr-rdb" data-t="rdopen" data-v="' + esc(key) + '" aria-expanded="' + on + '">' +
          '<span class="tr-rdn">' + esc(name || day.n) + '</span><span class="tr-rdt">' + mins(day) + '</span>' +
          '<span class="tr-rdm">' + esc(names.slice(0, 3).join(' \u00b7 ') + (names.length > 3 ? ' +' + (names.length - 3) : '')) + '</span></button>';
      if (on) {
        out += '<ol class="tr-rdl">' + day.s.map(function (sl) {
          var ex = lib(sl.e);
          return '<li>' + esc(ex.n) + ' <span class="tr-rdl-s">' + (day.cc ? '' : sl.n + ' \u00d7 ') + ex.rr[0] + '\u2013' + ex.rr[1] + (day.cc ? ' reps' : '') + '</span></li>';
        }).join('') + '</ol>' +
          '<div class="tr-rdq">How hard today?</div><div class="tr-rde">' + EFF.map(function (E, i) {
            var d = readyDay(id, xp, i);
            return '<button class="' + (i === 1 ? 'btn-primary' : 'ghost') + ' tr-rdgo" data-t="rdgo" data-v="' + esc(id) + '" data-e="' + i + '">' +
              '<b>' + E.n + '</b><small>' + (T.rt[id] ? ['a set fewer', 'sets as saved', 'a set more'][i] : d.cc ? d.s[0].n + ' rounds' : xp ? '2 sets' : d.s[0].n + ' sets') + ' \u00b7 ' + E.rir + ' to spare \u00b7 ' + mins(d) + '</small></button>';
          }).join('') + '</div>' +
          (day.cc ? '<div class="tr-hint">One set at each machine, in this order, then round again: ' + clock(CC_SR) + ' to move to the next, ' + clock(CC_RR) +
            ' after each round. Five to ten easy minutes on a bike or the stair climber afterwards, if you like, is the cardio.</div>' : '') +
          (T.rt[id] ? '<div class="tr-acts"><button class="tr-lnk" data-t="rtdel" data-v="' + esc(id) + '">' +
            (S.arm === 'rt:' + id ? 'Tap again to delete this routine' : 'Delete routine') + '</button></div>' : '');
      }
      return out + '</div>';
    };
    var nx = readyNext();
    var mine = Object.keys(T.rt).map(function (k) { return { id: k, r: T.rt[k] }; })
      .sort(function (a, b) { return (b.r.at || 0) - (a.r.at || 0); });
    return '<div class="tr-sub">One session, ready to go. It doesn\u2019t start or move a block, and it\u2019s saved like any other workout.</div>' +
      (LIVE ? '<div class="tr-warn">A workout is already open. Finish it first.</div>' : '') +
      '<div class="tr-q">' + chips('rdxp', xp ? 1 : 0, [[0, 'Full session'], [1, '30 minutes']]) + '</div>' +
      (nx ? '<div class="tr-rdg">Next up</div>' + row(nx[0], '', 'nx:' + nx[0]) : '') +
      (mine.length ? '<div class="tr-rdg">Your routines</div>' + mine.map(function (m) { return row(m.id, m.r.n); }).join('') : '') +
      READY.map(function (g) {
        return '<div class="tr-rdg">' + esc(g.g) + '</div>' + g.d.map(function (d) { return row(d[0]); }).join('');
      }).join('') +
      '<div class="tr-hint">Exercises are picked for your equipment and your back and joints, as a block\u2019s are. Weights come from what you last lifted. To keep a workout of your own, open it after you finish and tap Save as routine.</div>';
  }
  function rtNewHTML(sh) {
    var wo = T.wo[sh.id];
    if (sh.done) {
      return '<div class="tr-sub">Saved. It\u2019s under Pick a ready workout, in Your routines.</div>' +
        '<div class="tr-acts"><button class="btn-primary" data-t="close">Done</button></div>';
    }
    if (!wo) return '';
    return '<div class="tr-sub">' + wo.x.length + ' lift' + (wo.x.length === 1 ? '' : 's') + ', in this order, each with the number of sets you did. The weights come from your latest numbers each time.</div>' +
      '<label class="tr-tml">Name<input class="txt" id="trRtN" maxlength="60" value="' + esc(wo.n || '') + '"></label>' +
      '<div class="tr-acts"><button class="btn-primary" data-t="rtdo" data-id="' + esc(wo.id) + '">Save routine</button></div>';
  }

  function liveEx(e, n, s) {
    var ex = lib(e);
    s = s || target(ex, null, 0, 0, false);
    var prev = s.prev || [];
    var sets = [];
    /* A main lift is written set by set; everything else is the same target
       for every set. */
    var per = Array.isArray(s.st) ? s.st : null;
    /* Last time's warm-ups beside this time's, working sets beside working
       sets, so a warm-up at the top of last session does not push every
       Previous down a row. */
    var prevW = prev.filter(function (v) { return v.wu; }), prevN = prev.filter(function (v) { return !v.wu; });
    var iw = 0, iN = 0;
    for (var i = 0; i < (per ? per.length : Math.max(1, n)); i++) {
      var q = per ? per[i] : s;
      var pv = per && q.wu ? prevW[iw++] || null : prevN[iN++] || prevN[prevN.length - 1] || null;
      var set = { w: '', r: '', t: 0,
        tw: fin(q.tw) ? q.tw : null, tr: fin(q.tr) ? q.tr : null,
        pw: pv ? pv.w : null, pr: pv ? pv.r : null };
      if (per && q.am) set.am = 1;
      if (per && q.wu) set.wu = 1;
      sets.push(set);
    }
    var out = { e: e, rr: ex.rr.slice(), rir: s.rir === undefined ? null : s.rir, rest: s.rest || restFor(ex), s: sets,
      p: s.p || 0 };
    // last time's sets, kept so Previous can be paired again when a set changes kind
    if (prev.length) out.pv = prev.map(function (v) { return { w: v.w, r: v.r, wu: v.wu ? 1 : 0 }; });
    if (per) { out.fix = 1; if (fin(s.tm)) out.tm = s.tm; if (s.main) out.main = s.main; }
    /* Moved by your logged effort: both sets of targets kept, working sets
       counted in order, so a warm-up put in front does not shift them. */
    if (s.ef) {
      var wk = sets.filter(function (z) { return !z.wu; });
      out.ef = { q: s.ef.q, a: s.ef.a, on: 1,
        a1: wk.map(function (z) { return [z.tw, z.tr]; }),
        a0: wk.map(function (z, k) { var v = s.ef.alt ? s.ef.alt[k] || s.ef.alt[s.ef.alt.length - 1] : [s.ef.w0, s.ef.r0]; return [v[0], v[1]]; }) };
    }
    return out;
  }

  /* The other half of a pair, if it is still in the workout. */
  function partner(i) {
    var x = LIVE.x[i];
    if (!x || !x.p) return -1;
    for (var j = 0; j < LIVE.x.length; j++) if (j !== i && LIVE.x[j].p === x.p) return j;
    return -1;
  }
  /* A1, A2, B1… in the order the pairs appear, so the labels read down the
     page. Unpaired exercises have none. */
  // a station's place in the round: what follows it, and how long to get there
  function ccSay(i) {
    var st = stations(), k = st.indexOf(i);
    if (k < 0) return '';
    return k === st.length - 1 ? ' \u00b7 then ' + clock(LIVE.cc.rr) + ' before the next round'
      : ' \u00b7 then ' + esc(lib(LIVE.x[st[k + 1]].e).n) + ', ' + clock(LIVE.cc.sr) + ' to get there';
  }
  function pairLabels() {
    var st = stations(), out = slotLabels(LIVE.x);
    st.forEach(function (i, k) { out[i] = 'C' + (k + 1); });
    return out;
  }

  /* The workout in the order it is moved in: a pair side by side goes as
     one, so moving it never splits the two halves. */
  function moveGroups() {
    var out = [];
    for (var j = 0; j < LIVE.x.length; j++) {
      var x = LIVE.x[j], y = LIVE.x[j + 1];
      if (x.p && y && y.p === x.p) { out.push([j, j + 1]); j++; } else out.push([j]);
    }
    return out;
  }
  /* The bench is taken, so the rows go first: one place up or down, past
     the next exercise or pair. */
  function shiftEx(i, dir) {
    var gs = moveGroups(), g = -1;
    gs.forEach(function (grp, k) { if (grp.indexOf(i) >= 0) g = k; });
    var h = g + dir;
    if (g < 0 || h < 0 || h >= gs.length) return false;
    var tmp = gs[g]; gs[g] = gs[h]; gs[h] = tmp;
    var old = LIVE.x;
    LIVE.x = [].concat.apply([], gs).map(function (j) { return old[j]; });
    return true;
  }

  /* ---------------------------------------------------------- reordering
   *
   * Hold the handle and every card folds to its name; drag it to where it
   * goes and let go. A pair moves as one, as the arrows did. A finger that
   * moves before the hold is up is scrolling the page, not moving a lift
   * (Blake: "when I scroll I accidentally grab that"); a mouse cannot scroll
   * by dragging, so for a mouse moving starts it too. The page scrolls when
   * the finger nears its top or bottom. */
  var DRAG = null;
  function dragCards() {
    var by = {};
    Array.prototype.forEach.call(document.querySelectorAll('#view-train .tr-ex[data-xi]'), function (el) {
      by[el.getAttribute('data-xi')] = el;
    });
    return DRAG.gs.map(function (grp) { return grp.map(function (j) { return by[j]; }).filter(Boolean); });
  }
  function dragStart(grip, ev) {
    var i = Number(grip.getAttribute('data-x'));
    if (!LIVE || !fin(i) || DRAG) return;
    var gs = moveGroups(), g = -1;
    gs.forEach(function (grp, k) { if (grp.indexOf(i) >= 0) g = k; });
    if (g < 0 || gs.length < 2) return;
    // lw and n: the workout the indices belong to, checked again at the drop
    DRAG = { id: ev.pointerId, g: g, gs: gs, y0: ev.clientY, y: ev.clientY, on: false, t: 0, k: g, raf: 0, lw: LIVE.id, n: LIVE.x.length, mouse: ev.pointerType === 'mouse' };
    try { grip.setPointerCapture(ev.pointerId); } catch (e) { /* an old browser: the document still hears the moves */ }
    DRAG.t = setTimeout(dragFold, 220);
  }
  function dragFold() {
    if (!DRAG || DRAG.on) return;
    var view = $('view-train'), els = dragCards();
    var mine = els[DRAG.g] && els[DRAG.g][0];
    if (!view || !mine) { DRAG = null; return; }
    var off = DRAG.y0 - mine.getBoundingClientRect().top;
    DRAG.on = true;
    view.classList.add('tr-reo');
    // the held card stays under the finger while the rest fold away
    window.scrollBy(0, mine.getBoundingClientRect().top - (DRAG.y - off));
    DRAG.rows = els.map(function (grp) {
      var a = grp[0].getBoundingClientRect(), z = grp[grp.length - 1].getBoundingClientRect();
      return { top: a.top + window.scrollY, h: z.bottom - a.top };
    });
    DRAG.gap = DRAG.rows.length > 1 ? Math.max(0, DRAG.rows[1].top - DRAG.rows[0].top - DRAG.rows[0].h) : 6;
    /* Where the page could not scroll far enough, the held card is not yet
       under the finger: it jumps there, and follows from there. */
    DRAG.base = (DRAG.y - off) - mine.getBoundingClientRect().top;
    DRAG.yf = DRAG.y; DRAG.sy = window.scrollY;
    els[DRAG.g].forEach(function (el) { el.classList.add('tr-held'); });
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { /* no buzz to be had */ }
    dragLay();
  }
  // where the held card is, where it would land, and everything else out of its way
  function dragLay() {
    if (!DRAG || !DRAG.on) return;
    var els = dragCards(), R = DRAG.rows, g = DRAG.g;
    var dy = DRAG.base + DRAG.y - DRAG.yf + (window.scrollY - DRAG.sy);
    var mid = R[g].top + dy + R[g].h / 2, k = 0;
    R.forEach(function (r, j) { if (j !== g && r.top + r.h / 2 < mid) k++; });
    DRAG.k = k;
    var step = R[g].h + DRAG.gap;
    els.forEach(function (grp, j) {
      var shift = j === g ? dy : j > g && j <= k ? -step : j < g && j >= k ? step : 0;
      grp.forEach(function (el) { el.style.transform = shift ? 'translateY(' + shift + 'px)' : ''; });
    });
  }
  function dragScroll() {
    if (!DRAG || !DRAG.on) { if (DRAG) DRAG.raf = 0; return; }
    var edge = 72, v = DRAG.y < edge ? -(edge - DRAG.y) / 4 : DRAG.y > window.innerHeight - edge ? (DRAG.y - window.innerHeight + edge) / 4 : 0;
    if (v) { window.scrollBy(0, v); dragLay(); DRAG.raf = requestAnimationFrame(dragScroll); } else DRAG.raf = 0;
  }
  function dragMove(ev) {
    if (!DRAG || ev.pointerId !== DRAG.id) return;
    DRAG.y = ev.clientY;
    if (!DRAG.on && Math.abs(DRAG.y - DRAG.y0) > 6) {
      clearTimeout(DRAG.t);
      if (!DRAG.mouse) { DRAG = null; return; }
      dragFold();
    }
    if (!DRAG || !DRAG.on) return;
    ev.preventDefault();
    dragLay();
    if (!DRAG.raf) DRAG.raf = requestAnimationFrame(dragScroll);
  }
  /* When a hold last let go. A finger lifted without moving is a tap to the
     browser, and the click it makes comes after this has redrawn the page
     and scrolled the lift into view, so it lands on whatever is under the
     thumb by then: a set's type sheet, the chevron, once Discard. Swallowed
     for the next half second (the capture-phase listener in wire). */
  var GHOST = 0;
  function dragEnd(ev, cancel) {
    if (!DRAG || (ev && ev.pointerId !== DRAG.id)) return;
    clearTimeout(DRAG.t);
    var d = DRAG, moved = null;
    DRAG = null;
    if (!d.on) return;
    GHOST = Date.now();
    var view = $('view-train');
    if (view) view.classList.remove('tr-reo');
    /* The indices were taken from the workout as it was when the finger went
       down. Another tab may have replaced it since; applied to that one they
       would drop an exercise, or save holes that break every draw after. */
    if (!cancel && d.k !== d.g && LIVE && LIVE.id === d.lw && LIVE.x.length === d.n) {
      var gs = d.gs.slice(), grp = gs.splice(d.g, 1)[0];
      gs.splice(d.k, 0, grp);
      var old = LIVE.x;
      LIVE.x = [].concat.apply([], gs).map(function (j) { return old[j]; });
      moved = [].concat.apply([], gs.slice(0, d.k)).length;
      saveLive();
    }
    draw();
    var el = document.querySelector('#view-train .tr-ex[data-xi="' + (moved === null ? d.gs[d.g][0] : moved) + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  }
  /* The arrow keys on a handle: a place at a time, the handle kept in hand,
     and where it went said out loud. The handle is drawn again under the
     focus, so a screen reader heard nothing of the move but the button's
     own label, the same at every place. */
  function gripKey(grip, key) {
    var i = Number(grip.getAttribute('data-x'));
    var it = LIVE && LIVE.x[i];
    if (!it || !shiftEx(i, key === 'ArrowUp' ? -1 : 1)) return;
    saveLive();
    draw();
    var at = LIVE.x.indexOf(it), gs = moveGroups(), g = 0;
    gs.forEach(function (grp, k) { if (grp.indexOf(at) >= 0) g = k; });
    srSay(lib(it.e).n + (gs[g].length > 1 ? ' and its pair' : '') + ' moved to ' + (g + 1) + ' of ' + gs.length);
    var g2 = document.querySelector('#view-train .tr-ex[data-xi="' + at + '"] .tr-grip');
    if (g2) g2.focus();
  }
  /* A line for a screen reader, in a region made once at start and never
     drawn: one that arrives with its words is one nobody was listening to
     yet (Nourish's toast learned the same). Emptied first, so the same
     words twice are two announcements. */
  var sayT = null;
  function srSay(words) {
    var el = $('trSay');
    if (!el) return;
    el.textContent = '';
    clearTimeout(sayT);
    sayT = setTimeout(function () { el.textContent = words; }, 60);
  }

  function startPlanned(ms, w, d) {
    if (LIVE) return;
    phaseKeep(ms, w);
    setLive(liveFromPlan(ms, w, d));
    S.sub = 'block';
    draw();
    wake();
    scrollTop();
  }
  function startEmpty() {
    if (LIVE) return;
    setLive({ id: newId(), st: Date.now(), n: 'Workout', u: T.pr.u, ms: '', w: -1, d: -1, dl: 0, rir: null,
      x: [], sr: {}, fb: {}, rs: null });
    S.sub = 'block';
    draw();
    wake();
    scrollTop();
  }
  function scrollTop() {
    var v = $('view-train');
    if (v && v.getBoundingClientRect().top < 0) window.scrollTo(0, v.offsetTop);
  }

  /* Muscles in this session that were trained in the last ten days: the ones
     worth asking "how did that heal" about. Only in a block, where the
     answer moves something. */
  function soreAsk() {
    if (!LIVE || !LIVE.ms) return [];
    var ms = T.ms[LIVE.ms];
    if (!ms) return [];
    /* Only asked where it is used: a steady block, and the muscles an
       emphasis block is only holding, move on workload and joints alone. */
    var want = uniq(LIVE.x.map(function (x) { return musOf(x.e); })).filter(function (m) { return !noPump(m); });
    var list = ix().list;
    return want.filter(function (m) {
      for (var i = list.length - 1; i >= 0; i--) {
        var w = list[i];
        if (LIVE.st - w.st > 10 * DAY_MS) break;
        if (w.x.some(function (x) { return musOf(x.e) === m && x.s.length; })) return true;
      }
      return false;
    });
  }

  /* A muscle is ready for its feedback once every set of it in this session
     has been ticked. Asked then, while the pump is still there to judge. */
  function fbReady(m) {
    if (!LIVE || !LIVE.ms) return false;
    var any = false;
    for (var i = 0; i < LIVE.x.length; i++) {
      var x = LIVE.x[i];
      if (musOf(x.e) !== m) continue;
      any = true;
      if (x.s.some(function (s) { return !s.t; })) return false;
    }
    return any;
  }
  function lastOfMuscle(i) {
    var m = musOf(LIVE.x[i].e);
    for (var j = LIVE.x.length - 1; j >= 0; j--) if (musOf(LIVE.x[j].e) === m) return j === i;
    return false;
  }
  function firstOfMuscle(i) {
    var m = musOf(LIVE.x[i].e);
    for (var j = 0; j < LIVE.x.length; j++) if (musOf(LIVE.x[j].e) === m) return j === i;
    return false;
  }

  /* Same as last time. The questions were a wall: every muscle's healing
     before the first set, then pump, workload and joints for each muscle as
     it finished, some twenty-five taps on top of the sets. Most sessions
     the answers are last session's answers, so they start there, said in a
     line with a way to change them, and are asked outright only when there
     is reason to think they have changed:
       - nothing said before, for that muscle;
       - last time was a warning (still sore, too much, joints that hurt a
         lot), which is never assumed to have carried over, good or bad;
       - today's reps have clearly moved: two or more a set, on average,
         off what the weight was expected to give. Then last time is no
         guide to how it healed or how hard it was. */
  function lastSaid(m) {
    var list = ix().list, sr = null, fb = null;
    for (var i = list.length - 1; i >= 0 && (sr === null || fb === null); i--) {
      var w = list[i];
      if (LIVE && w.st >= LIVE.st) continue;
      // a month back is not "last time": what you said then is no guide to now
      if (LIVE && LIVE.st - w.st > 28 * DAY_MS) break;
      if (sr === null && w.sr && fin(w.sr[m])) sr = w.sr[m];
      var f = w.fb && w.fb[m];
      if (fb === null && f && (fin(f.p) || fin(f.k) || fin(f.j))) fb = f;
    }
    return { sr: sr, fb: fb };
  }
  function repsMoved(m) {
    if (!LIVE) return false;
    var sum = 0, n = 0;
    LIVE.x.forEach(function (x) {
      if (musOf(x.e) !== m) return;
      x.s.forEach(function (s) {
        // an all-out set is meant to beat its target, and a drop set or a miss has none
        if (!s.t || s.wu || s.am || s.ty === 'd' || s.ty === 'm') return;
        var w = numIn(s.w), r = numIn(s.r), ref = null;
        if (w === null || r === null) return;
        if (fin(s.tw) && fin(s.tr) && Math.abs(w - s.tw) < 1e-9) ref = s.tr;
        else if (fin(s.pw) && fin(s.pr) && Math.abs(w - s.pw) < 1e-9) ref = s.pr;
        if (ref === null) return;
        sum += r - ref; n++;
      });
    });
    return n >= 2 && Math.abs(sum / n) >= 2;
  }
  // how the muscle healed, as last time said it, where that still stands
  function preSr(m) {
    if (repsMoved(m)) return null;
    var v = lastSaid(m).sr;
    return v === 0 || v === 1 ? v : null;
  }
  // the healing answer in force: yours today, else last time's
  function srNow(m) {
    if (fin(LIVE.sr[m])) return { v: LIVE.sr[m], pre: false };
    var v = preSr(m);
    return v === null ? null : { v: v, pre: true };
  }
  function healNeed(m) { return soreAsk().indexOf(m) >= 0 && !srNow(m); }
  function preFb(m) {
    var o = {};
    if (repsMoved(m)) return o;
    var l = lastSaid(m).fb || {};
    if (fin(l.p) && !noPump(m)) o.p = l.p;
    if (fin(l.k) && l.k !== 3) o.k = l.k;
    if (fin(l.j) && l.j !== 2) o.j = l.j;
    return o;
  }
  /* The feedback in force for a muscle, and which of it is last time's. */
  function fbAll(m) {
    var f = LIVE.fb[m] || {}, pre = preFb(m), o = {}, from = {};
    ['p', 'k', 'j'].forEach(function (k) {
      if (k === 'p' && noPump(m)) return;
      if (fin(f[k])) o[k] = f[k];
      else if (fin(pre[k])) { o[k] = pre[k]; from[k] = 1; }
    });
    return { v: o, pre: from };
  }

  /* What an empty box means, which is what it shows greyed and what a tick
     takes. The weight follows what you actually lifted earlier in this
     session before any plan — change the bar on set one and the rest follow
     — then the target, then last time. Reps follow the target first, since
     the plan knows what week it is. */
  function ghost(xi, si) {
    var x = LIVE.x[xi], s = x.s[si], ex = lib(x.e);
    var cw = null, cr = null, crw = null;
    for (var j = si - 1; j >= 0; j--) {
      var e = x.s[j];
      if (!!e.wu !== !!s.wu) continue;
      // a missed attempt is not what the next set follows
      if (e.ty === 'm' && s.ty !== 'm') continue;
      if (cw === null) cw = numIn(e.w);
      /* The reps carried forward keep the weight they were done at, which
         need not be the weight carried: reps typed on set 1 and a weight
         typed on set 2 are two different sets' news. */
      if (cr === null) {
        cr = numIn(e.r);
        if (cr !== null) { crw = numIn(e.w); if (crw === null) crw = ghost(xi, j).w; }
      }
      if (cw !== null && cr !== null) break;
    }
    /* A main lift's sets each have their own weight — a ramp, a top set and
       back-offs — so its plan beats carrying the last set's weight forward. */
    var w = (x.fix || s.wu) && fin(s.tw) ? s.tw : cw !== null ? cw : fin(s.tw) ? s.tw : fin(s.pw) ? s.pw : ex.q === 'bw' ? 0 : null;
    // at home, a weight from the plan or last time is one your plates can make; one typed today stands
    // a sled's plates are not loaded on the home bar, so not snapped to what it makes
    if (w !== null && w > 0 && onBar(ex) && !SLED[x.e] && homeNow() && !(cw !== null && w === cw && !(x.fix || s.wu))) {
      w = snapHome(w, fin(s.tw) && w === s.tw && fin(s.pw) && s.tw > s.pw);
    }
    /* Reps as weight does: once a set is done today, the next one expects
       what you just did, rather than a target you already fell short of or
       beat; a main lift's sets keep their own. A tick on an empty box then
       logs something you did. rw is the weight those reps were for. */
    var r = null, rw = null;
    if ((x.fix || s.wu) && fin(s.tr)) { r = s.tr; rw = s.tw; }
    else if (cr !== null) { r = cr; rw = crw; }
    else if (fin(s.tr)) { r = s.tr; rw = s.tw; }
    else if (fin(s.pr)) { r = s.pr; rw = s.pw; }
    /* ...and at a weight of your own, the reps that weight is worth. Blake
       (2026-09-28): "When doing a workout and I enter a weight, will the
       suggested reps update to the estimated reps for me to do?" They did
       not: 185 x 8 planned, 205 typed, and the box still said 8. */
    var at = numIn(s.w);
    if (at === null) at = w;
    var est = r !== null && fin(rw) && fin(at) && Math.abs(at - rw) > 1e-9 ? estReps(x, si, at) : null;
    if (est !== null) r = est;
    return { w: w, r: r, est: est !== null };
  }

  /* The reps a weight you chose is worth, at the effort the plan asks for.
   *
     An estimated max (Epley, as the Est. max column) from the best evidence
     there is: this lift's latest set done today, which knows how today is
     going, else the set's own plan, else last time's. Each is read at the
     reps to spare it was done or planned with: the ones you logged, 0 for an
     all-out set, else the plan's. Then the reps that leave the plan's reps to
     spare at the new weight, rounded down, since a rep short is a set that
     still counts and a rep over is a set to failure the plan did not ask for.
   *
     Only where the plan asks for reps to spare. A strength block's main lift
     is written as a weight, its reps are the prescription, and a deload asks
     for none. Not for warm-ups, drop sets or misses, which have no such
     target, nor for a lift your body is part of without your weight to
     count. Only within a band of the evidence (60% to 150% of its weight),
     where Epley is still a fair guess, so a half-typed 2 on the way to 205
     leaves the plan's reps alone. */
  function estReps(x, si, at) {
    var s = x.s[si], k = fin(x.rir) ? x.rir : null;
    if (k === null || !(at > 0) || s.wu || s.ty === 'd' || s.ty === 'm') return null;
    var bw = null;
    if (usesBw(x.e)) {
      bw = fin(LIVE.bw) && LIVE.bw > 0 ? LIVE.bw : bwOn(dayKey(new Date(LIVE.st)), LIVE.u || T.pr.u);
      if (!(bw > 0)) return null;
    } else if (onBody(x.e)) return null;
    // the load that set moved: you plus the belt, you less the machine's help
    var load = function (v) { return bw === null ? v : ASST[x.e] ? bw - v : bw + v; };
    var ref = null;
    for (var j = x.s.length - 1; j >= 0 && !ref; j--) {
      var e = x.s[j];
      if (j === si || !e.t || !counts(e) || e.ty === 'd') continue;
      var ew = numIn(e.w), er = numIn(e.r), eq = numIn(e.q);
      if (ew === null || !(er > 0)) continue;
      ref = { w: ew, r: er + (eq !== null ? eq : e.am ? 0 : k) };
    }
    if (!ref && fin(s.tw) && fin(s.tr) && s.tr > 0) ref = { w: s.tw, r: s.tr + (s.am ? 0 : k) };
    if (!ref && fin(s.pw) && fin(s.pr) && s.pr > 0) ref = { w: s.pw, r: s.pr + k };
    if (!ref || !(load(ref.w) > 0) || !(load(at) > 0)) return null;
    var ratio = load(at) / load(ref.w);
    if (ratio < 0.6 || ratio > 1.5) return null;
    var max = e1rm(load(ref.w), ref.r);
    var left = s.am ? 0 : k;
    var reps = Math.floor(30 * (max / load(at) - 1) - left + 1e-9);
    return Math.max(1, Math.min(30, reps));
  }

  function numIn(v) {
    var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.'));
    return fin(n) ? n : null;
  }

  /* Ticking a set with the boxes empty takes what they were showing — the
     target, or last time's — the way Strong does. Most sets are done as
     planned, and typing 185 and 8 forty times a week is the chore that makes
     people stop logging. */
  /* A weight far from last time's: 900 typed for 90, 18.5 for 185. Well
     past double or under half, and more than a plate's worth either way, so
     an honest jump on a light lift is not questioned. */
  function farOff(w, ref, u) {
    return w > 0 && ref > 0 && (w > ref * 2.5 || w < ref * 0.4) && Math.abs(w - ref) >= (u === 'kg' ? 10 : 20);
  }
  function tick(xi, si, sure) {
    var x = LIVE.x[xi], s = x && x.s[si];
    if (!s) return;
    if (s.t) { s.t = 0; saveLive(); draw(); return; }
    var w = numIn(s.w), r = numIn(s.r), g = ghost(xi, si), miss = s.ty === 'm';
    if (w === null && g.w === null && onBody(x.e)) w = 0;
    /* A slipped finger, ticked, was a record, confetti and next week's
       target all at once. Asked on the tick, the one moment it is cheap to
       fix: Cancel goes back to the box. */
    var ref = fin(s.pw) && s.pw > 0 ? s.pw : fin(g.w) && g.w > 0 ? g.w : null, u = LIVE.u || T.pr.u;
    if (!sure && w !== null && ref !== null && farOff(w, ref, u)) {
      var hq = hive(), fix = function () { var el = $('trw-' + xi + '-' + si); if (el) { el.focus(); if (el.select) el.select(); } };
      var q = { title: fmtP(w) + ' ' + u + '?', ok: 'Keep ' + fmtP(w) + ' ' + u,
        body: 'Last time was ' + fmtP(ref) + ' ' + u + ' \u2014 this is ' + (w > ref ? Math.round(w / ref) + ' times that' : 'far less') + '. Keep it, or cancel and fix it.' };
      if (hq && hq.ask) { hq.ask(q, function (yes) { if (yes) tick(xi, si, true); else fix(); }); return; }
      if (!window.confirm(q.title + ' ' + q.body)) { fix(); return; }
    }
    if (w === null) w = g.w;
    // a missed attempt is the reps you got, which is none unless you say
    if (r === null) r = miss ? 0 : g.r;
    if (w === null || r === null || r < 0 || (r <= 0 && !miss)) {
      S.flash = xi + ':' + si;
      S.need = { k: xi + ':' + si, w: w === null };
      draw();
      var el = $((w === null ? 'trw-' : 'trr-') + xi + '-' + si);
      if (el) el.focus();
      return;
    }
    s.w = w; s.r = r; s.t = Date.now();
    S.need = null;
    var more = LIVE.x.some(function (y) { return y.s.some(function (z) { return !z.t; }); });
    /* In a pair, the rest after a set is the short one: the other half goes
       next, and it is resting this muscle while it works. After a warm-up a
       minute is plenty; before a drop set there is none, which is the point
       of one. */
    var nextS = x.s[si + 1];
    if (more && nextS && nextS.ty === 'd' && !nextS.t) LIVE.rs = null;
    else if (more) startRest(restAfter(xi, si));
    saveLive();
    audioPrime();
    draw();
    /* In a circuit the next set is a machine further down the page, or the
       first one again: brought into view, so the walk to it starts with
       the phone already showing it. */
    var cn = x.cc ? ccNext() : null, cel = cn ? $('trw-' + cn.x + '-' + cn.s) : null, card = cel && cel.closest ? cel.closest('.tr-ex') : null;
    /* A glide, unless the phone has been asked for less motion — then the
       card is simply there, which is where a glide would have ended up. */
    var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (card && card.scrollIntoView) { try { card.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }); } catch (e) { card.scrollIntoView(); } }
  }

  /* Previous, paired again: last time's warm-ups beside this time's
     warm-ups, working sets beside working sets, after a set changes kind or
     one is added or taken away. */
  function remapPrev(x) {
    if (!Array.isArray(x.pv) || !x.pv.length) return;
    var pw = x.pv.filter(function (v) { return v.wu; }), pn = x.pv.filter(function (v) { return !v.wu; });
    var iw = 0, iN = 0;
    x.s.forEach(function (s) {
      var v = s.wu ? pw[iw++] || null : pn[iN++] || pn[pn.length - 1] || null;
      s.pw = v ? v.w : null;
      s.pr = v ? v.r : null;
    });
  }

  // the stations of a circuit, in the order they are done
  function stations() {
    var out = [];
    if (LIVE && LIVE.cc) LIVE.x.forEach(function (x, i) { if (x.cc) out.push(i); });
    return out;
  }
  /* The next set a circuit asks for: round by round, station by station,
     the first not yet ticked. */
  function ccNext() {
    var st = stations(), most = 0;
    st.forEach(function (i) { most = Math.max(most, LIVE.x[i].s.length); });
    for (var r = 0; r < most; r++) {
      for (var k = 0; k < st.length; k++) {
        var z = LIVE.x[st[k]].s[r];
        if (z && !z.t) return { x: st[k], s: r };
      }
    }
    return null;
  }
  function restAfter(xi, si) {
    var x = LIVE.x[xi], s = x.s[si];
    if (LIVE.cc && x.cc) { var st = stations(); return xi === st[st.length - 1] ? LIVE.cc.rr : LIVE.cc.sr; }
    if (partner(xi) >= 0) return T.pr.rp;
    return s && s.wu ? Math.min(60, x.rest) : x.rest;
  }

  /* ------------------------------------------------------------ rest timer
   *
   * Kept as an end time rather than a countdown, so a phone that locks in the
   * middle of it — which is every phone, every set — comes back to the right
   * number instead of the number it had when the screen went dark. */
  function startRest(sec) {
    LIVE.rs = { end: Date.now() + sec * 1000, dur: sec, rung: 0 };
  }
  function restLeft() {
    if (!LIVE || !LIVE.rs) return null;
    return Math.ceil((LIVE.rs.end - Date.now()) / 1000);
  }
  /* Full screen while a workout runs, the way Strong and Hevy do it: the
     app's header, Strengthen's title and its tabs step aside, and the sets
     get the phone. A slim bar across the top keeps the name, the clock and
     Finish; the chevron makes the workout small again, for the rest of the
     app, and going back to the workout makes it big. */
  function focusOn() { return !!LIVE && S.sub === 'block' && !S.minim; }
  var CHEV_DN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV_UP = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function drawTop() {
    var top = $('trTop');
    if (!top) return;
    if (!focusOn()) {
      if (!top.classList.contains('hide')) { top.classList.add('hide'); top.innerHTML = ''; top.removeAttribute('data-shape'); }
      return;
    }
    var ela = elapsed((Date.now() - LIVE.st) / 1000);
    var shape = LIVE.st + '|' + LIVE.n;
    top.classList.remove('hide');
    // as below: built once, and after that only the clock moves under the thumb
    if (top.getAttribute('data-shape') === shape) {
      var el = top.querySelector('#trElapsed');
      if (el && el.textContent !== ela) el.textContent = ela;
      return;
    }
    top.innerHTML = '<div class="tr-top-in">' +
      '<button class="tr-top-min" data-t="minim" aria-label="Make the workout small, to use the rest of the app">' + CHEV_DN + '</button>' +
      '<button class="tr-top-t" data-t="times" aria-label="' + esc(LIVE.n) + ', started ' + hm(LIVE.st) + '. Change the start time">' +
        '<span class="tr-top-n">' + esc(LIVE.n) + '</span>' +
        '<span class="tr-top-c" id="trElapsed" role="timer" aria-live="off">' + ela + '</span></button>' +
      '<button class="btn-primary tr-top-f" data-t="finish">Finish</button>' +
    '</div>';
    top.setAttribute('data-shape', shape);
  }
  /* The foot of the screen, all through a workout: when you started and how
     long it has been, which opens to change the start, and Finish, always
     one reach away. While you rest, the rest sits on top of it, filling
     left to right as it runs out. Full screen, the top bar has the clock
     and Finish, so the foot is the rest alone, and only while you rest. */
  function drawRest() {
    var bar = $('trRest');
    if (!bar) return;
    drawTop();
    if (!LIVE) {
      if (!bar.classList.contains('hide')) { bar.classList.add('hide'); bar.innerHTML = ''; bar.removeAttribute('data-shape'); }
      return;
    }
    var focus = focusOn();
    var left = restLeft();
    var overdue = left !== null && left < 0 && LIVE.rs && !LIVE.rs.rung;
    var resting = left !== null && (left >= -8 || overdue);
    var done = resting && left <= 0;
    var pct = resting ? (done ? 100 : Math.max(0, Math.min(100, 100 * (1 - left / LIVE.rs.dur)))) : 0;
    var say = done ? 'Rest\u2019s up' : resting ? 'Rest ' + clock(left) : '';
    var ela = elapsed((Date.now() - LIVE.st) / 1000);
    var show = !focus || resting;
    bar.classList.toggle('hide', !show);
    bar.classList.toggle('tr-resting', resting);
    /* Built once for each state, and after that only the numbers move. It
       used to be rebuilt every second, since the clock is in it, and a thumb
       coming down on +15, Skip or Finish just as the second turned landed on
       a button that was no longer there: the tap did nothing. */
    var shape = (focus ? 'f' : '') + (done ? 'd' : resting ? 'r' : 'n') + LIVE.st;
    if (bar.getAttribute('data-shape') === shape) {
      var f = bar.querySelector('.tr-rest-fill'), tx = bar.querySelector('.tr-rest-t'), el = focus ? null : bar.querySelector('#trElapsed');
      if (f) f.style.width = pct.toFixed(1) + '%';
      if (tx && tx.textContent !== say) tx.textContent = say;
      if (el && el.textContent !== ela) el.textContent = ela;
    } else {
      var html = '';
      if (resting) {
        html += '<div class="tr-rest-row' + (done ? ' tr-rest-done' : '') + '">' +
          '<div class="tr-rest-fill" style="width:' + pct.toFixed(1) + '%"></div>' +
          '<div class="tr-rest-in">' +
            '<span class="tr-rest-t" role="timer" aria-live="off">' + say + '</span>' +
            '<span class="tr-rest-b">' +
              (done ? '' : '<button class="tr-rest-btn" data-t="rest" data-v="-15" aria-label="Fifteen seconds less">\u221215</button>' +
                '<button class="tr-rest-btn" data-t="rest" data-v="15" aria-label="Fifteen seconds more">+15</button>') +
              '<button class="tr-rest-btn" data-t="rest" data-v="skip">' + (done ? 'Close' : 'Skip') + '</button>' +
            '</span>' +
          '</div></div>';
      }
      if (!focus) {
        html += '<div class="tr-rest-in tr-wbar">' +
          '<button class="tr-wbar-t" data-t="times" aria-label="Started ' + hm(LIVE.st) + '. Change the start time">' +
            '<span class="tr-wbar-l">Started ' + hm(LIVE.st) + '</span>' +
            '<span class="tr-wbar-c" id="trElapsed">' + ela + '</span></button>' +
          '<span class="tr-wbar-r">' +
            '<button class="tr-wbar-x" data-t="focus" aria-label="Back to the workout, full screen">' + CHEV_UP + '<span>Full screen</span></button>' +
            '<button class="btn-primary tr-wbar-f" data-t="finish">Finish</button></span>' +
        '</div>';
      }
      bar.innerHTML = html;
      bar.setAttribute('data-shape', shape);
    }
    if (done && !LIVE.rs.rung) {
      LIVE.rs.rung = 1;
      saveLive();
      ringRest();
    }
  }

  /* The end of a rest calls again every six seconds until you touch the
     screen (or a key), for half a minute at most, so a call missed under
     music is not the only one. It stops too when the rest is closed, a new
     one starts, or the app goes off screen. */
  var RAGAIN = null, RAGAIN_EVERY = 6000, RAGAIN_MOST = 5;
  function ringRest() {
    ring();
    ringStop();
    var n = 0, rs = LIVE && LIVE.rs;
    RAGAIN = setInterval(function () {
      if (!LIVE || LIVE.rs !== rs || document.hidden || ++n > RAGAIN_MOST) { ringStop(); return; }
      ring();
    }, RAGAIN_EVERY);
  }
  function ringStop() { if (RAGAIN) { clearInterval(RAGAIN); RAGAIN = null; } }
  document.addEventListener('pointerdown', ringStop, true);
  document.addEventListener('keydown', ringStop, true);

  var AC = null;
  /* Browsers only let a page make sound after a tap, so the audio is woken on
     the tap that ticks a set and is ready by the time the rest runs out. */
  function audioPrime() {
    try {
      if (!AC) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (C) AC = new C();
      }
      if (AC && AC.state === 'suspended') AC.resume();
    } catch (e) { AC = null; }
  }
  /* The end of a rest has to be heard over music in your ears: three
     bursts of a high two-note call, about a second and a half, in a tone
     with an edge (a square wave, its harshest top taken off) rather than a
     soft sine that music swallows. Two notes a sixth apart read as an alarm,
     not as part of the song. */
  function ring() {
    try { if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300]); } catch (e) { /* not on this device */ }
    if (!AC || !T.pr.snd) return;
    try {
      var lp = AC.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 4000;
      lp.connect(AC.destination);
      [0, 0.5, 1.0].forEach(function (burst) {
        [[1047, 0], [1319, 0.17]].forEach(function (n) {
          var o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + burst + n[1];
          o.type = 'square';
          o.frequency.value = n[0];
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01);
          g.gain.setValueAtTime(0.5, t0 + 0.11);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
          o.connect(g); g.connect(lp);
          o.start(t0); o.stop(t0 + 0.16);
        });
      });
    } catch (e) { /* no sound: the bar and the buzz still say it */ }
  }

  /* The screen stays on while a workout is open. A phone that locks between
     every set is a phone you unlock forty times a session. */
  var WAKE = null;
  function wake() {
    if (!LIVE || WAKE || !navigator.wakeLock || document.hidden) return;
    navigator.wakeLock.request('screen').then(function (l) {
      WAKE = l;
      l.addEventListener('release', function () { WAKE = null; });
    }, function () { /* refused: the phone locks as it always did */ });
  }
  function stopWake() {
    if (WAKE) { try { WAKE.release(); } catch (e) { /* already gone */ } WAKE = null; }
  }

  var TICKER = null;
  function ticking() {
    if (LIVE && !TICKER) TICKER = setInterval(onTick, 1000);
    if (!LIVE && TICKER) { clearInterval(TICKER); TICKER = null; }
  }
  /* The day the screen was drawn for. Left open across midnight, the block's
     columns kept yesterday's labels until a tap: a new day is a redraw. */
  var DAYK = dayKey(new Date());
  function newDay() {
    var k = dayKey(new Date());
    if (k === DAYK) return false;
    DAYK = k;
    return true;
  }
  function onTick() {
    if (newDay()) { render(); return; }
    if (!LIVE) { ticking(); return; }
    drawRest();
    mcTick();
  }

  /* Finishing: what is kept, and what is dropped. A set never ticked was never
     done, as far as the log is concerned. */
  function finished() {
    var wo = {
      id: LIVE.id, st: LIVE.st, en: fin(LIVE.fe) ? LIVE.fe : Date.now(), dk: dayKey(new Date(LIVE.st)),
      n: LIVE.n, u: LIVE.u, ms: LIVE.ms || '', w: LIVE.w, d: LIVE.d, dl: LIVE.dl ? 1 : 0,
      x: LIVE.x.map(function (x) {
        var out = { e: x.e, s: x.s.filter(function (s) { return s.t; }).map(function (s) {
          var o = { w: numIn(s.w) || 0, r: numIn(s.r) || 0, t: s.t };
          // the as-many-as-you-can set keeps its target, which the next wave's max is worked from
          if (s.am) { o.am = 1; if (fin(s.tr)) o.tr = s.tr; }
          if (s.wu) o.wu = 1;
          if (s.ty === 'd' || s.ty === 'f' || s.ty === 'm') o.ty = s.ty;
          // reps in reserve, when you said
          var q = numIn(s.q);
          if (q !== null && q >= 0 && q <= 10) o.q = q;
          return o;
        }) };
        // and what the plan asked, so the review can hold the one against the other
        if (fin(x.rir)) out.pq = x.rir;
        return out;
      }).filter(function (x) { return x.s.length; }),
      sr: srKept(), fb: fbKept(), fbp: fbPre()
    };
    if (fin(LIVE.bk)) wo.bk = LIVE.bk;
    if (LIVE.g === 'home' && T.pr.gy.on) wo.g = 'home';
    var nt = String(LIVE.nt || '').trim().slice(0, 1000);
    if (nt) wo.nt = nt;
    var mc = mcDone(LIVE.mc);
    if (mc) wo.mc = mc;
    if (wo.x.some(function (x) { return usesBw(x.e); })) { var bw = fin(LIVE.bw) && LIVE.bw > 0 ? LIVE.bw : bwOn(wo.dk, wo.u); if (bw) wo.bw = bw; }
    return clean(wo);
  }

  /* What is kept of the questions: your answers, and where you let last
     time's stand, those. They move next week's sets the same either way. */
  function srKept() {
    var o = {};
    Object.keys(LIVE.sr || {}).forEach(function (m) { if (fin(LIVE.sr[m])) o[m] = LIVE.sr[m]; });
    if (LIVE.ms) soreAsk().forEach(function (m) { var n = srNow(m); if (n && !fin(o[m]) && trainedNow(m)) o[m] = n.v; });
    return o;
  }
  function trainedNow(m) {
    return LIVE.x.some(function (x) { return musOf(x.e) === m && x.s.some(function (s) { return s.t; }); });
  }
  /* The muscles whose answers were all last time's: nothing said today. Read
     back by feedback(), which lets them move the sets by the standard step
     and no more, so answers nobody gave never add sets faster than no
     answer would. */
  function fbPre() {
    var o = {}, n = 0;
    if (!LIVE.ms) return undefined;
    Object.keys(fbKept()).forEach(function (m) {
      var f = LIVE.fb[m] || {};
      if (!fin(f.p) && !fin(f.k) && !fin(f.j) && !fin(LIVE.sr[m])) { o[m] = 1; n++; }
    });
    return n ? o : undefined;
  }
  function fbKept() {
    var o = {};
    Object.keys(LIVE.fb || {}).forEach(function (m) { if (LIVE.fb[m]) o[m] = Object.assign({}, LIVE.fb[m]); });
    if (LIVE.ms) {
      uniq(LIVE.x.filter(function (x) { return x.s.some(function (s) { return s.t; }); }).map(function (x) { return musOf(x.e); })).forEach(function (m) {
        var v = fbAll(m).v;
        if (Object.keys(v).length) o[m] = Object.assign(o[m] || {}, v);
      });
    }
    return o;
  }

  function saveWorkout() {
    var wo = finished();
    if (!wo.x.length && !wo.mc) return false;
    T.wo[wo.id] = wo;
    stamp('wo', wo.id);
    /* With the phone's storage full the log was not written, and the live
       copy is the only one of this workout the phone still has: it stays,
       so reopening the app brings the workout back to save again rather
       than nothing. */
    if (LSBAD['bsc.train']) LIVE = null;
    else setLive(null);
    stopWake();
    /* And My Day hears about it. Its "trained today" tick moves where the
       day's carbohydrate lands, and it used to be a thing you had to
       remember to press after the gym. The workout is the press. */
    var h = hive();
    if (h && h.trained) { try { h.trained(wo.dk); } catch (e) { /* My Day is not up */ } }
    return wo;
  }

  /* ---------------------------------------------------------------- render */
  // a finger in one of Strengthen's boxes: a number half typed, a name, a note
  function typing() {
    var a = document.activeElement;
    return !!(a && a.closest && (a.closest('#view-train') || a.closest('#trainRoot')) &&
      (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA'));
  }
  /* A redraw from the account or the other tab. It used to draw at once,
     and a sync arriving mid-rename rebuilt the box from the saved name
     (the typed half gone), or took the focus out of a weight box between
     reps, which on a phone drops the keyboard. Held while typing, like
     render, and drawn once the finger is out (the focusout in wire). */
  function drawIfShowing() {
    var v = $('view-train');
    if (!v || v.classList.contains('hide')) { markTab(); return; }
    if (typing()) { S.drawDue = 1; markTab(); return; }
    draw();
  }

  /* app.js calls this whenever the whole page redraws, which includes every
     household change arriving from the other phone. A redraw while a number
     is half typed would be felt as the box fighting back, so an outside
     redraw waits until the finger is out of the box. */
  function render() {
    if (typing()) { S.drawDue = 1; markTab(); return; }
    draw();
  }

  function markTab() {
    var tab = document.querySelector('.tab[data-view="train"]');
    if (tab) tab.classList.toggle('tr-tab-live', !!LIVE);
  }

  function syncSay() {
    var h = hive();
    try { return h && h.syncState ? h.syncState() : ''; } catch (e) { return ''; }
  }
  function agoSay(t) {
    var m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : 'at ' + hm(t);
  }
  function draw() {
    if (DRAG && DRAG.on) return;
    var root = $('trBody');
    if (!root) return;
    var view = $('view-train');
    if (view) view.classList.toggle('tr-focus', focusOn());
    var head = $('trHead');
    if (head) {
      head.innerHTML = '<button class="ghost" data-t="settings">Settings</button>';
    }
    var html = segHTML();
    if (SY.err && doc) {
      html += '<div class="tr-note tr-warn tr-syncerr" role="status">Not saved to your account yet \u2014 it keeps trying. ' +
        'Everything is safe on this phone meanwhile.</div>';
    }
    if (LSFULL) {
      html += '<div class="tr-note tr-warn tr-lsfull" role="status">This phone\u2019s storage for the app is full, so the newest changes aren\u2019t kept on it' +
        (doc && !SY.err ? ' \u2014 they\u2019re in your account.' : '. Export a copy from Settings before closing the app.') + '</div>';
    }
    if (S.undoSk && Date.now() < S.undoSk.until && !LIVE) {
      // Nourish's own undo strip, held above the tabs: Skip is well down the page
      html += '<div class="m-toast no-print tr-undo" role="status"><span>Skipped ' + esc(S.undoSk.n) + '</span><button data-t="unskip">Undo</button></div>';
    }
    if (LIVE && S.sub !== 'block') {
      html += '<button class="tr-back" data-t="sub" data-v="block">Workout in progress · <span>' +
        esc(LIVE.n) + '</span> — back to it</button>';
    }
    if (S.sub === 'block') html += LIVE ? liveHTML() : blockHTML();
    else if (S.sub === 'history') html += historyHTML();
    else if (S.sub === 'lifts') html += liftsHTML();
    else html += reviewHTML();
    root.innerHTML = html;
    S.flash = '';
    drawRest();
    drawSheet();
    markTab();
    ticking();
    if (LIVE) wake();
  }

  function segHTML() {
    var tabs = [['block', LIVE ? 'Workout' : 'Block'], ['history', 'History'], ['lifts', 'Lifts'], ['review', 'Review']];
    return '<div class="seg tr-seg" role="group" aria-label="Strengthen">' + tabs.map(function (t) {
      return '<button data-t="sub" data-v="' + t[0] + '" aria-pressed="' + (S.sub === t[0]) + '">' + t[1] + '</button>';
    }).join('') + '</div>';
  }

  function chips(t, cur, opts, extra) {
    return '<div class="tr-chips" role="group">' + opts.map(function (o) {
      var on = Array.isArray(cur) ? cur.indexOf(o[0]) >= 0 : String(cur) === String(o[0]);
      return '<button class="tr-chip" data-t="' + t + '" data-v="' + esc(o[0]) + '"' + (extra || '') +
        ' aria-pressed="' + on + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  function targetStr(s, ex) {
    if (fin(s.tw) && fin(s.tr)) {
      return (s.tw > 0 ? fmtN(s.tw) + ' ' + T.pr.u + ' × ' : ex.q === 'bw' ? 'bodyweight × ' : '') + s.tr;
    }
    if (ex.q === 'bw') return 'bodyweight, add weight past ' + ex.rr[1];
    return 'pick a weight for ' + ex.rr[0] + '–' + ex.rr[1];
  }
  /* The week's effort as a sentence. "About 0 reps in reserve" is a
     roundabout way to say failure, so the last hard week says failure. */
  function rirSay(r) {
    if (T.pr.lvl === 0) return r === 0 ? 'go until you can\u2019t do another good rep'
      : 'stop each set when you could still do about ' + r + ' more good rep' + (r === 1 ? '' : 's');
    if (rpeOn()) return r === 0 ? 'take working sets to RPE 10, or 9 on the heavy barbell lifts'
      : 'finish working sets at about RPE ' + fmtN(10 - r) + ', ' + r + ' rep' + (r === 1 ? '' : 's') + ' to spare';
    if (r === 0) return 'take working sets to failure, or a rep short on the heavy barbell lifts';
    return 'finish working sets with about ' + r + ' rep' + (r === 1 ? '' : 's') + ' to spare';
  }
  function rpeOn() { return T.pr.eff === 'rpe'; }
  // a plan's reps in reserve, on your scale
  /* In words: "3 RIR" meant nothing to somebody new, and the logger itself
     already said "stop with 2 reps to spare". RPE stays for those who chose it. */
  function effSay(r) { return rpeOn() ? 'RPE ' + fmtN(10 - r) : r + ' rep' + (r === 1 ? '' : 's') + ' to spare'; }
  function rirStr(r) { return r === null || r === undefined ? 'deload' : effSay(r); }
  // a set's effort as logged, on your scale
  function rqSay(q) { return rpeOn() ? 'RPE ' + (q >= 5 ? '\u22645' : fmtN(10 - q)) : (q >= 5 ? '5+' : fmtN(q)) + ' to spare'; }

  /* ------------------------------------------------------ the block screen */
  /* Said once, where the eye lands after Save, and gone at the next tap. */
  function savedHTML() {
    var wo = S.justSaved && T.wo[S.justSaved];
    if (!wo) return '';
    var prs = prsIn(wo).length;
    return '<div class="tr-saved" role="status"><span>Saved \u00b7 ' + esc(wo.n) + ' \u00b7 ' + setsOf(wo) + ' sets' +
      (prs ? ' \u00b7 <span class="tr-pr">\ud83e\udd47 ' + prs + ' record' + (prs === 1 ? '' : 's') + '</span>' : '') + '</span>' +
      '<span class="tr-saved-a"><button class="tr-lnk" data-t="wocopy" data-id="' + esc(wo.id) + '">Copy</button>' +
      '<button class="tr-lnk" data-t="wosheet" data-id="' + esc(wo.id) + '">See it</button></span></div>';
  }

  /* Trained today already, and the next session works the same muscles
     again: they grow in the rest between, so it is the better for waiting
     a day. Said, not enforced. */
  function restNote(p) {
    var tk = dayKey(new Date()), hit = {}, n = 0;
    ix().list.forEach(function (wo) {
      if (dayKey(new Date(wo.st)) !== tk) return;
      wo.x.forEach(function (x) { if (x.s.some(counts)) hit[musOf(x.e)] = 1; });
    });
    p.x.forEach(function (x) { var m = musOf(x.e); if (hit[m] && MUS[m] && MUS[m].mev > 0) { hit[m] = 0; n++; } });
    return n >= 2 ? '<div class="tr-note">You\u2019ve trained these muscles today already. They grow while they rest, so this one is better tomorrow.</div>' : '';
  }

  function blockHTML() {
    var ms = active();
    if (S.draft) return draftHTML();
    if (S.qz) return savedHTML() + quizHTML();
    if (S.opt) return optHTML();
    if (!ms && !T.pr.qz) return savedHTML() + quizHTML();
    if (!ms || S.browse) {
      return savedHTML() + (ms ? '<button class="tr-back" data-t="unbrowse">Your block · <span>' + esc(ms.n) +
        '</span> — back to it</button>' : actStrip()) + (S.lib ? libHTML() : picksHTML());
    }
    var nx = nextSlot(ms);
    var acc = accOf(ms);
    /* The block first, open: every week of it as boxes, and how far through
       you are. Tap a box and that session is the card under it; none tapped,
       it is the next one, with Start. Blake: "I'd like to see my box calendar
       and my progress… not collapsed and it's probably the top thing. And
       then when I click on a box the exercises for that show below." It had
       been folded to a line under today's card, which put Start first but
       hid where the session sat in the block. */
    var sel = selOf(ms, nx);
    var html = savedHTML() + blockCard(ms, nx, sel) + seshHTML(ms, nx, sel);
    html += actStrip();
    /* One thing to do on this screen, and it is Start. The other ways in are
       a quiet list below it, and ending the block, which can't be taken
       back, stands apart in red. */
    html += '<div class="tr-more" role="group" aria-label="Other ways to train">' +
      '<div class="tr-ql">Other ways to train</div>' +
      moreRow('ready', 'Pick a ready workout', 'Full body, upper and lower, machines only') +
      moreRow('empty', 'Log a workout outside the block', 'Start empty and add what you do') +
      (nx && nx.w < acc && !steady(ms) ? moreRow('deloadnow', 'Deload now', 'A light week before the planned one') : '') +
      moreRow('browse', 'Other programs', 'Look at the rest without ending this one') +
    '</div>' +
    '<div class="tr-acts tr-foot tr-endblk"><button class="ghost danger" data-t="endblock">End this block</button></div>';
    return html;
  }
  function moreRow(t, n, sub) {
    return '<button class="tr-mrow" data-t="' + t + '"><span class="tr-mrow-t"><span class="tr-mrow-n">' + esc(n) + '</span>' +
      (sub ? '<span class="tr-mrow-s">' + esc(sub) + '</span>' : '') + '</span><span class="tr-mrow-c" aria-hidden="true">\u203a</span></button>';
  }

  /* How many days until the next session is due, going by the days you lift:
     0 is today. The same reckoning as the grid's day labels: the next
     session takes the first lifting day from today on, or from tomorrow once
     you have trained today. Null until the days are picked, when any day
     could be one. */
  function dueIn(ms, nx) {
    var cols = liftCols(ms), ld = ldDays().slice().sort();
    if (!nx || isEz(ms, nx.d) || !cols.length || ld.length !== cols.length) return null;
    var now = new Date(), ti = (now.getDay() + 6) % 7, today = dayKey(now);
    var o = trainedOn(today) ? 1 : 0;
    while (o < 21 && ld.indexOf((ti + o) % 7) < 0) o++;
    return o;
  }
  function trainedOn(dk) {
    return ix().list.some(function (wo) { return (wo.dk || dayKey(new Date(wo.st))) === dk; });
  }
  /* Counted in calendar days from today's weekday, as dueIn counts them.
     o × 24 hours from now is not o days on the calendar when the clocks
     change in between: at 23:30 on the Saturday New York springs forward,
     48 hours later is 00:30 on Tuesday, and a session due Monday was
     announced for Tuesday. */
  function dueSay(o) {
    if (o === 1) return 'tomorrow';
    var ti = (new Date().getDay() + 6) % 7;
    return (o >= 7 ? 'next ' : '') + LD_N[(ti + o) % 7];
  }

  /* The session to do next, as the card under the calendar: when it is,
     what it asks in a few numbers, the exercises by name, and a Start you
     can't miss. On a rest day it says so, and when the next one is, with a
     quiet way to start it anyway. The full plan, weights and reasons, is a
     tap away. */
  function todayHTML(ms, nx) {
    if (!nx) return doneHTML(ms);
    var wk = wkName(ms, nx.w);
    if (isEz(ms, nx.d)) {
      return '<div id="trSesh" class="tr-card tr-next tr-sesh tr-ez">' +
        '<div class="tr-eyebrow">Next · ' + wk + '</div>' +
        '<div class="tr-title">Easy day</div>' + ezHTML(ms, nx.w, nx.d) + '</div>';
    }
    var p = plan(ms, nx.w, nx.d);
    var due = dueIn(ms, nx);
    var rest = due !== null && due > 0;
    var did = rest && trainedOn(dayKey(new Date()));
    var planBtn = '<button class="tr-lnk" data-t="planopen" aria-expanded="' + !!S.planOpen + '">' + (S.planOpen ? 'Hide the plan' : 'See the plan') + '</button>';
    var skip = '<button class="tr-lnk tr-lnk-q" data-t="skip" data-w="' + nx.w + '" data-d="' + nx.d + '">Skip this one</button>';
    var start = '<button class="' + (rest ? 'ghost tr-anyway' : 'btn-primary tr-go') + '" data-t="start" data-w="' + nx.w + '" data-d="' + nx.d + '">' +
      (rest ? 'Start it anyway' : 'Start workout') + '</button>';
    var body = (S.planOpen ? planList(p, ms) : seshChips(seshNums(ms, nx.w, nx.d, p, false)) + seshNames(p) + mcLine(p));
    if (rest) {
      return '<div id="trSesh" class="tr-card tr-next tr-sesh tr-restday">' +
        '<div class="tr-eyebrow">Today · ' + wk + '</div>' +
        '<div class="tr-title">' + (did ? 'Done for today ✓' : 'Rest day') + '</div>' +
        '<div class="tr-sub">Next: <b>' + esc(p.n) + '</b> ' + esc(dueSay(due)) + '.' +
          (did ? '' : ' Muscles grow in the rest between sessions.') + '</div>' +
        body +
        '<div class="tr-acts">' + start + planBtn + '</div>' +
      '</div>';
    }
    return '<div id="trSesh" class="tr-card tr-next tr-sesh">' +
      '<div class="tr-eyebrow">' + (due === 0 ? 'Today' : 'Next' + (due ? ' · ' + esc(dueSay(due)) : '')) + ' · ' + wk + '</div>' +
      '<div class="tr-title">' + esc(p.n) + '</div>' +
      body +
      restNote(p) +
      start +
      '<div class="tr-acts tr-next-a">' + planBtn + skip + '</div>' +
    '</div>';
  }

  function wkName(ms, w) { return w >= accOf(ms) && !steady(ms) ? 'Deload week' : 'Week ' + (w + 1) + ' of ' + weeksOf(ms); }

  /* The box that is chosen: a tap's, while it is still a box of this block,
     or else the next session's. */
  function selOf(ms, nx) {
    var c = S.sel;
    if (c && c.ms === ms.id && c.w >= 0 && c.w < weeksOf(ms) && c.d >= 0 && c.d < ms.days.length) return c;
    return nx ? { ms: ms.id, w: nx.w, d: nx.d } : null;
  }

  /* The card under the calendar. The next session is today's card, with
     Start. A done one says what was lifted and what beat a record; one still
     to come says what it will ask; each a line per exercise, by name. */
  function seshHTML(ms, nx, c, noBack) {
    if (!c || (nx && c.w === nx.w && c.d === nx.d)) return todayHTML(ms, nx);
    var back = nx && !noBack ? '<button class="tr-lnk tr-lnk-q" data-t="gridsel" data-w="' + nx.w + '" data-d="' + nx.d + '">Back to the next one</button>' : '';
    var day = ms.days[c.d], wk = wkName(ms, c.w), cd = colDays(ms, nx)[c.d];
    if (isEz(ms, c.d)) {
      return '<div id="trSesh" class="tr-card tr-sesh tr-ez">' +
        '<div class="tr-eyebrow">' + (ezFor(ms, c.w, c.d) ? 'Done' : 'Easy day') + ' · ' + wk + '</div>' +
        '<div class="tr-title">Easy day</div>' + ezHTML(ms, c.w, c.d) +
        (back ? '<div class="tr-acts">' + back + '</div>' : '') + '</div>';
    }
    var wo = woFor(ms, c.w, c.d);
    if (wo) return seshDoneHTML(ms, c, wo, back);
    var p = plan(ms, c.w, c.d);
    var skipped = (Array.isArray(ms.sk) ? ms.sk : []).indexOf(c.w + ':' + c.d) >= 0;
    var planBtn = '<button class="tr-lnk" data-t="planopen" aria-expanded="' + !!S.planOpen + '">' + (S.planOpen ? 'Hide the plan' : 'See the plan') + '</button>';
    return '<div id="trSesh" class="tr-card tr-sesh' + (skipped ? ' tr-sesh-skip' : '') + '">' +
      '<div class="tr-eyebrow">' + (skipped ? 'Skipped' : 'Planned') + ' · ' + wk + (cd && !skipped ? ' · ' + LD_S[cd.wd] : '') + '</div>' +
      '<div class="tr-title">' + esc(p.n) + '</div>' +
      (S.planOpen ? planList(p, ms) : seshChips(seshNums(ms, c.w, c.d, p, true)) + seshNames(p) + mcLine(p)) +
      '<div class="tr-acts">' + (LIVE ? '' : '<button class="ghost" data-t="start" data-w="' + c.w + '" data-d="' + c.d + '">' +
        (skipped ? 'Do it after all' : 'Start it early') + '</button>') + planBtn + back + '</div>' +
    '</div>';
  }
  /* A session that was done: what was lifted, in a few numbers and a line
     per exercise, with the way into the workout itself. */
  function seshDoneHTML(ms, c, wo, back) {
    var day = ms.days[c.d], wk = wkName(ms, c.w);
    var best = {}, nb = 0;
    prsIn(wo).forEach(function (r) { if (!best[r.e]) nb++; best[r.e] = 1; });
    var v = volOf(wo), cnt = wo.x.reduce(function (n, x) { return n + x.s.filter(counts).length; }, 0);
    return '<div id="trSesh" class="tr-card tr-sesh tr-sesh-done">' +
      '<div class="tr-eyebrow">Done · ' + esc(when(wo.st)) + ' · ' + wk + '</div>' +
      '<div class="tr-title">' + esc(wo.n || dayName(day)) + '</div>' +
      seshChips([
        wo.en > wo.st ? '<b>' + dur(wo.en - wo.st) + '</b>' : '',
        '<b>' + cnt + '</b> set' + (cnt === 1 ? '' : 's'),
        v > 0 ? '<b>' + fmtBig(v) + '</b> ' + T.pr.u + ' moved' : '',
        nb ? { up: 1, h: '🥇 <b>' + nb + '</b> record' + (nb === 1 ? '' : 's') } : ''
      ]) +
      '<ol class="tr-snames">' + wo.x.filter(function (x) { return x.s.length; }).map(function (x) {
        var n = x.s.filter(counts).length;
        return '<li><span>' + esc(lib(x.e).n) + '</span>' + (best[x.e] ? '<i class="tr-pr">🥇 record</i>' : '<i>' + n + ' set' + (n === 1 ? '' : 's') + '</i>') + '</li>';
      }).join('') + '</ol>' +
      '<div class="tr-acts"><button class="ghost" data-t="wosheet" data-id="' + esc(wo.id) + '">See what you did</button>' +
        '<button class="ghost" data-t="woedit" data-id="' + esc(wo.id) + '">Edit</button>' + (back || '') + '</div>' +
    '</div>';
  }
  /* What a planned session asks, in a few numbers: how long, how many
     exercises and sets, and — past week one — how many sets it has gained
     on the first week's, which is the block climbing. */
  function seshNums(ms, w, d, p, eff) {
    var sets = p.x.map(function (x) { return x.sets; });
    var tot = sets.reduce(function (a, b) { return a + b; }, 0);
    var out = ['<b>~' + estDay(ms.days[d], sets) + '</b> min', '<b>' + p.x.length + '</b> exercise' + (p.x.length === 1 ? '' : 's'),
      '<b>' + tot + '</b> set' + (tot === 1 ? '' : 's')];
    if (w > 0 && !p.deload) {
      var was = plan(ms, 0, d).x.reduce(function (a, x) { return a + x.sets; }, 0);
      if (tot !== was) out.push({ up: tot > was, h: '<b>' + (tot > was ? '+' : '−') + Math.abs(tot - was) + '</b> sets on week 1' });
    }
    if (eff) out.push(p.deload ? 'deload' : effSay(p.rir));
    return out;
  }
  function seshChips(list) {
    return '<div class="tr-schips">' + list.filter(Boolean).map(function (c) {
      return '<span class="tr-schip' + (c.up ? ' up' : '') + '">' + (c.h || c) + '</span>';
    }).join('') + '</div>';
  }
  function seshNames(p) {
    return '<ol class="tr-snames">' + p.x.map(function (x) {
      return '<li><span>' + esc(lib(x.e).n) + '</span><i>' + (x.st ? 'main lift' : x.sets + ' set' + (x.sets === 1 ? '' : 's')) + '</i></li>';
    }).join('') + '</ol>';
  }

  // a day with a circuit after the lifts says so, since it changes what the session is
  function mcLine(p) {
    return p.mc ? '<div class="tr-mcp"><span class="tr-ql">Then the circuit</span><div>' + esc(mcSay(p.mc)) + '</div></div>' : '';
  }

  /* The block, open: which week, how far through, and the grid of every
     session with the days you lift. */
  function blockCard(ms, nx, sel) {
    var rir = nx ? rirFor(ms, nx.w) : null;
    var wk = nx ? 'Week ' + (nx.w + 1) + ' of ' + weeksOf(ms) : '';
    var sk = Array.isArray(ms.sk) ? ms.sk : [];
    var tot = weeksOf(ms) * ms.days.length, done = 0, gone = 0, thisWk = 0;
    for (var w = 0; w < weeksOf(ms); w++) {
      for (var d = 0; d < ms.days.length; d++) {
        if (slotDone(ms, w, d)) { done++; if (nx && w === nx.w) thisWk++; } else if (sk.indexOf(w + ':' + d) >= 0) gone++;
      }
    }
    // skipped sessions are behind you too, so a block finished with a skip is finished
    var pct = tot ? Math.round((done + gone) / tot * 100) : 0;
    var html = '<div class="tr-card tr-blk">' +
      '<div class="tr-blk-h"><div class="tr-eyebrow">Your block</div>' +
        '<button class="tr-lnk" data-t="hbopen" data-id="' + esc(ms.id) + '">Details &amp; notes</button></div>' +
      '<div class="tr-title">' + esc(ms.n) + '</div>';
    if (nx) {
      html += '<div class="tr-sub">' + wk + ' · ' +
        (rir === null ? 'deload week' : ms.goal === 'str' ? (ms.wave || 10) + 's wave, ' + PHASE[Math.min(nx.w, 2)] : rirSay(rir)) + '</div>';
    } else {
      html += '<div class="tr-sub">Every session of this block is done.</div>';
    }
    html += '<div class="tr-cprog"><span class="tr-cbar" role="progressbar" aria-label="Through the block" aria-valuemin="0" aria-valuemax="100" ' +
        'aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></span><span class="tr-cpct">' + pct + '%</span></div>' +
      '<div class="tr-cstat"><span><b>' + done + ' of ' + tot + '</b> sessions' + (gone ? ', ' + gone + ' skipped' : '') + '</span>' +
        (nx ? '<span><b>' + thisWk + ' of ' + ms.days.length + '</b> this week</span>' : '') + '</div>';
    return html + phaseLine(ms, nx) + weekGrid(ms, nx, sel) +
      (S.gridTapped ? '' : '<div class="tr-ghint">Tap a box to see that session</div>') +
      ldHTML(ms, nx) + '</div>';
  }

  /* No lifting, and not nothing: something you could talk through, long
     enough to count. What you do outside the gym is suggested first. An
     activity already logged today, not yet counted as anything, can be. */
  function ezHTML(ms, w, d) {
    var did = ezFor(ms, w, d);
    if (did) {
      return '<div class="tr-sub">Done: ' + esc(axName(did)) + ', ' + dur(did.min * 60000) + ', ' + when(did.st) + '.</div>';
    }
    var yours = T.pr.hab.filter(function (h) { return HABITS[h] && h !== 'other' && h !== 'walk'; }).map(function (h) { return HABITS[h].n.toLowerCase(); });
    var today = dayKey(new Date());
    var loose = Object.keys(T.ax).map(function (k) { return T.ax[k]; }).filter(function (a) {
      return a && !a.ms && dayKey(new Date(a.st)) === today;
    }).sort(function (a, b) { return b.st - a.st; })[0];
    return '<div class="tr-sub">No lifting. Twenty to forty-five minutes of something easy enough to talk through: ' +
        (yours.length ? esc(names(yours.slice(0, 2).map(function (n) { return { n: n }; }))) + ', or a walk' : 'a walk, an easy ride or swim, yoga') +
        '. It keeps you moving while what you trained recovers.</div>' +
      '<div class="tr-acts">' +
        (loose ? '<button class="btn-primary" data-t="ezlink" data-id="' + esc(loose.id) + '" data-w="' + w + '" data-d="' + d + '">Count today\u2019s ' + esc(axName(loose).toLowerCase()) + '</button>' : '') +
        '<button class="' + (loose ? 'ghost' : 'btn-primary') + '" data-t="eznew" data-w="' + w + '" data-d="' + d + '">Log what you did</button>' +
        '<button class="ghost" data-t="skip" data-w="' + w + '" data-d="' + d + '">Skip it</button>' +
      '</div>';
  }

  /* The weekdays you lift. Nourish plans the carbohydrate a day ahead from
     these; go on another day, or skip one, and the workout (or a tap there)
     says so. Until you pick, the days Nourish already had are shown. */
  var LD_W = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var LD_N = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function ldDays() {
    if (T.pr.ld.length) return T.pr.ld;
    var h = hive();
    try { return h && h.trainDays ? h.trainDays() || [] : []; } catch (e) { return []; }
  }
  function setLd(days, fromNourish) {
    T.pr.ld = defaultsPr({ ld: days }).ld;
    stamp('pr');
    var hl = hive();
    if (!fromNourish && hl && hl.daysMoved) { try { hl.daysMoved(); } catch (e) { /* My Day is not up */ } }
    if (fromNourish) drawIfShowing();
  }
  /* The block's days, said on the grid itself. Blake: "What is the diff
     between the block grid and the circle days? Feels redundant." It was:
     the circles said which weekdays, the grid which sessions, and nothing
     tied the two — four circles on a five-session block quietly disagreed.
     So the lifting sessions take your days in order (Upper the first, Legs
     the last), each column heading says its day, and the days are changed
     in one place that asks for exactly as many as the block has sessions. */
  function liftCols(ms) {
    var out = [];
    ms.days.forEach(function (d, i) { if (!d.ez) out.push(i); });
    return out;
  }
  /* The weekday each lifting session is planned for, and — this week, from
     the next one on — the day it will actually land now: a skip slides the
     rest along to the next lifting days, into next week if it has to. */
  function colDays(ms, nx) {
    var cols = liftCols(ms), ld = ldDays().slice().sort(), out = {};
    if (ld.length !== cols.length) return out;
    cols.forEach(function (d, i) { out[d] = { wd: ld[i], moved: false }; });
    if (!nx) return out;
    /* A session done this week says the day it was done. It kept its usual
       day: Upper A done on Saturday night, saved after midnight, still said
       Tue over its column while the next session slid onto Tuesday, and two
       columns read "Tue". */
    cols.forEach(function (d, i) {
      var dw = woFor(ms, nx.w, d);
      if (dw) { var wd0 = (new Date(dw.st).getDay() + 6) % 7; out[d] = { wd: wd0, moved: wd0 !== ld[i] }; }
    });
    if (isEz(ms, nx.d)) return out;
    var now = new Date(), ti = (now.getDay() + 6) % 7, today = dayKey(now);
    var did = ix().list.some(function (wo) { return (wo.dk || dayKey(new Date(wo.st))) === today; });
    var o = did ? 1 : 0;
    for (var c = cols.indexOf(nx.d); c >= 0 && c < cols.length; c++) {
      if (woFor(ms, nx.w, cols[c])) continue;     // done early: not still to come, and takes no day
      while (o < 21 && ld.indexOf((ti + o) % 7) < 0) o++;
      var wd = (ti + o) % 7;
      out[cols[c]] = { wd: wd, moved: wd !== ld[c] };
      o++;
    }
    return out;
  }
  function ldHTML(ms, nx) {
    /* A block of nothing but easy days has no sessions to give days to, and
       the picker below would ask for zero of them and name ms.days[undefined]. */
    if (!liftCols(ms).length) return '';
    var n = liftCols(ms).length, cd = colDays(ms, nx), picked = ldDays().length === n;
    var moved = Object.keys(cd).some(function (k) { return cd[k].moved; });
    var html = '<div class="tr-ldrow"><span class="tr-ldsay' + (picked ? '' : ' ask') + '">' +
      (!picked ? 'Pick ' + n + ' training days so Nourish can plan your carbs'
        : moved ? 'This week, moved to your next training days'
        : 'Nourish plans your carbs on these days') + '</span>' +
      (S.ldOpen ? '' : '<button class="tr-ldgo" data-t="ldopen">Change days</button>') + '</div>';
    if (!S.ldOpen) return html;
    var dr = S.ldDraft || [], sd = dr.slice().sort(), ok = sd.length === n;
    var cols = liftCols(ms);
    return html + '<div class="tr-ldpanel">' +
      '<div class="tr-ldq">Which ' + n + ' days do you train?</div>' +
      '<div class="tr-sub">One for each session, in order: ' + esc(dayName(ms.days[cols[0]])) + ' on the first, ' +
        esc(dayName(ms.days[cols[cols.length - 1]])) + ' on the last.</div>' +
      '<div class="tr-ld" role="group" aria-label="Training days">' + LD_W.map(function (w, i) {
        return '<button class="tr-ldb" data-t="ldpick" data-v="' + i + '" aria-pressed="' + (dr.indexOf(i) >= 0) +
          '" aria-label="' + LD_N[i] + '">' + w + '</button>';
      }).join('') + '</div>' +
      '<div class="tr-ldmap">' + cols.map(function (d, i) {
        return '<span>' + esc(dayName(ms.days[d])) + '</span><span>' + (sd[i] !== undefined ? LD_S[sd[i]] : '—') + '</span>';
      }).join('') + '</div>' +
      '<div class="tr-ldn ' + (ok ? 'ok' : '') + '">' + (ok ? n + ' of ' + n + ', one for each session'
        : sd.length + ' of ' + n + ' · ' + (sd.length < n ? 'pick ' + (n - sd.length) + ' more' : 'take ' + (sd.length - n) + ' off')) + '</div>' +
      '<div class="tr-acts"><button class="btn-primary" data-t="ldsave"' + (ok ? '' : ' disabled') + '>Save days</button>' +
        '<button class="ghost" data-t="ldcancel">Cancel</button></div>' +
    '</div>';
  }
  var LD_S = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function weekGrid(ms, nx, sel, act) {
    /* History draws a block's grid too, where a tap chooses in History and
       the weekday under each column (this week's, from your lifting days)
       means nothing for a block gone by. */
    var hist = !!act;
    act = act || 'gridsel';
    var sk = Array.isArray(ms.sk) ? ms.sk : [];
    var html = '<div class="tr-grid" role="table" aria-label="Sessions in this block" style="--n:' + ms.days.length + '">' +
      '<div class="tr-grow" role="row"><span class="tr-gh" role="columnheader"></span>' +
      (function () {
        var cd = hist ? {} : colDays(ms, nx);
        return ms.days.map(function (d, i) {
          var c = cd[i];
          // "day" is the one word a narrow column can spare
          return '<span class="tr-gh" role="columnheader">' + esc(d.ez ? 'Easy' : dayName(d).replace(/ day$/, '')) +
            (c ? '<i class="tr-ghd' + (c.moved ? ' moved' : '') + '">' + LD_S[c.wd] + '</i>' : '') + '</span>';
        }).join('');
      })() + '</div>';
    for (var w = 0; w < weeksOf(ms); w++) {
      html += '<div class="tr-grow" role="row"><span class="tr-gw" role="rowheader">' +
        (w >= accOf(ms) ? 'Deload' : 'Wk ' + (w + 1)) + '</span>';
      for (var d = 0; d < ms.days.length; d++) {
        var wo = slotDone(ms, w, d);
        var isNext = nx && nx.w === w && nx.d === d;
        var skipped = !wo && sk.indexOf(w + ':' + d) >= 0;
        var cls = (wo ? 'done' : isNext ? 'next' : skipped ? 'skip' : '') + (sel && sel.w === w && sel.d === d ? ' sel' : '');
        // five or more columns on a phone have room for the day of the month, not the month too
        var lab = wo ? (ms.days.length >= 5 ? String(new Date(wo.st).getDate()) : shortDate(wo.st)) : isNext ? 'Next' : skipped ? 'Skipped' : '';
        html += '<button class="tr-gc ' + cls + '" role="cell" data-t="' + act + '" data-w="' + w + '" data-d="' + d + '" ' +
          'aria-controls="trSesh"' + (sel && sel.w === w && sel.d === d ? ' aria-current="true"' : '') + ' ' +
          'aria-label="Week ' + (w + 1) + ', ' + esc(dayName(ms.days[d])) + (lab ? ': ' + lab : '') + '">' +
          (wo ? '✓ ' : '') + esc(lab) + '</button>';
      }
      html += '</div>';
    }
    return html + '</div>';
  }

  /* Why the sets are what they are, said once per muscle — it is the
     muscle's number that moved, and saying it under both of that muscle's
     exercises read as two decisions. Week one has nothing to explain. */
  /* A main lift's sets in a line: "5 × 10 at 175 lb (60%)", or a ramp to
     one all-out set. */
  function stSay(st) {
    var groups = [];
    st.forEach(function (q) {
      var key = q.tw + '|' + q.tr + '|' + (q.am ? 1 : 0) + (q.wu ? 1 : 0) + (q.top ? 1 : 0);
      var last = groups[groups.length - 1];
      if (last && last.key === key) last.n++; else groups.push({ key: key, q: q, n: 1 });
    });
    return groups.map(function (g) {
      var q = g.q;
      return (q.wu ? 'ramp ' : '') + (g.n > 1 ? g.n + ' \u00d7 ' : '') + (fin(q.tr) ? q.tr : '4\u20136') + (q.am ? '+' : '') +
        (fin(q.tw) ? ' at ' + fmtN(q.tw) + ' ' + T.pr.u : '') + (q.pct ? ' (' + Math.round(q.pct * 100) + '%)' : '') +
        (q.top ? ', a top set' : '');
    }).join(', then ');
  }

  function planList(p, ms) {
    var said = {};
    var labels = slotLabels(p.x);
    return '<ol class="tr-plan">' + p.x.map(function (s, i) {
      var ex = lib(s.e);
      if (s.st) {
        return '<li class="tr-main"><div class="tr-pl-top"><span class="tr-pl-n">' + esc(ex.n) + '</span>' +
            '<span class="tr-pl-s">main lift</span></div>' +
          '<div class="tr-pl-meta">' + esc(stSay(s.st)) + '</div>' +
          (s.wv ? '<div class="tr-why">' + (fin(s.tm) ? 'Training max ' + fmtN(s.tm) + ' ' + T.pr.u + '.'
            : 'No training max yet: pick weights by feel today, a few reps short of your limit. The weeks after work from what you lift.') + '</div>' : '') +
          (backCue(ex) ? '<div class="tr-cue">' + esc(backCue(ex)) + '</div>' : '') + '</li>';
      }
      var why = p.w > 0 && !said[ex.m] ? s.why : '';
      said[ex.m] = 1;
      var cue = backCue(ex);
      /* Quiet unless something changed: a muscle held where it was says
         nothing, and a change says itself in a few words, with the reason
         behind "why?". It used to be "Held \u2014 healed just in time,
         moderate pump\u2026" under every exercise, every week. */
      var head = why ? why.split(' \u2014 ')[0] : '';
      var short = s.up ? 'Moved up from ' + lib(s.up).n : /^[+\u2212]\d/.test(head) ? mname(ex.m) + ': ' + head : '';
      if (s.up) why = 'Every set reached the top of its range last time.' + (why ? ' ' + why : '');
      var wkey = p.w + ':' + p.d + ':' + i, wopen = S.whyOpen === wkey;
      var nt = noteOf(s.e);
      return '<li><div class="tr-pl-top"><span class="tr-pl-n">' +
          (labels[i] ? '<span class="tr-pair">' + labels[i] + '</span>' : '') + esc(ex.n) + '</span>' +
        '<span class="tr-pl-s">' + s.sets + ' × ' + ex.rr[0] + '–' + ex.rr[1] + '</span></div>' +
        '<div class="tr-pl-meta">' + esc(mname(ex.m)) + ' · ' + esc(targetStr(s, ex)) +
          ' · ' + rirStr(s.rir) + '</div>' +
        (cue ? '<div class="tr-cue">' + esc(cue) + '</div>' : '') +
        (nt ? '<div class="tr-pl-nt"><span class="tr-exnt-l">Note</span> ' + esc(nt) + '</div>' : '') +
        (short ? '<div class="tr-why">' + esc(short) + ' <button class="tr-lnk tr-whyb" data-t="whyopen" data-v="' + wkey + '" aria-expanded="' + wopen + '">why?</button>' +
          (wopen ? '<div class="tr-why-l">' + esc(why) + '</div>' : '') + '</div>' : '') + '</li>';
    }).join('') + '</ol>' +
      (ms && labels.some(Boolean) ? '<div class="tr-hint tr-pairwhy">' + esc(pairWhy(ms)) + '</div>' : '') +
      (p.mc ? '<div class="tr-mcp"><span class="tr-ql">Then the circuit</span><div>' + esc(mcSay(p.mc)) + '</div>' +
        (p.mc.last ? '<div class="tr-why">Last time: ' + esc(mcScore(p.mc.last)) + '. Beat it.</div>' : '') + '</div>' : '');
  }

  /* ------------------------------------------------- outside the gym
   *
   * Anything outside the gym — a round, a walk, a game — logged in a tap and
   * counted toward the week's active minutes.
   * The strip is always there: anything counts. */
  /* How hard a logged activity was: as marked, or as that kind usually is. */
  function axLv(a) { return LV[a.lv] ? a.lv : HABITS[a.k].lv; }
  /* A rest day, for Today: something easy to do, your own sports first, the
     week's active minutes against the guideline, and what was done today. */
  function restToday() {
    var mine = T.pr.hab.filter(function (h) { return HABITS[h] && h !== 'other' && h !== 'walk'; });
    var pick = ['walk'].concat(mine.slice(0, 2), ['yoga', 'cycle', 'golfw']).filter(function (h, i, a) { return a.indexOf(h) === i; }).slice(0, 4);
    var tk = dayKey(new Date());
    var did = Object.keys(T.ax).map(function (k) { return T.ax[k]; }).filter(function (a) { return a && HABITS[a.k] && dayKey(new Date(a.st)) === tk; })
      .sort(function (x, y) { return x.st - y.st; });
    return {
      sugg: pick.map(function (h) { return { k: h, n: HABITS[h].btn, min: HABITS[h].min, round: /^golf/.test(h) }; }),
      mins: Math.round(axWeek().mv), goal: 150,
      did: did.map(function (a) { return { id: a.id, n: axName(a), min: a.min }; })
    };
  }
  function axName(a) { return a.k === 'other' && a.nm ? a.nm : HABITS[a.k].n; }
  /* The week outside the gym. `mv` is what the WHO counts: a moderate minute
     once, a vigorous one twice, a light one not at all. */
  function axWeek(now) {
    now = now || Date.now();
    var mins = 0, mv = 0, light = 0, by = {};
    Object.keys(T.ax).forEach(function (k) {
      var a = T.ax[k];
      if (!a || a.st < now - 7 * DAY_MS || a.st > now) return;
      var lv = axLv(a);
      mins += a.min;
      if (lv === 'v') mv += a.min * 2; else if (lv === 'm') mv += a.min; else light += a.min;
      var nm = axName(a).toLowerCase();
      by[nm] = (by[nm] || 0) + a.min;
    });
    return { min: mins, mv: mv, light: light, by: by };
  }
  /* One tap for what you usually do, and one more for anything else. */
  function actStrip() {
    var wk = axWeek();
    var mine = T.pr.hab.filter(function (h) { return h !== 'other'; });
    return '<div class="tr-card tr-actv">' +
      '<div class="tr-actv-h"><span class="tr-ql">Outside the gym · last 7 days</span>' +
        '<span class="tr-actv-n">' + (wk.min ? dur(wk.min * 60000) : 'nothing yet') + '</span></div>' +
      '<div class="tr-chips">' + mine.map(function (h) {
        return '<button class="tr-chip" data-t="axnew" data-v="' + h + '">+ ' + esc(HABITS[h].btn) + '</button>';
      }).join('') + '<button class="tr-chip" data-t="axnew" data-v="">+ ' + (mine.length ? 'Something else' : 'Log an activity') +
      '</button></div></div>';
  }

  /* What comes next, in the block's own terms. A strength wave hands on
     new training maxes from its as-many-as-you-can sets; a block that
     climbs starts the next one back low; a steady one simply goes again. */
  function doneNext(ms) {
    if (ms.goal === 'str' || ms.pb) {
      var nt = nextTm(ms), rows = Object.keys(nt).map(function (e) {
        var was = tmOf(ms, e), am = null;
        ix().list.forEach(function (wo) {
          if (wo.ms !== ms.id) return;
          var x = exIn(wo, e);
          if (x) x.s.forEach(function (q) { if (q.am && fin(q.tr)) am = { w: conv(q.w, wo.u), r: q.r, tr: q.tr }; });
        });
        return '<li><span>' + esc(lib(e).n) + (am ? ' <span class="tr-e1">' + fmtN(am.w) + ' \u00d7 ' + am.r + ' (aimed ' + am.tr + '+)</span>' : '') + '</span>' +
          '<span class="' + (nt[e] > (was || 0) ? 'up' : nt[e] < (was || 0) ? 'down' : '') + '">' + (was ? fmtN(was) + ' \u2192 ' : '') + fmtN(nt[e]) + ' ' + T.pr.u + '</span></li>';
      });
      return rows.length ? '<div class="tr-ql tr-chart-h">Training max for the next ' + (ms.goal === 'str' ? 'wave' : 'block') + '</div><ul class="tr-ups">' + rows.join('') + '</ul>' +
        '<div class="tr-note">Each moves with how many reps your last all-out set beat its target by, or fell short. The next block starts from these.</div>' : '';
    }
    if (steady(ms)) return '<div class="tr-note">Done. The next one can be the same again, or a step up.</div>';
    return '<div class="tr-note">The next block starts back near the minimum and climbs again. RP\u2019s reasoning: volume you needed at the end of this one is more than you need at the start of the next, once the deload has let the fatigue go.</div>';
  }

  function doneHTML(ms) {
    var wos = ix().list.filter(function (w) { return w.ms === ms.id; });
    var prs = 0;
    wos.forEach(function (w) { prs += prsIn(w).length; });
    var lifts = {};
    wos.forEach(function (w) {
      if (w.dl) return;
      w.x.forEach(function (x) {
        var v = liftE1(x, w);
        if (!(v > 0)) return;
        var l = lifts[x.e] = lifts[x.e] || { a: v, b: v };
        l.b = v;
      });
    });
    var ups = Object.keys(lifts).map(function (e) { return { e: e, ch: lifts[e].b / lifts[e].a - 1 }; })
      .filter(function (l) { return l.ch !== 0; })
      .sort(function (a, b) { return b.ch - a.ch; }).slice(0, 6);
    return '<div class="tr-card">' +
      '<div class="tr-eyebrow">Block complete</div>' +
      '<div class="tr-title">' + wos.length + ' sessions · ' + prs + ' record' + (prs === 1 ? '' : 's') + '</div>' +
      (ups.length ? '<ul class="tr-ups">' + ups.map(function (l) {
        return '<li><span>' + esc(lib(l.e).n) + '</span><span class="' + (l.ch > 0 ? 'up' : 'down') + '">' +
          (l.ch > 0 ? '+' : '−') + Math.abs(Math.round(l.ch * 100)) + '% est. max</span></li>';
      }).join('') + '</ul>' : '') +
      doneNext(ms) +
      '<div class="tr-acts"><button class="btn-primary" data-t="again">Build the next block</button></div>' +
    '</div>';
  }

  /* --------------------------------------------------------------- the quiz
   *
   * A handful of questions, once, a screen at a time; then the programs that
   * fit the answers, each with its reasons; then the whole library for
   * anybody who would rather browse. Everything asked is read by a rule
   * somewhere below — nothing is asked for its own sake.
   *
   * It does not ask whether you are a man or a woman. In the research both
   * gain muscle at about the same relative rate (Roberts, Nuckols & Krieger
   * 2020), so no program here would come out any different. */
  var LVL = [[0, 'New, or under a year', 'Or back after a long break'], [1, '1–3 years', 'The main lifts feel familiar'],
    [2, '3+ years', 'Progress has slowed right down']];
  var LVL_SAY = ['new to lifting', '1–3 years lifting', '3+ years lifting'];
  var TRIG = [['f', 'Bending forward or sitting'], ['c', 'Weight on my spine'], ['x', 'Arching back']];
  var DAYS = { desk: ['Mostly sitting', 'A desk, a car, a screen'], feet: ['On my feet', 'Standing and walking most of the day'],
    labor: ['Physical work', 'Lifting, carrying, building'], active: ['Very active', 'Training or sport most days'] };
  var AGES = [['u40', 'Under 40'], ['40', '40–59'], ['60', '60 or over'], ['', 'Rather not say']];
  var KIT_S = { gym: 'Machines, cables, barbells and dumbbells', bar: 'A barbell and rack, and dumbbells',
    db: 'A pair or a set of dumbbells', bw: 'The floor — a pull-up bar helps' };
  var MINS = [[30, '30 min'], [40, '40 min'], [45, '45 min'], [60, '60 min'], [0, 'No limit']];
  var QSTEPS = ['goal', 'lvl', 'time', 'kit', 'pain', 'life', 'age'];
  // one tap answers these, and moves on
  var QONE = ['goal', 'lvl', 'kit', 'age'];

  /* The answers being given, started from the ones given last time. Nothing
     is pressed on a first run: an answer the app chose is not yours. */
  function quiz() {
    if (!S.qz) {
      var p = T.pr;
      S.qz = { i: 0, fresh: !p.qz, set: {}, back: !!p.bk, bku: p.bk === 'fcx',
        a: { goal: p.goal, lvl: p.lvl, dpw: p.dpw, min: p.min, kit: p.kit,
        bk: p.bk, jt: p.jt, day: p.day, hab: p.hab.slice(), age: p.age } };
      /* The app's front door asks three of these on a new phone (what you
         train with, days, minutes) and leaves them here; they are the
         person's answers, so they start pressed. Only on a first run. */
      if (S.qz.fresh) {
        try {
          var dw = JSON.parse(localStorage.getItem('sh.doorWork') || 'null') || {};
          if (KITS[dw.kit]) { S.qz.a.kit = dw.kit; S.qz.set.kit = true; }
          if (dw.dpw >= 2 && dw.dpw <= 7) { S.qz.a.dpw = dw.dpw; S.qz.set.dpw = true; }
          if (MINS.some(function (m) { return m[0] === dw.min; })) { S.qz.a.min = dw.min; S.qz.set.min = true; }
        } catch (e) { /* private mode or nothing left */ }
      }
    }
    return S.qz;
  }

  function q(label, body, hint) {
    return '<div class="tr-q"><div class="tr-ql">' + label + '</div>' + body +
      (hint ? '<div class="tr-hint">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function bigOpts(f, cur, list) {
    return '<div class="tr-bigs" role="group">' + list.map(function (o) {
      return '<button class="tr-big" data-t="qz" data-f="' + f + '" data-v="' + esc(o[0]) + '" aria-pressed="' +
        (cur !== null && String(cur) === String(o[0])) + '"><span class="tr-big-n">' + esc(o[1]) + '</span>' +
        (o[2] ? '<span class="tr-big-s">' + esc(o[2]) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function quizHTML() {
    var z = quiz(), a = z.a, step = QSTEPS[z.i];
    var shown = function (f) { return !z.fresh || z.set[f] ? a[f] : null; };
    var body = '';
    if (step === 'goal') {
      body = '<div class="tr-title">What are you training for?</div>' +
        bigOpts('goal', shown('goal'), Object.keys(GOALS).map(function (k) { return [k, GOALS[k].n, GOALS[k].s]; }));
    } else if (step === 'lvl') {
      body = '<div class="tr-title">How long have you been lifting?</div>' +
        '<div class="tr-note">Regularly, that is. A long break puts you back a step.</div>' +
        bigOpts('lvl', shown('lvl'), LVL);
    } else if (step === 'time') {
      body = '<div class="tr-title">How much time do you have?</div>' +
        q('Days a week', chips('qz', a.dpw, [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [7, '7']], ' data-f="dpw"'),
          a.dpw === 7 ? 'Six lifting days and an easy one: a walk, a ride, a swim. The muscles need a day off even when you do not.' : '') +
        q('Minutes a session', chips('qz', a.min, MINS, ' data-f="min"'), 'Warm-up included. A shorter session is made to fit.');
    } else if (step === 'kit') {
      body = '<div class="tr-title">What do you have to train with?</div>' +
        bigOpts('kit', shown('kit'), Object.keys(KITS).map(function (k) { return [k, KITS[k].n, KIT_S[k]]; }));
    } else if (step === 'pain') {
      /* The back is one choice among the rest. Only the back asks a second
         question, because backs differ in which movement upsets them —
         bending, weight on the spine, or arching — and the answer decides
         which lifts go. */
      var chip = function (t, v, lab, on, f) {
        return '<button class="tr-chip" data-t="' + t + '"' + (v ? ' data-v="' + v + '"' : '') + (f ? ' data-f="' + f + '"' : '') +
          ' aria-pressed="' + !!on + '">' + esc(lab) + '</button>';
      };
      body = '<div class="tr-title">Anything to look after?</div>' +
        '<div class="tr-note">Pick what gives you trouble, or nothing. Lifts that load it hard are left out, and lifts that load it a little come with a cue. This is not a diagnosis \u2014 anything a physio has ruled out goes on your never list later.</div>' +
        q('What gives you trouble', '<div class="tr-chips" role="group">' + chip('qzback', '', 'Back', z.back) +
          JOINTS.map(function (j) { return chip('qzm', j[0], j[1], a.jt.indexOf(j[0]) >= 0, 'jt'); }).join('') + '</div>') +
        (z.back ? q('Your back: what sets it off?', '<div class="tr-chips" role="group">' +
          TRIG.map(function (tr) { return chip('qzm', tr[0], tr[1], !z.bku && a.bk.indexOf(tr[0]) >= 0, 'bk'); }).join('') +
          chip('qzbku', '', 'Not sure', z.bku) + '</div>',
          'Not sure plays it safe: the heavy spine-loaders of all three kinds are left out and the lighter ones come with a cue. You can narrow it later by changing your answers.') : '');
    } else if (step === 'life') {
      body = '<div class="tr-title">What are your days like?</div>' +
        bigOpts('day', a.day || null, Object.keys(DAYS).map(function (k) { return [k, DAYS[k][0], DAYS[k][1]]; })) +
        q('Outside the gym <span class="tr-opt">any that apply</span>',
          chips('qzm', a.hab, HAB_ORDER.map(function (k) { return [k, HABITS[k].n]; }), ' data-f="hab"'),
          'Counted toward your weekly activity, and one tap to log.');
    } else {
      body = '<div class="tr-title">Last one: your age?</div>' +
        '<div class="tr-note">Optional. Past sixty, keeping strength takes a little more work, and the programs allow for it.</div>' +
        bigOpts('age', shown('age'), AGES) +
        '<p class="tr-fine">It does not ask whether you are a man or a woman: both gain muscle at about the same relative rate, so no program here would change.</p>';
    }
    var one = QONE.indexOf(step) >= 0;
    return '<div class="tr-card tr-quiz">' +
      '<div class="tr-qz-h"><span class="tr-eyebrow">' + (z.fresh ? 'Find your program' : 'Your answers') + ' · ' +
        (z.i + 1) + ' of ' + QSTEPS.length + '</span><span class="tr-qz-bar" aria-hidden="true"><span style="width:' +
        Math.round(100 * (z.i + 1) / QSTEPS.length) + '%"></span></span></div>' +
      body +
      '<div class="tr-acts">' +
        (!one ? '<button class="btn-primary" data-t="qzn">' + (z.i === QSTEPS.length - 1 ? 'See my programs' : 'Next') + '</button>' : '') +
        (z.i > 0 ? '<button class="ghost" data-t="qzb">Back</button>' : '') +
        (!z.fresh ? '<button class="tr-lnk" data-t="qzx">Cancel</button>' : '') +
      '</div>' +
      (z.i === 0 && z.fresh ? '<div class="tr-acts tr-qz-skip"><button class="tr-lnk" data-t="qznew">I\u2019m new \u2014 choose for me</button>' +
        '<button class="tr-lnk" data-t="qzskip">Skip the questions</button>' +
        '<button class="tr-lnk" data-t="ready">Pick a ready workout</button>' +
        '<button class="tr-lnk" data-t="empty">Just log a workout</button></div>' : '') +
    '</div>';
  }

  function quizDone() {
    var a = S.qz.a;
    if (S.qz.back && !a.bk) a.bk = 'fcx';
    T.pr = defaultsPr(Object.assign({}, T.pr, clean(a), { qz: Date.now() }));
    stamp('pr');
    try { localStorage.removeItem('sh.doorWork'); } catch (e) { /* private mode */ }
    S.qz = null; S.lib = false; S.opt = null;
    S.browse = !!active();
    draw();
    scrollTop();
  }

  /* You, in a line: what the picks were picked from. */
  function youLine(p) {
    var bits = [GOALS[p.goal].n, LVL_SAY[p.lvl], (p.dpw === 7 ? 'every day, one of them easy' : p.dpw + ' days') + (p.min ? ' × ' + p.min + ' min' : ''),
      KITS[p.kit].n.toLowerCase()];
    var care = (p.bk ? ['back'] : []).concat(p.jt.split('').filter(Boolean).map(function (j) { return JNAME[j].toLowerCase(); }));
    if (care.length) bits.push('looking after ' + names(care.map(function (n) { return { n: n }; })));
    if (p.day) bits.push(DAYS[p.day][0].toLowerCase());
    if (p.hab.length) bits.push(names(p.hab.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; })));
    if (p.age) bits.push(AGES.filter(function (x) { return x[0] === p.age; })[0][1].toLowerCase());
    return bits.join(' · ');
  }

  /* -------------------------------------------------------------- the picks
   *
   * Which programs suit you, as a score and the reasons for it. Rules, not
   * a model: each reason below is one rule, said back to you, and the ones
   * that count against a program are shown too. */
  var FIT = {
    muscle: { grow: 10, focus: 7, power: 6, start: 5, home: 5, lean: 3, cond: 3, keep: 2, waves: 2 },
    strength: { waves: 10, power: 8, grow: 6, start: 6, keep: 5, home: 4, focus: 3, lean: 3, cond: 3 },
    both: { power: 10, grow: 9, waves: 7, focus: 6, start: 5, home: 5, keep: 4, cond: 4, lean: 3 },
    keep: { keep: 10, cond: 6, start: 4, home: 4, grow: 3, lean: 3, waves: 3, power: 3, focus: 2 },
    lean: { lean: 10, cond: 8, keep: 5, start: 5, home: 5, grow: 4, waves: 3, power: 3, focus: 2 },
    health: { cond: 9, start: 8, keep: 8, home: 6, grow: 4, lean: 4, focus: 1, waves: 1, power: 1 }
  };
  var FIT_WHY = {
    'muscle:grow': 'Built for exactly what you asked for: more muscle.',
    'muscle:focus': 'More muscle, where you want it most.',
    'strength:grow': 'Builds the muscle that strength is built on.',
    'strength:waves': 'Built for exactly what you asked for: a bigger squat, bench, deadlift and press.',
    'strength:power': 'Heavy work for strength, then volume for the muscle behind it.',
    'both:power': 'Built for both: a heavy top set for strength, then the volume that builds muscle.',
    'both:waves': 'Strength first; the waves of tens and eights build some muscle too.',
    'muscle:power': 'Muscle-building volume, with the heavy lifts kept in.',
    'strength:start': 'The first year is when strength climbs fastest, on simple full-body training.',
    'strength:keep': 'Keeps the big lifts heavy in very little time.',
    'both:grow': 'Builds muscle, and strength comes up with it.',
    'both:focus': 'Muscle and strength, with one area brought up.',
    'keep:keep': 'Built for keeping what you have, in less time.',
    'lean:lean': 'Built for losing fat while keeping your muscle. Nourish’s targets do the losing; this does the keeping.',
    'lean:keep': 'A steady dose that keeps your strength while you eat less.',
    'health:start': 'Two or three full-body sessions a week covers the strength half of the health guidelines.',
    'health:keep': 'Short, steady sessions that cover the strength half of the health guidelines.',
    'health:home': 'Covers the strength half of the health guidelines without a gym.',
    'health:cond': 'Strength and hard breathing in one short session: both halves of the health guidelines.',
    'lean:cond': 'Short, hard circuits add to what you burn and keep you strong; the eating still does most of the losing.',
    'keep:cond': 'Keeps your strength, and adds the fitness side, in short sessions.'
  };
  function recommend(pr) {
    // the seventh day is the easy one: what a program is fitted to is six
    var lvl = pr.lvl, kit = pr.kit, dpw = Math.min(6, pr.dpw);
    var home = kit === 'bw' || kit === 'db';
    var legSport = pr.hab.filter(function (h) { return HABITS[h] && HABITS[h].legs === 2; });
    return PROG_ORDER.map(function (id, order) {
      var P = PROGS[id], sc = FIT[pr.goal][id] || 0, why = [];
      var add = function (n, t, bad) { sc += n; if (t) why.push({ t: t, bad: !!bad }); };
      if (FIT_WHY[pr.goal + ':' + id]) why.push({ t: FIT_WHY[pr.goal + ':' + id] });
      else if (sc >= 7) why.push({ t: 'Fits what you are training for.' });

      if (lvl === 0) {
        if (id === 'start') add(6, 'New to lifting: a little goes a long way, and learning the movements comes first.');
        else if (id === 'grow' || id === 'focus') add(-5, 'Better after a year or so of lifting \u2014 a beginner grows on much less.', true);
        else if (id === 'waves') add(-6, 'Percentages of a max work once you know your max and your form holds near it \u2014 after a year or so.', true);
        else if (id === 'power') add(-4, 'Better after a year or so: heavy top sets need well-practised form.', true);
        else if (id === 'keep') add(-3, 'There is not much to keep yet; building comes first.', true);
        else if (id === 'home' && home) add(1, 'Starts the bodyweight moves on their easier versions.');
      } else if (id === 'start') {
        add(lvl === 2 ? -6 : -3, 'Right after a long break; otherwise likely too easy for you.', true);
      } else if (lvl === 2 && (id === 'grow' || id === 'focus' || id === 'power')) {
        add(1, 'Years in, progress takes the climbing volume this is built on.');
      }

      if (P.kits && P.kits.indexOf(kit) < 0 && id !== 'home') {
        add(-10, 'Needs a barbell.', true);
      } else if (home) {
        if (id === 'home') add(5, kit === 'bw' ? 'Written for training with no weights at all.' : 'Written for dumbbells at home.');
        else if (P.mode === 'grow') {
          add(kit === 'bw' ? -4 : -2, 'Works at home, but written with a gym in mind' +
            (kit === 'bw' ? ' — with no weights, some of its exercises have no stand-in.' : '.'), true);
        }
      } else if (id === 'home') {
        add(-6, 'For training at home; you have more to work with.', true);
      }

      var d = fitDpw(P, dpw);
      if (d < dpw) add(0, 'Uses ' + d + ' of your ' + dpw + ' days' + (P.mode !== 'grow' ? ' — it needs no more.' : '.'));
      else if (d > dpw) add(-4, 'Needs at least ' + d + ' days a week.', true);

      if (pr.min && pr.min <= 40) {
        if (id === 'keep') add(2, 'Paired sets fit the whole body into ' + pr.min + ' minutes.');
        else if (id === 'start') add(1, 'A few sets of each fits in ' + pr.min + ' minutes.');
        else if (P.mode === 'grow' && dpw <= 3) add(-1, pr.min + '-minute sessions on ' + dpw + ' days leave the sets little room to climb.', true);
      }
      if (pr.age === '60' && (id === 'start' || id === 'keep')) add(1, 'Lifting heavy stays safe and useful past sixty \u2014 for your bones too.');
      if (id === 'cond') {
        var hard = pr.hab.filter(function (h) { return HABITS[h] && HABITS[h].lv === 'v'; });
        if (hard.length) {
          add(-2, 'You already get hard cardio from ' + names(hard.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; })) + '; this would pile more on.', true);
        } else if (pr.day === 'desk' || !pr.hab.length) {
          add(2, 'No hard cardio in your week yet: the circuits count as vigorous minutes toward the WHO\u2019s 150.');
        }
        if (/[KA]/.test(pr.jt)) add(-1, 'Jumping is left out for your ' + (pr.jt.indexOf('K') >= 0 ? 'knees' : 'feet') + ', which narrows the circuits.', true);
        if (lvl === 0) add(-2, 'Circuits reward knowing the movements; the basics first.', true);
      }
      if ((id === 'waves' || id === 'power') && /[fc]/.test(pr.bk)) {
        add(id === 'waves' ? -2 : -1, 'With your back, the squat and deadlift give way to lifts that spare it \u2014 fine, but this is built around them.', true);
      }
      if (pr.day === 'labor') {
        if (P.mode !== 'grow') add(1, 'Your job is training too; steady sessions leave room for it.');
        else add(0, 'Starts leg and back sets lower, because your job is training too.');
      } else if (legSport.length && P.mode === 'grow') {
        add(0, 'Starts leg sets lower for your ' + names(legSport.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; })) + '.');
      }
      return { id: id, sc: sc, why: why, o: order, fit: FIT[pr.goal][id] || 0 };
    // a tie goes to the program built for what you asked for
    }).sort(function (a, b) { return b.sc - a.sc || b.fit - a.fit || a.o - b.o; });
  }

  /* What every program here will do for you, said once above them all. */
  function forAll(p) {
    var out = [];
    var care = (p.bk ? ['your back the way you said'] : []);
    if (p.jt) care.push('your ' + names(p.jt.split('').map(function (j) { return { n: JNAME[j].toLowerCase() }; })) + ' hard');
    if (care.length) out.push('Whichever you pick leaves out lifts that load ' + care.join(', and ') + ', and cues the ones that load it a little.');
    if (p.hab.length) out.push('Your ' + names(p.hab.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; })) +
      ' count' + (p.hab.length > 1 ? '' : 's') + ' toward your weekly activity; log them from the strip above.');
    else if (p.day === 'desk') out.push('Sitting most of the day, the walks you log count toward the 150 active minutes a week the WHO recommends — the review keeps the tally.');
    return out;
  }

  // counting the deload week where a program has one: a strength wave is three weeks and a deload, four
  function weeksSay(P) {
    var w = P.acc.map(function (a) { return P.mode === 'grow' || P.mode === 'str' ? a + 1 : a; });
    return w[0] === w[w.length - 1] ? w[0] + ' weeks' : w[0] + '–' + w[w.length - 1] + ' weeks';
  }
  // what a program needs: a barbell for the waves and powerbuilding, the floor for home
  function kitSay(P) {
    if (!P.kits) return 'any kit';
    return P.kits.indexOf('gym') >= 0 || P.kits.indexOf('bar') >= 0 ? 'needs a barbell' : 'home kit';
  }
  function progCard(r, badge) {
    var P = PROGS[r.id];
    var days = P.dpw[0] + (P.dpw.length > 1 ? '–' + P.dpw[P.dpw.length - 1] : '') + ' days a week';
    return '<div class="tr-card tr-prog">' +
      '<div class="tr-prog-h"><div><div class="tr-title">' + esc(P.n) + '</div><div class="tr-sty">' + esc(P.sty) + '</div></div>' +
        (badge ? '<span class="tr-badge">' + esc(badge) + '</span>' : '') + '</div>' +
      '<div class="tr-note">' + esc(P.s) + '</div>' +
      '<div class="tr-sub"><b>For:</b> ' + esc(P.who) + '</div>' +
      (r.why.length ? '<ul class="tr-fits">' + r.why.slice(0, 5).map(function (w) {
        return '<li' + (w.bad ? ' class="no"' : '') + '>' + esc(w.t) + '</li>';
      }).join('') + '</ul>' : '') +
      '<div class="tr-prog-f"><span class="tr-fine">' + days + ' · ' + weeksSay(P) + ' · ' +
        kitSay(P) + '</span>' +
        '<button class="btn-primary" data-t="prog" data-v="' + r.id + '">Set it up</button></div>' +
    '</div>';
  }

  function picksHTML() {
    var p = T.pr, recs = recommend(p), notes = forAll(p);
    return '<div class="tr-card">' +
      '<div class="tr-eyebrow">Programs for you</div>' +
      '<div class="tr-title">Picked from your answers</div>' +
      '<div class="tr-sub">' + esc(youLine(p)) + '</div>' +
      notes.map(function (n) { return '<div class="tr-note">' + esc(n) + '</div>'; }).join('') +
      '<div class="tr-acts"><button class="tr-lnk" data-t="requiz">Change my answers</button></div>' +
    '</div>' +
    /* New to lifting, the choice is made: one program, and the rest a tap
       away for anyone who wants to look. */
    recs.slice(0, p.lvl === 0 && recs[0] && recs[0].id === 'start' ? 1 : 3).map(function (r, i) { return progCard(r, i === 0 ? 'Best match' : ''); }).join('') +
    '<div class="tr-acts tr-foot"><button class="ghost" data-t="lib">' + (p.lvl === 0 ? 'See other programs' : 'See all ' + PROG_ORDER.length + ' programs') + '</button>' +
      (active() ? '' : '<button class="ghost" data-t="ready">Pick a ready workout</button>' +
        '<button class="ghost" data-t="empty">Just log a workout</button>') + '</div>';
  }

  function libHTML() {
    var recs = recommend(T.pr);
    return '<div class="tr-card">' +
      '<div class="tr-eyebrow">All programs</div>' +
      '<div class="tr-title">Every program, and who each is for</div>' +
      '<div class="tr-note">In order of fit, from your answers. Each borrows the style of a well-known way of training; none of them is anybody\u2019s program.</div>' +
      '<div class="tr-acts"><button class="tr-lnk" data-t="unlib">← Back to your picks</button></div>' +
    '</div>' +
    recs.map(function (r, i) { return progCard(r, i === 0 ? 'Best match' : ''); }).join('');
  }

  /* ------------------------------------------------------------ setting up
   *
   * A program's own choices, started from your answers: days, minutes,
   * where, how long, and — for the two that have one — what to bring up. */
  function optFor(id) {
    var P = PROGS[id], p = T.pr;
    return { prog: id, dpw: fitDpw(P, p.dpw), min: p.min,
      kit: P.kits ? (P.kits.indexOf(p.kit) >= 0 ? p.kit : P.kits[0]) : p.kit,
      acc: P.dAcc, pri: [], fx: '', seed: 0, wave: 10, ez: p.dpw === 7 ? 1 : 0 };
  }
  function dayHint(o) {
    var P = PROGS[o.prog];
    if (o.prog === 'keep') return o.dpw >= 3 ? 'Three shorter full-body sessions.' : 'Two full-body sessions.';
    if (o.prog === 'start') return 'Full body every time.';
    if (o.prog === 'home') return HOME_SPLITS[o.dpw] && o.dpw >= 4 ? 'Upper / lower, twice.' : 'Full body every time.';
    if (o.prog === 'waves') return o.dpw >= 4 ? 'One main lift a day: squat, bench, deadlift, press.'
      : o.dpw === 3 ? 'Squat, bench and deadlift days; the press as accessory work.' : 'Two main lifts a day.';
    if (o.prog === 'power') return o.dpw >= 4 ? 'Upper / lower, each opening with a main lift.' : 'Full body, each day opening with a main lift.';
    if (o.prog === 'cond') return 'Three strength lifts, then a circuit, every day.';
    var sn = SPLITS[o.dpw] ? SPLITS[o.dpw].n : '';
    return o.prog === 'focus' && o.fx ? sn + ', with ' + FOCUS[o.fx].n.toLowerCase() + ' first.' : sn + (P ? '' : '');
  }
  function optHTML() {
    var o = S.opt, P = PROGS[o.prog], grow = P.mode === 'grow';
    var kits = P.kits || Object.keys(KITS);
    return '<div class="tr-card">' +
      '<div class="tr-eyebrow">Set it up</div>' +
      '<div class="tr-title">' + esc(P.n) + '</div><div class="tr-sty">' + esc(P.sty) + '</div>' +
      (o.prog === 'focus' ? q('Bring up', chips('o-fx', o.fx, Object.keys(FOCUS).map(function (k) { return [k, FOCUS[k].n]; })),
        o.fx ? names(FOCUS[o.fx].m.map(function (m) { return { n: mname(m) }; })) + ' first, and most.' : 'Pick one.') : '') +
      q('Days a week', chips('o-dpw', o.dpw, P.dpw.map(function (d) { return [d, String(d)]; })), dayHint(o)) +
      q('An easy day', chips('o-ez', o.ez || 0, [[0, 'No'], [1, 'Add one each week']]),
        o.ez ? 'Day ' + (o.dpw + 1) + ': a walk, a ride, a swim or yoga, easy enough to talk through. Logged in a tap, and a moderate one counts toward your active minutes.'
          : 'A day with no lifting that still gets you moving. For anyone who likes to do something every day.') +
      q('Time per session', chips('o-min', o.min, MINS), o.min ? 'Warm-up included. Exercises are paired and sets trimmed to fit.' : '') +
      q('Where', chips('o-kit', o.kit, kits.map(function (k) { return [k, KITS[k].n]; }))) +
      (P.mode === 'str' ? q('Wave', chips('o-wave', o.wave, [[10, 'Tens'], [8, 'Eights'], [5, 'Fives'], [3, 'Threes']]),
          'Four weeks, the last a deload. Start at tens unless you have just finished a wave; each finished wave hands its maxes to the next.')
        : q('Length', chips('o-acc', o.acc, P.acc.map(function (a) { return [a, (grow ? a + 1 : a) + ' weeks']; })),
        grow ? 'Including a lighter deload week at the end.' : 'No deload week at this dose; then build the next one.')) +
      (o.prog === 'grow' ? q('Bring up <span class="tr-opt">up to three, optional</span>',
        chips('o-pri', o.pri, MUSCLES.map(function (m) { return [m.k, m.n]; }))) : '') +
      '<div class="tr-acts"><button class="btn-primary" data-t="build"' + (o.prog === 'focus' && !o.fx ? ' disabled' : '') + '>Build my block</button>' +
        '<button class="ghost" data-t="unopt">Back</button></div>' +
    '</div>' + howHTML(o);
  }

  /* How it works, for the program you are about to build: the engine
     decides most of it, and your back, joints and week each add a
     paragraph. */
  function howHTML(o) {
    var P = PROGS[o.prog], mode = P.mode;
    var hab = T.pr.hab;
    var out = '<details class="tr-how"><summary>How ' + esc(P.n.toLowerCase()) + ' works</summary>';
    if (mode === 'keep') {
      out += '<p><b>Sets.</b> Three per exercise on two days a week, two on three — about six hard sets a muscle a week. Strength that has been built takes far less to keep than it took to build: one study held it for eight months on one session a week and a fraction of the sets. Older lifters need a little more, which is why this is two sessions, not one.</p>' +
        '<p><b>Effort.</b> About two reps short of failure on the big lifts, one on the small ones. Heavy is the part that keeps strength; failure is not.</p>' +
        '<p><b>Pairs.</b> One muscle rests while another works — a leg movement beside a row, a press beside a leg curl — with a minute between the halves, which leaves each muscle nearly three minutes between its own sets. That is how a whole body fits in forty minutes.</p>' +
        '<p><b>Weights.</b> Still double progression: when the top of the rep range comes easily, the weight goes up. Keeping is not standing still.</p>' +
        '<p><b>When it changes.</b> A session that was too much, or hurt, takes a set away next week. Strength sliding two weeks running puts one back. Otherwise it holds.</p>';
    } else if (mode === 'str') {
      out += '<p><b>The main lifts.</b> A squat, a bench press, a deadlift and an overhead press \u2014 or the nearest your kit, back and joints allow \u2014 each worked from a <i>training max</i>, about nine-tenths of the most you could lift once. Your log fills it in where it can; you can type your own on the draft.</p>' +
        '<p><b>The wave.</b> Four weeks. Week one, accumulation: many sets at a moderate share of the max. Week two, intensification: fewer, heavier. Week three, realization: two ramp sets, then one set for as many good reps as you can. Week four, a deload. The waves go tens, eights, fives, threes: more reps and more sets early, heavier and fewer later.</p>' +
        '<p><b>The all-out set.</b> Every rep past its target adds a step to that lift\u2019s max for the next wave \u2014 the smallest jump on a press, twice that on a squat or deadlift \u2014 and every rep short takes one off, five steps at most either way. Stop the set when a rep slows to a grind; the method wants hard, not ugly.</p>' +
        '<p><b>Everything else.</b> Three steady sets of each accessory, about two reps short of failure, to keep the muscle behind the lifts. Changing the load on a plan like this built more strength than doing the same thing every week.</p>';
    } else if (mode === 'cond') {
      out += '<p><b>Strength first.</b> A squat or hinge, a press and a pull, three steady sets each about two reps short of failure, moved by double progression. That is the part that keeps and builds strength.</p>' +
        '<p><b>Then the circuit.</b> Three movements \u2014 a leg one, a push or pull, and one that gets you breathing \u2014 done one of three ways, turning over through the week: as many rounds as you can in the time (AMRAP), every minute on the minute (EMOM), or a set number of rounds for time. The app keeps the clock, calls each minute of an EMOM, and beeps.</p>' +
        '<p><b>The score to beat.</b> Each day\u2019s circuit comes back the next week, so the progression is plain: a round more, a minute more done, or a faster time. The review reads it back, and the minutes count as vigorous activity toward the WHO\u2019s 150.</p>' +
        '<p><b>Safety.</b> Injury rates in CrossFit-style training look like other strength and fitness training, and they rise where fatigue and form part company \u2014 so a rep done badly because you are out of breath is the one to leave out. Movements that load what you protect are left out; jumping goes if your knees or feet are on the list.</p>';
    } else if (mode === 'base') {
      out += '<p><b>Sets.</b> Two or three of each exercise, the same every week. A beginner grows and gets stronger on far less than a trained lifter needs, so the time goes into doing each rep well rather than doing more of them.</p>' +
        '<p><b>Effort.</b> Three reps short of failure for the first half, while the movements are new, then two. Close enough to count, far enough to keep the form.</p>' +
        '<p><b>Weights.</b> Reach the top of the rep range on your best set and the weight goes up by the smallest step; otherwise one more rep next time. Expect it to go up most weeks for a while — that is the fun part of starting.</p>' +
        '<p><b>When it changes.</b> A session that was too much, or hurt, takes a set away. After a block or two, when the weights stop going up every week, one of the building programs is the next step.</p>';
    } else {
      out += '<p><b>Sets.</b> Week one starts each muscle near RP’s MEV — the least that reliably grows it. After each session you rate the pump and the workload, and next time you train that muscle you say how well it healed. Those answers add up to next week’s change: usually one more set, two if the muscle is plainly asking for more, none or one fewer if you are not recovering. It never goes past RP’s MRV, or past your minutes.</p>' +
        '<p><b>Why ask about soreness at all?</b> It is a rough signal — it follows how new an exercise is more than how much it grew — which is why it is one vote of three, and why getting weaker overrules all of them.</p>' +
        '<p><b>Effort.</b> Sets end 3 reps short of failure in week one and step down to ' + (P.cap ? '1' : '0') + ' by the last hard week. Heavy barbell lifts stop at 1.</p>' +
        '<p><b>Weights.</b> Hit the top of the rep range and the weight goes up by the smallest jump; otherwise aim for one more rep at the same weight.</p>' +
        '<p><b>Deload.</b> The last week is half the sets at week one’s weights. It is there to let fatigue drain, not to grow — one trial found a week off changed growth not at all.</p>';
      if (P.pb) {
        out += '<p><b>The main lift.</b> Each session opens with one: a top set of four to six about two reps short of failure, then three back-off sets of eight at eighty-five per cent of it. The top set moves by double progression \u2014 six reps and it goes up \u2014 and its sets never climb; the feedback moves the accessories. Heavy sets built more strength than moderate ones in the research, and the two grew muscle about the same, which is why this does both.</p>';
      }
      if (o.prog === 'focus') {
        out += '<p><b>The focus.</b> ' + (o.fx ? esc(names(FOCUS[o.fx].m.map(function (m) { return { n: mname(m) }; }))) : 'The area you pick') +
          ' goes first in every session that trains it — what comes first gets the most out of you — gets an extra exercise on those days, starts four sets higher and climbs on the feedback. Everything else is held near RP’s maintenance volume, about three-fifths of MEV, and only moves if a session was too much. A block or two like this, then back to an even split.</p>';
      }
      if (P.cap) {
        out += '<p><b>While you eat less.</b> Losing weight is the kitchen’s job — Nourish’s targets do it. The training’s job is to give your body a reason to keep its muscle: loads stay heavy, sets end a rep short of failure, and the weekly climb is one set at a time to a roof about a third below RP’s MRV, because recovery is slower on less food. In the research, lifting in a deficit still built strength; muscle gains shrank as the deficit grew.</p>';
      }
      if (o.prog === 'home') {
        out += '<p><b>No plates to add.</b> Bodyweight gets harder by becoming a harder exercise. Reach the top of the rep range on every set and the next session moves you up a rung — incline push-up to push-up to deficit push-up to archer, negative pull-up to pull-up, bodyweight squat to split squat to Bulgarian. Too big a jump is a swap away from the rung below. Push-ups made harder this way built chest muscle much as the bench press did, and in the research load matters little to growth when sets go close to failure.</p>' +
          '<p><b>What it needs.</b> The floor, mostly. Pull-ups need a bar and inverted rows a sturdy table; each exercise that needs something says so, and anything you cannot do is a swap away.</p>';
      }
    }
    if (T.pr.bk) {
      out += '<p><b>Your back.</b> ' + (T.pr.bk.indexOf('f') >= 0
        ? 'Loaded bending is left out — deadlifts, Romanian deadlifts, good mornings, bent-over rows, back squats and crunches. Hip work comes from hip thrusts and leg curls, rows are chest-supported, and the core slot trains your trunk to resist moving rather than to bend: Pallof presses, dead bugs, bird dogs. '
        : 'Lifts that load your back the way you said are left out, and the ones that load it a little carry a cue. ') +
        'Each session starts by asking how your back is, and a bad answer changes what the session asks of you.</p>';
    }
    if (T.pr.jt) {
      out += '<p><b>Your ' + esc(names(T.pr.jt.split('').map(function (j) { return { n: JNAME[j].toLowerCase() }; }))) + '.</b> ' +
        'Exercises that load ' + (T.pr.jt.length > 1 ? 'them' : 'it') + ' hard are left out — for a shoulder, overhead and wide-grip barbell pressing; for a knee, deep loaded squats and lunges; for a wrist, barbell curls and flat-palm push-ups — and the ones that load ' + (T.pr.jt.length > 1 ? 'them' : 'it') + ' a little come with a cue. Each session asks how ' + (T.pr.jt.length > 1 ? 'they feel' : 'it feels') + ' before you start.</p>';
    }
    if (hab.length) {
      var legs = hab.filter(function (h) { return HABITS[h].legs === 2; });
      var golf = hab.indexOf('golfw') >= 0 || hab.indexOf('golfc') >= 0;
      out += '<p><b>Outside the gym.</b> ' + esc(names(hab.map(function (h) { return { n: HABITS[h].n }; }))) +
        ' count' + (hab.length > 1 ? '' : 's') + ' toward the 150 active minutes a week the WHO recommends — a vigorous minute counts twice. ' +
        (legs.length && mode === 'grow' ? 'Because ' + esc(names(legs.map(function (h) { return { n: HABITS[h].n.toLowerCase() }; }))) + ' already work' + (legs.length > 1 ? '' : 's') + ' your legs hard, leg sets start two lower; the feedback adds them back if you recover. The newer research finds cardio does little harm to muscle or strength, so this is about fatigue, not interference. ' : '') +
        (golf ? 'Golf loads your back too — address is a forward bend and the swing a twist at speed — which is why the core work resists rotation. ' : '') +
        'The app does not know your calendar, so a hard leg session the day before a match or a long hike is yours to move.</p>';
    }
    out += '<p class="tr-fine">' + (mode === 'cond' ? 'In the style of CrossFit, not CrossFit\u2019s own programming. The research on it is mostly short and small; the review watches your scores rather than trusting it.'
      : mode === 'str' ? 'The wave\u2019s shape is in the style of the Juggernaut Method; the percentages are this app\u2019s round numbers in that shape, not the book\u2019s tables. The review reads your all-out sets.'
      : mode === 'keep' ? 'The maintenance doses come from studies of groups, not of you — the review watches whether your strength actually holds.'
      : mode === 'base' ? 'Based on the American College of Sports Medicine’s advice for people starting out. The review watches whether your lifts are going up.'
      : 'The landmarks are Renaissance Periodization’s published estimates, not measurements of you. That is what the feedback is for.') +
      (T.pr.bk || T.pr.jt ? ' Which movements suit your body is a question for a physio who has examined it; anything they rule out goes on your never list in Settings.' : '') + '</p>';
    return out + '</details>';
  }

  /* What A1 and A2 mean, and why this block has them where it does — the
     letters appear only on the exercises that were paired, and without a
     word about it that looked like chance. */
  function pairWhy(ms) {
    return 'A1 and A2 are a pair: a set of one, ' + clock(T.pr.rp) + ' rest, a set of the other, and back. ' +
      (isKeep(ms) ? 'Keeping pairs everything on purpose, so one muscle rests while the other works.'
        : ms && ms.min ? 'Paired only as far as it takes to fit your ' + ms.min + ' minutes; the rest are done set after set.'
        : 'Paired so one muscle rests while the other works.');
  }

  /* A1, A2, B1… for a list of slots, in the order the pairs appear. A pair
     that has lost its other half is not labelled. */
  function slotLabels(list) {
    var seen = {}, next = 0;
    return list.map(function (sl) {
      if (!sl.p || list.filter(function (x) { return x.p === sl.p; }).length < 2) return '';
      if (!seen[sl.p]) seen[sl.p] = { l: String.fromCharCode(65 + next++), n: 0 };
      return seen[sl.p].l + (++seen[sl.p].n);
    });
  }

  /* The training maxes a wave works from, filled in from your log or the
     last wave, and yours to change: about nine-tenths of the most you could
     lift once. */
  function tmHTML(ms) {
    if (ms.goal !== 'str') return '';
    var mains = [];
    ms.days.forEach(function (d) { d.s.forEach(function (s) { if (s.m && mains.indexOf(s.e) < 0) mains.push(s.e); }); });
    return '<div class="tr-q"><div class="tr-ql">Training maxes</div>' +
      '<div class="tr-tms">' + mains.map(function (e) {
        var v = ms.tm && fin(ms.tm[e]) ? ms.tm[e] : '';
        return '<label class="tr-tm"><span>' + esc(lib(e).n) + '</span>' +
          '<input class="tr-in" inputmode="decimal" autocomplete="off" data-tm="' + esc(e) + '" value="' + esc(v) + '" ' +
            'placeholder="from session one" aria-label="Training max for ' + esc(lib(e).n) + ' in ' + T.pr.u + '"> ' + T.pr.u + '</label>';
      }).join('') + '</div>' +
      '<div class="tr-hint">About nine-tenths of the most you could lift once. Filled in from your log where it can be; leave one blank and its first session is done by feel, and the rest of the wave works from it.</div></div>';
  }

  function draftHTML() {
    var ms = S.draft;
    var tot = totals(ms, ms.days.map(function (d) { return d.s.map(function (s) { return s.n; }); }));
    return '<div class="tr-card">' +
      '<div class="tr-eyebrow">Your block, before it starts</div>' +
      /* Its name is yours to give: the program's own is only a start, and a
         list of blocks all called "Upper / lower · 4 days" says nothing. */
      '<label class="sr-only" for="trDraftName">Name this block</label>' +
      '<input class="txt tr-title tr-dname" id="trDraftName" maxlength="60" autocomplete="off" value="' + esc(ms.n) + '">' +
      (active() && active().id !== ms.id ? '<div class="tr-note">Starting it ends <b>' + esc(active().n) + '</b>. Its workouts stay in History, under Blocks.</div>' : '') +
      '<div class="tr-sub">' + weeksOf(ms) + ' weeks · ' + esc(KITS[ms.kit].n.toLowerCase()) +
        ' · tap an exercise to swap it</div>' +
      (Array.isArray(ms.nt) && ms.nt.length ? '<ul class="tr-fits">' + ms.nt.map(function (n) {
        return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
      (ms.days.some(function (d) { return slotLabels(d.s).some(Boolean); }) ? '<div class="tr-hint tr-pairwhy">' + esc(pairWhy(ms)) + '</div>' : '') +
      ms.days.map(function (day, d) {
        if (day.ez) {
          return '<div class="tr-dday tr-ez"><div class="tr-dday-h">Easy day</div>' +
            '<div class="tr-sub">No lifting: a walk, a ride, a swim or yoga, logged under Outside the gym.</div></div>';
        }
        var labels = slotLabels(day.s);
        var mins = estDay(day);
        return '<div class="tr-dday"><div class="tr-dday-h">' + esc(dayName(day)) +
            '<span class="tr-mins' + (ms.min && mins > ms.min ? ' over' : '') + '">about ' + mins + ' min</span></div>' +
          day.s.map(function (s, i) {
            var ex = lib(s.e);
            var cue = backCue(ex);
            var gear = atHome(KITS[ms.kit].eq) && GEAR[ex.id];
            if (gear) cue = 'Needs ' + gear + '.' + (cue ? ' ' + cue : '');
            return '<div class="tr-drow">' +
              (labels[i] ? '<span class="tr-pair">' + labels[i] + '</span>' : '') +
              '<button class="tr-dex" data-t="dswap" data-d="' + d + '" data-i="' + i + '">' +
                '<span class="tr-dex-n">' + esc(ex.n) + '</span>' +
                '<span class="tr-dex-m">' + esc(mname(ex.m)) + ' · ' + (s.m ? (ms.goal === 'str' ? 'sets and reps from the wave' : 'a top set of 4–6, three back-offs of 8')
                  : ex.rr[0] + '–' + ex.rr[1] + ' reps') +
                  (cue ? ' · <span class="tr-cue-in">' + esc(cue) + '</span>' : '') + '</span></button>' +
              (s.m ? '<span class="tr-step tr-mainst">main lift</span>' :
              '<span class="tr-step">' +
                '<button data-t="dset" data-d="' + d + '" data-i="' + i + '" data-v="-1" aria-label="One set fewer">−</button>' +
                '<span>' + s.n + ' set' + (s.n === 1 ? '' : 's') + '</span>' +
                '<button data-t="dset" data-d="' + d + '" data-i="' + i + '" data-v="1" aria-label="One set more">+</button>' +
              '</span>') +
              '<button class="tr-x" data-t="ddel" data-d="' + d + '" data-i="' + i + '" aria-label="Remove ' + esc(ex.n) + '">&times;</button>' +
            '</div>';
          }).join('') +
          '<button class="tr-add" data-t="dadd" data-d="' + d + '">+ Add an exercise</button>' +
          (day.mc && mcValid(day.mc) ? '<div class="tr-mcp"><span class="tr-ql">Then the circuit</span><div>' + esc(mcSay(day.mc)) + '</div></div>' : '') +
        '</div>';
      }).join('') +
      tmHTML(ms) +
      '<div class="tr-vol"><div class="tr-ql">' + (steady(ms) ? 'Sets per muscle each week' : 'Week one, sets per muscle') + '</div>' +
        Object.keys(tot).map(function (m) {
          return '<span class="tr-volc">' + esc(mname(m)) + ' <b>' + tot[m] + '</b></span>';
        }).join('') + '</div>' +
      '<div class="tr-acts"><button class="btn-primary" data-t="begin">Start this block</button>' +
        // a block run again keeps its exercises; there is nothing to draw them from anew
        (S.opt ? '<button class="ghost" data-t="shuffle">Different exercises</button>' : '') +
        '<button class="ghost" data-t="undraft">Back</button></div>' +
    '</div>';
  }

  /* -------------------------------------------------------- the live screen */
  function liveHTML() {
    var L = LIVE;
    var ms = L.ms ? T.ms[L.ms] : null;
    var html = '<div class="tr-live-h">' +
      // a workout called Workout needs no eyebrow saying so
      '<div>' + (ms || L.n !== 'Workout' ? '<div class="tr-eyebrow">' + (ms ? (L.dl ? 'Deload' : 'Week ' + (L.w + 1)) + ' \u00b7 ' + esc(ms.n.split(' \u00b7 ')[0]) : 'Workout') + '</div>' : '') +
        '<div class="tr-title">' + esc(L.n) + '</div>' +
        (ms ? '<div class="tr-sub">' + (L.dl ? 'Light and easy: stop every set well short of failure.'
          : L.ph ? esc(L.ph) : rirSay(L.rir).charAt(0).toUpperCase() + rirSay(L.rir).slice(1) + '.') + '</div>'
          : L.cc ? '<div class="tr-sub">One set at each machine, C1 to C' + stations().length + ', then round again. ' +
            clock(L.cc.sr) + ' to move on, ' + clock(L.cc.rr) + ' after each round; each set stopped about ' + (L.rir || 2) + ' reps short of failure.</div>' : '') +
      '</div>' +
    '</div>';

    /* What A1 and A2 mean, on the block's first workout: by the second it
       is known, and a paragraph above the first lift every time is in the way. */
    if (ms && pairLabels().some(Boolean) && !ix().list.some(function (w) { return w.ms === ms.id; })) {
      html += '<div class="tr-hint tr-pairwhy">' + esc(pairWhy(ms)) + '</div>';
    }

    if (T.pr.gy.on && T.pr.gy.u === T.pr.u) {
      if (L.g !== 'home' && L.g !== 'gym') { L.g = T.pr.gy.last; saveLive(); }
      html += '<div class="tr-where"><span class="tr-ql">Where</span>' + chips('gyat', L.g, [['gym', 'Gym'], ['home', 'Home']]) + '</div>';
    }
    if (T.pr.lvl === 0 && !T.pr.hw) html += howCard();
    html += startCard(L);

    var labels = pairLabels();
    var gs = moveGroups();
    L.x.forEach(function (x, i) {
      var g = -1;
      gs.forEach(function (grp, k) { if (grp.indexOf(i) >= 0) g = k; });
      html += exCard(x, i, labels[i], gs.length > 1 ? { up: g > 0, dn: g < gs.length - 1 } : null);
      var m = musOf(x.e);
      if (lastOfMuscle(i) && fbReady(m)) html += fbCard(m);
    });
    if (L.mc && mcValid(L.mc)) html += mcCard(L.mc);
    /* An empty workout has one thing to do, and it is the big button;
       throwing it away is there, and small. Finish is in the bar, one reach
       away from every card. */
    if (!L.x.length && !(L.mc && mcValid(L.mc))) {
      html += '<div class="tr-card tr-empty"><div class="tr-title">Nothing in it yet</div>' +
        '<div class="tr-sub">Add the first exercise: search the library by name, or pick by muscle.</div>' +
        '<button class="btn-primary tr-go" data-t="addex">+ Add an exercise</button></div>';
    } else {
      html += '<button class="tr-addset tr-addex" data-t="addex">+ Add an exercise</button>';
    }
    html += '<div class="tr-acts tr-foot"><button class="tr-lnk tr-lnk-rm" data-t="discard">Discard workout</button></div>';
    return html;
  }

  /* The first workout, for someone who has never logged one: how it goes,
     once, until put away. */
  function howCard() {
    return '<div class="tr-card tr-how1"><div class="tr-sq-l">How a workout goes</div>' +
      '<ol class="tr-howto">' +
        '<li>Do one set of the first lift: that many reps, then put it down. New to a lift? Start light, a weight you could lift about 15 times; easy, go up a little next set.</li>' +
        '<li>Tap \u2713. The grey numbers are filled in for you; type over them if you did something different.</li>' +
        '<li>Rest until the timer ends, then the next set. When a lift\u2019s sets are all ticked, move to the next lift.</li>' +
        '<li>Not sure how a lift is done? Tap its name. Machine taken, or it hurts? Swap.</li>' +
        '<li>Done with all of it? Finish, at the bottom.</li>' +
      '</ol>' +
      '<div class="tr-acts"><button class="ghost" data-t="hwok">Got it</button></div></div>';
  }

  /* Before you start: the back (and joints) and your weight on a pull-up
     day, asked together in one card and folded to a line once each has an
     answer. A sore back keeps its warning in view when folded. How each
     muscle healed is asked at its own first exercise; see healHTML(). */
  function startParts(L) {
    return { back: !!(T.pr.bk || T.pr.jt), bw: bwNeed(L) || fin(L.bw) || !!L.bwo };
  }
  function startDone(L, P) {
    P = P || startParts(L);
    return (!P.back || fin(L.bk)) && (!P.bw || fin(L.bw) || !!L.bwq);
  }
  function startCard(L) {
    var P = startParts(L);
    if (!P.back && !P.bw) return '';
    var u = L.u || T.pr.u;
    if (startDone(L, P) && !L.sto) {
      var bits = [];
      if (P.back) bits.push(bkSay(L));
      if (fin(L.bw)) bits.push('you ' + fmtN(L.bw) + ' ' + u);
      var say = bits.join(' \u00b7 ');
      say = say.charAt(0).toUpperCase() + say.slice(1);
      return '<div class="tr-card tr-ask tr-bkt tr-start">' +
        '<button class="tr-fbt tr-bkt-b" data-t="stopen" aria-label="Before you start: ' + esc(say) + '. Change">' +
          '<span class="tr-fbt-n">Before you start</span><span class="tr-fbt-s">' + esc(say) + '</span>' +
          '<span class="tr-fbt-e">Change</span></button>' +
        (P.back ? bkNote(L, true) : '') +
      '</div>';
    }
    return '<div class="tr-card tr-ask tr-start">' +
      (P.back ? bkQ(L) : '') +
      (P.bw ? bwPart(L, u) : '') +
      (L.sto && startDone(L, P) ? '<div class="tr-acts tr-bwq-a"><button class="tr-lnk" data-t="stdone">Done</button></div>' : '') +
    '</div>';
  }
  // answered: tucked away again once everything before you start has an answer
  function startTuck(L) { if (startDone(L)) delete L.sto; }

  var BK_SAY = ['good', 'a bit tight', 'sore'];
  // the back and joints: what is asked, what each answer means
  function bkInfo(L) {
    var jl = T.pr.jt.split('').filter(Boolean).map(function (j) { return { n: JNAME[j].toLowerCase() }; });
    var jts = names(jl);
    var ask = T.pr.bk ? (T.pr.jt ? 'How are your back and joints today?' : 'How\u2019s your back today?')
      : jl.length > 1 ? 'How are your ' + jts + ' today?' : 'How\u2019s your ' + jts + ' today?';
    var what = T.pr.bk ? (T.pr.jt ? 'Back & joints' : 'Back') : jl.length > 1 ? 'Joints' : JNAME[T.pr.jt[0]];
    var loads = T.pr.bk ? 'your back' + (T.pr.jt ? ' or your ' + jts : '') : 'your ' + jts;
    var tight = 'Warm up a little longer, keep the first set of anything that loads ' + loads + ' light, and stop any lift that makes it worse.';
    var sore = T.pr.bk
      ? 'Skip the lower-body lifts today \u2014 swap or remove them \u2014 and keep to what feels fine. Pain, numbness or tingling running down a leg means stop: that is the nerve, and it is a question for your physio, not for this app.'
      : 'Skip or swap anything that loads your ' + jts + ' today, and keep to what feels fine. Sharp pain, swelling, or pain that is still there the next day is a question for a physio or doctor, not for this app.';
    var has = fin(L.bk);
    return { ask: ask, what: what, tight: tight, sore: sore, has: has,
      word: has ? (L.bk === 1 && !T.pr.bk ? 'a bit stiff' : BK_SAY[L.bk]) : '' };
  }
  function bkQ(L) {
    var b = bkInfo(L);
    return segQ(esc(b.ask), 'bk', b.has ? L.bk : '', [[0, 'Good'], [1, T.pr.bk ? 'A bit tight' : 'A bit stiff'], [2, 'Sore']], '') + bkNote(L, false);
  }
  function bkNote(L, folded) {
    var b = bkInfo(L), cls = folded ? ' tr-bkt-n' : '';
    return (L.bk === 1 ? '<div class="tr-note' + cls + '">' + esc(b.tight) + '</div>' : '') +
      (L.bk === 2 ? '<div class="tr-note tr-warn' + cls + '">' + esc(b.sore) + '</div>' : '');
  }
  // "back good", "knees a bit stiff"
  function bkSay(L) { var b = bkInfo(L); return b.what.toLowerCase() + ' ' + b.word; }

  /* A pull-up day with nothing reliable to go on: no week of weigh-ins to
     average and none today. Asked once; answered, it is today's weigh-in on
     Nourish too. Never asked when the lift doesn't need it. */
  function bwNeed(L) {
    if (!L || fin(L.bw) || L.bwq || T.pr.nobw || !L.x.some(function (x) { return usesBw(x.e); })) return false;
    var b = bwInfo(dayKey(new Date(L.st)), L.u || T.pr.u);
    return !b || b.src === 'old';
  }
  function bwPart(L, u) {
    if (fin(L.bw) && !L.bwo) {
      return '<div class="tr-bwq-done">Your weight today: <b>' + fmtN(L.bw) + ' ' + u + '</b> ' +
        '<button class="tr-lnk" data-t="bwopen">Change</button></div>';
    }
    if (!L.bwo && !bwNeed(L)) return '';
    var b = bwInfo(dayKey(new Date(L.st)), u);
    var when2 = b && b.k ? shortDate(new Date(b.k + 'T12:00:00').getTime()) : '';
    var odd = S.bwOdd;
    return '<div class="tr-bwq">' +
      '<div class="tr-sq-l tr-fbm">What do you weigh today?</div>' +
      '<div class="tr-bwq-r"><input class="tr-in tr-bwq-in" id="trBwq" inputmode="decimal" autocomplete="off" value="' + (odd ? esc(fmtN(odd.v)) : '') + '"' +
        ' placeholder="' + (b ? esc(fmtN(b.v)) : '') + '" aria-label="Your weight today, in ' + u + '"><span class="tr-bwq-u">' + u + '</span>' +
        '<button class="btn-primary" data-t="bwqsave">Save</button></div>' +
      (odd ? '<div class="tr-note tr-warn">That\u2019s ' + fmtN(odd.v) + ' ' + u + (odd.ref ? ', against ' + fmtN(odd.ref) + ' ' + u + ' lately' : '') +
        '. <button class="tr-lnk" data-t="bwqkeep">Keep it</button></div>' : '') +
      '<div class="tr-acts tr-bwq-a">' +
        (b && b.src === 'old' ? '<button class="tr-lnk" data-t="bwqold">Use ' + fmtN(b.v) + ' from ' + when2 + '</button>' : '') +
        '<button class="tr-lnk" data-t="bwqskip">Not now</button>' +
        '<button class="tr-lnk" data-t="bwqwhy" aria-expanded="' + !!S.bwWhy + '">Why?</button></div>' +
      (S.bwWhy ? '<div class="tr-sub">Pull-ups and dips lift you, so their numbers count your weight. ' +
          (b && b.src === 'old' ? 'Your last weigh-in was ' + fmtN(b.v) + ' ' + u + ' on ' + when2 + '.' : 'There\u2019s no weigh-in from the last two weeks.') +
          ' Saved, it\u2019s today\u2019s weigh-in on Nourish as well, on every device you sign in on.</div>' +
        '<div class="tr-acts tr-bwq-a"><button class="tr-lnk" data-t="bwqnever">Don\u2019t ask again</button></div>' : '') +
    '</div>';
  }
  /* The weight typed at the gym: into Nourish as the day's weigh-in, through
     Nourish's own guard, and kept for this workout either way. */
  function bwSave(force) {
    var L = LIVE, box = $('trBwq');
    if (!L || !box) return;
    var v = numIn(box.value), u = L.u || T.pr.u;
    if (v === null || !(v > 0) || v > (u === 'kg' ? 700 : 1500)) { box.setAttribute('aria-invalid', 'true'); box.focus(); return; }
    var lb = u === 'kg' ? v * 2.20462 : v;
    var H = window.Hive, res = H && H.weigh ? H.weigh(dayKey(new Date(L.st)), lb, { force: !!force, was: L.bwn }) : null;
    if (res && res.odd) {
      S.bwOdd = { v: v, ref: res.ref ? Math.round((u === 'kg' ? res.ref / 2.20462 : res.ref) * 10) / 10 : 0 };
      draw();
      return;
    }
    S.bwOdd = null;
    L.bw = Math.round(v * 10) / 10;
    if (res && res.ok) L.bwn = res.lb;
    L.bwq = 'saved';
    L.bwo = 0;
    startTuck(L);
    saveLive();
    draw();
  }

  /* The circuit: what to do, a clock, and the score. The clock counts down
     an AMRAP or an EMOM and up for rounds for time; an EMOM calls each
     minute's movement and beeps as the minute turns. */
  function mcEl(c) { return c.st ? Math.floor(((c.en || Date.now()) - c.st) / 1000) : 0; }
  function mcClockText(c) {
    var el = mcEl(c);
    return c.k === 'rft' ? clock(el) : clock(Math.max(0, mcMinutes(c) * 60 - el));
  }
  function mcNowText(c) {
    if (c.k !== 'emom' || !c.st || c.en) return '';
    var mi = Math.floor(mcEl(c) / 60), m = c.mv[mi % c.mv.length];
    return 'Minute ' + Math.min(mi + 1, c.min) + ' of ' + c.min + ': ' + m.r + ' ' + MOVES[m.id].n.toLowerCase();
  }
  function mcCard(c) {
    var run = c.st && !c.en;
    var inp = function (f, ph, label, w) {
      return '<label class="tr-mcin"><span>' + label + '</span><input class="tr-in" data-mc="' + f + '" inputmode="' +
        (f === 'sec' ? 'text' : 'numeric') + '" autocomplete="off" placeholder="' + esc(ph) + '" value="' + esc(c[f]) + '"' +
        (w ? ' style="width:' + w + 'px"' : '') + '></label>';
    };
    return '<div class="tr-card tr-mc">' +
      '<div class="tr-eyebrow">Circuit \u00b7 ' + MC_K[c.k] + '</div>' +
      '<div class="tr-title">' + (c.k === 'rft' ? c.rd + ' rounds for time' : c.min + ' minutes, ' +
        (c.k === 'amrap' ? 'as many rounds as you can' : 'every minute on the minute')) + '</div>' +
      '<ol class="tr-mcl">' + c.mv.map(function (m) { return '<li><b>' + m.r + '</b> ' + esc(MOVES[m.id].n) + '</li>'; }).join('') + '</ol>' +
      '<div class="tr-hint">' + (c.k === 'emom' ? 'Minute one, the first movement; minute two, the second; and round again. Rest whatever is left of each minute.'
        : c.k === 'rft' ? 'Stop at ' + c.cap + ' minutes wherever you have got to.' : 'Move steadily; a pace you can hold beats a sprint and a stop.') +
        ' Hard, but every rep a good one.</div>' +
      (c.last ? '<div class="tr-sub">Last time: ' + esc(mcScore(c.last)) + '</div>' : '') +
      '<div class="tr-mc-clock"><span id="trMcClock" class="tr-mc-t" role="timer">' + mcClockText(c) + '</span>' +
        '<span id="trMcNow" class="tr-mc-now">' + esc(mcNowText(c)) + '</span></div>' +
      '<div class="tr-acts">' + (!c.st ? '<button class="btn-primary" data-t="mcgo">Start the clock</button>'
        : run ? '<button class="ghost" data-t="mcstop">' + (c.k === 'rft' ? 'Done \u2014 stop the clock' : 'Stop') + '</button>'
        : '<button class="tr-lnk" data-t="mcreset">Reset the clock</button>') + '</div>' +
      '<div class="tr-mcs">' + (c.k === 'amrap' ? inp('r', '0', 'Rounds', 64) + inp('x', '0', '+ reps', 64)
        : c.k === 'emom' ? inp('done', String(c.min), 'Minutes done', 64) : inp('sec', 'mm:ss', 'Time', 84)) + '</div>' +
    '</div>';
  }
  function mcTick() {
    var c = LIVE && LIVE.mc;
    if (!c || !c.st || c.en) return;
    var el = mcEl(c), total = mcMinutes(c) * 60;
    if (el >= total) {
      c.en = c.st + total * 1000;
      if (c.k === 'rft' && !c.sec) c.sec = clock(total);
      if (c.k === 'emom' && !c.done) c.done = String(c.min);
      saveLive(); ring(); draw();
      return;
    }
    if (c.k === 'emom') {
      var mi = Math.floor(el / 60);
      if (mi > (c.rm || 0)) { c.rm = mi; saveLive(); ring(); }
    }
    var ck = $('trMcClock'), nw = $('trMcNow');
    if (ck) ck.textContent = mcClockText(c);
    if (nw) nw.textContent = mcNowText(c);
  }
  /* "12:34", or "12" meaning minutes. */
  function parseClock(v) {
    var s = String(v || '').trim();
    if (!s) return null;
    var m = s.match(/^(\d{1,3}):(\d{1,2})$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    var n = numIn(s);
    return n !== null ? Math.round(n * 60) : null;
  }
  /* The circuit as it was done, for the log: its shape and its score. */
  function mcDone(c) {
    if (!c || !mcValid(c)) return null;
    var sc = { k: c.k, min: c.min, mv: c.mv.map(function (m) { return { id: m.id, r: m.r }; }) };
    if (c.k === 'rft') {
      sc.rd = c.rd; sc.cap = c.cap;
      var sec = parseClock(c.sec);
      if (sec !== null && sec > 0) sc.sec = Math.min(sec, 3600);
    } else if (c.k === 'amrap') {
      var r = numIn(c.r);
      if (r !== null && r >= 0) { sc.r = Math.min(999, Math.round(r)); sc.x = Math.max(0, Math.round(numIn(c.x) || 0)); }
    } else {
      var dn = numIn(c.done);
      if (dn !== null && dn >= 0) sc.done = Math.min(c.min, Math.round(dn));
    }
    return mcScore(sc) ? sc : null;
  }

  /* The weight a set is at: what you typed, else what the box is showing
     greyed. Which of the two, so the plates can be drawn faint for a guess. */
  function setWeight(xi, si) {
    var s = LIVE.x[xi].s[si], typed = numIn(s.w);
    if (typed !== null) return { w: typed, dim: false };
    var g = ghost(xi, si);
    return { w: g.w, dim: true };
  }
  function nextSet(x) {
    for (var j = 0; j < x.s.length; j++) if (!x.s[j].t) return j;
    return -1;
  }
  // last time's set, as the Previous column shows it: BW for a bodyweight lift with nothing added
  function prevText(s, e) {
    if (!fin(s.pw) || !fin(s.pr)) return '\u2014';
    return (s.pw === 0 && e && (usesBw(e) || lib(e).q === 'bw') ? 'BW' : fmtN(s.pw)) + ' \u00d7 ' + s.pr;
  }
  /* The left-hand cell of a barbell set: the plates, with last time under
     them. No dash when there is neither, so the plates have the room. */
  function plCell(xi, si) {
    var x = LIVE.x[xi], s = x.s[si], sw = setWeight(xi, si);
    var prev = fin(s.pw) && fin(s.pr) ? fmtN(s.pw) + ' \u00d7 ' + s.pr : '';
    var stk = stackHTML(sw.w, barAt(x.e), sw.dim);
    if (!stk) return prev;
    return stk + (prev ? '<span class="tr-prev-s">last ' + prev + '</span>' : '');
  }
  /* In every set, the plates where the loading changes and on the next set
     to do; four rows of the same 45, 25, 2.5 said nothing the first did. */
  function plRow(xi, si) {
    var x = LIVE.x[xi];
    if (si === 0 || si === nextSet(x)) return true;
    var a = setWeight(xi, si), b = setWeight(xi, si - 1);
    return !(a.w === b.w || (a.w === null && b.w === null));
  }
  /* While typing, the same cell shows last time until its weight has the
     cursor, or it is the next set to do; then the plates. */
  function plShown(c) { return !c.classList.contains('tr-plt') || c.classList.contains('on'); }
  /* How today is going against last time, for the badge beside a lift's
     name. Only the working sets done so far count, each held against the
     set it is paired with, so it never reads -100% before the first set.
     Where the plan asked for less than last time on purpose (a deload, a
     lighter wave, a weight brought down), today is held against the plan
     instead, so doing what the plan says never shows as falling behind. */
  function focusOf(xi) {
    var x = LIVE && LIVE.x[xi];
    if (!x) return null;
    var done = x.s.filter(function (s) { return s.t && counts(s); });
    if (!done.length) return null;
    var hasT = function (s) { return fin(s.tw) && fin(s.tr); };
    var hasP = function (s) { return fin(s.pw) && fin(s.pr); };
    var lower = !!LIVE.dl || done.some(function (s) { return hasT(s) && hasP(s) && s.tw * s.tr < s.pw * s.pr; });
    var cur = { vol: 0, reps: 0, best: 0 }, was = { vol: 0, reps: 0, best: 0 }, n = 0, plan = false;
    done.forEach(function (s) {
      var bw, br;
      if (hasT(s) && (lower || !hasP(s))) { bw = s.tw; br = s.tr; plan = true; }
      else if (hasP(s)) { bw = s.pw; br = s.pr; }
      else return;
      var w = numIn(s.w) || 0, r = numIn(s.r) || 0;
      cur.vol += w * r; cur.reps += r; cur.best = Math.max(cur.best, e1rm(w, r));
      was.vol += bw * br; was.reps += br; was.best = Math.max(was.best, e1rm(bw, br));
      n++;
    });
    if (!n) return null;
    return { plan: plan, bw: usesBw(x.e) || (!(cur.vol > 0) && !(was.vol > 0)), cur: cur, was: was };
  }
  var FM_SAY = { vc: 'volume change', vol: 'total volume', reps: 'total reps', best: 'best set' };
  // the badge: on unless switched off; for someone new, off unless switched on (2)
  function fmOn() { return T.pr.fmo === 2 || (T.pr.fmo === 1 && T.pr.lvl !== 0); }
  function fmHTML(xi) {
    var f = fmOn() ? focusOf(xi) : null;
    if (!f) return '';
    var x = LIVE.x[xi], m = f.bw ? 'reps' : fmFor(x.e), u = T.pr.u, d, txt, say;
    var arrow = function (v, s) { return v > 0 ? '\u25b2' + s : v < 0 ? '\u25bc' + s : '='; };
    if (m === 'vc') {
      if (!(f.was.vol > 0)) return '';
      d = Math.round((f.cur.vol / f.was.vol - 1) * 100);
      txt = d ? arrow(d, Math.abs(d) + '%') : 'level';
      say = 'Total lifted ' + (d > 0 ? d + '% up' : d < 0 ? -d + '% down' : 'level');
    } else if (m === 'vol') {
      d = Math.round(f.cur.vol - f.was.vol);
      txt = fmtBig(f.cur.vol) + ' ' + u + ' ' + arrow(d, fmtBig(Math.abs(d)));
      say = 'Total lifted ' + fmtBig(f.cur.vol) + ' ' + u + ', ' + (d > 0 ? fmtBig(d) + ' more' : d < 0 ? fmtBig(-d) + ' less' : 'the same');
    } else if (m === 'reps') {
      d = f.cur.reps - f.was.reps;
      txt = f.cur.reps + ' reps ' + arrow(d, Math.abs(d));
      say = f.cur.reps + ' reps, ' + (d > 0 ? d + ' more' : d < 0 ? -d + ' fewer' : 'the same');
    } else {
      d = Math.round(f.cur.best) - Math.round(f.was.best);
      txt = 'Est. max ' + fmtN(Math.round(f.cur.best)) + ' ' + arrow(d, Math.abs(d));
      say = 'Best set, estimated max ' + fmtN(Math.round(f.cur.best)) + ' ' + u + ', ' + (d > 0 ? d + ' up' : d < 0 ? -d + ' down' : 'the same');
    }
    var cls = 'tr-fm ' + (d > 0 ? 'up' : d < 0 ? 'dn' : 'eq');
    var vs = ' <small>vs ' + (f.plan ? 'plan' : 'last') + '</small>';
    say += ' against ' + (f.plan ? 'the plan' : 'last time');
    // a bodyweight lift has only its reps to show, so there is nothing to tap through
    if (f.bw) return '<span class="' + cls + '" role="img" aria-label="' + esc(say) + '">' + esc(txt) + vs + '</span>';
    var next = FM[(FM.indexOf(m) + 1) % FM.length];
    return '<button class="' + cls + '" data-t="fmcyc" data-x="' + xi + '" aria-label="' + esc(say + '. Show ' + FM_SAY[next] + ' instead') + '">' + esc(txt) + vs + '</button>';
  }
  function fmRefresh() {
    if (!LIVE) return;
    LIVE.x.forEach(function (x, i) { var c = $('trfm-' + i); if (c) c.innerHTML = fmHTML(i); });
  }

  /* Typing a weight moves the plates at once, the greyed weight of the sets
     after it, and the greyed reps of every set whose weight is now yours,
     without redrawing the box being typed in. */
  function plRefresh(xi) {
    var x = LIVE && LIVE.x[xi];
    if (!x) return;
    var bar = onBar(lib(x.e)), lf = lowFirst(xi);
    x.s.forEach(function (s, j) {
      var c = $('trpl-' + xi + '-' + j), w = $('trw-' + xi + '-' + j), r = $('trr-' + xi + '-' + j), lo = $('trlo-' + xi + '-' + j);
      var g = ghost(xi, j);
      if (bar && c) c.innerHTML = (c.classList.contains('tr-plt') ? plShown(c) : plRow(xi, j)) ? plCell(xi, j) : prevText(s, x.e);
      if (bar && w && document.activeElement !== w) w.placeholder = g.w !== null ? fmtN(g.w) : '';
      if (r && document.activeElement !== r) r.placeholder = repsPh(x, s, g);
      if (lo) lo.textContent = j === lf.j ? lf.t : '';
    });
  }
  /* The note once, under the first set it applies to: the same sentence
     under every set of a lift said nothing the first had not. */
  function lowFirst(xi) {
    var x = LIVE.x[xi];
    for (var j = 0; j < x.s.length; j++) {
      var t = lowNote(x, x.s[j], ghost(xi, j));
      if (t) return { j: j, t: t };
    }
    return { j: -1, t: '' };
  }
  // what an empty reps box shows: the plan's, the last set's, or the estimate at your weight
  function repsPh(x, s, g) {
    var rr = lib(x.e).rr;
    return s.ty === 'm' ? '0' : g.r !== null ? String(g.r) + (s.am ? '+' : '') : rr[0] + '\u2013' + rr[1];
  }
  /* A weight heavy enough to leave a set under five reps, said under the set
     while there is still time to change it. Blake (2026-09-28): "build both
     as long as the app is being truly helpful as I progress toward a goal."
     So only where the goal is growth, which is where the plan asks for reps
     to spare; not where the plan itself wrote under five, as a top set may;
     and not once the set is done. The claim is the one this app's Review
     makes of the whole week (Schoenfeld et al. 2017): between 5 and 30 reps
     load barely matters to growth, outside it the evidence is thinner. */
  function lowNote(x, s, g) {
    if (!fin(x.rir) || s.t || s.wu || s.am || s.ty === 'd' || s.ty === 'm') return '';
    var plan = fin(s.tr) ? s.tr : fin(s.pr) ? s.pr : null;
    if (plan === null || plan < 5) return '';
    var r = numIn(s.r);
    if (r === null) r = g.r;
    if (r === null || r >= 5) return '';
    return (numIn(s.r) === null ? 'About ' + r + ' rep' + (r === 1 ? '' : 's') + ' at this weight: under 5' : 'Under 5 reps') +
      ', below the 5\u201330 range the growth research backs. A little lighter is the surer bet.';
  }

  function exCard(x, i, label, mv) {
    var ex = lib(x.e);
    var rq = !!T.pr.rq;
    var pl = onBar(ex) ? T.pr.pl : 'off';
    var nx = nextSet(x);
    var note = noteOf(x.e);
    var mate = label ? LIVE.x[partner(i)] : null;
    var cue = backCue(ex);
    var num = 0, bodyOn = onBody(x.e), lf = lowFirst(i);
    var rows = x.s.map(function (s, j) {
      var g = ghost(i, j);
      var ph = bodyOn && !(g.w > 0) ? 'BW' : g.w !== null ? fmtN(g.w) : '';
      var rph = repsPh(x, s, g);
      var prev = prevText(s, x.e), on = pl === 'type' && j === nx;
      // in every set: the plates where the loading changes, and on the next set to do; last time elsewhere
      var stack = pl === 'row' ? plRow(i, j) : on;
      var flash = S.flash === i + ':' + j;
      // warm-ups, drop sets and failure sets are lettered, working sets numbered, the all-out set marked
      var lab = setLab(s, function () { return ++num; });
      return '<div class="tr-set' + (s.t ? ' done' : '') + (flash ? ' flash' : '') + (s.am ? ' tr-am' : '') + (s.wu ? ' tr-wu' : '') +
          (s.ty === 'd' ? ' tr-dd' : s.ty === 'f' ? ' tr-ff' : s.ty === 'm' ? ' tr-mm' : '') + '">' +
        '<button class="tr-sn tr-snb" data-t="sty" data-x="' + i + '" data-s="' + j + '" aria-label="' + esc(setSay(s) + ', set ' + (j + 1) + '. Change what kind of set it is') + '">' + lab + '</button>' +
        (pl !== 'off' ? '<span class="tr-prev tr-prev-pl' + (pl === 'type' ? ' tr-plt' : '') + (on ? ' on' : '') + '" id="trpl-' + i + '-' + j + '"' + (on ? ' data-next="1"' : '') + '>' +
            (stack ? plCell(i, j) : prev) + '</span>'
          : '<span class="tr-prev">' + prev + '</span>') +
        '<input class="tr-in" id="trw-' + i + '-' + j + '" data-in="w" data-x="' + i + '" data-s="' + j + '" ' +
          'inputmode="decimal" autocomplete="off" placeholder="' + esc(ph) + '" value="' + esc(s.w) + '" ' +
          'aria-label="Set ' + (j + 1) + (bodyOn ? ' weight added, in ' + T.pr.u + '; empty for your body alone' : ' weight in ' + T.pr.u) + '">' +
        '<input class="tr-in" id="trr-' + i + '-' + j + '" data-in="r" data-x="' + i + '" data-s="' + j + '" ' +
          'inputmode="numeric" autocomplete="off" placeholder="' + esc(rph) + '" value="' + esc(s.r) + '" ' +
          'aria-label="Set ' + (j + 1) + ' reps">' +
        (rq ? rqSel(s.q, 'data-in="q" data-x="' + i + '" data-s="' + j + '"', 'Set ' + (j + 1) + ' reps to spare') : '') +
        '<button class="tr-tick" data-t="tick" data-x="' + i + '" data-s="' + j + '" aria-pressed="' + !!s.t + '" ' +
          'aria-label="' + (s.t ? 'Undo set ' : 'Done with set ') + (j + 1) + '">✓</button>' +
      '</div>' +
      (S.need && S.need.k === i + ':' + j ? '<div class="tr-need" id="trneed" role="alert">' +
        (S.need.w ? 'Type the weight you used (0 if none), then tick.' : 'Type how many reps you did, then tick.') + '</div>' : '') +
      // always drawn, empty unless a weight leaves the set under five reps; typing fills it
      '<div class="tr-lo" id="trlo-' + i + '-' + j + '" aria-live="polite">' + (j === lf.j ? esc(lf.t) : '') + '</div>' +
      /* The rest that follows this set, between it and the next, the way
         Strong draws it — only where it is not the lift's own rest, which the
         line under the name already says: a minute after a warm-up, none
         before a drop set. A pair says its rest once, under the name. Tap it
         to change the lift's rest. */
      // a circuit's next set on this machine is a round away: its rests are said under the name
      (j < x.s.length - 1 && !x.cc && (x.s[j + 1].ty === 'd' || (!mate && restAfter(i, j) !== x.rest)) ? '<div class="tr-rdiv"><button class="tr-rdiv-b" data-t="restpick" data-e="' + esc(x.e) + '" aria-label="Rest after this set: ' +
        (x.s[j + 1].ty === 'd' ? 'none, a drop set follows' : clock(restAfter(i, j))) + '. Change the rest for ' + esc(ex.n) + '">' +
        (x.s[j + 1].ty === 'd' ? 'no rest' : clock(restAfter(i, j))) + '</button></div>' : '');
    }).join('');
    // nothing ticked yet on this lift: the notes for before the first set
    var fresh = !x.s.some(function (s) { return s.t; });
    // someone new: plain words where the numbers need them
    var nb = T.pr.lvl === 0, nWork = x.s.filter(counts).length;
    var wy = whyW(x);
    var ms = LIVE.ms ? T.ms[LIVE.ms] : null;
    // the reps in reserve when they are not the day's, which the header says
    var rirHere = x.rir !== null && x.rir !== undefined && !(ms && x.rir === LIVE.rir);
    // the bar when it is not the usual one
    var barHere = onBar(ex) && (barSet(x.e) || barAt(x.e) !== T.pr.bar);
    var first = fresh && (nb || newLift(x.e));
    var armed = S.arm === 'rm:' + i, nDone = x.s.filter(function (z) { return z.t; }).length;
    return '<div class="tr-card tr-ex' + (label ? ' tr-paired' : '') + (rq ? ' tr-rq' : '') + '" data-xi="' + i + '">' +
      /* Hold it and every card folds to its name, to be dragged where it
         goes, the way Strong does it; the arrow keys move it a place. */
      (mv ? '<button class="tr-grip" data-x="' + i + '" aria-label="Move ' + esc(ex.n) + (label && !x.cc ? ' and its pair' : '') +
        ': hold and drag, or use the arrow keys">' + EA_ICO.grip + '</button>' : '') +
      '<div class="tr-ex-h">' +
        (label ? '<span class="tr-pair" aria-label="' + (x.cc ? 'Station ' : 'Pair ') + label + '">' + label + '</span>' : '') +
        // new to lifting, the name opens how it is done
        '<button class="tr-ex-n" data-t="' + (nb ? 'exhow' : 'exsheet') + '" data-e="' + esc(x.e) + '">' + esc(ex.n) + '</button>' +
        '<span class="tr-fmw" id="trfm-' + i + '">' + fmHTML(i) + '</span>' +
        '<span class="tr-ex-m">' + esc(mnameP(ex.m)) + ' \u00b7 ' + (x.fix ? 'main lift, set by set'
            : (nb ? nWork + ' set' + (nWork === 1 ? '' : 's') + ' of ' : '') + ex.rr[0] + '\u2013' + ex.rr[1] + ' reps') +
          (rirHere ? ' \u00b7 ' + (nb ? (x.rir ? 'stop with ' + x.rir + ' rep' + (x.rir === 1 ? '' : 's') + ' to spare' : 'to your last good rep') : effSay(x.rir)) : '') +
          (x.cc && LIVE.cc ? ccSay(i)
            : mate ? ' \u00b7 alternate with ' + esc(lib(mate.e).n) + ', ' + clock(T.pr.rp) + ' between'
            : ' \u00b7 <button class="tr-lnk tr-barl" data-t="restpick" data-e="' + esc(x.e) + '" aria-label="Rest ' + clock(x.rest) + ' for ' + esc(ex.n) + '. Change">rest ' + clock(x.rest) + '</button>') +
          (fin(x.tm) ? ' \u00b7 training max ' + fmtN(x.tm) + ' ' + T.pr.u : '') +
          (barHere ? ' \u00b7 <button class="tr-lnk tr-barl" data-t="barpick" data-e="' + esc(x.e) + '" aria-label="' + esc(barName(x.e)) + ' for ' + esc(ex.n) + ': ' +
            fmtN(barAt(x.e)) + ' ' + T.pr.u + '. Change">' + esc(barLabelAt(x.e)) + '</button>' : '') +
          (nb || newLift(x.e) ? ' \u00b7 <button class="tr-lnk tr-barl" data-t="exhow" data-e="' + esc(x.e) + '">how to</button>' : '') + '</span>' +
        (x.s.some(function (s) { return s.am; }) ? '<span class="tr-cue">Last set: as many good reps as you can \u2014 stop when one slows to a grind. It sets your next wave\u2019s weights.</span>' : '') +
        (x.s.some(function (s) { return s.wu; }) ? '<span class="tr-ex-m">W is a warm-up: done, not counted, and a short rest after it.</span>' : '') +
        (cue ? '<span class="tr-cue">' + esc(cue) + '</span>' : '') +
        (x.swn ? '<span class="tr-ex-m">' + esc(x.swn) + '</span>' : '') +
        (ASST[x.e] ? '<span class="tr-ex-m">Type the machine\u2019s help as the weight: less help is progress.</span>' : '') +
        homeNote(x, i) +
        (fresh ? efNote(x, i) : '') +
        (wy && fresh ? '<span class="tr-ex-m">' + esc(wy) + '</span>' : '') +
        (first && SAFETY[x.e] ? '<div class="tr-first tr-safe"><b>Safety first.</b> ' + esc(SAFETY[x.e]) + '</div>' : '') +
        firstTime(x) +
        (note ? '<button class="tr-exnt" data-t="note" data-e="' + esc(x.e) + '" aria-label="Your note on ' + esc(ex.n) + ': ' + esc(note) + '. Edit">' +
          '<span class="tr-exnt-l">Note</span> ' + esc(note) + '</button>' : '') +
      '</div>' +
      healHTML(i) +
      '<div class="tr-set tr-set-h" aria-hidden="true"><span>Set</span><span>' + (nb ? 'Last time' : 'Previous') + '</span><span>' + (bodyOn ? '+' : '') + T.pr.u + '</span><span>Reps</span>' +
        (rq ? (rpeOn() ? '<span title="Rate of perceived exertion">RPE</span>' : '<span title="Reps to spare: how many more you could have done">Spare</span>') : '') + '<span></span></div>' +
      rows +
      /* One row, each with its picture and its word: another set first and
         dark, as the thing done most, and Remove, the one that takes
         something away, last and red. */
      '<div class="tr-ex-a">' +
        '<button class="tr-ea tr-ea-add" data-t="addset" data-x="' + i + '" aria-label="Add a set of ' + esc(ex.n) + '">' + EA_ICO.plus + '<span>Set</span></button>' +
        (x.s.length > 1 ? eaBtn('dropset', 'minus', 'Set', ' data-x="' + i + '"', 'Take off the last set') : '') +
        (ex.k === 'c' && ex.q !== 'bw' ? eaBtn('warm', 'warm', 'Warm-up', ' data-x="' + i + '"', 'Add warm-up sets') : '') +
        (onBar(ex) ? eaBtn('plates', 'plates', 'Plates', ' data-x="' + i + '"', 'What plates to load') : '') +
        eaBtn('swap', 'swap', 'Swap', ' data-x="' + i + '"', 'Swap ' + ex.n + ' for another exercise') +
        (note ? '' : eaBtn('note', 'note', 'Note', ' data-e="' + esc(x.e) + '"', 'Add a note to ' + ex.n)) +
        '<button class="tr-ea tr-ea-rm' + (armed ? ' tr-lnk-arm' : '') + '" data-t="rmex" data-x="' + i + '">' + EA_ICO.rm +
          '<span>' + (armed ? 'Tap again: remove it and its ' + nDone + ' done set' + (nDone === 1 ? '' : 's') : 'Remove') + '</span></button>' +
      '</div>' +
    '</div>';
  }

  /* How a muscle healed since you last trained it, asked at its first
     exercise rather than all together before the first set: a line when
     last time's answer stands, the three answers when it doesn't, or when
     the line is tapped. */
  function healHTML(i) {
    var m = musOf(LIVE.x[i].e);
    if (!firstOfMuscle(i) || soreAsk().indexOf(m) < 0) return '';
    var now = srNow(m), open = LIVE.sro && LIVE.sro[m];
    if (now && !open) {
      var say = mname(m) + ' ' + SORE_W[now.v];
      return '<button class="tr-heal" data-t="healopen" data-m="' + m + '" aria-label="' + esc(say + (now.pre ? ', as last time' : '') + '. Change') + '">' +
        '<span class="tr-heal-s">' + esc(say) + (now.pre ? '<span class="tr-heal-p"> \u00b7 as last time</span>' : '') + '</span>' +
        '<span class="tr-heal-e">Change</span></button>';
    }
    return healQ(m, now ? now.v : -1);
  }
  function healQ(m, cur) {
    return '<div class="tr-heal-q">' + segQ(esc(mname(m)) + ' since last time' + (repsMoved(m) && !fin(LIVE.sr[m]) ? ' \u2014 your reps are well off today' : ''),
      'sore', cur < 0 ? '' : cur, SORE.map(function (t, k) { return [k, t]; }), ' data-m="' + m + '"') + '</div>';
  }

  /* One set of small pictures for the card's buttons, drawn in the text's
     own colour, so they read at any size and in either theme. */
  function eaSvg(d) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="' + d +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var EA_ICO = {
    plus: eaSvg('M12 5v14M5 12h14'),
    grip: eaSvg('M5 8h14M5 12h14M5 16h14'),
    minus: eaSvg('M5 12h14'),
    warm: eaSvg('M12 3c.8 3.2 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1.1-3.6 2.3-4.6.1 1.8.9 3 2.2 3.1C12 8 11.2 6 12 3z'),
    plates: eaSvg('M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4z'),
    swap: eaSvg('M7 7h12l-3.5-3.5M17 17H5l3.5 3.5'),
    note: eaSvg('M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 7.5l2 2'),
    rm: eaSvg('M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6')
  };
  function eaBtn(t, ico, word, attrs, label) {
    return '<button class="tr-ea" data-t="' + t + '"' + attrs + ' aria-label="' + esc(label) + '">' + EA_ICO[ico] + '<span>' + esc(word) + '</span></button>';
  }

  /* Starting out, the weight asked for comes with its reason: a number
     that changes with no word of why reads as the app guessing. */
  function whyW(x) {
    if (T.pr.lvl !== 0 || x.fix || !LIVE || (x.ef && x.ef.on)) return '';
    var s = x.s.filter(function (z) { return !z.wu; })[0];
    if (!s || !fin(s.tw) || !fin(s.pw)) return '';
    if (LIVE.dl) return 'Lighter this week on purpose: an easy week lets your body catch up.';
    var d = s.tw - s.pw;
    if (ASST[x.e] && d < 0) return fmtN(-d) + ' ' + T.pr.u + ' less help \u2014 you hit the top of the range last time.';
    if (d > 0 && !ASST[x.e]) return 'Up ' + fmtN(d) + ' ' + T.pr.u + ' \u2014 you hit the top of the range last time.';
    if (d === 0 && fin(s.tr) && fin(s.pr) && s.tr > s.pr) return (s.tw > 0 ? 'Same weight \u2014 aim' : 'Aim') + ' for ' + s.tr + ' reps, one more than last time.';
    return '';
  }

  /* When your logged effort moved today's weight: by how much, and why,
     in a line, with the usual step a tap away and back again. */
  function efNote(x, i) {
    var f = x.ef;
    if (!f || !Array.isArray(f.a0) || !Array.isArray(f.a1) || !f.a0[0] || !f.a1[0]) return '';
    var n = f.a1[0], o = f.a0[0], u = T.pr.u;
    var what = function (v) { return fmtN(v[0]) + ' ' + u + (fin(v[1]) ? ' \u00d7 ' + v[1] : ''); };
    if (!f.on) {
      return '<span class="tr-ex-m tr-efn">Usual step: ' + esc(what(o)) + '. ' +
        '<button class="tr-lnk" data-t="efset" data-x="' + i + '">Use ' + esc(what(n)) + '</button></span>';
    }
    var head = n[0] > o[0] ? 'Up ' + fmtN(n[0] - o[0]) + ' ' + u : n[0] < o[0] ? 'Down ' + fmtN(o[0] - n[0]) + ' ' + u
      : 'Same ' + fmtN(n[0]) + ' ' + u + ', ' + n[1] + ' reps';
    return '<span class="tr-ex-m tr-efn">' + esc(head + ': last time was ' + rqSay(f.q) + ', the plan asked ' + rqSay(f.a) + '.') + ' ' +
      '<button class="tr-lnk" data-t="efset" data-x="' + i + '" aria-label="Undo: back to the usual step, ' + esc(what(o)) + '">Undo</button></span>';
  }

  // at home, a suggested weight your plates cannot make, and what it became
  function homeNote(x, i) {
    if (!homeNow() || !onBar(lib(x.e)) || SLED[x.e]) return '';
    for (var j = 0; j < x.s.length; j++) {
      var s = x.s[j];
      if (s.t || s.wu || String(s.w).trim() !== '') continue;
      var want = fin(s.tw) ? s.tw : fin(s.pw) ? s.pw : null, got = ghost(i, j).w;
      if (want === null || !fin(got) || Math.abs(got - want) < 1e-9) return '';
      return '<span class="tr-ex-m tr-homenote">At home: ' + fmtN(got) + ' ' + T.pr.u + ', the nearest your plates make' +
        (fin(s.tw) ? ' (the plan says ' + fmtN(want) + ')' : ' (last time ' + fmtN(want) + ')') +
        (got >= homeMax() - 1e-9 && got < want ? '. That\u2019s the most you can load at home.' : '.') + '</span>';
    }
    return '';
  }

  /* What kind of set, in a letter and in words. */
  function setLab(s, n) {
    return s.wu ? 'W' : s.ty === 'd' ? 'D' : s.ty === 'f' ? 'F' : s.ty === 'm' ? 'M' : String(n()) + (s.am ? '+' : '');
  }
  function setTag(s) {
    return s.wu ? '<span class="tr-tag w">W</span>' : s.ty === 'd' ? '<span class="tr-tag d">D</span>' : s.ty === 'f' ? '<span class="tr-tag f">F</span>' :
      s.ty === 'm' ? '<span class="tr-tag m">M</span>' : '';
  }
  function setSay(s) {
    return s.wu ? 'Warm-up' : s.ty === 'd' ? 'Drop set' : s.ty === 'f' ? 'To failure' : s.ty === 'm' ? 'Missed' : s.am ? 'As many good reps as you can' : 'Working set';
  }
  var STY = [['', 'Working set'], ['w', 'Warm-up'], ['d', 'Drop set'], ['f', 'To failure'], ['m', 'Missed']];
  function styHTML(sh) {
    var x = LIVE && LIVE.x[sh.x], s = x && x.s[sh.s];
    if (!s) return '';
    var cur = s.wu ? 'w' : s.ty || '';
    return '<h2 class="sheet-name tr-sn2">Set ' + (sh.s + 1) + ' of ' + esc(lib(x.e).n) + '</h2>' +
      '<div class="tr-q">' + chips('styset', cur, STY) + '</div>' +
      '<ul class="tr-fits tr-styl">' +
        '<li><b>Warm-up</b>: lighter, on the way up. Not a hard set, never a record, and a minute\u2019s rest after it.</li>' +
        '<li><b>Drop set</b>: straight after the set before it, lighter, no rest between.</li>' +
        '<li><b>To failure</b>: the last rep you could do. Counted as a hard set with nothing in reserve.</li>' +
        '<li><b>Missed</b>: an attempt that didn\u2019t go up. The weight is kept, with the reps you got (0 if none); never a record, never counted, never a target.</li></ul>' +
      (x.s.length > 1 ? '<div class="tr-acts"><button class="ghost danger" data-t="styrm">Remove this set</button></div>' : '');
  }

  /* Reps in reserve for one set: blank until you say. Five means five or
     more — past that, nobody can tell. */
  var RQ_RIR = [['', '\u2013'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5+']];
  // RPE by its usual half steps; the value kept is still reps in reserve
  var RQ_RPE = [['', '\u2013'], ['0', '10'], ['0.5', '9.5'], ['1', '9'], ['1.5', '8.5'], ['2', '8'], ['2.5', '7.5'], ['3', '7'], ['4', '6'], ['5', '\u22645']];
  function rqSel(cur, attrs, label) {
    var c = cur === '' || cur === null || cur === undefined ? '' : String(cur);
    var opts = (rpeOn() ? RQ_RPE : RQ_RIR).slice();
    // a value logged on the other scale is kept, and shown as itself
    if (c && !opts.some(function (o) { return o[0] === c; }) && fin(Number(c))) opts.push([c, rpeOn() ? fmtN(10 - Number(c)) : fmtN(Number(c))]);
    if (rpeOn()) label = label.replace('reps to spare', 'RPE');
    return '<select class="tr-in tr-rqs" ' + attrs + ' aria-label="' + esc(label) + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (c === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>';
  }

  /* Keeping asks two questions, not three: a pump is how RP judges whether a
     muscle got enough to grow, and growing is not the job. Nor is it for the
     muscles an emphasis block is only holding. */
  function noPump(m) {
    return !!LIVE.keep || (Array.isArray(LIVE.fx) && LIVE.fx.length > 0 && LIVE.fx.indexOf(m) < 0);
  }
  /* One question, its label above and its answers as a row of equal
     buttons below — beside the label, a long answer wrapped under it and
     knocked the row out of line. Four answers go two by two on a phone. */
  function segQ(label, t, cur, opts, extra) {
    return '<div class="tr-sq"><div class="tr-sq-l tr-fbm">' + label + '</div>' +
      '<div class="tr-sq-g' + (opts.length === 4 ? ' four' : '') + '" style="--n:' + opts.length + '" role="group">' +
      opts.map(function (o) {
        return '<button class="tr-sqb" data-t="' + t + '" data-v="' + esc(o[0]) + '"' + (extra || '') +
          ' aria-pressed="' + (cur !== '' && String(cur) === String(o[0])) + '">' + esc(o[1]) + '</button>';
      }).join('') + '</div></div>';
  }

  /* Every question this muscle is asked, answered. */
  function fbDone(m) {
    var f = fbAll(m).v;
    return (noPump(m) || fin(f.p)) && fin(f.k) && fin(f.j) && !healNeed(m);
  }
  /* Whether a set of something else has been ticked since this muscle's
     last one: you have moved on, and the card should get out of the way.
     The other half of a pair does not count — its last set is the rest
     you answer the card in. */
  function movedOn(m) {
    var last = 0, later = false, pairs = {};
    LIVE.x.forEach(function (x) {
      if (musOf(x.e) !== m) return;
      if (x.p) pairs[x.p] = 1;
      x.s.forEach(function (s) { if (s.t > last) last = s.t; });
    });
    LIVE.x.forEach(function (x) {
      if (musOf(x.e) === m || (x.p && pairs[x.p])) return;
      x.s.forEach(function (s) { if (s.t > last) later = true; });
    });
    return later;
  }
  var JOINT_W = ['fine', 'a little sore', 'hurting'];
  // "A lot" is not a rating to file away: it is a reason to stop
  var HURT_NOTE = '<div class="tr-note tr-warn">Stop anything that hurts for today \u2014 Swap it or Remove it. Sharp pain, swelling, or pain still there tomorrow is one for a doctor or physiotherapist, not for this app.</div>';
  /* The card, or once it is answered — or you have moved on to something
     else, or put it away — a line saying what you said, which opens it again
     with a tap. Anything left unanswered is asked again at Finish. */
  function fbCard(m) {
    var all = fbAll(m), f = all.v;
    var open = LIVE.fbo && LIVE.fbo[m];
    var hid = LIVE.fbh && LIVE.fbh[m];
    var jl = T.pr.bk ? 'Back &amp; joints' : 'Joints';
    if (!open && (hid || fbDone(m) || movedOn(m))) {
      var said = [];
      if (!noPump(m) && fin(f.p)) said.push(PUMP_W[f.p]);
      if (fin(f.k)) said.push(WORK_W[f.k]);
      if (fin(f.j)) said.push((T.pr.bk ? 'back & joints ' : 'joints ') + JOINT_W[f.j]);
      // last time's answers, standing: said as that, so a line nobody tapped doesn't read as one somebody did
      var pre = Object.keys(all.pre).length > 0;
      return '<button class="tr-card tr-ask tr-fbt" data-t="fbopen" data-m="' + m + '">' +
        '<span class="tr-fbt-n">' + esc(mname(m)) + '</span>' +
        '<span class="tr-fbt-s">' + esc(said.length ? said.join(' \u00b7 ') + (pre ? ' \u00b7 as last time' : '') : 'not rated yet') + '</span>' +
        '<span class="tr-fbt-e">' + (said.length ? (pre ? 'Change' : 'Edit') : 'Rate') + '</span></button>' + (f.j === 2 ? HURT_NOTE : '');
    }
    return '<div class="tr-card tr-ask tr-fbc"><div class="tr-fbc-h"><span class="tr-ql">' + esc(mname(m)) + ' done \u2014 how was it?</span>' +
        '<button class="tr-lnk" data-t="fbhide" data-m="' + m + '">Hide</button></div>' +
      // the healing, when it still has no answer: the reps moved, or it was never said
      (healNeed(m) ? segQ('Since last time', 'sore', '', SORE.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '"') : '') +
      (noPump(m) ? '' : segQ('Pump', 'fb', fin(f.p) ? f.p : '', PUMP.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '" data-f="p"')) +
      segQ('Workload', 'fb', fin(f.k) ? f.k : '', WORK.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '" data-f="k"') +
      segQ(jl, 'fb', fin(f.j) ? f.j : '', JOINT.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '" data-f="j"') +
      (f.j === 2 ? HURT_NOTE : '') +
    '</div>';
  }

  /* ------------------------------------------------------------- history */
  /* History two ways. By block — the mesocycle, the way RP's app plans and
     keeps one: each with its name, its dates and how it went, and inside it
     everything it held. Or every workout in a row, newest first, which is
     how it always read. */
  function historyHTML() {
    var blocks = blockList();
    if (!blocks.length) return workoutsHTML();
    var hv = S.hv === 'wo' ? 'wo' : 'blk';
    var seg = '<div class="seg tr-hseg" role="group" aria-label="History by">' +
      [['blk', 'Blocks'], ['wo', 'Workouts']].map(function (o) {
        return '<button data-t="hview" data-v="' + o[0] + '" aria-pressed="' + (hv === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    if (hv === 'wo') return seg + workoutsHTML();
    var open = S.hb && T.ms[S.hb];
    return seg + (open ? blockPastHTML(open) : blocksHTML(blocks));
  }

  /* Every block you have run, the current one first, then newest first. A
     block begun and dropped before a single session is not one. */
  function blockList() {
    var has = {};
    ix().list.forEach(function (wo) { if (wo.ms) has[wo.ms] = 1; });
    return Object.keys(T.ms).map(function (k) { return T.ms[k]; }).filter(function (ms) {
      return ms && ms.id && Array.isArray(ms.days) && ms.days.length && (ms.id === T.act || has[ms.id]);
    }).sort(function (a, b) {
      if (a.id === T.act) return -1;
      if (b.id === T.act) return 1;
      return (b.at || 0) - (a.at || 0);
    });
  }

  /* What a block came to, in the numbers its row and its page both read. */
  function blockFacts(ms) {
    var wos = ix().list.filter(function (wo) { return wo.ms === ms.id; }).sort(function (a, b) { return a.st - b.st; });
    var sk = Array.isArray(ms.sk) ? ms.sk : [];
    var W = weeksOf(ms), tot = W * ms.days.length, done = 0, gone = 0, lastW = -1;
    for (var w = 0; w < W; w++) {
      for (var d = 0; d < ms.days.length; d++) {
        if (slotDone(ms, w, d)) { done++; lastW = Math.max(lastW, w); } else if (sk.indexOf(w + ':' + d) >= 0) gone++;
      }
    }
    var nx = nextSlot(ms), prs = 0, time = 0, sets = 0, vol = 0;
    wos.forEach(function (wo) {
      prs += prsIn(wo).length;
      time += Math.max(0, (wo.en || wo.st) - wo.st);
      wo.x.forEach(function (x) { sets += x.s.filter(counts).length; });
      vol += volOf(wo);
    });
    return {
      wos: wos, done: done, gone: gone, tot: tot, nx: nx, lastW: lastW, prs: prs, time: time, sets: sets, vol: vol,
      status: ms.id === T.act ? 'now' : !nx ? 'done' : 'ended',
      from: wos.length ? wos[0].st : ms.at || 0, to: wos.length ? wos[wos.length - 1].st : 0
    };
  }
  function blockStatus(ms, f) {
    return f.status === 'now' ? (f.nx ? 'Current · ' + wkName(ms, f.nx.w) : 'Current · every session done')
      : f.status === 'done' ? 'Finished' : 'Ended in week ' + Math.max(1, f.lastW + 1);
  }
  function spanSay(a, b) {
    if (!a) return '';
    if (!b || dayKey(new Date(a)) === dayKey(new Date(b))) return shortDate(a);
    return shortDate(a) + ' – ' + shortDate(b);
  }
  // what kind of block it was, in a line
  function blockKind(ms) {
    var P = PROGS[ms.prog];
    return [P ? P.n : '', weeksOf(ms) + ' weeks × ' + ms.days.length + ' days', KITS[ms.kit] ? KITS[ms.kit].n : '']
      .filter(Boolean).join(' · ');
  }

  /* What each lift did over the block: its estimated max at the first
     session against the last, and the records set on the way. Deload weeks
     are left out of the change, as the block's own summary does. */
  function blockLifts(wos) {
    var lifts = {}, order = [];
    wos.forEach(function (w) {
      prsIn(w).forEach(function (r) {
        var l0 = lifts[r.e] = lifts[r.e] || { e: r.e, a: 0, b: 0, prs: 0 };
        if (order.indexOf(r.e) < 0) order.push(r.e);
        l0.prs++;
      });
      if (w.dl) return;
      w.x.forEach(function (x) {
        var v = liftE1(x, w);
        if (!(v > 0)) return;
        var l = lifts[x.e] = lifts[x.e] || { e: x.e, a: 0, b: 0, prs: 0 };
        if (order.indexOf(x.e) < 0) order.push(x.e);
        if (!l.a) l.a = v;
        l.b = v;
      });
    });
    return order.map(function (e) {
      var l = lifts[e];
      l.ch = l.a > 0 ? l.b / l.a - 1 : 0;
      return l;
    }).sort(function (x, y) { return (y.prs - x.prs) || (Math.abs(y.ch) - Math.abs(x.ch)); });
  }

  /* Hard sets per muscle, week by week — RP's own way of looking back at a
     mesocycle: did the volume climb the way it was meant to. */
  function blockVolume(ms, wos) {
    var W = weeksOf(ms), rows = {};
    wos.forEach(function (wo) {
      if (!(wo.w >= 0 && wo.w < W)) return;
      wo.x.forEach(function (x) {
        var m = musOf(x.e), n = x.s.filter(counts).length;
        if (!n || !MUS[m]) return;
        var r = rows[m] = rows[m] || [];
        for (var i = r.length; i < W; i++) r.push(0);
        r[wo.w] += n;
      });
    });
    return MUSCLES.filter(function (m) { return rows[m.k]; }).map(function (m) {
      return { n: m.n, wk: rows[m.k], mrv: m.mrv };
    });
  }

  function blocksHTML(blocks) {
    return '<div class="tr-blist">' + blocks.map(function (ms) {
      var f = blockFacts(ms);
      var up = blockLifts(f.wos).filter(function (l) { return l.ch > 0.005; })
        .sort(function (a, b) { return b.ch - a.ch; })[0];
      var pct = f.tot ? Math.round((f.done + f.gone) / f.tot * 100) : 0;
      return '<button class="tr-card tr-brow" data-t="hbopen" data-id="' + esc(ms.id) + '">' +
        '<span class="tr-h-top"><span class="tr-h-n">' + esc(ms.n) + '</span>' +
          '<span class="tr-btag tr-btag-' + f.status + '">' + esc(blockStatus(ms, f).split(' · ')[0]) + '</span></span>' +
        '<span class="tr-h-meta">' + esc([spanSay(f.from, f.to), weeksOf(ms) + ' weeks × ' + ms.days.length + ' days'].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="tr-cbar tr-bbar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        '<span class="tr-h-meta">' + f.done + ' of ' + f.tot + ' sessions' +
          (f.prs ? ' · <span class="tr-pr">🥇 ' + f.prs + ' record' + (f.prs === 1 ? '' : 's') + '</span>' : '') + '</span>' +
        /* The lift that rose most, on a line of its own. Tacked on the end of
           the sessions line it wrapped wherever the width ran out, "+33%"
           alone under "Leg Extension". */
        (up ? '<span class="tr-h-meta tr-bup">' + esc(lib(up.e).n) + '\u00a0<span class="tr-up">+' + Math.round(up.ch * 100) + '%</span></span>' : '') +
      '</button>';
    }).join('') + '</div>';
  }

  /* One block, everything it held: its calendar (tap a box for that
     session), what it came to, what the lifts did, the volume week by week,
     what you did outside the gym while it ran, and your notes on it. */
  function blockPastHTML(ms) {
    var f = blockFacts(ms), nx = f.status === 'now' ? f.nx : null;
    var sel = S.hbSel && S.hbSel.ms === ms.id ? S.hbSel : null;
    var bw0 = f.wos.length ? woBw(f.wos[0]) : null, bw1 = f.wos.length ? woBw(f.wos[f.wos.length - 1]) : null;
    var bwU = f.wos.length ? f.wos[0].u : T.pr.u;
    var name = S.hbRen === ms.id
      ? '<div class="tr-hbren"><label class="sr-only" for="trBlkName">Name of this block</label>' +
          '<input class="txt tr-hbname" id="trBlkName" maxlength="60" autocomplete="off" value="' + esc(ms.n) + '">' +
          '<button class="btn-primary" data-t="hbrensave" data-id="' + esc(ms.id) + '">Save</button>' +
          '<button class="ghost" data-t="hbren" data-id="">Cancel</button></div>'
      : '<div class="tr-hbt"><h2 class="tr-title">' + esc(ms.n) + '</h2>' +
          '<button class="tr-lnk" data-t="hbren" data-id="' + esc(ms.id) + '">Rename</button></div>';
    var html = '<button class="tr-lnk tr-hback" data-t="hbclose">‹ All blocks</button>' +
      '<div class="tr-card tr-blk tr-hblk">' +
        '<div class="tr-eyebrow">' + esc(blockStatus(ms, f)) + '</div>' + name +
        '<div class="tr-sub">' + esc([spanSay(f.from, f.to), blockKind(ms)].filter(Boolean).join(' · ')) + '</div>' +
        seshChips([
          '<b>' + f.done + ' of ' + f.tot + '</b> sessions' + (f.gone ? ', ' + f.gone + ' skipped' : ''),
          f.time ? '<b>' + dur(f.time) + '</b> lifting' : '',
          f.sets ? '<b>' + f.sets + '</b> hard sets' : '',
          f.vol > 0 ? '<b>' + fmtBig(f.vol) + '</b> ' + T.pr.u + ' moved' : '',
          f.prs ? { up: 1, h: '🥇 <b>' + f.prs + '</b> record' + (f.prs === 1 ? '' : 's') } : '',
          fin(bw0) && fin(bw1) && bw0 !== bw1 ? 'body weight <b>' + fmtN(conv(bw0, bwU)) + ' → ' + fmtN(conv(bw1, bwU)) + '</b> ' + T.pr.u : ''
        ]) +
        weekGrid(ms, nx, sel, 'hbsel') +
        (sel ? '' : '<div class="tr-ghint">Tap a box to see that session</div>') +
      '</div>';
    if (sel) html += pastSeshHTML(ms, nx, sel);

    var lifts = blockLifts(f.wos);
    if (lifts.length) {
      html += '<div class="tr-card"><div class="tr-ql">What the lifts did</div><ul class="tr-ups tr-blifts">' +
        lifts.slice(0, 12).map(function (l) {
          var ch = Math.round(l.ch * 100);
          return '<li><span>' + esc(lib(l.e).n) + (l.prs ? ' <span class="tr-pr">🥇 ' + l.prs + '</span>' : '') + '</span>' +
            '<span class="' + (ch > 0 ? 'up' : ch < 0 ? 'down' : '') + '">' +
              (l.a > 0 ? fmtN(Math.round(l.a)) + ' → ' + fmtN(Math.round(l.b)) + ' ' + T.pr.u + (ch ? ' (' + (ch > 0 ? '+' : '−') + Math.abs(ch) + '%)' : '') : '') +
            '</span></li>';
        }).join('') + '</ul>' +
        '<div class="tr-note">Estimated one-rep max, the first session of the block against the last; 🥇 is records set during it.</div></div>';
    }

    var vol = blockVolume(ms, f.wos);
    if (vol.length) {
      var W = weeksOf(ms), acc = accOf(ms);
      html += '<div class="tr-card"><div class="tr-ql">Hard sets per muscle, week by week</div>' +
        '<div class="tr-bvol" role="table" aria-label="Hard sets per muscle, week by week" style="--n:' + W + '">' +
          '<div class="tr-bvr" role="row"><span role="columnheader"></span>' +
            Array.apply(null, Array(W)).map(function (_, w) {
              return '<span role="columnheader">' + (w >= acc && !steady(ms) ? 'DL' : 'W' + (w + 1)) + '</span>';
            }).join('') + '</div>' +
          vol.map(function (r) {
            return '<div class="tr-bvr" role="row"><span role="rowheader">' + esc(r.n) + '</span>' +
              r.wk.map(function (n) {
                var shade = r.mrv ? Math.round(8 + 40 * Math.min(1, n / r.mrv)) : 8;
                return '<span role="cell" class="tr-bvc"' + (n ? ' style="background:color-mix(in oklab, var(--green) ' + shade + '%, var(--card))"' : '') + '>' + (n || '–') + '</span>';
              }).join('') + '</div>';
          }).join('') +
        '</div>' +
        '<div class="tr-note">Working sets only, warm-ups left out. The deeper the green, the nearer that week came to RP’s MRV, the most you can recover from.</div></div>';
    }

    // outside the gym, while the block ran
    var end = f.status === 'now' ? Date.now() : (f.to || f.from) + 864e5;
    var ax = Object.keys(T.ax).map(function (k) { return T.ax[k]; })
      .filter(function (a) { return a && f.from && a.st >= f.from - 864e5 && a.st <= end; });
    if (ax.length) {
      var mins = ax.reduce(function (n, a) { return n + (a.min || 0); }, 0);
      var easy = ax.filter(function (a) { return a.ms === ms.id; }).length;
      html += '<div class="tr-card"><div class="tr-ql">Outside the gym while it ran</div>' +
        '<div class="tr-sub">' + ax.length + ' activit' + (ax.length === 1 ? 'y' : 'ies') + ', ' + dur(mins * 60000) +
          (easy ? ' · ' + easy + ' counted as the block’s easy day' + (easy === 1 ? '' : 's') : '') + '</div></div>';
    }

    html += '<div class="tr-card"><label class="tr-ql" for="trBlkNote">Your notes</label>' +
      '<textarea class="txt tr-bnote" id="trBlkNote" rows="4" maxlength="2000" placeholder="How it went, what hurt, what to change next time">' +
        esc(ms.note || '') + '</textarea>' +
      '<div class="tr-note">Kept with the block, and on your other devices when you are signed in.</div></div>';

    html += '<div class="tr-acts tr-hbacts">' +
      (f.status === 'now' ? '<button class="btn-primary" data-t="sub" data-v="block">Go to the block</button>' : '') +
      (LIVE ? '' : '<button class="' + (f.status === 'now' ? 'ghost' : 'btn-primary') + '" data-t="hbagain" data-id="' + esc(ms.id) + '">Run it again</button>') +
    '</div>' +
    '<div class="tr-note tr-hbagain-say">Run it again starts a new block with these same days and exercises, from where your lifts are now.</div>';
    /* Not while a workout of this block is going: the logger reads its block. */
    if (!(LIVE && LIVE.ms === ms.id)) {
      html += '<div class="tr-acts tr-foot tr-endblk"><button class="ghost danger" data-t="hbdel" data-id="' + esc(ms.id) + '">Delete this block</button></div>';
    }
    return html;
  }

  /* A box on a block in History. The current block's own card, Start and
     all; a past block's, what was done, or that it was not. */
  function pastSeshHTML(ms, nx, c) {
    var wk = wkName(ms, c.w);
    if (isEz(ms, c.d)) {
      var ez = ezFor(ms, c.w, c.d);
      if (nx && !ez) return seshHTML(ms, nx, c, true);
      return '<div id="trSesh" class="tr-card tr-sesh tr-ez"><div class="tr-eyebrow">' + (ez ? 'Done' : 'Not done') + ' · ' + wk + '</div>' +
        '<div class="tr-title">Easy day</div>' +
        '<div class="tr-sub">' + (ez ? esc(axName(ez)) + ', ' + dur(ez.min * 60000) + ', ' + when(ez.st) + '.' : 'Nothing was logged for it.') + '</div></div>';
    }
    var wo = woFor(ms, c.w, c.d);
    if (wo) return seshDoneHTML(ms, c, wo, '');
    if (nx) return seshHTML(ms, nx, c, true);
    var p = plan(ms, c.w, c.d);
    var skipped = (Array.isArray(ms.sk) ? ms.sk : []).indexOf(c.w + ':' + c.d) >= 0;
    return '<div id="trSesh" class="tr-card tr-sesh tr-sesh-skip"><div class="tr-eyebrow">' + (skipped ? 'Skipped' : 'Not done') + ' · ' + wk + '</div>' +
      '<div class="tr-title">' + esc(p.n) + '</div>' + seshNames(p) + '</div>';
  }

  function workoutsHTML() {
    var list = ix().list.slice();
    Object.keys(T.ax).forEach(function (k) { if (T.ax[k]) list.push({ ax: T.ax[k], st: T.ax[k].st }); });
    list.sort(function (a, b) { return b.st - a.st; });
    /* Empty, a screen says what will be here and gives the one way to get
       there: a workout, or the history you already have in another app. */
    if (!list.length) {
      return emptyHTML('No workouts yet', 'Finished workouts land here, newest first, with their records.',
        goBtn() + '<label class="ghost tr-file tr-empty-2">Import from another app<input type="file" id="trStrong2" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" hidden></label>');
    }
    return (S.sgDone ? '<div class="tr-card tr-ask tr-sgdone">Brought in ' + S.sgDone + ' workout' + (S.sgDone === 1 ? '' : 's') +
        ' from ' + esc(S.sgFrom || 'your file') + '. Their records and charts are under Lifts, and a new block starts from their weights.</div>' : '') +
      '<div class="tr-hist">' + list.map(function (wo) {
      if (wo.ax) {
        var a = wo.ax;
        return '<button class="tr-card tr-hrow tr-hax" data-t="axsheet" data-id="' + esc(a.id) + '">' +
          '<span class="tr-h-top"><span class="tr-h-n">' + esc(axName(a)) + '</span>' +
            '<span class="tr-h-d">' + when(a.st) + '</span></span>' +
          '<span class="tr-h-meta">' + dur(a.min * 60000) + ' \u00b7 ' + LV[axLv(a)].toLowerCase() +
            (axLv(a) === 'l' ? ' \u00b7 logged, not counted toward your active minutes' : ' \u00b7 counts toward your active minutes') + '</span>' +
        '</button>';
      }
      var won = {};
      prsIn(wo).forEach(function (r) { won[r.e] = (won[r.e] || 0) + 1; });
      var prs = prsIn(wo).length;
      return '<button class="tr-card tr-hrow" data-t="wosheet" data-id="' + esc(wo.id) + '">' +
        '<span class="tr-h-top"><span class="tr-h-n">' + esc(wo.n) + '</span>' +
          '<span class="tr-h-d">' + when(wo.st) + ' \u00b7 ' + hm(wo.st) + '</span></span>' +
        '<span class="tr-h-meta">' + dur((wo.en || wo.st) - wo.st) + ' · ' + setsOf(wo) + ' sets · ' +
          fmtBig(volOf(wo)) + ' ' + T.pr.u + (prs ? ' \u00b7 <span class="tr-pr">\ud83e\udd47 ' + prs + ' record' + (prs === 1 ? '' : 's') + '</span>' : '') +
          (wo.mc && mcScore(wo.mc) ? ' · circuit ' + esc(mcScore(wo.mc)) : '') +
        '</span>' +
        '<span class="tr-h-x">' + wo.x.map(function (x) {
          // the lift that set the record wears it
          return esc(x.s.length + ' × ' + lib(x.e).n) + (won[x.e] ? ' <span class="tr-pr" aria-label="' + won[x.e] + ' record' + (won[x.e] === 1 ? '' : 's') + '">\ud83e\udd47' + (won[x.e] > 1 ? '\u00d7' + won[x.e] : '') + '</span>' : '');
        }).join('<br>') + '</span>' +
        (wo.nt ? '<span class="tr-h-nt">' + esc(wo.nt.length > 90 ? wo.nt.slice(0, 88) + '\u2026' : wo.nt) + '</span>' : '') +
      '</button>';
    }).join('') + '</div>';
  }

  function emptyHTML(t, say, acts) {
    return '<div class="tr-card tr-empty"><div class="tr-title">' + esc(t) + '</div><div class="tr-sub">' + esc(say) + '</div>' +
      '<div class="tr-acts">' + acts + '</div></div>';
  }
  // the way back to training from an empty screen, named for where it goes
  function goBtn() {
    return '<button class="btn-primary tr-empty-go" data-t="sub" data-v="block">' +
      (LIVE ? 'Back to your workout' : active() ? 'Go to today\u2019s session' : 'Find a workout') + '</button>';
  }

  /* --------------------------------------------------------------- lifts */
  /* Every lift you have logged, found the way the picker finds one: word
     by word, or by muscle. Each says where it is heading: a small line of
     its best set, session by session, and how far it has come in four
     weeks, which is the question a list of lifts is opened to answer. */
  function liftsHTML() {
    var per = liftPer();
    var keys = Object.keys(per);
    if (!keys.length) return emptyHTML('No lifts yet', 'Every lift you log gets its own page here: records, and a line of your estimated max over time.', goBtn());
    var mus = uniq(keys.map(function (e) { return lib(e).m; }));
    return '<div class="tr-lfind">' +
        '<input class="txt tr-search" id="trLiftQ" type="search" placeholder="Search your lifts" value="' + esc(S.lq || '') + '" aria-label="Search your lifts">' +
        (mus.length > 1 ? chips('liftm', S.lm || '', [['', 'All']].concat(MUSCLES.filter(function (m) { return mus.indexOf(m.k) >= 0; }).map(function (m) { return [m.k, m.n]; }))) : '') +
      '</div>' + liftList(per);
  }
  function liftPer() {
    var per = {};
    ix().list.forEach(function (wo) {
      wo.x.forEach(function (x) {
        var p = per[x.e] = per[x.e] || { n: 0, last: 0, pts: [] };
        p.n++;
        p.last = wo.st;
        var work = x.s.filter(counts);
        if (!work.length) return;
        // reps where the weight is you, or a machine's help; the estimated max where it is a load
        var v = usesBw(x.e) || ASST[x.e] ? Math.max.apply(null, work.map(function (z) { return z.r; })) : bestE1(work, wo.u);
        if (v > 0) p.pts.push([wo.st, v]);
      });
    });
    return per;
  }
  function liftList(per) {
    var qw = String(S.lq || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    var keys = Object.keys(per).filter(function (e) {
      var ex = lib(e);
      if (S.lm && ex.m !== S.lm) return false;
      var h = (ex.n + ' ' + mname(ex.m)).toLowerCase().split(/[^a-z0-9]+/);
      return qw.every(function (w) { return h.some(function (x) { return x.indexOf(w) === 0; }); });
    }).sort(function (a, b) { return per[b].last - per[a].last; });
    if (!keys.length) return '<div class="tr-lifts-l"><div class="tr-note">No lift of yours matches. The whole library is under + Add an exercise in a workout.</div></div>';
    return '<div class="tr-lifts tr-lifts-l">' + keys.map(function (e) {
      var ex = lib(e), r = records(e), p = per[e], reps = usesBw(e) || ASST[e];
      var best = r.e1 > 0 ? fmtN(Math.round(r.e1)) + ' ' + T.pr.u : r.r + ' reps';
      var ch = trend4(p.pts);
      return '<button class="tr-card tr-lrow" data-t="exsheet" data-e="' + esc(e) + '">' +
        '<span class="tr-l-n">' + esc(ex.n) + '</span>' +
        '<span class="tr-l-m">' + esc(mname(ex.m)) + ' \u00b7 ' + p.n + ' session' + (p.n === 1 ? '' : 's') +
          ' \u00b7 last ' + shortDate(p.last) + '</span>' +
        '<span class="tr-l-b"><span class="tr-l-bl">' + (r.e1 > 0 ? 'best est. max' : 'best') + '</span>' + best + '</span>' +
        (p.pts.length > 1 ? '<span class="tr-l-t">' + spark(p.pts.slice(-12)) +
          (ch === null ? '' : '<span class="tr-l-c ' + (ch > 0.005 ? 'up' : ch < -0.005 ? 'dn' : 'eq') + '">' +
            (Math.abs(ch) < 0.005 ? 'level' : (ch > 0 ? '+' : '\u2212') + Math.abs(Math.round(ch * 100)) + '%') +
            ' in 4 weeks' + (reps ? ', reps' : '') + '</span>') + '</span>' : '') +
      '</button>';
    }).join('') + '</div>';
  }
  /* The latest session against the last one at least four weeks before it;
     with nothing that old, against the first, once there are two weeks to
     go on. Null when there is nothing fair to compare. */
  function trend4(pts) {
    if (pts.length < 2) return null;
    var last = pts[pts.length - 1], ref = null;
    for (var i = pts.length - 2; i >= 0; i--) if (last[0] - pts[i][0] >= 28 * DAY_MS) { ref = pts[i]; break; }
    if (!ref && last[0] - pts[0][0] >= 14 * DAY_MS) ref = pts[0];
    return ref && ref[1] > 0 ? last[1] / ref[1] - 1 : null;
  }
  function spark(pts) {
    var W = 84, H = 26, lo = Infinity, hi = -Infinity;
    pts.forEach(function (q) { lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); });
    var span = hi - lo || 1;
    var d = pts.map(function (q, i) {
      var x = pts.length === 1 ? W / 2 : 2 + i * (W - 4) / (pts.length - 1);
      var y = H - 3 - (q[1] - lo) / span * (H - 6);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join('');
    return '<svg class="tr-spark" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true" focusable="false">' +
      '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function redrawLifts() {
    var box = document.querySelector('#trBody .tr-lifts-l');
    if (!box) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = liftList(liftPer());
    box.replaceWith(tmp.firstChild);
  }

  /* -------------------------------------------------------------- review */
  var ICON = { good: '✓', look: '!', info: 'i' };
  var WORD = { good: 'On track', look: 'Worth a look', info: 'For information' };
  function reviewHTML() {
    var r = review();
    /* Keeping is drawn on its own scale: a band from three sets up, and no
       RP landmarks, which are about growing. */
    var small = r.keep || r.base || r.str;
    var max = small ? Math.max(12, r.rows.reduce(function (m, x) { return Math.max(m, x.sets); }, 0) + 1)
      : Math.max(26, r.rows.reduce(function (m, x) { return Math.max(m, x.sets, x.mrv); }, 0));
    var band = small ? [3, max - 3] : [10, 20];
    var pct = function (v) { return (100 * v / max).toFixed(2) + '%'; };
    var done = S.flash2 ? '<div class="tr-note tr-flash2" role="status">' + esc(S.flash2) + '</div>' : '';
    S.flash2 = '';
    var html = done + weekCard() + '<div class="tr-card">' +
      '<div class="tr-eyebrow">' + esc(r.label) + '</div>' +
      '<div class="tr-title">' + r.n + ' workout' + (r.n === 1 ? '' : 's') + ', held against the research</div>' +
      '<div class="tr-note">Every line below is a rule with a source. It grades what can be measured from your log and says so when something cannot be.</div>' +
      // a week with nothing in it has nothing to grade, and one way to fix that
      (r.n ? '' : '<div class="tr-acts">' + goBtn() + '</div>');
    if (r.rows.length) {
      html += '<div class="tr-vbars" role="table" aria-label="Hard sets per muscle this week">' +
        '<div class="tr-vkey" aria-hidden="true"><span class="tr-vk-band"></span> ' +
          (r.keep ? '3 or more hard sets, enough to keep strength' : r.base ? '3 or more hard sets, plenty while you are new'
            : r.str ? (r.cond ? '3 or more hard sets beside the circuits' : '3 or more hard sets around the main lifts')
            : '10\u201320 sets, where the evidence is strongest' +
          '<span class="tr-vk-tick"></span> RP\u2019s MEV and MRV') + '</div>' +
        r.rows.map(function (row) {
          return '<div class="tr-vrow" role="row" title="' + esc(row.n + ': ' + row.sets + ' sets on ' + row.days +
            ' day' + (row.days === 1 ? '' : 's') + ' · MEV ' + row.mev + ' · MRV ' + row.mrv) + '">' +
            '<span class="tr-vn" role="rowheader">' + esc(row.n) + '</span>' +
            '<span class="tr-vt" role="cell">' +
              '<span class="tr-vband" style="left:' + pct(band[0]) + ';width:' + pct(band[1] - band[0]) + '"></span>' +
              (!small && row.mev ? '<span class="tr-vtick" style="left:' + pct(row.mev) + '"></span>' : '') +
              (!small ? '<span class="tr-vtick" style="left:' + pct(row.mrv) + '"></span>' : '') +
              (row.sets ? '<span class="tr-vbar" style="width:' + pct(row.sets) + '"></span>' : '') +
            '</span>' +
            '<span class="tr-vv" role="cell">' + row.sets + '</span>' +
          '</div>';
        }).join('') + '</div>';
    }
    html += '</div>';
    /* Each check is a headline, and opens to its reasoning and sources on a
       tap: read top to bottom, the paragraphs were a page of prose for what
       is mostly "on track". */
    var ckOpen = S.ck || {};
    html += r.checks.map(function (c) {
      var open = !!ckOpen[c.t];
      return '<div class="tr-card tr-check tr-' + c.st + (open ? ' open' : '') + '">' +
        '<button class="tr-ck-h" data-t="ckopen" data-v="' + esc(c.t) + '" aria-expanded="' + open + '">' +
          '<span class="tr-ck-i" aria-hidden="true">' + ICON[c.st] + '</span>' +
          '<span class="tr-ck-t">' + esc(c.t) + '</span><span class="tr-ck-w">' + WORD[c.st] + '</span>' +
          '<span class="tr-ck-c" aria-hidden="true">' + (open ? '\u2212' : '+') + '</span></button>' +
        // what to do about it, in view without opening the reasons
        (c.fix && c.st === 'look' ? '<div class="tr-ck-fix"><button class="ghost" data-t="' + c.fix.t + '"' + c.fix.a + '>' + esc(c.fix.say) + '</button></div>' : '') +
        (open ? '<div class="tr-ck-b">' + esc(c.b) + '</div>' +
          (c.refs.length ? '<div class="tr-ck-r">' + c.refs.map(function (k) {
            return '<button class="tr-lnk tr-ref" data-t="ref" data-v="' + k + '">' + esc(REFS[k][0]) + '</button>';
          }).join(' \u00b7 ') + '</div>' : '') : '') +
      '</div>';
    }).join('');
    html += '<details class="tr-how" id="trRefs"><summary>Where the numbers come from</summary>' +
      '<dl class="tr-refs">' + Object.keys(REFS).map(function (k) {
        return '<dt id="tr-ref-' + k + '">' + esc(REFS[k][0]) + '</dt>' +
          '<dd><i>' + esc(REFS[k][1]) + '</i><br>' + esc(REFS[k][2]) + '</dd>';
      }).join('') + '</dl>' +
      '<p class="tr-fine">What this cannot do: it counts direct sets only, the way the landmarks are written; it cannot see reps to spare; and it knows nothing about your sleep, food or stress, which move recovery more than any of this. The research gives ranges and trends across groups of people, not a prescription for one.</p>' +
    '</details>';
    return html;
  }

  /* ---------------------------------------------------------------- sheets
   *
   * Drawn into their own root, but opened and closed through app.js, so the
   * back gesture treats them exactly as it treats a recipe: back closes the
   * sheet and leaves you in the app. */
  function openSheet(sh) {
    var h = hive();
    if (!S.sheet && h && h.openSheet) h.openSheet();
    S.sheet = sh;
    S.arm = '';
    drawSheet();
    var x = document.querySelector('#trainRoot .sheet-x');
    if (x) x.focus();
  }
  /* Gone from the screen at once, and the history entry unwound behind it.
     Waiting for the popstate to come back round before clearing it left a
     frame of the old sheet over whatever the button had just started. */
  function closeSheet() {
    if (backToParent()) return;
    var h = hive();
    var had = !!S.sheet;
    sheetClosed();
    if (had && h && h.closeSheet) h.closeSheet();
  }
  /* A picker opened from inside another sheet — matching a lift from an
     import, adding one to a saved workout — goes back to that sheet when
     closed. It used to close everything, and the import you were halfway
     through matching was gone with it. The history entry is the one the
     first sheet pushed, still standing. */
  function backToParent() {
    var sh = S.sheet;
    if (!sh || sh.k !== 'pick') return false;
    if (sh.mode === 'smap' && S.sg) S.sheet = { k: 'strong', eyebrow: 'Import', title: 'From ' + (S.sg.app || 'your file') };
    else if (sh.mode === 'eadd' && S.ed && T.wo[S.ed.id]) S.sheet = { k: 'wo', id: S.ed.id, eyebrow: 'Workout', title: 'Workout' };
    else return false;
    S.arm = '';
    S.own = null;
    S.never = false;
    drawSheet();
    return true;
  }
  function sheetClosed() {
    if (!S.sheet) return;
    if (S.sheet.k === 'wo') S.ed = null;
    if (S.sheet.k === 'strong') S.sg = null;
    if (S.sheet.k === 'immap' || S.sheet.k === 'impaste') S.imap = null;
    S.sheet = null;
    S.arm = '';
    S.own = null;
    S.never = false;
    drawSheet();
  }

  /* The same sheet drawn again keeps its place. Every tap inside a sheet
     draws it afresh, and the scroller went with the old one: opening the
     machine circuit at the foot of the ready list, or a setting at the foot
     of Settings, threw you back to the top with what you had opened out of
     sight below. A sheet newly opened still starts at its top. */
  var drawnSheet = null;
  function drawSheet() {
    var root = $('trainRoot');
    if (!root) return;
    var sh = S.sheet;
    if (!sh) { if (root.innerHTML) root.innerHTML = ''; drawnSheet = null; return; }
    var prev = root.querySelector('.scrim'), keep = prev && sh === drawnSheet ? prev.scrollTop : 0;
    var body = '';
    if (sh.k === 'pick') body = pickHTML(sh);
    else if (sh.k === 'ex') body = exSheetHTML(sh);
    else if (sh.k === 'wo') body = woSheetHTML(sh);
    else if (sh.k === 'plates') body = platesHTML(sh);
    else if (sh.k === 'warm') body = warmHTML(sh);
    else if (sh.k === 'finish') body = finishHTML(sh);
    else if (sh.k === 'plan') body = planSheetHTML(sh);
    else if (sh.k === 'set') body = settingsHTML();
    else if (sh.k === 'axnew') body = axNewHTML(sh);
    else if (sh.k === 'ax') body = axSheetHTML(sh);
    else if (sh.k === 'note') body = noteHTML(sh);
    else if (sh.k === 'bar') body = barHTML(sh);
    else if (sh.k === 'times') body = startHTML();
    else if (sh.k === 'sty') body = styHTML(sh);
    else if (sh.k === 'rest') body = restHTML(sh);
    else if (sh.k === 'done') body = doneHTML2(sh);
    else if (sh.k === 'ready') body = readyHTML(sh);
    else if (sh.k === 'rtnew') body = rtNewHTML(sh);
    else if (sh.k === 'strong') body = strongHTML();
    else if (sh.k === 'immap') body = imMapHTML();
    else if (sh.k === 'impaste') body = imPasteHTML();
    root.innerHTML = '<div class="scrim no-print" data-t="close">' +
      '<div class="sheet tr-sheet" role="dialog" aria-modal="true" aria-label="' + esc(sh.title || 'Strengthen') + '">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">' + esc(sh.eyebrow || '') + '</div>' +
          '<button class="sheet-x" data-t="close" aria-label="Close">&times;</button></div>' +
        body +
      '</div></div>';
    drawnSheet = sh;
    if (keep) root.querySelector('.scrim').scrollTop = keep;
  }
  /* Something opened near the foot of a sheet grows out of sight below it:
     bring it up until its end shows, but never past its own top. */
  function sheetShow(el) {
    var sc = el && el.closest ? el.closest('.scrim') : null;
    if (!sc) return;
    var r = el.getBoundingClientRect(), over = r.bottom - sc.clientHeight + 16;
    if (over > 0) sc.scrollTop += Math.max(0, Math.min(over, r.top - 16));
  }

  /* The best swaps for a lift, three of them, each with why. The list below
     them is the library's order, which put a barbell bench first when the
     machine chest press was taken: right muscle, wrong answer. These are
     ranked the way a coach would think it through — the same movement
     first, so the session still trains what it was built to; then the same
     kind of kit, since a taken machine is best replaced by another machine
     or a cable rather than a bar to load; what it asks of a back or joint
     you are protecting; one you already know, so its weight comes from
     your own numbers; easy to learn, starting out. Never one already in
     today's session, on your never list, or ruled out for your back. */
  var FAMILY = { mc: 'm', cb: 'm', sm: 'm', bb: 'f', db: 'f', bw: 'b' };
  /* How far one kind of kit is from another, for a swap: the same, then its
     family (a cable for a machine, dumbbells for a barbell); from a machine,
     a pair of dumbbells before a bar to load; your body alone last, when
     there is anything to load. */
  function kitGap(from, to, eq) {
    if (from === to) return 0;
    if (FAMILY[from] === FAMILY[to]) return 4;
    if (to === 'bw') return eq.length > 1 ? 12 : 4;
    if (FAMILY[from] === 'm') return to === 'db' ? 6 : 10;
    return 10;
  }
  function swapBest(old, today) {
    var o = lib(old), pf = T.pr, known = ix().best;
    var eq = KITS[KITS[pf.kit] ? pf.kit : 'gym'].eq;
    var score = function (ex) {
      return (o.p && ex.p === o.p ? 0 : 30) + (ex.k === o.k ? 0 : 20) + kitGap(o.q, ex.q, eq) +
        backCost(ex, pf) + newbieCost(ex, pf) - (known[ex.id] ? 8 : 0) + ex.o / 1000;
    };
    return allEx().filter(function (ex) {
      return ex.id !== old && ex.m === o.m && eq.indexOf(ex.q) >= 0 && !today[ex.id] &&
        pf.avoid.indexOf(ex.id) < 0 && !barred(ex, pf);
    }).sort(function (a, b) { return score(a) - score(b); }).slice(0, 3).map(function (ex) {
      var why = [o.p && ex.p === o.p ? 'same movement' : ex.k === o.k ? 'same kind of lift' : 'same muscle', (EQUIP[ex.q] || '').toLowerCase()];
      if (pf.bk) why.push(backCue(ex) ? 'some back load' : 'no back load');
      why.push(known[ex.id] ? 'you\u2019ve done it' : 'new to you');
      return { ex: ex, why: why.filter(Boolean).join(' \u00b7 ') };
    });
  }
  function pickHTML(sh) {
    var q = S.q.toLowerCase().trim();
    var old = (sh.mode === 'swap' && LIVE && LIVE.x[sh.x]) ? LIVE.x[sh.x].e
      : (sh.mode === 'dswap' && S.draft) ? S.draft.days[sh.d].s[sh.i].e : '';
    /* Word by word, each by its start, as well as the whole phrase: "hip
       abductor" finds the Hip Abduction Machine, "db curls" nothing less
       than "curl" would. */
    var qw = q.split(/[^a-z0-9]+/).filter(Boolean).map(function (w) { return w.slice(0, Math.max(3, w.length - 2)); });
    var words = function (ex) {
      var h = (ex.n + ' ' + mname(ex.m)).toLowerCase().split(/[^a-z0-9]+/);
      return qw.every(function (w) { return h.some(function (x) { return x.indexOf(w) === 0; }); });
    };
    var list = allEx().filter(function (ex) {
      // a swap is for something else
      if (old && ex.id === old) return false;
      if (S.qm && ex.m !== S.qm) return false;
      if (q && ex.n.toLowerCase().indexOf(q) < 0 && mname(ex.m).toLowerCase().indexOf(q) < 0 && !(qw.length && words(ex))) return false;
      return true;
    }).sort(function (a, b) {
      /* What your back has ruled out sinks to the foot of its muscle rather
         than vanishing: it is still yours to choose, it just says why not. */
      return MUSCLES.indexOf(MUS[a.m]) - MUSCLES.indexOf(MUS[b.m]) ||
        (barred(a, T.pr) ? 1 : 0) - (barred(b, T.pr) ? 1 : 0) || a.o - b.o;
    });
    var own = S.own;
    var today = {};
    if (sh.mode === 'swap' && LIVE) LIVE.x.forEach(function (x) { today[x.e] = 1; });
    if (sh.mode === 'dswap' && S.draft) S.draft.days[sh.d].s.forEach(function (x) { today[x.e] = 1; });
    var best = old && !q ? swapBest(old, today) : [];
    /* In a block, a swap asks how long it is for. The machine being taken is
       today; not getting on with the exercise is the rest of the block. */
    var scoped = sh.mode === 'swap' && LIVE && LIVE.ms && T.ms[LIVE.ms];
    return '<h2 class="sheet-name tr-sn2">' + esc(sh.title) + '</h2>' +
      (scoped ? '<div class="tr-q tr-swsc"><div class="tr-ql">For</div>' +
        chips('swsc', S.never ? 'block' : sh.sc, [['day', 'Just today'], ['block', 'Rest of the block']]) +
        '<div class="tr-hint">' + (S.never ? 'Never again takes it out of every day of this block, and every block after.'
          : sh.sc === 'block' ? 'This session has the new one in its place every week from now on.'
          : 'Today only. Next time the plan has ' + esc(lib(old).n) + ' again.') + '</div></div>' : '') +
      (old ? '<div class="tr-chips tr-never"><button class="tr-chip" data-t="never" aria-pressed="' + !!S.never + '">' +
        'Never suggest ' + esc(lib(old).n) + ' again</button></div>' : '') +
      (best.length ? '<div class="tr-bestw"><div class="tr-rdg">Best swaps</div><div class="tr-picks tr-best">' + best.map(function (b) {
        return '<button class="tr-pick tr-pick-best" data-t="pickex" data-e="' + esc(b.ex.id) + '">' +
          '<span class="tr-pk-n">' + esc(b.ex.n) + '</span><span class="tr-pk-m">' + esc(b.why) + '</span></button>';
      }).join('') + '</div><div class="tr-rdg">Everything for ' + esc(mname(lib(old).m).toLowerCase()) + '</div></div>' : '') +
      '<input class="txt tr-search" id="trPickQ" type="search" placeholder="Search exercises" value="' + esc(S.q) + '" aria-label="Search exercises">' +
      chips('pickm', S.qm, [['', 'All']].concat(MUSCLES.map(function (m) { return [m.k, m.n]; }))) +
      '<div class="tr-picks">' + (list.length ? list.map(function (ex) {
        var warn = T.pr.avoid.indexOf(ex.id) >= 0 ? 'on your never list'
          : barred(ex, { bk: T.pr.bk }) ? 'loads your back' : backCue(ex) ? 'some back load' : '';
        return '<button class="tr-pick" data-t="pickex" data-e="' + esc(ex.id) + '">' +
          '<span class="tr-pk-n">' + esc(ex.n) + (warn ? ' <span class="tr-pk-w">' + warn + '</span>' : '') + '</span>' +
          '<span class="tr-pk-m">' + esc(mname(ex.m)) + ' \u00b7 ' + esc(EQUIP[ex.q] || '') + (ex.own ? ' \u00b7 yours' : '') + '</span></button>';
      }).join('') : '<div class="tr-note">Nothing by that name.</div>') + '</div>' +
      (own
        ? '<div class="tr-own"><div class="tr-ql">Make your own</div>' +
            '<input class="txt" id="trOwnN" placeholder="Name" value="' + esc(own.n) + '" aria-label="Name">' +
            '<div class="tr-own-r">' +
              '<select id="trOwnM" aria-label="Muscle">' + MUSCLES.map(function (m) {
                return '<option value="' + m.k + '"' + (own.m === m.k ? ' selected' : '') + '>' + esc(m.n) + '</option>';
              }).join('') + '</select>' +
              '<select id="trOwnQ" aria-label="Equipment">' + Object.keys(EQUIP).map(function (k) {
                return '<option value="' + k + '"' + (own.q === k ? ' selected' : '') + '>' + esc(EQUIP[k]) + '</option>';
              }).join('') + '</select>' +
              '<select id="trOwnK" aria-label="Kind">' +
                '<option value="c"' + (own.k === 'c' ? ' selected' : '') + '>Compound</option>' +
                '<option value="i"' + (own.k !== 'c' ? ' selected' : '') + '>Isolation</option></select>' +
            '</div>' +
            '<div class="tr-acts"><button class="btn-primary" data-t="ownsave">Add it</button></div></div>'
        : '<div class="tr-acts"><button class="ghost" data-t="own">Not here? Make your own</button></div>');
  }

  function sessionsOf(e) {
    var out = [];
    ix().list.forEach(function (wo) {
      var x = exIn(wo, e);
      if (x && x.s.length) out.push({ wo: wo, x: x });
    });
    return out;
  }

  /* A lift's own page, the way Strong lays one out: how it is done, every
     session of it, its lines over time, and its records. It opens on
     History once there is some, on About before. */
  var EXTABS = [['about', 'About'], ['history', 'History'], ['charts', 'Charts'], ['records', 'Records']];
  function exSheetHTML(sh) {
    var e = sh.e, ex = lib(e);
    var ss = sessionsOf(e);
    var tab = sh.tab || (ss.length ? 'history' : 'about');
    var html = '<h2 class="sheet-name tr-sn2">' + esc(ex.n) + '</h2>' +
      '<div class="seg tr-seg tr-extab" role="group" aria-label="' + esc(ex.n) + '">' + EXTABS.map(function (t) {
        return '<button data-t="extab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div>';
    if (tab === 'about') return html + exAbout(e, ex);
    if (!ss.length) return html + '<div class="tr-note">Not logged yet. Its history, charts and records fill in after the first session.</div>';
    if (tab === 'history') return html + exHistory(e, ss);
    if (tab === 'charts') {
      /* The last month, three, six, or everything: a lifetime of sessions
         on one line flattens this month's climb to nothing. */
      var rng = S.crng || 'all', cut = { '1m': 31, '3m': 92, '6m': 183 }[rng];
      var inR = cut ? ss.filter(function (x) { return x.wo.st >= Date.now() - cut * DAY_MS; }) : ss;
      return html + '<div class="tr-crng">' + chips('crng', rng, [['1m', '1M'], ['3m', '3M'], ['6m', '6M'], ['all', 'All']]) + '</div>' +
        (ss.length < 2 ? '<div class="tr-note">Two sessions and these draw.</div>'
          : inR.length >= 2 ? exCharts(e, ss, cut ? Date.now() - cut * DAY_MS : 0)
          : '<div class="tr-note">Fewer than two sessions in this range. Pick a longer one.</div>');
    }
    return html + exRecords(e, ss);
  }
  /* Before the first heavy set of a barbell press or squat: the thing that
     saves you when a rep fails. */
  var SAFETY = {
    'bb-bench': 'Set the safety bars (or pins) just below your chest, or ask someone to spot you. Start with the empty bar.',
    'bb-incline': 'Set the safety bars just below your chest, or ask someone to spot you. Start with the empty bar.',
    'bb-close': 'Set the safety bars just below your chest, or ask someone to spot you. Start with the empty bar.',
    'bb-squat': 'Squat inside the rack with the safety bars just below the bottom of your squat. Start with the empty bar.',
    'bb-front': 'Squat inside the rack with the safety bars just below the bottom of your squat. Start with the empty bar.',
    'sm-squat': 'Set the Smith machine\u2019s stops just below the bottom of your squat.',
    'sm-bench': 'Set the Smith machine\u2019s stops just below your chest.',
    'sm-incline': 'Set the Smith machine\u2019s stops just below your chest.'
  };
  // never logged: no record of any kind, weighted or bodyweight
  function newLift(e) {
    var r = records(e);
    return !(r.e1 > 0 || r.r > 0);
  }
  // the first time on a lift: how to find a weight, rather than an empty box
  /* One line, and only the part that is this lift's own; how to find a
     starting weight is said once, in the how-a-workout-goes card. A lift
     with a safety note says it there, empty bar and all. */
  function firstTime(x) {
    var ex = lib(x.e);
    if (ex.q === 'bw' || usesBw(x.e) || SAFETY[x.e]) return '';
    if (x.s.some(function (s) { return s.t || fin(s.tw) || fin(s.pw); })) return '';
    if (!newLift(x.e)) return '';
    var how = SLED[ex.id] ? 'Start with the empty sled, or a plate a side. Machine taken? Swap.'
      : ex.q === 'mc' || ex.q === 'cb' ? 'Start on the 2nd or 3rd plate of the stack. Machine taken? Swap.'
      : onBar(ex) ? 'Start with just the bar.' : ex.q === 'db' ? 'Start with a light pair.' : 'Start light.';
    return '<div class="tr-first"><b>First time?</b> ' + how + '</div>';
  }

  function exAbout(e, ex) {
    var steps = HOWTO[e], m = MEDIA[e], link = linkOf(e), note = noteOf(e), cue = backCue(ex);
    return (m ? (m.kind === 'video'
        ? '<video class="tr-media" src="' + esc(m.src) + '" muted loop playsinline autoplay aria-label="' + esc(ex.n) + '"></video>'
        : '<img class="tr-media" src="' + esc(m.src) + '" alt="' + esc(ex.n) + '">') +
        (m.credit ? '<div class="tr-sub">' + esc(m.credit) + '</div>' : '') : '') +
      (steps ? '<ol class="tr-howto">' + steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>'
        : '<div class="tr-note">' + (ex.own ? 'One of your own, so no steps are written for it. ' : '') + 'A how-to link on its note shows here.</div>') +
      (SAFETY[e] ? '<div class="tr-first tr-safe"><b>Safety first.</b> ' + esc(SAFETY[e]) + '</div>' : '') +
      (link ? '<a class="tr-howlink" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">Watch how it\u2019s done \u2197</a>'
        : '<a class="tr-howlink" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.n + ' how to') +
          '" target="_blank" rel="noopener noreferrer">Find a video on YouTube \u2197</a>') +
      '<dl class="tr-dl">' +
        '<dt>Trains</dt><dd>' + esc(mname(ex.m)) + '</dd>' +
        '<dt>Kit</dt><dd>' + esc(EQUIP[ex.q] || '') + ' \u00b7 ' + (ex.k === 'c' ? 'compound' : 'isolation') + '</dd>' +
        '<dt>Reps</dt><dd>' + ex.rr[0] + '\u2013' + ex.rr[1] + '</dd>' +
        (onBar(ex) ? '<dt>Bar</dt><dd><button class="tr-lnk tr-barl" data-t="barpick" data-e="' + esc(e) + '">' + esc(barLabel(e)) + '</button></dd>' : '') +
        '<dt>Rest</dt><dd><button class="tr-lnk tr-barl" data-t="restpick" data-e="' + esc(e) + '">' + clock(restFor(ex)) + '</button></dd>' +
        (cue ? '<dt>Your back</dt><dd>' + esc(cue) + '</dd>' : '') +
      '</dl>' +
      '<button class="tr-exnt tr-exnt-s" data-t="note" data-e="' + esc(e) + '">' +
        (note ? '<span class="tr-exnt-l">Note</span> ' + esc(note) : '<span class="tr-exnt-l">+ Note</span> for next time: the seat, the grip' + (link ? '' : ', a how-to link')) + '</button>' +
      (steps ? '<div class="tr-hint">Short cues, not a substitute for being shown. Anything that hurts is a question for a physio or a coach.</div>' : '');
  }
  function exHistory(e, ss) {
    return ss.slice().reverse().slice(0, 30).map(function (s) {
      var num = 0, bw = bwFor(e, s.wo);
      return '<div class="tr-hs"><div class="tr-hs-h"><span class="tr-hs-n">' + esc(s.wo.n) + '</span>' +
          '<span class="tr-hs-d">' + when(s.wo.st) + ' \u00b7 ' + hm(s.wo.st) + (bw ? ' \u00b7 you ' + fmtN(bw) + ' ' + T.pr.u : '') + '</span></div>' +
        // the last column was a bare number: it says what it is now
        '<table class="tr-hs-t"><thead><tr><th></th><th>Weight \u00d7 reps</th><th>Est. max</th></tr></thead><tbody>' + s.x.s.map(function (z) {
          var w = conv(z.w, s.wo.u), e1 = !counts(z) ? 0 : e1Of(e, w, z.r, bw);
          return '<tr' + (z.wu ? ' class="w"' : '') + '><td class="tr-hs-l">' + setLab(z, function () { return ++num; }) + '</td>' +
            '<td>' + (w > 0 ? (BWL[e] ? '+' : '') + fmtN(w) + ' ' + T.pr.u + (ASST[e] ? ' help' : '') + ' \u00d7 ' : '') + z.r + (fin(z.q) ? ' <span class="tr-e1">' + rqSay(z.q) + '</span>' : '') + '</td>' +
            '<td class="tr-hs-e">' + (e1 > 0 ? Math.round(e1) : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('') + '<div class="tr-hint">The last number is the estimated one-rep max for that set (Epley). Warm-ups have none.' +
      (BWL[e] ? ' On this lift it counts you as well as anything added, from your weigh-in in Nourish that day or in the two weeks before; without one, reps only.'
        : ASST[e] ? ' On this lift it counts you, less the machine\u2019s help, from your weigh-in in Nourish that day or in the two weeks before; without one, reps only.' : '') + '</div>';
  }
  /* The lines from `from` on; the whole log still decides what was a
     record, so a month of sessions under an old best shows none. */
  function exCharts(e, ss, from) {
    from = from || 0;
    var r = records(e), byReps = !(r.e1 > 0);
    var work = function (s) { return s.x.s.filter(counts); };
    var pts = function (f) {
      return ss.map(function (s) { var ws = work(s); var v = ws.length ? f(ws, s.wo.u, s) : null; return v > 0 ? { t: s.wo.st, v: v } : null; }).filter(Boolean);
    };
    // the best estimated max of a session, you included on the lifts that lift you
    var best = function (ws, u, s) { var bw = bwFor(e, s.wo); return Math.max.apply(null, ws.map(function (z) { return e1Of(e, conv(z.w, u), z.r, bw); })); };
    var one = function (title, series, reps, low, unit) {
      var shown = series.filter(function (q) { return q.t >= from; }), before = null;
      series.forEach(function (q) { if (q.t < from && (before === null || (low ? q.v < before : q.v > before))) before = q.v; });
      return '<div class="tr-ql tr-chart-h">' + title + '</div>' +
        (shown.length >= 2 ? chartSVG(shown, reps, low, unit, before) : '<div class="tr-note">Two sessions in this range and this draws.</div>');
    };
    if (usesBw(e) && !byReps) {
      return one('Best set, in reps', pts(function (ws) { return Math.max.apply(null, ws.map(function (z) { return z.r; })); }), true) +
        one(ASST[e] ? 'Estimated one-rep max, you less the help' : 'Estimated one-rep max, you + added', pts(best), false) +
        one('Strength \u00d7 bodyweight', pts(function (ws, u, s) { var bw = bwFor(e, s.wo); return bw ? Math.round(best(ws, u, s) / bw * 100) / 100 : 0; }), false, false, '\u00d7') +
        '<div class="tr-hint">Strength \u00d7 bodyweight holds still when your weight falls and your reps don\u2019t, which the estimated max alone can\u2019t.</div>';
    }
    if (ASST[e]) {
      return one('Best set, in reps', pts(function (ws) { return Math.max.apply(null, ws.map(function (z) { return z.r; })); }), true) +
        one('Least help (' + T.pr.u + ')', pts(function (ws, u) { return Math.min.apply(null, ws.map(function (z) { return conv(z.w, u); })) || 0.001; }), false, true);
    }
    return byReps
      ? one('Best set, in reps', pts(function (ws) { return Math.max.apply(null, ws.map(function (z) { return z.r; })); }), true) +
        one('Total reps', pts(function (ws) { return ws.reduce(function (a, z) { return a + z.r; }, 0); }), true)
      : one('Estimated one-rep max', pts(function (ws, u) { return bestE1(ws, u); }), false) +
        one('Heaviest set', pts(function (ws, u) { return Math.max.apply(null, ws.map(function (z) { return conv(z.w, u); })); }), false) +
        one('Total lifted, working sets (' + T.pr.u + ')', pts(function (ws, u) { return ws.reduce(function (a, z) { return a + conv(z.w, u) * z.r; }, 0); }), false);
  }
  /* The heaviest you have lifted for at least N reps, for each N, and what
     your best estimated max says you could: the table to pick today's
     weight from. */
  function repMaxes(ss) {
    var out = [];
    for (var n = 1; n <= 12; n++) {
      var best = null;
      ss.forEach(function (s) {
        s.x.s.forEach(function (z) {
          if (!counts(z) || z.r < n) return;
          var w = conv(z.w, s.wo.u);
          if (w > 0 && (!best || w > best.w)) best = { w: w, r: z.r, st: s.wo.st };
        });
      });
      if (best) out.push({ n: n, b: best });
    }
    return out;
  }
  function exRecords(e, ss) {
    var r = records(e), byReps = !(r.e1 > 0);
    if (usesBw(e)) {
      var rel = 0, help = null;
      ss.forEach(function (s) {
        var bw = bwFor(e, s.wo);
        if (bw) s.x.s.forEach(function (z) { if (counts(z)) rel = Math.max(rel, e1Of(e, conv(z.w, s.wo.u), z.r, bw) / bw); });
        s.x.s.forEach(function (z) { if (counts(z)) { var hw = conv(z.w, s.wo.u); if (help === null || hw < help) help = hw; } });
      });
      return '<div class="tr-recs">' +
        rec('Est. max', r.e1 > 0 ? fmtN(Math.round(r.e1)) + ' ' + T.pr.u : '\u2014') +
        rec('\u00d7 bodyweight', rel > 0 ? (Math.round(rel * 100) / 100).toFixed(2) : '\u2014') +
        (ASST[e] ? rec('Least help', help !== null ? fmtN(help) + ' ' + T.pr.u : '\u2014')
          : rec('Most added', r.w > 0 ? '+' + fmtN(r.w) + ' ' + T.pr.u : '\u2014')) +
        rec('Most reps', r.r || '\u2014') +
      '</div>' +
      (r.e1 > 0 ? '<div class="tr-hint">' + (ASST[e] ? 'Counting you, from your weigh-in in Nourish, less the machine\u2019s help.' : 'Counting you, from your weigh-in in Nourish, plus anything added.') + '</div>'
        : '<div class="tr-hint">Log your weight on Nourish and this lift gets a strength number too: you plus anything added.</div>') +
      exFell(e);
    }
    var html = '<div class="tr-recs">' +
      rec('Est. max', r.e1 > 0 ? fmtN(Math.round(r.e1)) + ' ' + T.pr.u : '\u2014') +
      rec('Heaviest', r.w > 0 ? fmtN(r.w) + ' ' + T.pr.u : '\u2014') +
      // weight times reps: "best set 1,400 lb" read as a 1,400 lb lift
      rec('Best set volume', r.vol > 0 ? fmtBig(r.vol) + ' ' + T.pr.u : '\u2014') +
      rec('Most reps', r.r || '\u2014') +
    '</div>';
    if (!byReps) {
      var rm = repMaxes(ss);
      html += '<div class="tr-ql tr-chart-h">Best for each number of reps</div>' +
        '<table class="tr-rmx"><thead><tr><th>Reps</th><th>Best</th><th>Est. for that many</th></tr></thead><tbody>' +
        rm.map(function (row) {
          var est = row.n === 1 ? r.e1 : r.e1 / (1 + row.n / 30);
          return '<tr><td>' + row.n + '</td><td>' + fmtN(row.b.w) + ' ' + T.pr.u + ' <span class="tr-e1">\u00d7' + row.b.r + '</span>' +
            '<span class="tr-rmx-d">' + shortDate(row.b.st) + '</span></td><td>' + fmtN(Math.round(est)) + ' ' + T.pr.u + '</td></tr>';
        }).join('') + '</tbody></table>' +
        '<div class="tr-hint">Best: the heaviest you have lifted for at least that many reps. Estimated: what your best estimated max says you could, by Epley, which drifts past about ten reps.</div>';
    }
    return html + exFell(e);
  }
  function exFell(e) {
    var hist = [];
    ix().list.forEach(function (wo) {
      (ix().prs[wo.id] || []).forEach(function (pr) { if (pr.e === e) hist.push({ st: wo.st, what: pr.what }); });
    });
    return '<div class="tr-ql tr-chart-h">Records as they fell</div>' + (hist.length
      ? '<ol class="tr-sess">' + hist.reverse().slice(0, 20).map(function (h) {
          return '<li><span class="tr-ss-d">' + when(h.st) + '</span><span class="tr-ss-s">\ud83e\udd47 ' + esc(h.what) + '</span></li>';
        }).join('') + '</ol>'
      : '<div class="tr-note">None yet: the first session of a lift is where records start from.</div>');
  }
  function rec(l, v) { return '<div class="tr-rec"><span class="tr-rec-l">' + l + '</span><span class="tr-rec-v">' + v + '</span></div>'; }

  /* One line, one colour, the same drawing as My Day's weight chart so the two
     read as one app: ink line, hairline grid, three rounded ticks, the first
     and last dates under it, a title on every point for the value. */
  /* A lift's line over time, drawn to be read on a phone: spaced by date,
     not by session, so a month off looks like a month; the axis on round
     numbers; every record a gold dot; and a finger on the line (or a drag
     along it) reads out the session under it. The viewBox is about a
     phone's width, so its type is about the size it says. */
  function niceTicks(lo, hi, n) {
    var span = hi - lo || 1, raw = span / (n || 4);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    var out = [];
    for (var v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 2; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }
  function chartSVG(series, byReps, low, unit, before) {
    var W = 360, H = 180, PL = 46, PR = 12, PT = 14, PB = 24;
    var vals = series.map(function (q) { return q.v; });
    var tk = niceTicks(Math.min.apply(null, vals), Math.max.apply(null, vals), 4);
    if (tk.length < 2) tk = [tk[0] - 1, tk[0] + 1];
    var lo = tk[0], hi = tk[tk.length - 1];
    var t0 = series[0].t, t1 = series[series.length - 1].t;
    var px = function (t) { return t1 > t0 ? PL + (t - t0) / (t1 - t0) * (W - PL - PR) : (PL + W - PR) / 2; };
    var py = function (v) { return PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo)); };
    var u = unit !== undefined ? unit : byReps ? ' reps' : ' ' + T.pr.u;
    // a ratio to two places; pounds, kilos and reps as whole numbers
    var say = function (q) { return shortDate(q.t) + ' \u00b7 ' + (u === '\u00d7' ? (Math.round(q.v * 100) / 100).toFixed(2) : fmtBig(q.v)) + u; };
    var tick = function (v) { return v >= 10000 ? Math.round(v / 100) / 10 + 'k' : v >= 1000 ? fmtBig(v) : String(Math.round(v * 100) / 100); };
    var out = [];
    tk.forEach(function (v) {
      out.push('<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + py(v).toFixed(1) + '" y2="' + py(v).toFixed(1) + '" class="mc-grid"/>');
      out.push('<text x="' + (PL - 6) + '" y="' + (py(v) + 4).toFixed(1) + '" text-anchor="end" class="tr-ax">' + tick(v) + '</text>');
    });
    out.push('<polyline class="mc-line tr-line" points="' + series.map(function (q) {
      return px(q.t).toFixed(1) + ',' + py(q.v).toFixed(1);
    }).join(' ') + '"/>');
    // a record is a session that beat every one before it, in the range or not
    var best = before === undefined ? null : before;
    series.forEach(function (q, i) {
      var rec = best !== null && (i > 0 || before !== null) && (low ? q.v < best : q.v > best);
      if (best === null || (low ? q.v < best : q.v > best)) best = q.v;
      out.push('<circle cx="' + px(q.t).toFixed(1) + '" cy="' + py(q.v).toFixed(1) + '" r="' + (rec ? 5 : 3.5) + '" class="tr-dot' + (rec ? ' pr' : '') + '"/>');
    });
    out.push('<circle class="tr-hl" r="7" cx="-20" cy="-20"/>');
    [0, series.length - 1].forEach(function (i) {
      out.push('<text x="' + px(series[i].t).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i ? 'end' : 'start') +
        '" class="tr-ax">' + esc(shortDate(series[i].t)) + '</text>');
    });
    var pts = series.map(function (q) { return [Math.round(px(q.t) * 10) / 10, Math.round(py(q.v) * 10) / 10, say(q)]; });
    var last = series[series.length - 1];
    return '<div class="tr-chartw"><div class="tr-chart-read" aria-live="polite">Latest: ' + esc(say(last)) + '</div>' +
      '<svg class="mc-svg tr-chart" viewBox="0 0 ' + W + ' ' + H + '" data-pts="' + esc(JSON.stringify(pts)) + '" role="img" aria-label="' +
      esc((byReps ? 'Best reps' : 'Estimated one-rep max') + ' over ' + series.length + ' sessions, from ' +
        Math.round(series[0].v) + ' to ' + Math.round(last.v)) + '">' + out.join('') + '</svg></div>';
  }
  // the finger on a chart: the session nearest it, read out and ringed
  function chartRead(svg, clientX) {
    var pts;
    try { pts = JSON.parse(svg.getAttribute('data-pts') || '[]'); } catch (e) { return; }
    if (!pts.length) return;
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    var x = (clientX - r.left) / r.width * vb.width, near = pts[0];
    pts.forEach(function (q) { if (Math.abs(q[0] - x) < Math.abs(near[0] - x)) near = q; });
    var hl = svg.querySelector('.tr-hl'), rd = svg.parentNode.querySelector('.tr-chart-read');
    if (hl) { hl.setAttribute('cx', near[0]); hl.setAttribute('cy', near[1]); }
    if (rd && rd.textContent !== near[2]) rd.textContent = near[2];
  }

  /* The workout in plain text, the way Nourish copies a day: the date, the
     times, then each lift set by set, then the totals. Warm-ups are marked,
     so they are not read as working sets. */
  function woText(wo) {
    var d = new Date(wo.st), u = T.pr.u;
    var out = ['Strengthen \u2014 ' + DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear(),
      wo.n + ' \u00b7 ' + (wo.en > wo.st ? hmSpan(wo.st, wo.en) + ' (' + dur(wo.en - wo.st) + ')' : hm(wo.st)), ''];
    wo.x.forEach(function (x) {
      out.push(lib(x.e).n + ': ' + x.s.map(function (s) {
        var w = conv(s.w, wo.u);
        return (w > 0 ? fmtN(w) + ' ' + u + ' \u00d7 ' : '') + s.r + (s.wu ? ' (warm-up)' : s.ty === 'd' ? ' (drop set)' : s.ty === 'f' ? ' (to failure)' : s.ty === 'm' ? ' (missed)' : '') +
          (fin(s.q) ? ' @' + rqSay(s.q) : '');
      }).join(', '));
    });
    if (wo.mc && mcValid(wo.mc) && mcScore(wo.mc)) out.push('Circuit: ' + mcSay(wo.mc) + ' \u2014 ' + mcScore(wo.mc));
    out.push('');
    out.push(setsOf(wo) + (setsOf(wo) === 1 ? ' set' : ' sets') + ' \u00b7 ' + fmtBig(volOf(wo)) + ' ' + u);
    if (wo.nt) out.push('Note: ' + wo.nt);
    return out.join('\n');
  }
  /* For Nourish's day: each workout and activity that day, one line each,
     with the time it started where the time is known. */
  function dayText(k) {
    var lines = [];
    ix().list.forEach(function (wo) {
      if ((wo.dk || dayKey(new Date(wo.st))) !== k) return;
      lines.push('Workout: ' + wo.n + ', ' + (wo.en > wo.st ? hmSpan(wo.st, wo.en) + ' (' + dur(wo.en - wo.st) + ')' : hm(wo.st)) +
        ', ' + setsOf(wo) + (setsOf(wo) === 1 ? ' set' : ' sets'));
    });
    Object.keys(T.ax).map(function (key) { return T.ax[key]; }).filter(function (a) {
      return a && dayKey(new Date(a.st)) === k;
    }).sort(function (a, b) { return a.st - b.st; }).forEach(function (a) {
      lines.push('Activity: ' + axName(a) + ', ' + dur(a.min * 60000) + ', ' + LV[axLv(a)].toLowerCase());
    });
    return lines;
  }
  /* The same clipboard dance Nourish does: the async API where it is
     allowed, a selected box where it is not. The button says how it went. */
  function copyText(text, btn) {
    var was = btn ? btn.textContent : '';
    var said = function (ok) {
      if (!btn) return;
      btn.textContent = ok ? 'Copied' : 'Press and hold to copy';
      setTimeout(function () { btn.textContent = was; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { said(true); }, function () { said(false); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    said(ok);
  }

  function woSheetHTML(sh) {
    var wo = T.wo[sh.id];
    if (!wo) return '<div class="tr-note">That workout has gone.</div>';
    if (S.ed && S.ed.id === wo.id) return edHTML(wo);
    var prs = prsIn(wo);
    var armed = S.arm === 'del:' + wo.id;
    return '<h2 class="sheet-name tr-sn2">' + esc(wo.n) + '</h2>' +
      '<div class="tr-sub">' + when(wo.st) + ' · ' + (wo.en > wo.st ? hmSpan(wo.st, wo.en) + ' · ' + dur(wo.en - wo.st) : hm(wo.st)) + ' · ' + setsOf(wo) + ' sets · ' +
        fmtBig(volOf(wo)) + ' ' + T.pr.u + (wo.im === 's' ? ' · from Strong' : '') + (wo.ed ? ' · edited' : '') + '</div>' +
      (prs.length ? '<div class="tr-prs">' + prs.map(function (p) {
        return '<div>\ud83e\udd47 ' + esc(lib(p.e).n) + ' \u2014 ' + esc(p.what) + '</div>';
      }).join('') + '</div>' : '') +
      (wo.mc && mcValid(wo.mc) ? '<div class="tr-wx"><span class="tr-wx-n">Circuit \u00b7 ' + esc(mcScore(wo.mc)) + '</span>' +
        '<div class="tr-sub">' + esc(mcSay(wo.mc)) + '</div></div>' : '') +
      (wo.nt ? '<div class="tr-wont">' + esc(wo.nt) + '</div>' : '') +
      wo.x.map(function (x) {
        return '<div class="tr-wx"><button class="tr-lnk tr-wx-n" data-t="exsheet" data-e="' + esc(x.e) + '">' + esc(lib(x.e).n) + '</button>' +
          '<ol class="tr-wx-s">' + x.s.map(function (s) {
            var w = conv(s.w, wo.u), e1 = !counts(s) ? 0 : e1Of(x.e, w, s.r, bwFor(x.e, wo));
            return '<li>' + setTag(s) + (w > 0 ? (BWL[x.e] ? '+' : '') + fmtN(w) + ' ' + T.pr.u + (ASST[x.e] ? ' help' : '') + ' × ' : '') + s.r +
              (fin(s.q) ? ' <span class="tr-e1">' + rqSay(s.q) + '</span>' : '') +
              (e1 > 0 ? ' <span class="tr-e1">est. max ' + Math.round(e1) + '</span>' : '') + '</li>';
          }).join('') + '</ol></div>';
      }).join('') +
      '<div class="tr-acts"><button class="ghost" data-t="edopen" data-id="' + esc(wo.id) + '">Edit</button>' +
        '<button class="ghost" data-t="wocopy" data-id="' + esc(wo.id) + '">Copy as text</button>' +
        '<button class="ghost" data-t="rtsave" data-id="' + esc(wo.id) + '">Save as routine</button>' +
        '<button class="ghost danger" data-t="delwo" data-id="' + esc(wo.id) + '">' +
        (armed ? 'Tap again to delete for good' : 'Delete this workout') + '</button></div>';
  }

  /* ---------------------------------------------------- correcting a workout
   *
   * A typo in a saved set is a wrong record, a wrong chart and next week's
   * weights worked from the wrong number, so a saved workout can be put
   * right: weights, reps, sets in or out, an exercise forgotten, the note.
   * Edited in the unit you read in now; everything else about each set —
   * when it was ticked, a ramp, an all-out set — rides along untouched. */
  function edOpen(wo) {
    S.ed = {
      id: wo.id, err: '', nt: wo.nt || '', t0: dtVal(wo.st), t1: fin(wo.en) && wo.en > wo.st ? dtVal(wo.en) : '',
      x: wo.x.map(function (x) {
        return { e: x.e, pq: x.pq, s: x.s.map(function (s) {
          return { w: fmtN(conv(s.w, wo.u)), r: String(s.r), q: fin(s.q) ? String(Math.min(5, s.q)) : '', o: s,
            ty: s.wu ? 'w' : s.ty || '' };
        }) };
      })
    };
  }
  function edHTML(wo) {
    var E = S.ed;
    var rq = !!T.pr.rq || wo.x.some(function (x) { return x.s.some(function (s) { return fin(s.q); }); });
    return '<h2 class="sheet-name tr-sn2">Edit ' + esc(wo.n) + '</h2>' +
      '<div class="tr-sub">' + when(wo.st) + ' · in ' + T.pr.u + '. Records, charts and next week\u2019s weights follow what you save.</div>' +
      E.x.map(function (x, i) {
        var ex = lib(x.e);
        return '<div class="tr-wx tr-edx' + (rq ? ' tr-rq' : '') + '">' +
          '<div class="tr-edx-h"><span class="tr-wx-n">' + esc(ex.n) + '</span>' +
            '<button class="tr-lnk" data-t="edrmx" data-x="' + i + '">Remove</button></div>' +
          '<div class="tr-set tr-set-h tr-eds" aria-hidden="true"><span>Set</span><span>' + T.pr.u + '</span><span>Reps</span>' +
            (rq ? '<span>' + (rpeOn() ? 'RPE' : 'Spare') + '</span>' : '') + '<span></span></div>' +
          x.s.map(function (s, j) {
            var sk = { wu: s.ty === 'w', ty: s.ty === 'd' || s.ty === 'f' || s.ty === 'm' ? s.ty : undefined };
            return '<div class="tr-set tr-eds' + (sk.wu ? ' tr-wu' : sk.ty === 'd' ? ' tr-dd' : sk.ty === 'f' ? ' tr-ff' : sk.ty === 'm' ? ' tr-mm' : '') + '">' +
              '<button class="tr-sn tr-snb" data-t="edsty" data-x="' + i + '" data-s="' + j + '" aria-label="' + esc(setSay(sk)) + '. Tap to change">' +
                setLab(sk, function () { return j + 1; }) + '</button>' +
              '<input class="tr-in" data-ed="w" data-x="' + i + '" data-s="' + j + '" inputmode="decimal" autocomplete="off" value="' + esc(s.w) + '" ' +
                'aria-label="' + esc(ex.n) + ' set ' + (j + 1) + ' weight in ' + T.pr.u + '">' +
              '<input class="tr-in" data-ed="r" data-x="' + i + '" data-s="' + j + '" inputmode="numeric" autocomplete="off" value="' + esc(s.r) + '" ' +
                'aria-label="' + esc(ex.n) + ' set ' + (j + 1) + ' reps">' +
              (rq ? rqSel(s.q, 'data-ed="q" data-x="' + i + '" data-s="' + j + '"', ex.n + ' set ' + (j + 1) + ' reps to spare') : '') +
              '<button class="tr-tick tr-edrm" data-t="edrm" data-x="' + i + '" data-s="' + j + '" aria-label="Remove ' + esc(ex.n) + ' set ' + (j + 1) + '">&times;</button>' +
            '</div>';
          }).join('') +
          '<div class="tr-ex-a"><button class="tr-lnk" data-t="edadd" data-x="' + i + '">+ Set</button></div>' +
        '</div>';
      }).join('') +
      '<div class="tr-acts"><button class="ghost" data-t="edaddx">+ Add an exercise</button></div>' +
      '<div class="tr-q"><div class="tr-ql">When</div><div class="tr-times">' +
        '<label class="tr-tml"><span>Started</span><input class="txt" type="datetime-local" id="trEdT0" value="' + esc(E.t0) + '"></label>' +
        '<label class="tr-tml"><span>Ended</span><input class="txt" type="datetime-local" id="trEdT1" value="' + esc(E.t1) + '"></label>' +
      '</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Notes <span class="tr-opt">optional</span></div>' +
        '<textarea class="txt tr-nt" id="trEdNt" maxlength="1000" rows="2" aria-label="Notes on this workout">' + esc(E.nt) + '</textarea></div>' +
      (E.err ? '<div class="tr-note tr-warn">' + esc(E.err) + '</div>' : '') +
      '<div class="tr-acts"><button class="btn-primary" data-t="edsave">Save changes</button>' +
        '<button class="ghost" data-t="edcancel">Cancel</button></div>';
  }
  /* Saved in the unit you read in now. A set with no reps is not a set, so
     it goes; one with reps it could not read says so rather than guessing. */
  function edSave() {
    var E = S.ed, wo = E && T.wo[E.id];
    if (!wo) { S.ed = null; return false; }
    var bad = '';
    var x = E.x.map(function (x) {
      var out = { e: x.e, s: [] };
      if (fin(x.pq)) out.pq = x.pq;
      x.s.forEach(function (s) {
        // a missed attempt keeps its weight with no reps; any other empty set goes
        if (s.ty !== 'm' && (String(s.r).trim() === '' || numIn(s.r) === 0)) return;
        if (s.ty === 'm' && String(s.r).trim() === '') s.r = '0';
        var w = String(s.w).trim() === '' ? 0 : numIn(s.w), r = numIn(s.r);
        if (w === null || r === null || w < 0 || w > 5000 || r < 0 || r > 1000) { bad = bad || lib(x.e).n; return; }
        var o = { w: w, r: Math.round(r) };
        if (s.o) {
          if (fin(s.o.t)) o.t = s.o.t;
          if (s.o.am) { o.am = 1; if (fin(s.o.tr)) o.tr = s.o.tr; }
        }
        if (s.ty === 'w') o.wu = 1;
        else if (s.ty === 'd' || s.ty === 'f' || s.ty === 'm') o.ty = s.ty;
        var q = numIn(s.q);
        if (q !== null && q >= 0 && q <= 10) o.q = q;
        out.s.push(o);
      });
      return out;
    }).filter(function (x) { return x.s.length; });
    if (bad) { E.err = 'A set of ' + bad + ' has a number that could not be read. Fix it or take it out.'; return false; }
    /* Times left as they were keep their seconds: the boxes only hold
       minutes, and a short workout read back through them would end in the
       minute it started. */
    var t0was = dtVal(wo.st), t1was = fin(wo.en) && wo.en > wo.st ? dtVal(wo.en) : '';
    var st = E.t0 === t0was ? wo.st : dtParse(E.t0);
    var en = E.t1 === t1was ? (t1was ? wo.en : null) : E.t1 ? dtParse(E.t1) : null;
    var tb = timesBad(st, en);
    if (tb) { E.err = tb; return false; }
    if (!x.length && !wo.mc) { E.err = 'Nothing would be left. To get rid of the whole workout, cancel and delete it.'; return false; }
    var nw = clean(wo);
    // the sets come back in your unit now, and the day's bodyweight with them
    if (fin(wo.bw) && wo.u !== T.pr.u) nw.bw = conv(wo.bw, wo.u);
    nw.u = T.pr.u;
    nw.x = x;
    nw.st = st;
    nw.dk = dayKey(new Date(st));
    if (en !== null) nw.en = en; else delete nw.en;
    var nt = String(E.nt || '').trim().slice(0, 1000);
    if (nt) nw.nt = nt; else delete nw.nt;
    nw.ed = Date.now();
    T.wo[wo.id] = clean(nw);
    stamp('wo', wo.id);
    S.ed = null;
    return true;
  }

  /* Plates for one side of the bar, heaviest first. Whatever cannot be made
     from the plates there are is said, rather than rounded away. */
  function plateMath(total, bar, unit, inv) {
    var set = unit === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
    var side = (total - bar) / 2;
    var out = [];
    if (!(side > 0)) return { plates: out, left: 0, under: total < bar };
    if (inv) return plateHave(side, inv);
    var left = side;
    set.forEach(function (p) {
      while (left >= p - 1e-9) { out.push(p); left = Math.round((left - p) * 1000) / 1000; }
    });
    return { plates: out, left: left, under: false };
  }

  /* One side from the plates you have: exactly if they can, in the fewest
     plates, the big ones first; else as close under as they come, and what
     is left said. A search, not the greedy pass, because 20 + 20 makes 40
     where a 25 first leaves 15 no pair of yours can make. */
  function plateHave(side, inv) {
    var sizes = Object.keys(inv).map(Number).filter(function (k) { return inv[k] > 0; }).sort(function (a, b) { return b - a; });
    var best = null, used = [], nodes = 0;
    (function go(i, left) {
      if (++nodes > 50000 || (best && best.left === 0)) return;
      if (i === sizes.length || left < 1e-9) {
        var l = Math.round(left * 1000) / 1000;
        if (!best || l < best.left - 1e-9 || (Math.abs(l - best.left) < 1e-9 && used.length < best.plates.length)) best = { plates: used.slice(), left: l };
        return;
      }
      var p = sizes[i], mx = Math.min(inv[p], Math.floor((left + 1e-9) / p));
      for (var k = mx; k >= 0; k--) {
        for (var a = 0; a < k; a++) used.push(p);
        go(i + 1, Math.round((left - k * p) * 1000) / 1000);
        used.length -= k;
      }
    }(0, side));
    best = best || { plates: [], left: side };
    return { plates: best.plates, left: best.left, under: false, short: best.left > 0, have: 1 };
  }

  function platesHTML(sh) {
    var w = numIn(sh.w);
    var bar = sh.e ? barAt(sh.e) : homeNow() ? homeBar() : T.pr.bar;
    var pm = w === null ? null : plateMath(w, bar, T.pr.u, homeInv());
    return '<h2 class="sheet-name tr-sn2">Plates' + (sh.e ? ' for ' + esc(lib(sh.e).n) : '') + '</h2>' +
      '<div class="tr-own-r"><input class="txt" id="trPlateW" inputmode="decimal" value="' + esc(w === null ? '' : fmtN(w)) + '" aria-label="Total weight">' +
        '<span class="tr-sub">' + T.pr.u + ' on a ' + fmtN(bar) + ' ' + T.pr.u + ' bar</span></div>' +
      (sh.e && !homeNow() ? '<div class="tr-q"><div class="tr-ql">Bar</div>' + barChoices(sh.e) + '</div>' : '') +
      (homeNow() ? '<div class="tr-hint">At home: your bar and your plates, from Settings.</div>' : '') +
      (pm === null ? '<div class="tr-note">Type the total weight.</div>'
        : pm.under ? '<div class="tr-note">That is less than the bar.</div>'
          : '<div class="tr-plates">' + (pm.plates.length ? pm.plates.map(function (p) {
            return '<span class="tr-plate p' + String(p).replace('.', '_') + ' ' + plCls(p) + '">' + fmtP(p) + '</span>';
          }).join('') : '<span class="tr-note">Just the bar.</span>') + '</div>' +
            '<div class="tr-sub">Each side' + (pm.left > 0 ? ' — ' + fmtP(pm.left) + ' ' + T.pr.u + ' short (' + fmtP(pm.left * 2) + ' ' + T.pr.u + ' on the bar) with ' + (pm.have ? 'the plates you have at home' : 'standard plates') : '') + '.</div>');
  }

  /* A warm-up that rehearses the lift without tiring it: half the working
     weight for eight, then fewer reps as it climbs. None of these count as
     sets; they are not logged. */
  /* A warm-up ramp to the heaviest working set, not to the first set (which
     on a main lift's day is itself a ramp set). Heavier and fewer reps the
     closer it gets, more steps before a heavy triple than before a set of
     twelve, and no empty-bar set before a pull from the floor. */
  function warmRows(x) {
    var ex = lib(x.e), w = 0, reps = 0;
    x.s.forEach(function (z) {
      if (z.wu) return;
      var v = numIn(z.w);
      if (v === null) v = fin(z.tw) ? z.tw : fin(z.pw) ? z.pw : null;
      if (v > w) { w = v; reps = numIn(z.r) || z.tr || z.pr || 0; }
    });
    if (!(w > 0)) return { w: 0, rows: [] };
    var step = inc(ex), bb = onBar(ex), bar = barAt(x.e);
    var plan = reps && reps <= 5 ? [[0.4, 5], [0.55, 3], [0.7, 2], [0.8, 1], [0.9, 1]]
      : reps && reps <= 8 ? [[0.45, 5], [0.6, 3], [0.75, 2], [0.85, 1]] : [[0.5, 8], [0.7, 4], [0.85, 2]];
    var rows = [];
    if (bb && bar > 0 && bar < w * 0.4 && ex.p !== 'hinge') rows.push([bar, 10]);
    plan.forEach(function (r) {
      var v = roundTo(w * r[0], step);
      if (bb && v < bar) return;
      if (v >= w) return;
      if (rows.length && v <= rows[rows.length - 1][0]) return;
      rows.push([v, r[1]]);
    });
    return { w: w, rows: rows };
  }
  function warmHTML(sh) {
    var x = LIVE && LIVE.x[sh.x];
    if (!x) return '';
    var ex = lib(x.e), R = warmRows(x);
    if (!(R.w > 0)) return '<h2 class="sheet-name tr-sn2">Warm-up</h2><div class="tr-note">Put a weight in a working set and the ramp works itself out from it.</div>';
    var bb = onBar(ex), bar = barAt(x.e);
    var has = x.s.some(function (z) { return z.wu && !z.t; });
    return '<h2 class="sheet-name tr-sn2">Warm-up for ' + esc(ex.n) + '</h2>' +
      '<div class="tr-sub">Up to your heaviest working set, ' + fmtN(R.w) + ' ' + T.pr.u + '.</div>' +
      '<ol class="tr-warm">' + R.rows.map(function (r) {
        var pm = bb ? plateMath(r[0], bar, T.pr.u, homeInv()) : null;
        return '<li><b>' + fmtN(r[0]) + ' ' + T.pr.u + ' × ' + r[1] + '</b>' +
          (pm ? '<span class="tr-sub"> ' + (pm.plates.length ? pm.plates.map(fmtP).join(' + ') + ' a side' : SLED[x.e] ? 'the empty sled' : 'the bar') + '</span>' : '') + '</li>';
      }).join('') + '</ol>' +
      (R.rows.length ? '<div class="tr-acts"><button class="btn-primary" data-t="warmadd" data-x="' + sh.x + '">' +
        (has ? 'Replace my warm-up sets with these' : 'Add these as warm-up sets') + '</button></div>' +
        '<div class="tr-hint">Added, they are W sets: logged, never records, a minute\u2019s rest after each.</div>' : '');
  }
  // the ramp into the workout as W sets, ahead of the working sets; any not yet done are replaced
  function warmAdd(xi) {
    var x = LIVE && LIVE.x[xi];
    if (!x) return;
    var R = warmRows(x);
    if (!R.rows.length) return;
    var keep = x.s.filter(function (z) { return !z.wu || z.t; });
    var ws = R.rows.map(function (r) { return { w: '', r: '', t: 0, tw: r[0], tr: r[1], pw: null, pr: null, wu: 1 }; });
    var doneW = keep.filter(function (z) { return z.wu; });
    x.s = doneW.concat(ws, keep.filter(function (z) { return !z.wu; }));
    remapPrev(x);
  }

  /* Sets with a number typed in and never ticked. They were dropped with the
     empty ones, and the how-to's grey numbers make a new lifter think typing
     is logging. Finish offers them instead: ticked as they would have been
     on the set itself, the grey number filling whichever box was left. */
  function typedOpen() {
    var out = [];
    LIVE.x.forEach(function (x, xi) {
      x.s.forEach(function (s, si) {
        if (s.t || (numIn(s.w) === null && numIn(s.r) === null)) return;
        var g = ghost(xi, si), miss = s.ty === 'm', w = numIn(s.w), r = numIn(s.r);
        if (w === null) w = g.w === null && onBody(x.e) ? 0 : g.w;
        if (r === null) r = miss ? 0 : g.r;
        if (w === null || r === null || r < 0 || (r <= 0 && !miss)) return;
        out.push({ xi: xi, si: si, w: w, r: r });
      });
    });
    return out;
  }
  function tickTyped() {
    var now = Date.now();
    typedOpen().forEach(function (o) { var s = LIVE.x[o.xi].s[o.si]; s.w = o.w; s.r = o.r; s.t = now; });
    saveLive();
  }
  function finishHTML() {
    if (!LIVE) return '';
    var wo = finished();
    var open = LIVE.x.reduce(function (n, x) { return n + x.s.filter(function (s) { return !s.t; }).length; }, 0);
    var typed = typedOpen().length, empty = open - typed;
    var typedSay = typed ? '<div class="tr-note tr-warn tr-typed">' + typed + ' set' + (typed === 1 ? ' has' : 's have') + ' numbers typed in but ' +
      (typed === 1 ? 'wasn\u2019t' : 'weren\u2019t') + ' ticked.</div>' : '';
    var prs = prsIn(wo);
    var missing = [];
    if (LIVE.ms) {
      uniq(wo.x.map(function (x) { return musOf(x.e); })).forEach(function (m) {
        var f = fbAll(m).v;
        if ((!noPump(m) && !fin(f.p)) || !fin(f.k) || healNeed(m)) missing.push(m);
      });
    }
    if (!wo.x.length && !wo.mc) {
      return '<h2 class="sheet-name tr-sn2">Nothing ticked yet</h2>' +
        (typed ? typedSay + '<div class="tr-acts"><button class="btn-primary" data-t="ticktyped">Tick ' + (typed === 1 ? 'it' : 'them') + ' and save</button></div>'
          : '<div class="tr-note">Only ticked sets are saved, and there are none. Keep going, or discard the workout.</div>') +
        '<div class="tr-acts"><button class="' + (typed ? 'ghost' : 'btn-primary') + '" data-t="close">Keep going</button>' +
          '<button class="ghost danger" data-t="discardnow">' + (S.arm === 'discard' ? 'Tap again to discard' : 'Discard it') + '</button></div>';
    }
    var sh = S.sheet || {};
    return '<h2 class="sheet-name tr-sn2">' + esc(LIVE.n) + '</h2>' +
      '<div class="tr-when">' + when(wo.st) + ' \u00b7 ' + hmSpan(wo.st, wo.en) +
        (sh.tm ? '' : ' <button class="tr-lnk" data-t="fintimes">Change times</button>') + '</div>' +
      (sh.tm ? timesHTML(wo.st, wo.en, 'fin') : '') +
      '<div class="tr-recs">' +
        rec('Time', dur(wo.en - wo.st)) + rec('Sets', setsOf(wo)) +
        rec('Total lifted', fmtBig(volOf(wo)) + ' ' + T.pr.u) + rec('Records', prs.length) +
      '</div>' +
      (prs.length ? '<div class="tr-prs">' + prs.map(function (p) {
        return '<div>\ud83e\udd47 ' + esc(lib(p.e).n) + ' \u2014 ' + esc(p.what) + '</div>';
      }).join('') + '</div>' : '') +
      typedSay +
      (empty ? '<div class="tr-note">' + empty + (typed ? ' empty' : '') + ' set' + (empty === 1 ? ' was' : 's were') + ' never ticked and will not be saved.</div>' : '') +
      (LIVE.mc ? '<div class="tr-note">' + (wo.mc ? 'Circuit: ' + esc(mcScore(wo.mc)) + (LIVE.mc.last ? ', against ' + esc(mcScore(LIVE.mc.last)) + ' last time' : '') + '.'
        : 'The circuit has no score yet \u2014 add it on the circuit card, or it will not be saved.') + '</div>' : '') +
      (missing.length ? '<div class="tr-ask"><div class="tr-ql">Before you go — next week’s sets come from these</div>' +
        missing.map(function (m) {
          var f = fbAll(m).v;
          return (healNeed(m) ? segQ(esc(mname(m)) + ' since last time', 'sore', '', SORE.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '"') : '') +
            (noPump(m) ? '' : segQ(esc(mname(m)) + ' pump', 'fb', fin(f.p) ? f.p : '', PUMP.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '" data-f="p"')) +
            segQ(esc(mname(m)) + ' workload', 'fb', fin(f.k) ? f.k : '', WORK.map(function (t, i) { return [i, t]; }), ' data-m="' + m + '" data-f="k"');
        }).join('') + '</div>' : '') +
      '<div class="tr-q"><div class="tr-ql">Notes <span class="tr-opt">optional</span></div>' +
        '<textarea class="txt tr-nt" id="trWoNt" maxlength="1000" rows="2" aria-label="Notes on this workout" ' +
          'placeholder="Slept badly. Left knee fine today.">' + esc(LIVE.nt || '') + '</textarea></div>' +
      '<div class="tr-note">Saving marks ' + (wo.dk === dayKey(new Date()) ? 'today' : 'that day') + ' as a training day in Nourish.</div>' +
      (typed ? '<div class="tr-acts"><button class="btn-primary" data-t="ticktyped">Tick ' + (typed === 1 ? 'it' : 'them') + ' and save</button>' +
          '<button class="ghost" data-t="save">Save without ' + (typed === 1 ? 'it' : 'them') + '</button></div>' +
          '<div class="tr-acts"><button class="ghost" data-t="close">Keep going</button></div>'
        : '<div class="tr-acts"><button class="btn-primary" data-t="save">Save workout</button>' +
          '<button class="ghost" data-t="close">Keep going</button></div>');
  }

  /* Start and end as date-and-time boxes, for putting a workout at the time
     of day it happened: a Finish pressed at the car, a start pressed at the
     second set. What Google Health is told is what these say. */
  function timesHTML(st, en, k) {
    var err = S.tmErr || '';
    return '<div class="tr-times">' +
      '<label class="tr-tml"><span>Started</span><input class="txt" type="datetime-local" id="trT0-' + k + '" value="' + dtVal(st) + '"></label>' +
      (en !== undefined ? '<label class="tr-tml"><span>Ended</span><input class="txt" type="datetime-local" id="trT1-' + k + '" value="' +
        (fin(en) ? dtVal(en) : '') + '"></label>' : '') +
      (err ? '<div class="tr-note tr-warn">' + esc(err) + '</div>' : '') +
      (k === 'fin' ? '<div class="tr-acts"><button class="ghost" data-t="fintimeset">Use these times</button></div>' : '') +
    '</div>';
  }
  function startHTML() {
    if (!LIVE) return '';
    return '<h2 class="sheet-name tr-sn2">When you started</h2>' +
      '<div class="tr-sub">Started ' + hm(LIVE.st) + ', ' + dur(Date.now() - LIVE.st) + ' ago. Set it to when you really began, and the workout is logged at that time of day.</div>' +
      timesHTML(LIVE.st, undefined, 'live') +
      '<div class="tr-acts"><button class="btn-primary" data-t="livetimeset">Save</button></div>';
  }

  /* What a workout won. Records as the log already counts them (heavier,
     a better estimated max, more reps with nothing on the bar), each set
     that did it, and a new best at a rep count: the heaviest you have
     lifted for that many reps, where you had lifted that many before. And
     the milestones: the 10th workout, the 50th, a block finished. */
  var MILESTONES = [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
  function nth(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function wins(wo) {
    var list = ix().list, count = list.filter(function (w) { return w.st <= wo.st; }).length;
    var sets = {}, lines = [];
    wo.x.forEach(function (x, xi) {
      var had = records(x.e, wo.st);
      var pastAt = function (n) {
        var best = 0;
        list.forEach(function (w) {
          if (w.st >= wo.st) return;
          var px = exIn(w, x.e);
          if (px) px.s.forEach(function (z) { if (counts(z) && z.r >= n) best = Math.max(best, conv(z.w, w.u)); });
        });
        return best;
      };
      /* Only the day's best set takes each record: two sets past the old
         best are one record, not two. */
      var work = [], top = { w: 0, e: 0, r: 0, wr: 0 }, got = {};
      x.s.forEach(function (s, si) { if (counts(s)) work.push({ i: si, w: conv(s.w, wo.u), r: s.r }); });
      var bwx = bwFor(x.e, wo);
      work.forEach(function (z) {
        top.w = Math.max(top.w, z.w);
        top.e = Math.max(top.e, e1Of(x.e, z.w, z.r, bwx));
        if (z.w === 0) top.r = Math.max(top.r, z.r);
      });
      // the heaviest set with the most reps at that weight
      work.forEach(function (z) { if (z.w === top.w) top.wr = Math.max(top.wr, z.r); });
      var first = function (k, yes) { if (!yes || got[k]) return false; got[k] = 1; return true; };
      // a set another set that day matched or beat on both weight and reps
      var covered = function (si, w, r) {
        return work.some(function (z) { return z.i !== si && z.w >= w && z.r >= r && (z.w > w || z.r > r || z.i < si); });
      };
      var said = [];
      x.s.forEach(function (s, si) {
        if (!counts(s)) return;
        var w = conv(s.w, wo.u), e = e1Of(x.e, w, s.r, bwx), what = [];
        if (first('w', had.w > 0 && w > had.w && w === top.w && s.r === top.wr)) what.push('heaviest');
        if (first('e', had.e1 > 0 && e > had.e1 + 0.01 && e === top.e)) what.push('best est. max');
        if (first('r', w === 0 && !(had.w > 0) && had.r > 0 && s.r > had.r && s.r === top.r)) what.push('most reps');
        // more help is never a best
        var at = w > 0 && !ASST[x.e] ? pastAt(s.r) : 0;
        if (!what.length && at > 0 && w > at && !covered(si, w, s.r)) what.push('best for ' + s.r + ' reps');
        if (what.length) {
          sets[xi + ':' + si] = what.join(', ');
          what.forEach(function (t) { if (said.indexOf(t) < 0) said.push(t); });
        }
      });
      if (said.length) lines.push({ e: x.e, what: said.join(', '), big: said.some(function (t) { return t === 'heaviest' || t === 'best est. max' || t === 'most reps'; }) });
    });
    var ms = [];
    if (MILESTONES.indexOf(count) >= 0) ms.push(count === 1 ? 'Your first workout here' : 'Your ' + nth(count) + ' workout');
    /* The block finished by this workout: the last of it, and not a repeat
       of a day already done. */
    var blk = wo.ms && T.ms[wo.ms];
    var not = blk && list.some(function (w) {
      return w !== wo && w.ms === wo.ms && (w.st > wo.st || (w.w === wo.w && w.d === wo.d && w.st < wo.st));
    });
    if (blk && !not && !nextSlot(blk)) ms.push('Block complete: ' + blk.n);
    return { sets: sets, lines: lines, ms: ms, count: count,
      big: ms.length > 0 || lines.some(function (l) { return l.big; }) };
  }
  function doneHTML2(sh) {
    var wo = T.wo[sh.id];
    if (!wo) return '';
    var won = wins(wo);
    /* Records are what History stars and Finish counts: the heaviest, the
       best estimated max, the most reps. A best for a number of reps is
       ribboned too, but said as what it is rather than counted as one. */
    var recN = won.lines.filter(function (l) { return l.big; }).length, repN = won.lines.length - recN;
    var head = won.ms.length ? won.ms[0] + '!'
      : recN ? (recN === 1 ? 'A new record!' : recN + ' new records!')
      : repN ? (repN === 1 ? 'A best for its reps!' : repN + ' bests for their reps!')
      : 'Workout ' + won.count + ' done';
    return '<div class="tr-done">' +
      (LSBAD['bsc.train'] && S.justSaved === wo.id ? '<div class="tr-note tr-warn tr-lsfull" role="alert">This phone\u2019s storage for the app is full, so this workout isn\u2019t saved on it' +
        (doc && !SY.err ? ' \u2014 it\u2019s in your account.' : '. It comes back as the workout in progress when you reopen the app; export a copy from Settings or free some space first.') + '</div>' : '') +
      '<div class="tr-done-h">' + esc(head) + '</div>' +
      '<div class="tr-sub">' + esc(wo.n) + ' \u00b7 ' + when(wo.st) + ' \u00b7 ' + (wo.en > wo.st ? hmSpan(wo.st, wo.en) : hm(wo.st)) + '</div>' +
      (won.count === 1 ? '<div class="tr-note">Personal bests start today. Beat any of these numbers next time and it earns a \ud83e\udd47.</div>' : '') +
      (won.ms.length > 1 ? '<div class="tr-done-ms">' + won.ms.slice(1).map(function (m) { return '\ud83c\udfc5 ' + esc(m); }).join('<br>') + '</div>' : '') +
      '<div class="tr-recs">' +
        rec('Time', wo.en > wo.st ? dur(wo.en - wo.st) : '\u2014') + rec('Sets', setsOf(wo)) +
        rec('Total lifted', fmtBig(volOf(wo)) + ' ' + T.pr.u) + rec('Records', recN + (repN ? ' <small>+' + repN + ' rep best' + (repN === 1 ? '' : 's') + '</small>' : '')) +
      '</div>' +
      (won.lines.length ? '<div class="tr-done-r">' + won.lines.map(function (l) {
        return '<div><span class="tr-medal" aria-hidden="true">\ud83e\udd47</span> <b>' + esc(lib(l.e).n) + '</b> \u2014 ' + esc(l.what) + '</div>';
      }).join('') + '</div>' : '') +
      wo.x.map(function (x, xi) {
        var num = 0;
        return '<div class="tr-wx"><span class="tr-wx-n">' + esc(lib(x.e).n) + '</span><ol class="tr-wx-s">' + x.s.map(function (s, si) {
          var w = conv(s.w, wo.u), win = won.sets[xi + ':' + si];
          return '<li' + (win ? ' class="tr-won"' : '') + '><span class="tr-hs-l">' + setLab(s, function () { return ++num; }) + '</span>' +
            (w > 0 ? fmtN(w) + ' ' + T.pr.u + (ASST[x.e] ? ' help' : '') + ' \u00d7 ' : '') + s.r +
            (win ? ' <span class="tr-ribbon" title="' + esc(win) + '">\ud83e\udd47 ' + esc(win) + '</span>' : '') + '</li>';
        }).join('') + '</ol></div>';
      }).join('') +
      (wo.nt ? '<div class="tr-wont">' + esc(wo.nt) + '</div>' : '') +
      '<div class="tr-acts"><button class="btn-primary" data-t="close">Done</button>' +
        '<button class="ghost" data-t="wocopy" data-id="' + esc(wo.id) + '">Copy as text</button>' +
        '<button class="ghost" data-t="rtsave" data-id="' + esc(wo.id) + '">Save as routine</button></div>' +
    '</div>';
  }

  /* Confetti across the whole screen for a couple of seconds, more of it
     for a record or a milestone, none for anyone who has asked their phone
     for less motion. Drawn on a canvas that takes no taps and removes
     itself. */
  var CONFETTI = ['#2f6fe0', '#2e9e57', '#e8c440', '#d8452f', '#b86a2e', '#f2efe6'];
  function confetti(big) {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    } catch (e) { /* old browser: go ahead */ }
    var old = document.getElementById('trConfetti');
    if (old) old.remove();
    var c = document.createElement('canvas');
    c.id = 'trConfetti';
    c.className = 'tr-confetti';
    c.setAttribute('aria-hidden', 'true');
    var W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    document.body.appendChild(c);
    var ctx = c.getContext && c.getContext('2d');
    if (!ctx) { c.remove(); return false; }
    ctx.scale(dpr, dpr);
    var n = big ? 170 : 80, bits = [];
    for (var i = 0; i < n; i++) {
      bits.push({ x: W * (0.2 + Math.random() * 0.6), y: H * 0.35 + Math.random() * 40,
        vx: (Math.random() - 0.5) * (big ? 13 : 9), vy: -(Math.random() * (big ? 14 : 10) + 4),
        s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: CONFETTI[i % CONFETTI.length] });
    }
    var t0 = Date.now(), life = big ? 2800 : 2000;
    var step = function () {
      var el = Date.now() - t0;
      if (el > life || !c.parentNode) { if (c.parentNode) c.remove(); return; }
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, el - life * 0.6) / (life * 0.4));
      bits.forEach(function (b) {
        b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
      });
      (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(step);
    };
    step();
    return true;
  }
  /* A chime rising up a chord, and a fuller one for a record: the tap on
     Save is what lets the phone play it. A phone on silent may keep it
     quiet, which no web page can change. */
  function chime(big) {
    try { if (navigator.vibrate) navigator.vibrate(big ? [60, 50, 60, 50, 160] : [80, 60, 80]); } catch (e) { /* no buzz here */ }
    if (!AC) return false;
    try {
      var notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
      notes.forEach(function (f, i) {
        var o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + i * 0.11;
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i === notes.length - 1 ? 0.9 : 0.35));
        o.connect(g); g.connect(AC.destination);
        o.start(t0); o.stop(t0 + 1);
      });
      return true;
    } catch (e) { return false; }
  }
  function celebrate(big) {
    S.cele = { big: !!big, at: Date.now(), confetti: false, chime: false };
    if (!T.pr.yay) return;
    S.cele.confetti = confetti(big);
    S.cele.chime = chime(big);
  }

  function planSheetHTML(sh) {
    var ms = active();
    if (!ms || !ms.days[sh.d]) return '';
    if (isEz(ms, sh.d)) {
      return '<h2 class="sheet-name tr-sn2">Easy day</h2>' +
        '<div class="tr-sub">Week ' + (sh.w + 1) + '</div>' + ezHTML(ms, sh.w, sh.d);
    }
    var p = plan(ms, sh.w, sh.d);
    var wo = woFor(ms, sh.w, sh.d);
    return '<h2 class="sheet-name tr-sn2">' + esc(p.n) + '</h2>' +
      '<div class="tr-sub">' + (p.deload ? 'Deload week' : 'Week ' + (sh.w + 1) + ' · ' + effSay(p.rir)) +
        (wo ? ' · done ' + when(wo.st) : '') + '</div>' +
      planList(p, ms) +
      '<div class="tr-acts">' +
        (wo ? '<button class="ghost" data-t="wosheet" data-id="' + esc(wo.id) + '">See what you did</button>' : '') +
        (!LIVE ? '<button class="btn-primary" data-t="start" data-w="' + sh.w + '" data-d="' + sh.d + '">' + (wo ? 'Do it again' : 'Start this one') + '</button>' : '') +
      '</div>';
  }

  var AGO = [[0, 'Today'], [1, 'Yesterday'], [2, '2 days ago'], [3, '3 days ago']];
  function axNewHTML(sh) {
    var h = HABITS[sh.h];
    var opts = [15, 30, 45, 60, 90, 120, 180, 240, 300].map(function (m) { return [m, m < 60 ? m + ' min' : dur(m * 60000)]; });
    return '<h2 class="sheet-name tr-sn2">' + esc(h ? (sh.h === 'other' && sh.nm ? sh.nm : h.n) : 'Log an activity') + '</h2>' +
      (sh.pick ? q('What', chips('axk', sh.h, HAB_ORDER.map(function (k) { return [k, HABITS[k].n]; }))) : '') +
      (sh.h === 'other' ? q('Called <span class="tr-opt">optional</span>', '<input class="txt tr-axnm" id="trAxNm" maxlength="40" autocomplete="off" aria-label="Called (optional)" ' +
        'placeholder="Surfing, moving house, a hard day on the farm" value="' + esc(sh.nm || '') + '">') : '') +
      (h ? q('How hard', chips('axlv', sh.lv, [['l', 'Light'], ['m', 'Moderate'], ['v', 'Vigorous']]),
          'Moderate: you can talk but not sing. Vigorous: only a few words between breaths. A vigorous minute counts twice toward the week; a light one is logged but not counted.') +
        q('How long', chips('axmin', sh.min, opts)) +
        q('When', chips('axago', sh.ago, AGO)) +
        '<div class="tr-acts"><button class="btn-primary" data-t="axsave">Log it</button></div>' : '');
  }
  function axSheetHTML(sh) {
    var a = T.ax[sh.id];
    if (!a) return '<div class="tr-note">That has gone.</div>';
    return '<h2 class="sheet-name tr-sn2">' + esc(axName(a)) + '</h2>' +
      '<div class="tr-sub">' + when(a.st) + ' · ' + dur(a.min * 60000) + ' · ' + LV[axLv(a)].toLowerCase() + '</div>' +
      (a.ms && T.ms[a.ms] ? '<div class="tr-note">Counted as the easy day in week ' + (a.w + 1) + ' of ' + esc(T.ms[a.ms].n) + '.</div>' : '') +
      '<div class="tr-acts"><button class="ghost danger" data-t="axdel" data-id="' + esc(a.id) + '">' +
        (S.arm === 'axdel:' + a.id ? 'Tap again to delete' : 'Delete') + '</button></div>';
  }

  function barChoices(e) {
    var cur = barFor(e), u = T.pr.u;
    return '<div class="tr-bars" role="group">' + BARS.map(function (b) {
      var w = u === 'kg' ? b.kg : b.lb;
      return '<button class="tr-barr" data-t="barset" data-v="' + w + '" data-e="' + esc(e) + '" aria-pressed="' + (cur === w) + '">' +
        '<span class="tr-barr-n">' + esc(b.n) + '</span><span class="tr-barr-w">' + fmtN(w) + ' ' + u + '</span></button>';
    }).join('') + '</div>';
  }
  var REST_OPTS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
  function restHTML(sh) {
    var ex = lib(sh.e), cur = restFor(ex), dflt = ex.k === 'c' ? T.pr.rc : T.pr.ri;
    return '<h2 class="sheet-name tr-sn2">Rest for ' + esc(ex.n) + '</h2>' +
      '<div class="tr-sub">After each set of it, from now on. The default for ' + (ex.k === 'c' ? 'compound lifts' : 'isolation work') + ' is ' + clock(dflt) +
        ' (Settings). A warm-up rests a minute at most; paired sets use the pair\u2019s rest, ' + clock(T.pr.rp) + '.</div>' +
      '<div class="tr-q">' + chips('restset', cur, REST_OPTS.map(function (s) { return [s, clock(s)]; }), ' data-e="' + esc(sh.e) + '"') + '</div>' +
      (restSet(sh.e) ? '<div class="tr-acts"><button class="ghost" data-t="restset" data-v="def" data-e="' + esc(sh.e) + '">Back to the default, ' + clock(dflt) + '</button></div>' : '');
  }

  function barHTML(sh) {
    var ex = lib(sh.e);
    return '<h2 class="sheet-name tr-sn2">Bar for ' + esc(ex.n) + '</h2>' +
      '<div class="tr-sub">The plates are worked out from it. Remembered for ' + esc(ex.n) +
        '; every other barbell lift keeps its own, or the default bar in Settings (' + fmtN(T.pr.bar) + ' ' + T.pr.u + '). Weigh yours if you can: bars differ.</div>' +
      '<div class="tr-q">' + barChoices(sh.e) + '</div>' +
      '<div class="tr-q"><div class="tr-ql">Something else</div><div class="tr-own-r">' +
        '<input class="txt tr-barw" id="trBarW" inputmode="decimal" autocomplete="off" placeholder="' + fmtN(barFor(sh.e)) + '" aria-label="Bar weight in ' + T.pr.u + '">' +
        '<span class="tr-sub">' + T.pr.u + '</span>' +
        '<button class="ghost" data-t="barother" data-e="' + esc(sh.e) + '">Use it</button></div></div>' +
      (barSet(sh.e) ? '<div class="tr-acts"><button class="ghost" data-t="barset" data-v="def" data-e="' + esc(sh.e) + '">Back to the usual bar</button></div>' : '');
  }

  function noteHTML(sh) {
    var ex = lib(sh.e);
    return '<h2 class="sheet-name tr-sn2">' + esc(ex.n) + '</h2>' +
      '<div class="tr-sub">A note that comes up every time ' + esc(ex.n) + ' does: the seat, the grip, the bench that wobbles.</div>' +
      '<textarea class="txt tr-nt" id="trNoteT" maxlength="200" rows="3" aria-label="Note on ' + esc(ex.n) + '" ' +
        'placeholder="Seat 4. Handles at the second notch.">' + esc(noteOf(sh.e)) + '</textarea>' +
      '<div class="tr-q"><div class="tr-ql">How-to link <span class="tr-opt">optional</span></div>' +
        '<input class="txt tr-nt" id="trNoteU" type="url" inputmode="url" autocomplete="off" maxlength="300" placeholder="A video you trust, your coach\u2019s clip" ' +
          'value="' + esc(linkOf(sh.e)) + '" aria-label="How-to link for ' + esc(ex.n) + '">' +
        (S.noteErr ? '<div class="tr-note tr-warn">' + esc(S.noteErr) + '</div>' : '') + '</div>' +
      '<div class="tr-acts"><button class="btn-primary" data-t="notesave" data-e="' + esc(sh.e) + '">Save</button>' +
        (noteOf(sh.e) || linkOf(sh.e) ? '<button class="ghost danger" data-t="notedel" data-e="' + esc(sh.e) + '">Remove both</button>' : '') + '</div>';
  }

  function jsonSize() {
    try { return JSON.stringify(payload(true) || {}).length; } catch (e) { return 0; }
  }

  /* Whether these workouts fit, and if not, why — '' when they do.
   *
   * Three limits. This phone keeps everything, and a browser gives a site
   * about 5 MB, shared with Nourish and the recipes, so workouts get 3.5 MB
   * of it: ten years or more at four sessions a week. In the account, by
   * year, a year's record holds a megabyte, three years' worth at that
   * rate. And until the rule for the yearly records is published, all of it
   * shares the one record with Nourish, as it always has. */
  var REC_ROOM = 900 * 1024, PHONE_ROOM = 3584 * 1024;
  function woBytes(w) { return JSON.stringify(w).length + 60; }
  function fitSay(list, replace) {
    var all = (replace ? [] : Object.keys(T.wo).map(function (k) { return T.wo[k]; })).concat(list);
    var tot = all.reduce(function (a, w) { return a + woBytes(w); }, 0);
    if (tot > PHONE_ROOM) return 'That\u2019s more than this phone can keep for the app (about ' + (Math.round(tot / 104858) / 10) + ' MB of workouts). Pick a shorter range.';
    if (!doc) return '';
    if (YR.on === true) {
      var by = {};
      all.forEach(function (w) { var y = yearOf(w); by[y] = (by[y] || 0) + woBytes(w); });
      var over = Object.keys(by).filter(function (y) { return by[y] > REC_ROOM; }).sort();
      return over.length ? 'More workouts in ' + over.join(' and ') + ' than a year\u2019s record in your account can hold (about 1 MB). Pick a shorter range.' : '';
    }
    var rest = Math.max(0, jsonSize() - Object.keys(T.wo).reduce(function (a, k) { return a + woBytes(T.wo[k]); }, 0));
    if (rest + tot <= SG_ROOM) return '';
    return 'That would take your training record to about ' + Math.round((rest + tot) / 1024) + ' KB, and your account keeps it in one record of 1 MB, shared with Nourish. ' +
      (YR.on === null ? 'Try again once your account has answered, or pick a shorter range.'
        : 'Publishing one database rule lifts that (SETUP.md, step 4); until then, pick a shorter range.');
  }

  /* Where you train: one gym, or a gym and home, with home's bar and its
     plates counted in pairs. */
  function gySetHTML(p) {
    var g = p.gy, u = p.u;
    var body = !g.on ? '<div class="tr-hint">Train somewhere with other plates too \u2014 at home, say? Set them up here, and a workout says which it is.</div>'
      : g.u !== u ? '<div class="tr-note">Your home plates are set in ' + g.u + '. <button class="tr-lnk" data-t="gyreset">Set them in ' + u + '</button></div>'
      : '<div class="tr-ql tr-gyh">Home bar</div>' +
        '<div class="tr-own-r"><input class="txt tr-barw" id="trGyBar" inputmode="decimal" autocomplete="off" value="' + esc(fmtN(homeBar())) + '" aria-label="Home bar weight in ' + u + '">' +
          '<span class="tr-sub">' + u + '</span><button class="ghost" data-t="gybar">Use it</button></div>' +
        '<div class="tr-ql tr-gyh">Home plates, in pairs</div><div class="tr-gypl">' + PL_SIZES[u].map(function (sz) {
          var n = g.pl[String(sz)] || 0;
          return '<div class="tr-gyr' + (n ? '' : ' none') + '"><span>' + fmtP(sz) + ' ' + u + '</span>' +
            '<button class="tr-gyb" data-t="gypl" data-v="' + sz + '" data-d="-1"' + (n ? '' : ' disabled') + ' aria-label="One pair fewer of ' + fmtP(sz) + '">\u2212</button>' +
            '<b aria-label="' + n + ' pairs">' + n + '</b>' +
            '<button class="tr-gyb" data-t="gypl" data-v="' + sz + '" data-d="1"' + (n >= 10 ? ' disabled' : '') + ' aria-label="One pair more of ' + fmtP(sz) + '">+</button></div>';
        }).join('') + '</div>' +
        // a fact about your plates, in view; how Home and Gym work is help, behind the i
        '<div class="tr-sub tr-gymax">The most you can load at home: ' + fmtN(homeMax()) + ' ' + u + '.</div>' +
        '<div class="tr-hint">At the top of a workout, tap Home or Gym. At home, each row\u2019s plates and the weights it suggests are what these make; the gym has every plate and each lift\u2019s own bar.</div>';
    return '<div class="tr-q"><div class="tr-ql">Where you train</div>' + chips('s-gyon', g.on, [[0, 'One gym'], [1, 'A gym and home']]) + body + '</div>';
  }
  function homeMax() { var v = homeLoads(); return v.length ? v[v.length - 1] : homeBar(); }

  function settingsHTML() {
    var p = T.pr;
    var kb = Math.round(jsonSize() / 1024);
    /* You first: what the next block is built around, and what the review
       reads your week against. A block already running keeps what it was
       built with; these shape the next one. */
    return '<h2 class="sheet-name tr-sn2">Strengthen settings</h2><div class="tr-settings">' + infoTips(
      q('About you', '<div class="tr-sub">' + esc(p.qz ? youLine(p) : 'Not answered yet.') + '</div>' +
        '<div class="tr-acts"><button class="ghost" data-t="requiz">' + (p.qz ? 'Change my answers' : 'Answer the questions') + '</button></div>',
        'Your goal, time, kit, what to look after and what you do outside the gym. The picks, your next block and the review all read these.') +
      q('Never suggest', p.avoid.length ? '<div class="tr-chips">' + p.avoid.map(function (e) {
        return '<button class="tr-chip on" data-t="s-unavoid" data-v="' + esc(e) + '" aria-label="Allow ' + esc(lib(e).n) + ' again">' +
          esc(lib(e).n) + ' &times;</button>';
      }).join('') + '</div>' : '<div class="tr-sub">Nothing yet. When you swap an exercise out, you can say never again.</div>') +
      /* Not while a workout is open: its sets are saved in the unit it began
         in, and the boxes would be labelled in the other, so 100 typed after
         a switch to kilograms was kept as 100 pounds. */
      '<div class="tr-q"><div class="tr-ql">Weights in</div>' + chips('s-u', p.u, [['lb', 'Pounds'], ['kg', 'Kilograms']], LIVE ? ' disabled' : '') +
        (LIVE ? '<div class="tr-sub">Change this after the workout you have open: its sets are in ' + (LIVE.u === 'kg' ? 'kilograms' : 'pounds') + '.</div>' : '') + '</div>' +
      '<div class="tr-q"><div class="tr-ql">Default bar</div>' +
        chips('s-bar', p.bar, p.u === 'kg' ? [[20, 'Olympic 20 kg'], [15, 'Short 15 kg'], [10, '10 kg']] : [[45, 'Olympic 45 lb'], [35, '35 lb'], [33, 'Short 33 lb'], [25, '25 lb']]) +
        '<div class="tr-own-r tr-barown"><input class="txt tr-barw" id="trBarDef" inputmode="decimal" autocomplete="off" placeholder="' + fmtN(p.bar) + '" aria-label="Default bar weight in ' + p.u + '">' +
          '<span class="tr-sub">' + p.u + '</span><button class="ghost" data-t="s-barown">Use this weight</button></div>' +
        '<div class="tr-hint">A lift on another bar \u2014 an EZ bar, a Smith machine \u2014 keeps its own: tap \u201cbar\u201d beside it in a workout.</div></div>' +
      gySetHTML(p) +
      '<div class="tr-q"><div class="tr-ql">Beside each lift</div>' +
        chips('s-fmo', fmOn() ? 1 : 0, [[1, 'How today compares'], [0, 'Nothing']]) +
        '<div class="tr-hint">' + (fmOn() ? 'Once a working set is done, a badge beside the lift says how today compares with last time, set for set, or with the plan in a lighter week. Tap it for volume, reps or your best set; each lift remembers its choice.'
          : 'No badge beside the lifts.') + '</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Plates on the bar</div>' +
        chips('s-pl', p.pl, [['row', 'In every set'], ['type', 'While typing'], ['off', 'Off']]) +
        '<div class="tr-hint">' + (p.pl === 'row' ? 'Each barbell set shows what goes on each side, where Previous was; last time\u2019s numbers sit under it.'
          : p.pl === 'type' ? 'A barbell set shows its plates, where Previous was, while you type its weight, and in the next set to do; the rest show last time.'
          : 'The plate calculator is still under Plates on each barbell lift.') + '</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Rest on compound lifts</div>' +
        chips('s-rc', p.rc, [[90, '1:30'], [120, '2:00'], [150, '2:30'], [180, '3:00'], [240, '4:00']]) + '</div>' +
      '<div class="tr-q"><div class="tr-ql">Rest on isolation work</div>' +
        chips('s-ri', p.ri, [[60, '1:00'], [75, '1:15'], [90, '1:30'], [120, '2:00']]) + '</div>' +
      '<div class="tr-q"><div class="tr-ql">Rest between paired sets</div>' +
        chips('s-rp', p.rp, [[45, '0:45'], [60, '1:00'], [75, '1:15'], [90, '1:30']]) + '</div>' +
      '<div class="tr-q"><div class="tr-ql">When rest is up</div>' + chips('s-snd', p.snd, [[1, 'Beep and buzz'], [0, 'Buzz only']]) +
        '<div class="tr-note">Tap Beep and buzz to hear it. When a rest ends it calls again every 6 seconds until you touch the screen, for up to half a minute, while the app is on screen.</div></div>' +
      '<div class="tr-q"><div class="tr-ql">When you finish</div>' + chips('s-yay', p.yay, [[1, 'Chime and confetti'], [0, 'Just the summary']]) + '</div>' +
      '<div class="tr-q"><div class="tr-ql">Your weight on pull-up and dip days</div>' + chips('s-nobw', p.nobw, [[0, 'Ask when it\u2019s needed'], [1, 'Don\u2019t ask']]) +
        '<div class="tr-hint">Asked only when there\u2019s no weigh-in from the last week to go on. Saved, it\u2019s the day\u2019s weigh-in on Nourish too.</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Weekly sets and your calories</div>' + chips('s-nph', p.nph, [[1, 'Follow Nourish'], [0, 'Ignore']]) +
        '<div class="tr-hint">Eating well under maintenance slows recovery, so a block\u2019s weekly sets climb less: to 85% of the usual ceiling a quarter to a half percent of your weight a week under, 70% and one set at a time past that. Read from what Nourish says you eat, and kept for each week as it starts.</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Effort on each set</div>' + chips('s-rq', p.rq, [[0, 'Don\u2019t ask'], [1, 'Log it']]) +
        '<div class="tr-hint">A box beside every set for how hard it was. Optional on each set; the review holds it against what the plan asked.</div></div>' +
      /* Its own question, not a second row under the first: it also says
         how the plan's targets read, logged or not. */
      '<div class="tr-q"><div class="tr-ql">Effort scale</div>' + chips('s-eff', p.eff, [['rir', 'Reps to spare'], ['rpe', 'RPE']]) +
        '<div class="tr-hint">The same scale from the other end: RPE 10 is nothing left, RPE 8 is two reps to spare. RPE is what Strong and most powerlifting programs use.</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Your training data</div>' +
        /* Signed in with no signal is not signed out: Nourish knows which, and
           telling somebody to sign in who already has was the wrong door. */
        '<div class="tr-sub">' + (!doc && syncSay() === 'offline' ? '<b>Signed in, can\u2019t reach the server.</b> Kept on this phone meanwhile; it goes to your account when there\u2019s signal.'
          : !doc ? '<b>Only on this phone.</b> Sign in under Nourish \u2192 \u2699 \u2192 Sync &amp; sharing and it travels with your account, the same as your day.'
          : SY.err ? '<b>Not saved to your account yet</b> \u2014 it keeps trying. Safe on this phone meanwhile.'
          : SY.ok ? 'Saved to your account ' + agoSay(SY.ok) + ', and kept on this phone.' : 'Kept on this phone and in your account.') + '</div>' +
        '<div class="tr-sub">' + Object.keys(T.wo).length + ' workouts' + (!doc ? ' \u00b7 about ' + kb + ' KB'
          : YR.on === true ? ', kept a year to a record in your account' + (Object.keys(YR.kb).length ? ' (' + Object.keys(YR.kb).sort().join(', ') + ')' : '') +
            ', so there\u2019s no limit on how far back it goes.'
          : ' \u00b7 about ' + kb + ' KB of the 1 MB record your account keeps them in' +
            (YR.on === false ? '. One database rule (SETUP.md, step 4) keeps them a year to a record instead, with no limit.' : '.')) +
          '</div>' +
        (LSFULL ? '<div class="tr-sub tr-warn">This phone\u2019s storage for the app is full, so the newest changes are not kept on it' +
          (doc ? ' \u2014 they are in your account.' : '. Sign in to keep them in an account, or export a copy.') + '</div>' : '') +
        '<div class="tr-acts"><button class="ghost" data-t="export">Export a copy</button>' +
          '<button class="ghost" data-t="exportcsv">Export as a spreadsheet</button>' +
          '<label class="ghost tr-file">Restore from a copy<input type="file" id="trImport" accept="application/json,.json" hidden></label>' +
          '<label class="ghost tr-file">Import from another app<input type="file" id="trStrong" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" hidden></label>' +
          '<button class="ghost" data-t="impaste">Paste from a spreadsheet</button></div>' +
        '<div class="tr-hint">Strong, Hevy, Fitbod and FitNotes exports are recognised as they are. Any other app\u2019s export, or a spreadsheet saved as CSV, you match column by column, once. ' +
          'Your workouts come in as history \u2014 records, charts, and the weights a new block starts from.</div>' +
        (S.imp ? '<div class="tr-note">That file holds ' + Object.keys(S.imp.wo).length + ' workouts and ' +
          Object.keys(S.imp.ms).length + ' blocks. Restoring replaces everything in Strengthen on this device and in your account.</div>' +
          '<div class="tr-acts"><button class="btn-primary danger" data-t="impgo">Replace with the copy</button></div>' : '') +
        (S.impErr ? '<div class="tr-note">' + esc(S.impErr) + '</div>' : '') +
      '</div>') + '</div>';
  }
  /* Settings say what each one does behind an i, not in a paragraph under
     every row: the screen was a page of reading to change a rest time.
     Tapped, the i opens its paragraph in place; tapped again, it goes. */
  /* Each i is keyed by the words it opens, not by where it sits: keyed by
     order, a redraw that added or dropped a hint above (One gym / A gym and
     home) left the open one pointing at a different paragraph. */
  function infoTips(html) {
    return html.replace(/<div class="tr-hint">([\s\S]*?)<\/div>/g, function (all, txt) {
      var plain = txt.replace(/<[^>]*>/g, ''), h = 0;
      for (var i = 0; i < plain.length; i++) h = (h * 31 + plain.charCodeAt(i)) | 0;
      var k = 's' + (h >>> 0).toString(36), open = S.info === k;
      return '<button class="tr-ibtn" data-t="info" data-v="' + k + '" aria-expanded="' + open + '" aria-label="' +
        (open ? 'Hide' : 'What this does') + '"><span aria-hidden="true">i</span></button>' +
        (open ? '<div class="tr-hint tr-info-t">' + txt + '</div>' : '');
    });
  }

  /* ---------------------------------------------------------------- actions */
  function toggleIn(list, v) {
    var out = list.slice(), at = out.indexOf(v);
    if (at >= 0) out.splice(at, 1); else out.push(v);
    return out;
  }

  // Nourish's This week: the Review, whose top is the week
  function openCheckin() { if (S.sheet) closeSheet(); showReview(); }
  /* The Review, from Nourish's tab as Strengthen's own tab button would
     leave it, at its top. */
  function showReview() {
    var v = $('view-train'), tab = document.querySelector('.tab[data-view="train"]');
    setSub('review');
    if (v && v.classList.contains('hide') && tab) tab.click();
    scrollTop();
  }
  function setSub(v) {
    S.sub = v;
    // back to the workout is back to it full screen
    if (v === 'block') S.minim = 0;
    try { localStorage.setItem(LS_SUB, v); } catch (e) { /* private mode */ }
    draw();
  }

  function editBlock(ms) {
    T.ms[ms.id] = clean(ms);
    stamp('ms', ms.id);
  }

  /* After a box is tapped: it keeps the focus, for a keyboard, and the card
     it opened is brought up when it starts below the fold, the box staying
     on screen above it where there is room. */
  function selInView(w, d) {
    var gc = document.querySelector('.tr-gc[data-w="' + w + '"][data-d="' + d + '"]');
    if (gc) gc.focus({ preventScroll: true });
    var sc = $('trSesh');
    if (!sc) return;
    var top = sc.getBoundingClientRect().top;
    if (top > window.innerHeight - 140) {
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: window.pageYOffset + top - Math.round(window.innerHeight * 0.3), behavior: still ? 'auto' : 'smooth' });
    }
  }

  function blockRename(id) {
    var mb = T.ms[id], box = $('trBlkName');
    if (!mb || !box) return;
    var nm = String(box.value || '').trim().slice(0, 60);
    if (nm) { mb.n = nm; editBlock(mb); }
    S.hbRen = '';
    draw();
  }
  var noteT = null;

  /* What the builder needs to know about you, beside the program's own
     choices. */
  function profileOpts() {
    var p = T.pr;
    return { lvl: p.lvl, bk: p.bk, jt: p.jt, avoid: p.avoid, hab: p.hab.slice(), day: p.day, age: p.age };
  }

  function beginDraft() {
    var ms = clean(S.draft);
    ms.n = String(ms.n || '').trim() || ms.n0 || 'Block';
    delete ms.n0; delete ms.named;
    ms.at = Date.now();
    ms.st = dayKey(new Date());
    T.ms[ms.id] = ms;
    T.act = ms.id;
    stamp('ms', ms.id);
    stamp('act');
    S.draft = null; S.opt = null; S.browse = false; S.lib = false;
    draw();
    scrollTop();
  }

  function onPick(e) {
    var sh = S.sheet;
    if (!sh) return;
    /* Never again: onto the list, so no future block suggests it — and out
       of every day of this one, not just the one it was swapped on. */
    var gone = sh.mode === 'swap' && LIVE && LIVE.x[sh.x] ? LIVE.x[sh.x].e
      : sh.mode === 'dswap' && S.draft ? S.draft.days[sh.d].s[sh.i].e : '';
    if (S.never && gone && gone !== e && T.pr.avoid.indexOf(gone) < 0) {
      T.pr.avoid = T.pr.avoid.concat(gone);
      stamp('pr');
    }
    var everywhere = !!(S.never && gone);
    if (sh.mode === 'add' && LIVE) {
      LIVE.x.push(liveEx(e, 3));
      saveLive();
    } else if (sh.mode === 'swap' && LIVE && LIVE.x[sh.x]) {
      var old = LIVE.x[sh.x];
      var nx = liveEx(e, old.s.length);
      nx.rir = old.rir;
      nx.p = old.p || 0;
      if (old.sl) nx.sl = old.sl;
      /* A main lift keeps its day: the ramp, the working sets and the
         all-out one, at the new lift's own training max where there is one.
         The wave's max for the old lift then stays where it is, and it says
         so rather than leaving three blank sets. */
      if (old.fix) {
        var bms = LIVE.ms && T.ms[LIVE.ms], tA = bms ? tmOf(bms, old.sl || old.e) : null, tB = bms ? tmOf(bms, e) : null;
        var ratio = tA && tB ? tB / tA : null;
        nx.fix = 1;
        // its weights are the old lift's day now, not an effort-moved target: no line, no Undo to flatten them
        delete nx.ef;
        if (old.main) nx.main = old.main;
        if (tB) nx.tm = tB;
        nx.s.forEach(function (z, j) {
          var o = old.s[j];
          if (!o) return;
          z.tr = o.tr;
          z.tw = ratio && fin(o.tw) ? roundTo(o.tw * ratio, inc(lib(e))) : null;
          if (o.wu) z.wu = 1;
          if (o.am) z.am = 1;
        });
        remapPrev(nx);
        nx.swn = 'Swapped in for ' + lib(old.sl || old.e).n + ' today' + (ratio ? ', at its own training max' : ': pick weights by feel, by the same reps') +
          '. ' + lib(old.sl || old.e).n + '\u2019s training max stays as it is for the next wave.';
      }
      // what was already done stays done, under the new name
      old.s.forEach(function (s, j) { if (s.t && nx.s[j]) nx.s[j] = s; });
      LIVE.x[sh.x] = nx;
      /* Today only, unless you said the rest of the block — or never again,
         which is every day of it. */
      if (LIVE.ms && T.ms[LIVE.ms] && (sh.sc === 'block' || everywhere)) {
        var ms = clean(T.ms[LIVE.ms]);
        var was = old.sl || old.e;
        var slot = ms.days[LIVE.d] && ms.days[LIVE.d].s.filter(function (s) { return s.e === was; })[0];
        if (slot) slot.e = e;
        if (everywhere) ms.days.forEach(function (d) { d.s.forEach(function (s) { if (s.e === was || s.e === old.e) s.e = e; }); });
        if (slot || everywhere) editBlock(ms);
      }
      saveLive();
    } else if (sh.mode === 'dswap' && S.draft) {
      S.draft.days[sh.d].s[sh.i].e = e;
      if (everywhere) S.draft.days.forEach(function (d) { d.s.forEach(function (s) { if (s.e === gone) s.e = e; }); });
    } else if (sh.mode === 'dadd' && S.draft) {
      S.draft.days[sh.d].s.push({ e: e, n: 2 });
    } else if (sh.mode === 'smap' && S.sg && S.sg.names && S.sg.names[sh.i]) {
      S.sg.names[sh.i].e = e;
      openSheet({ k: 'strong', eyebrow: 'Import', title: 'From ' + (S.sg.app || 'your file') });
      return;
    } else if (sh.mode === 'eadd' && S.ed && T.wo[S.ed.id]) {
      S.ed.x.push({ e: e, s: [{ w: '', r: '', q: '', o: null }] });
      openSheet({ k: 'wo', id: S.ed.id, eyebrow: 'Workout', title: 'Workout' });
      return;
    }
    closeSheet();
    draw();
  }

  function saveFile(name, type, text) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportCopy() {
    saveFile('train-' + dayKey(new Date()) + '.json', 'application/json',
      JSON.stringify({ app: 'hive-train', v: 1, at: Date.now(), train: T }, null, 1));
  }

  /* Every set as a spreadsheet, in Strong's columns and order, so a
     spreadsheet or another app reads it — and "Bring in from Strong" here
     reads it back. RIR, the kind of set and your weight ride along at the
     end, where anything that knows only Strong's columns passes them by. */
  function csvCell(v) {
    var t = v === null || v === undefined ? '' : String(v);
    // text that would start a formula in a spreadsheet stays text
    if (/^[=+\-@]/.test(t) && !/^-?\d/.test(t)) t = "'" + t;
    return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  function csvNum(v) { return fin(v) ? String(Math.round(v * 100) / 100) : ''; }
  function csvDate(t) {
    var d = new Date(t), two = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds());
  }
  function csvDur(ms) {
    var m = Math.round(ms / 60000);
    return m > 0 ? (m >= 60 ? Math.floor(m / 60) + 'h ' : '') + (m % 60) + 'm' : '';
  }
  function woCsv() {
    var rows = [['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', 'Weight', 'Weight Unit', 'Reps', 'Distance', 'Seconds',
      'Notes', 'Workout Notes', 'RPE', 'RIR', 'Set Type', 'Bodyweight']];
    ix().list.forEach(function (wo) {
      var bw = woBw(wo);
      wo.x.forEach(function (x) {
        var n = 0, name = lib(x.e).n;
        x.s.forEach(function (st) {
          var ord = st.wu ? 'W' : st.ty === 'd' ? 'D' : st.ty === 'f' ? 'F' : String(++n);
          rows.push([csvDate(wo.st), wo.n || 'Workout', wo.en > wo.st ? csvDur(wo.en - wo.st) : '', name, ord,
            csvNum(st.w), wo.u === 'kg' ? 'kg' : 'lbs', csvNum(st.r), '', '',
            st.ty === 'm' ? 'Missed attempt' : ASST[x.e] ? 'Weight is the machine\u2019s help' : '', wo.nt || '',
            fin(st.q) ? csvNum(10 - st.q) : '', fin(st.q) ? csvNum(st.q) : '', setSay(st), usesBw(x.e) && fin(bw) ? csvNum(bw) : '']);
        });
      });
    });
    return '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  function exportCsv() {
    saveFile('strengthen-' + dayKey(new Date()) + '.csv', 'text/csv;charset=utf-8', woCsv());
  }

  function readImport(file) {
    var fr = new FileReader();
    fr.onload = function () {
      S.imp = null; S.impErr = '';
      try {
        var d = JSON.parse(fr.result);
        var t = d && d.train;
        if (!plain(t) || !plain(t.wo) || !plain(t.ms)) throw new Error('shape');
        var n = blankT();
        n.pr = defaultsPr(t.pr);
        n.act = typeof t.act === 'string' ? t.act : '';
        PARTS.forEach(function (p) {
          Object.keys(t[p] || {}).forEach(function (k) {
            if (/^[a-z0-9]+$/i.test(k) && t[p][k] && SHAPE[p](t[p][k])) n[p][k] = t[p][k];
          });
        });
        S.imp = n;
      } catch (e) {
        S.impErr = 'That file is not a copy exported from Strengthen (or Train, as it was).';
      }
      drawSheet();
    };
    fr.readAsText(file);
  }

  /* A restore wins everywhere: every piece is stamped now, and anything this
     device knew of that the copy does not have is stamped gone, so the other
     device follows rather than resurrecting it. */
  function applyImport() {
    var n = S.imp;
    if (!n) return;
    var now = Date.now();
    var big = fitSay(Object.keys(n.wo).map(function (k) { return n.wo[k]; }), true);
    if (big) { S.impErr = big; S.imp = null; drawSheet(); return; }
    Object.keys(T.wo).forEach(function (k) { if (!n.wo[k]) YR.gone[k] = yearOf(T.wo[k]); });
    PARTS.forEach(function (p) {
      Object.keys(T[p]).concat(Object.keys(TS[p])).forEach(function (k) { TS[p][k] = now; });
      Object.keys(n[p]).forEach(function (k) { TS[p][k] = now; });
    });
    TS.pr = now; TS.act = now;
    /* Each block's fields as new as the copy, and the ones this device had
       that the copy has not with them, so the other device drops them too. */
    var msk = {};
    Object.keys(n.ms).forEach(function (id) {
      msk[id] = {};
      Object.keys(n.ms[id]).concat(Object.keys(T.ms[id] || {})).forEach(function (f) { msk[id][f] = now; });
    });
    T = n;
    TS.msk = msk;
    TS.prk = {};
    Object.keys(T.pr).forEach(function (k) { TS.prk[k] = now; });
    PRSEEN = prSeen();
    MSSEEN = msSeenAll();
    S.imp = null;
    dirtyAll = true;
    saveT();
    push(true);
    closeSheet();
    draw();
  }


  /* ------------------------------------------------------- from Strong
   *
   * Strong's export is a CSV with one row per set: the date and name of the
   * workout, the exercise, the set's order, weight, reps, and optionally its
   * RPE and a note. Two layouts are about: an older one with a Weight Unit
   * column, and a newer one without, where the weights are in whatever unit
   * the app was set to. Columns are found by name, so either reads.
   *
   * What comes in is history: records, charts, and the numbers a new block
   * starts from. It does not rebuild Strong's routines. A set timed or run
   * rather than lifted (a plank, a jog) has no reps to count and is left out.
   *
   * Each exercise is matched to the library where the name says the same
   * lift on the same kit, and otherwise comes in as your own, with its
   * muscle guessed from the name and shown to be checked. */
  function csvRows(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r?\n/, 1)[0] || '';
    var semi = (first.match(/;/g) || []).length, comma = (first.match(/,/g) || []).length, tab = (first.match(/\t/g) || []).length;
    // rows pasted from a spreadsheet are tab-separated
    var sep = tab > comma && tab > semi ? '\t' : semi > comma ? ';' : ',';
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // "1h 5m", "45m", "01:05:00", or plain seconds
  function sgDur(s) {
    s = String(s || '').trim();
    if (!s) return 0;
    var m = s.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
    if (m) return m[3] !== undefined ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 : (+m[1] * 60 + +m[2]) * 60000 / 60;
    var h = s.match(/(\d+)\s*h/), mi = s.match(/(\d+)\s*m(?!s)/), se = s.match(/(\d+)\s*s/);
    if (h || mi || se) return ((h ? +h[1] * 3600 : 0) + (mi ? +mi[1] * 60 : 0) + (se ? +se[1] : 0)) * 1000;
    var n = Number(s);
    return fin(n) && n > 0 ? n * 1000 : 0;
  }
  /* 1,000 is a thousand (a leg press), 72,5 is seventy-two and a half (a
     comma for the point, as much of Europe writes it). */
  function sgNum(s) {
    var t = String(s == null ? '' : s).trim();
    t = /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?\b/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
    var n = parseFloat(t);
    return fin(n) ? n : null;
  }

  /* Strong's own names for the lifts the library has, as their words fall
     once case, brackets and punctuation are gone. Only the same lift on the
     same kit: a Pendlay row is not a bent-over row. An assisted pull-up or
     dip is logged as the help, not the load, and comes in as the assisted
     lift, where the weight means exactly that. */
  var SG_MAP = {
    // FitNotes, Fitbod and hand-kept spreadsheets say the lift without the kit
    'flat barbell bench press': 'bb-bench', 'barbell bench press': 'bb-bench', 'bench press': 'bb-bench',
    'barbell squat': 'bb-squat', 'back squat': 'bb-squat', 'squat': 'bb-squat', 'deadlift': 'bb-dl', 'conventional deadlift': 'bb-dl',
    'overhead press': 'bb-ohp', 'military press': 'bb-ohp', 'barbell row': 'bb-row', 'bent over row': 'bb-row',
    'pull ups': 'pullup', 'pullups': 'pullup', 'chin ups': 'chinup', 'dips': 'dip',
    'romanian deadlift': 'bb-rdl', 'incline barbell bench press': 'bb-incline', 'incline bench press': 'bb-incline',
    'dumbbell bench press': 'db-bench', 'flat dumbbell bench press': 'db-bench', 'incline dumbbell bench press': 'db-incline',
    'dumbbell lateral raise': 'db-lat', 'lateral raise': 'db-lat', 'dumbbell curl': 'db-curl',
    'barbell curl': 'bb-curl', 'hip thrust': 'hip-thrust', 'barbell hip thrust': 'hip-thrust', 
    'lying leg curl': 'lying-curl', 'seated leg curl': 'seated-curl', 'standing calf raise': 'calf-stand', 'seated calf raise': 'calf-seat',
    'sumo deadlift': 'sumo-dl', 'hex bar deadlift': 'trap-dl', 'assisted pull up': 'as-pullup', 'assisted dip': 'as-dip',
    'bench press barbell': 'bb-bench', 'bench press dumbbell': 'db-bench', 'chest press machine': 'mc-press',
    'incline bench press barbell': 'bb-incline', 'incline bench press dumbbell': 'db-incline',
    'incline bench press smith machine': 'sm-incline', 'chest dip': 'dip', 'dip': 'dip', 'push up': 'pushup-flat',
    'incline push up': 'inc-pushup', 'cable crossover': 'cb-fly', 'chest fly cable': 'cb-fly', 'chest fly dumbbell': 'db-fly',
    'chest fly machine': 'pec-deck', 'pec deck machine': 'pec-deck', 'pec deck': 'pec-deck',
    'lat pulldown cable': 'lat-pd', 'lat pulldown machine': 'lat-pd', 'lat pulldown wide grip cable': 'lat-pd', 'lat pulldown': 'lat-pd',
    'lat pulldown close grip cable': 'lat-pd-n', 'pull up': 'pullup', 'chin up': 'chinup',
    'bent over row barbell': 'bb-row', 'seated row cable': 'cb-row', 'seated cable row': 'cb-row', 'seated row machine': 'mc-row',
    'bent over one arm row dumbbell': 'db-row', 'one arm row dumbbell': 'db-row', 'chest supported row dumbbell': 'db-cs-row',
    'pullover dumbbell': 'db-pullover', 'straight arm pulldown cable': 'cb-straight', 'inverted row': 'inv-row',
    'squat barbell': 'bb-squat', 'back squat barbell': 'bb-squat', 'front squat barbell': 'bb-front', 'hack squat': 'hack',
    'hack squat machine': 'hack', 'squat smith machine': 'sm-squat', 'leg press': 'leg-press', 'leg press machine': 'leg-press',
    'goblet squat kettlebell': 'goblet', 'goblet squat dumbbell': 'goblet', 'goblet squat': 'goblet',
    'bulgarian split squat': 'db-bss', 'bulgarian split squat dumbbell': 'db-bss', 'lunge dumbbell': 'db-lunge',
    'walking lunge dumbbell': 'db-lunge', 'step up': 'db-stepup', 'step up dumbbell': 'db-stepup', 'belt squat machine': 'belt-squat',
    'leg extension machine': 'leg-ext', 'leg extension': 'leg-ext', 'air squat': 'bw-squat', 'squat bodyweight': 'bw-squat',
    'romanian deadlift barbell': 'bb-rdl', 'romanian deadlift dumbbell': 'db-rdl', 'stiff leg deadlift barbell': 'bb-sldl',
    'deadlift barbell': 'bb-dl', 'sumo deadlift barbell': 'sumo-dl', 'deadlift trap bar': 'trap-dl', 'trap bar deadlift': 'trap-dl',
    'pull up assisted': 'as-pullup', 'chest dip assisted': 'as-dip', 'dip assisted': 'as-dip', 'good morning barbell': 'good-am', 'lying leg curl machine': 'lying-curl',
    'seated leg curl machine': 'seated-curl', 'nordic hamstring curl': 'nordic',
    'hip thrust barbell': 'hip-thrust', 'hip thrust machine': 'mc-thrust', 'hip thrust dumbbell': 'db-thrust', 'glute bridge': 'glute-bridge',
    'back extension': 'back-ext', 'hyperextension': 'back-ext', 'hip abductor machine': 'abduct', 'glute kickback cable': 'cb-kick',
    'glute kickback machine': 'mc-kick', 'hip thrust smith machine': 'sm-thrust',
    'seated leg press machine': 'seated-lp', 'seated leg press': 'seated-lp', 'leg press horizontal machine': 'seated-lp',
    'lateral raise dumbbell': 'db-lat', 'lateral raise cable': 'cb-lat', 'lateral raise machine': 'mc-lat', 'upright row cable': 'cb-upright',
    'reverse fly machine': 'rev-deck', 'rear delt fly machine': 'rev-deck', 'reverse fly dumbbell': 'db-rear', 'reverse fly cable': 'cb-rear',
    'face pull cable': 'face-pull', 'face pull': 'face-pull',
    'overhead press barbell': 'bb-ohp', 'strict military press barbell': 'bb-ohp', 'shoulder press dumbbell': 'db-ohp',
    'seated overhead press dumbbell': 'db-ohp', 'overhead press dumbbell': 'db-ohp', 'shoulder press machine': 'mc-ohp',
    'front raise dumbbell': 'db-front', 'pike push up': 'pike-pushup',
    'bicep curl barbell': 'bb-curl', 'biceps curl barbell': 'bb-curl', 'ez bar curl': 'ez-curl', 'bicep curl ez bar': 'ez-curl',
    'bicep curl dumbbell': 'db-curl', 'biceps curl dumbbell': 'db-curl', 'incline curl dumbbell': 'inc-curl',
    'hammer curl dumbbell': 'hammer', 'bicep curl cable': 'cb-curl', 'biceps curl cable': 'cb-curl', 'preacher curl machine': 'preacher',
    'triceps pushdown': 'pushdown', 'triceps pushdown cable straight bar': 'pushdown', 'triceps pushdown cable': 'pushdown',
    'tricep pushdown cable': 'pushdown', 'triceps pushdown cable rope': 'pushdown', 'overhead triceps extension cable': 'cb-oh-ext',
    'triceps extension cable': 'cb-oh-ext', 'skullcrusher barbell': 'skull', 'skullcrusher ez bar': 'skull',
    'triceps extension dumbbell': 'db-oh-ext', 'overhead triceps extension dumbbell': 'db-oh-ext', 'triceps extension machine': 'mc-tri',
    'bench press close grip barbell': 'cgbp', 'close grip bench press barbell': 'cgbp', 'bench dip': 'bench-dip', 'diamond push up': 'diamond',
    'standing calf raise machine': 'calf-stand', 'calf raise machine': 'calf-stand', 'seated calf raise machine': 'calf-seat',
    'seated calf raise plate loaded': 'calf-seat', 'calf press on leg press': 'calf-lp', 'calf press machine': 'calf-lp',
    'standing calf raise dumbbell': 'calf-db', 'shrug dumbbell': 'db-shrug', 'shrug barbell': 'bb-shrug', 'shrug cable': 'cb-shrug',
    'cable crunch': 'cb-crunch', 'crunch cable': 'cb-crunch', 'hanging leg raise': 'hang-raise', 'ab wheel': 'ab-wheel',
    'crunch machine': 'mc-crunch', 'crunch': 'crunch', 'pallof press cable': 'pallof', 'dead bug': 'dead-bug', 'bird dog': 'bird-dog'
  };
  function sgKey(n) {
    return String(n || '').toLowerCase().replace(/\btricep\b/g, 'triceps').replace(/[^a-z0-9]+/g, ' ').trim()
      .replace(/\bdb\b/g, 'dumbbell').replace(/\bbb\b/g, 'barbell').replace(/\bkb\b/g, 'kettlebell')
      .replace(/\bohp\b/g, 'overhead press').replace(/\brdl\b/g, 'romanian deadlift')
      .replace(/\bpush ups?\b/g, 'push up').replace(/\bpull ups?\b/g, 'pull up').replace(/\bchin ups?\b/g, 'chin up')
      .replace(/\bstep ups?\b/g, 'step up').replace(/\bskull ?crushers?\b/g, 'skullcrusher');
  }
  function sgMatch(n) {
    var k = sgKey(n), tries = [k];
    /* "Pull Up (Weighted)", "Weighted Dips": the lift itself, the weight
       column being what was added to you. */
    var unw = k.replace(/\bweighted\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (unw && unw !== k) tries.push(unw);
    // "Squats", "Dumbbell Curls": one of them (never triceps or biceps)
    tries.slice().forEach(function (t) {
      var one = t.replace(/\b(?!(?:tri|bi)ceps\b)([a-z]{2,}[^s\s])s\b/g, '$1');
      if (one !== t) tries.push(one);
    });
    for (var j = 0; j < tries.length; j++) {
      if (SG_MAP[tries[j]] && LIB[SG_MAP[tries[j]]]) return SG_MAP[tries[j]];
      // the library's own name, word for word
      for (var i = 0; i < LIB_LIST.length; i++) if (sgKey(LIB_LIST[i].n) === tries[j]) return LIB_LIST[i].id;
    }
    return '';
  }
  /* A guess at what a lift you made up trains, most particular first, so a
     leg curl is not taken for a biceps curl. Shown to be checked. */
  var SG_MUS = [
    [/leg curl|hamstring|romanian|\brdl\b|good morning|stiff leg/, 'hams'], [/leg extension|squat|leg press|lunge|step up|sissy/, 'quads'],
    [/calf/, 'calves'], [/hip thrust|glute|bridge|abduct|kickback/, 'glutes'], [/reverse fly|rear delt|face pull/, 'rear'],
    [/lateral raise|upright row/, 'side'], [/overhead press|shoulder press|military|arnold|front raise|push press|landmine press/, 'front'],
    [/shrug/, 'traps'], [/crunch|plank|leg raise|sit up|ab wheel|oblique|twist|hollow|v up|toes to bar/, 'abs'],
    [/triceps|skullcrusher|pushdown|close grip|kickback|jm press/, 'triceps'], [/curl/, 'biceps'],
    [/deadlift|back extension|hyperextension/, 'hams'], [/row|pulldown|pull up|chin up|pullover|lat\b|pull down/, 'back'],
    [/bench|chest|fly|pec|push up|dip|press/, 'chest']
  ];
  function sgGuess(n) {
    var k = sgKey(n), m = 'chest', i;
    for (i = 0; i < SG_MUS.length; i++) if (SG_MUS[i][0].test(k)) { m = SG_MUS[i][1]; break; }
    var q = /smith/.test(k) ? 'sm' : /barbell|ez bar|trap bar/.test(k) ? 'bb' : /dumbbell|kettlebell/.test(k) ? 'db'
      : /cable|band/.test(k) ? 'cb' : /machine|plate loaded|lever/.test(k) ? 'mc' : /bodyweight|assisted|weighted|push up|pull up|chin up|dip/.test(k) ? 'bw' : 'mc';
    var c = /press|squat|deadlift|row|pull|chin|dip|lunge|thrust|clean|snatch|step up|push up/.test(k) && !/leg curl|pushdown|triceps/.test(k) ? 'c' : 'i';
    return { m: m, q: q, k: c };
  }

  /* The file, read into workouts and the exercises they use. Nothing is
     stored yet: the sheet shows what came in and what it matched first. */
  /* ------------------------------------------------ from another app
   *
   * One import for any app's export, or any spreadsheet. The apps whose
   * exports are known are recognised by their columns; anything else with a
   * header row is matched by you, column by column, and remembered for the
   * next file with the same columns. Rows copied straight out of a
   * spreadsheet and pasted come in the same way (they are tab-separated).
   *
   * Every row is one set, except in a file with a column for the number of
   * sets, where a row is that many sets alike. What comes in is always shown
   * before anything is kept. */
  var IM_ROLES = [
    ['date', 'Date', 1], ['ex', 'Exercise', 1], ['r', 'Reps', 1], ['w', 'Weight', 0], ['wu', 'Weight unit', 0],
    ['n', 'Number of sets', 0], ['name', 'Workout name', 0], ['ty', 'Set type', 0], ['rpe', 'RPE', 0], ['rir', 'RIR', 0],
    ['nt', 'Notes', 0], ['dur', 'Duration', 0]
  ];
  // the words a column heading uses for each, most particular first
  var IM_SYN = {
    date: [/^date$/, /^start_?time$/, /^workout date$/, /^day$/, /^date ?time$/, /^timestamp$/, /date/],
    ex: [/^exercise(_| )?(name|title)?$/, /^movement$/, /^lift$/, /^exercise/, /^name$/],
    r: [/^reps?$/, /^repetitions$/, /^reps? ?(done|completed)?$/, /reps/],
    w: [/^weight$/, /^weight[_ ]?\(?(lbs?|kgs?)\)?$/, /^load\b/, /^(lbs?|kgs?)$/, /weight/],
    wu: [/^weight ?unit$/, /^unit$/, /^units$/],
    n: [/^sets$/, /^number of sets$/, /^# ?sets$/],
    name: [/^workout( name)?$/, /^title$/, /^routine$/, /^session$/, /^workout_?name$/],
    ty: [/^set[_ ]?type$/, /^is_?warm_?up$/, /^type$/, /^set order$/],
    rpe: [/^rpe$/],
    rir: [/^rir$/, /^reps in reserve$/],
    nt: [/^notes?$/, /^comments?$/, /^exercise_?notes$/, /^set notes$/],
    dur: [/^duration$/, /^workout duration$/, /^duration_?seconds$/]
  };
  function imGuess(head) {
    var used = {}, C = {};
    IM_ROLES.forEach(function (ro) {
      var list = IM_SYN[ro[0]] || [];
      C[ro[0]] = -1;
      for (var a = 0; a < list.length && C[ro[0]] < 0; a++) {
        for (var i = 0; i < head.length; i++) if (!used[i] && list[a].test(head[i])) { C[ro[0]] = i; used[i] = 1; break; }
      }
    });
    return C;
  }
  // lb or kg from a column heading: "weight_kg", "Weight (lbs)", "Weight(kg)"
  function imHeadUnit(h) { return /kg/.test(h) ? 'kg' : /lb/.test(h) ? 'lb' : ''; }

  /* The apps whose exports are known, by the columns only they have. Each
     says which column is which, where that is not just the heading's word. */
  function imDetect(head) {
    var has = function (h) { return head.indexOf(h) >= 0; };
    var at = function () { for (var i = 0; i < arguments.length; i++) { var k = head.indexOf(arguments[i]); if (k >= 0) return k; } return -1; };
    if (has('exercise name') && (has('set order') || has('workout name')) && has('reps') && has('weight')) {
      return { app: has('rir') && has('set type') ? 'Strengthen' : 'Strong', C: { date: at('date'), name: at('workout name'), dur: at('duration', 'workout duration'), ex: at('exercise name'),
        ord: at('set order'), w: at('weight'), wu: at('weight unit'), r: at('reps'), rpe: at('rpe'), nt: at('notes'), wnt: at('workout notes'),
        // Strengthen's own export: the bodyweight a pull-up's best was worked from
        bw: at('bodyweight') } };
    }
    if (has('exercise_title') && has('start_time') && has('reps')) {
      var hw = at('weight_lbs', 'weight_kg', 'weight');
      return { app: 'Hevy', unit: hw >= 0 ? imHeadUnit(head[hw]) : '', C: { date: at('start_time'), end: at('end_time'), name: at('title'),
        ex: at('exercise_title'), ty: at('set_type'), w: hw, r: at('reps'), rpe: at('rpe'), nt: at('exercise_notes'), wnt: at('description') } };
    }
    if (has('iswarmup') || (has('exercise') && has('weight(kg)'))) {
      return { app: 'Fitbod', unit: 'kg', utc: true, C: { date: at('date'), ex: at('exercise'), ty: at('iswarmup'), w: at('weight(kg)', 'weight'),
        r: at('reps'), nt: at('note') } };
    }
    if (has('category') && has('exercise') && (has('weight (kgs)') || has('weight (lbs)')) && has('reps')) {
      var fw = at('weight (kgs)', 'weight (lbs)');
      return { app: 'FitNotes', unit: imHeadUnit(head[fw]), C: { date: at('date'), ex: at('exercise'), w: fw, r: at('reps'), nt: at('comment') } };
    }
    return null;
  }

  /* Day and month the right way round, from the file itself: a first number
     over twelve means day first, a second one means month first. Neither
     is asked. */
  function imOrder(vals) {
    var dmy = false, mdy = false;
    vals.forEach(function (v) {
      var m = String(v || '').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
      if (!m) return;
      if (+m[1] > 12) dmy = true;
      if (+m[2] > 12) mdy = true;
    });
    return dmy && !mdy ? 'dmy' : mdy && !dmy ? 'mdy' : dmy && mdy ? 'bad' : '';
  }

  function sgParse(text, map) {
    var rows = csvRows(text);
    if (rows.length < 2) return { err: 'That file is empty, or has only one line.' };
    var raw = rows[0].map(function (h) { return String(h).trim(); });
    var head = raw.map(function (h) { return h.toLowerCase(); });
    var sig = head.join('|');
    var D = map ? { app: map.app || 'your file', unit: map.unit || '', C: map.C, order: map.order || '' } : imDetect(head);
    if (!D) {
      /* Not an app this knows: the columns to match, guessed, or as you
         matched them the last time a file had these same headings. */
      var mem = readLS(LS_IMAP) || {};
      var guess = mem[sig] && mem[sig].C ? mem[sig].C : imGuess(head);
      var dcol = guess.date;
      return { need: 'map', head: raw, sig: sig, C: guess, text: text, n: rows.length - 1,
        order: dcol >= 0 ? imOrder(rows.slice(1, 400).map(function (r) { return r[dcol]; })) : '',
        unit: (mem[sig] && mem[sig].unit) || (guess.w >= 0 ? imHeadUnit(head[guess.w]) : '') };
    }
    var C = D.C;
    if (!(C.date >= 0) || !(C.ex >= 0) || !(C.r >= 0)) {
      return { err: 'It needs a date, an exercise and the reps for each set. Choose which columns those are.', need: 'map', head: raw, sig: sig, C: C, text: text, n: rows.length - 1 };
    }
    var order = D.order || imOrder(rows.slice(1, 400).map(function (r) { return r[C.date]; }));
    var byKey = {}, wosIn = [], names = {}, nOrder = [], units = {}, skipped = 0, bare = 0, sess = {};
    rows.slice(1).forEach(function (r) {
      var get = function (i) { return i >= 0 && i < r.length ? String(r[i]).trim() : ''; };
      var dcell = get(C.date), st = imDate(dcell, order, D.utc), exn = get(C.ex).slice(0, 80);
      if (!fin(st) || !exn) { skipped++; return; }
      // Strong's set order says the kind of set; anything else says it in words
      var so = get(C.ord).toUpperCase(), tyw = get(C.ty).toLowerCase();
      /* BW is the body alone, BW+25 or +25 is 25 added; a minus is how many
         write the help on an assisted lift, kept to be read once the lift is
         known (anywhere else it is no weight at all). */
      var reps = sgNum(get(C.r)), wtxt = get(C.w), bwx = wtxt.replace(/^(bw|body ?weight)\s*(?=\+|$)/i, '');
      var w = bwx === '' ? 0 : sgNum(bwx.replace(/^\+/, ''));
      // a timed or distance set, a rest-timer row, or a set never done
      if (!(reps > 0) || (so && !/^\d+$/.test(so) && ['W', 'D', 'F'].indexOf(so) < 0)) { skipped++; return; }
      var wname = get(C.name), key;
      if (C.name >= 0) key = dcell + '|' + wname;
      else {
        /* No column says which workout a row is in: the sets of one day are one
           workout, even when every row carries its own time (a form, a watch),
           and a gap of three hours starts another. */
        var dk0 = dayKey(new Date(st)), b = sess[dk0] || (sess[dk0] = { n: 0, t: st });
        if (st - b.t > 3 * 3600000) b.n++;
        b.t = Math.max(b.t, st);
        key = dk0 + (b.n ? '#' + b.n : '') + '|' + wname;
      }
      var wo = byKey[key];
      if (!wo) {
        var dur = sgDur(get(C.dur));
        if (!dur && C.end >= 0) { var en = imDate(get(C.end), order, D.utc); if (fin(en) && en > st) dur = en - st; }
        wo = byKey[key] = { key: key, st: st, n: wname.slice(0, 60) || 'Workout', dur: dur, x: [], xi: {}, nt: [] };
        wosIn.push(wo);
      } else if (C.name < 0 && st < wo.st) wo.st = st;
      var wnt = get(C.wnt);
      if (wnt && wo.nt.indexOf(wnt) < 0) wo.nt.unshift(wnt);
      var ent = get(C.nt);
      // what Strengthen's own export writes on a set is not a note anybody wrote
      if (/^(missed attempt|weight is the machine.s help)$/i.test(ent)) ent = '';
      if (ent && wo.nt.indexOf(exn + ': ' + ent) < 0) wo.nt.push(exn + ': ' + ent);
      var ru = C.wu >= 0 ? get(C.wu).toLowerCase() : '';
      ru = ru ? (/kg|kilo/.test(ru) ? 'kg' : 'lb') : /kg/i.test(wtxt) ? 'kg' : /lb/i.test(wtxt) ? 'lb' : D.unit || '';
      var bwc = sgNum(get(C.bw));
      if (bwc > 0 && !wo.bw) { wo.bw = bwc; if (ru) wo.bwu = ru; }
      if (ru) units[ru] = 1;
      // a weight with nothing to say its unit: the file's own unit, asked if not known
      else if (w) bare++;
      var x = wo.xi[exn];
      if (!x) { x = wo.xi[exn] = { nm: exn, s: [] }; wo.x.push(x); }
      var set = { w: w !== null && w !== 0 ? Math.round(Math.abs(w) * 100) / 100 : 0, r: Math.round(reps) };
      if (w < 0) set.ng = 1;
      if (ru) set.su = ru;
      if (so === 'W' || /warm|^true$|^1$|^yes$/.test(tyw)) set.wu = 1;
      else if (so === 'D' || /drop/.test(tyw)) set.ty = 'd';
      else if (so === 'F' || /fail/.test(tyw)) set.ty = 'f';
      // RPE by its half steps, as Strong logs it: 8.5 is one and a half in reserve
      var rpe = sgNum(get(C.rpe)), rir = sgNum(get(C.rir));
      if (rpe !== null && rpe >= 5 && rpe <= 10) set.q = Math.max(0, Math.min(5, Math.round((10 - rpe) * 2) / 2));
      else if (rir !== null && rir >= 0 && rir <= 10) set.q = Math.min(5, Math.round(rir * 2) / 2);
      // a row that is several sets alike
      var many = Math.max(1, Math.min(20, Math.round(sgNum(get(C.n)) || 1)));
      for (var k = 0; k < many; k++) x.s.push(k ? clean(set) : set);
      if (!names[exn]) { names[exn] = { nm: exn, n: 0 }; nOrder.push(exn); }
      names[exn].n += many;
    });
    if (!wosIn.length) return { err: 'No lifting sets in that file: every row was timed, a distance, empty, or had no date.' };
    var order2 = wosIn;
    order2.sort(function (a, b) { return a.st - b.st; });
    order2.forEach(function (w) { delete w.xi; });
    var list = nOrder.map(function (nm) {
      var g = sgGuess(nm);
      return { nm: nm, n: names[nm].n, e: sgMatch(nm), m: g.m, q: g.q, k: g.k };
    }).sort(function (a, b) { return (a.e ? 1 : 0) - (b.e ? 1 : 0) || b.n - a.n; });
    /* Each row says its own unit in newer exports, and a history can change
       unit halfway (132.5 kg is not 132.5 lb). A file in one unit comes in
       as that unit; a mixed one is brought to yours, set by set. */
    /* One weight written "60kg" in a sheet of bare numbers says nothing about
       the rest: with any weight that has no unit, the file's unit is asked,
       and the ones that said theirs are brought to it when it comes in. */
    var uk = Object.keys(units), fixed = uk.length >= 1 && !bare;
    var unit = fixed && uk.length === 1 ? uk[0] : fixed ? T.pr.u : D.unit || T.pr.u;
    if (fixed) {
      order2.forEach(function (w) {
        w.x.forEach(function (x) { x.s.forEach(function (s) { sgUnit(s, unit); }); });
      });
    }
    return { wos: order2, names: list, unit: unit, fixedUnit: fixed, mixed: uk.length > 1, skipped: skipped, range: 0,
      app: D.app, order: order === 'bad' ? '' : order };
  }

  /* A date as any of these apps or a spreadsheet writes it:
       2024-09-24 18:30:00 (+0000 as Fitbod adds)   24 Sep 2024, 18:30 (Hevy)
       9/24/2024 6:30 PM or 24/09/2024 by the file's order    Sep 24, 2024
       24.09.2024    and a spreadsheet's day number (45559). */
  // month by its first three letters (MON is the names, for showing)
  var MON_IX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function imDate(s, order, utc) {
    s = String(s || '').trim();
    if (!s) return null;
    var hm = function (h, mi, se, ap) {
      h = +(h || 12);
      if (ap && /p/i.test(ap) && h < 12) h += 12;
      if (ap && /a/i.test(ap) && h === 12) h = 0;
      return [h, +(mi || 0), +(se || 0)];
    };
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?)?/);
    if (m) {
      var z = m[7];
      if (z) {
        var off = z === 'Z' ? 0 : (z[0] === '-' ? -1 : 1) * (+z.slice(1, 3) * 60 + +z.slice(-2));
        return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0), +(m[6] || 0)) - off * 60000;
      }
      /* No zone written, from an app that writes its times in UTC (Fitbod,
         which usually says +0000 and sometimes does not). Read as local, an
         evening session in Denver landed on the next morning's date. Only a
         time is moved: a bare date is a calendar day, not an instant. */
      if (utc && m[4] !== undefined) {
        return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +(m[5] || 0), +(m[6] || 0));
      }
      return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0), +(m[6] || 0)).getTime();
    }
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/);
    if (m) {
      var y = +m[3] < 100 ? 2000 + +m[3] : +m[3], t = hm(m[4], m[5], m[6], m[7]);
      var dmy = order === 'dmy' || (order !== 'mdy' && s.indexOf('.') > 0);
      var mo = dmy ? +m[2] : +m[1], d = dmy ? +m[1] : +m[2];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      return new Date(y, mo - 1, d, t[0], t[1], t[2]).getTime();
    }
    // 24 Sep 2024, 18:30
    m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/);
    if (m && MON_IX[m[2].toLowerCase()] !== undefined) {
      var t1 = hm(m[4], m[5], m[6], m[7]);
      return new Date(+m[3], MON_IX[m[2].toLowerCase()], +m[1], t1[0], t1[1], t1[2]).getTime();
    }
    // Sep 24, 2024 6:30 PM
    m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/);
    if (m && MON_IX[m[1].toLowerCase()] !== undefined) {
      var t2 = hm(m[4], m[5], m[6], m[7]);
      return new Date(+m[3], MON_IX[m[1].toLowerCase()], +m[2], t2[0], t2[1], t2[2]).getTime();
    }
    /* A spreadsheet's own day count, from 1900. Counted in UTC, where every
       day is 24 hours: counted from local midnight in 1899, a zone whose
       clocks then differed from now brought the difference along (Noumea's
       were 5 minutes 48 seconds ahead of today's), and every date read as
       the day before. */
    if (/^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 80000) {
      var days = Math.floor(+s), frac = +s - days;
      var dd = new Date(Date.UTC(1899, 11, 30) + days * DAY_MS);
      return new Date(dd.getUTCFullYear(), dd.getUTCMonth(), dd.getUTCDate(), frac ? 0 : 12, 0, 0).getTime() + Math.round(frac * DAY_MS);
    }
    /* Anything else the browser can read, but only with a year in it: "15-Jan"
       or "3/15" would otherwise come in as 2001, silently. */
    if (!/\b(19|20)\d{2}\b/.test(s)) return null;
    var tt = Date.parse(s);
    return fin(tt) && new Date(tt).getFullYear() >= 1990 ? tt : null;
  }
  function sgUnit(s, unit) {
    if (s.su && s.su !== unit && s.w > 0) s.w = Math.round((s.su === 'kg' ? s.w * 2.20462 : s.w / 2.20462) * 2) / 2;
    delete s.su;
    return s;
  }
  // letters and digits, the same every time the same workout comes in
  function sgId(w) {
    var h = 2166136261;
    for (var i = 0; i < w.key.length; i++) { h ^= w.key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'sg' + w.st.toString(36) + h.toString(36).slice(0, 4);
  }
  var SG_RANGES = [[0, 'Everything'], [24, 'Last 2 years'], [12, 'Last year'], [6, 'Last 6 months']];
  // what a Strengthen record can hold, leaving Nourish the rest of the account's 1 MB
  var SG_ROOM = 600 * 1024;
  function sgPick(G, months) {
    var from = months ? Date.now() - months * 30.44 * DAY_MS : 0;
    /* Here already: brought in before, or the same session from another app.
       Two apps stamp one session a minute or two apart (Strong keeps the
       seconds, Hevy drops them), so anything within five minutes is it. */
    var at = {}, NEAR = 5;
    Object.keys(T.wo).forEach(function (k) { if (T.wo[k] && fin(T.wo[k].st)) at[Math.floor(T.wo[k].st / 60000)] = 1; });
    var near = function (st) {
      var m = Math.floor(st / 60000);
      for (var d = -NEAR; d <= NEAR; d++) if (at[m + d]) return true;
      return false;
    };
    return G.wos.filter(function (w) { return w.st >= from && !T.wo[sgId(w)] && !near(w.st); });
  }
  function sgWo(G, w, ids) {
    var x = [], at = {};
    w.x.forEach(function (sx) {
      var e = ids[sx.nm];
      if (!e) return;
      // two of Strong's exercises matched to one of ours become one
      var ss = sx.s.map(function (s) {
        var c = sgUnit(clean(s), G.unit);
        // a minus is the help on an assisted lift; on anything else it is no weight
        if (c.ng) { if (!ASST[e]) c.w = 0; delete c.ng; }
        return c;
      });
      if (at[e] !== undefined) { x[at[e]].s = x[at[e]].s.concat(ss); return; }
      at[e] = x.length;
      x.push({ e: e, s: ss });
    });
    var wo = { id: sgId(w), st: w.st, dk: dayKey(new Date(w.st)), n: w.n, u: G.unit, x: x, im: 's' };
    if (w.bw > 0) wo.bw = w.bwu && w.bwu !== G.unit ? Math.round((w.bwu === 'kg' ? w.bw * 2.20462 : w.bw / 2.20462) * 10) / 10 : w.bw;
    if (w.dur > 0 && w.dur < DAY_MS) wo.en = w.st + w.dur;
    var nt = w.nt.join('\n').slice(0, 1000);
    if (nt) wo.nt = nt;
    return wo;
  }
  // what would come in, as workouts, for the size of it
  function sgList(G, months) {
    var ids = {};
    G.names.forEach(function (n) { ids[n.nm] = n.e || 'cx0000000000000'; });
    return sgPick(G, months).map(function (w) { return sgWo(G, w, ids); });
  }
  function sgSize(G, months) {
    var ids = {};
    G.names.forEach(function (n) { ids[n.nm] = n.e || 'cx0000000000000'; });
    return sgPick(G, months).reduce(function (a, w) { return a + JSON.stringify(sgWo(G, w, ids)).length + 40; }, 0);
  }
  /* The biggest range that fits, chosen for you; smaller ones to pick. */
  function sgFit(G) {
    G.size = {};
    SG_RANGES.forEach(function (r) { G.size[r[0]] = sgSize(G, r[0]); });
    for (var i = 0; i < SG_RANGES.length; i++) if (!fitSay(sgList(G, SG_RANGES[i][0]))) return SG_RANGES[i][0];
    return SG_RANGES[SG_RANGES.length - 1][0];
  }

  function readStrong(file) {
    var fr = new FileReader();
    fr.onload = function () { imRead(fr.result); };
    fr.readAsText(file);
  }
  // a file or pasted rows: straight to what came in, or first to matching its columns
  function imRead(text) {
    var G = sgParse(text);
    if (G.need === 'map') {
      S.imap = G;
      openSheet({ k: 'immap', eyebrow: 'Import', title: 'Match the columns' });
      return;
    }
    if (!G.err) G.range = sgFit(G);
    S.sg = G;
    openSheet({ k: 'strong', eyebrow: 'Import', title: G.app ? 'From ' + G.app : 'Import' });
  }

  function imPasteHTML() {
    return '<h2 class="sheet-name tr-sn2">Paste from a spreadsheet</h2>' +
      '<div class="tr-sub">In Excel, Google Sheets or Numbers, select the rows with the heading row at the top, copy, and paste here. One row a set, or a row with a column for how many sets.</div>' +
      '<textarea class="txt tr-paste" id="trPaste" rows="8" placeholder="Date\tExercise\tWeight\tReps\n2024-09-24\tBench Press\t185\t8"></textarea>' +
      (S.imErr ? '<div class="tr-note tr-warn">' + esc(S.imErr) + '</div>' : '') +
      '<div class="tr-acts"><button class="btn-primary" data-t="impread">Read it</button><button class="ghost" data-t="close">Cancel</button></div>';
  }

  /* Matching the columns of a file no app of ours wrote: each thing a set
     needs beside the heading it guessed, and the first rows read that way,
     so a wrong guess shows before anything comes in. */
  function imMapHTML() {
    var M = S.imap;
    if (!M) return '';
    var opts = function (cur) {
      return '<option value="-1"' + (cur < 0 ? ' selected' : '') + '>\u2014 none \u2014</option>' + M.head.map(function (h, i) {
        return '<option value="' + i + '"' + (cur === i ? ' selected' : '') + '>' + esc(h || 'Column ' + (i + 1)) + '</option>';
      }).join('');
    };
    var ok = M.C.date >= 0 && M.C.ex >= 0 && M.C.r >= 0;
    var G = ok ? sgParse(M.text, { C: M.C, order: M.order === 'bad' ? '' : M.order, unit: M.unit, app: 'your file' }) : null;
    var peek = G && !G.err ? G.wos.slice(0, 3).map(function (w) {
      return '<li>' + esc(when(w.st)) + ' \u00b7 ' + w.x.map(function (x) {
        var z = x.s[0];
        return esc(x.nm) + ' ' + x.s.length + ' \u00d7 ' + z.r + (z.w > 0 ? ' @ ' + fmtN(z.w) : '');
      }).join(', ') + '</li>';
    }).join('') : '';
    var dates = M.C.date >= 0 && /\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/.test(String((csvRows(M.text)[1] || [])[M.C.date] || ''));
    return '<h2 class="sheet-name tr-sn2">Match the columns</h2>' +
      '<div class="tr-sub">' + (M.err ? esc(M.err) : 'This file isn\u2019t from an app we know, so say which column is which. Only the date, the exercise and the reps are needed.') +
        ' ' + M.n + ' row' + (M.n === 1 ? '' : 's') + '.</div>' +
      /* The six most files have, then the rest folded away, open when one of
         them was matched. */
      (function () {
        var row = function (ro) {
          return '<label class="tr-imr"><span>' + ro[1] + (ro[2] ? ' <b>*</b>' : '') + '</span>' +
            '<select class="tr-in" data-imc="' + ro[0] + '" aria-label="Which column is ' + esc(ro[1]) + '">' + opts(M.C[ro[0]] === undefined ? -1 : M.C[ro[0]]) + '</select></label>';
        };
        var more = IM_ROLES.slice(6), open = more.some(function (ro) { return M.C[ro[0]] >= 0; }) || S.imMore;
        return '<div class="tr-imap">' + IM_ROLES.slice(0, 6).map(row).join('') + '</div>' +
          '<details class="tr-immore" id="trImMore"' + (open ? ' open' : '') + '><summary>More columns, if the file has them</summary>' +
            '<div class="tr-imap">' + more.map(row).join('') + '</div></details>';
      }()) +
      (dates ? '<div class="tr-q"><div class="tr-ql">Dates are written</div>' + chips('imord', M.order === 'dmy' ? 'dmy' : 'mdy', [['mdy', 'Month first (9/24)'], ['dmy', 'Day first (24/9)']]) +
        (M.order === 'dmy' || M.order === 'mdy' ? '<div class="tr-hint">Worked out from the file.</div>' : '') + '</div>' : '') +
      (G && G.err ? '<div class="tr-note tr-warn">' + esc(G.err) + '</div>' : '') +
      (peek ? '<div class="tr-ql tr-chart-h">Read this way, the first workouts are</div><ul class="tr-fits">' + peek + '</ul>' : '') +
      '<div class="tr-acts"><button class="btn-primary" data-t="imok"' + (ok && G && !G.err ? '' : ' disabled') + '>Next</button>' +
        '<button class="ghost" data-t="close">Cancel</button></div>';
  }

  function strongHTML() {
    var G = S.sg;
    if (!G) return '';
    if (G.err) return '<h2 class="sheet-name tr-sn2">Import</h2><div class="tr-note">' + esc(G.err) + '</div>';
    var pick = sgPick(G, G.range);
    var had = G.wos.length - sgPick(G, 0).length;
    var add = G.size[G.range] || 0;
    var over = fitSay(sgList(G, G.range));
    var matched = G.names.filter(function (n) { return n.e; }).length;
    return '<h2 class="sheet-name tr-sn2">From ' + esc(G.app || 'your file') + '</h2>' +
      '<div class="tr-sub">' + G.wos.length + ' workouts, ' + when(G.wos[0].st) + ' to ' + when(G.wos[G.wos.length - 1].st) +
        (had ? '. ' + had + ' of them ' + (had === 1 ? 'is' : 'are') + ' here already and ' + (had === 1 ? 'is' : 'are') + ' left alone' : '') +
        (G.skipped ? '. ' + G.skipped + ' timed or distance set' + (G.skipped === 1 ? '' : 's') + ' left out' : '') + '.</div>' +
      (G.fixedUnit ? '' : q('Weights in this file are in', chips('sgu', G.unit, [['lb', 'Pounds'], ['kg', 'Kilograms']]),
        'The file doesn\u2019t say, so which it was set to.')) +
      '<div class="tr-q"><div class="tr-ql">How far back</div>' +
        chips('sgr', G.range, SG_RANGES.map(function (r) { return [r[0], r[1] + ' (' + sgPick(G, r[0]).length + ')']; })) +
        '<div class="tr-hint' + (over ? ' tr-warn' : '') + '">' + esc(over ||
          (add < 1024 ? 'Under 1 KB' : 'About ' + Math.round(add / 1024) + ' KB') +
          (!doc ? ', kept on this phone.' : YR.on === true ? ', kept a year to a record in your account.' : ', which fits beside Nourish in your account.')) + '</div></div>' +
      '<div class="tr-q"><div class="tr-ql">Exercises</div>' +
        '<div class="tr-hint">' + matched + ' of ' + G.names.length + ' matched to the library. The rest come in as your own: check what each one trains, or match it yourself.</div>' +
        '<div class="tr-sgl">' + G.names.map(function (n, i) {
          return '<div class="tr-sgr"><div class="tr-sgr-n">' + esc(n.nm) + ' <span class="tr-sgr-c">' + n.n + ' set' + (n.n === 1 ? '' : 's') + '</span></div>' +
            (n.e ? '<div class="tr-sgr-t">\u2192 ' + esc(lib(n.e).n) + '</div>' +
                '<div class="tr-sgr-a"><button class="tr-lnk" data-t="sgmap" data-i="' + i + '">Change</button>' +
                '<button class="tr-lnk" data-t="sgown" data-i="' + i + '">Keep as its own</button></div>'
              : '<div class="tr-sgr-t">\u2192 your own, trains <select class="tr-sgm" data-sgm="' + i + '" aria-label="What ' + esc(n.nm) + ' trains">' +
                  MUSCLES.map(function (m) { return '<option value="' + m.k + '"' + (n.m === m.k ? ' selected' : '') + '>' + esc(m.n) + '</option>'; }).join('') +
                '</select></div>' +
                '<div class="tr-sgr-a"><button class="tr-lnk" data-t="sgmap" data-i="' + i + '">Match to the library</button></div>') +
          '</div>';
        }).join('') + '</div></div>' +
      '<div class="tr-acts"><button class="btn-primary" data-t="sggo"' + (pick.length && !over ? '' : ' disabled') + '>' +
        (pick.length ? 'Bring in ' + pick.length + ' workout' + (pick.length === 1 ? '' : 's') : 'Nothing new to bring in') + '</button>' +
        '<button class="ghost" data-t="close">Cancel</button></div>';
  }

  /* A workout deleted: gone here, and gone from its year's record too. */
  function dropWo(id) {
    if (T.wo[id]) YR.gone[id] = yearOf(T.wo[id]);
    delete T.wo[id];
    stamp('wo', id);
  }

  /* Stamped all at once: a stamp a workout would write the whole record to
     this phone once per workout, and a few hundred of them is a stall. */
  function stampMany(part, keys) {
    var now = Date.now();
    keys.forEach(function (k) {
      TS[part][k] = now;
      if (dirty[part] !== true) { dirty[part] = dirty[part] || {}; dirty[part][k] = 1; }
    });
    saveT();
    push();
  }

  function sgGo() {
    var G = S.sg;
    if (!G || G.err || fitSay(sgList(G, G.range))) return 0;
    var ids = {}, made = [], used = {};
    var pick = sgPick(G, G.range);
    pick.forEach(function (w) { w.x.forEach(function (x) { used[x.nm] = 1; }); });
    // your own: the one already made from an earlier import, else a new one
    var byName = {};
    Object.keys(T.cx).forEach(function (id) { byName[String(T.cx[id].n).toLowerCase()] = id; });
    G.names.forEach(function (n) {
      if (n.e) { ids[n.nm] = n.e; return; }
      if (!used[n.nm]) return;
      var have = byName[n.nm.toLowerCase()];
      if (have) { ids[n.nm] = have; return; }
      var id = 'cx' + newId() + made.length;
      T.cx[id] = { n: n.nm.slice(0, 60), m: MUS[n.m] ? n.m : 'chest', q: EQUIP[n.q] ? n.q : 'mc', k: n.k === 'c' ? 'c' : 'i' };
      byName[n.nm.toLowerCase()] = id;
      ids[n.nm] = id;
      made.push(id);
    });
    var put = [];
    pick.forEach(function (w) {
      var wo = sgWo(G, w, ids);
      if (!wo.x.length || !SHAPE.wo(wo)) return;
      T.wo[wo.id] = clean(wo);
      put.push(wo.id);
    });
    if (made.length) stampMany('cx', made);
    if (put.length) stampMany('wo', put);
    return put.length;
  }

  function act(el) {
    var t = el.getAttribute('data-t');
    var v = el.getAttribute('data-v');
    var num = function (a) { return Number(el.getAttribute(a)); };
    var ms;

    if (t !== 'save') S.justSaved = '';
    if (t !== 'sggo') S.sgDone = 0;
    if (t === 'close') { closeSheet(); return; }
    if (t === 'sub') { setSub(v); return; }
    if (t === 'minim') { S.minim = 1; draw(); return; }
    if (t === 'focus') { setSub('block'); scrollTop(); return; }
    if (t === 'ref') {
      var box = $('trRefs'), dt = $('tr-ref-' + v);
      if (box) box.open = true;
      if (dt) {
        dt.scrollIntoView({ block: 'center' });
        dt.classList.add('tr-hl');
        setTimeout(function () { dt.classList.remove('tr-hl'); }, 1600);
      }
      return;
    }
    if (t === 'settings') { S.imp = null; S.impErr = ''; openSheet({ k: 'set', eyebrow: 'Strengthen', title: 'Settings' }); return; }

    // the quiz
    if (t === 'qzback') {
      var zb0 = quiz();
      zb0.back = !zb0.back;
      if (!zb0.back) { zb0.a.bk = ''; zb0.bku = false; }
      draw(); return;
    }
    if (t === 'qzbku') {
      var zu = quiz();
      zu.bku = !zu.bku;
      zu.a.bk = zu.bku ? 'fcx' : '';
      draw(); return;
    }
    if (t === 'qz' || t === 'qzm') {
      var z = quiz(), f = el.getAttribute('data-f');
      if (t === 'qzm') {
        if (f === 'hab') z.a.hab = toggleIn(z.a.hab, v);
        else {
          // picking a trigger replaces "not sure"
          if (f === 'bk' && z.bku) { z.bku = false; z.a.bk = ''; }
          var order = f === 'jt' ? 'NSEWHKA' : 'fcx';
          z.a[f] = toggleIn(z.a[f].split(''), v).sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); }).join('');
        }
      } else {
        var val = ['lvl', 'dpw', 'min'].indexOf(f) >= 0 ? Number(v) : v;
        // your days are a choice you can take back
        z.a[f] = f === 'day' && z.a.day === val ? '' : val;
        z.set[f] = 1;
        if (QONE.indexOf(f) >= 0) {
          if (z.i >= QSTEPS.length - 1) { quizDone(); return; }
          z.i++;
          draw(); scrollTop(); return;
        }
      }
      draw(); return;
    }
    if (t === 'qzn') {
      var zn = quiz();
      // Back ticked and nothing said about it: not sure, so play it safe
      if (QSTEPS[zn.i] === 'pain' && zn.back && !zn.a.bk) { zn.a.bk = 'fcx'; zn.bku = true; }
      if (zn.i >= QSTEPS.length - 1) { quizDone(); return; }
      zn.i++; draw(); scrollTop(); return;
    }
    if (t === 'qzb') { var zb = quiz(); zb.i = Math.max(0, zb.i - 1); draw(); scrollTop(); return; }
    if (t === 'qzx') { S.qz = null; draw(); return; }
    if (t === 'qznew') {
      T.pr = defaultsPr(Object.assign({}, T.pr, { lvl: 0, qz: Date.now() }));
      stamp('pr');
      S.qz = null; S.lib = false; S.opt = null;
      draw(); scrollTop(); return;
    }
    if (t === 'qzskip') {
      T.pr.qz = Date.now();
      stamp('pr');
      S.qz = null;
      draw(); return;
    }
    if (t === 'requiz') {
      if (S.sheet) closeSheet();
      S.qz = null; S.opt = null; S.draft = null;
      quiz();
      setSub('block');
      scrollTop(); return;
    }

    // the picks and the library
    if (t === 'lib') { S.lib = true; draw(); scrollTop(); return; }
    if (t === 'unlib') { S.lib = false; draw(); scrollTop(); return; }
    if (t === 'browse') { S.browse = true; S.lib = false; draw(); scrollTop(); return; }
    if (t === 'ldopen') { S.ldOpen = true; S.ldDraft = ldDays().slice(); draw(); return; }
    /* History, by block. */
    if (t === 'hview') {
      S.hv = v === 'wo' ? 'wo' : 'blk'; S.hb = ''; S.hbSel = null; S.hbRen = '';
      try { localStorage.setItem(LS_HV, S.hv); } catch (e) { /* private mode */ }
      draw(); return;
    }
    if (t === 'hbopen') {
      if (!T.ms[el.getAttribute('data-id')]) return;
      S.hv = 'blk'; S.hb = el.getAttribute('data-id'); S.hbSel = null; S.hbRen = '';
      try { localStorage.setItem(LS_HV, 'blk'); } catch (e) { /* private mode */ }
      setSub('history'); scrollTop(); return;
    }
    if (t === 'hbclose') { S.hb = ''; S.hbSel = null; S.hbRen = ''; draw(); scrollTop(); return; }
    if (t === 'hbsel') {
      if (!S.hb || !T.ms[S.hb]) return;
      S.hbSel = { ms: S.hb, w: num('data-w'), d: num('data-d') }; S.planOpen = false;
      draw(); selInView(S.hbSel.w, S.hbSel.d); return;
    }
    if (t === 'hbren') {
      S.hbRen = el.getAttribute('data-id') || '';
      draw();
      var rn = $('trBlkName');
      if (rn) { rn.focus(); rn.select(); }
      return;
    }
    if (t === 'hbrensave') { blockRename(el.getAttribute('data-id')); return; }
    /* A block deleted: its plan, calendar, name and notes. Its workouts are
       the history and stay, records and charts with them; each still says
       which block it was, and everything that reads that copes with a block
       that is gone. The current block is ended as it goes. */
    if (t === 'hbdel') {
      var did = el.getAttribute('data-id'), dms = T.ms[did];
      if (!dms || (LIVE && LIVE.ms === did)) return;
      var nwo = ix().list.filter(function (wo) { return wo.ms === did; }).length;
      var dq = { title: 'Delete this block?',
        body: (nwo ? 'Its ' + nwo + ' workout' + (nwo === 1 ? '' : 's') + ' stay in Workouts and Lifts, with their records. ' : '') +
          'Its calendar, plan and notes go' + (did === T.act ? ', and it stops being your current block.' : '.'),
        ok: 'Delete it', danger: true };
      var dgo = function () {
        if (!T.ms[did] || (LIVE && LIVE.ms === did)) return;
        delete T.ms[did];
        stamp('ms', did);
        if (T.act === did) { T.act = ''; stamp('act'); }
        S.hb = ''; S.hbSel = null; S.hbRen = '';
        draw(); scrollTop();
      };
      var dh = hive();
      if (dh && dh.ask) dh.ask(dq, function (yes) { if (yes) dgo(); });
      else if (window.confirm(dq.title)) dgo();
      return;
    }
    if (t === 'hbagain') {
      var src = T.ms[el.getAttribute('data-id')];
      if (!src || LIVE) return;
      /* The same block again: its days and exercises as they stood at the
         end (swaps for the rest of the block included), none of its
         progress. The weights come from your log as they always do, so it
         starts from where the lifts are now; a strength wave hands on the
         training maxes its last as-many-as-you-can sets earned. */
      var nb = clean(src);
      nb.id = newId(); nb.at = Date.now(); nb.sk = [];
      ['st', 'ph', 'dlw', 'note', 'n0', 'named'].forEach(function (k) { delete nb[k]; });
      if (src.goal === 'str') { nb.tm = nextTm(src); nb.tu = T.pr.u; }
      nb.again = src.id;
      S.draft = nb; S.opt = null; S.browse = false; S.lib = false;
      S.hb = ''; S.hbSel = null; S.hbRen = '';
      setSub('block'); scrollTop(); return;
    }
    if (t === 'gridsel') {
      ms = active();
      if (!ms) return;
      var gw = num('data-w'), gd = num('data-d');
      S.sel = { ms: ms.id, w: gw, d: gd }; S.gridTapped = true; S.planOpen = false;
      draw();
      selInView(gw, gd);
      return;
    }
    if (t === 'info') { S.info = S.info === v ? '' : v; drawSheet(); return; }

    if (t === 'whyopen') { S.whyOpen = S.whyOpen === v ? '' : v; if (S.sheet) drawSheet(); else draw(); return; }
    if (t === 'ckopen') { S.ck = S.ck || {}; S.ck[v] = !S.ck[v]; draw(); return; }
    if (t === 'fixset') {
      var fms = active(), fd = num('data-d'), fi = num('data-i');
      var fsl = fms && fms.days[fd] && fms.days[fd].s[fi];
      if (!fsl || fsl.n >= 6) return;
      var fc = clean(fms);
      fc.days[fd].s[fi].n = fsl.n + 1;
      fc.fixd = (Array.isArray(fc.fixd) ? fc.fixd : []).concat(el.getAttribute('data-k') || '').slice(-40);
      editBlock(fc);
      // said as next week's plan has it, which is what the change is for
      var fnx = nextSlot(fc), fsets = fnx ? plan(fc, fnx.w, fd).x[fi].sets : fsl.n + 1;
      S.flash2 = 'Added a set: ' + lib(fsl.e).n + ' on ' + dayName(fc.days[fd]) + ' is ' + fsets + ' sets next time, and one more than it would have been for the rest of the block.';
      draw(); return;
    }
    if (t === 'planopen') { S.planOpen = !S.planOpen; draw(); return; }
    if (t === 'ldcancel') { S.ldOpen = false; S.ldDraft = null; draw(); return; }
    if (t === 'ldpick') {
      var dr = (S.ldDraft || []).slice(), di = Number(v), at = dr.indexOf(di);
      if (at >= 0) dr.splice(at, 1); else dr.push(di);
      S.ldDraft = dr; draw(); return;
    }
    if (t === 'ldsave') {
      var bm = active();
      if (!bm || !S.ldDraft || S.ldDraft.length !== liftCols(bm).length) return;
      setLd(S.ldDraft, false);
      S.ldOpen = false; S.ldDraft = null;
      draw(); return;
    }
    if (t === 'unbrowse') { S.browse = false; S.lib = false; S.opt = null; draw(); scrollTop(); return; }
    if (t === 'prog') { S.opt = optFor(v); draw(); scrollTop(); return; }
    var o = S.opt;
    if (o && t === 'o-dpw') { o.dpw = Number(v); draw(); return; }
    if (o && t === 'o-ez') { o.ez = Number(v) ? 1 : 0; draw(); return; }
    if (o && t === 'o-min') { o.min = Number(v); draw(); return; }
    if (o && t === 'o-kit') { o.kit = v; draw(); return; }
    if (o && t === 'o-acc') { o.acc = Number(v); draw(); return; }
    if (o && t === 'o-fx') { o.fx = v; draw(); return; }
    if (o && t === 'o-wave') { o.wave = Number(v); draw(); return; }
    if (o && t === 'o-pri') {
      var pri = o.pri, at = pri.indexOf(v);
      if (at >= 0) pri.splice(at, 1);
      else { pri.push(v); if (pri.length > 3) pri.shift(); }
      draw(); return;
    }
    if (t === 'unopt') { S.opt = null; draw(); scrollTop(); return; }
    if (t === 'build' && o) {
      if (o.prog === 'focus' && !FOCUS[o.fx]) return;
      /* The days, minutes and kit chosen here are this block's. Your answers
         stay as you gave them — a fortnight of hotel-room push-ups is not a
         new you. */
      o.seed = 0;
      S.draft = build(Object.assign(profileOpts(), o, o.tm ? { tm: o.tm } : {}));
      draw(); scrollTop(); return;
    }
    if (t === 'shuffle' && o) {
      o.seed = (o.seed || 0) + 1;
      var keepId = S.draft.id, keepName = S.draft.named ? S.draft.n : null;
      S.draft = build(Object.assign(profileOpts(), o, S.draft.tm ? { tm: S.draft.tm } : {}));
      S.draft.id = keepId;
      // the exercises are new; a name you gave it is still yours
      if (keepName !== null) { S.draft.n = keepName; S.draft.named = 1; }
      draw(); return;
    }
    if (t === 'undraft') { S.draft = null; draw(); scrollTop(); return; }
    if (t === 'begin') { beginDraft(); return; }
    if (t === 'dset') {
      var sl = S.draft.days[num('data-d')].s[num('data-i')];
      sl.n = Math.max(1, Math.min(6, sl.n + Number(v)));
      draw(); return;
    }
    if (t === 'ddel') { S.draft.days[num('data-d')].s.splice(num('data-i'), 1); draw(); return; }
    if (t === 'dswap') {
      var cur = lib(S.draft.days[num('data-d')].s[num('data-i')].e);
      S.q = ''; S.qm = cur.m;
      openSheet({ k: 'pick', mode: 'dswap', d: num('data-d'), i: num('data-i'), eyebrow: 'Swap', title: 'Swap ' + cur.n });
      return;
    }
    if (t === 'dadd') {
      S.q = ''; S.qm = '';
      openSheet({ k: 'pick', mode: 'dadd', d: num('data-d'), eyebrow: 'Add', title: 'Add to ' + S.draft.days[num('data-d')].n });
      return;
    }
    if (t === 'again') {
      ms = active();
      if (ms) {
        var pid = PROGS[ms.prog] ? ms.prog : isKeep(ms) ? 'keep' : 'grow';
        var P = PROGS[pid];
        S.opt = {
          prog: pid,
          dpw: P.dpw.indexOf(ms.dpw) >= 0 ? ms.dpw : fitDpw(P, ms.days.filter(function (d) { return !d.ez; }).length),
          ez: ms.days.some(function (d) { return d.ez; }) ? 1 : 0,
          min: T.pr.min,
          kit: KITS[ms.kit] ? ms.kit : 'gym',
          acc: P.acc.indexOf(ms.acc) >= 0 ? ms.acc : P.dAcc,
          pri: (Array.isArray(ms.pri) ? ms.pri : []).filter(function (m) { return MUS[m]; }).slice(0, 3),
          fx: FOCUS[ms.fk] ? ms.fk : '',
          // a fresh set of exercises, so the next block is not the last one again
          seed: (ms.seed || 0) + 1,
          // and a strength wave hands the next one its reps and its maxes
          wave: ms.goal === 'str' ? NEXT_WAVE[ms.wave] || 10 : 10,
          tm: ms.goal === 'str' ? nextTm(ms) : null
        };
      }
      T.act = '';
      stamp('act');
      draw(); scrollTop(); return;
    }

    // the block
    if (t === 'start') {
      ms = active();
      if (!ms) return;
      if (S.sheet) closeSheet();
      S.sel = null;
      startPlanned(ms, num('data-w'), num('data-d'));
      return;
    }
    /* A week out of following Nourish's calories, and back in. Undone
       before the week has begun, it keeps what Nourish says now, so that
       following again restores this, not whatever is read by then. */
    if (t === 'phoff' || t === 'phon') {
      ms = active();
      var phw = num('data-w');
      if (!ms || !fin(phw) || phw < 0 || phw >= accOf(ms)) return;
      ms.ph = plain(ms.ph) ? ms.ph : {};
      var phk = phOk(ms.ph[phw]) ? ms.ph[phw] : null;
      if (!phk) {
        var phn = phaseNow();
        if (!phn) return;
        phk = { k: phn.k, r: phn.r, s: phn.s, c: phn.c };
      }
      if (t === 'phoff') phk.off = 1; else delete phk.off;
      ms.ph[phw] = phk;
      stamp('ms', ms.id);
      draw();
      return;
    }
    if (t === 'empty') { startEmpty(); return; }
    // your weight on a pull-up day
    if (t === 'bwqsave') { bwSave(false); return; }
    if (t === 'bwqkeep') { bwSave(true); return; }
    if (t === 'bwqold' && LIVE) {
      var bo = bwInfo(dayKey(new Date(LIVE.st)), LIVE.u || T.pr.u);
      if (bo) { LIVE.bw = bo.v; LIVE.bwq = 'old'; LIVE.bwo = 0; S.bwOdd = null; startTuck(LIVE); saveLive(); draw(); }
      return;
    }
    if (t === 'bwqskip' && LIVE) { LIVE.bwq = 'skip'; LIVE.bwo = 0; S.bwOdd = null; startTuck(LIVE); saveLive(); draw(); return; }
    if (t === 'bwopen' && LIVE) { LIVE.bwo = 1; LIVE.sto = 1; saveLive(); draw(); return; }
    if (t === 'bwqwhy') { S.bwWhy = !S.bwWhy; draw(); return; }
    if (t === 'bwqnever' && LIVE) { T.pr.nobw = 1; stamp('pr'); LIVE.bwq = 'skip'; LIVE.bwo = 0; S.bwOdd = null; startTuck(LIVE); saveLive(); draw(); return; }
    if (t === 'stopen' && LIVE) { LIVE.sto = 1; saveLive(); draw(); return; }
    if (t === 'stdone' && LIVE) { delete LIVE.sto; LIVE.bwo = 0; saveLive(); draw(); return; }
    if (t === 'hwok') { T.pr.hw = 1; stamp('pr'); draw(); return; }
    // ready workouts: the list, a row opened, the half-hour version, a start
    if (t === 'ready') { S.rdo = ''; S.arm = ''; openSheet({ k: 'ready', eyebrow: 'Ready workouts', title: 'Pick a ready workout' }); return; }
    if (t === 'rdopen') { S.rdo = S.rdo === v ? '' : v; S.arm = ''; drawSheet(); if (S.rdo) sheetShow(document.querySelector('#trainRoot .tr-rdr.on')); return; }
    if (t === 'rdxp') { S.rdx = Number(v) ? 1 : 0; drawSheet(); return; }
    if (t === 'rdgo') { startReady(v, !!S.rdx && !T.rt[v], Number(el.getAttribute('data-e'))); return; }
    if (t === 'rtdel') {
      if (S.arm !== 'rt:' + v) { S.arm = 'rt:' + v; drawSheet(); return; }
      S.arm = '';
      delete T.rt[v];
      stamp('rt', v);
      S.rdo = '';
      drawSheet();
      return;
    }
    if (t === 'rtsave') { openSheet({ k: 'rtnew', id: el.getAttribute('data-id'), eyebrow: 'Routine', title: 'Save as routine' }); return; }
    if (t === 'rtdo') {
      var rn = $('trRtN');
      if (saveRoutine(el.getAttribute('data-id'), rn ? rn.value : '')) { S.sheet.done = 1; drawSheet(); }
      return;
    }
    if (t === 'plansheet') {
      ms = active();
      openSheet({ k: 'plan', w: num('data-w'), d: num('data-d'), eyebrow: ms ? ms.n : '', title: 'Session' });
      return;
    }
    if (t === 'skip') {
      if (S.sheet) closeSheet();
      ms = clean(active());
      var skv = num('data-w') + ':' + num('data-d');
      ms.sk = (ms.sk || []).concat(skv);
      S.sel = null;
      editBlock(ms);
      /* One tap beside Start, and the block had moved on with no way back but
         knowing to open the grid. Done at once, with Undo for a few seconds. */
      var skn = { ms: ms.id, v: skv, n: (ms.days[num('data-d')] || {}).n || 'the session', until: Date.now() + 8000 };
      S.undoSk = skn;
      setTimeout(function () { if (S.undoSk === skn) { S.undoSk = null; drawIfShowing(); } }, 8100);
      draw(); return;
    }
    if (t === 'unskip') {
      var us = S.undoSk;
      S.undoSk = null;
      ms = active();
      if (us && ms && ms.id === us.ms && (ms.sk || []).indexOf(us.v) >= 0) {
        ms = clean(ms);
        ms.sk.splice(ms.sk.indexOf(us.v), 1);
        editBlock(ms);
      }
      draw(); return;
    }
    if (t === 'deloadnow' || t === 'endblock') {
      var h = hive();
      var go = function () {
        ms = active();
        if (!ms) return;
        if (t === 'deloadnow') {
          var nx = nextSlot(ms);
          var c = clean(ms);
          c.dlw = nx ? nx.w : c.acc;
          editBlock(c);
        } else {
          T.act = '';
          stamp('act');
        }
        draw();
      };
      var q = t === 'deloadnow'
        ? { title: 'Deload from this week?', body: 'The rest of this week becomes the deload: half the sets, lighter, well short of failure. Worth it when the lifts are sliding or everything aches.', ok: 'Deload now' }
        : { title: 'End this block?', body: 'Its workouts stay in History and Lifts. You can build a new block straight away.', ok: 'End it', danger: true };
      if (h && h.ask) h.ask(q, function (yes) { if (yes) go(); });
      else if (window.confirm(q.title)) go();
      return;
    }

    // the logger
    if (t === 'tick') { tick(num('data-x'), num('data-s')); return; }
    if (t === 'sty' && LIVE) { openSheet({ k: 'sty', x: num('data-x'), s: num('data-s'), eyebrow: 'Set', title: 'Set' }); return; }
    if ((t === 'styset' || t === 'styrm') && LIVE && S.sheet && S.sheet.k === 'sty') {
      var sx = LIVE.x[S.sheet.x], ss = sx && sx.s[S.sheet.s];
      if (!ss) { closeSheet(); return; }
      if (t === 'styrm') { if (sx.s.length > 1) sx.s.splice(S.sheet.s, 1); }
      else {
        if (v === 'w') ss.wu = 1; else delete ss.wu;
        if (v === 'd' || v === 'f' || v === 'm') ss.ty = v; else delete ss.ty;
      }
      remapPrev(sx);
      saveLive(); closeSheet(); draw(); return;
    }
    if (t === 'rest') {
      if (!LIVE || !LIVE.rs) return;
      if (v === 'skip') LIVE.rs = null;
      else { LIVE.rs.end += Number(v) * 1000; LIVE.rs.dur = Math.max(1, LIVE.rs.dur + Number(v)); }
      saveLive(); drawRest(); return;
    }
    // the weight your effort gave, or the usual step: the sets not yet done take whichever
    if (t === 'efset' && LIVE) {
      var xe = LIVE.x[num('data-x')];
      if (!xe || !xe.ef) return;
      xe.ef.on = xe.ef.on ? 0 : 1;
      var use = xe.ef.on ? xe.ef.a1 : xe.ef.a0, k = 0;
      xe.s.forEach(function (z) {
        if (z.wu) return;
        var v = use[k] || use[use.length - 1];
        k++;
        if (!z.t && v) { z.tw = v[0]; z.tr = v[1]; }
      });
      saveLive(); draw(); return;
    }
    if (t === 'addset') {
      var xa = LIVE.x[num('data-x')];
      var ls = xa.s[xa.s.length - 1] || {};
      xa.s.push({ w: '', r: '', t: 0, tw: ls.tw, tr: ls.tr, pw: ls.pw, pr: ls.pr });
      remapPrev(xa);
      saveLive(); draw(); return;
    }
    if (t === 'dropset') {
      var xd = LIVE.x[num('data-x')];
      for (var k = xd.s.length - 1; k >= 0; k--) { if (!xd.s[k].t) { xd.s.splice(k, 1); break; } }
      remapPrev(xd);
      saveLive(); draw(); return;
    }
    /* An exercise with sets already done asks twice: one stray tap under the
       sets used to take them all with it. */
    if (t === 'rmex') {
      var rx = num('data-x'), rdone = LIVE.x[rx] && LIVE.x[rx].s.some(function (z) { return z.t; });
      if (rdone && S.arm !== 'rm:' + rx) { S.arm = 'rm:' + rx; draw(); return; }
      S.arm = '';
      LIVE.x.splice(rx, 1); saveLive(); draw(); return;
    }
    if (t === 'swap') {
      var cx = lib(LIVE.x[num('data-x')].e);
      S.q = ''; S.qm = cx.m;
      openSheet({ k: 'pick', mode: 'swap', x: num('data-x'), sc: 'day', eyebrow: 'Swap', title: 'Swap ' + cx.n });
      return;
    }
    if (t === 'addex') { S.q = ''; S.qm = ''; openSheet({ k: 'pick', mode: 'add', eyebrow: 'Add', title: 'Add an exercise' }); return; }
    if (t === 'warm') { openSheet({ k: 'warm', x: num('data-x'), eyebrow: 'Warm-up', title: 'Warm-up' }); return; }
    if (t === 'warmadd') { warmAdd(num('data-x')); saveLive(); closeSheet(); draw(); return; }
    if (t === 'plates') {
      var px = LIVE.x[num('data-x')];
      var open = px.s.filter(function (s) { return !s.t; })[0] || px.s[0];
      var pw = numIn(open.w);
      if (pw === null) pw = fin(open.tw) ? open.tw : fin(open.pw) ? open.pw : null;
      openSheet({ k: 'plates', w: pw, e: px.e, eyebrow: 'Plate calculator', title: 'Plates' });
      return;
    }
    if (t === 'bk') {
      LIVE.bk = LIVE.bk === Number(v) ? undefined : Number(v);
      if (LIVE.bk === undefined) delete LIVE.bk;
      // answered, with everything else before you start, it folds away
      startTuck(LIVE);
      saveLive(); draw(); return;
    }
    if (t === 'sore') {
      var m = el.getAttribute('data-m');
      if (LIVE.sr[m] === Number(v)) delete LIVE.sr[m]; else LIVE.sr[m] = Number(v);
      if (LIVE.sro && fin(LIVE.sr[m])) delete LIVE.sro[m];
      if (LIVE.fbo && LIVE.fbo[m] && fbDone(m)) delete LIVE.fbo[m];
      saveLive(); draw(); return;
    }
    if (t === 'fb') {
      var fm = el.getAttribute('data-m'), ff = el.getAttribute('data-f');
      var f = LIVE.fb[fm] = LIVE.fb[fm] || {};
      if (f[ff] === Number(v)) delete f[ff]; else f[ff] = Number(v);
      // reopened to change an answer: tucked again once every question has one
      if (LIVE.fbo && LIVE.fbo[fm] && fbDone(fm)) delete LIVE.fbo[fm];
      saveLive();
      if (S.sheet && S.sheet.k === 'finish') drawSheet(); else draw();
      return;
    }
    if (t === 'healopen' && LIVE) {
      LIVE.sro = LIVE.sro || {}; LIVE.sro[el.getAttribute('data-m')] = 1;
      saveLive(); draw(); return;
    }
    if (t === 'fbopen' && LIVE) {
      var om = el.getAttribute('data-m');
      LIVE.fbo = LIVE.fbo || {}; LIVE.fbo[om] = 1;
      if (LIVE.fbh) delete LIVE.fbh[om];
      saveLive(); draw(); return;
    }
    if (t === 'fbhide' && LIVE) {
      var hm = el.getAttribute('data-m');
      LIVE.fbh = LIVE.fbh || {}; LIVE.fbh[hm] = 1;
      if (LIVE.fbo) delete LIVE.fbo[hm];
      saveLive(); draw(); return;
    }
    if (t === 'finish') { S.tmErr = ''; openSheet({ k: 'finish', eyebrow: 'Finish', title: 'Finish workout' }); return; }
    if (t === 'times' && LIVE) { S.tmErr = ''; openSheet({ k: 'times', eyebrow: 'Workout', title: 'Start time' }); return; }
    if (t === 'fintimes' && S.sheet) { S.sheet.tm = 1; S.tmErr = ''; drawSheet(); return; }
    if ((t === 'livetimeset' || t === 'fintimeset') && LIVE) {
      var k0 = t === 'livetimeset' ? 'live' : 'fin';
      var i0 = $('trT0-' + k0), i1 = $('trT1-' + k0);
      var st0 = dtParse(i0 && i0.value), en0 = i1 ? dtParse(i1.value) : null;
      if (i1 && !i1.value) en0 = null;
      S.tmErr = timesBad(st0, en0);
      if (!S.tmErr && k0 === 'live' && Date.now() - st0 > DAY_MS) S.tmErr = 'That is more than a day ago.';
      if (S.tmErr) { drawSheet(); return; }
      LIVE.st = st0;
      if (k0 === 'fin') { if (en0 !== null) LIVE.fe = en0; else delete LIVE.fe; S.sheet.tm = 0; }
      saveLive();
      if (k0 === 'live') closeSheet(); else drawSheet();
      draw(); return;
    }
    if (t === 'wocopy') {
      var cw = T.wo[el.getAttribute('data-id')];
      if (cw) copyText(woText(cw), el);
      return;
    }
    if (t === 'mcgo' && LIVE && LIVE.mc) {
      LIVE.mc.st = Date.now(); LIVE.mc.en = 0; LIVE.mc.rm = 0;
      LIVE.rs = null;
      audioPrime(); saveLive(); draw(); return;
    }
    if (t === 'mcstop' && LIVE && LIVE.mc && LIVE.mc.st) {
      var mcx = LIVE.mc;
      mcx.en = Date.now();
      if (mcx.k === 'rft') mcx.sec = clock(Math.min(mcMinutes(mcx) * 60, (mcx.en - mcx.st) / 1000));
      if (mcx.k === 'emom' && !mcx.done) mcx.done = String(Math.min(mcx.min, Math.floor((mcx.en - mcx.st) / 60000)));
      saveLive(); draw(); return;
    }
    if (t === 'mcreset' && LIVE && LIVE.mc) { LIVE.mc.st = 0; LIVE.mc.en = 0; LIVE.mc.rm = 0; saveLive(); draw(); return; }
    if (t === 'ticktyped' && LIVE) { tickTyped(); t = 'save'; }
    if (t === 'save') {
      audioPrime();
      var wo = saveWorkout();
      if (!wo) { closeSheet(); draw(); return; }
      S.justSaved = wo.id;
      draw();
      /* The summary takes the Finish sheet's place, so the back gesture
         closes it the same way, and the chime and the confetti go off with
         it. Not over a save that did not land on the phone. */
      var won = wins(wo);
      openSheet({ k: 'done', id: wo.id, eyebrow: 'Workout complete', title: 'Workout complete' });
      if (!LSFULL) celebrate(won.big);
      return;
    }
    if (t === 'discard' || t === 'discardnow') {
      if (t === 'discardnow') {
        if (S.arm !== 'discard') { S.arm = 'discard'; drawSheet(); return; }
        setLive(null); stopWake(); closeSheet(); draw(); return;
      }
      var hh = hive();
      var drop = function () { setLive(null); stopWake(); draw(); };
      var qq = { title: 'Discard this workout?', body: 'Nothing from it is saved.', ok: 'Discard', danger: true };
      if (hh && hh.ask) hh.ask(qq, function (yes) { if (yes) drop(); });
      else if (window.confirm(qq.title)) drop();
      return;
    }

    // the picker
    if (t === 'never') { S.never = !S.never; drawSheet(); return; }
    if (t === 'swsc' && S.sheet && S.sheet.mode === 'swap') {
      // choosing a length says never again was not meant
      S.sheet.sc = v === 'block' ? 'block' : 'day';
      S.never = false;
      drawSheet(); return;
    }
    if (t === 'pickm') { S.qm = v; drawSheet(); return; }
    if (t === 'liftm') { S.lm = v; draw(); return; }
    if (t === 'crng') { S.crng = v; drawSheet(); return; }
    if (t === 'pickex') { onPick(el.getAttribute('data-e')); return; }
    if (t === 'own') { S.own = { n: S.q, m: S.qm || 'chest', q: 'mc', k: 'i' }; drawSheet(); return; }
    if (t === 'ownsave') {
      var nm = ($('trOwnN').value || '').trim();
      if (!nm) { $('trOwnN').focus(); return; }
      var id = 'cx' + newId();
      T.cx[id] = { n: nm.slice(0, 60), m: $('trOwnM').value, q: $('trOwnQ').value, k: $('trOwnK').value };
      stamp('cx', id);
      S.own = null;
      onPick(id);
      return;
    }

    // the rest a lift takes
    if (t === 'restpick') { openSheet({ k: 'rest', e: el.getAttribute('data-e'), eyebrow: 'Rest', title: 'Rest' }); return; }
    if (t === 'restset') {
      setRest(el.getAttribute('data-e'), v === 'def' ? null : Number(v));
      closeSheet(); draw(); return;
    }

    // the badge beside a lift: the next measure, kept for that lift
    if (t === 'fmcyc') {
      var fx = LIVE && LIVE.x[Number(el.getAttribute('data-x'))];
      if (!fx) return;
      setFm(fx.e, FM[(FM.indexOf(fmFor(fx.e)) + 1) % FM.length]);
      fmRefresh();
      var fb = document.querySelector('#trfm-' + el.getAttribute('data-x') + ' button');
      if (fb) fb.focus();
      return;
    }

    // the bar a lift is on
    if (t === 'barpick') { openSheet({ k: 'bar', e: el.getAttribute('data-e'), eyebrow: 'Bar', title: 'Bar' }); return; }
    if (t === 'barset' || t === 'barother') {
      var be = el.getAttribute('data-e'), bw;
      if (t === 'barother') { bw = numIn(($('trBarW') || {}).value); if (bw === null || bw < 0 || bw > 100) { var bi = $('trBarW'); if (bi) bi.focus(); return; } }
      else bw = v === 'def' ? null : Number(v);
      setBar(be, bw);
      // from the plate calculator it stays open, to see the plates change
      if (S.sheet && S.sheet.k === 'plates') drawSheet(); else closeSheet();
      draw(); return;
    }

    // notes
    if (t === 'note') { S.noteErr = ''; openSheet({ k: 'note', e: el.getAttribute('data-e'), eyebrow: 'Note', title: 'Note' }); return; }
    if (t === 'notesave' || t === 'notedel') {
      var ne = el.getAttribute('data-e'), ta = $('trNoteT'), tu = $('trNoteU');
      var lk = t === 'notesave' ? cleanLink(tu ? tu.value : '') : '';
      if (lk === null) { S.noteErr = 'That link could not be read: it should start with https://'; drawSheet(); return; }
      S.noteErr = '';
      setNote(ne, t === 'notesave' && ta ? ta.value : '', lk);
      closeSheet();
      draw(); return;
    }

    if (t === 'extab' && S.sheet && S.sheet.k === 'ex') { S.sheet.tab = v; drawSheet(); return; }

    // the records
    if (t === 'exsheet') { openSheet({ k: 'ex', e: el.getAttribute('data-e'), eyebrow: 'Lift', title: lib(el.getAttribute('data-e')).n }); return; }
    if (t === 'exhow') { openSheet({ k: 'ex', e: el.getAttribute('data-e'), eyebrow: 'Lift', title: lib(el.getAttribute('data-e')).n, tab: 'about' }); return; }
    if (t === 'wosheet') { openSheet({ k: 'wo', id: el.getAttribute('data-id'), eyebrow: 'Workout', title: 'Workout' }); return; }
    if (t === 'woedit') {
      var we = T.wo[el.getAttribute('data-id')];
      if (!we) return;
      openSheet({ k: 'wo', id: we.id, eyebrow: 'Workout', title: 'Workout' });
      edOpen(we); drawSheet();
      return;
    }
    if (t === 'edopen') {
      var ew = T.wo[el.getAttribute('data-id')];
      if (ew) { edOpen(ew); drawSheet(); }
      return;
    }
    if (S.ed && t === 'edcancel') { S.ed = null; drawSheet(); return; }
    if (S.ed && t === 'edsave') {
      if (edSave()) draw();
      drawSheet(); return;
    }
    if (S.ed && t === 'edsty') {
      var es = S.ed.x[num('data-x')].s[num('data-s')];
      es.ty = { '': 'w', w: 'd', d: 'f', f: 'm', m: '' }[es.ty || ''];
      drawSheet(); return;
    }
    if (S.ed && t === 'edrm') { S.ed.x[num('data-x')].s.splice(num('data-s'), 1); drawSheet(); return; }
    if (S.ed && t === 'edrmx') { S.ed.x.splice(num('data-x'), 1); drawSheet(); return; }
    if (S.ed && t === 'edadd') {
      var ex0 = S.ed.x[num('data-x')], l0 = ex0.s[ex0.s.length - 1];
      ex0.s.push({ w: l0 ? l0.w : '', r: l0 ? l0.r : '', q: '', o: null });
      drawSheet(); return;
    }
    if (S.ed && t === 'edaddx') {
      S.q = ''; S.qm = '';
      openSheet({ k: 'pick', mode: 'eadd', eyebrow: 'Add', title: 'Add to this workout' });
      return;
    }
    if (t === 'delwo') {
      var wid = el.getAttribute('data-id');
      if (S.arm !== 'del:' + wid) { S.arm = 'del:' + wid; drawSheet(); return; }
      dropWo(wid);
      closeSheet();
      draw();
      return;
    }

    // outside the gym
    if (t === 'axnew') {
      var hb = HABITS[v];
      openSheet({ k: 'axnew', h: hb ? v : '', pick: !hb, lv: hb ? hb.lv : 'm', min: hb ? hb.min : 30, ago: 0, nm: '',
        eyebrow: 'Outside the gym', title: hb ? 'Log ' + hb.n : 'Log an activity' });
      return;
    }
    if (t === 'axk' && S.sheet && HABITS[v]) {
      S.sheet.h = v; S.sheet.lv = HABITS[v].lv; S.sheet.min = HABITS[v].min;
      drawSheet(); return;
    }
    if (t === 'axlv' && S.sheet && LV[v]) { S.sheet.lv = v; drawSheet(); return; }
    if (t === 'axmin' && S.sheet) { S.sheet.min = Number(v); drawSheet(); return; }
    if (t === 'axago' && S.sheet) { S.sheet.ago = Number(v); drawSheet(); return; }
    if (t === 'axsave' && S.sheet && HABITS[S.sheet.h]) {
      var sh = S.sheet;
      // noon on the day, so "yesterday" never lands on the wrong side of midnight
      var day = new Date(); day.setDate(day.getDate() - sh.ago); day.setHours(12, 0, 0, 0);
      var at2 = sh.ago ? day.getTime() : Date.now();
      var aid = newId();
      T.ax[aid] = { id: aid, st: at2, k: sh.h, min: sh.min, lv: LV[sh.lv] ? sh.lv : HABITS[sh.h].lv };
      var nm = sh.h === 'other' ? String(sh.nm || '').trim().slice(0, 40) : '';
      if (nm) T.ax[aid].nm = nm;
      if (sh.ez && T.ms[sh.ez.ms]) { T.ax[aid].ms = sh.ez.ms; T.ax[aid].w = sh.ez.w; T.ax[aid].d = sh.ez.d; }
      stamp('ax', aid);
      closeSheet();
      draw(); return;
    }
    if (t === 'eznew') {
      ms = active();
      if (!ms || !isEz(ms, num('data-d'))) return;
      var h0 = T.pr.hab.filter(function (h) { return HABITS[h] && h !== 'other'; })[0] || 'walk';
      openSheet({ k: 'axnew', h: h0, pick: true, lv: HABITS[h0].lv, min: Math.min(HABITS[h0].min, 60), ago: 0, nm: '',
        ez: { ms: ms.id, w: num('data-w'), d: num('data-d') }, eyebrow: 'Easy day', title: 'Log your easy day' });
      return;
    }
    if (t === 'ezlink') {
      ms = active();
      var la = T.ax[el.getAttribute('data-id')];
      if (!ms || !la || !isEz(ms, num('data-d'))) return;
      la.ms = ms.id; la.w = num('data-w'); la.d = num('data-d');
      stamp('ax', la.id);
      if (S.sheet) closeSheet();
      draw(); return;
    }
    if (t === 'axsheet') { openSheet({ k: 'ax', id: el.getAttribute('data-id'), eyebrow: 'Outside the gym', title: 'Activity' }); return; }
    if (t === 'axdel') {
      var xid = el.getAttribute('data-id');
      if (S.arm !== 'axdel:' + xid) { S.arm = 'axdel:' + xid; drawSheet(); return; }
      delete T.ax[xid];
      stamp('ax', xid);
      closeSheet();
      draw(); return;
    }

    // settings
    if (t === 's-unavoid') { T.pr.avoid = T.pr.avoid.filter(function (x) { return x !== v; }); stamp('pr'); drawSheet(); return; }
    if (t === 's-rp') { T.pr.rp = Number(v); stamp('pr'); drawSheet(); return; }
    if (t === 's-u') {
      if (LIVE) return;
      var was = T.pr.u;
      T.pr.u = v;
      if (v !== was) T.pr.bar = v === 'kg' ? 20 : 45;
      stamp('pr'); drawSheet(); draw(); return;
    }
    if (t === 's-bar') { T.pr.bar = Number(v); stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-barown') {
      var bd = numIn(($('trBarDef') || {}).value);
      if (bd === null || bd < 0 || bd > 100) { var bdi = $('trBarDef'); if (bdi) bdi.focus(); return; }
      T.pr.bar = bd; stamp('pr'); drawSheet(); draw(); return;
    }
    if (t === 's-gyon') {
      var gy = T.pr.gy;
      gy.on = Number(v) ? 1 : 0;
      // first time: a common home set to start from, in your unit, to change to yours
      if (gy.on && (!Object.keys(gy.pl).length || gy.u !== T.pr.u)) { gy.pl = Object.assign({}, PL_HOME[T.pr.u]); gy.u = T.pr.u; gy.bar = null; }
      stamp('pr'); drawSheet(); draw(); return;
    }
    if (t === 'gyreset') { T.pr.gy.pl = Object.assign({}, PL_HOME[T.pr.u]); T.pr.gy.u = T.pr.u; T.pr.gy.bar = null; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 'gypl') {
      var pk = String(Number(v)), pn = (T.pr.gy.pl[pk] || 0) + (Number(el.getAttribute('data-d')) > 0 ? 1 : -1);
      if (pn <= 0) delete T.pr.gy.pl[pk]; else T.pr.gy.pl[pk] = Math.min(10, pn);
      stamp('pr'); drawSheet(); draw(); return;
    }
    if (t === 'gybar') {
      var gb = numIn(($('trGyBar') || {}).value);
      if (gb === null || gb < 0 || gb > 100) { var gbi = $('trGyBar'); if (gbi) gbi.focus(); return; }
      T.pr.gy.bar = gb; stamp('pr'); drawSheet(); draw(); return;
    }
    if (t === 'gyat' && LIVE) {
      LIVE.g = v === 'home' ? 'home' : 'gym';
      T.pr.gy.last = LIVE.g; stamp('pr');
      saveLive(); draw(); return;
    }
    if (t === 's-fmo') { T.pr.fmo = Number(v) ? (T.pr.lvl === 0 ? 2 : 1) : 0; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-pl') { T.pr.pl = ['row', 'type', 'off'].indexOf(v) >= 0 ? v : 'row'; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-rc') { T.pr.rc = Number(v); stamp('pr'); drawSheet(); return; }
    if (t === 's-ri') { T.pr.ri = Number(v); stamp('pr'); drawSheet(); return; }
    if (t === 's-snd') {
      T.pr.snd = Number(v); stamp('pr'); drawSheet();
      // chosen, and heard: the tap is what lets the page make a sound
      if (T.pr.snd) { audioPrime(); ring(); }
      return;
    }
    if (t === 's-yay') { T.pr.yay = Number(v) ? 1 : 0; stamp('pr'); drawSheet(); return; }
    if (t === 's-rq') { T.pr.rq = Number(v) ? 1 : 0; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-eff') { T.pr.eff = v === 'rpe' ? 'rpe' : 'rir'; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-nobw') { T.pr.nobw = Number(v) ? 1 : 0; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 's-nph') { T.pr.nph = Number(v) ? 1 : 0; stamp('pr'); drawSheet(); draw(); return; }
    if (t === 'export') { exportCopy(); return; }
    if (t === 'exportcsv') { exportCsv(); return; }
    if (S.sg && t === 'sgu') { S.sg.unit = v === 'kg' ? 'kg' : 'lb'; drawSheet(); return; }
    if (S.sg && t === 'sgr') { S.sg.range = Number(v) || 0; drawSheet(); return; }
    if (S.sg && t === 'sgown') { S.sg.names[num('data-i')].e = ''; drawSheet(); return; }
    if (S.sg && t === 'sgmap') {
      var sn = S.sg.names[num('data-i')];
      S.q = ''; S.qm = sn.e ? lib(sn.e).m : sn.m;
      openSheet({ k: 'pick', mode: 'smap', i: num('data-i'), eyebrow: 'Match', title: 'Match ' + sn.nm });
      return;
    }
    if (t === 'impaste') { S.imErr = ''; openSheet({ k: 'impaste', eyebrow: 'Import', title: 'Paste' }); return; }
    if (t === 'impread') {
      var pt = ($('trPaste') || {}).value || '';
      if (!pt.trim()) { S.imErr = 'Nothing pasted yet.'; drawSheet(); return; }
      S.imErr = '';
      imRead(pt);
      return;
    }
    if (t === 'imord' && S.imap) { S.imap.order = v === 'dmy' ? 'dmy' : 'mdy'; drawSheet(); return; }
    if (t === 'imok' && S.imap) {
      var M = S.imap;
      var G2 = sgParse(M.text, { C: M.C, order: M.order === 'bad' ? '' : M.order, unit: M.unit, app: 'your file' });
      if (G2.err) { M.err = G2.err; drawSheet(); return; }
      // the same headings next time are matched the same way
      var mem = readLS(LS_IMAP) || {};
      mem[M.sig] = { C: M.C, unit: M.unit || '' };
      var keys = Object.keys(mem);
      if (keys.length > 20) delete mem[keys[0]];
      writeLS(LS_IMAP, mem);
      G2.range = sgFit(G2);
      S.imap = null;
      S.sg = G2;
      openSheet({ k: 'strong', eyebrow: 'Import', title: 'From your file' });
      return;
    }
    if (S.sg && t === 'sggo') {
      var from = S.sg.app || 'your file';
      var got = sgGo();
      closeSheet();
      S.sgDone = got;
      S.sgFrom = from;
      setSub('history');
      scrollTop();
      return;
    }
    if (t === 'impgo') { applyImport(); return; }
  }

  /* The app open twice on one phone — two tabs, or the home-screen app and
     a tab — each wrote its whole log over the other's: a workout saved in
     one was gone the moment the other saved anything, even a rest time.
     Each now hears the other's saves and takes them in the way it takes the
     account's, newest wins key by key, so what it writes next holds both.
     The workout in progress follows too: started in one, it is the one in
     progress in the other. */
  function fromStore(t, ts) {
    var tr = {};
    if (!plain(t) || !plain(ts)) return null;
    if (plain(t.pr)) tr.pr = { v: t.pr, at: fin(ts.pr) ? ts.pr : 0, k: plain(ts.prk) ? ts.prk : undefined };
    if (typeof t.act === 'string') tr.act = { v: t.act, at: fin(ts.act) ? ts.act : 0 };
    PARTS.forEach(function (p) {
      var m = {}, tp = plain(t[p]) ? t[p] : {}, sp = plain(ts[p]) ? ts[p] : {};
      Object.keys(tp).concat(Object.keys(sp)).forEach(function (k) {
        if (fin(sp[k])) m[k] = { v: tp[k] || null, at: sp[k] };
        if (m[k] && p === 'ms' && tp[k] && plain(ts.msk) && plain(ts.msk[k])) m[k].k = ts.msk[k];
      });
      tr[p] = m;
    });
    return tr;
  }
  function otherTab(e) {
    if (!e || (e.storageArea && e.storageArea !== window.localStorage)) return;
    if (e.key === LS_TS) {
      var tr = fromStore(readLS(LS_T), readLS(LS_TS));
      if (tr && merge(tr, false)) drawIfShowing();
      return;
    }
    if (e.key === LS_LIVE) {
      var nl = null, ol = null;
      try { nl = e.newValue ? JSON.parse(e.newValue) : null; ol = e.oldValue ? JSON.parse(e.oldValue) : null; } catch (x) { return; }
      if (nl && (!LIVE || LIVE.id === nl.id)) LIVE = nl;
      else if (!nl && LIVE && ol && ol.id === LIVE.id) { LIVE = null; stopWake(); }
      else return;
      REV++;
      drawIfShowing();
    }
  }

  /* ------------------------------------------------------------------ wiring */
  function wire() {
    var say = document.createElement('div');
    say.id = 'trSay'; say.className = 'sr-only'; say.setAttribute('role', 'status');
    document.body.appendChild(say);
    var chartDown = null;
    document.addEventListener('pointerdown', function (e) {
      var svg = e.target && e.target.closest && e.target.closest('svg.tr-chart[data-pts]');
      chartDown = svg || null;
      if (svg) chartRead(svg, e.clientX);
    });
    document.addEventListener('pointermove', function (e) { if (chartDown) chartRead(chartDown, e.clientX); });
    document.addEventListener('pointerup', function () { chartDown = null; });
    document.addEventListener('pointercancel', function () { chartDown = null; });
    // a lift's handle: hold and drag it to where it goes
    document.addEventListener('pointerdown', function (e) {
      var grip = e.target && e.target.closest && e.target.closest('#view-train .tr-grip');
      if (!grip || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      dragStart(grip, e);
    });
    document.addEventListener('pointermove', dragMove, { passive: false });
    /* The handle lets a finger scroll (pan-y), so once the hold is up the
       page has to be told not to: the finger is carrying a lift now. */
    var trView = $('view-train');
    if (trView) trView.addEventListener('touchmove', function (e) { if (DRAG && DRAG.on) e.preventDefault(); }, { passive: false });
    document.addEventListener('pointerup', function (e) { dragEnd(e, false); });
    document.addEventListener('pointercancel', function (e) { dragEnd(e, true); });
    /* A drag that never hears its pointerup, because the app went to the
       background or the capture was taken, would hold draw() off for good:
       each of these ends it where it started. */
    document.addEventListener('lostpointercapture', function (e) { dragEnd(e, true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) dragEnd(null, true); });
    window.addEventListener('blur', function () { dragEnd(null, true); });
    window.addEventListener('storage', otherTab);
    /* The chime at the end of a rest needs a sound woken by a tap, and the
       tap was only ever the tick. Reopened mid-rest (killed, or reloaded for
       an update), nothing had woken it, and the rest ran out in silence.
       Any touch at all during a workout wakes it now: a scroll, a box. */
    document.addEventListener('pointerdown', function () {
      if (LIVE && (!AC || AC.state === 'suspended')) audioPrime();
    }, true);
    // the click a lifted finger makes after a hold-to-drag: see GHOST
    document.addEventListener('click', function (e) {
      if (GHOST && Date.now() - GHOST < 500) { GHOST = 0; e.stopPropagation(); e.preventDefault(); }
    }, true);
    /* A redraw that waited for a finger to leave a box (drawIfShowing): once
       it has, and the tap that took it out has landed. */
    document.addEventListener('focusout', function (e) {
      if (!S.drawDue || !e.target.closest || !(e.target.closest('#view-train') || e.target.closest('#trainRoot'))) return;
      setTimeout(function () { if (S.drawDue && !typing()) { S.drawDue = 0; draw(); } }, 300);
    });
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-t]');
      if (!el) return;
      if (!el.closest('#view-train') && !el.closest('#trainRoot')) return;
      // the scrim closes only when it is the scrim itself that was pressed
      if (el.classList.contains('scrim') && e.target !== el) return;
      e.preventDefault();
      act(el);
    });
    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!el || !el.getAttribute) return;
      if (el.id === 'trPickQ') { S.q = el.value; redrawPicks(); return; }
      if (el.id === 'trLiftQ') { S.lq = el.value; redrawLifts(); return; }
      if (el.id === 'trPlateW' && S.sheet && S.sheet.k === 'plates') {
        S.sheet.w = el.value;
        var pos = el.selectionStart;
        drawSheet();
        var n = $('trPlateW');
        if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e2) { /* number inputs */ } }
        return;
      }
      if (el.id === 'trOwnN' && S.own) { S.own.n = el.value; return; }
      if (el.id === 'trWoNt' && LIVE) { LIVE.nt = el.value.slice(0, 1000); saveLive(); return; }
      if (el.id === 'trEdNt' && S.ed) { S.ed.nt = el.value.slice(0, 1000); return; }
      if (el.id === 'trEdT0' && S.ed) { S.ed.t0 = el.value; return; }
      if (el.id === 'trEdT1' && S.ed) { S.ed.t1 = el.value; return; }
      var edf = el.getAttribute('data-ed');
      if (edf && S.ed) {
        var ex1 = S.ed.x[Number(el.getAttribute('data-x'))];
        var st1 = ex1 && ex1.s[Number(el.getAttribute('data-s'))];
        if (st1) st1[edf] = el.value.replace(/[^0-9.,]/g, '').slice(0, 7);
        return;
      }
      if (el.id === 'trAxNm' && S.sheet && S.sheet.k === 'axnew') { S.sheet.nm = el.value; return; }
      if (el.id === 'trDraftName' && S.draft) {
        if (!S.draft.n0) S.draft.n0 = S.draft.n;
        S.draft.n = el.value.slice(0, 60); S.draft.named = 1;
        return;
      }
      if (el.id === 'trBlkNote' && S.hb && T.ms[S.hb]) {
        var nid = S.hb;
        T.ms[nid].note = el.value.slice(0, 2000);
        clearTimeout(noteT);
        // saved once the typing pauses, not on every key
        noteT = setTimeout(function () { if (T.ms[nid]) editBlock(T.ms[nid]); }, 600);
        return;
      }
      var mcf = el.getAttribute('data-mc');
      if (mcf && LIVE && LIVE.mc) {
        LIVE.mc[mcf] = el.value.replace(/[^0-9:.]/g, '').slice(0, 6);
        saveLive();
        return;
      }
      var tmE = el.getAttribute('data-tm');
      if (tmE && S.draft) {
        var tv = numIn(el.value);
        S.draft.tm = S.draft.tm || {};
        if (tv !== null && tv > 0 && tv < 2000) S.draft.tm[tmE] = tv; else delete S.draft.tm[tmE];
        S.draft.tu = T.pr.u;
        return;
      }
      var f = el.getAttribute('data-in');
      if (!f || !LIVE) return;
      var x = LIVE.x[Number(el.getAttribute('data-x'))];
      var s = x && x.s[Number(el.getAttribute('data-s'))];
      if (!s) return;
      s[f] = el.value.replace(/[^0-9.,]/g, '').slice(0, 7);
      saveLive();
      if (S.need && S.need.k === el.getAttribute('data-x') + ':' + el.getAttribute('data-s')) {
        S.need = null;
        var nd = $('trneed');
        if (nd) nd.parentNode.removeChild(nd);
      }
      // a weight moves the plates and the reps it is worth; reps move the next set's, and the note
      if (f === 'w' || f === 'r' || f === 'q') plRefresh(Number(el.getAttribute('data-x')));
      // a set already done and corrected moves the badge beside its lift
      if (s.t) fmRefresh();
    });
    /* While typing: the plates in the row of the set whose weight has the
       cursor, and of the next set to do, which is up anyway. */
    document.addEventListener('focusin', function (e) {
      var el = e.target;
      if (!el || !el.getAttribute || el.getAttribute('data-in') !== 'w') return;
      var xi = Number(el.getAttribute('data-x')), si = Number(el.getAttribute('data-s'));
      var c = $('trpl-' + xi + '-' + si);
      if (!c || !LIVE || !LIVE.x[xi] || plShown(c)) return;
      c.classList.add('on');
      c.innerHTML = plCell(xi, si);
    });
    document.addEventListener('focusout', function (e) {
      var el = e.target;
      if (!el || !el.getAttribute || el.getAttribute('data-in') !== 'w') return;
      var xi = Number(el.getAttribute('data-x')), si = Number(el.getAttribute('data-s'));
      var c = $('trpl-' + xi + '-' + si);
      /* Not at once: the tap that took the cursor away lands first, then
         the cell goes back to last time. */
      if (c && c.classList.contains('tr-plt') && !c.getAttribute('data-next')) {
        setTimeout(function () {
          if (document.activeElement === el || !c.isConnected || !LIVE || !LIVE.x[xi] || !LIVE.x[xi].s[si]) return;
          c.classList.remove('on');
          c.innerHTML = prevText(LIVE.x[xi].s[si], LIVE.x[xi].e);
        }, 350);
      }
    });
    document.addEventListener('change', function (e) {
      var el = e.target;
      if (el && el.id === 'trImport' && el.files && el.files[0]) readImport(el.files[0]);
      if (el && (el.id === 'trStrong' || el.id === 'trStrong2') && el.files && el.files[0]) { readStrong(el.files[0]); el.value = ''; }
      var imc = el && el.getAttribute && el.getAttribute('data-imc');
      if (imc && S.imap) {
        var ci = Number(el.value);
        // one column does one job: taking it for this clears it from another
        Object.keys(S.imap.C).forEach(function (k) { if (k !== imc && S.imap.C[k] === ci && ci >= 0) S.imap.C[k] = -1; });
        S.imap.C[imc] = ci;
        if (imc === 'w' && ci >= 0 && !S.imap.unit) S.imap.unit = imHeadUnit(S.imap.head[ci].toLowerCase());
        S.imMore = !!($('trImMore') && $('trImMore').open);
        if (imc === 'date' && ci >= 0) S.imap.order = imOrder(csvRows(S.imap.text).slice(1, 400).map(function (r) { return r[ci]; }));
        drawSheet();
        return;
      }
      var sgm = el && el.getAttribute && el.getAttribute('data-sgm');
      if (sgm !== null && sgm !== undefined && S.sg && S.sg.names && S.sg.names[Number(sgm)] && MUS[el.value]) {
        S.sg.names[Number(sgm)].m = el.value;
      }
      if (el && S.own && (el.id === 'trOwnM' || el.id === 'trOwnQ' || el.id === 'trOwnK')) {
        S.own[{ trOwnM: 'm', trOwnQ: 'q', trOwnK: 'k' }[el.id]] = el.value;
      }
    });
    /* Enter in a reps box ticks the set, which is the next thing a hand does
       anyway. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
      var el = e.target;
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && el && el.classList && el.classList.contains('tr-grip')) {
        e.preventDefault();
        gripKey(el, e.key);
        return;
      }
      if (e.key === 'Enter' && el && el.id === 'trBwq') { e.preventDefault(); bwSave(false); return; }
      if (e.key === 'Enter' && el && el.id === 'trBlkName') { e.preventDefault(); blockRename(S.hbRen); return; }
      if (e.key === 'Escape' && el && el.id === 'trBlkName') { S.hbRen = ''; draw(); return; }
      if (e.key === 'Enter' && el && el.getAttribute && el.getAttribute('data-in') === 'r' && LIVE) {
        e.preventDefault();
        el.blur();
        tick(Number(el.getAttribute('data-x')), Number(el.getAttribute('data-s')));
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      if (newDay()) { wake(); render(); return; }
      wake(); drawRest();
    });
  }

  /* The picker's list alone, so typing into its search box keeps the box. */
  function redrawPicks() {
    var root = $('trainRoot');
    if (!root || !S.sheet || S.sheet.k !== 'pick') return;
    var tmp = document.createElement('div');
    tmp.innerHTML = pickHTML(S.sheet);
    var fresh = tmp.querySelector('.tr-picks:not(.tr-best)'), old = root.querySelector('.tr-picks:not(.tr-best)');
    if (fresh && old) old.replaceWith(fresh);
    // the best swaps are for the list as it opens: gone while you search, back when the box is cleared
    var fb = tmp.querySelector('.tr-bestw'), ob = root.querySelector('.tr-bestw'), inp = $('trPickQ');
    if (ob && fb) ob.replaceWith(fb);
    else if (ob) ob.remove();
    else if (fb && inp && inp.parentNode) inp.parentNode.insertBefore(fb, inp);
  }

  wire();

  window.Train = {
    render: render,
    // the weekly check-in, for Nourish's morning card
    openCheckin: openCheckin,
    dayText: dayText,
    /* The workouts saved on a day, by name — Nourish ticks "Trained today"
       off this, so a session logged here moves the day's carbohydrate there. */
    trainedOn: function (k) {
      return ix().list.filter(function (wo) { return (wo.dk || dayKey(new Date(wo.st))) === k; })
        .map(function (wo) { return wo.n || 'Workout'; });
    },
    /* The same, with what Nourish's row says about a finished one. */
    sessionsOn: function (k) {
      return ix().list.filter(function (wo) { return (wo.dk || dayKey(new Date(wo.st))) === k; })
        .map(function (wo) { return { n: wo.n || 'Workout', st: wo.st, en: wo.en || 0, sets: setsOf(wo) }; });
    },
    /* Your lifting weekdays while a block is running and you have picked
       them; null otherwise, and Nourish keeps its own. */
    liftDays: function () { return T.pr.ld.length ? T.pr.ld.slice() : null; },
    /* What weights are said in here, 'kg' or 'lb' — so Nourish's weigh-in box
       asks in the same unit rather than taking 86 kg as 86 lb. Read only. */
    unit: function () { return T.pr.u === 'kg' ? 'kg' : 'lb'; },
    /* The day of the first workout on record, '' with none. */
    firstLogged: function () {
      var l = ix().list;
      return l.length ? (l[0].dk || dayKey(new Date(l[0].st))) : '';
    },
    /* Nourish's picker writes the same list; one store, two doors. */
    setLiftDays: function (days) { setLd(days, true); },
    /* Mid-way through something only this screen holds: a block being built,
       the questions, a saved workout being corrected. index.html holds an
       update's reload until it is not. */
    busy: function () { return !!(S.draft || S.qz || S.ed || S.sheet); },
    /* How many lifting sessions the running block has; 0 without one. While
       there is one, its days are changed here, where the count is enforced. */
    blockSessions: function () { var ms = active(); return ms ? liftCols(ms).length : 0; },
    /* Nourish's "Change days": open the picker on the block card. */
    /* Onto the Block screen whatever Strengthen was last left on — from
       History or Lifts the picker was drawn on a screen nobody was shown —
       and with a workout running, minimised so the picker is what you see. */
    openDays: function () {
      S.ldOpen = true; S.ldDraft = ldDays().slice(); S.browse = false;
      S.sub = 'block'; if (LIVE) S.minim = 1;
      try { localStorage.setItem(LS_SUB, 'block'); } catch (e) { /* private mode */ }
    },
    /* What the Today screen shows of Strengthen (src/today.js): the block's
       next session, said in a few numbers, or that there is no block, or a
       workout already going. Read only; Start comes back through startToday,
       which is the Start on the block's own card. */
    today: function () {
      var ms = active(), out = { live: !!LIVE, block: ms ? ms.n || 'Your block' : '' };
      var tk = dayKey(new Date());
      var did = ix().list.filter(function (wo) { return (wo.dk || dayKey(new Date(wo.st))) === tk; });
      if (did.length) {
        var last = did[did.length - 1];
        out.doneToday = true; out.doneName = last.n || '';
        // how long it took, and the records it set: what Finish says of it
        out.doneMins = last.en > last.st ? Math.round((last.en - last.st) / 60000) : 0;
        try { out.doneRecs = wins(last).lines.filter(function (l) { return l.big; }).length; } catch (e) { out.doneRecs = 0; }
      }
      if (!ms) return out;
      var nx = nextSlot(ms);
      if (!nx) { out.finished = true; return out; }
      out.week = wkName(ms, nx.w);
      if (isEz(ms, nx.d)) { out.easy = true; return out; }
      /* A rest day, as the block card says: Today offered Start on it, as
         if the session were due. The days are the lifting days picked. */
      var due = dueIn(ms, nx);
      if (due > 0) { out.due = due; out.dueSay = dueSay(due); out.rest = restToday(); }
      var p = plan(ms, nx.w, nx.d), day = ms.days[nx.d];
      out.name = p.n || dayName(day);
      out.mins = day && day.s && day.s.length ? Math.round(estDay(day.cc ? day : { s: day.s }) / 5) * 5 : 0;
      out.lifts = (p.x || []).map(function (x) {
        var sets = typeof x.sets === 'number' ? x.sets : Array.isArray(x.sets) ? x.sets.length : 0;
        var reps = x.tr || (x.rr ? x.rr[0] + '\u2013' + x.rr[1] : '');
        return { name: lib(x.e).n, say: (sets ? sets + ' \u00d7 ' : '') + reps + (x.tw > 0 ? ' \u00b7 ' + fmtN(x.tw) + ' ' + T.pr.u : '') };
      });
      return out;
    },
    /* A rest day's one tap, from Today: an activity logged as the strip's
       sheet logs one, today, at the kind's own minutes and how hard it
       usually is. Returns its id. */
    logActivity: function (k, min) {
      if (!HABITS[k] || k === 'other') return null;
      var id = newId();
      T.ax[id] = { id: id, st: Date.now(), k: k, min: Number(min) > 0 ? Number(min) : HABITS[k].min, lv: HABITS[k].lv };
      stamp('ax', id);
      draw();
      return id;
    },
    // the strip's own sheets, for "Change it" and "Something else"
    editActivity: function (id) { if (T.ax[id]) openSheet({ k: 'ax', id: id, eyebrow: 'Outside the gym', title: 'Activity' }); },
    newActivity: function () {
      openSheet({ k: 'axnew', h: '', pick: true, lv: 'm', min: 30, ago: 0, nm: '', eyebrow: 'Outside the gym', title: 'Log an activity' });
    },
    startToday: function () {
      var ms = active(), nx = ms && nextSlot(ms);
      if (!ms || !nx || LIVE || isEz(ms, nx.d)) return false;
      startPlanned(ms, nx.w, nx.d);
      return true;
    },
    /* The name of the block's next session, for "Upper B today". */
    nextName: function () {
      var ms = active(), nx = ms && nextSlot(ms);
      if (!nx || isEz(ms, nx.d)) return '';
      return dayName(ms.days[nx.d]) || '';
    },
    attach: attach,
    remote: remote,
    forget: forget,
    // the corrected clock, from Nourish: see tnow
    clock: function (fn) { CLOCK = typeof fn === 'function' ? fn : null; },
    sheetClosed: sheetClosed,
    /* For the tests, and for anyone reading the numbers off a console: the
       pure parts, which take data and give data. */
    _: {
      soreAsk: soreAsk, srNow: srNow, fbAll: fbAll, repsMoved: repsMoved, uniq: uniq, draw: draw, dayName: dayName, dueIn: dueIn, focusOn: focusOn,
      niceTicks: niceTicks, trend4: trend4, planList: planList, setFix: setFix,
      build: build, plan: plan, setsFor: setsFor, feedback: feedback, target: target,
      e1rm: e1rm, plateMath: plateMath, review: review, merge: merge, payload: payload,
      rirFor: rirFor, nextSlot: nextSlot, prsIn: prsIn, lib: lib, SPLITS: SPLITS, MUS: MUS,
      estDay: estDay, barred: barred, KEEP_SPLITS: KEEP_SPLITS, HABITS: HABITS, weeksOf: weeksOf, nextTm: nextTm,
      recommend: recommend, PROGS: PROGS, FOCUS: FOCUS, KITS: KITS, axWeek: axWeek, defaultsPr: defaultsPr,
      MOVES: MOVES, mcScore: mcScore, sgParse: sgParse, sgMatch: sgMatch, sgGuess: sgGuess, sgList: sgList, csvRows: csvRows, ntKey: ntKey,
      LIB_LIST: LIB_LIST, slotDone: slotDone, barFor: barFor, barLabel: barLabel, onBar: onBar, liftE1: liftE1, stackHTML: stackHTML, elapsed: elapsed,
      woText: woText, dtVal: dtVal, dtParse: dtParse, hmSpan: hmSpan, HOWTO: HOWTO, repMaxes: repMaxes, cleanLink: cleanLink,
      wins: wins, nth: nth, ringRest: ringRest, ringStop: ringStop, ringing: function () { return !!RAGAIN; }, focusOf: focusOf, fmFor: fmFor, bwOn: bwOn, bwInfo: bwInfo, e1Of: e1Of, records: records,
      weeksSay: weeksSay, kitSay: kitSay, doneNext: doneNext, warmRows: warmRows, volOf: volOf, ghost: ghost,
      readyDay: readyDay, readyNext: readyNext, saveRoutine: saveRoutine, SHAPE: SHAPE, swapBest: swapBest,
      whyW: whyW, firstTime: firstTime, restNote: restNote, newLift: newLift,
      checkin: checkin, chkReads: chkReads, dueSay: dueSay, phaseNow: phaseNow, phaseAt: phaseAt, capAt: capAt, phaseCap: phaseCap, phaseLine: phaseLine, phaseReset: function () { phLive.t = 0; },
      dropWo: dropWo, fitSay: fitSay, yearOf: yearOf, woCsv: woCsv, imDate: imDate, snapHome: snapHome, homeLoads: homeLoads, plateHave: plateHave, counts: counts, tick: tick, yr: function () { return YR; }, lsFull: function () { return LSFULL; },
      state: function () { return { T: T, TS: TS, LIVE: LIVE, S: S }; },
      reload: function () { T = loadT(); TS = loadTS(); PRSEEN = prSeen(); MSSEEN = msSeenAll(); LIVE = readLS(LS_LIVE); REV++; phLive.t = 0; }
    }
  };
})();
