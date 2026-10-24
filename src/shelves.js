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

  /* Restaurant orders for Price and Spanish Fork, UT, and the parts they are
     built from. A combo's macros are summed from its parts in mBuildFoods, so
     the order's row and Explode into foods never disagree by even a calorie.

     The first version of this list had 93 orders, but only about a quarter of
     them fitted a cut, and several overstated the protein: thigh meat was
     modelled as breast (one Mo' Bettahs plate claimed 78 g), and a Taco Bell
     bowl with extra chicken showed 68 g against the chain's own 25 g for the
     bowl. It also listed places that are not there (KFC, Los Jilbertos) or
     dishes no longer sold (KFC grilled, the Power Bowl). This list is built
     from what each chain publishes, per part, rounded; a part with est: false
     is that published figure, and every other part, and so every order that
     uses one, is an estimate and says so. The spot names the town, and
     "(confirm)" marks a Spanish Fork place we could not verify is open. */
  var MEATOUT_PARTS = {
    ro_hb_egg2: { name: '2 Hard-Boiled Eggs', unit: 'serving', grams: 100, p: 12, c: 1, f: 10, na: 125, fib: 0, est: false },
    ro_fl_core42: { name: 'Fairlife Core Power Elite 42 g Shake', unit: 'bottle', grams: 414, p: 42, c: 8, f: 3.5, na: 260, fib: 1, est: false },
    ro_fl_np30: { name: 'Fairlife Nutrition Plan 30 g Shake', unit: 'bottle', grams: 340, p: 30, c: 4, f: 2.5, na: 230, fib: 0, est: false },
    ro_greek_yog: { name: 'Plain Nonfat Greek Yogurt Cup', unit: 'cup', grams: 150, p: 15, c: 6, f: 0, na: 60, fib: 0, est: false },
    ro_beef_jerky2: { name: 'Beef Jerky, 2 oz', unit: 'bag', grams: 57, p: 20, c: 6, f: 2, na: 900, fib: 0 },
    ro_string_cheese2: { name: '2 Mozzarella String Cheese Sticks', unit: 'serving', grams: 56, p: 14, c: 2, f: 12, na: 400, fib: 0, est: false },
    ro_apple: { name: 'Apple', unit: 'whole', grams: 180, p: 0.5, c: 25, f: 0.3, na: 2, fib: 4, est: false },
    ro_fruit_cup: { name: 'Fruit Cup', unit: 'cup', grams: 125, p: 1, c: 15, f: 0, na: 0, fib: 2 },
    ro_side_salad: { name: 'Side Salad, light dressing', unit: 'bowl', grams: 140, p: 2, c: 8, f: 6, na: 220, fib: 2 },
    ro_steamed_veg: { name: 'Steamed Vegetables', unit: 'cup', grams: 150, p: 3, c: 10, f: 1, na: 120, fib: 4 },
    ro_lettuce_wrap: { name: 'Lettuce Wrap, Tomato, Pickles & Onion', unit: 'serving', grams: 90, p: 1, c: 5, f: 0, na: 150, fib: 1.5 },
    ro_wm_rot_breast: { name: 'Rotisserie Chicken Breast, skin off (6 oz)', unit: 'portion', grams: 170, p: 52, c: 0, f: 7, na: 780, fib: 0 },
    ro_wm_rot_leg: { name: 'Rotisserie Chicken Leg Quarter, skin on', unit: 'piece', grams: 150, p: 36, c: 0, f: 20, na: 700, fib: 0 },
    ro_wm_veg_cup: { name: 'Marketside Veggie Cup (carrots, celery, snap peas)', unit: 'cup', grams: 120, p: 2, c: 9, f: 0.5, na: 60, fib: 3 },
    ro_wm_salad_kit: { name: 'Marketside Salad Kit, half the dressing', unit: 'bowl', grams: 150, p: 3, c: 10, f: 9, na: 260, fib: 3 },
    ro_sw_chicken: { name: 'Subway Grilled Chicken, 6-inch portion', unit: 'portion', grams: 71, p: 16, c: 1, f: 2, na: 330, fib: 0 },
    ro_sw_turkey: { name: 'Subway Oven-Roasted Turkey, 6-inch portion', unit: 'portion', grams: 57, p: 10, c: 2, f: 1, na: 500, fib: 0 },
    ro_sw_ham: { name: 'Subway Black Forest Ham, 6-inch portion', unit: 'portion', grams: 57, p: 9, c: 2, f: 1.5, na: 520, fib: 0 },
    ro_sw_steak: { name: 'Subway Steak, 6-inch portion', unit: 'portion', grams: 71, p: 14, c: 3, f: 4, na: 480, fib: 0 },
    ro_sw_provolone: { name: 'Provolone, 2 triangles', unit: 'serving', grams: 14, p: 4, c: 0, f: 4, na: 125, fib: 0, est: false },
    ro_sw_veg: { name: 'All the Veggies, Red Wine Vinegar', unit: 'serving', grams: 120, p: 1, c: 6, f: 0, na: 30, fib: 2 },
    ro_sw_bread6: { name: '6-inch Hearty Multigrain Bread', unit: 'piece', grams: 71, p: 8, c: 34, f: 2.5, na: 320, fib: 4 },
    ro_mv_bonfire_taco: { name: 'BonFire Chicken Street Taco', unit: 'taco', grams: 90, p: 11, c: 13, f: 5, na: 380, fib: 0 },
    ro_mc_egg_mcm: { name: 'Egg McMuffin', unit: 'piece', grams: 136, p: 17, c: 30, f: 13, na: 770, fib: 2, est: false },
    ro_mc_qp_patty: { name: 'Quarter Pounder Patty (cooked)', unit: 'patty', grams: 85, p: 20, c: 0, f: 16, na: 220, fib: 0 },
    ro_mc_reg_patty: { name: 'Regular Hamburger Patty', unit: 'patty', grams: 40, p: 8, c: 0, f: 7, na: 160, fib: 0 },
    ro_mc_round_egg: { name: 'Extra Round Egg', unit: 'egg', grams: 50, p: 6, c: 1, f: 5, na: 70, fib: 0, est: false },
    ro_wd_chili_lg: { name: 'Large Chili', unit: 'bowl', grams: 340, p: 25, c: 33, f: 13, na: 1270, fib: 7 },
    ro_wd_chili_sm: { name: 'Small Chili', unit: 'cup', grams: 227, p: 17, c: 22, f: 9, na: 850, fib: 5 },
    ro_wd_caesar_chk: { name: 'Parmesan Caesar Salad, half dressing, no croutons', unit: 'bowl', grams: 300, p: 38, c: 7, f: 17, na: 1000, fib: 3 },
    ro_wd_cobb_chk: { name: 'Cobb Salad, half dressing', unit: 'bowl', grams: 320, p: 36, c: 9, f: 22, na: 1150, fib: 3 },
    ro_wd_patty: { name: 'Single Beef Patty (1/4 lb)', unit: 'patty', grams: 90, p: 21, c: 0, f: 16, na: 270, fib: 0 },
    ro_ab_roast_beef: { name: 'Arby\u2019s Roast Beef, 3 oz', unit: 'portion', grams: 85, p: 18, c: 1, f: 7, na: 480, fib: 0 },
    ro_ab_bun: { name: 'Arby\u2019s Sesame Bun', unit: 'piece', grams: 70, p: 6, c: 33, f: 4, na: 400, fib: 1 },
    ro_kfc_nug12: { name: 'KFC Secret Recipe Nuggets, 12 pc', unit: 'order', grams: 192, p: 42, c: 15, f: 18, na: 1470, fib: 1, est: false },
    ro_kfc_nug8: { name: 'KFC Secret Recipe Nuggets, 8 pc', unit: 'order', grams: 128, p: 28, c: 10, f: 12, na: 980, fib: 1, est: false },
    ro_kfc_or_peeled: { name: 'Original Recipe Chicken Breast, skin & breading peeled off', unit: 'piece', grams: 135, p: 35, c: 2, f: 6, na: 680, fib: 0 },
    ro_kfc_grn_beans: { name: 'KFC Green Beans (individual)', unit: 'cup', grams: 99, p: 1, c: 4, f: 0, na: 290, fib: 2, est: false },
    ro_tb_cantina_chk: { name: 'Cantina Chicken, extra scoop', unit: 'portion', grams: 70, p: 12, c: 1, f: 4, na: 400, fib: 0 },
    ro_tb_bowl_norice: { name: 'Cantina Chicken Bowl, no rice', unit: 'bowl', grams: 330, p: 22, c: 22, f: 20, na: 1100, fib: 7 },
    ro_tb_bowl: { name: 'Cantina Chicken Bowl', unit: 'bowl', grams: 420, p: 25, c: 54, f: 23, na: 1300, fib: 8, est: false },
    ro_tb_chk_taco: { name: 'Chicken Soft Taco, fresco (pico instead of cheese)', unit: 'taco', grams: 100, p: 10, c: 14, f: 4, na: 450, fib: 1 },
    ro_dq_bites: { name: 'Rotisserie-Style Chicken Bites', unit: 'order', grams: 140, p: 33, c: 3, f: 10, na: 900, fib: 0 },
    ro_dq_grill_salad: { name: 'Grilled Chicken BLT Salad, light dressing', unit: 'bowl', grams: 330, p: 34, c: 12, f: 18, na: 1050, fib: 3 },
    ro_dq_patty: { name: 'Stackburger Patty', unit: 'patty', grams: 60, p: 13, c: 0, f: 11, na: 200, fib: 0 },
    ro_tt_chk: { name: 'Taco Time Grilled Chicken', unit: 'portion', grams: 90, p: 22, c: 2, f: 5, na: 520, fib: 0 },
    ro_tt_salad_base: { name: 'Taco Salad Base, no shell (lettuce, tomato, cheese, salsa)', unit: 'bowl', grams: 200, p: 8, c: 10, f: 9, na: 450, fib: 3 },
    ro_tt_soft_tortilla: { name: 'Flour Tortilla, soft taco', unit: 'tortilla', grams: 45, p: 4, c: 23, f: 4, na: 330, fib: 1 },
    ro_tt_pinto: { name: 'Refried Pinto Beans, side', unit: 'cup', grams: 120, p: 7, c: 20, f: 3, na: 520, fib: 6 },
    ro_jb_chk_breast: { name: 'Grilled Chicken Breast', unit: 'piece', grams: 170, p: 48, c: 1, f: 6, na: 700, fib: 0 },
    ro_jb_sirloin: { name: 'Top Sirloin, 8 oz', unit: 'piece', grams: 225, p: 52, c: 0, f: 14, na: 480, fib: 0 },
    ro_jb_eggs3: { name: '3 Eggs, any style', unit: 'serving', grams: 150, p: 18, c: 1, f: 15, na: 210, fib: 0 },
    ro_jb_eggwhite_om: { name: 'Egg-White Veggie Omelet', unit: 'piece', grams: 250, p: 26, c: 8, f: 3, na: 520, fib: 2 },
    ro_jb_ham: { name: 'Ham Steak', unit: 'piece', grams: 110, p: 22, c: 2, f: 6, na: 1300, fib: 0 },
    ro_jb_toast: { name: 'Dry Wheat Toast', unit: 'slice', grams: 38, p: 4, c: 17, f: 1, na: 160, fib: 2.5 },
    ro_gg_chk_salad: { name: 'Grilled Chicken Dinner Salad, balsamic on the side', unit: 'bowl', grams: 380, p: 46, c: 12, f: 12, na: 800, fib: 4 },
    ro_gg_sirloin: { name: 'Top Sirloin, 8 oz', unit: 'piece', grams: 225, p: 52, c: 0, f: 14, na: 480, fib: 0 },
    ro_gg_burger_dbl: { name: 'Double Burger Patties (2 \u00d7 1/3 lb)', unit: 'serving', grams: 200, p: 44, c: 0, f: 36, na: 400, fib: 0 },
    ro_wg_naked_wing: { name: 'Naked Bone-in Wing (no sauce)', unit: 'wing', grams: 32, p: 6, c: 0, f: 4, na: 90, fib: 0 },
    ro_wg_grill_chk: { name: 'Grilled Chicken Breast', unit: 'piece', grams: 170, p: 46, c: 2, f: 7, na: 800, fib: 0 },
    ro_wg_chk_salad: { name: 'Grilled Chicken Salad, dressing on the side', unit: 'bowl', grams: 360, p: 44, c: 14, f: 18, na: 1000, fib: 4 },
    ro_dm_wing: { name: 'Domino\u2019s Plain Wing (no sauce)', unit: 'wing', grams: 30, p: 5.5, c: 0.3, f: 3.5, na: 160, fib: 0 },
    ro_dm_thin_slice: { name: 'Thin Crust Chicken & Veggie Slice (14-inch, 1/8)', unit: 'slice', grams: 80, p: 8, c: 13, f: 7, na: 330, fib: 1 },
    ro_lc_wing: { name: 'Caesar Wing, oven-roasted, plain', unit: 'wing', grams: 32, p: 6, c: 0, f: 4.5, na: 180, fib: 0 },
    ro_lc_thin_slice: { name: 'Thin Crust Pepperoni Slice (1/8)', unit: 'slice', grams: 70, p: 8, c: 15, f: 10, na: 380, fib: 1 },
    ro_sh_patty: { name: 'Sherald\u2019s Burger Patty', unit: 'patty', grams: 90, p: 20, c: 0, f: 16, na: 250, fib: 0 },
    ro_sh_grill_chk: { name: 'Grilled Chicken Breast (sandwich, no bun)', unit: 'piece', grams: 140, p: 38, c: 2, f: 6, na: 650, fib: 0 },
    ro_sh_cheese: { name: 'Slice American Cheese', unit: 'slice', grams: 20, p: 4, c: 1, f: 6, na: 260, fib: 0 },
    ro_cfa_grill12: { name: '12 ct Grilled Nuggets', unit: 'portion', grams: 135, p: 38, c: 2, f: 4.5, na: 660, fib: 0, est: false },
    ro_cfa_grill8: { name: '8 ct Grilled Nuggets', unit: 'portion', grams: 90, p: 25, c: 1, f: 3, na: 440, fib: 0, est: false },
    ro_cfa_kale: { name: 'Kale Crunch Side', unit: 'cup', grams: 85, p: 4, c: 13, f: 9, na: 180, fib: 3 },
    ro_cfa_fruit: { name: 'Fruit Cup (small)', unit: 'cup', grams: 125, p: 1, c: 15, f: 0, na: 0, fib: 2, est: false },
    ro_cfa_cool_wrap: { name: 'Grilled Cool Wrap, no dressing', unit: 'piece', grams: 230, p: 42, c: 29, f: 13, na: 960, fib: 13, est: false },
    ro_cfa_egg_white: { name: 'Egg White Grill', unit: 'piece', grams: 172, p: 27, c: 29, f: 8, na: 970, fib: 1, est: false },
    ro_mx_chicken: { name: 'Grilled Chicken, one scoop', unit: 'portion', grams: 115, p: 30, c: 2, f: 7, na: 520, fib: 0 },
    ro_mx_steak: { name: 'Grilled Steak, one scoop', unit: 'portion', grams: 115, p: 27, c: 2, f: 9, na: 560, fib: 0 },
    ro_mx_greens: { name: 'Romaine & Greens', unit: 'bowl', grams: 120, p: 1, c: 4, f: 0, na: 20, fib: 2 },
    ro_mx_black_beans: { name: 'Black Beans, half scoop', unit: 'portion', grams: 65, p: 4, c: 11, f: 0.5, na: 180, fib: 3 },
    ro_mx_pico: { name: 'Pico de Gallo', unit: 'portion', grams: 60, p: 0.5, c: 3, f: 0, na: 180, fib: 1 },
    ro_mx_dressing_lt: { name: 'Tomatillo Ranch, light (1 oz)', unit: 'portion', grams: 30, p: 1, c: 2, f: 8, na: 210, fib: 0 },
    ro_mx_corn_tort: { name: 'Corn Tortilla', unit: 'tortilla', grams: 28, p: 1.5, c: 12, f: 0.8, na: 15, fib: 1.5 },
    ro_mx_cabbage: { name: 'Shredded Cabbage & Lime', unit: 'cup', grams: 70, p: 1, c: 4, f: 0.5, na: 60, fib: 1.5 },
    ro_mx_cheese: { name: 'Cotija / Shredded Cheese', unit: 'portion', grams: 20, p: 4, c: 0.5, f: 5, na: 200, fib: 0 },
    ro_cp_chicken: { name: 'Chipotle Chicken (4 oz)', unit: 'portion', grams: 113, p: 32, c: 0, f: 7, na: 310, fib: 0, est: false },
    ro_cp_steak: { name: 'Chipotle Steak (4 oz)', unit: 'portion', grams: 113, p: 21, c: 1, f: 6, na: 330, fib: 0, est: false },
    ro_cp_barbacoa: { name: 'Chipotle Barbacoa (4 oz)', unit: 'portion', grams: 113, p: 24, c: 2, f: 7, na: 530, fib: 1, est: false },
    ro_cp_supergreens: { name: 'Supergreens Lettuce Blend', unit: 'bowl', grams: 75, p: 1, c: 3, f: 0, na: 15, fib: 2, est: false },
    ro_cp_fajita: { name: 'Fajita Veggies', unit: 'portion', grams: 71, p: 1, c: 5, f: 0, na: 150, fib: 1, est: false },
    ro_cp_pico: { name: 'Fresh Tomato Salsa', unit: 'portion', grams: 100, p: 0, c: 4, f: 0, na: 550, fib: 1, est: false },
    ro_cp_black_beans: { name: 'Black Beans', unit: 'portion', grams: 113, p: 8, c: 22, f: 1.5, na: 210, fib: 7, est: false },
    ro_cp_rice: { name: 'Cilantro-Lime White Rice', unit: 'portion', grams: 113, p: 4, c: 40, f: 4, na: 350, fib: 1, est: false },
    ro_cp_cheese: { name: 'Monterey Jack Cheese', unit: 'portion', grams: 28, p: 6, c: 1, f: 8.5, na: 190, fib: 0, est: false },
    ro_cp_green_salsa: { name: 'Tomatillo-Green Chili Salsa', unit: 'portion', grams: 57, p: 0, c: 4, f: 0, na: 260, fib: 0, est: false },
    ro_pd_teri_chk: { name: 'Grilled Teriyaki Chicken', unit: 'portion', grams: 170, p: 33, c: 10, f: 12, na: 530, fib: 0 },
    ro_pd_angus: { name: 'Black Pepper Angus Steak', unit: 'portion', grams: 155, p: 19, c: 10, f: 7, na: 870, fib: 1 },
    ro_pd_broc_beef: { name: 'Broccoli Beef', unit: 'portion', grams: 155, p: 9, c: 13, f: 7, na: 520, fib: 2, est: false },
    ro_pd_str_bean: { name: 'String Bean Chicken Breast', unit: 'portion', grams: 155, p: 12, c: 13, f: 9, na: 590, fib: 2 },
    ro_pd_supergreens: { name: 'Super Greens', unit: 'portion', grams: 225, p: 6, c: 10, f: 3, na: 260, fib: 5, est: false },
    ro_zp_chk: { name: 'Grilled Chicken, extra portion', unit: 'portion', grams: 85, p: 22, c: 1, f: 3, na: 330, fib: 0 },
    ro_zp_salad_lt: { name: 'Entr\u00e9e Salad Greens & Toppings, light dressing', unit: 'bowl', grams: 220, p: 4, c: 14, f: 10, na: 380, fib: 4 },
    ro_zp_protein_bowl: { name: 'Protein Bowl Base (quinoa, roasted veg)', unit: 'bowl', grams: 200, p: 6, c: 27, f: 6, na: 300, fib: 5 },
    ro_zp_chk_soup: { name: 'Chicken Enchilada Chili, cup', unit: 'cup', grams: 240, p: 12, c: 18, f: 9, na: 800, fib: 4 },
    ro_rr_turkey: { name: 'Smoked Turkey Breast, 1/3 lb', unit: 'portion', grams: 150, p: 36, c: 1, f: 4, na: 700, fib: 0 },
    ro_rr_brisket: { name: 'Brisket (lean), 1/3 lb', unit: 'portion', grams: 150, p: 34, c: 1, f: 16, na: 600, fib: 0 },
    ro_rr_pulled_pork: { name: 'Pulled Pork, 1/3 lb', unit: 'portion', grams: 150, p: 30, c: 3, f: 14, na: 650, fib: 0 },
    ro_rr_chicken: { name: 'Smoked Chicken (half, skin off)', unit: 'portion', grams: 200, p: 50, c: 1, f: 12, na: 800, fib: 0 },
    ro_rr_green_beans: { name: 'Green Beans', unit: 'cup', grams: 135, p: 2, c: 8, f: 3, na: 380, fib: 3 },
    ro_rr_side_salad: { name: 'Side Salad, dressing on the side', unit: 'bowl', grams: 120, p: 2, c: 6, f: 4, na: 150, fib: 2 },
    ro_kn_tba_salad: { name: 'Turkey Bacon Avocado Salad, no croutons, dressing on the side', unit: 'bowl', grams: 340, p: 40, c: 14, f: 22, na: 1200, fib: 6 },
    ro_kn_caesar_chk: { name: 'Chicken Caesar Salad, no croutons, half dressing', unit: 'bowl', grams: 300, p: 38, c: 9, f: 18, na: 1000, fib: 3 },
    ro_kn_extra_meat: { name: 'Extra Turkey or Chicken', unit: 'portion', grams: 70, p: 16, c: 1, f: 2, na: 450, fib: 0 },
    ro_jm_7_tub: { name: '#7 Turkey & Provolone, Sub in a Tub (Mike\u2019s Way, no oil)', unit: 'bowl', grams: 300, p: 30, c: 9, f: 10, na: 1300, fib: 2 },
    ro_jm_16_tub: { name: '#16 Chicken Philly, Sub in a Tub', unit: 'bowl', grams: 300, p: 36, c: 9, f: 16, na: 1200, fib: 2 },
    ro_jm_17_tub: { name: '#17 Mike\u2019s Famous Philly (steak), Sub in a Tub', unit: 'bowl', grams: 300, p: 32, c: 9, f: 20, na: 1100, fib: 2 },
    ro_jm_extra_meat: { name: 'Extra Meat (regular)', unit: 'portion', grams: 85, p: 15, c: 2, f: 3, na: 600, fib: 0 },
    ro_mb_teri_chk: { name: 'Teriyaki Chicken (thigh), regular portion', unit: 'portion', grams: 170, p: 40, c: 8, f: 18, na: 900, fib: 0 },
    ro_mb_kalua: { name: 'Kalua Pork, regular portion', unit: 'portion', grams: 140, p: 28, c: 1, f: 16, na: 800, fib: 0 },
    ro_mb_cabbage: { name: 'Shredded Cabbage', unit: 'cup', grams: 90, p: 1, c: 5, f: 0, na: 20, fib: 2 },
    ro_mb_rice_scoop: { name: 'White Rice, one scoop', unit: 'cup', grams: 160, p: 4, c: 44, f: 0.5, na: 0, fib: 1 },
    ro_tg_teri_chk: { name: 'Teriyaki Chicken (thigh), regular portion', unit: 'portion', grams: 170, p: 38, c: 8, f: 17, na: 850, fib: 0 },
    ro_tg_steam_veg: { name: 'Steamed Vegetables', unit: 'cup', grams: 150, p: 3, c: 10, f: 1, na: 120, fib: 4 },
    ro_cb_bbq_chk: { name: 'Cupbop BBQ Chicken (thigh), regular', unit: 'portion', grams: 160, p: 34, c: 12, f: 15, na: 900, fib: 0 },
    ro_cb_cabbage: { name: 'Cabbage & Bean Sprouts', unit: 'cup', grams: 100, p: 2, c: 5, f: 0, na: 30, fib: 2 },
    ro_cv_grill_chk: { name: 'Culver\u2019s Grilled Chicken Breast', unit: 'piece', grams: 130, p: 34, c: 2, f: 4, na: 700, fib: 0 },
    ro_cv_fresco_base: { name: 'Garden Fresco Salad (greens, tomato, cheese, light dressing)', unit: 'bowl', grams: 220, p: 6, c: 10, f: 12, na: 450, fib: 3 },
    ro_in_dbl_ps: { name: 'Double-Double, Protein Style, mustard & ketchup instead of spread', unit: 'piece', grams: 300, p: 33, c: 11, f: 30, na: 1100, fib: 3 },
    ro_in_patty_cheese: { name: 'Extra Patty with Cheese', unit: 'serving', grams: 70, p: 13, c: 0, f: 13, na: 400, fib: 0 },
    ro_in_flying_d: { name: 'Flying Dutchman (2 patties, 2 cheese)', unit: 'piece', grams: 130, p: 30, c: 1, f: 26, na: 800, fib: 0 },
    ro_sn_dbl_lw: { name: 'Double Cheeseburger Patties, lettuce-wrapped, no sauce', unit: 'serving', grams: 230, p: 40, c: 6, f: 34, na: 1000, fib: 1 },
    ro_sn_grill_chk: { name: 'Grilled Chicken (sandwich, no bun)', unit: 'piece', grams: 130, p: 30, c: 2, f: 5, na: 800, fib: 0 },
    ro_bk_whopper_pt: { name: 'Whopper Patty', unit: 'patty', grams: 85, p: 22, c: 0, f: 17, na: 230, fib: 0 },
    ro_jj_4_unwich: { name: '#4 Turkey Tom Unwich (lettuce wrap, no mayo)', unit: 'piece', grams: 250, p: 24, c: 6, f: 2, na: 1000, fib: 2 },
    ro_jj_12_unwich: { name: '#12 Beach Club Unwich (no mayo)', unit: 'piece', grams: 300, p: 26, c: 8, f: 16, na: 1100, fib: 5 },
    ro_jj_10_unwich: { name: '#10 Hunter\u2019s Club Unwich (no mayo)', unit: 'piece', grams: 280, p: 28, c: 6, f: 14, na: 1100, fib: 2 },
    ro_jj_extra_meat: { name: 'Extra Meat', unit: 'portion', grams: 70, p: 12, c: 2, f: 2, na: 500, fib: 0 },
    ro_mc_sausage_mcm: { spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'b', name: 'Sausage McMuffin with Egg', unit: 'piece', grams: 165, p: 20, c: 30, f: 31, na: 830, fib: 2, est: false },
    ro_mc_mccrispy_strips: { spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', name: 'McCrispy Strips (4 pc)', unit: 'order', grams: 160, p: 32, c: 22, f: 18, na: 1020, fib: 1 },
    ro_mc_apple_slices: { spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'blds', name: 'Apple Slices (bag)', unit: 'bag', grams: 34, p: 0, c: 4, f: 0, na: 0, fib: 0, est: false },
    ro_mc_mcdouble_nobun: { spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', name: 'McDouble, no bun (2 patties, 1 slice cheese, pickles, onion)', unit: 'piece', grams: 115, p: 18, c: 3, f: 17, na: 620, fib: 0 },
    ro_cfa_grill_sand: { spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld', name: 'Grilled Chicken Sandwich', unit: 'piece', grams: 203, p: 28, c: 44, f: 12, na: 770, fib: 3, est: false },
    ro_cfa_grill30: { spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld', name: '30 ct Grilled Nuggets', unit: 'order', grams: 338, p: 98, c: 3, f: 11, na: 1650, fib: 0, est: false },
    ro_cfa_sw_salad: { spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld', name: 'Spicy Southwest Salad with Grilled Chicken (no dressing)', unit: 'bowl', grams: 390, p: 33, c: 27, f: 19, na: 1070, fib: 7, est: false },
    ro_cfa_scramble_bowl: { spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'b', name: 'Hash Brown Scramble Bowl with Grilled Chicken', unit: 'bowl', grams: 263, p: 29, c: 19, f: 26, na: 1090, fib: 1, est: false },
    ro_cfa_chk_soup: { spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'lds', name: 'Chicken Noodle Soup (cup)', unit: 'cup', grams: 252, p: 11, c: 21, f: 4, na: 850, fib: 1, est: false },
    ro_wd_bfast_bacon: { spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'b', name: 'Classic Bacon, Egg & Cheese Sandwich', unit: 'piece', grams: 135, p: 18, c: 25, f: 17, na: 800, fib: 1, est: false },
    ro_wd_grill_wrap: { spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Grilled Chicken Ranch Wrap', unit: 'piece', grams: 205, p: 27, c: 41, f: 16, na: 1170, fib: 2, est: false },
    ro_wd_apple_pecan: { spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Apple Pecan Salad with Grilled Chicken (half dressing)', unit: 'bowl', grams: 340, p: 39, c: 27, f: 18, na: 980, fib: 5 },
    ro_wd_jr_bacon_nobun: { spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', name: 'Jr. Bacon Cheeseburger, no bun (lettuce wrap)', unit: 'piece', grams: 115, p: 14, c: 3, f: 18, na: 460, fib: 1 },
    ro_ab_turkey_farm: { spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Roast Turkey Farmhouse Salad (no dressing)', unit: 'bowl', grams: 285, p: 23, c: 8, f: 13, na: 850, fib: 2, est: false },
    ro_ab_gyro_turkey: { spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Roast Turkey Gyro', unit: 'piece', grams: 263, p: 25, c: 48, f: 20, na: 1410, fib: 3, est: false },
    ro_kfc_mashed_gravy: { spot: 'KFC \u00b7 Spanish Fork', meals: 'ld', name: 'Mashed Potatoes with Gravy (individual)', unit: 'cup', grams: 136, p: 2, c: 19, f: 4.5, na: 530, fib: 1, est: false },
    ro_kfc_corn: { spot: 'KFC \u00b7 Spanish Fork', meals: 'ld', name: 'Sweet Kernel Corn (individual)', unit: 'cup', grams: 99, p: 2, c: 16, f: 0.5, na: 5, fib: 2, est: false },
    ro_kfc_coleslaw: { spot: 'KFC \u00b7 Spanish Fork', meals: 'ld', name: 'Cole Slaw (individual)', unit: 'cup', grams: 130, p: 1, c: 14, f: 10, na: 170, fib: 3, est: false },
    ro_dq_grill_sand: { spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Grilled Chicken Sandwich', unit: 'piece', grams: 215, p: 31, c: 37, f: 13, na: 940, fib: 2 },
    ro_dq_strips3: { spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Chicken Strips (3 pc, no toast/fries)', unit: 'order', grams: 165, p: 26, c: 23, f: 16, na: 1030, fib: 1 },
    ro_dq_side_salad: { spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Side Salad (no dressing)', unit: 'bowl', grams: 113, p: 2, c: 4, f: 0, na: 15, fib: 1, est: false },
    ro_mx_sweet_pork: { spot: 'Costa Vida \u00b7 Price & Spanish Fork', spots: ['Costa Vida', 'Cafe Rio'], meals: 'ld', name: 'Sweet Pork, half scoop (lighter)', unit: 'portion', grams: 85, p: 16, c: 18, f: 7, na: 460, fib: 0 },
    ro_mx_guac: { spot: 'Costa Vida \u00b7 Price & Spanish Fork', spots: ['Costa Vida', 'Cafe Rio'], meals: 'ld', name: 'Fresh Guacamole (2 oz)', unit: 'portion', grams: 57, p: 1, c: 5, f: 8, na: 180, fib: 3 },
    ro_cp_guac: { spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld', name: 'Chipotle Guacamole (side/top)', unit: 'portion', grams: 113, p: 2, c: 8, f: 22, na: 370, fib: 6, est: false },
    ro_cp_pinto_beans: { spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld', name: 'Pinto Beans', unit: 'portion', grams: 113, p: 8, c: 21, f: 1.5, na: 210, fib: 8, est: false },
    ro_cp_corn_salsa: { spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld', name: 'Roasted Chili-Corn Salsa', unit: 'portion', grams: 100, p: 3, c: 16, f: 1.5, na: 330, fib: 3, est: false },
    ro_sw_egg_patty: { spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'b', name: 'Egg Omelet Patty (6-inch portion)', unit: 'piece', grams: 85, p: 11, c: 2, f: 7, na: 290, fib: 0, est: false },
    ro_sw_rot_chk: { spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Rotisserie-Style Chicken (6-inch portion)', unit: 'portion', grams: 85, p: 21, c: 0, f: 4.5, na: 350, fib: 0, est: false },
    ro_tb_bfast_taco: { spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'b', name: 'Breakfast Soft Taco (Egg, Cheese & Bacon)', unit: 'taco', grams: 99, p: 11, c: 16, f: 13, na: 450, fib: 1, est: false },
    ro_tb_steak_taco: { spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Grilled Steak Soft Taco, Fresco Style', unit: 'taco', grams: 99, p: 10, c: 16, f: 4.5, na: 490, fib: 2, est: false },
    ro_tb_black_beans: { spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Black Beans (side)', unit: 'cup', grams: 85, p: 3, c: 9, f: 1, na: 140, fib: 3, est: false },
    ro_tt_crisp_chk: { spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', name: 'Crisp Chicken Taco', unit: 'taco', grams: 115, p: 16, c: 15, f: 10, na: 390, fib: 2 },
    ro_pd_mush_chk: { spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', name: 'Mushroom Chicken', unit: 'portion', grams: 167, p: 13, c: 10, f: 14, na: 840, fib: 1, est: false },
    ro_pd_white_rice: { spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', name: 'Steamed White Rice (half side)', unit: 'cup', grams: 115, p: 3.5, c: 43, f: 0, na: 0, fib: 0, est: false },
    ro_zp_berries_chk: { spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', name: 'Nuts About Berries Salad with Grilled Chicken (half dressing)', unit: 'bowl', grams: 320, p: 34, c: 22, f: 16, na: 680, fib: 5 },
    ro_zp_cauli_soup: { spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', name: 'Wisconsin Cauliflower Soup (cup)', unit: 'cup', grams: 240, p: 9, c: 14, f: 16, na: 780, fib: 2 },
    ro_kn_bfast_croiss: { spot: 'Kneaders \u00b7 Spanish Fork', meals: 'b', name: 'Breakfast Croissant Sandwich (Egg, Turkey Bacon & Cheese)', unit: 'piece', grams: 195, p: 24, c: 31, f: 22, na: 890, fib: 2 },
    ro_jm_8_tub: { spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', name: '#8 Club Sub in a Tub (Turkey, Ham, Provolone, Bacon, no oil)', unit: 'bowl', grams: 330, p: 34, c: 10, f: 16, na: 1550, fib: 2 },
    ro_jj_9_unwich: { spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld', name: '#9 Italian Night Club Unwich (no mayo)', unit: 'piece', grams: 310, p: 33, c: 8, f: 22, na: 1680, fib: 2 },
    ro_sn_bfast_burr: { spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'b', name: 'SuperSONIC Breakfast Burrito', unit: 'piece', grams: 190, p: 21, c: 36, f: 27, na: 1380, fib: 2 },
    ro_bk_croiss_egg: { spot: 'Burger King \u00b7 Spanish Fork (confirm)', meals: 'b', name: 'Bacon, Egg & Cheese Croissan\u2019wich', unit: 'piece', grams: 121, p: 15, c: 28, f: 21, na: 780, fib: 1, est: false }
  };

  var MEATOUT_COMBOS = [
    // Walmart Deli
    { id: 'wm_rot_breast_veg', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Walmart Deli \u2014 Rotisserie chicken breast, skin off (6 oz) + veggie cup',
      parts: [['ro_wm_rot_breast', 1], ['ro_wm_veg_cup', 1]] },
    { id: 'wm_rot_breast_salad', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Walmart Deli \u2014 Rotisserie chicken breast (6 oz) + salad kit, half the dressing',
      parts: [['ro_wm_rot_breast', 1], ['ro_wm_salad_kit', 1]] },
    { id: 'wm_rot_breast_eggs', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'bld', est: true,
      name: 'Walmart Deli \u2014 Rotisserie chicken breast (6 oz) + 2 hard-boiled eggs',
      parts: [['ro_wm_rot_breast', 1], ['ro_hb_egg2', 1]] },
    { id: 'wm_rot_shake', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Walmart Deli \u2014 Rotisserie chicken breast (4 oz) + Core Power 42 g shake',
      parts: [['ro_wm_rot_breast', 0.67], ['ro_fl_core42', 1]] },
    { id: 'wm_eggs_yog_core', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'Walmart Deli \u2014 2 hard-boiled eggs + Greek yogurt cup + Core Power 42 g shake',
      parts: [['ro_hb_egg2', 1], ['ro_greek_yog', 1], ['ro_fl_core42', 1]] },
    { id: 'wm_eggs_yog_fruit', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'bs', est: true,
      name: 'Walmart Deli \u2014 2 hard-boiled eggs + Greek yogurt cup + fruit cup',
      parts: [['ro_hb_egg2', 1], ['ro_greek_yog', 1], ['ro_fruit_cup', 1]] },
    { id: 'wm_rot_leg_veg', spot: 'Walmart Deli \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Walmart Deli \u2014 Rotisserie leg quarter, skin on + veggie cup',
      parts: [['ro_wm_rot_leg', 1], ['ro_wm_veg_cup', 1]] },

    // Subway
    { id: 'sw_chk_bowl2', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 Protein Bowl, grilled chicken, double meat (all veggies, vinegar)',
      parts: [['ro_sw_chicken', 4], ['ro_sw_veg', 1]] },
    { id: 'sw_chk_bowl', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 Protein Bowl, grilled chicken (all veggies, vinegar)',
      parts: [['ro_sw_chicken', 2], ['ro_sw_veg', 1]] },
    { id: 'sw_chk_turkey_bowl', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 Protein Bowl, chicken & turkey, double meat, provolone',
      parts: [['ro_sw_chicken', 2], ['ro_sw_turkey', 2], ['ro_sw_provolone', 1], ['ro_sw_veg', 1]] },
    { id: 'sw_steak_bowl2', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 Protein Bowl, steak & cheese, double meat',
      parts: [['ro_sw_steak', 4], ['ro_sw_provolone', 1], ['ro_sw_veg', 1]] },
    { id: 'sw_turkey_ham_bowl2', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 Protein Bowl, turkey & ham, double meat',
      parts: [['ro_sw_turkey', 2], ['ro_sw_ham', 2], ['ro_sw_veg', 1]] },
    { id: 'sw_chk_6in_dbl', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Subway \u2014 6-inch grilled chicken on multigrain, double meat',
      parts: [['ro_sw_chicken', 2], ['ro_sw_bread6', 1], ['ro_sw_veg', 1]] },

    // Maverik
    { id: 'mv_core_eggs', spot: 'Maverik \u00b7 Price & Spanish Fork', meals: 'bls',
      name: 'Maverik \u2014 Core Power 42 g shake + 2 hard-boiled eggs',
      parts: [['ro_fl_core42', 1], ['ro_hb_egg2', 1]] },
    { id: 'mv_np_jerky', spot: 'Maverik \u00b7 Price & Spanish Fork', meals: 'ls', est: true,
      name: 'Maverik \u2014 Fairlife 30 g shake + 2 oz beef jerky',
      parts: [['ro_fl_np30', 1], ['ro_beef_jerky2', 1]] },
    { id: 'mv_yog_jerky', spot: 'Maverik \u00b7 Price & Spanish Fork', meals: 'ls', est: true,
      name: 'Maverik \u2014 Greek yogurt + 2 oz beef jerky',
      parts: [['ro_greek_yog', 1], ['ro_beef_jerky2', 1]] },
    { id: 'mv_np_cheese', spot: 'Maverik \u00b7 Price & Spanish Fork', meals: 'bls',
      name: 'Maverik \u2014 Fairlife 30 g shake + 2 string cheese',
      parts: [['ro_fl_np30', 1], ['ro_string_cheese2', 1]] },
    { id: 'mv_tacos_np', spot: 'Maverik \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Maverik \u2014 2 BonFire chicken street tacos + Fairlife 30 g shake',
      parts: [['ro_mv_bonfire_taco', 2], ['ro_fl_np30', 1]] },

    // McDonald\u2019s
    { id: 'mc_dqp_nobun', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'McDonald\u2019s \u2014 Double Quarter Pounder, no bun, no cheese (pickles, onion, mustard)',
      parts: [['ro_mc_qp_patty', 2], ['ro_lettuce_wrap', 1]] },
    { id: 'mc_mcm_egg', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'McDonald\u2019s \u2014 Egg McMuffin + extra round egg',
      parts: [['ro_mc_egg_mcm', 1], ['ro_mc_round_egg', 1]] },
    { id: 'mc_mcm_core', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'McDonald\u2019s \u2014 Egg McMuffin + Core Power 42 g shake (bring or Maverik)',
      parts: [['ro_mc_egg_mcm', 1], ['ro_fl_core42', 1]] },
    { id: 'mc_3patty_nobun', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', est: true,
      name: 'McDonald\u2019s \u2014 Three regular patties, no bun (pickles, onion, mustard)',
      parts: [['ro_mc_reg_patty', 3], ['ro_lettuce_wrap', 1]] },

    // Wendy\u2019s
    { id: 'wd_caesar', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Parmesan Caesar Salad, half dressing, no croutons',
      parts: [['ro_wd_caesar_chk', 1]] },
    { id: 'wd_cobb', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Cobb Salad, half dressing',
      parts: [['ro_wd_cobb_chk', 1]] },
    { id: 'wd_chili_patty', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Small chili + single patty, no bun',
      parts: [['ro_wd_chili_sm', 1], ['ro_wd_patty', 1], ['ro_lettuce_wrap', 1]] },
    { id: 'wd_double_nobun', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Dave\u2019s Double, no bun, no cheese, no mayo',
      parts: [['ro_wd_patty', 2], ['ro_lettuce_wrap', 1]] },
    { id: 'wd_chili_lg', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', est: true,
      name: 'Wendy\u2019s \u2014 Large chili',
      parts: [['ro_wd_chili_lg', 1]] },

    // Arby\u2019s
    { id: 'ab_half_lb_nobun', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Arby\u2019s \u2014 Half-pound roast beef, meat only (no bun)',
      parts: [['ro_ab_roast_beef', 2.67]] },
    { id: 'ab_double_nobun', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', est: true,
      name: 'Arby\u2019s \u2014 Double roast beef, meat only (no bun)',
      parts: [['ro_ab_roast_beef', 2]] },
    { id: 'ab_double_salad', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Arby\u2019s \u2014 Double roast beef, meat only + side salad',
      parts: [['ro_ab_roast_beef', 2], ['ro_side_salad', 1]] },
    { id: 'ab_classic', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Arby\u2019s \u2014 Classic roast beef sandwich',
      parts: [['ro_ab_roast_beef', 1], ['ro_ab_bun', 1]] },

    // KFC
    { id: 'kfc_nug12_beans', spot: 'KFC \u00b7 Spanish Fork', meals: 'ld',
      name: 'KFC \u2014 12 pc Secret Recipe Nuggets + two green bean sides',
      parts: [['ro_kfc_nug12', 1], ['ro_kfc_grn_beans', 2]] },
    { id: 'kfc_nug8_beans', spot: 'KFC \u00b7 Spanish Fork', meals: 'lds',
      name: 'KFC \u2014 8 pc Secret Recipe Nuggets + green beans',
      parts: [['ro_kfc_nug8', 1], ['ro_kfc_grn_beans', 1]] },
    { id: 'kfc_peeled_breast', spot: 'KFC \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'KFC \u2014 2 Original Recipe chicken breasts (skin & breading peeled off) + green beans',
      parts: [['ro_kfc_or_peeled', 2], ['ro_kfc_grn_beans', 1]] },

    // Taco Bell
    { id: 'tb_bowl_norice_xchk', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Bell \u2014 Cantina Chicken Bowl, no rice, extra chicken',
      parts: [['ro_tb_bowl_norice', 1], ['ro_tb_cantina_chk', 1]] },
    { id: 'tb_bowl_norice_2xchk', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Bell \u2014 Cantina Chicken Bowl, no rice, two extra chicken',
      parts: [['ro_tb_bowl_norice', 1], ['ro_tb_cantina_chk', 2]] },
    { id: 'tb_3_chk_tacos', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Bell \u2014 3 chicken soft tacos, fresco style',
      parts: [['ro_tb_chk_taco', 3]] },
    { id: 'tb_bowl', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Bell \u2014 Cantina Chicken Bowl as it comes',
      parts: [['ro_tb_bowl', 1]] },

    // Dairy Queen
    { id: 'dq_bites_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 Rotisserie-style chicken bites + side salad',
      parts: [['ro_dq_bites', 1], ['ro_side_salad', 1]] },
    { id: 'dq_bites2', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 Two orders rotisserie-style chicken bites',
      parts: [['ro_dq_bites', 2]] },
    { id: 'dq_grill_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 Grilled Chicken BLT Salad, light dressing',
      parts: [['ro_dq_grill_salad', 1]] },
    { id: 'dq_dbl_nobun', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 Double Stackburger, no bun, no mayo',
      parts: [['ro_dq_patty', 2], ['ro_lettuce_wrap', 1]] },

    // Taco Time
    { id: 'tt_salad_chk', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Time \u2014 Chicken taco salad, no shell, extra chicken',
      parts: [['ro_tt_salad_base', 1], ['ro_tt_chk', 2]] },
    { id: 'tt_salad_chk1', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Time \u2014 Chicken taco salad, no shell',
      parts: [['ro_tt_salad_base', 1], ['ro_tt_chk', 1]] },
    { id: 'tt_chk_beans', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Time \u2014 Double grilled chicken + side of pinto beans',
      parts: [['ro_tt_chk', 2], ['ro_tt_pinto', 1]] },
    { id: 'tt_2_soft', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Time \u2014 2 soft chicken tacos',
      parts: [['ro_tt_chk', 2], ['ro_tt_soft_tortilla', 2]] },

    // JB\u2019s Restaurant
    { id: 'jb_chk_veg', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'ld', est: true,
      name: 'JB\u2019s Restaurant \u2014 Grilled chicken breast + steamed vegetables + side salad',
      parts: [['ro_jb_chk_breast', 1], ['ro_steamed_veg', 1], ['ro_side_salad', 1]] },
    { id: 'jb_sirloin_veg', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'd', est: true,
      name: 'JB\u2019s Restaurant \u2014 Top sirloin (8 oz) + steamed vegetables, no potato',
      parts: [['ro_jb_sirloin', 1], ['ro_steamed_veg', 1]] },
    { id: 'jb_eggwhite_ham', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'b', est: true,
      name: 'JB\u2019s Restaurant \u2014 Egg-white veggie omelet + ham steak',
      parts: [['ro_jb_eggwhite_om', 1], ['ro_jb_ham', 1]] },
    { id: 'jb_eggwhite_fruit', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'b', est: true,
      name: 'JB\u2019s Restaurant \u2014 Egg-white veggie omelet + fruit cup',
      parts: [['ro_jb_eggwhite_om', 1], ['ro_fruit_cup', 1]] },
    { id: 'jb_steak_eggs', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'b', est: true,
      name: 'JB\u2019s Restaurant \u2014 Sirloin & 3 eggs + dry wheat toast, no hash browns',
      parts: [['ro_jb_sirloin', 0.75], ['ro_jb_eggs3', 1], ['ro_jb_toast', 1]] },

    // Grogg\u2019s Pinnacle Brewing
    { id: 'gg_chk_salad', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'ld', est: true,
      name: 'Grogg\u2019s Pinnacle Brewing \u2014 Grilled chicken dinner salad, balsamic on the side',
      parts: [['ro_gg_chk_salad', 1]] },
    { id: 'gg_sirloin_veg', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'd', est: true,
      name: 'Grogg\u2019s Pinnacle Brewing \u2014 Top sirloin (8 oz) + steamed vegetables, no potato',
      parts: [['ro_gg_sirloin', 1], ['ro_steamed_veg', 1]] },
    { id: 'gg_sirloin_salad', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'd', est: true,
      name: 'Grogg\u2019s Pinnacle Brewing \u2014 Top sirloin (8 oz) + side salad',
      parts: [['ro_gg_sirloin', 1], ['ro_side_salad', 1]] },
    { id: 'gg_burger_lw', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'ld', est: true,
      name: 'Grogg\u2019s Pinnacle Brewing \u2014 Double burger, lettuce-wrapped + side salad (fattier)',
      parts: [['ro_gg_burger_dbl', 1], ['ro_lettuce_wrap', 1], ['ro_side_salad', 1]] },

    // Wingers
    { id: 'wg_grill_veg', spot: 'Wingers \u00b7 Price', meals: 'ld', est: true,
      name: 'Wingers \u2014 Grilled chicken breast + steamed vegetables',
      parts: [['ro_wg_grill_chk', 1], ['ro_steamed_veg', 1]] },
    { id: 'wg_chk_salad', spot: 'Wingers \u00b7 Price', meals: 'ld', est: true,
      name: 'Wingers \u2014 Grilled chicken salad, dressing on the side',
      parts: [['ro_wg_chk_salad', 1]] },
    { id: 'wg_naked8_salad', spot: 'Wingers \u00b7 Price', meals: 'ld', est: true,
      name: 'Wingers \u2014 8 naked wings (no sauce) + side salad',
      parts: [['ro_wg_naked_wing', 8], ['ro_side_salad', 1]] },
    { id: 'wg_naked12', spot: 'Wingers \u00b7 Price', meals: 'd', est: true,
      name: 'Wingers \u2014 12 naked wings, no sauce, celery (fattier)',
      parts: [['ro_wg_naked_wing', 12], ['ro_wm_veg_cup', 0.5]] },

    // Domino\u2019s
    { id: 'dm_wings8', spot: 'Domino\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Domino\u2019s \u2014 8 plain wings, no sauce (fattier)',
      parts: [['ro_dm_wing', 8]] },
    { id: 'dm_wings8_salad', spot: 'Domino\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Domino\u2019s \u2014 8 plain wings + side salad from home (fattier)',
      parts: [['ro_dm_wing', 8], ['ro_side_salad', 1]] },
    { id: 'dm_thin2', spot: 'Domino\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Domino\u2019s \u2014 2 slices thin crust chicken & veggie',
      parts: [['ro_dm_thin_slice', 2]] },

    // Little Caesars
    { id: 'lc_wings8', spot: 'Little Caesars \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Little Caesars \u2014 8 Caesar Wings, oven-roasted, plain (fattier)',
      parts: [['ro_lc_wing', 8]] },
    { id: 'lc_wings6_slice', spot: 'Little Caesars \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Little Caesars \u2014 6 plain Caesar Wings + 1 thin crust slice',
      parts: [['ro_lc_wing', 6], ['ro_lc_thin_slice', 1]] },
    { id: 'lc_thin2', spot: 'Little Caesars \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Little Caesars \u2014 2 slices thin crust pepperoni',
      parts: [['ro_lc_thin_slice', 2]] },

    // Sherald\u2019s
    { id: 'sh_grill_salad', spot: 'Sherald\u2019s \u00b7 Price', meals: 'ld', est: true,
      name: 'Sherald\u2019s \u2014 Grilled chicken, no bun + side salad',
      parts: [['ro_sh_grill_chk', 1], ['ro_side_salad', 1]] },
    { id: 'sh_dbl_lw', spot: 'Sherald\u2019s \u00b7 Price', meals: 'ld', est: true,
      name: 'Sherald\u2019s \u2014 Double burger, lettuce-wrapped, mustard & pickles (fattier)',
      parts: [['ro_sh_patty', 2], ['ro_lettuce_wrap', 1]] },
    { id: 'sh_grill_dbl', spot: 'Sherald\u2019s \u00b7 Price', meals: 'ld', est: true,
      name: 'Sherald\u2019s \u2014 Two grilled chicken breasts, no buns, lettuce & tomato',
      parts: [['ro_sh_grill_chk', 2], ['ro_lettuce_wrap', 1]] },

    // Chick-fil-A
    { id: 'cfa_12_fruit', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'lds',
      name: 'Chick-fil-A \u2014 12 ct grilled nuggets + fruit cup',
      parts: [['ro_cfa_grill12', 1], ['ro_cfa_fruit', 1]] },
    { id: 'cfa_12_kale', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Chick-fil-A \u2014 12 ct grilled nuggets + Kale Crunch side',
      parts: [['ro_cfa_grill12', 1], ['ro_cfa_kale', 1]] },
    { id: 'cfa_20_fruit', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chick-fil-A \u2014 20 grilled nuggets (12 ct + 8 ct) + fruit cup',
      parts: [['ro_cfa_grill12', 1], ['ro_cfa_grill8', 1], ['ro_cfa_fruit', 1]] },
    { id: 'cfa_cool_wrap', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chick-fil-A \u2014 Grilled Cool Wrap, no dressing',
      parts: [['ro_cfa_cool_wrap', 1]] },
    { id: 'cfa_ewg_8', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'b',
      name: 'Chick-fil-A \u2014 Egg White Grill + 8 ct grilled nuggets',
      parts: [['ro_cfa_egg_white', 1], ['ro_cfa_grill8', 1]] },
    { id: 'cfa_ewg_12', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'b',
      name: 'Chick-fil-A \u2014 Egg White Grill + 12 ct grilled nuggets',
      parts: [['ro_cfa_egg_white', 1], ['ro_cfa_grill12', 1]] },
    { id: 'cfa_12_solo', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 's',
      name: 'Chick-fil-A \u2014 12 ct grilled nuggets',
      parts: [['ro_cfa_grill12', 1]] },

    // Costa Vida
    { id: 'cv_dbl_chk_salad', spot: 'Costa Vida \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Costa Vida \u2014 Double chicken salad: no tortilla, rice or beans; pico, light dressing',
      parts: [['ro_mx_chicken', 2], ['ro_mx_greens', 1], ['ro_mx_pico', 1], ['ro_mx_dressing_lt', 1]] },
    { id: 'cv_chk_salad', spot: 'Costa Vida \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Costa Vida \u2014 Chicken salad: no tortilla or rice, half black beans, pico, light dressing',
      parts: [['ro_mx_chicken', 1], ['ro_mx_greens', 1], ['ro_mx_black_beans', 1], ['ro_mx_pico', 1], ['ro_mx_dressing_lt', 1]] },
    { id: 'cv_steak_chk_salad', spot: 'Costa Vida \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Costa Vida \u2014 Steak & chicken salad, no tortilla or rice, pico',
      parts: [['ro_mx_chicken', 1], ['ro_mx_steak', 1], ['ro_mx_greens', 1], ['ro_mx_pico', 1]] },
    { id: 'cv_2_chk_tacos', spot: 'Costa Vida \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Costa Vida \u2014 2 chicken tacos on corn, cabbage & pico',
      parts: [['ro_mx_chicken', 1], ['ro_mx_corn_tort', 2], ['ro_mx_cabbage', 1], ['ro_mx_pico', 1]] },

    // Cafe Rio
    { id: 'cr_dbl_chk_salad', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Rio \u2014 Double grilled chicken salad: no tortilla, rice or beans; pico, light dressing',
      parts: [['ro_mx_chicken', 2], ['ro_mx_greens', 1], ['ro_mx_pico', 1], ['ro_mx_dressing_lt', 1]] },
    { id: 'cr_steak_salad', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Rio \u2014 Steak salad: no tortilla or rice, half black beans, pico',
      parts: [['ro_mx_steak', 1.5], ['ro_mx_greens', 1], ['ro_mx_black_beans', 1], ['ro_mx_pico', 1]] },
    { id: 'cr_chk_salad_cheese', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Rio \u2014 Grilled chicken salad, no tortilla or rice, cheese, pico',
      parts: [['ro_mx_chicken', 1.5], ['ro_mx_greens', 1], ['ro_mx_cheese', 1], ['ro_mx_pico', 1]] },
    { id: 'cr_3_chk_tacos', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Rio \u2014 3 grilled chicken street tacos',
      parts: [['ro_mx_chicken', 1.5], ['ro_mx_corn_tort', 3], ['ro_mx_cabbage', 1], ['ro_mx_pico', 1]] },

    // Chipotle
    { id: 'cp_dbl_chk_salad', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Double chicken salad: supergreens, fajita veggies, salsa',
      parts: [['ro_cp_chicken', 2], ['ro_cp_supergreens', 1], ['ro_cp_fajita', 1], ['ro_cp_pico', 1]] },
    { id: 'cp_dbl_chk_bowl_beans', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Double chicken bowl, no rice: black beans, fajitas, salsa, lettuce',
      parts: [['ro_cp_chicken', 2], ['ro_cp_black_beans', 1], ['ro_cp_fajita', 1], ['ro_cp_pico', 1], ['ro_cp_supergreens', 0.5]] },
    { id: 'cp_chk_steak_bowl', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Chicken & steak bowl, no rice: fajitas, green salsa, lettuce',
      parts: [['ro_cp_chicken', 1], ['ro_cp_steak', 1], ['ro_cp_fajita', 1], ['ro_cp_green_salsa', 1], ['ro_cp_supergreens', 1]] },
    { id: 'cp_dbl_steak_salad', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Double steak salad: supergreens, fajitas, salsa',
      parts: [['ro_cp_steak', 2], ['ro_cp_supergreens', 1], ['ro_cp_fajita', 1], ['ro_cp_pico', 1]] },
    { id: 'cp_barbacoa_chk', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Barbacoa & chicken salad, cheese, salsa',
      parts: [['ro_cp_barbacoa', 1], ['ro_cp_chicken', 1], ['ro_cp_supergreens', 1], ['ro_cp_cheese', 1], ['ro_cp_pico', 1]] },
    { id: 'cp_chk_bowl_rice', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Double chicken bowl with half rice, fajitas, salsa',
      parts: [['ro_cp_chicken', 2], ['ro_cp_rice', 0.5], ['ro_cp_fajita', 1], ['ro_cp_pico', 1]] },

    // Panda Express
    { id: 'pd_dbl_teri_greens', spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Panda Express \u2014 Double grilled teriyaki chicken + Super Greens (sauce on the side)',
      parts: [['ro_pd_teri_chk', 2], ['ro_pd_supergreens', 1]] },
    { id: 'pd_teri_angus', spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Panda Express \u2014 Grilled teriyaki chicken + Black Pepper Angus Steak + Super Greens',
      parts: [['ro_pd_teri_chk', 1], ['ro_pd_angus', 1], ['ro_pd_supergreens', 1]] },
    { id: 'pd_teri_greens', spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Panda Express \u2014 Grilled teriyaki chicken + Super Greens',
      parts: [['ro_pd_teri_chk', 1], ['ro_pd_supergreens', 1]] },
    { id: 'pd_teri_broc', spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Panda Express \u2014 Teriyaki chicken + Broccoli Beef + Super Greens',
      parts: [['ro_pd_teri_chk', 1], ['ro_pd_broc_beef', 1], ['ro_pd_supergreens', 1]] },

    // Cafe Zupas
    { id: 'zp_salad_2chk', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Zupas \u2014 Entr\u00e9e salad, light dressing, double grilled chicken',
      parts: [['ro_zp_salad_lt', 1], ['ro_zp_chk', 2]] },
    { id: 'zp_bowl_2chk', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Zupas \u2014 Protein bowl, double grilled chicken',
      parts: [['ro_zp_protein_bowl', 1], ['ro_zp_chk', 2]] },
    { id: 'zp_salad_chili', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Zupas \u2014 Entr\u00e9e salad with chicken + cup chicken enchilada chili',
      parts: [['ro_zp_salad_lt', 1], ['ro_zp_chk', 1], ['ro_zp_chk_soup', 1]] },

    // R&R BBQ
    { id: 'rr_dbl_turkey', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'R&R BBQ \u2014 Two-meat plate: double smoked turkey, green beans, side salad',
      parts: [['ro_rr_turkey', 2], ['ro_rr_green_beans', 1], ['ro_rr_side_salad', 1]] },
    { id: 'rr_turkey_brisket', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'R&R BBQ \u2014 Smoked turkey & brisket, green beans',
      parts: [['ro_rr_turkey', 1], ['ro_rr_brisket', 1], ['ro_rr_green_beans', 1]] },
    { id: 'rr_turkey_pork', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'R&R BBQ \u2014 Smoked turkey & pulled pork, side salad',
      parts: [['ro_rr_turkey', 1], ['ro_rr_pulled_pork', 1], ['ro_rr_side_salad', 1]] },
    { id: 'rr_half_chicken', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'd', est: true,
      name: 'R&R BBQ \u2014 Smoked half chicken, skin off, green beans',
      parts: [['ro_rr_chicken', 1], ['ro_rr_green_beans', 1]] },
    { id: 'rr_turkey_salad', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'R&R BBQ \u2014 Smoked turkey (1/3 lb) + side salad + green beans',
      parts: [['ro_rr_turkey', 1], ['ro_rr_side_salad', 1], ['ro_rr_green_beans', 1]] },

    // Kneaders
    { id: 'kn_tba_salad', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Kneaders \u2014 Turkey bacon avocado salad, no croutons, dressing on the side',
      parts: [['ro_kn_tba_salad', 1]] },
    { id: 'kn_caesar', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Kneaders \u2014 Chicken Caesar salad, no croutons, half dressing',
      parts: [['ro_kn_caesar_chk', 1]] },
    { id: 'kn_caesar_xtra', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Kneaders \u2014 Chicken Caesar salad, extra chicken, half dressing',
      parts: [['ro_kn_caesar_chk', 1], ['ro_kn_extra_meat', 1]] },
    { id: 'kn_tba_xtra', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Kneaders \u2014 Turkey bacon avocado salad, extra turkey',
      parts: [['ro_kn_tba_salad', 1], ['ro_kn_extra_meat', 1]] },

    // Jersey Mike\u2019s
    { id: 'jm_7_tub_xtra', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jersey Mike\u2019s \u2014 #7 Turkey & Provolone in a Tub, extra meat',
      parts: [['ro_jm_7_tub', 1], ['ro_jm_extra_meat', 1]] },
    { id: 'jm_16_tub', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jersey Mike\u2019s \u2014 #16 Chicken Philly in a Tub',
      parts: [['ro_jm_16_tub', 1]] },
    { id: 'jm_7_tub', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jersey Mike\u2019s \u2014 #7 Turkey & Provolone in a Tub',
      parts: [['ro_jm_7_tub', 1]] },
    { id: 'jm_17_tub', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jersey Mike\u2019s \u2014 #17 Mike\u2019s Famous Philly in a Tub',
      parts: [['ro_jm_17_tub', 1]] },

    // Mo\u2019 Bettahs
    { id: 'mb_teri_cabbage', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Mo\u2019 Bettahs \u2014 Regular teriyaki chicken, all cabbage (no rice or mac), sauce on the side',
      parts: [['ro_mb_teri_chk', 1], ['ro_mb_cabbage', 2]] },
    { id: 'mb_kalua_chk_cabbage', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Mo\u2019 Bettahs \u2014 Kalua pork & teriyaki chicken, all cabbage (fattier)',
      parts: [['ro_mb_teri_chk', 0.6], ['ro_mb_kalua', 0.6], ['ro_mb_cabbage', 2]] },
    { id: 'mb_teri_half_rice', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Mo\u2019 Bettahs \u2014 Regular teriyaki chicken, half rice, cabbage',
      parts: [['ro_mb_teri_chk', 1], ['ro_mb_rice_scoop', 0.5], ['ro_mb_cabbage', 1]] },

    // Culver\u2019s
    { id: 'cv2_fresco_dbl', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Culver\u2019s \u2014 Garden Fresco salad, double grilled chicken, light dressing',
      parts: [['ro_cv_fresco_base', 1], ['ro_cv_grill_chk', 2]] },
    { id: 'cv2_fresco', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Culver\u2019s \u2014 Garden Fresco salad with grilled chicken, light dressing',
      parts: [['ro_cv_fresco_base', 1], ['ro_cv_grill_chk', 1]] },
    { id: 'cv2_grill_nobun', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Culver\u2019s \u2014 Grilled chicken, no bun + side salad',
      parts: [['ro_cv_grill_chk', 1], ['ro_side_salad', 1]] },

    // In-N-Out
    { id: 'in_dd_ps', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'In-N-Out \u2014 Double-Double Protein Style, mustard & ketchup (fattier)',
      parts: [['ro_in_dbl_ps', 1]] },
    { id: 'in_3x3_ps', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 'd', est: true,
      name: 'In-N-Out \u2014 3\u00d73 Protein Style, mustard & ketchup (fattier)',
      parts: [['ro_in_dbl_ps', 1], ['ro_in_patty_cheese', 1]] },
    { id: 'in_fd', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 's', est: true,
      name: 'In-N-Out \u2014 Flying Dutchman (fattier)',
      parts: [['ro_in_flying_d', 1]] },

    // Sonic Drive-In
    { id: 'sn_dbl_lw', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Sonic Drive-In \u2014 Double cheeseburger, lettuce-wrapped, no sauce (fattier)',
      parts: [['ro_sn_dbl_lw', 1]] },
    { id: 'sn_grill_nobun', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Sonic Drive-In \u2014 Grilled chicken sandwich, no bun',
      parts: [['ro_sn_grill_chk', 1], ['ro_lettuce_wrap', 1]] },

    // Jimmy John\u2019s
    { id: 'jj_4_unwich_xtra', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jimmy John\u2019s \u2014 #4 Turkey Tom Unwich, extra turkey, no mayo',
      parts: [['ro_jj_4_unwich', 1], ['ro_jj_extra_meat', 1]] },
    { id: 'jj_12_unwich', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jimmy John\u2019s \u2014 #12 Beach Club Unwich, no mayo',
      parts: [['ro_jj_12_unwich', 1]] },
    { id: 'jj_10_unwich', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jimmy John\u2019s \u2014 #10 Hunter\u2019s Club Unwich, no mayo',
      parts: [['ro_jj_10_unwich', 1]] },
    { id: 'jj_4_unwich', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'lds', est: true,
      name: 'Jimmy John\u2019s \u2014 #4 Turkey Tom Unwich, no mayo',
      parts: [['ro_jj_4_unwich', 1]] },

    // Teriyaki Grill
    { id: 'tg_teri_veg', spot: 'Teriyaki Grill \u00b7 Spanish Fork (confirm)', meals: 'ld', est: true,
      name: 'Teriyaki Grill \u2014 Teriyaki chicken, steamed vegetables instead of rice, sauce on the side',
      parts: [['ro_tg_teri_chk', 1], ['ro_tg_steam_veg', 1]] },
    { id: 'tg_dbl_teri_veg', spot: 'Teriyaki Grill \u00b7 Spanish Fork (confirm)', meals: 'ld', est: true,
      name: 'Teriyaki Grill \u2014 Double teriyaki chicken, steamed vegetables, no rice',
      parts: [['ro_tg_teri_chk', 2], ['ro_tg_steam_veg', 1]] },

    // Cupbop
    { id: 'cb_chk_cabbage', spot: 'Cupbop \u00b7 Spanish Fork (confirm)', meals: 'ld', est: true,
      name: 'Cupbop \u2014 BBQ chicken, all cabbage & sprouts, no rice or noodles',
      parts: [['ro_cb_bbq_chk', 1], ['ro_cb_cabbage', 1.5]] },
    { id: 'cb_dbl_chk_cabbage', spot: 'Cupbop \u00b7 Spanish Fork (confirm)', meals: 'ld', est: true,
      name: 'Cupbop \u2014 Double BBQ chicken, all cabbage, no rice',
      parts: [['ro_cb_bbq_chk', 2], ['ro_cb_cabbage', 1.5]] },

    // Burger King
    { id: 'bk_dbl_whopper_nobun', spot: 'Burger King \u00b7 Spanish Fork (confirm)', meals: 'ld', est: true,
      name: 'Burger King \u2014 Double Whopper, no bun, no mayo (fattier)',
      parts: [['ro_bk_whopper_pt', 2], ['ro_lettuce_wrap', 1]] },
    { id: 'bk_croiss_egg_xtra', spot: 'Burger King \u00b7 Spanish Fork (confirm)', meals: 'b',
      name: 'Burger King \u2014 Bacon, Egg & Cheese Croissan\u2019wich + extra round egg',
      parts: [['ro_bk_croiss_egg', 1], ['ro_mc_round_egg', 1]] },

    // Additional Breakfast, Lunch & Dinner Combos across top chains
    { id: 'mc_sausage_mcm_egg', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'McDonald\u2019s \u2014 Sausage McMuffin with Egg + extra round egg',
      parts: [['ro_mc_sausage_mcm', 1], ['ro_mc_round_egg', 1]] },
    { id: 'mc_strips_apples', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'lds', est: true,
      name: 'McDonald\u2019s \u2014 4 pc McCrispy Strips + apple slices',
      parts: [['ro_mc_mccrispy_strips', 1], ['ro_mc_apple_slices', 1]] },
    { id: 'mc_2mcdouble_nobun', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'McDonald\u2019s \u2014 Two McDoubles, no buns (4 patties, 2 cheese, lettuce wrap)',
      parts: [['ro_mc_mcdouble_nobun', 2]] },
    { id: 'cfa_eggwhite_nug8', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'b',
      name: 'Chick-fil-A \u2014 Egg White Grill + 8 ct Grilled Nuggets',
      parts: [['ro_cfa_egg_white', 1], ['ro_cfa_grill8', 1]] },
    { id: 'cfa_scramble_fruit', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'b',
      name: 'Chick-fil-A \u2014 Hash Brown Scramble Bowl (Grilled Chicken) + fruit cup',
      parts: [['ro_cfa_scramble_bowl', 1], ['ro_cfa_fruit', 1]] },
    { id: 'cfa_grill_sand_soup', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chick-fil-A \u2014 Grilled Chicken Sandwich + Chicken Noodle Soup (cup)',
      parts: [['ro_cfa_grill_sand', 1], ['ro_cfa_chk_soup', 1]] },
    { id: 'cfa_sw_salad_nug8', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chick-fil-A \u2014 Spicy Southwest Salad with Grilled Chicken + 8 ct Grilled Nuggets',
      parts: [['ro_cfa_sw_salad', 1], ['ro_cfa_grill8', 1]] },
    { id: 'wd_bfast_bacon_egg', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'Wendy\u2019s \u2014 Classic Bacon, Egg & Cheese Sandwich + 2 hard-boiled eggs',
      parts: [['ro_wd_bfast_bacon', 1], ['ro_hb_egg2', 1]] },
    { id: 'wd_wrap_chili', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Grilled Chicken Ranch Wrap + small chili',
      parts: [['ro_wd_grill_wrap', 1], ['ro_wd_chili_sm', 1]] },
    { id: 'wd_apple_pecan_chk', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Wendy\u2019s \u2014 Apple Pecan Salad with Grilled Chicken, half dressing',
      parts: [['ro_wd_apple_pecan', 1]] },
    { id: 'ab_turkey_farm_rb', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Arby\u2019s \u2014 Roast Turkey Farmhouse Salad + extra 3 oz roast beef',
      parts: [['ro_ab_turkey_farm', 1], ['ro_ab_roast_beef', 1]] },
    { id: 'ab_turkey_gyro', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Arby\u2019s \u2014 Roast Turkey Gyro',
      parts: [['ro_ab_gyro_turkey', 1]] },
    { id: 'kfc_nug12_mash_beans', spot: 'KFC \u00b7 Spanish Fork', meals: 'ld',
      name: 'KFC \u2014 12 pc Secret Recipe Nuggets + mashed potatoes with gravy + green beans',
      parts: [['ro_kfc_nug12', 1], ['ro_kfc_mashed_gravy', 1], ['ro_kfc_grn_beans', 1]] },
    { id: 'kfc_breast_corn_beans', spot: 'KFC \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'KFC \u2014 Peeled Original Recipe chicken breast + sweet corn + green beans',
      parts: [['ro_kfc_or_peeled', 1], ['ro_kfc_corn', 1], ['ro_kfc_grn_beans', 1]] },
    { id: 'dq_grill_sand_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 Grilled Chicken Sandwich + side salad',
      parts: [['ro_dq_grill_sand', 1], ['ro_dq_side_salad', 1]] },
    { id: 'dq_strips_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Dairy Queen \u2014 3 pc Chicken Strips (no toast/fries) + side salad',
      parts: [['ro_dq_strips3', 1], ['ro_dq_side_salad', 1]] },
    { id: 'cv_sweetpork_chk_salad', spot: 'Costa Vida \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Costa Vida \u2014 Half sweet pork & half grilled chicken salad, no shell, black beans, pico',
      parts: [['ro_mx_sweet_pork', 1], ['ro_mx_chicken', 1], ['ro_mx_greens', 1], ['ro_mx_black_beans', 1], ['ro_mx_pico', 1]] },
    { id: 'cr_sweetpork_chk_salad', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Rio \u2014 Half sweet pork & half grilled chicken salad, no shell, black beans, pico',
      parts: [['ro_mx_sweet_pork', 1], ['ro_mx_chicken', 1], ['ro_mx_greens', 1], ['ro_mx_black_beans', 1], ['ro_mx_pico', 1]] },
    { id: 'cp_chk_steak_guac', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Half chicken & half steak salad bowl, fajita veggies, black beans, pico, guac',
      parts: [['ro_cp_chicken', 1], ['ro_cp_steak', 1], ['ro_cp_supergreens', 1], ['ro_cp_fajita', 1], ['ro_cp_black_beans', 1], ['ro_cp_pico', 1], ['ro_cp_guac', 0.5]] },
    { id: 'sw_bfast_steak_egg6', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'b', est: true,
      name: 'Subway \u2014 6-inch Steak, Egg & Cheese on multigrain (spinach, tomato, onion)',
      parts: [['ro_sw_steak', 1], ['ro_sw_egg_patty', 1], ['ro_sw_provolone', 1], ['ro_sw_bread6', 1], ['ro_sw_veg', 1]] },
    { id: 'sw_rot_chk_bowl2', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Subway \u2014 Rotisserie-Style Chicken Protein Bowl, double meat (all veggies, vinegar)',
      parts: [['ro_sw_rot_chk', 2], ['ro_sw_veg', 1]] },
    { id: 'tb_bfast_2tacos', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'b',
      name: 'Taco Bell \u2014 2 Breakfast Soft Tacos (Egg, Cheese & Bacon)',
      parts: [['ro_tb_bfast_taco', 2]] },
    { id: 'tb_steak_tacos_beans', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Bell \u2014 2 Grilled Steak Soft Tacos (Fresco Style) + black beans',
      parts: [['ro_tb_steak_taco', 2], ['ro_tb_black_beans', 1]] },
    { id: 'tt_2crisp_chk_beans', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld', est: true,
      name: 'Taco Time \u2014 2 Crisp Chicken Tacos + refried pinto beans',
      parts: [['ro_tt_crisp_chk', 2], ['ro_tt_pinto', 1]] },
    { id: 'pd_teri_half_rice_greens', spot: 'Panda Express \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Panda Express \u2014 Bowl: Grilled Teriyaki Chicken + half white rice & half Super Greens',
      parts: [['ro_pd_teri_chk', 1], ['ro_pd_white_rice', 1], ['ro_pd_supergreens', 0.5]] },
    { id: 'zp_berries_cauli_try2', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Cafe Zupas \u2014 Nuts About Berries Grilled Chicken Salad + cup Wisconsin Cauliflower Soup',
      parts: [['ro_zp_berries_chk', 1], ['ro_zp_cauli_soup', 1]] },
    { id: 'kn_bfast_croiss_fruit', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'b', est: true,
      name: 'Kneaders \u2014 Breakfast Croissant Sandwich (Egg, Turkey Bacon & Cheese) + fruit cup',
      parts: [['ro_kn_bfast_croiss', 1], ['ro_fruit_cup', 1]] },
    { id: 'jm_8_club_tub', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jersey Mike\u2019s \u2014 #8 Club Sub in a Tub (Turkey, Ham, Provolone, Bacon, no oil)',
      parts: [['ro_jm_8_tub', 1]] },
    { id: 'jj_9_unwich', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Jimmy John\u2019s \u2014 #9 Italian Night Club Unwich, no mayo',
      parts: [['ro_jj_9_unwich', 1]] },
    { id: 'sn_bfast_burrito', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'b', est: true,
      name: 'Sonic Drive-In \u2014 SuperSONIC Breakfast Burrito',
      parts: [['ro_sn_bfast_burr', 1]] }
  ];

  function mEatoutCatalog() {
    return { parts: MEATOUT_PARTS, combos: MEATOUT_COMBOS };
  }

  return { mShelfKey: mShelfKey, MSHELF: MSHELF, mEatoutCatalog: mEatoutCatalog };
};
