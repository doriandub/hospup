'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Shuffle, 
  Type, 
  Palette, 
  Move,
  Sparkles,
  Copy,
  Trash2,
  Plus,
  Settings
} from 'lucide-react'

interface TextItem {
  id: string
  content: string
  start_time: number
  position: 'top' | 'center' | 'bottom'
  font_family: string
  font_size: number
  color: string
  has_shadow: boolean
  has_outline: boolean
}

interface TextGeneratorProps {
  language: string
  propertyName: string
  onTextsChange: (texts: TextItem[]) => void
  initialTexts?: TextItem[]
}

const TEXT_SUGGESTIONS = {
  fr: [
    "Toi et moi ici",
    "Escapade parfaite",
    "Moments magiques",
    "Paradis trouvé",
    "Détente absolue",
    "Instants précieux",
    "Pur bonheur",
    "Vie de rêve",
    "Comme au cinéma",
    "C'est ça le luxe"
  ],
  en: [
    "You and me here",
    "Perfect getaway", 
    "Magic moments",
    "Paradise found",
    "Pure relaxation",
    "Precious moments",
    "Pure happiness",
    "Dream life",
    "Like in movies",
    "This is luxury"
  ],
  es: [
    "Tú y yo aquí",
    "Escapada perfecta",
    "Momentos mágicos", 
    "Paraíso encontrado",
    "Pura relajación",
    "Momentos preciosos",
    "Pura felicidad",
    "Vida de ensueño",
    "Como en las películas",
    "Esto es lujo"
  ],
  it: [
    "Io e te qui",
    "Fuga perfetta",
    "Momenti magici",
    "Paradiso trovato", 
    "Puro relax",
    "Momenti preziosi",
    "Pura felicità",
    "Vita da sogno",
    "Come nei film",
    "Questo è lusso"
  ],
  de: [
    "Du und ich hier",
    "Perfekte Auszeit",
    "Magische Momente",
    "Paradies gefunden",
    "Pure Entspannung",
    "Kostbare Momente", 
    "Pures Glück",
    "Traumleben",
    "Wie im Film",
    "Das ist Luxus"
  ]
}

const FONTS = [
  { name: 'Modern Sans', value: 'system-ui' },
  { name: 'Elegant Serif', value: 'Georgia' },
  { name: 'Bold Impact', value: 'Impact' },
  { name: 'Script', value: 'cursive' },
  { name: 'Monospace', value: 'monospace' }
]

const COLORS = [
  '#FFFFFF', '#000000', '#FFD700', '#FF6B6B', '#4ECDC4', 
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
]

export function TextGenerator({ language, propertyName, onTextsChange, initialTexts = [] }: TextGeneratorProps) {
  const [texts, setTexts] = useState<TextItem[]>(initialTexts)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

  const suggestions = TEXT_SUGGESTIONS[language] || TEXT_SUGGESTIONS.fr

  useEffect(() => {
    onTextsChange(texts)
  }, [texts, onTextsChange])

  const generateRandomText = () => {
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    addText(randomSuggestion)
  }

  const addText = (content: string = "Nouveau texte") => {
    const newText: TextItem = {
      id: Date.now().toString(),
      content,
      start_time: texts.length * 3, // Décalage de 3 secondes entre chaque texte
      position: 'center',
      font_family: 'system-ui',
      font_size: 24,
      color: '#FFFFFF',
      has_shadow: true,
      has_outline: false
    }
    setTexts([...texts, newText])
    setSelectedTextId(newText.id)
  }

  const updateText = (id: string, updates: Partial<TextItem>) => {
    setTexts(texts.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ))
  }

  const deleteText = (id: string) => {
    setTexts(texts.filter(text => text.id !== id))
    if (selectedTextId === id) {
      setSelectedTextId(null)
    }
  }

  const selectedText = texts.find(text => text.id === selectedTextId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Type className="w-6 h-6 mr-2 text-primary" />
          Générateur de Textes
        </h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateRandomText}>
            <Shuffle className="w-4 h-4 mr-2" />
            Idée Aléatoire
          </Button>
          <Button onClick={() => addText()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Texte
          </Button>
        </div>
      </div>

      {/* Quick Suggestions */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Suggestions populaires:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => addText(suggestion)}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mobile Phone Preview */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Aperçu Mobile:</p>
          <div className="bg-black rounded-3xl p-2 w-64 mx-auto">
            <div className="bg-gray-900 rounded-2xl aspect-[9/16] relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-70" />
              
              {/* Property name overlay */}
              <div className="absolute top-4 left-4 right-4">
                <p className="text-white text-xs opacity-75">@{propertyName.toLowerCase().replace(/\s+/g, '')}</p>
              </div>
              
              {/* Text overlays */}
              {texts.map((text) => (
                <div
                  key={text.id}
                  className={`absolute left-4 right-4 text-center cursor-pointer transition-all duration-200 ${
                    selectedTextId === text.id ? 'ring-2 ring-white ring-opacity-50' : ''
                  } ${
                    text.position === 'top' ? 'top-16' :
                    text.position === 'center' ? 'top-1/2 -translate-y-1/2' :
                    'bottom-16'
                  }`}
                  onClick={() => setSelectedTextId(text.id)}
                  style={{
                    fontFamily: text.font_family,
                    fontSize: `${text.font_size * 0.8}px`,
                    color: text.color,
                    textShadow: text.has_shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                    WebkitTextStroke: text.has_outline ? '1px rgba(0,0,0,0.8)' : 'none'
                  }}
                >
                  <div className="px-2 py-1 rounded">
                    {text.content}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {text.start_time}s
                  </div>
                </div>
              ))}
              
              {/* Placeholder if no texts */}
              {texts.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center opacity-50">
                    <Type className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Ajoutez vos textes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text List & Editor */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Vos textes ({texts.length}):</p>
          
          {/* Text List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {texts.map((text, index) => (
              <div
                key={text.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTextId === text.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setSelectedTextId(text.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{text.content}</p>
                    <p className="text-xs text-gray-500">
                      {text.start_time}s • {text.position} • {text.font_family}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteText(text.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Text Editor */}
          {selectedText && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <p className="font-medium text-gray-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Personnaliser le texte
              </p>
              
              <div className="space-y-4">
                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu:</label>
                  <input
                    type="text"
                    value={selectedText.content}
                    onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Timing & Position */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Début (s):</label>
                    <input
                      type="number"
                      value={selectedText.start_time}
                      onChange={(e) => updateText(selectedText.id, { start_time: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position:</label>
                    <select
                      value={selectedText.position}
                      onChange={(e) => updateText(selectedText.id, { position: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="top">Haut</option>
                      <option value="center">Centre</option>
                      <option value="bottom">Bas</option>
                    </select>
                  </div>
                </div>

                {/* Font & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Police:</label>
                    <select
                      value={selectedText.font_family}
                      onChange={(e) => updateText(selectedText.id, { font_family: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {FONTS.map(font => (
                        <option key={font.value} value={font.value}>{font.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taille:</label>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={selectedText.font_size}
                      onChange={(e) => updateText(selectedText.id, { font_size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 text-center">{selectedText.font_size}px</p>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur:</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateText(selectedText.id, { color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedText.color === color ? 'border-primary' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Effects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effets:</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedText.has_shadow}
                        onChange={(e) => updateText(selectedText.id, { has_shadow: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm">Ombre</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedText.has_outline}
                        onChange={(e) => updateText(selectedText.id, { has_outline: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm">Contour</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}