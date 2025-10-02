'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number } // Can be pixels or percentage
  style: {
    color: string
    font_size: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  }
}

interface InteractiveTextOverlayProps {
  textOverlay: TextOverlay
  isSelected: boolean
  onSelect: (textId: string) => void
  onUpdatePosition: (textId: string, position: { x: number; y: number }) => void
  onUpdateSize: (textId: string, fontSize: number) => void
  onUpdateContent?: (textId: string, content: string) => void
  containerWidth: number
  containerHeight: number
  scale?: number
}

export function InteractiveTextOverlay({
  textOverlay,
  isSelected,
  onSelect,
  onUpdatePosition,
  onUpdateSize,
  onUpdateContent,
  containerWidth,
  containerHeight,
  scale = 1
}: InteractiveTextOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(textOverlay.content)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, initialSize: 0 })
  const [showGuides, setShowGuides] = useState(false)
  const [snapGuides, setSnapGuides] = useState({ vertical: null as number | null, horizontal: null as number | null })

  const textRef = useRef<HTMLDivElement>(null)

  // Convert percentage to pixels if needed (current system uses %)
  const pixelX = textOverlay.position.x <= 100 ? (textOverlay.position.x / 100) * containerWidth : textOverlay.position.x
  const pixelY = textOverlay.position.y <= 100 ? (textOverlay.position.y / 100) * containerHeight : textOverlay.position.y

  // Snap tolerance in pixels
  const SNAP_TOLERANCE = 15
  const CENTER_X = containerWidth / 2
  const CENTER_Y = containerHeight / 2

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    onSelect(textOverlay.id)

    if (e.detail === 2) { // Double click - start editing
      setIsEditing(true)
      setEditText(textOverlay.content)
    } else if (e.detail === 1) { // Single click - start dragging
      setIsDragging(true)
      setShowGuides(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        initialX: pixelX,
        initialY: pixelY
      })
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      initialSize: textOverlay.style.font_size
    })
  }

  const checkSnapToCenter = (x: number, y: number) => {
    const guides = { vertical: null as number | null, horizontal: null as number | null }

    // Check vertical center snap
    if (Math.abs(x - CENTER_X) < SNAP_TOLERANCE) {
      guides.vertical = CENTER_X
      x = CENTER_X
    }

    // Check horizontal center snap
    if (Math.abs(y - CENTER_Y) < SNAP_TOLERANCE) {
      guides.horizontal = CENTER_Y
      y = CENTER_Y
    }

    setSnapGuides(guides)
    return { x, y }
  }

  const handleEditSave = () => {
    if (onUpdateContent) {
      onUpdateContent(textOverlay.id, editText)
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditText(textOverlay.content)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      let newX = dragStart.initialX + deltaX
      let newY = dragStart.initialY + deltaY

      // Constrain to container bounds (with some margin for text)
      const margin = 20
      newX = Math.max(margin, Math.min(containerWidth - margin, newX))
      newY = Math.max(margin, Math.min(containerHeight - margin, newY))

      // Check for snap to center
      const snapped = checkSnapToCenter(newX, newY)
      newX = snapped.x
      newY = snapped.y

      // Convert back to percentage for compatibility with current system
      const percentX = (newX / containerWidth) * 100
      const percentY = (newY / containerHeight) * 100
      onUpdatePosition(textOverlay.id, { x: percentX, y: percentY })
    }

    if (isResizing) {
      const deltaY = e.clientY - resizeStart.y // Fixed: dragging down increases size
      const sizeChange = deltaY * 0.3 // Adjust sensitivity
      const newSize = Math.max(12, Math.min(120, resizeStart.initialSize + sizeChange))

      onUpdateSize(textOverlay.id, newSize)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setShowGuides(false)
    setSnapGuides({ vertical: null, horizontal: null })
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  return (
    <>
      {/* Snap guides */}
      {showGuides && (
        <>
          {snapGuides.vertical !== null && (
            <div
              className="absolute bg-blue-400 opacity-75 pointer-events-none z-50"
              style={{
                left: snapGuides.vertical - 0.5,
                top: 0,
                width: 1,
                height: containerHeight
              }}
            />
          )}
          {snapGuides.horizontal !== null && (
            <div
              className="absolute bg-blue-400 opacity-75 pointer-events-none z-50"
              style={{
                left: 0,
                top: snapGuides.horizontal - 0.5,
                width: containerWidth,
                height: 1
              }}
            />
          )}
        </>
      )}

      {/* Text element */}
      <div
        ref={textRef}
        className={cn(
          "absolute cursor-move select-none transition-all duration-75 focus:outline-none",
          isSelected ? "z-40" : "z-30"
        )}
        style={{
          left: pixelX,
          top: pixelY,
          fontSize: `${Math.max(8, textOverlay.style.font_size * scale)}px`,
          color: textOverlay.style.color,
          fontFamily: textOverlay.style.fontFamily || 'Arial, sans-serif',
          fontWeight: textOverlay.style.fontWeight || 'normal',
          fontStyle: textOverlay.style.fontStyle || 'normal',
          textAlign: textOverlay.style.textAlign as any || 'left',
          textDecoration: (textOverlay.style as any).textDecoration || 'none',
          textShadow: (textOverlay.style as any).textShadow || '1px 1px 2px rgba(0,0,0,0.5)',
          WebkitTextStroke: (textOverlay.style as any).webkitTextStroke || 'none',
          backgroundColor: (textOverlay.style as any).backgroundColor || 'transparent',
          padding: (textOverlay.style as any).padding || '0',
          borderRadius: (textOverlay.style as any).borderRadius || '0',
          letterSpacing: (textOverlay.style as any).letterSpacing || 'normal',
          lineHeight: (textOverlay.style as any).lineHeight || 'normal',
          opacity: (textOverlay.style as any).opacity || 1,
          transform: 'translate(-50%, -50%)', // Center the text on its position
          whiteSpace: 'nowrap',
          userSelect: 'none',
          border: 'none',
          outline: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEditSave}
            className="bg-transparent border-none outline-none text-center text-inherit font-inherit"
            style={{
              fontSize: 'inherit',
              color: 'inherit',
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              fontStyle: 'inherit',
              width: '100%',
              minWidth: '50px'
            }}
            autoFocus
          />
        ) : (
          textOverlay.content
        )}

        {/* Selection frame and resize handles */}
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Selection border - removed blue outline */}

            {/* Resize handles in corners - smaller size */}
            <div
              className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nw-resize pointer-events-auto shadow-sm hover:bg-blue-600 transition-colors"
              onMouseDown={handleResizeMouseDown}
            />
            <div
              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ne-resize pointer-events-auto shadow-sm hover:bg-blue-600 transition-colors"
              onMouseDown={handleResizeMouseDown}
            />
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-sw-resize pointer-events-auto shadow-sm hover:bg-blue-600 transition-colors"
              onMouseDown={handleResizeMouseDown}
            />
            <div
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-se-resize pointer-events-auto shadow-sm hover:bg-blue-600 transition-colors"
              onMouseDown={handleResizeMouseDown}
            />

          </div>
        )}

      </div>
    </>
  )
}