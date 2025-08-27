'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Type, Trash2, AlignLeft, AlignCenter, AlignRight, Plus, Minus, Copy, Move, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
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

interface CanvasVideoEditorProProps {
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

export function CanvasVideoEditorPro({
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
}: CanvasVideoEditorProProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [backgroundImages, setBackgroundImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalTextProps, setOriginalTextProps] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorStyle, setCursorStyle] = useState('default')

  // Dimensions du canvas (taille d'affichage)
  const CANVAS_WIDTH = 270
  const CANVAS_HEIGHT = 480

  // Obtenir l'image de fond correspondant au temps actuel
  const getCurrentBackgroundImage = useCallback((time: number): HTMLImageElement | null => {
    for (const slot of videoSlots) {
      if (time >= slot.start_time && time < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          return backgroundImages.get(slot.assignedVideo.thumbnail_url) || null
        }
      }
    }
    return null
  }, [videoSlots, backgroundImages])

  // Obtenir les textes visibles au temps actuel
  const getVisibleTexts = useCallback((time: number) => {
    return textOverlays.filter(text => 
      time >= text.start_time && time <= text.end_time
    )
  }, [textOverlays])

  // Charger toutes les images de fond des slots vidéo
  useEffect(() => {
    const loadImages = async () => {
      const newImages = new Map<string, HTMLImageElement>()
      
      for (const slot of videoSlots) {
        if (slot.assignedVideo?.thumbnail_url) {
          const url = slot.assignedVideo.thumbnail_url
          if (!backgroundImages.has(url)) {
            try {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = url
              })
              newImages.set(url, img)
            } catch (error) {
              console.warn(`Failed to load image: ${url}`)
            }
          }
        }
      }

      if (newImages.size > 0) {
        setBackgroundImages(prev => new Map([...prev, ...newImages]))
      }
    }

    loadImages()
  }, [videoSlots, backgroundImages])

  // Rendu du canvas (comme CapCut avec images des vidéos)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Background avec image de la timeline ou gradient
    const backgroundImage = getCurrentBackgroundImage(currentTime)
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } else {
      // Gradient de fallback seulement si pas d'image
      const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      gradient.addColorStop(0, '#115446')
      gradient.addColorStop(1, '#ff914d')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Guides de centrage (subtils)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    
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

    // Rendu des textes avec coordonnées normalisées
    const visibleTexts = getVisibleTexts(currentTime)
    visibleTexts.forEach(text => {
      // Conversion pourcentages → pixels canvas
      const x = (text.position.x / 100) * CANVAS_WIDTH
      const y = (text.position.y / 100) * CANVAS_HEIGHT
      const fontSize = (text.style.font_size / 100) * CANVAS_HEIGHT

      ctx.save()

      // Style du texte
      const fontWeight = text.style.bold ? 'bold' : 'normal'
      const fontStyle = text.style.italic ? 'italic' : 'normal'
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${text.style.font_family}`
      ctx.fillStyle = text.style.color
      ctx.globalAlpha = text.style.opacity
      
      // Alignement du texte
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
        const bgX = text.textAlign === 'center' ? x - metrics.width / 2 - padding :
                   text.textAlign === 'right' ? x - metrics.width - padding : x - padding
        ctx.fillRect(bgX, y - fontSize / 2 - padding, metrics.width + padding * 2, fontSize + padding * 2)
        ctx.fillStyle = text.style.color
      }

      // Texte principal
      ctx.fillText(text.content, x, y)

      // Sélection avec poignées de redimensionnement
      if (selectedTextId === text.id) {
        const metrics = ctx.measureText(text.content)
        const padding = 8
        
        // Calcul des dimensions de la sélection
        const selectionX = text.textAlign === 'center' ? x - metrics.width / 2 - padding :
                          text.textAlign === 'right' ? x - metrics.width - padding : x - padding
        const selectionY = y - fontSize / 2 - padding
        const selectionW = metrics.width + padding * 2
        const selectionH = fontSize + padding * 2

        // Rectangle de sélection
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        ctx.strokeRect(selectionX, selectionY, selectionW, selectionH)

        // Poignées de redimensionnement (coins)
        const handleSize = 8
        ctx.fillStyle = '#3b82f6'
        
        // Coin haut-gauche
        ctx.fillRect(selectionX - handleSize/2, selectionY - handleSize/2, handleSize, handleSize)
        // Coin haut-droite  
        ctx.fillRect(selectionX + selectionW - handleSize/2, selectionY - handleSize/2, handleSize, handleSize)
        // Coin bas-gauche
        ctx.fillRect(selectionX - handleSize/2, selectionY + selectionH - handleSize/2, handleSize, handleSize)
        // Coin bas-droite
        ctx.fillRect(selectionX + selectionW - handleSize/2, selectionY + selectionH - handleSize/2, handleSize, handleSize)
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
      ctx.fillText('Pro Canvas Editor - Like CapCut', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    }
  }, [backgroundImages, currentTime, getCurrentBackgroundImage, getVisibleTexts, selectedTextId, textOverlays.length])

  // Rendu à chaque changement
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Détection du type de clic et curseur approprié
  const getClickType = useCallback((x: number, y: number, text: TextOverlay) => {
    const canvas = canvasRef.current
    if (!canvas) return { type: 'background', cursor: 'default' }

    const ctx = canvas.getContext('2d')
    if (!ctx) return { type: 'background', cursor: 'default' }

    const textX = (text.position.x / 100) * CANVAS_WIDTH
    const textY = (text.position.y / 100) * CANVAS_HEIGHT
    const fontSize = (text.style.font_size / 100) * CANVAS_HEIGHT

    // Mesurer le texte pour les dimensions
    const fontWeight = text.style.bold ? 'bold' : 'normal'
    const fontStyle = text.style.italic ? 'italic' : 'normal'
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${text.style.font_family}`
    const metrics = ctx.measureText(text.content)
    
    const padding = 8
    const selectionX = text.textAlign === 'center' ? textX - metrics.width / 2 - padding :
                     text.textAlign === 'right' ? textX - metrics.width - padding : textX - padding
    const selectionY = textY - fontSize / 2 - padding
    const selectionW = metrics.width + padding * 2
    const selectionH = fontSize + padding * 2

    // Vérifier les poignées de redimensionnement avec curseurs appropriés
    const handleSize = 12
    const handles = [
      { name: 'nw', x: selectionX, y: selectionY, cursor: 'nw-resize' },
      { name: 'ne', x: selectionX + selectionW, y: selectionY, cursor: 'ne-resize' },
      { name: 'sw', x: selectionX, y: selectionY + selectionH, cursor: 'sw-resize' },
      { name: 'se', x: selectionX + selectionW, y: selectionY + selectionH, cursor: 'se-resize' }
    ]

    for (const handle of handles) {
      if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
        return { type: 'resize', handle: handle.name, cursor: handle.cursor }
      }
    }

    // Vérifier si clic sur le texte
    if (x >= selectionX && x <= selectionX + selectionW && 
        y >= selectionY && y <= selectionY + selectionH) {
      return { type: 'text', cursor: 'move' }
    }

    return { type: 'background', cursor: 'crosshair' }
  }, [])

  // Gestion des clics avec détection précise
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Vérifier les textes visibles
    const visibleTexts = getVisibleTexts(currentTime)
    let clickedText = null
    let clickType = { type: 'background' }

    for (const text of visibleTexts) {
      clickType = getClickType(x, y, text)
      if (clickType.type !== 'background') {
        clickedText = text
        break
      }
    }

    if (clickedText) {
      setSelectedTextId(clickedText.id)
      
      if (clickType.type === 'resize') {
        setIsResizing(true)
        setResizeHandle(clickType.handle || '')
        setDragStart({ x, y })
        setOriginalTextProps({
          fontSize: clickedText.style.font_size,
          position: { ...clickedText.position }
        })
      } else if (clickType.type === 'text') {
        setIsDragging(true)
        setDragStart({ x, y })
        setOriginalTextProps({
          position: { ...clickedText.position }
        })
      }
    } else if (e.detail === 2) { // Double-clic
      const normalizedX = (x / CANVAS_WIDTH) * 100
      const normalizedY = (y / CANVAS_HEIGHT) * 100
      createNewText(normalizedX, normalizedY)
    } else {
      setSelectedTextId(null)
    }
  }, [currentTime, getVisibleTexts, getClickType, setSelectedTextId])

  // Créer un nouveau texte
  const createNewText = useCallback((x: number, y: number) => {
    const newText: TextOverlay = {
      id: Date.now().toString(),
      content: 'New Text',
      start_time: currentTime,
      end_time: Math.min(currentTime + 3, totalDuration),
      position: { 
        x: Math.max(5, Math.min(95, x)), // Margins 5%
        y: Math.max(5, Math.min(95, y)), 
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

  // Gestion du mouvement de souris
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || (!isDragging && !isResizing) || !selectedTextId) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y

    if (isDragging && originalTextProps) {
      // Déplacer le texte
      const deltaXPercent = (deltaX / CANVAS_WIDTH) * 100
      const deltaYPercent = (deltaY / CANVAS_HEIGHT) * 100

      const newX = Math.max(5, Math.min(95, originalTextProps.position.x + deltaXPercent))
      const newY = Math.max(5, Math.min(95, originalTextProps.position.y + deltaYPercent))

      updateTextPosition(selectedTextId, newX, newY)
    } else if (isResizing && originalTextProps) {
      // Redimensionner le texte
      const scaleFactor = Math.max(0.5, Math.min(3, 1 + (deltaX + deltaY) / 200))
      const newFontSize = Math.max(2, Math.min(20, originalTextProps.fontSize * scaleFactor))
      
      updateTextSize(selectedTextId, newFontSize - originalTextProps.fontSize)
    }
  }, [isDragging, isResizing, dragStart, selectedTextId, originalTextProps])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
    setOriginalTextProps(null)
  }, [])

  // Attacher les événements de souris
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTextId) return

      const step = e.shiftKey ? 5 : 1 // Shift pour déplacement plus rapide
      const selectedText = textOverlays.find(t => t.id === selectedTextId)
      if (!selectedText) return

      let newX = selectedText.position.x
      let newY = selectedText.position.y

      switch (e.key) {
        case 'ArrowLeft':
          newX = Math.max(5, newX - step)
          e.preventDefault()
          break
        case 'ArrowRight':
          newX = Math.min(95, newX + step)
          e.preventDefault()
          break
        case 'ArrowUp':
          newY = Math.max(5, newY - step)
          e.preventDefault()
          break
        case 'ArrowDown':
          newY = Math.min(95, newY + step)
          e.preventDefault()
          break
        case 'Delete':
        case 'Backspace':
          deleteText(selectedTextId)
          e.preventDefault()
          break
        case 'Escape':
          setSelectedTextId(null)
          e.preventDefault()
          break
      }

      if (newX !== selectedText.position.x || newY !== selectedText.position.y) {
        updateTextPosition(selectedTextId, newX, newY)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTextId, textOverlays, setSelectedTextId])

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

  const duplicateText = useCallback((textId: string) => {
    const originalText = textOverlays.find(t => t.id === textId)
    if (!originalText) return

    const duplicatedText: TextOverlay = {
      ...originalText,
      id: Date.now().toString(),
      content: originalText.content + ' Copy',
      position: {
        ...originalText.position,
        x: Math.min(90, originalText.position.x + 5),
        y: Math.min(90, originalText.position.y + 5)
      }
    }

    setTextOverlays([...textOverlays, duplicatedText])
    setSelectedTextId(duplicatedText.id)
  }, [textOverlays, setTextOverlays, setSelectedTextId])

  const centerHorizontally = useCallback((textId: string) => {
    const text = textOverlays.find(t => t.id === textId)
    if (text) updateTextPosition(textId, 50, text.position.y)
  }, [updateTextPosition, textOverlays])

  const centerVertically = useCallback((textId: string) => {
    const text = textOverlays.find(t => t.id === textId)
    if (text) updateTextPosition(textId, text.position.x, 50)
  }, [updateTextPosition, textOverlays])

  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(text => text.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  return (
    <div className="space-y-4">
      {/* Canvas Preview Pro - Like CapCut */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-400 rounded-lg cursor-crosshair shadow-lg"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Pro Controls pour texte sélectionné */}
      {selectedTextId && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-white border rounded-lg p-3 shadow-lg">
            {/* Alignement du texte */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                size="sm"
                variant={textOverlays.find(t => t.id === selectedTextId)?.textAlign === 'left' ? 'default' : 'ghost'}
                onClick={() => updateTextAlign(selectedTextId, 'left')}
                title="Aligner à gauche"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={textOverlays.find(t => t.id === selectedTextId)?.textAlign === 'center' ? 'default' : 'ghost'}
                onClick={() => updateTextAlign(selectedTextId, 'center')}
                title="Centrer"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={textOverlays.find(t => t.id === selectedTextId)?.textAlign === 'right' ? 'default' : 'ghost'}
                onClick={() => updateTextAlign(selectedTextId, 'right')}
                title="Aligner à droite"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Centrage automatique */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => centerHorizontally(selectedTextId)}
                title="Centrer horizontalement"
              >
                <Move className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => centerVertically(selectedTextId)}
                title="Centrer verticalement"
              >
                <Move className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Taille */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextSize(selectedTextId, -1)}
                title="Réduire"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTextSize(selectedTextId, 1)}
                title="Agrandir"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => duplicateText(selectedTextId)}
                title="Dupliquer"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteText(selectedTextId)}
                className="text-red-600 hover:text-red-800"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        <p>
          <strong>Double-clic:</strong> Nouveau texte • <strong>Clic + Glisser:</strong> Déplacer • <strong>Coins:</strong> Redimensionner
        </p>
        <p>
          <strong>Flèches:</strong> Déplacer (Shift = rapide) • <strong>Suppr:</strong> Effacer • <strong>Échap:</strong> Désélectionner
        </p>
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