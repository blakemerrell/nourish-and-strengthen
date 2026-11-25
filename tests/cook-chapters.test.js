/* Cook > Recipes: Option 1 Visual Cookbook Chapters (16 engravings, By book / By meal,
 * Saved shelf, drill-in hero, Search & quick-chip escape, Browse all 365, 320px, Dark, Ours). */

module.exports = {
  name: 'Cook chapters: visual cookbook chapters, engravings, drill-in, Saved shelf, 320px & dark',
  async run(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 412, height: 915 } });
    p.on('pageerror', (e) => errs.push(e.message));

    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(250);

    /* 1. Landing state: 17 chapters (16 illustrated + Wilberg's monogram) summing to all recipes, zero recipe cards, no Saved shelf */
    const land = await p.evaluate(() => {
      const chaps = [...document.querySelectorAll('#grid .chap-card')];
      const counts = chaps.map((c) => Number((c.querySelector('.chap-cnt') || {}).textContent || 0));
      const imgs = [...document.querySelectorAll('#grid img.chap-art')];
      return {
        chaps: chaps.length,
        sum: counts.reduce((a, b) => a + b, 0),
        total: window.RECIPES.length,
        cards: document.querySelectorAll('#grid .card').length,
        savedSec: !!document.querySelector('.chap-saved-sec'),
        imgs: imgs.length,
        countText: document.getElementById('browseCount').textContent,
        firstTop: chaps[0] ? Math.round(chaps[0].getBoundingClientRect().top) : 9999,
      };
    });
    t.ok('Cook > Recipes lands on 17 Visual Cookbook Chapters summing to all recipes with no card wall',
      land.chaps === 17 && land.sum === land.total && land.cards === 0 && !land.savedSec &&
      land.imgs === 16 && /17 chapters/.test(land.countText), JSON.stringify(land));

    /* Scroll down so lazy-loaded engravings load too, then verify every chapter art loaded cleanly */
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(400);
    await p.evaluate(async () => {
      const imgs = [...document.querySelectorAll('#grid img.chap-art')];
      await Promise.all(imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 2000);
        });
      }));
    });
    const artLoaded = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('#grid img.chap-art')];
      return { total: imgs.length, ok: imgs.filter((i) => i.complete && i.naturalWidth > 0).length };
    });
    t.ok('all 16 section engravings load with naturalWidth > 0',
      artLoaded.total === 16 && artLoaded.ok === 16, JSON.stringify(artLoaded));
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(150);

    /* 2. By book / By meal grouping toggle + reload persistence */
    await p.click('#grid [data-chapgrp="meal"]');
    await p.waitForTimeout(150);
    const byMeal = await p.evaluate(() => ({
      headings: [...document.querySelectorAll('#grid .chap-sec .chap-grp-hd h2')].map((h) => h.textContent),
      chaps: document.querySelectorAll('#grid .chap-card').length,
      pressed: document.querySelector('#grid [data-chapgrp="meal"]').getAttribute('aria-pressed'),
    }));
    t.ok('By meal regroups the 17 chapters into 4 meal-time sections',
      byMeal.chaps === 17 && byMeal.pressed === 'true' &&
      byMeal.headings.join('|') === 'Mornings & Drinks|Lunches & Dinners|Snacks & Batch Prep|Sweets & Pantry Crafts',
      JSON.stringify(byMeal));

    await p.reload();
    await p.waitForTimeout(500);
    t.ok('By meal grouping preference survives a reload',
      await p.evaluate(() => document.querySelector('#grid [data-chapgrp="meal"]').getAttribute('aria-pressed') === 'true'));
    await p.click('#grid [data-chapgrp="book"]');
    await p.waitForTimeout(150);

    /* 3. Chapter drill-in -> hero engraving + synced #secSel + All chapters back */
    await p.click('#grid [data-chap^="2-3-"]');
    await p.waitForTimeout(200);
    const drill = await p.evaluate(() => ({
      hero: !!document.querySelector('#grid .chap-hero'),
      title: (document.querySelector('#grid .chap-hero-title') || {}).textContent,
      thumbOk: !!(document.querySelector('#grid .chap-thumb img') && document.querySelector('#grid .chap-thumb img').naturalWidth > 0),
      cards: document.querySelectorAll('#grid .card').length,
      expected: window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).length,
      secVal: document.getElementById('secSel').value,
      scrollY: Math.round(window.scrollY),
    }));
    t.ok('tapping a chapter opens its drill-in hero and only its own recipes',
      drill.hero && drill.title === 'Weeknight Dinners' && drill.thumbOk &&
      drill.cards === drill.expected && /^2-3-/.test(drill.secVal) && drill.scrollY === 0,
      JSON.stringify(drill));

    const drillLayout = await p.evaluate(() => {
      const cells = [...document.querySelectorAll('#grid .card-cell')].slice(0, 8);
      const subs = cells.map((c) => c.querySelector('.card-sub')).filter(Boolean);
      const adds = cells.map((c) => c.querySelector('.card-add')).filter(Boolean);
      const avgH = cells.reduce((s, c) => s + c.getBoundingClientRect().height, 0) / Math.max(1, cells.length);
      return {
        avgH: Math.round(avgH),
        hasLeaf: cells.every((c) => !!c.querySelector('.leaf')),
        maxSubH: Math.max(...subs.map((s) => Math.round(s.getBoundingClientRect().height))),
        minAddH: Math.min(...adds.map((a) => Math.round(a.getBoundingClientRect().height))),
        sorts: document.querySelectorAll('#grid .chap-sort').length,
      };
    });
    t.ok('chapter rows stay compact 2-line items with leaf score and >=44px + buttons',
      drillLayout.avgH < 105 && drillLayout.hasLeaf && drillLayout.maxSubH <= 24 &&
      drillLayout.minAddH >= 44 && drillLayout.sorts === 3, JSON.stringify(drillLayout));

    await p.click('#grid [data-chapsort="protein"]');
    await p.waitForTimeout(150);
    const proSorted = await p.evaluate(() => {
      const byId = {};
      window.RECIPES.forEach((r) => { byId[r.id] = r; });
      const ps = [...document.querySelectorAll('#grid .card')].slice(0, 8)
        .map((c) => (byId[Number(c.dataset.open)] || {}).macro ? byId[Number(c.dataset.open)].macro.p : 0);
      return { ps, desc: ps.every((v, i) => i === 0 || ps[i - 1] >= v) };
    });
    await p.click('#grid [data-chapsort="healthy"]');
    await p.waitForTimeout(150);
    const scSorted = await p.evaluate(() => {
      const sc = [...document.querySelectorAll('#grid .leaf-n')].slice(0, 8).map((e) => parseInt(e.textContent, 10));
      return { sc, desc: sc.every((v, i) => i === 0 || sc[i - 1] >= v) };
    });
    t.ok('inline Protein and Score sort pills reorder the chapter immediately',
      proSorted.desc && scSorted.desc, JSON.stringify({ proSorted, scSorted }));

    /* Star a recipe inside the chapter, then return to Chapters to verify Saved shelf (also resets sort) */
    await p.click('#grid .card >> nth=0');
    await p.waitForTimeout(200);
    await p.click('[data-fav]');
    await p.waitForTimeout(150);
    await p.click('.sheet-x');
    await p.waitForTimeout(150);
    await p.click('#grid [data-chapback="1"]');
    await p.waitForTimeout(200);

    const saved = await p.evaluate(() => {
      const sec = document.querySelector('#grid .chap-saved-sec');
      const cell = sec && sec.querySelector('.chap-saved-cell');
      const card = cell && cell.querySelector('button.chap-saved-card');
      const add = cell && cell.querySelector('button.card-add');
      const chaps = document.querySelectorAll('#grid .chap-card').length;
      const secVal = document.getElementById('secSel').value;
      return {
        hasSaved: !!sec,
        cards: cell ? 1 : 0,
        siblingBtn: !!(card && add && !card.contains(add)),
        chaps,
        secVal,
      };
    });
    t.ok('returning via All chapters shows the 17-chapter grid again and surfaces Saved recipes in their own shelf with sibling + button',
      saved.hasSaved && saved.cards === 1 && saved.siblingBtn && saved.chaps === 17 && saved.secVal === 'all',
      JSON.stringify(saved));

    /* Tapping + on a Saved shelf recipe opens quick-plan sheet */
    await p.click('#grid .chap-saved-cell button.card-add');
    await p.waitForTimeout(150);
    t.ok('tapping + on the Saved shelf opens This week quick-plan sheet',
      await p.evaluate(() => !!document.querySelector('#cookRoot [role="dialog"]')));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);

    /* 4. Quick chips / search escape chapters immediately; All chip restores chapters */
    await p.click('#cookChips [data-qchip="protein"]');
    await p.waitForTimeout(150);
    t.ok('tapping High protein switches straight to matching recipe cards',
      await p.evaluate(() => document.querySelectorAll('#grid .chap-card').length === 0 &&
        document.querySelectorAll('#grid .card').length > 0));
    await p.click('#cookChips [data-qchip="all"]');
    await p.waitForTimeout(150);
    t.ok('tapping All chip returns to the 17-chapter grid',
      await p.evaluate(() => document.querySelectorAll('#grid .chap-card').length === 17 &&
        document.querySelectorAll('#grid .card').length === 0));

    /* 5. Browse all footer escape & < Chapters back */
    await p.click('#grid [data-browseall="1"]');
    await p.waitForTimeout(200);
    const allView = await p.evaluate(() => ({
      cards: document.querySelectorAll('#grid .card').length,
      total: window.RECIPES.length,
      divs: document.querySelectorAll('#grid .grid-sec').length,
      back: !!document.querySelector('#grid [data-chapback="1"]'),
      chaps: document.querySelectorAll('#grid .chap-card').length,
    }));
    t.ok('Browse all shows the full recipe grid with sticky dividers and < Chapters back button',
      allView.cards === allView.total && allView.divs === 17 && allView.back && allView.chaps === 0, JSON.stringify(allView));
    await p.click('#grid [data-chapback="1"]');
    await p.waitForTimeout(150);
    t.ok('clicking < Chapters returns to the 17-chapter grid',
      await p.evaluate(() => document.querySelectorAll('#grid .chap-card').length === 17));

    /* 6. Custom recipe (Book 3 Ours) gets an Ours chapter card without broken image */
    await p.click('#newRecipe');
    await p.waitForSelector('.ed-sheet');
    await p.fill('#edName', 'Grandpa Skillet Eggs');
    await p.fill('#edIng', '4 eggs');
    await p.fill('#edSteps', 'Cook in skillet.');
    await p.click('[data-ed="save"]');
    await p.waitForTimeout(300);
    await p.click('.sheet-x');
    await p.waitForTimeout(200);
    const ours = await p.evaluate(() => {
      const tile = [...document.querySelectorAll('#grid .chap-card')].find((c) => /Ours/.test(c.textContent));
      return {
        totalChaps: document.querySelectorAll('#grid .chap-card').length,
        hasOurs: !!tile,
        hasMono: !!(tile && tile.querySelector('.chap-art-mono')),
        hasImg: !!(tile && tile.querySelector('img')),
      };
    });
    t.ok('writing a custom recipe adds an Ours chapter tile with monogram fallback',
      ours.totalChaps === 18 && ours.hasOurs && ours.hasMono && !ours.hasImg, JSON.stringify(ours));

    /* 7. Narrow phone (320px) overflow & 44px touch targets + Dark theme */
    await p.setViewportSize({ width: 320, height: 640 });
    await p.waitForTimeout(200);
    const mobile = await p.evaluate(() => {
      const btns = [...document.querySelectorAll('#grid [data-chapgrp], #grid [data-browseall]')];
      const cards = [...document.querySelectorAll('#grid .chap-card')];
      const topRow = cards.slice(0, 2).map((c) => Math.round(c.getBoundingClientRect().top));
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        twoCols: topRow.length === 2 && Math.abs(topRow[0] - topRow[1]) <= 2,
        minBtnH: Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().height))),
        minCardH: Math.min(...cards.map((c) => Math.round(c.getBoundingClientRect().height))),
      };
    });
    t.ok('at 320px wide, chapters stay 2-column with 0px horizontal overflow and >=44px controls',
      mobile.overflow <= 1 && mobile.twoCols && mobile.minBtnH >= 44 && mobile.minCardH >= 44, JSON.stringify(mobile));
    await p.context().close();

    /* Dark theme check */
    const dctx = await t.browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const dp = await dctx.newPage();
    dp.on('pageerror', (e) => errs.push('dark: ' + e.message));
    await dp.goto(t.base + 'index.html#recipes');
    await dp.waitForTimeout(400);
    const dark = await dp.evaluate(() => {
      const card = document.querySelector('#grid .chap-card');
      const art = document.querySelector('#grid img.chap-art');
      return {
        cardBg: card ? getComputedStyle(card).backgroundColor : '',
        blend: art ? getComputedStyle(art).mixBlendMode : '',
      };
    });
    const okDark = dark.blend === 'screen' && !!dark.cardBg;
    t.ok('dark mode screens chapter engravings seamlessly onto the warm dark card palette',
      okDark, JSON.stringify(dark));

    await dp.setViewportSize({ width: 320, height: 640 });
    await dp.click('#grid [data-chap^="1-1-"]');
    await dp.waitForTimeout(200);
    const drill320 = await dp.evaluate(() => {
      const sorts = [...document.querySelectorAll('#grid .chap-sort, #grid .chap-back, #grid .card-add')];
      const cell = document.querySelector('#grid .card-cell');
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        minBtnH: Math.min(...sorts.map((b) => Math.round(b.getBoundingClientRect().height))),
        nameFontPx: cell ? parseFloat(getComputedStyle(cell.querySelector('.card-name')).fontSize) : 0,
        subFontPx: cell ? parseFloat(getComputedStyle(cell.querySelector('.card-sub')).fontSize) : 0,
        subOverflow: cell ? cell.querySelector('.card-sub').scrollWidth > cell.querySelector('.card-sub').clientWidth + 1 : true,
      };
    });
    t.ok('at 320px dark mode inside a chapter, controls >=44px, text >=13px, and 0px overflow',
      drill320.overflow <= 1 && drill320.minBtnH >= 44 && drill320.nameFontPx >= 14 &&
      drill320.subFontPx >= 13 && !drill320.subOverflow, JSON.stringify(drill320));
    await dctx.close();

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
};
