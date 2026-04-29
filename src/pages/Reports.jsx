import React, { useEffect, useState } from 'react'
import { BarChart3, AlertTriangle, TrendingDown, Package, RefreshCw } from 'lucide-react'
import { reportApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Reports({ showToast }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    reportApi.getGeneralReport()
      .then(r => setReport(r.data))
      .catch(() => showToast('Erro ao carregar relatório', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Visão completa do seu estoque</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Atualizar
        </button>
      </div>

      {loading ? <LoadingSpinner text="Gerando relatório..." /> : report && (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}><Package size={26} color="#2563eb" /></div>
              <div className="stat-info"><h3 style={{ color: '#2563eb' }}>{report.totalProducts}</h3><p>Total de produtos</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}><Package size={26} color="#16a34a" /></div>
              <div className="stat-info"><h3 style={{ color: '#16a34a' }}>{report.activeProducts}</h3><p>Produtos ativos</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}><AlertTriangle size={26} color="#d97706" /></div>
              <div className="stat-info"><h3 style={{ color: '#d97706' }}>{report.productsWithLowStock}</h3><p>Estoque baixo</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2' }}><TrendingDown size={26} color="#dc2626" /></div>
              <div className="stat-info"><h3 style={{ color: '#dc2626' }}>{report.productsOutOfStock}</h3><p>Sem estoque</p></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', borderRadius: 16 }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>VALOR TOTAL DO ESTOQUE</div>
            <div style={{ fontSize: 42, fontWeight: 800 }}>{formatCurrency(report.totalStockValue)}</div>
          </div>

          {report.lowStockProducts?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={20} color="#d97706" />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos com Estoque Baixo</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.lowStockProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: '#92400e' }}>Mínimo: {p.minimumStock} unidades</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{p.quantityInStock}</div>
                      <div style={{ fontSize: 12, color: '#92400e' }}>disponíveis</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.outOfStockProducts?.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingDown size={20} color="#dc2626" />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos Sem Estoque</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.outOfStockProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <span className="badge badge-danger">Sem estoque</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
