/* Step 1e: Eat Day Header (current / goal + highlighted N left / N over badge)
 * and Fuel Detail macro breakdown inside #macroPillTray.
 *
 * Verifies:
 *  1) #macroTrayHead renders current / goal alongside a highlighted "N left" badge
 *     on a single horizontal row with #macroSum height === 50 on 390x844 and 412x915.
 *  2) Adding a food updates current kcal and N left in exact arithmetic lockstep.
 *  3) Going over goal switches the badge to "N over" with .over class and distinct color.
 *  4) Cold no-plan day hides #macroTrayHead / .mpillwk-rem and keeps .macro-none calm.
 *  5) Tapping the badge / header opens #macroPillTray with Protein/Fat/Carbs FUEL DETAIL
 *     tiles showing current / goal g + left/over; tapping the water droplet opens Hydration
 *     without toggling #macroPillTray; scrolling folds #macroFold -> #macroPills cleanly.
 *  6) Narrow 320x640 Light + Dark audit: no horizontal overflow, one-row .mday-head,
 *     >= 44px controls, >= 13px visible text, zero truncation or mid-word breaks. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — Step 1e: Eat day header (current / goal + N left/over)',
  async suite(t) {
    const errs = [];
    const seedDay = (p, dk, items) => p.evaluate(({ dk, items }) => {
      // 190*4 + 65*9 + 210*4 = 760 + 585 + 840 = 2185 kcal
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 65, c: 210 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: items }));
    }, { dk, items });

    /* 1) Side-by-side current / goal + N left on 390x844 & 412x915 */
    for (const vp of [{ width: 390, height: 844 }, { width: 412, height: 915 }]) {
      const p = await t.fresh({ viewport: vp, hasTouch: true, isMobile: true });
      p.on('pageerror', (e) => errs.push(e.message));
      const dk = await todayOn(p);
      await seedDay(p, dk, { b: [{ id: 'f:egg_white', x: 4, eaten: 1 }], l: [], d: [], s: [] });
      await p.reload();
      await p.waitForTimeout(400);
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(300);

      const hdr = await p.evaluate(() => {
        const sum = document.getElementById('macroSum');
        const btn = document.getElementById('macroTrayHead');
        const k = btn.querySelector('.mpillwk-k');
        const rem = btn.querySelector('.mpillwk-rem');
        const w = btn.querySelector('.mpillwk-w');
        const sr = sum.getBoundingClientRect();
        const kr = k.getBoundingClientRect();
        const rr = rem.getBoundingClientRect();
        const wr = w.getBoundingClientRect();
        const cy = (r) => r.top + r.height / 2;
        const maxCy = Math.max(cy(kr), cy(rr), cy(wr));
        const minCy = Math.min(cy(kr), cy(rr), cy(wr));
        return {
          sumH: Math.round(sr.height),
          btnH: Math.round(btn.getBoundingClientRect().height),
          kText: k.textContent.replace(/\s+/g, ' ').trim(),
          remText: rem.textContent.trim(),
          remAttr: Number(rem.dataset.rem),
          hasOver: rem.classList.contains('over'),
          remBg: getComputedStyle(rem).backgroundColor,
          remCol: getComputedStyle(rem).color,
          oneRow: maxCy - minCy <= 3,
          noOverlap: kr.right <= rr.left + 1 && rr.right <= wr.left + 1 && wr.right <= sr.right + 0.5,
          kTrunc: k.scrollWidth > k.clientWidth + 1,
          remTrunc: rem.scrollWidth > rem.clientWidth + 1,
          goalNum: Number((k.querySelector('.mpillwk-kt').textContent.replace(/[^\d]/g, ''))),
          curNum: Number(k.querySelector('b').textContent.replace(/[^\d]/g, '')),
        };
      });

      const expGoal = 2185;
      t.ok(vp.width + 'px: Eat header displays current / goal alongside highlighted "N left" on one 50px row without truncation',
        hdr.sumH === 50 && hdr.btnH >= 44 && hdr.goalNum === expGoal &&
          hdr.curNum + hdr.remAttr === expGoal && hdr.remAttr > 0 && !hdr.hasOver &&
          hdr.remText === hdr.remAttr.toLocaleString() + ' left' &&
          hdr.oneRow && hdr.noOverlap && !hdr.kTrunc && !hdr.remTrunc,
        JSON.stringify(hdr));

      if (vp.width === 390) {
        const greenCol = hdr.remCol;

        /* 2) Live arithmetic lockstep when adding food */
        await p.evaluate(() => {
          const btn = document.querySelector('#macroSlots [data-mopen="l"]');
          if (btn) btn.click();
        });
        await p.waitForTimeout(250);
        await p.evaluate(() => {
          const row = document.querySelector('#modalRoot .mpick-row[data-mpick]');
          if (row) row.click();
        });
        await p.waitForTimeout(250);
        if (await p.$('#modalRoot .msh-done')) {
          await p.click('#modalRoot .msh-done');
          await p.waitForTimeout(250);
        }

        const afterAdd = await p.evaluate(() => {
          const k = document.querySelector('#macroTrayHead .mpillwk-k b');
          const rem = document.querySelector('#macroTrayHead .mpillwk-rem');
          return {
            curNum: Number(k.textContent.replace(/[^\d]/g, '')),
            remAttr: Number(rem.dataset.rem),
            remText: rem.textContent.trim(),
          };
        });
        t.ok('adding a food increases current kcal and decreases "N left" in exact lockstep',
          afterAdd.curNum > hdr.curNum && afterAdd.curNum + afterAdd.remAttr === expGoal &&
            afterAdd.remText === afterAdd.remAttr.toLocaleString() + ' left',
          JSON.stringify({ before: hdr.curNum, afterAdd }));

        /* 3) Over-target state ("N over") */
        const bigRecipeId = await p.evaluate(() => {
          const r = window.RECIPES.find((x) => x.macro && x.macro.kcal >= 400);
          return r ? r.id : null;
        });
        await seedDay(p, dk, {
          b: [{ id: bigRecipeId, x: 6, eaten: 1 }],
          l: [],
          d: [],
          s: [],
        });
        await p.reload();
        await p.waitForTimeout(400);
        await p.click('.tab[data-view="macros"]');
        await p.waitForTimeout(300);

        const overHdr = await p.evaluate(() => {
          const sum = document.getElementById('macroSum').getBoundingClientRect();
          const btn = document.getElementById('macroTrayHead');
          const k = btn.querySelector('.mpillwk-k');
          const rem = btn.querySelector('.mpillwk-rem');
          const w = btn.querySelector('.mpillwk-w');
          return {
            curNum: Number(k.querySelector('b').textContent.replace(/[^\d]/g, '')),
            remAttr: Number(rem.dataset.rem),
            remText: rem.textContent.trim(),
            hasOver: rem.classList.contains('over'),
            remCol: getComputedStyle(rem).color,
            kTrunc: k.scrollWidth > k.clientWidth + 1,
            remTrunc: rem.scrollWidth > rem.clientWidth + 1,
            noOverflow: w.getBoundingClientRect().right <= sum.right + 0.5,
          };
        });
        t.ok('going over goal with 4-digit calories switches to "N over" cleanly without truncation',
          overHdr.curNum > expGoal && overHdr.remAttr === expGoal - overHdr.curNum &&
            overHdr.hasOver && overHdr.remText === (overHdr.curNum - expGoal).toLocaleString() + ' over' &&
            overHdr.remCol !== greenCol && !overHdr.kTrunc && !overHdr.remTrunc && overHdr.noOverflow,
          JSON.stringify({ greenCol, overHdr }));

        /* 5) Header doors (#macroPillTray, FUEL DETAIL P/F/C, water droplet) & scroll fold */
        await p.click('#macroTrayHead .mpillwk-rem');
        await p.waitForTimeout(250);
        const tray = await p.evaluate(() => {
          const tr = document.getElementById('macroPillTray');
          const expanded = document.getElementById('macroTrayHead').getAttribute('aria-expanded');
          const macros = ['p', 'f', 'c'].map((m) => {
            const tile = tr ? tr.querySelector('[data-mptmacro="' + m + '"]') : null;
            return tile ? {
              m,
              val: (tile.querySelector('.mpt-tv') || {}).textContent.replace(/\s+/g, ' ').trim(),
              tag: (tile.querySelector('.mpt-tt') || {}).textContent.trim(),
            } : null;
          });
          return { open: !!tr, expanded, macros };
        });
        t.ok('tapping #macroTrayHead opens #macroPillTray with Protein, Fat, and Carbs current / goal g + left/over tiles',
          tray.open && tray.expanded === 'true' &&
            tray.macros.every((m) => m && /\d+\s*\/\s*\d+\s*g/.test(m.val) && /(left|over)$/.test(m.tag)),
          JSON.stringify(tray));

        // Tapping water droplet opens Water & Drinks modal without collapsing/toggling #macroPillTray
        await p.click('#macroTrayHead [data-hydmodal="open"]');
        await p.waitForTimeout(250);
        const hyd = await p.evaluate(() => ({
          modalOpen: !!document.querySelector('#modalRoot .sheet, #modalRoot .hyd-sheet, #modalRoot [data-hydquick]'),
          trayStillOpen: !!document.getElementById('macroPillTray'),
        }));
        t.ok('tapping the water droplet opens Water & Drinks without toggling #macroPillTray',
          hyd.modalOpen && hyd.trayStillOpen, JSON.stringify(hyd));
        if (await p.$('#modalRoot .sheet-x')) {
          await p.click('#modalRoot .sheet-x');
          await p.waitForTimeout(200);
        }

        // Tapping header again closes #macroPillTray
        await p.click('#macroTrayHead');
        await p.waitForTimeout(200);
        const closedTray = await p.evaluate(() => ({
          open: !!document.getElementById('macroPillTray'),
          expanded: document.getElementById('macroTrayHead').getAttribute('aria-expanded'),
        }));
        t.ok('tapping #macroTrayHead again closes #macroPillTray',
          !closedTray.open && closedTray.expanded === 'false', JSON.stringify(closedTray));

        // Scroll fold collapses #macroFold -> #macroPills while keeping #macroTrayHead pinned
        await p.evaluate(() => {
          document.getElementById('macroSlots').style.minHeight = '1600px';
          window.scrollTo(0, 500);
        });
        await p.waitForTimeout(250);
        const folded = await p.evaluate(() => {
          const stick = document.querySelector('#view-macros .mday-stick');
          const pills = document.getElementById('macroPills');
          const head = document.getElementById('macroTrayHead');
          return {
            shrunk: !!stick && stick.classList.contains('shrunk'),
            pillsVis: getComputedStyle(pills).opacity,
            headTop: head ? Math.round(head.getBoundingClientRect().top) : -1,
            hasRem: !!document.querySelector('#macroTrayHead .mpillwk-rem'),
          };
        });
        t.ok('scrolling folds #macroFold into #macroPills while #macroTrayHead remains pinned at top',
          folded.shrunk && Number(folded.pillsVis) > 0.8 && folded.headTop >= 0 && folded.hasRem,
          JSON.stringify(folded));
      }
      await p.context().close();
    }

    /* 4) Cold no-plan state */
    const cold = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    cold.on('pageerror', (e) => errs.push(e.message));
    await cold.evaluate(() => {
      localStorage.removeItem('bsc.macroTargets');
      localStorage.removeItem('bsc.macroDays');
    });
    await cold.reload();
    await cold.waitForTimeout(350);
    await cold.click('.tab[data-view="macros"]');
    await cold.waitForTimeout(250);
    const coldCheck = await cold.evaluate(() => ({
      trayHead: !!document.getElementById('macroTrayHead'),
      remBadge: !!document.querySelector('#view-macros .mpillwk-rem'),
      noneCard: !!document.querySelector('#macroFoot .macro-none'),
    }));
    t.ok('cold day without targets omits #macroTrayHead and .mpillwk-rem and shows .macro-none cleanly',
      !coldCheck.trayHead && !coldCheck.remBadge && coldCheck.noneCard, JSON.stringify(coldCheck));
    await cold.context().close();

    /* 6) 375x667 + 320x640 Light & Dark layout audits with 4-digit calories */
    for (const cfg of [
      { width: 375, height: 667, scheme: 'light' },
      { width: 320, height: 640, scheme: 'light' },
      { width: 320, height: 640, scheme: 'dark' },
    ]) {
      const np = await t.fresh({ viewport: { width: cfg.width, height: cfg.height }, hasTouch: true, isMobile: true, colorScheme: cfg.scheme });
      np.on('pageerror', (e) => errs.push(e.message));
      const dk = await todayOn(np);
      const bigId = await np.evaluate(() => {
        const r = window.RECIPES.find((x) => x.macro && x.macro.kcal >= 400);
        return r ? r.id : 'f:egg_white';
      });
      await seedDay(np, dk, { b: [{ id: bigId, x: 8, eaten: 1 }], l: [], d: [], s: [] });
      await np.reload();
      await np.waitForTimeout(400);
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(300);

      const audit = await np.evaluate(() => {
        const kids = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden && e.getBoundingClientRect().height);
        const tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
        const head = document.querySelector('.mday-head').getBoundingClientRect();
        const sum = document.getElementById('macroSum').getBoundingClientRect();
        const kc = document.getElementById('macroTrayHead');
        const k = kc.querySelector('.mpillwk-k');
        const rem = kc.querySelector('.mpillwk-rem');
        const broken = [];
        document.querySelectorAll('#view-macros button').forEach((b) => {
          if (!b.getBoundingClientRect().width || b.closest('.hide, [aria-hidden="true"]')) return;
          const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            const re = /\S+/g; let m;
            while ((m = re.exec(n.textContent))) {
              const rg = document.createRange();
              rg.setStart(n, m.index);
              rg.setEnd(n, m.index + m[0].length);
              const lines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top)));
              if (lines.size > 1) broken.push(m[0]);
            }
          }
        });
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          oneRow: Math.max(...tops) - Math.min(...tops) <= 2,
          inside: kids.every((e) => e.getBoundingClientRect().right <= head.right + 0.5),
          kcalIn: [...kc.querySelectorAll('span, b')].every((e) => !e.getBoundingClientRect().width || e.getBoundingClientRect().right <= sum.right + 0.5),
          dateW: Math.round(document.getElementById('macroDate').getBoundingClientRect().width),
          kcH: Math.round(kc.getBoundingClientRect().height),
          kTrunc: k.scrollWidth > k.clientWidth + 1,
          remTrunc: rem.scrollWidth > rem.clientWidth + 1,
          remFont: parseFloat(getComputedStyle(rem).fontSize),
          ktFont: parseFloat(getComputedStyle(kc.querySelector('.mpillwk-kt')).fontSize),
          broken,
        };
      });
      t.ok(cfg.width + 'x' + cfg.height + ' ' + cfg.scheme + ': one-row header, no overflow, no truncation, >= 44px touch, >= 13px type, zero broken words',
        !audit.overflow && audit.oneRow && audit.inside && audit.kcalIn &&
          audit.dateW >= 44 && audit.kcH >= 44 && !audit.kTrunc && !audit.remTrunc &&
          audit.remFont >= 12.95 && audit.ktFont >= 12.95 && audit.broken.length === 0,
        JSON.stringify(audit));
      await np.context().close();
    }

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
});
