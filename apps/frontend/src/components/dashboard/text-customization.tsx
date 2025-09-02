'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Type, Palette, Wand2, Eye } from 'lucide-react'

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

interface Size {
  relative: number
  description: string
}

interface TextCustomizationProps {
  value: {
    text_font: string
    text_color: string
    text_size: string
    text_shadow: boolean
    text_outline: boolean
    text_background: boolean
  }
  onChange: (settings: any) => void
  propertyName?: string
}

export function TextCustomization({ value, onChange, propertyName = "Votre propriété" }: TextCustomizationProps) {
  const [fonts, setFonts] = useState<Font[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [sizes, setSizes] = useState<Record<string, Size>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFontsData()
  }, [])

  const fetchFontsData = async () => {
    try {
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/text/fonts')
      const data = await response.json()
      setFonts(data.fonts || [])
      setColors(data.colors || [])
      setSizes(data.sizes || {})
    } catch (error) {
      console.error('Error fetching fonts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFontChange = (fontId: string) => {
    onChange({ ...value, text_font: fontId })
  }

  const handleColorChange = (color: string) => {
    onChange({ ...value, text_color: color })
  }

  const handleSizeChange = (size: string) => {
    onChange({ ...value, text_size: size })
  }

  const handleEffectChange = (effect: string, enabled: boolean) => {
    onChange({ ...value, [effect]: enabled })
  }

  const getPreviewStyle = () => {
    const selectedFont = fonts.find(f => f.id === value.text_font)
    const selectedSize = sizes[value.text_size]
    
    return {
      fontFamily: selectedFont?.display_name || 'Helvetica',
      color: value.text_color,
      fontSize: selectedSize ? `${selectedSize.relative * 40}px` : '24px',
      textShadow: value.text_shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
      textStroke: value.text_outline ? '1px black' : 'none',
      WebkitTextStroke: value.text_outline ? '1px black' : 'none',
      backgroundColor: value.text_background ? 'rgba(0,0,0,0.5)' : 'transparent',
      padding: value.text_background ? '8px 16px' : '0',
      borderRadius: value.text_background ? '4px' : '0',
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Type className="w-5 h-5 mr-2" />
            Personnalisation du texte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Chargement des polices...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Type className="w-5 h-5 mr-2" />
          Personnalisation du texte
        </CardTitle>
        <p className="text-sm text-gray-600">
          Personnalisez l'apparence des textes dans vos vidéos générées
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="font" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="font" className="flex items-center">
              <Type className="w-4 h-4 mr-1" />
              Police
            </TabsTrigger>
            <TabsTrigger value="color" className="flex items-center">
              <Palette className="w-4 h-4 mr-1" />
              Couleur
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center">
              <Wand2 className="w-4 h-4 mr-1" />
              Effets
            </TabsTrigger>
          </TabsList>

          {/* Preview */}
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div style={getPreviewStyle()}>
              Bienvenue au {propertyName}
            </div>
            <p className="text-xs text-gray-400 mt-2">Aperçu du texte</p>
          </div>

          <TabsContent value="font" className="space-y-4">
            <div className="space-y-2">
              <Label>Police d'écriture</Label>
              <Select value={value.text_font} onValueChange={handleFontChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une police" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <div className="flex flex-col">
                        <span style={{ fontFamily: font.display_name }}>
                          {font.display_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {font.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille du texte</Label>
              <Select value={value.text_size} onValueChange={handleSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une taille" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sizes).map(([size, config]) => (
                    <SelectItem key={size} value={size}>
                      <div className="flex flex-col">
                        <span className="capitalize">{size.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">
                          {config.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="color" className="space-y-4">
            <div className="space-y-2">
              <Label>Couleur du texte</Label>
              <div className="grid grid-cols-4 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => handleColorChange(color.hex)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      value.text_color === color.hex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded mb-2"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="text-xs font-medium">{color.name}</div>
                    <div className="text-xs text-gray-500">{color.hex}</div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Ombre portée</h4>
                  <p className="text-sm text-gray-600">Ajoute une ombre derrière le texte</p>
                </div>
                <Button
                  variant={value.text_shadow ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEffectChange('text_shadow', !value.text_shadow)}
                >
                  {value.text_shadow ? 'Activée' : 'Désactivée'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Contour</h4>
                  <p className="text-sm text-gray-600">Ajoute un contour autour des lettres</p>
                </div>
                <Button
                  variant={value.text_outline ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEffectChange('text_outline', !value.text_outline)}
                >
                  {value.text_outline ? 'Activé' : 'Désactivé'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Fond coloré</h4>
                  <p className="text-sm text-gray-600">Ajoute un fond semi-transparent</p>
                </div>
                <Button
                  variant={value.text_background ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEffectChange('text_background', !value.text_background)}
                >
                  {value.text_background ? 'Activé' : 'Désactivé'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}