export class SimpleVideoCapture {

  /**
   * Element Capture API - Capture directe d'éléments DOM en qualité parfaite
   * 1080x1920, 30 FPS, 2-3 secondes, ZERO interaction utilisateur
   */
  static async capturePreviewToVideo(
    previewElement: HTMLElement,
    durationMs: number
  ): Promise<Blob> {
    try {
      console.log(`🚀 Starting ELEMENT capture: ${durationMs}ms`)

      // Vérifier support Element Capture API
      if (!('captureStream' in previewElement)) {
        throw new Error('Element Capture API not supported')
      }

      // Capture directe de l'élément DOM
      console.log('🎯 Capturing element stream...')
      const stream = await (previewElement as any).captureStream({
        video: {
          width: 1080,
          height: 1920,
          frameRate: 30
        }
      })

      console.log(`✅ Element stream captured: ${stream.active}`)

      // MediaRecorder haute qualité
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps qualité parfaite
      })

      const chunks: Blob[] = []

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
            console.log(`📦 Element chunk: ${event.data.size} bytes`)
          }
        }

        mediaRecorder.onstop = () => {
          // Arrêter le stream
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())

          if (chunks.length === 0) {
            reject(new Error('No element data captured'))
            return
          }

          const blob = new Blob(chunks, { type: 'video/webm' })
          console.log(`🎉 ELEMENT VIDEO: ${blob.size} bytes - QUALITÉ PARFAITE`)

          if (blob.size < 10000) { // Au moins 10KB pour une vraie vidéo
            reject(new Error(`Element video too small: ${blob.size} bytes`))
          } else {
            resolve(blob)
          }
        }

        mediaRecorder.onerror = (error) => {
          console.error('❌ Element MediaRecorder error:', error)
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
          reject(error)
        }

        // Démarrer capture
        console.log(`🎬 Starting element recording for ${durationMs}ms...`)
        mediaRecorder.start(100)

        // Arrêter après durée
        setTimeout(() => {
          console.log(`⏰ Stopping element recording`)
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }, durationMs)
      })

    } catch (error: any) {
      console.error('❌ Element capture failed:', error)

      // Message d'erreur spécifique selon le problème
      if (error?.message?.includes('not supported')) {
        throw new Error('Element Capture API non supportée - Utilisez Chrome/Edge latest version')
      } else {
        throw new Error(`Capture échouée: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  /**
   * Upload vers AWS S3 via l'API
   */
  static async uploadToS3(blob: Blob, filename: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', blob, filename)

    try {
      console.log('☁️ Uploading to AWS S3...')
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ S3 upload success:', data.url)
      return data.url

    } catch (error) {
      console.error('❌ S3 upload failed:', error)
      throw error
    }
  }

  /**
   * Téléchargement local de fallback
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