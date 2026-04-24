'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ScaleIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0d1b2a] to-[#0a0a0a]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.05"%3E%3Cpath fill="%23c9a84c" d="M50 0L61.8 35.5L100 35.5L69.1 57.5L80.9 93L50 71L19.1 93L30.9 57.5L0 35.5L38.2 35.5L50 0z"%3E%3C/path%3E%3C/svg%3E')] bg-repeat bg-[length:60px]" />
      <div className="relative z-10 bg-white/98 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-[#c9a84c] to-[#8b6914] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ScaleIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">HLAPL</h1>
          <p className="text-gray-500 mt-1">Hashmi Law Associates Pvt. Ltd.</p>
          <p className="text-xs text-gray-400 mt-2">Enterprise Legal ERP Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@hlapl.com"
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Internal Use Only</p>
          <p className="text-xs mt-1">© {new Date().getFullYear()} Hashmi Law Associates Pvt. Ltd.</p>
          <p className="text-xs text-gray-400 mt-2">New Delhi · India · Global</p>
        </div>
      </div>
    </div>
  )
}
