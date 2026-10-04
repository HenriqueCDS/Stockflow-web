import React, { useState, useCallback } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import StockEntry from './pages/StockEntry'
import StockExit from './pages/StockExit'
import History from './pages/History'
import Reports from './pages/Reports'
import Invoices from './pages/Invoices'

function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard showToast={showToast} />} />
            <Route path="/produtos" element={<Products showToast={showToast} />} />
            <Route path="/entrada" element={<StockEntry showToast={showToast} />} />
            <Route path="/saida" element={<StockExit showToast={showToast} />} />
            <Route path="/historico" element={<History showToast={showToast} />} />
            <Route path="/notas" element={<Invoices showToast={showToast} />} />
            <Route path="/relatorios" element={<Reports showToast={showToast} />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}
