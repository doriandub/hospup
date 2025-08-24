'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  LogOut,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-all duration-200"
      >
        <div className="w-7 h-7 bg-gradient-to-tl from-[#115446] to-[#138a73] rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium" style={{ fontFamily: 'Inter' }}>{user?.name || 'User'}</span>
        <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#115446] rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || 'Demo User'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user?.email || 'demo@hospup.com'}
                  </p>
                  <span className="text-xs text-[#ff914d] capitalize font-medium">
                    {user?.plan || 'Free'} Plan
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
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
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