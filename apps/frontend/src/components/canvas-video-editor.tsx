'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Type, Trash2, AlignLeft, AlignCenter, AlignRight, Plus, Minus, Copy, Move, RotateCcw } from 'lucide-react'
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

// Coordonnées normalisées comme CapCut (0-100%)
interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { 
    x: number // Pourcentage 0-100
    y: number // Pourcentage 0-100
    anchor: string 
  }
  style: {
    font_family: string
    font_size: number // Pourcentage de la hauteur vidéo
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

interface CanvasVideoEditorProps {
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

export function CanvasVideoEditor({
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
}: CanvasVideoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Dimensions du canvas (taille d'affichage)
  const CANVAS_WIDTH = 270
  const CANVAS_HEIGHT = 480

  // Obtenir l'image de fond correspondant au temps actuel
  const getCurrentBackgroundImage = useCallback((time: number) => {
    for (const slot of videoSlots) {
      if (time >= slot.start_time && time < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          return slot.assignedVideo.thumbnail_url
        }
      }
    }
    return null
  }, [videoSlots])

  // Obtenir les textes visibles au temps actuel
  const getVisibleTexts = useCallback((time: number) => {
    return textOverlays.filter(text => 
      time >= text.start_time && time <= text.end_time
    )
  }, [textOverlays])

  // Charger l'image de fond
  useEffect(() => {
    const imageUrl = getCurrentBackgroundImage(currentTime)
    if (imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => setBackgroundImage(img)
      img.src = imageUrl
    } else {
      setBackgroundImage(null)
    }
  }, [currentTime, getCurrentBackgroundImage])

  // Rendu du canvas (comme CapCut)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } else {
      // Gradient de fallback
      const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      gradient.addColorStop(0, '#115446')
      gradient.addColorStop(1, '#ff914d')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Guides de centrage
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    // Ligne verticale centre
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    
    // Ligne horizontale centre
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT / 2)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Rendu des textes (coordonnées normalisées)
    const visibleTexts = getVisibleTexts(currentTime)
    visibleTexts.forEach(text => {
      // Conversion pourcentages → pixels canvas
      const x = (text.position.x / 100) * CANVAS_WIDTH
      const y = (text.position.y / 100) * CANVAS_HEIGHT
      const fontSize = (text.style.font_size / 100) * CANVAS_HEIGHT

      ctx.save()

      // Style du texte
      ctx.font = `${text.style.bold ? 'bold' : 'normal'} ${fontSize}px ${text.style.font_family}`
      ctx.fillStyle = text.style.color
      ctx.globalAlpha = text.style.opacity
      ctx.textAlign = text.textAlign === 'left' ? 'start' : 
                     text.textAlign === 'right' ? 'end' : 'center'
      ctx.textBaseline = text.position.anchor === 'center' ? 'middle' : 'top'

      // Shadow
      if (text.style.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }

      // Outline
      if (text.style.outline) {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.strokeText(text.content, x, y)
      }

      // Background
      if (text.style.background) {
        const metrics = ctx.measureText(text.content)
        const padding = 8
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(
          x - metrics.width / 2 - padding, 
          y - fontSize / 2 - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2
        )
        ctx.fillStyle = text.style.color
      }

      // Texte principal
      ctx.fillText(text.content, x, y)

      // Sélection
      if (selectedTextId === text.id) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        const metrics = ctx.measureText(text.content)
        const padding = 4
        ctx.strokeRect(
          x - metrics.width / 2 - padding,
          y - fontSize / 2 - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2
        )
      }

      ctx.restore()
    })

    // Empty state
    if (textOverlays.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Double-click to add text', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '12px Arial'
      ctx.fillText('Canvas-based like CapCut', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    }
  }, [backgroundImage, currentTime, getVisibleTexts, selectedTextId, textOverlays.length])

  // Rendu à chaque changement
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Gestion des clics
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Conversion pixels canvas → pourcentages normalisés
    const normalizedX = (x / CANVAS_WIDTH) * 100
    const normalizedY = (y / CANVAS_HEIGHT) * 100

    // Vérifier si on clique sur un texte existant
    const visibleTexts = getVisibleTexts(currentTime)
    let clickedText = null

    for (const text of visibleTexts) {
      const textX = (text.position.x / 100) * CANVAS_WIDTH
      const textY = (text.position.y / 100) * CANVAS_HEIGHT
      const fontSize = (text.style.font_size / 100) * CANVAS_HEIGHT
      
      // Zone de clic approximative
      if (Math.abs(x - textX) < 50 && Math.abs(y - textY) < fontSize) {
        clickedText = text
        break
      }
    }

    if (clickedText) {
      setSelectedTextId(clickedText.id)
    } else if (e.detail === 2) { // Double-clic
      createNewText(normalizedX, normalizedY)
    } else {
      setSelectedTextId(null)
    }
  }, [currentTime, getVisibleTexts, setSelectedTextId])

  // Créer un nouveau texte
  const createNewText = useCallback((x: number, y: number) => {
    const newText: TextOverlay = {
      id: Date.now().toString(),
      content: 'New Text',
      start_time: currentTime,
      end_time: Math.min(currentTime + 3, totalDuration),
      position: { 
        x: Math.max(0, Math.min(100, x)), // Pourcentages 0-100
        y: Math.max(0, Math.min(100, y)), 
        anchor: 'center' 
      },
      style: {
        font_family: 'Arial',
        font_size: 0.8, // Taille réduite de 10x
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

  // Fonctions de manipulation du texte
  const updateTextPosition = useCallback((textId: string, newX: number, newY: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, position: { ...text.position, x: newX, y: newY } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  const updateTextAlign = useCallback((textId: string, align: 'left' | 'center' | 'right') => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, textAlign: align }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  const updateTextSize = useCallback((textId: string, delta: number) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, style: { ...text.style, font_size: Math.max(2, Math.min(20, text.style.font_size + delta)) } }
        : text
    ))
  }, [textOverlays, setTextOverlays])

  const centerHorizontally = useCallback((textId: string) => {
    const text = textOverlays.find(t => t.id === textId)
    if (text) updateTextPosition(textId, 50, text.position.y) // 50% = centre
  }, [updateTextPosition, textOverlays])

  const centerVertically = useCallback((textId: string) => {
    const text = textOverlays.find(t => t.id === textId)
    if (text) updateTextPosition(textId, text.position.x, 50) // 50% = centre
  }, [updateTextPosition, textOverlays])

  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(text => text.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  return (
    <div className="space-y-4">
      {/* Canvas Preview - Comme CapCut */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-400 rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
      </div>


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