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
  ScaleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyRupeeIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Matters', href: '/matters', icon: ScaleIcon },
  { name: 'Time & Billing', href: '/time-entries', icon: ClockIcon },
  { name: 'Expenses', href: '/expenses', icon: CurrencyRupeeIcon },
  { name: 'Documents', href: '/documents', icon: FolderIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
                  <div className="flex h-auto py-4 flex-col justify-center border-b border-gray-100 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">HLAPL</h1>
                    <p className="text-xs text-gray-600 font-medium">Hashmi Law Associates</p>
                    <p className="text-[11px] text-gray-500">Pvt. Ltd.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-px w-6 bg-[#c9a84c]"></div>
                      <p className="text-[10px] text-gray-500">Est. 2022</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Contact</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-3 w-3 text-[#c9a84c]" />
                        <p className="text-[11px] text-gray-600">+91 11 41040055</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-3 w-3 text-[#c9a84c]" />
                        <p className="text-[10px] text-gray-600">info@hlapl.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                  pathname === item.href
                                    ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                                    : 'text-gray-700 hover:text-[#c9a84c] hover:bg-gray-50'
                                }`}
                              >
                                <item.icon className="h-6 w-6 shrink-0" />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="-mx-6 mt-auto pt-4 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-red-600 hover:bg-red-50 w-full rounded-lg"
                        >
                          <ArrowRightOnRectangleIcon className="h-6 w-6" />
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 shadow-lg">
          <div className="flex h-auto py-6 flex-col justify-center border-b border-gray-100 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">HLAPL</h1>
            <p className="text-xs text-gray-600 font-medium mt-1">Hashmi Law Associates</p>
            <p className="text-[11px] text-gray-500">Pvt. Ltd.</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-8 bg-[#c9a84c]"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. 2022</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 mb-4 border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="h-px w-4 bg-[#c9a84c]"></div>
              Contact Information
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-4 w-4 text-[#c9a84c] mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-500">Landline</p>
                  <p className="text-sm font-medium text-gray-800">+91 11 41040055</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="h-4 w-4 text-[#c9a84c] mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-500">Email</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-700">info@hlapl.com</p>
                    <p className="text-xs text-gray-700">admin@hlapl.com</p>
                    <p className="text-xs text-gray-700">accounts@hlapl.com</p>
                    <p className="text-xs text-gray-700">hr@hlapl.com</p>
                  </div>
                </div>
              </div>
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-r-4 border-[#c9a84c]'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-[#c9a84c]'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
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
      <div className="lg:pl-80">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Welcome back</p>
                <p className="text-sm font-semibold text-gray-900">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#c9a84c] to-[#8b6914] flex items-center justify-center text-white text-sm font-bold">
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
