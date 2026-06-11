# CLAUDE.md

Guidance for Claude Code (and any contributor) when working in this repository.
The rules below are **mandatory**. When in doubt, match the existing code exactly.

## Project Overview

MarkPaper is a lightweight, fully client-side Markdown renderer that turns `.md` files into clean, academic-style HTML documents. There is **no build step, no package manager, and no server-side code** — the files are served as-is (e.g., via GitHub Pages or any static server).

| File | Role |
| --- | --- |
| `index.html` | Entry point. Loads `markpaper.css`/`markpaper.js` plus PrismJS and KaTeX from CDNs. |
| `markpaper.js` | All application logic: parser, UI, settings, and bootstrap. |
| `markpaper.css` | All styling, fully driven by CSS variables. |
| `README.md` | User guide **and** live demo document (the default file rendered by the app). |
| `tests/parser.test.js` | Parser smoke tests, runnable with plain Node. |
| `CHANGELOG.md` | Release history (Keep a Changelog format). |
| `assets/` | Favicons and web manifest only. |

The app reads the `?file=` URL parameter (default `README.md`), looks for bare file names in `content/` first and then in the project root, parses the Markdown, and injects the HTML into `<article id="content">`.

## Fundamental Rules (mandatory)

1. **Vanilla JavaScript only.** No frameworks, no npm, no bundlers, no TypeScript. The only external dependencies are PrismJS (code highlighting) and KaTeX (math), loaded via CDN in `index.html`. Both must remain **optional at runtime**: every use is guarded by a `typeof X === 'undefined'` check with a graceful fallback.
2. **No build step.** Code must run directly in modern evergreen browsers. `'use strict';` is the first line of `markpaper.js`. Modern JS (classes, template literals, arrow functions, spread, `Map`) is allowed; Node-only APIs are not (except inside `tests/`).
3. **Single-file architecture with numbered sections.** `markpaper.js` is organized into five banner-delimited sections. New code goes into the matching section — do not create new source files:
   1. `CONFIGURATION & CONSTANTS` — the `CONFIG` object and shared `@typedef`s.
   2. `PARSER CORE` — `MarkPaperParser`.
   3. `UI & DOM CONTROLLER` — `MarkPaperUI`.
   4. `SETTINGS CONTROLLER` — `SettingsController`.
   5. `APPLICATION ENTRY` — the bootstrap IIFE (the only place that touches `fetch`/`DOMContentLoaded`).
4. **No magic values in logic.** Every constant lives in `CONFIG`:
   - Markdown regexes → `CONFIG.PATTERNS` (each with a short trailing comment);
   - UI timings and layout values → `CONFIG.UI` (suffix the key with its unit: `_MS`, `_PX`);
   - LocalStorage keys → `CONFIG.STORAGE_KEYS` (values prefixed `markpaper_`);
   - External theme URLs → `CONFIG.PRISM_THEMES`;
   - Theme variable sets → `CONFIG.DEFAULTS` / `CONFIG.DARK_PRESET` (both must stay in sync with `:root` in `markpaper.css`).
5. **The parser is a line-based state machine.** `parse()` dispatches each line through the numbered handler chain (`processCodeBlock` → … → paragraph fallback). Every `processX(line, ...)` handler returns a `boolean`: `true` means the line was consumed. Buffered blocks (code, math, table, blockquote, alert, lists) are flushed by their matching `flushX`/`closeX` method. Any new state field **must** be initialized in `reset()` — `parse()` calls `reset()` and must stay idempotent.
6. **Parser output is a string.** `MarkPaperParser` never touches the DOM. All DOM access belongs to `MarkPaperUI`/`SettingsController`/the entry IIFE.

## Security Rules (mandatory — XSS prevention)

1. **Never interpolate raw user/markdown input into HTML.** Every piece of user-controlled text must pass through exactly one of:
   - `escapeInline(text)` — inline Markdown parsing + sanitization (default for visible text);
   - `escapeHTML(text)` — full entity escaping (for attribute values and plain text);
   - `sanitizeHTML(text)` — allowlist filtering of raw HTML.
