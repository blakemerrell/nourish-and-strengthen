/* Reaching the app without a mouse, or without seeing it, or at night.
 *
 * Five things that were each broken in a way no screenshot shows: a question
 * that let the keyboard walk out of it, boxes a screen reader could only call
 * "edit text", a tab row that said role=tablist and did nothing a tablist
 * does, no dark theme, and controls a thumb had to aim at. Each is asserted
 * against what the browser actually does with the page — where the focus
 * goes, what a box is named, which element a tap lands on — rather than
 * against the markup that is supposed to cause it.
 */

/* The name a screen reader would give a control, from the three places this
   app gives one: aria-labelledby, aria-label, and a <label>. A placeholder
   is not a name — it goes away the moment something is typed. */
function nameOf(el) {
  const lb = el.getAttribute('aria-labelledby');
  if (lb) {
    const t = lb.split(/\s+/).map((i) => document.getElementById(i)).filter(Boolean)
      .map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' ').trim();
    if (t) return t;
  }
  const al = (el.getAttribute('aria-label') || '').trim();
  if (al) return al;
  if (el.id) {
    const l = document.querySelector('label[for="' + el.id + '"]');
    if (l && l.textContent.trim()) return l.textContent.replace(/\s+/g, ' ').trim();
  }
  const wrap = el.closest('label');
  if (wrap && wrap.textContent.trim()) return wrap.textContent.replace(/\s+/g, ' ').trim();
  return '';
}

