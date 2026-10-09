import React, { useEffect, useState } from 'react'
import { UserCircle, Save } from 'lucide-react'
import { userApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ThemeSelector from '../components/ThemeSelector'

const roleLabel = { OWNER: 'Dono', MEMBER: 'Membro' }

export default function Profile({ showToast }) {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    userApi.getProfile()
      .then(data => { setProfile(data); setName(data.name || '') })
      .catch(() => showToast('Erro ao carregar perfil', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Informe seu nome'); return }
    setSaving(true)
    try {
      const data = await userApi.updateProfile({ name: name.trim() })
      setProfile(data)
      updateUser({ name: data.name })
      showToast('Perfil atualizado com sucesso!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Carregando perfil..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meu Perfil</h1>
          <p className="page-subtitle">Seus dados de acesso</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <UserCircle size={22} color="var(--primary)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Dados Pessoais</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome <span>*</span></label>
            <input className={`form-input${error ? ' error' : ''}`} maxLength={100} value={name}
              onChange={e => { setName(e.target.value); setError('') }} />
            {error && <span className="form-error">{error}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" value={profile?.email || ''} disabled />
            <span className="form-hint">O e-mail não pode ser alterado por aqui</span>
          </div>
          <div className="form-group">
            <label className="form-label">Perfil de acesso</label>
            <input className="form-input" value={roleLabel[profile?.role] || profile?.role || ''} disabled />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480, marginTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Aparência</h2>
        <ThemeSelector />
      </div>
    </div>
  )
}
