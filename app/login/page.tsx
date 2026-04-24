'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

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
      <div className="relative z-10 bg-white/98 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#c9a84c] to-[#8b6914] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">HL</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HLAPL</h1>
          <p className="text-sm text-gray-600 mt-1">Hashmi Law Associates Pvt. Ltd.</p>
          <p className="text-xs text-gray-500 mt-1">Est. 2022 | New Delhi · India</p>
          <p className="text-xs text-gray-400 mt-3">Enterprise Legal ERP Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent bg-gray-50"
              placeholder="admin@hlapl.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent bg-gray-50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a84c] text-black px-6 py-3 rounded-lg hover:bg-[#e8d5a3] transition-all duration-300 font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Contact Info on Login Page */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <PhoneIcon className="h-3 w-3 text-[#c9a84c]" />
              <span>+91 11 41040055</span>
            </div>
            <div className="flex items-center gap-1">
              <EnvelopeIcon className="h-3 w-3 text-[#c9a84c]" />
              <span>info@hlapl.com</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3">
            © {new Date().getFullYear()} Hashmi Law Associates Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
