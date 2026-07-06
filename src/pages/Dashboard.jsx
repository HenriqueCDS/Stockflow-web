import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PackagePlus, PackageMinus, AlertTriangle, BarChart3, DollarSign, ArrowUpCircle, ArrowDownCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { dashboardApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const typeIcons = {
  ENTRY: { Icon: ArrowUpCircle, color: '#16a34a' },
  EXIT: { Icon: ArrowDownCircle, color: '#dc2626' },
  ADJUSTMENT: { Icon: RefreshCw, color: '#2563eb' },
  RETURN: { Icon: RotateCcw, color: '#7c3aed' }
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const quickActions = [
    { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada no Estoque', desc: 'Registre a chegada de produtos', color: '#16a34a', bg: '#dcfce7' },
    { to: '/saida', icon: PackageMinus, label: 'Registrar Saída', desc: 'Informe produtos que saíram', color: '#2563eb', bg: '#dbeafe' },
    { to: '/produtos', icon: Package, label: 'Gerenciar Produtos', desc: 'Adicione ou edite produtos', color: '#7c3aed', bg: '#ede9fe' },
    { to: '/relatorios', icon: BarChart3, label: 'Ver Relatórios', desc: 'Resumo completo do estoque', color: '#d97706', bg: '#fef3c7' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bem-vindo!</h1>
          <p className="page-subtitle">O que você precisa fazer hoje?</p>
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

      {/* Stats */}
      {loading ? <LoadingSpinner text="Carregando informações..." /> : data && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Resumo do Estoque</h2>
          <div className="stats-grid">
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
