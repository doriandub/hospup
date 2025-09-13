'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { VideoTimelineEditor } from '@/components/video-timeline-editor'
import { VideoGenerationNavbar } from '@/components/video-generation/VideoGenerationNavbar'
import { useProperties } from '@/hooks/useProperties'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface ViralTemplate {
  id: string
  title: string
  hotel_name: string
  duration: number
  script: string
}

interface TemplateSlot {
  id: string
  order: number
  duration: number
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

export default function ComposePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { properties } = useProperties()
  
  const [template, setTemplate] = useState<ViralTemplate | null>(null)
  const [templateSlots, setTemplateSlots] = useState<TemplateSlot[]>([])
  const [contentVideos, setContentVideos] = useState<ContentVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [currentAssignments, setCurrentAssignments] = useState<any[]>([])
  const [currentTextOverlays, setCurrentTextOverlays] = useState<any[]>([])

  const templateId = params.templateId as string
  const propertyFromUrl = searchParams.get('property')
  const promptFromUrl = searchParams.get('prompt')

  // Auto-select property from URL parameter
  useEffect(() => {
    if (propertyFromUrl && properties.length > 0) {
      const propertyExists = properties.find(p => p.id === propertyFromUrl)
      if (propertyExists) {
        setSelectedProperty(propertyFromUrl)
      }
    }
  }, [propertyFromUrl, properties])

  useEffect(() => {
    loadTemplateAndSegments()
  }, [templateId])

  useEffect(() => {
    if (selectedProperty) {
      loadContentLibrary()
    }
  }, [selectedProperty])

  // Auto-match when both templateSlots and contentVideos are loaded
  useEffect(() => {
    if (templateSlots.length > 0 && contentVideos.length > 0) {
      console.log('Auto-matching:', templateSlots.length, 'slots with', contentVideos.length, 'videos')
    }
  }, [templateSlots, contentVideos])

