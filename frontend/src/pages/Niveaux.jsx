import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const empty = { code: '', libelle: '', filiere_id: '' }

export default function Niveaux() {
  const [items, setItems] = useState([])
  const [filieres, setFilieres] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = () => Promise.all([api.get('/niveaux'), api.get('/filieres')]).then(([n, f]) => { setItems(n.data); setFilieres(f.data) })
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(empty); setIsOpen(true) }
  const openEdit = item => { setEditing(item); setForm({ code: item.code, libelle: item.libelle, filiere_id: item.filiere_id || '' }); setIsOpen(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/niveaux/${editing.id}`, form); toast.success('Niveau modifié') }
      else { await api.post('/niveaux', form); toast.success('Niveau créé') }
      setIsOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer ce niveau ?')) return
    try { await api.delete(`/niveaux/${id}`); toast.success('Supprimé'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Niveaux</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Nouveau niveau</button>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Code</th>
              <th className="table-th">Libellé</th>
              <th className="table-th">Filière</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-mono font-bold text-primary-700">{item.code}</td>
                <td className="table-td font-medium text-gray-900">{item.libelle}</td>
                <td className="table-td text-gray-500">{item.filiere_libelle || '—'}</td>
                <td className="table-td text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier le niveau' : 'Nouveau niveau'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="ex: L1, M2" required /></div>
          <div><label className="label">Libellé *</label><input className="input" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="ex: Licence 1" required /></div>
          <div><label className="label">Filière</label>
            <select className="input" value={form.filiere_id} onChange={e => setForm({...form, filiere_id: e.target.value})}>
              <option value="">-- Choisir une filière --</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.libelle} ({f.type})</option>)}
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
