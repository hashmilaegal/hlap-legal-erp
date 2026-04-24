'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  UsersIcon, 
  ScaleIcon, 
  DocumentTextIcon, 
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeMatters: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchStats()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
    }
  }

  async function fetchStats() {
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: activeMatters } = await supabase
      .from('matters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { data: invoices, count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || inv.total_amount || 0), 0) || 0
    const pendingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'partial').length || 0

    setStats({
      totalClients: clientCount || 0,
      activeMatters: activeMatters || 0,
      totalInvoices: invoiceCount || 0,
      totalRevenue: totalRevenue,
      pendingInvoices: pendingInvoices,
    })
    setLoading(false)
  }

  const statCards = [
    { title: 'Total Clients', value: stats.totalClients, icon: UsersIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
    { title: 'Active Matters', value: stats.activeMatters, icon: ScaleIcon, bg: 'bg-purple-50', color: 'text-purple-600' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: CurrencyRupeeIcon, bg: 'bg-green-50', color: 'text-green-600' },
    { title: 'Pending Invoices', value: stats.pendingInvoices, icon: DocumentTextIcon, bg: 'bg-orange-50', color: 'text-orange-600' },
  ]

  if (!user) return null
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to HLAPL Enterprise ERP Suite</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="/clients" className="bg-[#c9a84c] text-black text-center px-6 py-3 rounded-lg hover:bg-[#d4a017] transition-all duration-300 font-medium shadow-sm">+ Add New Client</a>
            <a href="/matters" className="bg-gray-800 text-white text-center px-6 py-3 rounded-lg hover:bg-gray-900 transition-all duration-300 font-medium shadow-sm">+ Create New Matter</a>
            <a href="/invoices" className="bg-[#c9a84c] text-black text-center px-6 py-3 rounded-lg hover:bg-[#d4a017] transition-all duration-300 font-medium shadow-sm">+ Generate Invoice</a>
            <a href="/time-entries" className="bg-gray-800 text-white text-center px-6 py-3 rounded-lg hover:bg-gray-900 transition-all duration-300 font-medium shadow-sm">+ Log Time</a>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
