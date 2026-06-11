'use strict';

/**
 * @file tests/parser.test.js
 * @description Smoke tests for MarkPaperParser, runnable on plain Node (no framework):
 *   node tests/parser.test.js
 * The DOM entry section of markpaper.js is stripped so the parser runs headless.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'markpaper.js'), 'utf8');

// Strip everything from the application entry banner on (it requires a DOM)
const cut = src.indexOf('// 5. APPLICATION ENTRY');
const parserSrc = src.slice(0, cut).replace(/^'use strict';/, '') +
  '\nmodule.exports = { MarkPaperParser, CONFIG };';
const mod = { exports: {} };
new Function('module', 'exports', 'console', parserSrc)(mod, mod.exports, console);
const { MarkPaperParser } = mod.exports;

const parser = new MarkPaperParser();
let failures = 0;

/**
 * Records a single assertion result.
 * @param {string} name - Test description.
 * @param {boolean} cond - Assertion outcome.
 * @param {string} [extra] - Output excerpt shown on failure.
 */
function check(name, cond, extra) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${extra ? `\n      got: ${extra}` : ''}`);
  }
}

// --- Security (XSS vectors) ---

let html = parser.parse('[click me](javascript:alert(1))');
check('javascript: link blocked', !html.includes('href="javascript'), html.slice(0, 200));

html = parser.parse('[x](javascript&colon;alert(1))');
check('&colon; encoded protocol blocked', !/href="[^"]*alert/.test(html), html.slice(0, 200));

html = parser.parse('[x](&#106;avascript:alert(1))');
check('decimal entity protocol blocked', !/href="[^"]*alert/.test(html), html.slice(0, 200));

html = parser.parse('[x](&#x6A;avascript:alert(1))');
check('hex entity protocol blocked', !/href="[^"]*alert/.test(html), html.slice(0, 200));

html = parser.parse('inline ![alt](javascript:alert(1)) text');
check('javascript: img src blocked', !html.includes('src="javascript'), html.slice(0, 200));

html = parser.parse('<script>alert(1)</script>');
check('script tag escaped', !html.includes('<script>'), html.slice(0, 200));

html = parser.parse('<img src="x.png" onerror="alert(1)">');
check('onerror attribute stripped', !/onerror/i.test(html), html.slice(0, 200));

html = parser.parse('Inline $<script>bad()</script>$ math');
check('KaTeX fallback escaped', !html.includes('<script>'), html.slice(0, 300));

// --- Links & URLs ---

html = parser.parse('[site](https://example.com)');
check('https link rendered', html.includes('href="https://example.com"'));

html = parser.parse('[doc](docs/file.md)');
check('relative link rendered', html.includes('href="docs/file.md"'));

// --- Lists ---

html = parser.parse('- item one\n- item two');
check('dash renders <ul>', html.includes('<ul>') && !html.includes('<ol>'), html.slice(0, 200));

html = parser.parse('1. first\n2. second');
check('numbers render <ol>', html.includes('<ol>'));

html = parser.parse('- [x] done\n- [ ] todo');
check('task list items', (html.match(/task-list-item/g) || []).length === 2 && html.includes('checked'));

html = parser.parse('* a\n    * b\n* c');
check('nested list', (html.match(/<ul>/g) || []).length === 2);

// --- Blockquotes & alerts ---

html = parser.parse('> [!NOTE]\n> alert body\n\nA normal paragraph.');
check('alert does not absorb next paragraph',
  html.includes('<p>A normal paragraph.</p>') && html.indexOf('</div>') < html.indexOf('A normal paragraph'),
  html.slice(0, 400));

html = parser.parse('> quoted\n\nAfter quote.');
check('blockquote does not absorb next paragraph',
  html.indexOf('</blockquote>') < html.indexOf('After quote'), html.slice(0, 300));

html = parser.parse('> [!TIP]\n> first\n>\n> second\n\nend');
check('multi-paragraph alert', (html.match(/<p>/g) || []).length >= 3 && html.includes('alert-tip'));

// --- Inline syntax ---

html = parser.parse('Use `a*b*c` and `https://example.com` here.');
check('code content not italicized', html.includes('<code>a*b*c</code>'), html.slice(0, 300));
check('code URL not autolinked', html.includes('<code>https://example.com</code>'), html.slice(0, 300));

html = parser.parse('**b** *i* ~~s~~');
check('emphasis', html.includes('<strong>b</strong>') && html.includes('<em>i</em>') && html.includes('<s>s</s>'));

html = parser.parse('keep <mark>this</mark> visible');
check('mark tag kept', html.includes('<mark>this</mark>'));

// --- Headings ---

html = parser.parse('## Chapter\n### Section\n#### Sub A\n#### Sub B');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
check('heading ids unique', new Set(ids).size === ids.length, JSON.stringify(ids));

// --- Blocks ---

html = parser.parse('| A | B |\n| --- | --- |\n| 1 | 2 |');
check('table renders', html.includes('<th>A</th>') && html.includes('<td>1</td>'));

html = parser.parse('```js\nconst x = 1;\n```');
check('fenced code language mapped', html.includes('language-javascript') && html.includes('const x = 1;'));

html = parser.parse('https://www.youtube.com/watch?v=Xd2xr7zIFyk');
check('youtube embed', html.includes('youtube.com/embed/Xd2xr7zIFyk'));

html = parser.parse('## S\nClaim[^1].\n\n[^1]: Footnote text.');
check('footnote rendered', html.includes('footnote-ref') && html.includes('Footnote text.'));

html = parser.parse('![My caption](https://example.com/a.png){width="50%"}');
check('figure with width', html.includes('width: 50%') && html.includes('Fig 1 My caption'));

// --- Full document ---

const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
html = parser.parse(readme);
check('README parses', html.length > 5000 && html.includes('document-header'));

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
