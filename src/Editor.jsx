import { useEffect, useState, useRef, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $getRoot, $insertNodes } from 'lexical'
import { ImageNode } from './nodes/ImageNode'
import Toolbar from './Toolbar'
import FloatingLinkEditor from './FloatingLinkEditor'
import './Editor.css'

// Theme for the editor
const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
  },
  link: 'editor-link',
  image: 'editor-image-container',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
  },
}

// Error handler
function onError(error) {
  console.error(error)
}

// Custom plugin to track changes
function OnChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState)
    })
  }, [editor, onChange])

  return null
}

// Placeholder component
function Placeholder() {
  return <div className="editor-placeholder">Enter some text...</div>
}

// Plugin to handle HTML serialization (export/import)
function HtmlSerializationPlugin({ onHtmlChange }) {
  const [editor] = useLexicalComposerContext()

  // Export editor content to HTML
  const exportToHtml = useCallback(() => {
    let html = ''
    editor.update(() => {
      html = $generateHtmlFromNodes(editor, null)
    })
    // Use getEditorState().read() to safely read the HTML
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null)
    })
    console.log('=== EXPORTED HTML ===')
    console.log(html)
    console.log('=====================')
    if (onHtmlChange) {
      onHtmlChange(html)
    }
    return html
  }, [editor, onHtmlChange])

  // Import HTML into editor (replaces current content)
  const importFromHtml = useCallback((htmlString) => {
    editor.update(() => {
      // Parse HTML string to DOM
      const parser = new DOMParser()
      const dom = parser.parseFromString(htmlString, 'text/html')

      // Generate Lexical nodes from DOM
      const nodes = $generateNodesFromDOM(editor, dom)

      // Clear existing content and insert new nodes
      const root = $getRoot()
      root.clear()
      root.select()
      $insertNodes(nodes)
    })
    console.log('=== IMPORTED HTML ===')
    console.log(htmlString)
    console.log('=====================')
  }, [editor])

  // Expose functions to parent via useEffect
  useEffect(() => {
    // Attach functions to window for testing (can be removed in production)
    window.editorExportHtml = exportToHtml
    window.editorImportHtml = importFromHtml

    return () => {
      delete window.editorExportHtml
      delete window.editorImportHtml
    }
  }, [exportToHtml, importFromHtml])

  return null
}

// Test buttons component for HTML import/export
function HtmlTestButtons() {
  const [editor] = useLexicalComposerContext()
  const [htmlOutput, setHtmlOutput] = useState('')

  const handleExport = () => {
    editor.getEditorState().read(() => {
      const html = $generateHtmlFromNodes(editor, null)
      console.log('=== EXPORTED HTML (for API) ===')
      console.log(html)
      console.log('===============================')
      setHtmlOutput(html)
    })
  }

  const handleImport = () => {
    // Sample HTML to test import (simulating API response)
    const sampleHtml = `
      <h1>Imported Content from API</h1>
      <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
      <p>Here is a <a href="https://example.com">link example</a>.</p>
      <p>Test image below:</p>
      <img src="https://picsum.photos/400/200" alt="Sample image from API" />
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
        <li>List item 3</li>
      </ul>
      <p>And some <u>underlined</u> text.</p>
    `

    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(sampleHtml, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)

      const root = $getRoot()
      root.clear()
      root.select()
      $insertNodes(nodes)
    })

    console.log('=== IMPORTED HTML (from API) ===')
    console.log(sampleHtml)
    console.log('================================')
  }

  return (
    <div className="html-test-buttons">
      <button onClick={handleExport} className="html-btn export-btn">
        Export to HTML (Console)
      </button>
      <button onClick={handleImport} className="html-btn import-btn">
        Import Sample HTML
      </button>
      {htmlOutput && (
        <div className="html-output">
          <h4>Exported HTML:</h4>
          <pre>{htmlOutput}</pre>
        </div>
      )}
    </div>
  )
}

function Editor() {
  const [editorState, setEditorState] = useState(null)
  const editorContainerRef = useRef(null)

  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, ImageNode],
  }

  function onChange(state) {
    setEditorState(state)
  }

  return (
    <div className="editor-container" ref={editorContainerRef}>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={onChange} />
          <HtmlSerializationPlugin />
          <FloatingLinkEditor anchorElem={editorContainerRef.current} />
        </div>
        <HtmlTestButtons />
      </LexicalComposer>

      {editorState && (
        <div className="editor-state-preview">
          <h3>Editor State (JSON):</h3>
          <pre>{JSON.stringify(editorState.toJSON(), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default Editor
