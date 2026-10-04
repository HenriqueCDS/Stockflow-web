import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
<<<<<<< HEAD
import { Package, PackagePlus, PackageMinus, AlertTriangle, BarChart3, FileText } from 'lucide-react'
import { dashboardApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeLabel = { ENTRY: 'Entrada', EXIT: 'Saída', ADJUSTMENT: 'Ajuste', RETURN: 'Devolução' }
=======
import { Package, PackagePlus, PackageMinus, AlertTriangle, BarChart3, DollarSign, ArrowUpCircle, ArrowDownCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { dashboardApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeIcons = {
  ENTRY: { Icon: ArrowUpCircle, color: '#16a34a' },
  EXIT: { Icon: ArrowDownCircle, color: '#dc2626' },
  ADJUSTMENT: { Icon: RefreshCw, color: '#2563eb' },
  RETURN: { Icon: RotateCcw, color: '#7c3aed' }
}
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
<<<<<<< HEAD
      .then(r => setReport(r.data))
=======
      .then(setData)
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const quickActions = [
    { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada no Estoque', desc: 'Registre a chegada de produtos', color: '#16a34a', bg: '#dcfce7' },
    { to: '/saida', icon: PackageMinus, label: 'Registrar Saída', desc: 'Informe produtos que saíram', color: '#ff7a00', bg: '#fbeadb' },
    { to: '/produtos', icon: Package, label: 'Gerenciar Produtos', desc: 'Adicione ou edite produtos', color: '#7c3aed', bg: '#ede9fe' },
    { to: '/notas', icon: FileText, label: 'Notas Fiscais', desc: 'Importe NFC-e pelo QR Code', color: '#0284c7', bg: '#e0f2fe' },
    { to: '/relatorios', icon: BarChart3, label: 'Ver Relatórios', desc: 'Resumo completo do estoque', color: '#d97706', bg: '#fef3c7' },
  ]

  const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').toUpperCase()

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">{today}</div>
          <h1 className="page-title">Olá, bem-vindo!</h1>
        </div>
      </div>

<<<<<<< HEAD
      {loading ? <LoadingSpinner text="Carregando informações..." /> : report && (
=======
      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 52, height: 52, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={26} color={color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      {loading ? <LoadingSpinner text="Carregando informações..." /> : data && (
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
        <>
          <div className="stats-grid">
<<<<<<< HEAD
            <div className="metric-card highlight">
              <div className="eyebrow">Valor estoque</div>
              <div className="metric-value" style={{ color: '#ff7a00' }}>{fmt(report.totalStockValue)}</div>
              <div className="metric-note">{report.activeProducts} produtos ativos</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Produtos</div>
              <div className="metric-value">{report.totalProducts}</div>
              <div className="metric-note">cadastrados</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Estoque baixo</div>
              <div className="metric-value" style={{ color: '#d97706' }}>{report.lowStockProducts}</div>
              <div className="metric-note">abaixo do mínimo</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Notas pendentes</div>
              <div className="metric-value" style={{ color: '#dc2626' }}>{report.pendingInvoices}</div>
              <div className="metric-note">de {report.totalInvoices} notas</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Movimentações recentes</h2>
              {(report.recentMovements || []).length === 0 ? (
                <p className="metric-note" style={{ padding: '16px 0' }}>Nenhuma movimentação ainda.</p>
              ) : report.recentMovements.slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e6e4dc' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.productName}</div>
                    <div className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0 }}>{typeLabel[m.type] || m.type} · {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <strong>{m.type === 'EXIT' ? '-' : '+'}{m.quantity}</strong>
                </div>
              ))}
              <Link to="/historico" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Ver histórico</Link>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Maiores valores em estoque</h2>
              {(report.topProducts || []).length === 0 ? (
                <p className="metric-note" style={{ padding: '16px 0' }}>Nenhum produto com estoque.</p>
              ) : report.topProducts.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e6e4dc' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0 }}>{p.currentStock} em estoque</div>
                  </div>
                  <strong>{fmt(p.totalValue)}</strong>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ações rápidas</h2>
              {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
                <Link key={to} to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: '1px solid #e6e4dc' }}>
                  <div style={{ width: 40, height: 40, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#6b6b66' }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {report.lowStockProducts > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Atenção!</strong> {report.lowStockProducts} produto(s) estão com estoque abaixo do mínimo.
=======
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <Package size={26} color="#2563eb" />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#2563eb' }}>{data.totalProducts}</h3>
                <p>Produtos cadastrados</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <Package size={26} color="#16a34a" />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#16a34a' }}>{data.activeProducts}</h3>
                <p>Produtos ativos</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <AlertTriangle size={26} color="#d97706" />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#d97706' }}>{data.lowStockProducts}</h3>
                <p>Com estoque baixo</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ede9fe' }}>
                <DollarSign size={26} color="#7c3aed" />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#7c3aed', fontSize: 20 }}>{formatCurrency(data.totalStockValue)}</h3>
                <p>Valor total em estoque</p>
              </div>
            </div>
          </div>

          {data.lowStockProducts > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Atenção!</strong> {data.lowStockProducts} produto(s) estão com estoque abaixo do mínimo.
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
                <Link to="/relatorios" style={{ marginLeft: 8, color: '#92400e', fontWeight: 600 }}>Ver detalhes →</Link>
              </div>
            </div>
          )}

          {data.recentMovements?.length > 0 && (
            <div className="card" style={{ marginTop: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Movimentações Recentes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.recentMovements.map(m => {
                  const { Icon, color } = typeIcons[m.type] || typeIcons.ENTRY
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid #f1f5f9' }}>
                      <Icon size={20} color={color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.productName}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(m.createdAt)}</div>
                      </div>
                      <div style={{ fontWeight: 700, color }}>{m.type === 'EXIT' ? '-' : '+'}{m.quantity}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
