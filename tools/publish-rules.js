#!/usr/bin/env node
/* Publishes firestore.rules to the live Firebase project.
 *
 *     FIREBASE_RULES_KEY="$(cat key.json)" node tools/publish-rules.js
 *
 * Run by .github/workflows/rules.yml when firestore.rules changes on main.
 * The rules used to be pasted into the console by hand, so what was live
 * could drift from what was reviewed here. Blake: "Can you get into firebase
 * and publish the new rules."
 *
 * It talks to the Firebase Rules API itself — make a ruleset from the file,
 * point Firestore's release at it, read the release back — rather than going
 * through firebase-tools, so the key it is given needs one role and nothing
 * else: Firebase Rules Admin. No packages: the token is a JWT signed with the
 * key's own private key, which is what every Google client library does.
 *
 * It refuses a key for any project but the one .firebaserc names, so a key
 * pasted into the wrong repository's secrets cannot publish these rules
 * somewhere they were never meant to be.
 *
 * RULES_API overrides the API's address, for tests/publishrules.test.js,
 * which runs all of this against a stand-in server. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const API = process.env.RULES_API || 'https://firebaserules.googleapis.com/v1';

class FailError extends Error {}

function fail(msg) {
  process.stderr.write('publish-rules: ' + msg + '\n');
  process.exitCode = 1;
  throw new FailError();
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function call(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: Object.assign({ 'content-type': 'application/json' }, token ? { authorization: 'Bearer ' + token } : {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { /* not JSON: said below */ }
  return { status: res.status, json, text };
}

// a service account's key, traded for an hour's access token
async function token(key) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: key.token_uri,
    iat: now,
    exp: now + 600
  }));
  const sig = b64url(crypto.createSign('RSA-SHA256').update(head + '.' + claims).sign(key.private_key));
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
      '&assertion=' + encodeURIComponent(head + '.' + claims + '.' + sig)
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) fail('Google would not trade the key for a token (' + res.status + '): ' + (j.error_description || j.error || 'no reason given'));
  return j.access_token;
}

async function main() {
  const raw = process.env.FIREBASE_RULES_KEY;
  if (!raw || !raw.trim()) {
    fail('no FIREBASE_RULES_KEY. Add it as a repository secret: SETUP.md, "Publishing the rules from GitHub". Nothing was published.');
  }
  let key;
  try { key = JSON.parse(raw); } catch (e) { fail('FIREBASE_RULES_KEY is not the JSON key file Google gave you. Nothing was published.'); }
  if (!key.client_email || !key.private_key || !key.token_uri || !key.project_id) {
    fail('FIREBASE_RULES_KEY is missing client_email, private_key, token_uri or project_id. Nothing was published.');
  }
  const want = JSON.parse(fs.readFileSync(path.join(ROOT, '.firebaserc'), 'utf8')).projects.default;
  if (key.project_id !== want) {
    fail('the key is for ' + key.project_id + ', and .firebaserc says ' + want + '. Nothing was published.');
  }

  const source = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const sha = crypto.createHash('sha256').update(source).digest('hex').slice(0, 12);
  const access = await token(key);
  const base = API + '/projects/' + want;

  // the file as a ruleset: Google compiles it here, and says what it will not take
  const made = await call('POST', base + '/rulesets', access, { source: { files: [{ name: 'firestore.rules', content: source }] } });
  if (made.status !== 200 || !made.json || !made.json.name) {
    const issues = made.json && made.json.error && made.json.error.details ? JSON.stringify(made.json.error.details) : made.text;
    fail('the rules were not accepted (' + made.status + '): ' + issues + '. Nothing was published.');
  }
  const ruleset = made.json.name;

  // Firestore's rules are whatever its release points at
  const relName = 'projects/' + want + '/releases/cloud.firestore';
  let rel = await call('PATCH', API + '/' + relName, access, { release: { name: relName, rulesetName: ruleset } });
  if (rel.status === 404) rel = await call('POST', base + '/releases', access, { name: relName, rulesetName: ruleset });
  if (rel.status !== 200) fail('the ruleset was made (' + ruleset + ') but Firestore was not pointed at it (' + rel.status + '): ' + rel.text);

  // and read back, so "published" means what is live is this file
  const live = await call('GET', API + '/' + relName, access);
  if (live.status !== 200 || !live.json || live.json.rulesetName !== ruleset) {
    fail('published, but reading it back gave ' + live.status + ' ' + (live.json && live.json.rulesetName) + ' instead of ' + ruleset);
  }
  const back = await call('GET', API + '/' + ruleset, access);
  const files = back.json && back.json.source && back.json.source.files;
  if (back.status !== 200 || !files || files.length !== 1 || files[0].content !== source) {
    fail('published, but the live ruleset does not read back as firestore.rules');
  }
  process.stdout.write('Published firestore.rules (sha256 ' + sha + ') to ' + want + ' as ' + ruleset.split('/').pop() + '.\n');
}

main().catch((e) => {
  if (!(e instanceof FailError)) fail(e && e.message ? e.message : String(e));
});
