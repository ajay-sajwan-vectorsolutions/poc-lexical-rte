# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Create production build
npm run preview      # Preview production build locally
```

Note: No testing or linting frameworks are currently configured.

## Architecture Overview

This is a React 19 rich text editor built on Meta's Lexical framework.

### Tech Stack
- **React 19.0.0** with Vite 5.0.0
- **Lexical 0.39.0** - Extensible text editor framework
- **Pure JavaScript** (no TypeScript)

### Component Hierarchy

```
App.jsx
└── Editor.jsx (LexicalComposer wrapper)
    ├── Toolbar.jsx (formatting controls)
    ├── FloatingLinkEditor.jsx (link editing popup)
    └── Lexical Plugins (RichText, History, List, Link)
```

### Key Patterns

**Plugin Architecture**: The editor uses Lexical's plugin system. Each feature (history, lists, links) is a separate plugin composed within `LexicalComposer`.

**Command Dispatch**: Editor actions use Lexical's command system via `editor.dispatchCommand()` for formatting, list creation, and link insertion.

**Floating Editor Pattern**: `FloatingLinkEditor` uses React Portal to render a positioned popup below selected link text, with view/edit modes.

**State Access**: Components access the editor instance via `useLexicalComposerContext()` hook.

### Editor Configuration

Registered nodes in `Editor.jsx`:
- `HeadingNode` - h1-h4 headings
- `ListNode` / `ListItemNode` - ordered/unordered lists
- `LinkNode` - hyperlinks
- `ImageNode` - custom node for images (src/nodes/ImageNode.jsx)

### Toolbar Features

- **Block types**: Small (h4), Normal (p), Large (h3), Huge (h1)
- **Text formatting**: Bold, Italic, Underline
- **Text color**: 50-color Material Design palette
- **Lists**: Ordered and unordered
- **Links**: Insert/edit via floating editor

### HTML Test Controls

The editor includes test controls for HTML operations:
- **Export to HTML** - Converts editor content to HTML string
- **Import Sample HTML** - Loads predefined sample content
- **HTML Input Textarea** - Enter custom HTML code
- **Render HTML** - Renders custom HTML into the editor

### CSS Organization

Each component has a dedicated CSS file with scoped class names:
- `Editor.css` - Editor container and content area
- `Toolbar.css` - Toolbar buttons and dropdowns
- `FloatingLinkEditor.css` - Link popup positioning and styling

## Documentation

- `docs/LEXICAL-UNDERSTANDING.md` - Comprehensive technical documentation covering:
  - HTML serialization (import/export)
  - Node system and registration
  - Built-in vs custom nodes reference table
  - Package dependencies
  - Implementation examples
  - Custom DecoratorNode patterns (e.g., ImageNode)
