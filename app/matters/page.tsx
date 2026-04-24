'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
  client_code: string
}

interface Matter {
  id: string
  matter_number: string
  title: string
  description: string
  status: string
  client_id: string
  assigned_lawyer_id: string
  created_at: string
  clients?: { name: string }
}

export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    client_id: '',
    assigned_lawyer_id: ''
  })

  useEffect(() => {
    checkUser()
    fetchMatters()
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

  async function fetchMatters() {
    const { data, error } = await supabase
      .from('matters')
      .select(`
        *,
        clients (name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching matters:', error)
    } else {
      setMatters(data || [])
    }
    setLoading(false)
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, client_code')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
    }
  }

  async function handleCreateMatter(e: React.FormEvent) {
    e.preventDefault()
    
    const matterNumber = `MAT-${Date.now()}`
    
    const { data, error } = await supabase
      .from('matters')
      .insert([{
        ...formData,
        matter_number: matterNumber
      }])
      .select()

    if (error) {
      alert('Error creating matter: ' + error.message)
    } else {
      alert('Matter created successfully!')
      setShowModal(false)
      setFormData({
        title: '',
        description: '',
        status: 'active',
        client_id: '',
        assigned_lawyer_id: ''
      })
      fetchMatters()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMatters = matters.filter(matter =>
    matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matter.matter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matter.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <a href="/clients" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Clients</a>
                <a href="/matters" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Matters</a>
                <a href="/invoices" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Invoices</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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
              <h2 className="text-2xl font-bold text-gray-900">Matters / Cases</h2>
              <p className="text-gray-600">Manage legal matters and cases</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + New Matter
            </button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search matters by title, number, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading matters...</div>
              ) : filteredMatters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No matters found. Click "New Matter" to create one.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMatters.map((matter) => (
                      <tr key={matter.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {matter.matter_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {matter.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {matter.clients?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(matter.status)}`}>
                            {matter.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(matter.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Matter Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Matter</h2>
            <form onSubmit={handleCreateMatter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.client_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matter Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Smith vs. Johnson Property Dispute"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the case..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Create Matter
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
