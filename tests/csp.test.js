/* The page's content-security policy (the meta in index.html).
 *
 * The review on 3 October 2026 found every household-to-HTML path escaped,
 * and no policy behind them: one that slipped would have run script on every
 * phone in the household, with the household code the only key to it. The
 * policy refuses inline script outright, which is why the two scripts that
 * were inline in index.html are src/theme.js and src/boot.js now.
 *
 * A policy can break the app quietly — a refused script logs a line and
 * nothing else — so this holds it to the code from both sides: every host the
 * code loads a script from or fetches from is in the right part of the policy,
 * a walk through every tab raises no violation, and an injected <img onerror>
 * does nothing. Google's own sign-in cannot run here (it is blocked, as it is
 * for every suite); the hosts it needs are held by the first half. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function policyOf(text) {
  const out = {};
  text.split(';').map((s) => s.trim()).filter(Boolean).forEach((d) => {
    const [name, ...vals] = d.split(/\s+/);
    out[name] = vals;
  });
  return out;
}
// whether a directive's list admits this origin (exact, or a *.host wildcard)
function admits(list, origin) {
  const host = origin.replace(/^https:\/\//, '');
  return (list || []).some((v) => v === origin ||
    (v.startsWith('https://*.') && host.endsWith(v.slice('https://*'.length))));
}

module.exports = {
  name: 'Content-security policy',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    /* ---- the policy, as the page carries it ---- */
    const meta = await p.evaluate(() => {
      const m = [...document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')];
      const first = document.querySelector('head script');
      return { n: m.length, text: m[0] ? m[0].getAttribute('content') : '',
        beforeScripts: !!m[0] && !!first && !!(m[0].compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING),
        inline: [...document.querySelectorAll('script:not([src])')].length };
    });
    const P = policyOf(meta.text);
    t.ok('index.html carries one policy, ahead of every script', meta.n === 1 && meta.beforeScripts, JSON.stringify(meta).slice(0, 200));
    t.ok('and no inline script for it to have to allow', meta.inline === 0, meta.inline + ' inline');
    t.ok('script may come only from here and named hosts: never inline, never eval',
      (P['script-src'] || []).indexOf("'self'") >= 0 && !(P['script-src'] || []).some((v) => /unsafe|\*$|^https:$|^data:/.test(v)),
      (P['script-src'] || []).join(' '));
    t.ok('no plugins, and the page cannot be re-based', (P['object-src'] || []).join() === "'none'" && (P['base-uri'] || []).join() === "'self'");

    /* ---- every host the code reaches, allowed where it is reached ---- */
    // every script of ours the page loads, read off index.html, so a file split out of app.js is read too
    const ours = [...src('index.html').matchAll(/<script src="(src\/[^"?]+\.js)/g)].map((m) => m[1]);
    const code = ours.map(src).join('\n');
    t.ok('the code read for hosts is every script of ours the page loads (' + ours.length + ')',
      ours.length >= 8 && ['src/sync.js', 'src/app.js', 'src/train.js', 'src/today.js', 'src/door.js'].every((f) => ours.indexOf(f) >= 0), ours.join(' '));
    const origins = (re) => [...new Set([...code.matchAll(re)].map((m) => m[1]))];
    // scripts: the SDK's base and the sign-in client, the two hosts loadScript is handed
    const scriptHosts = origins(/(?:var SDK|var GIS_SRC)\s*=\s*'(https:\/\/[^/']+)/g).concat('https://apis.google.com');
    const fetchHosts = origins(/fetch\(\s*'(https:\/\/[^/']+)/g).concat(origins(/var url = '(https:\/\/[^/']+)/g));
    const cfg = src('src/config.js'), auth = /authDomain:\s*"([^"]+)"/.exec(cfg);
    t.ok('the code loads scripts from ' + scriptHosts.length + ' hosts, each one allowed',
      scriptHosts.length >= 3 && scriptHosts.every((h) => admits(P['script-src'], h)), scriptHosts.join(' '));
    t.ok('and fetches from ' + fetchHosts.length + ', each one allowed',
      fetchHosts.length >= 2 && fetchHosts.every((h) => admits(P['connect-src'], h)), fetchHosts.join(' '));
    t.ok('Firebase itself, Firestore and sign-in, is reachable',
      ['https://firestore.googleapis.com', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com'].every((h) => admits(P['connect-src'], h)));
    t.ok('and its auth domain and Google’s sign-in button may be framed',
      !!auth && admits(P['frame-src'], 'https://' + auth[1]) && admits(P['frame-src'], 'https://accounts.google.com'), auth && auth[1]);
    await p.context().close();

    /* ---- a walk through the app raises nothing ---- */
    const ctx = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || '') + ' ' + (e.sample || '')));
      try { localStorage.setItem('bsc.hintDone', '1'); } catch (e) { /* none */ }
    });
    // nothing leaves for Google, the USDA or Open Food Facts, as in every suite
    await ctx.route(/gstatic\.com|googleapis\.com|firebaseapp\.com|accounts\.google\.com|apis\.google\.com|api\.nal\.usda\.gov|openfoodfacts/, (r) => r.abort());
    const q = await ctx.newPage();
    q.on('pageerror', (e) => errs.push(e.message));
    await q.goto(t.base + 'index.html');
    await q.waitForTimeout(800);
    const boot = await q.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), api: typeof window.Theme }));
    t.ok('the theme is set before anything draws, from its own file', /^(light|dark)$/.test(boot.theme || '') && boot.api === 'object', JSON.stringify(boot));
    const go = async (sel) => {
      const el = await q.$(sel);
      if (!el) return false;
      try { await el.click({ timeout: 4000 }); } catch (e) { return 'stuck'; }
      await q.waitForTimeout(250);
      return true;
    };
    const walked = [];
    for (const v of ['today', 'browse', 'macros', 'train']) walked.push(v + ':' + await go('.tab[data-view="' + v + '"]'));
    // the week, list and pantry live inside Cook now
    for (const v of ['plan', 'list', 'pantry']) {
      await q.evaluate((v) => window.Hive.go(v), v);
      await q.waitForTimeout(250);
      walked.push(v + ':' + await q.evaluate((v) => !document.getElementById('view-' + v).classList.contains('hide'), v));
    }
    await go('.tab[data-view="browse"]');
    walked.push('recipe:' + await go('#grid .card'));
    await go('.sheet-x');
    await go('#view-browse [data-cookgo="plan"]');
    walked.push('planweek:' + await go('#planMyWeek'));
    await q.keyboard.press('Escape');
    walked.push('sync:' + await go('#syncBtn'));
    walked.push('dark:' + await go('[data-sync="theme"][data-v="dark"]'));
    const dark = await q.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const seen = await q.evaluate(() => window.__csp.slice());
    t.ok('every tab, a recipe, Plan my week, Sync & sharing and the dark theme: no violation',
      seen.length === 0 && dark === 'dark' && walked.every((w) => /:true$/.test(w)), JSON.stringify({ walked, seen, dark }));

    /* ---- and the thing it is for ---- */
    const xss = await q.evaluate(async () => {
      const d = document.createElement('div');
      d.innerHTML = '<img src="nope.png" onerror="window.__pwned = 1">';
      document.body.appendChild(d);
      await new Promise((r) => setTimeout(r, 300));
      const s = document.createElement('script');
      s.textContent = 'window.__pwned2 = 1';
      document.body.appendChild(s);
      await new Promise((r) => setTimeout(r, 100));
      d.remove(); s.remove();
      return { img: window.__pwned === 1, script: window.__pwned2 === 1, seen: window.__csp.length };
    });
    t.ok('an injected <img onerror> and an injected <script> both do nothing, and are reported',
      !xss.img && !xss.script && xss.seen >= 2, JSON.stringify(xss));

    // the sign-in script is blocked here, as everywhere in the suites (the known "gis is not defined")
    const real = errs.filter((e) => !/gis is not defined/.test(e));
    t.ok('no page errors', real.length === 0, real.join(' | '));
    await ctx.close();
  },
};
