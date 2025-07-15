'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      // Get token from localStorage as fallback
      const token = localStorage.getItem('auth-token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const requestBody = { action: 'login', email, password }
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store token in localStorage as fallback for cookie issues
        if (data.token) {
          localStorage.setItem('auth-token', data.token)
        }
        
        setUser(data.user)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login network error:', error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const requestBody = { action: 'register', name, email, password }
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Register network error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}