2. **Allowlist only.** Permitted tags/attributes are defined exclusively in `CONFIG.ALLOWED_TAGS` / `CONFIG.ALLOWED_ATTRIBUTES`. Never switch to a denylist approach. Adding a tag/attribute requires considering its XSS surface.
3. **Every URL placed in `href`/`src` must go through `sanitizeUrl()`** (which delegates to `isDangerousUrl()`). Blocked protocols: `javascript:`, `vbscript:`, `data:`, `about:` — including whitespace/control-character obfuscation and HTML-entity obfuscation (`&colon;`, decimal `&#...;`, hex `&#x...;`), which are decoded before the check exactly as a browser would.
4. **Protection maps in `escapeInline` use unique placeholders** (`__MATH_n__`, `__TAG_n__`, `__CODE_n__`) and must be restored with a **function replacer** (`replace(key, () => val)`) so `$`-substitution patterns in the values cannot be interpreted.
5. Generated links to external content always get `target="_blank" rel="noopener noreferrer"`.
6. Any change to sanitization/escaping must keep all security tests in `tests/parser.test.js` green and add a test for the new surface.

## Docstring Rules (JSDoc — mandatory)

Every class, method, function, and top-level constant has a JSDoc comment in **English**.

**File header** (top of `markpaper.js`):

```js
/**
 * @file markpaper.js
 * @description One-line summary.
 * Additional context lines if needed.
 * @version X.Y.Z
 */
```

**Classes** — multi-line JSDoc describing responsibility and stating the public API:

```js
/**
 * Main class responsible for parsing raw Markdown text into HTML.
 * It handles state management for nested blocks (lists, code, tables).
 * The only public method is parse(); everything else is internal.
 */
class MarkPaperParser { ... }
```

**Methods/functions** — multi-line form whenever there is at least one tag. Description first (third-person verb: "Processes…", "Renders…", "Detects…"), then tags in this fixed order: `@private` → `@param` → `@returns` → `@example`. Both `@param` and `@returns` use ` - ` (space-dash-space) before the description, which ends with a period:

```js
/**
 * Processes table rows and headers.
 * @private
 * @param {string} line - Current line.
 * @param {number} index - Current line index.
 * @param {string[]} lines - All lines.
 * @returns {boolean} - True if line was consumed.
 */
processTables(line, index, lines) { ... }
```

**Trivial public methods** (no params, no meaningful return, no tags) — single-line form:

```js
/** Closes the settings modal. */
close() { ... }
```

Additional rules:

- **`@private` on every internal method.** Public APIs are: `MarkPaperParser.parse()`, `MarkPaperUI.init()`, `SettingsController.init()/toggle()/close()`, and constructors. Everything else carries `@private` (and therefore uses the multi-line form).
- **`@example` is required** on the main API surfaces (`parse`, `escapeInline`, `sanitizeUrl`) and encouraged on any method whose input/output mapping is not obvious. The example shows a call and the expected result in a `// ->` comment.
- **`@typedef` for recurring object shapes** (`DocumentMeta`, `ListStackItem`, `ThemePrefs`), declared in section 1 right after `CONFIG`. Never use bare `{Object}` when a typedef exists or the shape repeats.
- **`@throws`** must be documented if a method can throw to its caller (currently none do — keep it that way unless justified).
- Parser line-handlers (`processX`) always document `@returns {boolean} - True if line was consumed.`
- Rendering helpers that build markup document `@returns {string} - HTML string.`
- Top-level constants use `@constant {Type}`.
- Never leave a method undocumented; never document the obvious (`@returns {void}` is forbidden).

## Type Hint Rules (JSDoc types — mandatory)

There is no TypeScript: **all type information lives in JSDoc braces**.

