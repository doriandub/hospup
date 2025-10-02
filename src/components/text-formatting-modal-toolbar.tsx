'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Underline,
  Space,
  EyeOff,
  Zap,
  Layers,
  Move3d
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextStyle {
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

interface TextFormattingModalToolbarProps {
  textStyle: TextStyle
  onStyleChange: (style: TextStyle) => void
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

const fontSizes = [12, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72, 80, 96]

const colorPresets = [
  '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'
]

const shadowPresets = [
  { name: 'Aucune', value: 'none' },
  { name: 'Légère', value: '1px 1px 2px rgba(0,0,0,0.5)' },
  { name: 'Normale', value: '2px 2px 4px rgba(0,0,0,0.7)' },
  { name: 'Forte', value: '3px 3px 6px rgba(0,0,0,0.8)' },
  { name: 'Très forte', value: '4px 4px 8px rgba(0,0,0,0.9)' }
]

export function TextFormattingModalToolbar({
  textStyle,
  onStyleChange
}: TextFormattingModalToolbarProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const updateStyle = (updates: Partial<TextStyle>) => {
    onStyleChange({ ...textStyle, ...updates })
  }

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Font Family */}
        <div className="flex items-center gap-1">
          <Type className="w-4 h-4 text-gray-500" />
          <Select
            value={textStyle.fontFamily}
            onValueChange={(value) => updateStyle({ fontFamily: value })}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <Select
          value={textStyle.font_size.toString()}
          onValueChange={(value) => updateStyle({ font_size: parseInt(value) })}
        >
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Style */}
        <Button
          size="sm"
          variant={textStyle.fontWeight === 'bold' ? 'default' : 'outline'}
          onClick={() => updateStyle({ fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className="h-8 w-8 p-0"
        >
          <Bold className="w-3 h-3" />
        </Button>

        <Button
          size="sm"
          variant={textStyle.fontStyle === 'italic' ? 'default' : 'outline'}
          onClick={() => updateStyle({ fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className="h-8 w-8 p-0"
        >
          <Italic className="w-3 h-3" />
        </Button>

        <Button
          size="sm"
          variant={textStyle.textDecoration === 'underline' ? 'default' : 'outline'}
          onClick={() => updateStyle({ textDecoration: textStyle.textDecoration === 'underline' ? 'none' : 'underline' })}
          className="h-8 w-8 p-0"
        >
          <Underline className="w-3 h-3" />
        </Button>

        {/* Alignment */}
        <Button
          size="sm"
          variant={textStyle.textAlign === 'left' ? 'default' : 'outline'}
          onClick={() => updateStyle({ textAlign: 'left' })}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="w-3 h-3" />
        </Button>

        <Button
          size="sm"
          variant={textStyle.textAlign === 'center' ? 'default' : 'outline'}
          onClick={() => updateStyle({ textAlign: 'center' })}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="w-3 h-3" />
        </Button>

        <Button
          size="sm"
          variant={textStyle.textAlign === 'right' ? 'default' : 'outline'}
          onClick={() => updateStyle({ textAlign: 'right' })}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="w-3 h-3" />
        </Button>

        {/* Panel Toggle Buttons */}
        <Button
          size="sm"
          variant={activePanel === 'color' ? 'default' : 'outline'}
          onClick={() => togglePanel('color')}
          className="h-8 px-2 gap-1"
        >
          <Palette className="w-3 h-3" />
          <span className="text-xs">Couleur</span>
        </Button>

        <Button
          size="sm"
          variant={activePanel === 'effects' ? 'default' : 'outline'}
          onClick={() => togglePanel('effects')}
          className="h-8 px-2 gap-1"
        >
          <Zap className="w-3 h-3" />
          <span className="text-xs">Effets</span>
        </Button>

        <Button
          size="sm"
          variant={activePanel === 'spacing' ? 'default' : 'outline'}
          onClick={() => togglePanel('spacing')}
          className="h-8 px-2 gap-1"
        >
          <Space className="w-3 h-3" />
          <span className="text-xs">Espacement</span>
        </Button>
      </div>

      {/* Panel Content */}
      {activePanel === 'color' && (
        <div className="border rounded-lg p-3 bg-white space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Couleur du texte</Label>
            <div className="grid grid-cols-8 gap-2 mb-2">
              {colorPresets.map((color) => (
                <Button
                  key={color}
                  size="sm"
                  variant={textStyle.color === color ? 'default' : 'outline'}
                  onClick={() => updateStyle({ color })}
                  className="h-8 w-8 p-0"
                  style={{ backgroundColor: color === textStyle.color ? color : undefined }}
                >
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              ))}
            </div>
            <Input
              type="color"
              value={textStyle.color}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="h-8"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Couleur de fond</Label>
            <div className="grid grid-cols-8 gap-2 mb-2">
              <Button
                size="sm"
                variant={textStyle.backgroundColor === 'transparent' ? 'default' : 'outline'}
                onClick={() => updateStyle({ backgroundColor: 'transparent' })}
                className="h-8 w-8 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
              {colorPresets.map((color) => (
                <Button
                  key={color}
                  size="sm"
                  variant={textStyle.backgroundColor === color ? 'default' : 'outline'}
                  onClick={() => updateStyle({ backgroundColor: color })}
                  className="h-8 w-8 p-0"
                >
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              ))}
            </div>
            <Input
              type="color"
              value={textStyle.backgroundColor === 'transparent' ? '#000000' : textStyle.backgroundColor}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="h-8"
            />
          </div>
        </div>
      )}

      {activePanel === 'effects' && (
        <div className="border rounded-lg p-3 bg-white space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Ombre du texte</Label>
            <div className="grid grid-cols-2 gap-2">
              {shadowPresets.map((shadow) => (
                <Button
                  key={shadow.value}
                  size="sm"
                  variant={textStyle.textShadow === shadow.value ? 'default' : 'outline'}
                  onClick={() => updateStyle({ textShadow: shadow.value })}
                  className="text-xs h-8"
                >
                  {shadow.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Contour du texte</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={textStyle.webkitTextStroke === 'none' ? 'default' : 'outline'}
                onClick={() => updateStyle({ webkitTextStroke: 'none' })}
                className="text-xs h-8"
              >
                Aucun
              </Button>
              <Button
                size="sm"
                variant={textStyle.webkitTextStroke === '1px black' ? 'default' : 'outline'}
                onClick={() => updateStyle({ webkitTextStroke: '1px black' })}
                className="text-xs h-8"
              >
                Fin noir
              </Button>
              <Button
                size="sm"
                variant={textStyle.webkitTextStroke === '2px black' ? 'default' : 'outline'}
                onClick={() => updateStyle({ webkitTextStroke: '2px black' })}
                className="text-xs h-8"
              >
                Épais noir
              </Button>
              <Button
                size="sm"
                variant={textStyle.webkitTextStroke === '1px white' ? 'default' : 'outline'}
                onClick={() => updateStyle({ webkitTextStroke: '1px white' })}
                className="text-xs h-8"
              >
                Fin blanc
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Opacité</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={textStyle.opacity}
              onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
              className="h-8"
            />
            <div className="text-xs text-gray-500 mt-1">{Math.round((textStyle.opacity || 1) * 100)}%</div>
          </div>
        </div>
      )}

      {activePanel === 'spacing' && (
        <div className="border rounded-lg p-3 bg-white space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Espacement des lettres</Label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button
                size="sm"
                variant={textStyle.letterSpacing === 'normal' ? 'default' : 'outline'}
                onClick={() => updateStyle({ letterSpacing: 'normal' })}
                className="text-xs h-8"
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={textStyle.letterSpacing === '1px' ? 'default' : 'outline'}
                onClick={() => updateStyle({ letterSpacing: '1px' })}
                className="text-xs h-8"
              >
                Serré
              </Button>
              <Button
                size="sm"
                variant={textStyle.letterSpacing === '3px' ? 'default' : 'outline'}
                onClick={() => updateStyle({ letterSpacing: '3px' })}
                className="text-xs h-8"
              >
                Large
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Hauteur de ligne</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={textStyle.lineHeight === '1' ? 'default' : 'outline'}
                onClick={() => updateStyle({ lineHeight: '1' })}
                className="text-xs h-8"
              >
                Serré
              </Button>
              <Button
                size="sm"
                variant={textStyle.lineHeight === 'normal' ? 'default' : 'outline'}
                onClick={() => updateStyle({ lineHeight: 'normal' })}
                className="text-xs h-8"
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={textStyle.lineHeight === '1.5' ? 'default' : 'outline'}
                onClick={() => updateStyle({ lineHeight: '1.5' })}
                className="text-xs h-8"
              >
                Large
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Padding</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                size="sm"
                variant={textStyle.padding === '0' ? 'default' : 'outline'}
                onClick={() => updateStyle({ padding: '0' })}
                className="text-xs h-8"
              >
                Aucun
              </Button>
              <Button
                size="sm"
                variant={textStyle.padding === '4px' ? 'default' : 'outline'}
                onClick={() => updateStyle({ padding: '4px' })}
                className="text-xs h-8"
              >
                Petit
              </Button>
              <Button
                size="sm"
                variant={textStyle.padding === '8px' ? 'default' : 'outline'}
                onClick={() => updateStyle({ padding: '8px' })}
                className="text-xs h-8"
              >
                Moyen
              </Button>
              <Button
                size="sm"
                variant={textStyle.padding === '12px' ? 'default' : 'outline'}
                onClick={() => updateStyle({ padding: '12px' })}
                className="text-xs h-8"
              >
                Grand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}