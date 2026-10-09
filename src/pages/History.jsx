import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { History as HistoryIcon, ArrowUpCircle, ArrowDownCircle, RefreshCw, RotateCcw, Check, XCircle, Filter } from 'lucide-react'
import { stockApi, houseApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'

const typeConfig = {
  ENTRY: { label: 'Entrada', color: 'var(--good)', bg: 'var(--good-soft)', Icon: ArrowUpCircle },
  USED: { label: 'Usei', color: 'var(--info)', bg: 'var(--info-soft)', Icon: Check },
  DISCARDED: { label: 'Descartei', color: 'var(--bad)', bg: 'var(--bad-soft)', Icon: XCircle },
  EXIT: { label: 'Saída', color: 'var(--bad)', bg: 'var(--bad-soft)', Icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajuste', color: 'var(--primary-ink)', bg: 'var(--primary-soft)', Icon: RefreshCw },
  RETURN: { label: 'Devolução', color: 'var(--info)', bg: 'var(--info-soft)', Icon: RotateCcw }
}

const PERIODS = [
  { key: 'all', label: 'Tudo' },
  { key: '7', label: 'Últimos 7 dias' },
  { key: '30', label: 'Últimos 30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'custom', label: 'Personalizado' },
]

const PAGE_SIZE = 20
const day = d => new Date(d).toISOString().slice(0, 10)

function periodRange(period, customFrom, customTo) {
  const now = new Date()
  if (period === '7' || period === '30') {
    const from = new Date(now); from.setDate(from.getDate() - Number(period))
    return { from: day(from), to: day(now) }
  }
  if (period === 'month') return { from: day(new Date(now.getFullYear(), now.getMonth(), 1)), to: day(now) }
  if (period === 'custom') return { from: customFrom || undefined, to: customTo || undefined }
  return {}
}

function dayHeading(iso) {
  const d = new Date(iso)
  const start = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(new Date()) - start(d)) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function History({ showToast }) {
  const [movements, setMovements] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [period, setPeriod] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [memberNames, setMemberNames] = useState({})

  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])

  const load = useCallback((targetPage = 0) => {
    setLoading(true)
    setError(false)
    // type/from/to dependem do backend; o filtro abaixo garante o resultado mesmo se ele ignorar os parâmetros.
    stockApi.list({
      page: targetPage, size: PAGE_SIZE,
      type: filter === 'ALL' ? undefined : filter, from: range.from, to: range.to
    })
      .then(data => {
        setMovements(data.content)
        setPage(data.page)
        setTotalPages(data.totalPages)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [filter, range])

  useEffect(() => { load(0) }, [load])

  useEffect(() => {
    houseApi.members()
      .then(members => setMemberNames(Object.fromEntries(members.map(m => [m.id, m.name]))))
      .catch(() => {})
  }, [])

  const formatTime = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const visible = useMemo(() => movements.filter(m =>
    (filter === 'ALL' || m.type === filter) &&
    (!range.from || day(m.createdAt) >= range.from) &&
    (!range.to || day(m.createdAt) <= range.to)
  ), [movements, filter, range])

  const groups = useMemo(() => {
    const out = []
    visible.forEach(m => {
      const key = day(m.createdAt)
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(m)
      else out.push({ key, heading: dayHeading(m.createdAt), items: [m] })
    })
    return out
  }, [visible])

  const filtering = filter !== 'ALL' || period !== 'all'
  const periodLabel = PERIODS.find(p => p.key === period)?.label.toLowerCase()
  const clearFilters = () => { setFilter('ALL'); setPeriod('all'); setCustomFrom(''); setCustomTo('') }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Movimentações</h1>
          <p className="page-subtitle">Todas as entradas e saídas registradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--muted)" />
          <span style={{ fontSize: 14, color: 'var(--muted)', marginRight: 4 }}>Tipo:</span>
          {['ALL', 'ENTRY', 'USED', 'DISCARDED', 'EXIT', 'ADJUSTMENT', 'RETURN'].map(t => (
            <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={`chip${filter === t ? ' active' : ''}`}>
              {t === 'ALL' ? 'Todos' : typeConfig[t].label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--muted)', marginRight: 4, marginLeft: 24 }}>Período:</span>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} aria-pressed={period === p.key} className={`chip${period === p.key ? ' active' : ''}`}>{p.label}</button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" className="form-input" style={{ padding: '4px 8px', fontSize: 14 }} value={customFrom} max={customTo || undefined}
                onChange={e => setCustomFrom(e.target.value)} aria-label="De" />
              <span style={{ color: 'var(--muted)' }}>até</span>
              <input type="date" className="form-input" style={{ padding: '4px 8px', fontSize: 14 }} value={customTo} min={customFrom || undefined}
                onChange={e => setCustomTo(e.target.value)} aria-label="Até" />
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : error ? (
          <ErrorState onRetry={() => load(page)} />
        ) : visible.length === 0 ? (
          filtering ? (
            <EmptyState icon={HistoryIcon}
              title={`Nenhuma ${filter !== 'ALL' ? typeConfig[filter].label.toLowerCase() : 'movimentação'}${period !== 'all' ? ` em "${periodLabel}"` : ''}`}
              text="Tente outro filtro ou período.">
              <button className="btn btn-primary" onClick={clearFilters}>Limpar filtros</button>
            </EmptyState>
          ) : (
            <EmptyState icon={HistoryIcon} title="Nenhuma movimentação ainda" text="Quando você der entrada ou saída em um produto, ela aparece aqui." />
          )
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Antes → Depois</th>
                  <th>Quem fez</th>
                  <th>Observações</th>
                </tr>
              </thead>
              {groups.map(g => (
                <tbody key={g.key}>
                  <tr>
                    <td colSpan={7} style={{ background: 'var(--surface-2)', padding: '8px 16px' }}>
                      <span className="eyebrow" style={{ textTransform: 'capitalize' }}>{g.heading}</span>
                    </td>
                  </tr>
                  {g.items.map(m => {
                    const { label, color, bg, Icon } = typeConfig[m.type] || typeConfig.ENTRY
                    const who = memberNames[m.createdBy]
                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: 14, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatTime(m.createdAt)}</td>
                        <td>
                          <span className="badge" style={{ background: bg, color }}>
                            <Icon size={13} /> {label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.productName}</div>
                          {m.reference && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.reference}</div>}
                        </td>
                        <td><span style={{ fontSize: 18, fontWeight: 700, color }}>{['EXIT', 'USED', 'DISCARDED'].includes(m.type) ? '-' : '+'}{m.quantity}</span></td>
                        <td style={{ fontSize: 14 }}>
                          <span style={{ color: 'var(--muted)' }}>{m.stockBefore}</span>
                          <span style={{ margin: '0 6px', color: 'var(--muted)' }}>→</span>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{m.stockAfter}</span>
                        </td>
                        <td style={{ fontSize: 14 }}>
                          {who ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar name={who} size={24} />{who}</span> : '—'}
                        </td>
                        <td style={{ fontSize: 14, color: 'var(--muted)' }}>{m.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline" disabled={page === 0} onClick={() => load(page - 1)}>Anterior</button>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Página {page + 1} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima</button>
          </div>
        )}
      </div>
    </div>
  )
}
