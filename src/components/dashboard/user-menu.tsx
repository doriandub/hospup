'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Settings,
  CreditCard,
  Shield,
  LogOut,
  ChevronDown,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Logout error handled silently
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col md:flex-col items-center md:items-center space-y-1 md:space-y-1 md:space-x-0 space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-all duration-200"
      >
        {/* Desktop/Tablet: Icon + Label below */}
        <div className="md:flex md:flex-col md:items-center md:space-y-1 hidden">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-medium">{user?.email?.split('@')[0] || 'User'}</span>
        </div>

        {/* Mobile: Icon + Label side by side */}
        <div className="md:hidden flex items-center space-x-2 w-full">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">{user?.email?.split('@')[0] || 'User'}</span>
          <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user?.email}
                  </p>
                  <span className="text-xs text-primary capitalize font-medium">
                    Pro Plan
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/dashboard/admin"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4 mr-3 text-gray-500" />
                Admin Panel
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4 mr-3 text-gray-500" />
                Settings
              </Link>

              <Link
                href="/dashboard/billing"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
                Billing & Usage
              </Link>

              <Link
                href="/dashboard/help"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                Help
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3 text-gray-500" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}