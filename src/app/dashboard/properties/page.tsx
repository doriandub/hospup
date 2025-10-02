'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PropertyForm } from '@/components/dashboard/property-form'
import { useProperties } from '@/hooks/useProperties'
import { useQuota } from '@/hooks/useQuota'
import { api } from '@/lib/api'
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
import Image from 'next/image'

export default function PropertiesPage() {
  const router = useRouter()
  const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
  const { quotaInfo, checkCanCreateProperty, getRemainingProperties, getUsedProperties, getPropertiesLimit, hasQuotaInfo, loading: quotaLoading } = useQuota()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [videoCounts, setVideoCounts] = useState<Record<number, number>>({})
  const [propertyThumbnails, setPropertyThumbnails] = useState<Record<number, string>>({})

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

  const fetchVideoCount = async (propertyId: number) => {
    try {
      // Use centralized API client for consistent authentication
      const videos = await api.get(`/api/v1/videos/?property_id=${propertyId}`) as any[]
      setVideoCounts(prev => ({ ...prev, [propertyId]: videos.length }))
      
      // Get thumbnail from the most recent video if available
      if (videos.length > 0) {
        const mostRecentVideo = videos.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        
        if (mostRecentVideo.thumbnail_url) {
          setPropertyThumbnails(prev => ({ 
            ...prev, 
            [propertyId]: mostRecentVideo.thumbnail_url 
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching video count:', error)
    }
  }

  useEffect(() => {
    if (properties && properties.length > 0) {
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
    <div className="min-h-screen bg-gray-50 font-inter">
      <div className="grid grid-cols-1 gap-3 p-8">

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        {/* Empty State */}
        {properties.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet - Ready to create!</h3>
            <p className="text-gray-600 mb-6">Add your first property to start generating viral videos</p>
            <Button onClick={() => router.push('/dashboard/properties/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}


        {/* Properties Grid */}
        {properties.length > 0 || loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Add Property Card - Always first */}
          <div 
            className={`bg-[#09725c]/5 border border-[#09725c]/30 rounded-xl shadow-sm p-8 transition-all duration-200 group ${
              checkCanCreateProperty(properties.length) 
                ? 'cursor-pointer hover:bg-[#09725c]/10 hover:shadow-md' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => {
              if (checkCanCreateProperty(properties.length)) {
                router.push('/dashboard/properties/new')
              } else {
                alert(`Quota exceeded! You have used ${getUsedProperties(properties.length)}/${getPropertiesLimit()} properties. Upgrade your plan to add more.`)
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold mb-2 text-[#09725c]" style={{ fontFamily: 'Inter' }}>Add Property</h1>
                <p className="text-base font-medium text-[#09725c]/80" style={{ fontFamily: 'Inter' }}>
                  {checkCanCreateProperty(properties.length) 
                    ? `Create new property (${getRemainingProperties(properties.length)} remaining)` 
                    : `Quota limit reached (${getUsedProperties(properties.length)}/${getPropertiesLimit()})`
                  }
                </p>
              </div>
              <div className="bg-[#09725c]/10 rounded-full p-3 group-hover:bg-[#09725c]/20 transition-all">
                <Plus className="w-5 h-5 text-[#09725c]" />
              </div>
            </div>
          </div>

          {/* Property Cards */}
          {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Thumbnail */}
            {propertyThumbnails[property.id] ? (
              <div className="relative aspect-[16/9] bg-gray-100">
                <Image 
                  src={propertyThumbnails[property.id]} 
                  alt={property.name}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                  unoptimized={propertyThumbnails[property.id].includes('amazonaws.com')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-lg mb-1 drop-shadow-sm">{property.name}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{property.city}, {property.country}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[16/9] bg-gradient-to-br from-[#09725c]/10 to-[#ff914d]/10 flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No videos yet</p>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">{property.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{property.city}, {property.country}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#09725c]/10 text-[#09725c] capitalize mb-2">
                    Property
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
                {property.website_url && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    <a 
                      href={property.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#09725c] hover:text-[#09725c]/80 truncate"
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
                
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Video className="w-3 h-3 mr-1" />
                    {videoCounts[property.id] || 0} videos
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/properties/${property.id}/content` as any)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
        ) : null}
      </div>

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