  const loadTemplateAndSegments = async () => {
    try {
      // Load template info
      const templateResponse = await api.get(`/api/v1/viral-matching/viral-templates/${templateId}`)
      
      const templateData = templateResponse.data
      console.log('🎬 Template data loaded:', templateData)
      setTemplate(templateData)

      // Parse slots from script
      if (templateData.script) {
        console.log('📜 Template script:', templateData.script)
        const parsedSlots = parseTemplateScript(templateData.script)
        console.log('🎯 Parsed template slots:', parsedSlots)
        setTemplateSlots(parsedSlots)
      } else {
        console.warn('⚠️ No script found in template data')
      }
    } catch (error) {
      console.error('Error loading template:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadContentLibrary = async () => {
    try {
      console.log('🔍 Loading content library for property:', selectedProperty)
      
      // Charge les vidéos disponibles pour cette propriété (uploaded, ready, completed)
      const response = await api.get(`/api/v1/videos?property_id=${selectedProperty}&status=uploaded,ready,completed&video_type=uploaded`)

      console.log('📡 Content library response status:', response.status)

      const data = response.data
      console.log('📚 Raw content library data:', data)
      
      // API retourne directement un array de videos, pas un objet avec un champ "videos"
      if (data && Array.isArray(data)) {
        const videos = data.map((video: any) => ({
          id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          video_url: video.video_url,
          duration: video.duration || 10,
          description: video.description || ''
        }))
        
        console.log('✅ Processed content videos:', videos.length, 'videos for property:', selectedProperty)
        setContentVideos(videos)
      } else {
        console.warn('⚠️ No videos found for this property or invalid data structure')
        console.log('Expected array, received:', typeof data, data)
        setContentVideos([])
      }
    } catch (error) {
      console.error('❌ Error loading content library:', error)
    }
  }

  const parseTemplateScript = (script: string): TemplateSlot[] => {
    try {
      let cleanScript = script.trim()
      
      // Supprimer les préfixes '=' s'ils existent (peut être == ou =)
      while (cleanScript.startsWith('=')) {
        cleanScript = cleanScript.slice(1).trim()
      }
      
      console.log('🔧 Original script:', script.substring(0, 100))
      console.log('🔧 Cleaned script:', cleanScript.substring(0, 100))
      
      // Vérifier si c'est du JSON valide
      if (!cleanScript.startsWith('{') && !cleanScript.startsWith('[')) {
        console.warn('Script does not appear to be valid JSON:', cleanScript.substring(0, 100))
        return []
      }

      const scriptData = JSON.parse(cleanScript)
      console.log('📜 Parsed script data:', scriptData)
      const clips = scriptData.clips || []
      console.log('🎯 Found clips:', clips.length, clips)

      if (clips.length === 0) {
        console.warn('⚠️ No clips found in script data')
        return []
      }

      let currentTime = 0
      return clips.map((clip: any, index: number) => {
        const duration = clip.duration || clip.end - clip.start || 3
        const slot: TemplateSlot = {
          id: `slot_${index}`,
          order: clip.order || index + 1,
          duration,
          description: clip.description || `Slot ${index + 1}`,
          start_time: currentTime,
          end_time: currentTime + duration
        }
        currentTime += duration
        console.log('🎬 Created slot:', slot)
        return slot
      })
    } catch (error) {
      console.error('Error parsing template script:', error)
      console.error('Original script:', script.substring(0, 200))
      return []
    }
  }

  const createScriptFromTimeline = (assignments: any[], textOverlays: any[]) => {
    const clips = assignments
      .filter(assignment => assignment.videoId) // Seulement les slots avec des vidéos assignées
      .sort((a, b) => {
        // Trier par ordre des slots
        const slotA = templateSlots.find(slot => slot.id === a.slotId)
        const slotB = templateSlots.find(slot => slot.id === b.slotId)
        return (slotA?.order || 0) - (slotB?.order || 0)
      })
      .map((assignment, index) => {
        const slot = templateSlots.find(slot => slot.id === assignment.slotId)
        const video = contentVideos.find(video => video.id === assignment.videoId)
        
        return {
          order: index + 1,
          duration: slot?.duration || 3,
          description: slot?.description || `Segment ${index + 1}`,
          video_url: video?.video_url || '',
          video_id: video?.id || '',
          start_time: slot?.start_time || 0,
          end_time: slot?.end_time || 3
        }
      })

    const texts = textOverlays.map(text => ({
      content: text.content,
      start_time: text.start_time,
      end_time: text.end_time || text.start_time + 3,
      // Inclure toutes les données de position et style
      position: text.position,
      style: text.style
    }))

    return {
      clips,
      texts,
      total_duration: templateSlots.reduce((sum, slot) => sum + slot.duration, 0)
    }
  }

  const handleTimelineUpdate = (assignments: any[], textOverlays: any[]) => {
    setCurrentAssignments(assignments)
    setCurrentTextOverlays(textOverlays)
  }

  const handleGenerate = async (assignments: any[], textOverlays: any[]) => {
    console.log('🚨🚨🚨 HANDLEGENERATE FUNCTION CALLED! 🚨🚨🚨')
    console.log('🎬 handleGenerate called with:', { assignments, textOverlays })
    console.log('📍 Text overlays positions:')
    textOverlays.forEach((text, i) => {
      console.log(`   Text ${i+1}: "${text.content}" -> x:${text.position.x}, y:${text.position.y} (${text.position.anchor})`)
    })
    try {
      // Créer un script personnalisé basé sur la timeline
      const customScript = createScriptFromTimeline(assignments, textOverlays)
      console.log('📜 Generated custom script:', customScript)
      
      const generationData = {
        property_id: selectedProperty,
        source_type: 'viral_template_composer',
        source_data: {
          template_id: templateId,
          slot_assignments: assignments,
          text_overlays: textOverlays,
          custom_script: customScript,
          total_duration: template?.duration || 30,
          user_input: promptFromUrl || ''  // Store user's original idea for AI description generation
        },
        language: 'fr'
      }
      
      console.log('📤 Sending generation request:', generationData)

      const response = await api.post('/api/v1/video-generation/generate-from-viral-template', generationData)
      
      const result = response.data
      console.log('✅ Video generation successful:', result)
      // Redirect to video preview page
      if (result.video_id) {
        router.push(`/dashboard/videos/${result.video_id}/preview`)
      } else {
        router.push('/dashboard/videos')
      }
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Erreur lors de la génération de la vidéo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Chargement du template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template non trouvé</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  if (!selectedProperty) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Choisir une Propriété</h1>
            <p className="text-gray-600 mb-6">
              Sélectionnez la propriété pour laquelle vous voulez créer cette vidéo :
            </p>
            
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => setSelectedProperty(property.id)}
                  className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <h3 className="font-medium text-gray-900">{property.name}</h3>
                  <p className="text-sm text-gray-600">{property.city || 'No location'}</p>
                </div>
              ))}
            </div>

            {properties.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune propriété trouvée</p>
                <Button 
                  onClick={() => router.push('/dashboard/properties/new')}
                  className="mt-4"
                >
                  Ajouter une Propriété
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const selectedPropertyData = properties.find(p => p.id === selectedProperty)

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoGenerationNavbar 
        currentStep={3}
        propertyId={selectedProperty}
        templateId={templateId}
        showGenerationButtons={true}
        onRandomTemplate={() => {
          // Add text functionality
          if ((window as any).videoTimelineAddText) {
            (window as any).videoTimelineAddText()
          }
        }}
        onGenerateTemplate={() => {
          // Create video functionality - call handleGenerate with current assignments and text overlays
          console.log('🔘 Create Video button clicked - calling handleGenerate with current state')
          console.log('📊 Current assignments:', currentAssignments.length)
          console.log('📝 Current text overlays:', currentTextOverlays.length)
          handleGenerate(currentAssignments, currentTextOverlays)
        }}
        isGenerating={false}
      />
      
      <VideoTimelineEditor
        templateTitle={template.title}
        templateSlots={templateSlots}
        contentVideos={contentVideos}
        onGenerate={handleGenerate}
        propertyId={selectedProperty}
        templateId={templateId}
        onAddText={() => {}}
        onGenerateVideo={() => {}}
        onTimelineUpdate={handleTimelineUpdate}
      />
    </div>
  )
}