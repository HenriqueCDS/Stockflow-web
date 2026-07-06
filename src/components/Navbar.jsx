import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, History, BarChart3, Building2, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/entrada', icon: PackagePlus, label: 'Dar Entrada' },
  { to: '/saida', icon: PackageMinus, label: 'Registrar Saída' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/empresa', icon: Building2, label: 'Empresa' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  const NavContent = () => (
    <>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#2563eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Stockflow</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{user?.name || 'Controle de estoque'}</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#2563eb' : '#475569',
              background: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s'
            })}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '12px 14px', borderRadius: 10, border: 'none', background: 'transparent',
          fontSize: 15, fontWeight: 500, color: '#dc2626'
        }}>
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240, height: '100vh', background: 'white',
        borderRight: '1px solid #e2e8f0', position: 'fixed', top: 0, left: 0,
        overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column'
      }} className="desktop-nav">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between'
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Stockflow</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', padding: 4 }}>
          {mobileOpen ? <X size={24} color="#1e293b" /> : <Menu size={24} color="#1e293b" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 260, height: '100%', background: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
