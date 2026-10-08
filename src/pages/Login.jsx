import React, { useState } from 'react'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import House3D from '../components/House3D'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
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
      await login(email.trim(), password)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
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
            <p className="login-sub">Acompanhe o estoque da sua casa e os alertas pelo computador.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="eyebrow" htmlFor="email">E-mail</label>
                <input id="email" type="email" autoComplete="email" autoFocus
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="voce@email.com" value={email}
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

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
              Ainda não tem conta? <Link to="/registro" style={{ color: '#ff7a00', fontWeight: 600 }}>Cadastre sua casa</Link>
            </p>
          </div>

          <p className="login-terms">Ao continuar você concorda com os termos.</p>
        </section>

        <aside className="login-brand-side">
          <House3D />
        </aside>
      </div>
    </div>
  )
}
