'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type,
  Image,
  Play,
  Trash2,
  Edit3,
  Plus,
  FolderOpen,
  Palette,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextFormattingModalToolbar } from './text-formatting-modal-toolbar'

interface ContentVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number }
  style: {
    color: string
    font_size: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    textDecoration?: string
    textShadow?: string
    webkitTextStroke?: string
    backgroundColor?: string
    padding?: string
    borderRadius?: string
    letterSpacing?: string
    lineHeight?: string
    opacity?: number
  }
}

interface VideoAssetsSidebarProps {
  contentVideos: ContentVideo[]
  textOverlays: TextOverlay[]
  onAddText: () => void
  onEditText: (textId: string) => void
  onDeleteText: (textId: string) => void
  onVideoSelect: (video: ContentVideo) => void
  onDragStart?: (video: ContentVideo) => void
  onDragEnd?: () => void
  draggedVideo?: ContentVideo | null
  className?: string
  activeTool?: string | null
  onToolChange?: (tool: string | null) => void
  selectedTextId?: string | null
  onUpdateTextOverlay?: (textId: string, updates: any) => void
  onActiveTabChange?: (tab: 'assets' | 'text' | null, isOpen: boolean) => void
  onUpdateTextOrder?: (texts: TextOverlay[]) => void
  onTextSelect?: (textId: string | null) => void
  isTextTabActive?: boolean
}

