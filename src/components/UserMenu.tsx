'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-gray-300 focus:outline-none"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="font-medium">{user.name}</div>
            <div className="text-gray-400">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}