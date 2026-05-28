// build.js — inline astro.js into index.html between the ASTRO_INLINE markers.
//
// Why: index.html is opened directly via file://, where browsers block ES-module
// imports of local files (CORS). Keeping astro.js as the single tested source and
// inlining a copy into index.html lets the page work by double-click, while tests
// still run against astro.js. Run `node build.js` after editing astro.js.

import { readFileSync, writeFileSync } from 'node:fs';

const START = '// ==ASTRO_INLINE_START==';
const END = '// ==ASTRO_INLINE_END==';

const astro = readFileSync('astro.js', 'utf8').replace(/^export\s+/gm, '').trim();
const html = readFileSync('index.html', 'utf8');

const s = html.indexOf(START);
const e = html.indexOf(END);
if (s === -1 || e === -1 || e < s) {
  console.error('ERROR: ASTRO_INLINE markers not found (or out of order) in index.html');
  process.exit(1);
}

const block =
  `${START} (generated from astro.js by \`node build.js\` — do not edit between the markers)\n` +
  `${astro}\n` +
  END;

writeFileSync('index.html', html.slice(0, s) + block + html.slice(e + END.length));
console.log(`Inlined astro.js (${astro.length} chars) into index.html`);
