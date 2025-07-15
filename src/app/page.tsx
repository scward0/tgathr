'use client'

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (!user) {
    // Not logged in - show landing page
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <h1 className="text-4xl font-bold tracking-tight mb-8 text-white">tgathr</h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-md">
          Group coordination made simple
        </p>
        <div className="space-x-4">
          <Link 
            href="/auth"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth"
            className="px-6 py-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </main>
    );
  }

  // Logged in - show dashboard
  return (
    <main className="min-h-screen bg-gray-900">
      <nav className="flex justify-between items-center p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">tgathr</h1>
        <UserMenu />
      </nav>
      
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Welcome, {user.name}!</h2>
        <p className="text-gray-300 mb-8">Ready to organize your next event?</p>
        <Link 
          href="/events/new"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Event
        </Link>
      </div>
    </main>
  );
}