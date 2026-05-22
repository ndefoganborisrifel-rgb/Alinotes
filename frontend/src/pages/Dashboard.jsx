import { useState, useEffect } from 'react'
import { Users, UserCog, Building2, BookOpen, GraduationCap, ClipboardList } from 'lucide-react'
import api from '../api/axios'

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        {data?.anneeActive && (
          <p className="text-sm text-gray-500 mt-1">Année académique active : <span className="font-medium text-primary-700">{data.anneeActive.libelle}</span></p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Étudiants" value={data?.stats.etudiants || 0} icon={Users} color="bg-blue-500" />
        <StatCard label="Enseignants" value={data?.stats.enseignants || 0} icon={UserCog} color="bg-emerald-500" />
        <StatCard label="Classes" value={data?.stats.classes || 0} icon={Building2} color="bg-violet-500" />
        <StatCard label="Filières" value={data?.stats.filieres || 0} icon={GraduationCap} color="bg-orange-500" />
        <StatCard label="Matières / UE" value={data?.stats.matieres || 0} icon={BookOpen} color="bg-pink-500" />
        <StatCard label="Inscriptions" value={data?.stats.inscriptions || 0} icon={ClipboardList} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Derniers étudiants inscrits</h2>
          {data?.recentEtudiants?.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun étudiant</p>
          ) : (
            <ul className="space-y-3">
              {data?.recentEtudiants?.map(e => (
                <li key={e.matricule} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                    {e.prenom[0]}{e.nom[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{e.prenom} {e.nom}</p>
                    <p className="text-gray-400">{e.matricule}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Classes par niveau</h2>
          {data?.classesByNiveau?.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune classe</p>
          ) : (
            <ul className="space-y-2">
              {data?.classesByNiveau?.map(c => (
                <li key={c.niveau} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{c.niveau}</span>
                  <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{c.nb_classes} classe(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
