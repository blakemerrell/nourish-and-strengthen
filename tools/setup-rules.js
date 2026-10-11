/* The security rules as SETUP.md asks somebody to paste them: firestore.rules
 * without its comments.
 *
 * SETUP.md said its copy was "the same as firestore.rules in this repository,
 * without the comments", and on 4 October it was not: it was a hand copy from
 * before named(), so a household set up from it let anonymous visitors fill
 * the members list, and checked dinner numbers more loosely. Now the copy is
 * made from the file, and tests/setuprules.test.js fails when they part.
 *
 *     node tools/setup-rules.js     # rewrite the block in SETUP.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RULES = path.join(ROOT, 'firestore.rules');
const SETUP = path.join(ROOT, 'SETUP.md');

// the rules, comments taken out and runs of blank lines made one
function stripped(rules) {
  const eol = rules.includes('\r\n') ? '\r\n' : '\n';
  return rules
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .filter((l) => !/^\s*\/\//.test(l))
    .map((l) => l.replace(/\s*\/\/.*$/, '').replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\{\n\n+/g, '{\n')
    .replace(/\n\n+(\s*\})/g, '\n$1')
    .trim()
    .replace(/\n/g, eol) + eol;
}

// the one fenced block in SETUP.md that holds rules: [start, end] of its body
function block(setup) {
  const re = /```\r?\n(rules_version[\s\S]*?)```/;
  const m = re.exec(setup);
  if (!m) throw new Error('SETUP.md has no fenced block starting rules_version');
  const fenceLen = m[0].indexOf('rules_version');
  return { start: m.index + fenceLen, end: m.index + fenceLen + m[1].length, body: m[1] };
}

module.exports = { stripped, block, RULES, SETUP };

if (require.main === module) {
  const setup = fs.readFileSync(SETUP, 'utf8');
  const b = block(setup);
  const next = stripped(fs.readFileSync(RULES, 'utf8'));
  fs.writeFileSync(SETUP, setup.slice(0, b.start) + next + setup.slice(b.end));
  console.log(b.body === next ? 'SETUP.md already matches firestore.rules' : 'SETUP.md rewritten from firestore.rules');
}
