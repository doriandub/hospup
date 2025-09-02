'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus,
  Settings,
  Edit,
  Trash2,
  Loader2,
  Star,
  Clock,
  Tag,
  ArrowLeft,
  ExternalLink,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Upload
} from 'lucide-react'

interface ViralTemplate {
  id: string
  title: string
  description: string
  category: string
  popularity_score: number
  total_duration_min: number
  total_duration_max: number
  tags: string[]
  
  // Social media data
  hotel_name?: string
  username?: string
  country?: string
  video_link?: string
  account_link?: string
  followers?: number
  views?: number
  likes?: number
  comments?: number
  duration?: number
  script?: any
}

const CATEGORIES = [
  'Morning Routine',
  'Hotel Tour',
  'Pool/Beach',
  'Food & Drinks',
  'Wellness/Spa',
  'Activities',
  'Room Service',
  'Local Experience',
  'Travel Tips',
  'Behind the Scenes'
]

const COUNTRIES = [
  'France', 'USA', 'UK', 'Germany', 'Spain', 'Italy', 'Canada', 'Australia',
  'Japan', 'Brazil', 'Mexico', 'Netherlands', 'Sweden', 'Norway', 'Switzerland'
]

export default function ViralTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ViralTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Basic data
    title: '',
    description: '',
    category: '',
    popularity_score: 5.0,
    total_duration_min: 15.0,
    total_duration_max: 60.0,
    tags: '',
    
    // Social media data
    hotel_name: '',
    username: '',
    country: '',
    video_link: '',
    account_link: '',
    followers: '',
    views: '',
    likes: '',
    comments: '',
    duration: '',
    script: ''
  })

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      alert('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      // Parse script if provided
      let parsedScript = null
      if (formData.script.trim()) {
        try {
          parsedScript = JSON.parse(formData.script)
        } catch (e) {
          alert('Invalid JSON in script field')
          return
        }
      }
      
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          popularity_score: formData.popularity_score,
          total_duration_min: formData.total_duration_min,
          total_duration_max: formData.total_duration_max,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          
          // Social media data
          hotel_name: formData.hotel_name || null,
          username: formData.username || null,
          country: formData.country || null,
          video_link: formData.video_link || null,
          account_link: formData.account_link || null,
          followers: formData.followers ? parseFloat(formData.followers) : null,
          views: formData.views ? parseFloat(formData.views) : null,
          likes: formData.likes ? parseFloat(formData.likes) : null,
          comments: formData.comments ? parseFloat(formData.comments) : null,
          duration: formData.duration ? parseFloat(formData.duration) : null,
          script: parsedScript
        })
      })
      
      if (response.ok) {
        await loadTemplates()
        setIsCreateModalOpen(false)
        resetForm()
      } else {
        throw new Error('Failed to create template')
      }
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedTemplate) return
    
    setIsSubmitting(true)
    try {
      // Parse script if provided
      let parsedScript = null
      if (formData.script.trim()) {
        try {
          parsedScript = JSON.parse(formData.script)
        } catch (e) {
          alert('Invalid JSON in script field')
          return
        }
      }
      
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          popularity_score: formData.popularity_score,
          total_duration_min: formData.total_duration_min,
          total_duration_max: formData.total_duration_max,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          
          // Social media data
          hotel_name: formData.hotel_name || null,
          username: formData.username || null,
          country: formData.country || null,
          video_link: formData.video_link || null,
          account_link: formData.account_link || null,
          followers: formData.followers ? parseFloat(formData.followers) : null,
          views: formData.views ? parseFloat(formData.views) : null,
          likes: formData.likes ? parseFloat(formData.likes) : null,
          comments: formData.comments ? parseFloat(formData.comments) : null,
          duration: formData.duration ? parseFloat(formData.duration) : null,
          script: parsedScript
        })
      })
      
      if (response.ok) {
        await loadTemplates()
        setIsEditModalOpen(false)
        setSelectedTemplate(null)
        resetForm()
      } else {
        throw new Error('Failed to update template')
      }
    } catch (error) {
      console.error('Failed to update template:', error)
      alert('Failed to update template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (template: ViralTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${template.title}" ?`)) {
      return
    }

    setIsDeleting(template.id)
    try {
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates/${template.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await loadTemplates()
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    } finally {
      setIsDeleting(null)
    }
  }

  const openEditModal = (template: ViralTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      title: template.title,
      description: template.description,
      category: template.category,
      popularity_score: template.popularity_score,
      total_duration_min: template.total_duration_min,
      total_duration_max: template.total_duration_max,
      tags: template.tags.join(', '),
      
      hotel_name: template.hotel_name || '',
      username: template.username || '',
      country: template.country || '',
      video_link: template.video_link || '',
      account_link: template.account_link || '',
      followers: template.followers?.toString() || '',
      views: template.views?.toString() || '',
      likes: template.likes?.toString() || '',
      comments: template.comments?.toString() || '',
      duration: template.duration?.toString() || '',
      script: template.script ? JSON.stringify(template.script, null, 2) : ''
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      popularity_score: 5.0,
      total_duration_min: 15.0,
      total_duration_max: 60.0,
      tags: '',
      hotel_name: '',
      username: '',
      country: '',
      video_link: '',
      account_link: '',
      followers: '',
      views: '',
      likes: '',
      comments: '',
      duration: '',
      script: ''
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Chargement des templates...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-primary" />
              Templates Viraux - Base de Données
            </h1>
            <p className="text-gray-600 mt-1">Gérer la collection complète de vidéos virales</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Catégories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(templates.map(t => t.category)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vues Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(templates.reduce((sum, t) => sum + (t.views || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Moyen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {templates.length > 0 ? (templates.reduce((sum, t) => sum + t.popularity_score, 0) / templates.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.title}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {template.category}
                    </span>
                    {template.country && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {template.country}
                      </span>
                    )}
                  </div>
                  {template.username && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      @{template.username}
                      {template.followers && (
                        <span className="ml-2">• {formatNumber(template.followers)} followers</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(template)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    disabled={isDeleting === template.id}
                    className="text-gray-500 hover:text-red-600"
                  >
                    {isDeleting === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Social Media Stats */}
              {(template.views || template.likes || template.comments) && (
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  {template.views && (
                    <div className="text-center">
                      <div className="flex items-center justify-center text-blue-600 mb-1">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatNumber(template.views)}</div>
                      <div className="text-xs text-gray-500">Vues</div>
                    </div>
                  )}
                  {template.likes && (
                    <div className="text-center">
                      <div className="flex items-center justify-center text-red-600 mb-1">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatNumber(template.likes)}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                  )}
                  {template.comments && (
                    <div className="text-center">
                      <div className="flex items-center justify-center text-green-600 mb-1">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatNumber(template.comments)}</div>
                      <div className="text-xs text-gray-500">Commentaires</div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Score Viral:</span>
                  <span className="font-medium">{template.popularity_score}/10</span>
                </div>
                {template.duration && (
                  <div className="flex items-center justify-between">
                    <span>Durée:</span>
                    <span className="font-medium">{template.duration}s</span>
                  </div>
                )}
                {template.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                          #{tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Links */}
              {(template.video_link || template.account_link) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    {template.video_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(template.video_link, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Vidéo
                      </Button>
                    )}
                    {template.account_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(template.account_link, '_blank')}
                        className="flex-1"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Compte
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template</h3>
          <p className="text-gray-600 mb-6">Importez vos première vidéos virales</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Importer une Vidéo Virale
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedTemplate(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateModalOpen ? 'Importer une Vidéo Virale' : 'Modifier le Template'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informations de Base</TabsTrigger>
              <TabsTrigger value="social">Données Sociales</TabsTrigger>
              <TabsTrigger value="script">Script JSON</TabsTrigger>
            </TabsList>
            
            <form onSubmit={(e) => { e.preventDefault(); isCreateModalOpen ? handleCreate() : handleEdit(); }}>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Viens on part loin 🌍✈️"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="score">Score Viral (1-10)</Label>
                    <Input
                      id="score"
                      type="number"
                      value={formData.popularity_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, popularity_score: parseFloat(e.target.value) }))}
                      min="1"
                      max="10"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="travel, hotel, routine"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez la vidéo virale..."
                    rows={3}
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotel_name">Nom de l'Établissement</Label>
                    <Input
                      id="hotel_name"
                      value={formData.hotel_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, hotel_name: e.target.value }))}
                      placeholder="e.g., Hôtel Sémaphore"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="e.g., viensonpartloin_"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (secondes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="views">Vues</Label>
                    <Input
                      id="views"
                      type="number"
                      value={formData.views}
                      onChange={(e) => setFormData(prev => ({ ...prev, views: e.target.value }))}
                      placeholder="e.g., 1170352"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="likes">Likes</Label>
                    <Input
                      id="likes"
                      type="number"
                      value={formData.likes}
                      onChange={(e) => setFormData(prev => ({ ...prev, likes: e.target.value }))}
                      placeholder="e.g., 22206"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">Commentaires</Label>
                    <Input
                      id="comments"
                      type="number"
                      value={formData.comments}
                      onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder="e.g., 299"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followers">Followers</Label>
                    <Input
                      id="followers"
                      type="number"
                      value={formData.followers}
                      onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value }))}
                      placeholder="e.g., 235000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="video_link">Lien Vidéo</Label>
                    <Input
                      id="video_link"
                      value={formData.video_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_link: e.target.value }))}
                      placeholder="https://www.instagram.com/p/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_link">Lien Compte</Label>
                    <Input
                      id="account_link"
                      value={formData.account_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_link: e.target.value }))}
                      placeholder="https://www.instagram.com/username/"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="script">Script JSON</Label>
                  <Textarea
                    id="script"
                    value={formData.script}
                    onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                    placeholder={`{
  "clips": [
    {
      "order": 1,
      "duration": 3.80,
      "description": "Airplane view of clouds..."
    }
  ],
  "texts": [
    {
      "content": "DEPUIS SON HUBLOT...",
      "start": 0.00,
      "end": 3.80,
      "anchor": "top_center"
    }
  ]
}`}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Format JSON avec clips et textes. Laissez vide pour les templates simples.
                  </p>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setSelectedTemplate(null)
                  resetForm()
                }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isCreateModalOpen ? 'Import...' : 'Modification...'}
                    </>
                  ) : (
                    isCreateModalOpen ? 'Importer' : 'Modifier'
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}