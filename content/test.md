# MarkPaper Feature Showcase

author: Rubens Braz
date: 2025-10-25
institution: MarkPaper Development Team
editor: Open Source Community

This document serves as a comprehensive test suite for the **MarkPaper** rendering engine. It demonstrates typography, layout components, advanced syntax highlighting, and mathematical notation support.

## Typography & Formatting

MarkPaper provides a clean, academic aesthetic tailored for readability.

### Text Styles

You can use **bold text** for emphasis, *italic text* for nuance, and ~~strikethrough~~ for deletions. You can also mark text like <mark>this highlighted section</mark> using safe HTML tags.

### Links & References

- **Standard Link:** [Visit the Project Repository](https://github.com/TetsuakiBaba/MarkPaper)
- **Auto-link:** https://www.w3.org/
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

## Lists & Task Management

### Nested Lists

1. First main item
   - Sub-item A
   - Sub-item B
     - Deeply nested item
2. Second main item
   1. Step 2.1
   2. Step 2.2

### Task Lists

- [x] Implement Syntax Highlighting
- [x] Implement LaTeX Support
- [ ] Write Documentation
- [ ] Release Version 1.0

## Tables

Tables are styled for academic data presentation with hover effects.

| Metric | Experiment A | Experiment B | Change |
| :--- | :---: | :---: | ---: |
| Accuracy | 92.5% | 94.8% | +2.3% |
| Loss | 0.35 | 0.21 | -0.14 |
| Epochs | 50 | 75 | +25 |
| Status | **Stable** | *Testing* | N/A |

## Images & Media

Images support captions (which auto-increment Figure numbers) and custom width attributes.

![A placeholder image representing abstract technology](https://picsum.photos/id/48/800/400)

Below is a smaller image resized to 50% width using the parser's attribute syntax:

![Resized landscape image](https://picsum.photos/id/28/800/400){width="50%"}

## Alerts & Callouts

GitHub-style alerts are supported for emphasizing specific content.

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

## Blockquotes

Standard blockquotes are also supported for citations or emphasis.

> "Code is like humor. When you have to explain it, it’s bad."
> — *Cory House*

[^1]: This is the content of the footnote referenced in Section 1. It appears at the end of the section automatically.
