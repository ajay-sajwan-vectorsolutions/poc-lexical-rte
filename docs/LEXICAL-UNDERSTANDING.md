# Lexical Editor - Technical Understanding Document

This document captures the technical findings and implementation details for using the Lexical rich text editor framework in this project.

## Table of Contents

1. [Overview](#overview)
2. [HTML Serialization](#html-serialization)
3. [Node System](#node-system)
4. [Built-in vs Custom Nodes](#built-in-vs-custom-nodes)
5. [Package Dependencies](#package-dependencies)
6. [Implementation Examples](#implementation-examples)
7. [Limitations and Considerations](#limitations-and-considerations)

---

## Overview

Lexical is an extensible text editor framework developed by Meta (Facebook). It uses a plugin-based architecture where features are added through nodes and plugins.

**Key Characteristics:**
- Framework-agnostic core with React bindings (`@lexical/react`)
- Immutable editor state with command-based updates
- Extensible node system for custom content types
- Built-in support for common rich text features via packages

**Architecture Pattern:**
```
LexicalComposer (Provider)
├── Plugins (features)
├── Nodes (content types)
└── ContentEditable (render target)
```

---

## HTML Serialization

Lexical supports bidirectional HTML conversion, making it suitable for API-based content storage.

### Package Required

```bash
npm install @lexical/html
```

### Export: Editor Content → HTML

Use `$generateHtmlFromNodes` to convert editor content to an HTML string.

```javascript
import { $generateHtmlFromNodes } from '@lexical/html'

// Inside a component with editor context
editor.getEditorState().read(() => {
  const html = $generateHtmlFromNodes(editor, null)
  // Send 'html' to your API for storage
  console.log(html)
})
```

**Output Example:**
```html
<h1>Title</h1>
<p>This is <strong>bold</strong> and <em>italic</em> text.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Import: HTML → Editor Content

Use `$generateNodesFromDOM` to parse HTML and load it into the editor.

```javascript
import { $generateNodesFromDOM } from '@lexical/html'
import { $getRoot, $insertNodes } from 'lexical'

// Inside a component with editor context
editor.update(() => {
  // Parse HTML string to DOM
  const parser = new DOMParser()
  const dom = parser.parseFromString(htmlFromApi, 'text/html')

  // Generate Lexical nodes from DOM
  const nodes = $generateNodesFromDOM(editor, dom)

  // Clear existing content and insert new nodes
  const root = $getRoot()
  root.clear()
  root.select()
  $insertNodes(nodes)
})
```

### Important Notes

1. **Read vs Update Context**: Use `editor.getEditorState().read()` for reading (export) and `editor.update()` for writing (import)
2. **Node Registration**: Only HTML elements with registered nodes will be properly converted
3. **Unsupported Elements**: HTML elements without corresponding nodes are either ignored or converted to plain text

### UI Test Controls

The editor includes built-in test controls for HTML operations:

| Control | Description |
|---------|-------------|
| **Export to HTML** | Converts editor content to HTML and displays it |
| **Import Sample HTML** | Loads predefined sample HTML with various elements |
| **HTML Input Textarea** | Text area for entering custom HTML code |
| **Render HTML** | Parses and renders the custom HTML into the editor |

**Custom HTML Rendering Example:**

```javascript
const handleRenderHtml = () => {
  const htmlInput = '<h1>Custom Title</h1><p>Your <strong>HTML</strong> here</p>'

  editor.update(() => {
    const parser = new DOMParser()
    const dom = parser.parseFromString(htmlInput, 'text/html')
    const nodes = $generateNodesFromDOM(editor, dom)

    const root = $getRoot()
    root.clear()
    root.select()
    $insertNodes(nodes)
  })
}
```

---

## Node System

Lexical uses a hierarchical node system to represent content.

### Node Types

| Base Node | Purpose | Example Uses |
|-----------|---------|--------------|
| `TextNode` | Leaf nodes containing text | Plain text, formatted text |
| `ElementNode` | Container nodes with children | Paragraphs, headings, lists |
| `DecoratorNode` | Nodes rendering arbitrary React/DOM | Images, videos, embeds |
| `LineBreakNode` | Represents line breaks | `<br>` equivalent |

### Node Registration

Nodes must be registered in the editor configuration:

```javascript
const initialConfig = {
  namespace: 'MyEditor',
  theme: { /* CSS class mappings */ },
  onError: console.error,
  nodes: [
    HeadingNode,      // from @lexical/rich-text
    ListNode,         // from @lexical/list
    ListItemNode,     // from @lexical/list
    LinkNode,         // from @lexical/link
    // Add more nodes as needed
  ],
}
```

---

## Built-in vs Custom Nodes

### Fully Supported (Core + Standard Packages)

These HTML elements work out of the box with the appropriate packages:

| HTML Element | Lexical Node | Package | Notes |
|-------------|--------------|---------|-------|
| `<p>` | `ParagraphNode` | `lexical` (core) | Default block element |
| `<span>` | `TextNode` | `lexical` (core) | With formatting |
| `<strong>`, `<b>` | `TextNode` | `lexical` (core) | Bold format flag |
| `<em>`, `<i>` | `TextNode` | `lexical` (core) | Italic format flag |
| `<u>` | `TextNode` | `lexical` (core) | Underline format flag |
| `<s>`, `<del>`, `<strike>` | `TextNode` | `lexical` (core) | Strikethrough format flag |
| `<h1>` - `<h6>` | `HeadingNode` | `@lexical/rich-text` | Heading levels |
| `<ul>` | `ListNode` | `@lexical/list` | Unordered list |
| `<ol>` | `ListNode` | `@lexical/list` | Ordered list |
| `<li>` | `ListItemNode` | `@lexical/list` | List item |
| `<a>` | `LinkNode` | `@lexical/link` | Hyperlinks |
| `<blockquote>` | `QuoteNode` | `@lexical/rich-text` | Block quotes |

### Available via Additional Packages

These require installing and registering additional packages:

| HTML Element | Lexical Node | Package | Installation |
|-------------|--------------|---------|--------------|
| `<table>` | `TableNode` | `@lexical/table` | `npm install @lexical/table` |
| `<tr>` | `TableRowNode` | `@lexical/table` | Included with above |
| `<td>`, `<th>` | `TableCellNode` | `@lexical/table` | Included with above |
| `<code>` (inline) | `CodeNode` | `@lexical/code` | `npm install @lexical/code` |
| `<pre>` (code block) | `CodeNode` | `@lexical/code` | With CodeHighlightNode |

### Requires Custom Node Implementation

These HTML elements have **NO built-in support** and require creating custom nodes:

| HTML Element | Custom Node Needed | Node Type to Extend |
|-------------|-------------------|---------------------|
| `<img>` | `ImageNode` | `DecoratorNode` |
| `<video>` | `VideoNode` | `DecoratorNode` |
| `<audio>` | `AudioNode` | `DecoratorNode` |
| `<iframe>` | `IframeNode` / `EmbedNode` | `DecoratorNode` |
| `<hr>` | `HorizontalRuleNode` | `DecoratorNode` |
| `<sub>` | Custom or TextNode extension | `TextNode` |
| `<sup>` | Custom or TextNode extension | `TextNode` |
| `<mark>` | `HighlightNode` | `TextNode` |
| `<details>`, `<summary>` | `CollapsibleNode` | `ElementNode` |
| `<figure>`, `<figcaption>` | `FigureNode` | `ElementNode` |

---

## Package Dependencies

### Current Project Setup

```json
{
  "dependencies": {
    "lexical": "^0.39.0",
    "@lexical/react": "^0.39.0",
    "@lexical/rich-text": "^0.39.0",
    "@lexical/list": "^0.39.0",
    "@lexical/link": "^0.39.0",
    "@lexical/selection": "^0.39.0",
    "@lexical/html": "^0.39.0"
  }
}
```

### Available Lexical Packages

| Package | Purpose |
|---------|---------|
| `lexical` | Core editor functionality |
| `@lexical/react` | React bindings and plugins |
| `@lexical/rich-text` | HeadingNode, QuoteNode |
| `@lexical/list` | ListNode, ListItemNode |
| `@lexical/link` | LinkNode, AutoLinkNode |
| `@lexical/html` | HTML import/export |
| `@lexical/table` | Table support |
| `@lexical/code` | Code blocks with syntax highlighting |
| `@lexical/markdown` | Markdown import/export |
| `@lexical/selection` | Selection utilities |
| `@lexical/utils` | Helper utilities |
| `@lexical/clipboard` | Copy/paste handling |
| `@lexical/history` | Undo/redo functionality |
| `@lexical/overflow` | Overflow detection |

---

## Implementation Examples

### Basic Editor Setup

```javascript
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'

const initialConfig = {
  namespace: 'MyEditor',
  theme: {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
    },
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
    },
  },
  onError: console.error,
  nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
}

function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Enter text...</div>}
      />
      <HistoryPlugin />
    </LexicalComposer>
  )
}
```

### Custom DecoratorNode (ImageNode - Implemented)

This project includes a custom `ImageNode` implementation at `src/nodes/ImageNode.jsx`:

```javascript
import { DecoratorNode } from 'lexical'

export class ImageNode extends DecoratorNode {
  __src
  __altText
  __width
  __height

  static getType() {
    return 'image'
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    )
  }

  constructor(src, altText, width, height, key) {
    super(key)
    this.__src = src
    this.__altText = altText || ''
    this.__width = width || 'auto'
    this.__height = height || 'auto'
  }

  // DOM creation for the editor
  createDOM(config) {
    const div = document.createElement('div')
    div.className = config.theme.image || 'editor-image-container'
    return div
  }

  updateDOM() {
    return false
  }

  // For HTML export - converts node back to <img> tag
  exportDOM() {
    const img = document.createElement('img')
    img.setAttribute('src', this.__src)
    img.setAttribute('alt', this.__altText)
    if (this.__width && this.__width !== 'auto') {
      img.setAttribute('width', this.__width)
    }
    if (this.__height && this.__height !== 'auto') {
      img.setAttribute('height', this.__height)
    }
    return { element: img }
  }

  // For HTML import - tells Lexical how to convert <img> tags
  static importDOM() {
    return {
      img: (node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    }
  }

  // JSON export for editor state serialization
  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    }
  }

  // JSON import for editor state deserialization
  static importJSON(json) {
    return new ImageNode(json.src, json.altText, json.width, json.height)
  }

  // React component to render the image in the editor
  decorate() {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
      />
    )
  }
}

