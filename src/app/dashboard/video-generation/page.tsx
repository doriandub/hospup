'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PreviewVideoPlayer } from '@/components/preview-video-player'
import { SimpleVideoCapture } from '@/services/simple-video-capture-mediaconvert'
import { Download, CheckCircle, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [generationStatus, setGenerationStatus] = useState<'preparing' | 'generating' | 'uploading' | 'completed' | 'error'>('preparing')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState(0)

  // Load video data from sessionStorage
  useEffect(() => {
    const sessionKey = searchParams.get('session')
    const legacyData = searchParams.get('data') // Fallback for old URLs

    try {
      let videoData = null

      if (sessionKey) {
        // New method: Load from sessionStorage
        const storedData = sessionStorage.getItem(sessionKey)
        console.log(`🔍 DEBUG sessionStorage for key "${sessionKey}":`, storedData)
        if (storedData) {
          videoData = JSON.parse(storedData)
          console.log('✅ Data loaded from sessionStorage:', videoData)
          console.log('📊 Data structure:', {
            templateSlots: videoData?.templateSlots?.length || 'undefined',
            currentAssignments: videoData?.currentAssignments?.length || 'undefined',
            contentVideos: videoData?.contentVideos?.length || 'undefined',
            textOverlays: videoData?.textOverlays?.length || 'undefined'
          })
        } else {
          console.log('❌ No data found in sessionStorage for key:', sessionKey)
        }
      } else if (legacyData) {
        // Legacy method: Load from URL (for old links)
        videoData = JSON.parse(decodeURIComponent(legacyData))
        console.log('✅ Data loaded from URL (legacy)')
      }

      if (videoData) {
        setVideoData(videoData)
        // Start generation automatically
        setTimeout(() => generateVideo(videoData), 1000)
      } else {
        setError('Aucune donnée de vidéo trouvée')
        setGenerationStatus('error')
      }
    } catch (error) {
      console.error('Error loading video data:', error)
      setError('Erreur lors du chargement des données')
      setGenerationStatus('error')
    }
  }, [searchParams])

  const generateVideo = async (data: VideoData) => {
    try {
      setGenerationStatus('generating')
      setProgress(20)

      // Get preview container - EXACT same selector as PreviewVideoPlayer
      const previewContainer = document.querySelector('[data-video-preview]') as HTMLElement
      if (!previewContainer) {
        throw new Error('Conteneur d\'aperçu introuvable')
      }

      setProgress(40)

      // Calculate total duration for video length
      const totalDuration = data.templateSlots.reduce((total, slot) => total + slot.duration, 0) * 1000

      console.log(`🎬 Generating video with MediaConvert...`)
      const blob = await SimpleVideoCapture.capturePreviewToVideo(previewContainer, totalDuration, data)

      console.log(`✅ Video captured: ${blob.size} bytes`)
      setProgress(80)
      setGenerationStatus('uploading')

      // Upload to S3 with new service
      try {
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
        const filename = `video-${Date.now()}.${extension}`
        const s3Url = await SimpleVideoCapture.uploadToS3(blob, filename)

        setProgress(100)
        setDownloadUrl(s3Url)
        setGenerationStatus('completed')

        console.log('🌟 Video uploaded to AWS S3:', s3Url)
      } catch (uploadError) {
        console.error('⚠️ S3 upload failed, using local download:', uploadError)

        // Fallback to local download
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
        SimpleVideoCapture.downloadBlob(blob, `video-${Date.now()}.${extension}`)

        const localUrl = URL.createObjectURL(blob)
        setProgress(100)
        setDownloadUrl(localUrl)
        setGenerationStatus('completed')
      }

    } catch (error: any) {
      console.error('❌ Video generation error:', error)
      setError(error.message || 'Erreur lors de la génération')
      setGenerationStatus('error')
    }
  }

  const getStatusMessage = () => {
    switch (generationStatus) {
      case 'preparing': return 'Préparation de la génération...'
      case 'generating': return 'Génération de la vidéo en cours...'
      case 'uploading': return 'Finalisation de la vidéo...'
      case 'completed': return 'Vidéo générée avec succès !'
      case 'error': return 'Erreur lors de la génération'
      default: return ''
    }
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'éditeur
              </Button>
              <h1 className="text-xl font-semibold">Génération de vidéo</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Video Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Aperçu de la vidéo</h2>
            <div className="flex justify-center">
              <div
                className="w-[300px] h-[533px] bg-black rounded-xl overflow-hidden shadow-2xl"
                data-video-preview
              >
                <PreviewVideoPlayer
                  templateSlots={videoData.templateSlots}
                  currentAssignments={videoData.currentAssignments}
                  contentVideos={videoData.contentVideos}
                  textOverlays={videoData.textOverlays}
                  showDownloadButton={false}
                />
              </div>
            </div>
          </div>

          {/* Generation Status & Download */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Statut de génération</h2>

            {/* Status Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="space-y-4">

                {/* Status Icon & Message */}
                <div className="flex items-center gap-3">
                  {generationStatus === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : generationStatus === 'error' ? (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-600 rounded-full" />
                    </div>
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  )}
                  <span className="font-medium">{getStatusMessage()}</span>
                </div>

                {/* Progress Bar */}
                {generationStatus !== 'completed' && generationStatus !== 'error' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Download Section */}
                {generationStatus === 'completed' && downloadUrl && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">Votre vidéo est prête !</h3>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Download Button */}
                      <Button
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = downloadUrl
                          a.download = `video-${Date.now()}.webm`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                        className="flex items-center gap-2 flex-1"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger la vidéo
                      </Button>

                      {/* Preview Button */}
                      <Button
                        variant="outline"
                        onClick={() => window.open(downloadUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir la vidéo
                      </Button>
                    </div>

                    {/* Local File Info */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 mb-1">✅ Vidéo générée localement :</p>
                      <p className="text-sm text-green-800">Format: WebM 30 FPS • Qualité: HD • Prêt au téléchargement</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generation Info */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">⚡ Génération Instantanée</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Génération en 3 secondes maximum</strong> (quelle que soit la durée)</li>
                <li>• <strong>Qualité parfaite 30 FPS</strong> - identique à l'aperçu</li>
                <li>• <strong>Tous les effets de texte</strong> préservés (ombres, bordures, etc.)</li>
                <li>• <strong>Téléchargement local direct</strong> - prêt immédiatement</li>
                <li>• <strong>Format WebM HD</strong> - compatible tous navigateurs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}