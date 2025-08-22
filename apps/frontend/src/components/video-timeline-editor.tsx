'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  AlertTriangle
} from 'lucide-react'

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
}

export function VideoTimelineEditor({
  templateTitle,
  templateSlots,
  contentVideos,
  onGenerate
}: TimelineEditorProps) {
  const [assignments, setAssignments] = useState<SlotAssignment[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [draggedVideo, setDraggedVideo] = useState<ContentVideo | null>(null)
  const [customTexts, setCustomTexts] = useState<any[]>([])
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  // Auto-match initial assignments when data is ready
  useEffect(() => {
    if (templateSlots.length > 0 && contentVideos.length > 0) {
      console.log('🎯 Auto-matching', templateSlots.length, 'slots with', contentVideos.length, 'videos')
      const autoAssignments = autoMatchVideosToSlots()
      setAssignments(autoAssignments)
      console.log('✅ Auto-matching complete:', autoAssignments.length, 'assignments')
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

  const totalDuration = templateSlots.reduce((sum, slot) => sum + slot.duration, 0)
  const assignedSlots = assignments.filter(a => a.videoId).length

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
                console.log('🎯 Custom texts:', customTexts)
                onGenerate(assignments, customTexts)
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
            {/* Règle temporelle */}
            <div className="flex mb-2">
              {templateSlots.map((slot) => (
                <div
                  key={`ruler-${slot.id}`}
                  className="text-xs text-gray-500 text-center border-r border-gray-200 last:border-r-0 px-2"
                  style={{ 
                    width: `${(slot.duration / totalDuration) * 100}%`,
                    minWidth: '100px'
                  }}
                >
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </div>
              ))}
            </div>

            {/* Slots timeline */}
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
                        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded">
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

            {/* Description des slots */}
            <div className="flex mt-2">
              {templateSlots.map((slot) => (
                <div
                  key={`desc-${slot.id}`}
                  className="text-xs text-gray-600 px-2 border-r border-gray-200 last:border-r-0"
                  style={{ 
                    width: `${(slot.duration / totalDuration) * 100}%`,
                    minWidth: '100px'
                  }}
                >
                  <p className="truncate">{slot.description}</p>
                </div>
              ))}
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

        {/* Éditeur de textes simplifié */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Textes de la Vidéo</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomTexts([...customTexts, {
                id: Date.now().toString(),
                content: "Nouveau texte",
                start_time: 0,
                end_time: 3
              }])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {customTexts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Aucun texte personnalisé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customTexts.map((text) => (
                <div key={text.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <input
                    type="text"
                    value={text.content}
                    onChange={(e) => setCustomTexts(customTexts.map(t => 
                      t.id === text.id ? { ...t, content: e.target.value } : t
                    ))}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    value={text.start_time}
                    onChange={(e) => setCustomTexts(customTexts.map(t => 
                      t.id === text.id ? { ...t, start_time: parseInt(e.target.value) || 0 } : t
                    ))}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    placeholder="0s"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomTexts(customTexts.filter(t => t.id !== text.id))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}