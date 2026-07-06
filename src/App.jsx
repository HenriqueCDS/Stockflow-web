import React, { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import StockEntry from './pages/StockEntry'
import StockExit from './pages/StockExit'
import History from './pages/History'
import Reports from './pages/Reports'
import Company from './pages/Company'

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/produtos" element={<Products showToast={showToast} />} />
          <Route path="/entrada" element={<StockEntry showToast={showToast} />} />
          <Route path="/saida" element={<StockExit showToast={showToast} />} />
          <Route path="/historico" element={<History showToast={showToast} />} />
          <Route path="/relatorios" element={<Reports showToast={showToast} />} />
          <Route path="/empresa" element={<Company showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
