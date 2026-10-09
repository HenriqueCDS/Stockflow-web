import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Check, Circle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoIcon from '../assets/logo/homestock-logo-192.png'

const emptyCreateForm = { name: '', email: '', password: '', houseName: '' }
const emptyJoinForm = { name: '', email: '', password: '', inviteCode: '' }

const passwordRules = [
  { label: '8 ou mais caracteres', test: p => p.length >= 8 },
  { label: 'Pelo menos uma letra', test: p => /[A-Za-zÀ-ÿ]/.test(p) },
  { label: 'Pelo menos um número', test: p => /\d/.test(p) },
]

export default function Register() {
  const { register, join } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('create')
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [joinForm, setJoinForm] = useState(emptyJoinForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = mode === 'create' ? createForm : joinForm
  const setForm = mode === 'create' ? setCreateForm : setJoinForm
  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))
  const passwordOk = passwordRules.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!passwordOk) { setError('A senha não atende às regras abaixo do campo.'); return }
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

  const tab = (key, label) => (
    <button type="button" onClick={() => { setMode(key); setError('') }} role="tab" aria-selected={mode === key}
      className="btn" style={{ flex: 1, padding: '8px 12px', border: 'none', fontSize: 14,
        background: mode === key ? 'var(--surface)' : 'transparent',
        color: mode === key ? 'var(--text)' : 'var(--muted)',
        fontWeight: mode === key ? 600 : 500,
        boxShadow: mode === key ? 'var(--shadow)' : 'none' }}>
      {label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src={logoIcon} alt="HomeStock" width={48} height={48} style={{ borderRadius: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Criar conta</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {mode === 'create' ? 'Cadastre sua casa e o seu usuário' : 'Entre em uma casa já existente'}
          </p>
        </div>

        <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--surface-2)', borderRadius: 10, padding: 4 }}>
          {tab('create', 'Criar casa nova')}
          {tab('join', 'Entrar com convite')}
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Seu nome</label>
            <input id="reg-name" className="form-input" required minLength={2} value={form.name} onChange={set('name')} placeholder="Ex: Maria Silva" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">E-mail</label>
            <input id="reg-email" className="form-input" type="email" required value={form.email} onChange={set('email')} placeholder="seu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Senha</label>
            <div style={{ position: 'relative', display: 'flex' }}>
              <input id="reg-password" className="form-input" type={showPassword ? 'text' : 'password'} required minLength={8}
                autoComplete="new-password" style={{ width: '100%', paddingRight: 44 }}
                value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }} aria-live="polite">
              {passwordRules.map(r => {
                const ok = r.test(form.password)
                return (
                  <li key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: ok ? 'var(--good)' : 'var(--muted)' }}>
                    {ok ? <Check size={14} /> : <Circle size={14} />} {r.label}
                  </li>
                )
              })}
            </ul>
          </div>

          {mode === 'create' ? (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-house">Nome da casa</label>
              <input id="reg-house" className="form-input" required minLength={2} value={createForm.houseName} onChange={set('houseName')} placeholder="Ex: Casa da Família Silva" />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-invite">Código de convite</label>
              <input id="reg-invite" className="form-input" required minLength={1} value={joinForm.inviteCode} onChange={set('inviteCode')} placeholder="Peça o código a quem mora na casa" />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Criando...' : (mode === 'create' ? 'Criar conta' : 'Entrar na casa')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--primary-ink)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
