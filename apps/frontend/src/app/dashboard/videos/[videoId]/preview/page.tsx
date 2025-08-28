'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Play, Loader2, Copy, ExternalLink, Music, Sparkles, Languages, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VideoGenerationNavbar } from '@/components/video-generation/VideoGenerationNavbar'
import { videosApi, api } from '@/lib/api'

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration: number
  status: string
  source_type: string
  source_data: any
  created_at: string
  viral_video_id?: string
  ai_description?: string
  instagram_audio_url?: string
  property_id?: string
}

interface ViralTemplate {
  id: string
  title: string
  video_link?: string
  hotel_name?: string
  username?: string
  audio_url?: string
}

export default function VideoPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regeneratingDescription, setRegeneratingDescription] = useState(false)
  const [translatingDescription, setTranslatingDescription] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [selectedLength, setSelectedLength] = useState('moyenne')

  const videoId = params.videoId as string

  useEffect(() => {
    loadVideo()
    // Poll for updates every 3 seconds if video is processing
    const interval = setInterval(() => {
      if (video?.status === 'processing') {
        loadVideo()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [videoId, video?.status])

  const loadVideo = async () => {
    try {
      const response = await videosApi.getById(videoId)
      console.log('📹 Video loaded:', response.data)
      const videoData = response.data
      console.log('📹 Video source_data:', videoData.source_data)
      console.log('📹 Video source_type:', videoData.source_type)
      console.log('📹 All video keys:', Object.keys(videoData))
      setVideo(videoData)

      // Load viral template info if video was created from viral template
      if (videoData.viral_video_id) {
        try {
          console.log('🎵 Loading viral template with ID:', videoData.viral_video_id)
          const templateResponse = await api.get(`/api/v1/viral-matching/viral-templates/${videoData.viral_video_id}`)
          console.log('🎵 Viral template response:', templateResponse)
          console.log('🎵 Viral template data:', templateResponse.data)
          setViralTemplate(templateResponse.data)
        } catch (templateError) {
          console.error('❌ Error loading viral template:', templateError)
          console.error('❌ Template error details:', templateError.response?.data)
        }
      } else {
        console.log('🎵 No viral_video_id found in video data')
      }
    } catch (error: any) {
      console.error('Error loading video:', error)
      if (error.response?.status === 404) {
        setError('Vidéo non trouvée')
      } else {
        setError('Erreur lors du chargement de la vidéo')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (video?.video_url) {
      const link = document.createElement('a')
      link.href = video.video_url
      link.download = `${video.title}.mp4`
      link.click()
    }
  }

  const handleShare = () => {
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papier!')
    }
  }

  const handleRegenerateDescription = async () => {
    if (!video) return
    
    setRegeneratingDescription(true)
    try {
      // Call API to regenerate Instagram description with selected language and length
      const response = await api.post(`/api/v1/videos/${videoId}/regenerate-description`, {
        language: selectedLanguage,
        length: selectedLength
      })
      
      if (response.data?.ai_description) {
        setVideo(prev => prev ? {...prev, ai_description: response.data.ai_description} : null)
      }
    } catch (error) {
      console.error('Error regenerating description:', error)
      alert('Erreur lors de la régénération de la description')
    } finally {
      setRegeneratingDescription(false)
    }
  }

  const handleTranslateDescription = async () => {
    if (!video?.ai_description) return
    
    setTranslatingDescription(true)
    try {
      // Call API to translate existing description
      const response = await api.post(`/api/v1/videos/${videoId}/translate-description`, {
        current_description: video.ai_description,
        target_language: selectedLanguage,
        length: selectedLength
      })
      
      if (response.data?.translated_description) {
        setVideo(prev => prev ? {...prev, ai_description: response.data.translated_description} : null)
      }
    } catch (error) {
      console.error('Error translating description:', error)
      alert('Erreur lors de la traduction de la description')
    } finally {
      setTranslatingDescription(false)
    }
  }

  const handleViewAudio = () => {
    console.log('🎵 View Audio clicked!')
    
    // D'abord essayer l'audio_url s'il existe
    if (viralTemplate?.audio_url) {
      console.log('🎵 Opening direct audio link:', viralTemplate.audio_url)
      window.open(viralTemplate.audio_url, '_blank')
      return
    }
    
    // Sinon essayer le template viral video_link
    if (viralTemplate?.video_link) {
      console.log('🎵 Opening viral template Instagram link:', viralTemplate.video_link)
      window.open(viralTemplate.video_link, '_blank')
      return
    }
    
    // Sinon chercher le lien dans les données source de la vidéo
    if (video?.source_data) {
      console.log('🎵 Checking video source_data for template info:', video.source_data)
      
      // Chercher dans source_data s'il y a un template_id ou video_link
      const sourceData = video.source_data
      if (sourceData.template_id) {
        // Essayer de charger le template à la volée
        console.log('🎵 Found template_id in source_data:', sourceData.template_id)
        api.get(`/api/v1/viral-matching/viral-templates/${sourceData.template_id}`)
          .then(response => {
            if (response.data?.video_link) {
              window.open(response.data.video_link, '_blank')
            } else {
              alert('Template trouvé mais pas de lien vidéo')
            }
          })
          .catch(error => {
            console.error('Erreur lors du chargement du template:', error)
            alert('Impossible de charger le template viral')
          })
        return
      }
    }
    
    console.log('🎵 No audio link found anywhere!')
    alert('Aucun lien audio disponible - le template viral n\'a pas pu être trouvé')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600">Chargement de la vidéo...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
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
    <div className="min-h-screen bg-gray-50">
      <VideoGenerationNavbar 
        currentStep={4}
        propertyId={video.property_id}
        templateId={viralTemplate?.id}
        videoId={video.id}
        showGenerationButtons={true}
        onRandomTemplate={handleViewAudio}
        onGenerateTemplate={() => {}}
        isGenerating={regeneratingDescription}
      />
      
      {/* Main Content - 3 colonnes */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* Colonne de gauche: Vidéo verticale */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
              <div className="aspect-[9/16] bg-black relative w-full max-w-sm mx-auto flex-shrink-0">
                {video.status === 'completed' ? (
                  <video
                    controls
                    className="w-full h-full object-cover"
                    poster={video.thumbnail_url}
                    onEnded={(e) => {
                      // Show thumbnail when video ends instead of black screen
                      const videoElement = e.target as HTMLVideoElement;
                      videoElement.load(); // This will show the poster again
                    }}
                  >
                    <source src={video.video_url} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                ) : video.status === 'processing' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium">✨ Génération IA en cours...</p>
                      <p className="text-sm opacity-75">Votre vidéo sera prête dans quelques instants</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Statut: {video.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne du milieu: Description IA */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#ff914d]" />
                <h3 className="text-lg font-semibold text-gray-900">Description Instagram IA</h3>
              </div>
              {video.ai_description ? (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#ff914d] flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{video.ai_description}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                  <div>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#ff914d]" />
                    <p className="text-sm text-gray-600">Génération de la description IA...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne de droite: Paramètres pour recréer la description */}
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Languages className="w-5 h-5 text-[#115446]" />
                <h3 className="text-lg font-semibold text-gray-900">Paramètres de Description</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                {/* Contrôles de langue */}
                {video.ai_description && (
                  <div className="space-y-4">
                    {/* Language Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Langue:</span>
                      </div>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir une langue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Español</SelectItem>
                          <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                          <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                          <SelectItem value="pt">🇵🇹 Português</SelectItem>
                          <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Length Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Taille:</span>
                      </div>
                      <Select value={selectedLength} onValueChange={setSelectedLength}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir une taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="courte">📝 Courte (1 phrase)</SelectItem>
                          <SelectItem value="moyenne">📄 Moyenne (petit paragraphe)</SelectItem>
                          <SelectItem value="longue">📖 Longue (plusieurs paragraphes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateDescription}
                        disabled={regeneratingDescription}
                        className="w-full"
                      >
                        {regeneratingDescription ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Nouvelle description ({selectedLength}, {selectedLanguage.toUpperCase()})
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTranslateDescription}
                        disabled={translatingDescription}
                        className="w-full"
                      >
                        {translatingDescription ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Languages className="w-4 h-4 mr-2" />
                        )}
                        Traduire en {selectedLanguage.toUpperCase()}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(video.ai_description || '')}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier la description
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}