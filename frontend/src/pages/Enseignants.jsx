import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const grades = ['Assistant', 'Chargé de cours', 'Maître de conférences', 'Professeur', 'Professeur titulaire']
const empty = { nom: '', prenom: '', email: '', telephone: '', grade: '', specialite: '' }

export default function Enseignants() {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')

  const load = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get(`/enseignants${params}`).then(r => setItems(r.data))
  }
  useEffect(() => { load() }, [search])

  const openAdd = () => { setEditing(null); setForm(empty); setIsOpen(true) }
  const openEdit = item => { setEditing(item); setForm({ nom: item.nom, prenom: item.prenom, email: item.email || '', telephone: item.telephone || '', grade: item.grade || '', specialite: item.specialite || '' }); setIsOpen(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/enseignants/${editing.id}`, form); toast.success('Enseignant modifié') }
      else { await api.post('/enseignants', form); toast.success('Enseignant créé') }
      setIsOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cet enseignant ?')) return
    try { await api.delete(`/enseignants/${id}`); toast.success('Supprimé'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Enseignants <span className="text-base font-normal text-gray-400">({items.length})</span></h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Nouvel enseignant</button>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Matricule</th>
              <th className="table-th">Nom complet</th>
              <th className="table-th">Grade</th>
              <th className="table-th">Spécialité</th>
              <th className="table-th">Matières</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-mono text-xs text-emerald-700 font-medium">{item.matricule}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {(item.prenom[0] || '') + (item.nom[0] || '')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.prenom} {item.nom}</p>
                      <p className="text-xs text-gray-400">{item.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td text-gray-600 text-xs">{item.grade || '—'}</td>
                <td className="table-td text-gray-500 text-xs">{item.specialite || '—'}</td>
                <td className="table-td text-center">
                  <span className="badge-info">{item.nb_matieres}</span>
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Prénom *</label><input className="input" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></div>
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} /></div>
          </div>
          <div><label className="label">Grade</label>
            <select className="input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
              <option value="">-- Sélectionner --</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Spécialité</label><input className="input" value={form.specialite} onChange={e => setForm({...form, specialite: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
