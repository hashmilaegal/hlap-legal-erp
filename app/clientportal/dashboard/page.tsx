'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [clientName, setClientName] = useState('')
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/clientportal/login')
    else {
      setUser(user)
      const { data } = await supabase.from('clients').select('name').eq('email', user.email).single()
      if (data) setClientName(data.name)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/clientportal/login')
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-xl font-bold">Client Portal</h1>
        <button onClick={handleLogout} className="text-red-600">Logout</button>
      </div>
      <div className="p-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Welcome {clientName || user.email}!</h2>
          <p>Client portal is working. You are logged in successfully!</p>
        </div>
      </div>
    </div>
  )
}
