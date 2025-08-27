'use client'

import React, { useState, useCallback } from 'react'
import { Play, Pause, Type, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface VideoPreviewEditorProps {
  videoSlots: VideoSlot[]
  textOverlays: TextOverlay[]
  setTextOverlays: (overlays: TextOverlay[]) => void
  selectedTextId: string | null
  setSelectedTextId: (id: string | null) => void
  currentTime: number
  totalDuration: number
  onTimeChange: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  isPlaying?: boolean
}

export function VideoPreviewEditor({
  videoSlots,
  textOverlays,
  setTextOverlays,
  selectedTextId,
  setSelectedTextId,
  currentTime,
  totalDuration,
  onTimeChange,
  onPlay,
  onPause,
  isPlaying = false
}: VideoPreviewEditorProps) {
  
  // Obtenir l'image de fond correspondant au temps actuel
  const getCurrentBackgroundImage = useCallback((time: number) => {
    for (const slot of videoSlots) {
      if (time >= slot.start_time && time < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          return `url(${slot.assignedVideo.thumbnail_url})`
        }
      }
    }
    return 'linear-gradient(135deg, #115446 0%, #ff914d 100%)'
  }, [videoSlots])

  // Obtenir les textes visibles au temps actuel
  const getVisibleTexts = useCallback((time: number) => {
    return textOverlays.filter(text => 
      time >= text.start_time && time <= text.end_time
    )
  }, [textOverlays])

  const backgroundImage = getCurrentBackgroundImage(currentTime)
  const visibleTexts = getVisibleTexts(currentTime)

  // Créer un nouveau texte
  const createNewText = useCallback((x: number, y: number) => {
    const newText: TextOverlay = {
      id: Date.now().toString(),
      content: 'New Text',
      start_time: currentTime,
      end_time: Math.min(currentTime + 3, totalDuration),
      position: { 
        x: Math.max(0, Math.min(1080, x)), 
        y: Math.max(0, Math.min(1920, y)), 
        anchor: 'center' 
      },
      style: {
        font_family: 'Arial',
        font_size: 18, // Taille réduite
        color: '#FFFFFF',
        bold: false,
        italic: false,
        shadow: true,
        outline: false,
        background: false,
        opacity: 1
      },
      textAlign: 'center'
    }
    
    setTextOverlays([...textOverlays, newText])
    setSelectedTextId(newText.id)
  }, [currentTime, totalDuration, textOverlays, setTextOverlays, setSelectedTextId])

  // Supprimer un texte
  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(text => text.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  // Mettre à jour la position d'un texte
  const updateTextPosition = useCallback((textId: string, newX: number, newY: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, position: { ...text.position, x: newX, y: newY } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  return (
    <div className="space-y-4">
      {/* Preview Video - Simple et visible */}
      <div className="flex justify-center">
        <div 
          className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-800"
          style={{
            width: '270px',
            height: '480px',
            backgroundImage: backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            // Conversion 270x480 -> 1080x1920 (ratio x4)
            const editorX = e.clientX - rect.left
            const editorY = e.clientY - rect.top
            const videoX = editorX * 4
            const videoY = editorY * 4
            createNewText(videoX, videoY)
          }}
        >
          {/* TEXTE TEST FIXE */}
          <div 
            className="absolute text-white font-bold"
            style={{
              left: '135px', // Centre horizontal
              top: '240px',  // Centre vertical
              fontSize: '18px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              border: '2px solid red', // Pour voir le texte
              padding: '4px',
              backgroundColor: 'rgba(255,0,0,0.3)'
            }}
          >
            TEST TEXTE
          </div>
          
          {/* Textes visibles */}
          {visibleTexts.map((text) => (
            <div
              key={text.id}
              className={`absolute cursor-move select-none ${
                selectedTextId === text.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                left: `${text.position.x / 4}px`, // Diviser par 4 pour l'affichage
                top: `${text.position.y / 4}px`,
                fontFamily: text.style.font_family,
                fontSize: `${text.style.font_size / 4}px`, // Diviser par 4
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
                
                const rect = e.currentTarget.parentElement?.getBoundingClientRect()
                if (!rect) return
                
                // Position initiale en pixels éditeur 270x480
                const startEditorX = (e.clientX - rect.left)
                const startEditorY = (e.clientY - rect.top)
                const initialVideoX = text.position.x
                const initialVideoY = text.position.y
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  // Déplacement en pixels éditeur
                  const deltaX = (moveEvent.clientX - rect.left) - startEditorX
                  const deltaY = (moveEvent.clientY - rect.top) - startEditorY
                  
                  // Conversion en pixels vidéo (x4)
                  const newVideoX = Math.max(0, Math.min(1080, initialVideoX + (deltaX * 4)))
                  const newVideoY = Math.max(0, Math.min(1920, initialVideoY + (deltaY * 4)))
                  
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
              
              {/* Bouton supprimer pour texte sélectionné */}
              {selectedTextId === text.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteText(text.id)
                  }}
                  className="absolute -top-8 -right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  style={{ fontSize: '12px' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Empty state */}
          {textOverlays.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white/70">
                <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Double-click to add text</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          className="text-gray-600 hover:text-gray-900"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <span className="text-xs text-gray-500 min-w-[60px] text-center">
          {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>
    </div>
  )
}