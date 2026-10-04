import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PackagePlus, PackageMinus, AlertTriangle, BarChart3, FileText } from 'lucide-react'
import { dashboardApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeLabel = { ENTRY: 'Entrada', EXIT: 'Saída', ADJUSTMENT: 'Ajuste', RETURN: 'Devolução' }

export default function Dashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(r => setReport(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

      {loading ? <LoadingSpinner text="Carregando informações..." /> : report && (
        <>
          <div className="stats-grid">
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
                <Link to="/relatorios" style={{ marginLeft: 8, color: '#92400e', fontWeight: 600 }}>Ver detalhes →</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
