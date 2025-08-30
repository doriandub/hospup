'use client'

import React, { useCallback } from 'react'

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

interface SimpleTextEditorProps {
  textOverlays: TextOverlay[]
  setTextOverlays: (overlays: TextOverlay[]) => void
  selectedTextId: string | null
  setSelectedTextId: (id: string | null) => void
  currentTime?: number
}

export function SimpleTextEditor({
  textOverlays,
  setTextOverlays,
  selectedTextId,
  setSelectedTextId,
  currentTime = 0
}: SimpleTextEditorProps) {
  
  // Obtenir les textes visibles au temps actuel
  const getVisibleTexts = useCallback((time: number) => {
    return textOverlays.filter(text => 
      time >= text.start_time && time <= text.end_time
    )
  }, [textOverlays])

  // Mise à jour position directe
  const updateTextPosition = useCallback((textId: string, newX: number, newY: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, position: { ...text.position, x: newX, y: newY } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  const visibleTexts = getVisibleTexts(currentTime)

  return (
    <div className="absolute inset-0">
      {visibleTexts.map((text) => {
        // Conversion pour affichage dans l'éditeur 270x480
        const editorX = text.position.x / 4  // 1080 -> 270
        const editorY = text.position.y / 4  // 1920 -> 480
        const editorFontSize = text.style.font_size / 4  // Proportionnel
        
        return (
          <div
            key={text.id}
            className={`absolute cursor-move select-none ${
              selectedTextId === text.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${editorX}px`,
              top: `${editorY}px`,
              fontFamily: text.style.font_family,
              fontSize: `${editorFontSize}px`,
              color: text.style.color,
              fontWeight: text.style.bold ? 'bold' : 'normal',
              fontStyle: text.style.italic ? 'italic' : 'normal',
              textShadow: text.style.shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
              textAlign: text.textAlign || 'center',
              opacity: text.style.opacity,
              transform: text.position.anchor === 'center' ? 'translate(-50%, -50%)' : 'none',
              pointerEvents: 'auto'
            }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedTextId(text.id)
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSelectedTextId(text.id)
            
            const startX = e.clientX - editorX
            const startY = e.clientY - editorY
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              // Coordonnées dans l'éditeur 270x480
              const newEditorX = Math.max(0, Math.min(270, moveEvent.clientX - startX))
              const newEditorY = Math.max(0, Math.min(480, moveEvent.clientY - startY))
              
              // Conversion vers coordonnées vidéo 1080x1920
              const newVideoX = newEditorX * 4
              const newVideoY = newEditorY * 4
              
              updateTextPosition(text.id, newVideoX, newVideoY)
            }
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        >
          {text.content}
        </div>
        )
      })}
    </div>
  )
}