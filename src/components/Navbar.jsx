import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, History, BarChart3, FileText, ShoppingCart, Home, Menu, X, LogOut, ScanLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoIcon from '../assets/logo/homestock-logo-192.png'

const navGroups = [
  { label: null, items: [
    { to: '/', icon: LayoutDashboard, label: 'Início' },
    { to: '/produtos', icon: Package, label: 'Estoque' },
  ] },
  { label: 'Operação', items: [
    { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada' },
    { to: '/saida', icon: PackageMinus, label: 'Registrar Saída' },
    { to: '/historico', icon: History, label: 'Histórico' },
  ] },
  { label: 'Compras', items: [
    { to: '/lista-compras', icon: ShoppingCart, label: 'Lista de Compras' },
    { to: '/notas', icon: FileText, label: 'Notas Fiscais' },
  ] },
  { label: 'Análise', items: [
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  ] },
  { label: null, items: [
    { to: '/casa', icon: Home, label: 'Casa' },
  ] },
]

const Logo = ({ size = 32 }) => (
  <img src={logoIcon} alt="HomeStock" width={size} height={size} style={{ borderRadius: size * 0.22, display: 'block' }} />
)

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const scanInvoice = () => {
    setMobileOpen(false)
    navigate('/notas')
  }

  const NavContent = () => (
    <>
      <div style={{ padding: '22px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>HomeStock</div>
        </div>
      </div>

      <div style={{ padding: '0 12px 8px' }}>
        <button className="btn btn-primary" onClick={scanInvoice} style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}>
          <ScanLine size={18} /> Escanear nota
        </button>
      </div>

      <nav style={{ padding: '4px 12px', flex: 1 }} aria-label="Principal">
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginTop: gi === 0 ? 0 : 10 }}>
            {group.label && <div className="eyebrow" style={{ padding: '6px 12px', fontSize: 10 }}>{group.label}</div>}
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
                className="sidebar-link"
                style={({ isActive }) => ({
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--primary-ink)' : 'var(--text-2)',
                  background: isActive ? 'var(--primary-soft)' : 'transparent',
                  boxShadow: isActive ? 'inset 3px 0 0 var(--primary)' : 'none',
                  transition: 'all 0.15s'
                })}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <NavLink to="/perfil" onClick={() => setMobileOpen(false)}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email || 'Minha conta'}</div>
            <div className="eyebrow" style={{ fontSize: 10 }}>Ver perfil</div>
          </div>
        </NavLink>
        <button onClick={logout} title="Sair" aria-label="Sair" style={{ background: 'none', border: 'none', padding: 6, color: 'var(--muted)' }}>
          <LogOut size={18} />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240, height: '100vh', background: 'var(--sidebar)',
        borderRight: '1px solid var(--border)', position: 'fixed', top: 0, left: 0,
        overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column'
      }} className="desktop-nav">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--sidebar)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between'
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={30} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>HomeStock</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} style={{ background: 'none', border: 'none', padding: 4, color: 'var(--text)' }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 260, height: '100%', background: 'var(--sidebar)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <NavContent />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { margin-top: 60px; }
        }
      `}</style>
    </>
  )
}
