# MarkPaper

author: Tetsuaki Baba / Rubens Braz
date: 2025-07-19. Atualization in 2025-12-12
institution: Tokyo Metropolitan University

To create beautiful documents, all you need is to write Markdown text. MarkPaper is a tool that generates beautiful HTML documents suitable for academic papers and technical documents using a custom Markdown parser. It provides rich features including a hamburger menu with table of contents, footnote system, GitHub-style alerts, code blocks, and more.

## Demo

You can see the demo of MarkPaper at [MarkPaper Demo](https://tetsuakibaba.github.io/MarkPaper/?file=README.md). This is a demo that opens the currently viewed README.md file in MarkPaper.

## Getting Started

### Include the CSS and JavaScript files in your HTML:

```html
<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>MarkPaper</title>
    <meta name="description" content="MarkPaper - Markdown to Clean Paper">
    <!-- Favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">
    <link rel="manifest" href="assets/site.webmanifest">
    <!-- MarkPaper -->
    <link rel="stylesheet" href="css/markpaper.css">
    <script src="js/markpaper.js"></script>
    <!-- Prism (Code highlighting) -->
    <link id="prism-theme-link" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.9.0/prism-ghcolors.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <!-- KaTeX (LaTeX parser) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  </head>

  <body>
    <main>
      <article id="content">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading document...</p>
        </div>
      </article>
    </main>
  </body>
  <noscript>
    <div class="alert alert-warning">
      <strong>Warning:</strong> JavaScript is required to run MarkPaper. Please enable it in your browser settings.
    </div>
  </noscript>

</html>
```

### Load your Markdown content

Open the index.html file with a file parameter such as `file=your_markdown_file` to load the Markdown content. For example, you can use `file=index.md` in the URL to load the `index.md` file.
> ex. `https://yourdomain.com/path/to/index.html?file=index.md`

### CDNs

CDN link to include the script in your HTML:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/TetsuakiBaba/MarkPaper/markpaper.css">
```

```html
<script src="https://cdn.jsdelivr.net/gh/TetsuakiBaba/MarkPaper/markpaper.js" crossorigin="anonymous" type="text/javascript"></script>
```

## Features

- **Responsive Design**: Supports mobile to desktop devices
- **Hamburger Menu**: Access table of contents from the circular menu in the top right
- **Auto Table of Contents Generation**: Automatically generates TOC from h2 headings
- **Extended Markdown Syntax**: Rich syntax support including footnotes, alerts, code blocks
- **HTML Tag Support**: Safe HTML tags with whitelist-based security filtering
- **Beautiful Typography**: Font settings optimized for Japanese text

## Supported Markdown Syntax

### Basic Syntax

#### Headings

```markdown
# h1 heading
## h2 heading (numbered, displayed in TOC)
### h3 heading (numbered)
#### h4 heading
##### h5 heading
```

#### Document Metadata

```markdown
# Document Title
author: John Doe
date: 2024-01-15
institution: University of Example
email: john@example.com
```

**Features:**

- Displays author information in a beautiful header format
- Supports multiple metadata fields (author, date, institution, email, editor)
- Automatically formatted with professional typography
- Responsive design for mobile devices

**Supported Fields:**

- `author`: Author name
- `date`: Publication or creation date
- `institution`: Affiliation or organization
- `email`: Contact email address
- `editor`: Editor name (displayed as "Edited by...")

#### Text Decoration

```markdown
**Bold text**
*Italic text*
```

#### Lists

```markdown
* Unordered list item 1
* Unordered list item 2

- Ordered list item 1
  - Ordered item 1-1
  - Ordered item 1-2
    - Deep nested item
- Ordered list item 2
  - Ordered item 2-1
  - Ordered item 2-2
```

* Unordered list item 1
  * Unordered list item 1-2
    * Unordered list item 1-2-3
* Unordered list item 2

- Ordered list item 1
  - Ordered item 1-1
  - Ordered item 1-2
    - Deep nested item
- Ordered list item 2
  - Ordered item 2-1
  - Ordered item 2-2

## Syntax Highlighting

Code blocks are automatically highlighted using **Prism.js**.

### JavaScript

```javascript
// A simple recursive function
function calculateFactorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * calculateFactorial(n - 1);
}

console.log(calculateFactorial(5)); // Output: 120
```

### Python

```python
class NeuralNetwork:
    def __init__(self, inputs, hidden, outputs):
        self.inputs = inputs
        self.hidden = hidden
        self.outputs = outputs

    def train(self):
        print("Training model...")
