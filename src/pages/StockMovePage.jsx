import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackagePlus, PackageMinus, Search, AlertTriangle, ArrowRight } from 'lucide-react'
import { productApi, stockApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

const CONFIG = {
  ENTRY: {
    title: 'Dar Entrada no Estoque', subtitle: 'Registre a chegada de novos produtos',
    qtyLabel: 'Quantidade que chegou', noteLabel: 'Motivo / Observação',
    reasons: ['Compra', 'Doação', 'Devolução'], shortcuts: [1, 5, 10],
    button: 'Confirmar Entrada no Estoque', toast: 'Entrada', Icon: PackagePlus, btnClass: 'btn-success',
  },
  EXIT: {
    title: 'Registrar Saída', subtitle: 'Informe os produtos que saíram do estoque',
    qtyLabel: 'Quantidade que saiu', noteLabel: 'Motivo / Destino',
    reasons: ['Consumo', 'Doação', 'Perda'], shortcuts: [1, 5, 10],
    button: 'Confirmar Saída do Estoque', toast: 'Saída', Icon: PackageMinus, btnClass: 'btn-danger',
  },
}

const recentKey = type => `homestock-recent-${type}`
const readRecent = type => {
  try { return JSON.parse(localStorage.getItem(recentKey(type))) || [] } catch { return [] }
}
const writeRecent = (type, ids) => {
  try { localStorage.setItem(recentKey(type), JSON.stringify(ids.slice(0, 3))) } catch { /* sem storage */ }
}

export default function StockMovePage({ kind, showToast }) {
  const cfg = CONFIG[kind]
  const isExit = kind === 'EXIT'
  const [params] = useSearchParams()
  const searchRef = useRef(null)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState(0)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const [recent, setRecent] = useState(() => readRecent(kind))

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    productApi.list({ active: true, size: 500, sort: 'name' })
      .then(data => {
        setProducts(data.content)
        const wanted = params.get('produto')
        if (wanted) {
          const found = data.content.find(p => String(p.id) === wanted)
          if (found) setSelected(found)
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [params])

  useEffect(() => { load() }, [load])
  useEffect(() => { searchRef.current?.focus() }, [loading])

  const term = search.trim().toLowerCase()
  const filtered = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(term) || (p.ean || '').toLowerCase().includes(term)
  ), [products, term])

  // Itens vindos da lista de compras (/entrada?itens=Arroz|Feijão)
  const listProducts = useMemo(() => {
    const names = (params.get('itens') || '').split('|').map(n => n.trim().toLowerCase()).filter(Boolean)
    return names.map(n => products.find(p => p.name.toLowerCase() === n)).filter(Boolean)
  }, [params, products])

  const recentProducts = useMemo(
    () => recent.map(id => products.find(p => p.id === id)).filter(Boolean),
    [recent, products]
  )

  useEffect(() => { setCursor(0) }, [term])

  const choose = (p) => {
    setSelected(p)
    setTouched(false)
  }

  const onSearchKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && filtered[cursor]) { e.preventDefault(); choose(filtered[cursor]) }
  }

  const stock = selected ? Number(selected.currentStock) : 0
  const unit = (selected?.unit || 'UN').toUpperCase()
  const qty = Number(quantity) || 0
  const after = selected ? (isExit ? stock - qty : stock + qty) : 0
  const min = selected?.minimumStock != null ? Number(selected.minimumStock) : null
  const negative = after < 0
  const belowMin = !negative && min != null && after < min

  // Validação ao digitar
  let qtyError = ''
  if (quantity !== '' && qty <= 0) qtyError = 'Informe uma quantidade maior que zero'
  else if (isExit && selected && qty > stock) qtyError = `Só há ${stock} ${unit}.`

  let blocker = ''
  if (!selected) blocker = 'Escolha um produto'
  else if (isExit && stock <= 0) blocker = 'Este produto não tem estoque disponível'
  else if (quantity === '' || qty <= 0) blocker = 'Informe a quantidade'
  else if (qtyError) blocker = 'Corrija a quantidade'

  const setQty = (v) => { setQuantity(String(v)); setTouched(true) }
  const step = (d) => setQty(Math.max(0, qty + d) || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (blocker) return
    setSaving(true)
    const note = [reason, notes.trim()].filter(Boolean).join(' · ')
    try {
      const movement = await stockApi.adjust({
        productId: selected.id, type: kind, quantity: qty, notes: note || undefined
      })
      const updated = { ...selected, currentStock: movement.stockAfter }
      setSelected(updated)
      setProducts(ps => ps.map(x => x.id === selected.id ? updated : x))
      const ids = [selected.id, ...recent.filter(id => id !== selected.id)].slice(0, 3)
      setRecent(ids); writeRecent(kind, ids)
      setQuantity(''); setNotes(''); setReason(''); setTouched(false)
      showToast(`${cfg.toast} de ${qty} ${unit} registrada em "${selected.name}"`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const ProductRow = ({ p, index }) => {
    const active = selected?.id === p.id
    const out = Number(p.currentStock) <= 0
    return (
      <div role="option" aria-selected={active} onClick={() => choose(p)}
        style={{
          padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
          border: '2px solid ' + (active ? 'var(--primary)' : index === cursor && term ? 'var(--border-strong)' : 'var(--border)'),
          background: active ? 'var(--primary-soft)' : 'var(--surface)',
          opacity: isExit && out ? 0.5 : 1, transition: 'all 0.15s'
        }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>
          {p.ean && <><span>EAN: {p.ean}</span><span>•</span></>}
          <span style={{ color: out ? 'var(--bad)' : 'var(--good)', fontWeight: 600 }}>
            {out ? 'Sem estoque' : `${p.currentStock} disponíveis`}
          </span>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{cfg.title}</h1>
          <p className="page-subtitle">{cfg.subtitle}</p>
        </div>
      </div>

      {loadError ? (
        <div className="card"><ErrorState onRetry={load} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Seleção do produto */}
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>1. Escolha o Produto</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, border: '2px solid var(--border)' }}>
              <Search size={18} color="var(--muted)" />
              <input ref={searchRef} placeholder="Digite o nome ou EAN…  (↑ ↓ e Enter)" value={search}
                aria-label="Buscar produto" onChange={e => setSearch(e.target.value)} onKeyDown={onSearchKey}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 15, flex: 1, color: 'var(--text)' }} />
            </div>

            {!term && listProducts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Da lista de compras</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {listProducts.map(p => (
                    <button key={p.id} className={`chip${selected?.id === p.id ? ' active' : ''}`} onClick={() => choose(p)}>{p.name}</button>
                  ))}
                </div>
              </div>
            )}

            {!term && recentProducts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Recentes</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {recentProducts.map(p => (
                    <button key={p.id} className={`chip${selected?.id === p.id ? ' active' : ''}`} onClick={() => choose(p)}>{p.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div role="listbox" aria-label="Produtos" style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((p, i) => <ProductRow key={p.id} p={p} index={i} />)}
              {filtered.length === 0 && (
                <EmptyState icon={Search} title="Nenhum produto encontrado"
                  text={products.length === 0 ? 'Cadastre produtos em Estoque para começar.' : 'Tente outro nome ou código.'} />
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>2. Informações da {isExit ? 'Saída' : 'Entrada'}</h2>

            {selected ? (
              <div style={{ background: 'var(--primary-soft)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--primary)' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
                  Estoque atual: <strong style={{ fontSize: 18, color: stock <= 0 ? 'var(--bad)' : 'var(--text)' }}>{stock}</strong> {unit}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
                ← Selecione um produto ao lado
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="qty">{cfg.qtyLabel} <span>*</span></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <button type="button" className="btn btn-outline" aria-label="Diminuir" onClick={() => step(-1)} disabled={qty <= 0} style={{ padding: '0 16px' }}>−</button>
                  <input id="qty" className={`form-input${qtyError ? ' error' : ''}`} type="number" min="0" step="any"
                    placeholder="0" value={quantity}
                    onChange={e => { setQuantity(e.target.value); setTouched(true) }}
                    style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', flex: 1, minWidth: 0 }} />
                  <button type="button" className="btn btn-outline" aria-label="Aumentar" onClick={() => step(1)}
                    disabled={isExit && selected && qty >= stock} style={{ padding: '0 16px' }}>+</button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {cfg.shortcuts.map(n => (
                    <button key={n} type="button" className="chip" onClick={() => setQty(isExit ? Math.min(n, stock || n) : qty + n)}>
                      {isExit ? n : `+${n}`}
                    </button>
                  ))}
                  {isExit && selected && stock > 0 && (
                    <button type="button" className="chip" onClick={() => setQty(stock)}>Tudo</button>
                  )}
                </div>
                {qtyError && touched && (
                  <span className="form-error" role="alert">
                    {qtyError}
                    {isExit && selected && qty > stock && stock > 0 && (
                      <> <button type="button" onClick={() => setQty(stock)} style={{ background: 'none', border: 'none', color: 'var(--primary-ink)', fontWeight: 700, textDecoration: 'underline' }}>Registrar {stock}</button></>
                    )}
                  </span>
                )}
              </div>

              {selected && qty > 0 && (
                <div role="status" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 20,
                  background: negative ? 'var(--bad-soft)' : belowMin ? 'var(--warn-soft)' : 'var(--surface-2)',
                  color: negative ? 'var(--bad)' : belowMin ? 'var(--warn)' : 'var(--text)',
                  border: '1px solid ' + (negative ? 'var(--bad)' : belowMin ? 'var(--warn)' : 'var(--border)'),
                }}>
                  <span className="eyebrow" style={{ color: 'inherit' }}>Estoque</span>
                  <strong style={{ fontFamily: 'var(--mono)' }}>{stock}</strong>
                  <ArrowRight size={16} />
                  <strong style={{ fontFamily: 'var(--mono)', fontSize: 18 }}>{after}</strong>
                  <span style={{ fontSize: 13, marginLeft: 'auto' }}>
                    {negative ? 'Ficaria negativo' : belowMin ? <><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Abaixo do mínimo ({min})</> : unit}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="reason">{cfg.noteLabel}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cfg.reasons.map(r => (
                    <button key={r} type="button" className={`chip${reason === r ? ' active' : ''}`} aria-pressed={reason === r}
                      onClick={() => setReason(reason === r ? '' : r)}>{r}</button>
                  ))}
                </div>
                <input id="reason" className="form-input" placeholder="Detalhe opcional (ex: NF-001)" value={notes}
                  onChange={e => setNotes(e.target.value)} />
              </div>

              <button type="submit" className={`btn ${cfg.btnClass} btn-lg`} style={{ width: '100%', justifyContent: 'center' }}
                disabled={saving || !!blocker}>
                <cfg.Icon size={20} />
                {saving ? 'Registrando...' : cfg.button}
              </button>
              {blocker && !saving && (
                <p className="form-hint" style={{ textAlign: 'center', marginTop: 8 }}>{blocker}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
