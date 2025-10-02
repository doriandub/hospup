'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { TextOverlay } from '@/types/text-overlay'

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

interface CanvasVideoEditorMasterclassProps {
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

export function CanvasVideoEditorMasterclass({
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
}: CanvasVideoEditorMasterclassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [backgroundImages, setBackgroundImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalText, setOriginalText] = useState<TextOverlay | null>(null)
  const [canvasCursor, setCanvasCursor] = useState('crosshair')

  const CANVAS_WIDTH = 270
  const CANVAS_HEIGHT = 480
  const SNAP_THRESHOLD = 5 // Pixels pour l'alignement automatique

  // Charger les images des vidéos avec force re-render
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
                img.onload = () => {
                  console.log(`✅ Image chargée: ${url}`)
                  resolve(img)
                }
                img.onerror = (err) => {
                  console.warn(`⚠️ Image non disponible: ${url.split('?')[0]}`)
                  reject(err)
                }
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
        console.log(`🖼️ Chargé ${newImages.size} nouvelles images`)
        setBackgroundImages(prev => new Map([...prev, ...newImages]))
      }
    }

    loadImages()
  }, [videoSlots])

  // Obtenir l'image de fond actuelle avec débug
  const getCurrentBackgroundImage = useCallback(() => {
    console.log(`🕰️ Temps actuel: ${currentTime}s`)
    
    for (const slot of videoSlots) {
      console.log(`📺 Slot ${slot.order}: ${slot.start_time}s - ${slot.end_time}s, Video: ${slot.assignedVideo?.title}`)
      
      if (currentTime >= slot.start_time && currentTime < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          const image = backgroundImages.get(slot.assignedVideo.thumbnail_url)
          console.log(`✅ Image trouvée pour ${slot.assignedVideo.thumbnail_url}:`, image ? 'OUI' : 'NON')
          return image || null
        } else {
          console.log(`❌ Pas de thumbnail pour le slot ${slot.order}`)
        }
      }
    }
    
    console.log(`❌ Aucune image trouvée pour le temps ${currentTime}s`)
    return null
  }, [videoSlots, currentTime, backgroundImages])

  // Obtenir les textes visibles
  const getVisibleTexts = useCallback(() => {
    return textOverlays.filter(text => 
      currentTime >= text.start_time && currentTime <= text.end_time
    )
  }, [textOverlays, currentTime])

  // Calculer les dimensions de sélection d'un texte
  const getTextBounds = useCallback((text: TextOverlay) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const x = (text.position.x / 100) * CANVAS_WIDTH
    const y = (text.position.y / 100) * CANVAS_HEIGHT
    const fontSize = text.style.font_size * (CANVAS_HEIGHT / 1920)

    const fontWeight = text.style.bold ? 'bold' : 'normal'
    const fontStyle = text.style.italic ? 'italic' : 'normal'
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${text.style.font_family}`
    const metrics = ctx.measureText(text.content)

    const padding = 8
    let boundX = x - padding
    let boundW = metrics.width + padding * 2

    // Ajuster selon l'alignement
    if (text.textAlign === 'center') {
      boundX = x - boundW / 2
    } else if (text.textAlign === 'right') {
      boundX = x - boundW + padding
    }

    const boundY = y - fontSize / 2 - padding
    const boundH = fontSize + padding * 2

    return { 
      x: boundX, 
      y: boundY, 
      width: boundW, 
      height: boundH,
      centerX: x,
      centerY: y
    }
  }, [])

  // Appliquer l'alignement magnétique amélioré
  const applySnapping = useCallback((newX: number, newY: number) => {
    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2
    
    let snappedX = newX
    let snappedY = newY
    let isSnapped = false

    // Alignement horizontal au centre (zone plus large pour faciliter l'accroche)
    if (Math.abs((newX / 100) * CANVAS_WIDTH - centerX) < SNAP_THRESHOLD * 2) {
      snappedX = 50 // Centre en pourcentage
      isSnapped = true
    }

    // Alignement vertical au centre (zone plus large pour faciliter l'accroche)
    if (Math.abs((newY / 100) * CANVAS_HEIGHT - centerY) < SNAP_THRESHOLD * 2) {
      snappedY = 50 // Centre en pourcentage
      isSnapped = true
    }

    return { x: snappedX, y: snappedY, snapped: isSnapped }
  }, [])

  // Rendu du canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Background: Image de la timeline ou fallback noir
    const backgroundImage = getCurrentBackgroundImage()
    if (backgroundImage) {
      // S'assurer que l'image est complètement chargée avant de l'afficher
      if (backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
        ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      } else {
        // Image en cours de chargement - fond temporaire
        ctx.fillStyle = '#2d3748'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Chargement image...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      }
    } else {
      // Pas d'image - fond sombre par défaut
      ctx.fillStyle = '#2d3748'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Aucune image de timeline', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

    // Guides de centrage (lignes très subtiles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    
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

    // Rendu des textes
    const visibleTexts = getVisibleTexts()
    visibleTexts.forEach(text => {
      const x = (text.position.x / 100) * CANVAS_WIDTH
      const y = (text.position.y / 100) * CANVAS_HEIGHT
      const fontSize = text.style.font_size * (CANVAS_HEIGHT / 1920)

      ctx.save()

      // Style du texte
      const fontWeight = text.style.bold ? 'bold' : 'normal'
      const fontStyle = text.style.italic ? 'italic' : 'normal'
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${text.style.font_family}`
      ctx.fillStyle = text.style.color
      ctx.globalAlpha = text.style.opacity

      // Alignement
      ctx.textAlign = text.textAlign === 'left' ? 'start' : 
                     text.textAlign === 'right' ? 'end' : 'center'
      ctx.textBaseline = 'middle'

      // Effets
      if (text.style.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }

      if (text.style.outline) {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.strokeText(text.content, x, y)
      }

      if (text.style.background) {
        const metrics = ctx.measureText(text.content)
        const padding = 8
        let bgX = x - padding
        if (text.textAlign === 'center') bgX = x - metrics.width / 2 - padding
        else if (text.textAlign === 'right') bgX = x - metrics.width - padding
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(bgX, y - fontSize / 2 - padding, metrics.width + padding * 2, fontSize + padding * 2)
        ctx.fillStyle = text.style.color
      }

      ctx.fillText(text.content, x, y)

      // Sélection avec poignées
      if (selectedTextId === text.id) {
        const bounds = getTextBounds(text)
        if (bounds) {
          // Rectangle de sélection
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.setLineDash([])
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

          // Poignées de redimensionnement
          const handleSize = 8
          ctx.fillStyle = '#3b82f6'
          
          // 4 coins
          ctx.fillRect(bounds.x - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize)
          ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize)
          ctx.fillRect(bounds.x - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize)
          ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize)
        }
      }

      ctx.restore()
    })

    // État vide
    if (visibleTexts.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Double-clic pour ajouter du texte', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }
  }, [getCurrentBackgroundImage, getVisibleTexts, selectedTextId, getTextBounds])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Re-rendu quand les images se chargent
  useEffect(() => {
    if (backgroundImages.size > 0) {
      renderCanvas()
    }
  }, [backgroundImages, renderCanvas])

  // Gestion des événements souris
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Ne pas changer le curseur pendant le drag/resize
    if (isDragging || isResizing) return

    // Par défaut, curseur normal
    let cursor = 'default'
    const visibleTexts = getVisibleTexts()
    
    for (const text of visibleTexts) {
      if (selectedTextId === text.id) {
        const bounds = getTextBounds(text)
        if (!bounds) continue

        const handleSize = 12
        
        // Vérifier les poignées de redimensionnement
        if (Math.abs(x - bounds.x) < handleSize && Math.abs(y - bounds.y) < handleSize) {
          cursor = 'nw-resize'
        } else if (Math.abs(x - (bounds.x + bounds.width)) < handleSize && Math.abs(y - bounds.y) < handleSize) {
          cursor = 'ne-resize'
        } else if (Math.abs(x - bounds.x) < handleSize && Math.abs(y - (bounds.y + bounds.height)) < handleSize) {
          cursor = 'sw-resize'
        } else if (Math.abs(x - (bounds.x + bounds.width)) < handleSize && Math.abs(y - (bounds.y + bounds.height)) < handleSize) {
          cursor = 'se-resize'
        } else if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
          cursor = 'move'
        }
        break
      } else {
        // Texte non sélectionné
        const bounds = getTextBounds(text)
        if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
          cursor = 'pointer'
          break
        }
      }
    }

    setCanvasCursor(cursor)
  }, [isDragging, isResizing, getVisibleTexts, selectedTextId, getTextBounds])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const visibleTexts = getVisibleTexts()
    
    for (const text of visibleTexts) {
      const bounds = getTextBounds(text)
      if (!bounds) continue

      const handleSize = 12
      
      // Vérifier les poignées de redimensionnement FIRST (zones plus petites pour éviter déclenchement accidentel)
      if (selectedTextId === text.id) {
        const smallerHandleSize = 8 // Plus petit pour éviter les clics accidentels
        if ((Math.abs(x - bounds.x) < smallerHandleSize && Math.abs(y - bounds.y) < smallerHandleSize) ||
            (Math.abs(x - (bounds.x + bounds.width)) < smallerHandleSize && Math.abs(y - bounds.y) < smallerHandleSize) ||
            (Math.abs(x - bounds.x) < smallerHandleSize && Math.abs(y - (bounds.y + bounds.height)) < smallerHandleSize) ||
            (Math.abs(x - (bounds.x + bounds.width)) < smallerHandleSize && Math.abs(y - (bounds.y + bounds.height)) < smallerHandleSize)) {
          
          setIsResizing(true)
          setDragStart({ x, y })
          setOriginalText({ ...text })
          e.preventDefault()
          return
        }
      }

      // Vérifier le clic sur le texte pour drag
      if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
        setSelectedTextId(text.id)
        setIsDragging(true)
        setDragStart({ x, y })
        setOriginalText({ ...text })
        e.preventDefault()
        return
      }
    }

    // Aucun texte cliqué - désélectionner
    setSelectedTextId(null)
  }, [getVisibleTexts, selectedTextId, getTextBounds, setSelectedTextId])


  const handleMouseMoveGlobal = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || !originalText) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      // Déplacement fluide
      const deltaX = ((x - dragStart.x) / CANVAS_WIDTH) * 100
      const deltaY = ((y - dragStart.y) / CANVAS_HEIGHT) * 100

      let newX = Math.max(5, Math.min(95, originalText.position.x + deltaX))
      let newY = Math.max(5, Math.min(95, originalText.position.y + deltaY))

      // Alignement magnétique
      const snapped = applySnapping(newX, newY)
      
      setTextOverlays(textOverlays.map(text => 
        text.id === selectedTextId 
          ? { ...text, position: { ...text.position, x: snapped.x, y: snapped.y } }
          : text
      ))
    } else if (isResizing) {
      // Redimensionnement fluide MOINS SENSIBLE
      const deltaX = x - dragStart.x
      const deltaY = y - dragStart.y
      const deltaDistance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
      
      // Seuil minimum pour éviter les micro-mouvements
      if (deltaDistance < 5) return
      
      const direction = (deltaX + deltaY) > 0 ? 1 : -1
      const scaleFactor = 1 + (direction * deltaDistance / 400) // MOINS sensible (400 au lieu de 200)
      const newFontSize = Math.max(20, Math.min(200, originalText.style.font_size * scaleFactor)) // Range simple 20-200px

      setTextOverlays(textOverlays.map(text => 
        text.id === selectedTextId 
          ? { ...text, style: { ...text.style, font_size: newFontSize } }
          : text
      ))
    }
  }, [isDragging, isResizing, dragStart, originalText, selectedTextId, textOverlays, setTextOverlays, applySnapping])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setOriginalText(null)
    setCanvasCursor('default') // Forcer le curseur par défaut
  }, [])

  // Système de drag SIMPLE et efficace
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMoveGlobal)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMoveGlobal, handleMouseUp])

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTextId) return

      // Ne pas intercepter les touches si l'utilisateur tape dans un input/textarea
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return // Laisser l'input gérer les touches normalement
      }

      const step = e.shiftKey ? 5 : 1
      const text = textOverlays.find(t => t.id === selectedTextId)
      if (!text) return

      let newX = text.position.x
      let newY = text.position.y

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
          // Nettoyage d'urgence en cas de bug de drag
          setIsDragging(false)
          setIsResizing(false)
          setOriginalText(null)
          setSelectedTextId(null)
          setCanvasCursor('default')
          e.preventDefault()
          break
      }

      if (newX !== text.position.x || newY !== text.position.y) {
        const snapped = applySnapping(newX, newY)
        setTextOverlays(textOverlays.map(t => 
          t.id === selectedTextId 
            ? { ...t, position: { ...t.position, x: snapped.x, y: snapped.y } }
            : t
        ))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTextId, textOverlays, setTextOverlays, applySnapping, setSelectedTextId])

  // Fonction d'alignement sur les cuts - TOUJOURS aligner sur le cut le plus proche
  const snapToNearestCut = useCallback((time: number): number => {
    // Créer une liste de tous les points de coupe (début et fin de slots)
    const cutPoints: number[] = [0, totalDuration] // Début et fin de la vidéo
    
    videoSlots.forEach(slot => {
      cutPoints.push(slot.start_time)
      cutPoints.push(slot.end_time)
    })
    
    // Supprimer les doublons et trier
    const uniqueCuts = [...new Set(cutPoints)].sort((a, b) => a - b)
    
    // TOUJOURS trouver le cut le plus proche (pas de tolérance)
    let nearestCut = uniqueCuts[0]
    let minDistance = Math.abs(time - uniqueCuts[0])
    
    for (const cut of uniqueCuts) {
      const distance = Math.abs(time - cut)
      if (distance < minDistance) {
        minDistance = distance
        nearestCut = cut
      }
    }
    
    return nearestCut
  }, [videoSlots, totalDuration])

  // Fonctions utilitaires  
  const createNewText = useCallback((x: number, y: number) => {
    // Aligner les temps sur les cuts les plus proches
    const snappedStartTime = snapToNearestCut(currentTime)
    const proposedEndTime = Math.min(currentTime + 3, totalDuration)
    const snappedEndTime = snapToNearestCut(proposedEndTime)
    
    const newText: TextOverlay = {
      id: Date.now().toString(),
      content: 'Nouveau texte',
      start_time: snappedStartTime,
      end_time: snappedEndTime,
      position: { 
        x: Math.max(5, Math.min(95, x)), 
        y: Math.max(5, Math.min(95, y)), 
        anchor: 'center' 
      },
      style: {
        font_family: 'Arial',
        font_size: 0.3, // Taille par défaut DRASTIQUEMENT réduite
        color: '#FFFFFF',
        bold: false,
        italic: false,
        shadow: true,
        outline: false,
        background: false,
        opacity: 1,
        text_align: 'center'
      },
      textAlign: 'center'
    }
    
    setTextOverlays([...textOverlays, newText])
    setSelectedTextId(newText.id)
  }, [currentTime, totalDuration, textOverlays, setTextOverlays, setSelectedTextId, snapToNearestCut])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Vérifier s'il y a un texte sous la souris
    const visibleTexts = getVisibleTexts()
    let clickedOnText = false
    
    for (const text of visibleTexts) {
      const bounds = getTextBounds(text)
      if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
        clickedOnText = true
        break
      }
    }
    
    // Si on n'a pas cliqué sur un texte existant, créer un nouveau texte
    if (!clickedOnText) {
      createNewText((x / CANVAS_WIDTH) * 100, (y / CANVAS_HEIGHT) * 100)
    }
    // Sinon, ne rien faire (garder le texte actuel sélectionné)
  }, [getVisibleTexts, currentTime, getTextBounds, createNewText])

  const duplicateText = useCallback(() => {
    if (!selectedTextId) return
    const original = textOverlays.find(t => t.id === selectedTextId)
    if (!original) return

    const duplicate: TextOverlay = {
      ...original,
      id: Date.now().toString(),
      content: original.content + ' Copy',
      position: {
        ...original.position,
        x: Math.min(1030, original.position.x + 50),
        y: Math.min(1870, original.position.y + 50)
      }
    }

    setTextOverlays([...textOverlays, duplicate])
    setSelectedTextId(duplicate.id)
  }, [selectedTextId, textOverlays, setTextOverlays, setSelectedTextId])

  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  return (
    <div className="space-y-4">
      {/* Canvas Masterclass */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-400 rounded-lg shadow-lg"
          style={{ cursor: canvasCursor }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
        />
      </div>



    </div>
  )
}