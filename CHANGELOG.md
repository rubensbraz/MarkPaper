# Changelog

All notable changes to MarkPaper are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.4.0] - 2026-06-11

### Added

- **Local file upload**: open a Markdown file via the new upload button, or drag-and-drop a file anywhere on the page to render it instantly (read in-browser, nothing leaves the device).
- **Table column alignment** from the separator row (`:---`, `:---:`, `---:`).
- **Print stylesheet** (`@media print`): hides all interactive chrome, forces print colors, expands external link URLs, and avoids breaking figures/tables/alerts across pages.
- `prefers-color-scheme`: first-time visitors get dark mode automatically when their OS requests it.
- `prefers-reduced-motion`: disables smooth scrolling, transitions, and the spinner animation when requested.
- Content Security Policy and Subresource Integrity (SRI) for the pinned CDN assets; `preconnect` + `defer` for faster, safer loading.
- GitHub Actions CI running `node --check` and the parser test suite on every push/PR.
- Accessibility: `aria-label`/`aria-expanded` on controls, dialog role on the settings modal, labelled form controls.

### Security

- **Fix stored XSS via footnote ids**: the footnote reference/definition id was interpolated raw into `href`/`class`/`id` attributes after the escaping pass, allowing attribute breakout (e.g. `[^1" onfocus="alert(1)"]`). Ids are now escaped at every interpolation. (Found by an adversarial review pass.)
- Harden `sanitizeUrl` to also escape `<`, `>`, and `'` (defense in depth against attribute breakout).
- Validate the `?file=` parameter: only relative `.md`/`.markdown`/`.txt` paths are accepted (blocks third-party content injection on our origin, protocol-relative URLs, and `../` traversal).
- Restrict user-authored `<iframe>` to allowlisted video hosts (YouTube/Vimeo).
- Filter inline `style` attributes to a property allowlist (blocks `position` overlays, `url()` trackers, and CSS `expression`/`@import`).
- Validate the `{width=...}` image attribute against a strict CSS-length pattern.
- Collision-proof inline protection placeholders (Private Use Area sentinels).
- Footer attribution links now carry `rel="noopener noreferrer"`.

### Fixed

- Header metadata only consumes the known keys (author/date/institution/editor); other `key: value` lines render as content instead of vanishing. Keys are matched case-insensitively.
- Drop cap is scoped to the first body paragraph (no longer leaks into alerts, blockquotes, or the footer).
- Removed the `content/` auto-probe that caused a 404 on every default load.
- Error and uploaded documents now receive the full interactive UI.
- Removed no-op `clamp(1rem, 2.5vw, 1rem)` font sizes.
- Void elements (`<img>`) emitted without a self-closing slash.

### Changed

- UI lifecycle split into one-time chrome setup (`initChrome`) and per-document setup (`renderDocument`), so re-rendering an uploaded file does not duplicate controls or leak listeners.
- Centralized user-facing strings in `CONFIG.STRINGS`.
- The module now exports its classes for the Node test harness; the browser bootstrap is skipped when there is no DOM.

## [1.3.0] - 2026-06-11

### Security

- Block `javascript:`, `vbscript:`, `data:`, and `about:` URLs in Markdown links and images, including entity-encoded (`&colon;`, `&#106;`, `&#x6A;`) and control-character obfuscation.
- Escape TeX content in the KaTeX fallback path (no raw injection when the CDN is unavailable).
- Restore inline protection placeholders with function replacers so `$`-substitution patterns are inert.
- Strip non-allowlisted attributes (e.g. `onerror`) consistently via the shared `isDangerousUrl()` check.

### Fixed

- Alerts and blockquotes no longer absorb the paragraphs that follow them (a blank line now closes the block).
- `-` and `+` are unordered list markers per standard Markdown; only `1.` creates ordered lists.
- Unique anchor ids for H4–H6 headings (previously duplicated the parent section id).
- Inline code spans are protected from emphasis and autolink parsing.
- Corrupted LocalStorage data no longer breaks initialization.
- Reading progress bar divide-by-zero guard on short pages.
- `<video>`/`<audio>` are accepted by the sanitizer, matching the block-HTML detector.
- Dark mode: removed hardcoded colors from `.btn-reset:hover`.

### Changed

- Centralized UI timing/layout constants, LocalStorage keys, PrismJS theme URLs, and the dark preset in `CONFIG`.
- Standardized JSDoc (typedefs, `@private`, `@example`), semantic comment prefixes, single quotes, and `addEventListener` everywhere.
- z-index stacking order managed through a CSS variable scale.
- Throttled scroll-position persistence to one write per animation frame.

### Added

- `tests/parser.test.js` — Node smoke tests, including XSS vectors.
- `CLAUDE.md` with the mandatory coding standards.
- `.editorconfig` and `.gitattributes` (LF normalization).
- Loading-state spinner styles and task-list styles.
- `CHANGELOG.md` (this file).

### Removed

- Dead code: unused regex patterns, unused parameters and state, unreachable branches, and unused CSS variables.

## [1.2.0]

Baseline refactored release (project restructure, GitHub Pages live demo, LICENSE, attribution links).
