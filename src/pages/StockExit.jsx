import React, { useEffect, useState } from 'react'
import { PackageMinus, Search, CheckCircle, AlertTriangle } from 'lucide-react'
import { productApi, stockApi } from '../api/api'

export default function StockExit({ showToast }) {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    productApi.getAll({ active: true }).then(r => setProducts(r.data.content || [])).catch(() => {})
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.ean || '').includes(search)
  )

  const qty = Number(quantity) || 0
  const wouldGoNegative = selected && qty > selected.currentStock

  const validate = () => {
    const e = {}
    if (!selected) e.product = 'Selecione um produto'
    if (!quantity || qty <= 0) e.quantity = 'Informe uma quantidade válida (maior que zero)'
    if (selected && qty > selected.currentStock) e.quantity = `Quantidade maior que o estoque disponível (${selected.currentStock})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await stockApi.adjust({
        productId: selected.id,
        type: 'EXIT',
        quantity: qty,
        notes: [reason, reference && `Ref: ${reference}`].filter(Boolean).join(' | ') || null
      })
      setSuccess(true)
      setQuantity(''); setReason(''); setReference(''); setErrors({})
      showToast(`Saída de ${qty} unidade(s) registrada com sucesso!`)
      const r = await productApi.getById(selected.id)
      setSelected(r.data)
      setProducts(ps => ps.map(x => x.id === r.data.id ? r.data : x))
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
          <h1 className="page-title">Registrar Saída</h1>
          <p className="page-subtitle">Informe os produtos que saíram do estoque</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Product selection */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>1. Escolha o Produto</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f6f5f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, border: '2px solid ' + (errors.product ? '#dc2626' : '#e6e4dc') }}>
            <Search size={18} color="#9a9a92" />
            <input placeholder="Digite o nome ou código..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 15, flex: 1 }} />
          </div>
          {errors.product && <span className="form-error" style={{ display: 'block', marginBottom: 8 }}>{errors.product}</span>}

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => { setSelected(p); setErrors({}) }}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                  border: '2px solid ' + (selected?.id === p.id ? '#ff7a00' : '#e6e4dc'),
                  background: selected?.id === p.id ? '#fff1e4' : 'white',
                  opacity: p.currentStock === 0 ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: '#6b6b66' }}>
                  <span>EAN: {p.ean || '—'}</span>
                  <span>•</span>
                  <span style={{ color: p.currentStock === 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    {p.currentStock === 0 ? 'Sem estoque' : `${p.currentStock} disponíveis`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exit form */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>2. Informações da Saída</h2>

          {selected ? (
            <div style={{ background: selected.currentStock === 0 ? '#fee2e2' : '#fff1e4', borderRadius: 8, padding: '12px 14px', marginBottom: 20, border: '1px solid ' + (selected.currentStock === 0 ? '#fca5a5' : '#bfdbfe') }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
              <div style={{ color: '#6b6b66', fontSize: 14, marginTop: 4 }}>
                Disponível: <strong style={{ fontSize: 18, color: selected.currentStock === 0 ? '#dc2626' : '#16a34a' }}>{selected.currentStock}</strong> unidades
              </div>
              {selected.currentStock === 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>⚠ Este produto não tem estoque disponível</div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f6f5f0', borderRadius: 8, padding: '12px 14px', marginBottom: 20, color: '#9a9a92', fontSize: 14, textAlign: 'center' }}>
              ← Selecione um produto ao lado
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Quantidade que saiu <span style={{ color: '#dc2626' }}>*</span></label>
              <input className={`form-input${errors.quantity ? ' error' : ''}`} type="number" min="0" step="any"
                max={selected?.currentStock}
                placeholder="Ex: 10" value={quantity}
                onChange={e => { setQuantity(e.target.value); setErrors(p => ({ ...p, quantity: '' })) }}
                style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }} />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
              {selected && qty > 0 && !wouldGoNegative && (
                <span className="form-hint">Estoque ficará em: <strong>{selected.currentStock - qty}</strong> unidades</span>
              )}
              {wouldGoNegative && (
                <div className="alert alert-danger" style={{ marginTop: 8, padding: '10px 14px' }}>
                  <AlertTriangle size={16} />
                  <span>Quantidade maior que o estoque disponível!</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Motivo / Destino</label>
              <input className="form-input" placeholder="Ex: Venda, uso interno, doação..." value={reason}
                onChange={e => setReason(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Referência</label>
              <input className="form-input" placeholder="Ex: Pedido #123, cliente..." value={reference}
                onChange={e => setReference(e.target.value)} />
            </div>

            {success && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>Saída registrada! O estoque foi atualizado.</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', background: '#dc2626' }} disabled={saving || !selected || selected.currentStock === 0}>
              <PackageMinus size={20} />
              {saving ? 'Registrando...' : 'Confirmar Saída do Estoque'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
