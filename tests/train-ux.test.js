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
          n: 'Lower A', u: 'kg', ms: 'uxms', w: 0, d: 1, dl: 0,
          x: [{ e: 'bb-squat', s: [{ w: 100, r: 6, t: now - 2 * 864e5 + 1000 }, { w: 100, r: 5, t: now - 2 * 864e5 + 2000 }] }],
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
      // Verify moretog actually hides and shows .tr-mrow
      const mrowVisibleBefore = getComputedStyle(document.querySelector('#view-train .tr-more .tr-mrow')).display !== 'none';
      document.querySelector('#view-train [data-t="moretog"]').click();
      const mrowHiddenAfterClick = getComputedStyle(document.querySelector('#view-train .tr-more .tr-mrow')).display === 'none';
      document.querySelector('#view-train [data-t="moretog"]').click();
      const mrowRestored = getComputedStyle(document.querySelector('#view-train .tr-more .tr-mrow')).display !== 'none';
      return { hasSeshEx, hasMoreTog, hasLitStrip, defaultCollapsed, expandedAfterClick, collapsedAgain, mrowVisibleBefore, mrowHiddenAfterClick, mrowRestored };
    });
    t.ok('Pillar 1 (Workout tab): collapsible exercise preview (seshex), litStrip, and Other ways to train toggle (moretog) hides/restores .tr-mrow',
      p1.hasSeshEx && p1.hasMoreTog && p1.hasLitStrip && p1.defaultCollapsed && p1.expandedAfterClick && p1.collapsedAgain &&
      p1.mrowVisibleBefore && p1.mrowHiddenAfterClick && p1.mrowRestored,
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
      const exPopBtn = document.querySelector('#view-train .tr-ex-h [data-t="expop"]');
      const hasExPopBtn = !!exPopBtn;
      const exPopRect = exPopBtn ? exPopBtn.getBoundingClientRect() : { width: 0, height: 0 };
      const exPopTapTargetOk = exPopRect.width >= 44 && exPopRect.height >= 44;

      // Single combined .tr-cue-bar (interactive button opening note sheet)
      const cueBars = document.querySelectorAll('#view-train .tr-ex[data-xi="0"] .tr-cue-bar');
      const hasSingleInteractiveCueBar = cueBars.length === 1 && cueBars[0].tagName === 'BUTTON' && cueBars[0].getAttribute('data-t') === 'note';
      const hasInlinePlateStack = !!document.querySelector('#trpl-0-0 .tr-stk');

      // Exercise menu popover (#trPop) opens without touching S.sheet, has >=44px items, and ignores click inside .tr-pop-card
      document.querySelector('#view-train [data-t="expop"][data-x="0"]').click();
      const popOpenNoSheet = !!document.querySelector('#trPop .tr-pop-card') && st.S.sheet === null;
      const popItemRect = document.querySelector('#trPop .tr-pop-item').getBoundingClientRect();
      const popItemTapOk = popItemRect.height >= 44;
      document.querySelector('#trPop .tr-pop-title').click();
      const popStillOpenAfterCardClick = !!document.querySelector('#trPop .tr-pop-card');

      // Pair / Superset action inside #trPop
      const hasPairAction = !!document.querySelector('#trPop [data-t="pair"][data-x="0"]');
      document.querySelector('#trPop [data-t="pair"][data-x="0"]').click();
      const pairedOk = !!st.LIVE.x[0].p && st.LIVE.x[0].p === st.LIVE.x[1].p;

      // 2-step armed Remove exercise inside #trPop when a set is done
      st.LIVE.x[0].s[0].t = Date.now();
      _.draw();
      document.querySelector('#view-train [data-t="expop"][data-x="0"]').click();
      document.querySelector('#trPop [data-t="rmex"][data-x="0"]').click();
      const armedInPop = st.S.arm === 'rm:0' && !!document.querySelector('#trPop .tr-pop-card') &&
        /Tap again/i.test((document.querySelector('#trPop [data-t="rmex"]') || {}).textContent || '');
      st.LIVE.x[0].s[0].t = 0;
      st.S.arm = '';
      document.querySelector('#trPop [data-t="popclose"]').click();
      const popClosed = !document.querySelector('#trPop .tr-pop-card');

      // Edge case: Rest timer running / redrawing while #trPop is open does not wipe #trPop
      document.querySelector('#view-train [data-t="expop"][data-x="0"]').click();
      _.draw();
      const popSurvivesDraw = !!document.querySelector('#trPop .tr-pop-card');
      document.querySelector('#trPop [data-t="popclose"]').click();

      // Set badge sheet has + Add set below (styadd) and Skip set (styskip)
      document.querySelector('#view-train [data-t="sty"][data-x="0"][data-s="0"]').click();
      const hasStyAddSkip = !!document.querySelector('.tr-sheet [data-t="styadd"]') && !!document.querySelector('.tr-sheet [data-t="styskip"]');
      const beforeSets = st.LIVE.x[0].s.length;
      document.querySelector('.tr-sheet [data-t="styadd"]').click();
      const afterAddSets = st.LIVE.x[0].s.length;
      st.S.sheet = null;

      // 1. Right-pinned ellipsis button even when .tr-fmw is empty (like Cable Pushdown C1)
      st.LIVE.x[2].e = 'cb-pushdown';
      st.LIVE.x[2].p = 'C';
      st.LIVE.x[2].s = [{ w: '', r: '', t: 0 }, { w: '', r: '', t: 0 }];
      _.draw();
      const ex2Hdr = document.querySelector('#view-train .tr-ex[data-xi="2"] .tr-ex-h');
      const ex2Fmw = document.querySelector('#trfm-2');
      const ex2Pop = document.querySelector('#view-train .tr-ex[data-xi="2"] .tr-expop-b');
      const fmwEmpty = ex2Fmw && ex2Fmw.innerHTML === '';
      const popPinnedRight = ex2Hdr && ex2Pop &&
        Math.abs(ex2Hdr.getBoundingClientRect().right - ex2Pop.getBoundingClientRect().right) <= 2;

      // 2. Inline rest divider + centered pill on paired lift with live countdown & rest sheet controls
      const wi = st.LIVE.x[0].s.findIndex((s) => !s.wu);
      st.LIVE.x[0].s[wi].w = 185;
      st.LIVE.x[0].s[wi].r = 8;
      _.draw();
      const rpill0 = document.querySelector('#trrdiv-0-' + wi);
      const hasPairedRestPill = !!rpill0 && !!document.querySelector('#trrdiv-2-0');
      const defaultRestTxt = rpill0 ? rpill0.getAttribute('data-rest-default') : '';
      document.querySelector('#view-train [data-t="tick"][data-x="0"][data-s="' + wi + '"]').click();
      const rsTracksSet = st.LIVE.rs && st.LIVE.rs.x === 0 && st.LIVE.rs.s === wi;
      const rpillTicking = document.querySelector('#trrdiv-0-' + wi);
      const pillShowsCountdown = !!rpillTicking && rpillTicking.classList.contains('is-ticking') &&
        /\u23f1/.test(rpillTicking.textContent);
      rpillTicking.click();
      const restSheetHasLiveBar = !!document.querySelector('.tr-sheet .tr-rest-live-box') &&
        !!document.querySelector('.tr-sheet [data-t="rest"][data-v="skip"]');
      document.querySelector('.tr-sheet [data-t="rest"][data-v="skip"]').click();
      st.S.sheet = null;
      _.draw();
      const rpillAfterSkip = document.querySelector('#trrdiv-0-' + wi);
      const pillRestoredAfterSkip = !!rpillAfterSkip && !rpillAfterSkip.classList.contains('is-ticking') &&
        rpillAfterSkip.textContent === defaultRestTxt;

      // Verify custom rest on a paired lift (C1) and early next-set tick cleanup
      document.querySelector('#trrdiv-2-0').click();
      document.querySelector('.tr-sheet [data-t="restset"][data-v="90"]').click();
      const pairedRestCustomOk = document.querySelector('#trrdiv-2-0').getAttribute('data-rest-default') === '1:30';
      st.LIVE.x[2].s[0].w = 50; st.LIVE.x[2].s[0].r = 12;
      st.LIVE.x[2].s[1].w = 50; st.LIVE.x[2].s[1].r = 12;
      _.draw();
      document.querySelector('#view-train [data-t="tick"][data-x="2"][data-s="0"]').click();
      const c1PillTicking = document.querySelector('#trrdiv-2-0').classList.contains('is-ticking') && st.LIVE.rs.dur === 90;
      document.querySelector('#view-train [data-t="tick"][data-x="2"][data-s="1"]').click();
      const c1PillClearedOnNextSet = !document.querySelector('#trrdiv-2-0').classList.contains('is-ticking') &&
        document.querySelector('#trrdiv-2-0').textContent === '1:30';

      // 3. Hide / Show exercise explanation toggle (exinfotog) preserves .tr-ex-safety (AMRAP/ASST/SAFETY/barHere)
      st.LIVE.x[0].s[st.LIVE.x[0].s.length - 1].am = 1;
      _.draw();
      const hideBtn = document.querySelector('#view-train .tr-ex[data-xi="0"] [data-t="exinfotog"]');
      hideBtn.click();
      const safetyEl = document.querySelector('#view-train .tr-ex[data-xi="0"] .tr-ex-safety');
      const infoHidden = st.T.pr.hideExInfo === 1 &&
        !!document.querySelector('#view-train .tr-ex[data-xi="0"] .tr-ex-info.is-hidden') &&
        !!document.querySelector('#view-train .tr-ex[data-xi="0"] .tr-ex-infoshow') &&
        !!safetyEl && getComputedStyle(safetyEl).display !== 'none';
      delete st.LIVE.x[0].s[st.LIVE.x[0].s.length - 1].am;
      document.querySelector('#view-train .tr-ex[data-xi="0"] .tr-ex-infoshow').click();
      const infoShownAgain = st.T.pr.hideExInfo === 0 &&
        !document.querySelector('#view-train .tr-ex[data-xi="0"] .tr-ex-info.is-hidden');

      // 4. Finish sheet prompts for unanswered p, k, and j (joints) even on non-block workouts
      st.LIVE.ms = '';
      st.LIVE.fb = {};
      document.querySelector('#view-train [data-t="finish"]').click();
      const finishPromptsAllThree = !!document.querySelector('.tr-sheet [data-t="fb"][data-m="chest"][data-f="p"]') &&
        !!document.querySelector('.tr-sheet [data-t="fb"][data-m="chest"][data-f="k"]') &&
        !!document.querySelector('.tr-sheet [data-t="fb"][data-m="chest"][data-f="j"]');

      st.S.sheet = null;
      localStorage.removeItem('sh.trainLive');
      _.reload();
      return {
        hasExThumb, hasExPopBtn, exPopTapTargetOk, hasSingleInteractiveCueBar, hasInlinePlateStack,
        popOpenNoSheet, popItemTapOk, popStillOpenAfterCardClick, hasPairAction, pairedOk,
        armedInPop, popClosed, popSurvivesDraw, hasStyAddSkip, addedSet: afterAddSets === beforeSets + 1,
        fmwEmpty, popPinnedRight, hasPairedRestPill, rsTracksSet, pillShowsCountdown,
        restSheetHasLiveBar, pillRestoredAfterSkip, pairedRestCustomOk, c1PillTicking,
        c1PillClearedOnNextSet, infoHidden, infoShownAgain, finishPromptsAllThree
      };
    });
    t.ok('Pillar 2 (Live Logger): right-pinned header menu, inline rest pill live countdown, exercise info toggle, #trPop menu, single interactive cue bar, set badge add/skip, and Finish sheet p/k/j feedback prompt',
      p2.hasExThumb && p2.hasExPopBtn && p2.exPopTapTargetOk && p2.hasSingleInteractiveCueBar && p2.hasInlinePlateStack &&
      p2.popOpenNoSheet && p2.popItemTapOk && p2.popStillOpenAfterCardClick && p2.hasPairAction && p2.pairedOk &&
      p2.armedInPop && p2.popClosed && p2.popSurvivesDraw && p2.hasStyAddSkip && p2.addedSet &&
      p2.fmwEmpty && p2.popPinnedRight && p2.hasPairedRestPill && p2.rsTracksSet && p2.pillShowsCountdown &&
      p2.restSheetHasLiveBar && p2.pillRestoredAfterSkip && p2.pairedRestCustomOk && p2.c1PillTicking &&
      p2.c1PillClearedOnNextSet && p2.infoHidden && p2.infoShownAgain && p2.finishPromptsAllThree,
      JSON.stringify(p2));

    // Pillar 3: Unified Progress tab
    const p3 = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      st.S.sub = 'progress';
      st.S.rvSpan = 'week';
      _.draw();
      const mapOnWeek = !!document.querySelector('#view-train .tr-hm-card');
      const phdOnWeek = document.querySelectorAll('#view-train .tr-pg-wk').length === 4;
      const collapsedWeekHasL0 = document.querySelectorAll('#view-train .tr-pg-wk .tr-pg-l0').length === 4;

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
      const paceCollapsed = !!document.querySelector('#view-train [data-pg="on-pace"] .tr-pg-body.is-collapsed') &&
        !!document.querySelector('#view-train [data-pg="on-pace"] .tr-pg-l0');
      document.querySelector('#view-train [data-t="pgexpall"]').click();
      const paceExpandedAll = !document.querySelector('#view-train [data-pg="on-pace"] .tr-pg-body.is-collapsed');

      return { mapOnWeek, phdOnWeek, collapsedWeekHasL0, mapOnBlock, phdOnBlock, mapOnAll, phdOnAll, hasStrModeBtn, strModeActive, hasPgTog, paceCollapsed, paceExpandedAll };
    });
    t.ok('Pillar 3 (Unified Progress): Front/Back body map across week/block/all, 3-way coloring mode (sets/rec/str), and collapsible PhD Analytics Lab cards with L0 executive takeaway',
      p3.mapOnWeek && p3.phdOnWeek && p3.collapsedWeekHasL0 && p3.mapOnBlock && p3.phdOnBlock && p3.mapOnAll && p3.phdOnAll &&
      p3.hasStrModeBtn && p3.strModeActive && p3.hasPgTog && p3.paceCollapsed && p3.paceExpandedAll,
      JSON.stringify(p3));

    // Pillar 4: History tab & Lift Sheet + mc-ohp fix + >=13px font size check
    const p4 = await p.evaluate(() => {
      const _ = window.Train._, st = _.state();
      st.S.sub = 'history';
      st.S.hv = 'wo';
      _.draw();
      const hasWoTableAndFoot = !!document.querySelector('#view-train .tr-h-hdr') &&
        !!document.querySelector('#view-train .tr-h-foot') &&
        [...document.querySelectorAll('#view-train .tr-h-x br')].every((br) => getComputedStyle(br).display === 'none');
      const w2CardTxt = (document.querySelector('#view-train [data-t="wosheet"][data-id="w2"]') || {}).textContent || '';
      const singleUnitConvInHistory = /220\.5 lb \u00d7 6/.test(w2CardTxt);
      document.querySelector('#view-train [data-t="wosheet"][data-id="w2"]').click();
      const hasPerformAgain = /Perform Again/.test((document.querySelector('.tr-sheet [data-t="redo"]') || {}).textContent || '');
      st.S.sheet = null;

      st.S.sub = 'lifts';
      _.draw();
      const liftRows = [...document.querySelectorAll('#view-train .tr-lrow')];
      const liftOrder = liftRows.map((el) => el.getAttribute('data-e')).join(',');
      const thumbRect = liftRows[0].querySelector('.tr-ex-thumb').getBoundingClientRect();
      const nameRect = liftRows[0].querySelector('.tr-l-n').getBoundingClientRect();
      const bestText = liftRows[0].querySelector('.tr-l-b').textContent;
      const liftHasThumbSparkLast = liftRows.length === 2 &&
        thumbRect.right <= nameRect.left + 2 &&
        !!liftRows[0].querySelector('svg.tr-spark') &&
        /last best: 220\.5 lb \u00d7 6/i.test(bestText);

      // Open Lift Sheet on bb-squat and switch to About/Summary tab
      liftRows[0].click();
      document.querySelector('.tr-sheet [data-t="extab"][data-v="about"]').click();
      const hasSumKpi = !!document.querySelector('.tr-sheet .tr-ex-sumkpi');
      const pauseBtnsBefore = document.querySelectorAll('.tr-sheet [data-t="expause"]').length;
      document.querySelector('.tr-sheet [data-t="expause"]').click();
      const pauseBtnsAfter = document.querySelectorAll('.tr-sheet [data-t="expause"]').length;
      const mediaPaused = pauseBtnsBefore === 1 && pauseBtnsAfter === 1 &&
        document.querySelector('.tr-sheet [data-t="expause"]').getAttribute('aria-pressed') === 'true';
      const mcOhpFixed = _.MEDIA['mc-ohp'] && _.MEDIA['mc-ohp'].src === 'art/lifts/sm-ohp.gif';

      const smallFonts = [...document.querySelectorAll('#view-train *')].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.fontSize) < 12.9;
      }).map((el) => el.tagName + '.' + el.className + ':' + getComputedStyle(el).fontSize);

      return { hasWoTableAndFoot, singleUnitConvInHistory, hasPerformAgain, liftOrder, liftHasThumbSparkLast, hasSumKpi, mediaPaused, mcOhpFixed, smallFonts };
    });
    t.ok('Pillar 4 (History & Lifts): Strong-style 2-col workout cards + Perform Again, single kg->lb conversion on Best set, 3-col Lifts cards with avatar/sparkline/lastBest, single Lift Sheet pause toggle, mc-ohp media fix, and >=13px fonts',
      p4.hasWoTableAndFoot && p4.singleUnitConvInHistory && p4.hasPerformAgain && p4.liftOrder === 'bb-squat,bb-bench' &&
      p4.liftHasThumbSparkLast && p4.hasSumKpi && p4.mediaPaused &&
      p4.mcOhpFixed && p4.smallFonts.length === 0,
      JSON.stringify(p4));
    t.ok('no page errors through any of it', errs.length === 0, errs.join(' | '));

    await p.close();
  }
};

