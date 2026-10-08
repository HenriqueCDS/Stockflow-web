import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PackagePlus, PackageMinus, AlertTriangle, BarChart3, FileText, ShoppingCart } from 'lucide-react'
import { dashboardApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeLabel = { ENTRY: 'Entrada', USED: 'Usei', DISCARDED: 'Descartei', EXIT: 'Saída', ADJUSTMENT: 'Ajuste', RETURN: 'Devolução' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').toUpperCase()

  const quickActions = [
    { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada no Estoque', desc: 'Registre a chegada de produtos', color: '#16a34a', bg: '#dcfce7' },
    { to: '/saida', icon: PackageMinus, label: 'Registrar Saída', desc: 'Informe produtos que saíram', color: '#ff7a00', bg: '#fbeadb' },
    { to: '/produtos', icon: Package, label: 'Gerenciar Produtos', desc: 'Adicione ou edite produtos', color: '#7c3aed', bg: '#ede9fe' },
    { to: '/notas', icon: FileText, label: 'Notas Fiscais', desc: 'Importe NFC-e pelo QR Code', color: '#0284c7', bg: '#e0f2fe' },
    { to: '/lista-compras', icon: ShoppingCart, label: 'Lista de Compras', desc: 'Veja o que falta comprar', color: '#db2777', bg: '#fce7f3' },
    { to: '/relatorios', icon: BarChart3, label: 'Ver Relatórios', desc: 'Resumo completo do estoque', color: '#d97706', bg: '#fef3c7' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">{today}</div>
          <h1 className="page-title">Olá, bem-vindo!</h1>
        </div>
      </div>

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

      {loading ? <LoadingSpinner text="Carregando informações..." /> : data && (
        <>
          <div className="stats-grid">
            <div className="metric-card highlight">
              <div className="eyebrow">Gasto do mês</div>
              <div className="metric-value" style={{ color: '#ff7a00' }}>{fmt(data.monthlySpend)}</div>
              <div className="metric-note">{data.activeProducts} produtos ativos</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Produtos</div>
              <div className="metric-value">{data.totalProducts}</div>
              <div className="metric-note">cadastrados</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Estoque baixo</div>
              <div className="metric-value" style={{ color: '#d97706' }}>{data.lowStockProducts}</div>
              <div className="metric-note">abaixo do mínimo</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Notas pendentes</div>
              <div className="metric-value" style={{ color: '#dc2626' }}>{data.pendingInvoices}</div>
              <div className="metric-note">de {data.totalInvoices} notas</div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Movimentações recentes</h2>
            {(data.recentMovements || []).length === 0 ? (
              <p className="metric-note" style={{ padding: '16px 0' }}>Nenhuma movimentação ainda.</p>
            ) : data.recentMovements.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e6e4dc' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.productName}</div>
                  <div className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0 }}>{typeLabel[m.type] || m.type} · {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <strong>{['EXIT', 'USED', 'DISCARDED'].includes(m.type) ? '-' : '+'}{m.quantity}</strong>
              </div>
            ))}
            <Link to="/historico" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Ver histórico</Link>
          </div>

          {data.lowStockProducts > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Atenção!</strong> {data.lowStockProducts} produto(s) estão com estoque abaixo do mínimo.
                <Link to="/relatorios" style={{ marginLeft: 8, color: '#92400e', fontWeight: 600 }}>Ver detalhes →</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
