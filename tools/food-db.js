/*
 * Food reference table for estimating recipe macros.
 *
 * Every entry is per 100 g: kcal, protein (p), carbohydrate (c), fat (f),
 * sodium in milligrams (na) and fiber (fib).
 * Values are standard reference figures (USDA FoodData Central rounded to the
 * nearest sensible figure for a home kitchen). Where a storehouse item has no
 * single obvious match, the note field records what was assumed.
 *
 * Sodium is the figure for the form the storehouse actually stocks, which is
 * usually the canned one: canned beans carry salt that dry beans do not, and
 * deli ham carries more than the pork it came from. Rinsing canned beans takes
 * about 40% of it back off; that is not assumed here.
 *
 * `label` is what the shopping list calls the food. Without it the list writes
 * the key with its underscores turned into spaces, which is right often enough
 * to only need the exceptions.
 *
 * `g` holds gram weights for the units the recipes actually use. `each` is the
 * weight of one countable item ("1 apple", "3 eggs"). `def` is what to assume
 * when a line carries no quantity at all ("butter", "cheddar") — see
 * build-data.js for how unquantified lines are handled.
 *
 * Meat weights are raw, because that is how the recipes state them.
 *
 * Container sizes follow the storehouse's own order list rather than the
 * supermarket sizes they resemble: peaches and pears come in 29 oz tins, diced
 * tomatoes in 28 oz, canned chicken only in 12.5 oz, tuna only in 5 oz. *
 * `sold` is the size printed on that container, in ounces, keyed by the same
 * unit as `g`. `g` is what goes in the pot (drained, for anything packed in
 * liquid); `sold` is what the cook finds on the shelf. The build writes it
 * into every recipe line that names a container without a size, and a line
 * that states exactly this size is counted at `g` — see parse-lib.js — so
 * saying "1 can (15 oz) black beans" and "1 can black beans" is one amount.
 */

