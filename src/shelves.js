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

  /* Price & Spanish Fork, UT restaurant Smart Orders and their reusable
     building-block parts. Each combo's macros are summed from its parts in
     mBuildFoods so the combo row and Explode into foods never disagree by
     even a calorie. Chains use published nutrition; local spots carry est. */
  var MEATOUT_PARTS = {
    // Mexican / Bowls (Costa Vida, Cafe Rio, Chipotle, Los Jilbertos)
    ro_romaine_base:    { name: 'Romaine & Fajita Greens Base', unit: 'bowl', grams: 140, p: 2, c: 6, f: 0.5, na: 35, fib: 3 },
    ro_sweet_pork:      { name: 'Shredded Sweet Pork', unit: 'portion', grams: 140, p: 32, c: 22, f: 10, na: 680, fib: 0 },
    ro_grill_chk_mex:   { name: 'Fire-Grilled Mexican Chicken', unit: 'portion', grams: 130, p: 36, c: 2, f: 4.5, na: 520, fib: 0 },
    ro_grill_steak_mex: { name: 'Fire-Grilled Carne Asada / Steak', unit: 'portion', grams: 130, p: 34, c: 2, f: 7, na: 540, fib: 0 },
    ro_machaca_beef:    { name: 'Shredded Machaca Beef', unit: 'portion', grams: 130, p: 31, c: 3, f: 9, na: 610, fib: 0, est: true },
    ro_black_beans:     { name: 'Seasoned Black Beans', unit: 'cup', grams: 130, p: 8, c: 22, f: 1, na: 360, fib: 6 },
    ro_pinto_beans:     { name: 'Whole Pinto Beans', unit: 'cup', grams: 130, p: 8, c: 23, f: 1.5, na: 380, fib: 6 },
    ro_cilantro_rice:   { name: 'Cilantro Lime White Rice', unit: 'cup', grams: 140, p: 4, c: 40, f: 3, na: 340, fib: 1 },
    ro_spanish_rice:    { name: 'Spanish Red Rice', unit: 'cup', grams: 140, p: 4, c: 42, f: 3.5, na: 420, fib: 1.5, est: true },
    ro_fajita_veggies:  { name: 'Grilled Fajita Peppers & Onions', unit: 'cup', grams: 90, p: 1, c: 5, f: 1, na: 190, fib: 1.5 },
    ro_pico_salsa:      { name: 'Fresh Pico de Gallo & Tomatillo Salsa', unit: 'cup', grams: 85, p: 1, c: 5, f: 0, na: 260, fib: 1 },
    ro_tomatillo_dr:    { name: 'Creamy Tomatillo Ranch Dressing', unit: 'tbsp', grams: 30, p: 1, c: 2, f: 8, na: 210, fib: 0 },
    ro_corn_tortilla:   { name: 'Warm Corn Taco Tortilla', unit: 'tortilla', grams: 28, p: 1.5, c: 12, f: 0.8, na: 15, fib: 1.5 },
    ro_cabbage_slaw:    { name: 'Shredded Cabbage & Lime Slaw', unit: 'cup', grams: 70, p: 1, c: 4, f: 1, na: 90, fib: 1.5 },

    // Fast-Casual Protein (Teriyaki Grill, R&R BBQ, Cafe Zupas, Panda Express)
    ro_teriyaki_chk:    { name: 'Charbroiled Teriyaki Chicken Breast', unit: 'portion', grams: 150, p: 38, c: 6, f: 4.5, na: 590, fib: 0 },
    ro_teriyaki_steak:  { name: 'Grilled Teriyaki Sirloin Steak', unit: 'portion', grams: 130, p: 32, c: 7, f: 7, na: 620, fib: 0 },
    ro_teriyaki_salmon: { name: 'Grilled Teriyaki Salmon Fillet', unit: 'piece', grams: 150, p: 34, c: 5, f: 14, na: 510, fib: 0 },
    ro_steamed_veggies: { name: 'Steamed Broccoli, Carrots & Cabbage', unit: 'cup', grams: 150, p: 3, c: 10, f: 0.5, na: 120, fib: 4 },
    ro_super_greens:    { name: 'Garlicky Super Greens (Broccoli, Kale, Cabbage)', unit: 'cup', grams: 160, p: 6, c: 10, f: 3, na: 260, fib: 5 },
    ro_brown_rice:      { name: 'Steamed Brown Rice', unit: 'cup', grams: 165, p: 5, c: 44, f: 1.8, na: 15, fib: 3.5 },
    ro_white_rice:      { name: 'Steamed White Rice', unit: 'cup', grams: 165, p: 4.5, c: 45, f: 0.5, na: 10, fib: 1 },
    ro_teriyaki_glaze:  { name: 'Teriyaki Sauce Glaze', unit: 'tbsp', grams: 20, p: 0.5, c: 8, f: 0, na: 310, fib: 0 },
    ro_smoked_turkey:   { name: 'Pit-Smoked Turkey Breast', unit: 'portion', grams: 140, p: 36, c: 1, f: 3.5, na: 680, fib: 0 },
    ro_pulled_pork:     { name: 'Hickory Pulled Pork', unit: 'portion', grams: 115, p: 26, c: 3, f: 11, na: 590, fib: 0 },
    ro_lean_brisket:    { name: 'Lean Sliced Smoked Beef Brisket', unit: 'portion', grams: 120, p: 31, c: 2, f: 12, na: 540, fib: 0 },
    ro_bbq_green_beans: { name: 'Slow-Cooked Savory Green Beans', unit: 'cup', grams: 135, p: 2, c: 8, f: 2, na: 380, fib: 3 },
    ro_red_beans_rice:  { name: 'BBQ Red Beans & Rice', unit: 'cup', grams: 160, p: 7, c: 34, f: 3.5, na: 520, fib: 5 },
    ro_quinoa_cauli:    { name: 'Roasted Cauliflower & Quinoa Base', unit: 'bowl', grams: 180, p: 6, c: 27, f: 4, na: 280, fib: 5 },
    ro_zupas_chk:       { name: 'Herb-Grilled Chicken Breast Strips', unit: 'portion', grams: 115, p: 31, c: 1, f: 3.5, na: 430, fib: 0 },
    ro_chimichurri:     { name: 'Light Herb Chimichurri Vinaigrette', unit: 'tbsp', grams: 25, p: 0, c: 2, f: 6, na: 160, fib: 0 },
    ro_chickpea_soup:   { name: 'Cup Chickpea & Vegetable Soup', unit: 'cup', grams: 240, p: 8, c: 26, f: 4, na: 640, fib: 5 },
    ro_turkey_avo_half: { name: 'Half Turkey Bacon Avocado Sandwich', unit: 'piece', grams: 165, p: 24, c: 34, f: 11, na: 690, fib: 3 },
    ro_protein_broth:   { name: 'High-Protein Chicken & Quinoa Broth Bowl', unit: 'bowl', grams: 320, p: 26, c: 32, f: 7, na: 780, fib: 4 },
    ro_panda_broc_beef: { name: 'Broccoli Beef Entree', unit: 'portion', grams: 155, p: 9, c: 13, f: 7, na: 520, fib: 2 },
    ro_panda_str_chk:   { name: 'String Bean Chicken Breast Entree', unit: 'portion', grams: 155, p: 14, c: 13, f: 12, na: 590, fib: 2 },
    ro_panda_mush_chk:  { name: 'Mushroom Chicken Entree', unit: 'portion', grams: 165, p: 13, c: 10, f: 14, na: 840, fib: 1.5 },

    // Burgers, Chicken & Sandwiches (Chick-fil-A, Culver's, In-N-Out, Wendy's, Arby's)
    ro_cfa_12nug:       { name: '12ct Grilled Chicken Nuggets', unit: 'portion', grams: 135, p: 38, c: 2, f: 4.5, na: 660, fib: 0 },
    ro_cfa_8nug:        { name: '8ct Grilled Chicken Nuggets', unit: 'portion', grams: 90, p: 25, c: 1, f: 3, na: 440, fib: 0 },
    ro_cfa_kale:        { name: 'Kale Crunch Side Salad', unit: 'cup', grams: 85, p: 4, c: 13, f: 9, na: 180, fib: 3 },
    ro_fruit_cup:       { name: 'Fresh Mixed Fruit Cup', unit: 'cup', grams: 125, p: 1, c: 16, f: 0, na: 5, fib: 2 },
    ro_cfa_grill_sand:  { name: 'Grilled Chicken Multigrain Sandwich', unit: 'piece', grams: 205, p: 28, c: 44, f: 12, na: 770, fib: 3 },
    ro_cfa_egg_white:   { name: 'Egg White Grill English Muffin', unit: 'piece', grams: 172, p: 27, c: 29, f: 8, na: 970, fib: 1 },
    ro_cu_grill_sand:   { name: 'Grilled Chicken Breast Sandwich (No Mayo)', unit: 'piece', grams: 200, p: 41, c: 40, f: 6, na: 690, fib: 2 },
    ro_cu_mash_gravy:   { name: 'Mashed Potatoes & Savory Gravy', unit: 'cup', grams: 150, p: 3, c: 23, f: 4, na: 520, fib: 2 },
    ro_beef_patty:      { name: 'Seared Beef Burger Patty', unit: 'patty', grams: 65, p: 16, c: 0, f: 11, na: 220, fib: 0 },
    ro_am_cheese:       { name: 'Slice Melted American / Provolone Cheese', unit: 'slice', grams: 20, p: 4, c: 1, f: 6, na: 260, fib: 0 },
    ro_burger_bun:      { name: 'Toasted Burger Bun', unit: 'piece', grams: 72, p: 6, c: 37, f: 3.5, na: 310, fib: 1.5 },
    ro_lettuce_tom_oni: { name: 'Lettuce Wrap, Tomato, Pickles & Grilled Onion', unit: 'serving', grams: 95, p: 1.5, c: 7, f: 0, na: 140, fib: 1.5 },
    ro_wendys_chili_lg: { name: 'Large Rich & Meaty Beef & Bean Chili', unit: 'bowl', grams: 340, p: 29, c: 31, f: 11, na: 1120, fib: 7 },
    ro_wendys_chili_sm: { name: 'Small Rich & Meaty Beef & Bean Chili', unit: 'cup', grams: 227, p: 19, c: 21, f: 7, na: 750, fib: 5 },
    ro_baked_potato:    { name: 'Plain Oven-Baked Russet Potato', unit: 'whole', grams: 280, p: 7, c: 61, f: 0.5, na: 25, fib: 6 },
    ro_arby_roast_beef: { name: 'Thinly Sliced Roast Beef (3 oz)', unit: 'portion', grams: 85, p: 18, c: 1, f: 7, na: 480, fib: 0 },
    ro_side_salad_lite: { name: 'Fresh Garden Side Salad (Light Vinaigrette)', unit: 'bowl', grams: 145, p: 3, c: 11, f: 4.5, na: 290, fib: 3 },

    // Subs & Quick Stops (Jersey Mike's, Subway, Kneaders, Maverik)
    ro_deli_turkey:     { name: 'Sliced Oven-Roasted Deli Turkey Breast', unit: 'portion', grams: 115, p: 25, c: 2, f: 2, na: 640, fib: 0 },
    ro_deli_ham:        { name: 'Lean Sliced Deli Ham', unit: 'portion', grams: 85, p: 16, c: 2, f: 3.5, na: 690, fib: 0 },
    ro_sub_wheat_roll:  { name: '6-Inch Multigrain / Wheat Sub Roll', unit: 'piece', grams: 105, p: 9, c: 44, f: 3, na: 410, fib: 4 },
    ro_sub_veggies_vin: { name: 'Shredded Lettuce, Spinach, Tomatoes, Peppers & Red Wine Vinegar', unit: 'serving', grams: 130, p: 2, c: 8, f: 0.5, na: 120, fib: 2.5 },
    ro_olive_oil_lite:  { name: 'Light Olive Oil Blend Drizzle', unit: 'tsp', grams: 7, p: 0, c: 0, f: 7, na: 0, fib: 0 },
    ro_avocado_slices:  { name: 'Fresh Sliced Avocado', unit: 'portion', grams: 60, p: 1.5, c: 5, f: 9, na: 10, fib: 4 },
    ro_bacon_strips:    { name: '2 Crisp Smoked Bacon Strips', unit: 'serving', grams: 22, p: 6, c: 0.5, f: 7, na: 290, fib: 0 },
    ro_chk_noodle_cup:  { name: 'Cup Homestyle Chicken Noodle Soup', unit: 'cup', grams: 240, p: 12, c: 22, f: 4, na: 680, fib: 2 },
    ro_focaccia_half:   { name: 'Half Rosemary Focaccia Roll with Cranberry Spread', unit: 'piece', grams: 95, p: 7, c: 38, f: 5, na: 390, fib: 2 },
    ro_core_power_42:   { name: 'Fairlife Core Power Elite 42g Protein Shake', unit: 'bottle', grams: 414, p: 42, c: 8, f: 3.5, na: 260, fib: 1 },
    ro_fairlife_30:     { name: 'Fairlife Nutrition Plan 30g Protein Shake', unit: 'bottle', grams: 340, p: 30, c: 4, f: 2.5, na: 230, fib: 0 },
    ro_hard_boiled_2:   { name: '2 Peeled Hard-Boiled Eggs', unit: 'serving', grams: 100, p: 12, c: 1, f: 10, na: 125, fib: 0 },
    ro_beef_jerky_3oz:  { name: '3 oz Bag Lean Steak Beef Jerky', unit: 'bag', grams: 85, p: 30, c: 9, f: 3, na: 1380, fib: 0 },
    ro_zero_greek_yog:  { name: 'Zero Sugar Greek Yogurt Cup', unit: 'cup', grams: 150, p: 12, c: 5, f: 0, na: 65, fib: 0 },
    ro_fresh_fruit_pc:  { name: 'Fresh Whole Apple or Banana', unit: 'whole', grams: 150, p: 1, c: 25, f: 0.5, na: 2, fib: 3.5 },

    // Local Price Favorites (Grogg's, Big Don's, JB's, Sherald's, Mandarin Garden)
    ro_top_sirloin_8oz: { name: '8 oz Flame-Broiled Top Sirloin Steak', unit: 'piece', grams: 225, p: 52, c: 0, f: 14, na: 480, fib: 0, est: true },
    ro_thin_chk_slice:  { name: 'Slice Thin-Crust Grilled Chicken & Veggie Pizza', unit: 'slice', grams: 95, p: 14, c: 22, f: 6, na: 460, fib: 1.5, est: true },
    ro_thin_meat_slice: { name: 'Slice Thin-Crust All-Meat & Chicken Pizza', unit: 'slice', grams: 100, p: 16, c: 22, f: 8, na: 540, fib: 1.5, est: true },
    ro_baked_wings_4:   { name: '4 Oven-Roasted Bone-In Chicken Wings', unit: 'portion', grams: 140, p: 26, c: 2, f: 12, na: 580, fib: 0, est: true },
    ro_egg_scrambler:   { name: '3-Egg & Egg-White Veggie Scrambler', unit: 'portion', grams: 185, p: 21, c: 4, f: 10, na: 420, fib: 1, est: true },
    ro_hash_browns:     { name: 'Griddled Shredded Hash Browns', unit: 'cup', grams: 135, p: 4, c: 32, f: 8, na: 360, fib: 3, est: true },
    ro_wheat_toast:     { name: 'Slice Dry Toasted Whole Wheat Bread', unit: 'slice', grams: 38, p: 4, c: 17, f: 1, na: 160, fib: 2.5, est: true },
    ro_small_fries:     { name: 'Small Crinkle-Cut Fries Share', unit: 'portion', grams: 110, p: 4, c: 39, f: 11, na: 380, fib: 3.5, est: true },
    ro_wok_chk_broc:    { name: 'Wok-Seared Chicken & Broccoli (Light Garlic Sauce)', unit: 'bowl', grams: 280, p: 36, c: 16, f: 8, na: 780, fib: 4, est: true },
    ro_wok_beef_broc:   { name: 'Wok-Seared Flank Steak & Broccoli', unit: 'bowl', grams: 260, p: 32, c: 14, f: 10, na: 820, fib: 3.5, est: true },
    ro_wok_shrimp_chk:  { name: 'Steamed Jumbo Shrimp, Chicken & Mixed Vegetables', unit: 'bowl', grams: 290, p: 44, c: 14, f: 5.5, na: 640, fib: 4.5, est: true },

    // McDonald's, KFC, Dairy Queen, Taco Bell, Taco Time, Burger King, Sonic, Mo' Bettahs, Cupbop, Jimmy John's
    ro_egg_mcmuffin:    { name: 'Egg McMuffin (Canadian Bacon, Egg, Cheese, English Muffin)', unit: 'piece', grams: 136, p: 17, c: 30, f: 13, na: 770, fib: 2 },
    ro_qp_beef_patty:   { name: '4 oz Quarter Pounder 100% Beef Patty', unit: 'patty', grams: 85, p: 22, c: 0, f: 18, na: 260, fib: 0 },
    ro_mcdouble_nomayo: { name: 'McDouble Burger (Mustard, Pickles, Onions, No Ketchup)', unit: 'piece', grams: 147, p: 22, c: 28, f: 19, na: 850, fib: 2 },
    ro_apple_slices_bag:{ name: 'Fresh Sliced Apple Bag', unit: 'bag', grams: 40, p: 0, c: 4, f: 0, na: 0, fib: 1 },
    ro_kfc_grill_breast:{ name: 'Kentucky Grilled Chicken Breast', unit: 'piece', grams: 145, p: 38, c: 0, f: 7, na: 520, fib: 0 },
    ro_kfc_grill_drum:  { name: 'Kentucky Grilled Chicken Drumstick', unit: 'piece', grams: 58, p: 11, c: 0, f: 4, na: 180, fib: 0 },
    ro_kfc_sweet_corn:  { name: 'Individual Sweet Kernel Corn', unit: 'cup', grams: 100, p: 2, c: 16, f: 0.5, na: 5, fib: 2 },
    ro_kfc_tenders_5:   { name: '5 Crispy Chicken Breast Tenders', unit: 'portion', grams: 175, p: 51, c: 26, f: 22, na: 1450, fib: 2 },
    ro_dq_rotiss_bites: { name: '6pc Rotisserie-Style Unbreaded Chicken Bites', unit: 'portion', grams: 140, p: 40, c: 5, f: 13, na: 980, fib: 0 },
    ro_flame_whopper_pt:{ name: 'Flame-Broiled 4 oz Whopper Beef Patty', unit: 'patty', grams: 85, p: 24, c: 0, f: 17, na: 230, fib: 0 },
    ro_whopper_jr_lite: { name: 'Whopper Jr. Burger (No Mayo, Mustard, Lettuce, Tomato, Onion)', unit: 'piece', grams: 135, p: 17, c: 28, f: 12, na: 510, fib: 1.5 },
    ro_grill_chk_wrap:  { name: 'Grilled Chicken Tortilla Wrap (Lettuce, Tomato, Light Sauce)', unit: 'piece', grams: 130, p: 21, c: 25, f: 8, na: 590, fib: 2 },
    ro_kalua_pork_lean: { name: 'Hawaiian Slow-Roasted Kalua Pork (Lean Pull)', unit: 'portion', grams: 125, p: 26, c: 1, f: 14, na: 640, fib: 0 },
    ro_korean_bbq_beef: { name: 'Korean Bulgogi BBQ Seared Beef', unit: 'portion', grams: 115, p: 26, c: 9, f: 9, na: 580, fib: 0 }
  };

  var MEATOUT_COMBOS = [
    // 1. Costa Vida (Price & Spanish Fork)
    { id: 'cv_sweet_pork_salad', spot: 'Costa Vida \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Costa Vida \u2014 Sweet Pork Salad (No Shell, Light Dressing)',
      parts: [['ro_romaine_base', 1], ['ro_sweet_pork', 1], ['ro_black_beans', 1], ['ro_pico_salsa', 1], ['ro_tomatillo_dr', 0.5]] },
    { id: 'cv_double_chk_bowl', spot: 'Costa Vida \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Costa Vida \u2014 Double Grilled Chicken Bowl (Black Beans, Rice, Pico)',
      parts: [['ro_grill_chk_mex', 1.5], ['ro_black_beans', 1], ['ro_cilantro_rice', 1], ['ro_romaine_base', 0.5], ['ro_pico_salsa', 1]] },
    { id: 'cv_baja_chk_tacos', spot: 'Costa Vida \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Costa Vida \u2014 2 Grilled Chicken Tacos (Corn Tortillas, Cabbage, Pico)',
      parts: [['ro_grill_chk_mex', 1], ['ro_corn_tortilla', 2], ['ro_cabbage_slaw', 1], ['ro_pico_salsa', 1]] },

    // 2. Cafe Rio (Spanish Fork)
    { id: 'cr_chk_salad_noshell', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Rio \u2014 Fire-Grilled Chicken Salad (No Tortilla, Dressing on Side)',
      parts: [['ro_romaine_base', 1], ['ro_grill_chk_mex', 1], ['ro_black_beans', 1], ['ro_pico_salsa', 1], ['ro_tomatillo_dr', 0.5]] },
    { id: 'cr_pork_chk_bowl', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Rio \u2014 Sweet Pork & Chicken Bowl (Black Beans, Cilantro Rice, Pico)',
      parts: [['ro_sweet_pork', 0.75], ['ro_grill_chk_mex', 0.75], ['ro_black_beans', 1], ['ro_cilantro_rice', 1], ['ro_pico_salsa', 1]] },
    { id: 'cr_steak_salad', spot: 'Cafe Rio \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Rio \u2014 Fire-Grilled Steak Salad (No Shell, Black Beans, Pico)',
      parts: [['ro_romaine_base', 1], ['ro_grill_steak_mex', 1], ['ro_black_beans', 1], ['ro_pico_salsa', 1], ['ro_tomatillo_dr', 0.5]] },

    // 3. Chipotle (Spanish Fork)
    { id: 'ch_dbl_chk_salad', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Double Chicken Salad Bowl (Fajita Veggies, Pico, No Rice)',
      parts: [['ro_romaine_base', 1], ['ro_grill_chk_mex', 2], ['ro_fajita_veggies', 1], ['ro_pico_salsa', 1]] },
    { id: 'ch_chk_steak_bowl', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chipotle \u2014 Chicken & Steak Burrito Bowl (Rice, Black Beans, Fajitas, Pico)',
      parts: [['ro_grill_chk_mex', 0.75], ['ro_grill_steak_mex', 0.75], ['ro_cilantro_rice', 1], ['ro_black_beans', 1], ['ro_fajita_veggies', 1], ['ro_pico_salsa', 1]] },
    { id: 'ch_chk_tacos', spot: 'Chipotle \u00b7 Spanish Fork', meals: 'lds',
      name: 'Chipotle \u2014 3 Grilled Chicken Corn Tacos (Fajita Veggies, Lettuce, Pico)',
      parts: [['ro_grill_chk_mex', 1], ['ro_corn_tortilla', 3], ['ro_fajita_veggies', 1], ['ro_pico_salsa', 1]] },

    // 4. Los Jilbertos (Price)
    { id: 'lj_asada_street_tacos', spot: 'Los Jilbertos \u00b7 Price', meals: 'lds', est: true,
      name: 'Los Jilbertos \u2014 3 Carne Asada Street Tacos (Corn Tortillas, Onion, Cilantro)',
      parts: [['ro_grill_steak_mex', 1.25], ['ro_corn_tortilla', 3], ['ro_pico_salsa', 1]] },
    { id: 'lj_pollo_asado_plato', spot: 'Los Jilbertos \u00b7 Price', meals: 'ld', est: true,
      name: 'Los Jilbertos \u2014 Pollo Asado Plate (Grilled Chicken, Pinto Beans, Rice, Pico)',
      parts: [['ro_grill_chk_mex', 1.25], ['ro_pinto_beans', 1], ['ro_spanish_rice', 1], ['ro_pico_salsa', 1]] },
    { id: 'lj_machaca_egg_bowl', spot: 'Los Jilbertos \u00b7 Price', meals: 'bld', est: true,
      name: 'Los Jilbertos \u2014 Machaca & Egg Breakfast Bowl (No Tortilla, Pinto Beans, Pico)',
      parts: [['ro_machaca_beef', 1], ['ro_hard_boiled_2', 1], ['ro_pinto_beans', 0.5], ['ro_pico_salsa', 1]] },

    // 5. Teriyaki Grill (Spanish Fork)
    { id: 'tg_athletes_choice', spot: 'Teriyaki Grill \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Teriyaki Grill \u2014 Athletes Choice (Double Chicken & Steamed Veggies, No Rice)',
      parts: [['ro_teriyaki_chk', 1.75], ['ro_steamed_veggies', 1.5]] },
    { id: 'tg_chk_steak_bowl', spot: 'Teriyaki Grill \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Teriyaki Grill \u2014 Chicken & Steak Bowl (Brown Rice, Steamed Veggies, Light Sauce)',
      parts: [['ro_teriyaki_chk', 0.75], ['ro_teriyaki_steak', 0.75], ['ro_brown_rice', 1], ['ro_steamed_veggies', 1], ['ro_teriyaki_glaze', 1]] },
    { id: 'tg_salmon_plate', spot: 'Teriyaki Grill \u00b7 Spanish Fork', meals: 'ld', est: true,
      name: 'Teriyaki Grill \u2014 Grilled Salmon & Veggies Plate (Half Brown Rice)',
      parts: [['ro_teriyaki_salmon', 1], ['ro_steamed_veggies', 1.5], ['ro_brown_rice', 0.5], ['ro_teriyaki_glaze', 1]] },

    // 6. R&R BBQ (Spanish Fork)
    { id: 'rr_turkey_pork_plate', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'R&R BBQ \u2014 Smoked Turkey & Pulled Pork Plate (Green Beans, Side Salad)',
      parts: [['ro_smoked_turkey', 1], ['ro_pulled_pork', 0.75], ['ro_bbq_green_beans', 1], ['ro_side_salad_lite', 1]] },
    { id: 'rr_brisket_turkey_combo', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'R&R BBQ \u2014 Lean Brisket & Smoked Turkey (Red Beans & Rice, Green Beans)',
      parts: [['ro_lean_brisket', 1], ['ro_smoked_turkey', 0.75], ['ro_red_beans_rice', 1], ['ro_bbq_green_beans', 1]] },
    { id: 'rr_dbl_turkey_greens', spot: 'R&R BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'R&R BBQ \u2014 Double Smoked Turkey Breast (Double Green Beans, Sauce on Side)',
      parts: [['ro_smoked_turkey', 1.75], ['ro_bbq_green_beans', 2]] },

    // 7. Cafe Zupas (Spanish Fork)
    { id: 'cz_protein_bowl', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Zupas \u2014 Protein Style Bowl (Double Grilled Chicken, Quinoa, Cauliflower)',
      parts: [['ro_zupas_chk', 1.5], ['ro_quinoa_cauli', 1], ['ro_chimichurri', 1]] },
    { id: 'cz_good_life_combo', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Zupas \u2014 Good Life Chicken Salad + Cup Chickpea Vegetable Soup (No Bread)',
      parts: [['ro_romaine_base', 1], ['ro_zupas_chk', 1.25], ['ro_chickpea_soup', 1], ['ro_chimichurri', 1]] },
    { id: 'cz_turkey_avo_combo', spot: 'Cafe Zupas \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cafe Zupas \u2014 Half Turkey Avocado Sandwich + High-Protein Chicken Broth Bowl',
      parts: [['ro_turkey_avo_half', 1], ['ro_protein_broth', 1]] },

    // 8. Panda Express (Price & Spanish Fork)
    { id: 'pe_dbl_teriyaki_greens', spot: 'Panda Express \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Panda Express \u2014 Double Teriyaki Chicken + Super Greens (Sauce on Side)',
      parts: [['ro_teriyaki_chk', 1.75], ['ro_super_greens', 1.5]] },
    { id: 'pe_teriyaki_broc_bowl', spot: 'Panda Express \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Panda Express \u2014 Teriyaki Chicken + Broccoli Beef (Half Rice, Half Super Greens)',
      parts: [['ro_teriyaki_chk', 1], ['ro_panda_broc_beef', 1], ['ro_white_rice', 0.75], ['ro_super_greens', 1]] },
    { id: 'pe_string_bean_mush', spot: 'Panda Express \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Panda Express \u2014 String Bean Chicken + Mushroom Chicken + Super Greens',
      parts: [['ro_panda_str_chk', 1], ['ro_panda_mush_chk', 1], ['ro_super_greens', 1.5]] },

    // 9. Chick-fil-A (Spanish Fork)
    { id: 'cfa_12nug_kale_fruit', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'lds',
      name: 'Chick-fil-A \u2014 12ct Grilled Nuggets + Kale Crunch Side + Fruit Cup',
      parts: [['ro_cfa_12nug', 1], ['ro_cfa_kale', 1], ['ro_fruit_cup', 1]] },
    { id: 'cfa_grill_sand_8nug', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'ld',
      name: 'Chick-fil-A \u2014 Grilled Chicken Sandwich + 8ct Grilled Nuggets + Fruit Cup',
      parts: [['ro_cfa_grill_sand', 1], ['ro_cfa_8nug', 1], ['ro_fruit_cup', 1]] },
    { id: 'cfa_egg_white_8nug', spot: 'Chick-fil-A \u00b7 Spanish Fork', meals: 'bs',
      name: 'Chick-fil-A \u2014 Egg White Grill + 8ct Grilled Nuggets (High-Protein Morning)',
      parts: [['ro_cfa_egg_white', 1], ['ro_cfa_8nug', 1]] },

    // 10. Culver's (Spanish Fork)
    { id: 'cu_grill_chk_broc', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Culver\u2019s \u2014 Grilled Chicken Breast Sandwich + Steamed Broccoli',
      parts: [['ro_cu_grill_sand', 1], ['ro_steamed_veggies', 1]] },
    { id: 'cu_dbl_burger_mash', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Culver\u2019s \u2014 Double ButterBurger (No Mayo) + Mashed Potatoes & Gravy',
      parts: [['ro_beef_patty', 2], ['ro_burger_bun', 1], ['ro_lettuce_tom_oni', 1], ['ro_cu_mash_gravy', 1]] },
    { id: 'cu_fresco_dbl_chk', spot: 'Culver\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Culver\u2019s \u2014 Garden Fresco Salad with Double Grilled Chicken (Light Dressing)',
      parts: [['ro_romaine_base', 1], ['ro_zupas_chk', 1.75], ['ro_am_cheese', 1], ['ro_chimichurri', 1]] },

    // 11. In-N-Out (Spanish Fork)
    { id: 'ino_dbl_protein_style', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 'lds',
      name: 'In-N-Out \u2014 Double-Double Protein Style (Lettuce Wrapped, Mustard Corrected)',
      parts: [['ro_beef_patty', 2], ['ro_am_cheese', 2], ['ro_lettuce_tom_oni', 1.5]] },
    { id: 'ino_2_flying_dutchman', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 'ld',
      name: 'In-N-Out \u2014 2 Flying Dutchmans (4 Beef Patties, 2 Slices Cheese, Grilled Onion)',
      parts: [['ro_beef_patty', 4], ['ro_am_cheese', 2], ['ro_lettuce_tom_oni', 0.5]] },
    { id: 'ino_dbl_meat_burger', spot: 'In-N-Out \u00b7 Spanish Fork', meals: 'ld',
      name: 'In-N-Out \u2014 Double Meat Burger (Mustard Corrected, No Spread, Regular Bun)',
      parts: [['ro_beef_patty', 2], ['ro_burger_bun', 1], ['ro_lettuce_tom_oni', 1]] },

    // 12. Wendy's (Price & Spanish Fork)
    { id: 'we_apple_pecan_dbl_chk', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Wendy\u2019s \u2014 Apple Pecan Salad with Double Grilled Chicken (No Pecans)',
      parts: [['ro_romaine_base', 1], ['ro_zupas_chk', 1.75], ['ro_fresh_fruit_pc', 0.75], ['ro_chimichurri', 1]] },
    { id: 'we_chili_baked_potato', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Wendy\u2019s \u2014 Large Rich & Meaty Chili + Plain Baked Potato',
      parts: [['ro_wendys_chili_lg', 1], ['ro_baked_potato', 1]] },
    { id: 'we_jr_burgers_chili', spot: 'Wendy\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Wendy\u2019s \u2014 Double Burger Patty Lettuce Wrap + Large Rich & Meaty Chili',
      parts: [['ro_beef_patty', 2], ['ro_lettuce_tom_oni', 1], ['ro_wendys_chili_lg', 1]] },

    // 13. Arby's (Price & Spanish Fork)
    { id: 'ar_dbl_roast_beef', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Arby\u2019s \u2014 Double Roast Beef Sandwich (6 oz Sliced Roast Beef)',
      parts: [['ro_arby_roast_beef', 2], ['ro_burger_bun', 1]] },
    { id: 'ar_half_lb_beef_salad', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Arby\u2019s \u2014 Half-Pound Roast Beef Sandwich + Fresh Garden Side Salad',
      parts: [['ro_arby_roast_beef', 2.5], ['ro_burger_bun', 1], ['ro_side_salad_lite', 1]] },
    { id: 'ar_turkey_farmhouse', spot: 'Arby\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Arby\u2019s \u2014 Roast Turkey Farmhouse Salad (Double Turkey, Light Dressing)',
      parts: [['ro_romaine_base', 1], ['ro_deli_turkey', 1.5], ['ro_am_cheese', 1], ['ro_tomatillo_dr', 0.5]] },

    // 14. Jersey Mike's (Spanish Fork)
    { id: 'jm_turkey_tub_dbl', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Jersey Mike\u2019s \u2014 #7 Turkey & Provolone Sub in a Tub (Double Meat, Mike\u2019s Way Lite)',
      parts: [['ro_deli_turkey', 2], ['ro_am_cheese', 1], ['ro_sub_veggies_vin', 1.5], ['ro_olive_oil_lite', 1]] },
    { id: 'jm_club_wheat_dbl', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Jersey Mike\u2019s \u2014 #8 Club Sub Regular on Wheat (Double Turkey & Ham, No Mayo)',
      parts: [['ro_deli_turkey', 1.5], ['ro_deli_ham', 1], ['ro_am_cheese', 1], ['ro_sub_wheat_roll', 1], ['ro_sub_veggies_vin', 1]] },
    { id: 'jm_chk_philly_tub', spot: 'Jersey Mike\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Jersey Mike\u2019s \u2014 #16 Chicken Philly Sub in a Tub (Peppers, Onions, Provolone)',
      parts: [['ro_zupas_chk', 1.5], ['ro_fajita_veggies', 1.5], ['ro_am_cheese', 1.5]] },

    // 15. Subway (Price & Spanish Fork)
    { id: 'sw_rotisserie_6in_dbl', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Subway \u2014 6\" Rotisserie Chicken (Double Meat on Multigrain, All Veggies)',
      parts: [['ro_zupas_chk', 1.5], ['ro_sub_wheat_roll', 1], ['ro_sub_veggies_vin', 1]] },
    { id: 'sw_turkey_footlong', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Subway \u2014 Footlong Oven Roasted Turkey (Multigrain, Spinach, Vinegar)',
      parts: [['ro_deli_turkey', 1.5], ['ro_sub_wheat_roll', 2], ['ro_sub_veggies_vin', 1.5]] },
    { id: 'sw_chk_turkey_bowl', spot: 'Subway \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Subway \u2014 Grilled Chicken & Turkey Protein Bowl (Double Meat, Spinach, Vinegar)',
      parts: [['ro_zupas_chk', 1], ['ro_deli_turkey', 1], ['ro_sub_veggies_vin', 2], ['ro_olive_oil_lite', 1]] },

    // 16. Kneaders (Spanish Fork)
    { id: 'kn_turkey_avo_salad', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld',
      name: 'Kneaders \u2014 Turkey Bacon Avocado Salad (No Croutons, Dressing on Side)',
      parts: [['ro_romaine_base', 1], ['ro_deli_turkey', 1.5], ['ro_bacon_strips', 1], ['ro_avocado_slices', 1]] },
    { id: 'kn_turkey_cran_soup', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld',
      name: 'Kneaders \u2014 Half Turkey Cranberry Focaccia + Cup Chicken Noodle Soup',
      parts: [['ro_deli_turkey', 1.25], ['ro_focaccia_half', 1], ['ro_chk_noodle_cup', 1]] },
    { id: 'kn_chk_caesar_salad', spot: 'Kneaders \u00b7 Spanish Fork', meals: 'ld',
      name: 'Kneaders \u2014 Grilled Chicken Caesar Salad (No Croutons, Half Dressing)',
      parts: [['ro_romaine_base', 1.25], ['ro_zupas_chk', 1.5], ['ro_am_cheese', 1], ['ro_chimichurri', 1]] },

    // 17. Maverik BonFire (Price & Spanish Fork)
    { id: 'mv_shake_eggs_apple', spot: 'Maverik BonFire \u00b7 Price & Spanish Fork', meals: 'blds',
      name: 'Maverik \u2014 Core Power Elite 42g Shake + 2 Hard-Boiled Eggs + Fresh Apple',
      parts: [['ro_core_power_42', 1], ['ro_hard_boiled_2', 1], ['ro_fresh_fruit_pc', 1]] },
    { id: 'mv_street_tacos_fairlife', spot: 'Maverik BonFire \u00b7 Price & Spanish Fork', meals: 'blds',
      name: 'Maverik \u2014 2 BonFire Chicken Street Tacos + Fairlife 30g Protein Shake',
      parts: [['ro_grill_chk_mex', 0.75], ['ro_corn_tortilla', 2], ['ro_pico_salsa', 0.5], ['ro_fairlife_30', 1]] },
    { id: 'mv_jerky_yogurt_banana', spot: 'Maverik BonFire \u00b7 Price & Spanish Fork', meals: 'blds',
      name: 'Maverik \u2014 3oz Beef Jerky Bag + Zero Sugar Greek Yogurt + Banana',
      parts: [['ro_beef_jerky_3oz', 1], ['ro_zero_greek_yog', 1], ['ro_fresh_fruit_pc', 1]] },

    // 18. Grogg's Pinnacle Brewing (Price)
    { id: 'gr_chk_dinner_salad', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'ld', est: true,
      name: 'Grogg\u2019s Pinnacle \u2014 Grilled Chicken Breast Dinner Salad (Balsamic on Side)',
      parts: [['ro_romaine_base', 1.5], ['ro_zupas_chk', 1.5], ['ro_chimichurri', 1]] },
    { id: 'gr_sirloin_potato_broc', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'ld', est: true,
      name: 'Grogg\u2019s Pinnacle \u2014 8oz Top Sirloin + Plain Baked Potato + Steamed Broccoli',
      parts: [['ro_top_sirloin_8oz', 1], ['ro_baked_potato', 1], ['ro_steamed_veggies', 1]] },
    { id: 'gr_lettuce_burger_salad', spot: 'Grogg\u2019s Pinnacle Brewing \u00b7 Price', meals: 'ld', est: true,
      name: 'Grogg\u2019s Pinnacle \u2014 Lettuce-Wrapped Double Pinnacle Burger + Side Salad',
      parts: [['ro_beef_patty', 2.5], ['ro_lettuce_tom_oni', 1], ['ro_side_salad_lite', 1]] },

    // 19. Big Don's Pizza (Price)
    { id: 'bd_2slice_chk_salad', spot: 'Big Don\u2019s Pizza \u00b7 Price', meals: 'ld', est: true,
      name: 'Big Don\u2019s Pizza \u2014 2 Slices Thin-Crust Chicken Veggie Pizza + Garden Salad',
      parts: [['ro_thin_chk_slice', 2], ['ro_zupas_chk', 0.5], ['ro_side_salad_lite', 1]] },
    { id: 'bd_8wings_salad', spot: 'Big Don\u2019s Pizza \u00b7 Price', meals: 'ld', est: true,
      name: 'Big Don\u2019s Pizza \u2014 8 Oven-Roasted Bone-In Wings + Large Garden Salad',
      parts: [['ro_baked_wings_4', 2], ['ro_side_salad_lite', 1.25]] },
    { id: 'bd_3slice_combo_salad', spot: 'Big Don\u2019s Pizza \u00b7 Price', meals: 'ld', est: true,
      name: 'Big Don\u2019s Pizza \u2014 3 Slices Thin-Crust All-Meat & Chicken Pizza + Side Salad',
      parts: [['ro_thin_meat_slice', 3], ['ro_side_salad_lite', 1]] },

    // 20. JB's Restaurant (Price)
    { id: 'jb_veggie_ham_scrambler', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'bld', est: true,
      name: 'JB\u2019s \u2014 3-Egg Veggie & Lean Ham Scrambler + Dry Wheat Toast + Fruit Cup',
      parts: [['ro_egg_scrambler', 1], ['ro_deli_ham', 1], ['ro_wheat_toast', 1], ['ro_fruit_cup', 1]] },
    { id: 'jb_sirloin_steak_eggs', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'bld', est: true,
      name: 'JB\u2019s \u2014 Sirloin Steak & 3 Eggs + Shredded Hash Browns + Dry Wheat Toast',
      parts: [['ro_top_sirloin_8oz', 0.75], ['ro_egg_scrambler', 1], ['ro_hash_browns', 1], ['ro_wheat_toast', 1]] },
    { id: 'jb_lemon_chk_veggies', spot: 'JB\u2019s Restaurant \u00b7 Price', meals: 'ld', est: true,
      name: 'JB\u2019s \u2014 Grilled Lemon-Herb Chicken Breast + Steamed Veggies + Side Salad',
      parts: [['ro_zupas_chk', 1.5], ['ro_steamed_veggies', 1.5], ['ro_side_salad_lite', 1]] },

    // 21. Sherald's Frosty Freeze (Price)
    { id: 'sh_dbl_burger_lettuce', spot: 'Sherald\u2019s \u00b7 Price', meals: 'lds', est: true,
      name: 'Sherald\u2019s \u2014 Double Burger Lettuce-Wrapped (Mustard, Pickles, Grilled Onion)',
      parts: [['ro_beef_patty', 2.5], ['ro_am_cheese', 1], ['ro_lettuce_tom_oni', 1.5]] },
    { id: 'sh_grill_chk_half_fries', spot: 'Sherald\u2019s \u00b7 Price', meals: 'ld', est: true,
      name: 'Sherald\u2019s \u2014 Grilled Chicken Breast Sandwich (No Mayo) + Small Fry Share',
      parts: [['ro_cu_grill_sand', 1], ['ro_small_fries', 1]] },
    { id: 'sh_cheeseburger_xpatty', spot: 'Sherald\u2019s \u00b7 Price', meals: 'lds', est: true,
      name: 'Sherald\u2019s \u2014 Double Patty Cheeseburger (No Fry Sauce, Mustard & Pickles)',
      parts: [['ro_beef_patty', 2.5], ['ro_am_cheese', 1], ['ro_burger_bun', 1], ['ro_lettuce_tom_oni', 0.5]] },

    // 22. Mandarin Garden (Price)
    { id: 'mg_chk_broc_rice', spot: 'Mandarin Garden \u00b7 Price', meals: 'ld', est: true,
      name: 'Mandarin Garden \u2014 Chicken & Broccoli with Steamed Rice (Light Garlic Sauce)',
      parts: [['ro_wok_chk_broc', 1], ['ro_white_rice', 0.75]] },
    { id: 'mg_dbl_beef_broc_rice', spot: 'Mandarin Garden \u00b7 Price', meals: 'ld', est: true,
      name: 'Mandarin Garden \u2014 Double Beef & Broccoli + Steamed White Rice',
      parts: [['ro_wok_beef_broc', 1.5], ['ro_white_rice', 1]] },
    { id: 'mg_shrimp_chk_veggies', spot: 'Mandarin Garden \u00b7 Price', meals: 'ld', est: true,
      name: 'Mandarin Garden \u2014 Steamed Shrimp & Chicken with Mixed Veggies + Half Rice',
      parts: [['ro_wok_shrimp_chk', 1], ['ro_white_rice', 0.5]] },

    // 23. McDonald's (Price & Spanish Fork)
    { id: 'mcd_2_egg_mcmuffin', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'bs',
      name: 'McDonald\u2019s \u2014 2 Egg McMuffins (Canadian Bacon, Egg & English Muffin)',
      parts: [['ro_egg_mcmuffin', 2]] },
    { id: 'mcd_dbl_qp_nobun', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'McDonald\u2019s \u2014 Double Quarter Pounder Lettuce-Wrapped (No Bun, Mustard, Apple Slices)',
      parts: [['ro_qp_beef_patty', 2], ['ro_am_cheese', 1], ['ro_lettuce_tom_oni', 1], ['ro_apple_slices_bag', 1]] },
    { id: 'mcd_2_mcdouble_plain', spot: 'McDonald\u2019s \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'McDonald\u2019s \u2014 2 McDoubles (No Ketchup, Mustard, Pickles & Onions)',
      parts: [['ro_mcdouble_nomayo', 2]] },

    // 24. KFC (Price & Spanish Fork)
    { id: 'kfc_grilled_2pc_beans_corn', spot: 'KFC \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'KFC \u2014 2pc Kentucky Grilled Chicken (Breast & Drum) + Green Beans + Sweet Corn',
      parts: [['ro_kfc_grill_breast', 1], ['ro_kfc_grill_drum', 1], ['ro_bbq_green_beans', 1], ['ro_kfc_sweet_corn', 1]] },
    { id: 'kfc_breast_mash_beans', spot: 'KFC \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'KFC \u2014 Grilled or Skin-Off Chicken Breast + Mashed Potatoes & Gravy + Green Beans',
      parts: [['ro_kfc_grill_breast', 1], ['ro_cu_mash_gravy', 1], ['ro_bbq_green_beans', 1]] },
    { id: 'kfc_5_tenders_beans', spot: 'KFC \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'KFC \u2014 5 Chicken Breast Tenders + Green Beans + Side Salad',
      parts: [['ro_kfc_tenders_5', 1], ['ro_bbq_green_beans', 1], ['ro_side_salad_lite', 1]] },

    // 25. Dairy Queen (Price & Spanish Fork)
    { id: 'dq_rotiss_salad_bowl', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Dairy Queen \u2014 Rotisserie Chicken Bites Salad Bowl (Light Dressing)',
      parts: [['ro_romaine_base', 1], ['ro_dq_rotiss_bites', 1.25], ['ro_pico_salsa', 1], ['ro_chimichurri', 1]] },
    { id: 'dq_6pc_rotiss_side_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Dairy Queen \u2014 6pc Rotisserie-Style Chicken Bites + Side Salad (No Toast)',
      parts: [['ro_dq_rotiss_bites', 1], ['ro_side_salad_lite', 1]] },
    { id: 'dq_dbl_stackburger_salad', spot: 'Dairy Queen \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Dairy Queen \u2014 Double Stackburger (No Mayo, Mustard & Pickles) + Side Salad',
      parts: [['ro_beef_patty', 2], ['ro_am_cheese', 1], ['ro_burger_bun', 1], ['ro_side_salad_lite', 1]] },

    // 26. Taco Bell (Price & Spanish Fork)
    { id: 'tb_cantina_chk_bowl_dbl', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Bell \u2014 Cantina Chicken Bowl with Extra Chicken (No Sour Cream, Light Sauce)',
      parts: [['ro_grill_chk_mex', 1.5], ['ro_black_beans', 1], ['ro_cilantro_rice', 0.75], ['ro_romaine_base', 1], ['ro_pico_salsa', 1]] },
    { id: 'tb_3_fresco_steak_tacos', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Taco Bell \u2014 3 Fresco Style Grilled Steak Tacos (Pico de Gallo, No Cheese/Sauce)',
      parts: [['ro_grill_steak_mex', 1.25], ['ro_corn_tortilla', 3], ['ro_pico_salsa', 1.5]] },
    { id: 'tb_power_steak_chk_bowl', spot: 'Taco Bell \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Bell \u2014 Steak & Chicken Power Bowl (Black Beans, Seasoned Rice, Guacamole)',
      parts: [['ro_grill_chk_mex', 0.75], ['ro_grill_steak_mex', 0.75], ['ro_black_beans', 1], ['ro_spanish_rice', 0.75], ['ro_avocado_slices', 1], ['ro_pico_salsa', 1]] },

    // 27. Taco Time (Price & Spanish Fork)
    { id: 'tt_fit_hit_chk_bowl', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Time \u2014 Fit-Hit Chicken Bowl (Grilled Chicken, Black Beans, Corn, Salsa Fresca)',
      parts: [['ro_grill_chk_mex', 1.25], ['ro_black_beans', 1], ['ro_kfc_sweet_corn', 0.5], ['ro_romaine_base', 1], ['ro_pico_salsa', 1]] },
    { id: 'tt_2_chk_tacos_beans', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Taco Time \u2014 2 Soft Grilled Chicken Tacos + Side Pinto Beans',
      parts: [['ro_grill_chk_mex', 1.25], ['ro_corn_tortilla', 2], ['ro_pinto_beans', 1], ['ro_pico_salsa', 1]] },
    { id: 'tt_steak_taco_salad', spot: 'Taco Time \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Taco Time \u2014 Grilled Steak Taco Salad (No Fried Shell, Black Beans, Salsa Fresca)',
      parts: [['ro_romaine_base', 1.25], ['ro_grill_steak_mex', 1.25], ['ro_black_beans', 1], ['ro_pico_salsa', 1], ['ro_tomatillo_dr', 0.5]] },

    // 28. Burger King (Price & Spanish Fork)
    { id: 'bk_dbl_whopper_nobun', spot: 'Burger King \u00b7 Price & Spanish Fork', meals: 'ld',
      name: 'Burger King \u2014 Double Whopper Protein Bowl (No Bun, No Mayo, Lettuce, Tomato, Pickles)',
      parts: [['ro_flame_whopper_pt', 2], ['ro_lettuce_tom_oni', 1.5]] },
    { id: 'bk_2_whopper_jr_nomayo', spot: 'Burger King \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Burger King \u2014 2 Whopper Jr. Burgers (No Mayo, Mustard, Lettuce, Tomato, Onion)',
      parts: [['ro_whopper_jr_lite', 2]] },
    { id: 'bk_2_royal_chk_wraps', spot: 'Burger King \u00b7 Price & Spanish Fork', meals: 'lds',
      name: 'Burger King \u2014 2 Grilled Chicken Royal Wraps (Light Sauce, Lettuce & Tomato)',
      parts: [['ro_grill_chk_wrap', 2]] },

    // 29. Sonic Drive-In (Spanish Fork)
    { id: 'so_dbl_smash_lettuce', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'lds',
      name: 'Sonic \u2014 Double Sonic Smasher Lettuce-Wrapped (No Sauce, Mustard & Pickles)',
      parts: [['ro_beef_patty', 2.5], ['ro_am_cheese', 1], ['ro_lettuce_tom_oni', 1]] },
    { id: 'so_2_grill_chk_wraps', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'lds',
      name: 'Sonic \u2014 2 Grilled Chicken Tender Wraps + Fresh Apple Slices',
      parts: [['ro_grill_chk_wrap', 2], ['ro_apple_slices_bag', 1]] },
    { id: 'so_breakfast_scrambler_bowl', spot: 'Sonic Drive-In \u00b7 Spanish Fork', meals: 'bs',
      name: 'Sonic \u2014 High-Protein Bacon & Egg Breakfast Bowl (No Tortilla, Salsa)',
      parts: [['ro_egg_scrambler', 1.5], ['ro_bacon_strips', 2], ['ro_pico_salsa', 1]] },

    // 30. Mo' Bettahs Hawaiian Style Food (Spanish Fork)
    { id: 'mb_mini_teriyaki_chk_veg', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld',
      name: 'Mo\u2019 Bettahs \u2014 Mini Teriyaki Chicken (1 Scoop Rice, All Shredded Cabbage, No Mac Salad)',
      parts: [['ro_teriyaki_chk', 1.25], ['ro_white_rice', 0.75], ['ro_cabbage_slaw', 1.5], ['ro_teriyaki_glaze', 0.5]] },
    { id: 'mb_reg_dbl_chk_cabbage', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld',
      name: 'Mo\u2019 Bettahs \u2014 Regular Teriyaki Chicken (All Cabbage Base, No Rice, No Mac Salad)',
      parts: [['ro_teriyaki_chk', 2], ['ro_cabbage_slaw', 2]] },
    { id: 'mb_chk_kalua_pork_light', spot: 'Mo\u2019 Bettahs \u00b7 Spanish Fork', meals: 'ld',
      name: 'Mo\u2019 Bettahs \u2014 Teriyaki Chicken & Kalua Pork (1 Scoop Rice, Extra Cabbage, No Mac)',
      parts: [['ro_teriyaki_chk', 1], ['ro_kalua_pork_lean', 1], ['ro_white_rice', 0.75], ['ro_cabbage_slaw', 1.5]] },

    // 31. Cupbop Korean BBQ (Spanish Fork)
    { id: 'cb_kko_kko_bop_nodang', spot: 'Cupbop Korean BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cupbop \u2014 Kko Kko Bop BBQ Chicken (Extra Cabbage, Half Rice, No Noodles)',
      parts: [['ro_teriyaki_chk', 1.5], ['ro_white_rice', 0.75], ['ro_cabbage_slaw', 1.5]] },
    { id: 'cb_b_bop_beef_chk_combo', spot: 'Cupbop Korean BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cupbop \u2014 B Bop Korean BBQ Beef + Chicken Combo (Half Rice, Extra Cabbage, No Noodles)',
      parts: [['ro_korean_bbq_beef', 1], ['ro_teriyaki_chk', 1], ['ro_white_rice', 0.75], ['ro_cabbage_slaw', 1.5]] },
    { id: 'cb_lowcarb_dbl_chk', spot: 'Cupbop Korean BBQ \u00b7 Spanish Fork', meals: 'ld',
      name: 'Cupbop \u2014 Low-Carb Double BBQ Chicken Bowl (All Cabbage, No Rice, No Noodles)',
      parts: [['ro_teriyaki_chk', 1.75], ['ro_cabbage_slaw', 2]] },

    // 32. Jimmy John's (Spanish Fork)
    { id: 'jj_beach_club_unwich_dbl', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'lds',
      name: 'Jimmy John\u2019s \u2014 #12 Beach Club Unwich Lettuce Wrap (Double Turkey, Avocado, No Mayo)',
      parts: [['ro_deli_turkey', 2], ['ro_am_cheese', 1], ['ro_avocado_slices', 1], ['ro_lettuce_tom_oni', 1.5]] },
    { id: 'jj_hunters_club_unwich', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'lds',
      name: 'Jimmy John\u2019s \u2014 #10 Hunter\u2019s Club Unwich Lettuce Wrap (Double Roast Beef, Provolone, Mustard)',
      parts: [['ro_arby_roast_beef', 2.5], ['ro_am_cheese', 1], ['ro_lettuce_tom_oni', 1.5]] },
    { id: 'jj_turkey_tom_8in_dbl', spot: 'Jimmy John\u2019s \u00b7 Spanish Fork', meals: 'ld',
      name: 'Jimmy John\u2019s \u2014 #4 Turkey Tom 8\" Sub (Double Turkey, No Mayo, Mustard, Lettuce & Tomato)',
      parts: [['ro_deli_turkey', 2], ['ro_sub_wheat_roll', 1.25], ['ro_lettuce_tom_oni', 1]] }
  ];

  function mEatoutCatalog() {
    return { parts: MEATOUT_PARTS, combos: MEATOUT_COMBOS };
  }

  return { mShelfKey: mShelfKey, MSHELF: MSHELF, mEatoutCatalog: mEatoutCatalog };
};
