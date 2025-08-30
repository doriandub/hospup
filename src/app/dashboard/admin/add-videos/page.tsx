'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Upload, Database, Loader2 } from 'lucide-react'

interface VideoForm {
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
  script: string
}

const CATEGORIES = [
  'Morning Routine', 'Hotel Tour', 'Pool/Beach', 'Food & Drinks',
  'Wellness/Spa', 'Activities', 'Room Service', 'Local Experience',
  'Travel Tips', 'Behind the Scenes'
]

export default function AddVideosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState<VideoForm[]>([{
    title: '',
    hotel_name: '',
    username: '',
    country: '',
    video_link: '',
    account_link: '',
    followers: 0,
    views: 0,
    likes: 0,
    comments: 0,
    duration: 30,
    category: 'Hotel Tour',
    description: '',
    popularity_score: 5.0,
    script: ''
  }])

  const addVideoForm = () => {
    setVideos([...videos, {
      title: '',
      hotel_name: '',
      username: '',
      country: '',
      video_link: '',
      account_link: '',
      followers: 0,
      views: 0,
      likes: 0,
      comments: 0,
      duration: 30,
      category: 'Hotel Tour',
      description: '',
      popularity_score: 5.0,
      script: ''
    }])
  }

  const removeVideoForm = (index: number) => {
    if (videos.length > 1) {
      setVideos(videos.filter((_, i) => i !== index))
    }
  }

  const updateVideo = (index: number, field: keyof VideoForm, value: any) => {
    const updated = [...videos]
    updated[index] = { ...updated[index], [field]: value }
    setVideos(updated)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      for (const video of videos) {
        if (!video.title.trim()) continue
        
        // Construire le script JSON
        const scriptObj = video.script.trim() ? 
          { description: video.script } : 
          { description: video.description }
        
        const payload = {
          title: video.title,
          hotel_name: video.hotel_name,
          username: video.username,
          country: video.country,
          video_link: video.video_link,
          account_link: video.account_link,
          followers: video.followers,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          duration: video.duration,
          category: video.category,
          description: video.description,
          popularity_score: video.popularity_score,
          script: scriptObj,
          tags: [],
          total_duration_min: video.duration * 0.8,
          total_duration_max: video.duration * 1.2
        }

        const response = await fetch('http://localhost:8000/api/v1/viral-matching/viral-templates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Erreur lors de l'ajout de "${video.title}"`)
        }
      }
      
      alert(`${videos.filter(v => v.title.trim()).length} vidéos ajoutées avec succès !`)
      router.push('/dashboard/admin')
      
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('Fichier CSV invalide')
        return
      }

      // Parse CSV (simple)
      const headers = lines[0].split(',').map(h => h.trim())
      const newVideos: VideoForm[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length >= 3) {
          const video: VideoForm = {
            title: values[0] || '',
            hotel_name: values[1] || '',
            username: values[2] || '',
            country: values[3] || '',
            video_link: values[4] || '',
            account_link: values[5] || '',
            followers: parseInt(values[6]) || 0,
            views: parseInt(values[7]) || 0,
            likes: parseInt(values[8]) || 0,
            comments: parseInt(values[9]) || 0,
            duration: parseInt(values[10]) || 30,
            category: values[11] || 'Hotel Tour',
            description: values[12] || '',
            popularity_score: parseFloat(values[13]) || 5.0,
            script: values[14] || ''
          }
          newVideos.push(video)
        }
      }

      setVideos(newVideos)
      alert(`${newVideos.length} vidéos importées depuis CSV !`)
    }
    reader.readAsText(file)
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
              <Database className="w-6 h-6 mr-3 text-primary" />
              Ajouter des Vidéos Virales
            </h1>
            <p className="text-gray-600 mt-1">Remplis ta base avec tes vraies vidéos</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <Button onClick={addVideoForm} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Vidéo
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Comment ajouter tes vidéos ?</h3>
        <div className="text-blue-800 space-y-1">
          <p><strong>Option 1:</strong> Remplis le formulaire ci-dessous (une ou plusieurs vidéos)</p>
          <p><strong>Option 2:</strong> Upload un fichier CSV exporté depuis Airtable/Excel</p>
          <p><strong>Template CSV:</strong> 
            <a 
              href="/template_videos.csv" 
              download 
              className="underline hover:text-blue-900 ml-1"
            >
              Télécharger exemple.csv
            </a>
          </p>
        </div>
      </div>

      {/* Video Forms */}
      <div className="space-y-8">
        {videos.map((video, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Vidéo {index + 1}</h3>
              {videos.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeVideoForm(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Titre & Hôtel */}
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={video.title}
                  onChange={(e) => updateVideo(index, 'title', e.target.value)}
                  placeholder="Morning Routine TikTok"
                />
              </div>

              <div className="space-y-2">
                <Label>Nom de l'Hôtel</Label>
                <Input
                  value={video.hotel_name}
                  onChange={(e) => updateVideo(index, 'hotel_name', e.target.value)}
                  placeholder="Sémaphore de Lervilly"
                />
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={video.category} onValueChange={(value) => updateVideo(index, 'category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Créateur */}
              <div className="space-y-2">
                <Label>Username/Créateur</Label>
                <Input
                  value={video.username}
                  onChange={(e) => updateVideo(index, 'username', e.target.value)}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label>Pays</Label>
                <Input
                  value={video.country}
                  onChange={(e) => updateVideo(index, 'country', e.target.value)}
                  placeholder="France"
                />
              </div>

              <div className="space-y-2">
                <Label>Score Viral (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={video.popularity_score}
                  onChange={(e) => updateVideo(index, 'popularity_score', parseFloat(e.target.value))}
                />
              </div>

              {/* Liens */}
              <div className="space-y-2">
                <Label>Lien Vidéo</Label>
                <Input
                  value={video.video_link}
                  onChange={(e) => updateVideo(index, 'video_link', e.target.value)}
                  placeholder="https://tiktok.com/@user/video/123"
                />
              </div>

              <div className="space-y-2">
                <Label>Lien Compte</Label>
                <Input
                  value={video.account_link}
                  onChange={(e) => updateVideo(index, 'account_link', e.target.value)}
                  placeholder="https://tiktok.com/@user"
                />
              </div>

              <div className="space-y-2">
                <Label>Durée (secondes)</Label>
                <Input
                  type="number"
                  value={video.duration}
                  onChange={(e) => updateVideo(index, 'duration', parseInt(e.target.value))}
                  placeholder="30"
                />
              </div>

              {/* Métriques */}
              <div className="space-y-2">
                <Label>Followers</Label>
                <Input
                  type="number"
                  value={video.followers}
                  onChange={(e) => updateVideo(index, 'followers', parseInt(e.target.value))}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label>Vues</Label>
                <Input
                  type="number"
                  value={video.views}
                  onChange={(e) => updateVideo(index, 'views', parseInt(e.target.value))}
                  placeholder="1000000"
                />
              </div>

              <div className="space-y-2">
                <Label>Likes</Label>
                <Input
                  type="number"
                  value={video.likes}
                  onChange={(e) => updateVideo(index, 'likes', parseInt(e.target.value))}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label>Commentaires</Label>
                <Input
                  type="number"
                  value={video.comments}
                  onChange={(e) => updateVideo(index, 'comments', parseInt(e.target.value))}
                  placeholder="1000"
                />
              </div>
            </div>

            {/* Description & Script */}
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={video.description}
                  onChange={(e) => updateVideo(index, 'description', e.target.value)}
                  placeholder="Description de la vidéo virale..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Script/Contenu</Label>
                <Textarea
                  value={video.script}
                  onChange={(e) => updateVideo(index, 'script', e.target.value)}
                  placeholder="Script détaillé de la vidéo..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4 mt-8">
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="px-8"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ajout en cours...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Ajouter {videos.filter(v => v.title.trim()).length} Vidéo{videos.filter(v => v.title.trim()).length > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}