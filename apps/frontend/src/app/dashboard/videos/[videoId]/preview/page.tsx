'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Play, Loader2, Copy, ExternalLink, Music, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { videosApi } from '@/lib/api'

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
  viral_template_id?: string
  ai_description?: string
  instagram_audio_url?: string
}

export default function VideoPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setVideo(response.data)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Chargement de la vidéo...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
              <p className="text-gray-600">
                {video.source_type === 'viral_template_composer' ? 'Vidéo personnalisée' : 'Vidéo générée'} • 
                {new Date(video.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button onClick={() => router.push('/dashboard/videos')}>
              Voir toutes les vidéos
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="aspect-video bg-black relative">
                {video.status === 'completed' ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={video.thumbnail_url}
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

          {/* Video Info */}
          <div className="space-y-6">
            {/* AI Generated Description */}
            {video.status === 'completed' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#ff914d]" />
                  <h3 className="text-lg font-semibold text-gray-900">Description Instagram IA</h3>
                </div>
                {video.ai_description ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#ff914d]">
                      <p className="text-gray-800 whitespace-pre-wrap">{video.ai_description}</p>
                    </div>
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
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff914d]" />
                    <p className="text-sm text-gray-600">Génération de la description IA...</p>
                  </div>
                )}
              </div>
            )}

            {/* Instagram Audio */}
            {video.status === 'completed' && video.instagram_audio_url && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-[#115446]" />
                  <h3 className="text-lg font-semibold text-gray-900">Audio Instagram Original</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Retrouvez l'audio original de la vidéo virale pour votre contenu Instagram
                  </p>
                  <Button
                    onClick={() => window.open(video.instagram_audio_url, '_blank')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'audio Instagram
                  </Button>
                </div>
              </div>
            )}

            {/* Random Audio Suggestions */}
            {video.status === 'completed' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-[#ff914d]" />
                  <h3 className="text-lg font-semibold text-gray-900">Suggestions Audio</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Ou choisissez parmi ces audios tendances libres de droits
                  </p>
                  {[
                    { name: "Upbeat Energy", mood: "Énergique" },
                    { name: "Chill Vibes", mood: "Relaxant" },
                    { name: "Trending Beat", mood: "Tendance" },
                    { name: "Emotional", mood: "Émotionnel" }
                  ].map((audio, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{audio.name}</p>
                        <p className="text-xs text-gray-500">{audio.mood}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3 mr-1" />
                        Écouter
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}