/* Strengthen UX Overhaul (2026-11-05):
 *   Pillar 1 — Workout tab collapsible exercise preview (seshex), litStrip, and collapsible Other ways to train (moretog)
 *   Pillar 2 — Live Logger 1-line exercise header with avatar thumbnail, #trPop popovers (expop & fmpop),
 *              gold sticky note / coach cue bar, set badge popover (styadd / styskip), RP feedback modal,
 *              and 100% preserved inline barbell plate stack visualizer (#trpl-xi-si .tr-stk)
 *   Pillar 3 — Unified Progress tab with Front/Back body map across week/block/all, 3-way coloring mode (sets/rec/str),
 *              and collapsible PhD Analytics Lab cards (pgtog / pgexpall)
 *   Pillar 4 — Strong-style 2-column History session cards + Perform Again, recency-sorted Lifts cards with
 *              12-session sparkline + 4-week trend badge + circular avatar + Last Session Best Set,
 *              Lift Sheet Summary KPI strip + pause/play toggle (expause), mc-ohp media fix, and >=13px font sizes.
 */
module.exports = {
  name: 'Strengthen: UX overhaul across Workout, Live Logger, Progress, History & Lifts',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    await p.evaluate(() => {
      const _ = window.Train._;
      const pr = { qz: 1, kit: 'gym', lvl: 1, bk: '', jt: '', avoid: [], en: { 'bb-bench': 'Arch and leg drive' } };
      const ms = _.build(Object.assign({ prog: 'grow', dpw: 4, min: 60, acc: 4, pri: [] }, pr));
      ms.id = 'uxms';
      ms.n = 'Hypertrophy Block';
      const now = Date.now();
      const wo = {
        w0: {
          id: 'w0', st: now - 16 * 864e5, en: now - 16 * 864e5 + 2700000, dk: '2026-10-19',
          n: 'Lower 0', u: 'lb', ms: '', w: 0, d: 0, dl: 0,
          x: [{ e: 'bb-squat', s: [{ w: 215, r: 5, t: now - 16 * 864e5 + 1000 }] }],
          sr: {}, fb: {}
        },
        w1: {
          id: 'w1', st: now - 5 * 864e5, en: now - 5 * 864e5 + 2700000, dk: '2026-10-30',
          n: 'Upper A', u: 'lb', ms: 'uxms', w: 0, d: 0, dl: 0,
          x: [{ e: 'bb-bench', s: [{ w: 185, r: 8, t: now - 5 * 864e5 + 1000 }, { w: 185, r: 8, t: now - 5 * 864e5 + 2000 }] }],
          sr: {}, fb: {}
        },
        w2: {
          id: 'w2', st: now - 2 * 864e5, en: now - 2 * 864e5 + 3000000, dk: '2026-11-02',
          n: 'Lower A', u: 'lb', ms: 'uxms', w: 0, d: 1, dl: 0,
          x: [{ e: 'bb-squat', s: [{ w: 225, r: 6, t: now - 2 * 864e5 + 1000 }, { w: 235, r: 5, t: now - 2 * 864e5 + 2000 }] }],
          sr: {}, fb: {}
        }
      };
      localStorage.setItem('bsc.train', JSON.stringify({
        pr, act: 'uxms', ms: { uxms: ms }, ax: {}, cx: {}, wo,
        nt: { nbbbench: { e: 'bb-bench', t: 'Arch and leg drive' } }
      }));
      localStorage.removeItem('bsc.trainStamps');
      localStorage.removeItem('sh.trainLive');
      _.reload();
    });

    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(100);

    // Pillar 1: Workout tab
    const p1 = await p.evaluate(() => {
      const hasSeshEx = !!document.querySelector('#view-train [data-t="seshex"]');
      const hasMoreTog = !!document.querySelector('#view-train [data-t="moretog"]');
      const hasLitStrip = !!document.querySelector('#view-train .tr-litstrip');
      const defaultCollapsed = !!document.querySelector('#view-train .tr-snames.is-collapsed');
      document.querySelector('#view-train [data-t="seshex"]').click();
      const expandedAfterClick = !document.querySelector('#view-train .tr-snames.is-collapsed');
      document.querySelector('#view-train [data-t="seshex"]').click();
      const collapsedAgain = !!document.querySelector('#view-train .tr-snames.is-collapsed');
      return { hasSeshEx, hasMoreTog, hasLitStrip, defaultCollapsed, expandedAfterClick, collapsedAgain };
    });
    t.ok('Pillar 1 (Workout tab): collapsible exercise preview (seshex), litStrip, and Other ways to train toggle (moretog)',
      p1.hasSeshEx && p1.hasMoreTog && p1.hasLitStrip && p1.defaultCollapsed && p1.expandedAfterClick && p1.collapsedAgain,
      JSON.stringify(p1));

    // Pillar 2: Live Logger
    const p2 = await p.evaluate(() => {
      const _ = window.Train._;
      document.querySelector('#view-train .tr-next [data-t="start"]').click();
      const st = _.state();
      st.LIVE.x[0].e = 'bb-bench';
      st.LIVE.x[0].s[0].w = 185;
      _.draw();

      const hasExThumb = !!document.querySelector('#view-train .tr-ex-h .tr-ex-thumb');
      const hasExPopBtn = !!document.querySelector('#view-train .tr-ex-h [data-t="expop"]');
      const hasCueBar = !!document.querySelector('#view-train .tr-ex .tr-cue-bar');
      const hasInlinePlateStack = !!document.querySelector('#trpl-0-0 .tr-stk');

      // Exercise menu popover (#trPop) opens without touching S.sheet
      document.querySelector('#view-train [data-t="expop"][data-x="0"]').click();
      const popOpenNoSheet = !!document.querySelector('#trPop .tr-pop-card') && st.S.sheet === null;
      document.querySelector('#trPop [data-t="popclose"]').click();
      const popClosed = !document.querySelector('#trPop .tr-pop-card');

      // Set badge sheet has + Add set below (styadd) and Skip set (styskip)
      document.querySelector('#view-train [data-t="sty"][data-x="0"][data-s="0"]').click();
      const hasStyAddSkip = !!document.querySelector('.tr-sheet [data-t="styadd"]') && !!document.querySelector('.tr-sheet [data-t="styskip"]');
      const beforeSets = st.LIVE.x[0].s.length;
      document.querySelector('.tr-sheet [data-t="styadd"]').click();
      const afterAddSets = st.LIVE.x[0].s.length;

      st.S.sheet = null;
      localStorage.removeItem('sh.trainLive');
      _.reload();
      return { hasExThumb, hasExPopBtn, hasCueBar, hasInlinePlateStack, popOpenNoSheet, popClosed, hasStyAddSkip, addedSet: afterAddSets === beforeSets + 1 };
    });
    t.ok('Pillar 2 (Live Logger): 1-line header with avatar & #trPop menu, gold cue bar, set badge add/skip, and preserved inline plate stack visualizer',
      p2.hasExThumb && p2.hasExPopBtn && p2.hasCueBar && p2.hasInlinePlateStack && p2.popOpenNoSheet && p2.popClosed && p2.hasStyAddSkip && p2.addedSet,
      JSON.stringify(p2));

    // Pillar 3: Unified Progress tab
    const p3 = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      st.S.sub = 'progress';
      st.S.rvSpan = 'week';
      _.draw();
      const mapOnWeek = !!document.querySelector('#view-train .tr-hm-card');
      const phdOnWeek = document.querySelectorAll('#view-train .tr-pg-wk').length === 4;

      st.S.rvSpan = 'block';
      _.draw();
      const mapOnBlock = !!document.querySelector('#view-train .tr-hm-card');
      const phdOnBlock = document.querySelectorAll('#view-train .tr-pg').length === 4;

      st.S.rvSpan = 'all';
      _.draw();
      const mapOnAll = !!document.querySelector('#view-train .tr-hm-card');
      const phdOnAll = document.querySelectorAll('#view-train .tr-pg').length === 4;

      const hasStrModeBtn = !!document.querySelector('#view-train [data-t="hmmode"][data-v="str"]');
      document.querySelector('#view-train [data-t="hmmode"][data-v="str"]').click();
      const strModeActive = st.S.hmMode === 'str' && !!document.querySelector('#view-train .tr-hm-card');

      const hasPgTog = !!document.querySelector('#view-train [data-t="pgtog"][data-v="on-pace"]');
      document.querySelector('#view-train [data-t="pgtog"][data-v="on-pace"]').click();
      const paceCollapsed = !!document.querySelector('#view-train [data-pg="on-pace"] .tr-pg-body.is-collapsed');
      document.querySelector('#view-train [data-t="pgexpall"]').click();
      const paceExpandedAll = !document.querySelector('#view-train [data-pg="on-pace"] .tr-pg-body.is-collapsed');

      return { mapOnWeek, phdOnWeek, mapOnBlock, phdOnBlock, mapOnAll, phdOnAll, hasStrModeBtn, strModeActive, hasPgTog, paceCollapsed, paceExpandedAll };
    });
    t.ok('Pillar 3 (Unified Progress): Front/Back body map across week/block/all, 3-way coloring mode (sets/rec/str), and collapsible PhD Analytics Lab cards',
      p3.mapOnWeek && p3.phdOnWeek && p3.mapOnBlock && p3.phdOnBlock && p3.mapOnAll && p3.phdOnAll &&
      p3.hasStrModeBtn && p3.strModeActive && p3.hasPgTog && p3.paceCollapsed && p3.paceExpandedAll,
      JSON.stringify(p3));

    // Pillar 4: History tab & Lift Sheet + mc-ohp fix + >=13px font size check
    const p4 = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      st.S.sub = 'history';
      st.S.hv = 'wo';
      _.draw();
      const hasWoTableAndFoot = !!document.querySelector('#view-train .tr-h-hdr') && !!document.querySelector('#view-train .tr-h-foot');
      document.querySelector('#view-train [data-t="wosheet"][data-id="w2"]').click();
      const hasPerformAgain = /Perform Again/.test((document.querySelector('.tr-sheet [data-t="redo"]') || {}).textContent || '');
      st.S.sheet = null;

      st.S.sub = 'lifts';
      _.draw();
      const liftRows = [...document.querySelectorAll('#view-train .tr-lrow')];
      const liftOrder = liftRows.map((el) => el.getAttribute('data-e')).join(',');
      const liftHasThumbSparkLast = liftRows.length === 2 &&
        !!liftRows[0].querySelector('.tr-ex-thumb') &&
        !!liftRows[0].querySelector('svg.tr-spark') &&
        /last best:/i.test(liftRows[0].textContent);

      // Open Lift Sheet on bb-squat and switch to About/Summary tab
      liftRows[0].click();
      document.querySelector('.tr-sheet [data-t="extab"][data-v="about"]').click();
      const hasSumKpi = !!document.querySelector('.tr-sheet .tr-ex-sumkpi');
      const hasPauseBtn = !!document.querySelector('.tr-sheet [data-t="expause"]');
      document.querySelector('.tr-sheet [data-t="expause"]').click();
      const mediaPaused = document.querySelector('.tr-sheet [data-t="expause"]').getAttribute('aria-pressed') === 'true';
      const mcOhpFixed = _.MEDIA['mc-ohp'] && _.MEDIA['mc-ohp'].src === 'art/lifts/sm-ohp.gif';

      const smallFonts = [...document.querySelectorAll('#view-train *')].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.fontSize) < 12.9;
      }).map((el) => el.tagName + '.' + el.className + ':' + getComputedStyle(el).fontSize);

      return { hasWoTableAndFoot, hasPerformAgain, liftOrder, liftHasThumbSparkLast, hasSumKpi, hasPauseBtn, mediaPaused, mcOhpFixed, smallFonts };
    });
    t.ok('Pillar 4 (History & Lifts): Strong-style 2-col workout cards + Perform Again, recency-sorted Lifts with avatar/sparkline/lastBest, Lift Sheet pause toggle, mc-ohp media fix, and >=13px fonts',
      p4.hasWoTableAndFoot && p4.hasPerformAgain && p4.liftOrder === 'bb-squat,bb-bench' &&
      p4.liftHasThumbSparkLast && p4.hasSumKpi && p4.hasPauseBtn && p4.mediaPaused &&
      p4.mcOhpFixed && p4.smallFonts.length === 0,
      JSON.stringify(p4));
    t.ok('no page errors through any of it', errs.length === 0, errs.join(' | '));

    await p.close();
  }
};
