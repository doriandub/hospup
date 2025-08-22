'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Pause,
  SkipBack, 
  SkipForward,
  Trash2,
  Shuffle,
  Clock,
  Video,
  Zap,
  Edit,
  Plus,
  AlertTriangle,
  Type
} from 'lucide-react'
import { TimelineTextEditor, TextOverlay } from './timeline-text-editor'
import { UnifiedTextEditor } from './unified-text-editor'
import { textApi, api } from '@/lib/api'

interface TemplateSlot {
  id: string
  order: number
  duration: number // Durée fixe du moule
  description: string
  start_time: number
  end_time: number
}

interface ContentVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface SlotAssignment {
  slotId: string
  videoId: string | null
  confidence?: number
}

interface TimelineEditorProps {
  templateTitle: string
  templateSlots: TemplateSlot[]
  contentVideos: ContentVideo[]
  onGenerate: (assignments: SlotAssignment[], texts: any[]) => void
  propertyId: string
  templateId: string
}

export function VideoTimelineEditor({
  templateTitle,
  templateSlots,
  contentVideos,
  onGenerate,
  propertyId,
  templateId
}: TimelineEditorProps) {
  const [assignments, setAssignments] = useState<SlotAssignment[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [draggedVideo, setDraggedVideo] = useState<ContentVideo | null>(null)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [resizingText, setResizingText] = useState<{ textId: string, side: 'start' | 'end' } | null>(null)
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')

  // Auto-match initial assignments when data is ready
  useEffect(() => {
    if (templateSlots.length > 0 && contentVideos.length > 0) {
      console.log('🎯 Auto-matching', templateSlots.length, 'slots with', contentVideos.length, 'videos')
      loadSmartAssignments()
    }
  }, [templateSlots, contentVideos])

  const autoMatchVideosToSlots = (): SlotAssignment[] => {
    const assignments: SlotAssignment[] = []
    const usedVideoIds = new Set<string>()

    for (const slot of templateSlots) {
      let bestMatch: ContentVideo | null = null
      let bestScore = 0

      // Trouve la meilleure vidéo pour ce slot
      for (const video of contentVideos) {
        if (usedVideoIds.has(video.id)) continue
        
        // Vérifie la compatibilité de durée (doit être >= durée du slot)
        if (video.duration < slot.duration) continue

        // Score basé sur la similarité de description
        const score = calculateMatchScore(slot.description, video)
        if (score > bestScore) {
          bestScore = score
          bestMatch = video
        }
      }

      if (bestMatch) {
        usedVideoIds.add(bestMatch.id)
        assignments.push({
          slotId: slot.id,
          videoId: bestMatch.id,
          confidence: bestScore
        })
      } else {
        assignments.push({
          slotId: slot.id,
          videoId: null
        })
      }
    }

    return assignments
  }

  // New function to load smart assignments from backend
  const loadSmartAssignments = async () => {
    try {
      console.log('🧠 Calling smart matching service for property:', propertyId, 'template:', templateId)
      
      const response = await api.post('/api/v1/video-generation/smart-match', {
        property_id: propertyId,
        template_id: templateId
      })
      
      const smartResult = response.data
      console.log('✅ Smart matching result:', smartResult)
      
      if (smartResult.slot_assignments && smartResult.slot_assignments.length > 0) {
        const smartAssignments = smartResult.slot_assignments.map((assignment: any) => ({
          slotId: assignment.slotId,
          videoId: assignment.videoId,
          confidence: assignment.confidence
        }))
        
        setAssignments(smartAssignments)
        console.log('🎯 Applied smart assignments:', smartAssignments.length, 'assignments')
        console.log('📊 Average confidence:', smartResult.matching_scores?.average_score || 'N/A')
      } else {
        console.warn('⚠️ No smart assignments returned, falling back to basic matching')
        const fallbackAssignments = autoMatchVideosToSlots()
        setAssignments(fallbackAssignments)
      }
    } catch (error) {
      console.error('❌ Error loading smart assignments:', error)
      console.log('🔄 Falling back to basic auto-matching')
      const fallbackAssignments = autoMatchVideosToSlots()
      setAssignments(fallbackAssignments)
    }
  }

  const calculateMatchScore = (slotDescription: string, video: ContentVideo): number => {
    const slotWords = slotDescription.toLowerCase().split(' ')
    const videoWords = (video.title + ' ' + video.description).toLowerCase().split(' ')
    
    // Mots-clés spéciaux pour l'hospitalité avec bonus
    const hospitalityKeywords = {
      'piscine': ['pool', 'swimming', 'piscine', 'baignade'],
      'chambre': ['room', 'bedroom', 'suite', 'chambre', 'lit', 'bed'],
      'restaurant': ['restaurant', 'dining', 'food', 'cuisine', 'gastronomique'],
      'spa': ['spa', 'wellness', 'massage', 'detente', 'relaxation'],
      'vue': ['view', 'panorama', 'ocean', 'mer', 'terrasse', 'balcon'],
      'exterieur': ['outdoor', 'garden', 'terrace', 'exterieur', 'jardin']
    }
    
    let score = 0
    let matches = 0
    
    // Score de base par correspondance de mots
    slotWords.forEach(slotWord => {
      if (slotWord.length <= 3) return // Ignore les mots trop courts
      
      videoWords.forEach(videoWord => {
        if (videoWord.includes(slotWord) || slotWord.includes(videoWord)) {
          matches++
          score += 0.2
        }
      })
    })
    
    // Bonus pour les mots-clés d'hospitalité
    Object.entries(hospitalityKeywords).forEach(([category, keywords]) => {
      const slotHasCategory = keywords.some(keyword => 
        slotWords.some(word => word.includes(keyword))
      )
      const videoHasCategory = keywords.some(keyword => 
        videoWords.some(word => word.includes(keyword))
      )
      
      if (slotHasCategory && videoHasCategory) {
        score += 0.4 // Bonus important pour match thématique
        console.log(`🎯 Thematic match: ${category} for slot "${slotDescription}" with video "${video.title}"`)
      }
    })
    
    // Normaliser le score
    const normalizedScore = Math.min(1.0, score)
    
    if (normalizedScore > 0.3) {
      console.log(`✅ Good match (${normalizedScore.toFixed(2)}): "${slotDescription}" ↔ "${video.title}"`)
    }
    
    return normalizedScore
  }

  const getVideoForSlot = (slotId: string): ContentVideo | null => {
    const assignment = assignments.find(a => a.slotId === slotId)
    if (!assignment?.videoId) return null
    return contentVideos.find(v => v.id === assignment.videoId) || null
  }

  const canVideoFitSlot = (video: ContentVideo, slot: TemplateSlot): boolean => {
    return video.duration >= slot.duration
  }

  const assignVideoToSlot = (slotId: string, videoId: string | null) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.slotId === slotId 
        ? { ...assignment, videoId, confidence: videoId ? 1.0 : undefined }
        : assignment
    ))
  }

  const swapSlotVideos = (slotId1: string, slotId2: string) => {
    const assignment1 = assignments.find(a => a.slotId === slotId1)
    const assignment2 = assignments.find(a => a.slotId === slotId2)
    
    if (assignment1 && assignment2) {
      setAssignments(prev => prev.map(assignment => {
        if (assignment.slotId === slotId1) {
          return { ...assignment, videoId: assignment2.videoId, confidence: assignment2.confidence }
        }
        if (assignment.slotId === slotId2) {
          return { ...assignment, videoId: assignment1.videoId, confidence: assignment1.confidence }
        }
        return assignment
      }))
    }
  }

  const getSlotColor = (slot: TemplateSlot): string => {
    const video = getVideoForSlot(slot.id)
    if (!video) return 'bg-gray-200 border-gray-300'
    
    const assignment = assignments.find(a => a.slotId === slot.id)
    const confidence = assignment?.confidence || 0
    
    if (confidence > 0.7) return 'bg-green-100 border-green-400'
    if (confidence > 0.4) return 'bg-yellow-100 border-yellow-400'
    return 'bg-blue-100 border-blue-400'
  }

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`
  }

  // Créer le style CSS pour le texte en aperçu
  const getTextPreviewStyle = (text: TextOverlay) => {
    return {
      position: 'absolute' as const,
      left: `${text.position.x}%`,
      top: `${text.position.y}%`,
      transform: `translate(-50%, -50%)`,
      fontSize: `${text.style.font_size}px`,
      fontFamily: text.style.font_family,
      color: text.style.color,
      fontWeight: text.style.bold ? 'bold' : 'normal',
      fontStyle: text.style.italic ? 'italic' : 'normal',
      textShadow: text.style.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
      WebkitTextStroke: text.style.outline ? '1px black' : 'none',
      backgroundColor: text.style.background ? 'rgba(0,0,0,0.5)' : 'transparent',
      padding: text.style.background ? '8px 16px' : '0',
      borderRadius: text.style.background ? '4px' : '0',
      opacity: text.style.opacity,
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      zIndex: 10,
      maxWidth: '80%',
      textAlign: 'center' as const,
      wordBreak: 'break-word' as const,
    }
  }

  const totalDuration = templateSlots.reduce((sum, slot) => sum + slot.duration, 0)

  // Calculer les layers pour éviter les superpositions de textes
  const calculateTextLayers = (texts: TextOverlay[]) => {
    const layers: { [textId: string]: number } = {}
    const sortedTexts = [...texts].sort((a, b) => a.start_time - b.start_time)
    
    for (const text of sortedTexts) {
      let layer = 0
      let canPlace = false
      
      while (!canPlace) {
        canPlace = true
        for (const otherText of sortedTexts) {
          if (otherText.id === text.id || layers[otherText.id] !== layer) continue
          
          // Vérifier si les textes se chevauchent
          const overlaps = !(text.end_time <= otherText.start_time || text.start_time >= otherText.end_time)
          if (overlaps) {
            canPlace = false
            break
          }
        }
        if (!canPlace) layer++
      }
      layers[text.id] = layer
    }
    
    return layers
  }

  const textLayers = calculateTextLayers(textOverlays)
  const maxLayers = Math.max(0, ...Object.values(textLayers)) + 1
  const assignedSlots = assignments.filter(a => a.videoId).length

  // Gestion du redimensionnement des textes
  useEffect(() => {
    if (!resizingText) return

    const handleMouseMove = (e: MouseEvent) => {
      const timelineElement = document.querySelector('[data-text-timeline]') as HTMLElement
      if (!timelineElement) return

      const rect = timelineElement.getBoundingClientRect()
      const relativeX = e.clientX - rect.left
      const percentage = (relativeX / rect.width) * 100
      const newTime = Math.max(0, Math.min((percentage / 100) * totalDuration, totalDuration))
      
      const textToUpdate = textOverlays.find(t => t.id === resizingText.textId)
      if (!textToUpdate) return

      let updatedText = { ...textToUpdate }

      if (resizingText.side === 'start') {
        updatedText.start_time = Math.max(0, Math.min(newTime, textToUpdate.end_time - 0.1))
      } else {
        updatedText.end_time = Math.max(textToUpdate.start_time + 0.1, Math.min(newTime, totalDuration))
      }

      setTextOverlays(prev => prev.map(t => t.id === resizingText.textId ? updatedText : t))
    }

    const handleMouseUp = () => {
      setResizingText(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingText, totalDuration, textOverlays])

  // Convertir les templateSlots en videoSlots pour la timeline
  const videoSlots = templateSlots.map(slot => {
    const video = getVideoForSlot(slot.id)
    return {
      id: slot.id,
      order: slot.order,
      duration: slot.duration,
      description: slot.description,
      start_time: slot.start_time,
      end_time: slot.end_time,
      assignedVideo: video ? {
        title: video.title,
        thumbnail_url: video.thumbnail_url
      } : undefined
    }
  })

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{templateTitle}</h1>
            <p className="text-gray-600">
              Timeline • {templateSlots.length} segments • {formatTime(totalDuration)} total
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">{assignedSlots}/{templateSlots.length} slots remplis</span>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(assignedSlots / templateSlots.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <Button
              onClick={() => {
                console.log('🎯 Generate button clicked!')
                console.log('🎯 Assignments:', assignments)
                console.log('🎯 Text overlays:', textOverlays)
                onGenerate(assignments, textOverlays)
              }}
              disabled={assignedSlots === 0}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Générer ({assignedSlots} segments)
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline horizontale */}
      <div className="flex-1 p-6">
        {/* Éditeur de texte positionné au-dessus de la Timeline Template */}
        {showTextEditor && selectedTextId && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 relative z-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Édition du texte
              </h3>
              <button
                onClick={() => setShowTextEditor(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
                title="Fermer l'éditeur"
              >
                ×
              </button>
            </div>

            {/* Layout horizontal en 3 colonnes */}
            <div className="grid grid-cols-3 gap-4 h-64">
              
              {/* Colonne 1 : Aperçu vidéo */}
              <div className="flex flex-col">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Aperçu</Label>
                <div 
                  className="relative rounded-lg aspect-[9/16] w-full h-full overflow-hidden border-2 border-gray-300"
                    style={{
                      backgroundImage: (() => {
                        const selectedText = textOverlays.find(t => t.id === selectedTextId)
                        if (!selectedText) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        
                        // Trouver la vidéo correspondant au timing du texte
                        for (const slot of videoSlots) {
                          if (selectedText.start_time >= slot.start_time && selectedText.start_time < slot.end_time) {
                            return slot.assignedVideo?.thumbnail_url ? `url(${slot.assignedVideo.thumbnail_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }
                        }
                        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      })(),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {(() => {
                      const selectedText = textOverlays.find(t => t.id === selectedTextId)
                      if (!selectedText) return null
                      
                      return (
                        <div
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${selectedText.position.x}%`,
                            top: `${selectedText.position.y}%`,
                            fontFamily: selectedText.style.font_family,
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
                            textAlign: 'center'
                          }}
                        >
                          {selectedText.content || 'Votre texte'}
                        </div>
                      )
                    })()}
                  </div>
              </div>

              {/* Colonne 2 : Contenu et Style */}
              <div className="flex flex-col space-y-3">
                {(() => {
                  const selectedText = textOverlays.find(t => t.id === selectedTextId)
                  if (!selectedText) return null
                  
                  return (
                    <>
                      {/* Contenu */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Contenu</Label>
                        <Textarea
                          value={selectedText.content}
                          onChange={(e) => {
                            setTextOverlays(textOverlays.map(t => 
                              t.id === selectedTextId ? { ...t, content: e.target.value } : t
                            ))
                          }}
                          placeholder="Saisissez votre texte..."
                          className="resize-none text-sm h-16"
                        />
                      </div>

                      {/* Style */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Style</Label>
                        <div className="space-y-2">
                          <Select
                            value={selectedText.style.font_family}
                            onValueChange={(value) => {
                              setTextOverlays(textOverlays.map(t => 
                                t.id === selectedTextId ? { ...t, style: { ...t.style, font_family: value } } : t
                              ))
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times">Times</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-8">{selectedText.style.font_size}px</span>
                            <Input
                              type="range"
                              value={selectedText.style.font_size}
                              onChange={(e) => {
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { ...t, style: { ...t.style, font_size: parseInt(e.target.value) } } : t
                                ))
                              }}
                              min={12}
                              max={72}
                              step={2}
                              className="flex-1"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={selectedText.style.color}
                              onChange={(e) => {
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { ...t, style: { ...t.style, color: e.target.value } } : t
                                ))
                              }}
                              className="w-12 h-8"
                            />
                            <div className="flex gap-1 flex-1">
                              {[
                                { key: 'bold', label: 'B' },
                                { key: 'italic', label: 'I' },
                                { key: 'shadow', label: 'S' },
                                { key: 'outline', label: 'O' }
                              ].map(({ key, label }) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === selectedTextId ? { 
                                        ...t, 
                                        style: { ...t.style, [key]: !t.style[key as keyof typeof t.style] } 
                                      } : t
                                    ))
                                  }}
                                  className={`px-2 py-1 text-xs rounded ${
                                    selectedText.style[key as keyof typeof selectedText.style] 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Colonne 3 : Timing et Position */}
              <div className="flex flex-col space-y-3">
                {(() => {
                  const selectedText = textOverlays.find(t => t.id === selectedTextId)
                  if (!selectedText) return null
                  
                  return (
                    <>
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
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { ...t, start_time: start, end_time: end } : t
                                ))
                              }}
                              min={0}
                              max={totalDuration - 0.1}
                              step={0.1}
                              className="text-sm h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Fin</Label>
                            <Input
                              type="number"
                              value={selectedText.end_time}
                              onChange={(e) => {
                                const end = Math.max(selectedText.start_time + 0.1, Math.min(parseFloat(e.target.value) || 0, totalDuration))
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { ...t, end_time: end } : t
                                ))
                              }}
                              min={selectedText.start_time + 0.1}
                              max={totalDuration}
                              step={0.1}
                              className="text-sm h-8"
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            Durée: {(selectedText.end_time - selectedText.start_time).toFixed(1)}s
                          </div>
                        </div>
                      </div>

                      {/* Position */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Position</Label>
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[
                              { name: 'H', anchor: 'top-center' as const, x: 50, y: 20 },
                              { name: 'C', anchor: 'center' as const, x: 50, y: 50 },
                              { name: 'B', anchor: 'bottom-center' as const, x: 50, y: 80 }
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                className={`px-2 py-1 text-xs rounded ${
                                  selectedText.position.anchor === preset.anchor 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={() => {
                                  setTextOverlays(textOverlays.map(t => 
                                    t.id === selectedTextId ? { ...t, position: { ...t.position, ...preset } } : t
                                  ))
                                }}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>X: {selectedText.position.x}%</span>
                            </div>
                            <Input
                              type="range"
                              value={selectedText.position.x}
                              onChange={(e) => {
                                const newX = parseInt(e.target.value)
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { 
                                    ...t, 
                                    position: { ...t.position, x: newX, anchor: 'center' } 
                                  } : t
                                ))
                              }}
                              min={0}
                              max={100}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Y: {selectedText.position.y}%</span>
                            </div>
                            <Input
                              type="range"
                              value={selectedText.position.y}
                              onChange={(e) => {
                                const newY = parseInt(e.target.value)
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === selectedTextId ? { 
                                    ...t, 
                                    position: { ...t.position, y: newY, anchor: 'center' } 
                                  } : t
                                ))
                              }}
                              min={0}
                              max={100}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

      {/* Timeline Template Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Timeline Template</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newAssignments = autoMatchVideosToSlots()
                  setAssignments(newAssignments)
                }}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Re-matcher
              </Button>
            </div>
          </div>

          {/* Timeline horizontale comme un logiciel de montage */}
          <div className="relative">

            {/* Timeline des textes - au-dessus des vidéos */}
            {textOverlays.length > 0 && (
              <div className="mb-2">
                <div className="h-8 border border-blue-200 rounded bg-blue-50 relative overflow-hidden">
                  {textOverlays.map((text) => {
                    const left = (text.start_time / totalDuration) * 100
                    const width = ((text.end_time - text.start_time) / totalDuration) * 100
                    
                    return (
                      <div
                        key={text.id}
                        className={`absolute h-6 top-1 rounded cursor-pointer border-2 flex items-center text-xs font-medium transition-all group ${
                          selectedTextId === text.id 
                            ? 'border-blue-600 bg-blue-500 text-white'
                            : 'border-blue-400 bg-blue-200 hover:bg-blue-300 text-blue-800'
                        }`}
                        style={{ 
                          left: `${left}%`, 
                          width: `${width}%`,
                          minWidth: '50px'
                        }}
                        onClick={() => {
                          setSelectedTextId(text.id)
                          setShowTextEditor(true)
                        }}
                        title={`${text.content} (${text.start_time}s - ${text.end_time}s)`}
                      >
                        {/* Handle de redimensionnement gauche */}
                        <div 
                          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            setResizingText({ textId: text.id, side: 'start' })
                          }}
                          title="Glisser pour ajuster le début"
                        />
                        
                        <span className="truncate px-2 flex-1">{text.content}</span>
                        
                        {/* Affichage de la durée */}
                        <div className="text-xs px-1">
                          {(text.end_time - text.start_time).toFixed(1)}s
                        </div>
                        
                        {/* Handle de redimensionnement droite */}
                        <div 
                          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            setResizingText({ textId: text.id, side: 'end' })
                          }}
                          title="Glisser pour ajuster la fin"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Slots vidéo sans superposition */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              
              {templateSlots.map((slot, index) => {
                const video = getVideoForSlot(slot.id)
                const slotColor = getSlotColor(slot)
                
                return (
                  <div
                    key={slot.id}
                    className={`relative border-r border-gray-300 last:border-r-0 h-32 transition-all duration-200 ${slotColor} ${
                      selectedSlot === slot.id ? 'ring-2 ring-primary ring-opacity-50' : ''
                    } ${
                      dragOverSlot === slot.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                    }`}
                    style={{ 
                      width: `${(slot.duration / totalDuration) * 100}%`,
                      minWidth: '100px'
                    }}
                    onClick={() => setSelectedSlot(slot.id)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverSlot(slot.id)
                    }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      console.log('🎯 Drop event:', draggedVideo?.title, '→ slot', slot.order)
                      if (draggedVideo) {
                        if (canVideoFitSlot(draggedVideo, slot)) {
                          console.log('✅ Video fits, assigning to slot')
                          assignVideoToSlot(slot.id, draggedVideo.id)
                        } else {
                          console.log('❌ Video too short for slot')
                          alert(`Cette vidéo (${draggedVideo.duration}s) est trop courte pour ce slot (${slot.duration}s)`)
                        }
                        setDraggedVideo(null)
                        setDragOverSlot(null)
                      }
                    }}
                  >
                    {/* Numéro du slot */}
                    <div className="absolute top-1 left-1 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {slot.order}
                    </div>

                    {/* Durée du slot */}
                    <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {formatTime(slot.duration)}
                    </div>

                    {/* Contenu du slot */}
                    <div className="h-full flex flex-col items-center justify-center p-2">
                      {video ? (
                        <div className="w-full h-full relative group">
                          <img
                            src={video.thumbnail_url || '/placeholder-video.jpg'}
                            alt={video.title}
                            className="w-full h-full object-cover rounded"
                          />
                          
                          {/* Overlay avec actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  assignVideoToSlot(slot.id, null)
                                }}
                                className="text-white hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {/* Boutons d'échange avec slots voisins */}
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    swapSlotVideos(slot.id, templateSlots[index - 1].id)
                                  }}
                                  className="text-white hover:text-blue-300"
                                >
                                  ←
                                </Button>
                              )}
                              {index < templateSlots.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    swapSlotVideos(slot.id, templateSlots[index + 1].id)
                                  }}
                                  className="text-white hover:text-blue-300"
                                >
                                  →
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Info vidéo */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1">
                            <p className="truncate font-medium">{video.title}</p>
                            <p className="truncate opacity-75">
                              Durée: {formatTime(video.duration)} 
                              {video.duration < slot.duration && (
                                <span className="text-red-300 ml-1">⚠️ Trop courte</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded relative bg-gray-900">
                          
                          <Video className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-600 text-center">
                            Slot {slot.order}
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            {formatTime(slot.duration)}
                          </p>
                          <p className="text-xs text-gray-400 text-center mt-1 px-1">
                            {slot.description.slice(0, 30)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>



            {/* Bouton Ajouter du texte */}
            <div className="mt-4">
              <button
                onClick={() => {
                  const newText = {
                    id: `text_${Date.now()}`,
                    content: 'Nouveau texte',
                    start_time: 0,
                    end_time: 3,
                    position: {
                      x: 50,
                      y: 50,
                      anchor: 'center' as const
                    },
                    style: {
                      font_family: 'Inter',
                      font_size: 24,
                      color: '#ffffff',
                      shadow: true,
                      outline: true,
                      background: false,
                      bold: true,
                      italic: false,
                      opacity: 1,
                      text_align: 'center' as const
                    }
                  }
                  setTextOverlays([...textOverlays, newText])
                  setSelectedTextId(newText.id)
                  setShowTextEditor(true)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Ajouter du texte
              </button>
            </div>

          </div>
        </div>

        {/* Content Library - Liste horizontale */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Content Library</h2>
            <div className="text-sm text-gray-600">{contentVideos.length} vidéos disponibles</div>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-4">
            {contentVideos.map((video) => {
              const isUsed = assignments.some(a => a.videoId === video.id)
              
              return (
                <div
                  key={video.id}
                  className={`flex-shrink-0 w-40 bg-gray-50 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors ${
                    isUsed ? 'opacity-50' : ''
                  }`}
                  draggable
                  onDragStart={() => {
                    console.log('🎬 Drag start:', video.title, video.duration + 's')
                    setDraggedVideo(video)
                  }}
                  onDragEnd={() => {
                    console.log('🎬 Drag end')
                    setDraggedVideo(null)
                  }}
                >
                  <img
                    src={video.thumbnail_url || '/placeholder-video.jpg'}
                    alt={video.title}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">{formatTime(video.duration)}</p>
                  {video.description && (
                    <p className="text-xs text-gray-400 truncate mt-1">{video.description}</p>
                  )}
                  {isUsed && (
                    <p className="text-xs text-green-600 mt-1">✓ Utilisé</p>
                  )}
                </div>
              )
            })}
          </div>

          {contentVideos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucune vidéo dans votre Content Library</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}