'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Play, Loader2 } from 'lucide-react'
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
  }, [videoId])

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
                      <p className="text-lg font-medium">Génération en cours...</p>
                      <p className="text-sm opacity-75">Cela peut prendre quelques minutes</p>
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
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600">{video.description || 'Aucune description'}</p>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée:</span>
                  <span className="font-medium">{video.duration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`font-medium ${
                    video.status === 'completed' ? 'text-green-600' :
                    video.status === 'processing' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {video.status === 'completed' ? 'Terminé' :
                     video.status === 'processing' ? 'En cours' :
                     video.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {video.source_type === 'viral_template_composer' ? 'Timeline personnalisée' :
                     video.source_type === 'viral_template' ? 'Template viral' :
                     'Autre'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Info (if from composer) */}
            {video.source_type === 'viral_template_composer' && video.source_data && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline utilisée</h3>
                {video.source_data.custom_script && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {video.source_data.custom_script.clips?.length || 0} segments
                    </p>
                    <p className="text-sm text-gray-600">
                      Durée totale: {video.source_data.custom_script.total_duration || 0}s
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}