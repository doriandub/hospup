'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Sidebar, MobileMenuButton } from '@/components/dashboard/sidebar'
import { UserMenu } from '@/components/dashboard/user-menu'
import { useAuth } from '@/hooks/useAuth'

// Function to get page title from pathname
function getPageTitle(pathname: string): string {
  const routes: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/dashboard/properties': 'Properties',
    '/dashboard/videos': 'Videos',
    '/dashboard/generate': 'AI Generator',
    '/dashboard/content-library': 'Content Library',
    '/dashboard/viral-inspiration': 'Viral Inspiration'
  }
  
  // Check for exact matches first
  if (routes[pathname]) {
    return routes[pathname]
  }
  
  // Check for partial matches (for dynamic routes)
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route + '/')) {
      return title
    }
  }
  
  return 'Dashboard'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      <Sidebar 
        isMobileOpen={sidebarOpen} 
        setIsMobileOpen={setSidebarOpen} 
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile header */}
        <div className="lg:hidden bg-gray-50" style={{ height: '80px' }}>
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Inter' }}>
                {pageTitle}
              </div>
            </div>
            <div className="flex items-center">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block bg-gray-50" style={{ height: '80px' }}>
          <div className="px-8 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Inter' }}>
                  {pageTitle}
                </h1>
              </div>
              <div className="pr-8 flex items-center">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}