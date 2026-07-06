import React, { useEffect, useState } from 'react'
import { Building2, Save } from 'lucide-react'
import { companyApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const emptyForm = { name: '', cnpj: '', email: '', phone: '', address: '' }

export default function Company({ showToast }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    companyApi.get()
      .then(data => setForm({ name: data.name || '', cnpj: data.cnpj || '', email: data.email || '', phone: data.phone || '', address: data.address || '' }))
      .catch(() => showToast('Erro ao carregar dados da empresa', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await companyApi.update({ ...form, cnpj: form.cnpj.replace(/\D/g, '') })
      showToast('Dados da empresa atualizados com sucesso!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Carregando dados da empresa..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empresa</h1>
          <p className="page-subtitle">Dados cadastrais da sua empresa</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Building2 size={22} color="#2563eb" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Dados da Empresa</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Razão Social <span>*</span></label>
            <input className="form-input" required minLength={2} maxLength={100} value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ <span>*</span></label>
            <input className="form-input" required value={form.cnpj} onChange={set('cnpj')} placeholder="Somente números" />
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
    </div>
  )
}
