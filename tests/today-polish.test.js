/* Today & topbar polish (2026-11-21 Invisible Power pass — PR 3).
 *
 * Verifies:
 *  1) Today's weekly measurementsCard is hidden by default when no body
 *     measurements exist, toggled via Share & Settings (#settingsBtn ->
 *     [data-sync="bm"]), and auto-shown once measurements exist in bsc.macroAm
 *     (while still hideable via [data-sync="bm"]).
 *  2) Front-door onboarding steps and Today cards/sheets use Eat / Train / Cook
 *     / List instead of legacy Nourish / Strengthen / Plan copy, without changing
 *     data-tdact="nourish" or [data-sync="help"]'s 3 switches.
 *  3) Topbar #settingsBtn sits visibly beside the brand title without touching
 *     #syncBtn (left of brand) and fits cleanly at 320x568 in light & dark modes
 *     with 0px overflow, >=13px text, >=44x44 touch reach, and zero errors. */
module.exports = {
  name: 'Today & topbar: opt-in body measurements, Eat/Train/Cook copy, and Settings button',
  async run(t) {
    const errs = [];

    /* ---- 1. measurementsCard opt-in, auto-show with data, and Today/Settings copy ---- */
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 9, 26, 9, 0, 0)); // Monday
    await p.reload();
    await p.waitForTimeout(700);

    const unconf = await p.evaluate(() => ({
      bmShown: !!document.querySelector('#todayRoot .td-bm-bar'),
      eatNote: (document.querySelector('[data-card="eating"] .td-note') || {}).textContent || '',
      eatTab: (document.querySelector('[data-card="eating"] .td-tab') || {}).textContent || '',
      wkTab: (document.querySelector('[data-card="workout"] .td-tab') || {}).textContent || '',
    }));
    t.ok('unconfigured Today hides measurementsCard and labels Eating card Eat / Workout card Train',
      !unconf.bmShown && /\bEat works out\b/.test(unconf.eatNote) && !/Nourish/.test(unconf.eatNote) &&
        /^Eat/.test(unconf.eatTab) && /^Train/.test(unconf.wkTab),
      JSON.stringify(unconf));

    /* #settingsBtn opens Share & Settings; [data-sync="help"] remains strictly d,e,w alongside [data-sync="bm"] */
    await p.click('#settingsBtn');
    await p.waitForSelector('.sync-sheet [data-sync="bm"]');
    const sync0 = await p.evaluate(() => ({
      eyebrow: (document.querySelector('.sync-sheet .sheet-eyebrow') || {}).textContent || '',
      helpKeys: [...document.querySelectorAll('.sync-sheet [data-sync="help"]')].map((b) => b.dataset.v).join(),
      bmChecked: document.querySelector('.sync-sheet [data-sync="bm"]').getAttribute('aria-checked'),
    }));
    t.ok('#settingsBtn opens Sync & sharing with [data-sync="bm"] off and [data-sync="help"] unchanged',
      sync0.eyebrow === 'Sync & sharing' && sync0.helpKeys === 'd,e,w' && sync0.bmChecked === 'false',
      JSON.stringify(sync0));

    await p.click('.sync-sheet [data-sync="bm"]');
    await p.waitForTimeout(150);
    const bmOnState = await p.evaluate(() => ({
      checked: document.querySelector('.sync-sheet [data-sync="bm"]').getAttribute('aria-checked'),
      pref: localStorage.getItem('sh.tdBm'),
      bmShown: !!document.querySelector('#todayRoot .td-bm-bar'),
    }));
    t.ok('toggling Weekly body measurements on immediately shows measurementsCard on Today',
      bmOnState.checked === 'true' && bmOnState.pref === '1' && bmOnState.bmShown,
      JSON.stringify(bmOnState));

    await p.click('.sync-sheet [data-sync="bm"]');
    await p.waitForTimeout(150);
    const bmOffState = await p.evaluate(() => ({
      checked: document.querySelector('.sync-sheet [data-sync="bm"]').getAttribute('aria-checked'),
      pref: localStorage.getItem('sh.tdBm'),
      bmShown: !!document.querySelector('#todayRoot .td-bm-bar'),
    }));
    t.ok('toggling Weekly body measurements back off hides measurementsCard immediately',
      bmOffState.checked === 'false' && bmOffState.pref === '0' && !bmOffState.bmShown,
      JSON.stringify(bmOffState));
    await p.click('.sync-sheet .sheet-x');
    await p.waitForTimeout(200);

    /* Existing data in bsc.macroAm shows measurementsCard without explicit opt-in, while explicit opt-out still hides it */
    await p.evaluate(() => {
      localStorage.removeItem('sh.tdBm');
      localStorage.setItem('bsc.macroAm', JSON.stringify({ '2026-10-25': { bm: { wa: 33.5 } } }));
    });
    await p.reload();
    await p.waitForTimeout(700);
    const autoWithData = await p.evaluate(() => ({
      bmShown: !!document.querySelector('#todayRoot .td-bm-bar'),
      txt: (document.querySelector('#todayRoot .td-bm-txt') || {}).textContent || '',
    }));
    t.ok('existing measurements in bsc.macroAm automatically surface measurementsCard on Today',
      autoWithData.bmShown && /waist 33\.5/.test(autoWithData.txt), JSON.stringify(autoWithData));

    await p.click('#settingsBtn');
    await p.waitForSelector('.sync-sheet [data-sync="bm"]');
    await p.click('.sync-sheet [data-sync="bm"]');
    await p.click('.sync-sheet .sheet-x');
    await p.waitForTimeout(150);
    const optOutWithData = await p.evaluate(() => ({
      pref: localStorage.getItem('sh.tdBm'),
      bmShown: !!document.querySelector('#todayRoot .td-bm-bar'),
    }));
    t.ok('and turning Weekly body measurements off hides it even when prior measurements exist',
      optOutWithData.pref === '0' && !optOutWithData.bmShown, JSON.stringify(optOutWithData));

    /* Populated Today cards, vitals link, rest day card, and Today meal sheet copy use Eat / Train / Cook / List */
    await p.evaluate(() => {
      const k = '2026-10-26';
      localStorage.setItem('sh.view', 'today');
      localStorage.setItem('sh.viewAt', String(Date.now()));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 40, ft: 5, inch: 10, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [{ id: 1, x: 1, eaten: 0 }] } }));
      localStorage.setItem('bsc.health', JSON.stringify({
        d: { [k]: { rhr: 54, hrv: 62, sleepHours: 7.5, steps: 6500 } },
        ex: [],
      }));
      const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);
      if (r) window.Store.addToDay(r.id, 'mon', 1);
      const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 2, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'b'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [1, 3] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: {} }));
    });
    await p.reload();
    await p.waitForTimeout(700);
    await p.click('#todayRoot [data-td="vitals"]');
    await p.waitForTimeout(150);
    const todayCopy = await p.evaluate(() => ({
      tabs: [...document.querySelectorAll('#todayRoot .td-card .td-tab')].map((b) => b.dataset.go + ':' + b.textContent.replace(/\s*\u203a$/, '').trim()),
      hubText: (document.querySelector('#todayRoot .td-vt-hublink') || {}).textContent || '',
    }));
    t.ok('populated Today card doors say Eat / Train / Cook / List and vitals link says Train',
      todayCopy.tabs.includes('macros:Eat') && todayCopy.tabs.includes('train:Train') &&
        todayCopy.tabs.includes('plan:Cook') && todayCopy.tabs.includes('list:List') &&
        /in Train/.test(todayCopy.hubText) && !/Strengthen/.test(todayCopy.hubText),
      JSON.stringify(todayCopy));

    await p.click('#todayRoot [data-td="meal"][data-k="b"]');
    await p.waitForTimeout(250);
    const mealSheet = await p.evaluate(() => ({
      rows: [...document.querySelectorAll('.td-sheet [data-tdact]')].map((b) => ({
        act: b.dataset.tdact,
        txt: b.textContent.replace(/\s+/g, ' ').trim(),
      })),
    }));
    const eatRow = mealSheet.rows.find((r) => r.act === 'eat');
    const openRow = mealSheet.rows.find((r) => r.act === 'nourish');
    t.ok('Today meal sheet keeps data-tdact="nourish" while showing Eat copy',
      !!eatRow && /in Eat too/.test(eatRow.txt) && !!openRow && /Open the day in Eat/.test(openRow.txt) &&
        mealSheet.rows.every((r) => !/Nourish/.test(r.txt)),
      JSON.stringify(mealSheet));
    await p.click('.td-sheet .sheet-x');
    await p.waitForTimeout(150);
    await p.context().close();

    /* ---- 2. Door onboarding steps say Train & Eat instead of Strengthen & Nourish ---- */
    const dr = await t.fresh({ viewport: { width: 390, height: 844 }, door: true });
    dr.on('pageerror', (e) => errs.push(e.message));
    await dr.waitForTimeout(500);
    await dr.click('[data-dr="next"]'); // step 2: kitchen
    await dr.click('[data-dr="next"]'); // step 3: work
    const doorWork = await dr.evaluate(() => document.querySelector('#doorRoot .dr-foot .dr-note')?.textContent || '');
    await dr.click('[data-dr="next"]'); // step 4: eat
    const doorEat = await dr.evaluate(() => document.querySelector('#doorRoot .dr-body')?.textContent || '');
    t.ok('front door setup references Train and Eat instead of Strengthen and Nourish',
      /Train starts its setup/.test(doorWork) && !/Strengthen/.test(doorWork) &&
        /Next, Eat asks/.test(doorEat) && !/Nourish asks/.test(doorEat),
      JSON.stringify({ doorWork, doorEat }));
    await dr.context().close();

    /* ---- 3. 320px Light & Dark topbar + coarse touch target audit ---- */
    const mob = await t.fresh({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
    mob.on('pageerror', (e) => errs.push(e.message));
    await mob.waitForTimeout(500);
    for (const scheme of ['light', 'dark']) {
      await mob.emulateMedia({ colorScheme: scheme });
      await mob.waitForTimeout(150);
      const top = await mob.evaluate(() => {
        const docOver = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const tb = document.querySelector('.topbar').getBoundingClientRect();
        const sy = document.getElementById('syncBtn').getBoundingClientRect();
        const br = document.querySelector('.topbar .brand-name').getBoundingClientRect();
        const stEl = document.getElementById('settingsBtn');
        const st = stEl.getBoundingClientRect();
        const stCs = getComputedStyle(stEl);
        const cx = st.left + st.width / 2, cy = st.top + st.height / 2;
        const hitPts = [[cx, cy], [cx, Math.max(1, cy - 21)], [cx, cy + 21], [cx - 21, cy], [Math.min(319, cx + 21), cy]];
        const hitOk = hitPts.every(([x, y]) => {
          const el = document.elementFromPoint(x, y);
          return !!el && (el === stEl || stEl.contains(el));
        });
        return {
          docOver,
          tbH: Math.round(tb.height),
          syncLeftOfBrand: sy.right <= br.left + 1,
          brandW: Math.round(br.width),
          setRightOfBrand: st.left >= br.right - 1,
          setInView: st.right <= 320.5 && st.top >= 0,
          setFont: parseFloat(stCs.fontSize),
          setText: stEl.textContent.trim(),
          syncLabel: (document.getElementById('syncLabel') || {}).textContent.trim(),
          hitOk,
        };
      });
      t.ok('320px (' + scheme + '): 0px overflow, slim topbar, visible Settings beside skep & brand with 44x44 touch reach',
        top.docOver <= 0 && top.tbH < 90 && top.syncLeftOfBrand && top.brandW >= 100 &&
          top.setRightOfBrand && top.setInView && top.setFont >= 12.95 &&
          top.setText === 'Settings' && top.syncLabel === 'Share' && top.hitOk,
        JSON.stringify(top));
    }
    await mob.click('#settingsBtn');
    await mob.waitForSelector('.sync-sheet');
    await mob.click('.sync-sheet .sheet-x');
    await mob.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
};
