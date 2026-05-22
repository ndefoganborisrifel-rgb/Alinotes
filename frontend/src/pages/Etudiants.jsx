import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const empty = { nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '', email: '', telephone: '', classe_id: '', annee_id: '' }

export default function Etudiants() {
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [annees, setAnnees] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    Promise.all([api.get(`/etudiants?${params}`), api.get('/classes'), api.get('/annees')])
      .then(([e, c, a]) => { setItems(e.data); setClasses(c.data); setAnnees(a.data) })
  }
  useEffect(() => { load() }, [search])

  const openAdd = () => { setEditing(null); setForm(empty); setIsOpen(true) }
  const openEdit = item => {
    setEditing(item)
    setForm({ nom: item.nom, prenom: item.prenom, date_naissance: item.date_naissance || '', lieu_naissance: item.lieu_naissance || '', sexe: item.sexe || '', email: item.email || '', telephone: item.telephone || '', classe_id: item.classe_id || '', annee_id: item.inscription_annee_id || '' })
    setIsOpen(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/etudiants/${editing.id}`, form); toast.success('Étudiant modifié') }
      else { await api.post('/etudiants', form); toast.success('Étudiant créé') }
      setIsOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cet étudiant et toutes ses notes ?')) return
    try { await api.delete(`/etudiants/${id}`); toast.success('Supprimé'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Étudiants <span className="text-base font-normal text-gray-400">({items.length})</span></h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Nouvel étudiant</button>
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
              <th className="table-th">Classe</th>
              <th className="table-th">Contact</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-mono text-xs text-primary-700 font-medium">{item.matricule}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(item.prenom[0] || '') + (item.nom[0] || '')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.prenom} {item.nom}</p>
                      {item.sexe && <p className="text-xs text-gray-400">{item.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  {item.classe_libelle ? (
                    <span className="badge-info">{item.classe_libelle}</span>
                  ) : <span className="text-gray-400 text-xs">Non inscrit</span>}
                </td>
                <td className="table-td text-gray-500 text-xs">{item.email || item.telephone || '—'}</td>
                <td className="table-td text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier l\'étudiant' : 'Nouvel étudiant'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Prénom *</label><input className="input" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></div>
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date de naissance</label><input type="date" className="input" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} /></div>
            <div><label className="label">Sexe</label>
              <select className="input" value={form.sexe} onChange={e => setForm({...form, sexe: e.target.value})}>
                <option value="">—</option><option value="M">Masculin</option><option value="F">Féminin</option>
              </select>
            </div>
          </div>
          <div><label className="label">Lieu de naissance</label><input className="input" value={form.lieu_naissance} onChange={e => setForm({...form, lieu_naissance: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} /></div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Inscription</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Classe</label>
                <select className="input" value={form.classe_id} onChange={e => setForm({...form, classe_id: e.target.value})}>
                  <option value="">-- Choisir --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.libelle} - {c.annee_libelle}</option>)}
                </select>
              </div>
              <div><label className="label">Année académique</label>
                <select className="input" value={form.annee_id} onChange={e => setForm({...form, annee_id: e.target.value})}>
                  <option value="">-- Choisir --</option>
                  {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                </select>
              </div>
            </div>
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
