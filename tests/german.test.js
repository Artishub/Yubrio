const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

// Every plain text passed to t('...') needs German, as an exact entry or through a pattern.
test('every translated text has German', () => {
  const { german } = require('../.test-build/design/de/index.js');
  const missing = new Set();
  for (const file of [...sourceFiles('app'), ...sourceFiles('src')]) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*[,)]/g)) {
      const text = match[1].replace(/\\'/g, "'");
      const known = text in german.exact || german.patterns.some(([pattern]) => pattern.test(text));
      if (!known) missing.add(`${file}: ${text}`);
    }
  }
  assert.deepEqual([...missing], []);
});
