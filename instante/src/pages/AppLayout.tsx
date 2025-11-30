"use client"

import { Outlet } from 'react-router-dom'
import { SidebarNav } from '../components/SidebarNav'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SidebarNav />
      <div className="flex-1 flex flex-col ml-16 md:ml-64">
        <Outlet />
      </div>
    </div>
  )
}



