/*
 * Section 6 of Around the Table — "Worth the Afternoon".
 *
 * These twelve are NOT from the original recipe books. They were written to
 * fill a hole the data made obvious: across the original 225 recipes, none has
 * more than four steps, none uses yeast, and nothing asks you to knead, braise,
 * temper an egg or thicken a sauce. "In-Depth" almost always meant "leave it in
 * the slow cooker", never "this takes attention".
 *
 * Every ingredient is checked against the storehouse order list, so eleven of
 * the twelve are storehouse-only. The exception is cocoa powder, flagged as a
 * pantry extra — the storehouse carries hot cocoa mix, which is not the same
 * thing and would not work here.
 *
 * Macros are estimated from the ingredients like the rest of Around the Table,
 * and are labelled as estimates in the app.
 *
 * ---------------------------------------------------------------------------
 * Section 9, "Warm Drinks", was added later and for a different reason.
 *
 * Every high-protein drink in Run and Not Be Weary runs on whey, Crio Bru or
 * both, and the storehouse stocks neither. Once the pantry data was corrected
 * to say so, the only storehouse-pure hot drink left in either volume was Hot
 * Cocoa & Marshmallow Cups, which carries four grams of protein and scores 62.
 * That is a hole where a person is most likely to want one filled: the drink
 * you make at nine at night.
 *
 * All six run on non-fat dry milk, which is on the order list, is 36% protein
 * by weight, and has been used for its protein in bread and porridge for a
 * hundred years. Stirred into milk or hot water it takes a mug of cocoa from
 * four grams of protein to seventeen.
 *
 * They score 71 to 80, and they cannot do better. Whey is 80% protein with
 * almost no carbohydrate; dry milk is 36% protein and 52% carbohydrate, which
 * caps a storehouse-only drink at about 40% of its energy from protein. High
 * seventies is the ceiling of the ingredients, not a shortfall in the recipes.
 *
 * They sat at the end of Around the Table for a year, away from the drinks
 * they were written to replace, and the reason was real: a recipe's printed
 * number was its id, favourites and meal plans are keyed by id and synced
 * between phones, and inserting six into Volume One would have renumbered
 * everything after them and silently repointed somebody's saved favourites at
 * other recipes.
 *
 * That is no longer true. The printed number is `no` now and the id is left
 * alone, so a recipe can be moved, renumbered and reprinted without touching
 * anything a phone has saved — which is what the separation was for. So they
 * are where they belong: Power Drinks, in the volume built on protein, beside
 * the seven that need whey and Crio Bru and cannot be made from the order
 * sheet at all.
 *
 * ---------------------------------------------------------------------------
 * Section 10, "Made, Not Bought", came out of counting what actually blocks a
 * recipe. Fourteen ingredients across the collection are not on the storehouse
 * order list, and four of them are the only thing standing between a recipe and
 * a week with no shopping trip at all:
 *
 *   cocoa powder     12 recipes    not makeable — cocoa mix is sugar and milk
 *   BBQ sauce         5 recipes    makeable
 *   gravy mix         5 recipes    makeable
 *   chocolate chips   5 recipes    not makeable
 *   light mayo        3 recipes    makeable
 *
 * The three that are makeable are here. Nothing in them is a substitute in the
 * apologetic sense — a bottle of BBQ sauce is ketchup, sugar, vinegar and onion
 * with the water boiled out of it, and a packet of gravy mix is browned flour
 * and salt. The storehouse carries every part of both.
 *
 * The order list has no vinegar and no black pepper, which is worth knowing
 * before you look at the ingredients and wonder. Ketchup and mustard both carry
 * enough vinegar to do the job, and celery salt covers more ground than it
 * sounds like it should.
 *
 * Once you are making them, put BBQ sauce and gravy back on your Pantry page.
 * The ten recipes that call for them stop asking you to go out.
 */

const SECTION = 'Worth the Afternoon';
const COPYCAT = 'The Copycat Shelf';
const CHOC = 'For the Love of Chocolate';
const DRINKS = 'Warm Drinks';
const MADE = 'Made, Not Bought';

