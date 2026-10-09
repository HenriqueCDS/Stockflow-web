import React from 'react'

export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} strokeWidth={1.5} /></div>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  )
}
