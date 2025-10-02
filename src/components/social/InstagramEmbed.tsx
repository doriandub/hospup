'use client'

import { useState, useEffect } from 'react'
import { Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstagramEmbedProps {
  postUrl: string
  className?: string
  showPlayButton?: boolean
}

export function InstagramEmbed({ postUrl, className = '', showPlayButton = true }: InstagramEmbedProps) {
  const [isEmbedVisible, setIsEmbedVisible] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Extract post ID from Instagram URL
  const getPostId = (url: string) => {
    const match = url.match(/(?:instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+))|(?:instagr\.am\/p\/([A-Za-z0-9_-]+))/)
    return match ? (match[1] || match[2]) : null
  }

  // Generate thumbnail URL from post URL
  const generateThumbnailUrl = (url: string) => {
    const postId = getPostId(url)
    if (!postId) return null
    
    // Use Instagram's media endpoint for thumbnails
    // This is a common pattern for Instagram media thumbnails
    return `https://www.instagram.com/p/${postId}/media/?size=m`
  }

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        // Fallback to generated thumbnail
        const thumb = generateThumbnailUrl(postUrl)
        setThumbnailUrl(thumb)
      } catch (error) {
        console.warn('Failed to load Instagram data:', error)
        const thumb = generateThumbnailUrl(postUrl)
        setThumbnailUrl(thumb)
      }
    }
    
    loadThumbnail()
  }, [postUrl])

  const handleShowVideo = () => {
    // Option 1: Direct redirect to Instagram
    window.open(postUrl, '_blank')
    
    // Option 2: You could implement in-app video player here later
    // For now, just redirect to Instagram for best UX
  }

  const openInInstagram = () => {
    window.open(postUrl, '_blank')
  }

  // Removed the complex embed view - now just shows thumbnail and redirects

  return (
    <div className={`relative group cursor-pointer ${className}`}>
      {/* Thumbnail with overlay */}
      <div 
        className="relative bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-lg overflow-hidden w-full h-full"
        onClick={handleShowVideo}
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl}
            alt="Instagram post"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to Instagram-style gradient background
              const target = e.currentTarget
              target.style.display = 'none'
              console.log('Instagram thumbnail failed to load:', thumbnailUrl)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <p className="text-sm font-medium">Instagram</p>
            </div>
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {showPlayButton && (
            <div className="bg-white bg-opacity-90 rounded-full p-3">
              <Play className="w-6 h-6 text-gray-800 fill-current" />
            </div>
          )}
        </div>
        
        {/* Instagram logo corner */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-20 rounded-md p-1">
          <svg 
            className="w-4 h-4 text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      </div>
      
      {/* External link button */}
      <div className="absolute bottom-2 left-2">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            openInInstagram()
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-2 py-1 h-7"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// Add type for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}