'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Download } from 'lucide-react'

interface ViralVideo {
  id: string
  title: string
  hotel_name: string
  username: string
  country: string
  video_link: string
  account_link: string
  followers: number
  views: number
  likes: number
  comments: number
  duration: number
  category: string
  description: string
  popularity_score: number
}

export default function SimplePage() {
  const router = useRouter()
  const [data, setData] = useState<ViralVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const templates = await response.json()
        setData(templates)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">Base de Données PostgreSQL</h1>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          🐘 PostgreSQL + DBeaver configuré !
        </h2>
        <div className="text-blue-800 space-y-2">
          <p><strong>✅ PostgreSQL 15</strong> installé et lancé</p>
          <p><strong>✅ DBeaver</strong> installé (interface graphique)</p>
          <p><strong>✅ Base hospup_saas</strong> créée</p>
          <p><strong>✅ {data.length} vidéos</strong> migrées depuis SQLite</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Comment accéder à tes données</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-green-400 pl-4">
            <p className="font-medium">1. Ouvre DBeaver</p>
            <p className="text-gray-600">Applications → DBeaver</p>
          </div>
          <div className="border-l-4 border-blue-400 pl-4">
            <p className="font-medium">2. Nouvelle connexion PostgreSQL</p>
            <p className="text-gray-600">Host: localhost:5432, Database: hospup_saas, User: doriandubord</p>
          </div>
          <div className="border-l-4 border-purple-400 pl-4">
            <p className="font-medium">3. Accède à tes données</p>
            <p className="text-gray-600">Tables → viral_video_templates → Data (tu verras tes vidéos !)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Aperçu de tes données</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
            <div className="text-sm text-gray-600">Vidéos totales</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, row) => sum + (row.views || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Vues totales</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {data.length > 0 ? (data.reduce((sum, row) => sum + (row.popularity_score || 0), 0) / data.length).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">Score moyen</div>
          </div>
        </div>

        <div className="space-y-2">
          {data.slice(0, 5).map((video, index) => (
            <div key={video.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{video.title}</div>
                <div className="text-sm text-gray-600">@{video.username} • {video.country}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{(video.views || 0).toLocaleString()} vues</div>
                <div className="text-sm text-gray-600">Score: {video.popularity_score}/10</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}