const FOODS = {
  // ---- Dairy & eggs -------------------------------------------------------
  milk:            { eat: 1, kcal: 50,  p: 3.3,  c: 4.8,  f: 2.0, na: 44, fib: 0,  g: { cup: 244, tbsp: 15, tsp: 5 }, note: '2% milk' },
  dry_milk:        { kcal: 358, p: 36,   c: 52,   f: 0.8, na: 535, fib: 0,  g: { cup: 68, tbsp: 4.3 }, label: 'Dry milk powder', note: 'non-fat dry milk powder' },
  evaporated_milk: { kcal: 134, p: 6.8,  c: 10,   f: 7.6, na: 106, fib: 0,  g: { cup: 252, can: 354 }, label: 'Evaporated milk', note: '12 fl oz', sold: { can: 12 } },
  cottage_cheese:  { eat: 1, kcal: 84,  p: 11,   c: 4.3,  f: 2.3, na: 330, fib: 0,  g: { cup: 226, tbsp: 14 }, label: 'Cottage cheese', note: '2% cottage cheese' },
  cheddar:         { eat: 1, kcal: 403, p: 23,   c: 3.1,  f: 33, na: 653, fib: 0,   g: { cup: 113, tbsp: 7, oz: 28.35, each: 28 }, label: 'Cheddar cheese', def: { qty: 0.5, unit: 'cup' }, note: 'shredded; "cheddar slice" = 28 g' },
  /* Not on the storehouse order — it is an extra in the two recipes that use
     it — but it has to be in the table or the recipes that call for a cup of
     it are scored as though it were not there. A cup grated is 100 g, which is
     far lighter than a cup of shredded cheddar; it is a drier cheese and grates
     into flakes rather than shreds. */
  parmesan:        { eat: 1, kcal: 420, p: 38,   c: 4.1,  f: 28, na: 1600, fib: 0,  g: { cup: 100, tbsp: 6, oz: 28.35 }, label: 'Parmesan cheese', def: { qty: 0.25, unit: 'cup' }, note: 'grated; not on the storehouse order' },
  cream_cheese:    { eat: 1, kcal: 350, p: 6,    c: 5.5,  f: 34, na: 314, fib: 0, label: 'Cream cheese',   g: { cup: 232, tbsp: 14.5 } },
  sour_cream:      { eat: 1, kcal: 198, p: 2.4,  c: 4.6,  f: 19.4, na: 45, fib: 0, g: { cup: 230, tbsp: 14.4 }, label: 'Sour cream', def: { qty: 2, unit: 'tbsp' } },
  vanilla_yogurt:  { eat: 1, kcal: 85,  p: 4.9,  c: 13.8, f: 1.3, na: 66, fib: 0,  g: { cup: 245, tbsp: 15 }, label: 'Vanilla yogurt', note: 'lowfat vanilla yogurt' },
  /* `veg` and `starch` split what `side` could not.
   *
     `side` is produce: broccoli and lettuce sit in it beside bananas and
     applesauce, and pantry-cats.js shelves them all as "Fresh" because that
     is where a cook looks, not what a macro is. On a cut the useful question
     is different — 🥦 Veggies means the things you can eat a lot of, and the
     measured split is unambiguous: lettuce through carrots run 15 to 41 kcal
     per 100 g, then potatoes at 77 and corn at 81, double the top of the
     range. Those two are starch and behave like it, so they are shelved with
     the cereal rather than with the broccoli. */
  /* `lever` is the condiment flag -- things that go ON food. Egg whites and
     a chicken breast are levers too, but they are also dinner, so they carry
     `eat` as well: without it the combo builder ranked canned tuna ahead of
     egg whites for breakfast, because the ladder sorts anything you can eat
     as it comes above anything you can only add to a plate. */
  butter:          { lever: 1, kcal: 717, p: 0.85, c: 0.06, f: 81, na: 643, fib: 0,   g: { cup: 227, tbsp: 14.2, tsp: 4.7, each: 113 }, def: { qty: 1, unit: 'tbsp' } },
  spray_butter:    { kcal: 0,   p: 0,    c: 0,    f: 0, na: 0, fib: 0,    g: { cup: 200, tbsp: 5 }, label: 'Spray butter', note: 'spray butter, treated as zero' },
  egg:             { eat: 1, kcal: 143, p: 12.6, c: 0.7,  f: 9.5, na: 142, fib: 0,  g: { each: 50, cup: 243 }, label: 'Eggs', note: 'whole large egg, 50 g' },
  egg_white:       { eat: 1, lever: 1, kcal: 52,  p: 10.9, c: 0.7,  f: 0.2, na: 166, fib: 0, label: 'Egg whites',  g: { cup: 243, tbsp: 15, each: 33 } },

  // ---- Meat & fish --------------------------------------------------------
  chicken_breast:  { eat: 1, lever: 1, kcal: 120, p: 22.5, c: 0,    f: 2.6, na: 45, fib: 0,  g: { lb: 453.6, oz: 28.35, cup: 140, each: 174 }, label: 'Chicken breasts', note: 'raw boneless skinless breast' },
  chicken_canned:  { eat: 1, kcal: 130, p: 23,   c: 0,    f: 3.5, na: 400, fib: 0,  g: { can: 285, oz: 28.35, cup: 140 }, label: 'Canned chicken', note: 'the storehouse stocks one size, 12.5 oz, about 285 g drained', sold: { can: 12.5 } },
  /* 90/10, not the 85/15 this said for a long time. Nothing on a package
     settled it — the recipes did. Eight of Run and Not Be Weary's recipes
     brown ground beef, and against 85/15 their printed figures are out by
     26% on calories, 14% on protein and 95% on fat. Against 90/10 the same
     eight come to 11%, 6% and 12%. Three independent numbers all fall into
     line at once, which a wrong guess does not do.

     The rival explanation was that the beef is 85/15 and the fat renders off
     in the pan. That one fixes calories and leaves protein 14% out and fat
     29% out, because draining cannot ADD the protein the book claims. So it
     is the cut, not the cooking. Two of the eight are titled "Lean Beef".

     If the storehouse package says otherwise, the package wins — change it
     here and the eight recipes follow. */
  ground_beef:     { kcal: 176, p: 20,   c: 0,    f: 10, na: 66, fib: 0,   g: { lb: 453.6, oz: 28.35, cup: 225 }, label: 'Ground beef', note: 'raw 90/10' },
  beef_roast:      { kcal: 250, p: 17.5, c: 0,    f: 19.5, na: 60, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 225 }, label: 'Beef roast', note: 'raw chuck roast' },
  stewing_beef:    { kcal: 210, p: 19,   c: 0,    f: 14.5, na: 60, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 225 } },
  cooked_beef:     { eat: 1, kcal: 250, p: 26,   c: 0,    f: 16, na: 70, fib: 0,   g: { lb: 453.6, oz: 28.35, cup: 225 }, label: 'Cooked shredded beef', note: 'cooked shredded beef' },
  roast_beef_deli: { eat: 1, kcal: 130, p: 21,   c: 1,    f: 4, na: 900, fib: 0, label: 'Sliced roast beef', def: { qty: 1, unit: 'slice' },    g: { lb: 453.6, oz: 28.35, each: 28, slice: 28 } },
  pork_roast:      { kcal: 230, p: 17,   c: 0,    f: 18, na: 60, fib: 0,   g: { lb: 453.6, oz: 28.35, cup: 225 }, label: 'Pork roast', note: 'raw pork shoulder' },
  ham:             { eat: 1, kcal: 145, p: 16.6, c: 1.5,  f: 8, na: 1200, fib: 0,    g: { lb: 453.6, oz: 28.35, cup: 140, each: 28, slice: 28 }, label: 'Sliced ham', def: { qty: 1, unit: 'slice' }, note: 'sliced deli ham' },
  pork_sausage:    { kcal: 325, p: 12,   c: 1,    f: 30, na: 750, fib: 0,   g: { lb: 453.6, oz: 28.35, each: 45, link: 45 }, label: 'Pork sausage', def: { qty: 1, unit: 'link' }, note: 'raw pork sausage; 1 link = 45 g' },
  beef_frank:      { eat: 1, kcal: 290, p: 10.6, c: 4,    f: 26, na: 1090, fib: 0, label: 'Beef franks',   g: { lb: 453.6, oz: 28.35, each: 45 } },
  tuna:            { eat: 1, kcal: 116, p: 26,   c: 0,    f: 0.8, na: 300, fib: 0,  g: { can: 120, oz: 28.35, cup: 154 }, label: 'Canned tuna', note: 'canned in water, 5 oz can drained = 120 g', sold: { can: 5 } },

  // ---- Beans --------------------------------------------------------------
  black_beans:     { side: true, kcal: 91,  p: 6,    c: 16.6, f: 0.3, na: 250, fib: 6.9,  g: { can: 250, cup: 172 }, label: 'Black beans', note: 'canned, drained', sold: { can: 15 } },
  pinto_beans:     { side: true, kcal: 88,  p: 5.5,  c: 16,   f: 0.8, na: 250, fib: 6, label: 'Pinto beans',  g: { can: 250, cup: 171 }, sold: { can: 15 } },
  white_beans:     { kcal: 92,  p: 6.4,  c: 16.5, f: 0.4, na: 250, fib: 6.3,  g: { can: 250, cup: 179 }, label: 'Great Northern beans', note: 'Great Northern, canned', sold: { can: 15 } },
  refried_beans:   { kcal: 90,  p: 5.5,  c: 15,   f: 1.2, na: 380, fib: 4.5, label: 'Refried beans',  g: { can: 440, cup: 238 } },
  pork_and_beans:  { kcal: 94,  p: 4.8,  c: 17.7, f: 0.9, na: 400, fib: 4, label: 'Pork and beans',  g: { can: 440, cup: 253 }, sold: { can: 15.5 } },

  // ---- Grains, flours, mixes ---------------------------------------------
  oats:            { kcal: 379, p: 13.2, c: 67.7, f: 6.5, na: 6, fib: 10.1,  g: { cup: 80, tbsp: 5 }, def: { qty: 1, unit: 'cup' }, note: 'dry rolled oats' },
  oat_flour:       { kcal: 404, p: 14.7, c: 65.7, f: 9.1, na: 19, fib: 6.5, label: 'Oat flour',  g: { cup: 92, tbsp: 6 } },
  flour:           { kcal: 364, p: 10.3, c: 76.3, f: 1, na: 2, fib: 2.7,    g: { cup: 125, tbsp: 8 }, note: 'all-purpose' },
  rice_dry:        { kcal: 365, p: 7.1,  c: 80,   f: 0.7, na: 5, fib: 1.3, label: 'Rice',  g: { cup: 185 } },
  rice_cooked:     { kcal: 130, p: 2.7,  c: 28,   f: 0.3, na: 1, fib: 0.4, label: 'Cooked rice',  g: { cup: 158 } },
  pancake_mix:     { kcal: 366, p: 9,    c: 73,   f: 4.5, na: 900, fib: 2.5,  g: { cup: 125 }, label: 'Pancake mix', def: { qty: 1, unit: 'cup' }, note: 'dry complete mix; waffle mix treated the same' },
  pasta:           { kcal: 371, p: 13,   c: 74.7, f: 1.5, na: 6, fib: 3.2,  g: { lb: 453.6, oz: 28.35, cup: 105, pkg: 453.6 }, label: 'Pasta', note: 'dry pasta', sold: { pkg: 16 } },
  bread:           { kcal: 265, p: 9,    c: 49,   f: 3.2, na: 490, fib: 2.7,  g: { each: 28, cup: 45 }, label: 'Bread', note: '1 slice = 28 g' },
  wheat_bread:     { kcal: 247, p: 13,   c: 41,   f: 3.4, na: 450, fib: 6, label: 'Wheat bread',  g: { each: 28, cup: 45 } },
  tortilla:        { kcal: 306, p: 8.2,  c: 51.4, f: 7.1, na: 620, fib: 3,  g: { each: 45 }, label: 'Tortillas', note: 'flour tortilla, 8 in' },
  tortilla_small:  { kcal: 306, p: 8.2,  c: 51.4, f: 7.1, na: 620, fib: 3, label: 'Small tortillas',  g: { each: 30 } },
  bun:             { kcal: 279, p: 9.5,  c: 50,   f: 4.2, na: 490, fib: 2.3,  g: { each: 52 }, label: 'Buns', note: 'hamburger / hot dog bun' },
  slider_bun:      { kcal: 279, p: 9.5,  c: 50,   f: 4.2, na: 490, fib: 2.3, label: 'Slider buns',  g: { each: 30 } },
  breadcrumbs:     { kcal: 395, p: 13.4, c: 72,   f: 5.3, na: 730, fib: 4.5, label: 'Breadcrumbs',  g: { cup: 108, tbsp: 7 } },
  cereal_o:        { starch: 1, eat: 1, kcal: 386, p: 7,    c: 80,   f: 4.5, na: 500, fib: 7,  g: { cup: 37 }, label: 'Honey Nut O\'s', note: "Honey Nut O's" },
  biscuit_dough:   { kcal: 320, p: 6.6,  c: 48,   f: 11, na: 900, fib: 1.5,   g: { can: 454, each: 57 }, label: 'Biscuit dough', def: { qty: 1, unit: 'can' }, note: 'refrigerated biscuit dough' },

  // ---- Potatoes -----------------------------------------------------------
  potato:          { starch: 1, side: true, kcal: 77,  p: 2,    c: 17.5, f: 0.1, na: 6, fib: 2.1,  g: { lb: 453.6, cup: 150, each: 173 }, label: 'Potatoes', note: 'raw; 1 medium = 173 g' },
  instant_potato:  { kcal: 357, p: 8,    c: 81,   f: 0.4, na: 60, fib: 6.6,  g: { cup: 60 }, label: 'Instant potatoes', note: 'dry flakes' },
  mashed_potato:   { kcal: 113, p: 2,    c: 17,   f: 4.2, na: 320, fib: 1.5,  g: { cup: 210 }, label: 'Mashed potatoes', note: 'prepared with milk and butter' },

  // ---- Vegetables ---------------------------------------------------------
  carrot:          { veg: 1, side: true, kcal: 41,  p: 0.9,  c: 9.6,  f: 0.2, na: 69, fib: 2.8, label: 'Carrots',  g: { lb: 453.6, cup: 128, can: 250, each: 61 }, def: { qty: 1, unit: 'each' }, sold: { can: 14.5 } },
  green_beans:     { veg: 1, side: true, kcal: 20,  p: 1.2,  c: 4.1,  f: 0.1, na: 220, fib: 2.6,  g: { can: 240, cup: 125 }, label: 'Green beans', def: { qty: 1, unit: 'can' }, note: 'canned, drained', sold: { can: 14.5 } },
  corn:            { starch: 1, side: true, kcal: 81,  p: 2.6,  c: 19,   f: 1, na: 220, fib: 2.4,    g: { can: 265, cup: 165 }, note: '14.4 oz tin, drained', sold: { can: 14.4 } },
  broccoli:        { veg: 1, side: true, kcal: 34,  p: 2.8,  c: 6.6,  f: 0.4, na: 33, fib: 2.6,  g: { lb: 453.6, cup: 91 }, def: { qty: 1, unit: 'lb' } },
  lettuce:         { veg: 1, side: true, kcal: 15,  p: 1.4,  c: 2.9,  f: 0.2, na: 28, fib: 1.3,  g: { cup: 47, each: 600, oz: 28.35 }, def: { qty: 2, unit: 'cup' }, note: '1 head = 600 g' },
  onion:           { veg: 1, side: true, kcal: 40,  p: 1.1,  c: 9.3,  f: 0.1, na: 4, fib: 1.7,  g: { cup: 160, each: 110 }, label: 'Onions', def: { qty: 0.5, unit: 'each' } },
  tomato:          { veg: 1, side: true, kcal: 18,  p: 0.9,  c: 3.9,  f: 0.2, na: 5, fib: 1.2,  g: { cup: 180, each: 123 }, label: 'Tomatoes', def: { qty: 1, unit: 'each' }, note: '1 large = 182 g, handled by the parser' },
  tomato_canned:   { veg: 1, side: true, kcal: 32,  p: 1.5,  c: 7,    f: 0.2, na: 180, fib: 1.6,  g: { can: 794, cup: 240 }, label: 'Diced tomatoes', note: 'diced tomatoes, 28 oz tin', sold: { can: 28 } },
  bell_pepper:     { veg: 1, side: true, kcal: 26,  p: 1,    c: 6,    f: 0.3, na: 4, fib: 2.1,  g: { lb: 453.6, cup: 149, each: 119 }, label: 'Bell peppers', def: { qty: 1, unit: 'each' } },
  cucumber:        { veg: 1, side: true, kcal: 15,  p: 0.65, c: 3.6,  f: 0.1, na: 2, fib: 0.5,  g: { cup: 133, each: 300 }, label: 'Cucumbers', def: { qty: 0.5, unit: 'each' } },
  garlic:          { kcal: 149, p: 6.4,  c: 33,   f: 0.5, na: 17, fib: 2.1,  g: { each: 3, tsp: 2.8, tbsp: 8.4 }, def: { qty: 1, unit: 'each' } },
  /* Pickled and drained. The figure that matters here is sodium: they come out
     of brine, and a recipe leaning on pepperoncini leans on salt as much as on
     heat. One pepper is about 12 g, so six of them carry roughly 900 mg. */
  pepperoncini:    { veg: 1, kcal: 20,  p: 0.7,  c: 4.4,  f: 0.3, na: 1200, fib: 2.4,  g: { each: 12, cup: 130, jar: 340 }, label: 'Pepperoncini', def: { qty: 4, unit: 'each' }, note: 'pickled, drained' },

  // ---- Fruit --------------------------------------------------------------
  apple:           { side: true, kcal: 52,  p: 0.3,  c: 14,   f: 0.2, na: 1, fib: 2.4, label: 'Apples',  g: { cup: 125, each: 182 } },
  banana:          { side: true, kcal: 89,  p: 1.1,  c: 22.8, f: 0.3, na: 1, fib: 2.6, label: 'Bananas',  g: { cup: 150, each: 118 } },
  orange:          { side: true, kcal: 47,  p: 0.9,  c: 11.8, f: 0.1, na: 0, fib: 2.4, label: 'Oranges',  g: { cup: 165, each: 140 } },
  grapes:          { side: true, kcal: 69,  p: 0.7,  c: 18,   f: 0.2, na: 2, fib: 0.9,  g: { cup: 151, each: 5 } },
  peaches_canned:  { side: true, kcal: 54,  p: 0.6,  c: 14,   f: 0.1, na: 6, fib: 1.3,  g: { can: 500, cup: 244 }, label: 'Canned peaches', note: 'storehouse tin is 29 oz, about 500 g drained', sold: { can: 29 } },
  pears_canned:    { side: true, kcal: 60,  p: 0.4,  c: 15.6, f: 0.1, na: 5, fib: 1.7,  g: { can: 500, cup: 244 }, label: 'Canned pears', note: '29 oz tin', sold: { can: 29 } },
  applesauce:      { side: true, kcal: 68,  p: 0.2,  c: 17.5, f: 0.2, na: 2, fib: 1.1,  g: { jar: 751, cup: 244, can: 751 }, note: '26.5 oz', sold: { jar: 26.5 } },
  raisins:         { eat: 1, kcal: 299, p: 3.1,  c: 79,   f: 0.5, na: 11, fib: 3.7,  g: { cup: 145, tbsp: 9 } },
  fruit_generic:   { side: true, kcal: 60,  p: 0.7,  c: 15,   f: 0.2, na: 2, fib: 2,  g: { cup: 150, each: 140 }, label: 'Fresh fruit', def: { qty: 1, unit: 'cup' }, note: 'unspecified fresh/frozen fruit' },

  // ---- Sauces, condiments, sweeteners -------------------------------------
  salsa:           { kcal: 29,  p: 1.5,  c: 6,    f: 0.2, na: 700, fib: 1.5,  g: { cup: 260, tbsp: 16, jar: 751 }, def: { qty: 0.25, unit: 'cup' }, note: '26.5 oz jar', sold: { jar: 26.5 } },
  tomato_sauce:    { kcal: 24,  p: 1.2,  c: 5.3,  f: 0.2, na: 460, fib: 1.5,  g: { can: 408, cup: 245 }, label: 'Tomato sauce', note: '14.4 oz', sold: { can: 14.4 } },
  spaghetti_sauce: { kcal: 60,  p: 1.6,  c: 9.6,  f: 1.8, na: 480, fib: 2,  g: { jar: 785, can: 785, cup: 245 }, label: 'Spaghetti sauce', note: '27.7 oz', sold: { jar: 27.7, can: 27.7 } },
  tomato_soup:     { kcal: 70,  p: 1.6,  c: 14,   f: 1.2, na: 470, fib: 1.2,  g: { can: 408, cup: 245 }, label: 'Tomato soup', note: '14.4 oz tin', sold: { can: 14.4 } },
  cream_soup_chx:  { kcal: 90,  p: 2.4,  c: 7.5,  f: 5.6, na: 700, fib: 0.4,  g: { can: 298, cup: 245 }, label: 'Cream of chicken soup', note: 'condensed cream of chicken', sold: { can: 10.5 } },
  cream_soup_mush: { kcal: 82,  p: 1.6,  c: 6.5,  f: 5.3, na: 700, fib: 0.4,  g: { can: 298, cup: 245 }, label: 'Cream of mushroom soup', note: 'condensed cream of mushroom', sold: { can: 10.5 } },
  soup_rts:        { kcal: 45,  p: 2.5,  c: 6,    f: 1.2, na: 350, fib: 0.8,  g: { can: 408, cup: 245 }, label: 'Chicken rotini soup', note: 'chicken rotini soup, 14.4 oz tin', sold: { can: 14.4 } },
  ketchup:         { kcal: 101, p: 1.0,  c: 25,   f: 0.1, na: 907, fib: 0.3,  g: { cup: 240, tbsp: 17 }, def: { qty: 1, unit: 'tbsp' } },
  mustard:         { kcal: 66,  p: 3.7,  c: 5.8,  f: 3.3, na: 1120, fib: 3.3,  g: { cup: 249, tbsp: 15 }, def: { qty: 1, unit: 'tbsp' } },
  mayo:            { lever: 1, kcal: 680, p: 1,    c: 0.6,  f: 75, na: 635, fib: 0,   g: { cup: 220, tbsp: 14 }, def: { qty: 1, unit: 'tbsp' } },
  light_mayo:      { lever: 1, kcal: 233, p: 0.5,  c: 6.7,  f: 23, na: 800, fib: 0,   g: { cup: 230, tbsp: 15 }, label: 'Light mayo', note: '35 kcal per tablespoon' },
  ranch:           { lever: 1, kcal: 430, p: 1.3,  c: 6.6,  f: 45, na: 1000, fib: 0, label: 'Ranch dressing',   g: { cup: 240, tbsp: 15 } },
  light_ranch:     { lever: 1, kcal: 220, p: 1,    c: 10,   f: 19, na: 1100, fib: 0, label: 'Light ranch',   g: { cup: 240, tbsp: 15 } },
  bbq_sauce:       { kcal: 172, p: 0.8,  c: 40.8, f: 0.6, na: 1027, fib: 0.8, label: 'BBQ sauce',  g: { cup: 280, tbsp: 17 } },
  soy_sauce:       { kcal: 53,  p: 8,    c: 4.9,  f: 0.6, na: 5493, fib: 0.8,  g: { cup: 255, tbsp: 16 }, label: 'Soy sauce', def: { qty: 1, unit: 'tbsp' } },
  hot_sauce:       { kcal: 11,  p: 0.5,  c: 1.8,  f: 0.4, na: 2600, fib: 1,  g: { cup: 240, tbsp: 15 }, label: 'Hot sauce', def: { qty: 1, unit: 'tbsp' } },
  gravy_mix:       { kcal: 350, p: 8,    c: 68,   f: 4, na: 4000, fib: 1, label: 'Gravy mix',    g: { pkg: 25, tbsp: 8 }, sold: { pkg: 0.87 } },
  syrup:           { kcal: 260, p: 0,    c: 65,   f: 0, na: 12, fib: 0,    g: { cup: 315, tbsp: 20 }, def: { qty: 2, unit: 'tbsp' } },
  honey:           { kcal: 304, p: 0.3,  c: 82,   f: 0, na: 4, fib: 0.2,    g: { cup: 339, tbsp: 21 } },
  jam:             { kcal: 278, p: 0.4,  c: 69,   f: 0, na: 32, fib: 1.1, label: 'Jam',    g: { cup: 320, tbsp: 20 } },
  peanut_butter:   { eat: 1, kcal: 588, p: 25,   c: 20,   f: 50, na: 430, fib: 6, label: 'Peanut butter',   g: { cup: 258, tbsp: 16 } },
  oil:             { lever: 1, kcal: 884, p: 0,    c: 0,    f: 100, na: 0, fib: 0,  g: { cup: 218, tbsp: 13.6 }, label: 'Oil', def: { qty: 1, unit: 'tbsp' } },

  // ---- Baking & sweets ----------------------------------------------------
  sugar:           { kcal: 387, p: 0,    c: 100,  f: 0, na: 0, fib: 0,    g: { cup: 200, tbsp: 12.5, tsp: 4.2 } },
  brown_sugar:     { kcal: 380, p: 0,    c: 98,   f: 0, na: 28, fib: 0,    g: { cup: 220, tbsp: 13.8, tsp: 4.6 }, label: 'Brown sugar', def: { qty: 1, unit: 'tsp' } },
  powdered_sugar:  { kcal: 389, p: 0,    c: 100,  f: 0, na: 2, fib: 0, label: 'Powdered sugar',    g: { cup: 120, tbsp: 7.5 } },
  cinnamon_sugar:  { kcal: 380, p: 0.2,  c: 98,   f: 0.1, na: 1, fib: 1,  g: { cup: 200, tbsp: 12.5, tsp: 4.2 }, label: 'Cinnamon sugar', def: { qty: 1, unit: 'tbsp' } },
  cocoa:           { kcal: 228, p: 19.6, c: 58,   f: 13.7, na: 21, fib: 33, g: { cup: 86, tbsp: 5.4, tsp: 1.8 } },
  chocolate_chips: { kcal: 480, p: 4.2,  c: 63,   f: 30, na: 25, fib: 5.9, label: 'Chocolate chips',   g: { cup: 170, tbsp: 10.6 } },
  cake_mix:        { kcal: 420, p: 4,    c: 80,   f: 9, na: 700, fib: 1.5,    g: { box: 432, cup: 120 }, label: 'Cake mix', note: 'dry mix', sold: { box: 15.25 } },
  cake_baked:      { kcal: 380, p: 4,    c: 53,   f: 17, na: 400, fib: 1.2,   g: { each: 900, cup: 100 }, label: 'Baked cake', note: 'one baked 9x13 cake = 900 g' },
  pudding_mix:     { kcal: 370, p: 0,    c: 92,   f: 0.4, na: 900, fib: 0.5,  g: { pkg: 96, cup: 150 }, label: 'Pudding mix', note: 'dry instant pudding mix', sold: { pkg: 3.4 } },
  pudding_made:    { kcal: 111, p: 2,    c: 19,   f: 3, na: 150, fib: 0.3,    g: { each: 140, serving: 140, cup: 240 }, label: 'Prepared pudding', def: { qty: 1, unit: 'serving' }, note: 'prepared pudding, 1 serving = 140 g' },
  gelatin_flavored:{ kcal: 380, p: 7,    c: 88,   f: 0, na: 400, fib: 0,    g: { pkg: 85, each: 85, packet: 85 }, label: 'Flavored gelatin', def: { qty: 1, unit: 'packet' }, note: 'dry flavored gelatin', sold: { pkg: 3 } },
  gelatin_plain:   { kcal: 335, p: 85,   c: 0,    f: 0, na: 200, fib: 0,    g: { pkg: 7, each: 7, packet: 7 }, label: 'Unflavored gelatin', def: { qty: 1, unit: 'packet' }, note: 'unflavored gelatin packet', sold: { pkg: 0.25 } },
  cocoa_mix:       { kcal: 400, p: 6,    c: 78,   f: 8, na: 600, fib: 3, label: 'Hot cocoa mix', def: { qty: 1, unit: 'packet' },    g: { pkg: 28, each: 28, packet: 28 }, sold: { pkg: 1 } },
  baking_powder:   { kcal: 53,  p: 0,    c: 28,   f: 0, na: 10600, fib: 0.2, label: 'Baking powder',    g: { tsp: 4.6, tbsp: 13.8 } },
  baking_soda:     { kcal: 0,   p: 0,    c: 0,    f: 0, na: 27360, fib: 0, label: 'Baking soda',    g: { tsp: 4.6, tbsp: 13.8 } },
  cornstarch:      { kcal: 381, p: 0.3,  c: 91,   f: 0.1, na: 9, fib: 0.9,  g: { cup: 128, tbsp: 8, tsp: 2.7 } },
  cola:            { kcal: 39,  p: 0,    c: 10.6, f: 0, na: 4, fib: 0, label: 'Cola',    g: { cup: 240, oz: 29.6, can: 355 } },
  salsa_verde:     { kcal: 36,  p: 1.1,  c: 6.5,  f: 0.9, na: 700, fib: 1.4, label: 'Salsa verde',  g: { cup: 260, tbsp: 16, jar: 453 } },
  yeast:           { kcal: 325, p: 40,   c: 41,   f: 7.6, na: 51, fib: 26.9,  g: { pkg: 7, each: 7, packet: 7, tsp: 3, tbsp: 9 }, note: 'active dry yeast, 1 packet = 7 g', def: { qty: 1, unit: 'packet' }, sold: { pkg: 0.25 } },

  // ---- Supplements & drinks ----------------------------------------------
  whey:            { eat: 1, kcal: 400, p: 80,   c: 8,    f: 5, na: 300, fib: 2,    g: { each: 32, scoop: 32, cup: 120, tbsp: 8 }, label: 'Whey protein', def: { qty: 1, unit: 'scoop' }, note: '1 scoop = 32 g' },
  /* A homemade blend, per 100 g: 2 tbsp chili powder, 1 tbsp cumin, and a
     teaspoon each of paprika, garlic powder, onion powder, oregano, salt and
     cornstarch — about 39 g a batch, enough for two pounds of meat. The
     spices ride at zero here like every other spice in this table, so the
     figures are the salt and the cornstarch: 6 g of salt in 39 g is 6,000 mg
     of sodium per hundred, roughly half what a packet carries. Six recipes
     use it in their method and, until the recipe existed, none listed it. */
  taco_seasoning:  { kcal: 27, p: 0, c: 6.3, f: 0, na: 6000, fib: 0, g: { tbsp: 8, tsp: 2.7, cup: 128 }, label: 'Taco seasoning', note: 'homemade; the Taco Seasoning recipe on the Copycat Shelf' },
  crio_bru:        { eat: 1, kcal: 2,   p: 0.3,  c: 0.3,  f: 0.1, na: 2, fib: 0.3,  g: { cup: 240, oz: 29.6 }, label: 'Crio Bru', note: 'brewed cacao, essentially calorie-free' },
  water:           { kcal: 0,   p: 0,    c: 0,    f: 0, na: 0, fib: 0,    g: { cup: 240, oz: 29.6, tbsp: 15, each: 240 } },

  // ---- Free items (seasonings, non-food) ---------------------------------
  /* Seasonings and non-food items. `split` keeps them off one another's
     shopping line — everything else merges on its food key, but "Vanilla",
     "Paprika" and "Lollipop sticks" would all merge into one row. */
  /* ---- Seasonings the storehouse does not carry ---------------------------
   *
   * These exist to be NAMED, not to be counted. Every one of them used to
   * resolve to `free`, the single catch-all seasoning, which meant the book
   * could not tell a reader that a recipe wanted paprika when the storehouse
   * stocks four seasonings and paprika is not among them. Fresh garlic was
   * flagged as an extra and garlic powder was not, in the same recipe.
   *
   * Their macros are deliberately all zero, exactly as `free` was, so that
   * declaring them changes what the book SAYS about a recipe and nothing
   * about what it computes. A teaspoon of dried oregano is not a nutrition
   * problem. Not knowing you need one, when you are standing in a storehouse
   * that does not sell it, is a problem.
   */
  paprika:         { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 6, cup: 96 }, label: 'Paprika' },
  garlic_powder:   { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 3, tbsp: 9, cup: 144 }, label: 'Garlic powder' },
  onion_powder:    { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 7, cup: 112 }, label: 'Onion powder' },
  cumin:           { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 6, cup: 96 }, label: 'Ground cumin' },
  oregano:         { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 1, tbsp: 3, cup: 48 }, label: 'Dried oregano' },
  thyme:           { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 1, tbsp: 3, cup: 48 }, label: 'Dried thyme' },
  basil:           { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 1, tbsp: 3, cup: 48 }, label: 'Dried basil' },
  ginger:          { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 5, cup: 80 }, label: 'Ground ginger' },
  mustard_powder:  { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 6, cup: 96 }, label: 'Mustard powder' },
  chili_powder:    { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 3, tbsp: 8, cup: 128 }, label: 'Chili powder' },
  white_pepper:    { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 7, cup: 112 }, label: 'White pepper' },
  cilantro:        { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 1, tbsp: 3, cup: 16, each: 20 }, label: 'Cilantro' },
  lime:            { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 5, tbsp: 15, cup: 242, each: 67 }, label: 'Limes' },
  sweetener:       { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 4, tbsp: 12, cup: 192, each: 1 }, label: 'Sweetener' },
  stevia:          { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 4, tbsp: 12, cup: 192, each: 1 }, label: 'Stevia' },
  creatine:        { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 5, tbsp: 15, cup: 240, each: 5 }, label: 'Creatine' },
  pickle_juice:    { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 5, tbsp: 15, cup: 240 }, label: 'Pickle juice' },

  /* The four the storehouse does carry. Named for the same reason as the
     seventeen above, and marked stocked rather than flagged — the point was
     never to warn about pepper, it was to stop every seasoning sharing one
     nameless bucket. While they did, a recipe listing black pepper counted as
     "used by its method" because some other line in the method said garlic
     powder: one key, every alias, any match. */
  black_pepper:    { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 2, tbsp: 7, cup: 112 }, label: 'Black pepper' },
  vanilla:         { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 4, tbsp: 13, cup: 208 }, label: 'Vanilla' },

  free:            { kcal: 0,   p: 0,    c: 0,    f: 0, na: 0, fib: 0,    g: { cup: 100, tbsp: 6, tsp: 2, each: 1, pkg: 1 }, split: true, note: 'seasonings, sweeteners and non-food items' },
  /* Salt is not free. It was scored as though it were until sodium went into
     the table, which is exactly the sort of thing that made the old score
     misleading in a book built on canned goods. */
  salt:            { kcal: 0,   p: 0,    c: 0,    f: 0, na: 38758, fib: 0, g: { cup: 292, tbsp: 18, tsp: 6, each: 6 }, def: { qty: 0.125, unit: 'tsp' }, label: 'Salt', note: 'table salt, 6 g per teaspoon' },
  celery_salt:     { kcal: 0,   p: 0,    c: 0,    f: 0, na: 26000, fib: 0, g: { cup: 230, tbsp: 14, tsp: 4.7 }, def: { qty: 0.5, unit: 'tsp' }, label: 'Celery salt' },
  cinnamon:        { kcal: 247, p: 4,    c: 81,   f: 1.2, na: 10, fib: 53.1,  g: { cup: 124, tbsp: 7.8, tsp: 2.6 }, def: { qty: 1, unit: 'tsp' } },

  /* ---------------------------------------------------------------------
   * Foods the storehouse does not stock.
   *
   * Everything above this line is on the standard order, and the books are
   * written to be cooked from it. These are not: they carry `ext: 1`, which
   * is what lets the app offer them to log without letting Fill draft a day
   * out of things Blake would have to go and buy first.
   *
   * The list is the Best-rated half of the Zone food-block table, minus what
   * the storehouse already carries. The CURATION is the Zone table's — it
   * says what is worth eating. The NUMBERS are the USDA's, fetched by
   * tools/usda-fetch.js from SR Legacy, the same standard-reference set every
   * figure above came from. A Zone block fixes only one macro per food (9 g
   * carbohydrate, 7 g protein, 1.5 g fat) and is silent on the other two, so
   * it could never have been the source.
   *
   * `zone` keeps the table's own block for each food, because it is a
   * judgement rather than something derivable: it is what a person decided
   * the food is FOR, which is the axis the picker's shelf rail speaks.
   *
   * Fish is counted RAW, like the meat above it, because that is the weight
   * you buy and the weight a recipe would state. Two exceptions are marked in
   * their notes.
   * --------------------------------------------------------------------- */

  // ---- fish and seafood: the leanest protein on the list
  salmon:      { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 142, p: 19.8, c: 0, f: 6.3, na: 44, fib: 0, g: { lb: 453.6, oz: 28.35, each: 170 }, def: { qty: 6, unit: 'oz' }, label: 'Salmon', note: 'Atlantic, wild, raw; 1 fillet = 170 g' },
  cod:         { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 82, p: 17.8, c: 0, f: 0.7, na: 54, fib: 0, g: { lb: 453.6, oz: 28.35, each: 170 }, def: { qty: 6, unit: 'oz' }, label: 'Cod', note: 'Atlantic, raw' },
  halibut:     { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 91, p: 18.6, c: 0, f: 1.3, na: 68, fib: 0, g: { lb: 453.6, oz: 28.35, each: 159 }, def: { qty: 6, unit: 'oz' }, label: 'Halibut', note: 'raw' },
  tilapia:     { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 96, p: 20.1, c: 0, f: 1.7, na: 52, fib: 0, g: { lb: 453.6, oz: 28.35, each: 116 }, def: { qty: 6, unit: 'oz' }, label: 'Tilapia', note: 'raw; 1 fillet = 116 g' },
  tuna_steak:  { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 109, p: 24.4, c: 0, f: 0.5, na: 45, fib: 0, g: { lb: 453.6, oz: 28.35 }, def: { qty: 6, unit: 'oz' }, label: 'Tuna steak', note: 'yellowfin, fresh, raw — the leanest protein in the table' },
  trout:       { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 141, p: 19.9, c: 0, f: 6.2, na: 51, fib: 0, g: { lb: 453.6, oz: 28.35, each: 143 }, def: { qty: 6, unit: 'oz' }, label: 'Trout', note: 'rainbow, farmed, raw' },
  haddock:     { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 74, p: 16.3, c: 0, f: 0.5, na: 213, fib: 0, g: { lb: 453.6, oz: 28.35, each: 150 }, def: { qty: 6, unit: 'oz' }, label: 'Haddock', note: 'raw; the sodium is the fish, not a cure' },
  snapper:     { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 100, p: 20.5, c: 0, f: 1.3, na: 64, fib: 0, g: { lb: 453.6, oz: 28.35, each: 170 }, def: { qty: 6, unit: 'oz' }, label: 'Snapper', note: 'mixed species, raw' },
  mackerel:    { ext: 1, eat: 1, zone: 'protein', kcal: 205, p: 18.6, c: 0, f: 13.9, na: 90, fib: 0, g: { lb: 453.6, oz: 28.35, each: 112 }, def: { qty: 5, unit: 'oz' }, label: 'Mackerel', note: 'Atlantic, raw; no lever flag — two thirds of its energy is fat, so it moves both knobs at once' },
  catfish:     { ext: 1, eat: 1, zone: 'protein', kcal: 119, p: 15.2, c: 0, f: 5.9, na: 98, fib: 0, g: { lb: 453.6, oz: 28.35, each: 159 }, def: { qty: 6, unit: 'oz' }, label: 'Catfish', note: 'channel, farmed, raw' },
  sardines:    { ext: 1, eat: 1, zone: 'protein', kcal: 208, p: 24.6, c: 0, f: 11.4, na: 307, fib: 0, g: { can: 92, oz: 28.35 }, def: { qty: 1, unit: 'can' }, label: 'Sardines', note: 'canned in oil, drained, with bone; a tin is 92 g drained' },
  shrimp:      { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 71, p: 13.6, c: 0.9, f: 1, na: 566, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 145, each: 15 }, def: { qty: 4, unit: 'oz' }, label: 'Shrimp', note: 'raw. The sodium is high because the USDA figure is for shrimp treated to retain moisture, which is what a shop sells; untreated is nearer 120 mg' },
  crab:        { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 87, p: 18.1, c: 0, f: 1.1, na: 293, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 135 }, def: { qty: 4, unit: 'oz' }, label: 'Crab meat', note: 'blue, raw' },
  lobster:     { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 77, p: 16.5, c: 0, f: 0.8, na: 423, fib: 0, g: { lb: 453.6, oz: 28.35 }, def: { qty: 4, unit: 'oz' }, label: 'Lobster', note: 'northern, raw' },
  scallops:    { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 69, p: 12.1, c: 3.2, f: 0.5, na: 392, fib: 0, g: { lb: 453.6, oz: 28.35, each: 15 }, def: { qty: 4, unit: 'oz' }, label: 'Scallops', note: 'mixed species, raw' },
  clams:       { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 86, p: 14.7, c: 3.6, f: 1, na: 601, fib: 0, g: { lb: 453.6, oz: 28.35, can: 184 }, def: { qty: 4, unit: 'oz' }, label: 'Clams', note: 'mixed species, raw' },
  calamari:    { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 92, p: 15.6, c: 3.1, f: 1.4, na: 44, fib: 0, g: { lb: 453.6, oz: 28.35 }, def: { qty: 4, unit: 'oz' }, label: 'Calamari', note: 'squid, mixed species, raw' },

  /* ---- oils, nuts and spreads.
     The fat shelf held one food before this — cooking oil — which is why the
     combo builder kept offering three-quarters of a tablespoon of Oil for
     breakfast: it was the only fat lever on the shelf and there was nothing
     to lose the argument to. */
  olive_oil:    { ext: 1, shelf: 'oil', lever: 1, zone: 'fat', kcal: 884, p: 0, c: 0, f: 100, na: 2, fib: 0, g: { cup: 216, tbsp: 13.5, tsp: 4.5 }, def: { qty: 1, unit: 'tbsp' }, label: 'Olive oil' },
  almonds:      { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 579, p: 21.2, c: 21.6, f: 49.9, na: 1, fib: 12.5, g: { cup: 143, oz: 28.35, tbsp: 9, each: 1.2 }, def: { qty: 1, unit: 'oz' }, label: 'Almonds', note: 'whole, raw; 1 nut = 1.2 g' },
  almond_butter: { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 614, p: 21, c: 18.8, f: 55.5, na: 7, fib: 10.3, g: { cup: 256, tbsp: 16, tsp: 5.3 }, def: { qty: 1, unit: 'tbsp' }, label: 'Almond butter', note: 'plain, unsalted' },
  walnuts:      { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 654, p: 15.2, c: 13.7, f: 65.2, na: 2, fib: 6.7, g: { cup: 117, oz: 28.35, tbsp: 7.3 }, def: { qty: 1, unit: 'oz' }, label: 'Walnuts', note: 'english, shelled' },
  cashews:      { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 553, p: 18.2, c: 30.2, f: 43.8, na: 12, fib: 3.3, g: { cup: 137, oz: 28.35, each: 1.4 }, def: { qty: 1, unit: 'oz' }, label: 'Cashews', note: 'raw' },
  macadamia:    { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 718, p: 7.9, c: 13.8, f: 75.8, na: 5, fib: 8.6, g: { cup: 134, oz: 28.35, each: 2.5 }, def: { qty: 1, unit: 'oz' }, label: 'Macadamia nuts', note: 'raw; the densest food in the table' },
  peanuts:      { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 567, p: 25.8, c: 16.1, f: 49.2, na: 18, fib: 8.5, g: { cup: 146, oz: 28.35, each: 1 }, def: { qty: 1, unit: 'oz' }, label: 'Peanuts', note: 'all types, raw' },
  avocado:      { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 160, p: 2, c: 8.5, f: 14.7, na: 7, fib: 6.7, g: { cup: 150, oz: 28.35, each: 201 }, def: { qty: 0.5, unit: 'each' }, label: 'Avocado', note: 'raw, all commercial varieties; 1 whole = 201 g' },
  olives:       { ext: 1, eat: 1, zone: 'fat', kcal: 116, p: 0.8, c: 6, f: 10.9, na: 735, fib: 1.6, g: { cup: 135, oz: 28.35, each: 4 }, def: { qty: 5, unit: 'each' }, label: 'Olives', note: 'ripe, canned; no lever flag — a fat you would have to eat 700 mg of sodium to move' },
  tahini:       { ext: 1, eat: 1, lever: 1, zone: 'fat', kcal: 595, p: 17, c: 21.2, f: 53.8, na: 115, fib: 9.3, g: { cup: 240, tbsp: 15, tsp: 5 }, def: { qty: 1, unit: 'tbsp' }, label: 'Tahini', note: 'from roasted and toasted kernels' },

  /* ---- meat, poultry and eggs. Counted raw where a raw figure exists, and
     the two cured ones say so in their notes — the salt is the cure, not the
     meat, and it is most of what there is to know about them. */
  turkey_breast:    { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 114, p: 23.7, c: 0.1, f: 1.5, na: 113, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 140 }, def: { qty: 5, unit: 'oz' }, label: 'Turkey breast', note: 'meat only, raw' },
  turkey_deli:      { ext: 1, eat: 1, zone: 'protein', kcal: 109, p: 21.8, c: 3.5, f: 0.8, na: 772, fib: 0.5, g: { lb: 453.6, oz: 28.35, each: 28, slice: 28 }, def: { qty: 2, unit: 'slice' }, label: 'Sliced turkey breast', note: 'low-salt deli; no lever flag — 772 mg is most of a topper ceiling' },
  turkey_ground:    { ext: 1, zone: 'protein', kcal: 150, p: 18.7, c: 0, f: 8.3, na: 69, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 225 }, def: { qty: 4, unit: 'oz' }, label: 'Ground turkey', note: '93/7, raw; no eat flag — it is an ingredient, like the ground beef above' },
  turkey_bacon:     { ext: 1, eat: 1, zone: 'protein', kcal: 368, p: 29.5, c: 4.2, f: 25.9, na: 2020, fib: 0, g: { oz: 28.35, each: 7, slice: 7 }, def: { qty: 2, unit: 'slice' }, label: 'Turkey bacon', note: 'cooked, because that is the form eaten \u2014 so the slice is the COOKED 7 g one, not the 14 g it went into the pan as. Two slices carry 283 mg of sodium; the Zone table rates it Best on its macros alone' },
  canadian_bacon:   { ext: 1, eat: 1, zone: 'protein', kcal: 146, p: 28.3, c: 1.8, f: 2.8, na: 993, fib: 0, g: { oz: 28.35, each: 28, slice: 28 }, def: { qty: 2, unit: 'slice' }, label: 'Canadian bacon', note: 'cooked. Very lean and very salty — no lever flag for the same reason as the deli turkey' },
  ground_beef_lean: { ext: 1, zone: 'protein', kcal: 152, p: 20.8, c: 0, f: 7, na: 66, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 225 }, def: { qty: 4, unit: 'oz' }, label: 'Lean ground beef', note: '93/7, raw; the storehouse ground beef above is 90/10' },
  ground_beef_96_4: { ext: 1, eat: 1, lever: 1, zone: 'protein', kcal: 121, p: 21.6, c: 0, f: 4, na: 65, fib: 0, g: { lb: 453.6, oz: 28.35, cup: 225 }, def: { qty: 4, unit: 'oz' }, label: 'Extra lean ground beef (96/4)', note: '96/4, raw; clean protein lever for macro meal prep' },
  greek_yogurt:     { ext: 1, shelf: 'dairy', eat: 1, lever: 1, zone: 'protein', kcal: 73, p: 10, c: 3.9, f: 1.9, na: 34, fib: 0, g: { cup: 245, tbsp: 15, oz: 28.35 }, def: { qty: 0.5, unit: 'cup' }, label: 'Greek yogurt', note: 'plain, low-fat' },
  plain_yogurt:     { ext: 1, shelf: 'dairy', eat: 1, zone: 'protein', kcal: 63, p: 5.3, c: 7, f: 1.6, na: 70, fib: 0, g: { cup: 245, tbsp: 15 }, def: { qty: 0.5, unit: 'cup' }, label: 'Plain yogurt', note: 'low-fat, unsweetened — the vanilla one above carries the sugar' },
  egg_sub:          { ext: 1, shelf: 'dairy', eat: 1, lever: 1, zone: 'protein', kcal: 48, p: 10, c: 2, f: 0, na: 199, fib: 0, g: { cup: 245, tbsp: 15, oz: 28.35 }, def: { qty: 0.25, unit: 'cup' }, label: 'Egg substitute', note: 'liquid, fat free' },

  /* ---- vegetables. `side` and `veg` together, the way every vegetable above
     carries them: `side` is what lets the fibre step reach for one, `veg` is
     what the shelf rail reads. */
  asparagus:      { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 20, p: 2.2, c: 3.9, f: 0.1, na: 2, fib: 2.1, g: { lb: 453.6, cup: 134, each: 16 }, def: { qty: 1, unit: 'cup' }, label: 'Asparagus' },
  brussels:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 43, p: 3.4, c: 9, f: 0.3, na: 25, fib: 3.8, g: { lb: 453.6, cup: 88, each: 19 }, def: { qty: 1, unit: 'cup' }, label: 'Brussels sprouts' },
  cauliflower:    { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 25, p: 1.9, c: 5, f: 0.3, na: 30, fib: 2, g: { lb: 453.6, cup: 107, each: 588 }, def: { qty: 1, unit: 'cup' }, label: 'Cauliflower', note: '1 head = 588 g' },
  cabbage:        { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 25, p: 1.3, c: 5.8, f: 0.1, na: 18, fib: 2.5, g: { lb: 453.6, cup: 89, each: 908 }, def: { qty: 1, unit: 'cup' }, label: 'Cabbage', note: 'shredded; 1 head = 908 g' },
  kale:           { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 35, p: 2.9, c: 4.4, f: 1.5, na: 53, fib: 4.1, g: { lb: 453.6, cup: 21, oz: 28.35 }, def: { qty: 2, unit: 'cup' }, label: 'Kale', note: 'chopped; a cup of leaves is only 21 g' },
  spinach:        { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 23, p: 2.9, c: 3.6, f: 0.4, na: 79, fib: 2.2, g: { lb: 453.6, cup: 30, oz: 28.35 }, def: { qty: 2, unit: 'cup' }, label: 'Spinach' },
  swiss_chard:    { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 19, p: 1.8, c: 3.7, f: 0.2, na: 213, fib: 1.6, g: { lb: 453.6, cup: 36 }, def: { qty: 2, unit: 'cup' }, label: 'Swiss chard' },
  collards:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 32, p: 3, c: 5.4, f: 0.6, na: 17, fib: 4, g: { lb: 453.6, cup: 36 }, def: { qty: 2, unit: 'cup' }, label: 'Collard greens' },
  bok_choy:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 13, p: 1.5, c: 2.2, f: 0.2, na: 65, fib: 1, g: { lb: 453.6, cup: 70, each: 840 }, def: { qty: 1, unit: 'cup' }, label: 'Bok choy' },
  zucchini:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 17, p: 1.2, c: 3.1, f: 0.3, na: 8, fib: 1, g: { lb: 453.6, cup: 124, each: 196 }, def: { qty: 1, unit: 'each' }, label: 'Zucchini' },
  yellow_squash:  { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 19, p: 1, c: 3.9, f: 0.3, na: 2, fib: 1, g: { lb: 453.6, cup: 113, each: 196 }, def: { qty: 1, unit: 'each' }, label: 'Yellow squash' },
  spaghetti_squash: { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 31, p: 0.6, c: 6.9, f: 0.6, na: 17, fib: 1.5, g: { lb: 453.6, cup: 101, each: 900 }, def: { qty: 1, unit: 'cup' }, label: 'Spaghetti squash' },
  eggplant:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 25, p: 1, c: 5.9, f: 0.2, na: 2, fib: 3, g: { lb: 453.6, cup: 82, each: 458 }, def: { qty: 1, unit: 'cup' }, label: 'Eggplant' },
  mushrooms:      { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 22, p: 3.1, c: 3.3, f: 0.3, na: 5, fib: 1, g: { lb: 453.6, cup: 70, each: 18 }, def: { qty: 1, unit: 'cup' }, label: 'Mushrooms', note: 'white, raw' },
  okra:           { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 33, p: 1.9, c: 7.5, f: 0.2, na: 7, fib: 3.2, g: { lb: 453.6, cup: 100 }, def: { qty: 1, unit: 'cup' }, label: 'Okra' },
  leeks:          { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 61, p: 1.5, c: 14.2, f: 0.3, na: 20, fib: 1.8, g: { lb: 453.6, cup: 89, each: 89 }, def: { qty: 1, unit: 'cup' }, label: 'Leeks' },
  artichoke:      { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 47, p: 3.3, c: 10.5, f: 0.2, na: 94, fib: 5.4, g: { lb: 453.6, cup: 168, each: 128 }, def: { qty: 1, unit: 'each' }, label: 'Artichokes' },
  turnip:         { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 28, p: 0.9, c: 6.4, f: 0.1, na: 67, fib: 1.8, g: { lb: 453.6, cup: 130, each: 122 }, def: { qty: 1, unit: 'cup' }, label: 'Turnips' },
  turnip_greens:  { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 32, p: 1.5, c: 7.1, f: 0.3, na: 40, fib: 3.2, g: { lb: 453.6, cup: 55 }, def: { qty: 2, unit: 'cup' }, label: 'Turnip greens' },
  celery:         { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 14, p: 0.7, c: 3, f: 0.2, na: 80, fib: 1.6, g: { lb: 453.6, cup: 101, each: 40 }, def: { qty: 2, unit: 'each' }, label: 'Celery', note: '1 stalk = 40 g' },
  radish:         { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 16, p: 0.7, c: 3.4, f: 0.1, na: 39, fib: 1.6, g: { lb: 453.6, cup: 116, each: 4.5 }, def: { qty: 1, unit: 'cup' }, label: 'Radishes' },
  romaine:        { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 17, p: 1.2, c: 3.3, f: 0.3, na: 8, fib: 2.1, g: { lb: 453.6, cup: 47, each: 626 }, def: { qty: 2, unit: 'cup' }, label: 'Romaine lettuce', note: '1 head = 626 g' },
  snow_peas:      { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 42, p: 2.8, c: 7.6, f: 0.2, na: 4, fib: 2.6, g: { lb: 453.6, cup: 63 }, def: { qty: 1, unit: 'cup' }, label: 'Snow peas' },
  bean_sprouts:   { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 30, p: 3, c: 5.9, f: 0.2, na: 6, fib: 1.8, g: { lb: 453.6, cup: 104 }, def: { qty: 1, unit: 'cup' }, label: 'Bean sprouts', note: 'mung' },
  alfalfa:        { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 23, p: 4, c: 2.1, f: 0.7, na: 6, fib: 1.9, g: { cup: 33, oz: 28.35 }, def: { qty: 1, unit: 'cup' }, label: 'Alfalfa sprouts' },
  water_chestnut: { ext: 1, side: true, starch: 1, zone: 'carbohydrate', kcal: 97, p: 1.4, c: 23.9, f: 0.1, na: 14, fib: 3, g: { can: 227, cup: 124, each: 8.7 }, def: { qty: 0.5, unit: 'cup' }, label: 'Water chestnuts' },
  bamboo_shoots:  { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 27, p: 2.6, c: 5.2, f: 0.3, na: 4, fib: 2.2, g: { can: 227, cup: 151 }, def: { qty: 0.5, unit: 'cup' }, label: 'Bamboo shoots' },
  watercress:     { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 11, p: 2.3, c: 1.3, f: 0.1, na: 41, fib: 0.5, g: { cup: 34, oz: 28.35 }, def: { qty: 2, unit: 'cup' }, label: 'Watercress', note: 'the lightest food in the table — a cup is 34 g and 4 kcal' },
  endive:         { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 17, p: 1.3, c: 3.4, f: 0.2, na: 22, fib: 3.1, g: { cup: 25, each: 513 }, def: { qty: 2, unit: 'cup' }, label: 'Endive' },
  jalapeno:       { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 29, p: 0.9, c: 6.5, f: 0.4, na: 3, fib: 2.8, g: { cup: 90, each: 14 }, def: { qty: 1, unit: 'each' }, label: 'Jalapeños' },
  sauerkraut:     { ext: 1, side: true, veg: 1, zone: 'carbohydrate', kcal: 19, p: 0.9, c: 4.3, f: 0.1, na: 661, fib: 2.9, g: { can: 425, cup: 142 }, def: { qty: 0.5, unit: 'cup' }, label: 'Sauerkraut', note: 'canned; half a cup is 470 mg of sodium — the brine is the point and it is most of the salt' },

  /* ---- legumes and a dip. `side` like the beans above; the two canned ones
     carry the salt of the tin, as everything canned in this table does. */
  chickpeas:      { ext: 1, side: true, zone: 'carbohydrate', kcal: 139, p: 7.1, c: 22.5, f: 2.8, na: 246, fib: 6.4, g: { can: 250, cup: 164 }, def: { qty: 0.5, unit: 'cup' }, label: 'Chickpeas', note: 'canned, drained' },
  kidney_beans:   { ext: 1, side: true, zone: 'carbohydrate', kcal: 124, p: 8, c: 21.5, f: 1.1, na: 231, fib: 5.5, g: { can: 250, cup: 177 }, def: { qty: 0.5, unit: 'cup' }, label: 'Kidney beans', note: 'canned, drained' },
  lentils:        { ext: 1, side: true, zone: 'carbohydrate', kcal: 116, p: 9, c: 20.1, f: 0.4, na: 2, fib: 7.9, g: { cup: 198 }, def: { qty: 0.5, unit: 'cup' }, label: 'Lentils', note: 'cooked, unsalted — the most fibre per calorie in the table' },
  hummus:         { ext: 1, eat: 1, zone: 'carbohydrate', kcal: 237, p: 7.8, c: 15, f: 17.8, na: 426, fib: 5.5, g: { cup: 246, tbsp: 15, oz: 28.35 }, def: { qty: 2, unit: 'tbsp' }, label: 'Hummus', note: 'the Zone table blocks it as carbohydrate; by calories it is mostly fat, and the app will shelve it where the arithmetic puts it' },

  /* ---- fruit. `side` only, the way every fruit above carries it. */
  blueberries:  { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 57, p: 0.7, c: 14.5, f: 0.3, na: 1, fib: 2.4, g: { cup: 148, oz: 28.35, lb: 453.6 }, def: { qty: 0.5, unit: 'cup' }, label: 'Blueberries' },
  strawberries: { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 32, p: 0.7, c: 7.7, f: 0.3, na: 1, fib: 2, g: { cup: 152, each: 12, lb: 453.6 }, def: { qty: 1, unit: 'cup' }, label: 'Strawberries' },
  raspberries:  { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 52, p: 1.2, c: 11.9, f: 0.7, na: 1, fib: 6.5, g: { cup: 123, lb: 453.6 }, def: { qty: 1, unit: 'cup' }, label: 'Raspberries' },
  blackberries: { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 43, p: 1.4, c: 9.6, f: 0.5, na: 1, fib: 5.3, g: { cup: 144, lb: 453.6 }, def: { qty: 1, unit: 'cup' }, label: 'Blackberries' },
  cherries:     { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 63, p: 1.1, c: 16, f: 0.2, na: 0, fib: 2.1, g: { cup: 154, each: 8, lb: 453.6 }, def: { qty: 1, unit: 'cup' }, label: 'Cherries', note: 'sweet' },
  apricots:     { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 48, p: 1.4, c: 11.1, f: 0.4, na: 1, fib: 2, g: { cup: 155, each: 35, lb: 453.6 }, def: { qty: 3, unit: 'each' }, label: 'Apricots' },
  peach:        { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 39, p: 0.9, c: 9.5, f: 0.3, na: 0, fib: 1.5, g: { cup: 154, each: 150, lb: 453.6 }, def: { qty: 1, unit: 'each' }, label: 'Peaches' },
  pear:         { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 57, p: 0.4, c: 15.2, f: 0.1, na: 1, fib: 3.1, g: { cup: 140, each: 178, lb: 453.6 }, def: { qty: 1, unit: 'each' }, label: 'Pears' },
  plum:         { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 46, p: 0.7, c: 11.4, f: 0.3, na: 0, fib: 1.4, g: { cup: 165, each: 66, lb: 453.6 }, def: { qty: 1, unit: 'each' }, label: 'Plums' },
  nectarine:    { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 44, p: 1.1, c: 10.6, f: 0.3, na: 0, fib: 1.7, g: { cup: 143, each: 142, lb: 453.6 }, def: { qty: 1, unit: 'each' }, label: 'Nectarines' },
  kiwi:         { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 61, p: 1.1, c: 14.7, f: 0.5, na: 3, fib: 3, g: { cup: 180, each: 69 }, def: { qty: 1, unit: 'each' }, label: 'Kiwi' },
  grapefruit:   { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 32, p: 0.6, c: 8.1, f: 0.1, na: 0, fib: 1.1, g: { cup: 230, each: 246 }, def: { qty: 0.5, unit: 'each' }, label: 'Grapefruit' },
  tangerine:    { ext: 1, shelf: 'fruit', side: true, zone: 'carbohydrate', kcal: 53, p: 0.8, c: 13.3, f: 0.3, na: 2, fib: 1.8, g: { cup: 195, each: 88 }, def: { qty: 1, unit: 'each' }, label: 'Tangerines' },

  /* ---- a grain. No flags, like the oats and rice above it: dry weight, and
     not a thing you eat as it comes. */
  barley:       { ext: 1, starch: 1, zone: 'carbohydrate', kcal: 352, p: 9.9, c: 77.7, f: 1.2, na: 9, fib: 15.6, g: { cup: 200, lb: 453.6, oz: 28.35 }, def: { qty: 0.25, unit: 'cup' }, label: 'Pearl barley', note: 'dry, as the recipes would state it' },
  /* Cooked jasmine rice, eaten as it comes (like rice_cooked above), so a
     search for "jasmine" finds the cooked carb lever. */
  rice_jasmine: { ext: 1, starch: 1, eat: 1, lever: 1, zone: 'carbohydrate', kcal: 129, p: 2.7, c: 28.2, f: 0.3, na: 1, fib: 0.4, g: { cup: 158, oz: 28.35, lb: 453.6 }, def: { qty: 1, unit: 'cup' }, label: 'Jasmine rice', note: 'cooked, unsalted; 1 cup = 158 g' },

  /* ---- the Mexican shelf, 2026-09-26. Two raw ingredients the storehouse
     does not carry, then five things the Copycat Shelf makes and other
     recipes spoon in, each per 100 g as it comes out of the pan.
     The made ones are worked from their own recipe's totals over a cooked
     weight: sweet pork = 4,340 kcal over ~1,320 g (3 lb of shoulder to about
     950 g, the cola, sugar and salsa reduced by half); cilantro lime rice =
     2 cups dry to ~1,130 g cooked; tomatillo ranch = ~465 g as blended.
     Guacamole, pico and the sauce are the sum of what goes in. */
  flank_steak:  { kcal: 165, p: 21.2, c: 0, f: 8.2, na: 55, fib: 0, g: { lb: 453.6, oz: 28.35 }, label: 'Flank steak', note: 'raw, trimmed; skirt or sirloin are close' },
  corn_tortilla: { kcal: 218, p: 5.7, c: 44.6, f: 2.9, na: 45, fib: 6.3, g: { each: 26 }, label: 'Corn tortillas', note: '6 in, 26 g' },
  carne_asada:  { kcal: 228, p: 29.4, c: 0.5, f: 12.3, na: 190, fib: 0.1, g: { lb: 453.6, oz: 28.35, cup: 140 }, label: 'Carne asada', note: 'homemade; the Carne Asada recipe, grilled and sliced: its totals over ~650 g cooked from 2 lb raw' },
  sweet_pork:   { kcal: 329, p: 18.2, c: 19.7, f: 19.7, na: 558, fib: 0.3, g: { lb: 453.6, oz: 28.35, cup: 140 }, label: 'Sweet pork', note: 'homemade; the Sweet Pork Barbacoa recipe, shredded in its sauce' },
  cilantro_lime_rice: { kcal: 132, p: 2.1, c: 26.2, f: 2.1, na: 430, fib: 0.4, g: { cup: 190 }, label: 'Cilantro lime rice', note: 'homemade; the Cilantro Lime Rice recipe, cooked' },
  tomatillo_ranch: { kcal: 240, p: 2.6, c: 5.2, f: 23.2, na: 717, fib: 0.5, g: { cup: 240, tbsp: 15 }, label: 'Tomatillo ranch', note: 'homemade; the Creamy Tomatillo Ranch recipe' },
  guacamole:    { kcal: 150, p: 1.9, c: 8.6, f: 13.3, na: 290, fib: 6.1, g: { cup: 230, tbsp: 15 }, label: 'Guacamole', note: 'homemade; avocado, lime, onion, cilantro, jalapeño, salt' },
  pico_de_gallo: { kcal: 21, p: 0.8, c: 4.6, f: 0.2, na: 240, fib: 1.2, g: { cup: 160, tbsp: 10 }, label: 'Pico de gallo', note: 'homemade; tomato, onion, jalapeño, cilantro, lime, salt' },
  enchilada_sauce: { kcal: 59, p: 1.3, c: 7.2, f: 3.6, na: 380, fib: 2, g: { cup: 245, tbsp: 15 }, label: 'Red enchilada sauce', note: 'homemade; tomato sauce, water, chili powder, a roux, simmered to about 800 g' },
  /* ---- five small things the 2026-09-26 recipe audit needed. */
  cream_of_tartar: { kcal: 258, p: 0, c: 61.5, f: 0, na: 52, fib: 0.2, g: { tsp: 3, tbsp: 9 }, label: 'Cream of tartar' },
  italian_seasoning: { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0, g: { tsp: 1, tbsp: 3 }, label: 'Italian seasoning', note: 'dried herbs; counted as nothing, like the other dried herbs' },
  worcestershire: { kcal: 78, p: 0, c: 19.5, f: 0, na: 980, fib: 0, g: { tsp: 5.7, tbsp: 17, cup: 275 }, label: 'Worcestershire sauce' },
  pickles:      { kcal: 12, p: 0.5, c: 2.4, f: 0.3, na: 875, fib: 1, g: { each: 7, cup: 143 }, label: 'Dill pickles', note: 'dill pickle slices; 1 slice = 7 g' },
  /* ---- the meatloaf's glaze, 2026-10-06. Nothing in either book used vinegar,
     so the table never had it, and "apple cider vinegar" fell through to the
     longest name it did know: apple. USDA cider vinegar; white is the same to
     within a calorie. Its energy is its acid, which no macro counts. The same
     day the glaze went to mustard, which the order carries, and vinegar moved
     to the meatloaf's lift; kept here so a line that names it still reads as
     vinegar, not apple. */
  vinegar:      { kcal: 21, p: 0, c: 0.9, f: 0, na: 5, fib: 0, g: { tsp: 5, tbsp: 15, cup: 239 }, label: 'Vinegar', note: 'cider or white' },
  /* ---- the comfort dinners, 2026-10-06. Broth was not here, so "8 cups
     chicken broth" fell through to the longest name it knew and was priced as
     a kilo of canned chicken. A carton's worth, regular salt; the storehouse
     carries none, and the soups in the book make their own from water.
     Tater tots are the frozen bag, 9 pieces to 86 g; the book's Homemade
     Tater Tots come out within a few per cent of them. */
  broth:        { kcal: 5, p: 0.4, c: 0.4, f: 0.2, na: 360, fib: 0, g: { cup: 240, can: 411 }, label: 'Broth', note: 'chicken or beef, from a carton or can' },
  /* Dry egg noodles weigh 38 g a cup to macaroni's 105, so "3 cups egg
     noodles" read as pasta would have counted nearly three times the food. */
  egg_noodles:  { kcal: 384, p: 14.2, c: 71.3, f: 4.4, na: 21, fib: 3.3, g: { cup: 38, oz: 28.35, lb: 453.6, pkg: 340 }, label: 'Egg noodles', note: 'dry; the ribbon pasta on the standard order' },
  tater_tots:   { kcal: 186, p: 2.3, c: 23.3, f: 9.3, na: 488, fib: 2.3, g: { each: 9.5, cup: 86, lb: 453.6, oz: 28.35 }, label: 'Tater tots', note: 'frozen; 9 pieces = 86 g' },
};

