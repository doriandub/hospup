'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, Eye, Download, Share2, Trash2, RefreshCw, 
  Loader2, Plus, Calendar, Clock, CheckCircle, 
  AlertCircle, Zap, Filter, Search, Grid3X3, 
  List, MoreVertical, ExternalLink, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useProperties } from '@/hooks/useProperties'
import { useVideos } from '@/hooks/useVideos'

interface GeneratedVideo {
  id: string
  title: string
  description?: string
  video_url?: string
  thumbnail_url?: string
  duration: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  property_id: number
  template_id?: string
  generation_method: 'ffmpeg' | 'aws_mediaconvert'
  aws_job_id?: string
  ai_description?: string
  created_at: string
  completed_at?: string
}

export default function VideosPage() {
  const router = useRouter()
  const { properties } = useProperties()
  const { videos, loading, error, refetch: refetchVideos, deleteVideo } = useVideos()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return
    
    try {
      await deleteVideo(videoId)
    } catch (error) {
      alert('Erreur lors de la suppression')
    }
  }

  const handleDownload = (video: GeneratedVideo) => {
    if (video.video_url) {
      const link = document.createElement('a')
      link.href = video.video_url
      link.download = `${video.title}.mp4`
      link.click()
    }
  }

  const handleShare = (video: GeneratedVideo) => {
    const url = `${window.location.origin}/dashboard/videos/${video.id}/preview`
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.ai_description || video.description,
        url
      })
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien copié!')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
    }
  }

  const getPropertyName = (propertyId: number) => {
    return properties.find(p => p.id === propertyId)?.name || 'Propriété inconnue'
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.ai_description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    const matchesProperty = propertyFilter === 'all' || video.property_id.toString() === propertyFilter
    
    return matchesSearch && matchesStatus && matchesProperty
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement des vidéos</h2>
            <p className="text-gray-600">Récupération de vos créations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500" />
            Vidéos Générées
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos vidéos créées avec l'IA • {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/dashboard/generate')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer une vidéo
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminées</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="failed">Erreurs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les propriétés</SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={refetchVideos}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={refetchVideos}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid/List */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune vidéo générée</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || propertyFilter !== 'all' 
                ? 'Aucune vidéo ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première vidéo avec l\'IA.'
              }
            </p>
            <Button onClick={() => router.push('/dashboard/generate')}>
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première vidéo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group hover:shadow-lg transition-all duration-200">
              {viewMode === 'grid' ? (
                <>
                  <CardHeader className="p-0">
                    <div className="aspect-[9/16] bg-gray-900 relative rounded-t-lg overflow-hidden">
                      {video.status === 'completed' && video.thumbnail_url ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          {video.status === 'processing' ? (
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Génération...</p>
                            </div>
                          ) : video.status === 'failed' ? (
                            <div className="text-center">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Erreur</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Clock className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">En attente</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(video.status)}
                      </div>

                      {video.generation_method === 'aws_mediaconvert' && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="outline" className="bg-white/90">
                            <Zap className="w-3 h-3 mr-1" />
                            AWS
                          </Badge>
                        </div>
                      )}

                      {video.status === 'completed' && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/videos/${video.id}/preview`)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{video.title}</h3>
                        <p className="text-sm text-gray-600">{getPropertyName(video.property_id)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(video.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{video.duration}s</span>
                      </div>

                      {video.status === 'completed' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => router.push(`/dashboard/videos/${video.id}/preview`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(video)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShare(video)}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-24 bg-gray-900 rounded-lg flex-shrink-0 flex items-center justify-center text-white">
                      {video.status === 'completed' && video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
                        {getStatusBadge(video.status)}
                        {video.generation_method === 'aws_mediaconvert' && (
                          <Badge variant="outline">
                            <Zap className="w-3 h-3 mr-1" />
                            AWS
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{getPropertyName(video.property_id)}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(video.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{video.duration}s</span>
                      </div>
                    </div>
                    
                    {video.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/videos/${video.id}/preview`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(video)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShare(video)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}