/* Clocks, days and stamps.
 *
 * Every device's copy of My Day and of Strengthen is merged newest-wins, by
 * stamps from the device's own clock, and every day is counted from the
 * device's own calendar. These are the places either of those was wrong:
 * a clock set a day fast, a timezone east of +11, a clock change at 23:30,
 * a save that failed under a stamp that did not, and a day that was still
 * being eaten counted as if it were over. */

const DAY = 86400000;

module.exports = {
  name: 'Clocks, days and stamps',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);

    // ---- a stamp from the future does not win forever ---------------------
    const capped = await p.evaluate((D) => {
      const L = window.__macroLab;
      L.merge({ t: { v: { p: 150, f: 60, c: 200 }, at: Date.now() + D } });
      return { at: (L.payload().t || {}).at, now: Date.now() };
    }, DAY);
    t.ok('a device a day fast has its stamp brought back to a few minutes ahead, not believed',
      capped.at > capped.now && capped.at <= capped.now + 5 * 60000 + 2000, JSON.stringify(capped));

    // ---- this device's clock, corrected against the server's --------------
    const skew = await p.evaluate(() => {
      const L = window.__macroLab, id = localStorage.getItem('bsc.clockId');
      const hear = (off, by) => {
        L.clockSent(Date.now() - 200);
        L.clockHear({ clk: { by: by || id, at: { toMillis: () => Date.now() + off } } }, false);
        return L.now() - Date.now();
      };
      const out = { hour: hear(3600e3), stranger: 0, small: 0, pending: 0 };
      // another device's label says nothing about this one's clock
      out.stranger = hear(-7 * 3600e3, 'someoneelse');
      // while the answer is still this device's own unsent copy, nothing is learned
      L.clockSent(Date.now() - 200);
      L.clockHear({ clk: { by: id, at: { toMillis: () => Date.now() - 7 * 3600e3 } } }, true);
      out.pending = L.now() - Date.now();
      /* and Strengthen stamps by the same clock: its cap on a future stamp
         sits an hour further on, where the corrected clock says now is */
      const tr = window.Train._;
      tr.merge({ act: { v: 'lift', at: Date.now() + 86400000 } });
      out.trainCap = tr.state().TS.act - Date.now();
      out.small = hear(30000);
      localStorage.removeItem('bsc.clockSkew');
      return out;
    });
    t.ok('a clock an hour slow learns the hour from the server’s time on its own write',
      Math.abs(skew.hour - 3600e3) < 5000, JSON.stringify(skew));
    t.ok('but not from another device’s write, nor from its own before the server has answered',
      Math.abs(skew.stranger - 3600e3) < 5000 && Math.abs(skew.pending - 3600e3) < 5000, JSON.stringify(skew));
    t.ok('Strengthen stamps by the corrected clock too',
      skew.trainCap > 3600e3 && skew.trainCap <= 3600e3 + 5 * 60000 + 5000, JSON.stringify(skew));
    t.ok('and half a minute out is network delay, not a wrong clock: nothing is corrected',
      skew.small === 0, JSON.stringify(skew));

    // ---- a save that failed is not stamped as kept ------------------------
    const kept = await p.evaluate(() => {
      const L = window.__macroLab, real = Storage.prototype.setItem;
      localStorage.removeItem('bsc.myStamps');
      Storage.prototype.setItem = function (k, v) {
        if (k === 'bsc.macroProfile') throw new DOMException('full', 'QuotaExceededError');
        return real.call(this, k, v);
      };
      L.merge({ pr: { v: { sex: 'f', age: 33, lb: 150 }, at: 5000 } });
      const whileFull = (L.payload().pr || {}).at || 0;
      Storage.prototype.setItem = real;
      L.merge({ pr: { v: { sex: 'f', age: 33, lb: 150 }, at: 5000 } });
      return { whileFull, after: (L.payload().pr || {}).at || 0 };
    });
    t.ok('the account’s profile that could not be saved (storage full) is not marked as had',
      kept.whileFull === 0, JSON.stringify(kept));
    t.ok('so the same copy is taken once there is room', kept.after === 5000, JSON.stringify(kept));

    // ---- only real weigh-ins arrive by the old shape ----------------------
    const ws = await p.evaluate(() => {
      const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + '-' +
        String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
      const v = {}; v[d(1)] = 'heavy'; v[d(2)] = 0; v[d(3)] = 181.5;
      window.__macroLab.merge({ w: { v: v, at: Date.now() - 1000 } });
      return { got: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}'), want: d(3) };
    });
    t.ok('a weigh-in from an old phone that is not a weight is left out',
      Object.keys(ws.got).length === 1 && ws.got[ws.want] === 181.5, JSON.stringify(ws));

    /* ---- an old day comes back from the account -------------------------
       It used to be turned away, once older than the 120 days the phone
       kept. Nothing is let go of since 2026-10-18 (Blake: "I would assume
       that I'm keeping everything"), so a day from years ago that the
       account still holds is taken back in, and is this phone's to say
       again. */
    const old = await p.evaluate(() => {
      window.__macroLab.merge({ sp: { '2020_01_01': { v: ['b'], at: Date.now() - 1000 } } });
      return { skip: JSON.parse(localStorage.getItem('bsc.macroSkip') || '{}'), sp: window.__macroLab.payload().sp || {} };
    });
    t.ok('a day years old that the account still holds is taken back in from it',
      JSON.stringify(old.skip['2020-01-01']) === '["b"]' && !!old.sp['2020_01_01'], JSON.stringify(old));

    // ---- foods from the other device are counted --------------------------
    const counted = await p.evaluate(() => {
      const k = (() => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })();
      const now = Date.now(), d = {};
      d[k.replace(/-/g, '_')] = { v: { b: [{ id: 'f:my:tamale', x: 1, eaten: 1 }] }, at: now };
      window.__macroLab.merge({ mf: { v: { tamale: { name: 'Tamale', unit: 'tamale', kcal: 268, p: 10, f: 12, c: 30 } }, at: now }, d: d });
      return window.__macroLab.daySummary(k).got;
    });
    t.ok('a food of your own that arrives from your other phone counts on the day it is on', counted > 200, counted);

    // ---- the week's averages leave out the day still being eaten -----------
    const wk = await p.evaluate(() => {
      const key = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + '-' +
        String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      days[key(1)] = { b: [{ id: 'f:my:tamale', x: 8, eaten: 1 }] };
      days[key(0)] = { b: [{ id: 'f:my:tamale', x: 1, eaten: 1 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
      window.__macroLab.merge({});             // no-op; the summary reads storage through mDay
      return { t: key(0) };
    });
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);
    const sum = await p.evaluate((k) => { const s = window.__macroLab.daySummary(k); return { kept: s.kept, avg: s.avg }; }, wk.t);
    t.ok('the seven-day average is of days that are over, not this afternoon',
      sum.kept === 1 && sum.avg > 2000, JSON.stringify(sum));

    // ---- the routine placed on a new today is not a newer day -------------
    const seeded = await p.evaluate(() => {
      localStorage.removeItem('bsc.macroDays');
      localStorage.removeItem('bsc.myStamps');
      const id = String(window.RECIPES[0].id);
      localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [
        { k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: id, x: 1 }] }, { k: 'l', n: 'Lunch', t: 'l' },
        { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
      return id;
    });
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    const pin = await p.evaluate((id) => {
      const x = new Date(), k = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[k] || {};
      const placed = (day.b || []).some((it) => String(it.id) === id);
      const sent = !!(window.__macroLab.payload().d || {})[k.replace(/-/g, '_')];
      // the account's today, written on the phone at breakfast, arrives
      const d = {}; d[k.replace(/-/g, '_')] = { v: { l: [{ id: 'f:my:tamale', x: 1, eaten: 1 }] }, at: 1000 };
      window.__macroLab.merge({ d: d });
      const now = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[k] || {};
      return { placed, sent, lunch: (now.l || []).length, pinnedStill: (now.b || []).length };
    }, seeded);
    t.ok('pinned food lands on a new today', pin.placed, JSON.stringify(pin));
    t.ok('but is not sent as if it were an edit to the day', !pin.sent, JSON.stringify(pin));
    t.ok('so the account’s own today, when it comes, is the day', pin.lunch === 1 && pin.pinnedStill === 0, JSON.stringify(pin));
    await p.context().close();

    // ---- day numbers east of +11 ------------------------------------------
    const nz = await t.fresh({ timezoneId: 'Pacific/Auckland' });
    const gaps = await nz.evaluate(() => {
      const N = window.__macroLab.dayN, bad = [];
      const d = new Date(2026, 0, 1);
      for (let i = 0; i < 500; i++) {
        const a = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        d.setDate(d.getDate() + 1);
        const b = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (N(b) - N(a) !== 1) bad.push(a + '>' + b + '=' + (N(b) - N(a)));
      }
      return bad;
    });
    t.ok('in Auckland every day is one more than the day before, across both clock changes', gaps.length === 0, gaps.join(' '));
    await nz.context().close();

    // ---- Strengthen: the day a session is due, across a clock change -------
    const ny = await t.fresh({ timezoneId: 'America/New_York' });
    await ny.clock.install({ time: new Date('2026-03-07T23:30:00-05:00') });   // a Saturday; clocks go forward that night
    await ny.reload();
    const due = await ny.evaluate(() => [window.Train._.dueSay(2), window.Train._.dueSay(3), window.Train._.dueSay(8)]);
    t.ok('two days from Saturday night is Monday, whatever the clocks do in between',
      due[0] === 'Monday' && due[1] === 'Tuesday' && due[2] === 'next Sunday', JSON.stringify(due));
    await ny.context().close();

    // ---- Strengthen: an import's times, when the app says they are UTC -----
    const im = await t.fresh({ timezoneId: 'America/Denver' });
    const at = await im.evaluate(() => {
      const f = window.Train._.imDate;
      return { utc: f('2024-09-24 18:30:00', 'mdy', true), local: f('2024-09-24 18:30:00', 'mdy', false),
        zoned: f('2024-09-24 18:30:00 +0000', 'mdy', false), bare: f('2024-09-24', 'mdy', true) };
    });
    t.ok('a Fitbod time with no zone written is read as the UTC Fitbod writes',
      at.utc === Date.UTC(2024, 8, 24, 18, 30) && at.zoned === at.utc && at.local !== at.utc, JSON.stringify(at));
    t.ok('and a bare date stays that calendar day', new Date(at.bare).getDate() === 24, JSON.stringify(at));

    // ---- Strengthen: this morning's session, after a quiet week -----------
    const quiet = await im.evaluate(() => {
      const tr = window.Train._, T = tr.state().T, now = Date.now();
      T.wo.today1 = { id: 'today1', n: 'Upper', st: now - 3600e3 > new Date().setHours(0, 0, 0, 0) ? now - 3600e3 : now - 60000,
        en: now - 30000, u: 'lb', x: [{ e: 'db-bench', s: [{ w: 40, r: 10, t: now - 40000 }] }] };
      T.wo.today1.dk = (() => { const x = new Date(T.wo.today1.st); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })();
      // saved, as the app saves a workout: a change made behind its back is not one it has to see
      localStorage.setItem('bsc.train', JSON.stringify(T)); tr.reload();
      const c = tr.checkin(now);
      return c.reads.map((r) => r.h);
    });
    t.ok('a check-in the morning of a session does not say there were no workouts this week',
      !quiet.some((h) => /No workouts this week/.test(h)), JSON.stringify(quiet));
    await im.context().close();
  }
};
