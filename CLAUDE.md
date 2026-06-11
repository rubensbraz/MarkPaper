# CLAUDE.md

Guidance for Claude Code (and any contributor) when working in this repository.
The rules below are **mandatory**. When in doubt, match the existing code exactly.

## Project Overview

MarkPaper is a lightweight, fully client-side Markdown renderer that turns `.md` files into clean, academic-style HTML documents. There is **no build step, no package manager, and no server-side code** — the files are served as-is (e.g., via GitHub Pages or any static server).

| File | Role |
| --- | --- |
| `index.html` | Entry point. Sets the CSP and loads `markpaper.css`/`markpaper.js` plus SRI-pinned PrismJS and KaTeX from CDNs. |
| `markpaper.js` | All application logic: parser, UI, settings, upload, and bootstrap. |
| `markpaper.css` | All styling, fully driven by CSS variables. |
| `README.md` | User guide **and** live demo document (the default file rendered by the app). |
| `tests/parser.test.js` | Parser/security smoke tests, runnable with plain Node. |
| `.github/workflows/ci.yml` | CI: `npm run check` + `npm test` on push/PR. |
| `package.json` | Metadata + `test`/`check` scripts (no runtime dependencies). |
| `CHANGELOG.md` | Release history (Keep a Changelog format). |
| `assets/` | Favicons and web manifest only. |

A document reaches the renderer three ways: the `?file=` URL parameter (default `README.md`, validated by `isSafeMarkdownPath`), the upload button, or drag-and-drop. The parsed HTML is injected into `<article id="content">`.

## Fundamental Rules (mandatory)

1. **Vanilla JavaScript only.** No frameworks, no npm, no bundlers, no TypeScript. The only external dependencies are PrismJS (code highlighting) and KaTeX (math), loaded via CDN in `index.html`. Both must remain **optional at runtime**: every use is guarded by a `typeof X === 'undefined'` check with a graceful fallback.
2. **No build step.** Code must run directly in modern evergreen browsers. `'use strict';` is the first line of `markpaper.js`. Modern JS (classes, template literals, arrow functions, spread, `Map`) is allowed; Node-only APIs are not (except inside `tests/`).
3. **Single-file architecture with numbered sections.** `markpaper.js` is organized into five banner-delimited sections. New code goes into the matching section — do not create new source files:
   1. `CONFIGURATION & CONSTANTS` — the `CONFIG` object and shared `@typedef`s.
   2. `PARSER CORE` — `MarkPaperParser`.
   3. `UI & DOM CONTROLLER` — `MarkPaperUI`.
   4. `SETTINGS CONTROLLER` — `SettingsController`.
   5. `APPLICATION ENTRY` — the bootstrap IIFE (the only place that touches `fetch`/`DOMContentLoaded`), guarded by `if (typeof document === 'undefined') return;` so the file can be required in Node. The file ends with a `module.exports` guarded by `typeof module` for the test harness; the browser never reaches it.
4. **No magic values in logic.** Every constant lives in `CONFIG`:
   - Markdown regexes → `CONFIG.PATTERNS` (each with a short trailing comment);
   - UI timings and layout values → `CONFIG.UI` (suffix the key with its unit: `_MS`, `_PX`);
   - User-facing text → `CONFIG.STRINGS` (no hardcoded UI strings in handlers or generated markup; keeps wording consistent and i18n-ready);
   - LocalStorage keys → `CONFIG.STORAGE_KEYS` (values prefixed `markpaper_`);
   - Upload constraints → `CONFIG.UPLOAD`; allowlists → `CONFIG.ALLOWED_*` / `CONFIG.EMBED_HOST_ALLOWLIST` / `CONFIG.METADATA_KEYS`;
   - External theme URLs → `CONFIG.PRISM_THEMES`;
   - Theme variable sets → `CONFIG.DEFAULTS` / `CONFIG.DARK_PRESET` (both must stay in sync with `:root` in `markpaper.css`).
