import React, { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: { bg: '#dcfce7', border: '#86efac', color: '#166534', Icon: CheckCircle },
    error: { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', Icon: XCircle }
  }
  const { bg, border, color, Icon } = styles[type]

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, border: `1px solid ${border}`, color,
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      maxWidth: 380, animation: 'slideIn 0.2s ease',
      fontSize: 15, fontWeight: 500
    }}>
      <Icon size={22} strokeWidth={2.5} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color, padding: 2, opacity: 0.7 }}>
        <X size={18} />
      </button>
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}
