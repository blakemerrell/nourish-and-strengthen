/* Every mutation tools/mutate.js makes still has something to change.
 *
 * tools/mutate.js breaks code the app depends on, on purpose, and runs the
 * suite to see whether anything notices. It finds the code by its exact
 * text, and when that text is rewritten the mutation finds nothing, is
 * skipped, and says so only in the last lines of a long run. Two had gone
 * that way unnoticed (one since 29 September, one since 3 October) when this
 * was written. This reads the list and the files, with no browser, so the
 * rewrite that loses a mutation's text fails the run that makes it. */
const fs = require('fs');
const path = require('path');
const { M } = require('../tools/mutate.js');

const ROOT = path.join(__dirname, '..');
const read = (f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n') : '');
const count = (text, bit) => text.split(bit).length - 1;

module.exports = {
  name: 'Mutations still aimed at something',
  async run(t) {
    M.forEach(([name, file, from, to, altFile]) => {
      /* Run by mutate.js with this one applied: its text is meant to be
         gone, and failing here would make every mutation look caught. */
      if (process.env.MUTANT === name) return;
      /* The same choice mutate.js makes: the file named first, or the one
         the code was moved to. Once, because replace() changes only the
         first, and a second copy would go on passing for the mutated one. */
      const where = [file, altFile].filter(Boolean).find((f) => count(read(f), from) > 0);
      const n = where ? count(read(where), from) : 0;
      t.ok('"' + name + '" finds its code, once', n === 1 && from !== to,
        (where || file) + ': ' + n + ' matches for ' + JSON.stringify(from).slice(0, 120));
    });
  },
};
