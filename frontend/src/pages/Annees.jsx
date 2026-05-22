import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, Calendar } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const emptyForm = { libelle: '', date_debut: '', date_fin: '', active: false }

export default function Annees() {
  const [annees, setAnnees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.get('/annees').then(r => setAnnees(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setModal(true) }
  const openEdit = (a) => { setEditItem(a); setForm({ libelle: a.libelle, date_debut: a.date_debut || '', date_fin: a.date_fin || '', active: !!a.active }); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        await api.put(`/annees/${editItem.id}`, form)
        toast.success('Année modifiée')
      } else {
        await api.post('/annees', form)
        toast.success('Année créée')
      }
      setModal(false); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette année académique ?')) return
    try {
      await api.delete(`/annees/${id}`)
      toast.success('Supprimée')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const handleActivate = async (id) => {
    try {
      await api.patch(`/annees/${id}/activate`)
      toast.success('Année activée')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Années Académiques</h1>
          <p className="text-sm text-gray-500 mt-1">{annees.length} année(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouvelle Année
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : annees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune année académique</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Libellé</th>
                <th className="table-th">Date début</th>
                <th className="table-th">Date fin</th>
                <th className="table-th">Statut</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {annees.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{a.libelle}</td>
                  <td className="table-td">{a.date_debut || '—'}</td>
                  <td className="table-td">{a.date_fin || '—'}</td>
                  <td className="table-td">
                    {a.active ? (
                      <span className="badge-success">Active</span>
                    ) : (
                      <button onClick={() => handleActivate(a.id)} className="text-xs text-gray-500 hover:text-primary-600 underline">
                        Activer
                      </button>
                    )}
                  </td>
                  <td className="table-td text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Modifier Année' : 'Nouvelle Année'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Libellé *</label>
            <input className="input" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="ex: 2024-2025" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date début</label>
              <input type="date" className="input" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
            </div>
            <div>
              <label className="label">Date fin</label>
              <input type="date" className="input" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <label htmlFor="active" className="text-sm text-gray-700">Année active</label>
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
