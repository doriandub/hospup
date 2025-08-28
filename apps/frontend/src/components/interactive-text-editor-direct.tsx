'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, Move } from 'lucide-react'

interface VideoSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
  assignedVideo?: {
    title: string
    thumbnail_url: string
  }
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number; anchor: string }
  style: {
    font_family: string
    font_size: number
    color: string
    bold: boolean
    italic: boolean
    shadow: boolean
    outline: boolean
    background: boolean
    opacity: number
  }
  textAlign?: 'left' | 'center' | 'right'
}

interface InteractiveTextEditorDirectProps {
  textOverlays: TextOverlay[]
  setTextOverlays: (overlays: TextOverlay[]) => void
  selectedTextId: string | null
  setSelectedTextId: (id: string | null) => void
  videoSlots: VideoSlot[]
  editorWidth: number
  editorHeight: number
  videoWidth: number
  videoHeight: number
}

export function InteractiveTextEditorDirect({
  textOverlays,
  setTextOverlays,
  selectedTextId,
  setSelectedTextId,
  videoSlots,
  editorWidth,
  editorHeight,
  videoWidth,
  videoHeight
}: InteractiveTextEditorDirectProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const dragRef = useRef<{ startX: number; startY: number; textId: string }>()

  // AUCUNE CONVERSION - DIRECT 1:1
  const getTextPixels = useCallback((text: TextOverlay) => {
    return { x: text.position.x, y: text.position.y }
  }, [])

  const getEditorPosition = useCallback((text: TextOverlay) => {
    return {
      editorX: text.position.x,
      editorY: text.position.y,
      editorFontSize: text.style.font_size
    }
  }, [])

  const getVideoPixels = useCallback((editorX: number, editorY: number) => {
    return { x: editorX, y: editorY }
  }, [])

  const updateTextPosition = useCallback((textId: string, newX: number, newY: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, position: { ...text.position, x: newX, y: newY } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(text => text.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  const handleMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const text = textOverlays.find(t => t.id === textId)
    if (!text) return

    setSelectedTextId(textId)
    setIsDragging(true)
    
    const { x, y } = getTextPixels(text)
    dragRef.current = {
      startX: e.clientX - x,
      startY: e.clientY - y,
      textId
    }
  }, [textOverlays, setSelectedTextId, getTextPixels])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return
    
    const newX = Math.max(0, Math.min(1080, e.clientX - dragRef.current.startX))
    const newY = Math.max(0, Math.min(1920, e.clientY - dragRef.current.startY))
    
    updateTextPosition(dragRef.current.textId, newX, newY)
  }, [isDragging, updateTextPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragRef.current = undefined
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="absolute inset-0">
      {textOverlays.map((text) => {
        const { editorX, editorY, editorFontSize } = getEditorPosition(text)
        const isSelected = selectedTextId === text.id
        
        return (
          <div key={text.id} className="absolute">
            {/* Text Element */}
            <div
              className={`absolute cursor-move select-none transition-all duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
              style={{
                left: `${editorX}px`,
                top: `${editorY}px`,
                fontFamily: text.style.font_family,
                fontSize: `${editorFontSize}px`,
                color: text.style.color,
                fontWeight: text.style.bold ? 'bold' : 'normal',
                fontStyle: text.style.italic ? 'italic' : 'normal',
                textShadow: text.style.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                WebkitTextStroke: text.style.outline ? '1px black' : 'none',
                backgroundColor: text.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                textAlign: text.textAlign || 'center',
                opacity: text.style.opacity,
                padding: text.style.background ? '4px 8px' : '0',
                borderRadius: text.style.background ? '4px' : '0',
                transform: text.position.anchor === 'center' ? 'translate(-50%, -50%)' : 'none',
                zIndex: isSelected ? 20 : 10,
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => handleMouseDown(e, text.id)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedTextId(text.id)
              }}
            >
              {text.content}
            </div>
            
            {/* Controls pour texte sélectionné */}
            {isSelected && showControls && (
              <div
                className="absolute flex gap-1 bg-white border border-gray-300 rounded shadow-lg p-1 z-30"
                style={{
                  left: `${editorX + 10}px`,
                  top: `${editorY - 35}px`,
                }}
              >
                <button
                  onClick={() => deleteText(text.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-move"
                  title="Déplacer"
                >
                  <Move className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}