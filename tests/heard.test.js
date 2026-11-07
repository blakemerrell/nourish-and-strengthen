/* A meal said in one breath into the picker's box (src/heard.js).
 *
 * Blake, 2026-11-06, after the mockup
 * (https://claude.ai/artifact/RwSruTSHpsPMeTWDVrByZV): a button in the search
 * box to say a meal at, read as its foods, with "Add all", "Keep as one food"
 * and "Save as a recipe", and the microphone kept even though it only puts the
 * caret in the box (a page cannot start the keyboard's dictation itself).
 *
 * What this holds to: one food still searches as it always did; two or more
 * make a band that says what it heard, line by line, and adds nothing until a
 * button is pressed; the sentence is never sent to the USDA as one food's
 * name; and each of the three ways on puts exactly the heard foods where it
 * says. The words a person says that were read wrong on the first try are
 * pinned here: butter alone was a whole stick, a cup of rice was dry rice, and
 * half and half matched a restaurant's half side of rice. */
const DAY = '2026-11-07';
const SETUP = (day) => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' }],
    names: { b: 'Breakfast', l: 'Lunch' } }));
  localStorage.setItem('bsc.macroDays', JSON.stringify({ [day]: { b: [{ id: 'f:apple', x: 1, eaten: 0 }] } }));
};
const onMeal = (p) => p.evaluate((d) => (JSON.parse(localStorage.getItem('bsc.macroDays'))[d].b || []).map((i) => ({ id: i.id, x: i.x })), DAY);
const band = (p) => p.evaluate(() => {
  const b = document.getElementById('mpHeard');
  if (!b) return null;
  return {
    head: (document.querySelector('.mh-head') || {}).textContent,
    rows: [...b.querySelectorAll('.mh-row')].map((r) => ({
      name: r.querySelector('.mh-name').firstChild.textContent, says: (r.querySelector('.mh-name small') || {}).textContent || '',
      unk: r.classList.contains('mh-unk') })),
    alts: [...b.querySelectorAll('.mh-alts')].map((a) => [...a.querySelectorAll('.mh-alt')].map((x) => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : ''))),
    acts: [...b.querySelectorAll('[data-mhdo]')].map((x) => x.textContent)
  };
});

