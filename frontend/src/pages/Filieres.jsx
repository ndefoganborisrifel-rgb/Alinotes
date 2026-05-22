import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const emptyForm = { code: '', libelle: '', type: 'Licence' }
const TYPES = ['Licence', 'Master', 'Doctorat']

const typeBadge = (t) => {
  const map = { Licence: 'badge-info', Master: 'badge-warning', Doctorat: 'badge-success' }
  return map[t] || 'badge-info'
}

export default function Filieres() {
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.get('/filieres').then(r => setFilieres(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setModal(true) }
  const openEdit = (f) => { setEditItem(f); setForm({ code: f.code, libelle: f.libelle, type: f.type || 'Licence' }); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) { await api.put(`/filieres/${editItem.id}`, form); toast.success('Filière modifiée') }
      else { await api.post('/filieres', form); toast.success('Filière créée') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette filière ?')) return
    try { await api.delete(`/filieres/${id}`); toast.success('Supprimée'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filières</h1>
          <p className="text-sm text-gray-500 mt-1">{filieres.length} filière(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Nouvelle Filière</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : filieres.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><BookOpen size={40} className="mx-auto mb-3 opacity-30" /><p>Aucune filière</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Code</th>
                <th className="table-th">Libellé</th>
                <th className="table-th">Type</th>
                <th className="table-th">Niveaux</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filieres.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="table-td"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{f.code}</span></td>
                  <td className="table-td font-medium">{f.libelle}</td>
                  <td className="table-td"><span className={typeBadge(f.type)}>{f.type}</span></td>
                  <td className="table-td">{f.nb_niveaux || 0}</td>
                  <td className="table-td text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Modifier Filière' : 'Nouvelle Filière'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Code *</label>
              <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ex: INFO" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Libellé *</label>
            <input className="input" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="ex: Informatique" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
