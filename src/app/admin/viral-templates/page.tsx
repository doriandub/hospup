'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Check,
  Eye,
  Video,
  FileJson,
  Upload
} from 'lucide-react'

interface ViralVideo {
  id: string
  instagram_url: string
  title: string
  author: string
  view_count: number
  like_count: number
  duration: number
  script: {
    clips: Array<{
      order: number
      duration: number
      description: string
    }>
    texts?: Array<{
      content: string
      start: number
      end: number
      position: string
      style: string
    }>
  }
}

export default function ViralTemplatesAdmin() {
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ViralVideo | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load videos from localStorage (for demo)
  useEffect(() => {
    const stored = localStorage.getItem('viral_videos')
    if (stored) {
      setVideos(JSON.parse(stored))
    }
  }, [])

  // Save videos to localStorage
  const saveVideos = (newVideos: ViralVideo[]) => {
    setVideos(newVideos)
    localStorage.setItem('viral_videos', JSON.stringify(newVideos))
  }

  // Add new video from JSON
  const handleAddVideo = () => {
    try {
      const newVideo = JSON.parse(jsonInput)
      if (!newVideo.id) {
        newVideo.id = 'viral_' + Date.now()
      }
      saveVideos([...videos, newVideo])
      setJsonInput('')
      setShowAddForm(false)
    } catch (error) {
      alert('Invalid JSON format')
    }
  }

  // Delete video
  const handleDeleteVideo = (id: string) => {
    if (confirm('Delete this video template?')) {
      saveVideos(videos.filter(v => v.id !== id))
    }
  }

  // Copy script to clipboard
  const copyScript = (video: ViralVideo) => {
    navigator.clipboard.writeText(JSON.stringify(video.script, null, 2))
    setCopiedId(video.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Video className="w-8 h-8 text-primary mr-3" />
              Viral Templates Database
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your scraped viral videos and their scripts
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Viral Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Data (from Airtable or manual)
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`{
  "instagram_url": "https://instagram.com/...",
  "title": "Video Title",
  "author": "@username",
  "view_count": 1000000,
  "like_count": 50000,
  "duration": 15,
  "script": {
    "clips": [
      {
        "order": 1,
        "duration": 3,
        "description": "pool view sunset..."
      }
    ],
    "texts": []
  }
}`}
                  className="w-full h-64 p-3 border border-gray-200 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddVideo} className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Videos List */}
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{video.author}</span>
                    <span>•</span>
                    <span>{formatNumber(video.view_count)} views</span>
                    <span>•</span>
                    <span>{formatNumber(video.like_count)} likes</span>
                    <span>•</span>
                    <span>{video.duration}s</span>
                  </div>
                  
                  {/* Script Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Script: {video.script.clips.length} clips
                      {video.script.texts && video.script.texts.length > 0 && 
                        `, ${video.script.texts.length} texts`
                      }
                    </div>
                    <div className="space-y-1">
                      {video.script.clips.slice(0, 2).map((clip) => (
                        <div key={clip.order} className="text-xs text-gray-600">
                          Clip {clip.order}: {clip.duration}s - {clip.description.substring(0, 50)}...
                        </div>
                      ))}
                      {video.script.clips.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{video.script.clips.length - 2} more clips
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <a 
                      href={video.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View on Instagram
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyScript(video)}
                  >
                    {copiedId === video.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingVideo(video)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {videos.length === 0 && !showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileJson className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No viral templates yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first viral video template to get started
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Video
            </Button>
          </div>
        )}

        {/* Edit Modal */}
        {editingVideo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
              <h3 className="text-xl font-semibold mb-4">Edit Video Script</h3>
              <textarea
                value={JSON.stringify(editingVideo, null, 2)}
                onChange={(e) => {
                  try {
                    const updated = JSON.parse(e.target.value)
                    setEditingVideo(updated)
                  } catch {}
                }}
                className="w-full h-96 p-3 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => {
                    const updated = videos.map(v => 
                      v.id === editingVideo.id ? editingVideo : v
                    )
                    saveVideos(updated)
                    setEditingVideo(null)
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingVideo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}