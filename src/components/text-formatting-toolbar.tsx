'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  ChevronDown,
  Trash2,
  Copy,
  X,
  Underline,
  Space,
  EyeOff,
  Zap,
  Layers,
  Move3D,
  MoreHorizontal,
  Settings,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextFormattingToolbarProps {
  selectedTextId: string | null
  selectedTextOverlay: any | null
  onUpdateText: (textId: string, updates: any) => void
  onToolChange?: (tool: string | null) => void
  activeTool: string | null
  isTextTabActive?: boolean
  onDeleteText?: (textId: string) => void
  onDuplicateText?: (textId: string) => void
  onPanelChange?: (panel: string | null) => void
  activePanel?: string | null
}

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

const fontSizes = [10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72, 80, 88, 90, 96, 100]

const textColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  '#808080', '#FFD700', '#32CD32', '#87CEEB', '#DDA0DD', '#F0E68C'
]

// Extended color palette
const allColors = [
  ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'],
  ['#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC', '#FFE6E6'],
  ['#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC', '#E6FFE6'],
  ['#0000FF', '#3333FF', '#6666FF', '#9999FF', '#CCCCFF', '#E6E6FF'],
  ['#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFFFE6'],
  ['#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF', '#FFE6FF'],
  ['#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF', '#E6FFFF'],
  ['#FFA500', '#FFB533', '#FFC566', '#FFD599', '#FFE5CC', '#FFF2E6']
]

function getEffectType(style: any): string {
  if (style.textShadow && style.textShadow !== 'none') return 'ombre'
  if (style.backgroundColor && style.backgroundColor !== 'transparent') return 'arriere-plan'
  if (style.webkitTextStroke && style.webkitTextStroke !== 'none') return 'bordure'
  return 'aucun'
}