export function VideoAssetsSidebar({
  contentVideos,
  textOverlays,
  onAddText,
  onEditText,
  onDeleteText,
  onVideoSelect,
  onDragStart,
  onDragEnd,
  draggedVideo,
  className,
  activeTool,
  onToolChange,
  selectedTextId,
  onUpdateTextOverlay,
  onActiveTabChange,
  onUpdateTextOrder,
  onTextSelect,
  isTextTabActive
}: VideoAssetsSidebarProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'text' | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Synchroniser avec l'état externe isTextTabActive
  useEffect(() => {
    if (isTextTabActive && activeTab !== 'text') {
      setActiveTab('text')
      setPanelOpen(true)
    }
  }, [isTextTabActive, activeTab])

  const handleDragStart = (video: ContentVideo) => {
    onDragStart?.(video)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  const handleTabClick = (tab: 'assets' | 'text') => {
    if (activeTab === tab && panelOpen) {
      // Close if clicking on same tab
      setPanelOpen(false)
      setActiveTab(null)
      onActiveTabChange?.(null, false)
    } else {
      // Open with new tab
      setActiveTab(tab)
      setPanelOpen(true)
      onActiveTabChange?.(tab, true)
    }
  }

  return (
    <div className={cn("flex", className)}>
      {/* Vertical icon sidebar - similar to main sidebar */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col">
        {/* Assets tab */}
        <button
          onClick={() => handleTabClick('assets')}
          className={cn(
            "flex flex-col items-center justify-center h-16 px-2 py-3 text-xs font-medium transition-colors border-b border-gray-100 relative",
            activeTab === 'assets' && panelOpen
              ? "bg-primary/10 text-primary"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          title="Assets"
        >
          {activeTab === 'assets' && panelOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          )}
          <FolderOpen className="w-6 h-6 mb-1" />
          <span>Assets</span>
          {contentVideos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {contentVideos.length}
            </span>
          )}
        </button>

        {/* Text tab */}
        <button
          onClick={() => handleTabClick('text')}
          className={cn(
            "flex flex-col items-center justify-center h-16 px-2 py-3 text-xs font-medium transition-colors border-b border-gray-100 relative",
            activeTab === 'text' && panelOpen
              ? "bg-primary/10 text-primary"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          title="Texte"
        >
          {activeTab === 'text' && panelOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          )}
          <Type className="w-6 h-6 mb-1" />
          <span>Texte</span>
          {textOverlays.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {textOverlays.length}
            </span>
          )}
        </button>
      </div>

      {/* Sliding panel from right */}
      {panelOpen && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full">
          {activeTab === 'assets' && (
          <div className="flex flex-col h-full">
            {/* Header section - fixed */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Glissez les vidéos dans la timeline
              </h3>
              <p className="text-xs text-gray-500">
                Sélectionnez et glissez vos assets vers les emplacements de la timeline
              </p>
            </div>

            {/* Scrollable assets list */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
              {contentVideos.map((video) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => handleDragStart(video)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onVideoSelect(video)}
                  className={cn(
                    "group relative bg-gray-50 rounded-lg p-3 cursor-pointer transition-all",
                    "hover:bg-gray-100 hover:shadow-sm",
                    "border-2 border-transparent hover:border-primary/20",
                    draggedVideo?.id === video.id && "opacity-50 scale-95"
                  )}
                >
                  {/* Video thumbnail */}
                  <div className="aspect-video bg-gray-200 rounded-md mb-3 overflow-hidden relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Play className="w-6 h-6" />
                      </div>
                    )}

                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {Math.round(video.duration)}s
                    </div>
                  </div>

                  {/* Video info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {video.title || 'Sans titre'}
                    </h4>
                    {video.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Drag indicator */}
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}

                {contentVideos.length === 0 && (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-2">Aucun asset trouvé</p>
                    <p className="text-xs text-gray-400">
                      Uploadez des vidéos dans la section Assets
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="flex flex-col h-full">
            {/* Simple header with just add button */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <Button
                onClick={onAddText}
                className="w-full h-10 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une zone de texte
              </Button>
            </div>

            {/* Show fonts by default, colors when color tool is active */}
            <div className="p-4">
              {/* Text content editor when text is selected */}
              {selectedTextId && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Contenu du texte</label>
                  <textarea
                    value={textOverlays.find(t => t.id === selectedTextId)?.content || ''}
                    onChange={(e) => {
                      if (onUpdateTextOverlay && selectedTextId) {
                        onUpdateTextOverlay(selectedTextId, { content: e.target.value })
                      }
                    }}
                    placeholder="Saisissez votre texte..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Panneaux spécifiques selon l'outil actif */}
              {selectedTextId && activeTool && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    {activeTool === 'color' ? 'Couleurs' :
                     activeTool === 'effects' ? 'Effets' :
                     activeTool === 'font' ? 'Polices' :
                     activeTool === 'position' ? 'Position des calques' : 'Formatage'}
                  </h4>

                  {activeTool === 'color' && (
                    <ColorPanel
                      selectedTextId={selectedTextId}
                      textOverlays={textOverlays}
                      onUpdateTextOverlay={onUpdateTextOverlay}
                    />
                  )}

                  {activeTool === 'font' && (
                    <FontPanel
                      selectedTextId={selectedTextId}
                      textOverlays={textOverlays}
                      onUpdateTextOverlay={onUpdateTextOverlay}
                    />
                  )}

                  {activeTool === 'effects' && (
                    <EffectsPanel
                      selectedTextId={selectedTextId}
                      textOverlays={textOverlays}
                      onUpdateTextOverlay={onUpdateTextOverlay}
                    />
                  )}

                  {activeTool === 'position' && (
                    <PositionPanel
                      selectedTextId={selectedTextId}
                      textOverlays={textOverlays}
                      onUpdateTextOrder={onUpdateTextOrder}
                      onTextSelect={onTextSelect}
                    />
                  )}

                  {activeTool === 'transparency' && (
                    <TransparencyPanel
                      selectedTextId={selectedTextId}
                      textOverlays={textOverlays}
                      onUpdateTextOverlay={onUpdateTextOverlay}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  )
}

// Panneau Couleurs
function ColorPanel({
  selectedTextId,
  textOverlays,
  onUpdateTextOverlay
}: {
  selectedTextId: string
  textOverlays: TextOverlay[]
  onUpdateTextOverlay?: (textId: string, updates: any) => void
}) {
  const colorPresets = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899',
    '#f97316', '#06b6d4', '#84cc16', '#f59e0b', '#10b981', '#f43f5e', '#6366f1', '#94a3b8'
  ]

  const updateStyle = (updates: any) => {
    if (onUpdateTextOverlay) {
      const selectedText = textOverlays.find(t => t.id === selectedTextId)
      if (selectedText) {
        onUpdateTextOverlay(selectedTextId, {
          style: { ...selectedText.style, ...updates }
        })
      }
    }
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)
  const currentColor = selectedText?.style?.color || '#ffffff'
  const currentBgColor = selectedText?.style?.backgroundColor || 'transparent'

  return (
    <div className="space-y-4">
      {/* Couleur du texte seulement */}
      <div>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => updateStyle({ color })}
              className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                currentColor === color ? 'ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => updateStyle({ color: e.target.value })}
          className="w-full h-8 rounded border cursor-pointer"
        />
      </div>
    </div>
  )
}

// Panneau Police
function FontPanel({
  selectedTextId,
  textOverlays,
  onUpdateTextOverlay
}: {
  selectedTextId: string
  textOverlays: TextOverlay[]
  onUpdateTextOverlay?: (textId: string, updates: any) => void
}) {
  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  ]

  const updateStyle = (updates: any) => {
    if (onUpdateTextOverlay) {
      const selectedText = textOverlays.find(t => t.id === selectedTextId)
      if (selectedText) {
        onUpdateTextOverlay(selectedTextId, {
          style: { ...selectedText.style, ...updates }
        })
      }
    }
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)
  const currentFontFamily = selectedText?.style?.fontFamily || 'Arial, sans-serif'

  return (
    <div className="space-y-3">
      {fontFamilies.map((font) => (
        <button
          key={font.value}
          onClick={() => updateStyle({ fontFamily: font.value })}
          className={`w-full p-3 text-left rounded border hover:bg-gray-50 transition-all ${
            currentFontFamily === font.value ? 'bg-blue-100 border-blue-300' : 'border-gray-300'
          }`}
          style={{ fontFamily: font.value }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">{font.name}</span>
            <span className="text-xs text-gray-500" style={{ fontFamily: font.value }}>
              Exemple
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

// Panneau Effets - Version simplifiée avec 4 cases
function EffectsPanel({
  selectedTextId,
  textOverlays,
  onUpdateTextOverlay
}: {
  selectedTextId: string
  textOverlays: TextOverlay[]
  onUpdateTextOverlay?: (textId: string, updates: any) => void
}) {
  const [selectedEffect, setSelectedEffect] = useState<'none' | 'shadow' | 'border' | 'background'>('none')

  const updateStyle = (updates: any) => {
    if (onUpdateTextOverlay) {
      const selectedText = textOverlays.find(t => t.id === selectedTextId)
      if (selectedText) {
        onUpdateTextOverlay(selectedTextId, {
          style: { ...selectedText.style, ...updates }
        })
      }
    }
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)

  // Déterminer l'effet actuel
  const getCurrentEffect = () => {
    if (!selectedText?.style) return 'none'

    if (selectedText.style.textShadow && selectedText.style.textShadow !== 'none') return 'shadow'
    if (selectedText.style.webkitTextStroke && selectedText.style.webkitTextStroke !== 'none') return 'border'
    if (selectedText.style.backgroundColor && selectedText.style.backgroundColor !== 'transparent') return 'background'
    return 'none'
  }

  const currentEffect = getCurrentEffect()

  const applyEffect = (effectType: 'none' | 'shadow' | 'border' | 'background') => {
    setSelectedEffect(effectType)

    // Reset tous les effets
    let newStyle = {
      textShadow: 'none',
      webkitTextStroke: 'none',
      backgroundColor: 'transparent',
      padding: '0',
      borderRadius: '0'
    }

    // Appliquer l'effet sélectionné
    switch (effectType) {
      case 'shadow':
        newStyle.textShadow = '2px 2px 4px rgba(0,0,0,0.7)'
        break
      case 'border':
        newStyle.webkitTextStroke = '1px black'
        break
      case 'background':
        newStyle.backgroundColor = 'rgba(0,0,0,0.7)'
        newStyle.padding = '4px 8px'
        newStyle.borderRadius = '4px'
        break
    }

    updateStyle(newStyle)
  }

  return (
    <div className="space-y-4">
      {/* 4 cases d'effets */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => applyEffect('none')}
          className={`p-3 text-xs rounded border hover:bg-gray-50 transition-all text-center ${
            currentEffect === 'none' ? 'bg-blue-100 border-blue-300' : 'border-gray-300'
          }`}
        >
          Aucun
        </button>
        <button
          onClick={() => applyEffect('shadow')}
          className={`p-3 text-xs rounded border hover:bg-gray-50 transition-all text-center ${
            currentEffect === 'shadow' ? 'bg-blue-100 border-blue-300' : 'border-gray-300'
          }`}
        >
          Ombre
        </button>
        <button
          onClick={() => applyEffect('border')}
          className={`p-3 text-xs rounded border hover:bg-gray-50 transition-all text-center ${
            currentEffect === 'border' ? 'bg-blue-100 border-blue-300' : 'border-gray-300'
          }`}
        >
          Bordure
        </button>
        <button
          onClick={() => applyEffect('background')}
          className={`p-3 text-xs rounded border hover:bg-gray-50 transition-all text-center ${
            currentEffect === 'background' ? 'bg-blue-100 border-blue-300' : 'border-gray-300'
          }`}
        >
          Arrière-plan
        </button>
      </div>

      {/* Contrôles spécifiques selon l'effet sélectionné */}
      {currentEffect === 'shadow' && (
        <ShadowControls
          selectedText={selectedText}
          updateStyle={updateStyle}
        />
      )}

      {currentEffect === 'border' && (
        <BorderControls
          selectedText={selectedText}
          updateStyle={updateStyle}
        />
      )}

      {currentEffect === 'background' && (
        <BackgroundControls
          selectedText={selectedText}
          updateStyle={updateStyle}
        />
      )}
    </div>
  )
}

// Contrôles pour l'ombre
function ShadowControls({ selectedText, updateStyle }: any) {
  const getShadowIntensity = () => {
    const shadow = selectedText?.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.7)'
    // Parser grossier pour extraire l'intensité
    if (shadow.includes('1px')) return 1
    if (shadow.includes('2px')) return 2
    if (shadow.includes('3px')) return 3
    if (shadow.includes('4px')) return 4
    return 2
  }

  const setShadowIntensity = (intensity: number) => {
    const shadows = [
      'none',
      '1px 1px 2px rgba(0,0,0,0.5)',
      '2px 2px 4px rgba(0,0,0,0.7)',
      '3px 3px 6px rgba(0,0,0,0.8)',
      '4px 4px 8px rgba(0,0,0,0.9)'
    ]
    updateStyle({ textShadow: shadows[intensity] })
  }

  return (
    <div>
      <label className="text-xs text-gray-600 mb-2 block">Intensité de l'ombre</label>
      <input
        type="range"
        min="1"
        max="4"
        step="1"
        value={getShadowIntensity()}
        onChange={(e) => setShadowIntensity(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Légère</span>
        <span>Forte</span>
      </div>
    </div>
  )
}

// Contrôles pour la bordure
function BorderControls({ selectedText, updateStyle }: any) {
  const getBorderIntensity = () => {
    const stroke = selectedText?.style?.webkitTextStroke || '1px black'
    if (stroke.includes('1px')) return 1
    if (stroke.includes('2px')) return 2
    return 1
  }

  const setBorderIntensity = (intensity: number) => {
    const strokes = ['none', '1px black', '2px black']
    updateStyle({ webkitTextStroke: strokes[intensity] })
  }

  return (
    <div>
      <label className="text-xs text-gray-600 mb-2 block">Épaisseur de la bordure</label>
      <input
        type="range"
        min="1"
        max="2"
        step="1"
        value={getBorderIntensity()}
        onChange={(e) => setBorderIntensity(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Fine</span>
        <span>Épaisse</span>
      </div>
    </div>
  )
}

// Contrôles pour l'arrière-plan
function BackgroundControls({ selectedText, updateStyle }: any) {
  const colorPresets = [
    '#000000', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899',
    '#f97316', '#06b6d4', '#84cc16', '#f59e0b', '#10b981', '#f43f5e', '#6366f1', '#94a3b8'
  ]

  const getCurrentBgColor = () => {
    const bg = selectedText?.style?.backgroundColor || 'rgba(0,0,0,0.7)'
    // Extraire la couleur de base si c'est en rgba
    if (bg.startsWith('rgba(0,0,0,')) return '#000000'
    if (bg.startsWith('rgba(255,255,255,')) return '#ffffff'
    return bg === 'transparent' ? '#000000' : bg
  }

  const getBgOpacity = () => {
    const bg = selectedText?.style?.backgroundColor || 'rgba(0,0,0,0.7)'
    if (bg === 'transparent') return 0
    if (bg.includes('0.3')) return 0.3
    if (bg.includes('0.5')) return 0.5
    if (bg.includes('0.7')) return 0.7
    if (bg.includes('0.9')) return 0.9
    return 0.7
  }

  const setBgColor = (color: string) => {
    const opacity = getBgOpacity()
    if (opacity === 0) {
      updateStyle({ backgroundColor: 'transparent' })
    } else {
      // Convertir hex vers rgba
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      updateStyle({ backgroundColor: `rgba(${r},${g},${b},${opacity})` })
    }
  }

  const setBgOpacity = (opacity: number) => {
    if (opacity === 0) {
      updateStyle({ backgroundColor: 'transparent' })
    } else {
      const color = getCurrentBgColor()
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      updateStyle({ backgroundColor: `rgba(${r},${g},${b},${opacity})` })
    }
  }

  const getBorderRadius = () => {
    const radius = selectedText?.style?.borderRadius || '4px'
    return parseInt(radius.replace('px', '')) || 4
  }

  const setBorderRadius = (radius: number) => {
    updateStyle({ borderRadius: `${radius}px` })
  }

  return (
    <div className="space-y-4">
      {/* Couleur de fond */}
      <div>
        <label className="text-xs text-gray-600 mb-2 block">Couleur de fond</label>
        <div className="grid grid-cols-8 gap-2 mb-2">
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => setBgColor(color)}
              className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                getCurrentBgColor() === color ? 'ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={getCurrentBgColor()}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-full h-8 rounded border cursor-pointer"
        />
      </div>

      {/* Transparence du fond */}
      <div>
        <label className="text-xs text-gray-600 mb-2 block">Transparence du fond</label>
        <input
          type="range"
          min="0"
          max="0.9"
          step="0.1"
          value={getBgOpacity()}
          onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Transparent</span>
          <span>Opaque</span>
        </div>
      </div>

      {/* Arrondi des coins */}
      <div>
        <label className="text-xs text-gray-600 mb-2 block">Arrondi des coins</label>
        <input
          type="range"
          min="0"
          max="12"
          step="2"
          value={getBorderRadius()}
          onChange={(e) => setBorderRadius(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Carré</span>
          <span>Rond</span>
        </div>
      </div>
    </div>
  )
}

// Panneau Position
function PositionPanel({
  selectedTextId,
  textOverlays,
  onUpdateTextOrder,
  onTextSelect
}: {
  selectedTextId: string
  textOverlays: TextOverlay[]
  onUpdateTextOrder?: (texts: TextOverlay[]) => void
  onTextSelect?: (textId: string | null) => void
}) {
  const moveTextInOrder = (textId: string, direction: 'up' | 'down') => {
    if (!textOverlays || !onUpdateTextOrder) return

    const currentIndex = textOverlays.findIndex(t => t.id === textId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= textOverlays.length) return

    const newTexts = [...textOverlays]
    const [removed] = newTexts.splice(currentIndex, 1)
    newTexts.splice(newIndex, 0, removed)

    onUpdateTextOrder(newTexts)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-3">
        Gérez l'ordre d'affichage de vos textes. Les textes en haut de la liste apparaissent devant les autres.
      </p>

      {textOverlays.length === 0 && (
        <div className="text-center py-4">
          <Type className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">Aucun texte à gérer</p>
        </div>
      )}

      {textOverlays.map((text, index) => (
        <div
          key={text.id}
          className={`border rounded-lg p-3 transition-all ${
            text.id === selectedTextId
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => onTextSelect?.(text.id)}
              className="flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-gray-400" />
                <span className="text-sm font-medium truncate">
                  {text.content || 'Texte vide'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {text.start_time}s - {text.end_time}s
              </div>
            </button>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => moveTextInOrder(text.id, 'up')}
                disabled={index === 0}
                className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                  index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
                }`}
                title="Monter le calque"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveTextInOrder(text.id, 'down')}
                disabled={index === textOverlays.length - 1}
                className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                  index === textOverlays.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
                }`}
                title="Descendre le calque"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indicateur de position dans la pile */}
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span>Calque {index + 1} sur {textOverlays.length}</span>
            {index === 0 && <span className="text-blue-600">(devant)</span>}
            {index === textOverlays.length - 1 && <span className="text-orange-600">(derrière)</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Panneau Transparence
function TransparencyPanel({
  selectedTextId,
  textOverlays,
  onUpdateTextOverlay
}: {
  selectedTextId: string
  textOverlays: TextOverlay[]
  onUpdateTextOverlay?: (textId: string, updates: any) => void
}) {
  const updateStyle = (updates: any) => {
    if (onUpdateTextOverlay) {
      const selectedText = textOverlays.find(t => t.id === selectedTextId)
      if (selectedText) {
        onUpdateTextOverlay(selectedTextId, {
          style: { ...selectedText.style, ...updates }
        })
      }
    }
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)
  const currentOpacity = selectedText?.style?.opacity || 1

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 mb-3">
        Contrôlez l'opacité générale du texte. Cette transparence s'applique à l'ensemble du texte, y compris ses effets.
      </p>

      <div>
        <label className="text-xs text-gray-600 mb-2 block">Opacité du texte</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={currentOpacity}
          onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Invisible</span>
          <span>Opaque</span>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 mt-2">
          {Math.round(currentOpacity * 100)}%
        </div>
      </div>

      {/* Aperçu visuel */}
      <div className="border rounded-lg p-3 bg-gray-100">
        <label className="text-xs text-gray-600 mb-2 block">Aperçu</label>
        <div
          className="text-sm text-center py-2 bg-gray-800 rounded text-white"
          style={{ opacity: currentOpacity }}
        >
          Texte avec {Math.round(currentOpacity * 100)}% d'opacité
        </div>
      </div>
    </div>
  )
}

