/* Every meal's view at once, and the day box drawn like its neighbours.
 *
 * Blake, 2026-10-18, pointing at the day's head: "Add a button here that lets
 * me cycle through the triple tap for all meals. Collapse, show foods, show.
 * Edit foods" (beside the gear, he chose), and "make that date box look.
 * Like it belongs. And shorter". */
const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
  const f = (k, x) => ({ id: 'f:' + k, x: x, eaten: 0 });
  localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-08': {
    b: [f('egg', 2)], l: [f('chicken_breast', 1), f('green_beans', 1)], d: [{ id: 66, x: 1, eaten: 0 }] } }));
};
// the three meals with food on them, Breakfast, Lunch and Dinner: an empty meal has no views to step
const views = (p) => p.evaluate(() => [...document.querySelectorAll('#macroSlots [data-mview]')].map((b) => Number(b.dataset.mv)).join(''));
const button = (p) => p.evaluate(() => {
  const b = document.getElementById('macroViews'), r = b.getBoundingClientRect();
  return { lit: [...b.querySelectorAll('.mtray-pips i')].findIndex((i) => i.classList.contains('on')) + 1,
    say: b.getAttribute('aria-label'), w: r.width, h: r.height, hidden: b.hidden };
});

module.exports = {
  name: 'Every meal’s view at once, and the day box',
  async run(t) {
    const errs = [];
    const open = async (vp, opts) => {
      const p = await t.fresh({ viewport: vp, ...(opts || {}) });
      p.on('pageerror', (e) => errs.push(e.message));
      await p.clock.setFixedTime(new Date(2026, 9, 8, 10, 0, 0));
      await p.reload();
      await p.waitForTimeout(500);
      await p.evaluate(SETUP);
      await p.reload();
      await p.waitForTimeout(700);
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(400);
      return p;
    };
    const p = await open({ width: 390, height: 844 });

    const head = await p.evaluate(() => {
      const ids = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden).map((e) => e.id || e.className);
      const sel = document.getElementById('macroDaySel'), cs = getComputedStyle(sel), r = sel.getBoundingClientRect();
      const tops = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden && e.getBoundingClientRect().height)
        .map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
      return { ids, said: sel.options[sel.selectedIndex].text, w: r.width, h: r.height, bg: cs.backgroundColor,
        ring: cs.boxShadow, oneRow: Math.max(...tops) - Math.min(...tops) <= 2 };
    });
    t.ok('the button sits by the gear, after the day, a thumb tall',
      head.ids.slice(1).join() === 'macroPrev,macroDaySel,macroNext,macroViews,macroMore' && head.oneRow, JSON.stringify(head));
    t.ok('the day box says just the day ("Today"), is no wider than it needs, and is a thumb tall',
      head.said === 'Today' && head.w < 120 && head.h >= 44, JSON.stringify(head));
    t.ok('and is drawn as the arrows and the gear are: no fill, their line round it',
      /rgba\(0, 0, 0, 0\)|transparent/.test(head.bg) && /inset/.test(head.ring) && /1\.5px/.test(head.ring), JSON.stringify(head));

    let b = await button(p);
    t.ok('meals all on their foods: the button’s middle pip lit, and it says what a press shows next',
      (await views(p)) === '222' && b.lit === 2 && b.say === 'Every meal: show their details' && b.w >= 44 && b.h >= 44, JSON.stringify(b));
    await p.click('#macroViews');
    t.ok('pressed, every meal opens to its details', (await views(p)) === '333' && (await button(p)).lit === 3);
    await p.click('#macroViews');
    t.ok('again, every meal closes to its status', (await views(p)) === '111' && (await button(p)).say === 'Every meal: show their foods');
    await p.click('#macroViews');
    t.ok('and again, round to their foods', (await views(p)) === '222');

    await p.click('#macroSlots [data-mview="l"]');
    b = await button(p);
    t.ok('a meal’s own name still steps that meal alone, and the button then lights no pip',
      (await views(p)) === '232' && b.lit === 0 && b.say === 'Every meal: show just their status', JSON.stringify(b));
    await p.click('#macroViews');
    t.ok('meals in different views all go to the start of the round', (await views(p)) === '111');
    await p.click('#macroSlots [data-mview="d"]');
    t.ok('and a name still steps its meal on from there', (await views(p)) === '112', await views(p));

    // another day starts as days start, its own views untouched by this one's
    await p.click('#macroNext');
    await p.waitForTimeout(200);
    const next = await p.evaluate(() => document.getElementById('macroDaySel').selectedOptions[0].text);
    t.ok('the next day is called by its word too', next === 'Tomorrow', next);
    await p.context().close();

    /* 320 px, dark: one row, nothing wider than the screen */
    const n = await open({ width: 320, height: 640 }, { colorScheme: 'dark' });
    const narrow = await n.evaluate(() => {
      const kids = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden && e.getBoundingClientRect().height);
      const tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
      const head = document.querySelector('.mday-head').getBoundingClientRect();
      return { oneRow: Math.max(...tops) - Math.min(...tops) <= 2, inside: kids.every((e) => e.getBoundingClientRect().right <= head.right + 0.5),
        page: document.documentElement.scrollWidth <= innerWidth, day: document.getElementById('macroDaySel').getBoundingClientRect().width,
        // the meal cards drop their own pips this narrow; the button is nothing but them
        pips: [...document.querySelectorAll('#macroViews .mtray-pips i')].filter((i) => i.getBoundingClientRect().width >= 5).length };
    });
    t.ok('at 320 px in the dark the head stays one row, inside the screen, the day still readable and the button\u2019s pips shown',
      narrow.oneRow && narrow.inside && narrow.page && narrow.day >= 90 && narrow.pips === 3, JSON.stringify(narrow));
    await n.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
  },
};
