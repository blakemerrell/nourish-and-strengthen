/* The shelves a food sits on, in the order a cut cares about (MSHELF):
 * which macro a food is, by where its calories come from, and which shelf
 * it goes on (mShelfKey). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.shelves(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).shelves = function (app) {
  'use strict';

  /* One box, one list. Your own foods and the book's recipes together, each
     saying where it came from, because "do I already have this?" and "what
     does the USDA call it?" are the same question asked once. The food
     tables answer underneath, when they answer. */
  /* Which macro a food IS, by where its calories come from — not by grams.
     A cup of milk carries more grams of carbohydrate than fat and is not a
     carbohydrate. Unlike the lever bench this classes EVERYTHING, purity
     floor or not: a food has to land in one of the three groups or it is
     missing from a list whose whole job is to be browsable. */
  function mFoodDom(r) {
    var m = r && r.macro;
    if (!m) return null;
    var kp = (m.p || 0) * 4, kf = (m.f || 0) * 9, kc = (m.c || 0) * 4;
    if (!(kp + kf + kc > 0)) return null;
    return { d: kp >= kf && kp >= kc ? 'p' : (kf >= kc ? 'f' : 'c'),
      pur: Math.max(kp, kf, kc) / (kp + kf + kc) };
  }

  /* The shelves a food can sit on, in the order a cut cares about.
   *
     Not the same question as "which macro is this mostly", which is what
     mFoodDom answers. A shelf is where you would REACH for a thing: fruit
     and starch are both carbohydrate and you go looking for them in
     different moods, and 🥦 Veggies only means anything if it means the
     things you can eat a lot of — which is why potatoes and corn are
     shelved with the cereal.

     The first four flags win where a food has one; everything else falls
     through to whichever macro carries its calories. */
  var MSHELF = [
    ['protein', '\uD83E\uDD69', 'Protein'],
    ['fat',     '\uD83E\uDD51', 'Fats'],
    ['carb',    '\uD83C\uDF5A', 'Carbs'],
    ['veg',     '\uD83E\uDD66', 'Veggies'],
    ['fruit',   '\uD83C\uDF4E', 'Fruit'],
    ['starch',  '\uD83E\uDD56', 'Starch'],
    ['dairy',   '\uD83E\uDDC0', 'Dairy'],
    ['oil',     '\uD83E\uDED2', 'Oils'],
  ];

  var MDAIRY = ['milk', 'cheddar', 'parmesan', 'cottage_cheese', 'cream_cheese',
    'sour_cream', 'yogurt', 'egg'];
  var MOILY = ['oil', 'butter', 'mayo', 'ranch', 'peanut_butter'];
  var MFRUIT = ['apple', 'banana', 'orange', 'grape', 'peaches_canned',
    'pears_canned', 'applesauce', 'fruit', 'raisin'];

  /* Which shelf a thing sits on.
   *
     RECIPES TOO, not just single foods. It used to return '' for anything
     without a food flag, which was every one of the 316 — so a rail built on
     it would have hidden the entire book behind any chip. A dish is shelved
     by the macro its calories come from, which is the same question
     mFoodDom answers and the only one that can be asked of a plate: there is
     no sense in which a chicken casserole is "on the vegetable shelf".
   *
     Foods get the finer answer, because a cook reaches for them differently:
     fruit and starch are both carbohydrate and you go looking for them in
     different moods.
   *
     `shelf` on the food beats the prefix lists below it. Those lists match
     the START of a key, which worked while the table was the storehouse
     order and broke the moment it grew: thirteen new fruits landed under
     Carbs because no entry began with "apple" or "grape". The lists stay for
     the storehouse keys they were written for; anything new says what it is
     instead of hoping its name starts with the right word. */
  function mShelfKey(r) {
    if (!r) return '';
    var d = mFoodDom(r);
    var byMacro = d ? ({ p: 'protein', f: 'fat', c: 'carb' })[d.d] : '';
    if (!r.food) return byMacro;
    if (r.shelf) return r.shelf;
    var k = String(r.id).indexOf('f:') === 0 ? String(r.id).slice(2) : String(r.id);
    var starts = function (list) {
      var hit = false;
      list.forEach(function (v) { if (k === v || k.indexOf(v) === 0) hit = true; });
      return hit;
    };
    if (r.veg) return 'veg';
    if (r.starch) return 'starch';
    if (starts(MFRUIT)) return 'fruit';
    if (starts(MOILY)) return 'oil';
    if (starts(MDAIRY)) return 'dairy';
    return byMacro;
  }

  /* Every food you can eat as it comes, under the macro it is for.
   *
     Look up opened on a blank screen: a search box, and nothing until you
     already knew the word. The thing you want at seven in the morning is not
     a word, it is "show me the protein" — so that is what is under the box
     now, in the order a cut cares about. Protein first because it is the one
     to hit; fats last because they are what closes a plate rather than
     starts one.

     Grouped headings rather than tabs or a filter, because both of those are
     a tap to see a list that could simply have been there, and neither fills
     the empty screen that was the actual complaint.

     Ordered inside each group the way the combo's rungs are: something you
     would eat before something that goes ON food, then by how cleanly it
     carries its macro. Same rule in both places on purpose. */

  return { mShelfKey: mShelfKey, MSHELF: MSHELF };
};
