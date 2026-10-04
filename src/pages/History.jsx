import React, { useEffect, useState } from 'react'
import { History as HistoryIcon, ArrowUpCircle, ArrowDownCircle, RefreshCw, Filter } from 'lucide-react'
import { stockApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeConfig = {
  ENTRY: { label: 'Entrada', color: '#16a34a', bg: '#dcfce7', Icon: ArrowUpCircle },
  EXIT: { label: 'Saída', color: '#dc2626', bg: '#fee2e2', Icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajuste', color: '#ff7a00', bg: '#fbeadb', Icon: RefreshCw },
  RETURN: { label: 'Devolução', color: '#0284c7', bg: '#e0f2fe', Icon: ArrowUpCircle }
}

export default function History({ showToast }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = () => {
    setLoading(true)
    stockApi.getMovements()
      .then(r => setMovements(r.data.content || []))
      .catch(() => showToast('Erro ao carregar histórico', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const visible = filter === 'ALL' ? movements : movements.filter(m => m.type === filter)

  const formatDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

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
          <Filter size={16} color="#6b6b66" />
          <span style={{ fontSize: 14, color: '#6b6b66', marginRight: 4 }}>Filtrar por:</span>
          {['ALL', 'ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="btn" style={{ padding: '7px 16px', fontSize: 14,
                background: filter === t ? '#ff7a00' : '#f1f0ea',
                color: filter === t ? 'white' : '#4a4a46', border: 'none' }}>
              {t === 'ALL' ? 'Todos' : t === 'ENTRY' ? 'Entradas' : t === 'EXIT' ? 'Saídas' : t === 'ADJUSTMENT' ? 'Ajustes' : 'Devoluções'}
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
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(m => {
                  const { label, color, bg, Icon } = typeConfig[m.type] || typeConfig.ENTRY
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: 14, color: '#6b6b66', whiteSpace: 'nowrap' }}>{formatDate(m.createdAt)}</td>
                      <td>
                        <span className="badge" style={{ background: bg, color }}>
                          <Icon size={13} /> {label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.productName}</div>
                        {m.reference && <div style={{ fontSize: 12, color: '#9a9a92' }}>{m.reference}</div>}
                      </td>
                      <td><span style={{ fontSize: 18, fontWeight: 700, color }}>{m.type === 'EXIT' ? '-' : '+'}{m.quantity}</span></td>
                      <td style={{ fontSize: 14 }}>
                        <span style={{ color: '#6b6b66' }}>{m.stockBefore}</span>
                        <span style={{ margin: '0 6px', color: '#9a9a92' }}>→</span>
                        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{m.stockAfter}</span>
                      </td>
                      <td style={{ fontSize: 14, color: '#6b6b66' }}>{m.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
