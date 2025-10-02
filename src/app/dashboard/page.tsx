'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Play, Calendar, Clock, FileText, Image, Video } from 'lucide-react'
import { useVideos } from '@/hooks/useVideos'
import { useAssets } from '@/hooks/useAssets'

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState<'generate' | 'videos' | 'assets'>('generate')
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()
  const { videos, loading: videosLoading } = useVideos()
  const { assets, loading: assetsLoading } = useAssets()

  const handleSearch = () => {
    if (!searchValue.trim()) return

    if (selectedFilter === 'generate') {
      // Navigate to generate page with the search as description
      router.push(`/dashboard/generate?description=${encodeURIComponent(searchValue)}`)
    } else if (selectedFilter === 'videos') {
      // Navigate to videos page with search filter
      router.push(`/dashboard/videos?search=${encodeURIComponent(searchValue)}`)
    } else if (selectedFilter === 'assets') {
      // Navigate to assets page with search filter
      router.push(`/dashboard/assets?search=${encodeURIComponent(searchValue)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return Video
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image
    return FileText
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient Background - much smaller, only 1/5 height */}
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-[#06715b]/30 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-20 px-8">
        {/* Main Question */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-medium text-gray-900 mb-2">
            Qu'allez-vous créer aujourd'hui ?
          </h1>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedFilter('generate')}
            className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
              selectedFilter === 'generate'
                ? 'bg-[#06715b] text-white border-[#06715b] shadow-lg'
                : 'bg-transparent text-gray-700 border-gray-300 hover:border-[#06715b] hover:text-[#06715b]'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setSelectedFilter('videos')}
            className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
              selectedFilter === 'videos'
                ? 'bg-[#06715b] text-white border-[#06715b] shadow-lg'
                : 'bg-transparent text-gray-700 border-gray-300 hover:border-[#06715b] hover:text-[#06715b]'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setSelectedFilter('assets')}
            className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
              selectedFilter === 'assets'
                ? 'bg-[#06715b] text-white border-[#06715b] shadow-lg'
                : 'bg-transparent text-gray-700 border-gray-300 hover:border-[#06715b] hover:text-[#06715b]'
            }`}
          >
            Assets
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-16">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedFilter === 'generate'
                  ? 'Describe your video idea...'
                  : selectedFilter === 'videos'
                  ? 'Search videos...'
                  : 'Search assets...'
              }
              className="w-full px-6 py-4 pr-14 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#06715b] focus:border-[#06715b] text-gray-900 placeholder-gray-500 text-lg"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#06715b] text-white p-3 rounded-lg hover:bg-[#055a49] transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Content Section */}
        <div className="w-full max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {selectedFilter === 'assets' ? 'Recent Assets' : 'Recent Videos'}
            </h2>
            <button
              onClick={() => router.push(selectedFilter === 'assets' ? '/dashboard/assets' : '/dashboard/videos')}
              className="text-[#06715b] hover:text-[#055a49] font-medium transition-colors"
            >
              View all
            </button>
          </div>

          {(selectedFilter === 'assets' ? assetsLoading : videosLoading) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedFilter === 'assets' ? (
            assets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assets.slice(0, 8).map((asset) => {
                  const IconComponent = getFileIcon(asset.file_url)
                  return (
                    <div
                      key={asset.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/assets` as any)}
                    >
                      {/* Asset Thumbnail */}
                      <div className="relative aspect-video bg-gray-100">
                        {asset.thumbnail_url ? (
                          <img
                            src={asset.thumbnail_url}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <IconComponent className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        {/* Play button overlay for videos */}
                        {asset.file_url.match(/\.(mp4|mov|avi|mkv)$/i) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                            </div>
                          </div>
                        )}

                        {/* Duration for video assets */}
                        {asset.duration && asset.duration > 0 && (
                          <div className="absolute bottom-2 right-2">
                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Asset Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {asset.title || asset.file_url.split('/').pop() || 'Untitled Asset'}
                        </h3>

                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(asset.created_at).toLocaleDateString()}
                          </div>
                          {asset.duration && asset.duration > 0 && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-500 mb-4">Upload your first asset to see it here</p>
                <button
                  onClick={() => router.push('/dashboard/assets')}
                  className="bg-[#06715b] text-white px-6 py-2 rounded-lg hover:bg-[#055a49] transition-colors"
                >
                  Upload Assets
                </button>
              </div>
            )
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.slice(0, 8).map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/videos` as any)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-100">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        video.status === 'completed' ? 'bg-green-100 text-green-800' :
                        video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        video.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {video.status === 'completed' ? 'Ready' :
                         video.status === 'processing' ? 'Processing' :
                         video.status === 'pending' ? 'Pending' : 'Failed'}
                      </span>
                    </div>

                    {/* Duration */}
                    {video.duration > 0 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {video.title || video.ai_description || 'Untitled Video'}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                      {video.duration > 0 && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
              <p className="text-gray-500 mb-4">Create your first video to see it here</p>
              <button
                onClick={() => router.push('/dashboard/generate')}
                className="bg-[#06715b] text-white px-6 py-2 rounded-lg hover:bg-[#055a49] transition-colors"
              >
                Create Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}