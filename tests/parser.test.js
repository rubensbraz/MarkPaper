'use strict';

/**
 * @file tests/parser.test.js
 * @description Smoke tests for MarkPaper, runnable on plain Node (no framework):
 *   node tests/parser.test.js
 * The browser bootstrap in markpaper.js is skipped when there is no DOM, so the
 * module can be required directly for its parser, path validator, and CONFIG.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { MarkPaperParser, CONFIG, isSafeMarkdownPath } = require(path.join(ROOT, 'markpaper.js'));

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

let html;

// --- Security: URL protocols (links, images, raw HTML) ---

html = parser.parse('[click me](javascript:alert(1))');
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

// Footnote id must not break out of href/class attributes (reference + definition).
// A real breakout would produce a raw-quote event handler; after escaping the
// injected quotes become &quot; and stay inert inside the attribute value.
html = parser.parse('x[^1" autofocus onfocus="alert(1)" a="]\n\n[^1]: def');
check('footnote ref id cannot inject attributes', !html.includes('onfocus="'), html.slice(0, 400));
html = parser.parse('y[^a" onmouseover="alert(1)" b="]\n\n[^a" onmouseover="alert(1)" b="]: payload');
check('footnote definition id cannot inject attributes', !html.includes('onmouseover="'), html.slice(0, 500));

// --- Security: iframe host allowlist (raw HTML) ---

html = parser.parse('<iframe src="https://evil.example/x"></iframe>');
check('untrusted iframe blocked', !html.includes('<iframe'), html.slice(0, 200));

html = parser.parse('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
check('youtube iframe allowed', html.includes('<iframe') && html.includes('youtube.com/embed/abc'), html.slice(0, 200));

html = parser.parse('<iframe src="javascript:alert(1)"></iframe>');
check('javascript iframe blocked', !html.includes('<iframe'), html.slice(0, 200));

// --- Security: inline style allowlist ---

html = parser.parse('<div style="position:fixed;top:0;left:0;color:red">x</div>');
check('position stripped from style', !/position/i.test(html), html.slice(0, 200));
check('safe color kept in style', /color:\s*red/i.test(html), html.slice(0, 200));

html = parser.parse('<div style="background:url(http://evil/track.png)">x</div>');
check('url() in style stripped', !/url\(/i.test(html), html.slice(0, 200));

// --- Security: image width validation ---

html = parser.parse('![cap](https://example.com/a.png){width="50%"}');
check('valid width applied', html.includes('width: 50%'), html.slice(0, 200));

html = parser.parse('![cap](https://example.com/a.png){width="50%;position:fixed;top:0"}');
check('malicious width rejected', !/position/i.test(html) && !html.includes('width: 50%;position'), html.slice(0, 250));

// --- Security: file path validation ---

check('isSafeMarkdownPath accepts relative .md', isSafeMarkdownPath('paper.md') === true);
check('isSafeMarkdownPath accepts subfolder', isSafeMarkdownPath('content/paper.md') === true);
check('isSafeMarkdownPath rejects absolute URL', isSafeMarkdownPath('https://evil.com/x.md') === false);
check('isSafeMarkdownPath rejects protocol-relative', isSafeMarkdownPath('//evil.com/x.md') === false);
check('isSafeMarkdownPath rejects traversal', isSafeMarkdownPath('../../secret.md') === false);
check('isSafeMarkdownPath rejects non-markdown', isSafeMarkdownPath('config.json') === false);

// --- Links & URLs (positive) ---

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

// --- Placeholder collision safety: no internal PUA sentinel leaks to output ---

html = parser.parse('Math $a+b$, code `x`, a <mark>tag</mark>, and **bold**.');
const PH = String.fromCharCode(0xE000) + String.fromCharCode(0xE001);
check('no PUA sentinel leaks into output', !html.includes(PH[0]) && !html.includes(PH[1]), JSON.stringify(html.slice(0, 200)));

// --- Headings & metadata ---

html = parser.parse('## Chapter\n### Section\n#### Sub A\n#### Sub B');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
check('heading ids unique', new Set(ids).size === ids.length, JSON.stringify(ids));

html = parser.parse('# Title\nauthor: Ada\n\nBody text.');
check('known metadata consumed into header', html.includes('class="author"') && html.includes('Ada'), html.slice(0, 300));

html = parser.parse('# Title\nNote: read me first\n\nBody text.');
check('unknown metadata kept as content', html.includes('Note: read me first'), html.slice(0, 300));

// --- Tables (incl. alignment) ---

html = parser.parse('| A | B |\n| --- | --- |\n| 1 | 2 |');
check('table renders', html.includes('<th>A</th>') && html.includes('<td>1</td>'));

html = parser.parse('| L | C | R |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |');
check('center alignment applied', html.includes('text-align:center'), html.slice(0, 400));
check('right alignment applied', html.includes('text-align:right'), html.slice(0, 400));

// --- Blocks ---

html = parser.parse('```js\nconst x = 1;\n```');
check('fenced code language mapped', html.includes('language-javascript') && html.includes('const x = 1;'));

html = parser.parse('https://www.youtube.com/watch?v=Xd2xr7zIFyk');
check('youtube embed', html.includes('youtube.com/embed/Xd2xr7zIFyk'));

html = parser.parse('## S\nClaim[^1].\n\n[^1]: Footnote text.');
check('footnote rendered', html.includes('footnote-ref') && html.includes('Footnote text.'));

html = parser.parse('![My caption](https://example.com/a.png){width="50%"}');
check('figure with caption', html.includes('Fig 1 My caption'));

// --- Footer ---

html = parser.parse('x');
check('footer links carry rel=noopener', (html.match(/rel="noopener noreferrer"/g) || []).length >= 3, html.slice(-400));

// --- Void elements ---

html = parser.parse('![cap](https://example.com/a.png)');
check('img void element has no self-closing slash', html.includes('/>') === false || !/<img[^>]*\/>/.test(html), html.slice(0, 200));

// --- Markdown correctness (v1.5.0 fixes) ---

html = parser.parse('First line of one paragraph\nsecond line same paragraph.');
check('soft-wrapped lines form one paragraph',
  html.includes('<p>First line of one paragraph second line same paragraph.</p>'), html.slice(0, 200));

html = parser.parse('Two spaces break  \nthis line.');
check('two trailing spaces produce <br>', html.includes('<br>'), html.slice(0, 200));

html = parser.parse('This is _italic_ and __bold__ here.');
check('underscore emphasis', html.includes('<em>italic</em>') && html.includes('<strong>bold</strong>'), html.slice(0, 200));

html = parser.parse('Keep snake_case_name literal.');
check('intraword underscores stay literal', html.includes('snake_case_name') && !html.includes('<em>'), html.slice(0, 200));

html = parser.parse('A ***bold italic*** word.');
check('triple emphasis nests correctly', html.includes('<strong><em>bold italic</em></strong>'), html.slice(0, 200));

html = parser.parse('Literal \\*stars\\* and \\_unders\\_ here.');
check('backslash escapes literal punctuation', html.includes('*stars*') && !html.includes('<em>'), html.slice(0, 200));

html = parser.parse('[text](https://example.com "My Title")');
check('link title parsed not baked into href',
  html.includes('href="https://example.com"') && html.includes('title="My Title"'), html.slice(0, 250));

html = parser.parse('It costs $5 and then $10 total.');
check('currency not parsed as math', html.includes('$5 and then $10') && !html.includes('<code>') && !html.includes('katex'), html.slice(0, 250));

html = parser.parse('Mass-energy $E=mc^2$ holds.');
check('real inline math still parsed', !html.includes('$E=mc^2$'), html.slice(0, 250));

html = parser.parse('| a | b | c |\n| --- | --- | --- |\n| 1 |  | 3 |');
check('empty interior table cell preserved', (html.match(/<td/g) || []).length === 3, html.slice(0, 400));

html = parser.parse('## One\nRef[^x].\n\n## Two\nAgain[^x].\n\n[^x]: shared');
const fnIds = [...html.matchAll(/id="(footnote-[^"]+)"/g)].map(m => m[1]);
check('recurring footnote gets unique ids', fnIds.length === 2 && new Set(fnIds).size === 2, JSON.stringify(fnIds));

html = parser.parse('    line one\n    line two');
check('contiguous indented code is one block', (html.match(/code-block-container/g) || []).length === 1, html.slice(0, 300));

html = parser.parse('See the [docs][ref] page.\n\n[ref]: https://example.com/docs');
check('reference-style link resolved', html.includes('href="https://example.com/docs"') && html.includes('>docs</a>'), html.slice(0, 250));

html = parser.parse('* a\n    * b\n* c');
check('nested list nests inside parent li', /<li>a\s*<ul>/.test(html), html.slice(0, 300));

// --- Full document ---

const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
html = parser.parse(readme);
check('README parses', html.length > 5000 && html.includes('document-header'));

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
