import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, TrendingDown, Package, RefreshCw, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Activity, Scale } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { dashboardApi, productApi, stockApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Schibsted Grotesk', 'Inter', sans-serif"
ChartJS.defaults.color = '#6b6b66'

const COLORS = {
  primary: '#ff7a00', success: '#16a34a', danger: '#dc2626', warning: '#d97706',
  info: '#0284c7', neutral: '#9a9a92', grid: '#e6e4dc'
}
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TYPES = {
  ENTRY: { label: 'Entradas', color: COLORS.success },
  RETURN: { label: 'Devoluções', color: COLORS.info },
  ADJUSTMENT: { label: 'Ajustes', color: COLORS.primary },
  USED: { label: 'Usei', color: '#2563eb' },
  DISCARDED: { label: 'Descartei', color: '#991b1b' },
  EXIT: { label: 'Saídas', color: COLORS.danger }
}
const CONSUMPTION_TYPES = ['EXIT', 'USED', 'DISCARDED']

const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNumber = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
    tooltip: { backgroundColor: '#1a1a1a', padding: 10, cornerRadius: 8 }
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: COLORS.grid }, border: { display: false } }
  }
}

const emptyMonth = () => ({ entries: 0, exits: 0, count: 0 })

function ChartCard({ title, subtitle, height = 280, children }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
      {subtitle && <p className="metric-note" style={{ marginBottom: 12 }}>{subtitle}</p>}
      <div style={{ height, marginTop: subtitle ? 0 : 12 }}>{children}</div>
    </div>
  )
}

function Kpi({ icon: Icon, color, bg, label, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}><Icon size={26} color={color} /></div>
      <div className="stat-info"><h3 style={{ color }}>{value}</h3><p>{label}</p>{note && <p style={{ fontSize: 12, opacity: 0.8 }}>{note}</p>}</div>
    </div>
  )
}

