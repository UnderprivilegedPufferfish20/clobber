'use client'

import React from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

const SignUpButton = () => {
  const { signIn, user, loading } = useAuth()

  return (
    <button
      onClick={signIn}
      className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
      Get Started
    </button>
  )
}

export default SignUpButton