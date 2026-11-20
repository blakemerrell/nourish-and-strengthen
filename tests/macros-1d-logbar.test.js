/* Step 1d: Always-there quick food log bar + meal switcher + day impact + local scanner.
 *
 * Verifies:
 *  1) #macroLogBar renders above .mday-acts (leaving #macroFill alone), hides when completed, returns on reopen.
 *  2) #macroLogOpen opens find mode on mNextMeal() with #mpFind focused and 1-tap meal chips (.msh-slots).
 *  3) Typed meal sentence renders #mpHeardImpact updating live with +/- steppers; switching meal preserves #mpFind query.
 *  4) Add all from bar closes sheet, adds unchecked (eaten === 0) items to target meal, and shows [data-mheardundo] Undo toast.
 *  5) #macroLogMic opens find mode with #mpFind focused and #mpMicHint visible.
 *  6) #macroLogScan opens scan mode repeatedly (mCamDone reset), switches meal without resetting camera stream,
 *     and [data-mpnew="1"] opens Nutrition Facts manual entry adding unchecked items to the chosen meal.
 *  7) Narrow 320x700 light & dark checks: zero overflow, >= 44x44 targets, >= 13px text, no mid-word breaks. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

const CAM = `(function(){
  window.__cam = { asked: 0, streams: [] };
  navigator.mediaDevices.getUserMedia = function () {
    window.__cam.asked++;
    return new Promise(function (ok) {
      setTimeout(function () {
        var c = document.createElement('canvas'); c.width = 64; c.height = 48;
        var g = c.getContext('2d'), n = 0;
        setInterval(function () { g.fillStyle = (n++ % 2) ? '#fff' : '#000'; g.fillRect(0, 0, 64, 48); }, 50);
        var s = c.captureStream(10);
        window.__cam.streams.push(s);
        ok(s);
      }, 30);
    });
  };
})();`;

const liveStreams = (p) => p.evaluate(() =>
  window.__cam.streams.filter((s) => s.getTracks().some((tr) => tr.readyState === 'live')).length);

module.exports = nourish({
  name: 'Macros — Step 1d: always-there log bar, meal switcher & local scanner',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 10, 20, 12, 30, 0));
    await p.reload();
    await p.waitForTimeout(450);

    const dayKey = await todayOn(p);
    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: { b: [], l: [], d: [], s: [] } }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(350);

    /* 1) Log bar docked beside .mday-acts in one sticky row; hides on noPlan/done, returns on reopen */
    const barPos = await p.evaluate(() => {
      const dock = document.getElementById('macroDock');
      const lb = document.getElementById('macroLogBar');
      const acts = document.querySelector('.mday-acts');
      const actIds = [...document.querySelectorAll('.mday-acts button')].map((b) => b.id);
      const r1 = lb.getBoundingClientRect();
      const r2 = acts.getBoundingClientRect();
      const dr = dock.getBoundingClientRect();
      return {
        exists: !!lb && !!dock,
        hidden: lb.classList.contains('hide'),
        oneRow: Math.abs(r1.top - r2.top) <= 6 && r1.right <= r2.left + 2 && dr.height < 72,
        sticky: getComputedStyle(dock).position === 'sticky' && getComputedStyle(acts).position === 'sticky',
        actIds,
        openText: document.getElementById('macroLogOpen').textContent.trim(),
      };
    });
    t.ok('#macroLogBar docks beside single-button .mday-acts on one sticky row reading "What did you eat?"',
      barPos.exists && !barPos.hidden && barPos.oneRow && barPos.sticky &&
        barPos.actIds.join() === 'macroFill' && barPos.openText === 'What did you eat?',
      JSON.stringify(barPos));

    await p.click('#macroFill'); // Fill
    await p.waitForTimeout(350);
    await p.click('#macroFill'); // Mark all complete
    await p.waitForTimeout(350);
    await p.click('#macroFill'); // Complete the day (opens summary sheet)
    await p.waitForTimeout(350);
    if (await p.$('#modalRoot .sheet-x')) {
      await p.click('#modalRoot .sheet-x');
      await p.waitForTimeout(250);
    }
    const doneBar = await p.evaluate(() => ({
      hidden: document.getElementById('macroLogBar').classList.contains('hide'),
      text: document.getElementById('macroFill').textContent.trim(),
    }));
    t.ok('completing the day hides #macroLogBar',
      doneBar.hidden && /Reopen/.test(doneBar.text), JSON.stringify(doneBar));

    await p.click('#macroFill'); // Reopen
    await p.waitForTimeout(300);
    const reopenedBar = await p.evaluate(() => !document.getElementById('macroLogBar').classList.contains('hide'));
    t.ok('reopening the day brings #macroLogBar back', reopenedBar);

    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: { b: [], l: [], d: [], s: [] } }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(400);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);

    /* 2) #macroLogOpen -> Lunch by clock, #mpFind focused, impact line & meal switch */
    await p.click('#macroLogOpen');
    await p.waitForTimeout(250);
    const openState = await p.evaluate(() => {
      const sh = document.querySelector('#modalRoot .msheet');
      const chips = [...document.querySelectorAll('#modalRoot .msh-slots [data-mpslot]')].map((b) => ({
        k: b.dataset.mpslot, on: b.getAttribute('aria-pressed'), text: b.textContent.trim(),
      }));
      return {
        mode: sh ? sh.getAttribute('data-mode') : '',
        focused: document.activeElement ? document.activeElement.id : '',
        chips,
      };
    });
    t.ok('#macroLogOpen opens find mode on current clock meal (Lunch) with #mpFind focused',
      openState.mode === 'find' && openState.focused === 'mpFind' &&
        openState.chips.map((c) => c.k).join() === 'b,l,d,s' &&
        openState.chips.find((c) => c.k === 'l')?.on === 'true',
      JSON.stringify(openState));

    await p.fill('#mpFind', '2 eggs and toast with butter');
    await p.waitForTimeout(450);
    const impact1 = await p.evaluate(() => (document.getElementById('mpHeardImpact') || {}).textContent || '');
    t.ok('typed meal sentence displays live day impact line (#mpHeardImpact)',
      /This takes protein to \d+ g of 180 and leaves [\d,]+ kcal\./.test(impact1), impact1);

    await p.click('[data-mhq^="2 eggs"][data-mhd="1"]');
    await p.waitForTimeout(200);
    const impact2 = await p.evaluate(() => (document.getElementById('mpHeardImpact') || {}).textContent || '');
    t.ok('stepping quantity updates #mpHeardImpact live', impact2 !== impact1 && /This takes protein to/.test(impact2), impact2);

    await p.click('#modalRoot [data-mpslot="d"]');
    await p.waitForTimeout(200);
    const afterSwitch = await p.evaluate(() => ({
      query: (document.getElementById('mpFind') || {}).value || '',
      dinnerOn: document.querySelector('#modalRoot [data-mpslot="d"]')?.getAttribute('aria-pressed'),
      lunchOn: document.querySelector('#modalRoot [data-mpslot="l"]')?.getAttribute('aria-pressed'),
      cta: (document.querySelector('#modalRoot [data-mhdo="all"]') || {}).textContent || '',
    }));
    t.ok('tapping Dinner chip switches meal without losing #mpFind query and updates CTA',
      afterSwitch.query === '2 eggs and toast with butter' &&
        afterSwitch.dinnerOn === 'true' && afterSwitch.lunchOn === 'false' &&
        afterSwitch.cta === 'Add all 3 to Dinner',
      JSON.stringify(afterSwitch));

    await p.click('#modalRoot [data-mhdo="all"]');
    await p.waitForTimeout(300);
    const afterAdd = await p.evaluate((dk) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk] || {};
      const toast = document.getElementById('mToast');
      return {
        sheetGone: !document.querySelector('#modalRoot .msheet'),
        dinnerIds: (d.d || []).map((it) => it.id),
        allUnchecked: (d.d || []).length === 3 && (d.d || []).every((it) => !it.eaten),
        toastText: toast && !toast.hidden ? toast.textContent : '',
        hasUndo: !!(toast && toast.querySelector('[data-mheardundo]')),
      };
    }, dayKey);
    t.ok('Add all from bar closes sheet, adds unchecked items to Dinner, and shows Undo toast',
      afterAdd.sheetGone && afterAdd.dinnerIds.join() === 'f:egg,f:bread,f:butter' &&
        afterAdd.allUnchecked && /Added 3 to Dinner/.test(afterAdd.toastText) && afterAdd.hasUndo,
      JSON.stringify(afterAdd));

    await p.click('#mToast [data-mheardundo]');
    await p.waitForTimeout(250);
    const afterUndo = await p.evaluate((dk) => ({
      dinnerLen: (JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].d || []).length,
      toastHidden: document.getElementById('mToast').hidden,
    }), dayKey);
    t.ok('tapping Undo on toast removes the heard foods cleanly',
      afterUndo.dinnerLen === 0 && afterUndo.toastHidden,
      JSON.stringify(afterUndo));

    /* 3) #macroLogMic opens find mode with #mpFind focused and #mpMicHint visible */
    await p.click('#macroLogMic');
    await p.waitForTimeout(250);
    const micState = await p.evaluate(() => ({
      mode: document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') || '',
      focused: document.activeElement ? document.activeElement.id : '',
      hasHint: !!document.getElementById('mpMicHint'),
    }));
    t.ok('#macroLogMic opens find mode with #mpFind focused and #mpMicHint visible',
      micState.mode === 'find' && micState.focused === 'mpFind' && micState.hasHint,
      JSON.stringify(micState));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);
    await p.context().close();

    /* 4) #macroLogScan + live camera stream + meal switch + Nutrition Facts manual entry */
    const sc = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    sc.on('pageerror', (e) => errs.push(e.message));
    await sc.context().addInitScript(CAM);
    await sc.clock.setFixedTime(new Date(2026, 10, 20, 12, 30, 0));
    await sc.reload();
    await sc.waitForTimeout(450);
    const scDay = await todayOn(sc);
    await sc.evaluate((dk) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: { b: [], l: [], d: [], s: [] } }));
    }, scDay);
    await sc.reload();
    await sc.waitForTimeout(450);
    await sc.click('.tab[data-view="macros"]');
    await sc.waitForTimeout(300);

    await sc.click('#macroLogScan');
    await sc.waitForTimeout(350);
    const scan1 = await sc.evaluate(() => ({
      mode: document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') || '',
      asked: window.__cam.asked,
      hasScan: !!document.getElementById('scanRoot'),
      subText: (document.querySelector('#modalRoot [data-mpnew] .mp-sub') || {}).textContent || '',
      hasClose: !!document.querySelector('#modalRoot .msh-acts [data-close="1"]'),
    }));
    t.ok('#macroLogScan opens scan mode with camera active, manual Nutrition Facts hint, and Close button',
      scan1.mode === 'scan' && scan1.asked === 1 && scan1.hasScan && (await liveStreams(sc)) === 1 &&
        /Nutrition Facts/.test(scan1.subText) && scan1.hasClose,
      JSON.stringify(scan1));

    await sc.click('#modalRoot [data-mpslot="s"]');
    await sc.waitForTimeout(200);
    const scanSwitch = await sc.evaluate(() => ({
      snacksOn: document.querySelector('#modalRoot [data-mpslot="s"]')?.getAttribute('aria-pressed'),
      asked: window.__cam.asked,
    }));
    t.ok('switching meal chip inside scan mode keeps existing live camera stream running',
      scanSwitch.snacksOn === 'true' && scanSwitch.asked === 1 && (await liveStreams(sc)) === 1,
      JSON.stringify(scanSwitch));

    await sc.click('#modalRoot .msh-acts [data-close="1"]');
    await sc.waitForTimeout(250);
    t.ok('closing scan sheet stops live camera stream', (await liveStreams(sc)) === 0);

    await sc.click('#macroLogScan');
    await sc.waitForTimeout(350);
    t.ok('re-opening #macroLogScan starts a fresh camera stream (mCamDone reset)',
      (await sc.evaluate(() => window.__cam.asked)) === 2 && (await liveStreams(sc)) === 1);

    await sc.click('#modalRoot [data-mpslot="s"]');
    await sc.waitForTimeout(200);
    await sc.click('#modalRoot [data-mpnew="1"]');
    await sc.waitForTimeout(250);
    t.ok('tapping manual Nutrition Facts entry stops camera and opens label form',
      (await liveStreams(sc)) === 0 && !!(await sc.$('#nfName')));

    await sc.fill('#nfName', 'Greek bar');
    await sc.fill('#nfUnit', '1 bar');
    await sc.fill('#nfKcal', '190');
    await sc.fill('#nfP', '20');
    await sc.fill('#nfF', '5');
    await sc.fill('#nfC', '18');
    await sc.click('[data-nf="save"]');
    await sc.waitForTimeout(300);
    const nfSaved = await sc.evaluate((dk) => {
      const sItems = (JSON.parse(localStorage.getItem('bsc.macroDays'))[dk] || {}).s || [];
      return { count: sItems.length, item: sItems[0] || null };
    }, scDay);
    t.ok('saving manual Nutrition Facts adds unchecked food to the selected meal (Snacks)',
      nfSaved.count === 1 && /^f:my:/.test(nfSaved.item.id) && !nfSaved.item.eaten,
      JSON.stringify(nfSaved));
    await sc.context().close();

    /* 5) 320x700 Light + Dark layout audit */
    for (const scheme of ['light', 'dark']) {
      const np = await t.fresh({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true, colorScheme: scheme });
      np.on('pageerror', (e) => errs.push(e.message));
      const ndk = await todayOn(np);
      await np.evaluate((dk) => {
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
        localStorage.setItem('bsc.macroSlots', JSON.stringify({
          list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }],
          names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
        }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: { b: [], l: [], d: [], s: [] } }));
      }, ndk);
      await np.reload();
      await np.waitForTimeout(400);
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(300);

      const bar320 = await np.evaluate(() => {
        const ids = ['macroLogOpen', 'macroLogMic', 'macroLogScan'];
        const rects = ids.map((id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return { id, w: r.width, h: r.height };
        });
        const ph = document.getElementById('macroLogPh');
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          rects,
          fontPx: parseFloat(getComputedStyle(ph).fontSize),
        };
      });
      await np.click('#macroLogOpen');
      await np.waitForTimeout(250);
      const chips320 = await np.evaluate(() => {
        const sh = document.querySelector('#modalRoot .msheet');
        const bs = [...document.querySelectorAll('#modalRoot .msh-slot')];
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          sheetOverflow: sh.scrollWidth > sh.clientWidth + 1,
          minH: Math.min(...bs.map((b) => b.getBoundingClientRect().height)),
          minW: Math.min(...bs.map((b) => b.getBoundingClientRect().width)),
          minFont: Math.min(...bs.map((b) => parseFloat(getComputedStyle(b).fontSize))),
        };
      });
      t.ok('320x700 ' + scheme + ': no overflow and all log bar + meal switcher targets >= 44px and >= 13px',
        !bar320.overflow && bar320.rects.every((r) => r.w >= 43.9 && r.h >= 43.9) && bar320.fontPx >= 12.95 &&
          !chips320.overflow && !chips320.sheetOverflow && chips320.minH >= 43.9 && chips320.minW >= 43.9 && chips320.minFont >= 12.95,
        JSON.stringify({ bar320, chips320 }));
      await np.context().close();
    }

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
});
