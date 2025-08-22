'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TextCustomizationProps {
  value: {
    text_font?: string
    text_color?: string
    text_size?: string
    text_shadow?: boolean
    text_outline?: boolean
    text_background?: boolean
  }
  onChange: (settings: any) => void
  propertyName?: string
}

// Basic fonts available on most systems
const FONTS = [
  { id: 'helvetica', name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { id: 'arial', name: 'Arial', family: 'Arial, sans-serif' },
  { id: 'times', name: 'Times New Roman', family: 'Times New Roman, serif' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
]

// Color palette for hospitality industry
const COLORS = [
  { name: 'Blanc', value: '#FFFFFF' },
  { name: 'Noir', value: '#000000' },
  { name: 'Or', value: '#D4AF37' },
  { name: 'Bleu', value: '#2563EB' },
  { name: 'Rouge', value: '#DC2626' },
]

const SIZES = [
  { id: 'small', name: 'Petit' },
  { id: 'medium', name: 'Moyen' },
  { id: 'large', name: 'Grand' },
]

export function TextCustomizationSimple({ value, onChange, propertyName = "Votre propriété" }: TextCustomizationProps) {
  const currentFont = FONTS.find(f => f.id === value.text_font) || FONTS[0]
  const currentColor = value.text_color || '#FFFFFF'
  const currentSize = value.text_size || 'medium'

  const handleChange = (field: string, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnalisation du texte</CardTitle>
        <CardDescription>
          Personnalisez l'apparence du texte pour vos vidéos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div 
            style={{
              fontFamily: currentFont.family,
              color: currentColor,
              fontSize: currentSize === 'small' ? '16px' : currentSize === 'medium' ? '20px' : '24px',
              textShadow: value.text_shadow ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none',
              WebkitTextStroke: value.text_outline ? '1px black' : 'none',
              backgroundColor: value.text_background ? 'rgba(0,0,0,0.5)' : 'transparent',
              padding: value.text_background ? '8px 16px' : '0',
              borderRadius: value.text_background ? '4px' : '0',
              display: 'inline-block'
            }}
          >
            {propertyName}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Font Selection */}
          <div className="space-y-2">
            <Label>Police</Label>
            <Select value={value.text_font || 'helvetica'} onValueChange={(val) => handleChange('text_font', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une police" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(font => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.family }}>{font.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <Label>Taille</Label>
            <Select value={currentSize} onValueChange={(val) => handleChange('text_size', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la taille" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map(size => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3">
          <Label>Couleur du texte</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                className={`w-10 h-10 rounded-lg border-2 ${
                  currentColor === color.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleChange('text_color', color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <Label>Effets</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.text_shadow || false}
                onChange={(e) => handleChange('text_shadow', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Ombre</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.text_outline || false}
                onChange={(e) => handleChange('text_outline', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Contour</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.text_background || false}
                onChange={(e) => handleChange('text_background', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Arrière-plan</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}