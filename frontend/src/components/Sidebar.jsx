import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCog, Building2, BookOpen,
  GraduationCap, ClipboardList, FileText, Calendar, Layers, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/annees', label: 'Années Académiques', icon: Calendar },
  { to: '/filieres', label: 'Filières', icon: Layers },
  { to: '/niveaux', label: 'Niveaux', icon: GraduationCap },
  { to: '/classes', label: 'Classes', icon: Building2 },
  { to: '/etudiants', label: 'Étudiants', icon: Users },
  { to: '/enseignants', label: 'Enseignants', icon: UserCog },
  { to: '/matieres', label: 'Matières / UE', icon: BookOpen },
  { to: '/notes', label: 'Saisie des Notes', icon: ClipboardList },
  { to: '/bulletins', label: 'Bulletins', icon: FileText },
  { to: '/pv', label: 'Procès-Verbaux', icon: FileText },
]

export default function Sidebar({ isOpen }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-primary-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-800">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold text-sm">A</div>
        {isOpen && <span className="font-semibold text-sm leading-tight">Institut Ali<br /><span className="text-primary-300 text-xs font-normal">Gestion Scolaire</span></span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                isActive ? 'bg-primary-700 text-white font-medium' : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {isOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
