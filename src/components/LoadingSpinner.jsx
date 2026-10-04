import React from 'react'

export default function LoadingSpinner({ text = 'Carregando...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 16 }}>
      <div style={{
        width: 44, height: 44, border: '4px solid #e6e4dc',
        borderTopColor: '#ff7a00', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: '#6b6b66', fontSize: 15 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
