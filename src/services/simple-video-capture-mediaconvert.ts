import { PreviewToMediaConvertConverter } from './preview-to-mediaconvert'

export class SimpleVideoCapture {

  /**
   * 🎬 SOLUTION MEDIACONVERT PROPRE
   * Convertit les données exactes de l'aperçu en format MediaConvert
   */
  static async capturePreviewToVideo(
    previewElement: HTMLElement,
    durationMs: number,
    videoData?: any
  ): Promise<Blob> {
    try {
      console.log(`🚀 Starting CLEAN MediaConvert generation`)
      console.log(`📊 DEBUG: videoData received:`, videoData)
      console.log(`📊 DEBUG: videoData type:`, typeof videoData)
      console.log(`📊 DEBUG: videoData keys:`, videoData ? Object.keys(videoData) : 'null/undefined')

      // Valider que nous avons les données de l'aperçu
      if (!videoData) {
        throw new Error('❌ Video data is required for MediaConvert generation')
      }

      // Extraire les données structurées
      const { templateSlots, currentAssignments, contentVideos, textOverlays } = videoData

      if (!templateSlots || !currentAssignments || !contentVideos || !textOverlays) {
        throw new Error('❌ Missing required preview data (templateSlots, currentAssignments, contentVideos, textOverlays)')
      }

      console.log(`📊 Preview data loaded: ${templateSlots.length} slots, ${currentAssignments.length} assignments, ${contentVideos.length} videos, ${textOverlays.length} overlays`)

      // Convertir en format MediaConvert propre
      const mediaConvertPayload = PreviewToMediaConvertConverter.convertPreviewData(
        templateSlots,
        currentAssignments,
        contentVideos,
        textOverlays,
        {
          propertyId: '1', // TODO: Get from user context
          webhookUrl: process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/videos/aws-callback` : undefined
        }
      )

      // Debug payload
      PreviewToMediaConvertConverter.debugPayload(mediaConvertPayload)

      // Envoyer à MediaConvert
      return await this.generateVideoWithMediaConvert(mediaConvertPayload)

    } catch (error) {
      console.error('❌ MediaConvert generation failed:', error)
      throw error
    }
  }

  /**
   * 🎯 GÉNÉRER VIDÉO AVEC MEDIACONVERT
   * Utilise le payload propre généré par le convertisseur
   */
  private static async generateVideoWithMediaConvert(payload: any): Promise<Blob> {
    console.log('🎬 Sending clean payload to MediaConvert...')

    try {
      const response = await fetch('/api/generate-video-mediaconvert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`MediaConvert API failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const result = await response.json()
      console.log('✅ MediaConvert job created:', result.jobId)

      // Attendre que le job soit terminé
      const videoUrl = await this.pollMediaConvertJob(result.jobId)

      // Télécharger la vidéo générée
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoResponse.status}`)
      }

      const blob = await videoResponse.blob()
      console.log(`🎉 MEDIACONVERT VIDEO: ${blob.size} bytes - QUALITÉ PROFESSIONNELLE`)

      return blob

    } catch (error: any) {
      console.error('❌ MediaConvert API error:', error)
      throw new Error(`MediaConvert generation failed: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Attendre que le job MediaConvert soit terminé
   */
  private static async pollMediaConvertJob(jobId: string): Promise<string> {
    console.log(`⏳ Polling MediaConvert job: ${jobId}`)

    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/mediaconvert-status/${jobId}`)

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }

        const status = await response.json()
        console.log(`📊 Job ${jobId} status: ${status.status}`)

        if (status.status === 'COMPLETE') {
          console.log(`✅ Job completed: ${status.outputUrl}`)
          return status.outputUrl
        } else if (status.status === 'ERROR' || status.status === 'CANCELED') {
          throw new Error(`Job failed with status: ${status.status}`)
        }

        // Attendre 5 secondes avant le prochain check
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++

      } catch (error) {
        console.error(`❌ Status check error:`, error)
        attempts++
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    throw new Error('MediaConvert job timeout - took longer than 5 minutes')
  }


  /**
   * Upload direct vers S3 (pour compatibilité avec l'ancien système)
   */
  static async uploadToS3(blob: Blob, filename: string): Promise<string> {
    // Pour MediaConvert, on retourne directement le blob comme URL locale
    // car la vidéo est déjà sur S3 via MediaConvert
    return URL.createObjectURL(blob)
  }

  /**
   * Téléchargement local
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}