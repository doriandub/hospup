'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Copy,
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
import { InteractiveTextEditor } from './interactive-text-editor'
import { TimelineVideoScrubber } from './timeline-video-scrubber'
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
  onAddText?: () => void
  onGenerateVideo?: () => void
}

export function VideoTimelineEditor({
  templateTitle,
  templateSlots,
  contentVideos,
  onGenerate,
  propertyId,
  templateId,
  onAddText,
  onGenerateVideo
}: TimelineEditorProps) {
  const [assignments, setAssignments] = useState<SlotAssignment[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [draggedVideo, setDraggedVideo] = useState<ContentVideo | null>(null)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [resizingText, setResizingText] = useState<{ textId: string, side: 'start' | 'end' } | null>(null)
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // Functions to save/load assignments
  const saveAssignmentsToStorage = (assignments: SlotAssignment[]) => {
    try {
      const key = `template_assignments_${templateId}_${propertyId}`
      localStorage.setItem(key, JSON.stringify(assignments))
      console.log('💾 Saved assignments to localStorage:', assignments.length, 'assignments')
    } catch (error) {
      console.error('❌ Failed to save assignments:', error)
    }
  }

  const loadAssignmentsFromStorage = (): SlotAssignment[] => {
    try {
      const key = `template_assignments_${templateId}_${propertyId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const assignments = JSON.parse(stored)
        console.log('📂 Loaded assignments from localStorage:', assignments.length, 'assignments')
        return assignments
      }
    } catch (error) {
      console.error('❌ Failed to load assignments:', error)
    }
    return []
  }

  // Handle external add text request
  const handleAddText = () => {
    const newId = Date.now().toString()
    const snappedStart = snapToNearestCut(0)
    const snappedEnd = snapToNearestCut(3)
    
    setTextOverlays(prev => [...prev, {
      id: newId,
      content: 'New Text',
      start_time: snappedStart,
      end_time: snappedEnd,
      position: { x: 50, y: 50, anchor: 'center' },
      style: {
        font_family: 'Arial',
        font_size: 4.8, // Taille réduite de 10x
        color: '#FFFFFF',
        bold: false,
        italic: false,
        shadow: true,
        outline: false,
        background: false,
        opacity: 1,
        text_align: 'center' as const
      },
      textAlign: 'center'
    }])
    setSelectedTextId(newId)
    setShowPreview(true)
    setShowTextEditor(true)
  }

  const handleGenerateVideo = () => {
    console.log('🎯 Generate button clicked!')
    console.log('🎯 Assignments:', assignments)
    console.log('🎯 Text overlays:', textOverlays)
    onGenerate(assignments, textOverlays)
  }

  // Call external callbacks when needed
  useEffect(() => {
    if (onAddText) {
      // Store the internal handler for external use
      (window as any).videoTimelineAddText = handleAddText
    }
  }, [onAddText])

  useEffect(() => {
    if (onGenerateVideo) {
      // Store the internal handler for external use  
      (window as any).videoTimelineGenerateVideo = handleGenerateVideo
    }
  }, [onGenerateVideo, assignments, textOverlays, onGenerate])

  // Load saved assignments or auto-match when data is ready  
  useEffect(() => {
    console.log('🔍 useEffect triggered:', { 
      templateSlotsLength: templateSlots.length, 
      contentVideosLength: contentVideos.length, 
      assignmentsLength: assignments.length,
      templateId,
      propertyId
    })
    
    if (templateSlots.length > 0 && contentVideos.length > 0 && assignments.length === 0) {
      // First try to load saved assignments
      const savedAssignments = loadAssignmentsFromStorage()
      if (savedAssignments.length > 0) {
        console.log('✅ Using saved assignments:', savedAssignments.length, 'slots restored from storage')
        console.log('📋 Saved assignments:', savedAssignments)
        setAssignments(savedAssignments)
      } else {
        console.log('🎯 Auto-matching', templateSlots.length, 'slots with', contentVideos.length, 'videos (no saved assignments)')
        loadSmartAssignments()
      }
    } else if (assignments.length > 0) {
      console.log('✅ Using existing assignments:', assignments.length, 'slots already assigned')
    } else {
      console.log('⏳ Waiting for data to load...')
    }
  }, [templateSlots, contentVideos])

  // Auto-save assignments when they change
  useEffect(() => {
    if (assignments.length > 0 && templateId && propertyId) {
      saveAssignmentsToStorage(assignments)
    }
  }, [assignments, templateId, propertyId])

  const autoMatchVideosToSlots = (): SlotAssignment[] => {
    const assignments: SlotAssignment[] = []
    const usedVideoIds = new Set<string>()

    for (const slot of templateSlots) {
      let bestMatch: ContentVideo | null = null
      let bestScore = 0

      // Trouve la meilleure vidéo pour ce slot
      for (const video of contentVideos) {
        if (usedVideoIds.has(video.id)) continue
        
        // Assouplit les règles de durée - accepte toute vidéo de plus de 1 seconde
        if (video.duration < 1) continue

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
      console.log('🧠 API call URL:', '/api/v1/video-generation/smart-match')
      console.log('🧠 Request payload:', { property_id: propertyId, template_id: templateId })
      
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
    } catch (error: any) {
      console.error('❌ Error loading smart assignments:', error)
      console.error('❌ Error details:', error?.response?.data || error?.message || error)
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
    
    // Ajouter un score de base minimal pour toutes les vidéos (permet le matching même sans correspondance parfaite)
    const baseScore = 0.1
    const finalScore = Math.min(1.0, score + baseScore)
    
    if (finalScore > 0.3) {
      console.log(`✅ Good match (${finalScore.toFixed(2)}): "${slotDescription}" ↔ "${video.title}"`)
    }
    
    return finalScore
  }

  const getVideoForSlot = (slotId: string): ContentVideo | null => {
    const assignment = assignments.find(a => a.slotId === slotId)
    if (!assignment?.videoId) return null
    return contentVideos.find(v => v.id === assignment.videoId) || null
  }

  const canVideoFitSlot = (video: ContentVideo, slot: TemplateSlot): boolean => {
    return video.duration >= 1 // Accepte toute vidéo de plus de 1 seconde
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

  // Fonction d'alignement sur les cuts - TOUJOURS aligner sur le cut le plus proche
  const snapToNearestCut = useCallback((time: number): number => {
    // Créer une liste de tous les points de coupe (début et fin de slots)
    const cutPoints: number[] = [0, totalDuration] // Début et fin de la vidéo
    
    templateSlots.forEach(slot => {
      cutPoints.push(slot.start_time)
      cutPoints.push(slot.end_time)
    })
    
    // Supprimer les doublons et trier
    const uniqueCuts = [...new Set(cutPoints)].sort((a, b) => a - b)
    
    // TOUJOURS trouver le cut le plus proche (pas de tolérance)
    let nearestCut = uniqueCuts[0]
    let minDistance = Math.abs(time - uniqueCuts[0])
    
    for (const cut of uniqueCuts) {
      const distance = Math.abs(time - cut)
      if (distance < minDistance) {
        minDistance = distance
        nearestCut = cut
      }
    }
    
    return nearestCut
  }, [templateSlots, totalDuration])

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
        const snappedTime = snapToNearestCut(newTime)
        updatedText.start_time = Math.max(0, Math.min(snappedTime, textToUpdate.end_time - 0.1))
      } else {
        const snappedTime = snapToNearestCut(newTime)
        updatedText.end_time = Math.max(textToUpdate.start_time + 0.1, Math.min(snappedTime, totalDuration))
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
    <div className="min-h-screen bg-gray-50 font-inter">
      <div className="grid grid-cols-1 gap-3 p-8">
        

        {/* Collapsible Preview Section */}
        {showPreview && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            
            {/* Preview Card - 1/3 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full relative">
                {/* Close button */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPreview(false)
                    setShowTextEditor(false)
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-20"
                  size="sm"
                >
                  ×
                </Button>
                <div className="flex flex-col space-y-4">
                  {/* Timeline Video Scrubber avec preview unifié et édition interactive */}
                  <TimelineVideoScrubber
                    videoSlots={videoSlots}
                    textOverlays={textOverlays}
                    setTextOverlays={setTextOverlays}
                    selectedTextId={selectedTextId}
                    setSelectedTextId={setSelectedTextId}
                    currentTime={currentTime}
                    totalDuration={totalDuration}
                    onTimeChange={setCurrentTime}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    isPlaying={isPlaying}
                    editorWidth={270}
                    editorHeight={480}
                    onShowTextEditor={() => setShowTextEditor(true)}
                  />
                  
                </div>
              </div>
            </div>

            {/* Text Editor Card - 2/3 */}
            <div className="lg:col-span-2 flex flex-col">
              {showPreview && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Text Editor
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowTextEditor(false)
                        setShowPreview(false)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </Button>
                  </div>

                  {(() => {
                    const selectedText = textOverlays.find(t => t.id === selectedTextId)
                    if (!selectedText) return null
                    
                    return (
                      <div className="space-y-4">
                        
                        {/* Content */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">Content</Label>
                          <Textarea
                            value={selectedText.content}
                            onChange={(e) => {
                              setTextOverlays(textOverlays.map(t => 
                                t.id === selectedTextId ? { ...t, content: e.target.value } : t
                              ))
                            }}
                            placeholder="Enter your text..."
                            className="resize-none h-16"
                          />
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          
                          {/* Style */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2">Style</Label>
                            <div className="space-y-2">
                              <Select
                                value={selectedText.style.font_family}
                                onValueChange={(value) => {
                                  setTextOverlays(textOverlays.map(t => 
                                    t.id === selectedTextId ? { ...t, style: { ...t.style, font_family: value } } : t
                                  ))
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Inter">Inter</SelectItem>
                                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                                  <SelectItem value="Arial">Arial</SelectItem>
                                  <SelectItem value="Times">Times</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Taille: {selectedText.style.font_size.toFixed(1)}%
                                </label>
                                <input
                                  type="range"
                                  min="2"
                                  max="15"
                                  step="0.5"
                                  value={selectedText.style.font_size}
                                  onChange={(e) => {
                                    const newSize = parseFloat(e.target.value)
                                    setTextOverlays(textOverlays.map(text => 
                                      text.id === selectedTextId 
                                        ? { ...text, style: { ...text.style, font_size: newSize } }
                                        : text
                                    ))
                                  }}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Input
                                  type="color"
                                  value={selectedText.style.color}
                                  onChange={(e) => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === selectedTextId ? { ...t, style: { ...t.style, color: e.target.value } } : t
                                    ))
                                  }}
                                  className="w-10 h-8"
                                />
                                <div className="flex gap-1 flex-1">
                                  {[
                                    { key: 'bold', label: 'B' },
                                    { key: 'italic', label: 'I' },
                                    { key: 'shadow', label: 'S' },
                                    { key: 'outline', label: 'O' }
                                  ].map(({ key, label }) => (
                                    <Button
                                      key={key}
                                      variant={selectedText.style[key as keyof typeof selectedText.style] ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        setTextOverlays(textOverlays.map(t => 
                                          t.id === selectedTextId ? { 
                                            ...t, 
                                            style: { ...t.style, [key]: !t.style[key as keyof typeof t.style] } 
                                          } : t
                                        ))
                                      }}
                                      className="px-1 text-xs h-8 flex-1"
                                    >
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timing */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2">Timing</Label>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-gray-600">Start (s)</Label>
                                <Input
                                  type="number"
                                  value={selectedText.start_time}
                                  onChange={(e) => {
                                    const inputTime = Math.max(0, Math.min(parseFloat(e.target.value) || 0, totalDuration - 0.1))
                                    const start = snapToNearestCut(inputTime)
                                    const end = Math.max(start + 0.1, selectedText.end_time)
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === selectedTextId ? { ...t, start_time: start, end_time: end } : t
                                    ))
                                  }}
                                  min={0}
                                  max={totalDuration - 0.1}
                                  step={0.1}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">End (s)</Label>
                                <Input
                                  type="number"
                                  value={selectedText.end_time}
                                  onChange={(e) => {
                                    const inputTime = Math.max(selectedText.start_time + 0.1, Math.min(parseFloat(e.target.value) || 0, totalDuration))
                                    const end = snapToNearestCut(inputTime)
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === selectedTextId ? { ...t, end_time: end } : t
                                    ))
                                  }}
                                  min={selectedText.start_time + 0.1}
                                  max={totalDuration}
                                  step={0.1}
                                  className="h-8"
                                />
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                Duration: {(selectedText.end_time - selectedText.start_time).toFixed(1)}s
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Timeline Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Video Timeline</h2>
          </div>

          {/* Timeline with videos only */}
          <div className="space-y-3">
            
            {/* Video Segments Timeline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Video Segments</Label>
                <span className="text-xs text-gray-500">{formatTime(totalDuration)} total</span>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {/* Video segments row */}
                <div className="flex">
                  {templateSlots.map((slot, index) => {
                  const video = getVideoForSlot(slot.id)
                  
                  return (
                    <div
                      key={slot.id}
                      className={`relative border-r border-gray-200 last:border-r-0 h-24 transition-all duration-200 ${
                        video ? 'bg-white' : 'bg-gray-100'
                      } ${
                        selectedSlot === slot.id ? 'ring-2 ring-[#09725c] ring-opacity-50' : ''
                      } ${
                        dragOverSlot === slot.id ? 'ring-2 ring-[#ff914d] bg-orange-50' : ''
                      }`}
                      style={{ 
                        width: `${(slot.duration / totalDuration) * 100}%`,
                        minWidth: '80px'
                      }}
                      onClick={() => setSelectedSlot(slot.id)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverSlot(slot.id)
                      }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedVideo) {
                          if (canVideoFitSlot(draggedVideo, slot)) {
                            assignVideoToSlot(slot.id, draggedVideo.id)
                          } else {
                            alert(`This video (${draggedVideo.duration}s) is too short for this slot (${slot.duration}s)`)
                          }
                          setDraggedVideo(null)
                          setDragOverSlot(null)
                        }
                      }}
                    >
                      {/* Slot number */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {slot.order}
                      </div>

                      {/* Duration */}
                      <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatTime(slot.duration)}
                      </div>

                      {/* Content */}
                      <div className="h-full flex flex-col items-center justify-center p-1.5">
                        {video ? (
                          <div className="w-full h-full relative group">
                            <img
                              src={video.thumbnail_url || '/placeholder-video.jpg'}
                              alt={video.title}
                              className="w-full h-full object-cover rounded"
                            />
                            
                            {/* Hover actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    assignVideoToSlot(slot.id, null)
                                  }}
                                  className="text-white hover:text-red-300 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                {index > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      swapSlotVideos(slot.id, templateSlots[index - 1].id)
                                    }}
                                    className="text-white hover:text-blue-300 h-6 w-6 p-0"
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
                                    className="text-white hover:text-blue-300 h-6 w-6 p-0"
                                  >
                                    →
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Video info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-1">
                              <p className="truncate font-medium">{video.title}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-gray-300 rounded">
                            <Video className="w-5 h-5 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500 text-center leading-tight">
                              Drop video here
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })}
                </div>
                
                {/* Text Overlays - embedded within the same timeline block */}
                {textOverlays.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {textOverlays.map((text, index) => {
                      const left = (text.start_time / totalDuration) * 100
                      const width = ((text.end_time - text.start_time) / totalDuration) * 100
                      
                      return (
                        <div key={text.id} className="h-6 relative" data-text-timeline>
                          <div
                            className={`absolute h-5 top-0.5 rounded cursor-pointer border flex items-center text-xs font-medium transition-all group ${
                              selectedTextId === text.id 
                                ? 'border-[#09725c] bg-[#09725c] text-white'
                                : 'border-[#ff914d] bg-[#ff914d]/20 hover:bg-[#ff914d]/30 text-[#ff914d]'
                            }`}
                            style={{ 
                              left: `${left}%`, 
                              width: `${width}%`,
                              minWidth: '50px'
                            }}
                            onClick={() => {
                              setSelectedTextId(text.id)
                              setShowPreview(true)
                              setShowTextEditor(true)
                            }}
                            title={`${text.content} (${text.start_time}s - ${text.end_time}s)`}
                          >
                            {/* Left resize handle */}
                            <div 
                              className="absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-[#09725c] opacity-0 group-hover:opacity-70 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                setResizingText({ textId: text.id, side: 'start' })
                              }}
                              title="Drag to adjust start time"
                            />
                            
                            <span className="truncate px-1 flex-1 text-xs">{text.content}</span>
                            
                            {/* Duration display */}
                            <div className="text-xs px-1 opacity-75">
                              {(text.end_time - text.start_time).toFixed(1)}s
                            </div>
                            
                            {/* Right resize handle */}
                            <div 
                              className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-[#09725c] opacity-0 group-hover:opacity-70 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                setResizingText({ textId: text.id, side: 'end' })
                              }}
                              title="Drag to adjust end time"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Library */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Content Library</h2>
            <div className="text-sm text-gray-600">{contentVideos.length} video{contentVideos.length !== 1 ? 's' : ''} available</div>
          </div>

          {contentVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No videos in your Content Library</p>
            </div>
          ) : (
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
                      setDraggedVideo(video)
                    }}
                    onDragEnd={() => {
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
                      <p className="text-xs text-green-600 mt-1">✓ Used</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}