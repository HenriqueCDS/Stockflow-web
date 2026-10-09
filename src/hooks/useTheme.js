import { useCallback, useEffect, useState } from 'react'

const KEY = 'homestock-theme'

function read() {
  try { return localStorage.getItem(KEY) || 'system' } catch { return 'system' }
}

export function applyTheme(mode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export default function useTheme() {
  const [mode, setMode] = useState(read)

  const change = useCallback(next => {
    try { localStorage.setItem(KEY, next) } catch { /* sem storage */ }
    setMode(next)
  }, [])

  useEffect(() => {
    applyTheme(mode)
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  return [mode, change]
}