export function TextFormattingToolbar({
  selectedTextId,
  selectedTextOverlay,
  onUpdateText,
  onToolChange,
  activeTool,
  isTextTabActive,
  onDeleteText,
  onDuplicateText,
  onPanelChange,
  activePanel: externalActivePanel
}: TextFormattingToolbarProps) {
  const activePanel = externalActivePanel || null

  const currentStyle = selectedTextOverlay?.style || {}
  const currentFontFamily = currentStyle.fontFamily || 'Arial, sans-serif'
  const currentFontSize = currentStyle.font_size || currentStyle.fontSize || 16
  const currentColor = currentStyle.color || '#FFFFFF'
  const currentFontWeight = currentStyle.fontWeight || 'normal'
  const currentFontStyle = currentStyle.fontStyle || 'normal'
  const currentTextAlign = currentStyle.textAlign || 'left'
  const currentLetterSpacing = currentStyle.letterSpacing || 'normal'
  const currentLineHeight = currentStyle.lineHeight || 'normal'
  const currentOpacity = currentStyle.opacity || 1
  const currentEffect = getEffectType(currentStyle)
  const currentTextDecoration = currentStyle.textDecoration || 'none'
  const currentTextShadow = currentStyle.textShadow || 'none'
  const currentOutline = currentStyle.webkitTextStroke || 'none'
  const currentBackground = currentStyle.backgroundColor || 'transparent'

  const handleFontFamilyChange = (fontFamily: string) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        fontFamily: fontFamily
      }
    })
  }

  const handleFontSizeChange = (fontSize: number) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        font_size: fontSize,
        fontSize: fontSize
      }
    })
  }

  const handleColorChange = (color: string) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        color: color
      }
    })
  }

  const handleBoldToggle = () => {
    if (!selectedTextId) return
    const newWeight = currentFontWeight === 'bold' ? 'normal' : 'bold'
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        fontWeight: newWeight
      }
    })
  }

  const handleItalicToggle = () => {
    if (!selectedTextId) return
    const newStyle = currentFontStyle === 'italic' ? 'normal' : 'italic'
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        fontStyle: newStyle
      }
    })
  }

  const handleAlignmentChange = (alignment: string) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        textAlign: alignment
      }
    })
  }

  const handleUnderlineToggle = () => {
    if (!selectedTextId) return
    const newDecoration = currentTextDecoration === 'underline' ? 'none' : 'underline'
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        textDecoration: newDecoration
      }
    })
  }

  const handleShadowToggle = (intensity: 'light' | 'medium' | 'heavy') => {
    if (!selectedTextId) return
    const shadows = {
      none: 'none',
      light: '1px 1px 2px rgba(0,0,0,0.5)',
      medium: '2px 2px 4px rgba(0,0,0,0.7)',
      heavy: '3px 3px 6px rgba(0,0,0,0.9)'
    }
    const newShadow = currentTextShadow === shadows[intensity] ? shadows.none : shadows[intensity]
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        textShadow: newShadow
      }
    })
  }

  const handleOutlineToggle = (intensity: 'thin' | 'medium' | 'thick') => {
    if (!selectedTextId) return
    const outlines = {
      none: 'none',
      thin: '1px black',
      medium: '2px black',
      thick: '3px black'
    }
    const newOutline = currentOutline === outlines[intensity] ? outlines.none : outlines[intensity]
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        webkitTextStroke: newOutline
      }
    })
  }

  const handleBackgroundToggle = (color: string) => {
    if (!selectedTextId) return
    const newBg = currentBackground === color ? 'transparent' : color
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        backgroundColor: newBg,
        padding: newBg !== 'transparent' ? '4px 8px' : '0',
        borderRadius: newBg !== 'transparent' ? '4px' : '0'
      }
    })
  }

  const handleLetterSpacingChange = (spacing: string) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        letterSpacing: spacing
      }
    })
  }

  const handleLineHeightChange = (height: string) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        lineHeight: height
      }
    })
  }

  const handleOpacityChange = (opacity: number) => {
    if (!selectedTextId) return
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        opacity: opacity
      }
    })
  }

  const handleEffectChange = (effect: string) => {
    if (!selectedTextId) return
    let newStyle = { ...currentStyle }

    // Reset all effects
    newStyle.textShadow = 'none'
    newStyle.backgroundColor = 'transparent'
    newStyle.webkitTextStroke = 'none'
    newStyle.padding = '0'
    newStyle.borderRadius = '0'

    // Apply selected effect
    switch (effect) {
      case 'ombre':
        newStyle.textShadow = '2px 2px 4px rgba(0,0,0,0.7)'
        break
      case 'arriere-plan':
        newStyle.backgroundColor = 'rgba(0,0,0,0.7)'
        newStyle.padding = '4px 8px'
        newStyle.borderRadius = '4px'
        break
      case 'bordure':
        newStyle.webkitTextStroke = '1px black'
        break
    }

    onUpdateText(selectedTextId, { style: newStyle })
  }

  const togglePanel = (panelName: string) => {
    const newPanel = activePanel === panelName ? null : panelName
    onPanelChange?.(newPanel)
  }

  return (
    <div className="flex justify-center mb-4">
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm px-4 py-2 flex items-center gap-3 max-w-full overflow-hidden">
        {/* Font Family */}
        <button
          onClick={() => onToolChange?.(activeTool === 'font' ? null : 'font')}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded border text-sm hover:bg-gray-50 flex-shrink-0",
            activeTool === 'font' && "bg-blue-50 border-blue-300"
          )}
        >
          <Type className="w-4 h-4" />
          <span className="min-w-[80px] text-left" style={{ fontFamily: currentFontFamily }}>
            {fontFamilies.find(f => f.value === currentFontFamily)?.name || 'Arial'}
          </span>
        </button>

        {/* Font Size */}
        <select
          value={Math.round(currentFontSize * 10) / 10}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[60px] flex-shrink-0"
          disabled={!selectedTextId}
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        {/* Colors */}
        <button
          onClick={() => onToolChange?.(activeTool === 'color' ? null : 'color')}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded border hover:bg-gray-50 flex-shrink-0",
            activeTool === 'color' && "bg-blue-50 border-blue-300"
          )}
          title="Couleur du texte"
        >
          <Palette className="w-4 h-4" />
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        <div className="w-px h-6 bg-gray-300 flex-shrink-0" />

        {/* Bold */}
        <button
          onClick={handleBoldToggle}
          className={cn(
            "p-1.5 rounded hover:bg-gray-100 flex-shrink-0",
            currentFontWeight === 'bold' && "bg-blue-100 text-blue-600"
          )}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          onClick={handleItalicToggle}
          className={cn(
            "p-1.5 rounded hover:bg-gray-100 flex-shrink-0",
            currentFontStyle === 'italic' && "bg-blue-100 text-blue-600"
          )}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>


        {/* Position/Layers */}
        <button
          onClick={() => onToolChange?.(activeTool === 'position' ? null : 'position')}
          className={cn(
            "p-1.5 rounded border hover:bg-gray-50 flex-shrink-0",
            activeTool === 'position' && "bg-blue-50 border-blue-300"
          )}
          title="Position et ordre des calques"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Transparency */}
        <button
          onClick={() => onToolChange?.(activeTool === 'transparency' ? null : 'transparency')}
          className={cn(
            "p-1.5 rounded border hover:bg-gray-50 flex-shrink-0 relative overflow-hidden",
            activeTool === 'transparency' && "bg-blue-50 border-blue-300"
          )}
          title="Transparence du texte"
        >
          <div className="w-4 h-4 rounded" style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'
          }} />
        </button>

        {/* Effects */}
        <button
          onClick={() => onToolChange?.(activeTool === 'effects' ? null : 'effects')}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded border hover:bg-gray-50 flex-shrink-0",
            activeTool === 'effects' && "bg-blue-50 border-blue-300"
          )}
          title="Effets de texte"
        >
          <Move3D className="w-4 h-4" />
          <span className="text-sm">Styles</span>
        </button>


        {/* More options button - Now shows hidden options */}
        <button
          onClick={() => togglePanel('more')}
          className={cn(
            "p-1.5 rounded hover:bg-gray-100 flex-shrink-0 xl:hidden", // Always show on smaller screens
            activePanel === 'more' && "bg-blue-100 text-blue-600"
          )}
          title="Plus d'options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 flex-shrink-0" />

        {/* Duplicate button */}
        <button
          onClick={() => {
            if (selectedTextId && onDuplicateText) {
              onDuplicateText(selectedTextId)
            }
          }}
          className={`p-1.5 rounded flex-shrink-0 ${
            selectedTextId && onDuplicateText
              ? 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
              : 'bg-gray-100 text-gray-400'
          }`}
          title={selectedTextId ? "Dupliquer le texte" : "Aucun texte sélectionné"}
          disabled={!selectedTextId || !onDuplicateText}
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Delete button */}
        <button
          onClick={() => {
            if (selectedTextId && onDeleteText) {
              onDeleteText(selectedTextId)
            }
          }}
          className={`p-1.5 rounded flex-shrink-0 ${
            selectedTextId && onDeleteText
              ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
              : 'bg-gray-100 text-gray-400'
          }`}
          title={selectedTextId ? "Supprimer le texte" : "Aucun texte sélectionné"}
          disabled={!selectedTextId || !onDeleteText}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Composant pour afficher les options dans la zone de texte