// React component for rendering
function ImageComponent({ src, altText, width, height }) {
  return (
    <img
      src={src}
      alt={altText}
      style={{
        width: width === 'auto' ? 'auto' : `${width}px`,
        height: height === 'auto' ? 'auto' : `${height}px`,
        maxWidth: '100%',
        display: 'block',
        margin: '8px 0',
      }}
      className="editor-image"
      draggable="false"
    />
  )
}

// Conversion function for HTML import
function convertImageElement(domNode) {
  const img = domNode
  const src = img.getAttribute('src')
  if (!src) return null

  const altText = img.getAttribute('alt') || ''
  const width = img.getAttribute('width') || 'auto'
  const height = img.getAttribute('height') || 'auto'

  return { node: new ImageNode(src, altText, width, height) }
}

// Helper functions
export function $createImageNode(src, altText, width, height) {
  return new ImageNode(src, altText, width, height)
}

export function $isImageNode(node) {
  return node instanceof ImageNode
}
```

**Key Implementation Points:**

1. **`importDOM()`** - Tells Lexical how to handle `<img>` tags during HTML import
2. **`exportDOM()`** - Converts the node back to an `<img>` element for HTML export
3. **`decorate()`** - Returns a React component to render in the editor
4. **`exportJSON()` / `importJSON()`** - Handles editor state serialization

### Using Commands

```javascript
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { FORMAT_TEXT_COMMAND } from 'lexical'

