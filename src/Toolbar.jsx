import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list'
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text'
import { $setBlocksType, $patchStyleText } from '@lexical/selection'
import { $getNearestNodeOfType } from '@lexical/utils'
import { $createParagraphNode } from 'lexical'
import { OPEN_LINK_EDITOR_COMMAND } from './FloatingLinkEditor'
import './Toolbar.css'

const LowPriority = 1

const BLOCK_TYPE_OPTIONS = [
  { value: 'h4', label: 'Small', className: 'dropdown-item-small' },
  { value: 'paragraph', label: 'Normal', className: 'dropdown-item-normal' },
  { value: 'h3', label: 'Large', className: 'dropdown-item-large' },
  { value: 'h1', label: 'Huge', className: 'dropdown-item-huge' },
]

const COLOR_PALETTE = [
  // Row 1
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  // Row 2
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  // Row 3
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  // Row 4
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  // Row 5
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
]

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [showBlockTypeDropdown, setShowBlockTypeDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [textColor, setTextColor] = useState('#000000')
  const dropdownRef = useRef(null)
  const colorPickerRef = useRef(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))

      // Check for link
      const node = selection.anchor.getNode()
      const parent = node.getParent()
      setIsLink($isLinkNode(parent) || $isLinkNode(node))

      // Check block type
      const anchorNode = selection.anchor.getNode()
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow()

      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode)
        const type = parentList ? parentList.getListType() : element.getListType()
        setBlockType(type === 'bullet' ? 'ul' : 'ol')
      } else {
        const type = $isHeadingNode(element) ? element.getTag() : element.getType()
        setBlockType(type)
      }
    }
  }, [])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      LowPriority
    )
  }, [editor, updateToolbar])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBlockTypeDropdown(false)
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
  }

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
  }

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const insertLink = () => {
    if (!isLink) {
      // Open the floating link editor
      editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)
    } else {
      // Remove the link
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }

  const formatBlock = (value) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (value === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode())
        } else if (['h1', 'h2', 'h3', 'h4'].includes(value)) {
          $setBlocksType(selection, () => $createHeadingNode(value))
        }
      }
    })
    setShowBlockTypeDropdown(false)
  }

  const applyTextColor = (color) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color })
      }
    })
    setTextColor(color)
    setShowColorPicker(false)
  }

  const getBlockTypeLabel = () => {
    const option = BLOCK_TYPE_OPTIONS.find((opt) => opt.value === blockType)
    return option ? option.label : 'Normal'
  }

  return (
    <div className="toolbar">
      <button
        type="button"
        onClick={formatBold}
        className={`toolbar-btn ${isBold ? 'active' : ''}`}
        title="Bold (Ctrl+B)"
      >
        <span className="bold">B</span>
      </button>
      <button
        type="button"
        onClick={formatItalic}
        className={`toolbar-btn ${isItalic ? 'active' : ''}`}
        title="Italic (Ctrl+I)"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onClick={formatUnderline}
        className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
        title="Underline (Ctrl+U)"
      >
        <span className="underline">U</span>
      </button>

      <div className="toolbar-divider" />

      {/* Color Picker */}
      <div className="dropdown-container" ref={colorPickerRef}>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        >
          <span className="text-color" style={{ borderBottomColor: textColor }}>A</span>
        </button>
        {showColorPicker && (
          <div className="color-picker-popup">
            <div className="color-palette">
              {COLOR_PALETTE.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => applyTextColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Block Type Dropdown */}
      <div className="dropdown-container" ref={dropdownRef}>
        <button
          type="button"
          className="toolbar-dropdown-btn"
          onClick={() => setShowBlockTypeDropdown(!showBlockTypeDropdown)}
        >
          <span>{getBlockTypeLabel()}</span>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path fill="currentColor" d="M3 4.5L6 8l3-3.5H3z" />
          </svg>
        </button>
        {showBlockTypeDropdown && (
          <div className="dropdown-menu">
            {BLOCK_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`dropdown-item ${option.className} ${
                  blockType === option.value ? 'active' : ''
                }`}
                onClick={() => formatBlock(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      <button
        type="button"
        onClick={formatNumberedList}
        className={`toolbar-btn ${blockType === 'ol' ? 'active' : ''}`}
        title="Numbered List"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={formatBulletList}
        className={`toolbar-btn ${blockType === 'ul' ? 'active' : ''}`}
        title="Bullet List"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={insertLink}
        className={`toolbar-btn ${isLink ? 'active' : ''}`}
        title="Insert Link"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </button>
    </div>
  )
}

export default Toolbar
