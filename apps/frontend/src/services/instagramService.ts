/**
 * Instagram service for fetching metadata and thumbnails
 */

export interface InstagramPostData {
  thumbnail_url?: string
  author_name?: string
  title?: string
  media_id?: string
  type?: 'photo' | 'video'
}

export class InstagramService {
  private static instance: InstagramService
  private cache = new Map<string, InstagramPostData>()
  
  public static getInstance(): InstagramService {
    if (!InstagramService.instance) {
      InstagramService.instance = new InstagramService()
    }
    return InstagramService.instance
  }

  /**
   * Extract post ID from Instagram URL
   */
  extractPostId(url: string): string | null {
    const patterns = [
      /instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  /**
   * Generate multiple possible thumbnail URLs from post ID
   */
  generateThumbnailUrls(postId: string): string[] {
    return [
      // Method 1: Instagram's media endpoint
      `https://www.instagram.com/p/${postId}/media/?size=m`,
      // Method 2: Instagram's photo endpoint
      `https://instagram.com/p/${postId}/media/?size=l`,
      // Method 3: Try with different size parameter
      `https://www.instagram.com/p/${postId}/media/`,
      // Method 4: Scontent URL pattern (often works)
      `https://scontent.cdninstagram.com/v/t51.29350-15/${postId}_n.jpg`,
      // Method 5: Alternative Instagram CDN
      `https://instagram.frix2-1.fna.fbcdn.net/v/t51.29350-15/${postId}_n.jpg`
    ]
  }

  /**
   * Try multiple thumbnail URLs and return the first working one
   */
  async findWorkingThumbnail(postId: string): Promise<string | null> {
    const urls = this.generateThumbnailUrls(postId)
    
    for (const url of urls) {
      try {
        const isValid = await this.isValidThumbnail(url)
        if (isValid) {
          return url
        }
      } catch (error) {
        continue
      }
    }
    
    return null
  }

  /**
   * Fetch Instagram thumbnail via our backend proxy
   */
  async fetchThumbnailViaProxy(url: string): Promise<string | null> {
    try {
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/instagram/thumbnail?url=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        // Get blob URL for the image
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      
      return null
    } catch (error) {
      console.warn('Instagram proxy thumbnail failed:', error)
      return null
    }
  }

  /**
   * Fetch Instagram metadata via our backend proxy
   */
  async fetchMetadataViaProxy(url: string): Promise<InstagramPostData | null> {
    try {
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/instagram/metadata?url=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        const data = await response.json()
        return {
          thumbnail_url: data.thumbnail_url || data.og_image,
          author_name: data.og_title,
          title: data.og_description,
          media_id: data.post_id,
          type: data.og_type === 'video' ? 'video' : 'photo'
        }
      }
      
      return null
    } catch (error) {
      console.warn('Instagram proxy metadata failed:', error)
      return null
    }
  }

  /**
   * Generate fallback thumbnail using post ID
   */
  async generateFallbackThumbnail(url: string): Promise<InstagramPostData> {
    const postId = this.extractPostId(url)
    if (!postId) {
      return {}
    }

    // Try to find a working thumbnail
    const workingThumbnail = await this.findWorkingThumbnail(postId)

    return {
      thumbnail_url: workingThumbnail || undefined,
      media_id: postId,
      type: url.includes('/reel/') ? 'video' : 'photo'
    }
  }

  /**
   * Get Instagram post data with caching
   */
  async getPostData(url: string): Promise<InstagramPostData> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    let postData: InstagramPostData = {}

    // Try backend proxy first (best method)
    const proxyData = await this.fetchMetadataViaProxy(url)
    if (proxyData && proxyData.thumbnail_url) {
      postData = proxyData
    } else {
      // Try direct thumbnail via proxy
      const proxyThumbnail = await this.fetchThumbnailViaProxy(url)
      if (proxyThumbnail) {
        const postId = this.extractPostId(url)
        postData = {
          thumbnail_url: proxyThumbnail,
          media_id: postId || undefined,
          type: url.includes('/reel/') ? 'video' : 'photo'
        }
      } else {
        // Fallback to manual thumbnail generation
        postData = await this.generateFallbackThumbnail(url)
      }
    }

    // Cache the result
    this.cache.set(url, postData)
    
    return postData
  }

  /**
   * Preload thumbnail image to check if it's valid
   */
  async isValidThumbnail(thumbnailUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = thumbnailUrl
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000)
    })
  }

  /**
   * Get optimized post data with validation
   */
  async getOptimizedPostData(url: string): Promise<InstagramPostData> {
    const postData = await this.getPostData(url)
    
    // Validate thumbnail if available
    if (postData.thumbnail_url) {
      const isValid = await this.isValidThumbnail(postData.thumbnail_url)
      if (!isValid) {
        // Remove invalid thumbnail
        delete postData.thumbnail_url
      }
    }
    
    return postData
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const instagramService = InstagramService.getInstance()