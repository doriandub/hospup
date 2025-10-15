'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PreviewVideoPlayer } from '@/components/preview-video-player'
import { Download, CheckCircle, Loader2, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

type GenerationStatus = 'preparing' | 'mediaconvert' | 'ffmpeg' | 'completed' | 'error'

interface VideoData {
  templateSlots: any[]
  currentAssignments: any[]
  contentVideos: any[]
  textOverlays: any[]
}

export default function VideoGenerationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('preparing')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(35)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Load video data from sessionStorage
  useEffect(() => {
    const sessionKey = searchParams.get('session')

    if (!sessionKey) {
      setError('Session invalide - données de génération manquantes')
      setGenerationStatus('error')
      return
    }

    const storedData = sessionStorage.getItem(sessionKey)
    if (!storedData) {
      setError('Données de génération expirées ou invalides')
      setGenerationStatus('error')
      return
    }

    try {
      const parsedData = JSON.parse(storedData)
      setVideoData(parsedData)
      console.log('✅ Video data loaded from session:', parsedData)
    } catch (err) {
      setError('Impossible de charger les données de génération')
      setGenerationStatus('error')
      console.error('❌ Failed to parse video data:', err)
    }
  }, [searchParams])

  // Start video generation once data is loaded
  useEffect(() => {
    if (!videoData) return
    startVideoGeneration()
  }, [videoData])

  // Elapsed time counter
  useEffect(() => {
    if (generationStatus === 'completed' || generationStatus === 'error') return

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [generationStatus])

  const startVideoGeneration = async () => {
    if (!videoData) return

    try {
      setGenerationStatus('preparing')
      setProgress(5)

      // Create custom script from timeline data
      const customScript = createScriptFromTimeline(
        videoData.currentAssignments,
        videoData.textOverlays,
        videoData.templateSlots,
        videoData.contentVideos
      )

      console.log('🎬 Generated custom script:', customScript)

      // Convert to segments format for Lambda
      const segments = customScript.clips.map((clip: any) => ({
        video_url: clip.video_url,
        duration: clip.duration,
        start_time: clip.start_time,
        end_time: clip.end_time
      }))

      const textOverlays = customScript.texts.map((text: any) => ({
        content: text.content,
        start_time: text.start_time,
        end_time: text.end_time,
        position: text.position,
        style: {
          color: text.style.color,
          font_size: text.style.font_size,
          font_family: text.style.font_family || 'Roboto'
        }
      }))

      // Get property ID from URL params or default to 3
      const propertyId = searchParams.get('property') || '3'

      setGenerationStatus('mediaconvert')
      setProgress(10)

      // Call backend API to start video generation
      const response = await api.post('/api/v1/video-generation/generate', {
        property_id: propertyId,
        segments,
        text_overlays: textOverlays,
        custom_script: customScript,
        total_duration: customScript.total_duration
      })

      console.log('✅ Video generation started:', response)

      setJobId(response.job_id)
      setVideoId(response.video_id)

      // Start polling for status
      pollVideoStatus(response.job_id, response.video_id, propertyId)

    } catch (err: any) {
      console.error('❌ Failed to start video generation:', err)
      setError(err.message || 'Erreur lors du démarrage de la génération')
      setGenerationStatus('error')
    }
  }

  const pollVideoStatus = async (jobId: string, videoId: string, propertyId: string) => {
    const maxAttempts = 120 // 2 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        // Check if video exists in S3
        const videoUrl = `https://s3.eu-west-1.amazonaws.com/hospup-files/generated-videos/${propertyId}/${videoId}.mp4`

        const response = await fetch(videoUrl, { method: 'HEAD' })

        if (response.ok) {
          // Video is ready!
          setDownloadUrl(videoUrl)
          setGenerationStatus('completed')
          setProgress(100)
          return
        }

        // Update progress based on estimated time
        const progressPercent = Math.min(95, 10 + (elapsedTime / estimatedTime) * 85)
        setProgress(progressPercent)

        // Update status based on elapsed time
        if (elapsedTime < 15) {
          setGenerationStatus('mediaconvert')
        } else {
          setGenerationStatus('ffmpeg')
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000) // Poll every second
        } else {
          setError('Timeout - la génération prend plus de temps que prévu')
          setGenerationStatus('error')
        }
      } catch (err) {
        console.error('Error polling status:', err)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000)
        } else {
          setError('Erreur lors de la vérification du statut')
          setGenerationStatus('error')
        }
      }
    }

    poll()
  }

  const createScriptFromTimeline = (
    assignments: any[],
    textOverlays: any[],
    templateSlots: any[],
    contentVideos: any[]
  ) => {
    const clips = assignments
      .filter(assignment => assignment.videoId)
      .sort((a, b) => {
        const slotA = templateSlots.find(slot => slot.id === a.slotId)
        const slotB = templateSlots.find(slot => slot.id === b.slotId)
        return (slotA?.order || 0) - (slotB?.order || 0)
      })
      .map((assignment, index) => {
        const slot = templateSlots.find(slot => slot.id === assignment.slotId)
        const video = contentVideos.find(video => video.id === assignment.videoId)

        const videoDuration = video?.duration || 0
        const userDuration = videoDuration > 0
          ? Math.min(Math.max(videoDuration, 1.5), 6)
          : 2.0

        return {
          order: index + 1,
          duration: userDuration,
          description: slot?.description || `Segment ${index + 1}`,
          video_url: video?.video_url || '',
          video_id: video?.id || '',
          start_time: 0,
          end_time: userDuration
        }
      })

    const texts = textOverlays.map(text => ({
      content: text.content,
      start_time: text.start_time,
      end_time: text.end_time || text.start_time + 3,
      position: text.position,
      style: text.style
    }))

    const realTotalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0)

    return {
      clips,
      texts,
      total_duration: realTotalDuration
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    switch (generationStatus) {
      case 'preparing':
        return 'Préparation de la génération...'
      case 'mediaconvert':
        return 'Assemblage des clips (MediaConvert GPU)...'
      case 'ffmpeg':
        return 'Ajout des textes et finalisation (FFmpeg)...'
      case 'completed':
        return 'Vidéo générée avec succès!'
      case 'error':
        return 'Erreur lors de la génération'
      default:
        return 'En cours...'
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Erreur
          </h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Button
            onClick={() => router.back()}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'éditeur
          </Button>
        </div>
      </div>
    )
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Génération de la vidéo
            </h1>
            <p className="text-gray-600">
              {generationStatus === 'completed'
                ? 'Votre vidéo est prête!'
                : `Temps estimé: ~${estimatedTime}s (${formatTime(elapsedTime)} écoulées)`
              }
            </p>
          </div>

          {/* Preview Video */}
          <div className="mb-8 flex justify-center">
            <div className="w-[300px] h-[533px] bg-black rounded-xl overflow-hidden shadow-2xl">
              <PreviewVideoPlayer
                templateSlots={videoData.templateSlots}
                currentAssignments={videoData.currentAssignments}
                contentVideos={videoData.contentVideos}
                textOverlays={videoData.textOverlays}
                showDownloadButton={false}
              />
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {getStatusMessage()}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  generationStatus === 'completed'
                    ? 'bg-green-500'
                    : generationStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status Icon */}
            <div className="flex items-center justify-center mt-4">
              {generationStatus === 'completed' ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : generationStatus === 'error' ? (
                <AlertCircle className="w-12 h-12 text-red-500" />
              ) : (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              )}
            </div>
          </div>

          {/* Actions */}
          {generationStatus === 'completed' && downloadUrl && (
            <div className="space-y-3">
              <Button
                onClick={() => window.open(downloadUrl, '_blank')}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir la vidéo finale
              </Button>

              <Button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = downloadUrl
                  a.download = `video-${videoId}.mp4`
                  a.click()
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>

              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Créer une nouvelle vidéo
              </Button>
            </div>
          )}

          {(generationStatus === 'preparing' || generationStatus === 'mediaconvert' || generationStatus === 'ffmpeg') && (
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
              disabled={generationStatus !== 'preparing'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}

          {/* Debug Info */}
          {jobId && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p><strong>Job ID:</strong> {jobId}</p>
              <p><strong>Video ID:</strong> {videoId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}