5. **The parser is a line-based state machine.** `parse()` dispatches each line through the numbered handler chain (`processCodeBlock` → … → list-continuation → buffered paragraph). Every `processX(line, ...)` handler returns a `boolean`: `true` means the line was consumed. Buffered blocks (code, math, **indented code**, table, blockquote, alert, lists, **paragraph**) are flushed by their matching `flushX`/`closeX` method; a handler that starts a new block must first close the soft blocks (`closeParagraph()`, `flushIndentCode()`). Soft-wrapped lines accumulate in `paragraphBuffer` and join into one `<p>` (space, or `<br>` for a hard break = two trailing spaces). Lists track an open `<li>` **per stack level** (`itemOpen`) so nesting stays inside the parent item and continuation lines can extend it. Footnote anchor ids carry a `footnoteEpoch` suffix so a footnote reused across sections stays unique. Any new state field **must** be initialized in `reset()` — `parse()` calls `reset()` and must stay idempotent.
6. **Parser output is assembled into `this.html` (an array), returned via `join('')`.** Append with `this.html.push(...)`, never `+=`. `MarkPaperParser` never touches the DOM. All DOM access belongs to `MarkPaperUI`/`SettingsController`/the entry IIFE.
7. **`escapeInline` runs a fixed protect→transform→restore pipeline:** protect backslash-escapes → protect inline math (`CONFIG.PATTERNS.INLINE_MATH`, currency-safe) → `sanitizeHTML` → protect valid tags → escape `& < >` → restore tags+math → protect inline code → emphasis (`***`/`___`/`**`/`__`/`*`/`_`/`~~`, underscore variants are word-boundary gated) → images → footnote refs → reference links → inline links → autolink → restore code → restore escapes. New inline syntax slots into this order; never interpolate user text after the escaping pass without re-escaping (see Security rule 7). Reference-link and footnote definitions are harvested in `preprocess()`. Lookbehind regexes are allowed (evergreen-browser target).
8. **UI lifecycle is split in two.** `MarkPaperUI.initChrome()` builds the persistent chrome and global listeners **once**; `renderDocument()` wires everything that depends on freshly rendered content and is **safe to call repeatedly** (uploads, error pages). Per-document setup must not add `window`/`document` listeners (they would accumulate) — register those in `initChrome()` and have them query the live DOM. A single `requestAnimationFrame`-throttled scroll listener (`setupScroll`) drives the progress bar, scrollspy, and position save together. Rendering text is delegated from the UI back to the entry via the `onUploadDocument` callback so the parser stays out of the UI layer.

## Security Rules (mandatory — XSS prevention)

1. **Never interpolate raw user/markdown input into HTML.** Every piece of user-controlled text must pass through exactly one of:
   - `escapeInline(text)` — inline Markdown parsing + sanitization (default for visible text);
   - `escapeHTML(text)` — full entity escaping (for attribute values and plain text);
   - `sanitizeHTML(text)` — allowlist filtering of raw HTML.
2. **Allowlist only.** Permitted tags/attributes are defined exclusively in `CONFIG.ALLOWED_TAGS` / `CONFIG.ALLOWED_ATTRIBUTES`. Never switch to a denylist approach. Adding a tag/attribute requires considering its XSS surface.
3. **Every URL placed in `href`/`src` must go through `sanitizeUrl()`** (which delegates to `isDangerousUrl()`). Blocked protocols: `javascript:`, `vbscript:`, `data:`, `about:` — including whitespace/control-character obfuscation and HTML-entity obfuscation (`&colon;`, decimal `&#...;`, hex `&#x...;`), which are decoded before the check exactly as a browser would.
4. **`<iframe>` in raw HTML is host-gated.** `sanitizeHTML` only keeps an iframe whose `src` resolves (over HTTPS) to a host in `CONFIG.EMBED_HOST_ALLOWLIST`; everything else is escaped. Add a host to the allowlist deliberately, never widen to `*`.
5. **Inline `style` is property-gated.** `sanitizeStyle()` keeps only `CONFIG.ALLOWED_STYLE_PROPS` and drops `url(...)`, `expression(...)`, `javascript:`, and `@import`. Never allow `position`/`inset` (overlay/clickjacking surface). The `{width=...}` image attribute is validated against `CONFIG.PATTERNS.DIMENSION`.
6. **The `?file=` parameter is validated by `isSafeMarkdownPath()`** before any `fetch`: relative path only, no scheme, no `//`, no `..`, no control chars, and a `.md`/`.markdown`/`.txt` extension. This prevents loading third-party content onto our origin.
7. **Protection maps in `escapeInline` use Private-Use-Area sentinels** (`PH_OPEN`/`PH_CLOSE`, built with `String.fromCharCode` so the source carries no literal escapes) to make placeholder collisions with document text impossible, and are restored with a **function replacer** (`replace(key, () => val)`) so `$`-substitution patterns in the values cannot be interpreted.
8. Generated links to external content always get `target="_blank" rel="noopener noreferrer"`.
9. **Defense in depth at the delivery layer:** `index.html` ships a `Content-Security-Policy` meta tag (scripts/styles limited to self + the two pinned CDNs; embeds to YouTube/Vimeo; `object-src 'none'`) and `integrity`/`crossorigin` (SRI) on every statically-referenced CDN asset. When bumping a CDN version, recompute the SRI hash. The dynamically-swapped Prism theme stylesheet cannot carry SRI — keep it on an allowlisted CDN origin.
10. Any change to sanitization/escaping must keep all security tests in `tests/parser.test.js` green and add a test for the new surface.

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

