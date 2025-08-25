'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useProperties } from '@/hooks/useProperties'
import { api } from '@/lib/api'
import { 
  Sparkles,
  Building2,
  Plus,
  Loader2,
  Shuffle
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

  const handleGenerateWithPrompt = async () => {
    if (!selectedProperty || !prompt.trim()) {
      alert('Please select a property and enter a description')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/v1/viral-matching/smart-match', {
        property_id: selectedProperty,
        user_description: prompt
      })
      
      if (response.data) {
        router.push(`/dashboard/compose/${response.data.id}?property=${selectedProperty}&prompt=${encodeURIComponent(prompt)}`)
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

  // No properties check
  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="grid grid-cols-1 gap-3 p-8">
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
      <div className="grid grid-cols-1 gap-3 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          
          {/* Property Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter' }}>Select Property</h2>
            <div className="relative">
              <select 
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full p-4 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#115446] focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter' }}>Describe Your Video</h2>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to showcase? (e.g., 'Romantic dinner at sunset on our terrace')"
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#115446] focus:border-transparent resize-none"
                rows={4}
                style={{ fontFamily: 'Inter' }}
              />
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={generateRandomPrompt}
                  className="flex items-center hover:bg-gray-50"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random Idea
                </Button>
                
                <Button
                  onClick={handleGenerateWithPrompt}
                  disabled={!selectedProperty || !prompt.trim() || loading}
                  className="bg-[#115446] hover:bg-[#115446]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finding Template...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}