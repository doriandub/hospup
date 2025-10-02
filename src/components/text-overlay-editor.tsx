'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, Type, Palette, Clock, Move } from 'lucide-react'
import { TextFormattingModalToolbar } from './text-formatting-modal-toolbar'

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

interface TextOverlayEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (textOverlay: TextOverlay) => void
  editingText?: TextOverlay | null
  totalDuration?: number
}


const positionPresets = [
  { name: 'Centre', value: { x: 50, y: 50 } },
  { name: 'Haut Centre', value: { x: 50, y: 20 } },
  { name: 'Bas Centre', value: { x: 50, y: 80 } },
  { name: 'Haut Gauche', value: { x: 20, y: 20 } },
  { name: 'Haut Droite', value: { x: 80, y: 20 } },
  { name: 'Bas Gauche', value: { x: 20, y: 80 } },
  { name: 'Bas Droite', value: { x: 80, y: 80 } },
]

export function TextOverlayEditor({
  isOpen,
  onClose,
  onSave,
  editingText,
  totalDuration = 30
}: TextOverlayEditorProps) {
  const [content, setContent] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(3)
  const [position, setPosition] = useState({ x: 50, y: 50 })

  // Style states
  const [textStyle, setTextStyle] = useState({
    color: '#ffffff',
    font_size: 24,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    webkitTextStroke: 'none',
    backgroundColor: 'transparent',
    padding: '0',
    borderRadius: '0',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    opacity: 1
  })

  // Reset form when opening or editing
  useEffect(() => {
    if (isOpen) {
      if (editingText) {
        setContent(editingText.content)
        setStartTime(editingText.start_time)
        setEndTime(editingText.end_time)
        setPosition(editingText.position)
        setTextStyle({
          color: editingText.style.color,
          font_size: editingText.style.font_size,
          fontFamily: editingText.style.fontFamily || 'Arial, sans-serif',
          fontWeight: editingText.style.fontWeight || 'normal',
          fontStyle: editingText.style.fontStyle || 'normal',
          textAlign: editingText.style.textAlign || 'left',
          textDecoration: editingText.style.textDecoration || 'none',
          textShadow: editingText.style.textShadow || '1px 1px 2px rgba(0,0,0,0.5)',
          webkitTextStroke: editingText.style.webkitTextStroke || 'none',
          backgroundColor: editingText.style.backgroundColor || 'transparent',
          padding: editingText.style.padding || '0',
          borderRadius: editingText.style.borderRadius || '0',
          letterSpacing: editingText.style.letterSpacing || 'normal',
          lineHeight: editingText.style.lineHeight || 'normal',
          opacity: editingText.style.opacity || 1
        })
      } else {
        // Default values for new text
        setContent('')
        setStartTime(0)
        setEndTime(3)
        setPosition({ x: 50, y: 50 })
        setTextStyle({
          color: '#ffffff',
          font_size: 24,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          textDecoration: 'none',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          webkitTextStroke: 'none',
          backgroundColor: 'transparent',
          padding: '0',
          borderRadius: '0',
          letterSpacing: 'normal',
          lineHeight: 'normal',
          opacity: 1
        })
      }
    }
  }, [isOpen, editingText])

  const handleSave = () => {
    if (!content.trim()) return

    const textOverlay: TextOverlay = {
      id: editingText?.id || `text_${Date.now()}`,
      content: content.trim(),
      start_time: startTime,
      end_time: endTime,
      position,
      style: textStyle
    }

    onSave(textOverlay)
    onClose()
  }

  const handlePositionChange = (preset: { x: number; y: number }) => {
    setPosition(preset)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            {editingText ? 'Modifier le texte' : 'Ajouter du texte'}
          </DialogTitle>
          <DialogDescription>
            Configurez le texte qui apparaîtra sur votre vidéo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content with integrated formatting */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium mb-3 block">
              Contenu du texte
            </Label>

            {/* Text Input */}
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Entrez votre texte..."
              className="mb-3"
              rows={3}
            />

            {/* Formatting Toolbar - Integrated in content area */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <Label className="text-xs text-gray-600 mb-2 block">Formatage</Label>
              <TextFormattingModalToolbar
                textStyle={textStyle}
                onStyleChange={(style) => setTextStyle(prev => ({ ...prev, ...style }))}
              />
            </div>
          </div>

          {/* Timing */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              Durée d'affichage
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-xs text-gray-600">
                  Début (secondes)
                </Label>
                <Input
                  id="start-time"
                  type="number"
                  min={0}
                  max={totalDuration}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-xs text-gray-600">
                  Fin (secondes)
                </Label>
                <Input
                  id="end-time"
                  type="number"
                  min={startTime + 0.1}
                  max={totalDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Move className="w-4 h-4" />
              Position
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {positionPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={
                    position.x === preset.value.x && position.y === preset.value.y
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handlePositionChange(preset.value)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label htmlFor="pos-x" className="text-xs text-gray-600">
                  X (%)
                </Label>
                <Input
                  id="pos-x"
                  type="number"
                  min={0}
                  max={100}
                  value={position.x}
                  onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pos-y" className="text-xs text-gray-600">
                  Y (%)
                </Label>
                <Input
                  id="pos-y"
                  type="number"
                  min={0}
                  max={100}
                  value={position.y}
                  onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>


          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Aperçu</Label>
            <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
              {content && (
                <div
                  className="absolute max-w-full px-2"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: textStyle.color,
                    fontSize: `${Math.max(8, textStyle.font_size * 0.3)}px`, // Scale down for preview
                    fontFamily: textStyle.fontFamily,
                    fontWeight: textStyle.fontWeight,
                    fontStyle: textStyle.fontStyle,
                    textAlign: textStyle.textAlign as any,
                    textDecoration: textStyle.textDecoration,
                    textShadow: textStyle.textShadow,
                    WebkitTextStroke: textStyle.webkitTextStroke,
                    backgroundColor: textStyle.backgroundColor,
                    padding: textStyle.padding,
                    borderRadius: textStyle.borderRadius,
                    letterSpacing: textStyle.letterSpacing,
                    lineHeight: textStyle.lineHeight,
                    opacity: textStyle.opacity,
                    wordWrap: 'break-word' as any,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {content}
                </div>
              )}
              {!content && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Aperçu du texte
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim()}
          >
            {editingText ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}