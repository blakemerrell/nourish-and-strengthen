/* What two phones agree on: an un-skip reaching the other phone, a cleared
 * morning staying cleared, every part that merges being saved, a push
 * carrying the change rather than the archive, "This device is right", and
 * the buttons that empty a device asking first.
 *
 * Part of the Nourish suite, split out of tests/macros.test.js: the page
 * helpers and the plan every page starts with are in tests/fixtures/nourish.js. */
const { nourish } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — two phones: skips, mornings, merges and pushes',
  async suite(t) {
    /* ---- and the un-skip reaches the other phone -------------------------
     * Half of a sync bug lives on the sending side. Un-skipping the last
     * skipped meal deletes the day's entry from MSKIP, and the payload was
     * built by walking MSKIP — so the day stopped being mentioned at all.
     * The document is written with merge: true, so an unmentioned day leaves
     * the server's copy of the skip standing: the other phone kept the meal
     * struck out and Fill kept walking past it.
     *
     * Asserted on the payload and then through the merge, because a test
     * that only exercised the merge would have passed throughout — the
     * empty-list branch it relies on was correct all along and simply never
     * received anything to run on. */
    const wire = await t.fresh({ viewport: { width: 390, height: 800 } });
    await wire.click('.tab[data-view="macros"]');
    await wire.waitForTimeout(300);
    const spOf = (pg) => pg.evaluate(() => {
      const sp = window.__macroLab.payload().sp || {};
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const enc = (d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()))
        .replace(/-/g, '_');
      return { has: Object.prototype.hasOwnProperty.call(sp, enc),
        v: sp[enc] ? sp[enc].v : null, at: sp[enc] ? sp[enc].at : 0 };
    });
    /* Skip lives in the meal's ⋯ menu, in the meal's sheet (trays and the
       meal sheet, 2026-10-04): the empty lunch's tray is opened and its menu
       pressed before Skip is there. */
    await wire.click('[data-mopen="l"]');
    await wire.waitForTimeout(250);
    await wire.click('#modalRoot [data-mmenu="l"]');
    await wire.waitForTimeout(250);
    await wire.evaluate(() => document.querySelector('[data-mskip="l"]').click());
    await wire.waitForTimeout(350);
    const sentSkip = await spOf(wire);
    t.ok('skipping a meal is something the payload says out loud',
      sentSkip.has && (sentSkip.v || []).indexOf('l') >= 0, JSON.stringify(sentSkip));
    await wire.evaluate(() => {
      // the skipped meal's sheet says so, with the way back on it
      const u = document.querySelector('#modalRoot .msh-skipped [data-mskip]');
      if (u) u.click();
    });
    await wire.waitForTimeout(350);
    const sentBack = await spOf(wire);
    t.ok('and so is taking it back — an empty list, not a silence',
      sentBack.has && Array.isArray(sentBack.v) && sentBack.v.length === 0 &&
        sentBack.at > 0, JSON.stringify(sentBack));

    /* The receiving half, fed exactly what the sending half now emits. */
    const landed = await wire.evaluate((wireSp) => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const key = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const enc = key.replace(/-/g, '_');
      /* This phone still believes the meal is skipped, stamped older than the
         un-skip the other one is sending. */
      localStorage.setItem('bsc.macroSkip', JSON.stringify({ [key]: ['l'] }));
      const st = JSON.parse(localStorage.getItem('bsc.myStamps') || '{}');
      st.sp = st.sp || {}; st.sp[key] = wireSp.at - 1000;
      localStorage.setItem('bsc.myStamps', JSON.stringify(st));
      return { before: JSON.parse(localStorage.getItem('bsc.macroSkip')),
        enc: enc, at: wireSp.at };
    }, sentBack);
    await wire.reload();
    await wire.waitForTimeout(400);
    const merged = await wire.evaluate((info) => {
      const doc = { sp: {} };
      doc.sp[info.enc] = { v: [], at: info.at };
      window.__macroLab.merge(doc);
      return JSON.parse(localStorage.getItem('bsc.macroSkip') || '{}');
    }, landed);
    t.ok('so the other phone stops striking the meal out',
      !Object.keys(merged).length || !(merged[Object.keys(merged)[0]] || []).length,
      'before ' + JSON.stringify(landed.before) + ' after ' + JSON.stringify(merged));
    await wire.context().close();

    /* ---- a morning you cleared stays cleared, on both phones --------------
     * The weight log was stamped as ONE value, the way the profile is. One
     * stamp for a whole map can say "mine is newer" and nothing else — so a
     * merge that replaced wholesale would drop every morning the newer phone
     * had not seen, and the merge that shipped unioned instead. Union has no
     * way to express a morning taken away, so clearing a weigh-in here and
     * opening the other phone brought it straight back. Since v271 that also
     * moves the targets, because the plan is built on the seven-day average.
     *
     * Stamped per morning now, like the day log and the closed days, with
     * zero meaning "no weigh-in for this morning" exactly as zero means
     * "reopened" over there. */
    const scale = await t.fresh({ viewport: { width: 390, height: 800 } });
    await scale.click('.tab[data-view="macros"]');
    await scale.waitForTimeout(300);
    const wPayload = (pg) => pg.evaluate(() => {
      const w = window.__macroLab.payload().w || {};
      const out = {};
      Object.keys(w).forEach((k) => { out[k.replace(/_/g, '-')] = w[k]; });
      return out;
    });
    const seedW = (pg, map, stampAt) => pg.evaluate((a) => {
      localStorage.setItem('bsc.macroWeights', JSON.stringify(a.map));
      const st = JSON.parse(localStorage.getItem('bsc.myStamps') || '{}');
      st.w = {};
      Object.keys(a.map).forEach((k) => { st.w[k] = a.at; });
      localStorage.setItem('bsc.myStamps', JSON.stringify(st));
    }, { map: map, at: stampAt });

    await seedW(scale, { '2026-09-01': 190, '2026-09-02': 189 }, 1000);
    await scale.reload();
    await scale.waitForTimeout(400);
    await scale.click('.tab[data-view="macros"]');
    await scale.waitForTimeout(300);

    /* Clearing a morning is a value the payload carries, not an absence. */
    const cleared = await scale.evaluate(() => {
      window.__macroLab.merge({ w: { '2026_09_02': { v: 0, at: 5000 } } });
      return { stored: JSON.parse(localStorage.getItem('bsc.macroWeights')),
        sent: window.__macroLab.payload().w['2026_09_02'] };
    });
    t.ok('a cleared morning is a zero the payload states, not a key it drops',
      cleared.stored['2026-09-02'] === undefined && cleared.sent &&
        cleared.sent.v === 0 && cleared.sent.at === 5000, JSON.stringify(cleared));

    /* And it does not come back on the next push from the other phone. */
    const resurrect = await scale.evaluate(() => {
      window.__macroLab.merge({ w: { '2026_09_01': { v: 190, at: 6000 },
        '2026_09_02': { v: 189, at: 4000 } } });
      return JSON.parse(localStorage.getItem('bsc.macroWeights'));
    });
    t.ok('and an older push carrying it again does not raise it',
      resurrect['2026-09-02'] === undefined && resurrect['2026-09-01'] === 190,
      JSON.stringify(resurrect));

    /* Weighing again on that date is newer, so it wins. */
    const relog = await scale.evaluate(() => {
      window.__macroLab.merge({ w: { '2026_09_02': { v: 187.5, at: 9000 } } });
      return JSON.parse(localStorage.getItem('bsc.macroWeights'));
    });
    t.ok('and standing on the scale again puts it back',
      relog['2026-09-02'] === 187.5, JSON.stringify(relog));

    /* The property that ruled out replacing the map wholesale: a phone that
       was offline when this morning was logged sends a NEWER map without it,
       and this morning must survive that. */
    const keptW = await scale.evaluate(() => {
      window.__macroLab.merge({ w: { '2026_09_03': { v: 186, at: 20000 } } });
      return JSON.parse(localStorage.getItem('bsc.macroWeights'));
    });
    t.ok('a newer phone that never saw a morning does not erase it',
      keptW['2026-09-01'] === 190 && keptW['2026-09-03'] === 186, JSON.stringify(keptW));

    /* A value of the wrong shape from another device is ignored, not stored.
       A string where `sn.to` wants a list used to land in storage and break
       the next render on every device that took it. */
    const bad = await scale.evaluate(() => {
      const before = {
        t: localStorage.getItem('bsc.macroTargets'),
        w: localStorage.getItem('bsc.macroWeights'),
        d: localStorage.getItem('bsc.macroDays'),
        sn: localStorage.getItem('bsc.macroSend'),
      };
      const moved = window.__macroLab.merge({
        t: { v: { p: '150', f: 60, c: 100 }, at: 9e12 },
        sl: { v: { list: 'breakfast' }, at: 9e12 },
        w: { '2026_09_04': { v: '185', at: 9e12 } },
        d: { '2026_09_04': { v: 'lunch', at: 9e12 },
          '2026_09_05': { v: { b: 'eggs' }, at: 9e12 } },
        dn: { '2026_09_04': { v: 'yes', at: 9e12 } },
        sp: { '2026_09_04': { v: [1, 2], at: 9e12 } },
        sn: { '2026_09_04': { v: { f: 'd', to: 'l' }, at: 9e12 } },
      });
      let threw = '';
      try { document.querySelector('.tab[data-view="macros"]').click(); } catch (e) { threw = e.message; }
      return { moved, threw, same: before.t === localStorage.getItem('bsc.macroTargets') &&
        before.w === localStorage.getItem('bsc.macroWeights') &&
        before.d === localStorage.getItem('bsc.macroDays') &&
        before.sn === localStorage.getItem('bsc.macroSend') };
    });
    t.ok('values of the wrong shape from another device are ignored, not stored',
      bad.moved === false && bad.same && !bad.threw, JSON.stringify(bad));

    const good = await scale.evaluate(() => {
      window.__macroLab.merge({ sn: { '2026_09_04': { v: { f: 'd', to: ['l'] }, at: 9e12 } } });
      return JSON.parse(localStorage.getItem('bsc.macroSend') || '{}')['2026-09-04'];
    });
    t.ok('and the same part in the right shape still lands',
      good && good.f === 'd' && good.to.join() === 'l', JSON.stringify(good));

    /* A phone still on the old build pushes the old single-stamped shape.
       It cannot express a deletion, so it is unioned exactly as before —
       guessing a deletion from an absent key would erase every morning that
       phone has not heard of. */
    const legacy = await scale.evaluate(() => {
      window.__macroLab.merge({ w: { v: { '2026-08-30': 192 }, at: 999999 } });
      return JSON.parse(localStorage.getItem('bsc.macroWeights'));
    });
    t.ok('and a phone on the old build is still understood',
      legacy['2026-08-30'] === 192 && legacy['2026-09-01'] === 190, JSON.stringify(legacy));
    await scale.context().close();

    /* The upgrade itself: a device arriving with one number where the map now
       goes. Read as a map that number swallows every write in silence, so it
       is converted at load with the old stamp standing for every morning
       already logged. */
    const upgrade = await t.fresh({ viewport: { width: 390, height: 800 } });
    await upgrade.evaluate(() => {
      localStorage.setItem('bsc.macroWeights',
        JSON.stringify({ '2026-09-01': 190, '2026-09-02': 189 }));
      localStorage.setItem('bsc.myStamps', JSON.stringify({ w: 4242 }));
    });
    await upgrade.reload();
    await upgrade.waitForTimeout(400);
    await upgrade.click('.tab[data-view="macros"]');
    await upgrade.waitForTimeout(300);
    const converted = await upgrade.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('bsc.myStamps'));
      const sent = window.__macroLab.payload().w;
      return { shape: typeof st.w, stamps: st.w,
        sent01: sent['2026_09_01'], sent02: sent['2026_09_02'] };
    });
    t.ok('a device upgrading turns its one weight stamp into one per morning',
      converted.shape === 'object' && converted.stamps['2026-09-01'] === 4242 &&
        converted.sent01.v === 190 && converted.sent02.at === 4242,
      JSON.stringify(converted));
    await upgrade.context().close();

    /* ---- every part that merges is a part that is saved ------------------
     *
     * The merge touched six stores and the line that saved them listed five.
     * `bsc.macroTrained` was the one left out, so a "trained today" arriving
     * from the other phone moved that day's carbohydrate — 63 g to 118 — and
     * then went back on the next reload with nothing said.
     *
     * It was four hand-written descriptions of the same list: the payload
     * builder, the merge, the save, and whichever writer stamped it. One copy
     * forgot a member, which is what hand-written lists do.
     *
     * So this walks the TABLE rather than naming tn: it merges one key into
     * every keyed part there is and insists each one survives a reload. A
     * seventh part added tomorrow is covered the day it is added. */
    const tblPg = await t.fresh({ viewport: { width: 390, height: 800 } });
    await tblPg.click('.tab[data-view="macros"]');
    await tblPg.waitForTimeout(300);
    const tblParts = await tblPg.evaluate(() => {
      const L = window.__macroLab;
      /* The parts, off the app's own table, so the test cannot fall behind
         the app. (The payload used to list them all; it now leaves out a part
         with nothing stamped in it, which on a fresh page is every one.) */
      const keyed = L.keyedParts();
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const day = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const enc = day.replace(/-/g, '_');
      /* A value each part will accept and keep: something truthy that is not
         an empty list and not a null. */
      /* Each in the shape its own store actually keeps. `sn` carries a LIST
         of meals the miss was sent to; a bare string there renders and throws,
         which is how this fixture found out. */
      const val = { w: 201.4, d: { b: [{ id: 150, x: 1, eaten: 0 }] }, dn: 1234567,
        tn: 1234567, sp: ['s'], sn: { to: ['l'] }, am: { sl: 7.5, cr: 1 } };
      const doc = {};
      keyed.forEach((k) => { doc[k] = { [enc]: { v: val[k], at: Date.now() } }; });
      L.merge(doc);
      return { keyed: keyed, day: day, missing: keyed.filter((k) => !val[k]) };
    });
    t.ok('the merge describes every keyed part in one place',
      tblParts.keyed.length >= 6 && tblParts.missing.length === 0,
      JSON.stringify(tblParts));
    await tblPg.reload();
    await tblPg.waitForTimeout(400);
    await tblPg.click('.tab[data-view="macros"]');
    await tblPg.waitForTimeout(300);
    const tblKept = await tblPg.evaluate((info) => {
      const enc = info.day.replace(/-/g, '_');
      const sent = window.__macroLab.payload();
      return info.keyed.map((k) => ({ part: k,
        kept: !!(sent[k] && sent[k][enc] && sent[k][enc].at) }));
    }, tblParts);
    t.ok('and every one of them survives the reload that follows',
      tblKept.every((r) => r.kept),
      JSON.stringify(tblKept.filter((r) => !r.kept)));

    /* ---- a push carries the change, not the archive -----------------------
     *
     * Ticking one plate used to re-upload the whole of My Day: fourteen days
     * of meals, a year of mornings, every stamp. Eight to twenty kilobytes to
     * say two hundred bytes' worth. It never cost money — Firestore bills per
     * document write and those were already debounced — it cost the phone's
     * data, radio and battery, on every tap.
     *
     * Measured against the whole rather than against a number typed here, so
     * the claim survives the day somebody adds a part. */
    const tblSizes = await tblPg.evaluate(() => {
      const L = window.__macroLab;
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const key = (x) => x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate());
      /* A year of mornings and a fortnight of meals, which is what the store
         actually looks like after a season of use. */
      const W = {};
      for (let i = 0; i < 365; i++) {
        const dd = new Date(d); dd.setDate(dd.getDate() - i);
        W[key(dd)] = 205 - i * 0.02;
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(W));
      return { w: W };
    });
    await tblPg.reload();
    await tblPg.waitForTimeout(400);
    await tblPg.click('.tab[data-view="macros"]');
    await tblPg.waitForTimeout(300);
    const tblPartial = await tblPg.evaluate(() => {
      const L = window.__macroLab;
      const J = (o) => (o ? JSON.stringify(o).length : 0);
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const d = new Date();
      const day = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      /* One ordinary change, through the door a tap uses. */
      /* The first push of a session is whole on purpose, so spend it before
         measuring what an ordinary change costs. */
      const firstWhole = J(L.takePush()) === J(L.payload());
      window.Store.addToDay(150, ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()], 1);
      L.balance();
      /* What the PUSH would send, not what the partial builder can build. A
         mutation that made every push whole again left the builder untouched,
         and a guard asking the builder went on passing. */
      const part = L.takePush();
      return { whole: J(L.payload()), partial: J(part), firstWhole: firstWhole, wholeParts: Object.keys(L.payload()).length,
        parts: part ? Object.keys(part) : [],
        days: part && part.d ? Object.keys(part.d) : [],
        today: day.replace(/-/g, '_') };
    });
    t.ok('the first push of a session carries everything',
      tblPartial.firstWhole, JSON.stringify(tblPartial));
    /* Not a tenth of the bytes any more: the whole used to be padded with a
       null for every part nothing was stamped in, and now carries only what
       this device has. Fewer parts than the whole, and fewer bytes, is the
       claim; the two below say which. */
    t.ok('and after that one change sends one change, not the whole archive',
      tblPartial.partial > 0 && tblPartial.partial < tblPartial.whole && tblPartial.parts.length < tblPartial.wholeParts,
      tblPartial.partial + ' of ' + tblPartial.whole + ' bytes, ' + tblPartial.parts.length + ' of ' + tblPartial.wholeParts + ' parts');
    t.ok('and it names only the day that moved',
      tblPartial.days.length === 1 && tblPartial.days[0] === tblPartial.today,
      JSON.stringify(tblPartial));
    /* A year of mornings is the bulk of the archive and none of the news. */
    t.ok('a year of weigh-ins does not ride along with a meal',
      tblPartial.parts.indexOf('w') < 0, JSON.stringify(tblPartial.parts));
    await tblPg.context().close();

    /* ---- "This device is right" keeps every stamp in its shape -----------
     *
     * The button once wrote one number over the weight map. Every morning
     * then shipped with a stamp of zero, which no other device would take,
     * and the next weigh-in tried to set a property on a number and threw —
     * the weight was stored, unstamped, and stayed home until a reload
     * converted the stamp back. It also restamped four parts of nine, so the
     * account could go on outvoting the closed days, skips, share choices and
     * custom foods it had just been told were wrong about.
     *
     * The lab presses it, because the sheet that carries the button only
     * renders signed in. The weigh-in afterwards is the proof: the harness
     * fails the suite on any thrown error, so a throw here cannot hide. */
    const claim = await t.fresh({ viewport: { width: 390, height: 800 } });
    await claim.evaluate(() => {
      localStorage.setItem('bsc.macroWeights',
        JSON.stringify({ '2026-09-01': 190, '2026-09-02': 189 }));
      localStorage.setItem('bsc.macroDone', JSON.stringify({ '2026-09-01': 1700000000000 }));
      localStorage.setItem('bsc.myStamps', JSON.stringify({
        w: { '2026-09-01': 4242, '2026-09-02': 4243 }, sp: { '2026-09-01': 4244 }, t: 4245 }));
    });
    await claim.reload();
    await claim.waitForTimeout(400);
    await claim.click('.tab[data-view="macros"]');
    await claim.waitForTimeout(300);
    const claimed = await claim.evaluate(() => {
      const before = Date.now();
      window.__macroLab.claim();
      const st = JSON.parse(localStorage.getItem('bsc.myStamps'));
      const sent = window.__macroLab.payload();
      const fresh = (v) => typeof v === 'number' && v >= before;
      return {
        shapes: ['d', 'dn', 'sp', 'sn', 'w'].map((k) => typeof st[k]).join(','),
        singles: ['t', 'pr', 'sl', 'mf'].every((k) => fresh(st[k])),
        mornings: fresh(st.w['2026-09-01']) && fresh(st.w['2026-09-02']),
        cleared: fresh(st.sp['2026-09-01']),
        closed: fresh(st.dn['2026-09-01']),
        sent: fresh(sent.w['2026_09_01'].at),
      };
    });
    t.ok('this device is right stamps every part, each in its own shape',
      claimed.shapes === 'object,object,object,object,object' && claimed.singles &&
        claimed.mornings && claimed.cleared && claimed.closed && claimed.sent,
      JSON.stringify(claimed));
    await claim.fill('#mWeight', '188.4');
    await claim.dispatchEvent('#mWeight', 'change');
    await claim.waitForTimeout(300);
    const afterClaim = await claim.evaluate(() => {
      const w = JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}');
      const st = JSON.parse(localStorage.getItem('bsc.myStamps'));
      const today = Object.keys(w).filter((k) => k !== '2026-09-01' && k !== '2026-09-02')[0];
      return { today, lb: w[today], stamp: today && st.w[today] };
    });
    t.ok('and the next weigh-in is stored and stamped',
      afterClaim.lb === 188.4 && typeof afterClaim.stamp === 'number' && afterClaim.stamp > 4245,
      JSON.stringify(afterClaim));
    await claim.context().close();

    /* ---- the buttons that empty this device ask first ---------------------
     *
     * Delete was asked; Sign out and "The account is right" were not, and
     * both call the same wipe. Sign in, lose the signal, log a day and a
     * weigh-in, tap Sign out: gone from the only place they existed. The
     * sheet only renders these signed in, so this reads the source — the
     * same way the sync door is counted — and asks two things of it: each
     * branch reaches the wipe through ask(), and the wipe names every My Day
     * key the file writes, since bsc.macroSend was once left off it and the
     * previous person's share choices reloaded into the next account.
     * Every script the page loads: the wipe itself is in src/clock.js now,
     * app.js keeping a one-line mForgetDay that calls it, and My Day's
     * stores are written from the parts as well as from app.js. */
    const fsW = require('fs'), pathW = require('path'), rootW = pathW.join(__dirname, '..');
    const sources = [...fsW.readFileSync(pathW.join(rootW, 'index.html'), 'utf8').matchAll(/<script src="(src\/[^"?]+\.js)/g)]
      .map((m) => fsW.readFileSync(pathW.join(rootW, m[1]), 'utf8')).join('\n');
    const wipes = ['pull', 'out', 'delete'].map((act) => {
      const at = sources.indexOf("if (act2 === '" + act + "')");
      const next = sources.indexOf('if (act2 ===', at + 10);
      const block = sources.slice(at, next > 0 ? next : at + 1400);
      const asks = block.indexOf('ask({'), wipe = block.indexOf('mForgetDay()'), del = block.indexOf('mDeleteAccount()');
      return act + ':' + (at > 0 && asks > 0 && asks < Math.max(wipe, del) ? 'asked' : 'silent');
    });
    t.ok('sign out, pull and delete each ask before emptying this device',
      wipes.every((w) => /asked$/.test(w)), wipes.join(' '));
    const wipeAt = sources.search(/function mForgetDay\(\) \{(?! return \w+\.mForgetDay\(\); \})/);
    const wipeList = wipeAt < 0 ? '' : sources.slice(wipeAt, wipeAt + 900);
    /* Every write of a My Day store goes through mPut now, which says so when
       the phone is full; a few still call setItem. Both are writes. */
    const storedKeys = Array.from(new Set((sources.match(/(?:setItem|mPut)\('bsc\.(macro\w+|myFoods|myStamps|myOwner)'/g) || [])
      .map((m) => m.replace(/^(?:setItem|mPut)\('/, '').replace(/'$/, ''))));
    const leftOff = storedKeys.filter((k) => wipeList.indexOf("'" + k + "'") < 0);
    t.ok('and the wipe names every My Day key the app writes',
      storedKeys.length >= 10 && leftOff.length === 0, leftOff.join(' ') || storedKeys.length + ' keys');
  },
});