/*
 * Ingredient name -> food key. Matching is done on the longest alias that the
 * ingredient text starts with or contains, so order in this object does not
 * matter but specificity does: "cream of chicken soup" must exist alongside
 * "chicken" and wins because it is longer.
 */
/* 'large egg' resolves to the egg entry outright rather than falling into the
   size block, because that entry's `each` weight of 50 g is already the large
   egg — it is the USDA standard size. Without this, "2 large eggs" was weighed
   as three. No recipe in the collection says it today; the editor runs the
   same parser over whatever somebody types, which is where it would have
   surfaced. */
const ALIASES = {
  'large egg': 'egg', 'large eggs': 'egg',
  'jumbo egg': 'egg', 'jumbo eggs': 'egg',
  // dairy & eggs
  'milk': 'milk', '2% milk': 'milk', 'cold milk': 'milk', 'splash milk': 'milk', 'whole milk': 'milk',
  'dry milk': 'dry_milk', 'dry milk powder': 'dry_milk', 'non-fat dry milk': 'dry_milk', 'nonfat dry milk': 'dry_milk',
  'evaporated milk': 'evaporated_milk',
  'cottage cheese': 'cottage_cheese', 'cottage/cream cheese': 'cottage_cheese',
  'cream cheese': 'cream_cheese',
  'cheddar': 'cheddar', 'cheddar cheese': 'cheddar', 'cheddar slices': 'cheddar', 'cheddar slice': 'cheddar', 'cheese': 'cheddar',
  /* Kept after the cheddar line so that bare "cheese" still means cheddar,
     which is the cheese the storehouse carries and the one every other recipe
     means by the word. */
  'parmesan': 'parmesan', 'parmesan cheese': 'parmesan', 'grated parmesan': 'parmesan',
  'sour cream': 'sour_cream',
  'vanilla yogurt': 'vanilla_yogurt', 'yogurt': 'vanilla_yogurt',
  'butter': 'butter', 'melted butter': 'butter', 'spray butter': 'spray_butter',
  'egg': 'egg', 'eggs': 'egg', 'hard-boiled eggs': 'egg', 'hard boiled eggs': 'egg', 'soft-boiled eggs': 'egg',
  'scrambled eggs': 'egg', 'egg whites': 'egg_white', 'egg white': 'egg_white',

  // meat & fish
  'chicken breast': 'chicken_breast', 'chicken breasts': 'chicken_breast',
  'canned chicken': 'chicken_canned', 'chicken': 'chicken_canned',
  'ground beef': 'ground_beef',
  /* Roast beef is a roast you cooked and sliced, not a packet from a deli
     counter. The two differ by fifteen times on sodium — 60 mg per hundred
     grams against 900 — and the deli reading was landing on a lettuce
     roll-up that a drafted week served four times, which is most of a day's
     salt ceiling from a dish that is meat and a leaf. Deli is still reachable
     by asking for it by name. */
  'beef roast': 'beef_roast',
  'roast beef': 'cooked_beef', 'sliced roast beef': 'cooked_beef',
  'deli roast beef': 'roast_beef_deli', 'sliced deli roast beef': 'roast_beef_deli',
  'stewing beef': 'stewing_beef', 'cooked shredded beef': 'cooked_beef', 'shredded beef': 'cooked_beef',
  'pork roast': 'pork_roast', 'shredded pork roast': 'pork_roast',
  'ham': 'ham', 'sliced ham': 'ham', 'diced ham': 'ham',
  'sausage': 'pork_sausage', 'pork sausage': 'pork_sausage', 'cooked pork sausage': 'pork_sausage',
  'cooked sausage links': 'pork_sausage', 'sausage links': 'pork_sausage',
  'beef franks': 'beef_frank', 'beef frank': 'beef_frank', 'sliced beef franks': 'beef_frank', 'franks': 'beef_frank',
  'tuna': 'tuna',

  // beans
  'black beans': 'black_beans', 'pinto beans': 'pinto_beans',
  'great northern beans': 'white_beans', 'white beans': 'white_beans',
  'refried beans': 'refried_beans', 'pork and beans': 'pork_and_beans',

  // grains
  'oats': 'oats', 'rolled oats': 'oats', 'oat flour': 'oat_flour',
  'flour': 'flour',
  'rice': 'rice_dry', 'cooked rice': 'rice_cooked',
  'taco seasoning': 'taco_seasoning',
  'pancake mix': 'pancake_mix', 'waffle mix': 'pancake_mix',
  'macaroni': 'pasta', 'ribbon pasta': 'pasta', 'spaghetti': 'pasta', 'pasta': 'pasta', 'rotini': 'pasta',
  'bread': 'bread', 'bread slices': 'bread', 'bread slice': 'bread', 'slices bread': 'bread',
  'wheat bread': 'wheat_bread',
  'tortillas': 'tortilla', 'tortilla': 'tortilla', 'small tortillas': 'tortilla_small',
  'buns': 'bun', 'hamburger buns': 'bun', 'hot dog buns': 'bun', 'slider buns': 'slider_bun',
  'breadcrumbs': 'breadcrumbs',
  "honey nut o's": 'cereal_o', 'honey nut os': 'cereal_o', 'cereal': 'cereal_o',
  'biscuit dough': 'biscuit_dough',

  // potatoes
  'potatoes': 'potato', 'potato': 'potato', 'cubed potatoes': 'potato', 'diced potatoes': 'potato',
  'grated potatoes': 'potato', 'grated potato': 'potato', 'russet potatoes': 'potato',
  'baked potatoes': 'potato', 'fried cubed potatoes': 'potato',
  'instant potatoes': 'instant_potato', 'mashed potatoes': 'mashed_potato',

  // vegetables
  'carrots': 'carrot', 'carrot': 'carrot', 'chopped carrots': 'carrot',
  'green beans': 'green_beans', 'corn': 'corn', 'broccoli': 'broccoli', 'cooked broccoli': 'broccoli',
  'lettuce': 'lettuce', 'chopped lettuce': 'lettuce', 'shredded lettuce': 'lettuce',
  'lettuce leaves': 'lettuce', 'head lettuce': 'lettuce',
  'onion': 'onion', 'onions': 'onion',
  'tomato': 'tomato', 'tomatoes': 'tomato', 'diced tomatoes': 'tomato_canned',
  'bell pepper': 'bell_pepper', 'bell peppers': 'bell_pepper',
  'pepperoncini': 'pepperoncini', 'pepperoncinis': 'pepperoncini', 'pepperoncini peppers': 'pepperoncini',
  'cucumber': 'cucumber', 'cucumbers': 'cucumber', 'diced cucumber': 'cucumber', 'diced cucumbers': 'cucumber',
  'cucumber spears': 'cucumber', 'fresh cucumber slices': 'cucumber',
  'garlic': 'garlic',

  // fruit
  'apple': 'apple', 'apples': 'apple', 'diced apple': 'apple', 'sliced apple': 'apple', 'fresh apples': 'apple',
  'banana': 'banana', 'bananas': 'banana', 'sliced banana': 'banana', 'mashed banana': 'banana',
  'mashed bananas': 'banana', 'frozen banana': 'banana', 'ripe bananas': 'banana',
  'orange': 'orange', 'oranges': 'orange', 'fresh orange': 'orange',
  'grapes': 'grapes', 'fresh grapes': 'grapes',
  'peaches': 'peaches_canned', 'pears': 'pears_canned',
  'applesauce': 'applesauce', 'raisins': 'raisins',
  'fresh fruit': 'fruit_generic', 'frozen fruit': 'fruit_generic', 'crushed fruit': 'fruit_generic',
  'fruit': 'fruit_generic', 'fresh grapes/fruit': 'grapes',

  // sauces & condiments
  'salsa': 'salsa', 'tomato sauce': 'tomato_sauce', 'spaghetti sauce': 'spaghetti_sauce',
  'tomato soup': 'tomato_soup',
  'cream of chicken': 'cream_soup_chx', 'cream of chicken soup': 'cream_soup_chx',
  'cream of mushroom': 'cream_soup_mush', 'cream of mushroom soup': 'cream_soup_mush',
  'chicken rotini soup': 'soup_rts',
  'ketchup': 'ketchup',
  'mustard': 'mustard', 'yellow mustard': 'mustard', 'mustard/salsa': 'mustard',
  'mayo': 'mayo', 'light mayo': 'light_mayo', 'pb': 'peanut_butter', 'peanut butter': 'peanut_butter',
  'ranch dressing': 'ranch', 'ranch': 'ranch', 'light ranch': 'light_ranch',
  'bbq sauce': 'bbq_sauce', 'soy sauce': 'soy_sauce', 'hot sauce': 'hot_sauce',
  'brown gravy mix': 'gravy_mix', 'chicken gravy mix': 'gravy_mix', 'beef gravy mix': 'gravy_mix', 'gravy mix': 'gravy_mix',
  'syrup': 'syrup', 'honey': 'honey',
  'jam': 'jam', 'strawberry jam': 'jam', 'raspberry jam': 'jam', 'jelly': 'jam',
  'oil': 'oil',

  // baking & sweets
  'sugar': 'sugar', 'brown sugar': 'brown_sugar', 'powdered sugar': 'powdered_sugar',
  'cinnamon sugar': 'cinnamon_sugar',
  'cocoa': 'cocoa', 'cocoa powder': 'cocoa',
  'chocolate chips': 'chocolate_chips', 'chocolate chips/cake mix': 'chocolate_chips',
  'cake mix': 'cake_mix', 'chocolate cake mix': 'cake_mix', 'yellow cake mix': 'cake_mix',
  'yellow cake': 'cake_baked', 'baked chocolate cake': 'cake_baked', 'chocolate cake': 'cake_baked',
  'pudding mix': 'pudding_mix', 'chocolate pudding mix': 'pudding_mix', 'vanilla pudding mix': 'pudding_mix',
  'vanilla pudding': 'pudding_made', 'chocolate pudding': 'pudding_made',
  'strawberry gelatin': 'gelatin_flavored', 'gelatin': 'gelatin_plain',
  'hot cocoa mix': 'cocoa_mix', 'packets hot cocoa mix': 'cocoa_mix',
  'baking powder': 'baking_powder', 'baking soda': 'baking_soda',
  'cornstarch': 'cornstarch', 'corn starch': 'cornstarch',
  'cola': 'cola', 'root beer': 'cola', 'dr pepper': 'cola',
  'salsa verde': 'salsa_verde', 'green salsa': 'salsa_verde', 'tomatillo salsa': 'salsa_verde',
  'buttermilk': 'milk',
  'yeast': 'yeast', 'active dry yeast': 'yeast', 'packet yeast': 'yeast',

  // supplements & drinks
  'whey': 'whey', 'chocolate whey': 'whey', 'vanilla whey': 'whey', 'whey protein': 'whey',
  'crio bru': 'crio_bru', 'brewed crio bru': 'crio_bru', 'chilled crio bru': 'crio_bru',
  'chilled brewed crio bru': 'crio_bru', 'hot crio bru': 'crio_bru', 'cold crio bru': 'crio_bru',
  'water': 'water', 'hot water': 'water', 'boiling water': 'water', 'ice': 'water',

  // free
  'salt': 'salt', 'sea salt': 'salt', 'salt/pepper': 'salt', 'kosher salt': 'salt',
  'pepper': 'black_pepper', 'black pepper': 'black_pepper',
  'paprika': 'paprika', 'cumin': 'cumin', 'garlic powder': 'garlic_powder', 'chili spices': 'chili_powder',
  'vanilla': 'vanilla', 'vanilla extract': 'vanilla', 'sweetener': 'sweetener', 'stevia': 'stevia',
  'lime juice': 'lime', 'creatine': 'creatine',
  'lime': 'lime', 'limes': 'lime', 'cilantro': 'cilantro', 'pickle juice': 'pickle_juice',
  'chili powder': 'chili_powder', 'onion powder': 'onion_powder', 'dried oregano': 'oregano',
  'dried thyme': 'thyme', 'dried basil': 'basil', 'ground ginger': 'ginger',
  'mustard powder': 'mustard_powder', 'celery salt': 'celery_salt', 'white pepper': 'white_pepper',
  'ground cumin': 'cumin', 'oregano': 'oregano', 'thyme': 'thyme',
  'lollipop sticks': 'free', 'wooden sticks': 'free',
  'cinnamon': 'cinnamon',
  // the recipe audit, 2026-09-26
  'cream of tartar': 'cream_of_tartar', 'italian seasoning': 'italian_seasoning',
  'worcestershire sauce': 'worcestershire', 'worcestershire': 'worcestershire',
  'dill pickle slices': 'pickles', 'pickle slices': 'pickles', 'dill pickles': 'pickles',
  'red food colouring': 'free', 'food colouring': 'free', 'red food coloring': 'free', 'food coloring': 'free',
  // the Mexican shelf, 2026-09-26
  'flank steak': 'flank_steak', 'skirt steak': 'flank_steak',
  'corn tortillas': 'corn_tortilla', 'corn tortilla': 'corn_tortilla',
  'carne asada': 'carne_asada', 'sweet pork': 'sweet_pork', 'sweet pork barbacoa': 'sweet_pork',
  'cilantro lime rice': 'cilantro_lime_rice', 'tomatillo ranch': 'tomatillo_ranch',
  'tomatillo ranch dressing': 'tomatillo_ranch',
  'guacamole': 'guacamole', 'pico de gallo': 'pico_de_gallo', 'pico': 'pico_de_gallo',
  'enchilada sauce': 'enchilada_sauce', 'red enchilada sauce': 'enchilada_sauce',
  'avocado': 'avocado', 'avocados': 'avocado', 'jalapeño': 'jalapeno', 'jalapeños': 'jalapeno',
  'jalapeno': 'jalapeno', 'jalapenos': 'jalapeno',
  // the meatloaf, 2026-10-06; longer than 'apple', so the vinegar is found first
  'vinegar': 'vinegar', 'cider vinegar': 'vinegar', 'apple cider vinegar': 'vinegar',
  'white vinegar': 'vinegar', 'distilled vinegar': 'vinegar', 'distilled white vinegar': 'vinegar',
  // the comfort dinners, 2026-10-06; egg noodles were read as eggs
  'egg noodles': 'egg_noodles', 'wide egg noodles': 'egg_noodles', 'noodles': 'egg_noodles',
  'ribbon noodles': 'egg_noodles',
  'chicken broth': 'broth', 'beef broth': 'broth', 'chicken stock': 'broth', 'beef stock': 'broth',
  'broth': 'broth',
  'tater tots': 'tater_tots', 'tater tot': 'tater_tots', 'frozen tater tots': 'tater_tots',
  '96/4 ground beef': 'ground_beef_96_4', 'extra lean ground beef': 'ground_beef_96_4',
  'jasmine rice': 'rice_jasmine', 'cooked jasmine rice': 'rice_jasmine',
};

