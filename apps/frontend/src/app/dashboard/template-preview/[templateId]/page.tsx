'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle,
  ExternalLink,
  Video,
  RefreshCw,
  TrendingUp,
  Shuffle,
  RotateCcw
} from 'lucide-react'
import { InstagramEmbed } from '@/components/social/InstagramEmbed'
import { VideoGenerationNavbar } from '@/components/video-generation/VideoGenerationNavbar'
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
  script?: string
  popularity_score?: number
  duration?: number
}

interface TemplateSuggestion {
  template: ViralTemplate
  isMain: boolean
}

export default function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')
  const [viewedTemplates, setViewedTemplates] = useState<string[]>([])
  
  const propertyId = searchParams.get('property')
  const userDescription = searchParams.get('description')
  const isRandomGeneration = userDescription === 'Template choisi aléatoirement'

  useEffect(() => {
    generateSuggestions()
  }, [resolvedParams.templateId])

  const generateSuggestions = async () => {
    try {
      // Get main template
      const mainResponse = await api.get(`/api/v1/viral-matching/viral-templates/${resolvedParams.templateId}`)
      const mainTemplate = mainResponse.data

      // Initialize viewed templates with current template
      setViewedTemplates([resolvedParams.templateId])
      setSelectedTemplate(mainTemplate)

      // Add to viral inspiration
      await addToViralInspiration(mainTemplate.id)
      
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setError('Template non trouvé')
    } finally {
      setLoading(false)
    }
  }

  const addToViralInspiration = async (templateId: string) => {
    try {
      // Temporarily disabled due to database type mismatch
      console.log('Template viewed:', templateId)
    } catch (error) {
      console.error('Failed to add to viral inspiration:', error)
    }
  }

  const handleRegenerateSuggestions = async () => {
    if (!selectedTemplate) return
    
    setRegenerating(true)
    try {
      let newTemplate: ViralTemplate | null = null
      
      if (isRandomGeneration) {
        // For random generation, get a completely random template
        const allResponse = await api.get('/api/v1/viral-matching/viral-templates')
        const availableTemplates = allResponse.data.filter(
          (t: ViralTemplate) => !viewedTemplates.includes(t.id)
        )
        
        if (availableTemplates.length === 0) {
          // If all viewed, reset and exclude only current
          setViewedTemplates([selectedTemplate.id])
          const resetTemplates = allResponse.data.filter((t: ViralTemplate) => t.id !== selectedTemplate.id)
          newTemplate = resetTemplates[Math.floor(Math.random() * resetTemplates.length)]
        } else {
          newTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
        }
      } else {
        // For description-based generation, get multiple matches and filter client-side
        if (!propertyId || !userDescription) return
        
        // Strategy: Make multiple API calls to get variety, then filter out viewed templates
        const uniqueTemplates = new Set<string>()
        const candidates: ViralTemplate[] = []
        const maxCandidates = 10
        let attempts = 0
        const maxAttempts = 20
        
        while (candidates.length < maxCandidates && attempts < maxAttempts) {
          try {
            // Make API call without exclusion to get fresh matches each time
            const matchResponse = await api.post('/api/v1/viral-matching/smart-match', {
              property_id: propertyId,
              user_description: userDescription
            })
            
            if (matchResponse.data && !uniqueTemplates.has(matchResponse.data.id)) {
              uniqueTemplates.add(matchResponse.data.id)
              candidates.push(matchResponse.data)
            }
            
            // Add small delay to potentially get different results
            await new Promise(resolve => setTimeout(resolve, 50))
          } catch (e) {
            console.warn('API call failed, continuing...', e)
          }
          attempts++
        }
        
        // Filter out already viewed templates
        const availableCandidates = candidates.filter(
          (t: ViralTemplate) => !viewedTemplates.includes(t.id)
        )
        
        if (availableCandidates.length > 0) {
          // Pick random from available candidates
          newTemplate = availableCandidates[Math.floor(Math.random() * availableCandidates.length)]
        } else if (candidates.length > 0) {
          // Fallback: reset viewed and pick from all candidates (exclude current)
          const nonCurrentCandidates = candidates.filter(t => t.id !== selectedTemplate.id)
          if (nonCurrentCandidates.length > 0) {
            newTemplate = nonCurrentCandidates[Math.floor(Math.random() * nonCurrentCandidates.length)]
            setViewedTemplates([selectedTemplate.id]) // Reset with current template
          }
        }
        
        if (!newTemplate) {
          alert('No more similar templates found. Try a different description.')
          setRegenerating(false)
          return
        }
      }

      if (!newTemplate) {
        alert('No template found. Please try again.')
        setRegenerating(false)
        return
      }

      // Update the current template and add to viewed (max 10 templates in history)
      setSelectedTemplate(newTemplate)
      setViewedTemplates(prev => {
        const updated = [...prev, newTemplate.id]
        return updated.length > 10 ? updated.slice(-10) : updated
      })
      
      // Add to viral inspiration
      await addToViralInspiration(newTemplate.id)
      
    } catch (error) {
      console.error('Failed to regenerate suggestions:', error)
      alert('Failed to get new template. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  const handleSelectTemplate = async (template: ViralTemplate) => {
    setSelectedTemplate(template)
    
    // Add to viral inspiration
    await addToViralInspiration(template.id)
  }

  const handleRecreateVideo = () => {
    if (!propertyId || !selectedTemplate) {
      alert('Propriété manquante')
      return
    }
    router.push(`/dashboard/compose/${selectedTemplate.id}?property=${propertyId}&prompt=${encodeURIComponent(userDescription || '')}`)
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

  const getClipsCount = (script?: string) => {
    if (!script) return 0
    try {
      let cleanScript = script.trim()
      
      // Supprimer les préfixes '=' s'ils existent (peut être == ou =)
      while (cleanScript.startsWith('=')) {
        cleanScript = cleanScript.slice(1).trim()
      }
      
      const scriptData = typeof cleanScript === 'string' ? JSON.parse(cleanScript) : cleanScript
      return scriptData?.clips?.length || 0
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
        <div className="grid grid-cols-1 gap-3 p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-red-500 mb-4">
              <Video className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Template non trouvé</h2>
            <p className="text-gray-600 mb-6">{error || 'Ce template viral n\'existe pas ou a été supprimé.'}</p>
            <Button onClick={() => router.push('/dashboard/generate')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <VideoGenerationNavbar 
        currentStep={2}
        propertyId={propertyId || undefined}
        templateId={resolvedParams.templateId}
        showGenerationButtons={true}
        onRandomTemplate={handleRegenerateSuggestions}
        onGenerateTemplate={handleRecreateVideo}
        isGenerating={regenerating}
      />
      
      <div className="grid grid-cols-1 gap-3 px-8 pb-8 max-w-6xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Third: Video Preview */}
            <div>
              <div 
                className="bg-gray-100 relative overflow-hidden rounded-lg cursor-pointer aspect-[9/16]"
                onClick={handleInstagramClick}
              >
                {selectedTemplate.video_link && selectedTemplate.video_link.includes('instagram.com') ? (
                  <div className="w-full h-full">
                    <InstagramEmbed 
                      postUrl={selectedTemplate.video_link}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors rounded-lg">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Third: Basic Stats */}
            <div>
              {/* Country Info */}
              {selectedTemplate.country && (
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    📍 {selectedTemplate.country}
                  </p>
                </div>
              )}

              {/* Basic Stats Block */}
              <div className="bg-gray-50 rounded-lg p-6" style={{ height: '400px' }}>
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-[#09725c]" />
                        <span className="text-sm text-gray-600">Vues</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatNumber(selectedTemplate.views)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-600">Likes</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatNumber(selectedTemplate.likes)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-[#ff914d]" />
                        <span className="text-sm text-gray-600">Followers</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatNumber(selectedTemplate.followers)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Comments</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatNumber(selectedTemplate.comments)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">Clips</span>
                      </div>
                      <span className="font-bold text-gray-900">{getClipsCount(selectedTemplate.script)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Durée</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatDuration(selectedTemplate.duration)}</span>
                    </div>
                  </div>

                  {/* Instagram Button */}
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={handleInstagramClick}
                      className="w-full flex items-center justify-center space-x-2 py-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Voir sur Instagram</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Third: Performance Metrics */}
            <div>
              {/* Performance Metrics Block */}
              <div className="bg-gray-50 rounded-lg p-6" style={{ height: '400px', marginTop: selectedTemplate.country ? '60px' : '0px' }}>
                <div className="h-full flex flex-col justify-center space-y-6">
                  {selectedTemplate.likes && selectedTemplate.followers && (
                    <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                      <TrendingUp className="w-6 h-6 text-[#09725c] mx-auto mb-3" />
                      <div className="text-xl font-bold text-[#09725c] mb-1">
                        {((selectedTemplate.likes / selectedTemplate.followers) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mb-1">Taux d'engagement</div>
                      <div className="text-xs text-gray-500">(likes ÷ followers)</div>
                    </div>
                  )}
                  {selectedTemplate.views && selectedTemplate.followers && (
                    <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                      <Eye className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                      <div className="text-xl font-bold text-blue-600 mb-1">
                        {(selectedTemplate.views / selectedTemplate.followers).toFixed(1)}x
                      </div>
                      <div className="text-sm text-gray-600 mb-1">Ratio Performance</div>
                      <div className="text-xs text-gray-500">(vues ÷ followers)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}