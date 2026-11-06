/* Browsing, filtering, sorting, searching, and the recipe panel. */

module.exports = {
  name: 'Browse',
  async run(t) {
    const p = await t.fresh();
    await p.click('.tab[data-view="browse"]');   // the app opens on Today; these are Recipes' tests
    await p.waitForTimeout(200);

    const n = await p.evaluate(() => document.querySelectorAll('.card').length);
    /* However many there are, not a number written down here. It has been
       corrected by hand four times — 257, 263, 266, 271 — every time for
       having an old copy of the answer rather than because the page was
       wrong. */
    const total = await p.evaluate(() => window.RECIPES.length);
    t.ok('every recipe in the collection is on the page', n === total, n + ' of ' + total);

    /* The head says what you are looking at. The volume blurbs were written for
       the printed covers and used only there, so for a long while the app named
       the two books and never said what either one was — you had to pick one to
       find out whether it was the one you wanted. */
    const blurb = () => p.textContent('#browseBlurb');
    t.ok('the collection says what the two volumes are',
      /Run and Not Be Weary/.test(await blurb()) && /Around the Table/.test(await blurb()),
      await blurb());

    // filters
    await p.click('[data-book="1"]');
    await p.waitForTimeout(150);
    /* However many Volume One holds. Written down as 100 it went red the day
       six recipes moved into it, while the thing it describes — that picking a
       volume shows that volume and nothing else — still held exactly. */
    t.ok('one volume at a time',
      await p.evaluate(() => document.querySelectorAll('.card').length ===
        window.RECIPES.filter((r) => r.book === 1).length),
      await p.evaluate(() => document.querySelectorAll('.card').length + ' of ' +
        window.RECIPES.filter((r) => r.book === 1).length));
    t.ok('and picking one says what that one is',
      /protein, fiber/.test(await blurb()), await blurb());

    /* The number in the sentence, against the number of recipes there are.
     *
     * Both volume blurbs opened with a count typed out in words, and both were
     * wrong: "One hundred recipes" over a hundred and eleven, "One hundred
     * sixty-six" over a hundred and sixty. Nothing caught it because nothing
     * read the sentence — and the same sentence is printed on the cover and
     * the title page of the book, so the stale number went to a print shop.
     *
     * The blurbs hold a token now and the collection fills it in, which is
     * what this checks: not that it says a hundred and eleven, but that
     * whatever it says is what is actually there. */
    const WORDS = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
      nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
      fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
      twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
      eighty: 80, ninety: 90, a: 1,
    };
    const counts = (w) => w === 'hundred' || w === 'and' ||
      w.split('-').every((x) => WORDS[x] !== undefined);
    // the leading run of number words: "One hundred and eleven recipes..." -> 111
    const said = (line) => {
      let n = 0, part = 0;
      for (const raw of line.split(/[\s ]+/)) {
        const w = raw.toLowerCase().replace(/[^a-z-]/g, '');
        if (!w || !counts(w)) break;
        if (w === 'and') continue;
        if (w === 'hundred') { n += (part || 1) * 100; part = 0; continue; }
        w.split('-').forEach((x) => { part += WORDS[x]; });
      }
      return n + part;
    };

    for (const book of ['1', '2']) {
      await p.click('[data-book="' + book + '"]');
      await p.waitForTimeout(150);
      const line = await blurb();
      const real = await p.evaluate((b) => window.RECIPES.filter((r) => r.book === Number(b)).length, book);
      t.ok('volume ' + book + ' counts itself right in its own blurb',
        said(line) === real, said(line) + ' said, ' + real + ' there — "' + line.slice(0, 60) + '"');
      /* The app says staples; the printed cover says the storehouse. */
      t.ok('volume ' + book + ' blurb in the app is about staples, with no stray capitals',
        /staples that keep/.test(line) && !/Bishops|Storehouse/.test(line), line.slice(0, 90));
      const printed = await p.evaluate((b) => window.__bookBlurbs[b], book);
      /* Since 2026-11-06 the printed books are built from pantry staples too:
         Blake moved the app away from the bishops' storehouse. */
      t.ok('volume ' + book + ' printed blurb says pantry staples, not the storehouse',
        /pantry staples/.test(printed) && !/storehouse|bishop/i.test(printed), printed.slice(0, 90));
    }
    await p.click('[data-book="1"]');
    await p.waitForTimeout(150);

    /* ---- section dividers down the grid ----
     *
     * Two hundred and seventy-seven cards, and in book order they are also
     * fourteen sections that mean something. None of it was on the page: a
     * card says RUN · 042 and nothing said why 042 sits between 041 and 043,
     * so scrolling the collection was scrolling a wall.
     *
     * The part worth protecting is when they are *absent*. Sorted by score or
     * by time the recipes are not in sections any more, and a divider over
     * that order would be a claim about the cards under it that is not true. */
    await p.click('[data-book="all"]');
    await p.selectOption('#sortSel', 'book');
    await p.waitForTimeout(300);
    const divs = async () => p.evaluate(() => {
      const out = [];
      let sec = null;
      [...document.querySelectorAll('#grid > *')].forEach((el) => {
        if (el.classList.contains('grid-sec')) {
          sec = { name: el.querySelector('b').textContent,
            says: Number(el.querySelector('.grid-sec-n').textContent), cards: 0 };
          out.push(sec);
        } else if (sec) { sec.cards++; }
      });
      return out;
    });
    const inOrder = await divs();
    const realSecs = await p.evaluate(() => new Set(
      window.RECIPES.filter((r) => r.book !== 3).map((r) => r.book + '-' + r.secNum)).size);
    t.ok('book order puts a divider at the head of every section',
      inOrder.length === realSecs, inOrder.length + ' dividers for ' + realSecs + ' sections');
    t.ok('and each one counts the cards actually under it',
      inOrder.length > 0 && inOrder.every((d) => d.says === d.cards),
      JSON.stringify(inOrder.filter((d) => d.says !== d.cards)));

    for (const [why, act] of [
      ['sorted by score', async () => { await p.selectOption('#sortSel', 'healthy'); }],
      ['searching', async () => { await p.selectOption('#sortSel', 'book'); await p.fill('#search', 'chicken'); }],
    ]) {
      await act();
      await p.waitForTimeout(450);
      t.ok('and none while ' + why + ', where the order is no longer sections',
        (await divs()).length === 0, why);
    }
    await p.fill('#search', '');
    await p.selectOption('#sortSel', 'book');
    await p.waitForTimeout(400);

    /* Once you have typed a dish name the heading is no longer about a book,
       and a paragraph about the volumes sits between you and the answer. */
    await p.fill('#search', 'chicken'); await p.waitForTimeout(400);
    t.ok('but a search puts the line away', (await blurb()) === '', await blurb());
    await p.fill('#search', ''); await p.waitForTimeout(400);

    await p.click('[data-book="all"]');
    await p.selectOption('#diffSel', 'In-Depth');
    await p.waitForTimeout(150);
    // effort is not printed on the card, so check the recipes behind the cards
    const hard = await p.evaluate(() => {
      const shown = [...document.querySelectorAll('.card')].map((c) => c.dataset.open);
      const by = {}; window.RECIPES.forEach((r) => { by[r.id] = r; });
      return shown.length && shown.every((id) => by[id].diff === 'In-Depth');
    });
    t.ok('effort filters to what it says', hard);
    await p.selectOption('#diffSel', 'all');

    /* The three words on this filter follow your pantry, the way the line at
       the foot of every recipe already does. Before, they described the
       storehouse whatever you did — and "Needs pantry extras" meant the exact
       opposite of the Pantry tab one tab away. */
    const filterWords = () => p.evaluate(() =>
      [...document.querySelectorAll('#pantrySel option')].map((o) => o.textContent));
    t.ok('the filter talks about your staples until you change your shelf',
      (await filterWords()).join('|') === 'Everything|Just my staples|Needs a shop',
      (await filterWords()).join(' | '));
    await p.evaluate(() => window.Store.setPantry('cottage_cheese', false));
    await p.waitForTimeout(400);
    t.ok('and about your shelf once you have one',
      (await filterWords()).join('|') === "Everything|Only what's on my shelf|Needs a shop",
      (await filterWords()).join(' | '));
    await p.evaluate(() => window.Store.resetPantry());
    await p.waitForTimeout(400);

    await p.selectOption('#pantrySel', 'base');
    await p.waitForTimeout(150);
    const onlyBase = await p.evaluate(() =>
      [...document.querySelectorAll('.card')].every((c) => !/Also needs/.test(c.textContent)));
    t.ok('storehouse-only really is storehouse-only', onlyBase);
    await p.selectOption('#pantrySel', 'all');

    // sorting
    await p.selectOption('#sortSel', 'healthy');
    await p.waitForTimeout(200);
    const scores = await p.evaluate(() =>
      [...document.querySelectorAll('.leaf-n')].slice(0, 12).map((e) => parseInt(e.textContent, 10)));
    t.ok('healthiest first really is descending',
      scores.every((s, i) => i === 0 || scores[i - 1] >= s), scores.join(','));

    await p.selectOption('#sortSel', 'quick');
    await p.waitForTimeout(200);
    const first = await p.textContent('.card-meta');
    t.ok('quickest first starts at the quickest', /^[1-5] mins?\b/.test(first), first);
    await p.selectOption('#sortSel', 'book');

    // search covers names, ingredients and sections
    await p.fill('#search', 'buttermilk');
    await p.waitForTimeout(200);
    const found = await p.evaluate(() => document.querySelectorAll('.card').length);
    t.ok('search reaches into the ingredients', found > 0 && found < 20, found);
    await p.fill('#search', '');

    // favorites survive a reload
    await p.click('#grid .card >> nth=1');
    await p.click('[data-fav]');
    await p.waitForTimeout(200);
    await p.click('.sheet-x');
    await p.reload();
    await p.waitForTimeout(400);
    t.ok('a favorite sticks', (await p.textContent('#favCount')) === '(1)', await p.textContent('#favCount'));

    // the panel: scaling the ingredients, and the score breakdown
    await p.click('#grid .card >> nth=0');
    const before = await p.textContent('.sheet-ing');
    await p.click('[data-scale="up"]');
    const after = await p.textContent('.sheet-ing');
    t.ok('doubling changes the ingredients', before !== after);
    t.ok('and reads as fractions, not decimals', !/\d\.\d/.test(after), after.slice(0, 80));

    const panel = await p.textContent('.sheet');
    const bands = await p.evaluate(() => {
      const seen = {};
      document.querySelectorAll('.leaf').forEach((l) => {
        const n = parseInt(l.querySelector('.leaf-n').textContent, 10);
        const b = l.className.match(/leaf-(good|ok|low)/)[1];
        seen[b] = seen[b] || [];
        if (seen[b].length < 40) seen[b].push(n);
      });
      return seen;
    });
    t.ok('every score sits in a leaf, banded by what it says',
      (bands.good || []).every((n) => n >= 70) &&
      (bands.ok || []).every((n) => n >= 45 && n < 70) &&
      (bands.low || []).every((n) => n < 45),
      JSON.stringify(Object.keys(bands).map((k) => k + ':' + bands[k].length)));

    /* Shut, this panel is a score and a line of figures. No chart: a bar you
       have to decode is not a summary, and every version that tried to be both
       ended up taller than the recipe it belonged to. */
    const nut = await p.evaluate(() => {
      const foot = document.querySelector('.nut-foot');
      return {
        charts: document.querySelectorAll('.nut-track, .nut-slot, .why-bar').length,
        named: document.querySelectorAll('.why-part').length,
        /* scrollWidth is no use here: a wrapped flex row still fits its box.
           Count the distinct tops instead. */
        footRows: new Set([...foot.children].map((c) =>
          Math.round(c.getBoundingClientRect().top))).size,
        height: Math.round(document.querySelector('.nut').getBoundingClientRect().height),
        ask: document.querySelector('.nut-ask').textContent.trim(),
      };
    });

    t.ok('shut, the panel is the score and the figures and nothing else',
      nut.charts === 0 && nut.named === 0 && nut.ask === 'Why this score?',
      JSON.stringify(nut));

    t.ok('the macro line holds one row without wrapping',
      nut.footRows === 1, nut.footRows + ' rows');

    /* The complaint that produced this shape: on a two-step recipe the panel
       was taller than the recipe. */
    t.ok('and the whole panel stays out of the recipe\u2019s way',
      nut.height < 100, nut.height + 'px tall');

    // pressing the leaf is what answers, which is the whole idea
    await p.click('.nut-leaf');
    await p.waitForTimeout(200);
    const open = await p.evaluate(() => {
      const score = Number(document.querySelector('.leaf-n').textContent);
      const parts = [...document.querySelectorAll('.why-part')].map((w) => ({
        name: w.querySelector('b').textContent,
        fact: w.querySelector('.why-fact').textContent,
        pts: w.querySelector('.why-pts').textContent,
        fill: parseFloat(w.querySelector('.why-bar i').style.width),
        cut: w.querySelector('.why-fact').scrollWidth >
             w.querySelector('.why-fact').clientWidth + 1,
      }));
      return {
        score, parts,
        head: document.querySelector('.why-head').textContent,
        expanded: document.querySelector('.nut-leaf').getAttribute('aria-expanded'),
        ask: document.querySelector('.nut-ask').textContent.trim(),
      };
    });

    /* One row per part the scorer actually has, not a list of names written
       down here. The score gained a sixth part and this went red for holding
       yesterday's answer while the panel it describes was perfectly correct —
       the same way eight other assertions have broken in two days. What the
       row is called is the panel's business; that there is one for every part
       and none left over is this test's. */
    const partCount = await p.evaluate(() => Object.keys(window.Nutrition.MAX).length);
    t.ok('pressing the leaf explains the score part by part',
      open.parts.length === partCount && open.parts.every((w) => w.name),
      open.parts.length + ' rows for ' + partCount + ' parts: ' +
      JSON.stringify(open.parts.map((w) => w.name)));

    t.ok('with the recipe\u2019s own figure behind each one',
      open.parts.every((w) => /\d/.test(w.fact)) && !open.parts.some((w) => w.cut),
      JSON.stringify(open.parts.map((w) => w.fact)));

    /* Every track is the same length and fills by the share of that part's
       points earned, so the five can be read straight down the column. */
    t.ok('and a bar that matches the points it claims',
      open.parts.every((w) => {
        const [got, max] = w.pts.split('/').map(Number);
        return Math.abs(w.fill - (max ? got / max * 100 : 0)) < 0.5;
      }), JSON.stringify(open.parts.map((w) => w.pts + ' -> ' + w.fill + '%')));

    t.ok('the points add up to the number in the leaf',
      Math.abs(open.parts.reduce((n, w) => n + Number(w.pts.split('/')[0]), 0) - open.score) < 1.5 &&
      open.head === 'Why ' + open.score + ' out of 100',
      open.head);

    t.ok('and it says it is open to a screen reader as well',
      open.expanded === 'true' && open.ask === 'Hide the breakdown',
      open.expanded + ' / ' + open.ask);

    await p.click('.nut-ask');
    await p.waitForTimeout(200);
    t.ok('it shuts again',
      (await p.evaluate(() => document.querySelectorAll('.why-part').length)) === 0);

    // a different recipe starts shut, rather than inheriting the last one
    await p.click('.sheet-x');
    await p.waitForTimeout(150);
    await p.click('#grid .card >> nth=2');
    await p.waitForTimeout(250);
    t.ok('and every recipe opens on the score, not the audit',
      (await p.evaluate(() => document.querySelectorAll('.why-part').length)) === 0);

    /* Save and Edit spelled out took enough of the row that the week wrapped
       onto a second line on a phone, which reads as two groups of days. */
    const acts = await p.evaluate(() => ({
      icons: [...document.querySelectorAll('.iconbtn')].map((b) => b.getAttribute('aria-label')),
      dayRows: new Set([...document.querySelectorAll('.daybtn')]
        .map((b) => Math.round(b.getBoundingClientRect().top))).size,
      days: document.querySelectorAll('.daybtn').length,
    }));
    t.ok('the week sits on one line, with a star and a pencil beside it',
      acts.dayRows === 1 && acts.days === 7 && acts.icons.length === 2 &&
      /favorites$/.test(acts.icons[0]) && /^Edit/.test(acts.icons[1]),
      JSON.stringify(acts));

    /* ---- a title may not promise what the recipe has not got -------------
     *
     * A reader opened No. 084, "Protein Cocoa Slurry with Rice Crisp", and
     * asked where the rice crisp was. There was none: whey, cocoa, two
     * tablespoons of water, and no step that could have held any. Three more
     * read the same way — buttermilk pancakes made with milk, marshmallow
     * cocoa cups containing cinnamon, a rotini casserole made with ribbon
     * pasta.
     *
     * The check is that every food named in a title turns up somewhere in the
     * recipe. The allowlist below is the honest part of it: these are flavour
     * names rather than ingredient claims — a Mac & Cheese is a dish, banana
     * bread oatmeal tastes of banana bread, and Zero-Sugar promises the
     * absence of the thing it names. Anything not on this list that goes
     * missing is the fault above, coming back.
     */
    const FLAVOUR_NAMES = [
      'mac', 'cheese', 'bread', 'sugar', 'pb', 'fruit', 'pasta', 'rice',
      'scrambled eggs', 'fresh fruit', 'cinnamon sugar', 'pepper', 'oats',
      'hamburger buns', 'mashed potatoes', 'rotini', 'bbq sauce', 'buttermilk',
      'marshmallow', 'rice crisp',
    ];
    const promises = await p.evaluate((allow) => {
      const vocab = new Set();
      Object.keys(window.PANTRY || {}).forEach((k) => {
        vocab.add(k.replace(/_/g, ' '));
        if (window.PANTRY[k].l) vocab.add(String(window.PANTRY[k].l).toLowerCase());
      });
      const skip = new Set(allow);
      /* A recipe other recipes point at is named for its output, wherever it
         is shelved. The six taco recipes say "{r:337} makes taco seasoning",
         and 337 is a recipe called Taco Seasoning whose list is seven spices
         — listing taco seasoning would be the actual mistake. It sits on the
         Copycat Shelf because its spices are off the order, which the Made,
         Not Bought guard rightly refuses, so the shelf exemption below could
         not reach it. The cross-reference is the reason that does. */
      const madeFor = new Set();
      window.RECIPES.forEach((r) => {
        (r.steps || []).forEach((st) => {
          String(st).replace(/\{r:(\d+)\}/g, (m, id) => { madeFor.add(Number(id)); return m; });
        });
      });
      const bad = [];
      window.RECIPES.forEach((r) => {
        /* Made, Not Bought is the one section named for its output rather than
           its input. "Breadcrumbs, Dry or Soft" is made of bread and salt, and
           a recipe for breadcrumbs that listed breadcrumbs would be the actual
           mistake. Exempted by the section it is in rather than by adding each
           new one to the list of allowed words above — the section is the
           reason, and a reason holds for the next one too. */
        if (r.secName === 'Made, Not Bought') return;
        if (madeFor.has(r.id)) return;
        /* A recipe that declares what it makes is named for that output, the
           same reason as the two above: "Guacamole" is made of avocados, and
           a guacamole recipe listing guacamole would be the mistake. */
        if (r.makes && r.makes.length) return;
        const body = (r.ing.join(' ') + ' ' + r.steps.join(' ') + ' ' +
          (r.extras || '')).toLowerCase();
        const words = r.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
        const missing = [];
        words.forEach((w, i) => {
          const two = i + 1 < words.length ? w + ' ' + words[i + 1] : null;
          [w, two].forEach((cand) => {
            if (!cand || skip.has(cand) || !vocab.has(cand)) return;
            if (body.indexOf(cand) < 0) missing.push(cand);
          });
        });
        if (missing.length) bad.push((r.no || r.id) + ' ' + r.name + ' → ' + missing.join(', '));
      });
      return bad;
    }, FLAVOUR_NAMES);
    t.ok('no title promises an ingredient the recipe has not got',
      promises.length === 0, promises.slice(0, 6).join(' | '));

    /* ---- every section is labelled, and every label is a section ---------
     *
     * The names in the filter are a hand-kept list keyed by book and section
     * number — the part that moves. Six recipes left Around the Table's
     * section 9 for Volume One, Made, Not Bought slid up from 10 to fill the
     * gap, and the list did not follow: filtering on "Warm Drinks" returned
     * three sauces, under a heading for a section that no longer existed.
     *
     * Both directions matter. A section with no entry falls back to its full
     * printed name, which is merely ugly; an entry for a section that has gone
     * is the one that lies, because the number it is keyed by has been given
     * to something else in the meantime.
     */
    const labels = await p.evaluate(() => {
      const real = new Set(window.RECIPES.filter((r) => r.book !== 3)
        .map((r) => r.book + '-' + r.secNum));
      const short = Object.keys(window.__secShort || {});
      const note = Object.keys(window.__secNote || {});
      return {
        orphanShort: short.filter((k) => !real.has(k)),
        orphanNote: note.filter((k) => !real.has(k)),
        unlabelled: [...real].filter((k) => short.indexOf(k) < 0),
        undescribed: [...real].filter((k) => note.indexOf(k) < 0),
      };
    });
    t.ok('every section in the books has a short name and a note',
      labels.unlabelled.length === 0 && labels.undescribed.length === 0,
      'no name: ' + labels.unlabelled.join(' ') + ' | no note: ' + labels.undescribed.join(' '));
    t.ok('and no name is left pointing at a section that has gone',
      labels.orphanShort.length === 0 && labels.orphanNote.length === 0,
      'orphans: ' + labels.orphanShort.concat(labels.orphanNote).join(' '));

    await p.context().close();

    /* A desk is the easy case. The panel is read on a phone, where the macro
       line has 242px next to the leaf \u2014 so check the widest of all 266 there,
       not just whichever recipe happens to be first. */
    const phone = await t.fresh({ viewport: { width: 376, height: 860 } });
    await phone.click('.tab[data-view="browse"]');
    await phone.waitForTimeout(200);

    /* The section divider pins under the header, on the width where it did
     * not.
     *
     * It carried its offset as a number — top: 56px — which was a guess at one
     * viewport and wrong at every one. The header is 60 tall on a laptop, so
     * four pixels of the divider hid behind it; on a phone the brand and the
     * tabs stack and it is 94, so the divider pinned nearly forty pixels
     * *underneath* the header and could not be seen at all. It looked exactly
     * like a feature that had not been built for mobile, which is how it was
     * reported.
     *
     * Checked against the header's real bottom edge rather than against a
     * number, because a number is what caused this. The earlier version of
     * this check asked only whether something was pinned near the top, and
     * passed the whole time it was invisible. */
    await phone.evaluate(() => window.scrollTo(0, 2500));
    await phone.waitForTimeout(400);
    /* The edge is the strip's, not the header's, once the page has scrolled:
       the strip that follows you down sits under the header and the divider
       parks under the strip. Measured off the strip's real bottom edge for
       the same reason as before — a number is what caused this. */
    const pinned = await phone.evaluate(() => {
      const bar = document.querySelector('.topbar').getBoundingClientRect();
      const strip = document.querySelector('.brw-strip-in').getBoundingClientRect();
      const up = document.getElementById('view-browse').classList.contains('stripped');
      const edge = up ? strip.bottom : bar.bottom;
      const secs = [...document.querySelectorAll('.grid-sec')].map((e) => e.getBoundingClientRect());
      const stuck = secs.filter((r) => r.top >= edge - 1 && r.top < edge + 3);
      return { barBottom: Math.round(bar.bottom), stripUp: up, edge: Math.round(edge), stuck: stuck.length,
        hidden: secs.filter((r) => r.bottom > 0 && r.top < edge - 1).length };
    });
    t.ok('a section divider pins flush under the strip on a phone',
      pinned.stripUp && pinned.stuck === 1, JSON.stringify(pinned));
    t.ok('and none of them is left sitting behind the header or the strip',
      pinned.hidden === 0, JSON.stringify(pinned));
    await phone.evaluate(() => window.scrollTo(0, 0));
    await phone.waitForTimeout(300);

    await phone.click('#grid .card >> nth=0');
    await phone.waitForTimeout(200);
    const wide = await phone.evaluate(() => {
      const foot = document.querySelector('.nut-foot');
      const rows = () => new Set([...foot.children]
        .map((c) => Math.round(c.getBoundingClientRect().top))).size;
      const bad = [];
      window.RECIPES.forEach((r) => {
        if (r.score === null || !r.macro) return;
        const m = r.macro;
        foot.innerHTML = [m.kcal + ' kcal', Math.round(m.p) + 'g P', Math.round(m.c) + 'g C',
          Math.round(m.f) + 'g F', m.na + 'mg S', (m.fib < 1 ? m.fib : Math.round(m.fib)) + 'g Fib']
          .map((x) => '<span>' + x + '</span>').join('<i>&middot;</i>');
        if (rows() > 1) bad.push(r.name);
      });
      return bad;
    });
    t.ok('on a phone it holds one row for every recipe in the collection',
      wide.length === 0, wide.length + ' wrap, e.g. ' + wide.slice(0, 3).join('; '));

    await phone.evaluate(() => document.querySelector('.nut-leaf').click());
    await phone.waitForTimeout(250);
    const openPhone = await phone.evaluate(() => ({
      parts: document.querySelectorAll('.why-part').length,
      cut: [...document.querySelectorAll('.why-fact')]
        .filter((f) => f.scrollWidth > f.clientWidth + 1).length,
      dayRows: new Set([...document.querySelectorAll('.daybtn')]
        .map((b) => Math.round(b.getBoundingClientRect().top))).size,
    }));
    const phoneParts = await phone.evaluate(() => Object.keys(window.Nutrition.MAX).length);
    t.ok('and on a phone the breakdown reads in full, week still on one line',
      openPhone.parts === phoneParts && openPhone.cut === 0 && openPhone.dayRows === 1,
      JSON.stringify(openPhone) + ' for ' + phoneParts + ' parts');

    await phone.context().close();

    /* The one search row.
     *
     * There were two boxes — one in the filter bar, one on a strip that
     * appeared once the bar had scrolled away — and on a phone they could sit
     * one above the other. Blake: "two of the same rows to search here..
     * why?" One box now, pinned under the header from the first pixel; what
     * comes and goes is the Filters button beside it, which appears once the
     * bar has scrolled out of reach and unfolds the real bar in place. */
    {
      const sp = await t.fresh({ viewport: { width: 390, height: 780 } });
      await sp.click('.tab[data-view="browse"]');
      await sp.waitForTimeout(200);
      const on = () => sp.evaluate(() => document.getElementById('view-browse').classList.contains('stripped'));
      const filt = () => sp.evaluate(() => { const b = document.getElementById('filtBtn'); return !!b && b.offsetParent !== null; });
      t.ok('there is exactly one search box on Recipes',
        await sp.evaluate(() => document.querySelectorAll('#view-browse input[type="search"]').length === 1));
      /* At the top the row sits in the flow — under the share hint on a first
         visit — with no Filters button yet: the bar is right there below it. */
      t.ok('at the top it is on screen with no Filters button beside it yet',
        await sp.evaluate(() => {
          const s = document.querySelector('.brw-strip').getBoundingClientRect();
          return s.top >= 0 && s.bottom <= window.innerHeight;
        }) && !(await on()) && !(await filt()));
      await sp.evaluate(() => window.scrollTo(0, 1600));
      await sp.waitForTimeout(150);
      t.ok('scroll the filter bar away and the row is still there, now with Filters',
        await sp.evaluate(() => {
          const s = document.querySelector('.brw-strip').getBoundingClientRect(), h = document.querySelector('.topbar').getBoundingClientRect();
          return Math.abs(s.top - h.bottom) <= 1;
        }) && (await on()) && (await filt()));
      /* Where a divider parks, against where the header ends: it must clear the
         row, or the row covers the one line that says where you are. */
      const park = await sp.evaluate(() => {
        const s = document.querySelector('.grid-sec'), tb = document.querySelector('.topbar');
        return Math.round(parseFloat(getComputedStyle(s).top) - tb.getBoundingClientRect().height);
      });
      t.ok('and the section dividers park under it rather than behind it', park >= 44, park + 'px below the header');

      await sp.fill('#search', 'chicken');
      await sp.waitForTimeout(200);
      const hits = await sp.evaluate(() => document.querySelectorAll('.card').length);
      t.ok('typing in it searches the collection', hits > 0 && hits < 100, hits + ' cards');
      /* One card is not enough page to scroll: the page is back at the top,
         and the box being typed into is exactly where it was. */
      await sp.fill('#search', 'horchata');
      await sp.waitForTimeout(200);
      const one = await sp.evaluate(() => ({ cards: document.querySelectorAll('.card').length,
        focused: document.activeElement === document.getElementById('search'),
        visible: document.getElementById('search').offsetParent !== null }));
      t.ok('a search that leaves one card keeps the box under your thumb',
        one.cards === 1 && one.focused && one.visible, JSON.stringify(one));
      await sp.fill('#search', '');
      await sp.waitForTimeout(200);

      await sp.evaluate(() => window.scrollTo(0, 1600));
      await sp.waitForTimeout(150);
      await sp.click('#filtBtn');
      await sp.waitForTimeout(100);
      const popped = () => sp.evaluate(() => document.querySelector('#view-browse .filters').classList.contains('pop') &&
        !document.getElementById('brwScrim').classList.contains('hide'));
      t.ok('the Filters button unfolds the real filter bar in place', await popped());
      t.ok('under the search row, not over it',
        await sp.evaluate(() => {
          const bar = document.querySelector('#view-browse .filters').getBoundingClientRect();
          const row = document.querySelector('.brw-strip').getBoundingClientRect();
          return bar.top >= row.bottom - 1;
        }));
      await sp.selectOption('#diffSel', 'Easy');
      await sp.waitForTimeout(200);
      const easy = await sp.evaluate(() => {
        const shown = [...document.querySelectorAll('.card')].map((c) => c.dataset.open);
        const by = {}; window.RECIPES.forEach((r) => { by[r.id] = r; });
        return shown.length && shown.every((id) => by[id].diff === 'Easy');
      });
      t.ok('and a filter picked there is the same filter', easy);
      t.ok('the button counts what is on', (await sp.textContent('#filtCount')) === '1', await sp.textContent('#filtCount'));
      await sp.click('#filtersDone');
      await sp.waitForTimeout(100);
      t.ok('Done folds it away', !(await popped()));
      await sp.selectOption('#diffSel', 'all');
      await sp.waitForTimeout(200);

      await sp.evaluate(() => window.scrollTo(0, 1600));
      await sp.waitForTimeout(150);
      await sp.click('#filtBtn');
      await sp.waitForTimeout(100);
      await sp.click('.tab[data-view="plan"]');
      await sp.waitForTimeout(150);
      t.ok('leaving Recipes puts the bar and the button away', !(await popped()) && !(await on()));
      await sp.context().close();
    }
  },
};