export function TextFormattingPanel({
  activePanel,
  selectedTextOverlay,
  onUpdateText,
  selectedTextId,
  textOverlays,
  onUpdateTextOrder,
  onPanelChange
}: {
  activePanel: string | null
  selectedTextOverlay: any | null
  onUpdateText: (textId: string, updates: any) => void
  selectedTextId: string | null
  textOverlays?: any[]
  onUpdateTextOrder?: (texts: any[]) => void
  onPanelChange?: (panel: string | null) => void
}) {
  if (!activePanel || !selectedTextOverlay || !selectedTextId) {
    return null
  }

  const currentStyle = selectedTextOverlay.style || {}
  const currentColor = currentStyle.color || '#FFFFFF'
  const currentLetterSpacing = currentStyle.letterSpacing || 'normal'
  const currentLineHeight = currentStyle.lineHeight || 'normal'
  const currentOpacity = currentStyle.opacity || 1
  const currentEffect = getEffectType(currentStyle)

  const handleFontFamilySelect = (fontFamily: string) => {
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        fontFamily: fontFamily
      }
    })
  }

  const handleColorSelect = (color: string) => {
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        color: color
      }
    })
  }

  const handleLetterSpacingChange = (spacing: string) => {
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        letterSpacing: spacing
      }
    })
  }

  const handleLineHeightChange = (height: string) => {
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        lineHeight: height
      }
    })
  }

  const handleOpacityChange = (opacity: number) => {
    onUpdateText(selectedTextId, {
      style: {
        ...currentStyle,
        opacity: opacity
      }
    })
  }

  const handleEffectChange = (effect: string) => {
    let newStyle = { ...currentStyle }

    // Reset all effects
    newStyle.textShadow = 'none'
    newStyle.backgroundColor = 'transparent'
    newStyle.webkitTextStroke = 'none'
    newStyle.padding = '0'
    newStyle.borderRadius = '0'

    // Apply selected effect
    switch (effect) {
      case 'ombre':
        newStyle.textShadow = '2px 2px 4px rgba(0,0,0,0.7)'
        break
      case 'arriere-plan':
        newStyle.backgroundColor = 'rgba(0,0,0,0.7)'
        newStyle.padding = '4px 8px'
        newStyle.borderRadius = '4px'
        break
      case 'bordure':
        newStyle.webkitTextStroke = '1px black'
        break
    }

    onUpdateText(selectedTextId, { style: newStyle })
  }

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
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      {/* Font Panel */}
      {activePanel === 'font' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Police d'écriture</h3>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {fontFamilies.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontFamilySelect(font.value)}
                className={cn(
                  "p-2 text-left rounded border hover:bg-white hover:shadow-sm transition-all text-sm",
                  currentStyle.fontFamily === font.value
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "bg-white border-gray-200"
                )}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors Panel */}
      {activePanel === 'colors' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Couleurs</h3>
          <div className="space-y-3">
            {/* Extended Color Palette */}
            <div className="grid grid-cols-6 gap-1">
              {allColors.map((row, rowIndex) =>
                row.map((color, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "w-8 h-8 rounded border-2 hover:scale-110 transition-transform",
                      currentColor === color
                        ? "border-blue-400 shadow-md"
                        : "border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))
              )}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Personnalisé:</label>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                disabled={!selectedTextId}
                className="w-10 h-8 rounded border cursor-pointer disabled:opacity-50"
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                disabled={!selectedTextId}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Spacing Panel */}
      {activePanel === 'spacing' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Espacement et Interligne</h3>
          <div className="space-y-4">
            {/* Letter Spacing */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Espacement des lettres:</label>
              <div className="flex gap-2 flex-wrap">
                {['normal', '0.5px', '1px', '2px', '3px'].map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => handleLetterSpacingChange(spacing)}
                    className={cn(
                      "px-3 py-1 text-xs rounded border hover:bg-gray-50",
                      currentLetterSpacing === spacing && "bg-blue-100 border-blue-300 text-blue-600"
                    )}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Interligne:</label>
              <div className="flex gap-2 flex-wrap">
                {['normal', '1.2', '1.5', '2', '2.5'].map((height) => (
                  <button
                    key={height}
                    onClick={() => handleLineHeightChange(height)}
                    className={cn(
                      "px-3 py-1 text-xs rounded border hover:bg-gray-50",
                      currentLineHeight === height && "bg-blue-100 border-blue-300 text-blue-600"
                    )}
                  >
                    {height}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transparency Panel */}
      {activePanel === 'transparency' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Transparence</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 min-w-[60px]">Opacité:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="flex-1"
                disabled={!selectedTextId}
              />
              <span className="text-sm font-mono min-w-[40px]">{Math.round(currentOpacity * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Effects Panel */}
      {activePanel === 'effects' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Effets</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'aucun', label: 'Aucun' },
              { key: 'ombre', label: 'Ombre' },
              { key: 'arriere-plan', label: 'Arrière-plan' },
              { key: 'bordure', label: 'Bordure' }
            ].map((effect) => (
              <button
                key={effect.key}
                onClick={() => handleEffectChange(effect.key)}
                className={cn(
                  "p-3 text-left rounded border hover:bg-gray-50 transition-all",
                  currentEffect === effect.key
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "bg-white border-gray-200"
                )}
              >
                {effect.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Position Panel */}
      {activePanel === 'position' && textOverlays && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Position et Ordre</h3>
          <div className="space-y-2">
            {textOverlays.map((text, index) => (
              <div
                key={text.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded border",
                  text.id === selectedTextId
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200"
                )}
              >
                <span className="text-sm truncate flex-1">{text.content}</span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => moveTextInOrder(text.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveTextInOrder(text.id, 'down')}
                    disabled={index === textOverlays.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Descendre"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More Panel */}
      {activePanel === 'more' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Plus d'options</h3>
          <div className="space-y-4">
            {/* Text Alignment - Always show in more panel on smaller screens */}
            <div className="xl:hidden">
              <label className="text-sm text-gray-600 mb-2 block">Alignement:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateText(selectedTextId, {
                    style: { ...currentStyle, textAlign: 'left' }
                  })}
                  className={cn(
                    "p-2 rounded border hover:bg-gray-50",
                    currentStyle.textAlign === 'left' && "bg-blue-100 border-blue-300 text-blue-600"
                  )}
                  title="Aligner à gauche"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateText(selectedTextId, {
                    style: { ...currentStyle, textAlign: 'center' }
                  })}
                  className={cn(
                    "p-2 rounded border hover:bg-gray-50",
                    currentStyle.textAlign === 'center' && "bg-blue-100 border-blue-300 text-blue-600"
                  )}
                  title="Centrer"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateText(selectedTextId, {
                    style: { ...currentStyle, textAlign: 'right' }
                  })}
                  className={cn(
                    "p-2 rounded border hover:bg-gray-50",
                    currentStyle.textAlign === 'right' && "bg-blue-100 border-blue-300 text-blue-600"
                  )}
                  title="Aligner à droite"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="lg:hidden">
              <label className="text-sm text-gray-600 mb-2 block">Espacement des lettres:</label>
              <div className="grid grid-cols-3 gap-2">
                {['normal', '0.5px', '1px', '2px', '3px'].map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => handleLetterSpacingChange(spacing)}
                    className={cn(
                      "px-3 py-1 text-xs rounded border hover:bg-gray-50",
                      currentLetterSpacing === spacing && "bg-blue-100 border-blue-300 text-blue-600"
                    )}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>

            {/* Transparency - Show when hidden from main toolbar */}
            <div className="lg:hidden">
              <label className="text-sm text-gray-600 mb-2 block">Transparence:</label>
              <button
                onClick={() => onPanelChange?.('transparency')}
                className={cn(
                  "p-2 rounded border hover:bg-gray-50 w-full text-left",
                  (activePanel as string) === 'transparency' && "bg-blue-100 border-blue-300 text-blue-600"
                )}
              >
                <EyeOff className="w-4 h-4 inline mr-2" />
                Régler l'opacité du texte
              </button>
            </div>

            {/* Effects - Show when hidden from main toolbar */}
            <div className="md:hidden">
              <label className="text-sm text-gray-600 mb-2 block">Effets:</label>
              <button
                onClick={() => onPanelChange?.('effects')}
                className={cn(
                  "p-2 rounded border hover:bg-gray-50 w-full text-left",
                  (activePanel as string) === 'effects' && "bg-blue-100 border-blue-300 text-blue-600"
                )}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Effets de texte ({currentEffect})
              </button>
            </div>

            {/* Position - Show when hidden from main toolbar */}
            <div className="lg:hidden">
              <label className="text-sm text-gray-600 mb-2 block">Position:</label>
              <button
                onClick={() => onPanelChange?.('position')}
                className={cn(
                  "p-2 rounded border hover:bg-gray-50 w-full text-left",
                  (activePanel as string) === 'position' && "bg-blue-100 border-blue-300 text-blue-600"
                )}
              >
                <Layers className="w-4 h-4 inline mr-2" />
                Ordre des calques de texte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