function Tabs({ tab, setTab }) {
  const items = [['overview', 'Visão geral'], ['monthly', 'Período por meses']]
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
      {items.map(([key, label]) => (
        <button key={key} onClick={() => setTab(key)}
          style={{
            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
            color: tab === key ? COLORS.primary : 'var(--text-muted)',
            borderBottom: `3px solid ${tab === key ? COLORS.primary : 'transparent'}`, marginBottom: -1
          }}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Overview({ report }) {
  const healthy = Math.max(report.activeProducts - report.lowStock.length - report.outOfStock.length, 0)

  return (
    <>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <Kpi icon={Package} color={COLORS.primary} bg="#fbeadb" label="Total de produtos" value={report.totalProducts} />
        <Kpi icon={Package} color={COLORS.success} bg="#dcfce7" label="Produtos ativos" value={report.activeProducts} />
        <Kpi icon={AlertTriangle} color={COLORS.warning} bg="#fef3c7" label="Estoque baixo" value={report.lowStock.length} />
        <Kpi icon={TrendingDown} color={COLORS.danger} bg="#fee2e2" label="Sem estoque" value={report.outOfStock.length} />
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', color: 'white', borderRadius: 16 }}>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>GASTO DO MÊS</div>
        <div style={{ fontSize: 42, fontWeight: 800 }}>{fmtCurrency(report.monthlySpend)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        <ChartCard title="Saúde do estoque" subtitle="Produtos ativos por situação">
          <Doughnut
            data={{
              labels: ['Saudável', 'Estoque baixo', 'Sem estoque'],
              datasets: [{ data: [healthy, report.lowStock.length, report.outOfStock.length], backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger], borderWidth: 2, borderColor: '#fff' }]
            }}
            options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: baseOptions.plugins }}
          />
        </ChartCard>
      </div>

      {report.lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={20} color={COLORS.warning} />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos com Estoque Baixo</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.lowStock.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#92400e' }}>Mínimo: {p.minimumStock} unidades</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.warning }}>{p.currentStock}</div>
                  <div style={{ fontSize: 12, color: '#92400e' }}>disponíveis</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.outOfStock.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingDown size={20} color={COLORS.danger} />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Produtos Sem Estoque</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.outOfStock.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <span className="badge badge-danger">Sem estoque</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Monthly({ movements }) {
  const now = new Date()
  const years = useMemo(() => {
    const set = new Set([now.getFullYear()])
    movements.forEach(m => set.add(new Date(m.createdAt).getFullYear()))
    return [...set].sort((a, b) => a - b)
  }, [movements])

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(null) // null = ano inteiro

  const yearMovs = useMemo(() => movements.filter(m => new Date(m.createdAt).getFullYear() === year), [movements, year])

  const monthly = useMemo(() => {
    const rows = Array.from({ length: 12 }, emptyMonth)
    yearMovs.forEach(m => {
      const r = rows[new Date(m.createdAt).getMonth()]
      const q = Number(m.quantity) || 0
      r.count++
      if (CONSUMPTION_TYPES.includes(m.type)) r.exits += q
      else if (m.type === 'ENTRY' || m.type === 'RETURN') r.entries += q
    })
    return rows
  }, [yearMovs])

  // Recorte exibido nos KPIs/rankings: mês selecionado ou ano todo
  const scoped = useMemo(
    () => month === null ? yearMovs : yearMovs.filter(m => new Date(m.createdAt).getMonth() === month),
    [yearMovs, month]
  )

  const totals = useMemo(() => {
    const t = { entries: 0, exits: 0, count: scoped.length }
    const byType = { ENTRY: 0, RETURN: 0, ADJUSTMENT: 0, USED: 0, DISCARDED: 0, EXIT: 0 }
    const exitsByProduct = {}
    scoped.forEach(m => {
      const q = Number(m.quantity) || 0
      if (m.type in byType) byType[m.type] += q
      if (CONSUMPTION_TYPES.includes(m.type)) {
        t.exits += q
        exitsByProduct[m.productName] = (exitsByProduct[m.productName] || 0) + q
      } else if (m.type === 'ENTRY' || m.type === 'RETURN') t.entries += q
    })
    const topExits = Object.entries(exitsByProduct).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return { ...t, byType, topExits }
  }, [scoped])

  // Variação do consumo (saídas) vs. mês anterior, quando um mês está selecionado
  const exitVariation = useMemo(() => {
    if (month === null || month === 0) return null
    const prev = monthly[month - 1].exits
    if (prev === 0) return null
    return ((monthly[month].exits - prev) / prev) * 100
  }, [month, monthly])

  const balance = totals.entries - totals.exits
  const activeMonths = monthly.filter(m => m.count > 0).length
  const avgExits = activeMonths ? monthly.reduce((s, m) => s + m.exits, 0) / activeMonths : 0
  const peak = monthly.reduce((best, m, i) => (m.exits > monthly[best].exits ? i : best), 0)
  const periodLabel = month === null ? `${year}` : `${MONTHS_FULL[month]} de ${year}`

  const navBtn = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', color: 'var(--text)' }
  const hasYearData = yearMovs.length > 0

  return (
    <>
      {/* Seletor de período */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button style={navBtn} onClick={() => { setYear(y => y - 1); setMonth(null) }} disabled={year <= years[0]} aria-label="Ano anterior"><ChevronLeft size={16} /></button>
          <strong style={{ fontSize: 18, minWidth: 52, textAlign: 'center' }}>{year}</strong>
          <button style={navBtn} onClick={() => { setYear(y => y + 1); setMonth(null) }} disabled={year >= years[years.length - 1]} aria-label="Próximo ano"><ChevronRight size={16} /></button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 8 }}>
            {[null, ...MONTHS.keys()].map(i => (
              <button key={i ?? 'all'} className="btn" onClick={() => setMonth(i)}
                style={{ padding: '6px 12px', fontSize: 13, border: 'none',
                  background: month === i ? COLORS.primary : '#f1f0ea', color: month === i ? 'white' : '#4a4a46' }}>
                {i === null ? 'Ano todo' : MONTHS[i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasYearData ? (
        <div className="card empty-state"><Activity size={48} /><p>Nenhuma movimentação registrada em {year}</p></div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <Kpi icon={ArrowUpCircle} color={COLORS.success} bg="#dcfce7" label={`Entradas · ${periodLabel}`} value={fmtNumber(totals.entries)} note="unidades (entradas + devoluções)" />
            <Kpi icon={ArrowDownCircle} color={COLORS.danger} bg="#fee2e2" label={`Saídas · ${periodLabel}`} value={fmtNumber(totals.exits)}
              note={exitVariation !== null ? `${exitVariation >= 0 ? '▲' : '▼'} ${Math.abs(exitVariation).toFixed(1)}% vs. mês anterior` : 'unidades consumidas'} />
            <Kpi icon={Scale} color={balance >= 0 ? COLORS.info : COLORS.warning} bg={balance >= 0 ? '#e0f2fe' : '#fef3c7'} label="Saldo do período" value={`${balance > 0 ? '+' : ''}${fmtNumber(balance)}`} note={balance >= 0 ? 'estoque cresceu' : 'estoque encolheu'} />
            <Kpi icon={Activity} color={COLORS.primary} bg="#fbeadb" label="Movimentações" value={totals.count}
              note={month === null ? `média de ${fmtNumber(avgExits)} saídas/mês` : undefined} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
            <ChartCard title={`Entradas × Saídas por mês · ${year}`} subtitle="Clique em uma barra para detalhar o mês" height={300}>
              <Bar
                data={{
                  labels: MONTHS,
                  datasets: [
                    { label: 'Entradas', data: monthly.map(m => m.entries), backgroundColor: COLORS.success, borderRadius: 4 },
                    { label: 'Saídas', data: monthly.map(m => m.exits), backgroundColor: COLORS.danger, borderRadius: 4 }
                  ]
                }}
                options={{ ...baseOptions, onClick: (_, els) => { if (els.length) setMonth(els[0].index) } }}
              />
            </ChartCard>

            <ChartCard title="Saldo mensal e consumo" subtitle={`Pico de saídas: ${monthly[peak].exits > 0 ? MONTHS_FULL[peak] : '—'}`} height={300}>
              <Line
                data={{
                  labels: MONTHS,
                  datasets: [
                    { label: 'Saldo (entradas − saídas)', data: monthly.map(m => m.entries - m.exits), borderColor: COLORS.info, backgroundColor: 'rgba(2,132,199,0.12)', fill: true, cubicInterpolationMode: 'monotone', pointRadius: 3 },
                    { label: 'Saídas', data: monthly.map(m => m.exits), borderColor: COLORS.danger, borderDash: [5, 4], cubicInterpolationMode: 'monotone', pointRadius: 3, fill: false }
                  ]
                }}
                options={{ ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, beginAtZero: false } } }}
              />
            </ChartCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
            <ChartCard title="Mix de movimentações" subtitle={periodLabel}>
              <Doughnut
                data={{
                  labels: Object.values(TYPES).map(t => t.label),
                  datasets: [{ data: Object.keys(TYPES).map(k => totals.byType[k]), backgroundColor: Object.values(TYPES).map(t => t.color), borderWidth: 2, borderColor: '#fff' }]
                }}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: baseOptions.plugins }}
              />
            </ChartCard>
            <ChartCard title="Produtos mais consumidos" subtitle={`Saídas em ${periodLabel}`}>
              {totals.topExits.length === 0 ? <p className="metric-note">Nenhuma saída no período.</p> : (
                <Bar
                  data={{
                    labels: totals.topExits.map(([n]) => n.length > 22 ? n.slice(0, 21) + '…' : n),
                    datasets: [{ label: 'Unidades', data: totals.topExits.map(([, q]) => q), backgroundColor: COLORS.danger, borderRadius: 6 }]
                  }}
                  options={{ ...baseOptions, indexAxis: 'y', plugins: { ...baseOptions.plugins, legend: { display: false } }, scales: { x: baseOptions.scales.y, y: { grid: { display: false } } } }}
                />
              )}
            </ChartCard>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px 12px' }}><h2 style={{ fontSize: 16, fontWeight: 700 }}>Resumo mensal · {year}</h2></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Variação saídas</th><th>Mov.</th></tr>
                </thead>
                <tbody>
                  {monthly.map((m, i) => {
                    const prev = i > 0 ? monthly[i - 1].exits : 0
                    const v = prev > 0 && m.count > 0 ? ((m.exits - prev) / prev) * 100 : null
                    const bal = m.entries - m.exits
                    return (
                      <tr key={i} onClick={() => setMonth(i)} style={{ cursor: 'pointer', background: month === i ? '#fbeadb' : undefined, opacity: m.count ? 1 : 0.45 }}>
                        <td style={{ fontWeight: 600 }}>{MONTHS_FULL[i]}</td>
                        <td style={{ color: COLORS.success, fontWeight: 600 }}>{fmtNumber(m.entries)}</td>
                        <td style={{ color: COLORS.danger, fontWeight: 600 }}>{fmtNumber(m.exits)}</td>
                        <td style={{ fontWeight: 700, color: bal >= 0 ? COLORS.info : COLORS.warning }}>{bal > 0 ? '+' : ''}{fmtNumber(bal)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{v === null ? '—' : <span style={{ color: v > 0 ? COLORS.danger : COLORS.success }}>{v > 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%</span>}</td>
                        <td>{m.count}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800 }}>
                    <td>Total {year}</td>
                    <td>{fmtNumber(monthly.reduce((s, m) => s + m.entries, 0))}</td>
                    <td>{fmtNumber(monthly.reduce((s, m) => s + m.exits, 0))}</td>
                    <td>{fmtNumber(monthly.reduce((s, m) => s + m.entries - m.exits, 0))}</td>
                    <td />
                    <td>{yearMovs.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default function Reports({ showToast }) {
  const [report, setReport] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  // Busca todas as páginas de movimentações (limite de 20 páginas); falha aqui não derruba o relatório
  const loadMovements = async () => {
    try {
      const first = await stockApi.list()
      const all = [...(first.content || [])]
      const pages = Math.min(first.totalPages || 1, 20)
      for (let page = 1; page < pages; page++) {
        const next = await stockApi.list({ page })
        all.push(...(next.content || []))
      }
      return all
    } catch {
      return []
    }
  }

  const load = () => {
    setLoading(true)
    Promise.all([dashboardApi.get(), productApi.list({ active: true, size: 200, sort: 'name' }), loadMovements()])
      .then(([dashboardData, productsData, movs]) => {
        const products = productsData.content || []
        setMovements(movs)
        setReport({
          ...dashboardData,
          lowStock: products.filter(x => x.belowMinimum && Number(x.currentStock) > 0),
          outOfStock: products.filter(x => Number(x.currentStock) <= 0)
        })
      })
      .catch(() => showToast('Erro ao carregar relatório', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
          <Tabs tab={tab} setTab={setTab} />
          {tab === 'overview' ? <Overview report={report} /> : <Monthly movements={movements} />}
        </>
      )}
      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
