import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, LogOut, User } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={16} />
              <span>{user?.prenom} {user?.nom}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
