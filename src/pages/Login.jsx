import React, { useRef, useState } from 'react'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ScanLine, CheckCircle2, PackageCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import House3D from '../components/House3D'
import DownloadApp from '../components/DownloadApp'
import logoIcon from '../assets/logo/homestock-logo-192.png'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const emailRef = useRef(null)
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
      // Erro de credencial: marca os dois campos e devolve o foco ao e-mail
      setErrors({ email: ' ', password: ' ' })
      setFormError(err.message)
      emailRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-form-side">
          <div className="login-brand">
            <img className="login-logo" src={logoIcon} alt="HomeStock" />
            <span>HomeStock</span>
            <DownloadApp style={{ marginLeft: 'auto' }} />
          </div>

          <div className="login-form-wrap">
            <div className="eyebrow">Painel web</div>
            <h1 className="login-title">Bem-vindo de volta.</h1>
            <p className="login-sub">Acompanhe o estoque da sua casa e os alertas pelo computador.</p>

            {formError && <div className="alert alert-danger" role="alert"><AlertTriangle size={18} /><span>{formError}</span></div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="eyebrow" htmlFor="email">E-mail</label>
                <div className="input-icon">
                  <Mail size={18} />
                  <input id="email" ref={emailRef} type="email" autoComplete="email" autoFocus
                    className={`form-input${errors.email ? ' error' : ''}`}
                    placeholder="voce@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} />
                </div>
                {errors.email?.trim() && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="eyebrow" htmlFor="password">Senha</label>
                <div className="input-icon">
                  <Lock size={18} />
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                    className={`form-input${errors.password ? ' error' : ''}`} style={{ paddingRight: 44 }}
                    placeholder="Sua senha" value={password}
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password?.trim() && <span className="form-error">{errors.password}</span>}
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Entrando...' : <>Entrar <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="login-divider"><span>Primeira vez aqui?</span></div>
            <Link to="/registro" className="btn btn-outline login-btn" style={{ textDecoration: 'none' }}>Cadastrar minha casa</Link>
          </div>

          <p className="login-terms">Ao continuar você concorda com os termos.</p>
        </section>

        <aside className="login-brand-side">
          <div className="login-grid" aria-hidden="true" />
          <House3D />
          <div className="login-shadow" aria-hidden="true" />
          <div className="login-badge"><CheckCircle2 size={16} color="var(--good)" /> Escaneou a nota, estoque atualizado</div>
          <div className="login-hint">Arraste para girar</div>
          <div className="login-steps">
            {[
              { icon: ScanLine, title: 'Escaneie', text: 'o QR da nota' },
              { icon: CheckCircle2, title: 'Confirme', text: 'os itens' },
              { icon: PackageCheck, title: 'Pronto', text: 'estoque em dia' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass">
                <Icon size={18} />
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
