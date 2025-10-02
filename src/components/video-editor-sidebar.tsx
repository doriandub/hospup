'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type,
  Image,
  Play,
  Trash2,
  Edit3,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number }
  style: { color: string; font_size: number }
}

interface VideoEditorSidebarProps {
  contentVideos: ContentVideo[]
  textOverlays: TextOverlay[]
  onAddText: () => void
  onEditText: (textId: string) => void
  onDeleteText: (textId: string) => void
  onVideoSelect: (video: ContentVideo) => void
  onDragStart?: (video: ContentVideo) => void
  onDragEnd?: () => void
  draggedVideo?: ContentVideo | null
  className?: string
}

export function VideoEditorSidebar({
  contentVideos,
  textOverlays,
  onAddText,
  onEditText,
  onDeleteText,
  onVideoSelect,
  onDragStart,
  onDragEnd,
  draggedVideo,
  className
}: VideoEditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'text'>('assets')

  const handleDragStart = (video: ContentVideo) => {
    onDragStart?.(video)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  return (
    <div className={cn(
      "w-80 bg-white border-r border-gray-200 flex flex-col",
      className
    )}>
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('assets')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === 'assets'
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Image className="w-4 h-4" />
            Assets
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {contentVideos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === 'text'
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Type className="w-4 h-4" />
            Texte
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {textOverlays.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'assets' && (
          <div className="p-4">
            {/* Assets section header */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Glissez les vidéos dans la timeline
              </h3>
              <p className="text-xs text-gray-500">
                Sélectionnez et glissez vos assets vers les emplacements de la timeline
              </p>
            </div>

            {/* Assets grid */}
            <div className="space-y-3">
              {contentVideos.map((video) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => handleDragStart(video)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onVideoSelect(video)}
                  className={cn(
                    "group relative bg-gray-50 rounded-lg p-3 cursor-pointer transition-all",
                    "hover:bg-gray-100 hover:shadow-sm",
                    "border-2 border-transparent hover:border-primary/20",
                    draggedVideo?.id === video.id && "opacity-50 scale-95"
                  )}
                >
                  {/* Video thumbnail */}
                  <div className="aspect-video bg-gray-200 rounded-md mb-3 overflow-hidden relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Play className="w-6 h-6" />
                      </div>
                    )}

                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {Math.round(video.duration)}s
                    </div>
                  </div>

                  {/* Video info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {video.title || 'Sans titre'}
                    </h4>
                    {video.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Drag indicator */}
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}

              {contentVideos.length === 0 && (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">Aucun asset trouvé</p>
                  <p className="text-xs text-gray-400">
                    Uploadez des vidéos dans la section Assets
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="p-4">
            {/* Text section header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Overlays de texte
                </h3>
                <Button
                  size="sm"
                  onClick={onAddText}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Gérez les textes qui apparaîtront sur votre vidéo
              </p>
            </div>

            {/* Text overlays list */}
            <div className="space-y-3">
              {textOverlays.map((text) => (
                <div
                  key={text.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  {/* Text content preview */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {text.content || 'Texte vide'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{text.start_time}s - {text.end_time}s</span>
                      <span>•</span>
                      <span style={{ color: text.style.color }}>
                        {text.style.font_size}px
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditText(text.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteText(text.id)}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {textOverlays.length === 0 && (
                <div className="text-center py-8">
                  <Type className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">Aucun texte ajouté</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Ajoutez des overlays de texte à votre vidéo
                  </p>
                  <Button
                    size="sm"
                    onClick={onAddText}
                    className="h-8 px-3 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter du texte
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}