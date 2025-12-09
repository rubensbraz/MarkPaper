# MarkPaper Showcase & Documentation

author: Tetsuaki Baba / Rubens Braz
date: 2025-12-10
institution: MarkPaper Project

**MarkPaper** is a lightweight, client-side tool that transforms standard Markdown into beautiful, academic-style HTML documents. It features a robust parser built with vanilla JavaScript that supports extended syntax, including LaTeX math, syntax highlighting, dynamic diagrams, and responsive embeds.

This document serves as both a **User Guide** and a **Live Demo**. Every section below shows the Markdown syntax followed by the rendered result.

---

## 1. Getting Started

### Installation

To use MarkPaper, include the CSS and JS files in your HTML document. You also need to include **PrismJS** (for code highlighting) and **KaTeX** (for mathematics).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarkPaper Document</title>
    
    <link rel="stylesheet" href="css/markpaper.css">
    <script src="js/markpaper.js"></script>

    <link rel="stylesheet" href="[https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.9.0/prism-ghcolors.min.css](https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.9.0/prism-ghcolors.min.css)">
    <script src="[https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js](https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js)"></script>
    <script src="[https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js](https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js)"></script>
    <link rel="stylesheet" href="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css)">
    <script src="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js)"></script>
</head>
<body>
    <main>
        <article id="content">Loading...</article>
    </main>
</body>
</html>
```

### Loading Content

MarkPaper reads the `?file=` URL parameter to determine which Markdown file to render.

* **Default:** `index.html` (loads `readme.md` or default content)
* **Specific File:** `index.html?file=my-paper.md`

---

## 2. Document Structure & Metadata

At the very top of your Markdown file, you can define metadata. This will automatically generate a professional header.

### Syntax

```markdown
# My Research Paper Title
author: John Doe
date: 2025-12-10
institution: University of Technology
editor: Jane Smith
```

### Result

*(See the top of this document for the rendered header example)*

---

## 3. Typography & Formatting

MarkPaper supports standard Markdown formatting and some extended HTML styling.

### Headings

```markdown
# Heading Level 1
## Heading Level 2 (Auto-numbered in TOC)
### Heading Level 3 (Indented in TOC)
#### Heading Level 4
```

### Text Styles

```markdown
You can use **bold text** for emphasis, *italic text* for nuance, and ~~strikethrough~~ for deletions.
You can also use <mark>highlighted text</mark>, <u>underlined text</u>, <sub>subscript</sub>, and <sup>superscript</sup>.
```

**Result:**

You can use **bold text** for emphasis, *italic text* for nuance, and ~~strikethrough~~ for deletions.
You can also use <mark>highlighted text</mark>, <u>underlined text</u>, <sub>subscript</sub>, and <sup>superscript</sup>.

---

## 4. Lists

### Standard Lists

```markdown
* **Unordered List Item 1**
* Unordered List Item 2
    * Nested Item A
    * Nested Item B

1.  **Ordered List Item 1**
2.  Ordered List Item 2
    1.  Nested Ordered Item 2.1
    2.  Nested Ordered Item 2.2
