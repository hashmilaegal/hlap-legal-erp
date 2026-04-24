'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  client_code: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  gst_number: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    gst_number: ''
  })

  useEffect(() => {
    checkUser()
    fetchClients()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser(user)
    }
  }

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error('Error fetching clients:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    
    const clientCode = `CLT-${Date.now()}`
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          client_code: clientCode,
          name: formData.name,
          type: formData.type,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gst_number: formData.gst_number
        }])
        .select()

      if (error) throw error
      
      alert('Client created successfully!')
      setShowModal(false)
      setFormData({
        name: '',
        type: 'individual',
        email: '',
        phone: '',
        address: '',
        gst_number: ''
      })
      fetchClients()
    } catch (error: any) {
      setErrorMsg(error.message)
      alert('Error: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">HLAP Legal ERP</h1>
              <div className="hidden md:flex space-x-4">
                <a href="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Dashboard</a>
                <a href="/clients" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Clients</a>
                <a href="/matters" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Matters</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
              <p className="text-gray-600">Manage your client database</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Client
            </button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading clients...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No clients found. Click "+ Add Client" to create one.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{client.client_code}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{client.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{client.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{client.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            {errorMsg && <p className="text-red-600 text-sm mb-3">{errorMsg}</p>}
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                  <option value="government">Government</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Create Client
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
