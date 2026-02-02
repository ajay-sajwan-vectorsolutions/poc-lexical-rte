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

  // For HTML export - converts node back to HTML
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
    return new ImageNode(
      json.src,
      json.altText,
      json.width,
      json.height
    )
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

  // Getters
  getSrc() {
    return this.__src
  }

  getAltText() {
    return this.__altText
  }
}

// React component for rendering the image
function ImageComponent({ src, altText, width, height, nodeKey }) {
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
  if (!src) {
    return null
  }
  const altText = img.getAttribute('alt') || ''
  const width = img.getAttribute('width') || 'auto'
  const height = img.getAttribute('height') || 'auto'

  const node = new ImageNode(src, altText, width, height)
  return { node }
}

// Helper function to create an ImageNode
export function $createImageNode(src, altText, width, height) {
  return new ImageNode(src, altText, width, height)
}

// Type guard to check if a node is an ImageNode
export function $isImageNode(node) {
  return node instanceof ImageNode
}
