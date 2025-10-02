'use client'

import { useEffect, useState } from 'react'
import { useProperties } from '@/hooks/useProperties'
import {
  Video,
  BarChart3,
  Building2,
  CreditCard,
  Calendar,
  HardDrive
} from 'lucide-react'

interface DashboardStats {
  total_properties: number
  total_videos: number
  videos_this_month: number
  storage_used: number
  remaining_videos: number
  videos_limit: number
  videos_used: number
}

export default function BillingPage() {
  const { properties, loading: propertiesLoading } = useProperties()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!propertiesLoading) {
      const stats: DashboardStats = {
        total_properties: properties.length,
        total_videos: 12,
        videos_this_month: 5,
        storage_used: 245,
        remaining_videos: 38,
        videos_limit: 50,
        videos_used: 12
      }

      setStats(stats)
      setLoading(false)
    }
  }, [properties, propertiesLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 space-y-6">

        {/* Usage Metrics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Total Properties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {stats?.total_properties ?? 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Properties</div>
                </div>
              </div>
            </div>

            {/* Total Videos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Video className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {stats?.total_videos ?? 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Videos</div>
                </div>
              </div>
            </div>

            {/* Videos Used */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Video className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {stats?.videos_used ?? 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Videos Used</div>
                </div>
              </div>
            </div>

            {/* Videos Remaining */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {(stats?.videos_limit ?? 50) - (stats?.videos_used ?? 0)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Videos Remaining</div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {stats?.videos_this_month ?? 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">This Month</div>
                </div>
              </div>
            </div>

            {/* Storage Used */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <HardDrive className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {stats?.storage_used ?? 0} MB
                  </div>
                  <div className="text-sm font-medium text-gray-600">Storage Used</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pro Plan</h3>
                <p className="text-sm text-gray-600">Manage your subscription and payment details</p>
              </div>
            </div>
            <p className="text-gray-600">Billing management features coming soon.</p>
          </div>
        </div>

      </div>
    </div>
  )
}