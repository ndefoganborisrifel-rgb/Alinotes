import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-primary-800 px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Institut Ali</h1>
            <p className="text-primary-300 mt-1 text-sm">Système de Gestion Scolaire LMD</p>
          </div>
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Connexion</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@ali.edu"
                  required
                />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-6">
              admin@ali.edu / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
