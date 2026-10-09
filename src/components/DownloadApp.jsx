import React, { useEffect, useRef, useState } from 'react'
import { Download, Smartphone, FileDown } from 'lucide-react'
import QRCode from 'qrcode'

const PLAY_URL = import.meta.env.VITE_PLAY_STORE_URL || ''
const APK_URL = import.meta.env.VITE_APK_URL || ''

// Botão "Baixar aplicativo": só aparece se ao menos uma URL estiver configurada.
export default function DownloadApp({ style }) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState('')
  const ref = useRef(null)
  const target = PLAY_URL || APK_URL

  useEffect(() => {
    if (!open || !target) return
    QRCode.toDataURL(target, { margin: 1, width: 160 }).then(setQr).catch(() => setQr(''))
  }, [open, target])

  useEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && setOpen(false)
    const onClick = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (!PLAY_URL && !APK_URL) return null

  return (
    <div className="menu-wrap" ref={ref} style={style}>
      <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 14 }} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Download size={16} /> Baixar aplicativo
      </button>
      {open && (
        <div className="menu-pop" role="dialog" aria-label="Baixar aplicativo" style={{ minWidth: 220, padding: 12 }}>
          {PLAY_URL && <a href={PLAY_URL} target="_blank" rel="noopener noreferrer"><Smartphone size={15} /> Google Play</a>}
          {APK_URL && <a href={APK_URL} download><FileDown size={15} /> Arquivo APK</a>}
          {qr && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <img src={qr} alt="QR Code para baixar o aplicativo" width={160} height={160} style={{ borderRadius: 8, background: '#fff' }} />
              <div className="metric-note">Aponte a câmera do celular</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
