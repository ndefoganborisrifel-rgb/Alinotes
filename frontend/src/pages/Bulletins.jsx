import { useState, useEffect } from 'react'
import { FileText, Printer, Search } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

function getMentionColor(mention) {
  const map = {
    'Très Bien': 'text-purple-700 bg-purple-50',
    'Bien': 'text-blue-700 bg-blue-50',
    'Assez Bien': 'text-green-700 bg-green-50',
    'Passable': 'text-yellow-700 bg-yellow-50',
    'Insuffisant': 'text-red-700 bg-red-50',
  }
  return map[mention] || 'text-gray-600 bg-gray-50'
}

export default function Bulletins() {
  const [annees, setAnnees] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState('')
  const [searchEt, setSearchEt] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/annees'), api.get('/etudiants')]).then(([a, e]) => {
      setAnnees(a.data); setEtudiants(e.data)
      const active = a.data.find(x => x.active)
      if (active) setSelectedAnnee(String(active.id))
    })
  }, [])

  const loadBulletin = async () => {
    if (!selectedEtudiant || !selectedAnnee) return
    setLoading(true)
    try {
      const r = await api.get(`/bulletins/${selectedEtudiant}`, { params: { annee_id: selectedAnnee } })
      setBulletin(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBulletin(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedEtudiant && selectedAnnee) loadBulletin()
    else setBulletin(null)
  }, [selectedEtudiant, selectedAnnee])

  const filteredEtudiants = etudiants.filter(e =>
    !searchEt || `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(searchEt.toLowerCase())
  )

  const semestresKeys = bulletin ? Object.keys(bulletin.semestres).sort() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletins de Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Relevé de notes par étudiant</p>
        </div>
        {bulletin && (
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Imprimer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Année Académique</label>
            <select className="input" value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value)}>
              <option value="">-- Année --</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Étudiant</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-8 text-sm"
                  placeholder="Rechercher étudiant..."
                  value={searchEt}
                  onChange={e => setSearchEt(e.target.value)}
                />
              </div>
              <select className="input flex-1" value={selectedEtudiant} onChange={e => setSelectedEtudiant(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {filteredEtudiants.map(e => <option key={e.id} value={e.id}>{e.matricule} — {e.prenom} {e.nom}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulletin */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : bulletin ? (
        <div id="bulletin-print" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-primary-700 pb-6">
            <h1 className="text-2xl font-bold text-primary-800">INSTITUT ALI</h1>
            <p className="text-gray-500 text-sm mt-1">Système LMD — Direction des Affaires Académiques</p>
            <h2 className="text-lg font-semibold text-gray-700 mt-4">RELEVÉ DE NOTES</h2>
            <p className="text-sm text-gray-500">Année Académique : {bulletin.inscription?.annee_libelle || selectedAnnee}</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Étudiant</p>
              <p className="font-bold text-lg text-gray-900">{bulletin.etudiant.prenom} {bulletin.etudiant.nom}</p>
              <p className="text-sm text-gray-600">Matricule: <span className="font-mono font-semibold">{bulletin.etudiant.matricule}</span></p>
              {bulletin.etudiant.date_naissance && <p className="text-sm text-gray-500">Né(e) le: {bulletin.etudiant.date_naissance}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inscription</p>
              <p className="text-sm text-gray-700">Filière: <span className="font-semibold">{bulletin.inscription?.filiere_libelle || '—'}</span></p>
              <p className="text-sm text-gray-700">Niveau: <span className="font-semibold">{bulletin.inscription?.niveau_code || '—'} — {bulletin.inscription?.niveau_libelle || '—'}</span></p>
              <p className="text-sm text-gray-700">Classe: <span className="font-semibold">{bulletin.inscription?.classe_libelle || '—'}</span></p>
            </div>
          </div>

          {/* Notes per semestre */}
          {semestresKeys.map(sem => {
            const s = bulletin.semestres[sem]
            return (
              <div key={sem} className="mb-6">
                <h3 className="text-base font-semibold text-primary-700 bg-primary-50 px-4 py-2 rounded-lg mb-3">
                  {sem === '0' ? 'Matières' : `Semestre ${sem}`}
                </h3>
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Matière</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Coeff.</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Crédits</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">CC</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Examen</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Ratt.</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Note Finale</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Mention</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Résultat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {s.notes.map((n, i) => (
                      <tr key={i} className={n.admis ? '' : 'bg-red-50'}>
                        <td className="px-4 py-2 font-medium">{n.matiere_libelle}<span className="text-gray-400 text-xs ml-1">({n.matiere_code})</span></td>
                        <td className="px-3 py-2 text-center">{n.coefficient}</td>
                        <td className="px-3 py-2 text-center">{n.credit}</td>
                        <td className="px-3 py-2 text-center">{n.note_cc !== null ? n.note_cc : '—'}</td>
                        <td className="px-3 py-2 text-center">{n.note_exam !== null ? n.note_exam : '—'}</td>
                        <td className="px-3 py-2 text-center">{n.note_rattrapage !== null ? n.note_rattrapage : '—'}</td>
                        <td className={`px-3 py-2 text-center font-bold ${n.note_finale !== null && n.note_finale >= 10 ? 'text-green-700' : n.note_finale !== null ? 'text-red-600' : 'text-gray-400'}`}>
                          {n.note_finale !== null ? n.note_finale.toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMentionColor(n.mention)}`}>{n.mention}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-semibold ${n.admis ? 'text-green-600' : 'text-red-600'}`}>
                            {n.note_finale !== null ? (n.admis ? 'Admis' : 'Ajourné') : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-4 py-2 font-semibold" colSpan={2}>Moyenne du Semestre</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500">{s.credits_valides}/{s.total_credits} cr.</td>
                      <td colSpan={4}></td>
                      <td className={`px-3 py-2 text-center font-bold text-base ${s.moyenne !== null && s.moyenne >= 10 ? 'text-green-700' : 'text-red-600'}`}>
                        {s.moyenne !== null ? s.moyenne.toFixed(2) : '—'}/20
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getMentionColor(s.mention)}`}>{s.mention}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold ${s.admis ? 'text-green-700' : 'text-red-600'}`}>
                          {s.moyenne !== null ? (s.admis ? 'Validé' : 'Non validé') : '—'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}

          {/* Summary */}
          <div className="mt-8 p-5 bg-primary-50 rounded-xl border border-primary-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Moyenne Générale</p>
                <p className={`text-2xl font-bold ${bulletin.moyenneGenerale >= 10 ? 'text-green-700' : 'text-red-600'}`}>
                  {bulletin.moyenneGenerale !== null ? bulletin.moyenneGenerale.toFixed(2) : '—'}
                  <span className="text-base font-normal text-gray-400">/20</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Mention</p>
                <p className={`text-lg font-bold ${getMentionColor(bulletin.mentionGenerale).split(' ')[0]}`}>{bulletin.mentionGenerale}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Crédits</p>
                <p className="text-lg font-bold text-gray-800">{bulletin.creditsValides}/{bulletin.totalCredits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Décision</p>
                <p className={`text-lg font-bold ${bulletin.admisGeneral ? 'text-green-700' : 'text-red-600'}`}>
                  {bulletin.moyenneGenerale !== null ? (bulletin.admisGeneral ? 'ADMIS(E)' : 'AJOURNÉ(E)') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-8">Le Chef de Département</p>
              <div className="border-b border-gray-300 w-32 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-8">Le Directeur des Études</p>
              <div className="border-b border-gray-300 w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <FileText size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sélectionnez un étudiant et une année académique</p>
          <p className="text-sm mt-1">pour générer le bulletin de notes</p>
        </div>
      )}
    </div>
  )
}
