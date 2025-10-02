'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle,
  ExternalLink,
  Video,
  RefreshCw,
  TrendingUp,
  Shuffle
} from 'lucide-react'
import { VideoGenerationHeader } from '@/components/video-generation/VideoGenerationHeader'
import { InstagramEmbed } from '@/components/social/InstagramEmbed'
import { api } from '@/lib/api'

interface ViralTemplate {
  id: string
  title: string
  description: string
  category: string
  hotel_name?: string
  country?: string
  username?: string
  video_link?: string
  views?: number
  likes?: number
  comments?: number
  followers?: number
  script?: any
  popularity_score?: number
  duration?: number
}

export default function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')
  
  const propertyId = searchParams.get('property')
  const userDescription = searchParams.get('description')
  const isRandomGeneration = userDescription === 'Template choisi aléatoirement'

  useEffect(() => {
    loadTemplate()
  }, [resolvedParams.templateId])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const templateData = await api.get(`/api/v1/viral-matching/viral-templates/${resolvedParams.templateId}`) as ViralTemplate
      console.log('🎬 Template loaded:', templateData)
      setSelectedTemplate(templateData)
      setError('')
      
      // Track template view
      await trackTemplateView(templateData.id)
    } catch (error: any) {
      console.error('Failed to load template:', error)
      if (error?.message?.includes('404')) {
        setError('Template non trouvé')
      } else if (error?.message?.includes('connection') || error?.message?.includes('timeout')) {
        setError('Problème de connexion. Veuillez réessayer.')
      } else {
        setError('Erreur lors du chargement du template')
      }
    } finally {
      setLoading(false)
    }
  }

  const trackTemplateView = async (templateId: string) => {
    try {
      // Temporarily disabled due to route not implemented
      console.log('Template viewed:', templateId)
    } catch (error) {
      console.error('Failed to track template view:', error)
    }
  }

  const handleRegenerateTemplate = async () => {
    if (!selectedTemplate) return
    
    setRegenerating(true)
    try {
      let newTemplate: ViralTemplate | null = null
      
      // Get all templates and pick a random one
      const allTemplates = await api.get('/api/v1/viral-matching/viral-templates') as ViralTemplate[]
      
      if (!allTemplates || allTemplates.length === 0) {
        throw new Error('Aucun template disponible')
      }
      
      // Filter out current template
      const availableTemplates = allTemplates.filter(t => t.id !== selectedTemplate.id)
      
      if (availableTemplates.length === 0) {
        throw new Error('Aucun autre template disponible')
      }
      
      // Pick random template
      newTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]

      if (newTemplate) {
        setSelectedTemplate(newTemplate)
        setError('')
        
        // Update URL without page reload
        const params = new URLSearchParams()
        if (propertyId) params.set('property', propertyId)
        if (userDescription) params.set('description', userDescription)
        
        window.history.pushState({}, '', `/dashboard/template-preview/${newTemplate.id}?${params.toString()}`)
        
        // Track new template view
        await trackTemplateView(newTemplate.id)
      }
      
    } catch (error: any) {
      console.error('Failed to regenerate template:', error)
      if (error?.message?.includes('connection') || error?.message?.includes('timeout')) {
        setError('Problème de connexion. Veuillez réessayer.')
      } else {
        setError(error.message || 'Impossible de charger un nouveau template')
      }
    } finally {
      setRegenerating(false)
    }
  }

  const handleCreateVideo = async () => {
    if (!propertyId || !selectedTemplate) {
      alert('Propriété manquante')
      return
    }

    try {
      // Call smart-match API to auto-assign assets to slots
      console.log('🧠 Starting smart matching...', { propertyId, templateId: selectedTemplate.id })

      const matchResponse = await api.post('/api/v1/video-generation/smart-match', {
        property_id: propertyId,
        template_id: selectedTemplate.id
      }) as any

      console.log('✅ Smart matching completed:', matchResponse)

      // Encode assignments as JSON for compose page
      const assignmentsJson = encodeURIComponent(JSON.stringify(matchResponse.slot_assignments || []))
      const composeUrl = `/dashboard/compose/${selectedTemplate.id}?property=${propertyId}&assignments=${assignmentsJson}&prompt=${encodeURIComponent(userDescription || '')}`

      router.push(composeUrl as any)
    } catch (error) {
      console.error('❌ Smart matching failed:', error)
      // Fallback: go to compose without pre-filled assignments
      const composeUrl = `/dashboard/compose/${selectedTemplate.id}?property=${propertyId}&prompt=${encodeURIComponent(userDescription || '')}`
      router.push(composeUrl as any)
    }
  }

  const handleInstagramClick = () => {
    if (selectedTemplate?.video_link) {
      window.open(selectedTemplate.video_link, '_blank')
    }
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getClipsCount = (script?: any) => {
    if (!script) return 0
    try {
      if (typeof script === 'object' && script.clips) {
        return script.clips.length || 0
      }
      if (typeof script === 'string') {
        // Handle string scripts that might be JSON
        let cleanScript = script.trim()
        while (cleanScript.startsWith('=')) {
          cleanScript = cleanScript.slice(1).trim()
        }
        const parsed = JSON.parse(cleanScript)
        return parsed?.clips?.length || 0
      }
      return 0
    } catch {
      return 0
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '0s'
    if (duration >= 60) {
      const minutes = Math.floor(duration / 60)
      const seconds = Math.round(duration % 60)
      return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`
    }
    return `${Math.round(duration)}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <VideoGenerationHeader
          currentStep={2}
          propertyId={propertyId || undefined}
          templateId={resolvedParams.templateId}
          showGenerationButtons={false}
          onRandomTemplate={() => {}}
          onGenerateTemplate={() => {}}
          isGenerating={false}
        />
        <div className="grid grid-cols-1 gap-3 p-8 max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-red-500 mb-4">
              <Video className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error || 'Ce template viral n\'existe pas.'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={loadTemplate} variant="outline" disabled={loading}>
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Réessayer
              </Button>
              <Button onClick={() => router.push('/dashboard/generate')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <VideoGenerationHeader
        currentStep={2}
        propertyId={propertyId || undefined}
        templateId={resolvedParams.templateId}
        showGenerationButtons={true}
        onRandomTemplate={handleRegenerateTemplate}
        onGenerateTemplate={handleCreateVideo}
        isGenerating={regenerating}
      />
      
      {/* Exact Copy-Paste of Video Preview 3-Column Design */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* Colonne de gauche: Vidéo verticale */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
              <div className="aspect-[9/16] bg-black relative w-full max-w-sm mx-auto flex-shrink-0">
                {selectedTemplate.video_link && selectedTemplate.video_link.includes('instagram.com') ? (
                  <div className="w-full h-full">
                    <InstagramEmbed 
                      postUrl={selectedTemplate.video_link}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Template Viral</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne du milieu: Stats et info template */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#ff914d]" />
                <h3 className="text-lg font-semibold text-gray-900">Template Viral</h3>
              </div>

              {/* Template Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                    {selectedTemplate.hotel_name}
                  </h2>
                  {selectedTemplate.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#09725c]/10 text-[#09725c] ml-2">
                      {selectedTemplate.category}
                    </span>
                  )}
                </div>
                {selectedTemplate.country && (
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {selectedTemplate.country}
                  </p>
                )}
                {selectedTemplate.username && (
                  <p className="text-sm text-gray-500">
                    @{selectedTemplate.username.replace('@', '')}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-[#09725c]" />
                  <span className="font-semibold">{formatNumber(selectedTemplate.views)}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  <span className="font-semibold">{formatNumber(selectedTemplate.likes)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-[#ff914d]" />
                  <span className="font-semibold">{formatNumber(selectedTemplate.followers)}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="font-semibold">{formatNumber(selectedTemplate.comments)}</span>
                </div>
              </div>

              {/* Engagement Ratio */}
              <div className="bg-gray-50 rounded-lg py-3 px-4 mb-6">
                <div className="flex items-center justify-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="text-purple-700 font-semibold">
                    Engagement: {(((selectedTemplate.likes || 0) + (selectedTemplate.comments || 0)) / (selectedTemplate.views || 1) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Template Description */}
              {userDescription && (
                <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#ff914d] mb-6">
                  <div className="text-sm text-gray-600 mb-1">Description utilisée:</div>
                  <p className="text-gray-800 text-sm italic">"{userDescription}"</p>
                </div>
              )}

              {/* Instagram Button */}
              <div className="mt-auto">
                <Button
                  variant="outline"
                  onClick={handleInstagramClick}
                  disabled={!selectedTemplate.video_link}
                  className="w-full flex items-center justify-center space-x-2 py-3 mb-4"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Voir sur Instagram</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Colonne de droite: Actions et ratios clés */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-[#09725c]" />
                <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                {/* Ratios clés */}
                {selectedTemplate.likes && selectedTemplate.followers && (
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <TrendingUp className="w-6 h-6 text-[#09725c] mx-auto mb-3" />
                    <div className="text-xl font-bold text-[#09725c] mb-1">
                      {((selectedTemplate.likes / selectedTemplate.followers) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Taux d'engagement</div>
                    <div className="text-xs text-gray-500">(likes ÷ followers)</div>
                  </div>
                )}
                
                {selectedTemplate.views && selectedTemplate.followers && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <Eye className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                    <div className="text-xl font-bold text-blue-600 mb-1">
                      {(selectedTemplate.views / selectedTemplate.followers).toFixed(1)}x
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Ratio Performance</div>
                    <div className="text-xs text-gray-500">(vues ÷ followers)</div>
                  </div>
                )}

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Video className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{getClipsCount(selectedTemplate.script)}</div>
                    <div className="text-sm text-gray-600">Clips</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <RefreshCw className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{formatDuration(selectedTemplate.duration)}</div>
                    <div className="text-sm text-gray-600">Durée</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mt-auto">
                  <Button 
                    onClick={handleCreateVideo}
                    className="w-full"
                    disabled={!propertyId}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Créer cette vidéo
                  </Button>
                  
                  <Button 
                    onClick={handleRegenerateTemplate}
                    variant="outline"
                    disabled={regenerating}
                    className="w-full"
                  >
                    {regenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shuffle className="w-4 h-4 mr-2" />
                    )}
                    {isRandomGeneration ? 'Autre template' : 'Template similaire'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}