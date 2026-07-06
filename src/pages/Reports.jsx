import React, { useEffect, useState } from 'react'
import { BarChart3, AlertTriangle, TrendingDown, Package, RefreshCw, FileText, Trophy } from 'lucide-react'
import { dashboardApi, productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Reports({ showToast }) {
  const [dashboard, setDashboard] = useState(null)
  const [belowMinimum, setBelowMinimum] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      dashboardApi.get(),
      productApi.list({ belowMinimum: true, size: 200, sort: 'name' })
    ])
      .then(([dashboardData, productsData]) => {
        setDashboard(dashboardData)
        setBelowMinimum(productsData.content)
      })
      .catch(() => showToast('Erro ao carregar relatório', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const outOfStock = belowMinimum.filter(p => p.currentStock <= 0)
  const lowStock = belowMinimum.filter(p => p.currentStock > 0)

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

      {loading ? <LoadingSpinner text="Gerando relatório..." /> : dashboard && (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}><Package size={26} color="#2563eb" /></div>
              <div className="stat-info"><h3 style={{ color: '#2563eb' }}>{dashboard.totalProducts}</h3><p>Total de produtos</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}><Package size={26} color="#16a34a" /></div>
              <div className="stat-info"><h3 style={{ color: '#16a34a' }}>{dashboard.activeProducts}</h3><p>Produtos ativos</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}><AlertTriangle size={26} color="#d97706" /></div>
              <div className="stat-info"><h3 style={{ color: '#d97706' }}>{dashboard.lowStockProducts}</h3><p>Estoque baixo</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ede9fe' }}><FileText size={26} color="#7c3aed" /></div>
              <div className="stat-info"><h3 style={{ color: '#7c3aed' }}>{dashboard.pendingInvoices}</h3><p>Notas pendentes de {dashboard.totalInvoices}</p></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', borderRadius: 16 }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>VALOR TOTAL DO ESTOQUE</div>
            <div style={{ fontSize: 42, fontWeight: 800 }}>{formatCurrency(dashboard.totalStockValue)}</div>
          </div>

          {dashboard.topProducts?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Trophy size={20} color="#d97706" />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos com Maior Valor em Estoque</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dashboard.topProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(p.totalValue)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.currentStock} em estoque</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={20} color="#d97706" />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos com Estoque Baixo</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lowStock.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: '#92400e' }}>Mínimo: {p.minimumStock} unidades</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{p.currentStock}</div>
                      <div style={{ fontSize: 12, color: '#92400e' }}>disponíveis</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outOfStock.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingDown size={20} color="#dc2626" />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos Sem Estoque</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {outOfStock.map(p => (
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
