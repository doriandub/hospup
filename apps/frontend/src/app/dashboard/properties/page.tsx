'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PropertyForm } from '@/components/dashboard/property-form'
import { useProperties } from '@/hooks/useProperties'
import { 
  Plus, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Instagram,
  Edit,
  Trash2,
  Loader2,
  Upload,
  Video
} from 'lucide-react'

export default function PropertiesPage() {
  const router = useRouter()
  const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({})

  const handleCreate = async (data: any) => {
    setIsSubmitting(true)
    try {
      await createProperty(data)
      setIsCreateModalOpen(false)
    } catch (err) {
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedProperty) return
    
    setIsSubmitting(true)
    try {
      await updateProperty(selectedProperty.id, data)
      setIsEditModalOpen(false)
      setSelectedProperty(null)
    } catch (err) {
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (property: Property) => {
    if (!confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(property.id)
    try {
      await deleteProperty(property.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const openEditModal = (property: Property) => {
    setSelectedProperty(property)
    setIsEditModalOpen(true)
  }

  const fetchVideoCount = async (propertyId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/v1/videos/?property_id=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const videos = await response.json()
        setVideoCounts(prev => ({ ...prev, [propertyId]: videos.length }))
      }
    } catch (error) {
      console.error('Error fetching video count:', error)
    }
  }

  useEffect(() => {
    if (properties.length > 0) {
      properties.forEach(property => {
        fetchVideoCount(property.id)
      })
    }
  }, [properties])

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading properties...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage your hotels, Airbnb, restaurants and vacation rentals</p>
        </div>
        <Button onClick={() => router.push('/dashboard/properties/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {properties.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-6">Add your first property to start generating viral videos</p>
          <Button onClick={() => router.push('/dashboard/properties/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Property
          </Button>
        </div>
      )}

      {/* Properties Grid */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {property.property_type?.replace('_', ' ') || 'Property'}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(property)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(property)}
                      disabled={isDeleting === property.id}
                      className="text-gray-500 hover:text-red-600"
                    >
                      {isDeleting === property.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{property.city}, {property.country}</span>
                  </div>
                  
                  {property.website_url && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a 
                        href={property.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 truncate"
                      >
                        {property.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  
                  {property.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{property.phone}</span>
                    </div>
                  )}
                  
                  {property.instagram_handle && (
                    <div className="flex items-center">
                      <Instagram className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{property.instagram_handle}</span>
                    </div>
                  )}
                </div>

                {property.description && (
                  <p className="text-sm text-gray-600 mt-4 line-clamp-3">
                    {property.description}
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Created {new Date(property.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Video className="w-3 h-3 mr-1" />
                      {videoCounts[property.id] || 0} videos
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/dashboard/properties/${property.id}/content`)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Property Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <PropertyForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Property Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <PropertyForm
            property={selectedProperty || undefined}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false)
              setSelectedProperty(null)
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}