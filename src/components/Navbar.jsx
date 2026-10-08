import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, History, BarChart3, FileText, ShoppingCart, Home, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/produtos', icon: Package, label: 'Estoque' },
  { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada' },
  { to: '/saida', icon: PackageMinus, label: 'Registrar Saída' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/notas', icon: FileText, label: 'Notas Fiscais' },
  { to: '/lista-compras', icon: ShoppingCart, label: 'Lista de Compras' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/casa', icon: Home, label: 'Casa' },
]

const Logo = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, background: '#ff7a00', borderRadius: size * 0.28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', fontWeight: 700, fontSize: size * 0.45, color: '#0d0d0f'
  }}>H</div>
)

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  const NavContent = () => (
    <>
      <div style={{ padding: '22px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0d0d0f' }}>HomeStock</div>
        </div>
      </div>

      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
            className="sidebar-link"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ff7a00' : '#4a4a46',
              background: isActive ? '#fff1e4' : 'transparent',
              transition: 'all 0.15s'
            })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid #e6e4dc', display: 'flex', alignItems: 'center', gap: 10 }}>
        <NavLink to="/perfil" onClick={() => setMobileOpen(false)}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e6e4dc', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email || 'Minha conta'}</div>
            <div className="eyebrow" style={{ fontSize: 10 }}>Ver perfil</div>
          </div>
        </NavLink>
        <button onClick={logout} title="Sair" aria-label="Sair" style={{ background: 'none', border: 'none', padding: 6, color: '#6b6b66' }}>
          <LogOut size={18} />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240, height: '100vh', background: '#fbfbf8',
        borderRight: '1px solid #e6e4dc', position: 'fixed', top: 0, left: 0,
        overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column'
      }} className="desktop-nav">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#fbfbf8', borderBottom: '1px solid #e6e4dc',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between'
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={30} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>HomeStock</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', padding: 4 }}>
          {mobileOpen ? <X size={24} color="#1a1a1a" /> : <Menu size={24} color="#1a1a1a" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 260, height: '100%', background: '#fbfbf8', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
