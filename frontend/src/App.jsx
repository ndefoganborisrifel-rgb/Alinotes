import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Annees from './pages/Annees'
import Filieres from './pages/Filieres'
import Niveaux from './pages/Niveaux'
import Classes from './pages/Classes'
import Etudiants from './pages/Etudiants'
import Enseignants from './pages/Enseignants'
import Matieres from './pages/Matieres'
import Notes from './pages/Notes'
import Bulletins from './pages/Bulletins'
import PV from './pages/PV'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="annees" element={<Annees />} />
            <Route path="filieres" element={<Filieres />} />
            <Route path="niveaux" element={<Niveaux />} />
            <Route path="classes" element={<Classes />} />
            <Route path="etudiants" element={<Etudiants />} />
            <Route path="enseignants" element={<Enseignants />} />
            <Route path="matieres" element={<Matieres />} />
            <Route path="notes" element={<Notes />} />
            <Route path="bulletins" element={<Bulletins />} />
            <Route path="pv" element={<PV />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
