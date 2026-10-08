import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const emptyCreateForm = { name: '', email: '', password: '', houseName: '' }
const emptyJoinForm = { name: '', email: '', password: '', inviteCode: '' }

export default function Register() {
  const { register, join } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('create')
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [joinForm, setJoinForm] = useState(emptyJoinForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = mode === 'create' ? createForm : joinForm
  const setForm = mode === 'create' ? setCreateForm : setJoinForm
  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'create') {
        await register(createForm)
      } else {
        await join(joinForm)
      }
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
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {mode === 'create' ? 'Cadastre sua casa e o seu usuário' : 'Entre em uma casa já existente'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f1f0ea', borderRadius: 10, padding: 4 }}>
          <button type="button" onClick={() => { setMode('create'); setError('') }}
            className="btn" style={{ flex: 1, padding: '8px 12px', border: 'none', fontSize: 14,
              background: mode === 'create' ? 'white' : 'transparent',
              color: mode === 'create' ? '#1a1a1a' : '#6b6b66',
              fontWeight: mode === 'create' ? 600 : 500,
              boxShadow: mode === 'create' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>
            Criar casa nova
          </button>
          <button type="button" onClick={() => { setMode('join'); setError('') }}
            className="btn" style={{ flex: 1, padding: '8px 12px', border: 'none', fontSize: 14,
              background: mode === 'join' ? 'white' : 'transparent',
              color: mode === 'join' ? '#1a1a1a' : '#6b6b66',
              fontWeight: mode === 'join' ? 600 : 500,
              boxShadow: mode === 'join' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>
            Entrar com convite
          </button>
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

          {mode === 'create' ? (
            <div className="form-group">
              <label className="form-label">Nome da casa</label>
              <input className="form-input" required minLength={2} value={createForm.houseName} onChange={set('houseName')} placeholder="Ex: Casa da Família Silva" />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Código de convite</label>
              <input className="form-input" required minLength={1} value={joinForm.inviteCode} onChange={set('inviteCode')} placeholder="Peça o código a quem mora na casa" />
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Criando...' : (mode === 'create' ? 'Criar conta' : 'Entrar na casa')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Já tem conta? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
