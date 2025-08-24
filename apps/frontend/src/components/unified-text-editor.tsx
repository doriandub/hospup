'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Type, 
  Palette, 
  Lightbulb, 
  Trash2, 
  Eye,
  ToggleLeft,
  ToggleRight,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'

export interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: {
    x: number
    y: number
    anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
  style: {
    font_family: string
    font_size: number
    color: string
    shadow: boolean
    outline: boolean
    background: boolean
    bold: boolean
    italic: boolean
    opacity: number
    text_align: 'left' | 'center' | 'right'
  }
}

interface VideoSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
  assignedVideo?: {
    title: string
    thumbnail_url?: string
  }
}

interface UnifiedTextEditorProps {
  texts: TextOverlay[]
  totalDuration: number
  videoSlots?: VideoSlot[]
  selectedTextId?: string | null
  onSelectedTextChange?: (textId: string | null) => void
  onTextsChange: (texts: TextOverlay[]) => void
  onGenerateSuggestions?: () => Promise<string[]>
}

export function UnifiedTextEditor({ 
  texts, 
  totalDuration,
  videoSlots = [],
  selectedTextId = null,
  onSelectedTextChange,
  onTextsChange, 
  onGenerateSuggestions 
}: UnifiedTextEditorProps) {
  const [fonts, setFonts] = useState([
    { id: 'Inter', display_name: 'Inter', style: 'Sans-serif moderne' },
    { id: 'Helvetica', display_name: 'Helvetica', style: 'Sans-serif classique' },
    { id: 'Arial', display_name: 'Arial', style: 'Sans-serif standard' },
    { id: 'Times', display_name: 'Times', style: 'Serif traditionnel' },
    { id: 'Georgia', display_name: 'Georgia', style: 'Serif élégant' }
  ])
  
  const [colors] = useState([
    { name: 'Blanc', hex: '#ffffff' },
    { name: 'Noir', hex: '#000000' },
    { name: 'Rouge', hex: '#ef4444' },
    { name: 'Bleu', hex: '#3b82f6' },
    { name: 'Jaune', hex: '#eab308' },
    { name: 'Vert', hex: '#22c55e' }
  ])

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const selectedText = texts.find(t => t.id === selectedTextId)

  if (!selectedText) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Type className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Sélectionnez un texte pour l'éditer</p>
      </div>
    )
  }

  const updateText = (id: string, updates: Partial<TextOverlay>) => {
    onTextsChange(texts.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteText = (id: string) => {
    onTextsChange(texts.filter(t => t.id !== id))
    onSelectedTextChange?.(null)
  }

  const generateSuggestions = async () => {
    if (!onGenerateSuggestions) return
    setLoadingSuggestions(true)
    try {
      const newSuggestions = await onGenerateSuggestions()
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Trouver la vidéo correspondant au timing du texte
  const getVideoThumbnailForText = (text: TextOverlay): string | null => {
    for (const slot of videoSlots) {
      if (text.start_time >= slot.start_time && text.start_time < slot.end_time) {
        return slot.assignedVideo?.thumbnail_url || null
      }
    }
    return null
  }

  const videoThumbnail = getVideoThumbnailForText(selectedText)

  const presetPositions = [
    { name: 'Haut', anchor: 'top-center' as const, x: 50, y: 20 },
    { name: 'Centre', anchor: 'center' as const, x: 50, y: 50 },
    { name: 'Bas', anchor: 'bottom-center' as const, x: 50, y: 80 },
  ]

  const ToggleButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
        active 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="p-4 max-w-2xl">
      {/* Header avec actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Type className="w-4 h-4" />
          Édition du texte
        </h3>
        <div className="flex gap-2">
          {onGenerateSuggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestions}
              disabled={loadingSuggestions}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Suggestions
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteText(selectedText.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Contenu du texte */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Contenu</Label>
          <Textarea
            value={selectedText.content}
            onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
            placeholder="Saisissez votre texte..."
            className="resize-none"
            rows={2}
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => updateText(selectedText.id, { content: suggestion })}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs border border-blue-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout principal : Aperçu + Contrôles */}
        <div className="grid grid-cols-3 gap-4">
          
          {/* Aperçu */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Aperçu</Label>
            <div 
              className="relative rounded-lg aspect-[9/16] w-full max-w-32 overflow-hidden border-2 border-gray-200"
              style={{
                backgroundImage: videoThumbnail ? `url(${videoThumbnail})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${selectedText.position.x}%`,
                  top: `${selectedText.position.y}%`,
                  fontFamily: fonts.find(f => f.id === selectedText.style.font_family)?.display_name || 'Helvetica',
                  fontSize: `${Math.max(6, selectedText.style.font_size / 4)}px`,
                  color: selectedText.style.color,
                  textShadow: selectedText.style.shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  WebkitTextStroke: selectedText.style.outline ? '0.5px black' : 'none',
                  backgroundColor: selectedText.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                  fontWeight: selectedText.style.bold ? 'bold' : 'normal',
                  fontStyle: selectedText.style.italic ? 'italic' : 'normal',
                  padding: selectedText.style.background ? '1px 2px' : '0',
                  borderRadius: selectedText.style.background ? '2px' : '0',
                  opacity: selectedText.style.opacity,
                  whiteSpace: 'nowrap',
                  maxWidth: '80%',
                  textAlign: selectedText.style.text_align || 'center'
                }}
              >
                {selectedText.content || 'Votre texte'}
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Position</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                {presetPositions.map((preset) => {
                  const isActive = selectedText.position.anchor === preset.anchor
                  return (
                    <button
                      key={preset.name}
                      className={`px-2 py-1 text-xs rounded border ${
                        isActive 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => updateText(selectedText.id, {
                        position: { ...selectedText.position, ...preset }
                      })}
                    >
                      {preset.name}
                    </button>
                  )
                })}
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>X</span>
                    <span>{selectedText.position.x}%</span>
                  </div>
                  <Input
                    type="range"
                    value={selectedText.position.x}
                    onChange={(e) => {
                      const newX = parseInt(e.target.value)
                      updateText(selectedText.id, {
                        position: { ...selectedText.position, x: newX, anchor: 'center' }
                      })
                    }}
                    min={0}
                    max={100}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Y</span>
                    <span>{selectedText.position.y}%</span>
                  </div>
                  <Input
                    type="range"
                    value={selectedText.position.y}
                    onChange={(e) => {
                      const newY = parseInt(e.target.value)
                      updateText(selectedText.id, {
                        position: { ...selectedText.position, y: newY, anchor: 'center' }
                      })
                    }}
                    min={0}
                    max={100}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Timing</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-600">Début</Label>
                <Input
                  type="number"
                  value={selectedText.start_time}
                  onChange={(e) => {
                    const start = Math.max(0, Math.min(parseFloat(e.target.value) || 0, totalDuration - 0.1))
                    const end = Math.max(start + 0.1, selectedText.end_time)
                    updateText(selectedText.id, { start_time: start, end_time: end })
                  }}
                  min={0}
                  max={totalDuration - 0.1}
                  step={0.1}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Fin</Label>
                <Input
                  type="number"
                  value={selectedText.end_time}
                  onChange={(e) => {
                    const end = Math.max(selectedText.start_time + 0.1, Math.min(parseFloat(e.target.value) || 0, totalDuration))
                    updateText(selectedText.id, { end_time: end })
                  }}
                  min={selectedText.start_time + 0.1}
                  max={totalDuration}
                  step={0.1}
                  className="text-sm"
                />
              </div>
              <div className="text-xs text-gray-500 text-center pt-1">
                Durée: {(selectedText.end_time - selectedText.start_time).toFixed(1)}s
              </div>
            </div>
          </div>
        </div>

        {/* Style */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Style</Label>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Police */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Police</Label>
              <Select
                value={selectedText.style.font_family}
                onValueChange={(value) => updateText(selectedText.id, {
                  style: { ...selectedText.style, font_family: value }
                })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taille */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Taille</Label>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 text-center">{selectedText.style.font_size}px</div>
                <Input
                  type="range"
                  value={selectedText.style.font_size}
                  onChange={(e) => updateText(selectedText.id, {
                    style: { ...selectedText.style, font_size: parseInt(e.target.value) }
                  })}
                  min={12}
                  max={72}
                  step={2}
                  className="w-full"
                />
              </div>
            </div>

            {/* Couleur */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Couleur</Label>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1">
                  {colors.slice(0, 4).map((color) => (
                    <button
                      key={color.name}
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, color: color.hex }
                      })}
                      className={`w-6 h-6 rounded border-2 ${
                        selectedText.style.color === color.hex 
                          ? 'border-blue-500' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={selectedText.style.color}
                  onChange={(e) => updateText(selectedText.id, {
                    style: { ...selectedText.style, color: e.target.value }
                  })}
                  className="w-full h-6"
                />
              </div>
            </div>

            {/* Effets */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Effets</Label>
              <div className="grid grid-cols-2 gap-1">
                <ToggleButton
                  active={selectedText.style.bold}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, bold: !selectedText.style.bold }
                  })}
                >
                  <strong>B</strong>
                </ToggleButton>
                <ToggleButton
                  active={selectedText.style.italic}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, italic: !selectedText.style.italic }
                  })}
                >
                  <em>I</em>
                </ToggleButton>
                <ToggleButton
                  active={selectedText.style.shadow}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, shadow: !selectedText.style.shadow }
                  })}
                >
                  S
                </ToggleButton>
                <ToggleButton
                  active={selectedText.style.outline}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, outline: !selectedText.style.outline }
                  })}
                >
                  O
                </ToggleButton>
              </div>
            </div>

            {/* Alignement */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Alignement</Label>
              <div className="grid grid-cols-3 gap-1">
                <ToggleButton
                  active={selectedText.style.text_align === 'left'}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, text_align: 'left' }
                  })}
                >
                  <AlignLeft className="w-3 h-3" />
                </ToggleButton>
                <ToggleButton
                  active={selectedText.style.text_align === 'center'}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, text_align: 'center' }
                  })}
                >
                  <AlignCenter className="w-3 h-3" />
                </ToggleButton>
                <ToggleButton
                  active={selectedText.style.text_align === 'right'}
                  onClick={() => updateText(selectedText.id, {
                    style: { ...selectedText.style, text_align: 'right' }
                  })}
                >
                  <AlignRight className="w-3 h-3" />
                </ToggleButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}