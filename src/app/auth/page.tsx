'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      let success
      if (isLogin) {
        success = await login(formData.email, formData.password)
      } else {
        success = await register(formData.name, formData.email, formData.password)
      }
      
      if (success) {
        router.push('/')
        router.refresh()
      } else {
        setError(isLogin ? 'Invalid credentials' : 'Registration failed')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl mb-6 text-white text-center">
          {isLogin ? 'Login' : 'Create Account'}
        </h1>
        
        {!isLogin && (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="border border-gray-600 bg-gray-700 text-white p-3 rounded mb-4 w-full"
            placeholder="Full name"
            required
          />
        )}
        
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="border border-gray-600 bg-gray-700 text-white p-3 rounded mb-4 w-full"
          placeholder="Email address"
          required
        />
        
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="border border-gray-600 bg-gray-700 text-white p-3 rounded mb-4 w-full"
          placeholder="Password (min 6 characters)"
          minLength={6}
          required
        />
        
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-3 rounded w-full font-medium"
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
        </button>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setFormData({ name: '', email: '', password: '' })
            }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </form>
    </div>
  )
} 