/*
 * Seasonings all share the `free` food key, so the shopping list groups them by
 * the words the recipe used rather than by that key — otherwise vanilla,
 * paprika and lollipop sticks would land on one row. These fold the near
 * duplicates back together so "black pepper" and "pepper" are one line.
 */
const SPICE_NAMES = {
  'black pepper': 'pepper', 'white pepper': 'pepper',
  'vanilla extract': 'vanilla',
  'ground cumin': 'cumin',
  'dried oregano': 'oregano', 'dried thyme': 'thyme', 'dried basil': 'basil',
  'limes': 'lime',
  'wooden sticks': 'lollipop sticks',
  'chili spices': 'chili powder',
};

/* ---------------------------------------------------------------------------
 * Which meals a food is ordinarily eaten at ON ITS OWN.
 *
 * `eat` and `side` already say a food can be eaten as it comes, and that was
 * the only thing the suggester knew. So it ranked the shelf by how cleanly
 * each food moves one macro and offered the winners — which is how "three
 * foods that close breakfast" came back as canned tuna, applesauce and cream
 * cheese. Every number right, and nothing anybody eats at eight in the
 * morning.
 *
 * This is a fact about food, in the same category as `eat` and `side`, and it
 * is kept here with them rather than being inferred from macros — no amount
 * of protein per calorie will ever work out that tuna is not breakfast.
 *
 * Only exceptions are listed. A food named nowhere below is fine at any meal,
 * which is the honest default: most food is.
 *
 * The letters are the app's own slot keys: b breakfast, l lunch, d dinner,
 * s snacks. Custom meals inherit their kind, so a second dinner is still 'd'.
 * ------------------------------------------------------------------------- */

