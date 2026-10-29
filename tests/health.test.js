/* Two-way Android Health Connect sync and native Google Sign-In bridge. */
module.exports = {
  name: 'Android Health Connect two-way sync and native bridge',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 9, 6, 9, 30, 0));
    await p.reload();

    // 1. In a regular browser, Health Connect is quiet and hidden
    const webAvail = await p.evaluate(() => window.Health && window.Health.available());
    t.ok('in a plain browser, Health.available() is false', webAvail === false);

    // 2. Install mock NourishAndroid bridge and seed day before reload
    await p.evaluate(() => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 185, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 65, c: 210 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'kmtg40w4z0', n: 'Wake Up', t: 'x', w: 15, secs: ['1-1'] },
          { k: 'b', n: 'Breakfast', t: 'x', w: 25, secs: ['1-1', '1-2'] },
          { k: 'l', n: 'Lunch', t: 'x', w: 20, secs: ['1-3'] },
          { k: 'd', n: 'Dinner', t: 'x', w: 30, secs: ['1-4'] },
          { k: 's', n: 'Evening Snack', t: 'x', w: 10, secs: ['1-5'] }
        ],
        names: {
          kmtg40w4z0: 'Wake Up',
          b: 'Breakfast',
          l: 'Lunch',
          d: 'Dinner',
          s: 'Evening Snack'
        }
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        '2026-10-06': {
          b: [{ id: 'f:egg', x: 3, eaten: 0 }, { id: 'f:oats', x: 1, eaten: 0 }]
        },
        '2026-10-07': {
          kmtg40w4z0: [{ id: 'f:whey', x: 1, eaten: 0 }],
          b: [{ id: 'f:egg', x: 2, eaten: 0 }],
          l: [{ id: 'f:roast_beef_deli', x: 2, eaten: 0 }],
          d: [{ id: 244, x: 1, eaten: 0 }],
          s: [{ id: 'f:apple', x: 1, eaten: 0 }]
        }
      }));
    });
    await p.reload();
    await p.evaluate(() => {
      window.__hcCalls = { perm: 0, sync: 0, weights: [], meals: [], workouts: [], google: [] };
      window.__hcStatus = 'needs_permission';
      window.NourishAndroid = {
        getHealthStatus: function () {
          return JSON.stringify({ available: true, status: window.__hcStatus, lastSync: 1760000000000 });
        },
        requestHealthPermissions: function () {
          window.__hcCalls.perm++;
          window.__hcStatus = 'granted';
        },
        syncHealthNow: function () {
          window.__hcCalls.sync++;
        },
        writeWeight: function (json) {
          window.__hcCalls.weights.push(JSON.parse(json));
        },
        writeNutrition: function (json) {
          window.__hcCalls.meals.push(JSON.parse(json));
        },
        writeWorkout: function (json) {
          window.__hcCalls.workouts.push(JSON.parse(json));
        },
        signInGoogle: function (cid) {
          window.__hcCalls.google.push(cid);
        }
      };
    });

    const androidAvail = await p.evaluate(() => ({
      avail: window.Health.available(),
      state: window.Health.state(),
      install: window.Install.state()
    }));
    t.ok('with NourishAndroid present, Health.available() is true and Install.state() is app',
      androidAvail.avail === true && androidAvail.state === 'needs_permission' && androidAvail.install === 'app',
      JSON.stringify(androidAvail));

    // Open Sync & sharing sheet and connect Health Connect
    await p.click('#syncBtn');
    const hasConnectBtn = await p.isVisible('[data-mysync="health-connect"]');
    t.ok('Sync sheet shows Connect Health Connect button when permission is needed', hasConnectBtn);
    await p.click('[data-mysync="health-connect"]');

    // 3. Deliver inbound Health Connect data (Steps, Sleep, Scale Weight)
    const inbound = await p.evaluate(() => {
      window.Health.onData(JSON.stringify({
        status: 'granted',
        syncedAt: Date.now(),
        days: {
          '2026-10-05': { steps: 9420, sleepHours: 7.25, weightLb: 185.0 },
          '2026-10-06': { steps: 4150, sleepHours: 7.75, weightLb: 184.4 }
        }
      }));
      return {
        am06: JSON.parse(localStorage.getItem('bsc.macroAm') || '{}')['2026-10-06'],
        w06: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')['2026-10-06'],
        todaySteps: window.Health.todaySteps(),
        echoedWeights: window.__hcCalls.weights.length,
        prog: window.Hive.progress('2026-10-05', '2026-10-06')
      };
    });
    t.ok('inbound sleep (7.75h) and yesterday steps (9,420) populate morning check-in for 2026-10-06',
      inbound.am06 && inbound.am06.sl === 7.75 && inbound.am06.sy === 9420,
      JSON.stringify(inbound.am06));
    t.ok('inbound scale weight (184.4 lb) populates MWEIGHTS without echoing a writeWeight call back',
      inbound.w06 === 184.4 && inbound.echoedWeights === 0,
      JSON.stringify(inbound));
    t.ok('today live steps (4,150) are tracked and Review progress maps 9,420 steps back onto 2026-10-05',
      inbound.todaySteps === 4150 && inbound.prog && inbound.prog.days.some((d) => d.k === '2026-10-05' && d.sy === 9420),
      JSON.stringify(inbound.prog));

    const hasSyncNowBtn = await p.isVisible('[data-mysync="health-sync"]');
    t.ok('Sync sheet updates to show Sync now button and today steps once granted', hasSyncNowBtn);

    // 4. Outbound writes: Weigh-in, Eaten Meal, and Completed Workout
    const outbound = await p.evaluate(() => {
      window.Hive.weigh('2026-10-06', 183.6, { force: true, was: 184.4 });
      window.Hive.eat('b', '2026-10-06');
      window.Hive.trained('2026-10-06', { id: 'w_test1', st: 1760000000000, en: 1760003600000, n: 'Upper A', nt: 'PR on curls' });
      return window.__hcCalls;
    });
    t.ok('logging a weigh-in pushes WeightRecord to NourishAndroid.writeWeight',
      outbound.weights.length === 1 && outbound.weights[0].dayKey === '2026-10-06' && outbound.weights[0].lb === 183.6,
      JSON.stringify(outbound.weights));
    t.ok('ticking a meal eaten pushes NutritionRecord to NourishAndroid.writeNutrition with macros',
      outbound.meals.length === 1 && outbound.meals[0].slot === 'b' && outbound.meals[0].kcal > 300 && outbound.meals[0].p > 20,
      JSON.stringify(outbound.meals));
    t.ok('finishing a workout pushes ExerciseSessionRecord to NourishAndroid.writeWorkout',
      outbound.workouts.length === 1 && outbound.workouts[0].id === 'nourish-wo-w_test1' && /Upper A/.test(outbound.workouts[0].title),
      JSON.stringify(outbound.workouts));

    // 5. Custom-section meal slots (t === 'x') still resolve to their actual Health Connect mealType (b, l, d, s)
    const customSlotsMeals = await p.evaluate(() => {
      window.__hcCalls.meals = [];
      window.Hive.eat('kmtg40w4z0', '2026-10-07');
      window.Hive.eat('b', '2026-10-07');
      window.Hive.eat('l', '2026-10-07');
      window.Hive.eat('d', '2026-10-07');
      window.Hive.eat('s', '2026-10-07');
      return window.__hcCalls.meals;
    });
    const byType = {};
    customSlotsMeals.forEach((m) => { byType[m.mealType] = m; });
    t.ok('custom-section slots (t: "x") map to b (Breakfast + Wake Up), l (Lunch), d (Dinner), and s (Snacks) instead of falling through to "x"',
      byType.b && byType.b.slot === 'b' && byType.b.kcal > 200 &&
      byType.l && byType.l.slot === 'l' && byType.l.kcal > 50 &&
      byType.d && byType.d.slot === 'd' && byType.d.kcal > 100 &&
      byType.s && byType.s.slot === 's' && byType.s.kcal > 50,
      JSON.stringify(customSlotsMeals));

    // 6. Native Google Sign-In bridge
    const gCid = await p.evaluate(() => {
      window.Store.signInGoogle().catch(() => {});
      const cid = window.__hcCalls.google[0];
      window.Store.onNativeGoogleToken(null, 'cancelled');
      return cid;
    });
    t.ok('Store.signInGoogle() routes through NourishAndroid.signInGoogle with GOOGLE_CLIENT_ID',
      typeof gCid === 'string' && gCid.indexOf('.apps.googleusercontent.com') > 0,
      String(gCid));

    t.ok('no page errors', errs.length === 0, errs.join('; '));
  }
};
