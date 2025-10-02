'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useProperties } from '@/hooks/useProperties'
import { VideoGenerationHeader } from '@/components/video-generation/VideoGenerationHeader'
import { api } from '@/lib/api'
import {
  Plus,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function GenerateVideoPage() {
  const router = useRouter()
  const { properties } = useProperties()
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const generateRandomPrompt = () => {
    const postIdeas = [
      "Showcase your pool with panoramic sunset views",
      "Feature breakfast served on your private terrace",
      "Present your suite with jacuzzi and unique decoration",
      "Capture guests arriving in your elegant lobby",
      "Show your gourmet restaurant's evening atmosphere",
      "Highlight luxurious details of your signature room",
      "Present your spa and relaxing treatments"
    ]
    
    const randomIdea = postIdeas[Math.floor(Math.random() * postIdeas.length)]
    setPrompt(randomIdea)
  }

  const handleGenerateTemplate = async () => {
    if (!selectedProperty || !prompt.trim()) {
      alert('Please select a property and enter a description')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/v1/viral-matching/smart-match', {
        property_id: selectedProperty,
        user_description: prompt
      }) as any
      
      if (response && response.id) {
        // Redirect to template preview instead of compose
        const params = new URLSearchParams({
          property: selectedProperty,
          description: prompt
        })
        router.push(`/dashboard/template-preview/${response.id}?${params.toString()}`)
      } else {
        alert('No template found. Please try a different description.')
      }
    } catch (error) {
      console.error('Failed to find template:', error)
      alert('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRandomTemplate = async () => {
    if (!selectedProperty) {
      alert('Please select a property')
      return
    }

    setLoading(true)
    try {
      // Get all templates and pick a random one
      const response = await api.get('/api/v1/viral-matching/viral-templates') as any[]
      
      if (response && response.length > 0) {
        const randomTemplate = response[Math.floor(Math.random() * response.length)]
        
        // Redirect to template preview with random template
        const params = new URLSearchParams({
          property: selectedProperty,
          description: 'Template choisi aléatoirement'
        })
        router.push(`/dashboard/template-preview/${randomTemplate.id}?${params.toString()}`)
      } else {
        alert('No templates available.')
      }
    } catch (error) {
      console.error('Failed to get random template:', error)
      alert('Failed to get random template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // No properties check
  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="grid grid-cols-1 gap-3 p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#09725c] text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">H</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Add your first property to start generating viral videos</p>
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Property
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <VideoGenerationHeader
        currentStep={1}
        propertyId={selectedProperty}
        showGenerationButtons={!!selectedProperty}
        onRandomTemplate={handleRandomTemplate}
        onGenerateTemplate={handleGenerateTemplate}
        isGenerating={loading}
      />
      
      <div className="grid grid-cols-1 gap-3 px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          
          {/* Property Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter' }}>
              Select Property
            </h2>
            <div className="relative">
              <select 
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full p-4 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#09725c] focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
                style={{ fontFamily: 'Inter' }}
              >
                <option value="">Choose a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}, {property.country}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Video Description */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Inter' }}>
                Describe Your Video
              </h2>
              <Button
                onClick={generateRandomPrompt}
                variant="outline"
                size="sm"
                className="border-[#09725c] text-[#09725c] hover:bg-[#09725c]/10"
              >
                Random Idea
              </Button>
            </div>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to showcase? (e.g., 'Romantic dinner at sunset on our terrace')"
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#09725c] focus:border-transparent resize-none"
                rows={4}
                style={{ fontFamily: 'Inter' }}
              />
              
              <div className="text-center py-4 text-gray-500 text-sm">
                {!selectedProperty ? (
                  "Sélectionnez une propriété pour commencer"
                ) : !prompt.trim() ? (
                  "Décrivez votre vidéo pour activer Generate Template, ou utilisez Random Template"
                ) : (
                  "Utilisez les boutons dans la barre du haut pour générer"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}