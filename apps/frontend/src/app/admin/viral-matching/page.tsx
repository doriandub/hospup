'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Play,
  Eye, 
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  Users
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
  segments_pattern: SegmentPattern[]
}

interface SegmentPattern {
  scene_type: string
  duration_min: number
  duration_max: number
  description_contains: string[]
  required: boolean
  viral_elements: string[]
}

interface MatchResult {
  template: ViralTemplate
  match_score: number
  matched_segments: any[]
  missing_segments: any[]
  can_create: boolean
  suggested_duration: number
}

export default function ViralMatchingPage() {
  const [templates, setTemplates] = useState<ViralTemplate[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)

  // Mock data for templates - replace with API call
  useEffect(() => {
    const mockTemplates: ViralTemplate[] = [
      {
        id: '1',
        title: 'Luxury Hotel Airplane View',
        description: 'Surreal airplane window view with figures on clouds - viral travel content',
        category: 'travel',
        popularity_score: 9.2,
        total_duration_min: 9.8,
        total_duration_max: 14.6,
        tags: ['travel', 'surreal', 'airplane', 'viral', 'cinematic'],
        segments_pattern: [
          {
            scene_type: 'airplane',
            duration_min: 3.0,
            duration_max: 4.6,
            description_contains: ['surreal', 'cinematic'],
            required: true,
            viral_elements: ['cinematic_shots', 'surreal_content']
          }
        ]
      },
      {
        id: '2',
        title: 'Hotel Morning Routine',
        description: 'Luxury hotel morning routine - lifestyle viral content',
        category: 'lifestyle',
        popularity_score: 8.5,
        total_duration_min: 8.0,
        total_duration_max: 12.0,
        tags: ['lifestyle', 'routine', 'luxury', 'morning', 'hotel'],
        segments_pattern: [
          {
            scene_type: 'hotel_room',
            duration_min: 2.4,
            duration_max: 3.6,
            description_contains: ['aesthetic', 'luxury'],
            required: true,
            viral_elements: ['luxury_appeal']
          }
        ]
      },
      {
        id: '3',
        title: 'Hotel Room Tour',
        description: 'Quick luxury hotel room showcase - viral hospitality content',
        category: 'hospitality',
        popularity_score: 8.8,
        total_duration_min: 8.0,
        total_duration_max: 12.0,
        tags: ['hospitality', 'room_tour', 'luxury', 'showcase', 'viral'],
        segments_pattern: [
          {
            scene_type: 'hotel_room',
            duration_min: 2.0,
            duration_max: 3.0,
            description_contains: ['luxury'],
            required: true,
            viral_elements: ['luxury_appeal']
          }
        ]
      }
    ]
    setTemplates(mockTemplates)
  }, [])

  const findMatches = async () => {
    if (!selectedProperty) {
      alert('Please select a property first')
      return
    }

    setIsLoading(true)
    
    // Mock matching results - replace with actual API call
    setTimeout(() => {
      const mockMatches: MatchResult[] = templates.map(template => ({
        template,
        match_score: Math.random() * 0.4 + 0.6, // Random score between 0.6-1.0
        matched_segments: [
          {
            segment_id: 'seg_001',
            video_id: 'vid_001',
            scene_type: template.segments_pattern[0]?.scene_type || 'general',
            duration: Math.random() * 5 + 2,
            description: `Mock ${template.segments_pattern[0]?.scene_type || 'general'} segment`,
            confidence_score: 0.85
          }
        ],
        missing_segments: [],
        can_create: true,
        suggested_duration: template.total_duration_min + Math.random() * (template.total_duration_max - template.total_duration_min)
      }))

      // Sort by match score
      mockMatches.sort((a, b) => b.match_score - a.match_score)
      setMatches(mockMatches)
      setIsLoading(false)
    }, 1500)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      travel: 'bg-blue-100 text-blue-800',
      lifestyle: 'bg-purple-100 text-purple-800',
      hospitality: 'bg-green-100 text-green-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="w-8 h-8 text-primary mr-3" />
            Viral Video Matching System
          </h1>
          <p className="text-gray-600 mt-2">
            Find viral video patterns that match your hotel content and get reconstruction suggestions
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Choose a property...</option>
                <option value="hotel_001">Luxury Resort Paris</option>
                <option value="hotel_002">Beach Resort Maldives</option>
                <option value="hotel_003">Mountain Lodge Switzerland</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={findMatches}
                disabled={!selectedProperty || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 text-primary mr-2" />
                Viral Templates ({templates.length})
              </h2>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{template.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {template.popularity_score}/10
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {template.total_duration_min.toFixed(0)}-{template.total_duration_max.toFixed(0)}s
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Match Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Eye className="w-5 h-5 text-primary mr-2" />
                Matching Results
                {matches.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({matches.length} found)</span>
                )}
              </h2>

              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matches yet</h3>
                  <p className="text-gray-600">
                    Select a property and click "Find Matches" to see which viral videos you can recreate
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div
                      key={match.template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{match.template.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(match.template.category)}`}>
                              {match.template.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{match.template.description}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(match.match_score)}`}>
                            {(match.match_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">Match Score</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium text-gray-900">
                            {match.matched_segments.length}
                          </div>
                          <div className="text-xs text-gray-500">Matched Clips</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium text-gray-900">
                            {match.suggested_duration.toFixed(1)}s
                          </div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium text-gray-900">
                            {match.template.popularity_score}/10
                          </div>
                          <div className="text-xs text-gray-500">Viral Score</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className={`text-sm font-medium ${match.can_create ? 'text-green-600' : 'text-red-600'}`}>
                            {match.can_create ? 'Ready' : 'Missing'}
                          </div>
                          <div className="text-xs text-gray-500">Status</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {match.template.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90"
                            disabled={!match.can_create}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Create Video
                          </Button>
                        </div>
                      </div>

                      {match.can_create && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-sm text-green-800">
                            ✅ <strong>Ready to create!</strong> All required segments found.
                            <br />
                            💡 <em>Suggested duration: {match.suggested_duration.toFixed(1)}s with {match.matched_segments.length} clips</em>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{selectedTemplate.title}</h3>
                  <span className={`text-sm px-2 py-1 rounded-full ${getCategoryColor(selectedTemplate.category)}`}>
                    {selectedTemplate.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-900">{selectedTemplate.popularity_score}/10</div>
                  <div className="text-sm text-gray-500">Viral Score</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedTemplate.total_duration_min.toFixed(0)}-{selectedTemplate.total_duration_max.toFixed(0)}s
                  </div>
                  <div className="text-sm text-gray-500">Duration</div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Required Segments:</h4>
                <div className="space-y-2">
                  {selectedTemplate.segments_pattern.map((segment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{segment.scene_type}</span>
                        <span className="text-xs text-gray-500">
                          {segment.duration_min.toFixed(1)}-{segment.duration_max.toFixed(1)}s
                        </span>
                      </div>
                      {segment.description_contains.length > 0 && (
                        <div className="text-xs text-gray-600">
                          Keywords: {segment.description_contains.join(', ')}
                        </div>
                      )}
                      {segment.viral_elements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.viral_elements.map((element) => (
                            <span key={element} className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                              {element}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Tags:</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.tags.map((tag) => (
                    <span key={tag} className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}