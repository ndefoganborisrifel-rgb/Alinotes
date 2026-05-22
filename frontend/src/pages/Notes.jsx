import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, ClipboardList } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

function getMention(note) {
  if (note === null || note === undefined) return '—'
  if (note >= 16) return 'Très Bien'
  if (note >= 14) return 'Bien'
  if (note >= 12) return 'Assez Bien'
  if (note >= 10) return 'Passable'
  return 'Insuff.'
}

function noteColor(note) {
  if (note === null || note === undefined) return 'text-gray-400'
  if (note >= 10) return 'text-green-700 font-semibold'
  return 'text-red-600 font-semibold'
}

export default function Notes() {
  const [annees, setAnnees] = useState([])
  const [classes, setClasses] = useState([])
  const [matieres, setMatieres] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [notesData, setNotesData] = useState({})

  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedMatiere, setSelectedMatiere] = useState('')
  const [semestre, setSemestre] = useState('')

  const [localNotes, setLocalNotes] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/annees'), api.get('/classes')]).then(([a, c]) => {
      setAnnees(a.data); setClasses(c.data)
      const active = a.data.find(x => x.active)
      if (active) setSelectedAnnee(String(active.id))
    })
  }, [])

  // Load matieres when classe changes
  useEffect(() => {
    if (!selectedClasse) { setMatieres([]); return }
    const cls = classes.find(c => String(c.id) === String(selectedClasse))
    if (cls?.niveau_id) {
      const params = { niveau_id: cls.niveau_id }
      if (semestre) params.semestre = semestre
      api.get('/matieres', { params }).then(r => setMatieres(r.data))
    }
  }, [selectedClasse, semestre, classes])

  // Load notes data (students + notes for selected matiere)
  useEffect(() => {
    if (!selectedClasse || !selectedMatiere || !selectedAnnee) {
      setEtudiants([]); setNotesData({}); setLocalNotes({})
      return
    }
    setLoading(true)
    Promise.all([
      api.get(`/notes/classe/${selectedClasse}`, { params: { annee_id: selectedAnnee, semestre: semestre || undefined } }),
    ]).then(([r]) => {
      const { etudiants: ets, notesMap } = r.data
      setEtudiants(ets)
      setNotesData(notesMap)
      // Initialize local notes from existing data
      const init = {}
      ets.forEach(e => {
        const key = `${e.id}_${selectedMatiere}`
        const existing = notesMap[key]
        init[e.id] = {
          note_cc: existing?.note_cc ?? '',
          note_exam: existing?.note_exam ?? '',
          note_rattrapage: existing?.note_rattrapage ?? '',
        }
      })
      setLocalNotes(init)
    }).finally(() => setLoading(false))
  }, [selectedClasse, selectedMatiere, selectedAnnee])

  const handleNoteChange = (etudiantId, field, value) => {
    setLocalNotes(prev => ({
      ...prev,
      [etudiantId]: { ...prev[etudiantId], [field]: value }
    }))
  }

  const computePreview = (etudiantId) => {
    const n = localNotes[etudiantId]
    if (!n) return null
    const mat = matieres.find(m => String(m.id) === String(selectedMatiere))
    if (!mat) return null
    const cc = n.note_cc !== '' ? parseFloat(n.note_cc) : null
    const exam = n.note_exam !== '' ? parseFloat(n.note_exam) : null
    const ratt = n.note_rattrapage !== '' ? parseFloat(n.note_rattrapage) : null
    let finale = null
    if (mat.type_eval === 'CC+Exam') {
      if (cc !== null && exam !== null) finale = cc * 0.4 + exam * 0.6
      else if (exam !== null) finale = exam
    } else {
      if (exam !== null) finale = exam
    }
    if (ratt !== null && finale !== null) finale = Math.max(finale, ratt)
    else if (ratt !== null) finale = ratt
    return finale !== null ? Math.round(finale * 100) / 100 : null
  }

  const handleSave = async () => {
    if (!selectedMatiere || !selectedAnnee) return
    setSaving(true)
    const notes = etudiants.map(e => ({
      etudiant_id: e.id,
      matiere_id: selectedMatiere,
      annee_id: selectedAnnee,
      ...localNotes[e.id]
    }))
    try {
      await api.put('/notes/bulk', { matiere_id: selectedMatiere, annee_id: selectedAnnee, notes })
      toast.success('Notes enregistrées avec succès!')
      // Reload
      const r = await api.get(`/notes/classe/${selectedClasse}`, { params: { annee_id: selectedAnnee } })
      setNotesData(r.data.notesMap)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const selectedMatiereObj = matieres.find(m => String(m.id) === String(selectedMatiere))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des Notes</h1>
        <p className="text-sm text-gray-500 mt-1">Saisir les notes CC, Examen et Rattrapage</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
            <select className="input" value={selectedClasse} onChange={e => { setSelectedClasse(e.target.value); setSelectedMatiere('') }}>
              <option value="">-- Classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semestre</label>
            <select className="input" value={semestre} onChange={e => setSemestre(e.target.value)}>
              <option value="">Tous</option>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>
          <div>
            <label className="label">Matière</label>
            <select className="input" value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} disabled={!selectedClasse}>
              <option value="">-- Matière --</option>
              {matieres.map(m => <option key={m.id} value={m.id}>[S{m.semestre}] {m.libelle} (Coeff:{m.coefficient})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notes Table */}
      {selectedMatiere && selectedClasse && selectedAnnee ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">{selectedMatiereObj?.libelle}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Type: {selectedMatiereObj?.type_eval} | Coeff: {selectedMatiereObj?.coefficient} | Crédits: {selectedMatiereObj?.credit}
              </p>
            </div>
            <button onClick={handleSave} disabled={saving || etudiants.length === 0} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
          ) : etudiants.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun étudiant inscrit dans cette classe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th w-8">#</th>
                    <th className="table-th">Matricule</th>
                    <th className="table-th">Étudiant</th>
                    {selectedMatiereObj?.type_eval === 'CC+Exam' && <th className="table-th text-center">Note CC (40%)</th>}
                    <th className="table-th text-center">Examen (60%)</th>
                    <th className="table-th text-center">Rattrapage</th>
                    <th className="table-th text-center">Note Finale</th>
                    <th className="table-th text-center">Mention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((etudiant, idx) => {
                    const preview = computePreview(etudiant.id)
                    return (
                      <tr key={etudiant.id} className="hover:bg-gray-50">
                        <td className="table-td text-gray-400 text-xs">{idx + 1}</td>
                        <td className="table-td"><span className="font-mono text-xs">{etudiant.matricule}</span></td>
                        <td className="table-td font-medium">{etudiant.prenom} {etudiant.nom}</td>
                        {selectedMatiereObj?.type_eval === 'CC+Exam' && (
                          <td className="table-td">
                            <input
                              type="number" min="0" max="20" step="0.25"
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                              value={localNotes[etudiant.id]?.note_cc ?? ''}
                              onChange={e => handleNoteChange(etudiant.id, 'note_cc', e.target.value)}
                            />
                          </td>
                        )}
                        <td className="table-td">
                          <input
                            type="number" min="0" max="20" step="0.25"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={localNotes[etudiant.id]?.note_exam ?? ''}
                            onChange={e => handleNoteChange(etudiant.id, 'note_exam', e.target.value)}
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="number" min="0" max="20" step="0.25"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={localNotes[etudiant.id]?.note_rattrapage ?? ''}
                            onChange={e => handleNoteChange(etudiant.id, 'note_rattrapage', e.target.value)}
                          />
                        </td>
                        <td className={`table-td text-center ${noteColor(preview)}`}>
                          {preview !== null ? preview.toFixed(2) : '—'}
                        </td>
                        <td className="table-td text-center text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${preview !== null && preview >= 10 ? 'bg-green-100 text-green-700' : preview !== null ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                            {getMention(preview)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sélectionnez une année, une classe et une matière</p>
          <p className="text-sm mt-1">pour afficher la grille de saisie des notes</p>
        </div>
      )}
    </div>
  )
}
