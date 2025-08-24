'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Type, 
  Palette, 
  Wand2, 
  Plus, 
  Trash2, 
  Clock, 
  Move, 
  Eye,
  Lightbulb,
  Copy,
  RotateCcw,
  Edit
} from 'lucide-react'

export interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: {
    x: number // Position horizontale (0-100%)  
    y: number // Position verticale (0-100%)
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

interface Font {
  id: string
  name: string
  display_name: string
  style: string
  description: string
}

interface Color {
  name: string
  hex: string
  description: string
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

interface TimelineTextEditorProps {
  texts: TextOverlay[]
  totalDuration: number
  videoSlots?: VideoSlot[]
  selectedTextId?: string | null
  onSelectedTextChange?: (textId: string | null) => void
  onTextsChange: (texts: TextOverlay[]) => void
  onGenerateSuggestions?: () => Promise<string[]>
}

export function TimelineTextEditor({ 
  texts, 
  totalDuration,
  videoSlots = [],
  selectedTextId = null,
  onSelectedTextChange,
  onTextsChange, 
  onGenerateSuggestions 
}: TimelineTextEditorProps) {
  const [fonts, setFonts] = useState<Font[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    fetchFontsData()
  }, [])

  const fetchFontsData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/text/fonts')
      const data = await response.json()
      setFonts(data.fonts || [])
      setColors(data.colors || [])
    } catch (error) {
      console.error('Error fetching fonts:', error)
    }
  }

  const selectedText = texts.find(t => t.id === selectedTextId)

  const createNewText = (): TextOverlay => ({
    id: Date.now().toString(),
    content: "Nouveau texte",
    start_time: 0,
    end_time: Math.min(3, totalDuration),
    position: {
      x: 50,
      y: 80,
      anchor: 'bottom-center'
    },
    style: {
      font_family: fonts[0]?.id || 'helvetica',
      font_size: 48,
      color: '#FFFFFF',
      shadow: true,
      outline: false,
      background: false,
      bold: false,
      italic: false,
      opacity: 1
    }
  })

  const addText = () => {
    const newText = createNewText()
    onTextsChange([...texts, newText])
    onSelectedTextChange?.(newText.id)
  }

  const duplicateText = (textId: string) => {
    const textToDuplicate = texts.find(t => t.id === textId)
    if (!textToDuplicate) return

    const newText = {
      ...textToDuplicate,
      id: Date.now().toString(),
      content: textToDuplicate.content + ' (copie)',
      start_time: Math.min(textToDuplicate.end_time, totalDuration - 1),
      end_time: Math.min(textToDuplicate.end_time + (textToDuplicate.end_time - textToDuplicate.start_time), totalDuration)
    }
    onTextsChange([...texts, newText])
    onSelectedTextChange?.(newText.id)
  }

  const deleteText = (textId: string) => {
    onTextsChange(texts.filter(t => t.id !== textId))
    if (selectedTextId === textId) {
      onSelectedTextChange?.(null)
    }
  }

  const updateText = (textId: string, updates: Partial<TextOverlay>) => {
    onTextsChange(texts.map(t => t.id === textId ? { ...t, ...updates } : t))
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

  const applySuggestion = (suggestion: string) => {
    if (selectedText) {
      updateText(selectedText.id, { content: suggestion })
    } else {
      const newText = createNewText()
      newText.content = suggestion
      onTextsChange([...texts, newText])
      onSelectedTextChange?.(newText.id)
    }
  }

  const getTimelinePosition = (startTime: number, duration: number) => {
    const left = (startTime / totalDuration) * 100
    const width = (duration / totalDuration) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  const presetPositions = [
    { name: 'Haut centre', anchor: 'top-center' as const, x: 50, y: 20 },
    { name: 'Centre', anchor: 'center' as const, x: 50, y: 50 },
    { name: 'Bas centre', anchor: 'bottom-center' as const, x: 50, y: 80 },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Type className="w-5 h-5 mr-2" />
            Éditeur de Texte Timeline
          </CardTitle>
          <div className="flex gap-2">
            {onGenerateSuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={loadingSuggestions}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                {loadingSuggestions ? 'Génération...' : 'Suggestions'}
              </Button>
            )}
            <Button onClick={addText} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nouveau Texte
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Aperçu rapide des textes */}
        {texts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Textes sur la vidéo ({texts.length})</Label>
            <div className="flex flex-wrap gap-2">
              {texts.map((text) => (
                <button
                  key={text.id}
                  onClick={() => onSelectedTextChange?.(text.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTextId === text.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {text.content} ({text.start_time}s-{text.end_time}s)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Liste des textes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Textes ({texts.length})</Label>
          {texts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <Type className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Aucun texte ajouté</p>
              <p className="text-sm">Cliquez sur "Nouveau Texte" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {texts.map((text, index) => (
                <div
                  key={text.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTextId === text.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelectedTextChange?.(text.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium truncate">{text.content}</div>
                      <div className="text-xs text-gray-500">
                        {text.start_time}s → {text.end_time}s
                        {' • '}
                        {text.position.anchor} ({text.position.x}%, {text.position.y}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateText(text.id)
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteText(text.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Lightbulb className="w-4 h-4 mr-1" />
              Suggestions de texte
            </Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className="p-2 text-left text-sm border rounded hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Éditeur détaillé du texte sélectionné */}
        {selectedText && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-4 flex items-center">
              <Edit className="w-4 h-4 mr-1" />
              Édition du texte sélectionné
            </h3>

            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="timing">
                  <Clock className="w-4 h-4 mr-1" />
                  Timing
                </TabsTrigger>
                <TabsTrigger value="position">
                  <Move className="w-4 h-4 mr-1" />
                  Position
                </TabsTrigger>
                <TabsTrigger value="style">
                  <Palette className="w-4 h-4 mr-1" />
                  Style
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label className="text-sm">Texte</Label>
                  <Textarea
                    value={selectedText.content}
                    onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                    placeholder="Entrez votre texte..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="timing" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Début (s)</Label>
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
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Fin (s)</Label>
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
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Durée: {(selectedText.end_time - selectedText.start_time).toFixed(1)}s
                </div>
              </TabsContent>

              <TabsContent value="position" className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Positions rapides</Label>
                  <div className="flex gap-2 mb-4">
                    {presetPositions.map((preset) => {
                      // Vérifie si la position actuelle correspond exactement au preset
                      const isActive = selectedText.position.anchor === preset.anchor && 
                                     selectedText.position.x === preset.x && 
                                     selectedText.position.y === preset.y
                      return (
                        <Button
                          key={preset.name}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateText(selectedText.id, {
                            position: { ...selectedText.position, ...preset }
                          })}
                        >
                          {preset.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Position X - Horizontale ({selectedText.position.x}%)</Label>
                    <Input
                      type="range"
                      value={selectedText.position.x}
                      onChange={(e) => {
                        const newX = parseInt(e.target.value)
                        // Réinitialise l'anchor quand on ajuste manuellement
                        updateText(selectedText.id, {
                          position: { 
                            ...selectedText.position, 
                            x: newX,
                            anchor: 'center' // Position neutre quand on ajuste manuellement
                          }
                        })
                      }}
                      min={0}
                      max={100}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Gauche</span>
                      <span>Centre</span>
                      <span>Droite</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Position Y - Verticale ({selectedText.position.y}%)</Label>
                    <Input
                      type="range"
                      value={selectedText.position.y}
                      onChange={(e) => {
                        const newY = parseInt(e.target.value)
                        // Réinitialise l'anchor quand on ajuste manuellement
                        updateText(selectedText.id, {
                          position: { 
                            ...selectedText.position, 
                            y: newY,
                            anchor: 'center' // Position neutre quand on ajuste manuellement
                          }
                        })
                      }}
                      min={0}
                      max={100}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Haut</span>
                      <span>Centre</span>
                      <span>Bas</span>
                    </div>
                  </div>
                </div>

                {/* Aperçu de position avec simulation vidéo */}
                <div className="bg-black rounded aspect-[9/16] relative overflow-hidden max-w-32 mx-auto">
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${selectedText.position.x}%`,
                      top: `${selectedText.position.y}%`,
                      fontFamily: fonts.find(f => f.id === selectedText.style.font_family)?.display_name || 'Helvetica',
                      fontSize: '8px',
                      color: selectedText.style.color,
                      textShadow: selectedText.style.shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                      WebkitTextStroke: selectedText.style.outline ? '0.5px black' : 'none',
                      backgroundColor: selectedText.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                      fontWeight: selectedText.style.bold ? 'bold' : 'normal',
                      fontStyle: selectedText.style.italic ? 'italic' : 'normal',
                      padding: selectedText.style.background ? '2px 4px' : '0',
                      borderRadius: selectedText.style.background ? '2px' : '0',
                      opacity: selectedText.style.opacity,
                      whiteSpace: 'nowrap',
                      maxWidth: '80%',
                      textAlign: 'center'
                    }}
                  >
                    {selectedText.content || 'Aperçu du texte'}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Police</Label>
                    <Select
                      value={selectedText.style.font_family}
                      onValueChange={(value) => updateText(selectedText.id, {
                        style: { ...selectedText.style, font_family: value }
                      })}
                    >
                      <SelectTrigger className="mt-1">
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
                  <div>
                    <Label className="text-sm">Taille</Label>
                    <Input
                      type="number"
                      value={selectedText.style.font_size}
                      onChange={(e) => updateText(selectedText.id, {
                        style: { ...selectedText.style, font_size: parseInt(e.target.value) || 24 }
                      })}
                      min={12}
                      max={120}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Couleur</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => updateText(selectedText.id, {
                          style: { ...selectedText.style, color: color.hex }
                        })}
                        className={`w-8 h-8 rounded border-2 ${
                          selectedText.style.color === color.hex ? 'border-blue-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Effets</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedText.style.shadow ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, shadow: !selectedText.style.shadow }
                      })}
                    >
                      Ombre
                    </Button>
                    <Button
                      variant={selectedText.style.outline ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, outline: !selectedText.style.outline }
                      })}
                    >
                      Contour
                    </Button>
                    <Button
                      variant={selectedText.style.background ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, background: !selectedText.style.background }
                      })}
                    >
                      Fond
                    </Button>
                    <Button
                      variant={selectedText.style.bold ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, bold: !selectedText.style.bold }
                      })}
                    >
                      Gras
                    </Button>
                    <Button
                      variant={selectedText.style.italic ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateText(selectedText.id, {
                        style: { ...selectedText.style, italic: !selectedText.style.italic }
                      })}
                    >
                      Italique
                    </Button>
                  </div>
                </div>

                {/* Aperçu du style */}
                <div className="bg-gray-900 rounded p-4 text-center">
                  <div
                    style={{
                      fontFamily: fonts.find(f => f.id === selectedText.style.font_family)?.display_name || 'Helvetica',
                      fontSize: `${Math.max(12, selectedText.style.font_size / 3)}px`,
                      color: selectedText.style.color,
                      textShadow: selectedText.style.shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                      WebkitTextStroke: selectedText.style.outline ? '0.5px black' : 'none',
                      backgroundColor: selectedText.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
                      fontWeight: selectedText.style.bold ? 'bold' : 'normal',
                      fontStyle: selectedText.style.italic ? 'italic' : 'normal',
                      padding: selectedText.style.background ? '4px 8px' : '0',
                      borderRadius: selectedText.style.background ? '4px' : '0',
                      opacity: selectedText.style.opacity,
                      display: 'inline-block'
                    }}
                  >
                    {selectedText.content || 'Aperçu du texte'}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}