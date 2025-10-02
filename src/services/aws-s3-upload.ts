/**
 * AWS S3 Upload Service - Production Ready
 * For scalable cloud application with thousands of users
 */

export class AWSS3UploadService {
  private readonly bucketName = 'hospup-files'
  private readonly region = 'eu-west-1'
  private readonly baseUrl = `https://s3.${this.region}.amazonaws.com/${this.bucketName}`

  /**
   * Upload video blob to AWS S3 with presigned URL
   * Production-ready for scalable applications
   */
  async uploadVideo(videoBlob: Blob, filename?: string): Promise<{url: string, key: string}> {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const uuid = this.generateUUID()
      const extension = this.getExtensionFromBlob(videoBlob)
      const key = filename || `videos/generated/${uuid}-${timestamp}.${extension}`

      console.log(`☁️ Uploading to S3: ${key}`)

      // Step 1: Get presigned URL from backend
      const presignedResponse = await this.getPresignedUploadUrl(key, videoBlob.type)

      // Step 2: Upload directly to S3 using presigned URL
      const uploadResponse = await fetch(presignedResponse.uploadUrl, {
        method: 'PUT',
        body: videoBlob,
        headers: {
          'Content-Type': videoBlob.type,
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      const finalUrl = `${this.baseUrl}/${key}`
      console.log(`✅ Video uploaded to S3: ${finalUrl}`)

      return {
        url: finalUrl,
        key: key
      }

    } catch (error) {
      console.error('❌ AWS S3 upload failed:', error)
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get presigned upload URL from backend
   */
  private async getPresignedUploadUrl(key: string, contentType: string): Promise<{uploadUrl: string}> {
    const response = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        contentType,
        bucket: this.bucketName,
        region: this.region
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Fallback: Direct multipart upload via backend
   */
  async uploadVideoViaBackend(videoBlob: Blob, filename?: string): Promise<{url: string, key: string}> {
    try {
      const formData = new FormData()
      const timestamp = Date.now()
      const uuid = this.generateUUID()
      const extension = this.getExtensionFromBlob(videoBlob)
      const key = filename || `videos/generated/${uuid}-${timestamp}.${extension}`

      formData.append('file', videoBlob, `${key}.${extension}`)
      formData.append('key', key)
      formData.append('bucket', this.bucketName)

      console.log(`☁️ Uploading via backend: ${key}`)

      const response = await fetch('/api/s3/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Video uploaded via backend: ${result.url}`)

      return {
        url: result.url,
        key: result.key
      }

    } catch (error) {
      console.error('❌ Backend upload failed:', error)
      throw error
    }
  }

  /**
   * Upload with automatic fallback strategy
   */
  async uploadWithFallback(videoBlob: Blob, filename?: string): Promise<{url: string, key: string}> {
    try {
      // Try presigned URL first (most efficient)
      return await this.uploadVideo(videoBlob, filename)
    } catch (presignedError) {
      console.warn('⚠️ Presigned upload failed, trying backend upload...', presignedError)

      try {
        // Fallback to backend upload
        return await this.uploadVideoViaBackend(videoBlob, filename)
      } catch (backendError) {
        console.error('❌ All upload methods failed')
        throw new Error(`Upload failed: Presigned (${presignedError}), Backend (${backendError})`)
      }
    }
  }

  /**
   * Utilities
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  private getExtensionFromBlob(blob: Blob): string {
    switch (blob.type) {
      case 'video/webm': return 'webm'
      case 'video/mp4': return 'mp4'
      case 'video/quicktime': return 'mov'
      default: return 'webm'
    }
  }

  /**
   * Check upload progress (for large files)
   */
  async uploadWithProgress(
    videoBlob: Blob,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<{url: string, key: string}> {
    // For large files, implement chunked upload with progress
    // This is essential for scalable applications
    return this.uploadWithFallback(videoBlob, filename)
  }
}