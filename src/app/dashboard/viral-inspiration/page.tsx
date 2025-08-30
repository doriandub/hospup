'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useViralTemplates } from '@/hooks/useViralTemplates'
import { useProperties } from '@/hooks/useProperties'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Lightbulb,
  Search,
  Play,
  Users,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Video,
  Sparkles,
  Filter
} from 'lucide-react'
import { InstagramEmbed } from '@/components/social/InstagramEmbed'

export default function ViralInspirationPage() {
  const router = useRouter()
  const { templates, loading, error } = useViralTemplates()
  const { properties } = useProperties()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('views')

  // Filter and sort templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.hotel_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.username?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.views || 0) - (a.views || 0)
      case 'likes':
        return (b.likes || 0) - (a.likes || 0)
      case 'ratio':
        // Calculate engagement ratio: (likes + comments) / views
        const aRatio = ((a.likes || 0) + (a.comments || 0)) / (a.views || 1)
        const bRatio = ((b.likes || 0) + (b.comments || 0)) / (b.views || 1)
        return bRatio - aRatio
      case 'latest':
        // Sort by creation date (most recent first)
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'newest':
        // Same as latest for now
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      default:
        return 0
    }
  })

  const handleRecreateVideo = (template: any) => {
    // Navigate to generation page with the template preselected
    const params = new URLSearchParams({
      template_id: template.id,
      template_title: template.title || 'Viral Video'
    })
    router.push(`/dashboard/generate?${params.toString()}`)
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getCategories = () => {
    const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))
    return categories
  }


  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <div className="grid grid-cols-1 gap-3 p-8">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-3">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher des vidéos virales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters and Sort Controls */}
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Vues
                    </div>
                  </SelectItem>
                  <SelectItem value="likes">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Likes
                    </div>
                  </SelectItem>
                  <SelectItem value="ratio">
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ratio d'engagement
                    </div>
                  </SelectItem>
                  <SelectItem value="latest">
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Plus récentes
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Les plus nouvelles
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <EmptyState
          icon={Lightbulb}
          title="Aucune inspiration trouvée"
          description={
            searchQuery || categoryFilter !== 'all'
              ? 'Aucune vidéo virale ne correspond à vos critères de recherche'
              : 'Aucune vidéo virale disponible pour le moment'
          }
          action={
            searchQuery || categoryFilter !== 'all' ? (
              <Button 
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                }}
                variant="outline"
              >
                <Filter className="w-4 h-4 mr-2" />
                Effacer les filtres
              </Button>
            ) : null
          }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Video Thumbnail/Preview */}
                  <div className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
                    {template.video_link && template.video_link.includes('instagram.com') ? (
                      <div className="w-full h-full">
                        <InstagramEmbed 
                          postUrl={template.video_link}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Template Header */}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                          {template.hotel_name}
                        </h3>
                        {template.property && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#09725c]/10 text-[#09725c] ml-2">
                            {template.property}
                          </span>
                        )}
                      </div>
                      {template.country && (
                        <p className="text-sm text-gray-600">
                          📍 {template.country}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1 text-[#09725c]" />
                        <span>{formatNumber(template.views)}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-3 h-3 mr-1 text-red-500" />
                        <span>{formatNumber(template.likes)}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-[#ff914d]" />
                        <span>{formatNumber(template.followers)}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1 text-blue-500" />
                        <span>{formatNumber(template.comments)}</span>
                      </div>
                      {/* Engagement Ratio */}
                      <div className="col-span-2 flex items-center justify-center bg-gray-50 rounded-lg py-1 px-2 mt-1">
                        <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                        <span className="text-purple-700 font-semibold">
                          Engagement: {(((template.likes || 0) + (template.comments || 0)) / (template.views || 1) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleRecreateVideo(template)}
                        className="flex-1"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Recréer la vidéo
                      </Button>
                      
                      {template.video_link && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(template.video_link, '_blank')}
                          className="px-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Affichage de {filteredTemplates.length} vidéo{filteredTemplates.length !== 1 ? 's' : ''} virale{filteredTemplates.length !== 1 ? 's' : ''} sur {templates.length} au total
            </div>
          </>
        )}
      </div>
    </div>
  )
}