import React, { useState } from 'react'
<<<<<<< HEAD
import { Navigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import House3D from '../components/House3D'

export default function Login() {
  const { isAuthenticated, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Informe um e-mail válido'
    if (!password) errs.password = 'Informe sua senha'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      const { token, refreshToken, user } = await authApi.login(email.trim(), password)
      signIn(token, user, refreshToken)
    } catch (err) {
      setFormError(err.message)
=======
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
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
    } finally {
      setLoading(false)
    }
  }

  return (
<<<<<<< HEAD
    <div className="login-page">
      <div className="login-shell">
        <section className="login-form-side">
          <div className="login-brand">
            <div className="login-logo">H</div>
            <span>HomeStock</span>
          </div>

          <div className="login-form-wrap">
            <div className="eyebrow">Painel web</div>
            <h1 className="login-title">Bem-vindo de volta.</h1>
            <p className="login-sub">Acompanhe seu estoque, alertas e fornecedores pelo computador.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="eyebrow" htmlFor="email">E-mail</label>
                <input id="email" type="email" autoComplete="email" autoFocus
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="voce@negocio.com.br" value={email}
                  onChange={e => setEmail(e.target.value)} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="eyebrow" htmlFor="password">Senha</label>
                <div style={{ position: 'relative', display: 'flex' }}>
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                    className={`form-input${errors.password ? ' error' : ''}`} style={{ width: '100%', paddingRight: 44 }}
                    placeholder="Sua senha" value={password}
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b6b66', display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              {formError && <div className="alert alert-danger" role="alert">{formError}</div>}

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="login-terms">Ao continuar você concorda com os termos.</p>
        </section>

        <aside className="login-brand-side">
          <House3D />
        </aside>
=======
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
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
      </div>
    </div>
  )
}