```

### CSS

```css
/* Custom styles for the container */
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
}
```


### Text Styles

You can use **bold text** for emphasis, *italic text* for nuance, and ~~strikethrough~~ for deletions. You can also mark text like <mark>this highlighted section</mark> using safe HTML tags.

### Links & References

- **Standard Link:** [Visit the Project Repository](https://github.com/TetsuakiBaba/MarkPaper)
- **Auto-link:** [https://www.w3.org/](https://www.w3.org/)
- **Footnote Reference:** This statement requires a citation[^1] to be valid.

## Mathematical Notation (LaTeX)

MarkPaper uses **KaTeX** to render high-quality mathematics.

### Inline Math

Mathematical concepts can be embedded directly in the text.
For example, the mass-energy equivalence is denoted as $E = mc^2$, and Euler's identity is $e^{i\pi} + 1 = 0$.

### Block Math

Complex equations are rendered in display mode, centered and scrollable if necessary.

**The Gaussian Integral:**
$$
\int_{-\infty}^\infty e^{-x^2} dx = \sqrt{\pi}
$$

**Quadratic Formula:**
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

**Matrix Example:**
$$
M = \begin{pmatrix}
1 & 0 & 0 \\
0 & \cos \theta & -\sin \theta \\
0 & \sin \theta & \cos \theta
\end{pmatrix}
$$



### Extended Syntax

#### Footnotes

```markdown
This is text with a footnote[^1].

