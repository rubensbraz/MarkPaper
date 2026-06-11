# Changelog

All notable changes to MarkPaper are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

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
