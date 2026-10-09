import React from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function ErrorState({ title = 'Não foi possível carregar', text, onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-icon error"><WifiOff size={26} strokeWidth={1.5} /></div>
      <strong>{title}</strong>
      <p>{text || 'Verifique sua conexão. Seus dados estão salvos.'}</p>
      {onRetry && <button className="btn btn-primary" onClick={onRetry}><RefreshCw size={16} /> Tentar de novo</button>}
    </div>
  )
}
