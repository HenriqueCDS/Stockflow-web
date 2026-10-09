import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Trash2, Check, PackagePlus, Undo2 } from 'lucide-react'
import { shoppingListApi, houseApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'

export default function ShoppingList({ showToast }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [members, setMembers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    shoppingListApi.list()
      .then(data => setItems(data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    houseApi.members()
      .then(list => setMembers(Object.fromEntries((list || []).map(m => [m.id, m.name]))))
      .catch(() => {})
  }, [load])

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

  const handleToggle = async (item) => {
    setBusyId(item.id)
    try {
      if (item.checked) await shoppingListApi.uncheck(item.id)
      else await shoppingListApi.check(item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i))
    } catch (err) {
      showToast(item.checked ? `Não foi possível desfazer: ${err.message}` : err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyId(item.id)
    try {
      await shoppingListApi.remove(item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
      showToast(`"${item.name}" removido da lista`, 'success', {
        label: 'Desfazer',
        onClick: async () => {
          try {
            const restored = await shoppingListApi.create({ name: item.name, quantity: item.quantity ?? undefined })
            setItems(prev => [...prev, restored])
          } catch (err) {
            showToast(err.message, 'error')
          }
        }
      })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)
  const pct = items.length ? (checked.length / items.length) * 100 : 0

  const goToEntry = () => {
    const names = checked.map(i => i.name).join('|')
    navigate(`/entrada?itens=${encodeURIComponent(names)}`)
  }

  const origin = (item) => {
    const auto = item.automatic || item.auto || item.source === 'AUTOMATIC' || item.source === 'AUTO'
    if (auto) {
      return <span className="badge badge-warning">Abaixo do mínimo{item.currentStock != null && item.minimumStock != null ? ` · ${item.currentStock} de ${item.minimumStock}` : ''}</span>
    }
    const who = members[item.createdBy]
    return who ? <Avatar name={who} size={22} /> : null
  }

  const renderItem = (item) => (
    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: item.checked ? 'var(--surface-2)' : 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => handleToggle(item)} disabled={busyId === item.id}
        aria-label={item.checked ? 'Desfazer: marcar como não comprado' : 'Marcar como comprado'}
        style={{
          width: 24, height: 24, borderRadius: '50%', border: '2px solid ' + (item.checked ? 'var(--good)' : 'var(--muted)'),
          background: item.checked ? 'var(--good)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
        {item.checked && <Check size={14} color="var(--surface)" />}
      </button>
      <div style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--muted)' : 'var(--text)' }}>
        <span style={{ fontWeight: 600 }}>{item.name}</span>
        {item.quantity != null && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--muted)' }}>x{item.quantity}</span>}
      </div>
      {origin(item)}
      {item.checked && (
        <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 13 }} disabled={busyId === item.id} onClick={() => handleToggle(item)}>
          <Undo2 size={13} /> Desfazer
        </button>
      )}
      <button className="btn" style={{ padding: '6px 10px', background: 'var(--bad-soft)', color: 'var(--bad)', border: 'none' }}
        disabled={busyId === item.id} onClick={() => handleRemove(item)} aria-label={`Remover ${item.name}`}>
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
        {checked.length > 0 && (
          <button className="btn btn-primary" onClick={goToEntry}>
            <PackagePlus size={18} /> Dar entrada nos comprados ({checked.length})
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 200 }} placeholder="Adicionar item (ex: Fósforos)" aria-label="Novo item"
            value={name} onChange={e => setName(e.target.value)} />
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} type="number" min="0" step="any" placeholder="Qtd." aria-label="Quantidade"
            value={quantity} onChange={e => setQuantity(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            <Plus size={18} /> Adicionar
          </button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <div className="card"><ErrorState onRetry={load} /></div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={ShoppingCart} title="Lista vazia" text="Itens abaixo do mínimo entram aqui sozinhos. Você também pode adicionar o que quiser.">
            <button className="btn btn-primary" onClick={() => document.querySelector('input[aria-label="Novo item"]')?.focus()}>
              <Plus size={16} /> Adicionar item
            </button>
          </EmptyState>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <strong>{checked.length} de {items.length} comprados</strong>
              <span className="eyebrow">{Math.round(pct)}%</span>
            </div>
            <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Para comprar ({pending.length})</h2>
            {pending.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nada pendente por aqui.</p>
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
