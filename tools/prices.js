/*
 * What a food typically costs, in US dollars per 100 g, at a Walmart in 2026.
 *
 * Plan My Week uses these to keep a week of dinners under a budget and to put
 * a rough total on its shopping list. They are estimates, written once from
 * ordinary shelf prices (a 5 lb bag of potatoes, a family pack of chicken,
 * store-brand cans) rather than looked up live: Blake chose to keep the app
 * self-contained. A household can correct any of them in the app, and the
 * correction wins.
 *
 * Dried spices are not here: they count as already in the cupboard (see
 * DRIED_SPICE in build-data.js). A food missing from this table is simply not
 * counted, and the total says "about".
 */
module.exports = {
  // meat
  chicken_breast: 0.66, ground_beef: 1.21, ground_beef_lean: 1.43, stewing_beef: 1.30, beef_roast: 1.15,
  pork_roast: 0.55, pork_sausage: 0.90, ham: 0.90, beef_frank: 0.70, flank_steak: 1.90,
  carne_asada: 2.40, sweet_pork: 0.80, chicken_canned: 1.05, tuna: 0.95,
  // dairy & eggs
  cheddar: 1.05, butter: 1.10, milk: 0.10, sour_cream: 0.45, cottage_cheese: 0.55, egg: 0.55,
  evaporated_milk: 0.35,
  // produce
  onion: 0.26, potato: 0.20, carrot: 0.33, bell_pepper: 0.65, broccoli: 0.40, tomato: 0.45,
  lettuce: 0.45, cucumber: 0.35, garlic: 1.00, lime: 0.37, cilantro: 1.50, avocado: 0.49,
  jalapeno: 0.45,
  // cans & jars
  green_beans: 0.25, corn: 0.25, black_beans: 0.22, pinto_beans: 0.22, white_beans: 0.25,
  tomato_sauce: 0.18, tomato_canned: 0.20, spaghetti_sauce: 0.29, cream_soup_chx: 0.40,
  cream_soup_mush: 0.40, salsa: 0.44, applesauce: 0.40, peaches_canned: 0.30, pickles: 0.45,
  pepperoncini: 0.80, enchilada_sauce: 0.35, pickle_juice: 0.10,
  // grains, bread & baking
  pasta: 0.26, rice_dry: 0.18, rice_cooked: 0.08, flour: 0.10, tortilla: 0.55, tortilla_small: 0.55,
  corn_tortilla: 0.40, bun: 0.35, breadcrumbs: 0.60, instant_potato: 1.10, mashed_potato: 0.25,
  pancake_mix: 0.35, baking_powder: 1.00, yeast: 3.00, sugar: 0.14, brown_sugar: 0.30,
  powdered_sugar: 0.35, honey: 1.00, vanilla: 8.00, cilantro_lime_rice: 0.15,
  // condiments, sauces, mixes
  oil: 0.30, salt: 0.10, mustard: 0.40, ketchup: 0.30, soy_sauce: 0.50, bbq_sauce: 0.35,
  hot_sauce: 0.60, ranch: 0.60, light_ranch: 0.60, tomatillo_ranch: 0.65, worcestershire: 0.90,
  taco_seasoning: 3.00, gravy_mix: 3.00, guacamole: 1.00, pico_de_gallo: 0.45,
  // from the 2026-09-30 Walmart scan: shelf price over pack weight
  apple: 0.20, banana: 0.17, orange: 0.33, grapes: 0.41, bread: 0.27, wheat_bread: 0.36, slider_bun: 1.46, biscuit_dough: 0.43, cereal_o: 0.57, oats: 0.35, oat_flour: 1.36, peanut_butter: 0.35, jam: 0.53, syrup: 0.34, raisins: 0.84, mayo: 0.33, light_mayo: 0.33, cream_cheese: 0.69, parmesan: 1.40, egg_white: 0.54, vanilla_yogurt: 0.29, dry_milk: 1.54, roast_beef_deli: 2.41, refried_beans: 0.22, pork_and_beans: 0.20, pears_canned: 0.42, tomato_soup: 0.50, soup_rts: 0.37, salsa_verde: 0.59, baking_soda: 0.21, cornstarch: 0.43, cream_of_tartar: 9.00, cake_mix: 0.30, pudding_mix: 1.11, gelatin_flavored: 1.15, gelatin_plain: 10.57, chocolate_chips: 1.14, cocoa: 2.64, cocoa_mix: 0.66, stevia: 2.35, sweetener: 1.67, spray_butter: 1.97, cola: 0.18, whey: 1.16, creatine: 4.99,
  // PR 2 additions
  almond_flour: 1.45, almond_milk: 0.22, whole_wheat_flour: 0.14, sweet_potato: 0.24, pumpkin_puree: 0.24, chia_seeds: 1.25, coconut_oil: 1.83, coconut_shredded: 0.9, maple_syrup: 1.65, cream_soda: 0.18, heavy_cream: 0.65, shortening: 0.44, condensed_milk: 0.45, graham_crackers: 0.72, chocolate_sandwich_cookies: 0.85, marshmallow_creme: 0.85, dark_chocolate: 1.45, bacon_bits: 2.4, pecans: 2.2, crawfish_whole: 0.9, crawfish_tails: 3.5, turkey_sausage: 1.05, quinoa_cooked: 0.35, green_onion: 0.75, half_and_half: 0.32, hoagie_roll: 0.55, swiss_cheese: 1.25, pork_ribs: 0.75, flaxseed: 0.95, flax_oil: 2.2, pumpkin_seeds: 1.5, sunflower_seeds: 0.85, dried_apricots: 1.45, dried_blueberries: 2.2, everything_bagel_seasoning: 2.8, lemon: 0.45, liquid_smoke: 1.5, olive_oil: 0.95, almonds: 1.45, almond_butter: 1.55, cashews: 1.75, macadamia: 3.2, peanuts: 0.65, salmon: 1.95, turkey_ground: 0.95, greek_yogurt: 0.36, plain_yogurt: 0.45, spinach: 0.9, mushrooms: 0.88, asparagus: 0.75, celery: 0.35, strawberries: 0.96, blueberries: 0.71, bouillon: 2.5, onion_soup_mix: 2.8, vinegar: 0.2, broth: 0.25, marshmallows: 0.48, vanilla_wafers: 0.8, walnuts: 1.65, quick_mix: 0.25, chocolate_unsweetened: 2.1, butterscotch_chips: 0.95, cornmeal: 0.28, cream_of_wheat: 0.55, tapioca: 1.75, molasses: 0.95, corn_syrup: 0.55, danish_dessert: 2.1, whipped_topping: 0.65, cinnamon_candies: 0.9, maraschino_cherries: 0.85, velveeta: 0.95, ice_cream: 0.45, pineapple_canned: 0.32, mandarin_oranges: 0.48, fruit_cocktail: 0.35, dates: 1.25, prunes: 0.95, cranberries: 0.75, cranberry_sauce: 0.48, kumquats: 1.8, orange_juice: 0.25, orange_juice_conc: 0.7, apple_juice: 0.16, cranberry_juice: 0.22, grapefruit_juice: 0.24, tomato_juice: 0.22, peas: 0.35, lima_beans: 0.42, rutabaga: 0.35, bacon: 1.15, spam: 1.1, chicken_bone_in: 0.45, chicken_gumbo_soup: 0.52, minestrone_soup: 0.45, chili_canned: 0.55, popcorn: 0.45, popcorn_kernels: 0.35, corn_chips: 1.1, potato_chips: 1.15, pretzels: 0.55, crackers: 0.5, cornflakes: 0.65, english_muffin: 0.55, stuffing_mix: 0.85, tomato_paste: 0.58, french_dressing: 0.45, wine: 0.85, lemon_lime_soda: 0.18, root_beer: 0.18, clams: 1.15, shrimp: 2.4, cabbage: 0.18, cauliflower: 0.45, olives: 0.95, raspberries: 1.1, cherries: 0.95, grapefruit: 0.35, dill: 3.5, mint: 4, parsley: 2.5, alum: 4.5, coconut_extract: 5, maple_extract: 5, rum_extract: 5, butter_extract: 5, sauerkraut: 0.28, zucchini: 0.35, fruit_generic: 0.4, powdered_peanut_butter: 2.7,
};
