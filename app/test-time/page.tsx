'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Matter = {
  id: string
  title: string
  matter_number: string
}

export default function TestTimePage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [selectedMatter, setSelectedMatter] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetchMatters()
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
      setResult(`Logged in as: ${user.email}`)
    }
  }

  async function fetchMatters() {
    const { data } = await supabase
      .from('matters')
      .select('id, title, matter_number')
      .limit(10)
    if (data) setMatters(data as Matter[])
  }

  async function testInsert() {
    if (!selectedMatter) {
      setResult('❌ Please select a matter')
      return
    }

    setLoading(true)
    setResult('Testing...')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setResult('❌ Not logged in')
      setLoading(false)
      return
    }
    
    setResult(`Looking for user with email: ${user.email}`)
    
    // Get user's id from users table using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (userError) {
      setResult(`❌ User lookup error: ${userError.message}`)
      setLoading(false)
      return
    }

    if (!userData) {
      setResult(`❌ User not found in users table for email: ${user.email}`)
      setLoading(false)
      return
    }

    setResult(`Found user ID: ${userData.id}`)

    const testData = {
      lawyer_id: userData.id,
      matter_id: selectedMatter,
      entry_date: new Date().toISOString().split('T')[0],
      hours: 1,
      description: 'Test entry from debug page',
      hourly_rate: 5000,
      total_amount: 5000,
      status: 'pending'
    }

    console.log('Inserting:', testData)

    const { data, error } = await supabase
      .from('time_entries')
      .insert([testData])
      .select()

    if (error) {
      setResult('❌ Error: ' + error.message)
      console.error('Error:', error)
    } else {
      setResult('✅ Success! Entry created: ' + JSON.stringify(data))
    }
    setLoading(false)
  }

  async function checkTable() {
    const { error } = await supabase
      .from('time_entries')
      .select('count')
      .limit(1)
    
    if (error) {
      setResult('Table check: ❌ ' + error.message)
    } else {
      setResult('Table check: ✅ time_entries table exists and is accessible')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🔧 Time Entry Debug Tool</h1>
        
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">Current User: <strong>{userEmail || 'Loading...'}</strong></p>
        </div>

        <div className="space-y-4">
          <div>
            <button 
              onClick={checkTable}
              className="bg-gray-600 text-white px-4 py-2 rounded mr-2"
            >
              Check Table
            </button>
          </div>

          <div>
            <label className="block font-medium mb-1">Select Matter:</label>
            <select 
              value={selectedMatter} 
              onChange={(e) => setSelectedMatter(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select a Matter --</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.matter_number})
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={testInsert}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Insert Time Entry'}
          </button>

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-mono text-sm whitespace-pre-wrap">{result}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
