import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Stockflow</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input className="form-input" type="password" required value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Ainda não tem conta? <Link to="/registro" style={{ color: '#2563eb', fontWeight: 600 }}>Cadastre sua empresa</Link>
        </p>
      </div>
    </div>
  )
}
