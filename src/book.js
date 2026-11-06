/* The printed book: covers, title pages, the contents, a section's opener,
 * every recipe page, laid out and fitted to the paper, and the preview that
 * shows it (the same pages tools/print-books.js prints to PDF); and the shelf
 * of ready-made PDFs to download.
 *
 * A part of app.js in a file of its own. app.js calls HiveParts.book(app)
 * once, as it starts, handing over what the book reads of the app's (named
 * just below; tests/scope.test.js holds the two lists to each other) and
 * gets back renderBook, fitPages (the page scale, which the resize handler
 * there calls) and renderDownloads (the downloads, which go grey without
 * signal). RECIPES and BY_ID are replaced, not changed, each time the
 * recipes do, so the book asks for them (recipes(), byId()) rather than
 * keeping the pair it was handed. What a household must go out for is the
 * shelf's (src/shelf.js). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).book = function (app) {
  'use strict';

  // what the book reads of the app's
  var S = app.S;
  var BOOKS = app.BOOKS;
  var ONE_BOOK = app.ONE_BOOK;
  var SEC_NOTE = app.SEC_NOTE;
  var SEC_PART = app.SEC_PART;
  var APP_NAME = app.APP_NAME;
  var APP_LINE = app.APP_LINE;
  var diffLabel = app.diffLabel;
  var fillCounts = app.fillCounts;
  var leaf = app.leaf;
  var liftHTML = app.liftHTML;
  var macroLine = app.macroLine;
  var makerHTML = app.makerHTML;
  var no = app.no;
  var ours = app.ours;
  var planIds = app.planIds;
  var varyHTML = app.varyHTML;
  var xref = app.xref;
  var recipes = app.recipes, byId = app.byId;
  var lineNeedsBuying = window.Shelf.lineNeedsBuying, missingFor = window.Shelf.missingFor;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  function printPool() {
    if (S.printSet === 'one') return recipes().filter(function (r) { return r.book !== 3; });
    if (/^[123]$/.test(S.printSet)) {
      var b = Number(S.printSet);
      return recipes().filter(function (r) { return r.book === b; });
    }
    if (S.printSet === 'fav') return recipes().filter(function (r) { return window.Store.isFav(r.id); });
    if (S.printSet === 'plan') return planIds().map(function (id) { return byId()[id]; }).filter(Boolean);
    return recipes();
  }

  // ---- the pieces a page is built from -----------------------------------
  var YEAR = '2026';
  /* The cover's own year. Roman on a cover and plain everywhere else: the back
     cover and the running furniture are read, and MMXXVI is a thing you look at
     rather than a thing you read. Written out rather than converted, because
     one line a year beats a function nobody will remember exists. */
  var ROMAN_YEAR = 'MMXXVI';
  /* Roman on the cover and the title page, which is what a formal title page
     does with a volume number. Only three of them will ever exist, so a
     numeral-to-roman function would be three lines of arithmetic guarding a
     lookup of three entries. */
  var ORDINAL = { 1: 'I', 2: 'II', 3: 'III' };

  function volumeLine(vol) {
    if (vol.single || vol.grouped || !ORDINAL[vol.book]) return '';
    var of = ours().length ? 'III' : 'II';
    return 'Volume ' + ORDINAL[vol.book] + ' of ' + of;
  }

  /* The skep, drawn once here rather than fetched. icons/hive.svg is the same
     drawing, but it is an icon: it carries the app's paper as a background rect
     and is sized for a 32px tab. This is the printer's version of it — no
     ground, stroked in the book's own accent, and it must not depend on a file
     load, because a cover with a hole in it is worse than a cover with no mark
     at all. The viewBox is cropped to the drawing so the mark can be sized by
     its own height rather than by the padding around it. */
  function skepHTML(px) {
    return '<svg class="skep" width="' + Math.round(px * 332 / 240) + '" height="' + px +
      '" viewBox="90 140 332 240" aria-hidden="true">' +
      '<path d="M136 366c0-152 34-206 120-206s120 54 120 206"/>' +
      '<path d="M192 186q64-26 128 0"/>' +
      '<path d="M164 236q92-32 184 0"/>' +
      '<path d="M148 288q108-32 216 0"/>' +
      '<path d="M104 366h304"/>' +
      '<path class="skep-door" d="M230 366v-22q0-26 26-26t26 26v22z"/>' +
    '</svg>';
  }

  /* A French rule — a heavy line with a hairline beneath it. It is the oldest
     formal device in typesetting and it is doing the work a second typeface
     would otherwise have to do. */
  function fruleHTML() { return '<span class="frule"><i></i><i></i></span>'; }

  /* The code on the back cover. Built by tools/build-qr.js and inlined here, so
     it needs no network at the moment of rendering — the same rule the fonts
     and the engravings follow, and for the same reason: nothing in a printed
     page may depend on somebody else's uptime.

     Absent rather than empty if data/qr.js has not been built. A back cover
     with a hole and a caption pointing at it is worse than one without. */
  function qrHTML() {
    if (!window.APP_QR) return '';
    return '<div class="bc-qr">' +
      '<div class="bc-qr-img">' + window.APP_QR + '</div>' +
      '<div class="bc-qr-line">Every recipe here, on your phone &mdash; with a shopping ' +
        'list that builds itself.</div>' +
      '<div class="bc-qr-cap">Scan to open</div>' +
    '</div>';
  }

  function coverHTML(vol, title, sub, foot) {
    var vl = volumeLine(vol);
    return '<div class="pg"><div class="pg-cover">' +
      '<div class="pg-cover-top">' +
        (vol.single
          /* On the combined edition the title is the series name, so the
             eyebrow cannot also be — it read as a stutter. It says which of
             the three printings you are holding, which is the one thing the
             cover could not otherwise tell you. */
          ? '<div class="pg-eyebrow">Complete in one volume</div>'
          : '<div class="pg-eyebrow">' + esc(APP_NAME) + '</div>' +
            '<div class="pg-eyebrow">' + esc(APP_LINE) + '</div>') +
      '</div>' +
      '<div class="pg-cover-mid">' +
        skepHTML(52) +
        fruleHTML() +
        '<div class="pg-title">' + esc(title) + '</div>' +
        fruleHTML() +
        '<div class="pg-sub">' + esc(sub) + '</div>' +
        (vl ? '<div class="pg-vol">' + esc(vl) + '</div>' : '') +
      '</div>' +
      /* The year rides with the book, not with the volume line. It was gated on
         `vl`, which is empty for the combined edition — so the one cover that
         is not a volume of anything came out with no year on it at all. A week
         of somebody's meal plan still does not want one. */
      '<div class="pg-foot">' + esc(foot) +
        (vol.grouped ? '' : ' &middot; ' + ROMAN_YEAR) + '</div>' +
    '</div></div>';
  }

  /* The right-hand page behind the cover. A cover is a thing you look at; this
     is the page that says what the book is.

     The foot of it used to carry three paragraphs of small print: where the
     ingredients come from, where the macros come from, and what the thing was
     typeset in. All of it was already said properly two pages later, in How to
     read this book, and saying it twice made the second telling sound like an
     apology for the first. One sentence was worse than redundant — it explained
     that the macros were "as recorded for Run and Not Be Weary and worked out
     from the ingredients everywhere else", which is a sentence written from
     outside both volumes and read from inside one of them, where "everywhere
     else" points at nothing you are holding.

     So: the verse the volume is named for, and nothing else. It is the one
     thing on the page that could not be moved somewhere more useful. */
  function titlePageHTML(vol, title, sub, epi) {
    var vl = volumeLine(vol);
    return '<div class="pg"><div class="pg-title-page">' +
      '<div class="tp-top">' +
        '<div class="pg-eyebrow">' + esc(APP_NAME + ' ' + APP_LINE) + '</div>' +
        '<div class="tp-name">' + esc(title) + '</div>' +
        '<div class="tp-sub">' + esc(sub) + '</div>' +
        (vl ? '<div class="tp-vol">' + esc(vl) + '</div>' : '') +
      '</div>' +
      (epi ? '<div class="tp-epi">' +
        '<div class="tp-epi-t">' + epi.t.map(esc).join('<br>') + '</div>' +
        '<div class="tp-epi-r">' + esc(epi.r) + '</div>' +
      '</div>' : '') +
    '</div></div>';
  }

  /* The back cover: what is in this volume, at a glance, so the book can be
     picked off a shelf and put back without opening it. */
  function backCoverHTML(vol, title) {
    var secs = [];
    vol.list.forEach(function (r) {
      var last = secs[secs.length - 1];
      if (last && last.name === r.secName) last.n++;
      else secs.push({ num: r.secNum, name: r.secName, n: 1 });
    });
    var vl = volumeLine(vol);
    var other = vol.book === 1 ? BOOKS[2].name : BOOKS[1].name;
    if (vol.single) secs.forEach(function (x, i) { x.num = i + 1; });

    return '<div class="pg"><div class="pg-back">' +
      '<div class="bc-top">' +
        '<div class="pg-eyebrow">' + esc(APP_NAME + ' ' + APP_LINE) + '</div>' +
        '<div class="bc-name">' + esc(title) + '</div>' +
      '</div>' +
      '<div class="bc-list">' +
        secs.map(function (s) {
          return '<div class="bc-row"><span class="bc-no">' + esc(s.num) + '</span>' +
            '<span class="bc-sec">' + esc(s.name) + '</span>' +
            '<span class="bc-n">' + s.n + '</span></div>';
        }).join('') +
      '</div>' +
      /* Two paragraphs used to sit between the contents and the foot: one
         asserting that every recipe had been checked against the order list and
         against the ratios a kitchen runs on, and one explaining the score. The
         second is said properly in How to read a recipe, four pages in. The
         first is the sound of somebody describing their own work — a back cover
         tells a person what is inside, and "we were careful" is not a thing
         inside.

         What is there instead is the code, which is the same job done honestly:
         it does not describe the book, it hands you the rest of it. The line
         under it is not decoration — a bare QR tells you to scan and not why,
         and nobody scans a code to find out what it was for.

         It goes here rather than on the title page because a title page is
         ceremonial and this is a machine part. That page carries the verse and
         nothing else on purpose. */
      qrHTML() +
      '<div class="bc-foot">' +
        (vol.grouped || vol.single ? '' : '<p>The companion volume is <strong>' + esc(other) + '</strong>.</p>') +
        '<p>' + vol.list.length + (vol.list.length === 1 ? ' recipe' : ' recipes') +
          (vl ? ' &middot; ' + esc(vl) : '') + ' &middot; ' + YEAR + '</p>' +
      '</div>' +
    '</div></div>';
  }

  /* The page where one part becomes the next in the combined edition. Built
     like the section openers it sits among — no folio, centred, quiet — so the
     book has one vocabulary of divider page rather than two. */
  function partHTML(book) {
    return '<div class="pg"><div class="pg-open pg-part"><div class="pg-open-txt">' +
      skepHTML(34) +
      fruleHTML() +
      '<div class="sec-band-n">Part ' + ORDINAL[book] + '</div>' +
      '<div class="pg-open-t">' + esc(BOOKS[book].name).replace(/-/g, '-\u2060') + '</div>' +
      '<div class="pg-open-s">' + esc(SEC_PART[book] || '') + '</div>' +
      fruleHTML() +
    '</div></div></div>';
  }

  // a page with nothing on it, so the sheet count comes out right for folding
  function blankHTML() { return '<div class="pg"></div>'; }

  function bandHTML(r, count, no) {
    return '<div class="sec-band">' +
      '<div class="sec-band-n">Section ' + (no || r.secNum) + '</div>' +
      '<div class="sec-band-t">' + esc(r.secName) + '</div>' +
      '<div class="sec-band-s">' + esc(SEC_NOTE[r.book + '-' + r.secNum] || '') +
        ' · ' + count + (count === 1 ? ' recipe' : ' recipes') + '</div>' +
    '</div>';
  }

  /* Sections find their art by slugifying their own name, so the tie between
     a picture and a section is the section's name rather than a list kept in
     step by hand. Rename a section and its picture follows, or stops being
     found — which is the honest outcome, and visible immediately. */
  function slug(s) {
    return s.toLowerCase().replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function secArt(r) {
    return (window.SECTION_ART || {})[slug(r.secName)] || null;
  }

  /* A section that has a picture opens on a page of its own: the illustration,
     then the same heading the inline band carries, so the two read as the same
     furniture at two sizes. No folio, like the front matter — a page that is
     not part of the numbered run should not claim a number. */
  function openerHTML(r, count, art, no) {
    return '<div class="pg"><div class="pg-open">' +
      '<div class="pg-open-art"><img src="' + esc(art) + '" alt=""></div>' +
      '<div class="pg-open-txt">' +
        '<div class="sec-band-n">Section ' + (no || r.secNum) + '</div>' +
        /* A word joiner after each hyphen, so a compound never splits at its
           own hyphen: balance was setting "Zero-Cook & Grab- / and-Go Fuel",
           which reads as a hyphenation fault rather than a line break. With
           the joiner the only legal breaks are the spaces, and balance picks
           the best of those. */
        '<div class="pg-open-t">' + esc(r.secName).replace(/-/g, '-\u2060') + '</div>' +
        '<div class="pg-rule"></div>' +
        '<div class="pg-open-s">' + esc(SEC_NOTE[r.book + '-' + r.secNum] || '') + '</div>' +
        '<div class="pg-open-n">' + count + (count === 1 ? ' recipe' : ' recipes') + '</div>' +
      '</div>' +
    '</div></div>';
  }

  function recipeHTML(r) {
    return '<div class="rp">' +
      '<div class="rp-top">' +
        '<span class="rp-num">No. ' + no(r) + '</span>' +
        '<span class="rp-meta">' +
          esc(r.servings.split(' (')[0] + ' · ' + r.time + ' · ' + diffLabel(r.diff)) +
          leaf(r.score, 'leaf-print') +
        '</span>' +
      '</div>' +
      '<div class="rp-name">' + esc(r.name) + '</div>' +
      (r.tagline ? '<div class="rp-tag">' + esc(r.tagline) + '</div>' : '') +
      '<div class="rp-cols">' +
        '<div><div class="rp-h">Ingredients</div><div class="rp-ing">' +
          /* Anything not on the shelf is set in the accent the book already
             uses for its numbers and headings, so it is picked out in the list
             itself rather than only named in the line at the foot. Colour is
             not carrying this on its own — the foot still spells the same
             items out in words — so a black-and-white print loses nothing. */
          r.ing.map(function (i, ix) {
            return '<div' + (lineNeedsBuying(r, ix) ? ' class="ing-buy"' : '') + '>' +
              esc(i) + makerHTML(r, ix, false) + '</div>';
          }).join('') +
        '</div></div>' +
        '<div><div class="rp-h">Method</div><div class="rp-steps">' +
          r.steps.map(function (t, i) {
            /* Not a button: this one is the printed page. Paper gets the
               number, which is what a number in a book is for. */
            return '<div class="rp-step"><div class="rp-step-n">' + (i + 1) + '</div>' +
              '<div class="rp-step-t">' + xref(esc(t), false) + '</div></div>';
          }).join('') +
        '</div>' + varyHTML(r, false) + liftHTML(r, false) + '</div>' +
      '</div>' +
      '<div class="rp-foot">' +
        '<span>' + esc(macroLine(r)) + '</span>' +
        /* Recomputed against the pantry rather than read off r.extras, so a
           recipe that was entirely storehouse says so only while that is still
           true — and starts naming what to buy the moment it is not. */
        '<span>' + esc((function () {
          var m = missingFor(r);
          return m.length ? 'Also needs: ' + m.join(', ')
            : (window.Store.pantryChanged() ? 'All on your shelf' : 'All pantry staples');
        })()) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ---- measuring -------------------------------------------------------
     How tall a recipe ends up is a question only the browser can answer —
     it depends on the fonts that actually loaded and where the text wraps.
     So render the blocks offscreen at the exact printed width, read their
     heights, and pack from real numbers rather than guesses. */
  var MEASURE = null;
  function measurer() {
    if (!MEASURE) {
      MEASURE = document.createElement('div');
      // "pg" so it inherits the exact printed width and padding; "no-print"
      // so this scratch element can never turn into a blank sheet of paper
      MEASURE.className = 'pg no-print';
      MEASURE.setAttribute('aria-hidden', 'true');
      MEASURE.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;' +
        'min-height:0;height:auto;box-shadow:none;pointer-events:none';
      document.body.appendChild(MEASURE);
    }
    return MEASURE;
  }

  function measure(items) {
    var m = measurer();
    // each block gets its own wrapper so the ".rp + .rp" separator never
    // applies here — separators are added by the packer instead
    m.innerHTML = '<div class="pg-run"><span>A</span><span class="pg-run-sec">B</span></div>' +
      '<div class="pg-flow">' + items.map(function (it) {
        return '<div>' + it.html + '</div>';
      }).join('') + '</div>' +
      '<div class="pg-fol">1</div>';

    var flow = m.querySelector('.pg-flow');
    for (var i = 0; i < items.length; i++) {
      items[i].h = flow.children[i].getBoundingClientRect().height;
    }

    var runEl = m.querySelector('.pg-run');
    var folEl = m.querySelector('.pg-fol');
    var chrome = runEl.getBoundingClientRect().height +
      parseFloat(getComputedStyle(runEl).marginBottom) +
      folEl.getBoundingClientRect().height +
      parseFloat(getComputedStyle(folEl).paddingTop);

    // read the recipe separator off the stylesheet rather than hardcoding it
    m.innerHTML = '<div class="pg-flow">' + recipeHTML(recipes()[0]) + recipeHTML(recipes()[0]) + '</div>';
    var two = m.querySelector('.pg-flow').children;
    // margin is kept apart from padding+border: only the margin can be widened
    // later to even out a page, the rest is fixed by the rule itself
    var sepMargin = parseFloat(getComputedStyle(two[1]).marginTop);
    var sep = two[1].getBoundingClientRect().height - two[0].getBoundingClientRect().height + sepMargin;

    // and the section band's bottom margin
    m.innerHTML = '<div class="pg-flow">' + bandHTML(recipes()[0], 1) + '</div>';
    var bandGap = parseFloat(getComputedStyle(m.querySelector('.sec-band')).marginBottom);

    m.innerHTML = '';
    return { chrome: chrome, sep: sep, sepMargin: sepMargin, bandGap: bandGap };
  }

  /* Fill each page with as many recipes as genuinely fit. A recipe is never
     split across a page, and a section heading never sits alone at the foot
     of one. */
  function pack(items, avail, m) {
    var pages = [], cur = [], h = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var isBand = it.type === 'band';
      var isHead = isBand || it.type === 'tochead' || it.type === 'fmhead';
      // a recipe following another recipe carries the separator rule
      var lead = (!isHead && cur.length && cur[cur.length - 1].type === 'recipe') ? m.sep : 0;
      var need = it.h + lead + (isBand ? m.bandGap : 0);
      // keep a heading with at least the first entry under it
      if (isHead && items[i + 1]) need += items[i + 1].h;

      if (cur.length && h + need > avail) { pages.push(cur); cur = []; h = 0; lead = 0; need = it.h + (isBand ? m.bandGap : 0); }
      cur.push(it);
      h += it.h + lead + (isBand ? m.bandGap : 0);
    }
    if (cur.length) pages.push(cur);
    return pages;
  }


  /* ---- front matter ----------------------------------------------------
     Reference pages that belong in a book people cook from: how to read a
     recipe, the temperatures that matter, weights and swaps, and the pantry
     the recipes assume. Built as blocks and packed like everything
     else, so a page can never overflow. */
  /* The everyday pantry (2026-11-06): the storehouse order the books were
     written from, with what an ordinary kitchen keeps besides — the spice
     rack, the condiments, broth, cornstarch, cocoa. tools/pantry-cats.js
     STAPLES is the same list as data; this is how it reads on the page. */
  var STAPLES = [
    ['Canned meats', 'Fully cooked beef · Beef stew · Chili · Pork and beans · Tuna · Chicken breast pieces'],
    ['Canned soups', 'Chicken rotini · Cream of chicken · Cream of mushroom · Tomato · Broth'],
    ['Canned fruit', 'Applesauce · Peaches · Pears'],
    ['Canned veg', 'Corn · Green beans · Diced tomatoes · Tomato sauce · Spaghetti sauce'],
    ['Beans, rice, potatoes', 'Black beans · Pinto beans · Great Northern beans · Dry pinto beans · Refried beans · Instant potatoes · Rice'],
    ['Meat', 'Beef franks · Ground beef · Pork sausage · Stewing beef · Beef roast · Chicken breasts · Sliced ham · Pork roast'],
    ['Dairy and eggs', 'Butter · Cheddar · Parmesan · Cottage cheese · Eggs · 2% milk · Sour cream · Vanilla yogurt'],
    ['Fresh', 'Apples · Bananas · Grapes · Oranges · Cucumbers · Lettuce · Bell peppers · Broccoli · Carrots · Garlic · Onions · Potatoes · Tomatoes'],
    ['Flour and pasta', 'White flour · Pancake and waffle mix · Macaroni · Ribbon pasta · Spaghetti · Mac and cheese'],
    ['Cereal', 'Rolled oats · Honey nut o’s · Raisin bran'],
    ['Baking', 'Baking powder · Baking soda · Cornstarch · Cream of tartar · Yeast · Cocoa · Chocolate chips · Evaporated milk · Raisins · Vegetable oil'],
    ['Sugars', 'Brown · Granulated · Powdered'],
    ['Seasonings', 'Salt · Black pepper · Cinnamon · Vanilla · Paprika · Garlic powder · Onion powder · Cumin · Chili powder · Oregano · Thyme · Basil · Ginger · Italian seasoning · Mustard powder · Celery salt · Taco seasoning'],
    ['Condiments', 'Ketchup · Mustard · Mayo · Ranch · Salsa · BBQ sauce · Hot sauce · Soy sauce · Worcestershire · Vinegar · Pickles · Honey · Jams · Peanut butter · Syrup · Black olives'],
    ['Drinks and desserts', 'Non-fat dry milk · Hot cocoa · Gelatin · Puddings · Cake mixes'],
    ['Bread', 'White · Whole wheat · Hamburger buns · Hot dog buns · Tortillas · Breadcrumbs'],
  ];

  function frontMatterItems(vol) {
    var b = [];
    var block = function (html) { b.push({ type: 'fmblock', html: '<div class="fm-block">' + html + '</div>' }); };
    var head = function (html) { b.push({ type: 'fmhead', html: '<div class="fm-block">' + html + '</div>' }); };

    /* Ours needs none of it. Four pages explaining a book you wrote yourself
       would be four pages telling you what you already know. */
    if (vol.book === 3) {
      head('<div class="fm-title">Ours</div>' +
        '<div class="fm-lede">Written at this table rather than carried over.</div>');
      block('<div class="fm-p">These follow the same shape as the two printed volumes — a number, a ' +
        'serving count, a time, an effort and a score out of 100. Calories, sodium, fiber and carbohydrate are worked ' +
        'out from the ingredients using the same table, so a score here means what a score there ' +
        'means.</div>');
      return b;
    }

    head('<div class="fm-title">How to read a recipe</div>' +
      /* Named in full here and on the two covers, and nowhere else. It is the
         ordinary courtesy of a first mention: forty-odd later ones say "the
         storehouse" and read fine, because by then you have been told which.

         "Everything here is built from what the storehouse actually carries"
         is what this said, and it was not true — thirty-eight of Volume One's
         hundred recipes need something the storehouse does not stock, which is
         why every recipe carries a line at its foot saying so. "Actually" was
         arguing with somebody, too. Nobody had said otherwise. */
      '<div class="fm-lede">Built from everyday pantry staples.</div>');
    /* In the book itself, because the book outlives the website and travels
       further than it — a spiral-bound copy on somebody's counter carries no
       footer and no address bar. */
    block('<div class="fm-p fm-fine">This is not an official product of The Church of Jesus ' +
      'Christ of Latter-day Saints and is not affiliated with or endorsed by the Church. It is ' +
      'a family\u2019s own collection.</div>');

    block('<div class="fm-sub">The number</div>' +
      '<div class="fm-p">Every recipe has one, running from 001 straight through both volumes. ' +
      'The contents at the front of each book lists them in order with its page.</div>');

    block('<div class="fm-sub">Effort</div>' +
      '<div class="fm-table">' +
      '<div>Easy</div><div>No real cooking, or one pan and a few minutes.</div>' +
      '<div>Medium</div><div>A hot stove and some timing, but nothing that can go badly wrong.</div>' +
      '<div>In-depth</div><div>An afternoon, or a long slow oven, or a technique worth learning.</div>' +
      '</div>');

    block('<div class="fm-sub">The line under the title</div>' +
      '<div class="fm-p">Servings, time, effort, and a nutrition score out of 100. Six things make it up: ' +
      'how much of the energy comes from protein (27 points, full marks at 45%), how many calories a ' +
      'serving carries (18, full marks up to 300), how much of the energy comes from fat (8, full marks ' +
      'at or below a tenth), how much sodium a serving carries (22, full marks to 300 mg and nothing left ' +
      'by 1,200), how much fiber (13, full marks at 7 g), and how much of the energy is carbohydrate ' +
      'that arrived without any (12).</div>' +
      '<div class="fm-p">That last one is not a carbohydrate count. Oats and frosting are both ' +
      'carbohydrate, and a number that cannot tell them apart is worse than no number. A gram of fiber ' +
      'covers ten grams of carbohydrate — roughly the ratio a whole food comes in — and only what is ' +
      'left over costs anything. A bowl of oats loses nothing; a mug of hot milk and brown sugar loses ' +
      'all twelve.</div>' +
      '<div class="fm-p">Sodium, fiber and carbohydrate are worked out from the ingredients rather than ' +
      'measured, in both volumes. Canned goods carry the salt; that is most of what the sodium figure is ' +
      'telling you.</div>' +
      '<div class="fm-p">It measures one thing only. A high score does not mean a dish is good, and a low ' +
      'one does not mean it is bad — a plate of fudge scores badly and is still fudge. Whether a recipe ' +
      'needs anything beyond the standard order is a separate question, answered on the line at its foot.</div>');

    block('<div class="fm-sub">Also needs</div>' +
      '<div class="fm-p">The line at the foot of each recipe. Either it says everything is on the standard ' +
      'list, or it names exactly what is not, so you know before you start rather than halfway through.</div>' +
      '<div class="fm-sub">Servings</div>' +
      '<div class="fm-p">Written for a household. Halving or doubling most of these is safe; baking is the ' +
      'exception, where the ratios are doing real work.</div>');

    head('<div class="fm-title">Temperatures and doneness</div>' +
      '<div class="fm-lede">Colour is not a reliable guide. A thermometer in the thickest part is.</div>');
    block('<div class="fm-table">' +
      '<div class="fm-key">165°F</div><div>Chicken and turkey, every cut, and anything reheated</div>' +
      '<div class="fm-key">160°F</div><div>Ground beef and ground pork; egg dishes and casseroles</div>' +
      '<div class="fm-key">145°F</div><div>Whole cuts of beef and pork, then rested three minutes</div>' +
      '<div class="fm-key">40–140°F</div><div>The range food should not sit in. Two hours out is the limit.</div>' +
      '</div>');

    block('<div class="fm-warn">Chicken is the one to be careful with. A crisp crust, clear juices or a ' +
      'long time in the oven are not proof it is done — thick breasts under a sauce take far longer than ' +
      'they look. Where a recipe cooks chicken, it says what to check for.</div>' +
      '<div class="fm-sub">Ovens lie</div>' +
      '<div class="fm-p">Most run hot or cold by a good margin. Check five minutes before the stated time ' +
      'the first time you make something, and write the real time in the margin.</div>');

    head('<div class="fm-title">Weights and swaps</div>' +
      '<div class="fm-lede">One cup, level, unpacked unless it says otherwise.</div>');
    block('<div class="fm-table">' +
      '<div class="fm-key">125 g</div><div>Flour, one cup</div>' +
      '<div class="fm-key">200 g</div><div>Granulated sugar, one cup</div>' +
      '<div class="fm-key">220 g</div><div>Brown sugar, one cup, packed</div>' +
      '<div class="fm-key">120 g</div><div>Powdered sugar, one cup</div>' +
      '<div class="fm-key">227 g</div><div>Butter, one cup — two sticks</div>' +
      '<div class="fm-key">80 g</div><div>Rolled oats, one cup</div>' +
      '<div class="fm-key">244 g</div><div>Milk or water, one cup</div>' +
      '<div class="fm-key">7 g</div><div>Yeast, one packet — 2¼ teaspoons</div>' +
      '</div>');

    block('<div class="fm-sub">When you are missing something</div>' +
      '<div class="fm-table">' +
      '<div>Buttermilk</div><div>A cup of milk with a spoonful of vinegar or lemon juice, left ten minutes</div>' +
      '<div>Self-raising flour</div><div>A cup of flour with 1½ teaspoons baking powder and a pinch of salt</div>' +
      '<div>One egg</div><div>In a bake, three tablespoons of applesauce — not in a custard, where the egg is the point</div>' +
      '<div>Cake flour</div><div>A cup of flour with two tablespoons taken out and two of cornstarch put back</div>' +
      '<div>Sour cream</div><div>Plain yogurt, in most things that are not baked</div>' +
      '</div>');

    head('<div class="fm-title">The pantry these recipes assume</div>' +
      '<div class="fm-lede">What an ordinary kitchen keeps. Anything a recipe needs beyond this is named at its foot.</div>');
    // Chunked so it can flow across a page, but the label column is a fixed
    // width in CSS, so every chunk lines up with every other one. Left to size
    // itself, each piece picked its own width and the list looked scattered.
    for (var i = 0; i < STAPLES.length; i += 6) {
      block('<div class="fm-table fm-pantry">' + STAPLES.slice(i, i + 6).map(function (row) {
        return '<div>' + esc(row[0]) + '</div><div>' + esc(row[1]) + '</div>';
      }).join('') + '</div>');
    }

    return b;
  }

  /* ---- contents --------------------------------------------------------
     Built after the recipe pages are packed, so every page number is already
     known. Contents pages carry no folio of their own — like the cover — which
     is what keeps the numbering from shifting as the list grows. */
  function tocHeadHTML(name) {
    return '<div class="toc-head">' + esc(name) + '</div>';
  }
  function tocRowHTML(r, page) {
    return '<div class="toc-row">' +
      '<span class="toc-no">' + no(r) + '</span>' +
      '<span class="toc-name">' + esc(r.name) + '</span>' +
      '<span class="toc-dots"></span>' +
      '<span class="toc-pg">' + page + '</span>' +
    '</div>';
  }

  function buildContents(packed, vol, m, avail) {
    /* Which page each recipe landed on. Counted the same way the folio is —
       skipping openers — or the contents would point a page or eight past
       where the recipe actually is. */
    var pageOf = {}, folio = 0;
    packed.forEach(function (pageItems) {
      if (pageItems.opener) return;
      folio++;
      pageItems.forEach(function (x) { if (x.type === 'recipe') pageOf[x.r.id] = folio; });
    });

    var items = [], lastSec = null;
    vol.list.forEach(function (r) {
      var key = r.book + '-' + r.secNum;
      if (!vol.grouped && key !== lastSec) {
        lastSec = key;
        items.push({ type: 'tochead', html: tocHeadHTML(r.secName) });
      }
      items.push({ type: 'tocrow', html: tocRowHTML(r, pageOf[r.id]) });
    });
    if (!items.length) return [];

    measure(items);
    return pack(items, avail, m).map(function (col) {
      return '<div class="pg">' +
        '<div class="pg-run"><span>' +
          esc(vol.grouped || vol.single ? vol.title : BOOKS[vol.book].name) + '</span>' +
          '<span class="pg-run-sec">Contents</span></div>' +
        '<div class="toc-cols"><div class="toc-col">' +
          col.map(function (x) { return x.html; }).join('') +
        '</div></div>' +
      '</div>';
    });
  }

  function buildBook() {
    var pool = printPool();
    if (!pool.length) return [];
    var grouped = S.printSet === 'fav' || S.printSet === 'plan';

    // "Both books" really means two books — each volume opens on its own
    // cover and is numbered from page one.
    var volumes;
    /* One book, both parts. The two-volume build below is still the default;
       this is the edition you take to a copy shop to be spiral bound, where a
       back cover a third of the way in and a second set of front matter would
       read as a printing fault rather than as two books. */
    if (S.printSet === 'one') {
      volumes = [{ book: 1, list: pool, grouped: false, single: true }];
    } else if (grouped || /^[123]$/.test(S.printSet)) {
      volumes = [{ book: grouped ? 1 : Number(S.printSet), list: pool, grouped: grouped }];
    } else {
      volumes = [1, 2, 3].map(function (b) {
        return { book: b, list: pool.filter(function (r) { return r.book === b; }), grouped: false };
      }).filter(function (v) { return v.list.length; });
    }

    var out = [];
    volumes.forEach(function (vol) {
      /* Runs, not one flat list. A section with a picture opens on its own
         page, and everything after it therefore starts on a fresh page too —
         so its recipes are packed on their own rather than continuing from
         the tail of the previous section. Sections without a picture keep the
         inline band and flow on as before, which is what keeps a volume with
         no art rendering exactly as it did.

         The cost is real and worth naming: a section boundary that used to be
         a rule mid-page is now a page break, so the tail of the last page of
         every section is given up. That is the price of an opener, and it is
         paid in paper. */
      var items = [];
      var runs = [{ opener: null, items: [] }];
      var lastSec = null, lastBook = null;
      /* In the combined edition the sections are numbered straight through:
         Volume Two's "Section 1" would otherwise appear on page 60 of a book
         that already had one. Built up front so a section knows its number
         wherever it is printed — band, opener and contents all read it here. */
      var secNo = {}, running = 0;
      vol.list.forEach(function (r) {
        var k = r.book + '-' + r.secNum;
        if (secNo[k] === undefined) secNo[k] = vol.single ? ++running : r.secNum;
      });
      vol.list.forEach(function (r) {
        var key = r.book + '-' + r.secNum;
        /* Where the parts turn. The volume covers cannot be reused — they say
           "Volume I of II" and name a companion — so the join gets a page of
           its own that says what it is. */
        if (vol.single && r.book !== lastBook) {
          lastBook = r.book;
          runs.push({ opener: partHTML(r.book), items: [] });
        }
        if (!vol.grouped && key !== lastSec) {
          lastSec = key;
          var n = vol.list.filter(function (x) { return x.book === r.book && x.secNum === r.secNum; }).length;
          var art = secArt(r);
          var no = secNo[key];
          if (art) {
            runs.push({ opener: openerHTML(r, n, art, no), items: [] });
          } else {
            var band = { type: 'band', html: bandHTML(r, n, no), r: r };
            runs[runs.length - 1].items.push(band);
            items.push(band);
          }
        }
        var rec = { type: 'recipe', html: recipeHTML(r), r: r };
        runs[runs.length - 1].items.push(rec);
        items.push(rec);
      });
      runs = runs.filter(function (run) { return run.opener || run.items.length; });

      var m = measure(items);
      // a couple of pixels of slack absorbs any rounding between screen and print
      var avail = 7.5 * 96 - m.chrome - 4;

      /* An opener page joins the packed run as an empty page carrying its HTML
         on the side. Empty so that everything walking these pages to find
         where a recipe landed — the contents, in particular — steps over it
         without needing to know it exists; present so that it still takes up
         a leaf and the folio after it counts correctly. It prints no number
         itself, the way a section opening does in any book. */
      var packed = [];
      runs.forEach(function (run) {
        if (run.opener) {
          var page = [];
          page.opener = run.opener;
          packed.push(page);
        }
        pack(run.items, avail, m).forEach(function (p) { packed.push(p); });
      });

      var title = vol.single ? ONE_BOOK.name
        : vol.grouped ? (S.printSet === 'fav' ? 'Favorites' : 'This Week')
        : BOOKS[vol.book].name;
      vol.title = title;
      /* Counted off vol.list rather than the whole collection, because that is
         what this cover is the cover of. Printing Volume One alone and
         printing it as half of the combined edition are different books with
         different numbers on them, and the sentence should say the one it is
         on. */
      var sub = fillCounts(vol.single ? ONE_BOOK.blurb
        : vol.grouped ? (S.printSet === 'fav' ? 'The ones worth keeping.' : 'The week’s cooking, in order.')
        : BOOKS[vol.book].blurb, vol.list);
      var volStart = out.length;
      out.push({ kind: 'cover', html: coverHTML(vol, title, sub,
        vol.list.length + (vol.list.length === 1 ? ' recipe' : ' recipes')) });
      out.push({ kind: 'title', html: titlePageHTML(vol, title, sub,
        vol.single ? ONE_BOOK.epigraph : vol.grouped ? null : BOOKS[vol.book].epigraph) });

      if (!vol.grouped) {
        var fm = frontMatterItems(vol);
        measure(fm);
        pack(fm, avail, m).forEach(function (col) {
          out.push({ kind: 'front', html: '<div class="pg">' +
            '<div class="pg-run"><span>' + esc(vol.single ? ONE_BOOK.name : BOOKS[vol.book].name) + '</span>' +
              '<span class="pg-run-sec">Before you start</span></div>' +
            '<div class="toc-cols"><div class="toc-col">' +
              col.map(function (x) { return x.html; }).join('') +
            '</div></div>' +
          '</div>' });
        });
      }

      // worth a contents page once a volume is long enough to need flipping
      if (vol.list.length >= 12) {
        buildContents(packed, vol, m, avail).forEach(function (html) {
          out.push({ kind: 'contents', html: html });
        });
      }

      /* Openers sit outside the numbering, the way the front matter does. They
         are real leaves and a reader turns past them, but they neither carry a
         number nor advance one — otherwise a volume whose first section has a
         picture would open on an unnumbered leaf and its first printed folio
         would be 2, leaving a book with no page one in it. */
      var folio = 0;
      packed.forEach(function (pageItems) {
        if (pageItems.opener) { out.push({ kind: 'open', html: pageItems.opener }); return; }
        var idx = folio++;

        var first = pageItems.filter(function (x) { return x.r; })[0];
        var sec = first ? first.r.secName : '';

        /* A section whose first recipe fills most of a page on its own leaves
           the heading with nowhere to go: 71 points of heading and a 639-point
           recipe will not share 666 points of page, and no amount of packing
           changes that. Rather than strand a small heading at the top of an
           otherwise blank page, give the section a title page and let it look
           like it was meant. Three sections need one, all of them long-recipe
           ones. */
        if (pageItems.length === 1 && pageItems[0].type === 'band') {
          out.push({
            kind: 'page',
            html: '<div class="pg"><div class="pg-flow sec-open">' + pageItems[0].html + '</div>' +
              '<div class="pg-fol">' + (idx + 1) + '</div></div>'
          });
          return;
        }

        /* Share whatever room is left over between the recipes instead of
           leaving it all in a heap at the foot of the page. Capped, because a
           page holding two recipes has room to spare and pushing them apart
           by all of it would look worse than the gap it fixes. */
        var used = 0, gaps = 0;
        pageItems.forEach(function (x, i) {
          used += x.h;
          if (x.type === 'band') used += m.bandGap;
          else if (i && pageItems[i - 1].type === 'recipe') { used += m.sep; gaps++; }
        });
        var extra = gaps ? Math.max(0, Math.min(28, (avail - used) / gaps)) : 0;

        var body = pageItems.map(function (x, i) {
          if (extra && x.type === 'recipe' && i && pageItems[i - 1].type === 'recipe') {
            return x.html.replace('<div class="rp">',
              '<div class="rp" style="margin-top:' + (m.sepMargin + extra).toFixed(1) + 'px">');
          }
          return x.html;
        }).join('');

        out.push({
          kind: 'page',
          html: '<div class="pg">' +
            '<div class="pg-run"><span>' +
              esc(vol.grouped ? title : BOOKS[first ? first.r.book : vol.book].name) + '</span>' +
              '<span class="pg-run-sec">' + esc(sec) + '</span></div>' +
            '<div class="pg-flow">' + body + '</div>' +
            '<div class="pg-fol">' + (idx + 1) + '</div>' +
          '</div>'
        });
      });

      /* A folded booklet is made of sheets, and a sheet is four pages. Pad with
         blanks so the last one comes out whole — otherwise the printer either
         adds the blanks itself, wherever it likes, or refuses the file. The
         back cover goes last, so the padding sits in front of it, which is
         where a blank page in a book belongs. */
      var sofar = out.length - volStart + 1;              // + the back cover
      for (var pad = (4 - (sofar % 4)) % 4; pad > 0; pad--) {
        out.push({ kind: 'blank', html: blankHTML() });
      }
      out.push({ kind: 'back', html: backCoverHTML(vol, title) });
    });
    return out;
  }

  /* The last word on whether a page fits.
   *
   * The packer works from measured heights and is right about them, but it can
   * be handed something it cannot solve: two of the 271 recipes are taller on
   * their own than a page's text area. There is nowhere to move them to, so the
   * packer put them on a page and the printed page — which is a fixed 7.5in with
   * overflow hidden — quietly ate the difference. What went was the page number,
   * and the bottom margin with it. On screen it never showed, because a screen
   * page is min-height and simply grows.
   *
   * So: after the pages are in the document, measure each one against the paper
   * and set the overrun ones very slightly smaller until they fit. Two or three
   * percent, on two pages in a hundred and forty-two. Re-measured each time
   * rather than calculated, because shrinking type re-wraps it and the height
   * does not fall in proportion.
   */
  /* The gap left on this sheet, measured the way the loop below measures it. */
  function roomFor(pg, flow) {
    var PAPER = 7.5 * 96;
    var pgTop = pg.getBoundingClientRect().top + parseFloat(getComputedStyle(pg).paddingTop);
    var below = 0, seen = false;
    Array.prototype.forEach.call(pg.children, function (c) {
      if (c === flow || c.contains(flow)) { seen = true; return; }
      if (seen) below += c.getBoundingClientRect().height;
    });
    return (pgTop + PAPER) - flow.getBoundingClientRect().top - below;
  }

  function fitToPaper() {
    var PAPER = 7.5 * 96;
    var squeezed = [];
    var over = [];
    /* Measure at true size. On a narrow screen .pg carries
       transform: scale(var(--pgscale)), and getBoundingClientRect reports the
       transformed box — so every page measured smaller than it is against a
       PAPER constant that is not scaled, and nothing was ever found to
       overrun. The first render escaped it because --pgscale is not set until
       afterwards; every render after that was measuring a phantom. The same
       trap is already noted one rule above .pg.no-print in the stylesheet,
       where it was caught for the packer and missed here. */
    var root = document.documentElement;
    var hadScale = root.style.getPropertyValue('--pgscale');
    root.style.setProperty('--pgscale', '1');
    void root.offsetHeight;
    Array.prototype.forEach.call($('pages').querySelectorAll('.pg'), function (pg, i) {
      /* Whatever this page's content lives in — a run of recipes, a cover, a
         title page, a back cover. Any of them can be handed more than fits. */
      var flow = pg.querySelector('.pg-flow, .pg-back, .pg-title-page, .pg-cover');
      if (!flow) return;
      /* A recipe alone on its page and still too tall for it is first set
         with its method running on under the ingredients (.rp-run in the
         stylesheet says why), which recovers the half-empty column beside a
         long method. Shrinking is for whatever that does not rescue. */
      var lone = flow.classList.contains('pg-flow') && flow.querySelectorAll('.rp').length === 1 &&
        flow.querySelector('.rp');
      if (lone && flow.getBoundingClientRect().height > roomFor(pg, flow) + 0.5) lone.classList.add('rp-run');
      var z = 1;
      for (var tries = 0; tries < 5; tries++) {
        /* Measure the gap rather than adding up the parts: getBoundingClientRect
           leaves margins out, and the running head's 15px bottom margin is
           exactly the sort of thing that makes a page overflow by a hair. */
        var pgTop = pg.getBoundingClientRect().top + parseFloat(getComputedStyle(pg).paddingTop);
        // the folio's own box already includes its padding; do not count it twice
        // anything below the content, such as the folio, is not room
        var below = 0, seen = false;
        Array.prototype.forEach.call(pg.children, function (c) {
          if (c === flow || c.contains(flow)) { seen = true; return; }
          if (seen) below += c.getBoundingClientRect().height;
        });
        var room = (pgTop + PAPER) - flow.getBoundingClientRect().top - below;
        /* The rendered box, not scrollHeight: scrollHeight is in the element's
           own coordinates and does not shrink when zoom does, so each pass
           thought nothing had happened and shrank it again. */
        var h = flow.getBoundingClientRect().height;
        if (h <= room) break;
        if (z <= 0.85) { break; }   // the floor; shrinking further is unreadable
        z = Math.max(0.85, z * ((room / h) - 0.004));
        flow.style.zoom = z;
      }
      if (z !== 1) squeezed.push({ page: i + 1, zoom: Math.round(z * 1000) / 1000 });
      /* Past the floor and still too tall. The slot clips with overflow:hidden,
         so this used to leave the bottom of a recipe off the paper with nothing
         to show for it — you found out at the stove, from a method that stops
         mid-sentence. Say so where somebody is about to press print. */
      if (flow.getBoundingClientRect().height > roomFor(pg, flow) + 0.5) {
        over.push(i + 1);
      }
    });
    if (hadScale) root.style.setProperty('--pgscale', hadScale);
    else root.style.removeProperty('--pgscale');
    if (squeezed.length && window.console) {
      console.log('set slightly smaller to fit the page: ' +
        squeezed.map(function (s) { return 'p' + s.page + ' at ' + s.zoom; }).join(', '));
    }
    return { squeezed: squeezed, over: over };
  }

  function renderBook() {
    var t0 = performance.now();
    var pages = buildBook();
    var pool = printPool();
    renderDownloads();
    /* How many recipes, and how much paper. It used to also report the average
       recipes a page, which is a number that came out of the packer rather than
       a number anyone standing at a printer needs. */
    $('printNote').textContent = pool.length
      ? pool.length + (pool.length === 1 ? ' recipe · ' : ' recipes · ') +
        pages.length + ' pages at 5.5″ × 8.5″'
      : 'Nothing to print yet.';
    /* Each sheet is labelled on screen with where it falls in the run. The
       preview scrolls under a sticky header that is a fifth of a phone screen
       tall, so the top of every page slides out of sight as you reach it, and
       a book with no visible page numbers gives a reader no way to tell a page
       break from something that has been cut off. Saying "Sheet 7 of 104"
       above the paper answers that without changing the paper.

       .no-print, because it is scaffolding around the book and not part of
       it. */
    var total = pages.length;
    $('pages').innerHTML = pages.map(function (p, i) {
      return '<div class="pgslot-wrap">' +
        '<div class="pglabel no-print">Sheet ' + (i + 1) + ' of ' + total + '</div>' +
        '<div class="pgslot">' + p.html + '</div>' +
      '</div>';
    }).join('');
    var fitted = fitToPaper();
    /* Appended rather than folded into the line above, because the fitting can
       only run once the pages are on screen and the line is written before
       that. A page past the floor is clipped by the slot's overflow:hidden, so
       without this the foot of a recipe simply is not there — found at the
       stove, in a method that stops mid-sentence. */
    if (fitted.over.length) {
      $('printNote').textContent += ' · too long for the sheet on page ' +
        fitted.over.join(', ') + ' — the foot of it will not print';
    }
    fitPages();
    if (window.console && performance.now() - t0 > 1200) {
      console.log('book render took ' + Math.round(performance.now() - t0) + 'ms');
    }
  }

  /* How tall the header is, for anything that has to sit under it.
   *
   * CSS cannot ask another element for its height, so the section dividers
   * carried the answer as a number: top: 56px. That was a guess at one
   * viewport and wrong at all of them — 60 on a laptop, so four pixels of the
   * divider hid behind the header, and 94 on a phone, where the brand and the
   * tabs stack, so the divider pinned nearly forty pixels underneath and was
   * simply invisible. It read as a feature that had not been built for
   * mobile.
   *
   * Measured on load and on every resize, which is also when it changes: the
   * only thing that alters the header's height is the width it has. */

  /* A 5.5in page is wider than a phone. Scale it down to fit rather than
     letting the whole document scroll sideways. Printing ignores this. */
  function fitPages() {
    var avail = document.documentElement.clientWidth - 32;
    var pageW = 5.5 * 96;
    var scale = window.innerWidth <= 860 ? Math.min(1, avail / pageW) : 1;
    document.documentElement.style.setProperty('--pgscale', String(scale));
  }

  function expandAndPrint() { window.print(); }

  /* The books are rendered to PDF ahead of time by tools/print-books.js and
     shipped with the app, so getting a printable file is a download rather than
     an argument with the print dialog about paper size, margins, headers and
     scaling. The dialog is still there for the selections that cannot be made
     ahead of time — your favorites, this week, and recipes of your own. */
  var READY_MADE = {
    all: { file: 'Both-Books.pdf', label: 'Both books', pages: 324 },
    one: { file: 'Nourish-and-Strengthen-Recipes.pdf', label: 'One book', pages: 316 },
    1: { file: 'Run-and-Not-Be-Weary.pdf', label: 'Run and Not Be Weary', pages: 116, booklet: true },
    2: { file: 'Around-the-Table.pdf', label: 'Around the Table', pages: 208, booklet: true }
  };

  /* The shelf, in the order somebody chooses from it: the whole thing first,
     then the two volumes, then the two you assemble yourself. */
  var PRINT_CARDS = [
    { set: 'all', what: 'Both books', sub: 'Two booklets' },
    { set: 'one', what: 'Everything in one', sub: 'One spine' },
    { set: '1', what: 'Run and Not Be Weary', sub: 'Volume One' },
    { set: '2', what: 'Around the Table', sub: 'Volume Two' },
  ];

  /* And the three that are not books.
   *
   * These were cards on the shelf beside the covers, at the same size and with
   * the same weight, and they were the worst thing on the screen: a numeral in
   * a dashed box reads as a picture that failed to load, and "Pick to print"
   * next to "Nothing picked yet" is two different dead states side by side.
   * They are not books and should not be book-shaped. A line of text under the
   * shelf says what they are and costs nothing. */
  var PRINT_PICKED = [
    { set: 'fav', what: 'Favorites' },
    { set: 'plan', what: null },
    { set: '3', what: 'Ours' }
  ];

  function renderDownloads() {
    /* The ready-made files were rendered from the printed collection and know
       nothing about a recipe somebody wrote last week or a printed one they
       corrected. The preview counts those in, so the two disagree silently —
       a preview saying 168 pages over a button offering 160, and whoever
       pressed it got a book without their own recipes in it and no word about
       why. Said once, under the shelf, rather than on every cover. */
    var own = Object.keys(window.Store.state.mine || {}).length +
      Object.keys(window.Store.state.edits || {}).length;
    var mine = Object.keys(window.Store.state.mine || {}).length;
    var favs = recipes().filter(function (x) { return window.Store.isFav(x.id); }).length;
    /* planIds(), not planCount() — planCount takes a week id and answers 0 for
       undefined, so the card said "Nothing picked yet" over a week with
       recipes in it. */
    var week = planIds().length;
    /* The files are not in the offline cache, by design (sw.js leaves
       print/ to the network), and a tap on one with no signal did nothing at
       all. Said on the button; a tap says it again (below). */
    var away = navigator.onLine === false ? '<span class="bk-off"><span class="sr-only">, </span>needs signal</span>' : '';

    $('printRows').innerHTML = PRINT_CARDS.map(function (c) {
      var r = READY_MADE[c.set];
      if (!r) return '';
      var on = S.printSet === c.set;

      /* The cover shows it; the button under it hands it over.
       *
       * The card was the download to begin with — one tap, one file — and that
       * is a tap that does something irreversible-looking to somebody who only
       * wanted a closer look. Picking a book and taking it are two different
       * intentions, so they are two different controls: the cover selects, the
       * preview below redraws, and the button says what you get. */
      return '<div class="bk-slot">' +
        '<button type="button" class="bk-card' + (on ? ' on' : '') + '"' +
        ' data-print="' + esc(c.set) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="bk-face">' +
          '<img class="bk-cover" src="art/covers/' + esc(c.set) + '.webp" alt="" loading="lazy">' +
        '</span>' +
        '<span class="bk-what">' + esc(c.what) + '</span>' +
        '<span class="bk-sub">' + esc(c.sub) + '</span>' +
      '</button>' +
      '<a class="bk-get" download href="print/' + esc(r.file) + '" data-get="' + esc(c.set) + '">' +
        'PDF &middot; ' + r.pages + ' pages' + away + '</a>' +
      /* The folded version hangs below: a second thing to do with the same
         book, wanted by far fewer people. */
      (r.booklet
        ? '<a class="bk-fold" download href="print/' +
            esc(r.file.replace(/\.pdf$/, '-booklet.pdf')) + '" data-fold="' + esc(c.set) + '" ' +
            'title="Two pages to a sheet, in folding order — print double-sided, fold, staple">' +
            'fold &amp; staple &middot; ' + (r.pages / 4) + away + '</a>'
        : '') +
      '</div>';
    }).join('');

    /* The picked sets: one line, no covers. Each says how many are in it, so
       the count that used to be a numeral in a box is still there — as a fact
       in a sentence rather than as a picture of nothing. */
    $('printPicked').innerHTML = PRINT_PICKED.map(function (c) {
      if (c.set === '3' && !mine) return '';
      var n = c.set === 'fav' ? favs : c.set === 'plan' ? week : mine;
      var what = c.what === null ? window.Store.activeWeek().name : c.what;
      var on = S.printSet === c.set;
      return '<button type="button" class="pk' + (on ? ' on' : '') + '"' +
        ' data-print="' + esc(c.set) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
        (c.set === 'plan' ? ' id="printPlan"' : '') +
        (c.set === '3' ? ' id="printOurs"' : '') + '>' +
        esc(what) + '<span class="pk-n">' + n + '</span></button>';
    }).join('') +
      /* The dialog is the only way to get these, and it prints whatever is laid
         out below — so it appears once the set is chosen, not before. Offering
         it beside an unchosen set would print the wrong book onto real paper. */
      (READY_MADE[S.printSet] ? '' :
        '<button type="button" class="ghost pk-go" id="doPrint">Print&hellip;</button>');

    $('dlOwn').classList.toggle('hide', !own);
    if (own) {
      $('dlOwn').textContent = 'The covers are the published books. The ' + own +
        (own === 1 ? ' recipe you have written or corrected is' :
                     ' recipes you have written or corrected are') +
        ' not in them — use Ours or Favorites below to print a copy that has them.';
    }

    /* Only where it makes sense to offer. Somebody printing this week's plan
       is printing four pages for the fridge, and being asked fifty dollars for
       a bound book at that moment reads as not paying attention. */
    $('orderBook').classList.toggle('hide', !READY_MADE[S.printSet]);
    var dp = $('doPrint');
    if (dp) dp.addEventListener('click', expandAndPrint);
  }

  return { renderBook: renderBook, fitPages: fitPages, renderDownloads: renderDownloads };
};