- Primitives: `{string}`, `{number}`, `{boolean}`.
- Arrays: `{string[]}` (bracket form, not `Array.<string>`).
- Named shapes: use the `@typedef` name (`{DocumentMeta}`, `{ThemePrefs}`); plain `{Object}` only for genuinely open-ended objects.
- Class instances: the class name, e.g. `{MarkPaperUI}`.
- Optional parameters with defaults: `@param {boolean} [displayMode=false] - ...`.
- Every `@param`/`@returns` must carry a type — an untyped tag is a defect.

## Comment Rules (mandatory)

- All comments are written in **English**, sentence case, and explain **why/what at block level** — not a paraphrase of the next line.
- **Semantic prefixes** for special comments (uppercase, colon):
  - `// SECURITY: ...` — anything protecting against XSS/injection; mandatory on sanitization-related logic.
  - `// PERF: ...` — performance-motivated decisions (throttling, precompiled regexes).
  - `// HACK: ...` — workarounds for external constraints (e.g. CDN load order), with the reason.
  - `// TODO(owner): ...` — future work; **must** name an owner. `TODO` without an owner is forbidden.
- Section banners in `markpaper.js` use exactly this format:

  ```js
  // ============================================================================
  // 2. PARSER CORE
  // ============================================================================
  ```

- Method-group separators inside a class use `// --- Group Name ---` (e.g. `// --- Block Handlers ---`).
- The dispatch chain in `parse()` keeps its numbered step comments (`// 1. Handle Code Blocks (Highest priority)` …). When adding a handler, renumber consistently.
- Every regex in `CONFIG.PATTERNS` carries a short trailing comment.
- CSS section banners use exactly this format, numbered and in order:

  ```css
  /* ------------------------------------------------------------------
     4. LAYOUT COMPONENTS
     ------------------------------------------------------------------ */
  ```

- No commented-out code, no redundant "end of X" markers. Dead code is deleted, not commented.

## Code Style (mandatory)

- **2-space indentation** in JS and HTML; **4-space** in CSS (enforced by `.editorconfig`).
- **Single quotes** for all JS strings. Double quotes appear only inside generated HTML attribute values.
- **Template literals for any string composition** — string concatenation with `+` is forbidden (`` `${scrolled}%` ``, never `scrolled + '%'`).
- **`addEventListener` only.** Never assign `el.onclick`/`el.oninput`/`el.onchange` — it silently overwrites other handlers. Scroll/resize listeners on `window`/`document` must pass `{ passive: true }` and throttle non-trivial work (e.g. via a `requestAnimationFrame` flag).
- **`parseInt` always takes the radix**: `parseInt(value, 10)`.
- `localStorage` reads and `JSON.parse` must be wrapped in `try/catch` with a sane fallback — never let corrupted storage break initialization.
- Semicolons everywhere. Short guard clauses and state-reset lines may share a line (`this.state.inTable = false; this.state.tableHeader = null;`) — follow the surrounding style.
- Line endings are **LF** (enforced by `.gitattributes`); files end with a final newline.

## Error Handling (mandatory)

- Every `catch` logs with the standard prefix and passes the error object:

  ```js
  console.error('MarkPaper: <short context in English>', e);
  ```

- Every `catch` must also leave the app in a working state (fallback value, default prefs, rendered error alert). Silently swallowing errors is forbidden.

## HTML Output Rules

- **Void elements never take a closing slash**: `<hr>`, `<br>`, `<img ...>` — never `<img ... />`.
- Generated attribute values always use double quotes; attribute content from user input is escaped (`escapeHTML`) or sanitized (`sanitizeUrl`) first.
- The CSS classes emitted by JS are a **contract** between `markpaper.js` and `markpaper.css`. Renaming one side requires updating the other. Main contract classes:

  | Emitted by | Classes |
  | --- | --- |
  | Parser — document | `document-header`, `author`, `date`, `institution`, `editor`, `markpaper-footer` |
  | Parser — blocks | `code-block-container`, `copy-btn` (+ `copied`), `task-list-item`, `image-figure`, `video-container`, `footnotes`, `footnote`, `footnote-ref` |
  | Parser — alerts | `alert`, `alert-{note,tip,important,warning,caution}`, `alert-header`, `alert-title`, `alert-content` |
  | UI | `hamburger-btn`, `settings-btn`, `side-menu`, `side-menu-header`, `table-of-contents`, `overlay`, `reading-progress`, `heading-anchor`, `loading-state`, `spinner` |
  | Settings | `settings-modal`, `settings-header`, `settings-body`, `setting-group`, `setting-actions`, `theme-buttons`, `btn-theme-light`, `btn-theme-dark`, `btn-reset`, `close-settings` |

