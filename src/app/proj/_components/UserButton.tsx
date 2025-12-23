'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Settings, User, LogOut, Loader2Icon } from 'lucide-react'
import { redirect } from 'next/navigation'
import Loader from '@/components/Loader'
import Image from 'next/image'

const UserButton = () => {
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) return <Loader sz={40}/>
  if (!user) return null;

  console.log("@@USER BUTTON - user: ", user)

  const handleMenuClick = (action: string) => {
    setIsOpen(false)
    
    switch(action) {
      case 'settings':
        // Handle settings navigation

        break
      case 'account':
        // Handle account navigation

        break
      case 'logout':
        // Handle logout
        signOut()
        break
    }
  }

  return (
    <div className="relative mt-1.5" ref={dropdownRef}>
      {/* Profile Picture Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative w-10 h-10 rounded-full overflow-hidden
          transition-all duration-200 ease-out
          hover:ring-2 hover:ring-primary/30 hover:ring-offset-2
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        "
      >
        <Image
          src={user.pfpUrl || ""}
          width={24}
          height={24}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute right-0 top-12 z-50
          w-48 bg-white dark:bg-gray-800
          rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          py-2
          animate-in fade-in-0 zoom-in-95 duration-200
          origin-top-right
        ">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => handleMenuClick('account')}
              className="
                w-full flex items-center gap-3 px-4 py-2 text-left
                text-sm text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-150
              "
            >
              <User size={16} />
              Account
            </button>

            <button
              onClick={() => handleMenuClick('settings')}
              className="
                w-full flex items-center gap-3 px-4 py-2 text-left
                text-sm text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-150
              "
            >
              <Settings size={16} />
              Settings
            </button>

            <hr className="my-1 border-gray-200 dark:border-gray-700" />

            <button
              onClick={() => handleMenuClick('logout')}
              className="
                w-full flex items-center gap-3 px-4 py-2 text-left
                text-sm text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                transition-colors duration-150
              "
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserButton