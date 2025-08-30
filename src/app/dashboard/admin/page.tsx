'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus,
  Settings,
  Edit,
  Trash2,
  Loader2,
  Star,
  Clock,
  Tag,
  ArrowLeft
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

export default function AdminPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ViralTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    popularity_score: 5.0,
    total_duration_min: 15.0,
    total_duration_max: 60.0,
    tags: ''
  })

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/v1/viral-matching/viral-templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/v1/viral-matching/viral-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          popularity_score: formData.popularity_score,
          total_duration_min: formData.total_duration_min,
          total_duration_max: formData.total_duration_max,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
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
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/v1/viral-matching/viral-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          popularity_score: formData.popularity_score,
          total_duration_min: formData.total_duration_min,
          total_duration_max: formData.total_duration_max,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
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
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/v1/viral-matching/viral-templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      tags: template.tags.join(', ')
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
      tags: ''
    })
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
            onClick={() => router.push('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-primary" />
              Administration - Templates Viraux
            </h1>
            <p className="text-gray-600 mt-1">Gérer les templates de vidéos virales</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => router.push('/dashboard/admin/add-videos')}>
            <Plus className="w-4 h-4 mr-2" />
            🎬 Ajouter Mes Vidéos
          </Button>
          <Button onClick={() => router.push('/dashboard/admin/simple')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            🐘 PostgreSQL + DBeaver
          </Button>
          <Button onClick={() => router.push('/dashboard/admin/database')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Base de Données
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Template Rapide
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <Clock className="w-6 h-6 text-blue-600" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.title}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {template.category}
                  </span>
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

              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Score:</span>
                  <span className="font-medium">{template.popularity_score}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Durée:</span>
                  <span className="font-medium">{template.total_duration_min}s - {template.total_duration_max}s</span>
                </div>
                {template.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template</h3>
          <p className="text-gray-600 mb-6">Créez votre premier template viral</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un Template
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Morning Routine TikTok"
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
                <Label htmlFor="duration_min">Durée Min (secondes)</Label>
                <Input
                  id="duration_min"
                  type="number"
                  value={formData.total_duration_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_duration_min: parseFloat(e.target.value) }))}
                  min="1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_max">Durée Max (secondes)</Label>
                <Input
                  id="duration_max"
                  type="number"
                  value={formData.total_duration_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_duration_max: parseFloat(e.target.value) }))}
                  min="1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score de Popularité (1-10)</Label>
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
                  placeholder="hotel, routine, morning"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez le template viral..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Titre *</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Morning Routine TikTok"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_category">Catégorie *</Label>
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
                <Label htmlFor="edit_duration_min">Durée Min (secondes)</Label>
                <Input
                  id="edit_duration_min"
                  type="number"
                  value={formData.total_duration_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_duration_min: parseFloat(e.target.value) }))}
                  min="1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_duration_max">Durée Max (secondes)</Label>
                <Input
                  id="edit_duration_max"
                  type="number"
                  value={formData.total_duration_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_duration_max: parseFloat(e.target.value) }))}
                  min="1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_score">Score de Popularité (1-10)</Label>
                <Input
                  id="edit_score"
                  type="number"
                  value={formData.popularity_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, popularity_score: parseFloat(e.target.value) }))}
                  min="1"
                  max="10"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_tags">Tags (séparés par des virgules)</Label>
                <Input
                  id="edit_tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="hotel, routine, morning"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description *</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez le template viral..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedTemplate(null); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Modifier'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}