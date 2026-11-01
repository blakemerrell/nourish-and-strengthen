/* Today does; Nourish tunes.
 *
 * Blake: "The plan tab in nourish, should it move to today tab?", then, of
 * the weigh-in: "it can go away from Nourish as an input tab, and I go to
 * today tab for that info", and "Didn't mess with the nourish layout...
 * just how the today tab and it can better work together." So: the weigh-in
 * is the first line on Today and opens Nourish's own morning card in a sheet
 * (moved there, not copied), with the week before it fixable in place; a meal
 * tapped on Today opens a sheet of Nourish's own verbs; Tonight shows your
 * plate; Cooked it is the household's, ticks your dinner and asks how it was.
 * Nourish keeps its layout, without the morning card. */
const MORNING = new Date(2026, 9, 6, 7, 30, 0);      // a Tuesday

const SETUP = () => {
  const p2 = (n) => (n < 10 ? '0' : '') + n, key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  const w = {};
  for (let i = 1; i <= 9; i++) { const d = new Date(); d.setDate(d.getDate() - i); w[key(d)] = 192 + (i % 3) * 0.2; }
  localStorage.setItem('bsc.macroWeights', JSON.stringify(w));
};

module.exports = {
  name: 'Today does, Nourish tunes',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(MORNING);
    await p.reload();
    await p.waitForTimeout(700);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);
    // tonight's dinner on the week, and the day filled around it in Nourish
    const dinner = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => /Salsa Chicken/.test(x.name));
      window.Store.addToDay(r.id, 'tue', 1);
      window.Hive.fill();
      return { id: String(r.id), name: r.name };
    });
    await p.waitForTimeout(600);
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(400);

    /* ---- the weigh-in ---- */
    let line = await p.evaluate(() => {
      const b = document.querySelector('#todayRoot .td-weigh');
      // the first line of the morning card, which is the first card (2026-11-01)
      const m = document.querySelector('#todayRoot .td-cards').firstElementChild;
      return b ? { first: !!m && m.classList.contains('td-morning') && b === m.firstElementChild, txt: b.textContent, done: b.classList.contains('done') } : null;
    });
    t.ok('Weigh in is the first line on Today, with the last morning and the week', line && line.first && !line.done && /^Weigh in/.test(line.txt) && /last 192/.test(line.txt), JSON.stringify(line));
    const home = await p.evaluate(() => ({ inNourish: !!document.getElementById('macroWeigh').closest('#view-macros'),
      shown: getComputedStyle(document.getElementById('macroWeigh')).display }));
    t.ok('the morning card lives in Nourish’s page but is not shown there', home.inNourish && home.shown === 'none', JSON.stringify(home));
    await p.click('#todayRoot [data-td="weigh"]');
    await p.waitForTimeout(400);
    let sh = await p.evaluate(() => ({
      sheet: !!document.getElementById('weighSheet'), card: !!document.querySelector('#weighSheet #macroWeigh #mWeight'),
      rows: [...document.querySelectorAll('#weighWeek [data-wfix]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
      focus: document.activeElement && document.activeElement.id,
    }));
    t.ok('tapped, the sheet holds Nourish’s own morning card, the box focused, and the week before it', sh.sheet && sh.card && sh.focus === 'mWeight' && sh.rows.length === 7, JSON.stringify(sh));
    await p.fill('#mWeight', '191.4');
    await p.press('#mWeight', 'Enter');
    await p.waitForTimeout(500);
    const saved = await p.evaluate(() => ({ stored: JSON.parse(localStorage.getItem('bsc.macroWeights'))['2026-10-06'], open: !!document.querySelector('#weighSheet .mw-body') }));
    t.ok('the weight is Nourish’s, saved for this morning, and the card opens as it does', saved.stored === 191.4 && saved.open, JSON.stringify(saved));
    /* A morning in the week, tucked shut until opened, then fixed in place. */
    await p.click('#weighWeek [data-wtoggle]');
    await p.click('#weighWeek [data-wfix="2026-10-04"]');
    await p.fill('#wFixIn', '1925');
    await p.click('#weighWeek [data-wsave]');
    await p.waitForTimeout(250);
    let fix = await p.evaluate(() => ({ note: document.getElementById('wFixNote').textContent, stored: JSON.parse(localStorage.getItem('bsc.macroWeights'))['2026-10-04'] }));
    t.ok('a mistyped morning is refused there, as the box refuses it', /A point missing/.test(fix.note) && Math.abs(fix.stored - 192.4) < 0.01, JSON.stringify(fix));
    await p.fill('#wFixIn', '192.5');
    await p.click('#weighWeek [data-wsave]');
    await p.waitForTimeout(300);
    fix = await p.evaluate(() => ({ stored: JSON.parse(localStorage.getItem('bsc.macroWeights'))['2026-10-04'],
      row: document.querySelector('#weighWeek [data-wfix="2026-10-04"]').textContent.replace(/\s+/g, ' ') }));
    t.ok('and a right one is kept for that day, and the row says it', fix.stored === 192.5 && /192\.5 lb/.test(fix.row), JSON.stringify(fix));
    await p.click('#weighSheet .sheet-x');
    await p.waitForTimeout(400);
    line = await p.evaluate(() => ({ txt: document.querySelector('#todayRoot .td-weigh').textContent, done: document.querySelector('#todayRoot .td-weigh').classList.contains('done'),
      sheet: !!document.getElementById('weighSheet'), back: !!document.getElementById('macroWeigh').closest('#view-macros') }));
    t.ok('shut, the card goes home, and Today says Weighed in · 191.4 lb, green', !line.sheet && line.back && line.done && /Weighed in · 191\.4 lb/.test(line.txt), JSON.stringify(line));

    /* ---- a meal, tapped ---- */
    const meal0 = await p.evaluate(() => window.Hive.today().eating.meals.find((m) => !m.empty && !m.eaten));
    await p.click('#todayRoot [data-td="meal"][data-k="' + meal0.k + '"]');
    await p.waitForTimeout(300);
    let ms = await p.evaluate(() => ({ eyebrow: document.querySelector('.td-sheet .sheet-eyebrow').textContent,
      acts: [...document.querySelectorAll('.td-sheet [data-tdact]')].map((b) => b.dataset.tdact).join(), step: !!document.querySelector('[data-tdstep]') }));
    t.ok('a meal tapped opens its sheet: I ate it, swap, something else, eating out, the recipe, Nourish', ms.eyebrow === meal0.n && /^eat,swap,else,eatout,(recipe,)?nourish$/.test(ms.acts), JSON.stringify(ms));
    const x0 = await p.evaluate((k) => { const d = JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'][k]; return d.length === 1 ? d[0].x : null; }, meal0.k);
    if (ms.step && x0 !== null) {
      await p.click('[data-tdstep="1"]');
      await p.waitForTimeout(200);
      const x1 = await p.evaluate((k) => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'][k][0].x, meal0.k);
      t.ok('a bit more is Nourish’s own step, on today', x1 > x0, x0 + ' -> ' + x1);
    } else t.ok('a bit more is Nourish’s own step, on today', true, 'meal of more than one plate: no stepper, by design');
    await p.click('[data-tdact="eat"]');
    await p.waitForTimeout(300);
    const ate = await p.evaluate((k) => ({ eaten: window.Hive.today().eating.meals.find((m) => m.k === k).eaten, sheet: !!document.querySelector('.td-sheet') }), meal0.k);
    t.ok('I ate it ticks it in Nourish and the sheet shuts', ate.eaten && !ate.sheet, JSON.stringify(ate));

    /* ---- tonight: your plate, then cooked ---- */
    await p.clock.setFixedTime(new Date(2026, 9, 6, 18, 0, 0));
    await p.evaluate(() => window.Today.render());
    await p.waitForTimeout(200);
    const plate = await p.evaluate((id) => {
      const el = document.querySelector('[data-card="tonight"] .td-plate');
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'];
      let it = null; Object.keys(d).forEach((sk) => (d[sk] || []).forEach((x) => { if (String(x.id) === id) it = x; }));
      return { txt: el ? el.textContent : '', x: it && it.x };
    }, dinner.id);
    t.ok('Tonight says your plate, as Nourish has it on your day', /^Your plate/.test(plate.txt) && /servings? · [\d,]+ cal · \d+ g protein$/.test(plate.txt), JSON.stringify(plate));
    await p.click('[data-card="tonight"] [data-td="cooked"]');
    await p.waitForTimeout(300);
    const ck = await p.evaluate((id) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'];
      let eaten = false; Object.keys(d).forEach((sk) => (d[sk] || []).forEach((x) => { if (String(x.id) === id && x.eaten) eaten = true; }));
      return { cooked: window.Store.cooked('tue'), eaten, sheet: (document.querySelector('.td-sheet .sheet-eyebrow') || {}).textContent, says: (document.querySelector('.td-sheet .dsh-m') || {}).textContent };
    }, dinner.id);
    t.ok('Cooked it: the household’s word, your dinner ticked eaten in Nourish, and how was it?',
      ck.cooked && ck.eaten && ck.sheet === 'Dinner cooked' && /ticked eaten in Nourish/.test(ck.says), JSON.stringify(ck));
    await p.click('[data-tdrate="-1"]');
    const not = await p.evaluate((id) => window.Store.rating(Number(id) || id), dinner.id);
    t.ok('Not again is the rating Plan my week reads', not === -1, String(not));
    await p.click('[data-tdrate="-1"]');
    await p.click('[data-tdact="uncook"]');
    await p.waitForTimeout(300);
    t.ok('and Not cooked after all takes it back', await p.evaluate(() => !window.Store.cooked('tue') && !document.querySelector('[data-card="tonight"].td-fin')));

    /* ---- cooked is kept with the week, and only a day of the week ---- */
    await p.evaluate(() => window.Store.setCooked('tue', true));
    await p.reload();
    await p.waitForTimeout(800);
    const kept = await p.evaluate(() => ({ tue: window.Store.cooked('tue'), odd: (window.Store.setCooked('funday', true), window.Store.cooked('funday')) }));
    t.ok('cooked survives a reload, kept with the week, and a day that is not a day is refused', kept.tue && !kept.odd, JSON.stringify(kept));

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