## CSS Rules (mandatory)

- **Theming happens exclusively through CSS variables** declared in `:root` (section 1 of `markpaper.css`). JavaScript changes themes only via `style.setProperty('--var', value)` — never by injecting style rules.
- **No color values outside `:root`.** Every color in a rule body is a `var(...)` reference. Derived colors use `color-mix()` from the base variables (`--text-color`, `--background-color`, `--accent-color`, `--danger-color`) so presets and custom themes propagate automatically.
- **z-index only via the scale variables** (`--z-copy-btn` < `--z-controls` < `--z-overlay` < `--z-menu` < `--z-modal` < `--z-progress`). New layers get a new variable in the scale — never a literal number in a rule.
- **Units**: `rem`/`em` and `--baseline-unit` multiples for document content (typography, spacing); `px` is reserved for UI chrome (fixed buttons, menu widths), borders, and shadows, which must not scale with the reader's font-size setting. Font sizes use `clamp()` for fluid scaling.
- **Property order** inside each rule (applies to new and edited rules): positioning/stacking → box model (display, size, margin, padding) → typography → color/visual → transition/animation.
- The JS-controlled variables and their defaults are mirrored in `CONFIG.DEFAULTS`/`CONFIG.DARK_PRESET` — keep all three lists in sync when adding one.
- Responsive overrides live only in section 7 (`MEDIA QUERIES`), mobile-first breakpoints aligned with the existing ones.
- Every selector must be reachable from markup the parser/UI can emit (see the contract table above) or from documented user-supplied HTML. Unused rules and variables are deleted.

## Naming Conventions

- Classes: `PascalCase` (`MarkPaperParser`, `SettingsController`).
- Methods/variables: `camelCase`; parser handlers are `processX`, block finishers are `closeX`/`flushX`, UI initializers are `setupX`, markup builders are `renderX`, boolean helpers start with `is`/`has`.
- Constants and `CONFIG` keys: `UPPER_SNAKE_CASE` (`ALLOWED_TAGS`, `SCROLLSPY_OFFSET_PX`).
- CSS classes: `kebab-case` (`task-list-item`); CSS variables: `--kebab-case`.
- LocalStorage keys are prefixed `markpaper_` and registered in `CONFIG.STORAGE_KEYS`.

## Versioning & Commits

- **Conventional Commits** for every commit message: `fix:`, `feat:`, `docs:`, `refactor:`, `style:`, `test:`, `chore:` + imperative description (e.g. `fix: close alerts on blank lines`).
- Bump `@version` in the `markpaper.js` file header on any behavior-changing release (semver: fixes = patch, features = minor) and add a matching entry to `CHANGELOG.md` (Keep a Changelog sections: Security / Fixed / Changed / Added / Removed).

## Verification Checklist (before committing)

1. `node --check markpaper.js` — must pass.
2. `node tests/parser.test.js` — all tests must pass. Parser changes require new/updated tests, especially for the XSS vectors: `[x](javascript:alert(1))`, `[x](javascript&colon;alert(1))`, `[x](&#106;avascript:alert(1))`, `![x](javascript:alert(1))`, `<script>`, `<img onerror=...>` — none may survive into the output.
3. Serve the folder with any static server (e.g. `python -m http.server` or VS Code Live Server) and open `index.html`:
   - `README.md` renders fully (header, TOC, alerts, tables, math, code highlighting, footnotes, embeds);
   - the hamburger menu, settings modal, theme presets (light/dark), copy buttons, and reading progress bar all work;
   - no errors in the browser console.
