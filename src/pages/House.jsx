import React, { useEffect, useState } from 'react'
import { Home, Save, Users, Copy, RefreshCw, Trash2, Share2, Palette } from 'lucide-react'
import { houseApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import ErrorState from '../components/ErrorState'
import ActionMenu from '../components/ActionMenu'
import Avatar from '../components/Avatar'
import ThemeSelector from '../components/ThemeSelector'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function HousePage({ showToast }) {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'

  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(emptyForm)
  const [loadError, setLoadError] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([houseApi.get(), houseApi.members()])
      .then(([house, memberList]) => {
        const loaded = { name: house.name || '', email: house.email || '', phone: house.phone || '', address: house.address || '' }
        setForm(loaded)
        setSaved(loaded)
        setInviteCode(house.inviteCode || '')
        setMembers(memberList || [])
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await houseApi.update(form)
      setSaved(form)
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

  const handleShareInvite = async () => {
    try {
      await navigator.share({ title: 'Convite HomeStock', text: `Entre na minha casa no HomeStock com o código: ${inviteCode}` })
    } catch { /* cancelado pela pessoa */ }
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
  if (loadError) return <div className="card"><ErrorState onRetry={load} /></div>

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Casa</h1>
          <p className="page-subtitle">Dados da sua casa, código de convite e moradores</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, background: 'var(--primary-soft)', borderColor: 'var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Users size={22} color="var(--primary-ink)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Código de convite</h2>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14 }}>Compartilhe este código para que alguém entre na sua casa.</p>
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: 4, color: 'var(--primary-ink)', marginBottom: 16, wordBreak: 'break-all' }}>
          {inviteCode || '—'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleCopyInvite}><Copy size={16} /> Copiar código</button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button type="button" className="btn btn-outline" onClick={handleShareInvite}><Share2 size={16} /> Compartilhar</button>
          )}
          {isOwner && (
            <button type="button" className="btn btn-outline" disabled={rotating} onClick={() => setConfirmRotate(true)}>
              <RefreshCw size={16} /> {rotating ? 'Gerando...' : 'Gerar novo'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Home size={22} color="var(--primary)" />
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
            <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Moradores</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2)' }}>
                  <Avatar name={m.name} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}{m.id === user?.id && <span className="metric-note"> (você)</span>}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <span className={`badge ${m.role === 'OWNER' ? 'badge-warning' : 'badge-gray'}`}>{m.role === 'OWNER' ? 'Dono' : 'Morador'}</span>
                  {isOwner && m.role !== 'OWNER' && m.id !== user?.id && (
                    <ActionMenu label={`Ações para ${m.name}`} items={[{ label: 'Remover', icon: Trash2, danger: true, onClick: () => setRemoveTarget(m) }]} />
                  )}
                </div>
              ))}
              {members.length === 1 && (
                <p style={{ color: 'var(--muted)', fontSize: 14, padding: '4px 2px' }}>Você é o único morador. Compartilhe o código.</p>
              )}
              {members.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum morador encontrado.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Palette size={22} color="var(--primary)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Aparência</h2>
        </div>
        <ThemeSelector />
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
