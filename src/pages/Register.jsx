import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', email: '', password: '', companyName: '', companyCnpj: '' }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, companyCnpj: form.companyCnpj.replace(/\D/g, '') })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Criar conta</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Cadastre sua empresa e o usuário administrador</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Seu nome</label>
            <input className="form-input" required minLength={2} value={form.name} onChange={set('name')} placeholder="Ex: Maria Silva" />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" required value={form.email} onChange={set('email')} placeholder="seu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input className="form-input" type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" />
          </div>
          <div className="form-group">
            <label className="form-label">Nome da empresa</label>
            <input className="form-input" required minLength={2} value={form.companyName} onChange={set('companyName')} placeholder="Ex: Minha Empresa LTDA" />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ</label>
            <input className="form-input" required value={form.companyCnpj} onChange={set('companyCnpj')} placeholder="Somente números" />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Já tem conta? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
