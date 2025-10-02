'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Video,
  Stars,
  FolderOpen,
  Menu,
  X,
  Plus,
  HelpCircle,
  Zap,
  Building2
} from 'lucide-react'
import { UserMenu } from './user-menu'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}

const navigation: NavItem[] = [
  {
    name: "Generate",
    href: "/dashboard/generate",
    icon: Zap
  },
  {
    name: "Home",
    href: "/dashboard",
    icon: Home
  },
  {
    name: "Videos",
    href: "/dashboard/videos",
    icon: Video
  },
  {
    name: "Assets",
    href: "/dashboard/assets",
    icon: FolderOpen
  },
  {
    name: "Properties",
    href: "/dashboard/properties",
    icon: Building2
  },
]

interface SidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  isDesktopOpen?: boolean
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, isDesktopOpen = true }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
<div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300
        fixed inset-y-0 left-0 z-50 w-64 transform
        md:static md:w-20 md:z-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDesktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 md:w-8 md:h-8 bg-[#09725c] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-sm">H</span>
              </div>
              <div className="md:hidden ml-3">
                <span className="text-xl font-bold text-gray-900">Hospup</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden absolute right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-2 overflow-y-auto px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className={`flex flex-col items-center text-center rounded-lg transition-colors relative ${
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } md:px-2 md:py-3 px-4 py-3`}
                  onClick={() => setIsMobileOpen(false)}
                  title={item.name}
                >

                  {/* Desktop/Tablet: Icon + Label below */}
                  <div className="md:flex md:flex-col md:items-center md:space-y-1 hidden">
                    {item.name === "Generate" ? (
                      <div className="w-8 h-8 bg-[#06715b] rounded-full flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <item.icon className={`h-5 w-5 ${
                        isActive ? 'text-primary' : 'text-gray-500'
                      }`} />
                    )}
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>

                  {/* Mobile: Icon + Label side by side */}
                  <div className="md:hidden flex items-center space-x-3">
                    {item.name === "Generate" ? (
                      <div className="w-8 h-8 bg-[#06715b] rounded-full flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <item.icon className={`h-6 w-6 ${
                        isActive ? 'text-primary' : 'text-gray-500'
                      }`} />
                    )}
                    <span className="text-base font-medium">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Section - User Menu */}
          <div className="p-3 border-t border-gray-200">
            <UserMenu />
          </div>

        </div>
      </div>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 transition-all duration-200"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}