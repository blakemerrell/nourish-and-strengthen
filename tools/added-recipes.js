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
  // ---- PR 2: Chia, Drive loose, and Grandma Wilberg (366..615) ----
  {"id":366,"book":1,"secNum":1,"secName":"Breakfasts","name":"Peanut Butter Greek Yogurt Chia Pudding","servings":"2 Servings (1 Jar Each)","servN":2,"ing":["4 tbsp chia seeds","1 cup plain Greek yogurt","⅔ cup 2% milk","2 tbsp peanut butter","1 tbsp honey","1 tsp vanilla extract","pinch salt"],"steps":["Whisk the Greek yogurt, milk, peanut butter, honey, vanilla, and salt in a bowl until completely smooth. Working the peanut butter into the wet base first keeps it from sitting in streaks at the bottom.","Whisk in the chia seeds until evenly suspended. Let the bowl stand 10 minutes on the counter, then whisk again thoroughly to break up any clumps settling at the base.","Divide between two jars, cover, and chill at least 4 hours or overnight until thick and spoonable.","Stir before serving, loosening with a splash of milk if it set thicker than you like."],"vary":["Protein boost: whisk 1 scoop of vanilla whey into the yogurt and milk before adding the chia seeds, adding 2 to 3 tablespoons more milk so it stays creamy.","Toppings at serving: sliced banana, fresh berries, or a few dark chocolate chips."],"macro":null,"tagline":"Whisk Smooth, Stir Twice, Chill Overnight","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt"},
  {"id":367,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Peanut Butter Cup Protein Chia Pudding","servings":"1 Serving (1 Jar)","servN":1,"ing":["2 tbsp chia seeds","½ cup 2% milk","¾ cup plain Greek yogurt","1 scoop vanilla whey","2 tbsp powdered peanut butter","1 tsp sweetener","1 tbsp chocolate chips","1 tsp coconut oil"],"steps":["Whisk the milk, Greek yogurt, vanilla whey, powdered peanut butter, and sweetener in a jar or bowl until completely smooth with no dry pockets.","Stir in the chia seeds, wait 10 minutes, and stir again thoroughly so the seeds do not clump at the bottom.","Cover and refrigerate at least 4 hours or overnight until thick and mousse-like.","Before serving, melt the chocolate chips and coconut oil together in a small microwave-safe bowl in 20-second bursts, stirring between each, until glossy. Spoon thinly over the cold pudding and chill 10 minutes until the top sets into a crisp shell you can crack with a spoon."],"vary":["Simpler finish without melting chocolate: fold 1 teaspoon of cocoa powder straight into the pudding base, or scatter the chocolate chips on top."],"macro":null,"tagline":"Crack the Chocolate Shell","score":null,"sc":null,"diff":"Easy","time":"4 hrs 20 mins","extras":"Chia Seeds, Greek Yogurt, Whey Protein, Powdered Peanut Butter, Coconut Oil"},
  {"id":368,"book":1,"secNum":1,"secName":"Breakfasts","name":"Chocolate Peanut Butter Chia Overnight Oats","servings":"1 Serving (1 Mason Jar)","servN":1,"ing":["½ cup rolled oats","1 tbsp chia seeds","¾ cup 2% milk","¼ cup plain Greek yogurt","1 scoop chocolate whey","1 tbsp peanut butter","pinch salt"],"steps":["Whisk the milk, Greek yogurt, chocolate whey, peanut butter, and salt in a jar until smooth. Dissolving the powder and peanut butter into the liquid first prevents chalky lumps.","Stir in the rolled oats and chia seeds until everything is wet. Wait 10 minutes, then give the jar another good stir so the chia seeds stay suspended instead of settling into a dense band.","Seal and refrigerate at least 4 hours or overnight while the oats soften and the chia thickens the milk.","Stir once before eating and add a splash of milk if you prefer a looser bowl."],"vary":["Leaner peanut butter option: swap the regular peanut butter for 2 tablespoons of powdered peanut butter and an extra splash of milk.","Top with sliced banana or a few chocolate chips right before serving."],"macro":null,"tagline":"Thick, Cold, Built to Hold","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt, Whey Protein"},
  {"id":369,"book":1,"secNum":1,"secName":"Breakfasts","name":"Vanilla Berry Greek Yogurt Chia Pudding","servings":"1 Serving (1 Mason Jar)","servN":1,"ing":["2 tbsp chia seeds","¾ cup 2% milk","½ cup plain Greek yogurt","1 scoop vanilla whey","½ cup blueberries","½ tsp vanilla extract"],"steps":["Whisk the milk, Greek yogurt, vanilla whey, and vanilla extract in a jar until smooth and lump-free.","Stir in the chia seeds. Let the jar rest 10 minutes, then stir again from the bottom up to break up any gelled pockets.","Fold in half the blueberries, cover, and chill at least 4 hours or overnight.","Top with the remaining blueberries before serving so some stay firm while the rest stain the pudding purple."],"vary":["Frozen blueberries work straight from the bag — they thaw overnight and turn the pudding into a berry swirl.","Swap blueberries for sliced strawberries or diced peaches."],"macro":null,"tagline":"Stirred Twice, Berries Two Ways","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt, Whey Protein, Blueberries"},
  {"id":370,"book":1,"secNum":1,"secName":"Breakfasts","name":"Spiced Apple Chia Overnight Oats","servings":"1 Serving (1 Mason Jar)","servN":1,"ing":["½ cup rolled oats","1.5 tbsp chia seeds","¾ cup 2% milk","½ cup plain Greek yogurt","1 scoop vanilla whey","½ diced apple","1 tsp cinnamon","1 tsp honey"],"steps":["Whisk the milk, Greek yogurt, vanilla whey, cinnamon, and honey in a jar until smooth.","Stir in the rolled oats and chia seeds, then fold in the diced apple. Wait 10 minutes and stir again thoroughly so the chia seeds do not clump.","Cover and chill at least 4 hours or overnight.","Eat cold straight from the jar, or warm gently in the microwave for 45 to 60 seconds with a splash of milk if you want it like apple cobbler."],"vary":["No whey on hand: replace the vanilla whey with ¼ cup non-fat dry milk and ½ teaspoon vanilla extract.","For softer fruit, microwave the diced apple with the cinnamon for 45 seconds and cool before stirring into the jar."],"macro":null,"tagline":"Crisp Apple, High-Protein Oats","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt, Whey Protein"},
  {"id":371,"book":1,"secNum":1,"secName":"Breakfasts","name":"Mocha Crio Bru Chia Overnight Oats","servings":"1 Serving (1 Mason Jar)","servN":1,"ing":["½ cup rolled oats","1.5 tbsp chia seeds","½ cup chilled brewed Crio Bru","½ cup 2% milk","⅓ cup plain Greek yogurt","1 scoop chocolate whey","1 tsp cocoa powder","1 tsp honey"],"steps":["Whisk the chilled Crio Bru, milk, Greek yogurt, chocolate whey, cocoa powder, and honey in a jar until no dry streaks remain.","Stir in the rolled oats and chia seeds. Rest 10 minutes, then stir again from the bottom so the chia seeds hydrate evenly.","Cover and refrigerate at least 4 hours or overnight.","Stir once in the morning and add a splash of milk if the oats drank up more liquid than expected."],"vary":["No Crio Bru brewed: use ½ cup cold strong coffee or decaf for a true espresso overnight oat, or ½ cup water plus another ½ teaspoon cocoa powder."],"macro":null,"tagline":"Roasted Cacao Meets Cold Oats","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Chia Seeds, Crio Bru, Greek Yogurt, Whey Protein"},
  {"id":372,"book":1,"secNum":1,"secName":"Breakfasts","name":"Pumpkin Spice Chia Overnight Oats","servings":"1 Serving (1 Mason Jar)","servN":1,"ing":["½ cup rolled oats","1 tbsp chia seeds","⅓ cup pumpkin puree","¾ cup 2% milk","⅓ cup plain Greek yogurt","1 scoop vanilla whey","½ tsp pumpkin spice","1 tsp cinnamon","1 tsp brown sugar","pinch salt"],"steps":["Whisk the pumpkin puree, milk, Greek yogurt, vanilla whey, pumpkin spice, cinnamon, brown sugar, and salt in a jar until velvety and smooth.","Stir in the rolled oats and chia seeds. Let it stand 10 minutes, then stir again thoroughly to break up any chia clumps.","Cover and chill at least 4 hours or overnight until thick and spiced through.","Stir before serving and loosen with a splash of milk if needed."],"lift":{"with":"Nutmeg and pecans","steps":["Grate a pinch of nutmeg into the jar and scatter a few chopped toasted pecans on top in the morning — it eats like pumpkin pie in a glass."]},"macro":null,"tagline":"Pumpkin Pie in a Cold Jar","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Chia Seeds, Pumpkin Puree, Greek Yogurt, Whey Protein"},
  {"id":373,"book":1,"secNum":2,"secName":"Snacks","name":"Strawberries & Cream Cottage Cheese Chia Pudding","servings":"1 Serving (1 Jar)","servN":1,"ing":["2 tbsp chia seeds","¾ cup 2% milk","½ cup cottage cheese","1 scoop vanilla whey","½ cup sliced strawberries","½ tsp vanilla extract"],"steps":["Blend the cottage cheese, milk, vanilla whey, and vanilla extract in a blender for 20 to 30 seconds until silky smooth with no curds left. Blending turns cottage cheese into a thick cheesecake-style cream.","Pour into a jar and whisk in the chia seeds. Wait 10 minutes, then whisk again thoroughly to prevent clumping.","Fold in half the sliced strawberries, cover, and chill at least 4 hours or overnight.","Spoon the rest of the strawberries over the top right before eating."],"vary":["No blender handy: swap the cottage cheese for ½ cup plain Greek yogurt and whisk by hand."],"macro":null,"tagline":"Blended Smooth Like Cheesecake Cream","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Chia Seeds, Whey Protein, Strawberries"},
  {"id":374,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Cookies & Cream Protein Chia Pudding","servings":"1 Serving (1 Jar)","servN":1,"ing":["2 tbsp chia seeds","¾ cup 2% milk","½ cup plain Greek yogurt","1 scoop vanilla whey","1 tsp cocoa powder","1 tbsp chocolate chips","½ tsp vanilla extract","pinch salt"],"steps":["Whisk the milk, Greek yogurt, vanilla whey, vanilla extract, and salt in a jar until smooth.","Stir in the chia seeds, rest 10 minutes, and stir again thoroughly to break up any clumps.","In a small cup, stir the cocoa powder with 1 teaspoon of water into a dark paste, then swirl it gently through the pudding along with half the chocolate chips — keeping the swirl unblended leaves distinct dark cocoa and sweet cream pockets.","Cover and chill at least 4 hours or overnight. Scatter the remaining chocolate chips on top just before serving."],"vary":["Thicker late-night mousse: blend ½ cup cottage cheese into the milk and whey in place of the Greek yogurt."],"macro":null,"tagline":"Dark Cocoa Swirl, Sweet Cream Base","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt, Whey Protein"},
  {"id":375,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Lemon Cheesecake Chia Pudding","servings":"1 Serving (1 Jar)","servN":1,"ing":["2 tbsp chia seeds","¾ cup 2% milk","½ cup plain Greek yogurt","2 tbsp cream cheese","1 scoop vanilla whey","1 tbsp lemon juice","1 tsp honey","½ tsp vanilla extract"],"steps":["Blend or whisk the softened cream cheese, Greek yogurt, milk, vanilla whey, lemon juice, honey, and vanilla extract until completely smooth. Combining cream cheese with Greek yogurt gives real cheesecake tang without heavy fat or lumps.","Pour into a jar and whisk in the chia seeds. Let it sit 10 minutes, then whisk again from the bottom so no seeds clump.","Cover and refrigerate at least 4 hours or overnight until thick and spoonable.","Stir gently before serving."],"lift":{"with":"Fresh lemon zest and berries","steps":["Grate half a teaspoon of fresh lemon zest over the top and add a handful of raspberries or blueberries right before eating."]},"macro":null,"tagline":"Tangy, Blended, Set Overnight","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Chia Seeds, Greek Yogurt, Cream Cheese, Whey Protein, Lemon"},
  {"id":376,"book":2,"secNum":6,"secName":"Worth the Afternoon","name":"Adam Bennion’s Double-Crust Apple Pie","servings":"8 Servings (1 Slice)","servN":8,"ing":["2 cups white flour","½ tsp salt, for the crust","1 cup shortening","⅓ cup milk","1 tsp apple cider vinegar","6 large apples","½ lemon","1 cup sugar","3 tbsp white flour, for the filling","1 tsp cinnamon","½ tsp nutmeg","¼ tsp salt, for the filling","4 tbsp butter","1 tbsp cinnamon sugar"],"steps":["Whisk the 2 cups of flour and ½ teaspoon of salt in a bowl. Cut in the shortening with a pastry cutter or two knives until the mixture resembles coarse crumbs with pea-sized pieces.","Stir the milk and apple cider vinegar together—the acid keeps the gluten tender—and sprinkle over the flour a spoonful at a time, tossing with a fork just until the dough holds together when pressed. Divide into two discs, wrap, and chill 20 minutes while you prepare the fruit.","Heat the oven to 400°F. Peel, core, and slice the apples evenly (about 6 cups) into a large bowl, and squeeze the half lemon over them so they stay bright.","Whisk the sugar, 3 tablespoons of flour, cinnamon, nutmeg, and ¼ teaspoon of salt in a small bowl, then toss with the apples until evenly coated.","Roll out the first disc and fit it into a 10-inch pie plate. Pile the apple filling inside and dot the top with thin slices of the butter.","Roll out the second disc, lay it over the filling, trim and crimp the edges together, and cut four or five steam vents in the top. Brush lightly with a splash of water or milk if desired and scatter the cinnamon sugar across the crust.","Bake at 400°F for 50 to 55 minutes, shielding the rim with foil after 30 minutes if it browns fast, until the crust is deep gold and the juices bubble thickly through the vents. Cool at least 1 hour before slicing so the filling sets."],"macro":null,"tagline":"Vinegar-Tender Crust, Bubbling Vents","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 30 mins","extras":"Shortening, Vinegar, Lemon, Nutmeg"},
  {"id":377,"book":2,"secNum":1,"secName":"Speedy Weekday Breakfasts & Morning Treats","name":"Banana Chocolate Chip Cottage Cheese Muffins","servings":"12 Muffins","servN":12,"ing":["1 cup white flour","½ cup whole wheat flour","1½ tsp baking powder","½ tsp baking soda","1 tsp cinnamon","¼ tsp salt","2 bananas","½ cup cottage cheese","2 eggs","¼ cup honey","¼ cup vegetable oil","1 tsp vanilla","½ cup chocolate chips"],"steps":["Heat the oven to 350°F and line or grease a 12-cup muffin tin.","Whisk the white flour, whole wheat flour, baking powder, baking soda, cinnamon, and salt together in a large bowl.","In a second bowl, mash the bananas smooth with a fork, then whisk in the cottage cheese, eggs, honey, oil, and vanilla until evenly combined.","Pour the wet mixture into the dry bowl and fold gently just until no dry streaks remain—overmixing makes muffins dense. Fold in the chocolate chips.","Divide the batter evenly among the 12 cups, filling each about two-thirds full.","Bake at 350°F for 18 to 20 minutes, until the tops spring back lightly and a toothpick in the center comes out with just a few moist crumbs. Cool 5 minutes in the tin before moving to a rack."],"vary":["Pure maple syrup works in place of honey, and melted butter can replace the oil.","Fold in ¼ cup chopped walnuts along with the chocolate chips for crunch."],"macro":null,"tagline":"Soft Crumb, Hidden Protein","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Whole wheat flour"},
  {"id":378,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Butterbeer with Butterscotch Cream Foam","servings":"8 Servings","servN":8,"ing":["8 cups cream soda","1 tsp caramel flavoring","1 tsp butter-vanilla flavoring","1 cup heavy cream","½ cup powdered sugar","½ tsp butterscotch flavoring"],"steps":["Chill the cream soda thoroughly ahead of time so the drink stays brisk when served.","To make the foam, whip the cold heavy cream in a chilled bowl with an electric mixer until it begins to thicken and hold soft ripples.","Add the powdered sugar and butterscotch flavoring, and continue beating until thick and spoonable—soft peaks that still pour slowly off a spoon.","In a large pitcher, stir the caramel flavoring and butter-vanilla flavoring gently into the chilled cream soda so you do not knock out the fizz.","Pour into cold mugs or glasses, spoon a thick cap of butterscotch foam over each, and swirl the bottom edge slightly into the soda before serving."],"macro":null,"tagline":"Chilled Cream Soda, Whipped Foam Cap","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Cream soda, Heavy cream, Bakery flavorings"},
  {"id":379,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Cheddar Bacon Everything Bagels","servings":"8 Servings (1 Bagel)","servN":8,"ing":["4.5 cups white flour","1.5 tbsp yeast","1½ cups warm water","1 tbsp brown sugar","2 tsp salt","1 tbsp everything bagel seasoning","2 cups cheddar cheese","½ cup real bacon bits"],"steps":["Stir the yeast and brown sugar into the warm water (about 110°F) and leave 5 minutes until foamy.","Whisk the flour, salt, and everything bagel seasoning in a large bowl, pour in the yeast mixture, and stir until a shaggy dough forms.","Turn onto a clean counter and knead for 10 minutes until stiff, smooth, and springy—bagel dough should feel firmer than bread dough. Let the dough rest 5 minutes.","Divide into 8 equal pieces, roll each into a tight ball, then push your thumb through the center and stretch gently into a ring with a 2-inch hole. Set on a parchment-lined baking sheet, cover loosely, and rise 30 minutes.","Heat the oven to 425°F and bring a wide pot of water (about 4 inches deep) to a rolling boil.","Boil the bagels in batches for 1 minute per side, lift out with a slotted spoon, and return to the lined sheet. Scatter the cheddar and bacon bits generously over the warm tops.","Bake at 425°F for 15 to 17 minutes, until deep golden brown and the cheese is bubbling. Cool 10 minutes on a rack before slicing."],"macro":null,"tagline":"Boiled Chewy, Crusted Savory","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 45 mins","extras":"Bacon bits, Everything bagel seasoning"},
  {"id":380,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Coconut Lime Sugar Cookies, Twisted Style","servings":"16 Servings (1 Cookie)","servN":16,"ing":["1 cup butter","1 cup sugar","2 eggs","1½ tsp vanilla","3 cups white flour","2½ tsp baking powder","2 tsp cornstarch","½ tsp salt","½ cup butter, for the frosting","3 cups powdered sugar","1½ tbsp lime juice","½ tsp coconut extract","2 tbsp milk","1 lime"],"steps":["Heat the oven to 350°F and line two baking sheets with parchment.","Beat the 1 cup of softened butter and the sugar together until pale and fluffy. Scrape the bowl, then beat in the eggs and vanilla until smooth.","Add the flour, baking powder, cornstarch, and salt, mixing on low speed just until the dough pulls together.","Scoop into 16 balls, space 6 to a tray, and press each down gently with the bottom of a drinking glass (dipped in a little sugar if it sticks) to about ½ inch thick.","Bake at 350°F for 9 to 11 minutes, until the tops look puffed and matte rather than glossy—pull them before the edges brown. Cool completely on the trays.","Beat the remaining ½ cup softened butter until creamy, then blend in the powdered sugar, lime juice, coconut extract, and milk until smooth and spreadable.","Frost the cooled cookies generously, chill at least 30 minutes, and serve each with a small wedge of fresh lime from the whole lime to squeeze over the top."],"macro":null,"tagline":"Soft Sugar Base, Tart Coconut Frosting","score":null,"sc":null,"diff":"Medium","time":"35 mins","extras":"Lime, Coconut extract"},
  {"id":381,"book":1,"secNum":2,"secName":"Snacks","name":"Cottage Cheese Snickers Squares","servings":"8 Squares","servN":8,"ing":["1 cup cottage cheese","1 cup almond flour","2 scoops vanilla whey","¼ cup peanut butter","2 tbsp maple syrup","⅓ cup crushed peanuts","½ cup dark chocolate chips","1 tsp coconut oil"],"steps":["Line an 8-inch square pan or meal-prep container with parchment paper.","Blend the cottage cheese on high until completely silky with zero curds left.","Stir the smooth cottage cheese in a bowl with the almond flour, vanilla whey, peanut butter, and maple syrup until a thick, pliable dough forms.","Press the dough into an even layer in the lined dish, scatter the crushed peanuts on top, and press them firmly into the surface.","Freeze 1 to 2 hours until firm to the touch.","Melt the dark chocolate chips with the coconut oil in 20-second microwave bursts, stirring between each, until glossy. Spread evenly over the chilled base, freeze 10 minutes more until set, and slice into 8 squares."],"macro":null,"tagline":"No-Bake Nougat, Snap of Dark Chocolate","score":null,"sc":null,"diff":"Easy","time":"2 hrs 20 mins","extras":"Almond flour, Whey, Maple syrup, Peanuts, Coconut oil"},
  {"id":382,"book":2,"secNum":4,"secName":"Elaborate Sunday Feasts & Roasts","name":"Louisiana Boiled Crawfish","servings":"4 Servings","servN":4,"ing":["10 lbs whole crawfish","1 cup Creole seasoning, for boiling"],"steps":["Rinse the crawfish thoroughly in cold water in the basket of a large boiling pot (at least 40 quarts), discarding any that are broken or float lifeless.","Set the basket in the empty pot, add enough water to submerge the crawfish by 2 inches, then lift the basket back out so the water level is measured.","Stir the Creole seasoning into the pot and bring the water to a hard, rolling boil.","Lower the basket of crawfish into the boiling water, cover, and bring back to a boil. Boil briskly for exactly 5 minutes.","Turn off the burner, keep the pot covered, and let the crawfish soak in the spiced broth for 15 minutes so the meat absorbs the seasoning without toughening. Drain and dump onto a lined table to serve hot."],"vary":["Add 4 halved ears of corn, 1½ pounds of halved baby red potatoes, and 2 halved lemons to the boiling seasoned water 10 minutes before the crawfish go in for a classic boil spread."],"macro":null,"tagline":"Five Minutes Boiled, Fifteen Soaked","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Whole crawfish, Creole seasoning"},
  {"id":383,"book":2,"secNum":3,"secName":"Kid-Approved Weeknight Comfort Dinners","name":"Creamy Crawfish Fettuccine Bake","servings":"8 Servings","servN":8,"ing":["2 lbs crawfish tails","8 oz pasta","6 tbsp butter","2 onions","2 stalks celery","1 bell pepper","4 green onions","3 cloves garlic","2 tbsp white flour","2 tbsp dried parsley","2 tbsp diced jalapeños","8 oz cheddar cheese","1 cup half and half","2 tbsp Creole seasoning","½ cup parmesan cheese"],"steps":["Heat the oven to 350°F and grease a 9x13 baking dish.","Melt the butter in a Dutch oven over medium heat. Add the diced onions, celery, bell pepper, and green onions, and cook 8 minutes until soft.","Stir in the flour, parsley, and crawfish tails, cooking and stirring gently for 10 to 12 minutes.","Add the diced jalapeños, grated cheddar, half and half, minced garlic, and Creole seasoning. Reduce heat to low and simmer 10 minutes, stirring often so the cheese sauce stays velvety and does not catch.","Meanwhile, boil the fettuccine in unsalted water until just al dente, drain, and rinse briefly with cool water so it stops cooking.","Layer half the pasta in the prepared dish, spoon over half the crawfish sauce, repeat with the remaining pasta and sauce, and scatter the parmesan across the top. Bake 15 to 20 minutes until bubbling around the edges."],"macro":null,"tagline":"Cajun Trinity, Bubbling Cheese Bake","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":"Crawfish tails, Celery, Green onions, Half and half, Creole seasoning"},
  {"id":384,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"S’mores Brownie Cookies, Crumbl Style","servings":"12 Large Cookies","servN":12,"ing":["1½ cups butter","¾ cup sugar","1½ cups brown sugar","2 eggs","1 tbsp vanilla","3¾ cups white flour","2 tsp baking soda","3 tsp baking powder","1 tsp salt","1½ cups crushed graham crackers","½ cup cocoa powder","1 cup chocolate chips","1 jar (7 oz) marshmallow creme"],"steps":["Heat the oven to 350°F and line two baking sheets with parchment.","Beat the softened butter, granulated sugar, and brown sugar until creamy, then beat in the eggs and vanilla.","Mix in 3½ cups of the flour, the baking soda, baking powder, and salt just until combined. Scoop half of the dough into a separate bowl.","To the first half, mix in 1¼ cups of the crushed graham crackers and the chocolate chips. Set aside. To the remaining half, mix in the cocoa powder and the last ¼ cup of flour until evenly dark.","Divide both doughs into 12 equal portions each. Roll and gently flatten each cocoa dough ball on the baking sheets (6 per sheet), then flatten a graham-chip dough ball and press it gently on top of each brownie base.","Bake at 350°F for 12 to 15 minutes until set around the edges. Cool 10 minutes on the pan, then spoon and swirl marshmallow creme over the warm centers and dust with the remaining ¼ cup graham cracker crumbs."],"macro":null,"tagline":"Two-Dough Cookie, Marshmallow Swirl","score":null,"sc":null,"diff":"In-Depth","time":"45 mins","extras":"Graham crackers, Marshmallow creme"},
  {"id":385,"book":1,"secNum":1,"secName":"Breakfasts","name":"Apple Pie High-Protein Chia Pudding","servings":"5 Servings","servN":5,"ing":["2½ cups plain Greek yogurt","½ cup applesauce","3 scoops vanilla whey","½ cup chia seeds","2 tbsp maple syrup","3 tsp cinnamon","1 tsp vanilla","1 apple","1 tsp butter","1 tbsp brown sugar","1 tsp cornstarch","1 tbsp cold water"],"steps":["Whisk the Greek yogurt, applesauce, vanilla whey, chia seeds, maple syrup, 2 teaspoons of the cinnamon, and vanilla in a large bowl until smooth.","Let the mixture sit 10 minutes, then whisk again thoroughly so no chia seeds settle into clumps. Cover and refrigerate at least 4 hours or overnight.","For the apple topping, melt the butter in a skillet over medium heat. Add the finely diced apple, brown sugar, and remaining 1 teaspoon of cinnamon, cooking 5 to 7 minutes until tender.","Stir the cornstarch into the cold water until smooth, pour into the skillet, and cook 1 minute until the apple juices thicken into a glossy glaze. Cool before storing or spooning warm over the chilled pudding.","Divide the pudding into 5 bowls or jars and top with the cinnamon apples right before eating."],"macro":null,"tagline":"Stir Twice, Top With Warm Apples","score":null,"sc":null,"diff":"Easy","time":"4 hrs 20 mins","extras":"Greek yogurt, Whey, Chia seeds, Maple syrup"},
  {"id":386,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Chocolate-Shell Cottage Cheese Cheesecake Cup","servings":"1 Serving","servN":1,"ing":["1 cup cottage cheese","2 tbsp sweetener","1 tbsp cocoa powder","¼ tsp vanilla","2 tbsp dark chocolate chips","1 tsp coconut oil","pinch salt"],"steps":["Blend the cottage cheese, sweetener, cocoa powder, and vanilla in a small blender or food processor until completely smooth and mousse-like, scraping down the sides once.","Spoon into a small ramekin or jar and smooth the surface flat.","Melt the dark chocolate chips with the coconut oil in 15-second microwave bursts, stirring until sleek.","Pour the melted chocolate over the cheesecake layer, tilt to coat evenly, finish with a pinch of flaky salt, and refrigerate 15 minutes until the chocolate shell snaps under a spoon."],"macro":null,"tagline":"Whipped Curd, Crackable Chocolate Top","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Sweetener, Coconut oil"},
  {"id":387,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Single-Serve Baked Protein Brownie","servings":"1 Serving","servN":1,"ing":["½ cup oat flour","1 scoop vanilla whey","2 tbsp cocoa powder","1 tbsp sweetener","¼ tsp baking powder","pinch salt","½ cup almond milk","2 tsp dark chocolate chips"],"steps":["Heat the oven to 350°F and lightly grease a small 5-inch oven-safe ramekin.","Whisk the oat flour, vanilla whey, cocoa powder, sweetener, baking powder, and salt in a bowl so there are no dry protein pockets.","Stir in the almond milk until smooth, pour into the ramekin, and scatter the dark chocolate chips over the top.","Bake at 350°F for 10 to 12 minutes—pull it at 10 minutes for a fudgy, spoonable middle or 12 minutes for a firmer crumb. Let cool 2 minutes before eating warm."],"macro":null,"tagline":"Ten Minutes in the Oven, Fudgy Center","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Whey, Sweetener, Almond milk"},
  {"id":388,"book":2,"secNum":3,"secName":"Kid-Approved Weeknight Comfort Dinners","name":"Garlic & Sour Cream Pressure-Cooker Mashed Potatoes","servings":"6 Servings","servN":6,"ing":["3 lbs potatoes","4 cups water","2 tsp salt","¼ cup butter","¼ cup sour cream","¼ cup milk","½ tsp garlic powder","½ tsp black pepper"],"steps":["Peel the potatoes and slice them into even ½-inch rounds so they cook uniformly.","Place them in the pressure cooker pot with the water (just enough to cover) and 1 teaspoon of the salt. Lock the lid, set the valve to seal, and pressure cook on high for 8 minutes.","Quick-release the steam carefully, drain the potatoes well, and return them to the warm pot for a minute so excess moisture steams off.","Add the butter, sour cream, milk, garlic powder, black pepper, and remaining 1 teaspoon of salt. Mash gently just until smooth and creamy—overworking makes potatoes gummy."],"macro":null,"tagline":"Eight Minutes Under Pressure","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":389,"book":2,"secNum":4,"secName":"Elaborate Sunday Feasts & Roasts","name":"Pressure-Cooker St. Louis BBQ Ribs","servings":"4 Servings","servN":4,"ing":["3.5 lbs pork St. Louis ribs","½ cup apple cider vinegar","1 tsp liquid smoke","½ cup BBQ sauce","¼ cup brown sugar","1 tbsp paprika","1 tsp onion powder","1 tsp garlic powder","½ tsp chili powder","½ tsp five-spice powder","1 tsp mustard powder","1 tsp salt","1 tsp black pepper"],"steps":["Peel the papery silver membrane off the bone side of the ribs with a butter knife and paper towel so the rub penetrates and the meat eats cleanly.","Stir the brown sugar, paprika, onion powder, garlic powder, chili powder, five-spice, mustard powder, salt, and black pepper together, and rub evenly over both sides of the rack. Chill 4 hours if you have time, or cook right away.","Pour the apple cider vinegar and liquid smoke into the pressure cooker pot, insert the trivet, and coil the rack meaty-side out on top.","Lock the lid and pressure cook on high for 30 minutes (add 10 minutes if starting from frozen), then let pressure release naturally for 20 minutes before venting the rest. Natural release keeps the pork tender.","Heat the broiler (or a 500°F grill). Set the ribs meaty-side up on a foil-lined sheet, brush generously with BBQ sauce ({r:264} makes a batch), and broil 3 to 5 minutes until the glaze bubbles and chars at the edges. Rest 5 minutes before slicing."],"macro":null,"tagline":"Natural Release, Broiled Sticky","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":"Pork ribs, Liquid smoke, Five-spice powder"},
  {"id":390,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Jalapeño Cheddar Bagels","servings":"8 Servings (1 Bagel)","servN":8,"ing":["4.5 cups white flour","1.5 tbsp yeast","1½ cups warm water","1 tbsp brown sugar","2 tsp salt","2 cups cheddar cheese","3 tbsp diced jalapeños","2 jalapeños"],"steps":["Stir the yeast and brown sugar into the warm water (about 110°F) and let sit 5 minutes until foamy.","Combine the flour, salt, ½ cup of the cheddar, and the diced jalapeños in a large bowl. Pour in the yeast mixture and stir to a shaggy dough.","Knead on the counter for 10 minutes until smooth, firm, and elastic, then let rest 5 minutes.","Divide into 8 pieces, roll into tight balls, poke your thumb through each center, and stretch into rings. Place on a parchment-lined sheet, cover loosely, and rise 30 minutes.","Heat the oven to 425°F and bring 4 inches of water to a rolling boil in a wide pot.","Boil the bagels in batches 1 minute per side, transfer back to the lined tray, and top each with the remaining 1½ cups of cheddar and slices from the fresh jalapeños.","Bake at 425°F for 15 to 17 minutes until deeply golden and bubbling. Cool 10 minutes before slicing."],"macro":null,"tagline":"Heat Inside the Dough, Cheese Baked On","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 45 mins","extras":"Jalapeños"},
  {"id":391,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Utah Hot Dog Special Sauce (J-Dawgs Style)","servings":"14 Servings (2 Tbsp Each)","servN":14,"ing":["¾ cup ketchup","¾ cup BBQ sauce","¼ cup honey","1 tsp apple cider vinegar","1 tsp soy sauce","½ tsp onion powder"],"steps":["Whisk the ketchup, BBQ sauce ({r:264} works well), honey, apple cider vinegar, soy sauce, and onion powder together in a small saucepan.","Bring just to a gentle boil over medium heat, let bubble for 1 minute so the honey and onion powder meld cleanly, then remove from the heat.","Cool completely and spoon over grilled beef franks ({r:129}) or burgers. Keeps 2 weeks refrigerated in a covered jar."],"vary":["Brown-sugar version: swap ¾ cup packed brown sugar in place of the BBQ sauce and simmer 1 to 2 minutes until completely dissolved and glossy."],"macro":null,"tagline":"Sweet, Tangy, Built for a Grill Dog","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":392,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Key Lime Pie Cookies, Crumbl Style","servings":"24 Servings (½ Large Cookie)","servN":24,"ing":["1½ cups butter","¾ cup sugar","1½ cups brown sugar","2 eggs","1 tbsp vanilla","3¾ cups white flour","3 cups crushed graham crackers","2 tsp baking soda","3 tsp baking powder","1 tsp salt","16 oz cream cheese","1 can (14 oz) sweetened condensed milk","½ cup lime juice","4 tbsp powdered sugar","2 limes"],"steps":["Heat the oven to 350°F and line baking sheets with parchment.","Beat the softened butter, granulated sugar, and brown sugar until creamy, then beat in the eggs and vanilla.","Stir in the flour, crushed graham crackers, baking soda, baking powder, and salt just until combined.","Scoop into 12 generous ½-cup dough balls, flatten slightly, and bake 6 per tray at 350°F for 12 to 15 minutes until lightly golden at the edges.","While still warm on the pan, press the flat bottom of a glass gently into the center of each cookie to form a shallow well for the filling. Cool completely.","Beat the softened cream cheese until silky, then blend in the sweetened condensed milk, powdered sugar, and lime juice (adding juice a tablespoon at a time to taste).","Spoon the key lime filling into the cooled wells, chill at least 30 minutes to set, and garnish each cookie with a small wedge from the fresh limes."],"macro":null,"tagline":"Graham Cookie Wells, Tart Lime Cream","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 25 mins","extras":"Graham crackers, Cream cheese, Sweetened condensed milk, Limes"},
  {"id":393,"book":2,"secNum":5,"secName":"Simple Family Treats & Desserts","name":"Merrell’s Canyon Cookies","servings":"24 Cookies","servN":24,"ing":["½ cup butter","1½ cups peanut butter","1 cup brown sugar","½ cup sugar","3 eggs","1 tbsp vanilla","2 tsp baking soda","4½ cups rolled oats","2 cups dark chocolate chips","2 cups crushed macadamia nuts"],"steps":["Heat the oven to 350°F and line two baking sheets with parchment.","Beat the softened butter, peanut butter, brown sugar, and granulated sugar together until smooth and creamy.","Beat in the eggs and vanilla, then sprinkle in the baking soda and mix evenly.","Stir in the rolled oats a cup at a time until no dry oats remain, then fold in the dark chocolate chips and crushed macadamia nuts.","Scoop onto the prepared sheets (an ice cream scoop works well for big cookies), flatten slightly with your palm, and bake at 350°F for 8 to 10 minutes—pull them as soon as the edges turn lightly golden so the centers stay chewy.","Rest on the hot sheet 5 minutes until firm enough to lift onto a wire rack."],"vary":["Canyon Cookie Bars: press the entire batch evenly onto a parchment-lined 18x13-inch half-sheet pan and bake at 350°F for 15 minutes until lightly golden; cool completely before slicing into 24 squares.","Use ½ cup honey in place of the white sugar, swap chopped almonds for the macadamia nuts, or fold in candy-coated chocolates."],"macro":null,"tagline":"No Flour, Loaded With Oats and Nuts","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Macadamia nuts"},
  {"id":394,"book":2,"secNum":1,"secName":"Speedy Weekday Breakfasts & Morning Treats","name":"Spiced Pumpkin Apple Muffins","servings":"12 Muffins","servN":12,"ing":["2½ cups white flour","½ cup sugar","½ cup brown sugar","1 tbsp pumpkin pie spice","2 tsp baking powder","1 tsp baking soda","½ tsp salt","2 eggs","1 cup pumpkin puree","½ cup vegetable oil","2 cups diced apple"],"steps":["Heat the oven to 350°F and grease or line a 12-cup muffin tin.","Whisk the flour, granulated sugar, brown sugar, pumpkin pie spice, baking powder, baking soda, and salt in a large bowl.","In a separate bowl, beat the eggs lightly, then whisk in the pumpkin puree and oil until smooth.","Pour the pumpkin mixture into the dry bowl and stir just until moistened, then gently fold in the peeled, finely diced apples.","Divide into the 12 muffin cups and bake at 350°F for 22 to 25 minutes, until a toothpick in the center comes out clean. Cool 5 minutes before lifting onto a rack."],"macro":null,"tagline":"Warm Spice, Tender Bits of Apple","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Pumpkin puree"},
  {"id":395,"book":2,"secNum":3,"secName":"Kid-Approved Weeknight Comfort Dinners","name":"Slow-Cooker French Dip Sandwiches","servings":"8 Sandwiches","servN":8,"ing":["3 lbs beef roast","4 cups water","1 tbsp beef bouillon","1 tbsp cornstarch","2 tsp onion powder","1 tsp dried parsley","½ tsp garlic powder","¼ tsp black pepper","1 packet (1 oz) onion soup mix","1 packet (0.87 oz) gravy mix","8 hoagie rolls","8 slices Swiss cheese","2 tbsp butter"],"steps":["Cut the beef roast across the grain into 3-inch chunks so it cooks evenly and shreds into short, tender strands.","Place the beef in a slow cooker and add the water, bouillon, cornstarch, onion powder, parsley, garlic powder, black pepper, onion soup mix, and gravy mix. Cover and cook on HIGH for 6 to 7 hours (or LOW for 8 to 9 hours) until fork-tender.","Lift the beef out and shred with two forks, leaving the rich broth in the slow cooker on warm.","Split the hoagie rolls, spread the cut sides lightly with butter, and broil 1 to 2 minutes until toasted golden.","Pile hot shredded beef onto each roll, top with a slice of Swiss cheese (broil 30 seconds more to melt if desired), and ladle the hot broth into small bowls alongside for dipping."],"macro":null,"tagline":"Toasted Rolls, Hot Pot Jus","score":null,"sc":null,"diff":"Easy","time":"7 hrs","extras":"Bouillon, Onion soup mix, Gravy mix, Hoagie rolls, Swiss cheese"},
  {"id":396,"book":2,"secNum":7,"secName":"The Copycat Shelf","name":"Snickerdoodle Cupcake Cookies, Crumbl Style","servings":"24 Servings (½ Large Cookie)","servN":24,"ing":["1½ cups butter","1½ cups sugar","3 eggs","1½ tsp vanilla","4½ cups white flour","3½ tsp baking powder","1 tsp cinnamon","½ tsp salt","½ cup cinnamon sugar","8 oz cream cheese","¼ cup butter, for the frosting","2 tsp vanilla, for the frosting","4 cups powdered sugar","2 tbsp milk"],"steps":["Heat the oven to 350°F and line two baking sheets with parchment.","Beat the 1½ cups of softened butter and granulated sugar until fluffy, then beat in the eggs and 1½ teaspoons of vanilla.","Mix in the flour, baking powder, cinnamon, and salt just until combined. Divide into 12 thick ⅓-cup balls.","Reserve 2 tablespoons of the cinnamon sugar for dusting, and roll each dough ball in the rest, pressing gently into a thick puck. Space 6 per baking sheet.","Bake at 350°F for 14 to 17 minutes until puffed and no longer glossy on top.","Meanwhile beat the cream cheese, remaining ¼ cup softened butter, and 2 teaspoons vanilla until smooth, then beat in the powdered sugar and milk to a pipeable frosting.","Pipe or swirl the frosting over the warm cookies, scatter the reserved cinnamon sugar on top, and serve warm."],"macro":null,"tagline":"Cinnamon-Rolled, Cream-Cheese Swirled","score":null,"sc":null,"diff":"Medium","time":"45 mins","extras":"Cream cheese"},
  {"id":397,"book":2,"secNum":8,"secName":"For the Love of Chocolate","name":"Triple Chocolate Cheesecake with Cookie Crust","servings":"12 Servings (1 Slice)","servN":12,"ing":["24 chocolate sandwich cookies","¼ cup butter","2 lbs cream cheese","1⅓ cups powdered sugar","3 tbsp cocoa powder","4 eggs","16 oz bittersweet chocolate","¾ cup heavy cream","1 tbsp sugar"],"steps":["Heat the oven to 350°F and lightly grease a 9-inch springform pan.","Pulse the chocolate sandwich cookies into fine crumbs, toss with the melted butter, press firmly across the bottom of the pan, and bake 8 minutes. Cool on a wire rack.","Melt 10 ounces of the bittersweet chocolate gently over barely simmering water (or in short microwave bursts) and let cool slightly.","Beat the room-temperature cream cheese, powdered sugar, and cocoa powder until completely smooth. Beat in the eggs one at a time on low speed—avoid whipping air into the batter, which causes cracks—then fold in the cooled melted chocolate.","Pour over the crust and bake at 350°F for 60 to 70 minutes, until the edges are set and the center holds a slight wobble. Cool 5 minutes, run a thin knife around the rim, and chill uncovered at least 8 hours or overnight.","For the ganache, warm the heavy cream, remaining 6 ounces of chopped bittersweet chocolate, and granulated sugar over low heat, stirring until sleek. Cool slightly, pour over the chilled cheesecake, and chill 30 minutes more before releasing the pan sides."],"macro":null,"tagline":"Cookie Crust, Dark Filling, Silk Ganache","score":null,"sc":null,"diff":"In-Depth","time":"9 hrs 40 mins","extras":"Chocolate sandwich cookies, Cream cheese, Dark chocolate, Heavy cream"},
  {"id":398,"book":2,"secNum":5,"secName":"Simple Family Treats & Desserts","name":"Simple Scratch White Cake","servings":"12 Servings (1 Square)","servN":12,"ing":["1 cup sugar","½ cup butter","2 eggs","2 tsp vanilla","1½ cups white flour","1¾ tsp baking powder","¼ tsp salt","½ cup milk"],"steps":["Heat the oven to 350°F and grease and lightly flour a 9-inch square cake pan.","Beat the softened butter and sugar together for 3 to 4 minutes until pale and fluffy. Beat in the eggs one at a time, then the vanilla.","Whisk the flour, baking powder, and salt in a separate bowl.","Add the flour mixture in three batches alternating with the milk—starting and ending with flour—mixing on low speed only until smooth.","Spread evenly into the prepared pan and bake at 350°F for 28 to 32 minutes, until a toothpick in the center comes out clean. Cool 10 minutes in the pan, then turn onto a rack to cool completely before frosting."],"vary":["Cupcakes: divide the batter among 12 lined muffin cups (two-thirds full) and bake at 350°F for 18 to 20 minutes."],"macro":null,"tagline":"Tender Crumb, One Square Pan","score":null,"sc":null,"diff":"Easy","time":"45 mins","extras":null},
  {"id":399,"book":1,"secNum":1,"secName":"Breakfasts","name":"Spinach & Avocado Protein Omelet","servings":"1 Serving","servN":1,"ing":["3 eggs","¼ cup egg whites","¼ avocado","1 cup spinach","¼ cup mushrooms","¼ cup bell pepper","¼ cup onion","2 slices tomato","1 slice cheddar cheese","1 tbsp olive oil","¼ tsp garlic powder","¼ tsp dried basil","¼ tsp black pepper"],"steps":["Warm the olive oil in a non-stick skillet over medium heat. Add the chopped mushrooms, bell pepper, and onion, and sauté 3 minutes until tender.","Toss in the spinach and diced avocado, stirring 1 to 2 minutes just until the spinach wilts.","Whisk the whole eggs, egg whites, garlic powder, basil, and black pepper together, and pour evenly over the vegetables.","Cook undisturbed until the edges set and the bottom lifts cleanly, flip or slide onto a plate, top one half with the cheese and tomato slices, and fold closed."],"macro":null,"tagline":"Eggs Plus Whites, Packed With Greens","score":null,"sc":null,"diff":"Easy","time":"12 mins","extras":"Avocado, Spinach, Mushrooms, Olive oil"},
  {"id":400,"book":1,"secNum":3,"secName":"Lunch","name":"Super Spinach, Quinoa & Chicken Salad","servings":"1 Serving","servN":1,"ing":["4 oz chicken breast","2 cups spinach","½ cup cooked quinoa","½ apple","1 stalk celery","½ cup tomatoes","¼ cup strawberries","¼ cup blueberries","2 tbsp pecans","¼ avocado","1 slice cheddar cheese","2 tbsp olive oil","1 tbsp vinegar","¼ tsp black pepper"],"steps":["Season the chicken breast with black pepper and pan-sear or grill over medium-high heat for 5 to 6 minutes per side until it reaches 165°F internally; rest 5 minutes, then slice.","Pile the baby spinach into a large bowl and top with the cooked quinoa, diced apple, sliced celery, halved tomatoes, strawberries, blueberries, pecans, diced avocado, and cubed cheese.","Whisk the olive oil and vinegar together, toss over the salad, and lay the warm or chilled sliced chicken on top."],"macro":null,"tagline":"Berries, Quinoa, Sliced Chicken","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Spinach, Cooked quinoa, Celery, Strawberries, Blueberries, Pecans, Avocado, Olive oil"},
  {"id":401,"book":1,"secNum":4,"secName":"Dinner","name":"Salmon & Apple Sweet Potato Mash","servings":"1 Serving","servN":1,"ing":["6 oz salmon","1 sweet potato","½ apple","2 tbsp pecans","12 spears asparagus","½ cup carrots","½ cup tomatoes","1 tsp cinnamon","1 tsp brown sugar","1 tsp maple syrup","¼ tsp salt","¼ tsp black pepper"],"steps":["Heat the oven to 350°F. Season the salmon fillet with salt and black pepper and bake on a lined tray 12 to 15 minutes, until opaque and flaking easily (145°F).","Meanwhile, peel and cube the sweet potato and cored apple, cover with water in a small pot, and boil 12 minutes until fork-tender. Drain and mash smooth with the cinnamon, brown sugar, and maple syrup, then scatter the pecans on top.","Steam the asparagus spears and sliced carrots 4 to 5 minutes until bright and crisp-tender. Plate the salmon alongside the sweet potato mash, steamed vegetables, and fresh tomatoes."],"macro":null,"tagline":"Sweet-Savory Mash, Clean Roast Fish","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Salmon, Sweet potato, Pecans, Asparagus, Maple syrup"},
  {"id":402,"book":1,"secNum":6,"secName":"Power Drinks","name":"Chocolate Peanut Butter Super Shake","servings":"1 Tall Glass","servN":1,"ing":["¾ cup almond milk","1 scoop chocolate whey","2 tbsp cottage cheese","¼ avocado","2 tbsp peanut butter","1 tbsp almonds","1 banana","2 ice cubes"],"steps":["Pour the almond milk into the blender first so powders do not stick to the blades.","Add the chocolate whey, cottage cheese, avocado, peanut butter, almonds, banana, and ice cubes.","Blend on high for 45 seconds until completely thick and smooth, and pour straight away."],"macro":null,"tagline":"High-Calorie Athlete Recovery Shake","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Almond milk, Whey, Avocado, Almonds"},
  {"id":403,"book":1,"secNum":1,"secName":"Breakfasts","name":"Turkey Sausage & Sweet Potato Skillet","servings":"2 Servings","servN":2,"ing":["1 tbsp olive oil","2 links turkey sausage","½ cup sweet potato","¼ cup onion","¼ cup mushrooms","½ cup bell pepper","½ cup spinach","½ cup tomatoes","¼ avocado","2 eggs","½ cup egg whites","1 oz cheddar cheese","¼ tsp garlic powder","¼ tsp salt","¼ tsp black pepper"],"steps":["Warm the olive oil in a large skillet over medium heat. Add the sliced turkey sausage, diced sweet potato (pre-steamed or diced small so it cooks fast), onion, mushrooms, and bell pepper, sautéing 6 to 8 minutes until browned and tender.","Stir in the spinach and diced avocado for 1 minute until the spinach wilts.","Whisk the whole eggs, egg whites, garlic powder, salt, and black pepper together, pour into the pan, and scramble gently until just set.","Top with the shredded cheddar and diced tomatoes, cover 1 minute to melt, and divide between two plates."],"macro":null,"tagline":"Savory Skillet, Sweet Potato Hash","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Olive oil, Turkey sausage, Sweet potato, Mushrooms, Spinach, Avocado"},
  {"id":404,"book":1,"secNum":6,"secName":"Power Drinks","name":"Berry Avocado Green Protein Shake","servings":"1 Tall Glass","servN":1,"ing":["½ cup almond milk","1 tbsp plain yogurt","1 scoop vanilla whey","¼ cup blueberries","¼ cup strawberries","¼ avocado","½ cup spinach","1 tbsp ground flaxseed","1 tbsp almonds","1 tsp chia seeds","2 ice cubes"],"steps":["Pour the almond milk into the blender first, then add the plain yogurt, vanilla whey, blueberries, strawberries, avocado, spinach, ground flaxseed, almonds, chia seeds, and ice.","Blend on high for 45 seconds until velvety and bright, adding a splash of cold water if too thick to pour."],"macro":null,"tagline":"Greens Hidden Under Berries","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Almond milk, Plain yogurt, Whey, Blueberries, Strawberries, Avocado, Spinach, Flaxseed, Almonds, Chia seeds"},
  {"id":405,"book":1,"secNum":2,"secName":"Snacks","name":"Almond Banana Oat Energy Bars","servings":"12 Bars","servN":12,"ing":["½ cup almond butter","2 bananas","½ cup almonds","¼ cup dried apricots","¼ cup raisins","¼ cup dried blueberries","2 tbsp pumpkin seeds","2 tbsp sunflower seeds","1 cup rolled oats"],"steps":["Heat the oven to 350°F and line an 8-inch or 9-inch square pan with parchment paper.","Mash the bananas smooth, then warm them gently with the almond butter in a small saucepan over low heat until stirred together into a smooth paste.","Coarsely chop the almonds, dried apricots, raisins, and dried blueberries. Toss in a bowl with the pumpkin seeds, sunflower seeds, and rolled oats.","Fold in the warm banana-almond mixture until everything is coated, press firmly into the lined pan, and bake at 350°F for 20 to 25 minutes until golden at the edges. Cool completely before slicing into 12 bars; refrigerate up to a week."],"macro":null,"tagline":"No Added Sugar, Packed for the Road","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Almond butter, Almonds, Dried apricots, Dried blueberries, Pumpkin seeds, Sunflower seeds"},
  {"id":406,"book":1,"secNum":7,"secName":"Batch Prep","name":"Savory Turkey & Oat Meatball Muffins","servings":"4 Servings (3 Meatballs Each)","servN":4,"ing":["1 lb ground turkey","1 cup spinach","¼ cup onion","¼ cup mushrooms","¼ cup bell pepper","1 egg","½ cup rolled oats","¼ cup cheddar cheese","1 tsp chili powder","1 tsp ground cumin","½ tsp salt","¼ tsp black pepper"],"steps":["Heat the oven to 350°F and lightly grease a 12-cup muffin tin.","Finely chop the spinach, onion, mushrooms, and bell pepper. Mix them gently in a large bowl with the ground turkey, beaten egg, rolled oats, cheddar, chili powder, cumin, salt, and black pepper.","Shape into 12 compact meatballs and nest one into each muffin cup.","Bake at 350°F for 15 to 18 minutes, until the outsides are browned and a thermometer at the center of the largest meatball reads 165°F. Great hot or chilled for meal-prep boxes."],"macro":null,"tagline":"Muffin-Tin Baked, Clean Meal Prep","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Turkey ground, Spinach, Mushrooms"},
  {"id":407,"book":1,"secNum":4,"secName":"Dinner","name":"Baked Coconut Chicken Strips","servings":"4 Servings","servN":4,"ing":["1½ lbs chicken breasts","1 egg","¼ cup water","½ cup shredded coconut","½ cup breadcrumbs","1 tbsp olive oil","½ tsp paprika","½ tsp salt","¼ tsp black pepper"],"steps":["Heat the oven to 375°F and coat a rimmed baking sheet with the olive oil.","Slice the chicken breasts into even strips and season with the paprika, salt, and black pepper.","Whisk the egg with the water in one shallow dish, and stir the unsweetened shredded coconut and breadcrumbs together in another.","Dip each chicken strip in the egg wash, then press into the coconut-crumb coating to adhere on both sides, and arrange in a single layer on the oiled pan.","Bake at 375°F for 15 to 20 minutes, turning once halfway, until golden crisp and the thickest strip reads 165°F internally."],"macro":null,"tagline":"Crisp Baked Crumb, Hint of Coconut","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Coconut shredded, Olive oil"},
  {"id":408,"book":1,"secNum":7,"secName":"Batch Prep","name":"Slow-Cooker Cashew Chicken","servings":"4 Servings","servN":4,"ing":["1½ lbs chicken breasts","2 cups broccoli","1 cup carrots","½ bell pepper","½ cup cashews","1 tbsp olive oil","¼ cup soy sauce","4 tbsp vinegar","¼ cup maple syrup","1 clove garlic","1 tbsp ground ginger","¼ tsp chili powder","¾ cup chicken broth","¼ tsp black pepper"],"steps":["Cut the chicken breasts into 1½-inch chunks and layer them in a slow cooker with the chopped broccoli, sliced carrots, diced bell pepper, and unsalted cashews.","Whisk the olive oil, soy sauce, vinegar, maple syrup, minced garlic, ginger, chili powder, black pepper, and chicken broth together, and pour evenly over the chicken and vegetables.","Cover and cook on HIGH for 2 to 3 hours or LOW for 4 to 5 hours, until the chicken reaches 165°F and is tender.","Serve hot over cooked brown rice, quinoa, or fresh spinach."],"macro":null,"tagline":"Sweet-Tangy Glaze, Tender Cashew Crunch","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Cashews, Olive oil, Maple syrup"},
  {"id":409,"book":1,"secNum":5,"secName":"Best Before Bed","name":"Strawberry Coconut Cottage Cheese Pudding","servings":"1 Serving","servN":1,"ing":["¾ cup cottage cheese","¼ cup almond milk","¼ cup shredded coconut","½ cup strawberries","1 scoop vanilla whey","1 tsp honey"],"steps":["Combine the cottage cheese, almond milk, shredded coconut, half of the strawberries, vanilla whey, and honey in a blender.","Blend on high until thick and completely smooth, spoon into a bowl, and top with the remaining sliced strawberries."],"macro":null,"tagline":"Thick Blended Curd, Fresh Berry Top","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Almond milk, Coconut shredded, Strawberries, Whey"},
  {"id":410,"book":1,"secNum":2,"secName":"Snacks","name":"No-Bake Peanut Crunch Protein Bars","servings":"9 Bars","servN":9,"ing":["½ cup cottage cheese","1 tbsp honey","1 tsp vanilla","½ tsp cinnamon","¼ cup water","1 cup peanut butter","5 scoops vanilla whey","½ cup oat flour","¼ cup almonds"],"steps":["Line a 9-inch square pan with parchment paper or plastic wrap with overhang.","Blend the cottage cheese, honey, vanilla, cinnamon, and water on high until completely smooth.","Transfer to a bowl and stir in the peanut butter, then work in the vanilla whey and oat flour until a thick, stiff dough forms.","Press evenly into the lined pan, scatter the sliced almonds over the top, press them in lightly, and chill 2 hours until firm before cutting into 9 squares."],"macro":null,"tagline":"No-Bake Slab, Twenty-Plus Grams Each","score":null,"sc":null,"diff":"Easy","time":"2 hrs 15 mins","extras":"Whey, Almonds"},
  {"id":411,"book":1,"secNum":2,"secName":"Snacks","name":"Double Chocolate Protein Muffins","servings":"12 Muffins","servN":12,"ing":["4 eggs","¼ cup almond milk","1 tsp vanilla","2 cups whole wheat flour","6 scoops chocolate whey","2 tsp baking powder","½ cup chocolate chips","½ cup raisins","1 tsp cocoa powder","1 tbsp olive oil"],"steps":["Heat the oven to 350°F and lightly grease a 12-cup muffin tin with the olive oil.","Whisk the eggs, almond milk, and vanilla together in a large bowl.","Stir in the whole wheat flour, chocolate whey, baking powder, and cocoa powder just until smooth, then fold in the chocolate chips and raisins.","Divide into the 12 cups and bake at 350°F for 10 to 14 minutes, just until the tops spring back—pull them promptly so the whey does not dry out. Store chilled."],"macro":null,"tagline":"High-Protein Grab-and-Go Batch","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Almond milk, Whole wheat flour, Whey, Olive oil"},
  {"id":412,"book":1,"secNum":6,"secName":"Power Drinks","name":"Mint Chocolate Yogurt Protein Shake","servings":"1 Tall Glass","servN":1,"ing":["¼ cup hot water","1 peppermint tea bag","1 cup ice","1 scoop chocolate whey","1 cup plain yogurt","1 tbsp flax oil"],"steps":["Steep the peppermint tea bag in the hot water for 5 minutes, squeeze the bag well, and discard it.","Pour the strong mint tea into a blender with the ice, chocolate whey, plain yogurt, and flax oil.","Blend on high until frothy and cold, and serve immediately."],"vary":["Add a teaspoon of cocoa powder or dark chocolate chips for a deeper chocolate finish."],"macro":null,"tagline":"Steeped Mint Tea, Creamy Chocolate","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Peppermint tea, Whey, Plain yogurt, Flax oil"},
  {"id":413,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Fruit Cocktail Cake","servings":"12 Servings (9×13 Cake)","servN":12,"ing":["2 cups flour","2 cups sugar (divided)","½ cup brown sugar","2 eggs","1½ tsp baking powder","1 tsp baking soda","1 tsp vanilla","1 can (15 oz) fruit cocktail (undrained)","1 cup evaporated milk","½ cup butter"],"steps":["Preheat the oven to 350°F and grease and flour a 9×13-inch baking pan.","In a large mixing bowl, whisk together the flour, 1 cup of the sugar, baking powder, and baking soda. Stir in the eggs, vanilla, and the entire can of fruit cocktail with its syrup until just combined.","Pour the batter into the prepared pan and sprinkle the brown sugar evenly over the top. Bake at 350°F for 35 to 45 minutes, until a toothpick inserted in the center comes out clean.","While the cake finishes baking, combine the remaining 1 cup sugar, evaporated milk, and butter in a saucepan. Bring to a boil over medium heat and boil for 2 minutes, stirring constantly. Pour the hot glaze evenly over the warm cake right out of the oven."],"vary":["Top warm or chilled squares with a dollop of whipped cream or thawed whipped topping."],"macro":null,"tagline":"Elaine Wilberg's Syrup-Poured Classic","score":null,"sc":null,"diff":"Easy","time":"55 mins","extras":"Fruit Cocktail"},
  {"id":414,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Cake","servings":"12 Slices (Two 8-Inch Layers)","servN":12,"ing":["3 cups quick mix","1⅓ cups milk","3 oz unsweetened baking chocolate","1½ cups sugar","2 eggs","1 tsp vanilla"],"steps":["Preheat oven to 375°F and line the bottoms of two 8-inch round layer pans (1½ inches deep) with parchment paper.","Melt the unsweetened baking chocolate gently in a heatproof bowl set over simmering water, stirring until smooth, then set aside to cool slightly.","Stir the sugar into the quick mix in a large mixing bowl. Whisk the milk, eggs, and vanilla together in a measuring cup.","Pour ¾ cup of the milk mixture and the cooled melted chocolate into the dry ingredients. Beat vigorously by hand for about 2 minutes (roughly 300 strokes) until smooth.","Add the remaining milk mixture and beat another 2 minutes (300 strokes) until the batter is silky and uniform.","Divide evenly between the prepared pans and bake at 375°F for 30 minutes, until a toothpick inserted in the center comes out clean. Cool 10 minutes in the pans before turning out onto wire racks."],"vary":["For cupcakes, line 24 muffin cups with paper liners and bake at 375°F for 15 minutes."],"macro":null,"tagline":"Two-Layer Quick Mix Cake","score":null,"sc":null,"diff":"Medium","time":"50 mins","extras":"Unsweetened Baking Chocolate"},
  {"id":415,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Icebox Cookies","servings":"36 Cookies","servN":36,"ing":["10 tbsp butter","1 cup sugar","1 egg","½ tsp vanilla","2 oz unsweetened baking chocolate","2 cups flour","3 tsp baking powder","½ tsp salt","2 tbsp milk","½ cup chopped walnuts"],"steps":["Cream the butter and sugar together in a mixing bowl until light and fluffy. Melt the unsweetened baking chocolate gently and stir it in along with the egg and vanilla.","Whisk the flour, baking powder, and salt together, then stir into the chocolate mixture alternately with the milk until a smooth dough forms. Fold in the chopped walnuts.","Shape the dough into 2 firm oblong logs, wrap tightly, and chill in the refrigerator at least 2 hours until thoroughly firm.","Preheat oven to 375°F. Slice the chilled logs into ⅛-inch rounds onto an ungreased baking sheet and bake 8 to 10 minutes until set at the edges."],"macro":null,"tagline":"Slice-and-Bake Chocolate Walnut Cookies","score":null,"sc":null,"diff":"Medium","time":"2 hrs 30 mins","extras":"Unsweetened baking chocolate, Walnuts"},
  {"id":416,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Honey Cookies","servings":"48 Cookies","servN":48,"ing":["6 cups flour","1¼ cups sugar","1 tsp ground ginger","1 tsp salt","2 cups shortening","2 eggs","1 cup honey","2 tsp baking soda","1 cup buttermilk","1 tsp vanilla"],"steps":["Preheat oven to 350°F and line baking sheets with parchment paper.","Whisk flour, sugar, ground ginger, and salt in a large bowl, then cut in shortening with a pastry blender until crumbly like pie crust.","Stir 1 tsp baking soda into the honey until foamy, and stir the remaining 1 tsp baking soda into the buttermilk. Beat eggs and vanilla together.","Pour honey mixture, buttermilk mixture, and beaten eggs into the flour mixture and stir until a soft cookie dough comes together.","Drop by rounded tablespoons onto prepared baking sheets, spacing 2 inches apart, and bake at 350°F for 10 to 12 minutes until puffed and lightly golden around the edges."],"vary":["Roll dough ½ inch thick on a floured board and cut into rounds for a classic soft cut-out honey cookie."],"macro":null,"tagline":"Buttermilk & Honey Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Ground Ginger"},
  {"id":417,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Brownies","servings":"24 Brownies","servN":24,"ing":["1½ cups flour","¼ tsp salt","2 cups sugar","½ cup butter","1½ tsp vanilla","6 tbsp cocoa","½ cup milk","4 eggs","¾ cup chopped walnuts"],"steps":["Preheat the oven to 350°F and grease a 9×13-inch baking pan.","Sift the flour, salt, sugar, and cocoa together into a large mixing bowl.","Melt the butter and let it cool slightly, then add it to the dry ingredients along with the milk, eggs, and vanilla. Beat until smooth and glossy, then fold in the chopped walnuts.","Spread the batter evenly into the prepared pan and bake at 350°F for 25 to 30 minutes, until a toothpick inserted near the center comes out with a few moist crumbs. Cool completely in the pan before slicing into 24 squares."],"vary":["Cut into 24 squares and store airtight up to 4 days, or freeze tightly wrapped squares after cooling."],"macro":null,"tagline":"Fudgy Pan Brownies, Big Batch","score":null,"sc":null,"diff":"Easy","time":"40 mins","extras":"Walnuts"},
  {"id":418,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Mix","servings":"13 Servings (1 Cup)","servN":13,"makes":["quick_mix"],"ing":["9 cups all-purpose flour","3 tbsp baking powder","¼ cup sugar","1 tbsp salt","2 cups shortening"],"steps":["Whisk the all-purpose flour, baking powder, sugar, and salt together in an extra-large mixing bowl until evenly distributed.","Cut in the shortening using a pastry blender or two knives until the mixture resembles fine cornmeal with no large lumps remaining.","Transfer to a large airtight container and store in a cool, dry pantry for up to 3 months (or refrigerate up to 6 months). Measure lightly by spooning into a measuring cup and leveling off."],"vary":["Use 3 cups of Quick Mix as the base for Grandma Wilberg's Oatmeal Cookies or Sugar Cookies, or ½ cup for Short Pie Rounds."],"macro":null,"tagline":"Homemade All-Purpose Baking Mix","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":419,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Whipped Cream Cranberry Apple Salad","servings":"10 Servings","servN":10,"ing":["1 lb fresh cranberries","2 apples","1½ cups sugar","1 cup diced celery","1 cup chopped walnuts","2 cups heavy whipping cream"],"steps":["Core and quarter the apples, then pulse the apples and fresh cranberries in a food processor (or run through a food grinder) until finely chopped.","Stir the sugar into the chopped cranberries and apples and let stand 15 minutes so the sugar dissolves into the juices.","Fold in the diced celery and chopped walnuts. In a chilled bowl, whip the heavy whipping cream to soft-to-medium peaks, then fold gently into the cranberry mixture. Chill at least 2 hours before serving."],"macro":null,"tagline":"Grind-and-Fold Fresh Cranberry Classic","score":null,"sc":null,"diff":"Easy","time":"2 hrs 20 mins","extras":"Fresh Cranberries, Celery, Walnuts, Heavy Whipping Cream"},
  {"id":420,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cream of Potato Soup","servings":"6 Servings","servN":6,"ing":["2 cups diced potatoes","1 tbsp onion","3 tbsp butter","3 tbsp flour","3 cups milk","½ tsp salt","¼ tsp black pepper"],"steps":["Place the diced potatoes in a saucepan, cover with water, and boil 10 to 12 minutes until fork-tender; drain well.","In a medium saucepan over medium heat, melt the butter and cook the chopped onion for 3 to 4 minutes until softened.","Stir in the flour and cook 1 minute, stirring constantly, until smooth and bubbly.","Gradually whisk in the milk and simmer over medium-low heat for 5 to 7 minutes, stirring often, until thickened into a smooth thin white sauce.","Fold in the cooked diced potatoes, salt, and black pepper. Heat gently for 3 to 5 minutes without boiling, then ladle into warm bowls and serve."],"macro":null,"tagline":"Velvety Homemade White Sauce Soup","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":421,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Double-Boiler Scrambled Eggs","servings":"2 Servings","servN":2,"ing":["4 eggs","½ cup milk","½ tsp salt","1 tsp butter"],"steps":["Bring an inch of water to a gentle simmer in the bottom of a double boiler.","Beat the eggs, milk, and salt together in the top pan with a fork or whisk until evenly blended.","Melt the butter in the top pan over the simmering water, pour in the egg mixture, and cook 6 to 8 minutes, scraping the bottom and sides slowly with a rubber spatula until soft, creamy curds form. Serve right away."],"macro":null,"tagline":"Gentle Double-Boiler Creamy Curds","score":null,"sc":null,"diff":"Easy","time":"12 mins","extras":null},
  {"id":422,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Raspberry Ice Cream","servings":"16 Servings","servN":16,"ing":["5 eggs","2 cups sugar","½ tsp salt","4 cups half and half","1 tbsp vanilla","2 pkgs (10 oz) frozen raspberries","3 cups milk"],"steps":["Beat eggs in a large bowl until light and pale yellow, then gradually whisk in sugar and salt until smooth.","Stir in half and half, vanilla, and thawed frozen raspberries with their juice.","Pour into a 1-gallon ice cream freezer canister and add milk until the canister is three-quarters full.","Churn in an ice cream maker according to manufacturer's directions, about 25 to 35 minutes, until thick and frozen, then ripen in the freezer 1 hour before scooping."],"vary":["Substitute 3 cups heavy whipping cream for the 4 cups half and half for a richer custard-style scoop."],"macro":null,"tagline":"Old-Fashioned Hand-Crank Berry Cream","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":"Half and Half, Frozen Raspberries"},
  {"id":423,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Enchilada Casserole","servings":"8 Servings","servN":8,"ing":["2 lb ground beef","1 onion","1 can (16 oz) refried beans","12 corn tortillas","2 tbsp oil","2 tomatoes","1 cup enchilada sauce","1 cup milk","1 cup cheddar cheese"],"steps":["Preheat the oven to 350°F and lightly grease a 9×13-inch baking dish.","Dice the onion and tomatoes, and shred the cheddar cheese. Brown the ground beef and diced onion in a large skillet over medium-high heat for 7 to 8 minutes until cooked through with no pink remaining (160°F); drain any excess fat. Stir in the refried beans until warm and set aside.","Warm the oil in a clean skillet over medium heat and lightly fry each corn tortilla for 10 to 15 seconds per side just to soften.","Spoon the beef-and-bean mixture down the center of each tortilla, top with diced tomatoes, roll up, and place seam-side down in the baking dish.","In a small saucepan over medium-low heat, simmer the enchilada sauce, milk, and shredded cheddar cheese for 4 to 5 minutes, stirring until smooth. Pour the sauce evenly over the rolled tortillas and bake at 350°F for 30 minutes until hot and bubbling."],"vary":["These assemble and freeze well before baking—thaw overnight in the fridge and add 10 to 15 minutes to the bake time."],"macro":null,"tagline":"Beef, Beans, Warm Cheese Sauce","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":"Corn Tortillas, Enchilada Sauce"},
  {"id":424,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apple Pudding","servings":"9 Servings","servN":9,"ing":["1 cup sugar (for batter)","¼ cup shortening","1 egg","1½ cups diced apples","1 tbsp lemon juice","1¼ cups all-purpose flour","1 tsp baking soda","1 tsp cinnamon","½ tsp ground nutmeg","½ tsp salt (for batter)","½ cup chopped walnuts","2 cups sugar (for caramel dip)","3 cups water (for caramel dip)","2 tbsp cornstarch","2 tbsp butter","1 tsp vanilla","½ tsp salt (for caramel dip)"],"steps":["Preheat the oven to 350°F and lightly grease an 8-inch or 9-inch square baking pan with a dab of the shortening.","Cream the 1 cup sugar and ¼ cup shortening together until light, then beat in the egg until smooth. Toss the diced apples with the lemon juice and stir into the batter.","Whisk together the all-purpose flour, baking soda, cinnamon, ground nutmeg, and ½ teaspoon salt, then stir into the apple mixture just until combined. Fold in the chopped walnuts.","Spread the batter into the prepared pan and bake at 350°F for 35 minutes, until a toothpick inserted in the center comes out clean.","For the caramel dip, melt 1 cup of the remaining sugar in a heavy saucepan over medium heat, stirring as it melts into a smooth amber syrup. Carefully pour in 2 cups of the water (it will bubble vigorously) and simmer, stirring, until all caramelized sugar dissolves.","Whisk the remaining 1 cup sugar and the cornstarch with the remaining 1 cup water until smooth, stir into the hot caramel, and boil 2 to 3 minutes until lightly thickened.","Remove the caramel dip from the heat and stir in the butter, vanilla, and remaining ½ teaspoon salt. Serve the apple pudding warm, spooned with warm caramel dip."],"vary":["Serve warm squares with whipped heavy cream or vanilla ice cream in addition to (or instead of) the caramel dip."],"macro":null,"tagline":"Spiced Apple Cake, Caramel Sauce","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":"Walnuts, Lemon"},
  {"id":425,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Oatmeal Cake","servings":"12 Servings (9×13 Cake)","servN":12,"ing":["1 cup oats","2½ cups water (divided)","½ cup shortening","1 cup sugar","2 cups brown sugar (divided)","2 eggs","1 tsp vanilla","1½ cups flour","½ tsp salt","1 tsp baking soda","1 tsp cinnamon","½ cup butter","6 tbsp evaporated milk","1 cup shredded coconut","1 cup chopped walnuts"],"steps":["Preheat the oven to 350°F and grease and flour a 9×13-inch baking pan. Place the oats in a heatproof bowl, pour 2 cups boiling water over them, and let stand 10 minutes until cooled slightly, then stir in the remaining ½ cup cool water.","Cream the shortening, white sugar, and 1 cup of the brown sugar together until fluffy. Beat in the eggs and vanilla, then stir in the soaked oats.","Whisk together the flour, salt, baking soda, and cinnamon; fold into the wet mixture until smooth. Pour into the prepared pan and bake at 350°F for 35 to 40 minutes, until the center springs back and a toothpick comes out clean.","For the frosting, combine the remaining 1 cup brown sugar, butter, and evaporated milk in a saucepan and bring to a boil over medium heat, stirring. Remove from heat, stir in the shredded coconut and chopped walnuts, and spread warm over the warm cake."],"vary":["A margin note on the card suggests trying 3 eggs for a slightly richer crumb, or broiling the frosted cake 1 to 2 minutes until bubbly and golden."],"macro":null,"tagline":"Warm Coconut-Nut Broiled Frosting Cake","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":"Shredded Coconut, Walnuts"},
  {"id":426,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Strawberry Danish Dessert Squares","servings":"12 Servings (9×13 Pan)","servN":12,"ing":["40 marshmallows","¾ cup milk","2 pkgs (4.75 oz) Danish Dessert mix","4 tbsp cornstarch","2 pkgs (10 oz) frozen fruit (strawberries)","3 cups water","1 cup heavy whipping cream","2 cups graham cracker crumbs","¼ cup powdered sugar"],"steps":["Combine the marshmallows and milk in a saucepan over low heat, stirring often until melted and smooth; set aside to cool completely to room temperature.","In a second saucepan, whisk the Danish Dessert mix and cornstarch together, then stir in the water and frozen fruit (strawberries). Bring to a boil over medium heat, stirring constantly, and cook 2 to 3 minutes until thick and glossy. Let cool completely.","Toss the graham cracker crumbs and powdered sugar together in a bowl, and press two-thirds of the mixture evenly across the bottom of a 9×13-inch dish.","Whip the heavy whipping cream in a chilled bowl until soft peaks form, then gently fold in the cooled marshmallow mixture until smooth.","Spread the white marshmallow-cream layer over the crumb base, spoon the cooled red strawberry layer evenly on top, and sprinkle with the remaining crumb mixture. Chill at least 2 hours before slicing into squares."],"macro":null,"tagline":"Layered Marshmallow & Berry Dessert","score":null,"sc":null,"diff":"Medium","time":"2 hrs 35 mins","extras":"Marshmallows, Danish Dessert mix, Heavy whipping cream, Graham cracker crumbs"},
  {"id":427,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Lemon Chiffon Pie","servings":"8 Servings (1 Pie)","servN":8,"ing":["1 pkg (0.25 oz) unflavored gelatin","¾ cup sugar","2 eggs","2 egg whites","1 tbsp lemon peel","¼ cup lemon juice","⅓ cup water","1 can (3.5 oz) flaked coconut","1 tbsp butter","¼ tsp salt"],"steps":["Separate the 2 eggs, placing the yolks in a small saucepan and combining the 2 whites with the 2 additional egg whites in a clean mixing bowl. In the saucepan, whisk the unflavored gelatin, ¼ cup of the sugar, egg yolks, grated lemon peel, lemon juice, and water. Cook over low heat, stirring constantly, until the mixture just begins to bubble around the edges. Refrigerate, stirring occasionally, until it mounds slightly from a spoon, then beat smooth.","Meanwhile, preheat oven to 350°F. Mix the flaked coconut and softened butter together in a 9-inch pie plate, press evenly over the bottom and up the sides, and bake 10 to 12 minutes until lightly toasted and golden. Cool completely.","Beat all 4 egg whites with the salt until foamy, then gradually beat in the remaining ½ cup sugar until stiff, glossy peaks form. Gently fold the beaten lemon gelatin custard into the meringue until smooth.","Mound the filling into the cooled coconut crust and refrigerate 3 to 4 hours until firmly set."],"macro":null,"tagline":"Light Lemon Custard in Toasted Coconut","score":null,"sc":null,"diff":"Medium","time":"3 hrs 45 mins","extras":"Flaked coconut, Lemon"},
  {"id":428,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Banana Cream Pie","servings":"8 Servings (1 Pie)","servN":8,"ing":["1½ cups graham cracker crumbs","1 cup sugar","½ cup butter","2 cups milk","⅓ cup flour","¼ tsp salt","2 eggs","1 tsp vanilla","3 ripe bananas"],"steps":["Preheat oven to 350°F. Mix graham cracker crumbs, ¼ cup of the sugar, and 6 tbsp melted butter; press firmly into the bottom and sides of a 9-inch pie plate and bake at 350°F for 10 minutes. Cool completely.","Scald 1¾ cups of the milk in a heavy saucepan over medium heat until tiny bubbles form around the edges.","Whisk flour, remaining ¾ cup sugar, and salt in a bowl; beat eggs with remaining ¼ cup milk, then whisk into the flour mixture until smooth.","Gradually pour the hot scalded milk into the egg mixture while whisking constantly to temper, then return everything to the saucepan.","Cook over medium-low heat, stirring constantly, 4 to 6 minutes until thick and bubbling. Remove from heat and stir in remaining 2 tbsp butter and vanilla; cool slightly.","Slice ripe bananas into the cooled crust, pour warm custard over top, cover surface with plastic wrap, and chill 3 hours until set."],"vary":["Top chilled pie with whipped cream and extra banana slices just before serving."],"macro":null,"tagline":"Velvety Stovetop Custard Filling","score":null,"sc":null,"diff":"Medium","time":"3 hrs 35 mins","extras":"Graham Cracker Crumbs"},
  {"id":429,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Five-Morning Sweet Pickles","servings":"64 Servings","servN":64,"ing":["12 cucumbers","1 cup salt","32 cups water","1 tbsp pickling alum","16 cups sugar","1 tbsp cinnamon","2 tbsp whole cloves","8 cups white vinegar"],"steps":["Wash the whole cucumbers and pack them into a large food-safe stoneware crock. Dissolve the salt in 16 cups of water, pour the brine over the cucumbers to cover completely, weight them down, and let brine in a cool spot for 2 weeks.","Drain the brined cucumbers and rinse them thoroughly in fresh cold water. Dissolve the pickling alum in the remaining 16 cups of water, pour over the cucumbers, and let soak overnight.","The next morning, drain and rinse the cucumbers in clear cold water, then slice into ¾-inch chunks (or leave very small cucumbers whole) and return them to the crock.","In a large stockpot, combine the white vinegar, whole cloves (tied in cheesecloth if desired), cinnamon, and 4 cups of the sugar. Bring to a boil over medium-high heat, stirring until dissolved, and pour the hot syrup over the sliced pickles.","On each of the next 4 mornings, drain the syrup back into the pot, stir in 3 more cups of sugar (adding the sugar gradually keeps the pickles from shriveling), bring to a full boil for 2 minutes, and pour hot over the pickles. By the fifth morning the pickles should be crisp, clear, and brittle; repeat one extra heating if needed before storing in the crock or clean jars."],"vary":["Adding the sugar in stages over five mornings draws water out gently so the cucumber rings stay crisp instead of wrinkling."],"macro":null,"tagline":"Crock-Brined Crisp Heirloom Pickles","score":null,"sc":null,"diff":"In-Depth","time":"19 days","extras":"Pickling Alum, Cloves"},
  {"id":430,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Million Dollar Fudge","servings":"36 Pieces","servN":36,"ing":["1 can (12 oz) evaporated milk","4½ cups sugar","1 jar (7 oz) marshmallow creme","½ cup butter","2 pkg (6 oz) chocolate chips","1 cup chopped walnuts","1 tsp vanilla"],"steps":["Grease a 9x13-inch baking pan using a small dab of the butter.","In a heavy 4-quart saucepan, combine the remaining butter, sugar, and evaporated milk over medium heat. Stir until the sugar dissolves, then bring to a full rolling boil and cook, stirring constantly, until a candy thermometer reaches 236°F (soft-ball stage, where a drop in cold water forms a soft ball), about 6 to 8 minutes.","Remove immediately from the heat and stir in the chocolate chips and marshmallow creme until completely melted and glossy. Fold in the chopped walnuts and vanilla.","Pour into the buttered pan, spread evenly, and let cool completely at room temperature (about 2 hours) before cutting into 36 squares."],"macro":null,"tagline":"Rich No-Fail Holiday Fudge","score":null,"sc":null,"diff":"Medium","time":"2 hrs 20 mins","extras":"Marshmallow Creme, Walnuts"},
  {"id":431,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Drop Cookies","servings":"24 Cookies","servN":24,"ing":["3 cups quick mix","1⅛ cups brown sugar","6 tbsp cocoa powder","½ cup milk","1 egg","1 tbsp vanilla"],"steps":["Preheat the oven to 350°F and lightly grease two baking sheets.","In a large bowl, stir together the quick mix, brown sugar, and cocoa powder until no cocoa streaks remain.","Whisk the milk, egg, and vanilla together in a small bowl, then stir into the dry ingredients until well blended.","Drop by rounded tablespoonfuls about 2 inches apart onto the prepared sheets and bake at 350°F for 12 to 15 minutes, until set around the edges and soft in the center."],"macro":null,"tagline":"Quick Mix Pantry Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":432,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Buttercream Frosting","servings":"12 Servings (Frosts One 2-Layer Cake)","servN":12,"ing":["1 pkg (16 oz) powdered sugar","2 tbsp shortening","1 tbsp light corn syrup","1 tsp vanilla","3 tbsp milk"],"steps":["Place the powdered sugar, shortening, light corn syrup, and vanilla (using clear vanilla if keeping the icing pure white) in a mixing bowl.","Add the milk 1 tablespoon at a time, beating well after each addition, until the frosting is smooth, creamy, and easy to spread."],"vary":["Use heavy cream instead of milk for a richer frosting, or swap in orange or lemon juice for a bright citrus glaze."],"macro":null,"tagline":"Classic Karo Syrup Frosting","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Light corn syrup"},
  {"id":433,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Pudding Cake","servings":"12 Servings","servN":12,"ing":["1 box (15.25 oz) chocolate cake mix","1 cup brown sugar","¼ cup cocoa powder","1 cup chopped walnuts","3 cups boiling water"],"steps":["Preheat oven to 350°F and lightly grease a 9×13-inch baking dish. Spread the dry chocolate cake mix evenly across the bottom of the dish.","Stir the brown sugar, cocoa powder, and chopped walnuts together and sprinkle evenly over the dry cake mix.","Slowly pour the 3 cups boiling water evenly over the top without stirring. Bake at 350°F for 40 to 45 minutes until the cake top is puffed and set with rich chocolate sauce bubbling underneath. Let stand 10 minutes before spooning warm into bowls."],"macro":null,"tagline":"Teresa Wilberg’s Self-Saucing Pudding Cake","score":null,"sc":null,"diff":"Easy","time":"55 mins","extras":"Walnuts"},
  {"id":434,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Clam Chowder","servings":"8 Servings","servN":8,"ing":["1 cup chopped onion","1 cup diced celery","2 cups diced potatoes","3 cans (6.5 oz) minced clams","1 cup water","¾ cup butter","¾ cup flour","4 cups half and half","2¼ tbsp vinegar","1½ tsp salt","¼ tsp black pepper"],"steps":["Drain clams, reserving all clam juice. Combine chopped onion, diced celery, diced potatoes, reserved clam juice, and water in a medium saucepan; cover and simmer 12 to 15 minutes until vegetables are tender.","Meanwhile, melt butter in a large soup pot over medium heat. Whisk in flour and cook 2 minutes, stirring constantly, to make a smooth roux.","Slowly pour in half and half while whisking constantly, and simmer 5 minutes until smooth and thickened.","Stir in the undrained vegetables, minced clams, vinegar, salt, and black pepper; heat gently 3 minutes until steaming hot without boiling."],"vary":["Use 4 cans (6.5 oz) minced clams for extra clam flavor, and red wine vinegar if on hand."],"macro":null,"tagline":"From Sandra’s Kitchen","score":null,"sc":null,"diff":"Medium","time":"40 mins","extras":"Celery, Minced Clams, Half and Half, Vinegar"},
  {"id":435,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Fudge","servings":"16 Squares","servN":16,"ing":["1 cup sugar","⅓ cup cocoa","¼ cup butter","1 tbsp light corn syrup","¼ cup milk","3 cups powdered sugar","1 tsp vanilla","½ cup chopped walnuts"],"steps":["Line or lightly butter an 8-inch square pan.","In a medium saucepan, whisk together the sugar and cocoa, then stir in the butter, light corn syrup, and milk.","Set over medium heat, bring to a full boil, and boil for 3 minutes, stirring constantly so the mixture does not scorch.","Remove from the heat and immediately stir in the powdered sugar, vanilla, and chopped walnuts until the sugar is completely dissolved and smooth. Turn out into the prepared pan, pat evenly into the corners, and cool completely before cutting into 16 squares."],"macro":null,"tagline":"Three-Minute Stovetop Chocolate Fudge","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Cocoa, Light Corn Syrup, Walnuts"},
  {"id":436,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Creamed Soup and Hot Cheese Sandwich","servings":"4 Servings","servN":4,"ing":["1 can (10.5 oz) cream of mushroom soup","1 cup shredded cheddar cheese","4 slices bread"],"steps":["Toast the 4 slices of bread until golden brown and crisp.","Meanwhile, warm the condensed cream of mushroom soup in a small saucepan over medium-low heat until hot and bubbling gently, about 3 to 4 minutes (do not add water).","Turn off the heat and stir in the shredded cheddar cheese gently until melted and smooth. Spoon the hot cheese sauce over the warm toast and serve immediately."],"vary":["Use condensed cream of celery, cream of asparagus, or cream of pea soup in place of cream of mushroom, as noted on the original card."],"macro":null,"tagline":"Ten-Minute Melted Cheese Toast","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":437,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hong Kong Sundaes","servings":"6 Servings","servN":6,"ing":["1 can (11 oz) mandarin oranges","1 tbsp cornstarch","1 can (8.75 oz) crushed pineapple","½ cup orange marmalade","½ tsp ground ginger","½ cup kumquats","3 cups vanilla ice cream"],"steps":["Drain the mandarin oranges, reserving ¼ cup of the syrup. In a small saucepan, whisk the reserved syrup and cornstarch together until completely smooth.","Stir in the undrained crushed pineapple, orange marmalade, and ground ginger. Cook over medium heat, stirring constantly, for 4 to 5 minutes until thickened and bubbling.","Remove from heat and fold in the mandarin oranges and sliced kumquats. Spoon warm or chilled sauce over scoops of vanilla ice cream."],"vary":["If preserved kumquats are unavailable, substitute ½ cup halved maraschino cherries or extra mandarin segments, or use 1 tsp minced candied ginger in place of ground ginger."],"macro":null,"tagline":"Elaine Wilberg's Spiced Citrus Sauce","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Mandarin Oranges, Canned Pineapple, Kumquats, Vanilla Ice Cream"},
  {"id":438,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pineapple & Cottage Cheese Salad","servings":"6 Servings","servN":6,"ing":["1 can (20 oz) crushed pineapple","2 cups cottage cheese"],"steps":["Drain the crushed pineapple well in a fine-mesh sieve, pressing lightly with a spoon to remove excess juice.","Combine the drained pineapple and cottage cheese in a chilled salad bowl, fold together gently, and serve cold."],"macro":null,"tagline":"Two-Ingredient Chilled Side Salad","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Crushed pineapple"},
  {"id":439,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Steam-Fried Eggs","servings":"2 Servings (4 Eggs)","servN":2,"ing":["4 eggs","2 tsp water"],"steps":["Warm a non-stick frying pan over medium heat until moderately hot, then pour in the water (½ teaspoon per egg).","Crack the eggs into the pan, cover immediately with a tight-fitting lid, and reduce the heat to low.","Cook gently 3 to 4 minutes for soft yolks or 5 to 6 minutes for firm yolks, until the whites are set and tender."],"vary":["Swap the water for 1 tbsp heavy cream or butter for richer steam-basted eggs."],"macro":null,"tagline":"Tender Covered-Skillet Low-Heat Eggs","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":null},
  {"id":440,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chili Beans","servings":"10 Servings","servN":10,"ing":["2 lbs ground beef","2 lbs pinto beans","1 cup water","3 tsp garlic salt","6 tsp paprika","1 tsp ground cumin","6 tsp chili powder","1 tsp black pepper","1 tsp salt"],"steps":["Place cooked pinto beans and water in a large Dutch oven over medium-low heat.","Crumble raw ground beef directly into the hot beans along with garlic salt, paprika, ground cumin, chili powder, black pepper, and salt, stirring well to break up the meat.","Bring to a gentle simmer and cook uncovered 25 to 30 minutes, stirring frequently, until the ground beef is cooked through with no pink remaining (160°F) and the chili is thick and rich."],"vary":["If you prefer browned beef, brown the ground beef in a skillet first (160°F), drain, then simmer with the beans and spices for 15 minutes."],"macro":null,"tagline":"Leah Ward’s 1982 Chili","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Paprika, Ground Cumin, Chili Powder"},
  {"id":441,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chocolate Chip Oatmeal Cookies","servings":"36 Cookies","servN":36,"ing":["1 cup shortening","1 cup brown sugar","1 cup sugar","2 eggs","2 tbsp water","1 tsp vanilla","1 tsp baking soda","½ tsp salt","½ cup chopped walnuts","3 cups rolled oats","1 pkg (12 oz) chocolate chips","1½ cups flour"],"steps":["Preheat the oven to 350°F and lightly grease baking sheets.","Cream the shortening, brown sugar, and white sugar together until light and fluffy. Add the eggs one at a time, beating well after each, then stir in the water and vanilla.","Whisk together the flour, baking soda, and salt, then stir into the creamed mixture along with the rolled oats, chocolate chips, and chopped walnuts until evenly combined.","Drop by rounded spoonfuls onto the prepared baking sheets and bake at 350°F for 7 to 8 minutes—pull them while they still look pale, as they firm up as they cool on the sheet for 3 minutes before transferring to a rack."],"macro":null,"tagline":"Teresa Bradley’s Card","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Shortening, Walnuts, Chocolate Chips"},
  {"id":442,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cranberry Holiday Salad","servings":"8 Servings","servN":8,"ing":["1 packet (0.25 oz) unflavored gelatin","¼ cup water","2 pkg (3 oz) cream cheese","¼ tsp salt","1 tbsp lemon juice","2 drops red food coloring","1 can (8 oz) crushed pineapple","1 can (16 oz) whole cranberry sauce","½ cup heavy whipping cream"],"steps":["Sprinkle the unflavored gelatin over ¼ cup cold water in a small saucepan and let soften 5 minutes, then warm over low heat, stirring constantly until dissolved, 1 to 2 minutes.","Beat the softened cream cheese in a mixing bowl while slowly pouring in the warm gelatin mixture until smooth and creamy. Stir in the salt, lemon juice, red food coloring, undrained crushed pineapple, and whole cranberry sauce.","In a chilled bowl, whip the heavy whipping cream until soft peaks form, then gently fold it into the cranberry mixture.","Pour into a 2-quart ring mold or 8x8-inch dish and refrigerate at least 4 hours until firmly set before slicing or unmolding."],"vary":["Unmold onto crisp lettuce leaves for a classic holiday table presentation."],"macro":null,"tagline":"Mrs. Owen D. Caldwell’s Molded Salad","score":null,"sc":null,"diff":"Easy","time":"4 hrs 20 mins","extras":"Cream Cheese, Lemon, Crushed Pineapple, Cranberry Sauce, Heavy Cream"},
  {"id":443,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Rice & Popcorn Balls","servings":"12 Popcorn Balls","servN":12,"ing":["2 cups sugar","⅔ cup light corn syrup","⅔ cup water","2 tbsp vinegar","2 tsp cream of tartar","2 tbsp butter","2 tsp vanilla","⅓ tsp baking soda","12 cups popped popcorn"],"steps":["Place the popped popcorn in a very large, lightly buttered bowl and pick out any unpopped kernels.","In a heavy saucepan over medium heat, combine the sugar, light corn syrup, water, vinegar, and cream of tartar. Stir until the sugar dissolves, then bring to a boil and cook without stirring for 12 to 15 minutes until it reaches the hard-ball stage (250°F–260°F, when a drop forms a firm ball in cold water).","Remove from heat and immediately stir in the butter, vanilla, and baking soda (the syrup will foam). Pour slowly over the popcorn, tossing with a wooden spoon until evenly coated. When cool enough to touch, lightly butter your hands and shape into 12 firm balls."],"vary":["Swap 12 cups puffed rice cereal for the popped popcorn to make crisp rice balls, or scale the ingredients by 1.5× as noted on the original card."],"macro":null,"tagline":"Old-Fashioned Hard-Ball Candy Glaze","score":null,"sc":null,"diff":"Medium","time":"30 mins","extras":"Corn Syrup, Popcorn"},
  {"id":444,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Fabulous Fudge","servings":"40 Pieces (About 5 Pounds)","servN":40,"ing":["3 cups chocolate chips","1 cup butter","1 pkg (10 oz) miniature marshmallows","2 cups chopped nuts","4½ cups sugar","1 can (12 oz) evaporated milk","1 tbsp vanilla"],"steps":["Lightly butter a 9×13-inch baking pan using a dab of the butter. Combine the chocolate chips, miniature marshmallows, and chopped nuts in a large heatproof bowl.","In a heavy 4-quart saucepan, combine the sugar, evaporated milk, and remaining softened butter. Bring to a full rolling boil over medium heat, stirring constantly, and boil for 6 minutes.","Remove the saucepan from heat and immediately stir in the vanilla.","Pour the hot syrup over the chocolate chips, marshmallows, and nuts in the bowl. Stir vigorously until the chocolate and marshmallows melt completely and the fudge is smooth and glossy.","Spread evenly into the buttered pan and let stand at room temperature for 24 hours to ripen and firm up before cutting into squares."],"vary":["For a half batch (matching the pencil notes on Grandma's card), halve every ingredient and press into a buttered 8×8-inch pan."],"macro":null,"tagline":"Five-Pound Holiday Cream Fudge","score":null,"sc":null,"diff":"Medium","time":"20 mins","extras":"Miniature marshmallows, Chopped nuts"},
  {"id":445,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Swedish Meatballs","servings":"8 Servings","servN":8,"ing":["2 lb ground beef","3 tbsp chopped onion","3 tbsp chopped green bell pepper","⅜ cup cornmeal","1½ tsp chili powder","¾ tsp yellow mustard","1½ tsp salt","⅛ tsp black pepper","¾ cup milk","1 egg","¼ cup flour","2 tbsp oil","1 cup ketchup","¾ cup water","1½ tbsp worcestershire sauce"],"steps":["In a large bowl, mix the ground beef, chopped onion, green bell pepper, cornmeal, chili powder, mustard, salt, black pepper, milk, and egg until evenly combined.","Shape into 1-inch meatballs and roll lightly in the flour to coat.","Heat the oil in a large skillet over medium-high heat and brown the meatballs in batches 8 to 10 minutes until browned all over and cooked through to 160°F; drain excess fat.","Whisk the ketchup, water, and Worcestershire sauce together, pour over the meatballs, and simmer gently over low heat 15 to 20 minutes until the sauce thickens and glazes the meatballs."],"macro":null,"tagline":"Tangy Ketchup-Glazed Skillet Meatballs","score":null,"sc":null,"diff":"Medium","time":"45 mins","extras":null},
  {"id":446,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Popcorn","servings":"6 Servings (12 Cups)","servN":6,"ing":["⅓ cup oil","½ cup popcorn kernels"],"steps":["Pour oil into a heavy skillet or Dutch oven, cover with a lid, and heat over high heat (or 450°F on a thermostatically controlled burner) until shimmering hot, about 3 minutes.","Pour in popcorn kernels, shake to coat evenly in the oil, and cover immediately.","As soon as the kernels begin popping rapidly, turn the heat off and leave the covered pan on the warm burner 2 to 3 minutes until popping stops."],"vary":["Toss hot popped corn with melted butter and salt to taste."],"macro":null,"tagline":"Sandra Wilberg’s Skillet Popcorn","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Popcorn Kernels"},
  {"id":447,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cinnamon Sugar Popcorn","servings":"6 Servings","servN":6,"ing":["½ cup sugar","1 tbsp cinnamon","12 cups popped popcorn","½ cup butter"],"steps":["Place the unsalted popped popcorn in a very large bowl.","Melt the butter in a small saucepan over low heat for 2 minutes until fluid, and stir the sugar and cinnamon together in a small cup.","Drizzle the melted butter evenly over the popcorn while tossing, then sprinkle on the cinnamon-sugar mixture and toss again until every kernel is lightly coated."],"macro":null,"tagline":"Sandra Wilberg’s Popcorn Flyer","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Popped Popcorn"},
  {"id":448,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Onion Popcorn","servings":"6 Servings (2 Cups)","servN":6,"ing":["1 pkg (1 oz) dry onion soup mix","½ cup butter","12 cups popped popcorn"],"steps":["Melt the butter in a small saucepan over low heat and stir in the dry onion soup mix until blended.","Place the popped popcorn in a very large bowl, drizzle the seasoned butter evenly over top, and toss well until every kernel is coated. Serve warm."],"macro":null,"tagline":"Sandra Wilberg’s Savory Popcorn","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Popped Popcorn"},
  {"id":449,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Salted Popcorn","servings":"4 Servings (2 Cups Each)","servN":4,"ing":["8 cups popped popcorn","2 tbsp butter","1 tsp seasoning salt"],"steps":["Melt the butter in a small saucepan over low heat or in a microwave-safe bowl.","Place the warm popped popcorn in a large serving bowl, drizzle with the melted butter, and sprinkle evenly with the seasoning salt. Toss well until every kernel is coated and serve right away."],"macro":null,"tagline":"Sandra Wilberg's Seasoned Popcorn","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Popcorn"},
  {"id":450,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Devil's Food Drop Cookies","servings":"36 Cookies","servN":36,"ing":["1 cup butter","2 cups brown sugar","2 eggs","8 tbsp cocoa","1 tsp vanilla","4 cups flour","1 tsp baking soda","½ tsp salt","1½ cups sour cream","1 cup chopped nuts"],"steps":["Preheat oven to 350°F and line two baking sheets with parchment paper.","Cream the butter and brown sugar together in a large bowl until light and fluffy. Beat in the eggs and vanilla until smooth, then stir in the cocoa.","Whisk the flour, baking soda, and salt together in a separate bowl, then add to the batter alternately with the sour cream, mixing just until no dry streaks remain. Fold in the chopped nuts.","Drop by rounded tablespoonfuls about 2 inches apart onto the prepared baking sheets and bake at 350°F for 10 to 12 minutes, until the tops spring back lightly when touched. Cool on wire racks."],"macro":null,"tagline":"Elaine Wilberg’s Sour Cream Cookies","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Chopped nuts"},
  {"id":451,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Grandma Wilberg's Cinnamon Rolls","servings":"24 Rolls","servN":24,"ing":["2 cups milk","1 cup butter","3 eggs","2 pkgs (0.25 oz) active dry yeast","1 cup sugar","½ cup warm water","8 cups flour","1 tbsp salt","2 tbsp cinnamon"],"steps":["Scald the milk in a saucepan, stir in ½ cup of the butter until melted, and cool to lukewarm. Meanwhile, dissolve the active dry yeast and ½ cup of the sugar in the warm water and let stand 5 to 10 minutes until foamy.","Place the flour in a large mixing bowl, make a well in the center, and add the salt, beaten eggs, lukewarm milk mixture, and yeast mixture. Stir well to form a soft dough, then knead 6 to 8 minutes until smooth and elastic.","Place in a greased bowl, cover, and let rise in a warm spot 1 hour until doubled. Punch down, turn onto a lightly floured board, knead briefly, and let rise 30 minutes more.","Divide the dough in half and roll each half into a rectangle. Spread with the remaining ½ cup softened butter, sprinkle with the remaining ½ cup sugar and the cinnamon, roll up tightly, and slice into 1-inch rolls. Arrange in two greased 9×13-inch pans and let puff 15 minutes.","Preheat oven to 375°F and bake 15 to 20 minutes until golden brown and baked through."],"macro":null,"tagline":"Soft Double-Rise Cinnamon Swirl Rolls","score":null,"sc":null,"diff":"In-Depth","time":"2 hrs 30 mins","extras":null},
  {"id":452,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chicken Casserole","servings":"8 Servings","servN":8,"ing":["3 lbs bone-in chicken","5 cups water","6 cups bread","1 cup butter","1½ tsp ground sage","¾ tsp salt","¼ tsp black pepper","4½ cups chicken broth","3 tbsp grated onion","½ cup flour"],"steps":["Place bone-in chicken in a large pot with water, cover, and simmer 45 to 55 minutes until tender and cooked through (165°F). Cool slightly, remove skin and bones, and cut meat into bite-sized pieces.","Preheat oven to 350°F and coat a 9x13-inch baking dish with 1 tbsp of the butter. Arrange chicken pieces in the bottom.","In a large bowl, toss cubed bread with ¾ cup melted butter, ground sage, salt, black pepper, grated onion, and ½ cup of the chicken broth; spoon evenly over the chicken.","Melt remaining 3 tbsp butter in a saucepan over medium heat, whisk in flour and cook 1 minute, then gradually whisk in remaining 4 cups chicken broth and cook 5 to 7 minutes until thickened. Pour gravy over the dressing.","Bake at 350°F for 30 minutes until bubbling hot and golden on top."],"vary":["Use 4 cups shredded cooked chicken breast and homemade broth from boiling the chicken to save a step."],"macro":null,"tagline":"Heirloom Chicken, Dressing & Gravy","score":null,"sc":null,"diff":"Medium","time":"1 hr 35 mins","extras":"Bone-in Chicken, Chicken Broth"},
  {"id":453,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Minute Tapioca Pudding","servings":"4 Servings","servN":4,"ing":["1 egg","⅓ cup sugar","3 tbsp minute tapioca","⅛ tsp salt","2¾ cups milk","¾ tsp vanilla"],"steps":["Lightly beat the egg in a medium saucepan, then whisk in the sugar, minute tapioca, salt, and milk. Let the mixture stand for 5 minutes so the tapioca begins to hydrate.","Cook over medium heat, stirring constantly, for 6 to 8 minutes until the mixture just comes to a full rolling boil and slightly thickens.","Remove from the heat and stir in the vanilla. Let cool slightly—the pudding thickens further as it stands—and serve warm or chilled."],"macro":null,"tagline":"Classic Stovetop Pearl Custard","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Minute Tapioca"},
  {"id":454,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"White Sauce","servings":"4 Servings (¼ Cup)","servN":4,"ing":["2 tbsp butter","2 tbsp all-purpose flour","¼ tsp salt","1 cup milk"],"steps":["Melt the butter in a small saucepan over medium heat.","Whisk in the all-purpose flour and salt and cook, whisking constantly, for 1 minute until smooth and bubbling without browning.","Gradually whisk in the milk in a steady stream and cook over medium heat, stirring constantly, for 3 to 5 minutes until thickened, smooth, and glossy."],"vary":["Thin White Sauce (1½ cups for cream soups): Use 1 tbsp butter, 1 tbsp flour, ¼ tsp salt, and 1½ cups milk.","Thick White Sauce (1 cup for croquettes or soufflé bases): Use 3 tbsp butter, 4 tbsp flour, ¼ tsp salt, and 1 cup milk."],"macro":null,"tagline":"Classic Pantry Roux Base","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":455,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Velvet Tomato Cream Soup","servings":"4 Servings","servN":4,"ing":["1 can (20 oz) diced tomatoes","2 tbsp onion","1 tsp salt","1 tsp sugar","¼ tsp black pepper","¼ tsp cinnamon","⅛ tsp ground cloves","2 tbsp butter","2 tbsp flour","2 cups milk"],"steps":["In a saucepan, combine the diced tomatoes, chopped onion, salt, sugar, black pepper, cinnamon, and ground cloves. Bring to a simmer over medium heat and cook for 10 minutes, then press through a fine-mesh strainer, discarding the solids.","In a clean saucepan over medium heat, melt the butter and whisk in the flour; cook 1 minute until bubbling. Gradually whisk in the milk and cook, stirring constantly, for 4 to 5 minutes until thickened into a smooth white sauce.","Slowly pour the hot strained tomato mixture into the hot white sauce, stirring constantly so the soup stays velvety without curdling. Serve hot."],"macro":null,"tagline":"Warm Spiced Tomato Bisque","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":456,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Scrambled Eggs with Cottage Cheese","servings":"4 Servings","servN":4,"ing":["1 tbsp butter","½ tsp salt","¼ cup milk","6 eggs","¾ cup cottage cheese","4 slices bread"],"steps":["Toast the bread slices until golden brown and arrange on warm plates.","Whisk the eggs, milk, and salt together in a bowl until lightly beaten.","Melt the butter in a skillet over medium-low heat. Pour in the egg mixture and cook slowly, stirring gently and constantly, for 3 to 4 minutes until the eggs begin to thicken into soft curds.","Fold in the cottage cheese and cook 30 seconds more until warmed through while the eggs remain soft and glossy. Spoon onto the warm toast and serve at once."],"vary":["Card note: substitute ½ cup shredded cheddar cheese for the cottage cheese."],"macro":null,"tagline":"Creamy Curd Scramble on Toast","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":457,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apple Betty","servings":"6 Servings","servN":6,"ing":["4 cups sliced apple","¼ cup orange juice","1 cup sugar","¾ cup flour","½ tsp cinnamon","¼ tsp nutmeg","⅛ tsp salt","½ cup butter"],"steps":["Preheat oven to 375°F and butter a 9-inch pie plate. Mound the sliced apples in the dish and sprinkle evenly with orange juice.","Whisk the sugar, flour, cinnamon, nutmeg, and salt together in a bowl, then cut in the butter with a pastry blender or fork until coarse crumbs form.","Sprinkle the crumb topping evenly over the apples and bake at 375°F for 45 minutes until the apples are tender and the topping is crisp and golden."],"vary":["Serve warm with a splash of heavy cream or a scoop of vanilla ice cream."],"macro":null,"tagline":"Crisp-Topped Cinnamon Baked Apples","score":null,"sc":null,"diff":"Easy","time":"1 hr","extras":"Orange juice"},
  {"id":458,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Broccoli Soup","servings":"10 Servings","servN":10,"ing":["1 medium onion","3 tbsp butter","6 chicken bouillon cubes","5 cups water","1 pkg (8 oz) rotini","1 tsp salt","1½ lbs broccoli","¼ tsp garlic powder","6 cups milk","1 lb Velveeta"],"steps":["Melt butter in a large soup pot over medium heat and sauté chopped onion for 5 minutes until softened.","Add water and chicken bouillon cubes, bring to a boil, and cook 3 minutes until cubes dissolve.","Stir in rotini and salt and boil 5 minutes, then add chopped broccoli and garlic powder and cook 4 to 5 minutes more until broccoli is bright tender and pasta is al dente.","Reduce heat to low, pour in milk, and add cubed Velveeta, stirring gently 5 minutes until cheese melts completely into a creamy soup without boiling."],"vary":["Substitute 2 pkgs (10 oz) frozen chopped broccoli for fresh broccoli."],"macro":null,"tagline":"Creamy Cheese & Corkscrew Noodle Soup","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Chicken Bouillon, Garlic Powder, Velveeta"},
  {"id":459,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pecan Roll","servings":"16 Slices","servN":16,"ing":["1 pkg (11 oz) butterscotch chips","⅓ cup sweetened condensed milk","½ tsp vanilla","⅓ cup chopped pecans","¾ cup pecans","1 egg white"],"steps":["Place the butterscotch chips and sweetened condensed milk in a heatproof bowl set over a pan of hot (not boiling) water, stirring until melted and smooth, about 5 minutes.","Remove from the heat and stir in the vanilla and the ⅓ cup chopped pecans. Refrigerate for 30 to 40 minutes until chilled and firm enough to handle.","Turn the mixture out onto a sheet of waxed paper and shape into a smooth log about 2 inches thick. Lightly beat the egg white, brush it over the outside of the roll, and press the ¾ cup pecan halves evenly onto the surface.","Wrap tightly in waxed paper and chill at least 2 hours until completely firm before slicing into 16 rounds."],"macro":null,"tagline":"Butterscotch Candy Pecan Log","score":null,"sc":null,"diff":"Medium","time":"2 hrs 50 mins","extras":"Butterscotch Chips, Sweetened Condensed Milk, Pecans"},
  {"id":460,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Sweet Pickles","servings":"56 Servings (¼ Pint)","servN":56,"ing":["7 lbs cucumbers","3 cups pickling lime","8 cups white vinegar","4½ lbs sugar","1 tsp salt","1 tsp celery seed","1 tsp pickling spice","1 tsp whole cloves","½ tsp green food coloring"],"steps":["Slice or chunk the cucumbers. Dissolve the pickling lime in 2 gallons of cold water in a large crock or food-safe plastic bucket, submerge the cucumbers, cover, and soak overnight (12 to 24 hours).","The next day, drain the cucumbers and rinse thoroughly through several changes of cold water until the water runs clear and no trace of lime remains.","Combine the white vinegar, sugar, salt, celery seed, pickling spice, and whole cloves, stirring until mixed. Pour the cold syrup over the rinsed cucumbers, cover, and let stand overnight.","On the third day, transfer the cucumbers and syrup to a large stockpot, bring to a boil over medium-high heat, and boil gently for 30 to 40 minutes until the cucumbers turn translucent.","Divide the green food coloring among 14 sterilized pint jars (about 2 drops per jar), pack in the hot pickles and syrup, and seal hot (or process 10 minutes in a boiling-water bath)."],"macro":null,"tagline":"Crisp Three-Day Lime Pickles","score":null,"sc":null,"diff":"In-Depth","time":"48 hrs","extras":"Pickling Lime, Food Coloring"},
  {"id":461,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Picnic Cake","servings":"12 Servings (9×13 Cake)","servN":12,"ing":["½ cup chopped dates","1½ cups water","1 tsp baking soda","1 cup sugar","¾ cup butter","2 eggs","½ tsp vanilla","1¾ cups flour","1 tsp cinnamon","¼ tsp salt","½ cup brown sugar","½ cup chopped walnuts","½ cup chocolate chips"],"steps":["Preheat the oven to 350°F and grease and flour a 9×13-inch baking pan. Place the chopped dates and baking soda in a small bowl, pour 1½ cups boiling water over them, and set aside to cool.","In a mixing bowl, cream the white sugar and butter until light. Beat in the eggs and vanilla.","Whisk together the flour, cinnamon, and salt. Stir the dry ingredients into the creamed mixture alternately with the cooled date mixture until smooth, then pour into the prepared pan.","Sprinkle the brown sugar, chopped walnuts, and chocolate chips evenly over the batter. Bake at 350°F for 30 to 35 minutes, until a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Date-Nut Cake with Chocolate Topping","score":null,"sc":null,"diff":"Easy","time":"50 mins","extras":"Dates, Walnuts"},
  {"id":462,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Manti Temple Soup","servings":"8 Servings","servN":8,"ing":["1 lb ground beef","1 cup carrots","1 small onion","1 can (46 oz) vegetable juice","1 can (15.5 oz) pork and beans","1 can (19 oz) minestrone soup","1 can (14.5 oz) diced tomatoes","¼ cup sugar","24 soda crackers"],"steps":["In a large Dutch oven or soup pot over medium-high heat, cook the ground beef, sliced carrots, and chopped small onion together for 7 to 9 minutes, breaking up the meat with a spoon, until the beef is browned with no pink remaining (160°F) and the carrots start to soften. Drain off excess fat.","Stir in the vegetable juice, pork and beans, minestrone soup, diced tomatoes, and sugar.","Bring to a gentle simmer over medium heat and cook for 15 to 20 minutes, stirring occasionally, until the carrots are tender. Ladle into bowls and serve hot with the soda crackers."],"macro":null,"tagline":"Hearty Family-Size Vegetable Beef Soup","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Vegetable juice, Minestrone soup, Soda crackers"},
  {"id":463,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Tomato Salad (Tomatensalat)","servings":"6 Servings","servN":6,"ing":["6 large tomatoes","1 green bell pepper (diced)","1 onion (minced)","3 tbsp vinegar","1 tbsp oil","½ tsp salt","¼ tsp black pepper"],"steps":["Cube the tomatoes into bite-size pieces and place them in a serving bowl with the diced green bell pepper and minced onion.","Whisk the vinegar, oil, salt, and black pepper together, pour over the tomatoes, and toss gently to coat before serving."],"macro":null,"tagline":"Crisp German-Style Vinegar Tomato Salad","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":null},
  {"id":464,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hah-Scuba-Loba-Litch (Russia)","servings":"10 Servings","servN":10,"ing":["½ cup rice","3 cups water","1 lb ground beef","5 medium carrots","2 cups chopped celery","1 can (10.5 oz) tomato soup","1 medium onion","1 tsp salt"],"steps":["Preheat oven to 425°F. Simmer rice in 1 cup of the water with ¼ tsp of the salt for 15 minutes until just tender.","Brown ground beef in a skillet over medium-high heat 6 to 8 minutes until no pink remains (160°F); drain excess fat.","Simmer sliced carrots and chopped celery in remaining 2 cups water with ¼ tsp salt for 8 minutes until crisp-tender. Drain, reserving 1¼ cups of the cooking water, and whisk reserved water into tomato soup.","In a 9x13-inch baking dish, layer cooked rice, carrots and celery, ground beef, and sliced onion, sprinkling remaining ½ tsp salt lightly between layers.","Pour diluted tomato soup evenly over the top, cover tightly with foil, and bake at 425°F for 1 hour 30 minutes until vegetables are tender and casserole is bubbling."],"vary":["Uncover during the last 10 minutes of baking for a thicker, browned top."],"macro":null,"tagline":"Layered Beef, Rice & Vegetable Bake","score":null,"sc":null,"diff":"Medium","time":"1 hr 55 mins","extras":"Celery"},
  {"id":465,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Tacos (Mexico)","servings":"4 Servings","servN":4,"ing":["1 lb ground beef","½ tsp salt","1 tsp garlic salt","⅛ tsp black pepper","1 can (8 oz) tomato sauce","12 corn tortillas","½ cup oil","1 cup cheddar cheese","2 cups shredded lettuce","½ cup salsa"],"steps":["In a skillet over medium-high heat, brown the ground beef with the salt, garlic salt, and black pepper for 6 to 8 minutes until no pink remains (160°F). Pour in the tomato sauce and simmer over low heat for 10 to 15 minutes until thickened.","Heat the oil in a separate skillet to 350°F over medium-high heat.","Spoon a generous tablespoon of the beef filling into each corn tortilla, fold in half, and set the folded edge into the hot oil first until it holds its shape. Fry each side for 1 to 2 minutes until crisp and golden, then drain on paper towels.","Shred the cheddar cheese and serve the warm crisp tacos stuffed with cheese, finely shredded lettuce, and salsa."],"macro":null,"tagline":"Crisp Skillet-Fried Beef Tacos","score":null,"sc":null,"diff":"Medium","time":"35 mins","extras":"Garlic Salt, Corn Tortillas"},
  {"id":466,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Danish Dessert","servings":"12 Servings","servN":12,"ing":["1 cup all-purpose flour","½ cup butter","¼ cup brown sugar","¼ tsp salt","2 pkg (4.75 oz) Danish Dessert mix","2 tbsp sugar (for pudding)","1 pkg (8 oz) cream cheese","¼ cup sugar (for filling)","½ cup chopped walnuts","3 tbsp milk","2 bananas","1 cup heavy whipping cream"],"steps":["Preheat the oven to 375°F. Mix the all-purpose flour, butter, brown sugar, and salt until crumbly, then press firmly into the bottom of a 12x8-inch (or 9x13-inch) baking pan. Bake at 375°F for 12 minutes until lightly browned; cool completely.","In a saucepan, whisk the Danish Dessert mix with 3½ cups cold water, bring to a boil over medium heat, and boil 1 minute, stirring constantly. Stir in 2 tablespoons sugar and set aside to cool completely.","Beat the softened cream cheese with ¼ cup sugar, chopped walnuts, and 3 tablespoons milk until smooth and spreadable, then spread evenly over the cooled crust.","Slice the bananas evenly over the cream cheese layer, then spread the cooled Danish Dessert pudding over the bananas.","Whip the heavy whipping cream until soft peaks form and spread or dollop over the top before slicing into 12 squares."],"macro":null,"tagline":"Denmark-Inspired Layered Berry Squares","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":"Danish Dessert Mix, Cream Cheese, Walnuts, Heavy Cream"},
  {"id":467,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ting-A-Lings","servings":"42 Clusters","servN":42,"ing":["2 pkgs (6 oz) chocolate chips","4 cups puffed corn cereal"],"steps":["Melt the chocolate chips in a saucepan over very low heat (or in a double boiler), stirring frequently until smooth, about 5 minutes; remove from heat and let cool slightly.","Gently fold in the puffed corn cereal until every piece is evenly coated in chocolate.","Drop by tablespoonfuls onto waxed-paper-lined baking sheets and refrigerate for about 2 hours, until the chocolate clusters are completely firm."],"vary":["Works equally well with crispy wheat flakes (Wheaties) or toasted oat O's (Cheerios), as noted on the original Utah Power & Light card."],"macro":null,"tagline":"Marilyn Manning's No-Bake Chocolate Clusters","score":null,"sc":null,"diff":"Easy","time":"2 hrs 10 mins","extras":"Cornflakes / Crispy Cereal"},
  {"id":468,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Herbed Potato Chips","servings":"4 Servings","servN":4,"ing":["1 pkg (4 oz) potato chips","½ cup American cheese","¼ tsp dried thyme"],"steps":["Preheat oven to 350°F and spread the potato chips in an even layer on a rimmed baking sheet.","Scatter the shredded American cheese evenly over the chips and sprinkle lightly with dried thyme.","Bake at 350°F for 5 minutes, just until the cheese melts and bubbles. Serve hot right away."],"vary":["Swap the dried thyme for ¼ teaspoon dried basil or dried marjoram."],"macro":null,"tagline":"Marilyn Manning’s Utah Power Card","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Potato chips, American cheese"},
  {"id":469,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Western Pizzas","servings":"6 Servings","servN":6,"ing":["¾ cup bbq sauce","3 tbsp butter","¼ tsp dried oregano","6 english muffins (split and toasted)","8 oz cheddar cheese (shredded)","4 slices bacon (cooked and crumbled)"],"steps":["Arrange the split, toasted English muffins cut-side up on a baking sheet.","Warm the BBQ sauce, butter, and dried oregano in a small saucepan over low heat for 2 to 3 minutes until the butter melts and the sauce is smooth.","Spoon the warm sauce over the muffin halves, top with the shredded cheddar cheese, and broil 2 to 3 minutes until the cheese is melted and bubbling. Scatter the crisp crumbled bacon over the top and serve hot."],"vary":["Top with ¼ cup sliced ripe olives in place of (or alongside) the bacon."],"macro":null,"tagline":"Marilyn Manning’s Broiled Muffin Pizzas","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"English muffins, Bacon"},
  {"id":470,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Honey Crisps","servings":"6 Servings","servN":6,"ing":["6 slices bread","3 tbsp butter","3 tbsp honey"],"steps":["Turn on the oven broiler and trim the crusts from the bread slices.","Spread each slice evenly with softened butter, then drizzle lightly with honey (about ½ tbsp per slice).","Arrange on a baking sheet and broil 4 to 5 inches from the heat for 2 to 3 minutes, watching closely, until bubbling and crisp-golden on top."],"vary":["Sprinkle with a pinch of cinnamon before broiling for cinnamon-honey toast."],"macro":null,"tagline":"Utah Power & Light Broiled Toast","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":null},
  {"id":471,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Buttered Cheese Kix","servings":"5 Servings","servN":5,"ing":["⅓ cup butter","⅓ cup grated Parmesan cheese","5 cups Kix","½ tsp salt"],"steps":["Melt the butter in a heavy skillet over low heat for 2 minutes, then remove from the heat.","Stir in the grated Parmesan cheese, then add the Kix cereal and sprinkle with salt. Toss gently until every puff is evenly coated with butter and cheese."],"macro":null,"tagline":"Marilyn Manning, Utah Power & Light","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Parmesan Cheese, Kix"},
  {"id":472,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Nuts 'n Bolts","servings":"12 Servings (½ Cup)","servN":12,"ing":["¼ cup butter","½ tsp Worcestershire sauce","¼ tsp garlic salt","¼ tsp celery salt","½ tsp salt","1½ cups Kix","1 cup toasted oat cereal","2 cups cheese crackers","2 cups pretzel sticks","8 oz mixed nuts"],"steps":["Preheat the oven to 250°F.","Combine the Kix, toasted oat cereal, cheese crackers, pretzel sticks, and mixed nuts in a large 13x9-inch roasting pan.","Melt the butter and stir in the Worcestershire sauce, garlic salt, celery salt, and ½ teaspoon salt. Drizzle over the cereal mixture and toss carefully with a wooden spoon until evenly coated.","Bake at 250°F for 30 minutes, stirring gently every 15 minutes. Cool completely before serving or storing in an airtight container."],"macro":null,"tagline":"Utah Power & Light Snack Mix","score":null,"sc":null,"diff":"Easy","time":"40 mins","extras":"Kix, Crackers, Pretzels, Mixed Nuts"},
  {"id":473,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Mix Banana Bread","servings":"10 Slices (1 Loaf)","servN":10,"ing":["2 cups quick mix","¼ tsp baking soda","½ cup sugar","2 eggs","1 cup mashed bananas"],"steps":["Preheat the oven to 350°F and grease a 9×5-inch loaf pan. In a mixing bowl, stir together the quick mix, baking soda, and sugar.","Mash the peeled bananas smoothly with a fork on a plate, then whisk in the eggs until well blended.","Stir the banana-egg mixture into the dry ingredients just until moistened. Pour into the loaf pan and bake at 350°F for 45 to 55 minutes, until golden brown and a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Quick Mix One-Bowl Banana Loaf","score":null,"sc":null,"diff":"Easy","time":"1 hr","extras":null},
  {"id":474,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cinnamon Twists","servings":"24 Twists","servN":24,"ing":["1 cup sour cream","2 tbsp shortening","3 tbsp sugar","1 tsp salt","1 pkg (0.25 oz) active dry yeast","¼ cup warm water","½ cup milk","1 egg","3 cups flour","½ tsp baking soda","3 tbsp melted butter","½ cup brown sugar","1 tsp cinnamon","½ cup chopped nuts","1 cup powdered sugar"],"steps":["Heat the sour cream in a small saucepan over medium-low heat just until tiny bubbles form around the edges. Stir in the shortening, granulated sugar, and salt, then let cool to lukewarm (about 110°F).","Dissolve the active dry yeast in the warm water and let stand 5 minutes until foamy.","Stir the beaten egg, ¼ cup of the milk, and the yeast mixture into the cooled sour cream mixture.","Whisk the flour and baking soda together, reserve 1 tablespoon for dusting, and stir the rest into the wet mixture to form a soft dough. Turn onto a lightly floured surface (using the reserved flour) and knead gently for 3 to 4 minutes until smooth.","Roll the dough into a rectangle about ½ inch thick. Brush with the melted butter and sprinkle evenly with the brown sugar, cinnamon, and chopped nuts. Roll up jelly-roll style, slice into 24 pieces (or twist strips), and arrange on parchment-lined baking sheets.","Cover loosely and let rise in a warm place for 1½ hours, until nearly doubled in size.","Preheat oven to 375°F and bake for 20 minutes until golden brown.","Whisk the powdered sugar with the remaining ¼ cup milk until smooth and drizzle over the twists while still warm."],"macro":null,"tagline":"Valoy Cox’s Yeast Twists","score":null,"sc":null,"diff":"In-Depth","time":"2 hrs 25 mins","extras":"Chopped nuts"},
  {"id":475,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Butterscotch Icebox Cookies","servings":"36 Cookies","servN":36,"ing":["½ cup butter","1 cup brown sugar","1 egg","1¾ cups flour","2 tsp baking powder","¼ tsp salt","1 cup chopped walnuts","1 tsp vanilla"],"steps":["Cream the butter and brown sugar together until smooth and light, then beat in the egg and vanilla.","Whisk the flour, baking powder, and salt together and stir into the creamed mixture along with the chopped walnuts until a firm dough forms.","Shape into 2 smooth logs, wrap tightly, and chill in the refrigerator at least 2 hours until thoroughly firm.","Preheat oven to 375°F. Slice into thin ⅛-inch rounds onto an ungreased baking sheet and bake 10 minutes until golden at the edges."],"macro":null,"tagline":"Brown-Sugar Slice-and-Bake Walnut Cookies","score":null,"sc":null,"diff":"Medium","time":"2 hrs 25 mins","extras":"Walnuts"},
  {"id":476,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Mix Muffins","servings":"12 Muffins","servN":12,"ing":["3 cups Quick Mix","1 cup milk","1 egg","2 tbsp sugar"],"steps":["Preheat oven to 425°F and line a 12-cup muffin tin with paper liners.","Combine Quick Mix and sugar in a mixing bowl. Beat egg in a small bowl and stir in milk.","Stir the milk and egg mixture into the dry ingredients with a large spoon just until moistened—do not overmix.","Divide batter among the 12 muffin cups and bake at 425°F for 20 to 25 minutes until puffed and golden brown."],"vary":["Fold in ½ cup raisins or blueberries for fruit muffins."],"macro":null,"tagline":"Fast Pantry Baking-Mix Muffins","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":null},
  {"id":477,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Egg & Sausage Casserole","servings":"8 Servings","servN":8,"ing":["8 slices bread","2 cups cheddar cheese","1½ lb pork sausage","6 eggs","2¾ cups milk","¾ tsp mustard powder","1 can (10.5 oz) cream of mushroom soup","½ tsp salt"],"steps":["Slice or crumble the pork sausage into a skillet over medium-high heat and cook 6 to 8 minutes until browned with no pink remaining (160°F); drain excess fat.","Trim the crusts from the bread, cut the slices into cubes, and scatter them evenly in a buttered 9×13-inch baking dish. Top with the cooked sausage and shredded cheddar cheese.","Whisk the eggs, 2¼ cups of the milk, mustard powder, and salt together and pour evenly over the casserole. Cover and refrigerate overnight.","The next morning, preheat the oven to 300°F. Whisk the cream of mushroom soup with the remaining ½ cup milk until smooth, spoon it over the chilled casserole, and bake uncovered at 300°F for 1 hour 30 minutes until puffed, golden, and set at the center."],"vary":["Can swap cream of mushroom soup for a 10.5 oz can of cream of chicken soup."],"macro":null,"tagline":"Make-Ahead Overnight Breakfast Bake","score":null,"sc":null,"diff":"Medium","time":"9 hrs 45 mins","extras":"Mustard Powder"},
  {"id":478,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Zucchini Jam","servings":"48 Servings (2 Tbsp)","servN":48,"ing":["4 cups grated zucchini","6 cups sugar","¾ cup lemon juice","1 pkg (0.25 oz) unflavored gelatin","1 pkg (3 oz) flavored gelatin"],"steps":["Peel and finely grate or grind enough fresh zucchini to measure 4 cups.","In a large heavy pot, stir together the grated zucchini, lemon juice, and unflavored gelatin; bring to a rolling boil over medium-high heat.","Stir in the sugar and flavored gelatin, return to a full rolling boil, and boil hard for 4 minutes, stirring constantly so it does not scorch.","Ladle the hot jam into clean jars, cool to room temperature, and refrigerate or freeze until firmly set."],"vary":["Choose strawberry, raspberry, or cherry flavored gelatin to give the jam its bright color and berry taste."],"macro":null,"tagline":"Sweet Garden Freezer Jam","score":null,"sc":null,"diff":"Medium","time":"25 mins","extras":"Zucchini, Lemon"},
  {"id":479,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pizza","servings":"8 Pizza Halves","servN":8,"ing":["4 English muffins","½ cup pimento cheese spread","¼ cup tomato paste","¼ cup sliced olives"],"steps":["Preheat the oven to 400°F. Split the English muffins in half and arrange cut-side up on a baking sheet; toast lightly in the oven for 3 minutes so the bases stay crisp.","Spread each muffin half evenly with pimento cheese spread, then spoon a thin layer of tomato paste over the cheese and top with sliced stuffed olives.","Bake at 400°F for 8 to 10 minutes, until the cheese is melted and bubbling around the edges."],"macro":null,"tagline":"Quick Cheese-Spread & Olive Melt","score":null,"sc":null,"diff":"Easy","time":"18 mins","extras":"English Muffins, Process Cheese Spread, Olives"},
  {"id":480,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Spam Sandwich","servings":"6 Sandwiches","servN":6,"ing":["1 can (12 oz) Spam","1 cup dill pickles","¼ cup onion","½ cup salad dressing","12 slices bread","3 tbsp butter"],"steps":["Finely chop or pulse the Spam, dill pickles, and onion together until finely minced.","Stir the salad dressing into the chopped mixture until smooth and spreadable.","Spread the softened butter over one side of each bread slice. Spread the Spam salad generously onto 6 slices and top with the remaining bread slices to make 6 sandwiches."],"macro":null,"tagline":"Chopped Pickle & Luncheon Meat Spread","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Spam"},
  {"id":481,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Christmas Ribbon Salad","servings":"24 Servings","servN":24,"ing":["2 pkgs (3 oz) lime gelatin","1 pkg (3 oz) lemon gelatin","2 pkgs (3 oz) cherry gelatin","7 cups water","1 cup miniature marshmallows","1 can (20 oz) crushed pineapple","1 pkg (8 oz) cream cheese","1 cup heavy cream","¾ cup mayo"],"steps":["Dissolve the lime gelatin in 1½ cups boiling water, stir in 1½ cups cold water, and pour into a 9×13-inch (2-inch-deep) dish. Refrigerate 1½ to 2 hours until firmly set.","In the top of a double boiler over simmering water, dissolve the lemon gelatin in 1 cup hot water, add the miniature marshmallows, and stir until melted; remove from heat.","Drain the crushed pineapple, reserving the juice and adding enough cold water to measure 1 cup; stir into the lemon gelatin. Beat in the softened cream cheese until smooth, fold in the drained pineapple, and chill until starting to thicken.","Whip the heavy cream until soft peaks form, then fold both the whipped cream and mayo into the thickened lemon layer. Spread gently over the firm lime layer and chill 1 hour until set.","Dissolve the cherry gelatin in 1½ cups boiling water, stir in 1½ cups cold water, and chill 45 minutes until syrupy. Spoon carefully over the creamy layer and chill at least 2 hours until firm."],"vary":["Substitute 1 can (15 oz) fruit cocktail and 1 sliced banana for the crushed pineapple."],"macro":null,"tagline":"May Jorgensen’s Three-Layer Holiday Gelatin","score":null,"sc":null,"diff":"In-Depth","time":"6 hrs","extras":"Marshmallows, Crushed pineapple, Cream cheese, Heavy cream"},
  {"id":482,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Spiced Apple Cream Float","servings":"6 Servings","servN":6,"ing":["2 cups vanilla ice cream","4 cups apple juice","1 tsp cinnamon","½ tsp ground nutmeg"],"steps":["Place a generous scoop of vanilla ice cream into each of 6 tall chilled glasses.","Sprinkle each scoop with cinnamon and ground nutmeg, then slowly pour in chilled apple juice to fill the glasses and serve immediately."],"vary":["Use whole cinnamon sticks as stirrers, or swap apple juice for chilled cider or peach nectar."],"macro":null,"tagline":"Cinnamon-Nutmeg Apple Juice Float","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Vanilla Ice Cream, Apple Juice"},
  {"id":483,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cream Puff Dessert","servings":"12 Servings","servN":12,"ing":["1 cup water","½ cup butter","1 cup flour","4 eggs","1 pkg (8 oz) cream cheese","3½ cups milk","2 pkgs (3 oz) vanilla pudding mix","1 pkg (8 oz) whipped topping","3 tbsp syrup"],"steps":["Preheat the oven to 450°F and lightly grease a 9×13-inch (or 11×13-inch) baking pan.","In a medium saucepan, bring the water and butter to a rolling boil over medium-high heat. Remove from the heat, dump in all the flour at once, and stir vigorously until a smooth ball forms. Beat in the eggs one at a time until glossy and smooth, then spread evenly over the bottom of the prepared pan.","Bake at 450°F for 15 minutes, then reduce the oven temperature to 350°F and bake 20 to 25 minutes longer until puffed and golden brown. Cool completely on a rack.","Beat the softened cream cheese until smooth, gradually beat in the milk, then add the vanilla pudding mixes and beat 2 minutes until smooth and thickened. Spread evenly over the cooled choux crust.","Top with the whipped topping, drizzle with syrup, and chill at least 2 hours before slicing into 12 squares."],"vary":["Use chocolate syrup for the drizzle, just as on the original card."],"macro":null,"tagline":"Choux Crust, Vanilla Cream Layer","score":null,"sc":null,"diff":"Medium","time":"3 hrs","extras":"Cream Cheese, Whipped Topping"},
  {"id":484,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Macaroni and Shrimp Salad","servings":"6 Servings","servN":6,"ing":["2 eggs","4 oz macaroni","1 cup chopped celery","½ cup chopped onion","¼ cup chopped bell pepper","¼ cup chopped pimientos","1 can (4.25 oz) canned shrimp","1 tsp salt","¼ tsp paprika","1 cup mayo","¼ cup French dressing"],"steps":["Boil the macaroni in salted water until tender, about 8 minutes; drain, rinse under cold water, and let cool.","Hard-boil the eggs (simmer 10 minutes, cool in cold water, peel, and chop). Combine the cooled macaroni, chopped eggs, celery, onion, bell pepper, pimientos, and drained, rinsed canned shrimp in a large salad bowl.","Whisk the mayo, French dressing, salt, and paprika together until smooth, pour over the salad, and toss gently to coat. Chill at least 1 hour before serving."],"vary":["Swap half of the mayo for Miracle Whip for a tangier classic dressing, as noted on the original card."],"macro":null,"tagline":"Chilled Picnic Pasta Salad","score":null,"sc":null,"diff":"Easy","time":"1 hr 20 mins","extras":"Celery, Canned Shrimp, French Dressing"},
  {"id":485,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Dry Fruit Cake","servings":"48 Slices (4 Loaves)","servN":48,"ing":["3 cups applesauce","1 cup apricot preserves","4 tsp baking soda","4 tsp cinnamon","1 tsp ground cloves","1 cup oil","5 cups flour","1 tsp salt","1½ cups sugar","1 cup chopped walnuts","1 cup chocolate chips"],"steps":["Preheat the oven to 350°F and grease and flour four 8×4-inch loaf pans.","In a very large bowl, stir together the applesauce, apricot preserves, oil, and sugar until smooth.","Whisk the flour, baking soda, salt, cinnamon, and ground cloves together, then stir into the fruit mixture until evenly combined. Fold in the chopped walnuts and chocolate chips.","Divide the batter evenly among the four loaf pans and bake at 350°F for 45 to 50 minutes, until a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Four-Loaf Spiced Applesauce Fruitcake","score":null,"sc":null,"diff":"Medium","time":"1 hr 5 mins","extras":"Walnuts"},
  {"id":486,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Valoy's Pumpkin Pie","servings":"24 Slices (3 Nine-Inch Pies)","servN":24,"ing":["3 cups flour","1 cup shortening","1 tsp salt","1 can (29 oz) canned pumpkin","2 cups sugar","3 tsp pumpkin pie spice","1 can (12 oz) evaporated milk","1½ cups milk","4 eggs"],"steps":["Whisk the flour and salt together in a mixing bowl, cut in the shortening with a pastry blender until crumbly, and sprinkle in 6 to 8 tablespoons cold water a tablespoon at a time until the dough holds together. Divide into thirds, roll each into a 12-inch round, and fit into three 9-inch pie pans with crimped edges.","Preheat oven to 375°F. Beat the eggs lightly in a large bowl, then whisk in the canned pumpkin, sugar, and pumpkin pie spice until smooth.","Gradually stir in the evaporated milk and regular milk until evenly blended.","Pour the filling into the three unbaked pie shells and bake at 375°F for 55 to 60 minutes, until a knife inserted near the center comes out clean and the centers have only a slight wobble. Cool completely before slicing."],"macro":null,"tagline":"Valoy’s Three-Pie Holiday Batch","score":null,"sc":null,"diff":"Medium","time":"1 hr 25 mins","extras":"Canned pumpkin"},
  {"id":487,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Carrot Pudding Sauce","servings":"12 Servings","servN":12,"ing":["2 cups brown sugar","2 cups water","2 tbsp cornstarch","⅛ tsp salt","2 tbsp butter","1 tsp vanilla","1 can (12 oz) evaporated milk"],"steps":["Combine the brown sugar and water in a medium saucepan over medium heat, bring to a simmer, and cook 15 minutes, stirring occasionally.","Whisk the cornstarch with 2 tablespoons cold water until smooth, stir into the simmering syrup with the salt, and cook 2 to 3 minutes until thickened and glossy.","Remove from heat and stir in the butter, vanilla, and evaporated milk until smooth and velvety. Serve warm over carrot pudding."],"vary":["Serve warm topped with whipped cream or a scoop of vanilla ice cream."],"macro":null,"tagline":"Warm Caramel-Cream Steamed Pudding Sauce","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":488,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Orange Batida","servings":"20 Servings","servN":20,"ing":["16 cups orange juice","8 ripe bananas","46 maraschino cherries","3 cups ice"],"steps":["Combine orange juice, sliced ripe bananas, maraschino cherries, and crushed ice in batches in a blender.","Blend each batch about 1 minute until completely smooth and frothy, then pour into a punch bowl and serve immediately."],"vary":["Halve or quarter the batch for everyday family breakfasts."],"macro":null,"tagline":"Frothy Crowd-Size Citrus Smoothie","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Orange Juice, Maraschino Cherries"},
  {"id":489,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pineapple Tarts (Czechoslovakia)","servings":"48 Tarts","servN":48,"ing":["1 pkg (0.25 oz) active dry yeast","¼ cup warm water","1 cup sugar","3 tbsp sugar","1 tsp sugar","3 eggs","¾ cup evaporated milk","6 cups flour","1½ tsp salt","1 lb shortening","1 can (20 oz) crushed pineapple","3 tbsp cornstarch","24 maraschino cherries"],"steps":["Dissolve the active dry yeast and 1 tsp sugar in the warm water and let stand 5 minutes until foamy, then whisk in the beaten eggs and evaporated milk.","Whisk together the flour, 3 tbsp sugar, and salt, then cut in the shortening with a pastry blender until crumbly, as for pie crust.","Pour in the yeast mixture, bring the dough together, and knead on a lightly floured board for 10 minutes until smooth and glossy. Cover and let rise 30 minutes, then chill in the refrigerator overnight.","Meanwhile, make the filling: in a saucepan, stir the crushed pineapple (with its juice), cornstarch, and 1 cup sugar together, bring to a boil over medium heat, and cook 3 to 4 minutes, stirring constantly, until thick and clear. Cool completely.","Preheat the oven to 350°F and grease baking sheets. Divide the chilled dough into 4 portions and roll each out about ⅛-inch thick on a lightly sugared surface, cutting into 4-inch squares. Spoon a dollop of cooled pineapple filling into the center of each square, top with a halved maraschino cherry, bring two opposite corners together, and pinch to seal.","Let the shaped tarts rise 15 minutes on the sheets, then bake at 350°F for 12 to 15 minutes until lightly golden."],"macro":null,"tagline":"Heirloom Bohemian Kolache Tarts","score":null,"sc":null,"diff":"In-Depth","time":"10 hrs","extras":"Shortening, Crushed Pineapple, Maraschino Cherries"},
  {"id":490,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chili-Bean Casserole","servings":"6 Servings","servN":6,"ing":["1 pkg (9.25 oz) corn chips","1 can (15 oz) canned chili","2 cups pinto beans","½ cup chopped onion","1 cup American cheese","1 tsp butter"],"steps":["Preheat the oven to 350°F and grease a 2-quart casserole dish with the butter. Crush the corn chips slightly and line the bottom of the dish with half of them.","Warm the canned chili and drained pinto beans together in a saucepan over medium heat for 4 to 5 minutes until heated through.","Layer half the chili-bean mixture, half the chopped onion, and half the American cheese over the chips; repeat with the remaining chili-beans, onion, corn chips, and American cheese on top.","Bake at 350°F for 15 to 20 minutes until bubbling hot and the cheese is melted."],"macro":null,"tagline":"Layered Chili, Beans & Corn Chips","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Corn Chips, Canned Chili, American Cheese"},
  {"id":491,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cinnamon Tea (Té de Canela)","servings":"20 Servings","servN":20,"ing":["1 pkg (1 oz) cinnamon sticks","16 cups water"],"steps":["Bring 16 cups (1 gallon) of water to a boil in a large stockpot.","Add the cinnamon sticks, cover, and simmer gently for 15 minutes until deeply fragrant and amber-colored. Remove from heat and cool to lukewarm, or serve warm in mugs."],"vary":["Garnish each mug with a fresh cinnamon stick and sweeten lightly with sugar or honey if desired."],"macro":null,"tagline":"Fragrant Simmered Mexican Cinnamon Infusion","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":492,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Sweet Fritters (Frittura Dolce)","servings":"8 Servings","servN":8,"ing":["4 cups milk","¼ tsp salt","½ cup Cream of Wheat","½ cup sugar","1 tbsp lemon juice","1 tsp lemon zest","3 eggs","½ cup breadcrumbs","¼ cup oil"],"steps":["Bring the milk and salt to a rapid boil in a heavy saucepan. Gradually sprinkle in the Cream of Wheat while stirring constantly until the mixture thickens.","Reduce heat to medium-low and cook 5 minutes more, stirring frequently so it does not scorch.","Remove from heat and stir in the sugar, lemon juice, and lemon zest. Beat 2 of the eggs lightly in a small bowl, whisk a spoonful of the hot pudding into the eggs to temper them, then whisk back into the saucepan.","Pour into a 9×13-inch oven-proof baking dish and chill 1 to 2 hours until completely firm and solid.","Cut the chilled custard into 16 squares. Beat the remaining 1 egg in a shallow dish and place the breadcrumbs on a plate. Dip each square in beaten egg, then coat in breadcrumbs.","Heat the oil in a large skillet over medium heat and fry the squares 2 to 3 minutes per side until crisp and golden brown. Drain on paper towels and serve warm."],"macro":null,"tagline":"Italian Fried Semolina Custard Squares","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 45 mins","extras":"Cream of Wheat, Lemon"},
  {"id":493,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Banana Nut Bread","servings":"12 Servings (1 Loaf)","servN":12,"ing":["3 ripe bananas","1 cup sugar","½ cup shortening","3 eggs","2 cups flour","1 tsp baking soda","½ tsp salt","½ cup chopped walnuts"],"steps":["Preheat oven to 350°F and grease a 9×5-inch loaf pan.","Cream the shortening and sugar together until light, then beat in the eggs and mashed ripe bananas until blended.","Whisk the flour, baking soda, and salt together, stir into the banana mixture until just moistened, and fold in the chopped walnuts.","Pour into the prepared loaf pan and bake at 350°F for 55 to 60 minutes until a toothpick inserted in the center comes out clean. Cool 10 minutes in the pan before turning onto a rack."],"macro":null,"tagline":"Tender Three-Banana Shortening Loaf","score":null,"sc":null,"diff":"Easy","time":"1 hr 10 mins","extras":"Walnuts"},
  {"id":494,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Brown Sugar Cookies","servings":"36 Cookies","servN":36,"ing":["¾ cup butter","1½ cups brown sugar","2 eggs","2¾ cups flour","1 cup sour cream","½ tsp baking soda","2¼ tsp baking powder","2 tsp vanilla","⅔ cup chopped walnuts","2 cups powdered sugar","2 tbsp hot water"],"steps":["Preheat oven to 350°F and line baking sheets with parchment paper.","Cream ½ cup of the butter with brown sugar until fluffy, beat in eggs and 1 tsp of the vanilla, then stir in flour, baking soda, and baking powder alternately with sour cream. Fold in chopped walnuts.","Drop by rounded teaspoonfuls onto prepared sheets and bake at 350°F for 10 minutes until set without browning. Cool on wire racks.","For browned-butter icing, melt remaining ¼ cup butter in a small skillet over medium heat until nutty brown and foaming subsides; strain out dark solids if desired.","Pour browned butter over powdered sugar, add remaining 1 tsp vanilla and hot water, and whisk until smooth and spreadable. Spread over cooled cookies."],"vary":["Substitute 1 cup evaporated milk mixed with 1 tbsp vinegar for the sour cream, and thin the icing with evaporated milk instead of water."],"macro":null,"tagline":"Soft Sour Cream & Browned-Butter Icing","score":null,"sc":null,"diff":"Medium","time":"40 mins","extras":"Walnuts"},
  {"id":495,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Cookies","servings":"24 Cookies","servN":24,"ing":["2 cups sugar","½ cup milk","3 tbsp cocoa","½ cup butter","½ cup peanut butter","3 cups rolled oats"],"steps":["Line two baking sheets with waxed paper or parchment.","Combine the sugar, milk, cocoa, and butter in a medium saucepan over medium heat, stirring until melted. Bring to a full rolling boil and boil for exactly 1 minute without stirring.","Remove from the heat and immediately stir in the peanut butter until smooth, then fold in the rolled oats until well coated.","Drop by rounded tablespoonfuls onto the prepared sheets and let cool 25 to 30 minutes until set."],"macro":null,"tagline":"One-Minute Boiled No-Bakes","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Cocoa"},
  {"id":496,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Biscuits","servings":"12 Biscuits","servN":12,"ing":["2 cups all-purpose flour","2 tsp baking powder","½ tsp salt","¼ cup shortening","¾ cup milk"],"steps":["Preheat the oven to 475°F.","Whisk the all-purpose flour, baking powder, and salt together in a mixing bowl. Cut in the shortening with a pastry blender or fork until the mixture resembles coarse crumbs.","Stir in the milk just until a soft dough forms. Turn out onto a lightly floured surface (using a pinch of the flour) and knead gently for 30 seconds.","Roll or pat out ½ inch thick and cut into 12 rounds with a floured 1¾-inch biscuit cutter or sharp knife. Place on an ungreased baking sheet and bake at 475°F for 10 to 12 minutes until golden brown."],"macro":null,"tagline":"Hot-Oven Shortening Biscuits","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":497,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Unbaked Cookies","servings":"60 Cookies (5 Dozen)","servN":60,"ing":["2 cups sugar","¾ cup butter","1 can (6 oz) evaporated milk","1 pkg (4 oz) butterscotch pudding mix","4 cups oats"],"steps":["Line baking sheets with waxed paper. In a medium saucepan over medium heat, combine the sugar, butter, and evaporated milk.","Bring to a full boil, stirring constantly, and boil for 1 minute.","Remove from heat and immediately whisk in the dry butterscotch pudding mix until smooth. Stir in the oats, let the mixture cool for 15 minutes until thickened enough to hold a mound, then drop by rounded teaspoonfuls onto the waxed paper and let set until firm."],"vary":["Use any cook-and-serve (non-instant) pudding flavor, or substitute 1 cup shredded coconut for 1 cup of the oats as Elaine's card notes."],"macro":null,"tagline":"Elaine Wilberg's No-Bake Butterscotch Drop","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":498,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Swedish Meat Loaf","servings":"6 Servings","servN":6,"ing":["1 can (10.5 oz) cream of mushroom soup","1½ lb ground beef","1 egg","½ cup herb-seasoned stuffing","¼ tsp ground nutmeg","½ cup sour cream","½ cucumber"],"steps":["Preheat oven to 350°F. In a large bowl, mix the ground beef, lightly beaten egg, finely crushed herb-seasoned stuffing, ground nutmeg, and ⅓ cup of the cream of mushroom soup until evenly blended.","Shape firmly into a loaf and place in a shallow baking pan. Bake at 350°F for 1 hour, until browned and an instant-read thermometer in the center reads 160°F.","Transfer the loaf to a serving platter. In a small saucepan over low heat, whisk together the remaining cream of mushroom soup and the sour cream, stirring now and then until heated through (do not boil).","Spoon the warm sauce over the meat loaf, garnish with sliced cucumber, and serve hot."],"vary":["Card note: substitute ½ cup fine dry breadcrumbs and ½ teaspoon salt for the herb-seasoned stuffing, and serve with buttered rice, green beans, and cranberry sauce."],"macro":null,"tagline":"Sour Cream & Nutmeg Glazed Loaf","score":null,"sc":null,"diff":"Easy","time":"1 hr 15 mins","extras":"Herb-seasoned stuffing"},
  {"id":499,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Homestead Beef Stew","servings":"6 Servings","servN":6,"ing":["1½ lb stewing beef","1 tbsp oil","3 cups water","3 potatoes (cubed)","3 carrots (sliced)","1 cup diced celery","1 onion (diced)","1 can (14.5 oz) diced tomatoes","1 tsp salt","¼ tsp black pepper"],"steps":["Cut the stewing beef into small bite-size cubes. Heat the oil in a large saucepan or Dutch oven over medium-high heat and brown the beef 6 to 8 minutes.","Pour in ½ cup of the water, cover, and simmer 10 minutes to start tenderizing the meat.","Add the cubed potatoes, sliced carrots, diced celery, diced onion, and remaining 2½ cups water so the vegetables are covered. Cover and simmer 35 to 45 minutes until the beef and vegetables are tender.","Stir in the diced tomatoes, salt, and black pepper and simmer 10 minutes more until heated through."],"macro":null,"tagline":"Hearty Stove-Top Beef & Vegetable Stew","score":null,"sc":null,"diff":"Medium","time":"1 hr 15 mins","extras":"Celery"},
  {"id":500,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Red Jell-O Salad","servings":"6 Servings","servN":6,"ing":["1 cup hot water","1 pkg (3 oz) cherry gelatin","1 can (6 oz) frozen orange juice concentrate","1 cup applesauce"],"steps":["Pour hot boiling water over cherry gelatin in a mixing bowl and stir 2 minutes until completely dissolved.","Stir in thawed frozen orange juice concentrate until smooth, then refrigerate 45 to 60 minutes until thickened to the consistency of unbeaten egg whites.","Fold in applesauce, transfer to an 8-inch square dish, and chill 3 hours until firm."],"vary":["Swap cherry gelatin for raspberry or strawberry gelatin."],"macro":null,"tagline":"From Elaine Wilberg’s Files","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Orange Juice Concentrate"},
  {"id":501,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apple Cheese Cinnamon Salad","servings":"8 Servings","servN":8,"ing":["1 cup hot water","⅔ cup red cinnamon candies","1 pkg (3 oz) lemon gelatin","1½ cups applesauce","1 pkg (8 oz) cream cheese","½ cup chopped walnuts","½ cup chopped celery","½ cup mayo"],"steps":["In a heatproof bowl, pour the hot water over the red cinnamon candies and lemon gelatin, stirring until both are completely dissolved. Stir in the applesauce and refrigerate 45 to 60 minutes until thickened to the consistency of unbeaten egg whites.","Beat the softened cream cheese and mayo together in a separate bowl until smooth, then fold in the chopped walnuts and finely chopped celery.","Gently fold the cream cheese mixture into the thickened gelatin (or layer it over the chilled gelatin in an 8-inch square dish), cover, and chill 4 hours until firm before slicing to serve."],"macro":null,"tagline":"Spiced Red-Hot Applesauce Mold","score":null,"sc":null,"diff":"Easy","time":"5 hrs","extras":"Red Cinnamon Candies, Cream Cheese, Walnuts, Celery"},
  {"id":502,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ice Cream Dessert","servings":"16 Servings","servN":16,"ing":["1 pkg (11 oz) vanilla wafers","8 cups vanilla ice cream","3 cups crushed pineapple","4 cups orange sherbet","16 mint leaves","16 maraschino cherries"],"steps":["Crush the vanilla wafers into fine crumbs and press half evenly into the bottom of a 9x13-inch pan.","Soften the vanilla ice cream slightly and spread it in an even layer over the crumbs; freeze 20 minutes until firm.","Spread the well-drained crushed pineapple over the ice cream, then spread the slightly softened orange sherbet evenly on top. Sprinkle the remaining crushed vanilla wafers over the sherbet.","Cover tightly and freeze at least 4 hours until firm. Cut into 16 squares and garnish each serving with a fresh mint leaf and a maraschino cherry."],"macro":null,"tagline":"Frozen Pineapple & Sherbet Squares","score":null,"sc":null,"diff":"Easy","time":"4 hrs 30 mins","extras":"Vanilla Wafers, Vanilla Ice Cream, Crushed Pineapple, Mint, Maraschino Cherries"},
  {"id":503,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Jack Horner Cake","servings":"12 Servings (9×13 Cake)","servN":12,"ing":["1 cup pitted prunes","1 cup water","1 tbsp lemon juice","2 cups flour","1½ cups sugar","1 tsp salt","1¼ tsp baking soda","1 tsp cinnamon","1 tsp ground cloves","1 tsp ground nutmeg","½ cup oil","3 eggs","1 cup chopped walnuts"],"steps":["Preheat the oven to 350°F and grease and flour a 9×13-inch baking pan. Put the prunes and 1 cup cold water in a small covered saucepan, bring to a boil, and simmer 5 minutes (or soak in 1 cup boiling water for 2 hours). Cool slightly, add the lemon juice, and blend until smooth.","In a large bowl, whisk together the flour, sugar, salt, baking soda, cinnamon, ground cloves, and ground nutmeg.","Add the prune puree, oil, and eggs to the dry ingredients and beat for 2 minutes until smooth and well blended. Fold in the chopped walnuts.","Pour into the prepared pan and bake at 350°F for 35 minutes, until a toothpick inserted in the center comes out clean."],"vary":["Serve squares topped with lemon chiffon pudding and a spoonful of whipped cream, as suggested in the 1969 Castle Dale newspaper clipping."],"macro":null,"tagline":"Castle Dale Progress, October 1969","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":"Prunes, Lemon Juice, Walnuts"},
  {"id":504,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Fruit Salad","servings":"6 Servings","servN":6,"ing":["1 cup canned peaches","1 cup diced apple","1 cup miniature marshmallows","1 cup shredded coconut","1 cup heavy whipping cream","1 tbsp lemon juice","6 maraschino cherries"],"steps":["Drain the canned peaches well and cut into bite-size pieces. Toss the peaches and diced apple in a large bowl with the lemon juice so the fruit stays bright.","Fold in the miniature marshmallows and shredded coconut.","Whip the heavy whipping cream in a chilled bowl until soft peaks form, then gently fold it into the fruit mixture until evenly coated.","Cover and chill in the refrigerator for at least 2 hours before serving; top each portion with a maraschino cherry."],"macro":null,"tagline":"Whipped Cream & Coconut Ambrosia","score":null,"sc":null,"diff":"Easy","time":"2 hrs 15 mins","extras":"Miniature marshmallows, Shredded coconut, Heavy whipping cream, Lemon juice, Maraschino cherries"},
  {"id":505,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Two-Loaf Brown Sugar Date Nut Bread","servings":"24 Servings (2 Loaves)","servN":24,"ing":["2 cups chopped dates","2 cups boiling water","2 tsp baking soda","½ cup shortening","1½ cups brown sugar","2 eggs","4 cups flour","1 tsp salt","2 cups chopped walnuts"],"steps":["Combine the chopped dates, boiling water, and baking soda in a heatproof bowl and let stand until completely cooled.","Preheat oven to 350°F and grease and flour two 9×5-inch loaf pans.","Cream the shortening and brown sugar together until smooth, then beat in the eggs thoroughly.","Whisk the flour and salt together, then toss the chopped walnuts with 1½ tablespoons of the flour mixture so they stay suspended while baking.","Stir the remaining flour mixture alternately with the cooled date mixture into the creamed batter until just combined, then fold in the floured walnuts.","Divide between the prepared loaf pans and bake at 350°F for 45 to 60 minutes until a toothpick inserted in the center comes out clean. Remove from pans immediately and cool on a wire rack."],"macro":null,"tagline":"Classic Two-Loaf Boiling-Water Date Bread","score":null,"sc":null,"diff":"Medium","time":"1 hr 25 mins","extras":"Dates, Walnuts"},
  {"id":506,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Scratch Banana Nut Bread","servings":"12 Slices (1 Loaf)","servN":12,"ing":["3 ripe bananas","½ cup shortening","3 eggs","½ tsp salt","1 cup sugar","2 cups flour","1 tsp baking soda","½ cup chopped walnuts"],"steps":["Preheat oven to 350°F and coat a 9x5-inch loaf pan lightly with a dab of the shortening.","Cream sugar and shortening until light, beat in eggs and mashed ripe bananas, then stir in flour, baking soda, salt, and chopped walnuts just until combined.","Pour into the loaf pan and bake at 350°F for 55 to 60 minutes until a toothpick inserted in the center comes out clean. Cool 10 minutes before turning out onto a rack."],"vary":["Bake in a greased 12-cup muffin tin at 350°F for 22 to 25 minutes for banana nut muffins."],"macro":null,"tagline":"Classic Three-Banana Nut Loaf","score":null,"sc":null,"diff":"Easy","time":"1 hr 15 mins","extras":"Walnuts"},
  {"id":507,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Marshmallow Roll","servings":"10 Slices","servN":10,"ing":["½ cup sweetened condensed milk","¼ cup water","8 oz marshmallows","½ cup chopped walnuts","½ cup chopped dates","2½ cups graham cracker crumbs","½ cup heavy whipping cream"],"steps":["In a medium mixing bowl, blend the sweetened condensed milk and water together until smooth.","Quarter the marshmallows with kitchen shears and fold them into the milk mixture along with the chopped walnuts, finely chopped dates, and graham cracker crumbs until evenly combined.","Shape the mixture on a sheet of waxed paper into a compact roll about 3 inches thick and 6 inches long, wrap tightly, and refrigerate at least 12 hours.","When ready to serve, whip the heavy whipping cream to soft peaks, slice the roll into 10 equal rounds, and garnish each slice with a spoonful of whipped cream."],"macro":null,"tagline":"No-Bake Date & Graham Log","score":null,"sc":null,"diff":"Easy","time":"12 hrs 20 mins","extras":"Sweetened Condensed Milk, Marshmallows, Walnuts, Dates, Graham Crackers, Heavy Whipping Cream"},
  {"id":508,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Date and Nut Roll","servings":"8 Servings","servN":8,"ing":["2 cups vanilla wafer crumbs","1 cup chopped dates","½ cup chopped walnuts","½ cup sweetened condensed milk","2 tsp lemon juice","½ cup heavy whipping cream"],"steps":["In a medium bowl, combine the vanilla wafer crumbs, chopped dates, and chopped walnuts.","Stir the sweetened condensed milk and lemon juice together in a measuring cup, pour over the crumb mixture, and knead with clean hands until evenly moistened and cohesive.","Shape into a compact log about 3 inches thick and 3½ inches long, wrap tightly in waxed paper or plastic wrap, and refrigerate at least 12 hours until firm.","Whip the heavy whipping cream until soft peaks form. Slice the chilled log into 8 rounds and serve topped with whipped cream."],"vary":["Serve with warm hard sauce instead of whipped cream for a traditional holiday finish."],"macro":null,"tagline":"No-Bake Chilled Wafer & Date Log","score":null,"sc":null,"diff":"Easy","time":"12 hrs 15 mins","extras":"Vanilla Wafers, Dates, Walnuts, Sweetened Condensed Milk, Lemon, Heavy Cream"},
  {"id":509,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Magic Chocolate Sauce","servings":"16 Servings (2 Cups)","servN":16,"ing":["1 can (14 oz) sweetened condensed milk","2 oz unsweetened baking chocolate","⅛ tsp salt","¾ cup water","½ tsp vanilla"],"steps":["In the top of a double boiler over rapidly boiling water, combine the sweetened condensed milk, unsweetened baking chocolate, and salt.","Cook, stirring often, for 8 to 10 minutes until the chocolate is melted and the mixture is thick and glossy.","Remove from heat and slowly whisk in the hot water a little at a time until the sauce reaches your desired pouring consistency. Stir in the vanilla and serve warm or chilled."],"macro":null,"tagline":"Double-Boiler Condensed Milk Fudge Sauce","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Sweetened Condensed Milk, Unsweetened Baking Chocolate"},
  {"id":510,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Naome's Chili Sauce","servings":"48 Servings (About 6 Pints)","servN":48,"ing":["12 lb tomatoes","2 lb bell peppers","4 tbsp salt","4 cups vinegar","1 tsp ground ginger","1 tsp ground cloves","1 tsp celery seed","1 tsp allspice","1 tsp cinnamon","2 jalapeños","6 large onions","4½ cups sugar"],"steps":["Blanch, peel, core, and chop the tomatoes. Finely chop the bell peppers, onions, and jalapeños (removing seeds for milder heat).","Combine the chopped tomatoes, bell peppers, onions, jalapeños, vinegar, sugar, salt, ground ginger, ground cloves, celery seed, allspice, and cinnamon in a large heavy-bottomed stockpot.","Bring to a boil over medium-high heat, then reduce heat to medium-low and boil gently, uncovered, for 3 hours, stirring frequently toward the end so the thickened sauce does not scorch.","Ladle the hot chili sauce into clean pint jars, cool to room temperature, and refrigerate (or process in a boiling-water bath for shelf storage)."],"vary":["Companion card option: split the sweetener into 2½ cups brown sugar and 2½ cups white sugar, and use 3 hot peppers for extra heat."],"macro":null,"tagline":"Naome’s Old-Fashioned Canning Sauce","score":null,"sc":null,"diff":"In-Depth","time":"3 hrs 45 mins","extras":"Jalapeños"},
  {"id":511,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Popcorn Balls","servings":"12 Popcorn Balls","servN":12,"ing":["12 cups popped popcorn","2 cups sugar","½ cup corn syrup","½ cup water","2 tbsp butter","1 tsp vanilla"],"steps":["Place the popped popcorn in a very large heatproof bowl, discarding any unpopped kernels.","Combine the sugar, corn syrup, and water in a heavy saucepan over medium heat, stirring until dissolved. Boil without stirring 10 to 12 minutes until a drop spooned into cold water forms brittle threads (hard-crack stage, 270°F to 290°F).","Remove from heat and stir in the butter and vanilla until melted and smooth.","Slowly pour the hot syrup over the popcorn, tossing with a wooden spoon to coat evenly. When cool enough to handle with lightly buttered hands, shape into 12 firm balls and cool on waxed paper."],"macro":null,"tagline":"Crisp-Chewy Old-Fashioned Caramel Popcorn Balls","score":null,"sc":null,"diff":"Medium","time":"25 mins","extras":"Popcorn, Corn syrup"},
  {"id":512,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Biddy on a Bun","servings":"4 Servings (8 Halves)","servN":4,"ing":["2 cups canned chicken","½ cup celery","⅓ cup sweet pickles","⅔ cup mayo","¼ tsp salt","¼ tsp black pepper","4 hamburger buns","2 tbsp butter","1 cup cheddar cheese"],"steps":["Turn on the oven broiler. Drain canned chicken and mix with finely chopped celery, finely chopped sweet pickles, mayo, salt, and black pepper.","Split hamburger buns into 8 halves, spread cut sides with butter, and arrange on a baking sheet.","Mound chicken salad onto each bun half and sprinkle evenly with shredded cheddar cheese.","Broil 4 to 5 inches from heat for 2 to 3 minutes until cheddar melts and bubbles and filling is steaming hot."],"vary":["Use diced leftover roast chicken or turkey in place of canned chicken."],"macro":null,"tagline":"Broiled Cheesy Chicken Salad Melts","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Celery, Sweet Pickles"},
  {"id":513,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Crystal Sugar Cookies","servings":"36 Cookies","servN":36,"ing":["4 cups flour","4 tsp baking powder","¼ tsp salt","1 cup shortening","1¾ cups sugar","2 eggs","1 cup milk","2 tsp vanilla"],"steps":["Preheat the oven to 375°F and lightly grease baking sheets.","Cream the shortening with 1½ cups of the sugar until light and fluffy, then beat in the eggs and vanilla.","Sift together the flour, baking powder, and salt, and stir into the creamed mixture alternately with the milk to form a soft rollable dough.","Roll the dough out ¼-inch thick on a lightly floured surface, cut into rounds, transfer to the prepared sheets, and sprinkle the tops with the remaining ¼ cup sugar for a sparkling crystal crust. Bake at 375°F for 10 to 12 minutes until the edges are just lightly golden."],"macro":null,"tagline":"Old-Fashioned Soft Cutout Cookies","score":null,"sc":null,"diff":"Medium","time":"35 mins","extras":"Shortening"},
  {"id":514,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Mix Oatmeal Raisin Cookies","servings":"36 Cookies","servN":36,"ing":["3 cups Quick Mix","1 cup rolled oats","¾ cup milk","1 cup chopped walnuts","1 cup brown sugar","1 cup raisins","1 tsp cinnamon","1 egg"],"steps":["Preheat the oven to 375°F and lightly grease two baking sheets.","In a large mixing bowl, stir together the Quick Mix, brown sugar, and cinnamon.","Whisk the milk and egg together until well beaten, add to the dry mixture, and stir until smooth and blended. Fold in the rolled oats, chopped walnuts, and raisins.","Drop by rounded tablespoons onto the prepared baking sheets and bake at 375°F for 12 to 15 minutes until golden around the edges. Cool 2 minutes on the pan before moving to a rack."],"macro":null,"tagline":"Quick Mix Raisin & Walnut Drops","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Walnuts"},
  {"id":515,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Jelly Muffins","servings":"12 Muffins","servN":12,"ing":["2 cups flour","⅓ cup sugar","1 tbsp baking powder","½ tsp salt","1 cup milk","1 egg","¼ cup oil","4 tbsp jam"],"steps":["Preheat the oven to 400°F and grease or line a 12-cup muffin tin. In a large bowl, whisk together the flour, sugar, baking powder, and salt.","In a separate bowl, whisk the milk, egg, and oil together, then fold gently into the dry ingredients just until moistened (do not overmix).","Fill each muffin cup halfway with batter, spoon ½ teaspoon of jam or jelly into the center of each, cover with the remaining batter, and dot another ½ teaspoon of jam on top.","Bake at 400°F for 18 to 20 minutes, until golden brown and a toothpick into the muffin edge comes out clean."],"macro":null,"tagline":"Jam-Centered Morning Muffins","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":516,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cookie Jar Gingersnaps","servings":"72 Cookies (6 Dozen)","servN":72,"ing":["6 cups flour","4½ tsp ground ginger","5 tsp baking soda","3 tsp cinnamon","1½ tsp salt","2½ cups shortening","3½ cups sugar","3 eggs","¾ cup molasses"],"steps":["Preheat oven to 350°F and line two baking sheets with parchment paper.","Sift or whisk together the flour, ground ginger, baking soda, cinnamon, and salt in a large bowl.","In a separate large bowl, cream the shortening and 3 cups of the sugar together until light and fluffy. Beat in the eggs one at a time, then blend in the molasses.","Gradually stir the dry ingredients into the wet mixture until a smooth dough forms.","Shape into 1-inch balls, roll each ball in the remaining ½ cup sugar to coat, and space 2 inches apart on the prepared baking sheets.","Bake at 350°F for 12 to 15 minutes until crackled on top and set at the edges. Cool 3 minutes on the sheets before transferring to wire racks."],"macro":null,"tagline":"Big-Batch Molasses Spice Cookies","score":null,"sc":null,"diff":"Medium","time":"45 mins","extras":"Molasses"},
  {"id":517,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pink Chiffon Pudding","servings":"6 Servings","servN":6,"ing":["1 pkg (3 oz) strawberry gelatin","1 cup boiling water","1 can (5 oz) evaporated milk","1 tsp lemon juice"],"steps":["Pour the evaporated milk into a shallow metal dish or ice cube tray and chill in the freezer 20 to 30 minutes until ice crystals form around the edges.","Dissolve the strawberry gelatin in the boiling water in a medium bowl, stirring well, then chill 45 to 60 minutes until thick and syrupy.","Transfer the icy evaporated milk to a chilled bowl and whip with a mixer on high speed until stiff peaks form, beating in the lemon juice near the end.","Gently fold the whipped milk into the syrupy gelatin until uniform and airy, spoon into dessert dishes, and chill 1 to 2 hours until set."],"vary":["Use raspberry or cherry gelatin in place of strawberry."],"macro":null,"tagline":"Airy Whipped-Evaporated-Milk Gelatin Dessert","score":null,"sc":null,"diff":"Easy","time":"2 hrs 30 mins","extras":"Lemon juice"},
  {"id":518,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pear and Cottage Cheese Salad","servings":"2 Servings","servN":2,"ing":["2 cups lettuce","1 cup canned pears","1 cup cottage cheese","¼ tsp paprika"],"steps":["Arrange crisp lettuce leaves on two chilled salad plates.","Place 1 drained canned pear half cup-side up on each bed of lettuce.","Spoon cottage cheese generously into the center of each pear half, dust with paprika, and serve chilled."],"vary":["Substitute canned peach halves for the pears."],"macro":null,"tagline":"Vintage Chilled Luncheon Salad Plate","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Paprika"},
  {"id":519,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Oven Cheese Toast","servings":"4 Servings","servN":4,"ing":["4 slices bread","4 oz cheddar cheese"],"steps":["Preheat the oven to 325°F and arrange the bread slices in a single layer on an ungreased baking sheet.","Slice the cheddar cheese evenly and lay it over the bread slices.","Bake in the low-moderate 325°F oven for 8 to 10 minutes, until the cheese is completely melted and the undersides of the bread are crisp. Lift onto warm plates with a wide spatula."],"macro":null,"tagline":"Crisp Baked Cheddar Open-Face","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":null},
  {"id":520,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Banana Shake","servings":"2 Servings","servN":2,"ing":["1 cup mashed banana","1 cup vanilla ice cream","1½ cups cold milk"],"steps":["Combine the mashed banana, vanilla ice cream, and cold milk in a blender (or mixing bowl with a hand mixer) and beat until smooth, thick, and frothy.","Pour into two chilled glasses and serve immediately."],"vary":["Swap 1 cup crushed canned or ripe pears for the mashed banana for a pear shake, as noted on the card."],"macro":null,"tagline":"Three-Ingredient Soda-Fountain Shake","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Vanilla Ice Cream"},
  {"id":521,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hootenanny Pancakes","servings":"6 Servings","servN":6,"ing":["¼ cup butter","6 eggs","1 cup milk","1 cup flour","½ tsp salt"],"steps":["Preheat the oven to 425°F. Place the butter in a 9×13-inch baking dish and melt in the oven for 3 to 4 minutes until hot and bubbly.","Meanwhile, whisk the eggs, milk, flour, and salt together in a bowl until smooth.","Pour the batter straight into the hot melted butter and bake at 425°F for 20 to 25 minutes, until dramatically puffed and golden brown around the edges. Serve immediately."],"vary":["Serve warm with maple syrup, powdered sugar and lemon, or berry jam."],"macro":null,"tagline":"Puffed Oven-Baked Dutch Baby","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":522,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Sauce for Carrot Pudding","servings":"8 Servings","servN":8,"ing":["1 cup sugar","½ cup butter","4 egg yolks","¼ cup red wine","⅛ tsp salt","1 cup heavy cream"],"steps":["Cream the sugar and softened butter together in a bowl until light and fluffy.","Add the egg yolks and beat well until pale and smooth.","Slowly whisk in the hot heavy cream, red wine, and salt, beating constantly to temper the yolks smoothly.","Pour into a saucepan over medium-low heat and cook gently, stirring constantly, for 6 to 8 minutes until thickened to the consistency of heavy cream. Do not let boil. Serve warm over carrot pudding."],"macro":null,"tagline":"Karen Huntsman’s Warm Custard Sauce","score":null,"sc":null,"diff":"Medium","time":"15 mins","extras":"Red wine, Heavy cream"},
  {"id":523,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Spaghetti 'n Meatballs","servings":"2 Servings","servN":2,"ing":["½ lb ground beef","¼ cup breadcrumbs","1 egg","¼ tsp salt","2 tbsp chopped onion","2 tbsp chopped green bell pepper","1 tbsp oil","1 can (8 oz) diced tomatoes","½ cup tomato sauce","1 tsp brown sugar","¼ tsp dried oregano","¼ tsp dried basil","¼ tsp garlic salt","4 oz spaghetti","2 tbsp grated parmesan cheese"],"steps":["Mix the ground beef, breadcrumbs, egg, and salt gently, shape into 12 small meatballs, and bake on a greased sheet at 375°F for 15 minutes until cooked through to 160°F.","Meanwhile, cook the spaghetti in boiling salted water 8 to 10 minutes until al dente, then drain.","In a medium saucepan, cook the chopped onion and green bell pepper in the oil over medium heat 3 to 4 minutes until tender but not browned.","Stir in the diced tomatoes, tomato sauce, brown sugar, oregano, basil, garlic salt, and the cooked meatballs. Simmer uncovered 20 to 30 minutes, stirring occasionally, until thickened.","Spoon the meatballs and sauce over the hot cooked spaghetti and serve with grated Parmesan cheese."],"vary":["Stir in 1 small can (3 oz) drained chopped mushrooms with the tomato sauce."],"macro":null,"tagline":"Quick Two-Serving Skillet Marinara & Meatballs","score":null,"sc":null,"diff":"Medium","time":"45 mins","extras":null},
  {"id":524,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Raspberry Ring","servings":"8 Servings","servN":8,"ing":["1 pkg (3 oz) raspberry gelatin","1 pkg (10 oz) frozen raspberries","1 cup boiling water","1 cup applesauce","1 tbsp lemon juice (optional)","1 cup sour cream","1 cup miniature marshmallows"],"steps":["Dissolve raspberry gelatin completely in boiling water in a medium bowl.","Stir in thawed frozen raspberries, applesauce, and optional lemon juice (which helps the molded salad release cleanly).","Pour into a cold-water-rinsed 5-cup ring mold and chill 3 to 4 hours until firm.","Meanwhile, stir sour cream and miniature marshmallows together in a bowl and chill at least 1 hour so the marshmallows soften.","Unmold the raspberry ring onto a chilled platter and spoon the sour cream dressing into the center."],"vary":["Use 1 tbsp cider vinegar in place of lemon juice for easy mold release."],"macro":null,"tagline":"Molded Berry Gelatin & Marshmallow Cream","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Frozen Raspberries, Lemon Juice, Marshmallows"},
  {"id":525,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apricot-Almond Sauce","servings":"4 Servings","servN":4,"ing":["1 tbsp chopped almonds","1 tbsp butter","⅓ cup apricot preserves","1 tbsp lemon juice"],"steps":["In a small saucepan over low heat, sauté the chopped almonds in the butter for 2 to 3 minutes until lightly toasted and fragrant.","Stir in the apricot preserves and lemon juice and heat gently for 2 to 3 minutes until the preserves melt into a glossy glaze. Spoon warm over cake or ice cream."],"macro":null,"tagline":"Warm Toasted-Almond Dessert Glaze","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Almonds, Lemon"},
  {"id":526,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Deviled Green Beans","servings":"2 Servings","servN":2,"ing":["1 can (8 oz) green beans","1 tsp mustard","⅛ tsp salt","⅛ tsp black pepper","1½ tsp butter","¼ tsp Worcestershire sauce","1 tbsp cornflake crumbs"],"steps":["Drain the liquid from the canned green beans into a small saucepan and bring to a boil over medium-high heat. Simmer 3 to 5 minutes until reduced to about one-third.","Add the green beans and cook 2 to 3 minutes until heated through, then drain any excess liquid.","Stir in the butter, mustard, Worcestershire sauce, salt, and black pepper gently until evenly coated. Transfer to a serving bowl, sprinkle with cornflake crumbs, and serve hot."],"macro":null,"tagline":"Zesty Mustard & Butter Side Dish","score":null,"sc":null,"diff":"Easy","time":"12 mins","extras":"Cornflakes"},
  {"id":527,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Bountiful Bean Bowl","servings":"6 Servings","servN":6,"ing":["6 slices bacon","2 cups luncheon meat","1 cup pineapple chunks","¼ cup onion","2 cans (16 oz) pork and beans","⅛ tsp ground allspice"],"steps":["Cook the bacon in a large skillet over medium heat for 6 to 8 minutes until crisp; transfer to paper towels and crumble. Pour off all but 1 tablespoon of drippings.","Add the cubed luncheon meat, pineapple chunks, and chopped onion to the skillet and cook 5 to 6 minutes until the meat is browned and the onion is tender.","Stir in the pork and beans, crumbled bacon, and ground allspice. Simmer gently over low heat for 10 minutes, stirring occasionally, until thick and heated through."],"vary":["Sliced beef franks or Vienna sausages may replace the luncheon meat, or swap in barbecue baked beans as noted on Marilyn Manning's card."],"macro":null,"tagline":"Marilyn Manning's Bacon-Bean Skillet","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Bacon, Canned Luncheon Meat, Canned Pineapple"},
  {"id":528,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Zesty Broiled Pineapple","servings":"3 Servings","servN":3,"ing":["3 pineapple slices","1 tbsp melted butter","2 tbsp brown sugar"],"steps":["Preheat the broiler and position the oven rack 3 inches below the heat element. Arrange the pineapple slices on a foil-lined broiler pan.","Brush both sides of the pineapple slices with the melted butter, then sprinkle evenly with the brown sugar.","Broil for 3 to 5 minutes, watching closely, until the brown sugar melts and turns golden and bubbly. Serve hot."],"macro":null,"tagline":"Marilyn Manning’s Broiled Garnish","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Pineapple slices"},
  {"id":529,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Snappy Cinnamon Ring","servings":"10 Servings","servN":10,"ing":["2 cans (12 oz) biscuit dough","½ cup brown sugar","1 tsp cinnamon","⅓ cup chopped walnuts","¼ cup butter (melted)"],"steps":["Preheat oven to 350°F and generously grease an 8½-inch ring mold or Bundt pan.","Mix the brown sugar, cinnamon, and chopped walnuts together in a bowl, and place the melted butter in a second small bowl.","Roll the refrigerated biscuit dough pieces into balls, dip each in melted butter, and roll in the cinnamon-sugar-nut mixture.","Arrange half of the balls in the bottom of the prepared ring mold about ½ inch apart, then layer the remaining balls over the spaces.","Bake at 350°F for 25 minutes until golden brown and baked through. Turn out onto a serving plate immediately and serve warm."],"vary":["Drizzle the warm ring with a thin powdered sugar glaze and garnish with maraschino or candied cherries, if desired."],"macro":null,"tagline":"Marilyn Manning’s Pull-Apart Cinnamon Walnut Ring","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Biscuit dough, Walnuts"},
  {"id":530,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pickled Eggs","servings":"12 Eggs","servN":12,"ing":["12 eggs","2 cups vinegar","1 cup water","2 tbsp salt","1 tbsp pickling spice","¼ tsp food coloring (optional)"],"steps":["Hard-boil eggs: lower into gently boiling water, cook 10 minutes, chill immediately in ice water, and peel. Pack peeled eggs into a clean 1-quart glass jar.","In a saucepan, combine vinegar, water, salt, pickling spice, and optional food coloring; bring to a boil and simmer 5 minutes.","Strain out pickling spices and pour the hot brine over the eggs to submerge them completely (or cool brine to room temperature first if preferred).","Let cool, cover tightly, and refrigerate at least 3 days before serving so the brine flavors the eggs."],"vary":["Add sliced raw onion or a clove of garlic to the jar for extra tang."],"macro":null,"tagline":"Spiced Vinegar Brine Bar-Style Eggs","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Vinegar"},
  {"id":531,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Golden Carrot Cookies","servings":"48 Cookies","servN":48,"ing":["1 cup butter","¾ cup sugar","1 cup cooked mashed carrots","2 eggs","2 cups flour","2 tsp baking powder","½ tsp salt","¾ cup shredded coconut"],"steps":["Preheat the oven to 400°F and lightly grease baking sheets.","In a mixing bowl, beat the softened butter, sugar, cooked mashed carrots, and eggs together until smooth and thoroughly blended.","Sift together the flour, baking powder, and salt, then stir into the carrot mixture along with the shredded coconut until just combined.","Drop the dough 2 inches apart onto the prepared sheets and bake at 400°F for 8 to 10 minutes until set and lightly golden at the edges."],"vary":["Serve plain once cool, or pair with a simple glaze after baking."],"macro":null,"tagline":"Tender Soft Carrot Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Shredded Coconut"},
  {"id":532,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Butter Frosting","servings":"12 Servings","servN":12,"ing":["⅓ cup butter","3 cups powdered sugar","3 tbsp heavy whipping cream","1½ tsp vanilla"],"steps":["Beat the softened butter in a medium bowl until creamy.","Gradually beat in the powdered sugar, heavy whipping cream, and vanilla until smooth, fluffy, and spreadable. Frost a cooled cake."],"vary":["Orange or Lemon Frosting: Omit the vanilla and replace the 3 tbsp heavy cream with 3 tbsp fresh orange or lemon juice, beating in 1½ tsp finely grated orange or lemon peel."],"macro":null,"tagline":"Classic Vanilla, Orange, or Lemon","score":null,"sc":null,"diff":"Easy","time":"8 mins","extras":"Heavy Cream"},
  {"id":533,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pumpkin Cookies","servings":"36 Cookies","servN":36,"ing":["½ cup shortening","1 cup sugar","½ cup brown sugar","1 cup pumpkin puree","1 egg","1 tsp vanilla","2½ cups flour","2 tsp baking powder","1 tsp baking soda","½ tsp salt","1 tsp cinnamon","½ tsp ground nutmeg","½ cup chopped walnuts","1 cup raisins"],"steps":["Preheat the oven to 350°F and grease two baking sheets. Cream the shortening, white sugar, and brown sugar together until light and fluffy, then beat in the egg and vanilla.","In another bowl, whisk together the flour, baking powder, baking soda, salt, cinnamon, and ground nutmeg.","Stir the dry ingredients into the creamed mixture alternately with the pumpkin puree, beating after each addition until smooth. Fold in the chopped walnuts and raisins.","Drop by rounded spoonfuls onto the prepared sheets and bake at 350°F for 10 to 12 minutes, until puffed and lightly set."],"vary":["Swap 1 cup chocolate chips for the raisins as noted on the card."],"macro":null,"tagline":"Soft Spiced Pumpkin Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Pumpkin Puree, Walnuts"},
  {"id":534,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Brownies","servings":"24 Squares","servN":24,"ing":["1¼ cups butter","⅔ cup chocolate chips","5 eggs","2 cups sugar","2 cups flour","1 cup chopped nuts","2 tsp vanilla","2 cups powdered sugar"],"steps":["Preheat oven to 350°F and line a 9×13-inch baking pan with parchment paper.","Melt 1 cup of the butter and ½ cup of the chocolate chips together in a saucepan over low heat, stirring until smooth; set aside to cool slightly.","Beat 4 of the eggs and the granulated sugar together in a large bowl until thick and pale, then stir in the cooled chocolate mixture.","Fold in the flour, chopped nuts, and vanilla until just combined. Spread evenly in the prepared pan and bake at 350°F for 25 minutes, until a toothpick inserted near the center comes out with moist crumbs. Cool in the pan.","For the icing, melt the remaining ¼ cup butter and remaining chocolate chips together over low heat. Remove from heat and immediately whisk in the remaining 1 egg and the powdered sugar until smooth and glossy; spread over the cooled brownies before cutting into 24 squares."],"macro":null,"tagline":"Maysie Peacock’s Frosted Brownies","score":null,"sc":null,"diff":"Medium","time":"45 mins","extras":"Chopped nuts"},
  {"id":535,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick-Mix Yellow Cake","servings":"12 Servings","servN":12,"ing":["3 cups quick mix","1⅓ cups sugar","1 cup milk","2 eggs","1 tsp vanilla"],"steps":["Preheat oven to 375°F and line a 12-cup muffin tin with paper liners (or grease and flour two 8-inch round cake pans).","Stir the Quick Mix and sugar together in a large bowl. In another bowl, beat the milk, eggs, and vanilla together.","Pour half of the liquid mixture into the dry ingredients and beat briskly 2 minutes (about 300 strokes) until smooth, then add the remaining liquid and beat 2 minutes more.","Divide the batter into the cupcake liners and bake at 375°F for 15 to 18 minutes for cupcakes (or 30 minutes for two cake layers) until a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Quick-Mix One-Bowl Tender Yellow Cake","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":536,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Spiced Oatmeal Chocolate Chip Cookies","servings":"24 Cookies","servN":24,"ing":["½ cup shortening","1 cup sugar","1 egg","⅓ cup milk","1¾ cups rolled oats","¾ cup raisins","½ cup flour","½ tsp salt","¾ tsp baking powder","¾ tsp cinnamon","½ tsp ground cloves","½ tsp ground nutmeg","½ cup chopped walnuts (optional)"],"steps":["Preheat oven to 375°F and line baking sheets with parchment paper.","Sift or whisk together flour, salt, baking powder, cinnamon, ground cloves, and ground nutmeg.","Cream shortening and sugar until smooth, beat in egg, then stir in rolled oats, raisins, and optional chopped walnuts.","Add milk alternately with the dry spice mixture, stirring just until combined.","Drop by rounded teaspoonfuls onto prepared sheets and bake at 375°F for 15 to 20 minutes until golden brown. Cool on wire racks; these keep especially well in an airtight tin."],"vary":["Swap chocolate chips for the raisins, or omit the walnuts."],"macro":null,"tagline":"Spiced Raisin Oat Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Walnuts"},
  {"id":537,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Raisin & Nut Muffins","servings":"12 Muffins","servN":12,"ing":["2 cups flour","2 tsp baking powder","½ tsp salt","¼ cup sugar","1 egg","1 cup milk","2 tbsp shortening","¼ cup chopped walnuts","½ cup raisins","¼ tsp cinnamon"],"steps":["Preheat the oven to 425°F and grease a 12-cup muffin tin.","In a small bowl, stir together 2 tbsp of the sugar and the cinnamon for the topping. Melt the shortening and let it cool slightly.","Sift together the flour, baking powder, salt, and the remaining 2 tbsp sugar. Whisk the egg, milk, and melted shortening together, then stir into the dry ingredients just until moistened—do not overmix. Gently fold in the chopped walnuts and raisins.","Fill the muffin cups two-thirds full, sprinkle the cinnamon-sugar mixture evenly over the tops, and bake at 425°F for 18 to 20 minutes until golden and a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Cinnamon-Topped Farmhouse Muffins","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Shortening, Walnuts"},
  {"id":538,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Coffee Cake","servings":"16 Servings","servN":16,"ing":["½ cup chopped walnuts","1 box (15.25 oz) yellow cake mix","1 pkg (3.4 oz) vanilla pudding mix","4 eggs","1 cup water","¼ cup all-purpose flour","⅔ cup oil","2 tbsp butter extract","¼ cup sugar","2 tbsp cinnamon","1 cup powdered sugar","1 tsp vanilla","4 tbsp milk"],"steps":["Preheat the oven to 350°F. Grease a 10-inch tube (angel food) pan lightly with a film of the oil and sprinkle ¼ cup of the chopped walnuts evenly over the bottom.","In a large mixing bowl, combine the yellow cake mix, dry vanilla pudding mix, eggs, water, all-purpose flour, remaining oil, and 1 tablespoon of the butter extract. Beat with an electric mixer on high speed for 8 minutes until thick and pale.","In a small bowl, stir together the sugar, remaining ¼ cup chopped walnuts, and cinnamon.","Pour a layer of batter into the pan first, then alternate layers of the cinnamon-nut mixture and remaining batter, ending with batter on top.","Bake at 350°F for 55 to 60 minutes until a toothpick inserted in the center comes out clean. Cool right side up in the pan for 8 minutes, then turn out onto a serving plate.","Whisk the powdered sugar, vanilla, milk, and remaining 1 tablespoon butter extract until smooth and drizzle over the warm cake."],"macro":null,"tagline":"High-Altitude Cinnamon Swirl Bundt","score":null,"sc":null,"diff":"Medium","time":"1 hr 25 mins","extras":"Walnuts, Butter Extract"},
  {"id":539,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Jubilee Jumbles","servings":"36 Cookies","servN":36,"ing":["½ cup shortening","1 cup brown sugar","½ cup sugar","2 eggs","1 cup evaporated milk","1 tsp vanilla","2¾ cups flour","½ tsp baking soda","1 tsp salt"],"steps":["Preheat the oven to 375°F and grease two baking sheets. Beat the shortening, brown sugar, white sugar, and eggs together until smooth and creamy.","Stir in the evaporated milk and vanilla.","Whisk together the flour, baking soda, and salt, then stir into the wet mixture until well combined.","Drop by rounded tablespoonfuls onto the greased baking sheets and bake at 375°F for 10 to 12 minutes, until the edges are lightly golden and the centers spring back lightly."],"vary":["Stir in ½ cup each of raisins, chopped walnuts, chocolate chips, chopped dates, or shredded coconut—or blend in 3 tbsp cocoa powder for chocolate jumbles, as noted on page 2 of the card."],"macro":null,"tagline":"Soft Cake-Like Drop Cookies","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":540,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cream of Celery Soup","servings":"6 Servings","servN":6,"ing":["2 cups chopped celery","⅓ cup onion","1 cup water","4 tbsp butter","3 tbsp flour","3 cups milk","½ tsp salt","¼ tsp black pepper"],"steps":["Place the chopped celery (including tender leaves), chopped onion, water, and ¼ teaspoon of the salt in a covered saucepan. Bring to a boil, then simmer covered for 10 to 12 minutes until the celery is tender; do not drain.","In a medium saucepan over medium heat, melt 3 tablespoons of the butter, stir in the flour, and cook 1 minute until smooth.","Gradually whisk in the milk and simmer over medium-low heat for 5 to 7 minutes, stirring often, until thickened into a smooth thin white sauce.","Stir the cooked celery, onions, and their cooking liquid into the white sauce. Add the remaining ¼ teaspoon salt, black pepper, and remaining 1 tablespoon butter; heat through gently without boiling and serve warm."],"macro":null,"tagline":"From-Scratch White Sauce Soup","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Chopped celery"},
  {"id":541,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Grapefruit Served in Halves","servings":"4 Servings (4 Halves)","servN":4,"ing":["2 grapefruit"],"steps":["Wash the grapefruit thoroughly under cool water and pat dry.","Cut each grapefruit in half crosswise and trim out the center core and seeds with kitchen shears or a sharp paring knife.","Run a small sharp knife between the pulp of each segment and the surrounding membrane, working from the center out toward the rind and back, to loosen every segment for easy eating. Serve chilled."],"vary":["Prepare 2 large oranges the exact same way."],"macro":null,"tagline":"Cleanly Sectioned Fresh Citrus Halves","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Grapefruit"},
  {"id":542,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hot Tomato Beef Broth","servings":"6 Servings","servN":6,"ing":["3 cups tomato juice","1½ cups beef broth","½ tsp celery salt"],"steps":["Combine tomato juice, beef broth, and celery salt in a saucepan over medium heat.","Heat 5 to 8 minutes, stirring occasionally, until steaming hot without boiling, and ladle into warmed mugs."],"vary":["Use 1 beef bouillon cube dissolved in 1½ cups hot water in place of the beef broth."],"macro":null,"tagline":"Savory Winter Mug Starter","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Tomato Juice, Beef Broth, Celery Salt"},
  {"id":543,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Homemade Cinnamon Rolls","servings":"24 Buns","servN":24,"ing":["1 cup milk","1 cup warm water","1 cup sugar","2 tsp salt","2 pkgs (0.25 oz) active dry yeast","7 cups flour","1 tsp ground nutmeg","⅔ cup shortening","2 eggs","1 tsp vanilla","¼ cup butter","1 tbsp cinnamon","½ cup raisins"],"steps":["Scald the milk in a small saucepan over medium heat, then cool to lukewarm and stir in the warm water. Whisk in 2 tbsp of the sugar, the salt, active dry yeast, and 2 cups of the flour to form a smooth sponge; cover and let rise in a warm place 45 minutes until bubbly.","Beat the nutmeg, ⅔ cup of the sugar, shortening, eggs, and vanilla into the sponge. Gradually stir in the remaining 5 cups flour until a soft dough forms, then turn onto a lightly floured board and knead 8 to 10 minutes until smooth and elastic.","Place the dough in a greased bowl, cover, and let rise 1 to 1½ hours until doubled in bulk.","Punch down and roll into a large rectangle about ½-inch thick. Spread evenly with the softened butter, sprinkle with the remaining sugar, cinnamon, and raisins, roll up tightly into a log, and slice into 1-inch rounds.","Arrange the rolls in two greased 9×13-inch baking pans, cover, and let rise 1 hour until puffy. Preheat the oven to 350°F and bake 20 to 25 minutes until golden brown."],"macro":null,"tagline":"Janes’s Yeast Sponge Rolls","score":null,"sc":null,"diff":"In-Depth","time":"4 hrs","extras":"Ground Nutmeg, Shortening"},
  {"id":544,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Grandma’s Caramel Popcorn","servings":"24 Servings (2 Cups)","servN":24,"ing":["2 cups brown sugar","1 cup light corn syrup","½ cup butter","½ tsp salt","1 can (14 oz) sweetened condensed milk","48 cups popped popcorn"],"steps":["Place the popped popcorn in a very large roasting pan or greased bowl.","In a heavy 3-quart saucepan over medium heat, combine the brown sugar, light corn syrup, butter, and salt; stir constantly until the mixture reaches a rolling boil.","Stir in the sweetened condensed milk and continue boiling, stirring constantly so the bottom does not scorch, until a candy thermometer reads 238°F (soft-ball stage, where a drop in cold water forms a soft ball), about 8 to 10 minutes.","Immediately pour the hot caramel evenly over the popcorn and toss gently until well coated. Cool before serving or shaping into popcorn balls."],"macro":null,"tagline":"Eagle Brand Caramel Corn Batch","score":null,"sc":null,"diff":"Medium","time":"25 mins","extras":"Light Corn Syrup, Sweetened Condensed Milk, Popped Popcorn"},
  {"id":545,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Marshmallow Peanut Clusters","servings":"36 Clusters","servN":36,"ing":["1 cup peanut butter","1 pkg (12 oz) chocolate chips","1 pkg (12 oz) salted peanuts","4 cups miniature marshmallows"],"steps":["Line two baking sheets with waxed paper. In the top of a double boiler over simmering water, melt the peanut butter and chocolate chips together, stirring until completely smooth, about 5 minutes.","Stir in the salted peanuts until coated, then remove from heat and let cool for 2 minutes so the marshmallows do not melt.","Fold in the miniature marshmallows, drop by spoonfuls onto the waxed paper, and chill 30 minutes until firm."],"macro":null,"tagline":"No-Bake Double-Boiler Candy Drops","score":null,"sc":null,"diff":"Easy","time":"40 mins","extras":"Peanuts, Marshmallows"},
  {"id":546,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Old-Fashioned Sugar Cookies","servings":"252 Small Cookies (21 Dozen)","servN":252,"ing":["7 cups flour","5½ tsp baking powder","1 tsp salt","2¼ cups sugar","1 lb shortening","4 eggs","1 cup milk"],"steps":["Preheat oven to 375°F and line baking sheets with parchment paper.","Sift or whisk together the flour, baking powder, and salt in a very large bowl.","Cut the shortening into the flour mixture with a pastry blender until it resembles coarse crumbs, as for pastry.","Stir in 2 cups of the sugar, then add the beaten eggs and milk and mix thoroughly until a soft dough holds together.","Roll the dough out thinly on a lightly floured surface (about ⅛ inch thick) and cut into desired shapes. Transfer to baking sheets, sprinkle lightly with the remaining ¼ cup sugar, and bake at 375°F for 8 to 10 minutes until set and barely golden at the edges."],"vary":["Use leaf lard instead of vegetable shortening for the classic heirloom flavor noted in Aunt Martha Rowland’s original recipe."],"macro":null,"tagline":"Aunt Martha Rowland’s Heirloom Cookies","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":null},
  {"id":547,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Crowd-Size Sloppy Joes","servings":"30 Servings","servN":30,"ing":["5 lb ground beef","3 onions (chopped)","2 green bell peppers (chopped)","2 cups chopped celery","28 oz ketchup","½ cup yellow mustard","½ cup brown sugar","½ cup worcestershire sauce","2 cans (10.5 oz) chicken gumbo soup"],"steps":["In a large heavy stockpot or Dutch oven over medium-high heat, brown the ground beef with the chopped onions 10 to 12 minutes until the meat reaches 160°F and no pink remains; drain excess fat.","Stir in the chopped green bell peppers, chopped celery, ketchup, mustard, brown sugar, Worcestershire sauce, and chicken gumbo soup.","Bring to a gentle simmer and cook uncovered over medium-low heat 25 to 30 minutes, stirring occasionally, until thickened and the vegetables are tender. Serve hot."],"vary":["Spoon hot over 30 toasted hamburger buns."],"macro":null,"tagline":"Thirty-Serving Reunion Sloppy Joe Pot","score":null,"sc":null,"diff":"Easy","time":"45 mins","extras":"Celery, Chicken gumbo soup"},
  {"id":548,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Maple Flavored Syrup","servings":"12 Servings (2 Cups)","servN":12,"ing":["1 cup sugar","1 cup brown sugar","1 cup water","½ tsp maple flavoring"],"steps":["Combine sugar, brown sugar, and water in a saucepan over low heat, stirring until the sugars dissolve completely.","Increase heat to medium-high, bring to a boil, and boil 2 to 3 minutes without stirring until thickened to a glossy syrup.","Remove from heat and stir in maple flavoring just before serving."],"vary":["Simmer 1 minute longer for a thicker waffle syrup."],"macro":null,"tagline":"Two-Sugar Pantry Pancake Syrup","score":null,"sc":null,"diff":"Easy","time":"12 mins","extras":"Maple Flavoring"},
  {"id":549,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Grandma’s Oven German Pancakes","servings":"4 Servings","servN":4,"ing":["6 eggs","1 cup milk","1 cup flour","½ tsp salt","5 tbsp butter","½ cup syrup"],"steps":["Preheat the oven to 450°F. Place the butter in a 9×13-inch baking pan (or heavy ovenproof skillet) and set it in the preheating oven for 4 to 5 minutes until melted and sizzling.","Meanwhile, whip the eggs until thick and pale lemon-colored, then whisk in the milk, flour, and salt until smooth.","Pour the batter directly into the hot melted butter and bake at 450°F for 15 to 20 minutes until puffed high and deeply golden around the edges. Warm the syrup gently on the stove and serve immediately."],"macro":null,"tagline":"Puffed Golden Oven Pancake","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":null},
  {"id":550,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Bagels","servings":"14 Bagels","servN":14,"ing":["3¼ cups all-purpose flour","1 tsp salt","4 tbsp sugar","1 packet (0.25 oz) active dry yeast","⅔ cup warm water","3 tbsp oil","2 eggs"],"steps":["Dissolve the active dry yeast in ⅓ cup of the warm water (105°F–110°F) and let stand 5 minutes until foamy. Whisk the all-purpose flour, salt, and 2 tablespoons of the sugar together in a large bowl (reserving ¼ cup flour for the board).","Stir the yeast mixture, remaining ⅓ cup warm water, oil, and beaten eggs into the flour mixture until a cohesive dough forms.","Turn out onto the floured board and knead thoroughly for 5 to 8 minutes until smooth and elastic. Place in a lightly oiled bowl, cover, and let rise in a warm place until doubled, about 1 hour.","Punch the dough down and let rise 30 minutes; punch down and let rise 20 minutes more, then turn out and knead briefly until smooth. Divide into 14 pieces, roll each into a 6-inch rope about ¾ inch thick, and pinch the ends firmly together to form rings.","Bring 4 quarts of water with the remaining 2 tablespoons sugar to a gentle boil in a large pot. Drop bagels in a few at a time and simmer 4 to 5 minutes from the time they float to the surface.","Lift onto a very lightly greased baking sheet and cool 5 minutes, then bake at 375°F for 25 to 35 minutes until golden brown."],"vary":["For traditional heirloom flavor, substitute warm potato cooking water for the ⅔ cup warm water in the dough."],"macro":null,"tagline":"Kettle-Boiled & Baked Homemade Bagels","score":null,"sc":null,"diff":"In-Depth","time":"2 hrs 45 mins","extras":null},
  {"id":551,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Classic Date Nut Bread","servings":"20 Slices (2 Loaves)","servN":20,"ing":["1 cup chopped dates","2 cups water","2 tsp baking soda","1 tbsp lemon juice","1 cup sugar","¼ cup butter","2 eggs","1 tsp vanilla","2¾ cups flour","½ tsp salt","½ cup chopped walnuts"],"steps":["Preheat the oven to 350°F and grease two 8×4-inch loaf pans. Place the chopped dates, baking soda, and lemon juice in a bowl, pour 2 cups boiling water over them, and let cool for 15 minutes.","In a mixing bowl, beat the sugar, softened butter, eggs, and vanilla together until light and frothy.","Stir the cooled date mixture into the egg mixture, then fold in the flour, salt, and chopped walnuts until just combined.","Divide the batter evenly between the loaf pans and bake at 350°F for 55 to 60 minutes, until a toothpick inserted in the center comes out clean."],"macro":null,"tagline":"Moist Steeped-Date Quick Loaves","score":null,"sc":null,"diff":"Medium","time":"1 hr 20 mins","extras":"Dates, Lemon Juice, Walnuts"},
  {"id":552,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cottage Cheese Crunch","servings":"4 Servings","servN":4,"ing":["1 cup cottage cheese","¼ cup salted peanuts","2 tbsp onion","24 crackers"],"steps":["Blend the finely minced onion into the cottage cheese in a small bowl, then fold in the crushed salted peanuts.","Cover and chill in the refrigerator for 2 to 3 hours so the flavors meld. Serve chilled, spread on small crackers."],"macro":null,"tagline":"Chilled Peanut & Onion Dip","score":null,"sc":null,"diff":"Easy","time":"2 hrs 10 mins","extras":"Salted peanuts, Crackers"},
  {"id":553,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Tammy Wilberg's Peanut Butter Cookies","servings":"48 Cookies","servN":48,"ing":["1 cup shortening","1 cup sugar","1 cup brown sugar","2 eggs","1 cup peanut butter","1 tsp vanilla","2½ cups flour","2 tsp baking soda","⅛ tsp salt"],"steps":["Preheat oven to 375°F.","Cream the shortening, white sugar, and brown sugar together until smooth, then beat in the eggs, peanut butter, and vanilla until well blended.","Whisk the flour, baking soda, and salt together and stir into the peanut butter mixture; knead briefly by hand until smooth and cohesive.","Roll into walnut-sized balls, space 2 inches apart on an ungreased baking sheet, and flatten in a crisscross pattern with the tines of a fork.","Bake at 375°F for 10 to 12 minutes until lightly golden around the edges. Cool 2 minutes on the sheet before transferring to a rack."],"macro":null,"tagline":"Tammy Wilberg’s Crisscross Peanut Cookies","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":null},
  {"id":554,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Brown Betty","servings":"8 Servings","servN":8,"ing":["6 cups sliced apples","2 cups graham cracker crumbs","½ cup sugar","½ cup brown sugar","1 tsp cinnamon","⅓ cup butter","1 cup milk","1 cup heavy whipping cream"],"steps":["Preheat oven to 375°F (or 350°F if using canned apples) and butter an 8x8-inch or 2-quart baking dish with 1 tbsp of the butter.","Toss crushed graham cracker crumbs with granulated sugar.","Arrange a layer of sliced apples in the dish and sprinkle with brown sugar, cinnamon, and crumb mixture; repeat layers until the dish is full.","Dot the top with remaining butter and pour milk gently down the sides until liquid reaches about 1 inch from the top.","Bake at 375°F for 45 to 60 minutes (or 350°F for 20 to 30 minutes for canned apples) until apples are tender and top is crisp-golden. Whip heavy whipping cream to soft peaks and spoon over warm servings."],"vary":["Use 2 cans (20 oz) sliced pie apples in place of fresh apples for a faster 30-minute bake at 350°F."],"macro":null,"tagline":"Baked Graham Cracker & Apple Crisp","score":null,"sc":null,"diff":"Easy","time":"1 hr 15 mins","extras":"Graham Cracker Crumbs, Heavy Whipping Cream"},
  {"id":555,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apple Cobbler","servings":"8 Servings","servN":8,"ing":["3 cups flour","4 oz shortening","4 tsp baking powder","1 tsp salt","1 cup milk","4 apples","2 cups water","2 cups sugar","1 pkg (2.25 oz) red cinnamon candies","1 tsp cinnamon"],"steps":["Preheat the oven to 400°F. Peel, core, and slice the apples.","Whisk the flour, baking powder, and salt together, cut in the shortening until crumbly, and stir in the milk to make a soft dough. Roll out on a floured surface, cut into 3- to 4-inch squares, fold sliced apples into each square, and arrange in a 9×13-inch baking pan.","In a saucepan over medium-high heat, combine the water, sugar, red cinnamon candies, and cinnamon. Boil for 5 minutes, stirring, until the candies completely dissolve into a ruby syrup, then pour the hot syrup over the apple dumplings in the pan.","Bake at 400°F for 30 minutes, then reduce the oven to 350°F and bake 15 minutes longer until the pastry is crisp-golden and the cinnamon syrup bubbles thickly."],"macro":null,"tagline":"Cinnamon-Candy Syrup Apple Dumplings","score":null,"sc":null,"diff":"Medium","time":"1 hr 10 mins","extras":"Shortening, Red Cinnamon Candies"},
  {"id":556,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Dill Pickles","servings":"24 Servings","servN":24,"ing":["4 lbs cucumbers","1 tsp pickling alum","8 cups water","4 cups white vinegar","1 cup salt","12 fresh dill sprigs"],"steps":["Wash the cucumbers and soak them overnight in 1 quart of cold water stirred with the pickling alum (scale the alum water if needed to cover); drain and rinse well.","Pack the cucumbers into 4 clean quart jars, tucking 3 fresh dill sprigs into each jar.","In a large pot, combine the 8 cups water, white vinegar, and salt and bring to a rolling boil over high heat, stirring until the salt dissolves.","Carefully pour the boiling brine over the cucumbers, leaving ½-inch headspace, and seal tight to finish the dill pickles (or process 10 minutes in a boiling-water bath for shelf storage)."],"vary":["Add 1 peeled garlic clove to each quart jar before pouring in the hot brine, as noted on the companion card."],"macro":null,"tagline":"Crisp Alum-Brined Dill Pickles","score":null,"sc":null,"diff":"Medium","time":"12 hrs 25 mins","extras":"Pickling Alum, Fresh Dill"},
  {"id":557,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pancakes and Waffles","servings":"6 Servings (18 Pancakes or 6 Waffles)","servN":6,"ing":["3 cups quick mix","1½ cups milk","2 eggs"],"steps":["Preheat a griddle to 375°F (or preheat a waffle iron) and grease lightly. Beat the eggs and milk together until frothy.","Stir the egg-milk mixture into the quick mix just until blended; leave a few small lumps.","For pancakes, ladle ¼-cup portions onto the hot griddle and cook 2 to 3 minutes per side until bubbles pop on top and both sides are golden. For waffles, pour onto the hot waffle iron and bake about 4 minutes until steaming stops and crisp."],"macro":null,"tagline":"Quick Mix Griddle & Iron Standard","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":null},
  {"id":558,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Jiffy Jell-O Salad","servings":"8 Servings","servN":8,"ing":["2 cups cottage cheese","1 pkg (3 oz) orange gelatin","1 can (20 oz) crushed pineapple","1 pkg (8 oz) whipped topping"],"steps":["Place the cottage cheese, dry orange gelatin, undrained crushed pineapple, and thawed whipped topping in a large bowl.","Stir and fold together until smooth and evenly colored.","Serve right away or chill in the refrigerator for 30 minutes to 1 hour until lightly set."],"macro":null,"tagline":"Four-Ingredient Orange Pineapple Fluff","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Crushed pineapple, Whipped topping"},
  {"id":559,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Root Beer Float","servings":"1 Serving","servN":1,"ing":["½ cup root beer","½ cup milk","½ cup vanilla ice cream"],"steps":["Pour the chilled root beer and cold milk into a tall glass and stir gently once to blend.","Top with the ½ cup (1 generous scoop) vanilla ice cream and serve immediately."],"macro":null,"tagline":"Creamy Half-and-Half Fountain Float","score":null,"sc":null,"diff":"Easy","time":"3 mins","extras":"Root beer, Vanilla ice cream"},
  {"id":560,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Double-Butter Caramel Popcorn","servings":"24 Servings","servN":24,"ing":["24 cups air-popped popcorn","1 cup butter","½ tsp salt","1 cup brown sugar","1 can (14 oz) sweetened condensed milk","1 cup light corn syrup"],"steps":["Place air-popped popcorn in a very large bowl, scooping out popped kernels and discarding any unpopped ones.","Melt butter in a heavy saucepan over medium heat, then stir in brown sugar, sweetened condensed milk, light corn syrup, and salt.","Cook 15 minutes, stirring constantly as it boils gently for the last 5 to 8 minutes, until the caramel reaches soft-ball stage (235°F to 240°F on a candy thermometer).","Pour half the hot caramel over half the popcorn, add the remaining popcorn and caramel, and toss carefully with buttered spoons until evenly coated."],"vary":["Boil 2 minutes longer to firm-ball stage so the coated popcorn shapes cleanly into popcorn balls."],"macro":null,"tagline":"Soft-Ball Condensed Milk Caramel Corn","score":null,"sc":null,"diff":"Medium","time":"30 mins","extras":"Air-Popped Popcorn, Sweetened Condensed Milk, Light Corn Syrup"},
  {"id":561,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hamburger Casserole","servings":"6 Servings","servN":6,"ing":["1 lb ground beef","1 slice bread","2 potatoes","2 carrots","1 onion","1 egg","1 tsp salt","½ tsp black pepper","1 can (10.5 oz) cream of mushroom soup","½ cup milk","1 cup cheddar cheese"],"steps":["Preheat the oven to 350°F and grease a 2-quart casserole dish.","Brown the ground beef in a skillet over medium-high heat for 6 to 8 minutes until no pink remains (160°F), then drain excess fat.","Grate the potatoes, carrots, and onion, tear the bread slice into small pieces, and mix in the casserole dish with the browned beef, beaten egg, salt, and black pepper.","Whisk the cream of mushroom soup with the milk until smooth, pour evenly over the mixture, and sprinkle with shredded cheddar cheese. Bake uncovered at 350°F for 1 hour until the vegetables are tender and the top is bubbling and golden."],"macro":null,"tagline":"Teresa W. Bradley’s Card","score":null,"sc":null,"diff":"Easy","time":"1 hr 20 mins","extras":null},
  {"id":562,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Refrigerator Mashed Potatoes","servings":"12 Servings","servN":12,"ing":["9 large potatoes","2 pkg (3 oz) cream cheese","1 cup sour cream","2 tsp onion salt","1 tsp salt","¼ tsp black pepper","2 tbsp butter"],"steps":["Peel and quarter the potatoes, place in a large pot of water, and boil 18 to 22 minutes until fork-tender; drain well.","Mash the hot potatoes until smooth, then beat in the softened cream cheese, sour cream, onion salt, salt, and black pepper until light and fluffy.","Cool completely, cover tightly, and refrigerate for up to 2 weeks until ready to bake.","When ready to serve, preheat the oven to 350°F, spoon the desired amount into a greased casserole dish, dot the top with butter, and bake at 350°F for 30 minutes until heated through."],"macro":null,"tagline":"Elaine B. Hatch’s Make-Ahead Mash","score":null,"sc":null,"diff":"Easy","time":"1 hr","extras":"Cream Cheese"},
  {"id":563,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Frank-a-Roni Dinner","servings":"6 Servings","servN":6,"ing":["1 pkg (7 oz) macaroni","1 tbsp butter","2 tbsp onion","½ tsp salt","¼ tsp garlic salt","8 beef franks","1 cup cottage cheese","1 cup sour cream","1 cup cheddar cheese"],"steps":["Preheat the oven to 350°F. Cook the macaroni in boiling water for 7 to 8 minutes until tender; drain well.","In a small skillet over medium heat, melt the butter and sauté the finely chopped onion for 3 minutes until tender; stir in the salt and garlic salt.","Slice 7 of the beef franks into ½-inch pieces, reserving 1 frank for garnish. In a large bowl, gently toss the cooked macaroni, onion mixture, cut franks, cottage cheese, and sour cream until combined, then turn into a 2-quart casserole dish.","Slice the reserved frank crosswise into thin coins and arrange in a ring on top; sprinkle the shredded cheddar cheese inside the ring. Bake at 350°F for 30 minutes until bubbling and hot through (160°F)."],"macro":null,"tagline":"Elaine Hatch's USU Extension Casserole","score":null,"sc":null,"diff":"Easy","time":"45 mins","extras":null},
  {"id":564,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cranberry Danish Cream","servings":"8 Servings","servN":8,"ing":["1 pkg (4.75 oz) Danish Dessert mix","2 cups cranberry juice cocktail","1 pkg (3.4 oz) pudding mix","2 cups milk","½ cup heavy whipping cream","¼ cup slivered almonds"],"steps":["Whisk the Danish Dessert mix into the cranberry juice cocktail in a saucepan, bring to a boil over medium heat, and simmer 1 minute, stirring constantly, until thickened and clear; cool 30 minutes.","Meanwhile, whisk the custard-flavored pudding mix with the milk in a second saucepan (or bowl if using instant) and prepare according to package directions. Pour into 8 sherbet glasses and chill 30 minutes until set.","Carefully spoon the cooled cranberry Danish Dessert over the custard layer. Chill about 3 hours until completely set.","Whip the heavy whipping cream to soft peaks, spoon fluffs over each serving, and garnish with toasted slivered almonds."],"macro":null,"tagline":"Elaine Hatch’s Layered USU Dessert","score":null,"sc":null,"diff":"Medium","time":"3 hrs 45 mins","extras":"Danish Dessert mix, Cranberry juice cocktail, Heavy whipping cream, Slivered almonds"},
  {"id":565,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Chinese-Style Cabbage","servings":"4 Servings","servN":4,"ing":["1 tbsp shortening","3 cups shredded cabbage","1 cup chopped celery","1 green bell pepper (chopped)","1 onion (chopped)","1 tsp salt","⅛ tsp black pepper"],"steps":["Heat the shortening in a large skillet over medium heat.","Add the shredded cabbage, chopped celery, chopped green bell pepper, and chopped onion, stirring well to coat.","Cover tightly and steam over medium heat for 5 minutes, stirring a couple of times, until crisp-tender.","Season with salt and black pepper and serve immediately."],"macro":null,"tagline":"Elaine Hatch’s Five-Minute Skillet Cabbage","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":"Cabbage, Celery"},
  {"id":566,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Broiled Bean-er Wiener Loaf","servings":"5 Servings","servN":5,"ing":["16 oz bread","1 tbsp mustard","2 tbsp butter","1 can (16 oz) pork and beans","¼ cup chopped onion","2 tbsp brown sugar","½ cup cheddar cheese","5 beef franks","5 sweet pickles"],"steps":["Turn on the oven broiler. Cut the French bread loaf lengthwise in half; blend softened butter with half the mustard and spread over the cut sides.","Mix drained pork and beans, chopped onion, and brown sugar; spoon over the buttered bread and sprinkle with cheddar cheese.","Broil about 7 inches from the heat for 5 minutes until cheese melts and bubbles.","Meanwhile, split beef franks lengthwise almost all the way through; lay split-side down crosswise over the beans and broil 5 minutes longer until franks are hot and lightly browned.","Fan sweet pickles along the top, drizzle with remaining mustard, and cut into 5 serving pieces."],"vary":["Top with crushed potato chips during the last minute of broiling for extra crunch."],"macro":null,"tagline":"Elaine B. Hatch, USU Extension","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Sweet Pickles"},
  {"id":567,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Picnic Chicken Virginia","servings":"6 Servings","servN":6,"ing":["¼ cup butter","⅓ cup peanut butter","⅔ cup milk","1 tsp salt","6 tbsp flour","6 tbsp cornmeal","1 tsp paprika","6 chicken drumsticks","6 chicken wings"],"steps":["Preheat the oven to 425°F. Line a 15×10-inch jelly-roll pan with foil, add the butter, and set in the oven for 5 minutes until melted; remove pan from the oven.","Whisk the peanut butter and milk together until smooth, then stir in the salt. In a shallow dish, whisk together the flour, cornmeal, and paprika.","Dip each drumstick and wing into the peanut butter mixture, then roll in the seasoned cornmeal-flour coating and arrange in the melted butter.","Bake at 425°F for 20 minutes, turn the chicken pieces over, and bake 15 to 20 minutes longer until crisp, golden, and cooked through to 165°F at the thickest part."],"macro":null,"tagline":"Parade Test Kitchen Crisp Chicken","score":null,"sc":null,"diff":"Medium","time":"50 mins","extras":"Cornmeal, Paprika, Bone-In Chicken"},
  {"id":568,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Vegetable Salad","servings":"8 Servings","servN":8,"ing":["1 pkg (3 oz) lemon gelatin","2 cups hot water","2 tbsp vinegar","½ cup sugar","1 cup shredded cabbage","1 cup grated carrots","1 cup chopped celery","1 bell pepper","1 tsp salt","1 cup mayo"],"steps":["In a mixing bowl, dissolve the lemon gelatin, sugar, and salt in the 2 cups hot water, then stir in the vinegar.","Chill in the refrigerator until syrupy and just beginning to set around the edges, about 45 minutes.","Whip the thickened gelatin briefly with a hand mixer, add the mayo, and beat until smooth. Fold in the shredded cabbage, grated carrots, chopped celery, and finely chopped bell pepper.","Pour into an 8x8-inch dish or mold and chill at least 3 hours until firmly set."],"vary":["Use lime gelatin (or a half-and-half blend of lemon and lime gelatin) in place of plain lemon gelatin."],"macro":null,"tagline":"Erma Huntington’s Molded Salad","score":null,"sc":null,"diff":"Easy","time":"4 hrs","extras":"Cabbage, Celery"},
  {"id":569,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Hope Anderson’s Layered Cranberry Salad","servings":"12 Servings","servN":12,"ing":["1 can (20 oz) crushed pineapple","1 pkg (6 oz) cherry gelatin","2 cups lemon-lime soda","1 can (14 oz) jellied cranberry sauce","1 pkg (8 oz) cream cheese","2 cups whipped topping","½ cup chopped walnuts"],"steps":["Drain the crushed pineapple, reserving the juice, and add enough water to the juice to measure 1½ cups. Bring the liquid to a boil in a saucepan, pour in the lemon-lime soda, return just to a boil, and remove from heat; stir in the cherry gelatin until completely dissolved.","Chill the gelatin mixture for 45 to 60 minutes until partially set around the edges. Fold in the drained crushed pineapple and mashed jellied cranberry sauce, transfer to a 9×13-inch dish, and refrigerate 2 to 3 hours until firm.","Beat the softened cream cheese until smooth, then fold in the whipped topping. Spread evenly over the set salad and scatter the chopped walnuts on top before serving."],"macro":null,"tagline":"Hope Anderson & Erma Huntington's Molded Salad","score":null,"sc":null,"diff":"Medium","time":"3 hrs 30 mins","extras":"Canned Pineapple, Lemon-Lime Soda, Cranberry Sauce, Cream Cheese, Whipped Topping, Walnuts"},
  {"id":570,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Shepherd's Pie","servings":"8 Servings","servN":8,"ing":["2 lb ground beef","1 large onion","1 can (14.5 oz) green beans","1 can (10.5 oz) tomato soup","½ cup milk","6 medium potatoes","1 egg","3 tbsp butter","½ tsp salt","¼ tsp black pepper","½ cup cheddar cheese"],"steps":["Preheat oven to 350°F. Peel and quarter the potatoes, place in a pot of lightly salted water, and boil 15 to 20 minutes until fork-tender; drain well.","Meanwhile, melt 1 tablespoon of the butter in a large skillet over medium-high heat. Add the ground beef and chopped onion and cook 7 to 9 minutes, stirring and breaking up the meat, until browned with no pink remaining (160°F).","Stir the tomato soup into the beef and simmer gently over low heat for 5 minutes while mashing the potatoes. Fold in the drained green beans, then spread the meat mixture in a 9×13-inch baking dish.","Mash the hot potatoes with the remaining 2 tablespoons butter, warm milk, beaten egg, salt, and black pepper until smooth. Spoon in mounds over the meat layer, sprinkle with shredded cheddar cheese, and bake at 350°F for 30 minutes until bubbling and lightly browned."],"vary":["Card note: prepared instant mashed potatoes may be used in place of boiled potatoes."],"macro":null,"tagline":"Elaine Hatch’s Homestyle Casserole","score":null,"sc":null,"diff":"Medium","time":"1 hr","extras":null},
  {"id":571,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Fruit Salad Delight","servings":"16 Servings","servN":16,"ing":["2½ cups miniature marshmallows","2 cans (11 oz) mandarin oranges (drained)","2 cans (8 oz) pineapple tidbits (drained)","1 can (3.5 oz) flaked coconut","2 cups sour cream"],"steps":["Drain the mandarin oranges and pineapple tidbits well so the dressing stays thick.","Combine the miniature marshmallows, drained mandarin oranges, drained pineapple tidbits, flaked coconut, and sour cream in a large bowl and stir gently until evenly coated.","Cover tightly and chill in the refrigerator overnight (at least 8 hours) so the marshmallows soften and the flavors blend. Serve cold."],"vary":["Use half sour cream and half unbeaten heavy whipping cream, or all heavy cream, in place of all sour cream; garnish with maraschino cherries for color."],"macro":null,"tagline":"Elaine Hatch’s Overnight Ambrosia Fruit Salad","score":null,"sc":null,"diff":"Easy","time":"8 hrs 15 mins","extras":"Marshmallows, Mandarin oranges, Pineapple tidbits, Flaked coconut"},
  {"id":572,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Steamed Carrots","servings":"4 Servings","servN":4,"ing":["1 lb carrots","½ cup water","4 tbsp butter","½ tsp salt","⅛ tsp black pepper","1 tsp sugar"],"steps":["Coarsely shred carrots and place in a saucepan with water, butter, salt, black pepper, and sugar.","Cover with a tight-fitting lid, bring to a brisk boil over medium-high heat (about 3 minutes), then turn off the heat immediately.","Let stand covered for 8 to 10 minutes without lifting the lid until carrots are tender and glossy."],"vary":["Toss finished carrots with chopped fresh parsley before serving."],"macro":null,"tagline":"Elaine B. Hatch, USU Extension","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":null},
  {"id":573,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Strawberry Short Pie Cobbler","servings":"6 Servings","servN":6,"ing":["1 pkg (4.75 oz) Danish Dessert mix","1½ cups water","1 pkg (10 oz) frozen strawberries","2 cups quick mix","⅔ cup milk","2 tbsp sugar","2 tbsp butter"],"steps":["Whisk the Danish Dessert mix and water together in a saucepan, bring to a boil over medium heat, and cook 1 to 2 minutes, stirring constantly, until thick and glossy. Remove from the heat, fold in the frozen strawberries, and let stand until thawed and evenly distributed, then spoon into 6 dessert bowls to cool.","Meanwhile, preheat the oven to 425°F. Melt the butter, then stir the quick mix, sugar, milk, and melted butter together just until a soft dough forms.","Pat the dough ½-inch thick on a lightly floured surface, cut into 6 rounds, place on an ungreased baking sheet, and bake at 425°F for 10 to 12 minutes until golden brown.","Set a warm shortcake round atop each bowl of cooled strawberry filling to serve."],"vary":["Swap strawberry Danish Dessert and strawberries for raspberry Danish Dessert and frozen raspberries."],"macro":null,"tagline":"Elaine B. Hatch, USU Extension","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Danish Dessert Mix, Frozen Fruit"},
  {"id":574,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Short Pie Rounds","servings":"4 Servings (1 Round)","servN":4,"ing":["½ cup Quick Mix","2 tbsp butter","1½ tbsp boiling water"],"steps":["Preheat the oven to 450°F.","Combine the Quick Mix and butter in a small bowl, pour in the boiling water, and stir vigorously with a fork until the dough forms a soft, puffy ball that cleans the bowl.","Divide into 4 equal pieces, flatten each with the palm of your hand into a 3-inch round on an ungreased baking sheet, prick with a fork, and pinch the edges.","Bake at 450°F for 8 minutes until lightly golden."],"vary":["Double or triple the recipe, wrap unbaked rounds in waxed paper, and refrigerate to top peach, apple, or cherry cobblers—or serve baked rounds with raspberry Danish Dessert and berries."],"macro":null,"tagline":"Elaine B. Hatch’s Cobbler Rounds","score":null,"sc":null,"diff":"Easy","time":"15 mins","extras":null},
  {"id":575,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Green Pea and Cheese Salad","servings":"2 Servings","servN":2,"ing":["¾ cup frozen peas","¼ cup cheddar cheese","2 tbsp mayo","1 tbsp onion","¾ tsp mustard","2 cups lettuce"],"steps":["Cook the frozen peas in boiling water for 2 to 3 minutes until crisp-tender, then drain and chill completely.","In a small bowl, combine the chilled peas, diced cheddar cheese, finely chopped onion, mayo, and mustard; toss gently until coated.","Chill 15 minutes and serve spooned over crisp lettuce leaves."],"macro":null,"tagline":"Elaine Hatch's Two-Serving Pea Salad","score":null,"sc":null,"diff":"Easy","time":"20 mins","extras":"Green Peas"},
  {"id":576,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick Mix Date Nut Bread","servings":"12 Slices (1 Loaf)","servN":12,"ing":["2 cups quick mix","½ tsp baking soda","½ tsp cinnamon","½ cup sugar","1½ cups chopped dates","1 egg","½ tsp vanilla","½ cup chopped nuts","⅔ cup boiling water"],"steps":["Preheat oven to 350°F and line a 9×5-inch loaf pan with wax paper or parchment paper.","Combine the chopped dates and sugar in a heatproof bowl, pour the boiling water over them, stir, and let cool to room temperature.","Beat the egg and vanilla into the cooled date mixture.","In a separate bowl, stir together the quick mix, baking soda, cinnamon, and chopped nuts.","Pour the liquid date mixture into the dry ingredients and stir just until well blended.","Transfer to the prepared loaf pan and bake at 350°F for 55 to 60 minutes, until a toothpick inserted in the center comes out clean. Cool 10 minutes in the pan before turning out onto a wire rack."],"macro":null,"tagline":"Quick Mix Sweet Loaf","score":null,"sc":null,"diff":"Easy","time":"1 hr 20 mins","extras":"Chopped dates, Chopped nuts"},
  {"id":577,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Quick-Mix Berry Shortcake","servings":"8 Servings","servN":8,"ing":["3 cups quick mix","3 tbsp sugar","1 egg","½ cup milk","2 tbsp melted butter","4 cups raspberries"],"steps":["Preheat oven to 425°F and lightly oil a baking sheet.","Stir the Quick Mix and sugar together in a bowl. Beat the egg and milk together, pour into the dry mixture, and stir with a fork about 25 strokes until just moistened.","Turn out onto a lightly floured surface, knead gently 6 strokes, and roll into a ½-inch-thick rectangle. Cut the dough in half and brush the top of each half with the melted butter.","Set one half on the oiled baking sheet, lay the second half directly on top, and bake at 425°F for 20 minutes until golden brown and baked through. Keep warm until serving.","Separate the warm layers and spoon the raspberries between the layers and over the top."],"vary":["Use sliced strawberries, blackberries, or peaches in place of raspberries, and top with whipped cream if desired."],"macro":null,"tagline":"Double-Layer Quick-Mix Biscuit Berry Shortcake","score":null,"sc":null,"diff":"Medium","time":"35 mins","extras":"Raspberries"},
  {"id":578,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Soft Custard","servings":"4 Servings","servN":4,"ing":["2 cups milk","3 eggs","4 tbsp sugar","⅛ tsp salt","1 tsp vanilla"],"steps":["In the top bowl of a double boiler, beat eggs with a whisk until yolks and whites are thoroughly blended, then whisk in sugar, salt, and milk.","Fill the bottom pot of the double boiler about half full with water, keeping water below the upper bowl, and bring to a gentle simmer—do not let it boil.","Set the egg mixture over the simmering water and cook 10 to 12 minutes, stirring constantly with a wooden spoon or whisk, until thickened enough to coat the back of a metal spoon.","Remove immediately from heat, stir in vanilla, and chill before serving."],"vary":["Serve chilled over fresh berries or sliced cake."],"macro":null,"tagline":"Silky Double-Boiler Pouring Custard","score":null,"sc":null,"diff":"Medium","time":"25 mins","extras":null},
  {"id":579,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Muffins","servings":"12 Muffins","servN":12,"ing":["2 cups flour","2 tsp baking powder","½ tsp salt","2 tbsp sugar","1 egg","1 cup milk","2 tbsp shortening"],"steps":["Preheat the oven to 425°F and grease a 12-cup muffin pan. Melt the shortening and let cool slightly.","Sift together the flour, baking powder, salt, and sugar in a mixing bowl. Whisk the egg, milk, and melted shortening together, then pour into the dry ingredients and stir just until the flour is moistened (the batter should stay slightly lumpy).","Fill the muffin cups two-thirds full and bake at 425°F for 20 minutes until golden and springy to the touch."],"macro":null,"tagline":"Grandma’s Base Plain Muffin Card","score":null,"sc":null,"diff":"Easy","time":"30 mins","extras":"Shortening"},
  {"id":580,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Apple Goodie","servings":"8 Servings","servN":8,"ing":["4 cups sliced apples","1 tsp cinnamon","½ cup sugar","1 cup brown sugar","1 cup all-purpose flour","1 cup rolled oats","¼ tsp salt","2 tsp baking powder","½ cup shortening"],"steps":["Preheat the oven to 350°F and lightly grease an 8x8-inch (or 9x9-inch) baking dish.","Arrange the sliced apples evenly in the bottom of the dish and sprinkle with the cinnamon and granulated sugar.","In a medium bowl, combine the brown sugar, all-purpose flour, rolled oats, salt, and baking powder, then cut in the shortening with a pastry blender or fingers until crumbly.","Scatter the oat topping evenly over the apples and bake at 350°F for 45 minutes until the apples are tender and the topping is golden brown."],"macro":null,"tagline":"Valoy Cox’s Baked Apple Crisp","score":null,"sc":null,"diff":"Easy","time":"55 mins","extras":null},
  {"id":581,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Home-Canned Tomato Alphabet Soup","servings":"40 Servings (10 Quarts)","servN":40,"ing":["26 lb tomatoes","1 cup sugar","½ cup salt","1 tsp black pepper","1 pkg (10 oz) pasta","4 cups diced celery","6 onions","3 bell peppers","1 cup butter"],"steps":["Core and chop the tomatoes into a large stockpot. Add the sugar, salt, black pepper, and alphabet pasta, bring to a boil over medium-high heat, and simmer 10 minutes, stirring occasionally so the pasta does not stick.","Meanwhile, finely chop the celery, onions, and bell peppers. Melt the butter in a large skillet over medium-low heat and sauté the vegetables for 25 to 30 minutes until very soft.","Stir the sautéed vegetables into the simmering tomato pot and boil gently for 10 minutes more. Ladle hot into sterilized quart jars and process according to modern safe canning guidelines (or cool and freeze in quart containers)."],"macro":null,"tagline":"Elaine Wilberg's 10-Quart Canning Batch","score":null,"sc":null,"diff":"In-Depth","time":"1 hr 15 mins","extras":"Celery"},
  {"id":582,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Donna's Salad","servings":"8 Servings","servN":8,"ing":["2 cups crushed pineapple","½ cup lemon juice","1 cup sugar","2 pkgs (0.25 oz) unflavored gelatin","½ cup cold water","1 cup chopped celery","1 cup cheddar cheese","1 cup chopped nuts","1 cup heavy whipping cream"],"steps":["Sprinkle the unflavored gelatin over the cold water in a small bowl and let stand 5 minutes to soften.","In a medium saucepan, combine the undrained crushed pineapple, lemon juice, and sugar. Bring to a boil over medium heat, stirring until the sugar dissolves.","Remove from heat and stir in the softened gelatin until completely dissolved. Transfer to a large bowl and chill 1 to 1½ hours until thickened to the consistency of unbeaten egg whites.","Whip the heavy whipping cream in a chilled bowl until soft peaks form. Fold the chopped celery, shredded cheddar cheese, chopped nuts, and whipped cream into the thickened pineapple gelatin.","Spoon into an 8×8-inch dish and chill 2 to 3 hours until firm before cutting and serving."],"macro":null,"tagline":"Pineapple, Cheddar & Cream Mold","score":null,"sc":null,"diff":"Medium","time":"3 hrs 30 mins","extras":"Crushed pineapple, Lemon juice, Chopped celery, Chopped nuts, Heavy whipping cream"},
  {"id":583,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Homemade Cocoa Paste","servings":"16 Servings (1 Cup)","servN":16,"ing":["½ cup cocoa powder","1 cup water","½ cup sugar","¼ tsp salt","¼ tsp vanilla"],"steps":["Stir the cocoa powder, sugar, water, and salt together in the top of a double boiler over direct medium heat, bring to a boil, and boil 10 minutes while stirring constantly.","Set the pan over gently simmering water in the bottom of the double boiler, stir in the vanilla, and cook 40 minutes, stirring occasionally, until smooth and thick.","Spoon into a clean jar, cool, and store covered in the refrigerator."],"vary":["Stir 1 to 2 tablespoons of cocoa paste into a glass of cold or hot milk for rich chocolate milk or hot cocoa."],"macro":null,"tagline":"Make-Ahead Double-Boiler Chocolate Milk Base","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":null},
  {"id":584,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Applade","servings":"16 Servings","servN":16,"ing":["6 cups apple juice","6 cups grapefruit juice","4 cups ginger ale","1 apple","12 mint leaves"],"steps":["Stir chilled apple juice, grapefruit juice, and ginger ale gently together in a punch bowl or large pitcher.","Chill well or pour over ice, and float thin unpeeled red apple slices and fresh mint leaves in each glass."],"vary":["Substitute lemon-lime soda for the ginger ale for a brighter citrus punch."],"macro":null,"tagline":"Sparkling Apple-Grapefruit Mint Punch","score":null,"sc":null,"diff":"Easy","time":"10 mins","extras":"Apple Juice, Grapefruit Juice, Ginger Ale, Mint Leaves"},
  {"id":585,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Coconut Cake","servings":"24 Slices","servN":24,"ing":["4 eggs","2 cups sugar","1 cup oil","2 tsp coconut extract","3 cups flour","2½ tsp baking powder","½ tsp baking soda","1 cup buttermilk","1 cup chopped walnuts","1 tsp vanilla","1 cup sugar","½ cup water","2 tbsp butter","1 tsp coconut extract"],"steps":["Preheat the oven to 325°F and grease and flour three standard loaf pans.","In a large bowl, beat the eggs, 2 cups sugar, oil, 2 tsp coconut extract, and vanilla together until smooth.","Whisk together the flour, baking powder, and baking soda, then add to the batter alternately with the buttermilk, mixing just until smooth. Fold in the chopped walnuts.","Divide the batter evenly among the three loaf pans and bake at 325°F for 1 hour until a toothpick inserted in the center comes out clean.","Shortly before the loaves finish baking, combine the remaining 1 cup sugar, water, and butter in a small saucepan and boil for 5 minutes. Remove from the heat, stir in the remaining 1 tsp coconut extract, spoon evenly over the hot loaves, and let rest 4 hours to soak before slicing."],"macro":null,"tagline":"Three-Loaf Glazed Coconut Pound Cake","score":null,"sc":null,"diff":"Medium","time":"5 hrs 15 mins","extras":"Coconut Extract, Walnuts"},
  {"id":586,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Rice Pudding","servings":"6 Servings","servN":6,"ing":["½ cup uncooked white rice","4 cups milk","½ tsp salt","½ cup sugar","1 tsp lemon peel","½ tsp ground nutmeg","½ cup raisins"],"steps":["Preheat the oven to 300°F and grease a 1½-quart baking dish.","Rinse the white rice well and stir it into the dish with the milk, salt, and sugar.","Bake uncovered at 300°F for 1 hour, stirring several times during the hour so the rice cooks evenly.","Stir in the lemon peel, ground nutmeg, and raisins, and continue baking 2 to 2½ hours more until thick, creamy, and lightly browned on top."],"vary":["Substitute ⅔ cup packed brown sugar for the granulated sugar for a deeper caramel flavor, as noted on the card."],"macro":null,"tagline":"Slow-Baked Old-Fashioned Custard Rice","score":null,"sc":null,"diff":"Easy","time":"3 hrs 35 mins","extras":"Lemon"},
  {"id":587,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Danish Fudge","servings":"49 Pieces (About 2 lb)","servN":49,"ing":["10 tbsp butter","2 cups brown sugar","½ cup evaporated milk","3 cups powdered sugar","1 cup chopped walnuts","1 tsp vanilla"],"steps":["Line an 8×8-inch square pan with plastic wrap (or butter it generously). Melt the butter in a medium saucepan over medium-low heat.","Stir in the brown sugar and evaporated milk, bring to a gentle boil over low heat, and boil for 3 minutes, stirring constantly.","Remove from heat, beat in the sifted powdered sugar until smooth and creamy, then stir in the chopped walnuts and vanilla. Spread evenly into the prepared pan, cool completely, and cut into 1-inch squares."],"macro":null,"tagline":"Three-Minute Boiled Brown Sugar Fudge","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Walnuts"},
  {"id":588,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Bread Dressing","servings":"8 Servings","servN":8,"ing":["1 pkg (20 oz) bread","½ cup butter","1 medium onion","1 cup chopped celery (about 2 stalks)","1 tsp salt","1 tsp ground sage","1½ cups broth","1 cup milk"],"steps":["Preheat oven to 350°F. Cut or tear the dry bread into ½-inch cubes and place in a very large mixing bowl.","Melt the butter in a large skillet over medium heat. Add the chopped onion and chopped celery and cook for 5 minutes until softened.","Stir the broth, milk, salt, and ground sage into the skillet and heat until steaming hot.","Pour the hot liquid and vegetables over the bread cubes and toss gently with a fork until evenly moistened.","Transfer to a 9×13-inch baking dish, cover with foil, and bake at 350°F for 25 minutes; uncover and bake 15 minutes longer until golden and lightly crisp on top."],"macro":null,"tagline":"Sage & Butter Holiday Stuffing","score":null,"sc":null,"diff":"Easy","time":"55 mins","extras":"Chopped celery"},
  {"id":589,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Evelyn Huntsman's Carrot Nut Cake","servings":"16 Servings","servN":16,"ing":["1½ cups oil","1½ cups sugar","½ cup brown sugar","2 cups flour","1 tsp baking soda","2 tsp baking powder","2 tsp cinnamon","1 tsp salt","4 eggs","3 cups grated carrots","1 cup chopped pecans","1 pkg (8 oz) cream cheese","½ cup butter","1 box (16 oz) powdered sugar","½ tsp rum flavoring","½ tsp vanilla"],"steps":["Preheat oven to 325°F and lightly oil a 10-inch tube pan (or 9×13-inch pan).","Mix the oil, white sugar, and brown sugar together until smooth. Sift the flour, baking soda, baking powder, cinnamon, and salt together; stir half into the oil-sugar mixture.","Beat in the remaining dry ingredients alternately with the eggs, one at a time, mixing well after each addition. Fold in the finely grated carrots and chopped pecans.","Pour into the prepared pan and bake at 325°F for 55 to 65 minutes until a toothpick inserted in the center comes out clean. Cool completely in the pan.","For the frosting, beat the softened cream cheese and butter together until smooth, then blend in the powdered sugar, rum flavoring, and vanilla and spread over the cooled cake."],"vary":["Swap chopped walnuts for the pecans, or skip the frosting and serve plain with whipped cream or warm pudding sauce."],"macro":null,"tagline":"Evelyn Huntsman’s Rum-Iced Carrot Cake","score":null,"sc":null,"diff":"Medium","time":"1 hr 30 mins","extras":"Pecans, Cream cheese, Rum flavoring"},
  {"id":590,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Spoon Burgers","servings":"16 Servings","servN":16,"ing":["5 lbs ground beef","5 onions","3½ cups ketchup","⅓ cup mustard","1 tsp salt","½ tsp black pepper","2 bell peppers","2 cups diced celery","½ cup brown sugar","⅓ cup Worcestershire sauce","2 cans (10.5 oz) chicken gumbo soup"],"steps":["Cook ground beef, chopped onions, diced bell peppers, and diced celery in a large Dutch oven over medium-high heat for 10 to 12 minutes, crumbling the beef, until no pink remains (160°F); drain excess fat.","Stir in ketchup, mustard, brown sugar, Worcestershire sauce, chicken gumbo soup, salt, and black pepper.","Bring to a simmer, reduce heat to low, and cook uncovered 20 to 25 minutes, stirring occasionally, until thick and savory."],"vary":["Spoon hot onto toasted hamburger buns for classic church-supper sloppy joes."],"macro":null,"tagline":"Crowd-Size Potluck Sloppy Joes","score":null,"sc":null,"diff":"Easy","time":"40 mins","extras":"Celery, Worcestershire Sauce, Chicken Gumbo Soup"},
  {"id":591,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Stuffed Peppers","servings":"6 Servings","servN":6,"ing":["6 bell peppers","1 cup rice","½ cup breadcrumbs","2 lb ground beef","½ tsp sage","2 eggs","1 small onion","½ cup ketchup","1 tsp salt","½ tsp black pepper","½ tsp garlic salt","1 can (14.4 oz) tomato soup"],"steps":["Preheat the oven to 325°F. Slice the tops off the bell peppers and scoop out the seeds and membranes; stand them upright in a 9×13-inch baking dish.","Grate the small onion and combine in a large bowl with the uncooked rice, breadcrumbs, ground beef, sage, eggs, ketchup, salt, black pepper, and garlic salt until evenly mixed.","Pack the meat mixture loosely into the hollowed bell peppers and spoon the tomato soup evenly over the tops.","Cover the dish tightly with foil and bake at 325°F for 1 hour 45 minutes to 2 hours, until the peppers are tender and the beef filling reaches 160°F at the center."],"vary":["Cool baked peppers, wrap individually, and freeze in zip-top bags for quick single-serving reheating."],"macro":null,"tagline":"Slow-Baked Beef & Rice Peppers","score":null,"sc":null,"diff":"Easy","time":"2 hrs 15 mins","extras":"Sage, Garlic Salt"},
  {"id":592,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Sugar Cookies","servings":"36 Cookies","servN":36,"ing":["3 cups Quick Mix","1 cup sugar (for dough)","1 egg","4 tbsp milk","1 tsp vanilla","2 tbsp sugar (for sprinkling)"],"steps":["In a mixing bowl, stir together the Quick Mix and 1 cup sugar.","Whisk the egg, milk, and vanilla together until well beaten, then stir into the dry mixture until thoroughly blended.","Cover and chill the dough in the refrigerator for 2 to 3 hours (or overnight) until firm enough to roll.","Preheat the oven to 375°F. Roll the chilled dough ⅛ inch thick between sheets of waxed paper (or on a board dusted lightly with a pinch of Quick Mix) and cut into desired shapes.","Transfer to an ungreased baking sheet, sprinkle with the remaining 2 tablespoons sugar, and bake at 375°F for 10 to 12 minutes until lightly browned at the edges."],"macro":null,"tagline":"Chilled Quick Mix Cutout Cookies","score":null,"sc":null,"diff":"Medium","time":"2 hrs 30 mins","extras":null},
  {"id":593,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Triple Fudge Cake","servings":"18 Servings (9×13 Cake)","servN":18,"ing":["1 pkg (4 oz) pudding mix","2 cups milk","1 box (15.25 oz) chocolate cake mix","½ cup chocolate chips","½ cup chopped walnuts"],"steps":["Preheat the oven to 350°F and grease and flour a 9×13-inch baking pan.","In a large saucepan, whisk the chocolate pudding mix and milk together and cook over medium heat, stirring constantly, for 4 to 5 minutes until thickened and bubbling as directed on the package.","Remove from heat and blend the dry chocolate cake mix straight into the hot pudding (no eggs or oil needed); beat by hand or with a mixer for 1 to 2 minutes until smooth.","Spread into the prepared pan and sprinkle evenly with the chocolate chips and chopped walnuts. Bake at 350°F for 30 to 35 minutes, until the top springs back lightly."],"vary":["Serve warm or at room temperature with whipped cream if desired, as Teresa Bradley's card notes."],"macro":null,"tagline":"Teresa Bradley's Pudding-Batter Sheet Cake","score":null,"sc":null,"diff":"Easy","time":"45 mins","extras":"Walnuts"},
  {"id":594,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Filled Cookies","servings":"24 Filled Cookies","servN":24,"ing":["1½ cups sugar","½ cup shortening","1 egg","½ cup milk","3½ cups flour","1 tbsp flour","3 tsp baking powder","1 tsp vanilla","1 cup raisins","½ cup water"],"steps":["For the raisin filling, combine the raisins, ½ cup of the sugar, water, and 1 tablespoon flour in a small saucepan. Cook over medium-low heat for 5 to 7 minutes, stirring constantly, until thick and jammy; set aside to cool completely.","Cream the shortening and remaining 1 cup sugar together in a mixing bowl until light. Beat in the egg and vanilla, then stir in the milk.","Whisk the 3½ cups flour and baking powder together and stir into the wet ingredients until a smooth, rollable dough forms (chill 30 minutes if sticky).","Preheat oven to 375°F and line baking sheets with parchment paper. Roll the dough out thinly on a lightly floured surface (about ⅛ inch thick) and cut into 48 rounds with a 2½-inch cutter.","Arrange half of the rounds on the prepared sheets, spoon about 1 teaspoon of cooled raisin filling onto the center of each, top with the remaining rounds, and press the edges gently with a fork to seal.","Bake at 375°F for 10 to 12 minutes until lightly golden at the edges. Cool on wire racks."],"macro":null,"tagline":"Classic Raisin-Filled Sugar Cookies","score":null,"sc":null,"diff":"Medium","time":"55 mins","extras":null},
  {"id":595,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Date Nut Cake","servings":"12 Servings","servN":12,"ing":["3 cups chopped dates","2 cups boiling water","1 tsp baking soda","½ cup butter","1 cup sugar","½ cup brown sugar","2 eggs","2½ cups flour","2 tsp baking powder","½ tsp salt","½ tsp allspice","1½ cups chopped walnuts","½ cup chocolate chips"],"steps":["Combine the chopped dates, boiling water, and baking soda in a heatproof bowl and let stand until completely cooled.","Preheat oven to 325°F and grease and flour a 9×13-inch baking dish.","Cream the butter, white sugar, and brown sugar together until smooth, then beat in the eggs thoroughly.","Whisk the flour, baking powder, salt, and allspice together, and add to the creamed mixture alternately with the cooled date mixture until just blended. Fold in 1 cup of the chopped walnuts.","Pour the batter into the prepared pan and sprinkle the chocolate chips and remaining ½ cup walnuts evenly over the top before putting it in the oven.","Bake at 325°F for 45 minutes until a toothpick inserted in the center comes out clean. Cool completely in the baking dish."],"macro":null,"tagline":"Castle Dale, 1956 Postcard Cake","score":null,"sc":null,"diff":"Medium","time":"1 hr 15 mins","extras":"Dates, Walnuts"},
  {"id":596,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Mustard Pickles","servings":"24 Servings (6 Quarts)","servN":24,"ing":["12 cups vinegar","16 cups water","1 lb brown sugar","5⅓ cups sugar","7 tbsp flour","1 tsp turmeric","2 oz mustard powder","2 tbsp pickling spice","2 tsp cinnamon","⅛ tsp cayenne","14 lbs cucumbers","4 cups onions","1 cauliflower","2 bell peppers","1 cup salt, for the soak"],"steps":["Dissolve salt in 8 cups of the water; pour over cubed cucumbers, pickling onions, cauliflower florets, and diced bell peppers, adding extra cold water if needed to cover. Let stand overnight, then drain well.","Place drained vegetables in a large kettle with 4 cups of the vinegar and 4 cups of the water; simmer 10 to 15 minutes until vegetables are tender and translucent, then drain.","Meanwhile, combine remaining 8 cups vinegar, remaining 4 cups water, brown sugar, and white sugar in a large preserving pot and bring to a boil.","Whisk flour, turmeric, and mustard powder with a splash of the warm vinegar mixture until smooth, then whisk back into the boiling pot and cook 5 minutes until thickened and smooth.","Stir in pickling spice, cinnamon, cayenne, and the drained vegetables; bring back to a simmer, pack the mustard pickles into hot sterilized jars, and process in a boiling-water bath 10 minutes to seal."],"vary":["Tie whole cinnamon sticks (½ small box) and pickling spice in cheesecloth and remove before jarring if you prefer a clear golden sauce."],"macro":null,"tagline":"Chaw Dressing — Heirloom Chow-Chow","score":null,"sc":null,"diff":"In-Depth","time":"12 hrs 45 mins","extras":"Vinegar, Mustard Powder, Cauliflower"},
  {"id":597,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Lemony Tomato Juice","servings":"1 Serving","servN":1,"ing":["1 cup tomato juice","1 tsp lemon juice","⅛ tsp onion powder","⅛ tsp salt"],"steps":["Pour the tomato juice, lemon juice, onion powder, and salt into a small saucepan.","Warm over medium heat for 3 to 4 minutes, stirring, until steaming hot, then pour into a tall mug or glass to serve."],"macro":null,"tagline":"Quick Warm Spiced Tomato Cup","score":null,"sc":null,"diff":"Easy","time":"5 mins","extras":"Tomato Juice, Lemon, Onion Powder"},
  {"id":598,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Danish Dumplings","servings":"8 Servings","servN":8,"ing":["1½ cups broth","1½ cups milk","1 slice bread","½ tsp ground ginger","¼ tsp ground nutmeg","1 tbsp sugar","1 tsp salt","2 cups all-purpose flour","5 eggs"],"steps":["Tear the bread into small pieces and combine in a heavy skillet or saucepan with the broth and milk. Cook over medium heat, stirring until the bread softens and blends into a smooth base, 3 to 4 minutes.","Stir in the ground ginger, ground nutmeg, sugar, salt, and all-purpose flour, cooking and stirring vigorously over medium-low heat until the mixture pulls away from the pan in a smooth dough ball, 2 to 3 minutes.","Remove from the heat and let cool 2 minutes, then beat in the eggs two at a time (one last), beating thoroughly after each addition until smooth and glossy.","Drop by teaspoons into a wide pot of gently simmering water and cook 8 to 10 minutes until puffed and cooked through."],"vary":["Drop directly into simmering chicken, vegetable, or beef soup in place of plain salted water."],"macro":null,"tagline":"Tender Poached Soup Dumplings","score":null,"sc":null,"diff":"Medium","time":"25 mins","extras":null},
  {"id":599,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Caramel Sauce","servings":"12 Servings (About 3 Cups)","servN":12,"ing":["2 cups brown sugar","2 tbsp flour","2 cups water","2 tbsp butter","1 cup half and half"],"steps":["In a medium saucepan, whisk the brown sugar and flour together until free of lumps. Stir in the water and butter.","Bring to a boil over medium heat and simmer, stirring frequently, for 15 minutes until thickened and glossy.","Remove from heat and let cool slightly for 3 to 5 minutes, then stir in the half-and-half until smooth."],"vary":["Pour warm over plain white cake or spice cake and finish with a dollop of whipped cream."],"macro":null,"tagline":"Old-Fashioned Boiled Brown Sugar Glaze","score":null,"sc":null,"diff":"Easy","time":"25 mins","extras":"Half-and-Half"},
  {"id":600,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Pumpkin Pie","servings":"24 Slices (3 Nine-Inch Pies)","servN":24,"ing":["3 cups flour","1 cup shortening","2 tsp salt","1 can (29 oz) canned pumpkin","2 cups sugar","3 tbsp pumpkin pie spice","4 eggs","1 can (12 oz) evaporated milk","1½ cups milk"],"steps":["Whisk the flour and 1 teaspoon of the salt together in a bowl, cut in the shortening with a pastry blender until crumbly, and sprinkle in 6 to 8 tablespoons cold water until the dough holds together. Divide into thirds, roll into 12-inch rounds, and fit into three 9-inch pie pans with crimped edges.","Preheat oven to 375°F. Beat the eggs lightly in a large mixing bowl, then whisk in the canned pumpkin, sugar, pumpkin pie spice, and remaining 1 teaspoon salt until smooth.","Blend in the evaporated milk and regular milk until uniform.","Pour into the three unbaked pie shells and bake at 375°F for 55 to 60 minutes, until a knife inserted near the center comes out clean and the centers have only a slight wobble. Cool completely before slicing."],"macro":null,"tagline":"Sego Evaporated Milk Pumpkin Pie","score":null,"sc":null,"diff":"Medium","time":"1 hr 25 mins","extras":"Canned pumpkin"},
  {"id":601,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ham Shanks and Lima Beans","servings":"8 Servings","servN":8,"ing":["1 lb dried lima beans","3 lb ham shanks","6 cups water","¼ tsp black pepper (or 6 to 8 peppercorns)","½ bay leaf"],"steps":["Place the dried lima beans in a large pot, cover generously with cold water, and soak overnight; drain and rinse.","Return the soaked beans to the pot with the 6 cups cold water, black pepper, bay leaf, and ham shanks.","Bring to a boil over high heat, then reduce heat to low, cover, and simmer gently 1½ to 2 hours until the beans are tender and the meat drops easily from the bones. Discard the bay leaf and bones, shred the ham back into the beans, and serve hot."],"macro":null,"tagline":"Slow-Simmered Homestead Ham & Limas","score":null,"sc":null,"diff":"Easy","time":"10 hrs","extras":"Dried lima beans"},
  {"id":602,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ham Shanks, Sauerkraut & Potatoes","servings":"6 Servings","servN":6,"ing":["3 lbs ham","3 cups water","1 tsp salt","¼ tsp black pepper","1 can (27 oz) sauerkraut","2 onions","6 medium potatoes"],"steps":["Place ham shanks, water, salt, and black pepper in a Dutch oven; bring to a boil, reduce heat to low, cover, and simmer 1 hour 30 minutes until meat is tender.","Add undrained sauerkraut, chopped onions, and halved potatoes; cover and simmer 25 to 30 minutes until potatoes are fork-tender."],"vary":["Rinse the sauerkraut briefly before adding if you prefer a milder tang and lower sodium."],"macro":null,"tagline":"Slow-Simmered One-Pot Supper","score":null,"sc":null,"diff":"Easy","time":"2 hrs 10 mins","extras":"Sauerkraut"},
  {"id":603,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Lentils and Ham Shank Casserole","servings":"8 Servings","servN":8,"ing":["3 cups dried lima beans (lentils)","2 lb diced ham","1 onion","2 bay leaves","4 cups water","2 slices bacon","12 small onions","½ tsp dried thyme","½ tsp dried marjoram","2 tsp salt","½ tsp black pepper","6 carrots","1 cup red wine","½ cup breadcrumbs","1 tbsp butter"],"steps":["Chop the single onion. In a large pot, combine the dried lima beans (or lentils), ham, chopped onion, bay leaves, and water. Bring to a boil over medium-high heat, then reduce heat, cover, and simmer for 30 minutes. Drain the beans and ham, discarding the bay leaves and softened onion.","Meanwhile, preheat the oven to 350°F. Cook the bacon in a skillet over medium heat for 5 to 6 minutes until crisp; drain and crumble. Peel the 12 small onions and sauté them in the bacon drippings for 6 to 8 minutes until lightly browned. Slice the carrots and mix the thyme, marjoram, salt, and black pepper together in a small bowl.","Layer half the drained beans into a greased 3-quart casserole dish and sprinkle with half the herb mixture. Add the diced ham, browned small onions, sliced carrots, and crumbled bacon, then top with the remaining beans and herb mixture.","Pour the red wine over the casserole, cover tightly, and bake at 350°F for 1 hour 30 minutes. Melt the butter, toss with the breadcrumbs, sprinkle over the top, and bake uncovered 15 minutes longer until golden and crisp."],"macro":null,"tagline":"Slow-Baked Burgundy Lentil Pot","score":null,"sc":null,"diff":"In-Depth","time":"2 hrs 30 mins","extras":"Dried Lima Beans, Bay Leaves, Bacon, Dried Thyme, Dried Marjoram, Red Wine"},
  {"id":604,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ham Shanks with Apples and Dumplings","servings":"6 Servings","servN":6,"ing":["3 lbs smoked ham shanks","3 cups sliced apples","3 tbsp brown sugar","1½ cups all-purpose flour","2 tsp baking powder","½ tsp salt","2 tbsp butter","¾ cup milk"],"steps":["Place the smoked ham shanks in a large Dutch oven or stockpot, cover with cold water, and bring to a boil over high heat. Reduce heat to low, cover, and simmer for 1½ hours until the meat is tender.","Stir in the sliced apples and brown sugar and simmer 15 minutes more until the apples are tender. Transfer the ham shanks and apples to a serving platter and keep warm.","For the dumplings, whisk the all-purpose flour, baking powder, and salt in a bowl, cut in the butter until crumbly, and stir in the milk just until a soft batter forms.","Drop the batter by spoonfuls onto the gently simmering ham broth, cover tightly, and steam without lifting the lid for 15 minutes until puffed and cooked through. Serve the dumplings and broth alongside the ham and apples."],"macro":null,"tagline":"Sweet-Savory Simmered Ham Pot","score":null,"sc":null,"diff":"Medium","time":"2 hrs 10 mins","extras":null},
  {"id":605,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Ham Shanks and Red Beans","servings":"8 Servings","servN":8,"ing":["1 lb pinto beans","7 cups water (divided)","3 tbsp salt","1 bay leaf","1¼ cups chopped onion (divided)","1½ lb ham","1 tbsp butter","½ tsp black pepper","2 cloves garlic","2 beef bouillon cubes","2 tbsp soy sauce"],"steps":["If starting with dry beans, soak overnight and drain. In a Dutch oven, combine the beans, 6 cups of the water, salt, bay leaf, 1 cup of the chopped onion, and the ham; simmer gently for 1½ hours until the beans and ham are tender, then drain off most of the excess liquid and discard the bay leaf.","Preheat the oven to 350°F. Lift out the ham, cut into bite-sized cubes, and brown in melted butter in a skillet over medium heat for 4 minutes with the black pepper and minced garlic.","Dissolve the beef bouillon cubes in the remaining 1 cup hot water and pour into the skillet with the soy sauce, stirring to scrape up the browned bits.","Transfer the beans to a 2-quart casserole dish, stir in the ham mixture and the remaining ¼ cup onion, and bake uncovered at 350°F for 40 minutes until the top is browned and bubbly."],"vary":["Use dried red kidney beans if available, and reduce salt to 1 tbsp if using cured ham shanks for a lighter sodium profile."],"macro":null,"tagline":"Slow-Simmered Baked Beans & Ham","score":null,"sc":null,"diff":"In-Depth","time":"2 hrs 30 mins","extras":null},
  {"id":606,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"New England Boiled Dinner","servings":"8 Servings","servN":8,"ing":["3 lb ham","4 cups water","6 medium potatoes","6 onions","1 medium rutabaga","6 carrots","1 head cabbage","⅛ tsp black pepper"],"steps":["Place the ham shanks in a large stockpot or Dutch oven with the water and black pepper. Bring to a boil over high heat, then reduce heat to low, cover, and simmer gently for 1½ hours until the meat is tender.","Halve the potatoes, onions, and carrots; peel and slice the rutabaga; and cut the cabbage into quarters through the core so the wedges stay intact.","Add the potatoes, onions, rutabaga, carrots, and cabbage to the pot. Cover and simmer gently for 25 to 35 minutes until all the vegetables are fork-tender. Slice the ham and serve hot in shallow bowls with the vegetables and broth."],"macro":null,"tagline":"Simmered Ham Shanks & Root Vegetables","score":null,"sc":null,"diff":"Medium","time":"2 hrs 15 mins","extras":"Rutabaga, Cabbage"},
  {"id":607,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Lemon-Lime Jello Salad","servings":"16 Servings","servN":16,"ing":["2 pkgs (3 oz) lemon gelatin","2 pkgs (3 oz) lime gelatin","4 cups boiling water","1 can (20 oz) crushed pineapple (drained)","½ cup mayo","1 can (12 oz) evaporated milk","2 cups cottage cheese","1 cup chopped celery","½ cup chopped walnuts"],"steps":["Dissolve the lemon gelatin and lime gelatin in the 4 cups boiling water in a large bowl, stirring until clear. Chill 45 to 60 minutes until cool and slightly syrupy.","In a separate bowl, beat together the mayo, evaporated milk, and cottage cheese until well blended.","Stir the dairy mixture into the thickened gelatin along with the drained crushed pineapple, chopped celery, and chopped walnuts. Pour into a 9×13-inch dish and chill 3 to 4 hours until firm."],"macro":null,"tagline":"Creamy Pineapple-Nut Citrus Gelatin Salad","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Crushed pineapple, Celery, Walnuts"},
  {"id":608,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Caramel Spice Pudding Cake","servings":"12 Servings","servN":12,"ing":["2 cups brown sugar","3½ cups water","½ cup butter","1 tsp vanilla","1 cup sugar","2 tbsp butter","1 cup milk","2 cups flour","1 tsp baking soda","½ tsp ground nutmeg","¼ tsp salt","1 tsp cinnamon","1 cup raisins","½ cup chopped walnuts"],"steps":["Preheat oven to 375°F. For the caramel sauce, combine brown sugar, water, ½ cup butter, and vanilla in a saucepan, bring to a boil for 2 minutes, and remove from heat.","For the batter, cream 2 tbsp butter with granulated sugar, stir in milk, then mix in flour, baking soda, ground nutmeg, salt, cinnamon, raisins, and chopped walnuts.","Spread batter into a large ungreased 9x13-inch baking pan. Slowly pour or spoon hot caramel sauce evenly over the batter without stirring.","Bake at 375°F for 30 to 35 minutes until the cake springs back lightly when touched and caramel bubbles beneath."],"vary":["Use black walnut flavoring instead of vanilla in the caramel sauce as noted on the original card."],"macro":null,"tagline":"Self-Saucing Raisin & Spice Cobbler Cake","score":null,"sc":null,"diff":"Easy","time":"50 mins","extras":"Walnuts"},
  {"id":609,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Get-Well Custard","servings":"8 Servings","servN":8,"ing":["5 eggs","½ cup sugar","¼ tsp salt","1 tsp vanilla","4 cups milk","¼ tsp ground nutmeg"],"steps":["Preheat the oven to 350°F and set a kettle of water on to boil.","Lightly beat the eggs in a mixing bowl, then whisk in the sugar, salt, and vanilla.","Warm the milk in a saucepan over medium heat for 4 to 5 minutes until steaming (not boiling), then slowly pour the warm milk into the egg mixture while whisking constantly to temper.","Strain into a 1½-quart round baking dish, sprinkle evenly with ground nutmeg, and set the dish inside a larger roasting pan filled with 1 inch of hot water.","Bake at 350°F for 55 to 60 minutes until a knife inserted near the center comes out clean (the center will still jiggle softly). Cool to room temperature, then chill at least 2 hours before serving."],"macro":null,"tagline":"Gentle Water-Bath Baked Custard","score":null,"sc":null,"diff":"Medium","time":"3 hrs 15 mins","extras":"Ground Nutmeg"},
  {"id":610,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Cabbage Salad","servings":"4 Servings","servN":4,"ing":["3 cups shredded cabbage","½ cup chopped fresh parsley","2 tbsp chopped onion","3 tbsp sugar","3 tbsp vinegar","2 tbsp oil","1 tsp salt"],"steps":["Combine the shredded cabbage, chopped fresh parsley, and chopped onion in a medium bowl.","Whisk together the sugar, vinegar, oil, and salt until the sugar dissolves, pour over the cabbage mixture, and toss well to coat. Chill at least 30 minutes before serving."],"macro":null,"tagline":"Angiline Hayward’s Crisp Slaw","score":null,"sc":null,"diff":"Easy","time":"35 mins","extras":"Cabbage, Fresh Parsley"},
  {"id":611,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Kathy Jones’s Cranberry Jello Salad","servings":"8 Servings","servN":8,"ing":["1 pkg (6 oz) cherry gelatin","4 cups water (divided)","2 cups fresh cranberries","1 cup sliced apple","½ cup chopped walnuts"],"steps":["Dissolve the cherry gelatin in 2 cups boiling water, stir in 2 cups cold water, and refrigerate about 1 hour until thickened to the consistency of unbeaten egg whites.","Finely mince the fresh cranberries in a food processor and fold them into the partially set gelatin along with the sliced apples and chopped walnuts.","Pour into a serving dish or mold and chill 3 to 4 hours until completely firm."],"vary":["Try grape or raspberry gelatin in place of cherry, as Kathy Jones's card suggests."],"macro":null,"tagline":"Kathy Jones's Molded Cranberry-Apple Salad","score":null,"sc":null,"diff":"Easy","time":"4 hrs 15 mins","extras":"Fresh Cranberries, Walnuts"},
  {"id":612,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Luncheon Salad","servings":"9 Servings","servN":9,"ing":["1 can (10.5 oz) tomato soup","1½ pkgs (0.25 oz) unflavored gelatin","½ cup cold water","2 pkgs (3 oz) cream cheese","1 cup mayo","1 cup chopped celery","2 tbsp bell pepper","1 tsp onion","½ cup chopped walnuts"],"steps":["Sprinkle the unflavored gelatin over the cold water in a small bowl and let stand 5 minutes to soften.","Heat the condensed tomato soup in a medium saucepan over medium-low heat until steaming hot, then remove from heat and stir in the softened gelatin until completely dissolved. Let cool slightly.","In a mixing bowl, beat the softened cream cheese until smooth, then blend in the mayo, chopped celery, chopped bell pepper, minced onion, and chopped walnuts.","Stir the cream cheese mixture into the cooled tomato gelatin until smooth. Pour into an 8×8-inch dish or 5-cup mold rinsed with cold water and chill 3 to 4 hours until firm before serving."],"vary":["Card note: substitute ¾ cup mashed cottage cheese for the cream cheese."],"macro":null,"tagline":"Julie Huntington’s Tomato Aspic Mold","score":null,"sc":null,"diff":"Medium","time":"3 hrs 20 mins","extras":"Cream cheese, Chopped celery, Chopped walnuts"},
  {"id":613,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Leah Jacob's Raspberry Jello Salad","servings":"10 Servings","servN":10,"ing":["2 pkgs (3 oz) raspberry gelatin","2 cups boiling water","2 cups cold water","1 pkg (10 oz) frozen raspberries","½ cup chopped walnuts"],"steps":["Dissolve the raspberry gelatin in the 2 cups boiling water in a medium bowl, stirring until completely clear, then stir in the 2 cups cold water.","Stir in the frozen raspberries to cool and thicken the gelatin. Pour into a 9×9-inch dish and chill 3 to 4 hours until firmly set.","Sprinkle the chopped walnuts over the top just before serving."],"macro":null,"tagline":"Leah Jacob’s Ruby Berry Walnut Gelatin","score":null,"sc":null,"diff":"Easy","time":"3 hrs 15 mins","extras":"Raspberries, Walnuts"},
  {"id":614,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Lemon Jell-O Salad","servings":"12 Servings","servN":12,"ing":["2 pkgs (3 oz) lemon gelatin","1½ cups boiling water","1½ cups water","2 cups crushed pineapple","1½ cups sugar","4 cups whipped topping","2 cups cheddar cheese","½ cup chopped walnuts"],"steps":["Dissolve lemon gelatin in boiling water, stir in 1½ cups cold water, and chill 45 minutes until syrupy and cool.","Meanwhile, combine crushed pineapple and sugar in a saucepan, boil gently for 10 minutes, then cool completely.","Stir cooled pineapple syrup into the chilled gelatin.","Fold in prepared whipped topping and shredded cheddar cheese until evenly combined, pour into a 9x13-inch dish, top with chopped walnuts, and refrigerate 3 hours until set."],"vary":["Prepare 2 envelopes of Dream Whip whipped topping mix with milk per package directions to make the 4 cups whipped topping."],"macro":null,"tagline":"Vicki Kofford’s Card","score":null,"sc":null,"diff":"Easy","time":"4 hrs 25 mins","extras":"Crushed Pineapple, Whipped Topping, Walnuts"},
  {"id":615,"book":2,"secNum":10,"secName":"Grandma Wilberg's Kitchen","name":"Jelled Vegetable Salad","servings":"6 Servings","servN":6,"ing":["1 pkg (3 oz) lemon gelatin","½ cup boiling water","1 can (5 oz) tuna","1 can (10.5 oz) chicken gumbo soup","½ bell pepper","1 tbsp chopped onion","2 tbsp chopped celery","2 tbsp diced cucumber","½ cup heavy whipping cream","½ cup mayo"],"steps":["Dissolve the lemon gelatin in the boiling water in a mixing bowl, stirring 2 minutes until completely clear; let cool for 10 minutes.","Drain the tuna well and flake it, and finely chop the bell pepper, onion, celery, and cucumber. Whip the heavy whipping cream to soft peaks.","Stir the chicken gumbo soup, flaked tuna, chopped vegetables, mayo, and whipped cream into the cooled gelatin until evenly blended.","Pour into an 8-inch dish or mold and chill at least 4 hours until firmly set before slicing to serve."],"macro":null,"tagline":"Ann Jorgenson’s Card","score":null,"sc":null,"diff":"Easy","time":"4 hrs 20 mins","extras":"Chicken Gumbo Soup, Celery, Heavy Whipping Cream"},
];
