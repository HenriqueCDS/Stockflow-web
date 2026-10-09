import React, { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) {
  const cancelRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') return onCancel()
      if (e.key !== 'Tab') return
      const items = dialogRef.current?.querySelectorAll('button')
      if (!items?.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    cancelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'var(--overlay)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title"
        onClick={e => e.stopPropagation()} style={{
          background: 'var(--surface)', borderRadius: 16, padding: 32,
          maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: danger ? 'var(--bad-soft)' : 'var(--warn-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color={danger ? 'var(--bad)' : 'var(--warn)'} />
          </div>
          <h3 id="confirm-title" style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
        </div>
        <p style={{ color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button ref={cancelRef} className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
