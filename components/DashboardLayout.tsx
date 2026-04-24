'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyRupeeIcon,
  ScaleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, color: 'text-blue-600' },
  { name: 'Clients', href: '/clients', icon: UsersIcon, color: 'text-green-600' },
  { name: 'Matters', href: '/matters', icon: ScaleIcon, color: 'text-purple-600' },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, color: 'text-orange-600' },
  { name: 'Time Tracking', href: '/time-entries', icon: ClockIcon, color: 'text-teal-600' },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, color: 'text-red-600' },
  { name: 'Trust Account', href: '/trust', icon: CurrencyRupeeIcon, color: 'text-emerald-600' },
  { name: 'Documents', href: '/documents', icon: FolderIcon, color: 'text-indigo-600' },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, color: 'text-gray-600' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 shadow-xl">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="logo-text text-2xl">HLAP LEGAL</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-2">
                      <li>
                        <ul role="list" className="space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                              >
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                                <span className="text-sm font-medium">{item.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="-mx-6 mt-auto">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg border-r border-gray-100">
          <div className="flex h-16 shrink-0 items-center">
            <div>
              <h1 className="logo-text text-2xl">HLAP LEGAL</h1>
              <p className="text-xs text-gray-500 mt-0.5">Enterprise ERP Suite</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              <li>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-red-600 hover:bg-red-50 transition-all duration-200 w-full rounded-lg"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {/* Welcome message */}
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-sm font-semibold text-gray-900">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#2c4a7a] flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