- **`@private` on every internal method.** Public APIs are: `MarkPaperParser.parse()`, `MarkPaperUI.initChrome()/renderDocument()`, `SettingsController.init()/toggle()/close()`, the top-level `isSafeMarkdownPath()`, and constructors. Everything else carries `@private` (and therefore uses the multi-line form).
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
- **Template literals for any string composition** — string concatenation with `+` is forbidden (`` `${scrolled}%` ``, never `scrolled + '%'`). Parser markup is pushed onto the `this.html` array, never built with `+=`.
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
  | UI | `hamburger-btn`, `settings-btn`, `upload-btn`, `upload-input`, `side-menu`, `side-menu-header`, `table-of-contents`, `overlay`, `reading-progress`, `heading-anchor`, `loading-state`, `spinner`, `drop-zone`, `drop-zone-inner`, `drag-active` (on `<body>`) |
  | Settings | `settings-modal`, `settings-header`, `settings-body`, `setting-group`, `setting-actions`, `theme-buttons`, `btn-theme-light`, `btn-theme-dark`, `btn-reset`, `close-settings` |

## CSS Rules (mandatory)

- **Theming happens exclusively through CSS variables** declared in `:root` (section 1 of `markpaper.css`). JavaScript changes themes only via `style.setProperty('--var', value)` — never by injecting style rules.
- **No color values outside `:root`.** Every color in a rule body is a `var(...)` reference. Derived colors use `color-mix()` from the base variables (`--text-color`, `--background-color`, `--accent-color`, `--danger-color`) so presets and custom themes propagate automatically.
- **z-index only via the scale variables** (`--z-copy-btn` < `--z-controls` < `--z-overlay` < `--z-menu` < `--z-modal` < `--z-progress`). New layers get a new variable in the scale — never a literal number in a rule.
- **Units**: `rem`/`em` and `--baseline-unit` multiples for document content (typography, spacing); `px` is reserved for UI chrome (fixed buttons, menu widths), borders, and shadows, which must not scale with the reader's font-size setting. Font sizes use `clamp()` for fluid scaling.
- **Property order** inside each rule (applies to new and edited rules): positioning/stacking → box model (display, size, margin, padding) → typography → color/visual → transition/animation.
- The JS-controlled variables and their defaults are mirrored in `CONFIG.DEFAULTS`/`CONFIG.DARK_PRESET` — keep all three lists in sync when adding one.
- Responsive overrides live in section 7 (`MEDIA QUERIES`); section 8 holds the `prefers-reduced-motion` block; section 9 holds the `@media print` rules. Keep the banner numbering in order.
- Every selector must be reachable from markup the parser/UI can emit (see the contract table above) or from documented user-supplied HTML. Unused rules and variables are deleted.

## Accessibility (mandatory)

- Icon-only controls (hamburger, settings, upload) carry an `aria-label`; their inline `<svg>` is `aria-hidden="true"`.
- The hamburger toggles `aria-expanded`; the settings modal has `role="dialog"` + `aria-modal` + `aria-label`; form controls in the modal use `<label for=...>`.
- **Off-screen panels must be `inert` when closed** (side menu, settings modal) so they are not keyboard-reachable. Opening a panel moves focus into it and stores the trigger; closing restores focus to the trigger; `Tab` is trapped within the open panel (`getFocusable`/`trapTab`).
- A **skip-to-content** link is the first focusable element; `#content` is `tabindex="-1"` so it can receive focus.
- Honor user preferences: `prefers-reduced-motion` (no smooth scroll/transitions/animations — both in CSS and via `MarkPaperUI.scrollBehavior()`), and `prefers-color-scheme` (first-visit default theme in `SettingsController.loadPrefs`).
- Decorative anchors that are also interactive (the heading `#` link) get a real `aria-label`, not `aria-hidden`.

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

CI (`.github/workflows/ci.yml`) runs steps 1–2 on every push/PR; run them locally first.

1. `npm run check` (`node --check markpaper.js`) — must pass.
2. `npm test` (`node tests/parser.test.js`) — all tests must pass. Parser/security changes require new/updated tests, especially for the XSS vectors: `[x](javascript:alert(1))`, `[x](javascript&colon;alert(1))`, `[x](&#106;avascript:alert(1))`, `![x](javascript:alert(1))`, `<script>`, `<img onerror=...>`, `<iframe src="https://evil/">`, `<div style="position:fixed">`, and footnote-id breakout (`[^1" onfocus=...]`) — none may survive into the output. Bump `@version` in `markpaper.js` **and** `package.json` together.
3. Serve the folder with any static server (e.g. `python -m http.server` or VS Code Live Server) and open `index.html`:
   - `README.md` renders fully (header, TOC, alerts, tables with alignment, math, code highlighting, footnotes, embeds);
   - the hamburger menu, settings modal, theme presets (light/dark), copy buttons, reading progress bar, **upload button, and drag-and-drop** all work;
   - **Print Preview** hides the chrome and shows link URLs;
   - no errors or CSP violations in the browser console.
