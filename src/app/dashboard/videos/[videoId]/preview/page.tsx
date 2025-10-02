'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Download, Share2, Play, Loader2, Copy, ExternalLink, 
  Music, Sparkles, Languages, RefreshCw, CheckCircle, Clock, 
  AlertCircle, Instagram, Heart, Share, Eye, TrendingUp, 
  Zap, Award, Globe, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VideoGenerationHeader } from '@/components/video-generation/VideoGenerationHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { videosApi, api } from '@/lib/api'

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration: number
  status: 'processing' | 'completed' | 'failed' | 'pending'
  source_type: string
  source_data: any
  created_at: string
  completed_at?: string
  viral_video_id?: string
  ai_description?: string
  instagram_audio_url?: string
  property_id?: string
  generation_method?: 'ffmpeg' | 'aws_mediaconvert'
  aws_job_id?: string
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
  const [awsProgress, setAwsProgress] = useState(0)

  const videoId = params.videoId as string

  useEffect(() => {
    loadVideo()
    // Poll for updates every 3 seconds if video is processing
    const interval = setInterval(() => {
      if (video?.status === 'processing') {
        loadVideo()
        // If it's AWS MediaConvert, also check progress
        if (video?.aws_job_id) {
          checkAWSProgress(video.aws_job_id)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [videoId, video?.status])

  const loadVideo = async () => {
    try {
      const response = await videosApi.getById(videoId)
      console.log('📹 Video loaded:', response)
      const videoData = response
      setVideo(videoData)

      // Load viral template info if video was created from viral template
      if (videoData.viral_video_id) {
        try {
          console.log('🎵 Loading viral template with ID:', videoData.viral_video_id)
          const templateResponse = await api.get<any>(`/api/v1/viral-matching/viral-templates/${videoData.viral_video_id}`)
          setViralTemplate(templateResponse)
        } catch (templateError: any) {
          console.error('❌ Error loading viral template:', templateError)
        }
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

  const checkAWSProgress = async (jobId: string) => {
    try {
      // Check AWS MediaConvert job progress
      const response = await api.get<any>(`/api/v1/video-generation/aws-status/${jobId}`)
      if (response?.progress) {
        setAwsProgress(response.progress)
      }
    } catch (error) {
      console.error('Error checking AWS progress:', error)
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
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papier!')
    }
  }

  const handleRegenerateDescription = async () => {
    if (!video) return
    
    setRegeneratingDescription(true)
    try {
      const response = await api.post<any>(`/api/v1/videos/${videoId}/regenerate-description`, {
        language: selectedLanguage,
        length: selectedLength
      })
      
      if (response?.ai_description) {
        setVideo(prev => prev ? {...prev, ai_description: response.ai_description} : null)
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
      const response = await api.post<any>(`/api/v1/videos/${videoId}/translate-description`, {
        current_description: video.ai_description,
        target_language: selectedLanguage,
        length: selectedLength
      })
      
      if (response?.translated_description) {
        setVideo(prev => prev ? {...prev, ai_description: response.translated_description} : null)
      }
    } catch (error) {
      console.error('Error translating description:', error)
      alert('Erreur lors de la traduction de la description')
    } finally {
      setTranslatingDescription(false)
    }
  }

  const handleViewAudio = () => {
    if (viralTemplate?.audio_url) {
      window.open(viralTemplate.audio_url, '_blank')
      return
    }
    
    if (viralTemplate?.video_link) {
      window.open(viralTemplate.video_link, '_blank')
      return
    }
    
    alert('Aucun lien audio disponible')
  }

  const getStatusInfo = () => {
    if (!video) return { icon: Clock, color: 'gray', text: 'Chargement...' }
    
    switch (video.status) {
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'green', 
          text: video.generation_method === 'aws_mediaconvert' ? 'Généré avec AWS MediaConvert' : 'Vidéo terminée'
        }
      case 'processing':
        return { 
          icon: Zap, 
          color: 'blue', 
          text: video.generation_method === 'aws_mediaconvert' ? 
            `Génération AWS en cours ${awsProgress > 0 ? `(${awsProgress}%)` : ''}` : 
            'Génération en cours...'
        }
      case 'failed':
        return { icon: AlertCircle, color: 'red', text: 'Erreur de génération' }
      default:
        return { icon: Clock, color: 'yellow', text: 'En attente...' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de votre vidéo</h2>
              <p className="text-gray-600">Préparation de l'aperçu...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Vidéo introuvable</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <VideoGenerationHeader
        currentStep={4}
        propertyId={video.property_id}
        templateId={viralTemplate?.id}
        videoId={video.id}
        showGenerationButtons={true}
        onRandomTemplate={handleViewAudio}
        onGenerateTemplate={() => {}}
        isGenerating={regeneratingDescription}
      />
      
      {/* Header avec status */}
      <div className="p-6 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={statusInfo.color === 'green' ? 'default' : statusInfo.color === 'red' ? 'destructive' : 'secondary'}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.text}
                  </Badge>
                  {video.generation_method === 'aws_mediaconvert' && (
                    <Badge variant="outline">
                      <Zap className="w-3 h-3 mr-1" />
                      AWS Cloud
                    </Badge>
                  )}
                  {video.duration && (
                    <span className="text-sm text-gray-500">{video.duration}s</span>
                  )}
                </div>
              </div>
            </div>
            
            {video.status === 'completed' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar pour AWS */}
      {video.status === 'processing' && video.generation_method === 'aws_mediaconvert' && awsProgress > 0 && (
        <div className="p-6 bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Zap className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-800 font-medium">Génération AWS MediaConvert</span>
                  <span className="text-blue-600">{awsProgress}%</span>
                </div>
                <Progress value={awsProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Layout amélioré */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Colonne principale - Vidéo */}
            <div className="xl:col-span-5">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Aperçu Vidéo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-[9/16] bg-black relative mx-auto max-w-sm">
                    {video.status === 'completed' ? (
                      <video
                        controls
                        className="w-full h-full object-cover rounded-b-lg"
                        poster={video.thumbnail_url}
                        onEnded={(e) => {
                          const videoElement = e.target as HTMLVideoElement;
                          videoElement.load();
                        }}
                      >
                        <source src={video.video_url} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    ) : video.status === 'processing' ? (
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-purple-600">
                        <div className="text-center p-8">
                          <div className="relative mb-6">
                            <Loader2 className="w-16 h-16 animate-spin mx-auto" />
                            <Sparkles className="w-6 h-6 absolute top-0 right-0 animate-pulse" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">✨ Magie IA en action</h3>
                          <p className="text-sm opacity-90 mb-4">Votre vidéo prend vie...</p>
                          {video.generation_method === 'aws_mediaconvert' && (
                            <div className="text-xs opacity-75">
                              <Zap className="w-3 h-3 inline mr-1" />
                              Powered by AWS MediaConvert
                            </div>
                          )}
                        </div>
                      </div>
                    ) : video.status === 'failed' ? (
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-red-500 to-red-600">
                        <div className="text-center p-8">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                          <h3 className="text-lg font-bold mb-2">Erreur de génération</h3>
                          <p className="text-sm opacity-90">Une erreur s'est produite lors de la création de votre vidéo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-gray-600 to-gray-700">
                        <div className="text-center p-8">
                          <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-bold mb-2">En attente</h3>
                          <p className="text-sm opacity-75">Statut: {video.status}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne centrale - Description IA */}
            <div className="xl:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Description Instagram IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {video.ai_description ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 border-l-4 border-orange-400">
                        <div className="flex items-start gap-3 mb-3">
                          <Instagram className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-gray-600 font-medium">DESCRIPTION OPTIMISÉE</div>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{video.ai_description}</p>
                      </div>
                      
                      {/* Métriques simulées */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                          <div className="text-xs font-medium text-red-700">Engagement</div>
                          <div className="text-lg font-bold text-red-600">8.2%</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <Eye className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                          <div className="text-xs font-medium text-blue-700">Portée</div>
                          <div className="text-lg font-bold text-blue-600">+156%</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
                          <div className="text-xs font-medium text-green-700">Viralité</div>
                          <div className="text-lg font-bold text-green-600">9.1/10</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative mb-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                        <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-pulse text-orange-400" />
                      </div>
                      <h3 className="font-medium text-gray-800 mb-2">IA en action</h3>
                      <p className="text-sm text-gray-600">Génération d'une description optimisée pour Instagram...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Colonne de droite - Contrôles */}
            <div className="xl:col-span-3">
              <div className="space-y-6">
                
                {/* Statistiques vidéo */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Statistiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Durée:</span>
                      <span className="text-sm font-medium">{video.duration || 30}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Format:</span>
                      <span className="text-sm font-medium">9:16 (Stories)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Résolution:</span>
                      <span className="text-sm font-medium">1080x1920</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Méthode:</span>
                      <span className="text-sm font-medium flex items-center gap-1">
                        {video.generation_method === 'aws_mediaconvert' ? (
                          <>
                            <Zap className="w-3 h-3 text-blue-500" />
                            AWS Cloud
                          </>
                        ) : (
                          'Standard'
                        )}
                      </span>
                    </div>
                    {video.created_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Créé le:</span>
                        <span className="text-sm font-medium">
                          {new Date(video.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contrôles de description */}
                {video.ai_description && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5 text-blue-500" />
                        Personnaliser
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          <Globe className="w-4 h-4 inline mr-1" />
                          Langue
                        </label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger>
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
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          <Star className="w-4 h-4 inline mr-1" />
                          Taille
                        </label>
                        <Select value={selectedLength} onValueChange={setSelectedLength}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une taille" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="courte">📝 Courte</SelectItem>
                            <SelectItem value="moyenne">📄 Moyenne</SelectItem>
                            <SelectItem value="longue">📖 Longue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerateDescription}
                          disabled={regeneratingDescription}
                        >
                          {regeneratingDescription ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Nouvelle description
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTranslateDescription}
                          disabled={translatingDescription}
                        >
                          {translatingDescription ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Languages className="w-4 h-4 mr-2" />
                          )}
                          Traduire
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(video.ai_description || '')}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Template viral info */}
                {viralTemplate && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-500" />
                        Template Viral
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{viralTemplate.title}</div>
                        {viralTemplate.hotel_name && (
                          <div className="text-xs text-gray-600">{viralTemplate.hotel_name}</div>
                        )}
                        {viralTemplate.username && (
                          <div className="text-xs text-purple-600">@{viralTemplate.username}</div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewAudio}
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir l'original
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}