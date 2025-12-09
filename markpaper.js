'use strict';

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  // Tags allowed in the final HTML (Sanitization whitelist)
  ALLOWED_TAGS: [
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark',
    'span', 'div', 'p', 'br', 'hr', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'q', 'cite',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img', 'sub', 'sup', 'small', 'abbr', 'time',
    'figure', 'figcaption'
  ],

  // Attributes allowed on tags
  ALLOWED_ATTRIBUTES: [
    'class', 'id', 'style', 'title', 'lang', 'dir',
    'href', 'target', 'rel', // <a>
    'src', 'alt', 'width', 'height', // <img>
    'colspan', 'rowspan', // <table>
    'datetime', 'cite', 'type', 'disabled', 'checked' // <input>, <time>, etc
  ],

  // Patterns to identify Markdown syntax
  PATTERNS: {
    METADATA: /^(\w+):\s*(.+)$/,
    H1: /^#\s+(.*)/,
    HEADING: /^(#{2,6})\s+(.*)/,
    HR: /^(\*{3,}|-{3,}|_{3,})$/,
    LIST_UL: /^(\s*)\*\s+(.*)$/,
    LIST_OL: /^(\s*)(-|\d+\.)\s+(.*)$/,
    CHECKBOX: /^\[([xX ]?)\]\s+(.*)$/,
    BLOCKQUOTE: /^> ?(.*)/,
    ALERT: /^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]$/,
    FENCE_START: /^(```+|````+)(\w*)/,
    TABLE_ROW: /^\s*\|?(.+)\|?\s*$/,
    IMAGE: /^!\[([^\]]*)\]\(([^)]+)\)/,
    FOOTNOTE_DEF: /^\[\^([^\]]+)\]:\s*(.+)$/
  }
};

// ============================================================================
// 2. PARSER CORE
// ============================================================================

class MarkPaperParser {
  constructor() {
    this.reset();
  }

  /**
   * Resets the internal state of the parser.
   */
  reset() {
    this.html = '';
    this.globalFigureNum = 0;
    this.currentFileName = '';

    // Numbering State
    this.chapterNum = 0;
    this.sectionNum = 0;
    this.currentSectionLevel = 0; // 1=h1, 2=h2...

    // Footnote State
    this.footnotesDef = {};        // Map: id -> content
    this.sectionFootnotes = [];    // List of IDs used in current section

    // Block State
    this.state = {
      inCodeBlock: false,
      codeFence: '',
      codeLang: '',
      codeBuffer: [],

      inTable: false,
      tableHeader: null,
      tableRows: [],

      inBlockquote: false,
      blockquoteBuffer: [],

      inAlert: false,
      alertType: '',
      alertBuffer: [],

      // List Stack: Array of objects { type: 'ul'|'ol', level: int }
      listStack: [],
      // Ordered List Counters: Array of integers, index corresponds to nesting level
      listCounters: []
    };
  }

  /**
   * Main parsing method.
   * @param {string} markdown - Raw Markdown text.
   * @param {string} fileName - Current file name for footer.
   * @returns {string} - Compiled HTML.
   */
  parse(markdown, fileName = 'unknown file') {
    this.reset();
    this.currentFileName = fileName;

    const rawLines = markdown.split(/\r?\n/);

    // Pass 0: Extract Footnote Definitions & Metadata
    const lines = this.preprocess(rawLines);

    // Pass 1: Line-by-line Processing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd(); // Keep indentation, remove trailing whitespace

      // 1. Handle Code Blocks (Priority: they consume everything, including empty lines)
      if (this.processCodeBlock(line)) continue;
      if (this.state.inCodeBlock) {
        this.state.codeBuffer.push(line);
        continue;
      }

      // 2. Handle Empty Lines (Close tight blocks like lists/tables)
      if (line.trim() === '') {
        this.processEmptyLine();
        continue;
      }

      // 3. Handle Indented Code Blocks (4 spaces or tab)
      // Must not be inside a list, alert, or other blocks if strict
      if (this.processIndentedCode(line)) continue;

      // 4. Handle Headings (H1-H6)
      if (this.processHeadings(line, i, lines)) continue;

      // 5. Handle Horizontal Rules
      if (CONFIG.PATTERNS.HR.test(line.trim())) {
        this.closeAllBlocks();
        this.html += '<hr>\n';
        continue;
      }

      // 6. Handle Lists (UL/OL)
      if (this.processLists(line)) continue;

      // 7. Handle Tables
      if (this.processTables(line, i, lines)) continue;

      // 8. Handle Blockquotes & Alerts
      if (this.processQuotesAndAlerts(line)) continue;

      // 9. Handle Standalone Images
      if (this.processStandaloneImage(line)) continue;

      // 10. Default: Paragraph
      // Close lists/tables if we hit a standard paragraph text
      this.closeList();
      this.closeTable();
      this.closeBlockquote(); // Standard paragraphs usually break quotes in this strict parser
      this.closeAlert();

      this.html += `<p>${this.escapeInline(line)}</p>\n`;
    }

    // Final Cleanup
    this.closeAllBlocks();
    this.appendSectionFootnotes(); // Flush remaining footnotes
    this.html += this.generateFooter();

    return this.html;
  }

  // --- Pre-processing ---

  preprocess(lines) {
    const cleanedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract Footnotes
      const fnMatch = line.match(CONFIG.PATTERNS.FOOTNOTE_DEF);
      if (fnMatch) {
        this.footnotesDef[fnMatch[1]] = fnMatch[2];
        continue; // Remove definition from output lines
      }

      cleanedLines.push(line);
    }
    return cleanedLines;
  }

  // --- Block Handlers ---

  processCodeBlock(line) {
    const match = line.match(CONFIG.PATTERNS.FENCE_START);
    if (match) {
      const fence = match[1];
      const lang = match[2];

      if (this.state.inCodeBlock) {
        // Only close if fence matches the opener (``` vs ````)
        if (fence === this.state.codeFence) {
          this.flushCodeBlock();
          return true;
        }
        // Nested fence, treat as content
        return false;
      } else {
        // Start Code Block
        this.closeAllBlocks();
        this.state.inCodeBlock = true;
        this.state.codeFence = fence;
        this.state.codeLang = lang;
        this.state.codeBuffer = [];
        return true;
      }
    }
    return false;
  }

  processIndentedCode(line) {
    // Check for 4 spaces or tab at start
    // Exclude if likely a list item
    if ((line.startsWith('    ') || line.startsWith('\t')) &&
      !CONFIG.PATTERNS.LIST_UL.test(line) &&
      !CONFIG.PATTERNS.LIST_OL.test(line)) {

      this.closeList();
      // Treat as single line code block or part of one? 
      // Simplicity: Render immediately as container
      const codeText = line.replace(/^(    |\t)/, '');
      this.html += `<div class="code-block-container"><button class="copy-btn">Copy</button><pre><code>${this.escapeHTML(codeText)}</code></pre></div>\n`;
      return true;
    }
    return false;
  }

  processHeadings(line, index, lines) {
    // H1 (Metadata handling)
    const h1Match = line.match(CONFIG.PATTERNS.H1);
    if (h1Match) {
      this.closeAllBlocks();
      this.appendSectionFootnotes(); // Flush previous footnotes
      this.currentSectionLevel = 1;

      // Extract Metadata (look ahead)
      let metadata = {};
      let k = index + 1;
      let consumedLines = 0;

      while (k < lines.length) {
        const nextLine = lines[k].trim();
        if (nextLine === '') {
          k++; consumedLines++; continue;
        }
        const metaMatch = nextLine.match(CONFIG.PATTERNS.METADATA);
        if (metaMatch) {
          metadata[metaMatch[1]] = metaMatch[2];
          lines[k] = ''; // Remove line from future processing
          k++;
        } else {
          break;
        }
      }

      this.html += this.renderDocumentHeader(h1Match[1], metadata);
      return true;
    }

    // H2-H6
    const hMatch = line.match(CONFIG.PATTERNS.HEADING);
    if (hMatch) {
      this.closeAllBlocks();

      const level = hMatch[1].length;
      const text = hMatch[2];

      // Logic: Flush footnotes if level <= current, or if starting a new subsection (level >=3)
      if (level <= this.currentSectionLevel || this.currentSectionLevel >= 3) {
        this.appendSectionFootnotes();
      }

      this.currentSectionLevel = level;

      // Auto-numbering logic
      let displayText = text;
      if (level === 2) {
        this.chapterNum++;
        this.sectionNum = 0;
        displayText = `${this.chapterNum} ${text}`;
      } else if (level === 3) {
        this.sectionNum++;
        displayText = `${this.chapterNum}.${this.sectionNum} ${text}`;
      }

      this.html += `<h${level}>${this.escapeInline(displayText)}</h${level}>\n`;
      return true;
    }

    return false;
  }

  processLists(line) {
    let match, type, content;

    // Detect Type
    const ulMatch = line.match(CONFIG.PATTERNS.LIST_UL);
    const olMatch = line.match(CONFIG.PATTERNS.LIST_OL);

    if (ulMatch) {
      match = ulMatch;
      type = 'ul';
      content = match[2];
    } else if (olMatch) {
      match = olMatch;
      type = 'ol';
      content = match[3];
    } else {
      return false; // Not a list
    }

    // Close non-list blocks
    this.closeBlockquote();
    this.closeAlert();
    this.closeTable();

    // Determine Level based on indentation (2 spaces = 1 level)
    const indent = match[1].length;
    const level = Math.floor(indent / 2);

    // 1. Close deeper levels
    while (this.state.listStack.length > level + 1) {
      this.closeOneListLevel();
    }

    // 2. Open new level
    if (this.state.listStack.length <= level) {
      // If switching type at same level, close current first
      if (this.state.listStack.length === level + 1 && this.state.listStack[level].type !== type) {
        this.closeOneListLevel();
      }

      // If we still need to open a level
      if (this.state.listStack.length <= level) {
        this.html += `<${type}>\n`;
        this.state.listStack.push({ type: type, level: level });

        // Initialize counter for OL
        if (type === 'ol') {
          this.state.listCounters[level] = 1;
        }
      }
    }

    // 3. Handle OL Counter Increment
    if (type === 'ol') {
      // Logic handled via CSS counters mostly, but if we need manual:
      // this.state.listCounters[level]++;
    }

    // 4. Render Item
    // Check for Task List
    const taskMatch = content.match(CONFIG.PATTERNS.CHECKBOX);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x' ? 'checked' : '';
      const text = taskMatch[2];
      this.html += `<li class="task-list-item"><input type="checkbox" disabled ${checked}> ${this.escapeInline(text)}</li>\n`;
    } else {
      this.html += `<li>${this.escapeInline(content)}</li>\n`;
    }

    return true;
  }

  processTables(line, index, lines) {
    // Must contain |
    if (!line.includes('|')) return false;

    // Check if it looks like a table row
    const match = line.match(CONFIG.PATTERNS.TABLE_ROW);
    if (!match) return false;

    const cells = match[1].split('|').map(c => c.trim()).filter(c => c !== '');

    // Check for Separator Line (|---|---|)
    const isSeparator = cells.every(c => /^[-\s:]+$/.test(c));
    if (isSeparator) return true; // Just consume, don't render

    this.closeList();
    this.closeBlockquote();
    this.closeAlert();

    if (!this.state.inTable) {
      this.state.inTable = true;
      // Look ahead to see if next line is separator. If so, this is Header
      const nextLine = (index + 1 < lines.length) ? lines[index + 1] : '';
      if (nextLine.includes('|') && nextLine.includes('-')) {
        this.state.tableHeader = cells;
      } else {
        this.state.tableRows.push(cells);
      }
    } else {
      this.state.tableRows.push(cells);
    }
    return true;
  }

  processQuotesAndAlerts(line) {
    // Check if line is part of a quote/alert context
    const isQuoteChar = line.startsWith('>');

    // If we are not in a quote/alert and line doesn't start with >, not a quote
    if (!isQuoteChar && !this.state.inAlert && !this.state.inBlockquote) return false;

    let content = '';
    if (isQuoteChar) {
      content = line.slice(1).trim(); // Remove '>'
    } else {
      // Only continue if currently open (lazy)
      if (this.state.inAlert) content = line;
      else if (this.state.inBlockquote) content = line;
      else return false;
    }

    // Check for Alert Definition
    const alertMatch = content.match(CONFIG.PATTERNS.ALERT);
    if (alertMatch) {
      this.closeList();
      this.closeAlert(); // Close existing
      this.closeBlockquote();

      this.state.inAlert = true;
      this.state.alertType = alertMatch[1].toLowerCase();
      return true;
    }

    if (this.state.inAlert) {
      this.state.alertBuffer.push(content);
      return true;
    }

    // Regular Blockquote
    this.closeList();
    this.closeAlert();
    if (!this.state.inBlockquote) this.state.inBlockquote = true;

    this.state.blockquoteBuffer.push(content);
    return true;
  }

  processStandaloneImage(line) {
    const match = line.match(CONFIG.PATTERNS.IMAGE);
    if (match) {
      // Check for attributes syntax at end: ![alt](src){width=50%}
      const fullMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(?:\{([^}]+)\})?$/);
      if (fullMatch) {
        this.closeAllBlocks();
        const [_, alt, src, attrs] = fullMatch;
        let style = '';
        if (attrs) {
          const w = attrs.match(/width\s*=\s*"?([^"}]+)"?/);
          if (w) style = ` style="width: ${this.escapeHTML(w[1])};"`;
        }

        this.html += `<figure class="image-figure">`;
        this.html += `<img src="${src}" alt="${this.escapeHTML(alt)}"${style} />`;
        if (alt && alt.trim()) {
          this.globalFigureNum++;
          this.html += `<figcaption>Fig ${this.globalFigureNum} ${this.escapeHTML(alt)}</figcaption>`;
        }
        this.html += `</figure>\n`;
        return true;
      }
    }
    return false;
  }

  processEmptyLine() {
    if (this.state.inCodeBlock) {
      this.state.codeBuffer.push('');
    } else if (this.state.inAlert) {
      this.state.alertBuffer.push('');
    } else if (this.state.inBlockquote) {
      this.state.blockquoteBuffer.push('');
    } else {
      // Empty line usually closes lists and tables
      this.closeList();
      this.closeTable();
      this.closeBlockquote();
      this.closeAlert();
    }
  }

  // --- Closers (Flushing Buffers) ---

  flushCodeBlock() {
    if (!this.state.inCodeBlock) return;

    const langClass = this.state.codeLang ? ` class="language-${this.state.codeLang}"` : '';
    this.html += `<div class="code-block-container"><button class="copy-btn">Copy</button><pre><code${langClass}>`;
    this.html += this.state.codeBuffer.map(l => this.escapeHTML(l)).join('\n');
    this.html += `</code></pre></div>\n`;

    this.state.inCodeBlock = false;
    this.state.codeBuffer = [];
    this.state.codeLang = '';
  }

  closeOneListLevel() {
    if (this.state.listStack.length === 0) return;
    const item = this.state.listStack.pop();
    this.html += `</${item.type}>\n`;
  }

  closeList() {
    while (this.state.listStack.length > 0) {
      this.closeOneListLevel();
    }
  }

  closeTable() {
    if (!this.state.inTable) return;

    this.html += '<table>\n';
    // Header
    if (this.state.tableHeader) {
      this.html += '<thead>\n<tr>\n';
      this.state.tableHeader.forEach(h => this.html += `<th>${this.escapeInline(h)}</th>\n`);
      this.html += '</tr>\n</thead>\n';
    }
    // Body
    if (this.state.tableRows.length > 0) {
      this.html += '<tbody>\n';
      this.state.tableRows.forEach(row => {
        this.html += '<tr>\n';
        row.forEach(cell => this.html += `<td>${this.escapeInline(cell)}</td>\n`);
        this.html += '</tr>\n';
      });
      this.html += '</tbody>\n';
    }
    this.html += '</table>\n';

    this.state.inTable = false;
    this.state.tableHeader = null;
    this.state.tableRows = [];
  }

  closeBlockquote() {
    if (!this.state.inBlockquote) return;

    this.html += '<blockquote>';
    this.html += this.renderBufferedParagraphs(this.state.blockquoteBuffer);
    this.html += '</blockquote>\n';

    this.state.inBlockquote = false;
    this.state.blockquoteBuffer = [];
  }

  closeAlert() {
    if (!this.state.inAlert) return;

    const titles = { 'note': 'Note', 'warning': 'Warning', 'important': 'Important', 'tip': 'Tip', 'caution': 'Caution' };
    const title = titles[this.state.alertType] || 'Alert';

    this.html += `<div class="alert alert-${this.state.alertType}">`;
    this.html += `<div class="alert-header"><span class="alert-title">${title}</span></div>`;
    this.html += `<div class="alert-content">`;
    this.html += this.renderBufferedParagraphs(this.state.alertBuffer);
    this.html += `</div></div>\n`;

    this.state.inAlert = false;
    this.state.alertBuffer = [];
    this.state.alertType = '';
  }

  closeAllBlocks() {
    this.flushCodeBlock();
    this.closeList();
    this.closeTable();
    this.closeAlert();
    this.closeBlockquote();
  }

  // --- Generators & Utilities ---

  renderBufferedParagraphs(lines) {
    let output = '';
    let pBuffer = [];

    const flushP = () => {
      if (pBuffer.length > 0) {
        const text = pBuffer.map(l => this.escapeInline(l)).join(' ');
        output += `<p>${text}</p>`;
        pBuffer = [];
      }
    };

    lines.forEach(l => {
      if (l === '') flushP();
      else pBuffer.push(l);
    });
    flushP();
    return output;
  }

  renderDocumentHeader(title, meta) {
    let h = `<header class="document-header">\n`;
    h += `<h1>${this.escapeInline(title)}</h1>\n`;
    if (meta.author) h += `<div class="author">${this.escapeHTML(meta.author)}</div>\n`;
    if (meta.date) h += `<div class="date">${this.escapeHTML(meta.date)}</div>\n`;
    if (meta.institution) h += `<div class="institution">${this.escapeHTML(meta.institution)}</div>\n`;
    if (meta.editor) h += `<div class="editor">Edited by ${this.escapeHTML(meta.editor)}</div>\n`;
    h += `</header>\n`;
    return h;
  }

  generateFooter() {
    return `
<footer class="markpaper-footer">
  <p>This HTML page was automatically generated from "${this.currentFileName}" by <a href="https://github.com/TetsuakiBaba/MarkPaper" target="_blank" rel="noopener noreferrer">MarkPaper</a>.</p>
</footer>`;
  }

  appendSectionFootnotes() {
    if (this.sectionFootnotes.length === 0) return;

    this.html += '<div class="footnotes">\n';
    this.sectionFootnotes.forEach(id => {
      if (this.footnotesDef[id]) {
        this.html += `<div class="footnote" id="footnote-${id}">`;
        this.html += `<sup>${id}</sup> ${this.escapeInline(this.footnotesDef[id])}`;
        this.html += `</div>\n`;
      }
    });
    this.html += '</div>\n';
    this.sectionFootnotes = [];
  }

  // --- Escaping & Sanitization ---

  escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitizes HTML tags based on whitelist.
   */
  sanitizeHTML(text) {
    return text.replace(/<(\/?)([\w-]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
      const tagLower = tag.toLowerCase();
      if (!CONFIG.ALLOWED_TAGS.includes(tagLower)) {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      if (slash === '/') return `</${tag}>`;

      // Attribute sanitization
      let safeAttrs = '';
      if (attrs.trim()) {
        const attrMatches = attrs.match(/\s+([^=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g);
        if (attrMatches) {
          attrMatches.forEach(attrMatch => {
            const parts = attrMatch.trim().match(/^([^=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?$/);
            if (parts) {
              const name = parts[1].toLowerCase();
              const val = parts[2] || parts[3] || parts[4] || '';

              if (CONFIG.ALLOWED_ATTRIBUTES.includes(name)) {
                // Filter dangerous protocols
                const isJs = /^(javascript:|vbscript:|data:|about:)/i.test(val);
                if ((name === 'href' || name === 'src') && isJs) return;

                safeAttrs += ` ${name}="${val.replace(/"/g, '&quot;')}"`;
              }
            }
          });
        }
      }
      return `<${tag}${safeAttrs}>`;
    });
  }

  /**
   * Parses inline Markdown (Bold, Italic, Link, Image, Footnote).
   */
  escapeInline(text) {
    // 1. Sanitize raw HTML first
    let escaped = this.sanitizeHTML(text);

    // 2. Protect valid HTML tags from further Markdown processing
    const protectionMap = new Map();
    let pCounter = 0;
    escaped = escaped.replace(/<(\/?)([\w-]+)([^>]*)>/g, (match, slash, tag) => {
      if (CONFIG.ALLOWED_TAGS.includes(tag.toLowerCase())) {
        const key = `__TAG_${pCounter++}__`;
        protectionMap.set(key, match);
        return key;
      }
      return match;
    });

    // 3. Escape remaining special chars (except those needed for MD)
    // Note: We don't want to break MD syntax chars like * or [
    // So strictly speaking, we only escape loose & < > that weren't tags
    escaped = escaped
      .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;') // Escape & not part of entity
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 4. Restore protected tags
    protectionMap.forEach((val, key) => { escaped = escaped.replace(key, val); });

    // 5. Markdown Processing

    // Bold: **text**
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Strike: ~~text~~
    escaped = escaped.replace(/~~(.+?)~~/g, '<s>$1</s>');
    // Inline Code: `text`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images (Inline): ![alt](src)
    // Note: Block images handled in main loop, but inline might occur
    escaped = escaped.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      return `<img src="${src}" alt="${this.escapeHTML(alt)}">`;
    });

    // Links: [text](url)
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Footnote Refs: [^1]
    escaped = escaped.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      if (!this.sectionFootnotes.includes(id)) {
        this.sectionFootnotes.push(id);
      }
      return `<sup><a href="#footnote-${id}" class="footnote-ref">${id}</a></sup>`;
    });

    // Auto-link URLs (http://...)
    // Avoids modifying URLs inside existing <a> or attributes
    const urlPattern = /(https?:\/\/[^\s<>"']+|ftp:\/\/[^\s<>"']+)/g;
    escaped = escaped.replace(urlPattern, (match) => {
      // Very simple heuristic: if preceded by =" or =' don't link
      // A robust parser uses tokenization, but regex replacement needs care
      // This matches the original simple logic
      return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });

    escaped = escaped.replace(/href="<a href="([^"]+)"[^>]*>[^<]+<\/a>"/g, 'href="$1"');

    return escaped;
  }
}

// ============================================================================
// 3. UI & DOM CONTROLLER
// ============================================================================

class MarkPaperUI {
  constructor() {
    this.dom = {};
  }

  init() {
    this.createDomElements();
    this.setupMenu();
    this.setupToc();
    this.setupScrollSpy();
    this.setupCopyButtons();
  }

  createDomElements() {
    // 1. Hamburger Button
    const btn = document.createElement('button');
    btn.className = 'hamburger-btn';
    btn.innerHTML = `<span></span><span></span><span></span>`;
    document.body.prepend(btn);
    this.dom.hamburger = btn;

    // 2. Sidebar
    const nav = document.createElement('nav');
    nav.className = 'side-menu';
    nav.innerHTML = `
      <div class="side-menu-header"><h3>Menu</h3></div>
      <ul id="table-of-contents" class="table-of-contents"></ul>
    `;
    document.body.insertBefore(nav, btn.nextSibling);
    this.dom.menu = nav;
    this.dom.toc = nav.querySelector('#table-of-contents');

    // 3. Overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    this.dom.overlay = overlay;
  }

  setupMenu() {
    const toggle = () => {
      this.dom.menu.classList.toggle('open');
      this.dom.overlay.classList.toggle('show');
      this.dom.hamburger.classList.toggle('active');
    };

    this.dom.hamburger.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    this.dom.overlay.addEventListener('click', toggle);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeMenu(); });
  }

  closeMenu() {
    this.dom.menu.classList.remove('open');
    this.dom.overlay.classList.remove('show');
    this.dom.hamburger.classList.remove('active');
  }

  setupToc() {
    const headings = document.querySelectorAll('h2');
    this.dom.toc.innerHTML = '';

    headings.forEach((h, i) => {
      if (!h.id) h.id = `section-${i}`;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      a.onclick = (e) => {
        e.preventDefault();
        this.closeMenu();
        h.scrollIntoView({ behavior: 'smooth' });
      };
      li.appendChild(a);
      this.dom.toc.appendChild(li);
    });
  }

  setupScrollSpy() {
    const headings = document.querySelectorAll('h2');
    const links = this.dom.toc.querySelectorAll('a');

    const onScroll = () => {
      let currentId = '';
      const offset = 120; // px

      headings.forEach(h => {
        if (window.scrollY + offset >= h.offsetTop) currentId = h.id;
      });

      links.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`);
      });
    };

    window.addEventListener('scroll', onScroll);
    onScroll(); // Init
  }

  setupCopyButtons() {
    document.querySelectorAll('.code-block-container').forEach(container => {
      const btn = container.querySelector('.copy-btn');
      const code = container.querySelector('code');
      if (!btn || !code) return;

      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(code.innerText).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }
}

// ============================================================================
// 4. APPLICATION ENTRY
// ============================================================================

(function () {
  const parser = new MarkPaperParser();
  const ui = new MarkPaperUI();

  const loadFile = (path) => {
    const target = document.getElementById('content');
    target.innerHTML = '<div class="loading">Loading...</div>';

    fetch(path)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then(markdown => {
        const html = parser.parse(markdown, path.split('/').pop());
        target.innerHTML = html;
        ui.init();
      })
      .catch(err => {
        const msg = `
> [!CAUTION]
> Failed to load file: "${path}".
> 
> **Error:** ${err.message}
        `;
        target.innerHTML = parser.parse(msg);
      });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file') || 'index.md';
    loadFile(file);

    // Stub for window resize adjustment if needed
    window.addEventListener('resize', () => { });
  });
})();