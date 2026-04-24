'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [matters, setMatters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    matter_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: '',
    hourly_rate: 5000
  })

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (userData) {
      setUserId(userData.id)
      fetchEntries()
      fetchMatters()
    }
  }

  async function fetchEntries() {
    const { data } = await supabase
      .from('time_entries')
      .select(`*, matters (title)`)
      .order('entry_date', { ascending: false })
    
    if (data) setEntries(data)
    setLoading(false)
  }

  async function fetchMatters() {
    const { data } = await supabase
      .from('matters')
      .select('id, title')
      .eq('status', 'active')
    
    if (data) setMatters(data)
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.matter_id) {
      alert('Please select a matter')
      return
    }
    
    const totalAmount = formData.hours * formData.hourly_rate

    const { error } = await supabase.from('time_entries').insert({
      lawyer_id: userId,
      matter_id: formData.matter_id,
      entry_date: formData.entry_date,
      hours: formData.hours,
      description: formData.description,
      hourly_rate: formData.hourly_rate,
      total_amount: totalAmount,
      status: 'pending'
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Time entry created!')
      setShowModal(false)
      setFormData({
        matter_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        hours: 1,
        description: '',
        hourly_rate: 5000
      })
      fetchEntries()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Time & Billing</h1>
            <p className="text-gray-500">Track billable hours</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg">
            + Log Time
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Matter</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Hours</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-3">{new Date(entry.entry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{entry.matters?.title || '-'}</td>
                  <td className="px-4 py-3">{entry.description}</td>
                  <td className="px-4 py-3">{entry.hours}h</td>
                  <td className="px-4 py-3">₹{entry.total_amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                      entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log Time</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <select 
                required 
                value={formData.matter_id} 
                onChange={e => setFormData({...formData, matter_id: e.target.value})} 
                className="w-full p-2 border rounded"
              >
                <option value="">Select Matter</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
              <input type="date" value={formData.entry_date} onChange={e => setFormData({...formData, entry_date: e.target.value})} className="w-full p-2 border rounded" required />
              <input type="number" step="0.5" placeholder="Hours" value={formData.hours} onChange={e => setFormData({...formData, hours: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required />
              <input type="number" placeholder="Hourly Rate (₹)" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
              <textarea placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#c9a84c] text-black py-2 rounded">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
