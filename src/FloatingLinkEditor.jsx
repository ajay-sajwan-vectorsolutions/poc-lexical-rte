import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  createCommand,
} from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { createPortal } from 'react-dom'
import './FloatingLinkEditor.css'

// Custom command to open the link editor
export const OPEN_LINK_EDITOR_COMMAND = createCommand('OPEN_LINK_EDITOR_COMMAND')

function getSelectedNode(selection) {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return focus.type === 'element' ? focus.getNode().getDescendantByIndex(focus.offset) : focusNode
  } else {
    return anchor.type === 'element' ? anchor.getNode().getDescendantByIndex(anchor.offset - 1) : anchorNode
  }
}

function FloatingLinkEditor({ anchorElem }) {
  const [editor] = useLexicalComposerContext()
  const editorRef = useRef(null)
  const inputRef = useRef(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [lastSelection, setLastSelection] = useState(null)
  const [isLink, setIsLink] = useState(false)
  const [rect, setRect] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const parent = node.getParent()

      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL())
        setIsLink(true)
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL())
        setIsLink(true)
      } else {
        setLinkUrl('')
        setIsLink(false)
      }

      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (
        nativeSelection !== null &&
        rootElement !== null &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        const domRange = nativeSelection.getRangeAt(0)
        const rectData = domRange.getBoundingClientRect()
        setRect(rectData)
        setLastSelection(selection)
      }
    }

    return true
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor()
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_LINK_EDITOR_COMMAND,
        () => {
          updateLinkEditor()
          setShowEditor(true)
          setIsEditMode(true)
          return true
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [editor, updateLinkEditor])

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditMode])

  // Close editor when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        setShowEditor(false)
        setIsEditMode(false)
      }
    }

    if (showEditor) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEditor])

  // Show editor when clicking on a link
  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target
      if (target.closest('.editor-link')) {
        editor.getEditorState().read(() => {
          updateLinkEditor()
        })
        setShowEditor(true)
        setIsEditMode(false)
      }
    }

    const rootElement = editor.getRootElement()
    if (rootElement) {
      rootElement.addEventListener('click', handleClick)
      return () => rootElement.removeEventListener('click', handleClick)
    }
  }, [editor, updateLinkEditor])

  const handleLinkSubmit = () => {
    if (lastSelection !== null) {
      if (linkUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl)
      }
      setIsEditMode(false)
      setShowEditor(false)
    }
  }

  const handleRemoveLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    setIsLink(false)
    setIsEditMode(false)
    setShowEditor(false)
  }

  const handleEditLink = () => {
    setIsEditMode(true)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleLinkSubmit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setIsEditMode(false)
      setShowEditor(false)
    }
  }

  // Helper function to extract readable URL
  const getDisplayUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '')
    } catch {
      return url
    }
  }

  if (!showEditor || !rect) {
    return null
  }

  const style = {
    top: rect.bottom + window.scrollY + 8,
    left: rect.left + window.scrollX,
  }

  return createPortal(
    <div ref={editorRef} className="floating-link-editor" style={style}>
      {isLink && !isEditMode ? (
        // View mode - show URL with Edit and Remove options
        <div className="link-view">
          <span className="link-label">Visit URL:</span>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-url"
          >
            {getDisplayUrl(linkUrl)}
          </a>
          <button type="button" className="link-action" onClick={handleEditLink}>
            Edit
          </button>
          <span className="link-divider">|</span>
          <button type="button" className="link-action link-remove" onClick={handleRemoveLink}>
            Remove
          </button>
        </div>
      ) : (
        // Edit/Create mode - show input field
        <div className="link-edit">
          <span className="link-label">Enter link:</span>
          <input
            ref={inputRef}
            className="link-input"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
          />
          <button type="button" className="link-save" onClick={handleLinkSubmit}>
            Save
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}

export default FloatingLinkEditor
