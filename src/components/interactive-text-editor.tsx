'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Trash2, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  textAlign?: 'left' | 'center' | 'right'
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
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  
  // États pour les guides de centrage et redimensionnement
  const [showCenterGuides, setShowCenterGuides] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [initialFontSize, setInitialFontSize] = useState(0)
  const [initialY, setInitialY] = useState(0)

  // CONSTANTES VIDÉO - EXACTEMENT COMME LE BACKEND
  const VIDEO_WIDTH = 1080   // Même que backend: video_width = 1080
  const VIDEO_HEIGHT = 1920  // Même que backend: video_height = 1920
  
  // ULTRA SIMPLE: text.position est déjà en pixels vidéo !
  const getTextPixels = useCallback((text: TextOverlay) => {
    // text.position.x = pixels vidéo (0-1080)
    // text.position.y = pixels vidéo (0-1920)
    const x_pixels = text.position.x  
    const y_pixels = text.position.y  
    
    console.log(`Direct pixels: "${text.content}" -> (${x_pixels}, ${y_pixels})`)
    
    return { x: x_pixels, y: y_pixels }
  }, [])
  
  // SYSTÈME D'AFFICHAGE UNIFIÉ - UTILISE LA ZONE D'INTERACTION COMME AFFICHAGE PRINCIPAL
  // Au lieu d'un Canvas séparé, on utilise des divs qui reproduisent exactement le système FFmpeg
  
  // CONVERSION: PIXELS VIDÉO -> PIXELS ÉDITEUR (pour les interactions seulement)
  const getEditorPosition = useCallback((text: TextOverlay) => {
    // 1. Obtenir les pixels finaux que FFmpeg utiliserait
    const { x: videoPixelX, y: videoPixelY } = getTextPixels(text)
    
    // 2. Mettre à l'échelle pour l'éditeur (ratio simple)
    const scaleX = editorWidth / VIDEO_WIDTH    // 270/1080 = 0.25
    const scaleY = editorHeight / VIDEO_HEIGHT  // 480/1920 = 0.25
    
    const editorX = videoPixelX * scaleX
    const editorY = videoPixelY * scaleY
    const editorFontSize = (text.style.font_size / VIDEO_WIDTH) * editorWidth
    
    return { editorX, editorY, editorFontSize }
  }, [editorWidth, editorHeight, getTextPixels])

  // CONVERSION: PIXELS ÉDITEUR -> PIXELS VIDÉO (simple échelle)
  const getVideoPixels = useCallback((editorX: number, editorY: number) => {
    // 1. Reconvertir pixels éditeur vers pixels vidéo (échelle simple)
    const scaleX = VIDEO_WIDTH / editorWidth   // 1080/270 = 4
    const scaleY = VIDEO_HEIGHT / editorHeight // 1920/480 = 4
    
    const videoPixelX = editorX * scaleX
    const videoPixelY = editorY * scaleY
    
    return { 
      x: Math.max(0, Math.min(VIDEO_WIDTH, videoPixelX)), 
      y: Math.max(0, Math.min(VIDEO_HEIGHT, videoPixelY)) 
    }
  }, [editorWidth, editorHeight])
  
  // DÉTECTION CENTRAGE - BASÉ SUR LE CENTRE DU TEXTE (pas le top-left corner)
  const isPerfectlycentered = useCallback((text: TextOverlay) => {
    const { x: videoPixelX, y: videoPixelY } = getTextPixels(text)
    
    // Calculer le centre du texte (pas le top-left corner)
    const estimatedTextWidth = text.content.length * (text.style.font_size * 0.6) // Estimation largeur
    const textCenterX = videoPixelX + (estimatedTextWidth / 2)
    const textCenterY = videoPixelY + (text.style.font_size / 2)
    
    // Centre vidéo: 1080/2 = 540px, 1920/2 = 960px
    const centerX = VIDEO_WIDTH / 2  // 540px
    const centerY = VIDEO_HEIGHT / 2 // 960px
    
    const tolerance = 15 // Tolérance augmentée pour le centre du texte
    
    return Math.abs(textCenterX - centerX) <= tolerance && Math.abs(textCenterY - centerY) <= tolerance
  }, [getTextPixels])
  
  // SNAP AU CENTRE - BASÉ SUR LE CENTRE DU TEXTE
  const snapToCenter = useCallback((text: TextOverlay, newX: number, newY: number) => {
    // Calculer le centre du texte avec les nouvelles coordonnées
    const estimatedTextWidth = text.content.length * (text.style.font_size * 0.6)
    const textCenterX = newX + (estimatedTextWidth / 2)
    const textCenterY = newY + (text.style.font_size / 2)
    
    // Centre vidéo
    const centerX = VIDEO_WIDTH / 2   // 540px
    const centerY = VIDEO_HEIGHT / 2  // 960px
    
    const snapZone = 40 // Zone d'attraction
    
    let snappedX = newX
    let snappedY = newY
    
    // Snap horizontal au centre
    if (Math.abs(textCenterX - centerX) <= snapZone) {
      snappedX = centerX - (estimatedTextWidth / 2)
    }
    
    // Snap vertical au centre
    if (Math.abs(textCenterY - centerY) <= snapZone) {
      snappedY = centerY - (text.style.font_size / 2)
    }
    
    return { 
      x: Math.max(0, Math.min(VIDEO_WIDTH, snappedX)), 
      y: Math.max(0, Math.min(VIDEO_HEIGHT, snappedY)) 
    }
  }, [])

  // Gérer le début du drag
  const handleMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    if (isEditing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const text = textOverlays.find(t => t.id === textId)
    if (!text) return

    const { editorX, editorY } = getEditorPosition(text)
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const offsetX = e.clientX - containerRect.left - editorX
    const offsetY = e.clientY - containerRect.top - editorY
    
    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
    setSelectedTextId(textId)
    setDragPosition({ x: text.position.x, y: text.position.y })
  }, [textOverlays, getEditorPosition, isEditing, setSelectedTextId])

  // Gérer le drag et resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    
    if (isDragging && selectedTextId) {
      const newEditorX = e.clientX - containerRect.left - dragOffset.x
      const newEditorY = e.clientY - containerRect.top - dragOffset.y
      
      const { x, y } = getVideoPixels(newEditorX, newEditorY)
      const currentText = textOverlays.find(t => t.id === selectedTextId)
      if (!currentText) return
      
      const snappedPosition = snapToCenter(currentText, x, y)
      
      // Mettre à jour le texte avec la nouvelle position
      const updatedText = { ...currentText, position: { ...currentText.position, x: snappedPosition.x, y: snappedPosition.y } }
      
      // Vérifier si on doit afficher les guides (basé sur le centre de la boîte)
      const shouldShowGuides = isPerfectlycentered(updatedText)
      setShowCenterGuides(shouldShowGuides)
      setDragPosition(snappedPosition)
      
      setTextOverlays(textOverlays.map(text => 
        text.id === selectedTextId ? updatedText : text
      ))
    }
    
    if (isResizing && selectedTextId) {
      const currentY = e.clientY - containerRect.top
      const deltaY = currentY - initialY // NORMAL: bas = plus gros, haut = plus petit
      const scaleFactor = 1 + (deltaY / 100) // 100px = 100% de changement
      const newFontSize = Math.max(20, Math.min(200, initialFontSize * scaleFactor))
      
      setTextOverlays(textOverlays.map(text => 
        text.id === selectedTextId 
          ? { ...text, style: { ...text.style, font_size: newFontSize } }
          : text
      ))
    }
  }, [isDragging, isResizing, selectedTextId, dragOffset, textOverlays, setTextOverlays, getVideoPixels, snapToCenter, isPerfectlycentered, initialFontSize, initialY])

  // Gérer la fin du drag et resize
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setShowCenterGuides(false)
  }, [])
  
  // Commencer le redimensionnement
  const handleResizeStart = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const text = textOverlays.find(t => t.id === textId)
    if (!text) return
    
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    
    setIsResizing(true)
    setSelectedTextId(textId)
    setInitialFontSize(text.style.font_size)
    setInitialY(e.clientY - containerRect.top)
  }, [textOverlays, setSelectedTextId])

  // Gestionnaire d'événements clavier pour ajuster la position
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedTextId) return
    
    const selectedText = textOverlays.find(t => t.id === selectedTextId)
    if (!selectedText) return
    
    // Empêcher le comportement par défaut pour les flèches
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      
      // Ajustement par pixels directs
      const pixelStep = e.shiftKey ? 10 : 1 // Shift = mouvement plus rapide
      
      let newX = selectedText.position.x
      let newY = selectedText.position.y
      
      switch (e.key) {
        case 'ArrowLeft':
          newX = Math.max(0, selectedText.position.x - pixelStep)
          break
        case 'ArrowRight':
          newX = Math.min(VIDEO_WIDTH, selectedText.position.x + pixelStep)
          break
        case 'ArrowUp':
          newY = Math.max(0, selectedText.position.y - pixelStep)
          break
        case 'ArrowDown':
          newY = Math.min(VIDEO_HEIGHT, selectedText.position.y + pixelStep)
          break
      }
      
      // Appliquer la nouvelle position avec snap
      const snappedPosition = snapToCenter(selectedText, newX, newY)
      const updatedText = { ...selectedText, position: { ...selectedText.position, x: snappedPosition.x, y: snappedPosition.y } }
      const shouldShowGuides = isPerfectlycentered(updatedText)
      setShowCenterGuides(shouldShowGuides)
      
      setTextOverlays(textOverlays.map(text => 
        text.id === selectedTextId ? updatedText : text
      ))
    }
  }, [selectedTextId, textOverlays, setTextOverlays, snapToCenter, isPerfectlycentered])
  
  // Attacher les événements globaux de souris et clavier
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])
  
  // Gestionnaire global pour les touches du clavier
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Double-clic pour éditer
  const handleDoubleClick = useCallback((textId: string) => {
    setIsEditing(textId)
    setSelectedTextId(textId)
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 0)
  }, [setSelectedTextId])

  // Sauvegarder l'édition
  const handleEditSave = useCallback((textId: string, newContent: string) => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, content: newContent }
        : text
    ))
    setIsEditing(null)
  }, [textOverlays, setTextOverlays])

  // Supprimer le texte
  const deleteText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(null)
    }
  }, [textOverlays, setTextOverlays, selectedTextId, setSelectedTextId])

  // Définir l'alignement du texte
  const setTextAlign = useCallback((textId: string, align: 'left' | 'center' | 'right') => {
    setTextOverlays(textOverlays.map(text => 
      text.id === textId 
        ? { ...text, textAlign: align }
        : text
    ))
  }, [textOverlays, setTextOverlays])
  
  // Centrer le texte parfaitement (centre DU TEXTE au centre de l'écran)
  const centerText = useCallback((textId: string) => {
    setTextOverlays(textOverlays.map(text => {
      if (text.id !== textId) return text
      
      // Calculer la position nécessaire pour que le CENTRE du texte soit au centre de l'écran
      const estimatedTextWidth = text.content.length * (text.style.font_size * 0.6)
      const centerX = VIDEO_WIDTH / 2   // 540px
      const centerY = VIDEO_HEIGHT / 2  // 960px
      
      // Position du top-left corner pour que le centre du texte soit au centre de l'écran
      const targetVideoPixelX = centerX - (estimatedTextWidth / 2)
      const targetVideoPixelY = centerY - (text.style.font_size / 2)
      
      return { 
        ...text, 
        position: { 
          ...text.position, 
          x: Math.max(0, Math.min(VIDEO_WIDTH, targetVideoPixelX)),
          y: Math.max(0, Math.min(VIDEO_HEIGHT, targetVideoPixelY))
        } 
      }
    }))
  }, [textOverlays, setTextOverlays])

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ zIndex: 5 }}
    >
      {/* Affichage des textes avec le système unifié FFmpeg */}
      
      {/* Guides de centrage parfait - basés sur le centre de la boîte de texte */}
      {showCenterGuides && selectedTextId && (
        <>
          {/* Guide horizontal au centre */}
          <div
            className="absolute w-full h-0.5 bg-blue-400/80 pointer-events-none shadow-sm"
            style={{
              top: `${editorHeight / 2}px`,
              left: 0,
              zIndex: 8
            }}
          />
          {/* Guide vertical au centre */}
          <div
            className="absolute h-full w-0.5 bg-blue-400/80 pointer-events-none shadow-sm"
            style={{
              left: `${Math.floor(editorWidth / 2)}px`,
              top: 0,
              zIndex: 8
            }}
          />
          {/* Point central pour feedback visuel */}
          <div
            className="absolute w-2 h-2 bg-blue-400 rounded-full pointer-events-none shadow-sm"
            style={{
              left: `${Math.floor(editorWidth / 2) - 1}px`,
              top: `${Math.floor(editorHeight / 2) - 1}px`,
              zIndex: 9
            }}
          />
        </>
      )}
      
      {/* Text overlays */}
      {textOverlays.map((text) => {
        const { editorX, editorY, editorFontSize } = getEditorPosition(text)
        const isSelected = selectedTextId === text.id
        const isEditingThis = isEditing === text.id
        const textWidth = Math.max(text.content.length * (editorFontSize * 0.6), 100)
        const textHeight = editorFontSize

        return (
          <div key={text.id}>
            {/* Élément texte */}
            {isEditingThis ? (
              <input
                ref={editInputRef}
                className="absolute bg-transparent text-white border border-blue-400 rounded px-1"
                style={{
                  left: `${editorX}px`,
                  top: `${editorY}px`,
                  fontFamily: 'Helvetica, Arial, sans-serif', // Match backend Helvetica font exactly
                  fontSize: `${Math.max(8, editorFontSize)}px`,
                  color: text.style.color,
                  fontWeight: text.style.bold ? 'bold' : 'normal',
                  fontStyle: text.style.italic ? 'italic' : 'normal',
                  lineHeight: '1', // Critical: Remove CSS line-height differences
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
              /* REPRODUCTION EXACTE DU SYSTÈME FFMPEG drawtext */
              <div
                className="absolute select-none cursor-move"
                style={{
                  // Position exacte comme FFmpeg : top-left corner du texte
                  left: `${editorX}px`,
                  top: `${editorY}px`,
                  // Pas de width/height contraignantes - laisser le texte se dimensionner naturellement
                  // Rendu visuel IDENTIQUE au système FFmpeg drawtext
                  fontFamily: 'Helvetica, Arial, sans-serif', // FFmpeg utilise Helvetica par défaut
                  fontSize: `${Math.max(8, editorFontSize)}px`,
                  color: text.style.color,
                  fontWeight: text.style.bold ? 'bold' : 'normal',
                  fontStyle: text.style.italic ? 'italic' : 'normal',
                  lineHeight: '1', // CRITIQUE : FFmpeg utilise line-height = 1
                  // Effets exactement comme FFmpeg
                  textShadow: text.style.shadow ? '2px 2px 0px rgba(0,0,0,0.8)' : 'none', // shadowx=2:shadowy=2
                  WebkitTextStroke: text.style.outline ? '2px black' : 'none', // borderw=2:bordercolor=black
                  backgroundColor: text.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                  padding: text.style.background ? '8px 16px' : '0',
                  borderRadius: text.style.background ? '4px' : '0',
                  opacity: text.style.opacity || 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  // Alignement du texte dans la zone
                  textAlign: (text.textAlign || 'left') as 'left' | 'center' | 'right',
                  // Interface d'édition - bordure transparente sauf si sélectionné  
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                  minWidth: `${Math.max(50, text.content.length * (editorFontSize * 0.6))}px`,
                  minHeight: `${editorFontSize}px`,
                  zIndex: 15,
                  // Positionnement direct comme FFmpeg mais avec largeur définie pour l'alignement
                  width: `${Math.max(50, text.content.length * (editorFontSize * 0.6))}px`,
                  height: `${editorFontSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: text.textAlign === 'center' ? 'center' : text.textAlign === 'right' ? 'flex-end' : 'flex-start'
                }}
                onMouseDown={(e) => handleMouseDown(e, text.id)}
                onDoubleClick={() => handleDoubleClick(text.id)}
                title={`Text: "${text.content}" - FFmpeg Position: ${editorX.toFixed(0)}px, ${editorY.toFixed(0)}px`}
              >
                {text.content}
              </div>
            )}

            {/* Boîte de sélection avec poignées de redimensionnement */}
            {isSelected && !isEditingThis && (
              <>
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/5 rounded pointer-events-none"
                  style={{
                    left: `${editorX - 2}px`,
                    top: `${editorY - 2}px`,
                    width: `${Math.max(50, text.content.length * (editorFontSize * 0.6)) + 4}px`,
                    height: `${editorFontSize + 4}px`,
                    zIndex: 12
                  }}
                />
                
                {/* Poignées de redimensionnement */}
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize shadow-sm hover:bg-blue-600 transition-colors"
                  style={{
                    left: `${editorX + Math.max(50, text.content.length * (editorFontSize * 0.6)) - 6}px`,
                    top: `${editorY - 6}px`,
                    zIndex: 14
                  }}
                  onMouseDown={(e) => handleResizeStart(e, text.id)}
                  title="Redimensionner (glisser vers le haut/bas)"
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize shadow-sm hover:bg-blue-600 transition-colors"
                  style={{
                    left: `${editorX + Math.max(50, text.content.length * (editorFontSize * 0.6)) - 6}px`,
                    top: `${editorY + editorFontSize - 1}px`,
                    zIndex: 14
                  }}
                  onMouseDown={(e) => handleResizeStart(e, text.id)}
                  title="Redimensionner (glisser vers le haut/bas)"
                />

                {/* Barre d'outils avec tous les contrôles */}
                <div
                  className="absolute flex items-center gap-1 bg-gray-900/95 backdrop-blur-sm rounded px-2 py-1 shadow-lg border border-gray-600"
                  style={{
                    left: `${Math.max(0, Math.min(editorWidth - 220, editorX - 50))}px`,
                    top: `${Math.max(10, editorY - 45)}px`,
                    zIndex: 15
                  }}
                >
                  {/* Alignement du texte dans la boîte */}
                  <div className="flex items-center gap-1 border-r border-gray-600 pr-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-white p-1 h-6 w-6 ${text.textAlign === 'left' ? 'bg-blue-500' : 'hover:text-blue-400'}`}
                      onClick={() => setTextAlign(text.id, 'left')}
                      title="Aligner à gauche dans la boîte"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-white p-1 h-6 w-6 ${text.textAlign === 'center' ? 'bg-blue-500' : 'hover:text-blue-400'}`}
                      onClick={() => setTextAlign(text.id, 'center')}
                      title="Centrer dans la boîte"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-white p-1 h-6 w-6 ${text.textAlign === 'right' ? 'bg-blue-500' : 'hover:text-blue-400'}`}
                      onClick={() => setTextAlign(text.id, 'right')}
                      title="Aligner à droite dans la boîte"
                    >
                      <AlignRight className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* Centrage parfait de la boîte */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-green-400 p-1 h-6 w-6"
                    onClick={() => centerText(text.id)}
                    title="Centrer parfaitement sur l'écran"
                  >
                    <Move className="w-3 h-3" />
                  </Button>
                  
                  {/* Indicateur de taille */}
                  <div className="text-xs text-gray-400 px-1 border-l border-gray-600 ml-1">
                    {Math.round(text.style.font_size)}px
                  </div>
                  
                  {/* Supprimer */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-red-400 p-1 h-6 w-6 border-l border-gray-600 pl-2 ml-1"
                    onClick={() => deleteText(text.id)}
                    title="Supprimer le texte"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}