module.exports = {
  name: 'Keyboard, screen reader, touch and dark',
  async run(t) {
    // ---- the question keeps the keyboard ---------------------------------
    /* A confirm is drawn in #dialogRoot, over everything. The trap looked in
       #modalRoot only, so Tab went straight past Cancel into the page. */
    let p = await t.fresh({ viewport: { width: 1100, height: 900 } });
    await p.evaluate(() => {
      localStorage.setItem('bsc.weeks', JSON.stringify({ w1: { name: 'This Week', ord: 0, checked: {}, plan: { mon: [1, 2] } } }));
      localStorage.setItem('bsc.active', JSON.stringify('w1'));
    });
    await p.reload();
    await p.click('.tab[data-view="plan"]');
    await p.click('#clearPlan');
    await p.waitForTimeout(150);
    const inside = () => p.evaluate(() => {
      const d = document.querySelector('#dialogRoot .dlg');
      return !!d && d.contains(document.activeElement);
    });
    const trail = [];
    for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); trail.push(await inside()); }
    t.ok('Tab stays inside an open question, however many times it is pressed',
      trail.every(Boolean), JSON.stringify(trail));
    for (let i = 0; i < 6; i++) { await p.keyboard.press('Shift+Tab'); trail.push(await inside()); }
    t.ok('and so does Shift-Tab', trail.every(Boolean), JSON.stringify(trail));
    const dlg = await p.evaluate(() => {
      const d = document.querySelector('#dialogRoot .dlg');
      return { named: d.getAttribute('aria-labelledby') && document.getElementById(d.getAttribute('aria-labelledby')).textContent,
        heading: d.querySelector('h2') && d.querySelector('h2').textContent };
    });
    t.ok('the question is named by its own heading', !!dlg.named && dlg.named === dlg.heading, JSON.stringify(dlg));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(100);
    // a question with a box in it: the box is named by the question
    await p.click('[data-caltpl]');                       // Save as a template, which asks for a name
    await p.waitForTimeout(150);
    const box = await p.evaluate((fn) => {
      const nameOf = new Function('return ' + fn)();
      const i = document.getElementById('dlgInput');
      return i ? nameOf(i) : null;
    }, nameOf.toString());
    const asked = await p.evaluate(() => (document.querySelector('#dialogRoot .dlg-t') || {}).textContent || '');
    t.ok('the box a question asks you to fill is named by the question', !!box && box === asked, box + ' / ' + asked);
    await p.keyboard.press('Escape');

    // ---- the plan sheet's boxes have names -------------------------------
    p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.evaluate(() => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 40, ft: 5, inch: 10, lb: 200, act: 1.55, goal: 'cut1', goalLb: 185, goalBy: '', workouts: 3, steps: 8000 }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 170 }));
    });
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.click('#macroMore');
    await p.click('[data-mmore="plan"]');
    await p.waitForTimeout(250);
    await p.evaluate(() => {
      document.querySelectorAll('[data-mtwstep]').forEach((s) => { s.hidden = false; });
      document.querySelectorAll('.mt-sheet details').forEach((d) => { d.open = true; });
      ['mtMealsWrap', 'mtSave', 'mtEditor'].forEach((id) => { const el = document.getElementById(id); if (el) el.classList.remove('hide'); });
    });
    const plan = await p.evaluate((fn) => {
      const nameOf = new Function('return ' + fn)();
      const els = [...document.querySelectorAll('.mt-sheet input, .mt-sheet select, .mt-sheet textarea')]
        .filter((e) => e.type !== 'hidden' && !e.classList.contains('hide') && e.getAttribute('aria-hidden') !== 'true');
      const by = (id) => { const e = document.getElementById(id); return e ? nameOf(e) : '(absent)'; };
      return { n: els.length, nameless: els.filter((e) => !nameOf(e)).map((e) => e.id || e.className || e.tagName),
        age: by('mtAge'), ft: by('mtFt'), inch: by('mtIn'), steps: by('mtSteps'), by: by('mtGoalBy'), p: by('mtP'),
        groups: [...document.querySelectorAll('.mt-sheet .seg[role="group"]')].filter((g) => !nameOf(g)).length };
    }, nameOf.toString());
    t.ok('every box, menu and date in the plan sheet has a name a screen reader can say',
      plan.n >= 8 && plan.nameless.length === 0, JSON.stringify(plan));
    t.ok('named by the words beside it, and by its unit where it has one',
      /^Age/.test(plan.age) && /Height.*ft/.test(plan.ft) && /Height.*in/.test(plan.inch) &&
      /Steps a day/.test(plan.steps) && /When would you like/.test(plan.by) && /Protein.*g/.test(plan.p), JSON.stringify(plan));
    t.ok('and the rows of buttons are named groups', plan.groups === 0, plan.groups + ' unnamed');
    // the food typed in by hand
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    /* A meal's tray is the one door to adding food (2026-10-04). */
    await p.evaluate(() => { const b = document.querySelector('#macroSlots .mtray-b'); b.scrollIntoView({ block: 'center' }); b.click(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.querySelector('[data-mpnew]'); b.scrollIntoView({ block: 'center' }); b.click(); });
    await p.waitForTimeout(200);
    const nf = await p.evaluate((fn) => {
      const nameOf = new Function('return ' + fn)();
      return ['nfName', 'nfUnit', 'nfKcal', 'nfP', 'nfF', 'nfC'].map((id) => {
        const e = document.getElementById(id); return id + '=' + (e ? nameOf(e) : '(absent)');
      });
    }, nameOf.toString());
    t.ok('a food typed in by hand: its name, its unit and its four numbers are all labelled',
      nf.every((x) => !/=$|absent/.test(x)) && /nfKcal=Calories/.test(nf.join()), nf.join(' | '));

    // ---- the tab row behaves like a tab row ------------------------------
    p = await t.fresh({ viewport: { width: 1100, height: 900 } });
    const row = await p.evaluate(() => {
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      return {
        stops: tabs.filter((b) => b.tabIndex === 0).map((b) => b.dataset.view),
        controls: tabs.every((b) => (b.getAttribute('aria-controls') || '').split(/\s+/).every((id) => {
          const panel = document.getElementById(id);
          return panel && panel.getAttribute('role') === 'tabpanel' && !!document.getElementById(panel.getAttribute('aria-labelledby'));
        })),
      };
    });
    t.ok('one tab is in the Tab order, the lit one', row.stops.join() === 'today', row.stops.join());
    t.ok('and every tab names the panels it shows, each of which names its tab back', row.controls);
    await p.focus('.tab[data-view="today"]');
    const walk = [];
    const at = () => p.evaluate(() => document.activeElement && document.activeElement.dataset.view);
    await p.keyboard.press('ArrowRight'); walk.push(await at());
    await p.keyboard.press('ArrowRight'); walk.push(await at());
    await p.keyboard.press('End'); walk.push(await at());
    await p.keyboard.press('ArrowRight'); walk.push(await at());
    await p.keyboard.press('ArrowLeft'); walk.push(await at());
    await p.keyboard.press('Home'); walk.push(await at());
    t.ok('Right and Left walk the tabs that are shown, wrapping; Home and End go to the ends',
      walk.join() === 'browse,plan,train,today,train,today', walk.join());
    const moved = await p.evaluate(() => document.querySelector('#view-today').classList.contains('hide'));
    t.ok('and walking only moves the focus: the view does not change under you', !moved);
    await p.keyboard.press('End');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(250);
    const shown = await p.evaluate(() => ({
      view: !document.getElementById('view-train').classList.contains('hide'),
      sel: document.querySelector('.tab[data-view="train"]').getAttribute('aria-selected'),
      stops: [...document.querySelectorAll('[role="tab"]')].filter((b) => b.tabIndex === 0).map((b) => b.dataset.view).join(),
    }));
    t.ok('Enter shows the one you are on, and the Tab stop moves with it',
      shown.view && shown.sel === 'true' && shown.stops === 'train', JSON.stringify(shown));
    /* The ids the panels are named by must not make a tab something the
       re-render hands focus back to: a sheet opened while a tab still holds
       the focus keeps the focus it gave itself. */
    await p.click('.tab[data-view="browse"]');
    await p.evaluate(() => document.getElementById('newRecipe').click());
    await p.waitForTimeout(200);
    const typed = await p.evaluate(() => document.activeElement && document.activeElement.id);
    t.ok('a new recipe opened from the Recipes tab starts in its Name box', typed === 'edName', typed);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);

    // ---- and the gear's menu behaves like a menu --------------------------
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(200);
    await p.focus('#macroMore');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    const m1 = await p.evaluate(() => ({ open: !document.getElementById('macroMenu').classList.contains('hide'),
      focus: document.activeElement && document.activeElement.dataset.mmore }));
    t.ok('opening the menu puts the focus on its first item', m1.open && m1.focus === 'plan', JSON.stringify(m1));
    await p.keyboard.press('ArrowDown');
    const m2 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.mmore);
    await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
    const m3 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.mmore);
    t.ok('Down and Up walk its items, round from the top to the bottom', m2 === 'foods' && m3 === 'copy', m2 + ' ' + m3);
    await p.keyboard.press('Escape');
    const m4 = await p.evaluate(() => ({ open: !document.getElementById('macroMenu').classList.contains('hide'),
      back: document.activeElement && document.activeElement.id, expanded: document.getElementById('macroMore').getAttribute('aria-expanded') }));
    t.ok('and Escape closes it and gives the focus back to the gear',
      !m4.open && m4.back === 'macroMore' && m4.expanded === 'false', JSON.stringify(m4));

    // ---- headings -----------------------------------------------------------
    const heads = await p.evaluate(() => ({
      main: !!document.querySelector('main #view-browse'),
      h1: [...document.querySelectorAll('main section h1')].length,
      visible: [...document.querySelectorAll('h1')].filter((h) => h.offsetParent || h.classList.contains('sr-only')).map((h) => h.textContent.trim()),
    }));
    t.ok('the views are the page\'s main content, each opening on an h1',
      heads.main && heads.h1 >= 6 && heads.visible.includes('Nourish'), JSON.stringify(heads));

    // ---- dark, when the phone is dark ----------------------------------------
    const dctx = await t.browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const d = await dctx.newPage();
    d.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    await d.goto(t.base + 'index.html');
    await d.evaluate(() => localStorage.clear());
    await d.reload();
    await d.evaluate(() => document.fonts.ready);
    await d.click('.tab[data-view="browse"]');   // these colours are Recipes' cards and bar
    await d.waitForTimeout(200);
    const lum = (c) => {
      // resolved colours come back as oklch(), rgb() or color(srgb); lightness is enough here
      const ok = c.match(/oklch\(([\d.]+)/); if (ok) return parseFloat(ok[1]);
      const n = (c.match(/[\d.]+/g) || []).map(Number);
      return c.startsWith('color(') ? (n[0] + n[1] + n[2]) / 3 : (n[0] + n[1] + n[2]) / 765;
    };
    const dark = await d.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { bg: cs.backgroundColor, fg: cs.color, scheme: getComputedStyle(document.documentElement).colorScheme,
        ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
        card: getComputedStyle(document.querySelector('.card')).backgroundColor,
        header: getComputedStyle(document.querySelector('.topbar')).backgroundColor,
        meta: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => (m.media || '') + ' ' + m.content) };
    });
    t.ok('a dark phone gets dark paper and light ink, and says so to the browser',
      lum(dark.bg) < 0.3 && lum(dark.fg) > 0.8 && dark.scheme === 'dark' && /0\.9/.test(dark.ink), JSON.stringify(dark));
    t.ok('the cards and the header are dark too, and the browser bar has a dark colour to match',
      lum(dark.card) < 0.35 && lum(dark.header) < 0.25 && dark.meta.some((m) => /dark/.test(m)), JSON.stringify(dark));
    // the book is paper in any light
    await d.click('#bookBtn');
    await d.waitForTimeout(2500);
    const page = await d.evaluate(() => {
      const pg = document.querySelector('.pg:not(.no-print)');
      return pg ? { bg: getComputedStyle(pg).backgroundColor, ink: getComputedStyle(pg).color } : null;
    });
    t.ok('a page of the book stays paper with ink on it', !!page && lum(page.bg) > 0.95 && lum(page.ink) < 0.35, JSON.stringify(page));
    // and printing from a dark phone prints the day
    await d.emulateMedia({ media: 'print', colorScheme: 'dark' });
    const printed = await d.evaluate(() => ({ ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
      scheme: getComputedStyle(document.documentElement).colorScheme }));
    t.ok('and in print the dark values never apply', /^oklch\(0\.26/.test(printed.ink) && printed.scheme === 'light', JSON.stringify(printed));
    await dctx.close();

    // ---- Appearance: Auto, Light, Dark, in Sync & sharing ----------------------
    // fresh(): the sheet draws Google's button, which the runner answers
    const ap = await t.fresh({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const look = () => ap.evaluate(() => ({
      t: document.documentElement.getAttribute('data-theme'),
      scheme: getComputedStyle(document.documentElement).colorScheme,
      bar: [...document.querySelectorAll('meta[name="theme-color"]')].filter((m) => matchMedia(m.media || 'all').matches).map((m) => m.content).join(),
      on: [...document.querySelectorAll('[data-sync="theme"][aria-pressed="true"]')].map((b) => b.textContent).join(),
      say: (document.querySelector('.sync-theme-say') || {}).textContent || '' }));
    const pickTheme = async (v) => { await ap.click('[data-sync="theme"][data-v="' + v + '"]'); await ap.waitForTimeout(100); };
    await ap.click('#syncBtn');
    await ap.waitForSelector('[data-sync="theme"]');
    let th = await look();
    t.ok('Appearance starts on Auto, and Auto is the phone: dark here', th.t === 'dark' && th.scheme === 'dark' && th.on === 'Auto' &&
      /phone/.test(th.say) && th.bar === '#120d0a', JSON.stringify(th));
    const said = await ap.evaluate(() => { const el = document.querySelector('.sync-theme-say'); return el ? el.getAttribute('role') : null; });
    t.ok('and the line saying whose choice it is is a status, heard when it changes', said === 'status', String(said));
    await pickTheme('light');
    th = await look();
    t.ok('Light on a dark phone: the app and the browser bar go light, and it says the choice is this device\u2019s',
      th.t === 'light' && th.scheme === 'light' && th.on === 'Light' && /device/.test(th.say) && th.bar === '#3b3630', JSON.stringify(th));
    await ap.reload();
    th = await look();
    t.ok('and it is kept: light again after a reload', th.t === 'light' && th.scheme === 'light', JSON.stringify(th));
    /* In src/theme.js since the page's policy refused inline script: loaded
       ahead of the stylesheet, and without async or defer, so it still runs
       before anything is drawn. */
    const html = await (await ap.request.get(t.base + 'index.html')).text();
    const tag = (/<script\b[^>]*\bsrc="(src\/theme\.js[^"]*)"[^>]*>/.exec(html) || []);
    const themeJs = tag[1] ? await (await ap.request.get(t.base + tag[1])).text() : '';
    t.ok('decided before the stylesheet loads, so the page never shows the other one first',
      !!tag[0] && !/\b(async|defer)\b/.test(tag[0]) && html.indexOf(tag[0]) < html.indexOf('rel="stylesheet"') &&
        themeJs.indexOf('bsc.theme') >= 0, tag[0] || 'no theme script');
    await ap.click('#syncBtn');
    await ap.waitForSelector('[data-sync="theme"]');
    await pickTheme('dark');
    await ap.emulateMedia({ colorScheme: 'light' });
    th = await look();
    t.ok('Dark on a light phone stays dark', th.t === 'dark' && th.scheme === 'dark' && th.on === 'Dark' && th.bar === '#120d0a', JSON.stringify(th));
    await ap.emulateMedia({ media: 'print', colorScheme: 'light' });
    const inPrint = await ap.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    t.ok('and printing with Dark chosen still prints the day', inPrint === 'light', inPrint);
    await ap.emulateMedia({ media: 'screen', colorScheme: 'light' });
    await pickTheme('');
    th = await look();
    t.ok('back to Auto: the phone decides again, light now', th.t === 'light' && th.on === 'Auto' && /phone/.test(th.say), JSON.stringify(th));
    await ap.emulateMedia({ colorScheme: 'dark' });
    await ap.waitForTimeout(100);
    th = await look();
    t.ok('and Auto follows the phone when it changes, without a reload', th.t === 'dark' && th.scheme === 'dark', JSON.stringify(th));
    await ap.context().close();

    // ---- a thumb's reach --------------------------------------------------
    /* Measured by where a tap lands, not by the box: the reach is a band hung
       off each control, which getBoundingClientRect cannot see. A tap 21px
       above, below, left and right of each control's centre has to land on
       that control. */
    const tctx = await t.browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const q = await tctx.newPage();
    q.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    await q.goto(t.base + 'index.html');
    await q.evaluate(() => {
      localStorage.clear();
      const p2 = (n) => (n < 10 ? '0' : '') + n, dd = new Date();
      const k = dd.getFullYear() + '-' + p2(dd.getMonth() + 1) + '-' + p2(dd.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 170 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { d: [{ id: 'f:cooked_beef', x: 1 }] } }));
    });
    await q.reload();
    await q.evaluate(() => document.fonts.ready);
    /* Only what is on the screen with its whole reach: a control half under
       the pinned bar is scrolled to before it is asked about. */
    const reach = (sel, wide) => q.evaluate(([s, w]) => [...document.querySelectorAll(s)].filter((e) => {
      if (!e.offsetParent) return false;
      const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cy - 22 < 0 || cy + 22 > innerHeight) return false;
      // and not under something pinned over it, which a thumb could not reach either
      const top = document.elementFromPoint(cx, cy);
      return !!top && (top === e || e.contains(top));
    }).map((e) => {
      const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const pts = [[cx, cy - 21], [cx, cy + 21]].concat(w ? [[cx - 21, cy], [cx + 21, cy]] : []);
      const hit = pts.every(([x, y]) => { const h = document.elementFromPoint(x, y); return !!h && (h === e || e.contains(h)); });
      return { k: (e.dataset.view || e.id || e.className || e.tagName) + '', h: Math.round(r.height), hit };
    }), [sel, wide]);
    const report = (rs) => rs.filter((r) => !r.hit).map((r) => r.k + ' ' + r.h + 'px').join(', ');
    // the tabs are as tall as a thumb; their width is the row's, and the row may not grow
    let rs = await q.evaluate(() => [...document.querySelectorAll('.tabs .tab')].filter((e) => e.offsetParent)
      .map((e) => ({ k: e.dataset.view, h: e.getBoundingClientRect().height, hit: e.getBoundingClientRect().height >= 44 })));
    t.ok('on a phone every tab is a thumb tall, Today included', rs.length === 5 && rs.every((r) => r.hit), JSON.stringify(rs));
    rs = await reach('#syncBtn', true);
    t.ok('and so is Share', rs.length === 1 && rs[0].hit, JSON.stringify(rs));
    await q.click('.tab[data-view="macros"]');
    await q.waitForTimeout(250);
    /* A meal opens as its sheet (trays and the meal sheet, 2026-10-04): the
       verbs are the head's ⋯ and the words in the meal's menu behind it, so
       the menu is opened the way a thumb would before they are measured.
       Balance and Done moved down to the tray along the bottom on 2026-10-05
       (the ⚖ and × left the head), and are measured there. */
    await q.evaluate(() => { const b = document.querySelector('#macroSlots .mtray-b'); if (b) b.click(); });
    await q.waitForTimeout(300);
    await q.evaluate(() => { const b = document.querySelector('#modalRoot [data-mmenu][aria-expanded="false"]'); if (b) b.click(); });
    await q.waitForTimeout(250);
    rs = await reach('#modalRoot .msh-i, #modalRoot .msh-menu .mfood-mi, #modalRoot .msh-bal, #modalRoot .msh-done', true);
    t.ok('a meal\'s verbs are each a thumb wide and tall', rs.length >= 2 && rs.every((r) => r.hit), report(rs) || JSON.stringify(rs));
    // the menu shut first (a tap on the title), then the sheet by its Done
    await q.evaluate(() => { const t2 = document.querySelector('#modalRoot .msh-t'); if (t2) t2.click(); });
    await q.waitForTimeout(150);
    await q.evaluate(() => { const x = document.querySelector('#modalRoot .msheet .msh-done, #modalRoot .msheet .sheet-x'); if (x) x.click(); });
    await q.waitForTimeout(300);
    // the toast's Undo
    await q.evaluate(() => {
      const el = document.getElementById('mToast');
      el.innerHTML = '<span>Swept.</span><button type="button" data-mallow="x">Undo</button>'; el.hidden = false;
    });
    rs = await reach('#mToast button', true);
    t.ok('the toast\'s Undo is a thumb wide and tall', rs.length === 1 && rs[0].hit, JSON.stringify(rs));
    await q.evaluate(() => { document.getElementById('mToast').hidden = true; });
    // the recipe sheet: the star, the pencil, cups/grams and the scale
    await q.click('.tab[data-view="browse"]');
    await q.evaluate(() => document.querySelector('[data-open]').click());
    await q.waitForTimeout(300);
    for (const [sel, what] of [['.sheet .iconbtn', 'the star and the pencil'], ['.unitseg button', 'cups and grams'],
      ['.scaler-box button', 'the scale\'s − and +'], ['.nut-ask', '"How is this scored?"']]) {
      await q.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, sel);
      await q.waitForTimeout(80);
      rs = await reach(sel, true);
      t.ok('on the recipe sheet, ' + what + ' can be hit with a thumb', rs.length >= 1 && rs.every((r) => r.hit), report(rs) || JSON.stringify(rs));
    }
    await q.keyboard.press('Escape');
    // the pantry's pills (On hand)
    await q.click('.tab[data-view="plan"]');
    await q.evaluate(() => window.Hive.go('pantry'));
    await q.waitForTimeout(200);
    await q.evaluate(() => { const e = document.querySelector('#view-pantry .kit-pill'); if (e) e.scrollIntoView({ block: 'center' }); });
    rs = await reach('#view-pantry .kit-pill', true);
    t.ok('a pantry pill can be hit with a thumb', rs.length >= 3 && rs.every((r) => r.hit), report(rs) || rs.length + ' measured');
    await tctx.close();
  },
};
