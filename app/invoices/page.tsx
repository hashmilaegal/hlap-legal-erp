'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvoicesPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">HLAP Legal ERP</h1>
              <div className="space-x-4">
                <a href="/dashboard" className="text-sm text-gray-700">Dashboard</a>
                <a href="/clients" className="text-sm text-gray-700">Clients</a>
                <a href="/matters" className="text-sm text-gray-700">Matters</a>
                <a href="/invoices" className="text-sm text-blue-600 font-bold">Invoices</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">{user.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-600">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Invoices Module</h2>
          <p className="text-gray-600 mb-4">Invoice management is being set up.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">✓ Page is loading correctly</p>
            <p className="text-yellow-800">✓ Authentication is working</p>
            <p className="text-yellow-800">✓ Navigation is working</p>
          </div>
        </div>
      </div>
    </div>
  )
}