[^1]: This is the footnote content.
```

This is text with a footnote[^1].

[^1]: Footnotes are automatically placed at the end of the corresponding heading section.

**Features:**

- Footnotes are automatically placed at the end of the corresponding heading section
- Properly managed between sections
- Displayed as clickable links

#### Text Links

```markdown
[Link text](https://example.com)
```

[Link text](https://example.com)

**Features:**

- Opens in new tab with `target="_blank"`
- Security support with `rel="noopener noreferrer"`

#### Auto URL Linking

```markdown
https://example.com
```

https://example.com

**Features:**

- Supports HTTPS, HTTP, and FTP protocols
- No duplicate processing for URLs within existing links

#### Image Display

```markdown
![Caption text](image.jpg)
![](image.jpg){width="50%"}
```

**Features:**

- Automatic figure numbering when caption is specified (Figure 1, Figure 2...)
- Width specification with `{width=...}` (e.g., `50%`, `300px`)
- Responsive design (auto-resize according to screen width)
- Center-aligned display with rounded corners and borders

**Example:**

```markdown
![Sample image caption](https://tetsuakibaba.jp/assets/images/research/2021rc.png)
![](https://tetsuakibaba.jp/assets/images/research/2021rc.png){width="50%"}
```

**Result: Below is an example of actually displayed image.**
![Sample image caption](https://tetsuakibaba.jp/assets/images/research/2021rc.png)

![](https://tetsuakibaba.jp/assets/images/research/2021rc.png){width="50%"}

#### Tables

Tables are styled for academic data presentation with hover effects.

```markdown
| Metric | Experiment A | Experiment B | Change |
| :--- | :---: | :---: | ---: |
| Accuracy | 92.5% | 94.8% | +2.3% |
| Loss | 0.35 | 0.21 | -0.14 |
| Epochs | 50 | 75 | +25 |
| Status | **Stable** | *Testing* | N/A |
```

| Metric | Experiment A | Experiment B | Change |
| :--- | :---: | :---: | ---: |
| Accuracy | 92.5% | 94.8% | +2.3% |
| Loss | 0.35 | 0.21 | -0.14 |
| Epochs | 50 | 75 | +25 |
| Status | **Stable** | *Testing* | N/A |

**Features:**

- Supports basic table syntax with `|` and `-`
- Automatically detects table headers and aligns them
- Supports multi-line cells
- Supports empty cells

#### GitHub-style Alerts

GitHub-style alerts are supported for emphasizing specific content.

```markdown
> [!NOTE]
> This is a general note to the reader. Useful for non-critical information.

> [!TIP]
> **Pro Tip:** You can use the circular hamburger menu in the top right to navigate via the Table of Contents.

> [!IMPORTANT]
> The rendering engine sanitizes HTML tags to prevent XSS attacks while allowing safe formatting.

> [!WARNING]
> Please ensure your Markdown file is encoded in UTF-8 to avoid character display issues.

> [!CAUTION]
> Deleting the `markpaper.js` file will stop the rendering engine completely.
```

> [!NOTE]
> This is a general note to the reader. Useful for non-critical information.

> [!TIP]
> **Pro Tip:** You can use the circular hamburger menu in the top right to navigate via the Table of Contents.

> [!IMPORTANT]
> The rendering engine sanitizes HTML tags to prevent XSS attacks while allowing safe formatting.

> [!WARNING]
> Please ensure your Markdown file is encoded in UTF-8 to avoid character display issues.

> [!CAUTION]
> Deleting the `markpaper.js` file will stop the rendering engine completely.

**Features:**

- 5 types of alerts (NOTE, WARNING, IMPORTANT, TIP, CAUTION)
- Color coding and icons according to each type
- Multi-line content support

#### Task Lists

- [x] Implement Syntax Highlighting
- [x] Implement LaTeX Support
- [x] Implement Video Embeds
- [ ] Write Documentation
- [ ] Release Version 1.0


#### Code Blocks

##### Inline Code

```markdown
This is an example of `inline code`.
```

Result: This is an example of `inline code`.

##### Fenced Code Blocks

````javascript
```
function hello() {
  console.log("Hello World!");
}
```
````

Result:

```javascript
function hello() {
  console.log("Hello World!");
}
```

**Features:**

- Horizontal scroll support
- Monospace font usage
- GitHub-like styling

#### Regular Blockquotes

```markdown
> "Code is like humor. When you have to explain it, it’s bad."
> — *Cory House*
```

> "Code is like humor. When you have to explain it, it’s bad."
> — *Cory House*


### Video Embeds

You can embed videos simply by pasting the URL on its own line. MarkPaper creates a responsive player automatically.

**YouTube Example:**
https://www.youtube.com/watch?v=Xd2xr7zIFyk

**Vimeo Example:**
https://vimeo.com/858066420

## Advanced HTML Elements

MarkPaper supports specific HTML tags for creating interactive documentation.

### Collapsible Content (Details)

Use this to hide complex code or secondary information.

<details>
<summary><strong>Click to view detailed specifications</strong></summary>

Here is the hidden content. It can contain text, lists, or even code.

- Feature A: Enabled
- Feature B: Disabled
- Version: 2.1.0

</details>

### Definition Lists (Glossary)

<dl>
  <dt><strong>MarkPaper</strong></dt>
  <dd>A lightweight, client-side Markdown rendering engine.</dd>
  <dt><strong>Markdown</strong></dt>
  <dd>A markup language for creating formatted text using a plain-text editor.</dd>
</dl>



#### Raw HTML Tags

MarkPaper supports safe HTML tags within Markdown content. Only whitelisted tags and attributes are allowed for security.

```markdown
<strong>HTML strong tag</strong> and <em>HTML em tag</em>

<span style="color: red;">Red text</span>

<div class="custom-class">
Custom div with class
</div>

<small>Small text</small> and <sup>superscript</sup> and <sub>subscript</sub>
```

**Result:**

<strong>HTML strong tag</strong> and <em>HTML em tag</em>

<span style="color: red;">Red text</span>

<div class="custom-class">
Custom div with class
</div>

<small>Small text</small> and <sup>superscript</sup> and <sub>subscript</sub>

**Allowed HTML Tags:**

- Text formatting: `strong`, `b`, `em`, `i`, `u`, `s`, `del`, `ins`, `mark`, `small`, `sub`, `sup`
- Structure: `div`, `span`, `p`, `br`, `hr`, `blockquote`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Lists: `ul`, `ol`, `li`, `dl`, `dt`, `dd`
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Links and media: `a`, `img`
- Code: `code`, `pre`
- Other: `abbr`, `cite`, `q`, `time`

**Allowed Attributes:**

- General: `class`, `id`, `style`, `title`, `lang`, `dir`
- Links: `href`, `target`, `rel`
- Images: `src`, `alt`, `width`, `height`
- Tables: `colspan`, `rowspan`
- Time: `datetime`
- Quotes: `cite`

**Security Features:**

- Dangerous tags like `<script>` are automatically escaped
- Event handlers (`onclick`, `onload`, etc.) are removed
- `javascript:` URLs are filtered out
- Only safe protocols (`http`, `https`, relative paths) are allowed

**Example of filtered content:**

```markdown
<!-- These will be escaped/filtered for safety -->
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
<a href="javascript:alert('XSS')">Dangerous link</a>
```

## Customization

### CSS Variables

You can customize colors and fonts in the `:root` section of `markpaper.css`.

### Font Settings

By default, it uses a serif font stack optimized for Japanese text, but it can be changed in the `body` CSS settings.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```plaintext
markpaper/
├── assets/             # Icons, favicons, and images
├── content/            # Markdown files (e.g., showcase.md)
├── css/                # Stylesheets
│   └── markpaper.css
├── js/                 # Logic
│   └── markpaper.js
├── index.html          # Entry point
└── README.md           # This file
```

## License

MIT License

## Author

[Tetsuaki Baba](https://github.com/TetsuakiBaba)

## Development Notes

This project aims to implement a simple and lightweight Markdown parser with elegant webpage display. It consists only of vanilla JavaScript and CSS.

### Parser Features

- Memory-efficient streaming processing
- Section-based footnote management
- Robust error handling
- Extensible architecture

### Future Improvements

- [x] ~~Syntax highlighting feature~~ (Completed)
- [x] ~~Table syntax support~~ (Completed)
- [x] ~~Document metadata support~~ (Completed)
- [x] ~~Safe HTML tag support~~ (Completed)
- [x] ~~Mathematical notation support~~ (Completed)
- [x] ~~Dark mode support~~ (Completed)
- [ ] Print style optimization
