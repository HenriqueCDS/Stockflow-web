import React, { useState, useCallback } from 'react'
<<<<<<< HEAD
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
=======
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
import Login from './pages/Login'
<<<<<<< HEAD
=======
import Register from './pages/Register'
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import StockEntry from './pages/StockEntry'
import StockExit from './pages/StockExit'
import History from './pages/History'
import Reports from './pages/Reports'
<<<<<<< HEAD
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
=======
import Company from './pages/Company'
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a

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
<<<<<<< HEAD
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
=======
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
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
