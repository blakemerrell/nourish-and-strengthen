/* Eat ultra-clean & Today macro pills (2026-11-22 PR A).
 *
 * Verifies:
 *  1) Silent auto-coach: over-eating, under-eating, and skipping a meal
 *     automatically redistribute remaining shares without rendering any
 *     .mcasc / [data-msend] chooser UI — even with stale bsc.macroSend
 *     (`off: true`) pre-seeded in localStorage.
 *  2) Always-open meals with pills: planned and 100% eaten meals render
 *     mv-2 with 4 .mcap pills and visible food lines, ZERO .mbd circles,
 *     ZERO [data-mview], ZERO .mtray-chev, #macroViews hidden, and tapping
 *     a meal header opens its sheet cleanly.
 *  3) Today Eating card uses 4 .td-caps .mcap pills (kcal,p,f,c) with ZERO
 *     .td-dual-ring and ZERO .td-mbars.
 *  4) 320x568 light & dark layout audit on both Today and Eat: 0px
 *     horizontal overflow, Style C1 Oat & Ink full capsules (radius >= 12px,
 *     macro hues for kcal/p/f/c) positioned under card headings on 1 single row,
 *     0 clipped digits, compact 8.5–11px text, and 0 page errors. */
module.exports = {
  name: 'Eat & Today: silent auto-coach, always-open pill cards, and Today macro pills',
  async run(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 9, 26, 11, 0, 0));
    await p.reload();
    await p.waitForTimeout(600);

    const k = '2026-10-26';
    await p.evaluate((dk) => {
      localStorage.setItem('sh.view', 'today');
      localStorage.setItem('sh.viewAt', String(Date.now()));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 40, ft: 5, inch: 10, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 65, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b', w: 25 },
          { k: 'l', n: 'Lunch', t: 'l', w: 30 },
          { k: 'd', n: 'Dinner', t: 'd', w: 35 },
          { k: 's', n: 'Snacks', t: 's', w: 10 },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      /* Over-eaten breakfast (100% eaten), light eaten lunch, unplanned/planned dinner & snacks,
         plus stale bsc.macroSend trying to turn off redistribution. */
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [{ id: 'f:butter', x: 6, eaten: 1 }, { id: 'f:egg', x: 3, eaten: 1 }],
          l: [{ id: 'f:egg_white', x: 1, eaten: 1 }],
          d: [{ id: 66, x: 1, eaten: 0 }],
          s: [],
        },
      }));
      localStorage.setItem('bsc.macroSend', JSON.stringify({ [dk]: { f: 'b', to: [], off: true, ack: false } }));
    }, k);
    await p.reload();
    await p.waitForTimeout(700);

    /* ---- 1. Today Eating card uses 4 compact macro pills (no dual ring, no td-mbars) ---- */
    const td = await p.evaluate(() => ({
      macros: [...document.querySelectorAll('[data-card="eating"] .td-caps .mcap')].map((el) => el.dataset.macro),
      hasRing: !!document.querySelector('[data-card="eating"] .td-dual-ring'),
      hasMbars: !!document.querySelector('[data-card="eating"] .td-mbars'),
      fills: [...document.querySelectorAll('[data-card="eating"] .td-caps .mcap-fl')].length,
    }));
    t.ok('Today Eating card shows 4 macro pills (kcal,p,f,c) with no dual ring or 3-bar block',
      td.macros.join() === 'kcal,p,f,c' && td.fills === 4 && !td.hasRing && !td.hasMbars, JSON.stringify(td));

    /* ---- 2. Eat tab: always-open pill cards + silent auto-coach (no .mcasc / no circles) ---- */
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(450);

    const beforeSkip = await p.evaluate(() => {
      const cap = (sk) => {
        const el = document.querySelector('#macroSlots [data-mslot="' + sk + '"] .mtray-caps .mcap');
        return el ? Number(el.dataset.want) : 0;
      };
      return {
        mcascCount: document.querySelectorAll('#macroSlots .mcasc, #macroSlots [data-msend]').length,
        beadsCount: document.querySelectorAll('#macroSlots .mbd').length,
        mviewCount: document.querySelectorAll('#macroSlots [data-mview]').length,
        chevCount: document.querySelectorAll('#macroSlots .mtray-chev').length,
        viewsHidden: !!document.getElementById('macroViews') && document.getElementById('macroViews').hidden,
        bDoneOpen: !!document.querySelector('#macroSlots .mtray.done.mv-2[data-mslot="b"] .mtray-f'),
        lDoneOpen: !!document.querySelector('#macroSlots .mtray.done.mv-2[data-mslot="l"] .mtray-f'),
        dOpen: !!document.querySelector('#macroSlots .mtray.mv-2[data-mslot="d"] .mtray-caps'),
        dWant: cap('d'),
        dPills: document.querySelectorAll('#macroSlots [data-mslot="d"] .mtray-caps .mcap').length,
        bPills: document.querySelectorAll('#macroSlots [data-mslot="b"] .mtray-caps .mcap').length,
      };
    });
    t.ok('Eat keeps eaten & planned meals open with 4 pills (no .mcasc, circles, chevrons, or fold toggles)',
      beforeSkip.mcascCount === 0 && beforeSkip.beadsCount === 0 && beforeSkip.mviewCount === 0 &&
        beforeSkip.chevCount === 0 && beforeSkip.viewsHidden &&
        beforeSkip.bDoneOpen && beforeSkip.lDoneOpen && beforeSkip.dOpen &&
        beforeSkip.bPills === 4 && beforeSkip.dPills === 4 && beforeSkip.dWant > 0,
      JSON.stringify(beforeSkip));

    /* Tapping a populated meal name opens its meal sheet */
    await p.click('#macroSlots .mtray[data-mslot="b"] .mtray-hd[data-mopen="b"]');
    await p.waitForTimeout(300);
    t.ok('tapping an eaten meal header opens its meal sheet cleanly',
      await p.evaluate(() => !!document.querySelector('#modalRoot .msheet[data-mode="meal"]')));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* Skipping Snacks auto-adjusts Dinner without showing any .mcasc card */
    await p.click('#macroSlots [data-mslot="s"] .mtray-hd[data-mopen="s"]');
    await p.waitForSelector('#modalRoot [data-mmenu="s"]');
    await p.click('#modalRoot [data-mmenu="s"]');
    await p.waitForSelector('#modalRoot [data-mskip="s"]');
    await p.click('#modalRoot [data-mskip="s"]');
    await p.waitForTimeout(300);
    if (await p.$('#modalRoot .msh-done')) {
      await p.click('#modalRoot .msh-done');
      await p.waitForTimeout(250);
    }

    const afterSkip = await p.evaluate(() => {
      const cap = (sk) => {
        const el = document.querySelector('#macroSlots [data-mslot="' + sk + '"] .mtray-caps .mcap');
        return el ? Number(el.dataset.want) : 0;
      };
      return {
        mcascCount: document.querySelectorAll('#macroSlots .mcasc, #macroSlots [data-msend]').length,
        skipPill: (document.querySelector('#macroSlots .mtray-skip .mtray-skb') || {}).dataset || null,
        dWant: cap('d'),
      };
    });
    t.ok('skipping an open meal leaves zero .mcasc cards and lets Dinner automatically adjust',
      afterSkip.mcascCount === 0 && afterSkip.skipPill && afterSkip.skipPill.mopen === 's' && afterSkip.dWant >= beforeSkip.dWant,
      JSON.stringify({ before: beforeSkip.dWant, afterSkip }));
    await p.context().close();

    /* ---- 3. 320x568 Light & Dark audit on Today and Eat ---- */
    const mob = await t.fresh({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
    mob.on('pageerror', (e) => errs.push(e.message));
    await mob.clock.setFixedTime(new Date(2026, 9, 26, 11, 0, 0));
    await mob.evaluate((dk) => {
      localStorage.setItem('sh.view', 'today');
      localStorage.setItem('sh.viewAt', String(Date.now()));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 40, ft: 5, inch: 10, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 65, c: 200 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [{ id: 'f:egg', x: 3, eaten: 1 }],
          l: [{ id: 'f:chicken_breast', x: 1, eaten: 0 }],
          d: [],
          s: [],
        },
      }));
    }, k);
    await mob.reload();
    await mob.waitForTimeout(700);

    for (const scheme of ['light', 'dark']) {
      await mob.emulateMedia({ colorScheme: scheme });
      await mob.click('.tab[data-view="today"]');
      await mob.waitForTimeout(200);
      const tdAudit = await mob.evaluate(() => {
        const cap = document.querySelector('[data-card="eating"] .td-caps');
        const head = document.querySelector('[data-card="eating"] .td-head');
        const pills = [...document.querySelectorAll('[data-card="eating"] .td-caps .mcap')];
        const capFonts = pills.map((el) => parseFloat(getComputedStyle(el.querySelector('.mcap-t')).fontSize));
        const radii = pills.map((el) => parseFloat(getComputedStyle(el).borderRadius));
        const rows = new Set(pills.map((el) => Math.round(el.getBoundingClientRect().top))).size;
        const cut = pills.filter((el) => {
          const pr = el.getBoundingClientRect(), tr = el.querySelector('.mcap-t').getBoundingClientRect();
          return tr.left < pr.left - 0.5 || tr.right > pr.right + 0.5;
        }).length;
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          pills: pills.length,
          macros: pills.map((el) => el.dataset.macro).join(),
          rows,
          cut,
          belowHead: !!cap && !!head && cap.getBoundingClientRect().top >= head.getBoundingClientRect().bottom - 1,
          minFont: Math.min.apply(null, capFonts),
          maxFont: Math.max.apply(null, capFonts),
          minRadius: Math.min.apply(null, radii),
        };
      });
      t.ok('320px Today (' + scheme + '): 0px overflow, C1 Oat & Ink capsules below head, 1 row, 0 cut, 8.5–11px',
        tdAudit.overflow <= 0 && tdAudit.pills === 4 && tdAudit.macros === 'kcal,p,f,c' &&
          tdAudit.rows === 1 && tdAudit.cut === 0 && tdAudit.belowHead &&
          tdAudit.minFont >= 8.5 && tdAudit.maxFont <= 11 && tdAudit.minRadius >= 12,
        JSON.stringify(tdAudit));

      await mob.click('.tab[data-view="macros"]');
      await mob.waitForTimeout(250);
      const eatAudit = await mob.evaluate(() => {
        const trays = [...document.querySelectorAll('#macroSlots .mtray.mtray-cap')];
        const pills = [...document.querySelectorAll('#macroSlots .mtray-caps .mcap')];
        const capFonts = pills.map((el) => parseFloat(getComputedStyle(el.querySelector('.mcap-t')).fontSize));
        const radii = pills.map((el) => parseFloat(getComputedStyle(el).borderRadius));
        const rowsPerTray = trays.map((tr) =>
          new Set([...tr.querySelectorAll('.mtray-caps .mcap')].map((el) => Math.round(el.getBoundingClientRect().top))).size);
        const belowPerTray = trays.every((tr) => {
          const cap = tr.querySelector('.mtray-caps'), hr = tr.querySelector('.mtray-hr');
          return !!cap && !!hr && cap.getBoundingClientRect().top >= hr.getBoundingClientRect().top;
        });
        const macrosOk = trays.every((tr) => {
          const ps = [...tr.querySelectorAll('.mtray-caps .mcap')];
          return ['kcal', 'p', 'f', 'c'].every((m, i) => ps[i] && ps[i].classList.contains('mcap-' + m));
        });
        const cut = pills.filter((el) => {
          const pr = el.getBoundingClientRect(), tr = el.querySelector('.mcap-t').getBoundingClientRect();
          return tr.left < pr.left - 0.5 || tr.right > pr.right + 0.5;
        }).length;
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          trays: trays.length,
          pills: pills.length,
          macrosOk,
          rowsPerTray,
          cut,
          belowPerTray,
          minFont: Math.min.apply(null, capFonts),
          maxFont: Math.max.apply(null, capFonts),
          minRadius: Math.min.apply(null, radii),
        };
      });
      t.ok('320px Eat (' + scheme + '): 0px overflow, C1 Oat & Ink capsules below title, 1 row each, 0 cut, 8.5–11px',
        eatAudit.overflow <= 0 && eatAudit.trays === 2 && eatAudit.pills === 8 && eatAudit.macrosOk &&
          eatAudit.rowsPerTray.every((r) => r === 1) && eatAudit.cut === 0 && eatAudit.belowPerTray &&
          eatAudit.minFont >= 8.5 && eatAudit.maxFont <= 11 && eatAudit.minRadius >= 12,
        JSON.stringify(eatAudit));
    }
    await mob.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
};
