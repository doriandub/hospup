'use client'

import { useState, useEffect } from 'react'

interface ViralTemplate {
  id: string
  title: string
  description: string
  category: string
  popularity_score: number
  total_duration_min: number
  total_duration_max: number
  tags: string[]
  views?: number
  likes?: number
  comments?: number
  followers?: number
  username?: string
  video_link?: string
  script?: string
  hotel_name?: string
  created_at?: string
  property?: string
  country?: string
}

export function useViralTemplates() {
  const [templates, setTemplates] = useState<ViralTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/v1/viral-matching/user-viral-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch viral templates')
      }

      const data = await response.json()
      setTemplates(data || [])
    } catch (err: any) {
      console.error('Viral templates fetch error:', err)
      
      // Use mock data for testing
      const mockTemplates: ViralTemplate[] = [
        {
          id: '1',
          title: 'Hôtel de Luxe - Vue Océan',
          description: 'Magnifique hôtel avec vue sur l\'océan, terrasse panoramique et coucher de soleil spectaculaire',
          category: 'hotel',
          popularity_score: 8.5,
          total_duration_min: 15,
          total_duration_max: 30,
          tags: ['Hôtel de luxe', 'France', '@luxuryhotel'],
          views: 1200000,
          likes: 85000,
          comments: 2500,
          followers: 150000,
          username: 'luxuryhotel',
          video_link: 'https://instagram.com/p/example1',
          script: 'Voici notre suite avec vue mer...',
          hotel_name: 'Grand Hôtel des Bains'
        },
        {
          id: '2', 
          title: '',
          description: 'Chef étoilé présentant ses créations culinaires dans un cadre raffiné',
          category: 'restaurant',
          popularity_score: 7.8,
          total_duration_min: 20,
          total_duration_max: 45,
          tags: ['Restaurant', 'Gastronomie', '@chefmichelin'],
          views: 850000,
          likes: 62000,
          comments: 1800,
          followers: 95000,
          username: 'chefmichelin',
          video_link: 'https://instagram.com/p/example2',
          script: 'Découvrez notre menu dégustation...',
          hotel_name: 'Restaurant Le Bernardin'
        },
        {
          id: '3',
          title: '',
          description: 'Villa privée avec piscine infinity et vue sur la mer Méditerranée',
          category: 'airbnb',
          popularity_score: 9.2,
          total_duration_min: 25,
          total_duration_max: 60,
          tags: ['Villa', 'Méditerranée', '@villamediterranee'],
          views: 2100000,
          likes: 145000,
          comments: 3200,
          followers: 220000,
          username: 'villamediterranee',
          video_link: 'https://instagram.com/p/example3',
          script: 'Bienvenue dans notre villa de rêve...',
          hotel_name: 'Villa Méditerranée'
        }
      ]
      setTemplates(mockTemplates)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  }
}