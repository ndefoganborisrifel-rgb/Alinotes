import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const empty = { code: '', libelle: '', coefficient: 1, credit: 3, semestre: 1, type_eval: 'CC+Exam', niveau_id: '', enseignant_id: '' }

export default function Matieres() {
  const [items, setItems] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [filterNiveau, setFilterNiveau] = useState('')

  const load = () => {
    const params = filterNiveau ? `?niveau_id=${filterNiveau}` : ''
    Promise.all([api.get(`/matieres${params}`), api.get('/niveaux'), api.get('/enseignants')])
      .then(([m, n, e]) => { setItems(m.data); setNiveaux(n.data); setEnseignants(e.data) })
  }
  useEffect(() => { load() }, [filterNiveau])

  const openAdd = () => { setEditing(null); setForm(empty); setIsOpen(true) }
  const openEdit = item => {
    setEditing(item)
    setForm({ code: item.code, libelle: item.libelle, coefficient: item.coefficient, credit: item.credit, semestre: item.semestre || 1, type_eval: item.type_eval || 'CC+Exam', niveau_id: item.niveau_id || '', enseignant_id: item.enseignant_id || '' })
    setIsOpen(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/matieres/${editing.id}`, form); toast.success('Matière modifiée') }
      else { await api.post('/matieres', form); toast.success('Matière créée') }
      setIsOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cette matière ?')) return
    try { await api.delete(`/matieres/${id}`); toast.success('Supprimée'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Matières / UE</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Nouvelle matière</button>
      </div>
      <div>
        <select className="input max-w-xs" value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(n => <option key={n.id} value={n.id}>{n.code} - {n.libelle}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Code</th>
              <th className="table-th">Matière</th>
              <th className="table-th">Niveau</th>
              <th className="table-th">Sem.</th>
              <th className="table-th">Coeff.</th>
              <th className="table-th">Crédits</th>
              <th className="table-th">Type éval.</th>
              <th className="table-th">Enseignant</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-mono text-xs font-bold text-pink-700">{item.code}</td>
                <td className="table-td font-medium text-gray-900">{item.libelle}</td>
                <td className="table-td"><span className="badge-info">{item.niveau_code || '—'}</span></td>
                <td className="table-td text-center text-gray-600">S{item.semestre || '?'}</td>
                <td className="table-td text-center font-semibold text-gray-800">{item.coefficient}</td>
                <td className="table-td text-center text-gray-600">{item.credit}</td>
                <td className="table-td text-xs text-gray-500">{item.type_eval}</td>
                <td className="table-td text-xs text-gray-500">{item.enseignant_nom ? `${item.enseignant_prenom} ${item.enseignant_nom}` : '—'}</td>
                <td className="table-td text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier la matière' : 'Nouvelle matière'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="ex: INF101" required /></div>
            <div><label className="label">Libellé *</label><input className="input" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="ex: Algorithmique" required /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Coefficient</label><input type="number" step="0.5" min="0.5" className="input" value={form.coefficient} onChange={e => setForm({...form, coefficient: parseFloat(e.target.value)})} /></div>
            <div><label className="label">Crédits</label><input type="number" min="1" className="input" value={form.credit} onChange={e => setForm({...form, credit: parseInt(e.target.value)})} /></div>
            <div><label className="label">Semestre</label>
              <select className="input" value={form.semestre} onChange={e => setForm({...form, semestre: parseInt(e.target.value)})}>
                <option value={1}>Semestre 1</option><option value={2}>Semestre 2</option>
              </select>
            </div>
          </div>
          <div><label className="label">Type d'évaluation</label>
            <select className="input" value={form.type_eval} onChange={e => setForm({...form, type_eval: e.target.value})}>
              <option value="CC+Exam">CC + Examen (40% CC / 60% Exam)</option>
              <option value="Exam seul">Examen seul</option>
            </select>
          </div>
          <div><label className="label">Niveau</label>
            <select className="input" value={form.niveau_id} onChange={e => setForm({...form, niveau_id: e.target.value})}>
              <option value="">-- Choisir un niveau --</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.code} - {n.libelle}</option>)}
            </select>
          </div>
          <div><label className="label">Enseignant responsable</label>
            <select className="input" value={form.enseignant_id} onChange={e => setForm({...form, enseignant_id: e.target.value})}>
              <option value="">-- Choisir --</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
