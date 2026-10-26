/* Six weeks of a cut for tests/progress.test.js: weigh-ins, food, three weeks
 * of morning check-ins and four lifting days a week, made from a fixed seed so
 * every run draws the same charts. Run in the page (p.evaluate). */
module.exports = function () {
  var key = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var rnd = (function () { var s = 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
  localStorage.setItem('sh.door', 'demo');
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 204, act: 1.55, goal: 'cut1', goalLb: 180, goalSet: '2026-09-14' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
  var today = new Date(2026, 9, 26), ws = {}, days = {}, am = {}, wo = {};
  var lifts = { u: [['bb-bench', 205, 6], ['bb-row', 175, 8], ['bb-ohp', 125, 6], ['ez-curl', 80, 10]], l: [['bb-squat', 255, 6], ['bb-rdl', 225, 8], ['hip-thrust', 275, 10]] };
  var short = {};
  for (var i = 42; i >= 1; i--) {
    var d = new Date(today); d.setDate(today.getDate() - i);
    var k = key(d), dow = d.getDay(), wk = (42 - i) / 7;
    ws[k] = Math.round((204 - (42 - i) * 0.13 + (rnd() - 0.5) * 1.6) * 10) / 10;
    // most days at protein; about one in five short
    var isShort = rnd() < 0.2; short[k] = isShort;
    var lowCarb = rnd() < 0.25;
    days[k] = { b: [{ id: 'f:egg', x: 3, eaten: 1 }, { id: 'f:oats', x: lowCarb ? 0.5 : 1.5, eaten: 1 }],
      l: [{ id: 'f:chicken_breast', x: isShort ? 0.8 : 2.2, eaten: 1 }, { id: 'f:apple', x: 1, eaten: 1 }],
      d: [{ id: 'f:chicken_breast', x: isShort ? 0.7 : 2.0, eaten: 1 }, { id: 'f:oats', x: lowCarb ? 0.3 : 1.2, eaten: 1 }] };
    // check-ins from three weeks ago
    if (i <= 24) {
      var sl = Math.round((5.6 + rnd() * 3.0) * 4) / 4;
      am[k] = { sl: sl, sy: Math.round(5200 + rnd() * 5200), cr: rnd() < 0.9 ? 1 : 0, cf: { crio: 1 + Math.round(rnd()), pre: [1, 2, 4, 5].indexOf(dow) >= 0 ? 1 : 0 } };
      if (!am[k].cf.pre) delete am[k].cf.pre;
    }
    if ([1, 2, 4, 5].indexOf(dow) >= 0) {
      var set = dow === 1 || dow === 4 ? lifts.u : lifts.l;
      var prevD = new Date(d); prevD.setDate(d.getDate() - 1);
      var bad = short[key(prevD)] || (am[k] && am[k].sl < 7);
      var st = d.getTime() + 17 * 3600e3;
      wo['w' + i] = { id: 'w' + i, n: dow === 1 || dow === 4 ? 'Upper' : 'Lower', st: st, en: st + 3600e3, u: 'lb', dk: k,
        x: set.map(function (l) {
          var drift = l[0] === 'bb-ohp' ? -0.006 : 0.008;
          var w = Math.round(l[1] * (1 + drift * wk * 7 / 7 * 1) * (bad ? 0.975 : 1.01) / 5) * 5;
          return { e: l[0], s: [{ w: w, r: l[2], q: 2 }, { w: w, r: l[2] - 1, q: 1 }, { w: w, r: l[2] - 2, q: 1 }] };
        }) };
    }
  }
  ws['2026-10-26'] = 198.4;
  am['2026-10-26'] = { sl: 7.25, sy: 8412, cr: 1, cf: { crio: 2 } };
  localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
  localStorage.setItem('bsc.macroDays', JSON.stringify(days));
  localStorage.setItem('bsc.macroAm', JSON.stringify(am));
  localStorage.setItem('bsc.macroDrinks', JSON.stringify({ list: [{ id: 'crio', n: 'Crio Bru', mg: 10 }, { id: 'pre', n: 'Pre-workout', mg: 200 }], on: ['crio', 'pre'] }));
  localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [1, 2, 4, 5] }, ms: {}, cx: {}, ax: {}, wo: wo }));
};
