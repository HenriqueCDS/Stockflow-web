import React, { useEffect, useState } from 'react'
import { Home, Save, Users, Copy, RefreshCw, Trash2, Crown } from 'lucide-react'
import { houseApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function HousePage({ showToast }) {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'

  const [form, setForm] = useState(emptyForm)
  const [inviteCode, setInviteCode] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([houseApi.get(), houseApi.members()])
      .then(([house, memberList]) => {
        setForm({ name: house.name || '', email: house.email || '', phone: house.phone || '', address: house.address || '' })
        setInviteCode(house.inviteCode || '')
        setMembers(memberList || [])
      })
      .catch(() => showToast('Erro ao carregar dados da casa', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await houseApi.update(form)
      showToast('Dados da casa atualizados com sucesso!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('Código de convite copiado!')
    } catch {
      showToast('Não foi possível copiar o código', 'error')
    }
  }

  const handleRotateInvite = async () => {
    setConfirmRotate(false)
    setRotating(true)
    try {
      const data = await houseApi.rotateInviteCode()
      setInviteCode(data.inviteCode)
      showToast('Novo código de convite gerado! O código anterior deixou de funcionar.')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setRotating(false)
    }
  }

  const handleRemoveMember = async () => {
    const member = removeTarget
    setRemoveTarget(null)
    try {
      await houseApi.removeMember(member.id)
      showToast(`${member.name} foi removido da casa.`)
      setMembers(ms => ms.filter(m => m.id !== member.id))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (loading) return <LoadingSpinner text="Carregando dados da casa..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Casa</h1>
          <p className="page-subtitle">Dados da sua casa, código de convite e moradores</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Home size={22} color="#ff7a00" />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Dados da Casa</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome da casa <span>*</span></label>
              <input className="form-input" required minLength={2} maxLength={100} value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input className="form-input" value={form.address} onChange={set('address')} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Users size={22} color="#ff7a00" />
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Código de convite</h2>
            </div>
            <p style={{ color: '#6b6b66', fontSize: 14, marginBottom: 14 }}>Compartilhe este código para que alguém entre na sua casa.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" readOnly value={inviteCode} style={{ fontFamily: 'var(--mono, monospace)', fontWeight: 700, letterSpacing: 1 }} />
              <button type="button" className="btn btn-outline" onClick={handleCopyInvite} aria-label="Copiar código">
                <Copy size={16} />
              </button>
            </div>
            {isOwner && (
              <button type="button" className="btn btn-outline" disabled={rotating} onClick={() => setConfirmRotate(true)}>
                <RefreshCw size={16} />
                {rotating ? 'Gerando...' : 'Gerar novo código'}
              </button>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Moradores</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: '#f6f5f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.name}
                      {m.role === 'OWNER' && <Crown size={14} color="#d97706" />}
                    </div>
                    <div style={{ fontSize: 12, color: '#9a9a92' }}>{m.email}</div>
                  </div>
                  {isOwner && m.role !== 'OWNER' && m.id !== user?.id && (
                    <button className="btn" style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                      onClick={() => setRemoveTarget(m)} aria-label={`Remover ${m.name}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p style={{ color: '#9a9a92', fontSize: 14 }}>Nenhum morador encontrado.</p>}
            </div>
          </div>
        </div>
      </div>

      {confirmRotate && (
        <ConfirmModal title="Gerar novo código de convite?"
          message="O código atual deixará de funcionar imediatamente. Quem ainda não entrou na casa vai precisar do novo código."
          confirmLabel="Sim, gerar novo código" onConfirm={handleRotateInvite} onCancel={() => setConfirmRotate(false)} />
      )}

      {removeTarget && (
        <ConfirmModal title="Remover morador?" message={`Tem certeza que deseja remover "${removeTarget.name}" da casa?`}
          confirmLabel="Sim, remover" danger onConfirm={handleRemoveMember} onCancel={() => setRemoveTarget(null)} />
      )}
    </div>
  )
}
