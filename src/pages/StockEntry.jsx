import React, { useEffect, useState } from 'react'
import { PackagePlus, Search, CheckCircle } from 'lucide-react'
import { productApi, stockApi } from '../api/api'

export default function StockEntry({ showToast }) {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    productApi.list({ active: true, size: 500, sort: 'name' })
      .then(data => setProducts(data.content))
      .catch(() => {})
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.ean || '').toLowerCase().includes(search.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!selected) e.product = 'Selecione um produto'
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) e.quantity = 'Informe uma quantidade válida (mínimo 1)'
    if (unitCost && (isNaN(unitCost) || Number(unitCost) < 0)) e.unitCost = 'Informe um custo válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const movement = await stockApi.adjust({
        productId: selected.id,
        type: 'ENTRY',
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        notes: notes || undefined
      })
      setSuccess(true)
      setSelected(p => ({ ...p, currentStock: movement.stockAfter }))
      setQuantity(''); setUnitCost(''); setNotes(''); setErrors({})
      showToast(`Entrada de ${quantity} unidade(s) registrada com sucesso!`)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dar Entrada no Estoque</h1>
          <p className="page-subtitle">Registre a chegada de novos produtos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Product selection */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>1. Escolha o Produto</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 12, border: '2px solid ' + (errors.product ? '#dc2626' : '#e2e8f0') }}>
            <Search size={18} color="#94a3b8" />
            <input placeholder="Digite o nome ou EAN..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 15, flex: 1 }} />
          </div>
          {errors.product && <span className="form-error" style={{ display: 'block', marginBottom: 8 }}>{errors.product}</span>}

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => { setSelected(p); setErrors(e => ({ ...e, product: '' })) }}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                  border: '2px solid ' + (selected?.id === p.id ? '#2563eb' : '#e2e8f0'),
                  background: selected?.id === p.id ? '#eff6ff' : 'white',
                  transition: 'all 0.15s'
                }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: '#64748b' }}>
                  {p.ean && <><span>EAN: {p.ean}</span><span>•</span></>}
                  <span>Em estoque: <strong style={{ color: '#1e293b' }}>{p.currentStock}</strong></span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Nenhum produto encontrado</div>}
          </div>
        </div>

        {/* Entry form */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>2. Informações da Entrada</h2>

          {selected ? (
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 14px', marginBottom: 20, border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                Estoque atual: <strong style={{ color: '#1e293b', fontSize: 18 }}>{selected.currentStock}</strong> unidades
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 20, color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
              ← Selecione um produto ao lado
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Quantidade que chegou <span style={{ color: '#dc2626' }}>*</span></label>
              <input className={`form-input${errors.quantity ? ' error' : ''}`} type="number" min="1"
                placeholder="Ex: 50" value={quantity}
                onChange={e => { setQuantity(e.target.value); setErrors(p => ({ ...p, quantity: '' })) }}
                style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }} />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
              {selected && quantity && !errors.quantity && (
                <span className="form-hint">Estoque ficará em: <strong>{selected.currentStock + Number(quantity || 0)}</strong> unidades</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Custo unitário (R$)</label>
              <input className={`form-input${errors.unitCost ? ' error' : ''}`} type="number" step="0.01" min="0"
                placeholder="0,00" value={unitCost}
                onChange={e => { setUnitCost(e.target.value); setErrors(p => ({ ...p, unitCost: '' })) }} />
              {errors.unitCost && <span className="form-error">{errors.unitCost}</span>}
              <span className="form-hint">Usado para calcular o custo médio do produto</span>
            </div>

            <div className="form-group">
              <label className="form-label">Observação</label>
              <input className="form-input" placeholder="Ex: Compra de reposição, NF-001..." value={notes}
                onChange={e => setNotes(e.target.value)} />
            </div>

            {success && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>Entrada registrada! O estoque foi atualizado.</span>
              </div>
            )}

            <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
              <PackagePlus size={20} />
              {saving ? 'Registrando...' : 'Confirmar Entrada no Estoque'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