/* Savoury meat, fish and the things that go beside them. Ham, bacon and eggs
   are deliberately absent — those ARE breakfast. */
const NOT_AT_BREAKFAST = [
  'tuna', 'chicken_breast', 'chicken_canned', 'cooked_beef', 'roast_beef_deli',
  'beef_frank', 'turkey_deli', 'turkey_breast', 'ground_beef_96_4', 'rice_jasmine',
  'salmon', 'cod', 'halibut', 'tilapia', 'tuna_steak', 'trout', 'haddock',
  'snapper', 'mackerel', 'catfish', 'sardines', 'shrimp', 'crab', 'lobster',
  'scallops', 'clams', 'calamari',
  'olives', 'hummus', 'parmesan', 'sour_cream',
];

/* Vegetables, minus the six that turn up in an omelette or beside an egg.
   Fruit is not here at all: fruit is a breakfast food. */
const VEG_NOT_AT_BREAKFAST = [
  'black_beans', 'pinto_beans', 'carrot', 'green_beans', 'corn', 'broccoli',
  'lettuce', 'tomato_canned', 'cucumber', 'asparagus', 'brussels', 'cauliflower',
  'cabbage', 'kale', 'swiss_chard', 'collards', 'bok_choy', 'zucchini',
  'yellow_squash', 'spaghetti_squash', 'eggplant', 'okra', 'leeks', 'artichoke',
  'turnip', 'turnip_greens', 'celery', 'radish', 'romaine', 'snow_peas',
  'bean_sprouts', 'alfalfa', 'water_chestnut', 'bamboo_shoots', 'watercress',
  'endive', 'jalapeno', 'sauerkraut', 'chickpeas', 'kidney_beans', 'lentils',
];

NOT_AT_BREAKFAST.concat(VEG_NOT_AT_BREAKFAST).forEach((k) => {
  if (FOODS[k]) FOODS[k].meals = 'lds';
});

module.exports = { FOODS, ALIASES, SPICE_NAMES };
