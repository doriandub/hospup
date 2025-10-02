'use client'

import { usePathname } from 'next/navigation'
import { Sidebar, MobileMenuButton } from '@/components/dashboard/sidebar'
import { BottomTabBar } from '@/components/dashboard/bottom-tab-bar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

// Function to get page title from pathname
function getPageTitle(pathname: string): string {
  const routes: { [key: string]: string } = {
    '/dashboard': '',
    '/dashboard/properties': 'Properties',
    '/dashboard/videos': 'Videos',
    '/dashboard/generate': 'Generate',
    '/dashboard/assets': 'Assets',
    '/dashboard/help': 'Help',
    '/dashboard/settings': 'Settings',
    '/dashboard/billing': 'Billing & Usage',
    '/dashboard/admin': 'Admin Panel'
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

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Only render sidebar when open */}
      {sidebarOpen && (
        <>
          <Sidebar
            isMobileOpen={sidebarOpen}
            setIsMobileOpen={setSidebarOpen}
            isDesktopOpen={sidebarOpen}
          />
          {/* Gray divider line at green header height */}
          <div className="absolute left-20 top-0 w-px h-16 bg-gray-300 z-40 hidden md:block" />
        </>
      )}

      {/* Main content area - takes full width when sidebar is closed */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile menu button - floating */}
        <div className="md:hidden absolute top-4 left-4 z-20">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom Tab Bar for Mobile */}
      <BottomTabBar />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </ProtectedRoute>
  )
}