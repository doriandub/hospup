'use client'

import React, { useState, useCallback } from 'react'
import { Play, Pause, Type, Trash2, AlignLeft, AlignCenter, AlignRight, Plus, Minus, Move } from 'lucide-react'
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

interface VideoEditorCompleteProps {
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

export function VideoEditorComplete({
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
}: VideoEditorCompleteProps) {
  
  // Obtenir l'image de fond correspondant au temps actuel
  const getCurrentBackgroundImage = useCallback((time: number) => {
    for (const slot of videoSlots) {
      if (time >= slot.start_time && time < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          return `url(${slot.assignedVideo.thumbnail_url})`
        }
      }
    }
    return 'linear-gradient(135deg, #09725c 0%, #ff914d 100%)'
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
        font_size: 7.2, // Taille réduite de 10x
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

  // Mettre à jour l'alignement d'un texte
  const updateTextAlign = useCallback((textId: string, align: 'left' | 'center' | 'right') => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, textAlign: align }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  // Mettre à jour la taille d'un texte
  const updateTextSize = useCallback((textId: string, delta: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, style: { ...text.style, font_size: Math.max(12, Math.min(200, text.style.font_size + delta)) } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  // Centrer horizontalement
  const centerHorizontally = useCallback((textId: string) => {
    updateTextPosition(textId, 540, textOverlays.find(t => t.id === textId)?.position.y || 960)
  }, [updateTextPosition, textOverlays])

  // Centrer verticalement
  const centerVertically = useCallback((textId: string) => {
    updateTextPosition(textId, textOverlays.find(t => t.id === textId)?.position.x || 540, 960)
  }, [updateTextPosition, textOverlays])

  return (
    <div className="space-y-4">
      {/* Preview Video - Taille normale mais coordonnées 1080x1920 */}
      <div className="flex justify-center">
        <div 
          className="relative border-2 border-gray-400 rounded-lg overflow-hidden"
          style={{
            width: '270px', // Taille d'affichage normale
            height: '480px', // Taille d'affichage normale (ratio 9:16)
            backgroundImage: backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1f2937'
          }}
            onDoubleClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const displayX = e.clientX - rect.left  // 0-270
              const displayY = e.clientY - rect.top   // 0-480
              // Conversion vers 1080x1920 (x4)
              const videoX = displayX * 4
              const videoY = displayY * 4
              createNewText(videoX, videoY)
            }}
          >
            {/* Guides de centrage */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-300 opacity-30 pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-300 opacity-30 pointer-events-none" />
            
            {/* Textes visibles */}
            {visibleTexts.map((text) => (
              <div
                key={text.id}
                className={`absolute cursor-move select-none ${
                  selectedTextId === text.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: `${text.position.x / 4}px`, // Affichage divisé par 4
                  top: `${text.position.y / 4}px`,   // Affichage divisé par 4
                  fontFamily: text.style.font_family,
                  fontSize: `${text.style.font_size / 4}px`, // Affichage divisé par 4
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
                  
                  // Position initiale en coordonnées display (270x480)
                  const startDisplayX = e.clientX - rect.left
                  const startDisplayY = e.clientY - rect.top
                  const initialVideoX = text.position.x
                  const initialVideoY = text.position.y
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    // Déplacement en coordonnées display
                    const deltaDisplayX = (moveEvent.clientX - rect.left) - startDisplayX
                    const deltaDisplayY = (moveEvent.clientY - rect.top) - startDisplayY
                    
                    // Conversion vers coordonnées vidéo (x4)
                    const newVideoX = Math.max(0, Math.min(1080, initialVideoX + (deltaDisplayX * 4)))
                    const newVideoY = Math.max(0, Math.min(1920, initialVideoY + (deltaDisplayY * 4)))
                    
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
            ))}
            
            {/* Empty state */}
            {textOverlays.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-white/70">
                  <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg">Double-click to add text</p>
                  <p className="text-sm opacity-75">Exact 1080x1920 dimensions</p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Controls pour texte sélectionné */}
      {selectedTextId && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-white border rounded-lg p-2 shadow-lg">
            {/* Alignement */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextAlign(selectedTextId, 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextAlign(selectedTextId, 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextAlign(selectedTextId, 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Centrage */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => centerHorizontally(selectedTextId)}
                title="Centrer horizontalement"
              >
                <div className="w-4 h-4 border-t border-b border-gray-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => centerVertically(selectedTextId)}
                title="Centrer verticalement"
              >
                <div className="w-4 h-4 border-l border-r border-gray-400" />
              </Button>
            </div>
            
            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Taille */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextSize(selectedTextId, -8)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextSize(selectedTextId, 8)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Supprimer */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteText(selectedTextId)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contrôles vidéo */}
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