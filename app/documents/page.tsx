'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  PlusIcon,
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  document_number: string
  title: string
  description: string
  category_id: string
  client_id: string
  matter_id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  version: number
  is_confidential: boolean
  tags: string[]
  upload_date: string
  document_categories?: { name: string; color: string }
  clients?: { name: string }
  matters?: { title: string }
}

interface Category {
  id: string
  name: string
  color: string
}

interface Client {
  id: string
  name: string
}

interface Matter {
  id: string
  title: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [user, setUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    client_id: '',
    matter_id: '',
    is_confidential: false,
    tags: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      fetchDocuments()
      fetchCategories()
      fetchClients()
      fetchMatters()
    }
  }

  async function fetchDocuments() {
    let query = supabase
      .from('documents')
      .select(`
        *,
        document_categories (name, color),
        clients (name),
        matters (title)
      `)
      .order('upload_date', { ascending: false })

    const { data } = await query
    if (data) setDocuments(data)
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('document_categories')
      .select('*')
      .eq('is_active', true)
    if (data) setCategories(data)
  }

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .limit(100)
    if (data) setClients(data)
  }

  async function fetchMatters() {
    const { data } = await supabase
      .from('matters')
      .select('id, title')
      .eq('status', 'active')
      .limit(100)
    if (data) setMatters(data)
  }

  async function handleFileUpload() {
    if (!selectedFile) {
      alert('Please select a file')
      return null
    }

    setUploading(true)
    
    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, selectedFile)

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    setUploading(false)
    return publicUrl
  }

  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    const fileUrl = await handleFileUpload()
    if (!fileUrl) return

    const documentNumber = `DOC-${Date.now()}`
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

    // Get user's auth_id
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user?.email)
      .single()

    const insertData: any = {
      document_number: documentNumber,
      title: formData.title,
      description: formData.description,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      file_type: selectedFile.type,
      file_url: fileUrl,
      is_confidential: formData.is_confidential,
      version: 1
    }

    // Only add optional fields if they have values
    if (formData.category_id) insertData.category_id = formData.category_id
    if (formData.client_id) insertData.client_id = formData.client_id
    if (formData.matter_id) insertData.matter_id = formData.matter_id
    if (tagsArray.length) insertData.tags = tagsArray
    if (userData?.id) insertData.uploaded_by = userData.id

    console.log('Inserting document:', insertData)

    const { error } = await supabase
      .from('documents')
      .insert([insertData])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Document uploaded successfully!')
      setShowModal(false)
      setFormData({
        title: '',
        description: '',
        category_id: '',
        client_id: '',
        matter_id: '',
        is_confidential: false,
        tags: ''
      })
      setSelectedFile(null)
      fetchDocuments()
    }
  }

  async function handleDeleteDocument(id: string, fileUrl: string) {
    if (!confirm('Are you sure you want to delete this document?')) return

    // Extract file path from URL
    const filePath = fileUrl.split('/').slice(-2).join('/')
    
    // Delete from storage
    await supabase.storage.from('documents').remove([filePath])
    
    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Document deleted!')
      fetchDocuments()
    }
  }

  function formatFileSize(bytes: number) {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || doc.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-500">Upload and manage legal documents</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusIcon className="h-5 w-5" /> Upload Document
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c9a84c]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c9a84c]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-[#c9a84c]" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <FolderIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documents.reduce((s, d) => s + (d.file_size || 0), 0))}
                </p>
              </div>
              <FolderIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-8 text-gray-500">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">No documents found. Upload your first document!</div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-8 w-8 text-[#c9a84c]" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.document_number}</p>
                      </div>
                    </div>
                    {doc.document_categories && (
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: doc.document_categories.color }}
                      >
                        {doc.document_categories.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{doc.description || 'No description'}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[150px]">{doc.file_name}</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                  {doc.clients && (
                    <p className="text-xs text-gray-500">Client: {doc.clients.name}</p>
                  )}
                  {doc.matters && (
                    <p className="text-xs text-gray-500">Matter: {doc.matters.title}</p>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-xs text-gray-400">{new Date(doc.upload_date).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        <EyeIcon className="h-5 w-5" />
                      </a>
                      <a href={doc.file_url} download className="text-green-600 hover:text-green-800">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </a>
                      <button onClick={() => handleDeleteDocument(doc.id, doc.file_url)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">File *</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client (Optional)</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => {
                    setFormData({...formData, client_id: e.target.value, matter_id: ''})
                    // Fetch matters for selected client
                    if (e.target.value) {
                      supabase
                        .from('matters')
                        .select('id, title')
                        .eq('client_id', e.target.value)
                        .eq('status', 'active')
                        .then(({ data }) => setMatters(data || []))
                    } else {
                      fetchMatters()
                    }
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Matter (Optional)</label>
                <select
                  value={formData.matter_id}
                  onChange={(e) => setFormData({...formData, matter_id: e.target.value})}
                  className="w-full p-2 border rounded"
                  disabled={!formData.client_id}
                >
                  <option value="">Select Matter</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="contract, urgent, signed"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_confidential}
                  onChange={(e) => setFormData({...formData, is_confidential: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm font-medium">Confidential Document</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="flex-1 bg-[#c9a84c] text-black py-2 rounded hover:bg-[#d4a017] disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
