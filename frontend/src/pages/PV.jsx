import { useState, useEffect } from 'react'
import { ClipboardCheck, Printer } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

function getMentionColor(note) {
  if (note === null || note === undefined) return 'text-gray-400'
  if (note >= 16) return 'text-purple-700'
  if (note >= 14) return 'text-blue-700'
  if (note >= 12) return 'text-green-700'
  if (note >= 10) return 'text-yellow-700'
  return 'text-red-600'
}

export default function PV() {
  const [annees, setAnnees] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [semestre, setSemestre] = useState('')
  const [pvData, setPvData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/annees'), api.get('/classes')]).then(([a, c]) => {
      setAnnees(a.data); setClasses(c.data)
      const active = a.data.find(x => x.active)
      if (active) setSelectedAnnee(String(active.id))
    })
  }, [])

  const loadPV = async () => {
    if (!selectedClasse || !selectedAnnee) return
    setLoading(true)
    try {
      const params = { classe_id: selectedClasse, annee_id: selectedAnnee }
      if (semestre) params.semestre = semestre
      const r = await api.get('/pv', { params })
      setPvData(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setPvData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procès-Verbaux d'Examens</h1>
          <p className="text-sm text-gray-500 mt-1">PV de délibération par classe et semestre</p>
        </div>
        {pvData && (
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Imprimer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 no-print">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Année Académique</label>
            <select className="input" value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value)}>
              <option value="">-- Année --</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Classe</label>
            <select className="input" value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)}>
              <option value="">-- Classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semestre (optionnel)</label>
            <select className="input" value={semestre} onChange={e => setSemestre(e.target.value)}>
              <option value="">Tous semestres</option>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadPV} disabled={!selectedClasse || !selectedAnnee} className="btn-primary w-full">
              Générer le PV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : pvData ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* PV Header */}
          <div className="text-center mb-8 border-b-2 border-primary-700 pb-6">
            <h1 className="text-2xl font-bold text-primary-800">INSTITUT ALI</h1>
            <p className="text-gray-500 text-sm mt-1">Système LMD — Direction des Affaires Académiques</p>
            <h2 className="text-lg font-semibold text-gray-700 mt-4">
              PROCÈS-VERBAL DE DÉLIBÉRATION
            </h2>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>Année Académique : <strong>{pvData.classe.annee_libelle}</strong></p>
              <p>Classe : <strong>{pvData.classe.libelle}</strong> | Filière : <strong>{pvData.classe.filiere_libelle}</strong> | Niveau : <strong>{pvData.classe.niveau_libelle}</strong></p>
              {pvData.semestre && <p>Semestre : <strong>{pvData.semestre}</strong></p>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Inscrits</p>
              <p className="text-xl font-bold text-gray-800">{pvData.stats.nb_etudiants}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Admis</p>
              <p className="text-xl font-bold text-green-600">{pvData.stats.nb_admis}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Ajournés</p>
              <p className="text-xl font-bold text-red-600">{pvData.stats.nb_ajournes}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Taux de réussite</p>
              <p className="text-xl font-bold text-primary-700">{pvData.stats.taux_reussite}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Moyenne classe</p>
              <p className="text-xl font-bold text-gray-700">{pvData.stats.moyenne_classe || '—'}</p>
            </div>
          </div>

          {/* PV Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-xs">
              <thead>
                <tr className="bg-primary-700 text-white">
                  <th className="px-2 py-2 text-left font-semibold">Rang</th>
                  <th className="px-2 py-2 text-left font-semibold">Matricule</th>
                  <th className="px-3 py-2 text-left font-semibold">Nom & Prénom</th>
                  {pvData.matieres.map(m => (
                    <th key={m.id} className="px-1 py-2 text-center font-semibold min-w-[60px]">
                      <div>{m.code}</div>
                      <div className="text-primary-200 text-xs">C:{m.coefficient}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold">Moyenne</th>
                  <th className="px-2 py-2 text-center font-semibold">Mention</th>
                  <th className="px-2 py-2 text-center font-semibold">Crédits</th>
                  <th className="px-2 py-2 text-center font-semibold">Décision</th>
                </tr>
              </thead>
              <tbody>
                {pvData.pv.map((ligne, i) => (
                  <tr key={ligne.etudiant.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${!ligne.admis ? 'opacity-80' : ''}`}>
                    <td className="px-2 py-1.5 font-semibold text-gray-600">{ligne.rang}</td>
                    <td className="px-2 py-1.5 font-mono">{ligne.etudiant.matricule}</td>
                    <td className="px-3 py-1.5 font-medium whitespace-nowrap">{ligne.etudiant.prenom} {ligne.etudiant.nom}</td>
                    {ligne.notes.map((n, j) => (
                      <td key={j} className={`px-1 py-1.5 text-center ${n.note_finale !== null && n.note_finale >= 10 ? 'text-green-700' : n.note_finale !== null ? 'text-red-600' : 'text-gray-400'}`}>
                        {n.note_finale !== null ? n.note_finale.toFixed(2) : '—'}
                      </td>
                    ))}
                    <td className={`px-2 py-1.5 text-center font-bold text-sm ${getMentionColor(ligne.moyenne)}`}>
                      {ligne.moyenne !== null ? ligne.moyenne.toFixed(2) : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs">{ligne.mention}</td>
                    <td className="px-2 py-1.5 text-center">{ligne.creditsValides}/{ligne.totalCredits}</td>
                    <td className={`px-2 py-1.5 text-center font-bold text-xs ${ligne.admis ? 'text-green-700' : 'text-red-600'}`}>
                      {ligne.moyenne !== null ? (ligne.admis ? 'ADMIS' : 'AJOURNÉ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matieres legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">Légende des matières :</p>
            <div className="flex flex-wrap gap-3">
              {pvData.matieres.map(m => (
                <span key={m.id} className="text-xs text-gray-600">
                  <strong>{m.code}</strong>: {m.libelle} (Coeff. {m.coefficient}, {m.credit} cr.)
                </span>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-10 grid grid-cols-3 gap-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-8">Le Président du Jury</p>
              <div className="border-b border-gray-400 w-32 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-1">Signature</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-8">Le Chef de Département</p>
              <div className="border-b border-gray-400 w-32 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-1">Signature</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-8">Le Directeur des Études</p>
              <div className="border-b border-gray-400 w-32 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-1">Signature</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <ClipboardCheck size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sélectionnez une classe et une année académique</p>
          <p className="text-sm mt-1">puis cliquez sur "Générer le PV" pour afficher le procès-verbal</p>
        </div>
      )}
    </div>
  )
}
