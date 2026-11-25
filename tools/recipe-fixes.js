/*
 * Corrections applied to the original recipe text at build time.
 *
 * The originals in design/project/ are left exactly as they arrived. Anything
 * that needed changing is listed here instead, so it is obvious what was
 * altered and why, and so a corrected original can be dropped in later without
 * unpicking edits made in place.
 *
 * All eighteen entries below are the same problem: a recipe that cooks raw
 * chicken and never says how to know it is done. Two of them are worse — the
 * ingredient list says "cooked" or "shredded" chicken but no step ever cooks
 * it, so following the recipe literally puts raw chicken into a casserole.
 *
 * 165°F is the USDA figure for poultry.
 *
 * The nineteenth is a different kind of wrong, and uses `set` rather than
 * `add`: the step is replaced instead of appended to. No. 006 said "whisk in
 * dry milk powder until dissolved", into a cup of yogurt. It does hydrate —
 * a cup of yogurt is around 200 g of water and two tablespoons of powder is
 * under nine — but tipped in it clumps, and "until dissolved" promises
 * something that does not happen in anything that thick. The six warm drinks
 * added later all turn on the same technique, so the fix is the one they use.
 *
 * The last group is not a correction at all. Ten recipes call for a bottle of
 * barbecue sauce or a packet of gravy mix, neither of which the storehouse
 * carries and both of which it has every part of. Recipes 264 and 265 are those
 * two, and these entries are the cross-reference from the recipes that want
 * them. Nine of the ten are here; the tenth is No. 247, which was written for
 * this collection rather than carried over, so it is edited in place instead.
 */

