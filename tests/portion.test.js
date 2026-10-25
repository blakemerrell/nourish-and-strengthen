/* How a portion reads on a Nourish plate.
 *
 * Blake, of a cottage cheese scanned off its label: "the servings are very
 * strange, not intuitive." Four servings of "0.5 cup (113 g)" read
 * "4 0.5 cup (113 g)"; multiplied out they are 2 cups, 452 g. And typing a
 * portion stood the number over its unit, "400" on one line and "g" below. */

module.exports = {
  name: 'Portions',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const r = await p.evaluate(() => {
      const P = window.__mPortion;
      return {
        /* counted in servings (the Kroger label had no weight of its own) */
        half: P({ food: 1, unit: '0.5 cup (113 g)' }, 4),
        cup: P({ food: 1, unit: '1 cup (226 g)' }, 1.5),
        frac: P({ food: 1, unit: '1/4 cup (60 g)' }, 2),
        /* and measured in grams, where the cups are the small print */
        byG: P({ food: 1, unit: '0.5 cup (113 g)', grams: 113 }, 4),
        plain: P({ food: 1, unit: 'slice', grams: 25 }, 2),
        usdaSlice: P({ food: 1, unit: '1 small or thin/very thin slice (25 g)' }, 0.25),
        miniMuffin: P({ food: 1, unit: '1 mini muffin (28 g)' }, 1),
      };
    });
    t.ok('a label serving that says its own amount is multiplied out: 4 of “0.5 cup (113 g)” is 2 cups, 452 g',
      r.half.head === '2 cups' && r.half.detail === '452 g', JSON.stringify(r.half));
    t.ok('and so are a cup and a half, and a fraction written as one',
      r.cup.head === '1 ½ cups' && r.cup.detail === '339 g' && r.frac.head === '½ cup', JSON.stringify([r.cup, r.frac]));
    t.ok('measured in grams, the small print says the cups too, not the label again',
      r.byG.head === '452 g' && r.byG.detail === '2 cups', JSON.stringify(r.byG));
    t.ok('a food whose serving is only a word is said as before', r.plain.head === '2 slices', JSON.stringify(r.plain));
    t.ok('a USDA slice with size adjectives (“1 small or thin/very thin slice (25 g)”) reads as “slice”, while “1 mini muffin” keeps “mini”',
      r.usdaSlice.head === '¼ slice' && r.usdaSlice.detail === '6 g' && r.miniMuffin.head === '1 mini muffin', JSON.stringify([r.usdaSlice, r.miniMuffin]));

    /* Typing: one row. */
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(700);
    /* A meal's tray opens its sheet, the one place food is added
       (2026-10-04); the pick goes straight on the meal, whose row is above. */
    await p.evaluate(() => { const b = document.querySelector('#macroSlots .mtray-b'); b && b.click(); });
    await p.waitForTimeout(500);
    await p.fill('#mpFind', 'cottage');
    await p.waitForTimeout(300);
    await p.evaluate(() => {
      const row = [...document.querySelectorAll('.mpick-row[data-mpick]')].find((x) => x.dataset.mpick.indexOf('f:') === 0 && /cottage/i.test(x.textContent));
      row && row.click();
    });
    await p.waitForTimeout(500);
    // its row is in the tray along the sheet's bottom since 2026-10-05, shut to a chip until opened
    await p.evaluate(() => { const b = document.querySelector('#modalRoot .msh-tray .msh-trn'); if (b && b.offsetParent) b.click(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.querySelector('#modalRoot .mstep-type'); b && b.click(); });
    await p.waitForTimeout(300);
    const row = await p.evaluate(() => {
      const i = document.querySelector('.mstep-in'), u = i && i.parentElement.querySelector('i');
      if (!i || !u) return null;
      const a = i.getBoundingClientRect(), b = u.getBoundingClientRect();
      return { dy: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2), unitRight: b.left >= a.right - 1, unit: u.textContent };
    });
    t.ok('typing a portion keeps the number and its unit on one row, “400 g”',
      !!row && row.dy < 10 && row.unitRight, JSON.stringify(row));
    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