module.exports = {
  name: 'A meal said into the picker',
  async run(t) {
    const open = async (vp) => {
      const p = await t.fresh({ viewport: vp || { width: 390, height: 844 } });
      await p.clock.setFixedTime(new Date(2026, 10, 7, 8, 0, 0));
      await p.reload();
      await p.waitForTimeout(500);
      await p.evaluate(SETUP, DAY);
      await p.reload();
      await p.waitForTimeout(700);
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(400);
      await p.click('#macroSlots .mtray[data-mslot="b"] .mtray-ib[data-mopen="b"]');
      await p.waitForTimeout(600);
      return p;
    };
    const say = async (p, words) => { await p.fill('#mpFind', words); await p.waitForTimeout(450); };

    const p = await open();

    /* ---- the microphone ---- */
    const mic = await p.evaluate(() => {
      const b = document.querySelector('.mp-find [data-mpmic]'), r = b.getBoundingClientRect();
      const box = document.getElementById('mpFind').getBoundingClientRect();
      return { w: r.width, h: r.height, inside: r.left >= box.left && r.right <= box.right, say: b.getAttribute('aria-label'),
        ph: document.getElementById('mpFind').placeholder };
    });
    t.ok('the search box has a microphone inside it, a thumb wide, and says a meal can be said',
      mic.w >= 44 && mic.h >= 44 && mic.inside && mic.say === 'Say a meal' && /say a meal/.test(mic.ph), JSON.stringify(mic));
    await p.click('[data-mpmic]');
    await p.waitForTimeout(150);
    const hint = await p.evaluate(() => ({ focus: document.activeElement && document.activeElement.id,
      hint: (document.getElementById('mpMicHint') || {}).textContent || '' }));
    t.ok('pressed, it puts the caret in the box and says to tap the keyboard’s own mic', hint.focus === 'mpFind' && /keyboard/.test(hint.hint), JSON.stringify(hint));

    /* ---- one food is a search, as it always was ---- */
    await say(p, 'eggs');
    const one = await p.evaluate(() => ({ band: !!document.getElementById('mpHeard'), usda: !!document.getElementById('nfResults'),
      hint: !!document.getElementById('mpMicHint') }));
    t.ok('one food named is a search: no band, the USDA box below as before, and the reminder gone once words arrive',
      !one.band && one.usda && !one.hint, JSON.stringify(one));

    /* ---- a sentence is a band ---- */
    await say(p, 'two scrambled eggs, toast with butter, a cup of rice and a splash of half and half');
    let b = await band(p);
    t.ok('a sentence becomes a band of its foods, in the order said', b && b.rows.map((r) => r.name).join('|') ===
      'Eggs|Bread|Butter|Cooked rice|“a splash of half and half”', JSON.stringify(b));
    t.ok('each line says the amount it heard: two eggs, one slice of toast, butter a tablespoon (not the stick), a cup of rice',
      b && /^2 · 100 g · 1\d\d kcal/.test(b.rows[0].says) && /^1 · 28 g/.test(b.rows[1].says) &&
      /^1 tbsp · 14 g/.test(b.rows[2].says) && /no amount heard/.test(b.rows[2].says) && /^1 cup · 158 g/.test(b.rows[3].says), JSON.stringify(b && b.rows));
    t.ok('rice that names no rice exactly asks which, cooked first, never the dry rice a recipe buys',
      b && b.alts.length === 1 && b.alts[0][0] === 'Cooked rice*' && !b.alts[0].some((a) => /dry/i.test(a)), JSON.stringify(b && b.alts));
    t.ok('half and half, which no food here is called, is shown as not found rather than matched to a half side of rice',
      b && b.rows[4].unk && !b.rows.some((r) => /Panda|side/i.test(r.name)), JSON.stringify(b && b.rows[4]));
    const quiet = await p.evaluate(() => ({ usda: !!document.getElementById('nfResults'), nothing: /Nothing matches/.test(document.getElementById('mpList').textContent) }));
    t.ok('with the band showing, the sentence is not sent to the USDA and the list does not say nothing matches it',
      !quiet.usda && !quiet.nothing, JSON.stringify(quiet));
    t.ok('and the three ways on are there, nothing yet added', b && b.acts.join('|') === 'Add all 4 to Breakfast|Keep as one food|Save as a recipe' &&
      (await onMeal(p)).length === 1, JSON.stringify(b && b.acts));

    /* − and + and a choice, without the box losing its words */
    await p.click('[data-mhq^="two scrambled eggs"][data-mhd="1"]');
    await p.waitForTimeout(150);
    await p.click('.mh-alt:has-text("Jasmine rice")');
    await p.waitForTimeout(150);
    b = await band(p);
    t.ok('+ on the eggs makes three, and a tap on Jasmine rice puts that on the line', b && /^3 · 150 g/.test(b.rows[0].says) &&
      b.rows[3].name === 'Jasmine rice' && (await p.inputValue('#mpFind')).length > 40, JSON.stringify(b && b.rows.slice(0, 4)));

    /* "Search it" sends one unknown part to be found on its own */
    await p.click('[data-mhfind]');
    await p.waitForTimeout(200);
    t.ok('Search it puts just that part in the box, to be looked up on its own', (await p.inputValue('#mpFind')) === 'a splash of half and half' &&
      !(await p.$('#mpHeard')), await p.inputValue('#mpFind'));

    /* ---- Add all ---- */
    await say(p, '2 eggs, toast with butter');
    await p.click('[data-mhdo="all"]');
    await p.waitForTimeout(300);
    const all = await onMeal(p);
    t.ok('Add all puts the heard foods on the meal after what was there, and empties the box',
      all.map((i) => i.id).join() === 'f:apple,f:egg,f:bread,f:butter' && all[1].x === 2 && (await p.inputValue('#mpFind')) === '' &&
      !(await p.$('#mpHeard')), JSON.stringify(all));
    t.ok('and says what it did', /Added 3 to Breakfast/.test(await p.evaluate(() => (document.getElementById('mToast') || {}).textContent)));
    await p.context().close();

    /* ---- Keep as one food ---- */
    const k = await open();
    await say(k, '2 eggs, toast with butter');
    await k.click('[data-mhdo="keep"]');
    await k.waitForTimeout(300);
    const sheet = await k.evaluate(() => ({ eyebrow: (document.querySelector('.sheet-eyebrow') || {}).textContent,
      parts: [...document.querySelectorAll('.mk-p span:first-child')].map((s) => s.textContent) }));
    t.ok('Keep as one food asks about the heard foods alone, not the apple already on the meal',
      sheet.eyebrow === 'Keep as one food' && sheet.parts.join() === 'Eggs,Bread,Butter', JSON.stringify(sheet));
    await k.fill('#mkName', 'Eggs and toast');
    await k.click('[data-mkdo="mine"]');
    await k.waitForTimeout(300);
    const kept = await onMeal(k);
    t.ok('kept, the one food it made goes on the meal beside the apple, and the parts do not go on as well',
      kept.length === 2 && kept[0].id === 'f:apple' && /^f:my:/.test(kept[1].id) && kept[1].x === 1, JSON.stringify(kept));
    await k.context().close();

    /* ---- Save as a recipe ---- */
    const r = await open();
    await say(r, '2 eggs, toast with butter');
    await r.click('[data-mhdo="recipe"]');
    await r.waitForTimeout(150);
    await r.click('[data-mhserve="1"]');
    await r.waitForTimeout(150);
    const form = await r.evaluate(() => document.querySelector('.mh-form').textContent);
    t.ok('Save as a recipe asks how many servings it makes and says what one is', /Makes 2 servings/.test(form) && /One serving: \d+ kcal/.test(form), form);
    await r.click('[data-mhdo="recipego"]');
    await r.waitForTimeout(400);
    const ed = await r.evaluate(() => ({ ing: document.getElementById('edIng').value, serv: document.getElementById('edServings').value }));
    t.ok('the editor opens with the foods as ingredient lines and the servings filled in',
      ed.ing === '2 Eggs (100 g)\n1 Bread (28 g)\n1 tbsp Butter (14 g)' && ed.serv === '2 Servings', JSON.stringify(ed));
    await r.fill('#edName', 'Eggs on toast');
    await r.click('[data-ed="save"]');
    await r.waitForTimeout(400);
    const saved = await onMeal(r);
    const rec = await r.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const v = localStorage.getItem(localStorage.key(i));
        if (v && v.indexOf('"Eggs on toast"') >= 0) {
          const all = JSON.parse(v), list = Array.isArray(all) ? all : Object.values(all);
          const hit = list.find((x) => x && x.name === 'Eggs on toast');
          if (hit) return hit;
        }
      }
      return null;
    });
    t.ok('saved, one serving goes on the meal and the recipe keeps a serving’s macros, half of what was heard',
      saved.length === 2 && saved[1].x === 1 && rec && rec.servN === 2 && rec.macro.kcal > 140 && rec.macro.kcal < 180,
      JSON.stringify({ saved, macro: rec && rec.macro }));
    t.ok('and the picker is back, not the recipe', !!(await r.$('#mpFind')) && (await r.inputValue('#mpFind')) === '');
    await r.context().close();

    /* ---- 320 px, dark ---- */
    const n = await t.fresh({ viewport: { width: 320, height: 640 }, colorScheme: 'dark' });
    await n.clock.setFixedTime(new Date(2026, 10, 7, 8, 0, 0));
    await n.reload(); await n.waitForTimeout(500);
    await n.evaluate(SETUP, DAY);
    await n.reload(); await n.waitForTimeout(700);
    await n.click('.tab[data-view="macros"]'); await n.waitForTimeout(400);
    await n.click('#macroSlots .mtray[data-mslot="b"] .mtray-ib[data-mopen="b"]'); await n.waitForTimeout(600);
    await say(n, 'two eggs, a cup of rice and a banana');
    const narrow = await n.evaluate(() => {
      const box = document.getElementById('mpHeard').getBoundingClientRect();
      const keys = [...document.querySelectorAll('#mpHeard button')].map((x) => x.getBoundingClientRect());
      return { page: document.documentElement.scrollWidth <= innerWidth, inside: box.right <= innerWidth + 0.5,
        keys: keys.every((r) => r.height >= 44 && r.width >= 44) };
    });
    t.ok('at 320 px in the dark the band fits the screen and every key in it is a thumb tall',
      narrow.page && narrow.inside && narrow.keys, JSON.stringify(narrow));
    await n.context().close();
  }
};
