import React, { useEffect, useState } from 'react'
import { History as HistoryIcon, ArrowUpCircle, ArrowDownCircle, RefreshCw, RotateCcw, Filter } from 'lucide-react'
import { stockApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeConfig = {
  ENTRY: { label: 'Entrada', color: '#16a34a', bg: '#dcfce7', Icon: ArrowUpCircle },
  EXIT: { label: 'Saída', color: '#dc2626', bg: '#fee2e2', Icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajuste', color: '#2563eb', bg: '#dbeafe', Icon: RefreshCw },
  RETURN: { label: 'Devolução', color: '#7c3aed', bg: '#ede9fe', Icon: RotateCcw }
}

const PAGE_SIZE = 20

export default function History({ showToast }) {
  const [movements, setMovements] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = (targetPage = 0) => {
    setLoading(true)
    stockApi.list({ page: targetPage, size: PAGE_SIZE })
      .then(data => {
        setMovements(data.content)
        setPage(data.page)
        setTotalPages(data.totalPages)
      })
      .catch(() => showToast('Erro ao carregar histórico', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  const formatDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const visible = filter === 'ALL' ? movements : movements.filter(m => m.type === filter)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Movimentações</h1>
          <p className="page-subtitle">Todas as entradas e saídas registradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: 14, color: '#64748b', marginRight: 4 }}>Filtrar por (nesta página):</span>
          {['ALL', 'ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="btn" style={{ padding: '7px 16px', fontSize: 14,
                background: filter === t ? '#2563eb' : '#f1f5f9',
                color: filter === t ? 'white' : '#475569', border: 'none' }}>
              {t === 'ALL' ? 'Todos' : typeConfig[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : visible.length === 0 ? (
          <div className="empty-state">
            <HistoryIcon size={48} />
            <p>Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Antes → Depois</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(m => {
                  const { label, color, bg, Icon } = typeConfig[m.type] || typeConfig.ENTRY
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: 14, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(m.createdAt)}</td>
                      <td>
                        <span className="badge" style={{ background: bg, color }}>
                          <Icon size={13} /> {label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.productName}</div>
                      </td>
                      <td><span style={{ fontSize: 18, fontWeight: 700, color }}>{m.type === 'EXIT' ? '-' : '+'}{m.quantity}</span></td>
                      <td style={{ fontSize: 14 }}>
                        <span style={{ color: '#64748b' }}>{m.stockBefore}</span>
                        <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{m.stockAfter}</span>
                      </td>
                      <td style={{ fontSize: 14, color: '#64748b' }}>{m.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: '1px solid #e2e8f0' }}>
            <button className="btn btn-outline" disabled={page === 0} onClick={() => load(page - 1)}>Anterior</button>
            <span style={{ fontSize: 14, color: '#64748b' }}>Página {page + 1} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima</button>
          </div>
        )}
      </div>
    </div>
  )
}