module.exports = [
  /* ---- Simple Family Treats & Desserts ---------------------------------
   *
   * Blake's sister-in-law's cookie, from her own handwritten card. A pint of
   * sour cream is the whole point of it: it is what makes the crumb cakey
   * rather than short, and the soda is in there to answer its acid. That is
   * a different cookie from the pressed sugar cookie at {r:328}, which is
   * why it is here under its own name instead of as a note on that one. */
  {
    id: 341, book: 2, secNum: 5, secName: 'Simple Family Treats & Desserts',
    name: 'Mandie’s Sour Cream Sugar Cookies',
    servings: '48 Servings (1 Cookie)', servN: 48,
    ing: ['1 cup butter', '2 cups sugar', '2 eggs', '2 cups sour cream',
      '2 tsp vanilla', '2 tsp baking soda', '1 tsp salt', '6½ cups white flour',
      '½ cup butter', '4 cups powdered sugar', '¼ cup milk', '1 tsp vanilla'],
    steps: [
      'Heat the oven to 350°F.',
      'Cream the 1 cup of butter with the sugar until light. Beat in the eggs and 2 teaspoons of the vanilla.',
      'Beat in the sour cream, the soda and the salt. The batter will look loose at this stage, and it is meant to.',
      'Work in 4 cups of the flour, then the last 2½ cups a cup at a time, until the dough is soft and just holds together. It stays softer than a dough you would roll.',
      'Drop rounded spoonfuls onto trays, well apart. They spread.',
      'Bake 8 to 10 minutes. They are done when the tops are set and dry to a light touch and the edges have barely coloured. Browned, they are overbaked.',
      'Cool them a minute on the tray, then move them to a rack to cool through. Frosting a warm one slides it off.',
      'Beat the ½ cup of butter with the powdered sugar, the milk and the last teaspoon of vanilla until smooth and light. Frost the cookies cold. A drop of food colouring stirred into the frosting is what makes them pink.',
    ],
    macro: null, tagline: 'Frosted Pink', score: null, sc: null,
    diff: 'Medium', time: '45 mins', extras: null,
  },
  /* ---- Kid-Approved Weeknight Comfort Dinners --------------------------
   *
   * Asked for by name, 2026-10-06: "a traditional meatloaf". Neither book had
   * one; the only meatloaf in the collection was a mention in the
   * breadcrumbs. Bread soaked in milk rather than dry crumbs, because the
   * storehouse carries bread and not crumbs, and because a panade is what
   * keeps 90/10 beef — the beef the food table prices — from baking dry.
   * The glaze is the diner one, ketchup and brown sugar with a sour edge.
   *
   * The first version carried garlic, Worcestershire, thyme and cider vinegar
   * as extras, and Blake asked the same day for what the storehouse does not
   * carry to come out. Two of the four had a stand-in on the order and went:
   * the sour comes from mustard, which is mostly vinegar, and a little ketchup
   * and mustard in the meat do the Worcestershire's job. Garlic and thyme have
   * no stand-in, and Blake on seeing them gone: "You can show garlic and thyme
   * in the recipe, just make sure it's in the list of ingredients that aren't
   * provided." So they stay on the list as extras, marked the way the pantry
   * marks anything you would have to go out for, and Worcestershire and
   * vinegar are the lift. */
  {
    id: 351, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Traditional Meatloaf with Brown Sugar Glaze',
    servings: '8 Servings (1 Slice)', servN: 8,
    ing: ['2 lbs ground beef', '3 slices bread', '½ cup milk', '2 eggs', '1 onion, finely chopped',
      '2 cloves garlic, minced', '1 tsp dried thyme', '¾ tsp salt', '½ tsp black pepper', '1 cup ketchup',
      '2 tbsp mustard', '3 tbsp brown sugar'],
    steps: [
      'Heat the oven to 350°F and line a rimmed baking sheet with foil.',
      'Tear the bread into small pieces in a large bowl, pour the milk over and leave it 5 minutes. Mash it to a paste with a fork. This is what keeps the loaf moist.',
      'Beat in the eggs, then the onion, garlic, thyme, salt and pepper, ¼ cup of the ketchup and 1 tablespoon of the mustard. The ketchup and mustard in the meat are the savoury, sour note a bottle of Worcestershire would bring.',
      'Add the ground beef and work it in with your hands just until nothing is streaky. Squeezing it longer makes the loaf tough.',
      'Shape it into a loaf about 9 by 5 inches on the baking sheet. Free-standing rather than in a pan, so the sides brown and the fat runs away from it.',
      'Stir the rest of the ketchup, the brown sugar and the rest of the mustard together, and spread half of it over the top. The mustard is the vinegar here; without it the glaze tastes only sweet.',
      'Bake 45 minutes. Spread on the rest of the glaze and bake 15 to 25 minutes more, until the middle reads 160°F.',
      'Let it rest 10 minutes before slicing into 8. Cut straight from the oven, it crumbles.',
    ],
    lift: {
      with: 'Worcestershire and vinegar',
      steps: [
        'In the meat, 2 tablespoons of Worcestershire in place of the mustard, and the salt cut to ½ teaspoon; Worcestershire is salty.',
        'In the glaze, a tablespoon of cider vinegar in place of the mustard. Sharper, and the way a diner makes it.',
      ]
    },
    macro: null, tagline: 'Glazed Twice, Sliced Thick', score: null, sc: null,
    diff: 'Easy', time: '1 hr 30 mins', extras: 'Garlic, Thyme',
  },
  /* ---- the rest of the comfort table, 2026-10-06 ---------------------------
   *
   * After the meatloaf Blake asked what else a family table like this would
   * miss, and the answer was counted rather than guessed: the classic
   * American weeknight dinners, checked by name against both books (shepherd's
   * pie, pot roast, Salisbury steak, stroganoff, sloppy joes, mac and cheese,
   * pot pie, stew, chili and meatballs were already here), then every
   * ingredient of what was missing run through the parser and the pantry. The
   * twelve below need nothing the standard order does not carry. The tater
   * tot casserole first called for a bag of frozen tots; it now makes its own
   * from fresh potatoes, after Blake asked for the new recipes to keep to the
   * order. Stuffed cabbage was offered and turned down.
   *
   * The two noodle dishes needed the food table first: egg noodles were read
   * as eggs and chicken broth as a kilo of canned chicken. The chicken soup
   * makes its own broth from water, because the storehouse carries none.
   *
   * Every one states its doneness the way the food-safety audit asked of the
   * rest of the book: ground beef and sausage to 160°F, chicken to 165°F. */
  {
    id: 352, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Baked Porcupine Meatballs',
    servings: '6 Servings (3 Meatballs)', servN: 6,
    ing: ['1.5 lbs ground beef', '½ cup uncooked white rice', '1 onion, finely chopped', '1 egg', '½ tsp salt',
      '¼ tsp black pepper', '2 cans tomato soup', '1 cup water'],
    steps: [
      'Heat the oven to 350°F.',
      'Mix the ground beef, the uncooked rice, the onion, egg, salt and pepper with your hands until just combined.',
      'Roll into 18 balls the size of a golf ball and set them in a 9x13 dish, a little apart.',
      'Whisk the tomato soup with the water and pour it over and around the meatballs.',
      'Cover tightly with foil and bake 1 hour. The rice cooks in the sauce and pokes out of the meat as it swells, which is the name.',
      'Uncover and bake 15 minutes more, until the rice is tender and the middle of a meatball reads 160°F.',
    ],
    macro: null, tagline: 'The Rice Cooks in the Sauce', score: null, sc: null,
    diff: 'Easy', time: '1 hr 30 mins', extras: null,
  },
  {
    id: 353, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'American Goulash',
    servings: '6 Servings', servN: 6,
    ing: ['1.5 lbs ground beef', '1 onion, chopped', '1 bell pepper, chopped', '1 can diced tomatoes',
      '1 can tomato sauce', '2 cups water', '½ tsp salt', '½ tsp black pepper', '2 cups macaroni',
      '1 cup cheddar cheese'],
    steps: [
      'Brown the ground beef with the onion and bell pepper in a large pot over medium-high, breaking it up, 8 to 10 minutes, until no pink remains. Drain off the fat.',
      'Stir in the diced tomatoes, tomato sauce, water, salt and pepper, and bring it to a boil.',
      'Stir in the uncooked macaroni. Cover, turn the heat to low and simmer 15 to 18 minutes, stirring every few minutes so it does not catch, until the pasta is tender.',
      'Take it off the heat, scatter the cheddar over the top, cover and leave it 2 minutes to melt.',
    ],
    macro: null, tagline: 'One Pot, Macaroni and All', score: null, sc: null,
    diff: 'Easy', time: '35 mins', extras: null,
  },
  {
    id: 354, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Hamburger Gravy over Mashed Potatoes',
    servings: '4 Servings', servN: 4,
    ing: ['1 lb ground beef', '1 onion, chopped', '3 tbsp flour', '2 cups milk, for the gravy', '1 tsp salt',
      '½ tsp black pepper', '1.5 cups water', '2 tbsp butter', '½ cup milk, for the potatoes', '2 cups instant potatoes'],
    steps: [
      'Brown the ground beef and onion in a large skillet over medium-high, breaking it up, 8 to 10 minutes, until no pink remains. Spoon off all but about 2 tablespoons of the fat.',
      'Sprinkle the flour over the beef and stir 1 minute, so the gravy does not taste of raw flour.',
      'Pour in the 2 cups of milk a little at a time, stirring, and simmer 3 to 5 minutes until it is thick enough to coat a spoon. Season with the salt and pepper. It thickens more as it stands, so loosen it with a splash of water if it goes too far.',
      'For the potatoes, bring the water and butter to a boil, take it off the heat, add the ½ cup of milk and stir in the instant potatoes. Let them stand 1 minute, then fluff with a fork.',
      'Spoon the potatoes onto plates and ladle the gravy over.',
    ],
    macro: null, tagline: 'Supper on Twenty Minutes', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: null,
  },
  {
    id: 355, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Swedish Meatballs over Egg Noodles',
    servings: '6 Servings', servN: 6,
    ing: ['2 slices bread', '½ cup milk', '1 egg', '1 onion, finely chopped', '1 tsp salt', '¼ tsp black pepper',
      '1.5 lbs ground beef', '2 tbsp oil', '1 can cream of mushroom soup', '¾ cup water', '½ cup sour cream',
      '12 oz egg noodles'],
    steps: [
      'Tear the bread into a large bowl, pour the milk over and leave it 5 minutes, then mash it to a paste.',
      'Beat in the egg, onion, salt and pepper, then work in the ground beef with your hands just until combined.',
      'Roll into about 30 one-inch meatballs.',
      'Heat the oil in a large skillet over medium and brown the meatballs in batches, turning, 8 to 10 minutes a batch. They do not have to be cooked through yet.',
      'Pour off the fat, return all the meatballs, and stir in the cream of mushroom soup and the water. Cover and simmer 10 minutes, until the middle of a meatball reads 160°F.',
      'Meanwhile boil the egg noodles in salted water 6 to 8 minutes, until tender, and drain.',
      'Take the skillet off the heat and stir in the sour cream. Do not let it boil again after this, or the sauce splits. Spoon it over the noodles.',
    ],
    macro: null, tagline: 'Creamy, and Ready by Six', score: null, sc: null,
    diff: 'Medium', time: '45 mins', extras: null,
  },
  {
    id: 356, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Spanish Rice with Ground Beef',
    servings: '6 Servings', servN: 6,
    ing: ['1 lb ground beef', '1 onion, chopped', '1 bell pepper, chopped', '1 cup uncooked white rice',
      '1 can tomato sauce', '½ can diced tomatoes', '¾ cup water', '½ cup salsa', '½ tsp salt',
      '¼ tsp black pepper', '½ cup cheddar cheese'],
    steps: [
      'Brown the ground beef with the onion and bell pepper in a large, deep skillet over medium-high, 8 to 10 minutes, until no pink remains. Drain off the fat.',
      'Stir in the uncooked rice and cook 2 minutes, stirring, so every grain is coated.',
      'Add the tomato sauce, half the can of diced tomatoes (the storehouse tin is 28 ounces; the rest keeps a week in the fridge), the water, salsa, salt and pepper, and bring it to a boil.',
      'Cover, turn the heat to low and simmer 20 to 25 minutes, until the rice is tender and the liquid is gone. Leave the lid on for the first 15 minutes; the steam is what cooks the rice.',
      'Rest it covered 5 minutes off the heat, fluff it, and scatter the cheddar on top.',
    ],
    macro: null, tagline: 'The Rice Cooks in the Pan', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
  },
  {
    id: 357, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Chicken & Dumplings',
    servings: '6 Servings', servN: 6,
    ing: ['1.5 lbs chicken breasts', '1 onion, chopped', '2 carrots, sliced', '6 cups water', '½ tsp salt',
      '½ tsp black pepper', '1 can cream of chicken soup', '2 cups flour', '1 tbsp baking powder',
      '½ tsp salt, for the dumplings', '1 cup milk', '3 tbsp butter, melted'],
    steps: [
      'Put the whole chicken breasts, the onion, carrots, water, ½ teaspoon of salt and the pepper in a large pot. Bring to a boil, then cover and simmer 20 to 25 minutes, until the thickest part of the chicken reads 165°F.',
      'Lift out the chicken, shred it with two forks, and whisk the cream of chicken soup into the pot. Return the chicken and keep it at a gentle simmer.',
      'For the dumplings, whisk the flour, baking powder and the ½ teaspoon of salt in a bowl. Stir in the milk and the melted butter just until there is no dry flour. A lumpy dough makes lighter dumplings.',
      'Drop the dough by heaping spoonfuls onto the simmering stew, close together.',
      'Cover tightly and cook 15 minutes without lifting the lid. They steam, and a peek lets the steam out.',
      'They are done when a toothpick through the middle of one comes out clean. Taste the stew before salting it again; the soup and the baking powder have brought a good deal.',
    ],
    macro: null, tagline: 'Lid On, No Peeking', score: null, sc: null,
    diff: 'Medium', time: '1 hr', extras: null,
  },
  {
    id: 358, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Tater Tot Casserole',
    servings: '8 Servings', servN: 8,
    ing: ['3 lbs potatoes', '3 tbsp flour', '¾ tsp salt', '½ tsp black pepper', '3 tbsp vegetable oil',
      '1.5 lbs ground beef', '1 onion, chopped', '1 can cream of mushroom soup', '1 can green beans',
      '½ cup milk', '1 cup cheddar cheese'],
    steps: [
      'Peel the potatoes and boil them whole 8 to 10 minutes, until a knife goes in a quarter inch and the middle is still hard. Drain them and let them cool completely, at least 30 minutes. Grated warm, they turn to paste; boiled the day before and kept in the fridge is better still.',
      'Heat the oven to 425°F. Grate the potatoes on the large holes of a box grater and toss with the flour, the salt and ¼ teaspoon of the pepper.',
      'Brush a baking sheet with half the oil. Squeeze tablespoons of the potato into little logs, about 60 tater tots, set them on the sheet and brush them with the rest of the oil. Bake 20 minutes, turning once, until golden. They finish on the casserole.',
      'While they bake, brown the ground beef and onion in a large skillet over medium-high, 8 to 10 minutes, until no pink remains. Drain off the fat.',
      'Stir in the cream of mushroom soup, the drained green beans, the milk and the rest of the pepper, and spread it in a 9x13 dish. No more salt: the soup and the cheese carry plenty.',
      'Scatter the cheddar over, then stand the tots on top in close rows, one layer. Turn the oven down to 375°F.',
      'Bake 25 to 30 minutes, until the tots are deep gold and crisp and the sauce bubbles at the edges.',
      'Tots made ahead and frozen ({r:365}) save the first hour: bake them from frozen at 425°F for 25 minutes, then carry on from the beef.',
    ],
    macro: null, tagline: 'Rows of Tots on Top', score: null, sc: null,
    diff: 'Medium', time: '1 hr 45 mins', extras: null,
  },
  {
    id: 359, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Tuna Noodle Casserole',
    servings: '6 Servings', servN: 6,
    ing: ['8 oz egg noodles', '1 can cream of mushroom soup', '1 cup milk', '2 cans tuna', '1 can green beans',
      '1 cup cheddar cheese', '¼ tsp salt', '¼ tsp black pepper', '2 slices bread', '2 tbsp butter, melted'],
    steps: [
      'Heat the oven to 375°F and butter a 2-quart or 8x8 dish.',
      'Boil the egg noodles 2 minutes short of the packet time, about 6 minutes. They finish in the oven. Drain.',
      'Whisk the cream of mushroom soup and the milk in a large bowl. Fold in the drained, flaked tuna, the drained green beans, half the cheddar, the salt and pepper, and the noodles.',
      'Spread it in the dish and scatter the rest of the cheddar over.',
      'Tear the bread into fine crumbs, toss them with the melted butter, and scatter them on top.',
      'Bake 25 to 30 minutes, until it bubbles at the edges and the crumbs are golden.',
    ],
    macro: null, tagline: 'Buttered Crumbs on Top', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
  },
  {
    id: 360, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Ham & White Bean Soup',
    servings: '6 Servings', servN: 6,
    ing: ['1 tbsp butter', '1 onion, chopped', '2 carrots, diced', '2 potatoes, diced', '6 cups water',
      '2 cans great northern beans', '2 cups chopped ham', '½ tsp black pepper', '½ tsp salt'],
    steps: [
      'Melt the butter in a large pot over medium and cook the onion and carrots 5 minutes, until the onion softens.',
      'Add the potatoes, water, drained beans, ham and pepper. Bring to a boil, then lower the heat and simmer 25 to 30 minutes, until the potatoes are tender.',
      'Mash about a cup of the beans against the side of the pot and stir them back in. That is what thickens it.',
      'Taste before you add the salt. The ham brings a good deal of its own.',
    ],
    macro: null, tagline: 'Thickened with Its Own Beans', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
  },
  {
    id: 361, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Cheesy Baked Potato Soup',
    servings: '6 Servings', servN: 6,
    ing: ['3 lbs potatoes', '4 tbsp butter', '1 onion, chopped', '⅓ cup flour', '4 cups milk', '2 cups water',
      '1.5 tsp salt', '½ tsp black pepper', '1 cup cheddar cheese', '½ cup sour cream'],
    steps: [
      'Peel the potatoes and cut them into ½-inch dice.',
      'Melt the butter in a large pot over medium and cook the onion 5 minutes, until soft.',
      'Stir in the flour and cook 1 minute, then pour in the milk a little at a time, stirring, followed by the water.',
      'Add the potatoes, salt and pepper and simmer gently 15 to 20 minutes, stirring now and then, until the potatoes are tender. A hard boil scorches the milk on the bottom of the pot.',
      'Mash about half the potatoes in the pot, for a soup that is thick but still has pieces in it.',
      'Take it off the heat and stir in the cheddar until it melts. Serve with a spoonful of sour cream on each bowl.',
    ],
    macro: null, tagline: 'Thick, with Pieces Left In', score: null, sc: null,
    diff: 'Easy', time: '40 mins', extras: null,
  },
  {
    id: 362, book: 2, secNum: 3, secName: 'Kid-Approved Weeknight Comfort Dinners',
    name: 'Chicken Noodle Soup from Scratch',
    servings: '6 Servings', servN: 6,
    ing: ['2 tbsp butter', '1 onion, chopped', '3 carrots, sliced', '10 cups water', '1.5 lbs chicken breasts',
      '2 tsp salt', '½ tsp black pepper', '6 oz egg noodles'],
    steps: [
      'Melt the butter in a large pot over medium and cook the onion and carrots 5 minutes, until the onion softens.',
      'Add the water, the whole chicken breasts, the salt and pepper. Bring to a boil, then cover and simmer 20 to 25 minutes, until the thickest part of the chicken reads 165°F. The water becomes the broth.',
      'Lift out the chicken and shred it with two forks.',
      'Bring the soup back to a boil, add the egg noodles and cook 6 to 8 minutes, until tender.',
      'Return the chicken, taste, and salt it again if it wants it. A light broth needs more than you expect.',
    ],
    macro: null, tagline: 'The Water Becomes the Broth', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
  },
  {
    id: 363, book: 2, secNum: 1, secName: 'Speedy Weekday Breakfasts & Morning Treats',
    name: 'Biscuits & Sausage Gravy',
    servings: '6 Servings (1 Biscuit and Gravy)', servN: 6,
    ing: ['2 cups flour, for the biscuits', '1 tbsp baking powder', '1 tsp salt', '6 tbsp cold butter',
      '¾ cup milk, for the biscuits', '1 lb pork sausage', '¼ cup flour, for the gravy', '3 cups milk, for the gravy',
      '½ tsp black pepper'],
    steps: [
      'Heat the oven to 425°F.',
      'Whisk the 2 cups of flour, the baking powder and salt. Cut in the cold butter with a fork or your fingertips until the biggest pieces are the size of peas. Those pieces are the flakes.',
      'Stir in the ¾ cup of milk just until a shaggy dough forms. Pat it ¾ inch thick on a floured counter and cut 6 biscuits, straight down without twisting, or they rise lopsided.',
      'Bake on a sheet 12 to 15 minutes, until tall and golden.',
      'Meanwhile brown the pork sausage in a large skillet over medium, breaking it up, 8 to 10 minutes, until no pink remains and it reads 160°F. Leave the fat in the pan.',
      'Sprinkle the ¼ cup of flour over the sausage and stir 1 minute.',
      'Pour in the 3 cups of milk a little at a time, stirring, and simmer 5 to 8 minutes until thick. Season with the pepper; the sausage has brought the salt.',
      'Split the biscuits and ladle the gravy over.',
    ],
    macro: null, tagline: 'Split, and Smothered', score: null, sc: null,
    diff: 'Medium', time: '35 mins', extras: null,
  },
  /* ---- Elaborate Sunday Feasts & Roasts ----------------------------------
   *
   * Blake: "Chicken fried chicken? Or steak if I can cut up my roast on to
   * steaks??" The chicken was already here as Country Fried Chicken Breasts
   * with Gravy. The steak is the storehouse's chuck roast cut into slices and
   * pounded thin, which is what a butcher's cube steak is: a tougher cut,
   * flattened until it is tender. Pounded beef is cooked through, to 160°F,
   * the way ground beef is. */
  {
    id: 364, book: 2, secNum: 4, secName: 'Elaborate Sunday Feasts & Roasts',
    name: 'Chicken-Fried Steak from the Roast, with Cream Gravy',
    servings: '6 Servings (1 Steak)', servN: 6,
    ing: ['2 lbs beef roast, trimmed', '1 tsp salt', '½ tsp black pepper', '1 cup flour, for the dredge', '2 eggs',
      '½ cup milk, for the dredge', '⅓ cup oil', '3 tbsp flour, for the gravy', '2 cups milk, for the gravy'],
    steps: [
      'Put the beef roast in the freezer 30 minutes. Firm, it slices cleanly.',
      'Cut it across the grain into 6 slices about ½ inch thick, trimming away the thick seams of fat and gristle.',
      'Lay each slice between plastic wrap and pound it with a meat mallet or a heavy pan to ¼ inch. This is what makes a chuck roast tender enough to fry; do not skip it. Season both sides with the salt and pepper.',
      'Put the dredge flour in one shallow dish and whisk the eggs with the ½ cup of milk in another. Coat each steak in flour, then egg, then flour again, pressing it on. Let them sit 10 minutes so the coating sets.',
      'Heat the oil in a large heavy skillet to 350°F, or until a pinch of flour sizzles at once. Fry the steaks two or three at a time, 3 to 4 minutes a side, until deep golden and cooked through, the middle reading 160°F. Drain them on a rack, not paper, so the bottoms stay crisp.',
      'Pour off all but 3 tablespoons of the fat. Whisk in the 3 tablespoons of flour and cook 1 minute, then whisk in the 2 cups of milk a little at a time and simmer 3 to 5 minutes, until thick. Season it, and pour it over the steaks.',
    ],
    macro: null, tagline: 'A Roast, Pounded Thin', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 15 mins', extras: null,
  },
  {
    id: 226, book: 2, secNum: 6, secName: SECTION,
    name: 'Everyday White Bread',
    servings: '24 Slices (2 Loaves)', servN: 24,
    makes: ['bread'],
    ing: ['5 cups white flour', '1.75 cups warm water', '1 packet yeast', '2 tbsp sugar',
      '3 tbsp non-fat dry milk', '2 tsp salt', '3 tbsp melted butter'],
    steps: [
      "Stir the yeast and sugar into the warm water — warm as a bath, not hot, or it will kill the yeast. Leave it 10 minutes until it foams. If nothing happens, the yeast is dead and it is worth starting again.",
      "Whisk the flour, dry milk and salt together in a large bowl.",
      "Pour in the yeast water and the melted butter. Stir until it comes together into a shaggy, untidy dough.",
      "Turn it onto a floured counter and knead 8 to 10 minutes, adding only enough flour to stop it sticking. It is ready when it is smooth and springs back when you press it.",
      "Put it in a buttered bowl, cover with a cloth, and leave somewhere warm about an hour, until doubled.",
      "Press it down, divide in two, and shape each half into a loaf. Set in two buttered 9x5-inch loaf pans, cover, and rise again 40 minutes until domed above the rim.",
      "Bake at 375°F for 30 to 35 minutes. It is done when the top is deep gold and the bottom sounds hollow when tapped.",
      "Turn out onto a rack and let it cool before slicing. Cutting it hot tears the crumb.",
    ],
    macro: null, tagline: 'Two Loaves, One Afternoon', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 30 mins', extras: null,
  },
  {
    id: 227, book: 2, secNum: 6, secName: SECTION,
    name: 'Soft Buttered Dinner Rolls',
    servings: '15 Rolls', servN: 15,
    ing: [
      "4 cups white flour",
      "1.25 cups warm milk",
      "1 packet yeast",
      "¼ cup sugar",
      "1 egg",
      "5 tbsp butter",
      "1.5 tsp salt",
    ],
    steps: [
      "Warm the milk until it is just body temperature. Stir in the yeast and a spoonful of the sugar, and leave 10 minutes until foamy.",
      "Beat the egg with the rest of the sugar and 4 tablespoons (¼ cup) of the butter, softened.",
      "Combine the flour and salt, then add both the yeast milk and the egg mixture. Mix to a soft dough.",
      "Knead 8 minutes until smooth. This dough stays softer and tackier than bread dough — resist adding much more flour.",
      "Cover and rise 1 hour until doubled.",
      "Divide into 15 pieces. Roll each into a ball under a cupped hand and set them just touching in a buttered 9x13-inch baking dish.",
      "Cover and rise 35 minutes, until they are puffed and pressing against each other.",
      "Bake at 375°F for 15 to 18 minutes until golden. Brush the tops with the remaining tablespoon of melted butter the moment they come out.",
    ],
    macro: null, tagline: 'Pull-Apart Soft', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 15 mins', extras: null,
  },
  {
    id: 228, book: 2, secNum: 6, secName: SECTION,
    name: 'Cinnamon Rolls with Vanilla Glaze',
    servings: '12 Rolls', servN: 12,
    ing: ['4 cups white flour', '1 cup warm milk', '1 packet yeast', '½ cup sugar',
      '1 egg', '½ cup butter', '1 tsp salt', '½ cup brown sugar', '2 tbsp cinnamon',
      '1 cup powdered sugar', '1 tsp vanilla'],
    steps: [
      "Warm the milk, stir in the yeast and a spoonful of the sugar, and leave 10 minutes until foamy.",
      "Mix the flour, salt and half the sugar. Add the yeast milk, the egg, and half the butter, softened. Knead 8 minutes to a soft, smooth dough.",
      "Cover and rise 1 hour until doubled.",
      "Roll the dough into a rectangle about 12 by 16 inches, keeping the corners square so the rolls come out even.",
      "Spread the remaining softened butter right to the edges, then scatter over the brown sugar, the rest of the sugar, and the cinnamon.",
      "Roll it up from the long side, snug but not tight. Cut into 12 with a length of thread slid underneath and crossed over — a knife squashes them.",
      "Set cut side up in a buttered 9x13-inch baking dish, cover, and rise 40 minutes until they touch.",
      "Bake at 350°F for 25 to 28 minutes until the middles are cooked through.",
      "Stir the powdered sugar with the vanilla and 1 to 2 tablespoons of milk (or warm water) into a pourable glaze, and pour it over while the rolls are still warm.",
    ],
    macro: null, tagline: 'Saturday Morning, Properly', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 45 mins', extras: null,
  },
  {
    id: 229, book: 2, secNum: 6, secName: SECTION,
    name: 'Scratch Biscuits & Sausage Gravy',
    servings: '6 Servings (2 Biscuits Each)', servN: 6,
    ing: ['3 cups white flour', '4 tsp baking powder', '1 tsp salt', '½ cup cold butter',
      '1.25 cups milk', '1 lb pork sausage', '¼ cup white flour', '3 cups milk', 'black pepper'],
    steps: [
      "Heat the oven to 450°F. Rub the cold butter into the flour, baking powder and salt until it looks like coarse crumbs with some pea-sized pieces left. Cold butter is what makes the layers.",
      "Stir in the milk just until it holds together. Handle it as little as you can.",
      "Pat the dough out, fold it over on itself three times, then pat to about an inch thick and cut out 12 rounds onto an ungreased baking sheet. Press the cutter straight down — twisting seals the edge and stops the rise.",
      "Bake at 450°F for 12 to 14 minutes until risen and browned.",
      "Meanwhile, brown the sausage in a wide pan over medium heat, breaking it up, 8 to 10 minutes until no pink remains (160°F). Leave the fat in the pan.",
      "Sprinkle the flour over the sausage and cook it 2 minutes, stirring. This is the step people skip, and it is why gravy tastes of raw flour.",
      "Pour in the milk a splash at a time, stirring smooth after each addition.",
      "Simmer gently 5 to 8 minutes until it coats a spoon. Season well with black pepper — it needs more than you think.",
      "Split the hot biscuits and ladle the gravy over.",
    ],
    macro: null, tagline: 'Sunday Breakfast, The Long Way', score: null, sc: null,
    diff: 'In-Depth', time: '50 mins', extras: null,
  },
  {
    id: 230, book: 2, secNum: 6, secName: SECTION,
    name: 'Braised Beef with Onion Gravy',
    servings: '6 Servings', servN: 6,
    ing: ['2 lbs stewing beef', '2 onions', '2 tbsp vegetable oil', '3 tbsp white flour',
      '3 cups water', '2 lbs potatoes', '¼ cup butter', '½ cup milk', 'salt', 'black pepper'],
    steps: [
      'Pat the beef dry and salt it well. Dry meat browns; wet meat steams.',
      'Heat the oil until it shimmers and brown the beef hard on all sides, in two or three batches so the pan stays hot. Set it aside.',
      'Turn the heat down, add the sliced onions, and cook them 12 to 15 minutes until deep golden and sweet, scraping up the brown bits as they release.',
      'Sprinkle over the flour and cook 1 minute more.',
      'Pour in the water a little at a time, stirring, until you have a smooth gravy.',
      'Return the beef and any juices. Cover and cook at the barest simmer for 2½ hours, until a piece falls apart under a fork. It cannot be rushed — high heat makes it tough, not tender.',
      'Boil the potatoes 20 minutes, then mash with the butter and warmed milk.',
      'Taste the gravy and season. Spoon the beef and plenty of gravy over the mash.',
    ],
    macro: null, tagline: 'Falls Apart Under a Fork', score: null, sc: null,
    diff: 'In-Depth', time: '3 hrs 15 mins', extras: null,
  },
  {
    id: 231, book: 2, secNum: 6, secName: SECTION,
    name: 'Chicken Pot Pie with a Scratch Crust',
    servings: '6 Servings', servN: 6,
    ing: [
      "1.25 cups white flour",
      "½ tsp salt",
      "½ cup cold butter",
      "3 tbsp cold water",
      "1.5 lbs chicken breast",
      "1 tbsp butter",
      "1 onion",
      "3 carrots",
      "1 can (14.5 oz) green beans",
      "½ cup white flour",
      "3 cups milk",
      "black pepper",
    ],
    steps: [
      "Rub the cold butter into the flour and salt, leaving some pieces the size of peas — those are what make the crust flaky.",
      "Sprinkle over the cold water and gather into a dough without kneading. Wrap and rest it in the fridge 30 minutes.",
      "Simmer the chicken in salted water about 15 minutes, until it is no longer pink in the middle and reads 165°F, then lift out and cut into pieces. Keep a cup of the cooking liquid.",
      "Cook the diced onion and carrot in the tablespoon of butter 8 minutes until soft.",
      "Stir in the flour and cook 1 minute, then add the milk slowly, stirring, and the reserved cup of chicken liquid.",
      "Simmer until it thickens enough to hold its shape on a spoon. Season well.",
      "Fold in the chicken and the drained green beans and tip it all into a deep 9-inch pie dish or 8-inch square baking dish. Let it cool a little — a hot filling melts the crust before it can set.",
      "Roll the pastry to fit, lay it over, press the edges down and cut two slits in the middle for steam.",
      "Bake at 400°F for 35 to 40 minutes until the crust is deep gold and the filling bubbles at the slits.",
    ],
    macro: null, tagline: 'The Real Thing, Not the Shortcut', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 45 mins', extras: null,
  },
  {
    id: 232, book: 2, secNum: 6, secName: SECTION,
    name: 'Peach Cobbler with a Biscuit Top',
    servings: '8 Servings', servN: 8,
    ing: ['1 can peaches (drained)', '½ cup sugar', '1 tsp cinnamon', '1 tbsp white flour',
      '1.5 cups white flour', '2 tsp baking powder', '3 tbsp sugar', '6 tbsp cold butter',
      '¾ cup milk'],
    steps: [
      'Toss the drained peaches with the sugar, cinnamon and the tablespoon of flour, along with a few spoonfuls of their syrup.',
      'Tip into a baking dish and put it in the oven at 400°F for 10 minutes, until the fruit is hot and beginning to bubble. Putting the topping on hot fruit is what cooks its underside.',
      'Meanwhile rub the cold butter into the flour, baking powder and sugar until crumbly.',
      'Stir in the milk to make a thick, shaggy batter — lumpy is right.',
      'Drop it in rough spoonfuls over the hot fruit, leaving gaps for the juice to come through.',
      'Scatter a little more sugar over the top for crunch.',
      'Bake 35 minutes more, until the topping is golden and firm in the middle and the juices bubble thickly at the edges.',
      'Let it stand 15 minutes before serving, or the juice will be thin.',
    ],
    macro: null, tagline: 'Bubbling at the Edges', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr', extras: null,
    lift: { with: 'Nutmeg, lemon',
      steps: ['A scrape of nutmeg with the cinnamon, and a squeeze of lemon over the peaches. Canned fruit is sweet and flat, and lemon is what wakes it up.'] },
  },
  {
    id: 233, book: 2, secNum: 6, secName: SECTION,
    name: 'Baked Vanilla Custard',
    servings: '6 Servings', servN: 6,
    ing: ['4 eggs', '2.5 cups milk', '½ cup sugar', '2 tsp vanilla', 'salt', '1 tsp cinnamon'],
    steps: [
      "Heat the milk until it steams and shows a few bubbles at the edge. Do not let it boil.",
      "Whisk the eggs, sugar, vanilla and a pinch of salt together until smooth but not frothy — froth turns into bubbles in the finished custard. The vanilla goes in here rather than into the hot milk, where most of it would boil off.",
      "Pour the hot milk into the eggs in a thin stream, whisking the whole time. Adding it all at once will scramble them.",
      "Pour the mixture through a sieve into a jug. This catches anything that did set and is the difference between silky and grainy.",
      "Divide between six 6-ounce ramekins or custard cups and dust the tops with cinnamon.",
      "Stand the dishes in a roasting tin and pour hot water around them to come halfway up. The water bath keeps the heat gentle and even.",
      "Bake at 325°F for 35 to 40 minutes. They are done when set at the edge and still wobbling slightly in the centre — they firm up as they cool.",
      "Lift them out of the water and chill at least 2 hours before serving.",
    ],
    macro: null, tagline: 'Silky, Set, Just Wobbling', score: null, sc: null,
    diff: 'In-Depth', time: '3 hrs', extras: null,
    lift: { with: 'Nutmeg',
      steps: ['Nutmeg grated over the top before it bakes. A baked custard without nutmeg is missing the thing that makes it taste like one.'] },
  },
  {
    id: 234, book: 2, secNum: 6, secName: SECTION,
    name: 'Slow Rice Pudding with Raisins',
    servings: '6 Servings', servN: 6,
    ing: ['1 cup rice', '4 cups milk', '⅓ cup sugar', '½ cup raisins', '2 eggs',
      '1 tsp vanilla', '1 tsp cinnamon', 'salt'],
    steps: [
      'Simmer the rice in 2 cups of water with a pinch of salt until the water is gone, about 15 minutes.',
      'Add the milk and sugar and bring it back to the barest simmer.',
      'Cook uncovered 35 to 40 minutes, stirring often and scraping the bottom. This is the whole recipe — stirring is what makes it creamy, and leaving it will catch and scorch.',
      'Stir in the raisins for the last 10 minutes so they plump without dissolving.',
      'Beat the eggs in a small bowl. Add a ladle of the hot pudding to them slowly, whisking, to warm them through.',
      'Take the pan off the heat and stir the egg mixture back in. Off the heat, or it will scramble.',
      'Stir in the vanilla and cinnamon.',
      'Let it stand 10 minutes to thicken. Good warm, better cold the next day.',
    ],
    macro: null, tagline: 'Stirred, Not Hurried', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 10 mins', extras: null,
    lift: { with: 'Nutmeg, lemon zest',
      steps: ['Nutmeg in with the milk, and a strip of lemon zest left in while it cooks and lifted out at the end.'] },
  },
  {
    id: 235, book: 2, secNum: 6, secName: SECTION,
    name: 'Real Caramel Sauce',
    servings: '16 Servings (2 Tbsp Each)', servN: 16,
    ing: ['1 cup sugar', '¼ cup water', '6 tbsp butter', '½ cup evaporated milk', 'salt'],
    steps: [
      'Put the sugar and water in a heavy pan over medium heat and let the sugar dissolve without stirring.',
      'Once it is clear, leave it alone. Swirl the pan now and then, but do not stir — stirring makes it crystallise and go grainy.',
      'Cook 8 to 10 minutes until it turns the colour of a copper penny. Watch it closely at the end; it goes from amber to burnt in seconds.',
      'Take it off the heat and add the butter. It will bubble up hard, so stand back and use a long spoon.',
      'Warm the evaporated milk, then pour it in slowly, whisking. Cold liquid into hot sugar will seize it.',
      'Whisk in a good pinch of salt and return to low heat for a minute if any lumps remain.',
      'Cool in a jar. It thickens as it goes cold, and keeps a fortnight in the fridge.',
    ],
    macro: null, tagline: 'Copper-Penny Colour', score: null, sc: null,
    diff: 'In-Depth', time: '25 mins', extras: null,
  },
  {
    id: 236, book: 2, secNum: 6, secName: SECTION,
    name: 'Browned Butter Cocoa Brownies',
    servings: '16 Squares', servN: 16,
    ing: ['¾ cup butter', '1.25 cups sugar', '¾ cup cocoa powder', '2 eggs',
      '1 tsp vanilla', '½ tsp salt', '¾ cup white flour'],
    steps: [
      "Heat the oven to 350°F and line an 8-inch square pan with parchment hanging over two sides. Melt the butter in a light-coloured pan and keep cooking it. It will foam, then quieten, then the solids at the bottom will turn golden and smell of nuts — about 5 minutes. That smell is the whole point.",
      "Take it off the heat at once and whisk in the sugar, cocoa and salt while it is still hot.",
      "Let it cool 5 minutes, or the eggs will cook.",
      "Beat in the eggs one at a time, then keep beating for a full minute until the batter turns thick and glossy. That gloss is what gives brownies their papery top.",
      "Stir in the vanilla.",
      "Fold in the flour just until the last streak disappears. Any more and they turn cakey.",
      "Spread in the prepared 8-inch pan and bake at 350°F for 25 minutes. A skewer should come out with moist crumbs, not clean.",
      "Cool completely in the pan before cutting. Warm brownies tear.",
    ],
    macro: null, tagline: 'Glossy Top, Fudgy Middle', score: null, sc: null,
    diff: 'In-Depth', time: '45 mins', extras: 'Cocoa Powder',
  },
  {
    id: 237, book: 2, secNum: 6, secName: SECTION,
    name: 'White Bean & Ham Soup',
    servings: '6 Servings', servN: 6,
    ing: ['2 cans great northern beans', '1 lb sliced ham', '1 onion', '3 carrots',
      '2 tbsp butter', '6 cups water', 'black pepper', 'salt'],
    steps: [
      'Dice the ham. Cook it in the butter over medium heat until the edges catch and brown — that browning is most of the flavour in a soup with this few ingredients.',
      'Add the diced onion and carrot and cook 8 minutes until softened.',
      'Pour in the water, scraping the bottom of the pot clean.',
      'Add one can of the beans, drained, and simmer gently 40 minutes.',
      'Mash the second can of beans to a rough paste and stir it in. It thickens the soup without any flour.',
      'Simmer another 10 minutes, until it has body and coats the spoon.',
      'Season with plenty of black pepper, and salt only at the end — the ham is already salty and it is easy to overshoot.',
    ],
    macro: null, tagline: 'Thickened With Its Own Beans', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 10 mins', extras: null,
  },

  // ======================= The Copycat Shelf ==============================
  {
    id: 238, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Sweet Pork Barbacoa, Cafe Rio Style',
    servings: '10 Servings', servN: 10,
    ing: ['3 lbs pork roast', '1 cup cola', '1 cup brown sugar', '1 cup salsa',
      '2 tsp chili powder', '1 tsp ground cumin', '2 tsp salt', '1 tbsp vegetable oil'],
    steps: [
      'Cut the pork into large chunks and pat them dry. Salt them well and leave them 20 minutes while the oven heats.',
      'Brown the chunks hard in the oil, in batches. Do not crowd the pan — this browning is where the depth comes from and you cannot get it back later.',
      'Put the pork in a slow cooker with half the cola and cook on low 6 hours, until it shreds under a fork.',
      'Drain off and discard the cooking liquid. This is the step that separates the good version from the greasy one.',
      'Shred the meat with two forks and return it to the pot.',
      'Blend the remaining cola, brown sugar, salsa, chili powder and cumin, and pour it over.',
      'Cook another hour on low, uncovered for the last 20 minutes so the sauce tightens and clings.',
      'Taste for salt. Serve in tortillas, over rice, or in a bowl with beans and lettuce.',
    ],
    makes: ['sweet_pork'],
    macro: null, tagline: 'Browned Hard, Then Braised Sweet', score: null, sc: null,
    diff: 'In-Depth', time: '7 hrs 30 mins', extras: 'Cola, Chili Powder, Cumin',
  },
  {
    id: 239, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Cilantro Lime Rice',
    servings: '8 Servings', servN: 8,
    ing: ['2 cups rice', '4 cups water', '2 tbsp butter', '2 tsp salt', '1 lime', 'cilantro'],
    steps: [
      'Rinse the rice under cold water until the water runs clear. Rinsing is what stops it going sticky.',
      'Melt the butter in the pan and stir the drained rice through it for 2 minutes, until the grains look glassy at the edges.',
      'Add the water and salt, bring to a boil, then turn it to the lowest heat and cover.',
      'Cook 18 minutes without lifting the lid, then take it off the heat and leave it covered another 10.',
      'Fluff with a fork, then fold through the juice of the lime and a good handful of chopped cilantro.',
      'Both go in at the end — cooked lime turns bitter and cooked cilantro turns to nothing.',
    ],
    makes: ['cilantro_lime_rice'],
    macro: null, tagline: 'Green, Bright, Never Sticky', score: null, sc: null,
    diff: 'Medium', time: '40 mins', extras: 'Lime, Cilantro',
  },
  {
    id: 336, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Horchata, Cafe Rio Style',
    servings: '8 Servings (1 Pitcher)', servN: 8,
    ing: ['1 cup rice, blended and strained', '2 tsp cinnamon', '4 cups hot water', '2 cups cold water',
      '0.5 cup sugar', '0.5 cup evaporated milk', '1 tsp vanilla', '1 pinch salt'],
    steps: [
      'Rinse the rice until the water runs mostly clear. Put it in a bowl with the cinnamon and the 4 cups of hot water, cover, and leave it at least 4 hours or overnight in the fridge. Hot water pulls more out of the rice than cold.',
      'Tip the lot into a blender and run it on high for 2 minutes, until the rice is a fine, milky slurry.',
      'Pour it through a fine sieve lined with a clean cloth into a jug. Squeeze the cloth to get the last of it, then throw the grit away. Strain it twice if you want it silky.',
      'Stir in the sugar, the evaporated milk, the vanilla, the salt and the 2 cups of cold water until the sugar is gone. Taste it: sweet, but not syrupy.',
      'Chill it an hour. It separates, so stir before you pour. Serve over plenty of ice with a shake of cinnamon on top.',
    ],
    /* Ground cinnamon is on the order and canela is not, so the sticks are
       the lift rather than the recipe. Both tellings arrived the same
       afternoon — this one and a longer one Blake had from elsewhere — and the
       longer one was the better glass: the hot soak, evaporated milk for body
       without watering it down, a pinch of salt, and less sugar. Its method
       is here in the house voice; its canela is here as what the drink
       becomes with a thing the storehouse does not carry. */
    lift: {
      with: 'Canela (Mexican cinnamon sticks)',
      steps: [
        'Soak 2 canela sticks with the rice in place of the ground cinnamon, and blend them in with it. The flavour is rounder and less dusty.',
        'A quarter cup of blanched almonds soaked alongside the rice makes it richer still.',
      ]
    },
    macro: null, tagline: 'Sweet, Cold, Faintly of Cinnamon', score: null, sc: null,
    diff: 'Easy', time: '5 hrs 15 mins', extras: null,
  },

  {
    /* On the Copycat Shelf, not Made, Not Bought, and the test that guards
       that section is why: it is for the cook with the order and nothing
       else, and every one of these seven spices is off the order. The
       sauces got in by making celery salt optional; nothing here is optional,
       the spices are the recipe. So it sits beside the taco beef it seasons,
       on the shelf where a recipe may honestly send you to the shop. */
    id: 337, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Taco Seasoning',
    servings: '4 Servings (2 Tablespoons Each)', servN: 4,
    makes: ['taco_seasoning'],
    ing: ['2 tbsp chili powder', '1 tbsp cumin', '1 tsp paprika', '1 tsp garlic powder',
      '1 tsp onion powder', '1 tsp oregano', '1 tsp salt', '1 tsp cornstarch'],
    steps: [
      'Stir everything together in a small jar and put the lid on. That is the whole method.',
      'Two tablespoons seasons a pound of meat. Add it to browned meat with a quarter cup of water and let it bubble a minute until it clings — the cornstarch is what makes it cling rather than sit on top.',
      'It keeps in the cupboard for months. Shake the jar before you measure, since the salt settles to the bottom.',
    ],
    macro: null, tagline: 'Two Tablespoons to the Pound', score: null, sc: null,
    diff: 'Easy', time: '5 mins',
    extras: 'Chili powder, Cumin, Paprika, Garlic powder, Onion powder, Oregano, Cornstarch',
  },
  {
    id: 338, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Taco Beef, Drive-Through Style',
    servings: '8 Tacos', servN: 8,
    ing: ['1 lb ground beef', '2 tbsp taco seasoning', '1 tbsp flour', '1 cup water'],
    steps: [
      "Brown the beef in a dry skillet over medium-high heat, chopping it with the edge of the spoon as it cooks, 8 to 10 minutes until no pink remains (160°F). Keep chopping: the drive-through version is fine and even, with no big crumbles, and that texture comes from the spoon, not the recipe.",
      "Tip off the fat. Sprinkle the flour over the meat and stir it through for a minute so it cooks out.",
      "Add the taco seasoning and the water, bring it to a simmer, and let it go 10 to 12 minutes, stirring now and then, until the liquid has thickened to a sauce that coats the meat and nothing pools in the pan.",
      "Taste it. It should be a little saltier than seems right on its own, because a tortilla, lettuce and cheese all take some of that back.",
      "A quarter cup in a warm tortilla is a taco. It reheats well, which is the point of making a pound.",
    ],
    macro: null, tagline: 'Fine, Saucy, Made in a Pan', score: null, sc: null,
    diff: 'Easy', time: '25 mins', extras: 'Taco seasoning',
  },
  {
    id: 240, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Creamy Tomatillo Ranch Dressing',
    servings: '12 Servings (2 Tbsp Each)', servN: 12,
    ing: ['1 cup ranch dressing', '½ cup salsa verde', '¼ cup milk', '1 lime', 'cilantro',
      '1 clove garlic'],
    steps: [
      'Put the ranch, salsa verde and milk in a jug.',
      'Add the juice of the lime, a large handful of cilantro and the peeled garlic clove.',
      'Blend until it is completely smooth and pale green.',
      'Thin with a little more milk if it is thicker than pouring cream.',
      'Chill at least an hour before serving — it tastes sharp and disjointed straight away and comes together cold.',
    ],
    makes: ['tomatillo_ranch'],
    macro: null, tagline: 'The Green Dressing', score: null, sc: null,
    diff: 'Easy', time: '1 hr 10 mins', extras: 'Salsa Verde, Lime, Cilantro, Garlic',
  },
  {
    id: 241, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Crispy Buttermilk Fried Chicken',
    servings: '6 Servings', servN: 6,
    ing: ['3 lbs chicken breasts', '2 cups buttermilk, for the soak', '3 cups white flour, for the dredge', '2 eggs',
      '2 tbsp paprika, for the dredge', '1 tbsp garlic powder, for the dredge', '1 tbsp onion powder, for the dredge',
      '2 tsp black pepper, for the dredge', '1 tsp dried thyme, for the dredge', '1 tsp dried oregano, for the dredge',
      '1 tsp mustard powder, for the dredge', '1 tbsp salt, for the dredge',
      '4 cups vegetable oil (for frying)'],
    steps: [
      "Cut the chicken breasts into even 2-inch chunks or thick strips and soak them in the buttermilk for at least 4 hours, or overnight. This is what makes it tender all the way through.",
      "Mix the flour with the paprika, garlic powder, onion powder, pepper, thyme, oregano, mustard powder and salt. Rub the mixture between your fingers so the spices spread evenly.",
      "Beat the eggs with a splash of the buttermilk in a second bowl.",
      "Lift each piece out of the buttermilk, into the flour, into the egg, then back into the flour. The double coat is where the craggy crust comes from.",
      "Let the coated pieces sit 15 minutes. If you fry them straight away the coating slides off.",
      "Heat the oil to 325°F in a deep heavy pan, no more than a third full. Keep a lid nearby.",
      "Fry in small batches 6 to 9 minutes, turning once, until deep gold (large whole-breast pieces will take a couple of minutes longer). Crowding the pan drops the temperature and gives you greasy chicken.",
      "Check the thickest piece reads 165°F inside, then drain on a rack, not on paper — paper steams the bottom soft.",
      "Salt the moment it comes out of the oil.",
    ],
    macro: null, tagline: 'Craggy, Golden, Worth the Mess', score: null, sc: null,
    diff: 'In-Depth', time: '5 hrs', extras: 'Paprika, Garlic Powder, Onion Powder, Thyme, Oregano, Mustard Powder',
  },
  {
    id: 242, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Steakhouse Rolls with Cinnamon Honey Butter',
    servings: '18 Rolls', servN: 18,
    ing: ['4.5 cups white flour', '1.25 cups warm milk', '1 packet yeast', '⅓ cup sugar',
      '1 egg', '¼ cup butter', '2 tsp salt', '½ cup butter', '¼ cup honey',
      '¼ cup powdered sugar', '1 tsp cinnamon'],
    steps: [
      "Warm the milk to blood heat, stir in the yeast and a spoonful of the sugar, and leave 10 minutes until foamy.",
      "Mix in the egg, the remaining sugar, the quarter cup of melted butter and the salt.",
      "Add the flour a cup at a time until you have a soft dough, then knead 8 minutes until smooth.",
      "Cover and rise 1 hour until doubled.",
      "Roll out to half an inch thick and cut into squares — square is the shape that makes these recognisable.",
      "Set them on a parchment-lined or greased baking sheet with room to spread, cover, and rise 45 minutes.",
      "Bake at 350°F for 12 to 14 minutes, only until barely golden. Overbaked, they lose the pillowy middle.",
      "Beat the half cup of soft butter with the honey, powdered sugar and cinnamon until light and whipped.",
      "Brush the hot rolls with a spoonful of the honey butter while they are warm, and serve the rest alongside.",
    ],
    macro: null, tagline: 'Square, Pillowy, Dangerous', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 30 mins', extras: null,
  },
  {
    id: 243, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Sticky Finger Sauce',
    servings: '10 Servings (2 Tbsp Each)', servN: 10,
    ing: ['⅔ cup hot sauce', '1.5 cups brown sugar', '2 tbsp water'],
    steps: [
      'Stir the hot sauce, brown sugar and water together in a small pan.',
      'Bring it to a simmer over medium heat, stirring until the sugar has completely dissolved.',
      'Simmer 4 to 5 minutes until it thickens enough to coat the back of a spoon.',
      'Take it off the heat and let it cool slightly — it thickens more as it stands.',
      'Toss it through hot fried chicken pieces just before serving, so the coating stays crisp underneath.',
    ],
    macro: null, tagline: 'Sweet, Hot, Sticky', score: null, sc: null,
    diff: 'Easy', time: '12 mins', extras: 'Hot Sauce',
  },
  {
    id: 244, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Thick Diner-Style Chili',
    servings: '8 Servings', servN: 8,
    ing: ['2 lbs ground beef', '1 onion', '1 can diced tomatoes', '2 cans tomato sauce',
      '1 can pinto beans', '1 can black beans', '3 carrots', '2 tbsp chili powder',
      '1 tsp ground cumin', '2 cups water', 'salt', 'black pepper'],
    steps: [
      "Brown the ground beef in a large pot over medium-high, breaking it up small, 8 to 10 minutes until no pink remains (160°F). Drain off the fat.",
      "Add the diced onion and grated carrot and cook 8 minutes until soft. The carrot is the secret — it sweetens the chili without any sugar.",
      "Stir in the chili powder and cumin and cook 1 minute, until they smell toasted rather than dusty.",
      "Add the diced tomatoes, tomato sauce and water and bring to a simmer.",
      "Simmer uncovered 45 minutes, stirring now and then, until it has darkened and thickened.",
      "Add both cans of drained beans and simmer another 15 minutes.",
      "Season with salt and plenty of black pepper. It is better the next day, and better again the day after.",
    ],
    macro: null, tagline: 'Better the Next Day', score: null, sc: null,
    diff: 'Medium', time: '1 hr 20 mins', extras: 'Chili Powder, Cumin',
  },
  {
    id: 245, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Country Store Hash Brown Casserole',
    servings: '10 Servings', servN: 10,
    ing: ['3 lbs potatoes', '2 cups cheddar', '1 cup sour cream', '1 can cream of chicken soup',
      '½ cup butter', '1 onion', '1 tsp salt', 'black pepper'],
    steps: [
      'Grate the potatoes coarsely, then squeeze them dry in a clean cloth. Wet potato steams instead of browning and the casserole goes watery.',
      'Melt the butter and stir it through the potatoes with the finely diced onion.',
      'Mix in the sour cream, the soup, half the cheese, the salt and plenty of pepper.',
      'Spread it into a buttered dish without pressing it down — you want air in it.',
      'Scatter the remaining cheese over the top.',
      'Bake at 350°F for 50 minutes, until it is bubbling at the edges and the top is deeply browned.',
      'Rest 10 minutes before serving so it holds together on the spoon.',
    ],
    macro: null, tagline: 'Squeezed Dry So It Crisps', score: null, sc: null,
    diff: 'Medium', time: '1 hr 15 mins', extras: null,
  },
  {
    id: 246, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Pickle-Brined Chicken Sandwiches',
    servings: '6 Sandwiches', servN: 6,
    ing: ['2 lbs chicken breasts', '1 cup pickle juice, for the soak', '1 cup white flour, for the dredge', '1 egg',
      '½ cup milk', '2 tsp paprika, for the dredge', '1 tsp black pepper, for the dredge', '2 tsp salt, for the dredge',
      '3 cups vegetable oil (for frying)', '6 hamburger buns', '2 tbsp butter'],
    steps: [
      'Slice the chicken breasts flat and pound them to an even thickness so they cook through at the same rate.',
      'Soak them in the pickle juice for 1 hour. Longer than two and the texture turns rubbery.',
      'Beat the egg with the milk. Mix the flour with the paprika, pepper and salt.',
      'Dip each piece in the egg, then press it firmly into the seasoned flour.',
      'Heat the oil to 350°F in a heavy pan.',
      'Fry 3 to 4 minutes a side until deep gold and cooked through, then drain on a rack.',
      'Butter the cut side of the buns and toast them face down in a dry pan until golden — the buttered toast is what keeps the bun from going soggy.',
      'Build with two pickle slices and nothing else. That is the whole point of it.',
    ],
    macro: null, tagline: 'Two Pickles, Nothing Else', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 40 mins', extras: 'Pickle Juice, Paprika',
  },
  {
    id: 247, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Honey Mustard Dipping Sauce',
    servings: '8 Servings (2 Tbsp Each)', servN: 8,
    ing: ['½ cup mayo', '2 tbsp honey', '1 tbsp mustard', '2 tbsp BBQ sauce'],
    steps: [
      'Whisk the mayo and honey together until completely smooth.',
      'Add the mustard and the barbecue sauce and whisk again. {r:264} makes the barbecue sauce, if there is no bottle.',
      'Taste it. It should be sweet first, tangy second, smoky underneath — adjust with a little more honey or mustard.',
      'Chill 30 minutes before serving.',
    ],
    macro: null, tagline: 'Sweet First, Tangy Second', score: null, sc: null,
    diff: 'Easy', time: '35 mins', extras: 'BBQ Sauce',
  },

  /* ---- fifteen more, all storehouse-pure -------------------------------
   *
   * The shelf had ten and seven of them needed pantry extras, which makes a
   * copycat shelf that mostly cannot be cooked from the order sheet. Every
   * one of these needs nothing beyond it. The seasoning shelf is salt,
   * pepper, cinnamon, cinnamon sugar and vanilla, so what is copied here is
   * technique rather than spice: a soda bath, a boil before a bake, choux
   * beaten over heat, dry milk for body, evaporated milk so cheese will not
   * split. Five came from sources Blake sent; the rest fill gaps the data
   * showed — no pretzel, no bagel, no doughnut, no nugget, no lasagna. */
  {
    id: 317, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Soft Pretzels, Mall-Style',
    servings: '8 Servings (1 Pretzel)', servN: 8,
    ing: [
      "4.5 cups white flour",
      "1 packet yeast",
      "1.5 cups warm water",
      "2 tbsp brown sugar",
      "4 tbsp butter",
      "2 tsp salt",
      "⅔ cup baking soda (for the water)",
      "1 egg",
    ],
    steps: [
      "Stir the yeast and brown sugar into the warm water and leave it 5 minutes, until it foams. Water hotter than bathwater kills the yeast and nothing will rise.",
      "Mix in the flour, the melted butter and the salt, then knead 6 minutes, until the dough is smooth and springs back when pressed.",
      "Cover it and leave it to rise 1 hour, until doubled.",
      "Heat the oven to 450°F. Bring the 8 cups of water to a rolling boil in a wide pot.",
      "Divide the dough into eight. Roll each piece into a rope about 20 inches long and twist it into a pretzel.",
      "Whisk the baking soda into the boiling water a spoonful at a time. It foams up hard, so stand back and use a pot with room above the water.",
      "Lower the pretzels in two at a time for 30 seconds, then lift them out, drain well, and set them on a parchment-lined or well-greased baking sheet.",
      "Brush with beaten egg, scatter salt over, and bake 12 to 14 minutes until deep brown. The soda bath is what makes a pretzel taste like a pretzel instead of bread.",
    ],
    macro: null, tagline: 'The Soda Bath Is the Whole Thing', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs', extras: null,
  },
  {
    id: 318, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Endless Breadsticks',
    servings: '12 Servings (1 Breadstick)', servN: 12,
    ing: ['4 cups white flour', '1 packet yeast', '1.5 cups warm water', '2 tbsp sugar',
      '2 tsp salt', '6 tbsp butter'],
    steps: [
      'Stir the yeast and sugar into the warm water and leave it 5 minutes, until it foams.',
      'Mix in the flour, 2 tbsp of the butter melted, and the salt. Knead 8 minutes, until smooth.',
      'Cover and rise 1 hour, until doubled.',
      'Divide into twelve. Roll each into a rope about 7 inches long and set them on a buttered tray with room between them.',
      'Cover and rise another 45 minutes, until puffed.',
      'Bake at 400°F for 12 to 14 minutes, until golden.',
      'Melt the rest of the butter with a good pinch of salt and brush it over while they are still hot. Brushed cold, it sits on top instead of soaking in.',
    ],
    macro: null, tagline: 'Brushed Hot, Not Cold', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 15 mins', extras: null,
  },
  {
    id: 319, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Cheddar Bay Biscuits',
    servings: '12 Servings (1 Biscuit)', servN: 12,
    ing: ['2 cups white flour', '1 tbsp baking powder', '1 tsp salt', '6 tbsp butter',
      '1 cup cheddar', '¾ cup milk', '2 tbsp butter'],
    steps: [
      'Heat the oven to 425°F.',
      'Rub the cold butter into the flour, baking powder and salt with your fingertips, until it looks like coarse crumbs.',
      'Stir in the cheddar, then the milk, with a fork — only until it comes together. A few dry patches are better than a smooth dough.',
      'Drop twelve spoonfuls onto an ungreased tray, leaving room between them.',
      'Bake 12 to 14 minutes, until risen and golden at the edges.',
      'Melt the last 2 tbsp of butter and brush it over them as they come out of the oven.',
    ],
    macro: null, tagline: 'Dropped, Not Rolled', score: null, sc: null,
    diff: 'Medium', time: '30 mins', extras: null,
  },
  {
    id: 320, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Chicken Nuggets',
    servings: '6 Servings', servN: 6,
    ing: ['1.5 lbs chicken breast', '1 cup milk, for the soak', '1 egg, for the soak', '1.5 cups white flour, for the dredge',
      '2 tsp salt, for the dredge', '1 tsp black pepper, for the dredge', '4 cups vegetable oil (for frying)'],
    steps: [
      'Cut the chicken into pieces about an inch and a half across. Even sizes matter more than shape here — a small piece is dry by the time a big one is done.',
      'Whisk the milk and egg together in one bowl. Mix the flour, salt and pepper in another.',
      'Soak the chicken in the milk and egg for 15 minutes.',
      'Heat the oil in a deep pan to 350°F. A pinch of flour dropped in should sizzle straight away.',
      'Lift each piece out, let it drip, and turn it in the seasoned flour until it is covered all over.',
      'Fry in batches for 4 to 5 minutes, turning once, until deep gold. Crowding the pan drops the temperature and gives you greasy nuggets.',
      'Cut the thickest one open before serving: white through, 165°F, no pink.',
    ],
    macro: null, tagline: 'Even Sizes, Uncrowded Pan', score: null, sc: null,
    diff: 'Medium', time: '40 mins', extras: null,
  },
  {
    id: 321, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Onion Rings',
    servings: '6 Servings', servN: 6,
    ing: ['2 onions', '¾ cup white flour, for the batter', '¾ cup white flour, for the dredge', '1 cup milk', '1 egg',
      '1 tsp salt', '½ tsp black pepper', '4 cups vegetable oil (for frying)'],
    steps: [
      'Slice the onions into rounds half an inch thick and push them apart into rings.',
      'Whisk half the flour with the milk, egg, salt and pepper into a batter about the thickness of pouring cream.',
      'Put the rest of the flour in a shallow bowl.',
      'Heat the oil to 350°F in a deep pan.',
      'Turn each ring in the dry flour first, then through the batter. The dry coat is what gives the batter something to hold on to.',
      'Fry a handful at a time for 2 to 3 minutes, turning once, until gold. Drain them and salt them straight away.',
    ],
    macro: null, tagline: 'Dry Flour First', score: null, sc: null,
    diff: 'Medium', time: '35 mins', extras: null,
  },
  {
    id: 322, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Broccoli Cheddar Soup',
    servings: '6 Servings', servN: 6,
    ing: ['1 lb broccoli', '2 carrots', '1 onion', '4 tbsp butter', '¼ cup white flour',
      '2 cups milk', '1 can evaporated milk', '2 cups water', '2 cups cheddar',
      '1 tsp salt', 'black pepper'],
    steps: [
      'Cook the diced onion in the butter over medium heat for 6 minutes, until soft and not browned.',
      'Whisk in the flour and cook it a full minute, until it looks like wet sand.',
      'Add the milk and evaporated milk a splash at a time, whisking each smooth before the next, then stir in the water.',
      'Add the broccoli cut small and the carrots grated. Simmer 15 minutes, until the broccoli gives under a spoon.',
      'Off the heat, stir in the cheddar a handful at a time. Boiled, cheese goes grainy and the fat splits out.',
      'Salt and pepper it, and taste it. A soup this thick takes more salt than seems right.',
    ],
    macro: null, tagline: 'Off the Heat for the Cheese', score: null, sc: null,
    diff: 'Medium', time: '45 mins', extras: null,
  },
  {
    id: 323, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Cottage Cheese Lasagna',
    servings: '8 Servings', servN: 8,
    ing: ['16 oz pasta', '2 lbs ground beef', '1 jar spaghetti sauce', '1 can tomato sauce',
      '2 cups cottage cheese', '1 egg', '2 cups cheddar', '1 tsp salt', 'black pepper'],
    steps: [
      "Heat the oven to 375°F.",
      "Boil the pasta two minutes short of the packet time; it finishes in the oven.",
      "Brown the beef in a wide pan over medium-high, breaking it up, 8 to 10 minutes until no pink is left (160°F). Drain the fat off.",
      "Stir the spaghetti sauce and tomato sauce into the beef and simmer 10 minutes.",
      "Beat the egg into the cottage cheese with the salt and plenty of pepper. The egg is what stops it running out of the layers.",
      "Layer a 9x13 dish: sauce, pasta, cottage cheese, cheddar. Repeat, and finish with sauce and cheddar on top.",
      "Cover with foil and bake 30 minutes, then uncover and bake 15 more, until brown at the edges.",
      "Stand it 15 minutes before cutting. Cut hot, it slides apart.",
    ],
    macro: null, tagline: 'The Egg Holds the Layers', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 30 mins', extras: null,
  },
  {
    id: 324, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Restaurant Queso',
    servings: '8 Servings (¼ Cup Each)', servN: 8,
    ing: ['2 tbsp butter', '2 tbsp white flour', '1 can evaporated milk', '2 cups cheddar',
      '½ cup salsa', '½ tsp salt'],
    steps: [
      'Melt the butter in a small pan and whisk in the flour. Cook it a full minute.',
      'Add the evaporated milk a splash at a time, whisking smooth after each, until it thickens.',
      'Take it off the heat and stir in the cheddar a handful at a time, letting each one melt before the next goes in.',
      'Stir in the salsa and the salt.',
      'Serve it warm. It thickens as it stands, and a splash of milk over low heat brings it back.',
    ],
    macro: null, tagline: 'Evaporated Milk Keeps It Smooth', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: null,
  },
  {
    id: 325, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Chocolate Frosty',
    servings: '4 Servings', servN: 4,
    ing: ['2 cups milk', '½ cup non-fat dry milk', '2 packets hot cocoa mix', '2 tbsp sugar',
      '1 tsp vanilla', '3 cups ice'],
    steps: [
      'Blend the milk, dry milk, cocoa mix, sugar and vanilla until completely smooth.',
      'Add the ice and blend again on high, until it is thick enough to hold a spoon upright.',
      'Serve it at once. The dry milk is what makes it thick rather than thin and sweet.',
    ],
    macro: null, tagline: 'Thick Enough for a Spoon', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: null,
  },
  {
    id: 326, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Orange Julius',
    servings: '4 Servings', servN: 4,
    ing: ['3 oranges', '1 cup milk', '¼ cup non-fat dry milk', '2 tbsp sugar',
      '1 tsp vanilla', '2 cups ice'],
    steps: [
      'Squeeze the oranges. You want about a cup of juice.',
      'Blend the juice with the milk, dry milk, sugar and vanilla until smooth.',
      'Add the ice and blend on high until it is frothy and pale.',
      'Drink it inside ten minutes; it separates as it stands.',
    ],
    macro: null, tagline: 'Frothy and Pale', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: "Oranges",
  },
  {
    id: 327, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Glazed Doughnuts',
    servings: "20 Servings (1 Doughnut)", servN: 20,
    ing: [
      "5 cups white flour",
      "2 packets yeast",
      "¼ cup warm water",
      "1 cup milk",
      "½ cup sugar",
      "1.5 tsp salt",
      "2 eggs",
      "⅓ cup butter",
      "4 cups vegetable oil (for frying)",
      "¼ cup butter",
      "2 cups powdered sugar",
      "2 tsp vanilla",
      "2 tbsp evaporated milk",
    ],
    steps: [
      "Stir the yeast into the warm water and leave it 5 minutes, until it foams.",
      "Warm the milk and let it cool to blood heat, then add it to the yeast with the sugar, salt, eggs, the softened ⅓ cup of butter and 2 cups of the flour. Beat 2 minutes.",
      "Work in the remaining 3 cups of flour to a soft dough, then knead it on a floured counter 5 minutes, until it is smooth and springs back when pressed. Cover and rise 1 to 2 hours, until doubled.",
      "Roll the dough out half an inch thick and cut rings. Cover them loosely and leave them to rise 30 to 45 minutes, until doubled.",
      "Heat at least three inches of oil to 350°F in a deep pan.",
      "Fry a few at a time, about a minute a side, until golden. They cook fast, and a crowded pan drops the oil temperature.",
      "Drain them on a rack.",
      "Melt the ¼ cup of butter and whisk it with the powdered sugar, vanilla and evaporated milk (adding another splash if needed) to make a glaze that pours off the spoon in a ribbon.",
      "Dip each doughnut while it is still warm and set it back on the rack to drip. Dipped cold, the glaze sits in a lump instead of a sheet.",
    ],
    macro: null, tagline: 'Dipped Warm', score: null, sc: null,
    diff: 'In-Depth', time: "3 hrs", extras: null,
  },
  {
    id: 328, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Pink Sugar Cookies, Served Cold',
    vary: ['Half a cup of sour cream beaten in with the eggs, with a quarter cup more flour, makes a softer, cake-like cookie.'],
    servings: '16 Servings (1 Cookie)', servN: 16,
    ing: [
      "1.5 cups butter",
      "1 cup sugar",
      "2 eggs",
      "2 tsp vanilla",
      "4 cups white flour",
      "1 tbsp baking powder",
      "1 tsp salt",
      "½ cup butter",
      "3 cups powdered sugar",
      "3 tbsp milk",
      "1 drop red food colouring",
    ],
    steps: [
      "Heat the oven to 350°F.",
      "Cream the 1.5 cups of butter with the sugar until light. Beat in the eggs and a teaspoon of the vanilla.",
      "Mix in the flour, baking powder and salt, only until it comes together.",
      "Scoop the dough into sixteen balls and set them well apart on trays. They spread.",
      "Dip the bottom of a drinking glass in sugar and press each ball flat, to about half an inch.",
      "Bake 9 to 11 minutes, until the tops are no longer glossy. Do not wait for colour at the edges — browned, they are overbaked.",
      "Let them cool on the tray.",
      "Beat the remaining ½ cup of butter with the powdered sugar, the last teaspoon of vanilla, the milk and the drop of red food colouring, until smooth, light and pale pink.",
      "Spread the frosting on while the cookies are barely warm, so it settles flat, then chill them 1 hour, until cold through. These are served cold.",
    ],
    macro: null, tagline: 'Pressed With a Glass', score: null, sc: null,
    diff: 'Medium', time: "1 hr 40 mins", extras: null,
  },
  {
    id: 329, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Chicken Taquitos',
    servings: '6 Servings (2 Taquitos)', servN: 6,
    ing: ['1.5 lbs chicken breast', '1 cup sour cream', '1 cup cheddar', '½ cup salsa',
      '1 tsp salt', '12 small tortillas', '2 cups vegetable oil (for frying)'],
    steps: [
      'Cook the chicken through — 165°F, no pink at the centre — then shred it with two forks.',
      'Stir the sour cream, salsa and salt together, pour it over the chicken, and mix until every strand is coated.',
      'Stir the cheddar through.',
      'Warm the tortillas three at a time between two damp paper towels, about 15 seconds, until they bend without cracking. Cold ones split as you roll them.',
      'Spoon filling down the middle of each and roll it up tight.',
      'Heat half an inch of oil in a wide pan to 350°F.',
      'Fry them seam side down first, turning until gold all round, about 3 minutes. Seam down first is what stops them unrolling.',
      'Drain them on a rack rather than on paper, so the undersides stay crisp.',
    ],
    macro: null, tagline: 'Seam Side Down First', score: null, sc: null,
    diff: 'Medium', time: '40 mins', extras: null,
  },
  {
    id: 330, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Cheddar Bagels',
    servings: '8 Servings (1 Bagel)', servN: 8,
    ing: [
      "4.5 cups white flour",
      "1.5 tbsp yeast",
      "1½ cups warm water",
      "1 tbsp brown sugar",
      "2 tsp salt",
      "2 cups cheddar",
    ],
    steps: [
      "Stir the yeast and brown sugar into the warm water and leave it 5 minutes, until it foams.",
      "Mix the flour, salt and half the cheddar in a large bowl, pour the yeast water in, and knead 10 minutes to a firm, smooth dough. Add water a tablespoon at a time only if it will not come together; bagel dough should be stiff.",
      "Rest the dough 5 minutes, then cut it into eight and roll each piece into a tight ball.",
      "Push your thumb through the middle of each ball and turn it around your thumb until the hole is about two inches across.",
      "Set them on a parchment-lined tray, cover them, and rise 30 minutes.",
      "Heat the oven to 425°F and bring the 8 cups of water to a rolling boil.",
      "Boil the bagels a minute a side, a few at a time, then drain well and lift them back onto the tray.",
      "Scatter the rest of the cheddar over and bake 15 to 17 minutes, until golden.",
      "Cool them 10 minutes before cutting. Cut hot, the crumb drags on the knife.",
    ],
    macro: null, tagline: 'Boiled, Then Baked', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs', extras: null,
  },
  {
    id: 331, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Churros, Piped and Fried',
    servings: '12 Servings (1 Churro)', servN: 12,
    ing: ['1 cup water', '1 tsp vanilla', '¼ tsp salt', '2 tbsp butter', '1 cup white flour',
      '1 egg', '3 cups vegetable oil (for frying)', '½ cup cinnamon sugar'],
    steps: [
      'Bring the water, vanilla, salt and butter to a rolling boil in a saucepan.',
      'Tip the flour in all at once and beat it hard with a wooden spoon until it comes together into a smooth ball that leaves the sides of the pan.',
      'A rolling boil is the part that matters. Started in water that is merely hot, churros come out soft instead of crisp.',
      'Take it off the heat, let it stand a minute, then beat the egg in until the dough is glossy and smooth again.',
      'Heat the oil to 375°F in a deep pan.',
      'Pipe lengths of dough about 5 inches long straight into the oil, cutting each one off with a knife.',
      'Fry 2 minutes a side, until deep gold and crisp all over.',
      'Drain them briefly and roll them in cinnamon sugar while they are still hot.',
    ],
    macro: null, tagline: 'A Rolling Boil, Then Flour', score: null, sc: null,
    diff: 'In-Depth', time: '40 mins', extras: null,
  },
  /* Two more, both asked for by name.
   *
   * The pot roast is the only recipe on this shelf that needed a new food in
   * the table: pepperoncini, pickled and drained, and the figure that matters
   * is its sodium — they come out of brine, and the tang everyone remembers is
   * salt as much as heat.
   *
   * The soup is Olive Garden's, and the kale is the problem: the storehouse
   * carries no leafy green that holds up in a hot pot. Broccoli cut small is
   * the nearest thing on the shelf that keeps its bite, and the rest of the
   * soup — sausage, potato, onion, something creamy that will not split — is
   * on the order sheet as it stands. Evaporated milk rather than cream is not
   * a compromise here; it is the thing least likely to break over heat. */
  {
    id: 333, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Mississippi Pot Roast',
    servings: '8 Servings', servN: 8,
    ing: ['3 lbs beef roast', '½ cup ranch', '¼ cup butter', '6 pepperoncini', '1 tsp black pepper'],
    steps: [
      'Put the roast in the slow cooker. Add no water — the roast gives up more liquid than you expect, and water on top of that makes soup of it.',
      'Spoon the ranch over the top and lay the butter over that in slices.',
      'Scatter the pepperoncini over, and a tablespoon of the brine from the jar with them. The brine is the tang this is known for; the peppers themselves are mild.',
      'Cover and cook on LOW for 8 hours, until it pulls apart under a fork. Every time the lid comes off it costs about twenty minutes.',
      'Shred the beef in the pot and stir it back through the liquid.',
      'Serve it over {r:276} or rice. The liquid in the pot is the sauce; {r:265} made with it instead of water turns it into gravy.',
    ],
    macro: null, tagline: 'No Water, Eight Hours', score: null, sc: null,
    diff: 'Easy', time: '8 hrs 10 mins', extras: 'Pepperoncini',
  },
  {
    id: 334, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Zuppa Toscana',
    servings: '8 Servings', servN: 8,
    ing: ['1 lb pork sausage', '4 oz ham', '2 lbs potatoes', '1 onion', '4 cups water',
      '1 can cream of chicken', '1 can evaporated milk', '½ lb broccoli',
      '1 tsp salt', '1 tsp black pepper'],
    steps: [
      "Brown the sausage in a large pot over medium-high, breaking it up small, 8 to 10 minutes until no pink is left (160°F). Pour off all but a spoonful of the fat.",
      "Add the ham and the onion, both diced, and cook 6 minutes, until the onion has gone soft.",
      "Add the potatoes cut into half-inch slices and the water. Simmer 15 minutes, until a knife goes into a potato without resistance.",
      "Stir in the soup and the evaporated milk and bring it back to a bare simmer. Boiled hard from here it will split.",
      "Add the broccoli cut small and give it 5 minutes more, until it is bright and still has some bite.",
      "Salt and pepper it, then taste it again. A potato soup takes more salt than seems right.",
      "It thickens overnight and is better the next day. Loosen it with a splash of milk as it warms.",
    ],
    macro: null, tagline: 'A Bare Simmer, Never a Boil', score: null, sc: null,
    diff: 'Medium', time: '50 mins', extras: null,
  },
  // ==================== For the Love of Chocolate =========================
  {
    id: 248, book: 2, secNum: 8, secName: CHOC,
    name: 'Thick Bakery-Style Chocolate Chip Cookies',
    servings: '12 Large Cookies', servN: 12,
    ing: ['1 cup butter', '1 cup brown sugar', '½ cup sugar', '2 eggs', '2 tsp vanilla',
      '3 cups white flour', '1 tbsp cornstarch', '1 tsp baking soda', '1 tsp salt',
      '2 cups chocolate chips'],
    steps: [
      "Beat the cold butter with both sugars for a full 3 minutes, until pale and fluffy. Cold butter is what keeps these thick instead of spreading flat.",
      "Beat in the eggs one at a time, then the vanilla.",
      "Whisk the flour, cornstarch, baking soda and salt together. The cornstarch is the whole trick — it makes the middle soft and slightly underdone-looking.",
      "Fold the dry into the wet just until the last streak of flour disappears. Overmixing builds gluten and makes them tough.",
      "Fold in the chocolate chips.",
      "Divide into 12 large mounds, roughly 4 oz each, and pile them tall rather than flattening them.",
      "Chill the mounds at least 2 hours, or overnight. Skipping this is the single most common reason cookies come out flat and greasy.",
      "Bake on a parchment-lined baking sheet (no more than 6 to a tray so they have room) at 400°F for 10 to 12 minutes. Pull them when the edges are set and the middles still look wet and underbaked.",
      "Leave them on the hot tray 10 minutes to finish cooking through, then move to a rack.",
    ],
    macro: null, tagline: 'Tall, Craggy, Molten Middle', score: null, sc: null,
    diff: 'In-Depth', time: '2 hrs 45 mins', extras: 'Chocolate Chips, Cornstarch',
  },
  {
    id: 249, book: 2, secNum: 8, secName: CHOC,
    name: 'Molten Chocolate Lava Cakes',
    servings: '6 Cakes', servN: 6,
    ing: ['1 cup chocolate chips', '½ cup butter', '3 eggs', '½ cup powdered sugar',
      '¼ cup white flour', '1 tsp vanilla', 'salt'],
    steps: [
      'Butter six ramekins heavily and dust them with sugar. Anything less and the cakes will not turn out.',
      'Melt the chocolate chips and butter together over a pan of barely simmering water, stirring until glossy. Do not let the bowl touch the water or the chocolate will seize.',
      'Whisk the eggs with the powdered sugar and a pinch of salt for 2 minutes, until thick and pale.',
      'Fold the warm chocolate into the eggs, then fold in the flour and vanilla.',
      'Divide between the ramekins and chill 30 minutes. You can hold them here for a day.',
      'Bake at 425°F for 11 to 13 minutes. The edges should be set and the centre should still wobble like a jelly.',
      'This is a recipe about timing, not doneness. A minute too long and you have a very good small chocolate cake and no lava.',
      'Rest 1 minute, run a knife round the edge, and turn out onto plates. Serve at once.',
    ],
    macro: null, tagline: 'A Minute Too Long and It Is Just Cake', score: null, sc: null,
    diff: 'In-Depth', time: '55 mins', extras: 'Chocolate Chips',
  },
  {
    id: 250, book: 2, secNum: 8, secName: CHOC,
    name: 'Chocolate Sheet Cake with Fudge Icing',
    servings: '20 Servings', servN: 20,
    ing: ['2 cups white flour', '2 cups sugar', '1 cup butter', '¼ cup cocoa powder',
      '1 cup water', '½ cup sour cream', '2 eggs', '1 tsp baking soda', '1 tsp salt',
      '½ cup butter', '¼ cup cocoa powder', '6 tbsp milk', '4 cups powdered sugar',
      '1 tsp vanilla'],
    steps: [
      "Heat the oven to 350°F and grease an 18x13-inch half-sheet pan. Whisk the flour, sugar and salt together in a large bowl.",
      "Bring the cup of butter, the quarter cup of cocoa and the water to a boil in a pan, then pour it over the flour mixture and stir smooth.",
      "Beat in the sour cream, eggs and baking soda.",
      "Pour into a greased 18x13-inch half-sheet pan — the batter will be thin, which is correct.",
      "Bake at 350°F for 20 minutes, until a skewer comes out clean.",
      "While it bakes, make the icing: boil the half cup of butter, the second quarter cup of cocoa and the milk together.",
      "Take it off the heat and beat in the powdered sugar and vanilla until pourable and glossy.",
      "Pour the icing over the cake while both are still hot. This is the entire point of the recipe — hot icing on hot cake soaks in and sets to a fudgy shell.",
      "Leave to set at least an hour before cutting.",
    ],
    macro: null, tagline: 'Hot Icing, Hot Cake', score: null, sc: null,
    diff: 'In-Depth', time: '1 hr 45 mins', extras: 'Cocoa Powder',
  },
  {
    id: 251, book: 2, secNum: 8, secName: CHOC,
    name: 'Hot Fudge Sauce',
    servings: '12 Servings (2 Tbsp Each)', servN: 12,
    ing: ['½ cup butter', '⅔ cup cocoa powder', '1.5 cups sugar', '1 cup evaporated milk',
      '1 tsp vanilla', 'salt'],
    steps: [
      'Melt the butter in a heavy pan over low heat.',
      'Whisk in the cocoa and cook it 1 minute — cooking the cocoa in fat is what takes the raw, dusty edge off it.',
      'Add the sugar and evaporated milk and stir until the sugar has dissolved completely. Rub a little between your fingers to check for grit.',
      'Bring to a gentle simmer and cook 6 to 8 minutes, stirring, until it thickens and coats a spoon heavily.',
      'Take it off the heat and stir in the vanilla and a pinch of salt.',
      'Serve hot. It thickens to a spoonable fudge in the fridge and keeps two weeks — warm it gently to pour again.',
    ],
    macro: null, tagline: 'Thick Enough to Coat a Spoon', score: null, sc: null,
    diff: 'Medium', time: '20 mins', extras: 'Cocoa Powder',
  },
  {
    id: 252, book: 2, secNum: 8, secName: CHOC,
    name: 'No-Bake Chocolate Oat Cookies',
    servings: '24 Cookies', servN: 24,
    ing: ['2 cups sugar', '½ cup butter', '½ cup milk', '¼ cup cocoa powder',
      '½ cup peanut butter', '3 cups rolled oats', '1 tsp vanilla', 'salt'],
    steps: [
      'Put the sugar, butter, milk and cocoa in a pan and bring to a rolling boil, stirring.',
      'Boil for exactly 1 minute, timed. Under-boiled and they never set; over-boiled and they turn dry and crumbly. This one minute is the whole recipe.',
      'Take it off the heat and stir in the peanut butter and vanilla until smooth.',
      'Stir in the oats and a pinch of salt, working quickly before it starts to set.',
      'Drop spoonfuls onto waxed paper.',
      'Leave them to set at room temperature about 30 minutes. Do not put them in the fridge, which makes them sweat.',
    ],
    macro: null, tagline: 'Boil One Minute, Exactly', score: null, sc: null,
    diff: 'Easy', time: '40 mins', extras: 'Cocoa Powder',
  },
  {
    id: 253, book: 2, secNum: 8, secName: CHOC,
    name: 'Peanut Butter Buckeyes',
    servings: '36 Pieces', servN: 36,
    ing: ['1.5 cups peanut butter', '½ cup butter', '4 cups powdered sugar', '1 tsp vanilla',
      '2 cups chocolate chips'],
    steps: [
      'Beat the peanut butter with the softened butter and vanilla until smooth.',
      'Work in the powdered sugar a cup at a time until you have a stiff dough that holds its shape.',
      'Roll into balls and set them on a tray. Push a toothpick into each one.',
      'Chill 1 hour until firm. Soft balls fall off the stick straight into the chocolate.',
      'Melt the chocolate chips gently over barely simmering water, stirring until glossy.',
      'Hold each ball by its toothpick and dip it into the chocolate, leaving a circle of peanut butter showing at the top — that bare circle is what makes it a buckeye.',
      'Set back on the tray, smooth over the toothpick hole with a fingertip, and chill until firm.',
    ],
    macro: null, tagline: 'The Bare Circle on Top', score: null, sc: null,
    diff: 'Medium', time: '1 hr 45 mins', extras: 'Chocolate Chips',
  },
  {
    id: 254, book: 2, secNum: 8, secName: CHOC,
    name: 'Old-Fashioned Chocolate Fudge',
    servings: '36 Squares', servN: 36,
    ing: ['3 cups sugar', '1 cup evaporated milk', '½ cup butter', '2 cups chocolate chips',
      '1 tsp vanilla', 'salt'],
    steps: [
      'Butter a square pan and line it with a strip of parchment hanging over two sides.',
      'Bring the sugar, evaporated milk and butter to a boil in a heavy pan, stirring constantly.',
      'Boil 5 minutes, still stirring, without letting it catch. Scorched fudge cannot be rescued.',
      'Take it off the heat and tip in the chocolate chips, vanilla and a pinch of salt.',
      'Stir until every chip has melted and the mixture turns thick, glossy and loses its shine at the edges.',
      'Pour into the pan at once and spread it level — it begins setting immediately.',
      'Leave at room temperature 3 hours to set, then lift out and cut into small squares. It is rich enough that small is the right size.',
    ],
    macro: null, tagline: 'Rich Enough That Small Is Right', score: null, sc: null,
    diff: 'In-Depth', time: '3 hrs 30 mins', extras: 'Chocolate Chips',
  },
  {
    id: 255, book: 2, secNum: 8, secName: CHOC,
    name: 'Chocolate Chip Banana Bread',
    servings: '12 Slices', servN: 12,
    ing: ['3 ripe bananas', '½ cup butter', '¾ cup brown sugar', '2 eggs', '1 tsp vanilla',
      '1.75 cups white flour', '1 tsp baking soda', '1 tsp salt', '1 cup chocolate chips'],
    steps: [
      "Heat the oven to 350°F. Mash the bananas well. They should be heavily freckled or nearly black — underripe bananas make bland bread.",
      "Melt the butter and beat it with the brown sugar.",
      "Beat in the eggs and vanilla, then the mashed banana.",
      "Whisk the flour, baking soda and salt together, then fold them in just until combined.",
      "Toss the chocolate chips in a spoonful of flour before folding them through — floured chips stay suspended instead of sinking to the bottom.",
      "Pour into a parchment-lined 9x5-inch loaf tin and scatter a few more chips on top.",
      "Bake at 350°F for 55 to 60 minutes, covering the top with foil if it darkens too fast, until a skewer in the middle comes out with a few moist crumbs and no wet batter.",
      "Cool in the tin 15 minutes, then turn out. Slicing it hot makes it gummy.",
    ],
    macro: null, tagline: 'Chips That Stay Suspended', score: null, sc: null,
    diff: 'Medium', time: '1 hr 20 mins', extras: 'Chocolate Chips',
  },
  {
    id: 256, book: 2, secNum: 8, secName: CHOC,
    name: 'Chocolate Cream Pie',
    servings: '8 Servings', servN: 8,
    ing: ['1.5 cups white flour', '½ cup cold butter', '4 tbsp cold water', '1 tsp salt',
      '¾ cup sugar', '⅓ cup cocoa powder', '¼ cup cornstarch', '3 cups milk', '4 eggs',
      '2 tbsp butter', '2 tsp vanilla'],
    steps: [
      'Rub the cold butter into the flour and salt, add the water, and gather into a dough. Rest it 30 minutes in the fridge.',
      'Roll it out, line a pie dish, prick the base all over and line it with paper and baking weights.',
      'Bake blind at 400°F for 20 minutes, then remove the weights and bake 8 minutes more until dry and sand-coloured. A raw-bottomed cream pie is a sad thing.',
      'Whisk the sugar, cocoa, cornstarch and a pinch of salt in a pan, then whisk in the milk a little at a time so no lumps form.',
      'Cook over medium heat, whisking constantly, until it thickens and bubbles. Let it bubble a full minute — that is what cooks out the starch.',
      'Beat the egg yolks in a bowl, pour in a ladle of the hot mixture while whisking, then return it all to the pan.',
      'Cook 2 minutes more, still whisking, then take off the heat and stir in the butter and vanilla.',
      'Pour into the cooled crust and press plastic wrap directly onto the surface so no skin forms.',
      'Chill at least 4 hours before cutting.',
    ],
    macro: null, tagline: 'No Skin, No Soggy Bottom', score: null, sc: null,
    diff: 'In-Depth', time: '5 hrs 30 mins', extras: 'Cocoa Powder, Cornstarch',
  },
  {
    id: 257, book: 2, secNum: 8, secName: CHOC,
    name: 'Salted Chocolate Chip Cookie Bars',
    servings: '16 Bars', servN: 16,
    ing: ['¾ cup butter', '1 cup brown sugar', '½ cup sugar', '2 eggs', '2 tsp vanilla',
      '2 cups white flour', '1 tsp baking soda', '1 tsp salt', '1.5 cups chocolate chips'],
    steps: [
      "Heat the oven to 350°F. Melt the butter and let it cool for 5 minutes. Melted rather than creamed butter is what makes these chewy instead of cakey.",
      "Beat in both sugars, then the eggs and vanilla, and keep beating a minute until the mixture looks glossy.",
      "Fold in the flour, baking soda and salt just until combined.",
      "Fold through most of the chocolate chips.",
      "Press into a 9x13-inch pan lined with parchment hanging over two sides, and press the remaining chips into the top. The overhang is what lifts the slab out whole to be cut.",
      "Sprinkle the top with a little coarse salt.",
      "Bake at 350°F for 25 to 28 minutes, until the edges are golden and the middle is barely set.",
      "Cool completely in the pan before cutting — warm, they fall apart.",
    ],
    macro: null, tagline: 'Chewy, Not Cakey', score: null, sc: null,
    diff: 'Medium', time: '50 mins', extras: 'Chocolate Chips',
  },
  {
    id: 258, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Vanilla & Cinnamon Steamer',
    servings: '1 Mug', servN: 1,
    ing: ['⅔ cup non-fat dry milk', '1.5 cups hot water', '1 tsp vanilla', '1 tsp cinnamon',
      '1 tsp honey'],
    steps: [
      "Put the dry milk and cinnamon in a mug and add about two tablespoons of cold water. Stir to a smooth paste. This is the whole trick — dry milk tipped straight into hot water seizes into lumps that never come out.",
      "Heat the rest of the water in a small pot for 2 to 3 minutes (or 1 to 2 minutes in the microwave) until it steams, short of a boil — boiling scalds the milk paste and makes it skin.",
      "Pour the hot water in slowly, stirring as you go.",
      "Stir in the vanilla and honey and drink it hot.",
    ],
    macro: null, tagline: 'Paste First, Then the Hot Water', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  {
    id: 259, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Fortified Hot Cocoa',
    servings: '1 Mug', servN: 1,
    ing: ['⅔ cup non-fat dry milk', '½ packet hot cocoa mix', '1.5 cups hot water',
      '1 tsp cinnamon'],
    steps: [
      'Stir the dry milk, half the cocoa packet and the cinnamon together in a mug while they are still dry, so the cinnamon has something to cling to.',
      'Add two tablespoons of cold water and work it to a smooth paste with the back of a spoon.',
      'Pour in the hot water a little at a time, stirring, until it is thin enough to drink.',
      'Taste before adding the rest of the packet. Half is usually enough — the dry milk is already sweet, and the second half costs more sugar than it adds flavour.',
    ],
    macro: null, tagline: 'Half the Packet, Four Times the Protein', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  {
    id: 260, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Iced Vanilla & Cinnamon Milk',
    servings: '1 Tall Glass', servN: 1,
    ing: ['½ cup non-fat dry milk', '½ cup 2% milk', '1 cup cold water', '1 tsp vanilla',
      '½ tsp cinnamon', 'ice'],
    steps: [
      'Whisk the dry milk and cinnamon into the ½ cup of cold milk until there is not a lump left. Cold takes longer than hot — keep going.',
      'Stir in the water and the vanilla.',
      'Leave it in the fridge 20 minutes if you can. It thickens slightly and the cinnamon stops sitting on top.',
      'Pour over ice.',
    ],
    macro: null, tagline: 'Better After Twenty Minutes Cold', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },
  {
    id: 261, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Morning Oat Steamer',
    servings: '1 Large Mug', servN: 1,
    ing: ['½ cup non-fat dry milk', '¼ cup oat flour', '½ cup 2% milk', '1 cup hot water',
      '1 tsp cinnamon', '1 tsp honey'],
    steps: [
      'Whisk the oat flour, dry milk and cinnamon into the cold milk until smooth.',
      'Pour it into a small pan and bring it up slowly, stirring the whole time. It will thicken as the oat flour cooks — about three minutes.',
      'Thin it with the hot water until it pours rather than mounds. How much you need depends on how fine your oat flour is.',
      'Stir in the honey off the heat. It is breakfast rather than a drink; a spoon is not cheating.',
    ],
    macro: null, tagline: 'Thickens as It Goes', score: null, sc: null,
    diff: 'Easy', time: '8 mins', extras: null,
  },
  {
    id: 262, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Salted Brown Sugar Steamer',
    servings: '1 Mug', servN: 1,
    ing: ['½ cup non-fat dry milk', '½ cup 2% milk', '1 cup hot water', '2 tsp brown sugar',
      '1 tsp vanilla', '½ tsp cinnamon', 'pinch salt'],
    steps: [
      "Melt the brown sugar with a splash of the milk in a small pan over low heat, and let it bubble for 1 minute until it smells like caramel rather than like sugar.",
      "Whisk in the rest of the cold milk, the dry milk, the cinnamon and the salt, off the heat, until smooth.",
      "Add the hot water and bring it back to steaming, stirring, 1 to 2 minutes. Do not let it boil.",
      "Stir in the vanilla last. Heat drives it off, so anything added earlier is wasted.",
    ],
    macro: null, tagline: 'Let the Sugar Catch First', score: null, sc: null,
    diff: 'Easy', time: '7 mins', extras: null,
  },
  {
    id: 263, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Peanut Butter Cocoa',
    servings: '1 Mug', servN: 1,
    ing: ['½ cup non-fat dry milk', '½ packet hot cocoa mix', '2 tsp peanut butter',
      '1.5 cups hot water', '½ tsp cinnamon'],
    steps: [
      'Put the peanut butter in the mug on its own and stir in two tablespoons of the hot water until it loosens into a sauce. Add it to everything else at once and it stays a lump on the bottom.',
      'Stir in the dry milk, the cocoa and the cinnamon.',
      'Add the rest of the hot water slowly, stirring, until it is smooth.',
      'It separates as it stands. Stir it again halfway down the mug.',
    ],
    macro: null, tagline: 'Loosen the Peanut Butter First', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  /* ---- five cold ones -------------------------------------------------
   *
   * The six above are five hot drinks and one iced, which is a section that
   * only works from October. These are the summer half, and the half a person
   * reaches for after something rather than before bed.
   *
   * Same trick underneath: non-fat dry milk is on the order list and is 36%
   * protein, so it is what turns a glass of milk into something worth calling
   * a power drink. Cottage cheese does the same job harder — blended it stops
   * being cottage cheese entirely, and No. 271 carries more protein than any
   * storehouse-only drink in the book.
   *
   * Every one is off the order sheet. Nothing here needs whey, Crio Bru, a
   * protein powder or a trip anywhere.
   */
  {
    id: 267, book: 1, secNum: 6, secName: 'Power Drinks',
    name: "Banana Milk",
    servings: '1 Tall Glass', servN: 1,
    ing: ['1 frozen banana', '½ cup non-fat dry milk', '½ cup 2% milk', '½ cup cold water',
      '2 tsp honey', '½ tsp cinnamon'],
    steps: [
      "Peel the banana before you freeze it. Frozen in the skin it is a job for a knife and a bad mood.",
      "Blend the banana, dry milk, milk, water, honey and cinnamon until there is no grain left in it.",
      "It thickens as it stands. Drink it inside ten minutes or add a splash more milk and stir.",
    ],
    macro: null, tagline: 'Freeze the Banana Peeled', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  {
    id: 268, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Peanut Butter Banana Shake',
    servings: '1 Tall Glass', servN: 1,
    ing: ['1 frozen banana', '1 tbsp peanut butter', '½ cup non-fat dry milk',
      '1 cup cold water', '½ tsp cinnamon'],
    steps: [
      'Blend everything at once. Peanut butter behaves in a blender the way it does not in a mug — there is nothing to loosen first.',
      'Stop while it is still thick enough to hold the mark of a spoon.',
    ],
    macro: null, tagline: 'Thick Enough to Hold a Spoon Mark', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  {
    id: 269, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Apple Pie Milk',
    servings: '1 Tall Glass', servN: 1,
    ing: ['½ cup applesauce', '½ cup non-fat dry milk', '½ cup 2% milk', '½ cup cold water',
      '2 tsp brown sugar', '1 tsp cinnamon', 'ice'],
    steps: [
      "Whisk the dry milk into the applesauce first. It is thick enough to grind the lumps out against the side of the bowl, which milk alone will not do.",
      "Stir in the milk, the cold water, the brown sugar and the cinnamon.",
      "Pour over ice. Cold and thin, it tastes like the last spoonful of the pie rather than the filling.",
    ],
    macro: null, tagline: 'Start With the Applesauce', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },
  {
    id: 270, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Cold Oat & Cinnamon Milk',
    servings: '1 Tall Glass', servN: 1,
    ing: ['¼ cup oats', '½ cup non-fat dry milk', '1 cup 2% milk', '1 tsp honey',
      '1 tsp cinnamon'],
    steps: [
      'Soak the oats in the cup of milk in the fridge for at least an hour, and overnight if you have it. This is the whole recipe; everything after it takes a minute.',
      'Blend the lot — oats, milk, dry milk, honey and cinnamon — until smooth.',
      'Strain it through a sieve if you want it thin. Skip that and it is closer to a drinkable porridge, which is the better breakfast of the two.',
    ],
    macro: null, tagline: 'Soak It the Night Before', score: null, sc: null,
    diff: 'Easy', time: "1 hr 5 mins", extras: null,
  },
  {
    id: 271, book: 1, secNum: 6, secName: 'Power Drinks',
    name: 'Chocolate Cottage Cheese Shake',
    servings: '1 Tall Glass', servN: 1,
    ing: ['¾ cup cottage cheese', '1 packet hot cocoa mix', '½ cup 2% milk',
      '1 cup cold water', 'ice'],
    steps: [
      "Blend the cottage cheese with the milk on its own until it is completely smooth. Not nearly — completely. Any curd left at this stage is still there at the end.",
      "Add the cocoa mix, the water and the ice, and blend again.",
      "Nobody who drinks this can tell it is cottage cheese, which is the only reason it is worth doing.",
    ],
    macro: null, tagline: 'Blend the Curd Out First', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },
  {
    id: 264, book: 2, secNum: 9, secName: MADE,
    name: 'Everyday BBQ Sauce',
    servings: '12 Servings (2 tbsp Each, About 1½ Cups)', servN: 12,
    ing: ['1 tbsp butter', '½ onion (grated)', '1 cup ketchup', '⅓ cup brown sugar',
      '2 tbsp mustard', '1 tbsp honey', '¼ cup water', '½ tsp salt', '½ tsp celery salt (optional)'],
    steps: [
      'Grate the onion on the coarse side of a box grater. Chopped is fine, but you will taste the pieces.',
      'Cook it in the butter over low heat for 8 minutes, until it is soft, slightly gold, and has stopped smelling sharp. This is where the sauce gets its depth, and there is no shortcut on high heat.',
      'Stir in the ketchup, brown sugar, mustard, honey, water, salt and celery salt. There is no vinegar on the storehouse list and none is needed — the ketchup and the mustard between them bring plenty.',
      'Bring it to a bare simmer and leave it 15 to 20 minutes, stirring now and then so the sugar does not catch. It is ready when a spoon drawn across the pan leaves a line for a second.',
      'Take it off and let it cool. It thickens again cold, so stop while it still looks slightly loose. In a jar in the fridge it keeps two weeks.',
    ],
    makes: ['bbq_sauce'],
    macro: null, tagline: 'The Onion Does What the Smoke Would', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
  },
  {
    id: 265, book: 2, secNum: 9, secName: MADE,
    name: 'Pan Gravy, Brown or Pale',
    servings: '8 Servings (About 2½ Cups)', servN: 8,
    ing: ['3 tbsp butter (or the fat from the pan)', '3 tbsp flour', '2 cups water (or the juices from the roast)',
      '½ cup milk', '½ tsp salt', '¼ tsp celery salt (optional)'],
    steps: [
      'Melt the butter in a wide pan over medium heat and whisk in the flour. It has to cook either way — raw flour is why packet gravy tastes like paste, and this is the minute that fixes it.',
      'For brown gravy for beef, whisk 4 or 5 minutes, until it smells like toast and is the colour of peanut butter. For pale gravy for chicken, stop after a minute, while it is still blond.',
      'Take the pan off the heat before any liquid goes near it. Add the water a splash at a time, whisking each one smooth before the next. The first half-cup is what decides whether it is lump-free.',
      'Back on medium heat with the milk stirred in. It will look far too thin for a while and then thicken all at once as it comes to the boil. Let it bubble two minutes to lose the floury edge.',
      'Now salt it. Taste first — off a roast it may need none. Too thick, add liquid; too thin, simmer it down. Do not add flour to a finished gravy, it will not cook out.',
    ],
    makes: ['gravy_mix'],
    macro: null, tagline: 'Brown the Flour and Nothing Lumps', score: null, sc: null,
    diff: 'Easy', time: '12 mins', extras: null,
  },
  {
    id: 266, book: 2, secNum: 9, secName: MADE,
    name: 'Lighter Mayo',
    servings: '10 Servings (About 1¼ Cups)', servN: 10,
    ing: ['1 cup cottage cheese', '¼ cup mayo', '1 tsp mustard', '¼ tsp salt'],
    steps: [
      'Blend the cottage cheese on its own until it is not curds any more — a full minute, which is longer than it feels like it should take. Stop early and it stays grainy, and nothing added afterwards will hide that.',
      'Add the mayo, mustard and salt and blend a few seconds more, just enough to bring it together.',
      'Give it an hour in the fridge. It firms up and the cottage cheese taste settles back into the mayo.',
      'It is not mayonnaise and it will not pass off a spoon. In tuna, in egg salad, on a sandwich, it does the same job.',
    ],
    makes: ['light_mayo'],
    macro: null, tagline: 'Blend It Longer Than You Think', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },

  /* Breadcrumbs. The fourth thing in this section, and the one that was most
     obviously missing: two recipes in the book call for half a cup of them and
     the storehouse does not carry a box. Somebody making the meatball feast on
     a Sunday finds that out standing at the counter with the beef already out.

     Bread is on the standard order, so this needs nothing at all. */
  {
    id: 272, book: 2, secNum: 9, secName: MADE,
    name: 'Breadcrumbs, Dry or Soft',
    servings: '6 Servings (About 1½ Cups)', servN: 6,
    ing: ['6 bread slices', '½ tsp salt'],
    steps: [
      'Decide which kind first. Soft crumbs go into meatballs and meatloaf, where the job is holding moisture. Dry crumbs go on top of things, where the job is going crisp. The same bread makes either.',
      'Soft: tear fresh bread and pulse it a few seconds at a time in a blender. Stale bread will not do this, it powders. Use them the same day — in a covered jar they go mouldy in three.',
      'Dry: slices straight on the oven rack at 300°F for 15 to 20 minutes, turning once, until they snap rather than bend. Cool them completely before crushing — warm bread tears instead of shattering.',
      'Dry, faster: an air fryer does it in about 6 minutes at 350°F, and does it better — moving air dries the bread through instead of toasting the outside. One layer, and shake the basket once.',
      'Cool them, then put them through a food processor. It is the one thing that gets crumbs even; a blender leaves half powder and half lumps.',
      'Salt and nothing else. Crumbs seasoned in the jar are a decision made weeks early. Dry crumbs keep a month with the lid on, and heels and crusts are the right bread for this.',
    ],
    makes: ['breadcrumbs'],
    macro: null, tagline: 'The Ends of the Loaf, Kept', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: null,
  },

  /* -------------------------------------------------------------------------
   * Five more, chosen by counting.
   *
   * Every ingredient in the collection was ranked by how many recipes want it
   * and whether the storehouse order covers it. These five are the ones the
   * book asks for most often that a cook could make from the order instead —
   * forty-nine recipes between them, and none of them needs anything the
   * standard list does not already carry.
   *
   * They are here for the evening when the tortillas ran out, not as a claim
   * that homemade is better. Two of them are plainly worse than the packet and
   * say so.
   * --------------------------------------------------------------------- */

  /* Seventeen recipes want tortillas — more than any other made-able thing in
     either volume. Three ingredients, all on the order. */
  {
    id: 273, book: 2, secNum: 9, secName: MADE,
    name: 'Flour Tortillas',
    servings: '8 Tortillas', servN: 8,
    ing: ['2 cups flour', '⅓ cup oil', '¾ cup warm water', '1 tsp salt'],
    steps: [
      'Stir the flour and salt, pour in the oil, and rub it through until it looks like damp sand. Oil before water is what keeps them soft; flour that meets water first goes tough.',
      'Add the warm water, bring it together, and knead two minutes until it stops sticking. It should feel like an earlobe — too dry, wet your hands; too sticky, a spoonful of flour.',
      'Cover it and leave it 20 minutes. It is not rising, it is the gluten letting go, and it is the difference between a dough you can roll thin and one that springs back every time.',
      'Divide into 8 balls and roll each as thin as you can, a quarter turn between passes so they stay round. Thin is the whole thing; a thick one is a flatbread.',
      'Dry skillet, medium-high, no oil. About 45 seconds until bubbles rise and the underside freckles, then 30 seconds on the other side. Longer and it is a cracker. Stack them under a towel as they come off — the steam is what softens them.',
    ],
    makes: ['tortilla', 'tortilla_small'],
    macro: null, tagline: 'Rest the Dough or Fight It', score: null, sc: null,
    diff: 'Medium', time: '45 mins', extras: null,
  },

  /* Fourteen recipes call for the box. The box is flour, a raising agent, sugar
     and salt, and this is that in the proportions the box uses. */
  {
    /* Blake: "something stunningly more than basic bagged mix". The jar was
       flour, sugar, baking powder and salt — the bag without the bag. Dry
       milk browns deeper and lets the mix take plain water; a little baking
       soda waits for the sour cream that No. 339 brings, and helps the colour
       even without it. The same four cups, so the yield line stands; the
       wet side is in the method, as it was, and is not costed. */
    id: 274, book: 2, secNum: 9, secName: MADE,
    name: 'Pancake & Waffle Mix',
    servings: '8 Servings (About 4 Cups Dry Mix)', servN: 8,
    ing: ['3 cups flour', '¾ cup dry milk', '3 tbsp sugar', '1½ tbsp baking powder',
      '¾ tsp baking soda', '1½ tsp salt'],
    steps: [
      'Whisk all six together thoroughly — a full minute, not a few turns. Baking powder that is not evenly spread makes some pancakes rise and others sit there, and you will not be able to tell which is which until they are in the pan.',
      'Keep it in a jar with the lid on. Six months is fine; after that the baking powder starts giving up and they come out flat. The dry milk is why it takes water: the milk is already in the jar.',
      'Everyday pancakes: 1 cup of mix, ¾ cup of water, 1 egg, 2 tablespoons of oil or melted butter and half a teaspoon of vanilla. Stir until the dry patches are gone and then stop — batter that has been beaten smooth makes tough pancakes. Lumps are correct.',
      'Let the batter stand five minutes before the first one goes in the pan. Medium heat, and turn each pancake when the bubbles on top stop closing over. One flip only.',
      'For waffles, {r:339} is the Sunday method: sour cream in the batter, the whites whipped and folded in last, browned butter. Same jar.',
    ],
    makes: ['pancake_mix'],
    macro: null, tagline: 'Lumps Are Correct', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },

  /* Seven recipes open a can of it, and it is a white sauce with chicken in it.
     Cheaper, far less salt, and better — this is the one on the list that is
     genuinely an improvement rather than a substitute. */
  {
    id: 275, book: 2, secNum: 9, secName: MADE,
    name: 'Cream of Chicken Soup',
    servings: '6 Servings (About 1½ Cups, One Can’s Worth)', servN: 6,
    ing: ['3 tbsp butter', '3 tbsp flour', '1 cup milk', '½ cup water', '5 oz canned chicken', '½ tsp salt'],
    steps: [
      "Melt the butter over medium heat and whisk in the flour. Let it cook a full minute, bubbling, before anything else happens. Raw flour is what makes a sauce taste like paste, and a minute is all it takes.",
      "Off the heat, add the milk a splash at a time, whisking each one smooth before the next. The first half-cup is the part that decides whether it is lump-free; after that you can pour.",
      "Back on the heat with the water. Stir until it comes to the boil and thickens — it will look thin for a long while and then arrive all at once.",
      "Drain the chicken, break it up small, and stir it in with the salt. Simmer 2 minutes more.",
      "This is one can. Use it anywhere a recipe opens one, straight in, no dilution. It is thicker than the tin when cold and loosens the moment it is heated.",
      "Keeps four days in the fridge; it does not freeze well, as the sauce splits.",
    ],
    makes: ['cream_soup_chx'],
    macro: null, tagline: 'A White Sauce With Chicken In It', score: null, sc: null,
    diff: 'Easy', time: '12 mins', extras: null,
  },

  /* Seven recipes call for the instant. Potatoes are on the order and cost a
     fraction of the box. */
  {
    id: 276, book: 2, secNum: 9, secName: MADE,
    name: 'Mashed Potatoes, in Place of Instant',
    servings: '4 Servings (About 3 Cups)', servN: 4,
    ing: ['2 lbs potatoes', '½ cup milk', '3 tbsp butter', '1 tsp salt'],
    steps: [
      'Peel and cut the potatoes into pieces of roughly the same size — two inches or so. Uneven pieces mean the small ones are falling apart while the big ones are still hard in the middle.',
      'Start them in cold salted water, not boiling. Dropped into boiling water the outsides cook long before the centres, and you get a lumpy mash however hard you work at it afterwards.',
      'Simmer 15 to 20 minutes, until a knife meets no resistance. Drain them and stand them in the hot empty pan a minute — the steam coming off is water that would otherwise end up in the mash. Warm the milk and butter before they go in; cold dairy stiffens it.',
      'Mash, then stop. Potato has a great deal of starch in it and working it hard turns it to glue — this is the one dish where a stand mixer makes things worse. A masher, a fork, or a ricer if you have one.',
      'Where a recipe wants two cups of instant made up, this quantity stands in for it. It is wetter than the instant and holds together less under a topping, so for a shepherd\u2019s pie let it cool a little first.',
    ],
    makes: ['instant_potato', 'mashed_potato'],
    macro: null, tagline: 'Cold Water, Warm Milk', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
  },

  /* Four recipes finish with syrup. It is sugar and water. */
  {
    id: 277, book: 2, secNum: 9, secName: MADE,
    name: 'Pancake Syrup',
    servings: '8 Servings (About 1 Cup)', servN: 8,
    ing: ['1 cup brown sugar', '½ cup water', '2 tbsp butter'],
    steps: [
      "Brown sugar and water into a small pan. Stir it over medium heat only until the sugar has gone — after that, leave it alone. Stirring a boiling sugar syrup is how it turns grainy.",
      "Let it boil 3 minutes without touching it. It will look far too thin. Sugar syrup does almost all of its thickening as it cools, and a syrup that looks right in the pan sets like a toffee in the jug.",
      "Off the heat, stir in the butter until it disappears. That is what makes it taste like syrup rather than like sweet water.",
      "It thickens as it cools and keeps a month in the fridge. Warm it before it goes on anything — cold syrup on a hot pancake is a bad trade.",
      "It is not maple and does not pretend to be. What it is, is the difference between pancakes and no pancakes on a morning when the bottle is empty.",
    ],
    makes: ['syrup'],
    macro: null, tagline: 'Three Minutes and Leave It Alone', score: null, sc: null,
    diff: 'Easy', time: '8 mins', extras: null,
  },
  /* The only thing in this section that replaces nothing on the order list.
     It is on it because two stocked condiments make a third one that people
     drive across town for, and because it takes longer to read than to make. */
  {
    id: 332, book: 2, secNum: 9, secName: MADE,
    name: 'Fry Sauce',
    servings: '10 Servings (About 1⅓ Cups)', servN: 10,
    ing: ['1 cup mayo', '⅓ cup ketchup'],
    steps: [
      'Stir the mayo and ketchup together until the colour is even all through.',
      'Chill it an hour before it goes on the table. Straight from the bowl it tastes like its two halves; an hour later it tastes like one thing.',
      'It keeps as long as the mayo would.',
    ],
    macro: null, tagline: 'Two Things, One Hour', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },

  /* ---------------------------------------------------------------------------
   * Run and Not Be Weary, sections 1 and 2 — written for a hard cut.
   *
   * The volume's Lunch, Dinner and Best Before Bed sections already carry a cut:
   * their medians run 12 to 15 grams of protein per hundred calories, and most
   * of what is in them fits inside a 400 kcal meal. Breakfasts and Snacks do
   * not. Breakfasts sits at 8.3 g per hundred with four of nineteen usable on a
   * deep cut; Snacks is worse, 6.8 and seven of twenty-seven — and those are the
   * two meals a cut is most often lost at, because they are the two you decide
   * in a hurry.
   *
   * These twelve close that. Everything runs on what the storehouse actually
   * stocks: egg whites, cottage cheese, non-fat dry milk, plain gelatin, canned
   * tuna and chicken. Not whey and not Crio Bru, which the pantry data has said
   * for a year that the storehouse does not carry.
   *
   * Plain gelatin does most of the heavy lifting in Snacks. It is 85% protein by
   * weight and carries almost nothing else — the only ingredient on the order
   * list that can put fifteen grams of protein into a hundred calories without
   * bringing fat or sugar along for the ride.
   *
   * Macros are computed from the ingredients like everything else added to these
   * books, and are labelled estimates in the app.
   * ------------------------------------------------------------------------ */

  {
    id: 278, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Egg White & Cottage Cheese Scramble',
    servings: '1 Serving', servN: 1,
    ing: ['1 cup egg whites', '½ cup cottage cheese', '¼ tsp salt', '¼ tsp black pepper'],
    steps: [
      'Warm a non-stick pan over medium-low. Egg whites want lower heat than whole eggs — too hot and they go rubbery before the middle sets.',
      'Pour in the whites. Leave them thirty seconds, then push them slowly from the edge to the middle with a spatula. Slow and few is the whole trick; stirring fast makes them weep.',
      'When they are mostly set but still glossy, take the pan off the heat and fold the cottage cheese through. The residual heat is enough — cook it and it splits.',
      'Salt and pepper at the end. Salting whites early draws the water out and you end up cooking them in it.',
      'On the plate in six minutes, and it holds like a much bigger breakfast.',
    ],
    macro: null, tagline: 'Low Heat, Slow Push', score: null, sc: null,
    diff: 'Easy', time: '6 mins', extras: null,
  },

  {
    id: 279, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Fortified Oat Porridge',
    servings: '1 Serving', servN: 1,
    ing: ['⅓ cup oats', '1 cup water', '½ cup non-fat dry milk', '½ tsp cinnamon', '1 tsp brown sugar'],
    steps: [
      "Toast the oats two minutes in the dry pan over medium heat, until they smell like biscuits. Nutty instead of flat. Then add the water and stir now and then until it thickens, about 5 minutes.",
      "Off the heat, whisk the dry milk in. Off the heat matters: dry milk stirred into a boiling pan goes grainy and will not come back.",
      "Cinnamon and sugar, and let it sit 2 minutes. It thickens again as it stands, which is why it looks thin when you stop cooking it.",
      "Oats on their own are a thin breakfast. The dry milk is what makes this one hold until lunch.",
    ],
    macro: null, tagline: 'Milk Powder Off the Heat', score: null, sc: null,
    diff: 'Easy', time: "10 mins", extras: null,
  },

  {
    id: 280, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Cottage Cheese & Apple Bowl',
    servings: '1 Serving', servN: 1,
    ing: ['1 cup cottage cheese', '½ apple', '½ tsp cinnamon'],
    steps: [
      'Core the apple and chop it small — small enough that a spoonful gets both things at once.',
      'Cottage cheese into a bowl, apple on top, cinnamon over.',
      'If you have two minutes, microwave the chopped apple with the cinnamon first and let it cool a little. Warm apple against cold cheese is a better bowl than either alone.',
      'No cooking and no pan. This is the one for a morning with no morning in it.',
    ],
    macro: null, tagline: 'No Pan, No Heat', score: null, sc: null,
    diff: 'Easy', time: '3 mins', extras: null,
  },

  {
    id: 281, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Ham & Egg White Skillet',
    servings: '1 Serving', servN: 1,
    ing: ['1 cup egg whites', '2 oz diced ham', '½ cup chopped onion', '¼ tsp black pepper'],
    steps: [
      "Onion into a dry non-stick pan over medium heat with a splash of water. Let it soften 5 minutes — the water keeps it from catching without adding a spoon of oil.",
      "Ham in for 1 minute, just to warm it and let the edges colour.",
      "Whites over the top. Leave it alone until the edges set, then push gently from the outside in.",
      "Pepper at the end and no salt: the ham has brought plenty.",
      "The ham is here for flavour rather than for protein — two ounces is enough to make the whole pan taste of it without the fat that four would bring. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.",
    ],
    macro: null, tagline: 'Two Ounces Does the Work', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: null,
  },

  {
    id: 282, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Overnight Oats with Dry Milk',
    servings: '1 Serving', servN: 1,
    ing: ['⅓ cup oats', '½ cup non-fat dry milk', '¾ cup water', '½ tsp cinnamon', '1 tsp brown sugar'],
    steps: [
      'Whisk the dry milk into the water first, in the jar, before anything else goes in. Powder added last sits in lumps at the bottom until morning.',
      'Oats, cinnamon and sugar in. Stir, lid on, fridge.',
      'It is ready at six hours and better at twelve. Give it a stir before you eat it — it separates a little overnight and that is normal.',
      'Made the night before, this is the breakfast you eat on a morning you would otherwise skip. The work was done yesterday.',
    ],
    macro: null, tagline: 'Powder First, or Lumps', score: null, sc: null,
    diff: 'Easy', time: "6 hrs 5 mins", extras: null,
  },

  {
    id: 283, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Tuna & Egg White Breakfast Hash',
    servings: '1 Serving', servN: 1,
    ing: ['1 can tuna', '¾ cup egg whites', '½ cup chopped bell pepper', '¼ tsp black pepper'],
    steps: [
      "Drain the tuna properly. Pressing the lid down until nothing more runs out is worth ten seconds — wet tuna steams instead of frying and the pan goes grey.",
      "Peppers into a dry non-stick pan over medium-high with a splash of water, 4 minutes, until they take a little colour.",
      "Tuna in, broken up with the spatula, 1 minute.",
      "Whites over, and from here it is the scramble: leave it, push it slowly, stop while it still looks slightly wet.",
      "It reads oddly at seven in the morning and eats like an ordinary hash. A spoon of salsa on top, or a tablespoon of cheddar in the last minute: acid, salt and a crust, and neither changes the day much.",
    ],
    macro: null, tagline: 'Drain It Properly', score: null, sc: null,
    diff: 'Easy', time: '9 mins', extras: null,
  },

  {
    id: 284, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Vanilla Milk Gelatin Cups',
    servings: '2 Cups', servN: 2,
    ing: ['2 packets gelatin', '½ cup cold water', '2 cups milk', '1 cup non-fat dry milk', '2 tbsp sugar', '1 tsp vanilla'],
    steps: [
      'Sprinkle the gelatin over the cold water in a bowl and leave it 5 minutes. It swells and goes wrinkled. This step cannot be skipped or hurried with heat — gelatin dropped straight into hot liquid seizes into strings.',
      'Warm the milk in a pan with the dry milk and sugar whisked in. Warm, not boiling: boiling weakens gelatin and it will not set properly.',
      'Pour the hot milk over the bloomed gelatin and stir until it is completely clear. Hold it to the light. Any grain still there now will still be there tomorrow. Vanilla in last, off the heat, so none of it cooks away.',
      'Into two cups, cool on the counter, then fridge 4 hours.',
      'The gelatin is here to set it, not to feed you \u2014 a packet is seven grams and most of the protein is coming from the dry milk. This is the answer to nine at night.',
    ],
    macro: null, tagline: 'Bloom It Cold, Melt It Warm', score: null, sc: null,
    diff: 'Easy', time: "4 hrs 15 mins", extras: null,
  },

  {
    id: 285, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Whipped Cottage Cheese with Cinnamon',
    servings: '1 Serving', servN: 1,
    ing: ['1 cup cottage cheese', '1 tsp sugar', '½ tsp cinnamon'],
    steps: [
      'Cottage cheese into a bowl and beat it hard with a fork for a full minute. It goes from curds to something close to a thick cream, and it is a different food afterwards.',
      'Sugar and cinnamon, beaten in.',
      'A blender does it in ten seconds and smoother, if one is out.',
      'The whipping is what makes it feel like a dessert rather than a bowl of curds. Same ingredients, different food.',
    ],
    macro: null, tagline: 'A Minute with a Fork', score: null, sc: null,
    diff: 'Easy', time: '3 mins', extras: null,
  },

  {
    id: 286, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Tuna & Cucumber Rounds',
    servings: '1 Serving', servN: 1,
    ing: ['1 can tuna', '1 cucumber', '1 tbsp mayo', '¼ tsp black pepper'],
    steps: [
      'Slice the cucumber into rounds about a finger thick. Thinner and they bend under the tuna.',
      'Drain the tuna hard, then mix it with the mayo and the pepper.',
      'A spoonful on each round.',
      'One tablespoon of mayo across a whole can is enough to bind it. Two is where a lean snack quietly becomes a fatty one.',
    ],
    macro: null, tagline: 'One Spoon of Mayo, Not Two', score: null, sc: null,
    diff: 'Easy', time: '5 mins', extras: null,
  },

  {
    id: 287, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Canned Chicken Lettuce Cups',
    servings: '1 Serving', servN: 1,
    ing: [
      "5 oz canned chicken",
      "1 cup lettuce leaves (4 large leaves)",
      "1 tbsp mustard",
      "¼ tsp black pepper",
    ],
    steps: [
      'Drain the chicken and break it up with a fork.',
      'Mustard and pepper through it. Mustard binds nearly as well as mayo.',
      'Spoon into the lettuce leaves.',
      'Lean enough to eat twice in a day and still feel like a meal both times.',
    ],
    macro: null, tagline: 'Mustard Instead of Mayo', score: null, sc: null,
    diff: 'Easy', time: '4 mins', extras: null,
  },

  {
    id: 288, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Cinnamon Milk Gelatin Whip',
    servings: '2 Servings', servN: 2,
    ing: ['2 packets gelatin', '½ cup cold water', '1½ cups milk', '1 cup non-fat dry milk', '2 tbsp sugar', '1 tsp cinnamon'],
    steps: [
      'Bloom the gelatin in the cold water, 5 minutes, as always.',
      'Warm the milk with the dry milk, sugar and cinnamon whisked through, and pour it over the gelatin. Stir until clear.',
      'Fridge until it is just starting to set — thickened but still loose, about 90 minutes. Setting it hard first is the mistake; you cannot whip a set jelly.',
      'Beat it hard for 2 minutes. It doubles and goes pale, like a mousse.',
      'Back in the fridge 2 hours. It holds the air it took.',
      'Same as the cups, twice the volume.',
    ],
    macro: null, tagline: 'Whip It Half-Set', score: null, sc: null,
    diff: 'Medium', time: "3 hrs 50 mins", extras: null,
  },

  {
    id: 289, book: 1, secNum: 2, secName: 'Snacks',
    name: 'Savoury Cottage Cheese & Cucumber',
    servings: '1 Serving', servN: 1,
    ing: ['1 cup cottage cheese', '1 cucumber', '¼ tsp salt', '¼ tsp black pepper'],
    steps: [
      'Dice the cucumber small and salt it lightly. Leave it 5 minutes in a sieve and it gives up water that would otherwise thin the bowl.',
      'Stir it through the cottage cheese with the pepper.',
      'Unlike everything else in this section it is savoury, which matters more than it should on the fourth day of a cut, when everything sweet has started to taste the same.',
    ],
    macro: null, tagline: 'Salt the Cucumber First', score: null, sc: null,
    diff: 'Easy', time: '7 mins', extras: null,
  },

  /* -------------------------------------------------------------------------
   * 290-301, written for the hard cut.
   *
   * A drafted hard-cut day was coming in over the sodium ceiling nine times
   * in ten, and the reason was not the pantry. Thirty-two dishes in the book
   * are dense enough for a hard cut — thirteen grams of protein per hundred
   * calories, which is what a day at that target demands of every plate on it
   * — and only ten of those thirty-two sit under the salt line. Eight of the
   * ten are cocoa mugs and whey drinks. So at breakfast and at lunch the
   * chooser had almost nothing to take, and took the salted thing.
   *
   * These twelve are the missing ones. Nine are built on fresh chicken
   * breast, stewing beef, pork roast or a roast you cooked yourself, which
   * are the cleanest protein in the building: chicken breast carries
   * thirty-eight milligrams of sodium per hundred calories where canned
   * chicken carries three hundred and eight and the deli counter six hundred
   * and ninety-two.
   *
   * Egg whites are a partner here, never the base. They read as the obvious
   * cut food and they are dense, but they are so nearly calorie-free that
   * their own natural sodium — nothing added, it is simply in the albumen —
   * works out at three hundred and nineteen milligrams per hundred calories,
   * which is twice what a hard cut can spend. Whites next to chicken are
   * fine. Whites carrying a whole breakfast are not.
   *
   * Not one of the twelve calls for salt. That is the other half of it: a
   * quarter teaspoon is more sodium than a cup of egg whites and half a cup
   * of cottage cheese together, and it was going into dishes whose whole
   * argument was that they were clean. Flavour here comes from the spice
   * shelf, from onion and pepper cooked down, and from acid.
   * ---------------------------------------------------------------------- */

  {
    id: 290, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Chicken & Pepper Breakfast Skillet',
    servings: '2 Servings', servN: 2,
    ing: ['12 oz chicken breasts', '1 cup egg whites', '2 bell peppers', '1 onion',
      '1 tsp paprika', '1 tsp garlic powder', '½ tsp black pepper'],
    steps: [
      "Cut the chicken into small pieces — smaller than you think, because they have to cook through before the peppers give up their bite. Pat it dry and lay it in a hot non-stick pan over medium-high heat, and do not move it until the underside is brown. Wet chicken steams; dry chicken browns.",
      "In with the sliced peppers and onion and the paprika, garlic powder and pepper. Cook until the onion goes soft and sweet and the chicken is cooked through, 6 to 8 minutes; cut a piece to check there is no pink at the centre (165°F).",
      "Push it all to one side, pour the egg whites into the space, and cook 2 to 3 minutes on medium-low until set before folding the two together.",
      "A savoury breakfast off a dry pan.",
    ],
    macro: null, tagline: 'A Dry Pan and a Hot One', score: null, sc: null,
    diff: 'Easy', time: "20 mins", extras: null,
  },

  {
    id: 291, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Shredded Beef & Onion Morning Hash',
    servings: '2 Servings', servN: 2,
    ing: [
      "10 oz stewing beef",
      "2 onions",
      "1 bell pepper",
      "1 cup egg whites",
      "1 tsp paprika",
      "1 tsp ground cumin",
      "½ tsp black pepper",
      "1 cup water",
    ],
    steps: [
      "Brown the beef in a heavy pan, add the water, then cover it and leave it on the lowest heat about 2 hours, until it pulls apart under a fork. Top it up with a splash of water if the pan runs dry. This is the slow part and there is no way around it.",
      "Shred it in the pan with two forks and let the liquid cook away.",
      "Add the sliced onion and pepper with the paprika, cumin and black pepper, and cook over medium heat 8 to 10 minutes, adding a splash of water if the pan sticks, until the onion goes past soft into sweet.",
      "Pour the egg whites over and stir them through on low heat until they are set and opaque throughout, 1 to 2 minutes.",
      "Worth doing on a Sunday for the week — it reheats better than it cooks, which is unusual.",
    ],
    macro: null, tagline: 'Past Soft, Into Sweet', score: null, sc: null,
    diff: 'Medium', time: "2 hrs 30 mins", extras: null,
  },

  {
    id: 292, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Chicken Breast & Tomato Breakfast Bowl',
    servings: '1 Serving', servN: 1,
    ing: ['6 oz chicken breasts', '2 tomatoes', '½ cup egg whites', '1 tsp dried oregano',
      '½ tsp black pepper', '1 tsp garlic powder'],
    steps: [
      "Poach the chicken in barely-moving water 12 to 15 minutes, until it reads 165°F at the thickest part, then let it rest 5 minutes before you slice it. Boiling it hard is what makes poached chicken taste like nothing.",
      "Quarter the tomatoes and cook them in a dry pan over medium heat 5 to 7 minutes until they collapse and their liquid thickens, then spoon them into the bowl.",
      "Scramble the egg whites soft in the same pan over medium-low heat, 2 to 3 minutes.",
      "Top the tomatoes with the whites, then the sliced chicken, and the oregano, garlic powder and pepper over the top.",
      "The tomato is doing the work of a sauce without being one.",
    ],
    macro: null, tagline: 'Barely-Moving Water', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: null,
  },

  {
    id: 293, book: 1, secNum: 1, secName: 'Breakfasts',
    name: "Pork Roast & Onion Hash",
    servings: '3 Servings', servN: 3,
    ing: [
      "1 lb pork roast",
      "3 onions",
      "2 bell peppers",
      "1 tsp paprika",
      "1 tsp dried thyme",
      "½ tsp black pepper",
      "½ cup water",
    ],
    steps: [
      "Heat the oven to 300°F. Put the pork roast in a covered oven-safe pot with the water and bake about 2½ hours, until a fork twists in it without resistance. Pull it apart and drain off what has rendered out.",
      "Slice the onions thin and cook them slowly in a dry non-stick pan over medium-low heat 15 to 20 minutes, adding a splash of water if they catch, until they are properly browned. This takes longer than it seems it should.",
      "Add the sliced peppers, the thyme, paprika and black pepper, then the pulled pork, and press it all flat to crisp underneath for 4 to 5 minutes.",
      "Leave it undisturbed to catch, then turn it in sections.",
      "A shoulder is a fatty cut, so the draining step is not optional here the way it is elsewhere.",
    ],
    macro: null, tagline: 'Drain It, Then Crisp It', score: null, sc: null,
    diff: 'Medium', time: '3 hrs', extras: null,
  },

  {
    id: 294, book: 1, secNum: 1, secName: 'Breakfasts',
    name: 'Poached Chicken & Broccoli Breakfast Plate',
    servings: '1 Serving', servN: 1,
    ing: [
      "6 oz chicken breasts",
      "2 cups broccoli",
      "½ cup egg whites",
      "1 tsp garlic powder",
      "½ tsp black pepper",
      "¼ tsp salt",
    ],
    steps: [
      "Salt the chicken fifteen minutes ahead and pound the thick end level. Poach it gently 12 to 15 minutes, until it reads 165°F at the thickest part, let it rest five minutes, then slice it against the grain. Dry chicken is a method problem, not a chicken problem.",
      "Steam the broccoli 3 to 4 minutes until it is bright and still has some resistance. Overcooked broccoli is the reason people say they do not like broccoli.",
      "Pour the egg whites into a dry non-stick pan over medium-low heat and let them set 2 minutes without stirring, then roll and cut into ribbons.",
      "Plate the three together with the garlic powder and pepper.",
    ],
    macro: null, tagline: 'Bright, With Resistance', score: null, sc: null,
    diff: 'Easy', time: "35 mins", extras: null,
    lift: {
      with: "A lemon",
      steps: [
        "The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.",
      ],
    },
  },

  {
    id: 295, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Cold Chicken & Cucumber Plate',
    servings: '1 Serving', servN: 1,
    ing: ['6 oz chicken breasts', '1 cucumber', '1 tomato', '1 tsp dried oregano',
      '½ tsp black pepper'],
    steps: [
      "Poach the chicken 12 to 15 minutes, until it reads 165°F at the thickest part, then cool it fully and slice it thin. Cooling it before slicing is what keeps it from shredding.",
      "Slice the cucumber and tomato and lay them out with the chicken over the top.",
      "Oregano and pepper across the whole plate.",
      "Built to be made the night before and eaten cold, which is what a work lunch actually has to survive.",
    ],
    macro: null, tagline: 'Cool It Before You Slice It', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: null,
  },

  {
    id: 296, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Sliced Roast Beef & Tomato Stack',
    servings: '1 Serving', servN: 1,
    ing: ['5 oz sliced roast beef', '2 tomatoes', '1 cup lettuce', '1 onion',
      '½ tsp black pepper'],
    steps: [
      'Slice your own roast thin rather than buying it sliced.',
      'Thick tomato rounds as the base, then the beef, then thin raw onion.',
      'Lettuce over the top and pepper across it.',
      'Stack it in a container rather than a roll and it survives until noon without going soft.',
    ],
    macro: null, tagline: 'Slice Your Own', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: null,
  },

  {
    id: 297, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Chicken & Broccoli Cold Bowl',
    servings: '1 Serving', servN: 1,
    ing: ['6 oz chicken breasts', '2 cups broccoli', '1 onion',
      '1 tsp garlic powder', '½ tsp black pepper'],
    steps: [
      "Poach the chicken 12 to 15 minutes, until it reads 165°F at the thickest part, then cool it and pull it into pieces rather than cutting it. Pulled chicken holds seasoning where sliced chicken sheds it.",
      "Steam the broccoli 3 to 4 minutes until bright and drop it straight into cold water, which stops it cooking and keeps it from going grey in the fridge.",
      "Toss everything with the raw onion, garlic powder and pepper.",
      "Fresh broccoli rather than a tin: the canned vegetable carries most of the salt in a bowl that is otherwise almost none.",
    ],
    macro: null, tagline: 'Cold Water Stops It', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: null,
    lift: {
      with: "A lemon",
      steps: [
        "The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.",
      ],
    },
  },

  {
    id: 298, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Shredded Beef & Carrot Slaw Bowl',
    servings: '2 Servings', servN: 2,
    ing: [
      "10 oz stewing beef",
      "4 carrots",
      "1 onion",
      "1 tsp ground cumin",
      "1 tsp paprika",
      "½ tsp black pepper",
      "1 cup water",
    ],
    steps: [
      "Brown the beef in a heavy pot, add the water, cover, and keep it on the lowest heat about 2 hours, until it shreds under a fork. Pull it and let it cool in whatever liquid is left. Cooling it in its own liquid is what keeps it from going dry.",
      "Grate the carrots coarse and slice the onion as thin as you can.",
      "Toss the cold beef through the raw vegetables with the cumin, paprika and pepper.",
      "The carrot is here for the crunch and the fibre, both of which a cut runs short on.",
    ],
    macro: null, tagline: 'Cool It In Its Own Liquid', score: null, sc: null,
    diff: 'Medium', time: "2 hrs 30 mins", extras: null,
  },

  {
    id: 299, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Chicken, Pepper & Onion Lunch Box',
    servings: '2 Servings', servN: 2,
    ing: ['12 oz chicken breasts', '2 bell peppers', '2 onions', '1 tsp paprika',
      '1 tsp dried oregano', '½ tsp black pepper'],
    steps: [
      "Roast the chicken whole rather than in pieces, at 400°F for 20 to 25 minutes, until it reads 165°F at the thickest part, and slice it after it rests. Pieces dry out at the edges; a whole breast does not.",
      "Cut the peppers into strips and the onions into wedges, and roast them on the same tray around the chicken until the edges take colour.",
      "Slice the chicken and pack everything in layers with the paprika, oregano and pepper.",
      "Two lunches from one tray, and it is as good cold as warm.",
    ],
    macro: null, tagline: 'Roast It Whole, Slice It After', score: null, sc: null,
    diff: 'Easy', time: '40 mins', extras: null,
  },

  {
    id: 300, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Braised Stewing Beef with Carrots & Onions',
    servings: '4 Servings', servN: 4,
    ing: ['2 lbs stewing beef, trimmed', '6 carrots', '3 onions', '1 tsp dried thyme',
      '1 tsp black pepper', '2 cups water'],
    steps: [
      "Trim the beef first: the white cap and every seam of fat a knife can get into. Stewing beef is cut from the chuck, which is a fatty piece, and what comes off now is fat that never has to be skimmed later.",
      "Brown the beef hard in a dry heavy pot, in batches. Crowding the pot steams the meat and you lose the colour that the whole dish is built on.",
      "Onions in next, cooked down in what the beef left behind.",
      "Back in with the beef, the water, the thyme and the pepper. Lid on, lowest heat, about 2½ hours, until it gives under a fork.",
      "Add the carrots in large pieces for the last 40 minutes so they hold their shape.",
      "Skim what has risen to the top, then season at the table rather than in the pot. A braise concentrates as it reduces, so salt added early ends up doubled.",
    ],
    macro: null, tagline: 'Season at the Table', score: null, sc: null,
    diff: 'Medium', time: '3 hrs', extras: null,
    lift: {
      with: "A head of garlic, A bottle of vinegar",
      steps: [
        "Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.",
        "A teaspoon of vinegar stirred in at the end, off the heat. It does not taste of vinegar; it tastes like the pot woke up.",
      ],
    },
  },

  {
    id: 301, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Roast Pork with Peppers & Onions',
    servings: '4 Servings', servN: 4,
    ing: ['2 lbs pork roast, trimmed', '4 bell peppers', '3 onions', '1 tsp paprika',
      '1 tsp ground cumin', '1 tsp black pepper'],
    steps: [
      "Trim the cap off the shoulder — the thick white layer on the outside. The fat that runs through the meat is out of reach of a knife, and that is what the draining at the end is for.",
      "Rub the roast with the paprika, cumin and pepper and leave it uncovered in the fridge for a few hours. A dry surface is what lets it brown instead of steam.",
      "Roast it at 450°F for 20 minutes, then drop the heat to 325°F and take it slowly the rest of the way, about 2½ hours, until a fork twists in it without resistance.",
      "Peppers and onions onto the tray for the last stretch, where they cook in the drippings.",
      "Rest it, then pull or slice it, and drain what has rendered before it goes on the plate.",
      "Shoulder carries its fat inside the meat, so what you drain off is real and worth draining.",
    ],
    macro: null, tagline: 'Dry Surface, Hot Start', score: null, sc: null,
    diff: 'Medium', time: "6 hrs", extras: null,
  },

  /* 302-307, all lunches, all clean.
   *
     Adding the first twelve fixed the salt on a drafted week and then a
     week-aware chooser undid it: once Fill stopped serving the same three
     clean plates over and over, it had to reach, and what it reached for was
     the salted end of lunch. Six clean dishes out of sixteen is not a pool, it
     is a rotation with nowhere to go — and six of the ten saltiest plates in
     the book are lunches, because lunch is the meal that has to travel and
     the things that travel are cured, canned or dressed.
   *
     These six travel without any of that. Rice earns its place here rather
     than at breakfast: cooked rice carries about one milligram of sodium per
     hundred grams, so it buys back the carbohydrate a cut spends on protein
     without spending any of the salt. */

  {
    id: 302, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Chicken & Rice Lunch Jar',
    servings: '2 Servings', servN: 2,
    ing: [
      "12 oz chicken breasts",
      "1 cup rice",
      "2 bell peppers",
      "1 onion",
      "1 tsp paprika",
      "½ tsp black pepper",
      "2 cups water",
      "1 tsp oil",
    ],
    steps: [
      "Stir the rice a minute in the oil, add the water, cover and simmer 18 minutes, then spread it out to cool. Toasted first, the rice tastes of something instead of nothing. Rice packed warm sweats and goes claggy by morning.",
      "Poach the chicken 12 to 15 minutes, or roast it at 400°F for 20 to 25, until it reads 165°F at the thickest part; cool it and pull it into pieces.",
      "Slice the peppers and onion and cook them with the paprika and black pepper in a non-stick pan over medium heat 6 to 8 minutes, adding a splash of water if they catch, until they soften and take a little colour.",
      "Layer it cold in a jar with the rice at the bottom, then the vegetables, then the chicken on top so it does not steam the rest.",
      "Rice at the bottom, protein at the top: the layer that would go soggy is the one furthest from the lid.",
    ],
    macro: null, tagline: 'Spread It Out to Cool', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
  },

  {
    id: 303, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Cold Roast Beef & Pepper Plate',
    servings: '1 Serving', servN: 1,
    ing: ['5 oz sliced roast beef', '2 bell peppers', '1 tomato', '1 onion',
      '½ tsp black pepper'],
    steps: [
      'Slice the cold roast thin, across the grain.',
      'Cut the peppers into wide strips and the tomato into thick rounds.',
      'Lay it all out flat rather than piling it, with the raw onion scattered over and pepper across the top.',
      'Beef you roasted and sliced yourself, which is the same meat as the deli packet at a fraction of the salt.',
    ],
    macro: null, tagline: 'Across the Grain, Cold', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: null,
  },

  {
    id: 304, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Chicken, Apple & Carrot Slaw',
    servings: '2 Servings', servN: 2,
    ing: [
      "12 oz chicken breasts",
      "2 apples",
      "4 carrots",
      "1 onion",
      "1 tsp cinnamon",
      "½ tsp black pepper",
      "½ tsp salt",
    ],
    steps: [
      "Salt the chicken fifteen minutes ahead. Poach it 12 to 15 minutes, until it reads 165°F at the thickest part, then cool it fully and pull it apart.",
      "Grate the carrots and cut the apple into matchsticks — matchsticks rather than cubes, so the apple reads as part of the slaw instead of a fruit sitting in it.",
      "Toss everything with the thin-sliced onion, the cinnamon and the pepper.",
      "Apple goes brown but it does not go bad; made the night before it is fine by noon, just less pretty.",
    ],
    macro: null, tagline: 'Matchsticks, Not Cubes', score: null, sc: null,
    diff: 'Easy', time: "35 mins", extras: null,
  },

  {
    id: 305, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Egg, Potato & Onion Lunch Salad',
    servings: '2 Servings', servN: 2,
    ing: ['6 eggs', '4 potatoes', '1 onion', '1 bell pepper', '½ tsp black pepper'],
    steps: [
      "Cover the whole, unpeeled potatoes with cold water, bring to a boil, and simmer 20 to 25 minutes until a knife slides into the middle with no resistance. Drain and cool before cutting — cut hot, they take on water and fall apart.",
      "Meanwhile, hard-boil the eggs in boiling water for 10 minutes, then cool them under cold running water and peel them.",
      "Cube the potato, quarter the eggs, and fold them through the diced raw onion, diced bell pepper, and black pepper.",
      "No dressing. The potato holds enough moisture to carry the seasoning on its own. A spoon of salsa on top adds the acid and salt.",
    ],
    macro: null, tagline: 'Whole, In Their Skins', score: null, sc: null,
    diff: 'Easy', time: "45 mins", extras: null,
  },

  {
    id: 306, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Chicken & Tomato Rice Bowl',
    servings: '2 Servings', servN: 2,
    ing: [
      "12 oz chicken breasts",
      "1 cup rice",
      "3 tomatoes",
      "1 onion",
      "1 tsp dried oregano",
      "½ tsp black pepper",
      "2 cups water",
      "1 tsp oil",
      "½ tsp salt",
    ],
    steps: [
      "Stir the rice a minute in the oil, add the water, cover and simmer 18 minutes, then spread it out to cool. Toasted first, the rice tastes of something instead of nothing.",
      "Salt the chicken fifteen minutes ahead and pound the thick end level. Roast it at 400°F for 20 to 25 minutes, until it reads 165°F at the thickest part, let it rest five minutes, then slice it. Dry chicken is a method problem, not a chicken problem.",
      "Cook the chopped tomatoes down hard with the sliced onion in a skillet over medium-high heat for 8 to 10 minutes until they thicken into something closer to a sauce than a salad.",
      "Spoon the tomato over the rice, the chicken over that, and the oregano and pepper on top.",
      "Eaten cold or warmed, and better warmed if you have the option.",
    ],
    macro: null, tagline: 'Cook the Tomato Down Hard', score: null, sc: null,
    diff: 'Easy', time: '35 mins', extras: null,
    lift: {
      with: "A head of garlic, Soy sauce",
      steps: [
        "Two cloves of garlic, chopped, into the pan for the last thirty seconds before the liquid goes in — any longer and it burns bitter.",
        "A tablespoon of soy sauce in the pan at the end, where it hisses and clings.",
      ],
    },
  },

  {
    id: 307, book: 1, secNum: 3, secName: 'Lunch',
    name: 'Cold Pork & Broccoli Plate',
    servings: '2 Servings', servN: 2,
    ing: ['12 oz pork roast', '3 cups broccoli', '1 onion', '1 tomato',
      '1 tsp paprika', '½ tsp black pepper'],
    steps: [
      "Use pork left from a roast, pulled and drained of what rendered out.",
      "Steam the broccoli 3 to 4 minutes until bright and drop it straight into cold water so it stays green in the fridge.",
      "Plate the pork and broccoli cold with raw onion and tomato, paprika and pepper over the top.",
      "A second lunch out of Sunday, which is most of what a roast is for.",
    ],
    macro: null, tagline: 'A Second Lunch Out of Sunday', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: null,
  },

  /* -------------------------------------------------------------------------
   * 308-316, dinners for the hard cut.
   *
   * A day at that target is about 1470 calories, 182 grams of protein and
   * 47 of carbohydrate, and Fill hands dinner about a third of it: 515
   * calories, 64 grams of protein, 16 of carbohydrate. Two dinners existed
   * that were clean enough to draft, and both were half a pound of pot roast
   * a plate. Half a pound of chuck or shoulder is forty grams of protein at
   * thirty-five to forty of fat — a storehouse hands out the fatty cuts, and
   * these are them — so the chooser was picking between two plates that each
   * missed the share by twenty-five grams of protein one way and twenty of
   * fat the other, and took whichever it was less wrong on. Across a drafted
   * hard-cut fortnight the dinner slot came in at a median of 340 calories
   * and 25 grams of protein against that 515 and 64.
   *
   * These nine are the missing ones. Seven are chicken breast at ten ounces
   * raw a plate, which is what reaching the share actually takes; the
   * vegetables beside it are for fibre and for having something on the fork,
   * and they are held to a cup or two each because on a hard cut the whole
   * carbohydrate budget is spent on vegetables and there is nothing left over
   * for anything else. The two braises keep the roasts in the rotation, with
   * "trimmed" written on the ingredient line — that word is how the parser
   * is told the cap came off (parse-lib), and a step that says "trim it"
   * counts for nothing on its own.
   *
   * Nothing here calls for salt, for the same reason as 290-301. Flavour is
   * the spice shelf, lime, onion and pepper cooked down, and what a hot dry
   * pan does to chicken.
   * ---------------------------------------------------------------------- */

  {
    id: 308, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Sheet-Pan Chicken with Broccoli & Peppers',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '½ lb broccoli', '2 bell peppers', '1 tbsp oil',
      '1 tsp paprika', '1 tsp garlic powder', '½ tsp black pepper'],
    steps: [
      "Cut the broccoli into small florets and the peppers into wide strips, and toss them on the tray with the oil, the paprika and the garlic powder.",
      "Lay the chicken breasts on top, pepper over everything, and into a 425°F oven — hot, so the vegetables char at the edges before the chicken dries out.",
      "Take the chicken off after 18 to 22 minutes, as soon as it reads 165°F at the thickest part, and rest it while the vegetables have another few minutes to catch.",
      "Slice the chicken across the grain and pile it back on the tray to serve.",
      "One tablespoon of oil for the whole tray, and all of it on the vegetables. Chicken breast browns on its own; broccoli does not.",
    ],
    macro: null, tagline: 'Hot, So It Chars', score: null, sc: null,
    diff: 'Easy', time: '35 mins', extras: null,
    lift: {
      with: "A lemon",
      steps: [
        "The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.",
      ],
    },
  },

  {
    id: 309, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Chicken with Green Beans in Tomato & Onion',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '1 can green beans', '3 tomatoes', '1 onion',
      '1 tsp dried oregano', '1 tsp dried basil', '½ tsp black pepper'],
    steps: [
      "Pound the thick end of the chicken level. Brown it hard on both sides in a dry non-stick pan over medium-high heat, 2 to 3 minutes a side, and set it aside; it finishes in the sauce. Even thickness is what stops the thin end drying out while the thick end catches up.",
      "Cook the sliced onion in the same pan over medium heat 5 minutes until it softens, then add the tomatoes in quarters and cook them down 6 to 8 minutes until they collapse into something you would call a sauce.",
      "Drain and rinse the green beans — rinsing takes a fair part of the tin’s salt down the sink with it — and stir them in with the oregano and basil.",
      "Chicken back in, lid on, low for 10 to 15 minutes, until it reads 165°F at the thickest part, then the pepper.",
      "Fresh tomatoes make the sauce and the tin only supplies the beans, which is the way round that keeps the salt where a cut can afford it.",
    ],
    macro: null, tagline: 'The Tin Only Supplies the Beans', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
    lift: {
      with: "A head of garlic, A lemon",
      steps: [
        "Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.",
        "The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.",
      ],
    },
  },

  {
    id: 310, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Lime & Cumin Chicken with Cucumber & Tomato',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '1 lime', '1 tsp ground cumin', '1 tsp chili powder',
      '1 cucumber', '2 tomatoes', '½ onion', '2 tbsp cilantro'],
    steps: [
      "Butterfly the chicken breasts so they are an even thickness, and rub them with the cumin, the chili powder and the zest of the lime.",
      "Cook them in a dry pan hot enough that they colour in the first minute, then turn once and finish, 4 to 5 minutes a side, until they read 165°F at the thickest part.",
      "While they rest, dice the cucumber and tomatoes, slice the onion paper-thin and toss it all with the juice of the lime and the cilantro.",
      "Slice the chicken and serve it over the salad, so the juices run into it.",
      "The lime is doing what salt would do. Acid makes food taste seasoned.",
    ],
    macro: null, tagline: 'Acid Where Salt Would Be', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: "Lime, Cilantro",
  },

  {
    id: 311, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Braised Beef with Peppers & Tomatoes',
    servings: '4 Servings', servN: 4,
    ing: ['2 lbs stewing beef, trimmed', '3 bell peppers', '2 onions', '4 tomatoes',
      '1 tsp ground cumin', '1 tsp chili powder', '1 tsp black pepper', '1 cup water'],
    steps: [
      "Trim the beef of every seam of fat a knife can get into before it goes near the pot. Stewing beef is chuck, and chuck is a fatty cut; what you cut off now is fat that never has to be skimmed later.",
      "Brown it hard in batches in a dry heavy pot, and do not crowd it.",
      "Onions in, cooked in what the beef left behind, then the cumin and chili powder for a minute, then the tomatoes in quarters and the water.",
      "Beef back in, lid on, lowest heat, about 2½ hours, until it gives under a fork. The peppers in wide strips for the last half hour.",
      "Skim the top before it goes out, and pepper it at the table. Cooled overnight the fat lifts off in one piece, which is the easiest skimming there is.",
    ],
    macro: null, tagline: 'Lifts Off in One Piece', score: null, sc: null,
    diff: 'Medium', time: '3 hrs', extras: null,
    lift: {
      with: "A head of garlic, Soy sauce",
      steps: [
        "Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.",
        "A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.",
      ],
    },
  },

  {
    id: 312, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Chicken & Broccoli with Ginger & Garlic',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '¾ lb broccoli', '1 bell pepper', '1 tbsp oil',
      '1 tsp ground ginger', '1 tsp garlic powder', '½ tsp black pepper', '¼ cup water'],
    steps: [
      "Slice the chicken thin across the grain, pat it dry, and toss it with the ginger, the garlic powder and the pepper.",
      "Get the oil smoking in the widest pan you have over high heat and cook the chicken in two batches, 2 minutes on the first side without moving it until brown, then turn and cook 1 to 2 minutes more until cooked through (165°F, no longer pink). Set aside. Wet chicken steams; dry chicken browns.",
      "Broccoli in small florets and the pepper in strips go in next with the water, lid on for 2 minutes to steam them, then lid off for 1 minute to drive the water away.",
      "Chicken back in, tossed through 1 minute until hot and cooked through (165°F, no longer pink at the centre).",
      "A stir-fry with no soy sauce, because a tablespoon of it is close to half a day’s salt on a cut. Ginger and garlic carry the dish on their own.",
    ],
    macro: null, tagline: 'No Soy Sauce', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: null,
    lift: {
      with: "A lemon",
      steps: [
        "The juice of half a lemon over the chicken and the greens at the table. It is the thing the plate was missing.",
      ],
    },
  },

  {
    id: 313, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Chicken Chili Without the Beans',
    servings: '4 Servings', servN: 4,
    ing: ['2 lbs chicken breasts', '2 cups diced tomatoes', '2 bell peppers', '2 onions',
      '1 tbsp chili powder', '1 tsp ground cumin', '1 tsp dried oregano', '1 tsp black pepper'],
    steps: [
      "Dice the chicken small, every piece to one size so they cook through together, and brown it in a dry non-stick pot over medium-high in batches, 4 to 5 minutes, then set it aside.",
      "Cook the diced onions and peppers over medium heat 5 to 6 minutes until they soften, then stir in the chili powder, cumin and oregano for 1 minute in the dry pot so they toast.",
      "The diced tomatoes with their juice — half of the big tin; the rest keeps — and the chicken back in. Simmer uncovered 15 to 20 minutes, until it thickens and the chicken is cooked through with no pink at the centre (165°F).",
      "Pepper at the end, and taste it before you reach for anything else.",
    ],
    macro: null, tagline: 'Half of the Big Tin', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
    lift: {
      with: "A head of garlic",
      steps: [
        "Two cloves of garlic, chopped fine, in after the onion and before the liquid. Thirty seconds is enough; it only needs to smell.",
      ],
    },
  },

  {
    id: 314, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Baked Chicken with Carrots & Onion',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '4 carrots', '1 onion', '1 tbsp oil',
      '1 tsp dried thyme', '1 tsp mustard powder', '½ tsp black pepper'],
    steps: [
      "Cut the carrots into thick batons and the onion into wedges, and toss them with the oil and the thyme in an 8-inch square baking dish.",
      "Rub the chicken with the mustard powder and the pepper and lay it on top.",
      "Bake covered at 375°F for 25 minutes, until the carrots are nearly tender, then uncovered another 15 to 20, until the chicken reads 165°F at the thickest part and the onion has caught at the edges.",
      "Rest it a few minutes before slicing; the carrots will not mind waiting.",
      "Mustard powder rather than mustard, because the powder is the one part of a mustard that is not salt.",
    ],
    macro: null, tagline: 'Covered, Then Uncovered', score: null, sc: null,
    diff: 'Easy', time: '45 mins', extras: null,
  },

  {
    id: 315, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Ginger Chicken Lettuce Wraps',
    servings: '2 Servings', servN: 2,
    ing: ['1¼ lbs chicken breasts', '½ head lettuce', '1 bell pepper', '1 onion',
      '1 tsp ground ginger', '1 tsp garlic powder', '1 lime', '½ tsp black pepper'],
    steps: [
      "Chop the chicken fine — nearly minced — and cook it in a hot dry pan with the ginger and the garlic powder 6 to 8 minutes, until it has colour and no pink remains.",
      "Dice the bell pepper and onion small and cook them through with the chicken until the onion is soft, then the black pepper and the juice of the lime.",
      "Separate the lettuce into whole leaves and rinse them cold so they are crisp.",
      "Spoon the chicken into the leaves at the table and eat them with your hands.",
      "The lettuce is doing the job of a tortilla.",
    ],
    macro: null, tagline: 'Nearly Minced', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: "Lime",
  },

  {
    id: 316, book: 1, secNum: 4, secName: 'Dinner',
    name: 'Sunday Pot Roast, Trimmed',
    servings: '4 Servings', servN: 4,
    ing: ['2 lbs beef roast, trimmed', '4 carrots', '2 onions', '2 cloves garlic',
      '1 tsp dried thyme', '1 tsp black pepper', '1 cup water'],
    steps: [
      "Trim the roast cold, straight from the fridge, when the fat is firm and comes away in sheets. Take the cap and the thick seams; leave the marbling, which you cannot get at anyway.",
      "Brown it on every side in a dry heavy pot, then take it out.",
      "Onions in wedges and the garlic, crushed, cooked in what the beef left, then the thyme, the water and the roast back in. Lid on, lowest heat, for about 3 hours, until it gives under a fork.",
      "Carrots in large pieces for the last hour.",
      "Skim the top before it goes out and pepper it at the table.",
    ],
    macro: null, tagline: 'Comes Away in Sheets', score: null, sc: null,
    diff: 'Medium', time: '3 hrs 30 mins', extras: null,
    lift: {
      with: "Soy sauce",
      steps: [
        "A tablespoon of soy sauce in with the liquid. Nobody tastes soy; they taste more beef.",
      ],
    },
  },

  /* Asked for by name, and a real gap: nothing in either volume puffs.
     It goes in with the morning treats rather than with the recipes written
     for this edition, because that is where somebody would look for it.

     Everything about it is technique and none of it is difficulty. The dish
     has to be hot and the butter sizzling, the eggs have to be beaten far
     harder than seems necessary, and the oven door has to stay shut. Get any
     of the three wrong and it is a thick flat omelette. */
  {
    id: 335, book: 2, secNum: 1, secName: 'Speedy Weekday Breakfasts & Morning Treats',
    name: 'German Pancakes',
    servings: '6 Servings', servN: 6,
    ing: ['6 eggs', '1 cup milk', '1 cup white flour', '½ tsp salt', '1 tsp vanilla',
      '4 tbsp butter', '2 tbsp powdered sugar'],
    steps: [
      'Heat the oven to 425°F with a 9x13 dish inside it and the butter in the dish. The dish has to be hot and the butter sizzling before any batter goes near it.',
      'Beat the eggs hard for a full minute, until they are pale and frothy. This is where the rise comes from, and it is more beating than seems necessary.',
      'Whisk in the milk, flour, salt and vanilla until the batter is completely smooth. Lumps of flour will not cook out.',
      'Pour the batter into the hot buttered dish all at once and put it straight back in the oven.',
      'Bake 20 minutes and do not open the door. It climbs the sides of the dish and goes deep gold; opened early, it drops and will not come back up.',
      'It sinks as it comes out, which is what it is supposed to do. Dust it with the powdered sugar and cut it in the dish.',
      'Jam or {r:277} over the top, and it wants eating straight away.',
    ],
    macro: null, tagline: 'It Climbs, Then It Falls', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
  },

  {
    /* The Sunday method for No. 274's jar. Blake asked for a mix
       "stunningly more than basic bagged mix", and the stunning part is
       all on the wet side: sour cream for the tender, tangy crumb and the
       lift it gives the soda in the jar, the whites whipped and folded in
       last, butter browned first. Every one of them is on the order. In the
       breakfasts because that is when it is eaten; it is a project, but a
       twenty-minute one. */
    id: 339, book: 2, secNum: 1, secName: 'Speedy Weekday Breakfasts & Morning Treats',
    name: 'Sunday Waffles',
    servings: '4 Waffles', servN: 4,
    ing: ['1.5 cups pancake mix', '2 eggs', '¾ cup milk', '½ cup sour cream',
      '3 tbsp butter', '1 tsp vanilla', '1 tbsp sugar'],
    steps: [
      'Brown the butter first: melt it in a small pan over medium heat and swirl it until the foam goes quiet and the specks at the bottom turn the colour of toast, 3 to 4 minutes. Pour it into a bowl at once, specks and all, or it goes on cooking.',
      'Separate the eggs, whites into a clean bowl. Whisk the yolks with the milk, sour cream, vanilla and the browned butter.',
      'Stir the mix ({r:274}) into the wet side until the dry patches are gone, and no further. Let it stand 10 minutes while the iron heats — the flour drinks, and the batter thickens on its own.',
      'Beat the whites with the sugar to soft peaks — the tips fold over when the beater lifts — and fold them into the batter in three or four strokes. Streaks of white are fine; a batter stirred smooth has lost what the whites brought.',
      'A scant cup of batter on a hot iron, and leave the lid shut until the steam slows to a thread. Crisp at the edges, soft in the middle. Keep the first ones on a rack in a warm oven, not stacked, or the steam softens what the iron just crisped.',
      'Butter and {r:277} syrup, or canned peaches warmed through with a shake of cinnamon.',
    ],
    lift: {
      with: 'Malted milk powder',
      steps: [
        'A tablespoon of malted milk powder in with the mix is the flavour of a diner waffle — sweet, toasty, faintly of the malt shop.',
      ]
    },
    macro: null, tagline: 'Whites Folded In Last', score: null, sc: null,
    diff: 'Medium', time: '30 mins', extras: null,
  },

  {
    /* Blake: "Buttermilk pancakes and syrup … and buttermilk substitute if I
       can't buy buttermilk. I usually have vinegar." The jar (No. 274) has
       the soda waiting for exactly this acid. Costed on the storehouse
       stand-in — milk soured with sour cream — so the recipe is honest for
       the cook with the order and nothing else; real buttermilk and the
       vinegar trick are the lift, because neither is on the order. */
    id: 340, book: 2, secNum: 1, secName: 'Speedy Weekday Breakfasts & Morning Treats',
    name: 'Buttermilk Pancakes',
    servings: '4 Servings (8 Pancakes)', servN: 4,
    ing: ['1 cup pancake mix', '¾ cup milk', '¼ cup sour cream', '1 egg',
      '2 tbsp butter', '½ tsp vanilla'],
    steps: [
      'Stir the sour cream into the milk until it is smooth — that is the buttermilk, near enough, and the sour in it is what wakes the soda in the mix ({r:274}).',
      'Melt the butter. Whisk the egg and the vanilla into the soured milk, then the butter.',
      'Stir the mix in until the dry patches are gone and then stop. Lumps are correct; a batter beaten smooth makes tough pancakes. Let it stand five minutes — it thickens on its own.',
      'A heavy pan on medium, a film of butter, a scant quarter cup of batter to a pancake. Turn each one when the bubbles on top stop closing over, and once only. The second side takes half the time of the first.',
      'Butter and {r:277} syrup, hot. Keep the early ones on a rack in a warm oven, not stacked.',
    ],
    lift: {
      with: 'Buttermilk, or a splash of vinegar',
      steps: [
        'A cup of real buttermilk in place of the milk and sour cream: tangier, and the pancakes rise a shade higher.',
        'No buttermilk? A tablespoon of vinegar stirred into a cup of milk and left five minutes does the same job. It looks curdled; that is the point.',
      ]
    },
    macro: null, tagline: 'Sour Wakes the Soda', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: null,
  },
  /* ---- the Mexican shelf, 2026-09-26. Blake: "can I make a betos breakfast
     burrito? Huge Carne asada burrito, homemade tortilla? rice bowls, taquito,
     enchilada (sweet pork is awesome)". The tortilla, the sweet pork, the rice
     and the dressing were already here; these are the rest, and the three
     things they spoon in. */
  {
    id: 342, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Carne Asada',
    servings: '8 Servings', servN: 8,
    ing: ['2 lbs flank steak', '2 limes, for the marinade', '1 orange, for the marinade', '¼ cup soy sauce, for the marinade',
      '3 cloves garlic, for the marinade', '1 jalapeño, for the marinade', 'cilantro', '1 tsp ground cumin, for the marinade',
      '1 tsp chili powder, for the marinade', '1 tsp salt, for the marinade', '½ tsp black pepper, for the marinade',
      '2 tbsp vegetable oil, for the marinade'],
    steps: [
      'Squeeze the limes and the orange into a bowl or a zip bag. Add the soy sauce, the garlic crushed, the jalapeño sliced thin, a big handful of chopped cilantro, the cumin, chili powder, salt, pepper and oil.',
      'Put the steak in and turn it until it is coated all over. Refrigerate 2 to 8 hours. Past about 12 the lime starts to turn the outside mealy.',
      'Get a grill or a cast iron pan as hot as it will go. Lift the steak out, let the marinade drip off and pat it dry: a wet steak steams instead of charring.',
      'Cook 4 to 5 minutes a side for medium, a little less on the thin end. You want dark char at the edges; that is most of the flavour.',
      'Rest it 10 minutes on the board, then slice it thin across the grain. Look for the lines running along the meat and cut across them, or it chews like rope. For burritos, chop the slices small.',
    ],
    makes: ['carne_asada'],
    macro: null, tagline: 'Hot Fire, Thin Slices', score: null, sc: null,
    diff: 'Medium', time: '2 hrs 30 mins', extras: 'Flank steak, Limes, Orange, Soy sauce, Garlic, Jalapeño, Cilantro',
    vary: ['Skirt steak is the traditional cut and cooks a minute faster a side. Sirloin works too, sliced just as thin.'],
  },
  {
    id: 343, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Carne Asada Burrito, Beto’s Style',
    servings: '4 Burritos', servN: 4,
    ing: ['4 large flour tortillas', '1½ lbs carne asada', '1 cup guacamole', '1 cup pico de gallo'],
    steps: [
      'Warm each tortilla in a dry skillet over medium heat, about 20 seconds a side, until it is soft and floppy. A cold tortilla splits when you roll it.',
      'Chop the carne asada into small pieces and heat it through in the same skillet with a splash of water, a couple of minutes.',
      'Pile a quarter of the meat down the middle of a tortilla, then a quarter of the guacamole and a quarter of the pico. No rice and no beans: the meat is the burrito.',
      'Fold the bottom up over the filling, fold both sides in, and roll it away from you tight.',
      'Wrap each one in foil for 2 minutes. The steam seals the seam and softens the tortilla the rest of the way, which is what makes it hold together to the last bite.',
    ],
    macro: null, tagline: 'Meat, Guac, Pico, Nothing Else', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: 'Carne asada, Guacamole, Pico de gallo',
    vary: [
      'Chicken: the same huge burrito with 2 lbs chicken breast in the Carne Asada marinade for 2 to 6 hours, grilled hot and chopped small.',
      'California: a handful of crisp french fries rolled in with the meat, and a handful of shredded cheese.',
      'Add sour cream or shredded cheese, if you like it richer.',
    ],
  },
  {
    id: 344, book: 2, secNum: 1, secName: 'Speedy Weekday Breakfasts & Morning Treats',
    name: 'Breakfast Burrito, Beto’s Style',
    servings: '4 Burritos', servN: 4,
    ing: ['4 large flour tortillas', '1 lb pork sausage', '8 eggs', '2 potatoes', '2 tbsp vegetable oil',
      '1 cup shredded cheddar', '½ cup salsa', '½ tsp salt'],
    steps: [
      "Dice the potatoes small, about half an inch. Fry them in the oil in a wide skillet over medium-high, turning now and then, 12 to 15 minutes until they are crisp and brown on several sides. Salt them and keep them warm.",
      "In a second pan, brown the sausage over medium-high, breaking it into small crumbles, 8 to 10 minutes until no pink remains (160°F). Tip off most of the fat.",
      "Beat the eggs and scramble them in the sausage pan over medium-low, just until they are set with no liquid egg left, and take them straight off the heat so they stay soft.",
      "Warm the tortillas in a dry skillet until soft. Down the middle of each: eggs, potatoes, sausage, a quarter of the cheese and a spoon of salsa.",
      "Fold the bottom up, the sides in, and roll tight. Wrap in foil for 2 minutes so the cheese melts and the seam holds.",
    ],
    macro: null, tagline: 'Eggs, Potatoes, Cheese, Your Meat', score: null, sc: null,
    diff: 'Easy', time: '30 mins', extras: null,
    vary: [
      'Bacon: 8 slices, cooked crisp and crumbled, in place of the sausage or alongside it.',
      'Ham: 1½ cups diced, browned in the pan before the eggs.',
      'Chorizo: 1 lb, browned and drained like the sausage. It carries its own spice, so go light on the salsa.',
      'Add-ins for any of them: onions and peppers softened in the potato pan, a spoon of guacamole, or pico in place of the salsa.',
    ],
  },
  {
    id: 345, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Rolled Tacos, Beto’s Style',
    servings: '6 Servings (4 Rolled Tacos)', servN: 6,
    ing: ['2 lbs beef roast', '1 cup water', '1 tsp ground cumin', '1 tsp chili powder', '1 tsp garlic powder',
      '1½ tsp salt', '24 corn tortillas', '2 cups vegetable oil (for frying)', '1 cup guacamole',
      '1 cup shredded cheddar'],
    steps: [
      'Cut the roast into big chunks and put it in a pot with the water, cumin, chili powder, garlic powder and salt. Cover and simmer low for 2½ to 3 hours, until it falls apart when pressed with a fork. A slow cooker on low does it in 8.',
      'Shred the beef fine with two forks and stir in enough of the pot juices to make it moist but not wet. Wet filling makes soggy tacos.',
      'Wrap the tortillas in a damp towel and microwave them 45 seconds so they bend without cracking. Lay a thin line of beef along one edge of each and roll it up tight, seam down.',
      'Heat half an inch of oil in a heavy skillet to 350°F. Fry them seam side down first, a few at a time, turning, 2 to 3 minutes until deep golden and crisp all over. Drain on a rack.',
      'Serve them the Beto’s way: guacamole spooned over the top and a handful of shredded cheese.',
    ],
    macro: null, tagline: 'Crisp Shells, Guac on Top', score: null, sc: null,
    diff: 'Medium', time: '3 hrs 30 mins', extras: 'Corn tortillas, Guacamole',
  },
  {
    id: 346, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Sweet Pork Enchiladas',
    servings: '6 Servings (2 Enchiladas)', servN: 6,
    ing: ['12 flour tortillas', '3 cups sweet pork', '3 cups red enchilada sauce', '1½ cups shredded cheddar'],
    steps: [
      'Heat the oven to 375°F. Warm the sweet pork so it rolls easily.',
      'Spread a cup of the sauce over the bottom of a 9x13 dish.',
      'Warm the tortillas until soft. Spoon a quarter cup of pork down each, roll it up and lay it seam down in the dish, snug against the last.',
      'Pour the rest of the sauce over the top, all the way to the ends. Any tortilla left dry turns hard in the oven. Scatter the cheese over.',
      'Bake 20 minutes until the sauce bubbles at the edges. A minute or two under the broiler browns the cheese in spots. Let it sit 5 minutes before serving.',
    ],
    macro: null, tagline: 'The Pork in Red Sauce', score: null, sc: null,
    diff: 'Easy', time: '35 mins', extras: 'Sweet pork, Red enchilada sauce',
    vary: ['The Cafe Rio plate: cilantro lime rice and black beans on the side, and tomatillo ranch drizzled over the top.'],
  },
  {
    id: 347, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Sweet Pork Rice Bowl, Cafe Rio Style',
    servings: '4 Bowls', servN: 4,
    ing: ['4 cups cilantro lime rice', '1 can black beans', '3 cups sweet pork', '1 cup shredded cheddar',
      '2 cups shredded lettuce', '1 cup pico de gallo', '½ cup tomatillo ranch'],
    steps: [
      'Warm the rice, the beans with a spoon of their liquid, and the sweet pork, each in its own pan or bowl.',
      'Build each bowl in layers: a cup of rice, a quarter of the beans, then the pork on top.',
      'Scatter the cheese over the hot pork so it melts, then the lettuce and the pico.',
      'Finish with two tablespoons of tomatillo ranch drizzled across the top.',
    ],
    macro: null, tagline: 'Rice, Beans, Pork, Green Dressing', score: null, sc: null,
    diff: 'Easy', time: '15 mins', extras: 'Cilantro lime rice, Sweet pork, Pico de gallo, Tomatillo ranch',
    vary: [
      'Carne asada: 1½ lbs, chopped, in place of the pork. Less sweet, more protein.',
      'The Cafe Rio way: a warm flour tortilla laid in the bowl first, with everything built on top of it.',
      'A scoop of guacamole on top.',
    ],
  },
  {
    id: 348, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Pico de Gallo',
    servings: '8 Servings (½ Cup Each)', servN: 8,
    ing: ['4 tomatoes', '1 onion', '1 jalapeño', 'cilantro', '1 lime', '½ tsp salt'],
    steps: [
      'Dice the tomatoes small. If they are very juicy, scoop out the wet seeds first or the pico ends up swimming.',
      'Dice the onion as fine as you can. Mince the jalapeño; leave the seeds out for mild, in for hot.',
      'Chop a big handful of cilantro and add it with the juice of the lime and the salt.',
      'Stir and let it sit 15 minutes before serving so the salt draws the juices together. Best the day it is made.',
    ],
    makes: ['pico_de_gallo'],
    macro: null, tagline: 'Fresh, Sharp, Chopped Small', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: 'Jalapeño, Cilantro, Lime',
  },
  {
    id: 349, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Guacamole',
    servings: '10 Servings (¼ Cup Each)', servN: 10,
    ing: ['3 avocados', '1 lime', '¼ cup diced onion', '1 jalapeño', 'cilantro', '½ tsp salt'],
    steps: [
      'Halve the avocados, twist out the pits and scoop the flesh into a bowl.',
      'Squeeze the lime over straight away; it is what keeps it green. Mash with a fork, leaving some chunks.',
      'Stir in the onion, the jalapeño minced fine, a handful of chopped cilantro and the salt.',
      'Taste it on a chip. It should be bright and salty enough to stand up on its own; add lime or salt until it does.',
      'Press plastic wrap right onto the surface if it has to wait. Air is what turns it brown.',
    ],
    makes: ['guacamole'],
    macro: null, tagline: 'Lime First, Mash Second', score: null, sc: null,
    diff: 'Easy', time: '10 mins', extras: 'Avocados, Lime, Jalapeño, Cilantro',
  },
  {
    id: 350, book: 2, secNum: 7, secName: COPYCAT,
    name: 'Red Enchilada Sauce',
    servings: '6 Servings (½ Cup Each)', servN: 6,
    ing: ['2 tbsp vegetable oil', '2 tbsp flour', '3 tbsp chili powder', '1 tsp ground cumin',
      '½ tsp garlic powder', '½ tsp dried oregano', '1 can tomato sauce', '2 cups water', '½ tsp salt'],
    steps: [
      'Warm the oil in a saucepan over medium heat, whisk in the flour and cook it a minute, stirring, until it smells toasty.',
      'Add the chili powder, cumin, garlic powder and oregano and stir 30 seconds. Spices burn fast in hot fat, so keep it moving.',
      'Whisk in the tomato sauce and the water until smooth.',
      'Simmer 10 to 15 minutes, stirring now and then, until it coats the back of a spoon. Salt to taste. It keeps a week in the fridge.',
    ],
    makes: ['enchilada_sauce'],
    macro: null, tagline: 'From the Spice Shelf, Not a Can', score: null, sc: null,
    diff: 'Easy', time: '20 mins', extras: 'Chili powder, Cumin, Garlic powder, Oregano',
  },
  /* Tater tots, 2026-10-06. The storehouse carries potatoes fresh and instant
     and nothing frozen. Written first for the Tater Tot Casserole, which now
     makes its own the same way; this is the side dish, and the freezer batch
     that saves the casserole its first hour. */
  {
    id: 365, book: 2, secNum: 9, secName: MADE,
    name: 'Homemade Tater Tots',
    servings: '6 Servings (About 40 Tots)', servN: 6,
    makes: ['tater_tots'],
    ing: ['2 lbs potatoes', '2 tbsp flour', '1 tsp salt', '¼ tsp black pepper', '3 tbsp oil'],
    steps: [
      'Peel the potatoes and boil them whole 8 to 10 minutes, until a knife goes in a quarter inch and the middle is still hard.',
      'Drain them and let them cool completely, at least 30 minutes. Grated warm, they turn to paste.',
      'Grate them on the large holes of a box grater and toss with the flour, salt and pepper.',
      'Heat the oven to 425°F and brush a baking sheet with half the oil.',
      'Squeeze tablespoons of the potato into little logs and set them on the sheet. Brush them with the rest of the oil.',
      'Bake 25 to 30 minutes, turning once, until deep gold and crisp.',
      'To keep a batch, freeze the shaped tots on the tray before baking, then bag them. Bake them straight from the freezer and add 5 minutes.',
    ],
    macro: null, tagline: 'Two Pounds of Potatoes, a Box Grater', score: null, sc: null,
    diff: 'Medium', time: '1 hr 15 mins', extras: null,
  },
];
