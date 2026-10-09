import React, { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

// items: [{ label, icon: Icon, onClick, danger, hidden }]
export default function ActionMenu({ items, label = 'Mais ações' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  const visible = items.filter(i => !i.hidden)
  if (visible.length === 0) return null

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="btn btn-outline" style={{ padding: '6px 10px' }} aria-haspopup="menu" aria-expanded={open}
        aria-label={label} onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          {visible.map(({ label: text, icon: Icon, onClick, danger }) => (
            <button key={text} role="menuitem" className={danger ? 'danger' : ''}
              onClick={() => { setOpen(false); onClick() }}>
              {Icon && <Icon size={15} />} {text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
