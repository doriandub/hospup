'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Move, RotateCcw, Plus, Minus, Trash2, Copy, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

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
}

interface InteractiveTextEditorProps {
  textOverlays: TextOverlay[]
  setTextOverlays: (overlays: TextOverlay[]) => void
  selectedTextId: string | null
  setSelectedTextId: (id: string | null) => void
  videoSlots: any[]
  editorWidth: number
  editorHeight: number
  videoWidth: number
  videoHeight: number
}

export function InteractiveTextEditor({
  textOverlays,
  setTextOverlays,
  selectedTextId,
  setSelectedTextId,
  videoSlots,
  editorWidth = 270,
  editorHeight = 480,
  videoWidth = 1080,
  videoHeight = 1920
}: InteractiveTextEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showGuides, setShowGuides] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Helper function to check if position is centered
  const isCentered = (x: number, y: number) => {
    const centerThreshold = 3 // 3% tolerance
    const isXCentered = Math.abs(x - 50) < centerThreshold
    const isYCentered = Math.abs(y - 50) < centerThreshold
    return { isXCentered, isYCentered }
  }

  // Convert position percentage to pixels for editor
  const getEditorPosition = useCallback((text: TextOverlay) => {
    const xPixels = (text.position.x / 100) * videoWidth
    const yPixels = (text.position.y / 100) * videoHeight
    const editorX = (xPixels / videoWidth) * editorWidth
    const editorY = (yPixels / videoHeight) * editorHeight
    const editorFontSize = (text.style.font_size / videoWidth) * editorWidth
    
    return { editorX, editorY, editorFontSize }
  }, [videoWidth, videoHeight, editorWidth, editorHeight])

  // Convert editor pixels to percentage
  const getPercentagePosition = useCallback((editorX: number, editorY: number) => {
    const videoX = (editorX / editorWidth) * videoWidth
    const videoY = (editorY / editorHeight) * videoHeight
    const x = (videoX / videoWidth) * 100
    const y = (videoY / videoHeight) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }, [editorWidth, editorHeight, videoWidth, videoHeight])

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    if (isEditing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const text = textOverlays.find(t => t.id === textId)
    if (!text) return

    const { editorX, editorY } = getEditorPosition(text)
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + editorX),
        y: e.clientY - (containerRect.top + editorY)
      })
    }
    
    setIsDragging(true)
    setSelectedTextId(textId)
    setShowGuides(true)
  }, [textOverlays, getEditorPosition, isEditing, setSelectedTextId])

  // Handle drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedTextId || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newEditorX = e.clientX - containerRect.left - dragOffset.x
    const newEditorY = e.clientY - containerRect.top - dragOffset.y
    
    const { x, y } = getPercentagePosition(newEditorX, newEditorY)
    
    setTextOverlays(textOverlays.map(text => 
      text.id === selectedTextId 
        ? { ...text, position: { ...text.position, x, y } }
        : text
    ))
  }, [isDragging, selectedTextId, dragOffset, textOverlays, setTextOverlays, getPercentagePosition])

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setShowGuides(false)
  }, [])

  // Attach global mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle double click to edit
  const handleDoubleClick = useCallback((textId: string) => {
    setIsEditing(textId)
    setSelectedTextId(textId)
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 0)
  }, [setSelectedTextId])

  // Handle edit save
  const handleEditSave = useCallback((textId: string, newContent: string) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, content: newContent }
        : text
    ))
    setIsEditing(null)
  }, [textOverlays, setTextOverlays])

  // Update font size
  const updateFontSize = useCallback((textId: string, size: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, style: { ...text.style, font_size: size } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  // Delete text
  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  // Duplicate text
  const duplicateText = useCallback((textId: string) => {
    const text = textOverlays.find(t => t.id === textId)
    if (text) {
      const newText = {
        ...text,
        id: Date.now().toString(),
        position: { ...text.position, x: text.position.x + 5, y: text.position.y + 5 }
      }
      setTextOverlays([...textOverlays, newText])
      setSelectedTextId(newText.id)
    }
  }, [textOverlays, setTextOverlays, setSelectedTextId])

  const selectedText = selectedTextId ? textOverlays.find(t => t.id === selectedTextId) : null

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ zIndex: 5 }}
    >
      {/* Center guides */}
      {showGuides && selectedText && (
        <>
          {/* Vertical center line */}
          {isCentered(selectedText.position.x, selectedText.position.y).isXCentered && (
            <div 
              className="absolute bg-blue-400 opacity-60 pointer-events-none"
              style={{
                left: '50%',
                top: 0,
                width: '1px',
                height: '100%',
                transform: 'translateX(-50%)',
                zIndex: 15
              }}
            />
          )}
          {/* Horizontal center line */}
          {isCentered(selectedText.position.x, selectedText.position.y).isYCentered && (
            <div 
              className="absolute bg-blue-400 opacity-60 pointer-events-none"
              style={{
                top: '50%',
                left: 0,
                height: '1px',
                width: '100%',
                transform: 'translateY(-50%)',
                zIndex: 15
              }}
            />
          )}
        </>
      )}

      {/* Text overlays */}
      {textOverlays.map((text) => {
        const { editorX, editorY, editorFontSize } = getEditorPosition(text)
        const isSelected = selectedTextId === text.id
        const isEditingThis = isEditing === text.id

        return (
          <div key={text.id}>
            {/* Text element */}
            {isEditingThis ? (
              <input
                ref={editInputRef}
                className="absolute bg-transparent text-white border border-blue-400 rounded px-1"
                style={{
                  left: `${editorX}px`,
                  top: `${editorY}px`,
                  fontFamily: text.style.font_family,
                  fontSize: `${Math.max(8, editorFontSize)}px`,
                  color: text.style.color,
                  fontWeight: text.style.bold ? 'bold' : 'normal',
                  fontStyle: text.style.italic ? 'italic' : 'normal',
                  zIndex: 20
                }}
                defaultValue={text.content}
                onBlur={(e) => handleEditSave(text.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSave(text.id, e.currentTarget.value)
                  } else if (e.key === 'Escape') {
                    setIsEditing(null)
                  }
                }}
              />
            ) : (
              <div
                className={`absolute transition-all select-none ${
                  isDragging && isSelected ? 'cursor-grabbing' : 'cursor-grab'
                } ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-60' : ''}`}
                style={{
                  left: `${editorX}px`,
                  top: `${editorY}px`,
                  fontFamily: text.style.font_family,
                  fontSize: `${Math.max(8, editorFontSize)}px`,
                  color: text.style.color,
                  textShadow: text.style.shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  WebkitTextStroke: text.style.outline ? '0.5px black' : 'none',
                  backgroundColor: text.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                  fontWeight: text.style.bold ? 'bold' : 'normal',
                  fontStyle: text.style.italic ? 'italic' : 'normal',
                  padding: text.style.background ? '2px 4px' : '0',
                  borderRadius: text.style.background ? '2px' : '0',
                  opacity: text.style.opacity,
                  whiteSpace: 'nowrap',
                  zIndex: isSelected ? 15 : 10,
                  transformOrigin: 'top left',
                  border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, text.id)}
                onDoubleClick={() => handleDoubleClick(text.id)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTextId(text.id)
                }}
              >
                {text.content}
              </div>
            )}

            {/* Controls for selected text */}
            {isSelected && !isEditingThis && (
              <div
                className="absolute flex items-center gap-1 bg-black/80 rounded-md px-2 py-1 text-white text-xs"
                style={{
                  left: `${editorX}px`,
                  top: `${editorY - 35}px`,
                  zIndex: 25
                }}
              >
                {/* Font size slider */}
                <div className="flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  <div className="w-16">
                    <Slider
                      value={[text.style.font_size]}
                      onValueChange={([value]) => updateFontSize(text.id, value)}
                      min={20}
                      max={120}
                      step={5}
                      className="h-4"
                    />
                  </div>
                  <Plus className="w-3 h-3" />
                </div>
                
                <div className="w-px h-4 bg-gray-500" />
                
                {/* Action buttons */}
                <button
                  onClick={() => duplicateText(text.id)}
                  className="hover:bg-white/20 p-1 rounded"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteText(text.id)}
                  className="hover:bg-red-500/50 p-1 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}