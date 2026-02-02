# AI-Rich Text Editor

A modern rich text editor built with React and Lexical framework, featuring HTML import/export capabilities for seamless API integration.

## Features

- **Rich Text Editing** - Bold, italic, underline, strikethrough formatting
- **Block Types** - Headings (H1-H4), paragraphs
- **Lists** - Ordered and unordered lists
- **Links** - Insert and edit hyperlinks with floating editor
- **Images** - Full image support with custom ImageNode
- **Text Color** - 50-color Material Design palette
- **HTML Import/Export** - Convert content to/from HTML for API storage
- **Undo/Redo** - Full history support

## Tech Stack

- **React 19** - UI framework
- **Lexical 0.39** - Extensible text editor framework by Meta
- **Vite 5** - Build tool and dev server

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at http://localhost:5173

## Project Structure

```
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Root component
├── Editor.jsx               # Main editor with Lexical config
├── Toolbar.jsx              # Formatting toolbar
├── FloatingLinkEditor.jsx   # Link editing popup
├── nodes/
│   └── ImageNode.jsx        # Custom image node
├── Editor.css               # Editor styles
├── Toolbar.css              # Toolbar styles
└── FloatingLinkEditor.css   # Link editor styles

docs/
└── LEXICAL-UNDERSTANDING.md # Technical documentation
```

## HTML Import/Export

The editor supports bidirectional HTML conversion for API integration.

### Export Content to HTML

```javascript
editor.getEditorState().read(() => {
  const html = $generateHtmlFromNodes(editor, null)
  // Send to API
})
```

### Import HTML into Editor

```javascript
editor.update(() => {
  const parser = new DOMParser()
  const dom = parser.parseFromString(htmlFromApi, 'text/html')
  const nodes = $generateNodesFromDOM(editor, dom)

  const root = $getRoot()
  root.clear()
  $insertNodes(nodes)
})
```

### Testing HTML Features

The editor includes test buttons:
- **Export to HTML** - Outputs HTML to console and displays below
- **Import Sample HTML** - Loads sample content with text, lists, links, and images

## Supported HTML Elements

| Element | Support |
|---------|---------|
| `<p>`, `<h1>`-`<h6>` | Built-in |
| `<strong>`, `<em>`, `<u>`, `<s>` | Built-in |
| `<ul>`, `<ol>`, `<li>` | Built-in |
| `<a>` | Built-in |
| `<img>` | Custom ImageNode |

## Custom Nodes

### ImageNode

Located at `src/nodes/ImageNode.jsx`, handles:
- HTML import (`<img>` tags)
- HTML export (back to `<img>`)
- Editor rendering with React component
- JSON serialization for editor state

## Documentation

See `docs/LEXICAL-UNDERSTANDING.md` for detailed technical documentation on:
- Lexical architecture
- Node system
- HTML serialization
- Custom node implementation
- Package dependencies

## Dependencies

### Production
- `lexical` - Core editor
- `@lexical/react` - React bindings
- `@lexical/rich-text` - Headings, quotes
- `@lexical/list` - List support
- `@lexical/link` - Link support
- `@lexical/html` - HTML import/export
- `@lexical/selection` - Selection utilities

### Development
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
