import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, PackagePlus, ScanLine, Home, Package, UserPlus, CheckCircle2, Circle, ShoppingCart } from 'lucide-react'
import { dashboardApi, houseApi, productApi, shoppingListApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import Avatar from '../components/Avatar'

const typeLabel = { ENTRY: 'Entrada', USED: 'Usei', DISCARDED: 'Descartei', EXIT: 'Saída', ADJUSTMENT: 'Ajuste', RETURN: 'Devolução' }

export default function Dashboard({ showToast }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [attention, setAttention] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [added, setAdded] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    Promise.all([
      dashboardApi.get(),
      productApi.list({ active: true, size: 500, sort: 'name' }).catch(() => ({ content: [] })),
      houseApi.members().catch(() => []),
    ])
      .then(([dash, products, mem]) => {
        setData(dash)
        setAttention(products.content.filter(p => p.belowMinimum || Number(p.currentStock) <= 0).slice(0, 5))
        setMembers(mem || [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const memberName = Object.fromEntries(members.map(m => [m.id, m.name]))
  const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').toUpperCase()

  const addToList = async (p) => {
    const missing = p.minimumStock != null ? Math.max(1, Number(p.minimumStock) - Number(p.currentStock)) : undefined
    try {
      await shoppingListApi.create({ name: p.name, quantity: missing })
      setAdded(a => ({ ...a, [p.id]: true }))
      showToast(`"${p.name}" foi para a lista de compras`)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const firstUse = data && data.totalProducts === 0

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">{today}</div>
          <h1 className="page-title">Olá, bem-vindo!</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/notas" className="btn btn-outline"><ScanLine size={18} /> Escanear nota</Link>
          <Link to="/entrada" className="btn btn-primary"><PackagePlus size={18} /> Dar entrada</Link>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Carregando informações..." /> : error ? (
        <div className="card"><ErrorState onRetry={load} /></div>
      ) : data && (
        <>
          {firstUse && (
            <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--primary)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Primeiros passos</h2>
              <p className="metric-note" style={{ marginBottom: 16 }}>Em três passos o HomeStock já está trabalhando por você.</p>
              {[
                { done: true, icon: Home, label: 'Criar a casa', action: null },
                { done: false, icon: Package, label: 'Colocar produtos no estoque', action: { to: '/notas', text: 'Importar nota' } },
                { done: members.length > 1, icon: UserPlus, label: 'Convidar quem mora com você', action: { to: '/casa', text: 'Ver código' } },
              ].map(({ done, label, action }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  {done ? <CheckCircle2 size={20} color="var(--good)" /> : <Circle size={20} color="var(--muted)" />}
                  <span style={{ flex: 1, fontWeight: 600, color: done ? 'var(--muted)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
                  {!done && action && <Link to={action.to} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13 }}>{action.text}</Link>}
                </div>
              ))}
            </div>
          )}

          <div className="stats-grid">
            <div className="metric-card highlight">
              <div className="eyebrow">Gasto do mês</div>
              <div className="metric-value" style={{ color: 'var(--primary-ink)' }}>{fmt(data.monthlySpend)}</div>
              <div className="metric-note">neste mês</div>
            </div>
            <Link to="/produtos" className="metric-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="eyebrow">Produtos</div>
              <div className="metric-value">{data.totalProducts}</div>
              <div className="metric-note">{data.activeProducts} ativos</div>
            </Link>
            <Link to="/produtos?situacao=baixo" className="metric-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="eyebrow">Estoque baixo</div>
              <div className="metric-value" style={{ color: 'var(--warn)' }}>{data.lowStockProducts}</div>
              <div className="metric-note">abaixo do mínimo</div>
            </Link>
            <Link to="/notas" className="metric-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="eyebrow">Notas para revisar</div>
              <div className="metric-value" style={{ color: data.pendingInvoices > 0 ? 'var(--bad)' : 'var(--text)' }}>{data.pendingInvoices}</div>
              <div className="metric-note">de {data.totalInvoices} notas</div>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Precisa de atenção */}
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="var(--warn)" /> Precisa de atenção
              </h2>
              {attention.length === 0 ? (
                <p className="metric-note" style={{ padding: '16px 0' }}>Tudo em dia: nenhum produto abaixo do mínimo.</p>
              ) : attention.map(p => {
                const min = Number(p.minimumStock) || 0
                const pct = min > 0 ? Math.min(100, (Number(p.currentStock) / min) * 100) : 0
                return (
                  <div key={p.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div className="metric-note">{p.currentStock} de {min || '—'} {p.unit || ''}</div>
                      </div>
                      <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 13 }}
                        disabled={added[p.id]} onClick={() => addToList(p)}>
                        <ShoppingCart size={14} /> {added[p.id] ? 'Na lista' : 'Pôr na lista'}
                      </button>
                    </div>
                    <div className="progress" style={{ marginTop: 8 }}><div style={{ width: `${pct}%`, background: pct === 0 ? 'var(--bad)' : 'var(--warn)' }} /></div>
                  </div>
                )
              })}
            </div>

            {/* Movimentações recentes */}
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Movimentações recentes</h2>
              {(data.recentMovements || []).length === 0 ? (
                <p className="metric-note" style={{ padding: '16px 0' }}>Nenhuma movimentação ainda.</p>
              ) : data.recentMovements.slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <Avatar name={memberName[m.createdBy]} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.productName}</div>
                    <div className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0 }}>
                      {memberName[m.createdBy] ? `${memberName[m.createdBy]} · ` : ''}{typeLabel[m.type] || m.type} · {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <strong>{['EXIT', 'USED', 'DISCARDED'].includes(m.type) ? '-' : '+'}{m.quantity}</strong>
                </div>
              ))}
              <Link to="/historico" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Ver histórico</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
