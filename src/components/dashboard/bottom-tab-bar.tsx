'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Video,
  Plus,
  FolderOpen,
  User,
  Building2,
  Settings,
  CreditCard,
  Shield,
  LogOut,
  HelpCircle,
  X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Logout error handled silently
    } finally {
      setIsProfileOpen(false)
    }
  }

  // Handle responsive behavior - close profile and redirect to home when moving to desktop
  useEffect(() => {
    const handleResize = () => {
      // Check if we're on desktop (md breakpoint and above - 768px)
      const isDesktop = window.innerWidth >= 768

      if (isDesktop && isProfileOpen) {
        // Close profile modal
        setIsProfileOpen(false)
        // Redirect to home page
        router.push('/dashboard')
      }
    }

    // Listen for window resize
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isProfileOpen, router])

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true
    if (path !== '/dashboard' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Profile Page with Tab Bar */}
      {isProfileOpen && (
        <div className="fixed inset-x-0 top-0 bottom-16 z-40 bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-4">
            {/* User Info Section */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs text-primary bg-primary/10 rounded-full font-medium">
                    Pro Plan
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              <Link
                href="/dashboard/properties"
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Building2 className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Properties</span>
              </Link>

              <Link
                href="/dashboard/admin"
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Shield className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Admin Panel</span>
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Settings</span>
              </Link>

              <Link
                href="/dashboard/billing"
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <CreditCard className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Billing & Usage</span>
              </Link>

              <Link
                href="/dashboard/help"
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HelpCircle className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Help</span>
              </Link>
            </div>

            {/* Sign Out */}
            <div className="p-4 border-t border-gray-200 mt-6">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 mr-4 text-gray-500" />
                <span className="text-base font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex">
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isActive('/dashboard') ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Videos */}
          <Link
            href="/dashboard/videos"
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isActive('/dashboard/videos') ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Video className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Videos</span>
          </Link>

          {/* Generate */}
          <Link
            href="/dashboard/generate"
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isActive('/dashboard/generate') ? 'text-white' : 'text-white'
            }`}
          >
            <div className="w-8 h-8 bg-[#06715b] rounded-full flex items-center justify-center mb-1">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Generate</span>
          </Link>

          {/* Assets */}
          <Link
            href="/dashboard/assets"
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isActive('/dashboard/assets') ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <FolderOpen className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Assets</span>
          </Link>

          {/* Profile */}
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isProfileOpen ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </>
  )
}