'use client'

import React, { useState, ReactNode, createContext, useContext } from 'react'

interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined)

interface DropdownMenuProps {
  children: ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: ReactNode
}

interface DropdownMenuContentProps {
  align?: 'start' | 'end' | 'center'
  children: ReactNode
}

interface DropdownMenuItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const context = useContext(DropdownContext)
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  
  const { isOpen, setIsOpen } = context
  
  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      {children}
    </div>
  )
}

export function DropdownMenuContent({ align = 'start', children }: DropdownMenuContentProps) {
  const context = useContext(DropdownContext)
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu')
  
  const { isOpen, setIsOpen } = context
  
  if (!isOpen) return null
  
  const alignmentClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'left-0'
  
  return (
    <>
      <div 
        className="fixed inset-0 z-10" 
        onClick={() => setIsOpen(false)}
      />
      <div className={`absolute z-20 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg ${alignmentClass}`}>
        <div className="py-1">
          {children}
        </div>
      </div>
    </>
  )
}

export function DropdownMenuItem({ children, className = '', onClick }: DropdownMenuItemProps) {
  const context = useContext(DropdownContext)
  const handleClick = () => {
    onClick?.()
    context?.setIsOpen(false)
  }
  
  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-gray-100 my-1" />
}