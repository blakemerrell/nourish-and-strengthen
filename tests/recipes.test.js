/* The collection itself: its numbering, its cross-references, and whether a
 * recipe uses what it asks you to buy.
 *
 * These are checks on the data rather than on the interface, but they run in
 * the browser against the file the app actually loads — the same copy a phone
 * gets, not a fresh read of the build tools' output.
 */

module.exports = {
  name: 'The collection',
  async run(t) {
    const p = await t.fresh();
    await p.click('.tab[data-view="browse"]');   // the app opens on Today; these are Recipes' tests
    await p.waitForTimeout(200);

    /* ---------------------------------------------------------------- number
     *
     * The front matter promises a number "running from 001 straight through
     * both volumes", and for one afternoon it did not. Volume One was
     * renumbered when it was re-sectioned and grew to a hundred and eleven;
     * Volume Two's printed number had always been its id, starting at 101. So
     * eleven numbers pointed at two recipes each — there were two recipes
     * called 105 — and six more were missing entirely where the drinks had
     * left. Nothing noticed, because nothing had ever had reason to look at
     * the two volumes' numbers together. */
    const nums = await p.evaluate(() => window.RECIPES
      .filter((r) => r.book === 1 || r.book === 2)
      .map((r) => r.no)
      .sort((a, b) => a - b));

    t.ok('every printed recipe has a number',
      nums.every((n) => Number.isInteger(n) && n > 0), nums.filter((n) => !n).length + ' without one');
    t.ok('no two recipes share a number',
      new Set(nums).size === nums.length,
      nums.length - new Set(nums).size + ' numbers used twice');
    const gaps = nums.filter((n, i) => i && n !== nums[i - 1] + 1)
      .map((n, i) => nums[nums.indexOf(n) - 1] + '->' + n);
    t.ok('and the run has no holes in it',
      nums[0] === 1 && gaps.length === 0,
      'starts at ' + nums[0] + ', gaps: ' + (gaps.join(', ') || 'none'));

    /* ---------------------------------------------------- cross-references
     *
     * Ten steps send you to another recipe. Every one of them used to have the
     * number typed into the sentence, which was correct until the collection
     * was renumbered and then quietly wrong in ten places at once — in the
     * printed book, where nobody can see the mistake and everybody can follow
     * it to the wrong page.
     *
     * They carry the id now and the number is filled in when the sentence is
     * drawn. These two checks are what stop it going back: a reference has to
     * point at something that exists, and no step may go back to writing the
     * number down. */
    const refs = await p.evaluate(() => {
      const by = {}; window.RECIPES.forEach((r) => { by[r.id] = r; });
      const dead = [], typed = [];
      window.RECIPES.forEach((r) => (r.steps || []).forEach((s, i) => {
        (String(s).match(/\{r:(\d+)\}/g) || []).forEach((tok) => {
          const id = tok.slice(3, -1);
          if (!by[id]) dead.push('no.' + r.no + ' step ' + i + ' -> ' + id);
        });
        if (/\bRecipe \d+/.test(s)) typed.push('no.' + r.no + ' step ' + i);
      }));
      return { dead, typed, total: window.RECIPES.reduce((n, r) =>
        n + (r.steps || []).join(' ').split(/\{r:\d+\}/).length - 1, 0) };
    });
    t.ok('the recipes point at each other in ten or more places', refs.total >= 10, refs.total + ' references');
    t.ok('and every reference points at a recipe that exists',
      refs.dead.length === 0, refs.dead.join('; '));
    t.ok('no step writes a recipe number down by hand',
      refs.typed.length === 0, refs.typed.join('; '));

    /* And the reference has to work, not merely resolve. Opening the meatball
       feast and pressing the words is the thing the reader actually does. */
    const meatballs = await p.evaluate(() =>
      (window.RECIPES.find((r) => /\{r:\d+\}/.test((r.steps || []).join(' ')) && r.book === 2) || {}).id);
    await p.evaluate((id) => document.querySelector('[data-open="' + id + '"]').click(), meatballs);
    await p.waitForTimeout(300);
    const shown = await p.evaluate(() => ({
      raw: /\{r:\d+\}/.test(document.body.innerText),
      links: [...document.querySelectorAll('.xref')].map((b) => b.textContent),
    }));
    t.ok('a reference is drawn as a recipe number, not as its token',
      !shown.raw && shown.links.length > 0 && /^Recipe \d{3}$/.test(shown.links[0] || ''),
      JSON.stringify(shown));

    const went = await (async () => {
      const before = await p.evaluate(() => document.querySelector('.sheet-eyebrow, .sheet').innerText.slice(0, 40));
      await p.click('.xref');
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => document.querySelector('.sheet').innerText.slice(0, 60));
      return { before, after };
    })();
    t.ok('and pressing it opens the recipe it names',
      /NO\. \d+/.test(went.after) && went.after !== went.before, JSON.stringify(went));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);

    /* ------------------------------------------------------------- the score
     *
     * Carbohydrate was free. Across the whole collection the correlation
     * between carbohydrate's share of a recipe's calories and its score was
     * 0.012 — and the fat part rewards a low fat share, so trading fat for
     * sugar actually raised a recipe's score. A mug of hot milk and brown
     * sugar scored 75.
     *
     * What is scored is not carbohydrate, which is the part worth protecting:
     * oats and frosting are both carbohydrate. A gram of fiber covers ten
     * grams of it, and only the remainder costs anything — so this checks the
     * discrimination rather than the penalty. Any formula that marks the oats
     * down along with the sugar has missed the point of the change. */
    const score = await p.evaluate(() => {
      const N = window.Nutrition;
      const same = { kcal: 300, p: 15, na: 300, fib: 1 };
      const fatty = N.scoreFrom(Object.assign({}, same, { f: 10, c: 30 }));
      const sugary = N.scoreFrom(Object.assign({}, same, { f: 0, c: 52 }));
      const oats = N.scoreFrom({ kcal: 300, p: 15, f: 5, c: 50, na: 300, fib: 7 });
      const sugar = N.scoreFrom({ kcal: 300, p: 15, f: 5, c: 50, na: 300, fib: 0.5 });
      return { fatty: fatty.score, sugary: sugary.score, oats: oats.score, sugar: sugar.score,
        parts: Object.keys(fatty.sc), max: N.MAX };
    });
    t.ok('the score has a part for carbohydrate',
      score.parts.indexOf('c') >= 0 && score.max && score.max.c > 0,
      score.parts.join(','));
    t.ok('the six parts still add to a hundred',
      Object.values(score.max).reduce((a, b) => a + b, 0) === 100,
      JSON.stringify(score.max));
    t.ok('trading fat for sugar no longer raises a score',
      score.sugary <= score.fatty, score.fatty + ' with the fat, ' + score.sugary + ' with the sugar');
    t.ok('and fifty grams of carbohydrate with fiber beats fifty without',
      score.oats > score.sugar + 5,
      'oats ' + score.oats + ' vs sugar ' + score.sugar);

    /* ------------------------------------------------------------- trimmed
     *
     * The storehouse roasts are chuck and shoulder — pot-roast cuts, fatty by
     * nature — and the table says so. A recipe that has you cut the cap off
     * before it cooks eats less of that fat, and "trimmed" on the ingredient
     * line is how it says so. The word must move the fat and nothing else:
     * the protein is in the lean, which stays, and the grams are what you
     * buy, which is what the shopping list adds up. It is a word on the line
     * and not a second food, so the pantry's one "Pork roast" still covers
     * every recipe that uses one. */
    const trim = await p.evaluate(() => {
      const N = window.Nutrition;
      const est = (ing) => N.nutritionFor(ing, 4, null, N.parseLine, N.FOODS, N.SPICE_NAMES);
      const whole = est(['2 lbs pork roast']), cut = est(['2 lbs pork roast, trimmed']);
      const users = window.RECIPES.filter((r) => (r.ing || []).some((l) => /trimmed/i.test(l)));
      return {
        whole: whole.perServing, cut: cut.perServing,
        sameKey: whole.items[0].k === cut.items[0].k && whole.items[0].g === cut.items[0].g,
        users: users.map((r) => r.id),
        pantryKeys: Object.keys(window.PANTRY || {}).filter((k) => /_trim/.test(k)),
      };
    });
    t.ok('"trimmed" on a roast takes fat off the plate',
      trim.cut.f < trim.whole.f * 0.7 && trim.cut.kcal < trim.whole.kcal,
      trim.whole.f + 'g fat whole, ' + trim.cut.f + 'g trimmed');
    t.ok('and only fat — the protein and the purchase weight are untouched',
      trim.cut.p === trim.whole.p && trim.cut.na === trim.whole.na && trim.sameKey,
      JSON.stringify({ whole: trim.whole, cut: trim.cut, sameKey: trim.sameKey }));
    t.ok('the roast dinners use the word, and the pantry has no second roast for it',
      trim.users.length >= 2 && trim.pantryKeys.length === 0,
      'used by ' + trim.users.join(', ') + '; trim keys: ' + trim.pantryKeys.join(','));

    /* Blake's own Creamy Broccoli Soup (2026-11-04): "1 chicken bouillon
     * cube" matched the longest name it knew, chicken, and was priced as a
     * 285 g can of it — 66 g of protein that was never in the pot. A cube is
     * about 5 g of salty seasoning; granules and the paste in a jar likewise. */
    const bou = await p.evaluate(() => {
      const N = window.Nutrition, est = (ing) => N.nutritionFor(ing, 4, null, N.parseLine, N.FOODS, N.SPICE_NAMES);
      const soup = ['2 medium potatoes', '1 1/2 cups chopped broccoli', '1 medium carrot', '1 chicken bouillon cube',
        '2/3 cup condensed cream of chicken soup', '1/2 cup sour cream', '1 cup water'];
      const lines = ['1 chicken bouillon cube', '2 beef bouillon cubes', '1 tsp chicken bouillon granules', '1 tbsp better than bouillon'];
      const packs = ['1 envelope onion soup mix', '1 packet ranch dressing mix', '1 packet taco seasoning', '1 packet chili seasoning', '1 packet sloppy joe mix', '1 can french onion soup']
        .map((l) => { const r = N.parseLine(l); return [l, r.key || 'unmatched', Math.round(r.grams || 0)]; });
      return { per: est(soup).perServing, packs, read: lines.map((l) => { const r = N.parseLine(l); return [l, r.key, Math.round(r.grams * 10) / 10]; }) };
    });
    t.ok('a bouillon cube is a few grams of seasoning, never a can of chicken',
      bou.read.every((x) => /^bouillon/.test(x[1]) && x[2] > 0 && x[2] < 25), JSON.stringify(bou.read));
    t.ok('so the broccoli soup made with one is about 5 g of protein a bowl, not 21',
      bou.per.p <= 8 && bou.per.kcal < 220 && bou.per.na > 400, JSON.stringify(bou.per));
    t.ok('a packet of seasoning or soup mix is the packet, a few dozen grams of dry mix, not a fresh onion or nothing',
      bou.packs.slice(0, 5).every((x) => /_mix$|_seasoning$/.test(x[1]) && x[2] >= 20 && x[2] <= 50), JSON.stringify(bou.packs));
    t.ok('and a can of onion soup is still not the dry mix', bou.packs[5][1] !== 'onion_soup_mix', JSON.stringify(bou.packs[5]));

    /* --------------------------------------- ingredients you could make
     *
     * The storehouse does not carry breadcrumbs, and the app said it did.
     * Stocked-ness used to be inferred from whether some recipe had named an
     * item in its own extras line, so anything nobody annotated was silently
     * declared available — five items were wrong that way, including the
     * celery salt in the BBQ sauce recipe, which exists so that somebody with
     * only the order can still make barbecue sauce.
     *
     * It is declared now, and Made, Not Bought answers for what is left. Fifty
     * ingredient lines name something it produces, and each of those lines
     * carries the link rather than the section hoping to be browsed. */
    const makers = await p.evaluate(() => {
      const M = window.MAKERS || {}, P = window.PANTRY;
      const by = {}; window.RECIPES.forEach((r) => { by[r.id] = r; });
      const dead = Object.keys(M).filter((k) => !by[M[k]]);
      const stocked = Object.keys(M).filter((k) => P[k] && P[k].s);
      let linked = 0;
      window.RECIPES.forEach((r) => (r.ingp || []).forEach((it) => {
        if (it && it.k && M[it.k] && M[it.k] !== r.id &&
            !(r.nomake && r.nomake.indexOf(it.k) >= 0)) linked++;
      }));
      return { dead, stocked, linked, made: Object.keys(M).length };
    });
    t.ok('the collection has recipes for things the storehouse does not carry',
      makers.made >= 8 && makers.linked >= 40,
      makers.made + ' made, reachable from ' + makers.linked + ' ingredient lines');
    t.ok('and each one points at a recipe that exists',
      makers.dead.length === 0, makers.dead.join(', '));
    /* And the rescue has to be a rescue.
     *
     * Made, Not Bought is for the cook who has the storehouse order and
     * nothing else, so a recipe in it that needs something off the order is
     * worse than useless — it sends you to the shop to avoid going to the
     * shop. Both sauce recipes did: they listed celery salt, which the order
     * does not carry, and nothing said so because the pantry had celery salt
     * marked as a staple. It is optional in both now, and optional means
     * something: the line counts toward the nutrition and never toward what
     * you have to go out for. */
    const rescue = await p.evaluate(() => {
      const P = window.PANTRY;
      const bad = [];
      window.RECIPES.filter((r) => r.secName === 'Made, Not Bought').forEach((r) => {
        (r.ingp || []).forEach((it, i) => {
          if (it && it.k && !it.o && P[it.k] && !P[it.k].s) {
            bad.push('no.' + r.no + ' needs ' + r.ing[i]);
          }
        });
      });
      return bad;
    });
    t.ok('and every one of them can be made from the storehouse order alone',
      rescue.length === 0, rescue.join('; '));

    const bought = await p.evaluate(() => {
      const P = window.PANTRY;
      // breadcrumbs and celery salt are everyday staples since 2026-11-06; these three are still bought
      return ['spray_butter', 'cream_cheese', 'biscuit_dough']
        .filter((k) => P[k] && P[k].s);
    });
    t.ok('the three a kitchen does not keep are not listed as staples',
      bought.length === 0, bought.join(', ') + ' still marked stocked');

    /* --------------------------------------------------- what you were told
     *   to buy
     *
     * A reader cooked the meatball feast and finished with a can of green
     * beans still on the counter: the ingredient list asked for it and the
     * method never mentioned it. Four more were like it.
     *
     * The check is deliberately loose about how an ingredient may be claimed —
     * "mix the ingredients" and "make 4 PB&J sandwiches" both count — because
     * a strict reading flags a third of the collection and would be turned
     * off within a week. What it is really holding is the five that were
     * fixed, and any new recipe that lists something and then forgets it. */
    const orphans = await p.evaluate(() => {
      const { FOODS, ALIASES } = window.Nutrition;

      /* Every word that could stand for a food key: the key itself, the label
         the shopping list prints, the note beside it in the table, and every
         alias the parser accepts. Matching on the ingredient line's own words
         alone is not enough — "1 jar spaghetti sauce" is claimed by a step
         that says "simmer in sauce". */
      const words = {};
      const add = (k, str) => { if (str) (words[k] = words[k] || []).push(String(str).toLowerCase()); };
      Object.keys(FOODS).forEach((k) => {
        add(k, k.replace(/_/g, ' '));
        add(k, FOODS[k].label);
        if (FOODS[k].note) String(FOODS[k].note).split(/[;,]/).forEach((n) => add(k, n.trim()));
      });
      Object.keys(ALIASES).forEach((a) => add(ALIASES[a], a));

      const forms = (str) => {
        const out = {};
        const push = (x) => { if (x && x.length > 2) out[x] = 1; };
        push(str);
        push(str.replace(/ies$/, 'y')); push(str.replace(/y$/, 'ies'));
        push(str.replace(/es$/, '')); push(str.replace(/s$/, ''));
        push(str + 's'); push(str + 'es');
        const parts = str.split(/\s+/);
        if (parts.length > 1) {
          const last = parts[parts.length - 1];
          push(last); push(last + 's'); push(last.replace(/s$/, ''));
        }
        return Object.keys(out);
      };

      /* Seasoning and fat nobody narrates. "Salt" rarely gets a sentence of
         its own and does not need one. */
      const QUIET = { salt: 1, pepper: 1, black_pepper: 1, water: 1, oil: 1, olive_oil: 1,
        vegetable_oil: 1, cooking_spray: 1, spice: 1, cinnamon: 1, vanilla: 1,
        garlic_powder: 1, onion_powder: 1, paprika: 1, chili_powder: 1, cumin: 1,
        oregano: 1, basil: 1, parsley: 1, italian_seasoning: 1, nutmeg: 1,
        baking_powder: 1, baking_soda: 1 };

      /* And the steps that claim a whole list at once. A recipe entitled to
         say "mix the ingredients" is not hiding anything — it is telling you
         to use all of them. Same for a batter, a dough, and "the vegetables"
         standing in for the three tins that went into it. */
      const COLLECTIVE = /\ball (of )?(the )?ingredients|mix (the )?ingredients|blend everything|combine everything|put ingredients|batter|dough|the vegetables|the veg\b|season well|make \d+ pb&j/;

      const out = [];
      window.RECIPES.forEach((r) => {
        const steps = (r.steps || []).join(' ').toLowerCase();
        if (COLLECTIVE.test(steps)) return;
        (r.ingp || []).forEach((it, i) => {
          if (!it || !it.k || QUIET[it.k]) return;
          const line = String((r.ing || [])[i] || '');
          const cand = {};
          (words[it.k] || [it.k.replace(/_/g, ' ')]).forEach((w) =>
            forms(w).forEach((f) => { cand[f] = 1; }));
          line.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
            .filter((w) => w.length > 3).forEach((w) => forms(w).forEach((f) => { cand[f] = 1; }));
          if (!Object.keys(cand).some((w) => steps.indexOf(w) >= 0)) {
            out.push('no.' + (r.no || r.id) + ' "' + line + '" (' + r.name + ')');
          }
        });
      });
      return out;
    });
    t.ok('nothing on an ingredient list goes unused by its own method',
      orphans.length === 0, orphans.join('; '));

    /* And nothing you were sent to the shop for, either.
     *
     * The check above reads r.ing. "Buy this elsewhere" is r.extras, a
     * separate list, so it was never covered — and eleven recipes were putting
     * something on a shopping list that no ingredient line and no step ever
     * mentioned again. Taco seasoning in five of them, parmesan in the
     * alfredo bake and the meatball feast, garlic powder, Italian seasoning,
     * cumin, Worcestershire.
     *
     * That is worse than an unused ingredient, because it costs money at a
     * till on the strength of a recipe that then has no use for it. Found by
     * the owner cooking No. 190, wondering where the parmesan was meant to go,
     * and adding it himself.
     *
     * Generic tails are stripped before matching, so "Whey Protein" is
     * satisfied by an ingredient line reading "1 scoop vanilla whey" while
     * "Parmesan Cheese" is not satisfied by the word "cheese" — the first pass
     * at this counted twenty-five recipes that were perfectly fine. */
    const unbought = await p.evaluate(() => {
      const GENERIC = /^(protein|powder|seasoning|mix|cheese|sauce|spices?)$/;
      const stem = (w) => w.toLowerCase().replace(/(es|s)$/, '');
      const out = [];
      window.RECIPES.forEach((r) => {
        if (!r.extras) return;
        const hay = ((r.ing || []).join(' ') + ' ' + (r.steps || []).join(' ')).toLowerCase();
        String(r.extras).split(/,|;| and /).map((s) => s.trim()).filter(Boolean).forEach((it) => {
          const words = it.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
            .filter((w) => w.length > 3);
          const key = words.filter((w) => !GENERIC.test(w));
          const need = key.length ? key : words;
          if (!need.length) return;
          if (!need.some((w) => hay.indexOf(stem(w)) >= 0)) {
            out.push('no.' + (r.no || r.id) + ' buys ' + it + ' (' + r.name + ')');
          }
        });
      });
      return out;
    });
    t.ok('and nothing it sends you to the shop for goes unmentioned by the method',
      unbought.length === 0, unbought.join('; '));

    /* "Better with a few extras" must stay extra.
     *
     * The owner keeps herbs and spices the storehouse does not carry, and
     * wanted the recipes to say what they would do with them — but only after
     * the recipe is already worth cooking on the order alone, which is the
     * promise the whole book rests on. So a lift is optional by construction:
     * its ingredients are named in the block and nowhere in the ingredient
     * list, which is what keeps them off the shopping list and out of the
     * macros. Put parmesan in `ing` and it becomes a trip to the shop before
     * you can cook dinner — which is exactly the mistake made first here, on
     * the alfredo bake, and undone.
     *
     * Its steps also number on from the method rather than restarting at one,
     * because a cook doing all of it is doing one recipe. */
    const lifts = await p.evaluate(() => {
      const bad = [];
      window.RECIPES.forEach((r) => {
        if (!r.lift) return;
        if (!r.lift.with || !(r.lift.steps || []).length) {
          bad.push('no.' + r.no + ' has a lift with no ingredients or no steps');
          return;
        }
        const ing = (r.ing || []).join(' ').toLowerCase();
        r.lift.with.split(/,| and /).map((w) => w.trim().toLowerCase())
          .filter(Boolean).forEach((w) => {
            const head = w.split(/\s+/).filter((x) => x.length > 3).pop() || w;
            if (ing.indexOf(head) >= 0) {
              bad.push('no.' + r.no + ' lifts with ' + w + ', which is already required');
            }
          });
      });
      return { bad, n: window.RECIPES.filter((r) => r.lift).length };
    });
    t.ok('nothing offered as an optional extra is also a required ingredient',
      lifts.bad.length === 0, lifts.bad.join('; ') + ' (' + lifts.n + ' recipes carry a lift)');

    /* ------------------------------------------- three faults from one audit
     *
     * The owner cooked No. 190 and hit four problems in one recipe. Sweeping
     * the rest for the same shapes turned up nine more real ones and a great
     * deal of noise — most classes were false alarms, so only the three that
     * survived reading are guarded here. A check that fires on forty recipes
     * that are all fine is worse than no check.
     *
     *   cooked twice   pasta boiled to done and then baked, which is how a
     *                  casserole becomes paste. Seven recipes did it.
     *   a dry braise   a slow cooker with nothing in it to braise in.
     *   "make X"       a step naming a component and never saying how, which
     *                  is the sentence that sent him to look it up elsewhere.
     */
    const faults = await p.evaluate(() => {
      const S = (r) => (r.steps || []).join(' ');
      const twice = [], dry = [], vague = [];
      window.RECIPES.filter((r) => r.book < 3).forEach((r) => {
        const s = S(r);
        if (/boil[^.]*\b(pasta|macaroni|spaghetti|noodle)\b/i.test(s) && /\bbake\b/i.test(s) &&
            !/short|firm|al dente|undercook/i.test(s)) twice.push('no.' + r.no);
        if (/slow.?cook/i.test(s) &&
            !/water|broth|sauce|juice|milk|gravy|liquid|applesauce|salsa/i
              .test(s + ' ' + (r.ing || []).join(' '))) dry.push('no.' + r.no);
        (r.steps || []).forEach((step) => {
          /* Short and bare: "Make cheese sauce with milk, flour, cheddar." A
             long step that happens to contain the word make is telling you
             how, which is the whole difference. */
          if (/^(make|prepare)\b/i.test(step.trim()) && step.length < 80 &&
              !/until|by |over |, whisk|, stir|about \d/i.test(step)) {
            vague.push('no.' + r.no + ' "' + step.trim() + '"');
          }
        });
      });
      return { twice, dry, vague };
    });
    t.ok('no pasta is boiled through and then baked again',
      faults.twice.length === 0, faults.twice.join(' '));
    t.ok('nothing goes in a slow cooker with nothing to cook in',
      faults.dry.length === 0, faults.dry.join(' '));
    t.ok('and no step names a thing to make without saying how',
      faults.vague.length === 0, faults.vague.join('; '));

    /* A packet needs what the packet needs.
     *
     * Reported by the owner, who was confused by No. 235 — a box of cake mix,
     * a packet of pudding and two cups of hot water, and step two says "mix
     * cake batter". Out of what? A boxed mix wants eggs and oil of its own and
     * neither was listed, so the first real instruction could not be carried
     * out at all. Four more were the same: a yellow cake with no eggs, a gravy
     * packet in a slow cooker with nothing to dissolve it in.
     *
     * "pancake mix" contains "cake mix", which is how the first pass at this
     * turned four recipes into nineteen — hence the negative lookbehind. */
    const packets = await p.evaluate(() => {
      const NEED = [
        [/(^|[^n])\bcake mix\b/, ['egg', 'oil', 'water', 'milk'], 'a boxed cake mix', 2],
        [/\bbrownie mix\b/, ['egg', 'oil', 'water', 'milk'], 'a brownie mix', 2],
        [/\bpudding mix\b/, ['milk', 'water'], 'a pudding mix', 1],
        [/\b(pancake|waffle) mix\b/, ['milk', 'water', 'egg'], 'a pancake mix', 1],
        [/\bgravy mix\b/, ['water', 'milk', 'broth'], 'a gravy packet', 1],
      ];
      const out = [];
      window.RECIPES.filter((r) => r.book < 3).forEach((r) => {
        const ing = (r.ing || []).join(' ').toLowerCase();
        const both = ing + ' ' + (r.steps || []).join(' ').toLowerCase();
        NEED.forEach(([re, wants, label, min]) => {
          if (!re.test(ing)) return;
          if (wants.filter((w) => both.indexOf(w) >= 0).length < min) {
            out.push('no.' + r.no + ' has ' + label + ' and nothing wet (' + r.name + ')');
          }
        });
      });
      return out;
    });
    t.ok('every packaged mix has the liquid the packet needs',
      packets.length === 0, packets.join('; '));

    /* The other direction: a step calling for something the recipe has not got.
     *
     * The existing check reads the ingredient list and asks whether the method
     * uses it. This asks the reverse, and it exists because of a mistake of
     * mine: a step written for No. 072 landed on No. 071 by a one-digit slip,
     * telling a sheet-pan roast to fry its chicken and toss it in hot sauce
     * and ranch — neither of which that recipe has. Nothing caught it. I found
     * it reading the book.
     *
     * Deliberately a short list of distinctive foods rather than every word: a
     * step may reasonably mention water, salt, a pan or an oven without those
     * being ingredients, and a check that flags those is a check nobody
     * keeps. */
    const ghosts = await p.evaluate(() => {
      /* Not "gravy": four recipes make gravy, so "the gravy" in a step is the
         thing being produced rather than a thing being reached for. Same trap
         for anything a recipe can output. */
      const NAMED = ['hot sauce', 'ranch', 'mayo', 'salsa', 'ketchup', 'mustard',
        'soy sauce', 'bbq sauce', 'sour cream', 'yogurt', 'cottage cheese',
        'peanut butter', 'cheddar', 'parmesan', 'bacon', 'sausage', 'tortilla',
        'macaroni', 'spaghetti', 'broccoli', 'banana', 'raisin', 'oats'];
      const out = [];
      window.RECIPES.filter((r) => r.book < 3).forEach((r) => {
        const ing = (r.ing || []).join(' ').toLowerCase();
        const lift = r.lift ? (r.lift.with + ' ' + (r.lift.steps || []).join(' ')).toLowerCase() : '';
        (r.steps || []).forEach((step) => {
          const st = String(step).toLowerCase();
          NAMED.forEach((n) => {
            /* "the hot sauce" / "with the ranch" — a definite article means the
               step believes it is already on the list. */
            if (!new RegExp('\\bthe ' + n + '\\b').test(st)) return;
            if (ing.indexOf(n) >= 0 || lift.indexOf(n) >= 0) return;
            out.push('no.' + r.no + ' cooks with "the ' + n + '" and has none (' + r.name + ')');
          });
        });
      });
      return out;
    });
    t.ok('no step reaches for an ingredient the recipe does not have',
      ghosts.length === 0, ghosts.join('; '));

    /* ------------------------------------------------- and the shell says so
     *
     * The landing page's counts are stamped and guarded. index.html's were
     * neither, and it turned out to be saying 271 on a collection of 277 in
     * two places: the meta description, which is what a search result and a
     * texted link quote, and the line under the wordmark, which the app
     * rewrites a moment after load — wrong only for the moment a screenshot
     * gets taken in.
     *
     * Read out of the served markup rather than out of the rendered page, so
     * the one the app corrects at runtime is checked as it arrives. */
    const shell = await p.evaluate(async () => {
      const src = await (await fetch('index.html')).text();
      const grab = (re) => { const m = src.match(re); return m ? Number(m[1]) : null; };
      return {
        real: window.RECIPES.length,
        meta: grab(/<meta name="description" content="[^"]*?\b(\d+) recipes/),
        brand: grab(/<div class="brand-sub">(\d+) recipes/),
      };
    });
    t.ok('the app shell quotes the number of recipes there are',
      shell.meta === shell.real && shell.brand === shell.real,
      JSON.stringify(shell) + ' — run npm run print');

    /* ------------------------------------------------- one macro per recipe
     *
     * The guard that should have existed from the start. "What is in a
     * serving of this" used to get two answers depending on which volume the
     * recipe came from — Volume One kept the figure printed under its title,
     * Around the Table added up its ingredients — and both were stored on the
     * record, on `macro` and on `estMacro`, with nothing reconciling them.
     * Twenty-five recipes disagreed with themselves by more than thirty per
     * cent. The app planned against one number and the plate showed the
     * other, and the only reason anyone found out was Blake asking why a
     * recipe's parts did not come to its total.
     *
     * Nothing structural stopped it, so nothing stopped it. This does: every
     * recipe's macro IS the sum of its ingredients, checked here against the
     * same food table the shopping list uses, in the browser, against the
     * file a phone actually loads.
     *
     * A tolerance rather than an equality because the record rounds and this
     * does not. It is not a place to absorb a disagreement — if this starts
     * failing, a second source of truth has grown back. */
    const sums = await p.evaluate(() => {
      const F = window.FOODS || (window.Nutrition && window.Nutrition.FOODS);
      if (!F) return { noTable: true };
      const bad = [];
      let checked = 0;
      window.RECIPES.forEach((r) => {
        if (!r.ingp || !r.ingp.length || !r.macro || !r.macro.kcal) return;
        /* The food table's own kcal, NOT 4p+4c+9f derived from the sums.
           The two differ by a couple of per cent — real foods round, and
           their label calories are not exactly their macros times four and
           nine — and the record is built from the former. Deriving here
           would make this check fail 300 recipes for a disagreement between
           two definitions of a calorie rather than for any recipe being
           wrong. (That disagreement is real and lives in the app too:
           mTotals SUMS macro.kcal while kcalOf DERIVES it. Worth its own
           look; it is not what this guard is for.) */
        const t = { p: 0, c: 0, f: 0, kcal: 0 };
        let missing = false;
        r.ingp.forEach((ip) => {
          const fd = F[ip.k];
          if (!fd) { missing = true; return; }
          const g = Number(ip.g) || 0;
          /* `pr` is what survived the knife on a line that said "trimmed".
             `g` stays the weight you buy, so the fat has to come off here —
             and only the fat, and only its own calories with it. Protein and
             carbohydrate are in the lean and do not go in the bin. */
          const keep = ip.pr === undefined ? 1 : ip.pr;
          /* `pe` is the share of a dredge or a soak that reaches the plate.
             `g` is the bowl, so all of it scales, not only the fat. */
          const eat = (ip.pe === undefined ? 1 : ip.pe) * g / 100;
          const fat = fd.f * keep;
          t.p += fd.p * eat; t.c += fd.c * eat;
          t.f += fat * eat;
          t.kcal += (fd.kcal - (fd.f - fat) * 9) * eat;
        });
        if (missing) return;
        const n = Number(r.servN) > 0 ? Number(r.servN) : 1;
        checked++;
        /* Protein, carbohydrate and fat only. The calorie is no longer summed
           off the table at all — it is derived from these three, and the test
           below owns that link. Two guards, one per link in the chain: the
           ingredients decide the macros, the macros decide the calorie. Left
           here, this would fail every recipe for the definition change rather
           than for any recipe being wrong.

           Half a gram of slack because the record rounds to whole numbers and
           this does not: a line holding 5.5 g of fat is stored as 6, which is
           a 9% disagreement about nothing. The relative bound is what catches
           a real drift on the big figures. */
        const off = (k, v) => Math.abs(v / n - (r.macro[k] || 0)) >
          Math.max(0.51, (r.macro[k] || 0) * 0.02);
        if (off('p', t.p) || off('c', t.c) || off('f', t.f)) {
          bad.push(r.no + ' ' + r.name + ': record ' + Math.round(r.macro.p) + 'P ' +
            Math.round(r.macro.c) + 'C ' + Math.round(r.macro.f) + 'F, ingredients ' +
            Math.round(t.p / n) + 'P ' + Math.round(t.c / n) + 'C ' +
            Math.round(t.f / n) + 'F');
        }
      });
      return { checked: checked, bad: bad.slice(0, 6), n: bad.length };
    });
    t.ok('every recipe\u2019s macros are the sum of its own ingredients',
      !sums.noTable && sums.checked > 250 && sums.n === 0, JSON.stringify(sums));

    /* ------------------------------------------------- one calorie, not two
     *
     * The app used to hold two definitions of a calorie and compare them to
     * each other. Every TARGET was 4p+4c+9f of macros a person typed; every
     * ACTUAL was a sum of the food table's own kcal, which knows that a third
     * of cocoa's carbohydrate is never digested (228 a hundred grams, against
     * the 434 the arithmetic gives). Both are defensible and they are not the
     * same number, so `mTotals` summing one while `kcalOf` derived the other
     * put roughly twelve calories of disagreement into the middle of every
     * gauge in My Day — and it is the same disagreement that once had a meal
     * asking for 41 g of protein inside 113 calories.
     *
     * There is one question here, "how many calories is this", so there is
     * one answer: four-four-nine, everywhere, on both sides of every
     * comparison. The table's fibre-aware figure is the better nutrition and
     * the app has no screen that asks for it.
     *
     * Checked on the record rather than on the renderer, because this has to
     * hold for a recipe, for a storehouse food and for one somebody typed —
     * every macro that reaches a day comes through here. */
    const oneCal = await p.evaluate(() => {
      const bad = [];
      window.RECIPES.forEach((r) => {
        if (!r.macro) return;
        const m = r.macro;
        if (!(m.p || m.c || m.f)) return;      // calories alone: nothing to check against
        const want = 4 * m.p + 4 * m.c + 9 * m.f;
        if (Math.abs(want - m.kcal) > 1) bad.push(r.no + ' ' + r.name + ': says ' +
          m.kcal + ', its own macros say ' + Math.round(want));
      });
      return { n: bad.length, bad: bad.slice(0, 5), checked: window.RECIPES.length };
    });
    t.ok('a recipe\u2019s calories are its own macros, four-four-nine',
      oneCal.n === 0 && oneCal.checked > 300, JSON.stringify(oneCal));

    /* And the same for a single food off the storehouse table, which reaches
       a day by a different road entirely (`mBuildFoods`, not the build). */
    const foodCal = await p.evaluate(() => {
      const bad = [];
      let n = 0;
      const list = (window.__macroLab && window.__macroLab.foods()) || [];
      list.forEach((r) => {
        if (!r.macro) return;
        const m = r.macro;
        if (!(m.p || m.c || m.f)) return;
        n++;
        const want = 4 * m.p + 4 * m.c + 9 * m.f;
        if (Math.abs(want - m.kcal) > 1) bad.push(r.name + ': says ' + m.kcal +
          ', its own macros say ' + Math.round(want));
      });
      return { checked: n, n: bad.length, bad: bad.slice(0, 5) };
    });
    t.ok('and so are a single food\u2019s', foodCal.checked > 50 && foodCal.n === 0,
      JSON.stringify(foodCal));

    /* And the printed figure is kept, not quietly dropped. A reader holding
       the physical book has to be able to find the number under its title,
       even where the app no longer counts it. */
    const kept = await p.evaluate(() => {
      const b1 = window.RECIPES.filter((r) => r.book === 1 && r.bookMacro);
      const far = b1.filter((r) =>
        Math.abs(r.macro.kcal / Math.max(r.bookMacro.kcal, 1) - 1) > 0.30);
      return { withBook: b1.length, far: far.length,
        worst: far.sort((a, b) => Math.abs(b.macro.kcal - b.bookMacro.kcal) -
          Math.abs(a.macro.kcal - a.bookMacro.kcal)).slice(0, 3)
          .map((r) => r.no + ' print ' + r.bookMacro.kcal + ' app ' + Math.round(r.macro.kcal)) };
    });
    t.ok('and what the book printed is kept beside it, not thrown away',
      kept.withBook >= 100, JSON.stringify(kept));

    /* A ratchet, not a target. Twenty-five recipes were more than thirty per
       cent from print when this was written and the work brought it to
       nineteen; the number may only go down. Raising it is how a data change
       that quietly wrecks a shelf of recipes gets through unnoticed.

       Raised once, to 22, and the reason is written here so that it reads as
       a decision rather than as somebody bending a test to fit: the app's
       calorie became 4p+4c+9f, which runs about 1.7 kcal above the table's
       fibre-aware figure, and three recipes ALREADY sitting at 23%, 26% and
       28% crossed thirty — #30 to 32.5%, #20 to 31.0%, #18 to 30.5%. Each
       moved by under five points and none of them moved for a reason of its
       own. Note also that this measure now compares across definitions by
       construction, the book's printed figure being label-style, so a couple
       of points of it are the yardstick rather than the recipes. */
    t.ok('and no more of them drift from print than already did',
      kept.far <= 22, kept.far + ' of ' + kept.withBook + ' — ' + JSON.stringify(kept.worst));


    /* ------------------------------------------------- nobody's voice but the cook's
     *
     * Six recipes were caught explaining their own edit history to whoever
     * was trying to cook from them: "this is the step the recipe was
     * missing", "Hotter than it said", '"Seasoned" means it', "It is on the
     * list for this recipe", "unlike most things on this list". A further
     * handful ranked themselves inside the collection — "the leanest
     * breakfast in the volume", "the most protein per calorie in the
     * section".
     *
     * Every one of them was in a recipe written or patched here; not one was
     * in the book's own text. They got in because nothing objected, and the
     * fixes file is grouped by kind of fix rather than by recipe, so no one
     * place ever showed what a recipe finally reads like.
     *
     * This catches self-reference only: a recipe talking about the
     * collection, or about its own revision. It is deliberately blind to
     * voice — "Irons vary more than recipes admit" passes, and is meant to.
     * Tone is a matter of taste and is not a test's business; a recipe
     * narrating its own edit history is not a matter of taste. */
    const selfRef = await p.evaluate(() => {
      const PAT = [
        [/\bthis list\b/i, 'refers to the collection as a list'],
        [/\bin the (section|volume)\b/i, 'ranks itself within the collection'],
        [/\bthis collection\b/i, 'refers to the collection'],
        [/\bthan it said\b/i, 'refers to what the original said'],
        [/\bthe recipe was\b/i, 'refers to the recipe\u2019s own past state'],
        [/"[^"]+"\s+means it\b/i, 'glosses the original\u2019s wording'],
        [/\bthe book (says|prints|printed)\b/i, 'refers to the printed book'],
        [/\bon the list for this recipe\b/i, 'refers to the ingredient list as a list'],
      ];
      const out = [];
      window.RECIPES.forEach((r) => {
        const texts = []
          .concat(r.steps || [])
          .concat((r.lift && r.lift.steps) || [])
          .concat(typeof r.tagline === 'string' ? [r.tagline] : []);
        texts.forEach((txt) => {
          PAT.forEach(([re, why]) => {
            if (re.test(txt)) out.push(r.no + ' ' + r.name + ' \u2014 ' + why + ' \u2014 "' + txt.slice(0, 90) + '"');
          });
        });
      });
      return out;
    });
    t.ok('no recipe talks about the collection or about its own edits',
      selfRef.length === 0, selfRef.slice(0, 6).join(' | '));

    /* Mutation proof, both ways: the guard has to fire on a planted line and
       stay quiet on a voiced one, or it is decoration. */
    const proof = await p.evaluate(() => {
      const PAT = [/\bthis list\b/i, /\bin the (section|volume)\b/i, /\bthan it said\b/i,
        /\bthe recipe was\b/i, /"[^"]+"\s+means it\b/i];
      const fires = (s) => PAT.some((re) => re.test(s));
      return {
        caught: [
          'Chill 45 minutes \u2014 this is the step the recipe was missing.',
          'Heat the oven to 425\u00b0F. Hotter than it said: 400 steams the potato.',
          '"Seasoned" means it: 2 tbsp taco seasoning into the beef.',
          'The leanest breakfast in the volume.',
          'Unlike most things on this list it is simply better.',
        ].filter(fires).length,
        spared: [
          'Irons vary more than recipes admit.',
          'Cold butter is what keeps these thick instead of spreading flat.',
          'Overcooked broccoli is the reason people say they do not like broccoli.',
          'Same as the cups, twice the volume.',
          'Done means 165\u00b0F and clear juices.',
        ].filter(fires).length,
      };
    });
    t.ok('and the guard fires on every planted self-reference',
      proof.caught === 5, proof.caught + ' of 5');
    t.ok('and spares voice, which is not its business',
      proof.spared === 0, proof.spared + ' false positives');


    /* ----------------------------------------- the count in front is the count
     *
     * Eleven lines led with the YIELD — "8 Pancakes (4 Servings)", "About 1
     * Cup (8 Servings)" — and two readers took the number in front for the
     * serving count: My Day named a plate "1 pancake" and charged two, and
     * the editor rebuilt servN from it, so opening the BBQ sauce to fix a
     * comma and saving would have made it one serving of twelve. The line
     * leads with the count now, and this holds it there. */
    const leads = await p.evaluate(() => window.RECIPES
      .filter((r) => r.book === 1 || r.book === 2)
      .map((r) => ({ no: r.no, name: r.name, servings: r.servings, servN: r.servN,
        lead: parseFloat(String(r.servings || '').replace(/^\s*about\s+/i, '')) }))
      .filter((r) => !(r.lead > 0) || Math.abs(r.lead - r.servN) > 0.01)
      .map((r) => r.no + ' ' + r.name + ' "' + r.servings + '" servN ' + r.servN));
    t.ok('every servings line leads with the number of servings it counts',
      leads.length === 0, leads.slice(0, 6).join(' | '));

    /* ----------------------------------------------- chicken says when it is done
     *
     * Sixteen recipes cooked raw chicken, pork or beef with no temperature,
     * no time and no doneness cue anywhere in them. Three of those poached
     * chicken, cooled it and served it cold, on the words "poach the
     * chicken" alone — which is the one combination in this book that can
     * make somebody ill.
     *
     * Chicken is the one this guards, because it is the one with a number
     * everybody agrees on and the one that turns up raw most often. A recipe
     * that starts from raw chicken has to say 165°F, or say the pink is
     * gone, or hand it to a slow cooker for hours where the clock is the
     * cue. Ground beef and braises are deliberately out of scope: "brown the
     * beef" and "until it gives under a fork" are real cues in their own
     * right and a guard that argued with them would be noise. */
    const rawBird = await p.evaluate(() => {
      const RAW = /\b\d[\d¼½¾.\s]*(?:lbs?|oz)\s+chicken (?:breasts?|thighs?)\b/i;
      const CUE = /165\s*°?F|no pink|no longer pink|not pink|juices run clear|cooked through/i;
      const SLOW = /slow cooker|LOW \d+ hours?|HIGH \d/i;
      return window.RECIPES
        .filter((r) => RAW.test((r.ing || []).join(' ')))
        .filter((r) => {
          const st = (r.steps || []).join(' ');
          return !CUE.test(st) && !SLOW.test(st);
        })
        .map((r) => r.no + ' ' + r.name);
    });
    t.ok('a recipe that starts from raw chicken says how you know it is cooked',
      rawBird.length === 0, rawBird.slice(0, 8).join(' | '));

    const birdProof = await p.evaluate(() => {
      const CUE = /165\s*°?F|no pink|no longer pink|not pink|juices run clear|cooked through/i;
      const SLOW = /slow cooker|LOW \d+ hours?|HIGH \d/i;
      const ok = (s) => CUE.test(s) || SLOW.test(s);
      return {
        caught: ['Poach the chicken, cool it fully, then slice it thin.',
          'Roast the chicken whole and slice it after it rests.',
          'Take the chicken off as soon as it is done.',
          'Cook it in a hot dry pan until it has colour.'].filter((s) => !ok(s)).length,
        spared: ['Poach it 12 to 15 minutes, until it reads 165°F at the thickest part.',
          'Simmer about 15 minutes, until it is no longer pink in the middle.',
          'Put chicken and salsa into slow cooker. Cook LOW 4 hours.',
          'Simmer 15 to 20 minutes, until the chicken is cooked through.'].filter((s) => !ok(s)).length,
      };
    });
    t.ok('and the cue guard fires on every way of not saying it',
      birdProof.caught === 4, birdProof.caught + ' of 4');
    t.ok('and spares every real way of saying it',
      birdProof.spared === 0, birdProof.spared + ' false positives');

    /* ------------------------------------------------ the note and the meat
     *
     * The second time a pass of technique notes went wrong it went wrong in
     * two shapes. Three sausage recipes were told to get the pan hot "before
     * the beef goes in", because the note was written once for browning and
     * handed out by kind. And the chicken note — salt it ahead, pound the
     * thick end level, rest it before cutting — was appended to steps that
     * had already drained a can, dredged the breast, layered the casserole
     * or portioned the containers, so the recipe read as assemble first,
     * cook after. Every entry was right on its own; the fault was where it
     * landed, and the fixes file has no view of that.
     *
     * Two rules, both blind to voice. A step that speaks of "the beef" is
     * speaking of an ingredient in hand, so that meat must be on the list —
     * a gravy "for beef" or mayonnaise "in tuna" is not, and is left alone.
     * And once a step has served or portioned the dish, no later sentence in
     * it may start cooking the meat.
     *
     * One function judges the book and the planted lines both, so the proof
     * cannot drift from the rule it is proving. */
    const meat = await p.evaluate(() => {
      const MEATS = 'beef|sausage|pork|chicken|turkey|ham|steak|bacon|tuna|salmon|shrimp';
      const inHand = new RegExp('\\bthe (' + MEATS + ')\\b', 'ig');
      const cooks = new RegExp('^(Brown|Cook|Sear|Fry|Salt|Pound|Simmer|Bake|Boil|Roast|Grill|Poach|Stir|Drain|Heat)\\b[^.]*\\b(' + MEATS + ')\\b', 'i');
      const served = /^(Serve|Portion|Divide|Plate)\b/;
      const faults = (r) => {
        const list = (r.ing || []).join(' ').toLowerCase();
        const out = [];
        (r.steps || []).forEach((step, i) => {
          let m;
          inHand.lastIndex = 0;
          while ((m = inHand.exec(step))) {
            const word = m[1].toLowerCase();
            if (!new RegExp('\\b' + word + '\\b').test(list)) out.push('step ' + (i + 1) + ' speaks of the ' + word + ' and has none');
          }
          const sents = step.split(/(?<=[.!?])\s+/);
          const at = sents.findIndex((t) => served.test(t));
          if (at >= 0 && sents.slice(at + 1).some((t) => cooks.test(t))) out.push('step ' + (i + 1) + ' cooks the meat after serving it');
        });
        return out;
      };
      const real = [];
      window.RECIPES.forEach((r) => faults(r).forEach((f) => real.push(r.no + ' ' + r.name + ' — ' + f)));
      const planted = (step) => faults({ ing: ['4 oz sausage', '3 eggs', 'salt'], steps: [step] }).length > 0;
      return {
        real: real,
        caught: [
          'Cook the sausage until no pink is left. Get the pan hot before the beef goes in.',
          'Drain the chicken and chop it.',
          'Portion into 6 containers. Salt the chicken fifteen minutes ahead.',
          'Serve with salsa. Stir the seasoning into the browned beef.',
        ].filter(planted).length,
        spared: [
          'Get the pan hot before the sausage goes in.',
          'For brown gravy for beef, whisk until it smells like toast.',
          'In tuna, in egg salad, on a sandwich, it does the same job.',
          'Serve over spaghetti. Heat the green beans through and put them on the side.',
          'Ground beef wants 160°F, not the pink middle a steak can have.',
        ].filter(planted).length,
      };
    });
    t.ok('a step that speaks of the meat has that meat on its list, and never cooks it after serving',
      meat.real.length === 0, meat.real.slice(0, 6).join(' | '));
    t.ok('and the meat guard fires on every planted note',
      meat.caught === 4, meat.caught + ' of 4');
    t.ok('and spares a sauce that names what it is for',
      meat.spared === 0, meat.spared + ' false positives');

    /* Variations: another way to make it from what the order carries, said
       under the method rather than inside a step, and never counted. Blake,
       of the sour cream in the waffles: "it was hard for me to see that that
       was even an option." */
    const vary = await p.evaluate(() => {
      const R = window.RECIPES;
      const withV = R.filter((r) => r.vary && r.vary.length);
      return {
        n: withV.length,
        inStep: withV.filter((r) => r.vary.some((v) => r.steps.some((st) => st.indexOf(v.slice(0, 40)) >= 0))).map((r) => r.no),
        pick: withV.length ? withV[0].id : null,
        text: withV.length ? withV[0].vary[0] : '',
      };
    });
    t.ok('the sour-cream swaps are variations, not buried in a step',
      vary.n >= 10 && vary.inStep.length === 0, JSON.stringify(vary));
    if (vary.pick !== null) {
      await p.evaluate((id) => {
        const b = document.createElement('button'); b.setAttribute('data-open', id);
        document.getElementById('grid').appendChild(b); b.click();
      }, vary.pick);
      await p.waitForTimeout(300);
      const shown = await p.evaluate(() => {
        const v = document.querySelector('.sheet .vary');
        const steps = document.querySelector('.sheet .sheet-steps');
        return { h: v ? v.querySelector('.vary-h').textContent : '', t: v ? v.textContent : '',
          after: !!(v && steps && (steps.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING)) };
      });
      t.ok('and the recipe shows them under the method, headed as variations',
        /^Variations?$/.test(shown.h) && shown.t.indexOf(vary.text.slice(0, 30)) >= 0 && shown.after,
        JSON.stringify(shown));
    }

    /* A recipe that makes an ingredient is linked from every line that calls
       for it, whatever section either is in. Blake, on the taco beef with no
       way to his own seasoning beside it on the same shelf: "I need the link
       to my taco seasoning recipe to be a part of this recipe." */
    const links = await p.evaluate(() => {
      /* By id, which never changes. These used to be found by printed number,
         and every recipe added ahead of them in the book moved the number. */
      const M = window.MAKERS;
      return {
        taco: M.taco_seasoning === 337, bread: M.bread === 226, cake: M.cake_baked === 205,
        tacoBeef: 338, seasoning: 337, pops: 214,
      };
    });
    t.ok('taco seasoning, bread and baked cake each have their maker',
      links.taco && links.bread && links.cake, JSON.stringify(links));
    const openSheet = (id) => p.evaluate((i) => {
      const b = document.createElement('button'); b.setAttribute('data-open', i);
      document.getElementById('grid').appendChild(b); b.click();
    }, id);
    await openSheet(links.tacoBeef);
    await p.waitForTimeout(300);
    const beef = await p.evaluate(() => [...document.querySelectorAll('.sheet .ing-make')].map((b) => b.dataset.open));
    t.ok('the taco beef links to the taco seasoning beside it on the same shelf',
      beef.indexOf(String(links.seasoning)) >= 0, JSON.stringify(beef));
    await p.evaluate(() => { const x = document.querySelector('.sheet-x'); if (x) x.click(); });
    await p.waitForTimeout(200);
    await openSheet(links.pops);
    await p.waitForTimeout(300);
    const pops = await p.evaluate(() => [...document.querySelectorAll('.sheet .ing-make')].map((b) => b.dataset.open));
    t.ok('and a chocolate cake is not sent to the yellow one', pops.length === 0, JSON.stringify(pops));

    /* Horchata strains its rice out through a cloth: half of it is counted,
       and the whole cup is still what you buy. */
    const hor = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => x.id === 336);
      const it = r.ingp.find((i) => i.k === 'rice_dry');
      return { pe: it && it.pe, g: it && it.g };
    });
    t.ok('rice blended and strained is counted at half, bought in full',
      hor.pe === 0.5 && hor.g === 185, JSON.stringify(hor));

    await p.context().close();
  },
};