module.exports = [
  /* ---- five recipes you could not follow ------------------------------
   * Three of them list flour, baking powder, milk and butter and then never
   * touch any of it: "Make biscuit dough" is not a method, it is the name of
   * one. Two more say "make quick pancake cornbread flatbread on skillet",
   * which names three different breads in one sentence and gives no liquid,
   * no pan and no heat.
   *
   * The cornbread is also not cornbread. There is no cornmeal in pancake mix
   * and none on the order list. What the storehouse does have is canned corn,
   * so these are now a corn skillet bread that actually contains corn — the
   * honest version of what the title was already promising, and better beside
   * a bowl of chili than a plain pancake would be.
   *
   * The biscuit ratio is the same in all three, because it is the same dough:
   * 2 cups flour, 1 tbsp baking powder, 4 tbsp butter, ¾ cup milk. Rubbed in
   * cold and barely mixed, which is the whole difference between a drop
   * biscuit and a scone.
   */
  {
    id: 107,
    name: 'Cheesy Sausage & Egg Biscuit Cups',
    time: '35 mins',
    ing: ['2 cups flour', '1 tbsp baking powder', '4 tbsp butter', '¾ cup milk',
      '3 eggs', '4 oz sausage', '¼ cup cheddar', 'salt'],
    steps: [
      'Heat the oven to 375°F and butter six cups of a muffin tin.',
      'Cook the sausage in a skillet, breaking it up, until no pink is left. Drain it.',
      'Rub the cold butter into the flour, baking powder and a teaspoon of salt with your fingertips until it looks like coarse crumbs. Stir in the milk with a fork until it just comes together — a few dry patches are better than a smooth dough.',
      'Press a golf ball of dough into each cup and up the sides to make a shell.',
      'Divide the sausage between the shells, beat the eggs and pour them over, and top with the cheddar.',
      'Bake 20 minutes, until the egg is set and the edges are golden.',
    ],
  },
  {
    id: 180,
    steps: [
      'Simmer the beef, potatoes, carrots and onion in 3 cups of water in a Dutch oven for 1 hour.',
      'Rub the cold butter into the flour, baking powder and a teaspoon of salt until it looks like coarse crumbs, then stir in the milk with a fork until it just holds together. Do not knead it — drop biscuits are light because the dough is barely mixed.',
      'Drop the dough over the stew in rough spoonfuls, leaving gaps for the steam, and bake uncovered at 375°F for 20 minutes. They are done when the tops are golden and one pulled open at the middle is dry rather than sticky.',
    ],
  },
  {
    id: 188,
    ing: ['1.5 lbs ground beef', '1 can corn', '1 can green beans', '1 can carrots',
      '1 pkg beef gravy mix', '2 cups flour', '1 tbsp baking powder', '4 tbsp butter',
      '¾ cup milk', 'salt'],
    steps: [
      'Heat the oven to 375°F.',
      'Brown the beef and drain it. Drain the vegetables, stir them in, and make up the gravy as the packet says. No packet? {r:265}, browned dark and made with a cup of water, does the same job.',
      'Rub the cold butter into the flour, baking powder and a teaspoon of salt until crumbly, then stir in the milk until it just comes together.',
      'Spoon the beef into a baking dish, drop the dough over it in rough spoonfuls, and bake 25 minutes until the topping is golden and dry at the centre.',
    ],
  },
  {
    id: 158,
    name: 'Mild Beef & Bean Chili with Corn Skillet Bread',
    ing: ['1.5 lbs ground beef', '2 cans pinto beans', '1 can tomato sauce',
      '1 can diced tomatoes', '1 cup pancake mix', '1 can corn', '1 egg', '½ cup milk',
      '1 tbsp vegetable oil'],
    steps: [
      'Brown the beef 8 minutes, breaking it up, and drain it. Add the beans, tomato sauce and diced tomatoes and simmer 20 minutes.',
      'Meanwhile whisk the pancake mix with the egg and milk into a thick batter — closer to muffin batter than pancake batter — and fold in the drained corn.',
      'Heat the oil in a skillet over medium. Pour the batter in, cover, and cook 6 to 8 minutes until the top is set, then flip it and give it 3 minutes more.',
      'Cut it into wedges and serve with the chili.',
    ],
  },
  {
    id: 193,
    name: 'Hearty Country Beef Chili & Corn Skillet Bread',
    ing: ['2 lbs ground beef', '2 cans pinto beans', '1 can tomato sauce', '1 cup cheddar',
      '2 cups pancake mix', '1 can corn', '2 eggs', '1 cup milk', '1 tbsp butter'],
    steps: [
      'Simmer the beef, beans and tomato sauce 30 minutes.',
      'Heat the oven to 400°F with a 9-inch oven-safe skillet inside, the butter in the skillet. Meanwhile whisk the pancake mix with the eggs and milk into a thick batter, and fold in the drained corn.',
      'Pour the batter into the hot skillet. It should hiss — that is where the crust comes from, and a cold pan will not give you one.',
      'Bake 20 to 25 minutes, until the top is golden and a knife in the middle comes out clean. No oven-safe skillet? A buttered cake pan works — you lose the crust, not the bread.',
      'Serve the chili topped with the cheddar, with the bread cut into wedges alongside.',
    ],
  },

  { id: 6, step: 1, set: 'Sprinkle the dry milk over the yogurt a little at a time, whisking as you go, and let it stand a minute. Tipped in all at once it clumps and stays that way.' },
  { id: 54, step: 2, add: 'Check the chicken before serving: no pink at the centre, 165°F on a thermometer.' },
  { id: 57, step: 0, add: 'Cut a piece open to check — the chicken should be white through to the middle, 165°F.' },
  { id: 61, step: 0, add: 'Give it longer if the breasts are thick — done means 165°F and no pink at the centre.' },
  { id: 63, step: 1, add: 'If the chicken is not already cooked, cook it through first — 165°F, no pink at the centre.' },
  { id: 66, step: 0, add: 'Check a piece: white all the way through, 165°F.' },
  { id: 73, step: 2, add: 'Thick breasts may want another five minutes. Done means 165°F and clear juices.' },
  { id: 153, step: 1, add: 'Cook the chicken through before it goes into the dish — 165°F, no pink at the centre. The topping bakes faster than raw chicken would.' },
  { id: 156, step: 0, add: 'Check the thickest breast reads 165°F before taking them out.' },
  { id: 163, step: 1, add: 'Cook the chicken through first if it is raw — 165°F, no pink at the centre.' },
  { id: 165, step: 1, add: 'Check it is white through the middle, 165°F, before the sauce goes in.' },
  { id: 169, step: 1, add: 'Strips this thin cook quickly, but check one at the thickest point: 165°F, no pink.' },
  { id: 179, step: 1, add: 'Cook it through — 165°F — before it is mixed with the pasta.' },
  { id: 182, step: 0, add: 'Roast until the thickest breast reads 165°F and the juices run clear.' },
  { id: 186, step: 2, add: 'Whole breasts under a blanket of sauce take longer than you expect. Check the thickest one reads 165°F before serving.' },
  { id: 198, step: 1, add: 'A crisp crust is not proof it is cooked. Check the thickest part reads 165°F. Rest it five minutes before cutting.' },
  { id: 198, step: 2, add: '{r:265} is this gravy, step by step.' },

  /* ---- pointers to Made, Not Bought ------------------------------------
   * Barbecue sauce and gravy mix are the two ingredients that block the most
   * recipes on their own — five each — and both are makeable from the order
   * list. Recipes 264 and 265 do that. These ten are where a person finds out.
   *
   * The gravy ones are not all the same sentence, because a packet is used four
   * different ways across them: whisked into water and poured over a roast,
   * made separately alongside, used as the braising liquid, and cooked in with
   * the meat. Only the first has an obvious drop-in replacement. The others get
   * told to cook in plain water and make the gravy from what is in the pot at
   * the end, which is what the packet was standing in for anyway.
   */
  { id: 59, step: 0, add: 'No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.' },
  { id: 143, step: 1, add: 'No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.' },
  { id: 162, step: 0, add: 'No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.' },
  { id: 181, step: 0, add: 'No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.' },
  { id: 176, step: 2, add: 'No packet? Pour a cup of plain water over instead, and make {r:265} at the end from the liquid in the cooker.' },
  { id: 182, step: 1, add: 'No packet? {r:265}, stopped while the flour is still blond, is the pale gravy this wants. Use the juices from the roasting tin.' },
  { id: 187, step: 0, add: 'No packet? Simmer the beef and onions in 2 cups of plain water instead, and turn that liquid into gravy at the end with {r:265}.' },
  { id: 195, step: 1, add: 'No packet? Put a cup of water in with them instead and make {r:265} from what is in the cooker at the end.' },

  /* ---- ingredients that were bought and never used ---------------------
   *
   * Found by a reader cooking the meatball feast, who got to the end with a
   * can of green beans still on the counter. The ingredient list asked for it,
   * the method never mentioned it, and there was nothing on the page to say
   * whether it had been forgotten or whether he had missed a line.
   *
   * A sweep of all two hundred and seventy-one turned up five like it — every
   * ingredient line checked against every word of its own method, allowing for
   * the ones covered collectively ("mix ingredients", "make 4 PB&J
   * sandwiches") and for seasoning nobody narrates. Five is not many, and each
   * one costs somebody a tin or a stick of butter and a minute of standing
   * there wondering.
   *
   * Each is given the shortest instruction that makes the list true. Nothing
   * is added to the ingredients and nothing is taken away, so the macros, the
   * score and the shopping list are all untouched — these were already being
   * counted. They just were not being cooked. */
  { id: 177, step: 1, add: 'Heat the green beans through in their own liquid while the noodles boil, then drain them.' },
  { id: 178, step: 2, add: 'Heat the green beans through, drain them, and put them on the table alongside.' },
  { id: 189, step: 1, add: 'Cut the carrots into thick batons and season them alongside the potatoes; they roast in the same time.' },

  /* The rest of the same sweep. Smaller than the five above — a condiment
     nobody was told to put on the table, a seasoning never called for, the
     milk a boxed cake mix needs — but each one is an ingredient somebody
     bought and then had to guess about, which is the same failure at a lower
     price. Two of them are a burrito bar and a taco bar with the salsa left in
     the fridge. */
  { id: 38, step: 2, add: 'Season each one with salt and pepper before it goes in.' },
  { id: 52, step: 3, add: 'Mustard or salsa on the side; it wants something sharp against the beef and potato.' },
  { id: 53, step: 2, add: 'Chopped tomatoes over the top, added the day you eat it rather than now — they weep if they sit.' },
  { id: 103, step: 2, add: 'Salsa out beside them.' },
  { id: 119, step: 1, add: 'Salt and pepper the egg as it sets.' },
  { id: 128, step: 2, add: 'Sour cream too.' },
  { id: 135, step: 1, add: 'Salsa on the side, or spooned in before they are rolled.' },
  { id: 152, step: 2, add: 'Salsa out with them.' },
  { id: 168, step: 2, add: 'Stir the butter into them while they are hot — that is the difference between a topping and a paste.' },
  { id: 205, step: 1, add: 'Make the mix up with the milk rather than water; it is a box mix either way, and this is the part that stops it tasting like one.' },
  // the baked cake the trifle and the layered desserts slice up
  { id: 205, makes: ['cake_baked'] },
  // No. 267's cake pops want a chocolate cake; the book's baked cake is yellow
  { id: 214, nomake: ['cake_baked'] },
  { id: 217, step: 0, add: 'Beat the waffle mix, milk and egg together first and let the batter stand a couple of minutes.' },

  /* ---- the two recipes that ask for breadcrumbs -------------------------
   *
   * The same reader, the same evening, one step earlier: half a cup of
   * breadcrumbs, and the storehouse does not carry a box of them. Bread is on
   * the standard order, so the recipe for making them is now in Made, Not
   * Bought and both meatball recipes point at it. */
  /* Celery salt is not on the storehouse order — a fact that was hidden until
     the list was declared rather than inferred. Both of these exist so that
     somebody with only the order can still make the thing, so neither may
     depend on something the order does not carry. It stays in as an
     improvement and is now marked optional. */
  /* ---- the three that open a can of mushroom soup --------------------
   *
   * Cream of mushroom is on the storehouse order, so these are no different
   * from any other recipe until the day it is not on the shelf — and unlike
   * every other tin in the book there is no making it, because the order
   * carries no mushrooms. {r:275} does, because canned chicken is on the list.
   *
   * So each of these says what to reach for instead. Not the same sentence
   * three times: the soup is doing a different job in each one, and in the
   * pork roast it is not a soup at all, it is the gravy. */
  { id: 161, step: 2, add: 'No mushroom soup? {r:275} layers in exactly the same way, and {r:265} made pale does the binding just as well.' },
  { id: 171, step: 1, add: 'The soup is the gravy here, and {r:265} is a better one — make it pale, with the juices from the tin once the roast is out. {r:275} works too if you want it thicker.' },
  { id: 196, step: 1, add: 'No mushroom soup? {r:275} is the closer swap; {r:265} made pale is the leaner one. Either way the sour cream goes in off the heat, or it splits.' },

  { id: 166, step: 0, add: 'No breadcrumbs in the cupboard? {r:272} makes them from bread, which is on the order.' },
  { id: 178, step: 0, add: 'No breadcrumbs in the cupboard? {r:272} makes them from bread, which is on the order.' },

  /* ---- four titles that promise something the recipe has not got --------
   *
   * Found by a reader looking at No. 084 and asking where the rice crisp
   * was. It is a fair question: the title says "with Rice Crisp" and the
   * recipe is whey, cocoa and two tablespoons of water. Nothing crisp, no
   * rice, and no step that could have held either.
   *
   * Three more read the same way. A pancake stack that calls itself
   * buttermilk and is made with milk. Cocoa cups that promise marshmallows
   * and contain cinnamon. A casserole named for rotini that is made with the
   * ribbon pasta the storehouse actually carries.
   *
   * The fix is the title in every case, not the ingredients. None of the four
   * missing things — crisp rice cereal, buttermilk, marshmallows, rotini — is
   * on the storehouse order, and the promise this book makes is that its
   * recipes come off that order. Adding them to keep four titles would break
   * the thing the titles are attached to.
   *
   * Each new name is taken from what the method already does: No. 084 says
   * "until dark fudge paste forms", so it is a fudge slurry.
   */
  { id: 100, name: 'Protein Cocoa Fudge Slurry' },
  { id: 104, name: 'Fluffy Pancake Stack' },
  { id: 211, name: 'Hot Cocoa & Cinnamon Cups' },
  { id: 160, name: 'Creamy Chicken Pasta Casserole' },

  /* ---- eleven things you were sent to the shop for and never told to use --
   *
   * Reported by the owner after cooking No. 190, the alfredo bake. He was
   * confused by the cheese sauce, went and asked elsewhere how to make one,
   * and came back with a better dish than the book describes.
   *
   * Four separate faults in that one recipe, and the same shape underneath
   * all of them: the recipe knows what it wants and does not say it.
   *
   *   - "Whisk evaporated milk, butter, and cheese into sauce" is one line
   *     doing four jobs. No heat, no order, no thickener, no cue for done.
   *     Cheddar whisked into evaporated milk with nothing starchy stays thin
   *     or splits, which is exactly what happened.
   *   - There was not enough of it. Two cups of sauce for a pound of dry
   *     pasta and two pounds of chicken, where a baked pasta wants twice
   *     that, and then twenty minutes in the oven takes more.
   *   - Parmesan is on the shopping list for this recipe and appears in no
   *     ingredient line and no step. He added it himself, on top, which is
   *     where it belongs and where the recipe should have said.
   *   - The pasta is cooked twice: boiled to done, then baked for twenty
   *     minutes more.
   *
   * The other ten are the third fault on its own — an ingredient the reader
   * is told to buy and then never told to use. Taco seasoning in five,
   * garlic powder and Italian seasoning in one, cumin, Worcestershire, and
   * parmesan again in the meatball feast.
   *
   * This is the green bean problem in a different field. The guard written
   * for that one reads the ingredient list; "buy this elsewhere" is a
   * separate list, so none of these was ever covered. tests/recipes.test.js
   * now reads both.
   *
   * None of the eleven can be made from the order — the storehouse carries
   * salt, celery salt, cinnamon and cinnamon sugar, and no other seasoning at
   * all — so every one of them stays an extra. What changes is that the
   * method now says where it goes and how much.
   */
  {
    id: 179,
    time: '45 mins',
    /* Nothing bought elsewhere any more: the parmesan that was the only thing
       on this list is optional now, so the alfredo bake is a recipe you can
       cook out of the order alone. */
    extras: null,
    ing: ['2 lbs chicken breast', '16 oz ribbon pasta', '2 cans evaporated milk',
      '½ cup butter', '¼ cup flour', '2½ cups cheddar',
      '½ cup breadcrumbs', 'salt and pepper'],
    /* Parmesan started out in the ingredient list here, which was the wrong
       answer to the right problem: it made the recipe unfollowable without a
       trip to the shop. The dish is good on cheddar — that is the point of the
       book — and the parmesan belongs where anything off the order belongs,
       under a heading that says it is optional. */
    lift: {
      with: 'Parmesan, fresh garlic, Italian seasoning',
      steps: [
        'Soften 3 or 4 minced garlic cloves in the butter for a minute before the flour. Garlic in the fat tastes of the dish; garlic added late tastes of garlic.',
        'Swap half a cup of cheddar for grated parmesan, and keep half back for the top. Salt the sauce after it goes in — parmesan is saltier.',
        'A teaspoon of Italian seasoning with the cheese, and a pinch of nutmeg if you have it.',
      ]
    },
    /* Written short on purpose. The first version of this rewrite said all of
       the same things at twice the length and came out 935px tall against 720
       of paper — off the bottom of its own page even at the 0.85 squeeze
       floor, which is the packer telling you the recipe does not fit the book.
       Every instruction below survived the cut; only the words did not. */
    steps: [
      'Heat the oven to 375°F. Boil the pasta in well-salted water, but stop two minutes short of the packet time — it finishes in the oven. Save a mug of the water.',
      'Salt and pepper the chicken and cook it in a wide skillet over medium-high, about 6 minutes a side. Done is 165°F, or white through with clear juices. Rest 5 minutes, then slice. Keep the skillet.',
      'Melt the butter in the same skillet over medium-low. Whisk the flour in and cook it a full minute. It will look like wet sand, and that minute is what stops the sauce tasting of raw flour.',
    'Add the evaporated milk a splash at a time, whisking smooth after each, until it thickens at a bare simmer.',
      'Off the heat — boiled, cheese turns grainy and splits — stir in two cups of cheddar a handful at a time. Loosen with pasta water if it is thicker than pouring cream, then salt it well.',
      'Fold the pasta and chicken through, tip into a buttered 9x13 dish, and scatter the last half cup of cheddar and the breadcrumbs over. No crumbs? {r:272} makes them, and an air fryer makes better ones than an oven.',
      'Bake 20 minutes, until it bubbles at the edges and the top has colour. Stand 5 minutes before serving or the first spoonful runs.'
    ]
  },
  { id: 178,
    extras: null,
    lift: {
      with: 'Parmesan, fresh garlic',
      steps: [
        'A clove of minced garlic and a tablespoon of grated parmesan into the meatball mix, with the egg and crumbs. Both are in there before it cooks, which is where they do the most.',
        'Parmesan grated over each plate at the table, not into the pot. It stops tasting of anything after ten minutes in a sauce.',
      ]
    } },
  { id: 58, step: 1,
    add: 'This is where the cumin goes: a teaspoon of it with the chili powder. Chili powder is mostly mild, and cumin is what makes a pot of beans taste like chili rather than like tomatoes.' },
  { id: 151, step: 2,
    add: 'Stir in a teaspoon of garlic powder and a teaspoon of Italian seasoning here — stirred into the sauce is the only place they do anything.' },
  { id: 145, step: 0,
    add: 'Add 2 tbsp taco seasoning and ¼ cup water to the browned beef and let it bubble a minute until it clings. Seasoning tipped over the top at the end sits on the meat instead of in it.' },
  { id: 164, step: 1,
    add: 'Stir 2 tbsp taco seasoning into the beef with the tomato sauce, and let it simmer a minute before it is layered.' },
  { id: 172, step: 1,
    add: 'Add 2 tbsp taco seasoning with the salsa and beans, and give it a minute to come together.' },
  { id: 200, steps: [
      'Brown the beef in a hot pan, breaking it up, and drain it. Stir in 2 tbsp taco seasoning and ¼ cup water and let it bubble a minute, until the liquid has gone and the meat is coated.',
      'Bake tortilla wedges at 400°F 8 mins until crisp.',
      'Top with the beef, beans, corn, and cheese; melt under broiler 3 mins. Serve with salsa/sour cream.',
    ] },
  { id: 176, step: 0,
    add: 'Rub the roast with a tablespoon of Worcestershire before it goes in the pan. It is what gives the gravy its savoury depth, and searing it on is better than pouring it over later.' },

  /* ---- the audit the alfredo bake set off ------------------------------
   *
   * No. 190 turned out to have four faults, and the question was how many
   * others had the same ones. Eight classes were swept; five of them were
   * almost entirely noise and are worth naming so nobody re-runs them
   * expecting a haul: "bakes with no oven temperature" was seven slow-cooker
   * recipes where roast is a noun; "ground meat with no doneness cue" was
   * forty recipes that all say "brown the beef"; "eggs with no cue for set"
   * was mostly cakes and puddings where the egg is a binder; and four of the
   * eight title-promise hits do the thing under another word — spooning tuna
   * into a hollowed tomato is stuffing it.
   *
   * What survived reading is below.
   */

  /* Six more pastas cooked twice, which is the alfredo bake's third fault.
     Boiled to done and then baked for another twenty minutes, which is how a
     casserole turns to paste. Two minutes short is the whole fix, and the
     reason has to be on the page or the next person "corrects" it back. */
  { id: 63, step: 0, set: 'Preheat oven to 350°F. Boil the pasta two minutes short of the packet time — it finishes in the oven, and pasta boiled soft first bakes to mush.' },
  { id: 163, step: 0, set: 'Preheat oven to 350°F. Boil the macaroni two minutes short of the packet time, and add the broccoli for the last three so it keeps some bite. Both finish in the oven.' },
  { id: 170, step: 0, set: 'Preheat oven to 350°F. Boil the macaroni two minutes short of the packet time — it finishes in the oven.' },
  { id: 184, step: 0, set: 'Preheat oven to 350°F. Boil the spaghetti two minutes short of the packet time — it finishes in the oven.' },

  /* No. 205 is the alfredo bake's first and fourth faults in one recipe:
     "Make cheese sauce with milk, flour, cheddar" is the same instruction
     that sent the owner to look it up elsewhere, and the ham is called
     glazed and never glazed. Both fixed, and the potatoes get the parboil
     they need — sliced raw potato does not cook through under sauce in
     forty-five minutes, which is the other thing this recipe was quietly
     wrong about. */
  {
    id: 194,
    time: '70 mins',
    ing: ['2 lb sliced ham', '2 lbs potatoes (sliced thin)', '2 cups milk', '2 tbsp flour',
      '2 tbsp butter', '1.5 cups cheddar', '¼ cup brown sugar', '1 tsp mustard', 'salt', 'pepper'],
    steps: [
      'Heat the oven to 375°F. Slice the potatoes as thin as you can — a quarter inch or less — and simmer them in salted water for 8 minutes. They will not cook through under the sauce otherwise, however long you give them.',
      'Melt the butter in a saucepan over medium-low, whisk in the flour and let it cook a full minute — it should look like wet sand. Add the milk a splash at a time, whisking smooth after each, and let it come to a bare simmer until it thickens.',
      'Off the heat, stir in a cup of the cheddar a handful at a time. Off the heat matters: boiled, cheese goes grainy and the fat splits out. Salt and pepper it, and taste — under sauce, thin potato needs more salt than seems right.',
      'Layer the drained potatoes and the sauce in a buttered dish, finishing with sauce, and scatter the last half cup of cheddar over. Bake 40 minutes, until a knife goes through the middle with no resistance and the top has browned.',
      'Meanwhile the glaze the title promises: stir the brown sugar and mustard together, spread it over the ham slices in a second dish, and give them 15 minutes in the same oven until the sugar has gone shiny and dark at the edges. Serve them with the potatoes.'
    ]
  },

  /* No. 135 could not be made at all. "Make thick pancake batter" from one
     cup of dry mix and nothing wet — the ingredient list has sausages, mix
     and syrup, and no liquid anywhere. The batter is the recipe. */
  {
    id: 124,
    ing: ['4 cooked sausage links', '1 cup pancake mix', '½ cup milk', '1 tbsp oil', '¼ cup syrup'],
    steps: [
      'Whisk the pancake mix with the milk into a batter thicker than you would pour for pancakes — it has to cling to a sausage rather than run off it. Add the milk a little at a time; you can always loosen it.',
      'Heat the oil in a skillet over medium. Dip each sausage in the batter, turning it to coat, and fry 2 minutes a side until golden all round.',
      'Serve with the syrup.'
    ]
  },

  /* No. 215's pudding had no liquid either: the box wants milk, and all the
     milk in the ingredient list is already in the cake batter. */
  {
    id: 204,
    /* Eggs. A box cake mix without them does not set, and the first pass at
       fixing this recipe gave it milk and butter and left the eggs out — the
       packet guard caught that later. */
    ing: ['1 box chocolate cake mix', '3 eggs', '3 cups milk', '½ cup butter', '1 pkg chocolate pudding mix'],
    steps: [
      'Heat the oven to 350°F and butter a 9x13 dish.',
      'Whisk the cake mix with the 3 eggs, 1¼ cups of the milk and the melted butter until smooth.',
      'In a second bowl, whisk the pudding mix with the remaining 1¾ cups of milk for two minutes until it thickens. Do not cook it — it goes in soft.',
      'Pour the cake batter into the dish, spoon the pudding over in blobs, and drag a knife through both once or twice. Two or three passes, not twenty: swirl it too far and it is one colour again.',
      'Bake 28 minutes. The pudding stays fudgy, so a skewer will not come out clean — go by the cake around it, which should spring back.'
    ]
  },

  /* Two pastries with no water in them and no method. Flour and butter alone
     is not a dough; it is crumbs. */
  {
    id: 212,
    ing: ['2 fresh apples (quartered)', '1.5 cups flour', '½ cup butter', '4 tbsp cold water',
      '¼ cup sugar', '1 tsp cinnamon', 'salt'],
    steps: [
      'Heat the oven to 375°F.',
      'Rub the cold butter into the flour and a pinch of salt with your fingertips until it looks like coarse crumbs, then stir in the cold water a tablespoon at a time until it just holds together in a ball. Stop there — a pastry worked smooth goes tough.',
      'Rest the dough 15 minutes, then roll it out and cut it into four squares.',
      'Wrap each apple quarter in a square, pinching the seams shut, and sit them seam-down on a baking sheet. Mix the sugar with the cinnamon and scatter it over.',
      'Bake 25 minutes, until the pastry is golden and a skewer slides into the apple without resistance.'
    ]
  },
  {
    id: 218,
    ing: ['1.5 cups flour', '½ cup butter', '4 tbsp cold water', 'salt',
      '1 pkg chocolate pudding mix', '2 cups milk'],
    steps: [
      'Heat the oven to 375°F. Rub the cold butter into the flour and a pinch of salt until it looks like coarse crumbs, then stir in the cold water a tablespoon at a time until it just comes together. Rest it 15 minutes.',
      'Roll it out, line a pie dish, and prick the base all over with a fork. Bake 15 minutes until dry and pale gold. Pricking is what stops the base rising into a dome under the filling.',
      'Whisk the pudding mix with the milk for two minutes until it thickens, pour it into the cooled crust, and chill 2 hours before cutting.'
    ]
  },

  /* A pot roast in a dry slow cooker. Eight hours on low with nothing in the
     pot is not braising, and it is the only recipe in the collection that
     asks for it. */
  {
    id: 191,
    steps: [
      'Sear the roast hard on both sides in a hot skillet, 3 minutes a side. This is where the colour and most of the flavour of the gravy comes from, and a slow cooker cannot do it.',
      'Put the roast and the quartered potatoes in the slow cooker with 1 cup of water and a good pinch of salt, and cook on LOW for 8 hours until a fork twists in the meat with no effort.',
      'Simmer the carrots in a skillet with the brown sugar, the butter and a splash of water for 15 minutes, until the liquid has gone syrupy and coats them.',
      'Rest the roast 10 minutes before slicing it across the grain. The liquid left in the cooker makes {r:265}, poured over.'
    ]
  },

  /* "Crispy Potato Diggers", roasted for 25 minutes in the same pan as
     broccoli, which is ash by then. And "Crispy Baked Chicken" with nothing
     on it to crisp. Both titles were promising a texture the method had no
     way to produce. */
  {
    id: 154,
    steps: [
      'Heat the oven to 425°F. At 400 the cubed potato steams as often as it crisps.',
      'Toss the potatoes and carrots with the oil, salt and pepper and spread them out on a sheet pan in one layer — crowded, they steam. Roast 20 minutes.',
      'Add the sliced franks and the broccoli, toss everything together, and give it 10 minutes more. The broccoli only needs that; put it in at the start and it is ash by the end.',
      'The potatoes are done when a corner crushes under a spoon and the outside has gone golden and rough.'
    ]
  },
  /* Kept short: this one is also one of the eight on the handout, which is
     two sheets and no more, and the first draft of this step pushed page one
     to 11.76in of an 11in page. */
  { id: 156, step: 0, set: 'Heat the oven to 425°F. Pat the chicken dry, rub it with oil, salt and pepper, and bake 22 minutes on a rack — dry skin in a hot oven is what crisps it. Check the thickest reads 165°F.' },

  /* Instant mashed potatoes, four times, with no quantity and no pointer at
     the recipe that replaces them. The packet knows the ratio; the reader
     standing at the counter with a scoop does not. */
  { id: 62, step: 1, set: 'Make up the instant potatoes: bring 2 cups of water to the boil, take it off the heat, add a splash of milk, then stir in the 2 cups of flakes with a fork until fluffy. Give it a minute to thicken. Out of flakes? {r:276} does it from the potatoes on the order.' },
  { id: 72, step: 1, set: 'Make up the mashed potatoes: bring 2 cups of water to the boil, take it off the heat, add a splash of milk, then stir in the 2 cups of flakes with a fork until fluffy. Give it a minute to thicken. Out of flakes? {r:276} does it from the potatoes on the order.' },
  { id: 156, step: 1, set: 'Make up the mashed potatoes with the butter and milk, 2 cups of flakes to 2 cups of boiling water. No flakes? {r:276}.' },
  { id: 171, step: 2, add: 'Out of instant potato flakes? {r:276} makes mashed potatoes from the potatoes on the order.' },

  /* Two the sweep flagged that turned out to be half right.
   *
   * No. 208 does make its glaze — the word "glaze" is simply not in the
   * method — but it brushes a quarter cup of brown sugar onto a roast and
   * gives it fifty minutes, which is long enough for sugar to burn black.
   * Late, and twice, is how a glaze goes on.
   *
   * No. 80 says "make chocolate pudding" over an ingredient list whose first
   * line is a serving of chocolate pudding. It is an assembly recipe and the
   * pudding is somebody else's job — so it says whose. */
  { id: 197, step: 1, set: 'Puree the peaches with the brown sugar and mustard. Keep it back for now: brushed on at the start it has fifty minutes to burn, and burnt sugar is bitter all the way through.' },
  { id: 197, step: 2, set: 'Bake the pork roast at 375°F for 35 minutes, then brush the glaze over and give it 15 minutes more, brushing again halfway. Done is 145°F at the thickest part, and it wants 10 minutes\' rest before slicing.' },
  { id: 89, step: 0, set: 'Make up the chocolate pudding — a packet whisked with 2 cups of milk for two minutes, or {r:202} if you would rather it was already portioned.' },

  /* And the last two the "make X" guard turned up once it existed. A PB&J is
     not a mystery, but "make 4 PB&J sandwiches" is still the only instruction
     on a page somebody may be reading because they have not cooked much; and
     the churro batter is No. 135's fault a second time, with the liquid
     already on the list this time but no hint of how much. */
  { id: 134, step: 0, set: 'Spread the peanut butter on four slices and the jam on the other four, sandwich them, and cut each into quarters.' },
  { id: 209, step: 0, set: 'Whisk the pancake mix with the milk into a batter thick enough to hold its shape on a spoon — thicker than pancake batter. Add the milk a little at a time; loosening it is easy and thickening it is not.' },

  /* ---- the whole-collection sweep ---------------------------------------
   *
   * Asked for after the audit: read every recipe, say whether the method is
   * clear, and add the "better with a few extras" block wherever a few
   * ordinary spices would genuinely change the dish.
   *
   * Two scans. The first looked for cooked recipes missing two or more of
   * {a time, a heat level, a doneness cue} — 33 of them, against 108 that a
   * cruder "short method" test had flagged, nearly all of which were cold
   * assembly and perfectly clear. "Scoop cottage cheese into a bowl" is a
   * complete instruction. The second looked for savoury recipes with no
   * aromatic anywhere and sweet ones with no warm spice: 143.
   *
   * The lifts are written to an ordinary spice cupboard — garlic, onion,
   * oregano, basil, Italian seasoning, cumin, chili powder, paprika, thyme,
   * bay, nutmeg, soy sauce, Worcestershire, hot sauce, lemon, parmesan. None
   * of it is on the storehouse order, none of it is required, and the recipe
   * above each block still has to be worth cooking without any of it.
   */

  /* Scrambled eggs, four times, with a time and no heat and no idea what
     done looks like. Three minutes on a hot pan is rubber; the cue is what
     matters. */
  { id: 32, step: 0, set: 'Scramble the eggs in a buttered skillet over medium-low heat, stirring slowly, about 3 minutes — pull them while they still look slightly wet, because they carry on cooking in the pan.' },
  { id: 32, lift: { with: 'Hot sauce, cumin, fresh onion',
    steps: ['A pinch of cumin over the beans while they warm, and a few dashes of hot sauce into the salsa.',
      'A tablespoon of finely diced raw onion on top gives it the crunch a soft bowl is missing.'] } },
  { id: 36, step: 1, set: 'Add the beaten eggs and scramble over medium-low, stirring slowly, about 3 minutes — take them off while they still look a little wet.' },
  { id: 50, step: 0, set: 'Scramble the eggs in a buttered skillet over medium-low heat, about 3 minutes, and stop while they are still glossy.' },
  { id: 112, step: 0, set: 'Scramble the eggs in a buttered skillet over medium-low heat, about 3 minutes, stopping while they still look slightly wet.' },
  { id: 112, lift: { with: 'Hot sauce, cumin, fresh cilantro, lime',
    steps: ['A pinch of cumin into the eggs as they cook, and hot sauce at the table.',
      'Chopped cilantro and a squeeze of lime over the top. A breakfast taco without acid tastes flat however good the eggs are.'] } },

  /* Oats and porridge: "boil for N minutes" with no heat and no thickness. */
  { id: 37, step: 0, set: 'Simmer the oats in 1 cup of water over medium heat for about 3 minutes, stirring, until they thicken and the water has gone.' },
  { id: 115, step: 0, set: 'Simmer the oats and milk over medium heat for about 5 minutes, stirring often so the milk does not catch, until thick enough to hold a spoon-track for a second.' },
  { id: 115, lift: { with: 'Nutmeg, vanilla, a pinch of salt',
    steps: ['A pinch of salt in with the milk. Unsalted porridge tastes of nothing and no amount of honey fixes it.',
      'A scrape of nutmeg and a few drops of vanilla with the cinnamon.'] } },

  { id: 77, step: 2, set: 'Broil 1 to 2 minutes, watching it the whole time — it goes from bubbling to burnt in about twenty seconds.' },

  /* Skillet meals with a time and no heat. */
  { id: 62, step: 0, set: 'Brown the beef in a skillet over medium-high, breaking it up, about 8 minutes, until no pink is left. Drain the fat.' },
  { id: 62, lift: { with: 'Onion, garlic, thyme, Worcestershire',
    steps: ['Soften a diced onion with the beef, and a clove of minced garlic for the last minute.',
      'A splash of Worcestershire and a pinch of dried thyme into the browned beef. Shepherd\'s pie without either tastes like mince under mash, which is what this is trying not to be.'] } },
  { id: 67, step: 0, set: 'Brown the ground beef over medium-high, breaking it up, about 8 minutes, until no pink is left. Drain the fat.' },
  { id: 67, lift: { with: 'Garlic, ginger, sesame oil, chili flakes',
    steps: ['Minced garlic and ginger into the pan for the last minute of browning, not at the start — both burn.',
      'A teaspoon of sesame oil off the heat at the end, and chili flakes to taste. Sesame oil cooked hard loses the thing you added it for.'] } },
  { id: 70, step: 0, set: 'Cook the diced chicken with the salsa in a skillet over medium heat, about 10 minutes, until the chicken is 165°F and the salsa has thickened around it.' },
  { id: 70, lift: { with: 'Cumin, smoked paprika, lime, cilantro',
    steps: ['A teaspoon each of cumin and smoked paprika onto the chicken before it goes in the pan. Smoked paprika is what makes this taste chipotle rather than salsa-coloured.',
      'Lime squeezed over and cilantro scattered at the end.'] } },
  { id: 71, step: 0, set: 'Sauté the sliced peppers, onions and carrots over medium-high, about 8 minutes, until the edges have taken colour and the carrot has lost its squeak.' },
  { id: 71, lift: { with: 'Garlic, oregano, smoked paprika, hot sauce',
    steps: ['Garlic and a teaspoon of oregano in for the last minute with the vegetables.',
      'Smoked paprika over the pork as it warms through, and hot sauce at the table.'] } },
  { id: 64, step: 0, set: 'Brown the beef with the drained pinto beans and ¼ cup salsa over medium-high, about 8 minutes, until no pink is left and the liquid has cooked down.' },
  { id: 64, lift: { with: 'Cumin, chili powder, garlic, onion',
    steps: ['A diced onion in first, then a teaspoon each of cumin and chili powder with the beef. The recipe is called spicy and has nothing in it that is.',
      'A clove of garlic for the last minute.'] } },
  { id: 68, steps: [
      'Salt the chicken fifteen minutes ahead, poach it until it reads 165°F, rest it five minutes and dice it. Dry chicken is a method problem, not a chicken problem.',
      'Boil the macaroni and broccoli together about 8 minutes, until the pasta is just tender and the broccoli still has some bite; drain.',
      'Stir in the chicken and cream of chicken soup. Portion into 6 containers.',
    ] },
  { id: 68, lift: { with: 'Garlic, black pepper, parmesan, lemon',
    steps: ['A clove of minced garlic and plenty of black pepper stirred into the soup before it meets the pasta.',
      'Parmesan and a squeeze of lemon at the end. Condensed soup is salty and flat; acid is what lifts it.'] } },

  /* Three the clarity scan turned up that are not toast.
   *
   * No. 134 lists "2 soft-boiled eggs" and no step ever boils one, which is
   * the cooked-chicken fault in a gentler place — and soft-boiled is the one
   * egg where the timing is the whole recipe. No. 207 stirs sour cream into a
   * hot pan, which splits it. No. 140 boils franks that are already cooked. */
  { id: 123, step: 1, set: 'Soft-boil the eggs: lower them into water already at a rolling boil, 6 minutes exactly for a set white and a runny yolk, then run them under cold water for a few seconds so they stop cooking. Serve with the soldiers for dipping.' },
  { id: 196, step: 1, set: 'Brown the beef over medium-high about 8 minutes and drain it. Turn the heat down before the sour cream goes in — boiled, it splits and will not come back. Soup in first, sour cream off the heat. No mushroom soup? {r:275} does the same job.' },
  { id: 196, lift: { with: 'Onion, garlic, paprika, Worcestershire',
    steps: ['A diced onion softened before the beef, garlic in at the end of browning.',
      'A teaspoon of paprika and a splash of Worcestershire with the soup. Stroganoff without paprika is beef in white sauce.'] } },
  { id: 129, step: 0, set: 'Franks are already cooked, so this is only heating them through: simmer 6 minutes, or grill them turning often until the skins blister and split.' },

  /* ---- lifts, by family --------------------------------------------------
     Pasta and red sauce. The same three things every time, because it is the
     same dish underneath: something allium, something green and dried, and
     something salty and hard at the end. */
  { id: 155, lift: { with: 'Onion, garlic, oregano, basil, parmesan',
    steps: ['Soften a diced onion before the beef and add two cloves of garlic once it has browned.',
      'A teaspoon each of dried oregano and basil into the sauce, and let it simmer the full ten minutes with them in — dried herbs need time in liquid to give anything up.',
      'Parmesan at the table.'] } },
  { id: 151, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['A diced onion with the beef and a clove of garlic at the end.',
      'A teaspoon of oregano into the tomato sauce, and parmesan over the cheddar before the lid goes on.'] } },
  { id: 165, lift: { with: 'Garlic, oregano, chili flakes, parmesan',
    steps: ['Two cloves of garlic and a teaspoon of oregano into the tomato sauce.',
      'Chili flakes to taste and parmesan at the table.'] } },
  { id: 141, lift: { with: 'Garlic, oregano, parmesan, chili flakes',
    steps: ['A clove of garlic and a teaspoon of oregano stirred into the tomato soup — canned soup is sweet, and the herbs are what stop it tasting like a dessert.',
      'Parmesan and chili flakes over the bowls.'] } },
  { id: 170, lift: { with: 'Onion, garlic, mustard, Worcestershire',
    steps: ['A diced onion with the beef, garlic at the end.',
      'A teaspoon of mustard and a splash of Worcestershire with the ketchup. That combination is what makes a cheeseburger taste of a cheeseburger.'] } },
  { id: 174, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['Onion and garlic with the beef, oregano into the sauce.',
      'Parmesan folded through the cheddar on top.'] } },

  /* Cream-soup casseroles. Condensed soup is salty, sweet and flat; every one
     of these wants aromatics at the front and acid at the end. */
  { id: 160, lift: { with: 'Onion, garlic, thyme, lemon, parmesan',
    steps: ['Soften a diced onion and two cloves of garlic and stir them through the soup.',
      'A pinch of dried thyme in, and a squeeze of lemon over the top when it comes out. Acid is what a cream-soup bake is always missing.'] } },
  { id: 163, lift: { with: 'Garlic, mustard powder, black pepper, parmesan',
    steps: ['A clove of garlic and half a teaspoon of mustard powder into the sauce — mustard makes cheddar taste more of cheddar without tasting of mustard.',
      'Plenty of black pepper, and parmesan mixed into the cheddar.'] } },
  { id: 153, lift: { with: 'Onion, garlic, thyme, black pepper',
    steps: ['A diced onion and a clove of garlic softened and stirred into the soup.',
      'A good pinch of dried thyme and more black pepper than seems right. Pot pie is a thyme dish.'] } },
  { id: 161, lift: { with: 'Onion, garlic, paprika, hot sauce',
    steps: ['A diced onion with the beef and garlic at the end.',
      'A teaspoon of paprika into the soup, and hot sauce at the table.'] } },

  /* Chowders and soups. */
  { id: 144, lift: { with: 'Onion, garlic, thyme, bay, black pepper',
    steps: ['Soften a diced onion in the butter before anything else goes in, with a clove of garlic for the last minute.',
      'A bay leaf and a pinch of thyme in with the milk, fished out before serving. Potato and milk on their own taste of almost nothing; this is the whole difference.'] } },
  { id: 147, lift: { with: 'Onion, garlic, cumin, smoked paprika, lime',
    steps: ['A diced onion softened in the butter, garlic after.',
      'A teaspoon each of cumin and smoked paprika with the milk, and lime squeezed over the bowls.'] } },
  { id: 133, lift: { with: 'Black pepper, hot sauce, parsley',
    steps: ['Canned soup is under-seasoned in one direction only: black pepper, and a few dashes of hot sauce.',
      'Chopped parsley over the top if you have it.'] } },

  /* Roasts and slow cookers. */
  { id: 157, lift: { with: 'Garlic, rosemary, black pepper',
    steps: ['Cut slits in the pork and push slivers of garlic into them before it goes in the cooker.',
      'A branch of rosemary in with it, and black pepper over the top. Pork and applesauce is a sweet pairing and wants something woody against it.'] } },
  { id: 171, lift: { with: 'Onion, garlic, thyme, black pepper',
    steps: ['A sliced onion under the roast and two cloves of garlic in the soup.',
      'Thyme and black pepper over the meat before it goes in.'] } },
  { id: 175, lift: { with: 'Garlic, rosemary, thyme',
    steps: ['Rub the sliced roast with garlic, rosemary and thyme before searing.',
      'Toss the carrots and potatoes in the same before they roast — the herbs are doing more work on the vegetables than on the beef.'] } },
  { id: 181, lift: { with: 'Onion, garlic, smoked paprika, cider vinegar',
    steps: ['A sliced onion under the beef and garlic in with the sauce.',
      'A teaspoon of smoked paprika, and a splash of cider vinegar stirred through the pulled meat at the end. Bottled barbecue sauce is sweet; vinegar is what cuts it.'] } },

  /* Sheet pans and roasted chicken. */
  { id: 54, lift: { with: 'Garlic powder, paprika, oregano, lemon',
    steps: ['A teaspoon each of garlic powder, paprika and oregano tossed with the oil before it all goes on the pan.',
      'Lemon squeezed over the lot as it comes out of the oven.'] } },
  { id: 132, lift: { with: 'Onion powder, garlic powder, Worcestershire, pickles',
    steps: ['Work a teaspoon each of onion and garlic powder and a splash of Worcestershire into the beef before forming the patties.',
      'Pickle slices in the sliders. A cheeseburger without something sharp is just meat and bread.'] } },
  { id: 154, lift: { with: 'Garlic powder, smoked paprika, oregano',
    steps: ['Toss the potatoes and carrots with a teaspoon each of garlic powder and smoked paprika as well as the oil.',
      'A pinch of oregano over everything for the last ten minutes.'] } },

  /* Melts, wraps and cold salads — all of them short of acid or allium. */
  { id: 126, lift: { with: 'Fresh garlic, mustard, black pepper',
    steps: ['Mash a crushed clove of garlic into the butter you spread on the outside. Garlic butter is the difference between a toasted sandwich and a good one.',
      'A thin scrape of mustard inside, and black pepper on the tomato.'] } },
  { id: 138, lift: { with: 'Garlic, oregano, chili flakes, parmesan',
    steps: ['Garlic butter on the outside, oregano stirred into the spaghetti sauce.',
      'Parmesan with the cheddar, chili flakes if you like it hot.'] } },
  { id: 139, lift: { with: 'Onion, celery, lemon, dill, black pepper',
    steps: ['Finely diced raw onion and celery into the tuna mix. Tuna salad is a texture problem before it is a flavour one.',
      'Lemon, dill and black pepper — the lemon especially, which is what stops mayo tasting heavy.'] } },
  { id: 130, lift: { with: 'Onion, lemon, dill, black pepper',
    steps: ['A tablespoon of finely diced onion and a squeeze of lemon into the tuna.',
      'Dill and black pepper. Every good tuna salad is tuna, something sharp, and something crunchy.'] } },
  { id: 148, lift: { with: 'Onion, lemon, dill',
    steps: ['Diced onion into the chicken mix and a squeeze of lemon over the hollowed tomatoes before filling.',
      'Dill through the mayo.'] } },
  { id: 15, lift: { with: 'Lemon, black pepper, red onion',
    steps: ['A squeeze of lemon and plenty of black pepper over the salad.',
      'Thin-sliced red onion, which gives a cold salad the bite that ranch alone does not.'] } },
  { id: 127, lift: { with: 'Chives, garlic powder, hot sauce, bacon bits',
    steps: ['Garlic powder into the butter, chives over the top.',
      'Hot sauce and bacon bits on the bar. A potato bar is a topping problem, so the answer is more toppings.'] } },
  { id: 131, lift: { with: 'Mustard powder, garlic powder, black pepper',
    steps: ['Half a teaspoon of mustard powder and a pinch of garlic powder into the milk before the cheese goes in.',
      'Black pepper at the end. Stovetop mac is mild by design and takes seasoning better than people expect.'] } },
  { id: 140, lift: { with: 'Cumin, chili powder, garlic, lime',
    steps: ['Cumin and chili powder into the chicken before it is rolled.',
      'Lime over the taquitos as they come out of the pan.'] } },
  { id: 143, lift: { with: 'Red onion, cilantro, chili flakes',
    steps: ['Thin-sliced red onion over the barbecue sauce before the cheese.',
      'Cilantro and chili flakes after it comes out.'] } },
  { id: 168, lift: { with: 'Onion, garlic, thyme, Worcestershire',
    steps: ['A diced onion softened with the beef and garlic at the end.',
      'Thyme and a splash of Worcestershire into the meat before the potato goes on. This is the same seasoning as No. 063 because it is the same dish, done properly.'] } },
  { id: 174, lift: { with: 'Cumin, chili powder, garlic, lime',
    steps: ['Cumin and chili powder into the beans and rice.',
      'Garlic in the tomato sauce, lime over the top.'] } },

  /* No. 062 is called Lemon Pepper Chicken and its ingredient list contains
     neither. Black pepper is on the storehouse order, so it goes in the
     recipe; lemon is not, so it goes in the lift. Half a promise kept for
     free, and the other half named. */
  { id: 61, step: 0, set: 'Heat the oven to 400°F. Season the chicken on both sides with salt and a lot of black pepper — more than looks sensible, since pepper is half of what the name promises. Bake 20 minutes; done means 165°F and no pink at the centre.' },
  { id: 61, lift: { with: 'Lemon, garlic powder',
    steps: ['Lemon zest into the pepper rub and the juice squeezed over as it comes out of the oven. That is the other half of the name.',
      'A teaspoon of garlic powder in the rub.'] } },

  /* The rest of the meal sections. */
  { id: 12, lift: { with: 'Lemon, dill, red onion',
    steps: ['Lemon and dill into the mayo before it meets the tuna.',
      'A little finely diced red onion for bite.'] } },
  { id: 21, lift: { with: 'Lemon, celery, onion, dill',
    steps: ['Diced celery and onion for crunch — a chicken salad is mostly texture.',
      'Lemon and dill through the mayo.'] } },
  { id: 72, lift: { with: 'Onion, garlic, bay, thyme, Worcestershire',
    steps: ['Brown the stew meat first, then simmer it with a quartered onion, two cloves of garlic, a bay leaf and a pinch of thyme. Meat simmered in plain water tastes like meat simmered in plain water.',
      'A splash of Worcestershire at the end.'] } },
  { id: 58, lift: { with: 'Onion, garlic, smoked paprika, oregano',
    steps: ['A diced onion softened with the beef, garlic at the end.',
      'A teaspoon of smoked paprika and one of oregano with the chili powder. Chili powder alone is one note; these are the other two.'] } },
  { id: 158, lift: { with: 'Onion, garlic, smoked paprika, oregano',
    steps: ['Onion with the beef, garlic after.',
      'Smoked paprika and oregano into the pot with the beans.'] } },
  { id: 193, lift: { with: 'Onion, garlic, smoked paprika, cocoa',
    steps: ['Onion and garlic with the beef.',
      'Smoked paprika, and a tablespoon of cocoa powder into the pot. Cocoa in chili does not taste of chocolate; it makes the whole thing taste deeper and older than it is.'] } },
  { id: 59, lift: { with: 'Onion, smoked paprika, cider vinegar',
    steps: ['Smoked paprika over the potatoes before they roast.',
      'A splash of cider vinegar and some raw diced onion through the pulled pork. Sweet sauce needs sharp things against it.'] } },
  { id: 162, lift: { with: 'Red onion, cider vinegar',
    steps: ['A splash of cider vinegar stirred through the pulled pork — bottled barbecue sauce is sweet and vinegar is what cuts it.',
      'Thin-sliced raw red onion on the buns.'] } },
  { id: 60, lift: { with: 'Lemon, soy sauce, sesame oil, spring onion',
    steps: ['Lemon or a little soy sauce over the rice while it is still warm, so it soaks in.',
      'A few drops of sesame oil and sliced spring onion at the end.'] } },
  { id: 63, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['Onion and garlic softened and stirred into the spaghetti sauce, with a teaspoon of oregano.',
      'Parmesan over the top before it bakes.'] } },
  { id: 136, lift: { with: 'Garlic powder, hot sauce, spring onion',
    steps: ['Garlic powder and a few dashes of hot sauce into the ranch.',
      'Sliced spring onion in the wrap.'] } },
  { id: 142, lift: { with: 'Mustard, black pepper, dill',
    steps: ['Mustard mixed into the mayo — ham and mustard is the whole point of a ham wrap.',
      'Black pepper and a little dill.'] } },
  { id: 146, lift: { with: 'Mustard, black pepper',
    steps: ['A scrape of mustard inside. Ham, cheese and something sweet needs a sharp corner or it is just sweet.',
      'Black pepper over the peaches.'] } },
  { id: 164, lift: { with: 'Onion, garlic, cumin, cilantro, lime',
    steps: ['Onion and garlic with the beef, and a teaspoon of cumin beyond the taco seasoning.',
      'Cilantro and lime over the top out of the oven.'] } },
  { id: 190, lift: { with: 'Onion, garlic, cumin, cilantro, lime',
    steps: ['Onion and garlic into the chicken filling, cumin with the seasoning.',
      'Cilantro and lime at the end.'] } },
  { id: 166, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['A clove of garlic and a spoon of grated parmesan into the meatball mix.',
      'Onion and oregano into the marinara while it simmers.'] } },
  { id: 177, lift: { with: 'Garlic, rosemary, black pepper',
    steps: ['Garlic and rosemary rubbed over the pork before it roasts.',
      'Black pepper into the applesauce — a sweet sauce against a savoury roast wants something to argue with.'] } },
  { id: 182, lift: { with: 'Garlic powder, thyme, black pepper, lemon',
    steps: ['Garlic powder, thyme and black pepper rubbed over the chicken before roasting.',
      'Lemon squeezed over at the table.'] } },
  { id: 184, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['Onion and garlic with the beef, oregano into the sauce.',
      'Parmesan folded into the sour cream layer.'] } },
  { id: 186, lift: { with: 'Onion, garlic, mustard, thyme, parmesan',
    steps: ['A teaspoon of mustard into the cream soup — mustard is what makes cordon bleu taste like cordon bleu.',
      'Onion, garlic and thyme in with it, parmesan on top.'] } },
  { id: 188, lift: { with: 'Onion, garlic, thyme, Worcestershire',
    steps: ['Onion and garlic with the beef, thyme into the gravy.',
      'A splash of Worcestershire before the topping goes on.'] } },
  { id: 191, lift: { with: 'Onion, garlic, bay, thyme, black pepper',
    steps: ['A quartered onion and two cloves of garlic in the cooker with the roast, and a bay leaf.',
      'Thyme and black pepper over the meat before searing.'] } },
  { id: 192, lift: { with: 'Onion, garlic, oregano, parmesan',
    steps: ['Onion and garlic in the tomato sauce, oregano with them.',
      'Parmesan over the top.'] } },
  { id: 198, lift: { with: 'Garlic powder, paprika, black pepper, hot sauce',
    steps: ['Garlic powder, paprika and plenty of black pepper into the flour before dredging. Seasoned flour is the difference between fried chicken and fried breading.',
      'A few dashes of hot sauce into the milk you dip it in.'] } },
  { id: 199, lift: { with: 'Onion, garlic, bay, thyme, Worcestershire',
    steps: ['A quartered onion, garlic and a bay leaf in with the beef.',
      'Thyme and a splash of Worcestershire into the tomato sauce.'] } },

  /* ---- No. 235, reported by the owner as confusing -----------------------
   *
   * He was right, and it is confusing for four separate reasons.
   *
   * "Mix cake batter in 9x13 dish" — out of what? The ingredient list is a
   * box of cake mix, a packet of pudding mix and hot water. A boxed mix wants
   * eggs, oil and water of its own, none of which is listed, so the first
   * real instruction cannot be carried out at all. Same fault as No. 205's
   * cheese sauce: the recipe knows what it means and never says it.
   *
   * Then it tells you to pour two cups of hot water over a dish of cake
   * batter, which looks like a mistake, and does not say the one thing that
   * makes it not a mistake: this is a self-saucing pudding. The water and the
   * dry pudding mix sink while the cake rises through them, and what comes
   * out is cake on top and hot fudge underneath. Nobody who has not seen it
   * before will believe the instruction without being told why.
   *
   * It also does not say DO NOT STIR, which is the one way to ruin it, and it
   * gives no doneness cue for a dish whose whole point is that the middle
   * stays liquid — so "until a skewer comes out clean" would be exactly wrong
   * and thirty minutes is the only guidance offered.
   *
   * And it is called Bowls, makes "6 Bowls", and never portions anything into
   * a bowl.
   */
  {
    id: 224,
    time: '45 mins',
    ing: ['1 box chocolate cake mix', '3 eggs', '½ cup vegetable oil', '1 cup water',
      '1 pkg chocolate pudding mix', '2 cups hot water'],
    steps: [
      'Heat the oven to 350°F. Butter a 9x13 dish.',
      'Make the cake batter the way the box asks — usually the mix with 3 eggs, ½ cup oil and 1 cup water, beaten smooth. Check your box; they vary. Spread it in the dish.',
      'Sprinkle the dry pudding mix evenly over the batter. Straight from the packet, not made up — it is the sauce, and it needs to be dry going in.',
      'Pour the 2 cups of hot water gently over the whole thing, over the back of a spoon so it does not dig channels. It will look wrong — batter under an inch of water. That is right. Do not stir it.',
      'Bake 30 to 35 minutes. The water and pudding sink while the cake rises through them, so it comes out cake on top with hot fudge underneath.',
    'Done is a top that looks like cake and springs back at the edges, with the middle still visibly loose. A skewer will not come out clean, and is not supposed to.',
      'Let it stand 10 minutes, then spoon into bowls, digging down so each one gets sauce from the bottom. This is why it is bowls and not slices.'
    ],
    lift: {
      with: 'Instant coffee, flaky salt, vanilla ice cream',
      steps: [
        'A teaspoon of instant coffee dissolved into the hot water before it goes over. It does not taste of coffee; it makes the chocolate taste more like chocolate.',
        'A pinch of flaky salt over each bowl, and ice cream while it is still hot.'
      ]
    }
  },

  /* ---- four more of what No. 235 was ------------------------------------
   *
   * Asked how many recipes are like the Hot Fudge Cake. Scanning for
   * packaged mixes used without the things the packet needs found nineteen,
   * of which twelve were my own regex matching "cake mix" inside "pancake
   * mix", and three more name the water in a step rather than on the list,
   * which is untidy but followable. Four are the real thing.
   */

  /* A box cake, baked, with no eggs and no oil anywhere — the same fault as
     No. 235 and the same fix. The frosting is also three ingredients whipped
     with no method and no order, and butter whipped straight from the fridge
     into cocoa gives you cocoa-coloured lumps. */
  {
    id: 205,
    time: '50 mins',
    ing: ['1 box yellow cake mix', '3 eggs', '½ cup vegetable oil', '1 cup milk',
      '½ cup butter (softened)', '½ cup cocoa powder', '2 cups powdered sugar', 'vanilla', 'salt'],
    steps: [
      'Heat the oven to 350°F and butter a 9x13 dish.',
      'Make the cake batter as the box asks, but with the milk in place of the water — it is a box mix either way and milk makes it taste less like one. Usually that is the mix, 3 eggs, ½ cup oil and 1 cup milk, beaten 2 minutes.',
      'Bake 25 to 30 minutes, until the top springs back and a skewer in the middle comes out with a crumb or two and no wet batter. Let it cool completely in the dish. Frosting a warm cake slides it off.',
      'For the frosting, beat the softened butter on its own until it is pale and fluffy — a minute or two, and it must be soft or the cocoa will not go in smoothly. Sift in the cocoa and powdered sugar a bit at a time, then a splash of vanilla and a pinch of salt.',
      'Spread over the cooled cake.'
    ]
  },

  /* "Mix batter" over an ingredient line reading "chocolate chips/cake mix",
     which is one line trying to be two ingredients and an either-or. */
  {
    id: 120,
    ing: ['2 cups pancake mix', '1 cup milk', '1 egg', '¼ cup chocolate chips'],
    steps: [
      'Heat the oven to 375°F and butter a 12-cup mini muffin tin.',
      'Whisk the pancake mix with the milk and the egg into a batter a little thicker than you would pour for pancakes, then fold in the chocolate chips. Lumps are fine; beaten smooth makes them tough.',
      'Fill each cup about two-thirds and bake 12 minutes, until risen and dry to a fingertip in the middle.'
    ]
  },

  /* A gravy packet in a slow cooker with nothing to dissolve it in, and a
     gravy packet made up with no quantity given. Both are the same shape as
     the instant-potato entries above: the packet knows, the person standing
     at the counter does not. */
  { id: 195, step: 1, set: 'Put the patties in the slow cooker with the sliced onions. Whisk the gravy packet into 1½ cups of water and pour it over — dry powder alone will not make gravy. Cook on LOW for 4 hours. No packet? Use plain water and make {r:265} from the liquid.' },
  { id: 182, step: 1, set: 'Make up the mashed potatoes: about 3 cups of flakes to 3 cups of boiling water and a splash of milk. Whisk the gravy packet into 1 cup of cold water before heating it, or it goes lumpy. No packet? {r:265}, stopped while the flour is still blond.' },

  /* Two real ones from the safety sweep, out of thirty-nine flagged. The
     other thirty-seven say "Brown beef", which is a doneness cue; the scan
     only knew "browned" and "until brown". Reading them is the only way to
     tell, which is the lesson of every sweep in this file. */
  { id: 65, step: 2, set: 'Bake on a sheet pan at 375°F for 45 minutes, turning the vegetables once. Pork is done at 145°F, with a faint blush still in it — cooked to grey it is dry. Rest it 5 minutes before portioning.' },
  /* This step was written for No. 072, the buffalo chicken, and landed on
     No. 071 by a one-digit slip of mine — id 73 instead of 74. It told a
     sheet-pan roast to fry its chicken in a skillet and then toss it in hot
     sauce and ranch, neither of which the recipe has. Found by reading the
     book rather than by any check, which is why the guard below now exists. */
  { id: 73, step: 0, set: 'Heat the oven to 400°F.' },
  { id: 74, step: 0, set: 'Cook the diced chicken over medium-high about 8 minutes, until no pink is left and the thickest part reads 165°F. Toss with the hot sauce and ranch while hot — the sauce slides off cold chicken.' },

  /* ---- reading all 277, batch 1: Nos. 001-046 ---------------------------
   *
   * Not a scan. Every recipe read against the six things a scan could not
   * check: quantities usable, a doneness cue where something cooks, a warning
   * where there is one way to ruin it, titles delivering what they promise,
   * yields matching what the method makes, and safe temperatures for meat.
   *
   * Eleven in this batch. Two of them do not work as written.
   */

  /* Raw grated potato pressed into a muffin cup, an egg cracked on top, and
     twenty minutes. The egg sets in twelve; the potato is still raw at
     twenty-five. The crust has to go in on its own first, which is the
     difference between this recipe working and not. */
  { id: 38, step: 2, set: 'Bake the potato shells on their own for 15 minutes first, until the edges are going gold. Raw grated potato will not cook through in the time an egg needs — it comes out crunchy in the wrong way. Then crack an egg into each and season with salt and pepper.' },
  { id: 38, step: 3, set: 'Back in at 375°F for 12 to 14 minutes, until the whites are set and the yolks still soft. Give them 3 minutes more if you want the yolk hard.' },

  /* Cubed raw potato and raw ground beef in a pan together for ten minutes,
     "until crispy/cooked" — a slash where the two foods disagree. Potato
     wants fifteen minutes and beef wants eight, so the potato goes in first. */
  { id: 43, step: 0, set: 'Fry the cubed potatoes in oil over medium-high about 10 minutes, until gold. Then add the beef, 6 to 8 minutes more, until no pink is left. Both at once leaves raw potato and overcooked beef.' },

  /* Both hard-boiled egg recipes list the eggs already boiled and never say
     how, which is fine for somebody who knows and no use at all to somebody
     who does not. It is also the one egg with a definite answer. */
  { id: 4, step: 0, set: 'Hard-boil the eggs if they are not already: lower them into water at a rolling boil, 10 minutes for a firm yolk with no grey ring, then straight into cold water for a minute — that is what makes them peel. Peel them.' },
  { id: 17, step: 0, set: 'Hard-boil the eggs if they are not already — 10 minutes in water at a rolling boil, then a minute in cold water, which is what makes them peel. Peel them into a bowl.' },

  /* Gelatin whipped while it is still hot liquid does nothing at all: it
     needs to be part-set before there is anything for the beaters to hold
     air in. The recipe is called a cloud and cannot make one. */
  { id: 96, time: '1 hr 15 mins', steps: [
    'Dissolve the gelatin in 1 cup of hot water and stir until no grains are left on the bottom.',
    'Stir in the dry milk, then chill 45 minutes to an hour, until it is as thick as raw egg white and mounds slightly on a spoon. Whipping it hot does nothing — there is nothing yet for the air to hold on to.',
    'Now whip it 3 minutes with a hand mixer, until it has doubled and gone pale, then chill 1 hour more to set.'] },

  /* An omelet called fluffy, made by whisking eggs and pouring them in. */
  { id: 45, step: 0, set: 'Whisk the eggs hard for a good 30 seconds, until they are pale and frothy with bubbles on top — that air is the whole of "fluffy", and it goes flat if the pan is not ready. Fold in the cottage cheese and pepper at the end, gently.' },

  /* A crisp is not raw oats on hot fruit. */
  { id: 80, step: 2, set: 'Toast the oats in a dry pan for 2 to 3 minutes until they smell nutty, then sprinkle them over. Raw oats on warm apple go slack; the crisp in the title is toasted oats.' },

  /* Cues and heats the scan could not supply. */
  { id: 34, step: 2, set: 'Pour into the waffle iron and cook about 4 minutes, but go by the steam rather than the clock — a waffle is done when the steam coming out of the sides has mostly stopped. Irons vary more than recipes admit.' },
  { id: 42, step: 0, set: 'Simmer the oats in 1 cup of water over medium heat for about 3 minutes, stirring, until they thicken and the water has gone.' },
  { id: 49, step: 0, set: 'Microwave the oats in 1 cup of water for 2 minutes, in a bowl at least twice as big as it needs to be — oats and water climb the sides and go over.' },
  { id: 48, step: 1, set: 'Cook the sausage and onions in a skillet over medium heat for about 5 minutes, breaking the sausage up, until no pink is left in it.' },
  { id: 48, step: 3, set: 'Bake at 350°F for 18 minutes, until the egg is set at the centre and does not wobble when you nudge the tin.' },

  /* ---- reading all 277, batch 2: Nos. 047-100 ---------------------------
   * Four more, and one of them is a burn risk rather than a matter of taste.
   */

  /* Two drinks say to put hot liquid in a blender and put the lid on. Steam
     expands, the lid goes, and what comes out is a scalding cocoa across the
     ceiling and whoever was holding it. This is the one genuinely dangerous
     instruction in the collection. */
  { id: 26, step: 2, set: 'Blend on high 15 seconds until frothy — but let the Crio Bru cool for five minutes first, or leave the lid cracked with a towel over it. A sealed blender of near-boiling liquid builds steam and lifts its own lid, and what comes out goes over whoever is holding it.' },
  { id: 47, step: 1, set: 'Let the Crio Bru stand five minutes off the boil, then blend it with the whey, brown sugar and salt for 15 seconds. Hot liquid in a sealed blender builds steam and blows the lid off — if it must go in hot, leave the lid cracked and cover it with a folded towel.' },

  /* A fluff with nothing whipped in it. Same fault as No. 044 and the same
     answer: gelatin has to be part-set before it will hold air. */
  { id: 78, time: '2 hrs 15 mins', steps: [
    'Dissolve the gelatin packet in 1 cup of boiling water, stirring until no grains are left.',
    'Whisk in the chocolate whey.',
    'Chill 45 minutes, until it has thickened to about the consistency of raw egg white — it will not whip before that.',
    'Whip 2 to 3 minutes with a hand mixer until pale and doubled, then refrigerate 90 minutes until set.'] },

  /* ---- reading all 277, batch 3: Nos. 101-145 ---------------------------
   *
   * Five recipes name their main ingredient with no amount at all — "Waffle
   * mix", "Rolled oats", "Pancake mix", "broccoli", "green beans" — which is
   * the base of the dish in three cases. Scanning for unquantified lines
   * found 23; the other eighteen are "dash vanilla", "pinch brown sugar",
   * sour cream as a topping, cilantro as a garnish and lollipop sticks, all
   * of which are right as they are. A quantity is only missing when its
   * absence leaves you guessing.
   */
  { id: 101, ing: ['2 cups waffle mix', '2 eggs', '1 cup milk', '2 tbsp butter', '1 can peaches', '1 tsp cinnamon', '¼ cup syrup'] },
  { id: 102, ing: ['2 cups rolled oats', '2 cups milk', '2 eggs', '2 tbsp butter', '1 tsp cinnamon', '½ cup brown sugar', '¼ cup raisins'] },
  { id: 104, ing: ['3 cups pancake mix', '1.5 cups milk', '1 egg', '2 tbsp butter', 'syrup'] },
  { id: 68, ing: ['2 lbs chicken breast', '16 oz macaroni', '1 can cream of chicken', '1 lb broccoli'] },
  { id: 72, ing: ['1.2 lbs stewing beef', '2 cups instant potatoes', '1 can green beans'] },

  /* And the glaze No. 113 drizzles is never made — butter and brown sugar sit
     on the list and step four calls the result a glaze without ever having
     mixed one. */
  { id: 102, step: 3, set: 'Melt the butter with the brown sugar in a small pan over low heat, stirring, until the sugar has dissolved into it — about a minute. That is the glaze. Drizzle it over the top while the bake is still warm so it soaks in.' },

  /* A pound of dry macaroni with one cup of cheese and a quarter cup of milk
     is not a sauce, it is dry pasta with cheese in it. The alfredo bake's
     second fault, at a smaller scale. */
  { id: 131, ing: ['1 pkg (16 oz) macaroni', '2.5 cups cheddar', '1 cup milk', '4 tbsp butter', '4 sliced beef franks'] },
  { id: 131, step: 2, set: 'Melt the butter into the drained pasta, then add the milk and the cheddar a handful at a time over low heat, stirring until each lot has gone before the next. Off a hard boil — cheese boiled into milk goes grainy. Stir the frank coins through at the end.' },

  /* Ground beef is the one meat where the temperature is not optional: a
     whole cut is sterile inside, a patty has its outside ground through it. */
  { id: 132, step: 1, add: 'Ground beef wants 160°F all the way through, not the pink middle a steak can have — grinding puts the outside of the meat on the inside.' },

  /* ---- reading all 277, batches 4 and 5: Nos. 146-277 -------------------
   * Nine more. Three of them cannot produce what they describe.
   */

  /* A pound of dry macaroni, one can of soup and half a cup of milk. That is
     the alfredo bake's second fault again — not enough sauce by half. */
  { id: 141, ing: ['16 oz macaroni', '2 cans tomato soup', '1 cup milk', '1 cup cheddar'] },

  /* Raw cubed potato and sliced franks in a pan together for twelve minutes.
     The franks are already cooked and the potato is not; twelve minutes is
     the frank's time, not the potato's. */
  { id: 149, step: 0, set: 'Fry the cubed potatoes in oil over medium 12 to 15 minutes, until a corner crushes under a spoon. Then add the onion and frank coins for 5 minutes more; the franks only want colour. Serve with ketchup.' },

  /* Diced raw chicken, ten minutes, no check. */
  { id: 167, step: 0, set: 'Sauté the peppers, onions and diced chicken over medium-high about 10 minutes, until the chicken is white through and a piece cut at the thickest point reads 165°F.' },

  /* A cup of raw rice in a slow cooker for six hours. Rice is done in forty
     minutes and then keeps drinking: six hours turns the soup into a solid
     block of starch that has absorbed all four cups of water. */
  { id: 173, step: 0, set: 'Put the chicken, carrots, onions and water into the slow cooker — but keep the rice back. A cup of raw rice given six hours drinks every drop of the liquid and turns the soup into a solid block.' },
  { id: 173, step: 1, set: 'Cook on LOW 6 hours, then lift the chicken out and shred it. Stir the rice in for the last 45 minutes only, or cook it separately and add it to the bowls — either works; six hours in the pot does not.' },

  /* Two cans of green beans given eight hours in a slow cooker. They were
     cooked in the can before they went in. */
  { id: 199, step: 0, set: 'Place the stewing beef, quartered potatoes and tomato sauce in the slow cooker. Keep the green beans out — they are cooked already, in the can, and eight hours turns them to threads.' },
  { id: 199, step: 1, set: 'Cook on LOW for 8 hours until the beef falls apart, then stir the drained green beans through and give them 10 minutes to warm.' },

  /* A pudding with no milk. The packet guard missed this one because the
     ingredient says "1 pkg vanilla pudding" and not "pudding mix" — which is
     why the guard now matches both. */
  { id: 210, ing: ['3 ripe bananas (sliced)', '1 pkg vanilla pudding mix', '2 cups milk', '1 cup oats', '½ cup butter', '¼ cup sugar'] },
  { id: 210, step: 1, set: 'Whisk the pudding mix with the 2 cups of cold milk for two minutes until it thickens, then layer it with the banana slices in the dish.' },

  /* Flour, peanut butter and butter, and nothing else. That is not a cookie
     dough — it is 1½ cups of dry flour with half a cup of fat, which will not
     come together into a ball however long you mix it. It wants sugar, an
     egg and a raising agent, and then it is a thumbprint cookie. */
  {
    id: 213,
    time: '25 mins',
    ing: ['1.5 cups flour', '½ cup peanut butter', '½ cup butter (softened)', '¾ cup sugar',
      '1 egg', '½ tsp baking powder', 'salt', '¼ cup strawberry jam'],
    steps: [
      'Heat the oven to 350°F.',
      'Beat the softened butter, peanut butter and sugar together until light, then beat in the egg.',
      'Stir in the flour, baking powder and a pinch of salt until it comes together into a soft dough. Flour and fat alone will not — it needs the sugar and the egg to bind, which is the difference between a dough and a bowl of crumbs.',
      'Roll into 12 balls, set them well apart on a lined sheet, and press a deep thumbprint into each.',
      'Spoon jam into the hollows and bake 12 to 14 minutes, until the edges are set and just colouring. They firm up as they cool.'
    ]
  },

  /* Cocoa on the ingredient list and never used, and the milk doing the work
     of both. */
  { id: 214, step: 1, set: 'Mix in the cocoa and the milk until it comes together into a fudgy dough that holds a shape when squeezed. Add the milk a teaspoon at a time — too much and it will not hold a stick.' },

  /* You cannot melt cocoa powder. Cocoa is a dry powder and butter and sugar
     alone will seize into a paste; it needs liquid to become a sauce you can
     dip a banana in. */
  { id: 220, ing: ['2 bananas (halved)', '¼ cup cocoa powder', '¼ cup butter', '¼ cup sugar',
    '2 tbsp milk', '4 wooden sticks'] },
  { id: 220, step: 1, set: 'Melt the butter in a small pan over low heat, then whisk in the sugar, the cocoa and the milk until it is glossy and pours off the spoon in a ribbon. Cocoa is a dry powder — without the milk it seizes into a paste you cannot dip anything in.' },

  /* ---- six recipes that say "rice" and mean cooked rice -----------------
   * A cup of rice weighs 185 g dry and 158 g cooked, and holds 675 calories
   * dry against 205 cooked. The same three words, "2 cups rice", therefore
   * name two portions that differ by a factor of three, and every one of
   * these six was being charged the dry figure for rice its own method never
   * cooks.
   *
   * The method is what settles it, not a guess: all six say "cooked rice" in
   * a step, and No. 51 spells the quantity out — "½ cup cooked rice" into
   * each of four containers is two cups cooked, which is exactly what the
   * ingredient line says once it says which it means.
   *
   * Not applied to the other seven recipes that charge dry rice. Two of them
   * boil it in the method and five give no instruction either way, and dry is
   * the right reading for all seven: you measure rice before you cook it.
   * "Cilantro Lime Rice" is a pan of rice, not a bowl of someone else's.
   *
   * The ingredient line is the only thing changed. The method already said
   * cooked; it is the shopping list and the macros that were reading the
   * wrong one, and the macros by a factor of three. */
  { id: 51, ing: ['1.5 lbs chicken breast', '2 cups cooked rice', '1 can black beans', 'bell peppers', 'onions', 'salsa'] },
  { id: 57, ing: ['1.5 lbs chicken breast', '2 cups cooked rice', '1 lb broccoli', '2 tbsp soy sauce', '1 tbsp honey'] },
  { id: 66, ing: ['1.5 lbs chicken breast', '2 cups cooked rice', '1 lb broccoli', 'garlic', 'black pepper'] },
  { id: 67, ing: ['1.2 lbs ground beef', '2 cans green beans', '2 cups cooked rice', 'soy sauce'] },
  { id: 74, ing: ['1.5 lbs chicken breast', '2 cups cooked rice', '4 tbsp hot sauce', '2 tbsp light ranch'] },
  { id: 167, ing: ['1.5 lbs chicken breast', '2 cups cooked rice', '1 cup cheddar', '1 bell pepper', '½ onion'] },

  /* ---- three recipes that assembled raw chicken -----------------------
   *
   * 160, 190 and 192 each had the doneness note added by one group above,
   * the pasta timing by another and the seasoning by a third. Every entry
   * was right on its own. Appended, they produced a step that says to fill
   * the tortillas and then, afterwards, to cook the chicken first — which a
   * careful adult re-reads and a child does not.
   *
   * Nothing short of the whole method fixes an ordering fault, so these are
   * `steps` rather than `add`: cooking the chicken is its own step, before
   * the one that uses it, and each step is a single action. */
  { id: 160, steps: [
    'Heat the oven to 350°F.',
    'Cook and dice the chicken — 165°F, no pink at the centre. Twenty-five minutes under a blanket of soup will not cook it, so it goes in already done.',
    'Boil the pasta two minutes short of the packet time; it finishes in the oven.',
    'Mix the chicken, pasta, soup, broccoli and cheese in a 9x13 dish.',
    'Bake at 350°F for 25 minutes, until it bubbles at the edges.',
  ] },
  { id: 190, steps: [
    'Heat the oven to 375°F.',
    'Cook and shred the chicken — 165°F, no pink at the centre. It will not cook through once it is rolled up and covered in sauce.',
    'Toss the shredded chicken with 2 tbsp taco seasoning and a splash of water, until the liquid has gone and the meat is coated.',
    'Fill the tortillas with the chicken and beans and roll them into the dish.',
    'Cover with the tomato sauce and the cheddar.',
    'Bake 30 minutes.',
  ] },
  { id: 192, steps: [
    'Heat the oven to 350°F.',
    'Cook and dice the chicken — 165°F, no pink at the centre. Raw breast stirred into sauce and baked twenty-five minutes is not reliably done.',
    'Boil the pasta two minutes short of the packet time; it finishes in the oven.',
    'Mix the chicken, pasta, tomato sauce, cream soup and cheese in the dish.',
    'Bake 25 minutes.',
  ] },

  /* ---- the bread pudding had no soak --------------------------------
   *
   * No. 269 as printed: whisk the custard, "pour over bread cubes and raisins
   * in baking dish; bake at 350°F for 35 mins". Three steps, and the one
   * thing a bread pudding actually does is missing. Custard poured over dry
   * cubes and put straight in the oven sets around the bread rather than
   * inside it, and what comes out is soaked underneath and dry on top.
   *
   * It also had no butter and no vanilla, both of which are on the order
   * sheet, and no way to tell when a custard is done — the collection's own
   * Baked Vanilla Custard (no. 283) spends three hours being careful about
   * exactly that, twelve recipes away.
   *
   * The ratio is left alone: three eggs to a cup and a half of milk is the
   * right custard and was right as printed. What changes is the half hour
   * between mixing it and baking it. */
  { id: 219,
    time: '1 hr 20 mins',
    ing: ['6 bread slices (cubed)', '3 eggs', '1.5 cups milk', '⅓ cup sugar',
      '¼ cup raisins', '1 tsp cinnamon', '1 tsp vanilla', '2 tbsp butter'],
    steps: [
      'Butter the baking dish and heat the oven to 350°F.',
      'Use bread that has gone stale. If it is fresh, spread the cubes on a tray and dry them in the oven for 10 minutes — soft bread turns to paste, dry bread drinks the custard and keeps its shape.',
      'Scatter the bread cubes and the raisins in the dish.',
      'Whisk the eggs, milk, sugar, cinnamon, vanilla and a pinch of salt together until no streaks of white are left.',
      'Pour it over the bread and press the cubes down with the back of a spoon until every one of them is wet.',
      'Leave it to soak 30 minutes, pressing it down again halfway. Baked straight away, the custard sets around the bread instead of inside it.',
      'Dot the rest of the butter over the top.',
      'Bake 35 to 40 minutes, until the edges are set and the middle still wobbles a little when you move the dish. It firms as it cools, and baked until the centre is solid it comes out dry.',
      'Stand it 10 minutes before serving. {r:235} poured over the top makes it a pudding for company.',
    ],
    lift: { with: 'Nutmeg',
      steps: ['A good grating of nutmeg into the custard with the cinnamon. It is the spice nobody can name in a bread pudding and everybody misses when it is gone.'] } },

  /* ---- the last custard-over-bread bake with no soak ------------------
   *
   * No. 156 is the bread pudding's fault in a different dish: tear bread into
   * the dish, "whisk eggs, milk, and cinnamon; pour over bread", bake. A
   * custard put straight in the oven sets around the bread rather than inside
   * it, and comes out soaked underneath and dry on top.
   *
   * Swept the whole collection for the shape — bread, egg, milk, baked. Three
   * recipes have it. The oatmeal bake soaks, the bread pudding soaks now, and
   * this was the last one that did not.
   *
   * Vanilla goes in because it is on the order sheet and the other French
   * toast in the book already uses it, and the timer becomes a test, because
   * twenty-five minutes tells you nothing about a custard. The buttering note
   * that used to be appended to step 1 is folded in where it belongs, first,
   * before there is anything in the dish to butter around. */
  { id: 106,
    time: '55 mins',
    ing: ['8 bread slices', '4 eggs', '1 cup milk', '1 tsp cinnamon', '1 tsp vanilla',
      '½ cup strawberry jam', '2 tbsp butter'],
    steps: [
      'Butter the baking dish well. A bake this eggy welds itself to a dry one, and that is what the two tablespoons are for.',
      'Tear the bread into the dish. Stale bread is better than fresh here — it drinks the custard and keeps its shape.',
      'Whisk the eggs, milk, cinnamon and vanilla together until no streaks of white are left.',
      'Pour it over the bread and press the pieces down with the back of a spoon until every one of them is wet.',
      'Leave it to soak 20 minutes, pressing it down once more halfway. Baked straight away, the custard sets around the bread instead of inside it.',
      'Heat the oven to 350°F while it soaks.',
      'Spoon the jam over in blobs rather than spreading it. Spread out it bakes into one sweet layer; in blobs you get pockets of it.',
      'Bake 25 to 30 minutes, until the edges are set and the middle only just wobbles when you move the dish.',
      'Stand it 5 minutes before cutting. It firms as it cools.',
    ] },

  /* No. 11 is the same dish done in a pan, and it had the same hole in a
     smaller way: "dip bread slices to soak" sets no time, so a reader has no
     idea whether that is two seconds or two minutes — and the method never
     says what to cook it in. A dry non-stick pan rather than butter, because
     this one is in the section written for a cut and adding fat to it would
     be answering a different question than the recipe asked. */
  { id: 39,
    steps: [
      'Whisk the eggs, milk, cinnamon and vanilla together in a shallow dish.',
      'Lay each slice in and give it 30 seconds a side, pressing it down. Long enough to take the egg up, and not so long that it falls apart on the way to the pan.',
      'Cook in a non-stick pan over medium heat, about 3 minutes a side, until set through and golden.',
    ] },
  /* ---- six recipes that season with a packet they never list ----------
   * Blake, off No. 196: "Add 2 tbsp taco seasoning" in the method, and
   * nothing of the kind in the ingredients. Six do it. The seasoning could
   * not be listed because it was not a food, so its salt went uncounted in
   * all six and the shopping list never asked for it.
   *
   * The same shape as the barbecue sauce and the gravy mix above, with one
   * difference that decided its shelf: the seasoning's seven spices are all
   * off the order, so No. 337 lives on the Copycat Shelf and says so, and
   * these are the recipes that want it.
   *
   * Optional on the line, the celery-salt treatment, and extras come off in
   * the same breath. Blake: "taco seasoning should footnote, like other
   * recipes." A taco salad is beef, salsa and cheese; the packet makes it
   * taste like the restaurant. Optional means the salt still counts toward
   * the nutrition and never toward what a storehouse cook is sent out for,
   * which gives the six their storehouse bonus back — honestly, this time,
   * because the list now says what the method has always said. Unlike those ten, the ingredient here was MISSING rather than
   * merely bought, so each list gains the line at the amount its own step
   * already states. No. 203 stated none, and now does. */
  { id: 145, extras: null, ing: ['1 lb ground beef', '2 cups lettuce', '2 tomatoes', '½ cup cheddar', 'salsa', 'sour cream', '2 tbsp taco seasoning (optional)'],
    step: 0, add: 'No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },
  { id: 152, extras: null, ing: ['1.5 lbs ground beef', '12 tortillas', '1 can black beans', '1 can corn', 'lettuce', 'cheddar', 'salsa', '2 tbsp taco seasoning (optional)'],
    step: 0, set: 'Brown ground beef in skillet 8 mins with 2 tbsp taco seasoning and ¼ cup water, until the water has gone and the seasoning clings. No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },
  { id: 164, extras: null, ing: ['1.5 lbs ground beef', '8 tortillas', '1 can tomato sauce', '1 can black beans', '1 cup cheddar', '2 tbsp taco seasoning (optional)'],
    step: 1, add: 'No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },
  { id: 172, extras: null, ing: ['1 lb ground beef', '16 oz macaroni', '1 cup salsa', '1 can black beans', '1 cup cheddar', '2 tbsp taco seasoning (optional)'],
    step: 1, add: 'No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },
  { id: 190, extras: null, ing: ['2 lbs chicken breast (shredded)', '12 tortillas', '1 can tomato sauce', '1 can black beans', '1.5 cups cheddar', '2 tbsp taco seasoning (optional)'],
    step: 2, add: 'No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },
  { id: 200, extras: null, ing: ['1.5 lbs ground beef', '12 tortillas (baked crisp)', '1 can black beans', '1 can corn', '1.5 cups cheddar', 'salsa', 'sour cream', '2 tbsp taco seasoning (optional)'],
    step: 0, add: 'No packet in the house? {r:337} makes taco seasoning from seven pantry spices.' },

  /* ---- sour cream, where it helps ---------------------------------------
   * Blake, on his sister-in-law's pink cookies and his son's waffles: "why
   * would she do that? They are delicious!" Sour cream is fat, acid and
   * water in one spoon — a tender crumb, lift off the baking soda, a tang
   * that cuts the sugar. It is on the storehouse order, and plain Greek
   * yogurt does the same job with a third of the calories, so each note
   * names both. The feast and treat sections; the pink cookie he asked
   * about is an added recipe and carries its own. A VARIATION, listed under
   * the method rather than written into a step — in the step it read as
   * part of the recipe and, as Blake found, "it was hard for me to see that
   * that was even an option" — and never a change to the list: the recipe
   * is costed as written and the swap is the cook's to make. */
  { id: 180,
    vary: ['Sour cream for a quarter cup of the milk makes them softer and taller.'] },
  { id: 188,
    vary: ['Sour cream or plain Greek yogurt in place of a quarter cup of the milk makes the topping softer and taller.'] },
  { id: 193,
    vary: ['Sour cream or Greek yogurt for a quarter cup of the milk keeps the corn bread moist.'] },
  { id: 194,
    vary: ['Half a cup of sour cream in the sauce gives it body and tang.'] },
  { id: 203,
    vary: ['Sour cream or Greek yogurt in place of half the milk gives a softer, closer crumb.'] },
  { id: 204,
    vary: ['Half a cup of sour cream or Greek yogurt in place of half a cup of that milk makes the cake softer and richer.'] },
  { id: 205,
    vary: ['Sour cream or Greek yogurt for half the milk: a closer, softer crumb.'] },
  { id: 217,
    vary: ['A quarter cup of sour cream or Greek yogurt in place of a quarter cup of the milk: crisper edges, softer middle.'] },
  { id: 225,
    vary: ['Two tablespoons of sour cream or Greek yogurt in the batter make the fritters lighter and more tender.'] },

  /* ---- the delight pass ------------------------------------------------
   * Blake: "Ideally it's items from the storehouse that I can use to make a
   * regular meal turn into delightful. But if a common buy item is worth
   * it, then let's consider it in enrichment." Then, on the audit: "I have
   * the vinegar and spices and will buy them. Put them in the book."
   *
   * Two kinds of line. A NOTE is a lever the order already carries — an
   * onion in the pan first, browning the meat, roasting instead of boiling,
   * salting the chicken early, toasting the oats, cheese or salsa on the
   * eggs, salt and vanilla in the sweet things — appended to the step where
   * it happens. A LIFT is a thing the order does not carry — a head of
   * garlic, a bottle of vinegar, cumin and paprika, a lemon, Parmesan, soy
   * — in the block that already tells seventy-five recipes what they become
   * with a trip to the shop, so a reader with only the order is never sent
   * there. Where a recipe already had a lift, the old lines come first.
   * Two notes and two lift lines per recipe at most; never a change to an
   * ingredient list, so every recipe stays costed as written.
   *
   * Written from a scan of every method (scratchpad delight-gen.js), then
   * read. The added recipes are here too: the build lets a fix reach them
   * now, so the pink cookie's note stays in its own entry and every other
   * one lives here. */
  { id: 29, step: 1, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 37, step: 0, add: 'Toast the oats two minutes in the dry pan first, until they smell like biscuits, and then add the liquid. Nutty instead of flat.' },
  { id: 38, step: 3, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 42, step: 0, add: 'Toast the oats two minutes in the dry pan first, until they smell like biscuits, and then add the liquid. Nutty instead of flat.' },
  { id: 43, step: 1, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 48, step: 1, add: 'Get the pan hot before the pork goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.' },
  { id: 48, step: 3, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 49, step: 0, add: 'Toast the oats two minutes in the dry pan first, until they smell like biscuits, and then add the liquid. Nutty instead of flat.' },
  { id: 51, step: 0, add: 'Pound the thick end level and salt it while the oven heats; rest it five minutes before cutting. Even thickness is what stops the thin end drying out while the thick end catches up.' },
  { id: 51, lift: { with: 'A head of garlic, Cumin and paprika', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 52, lift: { with: 'Parmesan', steps: [
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 53, step: 0, add: 'A chopped onion under the chicken is worth having; it melts into the salsa over the hours.' },
  { id: 53, lift: { with: 'A head of garlic, Cumin and paprika', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 54, step: 1, add: 'Cut the chicken into even pieces, about an inch, so none of it dries out waiting for the rest.' },
  { id: 55, lift: { with: 'A head of garlic, Cumin and paprika', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 56, step: 1, add: 'Brown the beef in a hot pan before it goes into the cooker, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.' },
  { id: 56, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 57, step: 1, add: 'Or roast it: oil, salt, 425°F, twenty minutes, until the edges go dark. Steamed broccoli is a chore; roasted broccoli is a snack.' },
  { id: 57, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 59, lift: { with: 'Onion, smoked paprika, cider vinegar, A head of garlic', steps: [
      'Smoked paprika over the potatoes before they roast.',
      'A splash of cider vinegar and some raw diced onion through the pulled pork. Sweet sauce needs sharp things against it.',
      'Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.',
    ] } },
  { id: 61, step: 1, add: 'Or roast them: oil, salt, 425°F, fifteen minutes, until they blister. Boiled beans are a side; roasted beans get eaten off the tray.' },
  { id: 62, lift: { with: 'Onion, garlic, thyme, Worcestershire, A bottle of vinegar', steps: [
      'Soften a diced onion with the beef, and a clove of minced garlic for the last minute.',
      'A splash of Worcestershire and a pinch of dried thyme into the browned beef. Shepherd\'s pie without either tastes like mince under mash, which is what this is trying not to be.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 63, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 66, step: 0, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 66, step: 1, add: 'Or roast it: oil, salt, 425°F, twenty minutes, until the edges go dark. Steamed broccoli is a chore; roasted broccoli is a snack.' },
  { id: 66, lift: { with: 'A bottle of vinegar, A lemon', steps: [
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
      'The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.',
    ] } },
  { id: 67, lift: { with: 'Garlic, ginger, sesame oil, chili flakes, A bottle of vinegar', steps: [
      'Minced garlic and ginger into the pan for the last minute of browning, not at the start — both burn.',
      'A teaspoon of sesame oil off the heat at the end, and chili flakes to taste. Sesame oil cooked hard loses the thing you added it for.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 69, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 70, lift: { with: 'Cumin, smoked paprika, lime, cilantro, A head of garlic', steps: [
      'A teaspoon each of cumin and smoked paprika onto the chicken before it goes in the pan. Smoked paprika is what makes this taste chipotle rather than salsa-coloured.',
      'Lime squeezed over and cilantro scattered at the end.',
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
    ] } },
  { id: 71, lift: { with: 'Garlic, oregano, smoked paprika, hot sauce, A bottle of vinegar', steps: [
      'Garlic and a teaspoon of oregano in for the last minute with the vegetables.',
      'Smoked paprika over the pork as it warms through, and hot sauce at the table.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 72, lift: { with: 'Onion, garlic, bay, thyme, Worcestershire, A bottle of vinegar, Soy sauce', steps: [
      'Brown the stew meat first, then simmer it with a quartered onion, two cloves of garlic, a bay leaf and a pinch of thyme. Meat simmered in plain water tastes like meat simmered in plain water.',
      'A splash of Worcestershire at the end.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
      'A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.',
    ] } },
  { id: 73, step: 1, add: 'Pound the thick end level and salt it while the oven heats; rest it five minutes before cutting. Even thickness is what stops the thin end drying out while the thick end catches up.' },
  { id: 102, step: 1, add: 'Toast the oats two minutes in the dry pan first, until they smell like biscuits, and then add the liquid. Nutty instead of flat.' },
  { id: 103, step: 0, add: 'Get the pan hot before the pork goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.' },
  { id: 107, step: 1, add: 'Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.' },
  { id: 113, lift: { with: 'Parmesan', steps: [
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 115, step: 0, add: 'Toast the oats two minutes in the dry pan first, until they smell like biscuits, and then add the liquid. Nutty instead of flat.' },
  { id: 116, step: 0, add: 'Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.' },
  { id: 119, step: 2, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 121, step: 0, add: 'Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.' },
  { id: 121, step: 1, add: 'A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.' },
  { id: 128, lift: { with: 'Cumin and paprika', steps: [
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 133, step: 0, add: 'Start with half an onion in the pan, cooked until it is soft and sweet — five minutes nobody ever regrets.' },
  { id: 133, lift: { with: 'Black pepper, hot sauce, parsley, A head of garlic, A bottle of vinegar', steps: [
      'Canned soup is under-seasoned in one direction only: black pepper, and a few dashes of hot sauce.',
      'Chopped parsley over the top if you have it.',
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 135, lift: { with: 'A head of garlic, Cumin and paprika', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 144, lift: { with: 'Onion, garlic, thyme, bay, black pepper, A bottle of vinegar', steps: [
      'Soften a diced onion in the butter before anything else goes in, with a clove of garlic for the last minute.',
      'A bay leaf and a pinch of thyme in with the milk, fished out before serving. Potato and milk on their own taste of almost nothing; this is the whole difference.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 149, lift: { with: 'A head of garlic', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
    ] } },
  { id: 152, lift: { with: 'A head of garlic', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
    ] } },
  { id: 153, lift: { with: 'Onion, garlic, thyme, black pepper, A bottle of vinegar, Parmesan', steps: [
      'A diced onion and a clove of garlic softened and stirred into the soup.',
      'A good pinch of dried thyme and more black pepper than seems right. Pot pie is a thyme dish.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 154, lift: { with: 'Garlic powder, smoked paprika, oregano, Parmesan', steps: [
      'Toss the potatoes and carrots with a teaspoon each of garlic powder and smoked paprika as well as the oil.',
      'A pinch of oregano over everything for the last ten minutes.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 155, step: 0, add: 'Or roast them: oil, salt, 425°F, fifteen minutes, until they blister. Boiled beans are a side; roasted beans get eaten off the tray.' },
  { id: 157, step: 0, add: 'Brown the pork in a hot pan before it goes into the cooker, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.' },
  { id: 157, lift: { with: 'Garlic, rosemary, black pepper, A bottle of vinegar, Parmesan', steps: [
      'Cut slits in the pork and push slivers of garlic into them before it goes in the cooker.',
      'A branch of rosemary in with it, and black pepper over the top. Pork and applesauce is a sweet pairing and wants something woody against it.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 159, step: 0, add: 'Brown the beef in a hot pan before it goes into the cooker, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.' },
  { id: 159, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 160, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 161, lift: { with: 'Onion, garlic, paprika, hot sauce, A bottle of vinegar, Parmesan', steps: [
      'A diced onion with the beef and garlic at the end.',
      'A teaspoon of paprika into the soup, and hot sauce at the table.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 162, lift: { with: 'Red onion, cider vinegar, A head of garlic', steps: [
      'A splash of cider vinegar stirred through the pulled pork — bottled barbecue sauce is sweet and vinegar is what cuts it.',
      'Thin-sliced raw red onion on the buns.',
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
    ] } },
  { id: 163, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 164, lift: { with: 'Onion, garlic, cumin, cilantro, lime, Parmesan', steps: [
      'Onion and garlic with the beef, and a teaspoon of cumin beyond the taco seasoning.',
      'Cilantro and lime over the top out of the oven.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 165, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 167, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 169, step: 1, add: 'Pat the strips dry before they go into the egg, and once they are in the hot pan do not move them until the underside is brown.' },
  { id: 170, lift: { with: 'Onion, garlic, mustard, Worcestershire, Parmesan', steps: [
      'A diced onion with the beef, garlic at the end.',
      'A teaspoon of mustard and a splash of Worcestershire with the ketchup. That combination is what makes a cheeseburger taste of a cheeseburger.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 171, lift: { with: 'Onion, garlic, thyme, black pepper, A bottle of vinegar', steps: [
      'A sliced onion under the roast and two cloves of garlic in the soup.',
      'Thyme and black pepper over the meat before it goes in.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 172, lift: { with: 'A head of garlic, Parmesan', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 173, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 174, lift: { with: 'Cumin, chili powder, garlic, lime, Parmesan', steps: [
      'Cumin and chili powder into the beans and rice.',
      'Garlic in the tomato sauce, lime over the top.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 176, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 177, lift: { with: 'Garlic, rosemary, black pepper, A bottle of vinegar', steps: [
      'Garlic and rosemary rubbed over the pork before it roasts.',
      'Black pepper into the applesauce — a sweet sauce against a savoury roast wants something to argue with.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 180, step: 0, add: 'Brown the beef first, in batches, dark on every side. The stew tastes of that crust; skip it and it tastes of boiled beef.' },
  { id: 180, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 182, lift: { with: 'Garlic powder, thyme, black pepper, lemon, Parmesan', steps: [
      'Garlic powder, thyme and black pepper rubbed over the chicken before roasting.',
      'Lemon squeezed over at the table.',
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 185, step: 0, add: 'An onion first: chopped, into the hot fat, and left until the edges go gold before the rest arrives.' },
  { id: 185, lift: { with: 'A head of garlic, Cumin and paprika', steps: [
      'Two cloves of garlic, chopped, into the pan for the last minute of cooking — any longer and it burns bitter.',
      'A teaspoon of cumin and one of paprika in with the meat as it cooks. Or the taco seasoning: {r:337}.',
    ] } },
  { id: 186, step: 1, set: 'Salt the chicken fifteen minutes ahead and pound the thick end level — dry chicken is a method problem, not a chicken problem. Layer chicken breasts and ham slices in dish, cover with cream soup and cheddar.' },
  { id: 187, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 188, lift: { with: 'Onion, garlic, thyme, Worcestershire, A bottle of vinegar', steps: [
      'Onion and garlic with the beef, thyme into the gravy.',
      'A splash of Worcestershire before the topping goes on.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 190, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 191, lift: { with: 'Onion, garlic, bay, thyme, black pepper, Soy sauce', steps: [
      'A quartered onion and two cloves of garlic in the cooker with the roast, and a bay leaf.',
      'Thyme and black pepper over the meat before searing.',
      'A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.',
    ] } },
  { id: 192, step: 1, add: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.' },
  { id: 195, lift: { with: 'A head of garlic, A bottle of vinegar', steps: [
      'Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.',
      'Finish with a teaspoon of vinegar, off the heat. Everything in the pot tastes more like itself.',
    ] } },
  { id: 198, step: 0, set: 'Salt the chicken fifteen minutes ahead and pound the thick end level — dry chicken is a method problem, not a chicken problem. Dip chicken in milk, coat in flour.' },
  { id: 198, lift: { with: 'Garlic powder, paprika, black pepper, hot sauce, A bottle of vinegar', steps: [
      'Garlic powder, paprika and plenty of black pepper into the flour before dredging. Seasoned flour is the difference between fried chicken and fried breading.',
      'A few dashes of hot sauce into the milk you dip it in.',
      'A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.',
    ] } },
  { id: 199, step: 1, add: 'Brown the beef in a hot pan before it goes into the cooker, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.' },
  { id: 200, lift: { with: 'A head of garlic', steps: [
      'Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.',
    ] } },
  { id: 206, step: 1, add: 'A pinch of salt and half a teaspoon of vanilla in with it — the two things a box leaves out, and the two that make it taste like a kitchen.' },
  { id: 222, step: 0, add: 'A pinch of salt and half a teaspoon of vanilla in with it — the two things a box leaves out, and the two that make it taste like a kitchen.' },
  { id: 230, step: 0, add: 'Or roast them: cut small, oil, salt, 425°F, thirty minutes, turned once. Boiled potatoes are wet; roasted ones have corners.' },
  { id: 230, lift: { with: 'Soy sauce', steps: [
      'A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.',
    ] } },
  { id: 234, step: 0, add: 'A minute in the oil before the water goes in, stirred, and the rice tastes of something instead of nothing.' },
  { id: 239, step: 0, add: 'A minute in the oil before the water goes in, stirred, and the rice tastes of something instead of nothing.' },
  { id: 245, lift: { with: 'Parmesan', steps: [
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 323, lift: { with: 'Parmesan', steps: [
      'A handful of grated Parmesan over the top for the last five minutes — salt, and a crust that a box never makes.',
    ] } },
  { id: 329, step: 0, add: 'Pound the thick end level and salt it while the pan heats. Even thickness is what stops the thin end drying out while the thick end catches up.' },
  { id: 333, lift: { with: 'Soy sauce', steps: [
      'A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.',
    ] } },

  /* ---- name the pan, and say what lines it ------------------------------
   *
   * Blake, cooking from the printed book: "How big is a pan for this recipe?
   * Line with what?" No. 331 said "press into a lined square pan" and never
   * answered either question. Nineteen recipes named a vessel with no size
   * anywhere in them, and three said "lined" without saying what with, which
   * is the word that decides whether the slab comes out in one piece.
   *
   * Sized by what actually goes in rather than by the serving count: an
   * 8-inch square is 412 cm2 of floor, a 9-inch 524, a 9x13 dish 756, a 9x5
   * loaf 291, and two to four centimetres deep is the band a bake cooks
   * through evenly. No. 328 already did this properly, buttering the pan and
   * lining it with a strip of parchment hanging over two sides, and it is the
   * model the rest of these follow. */
  { id: 63, step: 2, set: "Mix chicken, pasta, and spaghetti sauce in a 9x13-inch baking dish." },
  { id: 106, step: 0, set: "Butter an 8-inch square baking dish well. A bake this eggy welds itself to a dry one, and that is what the two tablespoons are for." },
  { id: 118, step: 1, set: "Mix the ingredients in an 8-inch square baking dish." },
  { id: 161, step: 2, set: "Layer potatoes, beef, mushroom soup, and cheddar in a 9x13-inch baking dish. No mushroom soup? {r:275} layers in exactly the same way, and {r:265} made pale does the binding just as well." },
  { id: 171, step: 1, set: "Place the pork roast in a 9x13-inch baking dish, cover with mushroom soup. The soup is the gravy here, and {r:265} is a better one — make it pale, with the juices from the tin once the roast is out. {r:275} works too if you want it thicker." },
  { id: 174, step: 1, set: "Mix black beans, rice, tomato sauce, and sour cream in an 8-inch square baking dish." },
  { id: 188, step: 3, set: "Spoon the beef into a 9x13-inch baking dish, drop the dough over it in rough spoonfuls, and bake 25 minutes until the topping is golden and dry at the centre." },
  { id: 201, step: 1, set: "Toss sliced apples with 1 tsp cinnamon in an 8-inch square baking dish." },
  { id: 203, step: 1, set: "Pour the peaches into an 8-inch square baking dish." },
  { id: 206, step: 2, set: "Press firmly into a parchment-lined 8-inch square pan and chill in fridge 1 hour before cutting." },
  { id: 218, step: 1, set: "Roll it out, line a 9-inch pie dish, and prick the base all over with a fork. Bake 15 minutes until dry and pale gold. Pricking is what stops the base rising into a dome under the filling." },
  { id: 219, step: 0, set: "Butter an 8-inch square baking dish and heat the oven to 350°F." },
  { id: 222, step: 1, set: "Press into a parchment-lined 8-inch square pan and freeze 30 mins before cutting into squares." },
  { id: 232, step: 1, set: "Tip into an 8-inch square baking dish and put it in the oven at 400°F for 10 minutes, until the fruit is hot and beginning to bubble. Putting the topping on hot fruit is what cooks its underside." },
  { id: 254, step: 0, set: "Butter an 8-inch square pan and line it with a strip of parchment hanging over two sides." },
  { id: 256, step: 1, set: "Roll it out, line a deep 9-inch pie dish, prick the base all over and line it with paper and baking weights." },
  { id: 213, step: 3, set: "Roll into 12 balls, set them well apart on a parchment-lined sheet, and press a deep thumbprint into each." },

  /* ---- how hot, how long, and how you know ------------------------------
   *
   * Sixteen recipes cooked raw chicken, pork or beef with no temperature, no
   * time and no doneness cue anywhere in them. No. 104 said "into a hot
   * oven" and then "take the chicken off as soon as it is done", defining
   * neither. No. 103 roasted pork for three hours on "hot to start, then
   * drop the heat", naming two temperatures and giving no number for either.
   *
   * Three of them — nos. 75, 77 and 82 — poach chicken, cool it and serve it
   * cold, which is the one combination in this book that can make somebody
   * ill, and all three said only "poach the chicken".
   *
   * Chicken to 165F, whole-muscle pork to 145F and a rest, the shoulder
   * taken past that because it is being pulled, braises to fork-tender.
   * Times sized to the cut each recipe actually calls for. */

  /* Two the first pass missed. No. 110 dropped out of a sweep for recipes
     with no digits in them because the pan pass had just put "8-inch" in
     one — a filter made stale by my own edit an hour earlier. No. 102 got
     its clock but not its cue, while its two siblings kept theirs. */

  /* The last two, found by asking the question of every raw-chicken recipe
     rather than of the ones a keyword sweep had already turned up. */

  /* ---- instant, and the potatoes nobody served --------------------------
   *
   * Nine recipes called for pudding mix and not one said instant. Six of
   * them whisk it into cold milk, which cook-and-serve never sets in: the
   * cook ends up with a pie shell and a bowl of chocolate milk.
   *
   * No. 269 was worse than a wording gap. "1 pkg vanilla pudding" parsed as
   * already-made pudding while the recipe ALSO listed two cups of milk, and
   * its own step whisks the packet with that milk — so the milk was counted
   * twice and the macros have been wrong. Naming it a mix fixes the food,
   * not just the sentence.
   *
   * And no. 248 listed three cups of instant potatoes that no step ever
   * mentioned. That is half the plate, priced into every serving and never
   * made. */
  { id: 98, ing: ["1 pkg instant chocolate pudding mix", "2 cups milk", "1 scoop whey"] },
  { id: 202, ing: ["1 pkg instant chocolate pudding mix", "2 cups milk", "1 can peaches (diced)"] },
  { id: 204, ing: ["1 box chocolate cake mix", "3 eggs", "3 cups milk", "½ cup butter", "1 pkg instant chocolate pudding mix"] },
  { id: 208, ing: ["1 pkg instant vanilla pudding mix", "2 cups milk", "1 diced apple", "1 sliced banana", "1 cup grapes"] },
  { id: 210, ing: ["3 ripe bananas (sliced)", "1 pkg instant vanilla pudding mix", "2 cups milk", "1 cup oats", "½ cup butter", "¼ cup sugar"] },
  { id: 216, ing: ["½ yellow cake (cubed)", "1 pkg instant vanilla pudding mix", "2 cups milk", "1 can peaches (diced)"] },
  { id: 218, ing: ["1.5 cups flour", "½ cup butter", "4 tbsp cold water", "salt", "1 pkg instant chocolate pudding mix", "2 cups milk"] },
  { id: 224, ing: ["1 box chocolate cake mix", "3 eggs", "½ cup vegetable oil", "1 cup water", "1 pkg instant chocolate pudding mix", "2 cups hot water"] },
  { id: 195, steps: [
      'Sear beef patties in skillet 3 mins per side.',
      'Put the patties in the slow cooker with the sliced onions. Whisk the gravy packet into 1\u00bd cups of water and pour it over \u2014 dry powder alone will not make gravy. Cook on LOW for 4 hours. No packet? Use plain water and make {r:265} from the liquid.',
      'Stir the instant potatoes into 3 cups of boiling water, let them stand a minute, and serve the patties and their gravy over them.',
    ] },
  { id: 89, step: 0, set: 'Use a serving of made-up chocolate pudding \u2014 a packet whisked with 2 cups of cold milk makes four of them, or {r:202} if you would rather it was already portioned.' },

  /* ---- what the audit of 2026-09-20 left open --------------------------
   *
   * No. 238's rice is priced dry — two cups of it, 370 g — and the method
   * only ever served it. It now says it is dry and says how to cook it.
   *
   * Nos. 269 and 276 are built on half a yellow cake and never said which.
   * The book bakes one: No. 258, which frosts it; these want it plain.
   *
   * The doughnut dough went from "a soft dough" straight to rising. Enriched
   * dough that is not kneaded rises slack and fries greasy.
   *
   * The times. A card's time is how long until you can eat it, which is how
   * the book already writes the horchata, the fried chicken and the cream pie.
   * These said only the hands-on part, so an overnight soak read as five
   * minutes and a 3-hour set as ten. Storage notes ("keeps a week") and
   * "if you can" waits do not count; a wait the method requires does. */
  { id: 185, ing: ['2 lb pork roast', '1 jar salsa', '12 tortillas', '1 can black beans', '2 cups dry rice', 'sour cream'] },
  { id: 185, step: 1, set: 'While the pork crisps, bring 4 cups of water to the boil with a pinch of salt, stir in the rice, cover, and simmer on the lowest heat 18 minutes. Leave it covered off the heat 5 minutes, then fluff it with a fork. Serve with the rice, beans, tortillas, and sour cream.' },
  { id: 216, step: 1, add: 'The cake is half of {r:205}, baked and left unfrosted.' },
  { id: 223, step: 0, add: 'The cake is half of {r:205}, baked and left unfrosted.' },
  /* Count what sticks (parse-lib, EATEN): the flour these are turned through
     is a dredge, and says so. */
  { id: 169, ing: ['1.5 lbs chicken breasts (cut into strips)', '1 cup flour, for the dredge', '2 eggs', '2 tbsp honey', '2 tbsp mustard', '2 lbs potatoes'] },
  { id: 198, ing: ['2 lbs chicken breasts', '1 cup flour, for the dredge', '½ cup milk', '4 tbsp butter', '3 cups mashed potatoes'] },
  { id: 27, time: '8 hrs 5 mins' },
  { id: 46, time: '8 hrs 4 mins' },
  { id: 91, time: '30 mins' },
  { id: 76, time: '13 mins' },
  { id: 60, time: '40 mins' },
  { id: 206, time: '1 hr 10 mins' },
  { id: 207, time: '3 hrs 10 mins' },
  { id: 208, time: '25 mins' },
  { id: 216, time: '45 mins' },
  { id: 218, time: '3 hrs 10 mins' },
  { id: 221, time: '2 hrs 20 mins' },
  { id: 266, time: '1 hr 5 mins' },
  { id: 332, time: '1 hr 5 mins' },

  /* ---- the recipe audit, 2026-09-26. Every recipe checked against
     well-regarded published versions and food-safety guidance, by batch.
     Whole lists, not patches: each entry is the finished ingredient list
     and method, so an earlier add on the same recipe cannot land in the
     wrong place again. Servings are realistic portions (Blake's call);
     titles that promised what the recipe does not have were renamed. */
  // Listed pepper is now used in the tuna mix.
  {"id":2,"steps":["Slice bell pepper in half and remove seeds.","In a small bowl, mix drained tuna, light mayo, hot sauce, and black pepper.","Spoon tuna mixture into the pepper halves and serve."]},
  // A whole 12.5 oz can is two portions, not one.
  {"id":3,"servings":"2 Servings (1 Salad Bowl Each)","servN":2,"steps":["Chop lettuce into two bowls.","Drain canned chicken and black beans.","Toss chicken and beans over the lettuce, pour salsa on top, and eat."]},
  // A whole 12.5 oz can is two portions; filling split across 6 cups.
  {"id":7,"servings":"2 Servings (3 Lettuce Cups Each)","servN":2,"steps":["Drain canned chicken.","Mix chicken with hot sauce and ranch in a bowl.","Spoon equal amounts into 6 large lettuce leaf cups."]},
  // A whole 12.5 oz can is two portions, not one.
  {"id":15,"servings":"2 Servings (1 Salad Each)","servN":2,"steps":["Chop lettuce into two bowls.","Add drained canned chicken and drizzle ranch dressing on top."]},
  // Title promised celery the recipe never had; whole can is two portions.
  {"id":21,"name":"Creamy Chicken Salad","servings":"2 Servings (1 Bowl Each)","servN":2},
  // Cooling moved before the hot liquid goes into the blender.
  {"id":26,"steps":["Brew hot Crio Bru cacao and let it cool for five minutes.","Put oat flour, whey, creatine, milk, cinnamon, and the Crio Bru into a blender.","Blend on high 15 seconds until frothy, with the lid cracked and a towel held over it. A sealed blender of near-boiling liquid builds steam and lifts its own lid, and what comes out goes over whoever is holding it."]},
  // Sausage is raw going in, with a 160°F doneness cue and a drain step.
  {"id":28,"ing":["3 eggs","2 oz raw bulk pork sausage","¼ cup salsa","1 tortilla"],"steps":["Crumble the sausage into a skillet over medium heat and cook 5 to 6 minutes, until no pink is left (160°F). Drain the fat.","Add beaten eggs and scramble for 3 mins until set.","Roll into tortilla with salsa."]},
  // Butter used in step 1 is now listed and counted.
  {"id":32,"ing":["3 eggs","1 tsp butter","½ cup black beans","¼ cup salsa","1 tbsp sour cream"]},
  // Toasting now comes before the simmer, not after.
  {"id":37,"steps":["Toast the oats in a dry pan over medium heat for two minutes, until they smell like biscuits. Nutty instead of flat. Add 1 cup of water and simmer about 3 minutes, stirring, until they thicken and the water has gone.","Stir in whey protein.","Top with peanut butter and sliced banana."]},
  // Grated potato is squeezed dry so the shells brown instead of steaming.
  {"id":38,"steps":["Preheat oven to 375°F.","Squeeze the grated potato hard in a clean towel to get the water out. Spray 3 muffin cups with oil and press the potato into the bottoms and sides.","Bake the potato shells on their own for 15 minutes first, until the edges are going gold. Raw grated potato will not cook through in the time an egg needs — it comes out crunchy in the wrong way. Then crack an egg into each and season with salt and pepper.","Back in at 375°F for 12 to 14 minutes, until the whites are set and the yolks still soft. Give them 3 minutes more if you want the yolk hard. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."]},
  // Toasting now comes before the simmer, not after.
  {"id":42,"steps":["Toast the oats in a dry pan over medium heat for two minutes, until they smell like biscuits. Nutty instead of flat. Add 1 cup of water and simmer about 3 minutes, stirring, until they thicken and the water has gone.","Stir in chocolate whey and cocoa powder.","Slice banana on top."]},
  // Frying oil is now listed and counted; beef gets a 160°F cue.
  {"id":43,"ing":["3 oz ground beef","2 eggs","½ cup diced potatoes","1 tbsp oil"],"steps":["Fry the cubed potatoes in the oil over medium-high about 10 minutes, until gold. Then add the beef, 6 to 8 minutes more, until no pink is left (160°F). Both at once leaves raw potato and overcooked beef.","Push to side and fry 2 eggs in same pan for 3 mins. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."]},
  // whey was blended into near-boiling liquid, which clumps it; slurried in cold water first
  {"id":47,"ing":["12 oz Crio Bru","1 scoop whey","1 tsp brown sugar","pinch sea salt","3 tbsp cold water"],"steps":["Brew hot Crio Bru.","Stir the whey, brown sugar and salt into 3 tbsp cold water until smooth — whey dropped straight into hot liquid clumps. Whisk in the hot Crio Bru a little at a time."]},
  // tin was never greased
  {"id":48,"steps":["Preheat oven to 350°F. Grease 4 cups of a muffin tin well, or use silicone or paper liners — baked egg welds itself to bare metal.","Cook the sausage and onions in a skillet over medium heat for about 5 minutes, breaking the sausage up, until no pink is left in it. Get the pan hot before the pork goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Divide into 4 muffin tins, pour beaten egg into each.","Bake at 350°F for 18 minutes, until the egg is set at the centre and does not wobble when you nudge the tin. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."]},
  // step 1 said both microwave and pan-toast in contradictory order
  {"id":49,"steps":["Toast the oats two minutes in a dry pan, until they smell like biscuits — nutty instead of flat. Tip them into a microwave bowl at least twice as big as it needs to be, add 1 cup of water and microwave 2 minutes; oats and water climb the sides and go over.","Stir in vanilla whey, splash of milk, and cinnamon."]},
  // butter used in step 1 was not listed
  {"id":50,"ing":["3 eggs","½ cup cottage cheese","1 tsp butter","salsa"]},
  // potatoes would still be hard at 25 mins on crowded pans; given a 15-min head start
  {"id":54,"time":"45 mins","steps":["Preheat oven to 400°F.","Cube chicken, potatoes, broccoli, and peppers. Toss with 1 tbsp oil, salt, pepper. Cut the chicken into even pieces, about an inch, so none of it dries out waiting for the rest.","Spread the potatoes over 2 pans and roast at 400°F for 15 minutes. Add the chicken, broccoli and peppers and roast 20 to 25 minutes more, until the potatoes are tender. Check the chicken before serving: no pink at the centre, 165°F on a thermometer.","Divide into 6 containers."]},
  // 4 peppers halved make 8 halves; label now matches the 4-serving macros
  {"id":55,"servings":"4 Servings (2 Pepper Halves Each)","servN":4},
  // 2 tsp salt was uncounted (sodium ~775 mg not 201); browning moved before the beef goes into the cooker
  {"id":56,"ing":["2 lbs stewing beef","2 lbs potatoes","1 lb carrots","1 onion","2 tsp salt","black pepper"],"steps":["Brown the stewing beef in a hot pan, in batches, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.","Put the browned beef, cubed potatoes, sliced carrots, diced onion, 2 tsp salt, pepper and 2 cups water in the slow cooker.","Cover and cook LOW 8 hours until beef falls apart.","Divide into 6 containers."]},
  // no lemon, so title renamed; bean-roasting tip was attached to the potatoes; potato cut size added; beans drained
  {"id":61,"name":"Black Pepper Chicken Breast & Green Beans","ing":["1.5 lbs chicken breast","2 cans (14.5 oz) green beans, drained","1.5 lbs potatoes"],"steps":["Heat the oven to 400°F. Season the chicken on both sides with salt and a lot of black pepper — more than looks sensible, since the pepper is the point. Bake 20 minutes; done means 165°F and no pink at the centre.","Cut the potatoes into 1-inch chunks and boil 15 minutes, until a knife slides in; drain. Warm the green beans in a pan — or roast them: oil, salt, 425°F, fifteen minutes, until they blister. Boiled beans are a side; roasted beans get eaten off the tray.","Portion chicken, potatoes, and green beans into 4 containers."]},
  // 2 cups flakes had about half the liquid they need (packet: 1⅔ cups liquid per cup); milk added as a counted line
  {"id":62,"ing":["1 lb ground beef","2 cups instant potatoes","⅔ cup milk","1 can (14.4 oz) corn, drained","1 can (14.5 oz) green beans, drained"],"steps":["Brown the beef in a skillet over medium-high, breaking it up, about 8 minutes, until no pink is left. Drain the fat.","Make up the instant potatoes: bring 2⅔ cups of water to the boil, take it off the heat, add the milk, then stir in the 2 cups of flakes with a fork until fluffy. Give it a minute to thicken. Out of flakes? {r:276} does it from the potatoes on the order.","Layer beef, green beans, corn, and potatoes into 4 containers."]},
  // tortilla size unstated; 'large burritos' need 10-inch tortillas, which also changes the macros
  {"id":64,"ing":["1 lb ground beef","1 can (15 oz) pinto beans","4 large (10-inch) flour tortillas","salsa"]},
  // cut pork roasted 45 mins would overshoot 145°F; loin roasted whole after a vegetable head start, and the cut named to match the title
  {"id":65,"time":"55 mins","ing":["1.5 lbs pork roast","1.5 lbs carrots","1 lb potatoes","garlic","pepper"],"steps":["Preheat oven to 375°F.","Cut the carrots and potatoes into chunks. Season them and the whole pork loin with garlic powder and pepper.","Roast the carrots and potatoes on a sheet pan at 375°F for 20 minutes. Add the pork loin and roast 25 to 30 minutes more, turning the vegetables once. Pork is done at 145°F, with a faint blush still in it — cooked to grey it is dry. Rest it 5 minutes, then slice and portion."]},
  // raw broccoli was never cooked before going into the skillet
  {"id":66,"steps":["Pan-fry diced chicken 8 mins. Check a piece: white all the way through, 165°F. Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.","Steam the broccoli florets 5 minutes. Or roast them: oil, salt, 425°F, twenty minutes, until the edges go dark. Steamed broccoli is a chore; roasted broccoli is a snack.","Add the cooked rice, broccoli and garlic powder to the skillet, toss 3 mins.","Divide into 4 containers."]},
  // broccoli boiled 8 mins goes soft; one can of undiluted soup cannot coat 1 lb pasta, so loosened with pasta water
  {"id":68,"steps":["Salt the chicken fifteen minutes ahead, poach it until it reads 165°F, rest it five minutes and dice it. Dry chicken is a method problem, not a chicken problem.","Boil the macaroni about 8 minutes, adding the broccoli for the last 3, until the pasta is just tender and the broccoli still has some bite. Scoop out 1 cup of the pasta water, then drain.","Stir in the chicken, the cream of chicken soup and ½ to ¾ cup of the pasta water until it is creamy. Portion into 6 containers."]},
  // no chipotle in the recipe, so title renamed; beans drained
  {"id":70,"name":"Salsa Chicken & Bean Bowls","ing":["1.5 lbs chicken breast","1 can (15 oz) Great Northern beans, drained","1 cup salsa","lettuce"]},
  // pork was counted as 1 lb raw although it goes in cooked (1.5 lb raw ≈ 1 lb cooked); oil for the sauté added
  {"id":71,"ing":["1.5 lbs pork roast, cooked and shredded","1 tbsp oil","bell peppers","onions","carrots"],"steps":["Heat the oil in a skillet and sauté the sliced peppers, onions and carrots over medium-high, about 8 minutes, until the edges have taken colour and the carrot has lost its squeak.","Toss in the warm shredded pork; portion into 4 containers."]},
  // stew meat is still tough at 35 mins (needs 2–2½ hrs); instant potatoes had half the liquid they need; milk counted
  {"id":72,"time":"2 hrs 30 mins","ing":["1.2 lbs stewing beef","2 cups instant potatoes","⅔ cup milk","1 can (14.5 oz) green beans, drained"],"steps":["Brown the stew meat in a pot over medium-high, then add 2 cups water, cover and simmer on low 2 to 2½ hours, until a piece pulls apart with a fork. Top up with water if it runs dry.","Make up the mashed potatoes: bring 2⅔ cups of water to the boil, take it off the heat, add the milk, then stir in the 2 cups of flakes with a fork until fluffy. Give it a minute to thicken. Out of flakes? {r:276} does it from the potatoes on the order.","Serve beef and green beans over potatoes in 4 containers."]},
  // potatoes were sautéed in a dry pan; oil and cube size added
  {"id":75,"ing":["1 lb beef franks (sliced)","1.5 lbs potatoes","1 tbsp oil","bell peppers","onions"],"steps":["Heat the oil in a skillet over medium-high. Sauté ½-inch cubed potatoes, peppers, and onions about 15 minutes, until the potatoes are tender and browned.","Add sliced beef frank coins, fry 5 more mins until crispy. Divide into 4 containers."]},
  // gelatin was not bloomed in cold water first and whey went into boiling water; both clump
  {"id":78,"ing":["1 packet (¼ oz) gelatin","¼ cup cold water","¾ cup boiling water","1 scoop chocolate whey"],"steps":["Sprinkle the gelatin over the cold water and let it stand 1 minute. Pour in the boiling water and stir until no grains are left.","Let it cool until just warm, then whisk in the chocolate whey — whey clumps in liquid that is too hot.","Chill 45 minutes, until it has thickened to about the consistency of raw egg white — it will not whip before that.","Whip 2 to 3 minutes with a hand mixer until pale and doubled, then refrigerate 90 minutes until set."]},
  // time left out the 2-hour freeze
  {"id":79,"time":"2 hrs 5 mins"},
  // whites are eaten raw, so pasteurized carton whites; cream of tartar helps them reach stiff peaks
  {"id":87,"time":"10 mins","ing":["½ cup pasteurized liquid egg whites","⅛ tsp cream of tartar","1 tbsp cocoa powder","sweetener"],"steps":["Whip the egg whites and cream of tartar in a bowl with a hand mixer until stiff peaks form, 3 to 8 minutes — carton whites take longer than fresh.","Fold in cocoa powder and sweetener."]},
  // Peaches drained so the compote isn't soup
  {"id":101,"ing":["2 cups waffle mix","2 eggs","1 cup milk","2 tbsp butter","1 can (29 oz) peaches, drained","1 tsp cinnamon","¼ cup syrup"],"steps":["Whisk waffle mix, eggs, milk, and melted butter.","Cook in hot waffle iron 4 mins until golden.","Simmer the drained, sliced peaches with the syrup and cinnamon in a small pot for 5 mins; spoon on top."]},
  // 8-inch dish instead of 9x13, oats toasted in a skillet before the liquid, dish greased, doneness cue
  {"id":102,"time":"45 mins","ing":["2 cups rolled oats","2 cups milk","2 eggs","2 tbsp butter","1 tsp cinnamon","½ cup brown sugar","¼ cup raisins","1 tsp butter"],"steps":["Preheat oven to 350°F and butter an 8-inch square baking dish.","Toast the oats in a dry skillet over medium heat for two minutes, until they smell like biscuits. Nutty instead of flat. Tip them into the dish and stir in the milk, eggs, cinnamon, and raisins.","Bake at 350°F for 30 to 35 mins, until the center is no longer wet to the touch.","Melt the butter with the brown sugar in a small pan over low heat, stirring, until the sugar has dissolved into it — about a minute. That is the glaze. Drizzle it over the top while the bake is still warm so it soaks in."]},
  // Potatoes listed raw since they are fried here; sausage doneness cue 160°F
  {"id":103,"ing":["6 scrambled eggs","4 oz pork sausage","1 cup cubed potatoes","½ cup cheddar","4 tortillas","salsa"],"steps":["Fry the cubed potatoes and sausage in a skillet about 10 mins, until the potatoes are tender and no pink is left in the sausage (160°F). Get the pan hot before the pork goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Scramble eggs 3 mins.","Set out warm tortillas, eggs, sausage, potatoes, and cheese for custom burrito rolling. Salsa out beside them."]},
  // Butter melted before whisking
  {"id":104,"steps":["Whisk pancake mix, milk, egg, and melted butter.","Pour batter onto hot skillet, cook 2 mins per side until bubbles burst and pancakes turn golden. Serve with syrup."]},
  // Oil added for frying; potato time and doneness cue
  {"id":105,"time":"23 mins","ing":["1 tbsp oil","2 cups cubed potatoes","4 oz diced ham","4 eggs","½ cup cheddar cheese"],"steps":["Heat the oil in a skillet over medium-high and fry the potatoes 12 to 15 mins, turning now and then, until crisp outside and tender when poked with a fork.","Add ham and crack eggs on top.","Sprinkle cheddar, cover skillet, and cook on low for 5 mins until eggs are set."]},
  // Whole dough divided into 6 shells; salt amount and tin butter listed; sausage 160°F
  {"id":107,"ing":["2 cups flour","1 tbsp baking powder","4 tbsp butter","¾ cup milk","3 eggs","4 oz sausage","¼ cup cheddar","1 tsp salt","1 tsp butter, for the tin"],"steps":["Heat the oven to 375°F and grease six cups of a muffin tin with the teaspoon of butter.","Cook the sausage in a skillet, breaking it up, until no pink is left (160°F). Drain it. Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Rub the cold butter into the flour, baking powder and the salt with your fingertips until it looks like coarse crumbs. Stir in the milk with a fork until it just comes together — a few dry patches are better than a smooth dough.","Divide the dough into 6 equal pieces and press each into a cup and up the sides to make a shell.","Divide the sausage between the shells, beat the eggs and pour them over, and top with the cheddar.","Bake 20 minutes, until the egg is set and the edges are golden."]},
  // Layers now use all 2 cups yogurt; peaches drained
  {"id":109,"ing":["2 cups vanilla yogurt","1 can (29 oz) peaches, drained and diced","½ cup Honey Nut O's"],"steps":["In each jar, layer ½ cup yogurt, a quarter of the peaches, and 2 tbsp cereal.","Repeat the layers once and serve chilled."]},
  // Batter fills 12 muffin cups, not 6; tin greased
  {"id":111,"servings":"12 Muffin Pancakes","servN":12,"ing":["2 cups pancake mix","1 cup milk","1 egg","1 diced apple","1 tsp cinnamon","1 tsp butter"],"steps":["Preheat oven to 375°F.","Whisk pancake mix, milk, egg, diced apple, and cinnamon.","Butter a 12-cup muffin tin, fill each cup about two-thirds, and bake at 375°F for 15 to 18 mins, until a toothpick comes out clean."]},
  // Butter for the skillet listed
  {"id":112,"ing":["4 eggs","½ cup cheddar","4 tortillas","¼ cup salsa","1 tsp butter"]},
  // Salt added, dish greased, potatoes squeezed dry, doneness cue
  {"id":113,"ing":["3 cups grated potatoes","6 eggs","½ cup milk","1 cup cheddar cheese","1 tsp salt","1 tsp butter"],"steps":["Preheat oven to 350°F and butter a 9x13 dish.","Whisk eggs, milk, cheese, and salt.","Squeeze the grated potatoes dry in a towel, mix them in, pour into the dish, and bake at 350°F for 35 mins, until the center is set and no longer wet."]},
  // Cream cheese only, matching the method
  {"id":114,"ing":["4 bread slices","¼ cup raspberry jam","¼ cup cream cheese, softened","1 tbsp butter"]},
  // Toasting step moved before the milk goes in
  {"id":115,"steps":["Toast the oats in the dry pan over medium heat for two minutes, until they smell like biscuits. Nutty instead of flat. Then pour in the milk and simmer about 5 minutes, stirring often so the milk does not catch, until thick enough to hold a spoon-track for a second.","Stir in raisins and cinnamon.","Drizzle with honey and serve warm."]},
  // Sausage doneness cue 160°F; pan cleared before the tortillas
  {"id":116,"steps":["Cook the sausage in the pan about 5 mins, breaking it up, until no pink is left (160°F), then scoop it out. Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Place tortillas on pan, fill with sausage and cheese, fold.","Griddle medium heat 3 mins per side."]},
  // Rimmed half-sheet pan specified; oil listed
  {"id":117,"ing":["3 cups pancake mix","1.5 cups milk","2 eggs","1 apple (sliced)","1 tbsp oil"],"steps":["Preheat oven to 400°F.","Whisk the pancake mix, milk, and eggs and pour onto a rimmed half-sheet pan (18x13) oiled with the tablespoon of oil.","Top with sliced apples.","Bake at 400°F for 15 mins."]},
  // Egg added so it sets to slice; bake time and doneness cue; dish greased
  {"id":118,"time":"50 mins","ing":["2 cups oats","2 mashed bananas","2 cups milk","¼ cup brown sugar","1 tsp cinnamon","1 egg","1 tsp butter"],"steps":["Preheat oven to 350°F and butter an 8-inch square baking dish.","Beat the egg in the dish, then mix in the oats, bananas, milk, brown sugar, and cinnamon.","Bake at 350°F for 40 to 45 mins, until golden on top and the center is no longer wet to the touch."]},
  // Batter fills 24 mini cups, not 12; tin butter listed
  {"id":120,"servings":"24 Mini Pancake Bites","servN":24,"ing":["2 cups pancake mix","1 cup milk","1 egg","¼ cup chocolate chips","1 tsp butter"],"steps":["Heat the oven to 375°F and butter two 12-cup mini muffin tins (or bake in two batches).","Whisk the pancake mix with the milk and the egg into a batter a little thicker than you would pour for pancakes, then fold in the chocolate chips. Lumps are fine; beaten smooth makes them tough.","Fill each cup about two-thirds and bake 12 minutes, until risen and dry to a fingertip in the middle."]},
  // Sausage doneness cue 160°F; stray topping tip removed
  {"id":121,"steps":["Fry the potatoes and sausage in a skillet about 10 mins, until the potatoes are tender and no pink is left in the sausage (160°F). Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Pour beaten eggs over top and scramble 3 mins until set."]},
  // Peaches frozen first so the blend is thick enough for a bowl
  {"id":122,"time":"2 hrs 5 mins","ing":["2 cups vanilla yogurt","1 can (29 oz) peaches, drained","¼ cup milk","1 tbsp honey"],"steps":["Spread the drained peaches on a tray and freeze at least 2 hours.","Blend the frozen peaches with the yogurt, milk, and honey until thick, adding a spoon more milk only if the blender stalls.","Pour into 2 bowls and serve cold."]},
  // Leftover batter used so the counted batter is eaten
  {"id":124,"steps":["Whisk the pancake mix with the milk into a batter thicker than you would pour for pancakes — it has to cling to a sausage rather than run off it. Add the milk a little at a time; you can always loosen it.","Heat the oil in a skillet over medium. Dip each sausage in the batter, turning it to coat, and fry 2 minutes a side until golden all round. Spoon the leftover batter into small pancakes in the same pan and serve them alongside.","Serve with the syrup."]},
  // 1 lb dry macaroni serves 6, not 4
  {"id":131,"servings":"6 Servings (1 Bowl Each)","servN":6},
  // Wedges oiled, salted, roasted hotter and longer; cheddar halved across 8 sliders
  {"id":132,"time":"45 mins","ing":["1 lb ground beef","4 cheddar slices","8 slider buns","2 lbs potatoes (wedged)","2 tbsp oil","1 tsp salt"],"steps":["Preheat oven to 425°F. Toss the potato wedges with the oil and salt, spread in one layer on a baking sheet, and roast 35 to 40 mins, flipping after 20, until browned and tender.","Form beef into 8 small patties, cook on skillet 3 mins per side, top each with half a cheddar slice. Ground beef wants 160°F all the way through, not the pink middle a steak can have — grinding puts the outside of the meat on the inside.","Serve on slider buns."]},
  // Removed an onion step for an onion that is not in the recipe.
  {"id":133,"steps":["Heat the soup in a pot over medium, stirring, about 6 mins until steaming.","Toast bread, butter liberally, slice into strips. Serve together."]},
  // 16 oz dry pasta serves 6, not 4; sauce heated so the cheese melts.
  {"id":141,"servings":"6 Bowls","servN":6,"steps":["Boil macaroni 8 mins; drain.","Return the pot to low heat, add the tomato soup and milk, and stir until hot. Stir in the cheddar and the pasta until creamy."]},
  // Nothing thickened it; mashed potato now does, and cheese goes in off the boil so it does not split.
  {"id":144,"steps":["Boil potatoes in 2 cups water 12 mins.","Mash about a third of the potatoes against the side of the pot. Stir in the milk, butter and diced ham and bring back to a gentle simmer for 5 mins, until it thickens slightly.","Take it off the heat and stir in the cheddar until melted."]},
  // Title promised chips the recipe does not have.
  {"id":145,"name":"Taco Salad Bowls"},
  // A whole 29 oz can will not fit in 4 sandwiches; 1 cup drained peaches, and the title says peach.
  {"id":146,"name":"Ham & Peach Hawaiian Melts","ing":["8 bread slices","8 oz ham","1 cup canned peaches, drained and diced","½ cup cheddar","butter"],"steps":["Layer ham, diced peaches, and cheddar inside bread.","Griddle in butter 4 mins per side."]},
  // Oil used in the step was not listed; time matched to the method.
  {"id":149,"time":"20 mins","ing":["4 sliced beef franks","2 cups cubed potatoes","½ onion","2 tbsp oil","¼ cup ketchup"]},
  // Garlic powder and Italian seasoning used in step 3 were not listed.
  {"id":151,"ing":["1 lb ground beef","16 oz macaroni","1 can (14.4 oz) tomato sauce","1 can (28 oz) diced tomatoes","1 tsp garlic powder","1 tsp Italian seasoning","1 cup cheddar"]},
  // Canned vegetables drained so the filling is not soupy; salt added to the biscuit dough.
  {"id":153,"ing":["1.5 lbs chicken breast (cooked/cubed)","2 cans (10.5 oz) cream of chicken soup","1 can (14.5 oz) green beans, drained","1 can (14.4 oz) corn, drained","2 cups flour","1 tbsp baking powder","¾ tsp salt","¾ cup milk","4 tbsp butter"],"steps":["Preheat oven to 375°F.","Mix chicken, soup, green beans, and corn in 9x13 dish. Cook the chicken through before it goes into the dish — 165°F, no pink at the centre. The topping bakes faster than raw chicken would.","Whisk the flour, baking powder and salt, then stir in the milk and melted butter just until a dough forms.","Drop spoonfuls over filling and bake at 375°F for 30 mins until golden."]},
  // Green-bean roasting tip moved out of the spaghetti step into its own step.
  {"id":155,"steps":["Boil spaghetti 9 mins; drain.","Brown beef in pot 8 mins, stir in spaghetti sauce and simmer 10 mins.","Warm the green beans, or roast them: drained, oil, salt, 425°F, fifteen minutes, until they blister. Boiled beans are a side; roasted beans get eaten off the tray.","Serve sauce over spaghetti with green beans on the side."]},
  // Skinless breasts do not crisp, so title drops Crispy; oil used was not listed.
  {"id":156,"name":"Baked Chicken Breasts with Mashed Potatoes & Corn","ing":["1.5 lbs chicken breasts","1 tbsp oil","2 cups instant potatoes","2 tbsp butter","½ cup milk","1 can (14.4 oz) corn"],"steps":["Heat the oven to 425°F. Pat the chicken dry, rub it with the oil, salt and pepper, and bake about 22 minutes, until the thickest part reads 165°F.","Make up the mashed potatoes with the butter and milk, 2 cups of flakes to 2 cups of boiling water. No flakes? {r:276}.","Serve chicken with potatoes and corn."]},
  // Browning came after the cooker was already running; put in order.
  {"id":157,"steps":["Brown the pork in a hot pan, dark on every side. The cooker cannot make that crust, and the roast tastes of it for hours.","Put the pork and quartered potatoes into the slow cooker with 1 cup water. Cook LOW 8 hours.","Serve sliced pork with applesauce and green beans."]},
  // Browning put before the slow cook; salt added to an unseasoned water stew.
  {"id":159,"ing":["2 lbs stewing beef","1.5 lbs potatoes","1 lb carrots","1 onion","1½ tsp salt","16 oz ribbon pasta"],"steps":["Brown the beef in a hot pan, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours.","Place beef, potatoes, carrots, onions, salt and 2 cups water in slow cooker. Cook LOW 8 hours.","Boil ribbon pasta 8 mins; serve stew over pasta."]},
  // Undiluted soup was too little sauce for a pound of pasta; milk added. Chicken step put in cooking order.
  {"id":160,"ing":["1.5 lbs chicken breast","16 oz ribbon pasta","2 cans (10.5 oz) cream of chicken","1¼ cups milk","1 cup cheddar","1 lb broccoli"],"steps":["Heat the oven to 350°F.","Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns. Cook it through — 165°F, no pink at the centre — then dice it. Twenty-five minutes under a blanket of soup will not cook it, so it goes in already done.","Boil the pasta two minutes short of the packet time; it finishes in the oven.","Whisk the soup with the milk, then mix it with the chicken, pasta, broccoli and cheese in a 9x13 dish.","Bake at 350°F for 25 minutes, until it bubbles at the edges."]},
  // Raw potatoes need more liquid and a covered bake to cook through; doneness cue added.
  {"id":161,"time":"1 hr 10 mins","ing":["1.5 lbs ground beef","2 lbs potatoes (sliced thin)","1 can (10.5 oz) cream of mushroom soup","¾ cup milk","1 cup cheddar"],"steps":["Preheat oven to 375°F.","Brown beef 8 mins and drain the fat.","Whisk the soup with the milk. Layer potatoes, beef and soup in a 9x13-inch baking dish, holding back the cheddar. No mushroom soup? {r:275} layers in exactly the same way, and {r:265} made pale does the binding just as well.","Cover with foil and bake at 375°F for 45 mins. Uncover, scatter the cheddar over, and bake 15 mins more, until a knife slides through the potatoes easily."]},
  // Added cooking liquid and a shreddable doneness cue.
  {"id":162,"time":"6–8 hrs","steps":["Put the pork roast in the slow cooker with ½ cup water and cook on LOW 6 to 8 hours, until it pulls apart easily with two forks. Shred it, pour off most of the liquid, and stir in the BBQ sauce. No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.","Serve on buns alongside warmed corn."]},
  // Half a cup of milk could not sauce a pound of pasta; a proper cheese sauce added.
  {"id":163,"ing":["1.5 lbs chicken breast","16 oz macaroni","1 lb broccoli","3 tbsp butter","3 tbsp flour","2½ cups milk","1.5 cups cheddar"],"steps":["Preheat oven to 350°F. Cook the chicken through first if it is raw — 165°F, no pink at the centre. Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.","Boil the macaroni two minutes short of the packet time, and add the broccoli for the last three so it keeps some bite. Both finish in the oven.","Melt the butter, whisk in the flour for 1 minute, then whisk in the milk and simmer until it coats a spoon. Off the heat, stir in 1 cup of the cheddar.","Mix the sauce with the pasta, broccoli and diced chicken in a 9x13 dish and top with the rest of the cheddar.","Bake at 350°F for 20 mins."]},
  // Beef browned and drained before the sauce; beans drained; dish size given.
  {"id":164,"ing":["1.5 lbs ground beef","8 tortillas","1 can (14.4 oz) tomato sauce","1 can (15 oz) black beans, drained","1 cup cheddar","2 tbsp taco seasoning (optional)"],"steps":["Preheat oven to 375°F.","Brown the beef and drain the fat, then stir in the black beans, tomato sauce and 2 tbsp taco seasoning and let it simmer a minute before it is layered. No packet in the house? {r:337} makes taco seasoning from seven pantry spices.","Layer tortillas, meat mixture, and cheese in a 9x13-inch dish.","Bake at 375°F for 25 mins."]},
  // A pound of pasta plus a pound of chicken serves 6; chicken cut so it cooks in 8 mins.
  {"id":165,"servings":"6 Servings","servN":6,"steps":["Boil spaghetti 9 mins; drain.","Cut the chicken into bite-size pieces. Pat it dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns. Pan-fry about 8 mins, until white through the middle and 165°F.","Stir in tomato sauce, cream of chicken soup, and pasta until creamy."]},
  // A whole jar of sauce does not fit on 4 subs; counted at 2 cups.
  {"id":166,"ing":["1 lb ground beef","1 egg","½ cup breadcrumbs","2 cups spaghetti sauce","4 hot dog buns","½ cup cheddar"]},
  // Canned vegetables drained, potato liquid listed and counted, dish size given.
  {"id":168,"ing":["1.5 lbs ground beef","1 can (14.5 oz) carrots, drained","1 can (14.4 oz) corn, drained","2 cups instant potatoes","1¾ cups water","½ cup milk","2 tbsp butter"],"steps":["Preheat oven to 375°F.","Brown beef and drain the fat, then stir in carrots and corn.","Bring the water to a boil, then stir in the milk and potato flakes. Stir the butter into them while they are hot — that is the difference between a topping and a paste.","Spread the beef and vegetables in an 8x8-inch or 2-quart dish, spread the potatoes on top, and bake 20 mins."]},
  // Frying oil was not listed; wedges were uncut, unoiled and underbaked.
  {"id":169,"time":"40 mins","ing":["1.5 lbs chicken breasts (cut into strips)","1 cup flour, for the dredge","2 eggs","4 tbsp oil","2 tbsp honey","2 tbsp mustard","2 lbs potatoes"],"steps":["Preheat oven to 425°F. Cut the potatoes into wedges, toss with 1 tbsp of the oil and a little salt, and bake 30 to 35 mins, turning once, until browned and tender.","Pat the strips dry, dip them in beaten egg, and coat in flour. Heat the remaining 3 tbsp oil in a skillet and pan-fry the strips 4 mins per side, not moving them until the underside is brown. Check one at the thickest point: 165°F, no pink.","Mix honey & mustard for dip."]},
  // Beef drained and dish size given.
  {"id":170,"steps":["Preheat oven to 350°F. Boil the macaroni two minutes short of the packet time — it finishes in the oven.","Brown the beef and drain the fat, then mix with the ketchup, tomatoes, pasta and 1 cup of the cheese in a 9x13-inch dish. Top with the rest of the cheese.","Bake at 350°F for 20 mins."]},
  // Fixed bake time had no doneness check; 145°F with a 3-minute rest added.
  {"id":171,"time":"1 hr 15 mins","steps":["Preheat oven to 375°F.","Place the pork roast in a 9x13-inch baking dish, cover with mushroom soup. The soup is the gravy here, and {r:265} is a better one — make it pale, with the juices from the tin once the roast is out. {r:275} works too if you want it thicker.","Bake at 375°F for 50 to 70 mins, until the thickest part of the roast reads 145°F, then rest it 3 minutes before slicing. Serve over instant mashed potatoes. Out of instant potato flakes? {r:276} makes mashed potatoes from the potatoes on the order."]},
  // A pound of pasta plus a pound of beef serves 6; beef browned and drained before the salsa.
  {"id":172,"servings":"6 Servings","servN":6,"ing":["1 lb ground beef","16 oz macaroni","1 cup salsa","1 can (15 oz) black beans, drained","1 cup cheddar","2 tbsp taco seasoning (optional)"],"steps":["Boil macaroni 8 mins; drain.","Brown the beef in a skillet and drain the fat, then add the salsa, black beans and 2 tbsp taco seasoning and give it a minute to come together. No packet in the house? {r:337} makes taco seasoning from seven pantry spices.","Stir in macaroni and cheddar until melted."]},
  // 4 cups water was too little for a cup of rice and rice will not cook on LOW in 45 mins; more water, HIGH, and salt.
  {"id":173,"ing":["1.5 lbs chicken breast","1 cup rice","2 cups chopped carrots","1 onion","7 cups water","2 tsp salt"],"steps":["Put the chicken, carrots, onions, salt and water into the slow cooker — but keep the rice back. A cup of raw rice given six hours drinks the liquid and turns the soup into a solid block.","Cook on LOW 6 hours, then lift the chicken out and shred it. Turn the cooker to HIGH, stir in the rice, and cook 30 to 45 minutes until it is tender, then return the chicken. Or cook the rice separately and add it to the bowls."]},
  // Beans drained so the bake is not soupy.
  {"id":174,"ing":["2 cans (15 oz) black beans, drained and rinsed","2 cups cooked rice","1 can (14.4 oz) tomato sauce","½ cup sour cream","1 cup cheddar"]},
  // Vegetables had no fat and too little time; thin slices were overcooked at 3 mins a side.
  {"id":175,"time":"40 mins","ing":["1 lb beef roast (sliced thin)","1.5 lbs carrots","1.5 lbs potatoes","2 tbsp oil","2 tbsp butter"],"steps":["Preheat oven to 425°F. Cube the potatoes and carrots, toss with the oil and a little salt, spread on a sheet pan, and roast 30 to 35 mins, turning once, until browned and tender.","Slice the beef thin across the grain and sear in the butter over high heat 1 to 2 mins per side. Serve together."]},
  // Worcestershire used in step 1 was not listed.
  {"id":176,"ing":["3.75 lb beef roast","1 tbsp Worcestershire sauce","2 lbs potatoes (quartered)","1 lb carrots","1 onion","1 pkg (0.87 oz) brown gravy mix"]},
  // Beef simmered long enough to go tender, browning moved before the simmer, oven heated, biscuit salt listed
  {"id":180,"time":"2 hrs 30 mins","ing":["2 lbs stewing beef","2 lbs potatoes","1 lb carrots","1 onion","2 cups flour","1 tbsp baking powder","¾ cup milk","4 tbsp butter","1 tsp salt"],"steps":["Brown the beef in the Dutch oven in batches, dark on every side. The stew tastes of that crust; skip it and it tastes of boiled beef. Return all the beef, add 3 cups of water, cover, and simmer gently 1 hour.","Add the potatoes, carrots and onion, cover again, and simmer 45 minutes more, until a cube of beef breaks apart under a fork. Heat the oven to 375°F.","Rub the cold butter into the flour, baking powder and the teaspoon of salt until it looks like coarse crumbs, then stir in the milk with a fork until it just holds together. Do not knead it — drop biscuits are light because the dough is barely mixed.","Drop the dough over the stew in rough spoonfuls, leaving gaps for the steam, and bake uncovered for 20 minutes. They are done when the tops are golden and one pulled open at the middle is dry rather than sticky."]},
  // Roast potatoes given oil, salt, a method and time; total time corrected
  {"id":183,"time":"50 mins","ing":["2 lb sliced ham","½ cup brown sugar","2 tbsp mustard","2 lbs potatoes","2 tbsp oil","1 tsp salt"],"steps":["Heat the oven to 400°F. Cut the potatoes into 1-inch chunks, toss them with the oil and the salt, and roast 25 minutes.","Mix the brown sugar and mustard. Turn the oven down to 350°F, brush the glaze over the ham slices, and bake them alongside the potatoes for 20 minutes, until the potatoes are browned and tender.","Serve the ham with the roasted potatoes."]},
  // Onion used in the method added to the ingredients; searing step put in order
  {"id":185,"ing":["2 lb pork roast","1 onion (chopped)","1 jar (26.5 oz) salsa","12 tortillas","1 can (15 oz) black beans","2 cups dry rice","sour cream"],"steps":["Cook the pork roast in the slow cooker on LOW 6 hours with the salsa, then shred it. An onion first: chopped, into a hot skillet with a spoonful of the pork fat, and left until the edges go gold. Then add the shredded pork and sear it until crispy.","While the pork crisps, bring 4 cups of water to the boil with a pinch of salt, stir in the rice, cover, and simmer on the lowest heat 18 minutes. Leave it covered off the heat 5 minutes, then fluff it with a fork. Serve with the rice, beans, tortillas, and sour cream."]},
  // Rice marked dry and given a cooking step; dish size added
  {"id":186,"ing":["2 lbs chicken breast","8 oz sliced ham","2 cans (10.5 oz) cream of chicken soup","1 cup cheddar","2 cups dry rice"],"steps":["Preheat oven to 375°F.","Salt the chicken fifteen minutes ahead and pound the thick end level — dry chicken is a method problem, not a chicken problem. Layer chicken breasts and ham slices in a 9x13 dish, cover with cream soup and cheddar.","Bake at 375°F for 30 mins. Whole breasts under a blanket of sauce take longer than you expect. Check the thickest one reads 165°F before serving.","While it bakes, bring 4 cups of water to the boil with a pinch of salt, stir in the rice, cover, and simmer on the lowest heat 18 minutes. Leave it covered off the heat 5 minutes, then fluff it with a fork. Serve the chicken over the rice."]},
  // Braise covered on low so the liquid does not boil away and scorch
  {"id":187,"steps":["Simmer the stewing beef and onions in the gravy mix with 2 cups water, covered, on low for 1.5 hours until tender, adding a splash of water if it gets too thick. No packet? Simmer the beef and onions in 2 cups of plain water instead, and turn that liquid into gravy at the end with {r:265}.","Serve over warm white rice with green beans."]},
  // Pork doneness temperature and rest added; potato size and salt given
  {"id":189,"ing":["2 lb pork roast","2 lbs potatoes","1 lb carrots","4 tbsp butter","garlic powder","1 tsp salt"],"steps":["Preheat oven to 375°F.","Cut the potatoes into 1½-inch chunks and the carrots into thick batons; they roast in the same time. Season the pork roast, potatoes and carrots with the salt, garlic powder and melted butter.","Roast on one pan at 375°F for 50 mins, until the thickest part of the pork reads 145°F. Rest the pork 10 minutes before slicing."]},
  // Carrots given a cut size and enough water to cook through before glazing
  {"id":191,"steps":["Sear the roast hard on both sides in a hot skillet, 3 minutes a side. This is where the colour and most of the flavour of the gravy comes from, and a slow cooker cannot do it.","Put the roast and the quartered potatoes in the slow cooker with 1 cup of water and a good pinch of salt, and cook on LOW for 8 hours until a fork twists in the meat with no effort.","Slice the carrots into ¼-inch coins and put them in a wide skillet with the brown sugar, the butter, ½ cup of water and a pinch of salt. Cover and simmer 8 minutes, then uncover and cook 5 to 7 minutes more, until the liquid has gone syrupy and coats them.","Rest the roast 10 minutes before slicing it across the grain. The liquid left in the cooker makes {r:265}, poured over."]},
  // Beef browned and drained before simmering
  {"id":193,"steps":["Brown the beef in a large pot, breaking it up, until no pink remains, and drain off the fat. Add the drained beans and the tomato sauce and simmer 30 minutes.","Heat the oven to 400°F with a 9-inch oven-safe skillet inside, the butter in the skillet. Meanwhile whisk the pancake mix with the eggs and milk into a thick batter, and fold in the drained corn.","Pour the batter into the hot skillet. It should hiss — that is where the crust comes from, and a cold pan will not give you one.","Bake 20 to 25 minutes, until the top is golden and a knife in the middle comes out clean. No oven-safe skillet? A buttered cake pan works — you lose the crust, not the bread.","Serve the chili topped with the cheddar, with the bread cut into wedges alongside."]},
  // Enough sauce for a pound of noodles: water added and sour cream doubled
  {"id":196,"ing":["1.5 lbs ground beef","1 can (10.5 oz) cream of mushroom soup","1 cup sour cream","1 cup water","16 oz ribbon pasta"],"steps":["Boil ribbon pasta 8 mins.","Brown the beef over medium-high about 8 minutes and drain it. Stir in the soup and the water and simmer 5 minutes. Take the pan off the heat before the sour cream goes in — boiled, it splits and will not come back. No mushroom soup? {r:275} does the same job.","Serve over ribbon noodles."]},
  // Peaches drained and the puree reduced so it glazes instead of running off
  {"id":197,"ing":["2 lb pork roast","1 can (29 oz) peaches, drained","¼ cup brown sugar","1 tbsp mustard"],"steps":["Preheat oven to 375°F.","Puree the drained peaches with the brown sugar and mustard, then simmer in a small pan 10 to 15 minutes until it is thick enough to coat a spoon. Keep it back for now: brushed on at the start it has fifty minutes to burn, and burnt sugar is bitter all the way through.","Bake the pork roast at 375°F for 35 minutes, then brush half the glaze over and give it 15 minutes more, brushing again halfway. Done is 145°F at the thickest part, and it wants 10 minutes' rest before slicing. Serve the rest of the glaze as a sauce."]},
  // Gravy milk and flour listed and measured; butter cut with oil so it does not burn
  {"id":198,"ing":["2 lbs chicken breasts","1 cup flour, for the dredge","2 tbsp flour, for the gravy","2 cups milk","2 tbsp butter","2 tbsp oil","3 cups mashed potatoes"],"steps":["Salt the chicken fifteen minutes ahead and pound the thick end level — dry chicken is a method problem, not a chicken problem. Dip chicken in ½ cup of the milk, coat in the dredge flour.","Heat the butter and oil in a large skillet over medium and pan-fry the chicken in batches, 5 mins per side until crispy. A crisp crust is not proof it is cooked. Check the thickest part reads 165°F. Rest it five minutes before cutting. Throw away the dipping milk and leftover dredge.","Pour off all but 2 tbsp of the pan fat, whisk in the 2 tbsp flour and cook a minute, then whisk in the remaining 1½ cups of milk a splash at a time and simmer until it thickens. Salt and pepper it well and serve over the potatoes. {r:265} is this gravy, step by step."]},
  // Browning moved before the beef goes into the cooker
  {"id":199,"steps":["Brown the stewing beef in a hot pan, dark on every side. The cooker cannot make that crust, and the stew tastes of it for hours. Place it in the slow cooker with the quartered potatoes and the tomato sauce. Keep the green beans out — they are cooked already, in the can, and eight hours turns them to threads.","Cook on LOW for 8 hours until the beef falls apart, then stir the drained green beans through and give them 10 minutes to warm."]},
  // Bake time long enough for raw apples, with a doneness cue
  {"id":201,"time":"50 mins","steps":["Preheat oven to 350°F.","Toss sliced apples with 1 tsp cinnamon in an 8-inch square baking dish.","Mix oats, flour, melted butter, and brown sugar into crumble.","Spread crumble over apples and bake at 350°F for 45 mins, until the juices bubble at the edges and a knife slides into the apples easily."]},
  // Peaches drained and bake time lengthened so the topping cooks through
  {"id":203,"time":"55 mins","ing":["1 can (29 oz) peaches, drained","1 cup pancake mix","½ cup sugar","¼ cup melted butter","½ cup milk"],"steps":["Preheat oven to 350°F.","Pour the drained peaches into an 8-inch square baking dish.","Whisk pancake mix, sugar, butter, and milk into batter.","Pour batter over peaches and bake at 350°F for 45 to 50 mins, until the top is deep golden and a skewer in the middle of the topping comes out clean."]},
  // Frosting given milk so it spreads instead of crumbling
  {"id":205,"ing":["1 box (15.25 oz) yellow cake mix","3 eggs","½ cup vegetable oil","1 cup milk","½ cup butter (softened)","½ cup cocoa powder","2 cups powdered sugar","¼ cup milk","vanilla","salt"],"steps":["Heat the oven to 350°F and butter a 9x13 dish.","Make the cake batter as the box asks, but with the milk in place of the water — it is a box mix either way and milk makes it taste less like one. Usually that is the mix, 3 eggs, ½ cup oil and 1 cup milk, beaten 2 minutes.","Bake 25 to 30 minutes, until the top springs back and a skewer in the middle comes out with a crumb or two and no wet batter. Let it cool completely in the dish. Frosting a warm cake slides it off.","For the frosting, beat the softened butter on its own until it is pale and fluffy — a minute or two, and it must be soft or the cocoa will not go in smoothly. Sift in the cocoa and powdered sugar a bit at a time, beating in the ¼ cup of milk a tablespoon at a time between additions until it spreads, then a splash of vanilla and a pinch of salt.","Spread over the cooled cake."]},
  // Peaches drained so it sets; fruit added once the gelatin thickens
  {"id":207,"time":"4 hrs 10 mins","ing":["1 pkg (3 oz) strawberry gelatin","2 cups boiling water","1 can (29 oz) peaches, drained"],"steps":["Dissolve gelatin in boiling water.","Refrigerate about 1 hour, until it is as thick as unbeaten egg white. Dice the drained peaches and stir them in so they stay suspended.","Pour into dish and refrigerate 3 hours until set."]},
  // Flour added so the topping crumbles instead of baking greasy; dish size given
  {"id":210,"ing":["3 ripe bananas (sliced)","1 pkg (3.4 oz) instant vanilla pudding mix","2 cups milk","1 cup oats","½ cup flour","½ cup butter","¼ cup sugar"],"steps":["Preheat oven to 350°F.","Whisk the pudding mix with the 2 cups of cold milk for two minutes until it thickens, then layer it with the banana slices in an 8-inch square dish.","Melt the butter and mix it with the oats, flour and sugar into a crumble; spread on top.","Bake at 350°F for 20 mins."]},
  // Half a cake makes about 24 pops, not 8; freezing time counted
  {"id":214,"servings":"24 Cake Pops","servN":24,"time":"45 mins","steps":["Crumble baked chocolate cake into a bowl.","Mix in the cocoa and the milk until it comes together into a fudgy dough that holds a shape when squeezed. Add the milk a teaspoon at a time — too much and it will not hold a stick.","Roll into 1¼-inch balls — about 24 — insert sticks, freeze 30 mins."]},
  // Pears drained, flour added to the crumble, dish size and a longer bake with a cue
  {"id":215,"time":"45 mins","ing":["1 can (29 oz) pears, drained","3 fresh apples (sliced)","1 cup oats","½ cup flour","½ cup butter","¼ cup brown sugar","1 tsp cinnamon"],"steps":["Preheat oven to 350°F.","Dice the drained pears and mix them with the apples and cinnamon in an 8-inch square dish.","Melt the butter and mix it with the oats, flour and brown sugar into a crumble. Scatter it over the fruit and bake at 350°F for 35 to 40 mins, until bubbling and the apples are tender."]},
  // Crust weighted so the sides hold; pie-strength milk so the filling slices
  {"id":218,"time":"3 hrs 30 mins","ing":["1.5 cups flour","½ cup butter","4 tbsp cold water","salt","1 pkg (3.4 oz) instant chocolate pudding mix","1¾ cups milk"],"steps":["Heat the oven to 375°F. Rub the cold butter into the flour and a pinch of salt until it looks like coarse crumbs, then stir in the cold water a tablespoon at a time until it just comes together. Rest it 15 minutes.","Roll it out, line a 9-inch pie dish, and prick the base all over with a fork. Pricking is what stops the base rising into a dome under the filling. Chill 15 minutes.","Line the crust with foil, fill it with dry beans or rice, and bake 15 minutes. Lift out the foil and beans and bake 8 to 10 minutes more, until dry and pale gold. Let it cool completely.","Whisk the pudding mix with the 1¾ cups of milk for two minutes until it thickens, pour it into the cooled crust, and chill 2 hours before cutting."]},
  // salt and vanilla used in the method now listed; time includes the 30-min freeze; cold-storage note
  {"id":222,"time":"40 mins","ing":["1 cup peanut butter","½ cup powdered sugar","¼ cup melted butter","pinch salt","½ tsp vanilla"],"steps":["Stir the melted butter, peanut butter, powdered sugar, salt and vanilla together in a bowl until smooth.","Press into a parchment-lined 8-inch square pan and freeze 30 mins before cutting into squares. Keep them in the fridge or freezer; they soften at room temperature."]},
  // a whole 9x13 pudding cake serves 12, not 6
  {"id":224,"servings":"12 Bowls","servN":12},
  // potato-roasting tip moved out of the beef step into the potato step
  {"id":230,"steps":["Pat the beef dry and salt it well. Dry meat browns; wet meat steams.","Heat the oil until it shimmers and brown the beef hard on all sides, in two or three batches so the pan stays hot. Set it aside.","Turn the heat down, add the sliced onions, and cook them 12 to 15 minutes until deep golden and sweet, scraping up the brown bits as they release.","Sprinkle over the flour and cook 1 minute more.","Pour in the water a little at a time, stirring, until you have a smooth gravy.","Return the beef and any juices. Cover and cook at the barest simmer for 2½ hours, until a piece falls apart under a fork. It cannot be rushed — high heat makes it tough, not tender.","Boil the potatoes 20 minutes, then mash with the butter and warmed milk. Or roast them instead: cut small, oil, salt, 425°F for thirty minutes, turned once. Boiled potatoes are wet; roasted ones have corners.","Taste the gravy and season. Spoon the beef and plenty of gravy over the mash."]},
  // crust halved to a top-crust amount; sauce flour doubled so 4 cups liquid thickens; butter for the vegetables listed
  // removed stray toasting-in-oil line; the recipe has no oil
  {"id":234,"steps":["Simmer the rice in 2 cups of water with a pinch of salt until the water is gone, about 15 minutes.","Add the milk and sugar and bring it back to the barest simmer.","Cook uncovered 35 to 40 minutes, stirring often and scraping the bottom. This is the whole recipe — stirring is what makes it creamy, and leaving it will catch and scorch.","Stir in the raisins for the last 10 minutes so they plump without dissolving.","Beat the eggs in a small bowl. Add a ladle of the hot pudding to them slowly, whisking, to warm them through.","Take the pan off the heat and stir the egg mixture back in. Off the heat, or it will scramble.","Stir in the vanilla and cinnamon.","Let it stand 10 minutes to thicken. Good warm, better cold the next day."]},
  // yield is about 1½ cups = 12 servings of 2 tbsp, not 16
  {"id":235,"servings":"12 Servings (2 Tbsp Each)","servN":12},
  // removed oven reference from a slow-cooker recipe
  {"id":238,"steps":["Cut the pork into large chunks and pat them dry. Salt them well and leave them 20 minutes.","Brown the chunks hard in the oil, in batches. Do not crowd the pan — this browning is where the depth comes from and you cannot get it back later.","Put the pork in a slow cooker with half the cola and cook on low 6 hours, until it shreds under a fork.","Drain off and discard the cooking liquid. This is the step that separates the good version from the greasy one.","Shred the meat with two forks and return it to the pot.","Blend the remaining cola, brown sugar, salsa, chili powder and cumin, and pour it over.","Cook another hour on low, uncovered for the last 20 minutes so the sauce tightens and clings.","Taste for salt. Serve in tortillas, over rice, or in a bowl with beans and lettuce."]},
  // removed stray toasting-in-oil line; step 2 already toasts the rice in butter
  {"id":239,"steps":["Rinse the rice under cold water until the water runs clear. Rinsing is what stops it going sticky.","Melt the butter in the pan and stir the drained rice through it for 2 minutes, until the grains look glassy at the edges.","Add the water and salt, bring to a boil, then turn it to the lowest heat and cover.","Cook 18 minutes without lifting the lid, then take it off the heat and leave it covered another 10.","Fluff with a fork, then fold through the juice of the lime and a good handful of chopped cilantro.","Both go in at the end — cooked lime turns bitter and cooked cilantro turns to nothing."]},
  // dish size given (9x13)
  {"id":245,"steps":["Grate the potatoes coarsely, then squeeze them dry in a clean cloth. Wet potato steams instead of browning and the casserole goes watery.","Melt the butter and stir it through the potatoes with the finely diced onion.","Mix in the sour cream, the soup, half the cheese, the salt and plenty of pepper.","Spread it into a buttered 9x13 dish without pressing it down — you want air in it.","Scatter the remaining cheese over the top.","Bake at 350°F for 50 minutes, until it is bubbling at the edges and the top is deeply browned.","Rest 10 minutes before serving so it holds together on the spoon."]},
  // 165°F doneness check for fried chicken; pickle slices used in the build now listed
  {"id":246,"ing":["2 lbs chicken breasts","1 cup pickle juice, for the soak","1 cup white flour, for the dredge","1 egg","½ cup milk","2 tsp paprika, for the dredge","1 tsp black pepper, for the dredge","2 tsp salt, for the dredge","3 cups vegetable oil (for frying)","6 hamburger buns","12 dill pickle slices","2 tbsp butter"],"steps":["Slice the chicken breasts flat and pound them to an even thickness so they cook through at the same rate.","Soak them in the pickle juice for 1 hour. Longer than two and the texture turns rubbery.","Beat the egg with the milk. Mix the flour with the paprika, pepper and salt.","Dip each piece in the egg, then press it firmly into the seasoned flour.","Heat the oil to 350°F in a heavy pan.","Fry 3 to 4 minutes a side until deep gold and the thickest piece reads 165°F inside, then drain on a rack.","Butter the cut side of the buns and toast them face down in a dry pan until golden — the buttered toast is what keeps the bun from going soggy.","Build with two pickle slices and nothing else. That is the whole point of it."]},
  // ingredients total about 13 tbsp = 6 servings of 2 tbsp, not 8
  {"id":247,"servings":"6 Servings (2 Tbsp Each)","servN":6},
  // pasteurized-eggs note for the deliberately undercooked centre
  {"id":249,"steps":["Butter six ramekins heavily and dust them with sugar. Anything less and the cakes will not turn out.","Melt the chocolate chips and butter together over a pan of barely simmering water, stirring until glossy. Do not let the bowl touch the water or the chocolate will seize.","Whisk the eggs with the powdered sugar and a pinch of salt for 2 minutes, until thick and pale.","Fold the warm chocolate into the eggs, then fold in the flour and vanilla.","Divide between the ramekins and chill 30 minutes. You can hold them here for a day.","Bake at 425°F for 11 to 13 minutes. The edges should be set and the centre should still wobble like a jelly.","This is a recipe about timing, not doneness. A minute too long and you have a very good small chocolate cake and no lava. The centre stays undercooked on purpose, so use pasteurized eggs when serving young children, anyone pregnant, or anyone elderly.","Rest 1 minute, run a knife round the edge, and turn out onto plates. Serve at once."]},
  // sheet pan size given (18x13 half-sheet) to match the 20-min bake
  // yield is about 2¼ cups = 16 servings of 2 tbsp, not 12
  {"id":251,"servings":"16 Servings (2 Tbsp Each)","servN":16},
  // only the yolks are used, so the ingredient is 4 egg yolks
  {"id":256,"ing":["1.5 cups white flour","½ cup cold butter","4 tbsp cold water","1 tsp salt","¾ cup sugar","⅓ cup cocoa powder","¼ cup cornstarch","3 cups milk","4 egg yolks","2 tbsp butter","2 tsp vanilla"]},
  // pan changed to 9x13; this dough in a 9-inch square stays raw in the middle at 25–28 mins
  // celery salt was listed but never used; step 5 now adds it
  {"id":265,"steps":["Melt the butter in a wide pan over medium heat and whisk in the flour. It has to cook either way — raw flour is why packet gravy tastes like paste, and this is the minute that fixes it.","For brown gravy for beef, whisk 4 or 5 minutes, until it smells like toast and is the colour of peanut butter. For pale gravy for chicken, stop after a minute, while it is still blond.","Take the pan off the heat before any liquid goes near it. Add the water a splash at a time, whisking each one smooth before the next. The first half-cup is what decides whether it is lump-free.","Back on medium heat with the milk stirred in. It will look far too thin for a while and then thicken all at once as it comes to the boil. Let it bubble two minutes to lose the floury edge.","Now salt it, with the celery salt if you are using it. Taste first — off a roast it may need none. Too thick, add liquid; too thin, simmer it down. Do not add flour to a finished gravy, it will not cook out."]},
  // listed water was never used; title promised malt that is not in the recipe
  // listed water was never used
  // removed baking soda, which had no acid to react with in a water/dry-milk mix
  {"id":274,"ing":["3 cups flour","¾ cup dry milk","3 tbsp sugar","1½ tbsp baking powder","1½ tsp salt"],"steps":["Whisk all five together thoroughly — a full minute, not a few turns. Baking powder that is not evenly spread makes some pancakes rise and others sit there, and you will not be able to tell which is which until they are in the pan.","Keep it in a jar with the lid on. Six months is fine; after that the baking powder starts giving up and they come out flat. The dry milk is why it takes water: the milk is already in the jar.","Everyday pancakes: 1 cup of mix, ¾ cup of water, 1 egg, 2 tablespoons of oil or melted butter and half a teaspoon of vanilla. Stir until the dry patches are gone and then stop — batter that has been beaten smooth makes tough pancakes. Lumps are correct.","Let the batter stand five minutes before the first one goes in the pan. Medium heat, and turn each pancake when the bubbles on top stop closing over. One flip only.","For waffles, {r:339} is the Sunday method: sour cream in the batter, the whites whipped and folded in last, browned butter. Same jar."]},
  // substitution amount matched to the 3-cup yield
  {"id":276,"steps":["Peel and cut the potatoes into pieces of roughly the same size — two inches or so. Uneven pieces mean the small ones are falling apart while the big ones are still hard in the middle.","Start them in cold salted water, not boiling. Dropped into boiling water the outsides cook long before the centres, and you get a lumpy mash however hard you work at it afterwards.","Simmer 15 to 20 minutes, until a knife meets no resistance. Drain them and stand them in the hot empty pan a minute — the steam coming off is water that would otherwise end up in the mash. Warm the milk and butter before they go in; cold dairy stiffens it.","Mash, then stop. Potato has a great deal of starch in it and working it hard turns it to glue — this is the one dish where a stand mixer makes things worse. A masher, a fork, or a ricer if you have one.","Where a recipe wants three cups of instant made up, this quantity stands in for it; for two cups, use about two-thirds of it. It is wetter than the instant and holds together less under a topping, so for a shepherd’s pie let it cool a little first."]},
  // toasting step moved before the water goes in
  // shredded lettuce cannot be spooned into as cups; now whole leaves
  // removed duplicated step 2; named a non-stick pan since no oil is used
  // added braising water and a realistic 2-hour braise; egg whites now cooked until set
  // braise given liquid, temperature and time; title promised cabbage that is not in the recipe
  // salt used on the chicken is now listed; removed roast-broccoli aside that used unlisted oil and salt
  // braise given liquid, heat and time
  // oil used on the rice is now listed; rice water amount and time given
  // salt used on the chicken is now listed
  // removed a cooked-dish tip (cheddar in the last minute) from a cold salad
  // oil and salt used in the method are now listed; rice water amount and time given
  // Step 1 had pound/salt/rest text after the browning and called for unlisted salt; step 4 now has a 165°F cue.
  // Removed pasted pat-dry and oven-roast-broccoli text that contradicted the one-pan stir-fry.
  // Removed pasted instruction to salt the chicken; salt is not in the recipe.
  // Rolled ¼ inch with a 10-minute stand gave flat dense doughnuts; now ½ inch, proofed until doubled, fried at 350°F, yield 20.
  // Nothing made the cookies pink; added red food colouring to the frosting.
  // Step 1 pounded and salted the chicken after cooking it; step 4 now says microwave.
  {"id":329,"steps":["Pound the thick end of the chicken level, then cook it through — 165°F, no pink at the centre — and shred it with two forks. Even thickness is what stops the thin end drying out while the thick end catches up.","Stir the sour cream, salsa and salt together, pour it over the chicken, and mix until every strand is coated.","Stir the cheddar through.","Warm the tortillas three at a time between two damp paper towels in the microwave, about 15 seconds, until they bend without cracking. Cold ones split as you roll them.","Spoon filling down the middle of each and roll it up tight.","Heat half an inch of oil in a wide pan to 350°F.","Fry them seam side down first, turning until gold all round, about 3 minutes. Seam down first is what stops them unrolling.","Drain them on a rack rather than on paper, so the undersides stay crisp."]},
  // 2 cups water to 4.5 cups flour was far too wet for bagels (King Arthur: 55-65% hydration); now 1½ cups.
  // 'Ranch' was ambiguous between dry mix and bottled dressing; named as dressing, which is what the nutrition counts.
  {"id":333,"ing":["3 lbs beef roast","½ cup ranch dressing","¼ cup butter","6 pepperoncini","1 tsp black pepper"]},
  // Removed pasted oven-roast-broccoli text from a soup step.
  // The batch is about 4⅔ tbsp, not 8; yield corrected to 2 servings of about 2⅓ tbsp.
  {"id":337,"servings":"2 Servings (About 2⅓ Tablespoons Each)","servN":2,"steps":["Stir everything together in a small jar and put the lid on. That is the whole method.","Half the jar seasons a pound of meat. Add it to browned meat with a quarter cup of water and let it bubble a minute until it clings — the cornstarch is what makes it cling rather than sit on top.","It keeps in the cupboard for months. Shake the jar before you measure, since the salt settles to the bottom."]},
  // 2 tbsp per taco made 14-16 tacos, not 8; portion is a quarter cup.
  // Eggs were pulled off still wet to 'finish in the burrito'; now cooked until set (USDA FSIS).

  /* ---- the audit's last pass: stock tips from the delight pass that were
     still in front of the step they depend on, or asked for salt the recipe
     does not list. */
  { id: 51, step: 0, set: 'Preheat oven to 400°F. Pound the thick end of the chicken level while it heats: even thickness is what stops the thin end drying out while the thick end catches up. Season it, bake 20 mins until 165°F inside, and rest it five minutes before slicing.' },
  { id: 63, step: 1, set: 'If the chicken is not already cooked, pat it dry and lay it in a hot pan, and do not move it until the underside is brown; turn it and cook it through, 165°F with no pink at the centre. Wet chicken steams; dry chicken browns. Cut it into bite-size pieces.' },
  { id: 66, step: 0, set: 'Pat the diced chicken dry and lay it in a hot pan, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns. Pan-fry about 8 mins in all, until white all the way through, 165°F.' },
  { id: 68, step: 0, set: 'Poach the chicken until it reads 165°F, rest it five minutes and dice it. Dry chicken is a method problem, not a chicken problem.' },
  { id: 73, step: 1, set: 'Pound the thick end of the chicken level so it cooks evenly, then season the chicken and potato wedges with paprika and pepper.' },
  { id: 163, step: 0, set: 'Preheat oven to 350°F. If the chicken is raw, pat it dry and lay it in a hot pan, and do not move it until the underside is brown; turn it and cook it through, 165°F with no pink at the centre, then dice it. Wet chicken steams; dry chicken browns.' },
  { id: 186, step: 1, set: 'Pound the thick end of each breast level so they cook evenly. Layer the chicken breasts and ham slices in a 9x13 dish and cover with the cream soup and cheddar.' },
  { id: 190, step: 1, set: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown; turn it and cook it through, 165°F with no pink at the centre, then shred it. It will not cook through once it is rolled up and covered in sauce.' },
  { id: 190, step: 3, set: 'Fill the tortillas with the chicken and beans and roll them into a 9x13 dish, seam side down.' },
  { id: 192, step: 1, set: 'Pat the chicken dry and lay it in a hot pan, and do not move it until the underside is brown; turn it and cook it through, 165°F with no pink at the centre, then dice it. Raw breast stirred into sauce and baked twenty-five minutes is not reliably done.' },
  { id: 192, step: 3, set: 'Mix the chicken, pasta, tomato sauce, cream soup and cheese in a 9x13 dish.' },
  { id: 198, step: 0, set: 'Pound the thick end of each breast level so they fry evenly. Dip the chicken in ½ cup of the milk, then coat it in the dredge flour.' },
  { id: 206, ing: ['2 cups rolled oats', '½ cup peanut butter', '⅓ cup honey', '¼ cup raisins', 'pinch salt', '½ tsp vanilla'] },
  { id: 206, step: 1, set: 'Stir in the oats, raisins, salt and vanilla. The salt and vanilla are the two things a box leaves out, and the two that make it taste like a kitchen.' },
  // garlic powder is in the method now, so the lift no longer offers garlic
  { id: 151, lift: { with: 'Onion, parmesan', steps: ['A diced onion with the beef.', 'Parmesan over the cheddar before the lid goes on.'] } },
  // tightened so the handout's first page fits the sheet
  { id: 173, step: 0, set: 'Put the chicken, carrots, onions, salt and water in the slow cooker, but keep the rice back: six hours turns it to a solid block.' },
  { id: 173, step: 1, set: 'Cook on LOW 6 hours. Lift the chicken out and shred it, turn the cooker to HIGH, stir in the rice and cook 30 to 45 minutes until tender, then return the chicken.' },
  // ---- Nutrition & culinary audit (2026-11) ----------------------------
  // #7: 'head lettuce' had no quantity and bypassed head unit; clarify to 2 cups (6 large leaves)
  {"id":7,"ing":["1 can chicken breast","2 tbsp hot sauce","1 tbsp ranch dressing","2 cups lettuce leaves (6 large leaves)"]},
  // Book 1 culinary audit patches
  {"id":5,"name":"Smoked Ham & Mustard Cucumber Roll-Ups"},
  {"id":11,"step":0,"set":"Drain and rinse black beans under cold water."},
  {"id":18,"step":0,"set":"Drain and rinse pinto beans under cold water."},
  {"id":26,"step":0,"set":"Brew hot Crio Bru cacao and let it cool for 5 minutes."},
  {"id":27,"steps":["Whisk the dry milk into ½ cup water in a jar until smooth, then stir in the oats and cottage cheese. Mixing the powder into the water first stops it clumping.","Stir in cinnamon and diced apple.","Cover and soak in fridge overnight."]},
  {"id":29,"steps":["Sauté diced pepper and onion in a non-stick pan over medium heat for 4 mins, adding a splash of water if they start to stick.","Turn the heat to medium-low, pour egg whites in, and scramble 3 mins until just set. Season with salt and pepper at the end — salting whites early draws water out. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."]},
  {"id":30,"step":1,"set":"Pour batter onto a non-stick skillet over medium-low heat — whey browns faster than plain flour."},
  {"id":35,"steps":["Whisk the whey and cinnamon into the splash of milk (and 2 tbsp cold water if needed) in a tall mug until smooth — whey dropped straight into hot liquid clumps.","Pour in the hot brewed Crio Bru slowly while stirring until frothy."]},
  {"id":37,"step":1,"set":"Take the pan off the heat, let it cool 1 minute so the whey does not clump, and stir in the whey protein."},
  {"id":38,"time":"35 mins"},
  {"id":39,"step":1,"set":"Lay each slice of bread in and give it 30 seconds a side, pressing it down. Long enough to take the egg up, and not so long that it falls apart on the way to the pan."},
  {"id":41,"steps":["Sauté peppers and black beans in a non-stick skillet over medium heat for 4 mins.","Turn to medium-low, pour in egg whites, and scramble 3 mins until set.","Top with salsa."]},
  {"id":42,"step":1,"set":"Take the pan off the heat, let it cool 1 minute so the whey does not clump, then stir in the chocolate whey and cocoa powder."},
  {"id":43,"time":"20 mins","step":1,"set":"Push to side and fry 2 eggs in same pan for 3 mins until the whites are set. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."},
  {"id":48,"time":"25 mins","steps":["Preheat oven to 350°F. Grease 4 cups of a muffin tin well, or use silicone or paper liners — baked egg welds itself to bare metal.","Cook the sausage and onions in a skillet over medium heat for about 5 minutes, breaking the sausage up, until no pink is left (160°F). Get the pan hot before the pork goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon.","Divide into the 4 muffin cups, pour beaten egg into each.","Bake at 350°F for 18 minutes, until the egg is set at the centre and does not wobble when you nudge the tin. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."]},
  {"id":49,"step":1,"set":"Stir in the splash of milk to take the heat down, then stir in the vanilla whey and cinnamon so the whey stays smooth."},
  {"id":51,"steps":["Preheat oven to 400°F. Pound the thick end of the chicken level while it heats: even thickness is what stops the thin end drying out while the thick end catches up. Season it, bake 20 mins until 165°F inside, and rest it five minutes before slicing.","Sauté peppers and onions over medium-high heat 8 mins. Drain and rinse the black beans.","Divide into 4 rice bowls: sliced chicken, ½ cup cooked rice, ¼ can beans, veggies, and 2 tbsp salsa."]},
  {"id":52,"steps":["Preheat oven to 400°F. Cube potatoes and roast on a parchment-lined sheet pan 25 mins until tender and browned at the edges.","Brown beef and diced onions in skillet over medium-high 10 mins until no pink remains, drain grease thoroughly.","Steam broccoli 5 mins until bright and tender-crisp.","Portion equally onto 4 plates. Mustard or salsa on the side; it wants something sharp against the beef and potato."]},
  {"id":53,"steps":["Put chicken and salsa into slow cooker. Cook LOW 4 hours (or HIGH 2.5 hours), until it shreds easily with two forks (at least 165°F). A chopped onion under the chicken is worth having; it melts into the salsa over the hours.","Shred chicken with 2 forks.","Drain and rinse the black beans and drain the corn. Divide into 6 containers over lettuce, beans, and corn. Chopped tomatoes over the top, added the day you eat it rather than now — they weep if they sit."]},
  {"id":55,"steps":["Preheat oven to 375°F. Cut peppers in half and remove seeds.","Brown beef in a skillet over medium-high 8 mins until no pink remains, and drain the fat. Stir in the drained black beans and salsa.","Stuff mixture into pepper halves in a baking dish.","Cover with foil and bake at 375°F for 20 mins, then uncover 10 mins more until the peppers are tender when pierced with a fork and the filling bubbles."]},
  {"id":57,"steps":["Pan-fry diced chicken in a skillet over medium-high 8 mins. Lower the heat, add soy sauce and honey, and cook 2 mins until glossy. Cut a piece open to check — the chicken should be white through to the middle, 165°F.","Steam broccoli 5 mins. Or roast it: oil, salt, 425°F, twenty minutes, until the edges go dark. Steamed broccoli is a chore; roasted broccoli is a snack.","Serve chicken and broccoli over cooked rice in 4 bowls."]},
  {"id":59,"step":0,"set":"Cook pork roast in slow cooker with ½ cup water on LOW 6 hours until it pulls apart with forks. Pour off the rendered liquid and fat, shred the pork, and mix with BBQ sauce. No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf."},
  {"id":61,"step":2,"set":"Portion chicken, potatoes, and green beans onto 4 plates."},
  {"id":62,"step":2,"set":"Stir the drained green beans and corn into the hot beef for 2 minutes to warm through, then layer with the potatoes in 4 bowls."},
  {"id":64,"step":0,"set":"Brown the beef in a skillet over medium-high, breaking it up, about 7 minutes until no pink is left, and drain the fat. Stir in the drained pinto beans and ¼ cup salsa and cook 2 minutes until the liquid reduces."},
  {"id":66,"steps":["Pat the diced chicken dry and lay it in a hot pan over medium-high heat, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns. Pan-fry about 8 mins in all, until white all the way through, 165°F.","Steam the broccoli florets 5 minutes. Or roast them: oil, salt, 425°F, twenty minutes, until the edges go dark. Steamed broccoli is a chore; roasted broccoli is a snack.","Add the cooked rice, broccoli, garlic powder, and black pepper to the skillet, toss 3 mins.","Divide onto 4 plates."]},
  {"id":67,"step":1,"set":"Add drained green beans, cooked rice, and 2 tbsp soy sauce; stir-fry 4 mins. Portion onto 4 plates."},
  {"id":69,"time":"30 mins","steps":["Dice potatoes small (about ½ inch). Brown the ground beef and diced onions in a skillet over medium-high 8 mins until no pink remains (160°F), then scoop out with a slotted spoon, leaving about 1 tbsp fat in the pan.","Fry the potatoes with the paprika in the hot pan 12 to 15 mins, turning now and then, until tender and browned, then return the beef and onions and toss 1 minute to warm through.","Divide into 4 bowls."]},
  {"id":70,"step":1,"set":"Portion drained, rinsed Great Northern beans and shredded lettuce into 4 bowls; top with warm chicken."},
  {"id":71,"step":1,"set":"Toss in the warm shredded pork; portion onto 4 plates."},
  {"id":72,"step":2,"set":"Warm the drained green beans in a small pan or microwave for 2 minutes, then serve beef and green beans over potatoes in 4 bowls."},
  {"id":73,"step":2,"set":"Roast on a parchment-lined sheet pan at 400°F for 25 to 30 mins (cut potato wedges ½ inch thick so they finish with the chicken; pull chicken earlier if it reads 165°F and clear juices). Divide onto 4 plates."},
  {"id":75,"step":1,"set":"Add sliced beef frank coins, fry 5 more mins until crispy. Divide onto 4 plates."},
  {"id":80,"time":"5 mins"},
  {"id":81,"steps":["Put the chocolate whey, cocoa powder, and splash of milk in a mug and stir to a smooth paste — dry whey and cocoa clump if tipped straight into hot water.","Heat 1 cup water in a kettle or second mug for 1 min, then pour it in slowly while whisking until smooth."]},
  {"id":85,"step":1,"set":"Microwave on HIGH for 45 seconds, until the top is set and springs back lightly — pull it as soon as the middle is no longer wet, as whey turns rubbery if overcooked."},
  {"id":90,"time":"3 hrs 5 mins"},
  {"id":93,"step":1,"set":"Microwave on HIGH for 50 seconds, until the edges are set and the centre looks just barely glossy. Stand 1 minute before eating so it finishes without turning rubbery."},
  {"id":96,"time":"2 hrs"},
  {"id":98,"steps":["Stir the pudding mix and whey together while dry, then whisk in the 2 cups of cold milk for 2 mins until thick — mixing the powders first stops the whey clumping.","Portion into 4 cups and chill 5 mins to set firm."]},
  {"id":99,"time":"2 hrs 5 mins"},
  // Book 2 culinary audit patches
  {"id":101,"steps":["Whisk the waffle mix, eggs, milk, and melted butter until mostly smooth (a few small lumps are fine) and let rest 2 minutes while the iron heats.","Pour into the hot waffle iron and cook about 4 mins, going by the steam rather than the clock — a waffle is done when the steam coming out of the sides has mostly stopped.","Simmer the drained, sliced peaches with the syrup and cinnamon in a small pot over medium-low for 5 mins; spoon over the waffles."]},
  {"id":103,"ing":["6 eggs","4 oz pork sausage","1 cup cubed potatoes","½ cup cheddar","4 tortillas","salsa"],"step":1,"set":"Scramble the beaten eggs in the skillet over medium-low heat, stirring slowly, about 3 mins until set with no liquid egg left."},
  {"id":104,"ing":["3 cups pancake mix","2 cups milk","2 eggs","2 tbsp butter","syrup"],"steps":["Whisk the pancake mix, milk, eggs, and melted butter just until the dry patches disappear (lumps are fine; overmixing makes tough pancakes) and let stand 3 minutes.","Heat a lightly greased skillet or griddle over medium heat. Pour ¼-cup scoops and cook about 2 mins until bubbles form on top and stop closing over, then flip once and cook 1 to 2 mins more until golden. Serve with syrup."]},
  {"id":113,"step":0,"set":"Preheat oven to 350°F and butter an 8-inch square baking dish."},
  {"id":114,"extras":"Cream Cheese","step":1,"set":"Pan-fry in butter over medium-low heat 3 mins per side, until golden brown and the filling is warm and softened."},
  {"id":117,"ing":["3 cups pancake mix","2 cups milk","2 eggs","1 apple (sliced)","1 tbsp oil"],"step":3,"set":"Bake at 400°F for 15 to 18 mins, until puffed, golden at the edges, and a toothpick in the centre comes out clean."},
  {"id":119,"step":2,"set":"Cook over medium-low heat 2 to 3 mins per side, until the white is set and the yolk is cooked to your liking. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much."},
  {"id":121,"step":0,"set":"Fry the potatoes and sausage in a non-stick skillet over medium heat about 10 mins, until the potatoes are tender and no pink is left in the sausage (160°F). Get the pan hot before the sausage goes in, and leave it alone until it lets go of the pan on its own — grey meat is meat that was stirred too soon."},
  {"id":123,"step":0,"set":"Toast the bread until golden, spread with the butter, sprinkle with the cinnamon sugar, and slice into long strips."},
  {"id":126,"step":0,"set":"Heat the tomato soup in a small pot over medium heat with 1 can of water (or milk if you have it), stirring until steaming, about 5 mins."},
  {"id":127,"step":0,"set":"Preheat oven to 400°F. Prick the potatoes a few times with a fork and bake directly on the oven rack 45 to 60 mins, until a knife slides into the centre with no resistance."},
  {"id":128,"step":2,"set":"Cook over medium heat 2 to 3 mins per side, until crisp and golden, the cheese is melted, and the chicken is hot through. Serve with salsa. Sour cream too."},
  {"id":134,"extras":"Oranges"},
  {"id":135,"lift":{"with":"Fresh garlic, Cumin and paprika","steps":["Two cloves of garlic, minced fine, stirred into the warming beans.","Half a teaspoon of cumin and a pinch of paprika stirred into the beans (or a spoon of {r:337})."]}},
  {"id":136,"steps":["Drain the canned chicken and flake it with a fork. Warm it in a skillet over medium heat 3 to 4 mins until steaming (165°F), then stir in the ranch and cheddar until the cheese melts.","Warm the tortillas briefly if needed, then spoon the warm filling down the middle with the lettuce, roll tightly, cut in half, and serve while warm."]},
  {"id":137,"steps":["Brown the beef in a skillet over medium-high, breaking it up, about 8 mins until no pink remains (160°F), then drain the fat.","Stir in the ketchup, mustard, and brown sugar (with a splash of water if thick) and simmer over medium-low 5 mins until glossy and thickened. Spoon onto buns."]},
  {"id":138,"step":1,"set":"Butter outsides and griddle over medium-low heat 3 to 4 mins per side, until golden and the cheese is melted."},
  {"id":139,"step":1,"set":"Place on bread with cheddar, butter outsides, and cook on a skillet over medium-low heat 3 to 4 mins per side, pressing gently with a spatula until crisp outside and melted inside."},
  {"id":140,"steps":["Preheat oven to 400°F.","Drain the canned chicken and flake it with a fork. Warm the tortillas briefly if stiff, roll the chicken and cheddar tightly inside, and lay them seam-side down on a baking sheet.","Brush with the oil and bake at 400°F for 12 to 15 mins, until crisp and golden and the filling is heated through (165°F)."]},
  {"id":143,"steps":["Preheat oven to 400°F.","Drain the canned chicken and shred it with a fork. Set the tortillas on a baking sheet, spread with BBQ sauce, and top with the chicken and cheddar. No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.","Bake at 400°F for 8 to 10 mins, until the tortilla edges are crispy, the cheese is bubbling, and the chicken is heated through (165°F)."]},
  {"id":145,"step":0,"set":"Brown the beef in a skillet over medium-high, breaking it up, about 8 mins until no pink remains (160°F), and drain the fat. Add 2 tbsp taco seasoning and ¼ cup water to the browned beef and let it bubble a minute until it clings. Seasoning tipped over the top at the end sits on the meat instead of in it. No packet in the house? {r:337} makes taco seasoning from seven pantry spices."},
  {"id":146,"step":1,"set":"Griddle in butter over medium-low heat 3 to 4 mins per side, until golden and the cheese is melted."},
  {"id":147,"ing":["1 can (14.4 oz) corn, drained","1 can (15 oz) black beans, drained and rinsed","2 cups milk","2 tbsp butter","1 cup cheddar"],"steps":["Combine the drained corn, drained and rinsed black beans, milk, and butter in a pot over medium-low heat. Bring to a bare simmer (do not boil) and cook 8 mins. Mash a few of the beans against the side of the pot if you want it thicker.","Take the pot off the heat and stir in the cheddar a handful at a time until melted."]},
  {"id":148,"step":1,"set":"Drain the canned chicken well and mix with the mayo and diced cucumber."},
  {"id":151,"step":1,"set":"Brown the ground beef in a skillet over medium-high 8 mins, until no pink remains (160°F), then drain the grease."},
  {"id":152,"step":0,"set":"Brown the ground beef in a skillet over medium-high 8 mins until no pink remains (160°F) and drain the fat, then add 2 tbsp taco seasoning and ¼ cup water and simmer until the water has gone and the seasoning clings. No packet in the house? {r:337} makes taco seasoning from seven pantry spices."},
  {"id":155,"step":1,"set":"Brown the beef in a pot over medium-high 8 mins until no pink remains (160°F) and drain the fat, then stir in the spaghetti sauce and simmer 10 mins."},
  {"id":158,"ing":["1.5 lbs ground beef","2 cans (15 oz) pinto beans","1 can (14.4 oz) tomato sauce","1 can (28 oz) diced tomatoes","1 tbsp chili powder","1 cup pancake mix","1 can (14.4 oz) corn","1 egg","½ cup milk","1 tbsp vegetable oil"],"step":0,"set":"Brown the beef 8 minutes over medium-high, breaking it up, until no pink remains (160°F) and drain it. Stir in the chili powder for 30 seconds, then add the drained pinto beans, tomato sauce and diced tomatoes and simmer 20 minutes."},
  {"id":160,"step":3,"set":"Whisk the soup with the milk, then mix it with the chicken, pasta, small bite-size broccoli florets and cheese in a 9x13 dish."},
  {"id":163,"step":4,"set":"Bake at 350°F for 20 mins, until bubbling at the edges and golden on top."},
  {"id":164,"step":1,"set":"Brown the beef over medium-high until no pink remains (160°F) and drain the fat, then stir in the black beans, tomato sauce and 2 tbsp taco seasoning and let it simmer a minute before it is layered. No packet in the house? {r:337} makes taco seasoning from seven pantry spices."},
  {"id":164,"step":3,"set":"Bake at 375°F for 25 mins, until bubbling at the edges and the cheese is melted."},
  {"id":166,"step":0,"set":"Preheat oven to 400°F. Mix beef, egg, and breadcrumbs, roll into about 16 meatballs on a lined baking sheet, and bake 18 to 20 mins until browned and 160°F inside. No breadcrumbs in the cupboard? {r:272} makes them from bread, which is on the order."},
  {"id":168,"step":1,"set":"Brown beef over medium-high until no pink remains (160°F) and drain the fat, then stir in carrots and corn."},
  {"id":168,"step":3,"set":"Spread the beef and vegetables in an 8x8-inch or 2-quart dish, spread the potatoes on top, and bake 20 mins until bubbling at the edges and golden at the potato peaks."},
  {"id":170,"step":1,"set":"Brown the beef over medium-high until no pink remains (160°F) and drain the fat, then mix with the ketchup, tomatoes, pasta and 1 cup of the cheese in a 9x13-inch dish. Top with the rest of the cheese."},
  {"id":170,"step":2,"set":"Bake at 350°F for 20 mins, until bubbling at the edges and the cheese is melted."},
  {"id":172,"step":1,"set":"Brown the beef in a skillet over medium-high until no pink remains (160°F) and drain the fat, then add the salsa, black beans and 2 tbsp taco seasoning and give it a minute to come together. No packet in the house? {r:337} makes taco seasoning from seven pantry spices."},
  {"id":173,"step":1,"set":"Cook on LOW 6 hours, until the chicken reads at least 165°F and shreds easily. Lift the chicken out and shred it, turn the cooker to HIGH, stir in the rice and cook 30 to 45 minutes until tender, then return the chicken."},
  {"id":174,"step":2,"set":"Top with cheddar and bake for 20 mins, until bubbling at the edges and the cheese is melted."},
  {"id":176,"step":3,"set":"Cook on LOW for 8 hours until a fork twists in the meat with no effort, then rest 10 minutes before slicing across the grain."},
  {"id":177,"step":0,"set":"Preheat oven to 375°F. Season pork roast and bake 45 to 55 mins until internal temp reaches 145°F, then rest 10 mins before slicing."},
  {"id":178,"steps":["Preheat oven to 400°F. Mix ground beef, egg, and breadcrumbs, roll into about 24 meatballs on a lined baking sheet, and bake 18 to 20 mins until browned and 160°F inside. No breadcrumbs in the cupboard? {r:272} makes them from bread, which is on the order.","Simmer meatballs in spaghetti sauce for 10 mins. Meanwhile boil the spaghetti in salted water until al dente, about 9 mins, and drain.","Serve meatballs and sauce over the spaghetti. Heat the green beans through in their own liquid, drain them, and put them on the table alongside."]},
  {"id":181,"steps":["Cook beef roast in slow cooker on LOW for 8 hours until it pulls apart easily with two forks. Shred it, pour off most of the cooking liquid, and toss with the BBQ sauce. No bottle in the house? {r:264} makes barbecue sauce from the storehouse shelf.","For the last hour, heat the oven to 400°F, prick the 6 potatoes a few times with a fork, and bake them directly on the oven rack 50 to 60 mins until a knife slides in easily. Warm the drained corn in a small pot, and serve the pulled beef on buns alongside."]},
  {"id":182,"steps":["Preheat oven to 400°F. Pound the thick end of the chicken breasts level so they roast evenly, bake 22 to 25 mins until the thickest breast reads 165°F and the juices run clear, and rest 5 mins.","Make up the mashed potatoes: about 3 cups of flakes to 3 cups of boiling water (add a splash of milk if you have it). Whisk the gravy packet into 1 cup of cold water before heating it, or it goes lumpy, and simmer 2 mins until thick. No packet? {r:265}, stopped while the flour is still blond.","Warm the green beans in their own liquid and drain. Serve the chicken and gravy over the potatoes with the green beans alongside."]},
  {"id":184,"steps":["Preheat oven to 350°F. Boil the spaghetti two minutes short of the packet time — it finishes in the oven — and drain.","Brown the beef in a skillet over medium-high until no pink remains (160°F) and drain the fat, then stir in the spaghetti sauce.","Layer the spaghetti, sour cream, beef sauce, and cheese in a buttered 9x13-inch baking dish.","Bake 25 mins, until bubbling at the edges and the cheese is melted and golden in spots."]},
  {"id":187,"step":1,"set":"Warm the cooked rice, heat the green beans through and drain them, and serve the beef and gravy over the rice with the beans alongside."},
  {"id":190,"step":5,"set":"Bake 25 to 30 minutes, until bubbling at the edges and the cheese is melted."},
  {"id":192,"step":4,"set":"Bake 25 minutes, until bubbling at the edges and the cheese is melted."},
  {"id":193,"ing":["2 lbs ground beef","2 cans (15 oz) pinto beans","1 can (14.4 oz) tomato sauce","2 tbsp chili powder","1 cup cheddar","2 cups pancake mix","1 can (14.4 oz) corn","2 eggs","1 cup milk","1 tbsp butter"],"step":0,"set":"Brown the beef in a large pot over medium-high, breaking it up, until no pink remains (160°F), and drain off the fat. Stir in the chili powder for 30 seconds, then add the drained beans and the tomato sauce and simmer 30 minutes."},
  {"id":194,"step":3,"set":"Layer the drained potatoes and the sauce in a buttered 9x13-inch baking dish, finishing with sauce, and scatter the last half cup of cheddar over. Bake 40 minutes, until a knife goes through the middle with no resistance and the top has browned."},
  {"id":196,"steps":["Boil the ribbon pasta 8 mins and drain.","Brown the beef over medium-high about 8 minutes until no pink remains (160°F) and drain it. Stir in the soup and the water and simmer 5 minutes. Take the pan off the heat before the sour cream goes in — boiled, it splits and will not come back. No mushroom soup? {r:275} does the same job.","Serve over the ribbon noodles."]},
  {"id":202,"step":1,"set":"Drain the peaches and dice them, then layer in 4 dessert cups with the pudding."},
  {"id":209,"step":1,"set":"Heat the oil in a skillet over medium heat. Drop walnut-sized spoonfuls (about 1 inch) and fry 2 mins per side until deep golden and cooked through at the centre — break one open to check."},
  {"id":210,"step":3,"set":"Bake at 350°F for 20 mins, until the oat topping is golden brown and crisp."},
  {"id":212,"ing":["2 fresh apples (halved and cored)","1.5 cups flour","½ cup butter","4 tbsp cold water","¼ cup sugar","1 tsp cinnamon","salt"],"steps":["Heat the oven to 375°F.","Rub the cold butter into the flour and a pinch of salt with your fingertips until it looks like coarse crumbs, then stir in the cold water a tablespoon at a time until it just holds together in a ball. Stop there — a pastry worked smooth goes tough.","Rest the dough 15 minutes, then roll it out and cut it into four squares.","Set an apple half in the middle of each square, scatter the sugar and cinnamon over them, and bring the corners up to wrap and pinch the seams shut. Sit them seam-down on a parchment-lined baking sheet.","Bake 30 to 35 minutes, until the pastry is golden and a skewer slides into the apple without resistance."]},
  {"id":213,"ing":["1.5 cups flour","½ cup peanut butter","½ cup butter (softened)","¾ cup sugar","1 egg","1½ tsp baking powder","salt","¼ cup strawberry jam"]},
  {"id":216,"steps":["Whisk the vanilla pudding mix with the cold milk for 2 mins until it thickens.","Drain and dice the peaches, then layer in a glass bowl with the yellow cake cubes and vanilla pudding. Chill 30 mins. The cake is half of {r:205}, baked and left unfrosted."]},
  {"id":217,"steps":["Heat the waffle iron. Beat the waffle mix, milk, and egg together until mostly smooth and let the batter stand 2 minutes. Cook in the hot waffle iron about 4 mins, until golden and the steam coming from the sides has mostly stopped.","Brush with the melted butter, sprinkle generously with cinnamon sugar, and serve with syrup."]},
  {"id":220,"time":"1 hr 10 mins"},
  {"id":223,"steps":["Slice the yellow cake horizontally into two layers. The cake is half of {r:205}, made without the frosting.","Spread the strawberry jam and fresh sliced fruit between the layers and over the top, and chill 15 mins before slicing for cleaner cuts."]},
  {"id":225,"ing":["1.5 cups pancake mix","½ cup milk","1 diced apple","1 tsp cinnamon","2 tbsp sugar","2 tbsp butter"],"steps":["Dice the apple small (about ¼ inch) so it softens quickly, and whisk it into the pancake mix and milk.","Melt half the butter in a skillet over medium heat and drop spoon-sized fritters in, frying 2 to 3 mins per side until deep golden and cooked through at the centre (use the rest of the butter for the second batch).","Toss immediately in the cinnamon and sugar."]},
];