function ToolbarButton() {
  const [editor] = useLexicalComposerContext()

  const handleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }

  return <button onClick={handleBold}>Bold</button>
}
```

---

## Limitations and Considerations

### HTML Import Limitations

1. **Unregistered Nodes**: HTML elements without registered nodes are converted to plain text or ignored
2. **Style Attributes**: Inline styles (e.g., `style="color: red"`) are not preserved by default
3. **Class Attributes**: CSS classes are not preserved; Lexical uses its own theme classes
4. **Nested Structures**: Complex nested HTML may not convert perfectly

### Performance Considerations

1. **Large Documents**: Very large documents may impact performance
2. **Real-time Updates**: Use `editor.registerUpdateListener` sparingly
3. **DOM Operations**: Batch updates using `editor.update()` when possible

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires DOM APIs (DOMParser for HTML import)
- No IE11 support

### Accessibility

- Lexical provides ARIA attributes for accessibility
- Keyboard navigation is built-in
- Screen reader support included

---

## Quick Reference

### Common Imports

```javascript
// Core
import { $getRoot, $getSelection, $insertNodes } from 'lexical'

// React
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

// HTML
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
```

### Editor State Access Patterns

```javascript
// Read-only access (for export, inspection)
editor.getEditorState().read(() => {
  // Can read but cannot modify
})

// Write access (for import, modifications)
editor.update(() => {
  // Can read and modify
})

// Listen to changes
editor.registerUpdateListener(({ editorState }) => {
  // Called on every state change
})
```

---

## References

- [Lexical Documentation](https://lexical.dev/)
- [Lexical GitHub Repository](https://github.com/facebook/lexical)
- [Lexical Playground](https://playground.lexical.dev/)