```

**Result:**

* **Unordered List Item 1**
* Unordered List Item 2
    * Nested Item A
    * Nested Item B

1.  **Ordered List Item 1**
2.  Ordered List Item 2
    1.  Nested Ordered Item 2.1
    2.  Nested Ordered Item 2.2

### Task Lists (Checkboxes)

```markdown
- [x] Analyze requirements
- [x] Design architecture
- [ ] Write documentation
```

**Result:**

- [x] Analyze requirements
- [x] Design architecture
- [ ] Write documentation

---

## 5. Media (Images & Video)

### Images

Standard markdown syntax is supported. You can also specify the width using curly braces syntax `{width=...}`. Captions are automatically generated from the alt text.

```markdown
![A beautiful landscape](https://tetsuakibaba.jp/assets/images/research/2021rc.png)

![Small centered image](https://tetsuakibaba.jp/assets/images/research/2021rc.png){width="50%"}
```

**Result:**

![A beautiful landscape](https://tetsuakibaba.jp/assets/images/research/2021rc.png)

![Small centered image](https://tetsuakibaba.jp/assets/images/research/2021rc.png){width="50%"}

### Video Embeds

MarkPaper automatically detects YouTube and Vimeo links when placed on their own line and converts them into responsive iframes.

```markdown
[https://www.youtube.com/watch?v=Xd2xr7zIFyk](https://www.youtube.com/watch?v=Xd2xr7zIFyk)

[https://vimeo.com/858066420](https://vimeo.com/858066420)
```

**Result:**

https://www.youtube.com/watch?v=Xd2xr7zIFyk

https://vimeo.com/858066420

---

## 6. Code Highlighting

MarkPaper uses **Prism.js** for syntax highlighting. It supports copy-to-clipboard functionality and horizontal scrolling.

### Inline Code

```markdown
Use `console.log()` to debug.
```

**Result:** Use `console.log()` to debug.

### Code Blocks

````markdown
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
console.log(greet("MarkPaper"));
```
````

**Result:**

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
console.log(greet("MarkPaper"));
```

````markdown
```python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
```
````

**Result:**

```python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
```

---

## 7. Mathematical Notation (LaTeX)

Powered by **KaTeX**, you can write high-quality mathematical equations directly in Markdown.

### Inline Math

```markdown
The mass-energy equivalence is described by $E = mc^2$.
```

**Result:** The mass-energy equivalence is described by $E = mc^2$.

### Block Math

Use double dollar signs `$$` for display mode equations.

```markdown
$$
\int_{-\infty}^\infty e^{-x^2} dx = \sqrt{\pi}
$$

$$
M = \begin{pmatrix}
1 & 0 & 0 \\
0 & \cos \theta & -\sin \theta \\
0 & \sin \theta & \cos \theta
\end{pmatrix}
$$
```

**Result:**

$$
\int_{-\infty}^\infty e^{-x^2} dx = \sqrt{\pi}
$$

$$
M = \begin{pmatrix}
1 & 0 & 0 \\
0 & \cos \theta & -\sin \theta \\
0 & \sin \theta & \cos \theta
\end{pmatrix}
$$

---

## 8. Tables

Tables are styled for readability with sticky headers and hover effects.

```markdown
| ID | Model Name | Accuracy | Status |
| :--- | :--- | :---: | ---: |
| 001 | AlphaNet | 94.5% | **Production** |
| 002 | BetaGrid | 88.2% | *Deprecated* |
| 003 | GammaRay | 99.1% | Testing |
```

**Result:**

| ID | Model Name | Accuracy | Status |
| :--- | :--- | :---: | ---: |
| 001 | AlphaNet | 94.5% | **Production** |
| 002 | BetaGrid | 88.2% | *Deprecated* |
| 003 | GammaRay | 99.1% | Testing |

---

## 9. GitHub-Style Alerts

Use blockquotes with specific tags to create colorful alert boxes.

```markdown
> [!NOTE]
> This is a general note. Useful for non-critical information.

> [!TIP]
> **Pro Tip:** Check the hamburger menu in the top right for the Table of Contents.

> [!IMPORTANT]
> This information is crucial for the user to understand.

> [!WARNING]
> Proceed with caution. This action might have side effects.

> [!CAUTION]
> Critical failure possible. Ensure backups are ready.
```

**Result:**

> [!NOTE]
> This is a general note. Useful for non-critical information.

> [!TIP]
> **Pro Tip:** Check the hamburger menu in the top right for the Table of Contents.

> [!IMPORTANT]
> This information is crucial for the user to understand.

> [!WARNING]
> Proceed with caution. This action might have side effects.

> [!CAUTION]
> Critical failure possible. Ensure backups are ready.

---

## 10. Advanced Elements

### Footnotes

Footnotes are automatically collected and displayed at the bottom of the section or page.

```markdown
Here is a statement that requires a citation[^1].

[^1]: This is the text of the footnote.
```

**Result:**

Here is a statement that requires a citation[^1].

[^1]: This is the text of the footnote.

### Collapsible Details

MarkPaper supports the HTML `<details>` and `<summary>` tags for hiding complex information.

```html
<details>
<summary><strong>Click to expand technical specs</strong></summary>

* Engine: V8
* Horsepower: 450 hp
* Torque: 500 Nm

</details>
```

**Result:**

<details>
<summary><strong>Click to expand technical specs</strong></summary>

* Engine: V8
* Horsepower: 450 hp
* Torque: 500 Nm

</details>

### Raw HTML (Whitelisted)

You can use safe HTML tags for specific layout needs.

```html
<div style="background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
    This is a custom <strong>div</strong> element.
</div>
```

**Result:**

<div style="background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
    This is a custom <strong>div</strong> element.
</div>

---

## 11. Customization

You can adjust the theme settings via the **Settings Button** (gear icon) in the top right corner, or by modifying the CSS variables in `css/markpaper.css`.

**Key CSS Variables:**

* `--text-color`
* `--background-color`
* `--accent-color`
* `--font-serif` / `--font-sans-serif`

---

## License

MIT License.