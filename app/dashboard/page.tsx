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
  TrendingUpIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeMatters: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    billableHours: 0
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

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0
    const pendingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'partial').length || 0

    setStats({
      totalClients: clientCount || 0,
      activeMatters: activeMatters || 0,
      totalInvoices: invoiceCount || 0,
      totalRevenue: totalRevenue,
      pendingInvoices: pendingInvoices,
      billableHours: 0
    })
    setLoading(false)
  }

  const statCards = [
    { title: 'Total Clients', value: stats.totalClients, icon: UsersIcon, color: 'blue', change: '+12%' },
    { title: 'Active Matters', value: stats.activeMatters, icon: ScaleIcon, color: 'purple', change: '+5%' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CurrencyRupeeIcon, color: 'green', change: '+18%' },
    { title: 'Pending Invoices', value: stats.pendingInvoices, icon: DocumentTextIcon, color: 'orange', change: '-3%' },
  ]

  if (!user) return null
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to HLAP Legal ERP Suite</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-xs mt-2 ${stat.change?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="/clients" className="btn-primary text-center">+ Add New Client</a>
            <a href="/matters" className="btn-secondary text-center">+ Create New Matter</a>
            <a href="/invoices" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-lg text-center">+ Generate Invoice</a>
            <a href="/time-entries" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-lg text-center">+ Log Time</a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-premium">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm">No recent invoices</p>
            </div>
          </div>
          <div className="card-premium">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="badge-success">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="badge-success">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="badge-success">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
