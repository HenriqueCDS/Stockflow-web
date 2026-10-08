import React, { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Trash2, Check } from 'lucide-react'
import { shoppingListApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ShoppingList({ showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    shoppingListApi.list()
      .then(data => setItems(data || []))
      .catch(() => showToast('Erro ao carregar lista de compras', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const item = await shoppingListApi.create({ name: name.trim(), quantity: quantity !== '' ? Number(quantity) : undefined })
      setItems(prev => [...prev, item])
      setName(''); setQuantity('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCheck = async (item) => {
    setBusyId(item.id)
    try {
      await shoppingListApi.check(item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: true } : i))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyId(item.id)
    try {
      await shoppingListApi.remove(item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  const renderItem = (item) => (
    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: item.checked ? '#f6f5f0' : 'white', border: '1px solid #e6e4dc' }}>
      <button onClick={() => !item.checked && handleCheck(item)} disabled={item.checked || busyId === item.id}
        aria-label={item.checked ? 'Já comprado' : 'Marcar como comprado'}
        style={{
          width: 24, height: 24, borderRadius: '50%', border: '2px solid ' + (item.checked ? '#16a34a' : '#9a9a92'),
          background: item.checked ? '#16a34a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: item.checked ? 'default' : 'pointer'
        }}>
        {item.checked && <Check size={14} color="white" />}
      </button>
      <div style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#9a9a92' : '#1a1a1a' }}>
        <span style={{ fontWeight: 600 }}>{item.name}</span>
        {item.quantity != null && <span style={{ marginLeft: 8, fontSize: 13, color: '#9a9a92' }}>x{item.quantity}</span>}
      </div>
      <button className="btn" style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
        disabled={busyId === item.id} onClick={() => handleRemove(item)} aria-label="Remover item">
        <Trash2 size={14} />
      </button>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lista de Compras</h1>
          <p className="page-subtitle">Compartilhada com todos da casa — itens abaixo do mínimo entram automaticamente</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 200 }} placeholder="Adicionar item (ex: Fósforos)"
            value={name} onChange={e => setName(e.target.value)} />
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} type="number" min="0" step="any" placeholder="Qtd."
            value={quantity} onChange={e => setQuantity(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            <Plus size={18} /> Adicionar
          </button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <div className="card empty-state">
          <ShoppingCart size={48} />
          <p>Sua lista de compras está vazia</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Para comprar ({pending.length})</h2>
            {pending.length === 0 ? (
              <p style={{ color: '#9a9a92', fontSize: 14 }}>Nada pendente por aqui.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{pending.map(renderItem)}</div>
            )}
          </div>

          {checked.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Já comprados ({checked.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{checked.map(renderItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
