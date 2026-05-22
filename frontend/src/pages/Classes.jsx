import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const empty = { libelle: '', niveau_id: '', annee_id: '', capacite: 50 }

export default function Classes() {
  const [items, setItems] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [annees, setAnnees] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [filterAnnee, setFilterAnnee] = useState('')

  const load = () => {
    const params = filterAnnee ? `?annee_id=${filterAnnee}` : ''
    Promise.all([api.get(`/classes${params}`), api.get('/niveaux'), api.get('/annees')])
      .then(([c, n, a]) => { setItems(c.data); setNiveaux(n.data); setAnnees(a.data) })
  }
  useEffect(() => { load() }, [filterAnnee])

  const openAdd = () => { setEditing(null); setForm(empty); setIsOpen(true) }
  const openEdit = item => { setEditing(item); setForm({ libelle: item.libelle, niveau_id: item.niveau_id || '', annee_id: item.annee_id || '', capacite: item.capacite || 50 }); setIsOpen(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/classes/${editing.id}`, form); toast.success('Classe modifiée') }
      else { await api.post('/classes', form); toast.success('Classe créée') }
      setIsOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cette classe ?')) return
    try { await api.delete(`/classes/${id}`); toast.success('Supprimée'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Nouvelle classe</button>
      </div>
      <div className="flex gap-3">
        <select className="input max-w-xs" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.active ? ' ✓' : ''}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Classe</th>
              <th className="table-th">Niveau</th>
              <th className="table-th">Filière</th>
              <th className="table-th">Année</th>
              <th className="table-th">Étudiants</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-semibold text-gray-900">{item.libelle}</td>
                <td className="table-td"><span className="badge-info">{item.niveau_code || '—'}</span></td>
                <td className="table-td text-gray-500">{item.filiere_libelle || '—'}</td>
                <td className="table-td text-gray-500">{item.annee_libelle || '—'}</td>
                <td className="table-td">
                  <span className="flex items-center gap-1 text-gray-600"><Users size={14} />{item.nb_etudiants}/{item.capacite}</span>
                </td>
                <td className="table-td text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier la classe' : 'Nouvelle classe'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Libellé *</label><input className="input" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="ex: L1-INFO-A" required /></div>
          <div><label className="label">Niveau</label>
            <select className="input" value={form.niveau_id} onChange={e => setForm({...form, niveau_id: e.target.value})}>
              <option value="">-- Choisir un niveau --</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.code} - {n.libelle} ({n.filiere_libelle})</option>)}
            </select>
          </div>
          <div><label className="label">Année académique</label>
            <select className="input" value={form.annee_id} onChange={e => setForm({...form, annee_id: e.target.value})}>
              <option value="">-- Choisir une année --</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.active ? ' (active)' : ''}</option>)}
            </select>
          </div>
          <div><label className="label">Capacité</label><input type="number" className="input" value={form.capacite} onChange={e => setForm({...form, capacite: parseInt(e.target.value)})} min="1" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
