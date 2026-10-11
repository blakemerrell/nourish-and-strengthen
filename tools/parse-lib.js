/*
 * Turns an ingredient line into a food key and a weight in grams.
 *
 * Shared by build-data.js, which uses it to work out macros, and
 * check-recipes.js, which uses it to check kitchen ratios. One implementation
 * so the two can never disagree about what "1 can peaches" weighs.
 */

const { FOODS, ALIASES } = require('./food-db.js');

const FRAC = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

// unit word -> canonical unit used by the gram tables
const UNITS = {
  cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g',
  can: 'can', cans: 'can',
  pkg: 'pkg', pkgs: 'pkg', package: 'pkg', packages: 'pkg',
  packet: 'pkg', packets: 'pkg',
  box: 'box', boxes: 'box',
  jar: 'jar', jars: 'jar',
  bottle: 'jar', bottles: 'jar',
  slice: 'each', slices: 'each',
  scoop: 'scoop', scoops: 'scoop',
  serving: 'each', servings: 'each', piece: 'each', pieces: 'each',
  clove: 'each', cloves: 'each',
  head: 'each', heads: 'each',
  stick: 'each', sticks: 'each',
  link: 'each', links: 'each',
  spear: 'each', spears: 'each',
};

// containers whose stated "(N oz)" is a gross weight; canned protein and beans
// lose liquid when drained.
/* What is left after the tin is drained, as a fraction of what the label
   weighs. A stated size is a gross weight — syrup, brine and all — and only
   the fruit or the fish goes in the bowl. peaches_canned was missing, so
   "1 can (29 oz) peaches" weighed 822 g against the 500 g the table gives for
   a plain "1 can peaches": No. 203 was scored on two-thirds again as much
   fruit as it has, and the shopping list asked for a second tin. 0.61 puts a
   29 oz can back at 502 g. */
const DRAIN = { tuna: 0.85, chicken_canned: 0.85, black_beans: 0.6, pinto_beans: 0.6, white_beans: 0.6, corn: 0.65, green_beans: 0.65, carrot: 0.65, peaches_canned: 0.61 };

/* A tin of something the table only knows raw. "1 can chicken breast" is what
   is written on the tin and what four recipes say, and it resolved to
   chicken_breast — raw meat, with none of the salt a tin carries — because
   the alias matched the words and nothing checked that the food had a `can`
   weight at all. It then fell through to the `each` weight of a whole raw
   breast, 174 g, so the recipes lost about a gram of sodium per serving each
   and gained a protein figure that was never in the room.

   Only consulted when the unit really is a container and the food has no
   weight for it, which is the shape of the mistake and nothing else. */
const CANNED = { chicken_breast: 'chicken_canned' };

// vague quantities
const VAGUE = { dash: 0.02, pinch: 0.02, splash: 2, handful: 0.5 };

// preparation words that change what reaches the plate; see the end of parseLine
const PREP = { trimmed: 0.6 };

/* Count what sticks. Blake's rule, 2026-09-22.

   A dredge is a bowl of flour a piece of chicken is turned through; what it
   leaves in the bowl goes in the bin. Counted in full, No. 298's fried chicken
   carried three cups of flour and a tablespoon of salt it never ate — 1,163 of
   its 1,326 mg of sodium was the salt in the dredge. A soak is the same thing
   in a liquid: the buttermilk or the pickle juice is poured away.

   A third of a dredge, and whatever is mixed into the flour — salt, spices —
   goes with it at the same share. An eighth of a soak: what clings when the
   piece is lifted and dripped. Both are estimates, not measurements: a
   recipe sets out more coating than it needs so the last piece is covered
   too, and the bowl is never scraped clean onto the chicken. Rounder and
   closer to the plate than counting the whole bowl, which is certainly
   wrong in one direction.

   Written on the ingredient line, where the parser reads — ", for the dredge"
   or ", for the soak" — so the cook sees which bowl it goes in, and so the
   same words mean the same share in every recipe, including one written in
   the app. */
const EATEN = [
  { re: /,\s*for the dredge\b/i, part: 1 / 3 },
  { re: /,\s*for the soak\b/i, part: 0.125 },
  /* A marinade is a soak by another name: the steak is lifted out, dripped
     and patted dry, and the bag goes in the bin. */
  { re: /,\s*for the marinade\b/i, part: 0.125 },
  /* Rice blended into water and strained through a cloth: the starch that
     goes through the sieve is drunk, the grit in the cloth is thrown away.
     About half, as an estimate — horchata counted with the whole cup of rice
     read a third high on its calories. */
  { key: 'rice_dry', re: /,\s*blended and strained\b/i, part: 0.5 },
  /* Oil for deep frying is mostly left in the pan. Counting all of it makes a
     fried dish read like a stick of butter; food takes up roughly an eighth.
     These two used to shrink the grams instead, which counted the same and
     sent the shopping list out for half a cup of oil to fill a deep pan. */
  { key: 'oil', re: /for frying|to fry|for the pan/i, part: 0.12 },
  /* A pretzel's soda bath is boiled, dipped into for thirty seconds and poured
     down the sink. What stays is the alkaline film that browns the crust, not
     two thirds of a cup of bicarbonate: counted in full it read 5,673 mg of
     sodium a pretzel. */
  { key: 'baking_soda', re: /for the water|for boiling|for the bath/i, part: 0.02 },
];

