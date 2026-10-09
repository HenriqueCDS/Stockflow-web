import React, { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose, action }) {
  // Erro não fecha sozinho: a pessoa precisa conseguir ler e agir.
  useEffect(() => {
    if (type === 'error') return
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose, type])

  const styles = {
    success: { bg: 'var(--good-soft)', border: 'var(--good)', color: 'var(--good)', Icon: CheckCircle },
    error: { bg: 'var(--bad-soft)', border: 'var(--bad)', color: 'var(--bad)', Icon: XCircle }
  }
  const { bg, border, color, Icon } = styles[type] || styles.success

  return (
    <div role={type === 'error' ? 'alert' : 'status'} style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--surface)', backgroundImage: `linear-gradient(${bg}, ${bg})`,
      border: `1px solid ${border}`, color,
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--shadow-md)',
      maxWidth: 380, animation: 'slideIn 0.2s ease',
      fontSize: 15, fontWeight: 500
    }}>
      <Icon size={22} strokeWidth={2.5} />
      <span style={{ flex: 1 }}>{message}</span>
      {action && (
        <button onClick={() => { action.onClick(); onClose() }}
          style={{ background: 'none', border: 'none', color, fontWeight: 700, textDecoration: 'underline', padding: 2 }}>
          {action.label}
        </button>
      )}
      <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', color, padding: 2, opacity: 0.7 }}>
        <X size={18} />
      </button>
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}
