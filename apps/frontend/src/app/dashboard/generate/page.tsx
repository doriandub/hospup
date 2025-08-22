'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProperties } from '@/hooks/useProperties'
import { api } from '@/lib/api'
import { 
  ArrowLeft,
  Sparkles,
  Shuffle,
  Building,
  Building2,
  Plus,
  Eye,
  Heart,
  Users,
  CheckCircle,
  ExternalLink,
  Download,
  Zap,
  Loader2,
  MessageSquare,
  Play,
  Copy,
  Type,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { TextGenerator } from '@/components/text-generator'

interface InstagramTemplate {
  id: string
  instagram_url: string
  instagram_id: string
  title: string
  description: string
  view_count: number
  like_count: number
  comment_count: number
  follower_count: number
  viral_score: number
  engagement_rate: number
  hashtags: string[]
  category: string
  scene_types: string[]
  prompt_suggestion: string
  difficulty_level: string
  author_username: string
  author_follower_count: number
  author_verified: boolean
  duration_seconds: number
  aspect_ratio: string
  has_music: boolean
  has_text_overlay: boolean
  language: string
}

interface Property {
  id: string
  name: string
  location: string
  language: string
}

interface GeneratedVideo {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
}

interface ViralTemplate {
  id: string
  title: string
  description: string
  category: string
  popularity_score: number
  total_duration_min: number
  total_duration_max: number
  tags: string[]
}

export default function GenerateVideoPage() {
  const router = useRouter()
  const { properties } = useProperties()
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState<InstagramTemplate | null>(null)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [step, setStep] = useState<'input' | 'template' | 'texts' | 'generated'>('input')
  const [loading, setLoading] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [viralTemplates, setViralTemplates] = useState<ViralTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [reconstructionPlan, setReconstructionPlan] = useState<any>(null)
  const [customTexts, setCustomTexts] = useState<any[]>([])
  const [showInstagramEmbed, setShowInstagramEmbed] = useState(false)

  // Comprehensive language list
  const languages = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'ko', name: 'Korean' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'zu', name: 'Zulu' }
  ]

  // Format number with abbreviations
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Get viral score color
  const getViralScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Load viral templates from database
  useEffect(() => {
    const loadViralTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const response = await api.get('/api/v1/viral-matching/viral-templates')
        setViralTemplates(response.data)
      } catch (error) {
        console.error('Failed to load viral templates:', error)
      } finally {
        setLoadingTemplates(false)
      }
    }
    
    loadViralTemplates()
  }, [])

  // Auto-select property language when property is selected
  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty)
      if (property && property.language) {
        setSelectedLanguage(property.language)
      }
    }
  }, [selectedProperty, properties])

  const generateRandomPrompt = () => {
    if (viralTemplates.length > 0) {
      const randomTemplate = viralTemplates[Math.floor(Math.random() * viralTemplates.length)]
      setPrompt(randomTemplate.description)
    }
  }

  const handleGenerateIdea = async (excludeCurrentTemplate = false) => {
    if (!selectedProperty || !prompt.trim()) {
      alert('Please select a property and enter a description')
      return
    }

    setLoading(true)
    try {
      // Use our intelligent smart-match endpoint
      const smartMatchResponse = await api.post('/api/v1/viral-matching/smart-match', {
        property_id: selectedProperty,
        user_description: prompt,
        exclude_template_id: excludeCurrentTemplate && template ? template.id : null
      })
      
      const smartMatch = smartMatchResponse.data
      
      if (smartMatch) {
        // Convert viral template to InstagramTemplate format using real data from smart match
        const convertedTemplate: InstagramTemplate = {
          id: smartMatch.id,
          instagram_url: smartMatch.video_link || '#',
          instagram_id: smartMatch.id,
          title: smartMatch.title || 'Vidéo virale',
          description: smartMatch.description,
          view_count: smartMatch.views || 0,
          like_count: smartMatch.likes || 0,
          comment_count: smartMatch.comments || 0,
          follower_count: smartMatch.followers || 100000,
          viral_score: smartMatch.views && smartMatch.followers ? Math.min(5.0, (smartMatch.views / smartMatch.followers) * 10) : 2.5, // Views/followers ratio as viral score
          engagement_rate: smartMatch.views && smartMatch.followers ? Math.min(1.0, smartMatch.views / smartMatch.followers) : 0.85,
          hashtags: smartMatch.tags || [],
          category: smartMatch.category,
          scene_types: [],
          prompt_suggestion: prompt,
          difficulty_level: 'Medium',
          author_username: smartMatch.username || 'viral_creator',
          author_follower_count: smartMatch.followers || 100000,
          author_verified: true,
          duration_seconds: Math.floor(smartMatch.total_duration_max || 30),
          aspect_ratio: '9:16',
          has_music: true,
          has_text_overlay: true,
          language: selectedLanguage
        }
        
        setTemplate(convertedTemplate)
        
        // Preload reconstruction plan for immediate display
        try {
          const reconstructionResponse = await api.post('/api/v1/video-reconstruction/reconstruct-video', {
            template_id: smartMatch.id,
            property_id: selectedProperty
          })
          
          setReconstructionPlan(reconstructionResponse.data.reconstruction_plan)
          console.log('🎬 Reconstruction plan preloaded:', reconstructionResponse.data.message)
        } catch (error) {
          console.log('Could not preload reconstruction plan')
        }
        
        setStep('template')
        return
      }
      
      // Fallback to random viral template from database if smart match fails
      if (viralTemplates.length > 0) {
        let availableTemplates = viralTemplates
        
        // Exclude current template if requested
        if (excludeCurrentTemplate && template) {
          availableTemplates = viralTemplates.filter(t => t.id !== template.id)
        }
        
        // Make sure we have templates to choose from
        if (availableTemplates.length === 0) {
          availableTemplates = viralTemplates
        }
        
        const randomViralTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
        
        // Convert viral template to InstagramTemplate format
        const convertedTemplate: InstagramTemplate = {
          id: randomViralTemplate.id,
          instagram_url: '#viral-template-fallback',
          instagram_id: randomViralTemplate.id,
          title: randomViralTemplate.title,
          description: randomViralTemplate.description,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          like_count: Math.floor(Math.random() * 50000) + 5000,
          comment_count: Math.floor(Math.random() * 2000) + 200,
          follower_count: Math.floor(Math.random() * 500000) + 50000,
          viral_score: randomViralTemplate.popularity_score / 2,
          engagement_rate: 0.75, // Default good engagement
          hashtags: randomViralTemplate.tags || [],
          category: randomViralTemplate.category,
          scene_types: [],
          prompt_suggestion: prompt,
          difficulty_level: 'Medium',
          author_username: 'viral_creator',
          author_follower_count: Math.floor(Math.random() * 1000000) + 100000,
          author_verified: true,
          duration_seconds: Math.floor(randomViralTemplate.total_duration_max || 30),
          aspect_ratio: '9:16',
          has_music: true,
          has_text_overlay: true,
          language: selectedLanguage
        }
        
        setTemplate(convertedTemplate)
        setStep('template')
      } else {
        alert('No viral templates available. Please try again later.')
      }
    } catch (error) {
      console.error('Failed to load template:', error)
      alert('Failed to find matching template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyDescription = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add a toast notification here
  }

  const handleRecreate = async () => {
    if (!template || !selectedProperty || !prompt) return

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Get reconstruction plan using our new video reconstruction service
      let reconstructionPlan = null
      
      try {
        const reconstructionResponse = await api.post('/api/v1/video-reconstruction/reconstruct-video', {
          template_id: template.id,
          property_id: selectedProperty
        })
        
        const reconstructionData = reconstructionResponse.data
        reconstructionPlan = reconstructionData.reconstruction_plan
        
        // Store for UI display
        setReconstructionPlan(reconstructionPlan)
        
        // Log success message for user feedback
        console.log('✅ Reconstruction plan:', reconstructionData.message)
      } catch (error) {
        console.log('No reconstruction plan available, using basic generation')
      }
      
      // Generate video using video generation API
      const generationData = {
        property_id: selectedProperty,
        source_type: 'viral_template',
        source_data: {
          template_id: template.id,
          prompt: prompt,
          language: selectedLanguage,
          reconstruction_plan: reconstructionPlan,
          custom_texts: customTexts.length > 0 ? customTexts : null
        },
        language: selectedLanguage
      }
      
      const response = await api.post('/api/v1/video-generation/generate-from-viral-template', generationData)
      
      const result = response.data
      
      const propertyName = properties.find(p => p.id === selectedProperty)?.name || 'Property'
      
      // Create generated video object
      const generatedVideo: GeneratedVideo = {
        id: result.video_id || 'generated-' + Date.now(),
        title: `${template.title} - ${propertyName} Version`,
        description: createViralDescription(prompt, template, propertyName, selectedLanguage, reconstructionPlan),
        video_url: result.video_url || '#generating',
        thumbnail_url: result.thumbnail_url || '#generating'
      }
      
      setGeneratedVideo(generatedVideo)
      setStep('generated')
      
      // Poll for completion if video is still processing
      if (result.status === 'processing') {
        pollVideoStatus(result.video_id)
      }
    } catch (error) {
      console.error('Failed to generate video:', error)
      alert('Failed to generate video. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const createViralDescription = (prompt: string, template: InstagramTemplate, propertyName: string, language: string, reconstructionPlan: any) => {
    const translations = {
      en: {
        using: 'Generated using viral template',
        tags: '#viral #hospitality #contentcreation',
        powered: 'Powered by HospUp AI'
      },
      fr: {
        using: 'Généré avec le modèle viral',
        tags: '#viral #hospitalité #créationcontenu',
        powered: 'Propulsé par HospUp IA'
      },
      es: {
        using: 'Generado usando plantilla viral',
        tags: '#viral #hospitalidad #creacióncontenido',
        powered: 'Impulsado por HospUp AI'
      },
      de: {
        using: 'Erstellt mit viralem Template',
        tags: '#viral #gastgewerbe #inhaltserstellung',
        powered: 'Angetrieben von HospUp KI'
      },
      it: {
        using: 'Generato usando template virale',
        tags: '#viral #ospitalità #creazione',
        powered: 'Alimentato da HospUp AI'
      },
      pt: {
        using: 'Gerado usando template viral',
        tags: '#viral #hospitalidade #criaçãoconteúdo',
        powered: 'Alimentado por HospUp AI'
      }
    }
    
    const t = translations[language] || translations.en
    
    let description = `${prompt}\n\n${t.using}: ${template.title}\n`
    
    if (reconstructionPlan) {
      const stats = reconstructionPlan.statistics
      description += `🎯 Plan de reconstruction créé:\n`
      description += `📊 Correspondance: ${stats?.matched_clips}/${stats?.total_clips} clips (${stats?.match_percentage?.toFixed(1) || 0}%)\n`
      description += `🎬 Durée totale: ${reconstructionPlan.template_info?.duration || template.duration_seconds}s\n`
      description += `📹 Vidéos utilisées: ${stats?.available_videos_count || 0} disponibles\n`
      
      if (stats?.can_create_video) {
        description += `✅ Vidéo complète possible\n`
      } else {
        description += `⚠️ ${stats?.missing_clips || 0} scène(s) à filmer\n`
      }
    }
    
    description += `\n${t.tags} #${propertyName.toLowerCase().replace(/\s+/g, '')}\n\n${t.powered}`
    
    return description
  }
  
  const pollVideoStatus = async (videoId: string) => {
    const token = localStorage.getItem('access_token')
    const maxPolls = 30 // 5 minutes max
    let polls = 0
    
    const poll = async () => {
      try {
        const response = await api.get(`/api/v1/videos/${videoId}`)
        
        const video = response.data
        
        if (video.status === 'completed') {
          // Update the generated video with real URLs
          setGeneratedVideo(prev => prev ? {
            ...prev,
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url || prev.thumbnail_url
          } : null)
          return
        }
        
        if (video.status === 'failed') {
          alert('Video generation failed. Please try again.')
          return
        }
        
        polls++
        if (polls < maxPolls) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling video status:', error)
      }
    }
    
    setTimeout(poll, 10000) // Start polling after 10 seconds
  }

  const handleStartOver = () => {
    setStep('input')
    setPrompt('')
    setSelectedProperty('')
    setSelectedLanguage('en')
    setTemplate(null)
    setGeneratedVideo(null)
    setReconstructionPlan(null)
    setCustomTexts([])
  }

  // No properties check
  if (properties.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-6">
            You need to add at least one property before generating videos
          </p>
          <Link href="/dashboard/properties/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-8 h-8 text-primary mr-3" />
              Generate Viral Video
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'input' && 'Select property, language, and describe what you want to create'}
              {step === 'template' && 'Template matched! Preview and customize'}
              {step === 'texts' && 'Customize your texts and positioning'}
              {step === 'generated' && 'Your viral video is ready!'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generate Video</h2>
            
            {/* Property and Language Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Property
                </label>
                <div className="space-y-2">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => setSelectedProperty(property.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProperty === property.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <h3 className="font-medium text-gray-900">{property.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{property.location}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Language
                </label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do you want to highlight? (e.g., 'Romantic sunset dinner on the rooftop terrace')"
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
              />
              
              <div className="flex justify-between items-center mt-3">
                <Button
                  variant="outline"
                  onClick={generateRandomPrompt}
                  className="flex items-center"
                  disabled={loadingTemplates || viralTemplates.length === 0}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {loadingTemplates ? 'Loading...' : `Random Idea (${viralTemplates.length} available)`}
                </Button>
                <span className="text-sm text-gray-500">
                  Click below to generate template
                </span>
              </div>
            </div>

            {/* Generate Idea Button */}
            <Button
              onClick={handleGenerateIdea}
              disabled={!selectedProperty || !prompt.trim() || loading}
              className="w-full bg-primary text-white hover:bg-primary/90 py-4 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Template...
                </>
              ) : (
                'Generate Idea'
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Template */}
        {step === 'template' && template && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Template Match Found!</h2>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => handleGenerateIdea(true)} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 mr-2" />
                      Nouvelle idée
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep('input')}>
                  ← Change Description
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Instagram Embed Preview */}
              <div>
{showInstagramEmbed ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                    {/* Instagram-like embed header */}
                    <div className="flex items-center p-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{template.author_username.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 text-sm">@{template.author_username}</span>
                          {template.author_verified && <CheckCircle className="w-3 h-3 ml-1 text-blue-500" />}
                        </div>
                        <div className="text-xs text-gray-500">Original video</div>
                      </div>
                    </div>

                    {/* Video preview area */}
                    <div className="aspect-[9/16] max-h-96 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 relative flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Play className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">{template.title}</p>
                        <p className="text-xs opacity-75">{template.duration_seconds}s</p>
                      </div>
                      
                      {/* Metrics Overlay */}
                      <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {formatNumber(template.view_count)} views
                      </div>
                      <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Ratio: {template.follower_count > 0 ? (template.view_count / template.follower_count).toFixed(1) : 'N/A'}
                      </div>
                    </div>

                    {/* Instagram-like footer */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center space-x-4 text-gray-900">
                        <Heart className="w-5 h-5" />
                        <MessageSquare className="w-5 h-5" />
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatNumber(template.like_count)} likes</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">@{template.author_username}</span> {template.description?.slice(0, 100)}...
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center relative mb-4 overflow-hidden cursor-pointer"
                       onClick={() => setShowInstagramEmbed(true)}>
                    {/* Instagram-like embedded content */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Play className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium mb-1">Instagram Post Preview</p>
                        <p className="text-sm opacity-90">Click to view embedded version</p>
                      </div>
                    </div>
                    
                    {/* Metrics Overlay */}
                    <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {formatNumber(template.view_count)} views
                    </div>
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ratio: {template.follower_count > 0 ? (template.view_count / template.follower_count).toFixed(1) : 'N/A'}
                    </div>
                  </div>
                )}

                {/* Toggle and View Original Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowInstagramEmbed(!showInstagramEmbed)}
                  >
                    {showInstagramEmbed ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Show Simple Preview
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Show Instagram Embed
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(template.instagram_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Original on Instagram
                  </Button>
                </div>
                
                {/* Template Stats */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(template.view_count)}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(template.like_count)}</div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(template.author_follower_count)}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{template.title}</h3>
                <p className="text-gray-600 mb-4">{template.description}</p>

                {/* Author Info */}
                <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{template.author_username.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">@{template.author_username}</span>
                      {template.author_verified && <CheckCircle className="w-4 h-4 ml-1 text-blue-500" />}
                    </div>
                    <div className="text-sm text-gray-500">{formatNumber(template.author_follower_count)} followers</div>
                  </div>
                </div>

                {/* Matching Info */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-green-900">Template trouvé !</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    Cette vidéo correspond à votre description et a un bon ratio vues/abonnés ({template.follower_count > 0 ? (template.view_count / template.follower_count).toFixed(1) : 'N/A'})
                  </p>
                  <div className="text-xs text-green-600 space-y-1">
                    <div>✅ Catégorie: {template.category}</div>
                    <div>✅ Auteur: @{template.author_username}</div>
                    <div>✅ Durée: ~{template.duration_seconds}s</div>
                  </div>
                </div>

                {/* Reconstruction Plan Preview */}
                {reconstructionPlan && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Zap className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Plan de Reconstruction Créé</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>🎬 {reconstructionPlan.statistics?.matched_clips}/{reconstructionPlan.statistics?.total_clips} clips matchés ({reconstructionPlan.statistics?.match_percentage?.toFixed(1)}%)</div>
                      <div>📹 {reconstructionPlan.statistics?.available_videos_count} vidéos disponibles</div>
                      <div>⏱️ Durée: {reconstructionPlan.template_info?.duration}s</div>
                      {reconstructionPlan.statistics?.can_create_video ? (
                        <div className="text-green-700 font-medium">✅ Toutes les scènes disponibles</div>
                      ) : (
                        <div className="text-orange-700">⚠️ {reconstructionPlan.statistics?.missing_clips} scène(s) manquante(s)</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(`/dashboard/compose/${template.id}?property=${selectedProperty}`)}
                    className="w-full bg-primary text-white hover:bg-primary/90 py-4 text-lg"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Composer la Vidéo
                  </Button>
                  <Button
                    onClick={() => setStep('texts')}
                    variant="outline"
                    className="w-full py-3"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Mode Rapide (Textes seulement)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Texts Customization */}
        {step === 'texts' && template && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Customize Your Texts</h2>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep('template')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Template
                </Button>
              </div>
            </div>

            {/* Text Generator Component */}
            <TextGenerator
              language={selectedLanguage}
              propertyName={properties.find(p => p.id === selectedProperty)?.name || ''}
              onTextsChange={setCustomTexts}
              initialTexts={customTexts}
            />

            {/* Generate Video Button */}
            <div className="mt-8 border-t pt-6">
              <Button
                onClick={handleRecreate}
                disabled={loading || customTexts.length === 0}
                className="w-full bg-primary text-white hover:bg-primary/90 py-4 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {reconstructionPlan ? 'Creating from Your Content...' : 'Creating Your Version...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Video with Custom Texts ({customTexts.length} texts)
                  </>
                )}
              </Button>
              
              {customTexts.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-2">
                  Add at least one text to generate your video
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Generated Video */}
        {step === 'generated' && generatedVideo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Your Viral Video is Ready! 🎉</h2>
              <Button variant="outline" onClick={handleStartOver}>
                Create Another
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Thumbnail */}
              <div>
                <div 
                  className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setShowVideoModal(true)}
                >
                  <div className="text-white text-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Play className="w-10 h-10 ml-1" />
                    </div>
                    <p className="text-lg font-medium">Your Generated Video</p>
                    <p className="text-sm opacity-75">Click to preview</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    onClick={() => {
                      if (generatedVideo.video_url && generatedVideo.video_url !== '#generating') {
                        // Create a temporary link element and trigger download
                        const link = document.createElement('a')
                        link.href = generatedVideo.video_url
                        link.download = `${generatedVideo.title}.mp4`
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      } else {
                        alert('Vidéo encore en cours de traitement, veuillez patienter...')
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {generatedVideo.video_url && generatedVideo.video_url !== '#generating' ? 'Download Video' : 'Processing...'}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to 4K (Premium)
                  </Button>
                </div>
              </div>

              {/* Generated Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{generatedVideo.title}</h3>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Generated Description
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyDescription(generatedVideo.description)}
                      className="text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{generatedVideo.description}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Sparkles className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Pro Tips for Maximum Engagement</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Post during peak hours (7-9 PM)</li>
                        <li>• Use trending hashtags from the original template</li>
                        <li>• Engage with comments in the first hour</li>
                        <li>• Share across all your social platforms</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {showVideoModal && generatedVideo && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{generatedVideo.title}</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowVideoModal(false)}
                  >
                    Close
                  </Button>
                </div>
                
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Play className="w-8 h-8 ml-1" />
                    </div>
                    <p className="text-lg font-medium">Video Preview</p>
                    <p className="text-sm opacity-75">Your generated content</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button className="flex-1 bg-primary text-white hover:bg-primary/90">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Zap className="w-4 h-4 mr-2" />
                    4K Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}