const ALIAS_KEYS = Object.keys(ALIASES).sort((a, b) => b.length - a.length);

/* Returns the food key, and the alias that matched. The alias matters for the
   zero-calorie seasonings, which all share one food key and so have to be told
   apart on the shopping list by the words the recipe used. */
function lookupAlias(name) {
  const n = name.trim();
  if (ALIASES[n]) return { key: ALIASES[n], alias: n };
  for (const k of ALIAS_KEYS) {
    // whole-word containment so "ham" does not match "graham"
    const re = new RegExp('(^|[^a-z])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])');
    if (re.test(n)) return { key: ALIASES[k], alias: k };
  }
  return null;
}

function lookupFood(name) {
  const hit = lookupAlias(name);
  return hit ? hit.key : null;
}

/**
 * Parse one ingredient line into { key, grams } or null if it cannot be read.
 */
function parseLine(raw) {
  let s = raw.toLowerCase().trim();

  // "12–16 oz ..." — take the low end
  s = s.replace(/(\d+(?:\.\d+)?)\s*[–—-]\s*\d+(?:\.\d+)?/, '$1');

  // capture an explicit container size: "1 can (12.5 oz) chicken breast"
  let explicit = null;
  const sizeM = s.match(/\((\d+(?:\.\d+)?)\s*(oz|lb|lbs|g)\)/);
  if (sizeM) explicit = { n: parseFloat(sizeM[1]), u: UNITS[sizeM[2]] };

  // drop parentheticals ("(sliced)", "(cooked & chilled)")
  s = s.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

  // leading quantity: "1.5", "2", "¼", "1 ½", "5g", "1/2", "1 1/2"
  let qty = null;
  const mixedSlash = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)\s*/);
  if (mixedSlash) {
    qty = parseFloat(mixedSlash[1]) + parseFloat(mixedSlash[2]) / parseFloat(mixedSlash[3]);
    s = s.slice(mixedSlash[0].length);
  } else {
    const slash = s.match(/^(\d+)\s*\/\s*(\d+)\s*/);
    if (slash) {
      qty = parseFloat(slash[1]) / parseFloat(slash[2]);
      s = s.slice(slash[0].length);
    } else {
      let m = s.match(/^(\d+(?:\.\d+)?)\s*([½¼¾⅓⅔⅛⅜⅝⅞])?\s*/);
      if (m && m[0].trim()) {
        qty = parseFloat(m[1]) + (m[2] ? FRAC[m[2]] : 0);
        s = s.slice(m[0].length);
      } else {
        m = s.match(/^([½¼¾⅓⅔⅛⅜⅝⅞])\s*/);
        if (m) { qty = FRAC[m[1]]; s = s.slice(m[0].length); }
      }
    }
  }

  // vague leading word ("dash vanilla", "splash milk", "pinch salt")
  let vagueUnit = null;
  const vm = s.match(/^(dash|pinch|splash|handful)(?:es|s)?\s+(?:of\s+)?/);
  if (vm) { vagueUnit = vm[1]; s = s.slice(vm[0].length); }

  // unit word, possibly glued to the number ("5g creatine")
  let unit = null;
  const um = s.match(/^([a-z]+)\.?\s+/);
  if (um && UNITS[um[1]]) { unit = UNITS[um[1]]; s = s.slice(um[0].length); }
  if (!unit && qty !== null) {
    const gm = raw.toLowerCase().match(/^\d+(?:\.\d+)?\s*(g|oz|lb|lbs)\b/);
    if (gm) { unit = UNITS[gm[1]]; s = s.replace(/^\s*(g|oz|lb|lbs)\b\s*/, ''); }
  }

  // size modifier
  let sizeMult = 1;
  const mm = s.match(/^(large|small|medium|jumbo)\s+/);
  if (mm && !ALIASES[s]) {
    sizeMult = mm[1] === 'large' || mm[1] === 'jumbo' ? 1.5 : mm[1] === 'small' ? 0.7 : 1;
    if (!lookupFood(s)) s = s.slice(mm[0].length);
    else if (!ALIASES[s.trim()]) { /* keep, alias match may need it */ }
  }

  const foodName = s.replace(/\s+/g, ' ').trim();
  if (!foodName) return null;

  const hit = lookupAlias(foodName);
  if (!hit) return { unmatched: foodName, raw };
  let key = hit.key;
  /* A tin of something the table only knows raw — see CANNED above. */
  if ((unit === 'can' || unit === 'jar') && CANNED[key] &&
      !(FOODS[key].g && FOODS[key].g[unit])) {
    key = CANNED[key];
  }
  const food = FOODS[key];

  // ---- work out grams --------------------------------------------------
  let grams;
  let used = null;               // the unit this line was actually counted in
  if (vagueUnit) {
    const v = VAGUE[vagueUnit];
    grams = vagueUnit === 'splash' ? v * (food.g.tbsp || 15)
      : vagueUnit === 'handful' ? v * (food.g.cup || 100)
        : v * (food.g.tsp || 2);
  } else if (explicit && (unit === 'can' || unit === 'pkg' || unit === 'box' || unit === 'jar') &&
    explicit.u === 'oz' && food.sold && food.sold[unit] === explicit.n && food.g[unit]) {
    /* The size the storehouse sells, stated. That container is already in the
       table by what goes in the pot, so it counts the same as the line that
       leaves the size off. Worked out from the label instead, the same tin came
       to two different weights: "1 can (12.5 oz) chicken breast" read 301 g
       through DRAIN and "1 can chicken" read the table's 285. */
    used = unit;
    grams = (qty === null ? 1 : qty) * food.g[unit];
  } else if (explicit && (unit === 'can' || unit === 'pkg' || unit === 'box' || unit === 'jar')) {
    used = unit;
    const per = explicit.u === 'oz' ? 28.35 : explicit.u === 'lb' ? 453.6 : 1;
    grams = (qty === null ? 1 : qty) * explicit.n * per * (DRAIN[key] || 1);
  } else {
    if (qty === null) {
      if (!food.def) return { key, grams: 0, alias: hit.alias, unit: null, assumed: 'treated as a garnish' };
      qty = food.def.qty;
      unit = food.def.unit;
    }
    if (!unit) unit = 'each';
    let per;
    if (unit === 'g') per = 1;
    else if (unit === 'oz') per = 28.35;
    else if (unit === 'lb') per = 453.6;
    else per = food.g[unit];
    /* A spoon the table does not list is derived from the one it does: three
       teaspoons to a tablespoon, sixteen tablespoons to a cup. Honey is the
       one that showed this up — its table has cup and tbsp and no tsp, and
       "1 tsp honey" fell through to the blind substitute below, which offered
       `cup` first. A teaspoon of honey was being counted as a cup of it: 7 g
       read as 339 g, and a mug of warm milk came out at twelve hundred
       calories with nothing printed to say so.

       So the volume units convert, and `cup` is no longer a thing any unit may
       silently become. What is left in the blind list is containers, which is
       the case it was written for — "1 can" of something the table sizes by
       the each. Nothing in the book took this path either way. */
    if (per === undefined) {
      const cup = food.g.cup, tbsp = food.g.tbsp, tsp = food.g.tsp;
      if (unit === 'tsp') per = tbsp !== undefined ? tbsp / 3 : cup !== undefined ? cup / 48 : undefined;
      else if (unit === 'tbsp') per = cup !== undefined ? cup / 16 : tsp !== undefined ? tsp * 3 : undefined;
      else if (unit === 'cup') per = tbsp !== undefined ? tbsp * 16 : tsp !== undefined ? tsp * 48 : undefined;
    }
    if (per === undefined) {
      per = food.g.each || food.g.can || food.g.pkg || food.g.box || food.g.jar;
      if (per === undefined) return { unmatched: foodName + ' [unit ' + unit + ']', raw };
    }
    grams = qty * per * sizeMult;
    used = unit;
  }

  /* "trimmed" on the line: the fat cap and the seams come off before the meat
     is cooked, and the fat that is cut off is never eaten. Only the fat moves —
     the lean, and so the protein, is what was there all along, and the grams
     stay the purchase weight because that is what the shopping list is for.
     It is a fat multiplier and not a second food key on purpose: a shoulder is
     one item on the storehouse order whether or not you trim it, and a
     `pork_roast_trim` key would have split the pantry entry in two, so that
     ticking "Pork roast" lit up half the recipes that use it.

     Six-tenths of the fat stays. USDA's "lean only" figures for chuck and
     shoulder carry roughly forty percent of the fat of "lean and fat", and
     those are cut by a butcher with a boning knife and a scale; a home trim
     reaches the cap and the seams and none of the marbling, so it lands short
     of that. The word has to be on the ingredient line — a step that says
     "trim it" counts for nothing, because the steps are prose and this is the
     only part of a recipe the parser reads. */
  const fx = /\btrimmed\b/i.test(raw) ? PREP.trimmed : undefined;

  /* What is bought is not what is eaten, for a coating or a soak. The grams
     stay the purchase weight — the shopping list sends you out for three cups
     of flour because the bowl needs three cups in it — and `pe` says how much
     of it reaches the plate, which is all the macros count. See EATEN. */
  let pe;
  for (let i = 0; i < EATEN.length; i++) {
    if ((!EATEN[i].key || EATEN[i].key === key) && EATEN[i].re.test(raw)) { pe = EATEN[i].part; break; }
  }

  return { key, grams, alias: hit.alias, unit: used, fx, pe };
}

/** Convenience wrapper: returns { key, grams } or null if unreadable. */
function gramsFor(line) {
  const r = parseLine(line);
  if (!r || r.unmatched || !r.grams) return null;
  return r;
}

module.exports = { parseLine, gramsFor, FOODS, ALIASES };
