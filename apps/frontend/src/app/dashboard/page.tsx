'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Video,
  BarChart3,
  Play,
  Plus,
  Upload,
  Activity,
  Download,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface DashboardStats {
  total_properties: number
  total_videos: number
  videos_this_month: number
  storage_used: number
  remaining_videos: number
  videos_limit: number
  videos_used: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:8000/api/v1/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error('Failed to fetch dashboard stats')
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <Link
        href="/dashboard/generate"
        className="block bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-8 rounded-xl shadow-lg border border-primary/20 hover:shadow-xl transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-white/90 font-medium">
              Ready to create your next viral video?
            </p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/generate">
          <Button 
            className="w-full bg-white border border-gray-200 text-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary hover:text-primary transition-all duration-200 h-auto justify-start"
            variant="ghost"
          >
            <Video className="w-5 h-5 mr-3" />
            <span className="font-medium">Generate Video</span>
          </Button>
        </Link>
        
        <Link href="/dashboard/properties">
          <Button 
            className="w-full bg-white border border-gray-200 text-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary hover:text-primary transition-all duration-200 h-auto justify-start"
            variant="ghost"
          >
            <Upload className="w-5 h-5 mr-3" />
            <span className="font-medium">Upload Content</span>
          </Button>
        </Link>
        
        <Link href="/dashboard/properties">
          <Button 
            className="w-full bg-white border border-gray-200 text-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-primary hover:text-primary transition-all duration-200 h-auto justify-start"
            variant="ghost"
          >
            <Plus className="w-5 h-5 mr-3" />
            <span className="font-medium">Add Property</span>
          </Button>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">At a Glance</h2>
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Videos - Premier à gauche */}
            <Link href="/dashboard/videos">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="space-y-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl w-fit border border-blue-200">
                    <Video className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-semibold text-gray-900">{stats?.total_videos ?? 0}</p>
                    <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Total Properties - Deuxième */}
            <Link href="/dashboard/properties">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="space-y-4">
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl w-fit border border-gray-200">
                    <Building2 className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-semibold text-gray-900">{stats?.total_properties ?? 0}</p>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Usage ce mois - Troisième */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl w-fit border border-green-200">
                  <BarChart3 className="w-6 h-6 text-green-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-semibold text-gray-900">{stats?.videos_this_month ?? 0}/{stats?.videos_limit ?? 2}</p>
                  <p className="text-sm font-medium text-gray-600">Videos This Month / Limit</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <Activity className="w-4 h-4 text-gray-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Welcome to Hospup!</p>
                    <p className="text-sm text-gray-600">Your account has been created successfully</p>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-500">Just now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats & Help */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Stats */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage Metrics</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Videos Used</span>
                <span className="text-sm font-semibold text-gray-900">{user?.videosUsed} / {user?.videosLimit}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full" 
                  style={{ width: `${((user?.videosUsed ?? 0) / (user?.videosLimit ?? 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Properties Registered</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.total_properties ?? 0} / 5</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full" 
                  style={{ width: `${((stats?.total_properties ?? 0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Storage Used</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.storage_used ?? 0}GB / 50GB</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full" 
                  style={{ width: `${((stats?.storage_used ?? 0) / 50) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Getting Started</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              Start creating viral videos for your properties in just a few steps:
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                <span className="text-sm text-gray-700">Add your first property</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                <span className="text-sm text-gray-700">Upload your property videos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                <span className="text-sm text-gray-700">Generate your first viral video</span>
              </div>
            </div>
            <Link href="/dashboard/properties">
              <Button className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Property
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}